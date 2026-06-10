<script setup lang="ts">
import { useVisualModePage } from "../../services/visual-mode";
import { computed, ref } from "vue";
import { onLoad, onPullDownRefresh, onShow } from "@dcloudio/uni-app";
import VisualStatePanel from "../../components/VisualStatePanel.vue";
import {
  COMMUNITY_SECTION_LABELS,
  COMMUNITY_SECTION_KEYS,
  CommunitySectionKey,
  UserFaction,
  canUserPostToCommunitySection,
  formatDisplayTime,
  type CommunityPostSummary,
  type CommunitySectionKey as CommunitySectionKeyValue,
  type UserGrowthProfileSnapshot
} from "@moyuxia/shared";
import { getAppAuthToken } from "../../services/auth";
import { resolveProfileAvatarPathByKey } from "../../services/profile-assets";
import { getLocalUserProfileSnapshot, getUserProfile } from "../../services/user-growth-profile";
import {
  isCommunityIdentityError,
  listCommunityMessages,
  listCommunityPosts,
  resolveCommunityPublicAssetUrl
} from "../../services/community-lite";
import {
  IllustrationKeys,
  resolveSemanticIconPath
} from "../../visual-system/illustration-registry";
import type { MiniappVisualStateKey } from "../../visual-system/visual-states";

const { visualModeClass, isHermitMode } = useVisualModePage();

const sections = COMMUNITY_SECTION_KEYS.map((key) => ({
  key,
  label: COMMUNITY_SECTION_LABELS[key]
}));
const filters = ["最新", "热门"] as const;

const activeSection = ref<CommunitySectionKeyValue>(CommunitySectionKey.Recommended);
const activeFilter = ref<(typeof filters)[number]>("最新");
const posts = ref<CommunityPostSummary[]>([]);
const loading = ref(false);
const feedbackMessage = ref("");
const successOverlay = ref("");
const authToken = ref<string | null>(null);
const profile = ref<UserGrowthProfileSnapshot | null>(null);
const profileRemoteConfirmed = ref(false);
const unreadMessageCount = ref(0);
const COMMUNITY_PUBLISH_FEEDBACK_KEY = "moyuxia.communityPublishFeedback";
const COMMUNITY_WORLD_BANNER_WORKPLACE_IMAGE =
  "/static/community/world-banner-workplace-20260610.jpg";
const COMMUNITY_WORLD_BANNER_HERMIT_IMAGE = "/static/community/world-banner-hermit-20260610-r2.jpg";

const hasFullCommunityIdentity = computed(() => Boolean(authToken.value && profile.value));
const canPostCurrentSection = computed(() => {
  if (!profile.value) {
    return false;
  }

  return canUserPostToCommunitySection(profile.value.faction, activeSection.value);
});
const worldBanner = {
  tag: "隐者大陆",
  title: "暗影工位异闻绘卷",
  desc: "夜色工位有新传闻，隐者小队正在集结。",
  action: "进入绘卷"
} as const;
const communityWorldBannerImage = computed(() =>
  isHermitMode.value ? COMMUNITY_WORLD_BANNER_HERMIT_IMAGE : COMMUNITY_WORLD_BANNER_WORKPLACE_IMAGE
);
const hasCommunityListError = computed(() => feedbackMessage.value.length > 0);
const communityEmptyVisualState = computed<MiniappVisualStateKey>(() => {
  if (hasCommunityListError.value) {
    return "network_failed";
  }

  if (!authToken.value) {
    return "logged_out";
  }

  if (!profile.value) {
    return "profile_missing";
  }

  return "empty";
});
const emptyStateTitle = computed(() => {
  if (hasCommunityListError.value) {
    return "社区暂不可用";
  }

  return "暂无公开内容";
});
const emptyStateDesc = computed(() => {
  if (hasCommunityListError.value) {
    return "茶馆卷轴读取失败，可稍后重试。";
  }

  if (!authToken.value) {
    return "推荐分区暂无公开内容。登录并创建隐者档案后，可参与发帖和互动。";
  }

  if (!profile.value) {
    return "创建隐者档案后可发帖、评论、收藏和接收通知。";
  }

  return canPostCurrentSection.value
    ? "该分区暂无公开内容，可以发布第一帖，低风险内容会自动公开。"
    : "该分区暂无公开内容，可先去推荐或自己的阵营专区看看。";
});
const emptyStateActionText = computed(() => {
  if (hasCommunityListError.value) {
    return "重试";
  }

  if (!authToken.value) {
    return "登录并建档";
  }

  if (!profile.value) {
    return "创建隐者档案";
  }

  return canPostCurrentSection.value ? "发布第一帖" : "去推荐";
});

