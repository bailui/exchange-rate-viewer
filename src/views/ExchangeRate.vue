<template>
  <div class="page-shell">
    <header class="page-heading home-heading">
      <div>
        <div class="eyebrow"><span class="status-dot" /> 全球汇率服务</div>
        <h1 class="page-title">实时汇率</h1>
        <p class="page-description">重点关注美元、澳元、英镑与日元，快速查看人民币参考价。</p>
      </div>
      <div class="heading-actions">
        <span class="status-pill">{{ hasData ? `更新于 ${updatedLabel}` : '正在获取数据' }}</span>
        <button class="secondary-button" :disabled="refreshing" @click="refreshRates">
          <Refresh :class="{ 'is-spinning': refreshing }" />
          {{ refreshing ? '更新中' : '刷新数据' }}
        </button>
      </div>
    </header>

    <div v-if="error" class="error-banner" role="alert">
      <span>{{ error }}</span>
      <button class="secondary-button" @click="refreshRates">重新连接</button>
    </div>

    <section class="stat-grid" aria-label="汇率概览">
      <article v-for="stat in stats" :key="stat.label" class="stat-card">
        <div>
          <div class="stat-value" :class="{ skeleton: loading && !hasData }">{{ hasData || !loading ? stat.value : '' }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
        <div class="stat-icon" :class="stat.tone"><component :is="stat.icon" /></div>
      </article>
    </section>

    <section ref="converterRef" class="surface-card converter-card">
      <div class="section-heading converter-heading">
        <div>
          <h2 class="section-title">快速换算</h2>
          <p class="section-note">选择币种并输入金额，结果会自动更新</p>
        </div>
        <span class="live-badge"><span class="status-dot" /> 实时参考</span>
      </div>

      <div class="converter-grid">
        <div class="currency-panel source-panel">
          <div class="panel-label">
            <span>持有</span>
            <strong>{{ currencyName(convFrom) }}</strong>
          </div>
          <select v-model="convFrom" class="currency-select" aria-label="持有货币">
            <option v-for="currency in currencyOptions" :key="`from-${currency.code}`" :value="currency.code">
              {{ currency.flag }} {{ currency.code }} · {{ currency.name }}
            </option>
          </select>
          <div class="amount-row">
            <span class="currency-symbol">{{ currencyMeta(convFrom).symbol || convFrom }}</span>
            <input v-model.number="convAmount" type="number" min="0" inputmode="decimal" aria-label="持有金额" placeholder="输入金额" />
            <span class="amount-badge source-badge">{{ currencyName(convFrom) }}</span>
          </div>
        </div>

        <button class="swap-button" aria-label="交换币种" title="交换币种" @click="swapConv">
          <Switch />
        </button>

        <div class="currency-panel result-panel">
          <div class="panel-label">
            <span>兑换结果</span>
            <strong>{{ currencyName(convTo) }}</strong>
          </div>
          <select v-model="convTo" class="currency-select result-select" aria-label="目标货币">
            <option v-for="currency in currencyOptions" :key="`to-${currency.code}`" :value="currency.code">
              {{ currency.flag }} {{ currency.code }} · {{ currency.name }}
            </option>
          </select>
          <div class="amount-row result-amount">
            <span class="currency-symbol">{{ currencyMeta(convTo).symbol || convTo }}</span>
            <output class="result-value">{{ convResult }}</output>
            <span class="amount-badge result-badge">{{ currencyName(convTo) }}</span>
          </div>
        </div>
      </div>

      <div class="rate-summary">
        <span v-if="convRateInfo">1 {{ convFrom }} = <strong>{{ convRateInfo }}</strong> {{ convTo }}</span>
        <span v-else>等待实时汇率数据</span>
        <span>公开数据仅作参考，实际成交价以银行为准</span>
      </div>
    </section>

    <section class="content-section">
      <div class="section-heading">
        <div>
          <h2 class="section-title">热门汇率</h2>
          <p class="section-note">点击卡片即可设为持有货币</p>
        </div>
        <RouterLink to="/trends" class="text-link">查看走势 <ArrowRight /></RouterLink>
      </div>

      <div v-if="loading && !hasData" class="hot-grid" aria-busy="true">
        <div v-for="index in 8" :key="index" class="surface-card hot-card-skeleton">
          <div class="skeleton skeleton-title" />
          <div class="skeleton skeleton-number" />
          <div class="skeleton skeleton-chart" />
        </div>
      </div>
      <div v-else class="hot-grid">
        <button v-for="currency in hotCurrencies" :key="currency.code" class="hot-card surface-card"
          :class="{ 'is-selected': convFrom === currency.code }" @click="selectSource(currency.code)">
          <div class="hot-card-top">
            <span class="currency-flag">{{ currency.flag }}</span>
            <span>
              <strong>{{ currency.code }}</strong>
              <small>{{ currency.name }}</small>
            </span>
            <span class="card-action">设为持有</span>
          </div>
          <div class="hot-rate">
            <small>{{ currency.unit }} {{ currency.code }}</small>
            <strong>{{ formatRate(currency.rate) }}</strong>
            <span>CNY</span>
          </div>
          <div class="hot-chart">
            <Sparkline :data="sparkData[currency.code] || []" :color="currency.color" :show-label="true" />
          </div>
        </button>
      </div>
    </section>

    <section class="content-section">
      <div class="section-heading currencies-heading">
        <div>
          <h2 class="section-title">全部币种</h2>
          <p class="section-note">{{ filteredCurrencies.length }} 种结果 · 支持收藏与快速换算</p>
        </div>
        <div class="currency-tools">
          <label class="search-box">
            <Search />
            <input v-model.trim="searchQuery" type="search" placeholder="搜索代码或名称" aria-label="搜索币种" />
          </label>
          <button class="filter-button" :class="{ 'is-active': favoriteOnly }" @click="favoriteOnly = !favoriteOnly">
            <StarFilled v-if="favoriteOnly" /><Star v-else /> 收藏
          </button>
          <select v-model="sortBy" class="sort-select" aria-label="排序方式">
            <option value="default">默认排序</option>
            <option value="code">按代码排序</option>
            <option value="rateDesc">汇率从高到低</option>
            <option value="rateAsc">汇率从低到高</option>
          </select>
        </div>
      </div>

      <div class="surface-card currency-table-card">
        <div v-if="pagedCurrencies.length" class="desktop-table">
          <div class="table-row table-header">
            <span>币种</span><span>名称</span><span>单位</span><span class="align-right">人民币参考价</span><span class="align-right">快捷操作</span>
          </div>
          <div v-for="currency in pagedCurrencies" :key="currency.code" class="table-row">
            <span class="currency-identity"><button class="favorite-icon" :aria-label="`${isFavorite(currency.code) ? '取消收藏' : '收藏'} ${currency.code}`" @click="toggleFavorite(currency.code)"><StarFilled v-if="isFavorite(currency.code)" /><Star v-else /></button><b>{{ currency.flag }} {{ currency.code }}</b></span>
            <span class="muted-text">{{ currency.name }}</span>
            <span class="muted-text">{{ currency.unit }} {{ currency.code }}</span>
            <strong class="align-right mono-value">{{ formatRate(currency.rate) }} CNY</strong>
            <span class="table-actions"><button @click="selectSource(currency.code)">持有</button><button class="result-action" @click="selectTarget(currency.code)">兑换</button></span>
          </div>
        </div>

        <div v-if="pagedCurrencies.length" class="mobile-currency-list">
          <article v-for="currency in pagedCurrencies" :key="`mobile-${currency.code}`" class="mobile-currency-card">
            <div class="mobile-currency-head">
              <div><span>{{ currency.flag }}</span><strong>{{ currency.code }}</strong><small>{{ currency.name }}</small></div>
              <button class="favorite-icon" :aria-label="`${isFavorite(currency.code) ? '取消收藏' : '收藏'} ${currency.code}`" @click="toggleFavorite(currency.code)"><StarFilled v-if="isFavorite(currency.code)" /><Star v-else /></button>
            </div>
            <div class="mobile-rate"><small>{{ currency.unit }} {{ currency.code }}</small><strong>{{ formatRate(currency.rate) }}</strong><span>CNY</span></div>
            <div class="mobile-actions"><button @click="selectSource(currency.code)">设为持有</button><button @click="selectTarget(currency.code)">设为兑换</button></div>
          </article>
        </div>

        <div v-if="!pagedCurrencies.length" class="empty-state">
          <Search />
          <h3>没有找到匹配币种</h3>
          <p>换一个代码或中文名称试试。</p>
        </div>

        <nav v-if="totalPages > 1" class="pagination" aria-label="币种分页">
          <button :disabled="currentPage === 1" aria-label="上一页" @click="currentPage--"><ArrowLeft /></button>
          <span>第 <strong>{{ currentPage }}</strong> / {{ totalPages }} 页</span>
          <button :disabled="currentPage === totalPages" aria-label="下一页" @click="currentPage++"><ArrowRight /></button>
        </nav>
      </div>
    </section>

    <footer class="page-footer">🦌 白鹿io · 汇率转换 · 数据仅供参考</footer>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  ArrowLeft, ArrowRight, Clock, Coin, Refresh, Search, Star, StarFilled,
  Switch, Timer,
} from '@element-plus/icons-vue'
import Sparkline from '../components/Sparkline.vue'
import {
  CNY_ENTRY, CURRENCY_META, HOT_CURRENCIES, buildCurrencyList,
  buildCurrencyOptions, fetchHistory, formatRate, getCNYHistory,
  getCrossRate, getCurrencyMeta,
} from '../api/exchangeRate.js'
import { useExchangeRates } from '../composables/useExchangeRates.js'

