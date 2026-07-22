const SOURCE_URL = 'https://api.exchangerate.fun/latest?base=CNY'

export default async function handler(_request, response) {
  try {
    const upstream = await fetch(SOURCE_URL, {
      headers: { Accept: 'application/json', 'User-Agent': 'bailuio-rate-viewer/1.0' },
      signal: AbortSignal.timeout(10_000),
    })

    if (!upstream.ok) {
      throw new Error(`upstream returned ${upstream.status}`)
    }

    const data = await upstream.json()
    if (!data?.rates || Object.keys(data.rates).length < 100) {
      throw new Error('upstream returned invalid rates')
    }

    response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400')
    response.status(200).json(data)
  } catch (error) {
    console.error('[rates proxy]', error)
    response.status(502).json({ error: '汇率服务暂时不可用，请稍后重试' })
  }
}
