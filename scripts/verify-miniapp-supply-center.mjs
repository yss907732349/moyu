/* global process */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync("apps/miniapp/src/pages/supply-center/index.vue", "utf8");
const service = readFileSync("apps/miniapp/src/services/supply-center.ts", "utf8");
const pages = readFileSync("apps/miniapp/src/pages.json", "utf8");
const manifest = readFileSync("apps/miniapp/src/manifest.json", "utf8");
const featureRegistry = readFileSync("packages/shared/src/index.ts", "utf8");

assert.equal(pages.includes("pages/supply-center/index"), true);
assert.equal(page.includes("隐者食堂"), false);
assert.equal(page.includes("今日补给面板"), true);
assert.equal(page.includes("mainRecommendation"), true);
assert.equal(page.includes("recommendedNow"), true);
assert.equal(page.includes("tag-row"), true);
assert.equal(page.includes("loadError"), true);
assert.equal(page.includes("补给铺暂时离线"), true);
assert.equal(page.includes("重试同步"), true);
assert.equal(page.includes("section.section.title"), true);
assert.equal(page.includes("该板块暂未上架补给"), true);
assert.equal(page.includes("订单同步后才会自动收纳到账本"), true);
assert.equal(page.includes("navigateToMiniProgram"), true);
assert.equal(page.includes("FallbackLinked"), true);
assert.equal(page.includes("ledgerHint"), true);
assert.equal(service.includes("getLocalSupplyCenterPreview"), true);
assert.equal(service.includes("DEFAULT_SUPPLY_ITEMS"), true);
assert.equal(service.includes("buildSupplyCenterPublicList"), true);
assert.equal(service.includes("服务恢复后才可打开补给通道"), true);
assert.equal(service.includes("getMiniappApiBaseUrl"), true);
assert.equal(service.includes("/supply-center"), true);
assert.equal(service.includes("getAuthHeaders"), true);
assert.equal(service.includes("jutuikeActId"), true);
assert.equal(service.includes('!("jutuikeActId" in value)'), true);
assert.equal(service.includes("commissionRate"), true);
assert.equal(service.includes("todayPanel"), true);
assert.equal(service.includes("attributionReliable"), true);
assert.equal(service.includes("sidDigest"), true);
assert.equal(page.includes("聚推客"), false);
assert.equal(page.includes("佣金"), false);
assert.equal(page.includes("返利"), false);
assert.equal(page.includes("已入账"), false);
assert.equal(manifest.includes("navigateToMiniProgramAppIdList"), false);
assert.equal(featureRegistry.includes('publicRoute: "/pages/supply-center/index"'), true);
assert.equal(featureRegistry.includes("FeatureStatus.Enabled"), true);

process.stdout.write("miniapp-supply-center verification passed\n");
