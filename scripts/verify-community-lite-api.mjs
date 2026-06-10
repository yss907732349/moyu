/* global process */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const shared = require("../packages/shared/dist/index.js");
const {
  CommunityCommentStatus,
  CommunityLiteErrorCode,
  CommunityReportHandleAction,
  CommunityReportReasonCode,
  CommunityReportStatus,
  CommunityPostStatus,
  CommunitySectionKey,
  CommentReviewDecision,
  CommentReviewUserRiskReason,
  UserFaction,
  AiModerationDecision,
  AiModerationRiskTag,
  AiModerationSource,
  ContentSecurityDecision,
  ContentSecurityImageAuditStatus,
  ContentSecurityRiskTag,
  ContentSecuritySource,
  createContentSecuritySummary
} = shared;
const {
  CommunityLiteController,
  CommunityModerationController
} = require("../apps/api/dist/community-lite.controller.js");
const { CommunityLiteService } = require("../apps/api/dist/community-lite.service.js");
const { AiContentModerationService } = require("../apps/api/dist/ai-content-moderation.service.js");
const communityServiceSource = readFileSync("apps/api/src/community-lite.service.ts", "utf8");
const wechatPhoneClientSource = readFileSync("apps/api/src/wechat-phone-number.client.ts", "utf8");

assert.equal(communityServiceSource.includes('cwd.endsWith(`${join("apps", "api")}`)'), true);
assert.equal(
  communityServiceSource.includes('resolve(cwd, "apps", "api", "uploads", "community")'),
  true
);
assert.equal(communityServiceSource.includes("assertCommunityPublishAllowed"), true);
assert.equal(communityServiceSource.includes("PrivacyConsentRequired"), true);
assert.equal(communityServiceSource.includes("PhoneVerificationRequired"), true);
assert.equal(communityServiceSource.includes("resolvePublishIpLocation"), true);
assert.equal(communityServiceSource.includes("extractTrustedClientIp"), true);
assert.equal(communityServiceSource.includes("findRecentPublicIpLocationForUser"), true);
assert.equal(communityServiceSource.includes("COMMUNITY_TRUSTED_PROXY_HEADERS"), true);
assert.equal(communityServiceSource.includes("TRUSTED_PROXY_IP_HEADERS"), true);
assert.equal(communityServiceSource.includes("COMMUNITY_IP_LOCATION_MOCK_LABEL"), true);
assert.equal(communityServiceSource.includes("phoneNumberHash"), true);
assert.equal(wechatPhoneClientSource.includes("getuserphonenumber"), true);
assert.equal(wechatPhoneClientSource.includes("手机号验证不能使用微信登录 code"), true);

const profiles = new Map([
  [
    "key-user",
    {
      userId: "key-user",
      displayName: "键影隐者1001",
      avatarKey: "avatar_key_shadow_default",
      faction: UserFaction.KeyShadow,
      factionLabel: "键影隐者",
      level: 1,
      titleKey: "newcomer_hidden_one",
      equippedBadgeKeys: ["first_profile"]
    }
  ],
  [
    "water-user",
    {
      userId: "water-user",
      displayName: "运影隐者1002",
      avatarKey: "avatar_water_escape_default",
      faction: UserFaction.WaterEscape,
      factionLabel: "运影隐者",
      level: 1,
      titleKey: "newcomer_hidden_one",
      equippedBadgeKeys: ["first_profile"]
    }
  ]
]);

const userGrowthProfileService = {
  async getProfile(userId) {
    const profile = profiles.get(userId);
    return { profileCreated: Boolean(profile), profile: profile ?? null };
  }
};

const context = {
  getCurrentUser(request) {
    return { userId: request.headers.authorization === "Bearer water" ? "water-user" : "key-user" };
  }
};
const configService = {
  get(key) {
    if (key === "ADMIN_OPERATIONS_TOKEN") return "dev-admin-token";
    return undefined;
  }
};

