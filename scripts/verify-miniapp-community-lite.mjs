/* global process */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const shared = require("../packages/shared/dist/index.js");
const {
  COMMUNITY_PUBLIC_RESPONSE_SENSITIVE_FIELD_BLACKLIST,
  CommunityPostStatus,
  CommunityReportReasonCode
} = shared;

const serviceSource = readFileSync("apps/miniapp/src/services/community-lite.ts", "utf8");
const userProfileService = readFileSync("apps/miniapp/src/services/user-growth-profile.ts", "utf8");
const communityIndex = readFileSync("apps/miniapp/src/pages/community/index.vue", "utf8");
const postPage = readFileSync("apps/miniapp/src/pages/community/post.vue", "utf8");
const detailPage = readFileSync("apps/miniapp/src/pages/community/detail.vue", "utf8");
const policyPage = readFileSync("apps/miniapp/src/pages/community/policy.vue", "utf8");
const myPostsPage = readFileSync("apps/miniapp/src/pages/community/my-posts.vue", "utf8");
const myPendingPostsPage = readFileSync(
  "apps/miniapp/src/pages/community/my-posts-pending.vue",
  "utf8"
);
const myReviewedPostsPage = readFileSync(
  "apps/miniapp/src/pages/community/my-posts-reviewed.vue",
  "utf8"
);
const myCommentsPage = readFileSync("apps/miniapp/src/pages/community/my-comments.vue", "utf8");
const myRepliesPage = readFileSync("apps/miniapp/src/pages/community/my-replies.vue", "utf8");
const myFavoritesPage = readFileSync("apps/miniapp/src/pages/community/my-favorites.vue", "utf8");
const messagesPage = readFileSync("apps/miniapp/src/pages/community/messages.vue", "utf8");
const pagesJson = readFileSync("apps/miniapp/src/pages.json", "utf8");
const seedStrategyPath =
  "openspec/changes/archive/2026-05-28-stabilize-miniapp-first-run-user-flow/dev-seed-strategy.md";
assert.equal(
  existsSync(seedStrategyPath),
  true,
  `缺少首跑开发种子策略归档文档：${seedStrategyPath}`
);
const seedStrategy = readFileSync(seedStrategyPath, "utf8");

