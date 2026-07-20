import axios from 'axios'

const API_BASE = 'https://api.exchangerate.fun'

// 粉色可爱色板
const PINK_PALETTE = [
  '#ff6b9d', '#ff85a2', '#ff9eb5', '#f472b6',
  '#e879f9', '#c084fc', '#f97316', '#fb923c',
  '#fbbf24', '#a3e635'
]

export const FOCUS_CURRENCIES = [
  { code: 'USD', name: '美元', symbol: '$', flag: '🇺🇸', color: '#ff6b9d', unit: 1 },
  { code: 'EUR', name: '欧元', symbol: '€', flag: '🇪🇺', color: '#ff85a2', unit: 1 },
  { code: 'GBP', name: '英镑', symbol: '£', flag: '🇬🇧', color: '#f472b6', unit: 1 },
  { code: 'JPY', name: '日元', symbol: '¥', flag: '🇯🇵', color: '#e879f9', unit: 100 },
  { code: 'AUD', name: '澳元', symbol: 'A$', flag: '🇦🇺', color: '#c084fc', unit: 1 },
  { code: 'CAD', name: '加元', symbol: 'C$', flag: '🇨🇦', color: '#f97316', unit: 1 },
  { code: 'CHF', name: '瑞郎', symbol: 'Fr', flag: '🇨🇭', color: '#fb923c', unit: 1 },
  { code: 'NZD', name: '纽元', symbol: 'NZ$', flag: '🇳🇿', color: '#fbbf24', unit: 1 },
  { code: 'SGD', name: '新币', symbol: 'S$', flag: '🇸🇬', color: '#a3e635', unit: 1 },
  { code: 'HKD', name: '港币', symbol: 'HK$', flag: '🇭🇰', color: '#ff9eb5', unit: 1 }
]

/**
 * 获取汇率数据 - 使用 exchangerate.fun 免费 API
 */
export async function fetchExchangeRates() {
  try {
    const res = await axios.get(`${API_BASE}/latest`, {
      params: { base: 'CNY' }
    })
    return res.data
  } catch (err) {
    console.error('获取汇率失败:', err)
    throw err
  }
}

/**
 * 计算货币对 CNY 的汇率
 * API 返回 CNY 对其他货币的汇率，计算 unit 外币 = ? CNY
 */
export function calculateRate(rates, currencyCode, unit = 1) {
  if (!rates || !rates[currencyCode]) return null
  return unit / rates[currencyCode]
}
