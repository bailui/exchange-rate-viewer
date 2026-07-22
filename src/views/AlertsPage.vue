<template>
  <div class="page-shell alerts-page">
    <header class="page-heading alerts-heading">
      <div>
        <h1 class="page-title">汇率提醒</h1>
        <p class="page-description">邮箱验证后由云端每 5 分钟检查一次，关闭网页也能在达到目标时收到邮件。</p>
      </div>
      <span class="status-pill"><span class="status-dot" /> {{ hasData ? `实时监测 · ${updatedLabel}` : '正在连接数据源' }}</span>
    </header>

    <div v-if="verifiedMessage" class="success-banner" role="status"><CircleCheck />邮箱验证成功，汇率提醒已经开始监测。</div>
    <div v-if="error" class="error-banner" role="alert"><span>{{ error }}</span><button class="secondary-button" @click="refreshAll">重试</button></div>

    <section class="surface-card delivery-explainer" aria-label="邮件提醒工作方式">
      <div class="delivery-title"><div class="delivery-icon"><Message /></div><div><strong>免费邮件提醒</strong><span>Cloudflare 定时检查 + Resend 邮件送达</span></div></div>
      <ol>
        <li><i>1</i><span>填写提醒和邮箱</span></li>
        <li><i>2</i><span>打开邮件完成验证</span></li>
        <li><i>3</i><span>达到目标时自动发信</span></li>
      </ol>
      <span class="free-badge" :class="{ pending: emailHealthLoaded && !emailServiceReady }">{{ emailServiceReady ? '免费运行中' : '邮件通道待开通' }}</span>
    </section>

    <div v-if="emailHealthLoaded && !emailServiceReady" class="service-notice" role="status">
      <Clock />发信域名正在验证中，暂时不能新建邮件提醒；完成 Resend 配置后会自动开放。
    </div>

    <section class="surface-card create-alert-card">
      <div class="section-heading">
        <div><h2 class="section-title">新建邮件提醒</h2><p class="section-note">邮箱只用于发送这一条汇率提醒；每次创建都需要完成验证</p></div>
        <span class="private-badge"><Lock /> 隐私保护</span>
      </div>

      <div class="alert-form-grid">
        <label><span class="form-label">来源币种</span><select v-model="form.from" class="form-control"><option v-for="currency in currencies" :key="`alert-from-${currency.code}`" :value="currency.code">{{ currency.flag }} {{ currency.code }} · {{ currency.name }}</option></select></label>
        <label><span class="form-label">目标币种</span><select v-model="form.to" class="form-control"><option v-for="currency in currencies" :key="`alert-to-${currency.code}`" :value="currency.code">{{ currency.flag }} {{ currency.code }} · {{ currency.name }}</option></select></label>
        <label><span class="form-label">触发条件</span><select v-model="form.direction" class="form-control"><option value="above">达到或高于目标值</option><option value="below">达到或低于目标值</option></select></label>
        <label><span class="form-label">目标汇率</span><input v-model.number="form.target" class="form-control" type="number" min="0" step="any" inputmode="decimal" placeholder="例如 7.0000" /></label>
      </div>

      <div class="email-row">
        <label><span class="form-label">接收提醒的邮箱</span><span class="email-input"><Message /><input v-model.trim="form.email" class="form-control" type="email" inputmode="email" autocomplete="email" placeholder="name@example.com" /></span></label>
        <div class="email-note"><CircleCheck /> 验证后生效，不会重复发送同一轮达标通知</div>
      </div>

      <div class="current-preview">
        <div><span>当前参考汇率</span><strong v-if="formCurrent">1 {{ form.from }} = {{ formatRate(formCurrent, 6) }} {{ form.to }}</strong><strong v-else>等待实时数据</strong></div>
        <button v-if="formCurrent" @click="form.target = Number(formCurrent.toFixed(6))">使用当前值</button>
      </div>

      <div class="form-footer">
        <button class="primary-button" :disabled="!canSubmit || submitting" @click="addAlert"><Loading v-if="submitting" class="is-spinning" /><Plus v-else />{{ submitting ? '正在发送验证邮件' : emailServiceReady ? '添加并发送验证邮件' : '邮件服务配置中' }}</button>
        <span v-if="formError" class="form-error" role="alert">{{ formError }}</span>
        <span v-else-if="formMessage" class="form-success" role="status">{{ formMessage }}</span>
        <span v-else>{{ emailServiceReady ? '邮件验证后，即使关闭网页也会继续监测' : '完成发信域名验证后即可免费使用' }}</span>
      </div>
    </section>

    <section class="alerts-section">
      <div class="section-heading">
        <div><h2 class="section-title">我的提醒</h2><p class="section-note">{{ activeCount }} 条云端监测 · {{ pendingCount }} 条等待邮箱验证</p></div>
        <button v-if="alerts.length" class="secondary-button" :disabled="refreshing || syncing" @click="refreshAll"><Refresh :class="{ 'is-spinning': refreshing || syncing }" />同步状态</button>
      </div>

      <div v-if="!alerts.length" class="surface-card empty-alerts">
        <div class="empty-icon"><Bell /></div>
        <h3>还没有邮件提醒</h3>
        <p>在上方设置目标值并验证邮箱，之后关闭网站也会由云端持续检查。</p>
      </div>

      <div v-else class="alert-list">
        <article v-for="alert in decoratedAlerts" :key="alert.id" class="surface-card alert-item" :class="{ 'is-triggered': alert.met, 'is-disabled': !alert.enabled }">
          <div class="alert-main">
            <div class="pair-flags"><span>{{ getCurrencyMeta(alert.from).flag }}</span><i>→</i><span>{{ getCurrencyMeta(alert.to).flag }}</span></div>
            <div class="pair-info"><h3>{{ alert.from }} / {{ alert.to }}</h3><p>{{ getCurrencyMeta(alert.from).name }}兑换{{ getCurrencyMeta(alert.to).name }}</p></div>
            <span class="alert-status" :class="alert.deliveryTone">
              <Message v-if="alert.remoteStatus === 'active'" /><Clock v-else-if="alert.remoteStatus === 'pending'" /><VideoPause v-else-if="alert.remoteStatus === 'paused'" /><View v-else />
              {{ alert.deliveryLabel }}
            </span>
          </div>

          <div class="alert-values">
            <div><span>当前汇率</span><strong>{{ alert.current ? formatRate(alert.current, 6) : '--' }}</strong></div>
            <div><span>目标条件</span><strong>{{ alert.direction === 'above' ? '≥' : '≤' }} {{ formatRate(alert.target, 6) }}</strong></div>
            <div><span>达标状态</span><strong :class="alert.distanceTone">{{ alert.distanceLabel }}</strong></div>
          </div>

          <div class="delivery-detail">
            <span><Message />{{ alert.email || '旧版本地提醒' }}</span>
            <span v-if="alert.lastNotifiedAt"><CircleCheck />最近发信 {{ formatDateTime(alert.lastNotifiedAt) }}</span>
            <span v-else-if="alert.remoteStatus === 'pending'"><Clock />请打开验证邮件完成确认</span>
            <span v-else><Lock />同一轮达标只发送一次</span>
          </div>

          <div class="alert-footer">
            <span>创建于 {{ formatDate(alert.createdAt) }}</span>
            <div>
              <button class="item-action" :disabled="alert.remoteStatus === 'pending' || busyId === alert.id" @click="toggleAlert(alert)"><VideoPlay v-if="!alert.enabled" /><VideoPause v-else />{{ alert.enabled ? '暂停' : '启用' }}</button>
              <button v-if="pendingDelete !== alert.id" class="item-action danger" :disabled="busyId === alert.id" @click="pendingDelete = alert.id"><Delete />删除</button>
              <button v-else class="confirm-delete" :disabled="busyId === alert.id" @click="deleteAlertItem(alert)">{{ busyId === alert.id ? '处理中' : '确认删除' }}</button>
            </div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import {
  Bell, CircleCheck, Clock, Delete, Loading, Lock, Message, Plus, Refresh,
  VideoPause, VideoPlay, View,
} from '@element-plus/icons-vue'
import {
  CNY_ENTRY, CURRENCY_META, HOT_CURRENCIES, buildCurrencyOptions,
  formatRate, getCrossRate, getCurrencyMeta,
} from '../api/exchangeRate.js'
import { createEmailAlert, deleteEmailAlert, getEmailAlert, getEmailServiceHealth, updateEmailAlert } from '../api/alerts.js'
import { useExchangeRates } from '../composables/useExchangeRates.js'

