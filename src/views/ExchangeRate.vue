<template>
  <div class="max-w-6xl mx-auto">
    <!-- 欢迎语 -->
    <div class="mb-6">
      <h1 class="text-xl font-extrabold text-[var(--color-text)] tracking-tight">实时汇率</h1>
      <p class="text-sm text-[var(--color-text-soft)] mt-1">今天也要关注全球汇率变化呀 💕</p>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
      <div v-for="s in stats" :key="s.label" class="stat-card" :class="s.bg">
        <div>
          <div class="text-2xl font-extrabold text-[var(--color-text)]">{{ s.value }}</div>
          <div class="text-xs text-[var(--color-text-soft)] mt-0.5">{{ s.label }}</div>
        </div>
        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg" :class="s.iconBg">{{ s.icon }}</div>
      </div>
    </div>

    <!-- 换算器 -->
    <div class="bg-white rounded-[var(--radius-card)] p-5 md:p-6 border border-pink-100/80 shadow-sm mb-5">
      <div class="flex items-center gap-2 mb-4">
        <span class="text-base">🧮</span>
        <h3 class="text-base font-bold text-[var(--color-text)]">汇率换算器</h3>
        <span class="text-[10px] font-semibold text-pink-500 bg-pink-50 px-2 py-0.5 rounded-full">实时</span>
      </div>

      <div class="flex flex-col md:flex-row items-stretch md:items-end gap-2.5 mb-3">
        <div class="flex-1">
          <label class="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5 block">持有货币</label>
          <div class="flex items-center h-12 rounded-[var(--radius-input)] border border-pink-200 bg-pink-50/50 px-3 focus-within:border-pink-400 focus-within:ring-3 focus-within:ring-pink-100 transition-all">
            <input v-model.number="amount" type="number" min="0" class="flex-1 bg-transparent outline-none text-lg font-bold text-[var(--color-text)] placeholder:text-pink-200 font-[inherit]" placeholder="0" />
            <span class="text-sm font-bold text-pink-500 ml-1">{{ fromCurrency }}</span>
          </div>
        </div>

        <button @click="swapCurrencies" class="w-10 h-10 rounded-full border border-pink-200 bg-white flex items-center justify-center text-pink-500 hover:bg-pink-500 hover:text-white hover:border-pink-500 transition-all duration-200 shrink-0 self-center md:self-end md:mb-0.5">⇄</button>

        <div class="flex-1">
          <label class="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5 block">兑换结果</label>
          <div class="flex items-center h-12 rounded-[var(--radius-input)] border border-pink-200 bg-pink-50/30 px-3">
            <span class="text-lg font-extrabold text-pink-600 flex-1">{{ result }}</span>
            <span class="text-sm font-bold text-emerald-500 ml-1">{{ toCurrency }}</span>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap gap-1.5 mb-3">
        <span class="text-[10px] text-[var(--color-text-muted)] mr-1 self-center">从</span>
        <button v-for="c in currencies" :key="'f-'+c.code"
          :class="['chip', fromCurrency===c.code ? 'chip-on' : '']"
          @click="fromCurrency=c.code">{{ c.flag }} {{ c.code }}</button>
      </div>
      <div class="flex flex-wrap gap-1.5">
        <span class="text-[10px] text-[var(--color-text-muted)] mr-1 self-center">到</span>
        <button v-for="c in currencies" :key="'t-'+c.code"
          :class="['chip', toCurrency===c.code ? 'chip-on' : '']"
          @click="toCurrency=c.code">{{ c.flag }} {{ c.code }}</button>
      </div>

      <div v-if="rateInfo" class="mt-3 text-center text-xs text-[var(--color-text-soft)] bg-pink-50/50 py-2 rounded-xl">
        1 <b class="text-[var(--color-text)]">{{ fromCurrency }}</b> = <b class="text-pink-600">{{ rateInfo }}</b> {{ toCurrency }}
      </div>
    </div>

    <!-- 热门汇率 -->
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-base font-bold text-[var(--color-text)]">🔥 热门汇率</h3>
      <button @click="refreshRates" class="w-8 h-8 rounded-full border border-pink-200 bg-white flex items-center justify-center text-sm text-pink-400 hover:bg-pink-50 hover:text-pink-600 transition-colors" :class="{ 'animate-spin': refreshing }">🔄</button>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-6">
      <div v-for="(c,i) in hotCurrencies" :key="c.code" class="bg-white rounded-[var(--radius-card)] p-4 border border-pink-100/80 shadow-sm hover:shadow-md hover:border-pink-200 transition-all duration-200" :style="{ animationDelay: i*40+'ms' }" style="animation: fadeUp .4s cubic-bezier(.25,.1,.25,1) both">
        <div class="flex items-center gap-2 mb-2.5">
          <span class="text-xl">{{ c.flag }}</span>
          <div>
            <div class="text-xs font-bold text-[var(--color-text)]">{{ c.code }} <span class="text-[10px] font-normal text-[var(--color-text-muted)]">{{ c.name }}</span></div>
          </div>
        </div>
        <div class="text-xl font-extrabold text-[var(--color-text)] tracking-tight">
          <span v-if="c.unit>1" class="text-xs text-[var(--color-text-muted)] font-medium">{{ c.unit }}</span>
          {{ c.rate?.toFixed(4) || '--' }}
        </div>
        <div class="mt-2 h-7" v-if="sparkData[c.code]?.length>=2">
          <Sparkline :data="sparkData[c.code]" color="#ff6b8a" />
        </div>
      </div>
    </div>

    <!-- 全部币种 -->
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-base font-bold text-[var(--color-text)]">🌍 全部币种</h3>
      <span class="text-xs text-[var(--color-text-muted)]">{{ allCurrencies.length }} 种</span>
    </div>

    <div class="bg-white rounded-[var(--radius-card)] border border-pink-100/80 shadow-sm overflow-hidden">
      <div class="flex items-center px-4 py-2.5 bg-pink-50/50 border-b border-pink-100 text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
        <span class="w-14">货币</span><span class="w-12">代码</span><span class="flex-1">名称</span><span class="w-24 text-right">汇率 (CNY)</span>
      </div>
      <div v-for="c in allCurrencies" :key="c.code" class="flex items-center px-4 py-2 border-b border-pink-50 text-[13px] hover:bg-pink-50/30 transition-colors last:border-b-0">
        <span class="w-14 text-base">{{ c.flag }}</span>
        <span class="w-12 font-semibold text-[var(--color-text)]">{{ c.code }}</span>
        <span class="flex-1 text-[var(--color-text-soft)] truncate">{{ c.name }}</span>
        <span class="w-24 text-right font-semibold text-[var(--color-text-soft)] font-mono text-xs">
          <template v-if="c.unit>1">{{ c.unit }}</template>
          {{ c.rate?.toFixed(4) || '--' }}
        </span>
      </div>
    </div>

    <!-- 页脚 -->
    <div class="mt-8 pb-4 text-center">
      <p class="text-[11px] text-[var(--color-text-muted)]">数据仅供参考，请以实际银行汇率为准</p>
      <p class="text-[11px] text-[var(--color-text-muted)] mt-1">
        <span class="font-medium">🦌 白鹿io</span> · 汇率工具
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref,reactive,onMounted,computed } from 'vue'
import { fetchLiveRates,buildCurrencyList,fetchHistory,getCNYHistory,HOT_CURRENCIES } from '../api/exchangeRate.js'
import Sparkline from '../components/Sparkline.vue'

