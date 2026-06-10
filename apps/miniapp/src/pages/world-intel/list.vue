<script setup lang="ts">
import { useVisualModePage } from "../../services/visual-mode";
import { ref } from "vue";
import { onLoad, onReachBottom } from "@dcloudio/uni-app";
import { formatDisplayTime, type WorldIntelArticleSummary } from "@moyuxia/shared";
import { getMiniappApiBaseUrl } from "../../services/api-config.ts";
import { getWorldIntelArticles } from "../../services/daily-content-feed";

const { visualModeClass } = useVisualModePage();

const articles = ref<WorldIntelArticleSummary[]>([]);
const page = ref(1);
const hasMore = ref(false);
const loading = ref(false);
const feedback = ref("");
const apiBaseUrl = getMiniappApiBaseUrl();

onLoad(() => {
  void loadArticles(true);
});

onReachBottom(() => {
  if (hasMore.value && !loading.value) {
    void loadArticles(false);
  }
});

async function loadArticles(reset: boolean): Promise<void> {
  loading.value = true;
  feedback.value = "";
  try {
    const nextPage = reset ? 1 : page.value + 1;
    const response = await getWorldIntelArticles(nextPage, 10);
    articles.value = reset ? response.articles : [...articles.value, ...response.articles];
    page.value = response.pagination.page;
    hasMore.value = response.pagination.hasMore;
    if (articles.value.length === 0) {
      feedback.value = "大陆新闻暂未发布，稍后再来看看。";
    }
  } catch (error) {
    feedback.value = error instanceof Error ? error.message : "大陆新闻读取失败";
  } finally {
    loading.value = false;
  }
}

function openArticle(articleId: string): void {
  uni.navigateTo({
    url: `/pages/world-intel/detail?articleId=${encodeURIComponent(articleId)}`
  });
}

function articleThumbnailUrl(article: WorldIntelArticleSummary): string {
  return normalizeArticleImageUrl(article.coverImageUrl || article.source?.imageUrl || "");
}

function previewArticleImage(article: WorldIntelArticleSummary): void {
  const imageUrl = articleThumbnailUrl(article);
  if (!imageUrl) {
    return;
  }

  uni.previewImage({
    current: imageUrl,
    urls: [imageUrl]
  });
}

function normalizeArticleImageUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("/daily-content/assets/")) {
    return `${apiBaseUrl}${trimmed}`;
  }

  return trimmed.replace(
    /^http:\/\/(localhost|127\.0\.0\.1):3000(?=\/daily-content\/assets\/)/,
    apiBaseUrl
  );
}
</script>

<template>
  <view :class="['vs-page', 'vs-stack', visualModeClass]">
    <view class="section-header">
      <text class="section-kicker">大陆情报</text>
      <text class="section-title">大陆新闻</text>
      <text class="section-meta">独立情报库持续累积更新，历史文章可分页回看。</text>
    </view>

    <view v-if="feedback && articles.length === 0" class="vs-panel empty-panel">
      <text>{{ feedback }}</text>
    </view>

    <view class="article-stack">
      <view
        v-for="article in articles"
        :key="article.id"
        class="vs-panel vs-card-raised vs-card-pressable article-card"
        @tap.stop="openArticle(article.id)"
        @click.stop="openArticle(article.id)"
      >
        <view class="article-copy">
          <text class="article-title">{{ article.title }}</text>
          <text class="article-summary">{{ article.summary }}</text>
          <text class="meta">
            发布 {{ formatDisplayTime(article.publishedAt) }} · 更新
            {{ formatDisplayTime(article.updatedAt) }}
          </text>
        </view>
        <view class="article-thumb">
          <image
            v-if="articleThumbnailUrl(article)"
            :src="articleThumbnailUrl(article)"
            mode="aspectFill"
            @tap.stop="previewArticleImage(article)"
          />
        </view>
      </view>
    </view>

    <button v-if="hasMore" class="primary-button" :disabled="loading" @tap="loadArticles(false)">
      {{ loading ? "加载中" : "加载更多" }}
    </button>
  </view>
</template>

<style>
.vs-page {
  min-height: 100vh;
  background: var(--camp-page-background);
}

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
.article-summary,
.meta,
.empty-panel {
  color: var(--camp-text-soft);
  font-size: 22rpx;
  line-height: 1.55;
}

.article-title {
  display: block;
  max-width: 100%;
  overflow: hidden;
  color: var(--camp-text-strong);
  font-size: 28rpx;
  font-weight: 900;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.article-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 156rpx;
  gap: 16rpx;
  align-items: start;
}

.article-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8rpx;
}

.article-summary {
  display: block;
  max-width: 100%;
  overflow-wrap: break-word;
  white-space: normal;
  word-break: break-all;
}

.article-thumb {
  display: flex;
  width: 156rpx;
  height: 156rpx;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1rpx solid var(--camp-border);
  border-radius: 8rpx;
  background: var(--camp-surface);
  color: var(--camp-cyan);
  font-size: 22rpx;
  font-weight: 900;
}

.article-thumb image {
  width: 100%;
  height: 100%;
}

.primary-button {
  min-height: 70rpx;
  border: 2rpx solid var(--vs-button-border);
  border-radius: 4rpx;
  color: var(--vs-button-text);
  background: var(--vs-button-bg);
  font-family: var(--vs-font-display);
  font-size: 22rpx;
  font-weight: 900;
  box-shadow:
    inset 0 -4rpx 0 rgba(0, 0, 0, 0.18),
    5rpx 5rpx 0 rgba(0, 0, 0, 0.42);
}

.primary-button::after {
  border: 0;
}

.primary-button:active {
  transform: translate(4rpx, 4rpx);
  box-shadow:
    inset 0 -2rpx 0 rgba(0, 0, 0, 0.16),
    1rpx 1rpx 0 rgba(0, 0, 0, 0.42);
}
</style>
