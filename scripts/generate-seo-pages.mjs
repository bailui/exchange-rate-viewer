import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { SEO_PAGES, SITE_URL } from '../src/seo-pages.js'

const template = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8')

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')

function replaceMeta(html, selector, value) {
  const pattern = new RegExp(`<meta (${selector}) content="[^"]*"\\s*/?>`)
  return html.replace(pattern, `<meta $1 content="${escapeHtml(value)}" />`)
}

function render(path, page) {
  const url = `${SITE_URL}${path}`
  const links = Object.entries(SEO_PAGES)
    .map(([href, item]) => `<a href="${href}">${escapeHtml(item.heading)}</a>`)
    .join(' · ')
  const shell = `<main class="seo-shell"><h1>${escapeHtml(page.heading)}</h1><p>${escapeHtml(page.intro)}</p><nav aria-label="汇率工具导航">${links}</nav><p>本站汇率数据仅供参考，实际成交价以银行或支付渠道为准。</p></main>`
  const schema = JSON.stringify({
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
  }).replaceAll('<', '\\u003c')

  let html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(page.title)}</title>`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${url}" />`)
    .replace(/<div id="app">[\s\S]*?<\/div>/, `<div id="app">${shell}</div>`)
    .replace(/<script id="seo-structured-data" type="application\/ld\+json">[\s\S]*?<\/script>/, `<script id="seo-structured-data" type="application/ld+json">${schema}</script>`)

  html = replaceMeta(html, 'name="description"', page.description)
  html = replaceMeta(html, 'name="keywords"', page.keywords)
  html = replaceMeta(html, 'property="og:title"', page.title)
  html = replaceMeta(html, 'property="og:description"', page.description)
  html = replaceMeta(html, 'property="og:url"', url)
  html = replaceMeta(html, 'name="twitter:title"', page.title)
  html = replaceMeta(html, 'name="twitter:description"', page.description)
  return html
}

for (const [path, page] of Object.entries(SEO_PAGES)) {
  const directory = new URL(`../dist${path}/`, import.meta.url)
  await mkdir(directory, { recursive: true })
  await writeFile(new URL('index.html', directory), render(path, page))
}

await writeFile(new URL('../dist/index.html', import.meta.url), render('/exchange-rate', SEO_PAGES['/exchange-rate']))
