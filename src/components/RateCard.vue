<template>
  <div class="rate-card" :style="{ '--accent': currency.color }">
    <!-- 顶部可爱线条 -->
    <div class="card-accent"></div>

    <!-- 头部 -->
    <div class="card-header">
      <span class="flag">{{ currency.flag }}</span>
      <div class="currency-info">
        <span class="currency-code">{{ currency.code }}</span>
        <span class="currency-name">{{ currency.name }}</span>
      </div>
    </div>

    <!-- 汇率 -->
    <div class="card-body">
      <div v-if="loading" class="card-loading">
        <span class="loading-dots">⏳</span>
      </div>
      <div v-else-if="error" class="card-error">😢 获取失败</div>
      <template v-else-if="rate !== null">
        <div class="rate-value">
          <span v-if="currency.unit > 1" class="rate-unit">{{ currency.unit }}</span>
          <span class="rate-symbol">{{ currency.symbol }}</span>
          <span class="rate-number">{{ formattedRate }}</span>
        </div>
        <div class="rate-label-text">人民币 CNY</div>
        <div class="rate-change" :class="changeClass">
          <span class="change-arrow">{{ changeArrow }}</span>
          <span>{{ changePercent >= 0 ? '+' : '' }}{{ changePercent }}%</span>
        </div>
      </template>
    </div>

    <!-- 底部装饰 -->
    <div class="card-footer">
      <span class="footer-icon" v-if="changePercent > 0">📈</span>
      <span class="footer-icon" v-else-if="changePercent < 0">📉</span>
      <span class="footer-icon" v-else>💤</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currency: { type: Object, required: true },
  rate: { type: Number, default: null },
  changePercent: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  error: { type: Boolean, default: false }
})

const formattedRate = computed(() => {
  if (props.rate === null) return '--'
  return props.rate.toFixed(4)
})

const changeClass = computed(() => {
  if (props.changePercent > 0) return 'up'
  if (props.changePercent < 0) return 'down'
  return 'flat'
})

const changeArrow = computed(() => {
  if (props.changePercent > 0) return '↑'
  if (props.changePercent < 0) return '↓'
  return '→'
})
</script>

<style lang="scss" scoped>
.rate-card {
  background: #fff;
  border-radius: var(--radius-lg);
  padding: 0 0 14px 0;
  box-shadow: var(--shadow-card);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  position: relative;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(255, 107, 157, 0.15);
  }

  /* 顶部彩色条 */
  .card-accent {
    height: 4px;
    background: linear-gradient(90deg, var(--accent), var(--accent), #ffb3c6);
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 18px 0;

    .flag { font-size: 28px; line-height: 1; }

    .currency-info {
      display: flex;
      flex-direction: column;
      gap: 1px;

      .currency-code {
        font-size: 15px;
        font-weight: 700;
        color: var(--text-primary);
        letter-spacing: 0.5px;
      }
      .currency-name {
        font-size: 12px;
        color: var(--text-secondary);
      }
    }
  }

  .card-body {
    padding: 12px 18px 0;

    .card-loading {
      padding: 20px 0;
      text-align: center;
      .loading-dots { font-size: 24px; animation: bounce 1s infinite; }
    }

    .card-error {
      padding: 16px 0;
      text-align: center;
      color: var(--text-secondary);
      font-size: 14px;
    }

    .rate-value {
      display: flex;
      align-items: baseline;
      gap: 3px;

      .rate-unit {
        font-size: 14px;
        color: var(--text-secondary);
        font-weight: 500;
      }

      .rate-symbol {
        font-size: 16px;
        color: var(--text-secondary);
        font-weight: 500;
      }

      .rate-number {
        font-size: 28px;
        font-weight: 800;
        color: var(--text-primary);
        font-variant-numeric: tabular-nums;
        letter-spacing: -0.5px;
      }
    }

    .rate-label-text {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 2px;
    }

    .rate-change {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-top: 8px;
      font-size: 13px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 50px;

      .change-arrow { font-size: 11px; }

      &.up {
        color: #e85d8a;
        background: rgba(255, 107, 157, 0.1);
      }
      &.down {
        color: #67c23a;
        background: rgba(103, 194, 58, 0.1);
      }
      &.flat {
        color: var(--text-secondary);
        background: rgba(158, 138, 152, 0.08);
      }
    }
  }

  .card-footer {
    text-align: center;
    padding-top: 10px;

    .footer-icon {
      font-size: 16px;
      opacity: 0.5;
    }
  }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
</style>
