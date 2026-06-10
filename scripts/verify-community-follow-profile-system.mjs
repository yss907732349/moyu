/* global process, setTimeout */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const shared = require("../packages/shared/dist/index.js");
const { CommunityLiteController } = require("../apps/api/dist/community-lite.controller.js");
const { CommunityLiteService } = require("../apps/api/dist/community-lite.service.js");

const {
  COMMUNITY_PUBLIC_RESPONSE_SENSITIVE_FIELD_BLACKLIST,
  CommunityFollowState,
  CommunityLiteErrorCode,
  CommunitySectionKey,
  UserFaction,
  assertPublicCommunityAuthorSnapshot,
  createCommunityAuthorSnapshot
} = shared;

assert.equal(CommunityFollowState.Self, "self");
assert.equal(CommunityFollowState.Following, "following");
assert.equal(CommunityFollowState.NotFollowing, "not_following");
for (const field of [
  "phoneNumber",
  "phoneTail",
  "phoneVerified",
  "rawIp",
  "city",
  "street",
  "ipSourceHeader",
  "xForwardedFor",
  "openid",
  "unionid",
  "sessionKey",
  "monthlyAmount",
  "workProfile",
  "hiddenCoins",
  "energy",
  "sourceProvider",
  "governanceStatus",
  "contentSecuritySummary",
  "providerRawResponse",
  "rawModerationResponse"
]) {
  assert.equal(
    COMMUNITY_PUBLIC_RESPONSE_SENSITIVE_FIELD_BLACKLIST.includes(field),
    true,
    `敏感字段黑名单缺少 ${field}`
  );
}

const author = createCommunityAuthorSnapshot({
  displayName: "键影隐者1001",
  avatarKey: "avatar_key_shadow_default",
  faction: UserFaction.KeyShadow,
  level: 1,
  titleKey: "newcomer_hidden_one",
  equippedBadgeKeys: ["badge_key_shadow_default"],
  publicProfileId: "pp_KEYPROFILE000001"
});
assert.equal(author.publicProfileId, "pp_KEYPROFILE000001");
assertPublicCommunityAuthorSnapshot(author);
assert.throws(
  () => assertPublicCommunityAuthorSnapshot({ ...author, hiddenCoins: 88 }),
  shared.CommunityLiteValidationError
);

const profiles = new Map([
  [
    "key-user",
    {
      userId: "key-user",
      publicProfileId: "pp_KEYPROFILE000001",
      displayName: "键影隐者1001",
      avatarKey: "avatar_key_shadow_default",
      faction: UserFaction.KeyShadow,
      factionLabel: "键影隐者",
      level: 1,
      titleKey: "newcomer_hidden_one",
      titleLabel: "一阶隐者",
      equippedBadgeKeys: ["badge_key_shadow_default"],
      currentBadgeKey: "badge_key_shadow_default",
      jobTitle: "",
      totalExperience: 0,
      hiddenCoins: 88,
      energy: 60,
      checkinStreak: 0,
      levelProgress: {},
      updatedAt: "2026-06-08T00:00:00.000Z"
    }
  ],
  [
    "water-user",
    {
      userId: "water-user",
      publicProfileId: "pp_WATERPROFILE0001",
      displayName: "运影隐者1002",
      avatarKey: "avatar_water_escape_default",
      faction: UserFaction.WaterEscape,
      factionLabel: "运影隐者",
      level: 2,
      titleKey: "newcomer_hidden_one",
      titleLabel: "一阶隐者",
      equippedBadgeKeys: ["badge_water_escape_default"],
      currentBadgeKey: "badge_water_escape_default",
      jobTitle: "",
      totalExperience: 120,
      hiddenCoins: 99,
      energy: 80,
      checkinStreak: 3,
      levelProgress: {},
      updatedAt: "2026-06-08T00:00:00.000Z"
    }
  ],
  [
    "sky-user",
    {
      userId: "sky-user",
      publicProfileId: "pp_SKYPROFILE000001",
      displayName: "策影隐者1003",
      avatarKey: "avatar_sky_strategy_default",
      faction: UserFaction.SkyStrategy,
      factionLabel: "策影隐者",
      level: 3,
      titleKey: "newcomer_hidden_one",
      titleLabel: "一阶隐者",
      equippedBadgeKeys: ["badge_sky_strategy_default"],
      currentBadgeKey: "badge_sky_strategy_default",
      jobTitle: "",
      totalExperience: 240,
      hiddenCoins: 120,
      energy: 90,
      checkinStreak: 6,
      levelProgress: {},
      updatedAt: "2026-06-08T00:00:00.000Z"
    }
  ]
]);

