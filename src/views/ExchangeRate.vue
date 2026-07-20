<template>
  <div class="page">
    <!-- 每日鼓励 -->
    <div class="encourage glass stagger-1">
      <span class="enc-emoji">{{ msg.emoji }}</span>
      <div>
        <div class="enc-text">{{ msg.text }}</div>
        <div class="enc-from">— 鹿乐汇 · {{ today }}</div>
      </div>
    </div>

    <!-- 计算器 -->
    <CurrencyConverter />

    <!-- 汇率标题 -->
    <div class="section-head stagger-2">
      <h2>实时汇率</h2>
      <button class="rf-btn" :class="{ spin: refreshing }" @click="refreshRates">
        🔄
      </button>
    </div>

    <!-- Bento 卡片 -->
    <div class="bento">
      <RateCard
        v-for="(c,i) in focusCurrencies" :key="c.code"
        :currency="c" :rate="rates[c.code]"
        :change-percent="changes[c.code]||0"
        :loading="loading && !rates[c.code]"
        :error="hasError[c.code]"
        :delay="80 + i*60"
        :history="histories[c.code]||[]"
        :class="'stagger-' + (Math.min((i%4)+1, 4))"
      />
    </div>

    <!-- 快捷换算 -->
    <div class="quick glass" style="animation:fadeUp .6s var(--ease-out) .5s both">
      <h3>快捷换算</h3>
      <div class="quick-grid">
        <div v-for="c in focusCurrencies" :key="c.code" class="quick-item">
          <span class="qf">{{ c.flag }}</span>
          <span>{{ c.unit }} {{ c.code }} = <b>{{ rates[c.code]?.toFixed(4)||'--' }}</b> CNY</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref,reactive,onMounted,onUnmounted,computed } from 'vue'
import { fetchExchangeRates,FOCUS_CURRENCIES,calculateRate } from '../api/exchangeRate.js'
import RateCard from '../components/RateCard.vue'
import CurrencyConverter from '../components/CurrencyConverter.vue'

const emit = defineEmits(['updateTime','refreshStart','refreshEnd'])
const focusCurrencies = FOCUS_CURRENCIES
const rates=reactive({}), changes=reactive({}), hasError=reactive({}), histories=reactive({})
const loading=ref(true), refreshing=ref(false), prevRates=reactive({})
let timer=null; const INT=30_000, MAXH=40

const today = computed(()=>`${new Date().getMonth()+1}月${new Date().getDate()}日`)

const msgs = [
  {emoji:'🌌',text:'每一天都是全新的汇率，也是全新的你'},
  {emoji:'💫',text:'宇宙那么大，相遇本身就是奇迹'},
  {emoji:'✨',text:'做颗星星，有棱有角，还会发光'},
  {emoji:'🌸',text:'你笑起来真好看'},
  {emoji:'🦌',text:'小鹿乱撞的不只是心跳'},
  {emoji:'🌈',text:'生活起起落落，但总会越来越好'},
  {emoji:'💎',text:'压力是暂时的，你是闪闪发光的'},
  {emoji:'🌙',text:'晚安前记得微笑'},
  {emoji:'☀️',text:'新的一天，新的好运气'},
  {emoji:'🦋',text:'做自己喜欢的事'},
  {emoji:'🎀',text:'今天也要元气满满'},
  {emoji:'🍀',text:'好运偏爱努力又善良的人'},
  {emoji:'💖',text:'有人在偷偷关心你'},
  {emoji:'🌟',text:'你值得所有美好'},
  {emoji:'🧸',text:'做一只快乐的小熊软糖'},
  {emoji:'🌺',text:'温柔是宝藏，你也是'},
  {emoji:'🐣',text:'慢慢来，谁不是翻山越岭去爱'},
  {emoji:'🫧',text:'烦恼都吹进泡泡里飘走'},
  {emoji:'🐰',text:'蹦蹦跳跳，快快乐乐'},
  {emoji:'🌻',text:'只要心中有光，走到哪里都是晴天'},
  {emoji:'💐',text:'送你一束花，愿你今天好心情'},
  {emoji:'🎵',text:'生活给你柠檬，就加点糖'},
  {emoji:'🍰',text:'辛苦啦，奖励自己一块小蛋糕'},
  {emoji:'🕊️',text:'让风带走烦恼'},
  {emoji:'🍬',text:'生活有点苦，来颗糖甜甜嘴'},
  {emoji:'💕',text:'先爱自己，再爱世界'},
  {emoji:'🌿',text:'深呼吸，一切都会好起来'},
  {emoji:'🦢',text:'从容面对每一天'},
  {emoji:'✨',text:'不管前方多困难，你都能化解'},
  {emoji:'💗',text:'记得按时吃饭好好休息'},
  {emoji:'🌷',text:'像春天里最温柔的风'},
]
const msg = computed(()=>msgs[new Date().getDate() % msgs.length])

