<template>
  <div class="page">
    <!-- 统计概览 -->
    <div class="stat-row">
      <div class="stat-card">
        <div class="sc-left">
          <div class="sc-val">{{ currencyCount }}</div>
          <div class="sc-label">支持币种</div>
        </div>
        <div class="sc-icon" style="background:#e8f2ff;color:#4a8cf7">🌐</div>
      </div>
      <div class="stat-card">
        <div class="sc-left">
          <div class="sc-val">{{ hotCount }}</div>
          <div class="sc-label">热门汇率</div>
        </div>
        <div class="sc-icon" style="background:#fef3c7;color:#f59e0b">🔥</div>
      </div>
      <div class="stat-card">
        <div class="sc-left">
          <div class="sc-val">30s</div>
          <div class="sc-label">刷新频率</div>
        </div>
        <div class="sc-icon" style="background:#dcfce7;color:#22c55e">⚡</div>
      </div>
      <div class="stat-card">
        <div class="sc-left">
          <div class="sc-val">{{ lastTime || '--' }}</div>
          <div class="sc-label">最后更新</div>
        </div>
        <div class="sc-icon" style="background:#f3e8ff;color:#a855f7">🕐</div>
      </div>
    </div>

    <!-- 每日一句 + 计算器 -->
    <div class="top-row">
      <div class="encourage">
        <span class="enc-emoji">{{ msg.emoji }}</span>
        <div>
          <div class="enc-text">{{ msg.text }}</div>
          <div class="enc-from">— 白鹿io · {{ today }}</div>
        </div>
      </div>
    </div>

    <CurrencyConverter />

    <!-- 热门汇率 -->
    <div class="section-head">
      <h2>🔥 热门汇率</h2>
      <button class="rf-btn" :class="{ spin: refreshing }" @click="refreshRates">🔄</button>
    </div>

    <div class="hot-grid">
      <div v-for="(c,i) in hotCurrencies" :key="c.code" class="rate-card"
        :style="{ animationDelay: i*30+'ms' }">
        <div class="rc-top">
          <span class="rc-flag">{{ c.flag }}</span>
          <div class="rc-info">
            <span class="rc-code">{{ c.code }}</span>
            <span class="rc-name">{{ c.name }}</span>
          </div>
        </div>
        <div class="rc-val">
          <span v-if="c.unit>1" class="rc-unit">{{ c.unit }}</span>
          <span class="rc-num" :key="c.rate">{{ c.rate?.toFixed(4) || '--' }}</span>
        </div>
        <div class="rc-spark" v-if="sparkData[c.code]?.length>=2">
          <Sparkline :data="sparkData[c.code]" :color="'#4a8cf7'" />
        </div>
      </div>
    </div>

    <!-- 全部币种 -->
    <div class="section-head">
      <h2>🌍 全部币种</h2>
      <span class="count">{{ allCurrencies.length }} 种</span>
    </div>

    <div class="all-table">
      <div class="all-header">
        <span class="ah-flag">货币</span>
        <span class="ah-code">代码</span>
        <span class="ah-name">名称</span>
        <span class="ah-rate">汇率 (CNY)</span>
      </div>
      <div v-for="c in allCurrencies" :key="c.code" class="all-row">
        <span class="ar-flag">{{ c.flag }}</span>
        <span class="ar-code">{{ c.code }}</span>
        <span class="ar-name">{{ c.name }}</span>
        <span class="ar-rate">
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
const loading=ref(true), refreshing=ref(false), lastTime=ref('')
const rawRates=reactive({}), sparkData=reactive({})

const today=computed(()=>`${new Date().getMonth()+1}月${new Date().getDate()}日`)
const msgs=[{emoji:'🌸',text:'每一天都是全新的汇率，也是全新的你'},{emoji:'💫',text:'宇宙那么大，相遇本身就是奇迹'},{emoji:'✨',text:'做颗星星，有棱有角，还会发光'},{emoji:'🌈',text:'生活起起落落，但总会越来越好'},{emoji:'💎',text:'压力是暂时的，你是闪闪发光的'},{emoji:'☀️',text:'新的一天，新的好运气'},{emoji:'🦋',text:'做自己喜欢的事'},{emoji:'🎀',text:'今天也要元气满满'},{emoji:'🍀',text:'好运偏爱努力又善良的人'},{emoji:'💖',text:'有人在偷偷关心你'},{emoji:'🌟',text:'你值得所有美好'}]
const msg=computed(()=>msgs[new Date().getDate()%msgs.length])

const hotCurrencies=computed(()=>buildCurrencyList(rawRates).filter(c=>HOT_CURRENCIES.includes(c.code)))
const allCurrencies=computed(()=>buildCurrencyList(rawRates).filter(c=>c.code!=='CNY'&&!HOT_CURRENCIES.includes(c.code)))
const currencyCount=computed(()=>buildCurrencyList(rawRates).filter(c=>c.code!=='CNY').length)
const hotCount=computed(()=>hotCurrencies.value.length)

