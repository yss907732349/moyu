<script setup lang="ts">
import { useVisualModePage } from "../../services/visual-mode";
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { CommunityCommentStatus, type CommunityMyReplySummary } from "@moyuxia/shared";
import { listMyCommunityPosts } from "../../services/community-lite";

const { visualModeClass } = useVisualModePage();

const replies = ref<CommunityMyReplySummary[]>([]);
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
    replies.value = response.replies ?? [];
  } catch (error) {
    feedbackMessage.value = error instanceof Error ? error.message : "我的回复暂时不可用";
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
      <text class="page-title">我的回复</text>
      <text class="loading-text">{{ loading ? "同步中" : `${replies.length} 条` }}</text>
    </view>
    <text v-if="feedbackMessage" class="feedback-text">{{ feedbackMessage }}</text>
    <view v-if="!loading && replies.length === 0" class="vs-panel empty-state">
      <text>暂无回复</text>
    </view>
    <view v-for="reply in replies" :key="reply.id" class="vs-panel post-card">
      <view class="vs-row-between">
        <text class="post-title">回复</text>
        <text class="status-text">{{ statusText(reply.status) }}</text>
      </view>
      <text class="post-desc">{{ reply.body }}</text>
      <text v-if="reply.status === CommunityCommentStatus.Pending" class="post-meta">
        审核通过后其他隐者可见
      </text>
      <text v-if="reply.reviewNote" class="post-meta">{{ reply.reviewNote }}</text>
    </view>
  </view>
</template>

<style src="./my-community-list.css"></style>
