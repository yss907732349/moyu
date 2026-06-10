/* global process */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const adminApp = readFileSync("apps/admin/src/App.vue", "utf8");
const dailyService = readFileSync("apps/api/src/daily-content-feed.service.ts", "utf8");
const dailyController = readFileSync("apps/api/src/daily-content-feed.controller.ts", "utf8");
const worldIntelController = readFileSync("apps/api/src/world-intel-content.controller.ts", "utf8");
const worldIntelService = readFileSync("apps/api/src/world-intel-content.service.ts", "utf8");
const worldIntelShared = readFileSync("packages/shared/src/world-intel-content.ts", "utf8");

assert.equal(adminApp.includes("/admin/daily-content/issues"), true);
assert.equal(adminApp.includes("/admin/daily-content/issues/${issue.id}/validation"), true);
assert.equal(
  adminApp.includes("/admin/daily-content/issues/${selectedIssue.value.id}/preview"),
  false
);
assert.equal(adminApp.includes("/sections/${section.sectionKey}"), true);
assert.equal(adminApp.includes("/sections/${sectionKey}/validation"), true);
assert.equal(adminApp.includes("/sections/${sectionKey}/preview"), true);
assert.equal(adminApp.includes("addArticle"), true);
assert.equal(adminApp.includes("removeArticle"), true);
assert.equal(adminApp.includes("moveArticle"), true);
assert.equal(adminApp.includes("ensureSource"), true);
assert.equal(adminApp.includes("发布检查"), true);
assert.equal(adminApp.includes("整期预览"), false);
assert.equal(adminApp.includes("板块预览"), true);
assert.equal(adminApp.includes("预览本文"), true);
assert.equal(adminApp.includes("日报运营"), true);
assert.equal(adminApp.includes("normalizeDailySectionForSave"), true);
assert.equal(adminApp.includes("defaultDailySectionSummary"), true);
assert.equal(adminApp.includes("summarizeDailyReflection"), true);
assert.equal(adminApp.includes("补充来源字段"), true);
assert.equal(adminApp.includes("公开来源说明"), true);
assert.equal(adminApp.includes("来源链接"), true);
assert.equal(adminApp.includes("社区引用提示"), false);
assert.equal(adminApp.includes("板块摘要"), false);
assert.equal(adminApp.includes("总标题"), false);
assert.equal(adminApp.includes("公开摘要"), false);
assert.equal(adminApp.includes("文章来源类型"), false);
assert.equal(adminApp.includes("配图链接"), false);
assert.equal(adminApp.includes("保存整期设置"), false);
assert.equal(adminApp.includes("保存本板块"), false);
assert.equal(adminApp.includes("发布本板块"), false);
assert.equal(adminApp.includes("整期发布"), false);
assert.equal(adminApp.includes("新建哪个板块"), true);
assert.equal(adminApp.includes("2 大陆新闻"), false);
assert.equal(adminApp.includes("sectionKey"), true);
assert.equal(adminApp.includes("activeModule === 'worldIntel'"), true);
assert.equal(adminApp.includes("/admin/world-intel/articles/batch"), true);
assert.equal(adminApp.includes("大陆新闻已拆到独立内容库"), true);
assert.equal(adminApp.includes("world-intel-layout"), true);
assert.equal(adminApp.includes("worldIntelForm.title"), true);
assert.equal(adminApp.includes("worldIntelBatchText"), true);
assert.equal(adminApp.includes("正文配图"), true);
assert.equal(adminApp.includes("目录图默认读取正文里的第一张图片"), true);
assert.equal(adminApp.includes("WORLD_INTEL_DEFAULT_PUBLIC_SOURCE"), true);
assert.equal(adminApp.includes("运影报社独家资讯"), true);
assert.equal(adminApp.includes("来源类型"), false);
assert.equal(adminApp.includes("来源站点"), false);
assert.equal(adminApp.includes("来源标题"), false);
assert.equal(adminApp.includes("发布前需来源站点"), false);
assert.equal(adminApp.includes("上传封面"), false);
assert.equal(adminApp.includes("封面/配图链接"), false);
assert.equal(adminApp.includes("每篇用三行起步"), true);
assert.equal(adminApp.includes('@click="scheduleIssue"'), true);
assert.equal(adminApp.includes('@click="cancelScheduleIssue"'), true);
assert.equal(adminApp.includes("已定时发布"), true);
assert.equal(adminApp.includes("独立板块记录"), true);
assert.equal(adminApp.includes("section-switcher"), true);
assert.equal(adminApp.includes("daily-section-workspace"), true);
assert.equal(adminApp.includes("section-tabs"), false);
assert.equal(adminApp.includes("sourceType"), true);
assert.equal(adminApp.includes("prepareDailyContentImage"), true);
assert.equal(adminApp.includes("drawImageToDataUrl"), true);
assert.equal(adminApp.includes("thumbnailDataUrl"), true);
assert.equal(adminApp.includes("dailyEditorDirty"), true);
assert.equal(adminApp.includes("worldIntelFormDirty"), true);
assert.equal(adminApp.includes("formatAdminOperationError"), true);
assert.equal(dailyController.includes("publishReviewCreated"), true);
assert.equal(dailyController.includes("publishReviewStateChanged"), true);
assert.equal(dailyController.includes("publishWorkbenchCountsChanged"), true);
assert.equal(dailyService.includes("thumbnailPublicUrl"), true);
assert.equal(dailyService.includes("writeDailyContentThumbnail"), true);
assert.equal(dailyService.includes("updateAdminIssueSection"), true);
assert.equal(dailyService.includes("validateAdminIssueSection"), true);
assert.equal(dailyService.includes("previewSection"), true);
assert.equal(dailyService.includes("validateDailyContentSectionForPublish"), true);
assert.equal(dailyService.includes("来源链接缺少来源标题或站点"), false);
assert.equal(dailyService.includes("缺少插画 key"), false);
assert.equal(dailyService.includes("缺少配图链接"), false);
assert.equal(dailyService.includes("daily_content_world_intel_standalone"), true);
assert.equal(worldIntelController.includes('@Controller("admin/world-intel")'), true);
assert.equal(worldIntelController.includes('@Controller("world-intel")'), true);
assert.equal(worldIntelController.includes("/like"), true);
assert.equal(worldIntelController.includes("/comments"), true);
assert.equal(worldIntelController.includes("/quote"), true);
assert.equal(worldIntelController.includes("x-admin-token"), true);
assert.equal(worldIntelService.includes("batchCreateAdminArticles"), true);
assert.equal(worldIntelService.includes("transitionAdminArticle"), true);
assert.equal(worldIntelService.includes("migrateLegacyWorldIntelArticles"), true);
assert.equal(worldIntelService.includes("withBodyImageAsDirectoryImage"), true);
assert.equal(worldIntelService.includes("worldIntelArticle.delete"), false);
assert.equal(worldIntelService.includes("deleteMany"), false);
assert.equal(worldIntelShared.includes("extractFirstWorldIntelBodyImageUrl(article.body)"), true);
assert.equal(worldIntelShared.includes("必须补齐来源 URL"), false);
assert.equal(worldIntelShared.includes("来源标题和来源站点"), false);
assert.equal(
  worldIntelShared.indexOf("extractFirstWorldIntelBodyImageUrl(article.body)") <
    worldIntelShared.indexOf("normalizeOptionalUrl(article.coverImageUrl)"),
  true
);

process.stdout.write("admin daily-content-feed verification passed\n");
