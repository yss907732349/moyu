<script setup lang="ts">
import { useVisualModePage } from "../../services/visual-mode";
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import {
  COMMUNITY_SECTION_LABELS,
  COMMUNITY_SECTION_KEYS,
  CommunityPrivacyConsentScene,
  CommunityPublishNextAction,
  CommunityPostStatus,
  CommunitySectionKey,
  CommunityLiteValidationError,
  canUserPostToCommunitySection,
  isCommunitySectionKey,
  validateCreateCommunityPostRequest,
  type CommunityPublishEligibilityResponse,
  type DailyContentQuoteSnapshot,
  type CommunitySectionKey as CommunitySectionKeyValue
} from "@moyuxia/shared";
import { getAppAuthToken } from "../../services/auth";
import { getLocalUserProfileSnapshot } from "../../services/user-growth-profile";
import {
  acceptCommunityPrivacyConsent,
  createCommunityPost,
  getCommunityPublishEligibility,
  verifyWechatPhoneNumber,
  uploadCommunityMediaAsset
} from "../../services/community-lite";

const { visualModeClass } = useVisualModePage();

type WechatPhoneNumberEvent = {
  detail?: {
    code?: string;
    errMsg?: string;
  };
};

const title = ref("");
const body = ref("");
const selectedImages = ref<string[]>([]);
const selectedSection = ref<CommunitySectionKeyValue>(CommunitySectionKey.BossRant);
const dailyContentQuote = ref<DailyContentQuoteSnapshot | null>(null);
const submitting = ref(false);
const feedbackMessage = ref("");
const publishEligibility = ref<CommunityPublishEligibilityResponse | null>(null);
const privacyPanelVisible = ref(false);
const privacyConsentChecked = ref(false);
const phonePanelVisible = ref(false);
const phoneVerifying = ref(false);
const pendingSubmitAfterGate = ref(false);
const COMMUNITY_PUBLISH_FEEDBACK_KEY = "moyuxia.communityPublishFeedback";
const DEV_PHONE_MOCK_CODE = "phone_dynamic_code_dev_mock";
const devPhoneMockVisible = import.meta.env?.DEV === true;

const profile = computed(() => getLocalUserProfileSnapshot());
const sectionOptions = computed(() =>
  COMMUNITY_SECTION_KEYS.filter((key) => {
    if (!profile.value) {
      return key === CommunitySectionKey.Recommended || key === CommunitySectionKey.BossRant;
    }

    return canUserPostToCommunitySection(profile.value.faction, key);
  }).map((key) => ({ key, label: COMMUNITY_SECTION_LABELS[key] }))
);
const quoteSourceLabel = computed(() =>
  dailyContentQuote.value?.sourceType === "daily_reflection"
    ? "引用今日参悟"
    : `引用隐者日报 · ${dailyContentQuote.value?.sectionLabel ?? ""}`
);
const quoteBodyText = computed(
  () => dailyContentQuote.value?.reflectionText ?? dailyContentQuote.value?.summary ?? ""
);

onLoad((query: { sectionKey?: string; dailyQuote?: string } = {}) => {
  if (query.sectionKey && isCommunitySectionKey(query.sectionKey)) {
    selectedSection.value = query.sectionKey;
  }

  if (query.dailyQuote) {
    try {
      const parsed = JSON.parse(decodeURIComponent(query.dailyQuote)) as DailyContentQuoteSnapshot;
      dailyContentQuote.value = parsed;
      title.value =
        parsed.sourceType === "daily_reflection"
          ? "聊聊今日参悟"
          : `聊聊：${parsed.title}`.slice(0, 60);
    } catch {
      feedbackMessage.value = "日报引用已失效，请重新进入日报。";
    }
  }

  if (!getAppAuthToken() || !profile.value) {
    dailyContentQuote.value = null;
    redirectToProfile();
  }
});

