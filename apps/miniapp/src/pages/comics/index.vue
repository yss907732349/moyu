<script setup lang="ts">
import { useVisualModePage } from "../../services/visual-mode";
import { resolveSemanticIconClass } from "../../visual-system/illustration-registry";

const { visualModeClass } = useVisualModePage();
</script>

<template>
  <view :class="['vs-page', 'vs-stack', visualModeClass]">
    <!-- 顶部标题 -->
    <view class="header">
      <text class="title-label">隐者 IP 连载</text>
      <text class="vs-title main-title">隐者漫画</text>
    </view>

    <view class="vs-panel vs-panel-gold info-panel">
      <view class="lock-icon vs-illustration-fallback vs-fallback-empty vs-breathe">
        <view :class="['vs-semantic-icon', resolveSemanticIconClass('px-icon-state-empty')]" />
      </view>
      <view class="info-copy">
        <text class="info-title">漫画模块封印中</text>
        <text class="vs-subtitle description-text">
          漫画章节解锁和《隐者大陆》世界观内容连载将在后续的修行 change 中逐步解封。
        </text>
        <view class="vs-chip progress-tag">探索度: 0%</view>
      </view>
    </view>
  </view>
</template>

<style>
.header {
  padding-bottom: 4rpx;
}

.title-label {
  font-size: 20rpx;
  color: var(--camp-gold, #9a6a16);
  letter-spacing: 2rpx;
  font-weight: 700;
}

.main-title {
  margin-top: 4rpx;
  letter-spacing: 4rpx;
  font-size: 40rpx;
  color: var(--camp-text-strong);
  font-weight: 900;
}

.info-panel {
  display: flex;
  gap: 24rpx;
  align-items: center;
}

.lock-icon {
  width: 112rpx;
  height: 112rpx;
  border-radius: 12rpx;
  flex-shrink: 0;
}

.info-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 12rpx;
}

.info-title {
  color: var(--camp-text-strong);
  font-size: 30rpx;
  font-weight: 900;
}

.description-text {
  font-size: 22rpx;
}
.progress-tag {
  align-self: flex-start;
}
</style>
