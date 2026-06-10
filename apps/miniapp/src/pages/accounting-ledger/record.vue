<script setup lang="ts">
import { useVisualModePage } from "../../services/visual-mode";

const { visualModeClass } = useVisualModePage();
function openSurvivalLedger(): void {
  uni.redirectTo({ url: "/pages/accounting-ledger/index" });
}
</script>

<template>
  <view :class="['vs-page', 'vs-stack', visualModeClass]">
    <view class="vs-panel disabled-card">
      <text class="page-title">生存账本已接管</text>
      <text class="desc-text">
        第一版不再提供手动记一笔，外卖、下午续命和通勤消耗会由有效订单自动同步。
      </text>
      <button class="save-button" @tap="openSurvivalLedger">查看生存账本</button>
    </view>
  </view>
</template>

<style>
.disabled-card {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.page-title {
  color: var(--camp-text-strong);
  font-size: 32rpx;
  font-weight: 900;
}

.desc-text {
  color: #8b90b0;
  font-size: 24rpx;
  line-height: 1.6;
}

.save-button {
  min-height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid var(--vs-button-border);
  border-radius: 4rpx;
  line-height: 72rpx;
  color: var(--vs-button-text);
  background: var(--vs-button-bg);
  font-family: var(--vs-font-display);
  font-size: 24rpx;
  font-weight: 900;
  box-shadow:
    inset 0 -4rpx 0 rgba(0, 0, 0, 0.18),
    inset 0 3rpx 0 rgba(255, 255, 255, 0.22),
    5rpx 5rpx 0 rgba(17, 24, 39, 0.72);
}

.save-button::after {
  border: 0;
}

.save-button:active {
  transform: translate(4rpx, 4rpx);
  box-shadow:
    inset 0 -2rpx 0 rgba(0, 0, 0, 0.16),
    1rpx 1rpx 0 rgba(17, 24, 39, 0.58);
}
</style>
