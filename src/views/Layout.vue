<template>
  <div class="flex h-screen overflow-hidden bg-[var(--color-bg)]">
    <!-- 侧边栏 -->
    <aside class="w-[200px] min-w-[200px] bg-white/80 backdrop-blur-xl border-r border-pink-100 flex flex-col max-md:fixed max-md:z-20 max-md:h-full max-md:shadow-xl max-md:transition-transform max-md:duration-300" :class="menuOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'">
      <div class="p-5 pb-4">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-pink-100 flex items-center justify-center text-lg">🦌</div>
          <div>
            <div class="text-sm font-bold text-[var(--color-text)] leading-tight">白鹿io</div>
            <div class="text-[10px] text-[var(--color-text-muted)] leading-tight">汇率转换</div>
          </div>
        </div>
      </div>

      <nav class="flex-1 px-3 space-y-0.5">
        <router-link v-for="item in navs" :key="item.path" :to="item.path"
          class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200"
          :class="isOn(item.path) ? 'bg-pink-100 text-pink-600 font-semibold' : 'text-[var(--color-text-soft)] hover:bg-pink-50 hover:text-pink-500'"
          @click="menuOpen=false">
          <span class="text-base">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
          <span v-if="item.badge" class="ml-auto text-[9px] font-bold bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">{{ item.badge }}</span>
        </router-link>
      </nav>

      <div class="p-4 border-t border-pink-100">
        <button @click="toggleTheme" class="w-9 h-9 rounded-xl border border-pink-200 bg-pink-50 flex items-center justify-center text-sm hover:bg-pink-100 transition-colors">
          {{ isDark ? '☀️' : '🌙' }}
        </button>
      </div>
    </aside>

    <!-- 主区域 -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <header class="h-12 flex items-center justify-between px-5 bg-white/70 backdrop-blur-lg border-b border-pink-100">
        <div class="flex items-center gap-3">
          <button @click="menuOpen=!menuOpen" class="md:hidden w-8 h-8 rounded-lg border border-pink-200 bg-white flex items-center justify-center text-sm text-[var(--color-text-soft)]">☰</button>
          <span class="text-sm font-bold text-[var(--color-text)]">{{ pageTitle }}</span>
        </div>
        <div class="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <span v-if="justUpdated" class="text-pink-500 bg-pink-50 px-2 py-1 rounded-lg font-medium">✅ 已刷新</span>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto p-5 md:p-7">
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
const route = useRoute(), menuOpen = ref(false), live = ref(false), justUpdated = ref(false)

const navs = [
  { path:'/exchange-rate', icon:'📊', label:'实时汇率' },
  { path:'/calculator', icon:'🧮', label:'汇率换算' },
  { path:'/trends', icon:'📈', label:'走势分析', badge:'HOT' },
  { path:'/alerts', icon:'🔔', label:'汇率提醒' },
]

const pageTitle = computed(() => navs.find(n => isOn(n.path))?.label || '白鹿io')

function isOn(path) {
  if (path==='/exchange-rate') return route.path==='/'||route.path==='/exchange-rate'
  return route.path===path
}
function onTime(){}
function onEnd(){ justUpdated.value=true; setTimeout(()=>justUpdated.value=false,3000) }
</script>
