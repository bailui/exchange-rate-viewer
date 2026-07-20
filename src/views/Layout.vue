<template>
  <div class="app-root">
    <AuroraBg />

    <!-- 极简顶栏 -->
    <header class="topbar">
      <div class="tb-left">
        <span class="logo">白鹿io汇率转换</span>
      </div>
      <div class="tb-right">
        <span class="status" v-if="justUpdated">✅ 已刷新</span>
        <span class="dot" :class="{ live }"></span>
      </div>
    </header>

    <!-- Toast -->
    <Transition name="slide">
      <div v-if="toast" class="toast glass">{{ toast }}</div>
    </Transition>

    <!-- 主内容 -->
    <main class="content">
      <router-view
        @update-time="onTime"
        @refresh-start="live=true"
        @refresh-end="onEnd"
      />
    </main>

    <!-- 底部导航 (移动端) -->
    <nav class="bottom-nav">
      <router-link
        v-for="item in navs" :key="item.path" :to="item.path"
        class="bn-item" :class="{ on: isActive(item.path) }"
      >
        <span class="bn-icon">{{ item.icon }}</span>
        <span class="bn-label">{{ item.label }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import AuroraBg from '../components/AuroraBg.vue'

const route = useRoute()
const live = ref(false)
const justUpdated = ref(false)
const toast = ref('')

const navs = [
  { path:'/exchange-rate', icon:'📊', label:'汇率' },
  { path:'/calculator', icon:'🧮', label:'计算' },
  { path:'/trends', icon:'📈', label:'走势' },
  { path:'/alerts', icon:'🔔', label:'提醒' },
]

function isActive(p) {
  if (p==='/exchange-rate') return route.path==='/'||route.path==='/exchange-rate'
  return route.path===p
}

function onTime(t) { lastUpdate.value = t }
function onEnd() {
  live.value = false
  justUpdated.value = true
  toast.value = '✨ 汇率已刷新'
  setTimeout(()=>{ justUpdated.value=false; toast.value='' }, 3000)
}
</script>

<style lang="scss" scoped>
.app-root { min-height:100vh; display:flex; flex-direction:column; position:relative }

.topbar {
  height:52px; display:flex; align-items:center;
  justify-content:space-between; padding:0 20px;
  position:sticky; top:0; z-index:20;
  background:rgba(8,8,15,.7);
  backdrop-filter:blur(20px);
  border-bottom:1px solid var(--border-subtle);

  .tb-left .logo { font-size:16px; font-weight:700; letter-spacing:.03em }
  .tb-right { display:flex; align-items:center; gap:10px }
}

.status {
  font-size:11px; font-weight:600; color:#4ade80;
  background:rgba(74,222,128,.1); padding:3px 10px; border-radius:100px;
  animation:scaleIn .3s var(--spring);
}

.dot {
  width:7px; height:7px; border-radius:50%; background:var(--text-muted);
  &.live { background:#4ade80; animation:pulse 2s ease-in-out infinite }
}
@keyframes pulse {
  0%,100% { box-shadow:0 0 0 0 rgba(74,222,128,.4) }
  50% { box-shadow:0 0 0 8px rgba(74,222,128,0) }
}

.toast {
  position:fixed; top:64px; left:50%; transform:translateX(-50%);
  padding:10px 24px; border-radius:100px; font-size:13px; font-weight:600;
  z-index:50; white-space:nowrap; box-shadow:0 8px 32px rgba(0,0,0,.5);
}
.slide-enter-active { animation: scaleIn .35s var(--spring) }
.slide-leave-active { animation: scaleIn .3s var(--spring) reverse }

.content {
  flex:1; padding:0 16px 80px; position:relative; z-index:1;
  @media (min-width:768px) { padding:0 24px 24px; max-width:1400px; margin:0 auto; width:100% }
}

/* 底部导航 */
.bottom-nav {
  display:flex; justify-content:space-around;
  position:fixed; bottom:0; left:0; right:0; z-index:20;
  background:rgba(8,8,15,.85);
  backdrop-filter:blur(20px);
  border-top:1px solid var(--border-subtle);
  padding:6px 0 env(safe-area-inset-bottom,8px);

  @media (min-width:768px) { display:none }
}

.bn-item {
  display:flex; flex-direction:column; align-items:center; gap:2px;
  text-decoration:none; padding:6px 14px; border-radius:12px;
  transition:all .2s;
  .bn-icon { font-size:20px; line-height:1 }
  .bn-label { font-size:10px; color:var(--text-muted); font-weight:500 }
  &.on .bn-label { color:var(--text-primary); font-weight:600 }
  &:active { transform:scale(.92) }
}
</style>
