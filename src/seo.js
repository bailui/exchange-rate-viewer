import { getSeoPage, SITE_URL } from './seo-pages'

function setMeta(selector, attribute, value) {
  let element = document.head.querySelector(selector)
  if (!element) {
    element = document.createElement('meta')
    const [name, key] = attribute
    element.setAttribute(name, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', value)
}

function setCanonical(url) {
  let link = document.head.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.appendChild(link)
  }
  link.href = url
}

export function updateSeo(pathname) {
  const page = getSeoPage(pathname)
  const path = pathname === '/' ? '/exchange-rate' : pathname.replace(/\/$/, '')
  const url = `${SITE_URL}${path}`

  document.title = page.title
  setMeta('meta[name="description"]', ['name', 'description'], page.description)
  setMeta('meta[name="keywords"]', ['name', 'keywords'], page.keywords)
  setMeta('meta[property="og:title"]', ['property', 'og:title'], page.title)
  setMeta('meta[property="og:description"]', ['property', 'og:description'], page.description)
  setMeta('meta[property="og:url"]', ['property', 'og:url'], url)
  setMeta('meta[name="twitter:title"]', ['name', 'twitter:title'], page.title)
  setMeta('meta[name="twitter:description"]', ['name', 'twitter:description'], page.description)
  setCanonical(url)

  let script = document.head.querySelector('#seo-structured-data')
  if (!script) {
    script = document.createElement('script')
    script.id = 'seo-structured-data'
    script.type = 'application/ld+json'
    document.head.appendChild(script)
  }
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: page.heading,
    url,
    description: page.description,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    inLanguage: 'zh-CN',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
    isPartOf: { '@type': 'WebSite', name: '白鹿io', url: SITE_URL },
  })
}
