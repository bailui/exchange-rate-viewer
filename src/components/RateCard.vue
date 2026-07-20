<template>
  <div class="rate-card glass" :style="{ animationDelay: delay+'ms' }">
    <div class="card-top">
      <div class="card-id">
        <span class="flag">{{ currency.flag }}</span>
        <div>
          <div class="card-code">{{ currency.code }} <span class="card-vs">/ CNY</span></div>
          <div class="card-name">{{ currency.name }}</div>
        </div>
      </div>
      <div v-if="!loading&&!error&&rate!==null" class="card-chg" :class="chgCls">
        {{ fmtChg }}
      </div>
    </div>

    <div class="card-val">
      <div v-if="loading" class="skel"></div>
      <div v-else-if="error" class="err">获取失败</div>
      <template v-else-if="rate!==null">
        <span v-if="currency.unit>1" class="unit">{{ currency.unit }}</span>
        <span class="val">{{ fmtVal }}</span>
      </template>
    </div>

    <div class="card-spark" v-if="!loading&&!error&&rate!==null">
      <Sparkline :data="history" color="#ff6b8a" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Sparkline from './Sparkline.vue'

const p=defineProps({
  currency:Object, rate:Number, changePercent:{type:Number,default:0},
  loading:Boolean, error:Boolean, delay:{type:Number,default:0},
  history:{type:Array,default:()=>[]}
})

const fmtVal = computed(()=>p.rate?.toFixed(4)??'--')
const chgCls = computed(()=>p.changePercent>0?'up':p.changePercent<0?'down':'flat')
const fmtChg = computed(()=>`${p.changePercent>=0?'+':''}${p.changePercent}%`)
</script>

<style lang="scss" scoped>
.rate-card {
  border-radius:var(--radius-lg); padding:14px 16px;
  box-shadow:var(--shadow-sm);
  animation:fadeUp .45s var(--ease) both;
  position:relative; z-index:1;
  transition:all .3s var(--spring);

  &:hover { transform:translateY(-2px); box-shadow:var(--shadow-md) }

  @media (min-width:769px) { padding:16px 20px }
}

.card-top {
  display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:6px;
}
.card-id { display:flex; align-items:center; gap:8px }
.flag { font-size:22px; line-height:1 }
.card-code { font-size:13px; font-weight:700; color:var(--text-primary) }
.card-vs { font-size:9px; color:var(--text-muted); font-weight:500 }
.card-name { font-size:10px; color:var(--text-muted); font-weight:500 }

.card-chg {
  padding:2px 7px; border-radius:100px; font-size:10px; font-weight:600;
  &.up{ background:rgba(232,90,120,.1); color:var(--p-600) }
  &.down{ background:rgba(48,180,105,.1); color:#30b469 }
  &.flat{ background:rgba(0,0,0,.04); color:var(--text-muted) }
}

.card-val {
  display:flex; align-items:baseline; gap:2px; margin-bottom:8px; min-height:26px;
  .unit{ font-size:11px; color:var(--text-muted); font-weight:500 }
  .val{ font-size:24px; font-weight:800; letter-spacing:-.03em; font-variant-numeric:tabular-nums }
  @media (min-width:769px) { .val{ font-size:28px } }

  .skel{ width:90px; height:24px; border-radius:5px; background:linear-gradient(90deg,rgba(0,0,0,.03),rgba(0,0,0,.07),rgba(0,0,0,.03)); background-size:200% 100%; animation:shimmer 1.5s ease-in-out infinite }
  .err{ font-size:12px; color:var(--text-muted) }
}
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

.card-spark { margin-top:2px }
</style>