async function loadSpark(){ try{ const d=await fetchHistory(7); HOT_CURRENCIES.forEach(c=>{ const v=getCNYHistory(d,c); if(v.length>=2) sparkData[c]=v }) }catch{} }

async function refreshRates(){
  refreshing.value=true; emit('refreshStart')
  try{ const d=await fetchLiveRates(); Object.assign(rawRates,d.rates||{}); loading.value=false; lastTime.value=new Date().toLocaleTimeString('zh-CN',{hour12:false}); emit('updateTime',lastTime.value) }catch{}
  finally{ refreshing.value=false; emit('refreshEnd') }
}

onMounted(async()=>{ await Promise.all([refreshRates(),loadSpark()]); setInterval(refreshRates,30000) })
</script>

<style lang="scss" scoped>
.page { max-width:1400px; margin:0 auto }

/* 统计卡片 */
.stat-row {
  display:grid; gap:12px; margin-bottom:20px;
  grid-template-columns:repeat(2,1fr);
  @media(min-width:600px){ grid-template-columns:repeat(4,1fr) }
}

.stat-card {
  background:var(--bg-card); border:1px solid var(--border);
  border-radius:var(--r-md); padding:16px 20px;
  display:flex; align-items:center; justify-content:space-between;
  box-shadow:var(--shadow);
  .sc-val { font-size:22px; font-weight:700; color:var(--text) }
  .sc-label { font-size:12px; color:var(--text2); margin-top:2px }
  .sc-icon { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:18px }
}

/* 鼓励语 */
.encourage {
  background:var(--bg-card); border:1px solid var(--border);
  border-radius:var(--r-md); padding:14px 18px; margin-bottom:16px;
  display:flex; align-items:center; gap:12px; box-shadow:var(--shadow);
  .enc-emoji { font-size:28px }
  .enc-text { font-size:14px; font-weight:600; color:var(--text) }
  .enc-from { font-size:12px; color:var(--text3); margin-top:2px }
}

.section-head {
  display:flex; align-items:center; justify-content:space-between;
  margin:20px 0 10px;
  h2 { font-size:15px; font-weight:700; color:var(--text) }
  .count { font-size:12px; color:var(--text3); font-weight:500 }
}

.rf-btn {
  width:30px; height:30px; border-radius:6px;
  border:1px solid var(--border); background:var(--bg-card); cursor:pointer;
  font-size:13px; color:var(--text2); transition:all .3s;
  &:hover { border-color:var(--accent); color:var(--accent) }
  &.spin { animation:spin .8s linear infinite }
}
@keyframes spin { to{transform:rotate(360deg)} }

/* 热门卡片 */
.hot-grid {
  display:grid; gap:10px;
  grid-template-columns:repeat(2,1fr);
  @media(min-width:600px){ grid-template-columns:repeat(3,1fr) }
  @media(min-width:900px){ grid-template-columns:repeat(4,1fr) }
}

.rate-card {
  background:var(--bg-card); border:1px solid var(--border);
  border-radius:var(--r-md); padding:14px 16px;
  box-shadow:var(--shadow);
  animation:fadeUp .4s var(--ease) both;
  transition:all .15s;
  &:hover { border-color:var(--accent); box-shadow:var(--shadow-md) }
}

.rc-top { display:flex; align-items:center; gap:8px; margin-bottom:8px }
.rc-flag { font-size:22px; line-height:1 }
.rc-code { font-size:13px; font-weight:700; color:var(--text) }
.rc-name { font-size:10px; color:var(--text3); font-weight:400; display:block }

.rc-val { display:flex; align-items:baseline; gap:2px; margin-bottom:6px }
.rc-unit { font-size:11px; color:var(--text3) }
.rc-num { font-size:22px; font-weight:800; font-variant-numeric:tabular-nums; color:var(--text) }
.rc-spark { min-width:70px }

/* 全部币种表格 */
.all-table {
  background:var(--bg-card); border:1px solid var(--border);
  border-radius:var(--r-md); overflow:hidden; box-shadow:var(--shadow);
}

.all-header {
  display:flex; align-items:center; padding:10px 16px;
  background:var(--bg-input); border-bottom:1px solid var(--border);
  font-size:12px; font-weight:600; color:var(--text2);
  .ah-flag { width:52px } .ah-code { width:50px } .ah-name { flex:1 } .ah-rate { width:100px; text-align:right }
}

.all-row {
  display:flex; align-items:center; padding:8px 16px;
  border-bottom:1px solid var(--border); font-size:13px;
  transition:background .1s;
  &:last-child { border-bottom:none }
  &:hover { background:var(--bg-input) }

  .ar-flag { width:52px; font-size:16px }
  .ar-code { width:50px; font-weight:600; color:var(--text) }
  .ar-name { flex:1; color:var(--text2); overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
  .ar-rate { width:100px; text-align:right; font-weight:600; font-variant-numeric:tabular-nums; color:var(--text2) }
}
</style>
