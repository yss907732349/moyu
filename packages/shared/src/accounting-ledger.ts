import { CurrencyCode, type ValidationIssue } from "./work-profile";

export const SurvivalLedgerCategoryKey = {
  Canteen: "canteen",
  AfternoonBoost: "afternoon_boost",
  Commute: "commute"
} as const;

export type SurvivalLedgerCategoryKey =
  (typeof SurvivalLedgerCategoryKey)[keyof typeof SurvivalLedgerCategoryKey];

export const CpsSourceProvider = {
  Meituan: "meituan",
  Eleme: "eleme",
  JdWaimai: "jd_waimai",
  DidiTaxi: "didi_taxi",
  Jutuike: "jutuike"
} as const;

export type CpsSourceProvider = (typeof CpsSourceProvider)[keyof typeof CpsSourceProvider];

export const CpsOrderStatus = {
  Effective: "effective",
  Pending: "pending",
  Unpaid: "unpaid",
  Cancelled: "cancelled",
  Refunded: "refunded",
  Invalid: "invalid",
  RiskRejected: "risk_rejected",
  SettleFailed: "settle_failed",
  Unknown: "unknown"
} as const;

export type CpsOrderStatus = (typeof CpsOrderStatus)[keyof typeof CpsOrderStatus];

export const SurvivalLedgerDisplayStatus = {
  Effective: "effective",
  Pending: "pending",
  Excluded: "excluded",
  RolledBack: "rolled_back"
} as const;

export type SurvivalLedgerDisplayStatus =
  (typeof SurvivalLedgerDisplayStatus)[keyof typeof SurvivalLedgerDisplayStatus];

export const AccountingCurrencyCode = CurrencyCode;
export type AccountingCurrencyCode = CurrencyCode;

export const CpsOrderStateChangeType = {
  FirstSync: "first_sync",
  RepeatSync: "repeat_sync",
  StatusUpgrade: "status_upgrade",
  AmountUpdated: "amount_updated",
  RefundRollback: "refund_rollback",
  ExceptionExcluded: "exception_excluded"
} as const;

export type CpsOrderStateChangeType =
  (typeof CpsOrderStateChangeType)[keyof typeof CpsOrderStateChangeType];

export const CpsLedgerImportAction = {
  Created: "created",
  Updated: "updated",
  Excluded: "excluded",
  RolledBack: "rolled_back",
  Skipped: "skipped",
  Failed: "failed"
} as const;

export type CpsLedgerImportAction =
  (typeof CpsLedgerImportAction)[keyof typeof CpsLedgerImportAction];

export const CpsLedgerExclusionReason = {
  PendingPayment: "pending_payment",
  UnknownStatus: "unknown_status",
  InvalidStatus: "invalid_status",
  Refunded: "refunded",
  Cancelled: "cancelled",
  RiskRejected: "risk_rejected",
  SettleFailed: "settle_failed",
  NoAttribution: "no_attribution",
  AttributionExpired: "attribution_expired",
  ActivityMismatch: "activity_mismatch",
  ClassificationFailed: "classification_failed",
  LedgerImportFailed: "ledger_import_failed"
} as const;

export type CpsLedgerExclusionReason =
  (typeof CpsLedgerExclusionReason)[keyof typeof CpsLedgerExclusionReason];

export interface SurvivalLedgerCategory {
  key: SurvivalLedgerCategoryKey;
  displayName: string;
  iconKey: string;
  displayOrder: number;
}

export interface CpsSurvivalOrderSource {
  sourceProvider: CpsSourceProvider;
  sourceOrderId: string;
  sourceStatus: CpsOrderStatus;
  amountMinor: number;
  currency?: AccountingCurrencyCode;
  occurredAt: string;
  productTitle?: string;
  productCategory?: string;
  merchantTags?: readonly string[];
  commuteDistanceMeters?: number | null;
  attribution?: CpsOrderAttributionContext;
  ledgerExclusionReason?: CpsLedgerExclusionReason;
  stateHistory?: readonly CpsOrderStateHistoryEntry[];
}

