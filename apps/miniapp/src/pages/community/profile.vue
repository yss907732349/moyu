<script setup lang="ts">
import { useVisualModePage } from "../../services/visual-mode";
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import {
  CommunityFollowState,
  CommunityLiteErrorCode,
  formatDisplayTime,
  type CommunityPublicProfilePage,
  type CommunityPublicPostListItem
} from "@moyuxia/shared";
import {
  CommunityLiteClientError,
  followCommunityPublicProfile,
  getCommunityPublicProfilePage,
  unfollowCommunityPublicProfile
} from "../../services/community-lite";
import { resolveProfileAvatarPathByKey } from "../../services/profile-assets";

const { visualModeClass } = useVisualModePage();

type PageState = "loading" | "ready" | "error";

const publicProfileId = ref("");
const profile = ref<CommunityPublicProfilePage | null>(null);
const pageState = ref<PageState>("loading");
const feedbackMessage = ref("");
const followingChanging = ref(false);
const postsLoading = ref(false);

const isSelfProfile = computed(
  () => profile.value?.viewerFollowState === CommunityFollowState.Self
);

const followButtonText = computed(() => {
  if (isSelfProfile.value) {
    return "我的角色";
  }
  if (followingChanging.value) {
    return "处理中";
  }
  return profile.value?.viewerFollowState === CommunityFollowState.Following ? "取消关注" : "关注";
});

onLoad((query: { publicProfileId?: string } = {}) => {
  publicProfileId.value = query.publicProfileId ?? "";
  if (!publicProfileId.value) {
    pageState.value = "error";
    feedbackMessage.value = "该隐者主页暂不可访问";
    return;
  }

  void loadProfile(true);
});

async function loadProfile(reset = false): Promise<void> {
  if (!publicProfileId.value || postsLoading.value) {
    return;
  }

  postsLoading.value = true;
  if (reset) {
    pageState.value = "loading";
    feedbackMessage.value = "";
  }

  try {
    const response = await getCommunityPublicProfilePage(publicProfileId.value, {
      cursor: reset ? undefined : profile.value?.nextCursor,
      limit: 10
    });
    profile.value =
      !reset && profile.value
        ? {
            ...response.profile,
            posts: [...profile.value.posts, ...response.profile.posts]
          }
        : response.profile;
    pageState.value = "ready";
  } catch (error) {
    pageState.value = "error";
    feedbackMessage.value = normalizeProfileError(error);
  } finally {
    postsLoading.value = false;
  }
}

async function toggleFollow(): Promise<void> {
  if (!profile.value || followingChanging.value) {
    return;
  }

  if (isSelfProfile.value) {
    uni.navigateTo({ url: "/pages/profile/role" });
    return;
  }

  if (profile.value.viewerFollowState === CommunityFollowState.Following) {
    const confirmed = await confirmUnfollow();
    if (!confirmed) {
      return;
    }
  }

  const previousProfile = profile.value;
  followingChanging.value = true;
  feedbackMessage.value = "";

  try {
    const response =
      profile.value.viewerFollowState === CommunityFollowState.Following
        ? await unfollowCommunityPublicProfile(profile.value.publicProfileId)
        : await followCommunityPublicProfile(profile.value.publicProfileId);
    profile.value = {
      ...profile.value,
      viewerFollowState: response.viewerFollowState,
      stats: response.stats
    };
    uni.showToast({
      title:
        response.viewerFollowState === CommunityFollowState.Following ? "已关注" : "已取消关注",
      icon: "none"
    });
  } catch (error) {
    profile.value = previousProfile;
    feedbackMessage.value = normalizeFollowActionError(error);
  } finally {
    followingChanging.value = false;
  }
}

function confirmUnfollow(): Promise<boolean> {
  return new Promise((resolve) => {
    uni.showModal({
      title: "取消关注",
      content: "确认不再关注这位隐者？",
      confirmText: "取消关注",
      cancelText: "再看看",
      success(result) {
        resolve(Boolean(result.confirm));
      },
      fail() {
        resolve(false);
      }
    });
  });
}