const { rates, hasData, updatedLabel, refreshing, error, refresh } = useExchangeRates()
const alerts = ref(readAlerts())
const pendingDelete = ref(null)
const busyId = ref(null)
const submitting = ref(false)
const syncing = ref(false)
const formError = ref('')
const formMessage = ref('')
const emailServiceReady = ref(false)
const emailHealthLoaded = ref(false)
const verifiedMessage = ref(new URLSearchParams(window.location.search).get('verified') === '1')
const form = reactive({ from: 'USD', to: 'CNY', direction: 'above', target: null, email: readSavedEmail() })
let timer

const fallback = [CNY_ENTRY, ...HOT_CURRENCIES.map((code) => ({ code, ...CURRENCY_META[code], unit: CURRENCY_META[code]?.unit || 1 }))]
const currencies = computed(() => hasData.value ? buildCurrencyOptions(rates.value) : fallback)
const formCurrent = computed(() => getCrossRate(rates.value, form.from, form.to))
const emailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
const canSubmit = computed(() => emailServiceReady.value && form.from !== form.to && Number(form.target) > 0 && emailValid.value)
const decoratedAlerts = computed(() => alerts.value.map((alert) => {
  const current = getCrossRate(rates.value, alert.from, alert.to)
  const met = alert.enabled && Number.isFinite(current) && (alert.direction === 'above' ? current >= alert.target : current <= alert.target)
  const distance = Number.isFinite(current) && current ? (alert.target - current) / current * 100 : null
  const delivery = deliveryState(alert)
  return {
    ...alert, current, met, ...delivery,
    distanceLabel: distance === null ? '--' : met ? '目标已达成' : `还差 ${Math.abs(distance).toFixed(2)}%`,
    distanceTone: met ? 'success' : distance !== null && Math.abs(distance) < 1 ? 'near' : '',
  }
}).sort((a, b) => Number(a.remoteStatus === 'pending') - Number(b.remoteStatus === 'pending') || Number(b.met) - Number(a.met)))
const activeCount = computed(() => alerts.value.filter((alert) => alert.remoteStatus === 'active' && alert.enabled).length)
const pendingCount = computed(() => alerts.value.filter((alert) => alert.remoteStatus === 'pending').length)