const prisma = { isDatabaseConfigured: () => false };
let moderationMockResult = "needs_manual_review";
const aiContentModerationService = new AiContentModerationService({
  get(key) {
    if (key === "AI_CONTENT_MODERATION_MOCK_RESULT") return moderationMockResult;
    return undefined;
  }
});
const dailyContentQuote = {
  sourceType: "daily_reflection",
  issueId: "daily-1",
  itemId: "item-1",
  sectionKey: "daily_reflection",
  sectionLabel: "今日参悟",
  title: "今日参悟标题",
  summary: "日报引用摘要",
  businessDate: "2026-05-26",
  reflectionText: "日报引用摘要",
  quotePrompt: "我从今日参悟想到："
};
const dailyArticleQuote = {
  sourceType: "daily_article",
  issueId: "daily-1",
  itemId: "article-1",
  articleId: "article-1",
  sectionKey: "world_intel",
  sectionLabel: "大陆新闻",
  title: "大陆新闻标题",
  summary: "日报文章引用摘要"
};
const dailyContentFeedService = {
  async assertQuoteAvailable(quote) {
    assert.equal(quote.issueId, "daily-1");
    assert.equal(["item-1", "article-1"].includes(quote.itemId), true);
    assert.equal(["今日参悟标题", "大陆新闻标题"].includes(quote.title), true);
  }
};
const service = new CommunityLiteService(
  prisma,
  userGrowthProfileService,
  dailyContentFeedService,
  aiContentModerationService
);
const adminOperationsService = {
  publishReviewCreated: async () => {},
  publishReviewStateChanged: async () => {},
  publishWorkbenchCountsChanged: async () => {}
};
const controller = new CommunityLiteController(
  context,
  service,
  adminOperationsService,
  configService
);
const moderation = new CommunityModerationController(
  service,
  configService,
  adminOperationsService
);
const keyRequest = { headers: { authorization: "Bearer key" } };
const waterRequest = { headers: { authorization: "Bearer water" } };
const adminToken = "dev-admin-token";

await assert.rejects(
  async () => moderation.listPendingPosts(undefined),
  (error) => error.getStatus() === 403
);

const uploaded = await controller.uploadMediaAsset(keyRequest, {
  fileUrl: "https://img.local/a.jpg",
  mimeType: "image/jpeg",
  fileSizeBytes: 120_000,
  thumbnailUrl: "https://img.local/a-thumb.jpg"
});
assert.equal(uploaded.asset.status, "uploaded");
assert.equal(uploaded.asset.thumbnailUrl, "https://img.local/a-thumb.jpg");
assert.equal(typeof service.getUploadedMediaAsset, "function");

await assert.rejects(
  () =>
    controller.uploadMediaAsset(keyRequest, {
      fileUrl: "https://img.local/not-image.txt",
      mimeType: "text/plain",
      fileSizeBytes: 100
    }),
  (error) =>
    error.getStatus() === 400 && error.response.errorCode === "community_media_invalid_type"
);

await assert.rejects(
  () =>
    controller.uploadMediaAsset(keyRequest, {
      fileUrl: "https://img.local/too-large.jpg",
      mimeType: "image/jpeg",
      fileSizeBytes: 6 * 1024 * 1024
    }),
  (error) => error.getStatus() === 400 && error.response.errorCode === "community_media_too_large"
);

const cleanupResult = await moderation.cleanupMediaAssets(adminToken);
assert.equal(typeof cleanupResult.cleanedCount, "number");

await assert.rejects(
  () =>
    controller.createPost(keyRequest, {
      title: "伪造图片 key 不应通过",
      body: "这条帖子只有旧图片 key，没有图片资产，不能绕过图片内容安全审核。",
      imageKeys: ["legacy_image_01"],
      sectionKey: CommunitySectionKey.KeyShadow
    }),
  (error) =>
    error.getStatus() === 400 && error.response.errorCode === "community_media_asset_required"
);

const created = await controller.createPost(keyRequest, {
  title: "今天如何优雅摸鱼",
  body: "分享一个暗黑忍者式上班生存技巧，先把水杯放在最远处。",
  mediaAssetIds: [uploaded.asset.id],
  imageKeys: ["post_image_01"],
  sectionKey: CommunitySectionKey.KeyShadow
});
assert.equal(created.status, CommunityPostStatus.Pending);

const publicBeforeReview = await controller.listPosts({
  sectionKey: CommunitySectionKey.KeyShadow
});
assert.equal(publicBeforeReview.posts.length, 0);

const authorPendingDetail = await controller.getPost(keyRequest, created.postId);
assert.equal(authorPendingDetail.post.status, CommunityPostStatus.Pending);
assert.equal(authorPendingDetail.post.visibleToAuthorOnly, true);

await assert.rejects(
  () => controller.getPost(waterRequest, created.postId),
  (error) =>
    error.getStatus() === 404 && error.response.errorCode === CommunityLiteErrorCode.PostNotFound
);

await assert.rejects(
  () =>
    controller.createPost(waterRequest, {
      title: "越区发帖应该失败",
      body: "这个用户不是键影阵营，不能在键影专区发布帖子。",
      sectionKey: CommunitySectionKey.KeyShadow
    }),
  (error) =>
    error.getStatus() === 403 &&
    error.response.errorCode === CommunityLiteErrorCode.FactionPostRestricted
);