async function submitPost(): Promise<void> {
  if (!profile.value || submitting.value) {
    redirectToProfile();
    return;
  }

  if (!canUserPostToCommunitySection(profile.value.faction, selectedSection.value)) {
    feedbackMessage.value = "只能在自己的阵营专区发帖";
    return;
  }

  feedbackMessage.value = "";

  try {
    if (!(await ensurePublishReady())) {
      return;
    }

    submitting.value = true;
    const draft = {
      title: title.value,
      body: body.value,
      mediaAssetIds: await uploadSelectedImages(),
      imageKeys: parseImageKeys(),
      sectionKey: selectedSection.value,
      dailyContentQuote: dailyContentQuote.value ?? undefined
    };

    validateCreateCommunityPostRequest(draft);
    const response = await createCommunityPost(draft);
    uni.setStorageSync(COMMUNITY_PUBLISH_FEEDBACK_KEY, response.message);
    if (response.status === CommunityPostStatus.Rejected) {
      feedbackMessage.value = response.message;
      uni.showToast({ title: response.message, icon: "none" });
      return;
    }
    uni.redirectTo({
      url: `/pages/community/detail?postId=${encodeURIComponent(response.postId)}`
    });
    title.value = "";
    body.value = "";
    selectedImages.value = [];
  } catch (error) {
    feedbackMessage.value =
      error instanceof CommunityLiteValidationError
        ? error.issues.map((issue) => issue.message).join("；")
        : error instanceof Error
          ? error.message
          : "发帖失败，请稍后重试";
  } finally {
    submitting.value = false;
  }
}

async function ensurePublishReady(): Promise<boolean> {
  const eligibility = await getCommunityPublishEligibility();
  publishEligibility.value = eligibility;
  if (eligibility.canPublish) {
    return true;
  }

  pendingSubmitAfterGate.value = true;
  showPublishGate(eligibility);
  return false;
}

function showPublishGate(eligibility: CommunityPublishEligibilityResponse): void {
  feedbackMessage.value = eligibility.message;
  if (eligibility.nextAction === CommunityPublishNextAction.CreateProfile) {
    redirectToProfile();
    return;
  }
  if (eligibility.nextAction === CommunityPublishNextAction.AcceptPrivacy) {
    privacyPanelVisible.value = true;
    privacyConsentChecked.value = false;
    phonePanelVisible.value = false;
    return;
  }
  if (eligibility.nextAction === CommunityPublishNextAction.VerifyPhone) {
    privacyPanelVisible.value = false;
    phonePanelVisible.value = true;
    return;
  }
}

async function acceptPrivacyAndContinue(): Promise<void> {
  if (!privacyConsentChecked.value) {
    feedbackMessage.value = "请先主动勾选同意隐私政策和社区用户协议";
    return;
  }

  const response = await acceptCommunityPrivacyConsent({
    scene: CommunityPrivacyConsentScene.CommunityPublish
  });
  publishEligibility.value = response.eligibility;
  privacyPanelVisible.value = false;
  privacyConsentChecked.value = false;

  if (response.eligibility.canPublish) {
    await resumePendingSubmit();
    return;
  }
  showPublishGate(response.eligibility);
}

async function handleGetPhoneNumber(event: WechatPhoneNumberEvent): Promise<void> {
  const code = event.detail?.code;
  if (!code) {
    feedbackMessage.value = "未完成手机号验证，请重试";
    return;
  }

  await submitPhoneVerification(code);
}

async function handleDevPhoneMock(): Promise<void> {
  if (!devPhoneMockVisible || phoneVerifying.value) {
    return;
  }

  await submitPhoneVerification(DEV_PHONE_MOCK_CODE);
}

async function submitPhoneVerification(code: string): Promise<void> {
  phoneVerifying.value = true;
  try {
    feedbackMessage.value = "";
    const response = await verifyWechatPhoneNumber({ code });
    publishEligibility.value = response.eligibility;
    phonePanelVisible.value = false;
    if (response.eligibility.canPublish) {
      await resumePendingSubmit();
      return;
    }
    showPublishGate(response.eligibility);
  } catch (error) {
    feedbackMessage.value = error instanceof Error ? error.message : "手机号验证失败，请重试";
  } finally {
    phoneVerifying.value = false;
  }
}