function readAlerts() {
  try { return JSON.parse(localStorage.getItem('fx_alerts_v3') || localStorage.getItem('fx_alerts_v2') || '[]') }
  catch { return [] }
}
function readSavedEmail() {
  try { return localStorage.getItem('fx_alert_email') || '' }
  catch { return '' }
}
function persist() { localStorage.setItem('fx_alerts_v3', JSON.stringify(alerts.value)) }
function deliveryState(alert) {
  if (alert.remoteStatus === 'pending') return { deliveryLabel: '等待邮箱验证', deliveryTone: 'pending' }
  if (alert.remoteStatus === 'paused' || !alert.enabled) return { deliveryLabel: '邮件已暂停', deliveryTone: 'paused' }
  if (alert.remoteStatus === 'active') return { deliveryLabel: '邮件监测中', deliveryTone: 'email' }
  return { deliveryLabel: '仅页面提醒', deliveryTone: 'watching' }
}

async function addAlert() {
  formError.value = ''
  formMessage.value = ''
  if (!emailServiceReady.value) { formError.value = '邮件通道正在完成配置，请稍后再试'; return }
  if (form.from === form.to) { formError.value = '来源币种与目标币种不能相同'; return }
  if (!Number(form.target) || form.target <= 0) { formError.value = '请输入有效的目标汇率'; return }
  if (!emailValid.value) { formError.value = '请输入有效的接收邮箱'; return }
  const duplicate = alerts.value.some((alert) => alert.from === form.from && alert.to === form.to && alert.direction === form.direction && Number(alert.target) === Number(form.target) && alert.email === form.email)
  if (duplicate) { formError.value = '相同邮箱和条件的提醒已经存在'; return }

  submitting.value = true
  try {
    const remote = await createEmailAlert({ email: form.email, from: form.from, to: form.to, direction: form.direction, target: Number(form.target) })
    alerts.value = [{
      id: remote.id, remoteId: remote.id, manageToken: remote.manageToken,
      remoteStatus: remote.status, email: form.email, from: form.from, to: form.to,
      direction: form.direction, target: Number(form.target), enabled: true, createdAt: remote.createdAt,
    }, ...alerts.value]
    localStorage.setItem('fx_alert_email', form.email)
    form.target = null
    formMessage.value = remote.message
    persist()
  } catch (cause) {
    formError.value = cause.message
  } finally {
    submitting.value = false
  }
}

