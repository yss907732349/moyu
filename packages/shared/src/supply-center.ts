import {
  CpsLedgerExclusionReason,
  CpsLedgerImportAction,
  CpsOrderStatus,
  CpsSourceProvider,
  SurvivalLedgerCategoryKey,
  tryClassifyCpsSurvivalOrder,
  type AccountingCurrencyCode,
  type CpsOrderStateHistoryEntry,
  type ImportCpsSurvivalOrderRequest
} from "./accounting-ledger";
import { CurrencyCode, type ValidationIssue } from "./work-profile";

export const SupplySectionKey = {
  Canteen: "canteen",
  AfternoonBoost: "afternoon_boost",
  Commute: "commute"
} as const;

export type SupplySectionKey = (typeof SupplySectionKey)[keyof typeof SupplySectionKey];

export const SupplyActivityGroupKey = {
  Lunch: "lunch",
  AfternoonBoost: "afternoon_boost",
  Commute: "commute",
  General: "general"
} as const;

export type SupplyActivityGroupKey =
  (typeof SupplyActivityGroupKey)[keyof typeof SupplyActivityGroupKey];

export const SupplyItemStatus = {
  Published: "published",
  Draft: "draft",
  Offline: "offline"
} as const;

export type SupplyItemStatus = (typeof SupplyItemStatus)[keyof typeof SupplyItemStatus];

export const SupplyClickJumpStatus = {
  Created: "created",
  Linked: "linked",
  FallbackLinked: "fallback_linked",
  Reused: "reused",
  Failed: "failed",
  Unavailable: "unavailable"
} as const;

export type SupplyClickJumpStatus =
  (typeof SupplyClickJumpStatus)[keyof typeof SupplyClickJumpStatus];

export const SupplyLedgerSyncStatus = {
  NotMatched: "not_matched",
  Imported: "imported",
  Excluded: "excluded",
  RolledBack: "rolled_back",
  Failed: "failed"
} as const;

export type SupplyLedgerSyncStatus =
  (typeof SupplyLedgerSyncStatus)[keyof typeof SupplyLedgerSyncStatus];

export const SupplyDisplayWorkdayRule = {
  AllDays: "all_days",
  WorkdaysOnly: "workdays_only",
  WeekendsOnly: "weekends_only"
} as const;

export type SupplyDisplayWorkdayRule =
  (typeof SupplyDisplayWorkdayRule)[keyof typeof SupplyDisplayWorkdayRule];

export const SupplyRecommendationSlot = {
  Lunch: "lunch",
  Afternoon: "afternoon",
  MorningCommute: "morning_commute",
  EveningCommute: "evening_commute",
  Anytime: "anytime"
} as const;

export type SupplyRecommendationSlot =
  (typeof SupplyRecommendationSlot)[keyof typeof SupplyRecommendationSlot];

export const SupplyFallbackStrategy = {
  None: "none",
  AttributableLink: "attributable_link",
  NonAttributableLink: "non_attributable_link"
} as const;

export type SupplyFallbackStrategy =
  (typeof SupplyFallbackStrategy)[keyof typeof SupplyFallbackStrategy];

export const SupplyTransferAttemptStatus = {
  Created: "created",
  Success: "success",
  Failed: "failed",
  FallbackAttributable: "fallback_attributable",
  FallbackNonAttributable: "fallback_non_attributable",
  Reused: "reused"
} as const;

export type SupplyTransferAttemptStatus =
  (typeof SupplyTransferAttemptStatus)[keyof typeof SupplyTransferAttemptStatus];

export const SupplyAttributionFailureReason = {
  SidMissing: "sid_missing",
  SidNotFound: "sid_not_found",
  SidExpired: "sid_expired",
  ActivityMismatch: "activity_mismatch",
  OrderStatusInvalid: "order_status_invalid",
  OrderUnpaid: "order_unpaid",
  DuplicateOrderUpdated: "duplicate_order_updated",
  ClassificationFailed: "classification_failed",
  LedgerImportFailed: "ledger_import_failed"
} as const;

export type SupplyAttributionFailureReason =
  (typeof SupplyAttributionFailureReason)[keyof typeof SupplyAttributionFailureReason];

export const SupplyOrderExceptionType = {
  NoAttribution: "no_attribution",
  AttributionExpired: "attribution_expired",
  ActivityMismatch: "activity_mismatch",
  InvalidStatus: "invalid_status",
  ClassificationFailed: "classification_failed",
  LedgerImportFailed: "ledger_import_failed"
} as const;

export type SupplyOrderExceptionType =
  (typeof SupplyOrderExceptionType)[keyof typeof SupplyOrderExceptionType];

export const SupplyOrderLedgerAction = CpsLedgerImportAction;
export type SupplyOrderLedgerAction = CpsLedgerImportAction;