assert.equal(serviceSource.includes("/community/posts"), true);
assert.equal(serviceSource.includes("getAuthHeaders"), true);
assert.equal(serviceSource.includes("isListCommunityPostsResponse"), true);
assert.equal(serviceSource.includes("isGetCommunityPostResponse"), true);
assert.equal(serviceSource.includes("allowAuthorPending"), true);
assert.equal(serviceSource.includes("CommunityPostStatus.Pending"), true);
assert.equal(serviceSource.includes("/community/me/posts"), true);
assert.equal(serviceSource.includes("/community/me/messages"), true);
assert.equal(serviceSource.includes("/community/media-assets"), true);
assert.equal(serviceSource.includes("readLocalFileAsDataUrl"), true);
assert.equal(
  serviceSource.includes('throw new CommunityLiteClientError("图片读取失败，请重新选择后上传")'),
  true
);
assert.equal(serviceSource.includes("resolveCommunityPublicAssetUrl"), true);
assert.equal(serviceSource.includes("appendCommunityAssetCacheKey"), true);
assert.equal(serviceSource.includes("cacheApiImageForDisplay"), true);
assert.equal(serviceSource.includes("/community/comments/"), true);
assert.equal(serviceSource.includes("/replies"), true);
assert.equal(serviceSource.includes("/community/me/publish-eligibility"), true);
assert.equal(serviceSource.includes("/community/me/privacy-consent"), true);
assert.equal(serviceSource.includes("/community/me/phone-verification"), true);
assert.equal(serviceSource.includes("/community/users/"), true);
assert.equal(serviceSource.includes("getCommunityPublishEligibility"), true);
assert.equal(serviceSource.includes("acceptCommunityPrivacyConsent"), true);
assert.equal(serviceSource.includes("verifyWechatPhoneNumber"), true);
assert.equal(serviceSource.includes("getCommunityPublicUserProfile"), true);
assert.equal(serviceSource.includes("isCommunityPublishGateError"), true);
assert.equal(serviceSource.includes("reasonCode"), true);
assert.equal(serviceSource.includes("reasonText"), true);
assert.equal(serviceSource.includes("markAllCommunityMessagesRead"), true);
assert.equal(serviceSource.includes("CommunityLiteErrorCode.ProfileRequired"), true);
assert.equal(serviceSource.includes("CommunityLiteErrorCode.PrivacyConsentRequired"), true);
assert.equal(serviceSource.includes("CommunityLiteErrorCode.PhoneVerificationRequired"), true);
assert.equal(serviceSource.includes('!("monthlyAmount" in record.author)'), true);
assert.equal(serviceSource.includes('!("workStartTime" in record.author)'), true);
assert.equal(serviceSource.includes('!("openid" in record.author)'), true);
assert.equal(serviceSource.includes("COMMUNITY_PUBLIC_RESPONSE_SENSITIVE_FIELD_BLACKLIST"), true);
assert.equal(serviceSource.includes("hasPublicSensitiveFields"), true);
assert.equal(serviceSource.includes("!hasPublicSensitiveFields(value)"), true);
for (const field of [
  "phoneVerified",
  "phoneNumber",
  "phoneTail",
  "city",
  "district",
  "streetAddress",
  "ipSourceHeaders",
  "providerRawResponse",
  "rawModerationResponse"
]) {
  assert.equal(COMMUNITY_PUBLIC_RESPONSE_SENSITIVE_FIELD_BLACKLIST.includes(field), true);
}
assert.equal(userProfileService.includes("clearLocalUserProfileSnapshot"), true);
assert.match(userProfileService, /else\s*\{\s*clearLocalUserProfileSnapshot\(\);\s*\}/u);

assert.equal(communityIndex.includes("postsData"), false);
assert.equal(communityIndex.includes("toggleChakra"), false);
assert.equal(communityIndex.includes("toggleFavorite"), false);
assert.equal(communityIndex.includes("listCommunityPosts"), true);
assert.equal(communityIndex.includes("success-overlay"), true);
assert.equal(communityIndex.includes("worldBanner"), true);
assert.equal(communityIndex.includes("隐者大陆"), true);
assert.equal(communityIndex.includes("异闻绘卷"), true);
assert.equal(communityIndex.includes("进入绘卷"), true);
assert.equal(communityIndex.includes("漫画模块封印中"), false);
assert.equal(communityIndex.includes("敬请期待"), false);
assert.equal(communityIndex.includes("handleWorldBannerTap"), true);
assert.equal(communityIndex.includes("openMyPosts"), false);
assert.equal(communityIndex.includes("我的帖子"), false);
assert.equal(communityIndex.includes("openMessages"), true);
assert.equal(communityIndex.includes("getAppAuthToken"), true);
assert.equal(communityIndex.includes("getLocalUserProfileSnapshot"), true);
assert.equal(communityIndex.includes('switchTab({ url: "/pages/profile/index" })'), true);
assert.equal(communityIndex.includes("handleSectionTap"), true);
assert.equal(communityIndex.includes("canUserPostToCommunitySection"), true);
assert.equal(communityIndex.includes("CommunitySectionKey.Recommended"), true);
assert.equal(communityIndex.includes("mediaAssets"), true);
assert.equal(communityIndex.includes("resolveCommunityPublicAssetUrl"), true);
assert.equal(communityIndex.includes("post-thumb"), true);
assert.equal(communityIndex.includes("post-row-quoted"), true);
assert.equal(communityIndex.includes("quote-media-row"), true);
assert.equal(communityIndex.includes("image-count-badge"), true);
assert.equal(communityIndex.includes("filter-actions"), true);
assert.equal(communityIndex.includes("community-actions"), false);
assert.equal(communityIndex.includes("message-action-btn"), true);
assert.equal(communityIndex.includes("publish-action-btn"), true);
assert.equal(communityIndex.includes("main-title"), false);
assert.equal(communityIndex.includes("隐者社区"), false);
assert.equal(communityIndex.includes("resolveProfileAvatarPathByKey"), true);
assert.equal(communityIndex.includes("post.author.avatarKey }}</text>"), false);
assert.equal(communityIndex.includes("emptyStateTitle"), true);
assert.equal(communityIndex.includes("emptyStateDesc"), true);
assert.equal(communityIndex.includes("社区暂不可用"), true);
assert.equal(communityIndex.includes("创建隐者档案"), true);
assert.equal(communityIndex.includes("暂无公开内容"), true);
assert.equal(communityIndex.includes("低风险内容会自动公开"), true);
assert.equal(communityIndex.includes("ipLocationLabel"), false);
assert.equal(communityIndex.includes("IP属地"), false);
assert.equal(communityIndex.includes("demo"), false);
assert.equal(communityIndex.includes("mock"), false);