onLoad((query: { posted?: string; message?: string } = {}) => {
  if (query.posted === "1") {
    showSuccessOverlay(decodeURIComponent(query.message ?? "发布完成，等待审核结果"));
  }
});

onShow(async () => {
  consumePublishFeedback();
  await refreshCommunityPageData();
});

onPullDownRefresh(() => {
  void refreshCommunityPageData().finally(() => {
    uni.stopPullDownRefresh();
  });
});

async function refreshCommunityPageData(): Promise<void> {
  await refreshCommunityIdentity();
  await Promise.all([refreshUnreadMessageCount(), refreshPosts()]);
}

async function refreshCommunityIdentity(): Promise<void> {
  authToken.value = getAppAuthToken();
  profile.value = getLocalUserProfileSnapshot();
  profileRemoteConfirmed.value = false;

  if (!authToken.value) {
    profile.value = null;
    unreadMessageCount.value = 0;
    return;
  }

  try {
    const result = await getUserProfile();
    profile.value = result.response.profileCreated ? result.response.profile : null;
    profileRemoteConfirmed.value =
      result.source === "remote" &&
      Boolean(result.response.profileCreated && result.response.profile);
  } catch {
    profile.value = getLocalUserProfileSnapshot();
    profileRemoteConfirmed.value = false;
  }
}

async function refreshUnreadMessageCount(): Promise<void> {
  if (!hasFullCommunityIdentity.value || !profileRemoteConfirmed.value) {
    unreadMessageCount.value = 0;
    return;
  }

  try {
    const response = await listCommunityMessages();
    unreadMessageCount.value = response.unreadCount;
  } catch (error) {
    if (!isCommunityIdentityError(error)) {
      console.error("moyuxia community unread messages error", error);
    }
    unreadMessageCount.value = 0;
  }
}

async function refreshPosts(): Promise<void> {
  loading.value = true;
  feedbackMessage.value = "";

  try {
    const response = await listCommunityPosts({
      sectionKey: activeSection.value,
      sort: activeFilter.value === "热门" ? "hot" : "latest",
      limit: 20
    });
    posts.value = response.posts;
  } catch (error) {
    console.error("moyuxia community list error", error);
    feedbackMessage.value = "社区列表暂时不可用，稍后再试。";
    posts.value = [];
  } finally {
    loading.value = false;
  }
}

function handleSectionTap(sectionKey: CommunitySectionKeyValue): void {
  if (sectionKey !== CommunitySectionKey.Recommended && !hasFullCommunityIdentity.value) {
    redirectToProfile();
    return;
  }

  activeSection.value = sectionKey;
  void refreshPosts();
}

function handleFilterTap(filter: (typeof filters)[number]): void {
  activeFilter.value = filter;
  void refreshPosts();
}

function handlePublishTap(): void {
  if (!hasFullCommunityIdentity.value) {
    redirectToProfile();
    return;
  }

  if (!canPostCurrentSection.value) {
    uni.showToast({ title: "只能在自己的阵营专区发帖", icon: "none" });
    return;
  }

  uni.navigateTo({
    url: `/pages/community/post?sectionKey=${encodeURIComponent(activeSection.value)}`
  });
}

function openMessages(): void {
  if (!hasFullCommunityIdentity.value) {
    redirectToProfile();
    return;
  }

  uni.navigateTo({ url: "/pages/community/messages" });
}

function openPost(postId: string): void {
  if (!hasFullCommunityIdentity.value) {
    redirectToProfile();
    return;
  }

  uni.navigateTo({ url: `/pages/community/detail?postId=${encodeURIComponent(postId)}` });
}

function requireIdentityAction(): void {
  if (!hasFullCommunityIdentity.value) {
    redirectToProfile();
    return;
  }

  uni.showToast({ title: "请进入详情后操作", icon: "none" });
}

function handleEmptyStateAction(): void {
  if (hasCommunityListError.value) {
    void refreshPosts();
    return;
  }

  if (!hasFullCommunityIdentity.value) {
    redirectToProfile();
    return;
  }

  if (canPostCurrentSection.value) {
    handlePublishTap();
    return;
  }

  activeSection.value = CommunitySectionKey.Recommended;
  void refreshPosts();
}