const { rates, loading, refreshing, error, hasData, updatedLabel, refresh } = useExchangeRates()
const converterRef = ref(null)
const sparkData = ref({})
const convAmount = ref(100)
const convFrom = ref('USD')
const convTo = ref('CNY')
const searchQuery = ref('')
const sortBy = ref('default')
const favoriteOnly = ref(false)
const currentPage = ref(1)
const pageSize = 15
const favorites = ref(readFavorites())
let timer

const fallbackOptions = [CNY_ENTRY, ...HOT_CURRENCIES.map((code) => ({
  code, ...(CURRENCY_META[code] || { name: code, flag: '🌐', symbol: '' }), rate: null, unit: CURRENCY_META[code]?.unit || 1,
}))]
const currencyOptions = computed(() => hasData.value ? buildCurrencyOptions(rates.value) : fallbackOptions)
const hotCurrencies = computed(() => buildCurrencyList(rates.value).filter((item) => HOT_CURRENCIES.slice(0, 8).includes(item.code)).slice(0, 8))
const allCurrencies = computed(() => buildCurrencyOptions(rates.value))
const convRate = computed(() => getCrossRate(rates.value, convFrom.value, convTo.value))
const convResult = computed(() => {
  if (!Number.isFinite(Number(convAmount.value)) || convAmount.value < 0) return '0.00'
  if (!Number.isFinite(convRate.value)) return '--'
  return new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(convAmount.value * convRate.value)
})
const convRateInfo = computed(() => Number.isFinite(convRate.value) ? formatRate(convRate.value, 6) : '')
const stats = computed(() => [
  { label: '支持币种', value: hasData.value ? allCurrencies.value.length : '--', icon: Coin, tone: 'tone-pink' },
  { label: '重点货币', value: '4', icon: StarFilled, tone: 'tone-gold' },
  { label: '检查频率', value: '30 秒', icon: Timer, tone: 'tone-green' },
  { label: '最后更新', value: updatedLabel.value, icon: Clock, tone: 'tone-purple' },
])
const filteredCurrencies = computed(() => {
  const query = searchQuery.value.toLowerCase()
  let list = allCurrencies.value.filter((item) => !favoriteOnly.value || isFavorite(item.code))
  if (query) list = list.filter((item) => item.code.toLowerCase().includes(query) || item.name.toLowerCase().includes(query))
  if (sortBy.value === 'code') list = [...list].sort((a, b) => a.code.localeCompare(b.code))
  if (sortBy.value === 'rateDesc') list = [...list].sort((a, b) => (b.rate ?? -Infinity) - (a.rate ?? -Infinity))
  if (sortBy.value === 'rateAsc') list = [...list].sort((a, b) => (a.rate ?? Infinity) - (b.rate ?? Infinity))
  return list
})
const totalPages = computed(() => Math.max(1, Math.ceil(filteredCurrencies.value.length / pageSize)))
const pagedCurrencies = computed(() => filteredCurrencies.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize))

