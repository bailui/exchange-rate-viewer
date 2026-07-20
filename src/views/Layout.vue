<template>
  <div class="flex h-screen overflow-hidden bg-[var(--color-bg-page)]">
    <!-- 移动遮罩 -->
    <div v-if="menuOpen" class="fixed inset-0 bg-black/20 z-20 md:hidden" @click="menuOpen=false"></div>

    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ 'sidebar-open': menuOpen }">
      <div class="p-5 pb-3">
        <div class="flex items-center gap-2.5 mb-1">
          <div class="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center text-lg flex-shrink-0">🦌</div>
          <div>
            <div class="text-[15px] font-extrabold text-[var(--color-text)] leading-none">白鹿io</div>
            <div class="text-[10px] text-[var(--color-text-muted)] leading-none mt-0.5">汇率工具</div>
          </div>
        </div>
      </div>

      <nav class="flex-1 px-3 overflow-y-auto">
        <router-link
          v-for="item in navs" :key="item.path" :to="item.path"
          class="nav-item" :class="{ 'nav-active': isOn(item.path) }"
          @click="menuOpen=false">
          <span class="text-base w-5 text-center flex-shrink-0">{{ item.icon }}</span>
          <span class="flex-1">{{ item.label }}</span>
          <span v-if="item.badge" class="text-[9px] font-bold bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full">{{ item.badge }}</span>
        </router-link>
      </nav>

      <div class="p-3 border-t border-[var(--color-border)]">
        <button @click="toggleTheme" class="w-9 h-9 rounded-xl border border-[var(--color-border)] bg-white flex items-center justify-center text-sm hover:bg-[var(--color-bg-soft)] transition-colors">
          {{ isDark ? '☀️' : '🌙' }}
        </button>
      </div>
    </aside>

    <!-- 主区域 -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <header class="h-12 flex items-center justify-between px-4 md:px-6 bg-white/80 backdrop-blur-lg border-b border-[var(--color-border)] flex-shrink-0">
        <div class="flex items-center gap-3">
          <button @click="menuOpen=!menuOpen" class="md:hidden w-8 h-8 rounded-lg border border-[var(--color-border)] bg-white flex items-center justify-center text-sm text-[var(--color-text-soft)]">
            <span v-if="!menuOpen">☰</span><span v-else>✕</span>
          </button>
          <span class="text-sm font-bold text-[var(--color-text)]">{{ pageTitle }}</span>
        </div>
        <div class="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <span v-if="justUpdated" class="text-primary bg-primary-light px-2.5 py-1 rounded-lg font-semibold text-[11px]">✅ 已刷新</span>
          <span class="w-1.5 h-1.5 rounded-full" :class="live ? 'bg-[var(--color-success)]' : 'bg-[var(--color-text-muted)]'"></span>
        </div>
      </header>

      <Transition name="toast">
        <div v-if="toast" class="toast-msg">{{ toast }}</div>
      </Transition>

      <main class="flex-1 overflow-y-auto p-4 md:p-7" :style="{ maxWidth:'1440px', margin:'0 auto', width:'100%' }">
        <router-view
          @update-time="onTime"
          @refresh-start="live=true"
          @refresh-end="onEnd" />
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
const menuOpen = ref(false)
const live = ref(false)
const justUpdated = ref(false)
const toast = ref('')
let toastTimer = null

const navs = [
  { path:'/exchange-rate', icon:'📊', label:'实时汇率' },
  { path:'/calculator', icon:'🧮', label:'汇率换算' },
  { path:'/trends', icon:'📈', label:'走势分析', badge:'HOT' },
  { path:'/alerts', icon:'🔔', label:'汇率提醒' },
]

const pageTitle = computed(() => navs.find(n => isOn(n.path))?.label || '白鹿io')

function isOn(path) {
  if (path === '/exchange-rate') return route.path === '/' || route.path === '/exchange-rate'
  return route.path === path
}

function onTime() {}
function onEnd() {
  live.value = false
  justUpdated.value = true
  toast.value = '✨ 汇率已刷新'
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { justUpdated.value = false; toast.value = '' }, 3000)
}
</script>

<style scoped>
.sidebar {
  width: 220px;
  min-width: 220px;
  background: white;
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  height: 100vh;
  flex-shrink: 0;
}
@media (max-width: 768px) {
  .sidebar {
    position: fixed; left: 0; top: 0; bottom: 0; z-index: 30;
    transform: translateX(-100%);
    transition: transform 0.25s cubic-bezier(.25,.1,.25,1);
    box-shadow: var(--shadow-card);
  }
  .sidebar-open { transform: translateX(0) }
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-soft);
  text-decoration: none;
  transition: all 0.15s;
  margin-bottom: 1px;
}
.nav-item:hover {
  background: var(--color-bg-soft);
  color: var(--color-text);
}
.nav-active {
  background: var(--color-primary-light) !important;
  color: var(--color-primary) !important;
  font-weight: 700 !important;
  box-shadow: inset 3px 0 0 var(--color-primary);
}

.toast-msg {
  position: fixed;
  top: 56px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
  box-shadow: var(--shadow-card);
}
</style>