function handleWorldBannerTap(): void {
  uni.navigateTo({ url: "/pages/comics/index" });
}

function redirectToProfile(): void {
  uni.switchTab({ url: "/pages/profile/index" });
}

function authorMeta(post: CommunityPostSummary): string {
  return `${post.author.factionLabel} · ${post.author.level}阶隐者`;
}

function authorAvatarPath(post: CommunityPostSummary): string {
  return resolveProfileAvatarPathByKey(post.author.avatarKey, post.author.faction);
}

function firstMediaUrl(post: CommunityPostSummary): string {
  const firstAsset = post.mediaAssets[0];
  if (!firstAsset) {
    return "";
  }

  return resolveCommunityPublicAssetUrl(firstAsset.thumbnailUrl || firstAsset.url, firstAsset.id);
}

function visibleImageCount(post: CommunityPostSummary): number {
  return post.mediaAssets.length || post.imageKeys.length;
}

function formatCount(value: number): string {
  return value > 999 ? `${(value / 1000).toFixed(1)}k` : String(value);
}

function showSuccessOverlay(message: string): void {
  successOverlay.value = message;
  setTimeout(() => {
    successOverlay.value = "";
  }, 1800);
}

function consumePublishFeedback(): void {
  const message = uni.getStorageSync(COMMUNITY_PUBLISH_FEEDBACK_KEY);

  if (typeof message !== "string" || !message) {
    return;
  }

  uni.removeStorageSync(COMMUNITY_PUBLISH_FEEDBACK_KEY);
  showSuccessOverlay(message);
}
</script>

