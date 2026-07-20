<template>
  <div class="app-root">
    <div class="mobile-mask" v-if="menuOpen" @click="menuOpen=false"></div>

    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ open: menuOpen }">
      <div class="sb-logo">
        <span>🦌</span>
        <span>白鹿io</span>
      </div>
      <nav class="sb-nav">
        <router-link v-for="item in navs" :key="item.path" :to="item.path"
          class="sb-item" :class="{ on: isOn(item.path) }" @click="menuOpen=false">
          <span class="sb-icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
      <div class="sb-foot">
        <span>🌸 汇率小助手</span>
      </div>
    </aside>

    <!-- 主体 -->
    <div class="main">
      <header class="topbar">
        <button class="menu-btn" @click="menuOpen=!menuOpen">☰</button>
        <span class="tb-title">{{ pageTitle }}</span>
        <div class="tb-right">
          <span class="refresh-badge" v-if="justUpdated" @click="justUpdated=false">✅ 已刷新</span>
          <span class="live-dot" :class="{ live }"></span>
        </div>
      </header>

      <Transition name="toast">
        <div v-if="toast" class="toast">{{ toast }}</div>
      </Transition>

      <main class="content">
        <router-view
          @update-time="onTime"
          @refresh-start="live=true"
          @refresh-end="onEnd"
        />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const menuOpen = ref(false)
const live = ref(false)
const justUpdated = ref(false)
const toast = ref('')

const navs = [
  { path:'/exchange-rate', icon:'📊', label:'实时汇率' },
  { path:'/calculator', icon:'🧮', label:'汇率计算' },
  { path:'/trends', icon:'📈', label:'走势分析' },
  { path:'/alerts', icon:'🔔', label:'汇率提醒' },
]

const pageTitle = computed(() => navs.find(n => isOn(n.path))?.label || '白鹿io汇率转换')

function isOn(path) {
  if (path==='/exchange-rate') return route.path==='/'||route.path==='/exchange-rate'
  return route.path===path
}

function onTime() {}
function onEnd() {
  live.value = false
  justUpdated.value = true
  toast.value = '✨ 汇率已更新'
  setTimeout(()=>{ justUpdated.value=false; toast.value='' }, 3000)
}
</script>

<style lang="scss" scoped>
.app-root { display:flex; height:100vh; overflow:hidden }

.mobile-mask {
  display:none;
  @media(max-width:768px) {
    display:block; position:fixed; inset:0; background:rgba(0,0,0,.2);
    z-index:9; backdrop-filter:blur(2px);
  }
}

/* 侧边栏 */
.sidebar {
  width:180px; min-width:180px;
  background:var(--bg-sidebar);
  display:flex; flex-direction:column;
  padding:6px; z-index:10; transition:transform .3s;
  user-select:none;

  @media(max-width:768px) {
    position:fixed; left:0; top:0; bottom:0; transform:translateX(-100%);
    &.open { transform:translateX(0) }
  }
}

.sb-logo {
  display:flex; align-items:center; justify-content:center; gap:6px;
  height:48px; font-size:15px; font-weight:700; color:#fff;
  border-bottom:1px solid rgba(255,255,255,.06); margin-bottom:12px;
}

.sb-nav { flex:1; display:flex; flex-direction:column; gap:1px }

.sb-item {
  display:flex; align-items:center; gap:8px;
  padding:10px 12px; border-radius:10px;
  color:rgba(255,255,255,.5); text-decoration:none;
  font-size:13px; font-weight:500; transition:all .2s;
  .sb-icon { font-size:15px; line-height:1 }

  &:hover { background:rgba(255,255,255,.06); color:#fff }
  &.on {
    background:linear-gradient(135deg, rgba(255,107,138,.35), rgba(255,133,161,.25));
    color:#fff; font-weight:600;
  }
}

.sb-foot {
  text-align:center; padding:12px;
  border-top:1px solid rgba(255,255,255,.05);
  span { font-size:10px; color:rgba(255,255,255,.2) }
}

/* 主体 */
.main {
  flex:1; display:flex; flex-direction:column; overflow:hidden;
  background:var(--bg);
}

.topbar {
  height:48px; display:flex; align-items:center;
  justify-content:space-between; padding:0 16px;
  background:rgba(255,245,247,.8); backdrop-filter:blur(12px);
  border-bottom:1px solid var(--border); z-index:5;

  .menu-btn {
    display:none; width:32px; height:32px; border-radius:8px;
    border:1px solid var(--border); background:var(--bg-card);
    cursor:pointer; font-size:14px; color:var(--text2);
    @media(max-width:768px) { display:flex; align-items:center; justify-content:center }
  }
  .tb-title { font-size:15px; font-weight:700 }
  .tb-right { display:flex; align-items:center; gap:8px }
}

.refresh-badge {
  font-size:11px; font-weight:600; color:var(--pink);
  background:var(--pink-ll); padding:3px 10px; border-radius:100px;
  cursor:pointer; white-space:nowrap;
}
.live-dot {
  width:7px; height:7px; border-radius:50%; background:var(--text3);
  &.live { background:#30b469; animation:pulse 2s ease-in-out infinite }
}
@keyframes pulse {
  0%,100% { box-shadow:0 0 0 0 rgba(48,180,105,.4) }
  50% { box-shadow:0 0 0 6px rgba(48,180,105,0) }
}

.toast {
  position:fixed; top:58px; left:50%; transform:translateX(-50%);
  padding:10px 24px; border-radius:100px; background:var(--bg-card);
  box-shadow:var(--shadow); font-size:13px; font-weight:600;
  color:var(--pink); z-index:50;
}
.toast-enter-active { animation:popIn .35s var(--spring) }
.toast-leave-active { animation:popIn .3s var(--spring) reverse }

.content {
  flex:1; overflow-y:auto; padding:16px;
  @media(min-width:769px) { padding:20px 24px }
}
</style>