assert.equal((await moderation.listPendingPosts(adminToken)).length, 1);
await moderation.reviewPost(adminToken, created.postId, {
  action: "approve",
  reviewNote: "人工审核通过"
});

const publicAfterReview = await controller.listPosts({ sectionKey: CommunitySectionKey.KeyShadow });
assert.equal(publicAfterReview.posts.length, 1);
assert.equal(publicAfterReview.posts[0].status, CommunityPostStatus.Approved);
assert.equal(publicAfterReview.posts[0].mediaAssets.length, 1);
assert.equal("userId" in publicAfterReview.posts[0].author, false);
assert.equal("monthlyAmount" in publicAfterReview.posts[0].author, false);
assert.equal("openid" in publicAfterReview.posts[0].author, false);

moderationMockResult = "approved";
const quoted = await controller.createPost(keyRequest, {
  title: "引用日报聊一聊",
  body: "这条日报让我想到一个办公室隐者生存技巧。",
  imageKeys: [],
  sectionKey: CommunitySectionKey.KeyShadow,
  dailyContentQuote
});
assert.equal(quoted.status, CommunityPostStatus.Approved);
const quotedDetail = await controller.getPost(keyRequest, quoted.postId);
assert.equal(quotedDetail.post.status, CommunityPostStatus.Approved);
assert.equal(quotedDetail.post.dailyContentQuote.title, dailyContentQuote.title);
assert.equal(quotedDetail.post.dailyContentQuote.sourceType, "daily_reflection");
assert.equal(quotedDetail.post.dailyContentQuote.businessDate, "2026-05-26");
assert.equal(quotedDetail.post.dailyContentQuote.reflectionText, dailyContentQuote.reflectionText);

await assert.rejects(
  () =>
    controller.createPost(keyRequest, {
      title: "引用失效日报",
      body: "这条日报引用已经不可用，应该被服务端拒绝。",
      imageKeys: [],
      sectionKey: CommunitySectionKey.KeyShadow,
      dailyContentQuote: { ...dailyContentQuote, itemId: "missing-item" }
    }),
  (error) =>
    error.getStatus() === 400 &&
    error.response.errorCode === CommunityLiteErrorCode.DailyContentQuoteUnavailable
);

moderationMockResult = "needs_manual_review";
const quotedArticle = await controller.createPost(keyRequest, {
  title: "引用日报文章聊一聊",
  body: "这篇日报文章让我想到一个办公室隐者生存技巧。",
  imageKeys: [],
  sectionKey: CommunitySectionKey.KeyShadow,
  dailyContentQuote: dailyArticleQuote
});
assert.equal(quotedArticle.status, CommunityPostStatus.Pending);
await moderation.reviewPost(adminToken, quotedArticle.postId, { action: "approve" });
const quotedArticleDetail = await controller.getPost(keyRequest, quotedArticle.postId);
assert.equal(quotedArticleDetail.post.dailyContentQuote.sourceType, "daily_article");

const detail = await controller.getPost(keyRequest, created.postId);
assert.equal(detail.post.body.includes("上班生存技巧"), true);
assert.equal(detail.comments.length, 0);

const commented = await controller.createComment(waterRequest, created.postId, {
  body: "学到了，先收藏。这里补充一段明显超过快速通过长度的评论，用来模拟需要人工复核的灰区长度场景，确保提交者本人可以看到待审核内容，而其他隐者在通过前看不到这条评论。为了让验证稳定，这里继续补充一些普通描述：这不是公开状态提示，也不应该出现在其他用户的评论区里。"
});
assert.equal(commented.status, CommunityCommentStatus.Pending);
assert.equal((await controller.getPost(keyRequest, created.postId)).comments.length, 0);
const waterPendingCommentView = await controller.getPost(waterRequest, created.postId);
assert.equal(waterPendingCommentView.comments.length, 1);
assert.equal(waterPendingCommentView.comments[0].visibleToAuthorOnly, true);

await moderation.reviewComment(adminToken, commented.commentId, { action: "approve" });
const detailAfterComment = await controller.getPost(keyRequest, created.postId);
assert.equal(detailAfterComment.comments.length, 1);

moderationMockResult = "approved";
const replied = await controller.createReply(waterRequest, commented.commentId, {
  body: "补一条一层回复。"
});
assert.equal(replied.status, CommunityCommentStatus.Approved);
assert.equal((await controller.getPost(keyRequest, created.postId)).comments[0].replies.length, 1);