function openFollowList(type: "following" | "followers"): void {
  if (!profile.value) {
    return;
  }

  uni.navigateTo({
    url: `/pages/community/follow-list?publicProfileId=${encodeURIComponent(
      profile.value.publicProfileId
    )}&type=${type}`
  });
}

function openPost(post: CommunityPublicPostListItem): void {
  uni.navigateTo({ url: `/pages/community/detail?postId=${encodeURIComponent(post.id)}` });
}

function avatarPath(): string {
  const identity = profile.value?.identity;
  return identity ? resolveProfileAvatarPathByKey(identity.avatarKey, identity.faction) : "";
}

function compactCount(value: number): string {
  if (value >= 10000) {
    return "9999+";
  }
  return String(value);
}

function normalizeProfileError(error: unknown): string {
  if (error instanceof CommunityLiteClientError) {
    if (error.errorCode === "unauthenticated") {
      return "请先登录后查看隐者主页";
    }
    if (error.errorCode === CommunityLiteErrorCode.ProfileRequired) {
      return "请先创建隐者档案后查看隐者主页";
    }
    if (error.errorCode === CommunityLiteErrorCode.PublicProfileNotAccessible) {
      return "该隐者主页暂不可访问";
    }
  }

  return error instanceof Error ? error.message : "隐者主页暂不可用";
}

function normalizeFollowActionError(error: unknown): string {
  if (error instanceof CommunityLiteClientError) {
    if (error.errorCode === "unauthenticated") {
      return "请先登录后再操作";
    }
    if (error.errorCode === CommunityLiteErrorCode.ProfileRequired) {
      return "请先创建隐者档案后再操作";
    }
    if (error.errorCode === CommunityLiteErrorCode.PublicProfileNotAccessible) {
      return "该隐者主页暂不可访问";
    }
  }

  return "操作暂未成功，请稍后再试";
}
</script>

