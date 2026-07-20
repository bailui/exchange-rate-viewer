<template>
  <div class="exchange-rate-page">
    <!-- 🌸 可爱概览横幅 -->
    <div class="cute-banner">
      <div class="banner-sparkles">
        <span class="sparkle">✨</span>
        <span class="sparkle delay-1">💖</span>
        <span class="sparkle delay-2">🌸</span>
      </div>
      <div class="banner-content">
        <h2 class="banner-title">汇率小助手</h2>
        <p class="banner-subtitle">
          基准货币：人民币 (CNY) · 自动刷新 · 比心
        </p>
      </div>
      <div class="banner-status">
        <el-tag
          :type="statusType"
          effect="plain"
          size="large"
          round
          class="status-tag"
        >
          {{ statusEmoji }} {{ statusText }}
        </el-tag>
        <el-button
          :icon="Refresh"
          circle
          size="large"
          :loading="refreshing"
          @click="refreshRates"
          class="refresh-btn"
        />
      </div>
    </div>

    <!-- 🌷 汇率卡片网格 — 2行 × 5列 -->
    <div class="rate-grid">
      <RateCard
        v-for="currency in focusCurrencies"
        :key="currency.code"
        :currency="currency"
        :rate="rates[currency.code]"
        :change-percent="changes[currency.code] || 0"
        :loading="loading && !rates[currency.code]"
        :error="hasError[currency.code]"
      />
    </div>

    <!-- 🌺 快捷换算 -->
    <div class="converter-section">
      <h3 class="section-title">💝 快捷换算</h3>
      <div class="converter-grid">
        <div
          v-for="currency in focusCurrencies"
          :key="'conv-' + currency.code"
          class="converter-card"
        >
          <span class="conv-flag">{{ currency.flag }}</span>
          <div class="conv-info">
            <span class="conv-label">{{ currency.code }} / CNY</span>
            <span class="conv-rate">
              {{ currency.unit }} {{ currency.code }} = <strong>{{ rates[currency.code]?.toFixed(4) || '--' }}</strong> CNY
            </span>
            <span class="conv-reverse">
              100 CNY ≈ <strong>{{ rates[currency.code] ? (100 / rates[currency.code] * currency.unit).toFixed(2) : '--' }}</strong> {{ currency.code }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { fetchExchangeRates, FOCUS_CURRENCIES, calculateRate } from '../api/exchangeRate.js'
import RateCard from '../components/RateCard.vue'

const emit = defineEmits(['updateTime', 'refreshStart', 'refreshEnd'])

const focusCurrencies = FOCUS_CURRENCIES
const rates = reactive({})
const changes = reactive({})
const hasError = reactive({})
const loading = ref(true)
const refreshing = ref(false)
const lastUpdateTime = ref('')
const prevRates = reactive({})

let refreshTimer = null
const REFRESH_INTERVAL = 30 * 1000 // 30秒

const statusText = computed(() => {
  if (loading.value && !Object.keys(rates).length) return '加载中...'
  if (lastUpdateTime.value) return `已更新 ${lastUpdateTime.value}`
  return '就绪'
})

const statusEmoji = computed(() => {
  if (loading.value && !Object.keys(rates).length) return '⏳'
  if (lastUpdateTime.value) return '💚'
  return '🌸'
})

const statusType = computed(() => {
  if (loading.value && !Object.keys(rates).length) return 'warning'
  if (lastUpdateTime.value) return 'success'
  return ''
})

async function refreshRates() {
  refreshing.value = true
  emit('refreshStart')
  try {
    const data = await fetchExchangeRates()
    updateRates(data)
  } catch (err) {
    console.error('刷新失败:', err)
  } finally {
    refreshing.value = false
    emit('refreshEnd')
  }
}

function updateRates(data) {
  const cnyRates = data.rates
  if (!cnyRates) return

  focusCurrencies.forEach(cur => {
    if (rates[cur.code] && prevRates[cur.code]) {
      const oldRate = prevRates[cur.code]
      const newRate = calculateRate(cnyRates, cur.code, cur.unit)
      if (oldRate && newRate) {
        changes[cur.code] = parseFloat(((newRate - oldRate) / oldRate * 100).toFixed(2))
      }
    }
    prevRates[cur.code] = rates[cur.code]

    const rate = calculateRate(cnyRates, cur.code, cur.unit)
    if (rate) {
      rates[cur.code] = rate
      hasError[cur.code] = false
    } else {
      hasError[cur.code] = true
    }
  })

  const now = new Date()
  lastUpdateTime.value = now.toLocaleTimeString('zh-CN', { hour12: false })
  emit('updateTime', lastUpdateTime.value)
  loading.value = false
}

onMounted(async () => {
  await refreshRates()
  refreshTimer = setInterval(refreshRates, REFRESH_INTERVAL)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<style lang="scss" scoped>
.exchange-rate-page {
  max-width: 1600px;
  margin: 0 auto;
}

/* === 🌸 横幅 === */
.cute-banner {
  background: linear-gradient(135deg, #ff9eb5 0%, #ff6b9d 30%, #f472b6 60%, #e879f9 100%);
  border-radius: var(--radius-lg);
  padding: 28px 32px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #fff;
  box-shadow: 0 8px 30px rgba(255, 107, 157, 0.25);
  position: relative;
  overflow: hidden;

  .banner-sparkles {
    position: absolute;
    top: 10px;
    right: 120px;
    display: flex;
    gap: 8px;

    .sparkle {
      font-size: 18px;
      animation: twinkle 2s ease-in-out infinite;
      &.delay-1 { animation-delay: 0.6s; }
      &.delay-2 { animation-delay: 1.2s; }
    }
  }

  .banner-content {
    .banner-title {
      font-size: 24px;
      font-weight: 800;
      margin: 0 0 6px 0;
      letter-spacing: 2px;
    }
    .banner-subtitle {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.8);
      margin: 0;
    }
  }

  .banner-status {
    display: flex;
    align-items: center;
    gap: 12px;

    .status-tag {
      border-color: rgba(255, 255, 255, 0.4);
      color: #fff;
      background: rgba(255, 255, 255, 0.15);
      font-weight: 600;
    }

    .refresh-btn {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: #fff;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);

      &:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: rotate(30deg);
      }
    }
  }
}

@keyframes twinkle {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

/* === 卡片网格 === */
.rate-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 28px;

  @media (max-width: 1400px) { grid-template-columns: repeat(3, 1fr); }
  @media (max-width: 900px)  { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 560px)  { grid-template-columns: 1fr; }
}

/* === 换算区 === */
.converter-section {
  background: #fff;
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--pink-200);

  .section-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--pink-500);
    margin: 0 0 16px 0;
  }

  .converter-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 12px;

    @media (max-width: 1400px) { grid-template-columns: repeat(3, 1fr); }
    @media (max-width: 900px)  { grid-template-columns: repeat(2, 1fr); }
    @media (max-width: 560px)  { grid-template-columns: 1fr; }
  }

  .converter-card {
    background: var(--pink-100);
    border-radius: var(--radius-md);
    padding: 14px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    transition: all 0.3s ease;

    &:hover {
      background: var(--pink-200);
      transform: translateY(-2px);
    }

    .conv-flag { font-size: 24px; line-height: 1; }

    .conv-info {
      display: flex;
      flex-direction: column;
      gap: 3px;

      .conv-label {
        font-size: 11px;
        color: var(--pink-500);
        font-weight: 600;
        letter-spacing: 0.5px;
      }

      .conv-rate {
        font-size: 13px;
        color: var(--text-primary);
        strong { color: var(--pink-600); }
      }

      .conv-reverse {
        font-size: 12px;
        color: var(--text-secondary);
        strong { color: var(--text-primary); }
      }
    }
  }
}
</style>
