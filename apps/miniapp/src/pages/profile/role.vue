<script setup lang="ts">
import { toggleVisualMode, useVisualModePage } from "../../services/visual-mode";
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import {
  USER_PROFESSION_LABELS,
  UserFaction,
  UserProfessionType,
  type UserFaction as UserFactionValue,
  type UserGrowthProfileSnapshot,
  type UserProfessionType as UserProfessionTypeValue
} from "@moyuxia/shared";
import {
  getLocalUserProfileSnapshot,
  getUserProfile,
  updateUserProfile
} from "../../services/user-growth-profile";
import {
  resolveProfileAvatarPathByKey,
  resolveProfileBadgePathByKey,
  resolveProfileHeroArtworkPath
} from "../../services/profile-assets";

const { visualMode, visualModeClass } = useVisualModePage();

const profile = ref<UserGrowthProfileSnapshot | null>(getLocalUserProfileSnapshot());
const isLoading = ref(false);
const isSaving = ref(false);
const feedbackMessage = ref("");
const displayNameDraft = ref("");
const jobTitleDraft = ref("");
const professionDraft = ref<UserProfessionTypeValue>(UserProfessionType.Engineering);
const factionDraft = ref<UserFactionValue>(UserFaction.KeyShadow);

const professionOptions = [
  { value: UserProfessionType.Engineering, title: "键影隐者（数字与技术）" },
  { value: UserProfessionType.CreativeOperations, title: "运影隐者（运营与商业）" },
  { value: UserProfessionType.ProductStrategy, title: "策影隐者（创意与内容）" },
  { value: UserProfessionType.BusinessSupport, title: "行影隐者（现实与执行）" }
] as const;

const factionOptions = [
  { value: UserFaction.KeyShadow, label: "键影隐者" },
  { value: UserFaction.WaterEscape, label: "运影隐者" },
  { value: UserFaction.SkyStrategy, label: "策影隐者" },
  { value: UserFaction.Wanderer, label: "行影隐者" }
] as const;

const avatarPath = computed(() =>
  profile.value ? resolveProfileAvatarPathByKey(profile.value.avatarKey, profile.value.faction) : ""
);
const badgePath = computed(() =>
  profile.value
    ? resolveProfileBadgePathByKey(profile.value.currentBadgeKey, profile.value.faction)
    : ""
);
const artworkPath = computed(() => resolveProfileHeroArtworkPath());

onLoad(() => {
  if (profile.value) {
    resetDraft(profile.value);
  }
  void syncProfile();
});

async function syncProfile(): Promise<void> {
  isLoading.value = true;
  feedbackMessage.value = "";

  try {
    const result = await getUserProfile();
    if (result.response.profile) {
      profile.value = result.response.profile;
      resetDraft(result.response.profile);
    }
  } catch (error) {
    feedbackMessage.value = error instanceof Error ? error.message : "角色资料暂时不可用";
  } finally {
    isLoading.value = false;
  }
}

async function saveRoleProfile(): Promise<void> {
  if (!profile.value || isSaving.value) {
    return;
  }

  isSaving.value = true;
  feedbackMessage.value = "";

  try {
    const response = await updateUserProfile({
      displayName: displayNameDraft.value,
      jobTitle: jobTitleDraft.value,
      professionType: professionDraft.value,
      faction: factionDraft.value
    });
    profile.value = response.profile;
    resetDraft(response.profile);
    feedbackMessage.value = "角色资料已保存。";
  } catch (error) {
    feedbackMessage.value = error instanceof Error ? error.message : "角色资料保存失败";
  } finally {
    isSaving.value = false;
  }
}

function resetDraft(snapshot: UserGrowthProfileSnapshot): void {
  displayNameDraft.value = snapshot.displayName;
  jobTitleDraft.value = snapshot.jobTitle;
  professionDraft.value = snapshot.professionType;
  factionDraft.value = snapshot.faction;
}

function handleToggleVisualMode(): void {
  const nextMode = toggleVisualMode();
  uni.showToast({
    title: nextMode === "hermit" ? "已进入隐者模式" : "已返回工位模式",
    icon: "none"
  });
}
</script>

