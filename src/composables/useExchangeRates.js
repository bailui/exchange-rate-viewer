import { computed, ref } from 'vue'
import { fetchLiveRates } from '../api/exchangeRate.js'

const CACHE_KEY = 'bailuio_exchange_rates_v2'

function readCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
    if (cached?.rates && Object.keys(cached.rates).length > 0) return cached
  } catch {}
  return { rates: {}, updatedAt: null, sourceTimestamp: null }
}

const cached = readCache()
const rates = ref(cached.rates)
const updatedAt = ref(cached.updatedAt)
const sourceTimestamp = ref(cached.sourceTimestamp)
const loading = ref(Object.keys(cached.rates).length === 0)
const refreshing = ref(false)
const error = ref('')
let pendingRequest = null

function persist() {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      rates: rates.value,
      updatedAt: updatedAt.value,
      sourceTimestamp: sourceTimestamp.value,
    }))
  } catch {}
}

async function refresh({ force = false } = {}) {
  if (pendingRequest) return pendingRequest
  if (!force && updatedAt.value && Date.now() - updatedAt.value < 25_000) return rates.value

  refreshing.value = true
  error.value = ''
  pendingRequest = (async () => {
    try {
      const data = await fetchLiveRates()
      rates.value = { ...data.rates }
      updatedAt.value = Date.now()
      sourceTimestamp.value = data.timestamp || null
      persist()
      return rates.value
    } catch (cause) {
      error.value = Object.keys(rates.value).length
        ? '最新数据暂时不可用，已继续显示上次成功数据'
        : '汇率服务连接失败，请稍后重试'
      throw cause
    } finally {
      loading.value = false
      refreshing.value = false
      pendingRequest = null
    }
  })()

  return pendingRequest
}

const hasData = computed(() => Object.keys(rates.value).length > 0)
const updatedLabel = computed(() => {
  if (!updatedAt.value) return '--'
  return new Date(updatedAt.value).toLocaleTimeString('zh-CN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })
})

export function useExchangeRates() {
  return {
    rates, loading, refreshing, error, hasData, updatedAt, updatedLabel,
    sourceTimestamp, refresh,
  }
}
