<script setup lang="ts">
import { useVisualModePage } from "../../services/visual-mode";
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { CommunityCommentStatus, type CommunityMyCommentSummary } from "@moyuxia/shared";
import { listMyCommunityPosts } from "../../services/community-lite";

const { visualModeClass } = useVisualModePage();

const comments = ref<CommunityMyCommentSummary[]>([]);
const loading = ref(false);
const feedbackMessage = ref("");

onShow(() => {
  void refresh();
});

async function refresh(): Promise<void> {
  loading.value = true;
  feedbackMessage.value = "";
  try {
    const response = await listMyCommunityPosts();
    comments.value = response.comments ?? [];
  } catch (error) {
    feedbackMessage.value = error instanceof Error ? error.message : "我的评论暂时不可用";
  } finally {
    loading.value = false;
  }
}

function statusText(status: string): string {
  if (status === CommunityCommentStatus.Approved) {
    return "已公开";
  }
  if (status === CommunityCommentStatus.Pending) {
    return "审核中，仅自己可见";
  }
  if (status === CommunityCommentStatus.Rejected) {
    return "未通过";
  }
  return "已隐藏";
}
</script>

<template>
  <view :class="['vs-page', 'vs-stack', visualModeClass]">
    <view class="page-header">
      <text class="page-title">我的评论</text>
      <text class="loading-text">{{ loading ? "同步中" : `${comments.length} 条` }}</text>
    </view>
    <text v-if="feedbackMessage" class="feedback-text">{{ feedbackMessage }}</text>
    <view v-if="!loading && comments.length === 0" class="vs-panel empty-state">
      <text>暂无评论</text>
    </view>
    <view v-for="comment in comments" :key="comment.id" class="vs-panel post-card">
      <view class="vs-row-between">
        <text class="post-title">评论</text>
        <text class="status-text">{{ statusText(comment.status) }}</text>
      </view>
      <text class="post-desc">{{ comment.body }}</text>
      <text v-if="comment.status === CommunityCommentStatus.Pending" class="post-meta">
        审核通过后其他隐者可见
      </text>
      <text v-if="comment.reviewNote" class="post-meta">{{ comment.reviewNote }}</text>
    </view>
  </view>
</template>

<style src="./my-community-list.css"></style>
