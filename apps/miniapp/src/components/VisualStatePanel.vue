<script setup lang="ts">
import { computed } from "vue";
import {
  resolveIllustrationAsset,
  type IllustrationKey
} from "../visual-system/illustration-registry";
import { resolveVisualState, type MiniappVisualStateKey } from "../visual-system/visual-states";

const props = withDefaults(
  defineProps<{
    state: MiniappVisualStateKey;
    title?: string;
    description?: string;
    actionText?: string;
    actionDisabled?: boolean;
    hideAction?: boolean;
    compact?: boolean;
    framed?: boolean;
    assetKey?: IllustrationKey;
  }>(),
  {
    title: "",
    description: "",
    actionText: "",
    actionDisabled: false,
    hideAction: false,
    compact: false,
    framed: true,
    assetKey: undefined
  }
);

const emit = defineEmits<{
  action: [];
}>();

const stateConfig = computed(() => resolveVisualState(props.state));
const asset = computed(() =>
  resolveIllustrationAsset(props.assetKey ?? stateConfig.value.assetKey)
);
const resolvedTitle = computed(() => props.title || stateConfig.value.title);
const resolvedDescription = computed(() => props.description || stateConfig.value.description);
const resolvedActionText = computed(() =>
  props.hideAction ? "" : props.actionText || stateConfig.value.actionText || ""
);
const illustrationFallbackClass = computed(() =>
  asset.value.fallbackClass.startsWith("vs-fallback-")
    ? asset.value.fallbackClass
    : "vs-fallback-empty"
);
const hasSourceImage = computed(() => Boolean(asset.value.sourcePath));
const panelClasses = computed(() => [
  "visual-state-panel",
  `visual-state-${stateConfig.value.tone}`,
  props.compact ? "visual-state-compact" : "",
  props.framed ? "vs-panel" : "visual-state-inline"
]);
const illustrationClasses = computed(() => [
  "visual-state-illustration",
  hasSourceImage.value ? "visual-state-image-host" : "vs-illustration-fallback",
  hasSourceImage.value ? "" : illustrationFallbackClass.value
]);
</script>

<template>
  <view :class="panelClasses">
    <view :class="illustrationClasses">
      <image
        v-if="asset.sourcePath"
        class="visual-state-image"
        :src="asset.sourcePath"
        mode="aspectFit"
      />
      <view v-else :class="['vs-semantic-icon', stateConfig.iconClass]" />
    </view>
    <view class="visual-state-copy">
      <text class="visual-state-title">{{ resolvedTitle }}</text>
      <text class="visual-state-desc">{{ resolvedDescription }}</text>
      <button
        v-if="resolvedActionText"
        class="visual-state-action"
        :class="{ 'visual-state-action-disabled': actionDisabled }"
        :disabled="actionDisabled"
        @tap="emit('action')"
      >
        {{ resolvedActionText }}
      </button>
    </view>
  </view>
</template>

<style scoped>
.visual-state-panel {
  display: flex;
  align-items: center;
  gap: 18rpx;
  min-height: 204rpx;
  border-color: var(--camp-border) !important;
}

.visual-state-inline {
  padding: 0;
  background: transparent;
  box-shadow: none;
  border: 0;
}

.visual-state-compact {
  min-height: 112rpx;
  gap: 14rpx;
}

.visual-state-illustration {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 146rpx;
  height: 146rpx;
  flex-shrink: 0;
}

.visual-state-compact .visual-state-illustration {
  width: 96rpx;
  height: 96rpx;
}

.visual-state-image {
  width: 100%;
  height: 100%;
}

.visual-state-image-host {
  background: transparent;
  border: 0;
  box-shadow: none;
  overflow: visible;
}

.visual-state-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 8rpx;
}

.visual-state-title {
  color: var(--camp-text-strong);
  font-size: 26rpx;
  font-weight: 900;
  line-height: 1.25;
}

.visual-state-desc {
  color: var(--camp-text-muted);
  font-size: 22rpx;
  line-height: 1.45;
}

.visual-state-action {
  align-self: flex-start;
  min-width: 160rpx;
  min-height: 58rpx;
  margin: 4rpx 0 0;
  padding: 0 20rpx;
  border: 2rpx solid var(--vs-button-border);
  border-radius: 4rpx;
  background: var(--vs-button-bg);
  color: var(--vs-button-text);
  font-size: 22rpx;
  font-weight: 900;
  line-height: 58rpx;
  box-shadow:
    inset 0 -3rpx 0 rgba(0, 0, 0, 0.18),
    inset 0 2rpx 0 rgba(255, 255, 255, 0.2),
    4rpx 4rpx 0 var(--vs-button-shadow);
}

.visual-state-action::after {
  border: 0;
}

.visual-state-action-disabled {
  opacity: 0.62;
  box-shadow: 2rpx 2rpx 0 rgba(17, 24, 39, 0.18);
}

.visual-state-action:active {
  transform: translate(3rpx, 3rpx);
  box-shadow:
    inset 0 -2rpx 0 rgba(0, 0, 0, 0.16),
    1rpx 1rpx 0 var(--vs-button-shadow);
}

.visual-state-cyan {
  border-color: rgba(56, 189, 248, 0.22) !important;
}

.visual-state-violet {
  border-color: rgba(167, 139, 250, 0.22) !important;
}

.visual-state-gold {
  border-color: rgba(154, 106, 22, 0.26) !important;
}

.visual-state-green {
  border-color: rgba(16, 185, 129, 0.22) !important;
}

.visual-state-warning {
  border-color: rgba(154, 106, 22, 0.24) !important;
}

.visual-state-danger {
  border-color: rgba(239, 68, 68, 0.26) !important;
}
</style>