export const JUTUIKE_ORDER_STATUS = {
  Paid: "paid",
  Settled: "settled",
  PendingSettle: "pending_settle",
  Unpaid: "unpaid",
  Refunded: "refunded",
  Cancelled: "cancelled",
  Invalid: "invalid",
  Unknown: "unknown",
  RiskRejected: "risk_rejected",
  SettleFailed: "settle_failed"
} as const;

export type JutuikeOrderStatus =
  | (typeof JUTUIKE_ORDER_STATUS)[keyof typeof JUTUIKE_ORDER_STATUS]
  | string;

const PUBLIC_TAG_FORBIDDEN_PATTERN =
  /(cps|聚推客|佣金|返利|apikey|api_key|sid|订单源|结算|内部活动|act_id|brand_id)/i;

export interface SupplyMiniappJumpTarget {
  type: "miniapp";
  appId: string;
  path: string;
  fallbackUrl?: string;
}

export interface SupplyWebviewJumpTarget {
  type: "webview";
  url: string;
}

export type SupplyJumpTarget = SupplyMiniappJumpTarget | SupplyWebviewJumpTarget;

export interface SupplyRecommendationTimeWindow {
  slot: SupplyRecommendationSlot;
  startTime: string;
  endTime: string;
}

export interface SupplySection {
  key: SupplySectionKey;
  title: string;
  description: string;
  displayOrder: number;
  defaultCategoryKey: SurvivalLedgerCategoryKey;
}

export interface SupplyCampaignWhitelistItem {
  key: string;
  displayName: string;
  sectionKey: SupplySectionKey;
  defaultCategoryKey: SurvivalLedgerCategoryKey;
  actId: string;
  sourceName: "jutuike";
  brandAliases: readonly string[];
}

