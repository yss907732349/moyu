<script setup lang="ts">
import { useVisualModePage } from "../../services/visual-mode";
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import type { CommunityPostSummary } from "@moyuxia/shared";
import { listMyCommunityPosts } from "../../services/community-lite";

const { visualModeClass } = useVisualModePage();

const favorites = ref<CommunityPostSummary[]>([]);
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
    favorites.value = response.favorites ?? [];
  } catch (error) {
    feedbackMessage.value = error instanceof Error ? error.message : "收藏帖子暂时不可用";
  } finally {
    loading.value = false;
  }
}

function openPost(post: CommunityPostSummary): void {
  uni.navigateTo({ url: `/pages/community/detail?postId=${encodeURIComponent(post.id)}` });
}
</script>

<template>
  <view :class="['vs-page', 'vs-stack', visualModeClass]">
    <view class="page-header">
      <text class="page-title">收藏帖子</text>
      <text class="loading-text">{{ loading ? "同步中" : `${favorites.length} 条` }}</text>
    </view>
    <text v-if="feedbackMessage" class="feedback-text">{{ feedbackMessage }}</text>
    <view v-if="!loading && favorites.length === 0" class="vs-panel empty-state">
      <text>暂无收藏帖子</text>
    </view>
    <view v-for="post in favorites" :key="post.id" class="vs-panel post-card" @tap="openPost(post)">
      <text class="post-title">{{ post.title }}</text>
      <text class="post-desc">{{ post.excerpt }}</text>
      <text class="post-meta">
        赞 {{ post.stats.likeCount }} · 评 {{ post.stats.commentCount }}
      </text>
    </view>
  </view>
</template>

<style src="./my-community-list.css"></style>
