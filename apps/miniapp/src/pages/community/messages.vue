<script setup lang="ts">
import { useVisualModePage } from "../../services/visual-mode";
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { formatDisplayTime, type CommunityNotification } from "@moyuxia/shared";
import { getAppAuthToken } from "../../services/auth";
import {
  isCommunityIdentityError,
  listCommunityMessages,
  markAllCommunityMessagesRead,
  markCommunityMessageRead
} from "../../services/community-lite";

const { visualModeClass } = useVisualModePage();

const messages = ref<CommunityNotification[]>([]);
const unreadCount = ref(0);
const loading = ref(false);
const feedbackMessage = ref("");
const identityActionVisible = ref(false);

onShow(() => {
  void refreshMessages();
});

async function refreshMessages(): Promise<void> {
  if (!getAppAuthToken()) {
    messages.value = [];
    unreadCount.value = 0;
    feedbackMessage.value = "请先登录并创建隐者档案后查看社区消息";
    identityActionVisible.value = true;
    return;
  }

  loading.value = true;
  feedbackMessage.value = "";
  identityActionVisible.value = false;
  try {
    const response = await listCommunityMessages();
    messages.value = response.messages;
    unreadCount.value = response.unreadCount;
  } catch (error) {
    messages.value = [];
    unreadCount.value = 0;
    identityActionVisible.value = isCommunityIdentityError(error);
    feedbackMessage.value = identityActionVisible.value
      ? "请先登录并创建隐者档案后查看社区消息"
      : error instanceof Error
        ? error.message
        : "社区消息暂时不可用";
  } finally {
    loading.value = false;
  }
}

async function openPost(message: CommunityNotification): Promise<void> {
  if (!message.readAt) {
    await markCommunityMessageRead(message.id);
  }
  if (!message.postId) {
    await refreshMessages();
    return;
  }
  uni.navigateTo({ url: `/pages/community/detail?postId=${encodeURIComponent(message.postId)}` });
}

async function markAllRead(): Promise<void> {
  if (messages.value.length === 0) {
    return;
  }
  await markAllCommunityMessagesRead();
  await refreshMessages();
}

function goProfile(): void {
  uni.switchTab({ url: "/pages/profile/index" });
}

function notificationTypeLabel(type: string): string {
  const map: Record<string, string> = {
    like: "点赞",
    favorite: "收藏",
    comment: "评论",
    reply: "回复",
    post_review_approved: "帖子通过",
    post_review_rejected: "帖子驳回",
    comment_review_approved: "评论通过",
    comment_review_rejected: "评论驳回",
    reply_review_approved: "回复通过",
    reply_review_rejected: "回复驳回",
    report_handled: "举报处理"
  };
  return map[type] ?? "通知";
}
</script>

<template>
  <view :class="['vs-page', 'vs-stack', visualModeClass]">
    <view class="vs-row-between page-header">
      <text class="page-title">消息</text>
      <text class="loading-text">{{ loading ? "同步中" : `${unreadCount} 未读` }}</text>
    </view>
    <button class="read-all-button" :disabled="unreadCount === 0" @tap="markAllRead">
      全部已读
    </button>

    <text v-if="feedbackMessage" class="feedback-text">{{ feedbackMessage }}</text>
    <button v-if="identityActionVisible" class="read-all-button" @tap="goProfile">
      去登录/建档
    </button>

    <view v-if="!loading && messages.length === 0 && !feedbackMessage" class="vs-panel empty-state">
      <text>暂无社区通知</text>
    </view>

    <view
      v-for="message in messages"
      :key="message.id"
      class="vs-panel message-card"
      :class="{ unread: !message.readAt }"
      @tap="openPost(message)"
    >
      <view class="vs-row-between">
        <text class="actor-name">{{ message.actor?.displayName || message.title }}</text>
        <text class="message-type">{{ notificationTypeLabel(message.type) }}</text>
      </view>
      <text class="message-text">{{ message.body }}</text>
      <text class="post-link">{{ message.postTitle || formatDisplayTime(message.createdAt) }}</text>
    </view>
  </view>
</template>

<style>
.page-title {
  color: var(--camp-text-strong);
  font-size: 34rpx;
  font-weight: 900;
}
.loading-text,
.feedback-text,
.message-text,
.post-link,
.empty-state {
  color: #8b90b0;
  font-size: 22rpx;
  line-height: 1.45;
}
.feedback-text,
.message-type,
.post-link {
  color: #9a6a16;
}
.empty-state {
  min-height: 180rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.message-card {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.message-card.unread {
  border-color: rgba(154, 106, 22, 0.52);
}
.read-all-button {
  min-height: 64rpx;
  border: 2rpx solid var(--vs-button-border);
  border-radius: 4rpx;
  background: var(--vs-button-bg);
  color: var(--vs-button-text);
  font-family: var(--vs-font-display);
  font-size: 22rpx;
  font-weight: 900;
  box-shadow:
    inset 0 -3rpx 0 rgba(0, 0, 0, 0.18),
    3rpx 3rpx 0 rgba(0, 0, 0, 0.32);
}

.read-all-button::after {
  border: 0;
}

.read-all-button:active {
  transform: translate(3rpx, 3rpx);
  box-shadow:
    inset 0 -2rpx 0 rgba(0, 0, 0, 0.16),
    1rpx 1rpx 0 rgba(0, 0, 0, 0.28);
}

.read-all-button[disabled] {
  border-color: rgba(255, 255, 255, 0.12);
  background: #181c32;
  color: #6b7194;
  box-shadow: 2rpx 2rpx 0 rgba(0, 0, 0, 0.24);
}
.actor-name {
  color: var(--camp-text-strong);
  font-size: 26rpx;
  font-weight: 900;
}
.message-type {
  font-size: 20rpx;
  font-weight: 900;
}
</style>
