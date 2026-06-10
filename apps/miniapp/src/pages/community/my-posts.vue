<script setup lang="ts">
import { useVisualModePage } from "../../services/visual-mode";

const { visualModeClass } = useVisualModePage();
const entries = [
  {
    title: "审核中帖子",
    desc: "查看仍在审核队列中的发帖",
    countLabel: "待处理",
    route: "/pages/community/my-posts-pending"
  },
  {
    title: "已审核帖子",
    desc: "查看已公开、未通过或已隐藏的发帖",
    countLabel: "结果",
    route: "/pages/community/my-posts-reviewed"
  },
  {
    title: "我的评论",
    desc: "查看自己发出的评论及审核状态",
    countLabel: "评论",
    route: "/pages/community/my-comments"
  },
  {
    title: "我的回复",
    desc: "查看自己发出的回复及审核状态",
    countLabel: "回复",
    route: "/pages/community/my-replies"
  },
  {
    title: "收藏帖子",
    desc: "查看仍公开可见的收藏内容",
    countLabel: "收藏",
    route: "/pages/community/my-favorites"
  }
] as const;

function openEntry(route: string): void {
  uni.navigateTo({ url: route });
}
</script>

<template>
  <view :class="['vs-page', 'vs-stack', visualModeClass]">
    <view class="page-header">
      <text class="page-title">我的论坛</text>
      <text class="page-desc">帖子、评论、回复和收藏已拆分为独立页面。</text>
    </view>

    <view
      v-for="entry in entries"
      :key="entry.route"
      class="vs-panel entry-card"
      @tap="openEntry(entry.route)"
    >
      <view class="entry-main">
        <text class="entry-title">{{ entry.title }}</text>
        <text class="entry-desc">{{ entry.desc }}</text>
      </view>
      <view class="entry-badge">
        <text>{{ entry.countLabel }}</text>
      </view>
    </view>
  </view>
</template>

<style>
.vs-page {
  min-height: 100vh;
  background: var(--camp-page-background);
}

.page-header,
.entry-card,
.entry-main {
  display: flex;
  flex-direction: column;
}
.page-header {
  gap: 8rpx;
}
.page-title {
  color: var(--camp-text-strong);
  font-size: 34rpx;
  font-weight: 900;
}
.page-desc,
.entry-desc {
  color: var(--camp-text-soft);
  font-size: 22rpx;
  line-height: 1.45;
}
.entry-card {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  border: 1rpx solid var(--camp-border) !important;
  border-radius: 14rpx !important;
  background: var(--camp-card) !important;
  box-shadow:
    inset 1rpx 1rpx 0 rgba(255, 255, 255, 0.08),
    inset -1rpx -1rpx 0 rgba(0, 0, 0, 0.42),
    0 2rpx 12rpx rgba(0, 0, 0, 0.32) !important;
}
.entry-main {
  min-width: 0;
  gap: 6rpx;
}
.entry-title {
  color: var(--camp-text-strong);
  font-size: 26rpx;
  font-weight: 900;
}
.entry-badge {
  min-width: 72rpx;
  min-height: 42rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1rpx solid rgba(154, 106, 22, 0.42);
  border-radius: 8rpx;
  background: rgba(154, 106, 22, 0.1);
  flex-shrink: 0;
}
.entry-badge text {
  color: var(--camp-gold);
  font-size: 18rpx;
  font-weight: 900;
}
</style>