async function syncRemoteAlerts() {
  const remoteAlerts = alerts.value.filter((alert) => alert.remoteId && alert.manageToken)
  if (!remoteAlerts.length) return
  syncing.value = true
  const results = await Promise.allSettled(remoteAlerts.map(async (alert) => ({ local: alert, remote: await getEmailAlert(alert.remoteId, alert.manageToken) })))
  const updates = new Map(results.filter((item) => item.status === 'fulfilled').map((item) => [item.value.local.id, item.value.remote]))
  alerts.value = alerts.value.map((alert) => {
    const remote = updates.get(alert.id)
    return remote ? { ...alert, remoteStatus: remote.status, enabled: remote.enabled, lastRate: remote.lastRate, lastCheckedAt: remote.lastCheckedAt, lastNotifiedAt: remote.lastNotifiedAt } : alert
  })
  persist()
  syncing.value = false
}

async function toggleAlert(alert) {
  formError.value = ''
  if (alert.remoteStatus === 'pending') { formError.value = '请先打开验证邮件完成确认'; return }
  busyId.value = alert.id
  try {
    if (alert.remoteId && alert.manageToken) await updateEmailAlert(alert.remoteId, alert.manageToken, !alert.enabled)
    alerts.value = alerts.value.map((item) => item.id === alert.id ? { ...item, enabled: !alert.enabled, remoteStatus: alert.enabled ? 'paused' : 'active' } : item)
    persist()
  } catch (cause) { formError.value = cause.message }
  finally { busyId.value = null }
}

async function deleteAlertItem(alert) {
  busyId.value = alert.id
  formError.value = ''
  try {
    if (alert.remoteId && alert.manageToken) await deleteEmailAlert(alert.remoteId, alert.manageToken)
    alerts.value = alerts.value.filter((item) => item.id !== alert.id)
    pendingDelete.value = null
    persist()
  } catch (cause) { formError.value = cause.message }
  finally { busyId.value = null }
}

function formatDate(value) { return new Date(value).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) }
function formatDateTime(value) { return new Date(value).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }
async function refreshAll() { await Promise.allSettled([refresh({ force: true }), syncRemoteAlerts()]) }
async function loadEmailHealth() {
  try {
    const health = await getEmailServiceHealth()
    emailServiceReady.value = health.emailConfigured === true
  } catch {
    emailServiceReady.value = false
  } finally {
    emailHealthLoaded.value = true
  }
}

