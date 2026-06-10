import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import {
  CpsOrderStatus,
  CurrencyCode,
  SurvivalLedgerCategoryKey,
  SurvivalLedgerDisplayStatus,
  type ListSurvivalLedgerBillsResponse,
  type SurvivalLedgerBillSnapshot,
  type SurvivalLedgerTodaySummaryResponse,
  type SurvivalLedgerWeeklyReportResponse
} from "@moyuxia/shared";
import {
  AccountingLedgerClientError,
  getSurvivalLedgerTodaySummary,
  getSurvivalLedgerWeeklyReport,
  isListSurvivalLedgerBillsResponse,
  isSurvivalLedgerBillSnapshot,
  isSurvivalLedgerTodaySummaryResponse,
  isSurvivalLedgerWeeklyReportResponse,
  listSurvivalLedgerBills,
  normalizeAccountingLedgerError
} from "../apps/miniapp/src/services/accounting-ledger.ts";

const bill: SurvivalLedgerBillSnapshot = {
  id: "survival-bill-1",
  userId: "dev-user",
  amountMinor: 1288,
  currency: CurrencyCode.CNY,
  categoryKey: SurvivalLedgerCategoryKey.Canteen,
  displayTitle: "午间补给",
  occurredAt: "2026-05-25T04:00:00.000Z",
  occurredOn: "2026-05-25",
  orderStatus: CpsOrderStatus.Effective,
  displayStatus: SurvivalLedgerDisplayStatus.Effective,
  countsTowardConsumption: true,
  commuteDistanceMeters: null,
  createdAt: "2026-05-25T08:00:00.000Z",
  updatedAt: "2026-05-25T08:00:00.000Z"
};

const listResponse: ListSurvivalLedgerBillsResponse = { bills: [bill] };
const summaryResponse: SurvivalLedgerTodaySummaryResponse = {
  businessDate: "2026-05-25",
  totalAmountMinor: 1288,
  categories: [
    {
      categoryKey: SurvivalLedgerCategoryKey.Canteen,
      displayName: "隐者食堂",
      amountMinor: 1288,
      orderCount: 1
    },
    {
      categoryKey: SurvivalLedgerCategoryKey.AfternoonBoost,
      displayName: "下午续命",
      amountMinor: 0,
      orderCount: 0
    },
    {
      categoryKey: SurvivalLedgerCategoryKey.Commute,
      displayName: "通勤",
      amountMinor: 0,
      orderCount: 0
    }
  ]
};
const weeklyResponse: SurvivalLedgerWeeklyReportResponse = {
  weekStartDate: "2026-05-25",
  weekEndDate: "2026-05-31",
  totalAmountMinor: 1288,
  categoryAmounts: summaryResponse.categories,
  canteenOrderCount: 1,
  afternoonBoostCount: 0,
  commuteOrderCount: 0,
  commuteDistanceMeters: null,
  commuteDistanceReliable: false,
  rankingPlaceholder: {
    text: "击败百分比待排行榜能力开放后计算",
    isRealRanking: false
  }
};

const storageUni = {
  getStorageSync: () => "token"
};

(globalThis as typeof globalThis & { uni: typeof storageUni }).uni = storageUni;

const requestSuccess = (data: unknown): typeof uni.request =>
  ((options: UniApp.RequestOptions) => {
    options.success?.({
      statusCode: 200,
      data,
      header: {},
      cookies: []
    } as UniApp.RequestSuccessCallbackResult);
    return {} as UniApp.RequestTask;
  }) as typeof uni.request;

assert.equal(isSurvivalLedgerBillSnapshot(bill), true);
assert.equal(isSurvivalLedgerBillSnapshot({ ...bill, sourceProvider: "meituan" }), false);
assert.equal(isListSurvivalLedgerBillsResponse(listResponse), true);
assert.equal(isSurvivalLedgerTodaySummaryResponse(summaryResponse), true);
assert.equal(isSurvivalLedgerWeeklyReportResponse(weeklyResponse), true);

assert.equal(
  (
    await listSurvivalLedgerBills(
      {
        startDate: "2026-05-01",
        endDate: "2026-05-31",
        categoryKey: SurvivalLedgerCategoryKey.Canteen
      },
      { request: requestSuccess(listResponse) }
    )
  ).bills[0].id,
  "survival-bill-1"
);
assert.equal(
  (await getSurvivalLedgerTodaySummary("2026-05-25", { request: requestSuccess(summaryResponse) }))
    .totalAmountMinor,
  1288
);
assert.equal(
  (await getSurvivalLedgerWeeklyReport("2026-05-25", { request: requestSuccess(weeklyResponse) }))
    .rankingPlaceholder.isRealRanking,
  false
);

