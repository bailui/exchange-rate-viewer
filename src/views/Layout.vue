<template>
  <div class="app-layout">
    <!-- 侧边栏 — 粉色可爱风 -->
    <aside class="sidebar" :class="{ collapsed: isCollapse }">
      <div class="logo">
        <span class="logo-emoji">💱</span>
        <span v-show="!isCollapse" class="logo-text">汇率小助手</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        background-color="#2d1b2e"
        text-color="#d4a8cf"
        active-text-color="#fff"
        router
      >
        <el-menu-item index="/exchange-rate">
          <el-icon><Coin /></el-icon>
          <template #title>实时汇率</template>
        </el-menu-item>
      </el-menu>
      <!-- 底部可爱装饰 -->
      <div v-show="!isCollapse" class="sidebar-footer">
        <span class="footer-deco">🌸</span>
        <span class="footer-text">每日好心情~</span>
      </div>
    </aside>

    <!-- 主体 -->
    <div class="main-area">
      <header class="navbar">
        <div class="navbar-left">
          <el-icon
            class="collapse-btn"
            :size="20"
            @click="isCollapse = !isCollapse"
          >
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="💕">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>实时汇率</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="navbar-right">
          <span class="update-time" v-if="lastUpdate">
            <span class="pulse-dot" :class="{ pulsing }"></span>
            {{ lastUpdate }}
          </span>
        </div>
      </header>

      <main class="content">
        <router-view @update-time="onUpdateTime" @refresh-start="onRefreshStart" @refresh-end="onRefreshEnd" />
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
const pulsing = ref(false)

const activeMenu = computed(() => route.path)

function onUpdateTime(time) {
  lastUpdate.value = time
}

function onRefreshStart() { pulsing.value = true }
function onRefreshEnd() { pulsing.value = false }
</script>

<style lang="scss" scoped>
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* === 侧边栏 === */
.sidebar {
  width: 220px;
  min-width: 220px;
  background: var(--pink-dark);
  transition: width 0.3s, min-width 0.3s;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &.collapsed {
    width: 64px;
    min-width: 64px;
  }

  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: #fff;
    font-size: 18px;
    font-weight: 700;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    letter-spacing: 1px;

    .logo-emoji { font-size: 24px; line-height: 1; }
    .logo-text { white-space: nowrap; }
  }

  :deep(.el-menu) {
    border-right: none;
    user-select: none;
    flex: 1;

    .el-menu-item {
      border-radius: 12px;
      margin: 4px 10px;
      width: auto;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(255, 107, 157, 0.15) !important;
      }
      &.is-active {
        background: linear-gradient(135deg, #ff6b9d, #f472b6) !important;
      }
    }

    .el-sub-menu__title:hover {
      background: rgba(255, 107, 157, 0.1) !important;
    }
  }

  .sidebar-footer {
    padding: 16px;
    text-align: center;
    border-top: 1px solid rgba(255, 255, 255, 0.06);

    .footer-deco { font-size: 20px; display: block; }
    .footer-text {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.4);
      margin-top: 4px;
      display: block;
    }
  }
}

/* === 主体 === */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-main);
}

/* === 顶栏 === */
.navbar {
  height: 56px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--pink-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;

  .navbar-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .collapse-btn {
    cursor: pointer;
    color: var(--pink-500);
    &:hover { color: var(--pink-600); }
  }

  .navbar-right { display: flex; align-items: center; gap: 12px; }

  .update-time {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--text-secondary);
  }

  .pulse-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #67c23a;
    transition: transform 0.3s;
    &.pulsing { animation: pulse 0.6s ease-in-out; }
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.8); opacity: 0.4; }
}

/* === 内容 === */
.content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}
</style>
