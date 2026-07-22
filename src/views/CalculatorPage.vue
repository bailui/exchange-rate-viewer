<template>
  <div class="page-shell calculator-page">
    <header class="page-heading calculator-heading">
      <div>
        <h1 class="page-title">汇率换算</h1>
        <p class="page-description">支持全球币种互换，清楚显示币种名称、金额与参考汇率。</p>
      </div>
      <span class="status-pill"><span class="status-dot" /> {{ hasData ? `更新于 ${updatedLabel}` : '正在连接数据源' }}</span>
    </header>

    <div v-if="error" class="error-banner" role="alert"><span>{{ error }}</span><button class="secondary-button" @click="refresh({ force: true }).catch(() => {})">重试</button></div>

    <div class="calculator-layout">
      <section class="surface-card calculator-card">
        <div class="section-heading">
          <div><h2 class="section-title">金额换算</h2><p class="section-note">输入金额后自动计算，不会清空已输入内容</p></div>
          <span class="pair-pill">{{ fromCurrency }} / {{ toCurrency }}</span>
        </div>

        <div class="large-currency-box source-box">
          <div class="box-head"><span>持有货币</span><strong>{{ getCurrencyMeta(fromCurrency).name }}</strong></div>
          <div class="currency-input-grid">
            <select v-model="fromCurrency" class="box-select" aria-label="持有货币">
              <option v-for="currency in currencies" :key="`calc-from-${currency.code}`" :value="currency.code">{{ currency.flag }} {{ currency.code }} · {{ currency.name }}</option>
            </select>
            <label class="amount-input">
              <span>{{ getCurrencyMeta(fromCurrency).symbol || fromCurrency }}</span>
              <input v-model.number="amount" type="number" min="0" inputmode="decimal" aria-label="换算金额" placeholder="输入金额" />
              <b>{{ getCurrencyMeta(fromCurrency).name }}</b>
            </label>
          </div>
        </div>

        <div class="swap-row">
          <span />
          <button aria-label="交换币种" title="交换币种" @click="swapCurrencies"><Switch /></button>
          <span />
        </div>

        <div class="large-currency-box target-box">
          <div class="box-head"><span>兑换结果</span><strong>{{ getCurrencyMeta(toCurrency).name }}</strong></div>
          <div class="currency-input-grid">
            <select v-model="toCurrency" class="box-select target-select" aria-label="目标货币">
              <option v-for="currency in currencies" :key="`calc-to-${currency.code}`" :value="currency.code">{{ currency.flag }} {{ currency.code }} · {{ currency.name }}</option>
            </select>
            <div class="result-output">
              <span>{{ getCurrencyMeta(toCurrency).symbol || toCurrency }}</span>
              <output>{{ result }}</output>
              <b>{{ getCurrencyMeta(toCurrency).name }}</b>
            </div>
          </div>
        </div>

        <div class="conversion-summary">
          <div><small>当前参考汇率</small><strong v-if="rateInfo">1 {{ fromCurrency }} = {{ rateInfo }} {{ toCurrency }}</strong><strong v-else>等待汇率数据</strong></div>
          <span>每 30 秒检查更新</span>
        </div>

        <div class="calculator-actions">
          <button class="primary-button" :disabled="result === '--'" @click="copyResult"><DocumentCopy />{{ copied ? '已复制' : '复制并保存记录' }}</button>
          <button class="secondary-button" @click="amount = null"><Delete />清空金额</button>
        </div>
      </section>

      <aside class="side-stack">
        <section class="surface-card side-card">
          <div class="side-card-head"><h2>重点币种</h2><small>点击设为持有</small></div>
          <div class="focus-currency-list">
            <button v-for="currency in focusCurrencies" :key="currency.code" :class="{ 'is-active': fromCurrency === currency.code }" @click="fromCurrency = currency.code">
              <span>{{ currency.flag }}</span><b>{{ currency.code }}</b><small>{{ currency.name }}</small>
            </button>
          </div>
        </section>

        <section class="surface-card side-card history-card">
          <div class="side-card-head"><h2>最近换算</h2><button v-if="history.length" @click="clearHistory">清空</button></div>
          <div v-if="!history.length" class="mini-empty"><Clock /><p>复制结果后会保存在这里</p></div>
          <div v-else class="history-list">
            <button v-for="item in history" :key="item.id" @click="applyHistory(item)">
              <span><b>{{ item.amount }} {{ item.from }}</b><small>{{ currencyName(item.from) }} → {{ currencyName(item.to) }}</small></span>
              <strong>{{ item.result }} {{ item.to }}</strong>
            </button>
          </div>
        </section>

        <section class="assist-card">
          <InfoFilled />
          <div><strong>汇率说明</strong><p>当前使用公开市场参考汇率，银行现钞、现汇与手续费会造成实际金额差异。</p></div>
        </section>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { Clock, Delete, DocumentCopy, InfoFilled, Switch } from '@element-plus/icons-vue'