watch(() => [form.from, form.to, form.direction, form.email], () => { formError.value = ''; formMessage.value = '' })
onMounted(() => {
  if (verifiedMessage.value) window.history.replaceState({}, '', '/alerts')
  refresh().catch(() => {})
  loadEmailHealth()
  syncRemoteAlerts()
  timer = setInterval(() => refresh().catch(() => {}), 30_000)
})
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.alerts-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; }
.success-banner { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; padding: 12px 14px; border: 1px solid #BCE6D0; border-radius: 12px; background: var(--color-success-light); color: var(--color-success); font-size: 11px; font-weight: 750; }
.success-banner svg { width: 16px; }
.delivery-explainer { display: flex; align-items: center; gap: 24px; margin-bottom: 14px; padding: 15px 18px; }
.delivery-title { display: flex; align-items: center; gap: 11px; min-width: 220px; }
.delivery-title > div:last-child { display: flex; flex-direction: column; gap: 3px; }
.delivery-title strong { color: var(--color-text); font-size: 12px; }
.delivery-title span { color: var(--color-text-muted); font-size: 9px; }
.delivery-icon { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 12px; background: var(--color-primary-light); color: var(--color-primary); }
.delivery-icon svg { width: 18px; }
.delivery-explainer ol { flex: 1; display: flex; align-items: center; gap: 8px; margin: 0; padding: 0; list-style: none; }
.delivery-explainer li { display: flex; align-items: center; gap: 6px; color: var(--color-text-soft); font-size: 9px; white-space: nowrap; }
.delivery-explainer li:not(:last-child)::after { content: '→'; margin-left: 7px; color: var(--color-border-strong); }
.delivery-explainer i { width: 19px; height: 19px; display: grid; place-items: center; border-radius: 50%; background: #FFF1F5; color: var(--color-primary); font-size: 8px; font-style: normal; font-weight: 800; }
.free-badge { padding: 6px 9px; border-radius: 999px; background: var(--color-success-light); color: var(--color-success); font-size: 9px; font-weight: 800; white-space: nowrap; }
.free-badge.pending { background: #FFF5DE; color: #B97917; }
.service-notice { display: flex; align-items: center; gap: 8px; margin: -3px 0 14px; padding: 11px 14px; border: 1px solid #F2DDA8; border-radius: 12px; background: #FFF9E9; color: #976818; font-size: 10px; font-weight: 700; }
.service-notice svg { width: 15px; flex: 0 0 auto; }
.create-alert-card { padding: clamp(18px,2.6vw,26px); }
.create-alert-card .section-note { margin: 5px 0 0; }
.private-badge { display: inline-flex; align-items: center; gap: 5px; padding: 6px 9px; border-radius: 999px; background: #F6F1FF; color: #7C63C2; font-size: 9px; font-weight: 750; }
.private-badge svg { width: 12px; }
.alert-form-grid { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 11px; margin-top: 18px; }
.email-row { display: grid; grid-template-columns: minmax(260px,1fr) 1fr; align-items: end; gap: 14px; margin-top: 12px; }
.email-input { position: relative; display: block; }
.email-input svg { position: absolute; left: 12px; top: 50%; z-index: 1; width: 15px; color: var(--color-text-muted); transform: translateY(-50%); }
.email-input .form-control { padding-left: 37px; }
.email-note { min-height: 42px; display: flex; align-items: center; gap: 7px; padding: 0 13px; border-radius: 11px; background: #F3FBF7; color: var(--color-success); font-size: 9px; font-weight: 700; }
.email-note svg { width: 14px; }
.current-preview { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 13px; padding: 12px 14px; border: 1px solid var(--color-border-subtle); border-radius: 12px; background: #FCFAFB; }
.current-preview div { display: flex; flex-direction: column; gap: 3px; }
.current-preview span { color: var(--color-text-muted); font-size: 9px; }
.current-preview strong { color: var(--color-text); font-size: 11px; }
.current-preview button { border: 0; background: transparent; color: var(--color-primary); font-size: 10px; font-weight: 750; }
.form-footer { display: flex; align-items: center; gap: 12px; margin-top: 14px; color: var(--color-text-muted); font-size: 10px; }
.form-error { color: var(--color-danger); font-weight: 700; }
.form-success { color: var(--color-success); font-weight: 700; }
.alerts-section { margin-top: 25px; }
.empty-alerts { min-height: 270px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.empty-icon { width: 54px; height: 54px; display: grid; place-items: center; border-radius: 17px; background: var(--color-primary-light); color: var(--color-primary); }
.empty-icon svg { width: 24px; }
.empty-alerts h3 { margin: 15px 0 6px; color: var(--color-text); font-size: 15px; }
.empty-alerts p { max-width: 390px; margin: 0; color: var(--color-text-soft); font-size: 11px; line-height: 1.6; }
.alert-list { display: grid; gap: 11px; }
.alert-item { padding: 17px; transition: border-color .18s, opacity .18s; }
.alert-item.is-triggered { border-color: #A9DFC4; box-shadow: 0 8px 28px rgba(32,169,107,.08); }
.alert-item.is-disabled { opacity: .68; }
.alert-main { display: flex; align-items: center; gap: 11px; }
.pair-flags { display: flex; align-items: center; gap: 4px; padding: 8px 10px; border-radius: 11px; background: #FBF7F9; }
.pair-flags span { font-size: 19px; }
.pair-flags i { color: var(--color-text-muted); font-size: 10px; font-style: normal; }
.pair-info h3 { margin: 0; color: var(--color-text); font-size: 13px; font-weight: 820; }
.pair-info p { margin: 3px 0 0; color: var(--color-text-muted); font-size: 9px; }
.alert-status { display: inline-flex; align-items: center; gap: 5px; margin-left: auto; padding: 6px 9px; border-radius: 999px; font-size: 9px; font-weight: 800; }
.alert-status svg { width: 12px; }
.alert-status.watching { background: #EEF7FF; color: #397DAA; }
.alert-status.email { background: var(--color-success-light); color: var(--color-success); }
.alert-status.pending { background: #FFF5DE; color: #B97917; }
.alert-status.paused { background: #F2EFF1; color: var(--color-text-muted); }
.alert-values { display: grid; grid-template-columns: repeat(3,1fr); gap: 9px; margin-top: 15px; }
.alert-values div { display: flex; flex-direction: column; gap: 4px; padding: 11px; border-radius: 11px; background: #FCFAFB; }
.alert-values span { color: var(--color-text-muted); font-size: 9px; }
.alert-values strong { color: var(--color-text); font-size: 12px; }
.alert-values strong.success { color: var(--color-success); }
.alert-values strong.near { color: var(--color-warning); }
.delivery-detail { display: flex; align-items: center; gap: 18px; margin-top: 11px; padding: 10px 12px; border-radius: 10px; background: #FFF9FB; color: var(--color-text-soft); font-size: 9px; }
.delivery-detail span { display: inline-flex; align-items: center; gap: 5px; }
.delivery-detail svg { width: 12px; color: var(--color-primary); }
.alert-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 13px; padding-top: 12px; border-top: 1px solid var(--color-border-subtle); }
.alert-footer > span { color: var(--color-text-muted); font-size: 9px; }
.alert-footer > div { display: flex; gap: 6px; }
.item-action, .confirm-delete { display: inline-flex; align-items: center; gap: 4px; height: 30px; padding: 0 9px; border: 1px solid var(--color-border); border-radius: 8px; background: white; color: var(--color-text-soft); font-size: 9px; font-weight: 750; }
.item-action svg { width: 12px; }
.item-action:hover { background: var(--color-bg-soft); color: var(--color-primary); }
.item-action.danger:hover { border-color: #F0C4CE; background: #FFF2F5; color: var(--color-danger); }
.confirm-delete { border-color: var(--color-danger); background: var(--color-danger); color: white; }

@media (max-width: 900px) {
  .alert-form-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
  .delivery-explainer { align-items: flex-start; flex-wrap: wrap; }
  .delivery-explainer ol { order: 3; flex-basis: 100%; }
}
@media (max-width: 640px) {
  .alerts-heading { align-items: flex-start; flex-direction: column; }
  .delivery-explainer { gap: 13px; }
  .delivery-title { min-width: 0; }
  .delivery-explainer ol { align-items: flex-start; flex-direction: column; }
  .delivery-explainer li:not(:last-child)::after { display: none; }
  .free-badge { margin-left: auto; }
  .alert-form-grid, .email-row { grid-template-columns: 1fr; }
  .form-footer { align-items: flex-start; flex-direction: column; }
  .form-footer .primary-button { width: 100%; }
  .alert-main { align-items: flex-start; flex-wrap: wrap; }
  .alert-status { margin-left: 0; }
  .alert-values { grid-template-columns: 1fr; }
  .delivery-detail { align-items: flex-start; flex-direction: column; gap: 7px; }
  .alert-footer { align-items: flex-start; flex-direction: column; }
  .alert-footer > div { width: 100%; }
  .item-action, .confirm-delete { flex: 1; justify-content: center; }
}
</style>
