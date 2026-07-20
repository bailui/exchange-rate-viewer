<template>
  <div class="app-layout">
    <!-- 侧边栏 — Apple 风格 -->
    <aside class="sidebar" :class="{ collapsed: isCollapse }">
      <div class="sidebar-logo" @click="isCollapse = !isCollapse">
        <span class="logo-icon">💱</span>
        <span v-show="!isCollapse" class="logo-text">Currency</span>
      </div>

      <nav class="sidebar-nav">
        <router-link to="/exchange-rate" class="nav-item" :class="{ active: isActive }">
          <span class="nav-icon">📊</span>
          <span v-show="!isCollapse" class="nav-label">实时汇率</span>
        </router-link>
      </nav>

      <div v-show="!isCollapse" class="sidebar-footer">
        <span class="footer-dot"></span>
      </div>
    </aside>

    <!-- 主体 -->
    <div class="main-area">
      <header class="topbar">
        <div class="topbar-left">
          <span class="topbar-title">实时汇率</span>
          <span class="topbar-subtitle" v-if="lastUpdate">更新于 {{ lastUpdate }}</span>
        </div>
        <div class="topbar-right">
          <span class="live-dot" :class="{ live: live }"></span>
          <span class="live-text">{{ live ? '实时' : '等待' }}</span>
        </div>
      </header>

      <main class="content">
        <div class="bg-blob blob-1"></div>
        <div class="bg-blob blob-2"></div>
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

const isActive = computed(() => route.path.startsWith('/exchange-rate'))

function onUpdateTime(t) { lastUpdate.value = t }
</script>

<style lang="scss" scoped>
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* === 侧边栏 === */
.sidebar {
  width: 200px;
  min-width: 200px;
  background: var(--bg-sidebar);
  display: flex;
  flex-direction: column;
  padding: 0 8px;
  transition: width .3s var(--ease-out), min-width .3s var(--ease-out);
  user-select: none;
  -webkit-user-select: none;

  &.collapsed {
    width: 60px;
    min-width: 60px;
  }
}

.sidebar-logo {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255,255,255,.08);
  margin-bottom: 12px;
  transition: opacity .2s;

  &:hover { opacity: .8 }

  .logo-icon { font-size: 22px; line-height: 1 }
  .logo-text {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-inverse);
    letter-spacing: .02em;
    white-space: nowrap;
  }
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  color: rgba(255,255,255,.7);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all var(--transition-fast);

  .nav-icon { font-size: 18px; line-height: 1 }
  .nav-label { white-space: nowrap }

  &:hover {
    background: rgba(255,255,255,.08);
    color: #fff;
  }

  &.active {
    background: rgba(255,255,255,.12);
    color: #fff;
  }
}

.sidebar-footer {
  padding: 16px;
  text-align: center;

  .footer-dot {
    display: inline-block;
    width: 6px; height: 6px;
    border-radius: 50%;
    background: rgba(255,255,255,.2);
  }
}

/* === 主体 === */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-primary);
  position: relative;
}

/* === 顶栏 === */
.topbar {
  height: 52px;
  background: rgba(242,242,247,.8);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid rgba(0,0,0,.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;

  .topbar-left {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }

  .topbar-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -.02em;
  }

  .topbar-subtitle {
    font-size: 12px;
    color: var(--text-tertiary);
    font-weight: 500;
  }

  .topbar-right {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .live-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: var(--text-tertiary);
    transition: background .3s;

    &.live { background: var(--color-green); animation: pulse-dot 2s ease-in-out infinite }
  }

  .live-text {
    font-size: 12px;
    color: var(--text-tertiary);
    font-weight: 500;
  }
}

@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 0 rgba(48,209,88,.4) }
  50% { box-shadow: 0 0 0 6px rgba(48,209,88,0) }
}

/* === 内容 === */
.content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  position: relative;
  z-index: 1;
}

/* === 背景装饰球 === */
.bg-blob {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}
.blob-1 {
  top: -120px;
  right: -80px;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(0,122,255,.07) 0%, transparent 70%);
}
.blob-2 {
  bottom: -60px;
  left: -60px;
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, rgba(175,82,222,.05) 0%, transparent 70%);
}
</style>