<template>
  <view :class="['vs-page', 'vs-stack', visualModeClass]">
    <view v-if="successOverlay" class="success-overlay">
      <text>{{ successOverlay }}</text>
    </view>

    <view class="banner vs-panel vs-pixel-frame-primary banner-card" @tap="handleWorldBannerTap">
      <image class="banner-bg" :src="communityWorldBannerImage" mode="aspectFill" />
      <view class="banner-shade" />
      <view class="banner-copy">
        <text class="banner-tag">{{ worldBanner.tag }}</text>
        <text class="banner-title vs-truncate">{{ worldBanner.title }}</text>
        <text class="banner-desc">{{ worldBanner.desc }}</text>
        <text class="banner-action">{{ worldBanner.action }}</text>
      </view>
    </view>

    <scroll-view scroll-x class="tabs-scroll">
      <view class="tabs-container">
        <view
          v-for="section in sections"
          :key="section.key"
          class="tab-item-box"
          :class="{ 'active-tab-box': activeSection === section.key }"
          @tap="handleSectionTap(section.key)"
        >
          <text class="tab-item-text">{{ section.label }}</text>
          <view v-if="activeSection === section.key" class="active-line" />
        </view>
      </view>
    </scroll-view>

    <view class="vs-row-between filter-row-box">
      <view class="vs-row filters-left">
        <view
          v-for="filter in filters"
          :key="filter"
          class="vs-chip filter-chip"
          :class="{ 'active-filter': activeFilter === filter }"
          @tap="handleFilterTap(filter)"
        >
          {{ filter }}
        </view>
      </view>
      <view class="filter-actions">
        <view class="message-action-btn" @tap="openMessages">
          <text>消息</text>
          <text v-if="unreadMessageCount > 0" class="message-red-dot">
            {{ unreadMessageCount > 99 ? "99+" : unreadMessageCount }}
          </text>
        </view>
        <button v-if="hasFullCommunityIdentity" class="publish-action-btn" @tap="handlePublishTap">
          发布
        </button>
        <button v-else class="identity-action-btn" @tap="redirectToProfile">
          {{ authToken ? "建档" : "登录" }}
        </button>
      </view>
    </view>

    <view class="posts-list vs-stack">
      <VisualStatePanel
        v-if="loading && posts.length === 0"
        state="loading"
        title="社区列表同步中"
        description="正在读取公开帖子和分区状态。"
      />

      <VisualStatePanel
        v-else-if="posts.length === 0"
        :state="communityEmptyVisualState"
        :asset-key="IllustrationKeys.communityEmpty"
        :title="emptyStateTitle"
        :description="emptyStateDesc"
        :action-text="emptyStateActionText"
        @action="handleEmptyStateAction"
      />

      <view
        v-for="post in posts"
        :key="post.id"
        class="post-card vs-panel vs-card-raised vs-panel-interactive"
        @tap="openPost(post.id)"
      >
        <view class="post-row" :class="{ 'post-row-quoted': post.dailyContentQuote }">
          <view class="post-copy-column">
            <view class="post-header">
              <view class="vs-row author-info">
                <view class="author-avatar">
                  <image :src="authorAvatarPath(post)" mode="aspectFill" />
                </view>
                <view class="author-meta">
                  <view class="vs-row name-row">
                    <text class="author-name">{{ post.author.displayName }}</text>
                    <view class="vs-chip faction-label">{{ authorMeta(post) }}</view>
                  </view>
                  <text class="post-time">{{ formatDisplayTime(post.approvedAt) }}</text>
                </view>
              </view>
              <view v-if="post.author.faction === UserFaction.KeyShadow" class="badge-chip">
                键影
              </view>
            </view>

            <view class="post-main-copy">
              <text class="post-title">{{ post.title }}</text>
              <view v-if="post.dailyContentQuote" class="daily-quote">
                <text class="daily-quote-label">
                  {{
                    post.dailyContentQuote.sourceType === "daily_reflection"
                      ? "引用今日参悟"
                      : `隐者日报 · ${post.dailyContentQuote.sectionLabel}`
                  }}
                </text>
                <view class="daily-quote-main">
                  <text class="daily-quote-mark">引</text>
                  <text class="daily-quote-title">{{ post.dailyContentQuote.title }}</text>
                </view>
                <text
                  v-if="post.dailyContentQuote.sourceType === 'daily_reflection'"
                  class="daily-quote-summary"
                >
                  {{ post.dailyContentQuote.reflectionText || post.dailyContentQuote.summary }}
                </text>
              </view>
              <text class="post-desc vs-clamp-2">{{ post.excerpt }}</text>
            </view>
          </view>
          <view
            v-if="
              !post.dailyContentQuote && (post.mediaAssets.length > 0 || post.imageKeys.length > 0)
            "
            class="post-thumb"
            :class="{ 'legacy-thumb': post.mediaAssets.length === 0 }"
          >
            <image
              v-if="post.mediaAssets.length > 0"
              :src="firstMediaUrl(post)"
              mode="aspectFill"
            />
            <image
              v-else
              class="legacy-thumb-icon"
              :src="resolveSemanticIconPath('px-icon-state-empty')"
              mode="aspectFit"
            />
            <view v-if="visibleImageCount(post) > 1" class="image-count-badge">
              +{{ visibleImageCount(post) - 1 }}
            </view>
          </view>
        </view>

        <view
          v-if="
            post.dailyContentQuote && (post.mediaAssets.length > 0 || post.imageKeys.length > 0)
          "
          class="quote-media-row"
        >
          <view
            class="quote-media-thumb"
            :class="{ 'legacy-thumb': post.mediaAssets.length === 0 }"
          >
            <image
              v-if="post.mediaAssets.length > 0"
              :src="firstMediaUrl(post)"
              mode="aspectFill"
            />
            <image
              v-else
              class="legacy-thumb-icon"
              :src="resolveSemanticIconPath('px-icon-state-empty')"
              mode="aspectFit"
            />
          </view>
          <view class="quote-media-copy">
            <text class="quote-media-label">图片附件</text>
            <text class="quote-media-count">
              {{ visibleImageCount(post) > 1 ? `${visibleImageCount(post)} 张图片` : "1 张图片" }}
            </text>
          </view>
        </view>

        <view class="stats vs-row-between" @tap.stop>
          <view class="stat-item vs-row" @tap="requireIdentityAction">
            <text class="stat-icon">赞</text>
            <text class="stat-text">{{ formatCount(post.stats.likeCount) }}</text>
          </view>
          <view class="stat-item vs-row" @tap="openPost(post.id)">
            <text class="stat-icon">评</text>
            <text class="stat-text">{{ formatCount(post.stats.commentCount) }}</text>
          </view>
          <view class="stat-item vs-row" @tap="requireIdentityAction">
            <text class="stat-icon">藏</text>
            <text class="stat-text">{{ formatCount(post.stats.favoriteCount) }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style>
.vs-page {
  min-height: 100vh;
  background: var(--camp-page-background);
}

.success-overlay {
  position: fixed;
  left: 50%;
  top: 42%;
  z-index: 1000;
  min-width: 320rpx;
  max-width: 560rpx;
  transform: translate(-50%, -50%);
  border: 1rpx solid rgba(236, 178, 255, 0.48);
  border-radius: 8rpx;
  background: var(--camp-modal-bg);
  padding: 28rpx 36rpx;
  text-align: center;
  box-shadow:
    inset 1rpx 1rpx 0 rgba(255, 255, 255, 0.1),
    inset -1rpx -1rpx 0 rgba(0, 0, 0, 0.52),
    0 0 18rpx rgba(189, 0, 255, 0.34);
  animation: fade-out 1.8s ease forwards;
}

.success-overlay text {
  color: var(--camp-text-strong);
  font-size: 26rpx;
  font-weight: 900;
}

@keyframes fade-out {
  0% {
    opacity: 0;
    transform: translate(-50%, -44%);
  }
  18% {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
  72% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.feedback-text {
  color: var(--camp-primary);
  font-size: 20rpx;
  font-weight: 700;
}

.banner-card {
  position: relative;
  min-height: 220rpx;
  overflow: hidden;
  padding: 0 !important;
  border: 3rpx solid rgba(236, 178, 255, 0.62) !important;
  border-radius: 16rpx !important;
  background: var(--camp-card) !important;
  box-shadow:
    0 0 0 2rpx var(--camp-page),
    0 0 0 5rpx rgba(236, 178, 255, 0.16),
    inset 0 0 0 2rpx rgba(255, 255, 255, 0.08),
    inset 0 -8rpx 0 rgba(0, 0, 0, 0.26),
    0 8rpx 0 rgba(0, 0, 0, 0.34),
    0 18rpx 28rpx rgba(0, 0, 0, 0.28) !important;
}

.vs-mode-hermit .banner-card::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0),
    rgba(255, 255, 255, 0) 50%,
    rgba(0, 0, 0, 0.12) 50%,
    rgba(0, 0, 0, 0.12)
  );
  background-size: 100% 4rpx;
  opacity: 0.48;
}