async function resumePendingSubmit(): Promise<void> {
  if (!pendingSubmitAfterGate.value) {
    return;
  }

  pendingSubmitAfterGate.value = false;
  await submitPost();
}

function closePublishGate(): void {
  privacyPanelVisible.value = false;
  phonePanelVisible.value = false;
  privacyConsentChecked.value = false;
  pendingSubmitAfterGate.value = false;
}

function showPolicyEntry(type: "privacy" | "agreement" | "miniappPrivacy"): void {
  uni.navigateTo({ url: `/pages/community/policy?type=${type}` });
}

function parseImageKeys(): string[] {
  return [];
}

async function uploadSelectedImages(): Promise<string[]> {
  const assetIds: string[] = [];

  for (const image of selectedImages.value) {
    const response = await uploadCommunityMediaAsset(image, {
      fileName: image.split(/[\\/]/).pop(),
      mimeType: inferImageMimeType(image),
      fileSizeBytes: await getLocalImageSize(image)
    });
    assetIds.push(response.asset.id);
  }

  return assetIds;
}

function getLocalImageSize(filePath: string): Promise<number | undefined> {
  return new Promise((resolve) => {
    const fileSystem = uni.getFileSystemManager?.();
    if (!fileSystem) {
      resolve(undefined);
      return;
    }

    fileSystem.getFileInfo({
      filePath,
      success: (res) => resolve(res.size),
      fail: () => resolve(undefined)
    });
  });
}

function inferImageMimeType(filePath: string): string | undefined {
  const extension = filePath.split("?")[0]?.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif"
  };
  return extension ? mimeTypes[extension] : undefined;
}

function choosePostImages(): void {
  uni.chooseImage({
    count: Math.max(1, 9 - selectedImages.value.length),
    sizeType: ["compressed"],
    sourceType: ["album", "camera"],
    success: (res) => {
      selectedImages.value = [...selectedImages.value, ...res.tempFilePaths].slice(0, 9);
    }
  });
}

function removeImage(index: number): void {
  selectedImages.value = selectedImages.value.filter((_, current) => current !== index);
}

function redirectToProfile(): void {
  uni.switchTab({ url: "/pages/profile/index" });
}
</script>

