<template>
  <div class="page-shell trends-page">
    <header class="page-heading trends-heading">
      <div>
        <h1 class="page-title">走势分析</h1>
        <p class="page-description">查看主要货币兑人民币的历史参考价，支持悬停读数与全屏大图。</p>
      </div>
      <div class="range-tabs" aria-label="走势时间范围">
        <button v-for="range in ranges" :key="range.days" :class="{ 'is-active': activeRange === range.days }" :disabled="loading" @click="loadRange(range.days)">{{ range.label }}</button>
      </div>
    </header>

    <div v-if="loadError" class="error-banner" role="alert">
      <span>{{ loadError }}</span>
      <button class="secondary-button" @click="loadRange(activeRange)">重新加载</button>
    </div>

    <section v-if="focusData" class="surface-card focus-card" :aria-busy="loading">
      <div class="focus-head">
        <div class="focus-identity">
          <span>{{ focusData.flag }}</span>
          <div><h2>{{ focusData.unit }} {{ focusData.code }} / CNY</h2><p>{{ focusData.name }}兑人民币 · {{ activeRange }} 天走势</p></div>
        </div>
        <div class="focus-actions">
          <select v-model="focusCode" class="focus-select" aria-label="选择趋势币种">
            <option v-for="currency in trendOptions" :key="currency.code" :value="currency.code">{{ currency.flag }} {{ currency.code }} · {{ currency.name }}</option>
          </select>
          <button class="secondary-button" @click="openFullscreen"><FullScreen />全屏查看</button>
        </div>
      </div>

      <div class="chart-summary">
        <div><small>当前参考价</small><strong>{{ formatRate(focusData.current) }} <span>CNY</span></strong></div>
        <span class="change-pill" :class="focusData.change >= 0 ? 'is-up' : 'is-down'">{{ focusData.change >= 0 ? '↑' : '↓' }} {{ Math.abs(focusData.change).toFixed(2) }}%</span>
      </div>

      <div class="main-chart" :class="{ 'is-loading': loading }">
        <TrendChart :points="focusData.points" :color="focusData.color" unit-label="CNY" />
        <div v-if="loading" class="chart-loading"><Refresh class="is-spinning" /> 正在更新历史数据</div>
      </div>

      <div class="trend-stats">
        <article v-for="stat in focusStats" :key="stat.label"><span>{{ stat.label }}</span><strong :class="stat.tone">{{ stat.value }}</strong><small>{{ stat.note }}</small></article>
      </div>
      <p v-if="sampled" class="sample-note"><InfoFilled /> 长周期采用均匀采样，在保持趋势准确的同时减少加载等待。</p>
    </section>

    <section v-else-if="loading" class="surface-card focus-skeleton" aria-busy="true">
      <div class="skeleton sk-head" /><div class="skeleton sk-chart" /><div class="sk-stats"><i v-for="index in 4" :key="index" class="skeleton" /></div>
    </section>

    <section v-else class="surface-card empty-trends">
      <TrendCharts /><h2>暂时没有历史走势</h2><p>数据源可能正在更新，请稍后重试。</p><button class="primary-button" @click="loadRange(activeRange)"><Refresh />重新加载</button>
    </section>

    <section v-if="otherTrends.length" class="trend-list-section">
      <div class="section-heading"><div><h2 class="section-title">其他主要货币</h2><p class="section-note">点击卡片切换到主图，也可以直接全屏查看</p></div></div>
      <div class="trend-grid">
        <button v-for="currency in otherTrends" :key="currency.code" class="surface-card trend-card" @click="selectTrend(currency.code)">
          <div class="trend-card-head">
            <span>{{ currency.flag }}</span>
            <div><strong>{{ currency.unit }} {{ currency.code }}</strong><small>{{ currency.name }}</small></div>
            <b :class="currency.change >= 0 ? 'is-up' : 'is-down'">{{ currency.change >= 0 ? '+' : '' }}{{ currency.change.toFixed(2) }}%</b>
          </div>
          <div class="trend-card-chart"><Sparkline :data="currency.points" :color="currency.color" /></div>
          <div class="trend-card-foot"><span>当前</span><strong>{{ formatRate(currency.current) }} CNY</strong><ArrowRight /></div>
        </button>
      </div>
    </section>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="fullscreenOpen && focusData" class="modal-backdrop" role="presentation" @click.self="closeFullscreen">
          <section class="chart-modal" role="dialog" aria-modal="true" :aria-label="`${focusData.name}历史走势大图`">
            <header class="modal-head">
              <div class="focus-identity"><span>{{ focusData.flag }}</span><div><h2>{{ focusData.unit }} {{ focusData.code }} / CNY</h2><p>{{ activeRange }} 天历史走势 · 悬停图表查看每日数据</p></div></div>
              <button ref="closeButton" class="icon-button" aria-label="关闭全屏图表" @click="closeFullscreen"><Close /></button>
            </header>
            <div class="modal-chart"><TrendChart :points="focusData.points" :color="focusData.color" unit-label="CNY" /></div>
            <footer class="modal-stats"><article v-for="stat in focusStats" :key="`modal-${stat.label}`"><span>{{ stat.label }}</span><strong :class="stat.tone">{{ stat.value }}</strong></article></footer>
          </section>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { ArrowRight, Close, FullScreen, InfoFilled, Refresh, TrendCharts } from '@element-plus/icons-vue'
