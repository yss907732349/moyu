<script setup lang="ts">
import { useVisualModePage } from "../../services/visual-mode";
import { computed, ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import {
  DailyContentSectionKey,
  type DailyContentColumnEntry,
  type DailyContentPublicSummary
} from "@moyuxia/shared";
import { getAppAuthToken } from "../../services/auth";
import { getLocalUserProfileSnapshot } from "../../services/user-growth-profile";
import {
  createDailyContentReflectionQuoteSnapshot,
  getDailyContentSummary,
  isDailyContentIdentityError
} from "../../services/daily-content-feed";
import {
  ABSURD_CASEFILE_COVER_IMAGE,
  DAILY_COVER_IMAGE,
  WORLD_INTEL_COVER_IMAGE
} from "../../services/static-covers";

const { visualModeClass } = useVisualModePage();

const issue = ref<DailyContentPublicSummary | null>(null);
const loading = ref(false);
const feedback = ref("");

const publishedDateText = computed(() =>
  issue.value ? `${issue.value.businessDate} 发布` : "今日卷轴尚未公开"
);
const publishedColumns = computed(() =>
  (issue.value?.columns ?? []).filter(
    (column) => column.articleCount > 0 || column.sectionKey === DailyContentSectionKey.WorldIntel
  )
);
const hasPublishedReflection = computed(() =>
  Boolean(
    issue.value?.sections.some(
      (section) => section.sectionKey === DailyContentSectionKey.DailyReflection
    ) && issue.value.reflection.text.trim()
  )
);
const reflectionPromptText = computed(
  () => issue.value?.reflection.quotePrompt ?? "去社区写下今日摸鱼心得。"
);
const reflectionActionText = computed(() =>
  hasPublishedReflection.value ? "引用发帖" : "今日参悟暂不可引用"
);

onLoad(() => {
  void loadSummary();
});

onShow(() => {
  void loadSummary();
});

async function loadSummary(): Promise<void> {
  loading.value = true;
  feedback.value = "";

  try {
    issue.value = (await getDailyContentSummary()).issue;
    if (!issue.value) {
      feedback.value = "暂未发布，隐者日报尚未公开，稍后再来看看。";
    }
  } catch (error) {
    feedback.value = error instanceof Error ? error.message : "日报读取失败";
  } finally {
    loading.value = false;
  }
}

function openColumn(column: DailyContentColumnEntry): void {
  if (!issue.value) {
    return;
  }

  if (column.sectionKey === DailyContentSectionKey.WorldIntel) {
    uni.navigateTo({ url: "/pages/world-intel/list" });
    return;
  }

  uni.navigateTo({
    url: `/pages/daily-content/list?issueId=${encodeURIComponent(issue.value.id)}&sectionKey=${encodeURIComponent(column.sectionKey)}`
  });
}

function columnCoverImage(sectionKey: DailyContentColumnEntry["sectionKey"]): string {
  if (sectionKey === DailyContentSectionKey.WorldIntel) {
    return WORLD_INTEL_COVER_IMAGE;
  }

  if (sectionKey === DailyContentSectionKey.AbsurdCasefile) {
    return ABSURD_CASEFILE_COVER_IMAGE;
  }

  return DAILY_COVER_IMAGE;
}

function columnImageClass(sectionKey: DailyContentColumnEntry["sectionKey"]): string {
  return sectionKey === DailyContentSectionKey.WorldIntel ? "illustration-image-world-intel" : "";
}

function columnDescription(sectionKey: DailyContentColumnEntry["sectionKey"]): string {
  if (sectionKey === DailyContentSectionKey.WorldIntel) {
    return "隐者大陆今日动向，一眼看懂。";
  }

  if (sectionKey === DailyContentSectionKey.AbsurdCasefile) {
    return "怪事已归档，专治上班不清醒。";
  }

  return "今日卷轴已整理，挑重点读。";
}

async function quoteReflection(): Promise<void> {
  if (!issue.value || !ensureIdentity()) {
    return;
  }

  if (!hasPublishedReflection.value || !issue.value.reflection.id) {
    uni.showToast({ title: "今日参悟暂不可引用", icon: "none" });
    return;
  }

  try {
    const quote = await createDailyContentReflectionQuoteSnapshot(issue.value.id);
    uni.navigateTo({
      url: `/pages/community/post?dailyQuote=${encodeURIComponent(JSON.stringify(quote))}`
    });
  } catch (error) {
    if (isDailyContentIdentityError(error)) {
      redirectToProfile();
      return;
    }
    uni.showToast({ title: error instanceof Error ? error.message : "引用失败", icon: "none" });
  }
}

function ensureIdentity(): boolean {
  if (!getAppAuthToken() || !getLocalUserProfileSnapshot()) {
    redirectToProfile();
    return false;
  }

  return true;
}

function redirectToProfile(): void {
  uni.switchTab({ url: "/pages/profile/index" });
}
</script>

<template>
  <view :class="['vs-page', 'vs-stack', visualModeClass]">
    <view v-if="loading" class="vs-panel empty-panel">
      <text>日报卷轴展开中...</text>
    </view>

    <view v-else-if="!issue" class="vs-panel empty-panel">
      <text>{{ feedback || "暂未发布，隐者日报尚未公开，稍后再来看看。" }}</text>
    </view>

    <view v-else class="daily-stack">
      <!-- 日报头部：紧凑信息行 -->
      <view class="issue-header">
        <view class="issue-header-left">
          <text class="issue-kicker">隐者日报</text>
          <text class="issue-title">{{ issue.title }}</text>
          <text class="issue-meta">{{ publishedDateText }}</text>
        </view>
      </view>

      <!-- 今日话题：独立高亮卡 -->
      <view
        class="vs-panel vs-pixel-frame-primary vs-pixel-frame-gold topic-card"
        :class="{ 'topic-disabled': !hasPublishedReflection }"
      >
        <view class="topic-header">
          <view class="topic-badge">今日话题</view>
        </view>
        <text class="topic-text">
          {{ hasPublishedReflection ? issue.reflection.text : "今日参悟尚未开放引用。" }}
        </text>
        <view class="topic-action-row">
          <text class="topic-prompt">
            {{
              hasPublishedReflection
                ? reflectionPromptText
                : "运营发布可引用参悟后，这里会直接打开社区发帖。"
            }}
          </text>
          <button class="quote-btn" :disabled="!hasPublishedReflection" @tap="quoteReflection">
            {{ reflectionActionText }}
          </button>
        </view>
      </view>

      <!-- 板块入口 -->
      <view class="column-grid">
        <view
          v-for="column in publishedColumns"
          :key="column.sectionKey"
          class="column-card vs-card-raised vs-card-pressable"
          @tap="openColumn(column)"
        >
          <view class="illustration-frame">
            <image
              :class="['illustration-image', columnImageClass(column.sectionKey)]"
              :src="columnCoverImage(column.sectionKey)"
              mode="aspectFill"
            />
            <view class="column-content">
              <text class="column-title">{{ column.title }}</text>
              <text class="column-desc">{{ columnDescription(column.sectionKey) }}</text>
              <text class="column-count">{{ column.articleCount }} 篇可读</text>
            </view>
            <button class="enter-btn" @tap.stop="openColumn(column)">进入</button>
          </view>
        </view>
      </view>

      <view
        v-if="publishedColumns.length === 0 && !hasPublishedReflection"
        class="vs-panel empty-panel"
      >
        <text>当前暂无公开板块，运营发布后会出现在这里。</text>
      </view>
    </view>
  </view>
</template>

<style>
.vs-page {
  min-height: 100vh;
  background: var(--camp-page-background);
}

.daily-stack {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.empty-panel {
  color: var(--camp-text-soft);
  font-size: 22rpx;
  line-height: 1.55;
}

.issue-header {
  padding: 4rpx 0 8rpx;
}

.issue-kicker {
  display: block;
  color: var(--camp-cyan);
  font-size: 20rpx;
  font-weight: 900;
  margin-bottom: 6rpx;
}

.issue-title {
  display: block;
  color: var(--camp-text-strong);
  font-size: 30rpx;
  font-weight: 900;
  line-height: 1.3;
}

.issue-meta {
  display: block;
  color: var(--camp-text-soft);
  font-size: 20rpx;
  margin-top: 4rpx;
}

.topic-card {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  border-color: rgba(154, 106, 22, 0.35) !important;
  background: linear-gradient(135deg, rgba(154, 106, 22, 0.08) 0%, var(--camp-card) 60%) !important;
}

.topic-disabled {
  border-color: var(--camp-border) !important;
  background: var(--camp-card) !important;
}

.topic-header {
  display: flex;
  align-items: center;
}

.topic-badge {
  display: inline-flex;
  align-items: center;
  padding: 6rpx 18rpx;
  border-radius: 999rpx;
  background: var(--camp-gold);
  color: #111827;
  font-size: 22rpx;
  font-weight: 900;
}

.topic-disabled .topic-badge {
  background: var(--camp-surface);
  color: var(--camp-text-soft);
}

.topic-text {
  color: var(--camp-text-strong);
  font-size: 30rpx;
  font-weight: 900;
  line-height: 1.55;
}

.topic-prompt {
  flex: 1;
  min-width: 0;
  color: var(--camp-text-soft);
  font-size: 22rpx;
  line-height: 1.5;
}

.topic-action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.quote-btn {
  display: flex;
  min-height: 54rpx;
  min-width: 136rpx;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0 18rpx;
  border-radius: 4rpx;
  border: 2rpx solid var(--vs-button-border);
  background: var(--vs-button-bg);
  color: var(--vs-button-text);
  font-family: var(--vs-font-display);
  font-size: 22rpx;
  font-weight: 900;
  line-height: 54rpx;
  box-shadow:
    inset 0 -3rpx 0 rgba(0, 0, 0, 0.18),
    3rpx 3rpx 0 rgba(0, 0, 0, 0.32);
}

.quote-btn::after {
  border: 0;
}

.quote-btn[disabled] {
  border-color: var(--camp-border);
  background: var(--camp-surface);
  color: var(--camp-text-soft);
  box-shadow:
    inset 0 -3rpx 0 rgba(0, 0, 0, 0.16),
    2rpx 2rpx 0 rgba(0, 0, 0, 0.24);
}

.quote-btn:active {
  transform: translate(3rpx, 3rpx);
  box-shadow:
    inset 0 -2rpx 0 rgba(0, 0, 0, 0.16),
    1rpx 1rpx 0 rgba(0, 0, 0, 0.28);
}

.column-grid {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.column-card {
  border-radius: 12rpx;
  overflow: hidden;
}

.illustration-frame {
  position: relative;
  width: 100%;
  padding-top: 44.38%;
  overflow: hidden;
  border: 1rpx solid var(--camp-border);
  border-radius: 12rpx;
  background: var(--camp-surface);
}

.illustration-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.illustration-image-world-intel {
  transform: scale(1.06);
  transform-origin: center center;
}

.column-content {
  position: absolute;
  left: 32rpx;
  top: 46%;
  display: flex;
  flex-direction: column;
  gap: 7rpx;
  width: 302rpx;
  max-width: 46%;
  transform: translateY(-50%);
}

.column-title {
  color: #f2f6ff;
  font-size: 40rpx;
  font-weight: 900;
  line-height: 1.08;
  text-shadow:
    0 2rpx 0 rgba(10, 24, 80, 0.72),
    0 0 14rpx rgba(0, 219, 233, 0.28);
}

.column-desc {
  color: #d7e4ff;
  font-size: 19rpx;
  font-weight: 800;
  line-height: 1.32;
  text-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.48);
}

.column-count {
  color: var(--camp-gold);
  font-size: 22rpx;
  font-weight: 900;
  text-shadow: 0 2rpx 6rpx var(--camp-image-text-shadow);
}

.enter-btn {
  position: absolute;
  left: 32rpx;
  bottom: 24rpx;
  display: flex;
  min-width: 104rpx;
  min-height: 48rpx;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0 18rpx;
  border: 2rpx solid var(--vs-button-border);
  border-radius: 4rpx;
  background: var(--vs-button-bg);
  color: var(--vs-button-text);
  font-family: var(--vs-font-display);
  font-size: 22rpx;
  font-weight: 900;
  line-height: 48rpx;
  box-shadow:
    inset 0 -3rpx 0 rgba(0, 0, 0, 0.18),
    4rpx 4rpx 0 rgba(0, 0, 0, 0.42);
}

.enter-btn::after {
  border: 0;
}

.enter-btn:active {
  transform: translate(3rpx, 3rpx);
  box-shadow:
    inset 0 -2rpx 0 rgba(0, 0, 0, 0.2),
    1rpx 1rpx 0 rgba(0, 0, 0, 0.32);
}
</style>
