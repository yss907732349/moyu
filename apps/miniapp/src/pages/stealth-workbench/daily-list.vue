<script setup lang="ts">
import { useVisualModePage } from "../../services/visual-mode";
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import {
  DailyContentSectionKey,
  formatDisplayTime,
  type DailyContentArticleSummary,
  type DailyContentPublicSummary,
  type WorldIntelArticleSummary
} from "@moyuxia/shared";
import {
  getDailyContentColumnArticles,
  getDailyContentSummary,
  getWorldIntelArticles
} from "../../services/daily-content-feed";
const { visualModeClass } = useVisualModePage({ forceMode: "workplace" });

type StealthDailyRow =
  | {
      id: string;
      kind: "reflection";
      sectionLabel: "每日话题";
      title: string;
      summary: string;
      likeCount: number;
      commentCount: number;
      publishedAt: string;
      imageCount: number;
    }
  | {
      id: string;
      kind: "world_intel";
      sectionLabel: "大陆新闻";
      title: string;
      summary: string;
      likeCount: number;
      commentCount: number;
      publishedAt: string;
      imageCount: number;
    }
  | {
      id: string;
      kind: "daily_article";
      sectionLabel: string;
      title: string;
      summary: string;
      likeCount: number;
      commentCount: number;
      publishedAt: string;
      imageCount: number;
    };

const issue = ref<DailyContentPublicSummary | null>(null);
const rows = ref<StealthDailyRow[]>([]);
const loading = ref(false);
const feedback = ref("同步中");

const statusText = computed(() => {
  if (loading.value) {
    return "同步中";
  }

  if (feedback.value) {
    return feedback.value;
  }

  return rows.value.length === 0 ? "暂无记录" : `${rows.value.length} 条`;
});

onShow(() => {
  void loadDailyRows();
});

async function loadDailyRows(): Promise<void> {
  loading.value = true;
  feedback.value = "同步中";

  try {
    const summary = await getDailyContentSummary();
    issue.value = summary.issue;

    if (!summary.issue) {
      rows.value = [];
      feedback.value = "暂无记录";
      return;
    }

    const nextRows: StealthDailyRow[] = [];
    if (summary.issue.reflection.text.trim()) {
      nextRows.push({
        id: summary.issue.reflection.id,
        kind: "reflection",
        sectionLabel: "每日话题",
        title: "每日话题",
        summary: summary.issue.reflection.text,
        likeCount: 0,
        commentCount: 0,
        publishedAt: summary.issue.publishedAt,
        imageCount: 0
      });
    }

    const worldIntelColumn = summary.issue.columns.find(
      (column) => column.sectionKey === DailyContentSectionKey.WorldIntel
    );
    if (worldIntelColumn) {
      const worldIntelResponse = await getWorldIntelArticles(1, 3);
      nextRows.push(...worldIntelResponse.articles.map(toWorldIntelRow));
    }

    const absurdColumn = summary.issue.columns.find(
      (column) => column.sectionKey === DailyContentSectionKey.AbsurdCasefile
    );

    if (absurdColumn) {
      const response = await getDailyContentColumnArticles(
        summary.issue.id,
        DailyContentSectionKey.AbsurdCasefile
      );
      nextRows.push(...response.articles.map(toDailyArticleRow));
    }

    rows.value = nextRows;
    feedback.value = nextRows.length === 0 ? "暂无记录" : "";
  } catch (error) {
    rows.value = [];
    feedback.value = error instanceof Error ? error.message : "数据读取失败";
  } finally {
    loading.value = false;
  }
}

function openRow(row: StealthDailyRow): void {
  if (row.kind === "reflection") {
    uni.navigateTo({
      url: `/pages/stealth-workbench/daily-detail?kind=reflection`
    });
    return;
  }

  if (row.kind === "world_intel") {
    uni.navigateTo({
      url: `/pages/stealth-workbench/daily-detail?kind=world_intel&articleId=${encodeURIComponent(row.id)}`
    });
    return;
  }

  uni.navigateTo({
    url: `/pages/stealth-workbench/daily-detail?kind=daily_article&articleId=${encodeURIComponent(row.id)}`
  });
}

function toDailyArticleRow(article: DailyContentArticleSummary): StealthDailyRow {
  return {
    id: article.id,
    kind: "daily_article",
    sectionLabel: article.sectionLabel,
    title: article.title,
    summary: article.summary,
    likeCount: article.likeCount,
    commentCount: article.commentCount,
    publishedAt: article.source?.publishedAt ?? issue.value?.publishedAt ?? "",
    imageCount: countDailyArticleImages(article)
  };
}

function toWorldIntelRow(article: WorldIntelArticleSummary): StealthDailyRow {
  return {
    id: article.id,
    kind: "world_intel",
    sectionLabel: "大陆新闻",
    title: article.title,
    summary: article.summary,
    likeCount: 0,
    commentCount: 0,
    publishedAt: article.publishedAt,
    imageCount: countDefinedImages([article.coverImageUrl, article.source?.imageUrl])
  };
}

function countDailyArticleImages(article: DailyContentArticleSummary): number {
  return countDefinedImages([article.source?.imageUrl]);
}

function countDefinedImages(urls: Array<string | undefined>): number {
  return new Set(urls.map((url) => url?.trim()).filter(Boolean)).size;
}
</script>

<template>
  <view :class="['stealth-page', visualModeClass]">
    <view class="stealth-stack">
      <view class="stealth-sheet stealth-daily-table">
        <view class="stealth-sheet-title">
          <text>内部日报</text>
          <text class="stealth-sheet-meta">{{ statusText }}</text>
        </view>
        <view class="stealth-table-head">
          <text class="stealth-cell">栏目</text>
          <text class="stealth-cell">标题</text>
          <text class="stealth-cell stealth-cell-number">配图</text>
          <text class="stealth-cell stealth-cell-action">操作</text>
        </view>
        <text v-if="loading" class="stealth-status-row">同步中</text>
        <text v-else-if="feedback" class="stealth-status-row">
          {{ feedback === "暂无记录" ? "暂无记录" : "数据读取失败" }}
        </text>
        <view
          v-for="row in rows"
          v-else
          :key="`${row.kind}:${row.id}`"
          class="stealth-row"
          @tap="openRow(row)"
        >
          <text class="stealth-cell">{{ row.sectionLabel }}</text>
          <text class="stealth-cell">
            <text class="stealth-title-two-line">{{ row.title }}</text>
          </text>
          <text class="stealth-cell stealth-cell-number">{{ row.imageCount }}</text>
          <view class="stealth-cell stealth-cell-action">
            <text class="stealth-text-button" @tap.stop="openRow(row)">查看</text>
          </view>
        </view>
      </view>

      <view v-if="issue" class="stealth-sheet stealth-field-table">
        <view class="stealth-sheet-title">
          <text>发布信息</text>
          <text class="stealth-sheet-meta">只读</text>
        </view>
        <view class="stealth-row">
          <text class="stealth-cell stealth-cell-label">标题</text>
          <text class="stealth-cell">{{ issue.title }}</text>
          <text class="stealth-cell stealth-cell-time">日报</text>
        </view>
        <view class="stealth-row">
          <text class="stealth-cell stealth-cell-label">发布时间</text>
          <text class="stealth-cell">{{ formatDisplayTime(issue.publishedAt) }}</text>
          <text class="stealth-cell stealth-cell-time">公开</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style>
@import "./stealth-table.css";
</style>
