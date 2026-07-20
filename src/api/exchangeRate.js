import axios from 'axios'

const LIVE_API = 'https://api.exchangerate.fun'
const HIST_API = 'https://api.frankfurter.dev/v1'

export const FOCUS_CURRENCIES = [
  { code: 'USD', name: '美元', symbol: '$', flag: '🇺🇸', color: '#818cf8', unit: 1 },
  { code: 'EUR', name: '欧元', symbol: '€', flag: '🇪🇺', color: '#a78bfa', unit: 1 },
  { code: 'GBP', name: '英镑', symbol: '£', flag: '🇬🇧', color: '#c084fc', unit: 1 },
  { code: 'JPY', name: '日元', symbol: '¥', flag: '🇯🇵', color: '#f472b6', unit: 100 },
  { code: 'AUD', name: '澳元', symbol: 'A$', flag: '🇦🇺', color: '#fb923c', unit: 1 },
  { code: 'CAD', name: '加元', symbol: 'C$', flag: '🇨🇦', color: '#f87171', unit: 1 },
  { code: 'CHF', name: '瑞郎', symbol: 'Fr', flag: '🇨🇭', color: '#34d399', unit: 1 },
  { code: 'NZD', name: '纽元', symbol: 'NZ$', flag: '🇳🇿', color: '#60a5fa', unit: 1 },
  { code: 'SGD', name: '新币', symbol: 'S$', flag: '🇸🇬', color: '#fbbf24', unit: 1 },
  { code: 'HKD', name: '港币', symbol: 'HK$', flag: '🇭🇰', color: '#e879f9', unit: 1 }
]

export async function fetchLiveRates() {
  const res = await axios.get(`${LIVE_API}/latest`, { params: { base: 'CNY' } })
  return res.data
}

export function calculateRate(rates, code, unit = 1) {
  if (!rates || !rates[code]) return null
  return unit / rates[code]
}

/**
 * 获取历史汇率数据（jsdelivr CDN，支持 CORS）
 * 尝试最近 N 个日期，跳过周末/节假日
 * @param {number} days - 目标天数 (7/30/90/180/360)
 */
export async function fetchHistory(days = 30) {
  const today = new Date()
  const results = {}
  const neededDates = Math.min(days + Math.floor(days / 5) * 2 + 5, 500) // 加上周末 + buffer

  // 批量生成日期 URL
  const fetches = []
  for (let i = 0; i < neededDates; i++) {
    const d = new Date(today.getTime() - i * 86400000)
    const ds = d.toISOString().slice(0, 10)
    const url = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${ds}/v1/currencies/usd.json`
    fetches.push(
      axios.get(url, { validateStatus: s => s === 200 })
        .then(res => {
          const data = res.data
          if (data?.usd?.cny) {
            // 需要转成 frankfurter 相同格式：{ rates: { date: { CNY: x, JPY: y } } }
            const rates = { CNY: data.usd.cny }
            FOCUS_CURRENCIES.forEach(c => {
              if (c.code !== 'USD' && data.usd[c.code.toLowerCase()]) {
                rates[c.code] = data.usd[c.code.toLowerCase()]
              }
            })
            results[data.date] = rates
          }
        })
        .catch(() => {}) // 404 忽略
    )
  }

  await Promise.all(fetches)

  // 按日期排序，取目标天数
  const sortedDates = Object.keys(results).sort()
  if (sortedDates.length > days) {
    const keep = sortedDates.slice(-days)
    const filtered = {}
    keep.forEach(d => { filtered[d] = results[d] })
    return { rates: filtered }
  }

  return { rates: results }
}

/**
 * 将 frankfurter 历史数据转为 { code: [values...] } 格式
 * API 返回: { rates: { "2026-07-01": { CNY: 6.79, JPY: 161.5 } } }
 * 我们需要: { USD: [6.77, 6.78...], JPY: [0.041...] }
 */
export function transformHistory(data, days = 30) {
  const result = {}
  FOCUS_CURRENCIES.forEach(c => { result[c.code] = [] })

  const rates = data?.rates || {}
  const dates = Object.keys(rates).sort()

  dates.forEach(date => {
    const dayRates = rates[date]
    // API 返回 USD→X，需要转换为 1X→CNY
    // 但我们不知道当天 CNY 的汇率
    // 简化：直接用 USD→X 的值，除以当前 CNY 值来近似
    // 实际上我们需要的是展示趋势，所以直接用原始值即可
    FOCUS_CURRENCIES.forEach(c => {
      if (dayRates[c.code]) {
        result[c.code].push(dayRates[c.code])
      }
    })
  })

  return result
}

/**
 * 简化版：获取单个货币对 CNY 的历史趋势
 * 通过 USD 桥接：USD→CNY 历史 × 当前 USD→X 比例
 */
export function getCNYHistory(histData, currencyCode) {
  const rates = histData?.rates || {}
  const dates = Object.keys(rates).sort()
  return dates.map(date => {
    const day = rates[date]
    if (!day?.CNY) return null
    if (currencyCode === 'USD') return day.CNY
    if (!day[currencyCode]) return null
    // USD/CNY ÷ USD/X = X/CNY
    return day.CNY / day[currencyCode]
  }).filter(v => v !== null)
}
