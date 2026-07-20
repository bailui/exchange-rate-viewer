<template>
  <div class="page">
    <div class="encourage">
      <span class="enc-emoji">{{ msg.emoji }}</span>
      <div>
        <div class="enc-text">{{ msg.text }}</div>
        <div class="enc-from">— 白鹿io · {{ today }}</div>
      </div>
    </div>

    <CurrencyConverter />

    <div class="section-head">
      <h2>🔥 热门汇率</h2>
      <button class="rf-btn" :class="{ spin: refreshing }" @click="refreshRates">🔄</button>
    </div>

    <div class="hot-grid">
      <div v-for="(c,i) in hotCurrencies" :key="c.code" class="rate-card"
        :style="{ animationDelay: i*30+'ms', '--grad': gradients[c.code]||gradients.USD }">
        <div class="card-glow"></div>
        <div class="card-inner">
          <div class="rc-top">
            <span class="rc-flag">{{ c.flag }}</span>
            <span class="rc-code">{{ c.code }}</span>
            <span class="rc-name">{{ c.name }}</span>
          </div>
          <div class="rc-val">
            <span v-if="c.unit>1" class="rc-unit">{{ c.unit }}</span>
            <span class="rc-num" :key="c.rate">{{ c.rate?.toFixed(4) || '--' }}</span>
            <span class="rc-cny"> CNY</span>
          </div>
          <div class="rc-spark" v-if="sparkData[c.code]?.length>=2">
            <Sparkline :data="sparkData[c.code]" :color="c.color" />
          </div>
        </div>
      </div>
    </div>

    <div class="section-head">
      <h2>🌍 全部币种</h2>
      <span class="count">{{ allCurrencies.length }} 种</span>
    </div>

    <div class="all-grid">
      <div v-for="c in allCurrencies" :key="c.code" class="all-item">
        <span class="ai-flag">{{ c.flag }}</span>
        <span class="ai-code">{{ c.code }}</span>
        <span class="ai-name">{{ c.name }}</span>
        <span class="ai-rate">
          <template v-if="c.unit>1">{{ c.unit }}</template>
          {{ c.rate?.toFixed(4) || '--' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref,reactive,onMounted,computed } from 'vue'
import { fetchLiveRates,buildCurrencyList,fetchHistory,getCNYHistory,HOT_CURRENCIES } from '../api/exchangeRate.js'
import CurrencyConverter from '../components/CurrencyConverter.vue'
import Sparkline from '../components/Sparkline.vue'

const emit = defineEmits(['updateTime','refreshStart','refreshEnd'])
const loading=ref(true), refreshing=ref(false)
const rawRates=reactive({}), sparkData=reactive({})

const today=computed(()=>`${new Date().getMonth()+1}月${new Date().getDate()}日`)
const msgs=[{emoji:'🌌',text:'每一天都是全新的汇率，也是全新的你'},{emoji:'💫',text:'宇宙那么大，相遇本身就是奇迹'},{emoji:'✨',text:'做颗星星，有棱有角，还会发光'},{emoji:'🌸',text:'你笑起来真好看'},{emoji:'🌈',text:'生活起起落落，但总会越来越好'},{emoji:'💎',text:'压力是暂时的，你是闪闪发光的'},{emoji:'☀️',text:'新的一天，新的好运气'},{emoji:'🦋',text:'做自己喜欢的事'},{emoji:'🎀',text:'今天也要元气满满'},{emoji:'🍀',text:'好运偏爱努力又善良的人'},{emoji:'💖',text:'有人在偷偷关心你'},{emoji:'🌟',text:'你值得所有美好'},{emoji:'🧸',text:'做一只快乐的小熊软糖'},{emoji:'💐',text:'送你一束花，愿你今天好心情'},{emoji:'🐰',text:'蹦蹦跳跳，快快乐乐'}]
const msg=computed(()=>msgs[new Date().getDate()%msgs.length])

const gradients={USD:'linear-gradient(135deg,rgba(99,102,241,.18),rgba(168,85,247,.08))',EUR:'linear-gradient(135deg,rgba(59,130,246,.15),rgba(99,102,241,.08))',GBP:'linear-gradient(135deg,rgba(168,85,247,.18),rgba(236,72,153,.08))',JPY:'linear-gradient(135deg,rgba(236,72,153,.15),rgba(239,68,68,.08))',AUD:'linear-gradient(135deg,rgba(34,197,94,.12),rgba(59,130,246,.08))',CAD:'linear-gradient(135deg,rgba(239,68,68,.12),rgba(249,115,22,.08))',CHF:'linear-gradient(135deg,rgba(168,85,247,.12),rgba(99,102,241,.08))',NZD:'linear-gradient(135deg,rgba(34,197,94,.12),rgba(168,85,247,.08))',SGD:'linear-gradient(135deg,rgba(249,115,22,.12),rgba(236,72,153,.08))',HKD:'linear-gradient(135deg,rgba(59,130,246,.12),rgba(34,197,94,.08))',KRW:'linear-gradient(135deg,rgba(129,140,248,.12),rgba(99,102,241,.08))',THB:'linear-gradient(135deg,rgba(45,212,191,.12),rgba(34,197,94,.08))',MYR:'linear-gradient(135deg,rgba(250,204,21,.12),rgba(249,115,22,.08))',PHP:'linear-gradient(135deg,rgba(56,189,248,.12),rgba(59,130,246,.08))',IDR:'linear-gradient(135deg,rgba(249,115,22,.12),rgba(239,68,68,.08))',VND:'linear-gradient(135deg,rgba(239,68,68,.12),rgba(236,72,153,.08))',INR:'linear-gradient(135deg,rgba(34,197,94,.12),rgba(45,212,191,.08))'}

const hotCurrencies=computed(()=>buildCurrencyList(rawRates).filter(c=>HOT_CURRENCIES.includes(c.code)))
const allCurrencies=computed(()=>buildCurrencyList(rawRates).filter(c=>c.code!=='CNY'&&!HOT_CURRENCIES.includes(c.code)))

async function loadSpark(){ try{ const d=await fetchHistory(7); HOT_CURRENCIES.forEach(c=>{ const v=getCNYHistory(d,c); if(v.length>=2) sparkData[c]=v }) }catch{} }

async function refreshRates(){
  refreshing.value=true; emit('refreshStart')
  try{ const d=await fetchLiveRates(); Object.assign(rawRates,d.rates||{}); loading.value=false; emit('updateTime',new Date().toLocaleTimeString('zh-CN',{hour12:false})) }catch{}
  finally{ refreshing.value=false; emit('refreshEnd') }
}

onMounted(async()=>{ await Promise.all([refreshRates(),loadSpark()]); setInterval(refreshRates,30000) })
</script>

<style lang="scss" scoped>
.page { max-width:1400px; margin:0 auto; position:relative; z-index:1 }

.encourage {
  background:rgba(255,255,255,.03); border:1px solid var(--border);
  border-radius:var(--r-lg); padding:16px 20px; margin-bottom:16px;
  display:flex; align-items:center; gap:14px;
  .enc-emoji { font-size:30px }
  .enc-text { font-size:15px; font-weight:600; color:var(--text) }
  .enc-from { font-size:12px; color:var(--text3); margin-top:4px }
}

.section-head {
  display:flex; align-items:center; justify-content:space-between;
  margin:18px 0 10px;
  h2 { font-size:15px; font-weight:800 }
  .count { font-size:12px; color:var(--text3) }
}

.rf-btn {
  width:32px; height:32px; border-radius:50%;
  border:1px solid var(--border); background:transparent; cursor:pointer;
  font-size:14px; color:var(--text2); transition:all .3s;
  &:hover { border-color:rgba(255,255,255,.2); background:rgba(255,255,255,.05) }
  &.spin { animation:spin .8s linear infinite }
}
@keyframes spin { to{transform:rotate(360deg)} }

.hot-grid {
  display:grid; gap:8px;
  grid-template-columns:repeat(2,1fr);
  @media(min-width:600px){ grid-template-columns:repeat(3,1fr) }
  @media(min-width:900px){ grid-template-columns:repeat(4,1fr) }
}

.rate-card {
  border-radius:var(--r-md); border:1px solid var(--border);
  position:relative; overflow:hidden;
  animation:fadeUp .4s var(--ease) both;
  transition:all .3s var(--spring);
  &:hover { transform:translateY(-2px); box-shadow:0 12px 40px rgba(0,0,0,.3); .card-glow{opacity:1} }
}
.card-glow {
  position:absolute; inset:0; background:var(--grad); opacity:.5;
  transition:opacity .4s;
}
.card-inner { position:relative; z-index:1; padding:14px 16px }
.rc-top { display:flex; align-items:center; gap:6px; margin-bottom:8px }
.rc-flag { font-size:22px }
.rc-code { font-size:13px; font-weight:700 }
.rc-name { font-size:10px; color:var(--text3); font-weight:400 }
.rc-val { display:flex; align-items:baseline; gap:2px; margin-bottom:6px }
.rc-unit { font-size:11px; color:var(--text3) }
.rc-num { font-size:22px; font-weight:800; font-variant-numeric:tabular-nums; animation:scaleIn .3s var(--ease) }
.rc-cny { font-size:11px; color:var(--text3) }
.rc-spark { min-width:70px }

.all-grid {
  display:grid; gap:3px;
  grid-template-columns:repeat(2,1fr);
  @media(min-width:500px){ grid-template-columns:repeat(3,1fr) }
  @media(min-width:768px){ grid-template-columns:repeat(4,1fr) }
  @media(min-width:1100px){ grid-template-columns:repeat(5,1fr) }
}
.all-item {
  display:flex; align-items:center; gap:6px;
  padding:6px 10px; border-radius:var(--r-sm); font-size:12px;
  transition:background .15s;
  &:hover { background:rgba(255,255,255,.03) }
  .ai-flag { font-size:15px; width:22px; text-align:center }
  .ai-code { font-weight:600; width:34px }
  .ai-name { color:var(--text3); flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
  .ai-rate { font-weight:600; color:var(--text2); flex-shrink:0; font-variant-numeric:tabular-nums }
}
</style>
