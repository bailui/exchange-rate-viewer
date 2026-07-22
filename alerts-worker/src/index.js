const RATE_SOURCE = 'https://api.exchangerate.fun/latest?base=CNY'
const RESEND_ENDPOINT = 'https://api.resend.com/emails'
const CURRENCY_PATTERN = /^[A-Z]{3}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default {
  async fetch(request, env) {
    try {
      return await routeRequest(request, env)
    } catch (error) {
      console.error('request_failed', error)
      return json({ error: '服务暂时不可用，请稍后重试' }, 500, request, env)
    }
  },

  async scheduled(_controller, env, context) {
    context.waitUntil(checkAlerts(env))
  },
}

async function routeRequest(request, env) {
  const url = new URL(request.url)

  if (url.pathname === '/health') {
    return json({ ok: true, service: 'bailu-rate-alerts', emailConfigured: Boolean(env.RESEND_API_KEY) }, 200, request, env)
  }

  if (url.pathname === '/verify' && request.method === 'GET') return verifyEmail(url, env)
  if (url.pathname === '/unsubscribe' && request.method === 'GET') return unsubscribe(url, env)

  if (url.pathname.startsWith('/api/')) {
    if (!isAllowedOrigin(request, env)) return json({ error: '不允许的来源' }, 403, request, env)
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request, env) })
  }

  if (url.pathname === '/api/alerts' && request.method === 'POST') return createAlert(request, env)

  const match = url.pathname.match(/^\/api\/alerts\/([a-f0-9-]{36})$/)
  if (match && request.method === 'GET') return getAlert(request, env, match[1])
  if (match && request.method === 'PATCH') return updateAlert(request, env, match[1])
  if (match && request.method === 'DELETE') return deleteAlert(request, env, match[1])

  return json({ error: '未找到接口' }, 404, request, env)
}

async function createAlert(request, env) {
  if (!env.RESEND_API_KEY || !env.HMAC_SECRET) {
    return json({ error: '邮件服务尚未完成配置' }, 503, request, env)
  }

  const body = await request.json().catch(() => null)
  const email = String(body?.email || '').trim().toLowerCase()
  const from = String(body?.from || '').toUpperCase()
  const to = String(body?.to || '').toUpperCase()
  const direction = body?.direction
  const target = Number(body?.target)

  if (!EMAIL_PATTERN.test(email) || email.length > 160) return json({ error: '请输入有效的邮箱地址' }, 400, request, env)
  if (!CURRENCY_PATTERN.test(from) || !CURRENCY_PATTERN.test(to) || from === to) return json({ error: '币种设置不正确' }, 400, request, env)
  if (!['above', 'below'].includes(direction) || !Number.isFinite(target) || target <= 0 || target > 1e15) return json({ error: '提醒条件不正确' }, 400, request, env)

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown'
  const ipHash = await hash(`${env.HMAC_SECRET}:${ip}`)
  const rateLimits = await env.DB.batch([
    env.DB.prepare("SELECT COUNT(*) AS count FROM alerts WHERE email = ? AND unixepoch(created_at) > unixepoch('now', '-1 hour')").bind(email),
    env.DB.prepare("SELECT COUNT(*) AS count FROM alerts WHERE ip_hash = ? AND unixepoch(created_at) > unixepoch('now', '-1 day')").bind(ipHash),
  ])
  if ((rateLimits[0].results?.[0]?.count || 0) >= 5 || (rateLimits[1].results?.[0]?.count || 0) >= 20) {
    return json({ error: '创建提醒过于频繁，请稍后再试' }, 429, request, env)
  }

  const id = crypto.randomUUID()
  const manageToken = randomToken()
  const verifyToken = randomToken()
  const createdAt = new Date().toISOString()

  await env.DB.prepare(`INSERT INTO alerts (
    id, manage_token_hash, verify_token_hash, email, from_currency, to_currency,
    direction, target, status, enabled, ip_hash, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 1, ?, ?)`)
    .bind(id, await hash(manageToken), await hash(verifyToken), email, from, to, direction, target, ipHash, createdAt)
    .run()

  try {
    const verificationUrl = `${new URL(request.url).origin}/verify?token=${encodeURIComponent(verifyToken)}`
    await sendEmail(env, {
      to: email,
      subject: `验证你的 ${from}/${to} 汇率提醒`,
      html: verificationEmail({ from, to, direction, target, verificationUrl }),
      text: `请验证你的汇率提醒：${verificationUrl}`,
      idempotencyKey: `verify-${id}`,
    })
  } catch (error) {
    await env.DB.prepare('DELETE FROM alerts WHERE id = ?').bind(id).run()
    console.error('verification_email_failed', error)
    return json({ error: '验证邮件发送失败，请检查邮箱后重试' }, 502, request, env)
  }

  return json({
    id,
    manageToken,
    status: 'pending',
    message: '验证邮件已发送，请打开邮箱完成验证',
    createdAt,
  }, 201, request, env)
}