function currencyMeta(code) { return getCurrencyMeta(code) }
function currencyName(code) { return currencyMeta(code).name }
function readFavorites() {
  try { return JSON.parse(localStorage.getItem('bailuio_currency_favorites') || '["USD","AUD","GBP","JPY"]') }
  catch { return ['USD', 'AUD', 'GBP', 'JPY'] }
}
function isFavorite(code) { return favorites.value.includes(code) }
function toggleFavorite(code) {
  favorites.value = isFavorite(code) ? favorites.value.filter((item) => item !== code) : [...favorites.value, code]
  localStorage.setItem('bailuio_currency_favorites', JSON.stringify(favorites.value))
}
function selectSource(code) { convFrom.value = code; converterRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }
function selectTarget(code) { convTo.value = code; converterRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }
function swapConv() { [convFrom.value, convTo.value] = [convTo.value, convFrom.value] }
async function refreshRates() { try { await refresh({ force: true }) } catch {} }
async function loadSparklines() {
  try {
    const history = await fetchHistory(14)
    const next = {}
    HOT_CURRENCIES.slice(0, 8).forEach((code) => { next[code] = getCNYHistory(history, code) })
    sparkData.value = next
  } catch {}
}

watch([searchQuery, sortBy, favoriteOnly], () => { currentPage.value = 1 })
watch(totalPages, (pages) => { if (currentPage.value > pages) currentPage.value = pages })
onMounted(() => {
  refresh().catch(() => {})
  loadSparklines()
  timer = setInterval(() => refresh().catch(() => {}), 30_000)
})
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.home-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; }
.eyebrow { display: flex; align-items: center; gap: 8px; margin-bottom: 9px; color: var(--color-primary); font-size: 11px; font-weight: 800; letter-spacing: .06em; }
.heading-actions { display: flex; align-items: center; gap: 9px; }
.stat-grid { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 12px; margin-bottom: 18px; }
.stat-card { min-width: 0; min-height: 94px; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 17px; border: 1px solid var(--color-border); border-radius: 16px; background: white; box-shadow: var(--shadow-card); }
.stat-value { min-width: 52px; min-height: 28px; color: var(--color-text); font-size: 23px; font-weight: 820; line-height: 1.2; letter-spacing: -.03em; }
.stat-label { margin-top: 5px; color: var(--color-text-muted); font-size: 11px; font-weight: 650; }
.stat-icon { width: 42px; height: 42px; flex: 0 0 auto; display: grid; place-items: center; border-radius: 13px; }
.stat-icon :deep(svg) { width: 19px; height: 19px; }
.tone-pink { background: var(--color-primary-light); color: var(--color-primary); }
.tone-gold { background: #FFF5DF; color: #D98D20; }
.tone-green { background: var(--color-success-light); color: var(--color-success); }
.tone-purple { background: #F3EEFF; color: #8669D3; }
.converter-card { padding: clamp(18px, 2.6vw, 28px); margin-bottom: 26px; }
.converter-heading { margin-bottom: 18px; }
.converter-heading .section-note { margin: 5px 0 0; }
.live-badge { display: inline-flex; align-items: center; gap: 7px; min-height: 29px; padding: 0 10px; border-radius: 999px; background: var(--color-success-light); color: var(--color-success); font-size: 11px; font-weight: 750; }
.converter-grid { display: grid; grid-template-columns: minmax(0,1fr) 42px minmax(0,1fr); align-items: end; gap: 13px; }
.currency-panel { min-width: 0; padding: 15px; border: 1px solid; border-radius: 15px; }
.source-panel { border-color: #F3D5E0; background: #FFF7F9; }
.result-panel { border-color: #CDEBDD; background: #F3FBF7; }
.panel-label { display: flex; align-items: center; justify-content: space-between; margin-bottom: 9px; color: var(--color-text-muted); font-size: 11px; font-weight: 700; }
.source-panel .panel-label strong { color: var(--color-primary); }
.result-panel .panel-label strong { color: var(--color-success); }
.currency-select { width: 100%; min-width: 0; max-width: 100%; height: 42px; border: 1px solid #EFCBD8; border-radius: 11px; background: white; padding: 0 11px; color: var(--color-text); font-size: 13px; font-weight: 700; outline: none; }
.currency-select:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(232,93,142,.10); }
.result-select { border-color: #BFE4D2; }
.result-select:focus { border-color: var(--color-success); box-shadow: 0 0 0 3px rgba(32,169,107,.10); }
.amount-row { height: 52px; display: flex; align-items: center; gap: 8px; margin-top: 9px; padding: 0 11px; border-radius: 11px; background: white; }
.currency-symbol { color: var(--color-text-muted); font-size: 13px; font-weight: 750; }
.amount-row input { width: 100%; min-width: 0; border: 0; background: transparent; outline: none; color: var(--color-text); font-size: 21px; font-weight: 820; }
.result-value { flex: 1; min-width: 0; overflow: hidden; color: var(--color-success); font-size: 21px; font-weight: 840; text-overflow: ellipsis; white-space: nowrap; }
.amount-badge { flex: 0 0 auto; padding: 5px 9px; border-radius: 999px; color: white; font-size: 10px; font-weight: 800; }
.source-badge { background: var(--color-primary); }
.result-badge { background: var(--color-success); }
.swap-button { width: 42px; height: 42px; display: grid; place-items: center; margin-bottom: 30px; border: 1px solid var(--color-border); border-radius: 50%; background: white; color: var(--color-primary); box-shadow: var(--shadow-card); transition: .18s; }
.swap-button:hover { border-color: var(--color-primary); background: var(--color-primary); color: white; transform: rotate(180deg); }
.swap-button svg { width: 17px; }
.rate-summary { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-top: 14px; padding: 10px 13px; border-radius: 11px; background: #FBF7F9; color: var(--color-text-muted); font-size: 11px; }
.rate-summary strong { color: var(--color-primary); }
.content-section { margin-top: 25px; }
.text-link { display: inline-flex; align-items: center; gap: 4px; color: var(--color-primary); font-size: 12px; font-weight: 750; text-decoration: none; }
.text-link svg { width: 14px; }
.hot-grid { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 12px; }
.hot-card { min-width: 0; padding: 16px; text-align: left; transition: transform .18s, box-shadow .18s, border-color .18s; }
.hot-card:hover { transform: translateY(-2px); border-color: #E7C7D3; box-shadow: var(--shadow-hover); }
.hot-card.is-selected { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(232,93,142,.08), var(--shadow-card); }
.hot-card-top { display: flex; align-items: center; gap: 9px; }
.currency-flag { font-size: 22px; line-height: 1; }
.hot-card-top span:nth-child(2) { display: flex; flex-direction: column; min-width: 0; }
.hot-card-top strong { color: var(--color-text); font-size: 13px; }
.hot-card-top small { color: var(--color-text-muted); font-size: 10px; }
.card-action { margin-left: auto; opacity: 0; color: var(--color-primary); font-size: 9px; font-weight: 750; transition: opacity .18s; }
.hot-card:hover .card-action, .hot-card:focus-visible .card-action { opacity: 1; }
.hot-rate { display: flex; align-items: baseline; gap: 6px; margin-top: 15px; }
.hot-rate small, .hot-rate span { color: var(--color-text-muted); font-size: 9px; }
.hot-rate strong { color: var(--color-text); font-size: 22px; font-weight: 840; letter-spacing: -.035em; }
.hot-chart { height: 49px; margin-top: 10px; }
.hot-card-skeleton { min-height: 158px; padding: 16px; }
.skeleton-title { width: 54%; height: 20px; }
.skeleton-number { width: 74%; height: 28px; margin-top: 20px; }
.skeleton-chart { width: 100%; height: 32px; margin-top: 15px; }
.currencies-heading { align-items: flex-end; }
.currency-tools { display: flex; align-items: center; gap: 8px; }
.search-box { width: min(220px, 28vw); height: 40px; display: flex; align-items: center; gap: 8px; padding: 0 11px; border: 1px solid var(--color-border); border-radius: 11px; background: white; transition: border-color .18s, box-shadow .18s; }
.search-box:focus-within { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(232,93,142,.10); }
.search-box svg { width: 15px; flex: 0 0 auto; color: var(--color-text-muted); }
.search-box input { width: 100%; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--color-text); font-size: 12px; }
.filter-button, .sort-select { height: 40px; border: 1px solid var(--color-border); border-radius: 11px; background: white; color: var(--color-text-soft); font-size: 11px; font-weight: 700; }
.filter-button { display: inline-flex; align-items: center; gap: 6px; padding: 0 11px; }
.filter-button svg { width: 14px; }
.filter-button.is-active { border-color: #EFC8D6; background: var(--color-primary-light); color: var(--color-primary); }
.sort-select { padding: 0 9px; outline: 0; }
.currency-table-card { overflow: hidden; }
.table-row { display: grid; grid-template-columns: 1.1fr 1fr .9fr 1.3fr 1.1fr; align-items: center; min-height: 52px; padding: 0 16px; border-bottom: 1px solid var(--color-border-subtle); font-size: 12px; }
.table-row:last-child { border-bottom: 0; }
.table-row:not(.table-header):hover { background: #FFFAFC; }
.table-header { min-height: 43px; background: #FBF7F9; color: var(--color-text-muted); font-size: 10px; font-weight: 800; letter-spacing: .04em; }
.align-right { text-align: right; }
.currency-identity { display: flex; align-items: center; gap: 7px; }
.favorite-icon { width: 26px; height: 26px; display: grid; place-items: center; border: 0; background: transparent; color: #C7B4BC; }
.favorite-icon:hover, .favorite-icon:has(.el-icon) { color: var(--color-primary); }
.favorite-icon svg { width: 14px; }
.muted-text { color: var(--color-text-soft); }
.mono-value { color: var(--color-text); font-family: var(--font-mono); font-size: 11px; }
.table-actions { display: flex; justify-content: flex-end; gap: 5px; }
.table-actions button { padding: 5px 8px; border: 1px solid #F0D4DF; border-radius: 8px; background: #FFF7F9; color: var(--color-primary); font-size: 10px; font-weight: 750; }
.table-actions .result-action { border-color: #CBE9DA; background: #F1FAF6; color: var(--color-success); }
.mobile-currency-list { display: none; }
.empty-state { min-height: 230px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--color-text-muted); text-align: center; }
.empty-state svg { width: 28px; }
.empty-state h3 { margin: 12px 0 4px; color: var(--color-text); font-size: 14px; }
.empty-state p { margin: 0; font-size: 11px; }
.pagination { min-height: 55px; display: flex; align-items: center; justify-content: center; gap: 14px; border-top: 1px solid var(--color-border); color: var(--color-text-soft); font-size: 11px; }
.pagination button { width: 32px; height: 32px; display: grid; place-items: center; border: 1px solid var(--color-border); border-radius: 9px; background: white; color: var(--color-text-soft); }
.pagination button:disabled { opacity: .35; }
.pagination svg { width: 13px; }
.page-footer { padding: 34px 0 0; color: var(--color-text-muted); font-size: 10px; text-align: center; }

@media (max-width: 1024px) {
  .hot-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .stat-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .currencies-heading { align-items: flex-start; flex-direction: column; }
  .currency-tools { width: 100%; }
  .search-box { flex: 1; width: auto; }
}
@media (max-width: 720px) {
  .home-heading { align-items: flex-start; flex-direction: column; }
  .heading-actions { width: 100%; justify-content: space-between; }
  .converter-grid { grid-template-columns: 1fr; }
  .swap-button { margin: -2px auto; transform: rotate(90deg); }
  .swap-button:hover { transform: rotate(270deg); }
  .rate-summary { align-items: flex-start; flex-direction: column; }
  .desktop-table { display: none; }
  .mobile-currency-list { display: grid; gap: 10px; padding: 10px; }
  .mobile-currency-card { padding: 13px; border: 1px solid var(--color-border); border-radius: 13px; background: white; }
  .mobile-currency-head { display: flex; align-items: center; justify-content: space-between; }
  .mobile-currency-head > div { display: flex; align-items: center; gap: 7px; }
  .mobile-currency-head strong { font-size: 13px; }
  .mobile-currency-head small { color: var(--color-text-muted); font-size: 10px; }
  .mobile-rate { display: flex; align-items: baseline; gap: 6px; margin-top: 13px; }
  .mobile-rate small, .mobile-rate span { color: var(--color-text-muted); font-size: 9px; }
  .mobile-rate strong { font-size: 20px; }
  .mobile-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin-top: 12px; }
  .mobile-actions button { height: 34px; border: 1px solid #F0D4DF; border-radius: 9px; background: #FFF7F9; color: var(--color-primary); font-size: 10px; font-weight: 750; }
  .mobile-actions button:last-child { border-color: #CBE9DA; background: #F1FAF6; color: var(--color-success); }
}
@media (max-width: 520px) {
  .stat-grid { gap: 9px; }
  .stat-card { min-height: 84px; padding: 13px; }
  .stat-icon { width: 36px; height: 36px; }
  .stat-value { font-size: 19px; }
  .hot-grid { grid-template-columns: 1fr; }
  .currency-tools { display: grid; grid-template-columns: 1fr 1fr; }
  .search-box { grid-column: 1 / -1; width: 100%; }
  .sort-select { min-width: 0; width: 100%; }
  .filter-button { justify-content: center; }
  .amount-badge { display: none; }
}
</style>