assert.equal(postPage.includes("createCommunityPost"), true);
assert.equal(postPage.includes("getCommunityPublishEligibility"), true);
assert.equal(postPage.includes("acceptCommunityPrivacyConsent"), true);
assert.equal(postPage.includes("verifyWechatPhoneNumber"), true);
assert.equal(postPage.includes("privacyPanelVisible"), true);
assert.equal(postPage.includes("privacyConsentChecked = ref(false)"), true);
assert.equal(postPage.includes("pendingSubmitAfterGate"), true);
assert.equal(postPage.includes("CommunityPublishNextAction.AcceptPrivacy"), true);
assert.equal(postPage.includes("CommunityPublishNextAction.VerifyPhone"), true);
assert.equal(postPage.includes('open-type="getPhoneNumber"'), true);
assert.equal(postPage.includes("@getphonenumber"), true);
assert.equal(postPage.includes("submitPhoneVerification"), true);
assert.equal(postPage.includes("handleDevPhoneMock"), true);
assert.equal(postPage.includes("phone_dynamic_code_dev_mock"), true);
assert.equal(postPage.includes("import.meta.env?.DEV === true"), true);
assert.equal(postPage.includes("开发模拟验证"), true);
assert.equal(postPage.includes("隐私政策"), true);
assert.equal(postPage.includes("社区用户协议"), true);
assert.equal(postPage.includes("小程序用户隐私保护指引"), true);
assert.equal(postPage.includes("/pages/community/policy?type="), true);
assert.equal(postPage.includes("showModal"), false);
assert.equal(postPage.includes("请先主动勾选同意隐私政策和社区用户协议"), true);
assert.equal(postPage.includes("手机号验证只作为发帖门槛和后台合规状态"), true);
assert.equal(postPage.includes("未完成手机号验证，请重试"), true);
assert.equal(postPage.includes("uploadCommunityMediaAsset"), true);
assert.equal(postPage.includes("mediaAssetIds"), true);
assert.equal(postPage.includes("legacy_image_"), false);
assert.equal(postPage.includes("CommunityPostStatus.Rejected"), true);
assert.equal(postPage.includes("fileSystem.getFileInfo"), true);
assert.equal(postPage.includes("uni.getFileInfo"), false);
assert.equal(postPage.includes("低风险内容会自动公开"), true);
assert.equal(postPage.includes("提交审核"), false);
assert.equal(postPage.includes("chooseImage"), true);
assert.equal(postPage.includes("redirectTo"), true);
assert.equal(postPage.includes("canUserPostToCommunitySection"), true);
assert.equal(postPage.includes('switchTab({ url: "/pages/profile/index" })'), true);

