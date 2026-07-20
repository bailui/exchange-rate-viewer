<template>
  <div class="rate-card" :style="{ '--rate-color': currency.color }">
    <div class="card-header">
      <span class="flag">{{ currency.flag }}</span>
      <div class="currency-info">
        <span class="currency-code">{{ currency.code }}</span>
        <span class="currency-name">{{ currency.name }}</span>
      </div>
    </div>

    <div class="card-body">
      <!-- Loading / Error states -->
      <div v-if="loading" class="card-loading">
        <el-icon class="is-loading" :size="24"><Loading /></el-icon>
      </div>
      <div v-else-if="error" class="card-error">
        <el-icon :size="18"><WarningFilled /></el-icon>
        <span>获取失败</span>
      </div>

      <!-- Normal state -->
      <template v-else-if="rate !== null">
        <div class="rate-value">
          <span v-if="currency.unit > 1" class="rate-unit">{{ currency.unit }}</span>
          <span class="rate-symbol">{{ currency.symbol }}</span>
          <span class="rate-number">{{ formattedRate }}</span>
          <span class="rate-label"> CNY</span>
        </div>
        <div class="rate-change" :class="changeClass">
          <el-icon :size="14">
            <CaretTop v-if="changePercent > 0" />
            <CaretBottom v-else-if="changePercent < 0" />
            <Minus v-else />
          </el-icon>
          <span>{{ changePercent >= 0 ? '+' : '' }}{{ changePercent }}%</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currency: { type: Object, required: true },
  rate: { type: Number, default: null },
  changePercent: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  error: { type: Boolean, default: false }
})

const formattedRate = computed(() => {
  if (props.rate === null) return '--'
  return props.rate.toFixed(4)
})

const changeClass = computed(() => {
  if (props.changePercent > 0) return 'up'
  if (props.changePercent < 0) return 'down'
  return 'flat'
})
</script>

<style lang="scss" scoped>
.rate-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid #ebeef5;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background: var(--rate-color);
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;

    .flag {
      font-size: 32px;
      line-height: 1;
    }

    .currency-info {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .currency-code {
        font-size: 18px;
        font-weight: 700;
        color: #303133;
        letter-spacing: 0.5px;
      }

      .currency-name {
        font-size: 13px;
        color: #909399;
      }
    }
  }

  .card-body {
    .card-loading {
      display: flex;
      justify-content: center;
      padding: 16px 0;
      color: #c0c4cc;
    }

    .card-error {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #f56c6c;
      font-size: 14px;
    }

    .rate-value {
      display: flex;
      align-items: baseline;
      gap: 2px;

      .rate-unit {
        font-size: 16px;
        color: #909399;
        font-weight: 500;
        margin-right: 2px;
      }

      .rate-symbol {
        font-size: 18px;
        color: #909399;
        font-weight: 500;
      }

      .rate-number {
        font-size: 32px;
        font-weight: 700;
        color: #303133;
        font-variant-numeric: tabular-nums;
        letter-spacing: -0.5px;
      }

      .rate-label {
        font-size: 14px;
        color: #909399;
        margin-left: 2px;
      }
    }

    .rate-change {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-top: 8px;
      font-size: 14px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 4px;

      &.up {
        color: #67c23a;
        background: rgba(103, 194, 58, 0.08);
      }

      &.down {
        color: #f56c6c;
        background: rgba(245, 108, 108, 0.08);
      }

      &.flat {
        color: #909399;
        background: rgba(144, 147, 153, 0.08);
      }
    }
  }
}
</style>
