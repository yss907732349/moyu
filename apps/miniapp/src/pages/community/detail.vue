<script setup lang="ts">
import { useVisualModePage } from "../../services/visual-mode";
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import {
  COMMUNITY_REPORT_REASON_LABELS,
  CommunityCommentStatus,
  CommunityPrivacyConsentScene,
  CommunityPublishNextAction,
  CommunityPostStatus,
  CommunityReportReasonCode,
  formatDisplayTime,
  type CommunityComment,
  type CommunityCommentReply,
  type CommunityAuthorSnapshot,
  type CommunityPublishEligibilityResponse,
  type CommunityPostDetail,
  type CommunityReportReasonCode as CommunityReportReasonCodeValue
} from "@moyuxia/shared";
import { resolveProfileAvatarPathByKey } from "../../services/profile-assets";
import {
  acceptCommunityPrivacyConsent,
  createCommunityReply,
  createCommunityComment,
  getCommunityPost,
  getCommunityPublishEligibility,
  reportCommunityComment,
  reportCommunityPost,
  reportCommunityReply,
  resolveCommunityPublicAssetUrl,
  verifyWechatPhoneNumber,
  setCommunityPostFavorite,
  setCommunityPostLike
} from "../../services/community-lite";

const { visualModeClass } = useVisualModePage();

type CommunityMediaAssetView = CommunityPostDetail["mediaAssets"][number];
type ReportTargetType = "post" | "comment" | "reply";
type PendingPublishAction = "comment" | "reply";
type WechatPhoneNumberEvent = {
  detail?: {
    code?: string;
    errMsg?: string;
  };
};
type ReportTarget = {
  type: ReportTargetType;
  id: string;
  summary: string;
};

const reportReasonOptions: CommunityReportReasonCodeValue[] = [
  CommunityReportReasonCode.Illegal,
  CommunityReportReasonCode.Harassment,
  CommunityReportReasonCode.Privacy,
  CommunityReportReasonCode.Spam,
  CommunityReportReasonCode.Sexual,
  CommunityReportReasonCode.Misinformation,
  CommunityReportReasonCode.Other
];

const postId = ref("");
const post = ref<CommunityPostDetail | null>(null);
const comments = ref<CommunityComment[]>([]);
const commentBody = ref("");
const replyBodyByCommentId = ref<Record<string, string>>({});
const feedbackMessage = ref("");
const loading = ref(false);
const submitting = ref(false);
const reportSubmitting = ref(false);
const commentInputFocused = ref(false);
const reportSheetVisible = ref(false);
const reportTarget = ref<ReportTarget | null>(null);
const selectedReportReason = ref<CommunityReportReasonCodeValue>(CommunityReportReasonCode.Illegal);
const reportReasonText = ref("");
const reportedTargets = ref<Record<string, true>>({});
const publishEligibility = ref<CommunityPublishEligibilityResponse | null>(null);
const privacyPanelVisible = ref(false);
const privacyConsentChecked = ref(false);
const phonePanelVisible = ref(false);
const phoneVerifying = ref(false);
const gateScene = ref<CommunityPrivacyConsentScene>(CommunityPrivacyConsentScene.CommunityComment);
const pendingPublishAction = ref<PendingPublishAction | null>(null);
const pendingReplyCommentId = ref("");
const DEV_PHONE_MOCK_CODE = "phone_dynamic_code_dev_mock";
const devPhoneMockVisible = import.meta.env?.DEV === true;

const canSubmitComment = computed(() => commentBody.value.trim().length > 0 && !submitting.value);
const canSubmitReport = computed(
  () =>
    reportTarget.value !== null &&
    !reportSubmitting.value &&
    (selectedReportReason.value !== CommunityReportReasonCode.Other ||
      reportReasonText.value.trim().length >= 4)
);
const isPostPendingAuthorOnly = computed(
  () =>
    post.value?.status === CommunityPostStatus.Pending && post.value.visibleToAuthorOnly === true
);

onLoad((query: { postId?: string } = {}) => {
  postId.value = query.postId ?? "";
  if (!postId.value) {
    uni.navigateBack();
    return;
  }

  void refreshDetail();
});

async function refreshDetail(): Promise<void> {
  loading.value = true;
  feedbackMessage.value = "";

  try {
    const response = await getCommunityPost(postId.value);
    post.value = response.post;
    comments.value = response.comments;
  } catch (error) {
    feedbackMessage.value = error instanceof Error ? error.message : "帖子暂时不可用";
  } finally {
    loading.value = false;
  }
}

async function toggleLike(): Promise<void> {
  if (!post.value) {
    return;
  }

  const nextLiked = !post.value.viewerInteraction?.liked;
  const response = await setCommunityPostLike(post.value.id, nextLiked);
  post.value = {
    ...post.value,
    viewerInteraction: response.viewerInteraction,
    stats: response.stats
  };
}

async function toggleFavorite(): Promise<void> {
  if (!post.value) {
    return;
  }

  const nextFavorited = !post.value.viewerInteraction?.favorited;
  const response = await setCommunityPostFavorite(post.value.id, nextFavorited);
  post.value = {
    ...post.value,
    viewerInteraction: response.viewerInteraction,
    stats: response.stats
  };
}

async function submitComment(): Promise<void> {
  if (!post.value || submitting.value) {
    return;
  }

  const body = commentBody.value.trim();
  if (!body) {
    commentInputFocused.value = true;
    return;
  }

  submitting.value = true;
  feedbackMessage.value = "";

  try {
    if (!(await ensurePublishReady(CommunityPrivacyConsentScene.CommunityComment, "comment"))) {
      submitting.value = false;
      return;
    }

    const response = await createCommunityComment(post.value.id, body);
    feedbackMessage.value = communitySubmitFeedback("评论", response.status, response.message);
    uni.showToast({ title: feedbackMessage.value, icon: "none" });
    commentBody.value = "";
    await refreshDetail();
  } catch (error) {
    feedbackMessage.value = error instanceof Error ? error.message : "评论失败，请稍后重试";
  } finally {
    submitting.value = false;
  }
}