moderationMockResult = "rejected";
const rejectedComment = await controller.createComment(waterRequest, created.postId, {
  body: "这条评论应该被 mock AI 拒绝。为了稳定越过低风险短评论快速通过通道，这里补充一段足够长的普通描述，让内容进入供应商审核分流，再由 mock 返回驳回结果，公开评论区不应该出现它。继续补充更多上下文，确保字符数明显超过上限：作者只是描述一个测试场景，系统必须按供应商结果处理，而不是把它当作短评论直接公开。"
});
assert.equal(rejectedComment.status, CommunityCommentStatus.Rejected);
assert.equal((await controller.getPost(keyRequest, created.postId)).comments.length, 1);

moderationMockResult = "";
const explicitRejectedComment = await controller.createComment(waterRequest, created.postId, {
  body: "这条评论包含强奸这种直白违规表达。为了稳定越过低风险短评论快速通过通道，这里补充一段足够长的普通描述，让内容进入服务端硬规则判断，公开评论区不应该出现它。继续补充更多上下文，确保字符数明显超过上限：作者只是描述一个测试场景，系统必须按硬规则结果处理，而不是把它当作短评论直接公开。"
});
assert.equal(explicitRejectedComment.status, CommunityCommentStatus.Rejected);
assert.equal((await controller.getPost(keyRequest, created.postId)).comments.length, 1);

const callbackTraceId = "community-image-callback-trace-001";
process.env.API_PUBLIC_BASE_URL = "https://api.public.test/root";
const imageContentSecurityService = {
  async moderateUserContent() {
    const now = new Date().toISOString();
    return {
      decision: AiModerationDecision.Approved,
      source: AiModerationSource.WechatText,
      confidence: 0.95,
      riskTags: [AiModerationRiskTag.Safe],
      reason: "微信文本内容安全通过",
      moderatedAt: now,
      contentSecuritySummary: createContentSecuritySummary({
        source: ContentSecuritySource.WechatText,
        decision: ContentSecurityDecision.Approved,
        riskTags: [ContentSecurityRiskTag.Safe],
        reason: "微信文本内容安全通过",
        normalizedAt: now
      })
    };
  },
  async submitImageContentSecurity(input) {
    assert.equal(
      input.mediaUrl.startsWith(
        "https://api.public.test/community/media-assets/files/community-media-"
      ),
      true
    );
    const now = new Date().toISOString();
    return {
      decision: AiModerationDecision.NeedsManualReview,
      source: AiModerationSource.WechatImage,
      confidence: 0.4,
      riskTags: [AiModerationRiskTag.Ambiguous],
      reason: "微信图片审核等待异步回调",
      manualReviewReason: "image_callback_pending",
      moderatedAt: now,
      contentSecuritySummary: createContentSecuritySummary({
        source: ContentSecuritySource.WechatImage,
        decision: ContentSecurityDecision.NeedsManualReview,
        riskTags: [ContentSecurityRiskTag.Ambiguous],
        reason: "微信图片审核等待异步回调",
        manualReviewReason: "image_callback_pending",
        imageAuditStatus: ContentSecurityImageAuditStatus.PendingCallback,
        traceId: callbackTraceId,
        normalizedAt: now
      })
    };
  }
};
const callbackService = new CommunityLiteService(
  prisma,
  userGrowthProfileService,
  dailyContentFeedService,
  imageContentSecurityService
);
const callbackController = new CommunityLiteController(
  context,
  callbackService,
  adminOperationsService,
  configService
);
const callbackAsset = await callbackController.uploadMediaAsset(keyRequest, {
  dataUrl:
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  mimeType: "image/png",
  fileSizeBytes: 100_000
});
const callbackPost = await callbackController.createPost(keyRequest, {
  title: "带图帖子等待微信回调",
  body: "文本已经通过，图片需要异步回调后才能公开。",
  mediaAssetIds: [callbackAsset.asset.id],
  sectionKey: CommunitySectionKey.KeyShadow
});
assert.equal(callbackPost.status, CommunityPostStatus.Pending);
assert.equal(
  (await callbackController.listPosts({ sectionKey: CommunitySectionKey.KeyShadow })).posts.length,
  0
);
await callbackController.handleWechatMediaSecurityCallback("dev-callback-token", {
  trace_id: callbackTraceId,
  result: { suggest: "pass", label: "100" }
});
const callbackPublicPosts = await callbackController.listPosts({
  sectionKey: CommunitySectionKey.KeyShadow
});
assert.equal(callbackPublicPosts.posts.length, 1);
assert.equal(callbackPublicPosts.posts[0].status, CommunityPostStatus.Approved);
delete process.env.API_PUBLIC_BASE_URL;