export interface CpsOrderIdempotencyKey {
  sourceProvider: CpsSourceProvider;
  sourceOrderId: string;
  key: string;
}

export interface CpsOrderAttributionContext {
  supplyItemId?: string;
  activityId?: string;
  sidMasked?: string;
  matchedClickId?: string;
  attributionWindowEndsAt?: string;
}

export interface CpsOrderStateHistoryEntry {
  changedAt: string;
  changeType: CpsOrderStateChangeType;
  sourceStatus: CpsOrderStatus;
  previousSourceStatus?: CpsOrderStatus;
  amountMinor: number;
  previousAmountMinor?: number;
  ledgerAction: CpsLedgerImportAction;
  reason?: CpsLedgerExclusionReason | string;
}

export interface CpsOrderLedgerDecision {
  idempotencyKey: CpsOrderIdempotencyKey;
  sourceStatus: CpsOrderStatus;
  displayStatus: SurvivalLedgerDisplayStatus;
  countsTowardConsumption: boolean;
  ledgerAction: CpsLedgerImportAction;
  reason?: CpsLedgerExclusionReason;
}

export interface SurvivalLedgerBillSnapshot {
  id: string;
  userId: string;
  amountMinor: number;
  currency: AccountingCurrencyCode;
  categoryKey: SurvivalLedgerCategoryKey;
  displayTitle: string;
  occurredAt: string;
  occurredOn: string;
  orderStatus: CpsOrderStatus;
  displayStatus: SurvivalLedgerDisplayStatus;
  countsTowardConsumption: boolean;
  displayStatusReason?: string;
  commuteDistanceMeters?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListSurvivalLedgerBillsRequest {
  startDate?: string;
  endDate?: string;
  categoryKey?: SurvivalLedgerCategoryKey;
}

export interface SurvivalLedgerBillResponse {
  bill: SurvivalLedgerBillSnapshot;
}

export interface ListSurvivalLedgerBillsResponse {
  bills: SurvivalLedgerBillSnapshot[];
}

export interface SurvivalLedgerCategoryAmount {
  categoryKey: SurvivalLedgerCategoryKey;
  displayName: string;
  amountMinor: number;
  orderCount: number;
}

export interface SurvivalLedgerTodaySummaryResponse {
  businessDate: string;
  totalAmountMinor: number;
  categories: SurvivalLedgerCategoryAmount[];
}

export interface SurvivalLedgerWeeklyReportResponse {
  weekStartDate: string;
  weekEndDate: string;
  totalAmountMinor: number;
  categoryAmounts: SurvivalLedgerCategoryAmount[];
  canteenOrderCount: number;
  afternoonBoostCount: number;
  commuteOrderCount: number;
  commuteDistanceMeters: number | null;
  commuteDistanceReliable: boolean;
  rankingPlaceholder: {
    text: string;
    isRealRanking: false;
  };
}

export interface ImportCpsSurvivalOrderRequest extends CpsSurvivalOrderSource {
  userId: string;
}

export interface AccountingLedgerValidationErrorResponse {
  errorCode: "accounting_ledger_validation_error";
  message: string;
  issues: readonly ValidationIssue[];
}

export class AccountingLedgerValidationError extends Error {
  readonly issues: readonly ValidationIssue[];

