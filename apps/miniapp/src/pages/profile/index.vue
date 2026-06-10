<script setup lang="ts">
import { useVisualModePage } from "../../services/visual-mode";
import { computed, ref } from "vue";
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app";
import {
  PROFESSION_FACTION_MAP,
  resolveUserGrowthTitleLabel,
  UserProfessionType,
  USER_FACTION_LABELS,
  type UserGrowthProfileSnapshot,
  type UserProfessionType as UserProfessionTypeValue,
  type WorkProfileSnapshot
} from "@moyuxia/shared";
import { getAppAuthToken, loginWithWechatMiniapp } from "../../services/auth";
import { getLocalWorkProfileSnapshot, getWorkProfile } from "../../services/work-profile";
import {
  createUserProfile,
  dailyCheckin,
  getLocalUserProfileSnapshot,
  getUserProfile
} from "../../services/user-growth-profile";
import {
  getMyCommunityFollowStats,
  isCommunityIdentityError,
  listCommunityMessages
} from "../../services/community-lite";
import {
  resolveProfileArtworkPathByKey,
  resolveProfileAvatarPathByKey,
  resolveProfileBadgePath,
  resolveProfileBadgePathByKey
} from "../../services/profile-assets";
import { getSurvivalLedgerTodaySummary } from "../../services/accounting-ledger";
import { resolveSemanticIconPath } from "../../visual-system/illustration-registry";
import PixelHeroFrame from "../../components/PixelHeroFrame.vue";

const { visualModeClass, isHermitMode } = useVisualModePage();

type PageState = "checking_auth" | "logged_out" | "loading" | "not_created" | "ready" | "error";

const PROFILE_ENTRY_HERO_WORKPLACE_IMAGE = "/static/profile/entry-hero-workplace-20260610.jpg";
const PROFILE_ENTRY_HERO_HERMIT_IMAGE = "/static/profile/entry-hero-hermit-20260610-r2.jpg";

const pageState = ref<PageState>("checking_auth");
const profile = ref<UserGrowthProfileSnapshot | null>(null);
const workSnapshot = ref<WorkProfileSnapshot | null>(null);
const selectedProfession = ref<UserProfessionTypeValue | null>(null);
const loadingText = ref("正在读取隐者档案");
const errorMessage = ref("");
const feedbackMessage = ref("");
const isSubmitting = ref(false);
const isCheckingIn = ref(false);
const communityUnreadCount = ref(0);
const profileRemoteConfirmed = ref(false);
const workProfileCtaVisible = ref(false);
const socialStats = ref({
  followingCount: 0,
  followerCount: 0,
  publicProfileId: ""
});
const survivalSummary = ref<{ canteen: string; afternoon: string; commute: string }>({
  canteen: "¥0.00",
  afternoon: "¥0.00",
  commute: "¥0.00"
});
const profileEntryHeroImage = computed(() =>
  isHermitMode.value ? PROFILE_ENTRY_HERO_HERMIT_IMAGE : PROFILE_ENTRY_HERO_WORKPLACE_IMAGE
);

const professionOptions = [
  {
    value: UserProfessionType.Engineering,
    title: "键影隐者（数字与技术）",
    desc: "开发、测试、运维"
  },
  {
    value: UserProfessionType.CreativeOperations,
    title: "运影隐者（运营与商业）",
    desc: "设计、运营、内容、市场"
  },
  {
    value: UserProfessionType.ProductStrategy,
    title: "策影隐者（创意与内容）",
    desc: "产品、项目、管理、咨询"
  },
  {
    value: UserProfessionType.BusinessSupport,
    title: "行影隐者（现实与执行）",
    desc: "销售、客服、行政、其他"
  }
] as const;

const professionCards = computed(() =>
  professionOptions.map((item) => {
    const faction = PROFESSION_FACTION_MAP[item.value];
    return {
      ...item,
      faction,
      factionLabel: USER_FACTION_LABELS[faction],
      badgePath: resolveProfileBadgePath(faction)
    };
  })
);

type ProfileMenuItem = {
  name: string;
  icon: string;
  route?: string;
  badge?: "communityUnread";
};

const menus: readonly ProfileMenuItem[] = [
  { name: "我的角色", icon: "px-icon-menu-role" },
  { name: "工作设置", icon: "px-icon-menu-work-settings", route: "/pages/work-profile/settings" },
  { name: "我的帖子", icon: "px-icon-menu-my-posts", route: "/pages/community/my-posts" },
  { name: "收藏帖子", icon: "px-icon-menu-favorites", route: "/pages/community/my-favorites" },
  {
    name: "论坛消息",
    icon: "px-icon-menu-messages",
    route: "/pages/community/messages",
    badge: "communityUnread"
  },
  { name: "生存账本", icon: "px-icon-menu-ledger", route: "/pages/accounting-ledger/index" }
] as const;

const totalCheckinCount = computed(
  () => profile.value?.totalCheckinCount ?? profile.value?.checkinStreak ?? 0
);

const resources = computed(() => [
  {
    label: "关注",
    value: compactMetricCount(socialStats.value.followingCount),
    iconPath: resolveSemanticIconPath("px-icon-menu-my-posts"),
    type: "following",
    routeType: "following" as const
  },
  {
    label: "粉丝",
    value: compactMetricCount(socialStats.value.followerCount),
    iconPath: resolveSemanticIconPath("px-icon-menu-messages"),
    type: "followers",
    routeType: "followers" as const
  },
  {
    label: "总签到次数",
    value: profile.value ? compactMetricCount(totalCheckinCount.value, "次") : "-",
    iconPath: resolveSemanticIconPath("px-icon-resource-checkin"),
    type: "reward",
    routeType: undefined
  }
]);

const survivalItems = computed(() => [
  {
    label: "隐者食堂",
    amount: survivalSummary.value.canteen,
    iconPath: resolveSemanticIconPath("px-icon-ledger-canteen")
  },
  {
    label: "下午续命",
    amount: survivalSummary.value.afternoon,
    iconPath: resolveSemanticIconPath("px-icon-ledger-afternoon")
  },
  {
    label: "通勤",
    amount: survivalSummary.value.commute,
    iconPath: resolveSemanticIconPath("px-icon-ledger-commute")
  }
]);

const experiencePercent = computed(() => {
  const progress = profile.value?.levelProgress.experienceProgress ?? 0;
  return `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%`;
});

const currentAvatarPath = computed(() =>
  profile.value ? resolveProfileAvatarPathByKey(profile.value.avatarKey, profile.value.faction) : ""
);

const currentBadgePath = computed(() =>
  profile.value
    ? resolveProfileBadgePathByKey(profile.value.currentBadgeKey, profile.value.faction)
    : ""
);

const currentArtworkPath = computed(() =>
  profile.value
    ? resolveProfileArtworkPathByKey(profile.value.factionArtworkKey, profile.value.faction)
    : ""
);
const checkinButtonText = computed(() => {
  if (isCheckingIn.value) {
    return "签到中";
  }

  return profile.value?.lastCheckinDate === todayBusinessDate() ? "今日已签到" : "每日签到";
});

onShow(() => {
  void refreshProfilePageData();
});

onPullDownRefresh(() => {
  void refreshProfilePageData().finally(() => {
    uni.stopPullDownRefresh();
  });
});

async function refreshProfilePageData(): Promise<void> {
  feedbackMessage.value = "";

  if (!getAppAuthToken()) {
    pageState.value = "logged_out";
    profile.value = null;
    profileRemoteConfirmed.value = false;
    workSnapshot.value = null;
    communityUnreadCount.value = 0;
    socialStats.value = { followingCount: 0, followerCount: 0, publicProfileId: "" };
    return;
  }

  applyLocalProfileSnapshot();
  await syncProfile();
  await Promise.all([
    syncCommunityUnreadCount(),
    syncCommunitySocialStats(),
    syncWorkAndSurvivalSummary()
  ]);
}