.banner-bg,
.banner-shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.banner-bg {
  z-index: 0;
}

.banner-shade {
  z-index: 1;
  display: none;
}

.vs-mode-hermit .banner-shade {
  display: block;
  background:
    linear-gradient(
      90deg,
      var(--camp-asset-shade-strong) 0%,
      var(--camp-asset-shade-medium) 45%,
      var(--camp-asset-shade-soft) 100%
    ),
    linear-gradient(0deg, var(--camp-asset-shade-medium), var(--camp-asset-shade-faint));
}

.banner-copy {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 7rpx;
  width: 414rpx;
  min-height: 220rpx;
  padding: 0 26rpx;
  box-sizing: border-box;
}

.vs-mode-workplace .banner-copy {
  text-shadow: none;
}

.banner-tag {
  align-self: flex-start;
  border: 1rpx solid rgba(236, 178, 255, 0.4);
  border-radius: 6rpx;
  background: var(--camp-overlay);
  color: var(--camp-primary);
  padding: 3rpx 12rpx;
  font-size: 18rpx;
  font-weight: 900;
}

.vs-mode-workplace .banner-tag {
  border-color: rgba(154, 106, 22, 0.3);
  background: rgba(255, 250, 241, 0.78);
  color: #8a5e12;
}

.banner-title {
  color: var(--camp-text-strong);
  font-size: 28rpx;
  font-weight: 900;
}

.vs-mode-workplace .banner-title {
  color: #17130f;
}

.banner-desc {
  color: var(--camp-cyan);
  font-size: 20rpx;
  font-weight: 800;
  line-height: 1.32;
}

.vs-mode-workplace .banner-desc {
  color: #5f5142;
}

.banner-action {
  color: var(--camp-primary);
  font-size: 18rpx;
  font-weight: 900;
}

.vs-mode-workplace .banner-action {
  color: #9a6a16;
}

.tabs-scroll {
  width: 100%;
  border-bottom: 1rpx solid rgba(81, 66, 85, 0.72);
  white-space: nowrap;
}

.tabs-container {
  display: inline-flex;
  gap: 34rpx;
  padding: 8rpx 0 14rpx;
}

.tab-item-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 7rpx;
}

.tab-item-text {
  color: var(--camp-text-muted);
  font-size: 24rpx;
  font-weight: 800;
}

.active-tab-box .tab-item-text {
  color: var(--camp-primary);
  font-weight: 900;
  text-shadow: 0 0 10rpx rgba(236, 178, 255, 0.34);
}

