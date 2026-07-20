<template>
  <div class="sparkline" v-if="data.length >= 2">
    <svg :viewBox="`0 0 ${data.length-1} ${range}`" preserveAspectRatio="none">
      <defs>
        <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="color" stop-opacity="0.25" />
          <stop offset="100%" :stop-color="color" stop-opacity="0.02" />
        </linearGradient>
      </defs>
      <path
        :d="areaPath"
        :fill="`url(#${gradientId})`"
      />
      <path
        :d="linePath"
        fill="none"
        :stroke="color"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
      />
    </svg>
    <div class="sparkline-label" :class="trendClass">
      <span class="trend-arrow">{{ trendArrow }}</span>
      <span class="trend-text">{{ trendText }}</span>
    </div>
  </div>
  <div v-else class="sparkline-placeholder">
    收集数据中...
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: { type: Array, default: () => [] },
  color: { type: String, default: '#ff5c8a' }
})

const gradientId = computed(() => `grad-${Math.random().toString(36).slice(2)}`)

const max = computed(() => Math.max(...props.data, 1))
const min = computed(() => Math.min(...props.data, max.value))
const range = computed(() => {
  const r = max.value - min.value
  return r < 0.001 ? 1 : r + r * 0.3
})

const points = computed(() =>
  props.data.map((v, i) => ({
    x: i,
    y: range.value - (v - min.value)
  }))
)

const linePath = computed(() => {
  if (points.value.length < 2) return ''
  const pts = points.value
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const cp1x = pts[i-1].x + 0.4
    const cp1y = pts[i-1].y
    const cp2x = pts[i].x - 0.4
    const cp2y = pts[i].y
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pts[i].x} ${pts[i].y}`
  }
  return d
})

const areaPath = computed(() => {
  if (points.value.length < 2) return ''
  return `${linePath.value} L ${points.value[points.value.length-1].x} ${range.value} L 0 ${range.value} Z`
})

const firstVal = computed(() => props.data[0])
const lastVal = computed(() => props.data[props.data.length-1])
const diff = computed(() => lastVal.value - firstVal.value)
const diffPct = computed(() => firstVal.value ? (diff.value / firstVal.value * 100).toFixed(2) : 0)

const trendClass = computed(() => diff.value > 0 ? 'up' : diff.value < 0 ? 'down' : 'flat')
const trendArrow = computed(() => diff.value > 0 ? '▲' : diff.value < 0 ? '▼' : '─')
const trendText = computed(() => {
  const p = diffPct.value
  return `${p >= 0 ? '+' : ''}${p}%`
})
</script>

<style lang="scss" scoped>
.sparkline {
  display: flex;
  align-items: center;
  gap: 8px;

  svg {
    width: 80px;
    height: 28px;
    flex-shrink: 0;
  }

  &-label {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 11px;
    font-weight: 600;

    &.up { color: #e84a78 }
    &.down { color: #30b469 }
    &.flat { color: var(--text-tertiary) }
  }
}

.sparkline-placeholder {
  font-size: 11px;
  color: var(--text-tertiary);
  font-style: italic;
}
</style>
