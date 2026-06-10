<script setup lang="ts">
import { useVisualModePage } from "../../services/visual-mode";
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import {
  CommunityFollowState,
  CommunityLiteErrorCode,
  type CommunityPublicUserListItem
} from "@moyuxia/shared";
import {
  CommunityLiteClientError,
  followCommunityPublicProfile,
  listCommunityProfileFollowers,
  listCommunityProfileFollowing,
  unfollowCommunityPublicProfile
} from "../../services/community-lite";
import { resolveProfileAvatarPathByKey } from "../../services/profile-assets";

const { visualModeClass } = useVisualModePage();

type ListType = "following" | "followers";
type PageState = "loading" | "ready" | "error";

const publicProfileId = ref("");
const listType = ref<ListType>("following");
const items = ref<CommunityPublicUserListItem[]>([]);
const nextCursor = ref<string | undefined>();
const pageState = ref<PageState>("loading");
const feedbackMessage = ref("");
const loadingMore = ref(false);
const changingByProfileId = ref<Record<string, true>>({});

const pageTitle = computed(() => (listType.value === "following" ? "关注" : "粉丝"));
const emptyTitle = computed(() =>
  listType.value === "following" ? "还没有关注其他隐者" : "还没有粉丝"
);
const emptyDesc = computed(() =>
  listType.value === "following"
    ? "关注后会在这里看到对方的隐者名片。"
    : "有人关注你之后，会出现在这张名单里。"
);

onLoad((query: { publicProfileId?: string; type?: string } = {}) => {
  publicProfileId.value = query.publicProfileId ?? "";
  listType.value = query.type === "followers" ? "followers" : "following";
  if (!publicProfileId.value) {
    pageState.value = "error";
    feedbackMessage.value = "列表暂不可访问";
    return;
  }

  uni.setNavigationBarTitle({ title: pageTitle.value });
  void loadList(true);
});

async function loadList(reset = false): Promise<void> {
  if (loadingMore.value) {
    return;
  }

  loadingMore.value = true;
  if (reset) {
    pageState.value = "loading";
    feedbackMessage.value = "";
  }

  try {
    const request = { cursor: reset ? undefined : nextCursor.value, limit: 20 };
    const response =
      listType.value === "following"
        ? await listCommunityProfileFollowing(publicProfileId.value, request)
        : await listCommunityProfileFollowers(publicProfileId.value, request);
    items.value = reset ? response.items : [...items.value, ...response.items];
    nextCursor.value = response.nextCursor;
    pageState.value = "ready";
  } catch (error) {
    pageState.value = "error";
    feedbackMessage.value = normalizeListError(error);
  } finally {
    loadingMore.value = false;
  }
}

function openProfile(item: CommunityPublicUserListItem): void {
  uni.navigateTo({
    url: `/pages/community/profile?publicProfileId=${encodeURIComponent(item.publicProfileId)}`
  });
}

async function toggleFollow(item: CommunityPublicUserListItem): Promise<void> {
  if (
    item.viewerFollowState === CommunityFollowState.Self ||
    changingByProfileId.value[item.publicProfileId]
  ) {
    return;
  }

  if (item.viewerFollowState === CommunityFollowState.Following) {
    const confirmed = await confirmUnfollow(item.displayName);
    if (!confirmed) {
      return;
    }
  }

  const previousItems = items.value;
  changingByProfileId.value = { ...changingByProfileId.value, [item.publicProfileId]: true };
  feedbackMessage.value = "";
  try {
    const response =
      item.viewerFollowState === CommunityFollowState.Following
        ? await unfollowCommunityPublicProfile(item.publicProfileId)
        : await followCommunityPublicProfile(item.publicProfileId);
    items.value = items.value.map((current) =>
      current.publicProfileId === item.publicProfileId
        ? { ...current, viewerFollowState: response.viewerFollowState }
        : current
    );
    uni.showToast({
      title:
        response.viewerFollowState === CommunityFollowState.Following ? "已关注" : "已取消关注",
      icon: "none"
    });
  } catch (error) {
    items.value = previousItems;
    feedbackMessage.value = normalizeFollowActionError(error);
  } finally {
    const next = { ...changingByProfileId.value };
    delete next[item.publicProfileId];
    changingByProfileId.value = next;
  }
}