<template>
  <view :class="['vs-page', 'vs-stack', visualModeClass]">
    <view class="vs-panel form-card">
      <text class="page-title">发布悬赏令</text>
      <text class="hint-text">低风险内容会自动公开，无法确认时仅自己可见。</text>

      <view v-if="dailyContentQuote" class="quote-card">
        <text class="quote-label">{{ quoteSourceLabel }}</text>
        <text v-if="dailyContentQuote.businessDate" class="quote-date">
          {{ dailyContentQuote.businessDate }}
        </text>
        <text class="quote-title">{{ dailyContentQuote.title }}</text>
        <text class="quote-summary">{{ quoteBodyText }}</text>
        <text v-if="dailyContentQuote.quotePrompt" class="quote-prompt">
          {{ dailyContentQuote.quotePrompt }}
        </text>
      </view>

      <view class="field-group">
        <text class="field-label">分区</text>
        <view class="section-grid">
          <view
            v-for="section in sectionOptions"
            :key="section.key"
            class="section-chip"
            :class="{ 'section-active': selectedSection === section.key }"
            @tap="selectedSection = section.key"
          >
            <text>{{ section.label }}</text>
          </view>
        </view>
      </view>

      <view class="field-group">
        <text class="field-label">标题</text>
        <input v-model="title" class="text-input" maxlength="60" placeholder="4-60 个字" />
      </view>

      <view class="field-group">
        <text class="field-label">正文</text>
        <textarea
          v-model="body"
          class="text-area"
          maxlength="2000"
          placeholder="写下你的职场生存技巧或吐槽"
        />
      </view>

      <view class="field-group">
        <text class="field-label">图片</text>
        <view class="image-grid">
          <view v-for="(image, index) in selectedImages" :key="image" class="image-preview">
            <image :src="image" mode="aspectFill" />
            <text class="remove-image" @tap="removeImage(index)">×</text>
          </view>
          <view v-if="selectedImages.length < 9" class="image-uploader" @tap="choosePostImages">
            <text class="upload-plus">＋</text>
            <text class="upload-text">上传图片</text>
          </view>
        </view>
      </view>

      <button class="primary-button" :disabled="submitting" @tap="submitPost">
        {{ submitting ? "发布中" : "发布" }}
      </button>
      <text v-if="feedbackMessage" class="feedback-text">{{ feedbackMessage }}</text>
    </view>

    <view v-if="privacyPanelVisible" class="gate-mask">
      <view class="gate-sheet">
        <view class="gate-head">
          <text class="gate-title">发布前确认</text>
          <button class="gate-close" @tap="closePublishGate">取消</button>
        </view>
        <text class="gate-desc">
          发帖前需要同意当前隐私政策和社区用户协议；同意后才会进入微信手机号验证。
        </text>
        <view class="gate-links">
          <button class="gate-link" @tap="showPolicyEntry('privacy')">隐私政策</button>
          <button class="gate-link" @tap="showPolicyEntry('agreement')">社区用户协议</button>
          <button class="gate-link" @tap="showPolicyEntry('miniappPrivacy')">
            小程序用户隐私保护指引
          </button>
        </view>
        <view class="gate-check-row" @tap="privacyConsentChecked = !privacyConsentChecked">
          <text class="gate-checkbox">{{ privacyConsentChecked ? "✓" : "" }}</text>
          <text class="gate-check-text">我已阅读并同意以上规则</text>
        </view>
        <button
          class="gate-primary"
          :class="{ 'gate-primary-active': privacyConsentChecked }"
          :disabled="!privacyConsentChecked"
          @tap="acceptPrivacyAndContinue"
        >
          同意并继续
        </button>
      </view>
    </view>

    <view v-if="phonePanelVisible" class="gate-mask">
      <view class="gate-sheet">
        <view class="gate-head">
          <text class="gate-title">完成手机号验证</text>
          <button class="gate-close" @tap="closePublishGate">取消</button>
        </view>
        <text class="gate-desc">
          手机号验证只作为发帖门槛和后台合规状态，不会展示在帖子、评论或个人主页。
        </text>
        <button
          class="gate-primary gate-primary-active"
          open-type="getPhoneNumber"
          :disabled="phoneVerifying"
          @getphonenumber="handleGetPhoneNumber"
        >
          {{ phoneVerifying ? "验证中" : "微信手机号验证" }}
        </button>
        <button
          v-if="devPhoneMockVisible"
          class="gate-secondary"
          :disabled="phoneVerifying"
          @tap="handleDevPhoneMock"
        >
          {{ phoneVerifying ? "验证中" : "开发模拟验证" }}
        </button>
      </view>
    </view>
  </view>
</template>

<style>
.vs-page {
  min-height: 100vh;
  background: var(--camp-page-background);
}

.form-card,
.field-group {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.page-title {
  color: var(--camp-text-strong);
  font-size: 34rpx;
  font-weight: 900;
  font-family: var(--vs-font-display);
}

.hint-text {
  color: var(--camp-text-soft);
  font-size: 20rpx;
  line-height: 1.5;
}

.feedback-text {
  color: var(--camp-gold);
  font-size: 22rpx;
  line-height: 1.5;
}

.field-label {
  color: var(--camp-text-soft);
  font-size: 20rpx;
  font-weight: 700;
  letter-spacing: 1rpx;
}

.quote-card {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  border: 1rpx solid rgba(0, 219, 233, 0.24);
  border-left: 4rpx solid rgba(0, 219, 233, 0.66);
  border-radius: 8rpx;
  padding: 14rpx;
  background: rgba(0, 219, 233, 0.055);
}

.quote-label {
  color: var(--camp-cyan);
  font-size: 20rpx;
  font-weight: 900;
}

.quote-title {
  display: block;
  max-width: 100%;
  color: var(--camp-primary);
  font-size: 24rpx;
  font-weight: 900;
  overflow-wrap: break-word;
  white-space: normal;
  word-break: break-all;
}

.quote-summary {
  display: block;
  max-width: 100%;
  color: var(--camp-text-soft);
  font-size: 21rpx;
  line-height: 1.5;
  overflow-wrap: break-word;
  white-space: normal;
  word-break: break-all;
}

.quote-date,
.quote-prompt {
  color: var(--camp-gold);
  font-size: 20rpx;
}

.section-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10rpx;
}

