<template>
  <div class="conv">
    <div class="conv-head">
      <h3>🧮 汇率计算器</h3>
      <span class="badge">实时</span>
    </div>

    <div class="conv-row">
      <div class="field">
        <label class="fl">持有货币</label>
        <div class="input-wrap">
          <input v-model.number="amount" type="number" min="0" placeholder="0" />
          <span class="tag" :style="{color: fromColor }">{{ fromCurrency }}</span>
        </div>
      </div>

      <button class="swap" @click="swapCurrencies">⇄</button>

      <div class="field">
        <label class="fl">兑换结果</label>
        <div class="input-wrap result">
          <span class="res-num">{{ result }}</span>
          <span class="tag" :style="{color: toColor }">{{ toCurrency }}</span>
        </div>
      </div>
    </div>

    <div class="sel-group">
      <label class="fl">从</label>
      <div class="chips">
        <button v-for="c in currencies" :key="'f-'+c.code"
          :class="['chip', { on: fromCurrency===c.code }]"
          @click="fromCurrency=c.code"
        >{{ c.flag }} {{ c.code }}</button>
      </div>
    </div>
    <div class="sel-group">
      <label class="fl">到</label>
      <div class="chips">
        <button v-for="c in currencies" :key="'t-'+c.code"
          :class="['chip', { on: toCurrency===c.code }]"
          @click="toCurrency=c.code"
        >{{ c.flag }} {{ c.code }}</button>
      </div>
    </div>

    <div class="rate-info" v-if="rateInfo">
      <span>1 {{ fromCurrency }} = <b>{{ rateInfo }}</b> {{ toCurrency }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { fetchLiveRates, HOT_CURRENCIES, CURRENCY_META } from '../api/exchangeRate.js'

const currencies = HOT_CURRENCIES.map(code => ({ code, ...CURRENCY_META[code] || {name:code,flag:'💱',symbol:'',color:'#4a8cf7'} }))
const amount = ref(100)
const fromCurrency = ref('USD')
const toCurrency = ref('CNY')
const allRates = ref({})

async function init() { try { const d = await fetchLiveRates(); allRates.value = d.rates || {} } catch {} }
init()

const fromColor = computed(()=>'#4a8cf7')
const toColor = computed(()=>'#22c55e')

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
  background:var(--bg-card); border:1px solid var(--border);
  border-radius:var(--r-md); padding:20px; margin-bottom:16px;
  box-shadow:var(--shadow);
}
.conv-head { display:flex; align-items:center; gap:8px; margin-bottom:16px }
.conv-head h3 { font-size:15px; font-weight:700; color:var(--text) }
.badge { font-size:10px; font-weight:600; color:var(--accent); background:var(--accent-light); padding:2px 8px; border-radius:4px }

.conv-row { display:flex; align-items:flex-end; gap:8px; margin-bottom:12px }
.field { flex:1; display:flex; flex-direction:column; gap:5px }
.fl { font-size:11px; font-weight:600; color:var(--text2); text-transform:uppercase; letter-spacing:.04em }

.input-wrap {
  display:flex; align-items:center; height:44px;
  background:var(--bg-input); border:1px solid var(--border);
  border-radius:var(--r-sm); padding:0 12px;
  transition:border-color .2s;
  &:focus-within { border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-light) }
  input { flex:1; border:none; outline:none; background:transparent; font-size:18px; font-weight:700; font-variant-numeric:tabular-nums; color:var(--text); font-family:inherit; min-width:0; padding:0 !important }
  &.result { background:var(--accent-light); border-color:rgba(74,140,247,.2) }
}
.res-num { font-size:18px; font-weight:800; font-variant-numeric:tabular-nums; color:var(--accent); flex:1 }
.tag { font-size:13px; font-weight:700; flex-shrink:0 }

.swap {
  width:36px; height:36px; border-radius:6px;
  border:1px solid var(--border); background:var(--bg-card); cursor:pointer;
  font-size:16px; color:var(--text2); transition:all .2s; margin-bottom:4px;
  display:flex; align-items:center; justify-content:center;
  &:hover { border-color:var(--accent); color:var(--accent) }
  &:active { transform:scale(.94) }
}

.sel-group { display:flex; flex-direction:column; gap:5px; margin-bottom:8px }
.chips { display:flex; flex-wrap:wrap; gap:4px }
.chip {
  display:flex; align-items:center; gap:2px;
  padding:4px 10px; border-radius:6px;
  border:1px solid var(--border); background:var(--bg-card);
  color:var(--text2); font-size:11px; font-weight:500;
  cursor:pointer; transition:all .15s; font-family:inherit;
  &:hover { border-color:var(--accent); color:var(--text) }
  &.on { background:var(--accent); color:#fff; border-color:var(--accent); font-weight:600 }
}

.rate-info {
  text-align:center; padding:8px; border-radius:var(--r-sm);
  background:var(--bg-input); font-size:12px; color:var(--text2);
  b { color:var(--text); font-weight:700 }
}
</style>
