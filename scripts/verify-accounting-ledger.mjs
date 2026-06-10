/* global process */
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const shared = require("../packages/shared/dist/index.js");

const {
  AccountingLedgerValidationError,
  BUILTIN_SURVIVAL_LEDGER_CATEGORIES,
  CpsOrderStatus,
  CpsSourceProvider,
  CpsLedgerImportAction,
  CurrencyCode,
  SurvivalLedgerCategoryKey,
  AFTERNOON_BOOST_KEYWORDS,
  appendCpsOrderStateHistory,
  createCpsSourceOrderKey,
  decideCpsLedgerImport,
  mapJutuikeOrderStatusToCpsOrderStatus,
  normalizeJutuikeOrderToCpsInput,
  calculateSurvivalLedgerTodaySummary,
  calculateSurvivalLedgerWeeklyReport,
  classifyCpsSurvivalOrder,
  createSurvivalLedgerBillSnapshot,
  matchesAfternoonBoostKeywords,
  validateListSurvivalLedgerBillsRequest
} = shared;

assert.deepEqual(
  BUILTIN_SURVIVAL_LEDGER_CATEGORIES.map((item) => item.key),
  [
    SurvivalLedgerCategoryKey.Canteen,
    SurvivalLedgerCategoryKey.AfternoonBoost,
    SurvivalLedgerCategoryKey.Commute
  ]
);
assert.equal(BUILTIN_SURVIVAL_LEDGER_CATEGORIES[0].displayName, "隐者食堂");
assert.equal(BUILTIN_SURVIVAL_LEDGER_CATEGORIES[1].displayName, "下午续命");
assert.equal(BUILTIN_SURVIVAL_LEDGER_CATEGORIES[2].displayName, "通勤");
assert(AFTERNOON_BOOST_KEYWORDS.includes("咖啡"));
assert(AFTERNOON_BOOST_KEYWORDS.includes("奶茶"));
assert(AFTERNOON_BOOST_KEYWORDS.includes("茶饮"));
assert(AFTERNOON_BOOST_KEYWORDS.includes("甜品"));
assert(AFTERNOON_BOOST_KEYWORDS.includes("蛋糕"));
assert(AFTERNOON_BOOST_KEYWORDS.includes("下午茶"));

assert.equal(
  classifyCpsSurvivalOrder({
    sourceProvider: CpsSourceProvider.Meituan,
    productTitle: "牛肉饭套餐"
  }),
  SurvivalLedgerCategoryKey.Canteen
);
assert.equal(
  classifyCpsSurvivalOrder({
    sourceProvider: CpsSourceProvider.Eleme,
    productTitle: "冰美式咖啡"
  }),
  SurvivalLedgerCategoryKey.AfternoonBoost
);
assert.equal(
  classifyCpsSurvivalOrder({
    sourceProvider: CpsSourceProvider.DidiTaxi,
    productTitle: "快车"
  }),
  SurvivalLedgerCategoryKey.Commute
);
assert.equal(matchesAfternoonBoostKeywords({ merchantTags: ["甜品", "蛋糕"] }), true);
assert.equal(mapJutuikeOrderStatusToCpsOrderStatus("risk_rejected"), CpsOrderStatus.RiskRejected);
assert.equal(mapJutuikeOrderStatusToCpsOrderStatus("unpaid"), CpsOrderStatus.Unpaid);
assert.equal(
  normalizeJutuikeOrderToCpsInput({
    userId: "user-1",
    categoryKey: SurvivalLedgerCategoryKey.Commute,
    order: {
      orderSn: "jt-commute-1",
      payPrice: "26.00",
      payTime: "2026-05-26T01:00:00.000Z",
      status: "paid",
      brandName: "高德打车"
    }
  }).sourceProvider,
  CpsSourceProvider.Jutuike
);

validateListSurvivalLedgerBillsRequest({
  startDate: "2026-05-01",
  endDate: "2026-05-31",
  categoryKey: SurvivalLedgerCategoryKey.Canteen
});
assert.throws(
  () => validateListSurvivalLedgerBillsRequest({ startDate: "2026-06-01", endDate: "2026-05-31" }),
  AccountingLedgerValidationError
);