<template>
  <view :class="['vs-page', 'vs-stack', 'profile-page', visualModeClass]">
    <view v-if="pageState === 'loading'" class="vs-panel vs-card-raised empty-state">
      <view class="profile-skeleton">
        <view class="skeleton-avatar" />
        <view class="skeleton-copy">
          <view class="skeleton-line skeleton-line-strong" />
          <view class="skeleton-line" />
          <view class="skeleton-line skeleton-line-short" />
        </view>
      </view>
      <text class="empty-title">正在读取隐者名片</text>
      <text class="empty-desc">稍等片刻。</text>
    </view>

    <view v-else-if="pageState === 'error'" class="vs-panel vs-card-raised empty-state">
      <text class="empty-title">主页暂不可访问</text>
      <text class="empty-desc">{{ feedbackMessage }}</text>
      <button class="primary-button" @tap="loadProfile(true)">重试</button>
    </view>

    <template v-else-if="profile">
      <view class="vs-panel vs-card-raised hero-card">
        <view class="card-kicker-row">
          <text class="card-kicker">隐者名片</text>
          <text v-if="profile.ipLocationLabel" class="ip-location">
            IP属地：{{ profile.ipLocationLabel }}
          </text>
        </view>
        <view class="hero-main">
          <view class="avatar-frame">
            <image :src="avatarPath()" mode="aspectFill" />
          </view>
          <view class="identity-copy">
            <text class="display-name">{{ profile.identity.displayName }}</text>
            <text class="identity-meta">
              {{ profile.identity.factionLabel }} · LV.{{ profile.identity.level }} ·
              {{ profile.identity.titleLabel }}
            </text>
          </view>
          <button
            class="follow-button"
            :class="{
              'follow-button-muted': profile.viewerFollowState === CommunityFollowState.Following,
              'follow-button-self': isSelfProfile
            }"
            :disabled="followingChanging"
            @tap="toggleFollow"
          >
            <text class="follow-button-label">{{ followButtonText }}</text>
          </button>
        </view>

        <view class="stats-row">
          <view class="stat-item" @tap="openFollowList('following')">
            <text class="stat-value">{{ compactCount(profile.stats.followingCount) }}</text>
            <text class="stat-label">关注</text>
          </view>
          <view class="stat-item" @tap="openFollowList('followers')">
            <text class="stat-value">{{ compactCount(profile.stats.followerCount) }}</text>
            <text class="stat-label">粉丝</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ compactCount(profile.stats.publicPostCount) }}</text>
            <text class="stat-label">公开帖</text>
          </view>
        </view>
      </view>

      <text v-if="feedbackMessage" class="feedback-text">{{ feedbackMessage }}</text>

      <view class="vs-panel vs-card-raised posts-card">
        <view class="section-head">
          <text class="section-title">公开帖子</text>
          <text class="section-count">{{ profile.posts.length }}</text>
        </view>
        <view v-if="profile.posts.length === 0" class="empty-posts">
          <text class="empty-posts-title">暂无公开帖子</text>
          <text class="empty-posts-desc">这里会展示已公开通过的帖子。</text>
        </view>
        <view v-for="post in profile.posts" :key="post.id" class="post-item" @tap="openPost(post)">
          <view class="post-copy">
            <text class="post-title">{{ post.title }}</text>
            <text class="post-excerpt">{{ post.excerpt }}</text>
            <view class="post-meta-row">
              <text>{{ post.sectionLabel }}</text>
              <text>{{ formatDisplayTime(post.approvedAt || post.createdAt) }}</text>
              <text>{{ post.stats.likeCount }} 赞</text>
            </view>
          </view>
          <image
            v-if="post.mediaAssets[0]"
            class="post-thumb"
            :src="post.mediaAssets[0].thumbnailUrl || post.mediaAssets[0].url"
            mode="aspectFill"
          />
        </view>
        <button
          v-if="profile.nextCursor"
          class="load-more"
          :disabled="postsLoading"
          @tap="loadProfile(false)"
        >
          {{ postsLoading ? "加载中" : "加载更多" }}
        </button>
        <text v-else-if="profile.posts.length > 0" class="end-hint">没有更多公开帖子</text>
      </view>
    </template>
  </view>
</template>

<style>
.profile-page {
  min-height: 100vh;
  background: var(--camp-page-background);
}

.hero-card,
.posts-card,
.empty-state {
  border: 1rpx solid var(--camp-border) !important;
  border-radius: 12rpx !important;
  background: var(--camp-card) !important;
}

