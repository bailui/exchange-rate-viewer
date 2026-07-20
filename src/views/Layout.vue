<template>
  <div class="app-layout">
    <!-- 移动端遮罩 -->
    <div class="mobile-overlay" v-if="mobileOpen" @click="mobileOpen=false"></div>

    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ open: mobileOpen }">
      <div class="sidebar-logo">
        <span class="logo-icon">🦌</span>
        <span class="logo-text">鹿乐汇</span>
      </div>

      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems" :key="item.path"
          :to="item.path" class="nav-item"
          :class="{ active: isActive(item.path) }"
          @click="mobileOpen=false"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <span class="footer-emoji">🦌</span>
        <span class="footer-text">白鹿io · 鹿乐汇</span>
      </div>
    </aside>

    <!-- 主体 -->
    <div class="main-area">
      <!-- 顶栏 -->
      <header class="topbar">
        <div class="topbar-left">
          <button class="menu-btn" @click="mobileOpen=!mobileOpen">
            <span>☰</span>
          </button>
          <span class="topbar-title">{{ pageTitle }}</span>
        </div>
        <div class="topbar-right">
          <span class="update-badge" v-if="justUpdated" @click="justUpdated=false">
            ✅ 已刷新
          </span>
          <span class="live-dot" :class="{ live }"></span>
        </div>
      </header>

      <!-- Toast 通知 -->
      <Transition name="toast">
        <div v-if="toast" class="toast glass">
          {{ toast }}
        </div>
      </Transition>

      <main class="content">
        <router-view
          @update-time="onUpdateTime"
          @refresh-start="live=true"
          @refresh-end="onRefreshEnd"
        />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const mobileOpen = ref(false)
const live = ref(false)
const justUpdated = ref(false)
const toast = ref('')
const lastUpdate = ref('')

const navItems = [
  { path:'/exchange-rate', icon:'📊', label:'实时汇率' },
  { path:'/calculator', icon:'🧮', label:'汇率计算' },
  { path:'/trends', icon:'📈', label:'走势分析' },
  { path:'/alerts', icon:'🔔', label:'汇率提醒' },
]

const pageTitle = computed(() => {
  const t = navItems.find(n => isActive(n.path))
  return t?.label || '鹿乐汇'
})

function isActive(path) {
  if (path === '/exchange-rate') return route.path === '/' || route.path === '/exchange-rate'
  return route.path === path
}

function onUpdateTime(t) {
  lastUpdate.value = t
}

function onRefreshEnd() {
  live.value = false
  justUpdated.value = true
  toast.value = '✨ 汇率已更新'
  setTimeout(() => {
    justUpdated.value = false
    toast.value = ''
  }, 3000)
}
</script>

<style lang="scss" scoped>
.app-layout { display:flex; height:100vh; overflow:hidden }

/* === 移动遮罩 === */
.mobile-overlay {
  display: none;
  @media (max-width:768px) {
    display: block; position:fixed; inset:0; background:rgba(0,0,0,.3);
    z-index:9; backdrop-filter:blur(2px);
  }
}

/* === 侧边栏 === */
.sidebar {
  width:180px; min-width:180px;
  background: var(--bg-sidebar);
  display:flex; flex-direction:column;
  padding:0 6px; z-index:10;
  transition: transform .3s var(--ease);
  user-select:none;

  @media (max-width:768px) {
    position:fixed; left:0; top:0; bottom:0;
    transform:translateX(-100%);
    &.open { transform:translateX(0) }
  }
}

.sidebar-logo {
  height:52px; display:flex; align-items:center; justify-content:center;
  gap:6px; border-bottom:1px solid rgba(255,255,255,.06); margin-bottom:14px;
  .logo-icon { font-size:22px; line-height:1 }
  .logo-text { font-size:15px; font-weight:700; color:var(--text-inverse); letter-spacing:.04em; white-space:nowrap }
}

.sidebar-nav { flex:1; display:flex; flex-direction:column; gap:1px }

.nav-item {
  display:flex; align-items:center; gap:8px;
  padding:10px 14px; border-radius:var(--radius-sm);
  color:rgba(255,255,255,.55); text-decoration:none;
  font-size:13px; font-weight:500;
  transition:all .2s;
  .nav-icon { font-size:16px; line-height:1 }
  .nav-label { white-space:nowrap }
  &:hover { background:rgba(255,255,255,.06); color:#fff }
  &.active {
    background:linear-gradient(135deg, rgba(255,133,161,.3), rgba(255,107,138,.2));
    color:#fff; font-weight:600;
  }
}

.sidebar-footer {
  padding:14px 12px; text-align:center; border-top:1px solid rgba(255,255,255,.05);
  .footer-emoji { font-size:16px; display:block }
  .footer-text { font-size:10px; color:rgba(255,255,255,.25); margin-top:3px; display:block }
}

/* === 主体 === */
.main-area {
  flex:1; display:flex; flex-direction:column;
  overflow:hidden; background:var(--bg-main); position:relative;
}

/* === 顶栏 === */
.topbar {
  height:50px;
  background:rgba(255,245,248,.75);
  backdrop-filter:blur(16px) saturate(160%);
  border-bottom:1px solid var(--p-200);
  display:flex; align-items:center; justify-content:space-between;
  padding:0 16px; z-index:5;

  .topbar-left { display:flex; align-items:center; gap:10px }
  .topbar-title { font-size:15px; font-weight:700; color:var(--text-primary); letter-spacing:-.02em }
  .topbar-right { display:flex; align-items:center; gap:8px }
}

.menu-btn {
  display:none; width:32px; height:32px; border-radius:8px;
  border:1px solid var(--p-300); background:var(--bg-card);
  cursor:pointer; font-size:14px; color:var(--text-secondary);
  align-items:center; justify-content:center;
  transition:all .2s;
  &:hover { background:var(--p-100) }
  @media (max-width:768px) { display:flex }
}

.update-badge {
  font-size:11px; font-weight:600; color:var(--p-600);
  background:var(--p-100); padding:3px 10px; border-radius:100px;
  cursor:pointer; animation:slideDown .3s var(--spring);
  white-space:nowrap;
}

.live-dot {
  width:7px; height:7px; border-radius:50%;
  background:var(--text-muted); transition:background .3s;
  &.live { background:#30b469; animation:pulse 2s ease-in-out infinite }
}
@keyframes pulse {
  0%,100% { box-shadow:0 0 0 0 rgba(48,180,105,.4) }
  50% { box-shadow:0 0 0 6px rgba(48,180,105,0) }
}

/* === Toast === */
.toast {
  position:fixed; top:60px; left:50%; transform:translateX(-50%);
  padding:10px 24px; border-radius:100px; font-size:13px; font-weight:600;
  color:var(--p-600); z-index:50; white-space:nowrap;
  box-shadow:var(--shadow-md);
}
.toast-enter-active { animation:slideDown .3s var(--spring) }
.toast-leave-active { animation:slideDown .3s var(--spring) reverse }

/* === 内容 === */
.content {
  flex:1; overflow-y:auto; padding:16px; position:relative; z-index:1;
  @media (min-width:769px) { padding:20px 24px }
}
</style>
