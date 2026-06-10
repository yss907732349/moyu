/* global process */
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const shared = require("../packages/shared/dist/index.js");
const { UserFaction, DailyContentStatus, CommunitySectionKey, CommunityPostStatus } = shared;
const {
  DailyContentAdminController,
  DailyContentFeedController
} = require("../apps/api/dist/daily-content-feed.controller.js");
const { DailyContentFeedService } = require("../apps/api/dist/daily-content-feed.service.js");
const {
  WorldIntelAdminController,
  WorldIntelContentController
} = require("../apps/api/dist/world-intel-content.controller.js");
const { WorldIntelContentService } = require("../apps/api/dist/world-intel-content.service.js");
const { CommunityLiteService } = require("../apps/api/dist/community-lite.service.js");
const { AiContentModerationService } = require("../apps/api/dist/ai-content-moderation.service.js");

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
  getCurrentUser: (request) => ({
    userId: request.headers?.authorization === "Bearer water" ? "water-user" : "key-user"
  })
};
let moderationMockResult = "needs_manual_review";
const config = {
  get(key) {
    if (key === "ADMIN_OPERATIONS_TOKEN") return "test-admin";
    if (key === "DEEPSEEK_MODEL_NAME") return "deepseek-chat";
    if (key === "AI_CONTENT_MODERATION_MOCK_RESULT") return moderationMockResult;
    return undefined;
  }
};
const prisma = { isDatabaseConfigured: () => false };
const aiContentModerationService = new AiContentModerationService(config);
const worldIntelService = new WorldIntelContentService(
  prisma,
  userGrowthProfileService,
  aiContentModerationService
);
const service = new DailyContentFeedService(
  prisma,
  userGrowthProfileService,
  config,
  worldIntelService,
  aiContentModerationService
);
const adminOperationsService = {
  publishReviewCreated: async () => {},
  publishReviewStateChanged: async () => {},
  publishWorkbenchCountsChanged: async () => {}
};
const publicController = new DailyContentFeedController(context, service, adminOperationsService);
const adminController = new DailyContentAdminController(config, service, adminOperationsService);
const worldIntelPublicController = new WorldIntelContentController(context, worldIntelService);
const worldIntelAdminController = new WorldIntelAdminController(config, worldIntelService);

await assert.rejects(
  async () => adminController.generateDraft(undefined, {}),
  (error) => error.getStatus() === 403 && error.response.errorCode === "admin_unauthorized"
);

const draft = await adminController.generateDraft("test-admin", {
  businessDate: "2026-05-26",
  sectionKey: "daily_reflection"
});
assert.equal(draft.status, DailyContentStatus.Draft);
assert.equal(draft.sections[0].sectionKey, "daily_reflection");
assert.equal((await publicController.getSummary()).issue, null);
assert.equal((await adminController.validateIssue("test-admin", draft.id)).canPublish, true);

await assert.rejects(
  async () =>
    adminController.generateDraft("test-admin", {
      businessDate: "2026-05-26",
      sectionKey: "world_intel"
    }),
  (error) =>
    error.getStatus() === 400 && error.response.errorCode === "daily_content_world_intel_standalone"
);

const absurdDraft = await adminController.generateDraft("test-admin", {
  businessDate: "2026-05-26",
  sectionKey: "absurd_casefile"
});
const sourcedDraft = await adminController.updateIssue("test-admin", absurdDraft.id, {
  title: absurdDraft.title,
  homeSummary: absurdDraft.homeSummary,
  sections: absurdDraft.sections.map((section) => ({
    ...section,
    illustrationKey: `daily_${section.sectionKey}`,
    items: section.items.map((item, index) => ({
      ...item,
      source: {
        sourceName: "测试来源",
        sourceTitle: `${item.title} 来源`,
        sourceUrl: `https://example.com/${section.sectionKey}/${index + 1}`,
        imageUrl: `https://example.com/${section.sectionKey}/${index + 1}.jpg`,
        publicSourceText: "测试来源公开说明"
      }
    }))
  }))
});

