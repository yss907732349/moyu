<script setup lang="ts">
import { computed } from "vue";
import { FeatureStatus, type PublicFeatureEntry } from "@moyuxia/shared";
import { resolveSemanticIconClass } from "../visual-system/illustration-registry";

const props = defineProps<{
  entry: PublicFeatureEntry;
}>();
const emit = defineEmits<{
  click: [];
}>();

const statusText = computed(() => {
  if (props.entry.status === FeatureStatus.Enabled) {
    return "开放";
  }

  if (props.entry.status === FeatureStatus.Locked) {
    return "未解锁";
  }

  if (props.entry.status === FeatureStatus.ComingSoon) {
    return "敬请期待";
  }

  return "维护中";
});

const actionText = computed(() => {
  if (props.entry.status === FeatureStatus.Enabled) {
    return "进入";
  }

  if (props.entry.status === FeatureStatus.Locked) {
    return "查看条件";
  }

  if (props.entry.status === FeatureStatus.ComingSoon) {
    return "先占位";
  }

  return "暂不可用";
});
const iconClass = computed(() => resolveSemanticIconClass(props.entry.icon));
</script>

<template>
  <view
    :class="[
      'feature-entry-card',
      'vs-panel',
      entry.status === FeatureStatus.Enabled
        ? 'vs-panel-interactive'
        : 'feature-entry-card-disabled',
      `feature-entry-card-${entry.status}`
    ]"
    @tap="emit('click')"
  >
    <view class="feature-entry-head vs-row-between">
      <view class="feature-entry-icon vs-illustration-fallback">
        <view :class="['vs-semantic-icon', iconClass]" />
      </view>
      <text class="feature-entry-badge">{{ statusText }}</text>
    </view>

    <text class="feature-entry-title">{{ entry.title }}</text>
    <text class="feature-entry-desc">{{ entry.description }}</text>
    <view class="feature-entry-action">
      <text>{{ actionText }}</text>
      <view class="feature-entry-action-icon" aria-hidden="true" />
    </view>
  </view>
</template>

<style scoped>
.feature-entry-card {
  display: flex;
  flex-direction: column;
  min-height: 230rpx;
  position: relative;
  justify-content: space-between;
}

.feature-entry-card-disabled {
  opacity: 0.72;
}

.feature-entry-head {
  margin-bottom: 4rpx;
}

.feature-entry-icon {
  width: 56rpx;
  height: 56rpx;
}

.feature-entry-badge {
  border-radius: 6rpx;
  color: #f8fffb;
  background: var(--camp-success);
  font-size: 16rpx;
  font-weight: 900;
  padding: 2rpx 10rpx;
}

.feature-entry-card-locked .feature-entry-badge {
  color: var(--vs-button-text);
  background: var(--camp-gold);
}

.feature-entry-card-coming_soon .feature-entry-badge {
  color: var(--camp-text-strong);
  background: var(--camp-primary);
}

.feature-entry-card-disabled .feature-entry-badge {
  color: var(--camp-text-strong);
  background: var(--camp-text-soft);
}

.feature-entry-title {
  color: var(--camp-success);
  font-size: 28rpx;
  font-weight: 900;
  margin-top: 4rpx;
}

.feature-entry-card-locked .feature-entry-title,
.feature-entry-card-disabled .feature-entry-title {
  color: var(--camp-gold);
}

.feature-entry-card-coming_soon .feature-entry-title {
  color: var(--camp-primary);
}

.feature-entry-desc {
  color: var(--camp-text-muted);
  font-size: 18rpx;
  line-height: 1.35;
  margin-top: 4rpx;
}

.feature-entry-action {
  display: inline-flex;
  align-items: center;
  gap: 6rpx;
  align-self: flex-start;
  padding: 4rpx 10rpx;
  border: 2rpx solid rgba(47, 125, 85, 0.32);
  border-radius: 4rpx;
  background: rgba(47, 125, 85, 0.08);
  --feature-entry-action-icon-color: var(--camp-success);
  color: var(--camp-success);
  font-family: var(--vs-font-display);
  font-size: 18rpx;
  font-weight: 900;
  line-height: 1.2;
  margin-top: 8rpx;
  box-shadow:
    inset 0 -2rpx 0 rgba(0, 0, 0, 0.16),
    2rpx 2rpx 0 rgba(17, 24, 39, 0.14);
}

.feature-entry-action-icon {
  width: 10rpx;
  height: 10rpx;
  flex-shrink: 0;
  border-top: 2rpx solid var(--feature-entry-action-icon-color, var(--camp-success));
  border-right: 2rpx solid var(--feature-entry-action-icon-color, var(--camp-success));
  transform: rotate(45deg);
}

.feature-entry-card-locked .feature-entry-action,
.feature-entry-card-disabled .feature-entry-action {
  border-color: rgba(154, 106, 22, 0.34);
  background: rgba(154, 106, 22, 0.08);
  --feature-entry-action-icon-color: var(--camp-gold);
  color: var(--camp-gold);
}

.feature-entry-card-coming_soon .feature-entry-action {
  border-color: rgba(47, 111, 115, 0.34);
  background: rgba(47, 111, 115, 0.08);
  --feature-entry-action-icon-color: var(--camp-primary);
  color: var(--camp-primary);
}
</style>
