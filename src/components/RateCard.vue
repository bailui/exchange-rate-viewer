<template>
  <div class="rate-card glass" :style="{
    '--accent': currency.color,
    animationDelay: delay + 'ms'
  }">
    <!-- 头部 -->
    <div class="card-top">
      <div class="card-identity">
        <span class="flag">{{ currency.flag }}</span>
        <div class="card-name">
          <span class="card-code">{{ currency.code }}</span>
          <span class="card-label">{{ currency.name }}</span>
        </div>
      </div>
      <div v-if="!loading && !error && rate !== null" class="card-change" :class="changeClass">
        <span class="change-icon">{{ changeIcon }}</span>
        <span class="change-pct">{{ fmtChange }}</span>
      </div>
    </div>

    <!-- 汇率值 -->
    <div class="card-rate">
      <div v-if="loading" class="skeleton"></div>
      <div v-else-if="error" class="card-error">获取失败</div>
      <template v-else-if="rate !== null">
        <span v-if="currency.unit > 1" class="rate-unit">{{ currency.unit }}</span>
        <span class="rate-value">{{ formattedRate }}</span>
        <span class="rate-sub">CNY</span>
      </template>
    </div>

    <!-- 底部换算提示 -->
    <div v-if="!loading && !error && rate !== null" class="card-hint">
      1 CNY ≈ {{ reverseRate }} {{ currency.code }}
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
  error: { type: Boolean, default: false },
  delay: { type: Number, default: 0 }
})

const formattedRate = computed(() =>
  props.rate?.toFixed(4) ?? '--'
)

const reverseRate = computed(() => {
  if (!props.rate) return '--'
  const v = (props.currency.unit / props.rate)
  return v < 0.01 ? v.toFixed(6) : v.toFixed(4)
})

const changeClass = computed(() =>
  props.changePercent > 0 ? 'up' : props.changePercent < 0 ? 'down' : 'flat'
)

const changeIcon = computed(() =>
  props.changePercent > 0 ? '▲' : props.changePercent < 0 ? '▼' : '─'
)

const fmtChange = computed(() =>
  `${props.changePercent >= 0 ? '+' : ''}${props.changePercent}%`
)
</script>

<style lang="scss" scoped>
.rate-card {
  border-radius: var(--radius-xl);
  padding: 18px 20px;
  box-shadow: var(--glass-shadow);
  transition: all .35s var(--ease-out);
  animation: fadeUp .5s var(--ease-out) both;
  position: relative;
  z-index: 1;
  overflow: hidden;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 16px 40px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.06);
  }

  &::after {
    content: '';
    position: absolute;
    top: -30px;
    right: -30px;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: var(--accent);
    opacity: .06;
    pointer-events: none;
  }
}

.card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.card-identity {
  display: flex;
  align-items: center;
  gap: 10px;
}

.flag { font-size: 26px; line-height: 1 }

.card-name {
  display: flex;
  flex-direction: column;
  gap: 1px;
  .card-code { font-size: 14px; font-weight: 700; color: var(--text-primary); letter-spacing: .03em }
  .card-label { font-size: 11px; color: var(--text-tertiary); font-weight: 500 }
}

.card-change {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 600;

  &.up   { background: rgba(48,209,88,.12); color: var(--color-green) }
  &.down { background: rgba(255,59,110,.12); color: var(--color-red) }
  &.flat { background: rgba(0,0,0,.05);     color: var(--text-tertiary) }
}

.card-rate {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 8px;
  min-height: 36px;

  .rate-unit {
    font-size: 14px;
    color: var(--text-tertiary);
    font-weight: 500;
  }

  .rate-value {
    font-size: 30px;
    font-weight: 800;
    letter-spacing: -.03em;
    font-variant-numeric: tabular-nums;
    color: var(--text-primary);
  }

  .rate-sub {
    font-size: 13px;
    color: var(--text-tertiary);
    font-weight: 500;
    margin-left: 2px;
  }

  .skeleton {
    width: 120px;
    height: 30px;
    border-radius: 6px;
    background: linear-gradient(90deg, rgba(0,0,0,.06), rgba(0,0,0,.1), rgba(0,0,0,.06));
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
  }

  .card-error {
    font-size: 14px;
    color: var(--text-tertiary);
  }
}

.card-hint {
  font-size: 11px;
  color: var(--text-tertiary);
  font-weight: 500;
}

@keyframes shimmer {
  0% { background-position: 200% 0 }
  100% { background-position: -200% 0 }
}
</style>
