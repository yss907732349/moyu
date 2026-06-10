/* global process */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const shared = require("../packages/shared/dist/index.js");
const {
  DEFAULT_MVP_FEATURE_REGISTRY,
  FEATURE_KEYS,
  FeaturePlacement,
  FeatureStatus,
  canNavigateFeatureEntry,
  getFeatureEntriesByPlacement,
  toPublicFeatureEntry
} = shared;

const pagesJson = JSON.parse(readFileSync("apps/miniapp/src/pages.json", "utf8"));
const pagePaths = pagesJson.pages.map((page) => page.path);
const requiredPages = [
  "pages/stealth-workbench/index",
  "pages/stealth-workbench/daily-list",
  "pages/stealth-workbench/daily-detail",
  "pages/stealth-workbench/forum",
  "pages/stealth-workbench/forum-detail"
];

for (const pagePath of requiredPages) {
  assert(pagePaths.includes(pagePath), `缺少摸鱼模式页面注册：${pagePath}`);
}

assert.deepEqual(
  pagesJson.tabBar.list.map((item) => item.pagePath),
  ["pages/home/index", "pages/community/index", "pages/profile/index"]
);
assert.equal(
  pagesJson.tabBar.list.some((item) => item.pagePath.startsWith("pages/stealth-workbench/")),
  false
);

const registryEntry = DEFAULT_MVP_FEATURE_REGISTRY.find(
  (entry) => entry.featureKey === FEATURE_KEYS.stealthWorkbenchMode
);
assert(registryEntry, "缺少 stealth_workbench_mode 默认功能入口");
assert.equal(registryEntry.status, FeatureStatus.Enabled);
assert.equal(registryEntry.title, "摸鱼模式");
assert.equal(registryEntry.publicRoute, "/pages/stealth-workbench/index");
assert.equal(
  registryEntry.placements.some(
    (placement) => placement.placement === FeaturePlacement.HomeQuickEntry
  ),
  true
);
assert.equal(registryEntry.publicRoute.includes("/pages/community/"), false);
assert.equal(registryEntry.publicRoute.includes("/pages/daily-content/"), false);
assert.equal(registryEntry.publicRoute.includes("/pages/profile/"), false);
assert.equal(registryEntry.publicRoute.includes("/pages/comics/"), false);
assert.equal(registryEntry.publicRoute.includes("/pages/supply-center/"), false);

const homeEntry = getFeatureEntriesByPlacement(FeaturePlacement.HomeQuickEntry).entries.find(
  (entry) => entry.featureKey === FEATURE_KEYS.stealthWorkbenchMode
);
assert(homeEntry, "首页公开入口缺少 stealth_workbench_mode");
assert.equal(homeEntry.publicRoute, "/pages/stealth-workbench/index");
assert.equal(canNavigateFeatureEntry(homeEntry), true);

for (const blockedStatus of [
  FeatureStatus.Locked,
  FeatureStatus.ComingSoon,
  FeatureStatus.Disabled
]) {
  const publicEntry = toPublicFeatureEntry(
    {
      ...registryEntry,
      status: blockedStatus,
      unlockText: "完成条件后开放",
      comingSoonText: "敬请期待",
      unavailableText: "暂不可用"
    },
    FeaturePlacement.HomeQuickEntry
  );
  assert(publicEntry, `状态 ${blockedStatus} 应返回可拦截公开入口`);
  assert.equal(publicEntry.publicRoute, undefined);
  assert.equal(canNavigateFeatureEntry(publicEntry), false);
}

const hiddenEntry = toPublicFeatureEntry(
  { ...registryEntry, status: FeatureStatus.Hidden },
  FeaturePlacement.HomeQuickEntry
);
assert.equal(hiddenEntry, null);

const homePage = readFileSync("apps/miniapp/src/pages/home/index.vue", "utf8");
assert.equal(homePage.includes("getFeatureRegistryByPlacement"), true);
assert.equal(homePage.includes("stealthWorkbenchEntry"), true);
assert.equal(homePage.includes("handleHomeFeatureEntryTap"), true);
assert.equal(homePage.includes("canNavigateFeatureEntry(entry)"), true);
assert.equal(homePage.includes("hero-stealth-entry-btn"), true);
assert.equal(homePage.includes("进入摸鱼模式"), true);
assert.equal(homePage.includes("handleOpenStealthWorkbench"), true);
assert.equal(
  homePage.includes(
    '<view :class="[\'hero-asset-mask\', isHiddenMode ? \'hero-asset-hidden\' : \'\']">\n        <image class="hero-asset-image" :src="homeHeroImage" mode="aspectFill" />\n      </view>\n      <button'
  ),
  true
);
assert.equal(homePage.includes("stealth-feature-row"), false);
assert.equal(homePage.includes("FeatureEntryCard"), false);
assert.equal(
  homePage.includes('uni.navigateTo({ url: "/pages/stealth-workbench/index" })'),
  false,
  "首页不得硬编码绕过 feature registry 直达摸鱼模式"
);

