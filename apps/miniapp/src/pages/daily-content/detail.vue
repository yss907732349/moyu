<script setup lang="ts">
import { useVisualModePage } from "../../services/visual-mode";
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import {
  DailyContentSectionKey,
  type DailyContentArticleComment,
  type DailyContentArticleDetail
} from "@moyuxia/shared";
import { getAppAuthToken } from "../../services/auth";
import { getMiniappApiBaseUrl } from "../../services/api-config.ts";
import { getLocalUserProfileSnapshot } from "../../services/user-growth-profile";
import {
  createDailyContentArticleComment,
  getDailyContentArticleDetail,
  isDailyContentIdentityError,
  setDailyContentItemLike
} from "../../services/daily-content-feed";

const { visualModeClass } = useVisualModePage();

const articleId = ref("");
const article = ref<DailyContentArticleDetail | null>(null);
const comments = ref<DailyContentArticleComment[]>([]);
const commentBody = ref("");
const loading = ref(false);
const submitting = ref(false);
const feedback = ref("");
const commentInputFocused = ref(false);
const apiBaseUrl = getMiniappApiBaseUrl();

type ArticleBodyBlock =
  | {
      type: "text";
      id: string;
      text: string;
    }
  | {
      type: "image";
      id: string;
      alt: string;
      src: string;
    };

const articleBodyBlocks = computed(() => parseArticleBody(article.value?.body ?? ""));
const canSubmitComment = computed(() => commentBody.value.trim().length > 0 && !submitting.value);
const sourceAttribution = computed(() => {
  if (
    article.value?.sectionKey !== DailyContentSectionKey.AbsurdCasefile ||
    !article.value.source?.sourceUrl ||
    !article.value.source.publicSourceText
  ) {
    return null;
  }

  return {
    text: article.value.source.publicSourceText,
    url: article.value.source.sourceUrl
  };
});
const articleImageUrls = computed(() => {
  const urls = [
    article.value?.source?.imageUrl,
    ...articleBodyBlocks.value
      .filter(
        (block): block is Extract<ArticleBodyBlock, { type: "image" }> => block.type === "image"
      )
      .map((block) => block.src)
  ];

  return Array.from(new Set(urls.filter((url): url is string => Boolean(url))));
});

onLoad((query: { articleId?: string } = {}) => {
  articleId.value = query.articleId ?? "";
  void loadArticle();
});

async function loadArticle(): Promise<void> {
  if (!articleId.value) {
    feedback.value = "文章参数缺失";
    return;
  }

  loading.value = true;
  feedback.value = "";
  try {
    const response = await getDailyContentArticleDetail(articleId.value);
    article.value = response.article;
    comments.value = response.comments;
  } catch (error) {
    feedback.value = error instanceof Error ? error.message : "文章读取失败";
  } finally {
    loading.value = false;
  }
}

async function toggleLike(): Promise<void> {
  if (!article.value || !ensureIdentity()) {
    return;
  }

  try {
    const response = await setDailyContentItemLike(article.value.id, !article.value.viewerLiked);
    article.value = {
      ...article.value,
      viewerLiked: response.liked,
      likeCount: response.likeCount
    };
  } catch (error) {
    if (isDailyContentIdentityError(error)) {
      redirectToProfile();
      return;
    }
    uni.showToast({ title: error instanceof Error ? error.message : "点赞失败", icon: "none" });
  }
}

async function submitComment(): Promise<void> {
  if (!article.value || !ensureIdentity() || submitting.value) {
    return;
  }

  const body = commentBody.value.trim();
  if (!body) {
    commentInputFocused.value = true;
    return;
  }

  submitting.value = true;
  feedback.value = "";
  try {
    const response = await createDailyContentArticleComment(article.value.id, body);
    commentBody.value = "";
    feedback.value = response.message;
    if (response.status !== "rejected") {
      await loadArticle();
    }
  } catch (error) {
    if (isDailyContentIdentityError(error)) {
      redirectToProfile();
      return;
    }
    feedback.value = error instanceof Error ? error.message : "评论失败";
  } finally {
    submitting.value = false;
  }
}

