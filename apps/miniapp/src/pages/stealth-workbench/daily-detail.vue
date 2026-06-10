<script setup lang="ts">
import { useVisualModePage } from "../../services/visual-mode";
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import {
  formatDisplayTime,
  type DailyContentArticleComment,
  type DailyContentArticleDetail,
  type WorldIntelArticleDetail
} from "@moyuxia/shared";
import { getMiniappApiBaseUrl } from "../../services/api-config";
import {
  getDailyContentArticleDetail,
  getDailyContentSummary,
  getWorldIntelArticleDetail
} from "../../services/daily-content-feed";
const { visualModeClass } = useVisualModePage({ forceMode: "workplace" });

type DetailKind = "reflection" | "daily_article" | "world_intel";
type DetailView = {
  id: string;
  title: string;
  sectionLabel: string;
  publishedAt?: string;
  likeCount: number;
  commentCount: number;
  body: string;
  summary: string;
  imageUrls: string[];
};

const articleId = ref("");
const detailKind = ref<DetailKind>("daily_article");
const detail = ref<DetailView | null>(null);
const comments = ref<DailyContentArticleComment[]>([]);
const loading = ref(false);
const feedback = ref("同步中");
const attachmentListVisible = ref(false);
const currentImageUrl = ref("");
const apiBaseUrl = getMiniappApiBaseUrl();

const bodyText = computed(() => normalizeArticleBody(detail.value?.body ?? ""));
const imageCount = computed(() => detail.value?.imageUrls.length ?? 0);

onLoad((query: { articleId?: string; kind?: string } = {}) => {
  articleId.value = query.articleId ?? "";
  detailKind.value = normalizeKind(query.kind);
  void loadDetail();
});

async function loadDetail(): Promise<void> {
  if (detailKind.value !== "reflection" && !articleId.value) {
    feedback.value = "数据读取失败";
    return;
  }

  loading.value = true;
  feedback.value = "同步中";

  try {
    if (detailKind.value === "reflection") {
      const response = await getDailyContentSummary();
      if (!response.issue) {
        throw new Error("暂无记录");
      }
      detail.value = {
        id: response.issue.reflection.id,
        title: "每日话题",
        sectionLabel: "每日话题",
        publishedAt: response.issue.publishedAt,
        likeCount: 0,
        commentCount: 0,
        body: response.issue.reflection.text,
        summary: response.issue.reflection.text,
        imageUrls: []
      };
      comments.value = [];
    } else if (detailKind.value === "world_intel") {
      const response = await getWorldIntelArticleDetail(articleId.value);
      detail.value = toWorldIntelDetailView(response.article, response.comments.length);
      comments.value = response.comments;
    } else {
      const response = await getDailyContentArticleDetail(articleId.value);
      detail.value = toDailyArticleDetailView(response.article, response.comments.length);
      comments.value = response.comments;
    }
    feedback.value = "";
  } catch (error) {
    detail.value = null;
    comments.value = [];
    feedback.value = error instanceof Error ? error.message : "数据读取失败";
  } finally {
    loading.value = false;
  }
}

function normalizeArticleBody(body: string): string {
  return body
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractMarkdownImageUrls(body: string): string[] {
  const imagePattern = /!\[[^\]]*\]\(([^)\s]+)\)/g;
  return Array.from(body.matchAll(imagePattern))
    .map((match) => normalizeImageUrl(match[1] ?? ""))
    .filter(Boolean);
}