function focusCommentInput(): void {
  commentInputFocused.value = true;
}

function openPostReport(): void {
  if (!post.value) {
    return;
  }

  openReportSheet({
    type: "post",
    id: post.value.id,
    summary: `${post.value.title} ${post.value.body}`
  });
}

function openCommentReport(comment: CommunityComment): void {
  openReportSheet({ type: "comment", id: comment.id, summary: comment.body });
}

async function submitReply(commentId: string): Promise<void> {
  const body = replyBodyByCommentId.value[commentId] ?? "";
  if (!body.trim() || submitting.value) {
    return;
  }

  submitting.value = true;
  feedbackMessage.value = "";
  try {
    if (
      !(await ensurePublishReady(CommunityPrivacyConsentScene.CommunityReply, "reply", commentId))
    ) {
      submitting.value = false;
      return;
    }

    const response = await createCommunityReply(commentId, body);
    feedbackMessage.value = communitySubmitFeedback("回复", response.status, response.message);
    uni.showToast({ title: feedbackMessage.value, icon: "none" });
    replyBodyByCommentId.value = { ...replyBodyByCommentId.value, [commentId]: "" };
    await refreshDetail();
  } catch (error) {
    feedbackMessage.value = error instanceof Error ? error.message : "回复失败，请稍后重试";
  } finally {
    submitting.value = false;
  }
}

async function ensurePublishReady(
  scene: CommunityPrivacyConsentScene,
  pendingAction: PendingPublishAction,
  commentId = ""
): Promise<boolean> {
  const eligibility = await getCommunityPublishEligibility();
  publishEligibility.value = eligibility;
  if (eligibility.canPublish) {
    return true;
  }

  gateScene.value = scene;
  pendingPublishAction.value = pendingAction;
  pendingReplyCommentId.value = commentId;
  showPublishGate(eligibility);
  return false;
}

function showPublishGate(eligibility: CommunityPublishEligibilityResponse): void {
  feedbackMessage.value = eligibility.message;
  if (eligibility.nextAction === CommunityPublishNextAction.CreateProfile) {
    uni.switchTab({ url: "/pages/profile/index" });
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
  }
}

async function acceptPrivacyAndContinue(): Promise<void> {
  if (!privacyConsentChecked.value) {
    feedbackMessage.value = "请先主动勾选同意隐私政策和社区用户协议";
    return;
  }

  try {
    const response = await acceptCommunityPrivacyConsent({ scene: gateScene.value });
    publishEligibility.value = response.eligibility;
    privacyPanelVisible.value = false;
    privacyConsentChecked.value = false;
    if (response.eligibility.canPublish) {
      await resumePendingPublish();
      return;
    }
    showPublishGate(response.eligibility);
  } catch (error) {
    feedbackMessage.value = error instanceof Error ? error.message : "隐私同意失败，请重试";
  }
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
      await resumePendingPublish();
      return;
    }
    showPublishGate(response.eligibility);
  } catch (error) {
    feedbackMessage.value = error instanceof Error ? error.message : "手机号验证失败，请重试";
  } finally {
    phoneVerifying.value = false;
  }
}

async function resumePendingPublish(): Promise<void> {
  const pending = pendingPublishAction.value;
  const commentId = pendingReplyCommentId.value;
  pendingPublishAction.value = null;
  pendingReplyCommentId.value = "";
  if (pending === "comment") {
    await submitComment();
  } else if (pending === "reply" && commentId) {
    await submitReply(commentId);
  }
}

function closePublishGate(): void {
  privacyPanelVisible.value = false;
  phonePanelVisible.value = false;
  privacyConsentChecked.value = false;
  pendingPublishAction.value = null;
  pendingReplyCommentId.value = "";
}

function showPolicyEntry(type: "privacy" | "agreement" | "miniappPrivacy"): void {
  uni.navigateTo({ url: `/pages/community/policy?type=${type}` });
}

function openReplyReport(reply: CommunityCommentReply): void {
  openReportSheet({ type: "reply", id: reply.id, summary: reply.body });
}

function openReportSheet(target: ReportTarget): void {
  if (isReported(target.type, target.id)) {
    feedbackMessage.value = "你已经举报过该内容";
    return;
  }

  reportTarget.value = {
    ...target,
    summary: truncateReportSummary(target.summary)
  };
  selectedReportReason.value = CommunityReportReasonCode.Illegal;
  reportReasonText.value = "";
  reportSheetVisible.value = true;
}

function closeReportSheet(): void {
  if (reportSubmitting.value) {
    return;
  }

  reportSheetVisible.value = false;
  reportTarget.value = null;
  reportReasonText.value = "";
}

async function submitReport(): Promise<void> {
  if (!reportTarget.value || !canSubmitReport.value) {
    return;
  }

  reportSubmitting.value = true;
  feedbackMessage.value = "";

  try {
    const payload = {
      reasonCode: selectedReportReason.value,
      reasonText: reportReasonText.value.trim()
    };
    const target = reportTarget.value;
    const response =
      target.type === "post"
        ? await reportCommunityPost(target.id, payload)
        : target.type === "comment"
          ? await reportCommunityComment(target.id, payload)
          : await reportCommunityReply(target.id, payload);

    reportedTargets.value = {
      ...reportedTargets.value,
      [reportTargetKey(target.type, target.id)]: true
    };
    feedbackMessage.value = response.message;
    uni.showToast({ title: response.message, icon: "none" });
    reportSheetVisible.value = false;
    reportTarget.value = null;
    reportReasonText.value = "";
  } catch (error) {
    feedbackMessage.value = error instanceof Error ? error.message : "举报失败，请稍后重试";
  } finally {
    reportSubmitting.value = false;
  }
}