function focusCommentInput(): void {
  commentInputFocused.value = true;
}

function previewArticleImage(current: string): void {
  const urls = articleImageUrls.value;
  if (!current || urls.length === 0) {
    return;
  }

  uni.previewImage({
    current,
    urls: urls.includes(current) ? urls : [current, ...urls]
  });
}

function copyArticleSourceUrl(): void {
  if (!sourceAttribution.value?.url) {
    return;
  }

  uni.setClipboardData({
    data: sourceAttribution.value.url,
    success: () => {
      uni.showToast({ title: "来源链接已复制", icon: "none" });
    }
  });
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

function parseArticleBody(body: string): ArticleBodyBlock[] {
  const blocks: ArticleBodyBlock[] = [];
  const imagePattern = /!\[([^\]]*)\]\(([^)\s]+)\)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = imagePattern.exec(body)) !== null) {
    appendTextBlock(blocks, body.slice(cursor, match.index));
    blocks.push({
      type: "image",
      id: `image-${match.index}`,
      alt: match[1]?.trim() || "日报配图",
      src: normalizeArticleImageUrl(match[2])
    });
    cursor = match.index + match[0].length;
  }

  appendTextBlock(blocks, body.slice(cursor));
  return blocks.length > 0 ? blocks : [{ type: "text", id: "empty-body", text: "正文暂未写入。" }];
}

function appendTextBlock(blocks: ArticleBodyBlock[], text: string): void {
  const normalized = text.trim();
  if (!normalized) {
    return;
  }
  blocks.push({
    type: "text",
    id: `text-${blocks.length}`,
    text: normalized
  });
}