.section-chip {
  display: flex;
  min-height: 72rpx;
  align-items: center;
  justify-content: center;
  border: 1rpx solid var(--camp-border);
  border-radius: 10rpx;
  background: var(--camp-surface);
  color: var(--camp-text-soft);
  font-size: 24rpx;
  font-weight: 700;
}

.section-active {
  border-color: rgba(236, 178, 255, 0.54);
  background: rgba(189, 0, 255, 0.1);
  color: var(--camp-primary);
}

.text-input,
.text-area {
  width: 100%;
  box-sizing: border-box;
  border: 1rpx solid var(--camp-border);
  border-radius: 10rpx;
  background: var(--camp-surface);
  color: var(--camp-text);
  font-size: 26rpx;
  padding: 20rpx;
}

.text-input {
  min-height: 80rpx;
}

.text-area {
  min-height: 260rpx;
  line-height: 1.6;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
}

.image-preview,
.image-uploader {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border: 1rpx solid rgba(255, 255, 255, 0.07);
  border-radius: 10rpx;
  overflow: hidden;
  background: #181c32;
}

.image-preview image {
  width: 100%;
  height: 100%;
}

.remove-image {
  position: absolute;
  right: 6rpx;
  top: 6rpx;
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background: var(--camp-overlay);
  color: #fff8f2;
  font-size: 28rpx;
  line-height: 36rpx;
  text-align: center;
}

.image-uploader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
}

.upload-plus {
  color: #9a6a16;
  font-size: 44rpx;
  line-height: 1;
}

.upload-text {
  font-size: 20rpx;
  color: #6b7194;
}

.primary-button {
  min-height: 80rpx;
  border: 2rpx solid var(--vs-button-border);
  border-radius: 4rpx;
  background: var(--vs-button-bg);
  color: var(--vs-button-text);
  font-family: var(--vs-font-display);
  font-size: 28rpx;
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

.gate-mask {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: flex-end;
  background: var(--camp-overlay);
}

.gate-sheet {
  box-sizing: border-box;
  width: 100%;
  border-top: 1rpx solid rgba(236, 178, 255, 0.28);
  border-radius: 16rpx 16rpx 0 0;
  background: #151521;
  padding: 24rpx 24rpx calc(28rpx + env(safe-area-inset-bottom));
}

.gate-head,
.gate-check-row,
.gate-links {
  display: flex;
  align-items: center;
}

.gate-head {
  justify-content: space-between;
}

.gate-title {
  color: var(--camp-text-strong);
  font-size: 28rpx;
  font-weight: 900;
}

.gate-desc,
.gate-check-text {
  color: var(--camp-text-soft);
  font-size: 22rpx;
  line-height: 1.55;
}

.gate-desc {
  display: block;
  margin-top: 18rpx;
}

.gate-links {
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 18rpx;
}

.gate-link,
.gate-close {
  min-height: 54rpx;
  margin: 0;
  border: 1rpx solid rgba(255, 255, 255, 0.12);
  border-radius: 4rpx;
  background: #1b2034;
  color: var(--camp-primary);
  font-size: 21rpx;
}

.gate-close {
  color: var(--camp-text-soft);
}

.gate-link::after,
.gate-close::after,
.gate-primary::after,
.gate-secondary::after {
  border: 0;
}

.gate-check-row {
  gap: 12rpx;
  margin-top: 22rpx;
}

.gate-checkbox {
  width: 34rpx;
  height: 34rpx;
  border: 2rpx solid rgba(236, 178, 255, 0.5);
  border-radius: 4rpx;
  color: var(--camp-gold);
  font-size: 26rpx;
  line-height: 34rpx;
  text-align: center;
}

.gate-primary {
  width: 100%;
  min-height: 76rpx;
  margin-top: 22rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.12);
  border-radius: 4rpx;
  background: rgba(255, 255, 255, 0.08);
  color: var(--camp-text-soft);
  font-size: 24rpx;
  font-weight: 900;
}