function previewPostImage(currentUrl: string): void {
  if (!post.value) {
    return;
  }

  const urls = post.value.mediaAssets.map(displayMediaUrl).filter(Boolean);
  if (urls.length === 0) {
    return;
  }

  uni.previewImage({
    current: currentUrl,
    urls
  });
}

function displayMediaUrl(asset: CommunityMediaAssetView): string {
  return resolveCommunityPublicAssetUrl(asset.url, asset.id);
}

function communitySubmitFeedback(noun: string, status: string, fallback: string): string {
  if (status === CommunityCommentStatus.Approved) {
    return `${noun}已公开`;
  }
  if (status === CommunityCommentStatus.Pending) {
    return `${noun}审核中，仅自己可见，通过后会公开`;
  }
  if (status === CommunityCommentStatus.Rejected) {
    return `${noun}未通过：${fallback}`;
  }
  return fallback;
}

function authorAvatarPath(author: CommunityAuthorSnapshot): string {
  return resolveProfileAvatarPathByKey(author.avatarKey, author.faction);
}

function canOpenAuthorProfile(author: CommunityAuthorSnapshot): boolean {
  return Boolean(author.publicProfileId);
}

function openAuthorProfile(author: CommunityAuthorSnapshot): void {
  const publicProfileId = author.publicProfileId;
  if (!publicProfileId) {
    uni.showToast({ title: "该隐者主页暂不可访问", icon: "none" });
    return;
  }

  uni.navigateTo({
    url: `/pages/community/profile?publicProfileId=${encodeURIComponent(publicProfileId)}`
  });
}

function reportTargetKey(type: ReportTargetType, id: string): string {
  return `${type}:${id}`;
}

function isReported(type: ReportTargetType, id: string): boolean {
  return reportedTargets.value[reportTargetKey(type, id)] === true;
}

function truncateReportSummary(value: string): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length > 90 ? `${normalized.slice(0, 90)}...` : normalized;
}
</script>

