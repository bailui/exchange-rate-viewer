<template>
  <div class="max-w-6xl mx-auto">
    <div class="mb-5">
      <h1 class="text-xl font-extrabold text-[var(--color-text)]">走势分析</h1>
      <p class="text-sm text-[var(--color-text-soft)] mt-1">查看主要货币兑人民币的历史变化</p>
    </div>

    <!-- 时间范围 -->
    <div class="flex items-center gap-1.5 mb-5 bg-white rounded-xl p-1 border border-[var(--color-border)] w-fit">
      <button v-for="r in ranges" :key="r.days" @click="loadRange(r.days)"
        :class="['px-4 py-2 rounded-lg text-xs font-semibold transition-all', activeRange===r.days ? 'bg-[var(--color-primary)] text-white shadow-sm' : 'text-[var(--color-text-soft)] hover:bg-[var(--color-bg-soft)]']">{{ r.label }}</button>
    </div>

    <!-- 加载态 -->
    <div v-if="loading && allTrends.length===0" class="text-center py-16">
      <div class="inline-block w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
      <p class="text-sm text-[var(--color-text-muted)] mt-3">正在加载 {{ activeRange }} 天历史数据...</p>
    </div>

    <template v-else>
      <!-- 重点趋势大卡 -->
      <div v-if="focusData" class="bg-white rounded-[var(--radius-card)] p-5 md:p-6 border border-[var(--color-border)] shadow-[var(--shadow-card)] mb-5">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <span class="text-xl">{{ focusData.flag }}</span>
            <h3 class="text-base font-bold text-[var(--color-text)]">{{ focusData.code }} / CNY</h3>
          </div>
          <div class="flex items-center gap-2">
            <select v-model="focusCode" class="text-sm font-semibold bg-[var(--color-bg-soft)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 cursor-pointer">
              <option v-for="c in focusOptions" :key="c.code" :value="c.code">{{ c.flag }} {{ c.code }}</option>
            </select>
            <button @click="fullscreenOpen=true" class="w-8 h-8 rounded-lg border border-[var(--color-border)] bg-white flex items-center justify-center text-sm hover:bg-[var(--color-bg-soft)] transition-colors" title="全屏查看">⛶</button>
          </div>
        </div>

        <div class="h-52 mb-4 cursor-pointer" @click="fullscreenOpen=true">
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

      <!-- 其他趋势 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="c in otherTrends" :key="c.code"
          class="bg-white rounded-[var(--radius-card)] p-5 border border-[var(--color-border)] shadow-[var(--shadow-card)] cursor-pointer hover:shadow-[var(--shadow-hover)] transition-all duration-200"
          @click="focusCode=c.code; fullscreenOpen=true">
          <div class="flex items-center gap-2.5 mb-4">
            <span class="text-xl">{{ c.flag }}</span>
            <div>
              <div class="text-sm font-bold text-[var(--color-text)]">{{ c.code }} / CNY</div>
              <div class="text-[10px] text-[var(--color-text-muted)]">{{ c.name }}</div>
            </div>
            <div class="ml-auto text-xs font-semibold" :class="c.trend==='up'?'text-[var(--color-success)]':c.trend==='down'?'text-[var(--color-danger)]':'text-[var(--color-text-muted)]'">
              {{ c.changeStr }}
            </div>
          </div>
          <div class="h-16 mb-3">
            <Sparkline :data="c.data" :color="c.color||'#E85D8E'" />
          </div>
          <div class="flex justify-between text-[10px] text-[var(--color-text-muted)] font-[var(--font-mono)]">
            <span>起 {{ c.data[0]?.toFixed(4) || '--' }}</span>
            <span>今 {{ c.data[c.data.length-1]?.toFixed(4) || '--' }}</span>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="allTrends.length===0 && !loading" class="text-center py-16">
        <div class="text-5xl mb-4">📊</div>
        <h3 class="text-base font-bold text-[var(--color-text)] mb-2">暂无走势数据</h3>
        <p class="text-sm text-[var(--color-text-soft)] mb-4">历史数据正在收集中，请稍后再试</p>
        <button @click="loadRange(activeRange)" class="px-6 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-hover)] transition-all">重试</button>
      </div>
    </template>

    <!-- 全屏模态 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="fullscreenOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" @click.self="fullscreenOpen=false">
          <div class="bg-white rounded-[var(--radius-card)] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            <div class="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
              <div class="flex items-center gap-2">
                <span class="text-xl">{{ fullscreenData?.flag }}</span>
                <h3 class="text-base font-bold text-[var(--color-text)]">{{ fullscreenData?.code }} / CNY · {{ activeRange }}天走势</h3>
              </div>
              <button @click="fullscreenOpen=false" class="w-8 h-8 rounded-lg border border-[var(--color-border)] flex items-center justify-center text-sm hover:bg-[var(--color-bg-soft)] transition-colors">✕</button>
            </div>
            <div class="flex-1 p-6 min-h-0">
              <Sparkline v-if="fullscreenData" :data="fullscreenData.data" :color="'#E85D8E'" />
            </div>
            <div class="grid grid-cols-4 gap-3 p-4 border-t border-[var(--color-border)]">
              <div class="text-center p-3 rounded-xl bg-[var(--color-bg-soft)]" v-for="stat in fullscreenStats" :key="stat.label">
                <div class="text-[10px] text-[var(--color-text-muted)] mb-1">{{ stat.label }}</div>
                <div class="text-base font-extrabold font-[var(--font-mono)]" :class="stat.color">{{ stat.value }}</div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref,reactive,computed,onMounted } from 'vue'
