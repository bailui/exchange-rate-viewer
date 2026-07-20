<template>
  <div class="conv glass">
    <div class="conv-head">
      <h3>🧮 汇率计算器</h3>
      <span class="badge">实时换算</span>
    </div>

    <div class="conv-row">
      <div class="field">
        <label class="fl">持有货币</label>
        <div class="input-wrap">
          <input v-model.number="amount" type="number" min="0" step="any" placeholder="0" />
          <span class="curr-tag" :style="{color:fromColor}">{{ fromCurrency }}</span>
        </div>
      </div>

      <button class="swap" @click="swapCurrencies">⇄</button>

      <div class="field">
        <label class="fl">兑换结果</label>
        <div class="input-wrap result">
          <span class="res-num">{{ result }}</span>
          <span class="curr-tag" :style="{color:toColor}">{{ toCurrency }}</span>
        </div>
      </div>
    </div>

    <div class="sel-group">
      <label class="fl">从</label>
      <div class="chips">
        <button v-for="c in currencies" :key="'f-'+c.code"
          :class="['chip', { on: fromCurrency===c.code }]"
          @click="fromCurrency=c.code"
        ><span class="cf">{{ c.flag }}</span> {{ c.code }}</button>
      </div>
    </div>
    <div class="sel-group">
      <label class="fl">到</label>
      <div class="chips">
        <button v-for="c in currencies" :key="'t-'+c.code"
          :class="['chip', { on: toCurrency===c.code }]"
          @click="toCurrency=c.code"
        ><span class="cf">{{ c.flag }}</span> {{ c.code }}</button>
      </div>
    </div>

    <div class="rate-info" v-if="rateInfo">
      1 {{ fromCurrency }} = <strong>{{ rateInfo }}</strong> {{ toCurrency }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { FOCUS_CURRENCIES, fetchLiveRates } from '../api/exchangeRate.js'

const currencies = FOCUS_CURRENCIES
const amount = ref(100)
const fromCurrency = ref('USD')
const toCurrency = ref('CNY')
const allRates = ref({})

async function init() {
  try { const d = await fetchLiveRates(); allRates.value = d.rates || {} } catch {}
}
init()

const fromColor = computed(()=>currencies.find(c=>c.code===fromCurrency.value)?.color||'#818cf8')
const toColor = computed(()=>currencies.find(c=>c.code===toCurrency.value)?.color||'#818cf8')

const result = computed(()=>{
  if (!amount.value||amount.value<=0) return '0.00'
  const r = crossRate(); return r ? (amount.value*r).toFixed(2) : '--'
})
const rateInfo = computed(()=>{ const r=crossRate(); return r?.toFixed(4)||null })

function crossRate(){
  const r = allRates.value; if(!r) return null
  const f=fromCurrency.value, t=toCurrency.value
  if(f===t) return 1
  const f2c = f==='CNY'?1:(r[f]?1/r[f]:null)
  const c2t = t==='CNY'?1:(r[t]||null)
  return f2c!=null&&c2t!=null ? f2c*c2t : null
}

function swapCurrencies(){ [fromCurrency.value,toCurrency.value]=[toCurrency.value,fromCurrency.value] }
</script>

<style lang="scss" scoped>
.conv {
  border-radius:var(--radius-lg); padding:20px; margin-bottom:16px;
  animation:fadeUp .5s var(--ease-out) .05s both;
}
.conv-head {
  display:flex; align-items:center; gap:8px; margin-bottom:16px;
  h3 { font-size:16px; font-weight:800 }
  .badge { font-size:10px; font-weight:600; color:#a78bfa; background:rgba(167,139,250,.1); padding:2px 8px; border-radius:100px }
}

.conv-row { display:flex; align-items:flex-end; gap:8px; margin-bottom:12px }
.field { flex:1; display:flex; flex-direction:column; gap:5px }
.fl { font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted) }

.input-wrap {
  display:flex; align-items:center; height:48px;
  background:var(--bg-input); border:1px solid var(--border-input);
  border-radius:var(--radius-sm); padding:0 14px;
  transition:border-color .2s;
  &:focus-within { border-color:var(--accent); box-shadow:0 0 0 3px rgba(129,140,248,.12) }
  input {
    flex:1; border:none; outline:none; background:transparent;
    font-size:20px; font-weight:700; font-variant-numeric:tabular-nums;
    color:var(--text-primary); font-family:inherit; min-width:0;
    &::placeholder { color:var(--text-muted) }
  }
  &.result { background:rgba(129,140,248,.06); border-color:rgba(129,140,248,.2) }
}
.res-num { font-size:20px; font-weight:800; font-variant-numeric:tabular-nums; color:#a78bfa; flex:1 }
.curr-tag { font-size:13px; font-weight:700; flex-shrink:0 }

.swap {
  width:36px; height:36px; border-radius:50%;
  border:1px solid var(--border-input); background:var(--bg-input);
  cursor:pointer; font-size:16px; color:var(--text-secondary);
  display:flex; align-items:center; justify-content:center;
  transition:all .2s; margin-bottom:5px;
  &:hover { border-color:var(--accent); color:var(--accent); background:rgba(129,140,248,.1) }
  &:active { transform:scale(.9) }
}

.sel-group { display:flex; flex-direction:column; gap:5px; margin-bottom:8px }
.chips { display:flex; flex-wrap:wrap; gap:5px }
.chip {
  display:flex; align-items:center; gap:3px;
  padding:5px 10px; border-radius:100px;
  border:1px solid var(--border-input); background:var(--bg-input);
  color:var(--text-secondary); font-size:11px; font-weight:500;
  cursor:pointer; transition:all .15s; font-family:inherit;
  .cf { font-size:13px }
  &:hover { border-color:var(--accent); color:var(--text-primary) }
  &.on {
    background:linear-gradient(135deg,#6366f1,#a855f7);
    color:#fff; border-color:transparent; font-weight:600;
  }
}

.rate-info {
  text-align:center; padding:8px; border-radius:var(--radius-sm);
  background:rgba(129,140,248,.06);
  font-size:12px; color:var(--text-secondary);
  strong { color:var(--text-primary); font-weight:700 }
}
</style>
