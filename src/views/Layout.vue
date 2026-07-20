<template>
  <div class="app-layout">
    <!-- 侧边栏 — RuoYi 风格 -->
    <aside class="sidebar" :class="{ collapsed: isCollapse }">
      <div class="logo">
        <el-icon :size="28"><Money /></el-icon>
        <span v-show="!isCollapse" class="logo-text">汇率监控</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        background-color="#1d1e2c"
        text-color="#a6adc8"
        active-text-color="#fff"
        router
      >
        <el-menu-item index="/exchange-rate">
          <el-icon><Coin /></el-icon>
          <template #title>实时汇率</template>
        </el-menu-item>
      </el-menu>
    </aside>

    <!-- 主体 -->
    <div class="main-area">
      <!-- 顶栏 -->
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
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>实时汇率</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="navbar-right">
          <span class="update-time" v-if="lastUpdate">
            <el-icon><Timer /></el-icon>
            {{ lastUpdate }}
          </span>
        </div>
      </header>

      <!-- 内容 -->
      <main class="content">
        <router-view @update-time="onUpdateTime" />
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

const activeMenu = computed(() => route.path)

function onUpdateTime(time) {
  lastUpdate.value = time
}
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
  background: #1d1e2c;
  transition: width 0.3s, min-width 0.3s;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &.collapsed {
    width: 64px;
    min-width: 64px;
  }

  .logo {
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: #fff;
    font-size: 18px;
    font-weight: 700;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    letter-spacing: 1px;

    .logo-text {
      white-space: nowrap;
    }
  }

  :deep(.el-menu) {
    border-right: none;
    user-select: none;
  }

  :deep(.el-menu-item) {
    &:hover {
      background: rgba(255, 255, 255, 0.05) !important;
    }
    &.is-active {
      background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
      border-radius: 6px;
      margin: 4px 8px;
      width: auto;
    }
  }
}

/* === 主体 === */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f5f7fa;
}

/* === 顶栏 === */
.navbar {
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);

  .navbar-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .collapse-btn {
    cursor: pointer;
    color: #606266;
    &:hover {
      color: #3b82f6;
    }
  }

  .navbar-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .update-time {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: #909399;
  }
}

/* === 内容区 === */
.content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}
</style>