const userGrowthProfileService = {
  async getProfile(userId) {
    const profile = profiles.get(userId);
    return { profileCreated: Boolean(profile), profile: profile ?? null };
  },
  async getOrCreatePublicProfileId(userId) {
    return profiles.get(userId)?.publicProfileId ?? null;
  },
  async findProfileByPublicProfileId(publicProfileId) {
    return (
      [...profiles.values()].find((profile) => profile.publicProfileId === publicProfileId) ?? null
    );
  }
};

const context = {
  getCurrentUser(request) {
    return { userId: request.headers.authorization === "Bearer water" ? "water-user" : "key-user" };
  }
};
const adminOperationsService = {
  publishReviewCreated: async () => {},
  publishReviewStateChanged: async () => {},
  publishWorkbenchCountsChanged: async () => {}
};
const prisma = { isDatabaseConfigured: () => false };
const service = new CommunityLiteService(prisma, userGrowthProfileService);
const controller = new CommunityLiteController(context, service, adminOperationsService, {
  get() {
    return undefined;
  }
});
const keyRequest = { headers: { authorization: "Bearer key" } };
const waterRequest = { headers: { authorization: "Bearer water" } };

const created = await controller.createPost(keyRequest, {
  title: "公开主页里的合规帖子",
  body: "这是一条用于验证公开主页帖子过滤的内容，不含敏感字段。",
  sectionKey: CommunitySectionKey.KeyShadow
});
await service.reviewPost(created.postId, "approve", "验证通过");

const rejected = await controller.createPost(keyRequest, {
  title: "不应进入公开主页的帖子",
  body: "这条帖子会被驳回，不应出现在公开个人页。",
  sectionKey: CommunitySectionKey.KeyShadow
});
await service.reviewPost(rejected.postId, "reject", "验证过滤");

const detail = await controller.getPost(waterRequest, created.postId);
assert.equal(detail.post.author.publicProfileId, "pp_KEYPROFILE000001");
assertNoSensitiveFields(detail.post.author);

const profilePage = await controller.getPublicProfilePage(waterRequest, "pp_KEYPROFILE000001", {
  limit: 10
});
assert.equal(profilePage.profile.identity.displayName, "键影隐者1001");
assert.equal(profilePage.profile.stats.publicPostCount, 1);
assert.equal(profilePage.profile.posts.length, 1);
assert.equal(profilePage.profile.posts[0].id, created.postId);
assert.equal(profilePage.profile.viewerFollowState, CommunityFollowState.NotFollowing);
assertNoSensitiveFields(profilePage);

const selfProfilePage = await controller.getPublicProfilePage(keyRequest, "pp_KEYPROFILE000001", {
  limit: 10
});
assert.equal(selfProfilePage.profile.viewerFollowState, CommunityFollowState.Self);
assertNoSensitiveFields(selfProfilePage);

const follow = await controller.followPublicProfile(waterRequest, "pp_KEYPROFILE000001");
assert.equal(follow.viewerFollowState, CommunityFollowState.Following);
assert.equal(follow.stats.followerCount, 1);
const followAgain = await controller.followPublicProfile(waterRequest, "pp_KEYPROFILE000001");
assert.equal(followAgain.stats.followerCount, 1);
await wait(2);
const followSky = await controller.followPublicProfile(waterRequest, "pp_SKYPROFILE000001");
assert.equal(followSky.viewerFollowState, CommunityFollowState.Following);

await assert.rejects(
  () => controller.followPublicProfile(keyRequest, "pp_KEYPROFILE000001"),
  (error) =>
    error.getStatus() === 400 &&
    error.response.errorCode === CommunityLiteErrorCode.SelfFollowNotAllowed
);

