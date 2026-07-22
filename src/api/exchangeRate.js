import axios from 'axios'

const LIVE_API = '/api/rates'
const HISTORY_CDN = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api'

export const HOT_CURRENCIES = [
  'USD', 'AUD', 'GBP', 'JPY', 'EUR', 'HKD', 'CAD', 'SGD',
  'CHF', 'NZD', 'KRW', 'THB', 'MYR', 'PHP', 'IDR', 'VND', 'INR',
]

export const CURRENCY_META = {
  CNY: { name: '人民币', flag: '🇨🇳', symbol: '¥', color: '#EF6B7B' },
  USD: { name: '美元', flag: '🇺🇸', symbol: '$', color: '#E85D8E' },
  AUD: { name: '澳元', flag: '🇦🇺', symbol: 'A$', color: '#F59E66' },
  GBP: { name: '英镑', flag: '🇬🇧', symbol: '£', color: '#9B7BE8' },
  JPY: { name: '日元', flag: '🇯🇵', symbol: '¥', color: '#F18CB4', unit: 100 },
  EUR: { name: '欧元', flag: '🇪🇺', symbol: '€', color: '#7B8FE8' },
  HKD: { name: '港币', flag: '🇭🇰', symbol: 'HK$', color: '#D876CF' },
  CAD: { name: '加元', flag: '🇨🇦', symbol: 'C$', color: '#EF7373' },
  SGD: { name: '新币', flag: '🇸🇬', symbol: 'S$', color: '#E8A84B' },
  CHF: { name: '瑞郎', flag: '🇨🇭', symbol: 'Fr', color: '#43B88A' },
  NZD: { name: '纽元', flag: '🇳🇿', symbol: 'NZ$', color: '#5F9EDC' },
  KRW: { name: '韩元', flag: '🇰🇷', symbol: '₩', color: '#7E8BE3', unit: 100 },
  THB: { name: '泰铢', flag: '🇹🇭', symbol: '฿', color: '#41B7AA' },
  MYR: { name: '马币', flag: '🇲🇾', symbol: 'RM', color: '#D7A932' },
  PHP: { name: '比索', flag: '🇵🇭', symbol: '₱', color: '#4AAAD7' },
  IDR: { name: '印尼盾', flag: '🇮🇩', symbol: 'Rp', color: '#EA8A44', unit: 100 },
  VND: { name: '越南盾', flag: '🇻🇳', symbol: '₫', color: '#E15D5D', unit: 100 },
  INR: { name: '卢比', flag: '🇮🇳', symbol: '₹', color: '#48AA72' },
}

export const CNY_ENTRY = {
  code: 'CNY', ...CURRENCY_META.CNY, rate: 1, unit: 1,
}

export async function fetchLiveRates() {
  const { data } = await axios.get(LIVE_API, { timeout: 12000 })
  if (!data?.rates || Object.keys(data.rates).length === 0) {
    throw new Error('汇率数据为空')
  }
  return data
}

export function calculateRate(rates, code, unit = 1) {
  const value = Number(rates?.[code])
  if (!Number.isFinite(value) || value <= 0) return null
  return unit / value
}

export function buildCurrencyList(rates) {
  if (!rates || typeof rates !== 'object') return []
  const hot = []
  const other = []

  Object.keys(rates).forEach((code) => {
    const meta = CURRENCY_META[code] || {
      name: code, flag: '🌐', symbol: '', color: '#A08C95',
    }
    const unit = meta.unit || 1
    const rate = calculateRate(rates, code, unit)
    if (rate === null) return
    const entry = { code, ...meta, rate, unit }
    ;(HOT_CURRENCIES.includes(code) ? hot : other).push(entry)
  })

  hot.sort((a, b) => HOT_CURRENCIES.indexOf(a.code) - HOT_CURRENCIES.indexOf(b.code))
  other.sort((a, b) => a.code.localeCompare(b.code))
  return [...hot, ...other]
}

export function buildCurrencyOptions(rates) {
  return [CNY_ENTRY, ...buildCurrencyList(rates).filter((item) => item.code !== 'CNY')]
}

export function getCurrencyMeta(code) {
  return CURRENCY_META[code] || { name: code, flag: '🌐', symbol: '', color: '#A08C95' }
}

export function getCrossRate(rates, from, to) {
  if (from === to) return 1
  const fromToCny = from === 'CNY' ? 1 : calculateRate(rates, from)
  const cnyToTarget = to === 'CNY' ? 1 : Number(rates?.[to])
  if (!Number.isFinite(fromToCny) || !Number.isFinite(cnyToTarget)) return null
  return fromToCny * cnyToTarget
}

export function formatRate(value, maximumFractionDigits = 4) {
  if (!Number.isFinite(Number(value))) return '--'
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits,
  }).format(Number(value))
}

function sampleOffsets(days, maxPoints = 72) {
  const count = Math.min(days, maxPoints)
  if (count <= 1) return [0]
  return [...new Set(Array.from({ length: count }, (_, index) =>
    Math.round((days - 1) * index / (count - 1)),
  ))]
}

export async function fetchHistory(days = 30) {
  const today = new Date()
  const results = {}
  const offsets = sampleOffsets(days)

  await Promise.allSettled(offsets.map(async (offset) => {
    const date = new Date(today.getTime() - offset * 86400000)
    const dateString = date.toISOString().slice(0, 10)
    const url = `${HISTORY_CDN}@${dateString}/v1/currencies/usd.json`
    const { data } = await axios.get(url, { timeout: 10000 })
    if (!data?.usd?.cny) return

    const rates = { CNY: data.usd.cny }
    HOT_CURRENCIES.forEach((code) => {
      const value = data.usd[code.toLowerCase()]
      if (value) rates[code] = value
    })
    results[data.date || dateString] = rates
  }))

  return { rates: results, sampled: days > offsets.length, requestedDays: days }
}

export function getCNYHistoryPoints(historyData, code) {
  const rates = historyData?.rates || {}
  const unit = CURRENCY_META[code]?.unit || 1
  return Object.keys(rates).sort().map((date) => {
    const day = rates[date]
    if (!day?.CNY) return null
    let value
    if (code === 'USD') value = day.CNY * unit
    else if (day[code]) value = (day.CNY / day[code]) * unit
    else return null
    return { date, value }
  }).filter(Boolean)
}

export function getCNYHistory(historyData, code) {
  return getCNYHistoryPoints(historyData, code).map((point) => point.value)
}