<template>
  <view :class="['vs-page', 'vs-stack', 'community-detail-page', visualModeClass]">
    <view v-if="post" class="vs-panel vs-card-raised post-card">
      <view class="author-row">
        <view
          class="author-avatar author-profile-entry"
          :class="{
            'author-profile-entry-active': canOpenAuthorProfile(post.author),
            'author-profile-entry-disabled': !canOpenAuthorProfile(post.author)
          }"
          @tap="openAuthorProfile(post.author)"
        >
          <image :src="authorAvatarPath(post.author)" mode="aspectFill" />
        </view>
        <view
          class="author-copy author-profile-entry"
          :class="{
            'author-profile-entry-active': canOpenAuthorProfile(post.author),
            'author-profile-entry-disabled': !canOpenAuthorProfile(post.author)
          }"
          @tap="openAuthorProfile(post.author)"
        >
          <text class="author-name">{{ post.author.displayName }}</text>
          <text class="author-meta">
            {{ post.author.factionLabel }} · {{ post.author.level }}阶隐者 ·
            {{ formatDisplayTime(post.createdAt) }}
          </text>
        </view>
        <button
          class="ghost-button"
          :class="{ 'ghost-button-disabled': isReported('post', post.id) }"
          :disabled="isReported('post', post.id)"
          @tap="openPostReport"
        >
          {{ isReported("post", post.id) ? "已举报" : "举报" }}
        </button>
      </view>

      <text class="post-title">{{ post.title }}</text>
      <view v-if="post.dailyContentQuote" class="daily-quote">
        <text class="daily-quote-label">
          {{
            post.dailyContentQuote.sourceType === "daily_reflection"
              ? "引用今日参悟"
              : `隐者日报 · ${post.dailyContentQuote.sectionLabel}`
          }}
        </text>
        <text v-if="post.dailyContentQuote.businessDate" class="daily-quote-date">
          {{ post.dailyContentQuote.businessDate }}
        </text>
        <text class="daily-quote-title">{{ post.dailyContentQuote.title }}</text>
        <text class="daily-quote-summary">
          {{ post.dailyContentQuote.reflectionText || post.dailyContentQuote.summary }}
        </text>
      </view>
      <text class="post-body">{{ post.body }}</text>
      <view v-if="isPostPendingAuthorOnly" class="review-state-banner">
        <text class="review-state-title">审核中，仅自己可见</text>
        <text class="review-state-desc">通过后其他隐者才能看到，也会开放评论。</text>
      </view>
      <view
        v-if="post.mediaAssets.length > 0"
        class="media-grid"
        :class="{
          'media-grid-single': post.mediaAssets.length === 1,
          'media-grid-multi': post.mediaAssets.length > 1
        }"
      >
        <view
          v-for="asset in post.mediaAssets"
          :key="asset.id"
          class="post-image-frame"
          @tap="previewPostImage(displayMediaUrl(asset))"
        >
          <image
            :src="displayMediaUrl(asset)"
            class="post-image"
            :mode="post.mediaAssets.length === 1 ? 'widthFix' : 'aspectFill'"
          />
        </view>
      </view>
      <view v-else-if="post.imageKeys.length > 0" class="legacy-image-note">
        <text>历史图片占位暂不可展示</text>
      </view>

      <view class="action-row">
        <view
          :class="['action-btn', post.viewerInteraction?.liked ? 'action-active' : '']"
          @tap="toggleLike"
        >
          <text class="action-icon">{{ post.viewerInteraction?.liked ? "♥" : "♡" }}</text>
          <text class="action-count">{{ post.stats.likeCount }}</text>
        </view>
        <view
          :class="['action-btn', post.viewerInteraction?.favorited ? 'action-active' : '']"
          @tap="toggleFavorite"
        >
          <text class="action-icon">{{ post.viewerInteraction?.favorited ? "★" : "☆" }}</text>
          <text class="action-count">{{ post.stats.favoriteCount }}</text>
        </view>
        <text v-if="post.ipLocationLabel" class="post-ip-location">
          IP属地：{{ post.ipLocationLabel }}
        </text>
      </view>
    </view>

    <view v-else class="vs-panel vs-card-raised empty-state">
      <text>{{ loading ? "读取中" : feedbackMessage }}</text>
    </view>

    <view class="vs-panel vs-card-raised comment-card">
      <text class="section-title">评论</text>
      <view v-if="isPostPendingAuthorOnly" class="empty-comments">
        <text>帖子审核中，暂不开放评论</text>
      </view>
      <view v-else-if="comments.length === 0" class="empty-comments">
        <text>暂无公开评论</text>
      </view>
      <view v-for="comment in comments" :key="comment.id" class="comment-item">
        <view class="comment-head">
          <view class="comment-author-row">
            <view
              class="comment-avatar author-profile-entry"
              :class="{
                'author-profile-entry-active': canOpenAuthorProfile(comment.author),
                'author-profile-entry-disabled': !canOpenAuthorProfile(comment.author)
              }"
              @tap="openAuthorProfile(comment.author)"
            >
              <image :src="authorAvatarPath(comment.author)" mode="aspectFill" />
            </view>
            <text
              class="comment-author author-profile-entry"
              :class="{
                'author-profile-entry-active': canOpenAuthorProfile(comment.author),
                'author-profile-entry-disabled': !canOpenAuthorProfile(comment.author)
              }"
              @tap="openAuthorProfile(comment.author)"
            >
              {{ comment.author.displayName }}
            </text>
            <text v-if="comment.ipLocationLabel" class="ip-location-text">
              IP属地：{{ comment.ipLocationLabel }}
            </text>
          </view>
          <text v-if="comment.visibleToAuthorOnly" class="self-visible-badge">仅自己可见</text>
          <text
            v-else
            class="report-link"
            :class="{ 'report-link-reported': isReported('comment', comment.id) }"
            @tap="openCommentReport(comment)"
          >
            {{ isReported("comment", comment.id) ? "已举报" : "举报" }}
          </text>
        </view>
        <text class="comment-body">{{ comment.body }}</text>
        <text v-if="comment.visibleToAuthorOnly" class="review-hint">审核通过后会公开展示</text>
        <view v-if="comment.replies.length > 0" class="reply-list">
          <view v-for="reply in comment.replies" :key="reply.id" class="reply-item">
            <view class="comment-head">
              <view class="comment-author-row">
                <view
                  class="comment-avatar comment-avatar-small author-profile-entry"
                  :class="{
                    'author-profile-entry-active': canOpenAuthorProfile(reply.author),
                    'author-profile-entry-disabled': !canOpenAuthorProfile(reply.author)
                  }"
                  @tap="openAuthorProfile(reply.author)"
                >
                  <image :src="authorAvatarPath(reply.author)" mode="aspectFill" />
                </view>
                <text
                  class="comment-author author-profile-entry"
                  :class="{
                    'author-profile-entry-active': canOpenAuthorProfile(reply.author),
                    'author-profile-entry-disabled': !canOpenAuthorProfile(reply.author)
                  }"
                  @tap="openAuthorProfile(reply.author)"
                >
                  {{ reply.author.displayName }}
                </text>
                <text v-if="reply.ipLocationLabel" class="ip-location-text">
                  IP属地：{{ reply.ipLocationLabel }}
                </text>
              </view>
              <text v-if="reply.visibleToAuthorOnly" class="self-visible-badge">仅自己可见</text>
              <text
                v-else
                class="report-link"
                :class="{ 'report-link-reported': isReported('reply', reply.id) }"
                @tap="openReplyReport(reply)"
              >
                {{ isReported("reply", reply.id) ? "已举报" : "举报" }}
              </text>
            </view>
            <text class="comment-body">{{ reply.body }}</text>
            <text v-if="reply.visibleToAuthorOnly" class="review-hint">审核通过后会公开展示</text>
          </view>
        </view>
        <view v-if="!comment.visibleToAuthorOnly" class="reply-box">
          <input
            v-model="replyBodyByCommentId[comment.id]"
            class="reply-input"
            placeholder="回复这条评论"
          />
          <button class="reply-button" :disabled="submitting" @tap="submitReply(comment.id)">
            <text class="reply-button-text">回复</text>
          </button>
        </view>
      </view>

      <text v-if="feedbackMessage" class="feedback-text">{{ feedbackMessage }}</text>
    </view>

    <view v-if="post && !isPostPendingAuthorOnly" class="comment-composer">
      <view class="composer-input-shell" @tap="focusCommentInput">
        <input
          v-model="commentBody"
          class="composer-input"
          placeholder="发表评论:"
          confirm-type="send"
          :focus="commentInputFocused"
          :adjust-position="true"
          :cursor-spacing="18"
          @focus="commentInputFocused = true"
          @blur="commentInputFocused = false"
          @confirm="submitComment"
        />
      </view>
      <button
        class="composer-send"
        :class="{ 'composer-send-active': canSubmitComment }"
        :disabled="!canSubmitComment"
        @tap="submitComment"
      >
        {{ submitting ? "发送中" : "发送" }}
      </button>
    </view>

    <view v-if="privacyPanelVisible" class="gate-mask">
      <view class="gate-sheet">
        <view class="gate-head">
          <text class="gate-title">发布前确认</text>
          <button class="gate-close" @tap="closePublishGate">取消</button>
        </view>
        <text class="gate-desc">
          评论或回复前需要同意当前隐私政策和社区用户协议；同意后才会进入微信手机号验证。
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
          手机号验证只作为评论和回复门槛，不会展示在公开内容或个人主页。
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

    <view v-if="reportSheetVisible && reportTarget" class="report-mask" @tap="closeReportSheet">
      <view class="report-sheet" @tap.stop>
        <view class="report-sheet-head">
          <text class="report-sheet-title">举报</text>
          <button class="report-close" @tap="closeReportSheet">取消</button>
        </view>
        <text class="report-target-summary">{{ reportTarget.summary }}</text>
        <view class="report-reason-grid">
          <button
            v-for="reason in reportReasonOptions"
            :key="reason"
            class="report-reason"
            :class="{ 'report-reason-active': selectedReportReason === reason }"
            @tap="selectedReportReason = reason"
          >
            {{ COMMUNITY_REPORT_REASON_LABELS[reason] }}
          </button>
        </view>
        <textarea
          v-model="reportReasonText"
          class="report-textarea"
          maxlength="300"
          placeholder="补充说明"
        />
        <button
          class="report-submit"
          :class="{ 'report-submit-active': canSubmitReport }"
          :disabled="!canSubmitReport"
          @tap="submitReport"
        >
          {{ reportSubmitting ? "提交中" : "提交举报" }}
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

