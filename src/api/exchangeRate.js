import axios from 'axios'

const LIVE_API = 'https://api.exchangerate.fun'

// 热门货币（放在最前面）
export const HOT_CURRENCIES = [
  'USD','EUR','GBP','JPY','AUD','CAD','CHF','NZD','SGD','HKD',
  'KRW','THB','MYR','PHP','IDR','VND','INR'
]

// 热门货币元数据
export const CURRENCY_META = {
  USD:{name:'美元',flag:'🇺🇸',symbol:'$',color:'#ff6b8a'},
  EUR:{name:'欧元',flag:'🇪🇺',symbol:'€',color:'#a78bfa'},
  GBP:{name:'英镑',flag:'🇬🇧',symbol:'£',color:'#c084fc'},
  JPY:{name:'日元',flag:'🇯🇵',symbol:'¥',color:'#f472b6',unit:100},
  AUD:{name:'澳元',flag:'🇦🇺',symbol:'A$',color:'#fb923c'},
  CAD:{name:'加元',flag:'🇨🇦',symbol:'C$',color:'#f87171'},
  CHF:{name:'瑞郎',flag:'🇨🇭',symbol:'Fr',color:'#34d399'},
  NZD:{name:'纽元',flag:'🇳🇿',symbol:'NZ$',color:'#60a5fa'},
  SGD:{name:'新币',flag:'🇸🇬',symbol:'S$',color:'#fbbf24'},
  HKD:{name:'港币',flag:'🇭🇰',symbol:'HK$',color:'#e879f9'},
  KRW:{name:'韩元',flag:'🇰🇷',symbol:'₩',color:'#818cf8'},
  THB:{name:'泰铢',flag:'🇹🇭',symbol:'฿',color:'#2dd4bf'},
  MYR:{name:'马币',flag:'🇲🇾',symbol:'RM',color:'#facc15'},
  PHP:{name:'比索',flag:'🇵🇭',symbol:'₱',color:'#38bdf8'},
  IDR:{name:'印尼盾',flag:'🇮🇩',symbol:'Rp',color:'#f97316'},
  VND:{name:'越南盾',flag:'🇻🇳',symbol:'₫',color:'#ef4444'},
  INR:{name:'卢比',flag:'🇮🇳',symbol:'₹',color:'#22c55e'},
  CNY:{name:'人民币',flag:'🇨🇳',symbol:'¥',color:'#ef4444'},
}

export async function fetchLiveRates() {
  const res = await axios.get(`${LIVE_API}/latest`, { params: { base: 'CNY' } })
  return res.data
}

export function calculateRate(rates, code, unit = 1) {
  if (!rates || !rates[code]) return null
  return unit / rates[code]
}

// 获取所有币种列表（按汇率排序，热门在前）
export function buildCurrencyList(rates) {
  if (!rates) return []
  const hot = []
  const other = []

  Object.keys(rates).forEach(code => {
    const rate = calculateRate(rates, code)
    if (rate === null) return
    const meta = CURRENCY_META[code] || { name: code, flag: '💱', symbol: '', color: '#c4a8b4' }
    const entry = { code, ...meta, rate, unit: meta.unit || 1 }

    if (HOT_CURRENCIES.includes(code)) {
      hot.push(entry)
    } else {
      other.push(entry)
    }
  })

  // 热门按预定义顺序排列
  hot.sort((a, b) => HOT_CURRENCIES.indexOf(a.code) - HOT_CURRENCIES.indexOf(b.code))
  // 其他按字母排序
  other.sort((a, b) => a.code.localeCompare(b.code))

  return [...hot, ...other]
}

// === 历史数据（jsdelivr CDN） ===
export async function fetchHistory(days = 30) {
  const today = new Date()
  const results = {}
  const needed = Math.min(days + Math.floor(days/5)*2 + 5, 500)

  const fetches = []
  for (let i = 0; i < needed; i++) {
    const d = new Date(today.getTime() - i*86400000)
    const ds = d.toISOString().slice(0,10)
    const url = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${ds}/v1/currencies/usd.json`
    fetches.push(
      axios.get(url, { validateStatus: s => s===200 })
        .then(res => {
          const data = res.data
          if (data?.usd?.cny) {
            const rates = { CNY: data.usd.cny }
            HOT_CURRENCIES.forEach(c => {
              if (data.usd[c.toLowerCase()]) rates[c] = data.usd[c.toLowerCase()]
            })
            results[data.date] = rates
          }
        })
        .catch(() => {})
    )
  }
  await Promise.all(fetches)

  const sorted = Object.keys(results).sort()
  if (sorted.length > days) {
    const filtered = {}
    sorted.slice(-days).forEach(d => { filtered[d] = results[d] })
    return { rates: filtered }
  }
  return { rates: results }
}

export function getCNYHistory(histData, code) {
  const rates = histData?.rates || {}
  return Object.keys(rates).sort().map(date => {
    const day = rates[date]
    if (!day?.CNY) return null
    if (code === 'USD') return day.CNY
    if (!day[code]) return null
    return day.CNY / day[code]
  }).filter(v => v !== null)
}
