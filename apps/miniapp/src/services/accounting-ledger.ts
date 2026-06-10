import {
  CurrencyCode,
  isCpsOrderStatus,
  isSurvivalLedgerCategoryKey,
  isSurvivalLedgerDisplayStatus,
  type ListSurvivalLedgerBillsRequest,
  type ListSurvivalLedgerBillsResponse,
  type SurvivalLedgerBillResponse,
  type SurvivalLedgerBillSnapshot,
  type SurvivalLedgerTodaySummaryResponse,
  type SurvivalLedgerWeeklyReportResponse,
  type ValidationIssue
} from "@moyuxia/shared";
import { getMiniappApiBaseUrl, MINIAPP_API_TIMEOUT_MS } from "./api-config.ts";

const AUTH_TOKEN_STORAGE_KEY = "moyuxia.authToken";
const apiBaseUrl = getMiniappApiBaseUrl();

interface AccountingRequestOptions {
  request?: typeof uni.request;
}

export interface NormalizedAccountingError {
  message: string;
  fieldErrors: Record<string, string>;
}

export class AccountingLedgerClientError extends Error {
  readonly fieldErrors: Record<string, string>;

  constructor(message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "AccountingLedgerClientError";
    this.fieldErrors = fieldErrors;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getAuthHeaders(): Record<string, string> {
  try {
    const token = uni.getStorageSync(AUTH_TOKEN_STORAGE_KEY) as unknown;
    return typeof token === "string" && token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export function isSurvivalLedgerBillSnapshot(value: unknown): value is SurvivalLedgerBillSnapshot {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.userId === "string" &&
    Number.isInteger(value.amountMinor) &&
    value.currency === CurrencyCode.CNY &&
    isSurvivalLedgerCategoryKey(String(value.categoryKey)) &&
    typeof value.displayTitle === "string" &&
    typeof value.occurredAt === "string" &&
    typeof value.occurredOn === "string" &&
    isCpsOrderStatus(String(value.orderStatus)) &&
    isSurvivalLedgerDisplayStatus(String(value.displayStatus)) &&
    typeof value.countsTowardConsumption === "boolean" &&
    (!("commuteDistanceMeters" in value) ||
      value.commuteDistanceMeters === null ||
      Number.isInteger(value.commuteDistanceMeters)) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    !("sourceProvider" in value) &&
    !("sourceOrderId" in value)
  );
}

export function isSurvivalLedgerBillResponse(value: unknown): value is SurvivalLedgerBillResponse {
  return isRecord(value) && isSurvivalLedgerBillSnapshot(value.bill);
}

export function isListSurvivalLedgerBillsResponse(
  value: unknown
): value is ListSurvivalLedgerBillsResponse {
  return (
    isRecord(value) && Array.isArray(value.bills) && value.bills.every(isSurvivalLedgerBillSnapshot)
  );
}

export function isSurvivalLedgerTodaySummaryResponse(
  value: unknown
): value is SurvivalLedgerTodaySummaryResponse {
  return (
    isRecord(value) &&
    typeof value.businessDate === "string" &&
    Number.isInteger(value.totalAmountMinor) &&
    Array.isArray(value.categories) &&
    value.categories.every(isCategoryAmount)
  );
}

export function isSurvivalLedgerWeeklyReportResponse(
  value: unknown
): value is SurvivalLedgerWeeklyReportResponse {
  return (
    isRecord(value) &&
    typeof value.weekStartDate === "string" &&
    typeof value.weekEndDate === "string" &&
    Number.isInteger(value.totalAmountMinor) &&
    Array.isArray(value.categoryAmounts) &&
    value.categoryAmounts.every(isCategoryAmount) &&
    Number.isInteger(value.canteenOrderCount) &&
    Number.isInteger(value.afternoonBoostCount) &&
    Number.isInteger(value.commuteOrderCount) &&
    (value.commuteDistanceMeters === null || Number.isInteger(value.commuteDistanceMeters)) &&
    typeof value.commuteDistanceReliable === "boolean" &&
    isRecord(value.rankingPlaceholder) &&
    value.rankingPlaceholder.isRealRanking === false
  );
}

function isCategoryAmount(value: unknown): boolean {
  return (
    isRecord(value) &&
    isSurvivalLedgerCategoryKey(String(value.categoryKey)) &&
    typeof value.displayName === "string" &&
    Number.isInteger(value.amountMinor) &&
    Number.isInteger(value.orderCount)
  );
}

function normalizeValidationIssues(data: unknown): NormalizedAccountingError | null {
  if (!isRecord(data) || !Array.isArray(data.issues)) {
    return null;
  }

  const fieldErrors: Record<string, string> = {};

  for (const issue of data.issues as ValidationIssue[]) {
    if (isRecord(issue) && typeof issue.field === "string" && typeof issue.message === "string") {
      fieldErrors[issue.field] = issue.message;
    }
  }

  return {
    message: typeof data.message === "string" ? data.message : "生存账本校验失败",
    fieldErrors
  };
}

function requestJson(path: string, request: typeof uni.request): Promise<unknown> {
  return new Promise((resolve, reject) => {
    request({
      url: `${apiBaseUrl}${path}`,
      method: "GET",
      header: getAuthHeaders(),
      timeout: MINIAPP_API_TIMEOUT_MS,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
          return;
        }

        const validationError = normalizeValidationIssues(res.data);
        if (validationError) {
          reject(
            new AccountingLedgerClientError(validationError.message, validationError.fieldErrors)
          );
          return;
        }

        reject(new AccountingLedgerClientError(`生存账本接口返回 ${res.statusCode}`));
      },
      fail: () => reject(new AccountingLedgerClientError("网络异常，请稍后重试"))
    });
  });
}

export async function getSurvivalLedgerTodaySummary(
  businessDate?: string,
  options: AccountingRequestOptions = {}
): Promise<SurvivalLedgerTodaySummaryResponse> {
  const query = businessDate ? `?businessDate=${encodeURIComponent(businessDate)}` : "";
  const data = await requestJson(
    `/me/accounting-ledger/today-summary${query}`,
    options.request ?? uni.request
  );

  if (!isSurvivalLedgerTodaySummaryResponse(data)) {
    throw new AccountingLedgerClientError("今日生存消耗响应结构异常");
  }

  return data;
}

export async function listSurvivalLedgerBills(
  requestBody: ListSurvivalLedgerBillsRequest = {},
  options: AccountingRequestOptions = {}
): Promise<ListSurvivalLedgerBillsResponse> {
  const query = buildQuery({
    startDate: requestBody.startDate,
    endDate: requestBody.endDate,
    categoryKey: requestBody.categoryKey
  });
  const data = await requestJson(
    `/me/accounting-ledger/bills${query ? `?${query}` : ""}`,
    options.request ?? uni.request
  );

  if (!isListSurvivalLedgerBillsResponse(data)) {
    throw new AccountingLedgerClientError("生存账单列表响应结构异常");
  }

  return data;
}

export async function getSurvivalLedgerWeeklyReport(
  businessDate?: string,
  options: AccountingRequestOptions = {}
): Promise<SurvivalLedgerWeeklyReportResponse> {
  const query = businessDate ? `?businessDate=${encodeURIComponent(businessDate)}` : "";
  const data = await requestJson(
    `/me/accounting-ledger/weekly-report${query}`,
    options.request ?? uni.request
  );

  if (!isSurvivalLedgerWeeklyReportResponse(data)) {
    throw new AccountingLedgerClientError("本周生存报告响应结构异常");
  }

  return data;
}

export async function getSurvivalLedgerBill(
  billId: string,
  options: AccountingRequestOptions = {}
): Promise<SurvivalLedgerBillResponse> {
  const data = await requestJson(
    `/me/accounting-ledger/bills/${encodeURIComponent(billId)}`,
    options.request ?? uni.request
  );

  if (!isSurvivalLedgerBillResponse(data)) {
    throw new AccountingLedgerClientError("生存账单详情响应结构异常");
  }

  return data;
}

export function normalizeAccountingLedgerError(error: unknown): NormalizedAccountingError {
  if (error instanceof AccountingLedgerClientError) {
    return {
      message: error.message,
      fieldErrors: error.fieldErrors
    };
  }

  return {
    message: "生存账本暂时不可用",
    fieldErrors: {}
  };
}

function buildQuery(params: Record<string, string | undefined>): string {
  return Object.entries(params)
    .filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1] !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
}
