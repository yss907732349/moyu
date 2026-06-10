<script setup lang="ts">
import { useVisualModePage } from "../../services/visual-mode";
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import {
  DailyContentSectionKey,
  type DailyContentArticleSectionKey,
  type DailyContentArticleSummary
} from "@moyuxia/shared";
import { isDailyContentArticleSectionKey } from "@moyuxia/shared";
import { getDailyContentColumnArticles } from "../../services/daily-content-feed";

const { visualModeClass } = useVisualModePage();

const issueId = ref("");
const sectionKey = ref<DailyContentArticleSectionKey>("absurd_casefile");
const sectionLabel = ref("离谱卷宗");
const articles = ref<DailyContentArticleSummary[]>([]);
const loading = ref(false);
const feedback = ref("");

onLoad((query: { issueId?: string; sectionKey?: string } = {}) => {
  if (query.sectionKey === DailyContentSectionKey.WorldIntel) {
    uni.redirectTo({ url: "/pages/world-intel/list" });
    return;
  }
  issueId.value = query.issueId ?? "";
  if (query.sectionKey && isDailyContentArticleSectionKey(query.sectionKey)) {
    sectionKey.value = query.sectionKey;
  }
  void loadArticles();
});

async function loadArticles(): Promise<void> {
  if (!issueId.value) {
    feedback.value = "日报参数缺失";
    return;
  }

  loading.value = true;
  feedback.value = "";
  try {
    const response = await getDailyContentColumnArticles(issueId.value, sectionKey.value);
    sectionLabel.value = response.sectionLabel;
    articles.value = response.articles;
  } catch (error) {
    feedback.value = error instanceof Error ? error.message : "文章列表读取失败";
  } finally {
    loading.value = false;
  }
}

function openArticle(articleId: string): void {
  uni.navigateTo({
    url: `/pages/daily-content/detail?articleId=${encodeURIComponent(articleId)}`
  });
}

function previewArticleImage(imageUrl?: string): void {
  if (!imageUrl) {
    return;
  }

  uni.previewImage({
    current: imageUrl,
    urls: [imageUrl]
  });
}
</script>

<template>
  <view :class="['vs-page', 'vs-stack', visualModeClass]">
    <view class="section-header">
      <text class="section-kicker">日报栏目</text>
      <text class="section-title">{{ sectionLabel }}</text>
      <text class="section-meta">今日收录 {{ articles.length }} 篇，可逐篇参阅。</text>
    </view>

    <view v-if="loading" class="vs-panel empty-panel">
      <text>文章卷轴整理中...</text>
    </view>

    <view v-else-if="feedback" class="vs-panel empty-panel">
      <text>{{ feedback }}</text>
    </view>

    <view v-else-if="articles.length === 0" class="vs-panel empty-panel">
      <text>本栏目暂无公开文章，运营补齐后会出现在这里。</text>
    </view>

    <view v-else class="article-stack">
      <view
        v-for="article in articles"
        :key="article.id"
        class="vs-panel vs-card-raised vs-card-pressable article-card"
        @tap="openArticle(article.id)"
      >
        <image
          v-if="article.source?.imageUrl"
          class="article-image"
          :src="article.source.imageUrl"
          mode="aspectFill"
          @tap.stop="previewArticleImage(article.source.imageUrl)"
        />
        <text class="article-title">{{ article.title }}</text>
        <text class="article-summary">{{ article.summary }}</text>
        <view class="stats-row">
          <text>赞 {{ article.likeCount }}</text>
          <text>评 {{ article.commentCount }}</text>
          <text>查看</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style>
.vs-page {
  min-height: 100vh;
  background: var(--camp-page-background);
}

.article-card,
.article-stack {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.section-header {
  padding: 4rpx 0 8rpx;
}

.section-kicker {
  display: block;
  color: var(--camp-cyan);
  font-size: 20rpx;
  font-weight: 900;
  margin-bottom: 6rpx;
}

.section-title {
  display: block;
  color: var(--camp-text-strong);
  font-size: 34rpx;
  font-weight: 900;
  line-height: 1.3;
}

.section-meta,
.empty-panel {
  color: var(--camp-text-soft);
  font-size: 22rpx;
  line-height: 1.55;
}

.article-stack {
  gap: 16rpx;
}
.article-card {
  gap: 10rpx;
}

.article-image {
  width: 100%;
  height: 220rpx;
  border-radius: 10rpx;
  background: var(--camp-surface);
}

.article-title {
  display: block;
  max-width: 100%;
  color: var(--camp-text-strong);
  font-size: 28rpx;
  font-weight: 900;
  line-height: 1.35;
  overflow-wrap: break-word;
  white-space: normal;
  word-break: break-all;
}

.article-summary {
  display: block;
  max-width: 100%;
  color: var(--camp-text-muted);
  font-size: 24rpx;
  line-height: 1.6;
  overflow-wrap: break-word;
  white-space: normal;
  word-break: break-all;
}

.stats-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding-top: 4rpx;
  border-top: 1rpx solid var(--camp-border);
  color: var(--camp-text-soft);
  font-size: 22rpx;
}
</style>
