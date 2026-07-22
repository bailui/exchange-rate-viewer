<template>
  <div class="app-frame">
    <Transition name="fade">
      <button v-if="menuOpen" class="sidebar-backdrop" aria-label="关闭导航" @click="menuOpen = false" />
    </Transition>

    <aside class="sidebar" :class="{ 'is-open': menuOpen }">
      <div class="brand-block">
        <div class="brand-mark" aria-hidden="true">🦌</div>
        <div class="min-w-0">
          <div class="brand-name">白鹿io</div>
          <div class="brand-subtitle">汇率转换</div>
        </div>
      </div>

      <div class="sidebar-caption">功能</div>
      <nav class="nav-list" aria-label="主导航">
        <RouterLink v-for="item in navItems" :key="item.path" :to="item.path"
          class="nav-link" :class="{ 'is-active': isActive(item.path) }" @click="menuOpen = false">
          <span class="nav-icon"><component :is="item.icon" /></span>
          <span class="flex-1">{{ item.label }}</span>
          <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar-bottom">
        <div class="source-card">
          <div class="source-card-head">
            <span class="status-dot" />
            <strong>数据服务正常</strong>
          </div>
          <p>每 30 秒检查最新公开汇率</p>
        </div>
        <p class="sidebar-footnote">数据仅供参考，不构成交易建议</p>
      </div>
    </aside>

    <div class="app-content">
      <header class="topbar">
        <div class="topbar-left">
          <button class="mobile-menu-button" :aria-label="menuOpen ? '关闭导航' : '打开导航'" @click="menuOpen = !menuOpen">
            <Close v-if="menuOpen" />
            <Menu v-else />
          </button>
          <div>
            <div class="topbar-title">{{ currentNav.label }}</div>
            <div class="topbar-description">{{ currentNav.description }}</div>
          </div>
        </div>

        <div class="topbar-actions">
          <span class="status-pill desktop-status">
            <span class="status-dot" />
            {{ hasData ? `更新于 ${updatedLabel}` : '正在连接数据源' }}
          </span>
          <button class="icon-button" aria-label="刷新汇率" title="刷新汇率" :disabled="refreshing" @click="refreshAll">
            <Refresh :class="{ 'is-spinning': refreshing }" />
          </button>
        </div>
      </header>

      <Transition name="toast">
        <div v-if="toast" class="global-toast" role="status">
          <CircleCheck v-if="toastType === 'success'" />
          <Warning v-else />
          {{ toast }}
        </div>
      </Transition>

      <main class="main-scroll">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  Bell, CircleCheck, Close, DataLine, Menu, Refresh, Switch,
  TrendCharts, Warning,
} from '@element-plus/icons-vue'
import { useExchangeRates } from '../composables/useExchangeRates.js'

const route = useRoute()
const menuOpen = ref(false)
const toast = ref('')
const toastType = ref('success')
let toastTimer

const { hasData, updatedLabel, refreshing, refresh } = useExchangeRates()
const navItems = [
  { path: '/exchange-rate', label: '实时汇率', description: '全球主要货币实时参考价', icon: DataLine },
  { path: '/calculator', label: '汇率换算', description: '快速完成任意货币换算', icon: Switch },
  { path: '/trends', label: '走势分析', description: '查看历史区间走势与变化', icon: TrendCharts, badge: '趋势' },
  { path: '/alerts', label: '汇率提醒', description: '设置并跟踪目标汇率', icon: Bell },
]
const currentNav = computed(() => navItems.find((item) => isActive(item.path)) || navItems[0])

function isActive(path) {
  return path === '/exchange-rate'
    ? route.path === '/' || route.path === '/exchange-rate'
    : route.path.startsWith(path)
}
function showToast(message, type = 'success') {
  toast.value = message
  toastType.value = type
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 2600)
}
async function refreshAll() {
  try {
    await refresh({ force: true })
    showToast('汇率数据已更新')
  } catch {
    showToast('暂时无法更新，已保留上次数据', 'error')
  }
}

onMounted(() => refresh().catch(() => {}))
onUnmounted(() => clearTimeout(toastTimer))
</script>

