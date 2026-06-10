<script setup lang="ts">
import { useVisualModePage } from "../../services/visual-mode";
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import {
  formatDisplayTime,
  type DailyContentArticleComment,
  type WorldIntelArticleDetail
} from "@moyuxia/shared";
import { getAppAuthToken } from "../../services/auth";
import { getMiniappApiBaseUrl } from "../../services/api-config.ts";
import { getLocalUserProfileSnapshot } from "../../services/user-growth-profile";
import {
  createWorldIntelArticleComment,
  getWorldIntelArticleDetail,
  isDailyContentIdentityError,
  setWorldIntelArticleLike
} from "../../services/daily-content-feed";

const { visualModeClass } = useVisualModePage();

type ArticleBodyBlock =
  | { type: "text"; id: string; text: string }
  | { type: "image"; id: string; alt: string; src: string };

const articleId = ref("");
const article = ref<WorldIntelArticleDetail | null>(null);
const comments = ref<DailyContentArticleComment[]>([]);
const commentBody = ref("");
const loading = ref(false);
const submitting = ref(false);
const feedback = ref("");
const commentInputFocused = ref(false);
const apiBaseUrl = getMiniappApiBaseUrl();

const articleBodyBlocks = computed(() => parseArticleBody(article.value?.body ?? ""));
const canSubmitComment = computed(() => commentBody.value.trim().length > 0 && !submitting.value);
const articleImageUrls = computed(() =>
  Array.from(
    new Set(
      articleBodyBlocks.value
        .filter(
          (block): block is Extract<ArticleBodyBlock, { type: "image" }> => block.type === "image"
        )
        .map((block) => block.src)
        .filter(Boolean)
    )
  )
);

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
    const response = await getWorldIntelArticleDetail(articleId.value);
    article.value = response.article;
    comments.value = response.comments;
  } catch (error) {
    feedback.value = error instanceof Error ? error.message : "大陆新闻读取失败";
  } finally {
    loading.value = false;
  }
}

async function toggleLike(): Promise<void> {
  if (!article.value || !ensureIdentity()) {
    return;
  }
  try {
    const response = await setWorldIntelArticleLike(article.value.id, !article.value.viewerLiked);
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
    const response = await createWorldIntelArticleComment(article.value.id, body);
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
      alt: match[1]?.trim() || "大陆新闻配图",
      src: normalizeArticleImageUrl(match[2])
    });
    cursor = match.index + match[0].length;
  }

  appendTextBlock(blocks, body.slice(cursor));
  return blocks.length > 0 ? blocks : [{ type: "text", id: "empty-body", text: "正文暂未写入。" }];
}

function appendTextBlock(blocks: ArticleBodyBlock[], text: string): void {
  const normalized = text.trim();
  if (normalized) {
    blocks.push({ type: "text", id: `text-${blocks.length}`, text: normalized });
  }
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
  <view :class="['vs-page', 'vs-stack', 'world-detail-page', visualModeClass]">
    <view v-if="loading" class="vs-panel empty-panel">
      <text>情报展开中...</text>
    </view>
    <view v-else-if="!article" class="vs-panel empty-panel">
      <text>{{ feedback || "大陆新闻暂不可用" }}</text>
    </view>
    <view v-else class="detail-stack">
      <view class="vs-panel vs-card-raised detail-panel">
        <text class="eyebrow">大陆情报</text>
        <text class="article-title">{{ article.title }}</text>
        <text class="article-summary">{{ article.summary }}</text>
        <view class="body-flow">
          <template v-for="block in articleBodyBlocks" :key="block.id">
            <text v-if="block.type === 'text'" class="body-text">{{ block.text }}</text>
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
        <view class="article-meta-block">
          <text class="meta">
            发布 {{ formatDisplayTime(article.publishedAt) }} · 更新
            {{ formatDisplayTime(article.updatedAt) }}
          </text>
        </view>
        <view class="action-row">
          <button class="ghost-button" :disabled="!article.allowLike" @tap="toggleLike">
            {{ article.viewerLiked ? "已赞" : "点赞" }} {{ article.likeCount ?? 0 }}
          </button>
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

.world-detail-page {
  padding-bottom: calc(148rpx + env(safe-area-inset-bottom));
}

.detail-stack,
.detail-panel,
.comment-panel,
.comment-card,
.body-flow {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
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
  font-size: 36rpx;
  font-weight: 900;
  line-height: 1.3;
  overflow-wrap: break-word;
  white-space: normal;
  word-break: break-all;
}

.article-summary,
.meta,
.empty-panel,
.feedback-text {
  color: var(--camp-text-soft);
  font-size: 22rpx;
  line-height: 1.55;
}

.body-text {
  display: block;
  max-width: 100%;
  color: var(--camp-text-muted);
  font-size: 25rpx;
  line-height: 1.75;
  overflow-wrap: break-word;
  white-space: normal;
  word-break: break-all;
}

.inline-article-image {
  width: 100%;
  border-radius: 8rpx;
  background: var(--camp-surface);
}

.article-meta-block {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding-top: 4rpx;
}

.ghost-button {
  display: flex;
  min-height: 56rpx;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0 18rpx;
  border-radius: 4rpx;
  border: 2rpx solid rgba(0, 219, 233, 0.46);
  color: var(--camp-cyan);
  background: rgba(0, 219, 233, 0.08);
  font-family: var(--vs-font-display);
  font-size: 22rpx;
  font-weight: 900;
  line-height: 56rpx;
  box-shadow:
    inset 0 -3rpx 0 rgba(0, 0, 0, 0.18),
    3rpx 3rpx 0 rgba(0, 0, 0, 0.3);
}

.action-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding-top: 4rpx;
  border-top: 1rpx solid var(--camp-border);
}

.action-row .ghost-button {
  flex: 0 0 auto;
  min-width: 128rpx;
}
.ghost-button::after {
  border: 0;
}

.ghost-button:active {
  transform: translate(3rpx, 3rpx);
  box-shadow:
    inset 0 -2rpx 0 rgba(0, 0, 0, 0.16),
    1rpx 1rpx 0 rgba(0, 0, 0, 0.28);
}

.ghost-button[disabled] {
  border-color: var(--camp-border);
  background: var(--camp-surface);
  color: var(--camp-text-soft);
  box-shadow: 2rpx 2rpx 0 rgba(0, 0, 0, 0.24);
}

.comment-title {
  color: var(--camp-text-strong);
  font-size: 28rpx;
  font-weight: 900;
}

.comment-card {
  border: 1rpx solid var(--camp-border);
  border-radius: 8rpx;
  padding: 16rpx;
  background: var(--camp-surface);
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
  font-size: 21rpx;
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
  font-size: 23rpx;
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
  border: 2rpx solid rgba(255, 255, 255, 0.12);
  border-radius: 4rpx;
  background: rgba(255, 255, 255, 0.08);
  color: #8b90b0;
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
    inset 0 3rpx 0 rgba(255, 255, 255, 0.22),
    5rpx 5rpx 0 rgba(17, 24, 39, 0.72);
}

.composer-send:active {
  transform: translate(4rpx, 4rpx);
  box-shadow:
    inset 0 -2rpx 0 rgba(0, 0, 0, 0.16),
    1rpx 1rpx 0 rgba(17, 24, 39, 0.58);
}
</style>