export interface SupplyItemConfig {
  id: string;
  title: string;
  description: string;
  sectionKey: SupplySectionKey;
  coverImageUrl?: string;
  actionText: string;
  sortOrder: number;
  status: SupplyItemStatus;
  validFrom?: string;
  validUntil?: string;
  defaultCategoryKey: SurvivalLedgerCategoryKey;
  jutuikeActId: string;
  jutuikeSourceName: "jutuike";
  internalNote?: string;
  groupKey: SupplyActivityGroupKey;
  userVisibleTags: readonly string[];
  displayPriority: number;
  recommendationTimeWindows: readonly SupplyRecommendationTimeWindow[];
  displayWorkdayRule: SupplyDisplayWorkdayRule;
  attributionWindowHours: number;
  transferExpiresMinutes: number;
  clickDedupeWindowSeconds: number;
  fallbackStrategy: SupplyFallbackStrategy;
  fallbackTargetType?: SupplyJumpTarget["type"];
  fallbackUrl?: string;
  fallbackMiniappAppId?: string;
  fallbackMiniappPath?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicSupplyItem {
  id: string;
  title: string;
  description: string;
  sectionKey: SupplySectionKey;
  groupKey: SupplyActivityGroupKey;
  coverImageUrl?: string;
  actionText: string;
  sortOrder: number;
  displayPriority: number;
  tags: readonly string[];
  clickable: boolean;
  clickableReason?: string;
  recommendationSlots: readonly SupplyRecommendationSlot[];
  recommendedNow: boolean;
  recommendationReason?: string;
  syncHint: string;
}

export interface PublicSupplySection {
  section: SupplySection;
  items: PublicSupplyItem[];
}

export interface SupplyTodayPanel {
  title: string;
  scenarioKey: SupplyRecommendationSlot;
  scenarioLabel: string;
  generatedAt: string;
  mainRecommendation?: PublicSupplyItem;
  sections: PublicSupplySection[];
  syncHint: string;
  emptyHint?: string;
}

export interface SupplyCenterPublicListResponse {
  todayPanel: SupplyTodayPanel;
  mainRecommendation?: PublicSupplyItem;
  sections: PublicSupplySection[];
  syncHint: string;
}

export interface SupplyClickResponse {
  clickId: string;
  sidMasked: string;
  jumpStatus: SupplyClickJumpStatus;
  jumpTarget?: SupplyJumpTarget;
  jumpTargetExpiresAt?: string;
  attributionReliable: boolean;
  ledgerHint: string;
  message: string;
}

export interface SupplyClickAttribution {
  id: string;
  userId: string;
  supplyItemId: string;
  sectionKey: SupplySectionKey;
  defaultCategoryKey: SurvivalLedgerCategoryKey;
  jutuikeActId: string;
  sid: string;
  sidDigest: string;
  sidMasked: string;
  jumpStatus: SupplyClickJumpStatus;
  clickedAt: string;
  updatedAt: string;
  transferExpiresAt: string;
  attributionWindowEndsAt: string;
  failureReason?: string;
  jumpTarget?: SupplyJumpTarget;
  jumpTargetExpiresAt?: string;
  fallbackAttributable?: boolean;
  reusedFromClickId?: string;
}

export interface SupplyTransferAttemptRecord {
  id: string;
  clickId: string;
  supplyItemId: string;
  sidMasked: string;
  status: SupplyTransferAttemptStatus;
  targetType?: SupplyJumpTarget["type"];
  usedFallback: boolean;
  fallbackAttributable: boolean;
  failureReason?: string;
  targetExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JutuikeUnifiedOrder {
  sid?: string;
  orderSn: string;
  brandId?: string;
  actId?: string;
  payPrice: number | string;
  payTime: string;
  status: JutuikeOrderStatus;
  title?: string;
  brandName?: string;
  rawStatus?: string;
}

export interface SupplyOrderSyncRecord {
  id: string;
  sourceProvider: CpsSourceProvider;
  sourceOrderId: string;
  sidMasked?: string;
  actId?: string;
  brandId?: string;
  sourceStatus: string;
  mappedStatus: CpsOrderStatus;
  amountMinor: number;
  paidAt?: string;
  matched: boolean;
  matchedClickId?: string;
  matchedSupplyItemId?: string;
  ledgerSyncStatus: SupplyLedgerSyncStatus;
  ledgerAction: SupplyOrderLedgerAction;
  ledgerBillId?: string;
  attributionFailureReason?: SupplyAttributionFailureReason;
  exceptionType?: SupplyOrderExceptionType;
  failureReason?: string;
  failureExplanation?: string;
  statusHistory: readonly CpsOrderStateHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface SyncJutuikeOrdersRequest {
  orders: JutuikeUnifiedOrder[];
}

export interface SyncJutuikeOrdersResponse {
  records: SupplyOrderSyncRecord[];
}

export interface AdminSupplyItemFilters {
  sectionKey?: SupplySectionKey;
  status?: SupplyItemStatus;
  tag?: string;
  recommendationSlot?: SupplyRecommendationSlot;
  sourceName?: "jutuike";
  effectiveAt?: string;
}

export interface AdminSupplyItemListResponse {
  items: SupplyItemConfig[];
}

export interface AdminSupplyClickListResponse {
  clicks: Omit<SupplyClickAttribution, "sid" | "sidDigest" | "userId" | "jumpTarget">[];
}

export interface AdminSupplyOrderSyncListResponse {
  records: SupplyOrderSyncRecord[];
}

export interface AdminSupplyPublicPreviewResponse {
  preview: SupplyCenterPublicListResponse;
}

export interface AdminSupplyBatchStatusRequest {
  itemIds: readonly string[];
  status: typeof SupplyItemStatus.Published | typeof SupplyItemStatus.Offline;
}

export interface AdminSupplyBatchStatusResponse {
  updated: SupplyItemConfig[];
  failed: readonly { id: string; reason: string }[];
}

export interface AdminSupplyTraceQuery {
  clickId?: string;
  sourceOrderId?: string;
}

export interface AdminSupplyTraceLink {
  sourceActivity?: {
    itemId: string;
    title: string;
    sectionKey: SupplySectionKey;
    activityId: string;
  };
  click?: Omit<SupplyClickAttribution, "sid" | "sidDigest" | "userId" | "jumpTarget">;
  transferAttempts: SupplyTransferAttemptRecord[];
  orderSync?: SupplyOrderSyncRecord;
  ledger?: {
    ledgerBillId?: string;
    syncStatus: SupplyLedgerSyncStatus;
    action: SupplyOrderLedgerAction;
  };
  failure?: {
    reason: SupplyAttributionFailureReason;
    explanation: string;
  };
}

export interface AdminSupplyTraceResponse {
  trace: AdminSupplyTraceLink;
}

export interface AdminSupplyExceptionPoolQuery {
  type?: SupplyOrderExceptionType;
  reason?: SupplyAttributionFailureReason;
  status?: SupplyLedgerSyncStatus;
}

export interface AdminSupplyExceptionPoolItem {
  id: string;
  sourceOrderId: string;
  sourceProvider: CpsSourceProvider;
  occurredAt?: string;
  sourceActivityId?: string;
  sidMasked?: string;
  orderStatus: CpsOrderStatus;
  amountMinor: number;
  exceptionType: SupplyOrderExceptionType;
  failureReason: SupplyAttributionFailureReason;
  failureExplanation: string;
  recoverable: boolean;
  updatedAt: string;
}

export interface AdminSupplyExceptionPoolResponse {
  exceptions: AdminSupplyExceptionPoolItem[];
}

export interface AdminSupplyMetricsQuery {
  startDate?: string;
  endDate?: string;
  itemId?: string;
}

export interface AdminSupplyMetricsResponse {
  generatedAt: string;
  todayClickCount: number;
  uniqueClickUserCount: number;
  transferSuccessRate: number;
  orderReturnCount: number;
  effectiveOrderCount: number;
  ledgerAmountMinor: number;
  exceptionOrderCount: number;
  categoryStats: readonly {
    categoryKey: SurvivalLedgerCategoryKey;
    displayName: string;
    amountMinor: number;
    orderCount: number;
  }[];
  activityStats: readonly {
    itemId: string;
    title: string;
    clickCount: number;
    transferSuccessCount: number;
    orderReturnCount: number;
    effectiveOrderCount: number;
    ledgerAmountMinor: number;
    exceptionReasonCounts: Record<string, number>;
  }[];
}

export const SUPPLY_CENTER_SECTIONS: readonly SupplySection[] = [
  {
    key: SupplySectionKey.Canteen,
    title: "隐者食堂",
    description: "午餐、晚餐和外卖补给",
    displayOrder: 10,
    defaultCategoryKey: SurvivalLedgerCategoryKey.Canteen
  },
  {
    key: SupplySectionKey.AfternoonBoost,
    title: "下午续命",
    description: "咖啡、茶饮和下午茶回血",
    displayOrder: 20,
    defaultCategoryKey: SurvivalLedgerCategoryKey.AfternoonBoost
  },
  {
    key: SupplySectionKey.Commute,
    title: "通勤补给",
    description: "上班日打车和出行补给",
    displayOrder: 30,
    defaultCategoryKey: SurvivalLedgerCategoryKey.Commute
  }
] as const;

export const SUPPLY_CAMPAIGN_WHITELIST: readonly SupplyCampaignWhitelistItem[] = [
  createCampaign("meituan_waimai", "美团外卖", SupplySectionKey.Canteen, "1", ["美团", "美团外卖"]),
  createCampaign("eleme", "饿了么", SupplySectionKey.Canteen, "3", ["饿了么"]),
  createCampaign("luckin", "瑞幸咖啡", SupplySectionKey.AfternoonBoost, "33", ["瑞幸", "瑞幸咖啡"]),
  createCampaign("cotti", "库迪咖啡", SupplySectionKey.AfternoonBoost, "jt_cotti", [
    "库迪",
    "库迪咖啡"
  ]),
  createCampaign("nayuki", "奈雪", SupplySectionKey.AfternoonBoost, "32", ["奈雪"]),
  createCampaign("heytea", "喜茶", SupplySectionKey.AfternoonBoost, "37", ["喜茶"]),
  createCampaign("didi_huaxiaozhu", "滴滴/花小猪", SupplySectionKey.Commute, "18", [
    "滴滴",
    "花小猪"
  ]),
  createCampaign("amap_taxi", "高德打车", SupplySectionKey.Commute, "jt_amap_taxi", [
    "高德",
    "高德打车"
  ])
] as const;

export const DEFAULT_SUPPLY_ITEMS: readonly SupplyItemConfig[] = SUPPLY_CAMPAIGN_WHITELIST.map(
  (campaign, index) =>
    withSupplyItemDefaults({
      id: `supply_${campaign.key}`,
      title: buildDefaultSupplyTitle(campaign.sectionKey),
      description: buildDefaultSupplyDescription(campaign.sectionKey),
      sectionKey: campaign.sectionKey,
      actionText: "去补给",
      sortOrder: (index + 1) * 10,
      status: campaign.actId.startsWith("jt_")
        ? SupplyItemStatus.Offline
        : SupplyItemStatus.Published,
      defaultCategoryKey: campaign.defaultCategoryKey,
      jutuikeActId: campaign.actId,
      jutuikeSourceName: "jutuike",
      createdAt: "2026-05-29T00:00:00.000Z",
      updatedAt: "2026-05-29T00:00:00.000Z"
    })
);

export class SupplyCenterValidationError extends Error {
  readonly issues: readonly ValidationIssue[];

