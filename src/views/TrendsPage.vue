<template>
  <div class="page">
    <div class="bg-deco deco-1"></div>

    <div class="glass anim-up" style="padding:24px;border-radius:var(--radius-xl);position:relative;z-index:1">
      <h2 style="font-size:18px;font-weight:800;margin-bottom:6px">📈 走势分析</h2>
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:20px">
        页面打开期间自动记录汇率变化，可视化展示走势
      </p>

      <div class="trend-grid">
        <div v-for="c in trendCurrencies" :key="c.code" class="trend-card glass" style="background:var(--bg-secondary);padding:18px;border-radius:var(--radius-lg)">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
            <span style="font-size:24px">{{ c.flag }}</span>
            <div>
              <div style="font-size:14px;font-weight:700">{{ c.code }} / CNY</div>
              <div style="font-size:12px;color:var(--text-tertiary)">{{ c.name }}</div>
            </div>
          </div>
          <Sparkline :data="c.history" :color="'#ff5c8a'" />
          <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:11px;color:var(--text-tertiary)">
            <span>开始 · {{ c.history[0]?.toFixed(4) || '--' }}</span>
            <span>当前 · {{ c.history[c.history.length-1]?.toFixed(4) || '--' }}</span>
          </div>
        </div>
      </div>

      <div v-if="trendCurrencies.every(c => c.history.length < 2)" class="empty" style="text-align:center;padding:30px;color:var(--text-tertiary)">
        <span style="font-size:36px">⏳</span>
        <p style="margin-top:8px;font-size:14px">数据收集中...请保持页面打开几分钟</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { FOCUS_CURRENCIES } from '../api/exchangeRate.js'
import Sparkline from '../components/Sparkline.vue'

const trendCurrencies = computed(() => {
  try {
    const stored = localStorage.getItem('fx_history')
    const histories = stored ? JSON.parse(stored) : {}
    return FOCUS_CURRENCIES.map(c => ({ ...c, history: histories[c.code] || [] }))
  } catch { return FOCUS_CURRENCIES.map(c => ({ ...c, history: [] })) }
})
</script>

<style lang="scss" scoped>
.page { max-width: 1400px; margin: 0 auto; position: relative }
.bg-deco {
  position: absolute; border-radius: 50%; pointer-events: none; z-index: 0;
  top: 60px; right: -40px; width: 200px; height: 200px;
  background: radial-gradient(circle, rgba(255,92,138,.06) 0%, transparent 70%);
}
.trend-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
  @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr) }
  @media (max-width: 500px) { grid-template-columns: 1fr }
}
.trend-card { box-shadow: var(--glass-shadow) }
</style>