  constructor(issues: readonly ValidationIssue[]) {
    super(issues.map((issue) => `${issue.field}: ${issue.message}`).join("; "));
    this.name = "AccountingLedgerValidationError";
    this.issues = issues;
  }
}

export const BUILTIN_SURVIVAL_LEDGER_CATEGORIES: readonly SurvivalLedgerCategory[] = [
  {
    key: SurvivalLedgerCategoryKey.Canteen,
    displayName: "隐者食堂",
    iconKey: "px-icon-ledger-canteen",
    displayOrder: 10
  },
  {
    key: SurvivalLedgerCategoryKey.AfternoonBoost,
    displayName: "下午续命",
    iconKey: "px-icon-ledger-afternoon-boost",
    displayOrder: 20
  },
  {
    key: SurvivalLedgerCategoryKey.Commute,
    displayName: "通勤",
    iconKey: "px-icon-ledger-commute",
    displayOrder: 30
  }
] as const;

export const AFTERNOON_BOOST_KEYWORDS = [
  "咖啡",
  "拿铁",
  "美式",
  "奶茶",
  "茶饮",
  "果茶",
  "甜品",
  "甜点",
  "蛋糕",
  "下午茶"
] as const;

const ACCOUNTING_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MIN_ACCOUNTING_DATE = "2000-01-01";
const MAX_ACCOUNTING_DATE = "2100-12-31";
const MIN_AMOUNT_MINOR = 1;
const MAX_AMOUNT_MINOR = 999_999_999;

export function isSurvivalLedgerCategoryKey(value: string): value is SurvivalLedgerCategoryKey {
  return (Object.values(SurvivalLedgerCategoryKey) as string[]).includes(value);
}

export function isCpsSourceProvider(value: string): value is CpsSourceProvider {
  return (Object.values(CpsSourceProvider) as string[]).includes(value);
}

export function isCpsOrderStatus(value: string): value is CpsOrderStatus {
  return (Object.values(CpsOrderStatus) as string[]).includes(value);
}

export function isSurvivalLedgerDisplayStatus(value: string): value is SurvivalLedgerDisplayStatus {
  return (Object.values(SurvivalLedgerDisplayStatus) as string[]).includes(value);
}

export function getSurvivalLedgerCategory(
  categoryKey: SurvivalLedgerCategoryKey
): SurvivalLedgerCategory | undefined {
  return BUILTIN_SURVIVAL_LEDGER_CATEGORIES.find((category) => category.key === categoryKey);
}

export function classifyCpsSurvivalOrder(
  source: Pick<
    CpsSurvivalOrderSource,
    "sourceProvider" | "productTitle" | "productCategory" | "merchantTags"
  >
): SurvivalLedgerCategoryKey {
  return tryClassifyCpsSurvivalOrder(source) ?? SurvivalLedgerCategoryKey.Canteen;
}

export function tryClassifyCpsSurvivalOrder(
  source: Pick<
    CpsSurvivalOrderSource,
    "sourceProvider" | "productTitle" | "productCategory" | "merchantTags"
  >
): SurvivalLedgerCategoryKey | undefined {
  if (source.sourceProvider === CpsSourceProvider.DidiTaxi) {
    return SurvivalLedgerCategoryKey.Commute;
  }

  if (source.sourceProvider === CpsSourceProvider.Jutuike) {
    if (source.productCategory && isSurvivalLedgerCategoryKey(source.productCategory)) {
      return source.productCategory;
    }

    const haystack = [source.productTitle, source.productCategory, ...(source.merchantTags ?? [])]
      .filter((item): item is string => typeof item === "string")
      .join(" ")
      .toLowerCase();

    if (/(滴滴|花小猪|高德|打车|出行|taxi)/i.test(haystack)) {
      return SurvivalLedgerCategoryKey.Commute;
    }

    if (matchesAfternoonBoostKeywords(source)) {
      return SurvivalLedgerCategoryKey.AfternoonBoost;
    }

    if (/(外卖|午餐|午饭|晚餐|饭|餐|canteen|waimai|eleme|meituan)/i.test(haystack)) {
      return SurvivalLedgerCategoryKey.Canteen;
    }

    return undefined;
  }

  if (matchesAfternoonBoostKeywords(source)) {
    return SurvivalLedgerCategoryKey.AfternoonBoost;
  }

  return SurvivalLedgerCategoryKey.Canteen;
}

export function matchesAfternoonBoostKeywords(
  source: Pick<CpsSurvivalOrderSource, "productTitle" | "productCategory" | "merchantTags">
): boolean {
  const haystack = [source.productTitle, source.productCategory, ...(source.merchantTags ?? [])]
    .filter((item): item is string => typeof item === "string")
    .join(" ")
    .toLowerCase();

  return AFTERNOON_BOOST_KEYWORDS.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

export function isEffectiveSurvivalOrderStatus(status: CpsOrderStatus): boolean {
  return status === CpsOrderStatus.Effective;
}

export function toSurvivalLedgerDisplayStatus(status: CpsOrderStatus): SurvivalLedgerDisplayStatus {
  if (status === CpsOrderStatus.Effective) {
    return SurvivalLedgerDisplayStatus.Effective;
  }

  if (
    status === CpsOrderStatus.Pending ||
    status === CpsOrderStatus.Unpaid ||
    status === CpsOrderStatus.Unknown
  ) {
    return SurvivalLedgerDisplayStatus.Pending;
  }

  if (status === CpsOrderStatus.Refunded || status === CpsOrderStatus.Cancelled) {
    return SurvivalLedgerDisplayStatus.RolledBack;
  }

  return SurvivalLedgerDisplayStatus.Excluded;
}

export function createCpsSourceOrderKey(input: {
  sourceProvider: CpsSourceProvider;
  sourceOrderId: string;
}): CpsOrderIdempotencyKey {
  return {
    sourceProvider: input.sourceProvider,
    sourceOrderId: input.sourceOrderId,
    key: `${input.sourceProvider}:${input.sourceOrderId}`
  };
}

export function decideCpsLedgerImport(input: {
  sourceProvider: CpsSourceProvider;
  sourceOrderId: string;
  sourceStatus: CpsOrderStatus;
  previousSourceStatus?: CpsOrderStatus;
  previousAmountMinor?: number;
  amountMinor: number;
  reason?: CpsLedgerExclusionReason;
}): CpsOrderLedgerDecision {
  const displayStatus = toSurvivalLedgerDisplayStatus(input.sourceStatus);
  const countsTowardConsumption = isEffectiveSurvivalOrderStatus(input.sourceStatus);
  const wasEffective = input.previousSourceStatus === CpsOrderStatus.Effective;
  const ledgerAction = countsTowardConsumption
    ? input.previousSourceStatus
      ? CpsLedgerImportAction.Updated
      : CpsLedgerImportAction.Created
    : wasEffective
      ? CpsLedgerImportAction.RolledBack
      : CpsLedgerImportAction.Excluded;

  return {
    idempotencyKey: createCpsSourceOrderKey(input),
    sourceStatus: input.sourceStatus,
    displayStatus,
    countsTowardConsumption,
    ledgerAction,
    reason: input.reason ?? cpsLedgerExclusionReasonForStatus(input.sourceStatus)
  };
}

export function appendCpsOrderStateHistory(input: {
  history?: readonly CpsOrderStateHistoryEntry[];
  sourceStatus: CpsOrderStatus;
  previousSourceStatus?: CpsOrderStatus;
  amountMinor: number;
  previousAmountMinor?: number;
  ledgerAction: CpsLedgerImportAction;
  reason?: CpsLedgerExclusionReason | string;
  now?: string;
}): CpsOrderStateHistoryEntry[] {
  const changeType =
    input.previousSourceStatus === undefined
      ? CpsOrderStateChangeType.FirstSync
      : input.previousSourceStatus !== input.sourceStatus &&
          (input.sourceStatus === CpsOrderStatus.Refunded ||
            input.sourceStatus === CpsOrderStatus.Cancelled ||
            input.sourceStatus === CpsOrderStatus.Invalid ||
            input.sourceStatus === CpsOrderStatus.RiskRejected ||
            input.sourceStatus === CpsOrderStatus.SettleFailed)
        ? CpsOrderStateChangeType.RefundRollback
        : input.previousSourceStatus !== input.sourceStatus
          ? CpsOrderStateChangeType.StatusUpgrade
          : input.previousAmountMinor !== undefined &&
              input.previousAmountMinor !== input.amountMinor
            ? CpsOrderStateChangeType.AmountUpdated
            : input.ledgerAction === CpsLedgerImportAction.Excluded
              ? CpsOrderStateChangeType.ExceptionExcluded
              : CpsOrderStateChangeType.RepeatSync;

  return [
    ...(input.history ?? []),
    {
      changedAt: input.now ?? new Date().toISOString(),
      changeType,
      sourceStatus: input.sourceStatus,
      previousSourceStatus: input.previousSourceStatus,
      amountMinor: input.amountMinor,
      previousAmountMinor: input.previousAmountMinor,
      ledgerAction: input.ledgerAction,
      reason: input.reason
    }
  ];
}

export function cpsLedgerExclusionReasonForStatus(
  status: CpsOrderStatus
): CpsLedgerExclusionReason | undefined {
  if (status === CpsOrderStatus.Pending || status === CpsOrderStatus.Unpaid) {
    return CpsLedgerExclusionReason.PendingPayment;
  }
  if (status === CpsOrderStatus.Unknown) {
    return CpsLedgerExclusionReason.UnknownStatus;
  }
  if (status === CpsOrderStatus.Refunded) {
    return CpsLedgerExclusionReason.Refunded;
  }
  if (status === CpsOrderStatus.Cancelled) {
    return CpsLedgerExclusionReason.Cancelled;
  }
  if (status === CpsOrderStatus.RiskRejected) {
    return CpsLedgerExclusionReason.RiskRejected;
  }
  if (status === CpsOrderStatus.SettleFailed) {
    return CpsLedgerExclusionReason.SettleFailed;
  }
  if (status === CpsOrderStatus.Invalid) {
    return CpsLedgerExclusionReason.InvalidStatus;
  }
  return undefined;
}

export function createSurvivalLedgerBillSnapshot(input: {
  id: string;
  userId: string;
  source: CpsSurvivalOrderSource;
  now: string;
}): SurvivalLedgerBillSnapshot {
  validateCpsSurvivalOrderSource(input.source);
  const categoryKey = classifyCpsSurvivalOrder(input.source);
  const occurredOn = toBusinessDate(input.source.occurredAt);
  const orderStatus = input.source.sourceStatus;

  return {
    id: input.id,
    userId: input.userId,
    amountMinor: input.source.amountMinor,
    currency: input.source.currency ?? CurrencyCode.CNY,
    categoryKey,
    displayTitle: buildSurvivalLedgerDisplayTitle(categoryKey, input.source),
    occurredAt: input.source.occurredAt,
    occurredOn,
    orderStatus,
    displayStatus: toSurvivalLedgerDisplayStatus(orderStatus),
    countsTowardConsumption: isEffectiveSurvivalOrderStatus(orderStatus),
    displayStatusReason: buildDisplayStatusReason(orderStatus, input.source.ledgerExclusionReason),
    commuteDistanceMeters: input.source.commuteDistanceMeters ?? null,
    createdAt: input.now,
    updatedAt: input.now
  };
}

export function calculateSurvivalLedgerTodaySummary(input: {
  bills: readonly SurvivalLedgerBillSnapshot[];
  businessDate: string;
}): SurvivalLedgerTodaySummaryResponse {
  const issues: ValidationIssue[] = [];
  validateBusinessDate(input.businessDate, issues, "businessDate");
  throwIfAccountingIssues(issues);

  const effectiveBills = input.bills.filter(
    (bill) => bill.countsTowardConsumption && bill.occurredOn === input.businessDate
  );

  return {
    businessDate: input.businessDate,
    totalAmountMinor: sumAmount(effectiveBills),
    categories: buildCategoryAmounts(effectiveBills)
  };
}

export function calculateSurvivalLedgerWeeklyReport(input: {
  bills: readonly SurvivalLedgerBillSnapshot[];
  businessDate: string;
}): SurvivalLedgerWeeklyReportResponse {
  const issues: ValidationIssue[] = [];
  validateBusinessDate(input.businessDate, issues, "businessDate");
  throwIfAccountingIssues(issues);

  const { weekStartDate, weekEndDate } = getWeekRange(input.businessDate);
  const effectiveBills = input.bills.filter(
    (bill) =>
      bill.countsTowardConsumption &&
      bill.occurredOn >= weekStartDate &&
      bill.occurredOn <= weekEndDate
  );
  const canteenBills = effectiveBills.filter(
    (bill) => bill.categoryKey === SurvivalLedgerCategoryKey.Canteen
  );
  const afternoonBills = effectiveBills.filter(
    (bill) => bill.categoryKey === SurvivalLedgerCategoryKey.AfternoonBoost
  );
  const commuteBills = effectiveBills.filter(
    (bill) => bill.categoryKey === SurvivalLedgerCategoryKey.Commute
  );
  const reliableDistances = commuteBills
    .map((bill) => bill.commuteDistanceMeters)
    .filter((value): value is number => typeof value === "number" && value >= 0);

  return {
    weekStartDate,
    weekEndDate,
    totalAmountMinor: sumAmount(effectiveBills),
    categoryAmounts: buildCategoryAmounts(effectiveBills),
    canteenOrderCount: canteenBills.length,
    afternoonBoostCount: afternoonBills.length,
    commuteOrderCount: commuteBills.length,
    commuteDistanceMeters:
      reliableDistances.length > 0
        ? reliableDistances.reduce((sum, distance) => sum + distance, 0)
        : null,
    commuteDistanceReliable: reliableDistances.length > 0,
    rankingPlaceholder: {
      text: "击败百分比待排行榜能力开放后计算",
      isRealRanking: false
    }
  };
}

export function validateListSurvivalLedgerBillsRequest(
  request: ListSurvivalLedgerBillsRequest
): void {
  const issues: ValidationIssue[] = [];

  if (request.startDate !== undefined) {
    validateBusinessDate(request.startDate, issues, "startDate");
  }

  if (request.endDate !== undefined) {
    validateBusinessDate(request.endDate, issues, "endDate");
  }

  if (
    request.startDate !== undefined &&
    request.endDate !== undefined &&
    request.startDate > request.endDate
  ) {
    issues.push({ field: "endDate", message: "结束日期不能早于开始日期" });
  }

  if (
    request.categoryKey !== undefined &&
    !isSurvivalLedgerCategoryKey(String(request.categoryKey))
  ) {
    issues.push({ field: "categoryKey", message: "生存分类无效" });
  }

  throwIfAccountingIssues(issues);
}

export function validateCpsSurvivalOrderSource(source: CpsSurvivalOrderSource): void {
  const issues: ValidationIssue[] = [];

  if (!isCpsSourceProvider(String(source.sourceProvider))) {
    issues.push({ field: "sourceProvider", message: "CPS 来源平台无效" });
  }

  if (typeof source.sourceOrderId !== "string" || source.sourceOrderId.trim() === "") {
    issues.push({ field: "sourceOrderId", message: "CPS 来源订单 ID 不能为空" });
  }

  if (!isCpsOrderStatus(String(source.sourceStatus))) {
    issues.push({ field: "sourceStatus", message: "CPS 来源状态无效" });
  }

  validateAmountMinor(source.amountMinor, issues);

  if (source.currency !== undefined && source.currency !== CurrencyCode.CNY) {
    issues.push({ field: "currency", message: "第一版仅支持 CNY" });
  }

  if (!isValidIsoDateTime(source.occurredAt)) {
    issues.push({ field: "occurredAt", message: "发生时间必须是有效 ISO 时间" });
  }

  if (
    source.commuteDistanceMeters !== undefined &&
    source.commuteDistanceMeters !== null &&
    (!Number.isFinite(source.commuteDistanceMeters) || source.commuteDistanceMeters < 0)
  ) {
    issues.push({ field: "commuteDistanceMeters", message: "通勤距离不能为负数" });
  }

  throwIfAccountingIssues(issues);
}

export function getBusinessDateForAccounting(now: Date = new Date()): string {
  return toDateString(now);
}

function buildSurvivalLedgerDisplayTitle(
  categoryKey: SurvivalLedgerCategoryKey,
  source: CpsSurvivalOrderSource
): string {
  if (categoryKey === SurvivalLedgerCategoryKey.Commute) {
    return "影遁通勤";
  }

  if (categoryKey === SurvivalLedgerCategoryKey.AfternoonBoost) {
    return source.productTitle?.trim() ? "下午续命补给" : "冰咖啡补给";
  }

  return "午间补给";
}

function buildDisplayStatusReason(
  status: CpsOrderStatus,
  reason?: CpsLedgerExclusionReason
): string | undefined {
  if (status === CpsOrderStatus.Effective) {
    return "订单同步后已自动收纳";
  }

  if (status === CpsOrderStatus.Pending || status === CpsOrderStatus.Unpaid) {
    return "订单仍在同步确认中，暂未计入";
  }

  if (status === CpsOrderStatus.Refunded || status === CpsOrderStatus.Cancelled) {
    return "补给已失效，未计入生存消耗";
  }

  if (reason === CpsLedgerExclusionReason.ClassificationFailed) {
    return "补给分类待确认，暂未计入";
  }

  return "该补给未计入生存消耗";
}

function buildCategoryAmounts(
  bills: readonly SurvivalLedgerBillSnapshot[]
): SurvivalLedgerCategoryAmount[] {
  return BUILTIN_SURVIVAL_LEDGER_CATEGORIES.map((category) => {
    const categoryBills = bills.filter((bill) => bill.categoryKey === category.key);

    return {
      categoryKey: category.key,
      displayName: category.displayName,
      amountMinor: sumAmount(categoryBills),
      orderCount: categoryBills.length
    };
  });
}

function sumAmount(bills: readonly Pick<SurvivalLedgerBillSnapshot, "amountMinor">[]): number {
  return bills.reduce((sum, bill) => sum + bill.amountMinor, 0);
}

function getWeekRange(businessDate: string): { weekStartDate: string; weekEndDate: string } {
  const date = new Date(`${businessDate}T00:00:00+08:00`);
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = new Date(date);
  start.setDate(date.getDate() + mondayOffset);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    weekStartDate: toDateString(start),
    weekEndDate: toDateString(end)
  };
}

function toBusinessDate(isoDateTime: string): string {
  return getBusinessDateForAccounting(new Date(isoDateTime));
}

function validateAmountMinor(amountMinor: unknown, issues: ValidationIssue[]): void {
  if (
    typeof amountMinor !== "number" ||
    !Number.isInteger(amountMinor) ||
    amountMinor < MIN_AMOUNT_MINOR ||
    amountMinor > MAX_AMOUNT_MINOR
  ) {
    issues.push({
      field: "amountMinor",
      message: `金额必须是 ${MIN_AMOUNT_MINOR} 到 ${MAX_AMOUNT_MINOR} 分之间的整数`
    });
  }
}

function validateBusinessDate(
  businessDate: unknown,
  issues: ValidationIssue[],
  field = "businessDate"
): void {
  const parsedDate =
    typeof businessDate === "string" && ACCOUNTING_DATE_PATTERN.test(businessDate)
      ? new Date(`${businessDate}T00:00:00+08:00`)
      : null;

  if (
    typeof businessDate !== "string" ||
    !ACCOUNTING_DATE_PATTERN.test(businessDate) ||
    !parsedDate ||
    Number.isNaN(parsedDate.getTime()) ||
    toDateString(parsedDate) !== businessDate ||
    businessDate < MIN_ACCOUNTING_DATE ||
    businessDate > MAX_ACCOUNTING_DATE
  ) {
    issues.push({ field, message: "业务日期格式必须为 YYYY-MM-DD 且位于支持范围内" });
  }
}

function isValidIsoDateTime(value: unknown): boolean {
  if (typeof value !== "string") {
    return false;
  }

  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function throwIfAccountingIssues(issues: readonly ValidationIssue[]): void {
  if (issues.length > 0) {
    throw new AccountingLedgerValidationError(issues);
  }
}

function toDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}
