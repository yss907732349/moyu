/* global process */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const shared = require("../packages/shared/dist/index.js");
const { DailyContentStatus } = shared;

const serviceSourcePath = "apps/miniapp/src/services/daily-content-feed.ts";
const builtServicePath = "apps/miniapp/dist/build/mp-weixin/services/daily-content-feed.js";
const builtDailyHomePath = "apps/miniapp/dist/build/mp-weixin/pages/daily-content/index.js";
const serviceSource = readFileSync(serviceSourcePath, "utf8");
const builtService = existsSync(builtServicePath) ? readFileSync(builtServicePath, "utf8") : "";
const builtDailyHome = existsSync(builtDailyHomePath)
  ? readFileSync(builtDailyHomePath, "utf8")
  : "";
const homePage = readFileSync("apps/miniapp/src/pages/home/index.vue", "utf8");
const dailyHomePage = readFileSync("apps/miniapp/src/pages/daily-content/index.vue", "utf8");
const listPage = readFileSync("apps/miniapp/src/pages/daily-content/list.vue", "utf8");
const articleDetailPage = readFileSync("apps/miniapp/src/pages/daily-content/detail.vue", "utf8");
const worldIntelListPage = readFileSync("apps/miniapp/src/pages/world-intel/list.vue", "utf8");
const worldIntelDetailPage = readFileSync("apps/miniapp/src/pages/world-intel/detail.vue", "utf8");
const staticCovers = readFileSync("apps/miniapp/src/services/static-covers.ts", "utf8");
const postPage = readFileSync("apps/miniapp/src/pages/community/post.vue", "utf8");
const pagesJson = readFileSync("apps/miniapp/src/pages.json", "utf8");
const seedStrategyPath =
  "openspec/changes/archive/2026-05-28-stabilize-miniapp-first-run-user-flow/dev-seed-strategy.md";
assert.equal(
  existsSync(seedStrategyPath),
  true,
  `缺少首跑开发种子策略归档文档：${seedStrategyPath}`
);
const seedStrategy = readFileSync(seedStrategyPath, "utf8");

assert.equal(serviceSource.includes("/daily-content/summary"), true);
assert.equal(serviceSource.includes("/daily-content/issues/"), true);
assert.equal(serviceSource.includes("/daily-content/items/"), true);
assert.equal(serviceSource.includes("/world-intel/articles"), true);
assert.equal(serviceSource.includes("getWorldIntelArticles"), true);
assert.equal(serviceSource.includes("createDailyContentQuoteSnapshot"), true);
assert.equal(serviceSource.includes("getAuthHeaders"), true);
assert.equal(serviceSource.includes("isDailyContentPublicSummary"), true);
assert.equal(serviceSource.includes("isDailyContentPublicDetail"), true);
assert.equal(serviceSource.includes("value.sections.length > 0"), true);
assert.equal(
  serviceSource.includes("value.sections.length === DAILY_CONTENT_SECTION_KEYS.length"),
  false
);
assert.equal(serviceSource.includes("isDailyContentIdentityError"), true);
assert.equal(serviceSource.includes("resolvePublicDailyAssetUrl"), true);
assert.equal(serviceSource.includes("normalizeMarkdownImageUrls"), true);
assert.equal(serviceSource.includes("cacheApiImageForDisplay"), true);
assert.equal(serviceSource.includes("cacheMarkdownImageUrlsForDisplay"), true);
assert.equal(serviceSource.includes("/daily-content/assets/"), true);
assert.equal(
  readFileSync("packages/shared/src/daily-content-feed.ts", "utf8").includes(
    "extractFirstDailyContentBodyImageUrl"
  ),
  true
);
assert.equal(
  serviceSource.includes(
    "articles: await Promise.all(data.articles.map(prepareDailyArticleSummaryAssetUrls))"
  ),
  true
);
assert.equal(
  serviceSource.includes(
    "articles: await Promise.all(data.articles.map(prepareWorldIntelSummaryAssetUrls))"
  ),
  true
);
assert.equal(serviceSource.includes("article: await prepareDailyArticleDetailAssetUrls"), true);
assert.equal(serviceSource.includes("article: await prepareWorldIntelDetailAssetUrls"), true);
assert.equal(serviceSource.includes("aiDraftMetadata"), true);
assert.equal(serviceSource.includes('!("aiDraftMetadata" in value)'), true);
assert.equal(serviceSource.includes('!("reviewNote" in value)'), true);

