import axios from 'axios'

const API_BASE = 'https://api.exchangerate.fun'

// 我们关注的货币对 (vs CNY)
export const FOCUS_CURRENCIES = [
  { code: 'USD', name: '美元', symbol: '$', flag: '🇺🇸', color: '#3b82f6' },
  { code: 'AUD', name: '澳元', symbol: 'A$', flag: '🇦🇺', color: '#f59e0b' },
  { code: 'GBP', name: '英镑', symbol: '£', flag: '🇬🇧', color: '#8b5cf6' },
  { code: 'JPY', name: '日元', symbol: '¥', flag: '🇯🇵', color: '#ef4444' }
]

/**
 * 获取汇率数据
 * 使用 exchangerate.fun 免费 API，每小时更新
 */
export async function fetchExchangeRates() {
  try {
    // 获取以 CNY 为基准的汇率
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
 * API 返回 CNY 对其他货币的汇率，我们需要计算 1 外币 = ? CNY
 */
export function calculateRate(rates, currencyCode) {
  if (!rates || !rates[currencyCode]) return null
  // rates[currencyCode] = 1 CNY = X 外币
  // 所以 1 外币 = 1 / X CNY
  return 1 / rates[currencyCode]
}
