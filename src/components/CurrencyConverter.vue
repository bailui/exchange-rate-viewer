<template>
  <div class="converter glass anim-up">
    <div class="conv-header">
      <h3>🧮 汇率计算器</h3>
      <span class="conv-badge">实时换算</span>
    </div>

    <div class="conv-body">
      <!-- 金额输入行 -->
      <div class="conv-row">
        <div class="field">
          <label class="field-label">持有货币</label>
          <div class="field-box">
            <input
              v-model.number="amount"
              type="number" min="0" step="any"
              class="amount-in" placeholder="0"
              @input="convert"
            />
            <span class="field-currency" :style="{ color: fromColor }">
              {{ fromCurrency }}
            </span>
          </div>
        </div>

        <button class="swap-btn" @click="swapCurrencies" title="交换">
          <span>⇄</span>
        </button>

        <div class="field">
          <label class="field-label">兑换结果</label>
          <div class="field-box result-box">
            <span class="result-num">{{ result }}</span>
            <span class="field-currency" :style="{ color: toColor }">
              {{ toCurrency }}
            </span>
          </div>
        </div>
      </div>

      <!-- 货币选择 -->
      <div class="conv-selectors">
        <div class="sel-group">
          <label class="sel-label">从</label>
          <div class="chips">
            <button
              v-for="c in currencies"
              :key="'f-'+c.code"
              :class="['chip', { active: fromCurrency === c.code }]"
              @click="fromCurrency = c.code"
            >
              <span class="chip-flag">{{ c.flag }}</span>
              <span>{{ c.code }}</span>
            </button>
          </div>
        </div>
        <div class="sel-group">
          <label class="sel-label">到</label>
          <div class="chips">
            <button
              v-for="c in currencies"
              :key="'t-'+c.code"
              :class="['chip', { active: toCurrency === c.code }]"
              @click="toCurrency = c.code"
            >
              <span class="chip-flag">{{ c.flag }}</span>
              <span>{{ c.code }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="rate-bar" v-if="rateInfo">
        1 {{ fromCurrency }} = <strong>{{ rateInfo }}</strong> {{ toCurrency }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { FOCUS_CURRENCIES, fetchExchangeRates } from '../api/exchangeRate.js'

const currencies = FOCUS_CURRENCIES
const amount = ref(100)
const fromCurrency = ref('USD')
const toCurrency = ref('CNY')
const allRates = ref({})

async function loadRates() {
  try { const d = await fetchExchangeRates(); allRates.value = d.rates || {} }
  catch {}
}
loadRates()

const fromColor = computed(() => currencies.find(c => c.code === fromCurrency.value)?.color || '#ff5c8a')
const toColor = computed(() => currencies.find(c => c.code === toCurrency.value)?.color || '#ff5c8a')

const result = computed(() => {
  if (!amount.value || amount.value <= 0) return '0.00'
  const r = crossRate()
  return r ? (amount.value * r).toFixed(2) : '--'
})

const rateInfo = computed(() => {
  const r = crossRate()
  return r ? r.toFixed(4) : null
})

function crossRate() {
  const rates = allRates.value
  if (!rates) return null
  const f = fromCurrency.value, t = toCurrency.value
  if (f === t) return 1
  const f2c = f === 'CNY' ? 1 : (rates[f] ? 1 / rates[f] : null)
  const c2t = t === 'CNY' ? 1 : (rates[t] || null)
  if (f2c == null || c2t == null) return null
  return f2c * c2t
}

function swapCurrencies() {
  [fromCurrency.value, toCurrency.value] = [toCurrency.value, fromCurrency.value]
}
function convert() {} // reactive
</script>

<style lang="scss" scoped>
.converter {
  border-radius: var(--radius-xl);
  padding: 24px;
  margin-bottom: 18px;
  box-shadow: var(--glass-shadow);
  position: relative;
  z-index: 1;
}

.conv-header {
  display: flex; align-items: center; gap: 10px; margin-bottom: 18px;
  h3 { font-size: 18px; font-weight: 800; letter-spacing: -.02em; color: var(--text-primary) }
  .conv-badge {
    font-size: 11px; font-weight: 600; color: var(--p-500);
    background: var(--p-100); padding: 3px 10px; border-radius: 100px;
  }
}

.conv-row {
  display: flex; align-items: flex-end; gap: 10px; margin-bottom: 14px;
  .field { flex: 1; display: flex; flex-direction: column; gap: 5px }
}

.field-label {
  font-size: 11px; font-weight: 600; text-transform: uppercase;
  letter-spacing: .05em; color: var(--text-tertiary);
}

.field-box {
  display: flex; align-items: center;
  height: 52px;
  border-radius: var(--radius-md);
  border: 1.5px solid var(--p-200);
  background: var(--bg-secondary);
  padding: 0 16px;
  transition: all .2s;
  &:focus-within { border-color: var(--p-500); box-shadow: 0 0 0 3px rgba(255,92,138,.1) }
}

.amount-in {
  flex: 1; border: none; outline: none; font-size: 22px; font-weight: 700;
  font-variant-numeric: tabular-nums; color: var(--text-primary); background: transparent;
  font-family: inherit;
  &::placeholder { color: var(--text-tertiary) }
}

.result-box {
  background: var(--p-50); border-color: var(--p-200);
  .result-num { font-size: 22px; font-weight: 800; font-variant-numeric: tabular-nums; color: var(--p-600) }
}

.field-currency {
  font-size: 15px; font-weight: 700; margin-left: 6px; flex-shrink: 0;
}

.swap-btn {
  width: 40px; height: 40px; border-radius: 50%;
  border: 1.5px solid var(--p-200); background: var(--bg-secondary);
  cursor: pointer; font-size: 18px; color: var(--p-500);
  display: flex; align-items: center; justify-content: center;
  transition: all .2s; margin-bottom: 6px;
  &:hover { background: var(--p-500); color: #fff; border-color: var(--p-500) }
  &:active { transform: scale(.92) }
}

.conv-selectors {
  display: flex; flex-direction: column; gap: 10px;
  .sel-group { display: flex; flex-direction: column; gap: 6px }
  .sel-label { font-size: 11px; font-weight: 600; letter-spacing: .04em; color: var(--text-tertiary) }
}

.chips {
  display: flex; flex-wrap: wrap; gap: 5px;
  .chip {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 5px 10px; border-radius: 100px;
    border: 1px solid var(--p-200); background: var(--bg-secondary);
    cursor: pointer; font-size: 12px; font-weight: 500;
    color: var(--text-secondary); transition: all .2s;
    font-family: inherit;
    .chip-flag { font-size: 14px; line-height: 1 }
    &:hover { border-color: var(--p-400); background: var(--p-50) }
    &.active { background: var(--p-500); color: #fff; border-color: var(--p-500); font-weight: 600; transform: scale(1.05); box-shadow: 0 2px 8px rgba(255,92,138,.25) }
  }
}

.rate-bar {
  text-align: center; padding: 8px 12px; border-radius: var(--radius-sm);
  background: var(--p-50); margin-top: 12px;
  font-size: 13px; color: var(--text-secondary);
  strong { color: var(--text-primary); font-weight: 700 }
}
</style>
