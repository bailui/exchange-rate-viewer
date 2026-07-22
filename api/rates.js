const SOURCES = [
  {
    name: 'fawazahmed0-cdn',
    url: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/cny.json',
    parse(data) {
      const supported = typeof Intl.supportedValuesOf === 'function'
        ? new Set(Intl.supportedValuesOf('currency'))
        : null
      const rates = Object.fromEntries(
        Object.entries(data?.cny || {})
          .map(([code, value]) => [code.toUpperCase(), Number(value)])
          .filter(([code, value]) => /^[A-Z]{3}$/.test(code) && Number.isFinite(value) && value > 0 && (!supported || supported.has(code))),
      )
      return {
        base: 'CNY',
        date: data?.date,
        timestamp: data?.date ? Math.floor(Date.parse(`${data.date}T00:00:00Z`) / 1000) : Math.floor(Date.now() / 1000),
        rates,
      }
    },
  },
  {
    name: 'exchangerate-fun',
    url: 'https://api.exchangerate.fun/latest?base=CNY',
    parse(data) {
      return { ...data, base: 'CNY' }
    },
  },
]

export default async function handler(_request, response) {
  let lastError

  for (const source of SOURCES) {
    try {
      const upstream = await fetch(source.url, {
        headers: { Accept: 'application/json', 'User-Agent': 'bailuio-rate-viewer/1.0' },
        signal: AbortSignal.timeout(10_000),
      })
      if (!upstream.ok) throw new Error(`upstream returned ${upstream.status}`)

      const data = source.parse(await upstream.json())
      if (!data?.rates || Object.keys(data.rates).length < 100) throw new Error('upstream returned invalid rates')

      response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400')
      response.setHeader('X-Rate-Source', source.name)
      return response.status(200).json(data)
    } catch (error) {
      lastError = error
      console.warn(`[rates proxy] ${source.name} failed: ${error.message}`)
    }
  }

  console.error('[rates proxy] all sources failed', lastError)
  return response.status(502).json({ error: '汇率服务暂时不可用，请稍后重试' })
}
