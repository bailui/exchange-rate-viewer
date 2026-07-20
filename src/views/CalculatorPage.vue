<template>
  <div class="max-w-5xl mx-auto">
    <div class="mb-5">
      <h1 class="text-xl font-extrabold text-[var(--color-text)]">汇率换算</h1>
      <p class="text-sm text-[var(--color-text-soft)] mt-1">快速完成全球货币之间的金额换算</p>
    </div>

    <div class="flex flex-col lg:flex-row gap-5">
      <!-- 左侧：换算器 -->
      <div class="flex-1 bg-white rounded-[var(--radius-card)] p-5 md:p-6 border border-[var(--color-border)] shadow-[var(--shadow-card)]">
        <h3 class="text-base font-bold text-[var(--color-text)] mb-4">🧮 货币换算</h3>

        <!-- 持有 -->
        <label class="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5 block">持有货币</label>
        <div class="input-box-lg mb-3">
          <div class="flex items-center gap-2">
            <select v-model="fromCurrency" class="curr-select">
              <option v-for="c in currencies" :key="'from-'+c.code" :value="c.code">{{ c.flag }} {{ c.code }} - {{ c.name }}</option>
            </select>
          </div>
          <input v-model.number="amount" type="number" min="0" class="text-right flex-1 bg-transparent outline-none text-xl font-bold text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]" placeholder="0" />
        </div>

        <!-- 交换 -->
        <div class="flex justify-center -my-1 relative z-10">
          <button @click="swapCurrencies" class="swap-btn-lg">⇅</button>
        </div>

        <!-- 目标 -->
        <label class="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5 block mt-3">兑换结果</label>
        <div class="input-box-lg bg-[var(--color-primary-light)] border-[var(--color-primary-light)]">
          <div class="flex items-center gap-2">
            <select v-model="toCurrency" class="curr-select">
              <option v-for="c in currencies" :key="'to-'+c.code" :value="c.code">{{ c.flag }} {{ c.code }} - {{ c.name }}</option>
            </select>
          </div>
          <span class="text-xl font-extrabold text-[var(--color-primary)] flex-1 text-right">{{ result }}</span>
        </div>

        <div v-if="rateInfo" class="mt-4 text-center text-sm text-[var(--color-text-soft)] bg-[var(--color-bg-soft)] py-2.5 rounded-xl">
          1 <b class="text-[var(--color-text)]">{{ fromCurrency }}</b> = <b class="text-[var(--color-primary)]">{{ rateInfo }}</b> {{ toCurrency }}
        </div>

        <div class="flex gap-2 mt-4">
          <button @click="copyResult" class="flex-1 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-hover)] transition-colors">📋 复制结果</button>
          <button @click="amount=0" class="px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-white text-sm text-[var(--color-text-soft)] hover:bg-[var(--color-bg-soft)] transition-colors">清空</button>
        </div>
      </div>

      <!-- 右侧面板 -->
      <div class="w-full lg:w-72 space-y-4">
        <!-- 常用货币 -->
        <div class="bg-white rounded-[var(--radius-card)] p-4 border border-[var(--color-border)] shadow-[var(--shadow-card)]">
          <h4 class="text-sm font-bold text-[var(--color-text)] mb-3">常用货币</h4>
          <div class="flex flex-wrap gap-1.5">
            <button v-for="c in currencies" :key="'hot-'+c.code" class="chip-sm" :class="{ 'chip-sm-on': fromCurrency===c.code || toCurrency===c.code }" @click="fromCurrency=c.code">{{ c.flag }} {{ c.code }}</button>
          </div>
        </div>

        <!-- 最近换算 -->
        <div class="bg-white rounded-[var(--radius-card)] p-4 border border-[var(--color-border)] shadow-[var(--shadow-card)]">
          <h4 class="text-sm font-bold text-[var(--color-text)] mb-3">最近换算</h4>
          <div v-if="history.length===0" class="text-center py-6">
            <div class="text-3xl mb-2">📝</div>
            <p class="text-xs text-[var(--color-text-muted)]">暂无换算记录</p>
          </div>
          <div v-else class="space-y-2">
            <div v-for="(h,i) in history" :key="i" class="flex items-center gap-2 text-xs p-2 rounded-lg hover:bg-[var(--color-bg-soft)] transition-colors cursor-pointer" @click="applyHistory(h)">
              <span>{{ h.amount }} {{ h.from }} → {{ h.result }} {{ h.to }}</span>
            </div>
          </div>
        </div>

        <!-- 使用技巧 -->
        <div class="bg-white rounded-[var(--radius-card)] p-4 border border-[var(--color-border)] shadow-[var(--shadow-card)]">
          <h4 class="text-sm font-bold text-[var(--color-text)] mb-2">💡 使用技巧</h4>
          <div class="space-y-2 text-xs text-[var(--color-text-soft)]">
            <div class="flex gap-2"><span class="text-[var(--color-primary)]">•</span> 输入任意金额，自动实时换算</div>
            <div class="flex gap-2"><span class="text-[var(--color-primary)]">•</span> 点击 ⇅ 快速交换货币方向</div>
            <div class="flex gap-2"><span class="text-[var(--color-primary)]">•</span> 支持 170+ 全球货币</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref,computed,watch } from 'vue'