<template>
  <view :class="['vs-page', 'vs-stack', visualModeClass]">
    <view v-if="profile" class="vs-panel vs-pixel-frame-primary vs-pixel-frame-gold role-hero">
      <image class="role-bg" :src="artworkPath" mode="aspectFill" />
      <view class="role-overlay" />
      <view class="role-hero-content">
        <image class="role-avatar" :src="avatarPath" mode="aspectFill" />
        <view class="role-title-copy">
          <text class="role-name">{{ profile.displayName }}</text>
          <text class="role-meta">{{ profile.factionLabel }} · LV.{{ profile.level }}</text>
        </view>
        <image class="role-badge" :src="badgePath" mode="aspectFit" />
      </view>
      <button
        :class="[
          'role-mode-switch',
          visualMode === 'hermit' ? 'role-mode-switch-hermit' : 'role-mode-switch-workplace'
        ]"
        @tap="handleToggleVisualMode"
      >
        <text class="role-mode-switch-thumb" />
        <view class="role-mode-switch-option role-mode-switch-option-workplace">
          <text class="role-mode-switch-main">工位模式</text>
          <text class="role-mode-switch-sub">（白色界面）</text>
        </view>
        <view class="role-mode-switch-option role-mode-switch-option-hermit">
          <text class="role-mode-switch-main">隐者模式</text>
          <text class="role-mode-switch-sub">（黑色界面）</text>
        </view>
      </button>
    </view>

    <view v-if="profile" class="vs-panel vs-card-raised role-form">
      <view class="vs-row-between role-header">
        <text class="section-title">我的角色</text>
        <text class="recommend-text">
          推荐：{{ profile.recommendation.recommendedFactionLabel }}
        </text>
      </view>

      <view class="form-field">
        <text class="field-label">昵称</text>
        <input v-model="displayNameDraft" class="field-input" maxlength="16" />
      </view>

      <view class="form-field">
        <text class="field-label">职业</text>
        <input
          v-model="jobTitleDraft"
          class="field-input"
          maxlength="24"
          placeholder="例如 前端开发"
        />
      </view>

      <view class="form-field">
        <text class="field-label">职业类型</text>
        <picker
          :range="professionOptions.map((item) => item.title)"
          :value="professionOptions.findIndex((item) => item.value === professionDraft)"
          @change="
            professionDraft =
              professionOptions[Number($event.detail.value)]?.value ?? professionDraft
          "
        >
          <view class="picker-value">{{ USER_PROFESSION_LABELS[professionDraft] }}</view>
        </picker>
      </view>

      <view class="form-field">
        <text class="field-label">当前阵营</text>
        <picker
          :range="factionOptions.map((item) => item.label)"
          :value="factionOptions.findIndex((item) => item.value === factionDraft)"
          @change="
            factionDraft = factionOptions[Number($event.detail.value)]?.value ?? factionDraft
          "
        >
          <view class="picker-value">
            {{ factionOptions.find((item) => item.value === factionDraft)?.label }}
          </view>
        </picker>
      </view>

      <text v-if="!profile.recommendation.isCurrentFactionRecommended" class="hint-text">
        职业推荐阵营与当前阵营不同，你可以保留当前身份或手动切换。
      </text>

      <button class="primary-button" :disabled="isSaving" @tap="saveRoleProfile">
        {{ isSaving ? "保存中" : "保存角色资料" }}
      </button>
      <text v-if="feedbackMessage" class="feedback-text">{{ feedbackMessage }}</text>
    </view>

    <view v-else class="vs-panel vs-card-raised empty-state">
      <text class="section-title">{{ isLoading ? "正在同步角色资料" : "角色资料不可用" }}</text>
      <text v-if="feedbackMessage" class="feedback-text">{{ feedbackMessage }}</text>
      <button class="primary-button" @tap="syncProfile">重试</button>
    </view>
  </view>
</template>

<style>
.role-hero {
  position: relative;
  min-height: 280rpx;
  overflow: hidden;
  padding: 0 !important;
}

.role-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.role-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(5, 8, 18, 0.5), rgba(5, 8, 18, 0.8));
}

.role-hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 32rpx;
}

.role-avatar {
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  border: 3rpx solid rgba(154, 106, 22, 0.55);
}

.role-title-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 8rpx;
}