const emit = defineEmits(['updateTime','refreshStart','refreshEnd'])
const loading=ref(true), refreshing=ref(false), lastTime=ref('--')
const rawRates=reactive({}), sparkData=reactive({})

const stats=computed(()=>[
  { label:'支持币种', value: buildCurrencyList(rawRates).filter(c=>c.code!=='CNY').length, icon:'🌐', bg:'', iconBg:'bg-blue-50 text-blue-400' },
  { label:'热门汇率', value: buildCurrencyList(rawRates).filter(c=>HOT_CURRENCIES.includes(c.code)).length, icon:'🔥', bg:'', iconBg:'bg-amber-50 text-amber-400' },
  { label:'刷新频率', value:'30s', icon:'⚡', bg:'', iconBg:'bg-emerald-50 text-emerald-400' },
  { label:'最后更新', value: lastTime.value, icon:'🕐', bg:'', iconBg:'bg-purple-50 text-purple-400' },
])

// 换算器
const currencies = HOT_CURRENCIES.map(code => {
  const meta = { USD:{flag:'🇺🇸'},EUR:{flag:'🇪🇺'},GBP:{flag:'🇬🇧'},JPY:{flag:'🇯🇵'},AUD:{flag:'🇦🇺'},CAD:{flag:'🇨🇦'},CHF:{flag:'🇨🇭'},NZD:{flag:'🇳🇿'},SGD:{flag:'🇸🇬'},HKD:{flag:'🇭🇰'},KRW:{flag:'🇰🇷'},THB:{flag:'🇹🇭'},MYR:{flag:'🇲🇾'},PHP:{flag:'🇵🇭'},IDR:{flag:'🇮🇩'},VND:{flag:'🇻🇳'},INR:{flag:'🇮🇳'} }
  return { code, flag: meta[code]?.flag || '💱' }
})
const amount=ref(100), fromCurrency=ref('USD'), toCurrency=ref('CNY'), allRates=ref({})
const result=computed(()=>{ if(!amount.value||amount.value<=0)return'0.00';const r=crossRate();return r?(amount.value*r).toFixed(2):'--' })
const rateInfo=computed(()=>{const r=crossRate();return r?.toFixed(4)||null})
function crossRate(){const r=allRates.value;if(!r)return null;const f=fromCurrency.value,t=toCurrency.value;if(f===t)return 1;const f2c=f==='CNY'?1:(r[f]?1/r[f]:null);const c2t=t==='CNY'?1:(r[t]||null);return f2c!=null&&c2t!=null?f2c*c2t:null}
function swapCurrencies(){[fromCurrency.value,toCurrency.value]=[toCurrency.value,fromCurrency.value]}

