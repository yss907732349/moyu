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

const pendingPosts = computed(() =>
  posts.value.filter((post) => post.status === CommunityPostStatus.Pending)
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
    feedbackMessage.value = error instanceof Error ? error.message : "审核中帖子暂时不可用";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <view :class="['vs-page', 'vs-stack', visualModeClass]">
    <view class="page-header">
      <text class="page-title">审核中帖子</text>
      <text class="loading-text">{{ loading ? "同步中" : `${pendingPosts.length} 条` }}</text>
    </view>
    <text v-if="feedbackMessage" class="feedback-text">{{ feedbackMessage }}</text>
    <view v-if="!loading && pendingPosts.length === 0" class="vs-panel empty-state">
      <text>暂无审核中帖子</text>
    </view>
    <view v-for="post in pendingPosts" :key="post.id" class="vs-panel post-card">
      <view class="vs-row-between">
        <text class="post-title">{{ post.title }}</text>
        <text class="status-text">审核中，仅自己可见</text>
      </view>
      <text class="post-desc">{{ post.excerpt }}</text>
      <text class="post-meta">审核通过后其他隐者可见</text>
    </view>
  </view>
</template>

<style src="./my-community-list.css"></style>