assert.equal(homePage.includes("getDailyContentSummary"), true);
assert.equal(homePage.includes("dailyContentSummary"), true);
assert.equal(homePage.includes("handleOpenDailyContent"), true);
assert.equal(homePage.includes("/pages/daily-content/index"), true);
assert.equal(homePage.includes("entry-badge-new"), true);
assert.equal(homePage.includes("隐者日报"), true);
assert.equal(homePage.includes("每日新闻、热梗、信息差"), true);
assert.equal(homePage.includes("摸鱼必备知识站"), true);
assert.equal(homePage.includes("demo"), false);
assert.equal(homePage.includes("mock"), false);

assert.equal(dailyHomePage.includes("getDailyContentSummary"), true);
assert.equal(dailyHomePage.includes("createDailyContentReflectionQuoteSnapshot"), true);
assert.equal(dailyHomePage.includes("今日话题"), true);
assert.equal(dailyHomePage.includes("去社区写下今日摸鱼心得。"), true);
assert.equal(dailyHomePage.includes("运营发布可引用参悟后，这里会直接打开社区发帖。"), true);
assert.equal(dailyHomePage.includes("/pages/daily-content/list"), true);
assert.equal(dailyHomePage.includes("/pages/world-intel/list"), true);
assert.equal(dailyHomePage.includes("/pages/community/post?dailyQuote="), true);
assert.equal(dailyHomePage.includes("/pages/daily-content/detail?"), false);
assert.equal(dailyHomePage.includes("今日卷轴尚未公开"), true);
assert.equal(dailyHomePage.includes("暂未发布"), true);
assert.equal(dailyHomePage.includes('v-else class="daily-stack"'), true);
assert.equal(dailyHomePage.includes("publishedColumns"), true);
assert.equal(dailyHomePage.includes("hasPublishedReflection"), true);
assert.equal(dailyHomePage.includes("今日参悟暂不可引用"), true);
assert.equal(dailyHomePage.includes("DailyContentSectionKey.DailyReflection"), true);
assert.equal(dailyHomePage.includes("WORLD_INTEL_COVER_IMAGE"), true);
assert.equal(dailyHomePage.includes("DAILY_COVER_IMAGE"), true);
assert.equal(staticCovers.includes("/static/daily-content/world-intel-cover.png"), true);
assert.equal(staticCovers.includes("/static/daily-content/absurd-casefile-cover.png"), true);
assert.equal(staticCovers.includes("/static/covers/daily-cover.png"), true);
assert.equal(dailyHomePage.includes("illustration-frame"), true);
assert.equal(dailyHomePage.includes("padding-top: 44.38%"), true);
assert.equal(dailyHomePage.includes('mode="widthFix"'), false);
assert.equal(dailyHomePage.includes("illustration-shade"), false);
assert.equal(existsSync("apps/miniapp/src/static/daily-content/world-intel-cover.png"), true);
assert.equal(existsSync("apps/miniapp/src/static/daily-content/absurd-casefile-cover.png"), true);
assert.equal(existsSync("apps/miniapp/src/static/covers/daily-cover.png"), true);

assert.equal(listPage.includes("getDailyContentColumnArticles"), true);
assert.equal(listPage.includes("/pages/daily-content/detail?articleId="), true);
assert.equal(listPage.includes("previewArticleImage"), true);
assert.equal(listPage.includes("uni.previewImage"), true);
assert.equal(listPage.includes('@tap.stop="previewArticleImage(article.source.imageUrl)"'), true);
assert.equal(listPage.includes("复制引用路径"), false);
assert.equal(listPage.includes("article.source?.imageUrl"), true);
assert.equal(listPage.includes("本栏目暂无公开文章"), true);
assert.equal(listPage.includes("来源待补齐"), false);
assert.equal(listPage.includes("来源："), false);
assert.equal(listPage.includes('ref<DailyContentArticleSectionKey>("world_intel")'), false);

assert.equal(articleDetailPage.includes("getDailyContentArticleDetail"), true);
assert.equal(articleDetailPage.includes("setDailyContentItemLike"), true);
assert.equal(articleDetailPage.includes("createDailyContentQuoteSnapshot"), false);
assert.equal(articleDetailPage.includes("articleImageUrls"), true);
assert.equal(articleDetailPage.includes("uni.previewImage"), true);
assert.equal(
  articleDetailPage.includes('@tap="previewArticleImage(article.source.imageUrl)"'),
  true
);
assert.equal(articleDetailPage.includes('@tap="previewArticleImage(block.src)"'), true);
assert.equal(articleDetailPage.includes("DailyContentSectionKey.AbsurdCasefile"), true);
assert.equal(articleDetailPage.includes("sourceAttribution"), true);
assert.equal(articleDetailPage.includes("publicSourceText"), true);
assert.equal(articleDetailPage.includes("copyArticleSourceUrl"), true);
assert.equal(articleDetailPage.includes("uni.setClipboardData"), true);
assert.equal(articleDetailPage.includes("source-copy-icon"), true);
assert.equal(articleDetailPage.includes("来源链接已复制"), true);
assert.equal(articleDetailPage.includes("createDailyContentArticleComment"), true);
assert.equal(articleDetailPage.includes("getAppAuthToken"), true);
assert.equal(articleDetailPage.includes("getLocalUserProfileSnapshot"), true);
assert.equal(articleDetailPage.includes('switchTab({ url: "/pages/profile/index" })'), true);
assert.equal(articleDetailPage.includes("/pages/community/post?dailyQuote="), false);
assert.equal(articleDetailPage.includes("引用发帖"), false);
assert.equal(articleDetailPage.includes("来源："), false);
assert.equal(articleDetailPage.includes("复制引用路径"), false);
assert.equal(articleDetailPage.includes('response.status !== "rejected"'), true);
assert.equal(articleDetailPage.includes("暂不支持引用发帖"), false);
assert.equal(articleDetailPage.includes("审核通过后会显示"), true);
assert.equal(articleDetailPage.includes("仅自己可见"), true);

