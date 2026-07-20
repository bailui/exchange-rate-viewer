<template>
  <div class="exchange-rate-page">
    <!-- 概览横幅 -->
    <div class="overview-banner">
      <div class="banner-left">
        <h2 class="banner-title">
          <el-icon :size="24"><TrendCharts /></el-icon>
          实时汇率监控
        </h2>
        <p class="banner-subtitle">
          基准货币：人民币 (CNY) · 数据来源：ExchangeRate API · 每小时更新
        </p>
      </div>
      <div class="banner-right">
        <el-tag :type="statusType" effect="plain" size="large">
          <el-icon><component :is="statusIcon" /></el-icon>
          {{ statusText }}
        </el-tag>
        <el-button
          :icon="Refresh"
          circle
          :loading="refreshing"
          @click="refreshRates"
          title="刷新汇率"
        />
      </div>
    </div>

    <!-- 汇率卡片网格 -->
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

    <!-- 快捷换算 -->
    <div class="converter-section">
      <h3 class="section-title">
        <el-icon><Operation /></el-icon>
        快捷换算
      </h3>
      <div class="converter-grid">
        <div
          v-for="currency in focusCurrencies"
          :key="'conv-' + currency.code"
          class="converter-card"
        >
          <div class="conv-flag">{{ currency.flag }}</div>
          <div class="conv-info">
            <div class="conv-label">{{ currency.code }}/CNY</div>
            <div class="conv-items">
              <span class="conv-item">1 {{ currency.code }} = <strong>{{ rates[currency.code]?.toFixed(currency.code === 'JPY' ? 4 : 4) || '--' }}</strong> CNY</span>
              <span class="conv-item">100 CNY = <strong>{{ rates[currency.code] ? (100 / rates[currency.code]).toFixed(2) : '--' }}</strong> {{ currency.code }}</span>
            </div>
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

const emit = defineEmits(['updateTime'])

const focusCurrencies = FOCUS_CURRENCIES
const rates = reactive({})
const changes = reactive({})
const hasError = reactive({})
const loading = ref(true)
const refreshing = ref(false)
const lastUpdateTime = ref('')
const prevRates = reactive({})

let refreshTimer = null
const REFRESH_INTERVAL = 5 * 60 * 1000 // 5分钟

const statusText = computed(() => {
  if (loading.value && !Object.keys(rates).length) return '加载中...'
  if (lastUpdateTime.value) return `已更新 ${lastUpdateTime.value}`
  return '就绪'
})

const statusType = computed(() => {
  if (loading.value && !Object.keys(rates).length) return 'warning'
  if (lastUpdateTime.value) return 'success'
  return 'info'
})

const statusIcon = computed(() => {
  if (loading.value && !Object.keys(rates).length) return 'Loading'
  if (lastUpdateTime.value) return 'CircleCheck'
  return 'InfoFilled'
})

async function refreshRates() {
  refreshing.value = true
  try {
    const data = await fetchExchangeRates()
    updateRates(data)
  } catch (err) {
    console.error('刷新失败:', err)
  } finally {
    refreshing.value = false
  }
}

function updateRates(data) {
  const cnyRates = data.rates
  if (!cnyRates) return

  focusCurrencies.forEach(cur => {
    // 先用旧值对比
    if (rates[cur.code] && prevRates[cur.code]) {
      const oldRate = prevRates[cur.code]
      const newRate = calculateRate(cnyRates, cur.code)
      if (oldRate && newRate) {
        changes[cur.code] = parseFloat(((newRate - oldRate) / oldRate * 100).toFixed(2))
      }
    }
    // 保存旧值
    prevRates[cur.code] = rates[cur.code]

    // 更新新值
    const rate = calculateRate(cnyRates, cur.code)
    if (rate) {
      rates[cur.code] = rate
      hasError[cur.code] = false
    } else {
      hasError[cur.code] = true
    }
  })

  // 更新时间
  const now = new Date()
  lastUpdateTime.value = now.toLocaleTimeString('zh-CN', { hour12: false })
  emit('updateTime', lastUpdateTime.value)
  loading.value = false
}

onMounted(async () => {
  await refreshRates()
  // 定时刷新
  refreshTimer = setInterval(refreshRates, REFRESH_INTERVAL)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<style lang="scss" scoped>
.exchange-rate-page {
  max-width: 1400px;
  margin: 0 auto;
}

/* === 概览横幅 === */
.overview-banner {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  border-radius: 16px;
  padding: 28px 32px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #fff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);

  .banner-left {
    .banner-title {
      font-size: 22px;
      font-weight: 700;
      margin: 0 0 6px 0;
      display: flex;
      align-items: center;
      gap: 8px;
      letter-spacing: 1px;
    }

    .banner-subtitle {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.6);
      margin: 0;
    }
  }

  .banner-right {
    display: flex;
    align-items: center;
    gap: 12px;

    :deep(.el-tag) {
      border-color: rgba(255, 255, 255, 0.3);
      color: #fff;
      background: rgba(255, 255, 255, 0.1);
    }
  }
}

/* === 汇率卡片网格 === */
.rate-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

/* === 快捷换算 === */
.converter-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid #ebeef5;

  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 16px 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .converter-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;

    @media (max-width: 1200px) {
      grid-template-columns: repeat(2, 1fr);
    }
    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }

  .converter-card {
    background: #fafbfc;
    border-radius: 8px;
    padding: 16px;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    transition: background 0.2s;

    &:hover {
      background: #f0f2f5;
    }

    .conv-flag {
      font-size: 28px;
      line-height: 1;
    }

    .conv-info {
      .conv-label {
        font-size: 12px;
        color: #909399;
        margin-bottom: 6px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .conv-items {
        display: flex;
        flex-direction: column;
        gap: 4px;

        .conv-item {
          font-size: 13px;
          color: #606266;

          strong {
            color: #303133;
            font-weight: 600;
          }
        }
      }
    }
  }
}
</style>