const stealthFiles = {
  index: readFileSync("apps/miniapp/src/pages/stealth-workbench/index.vue", "utf8"),
  dailyList: readFileSync("apps/miniapp/src/pages/stealth-workbench/daily-list.vue", "utf8"),
  dailyDetail: readFileSync("apps/miniapp/src/pages/stealth-workbench/daily-detail.vue", "utf8"),
  forum: readFileSync("apps/miniapp/src/pages/stealth-workbench/forum.vue", "utf8"),
  forumDetail: readFileSync("apps/miniapp/src/pages/stealth-workbench/forum-detail.vue", "utf8"),
  style: readFileSync("apps/miniapp/src/pages/stealth-workbench/stealth-table.css", "utf8")
};
const combined = Object.values(stealthFiles).join("\n");

assert.equal(combined.includes("<button"), false, "摸鱼模式不得使用原生按钮组件");
assert.equal(combined.includes("</button>"), false, "摸鱼模式不得使用原生按钮组件");

for (const expected of [
  "stealth-sheet",
  "stealth-table-head",
  "stealth-row",
  "stealth-cell-action",
  "stealth-cell-number",
  "stealth-cell-time",
  "stealth-merged-cell",
  "stealth-text-button"
]) {
  assert(combined.includes(expected), `摸鱼模式缺少表格结构：${expected}`);
}

for (const forbidden of [
  "createCommunityPost",
  "createCommunityReply",
  "reportCommunityPost",
  "reportCommunityComment",
  "reportCommunityReply",
  "uploadCommunityMediaAsset",
  "listCommunityMessages",
  "listMyCommunityPosts",
  "/pages/community/post",
  "/pages/community/messages",
  "/pages/community/my-posts",
  "/pages/community/my-comments",
  "/pages/community/my-replies",
  "/pages/community/my-favorites"
]) {
  assert.equal(combined.includes(forbidden), false, `摸鱼模式不得引用普通社区操作：${forbidden}`);
}

for (const forbidden of [
  "IllustrationKeys",
  "resolveSemanticIconPath",
  "resolveSemanticIconClass",
  "resolveProfileAvatarPathByKey",
  "vs-panel",
  "camp-card",
  "vs-card-raised",
  "post-card",
  "article-card",
  "avatar",
  "badge",
  "illustration",
  "icon",
  "glow"
]) {
  assert.equal(combined.includes(forbidden), false, `摸鱼模式不得使用 RPG 视觉标识：${forbidden}`);
}