import Sparkline from '../components/Sparkline.vue'
import TrendChart from '../components/TrendChart.vue'
import {
  CURRENCY_META, HOT_CURRENCIES, fetchHistory, formatRate,
  getCNYHistoryPoints,
} from '../api/exchangeRate.js'

const ranges = [
  { days: 7, label: '7 天' }, { days: 30, label: '30 天' },
  { days: 90, label: '90 天' }, { days: 180, label: '180 天' },
  { days: 360, label: '1 年' },
]
const activeRange = ref(30)
const loading = ref(true)
const loadError = ref('')
const sampled = ref(false)
const allTrends = ref([])
const focusCode = ref('USD')
const fullscreenOpen = ref(false)
const closeButton = ref(null)

const trendOptions = computed(() => HOT_CURRENCIES.slice(0, 10).map((code) => ({ code, ...(CURRENCY_META[code] || { name: code, flag: '🌐' }) })))
const focusData = computed(() => allTrends.value.find((item) => item.code === focusCode.value) || allTrends.value[0] || null)
const otherTrends = computed(() => allTrends.value.filter((item) => item.code !== focusData.value?.code).slice(0, 8))
const focusStats = computed(() => {
  const data = focusData.value
  if (!data) return []
  return [
    { label: '当前值', value: `${formatRate(data.current)} CNY`, note: '区间最后数据', tone: '' },
    { label: '区间最高', value: `${formatRate(data.high)} CNY`, note: '最高参考价', tone: 'success' },
    { label: '区间最低', value: `${formatRate(data.low)} CNY`, note: '最低参考价', tone: 'danger' },
    { label: '区间变化', value: `${data.change >= 0 ? '+' : ''}${data.change.toFixed(2)}%`, note: `${data.points.length} 个数据点`, tone: data.change >= 0 ? 'danger' : 'success' },
  ]
})

