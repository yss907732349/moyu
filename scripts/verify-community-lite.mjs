/* global process */
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const shared = require("../packages/shared/dist/index.js");

const {
  COMMUNITY_FACTION_SECTION_KEYS,
  COMMUNITY_SECTION_KEYS,
  AiModerationDecision,
  AiModerationManualReviewReason,
  AiModerationRiskTag,
  AiModerationSource,
  CommunityCommentStatus,
  CommunityIpLocationResolveStatus,
  CommunityLiteValidationError,
  CommunityLiteErrorCode,
  CommunityMediaAssetStatus,
  CommunityNotificationType,
  CommunityPhoneVerificationStatus,
  CommunityPostSort,
  CommunityPostStatus,
  CommunityPrivacyConsentScene,
  CommunityPublishNextAction,
  CommunityPublishRequirement,
  CommunityReportHandleAction,
  CommunityReportPriority,
  CommunityReportReasonCode,
  CommunityReportStatus,
  CommunityReportTargetType,
  CommunitySectionKey,
  DAILY_CONTENT_SECTION_LABELS,
  DailyContentSectionKey,
  UserFaction,
  assertPublicCommunityAuthorSnapshot,
  canUserPostToCommunitySection,
  createDailyContentReflectionQuoteSnapshot,
  createCommunityAuthorSnapshot,
  isCommunitySectionKey,
  validateCreateCommunityCommentRequest,
  validateCreateCommunityPostRequest,
  validateCreateCommunityReplyRequest,
  validateCreateCommunityReportRequest,
  validateListCommunityPostsRequest
} = shared;

assert.deepEqual(COMMUNITY_SECTION_KEYS, [
  CommunitySectionKey.Recommended,
  UserFaction.KeyShadow,
  UserFaction.WaterEscape,
  UserFaction.SkyStrategy,
  UserFaction.Wanderer,
  CommunitySectionKey.BossRant
]);
assert.deepEqual(COMMUNITY_FACTION_SECTION_KEYS, [
  UserFaction.KeyShadow,
  UserFaction.WaterEscape,
  UserFaction.SkyStrategy,
  UserFaction.Wanderer
]);
assert.equal(isCommunitySectionKey("recommended"), true);
assert.equal(isCommunitySectionKey("salary_work_time_settings"), false);
assert.equal(CommunityPostStatus.Pending, "pending");
assert.equal(CommunityPostStatus.Approved, "approved");
assert.equal(CommunityPostStatus.Rejected, "rejected");
assert.equal(CommunityPostStatus.Hidden, "hidden");
assert.equal(CommunityCommentStatus.Pending, "pending");
assert.equal(CommunityLiteErrorCode.PrivacyConsentRequired, "community_privacy_consent_required");
assert.equal(
  CommunityLiteErrorCode.PhoneVerificationRequired,
  "community_phone_verification_required"
);
assert.equal(CommunityLiteErrorCode.PhoneVerificationFailed, "community_phone_verification_failed");
assert.equal(CommunityPhoneVerificationStatus.Unverified, "unverified");
assert.equal(CommunityPhoneVerificationStatus.Verified, "verified");
assert.equal(CommunityPublishRequirement.PrivacyConsent, "privacy_consent");
assert.equal(CommunityPublishRequirement.PhoneVerification, "phone_verification");
assert.equal(CommunityPublishNextAction.AcceptPrivacy, "accept_privacy");
assert.equal(CommunityPublishNextAction.VerifyPhone, "verify_phone");
assert.equal(CommunityPrivacyConsentScene.CommunityPublish, "community_publish");
assert.equal(CommunityPrivacyConsentScene.CommunityComment, "community_comment");
assert.equal(CommunityPrivacyConsentScene.CommunityReply, "community_reply");
assert.equal(CommunityIpLocationResolveStatus.Resolved, "resolved");
assert.equal(CommunityIpLocationResolveStatus.Unknown, "unknown");
assert.equal(AiModerationDecision.NeedsManualReview, "needs_manual_review");
assert.equal(AiModerationSource.Ai, "ai");
assert.equal(AiModerationRiskTag.Advertisement, "advertisement");
assert.equal(AiModerationManualReviewReason.ProviderError, "provider_error");
assert.equal(CommunityReportTargetType.Post, "post");
assert.equal(CommunityReportTargetType.Reply, "reply");
assert.equal(CommunityMediaAssetStatus.Uploaded, "uploaded");
assert.equal(CommunityNotificationType.ReplyReviewRejected, "reply_review_rejected");
assert.equal(CommunityReportStatus.FalseReport, "false_report");
assert.equal(CommunityReportStatus.Removed, "removed");
assert.equal(CommunityReportHandleAction.Hide, "hide");
assert.equal(CommunityReportHandleAction.Remove, "remove");
assert.equal(CommunityReportReasonCode.Privacy, "privacy");
assert.equal(CommunityReportPriority.High, "high");
assert.equal(CommunityPostSort.Latest, "latest");

assert.equal(
  canUserPostToCommunitySection(UserFaction.KeyShadow, CommunitySectionKey.KeyShadow),
  true
);
assert.equal(
  canUserPostToCommunitySection(UserFaction.KeyShadow, CommunitySectionKey.WaterEscape),
  false
);
assert.equal(
  canUserPostToCommunitySection(UserFaction.KeyShadow, CommunitySectionKey.BossRant),
  true
);