.role-name {
  overflow: hidden;
  color: #fff8f2;
  font-size: 36rpx;
  font-weight: 900;
  text-shadow:
    0 2rpx 0 rgba(0, 0, 0, 0.48),
    0 0 12rpx rgba(0, 0, 0, 0.42);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-meta {
  color: #f4d57e;
  font-size: 22rpx;
  font-weight: 800;
  text-shadow: 0 2rpx 7rpx rgba(0, 0, 0, 0.58);
}

.role-badge {
  width: 82rpx;
  height: 82rpx;
}

.role-mode-switch {
  position: absolute;
  left: 50%;
  bottom: 14rpx;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 440rpx;
  height: 76rpx;
  min-height: 76rpx;
  margin: 0;
  margin-left: -220rpx;
  padding: 6rpx;
  border: 2rpx solid rgba(244, 213, 126, 0.72);
  border-radius: 999rpx;
  background: rgba(8, 11, 24, 0.72);
  box-sizing: border-box;
  box-shadow:
    inset 0 2rpx 0 rgba(255, 255, 255, 0.12),
    0 5rpx 12rpx rgba(0, 0, 0, 0.28);
}

.role-mode-switch::after {
  border: 0;
}

.role-mode-switch-thumb {
  position: absolute;
  top: 6rpx;
  left: 6rpx;
  width: 210rpx;
  height: 60rpx;
  border-radius: 999rpx;
  background: #9a6a16;
  box-shadow:
    inset 0 -3rpx 0 rgba(0, 0, 0, 0.16),
    inset 0 2rpx 0 rgba(255, 255, 255, 0.26);
  transition: left 0.18s ease;
}

.role-mode-switch-hermit .role-mode-switch-thumb {
  left: 220rpx;
}

.role-mode-switch-option {
  position: relative;
  z-index: 1;
  display: flex;
  width: 214rpx;
  height: 60rpx;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.72);
  text-align: center;
}

.role-mode-switch-main {
  font-size: 22rpx;
  font-weight: 900;
  line-height: 1.05;
}

.role-mode-switch-sub {
  margin-top: 4rpx;
  font-size: 17rpx;
  font-weight: 800;
  line-height: 1;
}

.role-mode-switch-workplace .role-mode-switch-option-workplace,
.role-mode-switch-hermit .role-mode-switch-option-hermit {
  color: #111827;
}

.vs-mode-workplace .role-hero.vs-pixel-frame-primary {
  border-color: rgba(154, 106, 22, 0.72) !important;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0)), #1a1a2e !important;
  box-shadow:
    0 0 0 2rpx rgba(5, 5, 8, 0.95),
    0 0 0 5rpx rgba(154, 106, 22, 0.14),
    inset 0 0 0 2rpx rgba(255, 255, 255, 0.08),
    inset 0 -8rpx 0 rgba(0, 0, 0, 0.26),
    0 8rpx 0 rgba(0, 0, 0, 0.34),
    0 18rpx 28rpx rgba(0, 0, 0, 0.28) !important;
}

.role-form,
.empty-state {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.section-title {
  color: var(--camp-text-strong);
  font-size: 28rpx;
  font-weight: 900;
}

.recommend-text,
.feedback-text {
  color: #9a6a16;
  font-size: 20rpx;
  font-weight: 700;
}

.hint-text {
  color: #8b90b0;
  font-size: 20rpx;
  line-height: 1.45;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.field-label {
  color: #8b90b0;
  font-size: 20rpx;
  font-weight: 700;
}

.field-input,
.picker-value {
  min-height: 64rpx;
  box-sizing: border-box;
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: 8rpx;
  padding: 0 18rpx;
  background: rgba(9, 12, 24, 0.76);
  color: var(--camp-text-strong);
  font-size: 22rpx;
  line-height: 64rpx;
}

.primary-button {
  min-height: 72rpx;
  border: 2rpx solid var(--vs-button-border);
  border-radius: 4rpx;
  background: var(--vs-button-bg);
  color: var(--vs-button-text);
  font-family: var(--vs-font-display);
  font-size: 24rpx;
  font-weight: 900;
  box-shadow:
    inset 0 -4rpx 0 rgba(0, 0, 0, 0.18),
    inset 0 3rpx 0 rgba(255, 255, 255, 0.22),
    5rpx 5rpx 0 rgba(17, 24, 39, 0.72);
}

.primary-button::after {
  border: 0;
}

.primary-button:active {
  transform: translate(4rpx, 4rpx);
  box-shadow:
    inset 0 -2rpx 0 rgba(0, 0, 0, 0.16),
    1rpx 1rpx 0 rgba(17, 24, 39, 0.58);
}

.vs-mode-workplace .recommend-text,
.vs-mode-workplace .feedback-text {
  color: #9a6a16;
}

.vs-mode-workplace .hint-text,
.vs-mode-workplace .field-label {
  color: var(--camp-text-muted);
}

.vs-mode-workplace .field-input,
.vs-mode-workplace .picker-value {
  border-color: var(--camp-border);
  background: var(--camp-card);
  color: var(--camp-text-strong);
  box-shadow:
    inset 0 2rpx 5rpx rgba(17, 24, 39, 0.06),
    inset 0 -2rpx 0 rgba(17, 24, 39, 0.05);
}
</style>