const liked = await controller.likePost(keyRequest, created.postId);
assert.equal(liked.viewerInteraction.liked, true);
assert.equal(liked.stats.likeCount, 1);
const unliked = await controller.unlikePost(keyRequest, created.postId);
assert.equal(unliked.viewerInteraction.liked, false);
assert.equal(unliked.stats.likeCount, 0);

const favorited = await controller.favoritePost(keyRequest, created.postId);
assert.equal(favorited.viewerInteraction.favorited, true);
assert.equal(favorited.stats.favoriteCount, 1);
const unfavorited = await controller.unfavoritePost(keyRequest, created.postId);
assert.equal(unfavorited.viewerInteraction.favorited, false);

await assert.rejects(
  () =>
    controller.reportPost(keyRequest, created.postId, {
      reasonCode: CommunityReportReasonCode.Privacy,
      reasonText: "自己不能举报自己的帖子"
    }),
  (error) =>
    error.getStatus() === 400 &&
    error.response.errorCode === CommunityLiteErrorCode.SelfReportNotAllowed
);

await assert.rejects(
  () =>
    controller.reportComment(keyRequest, rejectedComment.commentId, {
      reasonCode: CommunityReportReasonCode.Spam,
      reasonText: "非公开评论不能被普通举报入口处理"
    }),
  (error) =>
    error.getStatus() === 400 && error.response.errorCode === CommunityLiteErrorCode.TargetNotPublic
);

const reportPost = await controller.reportPost(waterRequest, created.postId, {
  reasonCode: CommunityReportReasonCode.Privacy,
  reasonText: "内容疑似泄露隐私"
});
assert.equal(reportPost.accepted, true);
assert.equal(reportPost.status, CommunityReportStatus.Pending);
const duplicatedReportPost = await controller.reportPost(waterRequest, created.postId, {
  reasonCode: CommunityReportReasonCode.Privacy,
  reasonText: "重复举报同一个帖子"
});
assert.equal(duplicatedReportPost.accepted, true);
assert.equal(duplicatedReportPost.alreadyReported, true);
assert.equal(duplicatedReportPost.reportId, reportPost.reportId);

const reportComment = await controller.reportComment(keyRequest, commented.commentId, {
  reasonCode: CommunityReportReasonCode.Harassment,
  reasonText: "评论疑似违规"
});
assert.equal(reportComment.accepted, true);
const reportReply = await controller.reportReply(keyRequest, replied.replyId, {
  reasonCode: CommunityReportReasonCode.Other,
  reasonText: "回复疑似违规"
});
assert.equal(reportReply.accepted, true);

moderationMockResult = "approved";
for (let index = 0; index < 9; index += 1) {
  const rateLimitTarget = await controller.createPost(keyRequest, {
    title: `举报限流目标 ${index + 1}`,
    body: `这是第 ${index + 1} 个用于举报限流验证的公开帖子，内容本身普通。`,
    imageKeys: [],
    sectionKey: CommunitySectionKey.KeyShadow
  });
  assert.equal(rateLimitTarget.status, CommunityPostStatus.Approved);
  const rateLimitReport = await controller.reportPost(waterRequest, rateLimitTarget.postId, {
    reasonCode: CommunityReportReasonCode.Spam,
    reasonText: `限流验证举报 ${index + 1}`
  });
  assert.equal(rateLimitReport.accepted, true);
}

const rateLimitedTarget = await controller.createPost(keyRequest, {
  title: "举报限流目标 10",
  body: "这是超过今日举报上限时使用的公开帖子，举报请求应该被服务端限流。",
  imageKeys: [],
  sectionKey: CommunitySectionKey.KeyShadow
});
await assert.rejects(
  () =>
    controller.reportPost(waterRequest, rateLimitedTarget.postId, {
      reasonCode: CommunityReportReasonCode.Illegal,
      reasonText: "超过今日举报上限"
    }),
  (error) =>
    error.getStatus() === 429 &&
    error.response.errorCode === CommunityLiteErrorCode.ReportRateLimited
);

const queue = await moderation.listPending(adminToken);
assert.equal(queue.reports.length >= 12, true);
const queuedPostReport = queue.reports.find((report) => report.id === reportPost.reportId);
assert.equal(queuedPostReport.reasonCode, CommunityReportReasonCode.Privacy);
assert.equal(queuedPostReport.priority, "high");
assert.equal(queuedPostReport.targetSnapshot.author.displayName, "键影隐者1001");
assert.equal(queuedPostReport.reportCount, 1);
const reportDetail = await service.getReportReviewDetail(reportPost.reportId);
assert.equal(reportDetail.caseSummary.targetKey, queuedPostReport.targetKey);
assert.equal(reportDetail.relatedReports.length, 0);

