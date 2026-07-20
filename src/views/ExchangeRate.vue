<template>
  <div class="max-w-[1440px] mx-auto">
    <!-- 页面标题 -->
    <div class="flex flex-col md:flex-row md:items-end md:justify-between mb-5 gap-3">
      <div>
        <h1 class="text-xl font-extrabold text-[var(--color-text)] tracking-tight">实时汇率</h1>
        <p class="text-sm text-[var(--color-text-soft)] mt-1">掌握全球主要货币的实时变化</p>
      </div>
      <div class="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
        <span v-if="lastTime">更新于 {{ lastTime }}</span>
        <button @click="refreshRates" class="w-8 h-8 rounded-full border border-[var(--color-border)] bg-white flex items-center justify-center text-sm hover:bg-[var(--color-bg-soft)] hover:text-[var(--color-primary)] transition-colors" :class="{ 'animate-spin': refreshing }" :disabled="refreshing">🔄</button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
      <div v-for="stat in stats" :key="stat.label" class="stat-card">
        <div>
          <div class="text-[22px] font-extrabold text-[var(--color-text)] leading-none">{{ stat.value }}</div>
          <div class="text-[11px] text-[var(--color-text-soft)] mt-1 font-medium">{{ stat.label }}</div>
        </div>
        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" :class="stat.bg">{{ stat.icon }}</div>
      </div>
    </div>

    <!-- 换算卡片 -->
    <div class="bg-white rounded-[var(--radius-card)] p-5 md:p-6 border border-[var(--color-border)] shadow-[var(--shadow-card)] mb-5">
      <div class="flex items-center gap-2 mb-4">
        <span class="text-base">🧮</span><h3 class="text-base font-bold text-[var(--color-text)]">快速换算</h3>
        <span class="text-[10px] font-semibold text-white bg-[var(--color-primary)] px-2 py-0.5 rounded-full">实时</span>
      </div>

      <!-- 换算行 -->
      <div class="flex flex-col sm:flex-row items-stretch gap-3 mb-4">
        <!-- 左侧：持有 -->
        <div class="flex-1">
          <label class="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5 block">
            持有 · <span class="text-[var(--color-primary)]">{{ convFrom === 'CNY' ? '人民币' : convFrom === 'USD' ? '美元' : convFrom === 'EUR' ? '欧元' : convFrom === 'GBP' ? '英镑' : convFrom === 'JPY' ? '日元' : convFrom }}</span>
          </label>
          <div class="flex items-stretch gap-2">
            <select v-model="convFrom" class="curr-sel w-[140px] flex-shrink-0">
              <option v-for="c in allCurrenciesFull" :key="'f-'+c.code" :value="c.code">{{ c.flag }} {{ c.code }} {{ c.name }}</option>
            </select>
            <div class="flex-1 flex items-center bg-pink-50 border border-pink-100 rounded-xl px-3 min-w-0">
              <input v-model.number="convAmount" type="number" min="0" class="flex-1 min-w-0 bg-transparent outline-none text-lg font-bold text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]" placeholder="0" />
              <span class="text-sm font-bold text-white bg-[var(--color-primary)] px-2 py-0.5 rounded-full ml-2 flex-shrink-0">{{ convFrom === 'CNY' ? '人民币' : convFrom === 'USD' ? '美元' : convFrom === 'EUR' ? '欧元' : convFrom === 'GBP' ? '英镑' : convFrom === 'JPY' ? '日元' : convFrom }}</span>
            </div>
          </div>
        </div>

        <!-- 交换按钮 -->
        <button @click="swapConv" class="swap-btn-v self-end">⇄</button>

        <!-- 右侧：结果 -->
        <div class="flex-1">
          <label class="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5 block">
            兑换结果 · <span class="text-[var(--color-success)]">{{ convTo === 'CNY' ? '人民币' : convTo === 'USD' ? '美元' : convTo === 'EUR' ? '欧元' : convTo === 'GBP' ? '英镑' : convTo === 'JPY' ? '日元' : convTo }}</span>
          </label>
          <div class="flex items-stretch gap-2">
            <select v-model="convTo" class="curr-sel w-[140px] flex-shrink-0">
              <option v-for="c in allCurrenciesFull" :key="'t-'+c.code" :value="c.code">{{ c.flag }} {{ c.code }} {{ c.name }}</option>
            </select>
            <div class="flex-1 flex items-center bg-emerald-50 border border-emerald-100 rounded-xl px-3 min-w-0">
              <span class="text-lg font-extrabold text-[var(--color-success)] truncate">{{ convResult }}</span>
              <span class="text-sm font-bold text-white bg-[var(--color-success)] px-2 py-0.5 rounded-full ml-2 flex-shrink-0">{{ convTo === 'CNY' ? '人民币' : convTo }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="convRateInfo" class="text-center text-xs text-[var(--color-text-soft)] bg-[var(--color-bg-soft)] py-2 rounded-xl">
        1 <b class="text-[var(--color-text)]">{{ convFrom }}</b> = <b class="text-[var(--color-primary)]">{{ convRateInfo }}</b> {{ convTo }}
      </div>
    </div>

    <!-- 热门汇率 -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <h3 class="text-base font-bold text-[var(--color-text)]">🔥 热门汇率</h3>
        <span class="text-[11px] text-[var(--color-text-muted)]">{{ hotCurrencies.length }} 种</span>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
      <div v-for="(c,i) in hotCurrencies" :key="c.code" class="rate-card cursor-pointer" :style="{ animationDelay: i*40+'ms' }" @click="convFrom=c.code" title="点击设为持有货币">
        <div class="flex items-center gap-2.5 mb-3">
          <span class="text-xl leading-none">{{ c.flag }}</span>
          <div>
            <div class="text-[13px] font-bold text-[var(--color-text)]">{{ c.code }}</div>
            <div class="text-[10px] text-[var(--color-text-muted)]">{{ c.name }}</div>
          </div>
        </div>
        <div class="text-[22px] font-extrabold text-[var(--color-text)] tracking-tight">
          <span v-if="c.unit>1" class="text-xs text-[var(--color-text-muted)] font-medium">{{ c.unit }}</span>
          {{ c.rate?.toFixed(4) || '--' }}
        </div>
        <div class="mt-2 h-8" v-if="sparkData[c.code]?.length>=2">
          <Sparkline :data="sparkData[c.code]" color="#E85D8E" />
        </div>
      </div>
    </div>

    <!-- 全部币种 -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-3 gap-2">
      <div class="flex items-center gap-2">
        <h3 class="text-base font-bold text-[var(--color-text)]">🌍 全部币种</h3>
        <span class="text-[11px] text-[var(--color-text-muted)]">{{ filteredAll.length }} / {{ allCurrencies.length }} 种</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="relative">
          <input v-model="searchQuery" type="text" placeholder="搜索币种..." class="w-40 md:w-48 h-8 rounded-lg border border-[var(--color-border)] bg-white px-3 text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)] transition-all" />
        </div>
      </div>
    </div>

    <div class="bg-white rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-[var(--shadow-card)] overflow-hidden">
      <!-- 表头 -->
      <div class="flex items-center px-4 py-2.5 bg-[var(--color-bg-soft)] border-b border-[var(--color-border)] text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
        <span class="w-12">货币</span><span class="w-14">代码</span><span class="flex-1">名称</span><span class="w-28 text-right">汇率 (CNY)</span>
      </div>

      <!-- 列表（默认20条） -->
      <div v-for="c in pagedCurrencies" :key="c.code" class="flex items-center px-4 py-2.5 border-b border-[var(--color-bg-soft)] text-[13px] hover:bg-[var(--color-bg-soft)]/60 transition-colors last:border-b-0">
        <span class="w-12 text-base">{{ c.flag }}</span>
        <span class="w-14 font-semibold text-[var(--color-text)]">{{ c.code }}</span>
        <span class="flex-1 text-[var(--color-text-soft)] truncate">{{ c.name }}</span>
        <span class="w-28 text-right font-semibold text-[var(--color-text)] font-[var(--font-mono)] text-xs">
          <template v-if="c.unit>1">{{ c.unit }}</template>
          {{ c.rate?.toFixed(4) || '--' }}
        </span>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="flex items-center justify-center gap-1 px-4 py-3 border-t border-[var(--color-border)]">
        <button @click="currentPage=Math.max(1,currentPage-1)" :disabled="currentPage===1" class="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--color-border)] disabled:opacity-30 hover:bg-[var(--color-bg-soft)] transition-colors">‹</button>
        <button v-for="p in visiblePages" :key="p" @click="currentPage=p" :class="['px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', p===currentPage ? 'bg-[var(--color-primary)] text-white' : 'border border-[var(--color-border)] hover:bg-[var(--color-bg-soft)]']">{{ p }}</button>
        <button @click="currentPage=Math.min(totalPages,currentPage+1)" :disabled="currentPage===totalPages" class="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--color-border)] disabled:opacity-30 hover:bg-[var(--color-bg-soft)] transition-colors">›</button>
      </div>
    </div>

    <!-- 页脚 -->
    <div class="mt-8 pb-4 text-center">
      <p class="text-[11px] text-[var(--color-text-muted)]">数据仅供参考，请以实际银行汇率为准</p>
      <p class="text-[11px] text-[var(--color-text-muted)] mt-1"><span class="font-medium">🦌 白鹿io</span> · 汇率工具</p>
    </div>
  </div>
</template>

<script setup>
import { ref,reactive,onMounted,onUnmounted,computed } from 'vue'
import { fetchLiveRates,buildCurrencyList,fetchHistory,getCNYHistory,HOT_CURRENCIES,CURRENCY_META } from '../api/exchangeRate.js'
import Sparkline from '../components/Sparkline.vue'

const emit = defineEmits(['updateTime','refreshStart','refreshEnd'])

const loading=ref(true), refreshing=ref(false), lastTime=ref('')
const rawRates=ref({}), sparkData=reactive({})

// 换算器
const convAmount=ref(100), convFrom=ref('USD'), convTo=ref('CNY')
const convCnyRates=ref({})
const convResult=computed(()=>{
  if(!convAmount.value||convAmount.value<=0)return'0.00'
  const r=crossRate();return r?(convAmount.value*r).toFixed(2):'--'
})
const convRateInfo=computed(()=>{const r=crossRate();return r?.toFixed(4)||null})
function crossRate(){const r=convCnyRates.value;if(!r)return null;const f=convFrom.value,t=convTo.value;if(f===t)return 1;const f2c=f==='CNY'?1:(r[f]?1/r[f]:null);const c2t=t==='CNY'?1:(r[t]||null);return f2c!=null&&c2t!=null?f2c*c2t:null}
function swapConv(){[convFrom.value,convTo.value]=[convTo.value,convFrom.value]}

const hotChips = computed(() => HOT_CURRENCIES.map(code => ({ code, flag: CURRENCY_META[code]?.flag || '💱' })))

// 全部币种，用于换算器的下拉选择（CNY 置顶）
const allCurrenciesFull = computed(() => {
  const list = buildCurrencyList(rawRates.value)
  // CNY 是 API 基准币，不会出现在 rates 中，手动置顶
  const cnyEntry = { code: 'CNY', name: '人民币', flag: '🇨🇳', symbol: '¥', color: '#ef4444', rate: 1, unit: 1 }
  if (list.length > 0) {
    const rest = list.filter(c => c.code !== 'CNY')
    return [cnyEntry, ...rest]
  }
  // fallback：API 返回前先展示热门币种（CNY 置顶）
  const fallback = HOT_CURRENCIES.map(code => ({
    code, ...CURRENCY_META[code] || { name: code, flag: '💱', color: '#c4a8b4' },
    rate: null, unit: CURRENCY_META[code]?.unit || 1
  }))
  return [cnyEntry, ...fallback.filter(c => c.code !== 'CNY')]
})

// 汇率数据
const hotCurrencies=computed(()=>buildCurrencyList(rawRates.value).filter(c=>HOT_CURRENCIES.includes(c.code)))
const allCurrencies=computed(()=>buildCurrencyList(rawRates.value).filter(c=>c.code!=='CNY'&&!HOT_CURRENCIES.includes(c.code)))

const searchQuery=ref('')
const currentPage=ref(1)
const pageSize=20

const filteredAll=computed(()=>{
  const q=searchQuery.value.toLowerCase()
  if(!q)return allCurrencies.value
  return allCurrencies.value.filter(c=>c.code.toLowerCase().includes(q)||c.name.toLowerCase().includes(q))
})

const totalPages=computed(()=>Math.ceil(filteredAll.value.length/pageSize)||0)
const pagedCurrencies=computed(()=>{
  const start=(currentPage.value-1)*pageSize
  return filteredAll.value.slice(start,start+pageSize)
})

const visiblePages=computed(()=>{
  const pages=[]
  const total=totalPages.value
  const current=currentPage.value
  let start=Math.max(1,current-2)
  let end=Math.min(total,current+2)
  if(end-start<4){if(start===1)end=Math.min(total,5);else if(end===total)start=Math.max(1,total-4)}
  for(let i=start;i<=end;i++)pages.push(i)
  return pages
})

const stats=computed(()=>[
  { label:'支持币种', value: buildCurrencyList(rawRates.value).filter(c=>c.code!=='CNY').length, icon:'🌐', bg:'bg-blue-50/40' },
  { label:'热门汇率', value: hotCurrencies.value.length, icon:'🔥', bg:'bg-amber-50/40' },
  { label:'刷新频率', value:'30s', icon:'⚡', bg:'bg-emerald-50/40' },
  { label:'最后更新', value: lastTime.value||'--', icon:'🕐', bg:'bg-purple-50/40' },
])

async function loadSpark(){try{const d=await fetchHistory(7);HOT_CURRENCIES.forEach(c=>{const v=getCNYHistory(d,c);if(v.length>=2)sparkData[c]=v})}catch{}}

async function refreshRates(){
  refreshing.value=true;emit('refreshStart')
  try{
    const d=await fetchLiveRates()
    if (d?.rates && Object.keys(d.rates).length > 0) {
      rawRates.value = { ...d.rates }
      convCnyRates.value = d.rates
      lastTime.value = new Date().toLocaleTimeString('zh-CN',{hour12:false})
      emit('updateTime',lastTime.value)
    }
    loading.value=false
  }catch(e){console.error('刷新汇率失败',e)}
  finally{refreshing.value=false;emit('refreshEnd')}
}

let timer=null
onMounted(async()=>{await Promise.all([refreshRates(),loadSpark()]);timer=setInterval(refreshRates,30000)})
onUnmounted(()=>clearInterval(timer))
</script>

<style>
@reference "tailwindcss";
.stat-card { @apply bg-white rounded-[var(--radius-card)] p-4 border border-[var(--color-border)] flex items-center justify-between; box-shadow: var(--shadow-card); }
.input-box { @apply flex items-center h-11 rounded-[var(--radius-input)] border border-[var(--color-border)] bg-white px-3 transition-all; }
.input-box:focus-within { @apply border-[var(--color-primary)]; box-shadow: 0 0 0 3px var(--color-primary-light); }
.swap-btn { @apply w-9 h-9 rounded-full border-2 border-[var(--color-border)] bg-white flex items-center justify-center text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)] transition-all duration-200 flex-shrink-0 self-center; margin-bottom:2px; }
.chip { @apply inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-[var(--color-border)] bg-white text-[11px] font-medium text-[var(--color-text-soft)] transition-all duration-150 cursor-pointer hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]; }
.chip-on { @apply bg-[var(--color-primary)] text-white border-[var(--color-primary)] font-semibold; }
.curr-sel { @apply h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-soft)] px-2 text-xs font-semibold text-[var(--color-text)] cursor-pointer outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)] transition-all; appearance:none; background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23A08C95' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\"); background-repeat:no-repeat; background-position:right 8px center; padding-right:24px; }
.swap-btn-v { @apply w-9 h-9 rounded-full border-2 border-[var(--color-border)] bg-white flex items-center justify-center text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)] transition-all duration-200 flex-shrink-0; }
.rate-card { @apply bg-white rounded-[var(--radius-card)] p-4 border border-[var(--color-border)]; box-shadow: var(--shadow-card); transition: all 0.2s; animation: fadeUp 0.4s cubic-bezier(.25,.1,.25,1) both; }
.rate-card:hover { box-shadow: var(--shadow-hover); transform: translateY(-1px); }
@keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
</style>
