<script setup lang="ts">
import { useVisualModePage } from "../../services/visual-mode";
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { CommunityPostStatus, type CommunityMyPostSummary } from "@moyuxia/shared";
import { listMyCommunityPosts } from "../../services/community-lite";

const { visualModeClass } = useVisualModePage();

const posts = ref<CommunityMyPostSummary[]>([]);
const loading = ref(false);
const feedbackMessage = ref("");

const reviewedPosts = computed(() =>
  posts.value.filter((post) => post.status !== CommunityPostStatus.Pending)
);

onShow(() => {
  void refresh();
});

async function refresh(): Promise<void> {
  loading.value = true;
  feedbackMessage.value = "";
  try {
    const response = await listMyCommunityPosts();
    posts.value = response.posts;
  } catch (error) {
    feedbackMessage.value = error instanceof Error ? error.message : "已审核帖子暂时不可用";
  } finally {
    loading.value = false;
  }
}

function statusText(status: string): string {
  if (status === CommunityPostStatus.Approved) {
    return "已公开";
  }
  if (status === CommunityPostStatus.Rejected) {
    return "未通过";
  }
  return "已隐藏";
}

function openPost(post: CommunityMyPostSummary): void {
  if (post.status !== CommunityPostStatus.Approved) {
    uni.showToast({ title: post.reviewNote || "该帖子当前不可公开查看", icon: "none" });
    return;
  }
  uni.navigateTo({ url: `/pages/community/detail?postId=${encodeURIComponent(post.id)}` });
}
</script>

<template>
  <view :class="['vs-page', 'vs-stack', visualModeClass]">
    <view class="page-header">
      <text class="page-title">已审核帖子</text>
      <text class="loading-text">{{ loading ? "同步中" : `${reviewedPosts.length} 条` }}</text>
    </view>
    <text v-if="feedbackMessage" class="feedback-text">{{ feedbackMessage }}</text>
    <view v-if="!loading && reviewedPosts.length === 0" class="vs-panel empty-state">
      <text>暂无已审核帖子</text>
    </view>
    <view
      v-for="post in reviewedPosts"
      :key="post.id"
      class="vs-panel post-card"
      @tap="openPost(post)"
    >
      <view class="vs-row-between">
        <text class="post-title">{{ post.title }}</text>
        <text class="status-text">{{ statusText(post.status) }}</text>
      </view>
      <text class="post-desc">{{ post.excerpt }}</text>
      <text v-if="post.reviewNote" class="post-meta">{{ post.reviewNote }}</text>
      <text v-else class="post-meta">
        赞 {{ post.stats.likeCount }} · 评 {{ post.stats.commentCount }}
      </text>
    </view>
  </view>
</template>

<style src="./my-community-list.css"></style>
