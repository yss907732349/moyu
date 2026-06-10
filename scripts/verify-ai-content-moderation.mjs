/* global process */
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const shared = require("../packages/shared/dist/index.js");
const {
  AiModerationDecision,
  AiModerationManualReviewReason,
  AiModerationRiskTag,
  AiModerationSource,
  ContentSecurityDecision,
  ContentSecurityImageAuditStatus,
  ContentSecurityManualReviewReason,
  ContentSecurityRiskTag,
  ContentSecuritySource
} = shared;
const { AiContentModerationService } = require("../apps/api/dist/ai-content-moderation.service.js");

let mockResult = "";
let forceProviderError = "false";
let wechatEnabled = "false";
let wechatMockEnabled = "false";
let wechatMockTextResult = "pass";
let wechatMockImageResult = "pass";
const config = {
  get(key) {
    if (key === "AI_CONTENT_MODERATION_MOCK_RESULT") return mockResult;
    if (key === "AI_CONTENT_MODERATION_FORCE_PROVIDER_ERROR") return forceProviderError;
    if (key === "WECHAT_CONTENT_SECURITY_ENABLED") return wechatEnabled;
    if (key === "WECHAT_CONTENT_SECURITY_MOCK_ENABLED") return wechatMockEnabled;
    if (key === "WECHAT_CONTENT_SECURITY_MOCK_TEXT_RESULT") return wechatMockTextResult;
    if (key === "WECHAT_CONTENT_SECURITY_MOCK_IMAGE_RESULT") return wechatMockImageResult;
    return undefined;
  }
};
const service = new AiContentModerationService(config);

mockResult = AiModerationDecision.Approved;
const approved = await service.moderateUserContent({
  contentType: "community_post",
  title: "今天如何优雅摸鱼",
  body: "分享一个办公室隐者生存技巧。"
});
assert.equal(approved.decision, AiModerationDecision.Approved);
assert.equal(approved.source, AiModerationSource.Mock);

mockResult = AiModerationDecision.Rejected;
const rejected = await service.moderateUserContent({
  contentType: "community_comment",
  body: "mock reject"
});
assert.equal(rejected.decision, AiModerationDecision.Rejected);
assert.equal(rejected.riskTags.includes(AiModerationRiskTag.Spam), true);

mockResult = AiModerationDecision.NeedsManualReview;
const pending = await service.moderateUserContent({
  contentType: "daily_article_comment",
  body: "mock pending"
});
assert.equal(pending.decision, AiModerationDecision.NeedsManualReview);
assert.equal(pending.manualReviewReason, AiModerationManualReviewReason.LowConfidence);

mockResult = "";
forceProviderError = "true";
const failed = await service.moderateUserContent({
  contentType: "community_post",
  body: "供应商失败降级"
});
assert.equal(failed.decision, AiModerationDecision.NeedsManualReview);
assert.equal(failed.manualReviewReason, AiModerationManualReviewReason.ProviderError);
assert.equal(failed.contentSecuritySummary.source, ContentSecuritySource.ManualFallback);

forceProviderError = "false";
const explicitViolation = await service.moderateUserContent({
  contentType: "community_comment",
  body: "这条评论包含强奸这种直白违规表达"
});
assert.equal(explicitViolation.decision, AiModerationDecision.Rejected);
assert.equal(explicitViolation.riskTags.includes(AiModerationRiskTag.Abuse), true);
assert.equal(explicitViolation.contentSecuritySummary.decision, ContentSecurityDecision.Rejected);

wechatMockEnabled = "true";
wechatMockTextResult = "pass";
const wechatMockPass = await service.moderateUserContent({
  contentType: "community_post",
  userId: "mock-user",
  body: "微信 mock 文本通过"
});
assert.equal(wechatMockPass.decision, AiModerationDecision.Approved);
assert.equal(wechatMockPass.source, AiModerationSource.WechatMock);
assert.equal(wechatMockPass.contentSecuritySummary.source, ContentSecuritySource.WechatMock);

wechatMockTextResult = "risky";
const wechatMockRisky = await service.moderateUserContent({
  contentType: "community_comment",
  userId: "mock-user",
  body: "微信 mock 文本违规"
});
assert.equal(wechatMockRisky.decision, AiModerationDecision.Rejected);
assert.equal(
  wechatMockRisky.contentSecuritySummary.riskTags.includes(ContentSecurityRiskTag.Spam),
  true
);

