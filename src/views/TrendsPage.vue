<template>
  <div class="page">
    <div class="header glass">
      <h2>📈 历史走势</h2>
      <div class="range-pills">
        <button v-for="r in ranges" :key="r.days"
          :class="['pill', { on: activeRange===r.days }]"
          @click="loadRange(r.days)"
        >{{ r.label }}</button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <span class="spinner">⏳</span>
      <p>加载历史数据中...</p>
    </div>

    <div v-else class="trend-grid">
      <div v-for="c in trendData" :key="c.code" class="trend-card glass">
        <div class="tc-top">
          <span class="tc-flag">{{ c.flag }}</span>
          <div>
            <div class="tc-code">{{ c.code }} / CNY</div>
            <div class="tc-name">{{ c.name }}</div>
          </div>
          <div class="tc-change" :class="c.trend">
            <span>{{ c.trendArrow }}</span>
            <span>{{ c.changeStr }}</span>
          </div>
        </div>

        <div class="tc-chart">
          <Sparkline :data="c.data" :color="c.color" />
        </div>

        <div class="tc-range">
          <span>起始 · {{ c.data[0]?.toFixed(4) || '--' }}</span>
          <span>最新 · {{ c.data[c.data.length-1]?.toFixed(4) || '--' }}</span>
        </div>
      </div>
    </div>

    <div v-if="!loading && trendData.length===0" class="empty">
      <span>📭</span>
      <p>暂无历史数据</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { FOCUS_CURRENCIES, fetchHistory, getCNYHistory } from '../api/exchangeRate.js'
import Sparkline from '../components/Sparkline.vue'

const ranges = [
  { days:7, label:'7天' },
  { days:30, label:'30天' },
  { days:90, label:'90天' },
  { days:180, label:'180天' },
  { days:360, label:'360天' },
]

const activeRange = ref(7)
const loading = ref(true)
const trendData = reactive([])

onMounted(() => loadRange(7))

async function loadRange(days) {
  activeRange.value = days
  loading.value = true
  trendData.length = 0

  try {
    const data = await fetchHistory(days)
    FOCUS_CURRENCIES.forEach(c => {
      const values = getCNYHistory(data, c.code)
      if (values.length < 2) return

      const first = values[0], last = values[values.length-1]
      const diff = last - first
      const pct = first ? (diff/first*100) : 0
      const trend = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat'

      trendData.push({
        ...c,
        data: values,
        trend,
        trendArrow: diff>0?'▲':diff<0?'▼':'─',
        changeStr: `${pct>=0?'+':''}${pct.toFixed(2)}%`
      })
    })
  } catch(e) { console.error(e) }
  finally { loading.value = false }
}
</script>

<style lang="scss" scoped>
.page { max-width:1400px; margin:0 auto; padding-top:16px }

.header {
  border-radius:var(--radius-lg); padding:16px 20px; margin-bottom:18px;
  display:flex; align-items:center; justify-content:space-between;
  flex-wrap:wrap; gap:12px;
  animation:fadeUp .5s var(--ease-out) both;

  h2 { font-size:16px; font-weight:800; letter-spacing:-.02em }
}

.range-pills { display:flex; gap:6px; flex-wrap:wrap }

.pill {
  padding:6px 14px; border-radius:100px;
  border:1px solid var(--border-input);
  background:var(--bg-input); color:var(--text-secondary);
  font-size:12px; font-weight:600; cursor:pointer;
  transition:all .2s; font-family:inherit;

  &:hover { border-color:var(--accent); color:var(--text-primary) }
  &.on {
    background:linear-gradient(135deg,#6366f1,#a855f7);
    color:#fff; border-color:transparent;
  }
}

.loading-state { text-align:center; padding:60px 0; color:var(--text-muted); .spinner{ font-size:36px; display:block; margin-bottom:8px } p { font-size:14px } }

.trend-grid {
  display:grid;
  grid-template-columns:repeat(1,1fr);
  gap:12px;
  @media (min-width:700px) { grid-template-columns:repeat(2,1fr) }
  @media (min-width:1100px) { grid-template-columns:repeat(3,1fr) }
}

.trend-card {
  border-radius:var(--radius-lg); padding:18px 20px;
  animation: fadeUp .5s var(--ease-out) both;

  &:nth-child(1) { animation-delay:.05s }
  &:nth-child(2) { animation-delay:.1s }
  &:nth-child(3) { animation-delay:.15s }
  &:nth-child(4) { animation-delay:.2s }
  &:nth-child(5) { animation-delay:.25s }
}

.tc-top {
  display:flex; align-items:center; gap:10px; margin-bottom:14px;
  .tc-flag { font-size:26px; line-height:1 }
  .tc-code { font-size:14px; font-weight:700; color:var(--text-primary) }
  .tc-name { font-size:11px; color:var(--text-muted); font-weight:500 }
}
.tc-change {
  margin-left:auto; display:flex; align-items:center; gap:3px;
  font-size:12px; font-weight:600;
  &.up { color:#4ade80 }
  &.down { color:#f87171 }
  &.flat { color:var(--text-muted) }
}

.tc-chart { margin-bottom:10px }

.tc-range {
  display:flex; justify-content:space-between;
  font-size:11px; color:var(--text-muted);
}

.empty { text-align:center; padding:60px 0; color:var(--text-muted); span{ font-size:40px } p{ margin-top:8px; font-size:14px } }
</style>