const followingList = await controller.listFollowing(waterRequest, "pp_WATERPROFILE0001", {
  limit: 10
});
assert.equal(followingList.items.length, 2);
assert.deepEqual(
  new Set(followingList.items.map((item) => item.publicProfileId)),
  new Set(["pp_KEYPROFILE000001", "pp_SKYPROFILE000001"])
);
assertNoSensitiveFields(followingList);

const followingFirstPage = await controller.listFollowing(waterRequest, "pp_WATERPROFILE0001", {
  limit: 1
});
assert.equal(followingFirstPage.items.length, 1);
assert.equal(typeof followingFirstPage.nextCursor, "string");
const followingSecondPage = await controller.listFollowing(waterRequest, "pp_WATERPROFILE0001", {
  cursor: followingFirstPage.nextCursor,
  limit: 1
});
assert.equal(followingSecondPage.items.length, 1);
assert.notEqual(
  followingFirstPage.items[0].publicProfileId,
  followingSecondPage.items[0].publicProfileId
);
assertNoSensitiveFields(followingFirstPage);
assertNoSensitiveFields(followingSecondPage);

const followerList = await controller.listFollowers(waterRequest, "pp_KEYPROFILE000001", {
  limit: 10
});
assert.equal(followerList.items.length, 1);
assert.deepEqual(
  new Set(followerList.items.map((item) => item.publicProfileId)),
  new Set(["pp_WATERPROFILE0001"])
);
assertNoSensitiveFields(followerList);

const unfollow = await controller.unfollowPublicProfile(waterRequest, "pp_KEYPROFILE000001");
assert.equal(unfollow.viewerFollowState, CommunityFollowState.NotFollowing);
assert.equal(unfollow.stats.followerCount, 0);
const unfollowAgain = await controller.unfollowPublicProfile(waterRequest, "pp_KEYPROFILE000001");
assert.equal(unfollowAgain.stats.followerCount, 0);
await controller.unfollowPublicProfile(waterRequest, "pp_SKYPROFILE000001");

const emptyFollowing = await controller.listFollowing(waterRequest, "pp_WATERPROFILE0001", {
  limit: 10
});
assert.equal(emptyFollowing.items.length, 0);

const miniappService = readFileSync("apps/miniapp/src/services/community-lite.ts", "utf8");
const miniappProfilePage = readFileSync("apps/miniapp/src/pages/community/profile.vue", "utf8");
const miniappFollowListPage = readFileSync(
  "apps/miniapp/src/pages/community/follow-list.vue",
  "utf8"
);
const miniappDetailPage = readFileSync("apps/miniapp/src/pages/community/detail.vue", "utf8");
const miniappMyPage = readFileSync("apps/miniapp/src/pages/profile/index.vue", "utf8");
const pagesJson = readFileSync("apps/miniapp/src/pages.json", "utf8");