assert.equal(stealthFiles.index.includes("calculateWorkValueState({ snapshot:"), true);
assert.equal(stealthFiles.index.includes("resolveMiniappFirstRunState"), true);
assert.equal(stealthFiles.index.includes("setInterval(recalculate, 1000)"), true);
assert.equal(stealthFiles.index.includes("stopTimer()"), true);
assert.equal(stealthFiles.index.includes("倒计时记录"), true);
assert.equal(stealthFiles.index.includes("stealth-countdown-table"), true);
assert.equal(stealthFiles.index.includes("今日生存消耗"), true);
assert.equal(stealthFiles.index.includes("getSurvivalLedgerTodaySummary"), true);
assert.equal(stealthFiles.index.includes("getNextStatutoryHoliday"), true);
assert.equal(stealthFiles.index.includes("secondsUntilRestDay"), true);
assert.equal(stealthFiles.index.includes("secondsUntilPayday"), true);
assert.equal(stealthFiles.dailyList.includes("getDailyContentSummary"), true);
assert.equal(stealthFiles.dailyList.includes("getDailyContentColumnArticles"), true);
assert.equal(stealthFiles.dailyList.includes("getWorldIntelArticles"), true);
assert.equal(stealthFiles.dailyList.includes("每日话题"), true);
assert.equal(stealthFiles.dailyList.includes("大陆新闻"), true);
assert.equal(stealthFiles.dailyList.includes("配图"), true);
assert.equal(stealthFiles.dailyList.includes("imageCount"), true);
assert.equal(stealthFiles.dailyList.includes("countDefinedImages"), true);
assert.equal(stealthFiles.dailyDetail.includes("getDailyContentArticleDetail"), true);
assert.equal(stealthFiles.dailyDetail.includes("getDailyContentSummary"), true);
assert.equal(stealthFiles.dailyDetail.includes("getWorldIntelArticleDetail"), true);
assert.equal(stealthFiles.dailyDetail.includes("配图数量"), true);
assert.equal(stealthFiles.dailyDetail.includes("配图清单"), true);
assert.equal(stealthFiles.dailyDetail.includes("currentImageUrl"), true);
assert.equal(stealthFiles.dailyDetail.includes("stealth-image-viewer"), true);
assert.equal(stealthFiles.forum.includes("listCommunityPosts"), true);
assert.equal(stealthFiles.forum.includes("COMMUNITY_SECTION_KEYS"), true);
assert.equal(stealthFiles.forum.includes("activeSection"), true);
assert.equal(stealthFiles.forum.includes("switchSection"), true);
assert.equal(stealthFiles.forum.includes("stealth-filter-row"), true);
assert.equal(stealthFiles.forumDetail.includes("getCommunityPost"), true);
assert.equal(stealthFiles.forumDetail.includes("createCommunityComment"), true);
assert.equal(stealthFiles.forumDetail.includes("submitComment"), true);
assert.equal(stealthFiles.forumDetail.includes("commentSubmitting"), true);
assert.equal(stealthFiles.forumDetail.includes("commentFeedback"), true);
assert.equal(stealthFiles.forumDetail.includes("发表评论"), true);
assert.equal(
  stealthFiles.forumDetail.includes("await createCommunityComment(post.value.id, body)"),
  true
);
assert.equal(stealthFiles.forumDetail.includes("await loadDetail()"), true);
assert.equal(stealthFiles.forumDetail.includes('commentBody.value = ""'), true);
assert.equal(stealthFiles.forumDetail.includes("setCommunityPostLike"), true);
assert.equal(stealthFiles.forumDetail.includes("setCommunityPostFavorite"), true);
assert.equal(stealthFiles.forumDetail.includes("createCommunityReply"), false);
assert.equal(stealthFiles.forumDetail.includes("reportCommunityPost"), false);
assert.equal(stealthFiles.forumDetail.includes("reportCommunityComment"), false);
assert.equal(stealthFiles.forumDetail.includes("reportCommunityReply"), false);
assert.equal(stealthFiles.forumDetail.includes("uploadCommunityMediaAsset"), false);
assert.equal(stealthFiles.forumDetail.includes("listCommunityMessages"), false);
assert.equal(stealthFiles.forumDetail.includes("listMyCommunityPosts"), false);

assert.equal(stealthFiles.forum.includes("thumbnailUrl"), false);
assert.equal(stealthFiles.forum.includes("<image"), false);
assert.equal(stealthFiles.forumDetail.includes("附件数量"), true);
assert.equal(stealthFiles.forumDetail.includes("附件 {{ index + 1 }}"), true);
assert.equal(stealthFiles.forumDetail.includes("thumbnailUrl"), false);
assert.equal(stealthFiles.forumDetail.includes("stealth-image-viewer"), true);
assert.equal(stealthFiles.forumDetail.includes('@tap="closeImageViewer"'), true);
assert.equal(stealthFiles.forumDetail.includes('currentImageUrl.value = ""'), true);
assert.equal(stealthFiles.forumDetail.includes("uni.previewImage"), false);
assert.equal(stealthFiles.forumDetail.includes("swiper"), false);
assert.equal(stealthFiles.style.includes("transition"), false);
assert.equal(stealthFiles.style.includes("animation"), false);
assert.equal(stealthFiles.style.includes("*"), false);
assert.equal(stealthFiles.style.includes("background: transparent"), true);
assert.equal(stealthFiles.style.includes("text-decoration: underline"), true);
assert.equal(stealthFiles.style.includes(".stealth-countdown-table"), true);
assert.equal(stealthFiles.style.includes(".stealth-comment-input-row"), true);
assert.equal(stealthFiles.style.includes(".stealth-comment-action-row"), true);
assert.equal(stealthFiles.style.includes("border: 1rpx solid #526173"), false);
assert.equal(stealthFiles.style.includes("border: 0"), true);
assert.equal(stealthFiles.style.includes("box-shadow: none"), true);
assert.equal(stealthFiles.style.includes("overflow-x: hidden"), true);
assert.equal(stealthFiles.style.includes("@media (max-width: 360px)"), true);

process.stdout.write("miniapp stealth-workbench-mode verification passed\n");