await assert.rejects(
  async () =>
    adminController.updateIssueSection("test-admin", sourcedDraft.id, "unknown_section", {
      ...sourcedDraft.sections[0],
      sectionKey: "daily_reflection"
    }),
  (error) =>
    error.getStatus() === 400 && error.response.errorCode === "daily_content_invalid_section_key"
);
await assert.rejects(
  async () =>
    adminController.updateIssueSection("test-admin", sourcedDraft.id, "world_intel", {
      ...sourcedDraft.sections[0],
      sectionKey: "world_intel"
    }),
  (error) =>
    error.getStatus() === 400 && error.response.errorCode === "daily_content_world_intel_standalone"
);

const sectionValidation = await adminController.validateIssueSection(
  "test-admin",
  sourcedDraft.id,
  "absurd_casefile"
);
assert.equal(sectionValidation.canPublish, true);
const sectionPreview = await adminController.previewSection(
  "test-admin",
  sourcedDraft.id,
  "absurd_casefile"
);
assert.equal(sectionPreview.articles.length, 10);

await adminController.submitReview("test-admin", sourcedDraft.id);
await adminController.reviewIssue("test-admin", sourcedDraft.id, { action: "approve" });
const published = await adminController.publishIssue("test-admin", sourcedDraft.id);
assert.equal(published.status, DailyContentStatus.Published);

const summary = await publicController.getSummary();
assert.equal(summary.issue.status, DailyContentStatus.Published);
assert.equal(summary.issue.id, "daily-content-composed-current");
assert.equal(
  summary.issue.columns.find((column) => column.sectionKey === "world_intel").route,
  "/pages/world-intel/list"
);
assert.equal("aiDraftMetadata" in summary.issue, false);

await assert.rejects(
  async () => publicController.listArticles({ headers: {} }, published.id, "world_intel"),
  (error) =>
    error.getStatus() === 400 && error.response.errorCode === "daily_content_world_intel_standalone"
);

const list = await publicController.listArticles({ headers: {} }, published.id, "absurd_casefile");
assert.equal(list.articles.length, 10);
const item = list.articles[0];
const articleDetail = await publicController.getArticle({ headers: {} }, item.id);
assert.equal(articleDetail.article.body.length > 0, true);
assert.equal(articleDetail.article.source.imageUrl.endsWith(".jpg"), true);

const worldBatch = await worldIntelAdminController.batchCreateArticles("test-admin", {
  publishNow: true,
  articles: Array.from({ length: 12 }, (_, index) => ({
    title: `大陆新闻 ${index + 1}`,
    summary: `大陆新闻摘要 ${index + 1}`,
    body: `大陆新闻正文 ${index + 1}`,
    source: { sourceType: "original", publicSourceText: "摸鱼隐者原创" },
    allowLike: true,
    allowCommunityQuote: true
  }))
});
assert.equal(worldBatch.articles.length, 12);
assert.equal((await worldIntelPublicController.listArticles("1", "10")).articles.length, 10);
assert.equal((await worldIntelPublicController.listArticles("2", "10")).articles.length, 2);
await worldIntelAdminController.updateArticle("test-admin", worldBatch.articles[0].id, {
  ...worldBatch.articles[0],
  title: "大陆新闻已编辑"
});
assert.equal(
  (await worldIntelPublicController.getArticle({ headers: {} }, worldBatch.articles[0].id)).article
    .title,
  "大陆新闻已编辑"
);
await worldIntelAdminController.offlineArticle("test-admin", worldBatch.articles[0].id);
await assert.rejects(
  async () => worldIntelPublicController.getArticle({ headers: {} }, worldBatch.articles[0].id),
  (error) => error.getStatus() === 404
);

const liked = await publicController.likeItem({ headers: {} }, item.id);
assert.equal(liked.likeCount, 1);
await publicController.unlikeItem({ headers: {} }, item.id);

