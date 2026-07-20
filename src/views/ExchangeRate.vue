<template>
  <div class="page">
    <!-- 背景装饰 -->
    <div class="bg-blob b1"></div>
    <div class="bg-blob b2"></div>

    <!-- 💬 每日鼓励 -->
    <DailyEncourage />

    <!-- 计算器 -->
    <CurrencyConverter />

    <!-- 汇率卡片 -->
    <div class="section-head">
      <h2>💱 实时汇率</h2>
      <button class="refresh-btn" :class="{ spin: refreshing }" @click="refreshRates" :disabled="refreshing">
        🔄
      </button>
    </div>

    <div class="rate-grid">
      <RateCard
        v-for="(c,i) in focusCurrencies" :key="c.code"
        :currency="c" :rate="rates[c.code]"
        :change-percent="changes[c.code]||0"
        :loading="loading && !rates[c.code]"
        :error="hasError[c.code]"
        :delay="i*40"
        :history="histories[c.code]||[]"
      />
    </div>

    <!-- 快捷参考 -->
    <div class="quick-ref glass anim-up" style="animation-delay:.4s">
      <h3>💝 快捷换算</h3>
      <div class="ref-grid">
        <div v-for="c in focusCurrencies" :key="c.code" class="ref-item">
          <span class="ref-flag">{{ c.flag }}</span>
          <span class="ref-rate">
            {{ c.unit }} {{ c.code }} = <strong>{{ rates[c.code]?.toFixed(4)||'--' }}</strong> CNY
          </span>
        </div>
      </div>
      <div class="ref-note">数据每小时更新 · 仅供参考</div>
    </div>
  </div>
</template>

<script setup>
import { ref,reactive,onMounted,onUnmounted } from 'vue'
import { fetchExchangeRates,FOCUS_CURRENCIES,calculateRate } from '../api/exchangeRate.js'
import RateCard from '../components/RateCard.vue'
import CurrencyConverter from '../components/CurrencyConverter.vue'
import DailyEncourage from '../components/DailyEncourage.vue'

const emit = defineEmits(['updateTime','refreshStart','refreshEnd'])

const focusCurrencies = FOCUS_CURRENCIES
const rates = reactive({})
const changes = reactive({})
const hasError = reactive({})
const histories = reactive({})
const loading = ref(true)
const refreshing = ref(false)
const prevRates = reactive({})

let timer=null
const INTERVAL=30_000, MAX_H=40

function loadH(){ try{ const s=localStorage.getItem('fx_hist'); if(s) Object.assign(histories,JSON.parse(s)) }catch{} }
function saveH(){ try{ localStorage.setItem('fx_hist',JSON.stringify({...histories})) }catch{} }

async function refreshRates(){
  refreshing.value=true; emit('refreshStart')
  try{ const d=await fetchExchangeRates(); updateRates(d) }
  catch(e){ console.error(e) }
  finally{ refreshing.value=false; emit('refreshEnd') }
}

function updateRates(data){
  const r=data.rates; if(!r) return
  focusCurrencies.forEach(c=>{
    if(rates[c.code] && prevRates[c.code]){
      const o=prevRates[c.code], n=calculateRate(r,c.code,c.unit)
      if(o&&n) changes[c.code]=+((n-o)/o*100).toFixed(2)
    }
    prevRates[c.code]=rates[c.code]
    const rate=calculateRate(r,c.code,c.unit)
    if(rate){ rates[c.code]=rate; hasError[c.code]=false
      if(!histories[c.code]) histories[c.code]=[]
      histories[c.code].push(rate)
      if(histories[c.code].length>MAX_H) histories[c.code].shift()
    } else hasError[c.code]=true
  })
  saveH()
  emit('updateTime', new Date().toLocaleTimeString('zh-CN',{hour12:false}))
  loading.value=false
}

onMounted(async()=>{ loadH(); await refreshRates(); timer=setInterval(refreshRates,INTERVAL) })
onUnmounted(()=>clearInterval(timer))
</script>

<style lang="scss" scoped>
.page { max-width:1200px; margin:0 auto; position:relative }

/* 背景 */
.bg-blob {
  position:absolute; border-radius:50%; pointer-events:none; z-index:0;
}
.b1 {
  top:80px; right:-60px; width:260px; height:260px;
  background:radial-gradient(circle,rgba(255,133,161,.12) 0%,transparent 70%);
  animation:float 8s ease-in-out infinite;
}
.b2 {
  bottom:120px; left:-40px; width:220px; height:220px;
  background:radial-gradient(circle,rgba(255,107,138,.08) 0%,transparent 70%);
  animation:float 9s ease-in-out infinite 3s;
}
@keyframes float {
  0%,100% { transform:translate(0,0) scale(1) }
  50% { transform:translate(8px,-10px) scale(1.04) }
}

/* 头部 */
.section-head {
  display:flex; align-items:center; justify-content:space-between;
  margin-bottom:10px; position:relative; z-index:1;
  h2 { font-size:16px; font-weight:800 }

  @media (min-width:769px) { h2 { font-size:18px } }
}

.refresh-btn {
  width:36px; height:36px; border-radius:50%;
  border:1.5px solid var(--p-300); background:var(--bg-card);
  cursor:pointer; font-size:15px;
  display:flex; align-items:center; justify-content:center;
  transition:all .3s var(--spring);
  &:hover { background:var(--p-100); border-color:var(--p-500); transform:scale(1.1) }
  &:active { transform:scale(.9) }
  &.spin { animation:spin .8s linear infinite }
  &:disabled { opacity:.6 }
}
@keyframes spin { to { transform:rotate(360deg) } }

/* 卡片网格 */
.rate-grid {
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:10px;
  margin-bottom:16px;
  position:relative; z-index:1;

  @media (min-width:640px)  { grid-template-columns:repeat(3,1fr) }
  @media (min-width:1024px) { grid-template-columns:repeat(5,1fr) }
}

/* 快捷参考 */
.quick-ref {
  border-radius:var(--radius-lg); padding:16px 18px;
  box-shadow:var(--shadow-sm); position:relative; z-index:1;

  @media (min-width:769px) { padding:20px 24px }

  h3 { font-size:14px; font-weight:700; margin-bottom:12px }
}
.ref-grid {
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:4px 12px; margin-bottom:8px;
  @media (min-width:640px) { grid-template-columns:repeat(3,1fr) }
  @media (min-width:1024px) { grid-template-columns:repeat(5,1fr) }
}
.ref-item {
  display:flex; align-items:center; gap:5px; font-size:11px; padding:3px 0;
  .ref-flag { font-size:14px }
  .ref-rate { color:var(--text-secondary); strong{ color:var(--text-primary); font-weight:600 } }
  @media (min-width:769px) { font-size:12px; .ref-flag { font-size:16px } }
}
.ref-note { font-size:10px; color:var(--text-muted); text-align:center; padding-top:6px; border-top:1px solid var(--p-200) }
</style>