import { fetchLiveRates, HOT_CURRENCIES, CURRENCY_META } from '../api/exchangeRate.js'

const currencies = HOT_CURRENCIES.map(code => ({ code, ...CURRENCY_META[code] || {name:code,flag:'💱',symbol:'',color:'#c4a8b4'} }))
const amount=ref(100), fromCurrency=ref('USD'), toCurrency=ref('CNY')
const allRates=ref({})

async function init(){ try{const d=await fetchLiveRates(); allRates.value=d.rates||{}}catch{} }
init()

const result=computed(()=>{const r=crossRate();if(!r||!amount.value||amount.value<=0)return'0.00';return(amount.value*r).toFixed(2)})
const rateInfo=computed(()=>{const r=crossRate();return r?.toFixed(4)||null})
function crossRate(){const r=allRates.value;if(!r)return null;const f=fromCurrency.value,t=toCurrency.value;if(f===t)return 1;const f2c=f==='CNY'?1:(r[f]?1/r[f]:null);const c2t=t==='CNY'?1:(r[t]||null);return f2c!=null&&c2t!=null?f2c*c2t:null}
function swapCurrencies(){[fromCurrency.value,toCurrency.value]=[toCurrency.value,fromCurrency.value]}

// 历史记录
const history=ref([])
try{const s=localStorage.getItem('fx_conv_history');if(s)history.value=JSON.parse(s)}catch{}
function saveHistory(h){history.value.unshift(h);if(history.value.length>5)history.value.pop();try{localStorage.setItem('fx_conv_history',JSON.stringify(history.value))}catch{}}
function applyHistory(h){amount.value=h.amount;fromCurrency.value=h.from;toCurrency.value=h.to}

// 保存当前换算
watch([amount,result,fromCurrency,toCurrency],()=>{
  if(amount.value>0&&result.value!=='0.00'){saveHistory({amount:amount.value,from:fromCurrency.value,to:toCurrency.value,result:result.value})}
})

async function copyResult(){
  try{await navigator.clipboard.writeText(`${amount.value} ${fromCurrency.value} = ${result.value} ${toCurrency.value}`)}
  catch{const el=document.createElement('textarea');el.value=`${amount.value} ${fromCurrency.value} = ${result.value} ${toCurrency.value}`;document.body.appendChild(el);el.select();document.execCommand('copy');document.body.removeChild(el)}
}
</script>

<style>
@reference "tailwindcss";
.input-box-lg { @apply flex items-center h-12 rounded-[var(--radius-input)] border border-[var(--color-border)] bg-white px-3 transition-all; }
.input-box-lg:focus-within { @apply border-[var(--color-primary)]; box-shadow: 0 0 0 3px var(--color-primary-light); }
.curr-select { @apply text-sm font-semibold text-[var(--color-text)] bg-transparent border-none outline-none cursor-pointer; max-width: 160px; }
.swap-btn-lg { @apply w-10 h-10 rounded-full border-2 border-[var(--color-border)] bg-white flex items-center justify-center text-lg text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)] transition-all duration-200; }
.chip-sm { @apply inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-[var(--color-border)] bg-white text-[11px] font-medium text-[var(--color-text-soft)] transition-all cursor-pointer hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]; }
.chip-sm-on { @apply border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary-light)]; }
</style>