const quote = await publicController.createQuote({ headers: {} }, published.id, item.id);
const composedQuote = await publicController.createQuote(
  { headers: {} },
  "daily-content-composed-current",
  item.id
);
assert.equal(composedQuote.issueId, "daily-content-composed-current");
assert.equal(composedQuote.itemId, item.id);
const comment = await publicController.createArticleComment(
  { headers: {} },
  item.id,
  "这条日报适合带薪参悟。"
);
assert.equal(comment.status, "pending");
const authorPendingDailyComment = await publicController.getArticle({ headers: {} }, item.id);
assert.equal(authorPendingDailyComment.comments.length, 1);
assert.equal(authorPendingDailyComment.comments[0].visibleToAuthorOnly, true);
const otherPendingDailyComment = await publicController.getArticle(
  { headers: { authorization: "Bearer water" } },
  item.id
);
assert.equal(otherPendingDailyComment.comments.length, 0);
await adminController.reviewArticleComment("test-admin", comment.commentId, {
  action: "approve",
  reviewNote: "人工审核通过"
});
const approvedDailyComment = await publicController.getArticle(
  { headers: { authorization: "Bearer water" } },
  item.id
);
assert.equal(approvedDailyComment.comments.length, 1);
assert.equal(approvedDailyComment.comments[0].visibleToAuthorOnly, undefined);

moderationMockResult = "approved";
assert.equal(
  (await publicController.createArticleComment({ headers: {} }, item.id, "这条日报适合直接公开。"))
    .status,
  "approved"
);
moderationMockResult = "rejected";
assert.equal(
  (
    await publicController.createArticleComment(
      { headers: {} },
      item.id,
      "这条日报评论应该被 mock AI 拒绝。"
    )
  ).status,
  "rejected"
);

moderationMockResult = "needs_manual_review";
const worldCommentArticleId = worldBatch.articles[1].id;
const pendingWorldComment = await worldIntelPublicController.createComment(
  { headers: {} },
  worldCommentArticleId,
  "这条大陆新闻评论等待内容安全确认。"
);
assert.equal(pendingWorldComment.status, "pending");
const authorPendingWorldComment = await worldIntelPublicController.getArticle(
  { headers: {} },
  worldCommentArticleId
);
assert.equal(authorPendingWorldComment.comments.length, 1);
assert.equal(authorPendingWorldComment.comments[0].visibleToAuthorOnly, true);
const otherPendingWorldComment = await worldIntelPublicController.getArticle(
  { headers: { authorization: "Bearer water" } },
  worldCommentArticleId
);
assert.equal(otherPendingWorldComment.comments.length, 0);

moderationMockResult = "approved";
const approvedWorldComment = await worldIntelPublicController.createComment(
  { headers: {} },
  worldCommentArticleId,
  "这条大陆新闻评论可以公开。"
);
assert.equal(approvedWorldComment.status, "approved");
const otherApprovedWorldComment = await worldIntelPublicController.getArticle(
  { headers: { authorization: "Bearer water" } },
  worldCommentArticleId
);
assert.equal(otherApprovedWorldComment.comments.length, 1);

moderationMockResult = "rejected";
const rejectedWorldComment = await worldIntelPublicController.createComment(
  { headers: {} },
  worldCommentArticleId,
  "这条大陆新闻评论应该被 mock AI 拒绝。"
);
assert.equal(rejectedWorldComment.status, "rejected");

moderationMockResult = "needs_manual_review";
const community = new CommunityLiteService(
  prisma,
  userGrowthProfileService,
  service,
  aiContentModerationService
);
const createdPost = await community.createPost("key-user", {
  title: "引用日报聊一聊",
  body: "这条日报让我想到一个办公室隐者生存技巧。",
  sectionKey: CommunitySectionKey.KeyShadow,
  dailyContentQuote: quote
});
assert.equal(createdPost.status, CommunityPostStatus.Pending);
assert.equal((await community.listPendingPosts())[0].dailyContentQuote.title, quote.title);

process.stdout.write("daily-content-feed api verification passed\n");