async function verifyEmail(url, env) {
  const token = url.searchParams.get('token') || ''
  if (token.length < 20) return htmlPage('验证链接无效', '请返回网站重新创建汇率提醒。', env.SITE_URL)

  const result = await env.DB.prepare("UPDATE alerts SET status = 'active', verified_at = ?, verify_token_hash = NULL WHERE verify_token_hash = ? AND status = 'pending' AND unixepoch(created_at) > unixepoch('now', '-24 hours')")
    .bind(new Date().toISOString(), await hash(token))
    .run()
  if (!result.meta.changes) return htmlPage('链接已失效或已验证', '如果提醒已经验证，无需重复操作。', `${env.SITE_URL}/alerts`)

  return Response.redirect(`${env.SITE_URL}/alerts?verified=1`, 302)
}

async function getAlert(request, env, id) {
  const tokenHash = await bearerHash(request)
  if (!tokenHash) return json({ error: '缺少管理凭证' }, 401, request, env)
  const alert = await env.DB.prepare(`SELECT id, email, from_currency, to_currency, direction, target,
    status, enabled, last_rate, last_checked_at, last_notified_at, created_at
    FROM alerts WHERE id = ? AND manage_token_hash = ?`).bind(id, tokenHash).first()
  if (!alert) return json({ error: '提醒不存在' }, 404, request, env)
  return json(publicAlert(alert), 200, request, env)
}

async function updateAlert(request, env, id) {
  const tokenHash = await bearerHash(request)
  const body = await request.json().catch(() => null)
  if (!tokenHash || typeof body?.enabled !== 'boolean') return json({ error: '请求不正确' }, 400, request, env)
  const status = body.enabled ? 'active' : 'paused'
  const result = await env.DB.prepare('UPDATE alerts SET enabled = ?, status = ? WHERE id = ? AND manage_token_hash = ? AND status != \'pending\'')
    .bind(body.enabled ? 1 : 0, status, id, tokenHash).run()
  if (!result.meta.changes) return json({ error: '请先验证邮箱，或检查提醒是否存在' }, 409, request, env)
  return json({ id, enabled: body.enabled, status }, 200, request, env)
}

async function deleteAlert(request, env, id) {
  const tokenHash = await bearerHash(request)
  if (!tokenHash) return json({ error: '缺少管理凭证' }, 401, request, env)
  const result = await env.DB.prepare('DELETE FROM alerts WHERE id = ? AND manage_token_hash = ?').bind(id, tokenHash).run()
  if (!result.meta.changes) return json({ error: '提醒不存在' }, 404, request, env)
  return new Response(null, { status: 204, headers: corsHeaders(request, env) })
}

async function unsubscribe(url, env) {
  const id = url.searchParams.get('id') || ''
  const signature = url.searchParams.get('sig') || ''
  if (!id || signature !== await sign(id, env.HMAC_SECRET)) return htmlPage('退订链接无效', '请从网站的提醒管理中暂停或删除提醒。', `${env.SITE_URL}/alerts`)
  await env.DB.prepare("UPDATE alerts SET enabled = 0, status = 'paused' WHERE id = ?").bind(id).run()
  return htmlPage('已暂停邮件提醒', '这个汇率提醒不会继续发送邮件，你可以在网站中重新启用。', `${env.SITE_URL}/alerts`)
}

async function checkAlerts(env) {
  await env.DB.prepare("DELETE FROM alerts WHERE status = 'pending' AND unixepoch(created_at) <= unixepoch('now', '-7 days')").run()
  if (!env.RESEND_API_KEY || !env.HMAC_SECRET) return
  const source = await fetch(RATE_SOURCE, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10_000) })
  if (!source.ok) throw new Error(`Rate source returned ${source.status}`)
  const data = await source.json()
  if (!data?.rates || Object.keys(data.rates).length < 100) throw new Error('Rate source returned invalid data')

  const { results } = await env.DB.prepare(`SELECT id, email, from_currency, to_currency, direction,
    target, last_state FROM alerts WHERE status = 'active' AND enabled = 1 LIMIT 500`).all()

  for (const alert of results || []) {
    const current = crossRate(data.rates, alert.from_currency, alert.to_currency)
    if (!Number.isFinite(current)) continue
    const met = alert.direction === 'above' ? current >= alert.target : current <= alert.target
    const checkedAt = new Date().toISOString()

    if (met && !alert.last_state) {
      try {
        const signature = await sign(alert.id, env.HMAC_SECRET)
        await sendEmail(env, {
          to: alert.email,
          subject: `${alert.from_currency}/${alert.to_currency} 已达到目标汇率`,
          html: triggeredEmail({ ...alert, current, unsubscribeUrl: `${env.WORKER_URL || 'https://bailu-rate-alerts.l1181685041.workers.dev'}/unsubscribe?id=${alert.id}&sig=${signature}`, siteUrl: env.SITE_URL }),
          text: `${alert.from_currency}/${alert.to_currency} 当前汇率 ${formatNumber(current)}，已达到目标 ${formatNumber(alert.target)}。`,
          idempotencyKey: `trigger-${alert.id}-${Math.round(Date.now() / 300000)}`,
        })
        await env.DB.prepare('UPDATE alerts SET last_state = 1, last_rate = ?, last_checked_at = ?, last_notified_at = ? WHERE id = ?')
          .bind(current, checkedAt, checkedAt, alert.id).run()
      } catch (error) {
        console.error('trigger_email_failed', alert.id, error)
      }
    } else {
      await env.DB.prepare('UPDATE alerts SET last_state = ?, last_rate = ?, last_checked_at = ? WHERE id = ?')
        .bind(met ? 1 : 0, current, checkedAt, alert.id).run()
    }
  }
}

