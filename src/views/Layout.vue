<template>
  <div class="app-root">
    <div class="mobile-mask" v-if="menuOpen" @click="menuOpen=false"></div>

    <!-- 侧边栏 — DNSHE 风格 -->
    <aside class="sidebar" :class="{ open: menuOpen }">
      <div class="sb-logo">
        <span class="sb-logo-icon">🦌</span>
        <span class="sb-logo-text">白鹿io</span>
      </div>

      <nav class="sb-nav">
        <router-link v-for="item in navs" :key="item.path" :to="item.path"
          class="sb-item" :class="{ on: isOn(item.path) }" @click="menuOpen=false">
          <span class="sb-icon">{{ item.icon }}</span>
          <span class="sb-label">{{ item.label }}</span>
          <span v-if="item.badge" class="sb-badge">{{ item.badge }}</span>
        </router-link>
      </nav>

      <div class="sb-bottom">
        <button class="theme-btn" @click="toggleTheme" :title="isDark?'浅色模式':'深色模式'">
          {{ isDark ? '☀️' : '🌙' }}
        </button>
        <span class="sb-version">v1.0</span>
      </div>
    </aside>

    <!-- 主体 -->
    <div class="main">
      <header class="topbar">
        <div class="tb-left">
          <button class="menu-btn" @click="menuOpen=!menuOpen">☰</button>
          <span class="tb-title">{{ pageTitle }}</span>
        </div>
        <div class="tb-right">
          <span class="refresh-badge" v-if="justUpdated" @click="justUpdated=false">✅ 已刷新</span>
          <span class="live-dot" :class="{ live }"></span>
        </div>
      </header>

      <Transition name="toast">
        <div v-if="toast" class="toast">{{ toast }}</div>
      </Transition>

      <main class="content">
        <router-view @update-time="onTime" @refresh-start="live=true" @refresh-end="onEnd" />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTheme } from '../composables/useTheme.js'

const { isDark, toggle: toggleTheme } = useTheme()
const route = useRoute()
const menuOpen = ref(false), live = ref(false), justUpdated = ref(false), toast = ref('')

const navs = [
  { path:'/exchange-rate', icon:'📊', label:'实时汇率' },
  { path:'/calculator', icon:'🧮', label:'汇率计算' },
  { path:'/trends', icon:'📈', label:'走势分析', badge:'HOT' },
  { path:'/alerts', icon:'🔔', label:'汇率提醒' },
]

const pageTitle = computed(() => navs.find(n => isOn(n.path))?.label || '白鹿io汇率转换')

function isOn(path) {
  if (path==='/exchange-rate') return route.path==='/'||route.path==='/exchange-rate'
  return route.path===path
}
function onTime(){}
function onEnd(){ live.value=false; justUpdated.value=true; toast.value='✨ 汇率已更新'
  setTimeout(()=>{ justUpdated.value=false; toast.value='' },3000) }
</script>

<style lang="scss" scoped>
.app-root { display:flex; height:100vh; overflow:hidden }

.mobile-mask {
  display:none;
  @media(max-width:768px){ display:block; position:fixed; inset:0; background:rgba(0,0,0,.3); z-index:9 }
}

/* 侧边栏 */
.sidebar {
  width:200px; min-width:200px;
  background:var(--sidebar-bg);
  display:flex; flex-direction:column;
  z-index:10; user-select:none;
  transition:transform .3s;

  @media(max-width:768px){ position:fixed; left:0; top:0; bottom:0; transform:translateX(-100%); &.open{ transform:translateX(0) } }
}

.sb-logo {
  display:flex; align-items:center; gap:8px;
  padding:16px 20px;
  .sb-logo-icon { font-size:24px; line-height:1 }
  .sb-logo-text { font-size:16px; font-weight:700; color:#fff; letter-spacing:.03em }
}

.sb-nav { flex:1; padding:0 8px; display:flex; flex-direction:column; gap:2px }

.sb-item {
  display:flex; align-items:center; gap:10px;
  padding:10px 12px; border-radius:8px;
  color:var(--sidebar-text); text-decoration:none;
  font-size:13px; font-weight:500; position:relative;
  transition:all .15s;

  .sb-icon { font-size:16px; line-height:1; width:20px; text-align:center }
  .sb-label { flex:1 }

  &:hover { background:rgba(255,255,255,.06); color:#fff }
  &.on {
    background:var(--sidebar-active); color:#fff;
    &::before {
      content:''; position:absolute; left:0; top:50%; transform:translateY(-50%);
      width:3px; height:20px; border-radius:2px; background:var(--sidebar-highlight);
    }
  }
}

.sb-badge {
  font-size:10px; font-weight:700; color:#f59e0b;
  background:rgba(245,158,11,.15); padding:1px 6px; border-radius:4px;
  border:1px solid rgba(245,158,11,.3);
}

.sb-bottom {
  padding:12px 16px; display:flex; align-items:center; justify-content:space-between;
  border-top:1px solid rgba(255,255,255,.06);
}

.theme-btn {
  width:32px; height:32px; border-radius:6px;
  border:1px solid rgba(255,255,255,.1); background:transparent;
  cursor:pointer; font-size:15px; transition:all .2s;
  &:hover { background:rgba(255,255,255,.08) }
}

.sb-version { font-size:10px; color:rgba(255,255,255,.2); font-weight:500 }

/* 主体 */
.main { flex:1; display:flex; flex-direction:column; overflow:hidden; background:var(--bg) }

.topbar {
  height:48px; display:flex; align-items:center; justify-content:space-between;
  padding:0 20px; background:var(--header-bg); border-bottom:1px solid var(--header-border);
  z-index:5;

  .menu-btn {
    display:none; width:32px; height:32px; border-radius:6px;
    border:1px solid var(--border); background:var(--bg-card); cursor:pointer;
    font-size:14px; color:var(--text2);
    @media(max-width:768px){ display:flex; align-items:center; justify-content:center }
  }
  .tb-title { font-size:14px; font-weight:600; color:var(--text) }
  .tb-right { display:flex; align-items:center; gap:8px }
}

.refresh-badge {
  font-size:11px; font-weight:600; color:var(--accent);
  background:var(--accent-light); padding:3px 10px; border-radius:4px; cursor:pointer;
}
.live-dot {
  width:7px; height:7px; border-radius:50%; background:var(--text3);
  &.live { background:var(--green); animation:pulse 2s ease-in-out infinite }
}
@keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.4)} 50%{box-shadow:0 0 0 6px rgba(34,197,94,0)} }

.toast {
  position:fixed; top:58px; left:50%; transform:translateX(-50%);
  padding:8px 20px; border-radius:6px; background:var(--bg-card);
  box-shadow:var(--shadow-md); font-size:13px; font-weight:500;
  color:var(--accent); z-index:50; border:1px solid var(--border);
}
.toast-enter-active { animation:fadeUp .3s var(--ease) }
.toast-leave-active { animation:fadeUp .2s var(--ease) reverse }

.content {
  flex:1; overflow-y:auto; padding:20px;
  @media(min-width:769px){ padding:24px }
  /* 网格背景 */
  background-image:
    linear-gradient(rgba(0,0,0,.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,.02) 1px, transparent 1px);
  background-size:20px 20px;
}
.app-root.dark .content {
  background-image:
    linear-gradient(rgba(255,255,255,.015) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.015) 1px, transparent 1px);
}
</style>