assert.equal(miniappService.includes("/community/profiles/"), true);
assert.equal(miniappService.includes("/community/dev/follow-test-profile"), false);
assert.equal(miniappService.includes("followCommunityPublicProfile"), true);
assert.equal(miniappService.includes("getDevCommunityFollowTestProfile"), false);
assert.equal(miniappService.includes("listCommunityProfileFollowers"), true);
assert.equal(miniappService.includes("/community/me/follow-stats"), true);
assert.equal(miniappService.includes("COMMUNITY_PUBLIC_RESPONSE_SENSITIVE_FIELD_BLACKLIST"), true);
assert.equal(miniappService.includes("hasPublicSensitiveFields"), true);
assert.equal(miniappProfilePage.includes("viewerFollowState"), true);
assert.equal(miniappProfilePage.includes("IP属地"), true);
assert.equal(miniappProfilePage.includes("我的角色"), true);
assert.equal(miniappProfilePage.includes("取消关注"), true);
assert.equal(miniappProfilePage.includes("uni.showModal"), true);
assert.equal(miniappProfilePage.includes("confirmUnfollow"), true);
assert.equal(miniappProfilePage.includes("normalizeFollowActionError"), true);
assert.equal(miniappProfilePage.includes("profile-skeleton"), true);
assert.equal(miniappProfilePage.includes("card-kicker"), true);
assert.equal(miniappProfilePage.includes("隐者名片"), true);
assert.equal(miniappProfilePage.includes("compactCount"), true);
assert.equal(miniappProfilePage.includes("end-hint"), true);
assert.equal(miniappProfilePage.includes("follow-button-label"), true);
assert.equal(miniappProfilePage.includes("margin-left: auto"), true);
assert.equal(miniappProfilePage.includes("测试关注对象"), false);
assert.equal(miniappProfilePage.includes("devFollowFixtureVisible"), false);
assert.equal(miniappProfilePage.includes("openFollowList('following')"), true);
assert.equal(miniappProfilePage.includes("hiddenCoins"), false);
assert.equal(miniappProfilePage.includes("energy"), false);
assert.equal(miniappProfilePage.includes("min-width: 0"), true);
assert.equal(miniappProfilePage.includes("text-overflow: ellipsis"), true);
assert.equal(miniappProfilePage.includes("grid-template-columns: repeat(3, minmax(0, 1fr))"), true);
assert.equal(miniappFollowListPage.includes("还没有关注其他隐者"), true);
assert.equal(miniappFollowListPage.includes("还没有粉丝"), true);
assert.equal(miniappFollowListPage.includes("uni.showModal"), true);
assert.equal(miniappFollowListPage.includes("confirmUnfollow"), true);
assert.equal(miniappFollowListPage.includes("normalizeFollowActionError"), true);
assert.equal(miniappFollowListPage.includes("list-skeleton"), true);
assert.equal(miniappFollowListPage.includes("emptyDesc"), true);
assert.equal(miniappFollowListPage.includes("end-hint"), true);
assert.equal(miniappFollowListPage.includes("nextCursor"), true);
assert.equal(miniappFollowListPage.includes("min-width: 0"), true);
assert.equal(miniappFollowListPage.includes("text-overflow: ellipsis"), true);
assert.equal(miniappFollowListPage.includes("width: 132rpx"), true);
assert.equal(miniappDetailPage.includes("openAuthorProfile"), true);
assert.equal(miniappDetailPage.includes("canOpenAuthorProfile"), true);
assert.equal(miniappDetailPage.includes("author-profile-entry-active"), true);
assert.equal(miniappDetailPage.includes("author-profile-entry-disabled"), true);
assert.equal(miniappDetailPage.includes("publicProfileId"), true);
assert.equal(miniappMyPage.includes("getMyCommunityFollowStats"), true);
assert.equal(miniappMyPage.includes("getDevCommunityFollowTestProfile"), false);
assert.equal(miniappMyPage.includes("devFollowFixtureVisible"), false);
assert.equal(miniappMyPage.includes("社交测试场景"), false);
assert.equal(miniappMyPage.includes("测试关注对象"), false);
assert.equal(miniappMyPage.includes("openMyFollowList"), true);
assert.equal(miniappMyPage.includes("compactMetricCount"), true);
assert.equal(miniappMyPage.includes("resource-enter"), true);
assert.equal(miniappMyPage.includes("openDevFollowTarget"), false);
assert.equal(miniappMyPage.includes("/pages/community/follow-list"), true);
assert.equal(miniappMyPage.includes("flex: 1 1 0"), true);
assert.equal(miniappMyPage.includes("text-overflow: ellipsis"), true);
assert.equal(miniappMyPage.includes("hiddenCoins"), false);
assert.equal(miniappMyPage.includes("energy"), false);
assert.equal(pagesJson.includes("pages/community/profile"), true);
assert.equal(pagesJson.includes("pages/community/follow-list"), true);

process.stdout.write("community follow profile system verification passed\n");

function assertNoSensitiveFields(value, path = "$") {
  if (!value || typeof value !== "object") {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoSensitiveFields(item, `${path}[${index}]`));
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    assert.equal(
      COMMUNITY_PUBLIC_RESPONSE_SENSITIVE_FIELD_BLACKLIST.includes(key),
      false,
      `公开响应包含敏感字段 ${path}.${key}`
    );
    assertNoSensitiveFields(child, `${path}.${key}`);
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