validateListCommunityPostsRequest({
  sectionKey: CommunitySectionKey.Recommended,
  sort: CommunityPostSort.Latest,
  limit: 20
});
validateCreateCommunityPostRequest({
  title: "今天如何优雅摸鱼",
  body: "分享一个暗黑忍者式上班生存技巧，先把水杯放在最远处。",
  mediaAssetIds: ["community-media-asset-01"],
  imageKeys: ["post_image_01"],
  sectionKey: CommunitySectionKey.BossRant,
  dailyContentQuote: {
    sourceType: "daily_reflection",
    issueId: "daily-1",
    itemId: "item-1",
    sectionKey: DailyContentSectionKey.DailyReflection,
    sectionLabel: DAILY_CONTENT_SECTION_LABELS.daily_reflection,
    title: "今日参悟标题",
    summary: "日报引用摘要",
    businessDate: "2026-05-26",
    reflectionText: "日报引用摘要",
    quotePrompt: "我从今日参悟想到："
  }
});
const reflectionQuote = createDailyContentReflectionQuoteSnapshot({
  issueId: "daily-1",
  businessDate: "2026-05-26",
  reflection: {
    id: "item-1",
    text: "日报引用摘要",
    quotePrompt: "我从今日参悟想到："
  }
});
assert.equal(reflectionQuote.sourceType, "daily_reflection");
assert.equal(reflectionQuote.sectionKey, DailyContentSectionKey.DailyReflection);
assert.equal(reflectionQuote.reflectionText, "日报引用摘要");
assert.throws(
  () =>
    validateCreateCommunityPostRequest({
      title: "今天如何优雅摸鱼",
      body: "分享一个暗黑忍者式上班生存技巧，先把水杯放在最远处。",
      imageKeys: [],
      sectionKey: CommunitySectionKey.BossRant,
      dailyContentQuote: {
        sourceType: "daily_reflection",
        issueId: "daily-1",
        itemId: "item-1",
        sectionKey: DailyContentSectionKey.DailyReflection,
        sectionLabel: DAILY_CONTENT_SECTION_LABELS.daily_reflection,
        title: "今日参悟标题",
        summary: "日报引用摘要"
      }
    }),
  CommunityLiteValidationError
);
const articleQuotePost = validateCreateCommunityPostRequest({
  title: "引用大陆新闻聊一聊",
  body: "这篇日报文章让我想到一个办公室信息差。",
  imageKeys: [],
  sectionKey: CommunitySectionKey.BossRant,
  dailyContentQuote: {
    sourceType: "daily_article",
    issueId: "daily-1",
    itemId: "article-1",
    articleId: "article-1",
    sectionKey: "world_intel",
    sectionLabel: DAILY_CONTENT_SECTION_LABELS.world_intel,
    title: "大陆新闻标题",
    summary: "日报文章引用摘要"
  }
});
assert.equal(articleQuotePost.dailyContentQuote.sourceType, "daily_article");
validateCreateCommunityCommentRequest({ body: "学到了，先收藏。" });
validateCreateCommunityReplyRequest({ body: "同意，这条评论很有用。" });
const legacyReport = validateCreateCommunityReportRequest({
  targetType: CommunityReportTargetType.Post,
  targetId: "post-1",
  reason: "内容疑似泄露隐私"
});
assert.equal(legacyReport.reasonCode, CommunityReportReasonCode.Other);
assert.equal(legacyReport.reasonText, "内容疑似泄露隐私");
const structuredReport = validateCreateCommunityReportRequest({
  targetType: CommunityReportTargetType.Reply,
  targetId: "reply-1",
  reasonCode: CommunityReportReasonCode.Harassment,
  reasonText: "回复疑似辱骂"
});
assert.equal(structuredReport.reasonCode, CommunityReportReasonCode.Harassment);
assert.equal(structuredReport.reason, "回复疑似辱骂");
assert.throws(
  () =>
    validateCreateCommunityReportRequest({
      targetType: CommunityReportTargetType.Comment,
      targetId: "comment-1",
      reasonCode: CommunityReportReasonCode.Other
    }),
  CommunityLiteValidationError
);

assert.throws(
  () =>
    validateCreateCommunityPostRequest({
      title: "短",
      body: "也短",
      imageKeys: ["bad key"],
      sectionKey: "bad"
    }),
  CommunityLiteValidationError
);

const author = createCommunityAuthorSnapshot({
  displayName: "键影隐者1001",
  avatarKey: "avatar_key_shadow_default",
  faction: UserFaction.KeyShadow,
  level: 1,
  titleKey: "newcomer_hidden_one",
  equippedBadgeKeys: ["first_profile"]
});
assert.equal(author.factionLabel, "键影隐者");
assert.equal(author.equippedBadgeKey, "first_profile");
assertPublicCommunityAuthorSnapshot(author);
assert.throws(
  () => assertPublicCommunityAuthorSnapshot({ ...author, monthlyAmount: 30000 }),
  CommunityLiteValidationError
);
assert.throws(
  () => assertPublicCommunityAuthorSnapshot({ ...author, openid: "wx-openid" }),
  CommunityLiteValidationError
);
for (const forbidden of [
  "phoneNumber",
  "phoneTail",
  "mobilePhone",
  "sessionKey",
  "rawIp",
  "ipAddress",
  "clientIp",
  "plainIp",
  "token"
]) {
  assert.throws(
    () => assertPublicCommunityAuthorSnapshot({ ...author, [forbidden]: "secret" }),
    CommunityLiteValidationError,
    `公开作者快照不得包含 ${forbidden}`
  );
}

process.stdout.write("community-lite verification passed\n");