function crossRate(rates, from, to) {
  const fromRate = from === 'CNY' ? 1 : Number(rates[from])
  const toRate = to === 'CNY' ? 1 : Number(rates[to])
  return fromRate > 0 && toRate > 0 ? toRate / fromRate : NaN
}

async function sendEmail(env, { to, subject, html, text, idempotencyKey }) {
  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({ from: env.FROM_EMAIL, to: [to], subject, html, text }),
  })
  if (!response.ok) throw new Error(`Resend returned ${response.status}: ${await response.text()}`)
  return response.json()
}

function publicAlert(alert) {
  return {
    id: alert.id,
    email: maskEmail(alert.email),
    from: alert.from_currency,
    to: alert.to_currency,
    direction: alert.direction,
    target: alert.target,
    status: alert.status,
    enabled: Boolean(alert.enabled),
    lastRate: alert.last_rate,
    lastCheckedAt: alert.last_checked_at,
    lastNotifiedAt: alert.last_notified_at,
    createdAt: alert.created_at,
  }
}

function verificationEmail({ from, to, direction, target, verificationUrl }) {
  const condition = direction === 'above' ? '达到或高于' : '达到或低于'
  return emailLayout('验证汇率提醒', `<p>你创建了 <strong>${from}/${to}</strong> 汇率提醒。</p><div class="rate">${condition} ${formatNumber(target)}</div><p>点击下面按钮完成邮箱验证，验证后系统会每 5 分钟检查一次。验证链接 24 小时内有效。</p><a class="button" href="${verificationUrl}">验证并开启提醒</a><p class="muted">如果不是你本人操作，请忽略这封邮件。</p>`)
}

function triggeredEmail({ from_currency: from, to_currency: to, direction, target, current, unsubscribeUrl, siteUrl }) {
  const condition = direction === 'above' ? '≥' : '≤'
  return emailLayout('目标汇率已达到', `<p><strong>${from}/${to}</strong> 已达到你设置的条件。</p><div class="rate">当前 ${formatNumber(current)}</div><p>目标条件：${condition} ${formatNumber(target)}</p><a class="button" href="${siteUrl}/alerts">查看汇率提醒</a><p class="muted"><a href="${unsubscribeUrl}">暂停这个邮件提醒</a></p>`)
}

function emailLayout(title, content) {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>body{margin:0;background:#fff7f9;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#2d2328}.wrap{max-width:560px;margin:32px auto;padding:30px;background:#fff;border:1px solid #efdce4;border-radius:18px}.brand{color:#e85d8e;font-weight:800}.rate{margin:20px 0;padding:18px;border-radius:12px;background:#fff1f5;font-size:22px;font-weight:800}.button{display:inline-block;margin:12px 0;padding:12px 20px;border-radius:10px;background:#e85d8e;color:#fff!important;text-decoration:none;font-weight:700}.muted{margin-top:22px;color:#927e87;font-size:12px;line-height:1.6}</style></head><body><div class="wrap"><div class="brand">🦌 白鹿io · 汇率转换</div><h1>${title}</h1>${content}</div></body></html>`
}

function htmlPage(title, message, link) {
  return new Response(emailLayout(title, `<p>${message}</p><a class="button" href="${link}">返回汇率提醒</a>`), { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function hash(value) {
  const data = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function bearerHash(request) {
  const match = request.headers.get('Authorization')?.match(/^Bearer\s+(.+)$/i)
  return match ? hash(match[1]) : null
}

function isAllowedOrigin(request, env) {
  const origin = request.headers.get('Origin')
  return !origin || String(env.ALLOWED_ORIGINS || '').split(',').includes(origin)
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin')
  const allowed = isAllowedOrigin(request, env) && origin ? origin : env.SITE_URL
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function json(body, status, request, env) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(request, env) } })
}

function maskEmail(email) {
  const [name, domain] = email.split('@')
  return `${name.slice(0, 2)}***@${domain}`
}

function formatNumber(value) {
  return Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 6 })
}
