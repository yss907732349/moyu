/* global process */
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const shared = require("../packages/shared/dist/index.js");

const {
  DAILY_CHECKIN_REWARD,
  UserFaction,
  UserProfessionType,
  applyDailyCheckinReward,
  applyExperience,
  createDefaultUserGrowthProfile,
  createUserGrowthProfileSnapshot,
  getDefaultBadgeKeyForFaction,
  getFactionArtworkKeyForFaction,
  getFactionForProfession,
  getProfileRecommendation,
  isPreviousBusinessDate
} = shared;

assert.equal(getFactionForProfession(UserProfessionType.Engineering), UserFaction.KeyShadow);
assert.equal(
  getFactionForProfession(UserProfessionType.CreativeOperations),
  UserFaction.WaterEscape
);
assert.equal(getFactionForProfession(UserProfessionType.ProductStrategy), UserFaction.SkyStrategy);
assert.equal(getFactionForProfession(UserProfessionType.BusinessSupport), UserFaction.Wanderer);

const profile = createDefaultUserGrowthProfile({
  userId: "user-a",
  professionType: UserProfessionType.Engineering,
  now: "2026-05-25T00:00:00.000Z"
});

assert.equal(profile.faction, UserFaction.KeyShadow);
assert.match(profile.displayName, /^键影隐者\d{4}$/);
assert.equal(profile.avatarKey, "avatar_key_shadow_default");
assert.equal(profile.equippedBadgeKeys[0], "badge_key_shadow_default");
assert.equal(getDefaultBadgeKeyForFaction(UserFaction.WaterEscape), "badge_water_escape_default");
assert.equal(getFactionArtworkKeyForFaction(UserFaction.SkyStrategy), "scene_sky_strategy_default");
assert.equal(profile.level, 1);
assert.equal(profile.hiddenCoins, 88);
assert.equal(profile.energy, 60);

const firstProgress = applyExperience(0, 20);
assert.equal(firstProgress.level, 1);
assert.equal(firstProgress.currentLevelExperience, 20);

const upgradedProgress = applyExperience(80, 40);
assert.equal(upgradedProgress.level, 2);
assert.equal(upgradedProgress.currentLevelExperience, 20);

const rewarded = applyDailyCheckinReward(profile, DAILY_CHECKIN_REWARD);
assert.equal(rewarded.totalExperience, 20);
assert.equal(rewarded.hiddenCoins, 106);
assert.equal(rewarded.energy, 70);

const snapshot = createUserGrowthProfileSnapshot(rewarded);
assert.equal(snapshot.profileCreated, undefined);
assert.equal(snapshot.factionLabel, "键影隐者");
assert.equal(snapshot.professionLabel, "数字与技术");
assert.equal(snapshot.currentBadgeKey, "badge_key_shadow_default");
assert.equal(snapshot.factionArtworkKey, "scene_key_shadow_default");
assert.equal(snapshot.jobTitle, "");
assert.equal(snapshot.recommendation.recommendedFaction, UserFaction.KeyShadow);
assert.equal(snapshot.recommendation.isCurrentFactionRecommended, true);
assert.equal(snapshot.levelProgress.hiddenCoins, 106);
assert.equal(snapshot.totalCheckinCount, rewarded.checkinStreak);
assert.equal(
  createUserGrowthProfileSnapshot(rewarded, { totalCheckinCount: 7 }).totalCheckinCount,
  7
);
assert.equal(
  getProfileRecommendation({
    professionType: UserProfessionType.BusinessSupport,
    faction: UserFaction.KeyShadow
  }).recommendedFaction,
  UserFaction.Wanderer
);
assert.equal(isPreviousBusinessDate("2026-05-24", "2026-05-25"), true);
assert.equal(isPreviousBusinessDate("2026-05-23", "2026-05-25"), false);

process.stdout.write("user-growth-profile verification passed\n");
