<template>
  <div class="page">
    <!-- 背景装饰 -->
    <div class="bg-deco deco-1"></div>
    <div class="bg-deco deco-2"></div>
    <div class="bg-deco deco-3"></div>

    <!-- 🧮 计算器 -->
    <CurrencyConverter />

    <!-- 📊 汇率卡片 -->
    <div class="section-header">
      <h2 class="section-title">实时汇率</h2>
      <el-button :icon="Refresh" circle size="small" :loading="refreshing" @click="refreshRates" class="refresh-btn" />
    </div>

    <div class="rate-grid">
      <RateCard
        v-for="(currency, i) in focusCurrencies"
        :key="currency.code"
        :currency="currency"
        :rate="rates[currency.code]"
        :change-percent="changes[currency.code] || 0"
        :loading="loading && !rates[currency.code]"
        :error="hasError[currency.code]"
        :delay="i * 60"
      />
    </div>

    <!-- 🔄 快捷参考 -->
    <div class="quick-ref glass">
      <h3 class="section-title-sm">快捷参考</h3>
      <div class="ref-grid">
        <div
          v-for="c in focusCurrencies.slice(0, 5)"
          :key="'ref-' + c.code"
          class="ref-item"
        >
          <span class="ref-flag">{{ c.flag }}</span>
          <span class="ref-rate">
            {{ c.unit }} {{ c.code }} = <strong>{{ rates[c.code]?.toFixed(4) ?? '--' }}</strong> CNY
          </span>
        </div>
        <div
          v-for="c in focusCurrencies.slice(5)"
          :key="'ref-' + c.code"
          class="ref-item"
        >
          <span class="ref-flag">{{ c.flag }}</span>
          <span class="ref-rate">
            {{ c.unit }} {{ c.code }} = <strong>{{ rates[c.code]?.toFixed(4) ?? '--' }}</strong> CNY
          </span>
        </div>
      </div>
      <div class="ref-disclaimer">
        数据来源 ExchangeRate API · 每小时更新 · 仅供参考
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { fetchExchangeRates, FOCUS_CURRENCIES, calculateRate } from '../api/exchangeRate.js'
import RateCard from '../components/RateCard.vue'
import CurrencyConverter from '../components/CurrencyConverter.vue'

const emit = defineEmits(['updateTime', 'refreshStart', 'refreshEnd'])

const focusCurrencies = FOCUS_CURRENCIES
const rates = reactive({})
const changes = reactive({})
const hasError = reactive({})
const loading = ref(true)
const refreshing = ref(false)
const prevRates = reactive({})
const lastUpdateTime = ref('')

let timer = null
const INTERVAL = 30_000

async function refreshRates() {
  refreshing.value = true
  emit('refreshStart')
  try {
    const data = await fetchExchangeRates()
    updateRates(data)
  } catch (e) {
    console.error(e)
  } finally {
    refreshing.value = false
    emit('refreshEnd')
  }
}

function updateRates(data) {
  const r = data.rates
  if (!r) return
  focusCurrencies.forEach(c => {
    if (rates[c.code] && prevRates[c.code]) {
      const oldR = prevRates[c.code]
      const newR = calculateRate(r, c.code, c.unit)
      if (oldR && newR) changes[c.code] = +((newR - oldR) / oldR * 100).toFixed(2)
    }
    prevRates[c.code] = rates[c.code]
    const rate = calculateRate(r, c.code, c.unit)
    rate ? (rates[c.code] = rate, hasError[c.code] = false) : (hasError[c.code] = true)
  })
  lastUpdateTime.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  emit('updateTime', lastUpdateTime.value)
  loading.value = false
}

onMounted(async () => {
  await refreshRates()
  timer = setInterval(refreshRates, INTERVAL)
})
onUnmounted(() => clearInterval(timer))
</script>

<style lang="scss" scoped>
.page {
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
}

/* === 背景装饰球 === */
.bg-deco {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}
.deco-1 {
  top: 60px;
  right: -40px;
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgba(0,122,255,.18) 0%, rgba(0,122,255,.04) 40%, transparent 70%);
  animation: float 8s ease-in-out infinite;
}
.deco-2 {
  top: 400px;
  left: -60px;
  width: 260px;
  height: 260px;
  background: radial-gradient(circle, rgba(175,82,222,.16) 0%, rgba(175,82,222,.04) 40%, transparent 70%);
  animation: float 10s ease-in-out infinite 2s;
}
.deco-3 {
  bottom: 100px;
  right: 20px;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(255,159,10,.12) 0%, rgba(255,159,10,.03) 40%, transparent 70%);
  animation: float 9s ease-in-out infinite 4s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1) }
  33% { transform: translate(10px, -15px) scale(1.05) }
  66% { transform: translate(-8px, 10px) scale(.97) }
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;

  .section-title {
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -.02em;
    color: var(--text-primary);
  }

  .refresh-btn {
    border: 1px solid rgba(0,0,0,.08);
    background: var(--bg-secondary);
    box-shadow: none;
    &:hover { background: rgba(0,0,0,.04) }
  }
}

/* 卡片网格 */
.rate-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 20px;

  @media (max-width: 1400px) { grid-template-columns: repeat(3, 1fr) }
  @media (max-width: 900px)  { grid-template-columns: repeat(2, 1fr) }
  @media (max-width: 560px)  { grid-template-columns: 1fr }
}

/* 快捷参考 */
.quick-ref {
  border-radius: var(--radius-xl);
  padding: 20px 24px;
  box-shadow: var(--glass-shadow);
  animation: fadeUp .5s var(--ease-out) both;
  animation-delay: .6s;
  position: relative;
  z-index: 1;
}

.section-title-sm {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 14px;
  letter-spacing: -.02em;
}

.ref-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px 16px;
  margin-bottom: 12px;

  @media (max-width: 1200px) { grid-template-columns: repeat(3, 1fr) }
  @media (max-width: 700px)  { grid-template-columns: repeat(2, 1fr) }
}

.ref-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 13px;

  .ref-flag { font-size: 18px; line-height: 1 }
  .ref-rate {
    color: var(--text-secondary);
    strong { color: var(--text-primary); font-weight: 600 }
  }
}

.ref-disclaimer {
  font-size: 11px;
  color: var(--text-tertiary);
  text-align: center;
  padding-top: 8px;
  border-top: 1px solid rgba(0,0,0,.04);
}
</style>