.active-line {
  width: 76%;
  height: 4rpx;
  margin-top: 5rpx;
  border-radius: 2rpx;
  background: var(--camp-primary);
  box-shadow: 0 0 10rpx rgba(189, 0, 255, 0.42);
}

.filter-row-box {
  align-items: center;
  gap: 10rpx;
  padding: 4rpx 0;
}

.filters-left {
  flex: 1;
  min-width: 0;
  gap: 10rpx;
}

.filter-chip {
  min-height: 52rpx !important;
  padding: 0 20rpx !important;
  border: 1rpx solid var(--camp-border) !important;
  border-radius: 8rpx !important;
  background: var(--camp-surface) !important;
  color: var(--camp-text-muted) !important;
  font-size: 22rpx !important;
  font-weight: 800;
  box-shadow:
    inset 1rpx 1rpx 0 rgba(255, 255, 255, 0.08),
    inset -1rpx -1rpx 0 rgba(0, 0, 0, 0.42);
}

.active-filter {
  border-color: rgba(236, 178, 255, 0.54) !important;
  background: rgba(189, 0, 255, 0.2) !important;
  color: var(--camp-primary) !important;
  font-weight: 900;
  box-shadow:
    inset 1rpx 1rpx 0 rgba(255, 255, 255, 0.1),
    inset -1rpx -1rpx 0 rgba(0, 0, 0, 0.42),
    0 0 16rpx rgba(189, 0, 255, 0.34);
}

.filter-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 8rpx;
}

.message-action-btn {
  position: relative;
  display: flex;
  min-width: 86rpx;
  min-height: 52rpx;
  align-items: center;
  justify-content: center;
  border: 1rpx solid var(--camp-border);
  border-radius: 8rpx;
  background: var(--camp-surface);
  box-shadow:
    inset 1rpx 1rpx 0 rgba(255, 255, 255, 0.08),
    inset -1rpx -1rpx 0 rgba(0, 0, 0, 0.42);
}

.message-action-btn text:first-child {
  color: var(--camp-text-muted);
  font-size: 22rpx;
  font-weight: 800;
}

.publish-action-btn,
.identity-action-btn {
  min-width: 86rpx;
  min-height: 52rpx;
  border: 1rpx solid var(--vs-button-border);
  border-radius: 8rpx;
  background: var(--vs-button-bg);
  color: var(--vs-button-text);
  font-family: var(--vs-font-display);
  font-size: 22rpx;
  font-weight: 900;
  box-shadow:
    inset 1rpx 1rpx 0 rgba(255, 255, 255, 0.34),
    inset -1rpx -4rpx 0 rgba(0, 0, 0, 0.22),
    0 5rpx 0 rgba(0, 0, 0, 0.42),
    0 0 14rpx rgba(154, 106, 22, 0.22);
}

.identity-action-btn {
  border-color: rgba(236, 178, 255, 0.5);
  background: rgba(189, 0, 255, 0.18);
  color: var(--camp-primary);
  box-shadow:
    inset 1rpx 1rpx 0 rgba(255, 255, 255, 0.08),
    inset -1rpx -1rpx 0 rgba(0, 0, 0, 0.42),
    0 0 12rpx rgba(189, 0, 255, 0.2);
}

.vs-mode-workplace .active-tab-box .tab-item-text {
  color: #9a6a16;
  text-shadow: none;
}

.vs-mode-workplace .active-line {
  background: var(--camp-gold);
  box-shadow: 0 0 10rpx rgba(154, 106, 22, 0.38);
}

.vs-mode-workplace .active-filter {
  border-color: var(--vs-button-border) !important;
  background: var(--vs-button-bg) !important;
  color: #111827 !important;
  box-shadow:
    inset 0 3rpx 0 rgba(255, 255, 255, 0.3),
    inset 0 -5rpx 0 rgba(0, 0, 0, 0.16),
    0 5rpx 0 rgba(17, 24, 39, 0.36),
    0 0 14rpx rgba(247, 165, 22, 0.26);
}

.vs-mode-workplace .filter-chip {
  border-color: rgba(154, 106, 22, 0.36) !important;
  color: var(--camp-gold) !important;
}

.vs-mode-workplace .message-action-btn {
  border-color: rgba(154, 106, 22, 0.42);
  background: var(--camp-card);
}

.vs-mode-workplace .message-action-btn text:first-child {
  color: var(--camp-gold);
}

