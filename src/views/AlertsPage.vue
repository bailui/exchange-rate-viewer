<template>
  <div class="page">
    <div class="bg-deco deco-1"></div>

    <div class="glass anim-up" style="padding:24px;border-radius:var(--radius-xl);position:relative;z-index:1">
      <h2 style="font-size:18px;font-weight:800;margin-bottom:6px">🔔 汇率提醒</h2>
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:20px">当汇率达到目标值时通知你</p>

      <div v-if="alerts.length === 0" class="empty">
        <span style="font-size:40px">🔕</span>
        <p>暂无提醒，点击下方添加</p>
      </div>

      <div v-for="(alert, i) in alerts" :key="i" class="alert-item glass" style="background:var(--bg-secondary);padding:14px 16px;border-radius:var(--radius-md);margin-bottom:8px">
        <div class="alert-info">
          <span class="alert-flag">{{ alert.flag }}</span>
          <div>
            <div style="font-size:14px;font-weight:600">{{ alert.from }} → {{ alert.to }}</div>
            <div style="font-size:12px;color:var(--text-tertiary)">
              目标 {{ alert.direction === 'above' ? '≥' : '≤' }} {{ alert.target }}
              · 当前 {{ alert.current?.toFixed(4) || '--' }}
            </div>
          </div>
        </div>
        <button class="del-btn" @click="alerts.splice(i,1);save()">✕</button>
      </div>

      <div class="add-alert" style="margin-top:16px;padding-top:16px;border-top:1px solid var(--p-100)">
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <select v-model="newAlert.from" style="padding:8px 12px;border-radius:100px;border:1px solid var(--p-200);font-size:13px;background:var(--bg-secondary)">
            <option v-for="c in currencies" :key="'af-'+c.code" :value="c.code">{{ c.flag }} {{ c.code }}</option>
          </select>
          <span style="color:var(--text-tertiary)">→</span>
          <select v-model="newAlert.to" style="padding:8px 12px;border-radius:100px;border:1px solid var(--p-200);font-size:13px;background:var(--bg-secondary)">
            <option v-for="c in currencies" :key="'at-'+c.code" :value="c.code">{{ c.flag }} {{ c.code }}</option>
          </select>
          <select v-model="newAlert.direction" style="padding:8px 12px;border-radius:100px;border:1px solid var(--p-200);font-size:13px;background:var(--bg-secondary)">
            <option value="above">≥ 高于</option>
            <option value="below">≤ 低于</option>
          </select>
          <input v-model.number="newAlert.target" type="number" step="any" placeholder="目标汇率" style="padding:8px 12px;border-radius:100px;border:1px solid var(--p-200);font-size:13px;width:120px;background:var(--bg-secondary)" />
          <button @click="addAlert" class="add-btn">添加提醒</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { FOCUS_CURRENCIES } from '../api/exchangeRate.js'

const currencies = FOCUS_CURRENCIES
const alerts = reactive([])

const newAlert = reactive({ from: 'USD', to: 'CNY', direction: 'above', target: 7.0 })

try {
  const saved = localStorage.getItem('fx_alerts')
  if (saved) alerts.push(...JSON.parse(saved))
} catch {}

function save() {
  try { localStorage.setItem('fx_alerts', JSON.stringify([...alerts])) } catch {}
}

function addAlert() {
  if (!newAlert.target || newAlert.target <= 0) return
  const c = currencies.find(c => c.code === newAlert.from)
  alerts.push({
    flag: c?.flag || '💱',
    from: newAlert.from,
    to: newAlert.to,
    direction: newAlert.direction,
    target: newAlert.target,
    current: null
  })
  newAlert.target = 0
  save()
}
</script>

<style lang="scss" scoped>
.page { max-width: 800px; margin: 0 auto; position: relative }
.bg-deco {
  position: absolute; border-radius: 50%; pointer-events: none; z-index: 0;
  top: -30px; left: -50px; width: 240px; height: 240px;
  background: radial-gradient(circle, rgba(255,92,138,.08) 0%, transparent 70%);
}
.empty { text-align: center; padding: 40px 0; color: var(--text-tertiary); p { margin-top: 8px; font-size: 14px } }
.alert-item { display: flex; align-items: center; justify-content: space-between }
.alert-info { display: flex; align-items: center; gap: 10px; .alert-flag { font-size: 22px } }
.del-btn {
  width: 28px; height: 28px; border-radius: 50%; border: none;
  background: rgba(0,0,0,.06); cursor: pointer; font-size: 12px;
  color: var(--text-tertiary); transition: all .2s;
  &:hover { background: #fee; color: #e84a78 }
}
.add-btn {
  padding: 8px 18px; border-radius: 100px; border: none;
  background: var(--p-500); color: #fff; font-weight: 600; font-size: 13px;
  cursor: pointer; transition: all .2s;
  &:hover { background: var(--p-600) }
}
</style>