import {
  CNY_ENTRY, CURRENCY_META, HOT_CURRENCIES, buildCurrencyOptions,
  formatRate, getCrossRate, getCurrencyMeta,
} from '../api/exchangeRate.js'
import { useExchangeRates } from '../composables/useExchangeRates.js'

const { rates, hasData, updatedLabel, error, refresh } = useExchangeRates()
const amount = ref(100)
const fromCurrency = ref('USD')
const toCurrency = ref('CNY')
const copied = ref(false)
const history = ref(readHistory())
let copiedTimer

const fallback = [CNY_ENTRY, ...HOT_CURRENCIES.map((code) => ({ code, ...CURRENCY_META[code], unit: CURRENCY_META[code]?.unit || 1 }))]
const currencies = computed(() => hasData.value ? buildCurrencyOptions(rates.value) : fallback)
const focusCurrencies = computed(() => currencies.value.filter((item) => ['USD', 'AUD', 'GBP', 'JPY', 'CNY', 'EUR'].includes(item.code)))
const crossRate = computed(() => getCrossRate(rates.value, fromCurrency.value, toCurrency.value))
const result = computed(() => {
  if (amount.value === null || amount.value === '' || Number(amount.value) < 0) return '0.00'
  if (!Number.isFinite(crossRate.value)) return '--'
  return new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(Number(amount.value) * crossRate.value)
})
const rateInfo = computed(() => Number.isFinite(crossRate.value) ? formatRate(crossRate.value, 6) : '')

function currencyName(code) { return getCurrencyMeta(code).name }
function swapCurrencies() { [fromCurrency.value, toCurrency.value] = [toCurrency.value, fromCurrency.value] }
function readHistory() {
  try { return JSON.parse(localStorage.getItem('fx_conv_history_v2') || '[]') }
  catch { return [] }
}
function persistHistory() { localStorage.setItem('fx_conv_history_v2', JSON.stringify(history.value)) }
function saveCurrent() {
  if (!Number(amount.value) || result.value === '--') return
  const item = { id: Date.now(), amount: Number(amount.value), from: fromCurrency.value, to: toCurrency.value, result: result.value }
  history.value = [item, ...history.value.filter((old) => !(old.amount === item.amount && old.from === item.from && old.to === item.to))].slice(0, 6)
  persistHistory()
}
function applyHistory(item) { amount.value = item.amount; fromCurrency.value = item.from; toCurrency.value = item.to }
function clearHistory() { history.value = []; persistHistory() }
async function copyResult() {
  const text = `${amount.value} ${fromCurrency.value} = ${result.value} ${toCurrency.value}`
  try { await navigator.clipboard.writeText(text) }
  catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    textarea.remove()
  }
  saveCurrent()
  copied.value = true
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => { copied.value = false }, 1800)
}

onMounted(() => refresh().catch(() => {}))
</script>