.community-detail-page {
  padding-bottom: calc(148rpx + env(safe-area-inset-bottom));
}

.post-card,
.comment-card,
.author-copy,
.comment-item {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.post-card,
.comment-card {
  border: 1rpx solid var(--camp-border) !important;
  border-radius: 16rpx !important;
  background: var(--camp-card) !important;
  box-shadow:
    inset 1rpx 1rpx 0 rgba(255, 255, 255, 0.08),
    inset -1rpx -1rpx 0 rgba(0, 0, 0, 0.42),
    0 2rpx 12rpx rgba(0, 0, 0, 0.32) !important;
}

.author-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.author-avatar {
  width: 72rpx;
  height: 72rpx;
  flex-shrink: 0;
  border-radius: 50%;
  overflow: hidden;
  border: 1rpx solid rgba(236, 178, 255, 0.45);
  box-shadow: 0 0 10rpx rgba(189, 0, 255, 0.18);
}

.author-avatar image {
  width: 100%;
  height: 100%;
}

.author-copy {
  flex: 1;
  min-width: 0;
  gap: 4rpx;
}

.author-name {
  color: var(--camp-text);
  font-size: 26rpx;
  font-weight: 900;
}

.author-profile-entry {
  position: relative;
  cursor: default;
}

.author-profile-entry-active {
  cursor: pointer;
}

.author-profile-entry-active.author-avatar,
.author-profile-entry-active.comment-avatar {
  border-color: rgba(236, 178, 255, 0.72);
  box-shadow:
    0 0 0 3rpx rgba(236, 178, 255, 0.1),
    0 0 16rpx rgba(189, 0, 255, 0.24);
}

.author-profile-entry-active.author-copy {
  margin: -6rpx -8rpx;
  padding: 6rpx 8rpx;
  border-radius: 8rpx;
}

.author-profile-entry-active:active {
  opacity: 0.78;
  transform: translateY(2rpx);
}

.author-profile-entry-active.author-copy:active {
  background: rgba(236, 178, 255, 0.08);
}

.author-profile-entry-active .author-name,
.comment-author.author-profile-entry-active {
  color: var(--camp-primary);
  text-shadow: 0 0 10rpx rgba(189, 0, 255, 0.16);
}

.author-profile-entry-disabled {
  cursor: default;
  transform: none;
  opacity: 1;
}

.author-meta {
  color: var(--camp-text-soft);
  font-size: 20rpx;
  line-height: 1.45;
}

.post-title {
  display: block;
  max-width: 100%;
  color: var(--camp-text-strong);
  font-size: 34rpx;
  font-weight: 900;
  line-height: 1.35;
  overflow-wrap: break-word;
  white-space: normal;
  word-break: break-all;
  word-wrap: break-word;
}

.post-body {
  display: block;
  max-width: 100%;
  color: var(--camp-text);
  font-size: 26rpx;
  line-height: 1.7;
  overflow-wrap: break-word;
  white-space: normal;
  word-break: break-all;
  word-wrap: break-word;
}

.section-title {
  color: var(--camp-text-strong);
  font-size: 26rpx;
  font-weight: 900;
}

.empty-state,
.empty-comments {
  color: var(--camp-text-soft);
  font-size: 22rpx;
}

.feedback-text {
  color: var(--camp-gold);
  font-size: 22rpx;
}

.daily-quote {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  border: 1rpx solid rgba(0, 219, 233, 0.24);
  border-left: 4rpx solid rgba(0, 219, 233, 0.66);
  border-radius: 8rpx;
  padding: 14rpx;
  background: rgba(0, 219, 233, 0.055);
}

.daily-quote-label {
  color: var(--camp-cyan);
  font-size: 20rpx;
  font-weight: 900;
}

.daily-quote-date {
  color: var(--camp-gold);
  font-size: 20rpx;
}

.daily-quote-title {
  display: block;
  max-width: 100%;
  color: var(--camp-primary);
  font-size: 23rpx;
  font-weight: 900;
  overflow-wrap: break-word;
  white-space: normal;
  word-break: break-all;
  word-wrap: break-word;
}

.daily-quote-summary {
  display: block;
  max-width: 100%;
  color: var(--camp-text-soft);
  font-size: 21rpx;
  line-height: 1.5;
  overflow-wrap: break-word;
  white-space: normal;
  word-break: break-all;
  word-wrap: break-word;
}

.media-grid {
  display: grid;
  gap: 10rpx;
  max-width: 100%;
}
.media-grid-single {
  grid-template-columns: minmax(0, 340rpx);
}
.media-grid-multi {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.post-image-frame {
  position: relative;
  width: 100%;
  border-radius: 10rpx;
  overflow: hidden;
  background: #181c32;
}

.media-grid-single .post-image-frame {
  height: auto;
  overflow: visible;
  background: transparent;
}
.media-grid-multi .post-image-frame {
  aspect-ratio: 1;
}
.post-image {
  display: block;
  width: 100%;
  height: 100%;
}
.media-grid-single .post-image {
  height: auto;
  border-radius: 10rpx;
}

.legacy-image-note {
  border: 1rpx dashed rgba(255, 255, 255, 0.07);
  border-radius: 8rpx;
  padding: 14rpx;
  color: #6b7194;
  font-size: 20rpx;
}

.review-state-banner {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  border: 1rpx solid rgba(154, 106, 22, 0.28);
  border-radius: 8rpx;
  padding: 14rpx;
  background: rgba(154, 106, 22, 0.08);
}

.review-state-title {
  color: #9a6a16;
  font-size: 22rpx;
  font-weight: 900;
}

.review-state-desc {
  color: #8b90b0;
  font-size: 20rpx;
  line-height: 1.5;
}

/* 点赞/收藏 — 紧凑图标行 */
.action-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding-top: 4rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.07);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 10rpx 20rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 4rpx;
  background: #181c32;
  box-shadow:
    inset 0 -3rpx 0 rgba(0, 0, 0, 0.18),
    3rpx 3rpx 0 rgba(0, 0, 0, 0.28);
}

