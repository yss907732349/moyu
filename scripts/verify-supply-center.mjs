/* global process */
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const shared = require("../packages/shared/dist/index.js");

const {
  CpsOrderStatus,
  CpsSourceProvider,
  DEFAULT_SUPPLY_ITEMS,
  SUPPLY_CAMPAIGN_WHITELIST,
  SUPPLY_CENTER_SECTIONS,
  SupplyActivityGroupKey,
  SupplyClickJumpStatus,
  SupplyFallbackStrategy,
  SupplyItemStatus,
  SupplyRecommendationSlot,
  SupplySectionKey,
  SurvivalLedgerCategoryKey,
  assertPublicSupplyPreviewSafe,
  assertSupplySidSafe,
  buildAdminSupplyPublicPreview,
  buildSupplyCenterPublicList,
  classifyJutuikeOrderFallback,
  explainSupplyAttributionFailure,
  mapJutuikeOrderStatusToCpsOrderStatus,
  maskSupplySid,
  normalizeJutuikeOrderToCpsInput,
  validateSupplyItemConfig
} = shared;

assert.deepEqual(
  SUPPLY_CENTER_SECTIONS.map((section) => section.key),
  [SupplySectionKey.Canteen, SupplySectionKey.AfternoonBoost, SupplySectionKey.Commute]
);
assert.equal(SUPPLY_CAMPAIGN_WHITELIST.length, 8);
for (const name of [
  "美团外卖",
  "饿了么",
  "瑞幸咖啡",
  "库迪咖啡",
  "奈雪",
  "喜茶",
  "滴滴/花小猪",
  "高德打车"
]) {
  assert.equal(
    SUPPLY_CAMPAIGN_WHITELIST.some((item) => item.displayName === name),
    true,
    `missing campaign ${name}`
  );
}

const publicList = buildSupplyCenterPublicList(DEFAULT_SUPPLY_ITEMS);
assert.equal(publicList.todayPanel.title, "今日补给面板");
assert.equal(
  Object.values(SupplyRecommendationSlot).includes(publicList.todayPanel.scenarioKey),
  true
);
assert(publicList.mainRecommendation);
assert.equal(publicList.sections.length, 3);
assert.equal(
  publicList.sections.every((section) => section.items.length > 0),
  true
);
assert.equal(JSON.stringify(publicList).includes("jutuikeActId"), false);
assert.equal(JSON.stringify(publicList).includes("聚推客"), false);
assert.equal(JSON.stringify(publicList).includes("commission"), false);
assert.equal(JSON.stringify(publicList).includes("apikey"), false);
assert.equal(publicList.sections[0].items[0].tags.length > 0, true);
assert.equal(
  publicList.sections
    .flatMap((section) => section.items)
    .every((item) => item.displayPriority >= 0),
  true
);
assert.doesNotThrow(() =>
  assertPublicSupplyPreviewSafe(buildAdminSupplyPublicPreview(DEFAULT_SUPPLY_ITEMS))
);

validateSupplyItemConfig({
  ...DEFAULT_SUPPLY_ITEMS[0],
  status: SupplyItemStatus.Published,
  sectionKey: SupplySectionKey.Canteen,
  groupKey: SupplyActivityGroupKey.Lunch,
  userVisibleTags: ["外卖", "午间饭票"],
  fallbackStrategy: SupplyFallbackStrategy.None
});
assert.throws(() => validateSupplyItemConfig({ ...DEFAULT_SUPPLY_ITEMS[0], sectionKey: "mall" }));
assert.throws(() =>
  validateSupplyItemConfig({
    ...DEFAULT_SUPPLY_ITEMS[0],
    userVisibleTags: ["佣金返利"]
  })
);

const sid = "sid_1234567890abcdef1234567890";
assert.equal(maskSupplySid(sid), "sid_12...7890");
assert.doesNotThrow(() => assertSupplySidSafe(sid, ["user-1"]));
assert.throws(() => assertSupplySidSafe("user-1-short", ["user-1"]));
assert.equal(SupplyClickJumpStatus.Failed, "failed");
assert.equal(SupplyClickJumpStatus.FallbackLinked, "fallback_linked");

assert.equal(mapJutuikeOrderStatusToCpsOrderStatus("paid"), CpsOrderStatus.Effective);
assert.equal(mapJutuikeOrderStatusToCpsOrderStatus("settled"), CpsOrderStatus.Effective);
assert.equal(mapJutuikeOrderStatusToCpsOrderStatus("refunded"), CpsOrderStatus.Refunded);
assert.equal(mapJutuikeOrderStatusToCpsOrderStatus("risk_rejected"), CpsOrderStatus.RiskRejected);
assert.equal(mapJutuikeOrderStatusToCpsOrderStatus("strange"), CpsOrderStatus.Unknown);
assert.equal(explainSupplyAttributionFailure("sid_missing").includes("归因"), true);

assert.equal(
  classifyJutuikeOrderFallback({ brandName: "高德打车", title: "出行补给" }),
  SurvivalLedgerCategoryKey.Commute
);
assert.equal(
  classifyJutuikeOrderFallback({ brandName: "瑞幸咖啡", title: "冰美式" }),
  SurvivalLedgerCategoryKey.AfternoonBoost
);

const cpsInput = normalizeJutuikeOrderToCpsInput({
  userId: "user-1",
  categoryKey: SurvivalLedgerCategoryKey.AfternoonBoost,
  order: {
    sid,
    orderSn: "jt-order-1",
    payPrice: "12.80",
    payTime: "2026-05-29T04:00:00.000Z",
    status: "paid",
    brandName: "瑞幸咖啡",
    actId: "jt_luckin"
  }
});
assert.equal(cpsInput.sourceProvider, CpsSourceProvider.Jutuike);
assert.equal(cpsInput.sourceOrderId, "jt-order-1");
assert.equal(cpsInput.amountMinor, 1280);
assert.equal(cpsInput.sourceStatus, CpsOrderStatus.Effective);

process.stdout.write("supply-center verification passed\n");