await moderation.handleReport(adminToken, reportReply.reportId, {
  action: CommunityReportHandleAction.FalseReport
});
await assert.rejects(
  () =>
    moderation.handleReport(adminToken, reportReply.reportId, {
      action: CommunityReportHandleAction.Keep
    }),
  (error) => error.getStatus() === 409
);

await moderation.handleReport(adminToken, reportPost.reportId, {
  action: CommunityReportHandleAction.Hide,
  handleNote: "举报后隐藏"
});
const handledReportDetail = await service.getReportReviewDetail(reportPost.reportId);
assert.equal(handledReportDetail.status, CommunityReportStatus.Hidden);
assert.equal(handledReportDetail.effectiveForAuthorRisk, true);
const postsAfterHide = await controller.listPosts({ sectionKey: CommunitySectionKey.KeyShadow });
assert.equal(
  postsAfterHide.posts.some((post) => post.id === created.postId),
  false
);
assert.equal(
  postsAfterHide.posts.some((post) => post.id === quoted.postId),
  true
);
await assert.rejects(
  () => controller.likePost(keyRequest, created.postId),
  (error) =>
    error.getStatus() === 400 && error.response.errorCode === CommunityLiteErrorCode.TargetNotPublic
);

const waterMessages = await controller.listMessages(waterRequest);
assert.equal(
  waterMessages.messages.some(
    (message) =>
      message.type === "report_handled" &&
      message.targetType === "report" &&
      !message.body.includes("举报后隐藏")
  ),
  true
);
const keyMessages = await controller.listMessages(keyRequest);
assert.equal(
  keyMessages.messages.some(
    (message) =>
      message.title === "内容已处理" &&
      !message.body.includes("water-user") &&
      !message.body.includes("内容疑似泄露隐私")
  ),
  true
);

const waterPublicPost = await controller.createPost(waterRequest, {
  title: "魔王吐槽公共讨论",
  body: "这是一条给被举报作者验证有效举报风险的公开讨论帖。",
  imageKeys: [],
  sectionKey: CommunitySectionKey.BossRant
});
assert.equal(waterPublicPost.status, CommunityPostStatus.Approved);
const effectiveRiskComment = await controller.createComment(keyRequest, waterPublicPost.postId, {
  body: "收到"
});
assert.equal(effectiveRiskComment.status, CommunityCommentStatus.Pending);
assert.equal(effectiveRiskComment.reviewDecision, CommentReviewDecision.ManualReview);
const effectiveRiskCommentDetail = await controller.getPost(keyRequest, waterPublicPost.postId);
const ownPendingComment = effectiveRiskCommentDetail.comments.find(
  (comment) => comment.id === effectiveRiskComment.commentId
);
assert.equal(ownPendingComment.visibleToAuthorOnly, true);
const myEffectiveRiskComment = (await controller.listMyPosts(keyRequest)).comments.find(
  (comment) => comment.id === effectiveRiskComment.commentId
);
const riskTrace = myEffectiveRiskComment?.moderation?.commentReviewDecision;
assert.equal(
  riskTrace?.userRiskReasons.includes(CommentReviewUserRiskReason.EffectiveReport),
  true
);