async function handleLogin(): Promise<void> {
  isSubmitting.value = true;
  errorMessage.value = "";

  try {
    loadingText.value = "正在建立隐者登录态";
    pageState.value = "loading";
    await loginWithWechatMiniapp();
    await syncProfile();
    void syncCommunityUnreadCount();
    void syncCommunitySocialStats();
  } catch (error) {
    pageState.value = "logged_out";
    errorMessage.value = error instanceof Error ? error.message : "登录失败，请稍后重试";
  } finally {
    isSubmitting.value = false;
  }
}

async function syncProfile(): Promise<void> {
  loadingText.value = "正在同步隐者档案";
  if (!profile.value) {
    pageState.value = "loading";
  }

  try {
    const result = await getUserProfile();

    if (result.response.profileCreated && result.response.profile) {
      profile.value = result.response.profile;
      profileRemoteConfirmed.value = result.source === "remote";
      pageState.value = "ready";
      await syncWorkProfileCtaVisibility();
      feedbackMessage.value = result.recoverableError
        ? "已展示本地档案，网络恢复后会自动同步。"
        : "";
      return;
    }

    pageState.value = "not_created";
    profileRemoteConfirmed.value = false;
  } catch (error) {
    pageState.value = "error";
    profileRemoteConfirmed.value = false;
    errorMessage.value = error instanceof Error ? error.message : "用户资料暂时不可用";
  }
}

function applyLocalProfileSnapshot(): void {
  const localSnapshot = getLocalUserProfileSnapshot();

  if (!localSnapshot) {
    return;
  }

  profile.value = localSnapshot;
  pageState.value = "ready";
}

async function syncCommunityUnreadCount(): Promise<void> {
  if (!getAppAuthToken() || !profile.value || !profileRemoteConfirmed.value) {
    communityUnreadCount.value = 0;
    return;
  }

  try {
    const response = await listCommunityMessages();
    communityUnreadCount.value = response.unreadCount;
  } catch (error) {
    if (!isCommunityIdentityError(error)) {
      console.error("moyuxia profile community messages error", error);
    }
    communityUnreadCount.value = 0;
  }
}

async function syncCommunitySocialStats(): Promise<void> {
  if (!getAppAuthToken() || !profile.value || !profileRemoteConfirmed.value) {
    socialStats.value = {
      followingCount: 0,
      followerCount: 0,
      publicProfileId: profile.value?.publicProfileId ?? ""
    };
    return;
  }

  try {
    const response = await getMyCommunityFollowStats();
    socialStats.value = {
      followingCount: response.stats.followingCount,
      followerCount: response.stats.followerCount,
      publicProfileId: response.publicProfileId ?? profile.value.publicProfileId ?? ""
    };
  } catch (error) {
    if (!isCommunityIdentityError(error)) {
      console.error("moyuxia profile follow stats error", error);
    }
    socialStats.value = {
      followingCount: 0,
      followerCount: 0,
      publicProfileId: profile.value.publicProfileId ?? ""
    };
  }
}

async function handleCreateProfile(): Promise<void> {
  if (!selectedProfession.value) {
    feedbackMessage.value = "请先选择职业类型";
    return;
  }

  isSubmitting.value = true;
  feedbackMessage.value = "";

  try {
    const response = await createUserProfile({ professionType: selectedProfession.value });
    profile.value = response.profile;
    profileRemoteConfirmed.value = true;
    pageState.value = "ready";
    await syncWorkProfileCtaVisibility();
    void syncCommunitySocialStats();
    feedbackMessage.value = response.alreadyCreated
      ? "档案已存在，已为你同步。下一步可配置工作档案。"
      : "隐者档案已创建。下一步配置薪资和上班时间。";
  } catch (error) {
    feedbackMessage.value = error instanceof Error ? error.message : "创建档案失败";
  } finally {
    isSubmitting.value = false;
  }
}

async function syncWorkAndSurvivalSummary(): Promise<void> {
  try {
    const [workResponse, survivalResponse] = await Promise.all([
      getWorkProfile(),
      getSurvivalLedgerTodaySummary(todayBusinessDate())
    ]);
    workSnapshot.value = workResponse.snapshot ?? getLocalWorkProfileSnapshot();
    const categoryMap = new Map(
      survivalResponse.categories.map((c) => [c.categoryKey, c.amountMinor])
    );
    survivalSummary.value = {
      canteen: `¥${((categoryMap.get("canteen") ?? 0) / 100).toFixed(2)}`,
      afternoon: `¥${((categoryMap.get("afternoon_boost") ?? 0) / 100).toFixed(2)}`,
      commute: `¥${((categoryMap.get("commute") ?? 0) / 100).toFixed(2)}`
    };
  } catch {
    workSnapshot.value = getLocalWorkProfileSnapshot();
  }
}

async function syncWorkProfileCtaVisibility(): Promise<void> {
  const localSnapshot = getLocalWorkProfileSnapshot();
  if (localSnapshot) {
    workProfileCtaVisible.value = false;
    return;
  }

  try {
    const response = await getWorkProfile();
    workProfileCtaVisible.value = !response.snapshot && !response.profile;
  } catch {
    workProfileCtaVisible.value = !getLocalWorkProfileSnapshot();
  }
}

async function handleDailyCheckin(): Promise<void> {
  if (!profile.value || isCheckingIn.value) {
    return;
  }

  isCheckingIn.value = true;
  feedbackMessage.value = "";

  try {
    const response = await dailyCheckin();
    profile.value = response.profile;
    feedbackMessage.value = response.alreadyCheckedIn
      ? "今日已经签到，奖励不会重复发放。"
      : `签到成功，获得 ${response.reward.experience} 经验，总签到次数已更新。`;
  } catch (error) {
    feedbackMessage.value = error instanceof Error ? error.message : "签到失败，请稍后重试";
  } finally {
    isCheckingIn.value = false;
  }
}

function openAccountingLedger(): void {
  uni.navigateTo({ url: "/pages/accounting-ledger/index" });
}

function handleMenuTap(menu: ProfileMenuItem): void {
  if (menu.name === "我的角色") {
    uni.navigateTo({ url: "/pages/profile/role" });
    return;
  }

  if (!menu.route) {
    uni.showToast({ title: "能力筹备中", icon: "none" });
    return;
  }

  uni.navigateTo({ url: menu.route });
}

function openRenameEditor(): void {
  uni.navigateTo({ url: "/pages/profile/role?focus=displayName" });
}

function openWorkProfileSettings(): void {
  uni.navigateTo({ url: "/pages/work-profile/settings" });
}

function openMyFollowList(type: "following" | "followers"): void {
  const targetPublicProfileId = socialStats.value.publicProfileId || profile.value?.publicProfileId;
  if (!targetPublicProfileId) {
    uni.showToast({ title: "关注数据同步后可查看", icon: "none" });
    return;
  }

  uni.navigateTo({
    url: `/pages/community/follow-list?publicProfileId=${encodeURIComponent(
      targetPublicProfileId
    )}&type=${type}`
  });
}

function handleResourceTap(item: (typeof resources.value)[number]): void {
  if (item.routeType === "following" || item.routeType === "followers") {
    openMyFollowList(item.routeType);
  }
}

function menuBadgeText(menu: ProfileMenuItem): string {
  if (menu.badge !== "communityUnread" || communityUnreadCount.value <= 0) {
    return "";
  }

  return communityUnreadCount.value > 99 ? "99+" : String(communityUnreadCount.value);
}

function menuIconPath(menu: ProfileMenuItem): string {
  return resolveSemanticIconPath(menu.icon);
}

function compactMetricCount(value: number, unit = ""): string {
  const text = value >= 10000 ? "9999+" : String(value);
  return unit ? `${text}${unit}` : text;
}

function todayBusinessDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}
</script>

<template>
  <view :class="['vs-page', 'vs-stack', visualModeClass]">
    <view v-if="pageState === 'logged_out'" class="entry-flow">
      <view class="entry-hero-card vs-panel vs-hero-frame-host">
        <image class="entry-hero-bg" :src="profileEntryHeroImage" mode="aspectFill" />
        <view class="entry-hero-shade" />
        <PixelHeroFrame />
        <view class="entry-copy">
          <text class="entry-kicker">隐者入境许可</text>
          <text class="entry-title">先确认身份，再进入隐者大陆</text>
          <text class="entry-desc">登录后会同步你的角色、签到、资源和社区消息。</text>
        </view>
        <button class="entry-primary-button" :disabled="isSubmitting" @tap="handleLogin">
          {{ isSubmitting ? "登录中" : "微信登录" }}
        </button>
      </view>
      <view class="entry-step-row">
        <view class="entry-step">
          <text class="entry-step-index">01</text>
          <text class="entry-step-title">登录</text>
          <text class="entry-step-desc">确认本人身份</text>
        </view>
        <view class="entry-step">
          <text class="entry-step-index">02</text>
          <text class="entry-step-title">建档</text>
          <text class="entry-step-desc">选择初始流派</text>
        </view>
        <view class="entry-step">
          <text class="entry-step-index">03</text>
          <text class="entry-step-title">开局</text>
          <text class="entry-step-desc">开启摸鱼成长</text>
        </view>
      </view>
      <text v-if="errorMessage" class="feedback-text">{{ errorMessage }}</text>
    </view>

    <view
      v-else-if="pageState === 'loading' || pageState === 'checking_auth'"
      class="vs-panel empty-state"
    >
      <text class="empty-title">{{ loadingText }}</text>
      <text class="empty-desc">正在进入隐者大陆。</text>
    </view>

    <view v-else-if="pageState === 'error'" class="vs-panel empty-state">
      <text class="empty-title">档案暂时不可用</text>
      <text class="empty-desc">{{ errorMessage }}</text>
      <button class="primary-button" @tap="refreshProfilePageData">重试</button>
    </view>

    <view v-else-if="pageState === 'not_created'" class="create-flow">
      <view class="create-header">
        <text class="entry-kicker">创建隐者档案</text>
        <text class="entry-title">选择你的初始流派</text>
        <text class="entry-desc">
          系统会按职业底牌分配头像、徽章和阵营场景，后续可在我的角色里调整。
        </text>
      </view>
      <view class="profession-grid">
        <view
          v-for="item in professionCards"
          :key="item.value"
          :class="['profession-item', selectedProfession === item.value ? 'profession-active' : '']"
          @tap="selectedProfession = item.value"
        >
          <view class="profession-content">
            <view class="profession-topline">
              <image class="profession-badge" :src="item.badgePath" mode="aspectFit" />
              <view class="profession-name-block">
                <text class="profession-title">{{ item.factionLabel }}</text>
                <text class="profession-subtitle">{{ item.title }}</text>
              </view>
            </view>
            <text class="profession-desc">{{ item.desc }}</text>
          </view>
          <view v-if="selectedProfession === item.value" class="profession-selected">已选</view>
        </view>
      </view>
      <button
        class="entry-primary-button create-submit"
        :disabled="isSubmitting || !selectedProfession"
        @tap="handleCreateProfile"
      >
        {{ isSubmitting ? "创建中" : "创建档案" }}
      </button>
      <text v-if="feedbackMessage" class="feedback-text">{{ feedbackMessage }}</text>
    </view>

    <template v-else-if="profile">
      <!-- 身份主卡：头像 + 名字 + 等级 + 资源 + 签到 -->
      <view class="vs-panel vs-hero-frame-host hero-card profile-identity-card">
        <PixelHeroFrame />
        <view class="hero-top">
          <view class="avatar-frame">
            <image :src="currentAvatarPath" mode="aspectFill" />
          </view>
          <view class="hero-info">
            <view class="vs-row name-row">
              <text class="user-name">{{ profile.displayName }}</text>
              <button class="icon-button" @tap="openRenameEditor">✎</button>
            </view>
            <text class="sub-rank">
              {{ profile.factionLabel }} ·
              {{ resolveUserGrowthTitleLabel(profile.titleKey) }}
            </text>
            <view class="level-row">
              <text class="level-tag">LV.{{ profile.level }}</text>
              <view class="xp-bar-wrap">
                <view class="xp-bar-fill" :style="{ width: experiencePercent }" />
              </view>
              <text class="xp-num">
                {{ profile.levelProgress.currentLevelExperience }}/{{
                  profile.levelProgress.nextLevelExperience
                }}
              </text>
            </view>
          </view>
          <view class="badge-frame">
            <image :src="currentBadgePath" mode="aspectFit" />
          </view>
        </view>

        <!-- 资源行 -->
        <view class="resources-row">
          <view
            v-for="(item, idx) in resources"
            :key="item.label"
            class="resource-item"
            :class="{ 'resource-item-link': item.routeType }"
            @tap="handleResourceTap(item)"
          >
            <image class="resource-icon" :src="item.iconPath" mode="aspectFit" />
            <view class="resource-info">
              <text class="resource-value" :class="'color-' + item.type">{{ item.value }}</text>
              <text class="resource-label">{{ item.label }}</text>
            </view>
            <text v-if="item.routeType" class="resource-enter">›</text>
            <view v-if="idx < resources.length - 1" class="resource-divider" />
          </view>
        </view>

        <!-- 签到行 -->
        <view class="checkin-row">
          <text class="checkin-hint">
            {{ totalCheckinCount > 0 ? `总签到 ${totalCheckinCount} 次` : "今日还未签到" }}
          </text>
          <button class="checkin-btn" :disabled="isCheckingIn" @tap="handleDailyCheckin">
            <text class="checkin-label">{{ checkinButtonText }}</text>
          </button>
        </view>
      </view>

      <text v-if="feedbackMessage" class="feedback-text">{{ feedbackMessage }}</text>

      <view v-if="workProfileCtaVisible" class="vs-panel vs-card-raised cta-card">
        <view class="cta-info">
          <text class="cta-title">配置工作档案</text>
          <text class="cta-desc">填写薪资和上班时间，首页显示实时已摸金额</text>
        </view>
        <button class="compact-button cta-action-button" @tap="openWorkProfileSettings">
          去配置
        </button>
      </view>

      <!-- 本人状态 -->
      <view class="vs-panel vs-card-raised status-card">
        <view class="status-work-row">
          <view class="status-work-info">
            <text class="status-section-label">工作档案</text>
            <view v-if="workSnapshot" class="status-chips">
              <text class="status-chip">
                {{ workSnapshot.workTime.startTime }}–{{ workSnapshot.workTime.endTime }}
              </text>
              <text class="status-chip">发薪 {{ workSnapshot.payday.dayOfMonth }} 号</text>
            </view>
            <text v-else class="status-empty-hint">尚未配置</text>
          </view>
          <text class="status-link" @tap="openWorkProfileSettings">设置 ›</text>
        </view>

        <view class="status-divider" />

        <view class="status-survival-row">
          <text class="status-section-label">今日生存消耗</text>
          <text class="status-link" @tap="openAccountingLedger">账本 ›</text>
        </view>
        <view class="survival-amounts">
          <view v-for="item in survivalItems" :key="item.label" class="survival-item">
            <image class="survival-icon" :src="item.iconPath" mode="aspectFit" />
            <view class="survival-copy">
              <text class="survival-label">{{ item.label }}</text>
              <text class="survival-amount">{{ item.amount }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 菜单 + 阵营插画 -->
      <view class="profile-body">
        <view class="menu-list vs-panel vs-card-raised">
          <view v-for="menu in menus" :key="menu.name" class="menu-item" @tap="handleMenuTap(menu)">
            <view class="vs-row menu-left">
              <view class="menu-icon-slot">
                <image class="menu-icon" :src="menuIconPath(menu)" mode="aspectFit" />
              </view>
              <text class="menu-label-text">{{ menu.name }}</text>
              <text v-if="menuBadgeText(menu)" class="menu-red-dot">{{ menuBadgeText(menu) }}</text>
            </view>
            <text class="enter-arrow">›</text>
          </view>
        </view>

        <view class="vs-panel vs-card-raised domain-card">
          <image class="domain-bg" :src="currentArtworkPath" mode="aspectFill" />
          <view class="domain-overlay" />
          <view class="domain-copy">
            <text class="domain-title">{{ profile.factionLabel }}修行中</text>
            <text class="domain-desc">今日隐修，摸鱼值 +20</text>
          </view>
        </view>
      </view>
    </template>
  </view>
</template>

<style>
.vs-page {
  min-height: 100vh;
  background: var(--camp-page-background);
}

/* 空状态 / 建档 */
.empty-state,
.create-card {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.empty-title {
  font-size: 28rpx;
  font-weight: 900;
  color: var(--camp-text-strong);
}

.empty-desc,
.feedback-text,
.checkin-desc {
  font-size: 22rpx;
  line-height: 1.5;
  color: var(--camp-text-soft);
}

.feedback-text {
  font-size: 22rpx;
  color: var(--camp-gold);
}

.primary-button {
  min-height: 72rpx;
  border-radius: 10rpx;
  background: var(--vs-button-bg);
  color: var(--vs-button-text);
  font-size: 26rpx;
  font-weight: 900;
}

.compact-button {
  min-height: 64rpx;
  min-width: 152rpx;
  flex-shrink: 0;
  border-radius: 10rpx;
  background: var(--vs-button-bg);
  color: var(--vs-button-text);
  font-size: 24rpx;
  font-weight: 900;
}

.profession-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
}

.profession-item {
  display: flex;
  min-height: 120rpx;
  flex-direction: column;
  gap: 8rpx;
  padding: 16rpx;
  border: 2rpx solid var(--camp-border);
  border-radius: 10rpx;
  background: var(--camp-surface);
}

.profession-active {
  border-color: rgba(236, 178, 255, 0.54);
  background: rgba(189, 0, 255, 0.1);
}

.profession-title {
  color: var(--camp-text-strong);
  font-size: 22rpx;
  font-weight: 900;
  line-height: 1.35;
}

.profession-desc {
  color: var(--camp-text-soft);
  font-size: 18rpx;
  line-height: 1.35;
}

/* ── 身份主卡 ── */
.hero-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  overflow: visible !important;
  padding: 28rpx 24rpx 24rpx !important;
  border-radius: 14rpx !important;
  background:
    radial-gradient(ellipse at 12% 18%, rgba(236, 178, 255, 0.15), transparent 172rpx),
    radial-gradient(ellipse at 92% 18%, rgba(0, 219, 233, 0.12), transparent 156rpx),
    radial-gradient(ellipse at 50% 112%, rgba(154, 106, 22, 0.08), transparent 240rpx),
    linear-gradient(145deg, rgba(255, 255, 255, 0.035), transparent 36%),
    linear-gradient(180deg, #19162a 0%, #111121 58%, #151220 100%) !important;
  box-shadow:
    inset 0 0 0 1rpx rgba(255, 236, 176, 0.08),
    inset 0 18rpx 36rpx rgba(255, 255, 255, 0.035),
    inset 0 -18rpx 28rpx rgba(0, 0, 0, 0.24),
    0 8rpx 0 rgba(0, 0, 0, 0.34),
    0 18rpx 28rpx rgba(0, 0, 0, 0.28) !important;
}

.hero-top,
.resources-row {
  position: relative;
  z-index: 2;
}

.hero-top {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.avatar-frame {
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
  border: 3rpx solid rgba(236, 178, 255, 0.45);
}

.avatar-frame image {
  width: 100%;
  height: 100%;
}

.hero-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.name-row {
  gap: 8rpx;
  align-items: center;
  min-width: 0;
}

.user-name {
  min-width: 0;
  overflow: hidden;
  color: var(--camp-text-strong);
  font-size: 36rpx;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.icon-button {
  display: flex;
  width: 48rpx;
  height: 48rpx;
  min-width: 48rpx;
  min-height: 48rpx;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 8rpx;
  border: 1rpx solid rgba(236, 178, 255, 0.3);
  background: rgba(189, 0, 255, 0.1);
  color: var(--camp-primary);
  font-size: 22rpx;
  line-height: 48rpx;
}

.sub-rank {
  display: block;
  overflow: hidden;
  color: var(--camp-text-soft);
  font-size: 20rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.level-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 2rpx;
  min-width: 0;
}

.level-tag {
  font-size: 18rpx;
  font-weight: 900;
  color: var(--camp-gold);
  font-family: var(--vs-font-display);
  min-width: 52rpx;
}

.xp-bar-wrap {
  flex: 1;
  height: 8rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.07);
  overflow: hidden;
}

.xp-bar-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--camp-gold) 0%, var(--camp-primary) 100%);
}

