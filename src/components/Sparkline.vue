<template>
  <div v-if="values.length >= 2" class="sparkline" :aria-label="ariaLabel" role="img">
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="color" stop-opacity="0.24" />
          <stop offset="100%" :stop-color="color" stop-opacity="0" />
        </linearGradient>
      </defs>
      <path :d="areaPath" :fill="`url(#${gradientId})`" />
      <path :d="linePath" fill="none" :stroke="color" stroke-width="1.8"
        stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
    </svg>
    <span v-if="showLabel" class="sparkline-change" :class="trendClass">
      {{ trendArrow }} {{ trendText }}
    </span>
  </div>
  <div v-else class="sparkline-empty">暂无趋势</div>
</template>

<script setup>
import { computed, useId } from 'vue'

const props = defineProps({
  data: { type: Array, default: () => [] },
  color: { type: String, default: '#E85D8E' },
  showLabel: { type: Boolean, default: false },
})

const gradientId = `spark-${useId().replace(/:/g, '')}`
const values = computed(() => props.data
  .map((item) => Number(typeof item === 'object' ? item.value : item))
  .filter(Number.isFinite))
const max = computed(() => Math.max(...values.value))
const min = computed(() => Math.min(...values.value))
const spread = computed(() => Math.max(max.value - min.value, Math.abs(max.value) * 0.002, 0.0001))
const points = computed(() => values.value.map((value, index) => ({
  x: values.value.length === 1 ? 50 : index * 100 / (values.value.length - 1),
  y: 36 - ((value - min.value) / spread.value) * 30,
})))
const linePath = computed(() => points.value.map((point, index) =>
  `${index ? 'L' : 'M'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
).join(' '))
const areaPath = computed(() => `${linePath.value} L 100 40 L 0 40 Z`)
const difference = computed(() => values.value.at(-1) - values.value[0])
const percentage = computed(() => values.value[0]
  ? difference.value / values.value[0] * 100
  : 0)
const trendClass = computed(() => difference.value > 0 ? 'is-up' : difference.value < 0 ? 'is-down' : '')
const trendArrow = computed(() => difference.value > 0 ? '↑' : difference.value < 0 ? '↓' : '–')
const trendText = computed(() => `${Math.abs(percentage.value).toFixed(2)}%`)
const ariaLabel = computed(() => `汇率趋势，区间变化 ${percentage.value.toFixed(2)}%`)
</script>

<style scoped>
.sparkline { position: relative; width: 100%; height: 100%; min-height: 28px; }
.sparkline svg { display: block; width: 100%; height: 100%; overflow: visible; }
.sparkline-change { position: absolute; right: 0; top: 0; font-size: 11px; font-weight: 700; color: var(--color-text-muted); }
.sparkline-change.is-up { color: var(--color-danger); }
.sparkline-change.is-down { color: var(--color-success); }
.sparkline-empty { display: grid; place-items: center; height: 100%; min-height: 28px; color: var(--color-text-muted); font-size: 11px; }
</style>