.gate-primary-active {
  border-color: var(--vs-button-border);
  background: var(--vs-button-bg);
  color: var(--vs-button-text);
}

.gate-secondary {
  width: 100%;
  min-height: 70rpx;
  margin-top: 14rpx;
  border: 2rpx solid rgba(0, 219, 233, 0.42);
  border-radius: 4rpx;
  background: rgba(0, 219, 233, 0.08);
  color: var(--camp-cyan);
  font-size: 23rpx;
  font-weight: 900;
}

.vs-mode-workplace .section-active {
  border-color: rgba(154, 106, 22, 0.82);
  background: var(--camp-gold);
  color: #111827;
  box-shadow:
    inset 0 3rpx 0 rgba(255, 255, 255, 0.3),
    inset 0 -5rpx 0 rgba(0, 0, 0, 0.16),
    0 5rpx 0 rgba(17, 24, 39, 0.28);
}

.vs-mode-workplace .image-preview,
.vs-mode-workplace .image-uploader {
  border-color: var(--camp-border);
  background:
    linear-gradient(135deg, rgba(47, 111, 115, 0.08), rgba(154, 106, 22, 0.06)), var(--camp-surface);
  box-shadow:
    inset 0 0 0 1rpx rgba(255, 255, 255, 0.58),
    0 5rpx 12rpx rgba(17, 24, 39, 0.1);
}

.vs-mode-workplace .upload-plus {
  color: #9a6a16;
  text-shadow: none;
}

.vs-mode-workplace .upload-text {
  color: var(--camp-text-muted);
  font-weight: 800;
}

.vs-mode-workplace .gate-sheet {
  border-top: 2rpx solid rgba(154, 106, 22, 0.34);
  background: var(--camp-card);
  box-shadow: 0 -18rpx 36rpx rgba(17, 24, 39, 0.16);
}

.vs-mode-workplace .gate-title {
  color: var(--camp-text-strong);
}

.vs-mode-workplace .gate-desc,
.vs-mode-workplace .gate-check-text {
  color: var(--camp-text);
}

.vs-mode-workplace .gate-link,
.vs-mode-workplace .gate-close {
  border-color: var(--camp-border);
  background: var(--camp-surface);
  color: #236f73;
  box-shadow:
    inset 0 -2rpx 0 rgba(17, 24, 39, 0.08),
    2rpx 2rpx 0 rgba(17, 24, 39, 0.1);
}

.vs-mode-workplace .gate-close {
  color: var(--camp-text-muted);
}

.vs-mode-workplace .gate-checkbox {
  border-color: rgba(154, 106, 22, 0.58);
  background: #fffaf1;
  color: #9a6a16;
}

.vs-mode-workplace .gate-primary {
  border-color: var(--camp-border);
  background: var(--camp-surface-high);
  color: var(--camp-text-muted);
  box-shadow: none;
}

.vs-mode-workplace .gate-primary-active {
  border-color: var(--vs-button-border);
  background: var(--vs-button-bg);
  color: var(--vs-button-text);
  box-shadow:
    inset 0 -4rpx 0 rgba(0, 0, 0, 0.14),
    inset 0 3rpx 0 rgba(255, 255, 255, 0.28),
    4rpx 4rpx 0 rgba(17, 24, 39, 0.32);
}

.vs-mode-workplace .gate-secondary {
  border-color: rgba(47, 111, 115, 0.46);
  background: rgba(47, 111, 115, 0.08);
  color: #236f73;
}
</style>