wechatMockTextResult = "review";
const wechatMockReview = await service.moderateUserContent({
  contentType: "daily_article_comment",
  userId: "mock-user",
  body: "微信 mock 文本复核"
});
assert.equal(wechatMockReview.decision, AiModerationDecision.NeedsManualReview);
assert.equal(
  wechatMockReview.contentSecuritySummary.manualReviewReason,
  ContentSecurityManualReviewReason.GreyArea
);

const wechatMockHardReject = await service.moderateUserContent({
  contentType: "community_comment",
  userId: "mock-user",
  body: "即使 mock 开着，这条包含强奸的明显违规内容也必须被拦住。"
});
assert.equal(wechatMockHardReject.decision, AiModerationDecision.Rejected);
assert.equal(wechatMockHardReject.riskTags.includes(AiModerationRiskTag.Abuse), true);

const wechatMockPornographyReject = await service.moderateUserContent({
  contentType: "community_post",
  userId: "mock-user",
  title: "奶子黄虫",
  body: "234324234324324324"
});
assert.equal(wechatMockPornographyReject.decision, AiModerationDecision.Rejected);
assert.equal(wechatMockPornographyReject.riskTags.includes(AiModerationRiskTag.Pornography), true);

wechatMockImageResult = "";
const wechatMockImageDefault = await service.submitImageContentSecurity({
  userId: "mock-user",
  mediaUrl: "https://example.com/community/default.jpg"
});
assert.equal(wechatMockImageDefault.decision, AiModerationDecision.NeedsManualReview);
assert.equal(
  wechatMockImageDefault.contentSecuritySummary.imageAuditStatus,
  ContentSecurityImageAuditStatus.ManualReview
);

wechatMockImageResult = "pass";
const wechatMockImage = await service.submitImageContentSecurity({
  userId: "mock-user",
  mediaUrl: "https://example.com/community/a.jpg"
});
assert.equal(wechatMockImage.source, AiModerationSource.WechatImage);
assert.equal(
  wechatMockImage.contentSecuritySummary.imageAuditStatus,
  ContentSecurityImageAuditStatus.Approved
);

const wechatMockRelativeImage = await service.submitImageContentSecurity({
  userId: "mock-user",
  mediaUrl: "/community/media-assets/files/community-media-1.jpg"
});
assert.equal(wechatMockRelativeImage.decision, AiModerationDecision.Approved);
assert.equal(
  wechatMockRelativeImage.contentSecuritySummary.imageAuditStatus,
  ContentSecurityImageAuditStatus.Approved
);

wechatMockEnabled = "false";
wechatEnabled = "true";
const missingOpenid = await service.moderateUserContent({
  contentType: "profile_display_name",
  userId: "missing-openid-user",
  body: "合规昵称"
});
assert.equal(missingOpenid.decision, AiModerationDecision.NeedsManualReview);
assert.equal(
  missingOpenid.contentSecuritySummary.manualReviewReason,
  ContentSecurityManualReviewReason.OpenidUnavailable
);

const rawTraceId = "raw-trace-id-should-not-leak-123456";
const wechatClient = {
  async checkText() {
    return { errcode: 0, result: { suggest: "pass", label: "100" }, trace_id: rawTraceId };
  },
  async submitImage() {
    return { errcode: 0, result: { suggest: "pass", label: "100" }, trace_id: rawTraceId };
  }
};
const serviceWithWechat = new AiContentModerationService(config, wechatClient);
const wechatRealPass = await serviceWithWechat.moderateUserContent({
  contentType: "community_reply",
  openid: "openid_test_should_not_leak",
  body: "真实微信客户端映射通过"
});
assert.equal(wechatRealPass.decision, AiModerationDecision.Approved);
assert.equal(wechatRealPass.source, AiModerationSource.WechatText);
assert.equal(wechatRealPass.contentSecuritySummary.traceIdDigest.length > 0, true);
assert.equal(JSON.stringify(wechatRealPass).includes(rawTraceId), false);
assert.equal(JSON.stringify(wechatRealPass).includes("openid_test_should_not_leak"), false);

process.stdout.write("ai-content-moderation verification passed\n");