.vs-mode-workplace .identity-action-btn {
  border-color: var(--vs-button-border);
  background: var(--vs-button-bg);
  color: var(--vs-button-text);
  box-shadow:
    inset 1rpx 1rpx 0 rgba(255, 255, 255, 0.34),
    inset -1rpx -4rpx 0 rgba(0, 0, 0, 0.2),
    0 5rpx 0 rgba(17, 24, 39, 0.34),
    0 0 14rpx rgba(154, 106, 22, 0.22);
}

.publish-action-btn::after,
.identity-action-btn::after {
  border: 0;
}

.message-action-btn:active,
.publish-action-btn:active,
.identity-action-btn:active {
  transform: translateY(2rpx);
  box-shadow:
    inset 1rpx 1rpx 0 rgba(255, 255, 255, 0.08),
    inset -1rpx -1rpx 0 rgba(0, 0, 0, 0.42),
    0 2rpx 0 rgba(0, 0, 0, 0.38);
}

.message-red-dot {
  position: absolute;
  top: -10rpx;
  right: -10rpx;
  min-width: 28rpx;
  height: 28rpx;
  padding: 0 8rpx;
  border: 2rpx solid var(--camp-bg);
  border-radius: 999rpx;
  background: var(--camp-danger);
  color: #690005;
  font-size: 16rpx;
  font-weight: 900;
  line-height: 24rpx;
  text-align: center;
}

.posts-list {
  gap: 16rpx;
}

.empty-state {
  display: flex;
  min-height: 160rpx;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  text-align: center;
}

.empty-title {
  color: var(--camp-text-strong);
  font-size: 26rpx;
  font-weight: 900;
}

.empty-desc {
  color: var(--camp-text-muted);
  font-size: 21rpx;
  line-height: 1.45;
}

.empty-action {
  min-width: 180rpx;
  min-height: 60rpx;
  border-radius: 8rpx;
  background: var(--vs-button-bg);
  color: var(--vs-button-text);
  font-size: 22rpx;
  font-weight: 900;
}

.post-card {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  padding: 18rpx !important;
  border: 1rpx solid var(--camp-border) !important;
  border-radius: 16rpx !important;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0)), var(--camp-card) !important;
  box-shadow:
    inset 1rpx 1rpx 0 rgba(255, 255, 255, 0.08),
    inset -1rpx -1rpx 0 rgba(0, 0, 0, 0.42),
    0 2rpx 12rpx rgba(0, 0, 0, 0.32) !important;
}

.post-card:active {
  border-color: rgba(236, 178, 255, 0.42) !important;
  box-shadow:
    inset 1rpx 1rpx 0 rgba(255, 255, 255, 0.1),
    inset -1rpx -1rpx 0 rgba(0, 0, 0, 0.42),
    0 0 14rpx rgba(189, 0, 255, 0.18) !important;
}

.post-row {
  display: flex;
  align-items: stretch;
  gap: 16rpx;
}

.post-row-quoted {
  display: block;
}

.post-copy-column {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 12rpx;
}

.post-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10rpx;
}

.author-info,
.name-row {
  min-width: 0;
  gap: 8rpx;
}

.author-avatar {
  width: 48rpx;
  height: 48rpx;
  flex-shrink: 0;
  overflow: hidden;
  border: 1rpx solid rgba(236, 178, 255, 0.45);
  border-radius: 999rpx;
  background: var(--camp-surface);
  box-shadow: 0 0 10rpx rgba(189, 0, 255, 0.18);
}

.author-avatar image {
  width: 100%;
  height: 100%;
}

.author-meta,
.post-main-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4rpx;
}