import { fetchHistory,getCNYHistory,HOT_CURRENCIES,CURRENCY_META } from '../api/exchangeRate.js'
import Sparkline from '../components/Sparkline.vue'

const ranges=[{days:7,label:'7天'},{days:30,label:'30天'},{days:90,label:'90天'},{days:180,label:'180天'},{days:360,label:'360天'}]
const activeRange=ref(7), loading=ref(true)
const allTrends=reactive([]), focusCode=ref('USD')
const fullscreenOpen=ref(false)

const focusOptions=computed(()=>HOT_CURRENCIES.map(code=>({code,flag:CURRENCY_META[code]?.flag||'💱'})))

const focusData=computed(()=>allTrends.find(c=>c.code===focusCode.value)||null)

const fullscreenData=computed(()=>{
  if(!fullscreenOpen.value)return null
  const d=allTrends.find(c=>c.code===focusCode.value)
  if(!d)return null
  const vals=d.data
  return {
    ...d, current:vals[vals.length-1]?.toFixed(4),
    high:Math.max(...vals).toFixed(4), low:Math.min(...vals).toFixed(4),
    change:vals.length>1?((vals[vals.length-1]-vals[0])/vals[0]*100).toFixed(2):0,
    days:activeRange.value
  }
})

const fullscreenStats=computed(()=>{
  const d=fullscreenData.value
  if(!d)return[]
  return [
    {label:'当前值',value:d.current,color:'text-[var(--color-text)]'},
    {label:'最高值',value:d.high,color:'text-[var(--color-success)]'},
    {label:'最低值',value:d.low,color:'text-[var(--color-danger)]'},
    {label:'涨跌',value:`${d.change>=0?'+':''}${d.change}%`,color:d.change>=0?'text-[var(--color-success)]':'text-[var(--color-danger)]'},
  ]
})

const otherTrends=computed(()=>allTrends.filter(c=>c.code!==focusCode.value&&c.data.length>=2))

onMounted(()=>loadRange(7))

async function loadRange(days){
  activeRange.value=days; loading.value=true; allTrends.length=0
  try{
    const data=await fetchHistory(days)
    const dates=Object.keys(data?.rates||{})
    if(dates.length===0){console.warn('走势数据为空，CDN可能不可用')}
    HOT_CURRENCIES.forEach(code=>{
      const vals=getCNYHistory(data,code)
      if(vals.length<2)return
      const first=vals[0],last=vals[vals.length-1]
      const diff=last-first, pct=first?(diff/first*100):0
      allTrends.push({code,name:CURRENCY_META[code]?.name||code,flag:CURRENCY_META[code]?.flag||'💱',color:CURRENCY_META[code]?.color||'#E85D8E',data:vals,trend:diff>0?'up':diff<0?'down':'flat',changeStr:`${pct>=0?'+':''}${pct.toFixed(2)}%`})
    })
  }catch(e){console.error('走势加载失败',e)}
  finally{loading.value=false}
}
</script>

<style scoped>
.modal-enter-active { transition: all .25s ease-out; }
.modal-leave-active { transition: all .2s ease-in; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from > div, .modal-leave-to > div { transform: scale(.95); }
</style>