function confirmUnfollow(displayName: string): Promise<boolean> {
  const safeName = displayName.length > 12 ? `${displayName.slice(0, 12)}...` : displayName;
  return new Promise((resolve) => {
    uni.showModal({
      title: "取消关注",
      content: `确认不再关注 ${safeName}？`,
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

function avatarPath(item: CommunityPublicUserListItem): string {
  return resolveProfileAvatarPathByKey(item.avatarKey, item.faction);
}

function actionText(item: CommunityPublicUserListItem): string {
  if (changingByProfileId.value[item.publicProfileId]) {
    return "处理中";
  }
  if (item.viewerFollowState === CommunityFollowState.Self) {
    return "自己";
  }
  return item.viewerFollowState === CommunityFollowState.Following ? "已关注" : "关注";
}

function isFollowActionDisabled(item: CommunityPublicUserListItem): boolean {
  return (
    item.viewerFollowState === CommunityFollowState.Self ||
    Boolean(changingByProfileId.value[item.publicProfileId])
  );
}

function normalizeListError(error: unknown): string {
  if (error instanceof CommunityLiteClientError) {
    if (error.errorCode === "unauthenticated") {
      return "请先登录后查看列表";
    }
    if (error.errorCode === CommunityLiteErrorCode.ProfileRequired) {
      return "请先创建隐者档案后查看列表";
    }
    if (error.errorCode === CommunityLiteErrorCode.PublicProfileNotAccessible) {
      return "列表暂不可访问";
    }
  }

  return error instanceof Error ? error.message : "列表暂不可用";
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
  <view :class="['vs-page', 'vs-stack', 'follow-list-page', visualModeClass]">
    <view class="vs-panel vs-card-raised list-panel">
      <view class="list-head">
        <text class="list-title">{{ pageTitle }}</text>
        <text class="list-count">{{ items.length }}</text>
      </view>

      <view v-if="pageState === 'loading'" class="list-skeleton">
        <view v-for="index in 4" :key="index" class="skeleton-row">
          <view class="skeleton-avatar" />
          <view class="skeleton-copy">
            <view class="skeleton-line skeleton-line-strong" />
            <view class="skeleton-line" />
          </view>
          <view class="skeleton-button" />
        </view>
      </view>
      <view v-else-if="pageState === 'error'" class="empty-state">
        <text class="empty-title">列表暂不可用</text>
        <text class="empty-desc">{{ feedbackMessage }}</text>
        <button class="load-more" @tap="loadList(true)">重试</button>
      </view>
      <view v-else-if="items.length === 0" class="empty-state">
        <text class="empty-title">{{ emptyTitle }}</text>
        <text class="empty-desc">{{ emptyDesc }}</text>
      </view>

      <view v-for="item in items" :key="item.publicProfileId" class="user-row">
        <view class="user-main" @tap="openProfile(item)">
          <image class="user-avatar" :src="avatarPath(item)" mode="aspectFill" />
          <view class="user-copy">
            <text class="user-name">{{ item.displayName }}</text>
            <text class="user-meta">
              {{ item.factionLabel }} · LV.{{ item.level }} · {{ item.titleLabel }}
            </text>
          </view>
        </view>
        <button
          class="follow-action"
          :class="{
            'follow-action-muted': item.viewerFollowState === CommunityFollowState.Following,
            'follow-action-self': item.viewerFollowState === CommunityFollowState.Self
          }"
          :disabled="isFollowActionDisabled(item)"
          @tap.stop="toggleFollow(item)"
        >
          {{ actionText(item) }}
        </button>
      </view>

      <button v-if="nextCursor" class="load-more" :disabled="loadingMore" @tap="loadList(false)">
        {{ loadingMore ? "加载中" : "加载更多" }}
      </button>
      <text v-else-if="pageState === 'ready' && items.length > 0" class="end-hint">没有更多了</text>
    </view>
  </view>
</template>

<style>
.follow-list-page {
  min-height: 100vh;
  background: var(--camp-page-background);
}

.list-panel {
  border: 1rpx solid var(--camp-border) !important;
  border-radius: 12rpx !important;
  background: var(--camp-card) !important;
}

.list-head,
.user-row,
.user-main {
  display: flex;
  align-items: center;
}

.list-head {
  justify-content: space-between;
  margin-bottom: 8rpx;
}

.list-title {
  color: var(--camp-text-strong);
  font-size: 30rpx;
  font-weight: 900;
}

.list-count {
  color: var(--camp-text-soft);
  font-size: 22rpx;
}

.empty-state {
  display: flex;
  min-height: 160rpx;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  color: var(--camp-text-soft);
  font-size: 22rpx;
  text-align: center;
}

.empty-title {
  color: var(--camp-text);
  font-size: 24rpx;
  font-weight: 900;
}

.empty-desc,
.end-hint {
  color: var(--camp-text-soft);
  font-size: 20rpx;
  line-height: 1.45;
}

.end-hint {
  display: block;
  padding-top: 18rpx;
  text-align: center;
}

.list-skeleton {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.skeleton-row {
  display: flex;
  min-height: 112rpx;
  align-items: center;
  gap: 14rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.08);
}

.skeleton-avatar {
  width: 72rpx;
  height: 72rpx;
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
  width: 68%;
  height: 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.08);
}

.skeleton-line-strong {
  width: 84%;
  height: 22rpx;
  background: rgba(236, 178, 255, 0.12);
}

.skeleton-button {
  width: 132rpx;
  height: 56rpx;
  flex-shrink: 0;
  border-radius: 8rpx;
  background: rgba(255, 255, 255, 0.08);
}

.user-row {
  gap: 14rpx;
  min-height: 112rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.08);
}

.user-main {
  flex: 1;
  min-width: 0;
  gap: 14rpx;
  padding: 12rpx 0;
}

.user-main:active {
  opacity: 0.78;
}

.user-avatar {
  width: 72rpx;
  height: 72rpx;
  flex-shrink: 0;
  overflow: hidden;
  border: 1rpx solid rgba(236, 178, 255, 0.45);
  border-radius: 50%;
  background: #111827;
}

.user-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6rpx;
}

.user-name,
.user-meta {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-name {
  color: var(--camp-text);
  font-size: 25rpx;
  font-weight: 900;
}

.user-meta {
  color: var(--camp-text-soft);
  font-size: 20rpx;
}

.follow-action,
.load-more {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  border-radius: 8rpx;
  font-size: 22rpx;
  font-weight: 900;
}

.follow-action {
  width: 132rpx;
  height: 56rpx;
  min-width: 132rpx;
  min-height: 56rpx;
  flex-shrink: 0;
  background: var(--vs-button-bg);
  color: var(--vs-button-text);
  line-height: 56rpx;
  overflow: hidden;
}

.follow-action-muted,
.follow-action-self {
  border: 1rpx solid rgba(236, 178, 255, 0.38);
  background: rgba(236, 178, 255, 0.08);
  color: var(--camp-primary);
}

.follow-action::after,
.load-more::after {
  border: 0;
}

.follow-action:active,
.load-more:active {
  opacity: 0.78;
}

.load-more {
  min-height: 64rpx;
  margin-top: 18rpx;
  border: 1rpx solid var(--vs-button-ghost-border);
  background: var(--vs-button-ghost-bg);
  color: var(--vs-button-ghost-text);
}
</style>