function createTrend(code, history) {
  const points = getCNYHistoryPoints(history, code)
  if (points.length < 2) return null
  const values = points.map((point) => point.value)
  const first = values[0]
  const current = values.at(-1)
  return {
    code,
    ...(CURRENCY_META[code] || { name: code, flag: '🌐', color: '#E85D8E' }),
    unit: CURRENCY_META[code]?.unit || 1,
    points,
    current,
    high: Math.max(...values),
    low: Math.min(...values),
    change: first ? (current - first) / first * 100 : 0,
  }
}
async function loadRange(days) {
  activeRange.value = days
  loading.value = true
  loadError.value = ''
  try {
    const history = await fetchHistory(days)
    const next = HOT_CURRENCIES.slice(0, 10).map((code) => createTrend(code, history)).filter(Boolean)
    if (!next.length) throw new Error('历史数据为空')
    allTrends.value = next
    sampled.value = Boolean(history.sampled)
    if (!next.some((item) => item.code === focusCode.value)) focusCode.value = next[0].code
  } catch (error) {
    console.error('走势数据加载失败', error)
    loadError.value = allTrends.value.length ? '新数据加载失败，当前继续显示上一次走势。' : '历史数据暂时无法加载，请稍后重试。'
  } finally {
    loading.value = false
  }
}
function selectTrend(code) { focusCode.value = code; document.querySelector('.focus-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
async function openFullscreen() { fullscreenOpen.value = true; await nextTick(); closeButton.value?.focus() }
function closeFullscreen() { fullscreenOpen.value = false }
function onKeydown(event) { if (event.key === 'Escape' && fullscreenOpen.value) closeFullscreen() }

watch(fullscreenOpen, (open) => { document.body.style.overflow = open ? 'hidden' : '' })
onMounted(() => { window.addEventListener('keydown', onKeydown); loadRange(activeRange.value) })
onUnmounted(() => { window.removeEventListener('keydown', onKeydown); document.body.style.overflow = '' })
</script>

<style scoped>
.trends-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; }
.range-tabs { display: flex; gap: 4px; padding: 4px; border: 1px solid var(--color-border); border-radius: 12px; background: white; }
.range-tabs button { min-width: 51px; height: 32px; border: 0; border-radius: 8px; background: transparent; color: var(--color-text-soft); font-size: 10px; font-weight: 750; transition: .18s; }
.range-tabs button:hover { background: var(--color-bg-soft); color: var(--color-text); }
.range-tabs button.is-active { background: var(--color-primary); color: white; box-shadow: 0 6px 14px rgba(232,93,142,.16); }
.focus-card { position: relative; padding: clamp(18px,2.6vw,28px); overflow: hidden; }
.focus-head, .focus-actions, .focus-identity { display: flex; align-items: center; }
.focus-head { justify-content: space-between; gap: 16px; }
.focus-identity { gap: 11px; min-width: 0; }
.focus-identity > span { font-size: 27px; line-height: 1; }
.focus-identity h2 { margin: 0; color: var(--color-text); font-size: 15px; font-weight: 820; }
.focus-identity p { margin: 4px 0 0; color: var(--color-text-muted); font-size: 10px; }
.focus-actions { gap: 8px; }
.focus-select { height: 40px; max-width: 190px; border: 1px solid var(--color-border); border-radius: 11px; background: white; padding: 0 10px; color: var(--color-text); font-size: 11px; font-weight: 700; outline: 0; }
.focus-select:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(232,93,142,.1); }
.chart-summary { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; margin-top: 24px; }
.chart-summary > div { display: flex; flex-direction: column; gap: 4px; }
.chart-summary small { color: var(--color-text-muted); font-size: 10px; }
.chart-summary strong { color: var(--color-text); font-size: 28px; font-weight: 850; letter-spacing: -.04em; }
.chart-summary strong span { color: var(--color-text-muted); font-size: 11px; }
.change-pill { padding: 6px 10px; border-radius: 999px; font-size: 11px; font-weight: 800; }
.change-pill.is-up { background: #FFF0F3; color: var(--color-danger); }
.change-pill.is-down { background: var(--color-success-light); color: var(--color-success); }
.main-chart { position: relative; height: 330px; margin-top: 8px; transition: opacity .2s; }
.main-chart.is-loading > :first-child { opacity: .42; }
.chart-loading { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px; border-radius: 13px; background: rgba(255,255,255,.72); color: var(--color-text-soft); font-size: 11px; font-weight: 700; backdrop-filter: blur(2px); }
.chart-loading svg { width: 17px; color: var(--color-primary); }
.trend-stats { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 9px; margin-top: 12px; }
.trend-stats article { display: flex; flex-direction: column; gap: 4px; min-width: 0; padding: 13px; border: 1px solid var(--color-border-subtle); border-radius: 12px; background: #FCFAFB; }
.trend-stats span, .trend-stats small { color: var(--color-text-muted); font-size: 9px; }
.trend-stats strong { overflow: hidden; color: var(--color-text); font-size: 13px; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
.trend-stats strong.success { color: var(--color-success); }
.trend-stats strong.danger { color: var(--color-danger); }
.sample-note { display: flex; align-items: center; gap: 6px; margin: 13px 0 0; color: var(--color-text-muted); font-size: 9px; }
.sample-note svg { width: 13px; }
.focus-skeleton { padding: 26px; }
.sk-head { width: 260px; height: 32px; }
.sk-chart { width: 100%; height: 300px; margin-top: 25px; }
.sk-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 9px; margin-top: 12px; }
.sk-stats i { height: 72px; }
.empty-trends { min-height: 430px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.empty-trends > svg { width: 38px; color: var(--color-primary); }
.empty-trends h2 { margin: 15px 0 5px; font-size: 16px; }
.empty-trends p { margin: 0 0 18px; color: var(--color-text-soft); font-size: 12px; }
.trend-list-section { margin-top: 25px; }
.trend-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 12px; }
.trend-card { min-width: 0; padding: 16px; text-align: left; transition: transform .18s, border-color .18s, box-shadow .18s; }
.trend-card:hover { transform: translateY(-2px); border-color: #E7C7D3; box-shadow: var(--shadow-hover); }
.trend-card-head { display: flex; align-items: center; gap: 9px; }
.trend-card-head > span { font-size: 21px; }
.trend-card-head div { display: flex; flex-direction: column; min-width: 0; }
.trend-card-head strong { color: var(--color-text); font-size: 12px; }
.trend-card-head small { color: var(--color-text-muted); font-size: 9px; }
.trend-card-head b { margin-left: auto; font-size: 10px; }
.trend-card-head b.is-up { color: var(--color-danger); }
.trend-card-head b.is-down { color: var(--color-success); }
.trend-card-chart { height: 60px; margin-top: 12px; }
.trend-card-foot { display: flex; align-items: center; gap: 6px; padding-top: 11px; border-top: 1px solid var(--color-border-subtle); color: var(--color-text-muted); font-size: 9px; }
.trend-card-foot strong { margin-left: auto; color: var(--color-text); font-size: 10px; }
.trend-card-foot svg { width: 12px; color: var(--color-primary); }
.modal-backdrop { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; padding: 20px; background: rgba(43,31,38,.36); backdrop-filter: blur(5px); }
.chart-modal { width: min(1040px,100%); max-height: calc(100dvh - 40px); display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--color-border); border-radius: 20px; background: white; box-shadow: var(--shadow-floating); }
.modal-head { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 18px 20px; border-bottom: 1px solid var(--color-border); }
.modal-chart { height: min(58vh,560px); padding: 18px 22px 4px; }
.modal-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 9px; padding: 14px 20px 20px; border-top: 1px solid var(--color-border); }
.modal-stats article { display: flex; flex-direction: column; gap: 5px; padding: 11px; border-radius: 11px; background: #FBF8FA; }
.modal-stats span { color: var(--color-text-muted); font-size: 9px; }
.modal-stats strong { color: var(--color-text); font-size: 12px; }
.modal-stats strong.success { color: var(--color-success); }
.modal-stats strong.danger { color: var(--color-danger); }
.modal-enter-active, .modal-leave-active { transition: opacity .2s; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .chart-modal, .modal-leave-active .chart-modal { transition: transform .22s; }
.modal-enter-from .chart-modal, .modal-leave-to .chart-modal { transform: scale(.97) translateY(8px); }

@media (max-width: 900px) { .trend-grid { grid-template-columns: repeat(2,minmax(0,1fr)); } }
@media (max-width: 700px) {
  .trends-heading { align-items: flex-start; flex-direction: column; }
  .range-tabs { width: 100%; overflow-x: auto; }
  .range-tabs button { flex: 1; min-width: 52px; }
  .focus-head { align-items: flex-start; flex-direction: column; }
  .focus-actions { width: 100%; }
  .focus-select { flex: 1; max-width: none; min-width: 0; }
  .main-chart { height: 280px; }
  .trend-stats { grid-template-columns: repeat(2,minmax(0,1fr)); }
  .modal-backdrop { padding: 8px; }
  .chart-modal { max-height: calc(100dvh - 16px); border-radius: 16px; }
  .modal-chart { height: 52vh; padding: 10px 8px 0; }
  .modal-stats { grid-template-columns: repeat(2,1fr); padding: 10px; }
}
@media (max-width: 520px) {
  .focus-actions .secondary-button { width: 42px; padding: 0; font-size: 0; }
  .focus-actions .secondary-button svg { width: 17px; }
  .chart-summary strong { font-size: 23px; }
  .trend-grid { grid-template-columns: 1fr; }
  .main-chart { height: 245px; }
}
</style>
