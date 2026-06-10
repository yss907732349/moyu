/* global process */
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const shared = require("../packages/shared/dist/index.js");
const { AppAuthService } = require("../apps/api/dist/app-auth.service.js");
const { AuthController } = require("../apps/api/dist/auth.controller.js");
const {
  UserGrowthProfileController
} = require("../apps/api/dist/user-growth-profile.controller.js");
const { UserGrowthProfileService } = require("../apps/api/dist/user-growth-profile.service.js");
const { WechatLoginError } = require("../apps/api/dist/wechat-login.client.js");

const { UserFaction, UserProfessionType } = shared;

const prisma = {
  isDatabaseConfigured() {
    return false;
  }
};

const config = {
  get(key) {
    const values = {
      APP_AUTH_TOKEN_SECRET: "test-secret",
      APP_AUTH_TOKEN_TTL_SECONDS: "3600",
      ALLOW_TEMP_CURRENT_USER_FALLBACK: "false",
      NODE_ENV: "test"
    };
    return values[key];
  }
};

const appAuth = new AppAuthService(config);
const profileService = new UserGrowthProfileService(prisma);
const wechatClient = {
  async codeToSession(code) {
    if (code === "bad-code") {
      throw new WechatLoginError("invalid code");
    }

    return { openid: `openid-${code}`, unionid: `unionid-${code}` };
  }
};
const authController = new AuthController(appAuth, wechatClient, profileService);

const firstLogin = await authController.wechatLogin({ code: "abc" });
assert.equal(firstLogin.isNewUser, true);
assert.equal(appAuth.verify(firstLogin.token).userId, firstLogin.userId);

const secondLogin = await authController.wechatLogin({ code: "abc" });
assert.equal(secondLogin.isNewUser, false);
assert.equal(secondLogin.userId, firstLogin.userId);

await assert.rejects(
  () => authController.wechatLogin({ code: "bad-code" }),
  (error) => typeof error?.getStatus === "function" && error.getStatus() === 400
);

const currentUserContext = {
  getCurrentUser(request) {
    return appAuth.assert(request?.headers?.authorization?.slice("Bearer ".length));
  }
};
const profileController = new UserGrowthProfileController(currentUserContext, profileService);
const request = { headers: { authorization: `Bearer ${firstLogin.token}` } };

const emptyProfile = await profileController.getProfile(request);
assert.equal(emptyProfile.profileCreated, false);
assert.equal(emptyProfile.profile, null);

const created = await profileController.createProfile(request, {
  professionType: UserProfessionType.Engineering
});
assert.equal(created.alreadyCreated, false);
assert.equal(created.profile.faction, UserFaction.KeyShadow);
assert.equal(created.profile.totalCheckinCount, 0);

const duplicate = await profileController.createProfile(request, {
  professionType: UserProfessionType.BusinessSupport
});
assert.equal(duplicate.alreadyCreated, true);
assert.equal(duplicate.profile.faction, UserFaction.KeyShadow);

const firstCheckin = await profileController.dailyCheckin(request);
assert.equal(firstCheckin.alreadyCheckedIn, false);
assert.equal(firstCheckin.profile.checkinStreak, 1);
assert.equal(firstCheckin.profile.totalCheckinCount, 1);

const repeatedCheckin = await profileController.dailyCheckin(request);
assert.equal(repeatedCheckin.alreadyCheckedIn, true);
assert.equal(repeatedCheckin.reward.experience, 0);
assert.equal(repeatedCheckin.profile.checkinStreak, 1);
assert.equal(repeatedCheckin.profile.totalCheckinCount, 1);

const updatedName = await profileController.updateProfile(request, {
  displayName: "键影打工人",
  jobTitle: "前端开发",
  professionType: UserProfessionType.BusinessSupport
});
assert.equal(updatedName.profile.displayName, "键影打工人");
assert.equal(updatedName.profile.jobTitle, "前端开发");
assert.equal(updatedName.profile.faction, UserFaction.KeyShadow);
assert.equal(updatedName.profile.recommendation.recommendedFaction, UserFaction.Wanderer);
assert.equal(updatedName.profile.recommendation.isCurrentFactionRecommended, false);

const switchedFaction = await profileController.updateProfile(request, {
  faction: UserFaction.Wanderer
});
assert.equal(switchedFaction.profile.faction, UserFaction.Wanderer);
assert.equal(switchedFaction.profile.avatarKey, "avatar_wanderer_default");
assert.equal(switchedFaction.profile.currentBadgeKey, "badge_wanderer_default");
assert.equal(switchedFaction.profile.recommendation.isCurrentFactionRecommended, true);

await assert.rejects(
  () => profileController.updateProfile(request, { displayName: "！！！" }),
  (error) => typeof error?.getStatus === "function" && error.getStatus() === 400
);

process.stdout.write("user-growth-profile api verification passed\n");
