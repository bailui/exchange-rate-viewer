<template>
  <div class="card glass" :style="{ animationDelay: delay+'ms', '--grad': gradient }">
    <div class="card-glow"></div>
    <div class="card-inner">
      <div class="card-top">
        <span class="flag">{{ currency.flag }}</span>
        <span class="code">{{ currency.code }}</span>
        <span class="name">{{ currency.name }}</span>
      </div>

      <div class="card-rate" v-if="!loading && !error && rate !== null">
        <span v-if="currency.unit>1" class="unit">{{ currency.unit }}</span>
        <span class="val" :key="rate">{{ formattedRate }}</span>
      </div>
      <div v-else-if="loading" class="skel"></div>
      <div v-else class="err">—</div>

      <div class="card-meta" v-if="!loading && !error && rate !== null">
        <span class="chg" :class="chgCls">{{ fmtChg }}</span>
        <span class="spark-wrap">
          <Sparkline :data="history" :color="currency.color" />
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Sparkline from './Sparkline.vue'

const p=defineProps({
  currency:Object, rate:Number,
  changePercent:{type:Number,default:0},
  loading:Boolean, error:Boolean,
  delay:{type:Number,default:0},
  history:{type:Array,default:()=>[]}
})

const gradient = computed(()=>{
  const c=p.currency
  // 每个币种独特的 aurora 渐变
  const g = {
    USD:'linear-gradient(135deg, rgba(99,102,241,.2), rgba(168,85,247,.1))',
    EUR:'linear-gradient(135deg, rgba(59,130,246,.2), rgba(99,102,241,.1))',
    GBP:'linear-gradient(135deg, rgba(168,85,247,.2), rgba(236,72,153,.1))',
    JPY:'linear-gradient(135deg, rgba(236,72,153,.2), rgba(239,68,68,.1))',
    AUD:'linear-gradient(135deg, rgba(34,197,94,.15), rgba(59,130,246,.1))',
    CAD:'linear-gradient(135deg, rgba(239,68,68,.15), rgba(249,115,22,.1))',
    CHF:'linear-gradient(135deg, rgba(168,85,247,.15), rgba(99,102,241,.1))',
    NZD:'linear-gradient(135deg, rgba(34,197,94,.15), rgba(168,85,247,.1))',
    SGD:'linear-gradient(135deg, rgba(249,115,22,.15), rgba(236,72,153,.1))',
    HKD:'linear-gradient(135deg, rgba(59,130,246,.15), rgba(34,197,94,.1))',
  }
  return g[c.code] || g.USD
})

const formattedRate = computed(()=>p.rate?.toFixed(4)??'--')
const chgCls = computed(()=>p.changePercent>0?'up':p.changePercent<0?'down':'flat')
const fmtChg = computed(()=>`${p.changePercent>=0?'+':''}${p.changePercent}%`)
</script>

<style lang="scss" scoped>
.card {
  border-radius:var(--radius-md);
  position:relative; z-index:1; overflow:hidden;
  animation: fadeUp .6s var(--ease-out) both;
  transition: all .4s var(--spring);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 60px rgba(0,0,0,.4);
    .card-glow { opacity:1 }
  }
}

.card-glow {
  position:absolute; inset:0;
  background: var(--grad);
  opacity:.5; transition:opacity .4s;
}

.card-inner {
  position:relative; z-index:1;
  padding:18px 20px;
}

.card-top {
  display:flex; align-items:center; gap:8px; margin-bottom:14px;
  .flag { font-size:22px; line-height:1 }
  .code { font-size:14px; font-weight:700; color: var(--text-primary); letter-spacing:.03em }
  .name { font-size:11px; color: var(--text-secondary); font-weight:500 }
}

.card-rate {
  display:flex; align-items:baseline; gap:3px; margin-bottom:10px;
  .unit { font-size:12px; color:var(--text-secondary); font-weight:500 }
  .val {
    font-size:30px; font-weight:800; letter-spacing:-.03em;
    font-variant-numeric:tabular-nums;
    animation: countIn .4s var(--ease-out);
  }
}

.skel {
  width:100px; height:30px; border-radius:6px; margin-bottom:10px;
  background:linear-gradient(90deg, rgba(255,255,255,.03), rgba(255,255,255,.08), rgba(255,255,255,.03));
  background-size:200% 100%; animation:shimmer 2s ease-in-out infinite;
}
.err { font-size:30px; font-weight:800; color:var(--text-muted); margin-bottom:10px }

.card-meta {
  display:flex; align-items:center; justify-content:space-between;
  .chg {
    font-size:11px; font-weight:600; padding:2px 8px; border-radius:100px;
    &.up { color:#4ade80; background:rgba(74,222,128,.1) }
    &.down { color:#f87171; background:rgba(248,113,113,.1) }
    &.flat { color:var(--text-muted); background:rgba(255,255,255,.04) }
  }
  .spark-wrap { flex:1; margin-left:8px }
}
</style>