assert.equal(detailPage.includes("getCommunityPost"), true);
assert.equal(detailPage.includes("isPostPendingAuthorOnly"), true);
assert.equal(detailPage.includes("审核中，仅自己可见"), true);
assert.equal(detailPage.includes("帖子审核中，暂不开放评论"), true);
assert.equal(detailPage.includes("createCommunityComment"), true);
assert.equal(detailPage.includes("createCommunityReply"), true);
assert.equal(detailPage.includes("getCommunityPublishEligibility"), true);
assert.equal(detailPage.includes("acceptCommunityPrivacyConsent"), true);
assert.equal(detailPage.includes("verifyWechatPhoneNumber"), true);
assert.equal(detailPage.includes("ensurePublishReady"), true);
assert.equal(detailPage.includes("resumePendingPublish"), true);
assert.equal(detailPage.includes("pendingPublishAction"), true);
assert.equal(detailPage.includes("CommunityPrivacyConsentScene.CommunityComment"), true);
assert.equal(detailPage.includes("CommunityPrivacyConsentScene.CommunityReply"), true);
assert.equal(detailPage.includes('open-type="getPhoneNumber"'), true);
assert.equal(detailPage.includes("@getphonenumber"), true);
assert.equal(detailPage.includes("submitPhoneVerification"), true);
assert.equal(detailPage.includes("handleDevPhoneMock"), true);
assert.equal(detailPage.includes("phone_dynamic_code_dev_mock"), true);
assert.equal(detailPage.includes("import.meta.env?.DEV === true"), true);
assert.equal(detailPage.includes("开发模拟验证"), true);
assert.equal(detailPage.includes("/pages/community/policy?type="), true);
assert.equal(detailPage.includes("setCommunityPostLike"), true);
assert.equal(detailPage.includes("setCommunityPostFavorite"), true);
assert.equal(detailPage.includes("reportCommunityPost"), true);
assert.equal(detailPage.includes("reportCommunityComment"), true);
assert.equal(detailPage.includes("reportCommunityReply"), true);
assert.equal(detailPage.includes("reportReasonOptions"), true);
assert.equal(detailPage.includes("selectedReportReason"), true);
assert.equal(detailPage.includes("reportReasonText"), true);
assert.equal(detailPage.includes("report-target-summary"), true);
assert.equal(detailPage.includes("report-link-reported"), true);
assert.equal(detailPage.includes("canSubmitReport"), true);
assert.equal(detailPage.includes("feedbackMessage.value = response.message"), true);
assert.equal(detailPage.includes('uni.showToast({ title: response.message, icon: "none" })'), true);
assert.equal(detailPage.includes("你已经举报过该内容"), true);
assert.equal(detailPage.includes("comment.replies"), true);
assert.equal(detailPage.includes("post.mediaAssets"), true);
assert.equal(detailPage.includes("displayMediaUrl"), true);
assert.equal(detailPage.includes("previewPostImage"), true);
assert.equal(detailPage.includes("uni.previewImage"), true);
assert.equal(detailPage.includes("aspectFill"), true);
assert.equal(detailPage.includes("'widthFix'"), true);
assert.equal(detailPage.includes("media-grid-single"), true);
assert.equal(detailPage.includes("resolveProfileAvatarPathByKey"), true);
assert.equal(detailPage.includes("comment-avatar"), true);
assert.equal(detailPage.includes("canOpenAuthorProfile"), true);
assert.equal(detailPage.includes("author-profile-entry-active"), true);
assert.equal(detailPage.includes("author-profile-entry-disabled"), true);
assert.equal(detailPage.includes("post.author.avatarKey }}</text>"), false);
assert.equal(detailPage.includes("post.ipLocationLabel"), true);
assert.equal(detailPage.includes("post-ip-location"), true);
assert.equal(detailPage.includes("comment.ipLocationLabel"), true);
assert.equal(detailPage.includes("reply.ipLocationLabel"), true);
assert.equal(detailPage.includes("IP属地"), true);
assert.equal(detailPage.includes("ip-location-text"), true);
assert.equal(detailPage.includes("flex-shrink: 0"), true);
assert.equal(detailPage.includes("min-width: 0"), true);
assert.equal(detailPage.includes("手机号尾号"), false);
assert.equal(detailPage.includes("已验证手机号"), false);
assert.equal(communityIndex.includes("media-strip-single"), false);
assert.equal(communityIndex.includes("strip-image-frame"), false);
assert.equal(communityIndex.includes("'widthFix'"), false);
assert.equal(detailPage.includes("monthlyAmount"), false);
assert.equal(detailPage.includes("workStartTime"), false);
assert.equal(myPostsPage.includes("我的论坛"), true);
assert.equal(myPostsPage.includes("/pages/community/my-posts-pending"), true);
assert.equal(myPostsPage.includes("/pages/community/my-posts-reviewed"), true);
assert.equal(myPostsPage.includes("/pages/community/my-comments"), true);
assert.equal(myPostsPage.includes("/pages/community/my-replies"), true);
assert.equal(myPostsPage.includes("/pages/community/my-favorites"), true);
assert.equal(myPostsPage.includes("activeTab"), false);
assert.equal(myPendingPostsPage.includes("审核中帖子"), true);
assert.equal(myPendingPostsPage.includes("listMyCommunityPosts"), true);
assert.equal(myReviewedPostsPage.includes("已审核帖子"), true);
assert.equal(myReviewedPostsPage.includes("listMyCommunityPosts"), true);
assert.equal(myCommentsPage.includes("我的评论"), true);
assert.equal(myCommentsPage.includes("listMyCommunityPosts"), true);
assert.equal(myRepliesPage.includes("我的回复"), true);
assert.equal(myRepliesPage.includes("listMyCommunityPosts"), true);
assert.equal(myFavoritesPage.includes("收藏帖子"), true);
assert.equal(myFavoritesPage.includes("listMyCommunityPosts"), true);
assert.equal(messagesPage.includes("listCommunityMessages"), true);
assert.equal(messagesPage.includes("markCommunityMessageRead"), true);
assert.equal(messagesPage.includes("openPost"), true);
assert.equal(messagesPage.includes("isCommunityIdentityError"), true);
assert.equal(messagesPage.includes("identityActionVisible"), true);