.author-name,
.post-title {
  overflow: hidden;
  color: var(--camp-text);
  font-size: 22rpx;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.faction-label {
  min-height: 30rpx !important;
  padding: 0 8rpx !important;
  border-color: rgba(0, 219, 233, 0.34) !important;
  background: rgba(0, 219, 233, 0.1) !important;
  color: var(--camp-cyan) !important;
  font-size: 16rpx !important;
  font-weight: 800;
}

.post-time,
.post-desc {
  display: block;
  max-width: 100%;
  color: var(--camp-text-soft);
  font-size: 20rpx;
  line-height: 1.42;
  overflow-wrap: break-word;
  word-break: break-all;
  word-wrap: break-word;
}

.badge-chip {
  flex-shrink: 0;
  border: 1rpx solid rgba(154, 106, 22, 0.4);
  border-radius: 6rpx;
  background: rgba(154, 106, 22, 0.12);
  color: var(--camp-gold);
  padding: 4rpx 12rpx;
  font-size: 16rpx;
  font-weight: 900;
}

.post-title {
  display: -webkit-box;
  max-width: 100%;
  color: var(--camp-text-strong);
  font-size: 27rpx;
  line-height: 1.28;
  overflow: hidden;
  overflow-wrap: break-word;
  white-space: normal;
  word-break: break-all;
  word-wrap: break-word;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.daily-quote {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  border: 1rpx solid rgba(0, 219, 233, 0.24);
  border-left: 4rpx solid rgba(0, 219, 233, 0.66);
  border-radius: 8rpx;
  background: rgba(0, 219, 233, 0.055);
  padding: 8rpx 10rpx;
  box-shadow: inset 1rpx 1rpx 0 rgba(255, 255, 255, 0.04);
}

.daily-quote-label {
  color: var(--camp-cyan);
  font-size: 17rpx;
  font-weight: 900;
  line-height: 1.2;
}

.daily-quote-main {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 6rpx;
}

.daily-quote-mark {
  display: flex;
  width: 28rpx;
  height: 28rpx;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1rpx solid rgba(0, 219, 233, 0.34);
  border-radius: 5rpx;
  background: rgba(0, 219, 233, 0.16);
  color: var(--camp-cyan);
  font-size: 16rpx;
  font-weight: 900;
}

.daily-quote-title {
  overflow: hidden;
  color: var(--camp-primary);
  font-size: 19rpx;
  font-weight: 800;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.daily-quote-summary {
  display: -webkit-box;
  max-width: 100%;
  overflow: hidden;
  color: var(--camp-text-soft);
  font-size: 18rpx;
  line-height: 1.32;
  overflow-wrap: break-word;
  word-break: break-all;
  word-wrap: break-word;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}

.post-thumb {
  position: relative;
  width: 142rpx;
  height: 142rpx;
  flex-shrink: 0;
  overflow: hidden;
  border: 1rpx solid var(--camp-border);
  border-radius: 8rpx;
  background: var(--camp-surface);
  box-shadow:
    inset 1rpx 1rpx 0 rgba(255, 255, 255, 0.08),
    inset -1rpx -1rpx 0 rgba(0, 0, 0, 0.42);
}

.post-thumb image {
  width: 100%;
  height: 100%;
}

.legacy-thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  border-style: dashed;
}

.legacy-thumb-icon {
  width: 104rpx;
  height: 104rpx;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.image-count-badge {
  position: absolute;
  right: 8rpx;
  bottom: 8rpx;
  min-width: 36rpx;
  height: 30rpx;
  padding: 0 8rpx;
  border: 1rpx solid rgba(236, 178, 255, 0.34);
  border-radius: 999rpx;
  background: var(--camp-modal-bg);
  color: var(--camp-text);
  font-size: 18rpx;
  font-weight: 900;
  line-height: 28rpx;
  text-align: center;
}

.quote-media-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  border: 1rpx solid var(--camp-border);
  border-radius: 8rpx;
  background: rgba(31, 31, 39, 0.72);
  padding: 8rpx;
  box-shadow:
    inset 1rpx 1rpx 0 rgba(255, 255, 255, 0.06),
    inset -1rpx -1rpx 0 rgba(0, 0, 0, 0.36);
}

.quote-media-thumb {
  width: 58rpx;
  height: 58rpx;
  flex-shrink: 0;
  overflow: hidden;
  border: 1rpx solid rgba(236, 178, 255, 0.24);
  border-radius: 6rpx;
  background: var(--camp-surface);
}

.quote-media-thumb image {
  width: 100%;
  height: 100%;
}

.quote-media-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2rpx;
}

.quote-media-label {
  color: var(--camp-text-muted);
  font-size: 18rpx;
  font-weight: 800;
}

.quote-media-count {
  color: var(--camp-gold);
  font-size: 19rpx;
  font-weight: 900;
}

.stats {
  border-top: 1rpx dashed rgba(81, 66, 85, 0.72);
  padding-top: 8rpx;
}

.stat-item {
  flex: 1;
  justify-content: center;
  padding: 7rpx 0;
  border-radius: 8rpx;
}

.stat-item:active {
  background: rgba(236, 178, 255, 0.08);
}

.stat-icon {
  color: var(--camp-gold);
  font-size: 20rpx;
  font-weight: 900;
}

.stat-text {
  color: var(--camp-text-muted);
  font-size: 22rpx;
  font-weight: 700;
}
</style>