.action-btn.action-active {
  border-color: rgba(154, 106, 22, 0.62);
  background: rgba(154, 106, 22, 0.1);
  box-shadow:
    inset 0 -3rpx 0 rgba(0, 0, 0, 0.18),
    3rpx 3rpx 0 rgba(17, 24, 39, 0.58);
}

.action-btn:active {
  transform: translate(3rpx, 3rpx);
  box-shadow:
    inset 0 -2rpx 0 rgba(0, 0, 0, 0.16),
    1rpx 1rpx 0 rgba(0, 0, 0, 0.26);
}

.action-icon {
  font-size: 28rpx;
  color: #8b90b0;
  line-height: 1;
}

.action-btn.action-active .action-icon {
  color: #9a6a16;
}

.action-count {
  font-size: 24rpx;
  font-weight: 700;
  color: #8b90b0;
}

.action-btn.action-active .action-count {
  color: #9a6a16;
}

.post-ip-location {
  display: block;
  max-width: 260rpx;
  margin-left: auto;
  overflow: hidden;
  color: var(--camp-text-soft);
  font-size: 20rpx;
  line-height: 1.4;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ghost-button {
  min-width: 88rpx;
  min-height: 52rpx;
  border-radius: 4rpx;
  background: transparent;
  border: 2rpx solid rgba(255, 255, 255, 0.1);
  color: #6b7194;
  font-family: var(--vs-font-display);
  font-size: 20rpx;
  box-shadow:
    inset 0 -3rpx 0 rgba(0, 0, 0, 0.16),
    3rpx 3rpx 0 rgba(0, 0, 0, 0.24);
}

.ghost-button::after {
  border: 0;
}

.ghost-button:active {
  transform: translate(3rpx, 3rpx);
  box-shadow:
    inset 0 -2rpx 0 rgba(0, 0, 0, 0.14),
    1rpx 1rpx 0 rgba(0, 0, 0, 0.24);
}

/* 评论区 */
.comment-item {
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.07);
  padding-bottom: 16rpx;
}

.comment-head,
.comment-author-row {
  display: flex;
  align-items: center;
}

.comment-head {
  justify-content: space-between;
  gap: 12rpx;
}
.comment-author-row {
  min-width: 0;
  gap: 10rpx;
}

.comment-avatar {
  width: 44rpx;
  height: 44rpx;
  flex-shrink: 0;
  overflow: hidden;
  border: 1rpx solid rgba(236, 178, 255, 0.45);
  border-radius: 50%;
  box-shadow: 0 0 8rpx rgba(189, 0, 255, 0.16);
}

.comment-avatar-small {
  width: 36rpx;
  height: 36rpx;
}
.comment-avatar image {
  width: 100%;
  height: 100%;
}