  constructor(issues: readonly ValidationIssue[]) {
    super(issues.map((issue) => `${issue.field}: ${issue.message}`).join("; "));
    this.name = "SupplyCenterValidationError";
    this.issues = issues;
  }
}

export function isSupplySectionKey(value: string): value is SupplySectionKey {
  return (Object.values(SupplySectionKey) as string[]).includes(value);
}

export function isSupplyActivityGroupKey(value: string): value is SupplyActivityGroupKey {
  return (Object.values(SupplyActivityGroupKey) as string[]).includes(value);
}

export function isSupplyItemStatus(value: string): value is SupplyItemStatus {
  return (Object.values(SupplyItemStatus) as string[]).includes(value);
}

export function isSupplyRecommendationSlot(value: string): value is SupplyRecommendationSlot {
  return (Object.values(SupplyRecommendationSlot) as string[]).includes(value);
}

export function isSupplyFallbackStrategy(value: string): value is SupplyFallbackStrategy {
  return (Object.values(SupplyFallbackStrategy) as string[]).includes(value);
}

export function toPublicSupplyItem(item: SupplyItemConfig, now = new Date()): PublicSupplyItem {
  const normalized = withSupplyItemDefaults(item);
  const recommendedNow = isSupplyItemRecommendedNow(normalized, now);

  return {
    id: normalized.id,
    title: normalized.title,
    description: normalized.description,
    sectionKey: normalized.sectionKey,
    groupKey: normalized.groupKey,
    coverImageUrl: normalized.coverImageUrl,
    actionText: normalized.actionText,
    sortOrder: normalized.sortOrder,
    displayPriority: normalized.displayPriority,
    tags: sanitizePublicTags(normalized.userVisibleTags),
    clickable: isSupplyItemPubliclyAvailable(normalized, now),
    clickableReason: isSupplyItemPubliclyAvailable(normalized, now) ? undefined : "补给暂不可用",
    recommendationSlots: normalized.recommendationTimeWindows.map((window) => window.slot),
    recommendedNow,
    recommendationReason: recommendedNow ? recommendationReason(normalized.sectionKey) : undefined,
    syncHint: "补给完成后，订单同步成功会自动进入生存账本。"
  };
}

export function buildSupplyCenterPublicList(
  items: readonly SupplyItemConfig[],
  now = new Date()
): SupplyCenterPublicListResponse {
  const scenarioKey = resolveSupplyScenario(now);
  const publicItems = items
    .map((item) => withSupplyItemDefaults(item))
    .filter((item) => isSupplyItemPubliclyAvailable(item, now))
    .map((item) => toPublicSupplyItem(item, now))
    .sort((first, second) => comparePublicItems(first, second, scenarioKey));
  const mainRecommendation =
    publicItems.find((item) => item.recommendedNow) ?? publicItems[0] ?? undefined;
  const sections = SUPPLY_CENTER_SECTIONS.map((section) => ({
    section,
    items: publicItems
      .filter((item) => item.sectionKey === section.key)
      .sort((first, second) => comparePublicItems(first, second, scenarioKey))
  }));
  const syncHint = "补给打开不等于已入账，订单同步成功后才会自动收纳到生存账本。";
  const todayPanel: SupplyTodayPanel = {
    title: "今日补给面板",
    scenarioKey,
    scenarioLabel: scenarioLabel(scenarioKey),
    generatedAt: now.toISOString(),
    mainRecommendation,
    sections,
    syncHint,
    emptyHint: mainRecommendation ? undefined : "当前场景暂未上架补给"
  };

  return {
    todayPanel,
    mainRecommendation,
    sections,
    syncHint
  };
}

export function buildAdminSupplyPublicPreview(
  items: readonly SupplyItemConfig[],
  now = new Date()
): AdminSupplyPublicPreviewResponse {
  const preview = buildSupplyCenterPublicList(items, now);
  assertPublicSupplyPreviewSafe(preview);
  return { preview };
}

export function isSupplyItemPubliclyAvailable(item: SupplyItemConfig, now = new Date()): boolean {
  const normalized = withSupplyItemDefaults(item);
  const nowTime = now.getTime();
  return (
    normalized.status === SupplyItemStatus.Published &&
    (!normalized.validFrom || new Date(normalized.validFrom).getTime() <= nowTime) &&
    (!normalized.validUntil || new Date(normalized.validUntil).getTime() >= nowTime) &&
    matchesWorkdayRule(normalized.displayWorkdayRule, now)
  );
}

export function isSupplyItemRecommendedNow(item: SupplyItemConfig, now = new Date()): boolean {
  const normalized = withSupplyItemDefaults(item);
  const scenario = resolveSupplyScenario(now);
  if (!isSupplyItemPubliclyAvailable(normalized, now)) {
    return false;
  }
  return normalized.recommendationTimeWindows.some(
    (window) => window.slot === scenario || window.slot === SupplyRecommendationSlot.Anytime
  );
}

export function withSupplyItemDefaults(
  input: Omit<
    SupplyItemConfig,
    | "groupKey"
    | "userVisibleTags"
    | "displayPriority"
    | "recommendationTimeWindows"
    | "displayWorkdayRule"
    | "attributionWindowHours"
    | "transferExpiresMinutes"
    | "clickDedupeWindowSeconds"
    | "fallbackStrategy"
  > &
    Partial<SupplyItemConfig>
): SupplyItemConfig {
  return {
    ...input,
    groupKey: input.groupKey ?? defaultGroupForSection(input.sectionKey),
    userVisibleTags: sanitizePublicTags(
      input.userVisibleTags ?? defaultTagsForSection(input.sectionKey)
    ),
    displayPriority: normalizeNonNegativeInteger(input.displayPriority, 50),
    recommendationTimeWindows:
      input.recommendationTimeWindows ?? defaultRecommendationWindows(input.sectionKey),
    displayWorkdayRule: input.displayWorkdayRule ?? SupplyDisplayWorkdayRule.WorkdaysOnly,
    attributionWindowHours: normalizeNonNegativeInteger(input.attributionWindowHours, 168),
    transferExpiresMinutes: normalizeNonNegativeInteger(input.transferExpiresMinutes, 30),
    clickDedupeWindowSeconds: normalizeNonNegativeInteger(input.clickDedupeWindowSeconds, 300),
    fallbackStrategy: input.fallbackStrategy ?? SupplyFallbackStrategy.None
  };
}

export function maskSupplySid(sid: string): string {
  if (sid.length <= 10) {
    return `${sid.slice(0, 2)}***`;
  }

  return `${sid.slice(0, 6)}...${sid.slice(-4)}`;
}

export function assertSupplySidSafe(sid: string, forbiddenParts: readonly string[]): void {
  const issues: ValidationIssue[] = [];
  if (sid.length < 24) {
    issues.push({ field: "sid", message: "sid 长度不足，存在可枚举风险" });
  }

  for (const part of forbiddenParts) {
    if (part && sid.includes(part)) {
      issues.push({ field: "sid", message: "sid 不得包含可反推用户身份的信息" });
    }
  }

  throwIfSupplyIssues(issues);
}

export function assertPublicSupplyPreviewSafe(value: unknown): void {
  const raw = JSON.stringify(value).toLowerCase();
  for (const forbidden of [
    "cps",
    "聚推客",
    "jutuike",
    "commission",
    "佣金",
    "返利",
    "apikey",
    "api_key",
    "sid_",
    "jutuikeactid",
    "internalnote"
  ]) {
    if (raw.includes(forbidden.toLowerCase())) {
      throw new SupplyCenterValidationError([
        { field: "preview", message: `普通用户预览不得包含 ${forbidden}` }
      ]);
    }
  }
}

export function validateSupplyItemConfig(item: SupplyItemConfig): void {
  const normalized = withSupplyItemDefaults(item);
  const issues: ValidationIssue[] = [];
  if (!normalized.title.trim()) {
    issues.push({ field: "title", message: "补给项标题不能为空" });
  }
  if (!isSupplySectionKey(String(normalized.sectionKey))) {
    issues.push({ field: "sectionKey", message: "补给板块必须属于第一期三类板块" });
  }
  if (!isSupplyActivityGroupKey(String(normalized.groupKey))) {
    issues.push({ field: "groupKey", message: "活动分组无效" });
  }
  if (!isSupplyItemStatus(String(normalized.status))) {
    issues.push({ field: "status", message: "补给项状态无效" });
  }
  if (!Number.isInteger(normalized.sortOrder) || normalized.sortOrder < 0) {
    issues.push({ field: "sortOrder", message: "排序必须是非负整数" });
  }
  if (!Number.isInteger(normalized.displayPriority) || normalized.displayPriority < 0) {
    issues.push({ field: "displayPriority", message: "优先级必须是非负整数" });
  }
  if (!normalized.jutuikeActId.trim()) {
    issues.push({ field: "jutuikeActId", message: "聚推客活动标识不能为空" });
  }
  for (const tag of item.userVisibleTags ?? []) {
    if (PUBLIC_TAG_FORBIDDEN_PATTERN.test(tag)) {
      issues.push({ field: "userVisibleTags", message: "用户可见标签不得包含内部商业字段" });
    }
  }
  if (!isSupplyFallbackStrategy(String(normalized.fallbackStrategy))) {
    issues.push({ field: "fallbackStrategy", message: "备用链接策略无效" });
  }
  if (
    normalized.fallbackStrategy !== SupplyFallbackStrategy.None &&
    !normalized.fallbackUrl &&
    !(normalized.fallbackMiniappAppId && normalized.fallbackMiniappPath)
  ) {
    issues.push({ field: "fallbackUrl", message: "启用备用链接时必须配置受控跳转目标" });
  }
  throwIfSupplyIssues(issues);
}

export function mapJutuikeOrderStatusToCpsOrderStatus(status: JutuikeOrderStatus): CpsOrderStatus {
  const normalized = String(status).toLowerCase();
  if (["paid", "settled", "pending_settle", "pay", "valid", "1", "2"].includes(normalized)) {
    return CpsOrderStatus.Effective;
  }
  if (["unpaid", "created", "pending", "0", "wait_pay"].includes(normalized)) {
    return CpsOrderStatus.Unpaid;
  }
  if (["unknown", "pending_check", "wait_check"].includes(normalized)) {
    return CpsOrderStatus.Unknown;
  }
  if (["refunded", "refund"].includes(normalized)) {
    return CpsOrderStatus.Refunded;
  }
  if (["cancelled", "canceled", "cancel"].includes(normalized)) {
    return CpsOrderStatus.Cancelled;
  }
  if (["risk_rejected", "risk"].includes(normalized)) {
    return CpsOrderStatus.RiskRejected;
  }
  if (["settle_failed", "failed"].includes(normalized)) {
    return CpsOrderStatus.SettleFailed;
  }
  if (["invalid", "-1"].includes(normalized)) {
    return CpsOrderStatus.Invalid;
  }
  return CpsOrderStatus.Unknown;
}

export function normalizeJutuikeOrderToCpsInput(input: {
  order: JutuikeUnifiedOrder;
  userId: string;
  categoryKey?: SurvivalLedgerCategoryKey;
  ledgerExclusionReason?: CpsLedgerExclusionReason;
  stateHistory?: readonly CpsOrderStateHistoryEntry[];
}): ImportCpsSurvivalOrderRequest {
  const amountMinor = normalizePayPriceToMinor(input.order.payPrice);
  const status = mapJutuikeOrderStatusToCpsOrderStatus(input.order.status);
  return {
    userId: input.userId,
    sourceProvider: CpsSourceProvider.Jutuike,
    sourceOrderId: input.order.orderSn,
    sourceStatus: status,
    amountMinor,
    currency: CurrencyCode.CNY as AccountingCurrencyCode,
    occurredAt: normalizePayTime(input.order.payTime),
    productTitle: input.order.title ?? input.order.brandName,
    productCategory: input.categoryKey,
    merchantTags: [input.order.brandName, input.order.brandId, input.order.actId].filter(
      (value): value is string => typeof value === "string" && value.length > 0
    ),
    ledgerExclusionReason: input.ledgerExclusionReason,
    stateHistory: input.stateHistory
  };
}

export function classifyJutuikeOrderFallback(
  order: Pick<JutuikeUnifiedOrder, "brandName" | "brandId" | "actId" | "title">
): SurvivalLedgerCategoryKey | undefined {
  const haystack = [order.brandName, order.brandId, order.actId, order.title]
    .join(" ")
    .toLowerCase();
  const matchedCampaign = SUPPLY_CAMPAIGN_WHITELIST.find((campaign) =>
    [campaign.actId, campaign.key, ...campaign.brandAliases].some((alias) =>
      haystack.includes(alias.toLowerCase())
    )
  );
  if (matchedCampaign) {
    return matchedCampaign.defaultCategoryKey;
  }
  return tryClassifyCpsSurvivalOrder({
    sourceProvider: CpsSourceProvider.Jutuike,
    productTitle: order.title,
    productCategory: undefined,
    merchantTags: [order.brandName, order.brandId, order.actId].filter(
      (value): value is string => typeof value === "string" && value.length > 0
    )
  });
}

export function explainSupplyAttributionFailure(reason: SupplyAttributionFailureReason): string {
  const explanations: Record<SupplyAttributionFailureReason, string> = {
    [SupplyAttributionFailureReason.SidMissing]: "订单没有携带补给归因标记，无法确认属于哪位隐者。",
    [SupplyAttributionFailureReason.SidNotFound]: "订单携带的归因标记没有匹配到有效补给点击。",
    [SupplyAttributionFailureReason.SidExpired]: "订单回流时已超过补给归因窗口。",
    [SupplyAttributionFailureReason.ActivityMismatch]: "订单活动与点击补给活动不一致。",
    [SupplyAttributionFailureReason.OrderStatusInvalid]: "订单状态未确认有效，暂不计入。",
    [SupplyAttributionFailureReason.OrderUnpaid]: "订单仍未支付或待确认，暂不计入。",
    [SupplyAttributionFailureReason.DuplicateOrderUpdated]:
      "重复订单已按来源订单更新，不重复入账。",
    [SupplyAttributionFailureReason.ClassificationFailed]: "订单无法归入三类上班生存补给。",
    [SupplyAttributionFailureReason.LedgerImportFailed]: "订单匹配成功，但写入生存账本失败。"
  };
  return explanations[reason];
}

function createCampaign(
  key: string,
  displayName: string,
  sectionKey: SupplySectionKey,
  actId: string,
  brandAliases: readonly string[]
): SupplyCampaignWhitelistItem {
  const section = SUPPLY_CENTER_SECTIONS.find((item) => item.key === sectionKey)!;
  return {
    key,
    displayName,
    sectionKey,
    defaultCategoryKey: section.defaultCategoryKey,
    actId,
    sourceName: "jutuike",
    brandAliases
  };
}

function buildDefaultSupplyTitle(sectionKey: SupplySectionKey): string {
  if (sectionKey === SupplySectionKey.Commute) {
    return "影遁通勤补给";
  }
  if (sectionKey === SupplySectionKey.AfternoonBoost) {
    return "下午续命补给";
  }
  return "午间饭票补给";
}

function buildDefaultSupplyDescription(sectionKey: SupplySectionKey): string {
  if (sectionKey === SupplySectionKey.Commute) {
    return "上班日通勤后，订单同步成功会进入通勤消耗。";
  }
  if (sectionKey === SupplySectionKey.AfternoonBoost) {
    return "咖啡茶饮回血，订单同步成功会进入下午续命。";
  }
  return "午间补给完成后，订单同步成功会进入隐者食堂。";
}

function defaultGroupForSection(sectionKey: SupplySectionKey): SupplyActivityGroupKey {
  if (sectionKey === SupplySectionKey.Commute) {
    return SupplyActivityGroupKey.Commute;
  }
  if (sectionKey === SupplySectionKey.AfternoonBoost) {
    return SupplyActivityGroupKey.AfternoonBoost;
  }
  return SupplyActivityGroupKey.Lunch;
}

function defaultTagsForSection(sectionKey: SupplySectionKey): readonly string[] {
  if (sectionKey === SupplySectionKey.Commute) {
    return ["通勤", "工作日推荐"];
  }
  if (sectionKey === SupplySectionKey.AfternoonBoost) {
    return ["咖啡", "茶饮", "下午续命"];
  }
  return ["外卖", "午间饭票", "工作日推荐"];
}

function defaultRecommendationWindows(
  sectionKey: SupplySectionKey
): readonly SupplyRecommendationTimeWindow[] {
  if (sectionKey === SupplySectionKey.Commute) {
    return [
      { slot: SupplyRecommendationSlot.MorningCommute, startTime: "07:00", endTime: "10:00" },
      { slot: SupplyRecommendationSlot.EveningCommute, startTime: "17:00", endTime: "21:00" }
    ];
  }
  if (sectionKey === SupplySectionKey.AfternoonBoost) {
    return [{ slot: SupplyRecommendationSlot.Afternoon, startTime: "14:00", endTime: "17:30" }];
  }
  return [{ slot: SupplyRecommendationSlot.Lunch, startTime: "10:30", endTime: "13:30" }];
}

function resolveSupplyScenario(now: Date): SupplyRecommendationSlot {
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (minutes >= 7 * 60 && minutes < 10 * 60) {
    return SupplyRecommendationSlot.MorningCommute;
  }
  if (minutes >= 10 * 60 + 30 && minutes < 13 * 60 + 30) {
    return SupplyRecommendationSlot.Lunch;
  }
  if (minutes >= 14 * 60 && minutes < 17 * 60 + 30) {
    return SupplyRecommendationSlot.Afternoon;
  }
  if (minutes >= 17 * 60 + 30 && minutes < 21 * 60) {
    return SupplyRecommendationSlot.EveningCommute;
  }
  return SupplyRecommendationSlot.Anytime;
}

function scenarioLabel(slot: SupplyRecommendationSlot): string {
  const labels: Record<SupplyRecommendationSlot, string> = {
    [SupplyRecommendationSlot.Lunch]: "午间饭票",
    [SupplyRecommendationSlot.Afternoon]: "下午续命",
    [SupplyRecommendationSlot.MorningCommute]: "上班通勤",
    [SupplyRecommendationSlot.EveningCommute]: "下班通勤",
    [SupplyRecommendationSlot.Anytime]: "上班补给"
  };
  return labels[slot];
}

function recommendationReason(sectionKey: SupplySectionKey): string {
  if (sectionKey === SupplySectionKey.Commute) {
    return "当前时段适合通勤补给";
  }
  if (sectionKey === SupplySectionKey.AfternoonBoost) {
    return "当前时段适合下午续命";
  }
  return "当前时段适合午间补给";
}

function comparePublicItems(
  first: PublicSupplyItem,
  second: PublicSupplyItem,
  scenario: SupplyRecommendationSlot
): number {
  const firstScenario = first.recommendationSlots.includes(scenario) ? 0 : 1;
  const secondScenario = second.recommendationSlots.includes(scenario) ? 0 : 1;
  const firstSectionOrder =
    SUPPLY_CENTER_SECTIONS.find((section) => section.key === first.sectionKey)?.displayOrder ?? 999;
  const secondSectionOrder =
    SUPPLY_CENTER_SECTIONS.find((section) => section.key === second.sectionKey)?.displayOrder ??
    999;

  return (
    firstScenario - secondScenario ||
    firstSectionOrder - secondSectionOrder ||
    second.displayPriority - first.displayPriority ||
    first.sortOrder - second.sortOrder ||
    first.id.localeCompare(second.id)
  );
}

function matchesWorkdayRule(rule: SupplyDisplayWorkdayRule, now: Date): boolean {
  const day = now.getDay();
  const isWorkday = day >= 1 && day <= 5;
  if (rule === SupplyDisplayWorkdayRule.WorkdaysOnly) {
    return isWorkday;
  }
  if (rule === SupplyDisplayWorkdayRule.WeekendsOnly) {
    return !isWorkday;
  }
  return true;
}

function sanitizePublicTags(tags: readonly string[]): string[] {
  return tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag) => !PUBLIC_TAG_FORBIDDEN_PATTERN.test(tag))
    .slice(0, 6);
}

function normalizeNonNegativeInteger(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : fallback;
}

function normalizePayPriceToMinor(value: number | string): number {
  const amount = typeof value === "number" ? value : Number(value);
  return Math.round(amount * 100);
}

function normalizePayTime(value: string): string {
  const maybeNumeric = Number(value);
  const date =
    Number.isFinite(maybeNumeric) && /^\d{10,13}$/.test(value)
      ? new Date(value.length === 10 ? maybeNumeric * 1000 : maybeNumeric)
      : new Date(value);
  return date.toISOString();
}

function throwIfSupplyIssues(issues: readonly ValidationIssue[]): void {
  if (issues.length > 0) {
    throw new SupplyCenterValidationError(issues);
  }
}
