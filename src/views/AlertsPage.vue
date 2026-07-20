<template>
  <div class="max-w-4xl mx-auto">
    <div class="mb-5">
      <h1 class="text-xl font-extrabold text-[var(--color-text)]">汇率提醒</h1>
      <p class="text-sm text-[var(--color-text-soft)] mt-1">当目标汇率达到设定条件时及时提醒你</p>
    </div>

    <!-- 新增提醒卡片 -->
    <div class="bg-white rounded-[var(--radius-card)] p-5 md:p-6 border border-[var(--color-border)] shadow-[var(--shadow-card)] mb-5">
      <h3 class="text-base font-bold text-[var(--color-text)] mb-4">🔔 新增提醒</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div>
          <label class="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1 block">来源币种</label>
          <select v-model="form.from" class="form-input w-full">
            <option v-for="c in currencies" :key="'af-'+c.code" :value="c.code">{{ c.flag }} {{ c.code }} - {{ c.name }}</option>
          </select>
        </div>
        <div>
          <label class="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1 block">目标币种</label>
          <select v-model="form.to" class="form-input w-full">
            <option v-for="c in currencies" :key="'at-'+c.code" :value="c.code">{{ c.flag }} {{ c.code }} - {{ c.name }}</option>
          </select>
        </div>
        <div>
          <label class="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1 block">触发条件</label>
          <select v-model="form.direction" class="form-input w-full">
            <option value="above">≥ 高于目标值</option>
            <option value="below">≤ 低于目标值</option>
          </select>
        </div>
        <div>
          <label class="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1 block">目标汇率</label>
          <input v-model.number="form.target" type="number" step="any" placeholder="如 7.00" class="form-input w-full" />
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button @click="addAlert" :disabled="!form.target||form.target<=0" class="px-6 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-all">添加提醒</button>
        <span v-if="formError" class="text-xs text-[var(--color-danger)]">{{ formError }}</span>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="alerts.length===0" class="bg-white rounded-[var(--radius-card)] p-10 border border-[var(--color-border)] shadow-[var(--shadow-card)] text-center">
      <div class="text-5xl mb-4">🔕</div>
      <h3 class="text-base font-bold text-[var(--color-text)] mb-2">暂时没有汇率提醒</h3>
      <p class="text-sm text-[var(--color-text-soft)] mb-4">设置目标汇率后，我们会在条件达到时提示你</p>
    </div>

    <!-- 提醒列表 -->
    <div v-else class="bg-white rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-[var(--shadow-card)] overflow-hidden">
      <div class="flex items-center px-4 py-2.5 bg-[var(--color-bg-soft)] border-b border-[var(--color-border)] text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
        <span class="w-28">币种对</span><span class="w-20">条件</span><span class="w-24 text-right">当前汇率</span><span class="w-24 text-right">目标汇率</span><span class="w-16 text-center">状态</span><span class="w-16 text-center">操作</span>
      </div>
      <div v-for="(a,i) in alerts" :key="i" class="flex items-center px-4 py-3 border-b border-[var(--color-bg-soft)] text-[13px] last:border-b-0 hover:bg-[var(--color-bg-soft)]/40 transition-colors">
        <span class="w-28 font-semibold text-[var(--color-text)]">{{ a.flag }} {{ a.from }} → {{ a.to }}</span>
        <span class="w-20 text-[var(--color-text-soft)]">{{ a.direction === 'above' ? '≥' : '≤' }}</span>
        <span class="w-24 text-right font-semibold text-[var(--color-text)] font-[var(--font-mono)] text-xs">{{ a.current?.toFixed(4) || '--' }}</span>
        <span class="w-24 text-right font-semibold font-[var(--font-mono)] text-xs" :class="a.met ? 'text-[var(--color-success)]' : 'text-[var(--color-text-soft)]'">{{ a.target }}</span>
        <span class="w-16 text-center">
          <span :class="['inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold', a.enabled!==false ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400']">{{ a.enabled!==false ? '启用' : '停用' }}</span>
        </span>
        <span class="w-16 flex justify-center gap-1">
          <button @click="a.enabled=a.enabled===false" class="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)]" :title="a.enabled===false?'启用':'停用'">{{ a.enabled===false?'▶':'⏸' }}</button>
          <button @click="confirmDelete(i)" class="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-danger)]">✕</button>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref,reactive } from 'vue'
import { HOT_CURRENCIES, CURRENCY_META } from '../api/exchangeRate.js'

const currencies = HOT_CURRENCIES.map(code => ({ code, ...CURRENCY_META[code] || {name:code,flag:'💱',symbol:'',color:'#c4a8b4'} }))
const alerts = reactive([])
const form = reactive({ from:'USD', to:'CNY', direction:'above', target:null, note:'' })
const formError = ref('')

try{ const s=localStorage.getItem('fx_alerts'); if(s) alerts.push(...JSON.parse(s)) } catch {}
function saveAlerts(){ try{ localStorage.setItem('fx_alerts',JSON.stringify([...alerts])) } catch {} }

function addAlert(){
  formError.value=''
  if(!form.target||form.target<=0){ formError.value='请输入有效的目标汇率'; return }
  const c = currencies.find(c=>c.code===form.from)
  alerts.push({
    flag:c?.flag||'💱', from:form.from, to:form.to,
    direction:form.direction, target:form.target, current:null, enabled:true,
    createdAt: new Date().toISOString()
  })
  form.target=null; saveAlerts()
}

function confirmDelete(i){
  if(confirm('确认删除这条汇率提醒？')){ alerts.splice(i,1); saveAlerts() }
}
</script>

<style>
@reference "tailwindcss";
.form-input { @apply h-10 rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)] transition-all; }
</style>