<style scoped>
.calculator-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; }
.calculator-layout { display: grid; grid-template-columns: minmax(0,1fr) 310px; gap: 18px; align-items: start; }
.calculator-card { padding: clamp(18px, 2.6vw, 28px); }
.calculator-card .section-note { margin: 5px 0 0; }
.pair-pill { padding: 6px 10px; border-radius: 999px; background: var(--color-primary-light); color: var(--color-primary); font-size: 10px; font-weight: 800; }
.large-currency-box { padding: 16px; border: 1px solid; border-radius: 15px; }
.source-box { border-color: #F1D2DD; background: #FFF8FA; }
.target-box { border-color: #C8E8D8; background: #F4FBF7; }
.box-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; color: var(--color-text-muted); font-size: 11px; font-weight: 750; }
.source-box .box-head strong { color: var(--color-primary); }
.target-box .box-head strong { color: var(--color-success); }
.currency-input-grid { display: grid; grid-template-columns: minmax(170px,.72fr) minmax(0,1.28fr); gap: 10px; }
.box-select, .amount-input, .result-output { height: 58px; border: 1px solid; border-radius: 12px; background: white; }
.box-select { width: 100%; min-width: 0; padding: 0 12px; border-color: #ECD1DB; color: var(--color-text); font-size: 13px; font-weight: 750; outline: 0; }
.box-select:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(232,93,142,.10); }
.target-select { border-color: #C4E5D4; }
.target-select:focus { border-color: var(--color-success); box-shadow: 0 0 0 3px rgba(32,169,107,.10); }
.amount-input, .result-output { display: flex; align-items: center; gap: 9px; padding: 0 13px; }
.amount-input { border-color: #ECD1DB; }
.amount-input span, .result-output span { color: var(--color-text-muted); font-size: 13px; font-weight: 750; }
.amount-input input { width: 100%; min-width: 0; border: 0; outline: 0; color: var(--color-text); font-size: 22px; font-weight: 840; }
.amount-input b, .result-output b { flex: 0 0 auto; padding: 5px 9px; border-radius: 999px; color: white; font-size: 10px; }
.amount-input b { background: var(--color-primary); }
.result-output { border-color: #C4E5D4; }
.result-output output { flex: 1; min-width: 0; overflow: hidden; color: var(--color-success); font-size: 22px; font-weight: 840; text-overflow: ellipsis; white-space: nowrap; }
.result-output b { background: var(--color-success); }
.swap-row { display: grid; grid-template-columns: 1fr 40px 1fr; align-items: center; gap: 10px; margin: 7px 16px; }
.swap-row span { height: 1px; background: var(--color-border); }
.swap-row button { width: 40px; height: 40px; display: grid; place-items: center; border: 1px solid var(--color-border); border-radius: 50%; background: white; color: var(--color-primary); transition: .18s; }
.swap-row button:hover { border-color: var(--color-primary); background: var(--color-primary); color: white; transform: rotate(180deg); }
.swap-row svg { width: 16px; }
.conversion-summary { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-top: 15px; padding: 13px; border-radius: 12px; background: #FBF7F9; }
.conversion-summary div { display: flex; flex-direction: column; gap: 3px; }
.conversion-summary small, .conversion-summary > span { color: var(--color-text-muted); font-size: 10px; }
.conversion-summary strong { color: var(--color-text); font-size: 12px; }
.calculator-actions { display: flex; gap: 9px; margin-top: 16px; }
.calculator-actions .primary-button { flex: 1; }
.side-stack { display: flex; flex-direction: column; gap: 12px; }
.side-card { padding: 16px; }
.side-card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.side-card-head h2 { margin: 0; color: var(--color-text); font-size: 13px; font-weight: 780; }
.side-card-head small { color: var(--color-text-muted); font-size: 9px; }
.side-card-head button { border: 0; background: transparent; color: var(--color-primary); font-size: 10px; font-weight: 700; }
.focus-currency-list { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 7px; }
.focus-currency-list button { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 2px 7px; padding: 9px; border: 1px solid var(--color-border); border-radius: 10px; background: white; text-align: left; }
.focus-currency-list button:hover, .focus-currency-list button.is-active { border-color: #EBC6D4; background: var(--color-primary-light); }
.focus-currency-list span { grid-row: 1/3; font-size: 18px; }
.focus-currency-list b { color: var(--color-text); font-size: 11px; }
.focus-currency-list small { color: var(--color-text-muted); font-size: 9px; }
.mini-empty { min-height: 110px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--color-text-muted); text-align: center; }
.mini-empty svg { width: 24px; }
.mini-empty p { margin: 8px 0 0; font-size: 10px; }
.history-list { display: flex; flex-direction: column; gap: 6px; }
.history-list button { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 9px; border: 1px solid transparent; border-radius: 10px; background: #FCF9FA; text-align: left; }
.history-list button:hover { border-color: var(--color-border); background: var(--color-bg-soft); }
.history-list span { display: flex; flex-direction: column; gap: 2px; }
.history-list b { color: var(--color-text); font-size: 10px; }
.history-list small { color: var(--color-text-muted); font-size: 8px; }
.history-list strong { flex: 0 0 auto; color: var(--color-success); font-size: 10px; }
.assist-card { display: flex; gap: 10px; padding: 14px; border: 1px solid #F0D8B7; border-radius: 14px; background: #FFF9ED; color: #A36B1F; }
.assist-card svg { width: 17px; flex: 0 0 auto; }
.assist-card strong { font-size: 11px; }
.assist-card p { margin: 4px 0 0; font-size: 9px; line-height: 1.55; }

@media (max-width: 950px) { .calculator-layout { grid-template-columns: 1fr; } .side-stack { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); } .assist-card { grid-column: 1/-1; } }
@media (max-width: 640px) {
  .calculator-heading { align-items: flex-start; flex-direction: column; }
  .currency-input-grid { grid-template-columns: 1fr; }
  .box-select { height: 48px; }
  .amount-input, .result-output { height: 56px; }
  .amount-input b, .result-output b { display: none; }
  .conversion-summary { align-items: flex-start; flex-direction: column; }
  .calculator-actions { display: grid; grid-template-columns: 1fr; }
  .side-stack { grid-template-columns: 1fr; }
  .assist-card { grid-column: auto; }
}
</style>