const identityProfiles = new Map([
  [
    "identity-key-user",
    {
      userId: "identity-key-user",
      displayName: "键影合规隐者",
      avatarKey: "avatar_key_shadow_default",
      faction: UserFaction.KeyShadow,
      factionLabel: "键影隐者",
      level: 1,
      titleKey: "newcomer_hidden_one",
      equippedBadgeKeys: ["first_profile"]
    }
  ],
  [
    "identity-water-user",
    {
      userId: "identity-water-user",
      displayName: "运影合规隐者",
      avatarKey: "avatar_water_escape_default",
      faction: UserFaction.WaterEscape,
      factionLabel: "运影隐者",
      level: 1,
      titleKey: "newcomer_hidden_one",
      equippedBadgeKeys: ["first_profile"]
    }
  ]
]);
const identityProfileService = {
  async getProfile(userId) {
    const profile = identityProfiles.get(userId);
    return { profileCreated: Boolean(profile), profile: profile ?? null };
  }
};
const identityConfig = {
  get(key) {
    const values = {
      ADMIN_OPERATIONS_TOKEN: adminToken,
      COMMUNITY_IDENTITY_GATE_ENABLED: "true",
      COMMUNITY_PRIVACY_POLICY_VERSION: "2026-06-08",
      COMMUNITY_AGREEMENT_VERSION: "2026-06-08",
      WECHAT_PHONE_NUMBER_MOCK_ENABLED: "true",
      WECHAT_PHONE_NUMBER_MOCK_PHONE: "replace-with-mock-phone-number",
      COMMUNITY_PHONE_HASH_SALT: "replace-with-community-phone-hash-salt",
      COMMUNITY_IP_LOCATION_MOCK_LABEL: "广东",
      COMMUNITY_IP_LOCATION_MOCK_COUNTRY: "中国",
      COMMUNITY_IP_LOCATION_MOCK_PROVINCE: "广东"
    };
    return values[key];
  }
};
const identityContext = {
  getCurrentUser(request) {
    return {
      userId:
        request.headers.authorization === "Bearer identity-water"
          ? "identity-water-user"
          : "identity-key-user"
    };
  }
};
const identityAiService = new AiContentModerationService({
  get(key) {
    if (key === "AI_CONTENT_MODERATION_MOCK_RESULT") return "approved";
    return undefined;
  }
});
const identityService = new CommunityLiteService(
  prisma,
  identityProfileService,
  dailyContentFeedService,
  identityAiService,
  undefined,
  identityConfig
);
const identityController = new CommunityLiteController(
  identityContext,
  identityService,
  adminOperationsService,
  identityConfig
);
const identityModeration = new CommunityModerationController(
  identityService,
  identityConfig,
  adminOperationsService
);
const identityKeyRequest = {
  headers: { authorization: "Bearer identity-key" },
  socket: { remoteAddress: "10.0.0.8" }
};
const identityWaterRequest = {
  headers: { authorization: "Bearer identity-water" },
  socket: { remoteAddress: "10.0.0.9" }
};

const initialEligibility = await identityController.getPublishEligibility(identityKeyRequest);
assert.equal(initialEligibility.canPublish, false);
assert.equal(initialEligibility.nextAction, "accept_privacy");
assert.equal(initialEligibility.phoneVerified, false);
assert.equal("phoneNumber" in initialEligibility, false);
assert.equal("phoneTail" in initialEligibility, false);
await assert.rejects(
  () =>
    identityController.createPost(identityKeyRequest, {
      title: "未同意不能发帖",
      body: "这条内容不应该进入待审核队列，因为还没有同意隐私政策。",
      sectionKey: CommunitySectionKey.KeyShadow
    }),
  (error) =>
    error.getStatus() === 403 &&
    error.response.errorCode === CommunityLiteErrorCode.PrivacyConsentRequired
);

await assert.rejects(
  () =>
    identityController.verifyWechatPhoneNumber(identityKeyRequest, {
      code: "phone_code_before_privacy"
    }),
  (error) =>
    error.getStatus() === 403 &&
    error.response.errorCode === CommunityLiteErrorCode.PrivacyConsentRequired
);
const consent = await identityController.acceptPrivacyConsent(identityKeyRequest, {
  scene: "community_publish"
});
assert.equal(consent.accepted, true);
assert.equal(consent.eligibility.nextAction, "verify_phone");
await assert.rejects(
  () =>
    identityController.createPost(identityKeyRequest, {
      title: "未验证不能发帖",
      body: "这条内容不应该进入待审核队列，因为还没有完成手机号验证。",
      sectionKey: CommunitySectionKey.KeyShadow
    }),
  (error) =>
    error.getStatus() === 403 &&
    error.response.errorCode === CommunityLiteErrorCode.PhoneVerificationRequired
);
await assert.rejects(
  () => identityController.verifyWechatPhoneNumber(identityKeyRequest, { code: "login_mock_code" }),
  (error) =>
    error.getStatus() === 400 &&
    error.response.errorCode === CommunityLiteErrorCode.PhoneVerificationFailed
);
const verified = await identityController.verifyWechatPhoneNumber(identityKeyRequest, {
  code: "phone_dynamic_code"
});
assert.equal(verified.verified, true);
assert.equal(verified.eligibility.canPublish, true);
assert.equal("phoneNumber" in verified, false);
assert.equal("phoneTail" in verified, false);

