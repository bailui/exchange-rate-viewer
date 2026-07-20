<template>
  <div class="converter glass">
    <div class="converter-header">
      <h3 class="converter-title">💰 汇率计算器</h3>
    </div>

    <div class="converter-body">
      <!-- 金额输入 -->
      <div class="amount-row">
        <div class="input-group">
          <label class="input-label">金额</label>
          <input
            v-model.number="amount"
            type="number"
            min="0"
            step="any"
            class="amount-input"
            placeholder="输入金额"
            @input="convert"
          />
        </div>

        <!-- 源货币 -->
        <div class="swap-btn-wrapper">
          <button class="swap-btn" @click="swapCurrencies" title="交换货币">
            <span class="swap-icon">⇄</span>
          </button>
        </div>

        <!-- 目标货币 -->
        <div class="input-group">
          <label class="input-label">转换为</label>
          <div class="result-box">
            <span class="result-number">{{ result }}</span>
            <span class="result-unit">{{ toCurrency }}</span>
          </div>
        </div>
      </div>

      <!-- 货币选择器 -->
      <div class="currency-selectors">
        <div class="selector-group">
          <label class="input-label">从</label>
          <div class="currency-chips">
            <button
              v-for="c in currencies"
              :key="'from-' + c.code"
              :class="['chip', { active: fromCurrency === c.code }]"
              :style="{ '--chip-color': c.color, '--chip-color-bg': c.color + '18' }"
              @click="selectFrom(c.code)"
            >
              <span class="chip-flag">{{ c.flag }}</span>
              <span class="chip-code">{{ c.code }}</span>
            </button>
          </div>
        </div>

        <div class="selector-group">
          <label class="input-label">到</label>
          <div class="currency-chips">
            <button
              v-for="c in currencies"
              :key="'to-' + c.code"
              :class="['chip', { active: toCurrency === c.code }]"
              :style="{ '--chip-color': c.color, '--chip-color-bg': c.color + '18' }"
              @click="selectTo(c.code)"
            >
              <span class="chip-flag">{{ c.flag }}</span>
              <span class="chip-code">{{ c.code }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 换算详情 -->
      <div class="rate-info" v-if="rateInfo">
        <span class="rate-text">
          1 {{ fromCurrency }} = <strong>{{ rateInfo }}</strong> {{ toCurrency }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { FOCUS_CURRENCIES, fetchExchangeRates, calculateRate } from '../api/exchangeRate.js'

const props = defineProps({
  ratesData: { type: Object, default: () => ({}) }
})

const currencies = FOCUS_CURRENCIES

const amount = ref(100)
const fromCurrency = ref('USD')
const toCurrency = ref('CNY')
const allRates = ref({})

// 加载汇率数据
async function loadRates() {
  try {
    const data = await fetchExchangeRates()
    allRates.value = data.rates || {}
  } catch (e) {
    // fallback to prop data
    allRates.value = props.ratesData || {}
  }
}
loadRates()

const rateInfo = computed(() => {
  const r = getCrossRate(fromCurrency.value, toCurrency.value)
  return r ? r.toFixed(4) : null
})

const result = computed(() => {
  if (!amount.value || amount.value <= 0) return '0.00'
  const r = getCrossRate(fromCurrency.value, toCurrency.value)
  if (!r) return '--'
  return (amount.value * r).toFixed(2)
})

function getCrossRate(from, to) {
  const rates = allRates.value
  if (!rates) return null
  // API 返回 1 CNY = X 外币
  // 所以 1 from → CNY = 1 / rates[from]
  // CNY → to = rates[to] (if to != CNY)
  if (from === to) return 1

  let fromToCny, cnyToTo
  if (from === 'CNY') {
    fromToCny = 1
  } else {
    fromToCny = rates[from] ? 1 / rates[from] : null
  }
  if (to === 'CNY') {
    cnyToTo = 1
  } else {
    cnyToTo = rates[to] || null
  }
  if (fromToCny == null || cnyToTo == null) return null
  return fromToCny * cnyToTo
}

function selectFrom(code) {
  fromCurrency.value = code
  convert()
}

function selectTo(code) {
  toCurrency.value = code
  convert()
}

function swapCurrencies() {
  [fromCurrency.value, toCurrency.value] = [toCurrency.value, fromCurrency.value]
  convert()
}

function convert() {
  // result 是 computed，自动更新
}
</script>

<style lang="scss" scoped>
.converter {
  border-radius: var(--radius-xl);
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: var(--glass-shadow);
  animation: fadeUp .5s var(--ease-out) both;
  position: relative;
  z-index: 1;
}

.converter-header {
  margin-bottom: 20px;
  .converter-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -.02em;
  }
}

.converter-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// 金额行
.amount-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;

  .input-group {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .swap-btn-wrapper {
    display: flex;
    align-items: center;
    padding-bottom: 4px;
  }

  .swap-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid rgba(0,0,0,.1);
    background: var(--bg-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-fast);

    &:hover {
      background: var(--color-blue);
      border-color: var(--color-blue);
      .swap-icon { color: #fff }
    }
    &:active { transform: scale(.92) }

    .swap-icon {
      font-size: 18px;
      color: var(--text-secondary);
      transition: color var(--transition-fast);
    }
  }
}

.input-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .04em;
  color: var(--text-tertiary);
}

.amount-input {
  height: 52px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(0,0,0,.1);
  background: rgba(0,0,0,.02);
  padding: 0 16px;
  font-size: 22px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
  outline: none;
  transition: all var(--transition-fast);
  font-family: inherit;

  &:focus {
    border-color: var(--color-blue);
    box-shadow: 0 0 0 3px rgba(0,122,255,.15);
    background: #fff;
  }

  &::placeholder { color: var(--text-tertiary) }
}

.result-box {
  height: 52px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(0,0,0,.1);
  background: rgba(0,122,255,.04);
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 6px;

  .result-number {
    font-size: 22px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: var(--color-blue);
  }

  .result-unit {
    font-size: 14px;
    color: var(--text-secondary);
    font-weight: 500;
  }
}

// 货币选择器
.currency-selectors {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.selector-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.currency-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 100px;
  border: 1.5px solid rgba(0,0,0,.08);
  background: var(--bg-secondary);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  font-family: inherit;

  .chip-flag { font-size: 16px; line-height: 1 }
  .chip-code { letter-spacing: .02em }

  &:hover {
    border-color: var(--chip-color);
    background: var(--chip-color-bg);
    color: var(--chip-color);
  }

  &.active {
    border-color: var(--chip-color);
    background: var(--chip-color);
    color: #fff;
    box-shadow: 0 2px 8px rgba(0,0,0,.1);
    transform: scale(1.04);
  }
}

// 汇率信息
.rate-info {
  text-align: center;
  padding: 8px;
  border-radius: var(--radius-sm);
  background: rgba(0,0,0,.03);

  .rate-text {
    font-size: 14px;
    color: var(--text-secondary);
    strong { color: var(--text-primary); font-weight: 600 }
  }
}
</style>