.comment-author {
  overflow: hidden;
  color: var(--camp-text);
  font-size: 22rpx;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ip-location-text {
  flex-shrink: 0;
  color: var(--camp-text-soft);
  font-size: 19rpx;
  line-height: 1.2;
  white-space: nowrap;
}

.comment-body {
  display: block;
  max-width: 100%;
  color: var(--camp-text);
  font-size: 24rpx;
  line-height: 1.6;
  overflow-wrap: break-word;
  white-space: normal;
  word-break: break-all;
  word-wrap: break-word;
}

.reply-list {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  border-left: 3rpx solid rgba(154, 106, 22, 0.2);
  padding-left: 16rpx;
  margin-top: 4rpx;
}

.reply-item {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.reply-box {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 128rpx;
  align-items: center;
  gap: 12rpx;
  margin-top: 4rpx;
}

.reply-input {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 60rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.07);
  border-radius: 8rpx;
  background: #181c32;
  color: var(--camp-text-strong);
  font-size: 22rpx;
  padding: 0 14rpx;
}

.reply-button {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 128rpx;
  min-width: 128rpx;
  min-height: 60rpx;
  padding: 0 16rpx;
  border-radius: 4rpx;
  background: var(--vs-button-bg);
  border: 2rpx solid var(--vs-button-border);
  color: var(--vs-button-text);
  font-family: var(--vs-font-display);
  font-size: 22rpx;
  font-weight: 900;
  box-shadow:
    inset 0 -3rpx 0 rgba(0, 0, 0, 0.18),
    3rpx 3rpx 0 rgba(0, 0, 0, 0.32);
}

.reply-button-text {
  display: block;
  line-height: 1;
  white-space: nowrap;
}

.reply-button::after {
  border: 0;
}

.reply-button:active {
  transform: translate(3rpx, 3rpx);
  box-shadow:
    inset 0 -2rpx 0 rgba(0, 0, 0, 0.16),
    1rpx 1rpx 0 rgba(0, 0, 0, 0.26);
}

.report-link {
  color: #6b7194;
  font-size: 20rpx;
}
.report-link-reported,
.ghost-button-disabled {
  color: var(--camp-text-soft);
  opacity: 0.58;
}
.self-visible-badge {
  color: #2196f3;
  font-size: 20rpx;
  font-weight: 900;
}
.review-hint {
  color: #6b7194;
  font-size: 20rpx;
}

.report-mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 40;
  display: flex;
  align-items: flex-end;
  background: var(--camp-overlay);
}

.report-sheet {
  box-sizing: border-box;
  width: 100%;
  border-top: 1rpx solid rgba(236, 178, 255, 0.24);
  border-radius: 16rpx 16rpx 0 0;
  background: #151521;
  padding: 24rpx 24rpx calc(28rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -16rpx 36rpx rgba(0, 0, 0, 0.46);
}

.report-sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.report-sheet-title {
  color: var(--camp-text-strong);
  font-size: 28rpx;
  font-weight: 900;
}

.report-close {
  min-width: 92rpx;
  min-height: 52rpx;
  margin: 0;
  border: 1rpx solid rgba(255, 255, 255, 0.12);
  border-radius: 4rpx;
  background: transparent;
  color: var(--camp-text-soft);
  font-size: 22rpx;
}

.report-close::after {
  border: 0;
}

.report-target-summary {
  display: block;
  max-width: 100%;
  margin-top: 16rpx;
  color: var(--camp-text-soft);
  font-size: 22rpx;
  line-height: 1.5;
  overflow-wrap: break-word;
  white-space: normal;
  word-break: break-all;
}

.report-reason-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
  margin-top: 18rpx;
}

.report-reason {
  box-sizing: border-box;
  min-height: 64rpx;
  margin: 0;
  border: 2rpx solid rgba(255, 255, 255, 0.12);
  border-radius: 4rpx;
  background: #1b2034;
  color: var(--camp-text);
  font-size: 22rpx;
}

.report-reason::after {
  border: 0;
}

.report-reason-active {
  border-color: rgba(255, 180, 171, 0.68);
  background: rgba(255, 180, 171, 0.12);
  color: var(--camp-danger);
}

.report-textarea {
  box-sizing: border-box;
  width: 100%;
  min-height: 144rpx;
  margin-top: 18rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 8rpx;
  background: #101523;
  color: var(--camp-text);
  font-size: 24rpx;
  line-height: 1.5;
  padding: 18rpx;
}

.report-submit {
  width: 100%;
  min-height: 72rpx;
  margin-top: 18rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.12);
  border-radius: 4rpx;
  background: rgba(255, 255, 255, 0.08);
  color: var(--camp-text-soft);
  font-size: 24rpx;
  font-weight: 900;
}

.report-submit::after {
  border: 0;
}

.report-submit-active {
  border-color: rgba(255, 180, 171, 0.72);
  background: rgba(255, 180, 171, 0.18);
  color: var(--camp-danger);
}

.comment-composer {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 14rpx;
  box-sizing: border-box;
  padding: 18rpx 24rpx calc(18rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid rgba(255, 255, 255, 0.08);
  background: rgba(8, 11, 24, 0.96);
  box-shadow: 0 -12rpx 28rpx rgba(0, 0, 0, 0.3);
}

.gate-mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 45;
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

.composer-input-shell {
  display: flex;
  min-width: 0;
  height: 72rpx;
  flex: 1;
  align-items: center;
  border: 1rpx solid rgba(255, 255, 255, 0.07);
  border-radius: 12rpx;
  background: #181c32;
  padding: 0 22rpx;
  box-sizing: border-box;
}

.composer-input {
  width: 100%;
  height: 70rpx;
  color: var(--camp-text-strong);
  font-size: 26rpx;
  line-height: 70rpx;
}

.composer-send {
  display: flex;
  width: 132rpx;
  height: 72rpx;
  min-width: 132rpx;
  min-height: 72rpx;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  border: 2rpx solid rgba(255, 255, 255, 0.12);
  border-radius: 4rpx;
  background: rgba(255, 255, 255, 0.08);
  color: #6b7194;
  font-family: var(--vs-font-display);
  font-size: 24rpx;
  font-weight: 900;
  line-height: 72rpx;
  box-shadow:
    inset 0 -3rpx 0 rgba(0, 0, 0, 0.16),
    3rpx 3rpx 0 rgba(0, 0, 0, 0.28);
}

.composer-send::after {
  border: 0;
}

.composer-send-active {
  border-color: var(--vs-button-border);
  background: var(--vs-button-bg);
  color: var(--vs-button-text);
  box-shadow:
    inset 0 -4rpx 0 rgba(0, 0, 0, 0.18),
    inset 0 3rpx 0 rgba(255, 255, 255, 0.22),
    5rpx 5rpx 0 rgba(17, 24, 39, 0.72);
}

.composer-send:active {
  transform: translate(4rpx, 4rpx);
  box-shadow:
    inset 0 -2rpx 0 rgba(0, 0, 0, 0.16),
    1rpx 1rpx 0 rgba(17, 24, 39, 0.58);
}

.vs-mode-workplace .post-card,
.vs-mode-workplace .comment-card {
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.7),
    0 6rpx 16rpx rgba(17, 24, 39, 0.12) !important;
}