const identityPost = await identityController.createPost(identityKeyRequest, {
  title: "已完成身份门槛后发帖",
  body: "这条帖子用于验证身份门槛通过后可以进入既有内容审核生命周期。",
  sectionKey: CommunitySectionKey.KeyShadow
});
assert.equal(identityPost.status, CommunityPostStatus.Approved);
const identityDetail = await identityController.getPost(identityKeyRequest, identityPost.postId);
assert.equal(identityDetail.post.ipLocationLabel, "广东");
assert.equal("phoneVerified" in identityDetail.post.author, false);
assert.equal("phoneNumber" in identityDetail.post.author, false);
assert.equal("rawIp" in identityDetail.post, false);
assert.equal("ipAddress" in identityDetail.post, false);

await identityController.acceptPrivacyConsent(identityWaterRequest, { scene: "community_comment" });
await identityController.verifyWechatPhoneNumber(identityWaterRequest, {
  code: "phone_dynamic_code_water"
});
const identityComment = await identityController.createComment(
  identityWaterRequest,
  identityPost.postId,
  { body: "完成门槛后可以评论。" }
);
assert.equal(identityComment.status, CommunityCommentStatus.Approved);
const detailWithComment = await identityController.getPost(identityKeyRequest, identityPost.postId);
assert.equal(detailWithComment.comments[0].ipLocationLabel, "广东");
const identityReply = await identityController.createReply(
  identityKeyRequest,
  detailWithComment.comments[0].id,
  { body: "完成门槛后可以回复。" }
);
assert.equal(identityReply.status, CommunityCommentStatus.Approved);
const detailWithReply = await identityController.getPost(identityKeyRequest, identityPost.postId);
assert.equal(detailWithReply.comments[0].replies[0].ipLocationLabel, "广东");

const identityPublicProfile = await identityController.getPublicUserProfile("identity-key-user");
assert.equal(identityPublicProfile.profile.recentIpLocationLabel, "广东");
assert.equal("phoneVerified" in identityPublicProfile.profile, false);
assert.equal("phoneNumber" in identityPublicProfile.profile, false);
assert.equal("openid" in identityPublicProfile.profile, false);

const unverifiedPost = await identityController.createPost(identityKeyRequest, {
  title: "给未验证互动用户看的公开帖",
  body: "这条公开帖用于验证点赞收藏举报不强制发布门槛验证。",
  sectionKey: CommunitySectionKey.KeyShadow
});
identityProfiles.set("identity-viewer-user", {
  userId: "identity-viewer-user",
  displayName: "未验证互动隐者",
  avatarKey: "avatar_water_escape_default",
  faction: UserFaction.WaterEscape,
  factionLabel: "运影隐者",
  level: 1,
  titleKey: "newcomer_hidden_one",
  equippedBadgeKeys: ["first_profile"]
});
const identityViewerRequest = {
  headers: { authorization: "Bearer identity-viewer" },
  socket: { remoteAddress: "10.0.0.10" }
};
identityContext.getCurrentUser = (request) => {
  if (request.headers.authorization === "Bearer identity-water") {
    return { userId: "identity-water-user" };
  }
  if (request.headers.authorization === "Bearer identity-viewer") {
    return { userId: "identity-viewer-user" };
  }
  return { userId: "identity-key-user" };
};
assert.equal(
  (await identityController.likePost(identityViewerRequest, unverifiedPost.postId))
    .viewerInteraction.liked,
  true
);
assert.equal(
  (await identityController.favoritePost(identityViewerRequest, unverifiedPost.postId))
    .viewerInteraction.favorited,
  true
);
assert.equal(
  (
    await identityController.reportPost(identityViewerRequest, unverifiedPost.postId, {
      reasonCode: CommunityReportReasonCode.Spam,
      reasonText: "未验证手机号也可以举报公开内容"
    })
  ).accepted,
  true
);

const identityPendingPosts = await identityModeration.listPendingPosts(adminToken);
assert.equal(identityPendingPosts.length, 0);
const identityGovernance = await identityService.getUserGovernance("identity-key-user");
assert.equal(identityGovernance.phoneVerified, true);
assert.equal(identityGovernance.privacyPolicyVersion, "2026-06-08");
assert.equal(identityGovernance.communityAgreementVersion, "2026-06-08");
assert.equal(identityGovernance.recentIpLocationLabel, "广东");

profiles.delete("water-user");
await assert.rejects(
  () =>
    controller.createPost(waterRequest, {
      title: "没有档案不能发帖",
      body: "已登录但没有隐者档案时必须被服务端拒绝。",
      sectionKey: CommunitySectionKey.BossRant
    }),
  (error) =>
    error.getStatus() === 403 && error.response.errorCode === CommunityLiteErrorCode.ProfileRequired
);

process.stdout.write("community-lite api verification passed\n");
