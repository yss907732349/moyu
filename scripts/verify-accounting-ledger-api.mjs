/* global process */
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const shared = require("../packages/shared/dist/index.js");
const { AccountingLedgerController } = require("../apps/api/dist/accounting-ledger.controller.js");
const { AccountingLedgerService } = require("../apps/api/dist/accounting-ledger.service.js");

const { CpsOrderStatus, CpsSourceProvider, CurrencyCode, SurvivalLedgerCategoryKey } = shared;

const records = new Map();
let nextId = 1;

const prisma = {
  survivalLedgerBill: {
    async upsert({ where, create, update }) {
      const sourceKey = `${where.sourceProvider_sourceOrderId.sourceProvider}:${where.sourceProvider_sourceOrderId.sourceOrderId}`;
      const existing = [...records.values()].find(
        (record) => `${record.sourceProvider}:${record.sourceOrderId}` === sourceKey
      );
      const now = new Date("2026-05-25T08:00:00.000Z");
      const record = existing
        ? { ...existing, ...update, updatedAt: now }
        : {
            id: `survival-bill-${nextId++}`,
            ...create,
            createdAt: now,
            updatedAt: now
          };
      records.set(record.id, record);
      return record;
    },
    async findMany({ where }) {
      return [...records.values()].filter((record) => {
        if (where.userId && record.userId !== where.userId) {
          return false;
        }
        if (where.categoryKey && record.categoryKey !== where.categoryKey) {
          return false;
        }
        if (where.occurredOn?.gte && record.occurredOn < where.occurredOn.gte) {
          return false;
        }
        if (where.occurredOn?.lte && record.occurredOn > where.occurredOn.lte) {
          return false;
        }
        return true;
      });
    },
    async findFirst({ where }) {
      return (
        [...records.values()].find(
          (record) => record.id === where.id && record.userId === where.userId
        ) ?? null
      );
    }
  }
};

const context = {
  getCurrentUser(request) {
    return {
      userId: request?.headers?.authorization === "Bearer other" ? "other-user" : "dev-user",
      source: "temporary-dev-placeholder"
    };
  }
};

const service = new AccountingLedgerService(prisma);
const controller = new AccountingLedgerController(context, service);
const request = { headers: {} };

const imported = await controller.importCpsOrder(request, {
  sourceProvider: CpsSourceProvider.Meituan,
  sourceOrderId: "order-1",
  sourceStatus: CpsOrderStatus.Effective,
  amountMinor: 1200,
  currency: CurrencyCode.CNY,
  occurredAt: "2026-05-25T04:00:00.000Z",
  productTitle: "牛肉饭套餐"
});
assert.equal(imported.bill.userId, "dev-user");
assert.equal(imported.bill.categoryKey, SurvivalLedgerCategoryKey.Canteen);
assert.equal(imported.bill.countsTowardConsumption, true);
assert.equal("sourceProvider" in imported.bill, false);
assert.equal("sourceOrderId" in imported.bill, false);

await controller.importCpsOrder(request, {
  sourceProvider: CpsSourceProvider.Meituan,
  sourceOrderId: "order-1",
  sourceStatus: CpsOrderStatus.Refunded,
  amountMinor: 1200,
  currency: CurrencyCode.CNY,
  occurredAt: "2026-05-25T04:00:00.000Z",
  productTitle: "牛肉饭套餐"
});
assert.equal(records.size, 1);

await controller.importCpsOrder(request, {
  sourceProvider: CpsSourceProvider.Eleme,
  sourceOrderId: "order-2",
  sourceStatus: CpsOrderStatus.Effective,
  amountMinor: 1800,
  currency: CurrencyCode.CNY,
  occurredAt: "2026-05-25T07:00:00.000Z",
  productTitle: "奶茶下午茶套餐"
});

await controller.importCpsOrder(
  { headers: { authorization: "Bearer other" } },
  {
    sourceProvider: CpsSourceProvider.DidiTaxi,
    sourceOrderId: "order-3",
    sourceStatus: CpsOrderStatus.Effective,
    amountMinor: 9999,
    currency: CurrencyCode.CNY,
    occurredAt: "2026-05-25T02:00:00.000Z",
    commuteDistanceMeters: 3200
  }
);

const list = await controller.listBills(request, {
  startDate: "2026-05-01",
  endDate: "2026-05-31"
});
assert.equal(list.bills.length, 2);
assert(list.bills.every((bill) => bill.userId === "dev-user"));
assert.equal(
  list.bills.some(
    (bill) => bill.displayTitle.includes("美团") || bill.displayTitle.includes("饿了么")
  ),
  false
);

const boostList = await controller.listBills(request, {
  startDate: "2026-05-01",
  endDate: "2026-05-31",
  categoryKey: SurvivalLedgerCategoryKey.AfternoonBoost
});
assert.equal(boostList.bills.length, 1);

const summary = await controller.getTodaySummary(request, "2026-05-25");
assert.equal(summary.totalAmountMinor, 1800);
assert.equal(
  summary.categories.find((item) => item.categoryKey === SurvivalLedgerCategoryKey.Canteen)
    .amountMinor,
  0
);

const report = await controller.getWeeklyReport(request, "2026-05-25");
assert.equal(report.afternoonBoostCount, 1);
assert.equal(report.rankingPlaceholder.isRealRanking, false);

await assert.rejects(
  () => controller.getBill({ headers: { authorization: "Bearer other" } }, imported.bill.id),
  (error) => typeof error?.getStatus === "function" && error.getStatus() === 404
);

await assert.rejects(
  () =>
    controller.importCpsOrder(request, {
      sourceProvider: CpsSourceProvider.Meituan,
      sourceOrderId: "bad-order",
      sourceStatus: CpsOrderStatus.Effective,
      amountMinor: 0,
      currency: CurrencyCode.CNY,
      occurredAt: "2026-05-25T04:00:00.000Z"
    }),
  (error) =>
    typeof error?.getStatus === "function" &&
    error.getStatus() === 400 &&
    error.response?.issues?.some((issue) => issue.field === "amountMinor")
);

assert.throws(
  () => controller.createManualBillDisabled(),
  (error) =>
    typeof error?.getStatus === "function" &&
    error.getStatus() === 400 &&
    error.response?.errorCode === "manual_accounting_disabled"
);

process.stdout.write("accounting-ledger api verification passed\n");