<style scoped>
.app-frame { display: flex; width: 100%; height: 100dvh; overflow: hidden; }
.sidebar { width: var(--sidebar-width); min-width: var(--sidebar-width); height: 100dvh; display: flex; flex-direction: column; border-right: 1px solid var(--color-border); background: rgba(255,255,255,.96); z-index: 30; }
.brand-block { display: flex; align-items: center; gap: 11px; padding: 22px 18px 20px; }
.brand-mark { display: grid; place-items: center; width: 42px; height: 42px; flex: 0 0 auto; border: 1px solid #F3D5E0; border-radius: 13px; background: var(--color-primary-light); font-size: 21px; box-shadow: 0 8px 20px rgba(232,93,142,.10); }
.brand-name { color: var(--color-text); font-size: 16px; font-weight: 820; line-height: 1.2; letter-spacing: -.02em; }
.brand-subtitle { margin-top: 3px; color: var(--color-text-muted); font-size: 11px; }
.sidebar-caption { padding: 0 18px 8px; color: var(--color-text-muted); font-size: 10px; font-weight: 800; letter-spacing: .12em; }
.nav-list { display: flex; flex-direction: column; gap: 4px; padding: 0 11px; }
.nav-link { position: relative; display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 0 11px; border-radius: 12px; color: var(--color-text-soft); font-size: 13px; font-weight: 650; text-decoration: none; transition: background .18s, color .18s, transform .18s; }
.nav-link:hover { background: #FBF4F7; color: var(--color-text); }
.nav-link.is-active { background: var(--color-primary-light); color: var(--color-primary); font-weight: 760; }
.nav-link.is-active::before { content: ''; position: absolute; left: -11px; width: 3px; height: 24px; border-radius: 0 99px 99px 0; background: var(--color-primary); }
.nav-icon { display: grid; place-items: center; width: 22px; height: 22px; }
.nav-icon :deep(svg) { width: 17px; height: 17px; }
.nav-badge { padding: 3px 7px; border-radius: 999px; background: white; color: var(--color-primary); font-size: 9px; font-weight: 800; }
.sidebar-bottom { margin-top: auto; padding: 14px 12px 16px; }
.source-card { padding: 13px; border: 1px solid var(--color-border); border-radius: 13px; background: #FFFBFC; }
.source-card-head { display: flex; align-items: center; gap: 8px; color: var(--color-text); font-size: 11px; }
.source-card p { margin: 7px 0 0; color: var(--color-text-muted); font-size: 10px; line-height: 1.5; }
.sidebar-footnote { margin: 10px 4px 0; color: var(--color-text-muted); font-size: 9px; text-align: center; }
.app-content { flex: 1; min-width: 0; height: 100dvh; display: flex; flex-direction: column; overflow: hidden; }
.topbar { height: 64px; flex: 0 0 64px; display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 0 24px; border-bottom: 1px solid var(--color-border); background: rgba(255,255,255,.88); backdrop-filter: blur(14px); z-index: 10; }
.topbar-left, .topbar-actions { display: flex; align-items: center; gap: 10px; min-width: 0; }
.topbar-title { color: var(--color-text); font-size: 14px; font-weight: 780; }
.topbar-description { margin-top: 2px; color: var(--color-text-muted); font-size: 10px; }
.mobile-menu-button { display: none; width: 38px; height: 38px; place-items: center; border: 1px solid var(--color-border); border-radius: 11px; background: white; color: var(--color-text-soft); }
.mobile-menu-button svg { width: 18px; }
.main-scroll { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: 28px clamp(18px, 3vw, 38px) 44px; }
.global-toast { position: fixed; top: 76px; left: calc(50% + var(--sidebar-width)/2); transform: translateX(-50%); z-index: 80; display: flex; align-items: center; gap: 8px; max-width: calc(100vw - 32px); padding: 10px 14px; border: 1px solid var(--color-border); border-radius: 12px; background: white; box-shadow: var(--shadow-floating); color: var(--color-text); font-size: 12px; font-weight: 700; }
.global-toast svg { width: 16px; color: var(--color-success); }
.sidebar-backdrop { display: none; }
.fade-enter-active, .fade-leave-active { transition: opacity .2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 768px) {
  .sidebar { position: fixed; inset: 0 auto 0 0; transform: translateX(-102%); transition: transform .24s ease; box-shadow: var(--shadow-floating); }
  .sidebar.is-open { transform: translateX(0); }
  .sidebar-backdrop { display: block; position: fixed; inset: 0; z-index: 20; border: 0; background: rgba(43,31,38,.24); backdrop-filter: blur(2px); }
  .mobile-menu-button { display: grid; }
  .topbar { height: 60px; flex-basis: 60px; padding: 0 14px; }
  .desktop-status, .topbar-description { display: none; }
  .main-scroll { padding: 20px 14px 34px; }
  .global-toast { left: 50%; top: 70px; }
}
</style>