function normalizeImageUrl(url: string): string {
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

function toggleAttachmentList(): void {
  if (imageCount.value === 0) {
    return;
  }

  attachmentListVisible.value = !attachmentListVisible.value;
}

function openImage(url: string): void {
  currentImageUrl.value = url;
}

function closeImageViewer(): void {
  currentImageUrl.value = "";
}

function normalizeKind(value?: string): DetailKind {
  if (value === "reflection" || value === "world_intel" || value === "daily_article") {
    return value;
  }

  return "daily_article";
}

function toDailyArticleDetailView(
  article: DailyContentArticleDetail,
  commentCount: number
): DetailView {
  return {
    id: article.id,
    title: article.title,
    sectionLabel: article.sectionLabel,
    publishedAt: article.source?.publishedAt,
    likeCount: article.likeCount,
    commentCount,
    body: article.body,
    summary: article.summary,
    imageUrls: [
      normalizeImageUrl(article.source?.imageUrl ?? ""),
      ...extractMarkdownImageUrls(article.body)
    ].filter(Boolean)
  };
}

function toWorldIntelDetailView(
  article: WorldIntelArticleDetail,
  commentCount: number
): DetailView {
  return {
    id: article.id,
    title: article.title,
    sectionLabel: "大陆新闻",
    publishedAt: article.publishedAt,
    likeCount: article.likeCount ?? 0,
    commentCount,
    body: article.body,
    summary: article.summary,
    imageUrls: [
      normalizeImageUrl(article.coverImageUrl ?? ""),
      normalizeImageUrl(article.source?.imageUrl ?? ""),
      ...extractMarkdownImageUrls(article.body)
    ].filter(Boolean)
  };
}
</script>

<template>
  <view :class="['stealth-page', visualModeClass]">
    <view class="stealth-stack">
      <view class="stealth-sheet stealth-field-table">
        <view class="stealth-sheet-title">
          <text>日报记录</text>
          <text class="stealth-sheet-meta">{{ loading ? "同步中" : feedback || "只读" }}</text>
        </view>
        <text v-if="loading" class="stealth-status-row">同步中</text>
        <text v-else-if="feedback || !detail" class="stealth-status-row">数据读取失败</text>
        <template v-else>
          <view class="stealth-row">
            <text class="stealth-cell stealth-cell-label">标题</text>
            <text class="stealth-cell">{{ detail.title }}</text>
            <text class="stealth-cell stealth-cell-time">公开</text>
          </view>
          <view class="stealth-row">
            <text class="stealth-cell stealth-cell-label">栏目</text>
            <text class="stealth-cell">{{ detail.sectionLabel }}</text>
            <text class="stealth-cell stealth-cell-number">
              {{ detail.likeCount }}/{{ detail.commentCount }}
            </text>
          </view>
          <view class="stealth-row">
            <text class="stealth-cell stealth-cell-label">发布时间</text>
            <text class="stealth-cell">{{ formatDisplayTime(detail.publishedAt) }}</text>
            <text class="stealth-cell stealth-cell-time">记录</text>
          </view>
          <view class="stealth-row">
            <text class="stealth-cell stealth-cell-label">配图数量</text>
            <text class="stealth-cell">{{ imageCount }}</text>
            <view class="stealth-cell stealth-cell-action">
              <text class="stealth-text-button" @tap="toggleAttachmentList">查看</text>
            </view>
          </view>
        </template>
      </view>

      <view v-if="detail" class="stealth-sheet">
        <view class="stealth-sheet-title">
          <text>正文</text>
          <text class="stealth-sheet-meta">合并单元格</text>
        </view>
        <text class="stealth-merged-cell">{{ bodyText || detail.summary }}</text>
      </view>

      <view v-if="detail && attachmentListVisible" class="stealth-sheet stealth-attachment-table">
        <view class="stealth-sheet-title">
          <text>配图清单</text>
          <text class="stealth-sheet-meta">{{ imageCount }} 项</text>
        </view>
        <view class="stealth-table-head">
          <text class="stealth-cell">配图</text>
          <text class="stealth-cell stealth-cell-action">操作</text>
        </view>
        <text v-if="imageCount === 0" class="stealth-status-row">暂无记录</text>
        <view v-for="(url, index) in detail.imageUrls" v-else :key="url" class="stealth-row">
          <text class="stealth-cell">配图 {{ index + 1 }}</text>
          <view class="stealth-cell stealth-cell-action">
            <text class="stealth-text-button" @tap="openImage(url)">查看</text>
          </view>
        </view>
      </view>

      <view v-if="detail" class="stealth-sheet stealth-comment-table">
        <view class="stealth-sheet-title">
          <text>互动摘要</text>
          <text class="stealth-sheet-meta">{{ comments.length }} 条</text>
        </view>
        <view class="stealth-table-head">
          <text class="stealth-cell">人员</text>
          <text class="stealth-cell">内容</text>
          <text class="stealth-cell stealth-cell-time">时间</text>
        </view>
        <text v-if="comments.length === 0" class="stealth-status-row">暂无记录</text>
        <view v-for="comment in comments" v-else :key="comment.id" class="stealth-row">
          <text class="stealth-cell">{{ comment.author.displayName }}</text>
          <text class="stealth-cell">
            <text class="stealth-title-two-line">{{ comment.body }}</text>
          </text>
          <text class="stealth-cell stealth-cell-time">
            {{ formatDisplayTime(comment.createdAt) }}
          </text>
        </view>
      </view>

      <view v-if="currentImageUrl" class="stealth-image-viewer" @tap="closeImageViewer">
        <image class="stealth-image-viewer-image" :src="currentImageUrl" mode="aspectFit" />
      </view>
    </view>
  </view>
</template>

<style>
@import "./stealth-table.css";
</style>