assert.equal(worldIntelListPage.includes("getWorldIntelArticles"), true);
assert.equal(worldIntelListPage.includes("onReachBottom"), true);
assert.equal(worldIntelListPage.includes("加载更多"), true);
assert.equal(worldIntelListPage.includes("/pages/world-intel/detail?articleId="), true);
assert.equal(worldIntelListPage.includes("演示"), false);
assert.equal(worldIntelListPage.includes("previewArticleImage"), true);
assert.equal(worldIntelListPage.includes("uni.previewImage"), true);
assert.equal(worldIntelListPage.includes('@tap.stop="previewArticleImage(article)"'), true);
assert.equal(worldIntelListPage.includes("来源："), false);
assert.equal(worldIntelListPage.includes("white-space: nowrap"), true);
assert.equal(worldIntelListPage.includes("text-overflow: ellipsis"), true);
assert.equal(worldIntelDetailPage.includes("getWorldIntelArticleDetail"), true);
assert.equal(worldIntelDetailPage.includes("articleImageUrls"), true);
assert.equal(worldIntelDetailPage.includes("uni.previewImage"), true);
assert.equal(worldIntelDetailPage.includes('@tap="previewArticleImage(block.src)"'), true);
assert.equal(worldIntelDetailPage.includes("createWorldIntelQuoteSnapshot"), false);
assert.equal(worldIntelDetailPage.includes("/pages/community/post?dailyQuote="), false);
assert.equal(worldIntelDetailPage.includes("引用发帖"), false);
assert.equal(worldIntelDetailPage.includes("来源："), false);
assert.equal(worldIntelDetailPage.includes("复制引用路径"), false);

assert.equal(postPage.includes("dailyQuote"), true);
assert.equal(postPage.includes("dailyContentQuote"), true);
assert.equal(postPage.includes("引用今日参悟"), true);
assert.equal(postPage.includes("quoteBodyText"), true);
assert.equal(postPage.includes("body.value = parsed.quotePrompt"), false);
assert.equal(postPage.includes("dailyContentQuote.value = null"), true);
assert.equal(postPage.includes("低风险内容会自动公开"), true);

assert.equal(pagesJson.includes("pages/daily-content/index"), true);
assert.equal(pagesJson.includes("pages/daily-content/list"), true);
assert.equal(pagesJson.includes("pages/daily-content/detail"), true);
assert.equal(pagesJson.includes("pages/world-intel/list"), true);
assert.equal(pagesJson.includes("pages/world-intel/detail"), true);
assert.equal(DailyContentStatus.Published, "published");
assert.equal(serviceSource.includes("seed"), false);
if (builtService) {
  assert.equal(
    builtService.includes("sections.length===n.dist.DAILY_CONTENT_SECTION_KEYS.length"),
    false,
    "微信小程序构建产物仍在要求三个板块同时发布，请重新执行 pnpm build:miniapp"
  );
}
if (builtDailyHome) {
  assert.equal(
    builtDailyHome.includes("publishedColumns"),
    false,
    "微信小程序构建产物不应保留未编译的源码标识"
  );
  assert.equal(
    builtDailyHome.includes("DailyReflection") || builtDailyHome.includes("daily_reflection"),
    true,
    "微信小程序构建产物需要包含今日参悟独立显示判断"
  );
}
assert.equal(seedStrategy.includes("本变更不要求生产环境自动生成演示内容"), true);
assert.equal(seedStrategy.includes("开发环境可以创建一份满足发布规则的已发布日报"), true);
assert.equal(seedStrategy.includes("不得编造无法追溯的来源"), true);

process.stdout.write("miniapp daily-content-feed verification passed\n");
