<template>
  <div class="page">
    <!-- 每日鼓励 -->
    <div class="encourage">
      <span class="enc-emoji">{{ msg.emoji }}</span>
      <div>
        <div class="enc-text">{{ msg.text }}</div>
        <div class="enc-from">— 白鹿io · {{ today }}</div>
      </div>
    </div>

    <!-- 计算器 -->
    <CurrencyConverter />

    <!-- 热门汇率 -->
    <div class="section-head">
      <h2>🔥 热门汇率</h2>
      <button class="rf-btn" :class="{ spin: refreshing }" @click="refreshRates">🔄</button>
    </div>

    <div class="hot-grid">
      <div v-for="(c,i) in hotCurrencies" :key="c.code" class="rate-item"
        :style="{ animationDelay: i*30+'ms' }">
        <span class="ri-flag">{{ c.flag }}</span>
        <div class="ri-info">
          <div class="ri-code">{{ c.code }} <span class="ri-name">{{ c.name }}</span></div>
          <div class="ri-rate">
            <span v-if="c.unit>1" class="ri-unit">{{ c.unit }}</span>
            {{ c.rate?.toFixed(4) || '--' }}
            <span class="ri-cny">CNY</span>
          </div>
        </div>
        <div class="ri-spark" v-if="sparkData[c.code]?.length >= 2">
          <Sparkline :data="sparkData[c.code]" :color="c.color" />
        </div>
      </div>
    </div>

    <!-- 全部币种 -->
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
import { ref,reactive,onMounted,onUnmounted,computed } from 'vue'
import { fetchLiveRates,buildCurrencyList,fetchHistory,getCNYHistory,HOT_CURRENCIES,CURRENCY_META } from '../api/exchangeRate.js'
import CurrencyConverter from '../components/CurrencyConverter.vue'
import Sparkline from '../components/Sparkline.vue'

const emit = defineEmits(['updateTime','refreshStart','refreshEnd'])
const loading=ref(true), refreshing=ref(false)
const rawRates=reactive({})
const sparkData=reactive({})

const today = computed(()=>`${new Date().getMonth()+1}月${new Date().getDate()}日`)
const msgs=[{emoji:'🌸',text:'每一天都是全新的开始，今天的你比昨天更棒'},{emoji:'💖',text:'有人在偷偷关心你，记得好好照顾自己'},{emoji:'✨',text:'做颗星星，有棱有角，还会发光'},{emoji:'🦌',text:'小鹿乱撞的不只是心跳，还有对你的喜欢'},{emoji:'🌈',text:'生活起起落落，但总会越来越好'},{emoji:'💎',text:'压力是暂时的，但你是钻石闪闪发光'},{emoji:'🌙',text:'晚安前记得微笑，今天你做得很好'},{emoji:'☀️',text:'新的一天，新的汇率，新的好运气'},{emoji:'🦋',text:'做自己喜欢的事，成为自己想成为的人'},{emoji:'🎀',text:'今天也要元气满满哦'},{emoji:'🍀',text:'好运总是偏爱努力又善良的人'},{emoji:'🌟',text:'你值得所有美好，因为你就是美好本身'},{emoji:'🧸',text:'做一只快乐的小熊软糖'},{emoji:'💐',text:'送你一束花，愿你今天好心情'},{emoji:'🐰',text:'蹦蹦跳跳，快快乐乐'}]
const msg=computed(()=>msgs[new Date().getDate()%msgs.length])

const hotCurrencies=computed(()=>{
  const list=buildCurrencyList(rawRates)
  return list.filter(c=>HOT_CURRENCIES.includes(c.code))
})

const allCurrencies=computed(()=>{
  const list=buildCurrencyList(rawRates)
  return list.filter(c=>c.code!=='CNY' && !HOT_CURRENCIES.includes(c.code))
})

async function loadSpark(){
  try{
    const data=await fetchHistory(7)
    HOT_CURRENCIES.forEach(code=>{
      const vals=getCNYHistory(data,code)
      if(vals.length>=2) sparkData[code]=vals
    })
  }catch(e){}
}

