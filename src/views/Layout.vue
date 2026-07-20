<template>
  <div class="app-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed: isCollapse }">
      <div class="sidebar-logo" @click="isCollapse = !isCollapse">
        <span class="logo-icon">💱</span>
        <span v-show="!isCollapse" class="logo-text">Currency</span>
      </div>

      <nav class="sidebar-nav">
        <router-link to="/exchange-rate" class="nav-item" :class="{ active: route.path === '/' || route.path === '/exchange-rate' }">
          <span class="nav-icon">📊</span>
          <span v-show="!isCollapse" class="nav-label">实时汇率</span>
        </router-link>

        <router-link to="/calculator" class="nav-item" :class="{ active: route.path === '/calculator' }">
          <span class="nav-icon">🧮</span>
          <span v-show="!isCollapse" class="nav-label">汇率计算</span>
        </router-link>

        <router-link to="/alerts" class="nav-item" :class="{ active: route.path === '/alerts' }">
          <span class="nav-icon">🔔</span>
          <span v-show="!isCollapse" class="nav-label">汇率提醒</span>
        </router-link>

        <router-link to="/trends" class="nav-item" :class="{ active: route.path === '/trends' }">
          <span class="nav-icon">📈</span>
          <span v-show="!isCollapse" class="nav-label">走势分析</span>
        </router-link>
      </nav>

      <div v-show="!isCollapse" class="sidebar-footer">
        <span class="footer-heart">🌸</span>
        <span class="footer-text">汇率小助手</span>
      </div>
    </aside>

    <!-- 主体 -->
    <div class="main-area">
      <header class="topbar">
        <div class="topbar-left">
          <span class="topbar-title">{{ pageTitle }}</span>
          <span class="topbar-subtitle" v-if="lastUpdate">· {{ lastUpdate }}</span>
        </div>
        <div class="topbar-right">
          <span class="live-dot" :class="{ live }"></span>
          <span class="live-text">{{ live ? '在线' : '' }}</span>
        </div>
      </header>

      <main class="content">
        <router-view
          @update-time="onUpdateTime"
          @refresh-start="live=true"
          @refresh-end="live=false"
        />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isCollapse = ref(false)
const lastUpdate = ref('')
const live = ref(false)

const pageTitle = computed(() => {
  const m = { '/': '实时汇率', '/exchange-rate': '实时汇率', '/calculator': '汇率计算', '/alerts': '汇率提醒', '/trends': '走势分析' }
  return m[route.path] || 'Currency'
})

function onUpdateTime(t) { lastUpdate.value = t }
</script>

<style lang="scss" scoped>
.app-layout { display: flex; height: 100vh; overflow: hidden }

.sidebar {
  width: 190px; min-width: 190px;
  background: var(--bg-sidebar);
  display: flex; flex-direction: column;
  padding: 0 8px;
  transition: width .3s, min-width .3s;
  user-select: none;

  &.collapsed { width: 56px; min-width: 56px }
}

.sidebar-logo {
  height: 52px; display: flex; align-items: center; justify-content: center;
  gap: 8px; cursor: pointer;
  border-bottom: 1px solid rgba(255,255,255,.06);
  margin-bottom: 16px;
  &:hover { opacity: .8 }
  .logo-icon { font-size: 20px; line-height: 1 }
  .logo-text { font-size: 14px; font-weight: 700; color: var(--text-inverse); letter-spacing: .03em; white-space: nowrap }
}

.sidebar-nav {
  flex: 1; display: flex; flex-direction: column; gap: 2px;
}

.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: var(--radius-sm);
  color: rgba(255,255,255,.6); text-decoration: none;
  font-size: 13px; font-weight: 500;
  transition: all .2s;
  .nav-icon { font-size: 16px; line-height: 1 }
  .nav-label { white-space: nowrap }

  &:hover { background: rgba(255,255,255,.06); color: #fff }

  &.active {
    background: linear-gradient(135deg, var(--p-600), var(--p-700));
    color: #fff;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(255,92,138,.3);
  }
}

.sidebar-footer {
  padding: 16px 12px; text-align: center;
  border-top: 1px solid rgba(255,255,255,.06);
  .footer-heart { font-size: 16px; display: block }
  .footer-text { font-size: 11px; color: rgba(255,255,255,.3); margin-top: 4px; display: block }
}

.main-area {
  flex: 1; display: flex; flex-direction: column;
  overflow: hidden; background: var(--bg-primary);
  position: relative;
}

.topbar {
  height: 52px;
  background: rgba(253,242,245,.8);
  backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid var(--p-100);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px;

  .topbar-title { font-size: 15px; font-weight: 700; color: var(--text-primary); letter-spacing: -.02em }
  .topbar-subtitle { font-size: 12px; color: var(--text-tertiary); font-weight: 500 }
  .topbar-right { display: flex; align-items: center; gap: 6px }
}

.live-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--text-tertiary); transition: background .3s;
  &.live { background: #30b469; animation: pulse-dot 2s ease-in-out infinite }
}
.live-text { font-size: 11px; color: var(--text-tertiary); font-weight: 500 }

@keyframes pulse-dot {
  0%,100% { box-shadow: 0 0 0 0 rgba(48,180,105,.4) }
  50% { box-shadow: 0 0 0 6px rgba(48,180,105,0) }
}

.content {
  flex: 1; overflow-y: auto; padding: 20px 24px;
  position: relative; z-index: 1;
}
</style>