function loadH(){ try{const s=localStorage.getItem('fx_hist'); if(s) Object.assign(histories,JSON.parse(s))}catch{} }
function saveH(){ try{localStorage.setItem('fx_hist',JSON.stringify({...histories}))}catch{} }

async function refreshRates(){
  refreshing.value=true; emit('refreshStart')
  try{ const d=await fetchExchangeRates(); updateRates(d) }
  catch(e){ console.error(e) }
  finally{ refreshing.value=false; emit('refreshEnd') }
}

function updateRates(data){
  const r=data.rates; if(!r) return
  focusCurrencies.forEach(c=>{
    if(rates[c.code]&&prevRates[c.code]){
      const o=prevRates[c.code], n=calculateRate(r,c.code,c.unit)
      if(o&&n) changes[c.code]=+((n-o)/o*100).toFixed(2)
    }
    prevRates[c.code]=rates[c.code]
    const rate=calculateRate(r,c.code,c.unit)
    if(rate){ rates[c.code]=rate; hasError[c.code]=false
      if(!histories[c.code]) histories[c.code]=[]
      histories[c.code].push(rate)
      if(histories[c.code].length>MAXH) histories[c.code].shift()
    } else hasError[c.code]=true
  })
  saveH()
  emit('updateTime', new Date().toLocaleTimeString('zh-CN',{hour12:false}))
  loading.value=false
}

onMounted(async()=>{ loadH(); await refreshRates(); timer=setInterval(refreshRates,INT) })
onUnmounted(()=>clearInterval(timer))
</script>

<style lang="scss" scoped>
.page { max-width:1400px; margin:0 auto; padding-top:16px }

.encourage {
  border-radius:var(--radius-lg); padding:16px 20px; margin-bottom:16px;
  display:flex; align-items:center; gap:14px;
  .enc-emoji { font-size:30px; flex-shrink:0 }
  .enc-text { font-size:15px; font-weight:600; color:var(--text-primary); line-height:1.5 }
  .enc-from { font-size:12px; color:var(--text-muted); margin-top:4px }
}

.section-head {
  display:flex; align-items:center; justify-content:space-between;
  margin: 18px 0 12px;
  h2 { font-size:16px; font-weight:800; letter-spacing:-.02em }
}

.rf-btn {
  width:32px; height:32px; border-radius:50%;
  border:1px solid var(--border-card); background:transparent;
  cursor:pointer; font-size:14px; color:var(--text-secondary);
  display:flex; align-items:center; justify-content:center;
  transition:all .3s;
  &:hover { border-color:rgba(255,255,255,.2); background:rgba(255,255,255,.05) }
  &.spin { animation:spin .8s linear infinite }
}
@keyframes spin { to{transform:rotate(360deg)} }

/* Bento 网格 */
.bento {
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:10px; margin-bottom:18px;

  @media (min-width:500px) { grid-template-columns:repeat(2,1fr) }
  @media (min-width:768px) { grid-template-columns:repeat(3,1fr) }
  @media (min-width:1100px) { grid-template-columns:repeat(5,1fr) }

  & > :first-child {
    @media (min-width:768px) { grid-column:span 2; grid-row:span 1 }
  }
  & > :nth-child(2) {
    @media (min-width:768px) { grid-column:span 3; grid-row:span 1 }
  }
}

.quick {
  border-radius:var(--radius-lg); padding:20px 24px;
  margin-bottom:24px;
  h3 { font-size:14px; font-weight:700; margin-bottom:14px }
}
.quick-grid {
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:6px 16px;
  @media (min-width:600px) { grid-template-columns:repeat(3,1fr) }
  @media (min-width:900px) { grid-template-columns:repeat(5,1fr) }
}
.quick-item {
  display:flex; align-items:center; gap:6px; font-size:12px; padding:4px 0;
  color:var(--text-secondary);
  .qf { font-size:15px }
  b { color:var(--text-primary); font-weight:600 }
}
</style>
