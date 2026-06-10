import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  FeaturePlacement,
  FeatureStatus,
  UserFaction,
  UserProfessionType,
  createUserGrowthProfileSnapshot
} from "@moyuxia/shared";
import {
  getFeatureRegistryByPlacement,
  isFeatureRegistryResponse
} from "../apps/miniapp/src/services/feature-registry.ts";
import {
  getUserProfile,
  isUserProfileSnapshot,
  isUpdateUserProfileResponse,
  saveLocalUserProfileSnapshot
} from "../apps/miniapp/src/services/user-growth-profile.ts";
import {
  resolveProfileHeroArtworkPath,
  resolveProfileArtworkPath,
  resolveProfileArtworkPathByKey,
  resolveProfileAvatarPath,
  resolveProfileAvatarPathByKey,
  resolveProfileBadgePath
} from "../apps/miniapp/src/services/profile-assets.ts";

const storage = new Map<string, unknown>();

globalThis.uni = {
  getStorageSync(key: string) {
    return storage.get(key);
  },
  setStorageSync(key: string, value: unknown) {
    storage.set(key, value);
  },
  removeStorageSync(key: string) {
    storage.delete(key);
  },
  request(options: UniApp.RequestOptions) {
    options.fail?.({ errMsg: "network unavailable" });
  }
} as typeof uni;

storage.set("moyuxia.authToken", "token-a");

const snapshot = createUserGrowthProfileSnapshot({
  userId: "user-a",
  professionType: UserProfessionType.Engineering,
  faction: UserFaction.KeyShadow,
  jobTitle: "",
  displayName: "键影隐者1001",
  publicProfileId: "pp_KEYPROFILE000001",
  avatarKey: "avatar_key_shadow_default",
  level: 1,
  totalExperience: 0,
  hiddenCoins: 88,
  energy: 60,
  checkinStreak: 0,
  titleKey: "newcomer_hidden_one",
  equippedBadgeKeys: ["badge_key_shadow_default"],
  createdAt: "2026-05-25T00:00:00.000Z",
  updatedAt: "2026-05-25T00:00:00.000Z"
});

assert.equal(isUserProfileSnapshot(snapshot), true);
assert.equal(snapshot.totalCheckinCount, 0);
assert.equal(snapshot.currentBadgeKey, "badge_key_shadow_default");
assert.equal(snapshot.factionArtworkKey, "scene_key_shadow_default");
assert.equal(
  resolveProfileAvatarPath(UserFaction.KeyShadow),
  "/static/profile/factions/key_shadow/avatar.png"
);
assert.equal(
  resolveProfileBadgePath(UserFaction.Wanderer),
  "/static/profile/factions/wanderer/badge.png"
);
assert.equal(
  resolveProfileArtworkPath(UserFaction.SkyStrategy),
  "/static/profile/factions/sky_strategy/artwork.png"
);
assert.equal(
  resolveProfileAvatarPathByKey("avatar_wanderer_default", UserFaction.KeyShadow),
  "/static/profile/factions/wanderer/avatar.png"
);
assert.equal(
  resolveProfileAvatarPathByKey("avatar_key_shadow_default", UserFaction.Wanderer),
  "/static/profile/factions/key_shadow/avatar.png"
);
assert.equal(
  resolveProfileArtworkPathByKey("scene_key_shadow_default", UserFaction.Wanderer),
  "/static/profile/factions/key_shadow/artwork.png"
);
assert.equal(resolveProfileHeroArtworkPath(), "/static/profile/role-hero.png");
saveLocalUserProfileSnapshot(snapshot);

const fallbackResult = await getUserProfile();
assert.equal(fallbackResult.source, "local-cache");
assert.equal(fallbackResult.response.profile?.displayName, "键影隐者1001");
assert.equal(fallbackResult.response.profile?.publicProfileId, "pp_KEYPROFILE000001");

const profileGrid = await getFeatureRegistryByPlacement(FeaturePlacement.ProfileFeatureGrid, {
  request(options: UniApp.RequestOptions) {
    options.success?.({
      statusCode: 200,
      data: {
        placement: FeaturePlacement.ProfileFeatureGrid,
        entries: [
          {
            featureKey: "daily_checkin",
            title: "每日签到",
            icon: "px-icon-checkin",
            status: FeatureStatus.Enabled,
            placement: FeaturePlacement.ProfileFeatureGrid,
            displayOrder: 10,
            publicRoute: "/pages/profile/index"
          }
        ]
      }
    } as UniApp.RequestSuccessCallbackResult);
  }
});