const baseSource = {
  sourceProvider: CpsSourceProvider.Meituan,
  sourceOrderId: "order-1",
  sourceStatus: CpsOrderStatus.Effective,
  amountMinor: 1288,
  currency: CurrencyCode.CNY,
  occurredAt: "2026-05-25T04:00:00.000Z",
  productTitle: "牛肉饭套餐"
};
const canteenBill = createSurvivalLedgerBillSnapshot({
  id: "bill-1",
  userId: "user-1",
  source: baseSource,
  now: "2026-05-25T08:00:00.000Z"
});
const boostBill = createSurvivalLedgerBillSnapshot({
  id: "bill-2",
  userId: "user-1",
  source: {
    ...baseSource,
    sourceOrderId: "order-2",
    amountMinor: 1800,
    productTitle: "奶茶下午茶套餐"
  },
  now: "2026-05-25T08:00:00.000Z"
});
const cancelledBill = createSurvivalLedgerBillSnapshot({
  id: "bill-3",
  userId: "user-1",
  source: {
    ...baseSource,
    sourceOrderId: "order-3",
    sourceStatus: CpsOrderStatus.Refunded,
    amountMinor: 9999
  },
  now: "2026-05-25T08:00:00.000Z"
});
const commuteBill = createSurvivalLedgerBillSnapshot({
  id: "bill-4",
  userId: "user-1",
  source: {
    sourceProvider: CpsSourceProvider.DidiTaxi,
    sourceOrderId: "order-4",
    sourceStatus: CpsOrderStatus.Effective,
    amountMinor: 2600,
    currency: CurrencyCode.CNY,
    occurredAt: "2026-05-26T01:00:00.000Z",
    commuteDistanceMeters: 5100
  },
  now: "2026-05-26T08:00:00.000Z"
});

assert.equal(canteenBill.categoryKey, SurvivalLedgerCategoryKey.Canteen);
assert.equal(boostBill.categoryKey, SurvivalLedgerCategoryKey.AfternoonBoost);
assert.equal(cancelledBill.countsTowardConsumption, false);
assert.equal(cancelledBill.displayStatus, "rolled_back");
assert.equal(cancelledBill.displayStatusReason.includes("未计入"), true);
assert.equal("sourceProvider" in canteenBill, false);

const idempotencyKey = createCpsSourceOrderKey({
  sourceProvider: CpsSourceProvider.Jutuike,
  sourceOrderId: "jt-order-1"
});
assert.equal(idempotencyKey.key, "jutuike:jt-order-1");

const firstDecision = decideCpsLedgerImport({
  sourceProvider: CpsSourceProvider.Jutuike,
  sourceOrderId: "jt-order-1",
  sourceStatus: CpsOrderStatus.Effective,
  amountMinor: 1280
});
assert.equal(firstDecision.countsTowardConsumption, true);
assert.equal(firstDecision.ledgerAction, CpsLedgerImportAction.Created);

const rollbackDecision = decideCpsLedgerImport({
  sourceProvider: CpsSourceProvider.Jutuike,
  sourceOrderId: "jt-order-1",
  previousSourceStatus: CpsOrderStatus.Effective,
  sourceStatus: CpsOrderStatus.Refunded,
  amountMinor: 1280
});
assert.equal(rollbackDecision.countsTowardConsumption, false);
assert.equal(rollbackDecision.ledgerAction, CpsLedgerImportAction.RolledBack);

const history = appendCpsOrderStateHistory({
  sourceStatus: CpsOrderStatus.Effective,
  amountMinor: 1280,
  ledgerAction: CpsLedgerImportAction.Created,
  now: "2026-05-25T08:00:00.000Z"
});
const updatedHistory = appendCpsOrderStateHistory({
  history,
  previousSourceStatus: CpsOrderStatus.Effective,
  sourceStatus: CpsOrderStatus.Refunded,
  amountMinor: 1280,
  ledgerAction: CpsLedgerImportAction.RolledBack,
  now: "2026-05-26T08:00:00.000Z"
});
assert.equal(updatedHistory.length, 2);
assert.equal(updatedHistory[1].changeType, "refund_rollback");

const today = calculateSurvivalLedgerTodaySummary({
  businessDate: "2026-05-25",
  bills: [canteenBill, boostBill, cancelledBill, commuteBill]
});
assert.equal(today.totalAmountMinor, 3088);
assert.equal(
  today.categories.find((item) => item.categoryKey === SurvivalLedgerCategoryKey.Canteen)
    .amountMinor,
  1288
);
assert.equal(
  today.categories.find((item) => item.categoryKey === SurvivalLedgerCategoryKey.AfternoonBoost)
    .orderCount,
  1
);

const weekly = calculateSurvivalLedgerWeeklyReport({
  businessDate: "2026-05-26",
  bills: [canteenBill, boostBill, cancelledBill, commuteBill]
});
assert.equal(weekly.totalAmountMinor, 5688);
assert.equal(weekly.canteenOrderCount, 1);
assert.equal(weekly.afternoonBoostCount, 1);
assert.equal(weekly.commuteOrderCount, 1);
assert.equal(weekly.commuteDistanceMeters, 5100);
assert.equal(weekly.rankingPlaceholder.isRealRanking, false);

const weeklyWithoutDistance = calculateSurvivalLedgerWeeklyReport({
  businessDate: "2026-05-26",
  bills: [{ ...commuteBill, commuteDistanceMeters: null }]
});
assert.equal(weeklyWithoutDistance.commuteDistanceMeters, null);
assert.equal(weeklyWithoutDistance.commuteDistanceReliable, false);
assert.equal(weeklyWithoutDistance.commuteOrderCount, 1);

process.stdout.write("accounting-ledger verification passed\n");