.xp-num {
  overflow: hidden;
  max-width: 116rpx;
  font-size: 16rpx;
  color: var(--camp-text-soft);
  font-family: var(--vs-font-display);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge-frame {
  width: 72rpx;
  height: 72rpx;
  flex-shrink: 0;
  align-self: flex-start;
}

.badge-frame image {
  width: 100%;
  height: 100%;
}

/* 资源行 */
.resources-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 16rpx 0 4rpx;
  border-top: 1rpx solid var(--camp-border);
}

.resource-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  flex: 1 1 0;
  min-width: 0;
  position: relative;
}

.resource-item-link {
  cursor: pointer;
}

.resource-icon {
  width: 54rpx;
  height: 54rpx;
  flex-shrink: 0;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.resource-info {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2rpx;
  align-items: flex-start;
}

.resource-value {
  overflow: hidden;
  max-width: 100%;
  font-size: 30rpx;
  font-weight: 900;
  font-family: var(--vs-font-display);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-label {
  overflow: hidden;
  max-width: 100%;
  font-size: 18rpx;
  color: var(--camp-text-soft);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-divider {
  position: absolute;
  right: 0;
  top: 10%;
  width: 1rpx;
  height: 80%;
  background: var(--camp-border);
}

.color-following {
  color: var(--camp-cyan);
}
.color-followers {
  color: var(--camp-primary);
}
.color-reward {
  color: #10b981;
}

/* 签到行 */
.checkin-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-height: 78rpx;
  padding-top: 10rpx;
  padding-right: 248rpx;
  border-top: 1rpx solid var(--camp-border);
  box-sizing: border-box;
}

.checkin-hint {
  overflow: hidden;
  font-size: 22rpx;
  color: var(--camp-text-soft);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.checkin-btn {
  position: absolute;
  right: 24rpx;
  bottom: 20rpx;
  display: flex;
  width: 152rpx;
  height: 58rpx;
  min-height: 58rpx;
  min-width: 152rpx;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  border-radius: 10rpx;
  background: var(--camp-gold);
  color: #111827;
  font-size: 24rpx;
  font-weight: 900;
  line-height: 58rpx;
  box-shadow: 0 8rpx 0 rgba(0, 0, 0, 0.42);
}

/* CTA 卡 */
.cta-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  border-color: rgba(154, 106, 22, 0.3) !important;
}

.cta-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  min-width: 0;
}

.cta-title {
  font-size: 26rpx;
  font-weight: 900;
  color: var(--camp-text-strong);
}

.cta-desc {
  font-size: 20rpx;
  color: var(--camp-text-soft);
  line-height: 1.4;
}

/* ── 本人状态卡 ── */
.status-card {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.status-work-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12rpx;
}

.status-work-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.status-section-label {
  font-size: 20rpx;
  color: var(--camp-text-soft);
  font-weight: 700;
  letter-spacing: 1rpx;
}

.status-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
}