await assert.rejects(
  () => getSurvivalLedgerTodaySummary("2026-05-25", { request: requestSuccess({ bad: true }) }),
  AccountingLedgerClientError
);

const requestValidationFailure: typeof uni.request = ((options: UniApp.RequestOptions) => {
  options.success?.({
    statusCode: 400,
    data: {
      errorCode: "accounting_ledger_validation_error",
      message: "生存账本校验失败",
      issues: [{ field: "businessDate", message: "日期无效" }]
    },
    header: {},
    cookies: []
  } as UniApp.RequestSuccessCallbackResult);
  return {} as UniApp.RequestTask;
}) as typeof uni.request;

await assert.rejects(
  () => getSurvivalLedgerTodaySummary("bad", { request: requestValidationFailure }),
  (error) => normalizeAccountingLedgerError(error).fieldErrors.businessDate === "日期无效"
);

const requestNetworkFailure: typeof uni.request = ((options: UniApp.RequestOptions) => {
  options.fail?.({ errMsg: "request:fail timeout" });
  return {} as UniApp.RequestTask;
}) as typeof uni.request;

await assert.rejects(
  () => getSurvivalLedgerWeeklyReport("2026-05-25", { request: requestNetworkFailure }),
  (error) => normalizeAccountingLedgerError(error).message.includes("网络异常")
);

const homeSource = readFileSync("apps/miniapp/src/pages/home/index.vue", "utf8");
assert.equal(homeSource.includes("今日生存消耗"), true);
assert.equal(homeSource.includes("getSurvivalLedgerTodaySummary"), true);
assert.equal(homeSource.includes("/pages/accounting-ledger/record"), false);
assert.equal(homeSource.includes("/pages/accounting-ledger/index"), true);
assert.equal(homeSource.includes("记一笔"), false);
assert.equal(homeSource.includes("查看详情"), true);
assert.equal(homeSource.includes("totalAmountMinor / 100"), true);
assert.equal(homeSource.includes("生存账本暂不可用"), true);

const serviceSource = readFileSync("apps/miniapp/src/services/accounting-ledger.ts", "utf8");
assert.equal(serviceSource.includes("sourceProvider"), true);
assert.equal(serviceSource.includes('!("sourceProvider" in value)'), true);
assert.equal(serviceSource.includes("updateAccountingBill"), false);
assert.equal(serviceSource.includes("voidAccountingBill"), false);

const ledgerIndexSource = readFileSync(
  "apps/miniapp/src/pages/accounting-ledger/index.vue",
  "utf8"
);
assert.equal(ledgerIndexSource.includes("本周生存报告"), true);
assert.equal(ledgerIndexSource.includes("近期订单详情"), true);
assert.equal(ledgerIndexSource.includes("保存修改"), false);
assert.equal(ledgerIndexSource.includes("删除"), false);
assert.equal(ledgerIndexSource.includes("暂无同步到的生存消耗"), true);
assert.equal(ledgerIndexSource.includes("订单同步后会自动归类"), true);
assert.equal(ledgerIndexSource.includes("¥0.00"), true);
assert.equal(ledgerIndexSource.includes("美团"), false);
assert.equal(ledgerIndexSource.includes("饿了么"), false);
assert.equal(ledgerIndexSource.includes("滴滴"), false);

const recordSource = readFileSync("apps/miniapp/src/pages/accounting-ledger/record.vue", "utf8");
assert.equal(recordSource.includes("手动记一笔"), true);
assert.equal(recordSource.includes("redirectTo"), true);

const pagesJson = readFileSync("apps/miniapp/src/pages.json", "utf8");
const seedStrategyPath =
  "openspec/changes/archive/2026-05-28-stabilize-miniapp-first-run-user-flow/dev-seed-strategy.md";
assert.equal(
  existsSync(seedStrategyPath),
  true,
  `缺少首跑开发种子策略归档文档：${seedStrategyPath}`
);
const seedStrategy = readFileSync(seedStrategyPath, "utf8");
assert.equal(pagesJson.includes("pages/accounting-ledger/record"), true);
assert.equal(pagesJson.includes("pages/accounting-ledger/index"), true);
assert.equal(serviceSource.includes("seed"), false);
assert.equal(seedStrategy.includes("普通用户首跑不得自动创建外卖、下午茶或通勤假订单"), true);
assert.equal(seedStrategy.includes("不是依赖伪造消费通过"), true);

process.stdout.write("miniapp accounting-ledger verification passed\n");