const hotCurrencies=computed(()=>buildCurrencyList(rawRates).filter(c=>HOT_CURRENCIES.includes(c.code)))
const allCurrencies=computed(()=>buildCurrencyList(rawRates).filter(c=>c.code!=='CNY'&&!HOT_CURRENCIES.includes(c.code)))

async function loadSpark(){try{const d=await fetchHistory(7);HOT_CURRENCIES.forEach(c=>{const v=getCNYHistory(d,c);if(v.length>=2)sparkData[c]=v})}catch{}}

async function refreshRates(){
  refreshing.value=true;emit('refreshStart')
  try{const d=await fetchLiveRates();Object.assign(rawRates,d.rates||{});allRates.value=d.rates||{};loading.value=false;lastTime.value=new Date().toLocaleTimeString('zh-CN',{hour12:false});emit('updateTime',lastTime.value)}catch{}
  finally{refreshing.value=false;emit('refreshEnd')}
}

onMounted(async()=>{await Promise.all([refreshRates(),loadSpark()]);setInterval(refreshRates,30000)})
</script>

<style>
@reference "tailwindcss";
.stat-card {
  @apply bg-white rounded-[var(--radius-card)] p-4 border border-pink-100/80 shadow-sm flex items-center justify-between;
}
.chip {
  @apply inline-flex items-center gap-0.5 px-2.5 py-1.5 rounded-full border border-pink-200 bg-white text-[11px] font-medium text-[var(--color-text-soft)] transition-all duration-150 cursor-pointer hover:border-pink-400 hover:text-pink-500;
}
.chip-on {
  @apply bg-pink-500 text-white border-pink-500 font-semibold shadow-sm;
}
@keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
</style>