.vs-mode-workplace .post-image-frame {
  background: var(--camp-surface);
}

.vs-mode-workplace .legacy-image-note {
  border-color: var(--camp-border);
  color: var(--camp-text-muted);
}

.vs-mode-workplace .review-state-desc,
.vs-mode-workplace .review-hint,
.vs-mode-workplace .report-link {
  color: var(--camp-text-muted);
}

.vs-mode-workplace .action-row {
  border-top-color: var(--camp-border);
}

.vs-mode-workplace .action-btn {
  border-color: var(--camp-border);
  background: var(--camp-surface);
  box-shadow:
    inset 0 -3rpx 0 rgba(17, 24, 39, 0.08),
    3rpx 3rpx 0 rgba(17, 24, 39, 0.1);
}

.vs-mode-workplace .action-btn.action-active {
  border-color: rgba(154, 106, 22, 0.62);
  background: rgba(154, 106, 22, 0.13);
  box-shadow:
    inset 0 -3rpx 0 rgba(17, 24, 39, 0.08),
    3rpx 3rpx 0 rgba(17, 24, 39, 0.18);
}

.vs-mode-workplace .action-icon,
.vs-mode-workplace .action-count {
  color: var(--camp-text-muted);
}

.vs-mode-workplace .action-btn.action-active .action-icon,
.vs-mode-workplace .action-btn.action-active .action-count {
  color: #9a6a16;
}

.vs-mode-workplace .reply-input {
  border-color: var(--camp-border);
  background: var(--camp-card);
  color: var(--camp-text-strong);
  box-shadow: inset 0 2rpx 5rpx rgba(17, 24, 39, 0.06);
}

.vs-mode-workplace .reply-button {
  border-color: var(--vs-button-border);
  background: var(--vs-button-bg);
  color: var(--vs-button-text);
  box-shadow:
    inset 0 -3rpx 0 rgba(17, 24, 39, 0.08),
    3rpx 3rpx 0 rgba(17, 24, 39, 0.1);
}

.vs-mode-workplace .ghost-button,
.vs-mode-workplace .report-close {
  border-color: var(--camp-border);
  background: var(--camp-surface);
  color: var(--camp-text-muted);
  box-shadow:
    inset 0 -2rpx 0 rgba(17, 24, 39, 0.08),
    2rpx 2rpx 0 rgba(17, 24, 39, 0.1);
}

.vs-mode-workplace .comment-composer {
  border-top-color: var(--camp-border);
  background: rgba(255, 253, 248, 0.96);
  box-shadow: 0 -12rpx 28rpx rgba(17, 24, 39, 0.14);
}

.vs-mode-workplace .composer-input-shell {
  border-color: var(--camp-border);
  background: var(--camp-card);
  box-shadow: inset 0 2rpx 5rpx rgba(17, 24, 39, 0.06);
}

.vs-mode-workplace .composer-input {
  color: var(--camp-text-strong);
}

.vs-mode-workplace .composer-send {
  border-color: var(--camp-border);
  background: var(--camp-surface-high);
  color: var(--camp-text-muted);
  box-shadow: none;
}

.vs-mode-workplace .composer-send-active {
  border-color: var(--vs-button-border);
  background: var(--vs-button-bg);
  color: var(--vs-button-text);
  box-shadow:
    inset 0 -4rpx 0 rgba(0, 0, 0, 0.14),
    inset 0 3rpx 0 rgba(255, 255, 255, 0.28),
    4rpx 4rpx 0 rgba(17, 24, 39, 0.32);
}

.vs-mode-workplace .gate-sheet,
.vs-mode-workplace .report-sheet {
  border-top: 2rpx solid rgba(154, 106, 22, 0.34);
  background: var(--camp-card);
  box-shadow: 0 -18rpx 36rpx rgba(17, 24, 39, 0.16);
}

.vs-mode-workplace .gate-title,
.vs-mode-workplace .report-sheet-title {
  color: var(--camp-text-strong);
}

.vs-mode-workplace .gate-desc,
.vs-mode-workplace .gate-check-text,
.vs-mode-workplace .report-target-summary {
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

.vs-mode-workplace .gate-primary,
.vs-mode-workplace .report-submit {
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

.vs-mode-workplace .report-reason {
  border-color: var(--camp-border);
  background: var(--camp-surface);
  color: var(--camp-text);
}

.vs-mode-workplace .report-reason-active {
  border-color: rgba(178, 63, 51, 0.46);
  background: rgba(178, 63, 51, 0.1);
  color: #9f2f25;
}

.vs-mode-workplace .report-textarea {
  border-color: var(--camp-border);
  background: var(--camp-card);
  color: var(--camp-text);
  box-shadow: inset 0 2rpx 5rpx rgba(17, 24, 39, 0.06);
}

.vs-mode-workplace .report-submit-active {
  border-color: rgba(178, 63, 51, 0.52);
  background: rgba(178, 63, 51, 0.13);
  color: #9f2f25;
}
</style>