function normalizeArticleImageUrl(url: string): string {
  const trimmed = url.trim();
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
  <view :class="['vs-page', 'vs-stack', 'article-detail-page', visualModeClass]">
    <view v-if="loading" class="vs-panel empty-panel">
      <text>文章展开中...</text>
    </view>

    <view v-else-if="!article" class="vs-panel empty-panel">
      <text>{{ feedback || "文章暂不可用" }}</text>
    </view>

    <view v-else class="detail-stack">
      <view class="vs-panel vs-card-raised article-panel">
        <text class="eyebrow">{{ article.sectionLabel }}</text>
        <image
          v-if="article.source?.imageUrl"
          class="article-image"
          :src="article.source.imageUrl"
          mode="aspectFill"
          @tap="previewArticleImage(article.source.imageUrl)"
        />
        <text class="article-title">{{ article.title }}</text>
        <text class="article-summary">{{ article.summary }}</text>
        <view class="article-body-flow">
          <template v-for="block in articleBodyBlocks" :key="block.id">
            <text v-if="block.type === 'text'" class="article-body">{{ block.text }}</text>
            <image
              v-else
              class="inline-article-image"
              :src="block.src"
              :alt="block.alt"
              mode="widthFix"
              @tap="previewArticleImage(block.src)"
            />
          </template>
        </view>
        <view v-if="sourceAttribution" class="source-attribution" @tap="copyArticleSourceUrl">
          <text class="source-attribution-text">{{ sourceAttribution.text }}</text>
          <view class="source-copy-icon" aria-label="复制来源链接">
            <view class="copy-square copy-square-back" />
            <view class="copy-square copy-square-front" />
          </view>
        </view>
        <view class="action-row">
          <view
            :class="['action-btn', article.viewerLiked ? 'action-active' : '']"
            @tap="toggleLike"
          >
            <text class="action-icon">{{ article.viewerLiked ? "♥" : "♡" }}</text>
            <text class="action-count">{{ article.likeCount }}</text>
          </view>
        </view>
      </view>

      <view class="vs-panel vs-card-raised comment-panel">
        <text class="comment-title">评论 {{ comments.length }}</text>
        <view v-for="comment in comments" :key="comment.id" class="comment-card">
          <view class="comment-head">
            <text class="comment-author">
              {{ comment.author.displayName }} · {{ comment.author.factionLabel }}
            </text>
            <text v-if="comment.visibleToAuthorOnly" class="self-visible-badge">仅自己可见</text>
          </view>
          <text class="comment-body">{{ comment.body }}</text>
          <text v-if="comment.visibleToAuthorOnly" class="review-hint">
            审核中，通过后其他隐者可见
          </text>
        </view>
        <text v-if="comments.length === 0" class="feedback-text">
          暂无公开评论，审核通过后会显示在这里。
        </text>
        <text v-if="feedback" class="feedback-text">{{ feedback }}</text>
      </view>

      <view class="comment-composer">
        <view class="composer-input-shell" @tap="focusCommentInput">
          <input
            v-model="commentBody"
            class="composer-input"
            placeholder="发表评论:"
            confirm-type="send"
            maxlength="500"
            :focus="commentInputFocused"
            :adjust-position="true"
            :cursor-spacing="18"
            @focus="commentInputFocused = true"
            @blur="commentInputFocused = false"
            @confirm="submitComment"
          />
        </view>
        <button
          class="composer-send"
          :class="{ 'composer-send-active': canSubmitComment }"
          :disabled="!canSubmitComment"
          @tap="submitComment"
        >
          {{ submitting ? "发送中" : "发送" }}
        </button>
      </view>
    </view>
  </view>
</template>

<style>
.vs-page {
  min-height: 100vh;
  background: var(--camp-page-background);
}

.article-detail-page {
  padding-bottom: calc(148rpx + env(safe-area-inset-bottom));
}

.detail-stack,
.article-panel,
.comment-panel,
.comment-card {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.eyebrow {
  color: var(--camp-cyan);
  font-size: 20rpx;
  font-weight: 900;
}

.article-title {
  display: block;
  max-width: 100%;
  color: var(--camp-text-strong);
  font-size: 34rpx;
  font-weight: 900;
  line-height: 1.3;
  overflow-wrap: break-word;
  white-space: normal;
  word-break: break-all;
}

.article-image {
  width: 100%;
  height: 300rpx;
  border-radius: 10rpx;
  background: var(--camp-surface);
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

.empty-panel,
.feedback-text {
  color: var(--camp-text-soft);
  font-size: 22rpx;
  line-height: 1.55;
}

.feedback-text {
  color: var(--camp-gold);
}

.article-body {
  display: block;
  max-width: 100%;
  color: var(--camp-text-muted);
  font-size: 26rpx;
  line-height: 1.8;
  overflow-wrap: break-word;
  white-space: normal;
  word-break: break-all;
}

.article-body-flow {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.source-attribution {
  display: flex;
  align-items: center;
  gap: 10rpx;
  min-width: 0;
  padding-top: 2rpx;
}

.source-attribution-text {
  min-width: 0;
  flex: 0 1 auto;
  overflow: hidden;
  color: var(--camp-gold);
  font-size: 23rpx;
  font-weight: 800;
  line-height: 1.45;
  text-decoration: underline;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.source-copy-icon {
  position: relative;
  width: 24rpx;
  height: 24rpx;
  flex: 0 0 24rpx;
}

.copy-square {
  position: absolute;
  box-sizing: border-box;
  width: 15rpx;
  height: 17rpx;
  border: 2rpx solid var(--camp-gold);
  border-radius: 3rpx;
}

.copy-square-back {
  top: 2rpx;
  left: 7rpx;
  opacity: 0.58;
}
.copy-square-front {
  top: 6rpx;
  left: 2rpx;
  background: var(--camp-card);
}

.inline-article-image {
  width: 100%;
  border-radius: 10rpx;
  background: var(--camp-surface);
}

.action-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding-top: 4rpx;
  border-top: 1rpx solid var(--camp-border);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 10rpx 20rpx;
  border: 2rpx solid var(--camp-border);
  border-radius: 4rpx;
  background: var(--camp-surface);
  box-shadow:
    inset 0 -3rpx 0 rgba(0, 0, 0, 0.18),
    3rpx 3rpx 0 rgba(0, 0, 0, 0.28);
}

.action-btn.action-active {
  border-color: rgba(154, 106, 22, 0.62);
  background: rgba(154, 106, 22, 0.1);
  box-shadow:
    inset 0 -3rpx 0 rgba(0, 0, 0, 0.18),
    3rpx 3rpx 0 rgba(0, 0, 0, 0.42);
}

.action-btn:active {
  transform: translate(3rpx, 3rpx);
  box-shadow:
    inset 0 -2rpx 0 rgba(0, 0, 0, 0.16),
    1rpx 1rpx 0 rgba(0, 0, 0, 0.26);
}

.action-icon {
  font-size: 28rpx;
  color: var(--camp-text-soft);
  line-height: 1;
}
.action-btn.action-active .action-icon {
  color: var(--camp-gold);
}
.action-count {
  font-size: 24rpx;
  font-weight: 700;
  color: var(--camp-text-soft);
}
.action-btn.action-active .action-count {
  color: var(--camp-gold);
}

.comment-title {
  color: var(--camp-text-strong);
  font-size: 26rpx;
  font-weight: 900;
}

.comment-card {
  border-bottom: 1rpx solid var(--camp-border);
  padding-bottom: 12rpx;
}

.comment-head {
  display: flex;
  align-items: center;
  gap: 12rpx;
  justify-content: space-between;
}

.comment-author {
  min-width: 0;
  color: var(--camp-primary);
  font-size: 20rpx;
  font-weight: 900;
}

.self-visible-badge {
  flex: 0 0 auto;
  padding: 4rpx 10rpx;
  border: 1rpx solid rgba(154, 106, 22, 0.5);
  border-radius: 4rpx;
  color: var(--camp-gold);
  background: rgba(154, 106, 22, 0.1);
  font-size: 18rpx;
  font-weight: 900;
  line-height: 1.3;
}

.comment-body {
  display: block;
  max-width: 100%;
  color: var(--camp-text-muted);
  font-size: 24rpx;
  line-height: 1.6;
  overflow-wrap: break-word;
  white-space: normal;
  word-break: break-all;
}

.review-hint {
  color: var(--camp-gold);
  font-size: 20rpx;
  font-weight: 800;
  line-height: 1.5;
}

.comment-composer {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 14rpx;
  box-sizing: border-box;
  padding: 18rpx 24rpx calc(18rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid var(--camp-border);
  background: var(--camp-surface-high);
  box-shadow: 0 -12rpx 28rpx rgba(0, 0, 0, 0.3);
}

.composer-input-shell {
  display: flex;
  min-width: 0;
  height: 72rpx;
  flex: 1;
  align-items: center;
  border: 1rpx solid var(--camp-border);
  border-radius: 12rpx;
  background: var(--camp-surface);
  padding: 0 22rpx;
  box-sizing: border-box;
}

.composer-input {
  width: 100%;
  height: 70rpx;
  color: var(--camp-text);
  font-size: 26rpx;
  line-height: 70rpx;
}

.composer-send {
  display: flex;
  width: 132rpx;
  height: 72rpx;
  min-width: 132rpx;
  min-height: 72rpx;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  border: 2rpx solid var(--camp-border);
  border-radius: 4rpx;
  background: var(--camp-surface);
  color: var(--camp-text-soft);
  font-family: var(--vs-font-display);
  font-size: 24rpx;
  font-weight: 900;
  line-height: 72rpx;
  box-shadow:
    inset 0 -3rpx 0 rgba(0, 0, 0, 0.16),
    3rpx 3rpx 0 rgba(0, 0, 0, 0.28);
}

.composer-send::after {
  border: 0;
}

.composer-send-active {
  border-color: var(--vs-button-border);
  background: var(--vs-button-bg);
  color: var(--vs-button-text);
  box-shadow:
    inset 0 -4rpx 0 rgba(0, 0, 0, 0.18),
    5rpx 5rpx 0 rgba(0, 0, 0, 0.42);
}

.composer-send:active {
  transform: translate(4rpx, 4rpx);
  box-shadow:
    inset 0 -2rpx 0 rgba(0, 0, 0, 0.16),
    1rpx 1rpx 0 rgba(0, 0, 0, 0.42);
}
</style>