async function refreshRates(){
  refreshing.value=true; emit('refreshStart')
  try{
    const d=await fetchLiveRates()
    Object.assign(rawRates, d.rates||{})
    loading.value=false
    emit('updateTime', new Date().toLocaleTimeString('zh-CN',{hour12:false}))
  }catch(e){}
  finally{ refreshing.value=false; emit('refreshEnd') }
}

onMounted(async()=>{
  await Promise.all([refreshRates(),loadSpark()])
  setInterval(refreshRates,30000)
})
</script>

<style lang="scss" scoped>
.page { max-width:1400px; margin:0 auto }

.encourage {
  background: linear-gradient(135deg, var(--pink-ll), #fff0f5);
  border-radius:var(--r-lg); padding:16px 20px; margin-bottom:16px;
  display:flex; align-items:center; gap:14px; border:1px solid var(--border);
  .enc-emoji { font-size:30px }
  .enc-text { font-size:15px; font-weight:600; color:var(--text) }
  .enc-from { font-size:12px; color:var(--text3); margin-top:4px }
}

.section-head {
  display:flex; align-items:center; justify-content:space-between;
  margin:18px 0 10px;
  h2 { font-size:15px; font-weight:800 }
  .count { font-size:12px; color:var(--text3); font-weight:500 }
}

.rf-btn {
  width:32px; height:32px; border-radius:50%;
  border:1px solid var(--border); background:var(--bg-card); cursor:pointer;
  font-size:14px; transition:all .3s;
  &:hover { border-color:var(--pink); background:var(--pink-ll) }
  &.spin { animation:spin .8s linear infinite }
}
@keyframes spin { to{transform:rotate(360deg)} }

/* 热门 */
.hot-grid {
  display:grid; gap:8px;
  grid-template-columns:repeat(2,1fr);
  @media(min-width:600px){ grid-template-columns:repeat(3,1fr) }
  @media(min-width:900px){ grid-template-columns:repeat(4,1fr) }
}

.rate-item {
  background:var(--bg-card); border:1px solid var(--border);
  border-radius:var(--r-md); padding:14px 16px;
  display:flex; align-items:center; gap:10px;
  animation:fadeUp .4s var(--ease) both;
  transition:all .2s;
  &:hover { box-shadow:var(--shadow); border-color:var(--pink-l) }

  .ri-flag { font-size:28px; line-height:1; flex-shrink:0 }
  .ri-info { flex:1; min-width:0 }
  .ri-code { font-size:13px; font-weight:700 }
  .ri-name { font-size:10px; color:var(--text3); font-weight:400 }
  .ri-rate { font-size:18px; font-weight:800; font-variant-numeric:tabular-nums; margin-top:2px }
  .ri-unit { font-size:11px; color:var(--text3); font-weight:500 }
  .ri-cny { font-size:11px; color:var(--text3); font-weight:400; margin-left:2px }
  .ri-spark { margin-top:4px; min-width:80px }
}

/* 全部 */
.all-grid {
  display:grid; gap:4px;
  grid-template-columns:repeat(2,1fr);
  @media(min-width:500px){ grid-template-columns:repeat(3,1fr) }
  @media(min-width:768px){ grid-template-columns:repeat(4,1fr) }
  @media(min-width:1100px){ grid-template-columns:repeat(5,1fr) }
}

.all-item {
  display:flex; align-items:center; gap:6px;
  padding:7px 10px; border-radius:var(--r-sm);
  font-size:12px; transition:background .15s;
  &:hover { background:var(--pink-ll) }

  .ai-flag { font-size:16px; width:22px; text-align:center }
  .ai-code { font-weight:600; color:var(--text); width:36px }
  .ai-name { color:var(--text3); flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
  .ai-rate { font-weight:600; font-variant-numeric:tabular-nums; color:var(--text2); flex-shrink:0 }
}
</style>