assert.equal(policyPage.includes("隐私政策"), true);
assert.equal(policyPage.includes("社区用户协议"), true);
assert.equal(policyPage.includes("小程序用户隐私保护指引"), true);
assert.equal(policyPage.includes("手机号验证"), true);
assert.equal(policyPage.includes("IP 属地"), true);
assert.equal(policyPage.includes("内容安全"), true);
assert.equal(policyPage.includes("举报治理"), true);
assert.equal(policyPage.includes("后台"), true);
assert.equal(policyPage.includes("完整手机号"), true);
assert.equal(policyPage.includes("明文 IP"), true);

assert.equal(pagesJson.includes("pages/community/post"), true);
assert.equal(pagesJson.includes("pages/community/detail"), true);
assert.equal(pagesJson.includes("pages/community/my-posts"), true);
assert.equal(pagesJson.includes("pages/community/my-posts-pending"), true);
assert.equal(pagesJson.includes("pages/community/my-posts-reviewed"), true);
assert.equal(pagesJson.includes("pages/community/my-comments"), true);
assert.equal(pagesJson.includes("pages/community/my-replies"), true);
assert.equal(pagesJson.includes("pages/community/my-favorites"), true);
assert.equal(pagesJson.includes("pages/community/messages"), true);
assert.equal(pagesJson.includes("pages/community/policy"), true);
const parsedPagesJson = JSON.parse(pagesJson);
assert.deepEqual(
  parsedPagesJson.tabBar.list.map((item) => item.pagePath),
  ["pages/home/index", "pages/community/index", "pages/profile/index"]
);
assert.equal(
  parsedPagesJson.tabBar.list.some((item) => item.pagePath === "pages/comics/index"),
  false
);
assert.equal(CommunityPostStatus.Pending, "pending");
assert.equal(CommunityPostStatus.Approved, "approved");
assert.equal(CommunityReportReasonCode.Privacy, "privacy");
assert.equal(serviceSource.includes("seed"), false);
assert.equal(seedStrategy.includes("不要求生产环境自动生成演示内容"), true);
assert.equal(seedStrategy.includes("只允许用于开发、测试或演示环境"), true);
assert.equal(seedStrategy.includes("开发环境可以创建少量 `approved` 示例帖子"), true);

process.stdout.write("miniapp community-lite verification passed\n");
