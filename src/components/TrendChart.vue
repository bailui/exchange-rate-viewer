<template>
  <div ref="chartRef" class="trend-chart" role="img" :aria-label="ariaLabel"
    @mousemove="onPointerMove" @mouseleave="hoverIndex = null" @touchmove.passive="onTouchMove">
    <svg viewBox="0 0 900 340" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="color" stop-opacity="0.22" />
          <stop offset="100%" :stop-color="color" stop-opacity="0" />
        </linearGradient>
      </defs>
      <g class="grid-lines">
        <line v-for="line in gridLines" :key="line.y" x1="56" x2="880" :y1="line.y" :y2="line.y" />
      </g>
      <path :d="areaPath" :fill="`url(#${gradientId})`" />
      <path :d="linePath" fill="none" :stroke="color" stroke-width="2.5"
        stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
      <g v-if="activePoint">
        <line class="hover-line" :x1="activePoint.x" :x2="activePoint.x" y1="18" y2="312" />
        <circle :cx="activePoint.x" :cy="activePoint.y" r="5" :fill="color" stroke="white" stroke-width="3" vector-effect="non-scaling-stroke" />
      </g>
      <g class="axis-labels">
        <text v-for="line in gridLines" :key="`label-${line.y}`" x="48" :y="line.y + 4" text-anchor="end">{{ formatAxis(line.value) }}</text>
        <text x="56" y="332">{{ firstDate }}</text>
        <text x="880" y="332" text-anchor="end">{{ lastDate }}</text>
      </g>
    </svg>

    <div v-if="activePoint" class="chart-tooltip" :style="tooltipStyle">
      <span>{{ formatDate(activePoint.date) }}</span>
      <strong>{{ formatValue(activePoint.value) }}</strong>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, useId } from 'vue'

const props = defineProps({
  points: { type: Array, default: () => [] },
  color: { type: String, default: '#E85D8E' },
  unitLabel: { type: String, default: 'CNY' },
})

const chartRef = ref(null)
const hoverIndex = ref(null)
const gradientId = `trend-${useId().replace(/:/g, '')}`
const values = computed(() => props.points.map((point) => Number(point.value)).filter(Number.isFinite))
const minValue = computed(() => Math.min(...values.value))
const maxValue = computed(() => Math.max(...values.value))
const padding = computed(() => Math.max((maxValue.value - minValue.value) * 0.12, Math.abs(maxValue.value) * 0.004, 0.0001))
const chartMin = computed(() => minValue.value - padding.value)
const chartMax = computed(() => maxValue.value + padding.value)
const range = computed(() => Math.max(chartMax.value - chartMin.value, 0.0001))
const normalizedPoints = computed(() => props.points.map((point, index) => ({
  ...point,
  x: props.points.length === 1 ? 468 : 56 + index * 824 / (props.points.length - 1),
  y: 312 - ((Number(point.value) - chartMin.value) / range.value) * 294,
})))
const linePath = computed(() => normalizedPoints.value.map((point, index) =>
  `${index ? 'L' : 'M'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
).join(' '))
const areaPath = computed(() => normalizedPoints.value.length
  ? `${linePath.value} L 880 312 L 56 312 Z`
  : '')
const gridLines = computed(() => Array.from({ length: 5 }, (_, index) => {
  const ratio = index / 4
  return { y: 18 + ratio * 294, value: chartMax.value - ratio * range.value }
}))
const activePoint = computed(() => hoverIndex.value === null ? null : normalizedPoints.value[hoverIndex.value])
const tooltipStyle = computed(() => activePoint.value ? {
  left: `${activePoint.value.x / 9}%`,
  top: `${Math.max(8, activePoint.value.y / 3.4 - 4)}%`,
} : {})
const firstDate = computed(() => formatDate(props.points[0]?.date))
const lastDate = computed(() => formatDate(props.points.at(-1)?.date))
const ariaLabel = computed(() => `${props.points.length} 个历史汇率数据点，单位 ${props.unitLabel}`)

function findNearest(clientX) {
  const rect = chartRef.value?.getBoundingClientRect()
  if (!rect || !props.points.length) return
  const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
  hoverIndex.value = Math.round(ratio * (props.points.length - 1))
}
function onPointerMove(event) { findNearest(event.clientX) }
function onTouchMove(event) { findNearest(event.touches?.[0]?.clientX) }
function formatAxis(value) {
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: value < 1 ? 4 : 2 }).format(value)
}
function formatValue(value) {
  return `${new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(value)} ${props.unitLabel}`
}
function formatDate(date) {
  if (!date) return '--'
  return new Date(`${date}T00:00:00`).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.trend-chart { position: relative; width: 100%; height: 100%; min-height: 260px; user-select: none; }
.trend-chart svg { display: block; width: 100%; height: 100%; overflow: visible; }
.grid-lines line { stroke: var(--color-border-subtle); stroke-width: 1; vector-effect: non-scaling-stroke; }
.axis-labels { fill: var(--color-text-muted); font-size: 11px; font-weight: 600; }
.hover-line { stroke: var(--color-border-strong); stroke-width: 1; stroke-dasharray: 5 5; vector-effect: non-scaling-stroke; }
.chart-tooltip { position: absolute; transform: translate(-50%, -110%); pointer-events: none; display: flex; flex-direction: column; gap: 2px; min-width: 112px; padding: 8px 10px; border: 1px solid var(--color-border); border-radius: 10px; background: rgba(255,255,255,.96); box-shadow: var(--shadow-floating); color: var(--color-text-soft); font-size: 11px; z-index: 2; }
.chart-tooltip strong { color: var(--color-text); font-size: 13px; }
</style>
