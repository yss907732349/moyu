<script setup lang="ts">
import { useVisualModePage } from "../../services/visual-mode";
import { ref } from "vue";
import {
  COMMUNITY_SECTION_LABELS,
  COMMUNITY_SECTION_KEYS,
  CommunityPostSort,
  CommunitySectionKey,
  type CommunitySectionKey as CommunitySectionKeyValue,
  type CommunityPostSummary
} from "@moyuxia/shared";
import { onShow } from "@dcloudio/uni-app";
import { listCommunityPosts } from "../../services/community-lite";
const { visualModeClass } = useVisualModePage({ forceMode: "workplace" });

const posts = ref<CommunityPostSummary[]>([]);
const loading = ref(false);
const feedback = ref("同步中");
const activeSection = ref<CommunitySectionKeyValue>(CommunitySectionKey.Recommended);
const sections = COMMUNITY_SECTION_KEYS.map((key) => ({
  key,
  label: COMMUNITY_SECTION_LABELS[key]
}));

onShow(() => {
  void loadPosts();
});

async function loadPosts(): Promise<void> {
  loading.value = true;
  feedback.value = "同步中";

  try {
    const response = await listCommunityPosts({
      sectionKey: activeSection.value,
      sort: CommunityPostSort.Latest,
      limit: 20
    });
    posts.value = response.posts;
    feedback.value = response.posts.length === 0 ? "暂无记录" : "";
  } catch (error) {
    posts.value = [];
    feedback.value = error instanceof Error ? error.message : "数据读取失败";
  } finally {
    loading.value = false;
  }
}

function switchSection(sectionKey: CommunitySectionKeyValue): void {
  if (activeSection.value === sectionKey) {
    return;
  }

  activeSection.value = sectionKey;
  void loadPosts();
}

function sectionLabel(post: CommunityPostSummary): string {
  return COMMUNITY_SECTION_LABELS[post.sectionKey] ?? "分区";
}

function openPost(post: CommunityPostSummary): void {
  uni.navigateTo({
    url: `/pages/stealth-workbench/forum-detail?postId=${encodeURIComponent(post.id)}`
  });
}
</script>

<template>
  <view :class="['stealth-page', visualModeClass]">
    <view class="stealth-stack">
      <view class="stealth-sheet stealth-forum-table">
        <view class="stealth-sheet-title">
          <text>讨论记录</text>
          <text class="stealth-sheet-meta">
            {{ loading ? "同步中" : feedback || `${posts.length} 条` }}
          </text>
        </view>
        <view class="stealth-filter-row">
          <text
            v-for="section in sections"
            :key="section.key"
            :class="[
              'stealth-text-button',
              'stealth-filter-button',
              activeSection === section.key ? 'stealth-text-button-active' : ''
            ]"
            @tap="switchSection(section.key)"
          >
            {{ section.label }}
          </text>
        </view>
        <view class="stealth-table-head">
          <text class="stealth-cell">分区</text>
          <text class="stealth-cell">标题</text>
          <text class="stealth-cell stealth-cell-number">标</text>
          <text class="stealth-cell stealth-cell-number">评</text>
          <text class="stealth-cell stealth-cell-number">档</text>
          <text class="stealth-cell stealth-cell-action">操作</text>
        </view>
        <text v-if="loading" class="stealth-status-row">同步中</text>
        <text v-else-if="feedback" class="stealth-status-row">
          {{ feedback === "暂无记录" ? "暂无记录" : "数据读取失败" }}
        </text>
        <view v-for="post in posts" v-else :key="post.id" class="stealth-row" @tap="openPost(post)">
          <text class="stealth-cell">{{ sectionLabel(post) }}</text>
          <text class="stealth-cell">
            <text class="stealth-title-two-line">
              {{ post.title
              }}{{ post.mediaAssets.length > 0 ? ` | 附件 ${post.mediaAssets.length}` : "" }}
            </text>
          </text>
          <text class="stealth-cell stealth-cell-number">{{ post.stats.likeCount }}</text>
          <text class="stealth-cell stealth-cell-number">{{ post.stats.commentCount }}</text>
          <text class="stealth-cell stealth-cell-number">{{ post.stats.favoriteCount }}</text>
          <view class="stealth-cell stealth-cell-action">
            <text class="stealth-text-button" @tap.stop="openPost(post)">查看</text>
          </view>
        </view>
      </view>

      <view class="stealth-sheet stealth-field-table">
        <view class="stealth-sheet-title">
          <text>列表说明</text>
          <text class="stealth-sheet-meta">只读</text>
        </view>
        <view class="stealth-row">
          <text class="stealth-cell stealth-cell-label">排序</text>
          <text class="stealth-cell">按最新公开记录读取</text>
          <text class="stealth-cell stealth-cell-time">公开</text>
        </view>
        <view class="stealth-row">
          <text class="stealth-cell stealth-cell-label">附件</text>
          <text class="stealth-cell">列表仅显示数量</text>
          <text class="stealth-cell stealth-cell-time">隐藏</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style>
@import "./stealth-table.css";
</style>