.status-chip {
  padding: 6rpx 16rpx;
  border: 1rpx solid var(--camp-border);
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 700;
  color: var(--camp-text);
  background: var(--camp-surface);
}

.status-empty-hint {
  font-size: 22rpx;
  color: var(--camp-text-soft);
}

.status-link {
  font-size: 22rpx;
  color: var(--camp-gold);
  font-weight: 700;
  flex-shrink: 0;
}

.status-divider {
  height: 1rpx;
  background: var(--camp-border);
}

.status-survival-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.survival-amounts {
  display: flex;
  align-items: stretch;
  gap: 0;
  padding-top: 4rpx;
}

.survival-item {
  flex: 1 1 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  min-width: 0;
  padding: 10rpx 8rpx;
  box-sizing: border-box;
}

.survival-item + .survival-item {
  border-left: 1rpx solid rgba(255, 255, 255, 0.18);
}

.survival-icon {
  width: 64rpx;
  height: 64rpx;
  flex-shrink: 0;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.survival-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4rpx;
}

.survival-label {
  overflow: hidden;
  font-size: 22rpx;
  color: #fff8f2;
  font-weight: 800;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.survival-amount {
  font-size: 24rpx;
  font-weight: 900;
  color: var(--camp-gold);
  font-family: var(--vs-font-display);
  line-height: 1.1;
}

.survival-sep {
  display: none;
}

/* ── 菜单 + 阵营卡 ── */
.profile-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 14rpx;
}

.menu-list {
  display: flex;
  flex-direction: column;
  padding: 8rpx 18rpx !important;
}

.menu-item {
  display: flex;
  min-height: 76rpx;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1rpx solid var(--camp-border);
  gap: 10rpx;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-left {
  gap: 12rpx;
  min-width: 0;
}

.menu-icon-slot {
  display: flex;
  width: 46rpx;
  height: 46rpx;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.menu-icon {
  width: 46rpx;
  height: 46rpx;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.menu-red-dot {
  min-width: 26rpx;
  height: 26rpx;
  padding: 0 8rpx;
  border-radius: 999rpx;
  background: var(--camp-danger);
  color: #3a0000;
  font-size: 16rpx;
  font-weight: 900;
  line-height: 26rpx;
  text-align: center;
}

.enter-arrow {
  color: var(--camp-text-soft);
  font-size: 28rpx;
}

.menu-label-text {
  overflow: hidden;
  font-size: 24rpx;
  font-weight: 700;
  color: var(--camp-text);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.domain-card {
  position: relative;
  min-height: 420rpx;
  padding: 0 !important;
  border-color: rgba(236, 178, 255, 0.25) !important;
  overflow: hidden;
  border-radius: 16rpx;
}

.domain-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.domain-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(5, 8, 18, 0.3),
    rgba(5, 8, 18, 0) 50%,
    rgba(5, 8, 18, 0.65)
  );
}

.domain-copy {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  margin: 14rpx;
  padding: 18rpx;
  border-radius: 8rpx;
  background: var(--camp-overlay);
}

.domain-title {
  font-size: 22rpx;
  font-weight: 900;
  color: var(--camp-text-strong);
  text-shadow: 0 2rpx 6rpx var(--camp-image-text-shadow);
}

.domain-desc {
  font-size: 18rpx;
  color: var(--camp-gold);
  font-weight: 700;
  text-shadow: 0 2rpx 6rpx var(--camp-image-text-shadow);
}

.cta-action-button {
  display: flex;
  width: 132rpx;
  height: 56rpx;
  min-width: 132rpx;
  min-height: 56rpx;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  border: 1rpx solid rgba(154, 106, 22, 0.42);
  border-radius: 8rpx;
  background: rgba(154, 106, 22, 0.1);
  color: var(--camp-gold);
  font-size: 22rpx;
  font-weight: 800;
  line-height: 56rpx;
}

.cta-action-button::after {
  border: 0;
}

.profession-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
}

.profession-item {
  display: flex;
  min-height: 132rpx;
  flex-direction: column;
  gap: 8rpx;
  padding: 16rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.08);
  border-radius: 8rpx;
  background: rgba(9, 12, 24, 0.76);
}

.profession-active {
  border-color: rgba(154, 106, 22, 0.82);
  background: rgba(154, 106, 22, 0.12);
}

.profession-title {
  color: var(--camp-text-strong);
  font-size: 22rpx;
  font-weight: 900;
  line-height: 1.35;
}

.profession-desc {
  color: #8b90b0;
  font-size: 18rpx;
  line-height: 1.35;
}

.hero-profile {
  display: flex;
  align-items: center;
  gap: 22rpx;
  min-height: 152rpx;
  padding: 22rpx 24rpx !important;
}

.avatar-frame {
  position: relative;
  width: 124rpx;
  height: 124rpx;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
  border: 3rpx solid rgba(154, 106, 22, 0.55);
  box-shadow: 0 0 24rpx rgba(154, 106, 22, 0.18);
}

.avatar-frame image {
  width: 100%;
  height: 100%;
}

