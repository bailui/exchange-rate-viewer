const ALERT_API = import.meta.env.VITE_ALERT_API_URL || 'https://bailu-rate-alerts.l1181685041.workers.dev'

async function request(path, options = {}) {
  const response = await fetch(`${ALERT_API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...options.headers,
    },
  })
  if (response.status === 204) return null
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || '邮件提醒服务暂时不可用')
  return data
}

export function getEmailServiceHealth() {
  return request('/health')
}

export function createEmailAlert(payload) {
  return request('/api/alerts', { method: 'POST', body: JSON.stringify(payload) })
}

export function getEmailAlert(id, token) {
  return request(`/api/alerts/${id}`, { token })
}

export function updateEmailAlert(id, token, enabled) {
  return request(`/api/alerts/${id}`, { method: 'PATCH', token, body: JSON.stringify({ enabled }) })
}

export function deleteEmailAlert(id, token) {
  return request(`/api/alerts/${id}`, { method: 'DELETE', token })
}

export { ALERT_API }
