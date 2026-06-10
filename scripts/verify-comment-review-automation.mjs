/* global process */
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const shared = require("../packages/shared/dist/index.js");
const {
  CommentReviewDecision,
  CommunityCommentStatus,
  CommunityPostStatus,
  CommunitySectionKey,
  CommunityUserGovernanceStatus,
  UserFaction
} = shared;
const { CommunityLiteService } = require("../apps/api/dist/community-lite.service.js");
const {
  LowCostContentModerationService
} = require("../apps/api/dist/low-cost-content-moderation.service.js");

const profileTemplate = {
  displayName: "键影隐者",
  avatarKey: "avatar_key_shadow_default",
  faction: UserFaction.KeyShadow,
  factionLabel: "键影隐者",
  level: 1,
  titleKey: "newcomer_hidden_one",
  equippedBadgeKeys: ["first_profile"]
};
const profiles = new Map(
  ["trusted-user", "new-user", "limited-user"].map((userId) => [
    userId,
    { ...profileTemplate, userId, displayName: `${profileTemplate.displayName}-${userId}` }
  ])
);
const userGrowthProfileService = {
  async getProfile(userId) {
    const profile = profiles.get(userId);
    return { profileCreated: Boolean(profile), profile: profile ?? null };
  }
};
const service = new CommunityLiteService(
  { isDatabaseConfigured: () => false },
  userGrowthProfileService,
  undefined,
  undefined,
  new LowCostContentModerationService()
);

const post = await service.createPost("trusted-user", {
  title: "低风险评论自动分流",
  body: "这里用于验证评论和回复审核减负，帖子本身仍需要人工审核通过。",
  sectionKey: CommunitySectionKey.KeyShadow
});
assert.equal(post.status, CommunityPostStatus.Pending, "低风险帖子仍应保持 pending");
await service.reviewPost(post.postId, "approve", "验证准备");

const helloComment = await service.createComment("new-user", post.postId, {
  body: "你好"
});
assert.equal(helloComment.status, CommunityCommentStatus.Approved);
assert.equal(helloComment.reviewDecision, CommentReviewDecision.AutoApprove);

const hiComment = await service.createComment("new-user", post.postId, {
  body: "hi"
});
assert.equal(hiComment.status, CommunityCommentStatus.Approved);
assert.equal(hiComment.reviewDecision, CommentReviewDecision.AutoApprove);
assert.equal((await service.getPost(post.postId, "trusted-user")).comments.length, 2);

const autoApprovedReply = await service.createReply("new-user", helloComment.commentId, {
  body: "补一条低风险短回复。"
});
assert.equal(autoApprovedReply.status, CommunityCommentStatus.Approved);
assert.equal(autoApprovedReply.reviewDecision, CommentReviewDecision.AutoApprove);
const helloCommentView = (await service.getPost(post.postId, "trusted-user")).comments.find(
  (comment) => comment.id === helloComment.commentId
);
assert.equal(helloCommentView?.replies.length, 1);

const autoRejected = await service.createComment("new-user", post.postId, {
  body: "你这个傻逼，去死吧"
});
assert.equal(autoRejected.status, CommunityCommentStatus.Rejected);
assert.equal(autoRejected.reviewDecision, CommentReviewDecision.AutoReject);
assert.equal((await service.getPost(post.postId, "trusted-user")).comments.length, 2);

await service.setUserGovernance("limited-user", {
  status: CommunityUserGovernanceStatus.Limited,
  reason: "验证限制用户",
  note: "评论审核减负验证"
});
const limitedUserComment = await service.createComment("limited-user", post.postId, {
  body: "限制用户普通评论。"
});
assert.equal(limitedUserComment.status, CommunityCommentStatus.Pending);
assert.equal(limitedUserComment.reviewDecision, CommentReviewDecision.ManualReview);
assert.equal(
  (await service.getPost(post.postId, "limited-user")).comments.some(
    (comment) => comment.id === limitedUserComment.commentId && comment.visibleToAuthorOnly === true
  ),
  true,
  "limited 用户的待审评论也应仅作者自己可见"
);

const queue = await service.listPendingQueue();
assert.equal(
  queue.comments.some((comment) => comment.id === helloComment.commentId),
  false,
  "你好这类自动通过评论不应进入人工复核队列"
);
assert.equal(
  queue.comments.some((comment) => comment.id === hiComment.commentId),
  false,
  "hi 这类自动通过评论不应进入人工复核队列"
);
assert.equal(
  queue.comments.some((comment) => comment.id === autoRejected.commentId),
  false,
  "自动驳回评论不应进入人工复核队列"
);
assert.equal(
  queue.comments.some((comment) => comment.id === limitedUserComment.commentId),
  true,
  "受限用户低风险评论应进入人工复核队列"
);

process.stdout.write("comment review automation verification passed\n");
