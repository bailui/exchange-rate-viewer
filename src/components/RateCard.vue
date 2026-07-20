<template>
  <div class="rate-card glass" :style="{ animationDelay: delay + 'ms' }">
    <div class="card-top">
      <div class="card-identity">
        <span class="flag">{{ currency.flag }}</span>
        <div class="card-name">
          <span class="card-code">{{ currency.code }} <span class="card-cny">/ CNY</span></span>
          <span class="card-label">{{ currency.name }}</span>
        </div>
      </div>
      <div v-if="!loading && !error && rate !== null" class="card-change" :class="changeClass">
        <span>{{ fmtChange }}</span>
      </div>
    </div>

    <div class="card-rate">
      <div v-if="loading" class="skeleton"></div>
      <div v-else-if="error" class="card-error">获取失败</div>
      <template v-else-if="rate !== null">
        <span v-if="currency.unit > 1" class="rate-unit">{{ currency.unit }}</span>
        <span class="rate-value">{{ formattedRate }}</span>
      </template>
    </div>

    <!-- 迷你趋势图 -->
    <div class="card-spark" v-if="!loading && !error && rate !== null">
      <Sparkline :data="history" :color="pinkColor" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Sparkline from './Sparkline.vue'

const props = defineProps({
  currency: { type: Object, required: true },
  rate: { type: Number, default: null },
  changePercent: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
  delay: { type: Number, default: 0 },
  history: { type: Array, default: () => [] }
})

const pinkColor = '#ff5c8a'
const formattedRate = computed(() => props.rate?.toFixed(4) ?? '--')
const changeClass = computed(() =>
  props.changePercent > 0 ? 'up' : props.changePercent < 0 ? 'down' : 'flat'
)
const fmtChange = computed(() =>
  `${props.changePercent >= 0 ? '+' : ''}${props.changePercent}%`
)
</script>

<style lang="scss" scoped>
.rate-card {
  border-radius: var(--radius-xl);
  padding: 16px 20px;
  box-shadow: var(--glass-shadow);
  transition: all .35s var(--ease-out);
  animation: fadeUp .5s var(--ease-out) both;
  position: relative;
  z-index: 1;
  overflow: hidden;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 16px 40px rgba(255,92,138,.08), 0 0 0 1px rgba(255,92,138,.12);
  }
}

.card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 8px;
}
.card-identity { display: flex; align-items: center; gap: 10px }
.flag { font-size: 24px; line-height: 1 }

.card-name {
  display: flex;
  flex-direction: column;
  gap: 1px;
  .card-code {
    font-size: 14px; font-weight: 700; color: var(--text-primary);
    .card-cny { font-size: 10px; color: var(--text-tertiary); font-weight: 500 }
  }
  .card-label { font-size: 11px; color: var(--text-tertiary); font-weight: 500 }
}

.card-change {
  padding: 3px 8px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 600;
  &.up   { background: rgba(232,74,120,.1); color: var(--p-600) }
  &.down { background: rgba(48,180,105,.1); color: #30b469 }
  &.flat { background: rgba(0,0,0,.04); color: var(--text-tertiary) }
}

.card-rate {
  display: flex;
  align-items: baseline;
  gap: 3px;
  margin-bottom: 8px;
  min-height: 32px;

  .rate-unit { font-size: 12px; color: var(--text-tertiary); font-weight: 500 }
  .rate-value { font-size: 28px; font-weight: 800; letter-spacing: -.03em; font-variant-numeric: tabular-nums; color: var(--text-primary) }
  .skeleton { width: 100px; height: 28px; border-radius: 6px; background: linear-gradient(90deg, rgba(0,0,0,.04), rgba(0,0,0,.08), rgba(0,0,0,.04)); background-size: 200% 100%; animation: shimmer 1.5s ease-in-out infinite }
  .card-error { font-size: 13px; color: var(--text-tertiary) }
}

.card-spark { margin-top: 2px }

@keyframes shimmer {
  0% { background-position: 200% 0 }
  100% { background-position: -200% 0 }
}
</style>