.hero-card {
  position: relative;
  overflow: hidden;
  padding-top: 22rpx !important;
  background:
    radial-gradient(circle at 12% 10%, rgba(236, 178, 255, 0.12), transparent 110rpx),
    radial-gradient(circle at 88% 8%, rgba(154, 106, 22, 0.1), transparent 120rpx),
    linear-gradient(180deg, #1d1930 0%, var(--camp-card) 68%, #161626 100%) !important;
  box-shadow:
    inset 0 0 0 1rpx rgba(255, 255, 255, 0.06),
    inset 0 -18rpx 30rpx rgba(0, 0, 0, 0.18),
    0 10rpx 24rpx rgba(0, 0, 0, 0.28) !important;
}

.card-kicker-row {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
  margin-bottom: 16rpx;
}

.card-kicker {
  flex-shrink: 0;
  color: var(--camp-gold);
  font-size: 20rpx;
  font-weight: 900;
  letter-spacing: 0;
}

.hero-main {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 18rpx;
  min-width: 0;
}

.avatar-frame {
  width: 116rpx;
  height: 116rpx;
  flex-shrink: 0;
  overflow: hidden;
  border: 2rpx solid rgba(236, 178, 255, 0.48);
  border-radius: 50%;
  box-shadow: 0 0 14rpx rgba(189, 0, 255, 0.2);
}

.avatar-frame image {
  width: 100%;
  height: 100%;
}

.identity-copy,
.post-copy,
.empty-state {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8rpx;
}

.identity-copy {
  flex: 1 1 0;
}

.display-name {
  display: block;
  overflow: hidden;
  color: var(--camp-text-strong);
  font-size: 34rpx;
  font-weight: 900;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.identity-meta,
.ip-location,
.empty-desc,
.feedback-text {
  display: block;
  overflow: hidden;
  color: var(--camp-text-soft);
  font-size: 21rpx;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ip-location {
  max-width: 280rpx;
  color: rgba(157, 139, 160, 0.82);
  font-size: 19rpx;
  text-align: right;
}

.follow-button,
.primary-button,
.load-more {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  border-radius: 8rpx;
  font-size: 24rpx;
  font-weight: 900;
}

.follow-button {
  width: 168rpx;
  height: 58rpx;
  min-width: 168rpx;
  min-height: 58rpx;
  margin-left: auto;
  padding: 0 18rpx;
  box-sizing: border-box;
  flex-shrink: 0;
  overflow: hidden;
  background: var(--vs-button-bg);
  color: var(--vs-button-text);
  line-height: 1;
}

.follow-button-label {
  display: block;
  width: 100%;
  overflow: hidden;
  line-height: 1;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.follow-button-muted {
  border: 1rpx solid rgba(236, 178, 255, 0.38);
  background: rgba(236, 178, 255, 0.08);
  color: var(--camp-primary);
}

.follow-button-self {
  border-color: rgba(236, 178, 255, 0.24);
  background: rgba(236, 178, 255, 0.06);
  color: var(--camp-text-soft);
}

.follow-button[disabled] {
  opacity: 0.72;
}

.follow-button::after,
.primary-button::after,
.load-more::after {
  border: 0;
}

.follow-button:active,
.stat-item:active,
.post-item:active {
  opacity: 0.78;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  margin-top: 22rpx;
  border-top: 1rpx solid var(--camp-border);
}

.stat-item {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  padding: 18rpx 8rpx 0;
  border-right: 1rpx solid rgba(255, 255, 255, 0.06);
}

.stat-item:last-child {
  border-right: 0;
}

.stat-value {
  overflow: hidden;
  max-width: 100%;
  color: var(--camp-gold);
  font-family: var(--vs-font-display);
  font-size: 30rpx;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-label,
.section-count {
  color: var(--camp-text-soft);
  font-size: 20rpx;
}

.feedback-text {
  color: var(--camp-gold);
}

.section-head,
.post-meta-row {
  display: flex;
  align-items: center;
}

.section-head {
  justify-content: space-between;
}

.section-title,
.empty-title {
  color: var(--camp-text-strong);
  font-size: 28rpx;
  font-weight: 900;
}

.empty-posts {
  display: flex;
  min-height: 128rpx;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 28rpx 0;
  color: var(--camp-text-soft);
  font-size: 22rpx;
  text-align: center;
}

.empty-posts-title {
  color: var(--camp-text);
  font-size: 24rpx;
  font-weight: 900;
}

.empty-posts-desc,
.end-hint {
  color: var(--camp-text-soft);
  font-size: 20rpx;
}

.end-hint {
  display: block;
  padding-top: 18rpx;
  text-align: center;
}

.post-item {
  display: flex;
  gap: 14rpx;
  padding: 18rpx 0;
  border-top: 1rpx solid rgba(255, 255, 255, 0.08);
}

.post-title {
  display: block;
  overflow: hidden;
  color: var(--camp-text);
  font-size: 25rpx;
  font-weight: 900;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-excerpt {
  display: -webkit-box;
  overflow: hidden;
  color: var(--camp-text-soft);
  font-size: 21rpx;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  word-break: break-all;
}

.post-meta-row {
  min-width: 0;
  gap: 12rpx;
  color: var(--camp-text-soft);
  font-size: 19rpx;
}

.post-meta-row text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-thumb {
  width: 128rpx;
  height: 96rpx;
  flex-shrink: 0;
  border-radius: 8rpx;
  background: #111827;
}

.primary-button,
.load-more {
  min-height: 62rpx;
  border: 1rpx solid var(--vs-button-ghost-border);
  background: var(--vs-button-ghost-bg);
  color: var(--vs-button-ghost-text);
}

.vs-mode-workplace .hero-card {
  overflow: hidden;
  padding: 26rpx 24rpx 22rpx !important;
  border: 1rpx solid rgba(216, 201, 180, 0.92) !important;
  border-radius: 12rpx !important;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 253, 248, 0.94) 100%), #fffdf8 !important;
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.92),
    0 4rpx 10rpx rgba(17, 24, 39, 0.08),
    0 12rpx 24rpx rgba(17, 24, 39, 0.1) !important;
}

.vs-mode-workplace .hero-card::before,
.vs-mode-workplace .hero-card::after {
  position: absolute;
  left: 24rpx;
  right: 24rpx;
  z-index: 1;
  height: 4rpx;
  pointer-events: none;
  content: "";
  border-radius: 999rpx;
  background: linear-gradient(
    90deg,
    rgba(154, 106, 22, 0.68) 0%,
    rgba(154, 106, 22, 0.68) 22%,
    rgba(47, 111, 115, 0.12) 22%,
    rgba(47, 111, 115, 0.12) 100%
  );
}

.vs-mode-workplace .hero-card::before {
  top: 0;
}

.vs-mode-workplace .hero-card::after {
  bottom: 0;
  opacity: 0.45;
}

.vs-mode-workplace .card-kicker {
  color: #9a6a16;
}

.vs-mode-workplace .ip-location,
.vs-mode-workplace .identity-meta,
.vs-mode-workplace .stat-label {
  color: #665c50;
  text-shadow: none;
}

.vs-mode-workplace .display-name {
  color: #17130f;
  text-shadow: none;
}

.vs-mode-workplace .avatar-frame {
  border-color: rgba(216, 201, 180, 0.88);
  background: #fffdf8;
  box-shadow:
    0 0 0 4rpx rgba(245, 239, 228, 0.84),
    0 8rpx 16rpx rgba(17, 24, 39, 0.08);
}

.vs-mode-workplace .follow-button {
  border: 1rpx solid #b87912 !important;
  border-radius: 6rpx !important;
  background: #f7a516;
  color: #17130f;
  text-shadow: none;
  box-shadow:
    0 4rpx 0 #b87912,
    0 9rpx 16rpx rgba(154, 106, 22, 0.2) !important;
}

.vs-mode-workplace .follow-button-muted,
.vs-mode-workplace .follow-button-self {
  border-color: rgba(47, 111, 115, 0.24) !important;
  background: rgba(47, 111, 115, 0.08);
  color: #2f6f73;
  box-shadow: none !important;
}

.vs-mode-workplace .follow-button-self {
  border-color: rgba(216, 201, 180, 0.88) !important;
  background: #efe3d0;
  color: #8a7d6d;
}

.vs-mode-workplace .stats-row {
  border-top-color: rgba(216, 201, 180, 0.92);
}

.vs-mode-workplace .stat-item {
  border-right-color: rgba(216, 201, 180, 0.72);
}

.vs-mode-workplace .stat-value {
  color: #9a6a16;
  text-shadow: none;
}

.profile-skeleton {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 18rpx;
  padding-bottom: 8rpx;
}

.skeleton-avatar {
  width: 96rpx;
  height: 96rpx;
  flex-shrink: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
}

.skeleton-copy {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 12rpx;
}

.skeleton-line {
  width: 72%;
  height: 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.08);
}

.skeleton-line-strong {
  width: 88%;
  height: 24rpx;
  background: rgba(236, 178, 255, 0.12);
}

.skeleton-line-short {
  width: 44%;
}
</style>