assert.equal(isFeatureRegistryResponse(profileGrid, FeaturePlacement.ProfileFeatureGrid), true);
assert.equal(profileGrid.entries[0]?.featureKey, "daily_checkin");

assert.equal(
  isUpdateUserProfileResponse({
    profile: {
      ...snapshot,
      displayName: "新昵称"
    }
  }),
  true
);

const profilePageSource = readFileSync("apps/miniapp/src/pages/profile/index.vue", "utf8");
const rolePageSource = readFileSync("apps/miniapp/src/pages/profile/role.vue", "utf8");
assert.equal(profilePageSource.includes("chooseImage"), false);
assert.equal(profilePageSource.includes("avatar-upload-badge"), false);
assert.equal(profilePageSource.includes("我的成就"), false);
assert.equal(profilePageSource.includes("features-card"), false);
assert.equal(profilePageSource.includes("feat-item"), false);
assert.equal(profilePageSource.includes("称号收藏"), false);
assert.equal(profilePageSource.includes("我的评论"), false);
assert.equal(profilePageSource.includes("隐者大陆百科"), false);
assert.equal(profilePageSource.includes("工作设置"), true);
assert.equal(profilePageSource.includes("生存账本"), true);
assert.equal(profilePageSource.includes("status-card"), true);
assert.equal(profilePageSource.includes("getMyCommunityFollowStats"), true);
assert.equal(profilePageSource.includes("openMyFollowList"), true);
assert.equal(profilePageSource.includes("/pages/community/follow-list"), true);
assert.equal(profilePageSource.includes("followingCount"), true);
assert.equal(profilePageSource.includes("followerCount"), true);
assert.equal(profilePageSource.includes("关注"), true);
assert.equal(profilePageSource.includes("粉丝"), true);
assert.equal(profilePageSource.includes("总签到次数"), true);
assert.equal(profilePageSource.includes("连续签到"), false);
assert.equal(profilePageSource.includes("compactMetricCount"), true);
assert.equal(profilePageSource.includes("resource-enter"), true);
assert.equal(profilePageSource.includes("resource-item-link"), true);
assert.equal(profilePageSource.includes("hiddenCoins"), false);
assert.equal(profilePageSource.includes("energy"), false);
assert.equal(profilePageSource.includes("flex: 1 1 0"), true);
assert.equal(profilePageSource.includes("text-overflow: ellipsis"), true);
assert.equal(profilePageSource.includes("getLocalUserProfileSnapshot"), true);
assert.equal(profilePageSource.includes("resolveProfileAvatarPathByKey"), true);
assert.equal(profilePageSource.includes("resolveProfileArtworkPathByKey"), true);
assert.equal(profilePageSource.includes("/pages/profile/role"), true);
assert.equal(rolePageSource.includes("updateUserProfile"), true);
assert.equal(rolePageSource.includes("resolveProfileAvatarPathByKey"), true);
assert.equal(rolePageSource.includes("保存角色资料"), true);

const homeSource = readFileSync("apps/miniapp/src/pages/home/index.vue", "utf8");
const firstRunSource = readFileSync("apps/miniapp/src/services/first-run-flow.ts", "utf8");
assert.equal(homeSource.includes("键影隐者 · 一阶"), false);
assert.equal(homeSource.includes("headerIdentity"), true);
assert.equal(homeSource.includes("resolveMiniappFirstRunState"), true);
assert.equal(profilePageSource.includes("我的成就"), false);
assert.equal(profilePageSource.includes("下一步配置薪资和上班时间"), true);
assert.equal(profilePageSource.includes("配置工作档案"), true);
assert.equal(profilePageSource.includes("syncWorkProfileCtaVisibility"), true);
assert.equal(profilePageSource.includes("getLocalWorkProfileSnapshot"), true);
assert.equal(profilePageSource.includes("getWorkProfile"), true);
assert.equal(firstRunSource.includes('createFirstRunResult("logged_out")'), true);
assert.equal(firstRunSource.includes('"profile_missing"'), true);
assert.equal(firstRunSource.includes('"work_profile_missing"'), true);
assert.equal(firstRunSource.includes('"ready"'), true);
assert.equal(firstRunSource.includes("getAppAuthToken"), true);
assert.equal(firstRunSource.includes("getLocalUserProfileSnapshot"), true);
assert.equal(firstRunSource.includes("getLocalWorkProfileSnapshot"), true);
assert.equal(firstRunSource.includes("已使用本地快照"), true);

process.stdout.write("miniapp user-growth-profile verification passed\n");
