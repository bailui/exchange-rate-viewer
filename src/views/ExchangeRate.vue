<template>
  <div class="page">
    <!-- 背景装饰 -->
    <div class="bg-deco deco-1"></div>
    <div class="bg-deco deco-2"></div>
    <div class="bg-deco deco-3"></div>

    <!-- 计算器 -->
    <CurrencyConverter />

    <!-- 汇率卡片 -->
    <div class="section-head">
      <h2>实时汇率</h2>
      <button class="refresh-btn" :class="{ spinning: refreshing }" @click="refreshRates" :disabled="refreshing">🔄</button>
    </div>

    <div class="rate-grid">
      <RateCard
        v-for="(c, i) in focusCurrencies"
        :key="c.code"
        :currency="c"
        :rate="rates[c.code]"
        :change-percent="changes[c.code] || 0"
        :loading="loading && !rates[c.code]"
        :error="hasError[c.code]"
        :delay="i * 50"
        :history="histories[c.code] || []"
      />
    </div>

    <!-- 快捷 -->
    <div class="quick-ref glass anim-up" style="animation-delay:.5s">
      <h3>💝 快捷参考</h3>
      <div class="ref-grid">
        <div v-for="c in focusCurrencies.slice(0,5)" :key="'a-'+c.code" class="ref-item">
          <span class="ref-flag">{{ c.flag }}</span>
          <span class="ref-rate">{{ c.unit }} {{ c.code }} = <strong>{{ rates[c.code]?.toFixed(4) ?? '--' }}</strong></span>
        </div>
        <div v-for="c in focusCurrencies.slice(5)" :key="'b-'+c.code" class="ref-item">
          <span class="ref-flag">{{ c.flag }}</span>
          <span class="ref-rate">{{ c.unit }} {{ c.code }} = <strong>{{ rates[c.code]?.toFixed(4) ?? '--' }}</strong></span>
        </div>
      </div>
      <div class="ref-note">数据每小时更新 · 仅供参考</div>
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
const histories = reactive({})
const loading = ref(true)
const refreshing = ref(false)
const prevRates = reactive({})
const lastUpdateTime = ref('')

let timer = null
const INTERVAL = 30_000
const MAX_HISTORY = 30

// 从 localStorage 加载历史
function loadHistory() {
  try {
    const stored = localStorage.getItem('fx_history')
    if (stored) Object.assign(histories, JSON.parse(stored))
  } catch {}
}
function saveHistory() {
  try { localStorage.setItem('fx_history', JSON.stringify({...histories})) } catch {}
}

async function refreshRates() {
  refreshing.value = true
  emit('refreshStart')
  try {
    const data = await fetchExchangeRates()
    updateRates(data)
  } catch (e) { console.error(e) }
  finally { refreshing.value = false; emit('refreshEnd') }
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
    if (rate) {
      rates[c.code] = rate
      hasError[c.code] = false
      // 历史记录
      if (!histories[c.code]) histories[c.code] = []
      histories[c.code].push(rate)
      if (histories[c.code].length > MAX_HISTORY) histories[c.code].shift()
    } else {
      hasError[c.code] = true
    }
  })
  saveHistory()
  lastUpdateTime.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  emit('updateTime', lastUpdateTime.value)
  loading.value = false
}

onMounted(async () => {
  loadHistory()
  await refreshRates()
  timer = setInterval(refreshRates, INTERVAL)
})
onUnmounted(() => clearInterval(timer))
</script>

<style lang="scss" scoped>
.page { max-width: 1400px; margin: 0 auto; position: relative }

/* 背景装饰 */
.bg-deco {
  position: absolute; border-radius: 50%; pointer-events: none; z-index: 0;
}
.deco-1 {
  top: 40px; right: -60px; width: 300px; height: 300px;
  background: radial-gradient(circle, rgba(255,92,138,.14) 0%, rgba(255,92,138,.04) 50%, transparent 70%);
  animation: float 8s ease-in-out infinite;
}
.deco-2 {
  top: 500px; left: -80px; width: 280px; height: 280px;
  background: radial-gradient(circle, rgba(175,82,222,.1) 0%, rgba(175,82,222,.03) 50%, transparent 70%);
  animation: float 10s ease-in-out infinite 2s;
}
.deco-3 {
  bottom: 80px; right: 40px; width: 200px; height: 200px;
  background: radial-gradient(circle, rgba(255,94,58,.08) 0%, rgba(255,94,58,.02) 50%, transparent 70%);
  animation: float 9s ease-in-out infinite 4s;
}

@keyframes float {
  0%,100% { transform: translate(0,0) scale(1) }
  33% { transform: translate(8px,-12px) scale(1.04) }
  66% { transform: translate(-6px,8px) scale(.97) }
}

/* 头部 */
.section-head {
  display: flex; align-items: center; justify-content: space-between;
  margin: 0 0 10px; position: relative; z-index: 1;
  h2 { font-size: 18px; font-weight: 800; letter-spacing: -.02em }
}

.refresh-btn {
  width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--p-200);
  background: var(--bg-secondary); cursor: pointer; font-size: 16px;
  display: flex; align-items: center; justify-content: center;
  transition: all .3s;
  &:hover { background: var(--p-50); border-color: var(--p-400) }
  &.spinning { animation: spin .8s linear infinite }
}
@keyframes spin { to { transform: rotate(360deg) } }

/* 卡片网格 */
.rate-grid {
  display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px;
  margin-bottom: 18px; position: relative; z-index: 1;
  @media (max-width: 1400px) { grid-template-columns: repeat(3, 1fr) }
  @media (max-width: 800px)  { grid-template-columns: repeat(2, 1fr) }
  @media (max-width: 500px)  { grid-template-columns: 1fr }
}

/* 快捷参考 */
.quick-ref {
  border-radius: var(--radius-xl); padding: 20px 24px;
  box-shadow: var(--glass-shadow); position: relative; z-index: 1;
  h3 { font-size: 14px; font-weight: 700; margin-bottom: 14px }
}
.ref-grid {
  display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px 16px;
  margin-bottom: 10px;
  @media (max-width: 1000px) { grid-template-columns: repeat(3, 1fr) }
  @media (max-width: 600px)  { grid-template-columns: repeat(2, 1fr) }
}
.ref-item {
  display: flex; align-items: center; gap: 6px; font-size: 12px; padding: 4px 0;
  .ref-flag { font-size: 16px }
  .ref-rate { color: var(--text-secondary); strong { color: var(--text-primary); font-weight: 600 } }
}
.ref-note { font-size: 10px; color: var(--text-tertiary); text-align: center; padding-top: 8px; border-top: 1px solid var(--p-100) }
</style>
