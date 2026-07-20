<template>
  <div class="page">
    <div class="bg-deco deco-1"></div>
    <CurrencyConverter />
    <div class="tip-card glass anim-up" style="animation-delay:.3s">
      <h3>💡 使用技巧</h3>
      <ul>
        <li>上方计算器支持任意两种货币互兑</li>
        <li>点击「持有货币」或「兑换结果」旁的货币标签可快速切换</li>
        <li>点击 ⇄ 按钮可交换兑换方向</li>
        <li>汇率每小时自动更新，确保数据准确</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import CurrencyConverter from '../components/CurrencyConverter.vue'
</script>

<style lang="scss" scoped>
.page { max-width: 800px; margin: 0 auto; position: relative }
.bg-deco {
  position: absolute; border-radius: 50%; pointer-events: none; z-index: 0;
  top: -40px; right: -40px; width: 260px; height: 260px;
  background: radial-gradient(circle, rgba(255,92,138,.1) 0%, transparent 70%);
  animation: float 8s ease-in-out infinite;
}
@keyframes float {
  0%,100% { transform: translate(0,0) scale(1) }
  50% { transform: translate(10px,-10px) scale(1.04) }
}
.tip-card {
  border-radius: var(--radius-xl); padding: 24px;
  box-shadow: var(--glass-shadow); position: relative; z-index: 1; margin-top: 18px;
  h3 { font-size: 16px; font-weight: 700; margin-bottom: 12px }
  ul { padding-left: 20px; display: flex; flex-direction: column; gap: 8px }
  li { font-size: 14px; color: var(--text-secondary); line-height: 1.6 }
}
</style>
