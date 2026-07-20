<template>
  <div class="max-w-6xl mx-auto">
    <div class="mb-5">
      <h1 class="text-xl font-extrabold text-[var(--color-text)]">走势分析</h1>
      <p class="text-sm text-[var(--color-text-soft)] mt-1">查看主要货币兑人民币的历史变化</p>
    </div>

    <!-- 时间范围 -->
    <div class="flex items-center gap-1.5 mb-5 bg-white rounded-xl p-1 border border-[var(--color-border)] w-fit">
      <button v-for="r in ranges" :key="r.days" @click="loadRange(r.days)" :class="['px-4 py-2 rounded-lg text-xs font-semibold transition-all', activeRange===r.days ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'text-[var(--color-text-soft)] hover:bg-[var(--color-bg-soft)]']">{{ r.label }}</button>
    </div>

    <!-- 重点趋势大卡 -->
    <div v-if="focusData" class="bg-white rounded-[var(--radius-card)] p-5 md:p-6 border border-[var(--color-border)] shadow-[var(--shadow-card)] mb-5">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <span class="text-xl">{{ focusData.flag }}</span>
          <h3 class="text-base font-bold text-[var(--color-text)]">{{ focusData.code }} / CNY</h3>
        </div>
        <select v-model="focusCode" @change="updateFocus" class="text-sm font-semibold text-[var(--color-text)] bg-[var(--color-bg-soft)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 cursor-pointer">
          <option v-for="c in focusOptions" :key="c.code" :value="c.code">{{ c.flag }} {{ c.code }}</option>
        </select>
      </div>

      <div class="h-52 mb-4">
        <Sparkline :data="focusData.data" :color="'#E85D8E'" />
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="text-center p-3 rounded-xl bg-[var(--color-bg-soft)]">
          <div class="text-[11px] text-[var(--color-text-muted)] mb-1">当前值</div>
          <div class="text-lg font-extrabold text-[var(--color-text)] font-[var(--font-mono)]">{{ focusData.current }}</div>
        </div>
        <div class="text-center p-3 rounded-xl bg-[var(--color-bg-soft)]">
          <div class="text-[11px] text-[var(--color-text-muted)] mb-1">最高值</div>
          <div class="text-lg font-extrabold text-[var(--color-success)] font-[var(--font-mono)]">{{ focusData.high }}</div>
        </div>
        <div class="text-center p-3 rounded-xl bg-[var(--color-bg-soft)]">
          <div class="text-[11px] text-[var(--color-text-muted)] mb-1">最低值</div>
          <div class="text-lg font-extrabold text-[var(--color-danger)] font-[var(--font-mono)]">{{ focusData.low }}</div>
        </div>
        <div class="text-center p-3 rounded-xl bg-[var(--color-bg-soft)]" :class="focusData.change>=0?'text-[var(--color-success)]':'text-[var(--color-danger)]'">
          <div class="text-[11px] text-[var(--color-text-muted)] mb-1">区间涨跌</div>
          <div class="text-lg font-extrabold font-[var(--font-mono)]">{{ focusData.change>=0?'+':'' }}{{ focusData.change }}%</div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center py-12">
      <div class="inline-block w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
      <p class="text-sm text-[var(--color-text-muted)] mt-3">加载历史数据中...</p>
    </div>

    <!-- 其他币种趋势卡片 -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="c in otherTrends" :key="c.code" class="bg-white rounded-[var(--radius-card)] p-5 border border-[var(--color-border)] shadow-[var(--shadow-card)]">
        <div class="flex items-center gap-2.5 mb-4">
          <span class="text-xl">{{ c.flag }}</span>
          <div>
            <div class="text-sm font-bold text-[var(--color-text)]">{{ c.code }} / CNY · {{ c.name }}</div>
          </div>
          <div class="ml-auto text-xs font-semibold" :class="c.trend==='up'?'text-[var(--color-success)]':c.trend==='down'?'text-[var(--color-danger)]':'text-[var(--color-text-muted)]'">
            {{ c.changeStr }}
          </div>
        </div>
        <div class="h-20 mb-3">
          <Sparkline :data="c.data" :color="c.color||'#E85D8E'" />
        </div>
        <div class="flex justify-between text-[11px] text-[var(--color-text-muted)] font-[var(--font-mono)]">
          <span>起始 · {{ c.data[0]?.toFixed(4) || '--' }}</span>
          <span>最新 · {{ c.data[c.data.length-1]?.toFixed(4) || '--' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref,reactive,computed,onMounted } from 'vue'
import { fetchHistory,getCNYHistory,HOT_CURRENCIES,CURRENCY_META } from '../api/exchangeRate.js'
import Sparkline from '../components/Sparkline.vue'

const ranges=[{days:7,label:'7天'},{days:30,label:'30天'},{days:90,label:'90天'},{days:180,label:'180天'},{days:360,label:'360天'}]
const activeRange=ref(7), loading=ref(true)
const allTrends=reactive([]), focusCode=ref('USD')

const focusOptions=computed(()=>HOT_CURRENCIES.map(code=>({code,flag:CURRENCY_META[code]?.flag||'💱'})))

const focusData=computed(()=>{
  const found=allTrends.find(c=>c.code===focusCode.value)
  if(!found||found.data.length<2)return null
  const d=found.data, current=d[d.length-1]
  const high=Math.max(...d), low=Math.min(...d)
  const change=((current-d[0])/d[0]*100).toFixed(2)
  return {...found,current:current.toFixed(4),high:high.toFixed(4),low:low.toFixed(4),change}
})

const otherTrends=computed(()=>allTrends.filter(c=>c.code!==focusCode.value&&c.data.length>=2))

function updateFocus(){}

onMounted(()=>loadRange(7))

async function loadRange(days){
  activeRange.value=days; loading.value=true; allTrends.length=0
  try{
    const data=await fetchHistory(days)
    HOT_CURRENCIES.forEach(code=>{
      const vals=getCNYHistory(data,code)
      if(vals.length<2)return
      const first=vals[0],last=vals[vals.length-1]
      const diff=last-first, pct=first?(diff/first*100):0
      allTrends.push({
        code, name:CURRENCY_META[code]?.name||code,
        flag:CURRENCY_META[code]?.flag||'💱',
        color:CURRENCY_META[code]?.color||'#E85D8E',
        data:vals, trend:diff>0?'up':diff<0?'down':'flat',
        changeStr:`${pct>=0?'+':''}${pct.toFixed(2)}%`
      })
    })
  }catch(e){console.error(e)}
  finally{loading.value=false}
}
</script>