.profile-copy {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.name-edit-row {
  gap: 8rpx;
}

.user-name {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  color: var(--camp-text-strong);
  font-size: 38rpx;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.icon-button {
  display: flex;
  width: 52rpx;
  height: 52rpx;
  min-width: 52rpx;
  min-height: 52rpx;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 8rpx;
  border: 1rpx solid rgba(154, 106, 22, 0.36);
  background: rgba(154, 106, 22, 0.12);
  color: #9a6a16;
  font-size: 24rpx;
  line-height: 52rpx;
}

.sub-rank {
  display: block;
  overflow: hidden;
  color: #8b90b0;
  font-size: 22rpx;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rpg-stat-line {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-top: 6rpx;
}

.stat-prefix {
  font-size: 18rpx;
  font-weight: 900;
  min-width: 50rpx;
}

.hp-color {
  color: #9a6a16;
}

.bar-flex {
  flex: 1;
}

.stat-num {
  font-size: 16rpx;
  color: #8b90b0;
  font-family: var(--vs-font-display);
}

.badge-frame {
  width: 82rpx;
  height: 82rpx;
  flex-shrink: 0;
  align-self: flex-start;
}

.badge-frame image {
  width: 100%;
  height: 100%;
}

.resources-card {
  padding: 20rpx 12rpx !important;
}

.resources-row {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 8rpx;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 6rpx;
  flex: 1 1 0;
  min-width: 0;
  justify-content: center;
  position: relative;
}

.resource-icon {
  width: 54rpx;
  height: 54rpx;
  flex-shrink: 0;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.resource-info {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
}

.resource-label {
  overflow: hidden;
  max-width: 100%;
  font-size: 18rpx;
  color: #8b90b0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-value {
  overflow: hidden;
  max-width: 100%;
  font-size: 26rpx;
  font-weight: 900;
  font-family: var(--vs-font-display);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-divider {
  position: absolute;
  right: 0;
  top: 10%;
  width: 1rpx;
  height: 80%;
  background: rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.color-gold {
  color: #fbbf24;
}
.color-blue {
  color: #38bdf8;
}
.color-red {
  color: #ef4444;
}

.checkin-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.checkin-card > view,
.first-run-next-card > view {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6rpx;
}

.first-run-next-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  border-color: rgba(154, 106, 22, 0.34) !important;
}

.select-more {
  color: #8b90b0;
  font-size: 20rpx;
}

/* 本人状态摘要 */
.status-summary-card {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.status-summary-header {
  align-items: center;
}

.status-summary-action {
  font-size: 22rpx;
  color: #9a6a16;
  font-weight: 700;
}

.status-summary-work {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.status-summary-item {
  font-size: 22rpx;
  color: #8b90b0;
}

.status-summary-empty {
  font-size: 22rpx;
  color: #6b7194;
}

.status-summary-label {
  font-size: 22rpx;
  color: #8b90b0;
  font-weight: 700;
}

.status-summary-survival {
  margin-top: 4rpx;
  align-items: center;
}

.status-survival-grid {
  gap: 10rpx;
}

.status-survival-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  padding: 12rpx 8rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.07);
  border-radius: 10rpx;
  background: #181c32;
}

.status-survival-label {
  font-size: 18rpx;
  color: #6b7194;
}

.status-survival-amount {
  font-size: 22rpx;
  font-weight: 900;
  color: #9a6a16;
  font-family: var(--vs-font-display);
}

.profile-body {
  display: grid;
  grid-template-columns: minmax(0, 0.96fr) minmax(0, 1.04fr);
  gap: 14rpx;
}

.menu-list {
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  padding: 10rpx 18rpx !important;
}

.menu-item {
  display: flex;
  flex: 1;
  min-height: 72rpx;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.07);
  gap: 12rpx;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-left {
  gap: 12rpx;
  min-width: 0;
}

.menu-icon-slot {
  display: flex;
  width: 46rpx;
  height: 46rpx;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.menu-icon {
  width: 46rpx;
  height: 46rpx;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.menu-red-dot {
  min-width: 26rpx;
  height: 26rpx;
  padding: 0 8rpx;
  border-radius: 999rpx;
  background: #ef4444;
  color: var(--camp-text-strong);
  font-size: 16rpx;
  font-weight: 900;
  line-height: 26rpx;
  text-align: center;
}

.enter-arrow {
  color: #6b7194;
  font-size: 30rpx;
  line-height: 1;
}

.menu-label-text {
  overflow: hidden;
  font-size: 24rpx;
  font-weight: 700;
  color: var(--camp-text-strong);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.domain-card {
  position: relative;
  min-height: 420rpx;
  aspect-ratio: 5 / 7;
  padding: 0 !important;
  border-color: rgba(154, 106, 22, 0.3) !important;
  overflow: hidden;
}

.domain-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.domain-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(5, 8, 18, 0.42),
    rgba(5, 8, 18, 0.04) 46%,
    rgba(5, 8, 18, 0.56)
  );
}

.domain-copy {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin: 14rpx;
  padding: 12rpx 14rpx;
  border-radius: 8rpx;
  background: var(--camp-overlay);
}

.domain-title {
  font-size: 24rpx;
  font-weight: 900;
  color: var(--camp-text-strong);
  text-shadow: 0 2rpx 8rpx var(--camp-image-text-shadow);
}

.domain-desc {
  font-size: 18rpx;
  color: #9a6a16;
  font-weight: 800;
  line-height: 1.35;
  text-shadow: 0 2rpx 8rpx var(--camp-image-text-shadow);
}

/* 首次进入 / 建档流程 */
.entry-flow,
.create-flow {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.entry-hero-card {
  position: relative;
  min-height: 300rpx;
  overflow: hidden;
  padding: 30rpx 28rpx !important;
  background: #090c18 !important;
}

.entry-hero-bg,
.entry-hero-shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border-radius: 14rpx;
}

.entry-hero-bg {
  z-index: 0;
}

.entry-hero-shade {
  z-index: 1;
  background:
    linear-gradient(
      90deg,
      rgba(5, 7, 14, 0.78) 0%,
      rgba(5, 7, 14, 0.5) 48%,
      rgba(5, 7, 14, 0.08) 100%
    ),
    linear-gradient(0deg, rgba(5, 7, 14, 0.26), rgba(5, 7, 14, 0.04));
}

.entry-copy,
.create-header {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.entry-kicker {
  color: var(--camp-cyan);
  font-size: 20rpx;
  font-weight: 900;
}

.entry-title {
  color: var(--camp-text-strong);
  font-size: 36rpx;
  font-weight: 900;
  line-height: 1.25;
}

.entry-desc {
  max-width: 430rpx;
  color: var(--camp-text-soft);
  font-size: 22rpx;
  line-height: 1.55;
}

.entry-primary-button {
  position: relative;
  z-index: 2;
  display: flex;
  width: 220rpx;
  height: 72rpx;
  min-height: 72rpx;
  align-items: center;
  justify-content: center;
  margin: 28rpx 0 0;
  padding: 0;
  border: 2rpx solid var(--vs-button-border);
  border-radius: 8rpx;
  background: var(--vs-button-bg);
  color: var(--vs-button-text);
  font-size: 24rpx;
  font-weight: 900;
  line-height: 72rpx;
  box-shadow:
    inset 0 -4rpx 0 rgba(0, 0, 0, 0.18),
    5rpx 5rpx 0 rgba(0, 0, 0, 0.42);
}

.entry-primary-button::after {
  border: 0;
}
.entry-primary-button[disabled] {
  opacity: 0.52;
  box-shadow: none;
}

.entry-step-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
}

.entry-step {
  display: flex;
  min-height: 120rpx;
  flex-direction: column;
  justify-content: center;
  gap: 4rpx;
  padding: 16rpx;
  border: 1rpx solid var(--camp-border);
  border-radius: 8rpx;
  background: var(--camp-surface);
}

.entry-step-index {
  color: var(--camp-cyan);
  font-size: 18rpx;
  font-weight: 900;
}

.entry-step-title {
  color: var(--camp-text-strong);
  font-size: 24rpx;
  font-weight: 900;
}

.entry-step-desc {
  color: var(--camp-text-soft);
  font-size: 18rpx;
  line-height: 1.35;
}

.create-header {
  padding: 4rpx 0 2rpx;
}

.profession-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
}

.profession-item {
  position: relative;
  min-height: 168rpx;
  overflow: hidden;
  padding: 0;
  border: 1rpx solid var(--camp-border);
  border-radius: 10rpx;
  background: var(--camp-surface);
}

.profession-content {
  position: relative;
  z-index: 1;
  display: flex;
  min-height: 168rpx;
  flex-direction: column;
  justify-content: space-between;
  gap: 14rpx;
  padding: 16rpx;
  box-sizing: border-box;
}

.profession-topline {
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.profession-badge {
  width: 48rpx;
  height: 48rpx;
  flex-shrink: 0;
}
.profession-name-block {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2rpx;
}

.profession-title {
  overflow: hidden;
  color: var(--camp-text-strong);
  font-size: 24rpx;
  font-weight: 900;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profession-subtitle {
  overflow: hidden;
  color: var(--camp-gold);
  font-size: 17rpx;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profession-desc {
  color: var(--camp-text-muted);
  font-size: 20rpx;
  font-weight: 800;
  line-height: 1.35;
}

.profession-active {
  border-color: rgba(236, 178, 255, 0.86);
  box-shadow:
    inset 0 0 0 2rpx rgba(189, 0, 255, 0.16),
    0 0 26rpx rgba(189, 0, 255, 0.12);
}

.profession-selected {
  position: absolute;
  right: 12rpx;
  bottom: 12rpx;
  z-index: 2;
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  background: var(--camp-primary);
  color: #1a0028;
  font-size: 18rpx;
  font-weight: 900;
}

.vs-mode-workplace .profession-active {
  border-color: rgba(154, 106, 22, 0.86);
  background: rgba(154, 106, 22, 0.14);
  box-shadow:
    inset 0 0 0 2rpx rgba(154, 106, 22, 0.18),
    0 0 18rpx rgba(154, 106, 22, 0.16);
}

.vs-mode-workplace .profession-selected {
  background: var(--camp-gold);
  color: #111827;
}

.create-submit {
  align-self: center;
  margin-top: 6rpx;
}

.primary-button,
.compact-button,
.entry-primary-button,
.checkin-btn {
  border: 2rpx solid var(--vs-button-border);
  border-radius: 4rpx;
  background: var(--vs-button-bg);
  color: var(--vs-button-text);
  font-family: var(--vs-font-display);
  font-weight: 900;
  box-shadow:
    inset 0 -4rpx 0 rgba(0, 0, 0, 0.18),
    inset 0 3rpx 0 rgba(255, 255, 255, 0.22),
    5rpx 5rpx 0 rgba(0, 0, 0, 0.42);
}

.cta-action-button,
.icon-button {
  border: 2rpx solid rgba(236, 178, 255, 0.4);
  border-radius: 4rpx;
  background: rgba(189, 0, 255, 0.1);
  color: var(--camp-primary);
  font-family: var(--vs-font-display);
  box-shadow:
    inset 0 -3rpx 0 rgba(0, 0, 0, 0.18),
    3rpx 3rpx 0 rgba(0, 0, 0, 0.32);
}

.vs-mode-workplace .cta-action-button,
.vs-mode-workplace .icon-button {
  border-color: var(--vs-button-ghost-border);
  background: var(--vs-button-ghost-bg);
  color: var(--vs-button-ghost-text);
}

.primary-button::after,
.compact-button::after,
.entry-primary-button::after,
.checkin-btn::after,
.cta-action-button::after,
.icon-button::after {
  border: 0;
}

.primary-button:active,
.compact-button:active,
.entry-primary-button:active,
.checkin-btn:active,
.cta-action-button:active,
.icon-button:active {
  transform: translate(4rpx, 4rpx);
  box-shadow:
    inset 0 -2rpx 0 rgba(0, 0, 0, 0.16),
    1rpx 1rpx 0 rgba(0, 0, 0, 0.42);
}

.primary-button[disabled],
.compact-button[disabled],
.entry-primary-button[disabled],
.checkin-btn[disabled] {
  border-color: var(--camp-border);
  background: var(--camp-surface);
  color: var(--camp-text-soft);
  box-shadow:
    inset 0 -3rpx 0 rgba(0, 0, 0, 0.16),
    3rpx 3rpx 0 rgba(0, 0, 0, 0.35);
  text-shadow: none;
}

.checkin-btn {
  right: 22rpx;
  bottom: 16rpx;
  width: 196rpx;
  height: 70rpx;
  min-width: 196rpx;
  min-height: 70rpx;
  padding: 0 18rpx;
  border-radius: 8rpx;
  line-height: 1;
}

.checkin-label {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  color: #111827;
  font-size: 22rpx;
  font-weight: 900;
  line-height: 1.1;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.checkin-btn:active {
  transform: translateY(6rpx);
  box-shadow:
    inset 0 -2rpx 0 rgba(0, 0, 0, 0.16),
    1rpx 1rpx 0 rgba(0, 0, 0, 0.42);
}

.checkin-btn[disabled] {
  background: var(--camp-surface);
  color: var(--camp-text-soft);
  filter: saturate(0.4);
}

/* 社交三项状态覆盖：放在末尾，避免历史资源行样式覆盖。 */
.hero-card .resources-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8rpx;
  align-items: stretch;
  justify-content: stretch;
  padding: 16rpx 0 6rpx;
  border-top: 1rpx solid var(--camp-border);
}

.hero-card .resource-item {
  display: grid;
  grid-template-columns: 42rpx minmax(0, 1fr) 18rpx;
  min-width: 0;
  align-items: center;
  justify-content: stretch;
  gap: 6rpx;
  padding: 8rpx 10rpx;
  border-radius: 8rpx;
  box-sizing: border-box;
}

.hero-card .resource-item-link {
  border: 1rpx solid rgba(236, 178, 255, 0.16);
  background: rgba(236, 178, 255, 0.055);
  cursor: pointer;
}

.hero-card .resource-item-link:active {
  opacity: 0.78;
  transform: translateY(2rpx);
}

.hero-card .resource-icon {
  width: 42rpx;
  height: 42rpx;
}

.hero-card .resource-info {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 2rpx;
}

.hero-card .resource-value {
  max-width: 100%;
  overflow: hidden;
  font-size: 25rpx;
  line-height: 1.1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hero-card .resource-label {
  max-width: 100%;
  overflow: hidden;
  font-size: 17rpx;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-enter {
  color: var(--camp-text-soft);
  font-size: 24rpx;
  line-height: 1;
  text-align: right;
}

.hero-card .resource-item:not(.resource-item-link) .resource-enter {
  visibility: hidden;
}

.hero-card .resource-divider {
  right: -4rpx;
  background: rgba(255, 255, 255, 0.08);
}

.hero-card .checkin-row {
  min-height: 78rpx;
  padding-top: 10rpx;
  padding-right: 230rpx;
}

.hero-card .checkin-hint {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 工位模式里的登录卡跟随本人信息卡的轻白卡片体系；隐者模式保留原暗色英雄图。 */
.vs-mode-workplace .entry-hero-card {
  overflow: hidden !important;
  padding: 28rpx 24rpx 24rpx !important;
  border: 1rpx solid rgba(216, 201, 180, 0.92) !important;
  border-radius: 12rpx !important;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 253, 248, 0.88) 100%), #fffdf8 !important;
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.92),
    0 4rpx 10rpx rgba(17, 24, 39, 0.08),
    0 12rpx 24rpx rgba(17, 24, 39, 0.1) !important;
}

.vs-mode-workplace .entry-hero-card::before,
.vs-mode-workplace .entry-hero-card::after {
  position: absolute;
  left: 24rpx;
  right: 24rpx;
  z-index: 3;
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

.vs-mode-workplace .entry-hero-card::before {
  top: 0;
}

.vs-mode-workplace .entry-hero-card::after {
  bottom: 0;
  opacity: 0.45;
}

.vs-mode-workplace .entry-hero-bg {
  border-radius: 12rpx;
  opacity: 0.84;
  filter: saturate(0.82) contrast(0.92) brightness(1.03);
  transform: scale(1.01);
}

.vs-mode-workplace .entry-hero-shade {
  display: block;
  border-radius: 12rpx;
  background:
    linear-gradient(
      90deg,
      rgba(255, 253, 248, 0.92) 0%,
      rgba(255, 253, 248, 0.82) 44%,
      rgba(255, 253, 248, 0.38) 72%,
      rgba(255, 253, 248, 0.08) 100%
    ),
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 250, 241, 0.2));
}

.vs-mode-workplace .domain-overlay {
  display: none;
}

.vs-mode-workplace .entry-hero-card .vs-hero-frame-layer {
  display: none;
}

.vs-mode-workplace .entry-hero-card .entry-kicker {
  color: #8a5e12;
  text-shadow: none;
}

.vs-mode-workplace .entry-hero-card .entry-title,
.vs-mode-workplace .domain-card .domain-title {
  color: #17130f;
  text-shadow: none;
}

.vs-mode-workplace .entry-hero-card .entry-desc {
  color: #5f5142;
  text-shadow: none;
}

.vs-mode-workplace .entry-hero-card .entry-primary-button {
  width: 188rpx;
  height: 60rpx;
  min-width: 188rpx;
  min-height: 60rpx;
  margin-top: 24rpx;
  border: 1rpx solid #b87912 !important;
  border-radius: 6rpx !important;
  background: #f7a516;
  color: #17130f;
  font-size: 22rpx;
  line-height: 60rpx;
  text-shadow: none;
  box-shadow:
    0 4rpx 0 #b87912,
    0 9rpx 16rpx rgba(154, 106, 22, 0.2) !important;
}

.vs-mode-workplace .profile-identity-card {
  overflow: hidden !important;
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

.vs-mode-workplace .profile-identity-card::before,
.vs-mode-workplace .profile-identity-card::after {
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

.vs-mode-workplace .profile-identity-card::before {
  top: 0;
}

.vs-mode-workplace .profile-identity-card::after {
  bottom: 0;
  opacity: 0.45;
}

.vs-mode-workplace .profile-identity-card .vs-hero-frame-layer {
  display: none;
}

.vs-mode-workplace .profile-identity-card .avatar-frame {
  border-color: rgba(216, 201, 180, 0.88);
  background: #fffdf8;
  box-shadow:
    0 0 0 4rpx rgba(245, 239, 228, 0.84),
    0 8rpx 16rpx rgba(17, 24, 39, 0.08);
}

.vs-mode-workplace .profile-identity-card .user-name {
  color: #17130f;
  text-shadow: none;
}

.vs-mode-workplace .profile-identity-card .sub-rank,
.vs-mode-workplace .profile-identity-card .xp-num,
.vs-mode-workplace .profile-identity-card .resource-label,
.vs-mode-workplace .profile-identity-card .checkin-hint,
.vs-mode-workplace .profile-identity-card .resource-enter {
  color: #665c50;
  text-shadow: none;
}

.vs-mode-workplace .profile-identity-card .icon-button {
  border-color: rgba(47, 111, 115, 0.24);
  background: rgba(47, 111, 115, 0.08);
  color: #2f6f73;
  box-shadow: none;
}

.vs-mode-workplace .profile-identity-card .level-tag {
  color: #9a6a16;
}

.vs-mode-workplace .profile-identity-card .xp-bar-wrap {
  background: rgba(154, 106, 22, 0.14);
  box-shadow: inset 0 0 0 1rpx rgba(154, 106, 22, 0.08);
}

.vs-mode-workplace .profile-identity-card .xp-bar-fill {
  background: linear-gradient(90deg, #f7a516 0%, #2f6f73 100%);
}

.vs-mode-workplace .profile-identity-card .resources-row,
.vs-mode-workplace .profile-identity-card .checkin-row {
  border-top-color: rgba(216, 201, 180, 0.92);
}

.vs-mode-workplace .profile-identity-card .resource-item {
  border: 1rpx solid rgba(216, 201, 180, 0.68);
  background: rgba(255, 253, 248, 0.74);
}

.vs-mode-workplace .profile-identity-card .resource-item-link {
  border-color: rgba(47, 111, 115, 0.2);
  background: rgba(47, 111, 115, 0.045);
  box-shadow: inset 0 0 0 1rpx rgba(255, 253, 248, 0.66);
}

.vs-mode-workplace .profile-identity-card .resource-item-link:active {
  background: rgba(47, 111, 115, 0.1);
}

.vs-mode-workplace .profile-identity-card .resource-divider {
  display: none;
}

.vs-mode-workplace .profile-identity-card .checkin-btn {
  border-color: #b87912;
  border-radius: 6rpx;
  background: #f7a516;
  color: #17130f;
  box-shadow:
    0 5rpx 0 #b87912,
    0 10rpx 18rpx rgba(154, 106, 22, 0.24);
}

.vs-mode-workplace .profile-identity-card .checkin-btn[disabled] {
  border: 1rpx solid rgba(216, 201, 180, 0.88);
  background: #efe3d0;
  color: #8a7d6d;
  box-shadow: none;
}

.vs-mode-workplace .profile-identity-card .checkin-btn[disabled] .checkin-label {
  color: #8a7d6d;
}

.vs-mode-hermit .profile-identity-card {
  overflow: hidden !important;
  padding: 26rpx 24rpx 22rpx !important;
  border: 1rpx solid rgba(236, 178, 255, 0.2) !important;
  border-radius: 12rpx !important;
  background:
    linear-gradient(180deg, rgba(23, 23, 34, 0.96) 0%, rgba(10, 10, 18, 0.98) 100%), #0b0b12 !important;
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.07),
    0 8rpx 20rpx rgba(0, 0, 0, 0.28),
    0 18rpx 30rpx rgba(0, 0, 0, 0.22) !important;
}

.vs-mode-hermit .profile-identity-card::before,
.vs-mode-hermit .profile-identity-card::after {
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
    rgba(233, 196, 0, 0.78) 0%,
    rgba(233, 196, 0, 0.78) 22%,
    rgba(0, 219, 233, 0.22) 22%,
    rgba(0, 219, 233, 0.22) 100%
  );
}

.vs-mode-hermit .profile-identity-card::before {
  top: 0;
}

.vs-mode-hermit .profile-identity-card::after {
  bottom: 0;
  opacity: 0.42;
}

.vs-mode-hermit .profile-identity-card .vs-hero-frame-layer {
  display: none;
}

.vs-mode-hermit .profile-identity-card .avatar-frame {
  border-color: rgba(236, 178, 255, 0.24);
  background: #13131b;
  box-shadow:
    0 0 0 4rpx rgba(236, 178, 255, 0.04),
    0 10rpx 18rpx rgba(0, 0, 0, 0.24);
}

.vs-mode-hermit .profile-identity-card .user-name {
  color: #ffffff;
  text-shadow: none;
}

.vs-mode-hermit .profile-identity-card .sub-rank,
.vs-mode-hermit .profile-identity-card .xp-num,
.vs-mode-hermit .profile-identity-card .resource-label,
.vs-mode-hermit .profile-identity-card .checkin-hint,
.vs-mode-hermit .profile-identity-card .resource-enter {
  color: #b9afc4;
  text-shadow: none;
}

.vs-mode-hermit .profile-identity-card .icon-button {
  border-color: rgba(0, 219, 233, 0.22);
  background: rgba(0, 219, 233, 0.08);
  color: #00dbe9;
  box-shadow: none;
}

.vs-mode-hermit .profile-identity-card .level-tag {
  color: #e9c400;
}

.vs-mode-hermit .profile-identity-card .xp-bar-wrap {
  background: rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 0 0 1rpx rgba(255, 255, 255, 0.04);
}

.vs-mode-hermit .profile-identity-card .xp-bar-fill {
  background: linear-gradient(90deg, #e9c400 0%, #00dbe9 100%);
}

.vs-mode-hermit .profile-identity-card .resources-row,
.vs-mode-hermit .profile-identity-card .checkin-row {
  border-top-color: rgba(255, 255, 255, 0.08);
}

.vs-mode-hermit .profile-identity-card .resource-item {
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.035);
}

.vs-mode-hermit .profile-identity-card .resource-item-link {
  border-color: rgba(0, 219, 233, 0.18);
  background: rgba(0, 219, 233, 0.05);
  box-shadow: inset 0 0 0 1rpx rgba(255, 255, 255, 0.035);
}

.vs-mode-hermit .profile-identity-card .resource-item-link:active {
  background: rgba(0, 219, 233, 0.09);
}

.vs-mode-hermit .profile-identity-card .resource-divider {
  display: none;
}

.vs-mode-hermit .profile-identity-card .checkin-btn {
  border-color: #8f5f12;
  border-radius: 6rpx;
  background: #f7a516;
  color: #101217;
  box-shadow:
    0 5rpx 0 #8f5f12,
    0 10rpx 18rpx rgba(0, 0, 0, 0.26);
}

.vs-mode-hermit .profile-identity-card .checkin-btn[disabled] {
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  background: #25293a;
  color: #9d8ba0;
  box-shadow: none;
}

.vs-mode-hermit .profile-identity-card .checkin-btn[disabled] .checkin-label {
  color: #9d8ba0;
}

.vs-mode-workplace .domain-card {
  border-color: rgba(255, 224, 154, 0.38) !important;
  background: #090c18 !important;
}

.vs-mode-workplace .domain-card .domain-copy {
  background: rgba(8, 9, 12, 0.42);
}

.vs-mode-workplace .domain-card .domain-desc {
  color: #ffe7a3;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.68);
}
</style>
