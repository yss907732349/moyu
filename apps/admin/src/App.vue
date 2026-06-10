<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import {
  COMMUNITY_REPORT_REASON_CODES,
  COMMUNITY_REPORT_REASON_LABELS,
  CommunityReportPriority,
  CommunityReportTargetType,
  formatDisplayTime
} from "@moyuxia/shared";
import type {
  AdminCommunityPostGovernanceDetail,
  AdminCommunityPostOverviewItem,
  AdminModuleLoadState as AdminModuleLoadStateType,
  AdminOperationFeedbackStatus as AdminOperationFeedbackStatusType,
  AdminOperationsConnectionStatus as AdminOperationsConnectionStatusType,
  AdminOperationsRealtimeEvent,
  AdminOperationsReviewDetail,
  AdminOperationsReviewQueueItem,
  AdminOperationsTodoSummary,
  AdminOperationsWorkbenchResponse,
  AdminReviewQueueItemProcessingState as AdminReviewQueueItemProcessingStateType,
  AdminSupplyClickListResponse,
  AdminSupplyExceptionPoolResponse,
  AdminSupplyItemListResponse,
  AdminSupplyMetricsResponse,
  AdminSupplyOrderSyncListResponse,
  AdminSupplyPublicPreviewResponse,
  AdminWorldIntelListResponse,
  DailyContentArticlePreviewResponse,
  DailyContentEditValidationResult,
  DailyContentIssue,
  DailyContentSection,
  DailyContentSectionKey,
  DailyContentSectionPreviewResponse,
  SupplyItemConfig,
  WorldIntelArticle
} from "@moyuxia/shared";
import { colors, semanticTokens } from "@moyuxia/ui-tokens";
import {
  createAdminRequestClient,
  formatAdminOperationError,
  isAdminRequestError,
  type AdminRequestError,
  type HttpMethod
} from "./services/admin-client";
import { connectAdminOperationsRealtime } from "./services/admin-realtime";

type AdminModule = "workbench" | "review" | "governance" | "daily" | "worldIntel" | "supply";
type ReviewQueueGroup = "content" | "report" | "all";
type UploadedDailyContentAsset = {
  assetId: string;
  fileName: string;
  mimeType: string;
  publicUrl: string;
  thumbnailPublicUrl?: string;
};
type PreparedUploadImage = {
  fileName: string;
  mimeType: string;
  dataUrl: string;
  thumbnailDataUrl?: string;
};
type WorldIntelEditorForm = {
  id?: string;
  title: string;
  summary: string;
  body: string;
  sourceType: "original" | "curated";
  publicSourceText: string;
  sourceName: string;
  sourceTitle: string;
  sourceUrl: string;
  imageUrl: string;
  coverImageUrl: string;
  allowLike: boolean;
  allowCommunityQuote: boolean;
  quotePrompt: string;
};
type SupplyItemEditorForm = {
  id: string;
  title: string;
  description: string;
  sectionKey: SupplyItemConfig["sectionKey"];
  coverImageUrl: string;
  actionText: string;
  sortOrder: number;
  status: SupplyItemConfig["status"];
  validFrom: string;
  validUntil: string;
  defaultCategoryKey: SupplyItemConfig["defaultCategoryKey"];
  jutuikeActId: string;
  groupKey: SupplyItemConfig["groupKey"];
  userVisibleTagsText: string;
  displayPriority: number;
  recommendationSlotsText: string;
  displayWorkdayRule: SupplyItemConfig["displayWorkdayRule"];
  attributionWindowHours: number;
  transferExpiresMinutes: number;
  clickDedupeWindowSeconds: number;
  fallbackStrategy: SupplyItemConfig["fallbackStrategy"];
  fallbackTargetType: string;
  fallbackUrl: string;
  fallbackMiniappAppId: string;
  fallbackMiniappPath: string;
  internalNote: string;
};

const apiBaseUrl = import.meta.env?.VITE_API_BASE_URL || "http://localhost:3000";
const APP_NAME = "摸鱼隐者";
const DAILY_CONTENT_SECTION_LABELS: Record<DailyContentSectionKey, string> = {
  daily_reflection: "今日参悟",
  world_intel: "大陆新闻",
  absurd_casefile: "离谱卷宗"
};
const DAILY_CONTENT_SECTION_KEYS = [
  "daily_reflection",
  "absurd_casefile"
] as const satisfies readonly DailyContentSectionKey[];
const WORLD_INTEL_DEFAULT_PUBLIC_SOURCE = "运影报社独家资讯";
const WORLD_INTEL_ARTICLE_STATUS = {
  Draft: "draft",
  Published: "published",
  Offline: "offline",
  Hidden: "hidden"
} as const;
const SupplySectionKey = {
  Canteen: "canteen",
  AfternoonBoost: "afternoon_boost",
  Commute: "commute"
} as const;
const SupplyItemStatus = {
  Published: "published",
  Draft: "draft",
  Offline: "offline"
} as const;
const SupplyActivityGroupKey = {
  Lunch: "lunch",
  AfternoonBoost: "afternoon_boost",
  Commute: "commute",
  General: "general"
} as const;
const SupplyDisplayWorkdayRule = {
  AllDays: "all_days",
  WorkdaysOnly: "workdays_only",
  WeekendsOnly: "weekends_only"
} as const;
const SupplyFallbackStrategy = {
  None: "none",
  AttributableLink: "attributable_link",
  NonAttributableLink: "non_attributable_link"
} as const;
const SupplyRecommendationSlot = {
  Lunch: "lunch",
  Afternoon: "afternoon",
  MorningCommute: "morning_commute",
  EveningCommute: "evening_commute",
  Anytime: "anytime"
} as const;
const SurvivalLedgerCategoryKey = {
  Canteen: "canteen",
  AfternoonBoost: "afternoon_boost",
  Commute: "commute"
} as const;
const SUPPLY_SECTION_OPTIONS = [
  { value: SupplySectionKey.Canteen, label: "隐者食堂" },
  { value: SupplySectionKey.AfternoonBoost, label: "下午续命" },
  { value: SupplySectionKey.Commute, label: "通勤补给" }
] as const;
const SUPPLY_CATEGORY_OPTIONS = [
  { value: SurvivalLedgerCategoryKey.Canteen, label: "隐者食堂" },
  { value: SurvivalLedgerCategoryKey.AfternoonBoost, label: "下午续命" },
  { value: SurvivalLedgerCategoryKey.Commute, label: "通勤" }
] as const;
const SUPPLY_STATUS_OPTIONS = [
  { value: SupplyItemStatus.Published, label: "上架" },
  { value: SupplyItemStatus.Draft, label: "草稿" },
  { value: SupplyItemStatus.Offline, label: "下线" }
] as const;
const SUPPLY_GROUP_OPTIONS = [
  { value: SupplyActivityGroupKey.Lunch, label: "午间饭票" },
  { value: SupplyActivityGroupKey.AfternoonBoost, label: "下午续命" },
  { value: SupplyActivityGroupKey.Commute, label: "通勤补给" },
  { value: SupplyActivityGroupKey.General, label: "通用补给" }
] as const;
const SUPPLY_WORKDAY_RULE_OPTIONS = [
  { value: SupplyDisplayWorkdayRule.WorkdaysOnly, label: "仅工作日" },
  { value: SupplyDisplayWorkdayRule.AllDays, label: "每天展示" },
  { value: SupplyDisplayWorkdayRule.WeekendsOnly, label: "仅周末" }
] as const;
const SUPPLY_FALLBACK_OPTIONS = [
  { value: SupplyFallbackStrategy.None, label: "无备用链接" },
  { value: SupplyFallbackStrategy.AttributableLink, label: "可归因备用链接" },
  { value: SupplyFallbackStrategy.NonAttributableLink, label: "不可归因备用链接" }
] as const;
const AdminReviewQueueItemProcessingState = {
  Idle: "idle",
  Processing: "processing",
  Succeeded: "succeeded",
  Failed: "failed",
  Stale: "stale"
} as const satisfies Record<string, AdminReviewQueueItemProcessingStateType>;
const AdminOperationsConnectionStatus = {
  Connecting: "connecting",
  Live: "live",
  DegradedPolling: "degraded_polling",
  Offline: "offline",
  Recovering: "recovering"
} as const satisfies Record<string, AdminOperationsConnectionStatusType>;
const AdminModuleLoadState = {
  Idle: "idle",
  Loading: "loading",
  Loaded: "loaded",
  Empty: "empty",
  NoResults: "no_results",
  Error: "error"
} as const satisfies Record<string, AdminModuleLoadStateType>;
const AdminOperationFeedbackStatus = {
  Idle: "idle",
  Processing: "processing",
  Succeeded: "succeeded",
  Failed: "failed",
  Stale: "stale"
} as const satisfies Record<string, AdminOperationFeedbackStatusType>;

const adminToken = ref("dev-admin-token");
const adminClient = createAdminRequestClient({
  baseUrl: apiBaseUrl,
  getToken: () => adminToken.value
});
const activeModule = ref<AdminModule>("workbench");
const feedback = ref("正在同步后台运营数据");
const loading = ref(false);
const operationStatus = ref<AdminOperationFeedbackStatusType>(AdminOperationFeedbackStatus.Idle);
const connectionStatus = ref<AdminOperationsConnectionStatusType>(
  AdminOperationsConnectionStatus.Connecting
);
const newTodoCount = ref(0);
const lastTodoSummary = ref<AdminOperationsTodoSummary | null>(null);
const moduleLoadStates = ref<Record<AdminModule, AdminModuleLoadStateType>>({
  workbench: AdminModuleLoadState.Idle,
  review: AdminModuleLoadState.Idle,
  governance: AdminModuleLoadState.Idle,
  daily: AdminModuleLoadState.Idle,
  worldIntel: AdminModuleLoadState.Idle,
  supply: AdminModuleLoadState.Idle
});
const queueProcessingStates = ref<Record<string, AdminReviewQueueItemProcessingStateType>>({});

const workbench = ref<AdminOperationsWorkbenchResponse | null>(null);
const reviewQueue = ref<AdminOperationsReviewQueueItem[]>([]);
const selectedReviewItem = ref<AdminOperationsReviewDetail | null>(null);
const reviewFilters = ref({
  reviewGroup: "content" as ReviewQueueGroup,
  source: "",
  type: "",
  status: "",
  aiRiskTag: "",
  reportReasonCode: "",
  reportTargetType: "",
  reportPriority: "",
  lowCostRiskTag: "",
  lowCostRiskLevel: "",
  reviewDecision: "",
  userRiskReason: "",
  contentSecuritySource: "",
  contentSecurityRiskTag: "",
  manualReviewReason: "",
  imageAuditStatus: ""
});
const governancePosts = ref<AdminCommunityPostOverviewItem[]>([]);
const selectedGovernanceDetail = ref<AdminCommunityPostGovernanceDetail | null>(null);
const governanceNotice = ref("");
const governanceFilters = ref({
  keyword: "",
  status: "",
  sectionKey: "",
  authorUserId: "",
  riskTag: "",
  lowCostRiskLevel: ""
});

const issues = ref<DailyContentIssue[]>([]);
const selectedIssue = ref<DailyContentIssue | null>(null);
const validation = ref<DailyContentEditValidationResult | null>(null);
const sectionValidations = ref<
  Partial<Record<DailyContentSectionKey, DailyContentEditValidationResult>>
>({});
const sectionPreview = ref<DailyContentSectionPreviewResponse | null>(null);
const articlePreview = ref<DailyContentArticlePreviewResponse | null>(null);
const scheduleInput = ref("");
const activeDailySectionKey = ref<DailyContentSectionKey>("daily_reflection");
const worldIntelArticles = ref<WorldIntelArticle[]>([]);
const worldIntelFilters = ref({ status: "", keyword: "" });
const selectedWorldIntelArticleId = ref<string | null>(null);
const worldIntelForm = ref<WorldIntelEditorForm>(createEmptyWorldIntelForm());
const worldIntelBatchText = ref("");
const worldIntelPublishOnCreate = ref(false);
const supplyItems = ref<SupplyItemConfig[]>([]);
const supplyClicks = ref<AdminSupplyClickListResponse["clicks"]>([]);
const supplyOrderSyncs = ref<AdminSupplyOrderSyncListResponse["records"]>([]);
const supplyPreview = ref<AdminSupplyPublicPreviewResponse | null>(null);
const supplyExceptions = ref<AdminSupplyExceptionPoolResponse["exceptions"]>([]);
const supplyMetrics = ref<AdminSupplyMetricsResponse | null>(null);
const selectedSupplyItemId = ref<string | null>(null);
const selectedSupplyItemIds = ref<string[]>([]);
const supplyForm = ref<SupplyItemEditorForm>(createEmptySupplyForm());
const supplyFilters = ref({
  sectionKey: "",
  status: "",
  tag: "",
  recommendationSlot: ""
});
const supplyFormDirty = ref(false);
const dailyEditorDirty = ref(false);
const worldIntelFormDirty = ref(false);
const governanceDetailDirty = ref(false);
const reviewDetailDirty = ref(false);

const selectedSections = computed(() => selectedIssue.value?.sections ?? []);
const activeDailySection = computed(
  () =>
    selectedSections.value.find((section) => section.sectionKey === activeDailySectionKey.value) ??
    selectedSections.value[0]
);
const selectedIssueSectionKey = computed(
  () => selectedIssue.value?.sections[0]?.sectionKey ?? "daily_reflection"
);
const activeSectionValidation = computed(() => sectionValidation(selectedIssueSectionKey.value));
const activeSectionBlockingCount = computed(() =>
  sectionBlockingCount(selectedIssueSectionKey.value)
);
const activeSectionWarningCount = computed(() =>
  sectionWarningCount(selectedIssueSectionKey.value)
);
const queuePendingCount = computed(() => reviewQueue.value.length);
const contentReviewPendingCount = computed(
  () =>
    (workbench.value?.counts.pendingCommunityPosts ?? 0) +
    (workbench.value?.counts.pendingCommunityComments ?? 0) +
    (workbench.value?.counts.pendingCommunityReplies ?? 0) +
    (workbench.value?.counts.pendingDailyContentComments ?? 0) +
    (workbench.value?.counts.pendingDailyContentIssues ?? 0)
);
const reportReviewPendingCount = computed(
  () => workbench.value?.counts.pendingCommunityReports ?? 0
);
const reviewQueueTitle = computed(() =>
  reviewFilters.value.reviewGroup === "report"
    ? "举报审核队列"
    : reviewFilters.value.reviewGroup === "all"
      ? "全部审核待办"
      : "内容审核队列"
);
const reviewQueueHint = computed(() =>
  reviewFilters.value.reviewGroup === "report"
    ? "只展示用户举报案件，按原因、目标和优先级处理。"
    : reviewFilters.value.reviewGroup === "all"
      ? "展示所有待办，适合临时总览。"
      : "只展示帖子、评论、回复和日报内容审核，不混入举报案件。"
);
const isReportReviewMode = computed(() => reviewFilters.value.reviewGroup === "report");
const isContentReviewMode = computed(() => reviewFilters.value.reviewGroup === "content");
const pendingCommunityDiscussionCount = computed(
  () =>
    (workbench.value?.counts.pendingCommunityComments ?? 0) +
    (workbench.value?.counts.pendingCommunityReplies ?? 0)
);
const autoHandledCommunityDiscussionCount = computed(
  () =>
    (workbench.value?.counts.autoApprovedCommunityDiscussions ?? 0) +
    (workbench.value?.counts.autoRejectedCommunityDiscussions ?? 0)
);
const hasDirtyAdminInput = computed(
  () =>
    supplyFormDirty.value ||
    dailyEditorDirty.value ||
    worldIntelFormDirty.value ||
    governanceDetailDirty.value ||
    reviewDetailDirty.value
);
const connectionStatusLabel = computed(() => statusLabel(connectionStatus.value));
const operationStatusLabel = computed(() => statusLabel(operationStatus.value));

watch(
  supplyForm,
  () => {
    supplyFormDirty.value = true;
  },
  { deep: true }
);

watch(
  selectedIssue,
  () => {
    dailyEditorDirty.value = false;
  },
  { deep: false }
);

watch(
  worldIntelForm,
  () => {
    worldIntelFormDirty.value = true;
  },
  { deep: true }
);

const stopRealtime = connectAdminOperationsRealtime({
  baseUrl: apiBaseUrl,
  getToken: () => adminToken.value,
  onEvent: handleRealtimeEvent,
  onSummary: handleRealtimeSummary,
  onStatus: (status) => {
    connectionStatus.value = status;
  },
  onError: (error) => {
    feedback.value = formatAdminOperationError(error, "实时连接不可用，已尝试降级轮询");
  }
});

onBeforeUnmount(() => {
  stopRealtime();
});

void syncAll();

function setModuleLoadState(module: AdminModule, state: AdminModuleLoadStateType): void {
  moduleLoadStates.value = { ...moduleLoadStates.value, [module]: state };
}

function handleRealtimeEvent(event: AdminOperationsRealtimeEvent): void {
  lastTodoSummary.value = {
    pendingCount: event.pendingCount,
    counts: lastTodoSummary.value?.counts ??
      workbench.value?.counts ?? {
        pendingCommunityPosts: 0,
        pendingCommunityComments: 0,
        pendingCommunityReplies: 0,
        pendingCommunityReports: 0,
        pendingDailyContentComments: 0,
        pendingDailyContentIssues: 0,
        autoApprovedCommunityDiscussions: 0,
        autoRejectedCommunityDiscussions: 0,
        manualReviewCommunityDiscussions: 0,
        contentSecurityAutoApproved: 0,
        contentSecurityAutoRejected: 0,
        wechatImagePendingCallbacks: 0,
        wechatUnableToConfirm: 0
      },
    queueDelta: event.queueDelta,
    generatedAt: event.createdAt
  };
  if (event.queueDelta.added > 0 || event.queueDelta.updated > 0) {
    newTodoCount.value += Math.max(1, event.queueDelta.added + event.queueDelta.updated);
  }
  feedback.value = `实时待办已更新：${event.pendingCount} 条待处理`;
}

function handleRealtimeSummary(summary: AdminOperationsTodoSummary): void {
  const previousPending = lastTodoSummary.value?.pendingCount ?? queuePendingCount.value;
  lastTodoSummary.value = summary;
  if (summary.pendingCount > previousPending) {
    newTodoCount.value += summary.pendingCount - previousPending;
  }
}

async function consumeRealtimeTodos(): Promise<void> {
  if (hasDirtyAdminInput.value) {
    const confirmed = globalThis.confirm(
      "当前有未保存的备注、正文或表单内容。刷新事实源可能覆盖编辑上下文，是否继续？"
    );
    if (!confirmed) {
      feedback.value = "已保留当前编辑内容，新待办提示仍在";
      return;
    }
  }
  await refreshActiveModule();
  newTodoCount.value = 0;
  reviewDetailDirty.value = false;
  governanceDetailDirty.value = false;
}

async function refreshActiveModule(): Promise<void> {
  if (activeModule.value === "review") {
    await loadReviewQueue();
  } else if (activeModule.value === "governance") {
    await loadGovernancePosts();
    if (selectedGovernanceDetail.value) {
      await openGovernanceDetail(selectedGovernanceDetail.value.post.id, { silent: true });
    }
  } else if (activeModule.value === "daily") {
    await syncAll({ preserveDirty: false });
  } else if (activeModule.value === "worldIntel") {
    await loadWorldIntelArticles();
  } else if (activeModule.value === "supply") {
    await loadSupplyCenterAdmin({ preserveDirty: false });
  } else {
    await syncAll({ preserveDirty: false });
  }
  feedback.value = "已按当前模块刷新事实源";
}

async function syncAll(
  options: { preserveDirty?: boolean } = { preserveDirty: true }
): Promise<void> {
  loading.value = true;
  operationStatus.value = AdminOperationFeedbackStatus.Processing;
  setModuleLoadState("workbench", AdminModuleLoadState.Loading);
  try {
    const [workbenchResponse, issueResponse] = await Promise.all([
      requestAdmin(
        "/admin/operations/workbench",
        "GET"
      ) as Promise<AdminOperationsWorkbenchResponse>,
      requestAdmin("/admin/daily-content/issues", "GET") as Promise<DailyContentIssue[]>
    ]);
    workbench.value = workbenchResponse;
    issues.value = issueResponse.filter((issue) => issue.status !== "archived");
    await loadReviewQueue();
    await loadWorldIntelArticles();
    await loadSupplyCenterAdmin({ preserveDirty: options.preserveDirty });

    const currentIssue =
      selectedIssue.value && issues.value.find((issue) => issue.id === selectedIssue.value?.id);
    if (!options.preserveDirty || !dailyEditorDirty.value) {
      selectedIssue.value = currentIssue ?? issues.value[0] ?? null;
      scheduleInput.value = selectedIssue.value?.scheduledPublishAt ?? "";
      if (
        selectedIssue.value &&
        !selectedIssue.value.sections.some(
          (section) => section.sectionKey === activeDailySectionKey.value
        )
      ) {
        activeDailySectionKey.value =
          selectedIssue.value.sections[0]?.sectionKey ?? "daily_reflection";
      }
    }
    validation.value = selectedIssue.value
      ? await requestAdmin(
          `/admin/daily-content/issues/${selectedIssue.value.id}/validation`,
          "GET"
        )
      : null;
    await loadAllSectionValidations();
    await loadGovernancePosts();
    setModuleLoadState("workbench", AdminModuleLoadState.Loaded);
    setModuleLoadState(
      "daily",
      issues.value.length ? AdminModuleLoadState.Loaded : AdminModuleLoadState.Empty
    );
    feedback.value = "后台数据已同步";
    operationStatus.value = AdminOperationFeedbackStatus.Succeeded;
  } catch (error) {
    setModuleLoadState("workbench", AdminModuleLoadState.Error);
    operationStatus.value = AdminOperationFeedbackStatus.Failed;
    feedback.value = formatAdminOperationError(error, "后台数据同步失败");
  } finally {
    loading.value = false;
  }
}

async function loadSupplyCenterAdmin(
  options: { preserveDirty?: boolean } = { preserveDirty: true }
): Promise<void> {
  setModuleLoadState("supply", AdminModuleLoadState.Loading);
  const suffix = buildSupplyFilterSuffix();
  const [
    itemsResponse,
    clicksResponse,
    orderSyncsResponse,
    previewResponse,
    exceptionsResponse,
    metricsResponse
  ] = await Promise.all([
    requestAdmin(
      `/admin/supply-center/items${suffix}`,
      "GET"
    ) as Promise<AdminSupplyItemListResponse>,
    requestAdmin("/admin/supply-center/clicks", "GET") as Promise<AdminSupplyClickListResponse>,
    requestAdmin(
      "/admin/supply-center/order-syncs",
      "GET"
    ) as Promise<AdminSupplyOrderSyncListResponse>,
    requestAdmin(
      "/admin/supply-center/public-preview",
      "GET"
    ) as Promise<AdminSupplyPublicPreviewResponse>,
    requestAdmin(
      "/admin/supply-center/exceptions",
      "GET"
    ) as Promise<AdminSupplyExceptionPoolResponse>,
    requestAdmin("/admin/supply-center/metrics", "GET") as Promise<AdminSupplyMetricsResponse>
  ]);
  supplyItems.value = itemsResponse.items;
  supplyClicks.value = clicksResponse.clicks;
  supplyOrderSyncs.value = orderSyncsResponse.records;
  supplyPreview.value = previewResponse;
  supplyExceptions.value = exceptionsResponse.exceptions;
  supplyMetrics.value = metricsResponse;
  if (selectedSupplyItemId.value) {
    const selected = supplyItems.value.find((item) => item.id === selectedSupplyItemId.value);
    if (selected && (!options.preserveDirty || !supplyFormDirty.value)) {
      supplyForm.value = supplyItemToForm(selected);
      supplyFormDirty.value = false;
    }
  }
  setModuleLoadState(
    "supply",
    supplyItems.value.length ? AdminModuleLoadState.Loaded : AdminModuleLoadState.Empty
  );
}

function buildSupplyFilterSuffix(): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(supplyFilters.value)) {
    if (value) {
      params.set(key, value);
    }
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

function createEmptySupplyForm(): SupplyItemEditorForm {
  return {
    id: "",
    title: "",
    description: "",
    sectionKey: SupplySectionKey.Canteen,
    coverImageUrl: "",
    actionText: "去补给",
    sortOrder: nextSupplySortOrder(),
    status: SupplyItemStatus.Draft,
    validFrom: "",
    validUntil: "",
    defaultCategoryKey: SurvivalLedgerCategoryKey.Canteen,
    jutuikeActId: "",
    groupKey: SupplyActivityGroupKey.Lunch,
    userVisibleTagsText: "外卖, 午间饭票, 工作日推荐",
    displayPriority: 50,
    recommendationSlotsText: "lunch",
    displayWorkdayRule: SupplyDisplayWorkdayRule.WorkdaysOnly,
    attributionWindowHours: 168,
    transferExpiresMinutes: 30,
    clickDedupeWindowSeconds: 300,
    fallbackStrategy: SupplyFallbackStrategy.None,
    fallbackTargetType: "",
    fallbackUrl: "",
    fallbackMiniappAppId: "",
    fallbackMiniappPath: "",
    internalNote: ""
  };
}

function startCreateSupplyItem(): void {
  selectedSupplyItemId.value = null;
  supplyForm.value = createEmptySupplyForm();
  supplyFormDirty.value = false;
  feedback.value = "已进入新增补给项";
}

function editSupplyItem(item: SupplyItemConfig): void {
  selectedSupplyItemId.value = item.id;
  supplyForm.value = supplyItemToForm(item);
  supplyFormDirty.value = false;
  feedback.value = `正在编辑：${item.title}`;
}

async function saveSupplyItem(): Promise<void> {
  loading.value = true;
  try {
    const saved = (await requestAdmin(
      "/admin/supply-center/items",
      "POST",
      supplyFormToRequest(supplyForm.value)
    )) as SupplyItemConfig;
    selectedSupplyItemId.value = saved.id;
    supplyFormDirty.value = false;
    feedback.value = `补给项已保存：${saved.title}`;
    await loadSupplyCenterAdmin({ preserveDirty: false });
  } catch (error) {
    feedback.value = formatAdminOperationError(error, "补给项保存失败");
  } finally {
    loading.value = false;
  }
}

async function quickUpdateSupplyItem(
  item: SupplyItemConfig,
  patch: Partial<SupplyItemConfig>
): Promise<void> {
  loading.value = true;
  try {
    const saved = (await requestAdmin("/admin/supply-center/items", "POST", {
      ...item,
      ...patch
    })) as SupplyItemConfig;
    feedback.value = `已更新补给项：${saved.title}`;
    await loadSupplyCenterAdmin({ preserveDirty: false });
  } catch (error) {
    feedback.value = formatAdminOperationError(error, "补给项更新失败");
  } finally {
    loading.value = false;
  }
}

async function copySupplyItem(item: SupplyItemConfig): Promise<void> {
  loading.value = true;
  try {
    const saved = (await requestAdmin(
      `/admin/supply-center/items/${encodeURIComponent(item.id)}/copy`,
      "POST",
      {}
    )) as SupplyItemConfig;
    selectedSupplyItemId.value = saved.id;
    feedback.value = `已复制补给活动：${saved.title}`;
    await loadSupplyCenterAdmin({ preserveDirty: false });
  } catch (error) {
    feedback.value = formatAdminOperationError(error, "补给活动复制失败");
  } finally {
    loading.value = false;
  }
}

async function batchUpdateSupplyStatus(status: "published" | "offline"): Promise<void> {
  if (selectedSupplyItemIds.value.length === 0) {
    feedback.value = "请先选择补给活动";
    return;
  }
  loading.value = true;
  try {
    const result = (await requestAdmin("/admin/supply-center/items/batch-status", "POST", {
      itemIds: selectedSupplyItemIds.value,
      status
    })) as { updated: SupplyItemConfig[]; failed: { id: string; reason: string }[] };
    feedback.value = `批量操作完成：成功 ${result.updated.length} 个，失败 ${result.failed.length} 个`;
    selectedSupplyItemIds.value = [];
    await loadSupplyCenterAdmin({ preserveDirty: false });
  } catch (error) {
    feedback.value = formatAdminOperationError(error, "批量操作失败");
  } finally {
    loading.value = false;
  }
}

function toggleSupplySelection(itemId: string, selected: boolean): void {
  selectedSupplyItemIds.value = selected
    ? [...new Set([...selectedSupplyItemIds.value, itemId])]
    : selectedSupplyItemIds.value.filter((id) => id !== itemId);
}

function supplyItemToForm(item: SupplyItemConfig): SupplyItemEditorForm {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    sectionKey: item.sectionKey,
    coverImageUrl: item.coverImageUrl ?? "",
    actionText: item.actionText,
    sortOrder: item.sortOrder,
    status: item.status,
    validFrom: toDatetimeLocal(item.validFrom),
    validUntil: toDatetimeLocal(item.validUntil),
    defaultCategoryKey: item.defaultCategoryKey,
    jutuikeActId: item.jutuikeActId,
    groupKey: item.groupKey,
    userVisibleTagsText: item.userVisibleTags.join(", "),
    displayPriority: item.displayPriority,
    recommendationSlotsText: item.recommendationTimeWindows.map((window) => window.slot).join(", "),
    displayWorkdayRule: item.displayWorkdayRule,
    attributionWindowHours: item.attributionWindowHours,
    transferExpiresMinutes: item.transferExpiresMinutes,
    clickDedupeWindowSeconds: item.clickDedupeWindowSeconds,
    fallbackStrategy: item.fallbackStrategy,
    fallbackTargetType: item.fallbackTargetType ?? "",
    fallbackUrl: item.fallbackUrl ?? "",
    fallbackMiniappAppId: item.fallbackMiniappAppId ?? "",
    fallbackMiniappPath: item.fallbackMiniappPath ?? "",
    internalNote: item.internalNote ?? ""
  };
}

function supplyFormToRequest(form: SupplyItemEditorForm): Partial<SupplyItemConfig> {
  return {
    id: form.id.trim() || undefined,
    title: form.title.trim(),
    description: form.description.trim(),
    sectionKey: form.sectionKey,
    coverImageUrl: form.coverImageUrl.trim() || undefined,
    actionText: form.actionText.trim() || "去补给",
    sortOrder: Number(form.sortOrder),
    status: form.status,
    validFrom: fromDatetimeLocal(form.validFrom),
    validUntil: fromDatetimeLocal(form.validUntil),
    defaultCategoryKey: form.defaultCategoryKey,
    jutuikeActId: form.jutuikeActId.trim(),
    jutuikeSourceName: "jutuike",
    groupKey: form.groupKey,
    userVisibleTags: splitCsv(form.userVisibleTagsText),
    displayPriority: Number(form.displayPriority),
    recommendationTimeWindows: splitCsv(form.recommendationSlotsText).map((slot) => ({
      slot: slot as SupplyItemConfig["recommendationTimeWindows"][number]["slot"],
      startTime: defaultSlotTime(slot).startTime,
      endTime: defaultSlotTime(slot).endTime
    })),
    displayWorkdayRule: form.displayWorkdayRule,
    attributionWindowHours: Number(form.attributionWindowHours),
    transferExpiresMinutes: Number(form.transferExpiresMinutes),
    clickDedupeWindowSeconds: Number(form.clickDedupeWindowSeconds),
    fallbackStrategy: form.fallbackStrategy,
    fallbackTargetType: form.fallbackTargetType
      ? (form.fallbackTargetType as SupplyItemConfig["fallbackTargetType"])
      : undefined,
    fallbackUrl: form.fallbackUrl.trim() || undefined,
    fallbackMiniappAppId: form.fallbackMiniappAppId.trim() || undefined,
    fallbackMiniappPath: form.fallbackMiniappPath.trim() || undefined,
    internalNote: form.internalNote.trim() || undefined
  };
}

function nextSupplySortOrder(): number {
  return supplyItems.value.length > 0
    ? Math.max(...supplyItems.value.map((item) => item.sortOrder)) + 10
    : 10;
}

function splitCsv(value: string): string[] {
  return value
    .split(/[,\n，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function defaultSlotTime(slot: string): { startTime: string; endTime: string } {
  const slots: Record<string, { startTime: string; endTime: string }> = {
    [SupplyRecommendationSlot.Lunch]: { startTime: "10:30", endTime: "13:30" },
    [SupplyRecommendationSlot.Afternoon]: { startTime: "14:00", endTime: "17:30" },
    [SupplyRecommendationSlot.MorningCommute]: { startTime: "07:00", endTime: "10:00" },
    [SupplyRecommendationSlot.EveningCommute]: { startTime: "17:30", endTime: "21:00" },
    [SupplyRecommendationSlot.Anytime]: { startTime: "00:00", endTime: "23:59" }
  };
  return slots[slot] ?? slots[SupplyRecommendationSlot.Anytime];
}

function toDatetimeLocal(value?: string): string {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function fromDatetimeLocal(value: string): string | undefined {
  return value ? new Date(value).toISOString() : undefined;
}

async function setReviewQueueGroup(group: ReviewQueueGroup): Promise<void> {
  const base = {
    reviewGroup: group,
    source: "",
    type: "",
    status: "",
    aiRiskTag: "",
    reportReasonCode: "",
    reportTargetType: "",
    reportPriority: "",
    lowCostRiskTag: "",
    lowCostRiskLevel: "",
    reviewDecision: "",
    userRiskReason: "",
    contentSecuritySource: "",
    contentSecurityRiskTag: "",
    manualReviewReason: "",
    imageAuditStatus: ""
  };

  reviewFilters.value =
    group === "report"
      ? { ...base, source: "community", type: "community_report" }
      : group === "content"
        ? { ...base }
        : { ...base };
  selectedReviewItem.value = null;
  await loadReviewQueue();
}

async function loadReviewQueue(): Promise<void> {
  setModuleLoadState("review", AdminModuleLoadState.Loading);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(reviewFilters.value)) {
    if (value) {
      params.set(key, value);
    }
  }
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const response = (await requestAdmin(`/admin/operations/review-queue${suffix}`, "GET")) as {
    items: AdminOperationsReviewQueueItem[];
  };
  reviewQueue.value = response.items;
  setModuleLoadState(
    "review",
    response.items.length > 0 ? AdminModuleLoadState.Loaded : AdminModuleLoadState.NoResults
  );
}

async function loadGovernancePosts(): Promise<void> {
  setModuleLoadState("governance", AdminModuleLoadState.Loading);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(governanceFilters.value)) {
    if (value) {
      params.set(key, value);
    }
  }
  params.set("pageSize", "30");
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const response = (await requestAdmin(`/admin/community-governance/posts${suffix}`, "GET")) as {
    items: AdminCommunityPostOverviewItem[];
  };
  governancePosts.value = response.items;
  setModuleLoadState(
    "governance",
    response.items.length > 0 ? AdminModuleLoadState.Loaded : AdminModuleLoadState.NoResults
  );
}

async function loadWorldIntelArticles(): Promise<void> {
  setModuleLoadState("worldIntel", AdminModuleLoadState.Loading);
  const params = new URLSearchParams();
  if (worldIntelFilters.value.status) {
    params.set("status", worldIntelFilters.value.status);
  }
  if (worldIntelFilters.value.keyword) {
    params.set("keyword", worldIntelFilters.value.keyword);
  }
  params.set("pageSize", "50");
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const response = (await requestAdmin(
    `/admin/world-intel/articles${suffix}`,
    "GET"
  )) as AdminWorldIntelListResponse;
  worldIntelArticles.value = response.articles;
  setModuleLoadState(
    "worldIntel",
    response.articles.length > 0 ? AdminModuleLoadState.Loaded : AdminModuleLoadState.NoResults
  );
}

async function openGovernanceDetail(
  postId: string,
  options: { silent?: boolean } = {}
): Promise<void> {
  selectedGovernanceDetail.value = (await requestAdmin(
    `/admin/community-governance/posts/${postId}`,
    "GET"
  )) as AdminCommunityPostGovernanceDetail;
  governanceDetailDirty.value = true;
  activeModule.value = "governance";
  if (!options.silent) {
    feedback.value = "社区治理详情已打开";
  }
}

async function runGovernanceAction(
  targetType: "posts" | "comments" | "replies",
  targetId: string,
  action: string
): Promise<void> {
  const reason = globalThis.prompt("请输入治理原因", actionLabel(action))?.trim();
  if (!reason) {
    feedback.value = "已取消：治理操作必须填写原因";
    return;
  }
  try {
    await requestAdmin(`/admin/community-governance/${targetType}/${targetId}/actions`, "POST", {
      action,
      reason,
      note: reason
    });
    const message = `已执行：${actionLabel(action)}，列表和详情已刷新`;
    feedback.value = message;
    governanceNotice.value = message;
    governanceDetailDirty.value = false;
    await loadGovernancePosts();
    if (selectedGovernanceDetail.value) {
      await openGovernanceDetail(selectedGovernanceDetail.value.post.id, { silent: true });
    }
  } catch (error) {
    const message = formatAdminOperationError(error, "社区治理操作失败");
    feedback.value = message;
    governanceNotice.value = message;
  }
}

async function setAuthorGovernance(status: "limited" | "muted" | "banned"): Promise<void> {
  const post = selectedGovernanceDetail.value?.post;
  if (!post) {
    return;
  }
  const reason = globalThis.prompt("请输入作者治理原因", statusLabel(status))?.trim();
  if (!reason) {
    feedback.value = "已取消：作者治理必须填写原因";
    return;
  }
  try {
    await requestAdmin(
      `/admin/community-governance/users/${post.authorUserId}/governance`,
      "POST",
      {
        status,
        reason,
        note: reason
      }
    );
    const message = `作者已设置为${statusLabel(status)}，详情已刷新`;
    feedback.value = message;
    governanceNotice.value = message;
    governanceDetailDirty.value = false;
    await openGovernanceDetail(post.id, { silent: true });
  } catch (error) {
    const message = formatAdminOperationError(error, "作者治理操作失败");
    feedback.value = message;
    governanceNotice.value = message;
  }
}

async function clearAuthorGovernance(): Promise<void> {
  const post = selectedGovernanceDetail.value?.post;
  if (!post) {
    return;
  }
  const reason = globalThis.prompt("请输入解除原因", "解除社区治理限制")?.trim();
  if (!reason) {
    return;
  }
  try {
    await requestAdmin(`/admin/community-governance/users/${post.authorUserId}/unban`, "POST", {
      reason
    });
    const message = "作者社区限制已解除，详情已刷新";
    feedback.value = message;
    governanceNotice.value = message;
    governanceDetailDirty.value = false;
    await openGovernanceDetail(post.id, { silent: true });
  } catch (error) {
    const message = formatAdminOperationError(error, "解除作者治理失败");
    feedback.value = message;
    governanceNotice.value = message;
  }
}

async function applyQueueFilter(nextFilter: Partial<typeof reviewFilters.value>): Promise<void> {
  const inferredGroup =
    nextFilter.reviewGroup ??
    (nextFilter.type === "community_report" ||
    nextFilter.reportReasonCode ||
    nextFilter.reportTargetType ||
    nextFilter.reportPriority
      ? "report"
      : reviewFilters.value.reviewGroup);
  const merged = { ...reviewFilters.value, ...nextFilter, reviewGroup: inferredGroup };

  if (merged.reviewGroup === "report") {
    reviewFilters.value = {
      ...merged,
      source: "community",
      type: "community_report",
      aiRiskTag: "",
      lowCostRiskTag: "",
      lowCostRiskLevel: "",
      reviewDecision: "",
      userRiskReason: "",
      contentSecuritySource: "",
      contentSecurityRiskTag: "",
      manualReviewReason: "",
      imageAuditStatus: ""
    };
  } else if (merged.reviewGroup === "content") {
    reviewFilters.value = {
      ...merged,
      type: merged.type === "community_report" ? "" : merged.type,
      reportReasonCode: "",
      reportTargetType: "",
      reportPriority: ""
    };
  } else {
    reviewFilters.value = merged;
  }
  activeModule.value = "review";
  await loadReviewQueue();
}

async function openReviewDetail(itemId: string): Promise<void> {
  try {
    const response = (await requestAdmin(
      `/admin/operations/review-queue/${encodeURIComponent(itemId)}`,
      "GET"
    )) as { item: AdminOperationsReviewDetail };
    selectedReviewItem.value = response.item;
    reviewDetailDirty.value = true;
    feedback.value = "审核详情已打开";
  } catch (error) {
    selectedReviewItem.value = null;
    feedback.value = formatAdminOperationError(error, "审核详情读取失败");
  }
}

function queueProcessingState(itemId: string): AdminReviewQueueItemProcessingStateType {
  return queueProcessingStates.value[itemId] ?? AdminReviewQueueItemProcessingState.Idle;
}

function setQueueProcessingState(
  itemId: string,
  state: AdminReviewQueueItemProcessingStateType
): void {
  queueProcessingStates.value = { ...queueProcessingStates.value, [itemId]: state };
}

function isQueueItemProcessing(itemId: string): boolean {
  return queueProcessingState(itemId) === AdminReviewQueueItemProcessingState.Processing;
}

function isHighRiskAction(actionName: string): boolean {
  return ["reject", "hide", "handle_report_hide", "handle_report_remove", "archive"].includes(
    actionName
  );
}

function reportTargetAuthorUserId(
  item: AdminOperationsReviewQueueItem | AdminOperationsReviewDetail
): string | undefined {
  return item.type === "community_report" ? item.reportTargetSnapshot?.authorUserId : undefined;
}

function canBanReportedAuthor(
  item: AdminOperationsReviewQueueItem | AdminOperationsReviewDetail
): boolean {
  return Boolean(reportTargetAuthorUserId(item));
}

function resolveReviewActionNote(actionName: string): string | undefined {
  if (!isHighRiskAction(actionName)) {
    return actionLabel(actionName);
  }

  const note = globalThis.prompt("请输入处理备注", actionLabel(actionName))?.trim();
  return note || undefined;
}

async function runReviewAction(
  item: AdminOperationsReviewQueueItem,
  actionValue: string
): Promise<void> {
  if (actionValue === "view_detail") {
    await openReviewDetail(item.itemId);
    return;
  }

  if (isQueueItemProcessing(item.itemId)) {
    feedback.value = "该队列项正在处理中，请勿重复提交";
    return;
  }

  const operationNote = resolveReviewActionNote(actionValue);
  if (operationNote === undefined) {
    feedback.value = "已取消：高风险操作必须填写备注";
    return;
  }

  setQueueProcessingState(item.itemId, AdminReviewQueueItemProcessingState.Processing);
  operationStatus.value = AdminOperationFeedbackStatus.Processing;
  try {
    if (item.type === "community_report") {
      const reportAction =
        actionValue === "handle_report_hide"
          ? "hide"
          : actionValue === "handle_report_remove"
            ? "remove"
            : actionValue === "handle_report_false"
              ? "false_report"
              : "keep";
      await requestAdmin(`/admin/community/reports/${item.targetId}/handle`, "POST", {
        action: reportAction,
        handleNote: operationNote
      });
    } else if (item.type === "community_post") {
      await requestAdmin(`/admin/community/posts/${item.targetId}/review`, "POST", {
        action: actionValue,
        reviewNote: operationNote
      });
    } else if (item.type === "community_comment") {
      await requestAdmin(`/admin/community/comments/${item.targetId}/review`, "POST", {
        action: actionValue,
        reviewNote: operationNote
      });
    } else if (item.type === "community_reply") {
      await requestAdmin(`/admin/community/replies/${item.targetId}/review`, "POST", {
        action: actionValue,
        reviewNote: operationNote
      });
    } else if (item.type === "daily_content_comment") {
      await requestAdmin(`/admin/daily-content/comments/${item.targetId}/review`, "POST", {
        action: actionValue,
        reviewNote: operationNote
      });
    } else if (item.type === "daily_content_issue" && actionValue === "publish_now") {
      await requestAdmin(`/admin/daily-content/issues/${item.targetId}/publish`, "POST", {});
    } else if (item.type === "daily_content_issue" && actionValue === "archive") {
      await requestAdmin(`/admin/daily-content/issues/${item.targetId}/archive`, "POST", {});
    }

    setQueueProcessingState(item.itemId, AdminReviewQueueItemProcessingState.Succeeded);
    operationStatus.value = AdminOperationFeedbackStatus.Succeeded;
    feedback.value = `已执行：${actionLabel(actionValue)}，当前行已更新`;
    reviewQueue.value = reviewQueue.value.filter((entry) => entry.itemId !== item.itemId);
    if (workbench.value) {
      workbench.value = {
        ...workbench.value,
        recentTodos: workbench.value.recentTodos.filter((entry) => entry.itemId !== item.itemId)
      };
    }
    if (selectedReviewItem.value?.itemId === item.itemId) {
      selectedReviewItem.value = null;
      reviewDetailDirty.value = false;
    }
  } catch (error) {
    const stale =
      isAdminRequestError(error) &&
      ["state_changed", "target_not_found"].includes(error.errorReason);
    setQueueProcessingState(
      item.itemId,
      stale ? AdminReviewQueueItemProcessingState.Stale : AdminReviewQueueItemProcessingState.Failed
    );
    operationStatus.value = stale
      ? AdminOperationFeedbackStatus.Stale
      : AdminOperationFeedbackStatus.Failed;
    feedback.value = formatAdminOperationError(error, "审核操作失败");
  }
}

async function banReportedAuthor(
  item: AdminOperationsReviewQueueItem | AdminOperationsReviewDetail
): Promise<void> {
  const authorUserId = reportTargetAuthorUserId(item);
  if (!authorUserId) {
    feedback.value = "该举报缺少被举报作者标识，无法直接封禁账号";
    return;
  }

  if (isQueueItemProcessing(item.itemId)) {
    feedback.value = "该队列项正在处理中，请勿重复提交";
    return;
  }

  const authorName = item.reportTargetSnapshot?.author.displayName ?? authorUserId;
  const reason = globalThis.prompt("请输入封禁原因", `举报后台封禁：${authorName}`)?.trim();
  if (!reason) {
    feedback.value = "已取消：封禁账号必须填写原因";
    return;
  }

  setQueueProcessingState(item.itemId, AdminReviewQueueItemProcessingState.Processing);
  operationStatus.value = AdminOperationFeedbackStatus.Processing;
  try {
    await requestAdmin(
      `/admin/community-governance/users/${encodeURIComponent(authorUserId)}/ban`,
      "POST",
      {
        reason,
        note: reason
      }
    );
    operationStatus.value = AdminOperationFeedbackStatus.Succeeded;
    setQueueProcessingState(item.itemId, AdminReviewQueueItemProcessingState.Idle);
    await loadReviewQueue();
    if (selectedReviewItem.value?.itemId === item.itemId) {
      await openReviewDetail(item.itemId);
    }
    feedback.value = "已封禁被举报内容作者账号，举报仍可继续处理";
  } catch (error) {
    operationStatus.value = AdminOperationFeedbackStatus.Failed;
    setQueueProcessingState(item.itemId, AdminReviewQueueItemProcessingState.Failed);
    feedback.value = formatAdminOperationError(error, "封禁账号失败");
  }
}

async function generateDraft(): Promise<void> {
  const input = globalThis.prompt("新建哪个板块？输入 1 今日参悟，2 离谱卷宗", "1")?.trim();
  const sectionKey =
    input === "2"
      ? "absurd_casefile"
      : input === "daily_reflection" || input === "absurd_casefile"
        ? input
        : "daily_reflection";
  loading.value = true;
  try {
    const issue = (await requestAdmin("/admin/daily-content/drafts/generate", "POST", {
      sectionKey
    })) as DailyContentIssue;
    selectedIssue.value = issue;
    activeDailySectionKey.value = sectionKey;
    activeModule.value = "daily";
    feedback.value = `已创建${DAILY_CONTENT_SECTION_LABELS[sectionKey]}草稿`;
    await syncAll();
  } catch (error) {
    feedback.value = error instanceof Error ? error.message : "草稿创建失败";
  } finally {
    loading.value = false;
  }
}

async function selectIssue(issue: DailyContentIssue): Promise<void> {
  selectedIssue.value = issue;
  sectionPreview.value = null;
  articlePreview.value = null;
  scheduleInput.value = issue.scheduledPublishAt ?? "";
  activeDailySectionKey.value = issue.sections[0]?.sectionKey ?? "daily_reflection";
  validation.value = await requestAdmin(
    `/admin/daily-content/issues/${issue.id}/validation`,
    "GET"
  );
  await loadAllSectionValidations();
}

async function requestAiAssist(): Promise<void> {
  if (!selectedIssue.value) {
    return;
  }

  const result = await requestAdmin("/admin/daily-content/assist", "POST", {
    issueId: selectedIssue.value.id,
    title: selectedIssue.value.title,
    homeSummary: selectedIssue.value.homeSummary,
    sections: selectedIssue.value.sections,
    action: "polish"
  });
  feedback.value = result.suggestions?.join(" ") ?? "AI 辅助建议已生成";
}

async function loadArticlePreview(articleId: string): Promise<void> {
  if (!selectedIssue.value) {
    return;
  }

  articlePreview.value = (await requestAdmin(
    `/admin/daily-content/issues/${selectedIssue.value.id}/articles/${articleId}/preview`,
    "GET"
  )) as DailyContentArticlePreviewResponse;
  feedback.value = "文章预览已刷新";
}

async function loadSectionPreview(sectionKey: DailyContentSectionKey): Promise<void> {
  if (!selectedIssue.value) {
    return;
  }

  activeDailySectionKey.value = sectionKey;
  const preview = (await requestAdmin(
    `/admin/daily-content/issues/${selectedIssue.value.id}/sections/${sectionKey}/preview`,
    "GET"
  )) as DailyContentSectionPreviewResponse;
  sectionPreview.value = preview;
  sectionValidations.value = {
    ...sectionValidations.value,
    [sectionKey]: preview.validation
  };
  articlePreview.value = null;
  feedback.value = `${DAILY_CONTENT_SECTION_LABELS[sectionKey]}预览已刷新`;
}

async function saveIssueSection(
  section: DailyContentSection,
  options: { silent?: boolean } = {}
): Promise<void> {
  if (!selectedIssue.value) {
    return;
  }

  try {
    const issueId = selectedIssue.value.id;
    selectedIssue.value = await requestAdmin(
      `/admin/daily-content/issues/${issueId}/sections/${section.sectionKey}`,
      "PUT",
      normalizeDailySectionForSave(section)
    );
    await loadSectionValidation(section.sectionKey);
    if (!options.silent) {
      feedback.value = `${DAILY_CONTENT_SECTION_LABELS[section.sectionKey]}已保存`;
    }
  } catch (error) {
    applyDailyActionError(error, `${DAILY_CONTENT_SECTION_LABELS[section.sectionKey]}保存失败`);
    if (options.silent) {
      throw error;
    }
  }
}

async function publishSection(section: DailyContentSection): Promise<void> {
  if (!selectedIssue.value) {
    return;
  }

  try {
    const issueId = selectedIssue.value.id;
    const sectionKey = section.sectionKey;
    await saveIssueSection(section, { silent: true });
    const published = await requestAdmin(
      `/admin/daily-content/issues/${issueId}/publish-sections`,
      "POST",
      { sectionKeys: [sectionKey] }
    );
    selectedIssue.value = published;
    await syncAll();
    selectedIssue.value = issues.value.find((issue) => issue.id === issueId) ?? published;
    feedback.value = `已发布：${DAILY_CONTENT_SECTION_LABELS[sectionKey]}`;
  } catch (error) {
    applyDailyActionError(error, `${DAILY_CONTENT_SECTION_LABELS[section.sectionKey]}发布失败`);
  }
}

async function scheduleIssue(): Promise<void> {
  if (!selectedIssue.value || !activeDailySection.value) {
    return;
  }

  try {
    await saveIssueSection(activeDailySection.value, { silent: true });
    selectedIssue.value = await requestAdmin(
      `/admin/daily-content/issues/${selectedIssue.value.id}/schedule`,
      "POST",
      { scheduledPublishAt: scheduleInput.value }
    );
    feedback.value = `已定时发布：${DAILY_CONTENT_SECTION_LABELS[activeDailySection.value.sectionKey]}`;
    await syncAll();
  } catch (error) {
    applyDailyActionError(error, "定时发布失败，请按右侧发布检查补齐内容");
  }
}

async function cancelScheduleIssue(): Promise<void> {
  await issueAction("cancel-schedule", "定时发布已取消");
}

async function loadSectionValidation(sectionKey: DailyContentSectionKey): Promise<void> {
  if (!selectedIssue.value) {
    return;
  }

  const result = (await requestAdmin(
    `/admin/daily-content/issues/${selectedIssue.value.id}/sections/${sectionKey}/validation`,
    "GET"
  )) as DailyContentEditValidationResult;
  sectionValidations.value = {
    ...sectionValidations.value,
    [sectionKey]: result
  };
}

async function loadAllSectionValidations(): Promise<void> {
  if (!selectedIssue.value) {
    sectionValidations.value = {};
    return;
  }

  const entries = await Promise.all(
    DAILY_CONTENT_SECTION_KEYS.map(async (sectionKey) => [
      sectionKey,
      (await requestAdmin(
        `/admin/daily-content/issues/${selectedIssue.value?.id}/sections/${sectionKey}/validation`,
        "GET"
      )) as DailyContentEditValidationResult
    ])
  );
  sectionValidations.value = Object.fromEntries(entries);
}

async function createWorldIntelBatch(publishNow = false): Promise<void> {
  try {
    const articles = parseWorldIntelBatchText(worldIntelBatchText.value);
    if (articles.length === 0) {
      throw new Error("请至少填写一篇文章");
    }
    await requestAdmin("/admin/world-intel/articles/batch", "POST", {
      articles,
      publishNow
    });
    feedback.value = publishNow ? "大陆新闻已批量创建并发布" : "大陆新闻草稿已批量创建";
    worldIntelBatchText.value = "";
    await loadWorldIntelArticles();
  } catch (error) {
    feedback.value = error instanceof Error ? error.message : "大陆新闻批量新增失败";
  }
}

async function saveWorldIntelArticle(publishNow = false): Promise<void> {
  try {
    const payload = worldIntelFormToRequest(worldIntelForm.value);
    const response = selectedWorldIntelArticleId.value
      ? await requestAdmin(
          `/admin/world-intel/articles/${selectedWorldIntelArticleId.value}`,
          "PUT",
          payload
        )
      : await requestAdmin("/admin/world-intel/articles", "POST", {
          ...payload,
          status: publishNow
            ? WORLD_INTEL_ARTICLE_STATUS.Published
            : WORLD_INTEL_ARTICLE_STATUS.Draft
        });
    const article = (response as { article: WorldIntelArticle }).article;
    selectedWorldIntelArticleId.value = article.id;
    worldIntelForm.value = worldIntelArticleToForm(article);
    if (publishNow && article.status !== WORLD_INTEL_ARTICLE_STATUS.Published) {
      await transitionWorldIntelArticle(article, "publish");
      return;
    }
    feedback.value = selectedWorldIntelArticleId.value ? "大陆新闻已保存" : "大陆新闻草稿已创建";
    await loadWorldIntelArticles();
  } catch (error) {
    feedback.value = error instanceof Error ? error.message : "大陆新闻保存失败";
  }
}

function editWorldIntelArticle(article: WorldIntelArticle): void {
  selectedWorldIntelArticleId.value = article.id;
  worldIntelForm.value = worldIntelArticleToForm(article);
  feedback.value = `正在编辑：${article.title}`;
}

function newWorldIntelArticle(): void {
  selectedWorldIntelArticleId.value = null;
  worldIntelForm.value = createEmptyWorldIntelForm();
  feedback.value = "已切换到新建大陆新闻";
}

async function duplicateWorldIntelArticle(article: WorldIntelArticle): Promise<void> {
  selectedWorldIntelArticleId.value = null;
  worldIntelForm.value = {
    ...worldIntelArticleToForm(article),
    id: undefined,
    title: `${article.title} 副本`
  };
  feedback.value = "已复制到编辑表单，可保存为新草稿";
}

async function uploadWorldIntelImage(event: Event): Promise<void> {
  await uploadAndInsertImage(event, worldIntelForm.value);
  const firstImageUrl = extractFirstMarkdownImageUrl(worldIntelForm.value.body);
  if (firstImageUrl) {
    worldIntelForm.value.coverImageUrl = firstImageUrl;
    worldIntelForm.value.imageUrl = firstImageUrl;
  }
}

async function transitionSelectedWorldIntelArticle(
  action: "publish" | "offline" | "hide"
): Promise<void> {
  const article = worldIntelArticles.value.find(
    (entry) => entry.id === selectedWorldIntelArticleId.value
  );
  if (!article) {
    feedback.value = "请先选择或保存一篇大陆新闻";
    return;
  }
  await transitionWorldIntelArticle(article, action);
  const updated = worldIntelArticles.value.find((entry) => entry.id === article.id);
  if (updated) {
    worldIntelForm.value = worldIntelArticleToForm(updated);
  }
}

async function transitionWorldIntelArticle(
  article: WorldIntelArticle,
  action: "publish" | "offline" | "hide"
): Promise<void> {
  await requestAdmin(`/admin/world-intel/articles/${article.id}/${action}`, "POST", {});
  feedback.value = `大陆新闻已${action === "publish" ? "发布" : action === "offline" ? "下线" : "隐藏"}`;
  await loadWorldIntelArticles();
}

function createEmptyWorldIntelForm(): WorldIntelEditorForm {
  return {
    title: "",
    summary: "",
    body: "",
    sourceType: "original",
    publicSourceText: WORLD_INTEL_DEFAULT_PUBLIC_SOURCE,
    sourceName: "",
    sourceTitle: "",
    sourceUrl: "",
    imageUrl: "",
    coverImageUrl: "",
    allowLike: true,
    allowCommunityQuote: true,
    quotePrompt: "我从这条大陆新闻想到："
  };
}

function worldIntelArticleToForm(article: WorldIntelArticle): WorldIntelEditorForm {
  return {
    id: article.id,
    title: article.title,
    summary: article.summary,
    body: article.body,
    sourceType: "original",
    publicSourceText: article.source?.publicSourceText ?? WORLD_INTEL_DEFAULT_PUBLIC_SOURCE,
    sourceName: "",
    sourceTitle: "",
    sourceUrl: "",
    imageUrl: article.source?.imageUrl ?? "",
    coverImageUrl: article.coverImageUrl ?? "",
    allowLike: article.allowLike,
    allowCommunityQuote: article.allowCommunityQuote,
    quotePrompt: article.quotePrompt ?? "我从这条大陆新闻想到："
  };
}

function worldIntelFormToRequest(form: WorldIntelEditorForm): Record<string, unknown> {
  const firstBodyImageUrl = extractFirstMarkdownImageUrl(form.body);
  const directoryImageUrl = firstBodyImageUrl || form.coverImageUrl || form.imageUrl || undefined;
  return {
    id: form.id,
    title: form.title,
    summary: form.summary,
    body: form.body,
    coverImageUrl: directoryImageUrl,
    source: {
      sourceType: "original",
      publicSourceText: WORLD_INTEL_DEFAULT_PUBLIC_SOURCE,
      imageUrl: directoryImageUrl
    },
    allowLike: form.allowLike,
    allowCommunityQuote: form.allowCommunityQuote,
    quotePrompt: form.quotePrompt || undefined
  };
}

function extractFirstMarkdownImageUrl(body: string): string | undefined {
  const match = /!\[[^\]]*]\(([^)\s]+)\)/.exec(body);
  return match?.[1]?.trim() || undefined;
}

function parseWorldIntelBatchText(text: string): Array<Record<string, unknown>> {
  return text
    .split(/\n-{3,}\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, index) => {
      const [title = "", summary = "", ...bodyLines] = block.split(/\r?\n/);
      return {
        title: title.trim(),
        summary: summary.trim(),
        body: bodyLines.join("\n").trim() || summary.trim(),
        source: { sourceType: "original", publicSourceText: WORLD_INTEL_DEFAULT_PUBLIC_SOURCE },
        allowLike: true,
        allowCommunityQuote: true,
        quotePrompt: "我从这条大陆新闻想到：",
        sortOrder: index
      };
    });
}

function duplicateSelectedWorldIntelArticle(): void {
  const article = worldIntelArticles.value.find(
    (entry) => entry.id === selectedWorldIntelArticleId.value
  );
  if (article) {
    void duplicateWorldIntelArticle(article);
  }
}

function sectionValidation(
  sectionKey: DailyContentSectionKey
): DailyContentEditValidationResult | null {
  return sectionValidations.value[sectionKey] ?? null;
}

function sectionBlockingCount(sectionKey: DailyContentSectionKey): number {
  return (
    sectionValidation(sectionKey)?.issues.filter((issue) => issue.severity !== "warning").length ??
    0
  );
}

function sectionWarningCount(sectionKey: DailyContentSectionKey): number {
  return (
    sectionValidation(sectionKey)?.issues.filter((issue) => issue.severity === "warning").length ??
    0
  );
}

async function archiveIssue(): Promise<void> {
  await issueAction("archive", "日报已归档");
}

async function deleteIssue(issue: DailyContentIssue): Promise<void> {
  if (!globalThis.confirm(`确认删除「${issue.title}」吗？删除后会从日报列表隐藏。`)) {
    return;
  }
  await requestAdmin(`/admin/daily-content/issues/${issue.id}/archive`, "POST", {});
  if (selectedIssue.value?.id === issue.id) {
    selectedIssue.value = null;
  }
  feedback.value = "日报已删除";
  await syncAll();
}

async function issueAction(path: string, message: string): Promise<void> {
  if (!selectedIssue.value) {
    return;
  }

  selectedIssue.value = await requestAdmin(
    `/admin/daily-content/issues/${selectedIssue.value.id}/${path}`,
    "POST",
    {}
  );
  feedback.value = message;
  await syncAll();
}

function addArticle(sectionKey: DailyContentSectionKey): void {
  const section = selectedIssue.value?.sections.find((entry) => entry.sectionKey === sectionKey);
  if (!section || section.items.length >= (sectionKey === "daily_reflection" ? 1 : 10)) {
    feedback.value = "该栏目已达到数量上限";
    return;
  }
  section.items.push({
    id: `${selectedIssue.value?.id}-${sectionKey}-${Date.now()}`,
    sectionKey,
    title: "待编辑标题",
    summary: "待编辑摘要",
    body: "待编辑正文",
    source:
      sectionKey === "daily_reflection"
        ? undefined
        : { sectionKey, inputMode: "admin_manual", sourceType: "original" },
    allowLike: true,
    allowCommunityQuote: true,
    quotePrompt: "我从这条日报想到：",
    likeCount: 0
  });
}

function normalizeDailySectionForSave(section: DailyContentSection): DailyContentSection {
  return {
    ...section,
    title: DAILY_CONTENT_SECTION_LABELS[section.sectionKey],
    summary: section.summary?.trim() || defaultDailySectionSummary(section),
    illustrationKey: section.illustrationKey || `daily_${section.sectionKey}`,
    items: section.items.map((item) => {
      const body = item.body?.trim() || item.summary?.trim() || item.title;
      const summary =
        section.sectionKey === "daily_reflection"
          ? summarizeDailyReflection(body)
          : item.summary?.trim() || summarizeDailyReflection(body);
      return {
        ...item,
        title: item.title?.trim() || DAILY_CONTENT_SECTION_LABELS[section.sectionKey],
        summary,
        body,
        quotePrompt:
          item.quotePrompt ||
          (section.sectionKey === "daily_reflection" ? "我从今日参悟想到：" : "我从这条日报想到："),
        source:
          section.sectionKey === "daily_reflection"
            ? undefined
            : {
                ...(item.source ?? {}),
                sectionKey: section.sectionKey,
                inputMode: "admin_manual",
                sourceType: "original",
                publicSourceText: item.source?.publicSourceText || "摸鱼隐者原创"
              }
      };
    })
  };
}

function defaultDailySectionSummary(section: DailyContentSection): string {
  const firstItem = section.items[0];
  return firstItem?.summary || firstItem?.body || DAILY_CONTENT_SECTION_LABELS[section.sectionKey];
}

function summarizeDailyReflection(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.slice(0, 120) || "今日参悟待补充。";
}

function removeArticle(sectionKey: DailyContentSectionKey, itemId: string): void {
  const section = selectedIssue.value?.sections.find((entry) => entry.sectionKey === sectionKey);
  if (section) {
    section.items = section.items.filter((item) => item.id !== itemId);
  }
}

function moveArticle(sectionKey: DailyContentSectionKey, itemId: string, direction: -1 | 1): void {
  const section = selectedIssue.value?.sections.find((entry) => entry.sectionKey === sectionKey);
  if (!section) {
    return;
  }
  const currentIndex = section.items.findIndex((item) => item.id === itemId);
  const nextIndex = currentIndex + direction;
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= section.items.length) {
    return;
  }
  const [item] = section.items.splice(currentIndex, 1);
  section.items.splice(nextIndex, 0, item);
}

function ensureSource(sectionKey: DailyContentSectionKey, itemId: string): void {
  const item = selectedIssue.value?.sections
    .find((entry) => entry.sectionKey === sectionKey)
    ?.items.find((entry) => entry.id === itemId);
  if (item && !item.source) {
    item.source = {
      sectionKey,
      inputMode: "admin_manual",
      sourceType: "original",
      publicSourceText: "摸鱼隐者原创"
    };
  }
}

async function uploadAndInsertImage(event: Event, item: { body: string }): Promise<void> {
  const asset = await uploadDailyContentAsset(event);
  if (!asset) {
    return;
  }

  const imageMarkdown = `\n\n![${asset.fileName}](${apiBaseUrl}${asset.publicUrl})\n\n`;
  item.body = `${item.body || ""}${imageMarkdown}`;
  feedback.value = "图片已上传并插入正文";
}

async function uploadDailyContentAsset(event: Event): Promise<UploadedDailyContentAsset | null> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) {
    return null;
  }

  const prepared = await prepareDailyContentImage(file);
  return (await requestAdmin("/admin/daily-content/assets", "POST", {
    fileName: prepared.fileName,
    mimeType: prepared.mimeType,
    dataUrl: prepared.dataUrl,
    thumbnailDataUrl: prepared.thumbnailDataUrl
  })) as UploadedDailyContentAsset;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

async function prepareDailyContentImage(file: File): Promise<PreparedUploadImage> {
  if (file.type === "image/gif") {
    return {
      fileName: file.name,
      mimeType: file.type,
      dataUrl: await readFileAsDataUrl(file)
    };
  }

  try {
    const image = await loadBrowserImage(file);
    const dataUrl = await drawImageToDataUrl(image, 1600, "image/jpeg", 0.82);
    const thumbnailDataUrl = await drawImageToDataUrl(image, 480, "image/jpeg", 0.72);
    return {
      fileName: file.name.replace(/\.[^.]+$/, ".jpg"),
      mimeType: "image/jpeg",
      dataUrl,
      thumbnailDataUrl
    };
  } catch {
    return {
      fileName: file.name,
      mimeType: file.type,
      dataUrl: await readFileAsDataUrl(file)
    };
  }
}

function loadBrowserImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.addEventListener("load", () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    });
    image.addEventListener("error", () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("图片解码失败"));
    });
    image.src = objectUrl;
  });
}

function drawImageToDataUrl(
  image: HTMLImageElement,
  maxEdge: number,
  mimeType: string,
  quality: number
): Promise<string> {
  const ratio = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * ratio));
  const height = Math.max(1, Math.round(image.naturalHeight * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")?.drawImage(image, 0, 0, width, height);
  return Promise.resolve(canvas.toDataURL(mimeType, quality));
}

function moduleLabel(module: AdminModule): string {
  return module === "workbench"
    ? "运营工作台"
    : module === "review"
      ? "审核队列"
      : module === "governance"
        ? "社区治理"
        : module === "worldIntel"
          ? "大陆新闻"
          : module === "supply"
            ? "补给铺配置"
            : "日报运营";
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "草稿",
    pending: "待处理",
    pending_review: "待复核",
    approved: "已通过",
    rejected: "已驳回",
    hidden: "已隐藏",
    offline: "离线/已下线",
    removed: "已移除",
    normal: "正常",
    limited: "限制",
    muted: "禁言",
    banned: "封禁",
    scheduled: "定时中",
    published: "已发布/已上架",
    archived: "已归档",
    kept: "已保留",
    linked: "已转链",
    failed: "失败",
    created: "已创建",
    imported: "已入账",
    excluded: "已排除",
    not_matched: "未匹配",
    false_report: "误报",
    idle: "空闲",
    processing: "处理中",
    succeeded: "已成功",
    stale: "状态已变化",
    connecting: "连接中",
    live: "实时连接中",
    degraded_polling: "降级轮询",
    recovering: "恢复中",
    loaded: "已加载",
    empty: "空状态",
    no_results: "无结果",
    error: "错误"
  };
  return labels[status] ?? status;
}

function reportReasonLabel(reasonCode?: string): string {
  return reasonCode && reasonCode in COMMUNITY_REPORT_REASON_LABELS
    ? COMMUNITY_REPORT_REASON_LABELS[reasonCode as keyof typeof COMMUNITY_REPORT_REASON_LABELS]
    : reasonCode || "无";
}

function reportPriorityLabel(priority?: string): string {
  return priority === "high" ? "高优先级" : priority === "normal" ? "普通" : priority || "无";
}

function reportDistributionLabel(item: AdminOperationsReviewQueueItem): string {
  const distribution = item.reportReasonDistribution ?? [];
  return distribution.length
    ? distribution
        .map((entry) => `${reportReasonLabel(entry.reasonCode)} ${entry.count}`)
        .join(" / ")
    : "无";
}

function sectionLabel(sectionKey: string): string {
  return SUPPLY_SECTION_OPTIONS.find((option) => option.value === sectionKey)?.label ?? sectionKey;
}

function formatSupplyValidity(item: SupplyItemConfig): string {
  const from = item.validFrom ? formatDate(item.validFrom) : "立即";
  const until = item.validUntil ? formatDate(item.validUntil) : "长期";
  return `${from} / ${until}`;
}

function formatDate(value: string): string {
  return formatDisplayTime(value);
}

function typeLabel(type: string): string {
  const labels: Record<string, string> = {
    community_post: "社区帖子",
    community_comment: "社区评论",
    community_reply: "社区回复",
    community_report: "社区举报",
    daily_content_comment: "日报评论",
    daily_content_issue: "日报发布"
  };
  return labels[type] ?? type;
}

function sourceLabel(source: string): string {
  return source === "community"
    ? "社区"
    : source === "daily_content"
      ? "日报"
      : source === "supply_center"
        ? "补给铺"
        : source === "workbench"
          ? "工作台"
          : source;
}

function reviewAiSummaryLabel(item: AdminOperationsReviewDetail): string {
  if (!item.aiSummary) {
    return "无审核摘要";
  }
  if (item.aiSummary.contentSecurity) {
    return contentSecuritySummaryLabel(item.aiSummary.contentSecurity);
  }
  if (item.aiSummary.lowCost) {
    return `${item.aiSummary.lowCost.riskLevel} / ${item.aiSummary.lowCost.riskTags.join(", ") || "无标签"} / ${item.aiSummary.lowCost.suggestion}`;
  }
  return `${item.aiSummary.riskTags.join(", ") || "无标签"} / ${item.aiSummary.reason || "无原因"}`;
}

function queueRiskLabel(item: AdminOperationsReviewQueueItem): string {
  if (item.type === "community_report") {
    return `${reportPriorityLabel(item.reportPriority)} / ${reportReasonLabel(item.reportReasonCode)}`;
  }
  const contentTags = item.aiSummary?.contentSecurity?.riskTags ?? [];
  if (contentTags.length > 0) {
    return contentTags.join(", ");
  }
  if (item.aiSummary?.lowCost) {
    return `${item.aiSummary.lowCost.riskLevel} / ${item.aiSummary.lowCost.riskTags.join(", ")}`;
  }
  return item.aiSummary?.riskTags.length ? item.aiSummary.riskTags.join(", ") : "无";
}

function queueAuditSourceLabel(item: AdminOperationsReviewQueueItem): string {
  if (item.type === "community_report") {
    return "用户举报";
  }
  return contentSecuritySourceLabel(
    item.aiSummary?.contentSecurity?.source ?? item.aiSummary?.source
  );
}

function contentSecuritySummaryLabel(
  summary: NonNullable<AdminOperationsReviewQueueItem["aiSummary"]>["contentSecurity"]
): string {
  if (!summary) {
    return "无内容安全摘要";
  }
  const tags = summary.riskTags.length > 0 ? summary.riskTags.join(", ") : "无标签";
  return [
    contentSecuritySourceLabel(summary.source),
    contentSecurityDecisionLabel(summary.decision),
    tags,
    summary.reason || summary.suggestion || "无原因"
  ].join(" / ");
}

function contentSecurityManualReasonLabel(item: AdminOperationsReviewDetail): string {
  return item.aiSummary?.contentSecurity?.manualReviewReason ?? item.manualReviewReason ?? "无";
}

function imageAuditSummaryLabel(item: AdminOperationsReviewQueueItem): string {
  const audits = item.aiSummary?.imageAudits ?? [];
  if (audits.length === 0 && !item.imageAuditStatus) {
    return "无图片审核";
  }
  const status = item.imageAuditStatus ? imageAuditStatusLabel(item.imageAuditStatus) : "";
  const auditLabels = audits.map((audit, index) => {
    const trace = audit.traceIdDigest ? ` · trace ${audit.traceIdDigest}` : "";
    return `图${index + 1} ${imageAuditStatusLabel(audit.imageAuditStatus ?? audit.decision)}${trace}`;
  });
  return [status, ...auditLabels].filter(Boolean).join("；");
}

function contentSecuritySourceLabel(source?: string): string {
  const labels: Record<string, string> = {
    local_rules: "本地规则",
    legacy_ai: "旧 AI 兼容",
    mock_ai: "AI/mock",
    wechat_text_security: "微信文本",
    wechat_image_security: "微信图片",
    wechat_content_security_mock: "微信/mock",
    manual_fallback: "人工兜底",
    ai: "AI",
    manual: "人工",
    system: "系统"
  };
  return source ? (labels[source] ?? source) : "人工";
}

function contentSecurityDecisionLabel(decision?: string): string {
  const labels: Record<string, string> = {
    approved: "通过",
    rejected: "驳回",
    needs_manual_review: "需人工复核",
    pending_callback: "待回调",
    manual_review: "人工复核"
  };
  return decision ? (labels[decision] ?? decision) : "无决策";
}

function imageAuditStatusLabel(status?: string): string {
  const labels: Record<string, string> = {
    not_required: "无需图片审核",
    pending_callback: "等待微信回调",
    approved: "图片通过",
    rejected: "图片违规",
    manual_review: "图片需人工复核",
    timeout: "图片回调超时",
    failed: "图片审核失败",
    needs_manual_review: "需人工复核"
  };
  return status ? (labels[status] ?? status) : "无图片状态";
}

function governanceRiskLabel(summary?: AdminCommunityPostOverviewItem["riskSummary"]): string {
  if (!summary) {
    return "无";
  }
  if (summary.contentSecurityRiskTags?.length) {
    return `${contentSecuritySourceLabel(summary.contentSecuritySource)} / ${contentSecurityDecisionLabel(summary.contentSecurityDecision)} / ${summary.contentSecurityRiskTags.join(", ")}`;
  }
  if (summary.lowCostRiskLevel || summary.lowCostRiskTags?.length) {
    return `${summary.lowCostRiskLevel ?? "本地"} / ${summary.lowCostRiskTags?.join(", ") || "无标签"}`;
  }
  return summary.riskTags.length ? summary.riskTags.join(", ") : "无";
}

function ipLocationSummaryLabel(
  ipLocation?:
    | AdminOperationsReviewQueueItem["ipLocation"]
    | AdminCommunityPostOverviewItem["ipLocation"]
): string {
  if (!ipLocation) {
    return "未知";
  }
  const statusLabels: Record<string, string> = {
    resolved: "已解析",
    unknown: "未知",
    failed: "解析失败"
  };
  const status = statusLabels[ipLocation.status] ?? ipLocation.status;
  const reason = ipLocation.failureReason ? ` / ${ipLocation.failureReason}` : "";
  return `${ipLocation.ipLocationLabel || "未知"} / ${status}${reason}`;
}

function identityComplianceLabel(
  compliance?:
    | AdminOperationsReviewQueueItem["identityCompliance"]
    | AdminCommunityPostOverviewItem["identityCompliance"]
): string {
  if (!compliance) {
    return "无";
  }
  return [
    `手机号验证：${compliance.phoneVerified ? "是" : "否"}`,
    `隐私版本：${compliance.privacyPolicyVersion ?? "未记录"}`,
    `社区协议：${compliance.communityAgreementVersion ?? "未记录"}`
  ].join(" / ");
}

function actionLabel(actionName: string): string {
  const labels: Record<string, string> = {
    approve: "通过",
    reject: "驳回",
    hide: "隐藏",
    handle_report_keep: "保留内容",
    handle_report_hide: "隐藏内容",
    handle_report_remove: "移除内容",
    handle_report_false: "标记误报",
    publish_now: "立即发布",
    schedule_publish: "设置定时",
    cancel_schedule: "取消定时",
    archive: "归档",
    view_detail: "查看详情",
    hide_post: "隐藏帖子",
    remove_post: "移除帖子",
    hide_comment: "隐藏评论",
    remove_comment: "移除评论",
    hide_reply: "隐藏回复",
    remove_reply: "移除回复",
    limit_user: "限制作者",
    mute_user: "禁言作者",
    ban_user: "封禁作者",
    clear_user_restriction: "解除限制"
  };
  return labels[actionName] ?? actionName;
}

function publicAssetUrl(url: string | undefined): string {
  if (!url) {
    return "";
  }
  if (/^(https?:|data:|blob:)/.test(url)) {
    return url;
  }
  if (url.startsWith("/")) {
    return `${apiBaseUrl}${url}`;
  }
  return url;
}

function applyDailyActionError(error: unknown, fallback: string): void {
  const requestError = error as Partial<AdminRequestError>;
  if (Array.isArray(requestError.validationIssues)) {
    validation.value = {
      canSaveDraft: true,
      canSubmitReview: false,
      canPublish: false,
      issues: requestError.validationIssues
    };
  }
  feedback.value =
    error instanceof Error && error.message ? `${fallback}：${error.message}` : fallback;
}

async function requestAdmin(path: string, method: HttpMethod, body?: unknown) {
  return adminClient.request(path, method, body);
}
</script>

<template>
  <main class="admin-shell">
    <aside class="sidebar">
      <div class="brand">
        <span class="brand-mark">摸</span>
        <div>
          <strong>{{ APP_NAME }}</strong>
          <small>后台运营中心</small>
        </div>
      </div>

      <nav class="nav">
        <button
          v-for="module in [
            'workbench',
            'review',
            'governance',
            'daily',
            'worldIntel',
            'supply'
          ] as AdminModule[]"
          :key="module"
          type="button"
          :class="{ active: activeModule === module }"
          @click="activeModule = module"
        >
          {{ moduleLabel(module) }}
        </button>
      </nav>

      <div class="sidebar-footer">
        <label>后台令牌</label>
        <input v-model="adminToken" type="password" />
        <button type="button" :disabled="loading" @click="() => syncAll()">同步数据</button>
      </div>
    </aside>

    <section class="main-panel">
      <header class="topbar">
        <div>
          <p class="eyebrow">admin_operations / {{ activeModule }}</p>
          <h1>{{ moduleLabel(activeModule) }}</h1>
        </div>
        <div class="system-status">
          <span class="badge">连接：{{ connectionStatusLabel }}</span>
          <span class="badge">操作：{{ operationStatusLabel }}</span>
          <button
            v-if="newTodoCount > 0"
            type="button"
            class="todo-alert"
            @click="consumeRealtimeTodos"
          >
            有 {{ newTodoCount }} 条新待办
          </button>
          <span>{{ feedback }}</span>
          <button type="button" class="primary" :disabled="loading" @click="generateDraft">
            创建日报草稿
          </button>
          <button
            type="button"
            class="primary"
            :disabled="loading"
            @click="activeModule = 'worldIntel'"
          >
            大陆新闻管理
          </button>
        </div>
      </header>

      <section v-if="activeModule === 'workbench'" class="page-grid">
        <section class="metric-grid">
          <button
            type="button"
            class="metric-card"
            @click="
              applyQueueFilter({
                reviewGroup: 'content',
                source: 'community',
                type: 'community_post'
              })
            "
          >
            <span>待审核帖子</span>
            <strong>{{ workbench?.counts.pendingCommunityPosts ?? 0 }}</strong>
          </button>
          <button
            type="button"
            class="metric-card"
            @click="
              applyQueueFilter({
                reviewGroup: 'content',
                source: 'community',
                type: '',
                reviewDecision: 'manual_review'
              })
            "
          >
            <span>评论/回复复核</span>
            <strong>{{ pendingCommunityDiscussionCount }}</strong>
          </button>
          <button type="button" class="metric-card" @click="activeModule = 'governance'">
            <span>自动处理评论</span>
            <strong>{{ autoHandledCommunityDiscussionCount }}</strong>
          </button>
          <button
            type="button"
            class="metric-card"
            @click="applyQueueFilter({ reviewGroup: 'content', reviewDecision: 'auto_approve' })"
          >
            <span>内容安全自动通过</span>
            <strong>{{ workbench?.counts.contentSecurityAutoApproved ?? 0 }}</strong>
          </button>
          <button
            type="button"
            class="metric-card"
            @click="applyQueueFilter({ reviewGroup: 'content', reviewDecision: 'auto_reject' })"
          >
            <span>内容安全自动驳回</span>
            <strong>{{ workbench?.counts.contentSecurityAutoRejected ?? 0 }}</strong>
          </button>
          <button
            type="button"
            class="metric-card"
            @click="
              applyQueueFilter({ reviewGroup: 'content', imageAuditStatus: 'pending_callback' })
            "
          >
            <span>微信图片待回调</span>
            <strong>{{ workbench?.counts.wechatImagePendingCallbacks ?? 0 }}</strong>
          </button>
          <button
            type="button"
            class="metric-card"
            @click="
              applyQueueFilter({
                reviewGroup: 'content',
                contentSecurityRiskTag: 'provider_failure'
              })
            "
          >
            <span>微信无法确认</span>
            <strong>{{ workbench?.counts.wechatUnableToConfirm ?? 0 }}</strong>
          </button>
          <button
            type="button"
            class="metric-card"
            @click="
              applyQueueFilter({
                reviewGroup: 'report',
                source: 'community',
                type: 'community_report'
              })
            "
          >
            <span>待处理举报</span>
            <strong>{{ workbench?.counts.pendingCommunityReports ?? 0 }}</strong>
          </button>
          <button
            type="button"
            class="metric-card"
            @click="
              applyQueueFilter({
                reviewGroup: 'content',
                source: 'daily_content',
                type: 'daily_content_comment'
              })
            "
          >
            <span>日报评论复核</span>
            <strong>{{ workbench?.counts.pendingDailyContentComments ?? 0 }}</strong>
          </button>
          <button type="button" class="metric-card" @click="activeModule = 'daily'">
            <span>日报发布待办</span>
            <strong>{{ workbench?.counts.pendingDailyContentIssues ?? 0 }}</strong>
          </button>
          <button type="button" class="metric-card" @click="activeModule = 'worldIntel'">
            <span>大陆新闻文章</span>
            <strong>{{ worldIntelArticles.length }}</strong>
          </button>
          <button type="button" class="metric-card" @click="activeModule = 'supply'">
            <span>补给铺活动</span>
            <strong>{{ supplyItems.length }}</strong>
          </button>
        </section>

        <section class="panel realtime-panel">
          <div>
            <h2>实时待办</h2>
            <small>
              {{ connectionStatusLabel }} ·
              {{ lastTodoSummary?.pendingCount ?? queuePendingCount }} 条待办摘要 · 当前模块
              {{ statusLabel(moduleLoadStates[activeModule]) }}
            </small>
          </div>
          <button
            type="button"
            class="primary"
            :disabled="newTodoCount === 0"
            @click="consumeRealtimeTodos"
          >
            查看新待办
          </button>
        </section>

        <section class="two-column">
          <div class="panel">
            <div class="panel-header">
              <h2>最近待办</h2>
              <button type="button" @click="activeModule = 'review'">进入审核队列</button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>来源</th>
                  <th>类型</th>
                  <th>标题</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in workbench?.recentTodos ?? []"
                  :key="item.itemId"
                  :class="{ selected: selectedReviewItem?.itemId === item.itemId }"
                  @click="openReviewDetail(item.itemId)"
                >
                  <td>{{ sourceLabel(item.source) }}</td>
                  <td>{{ typeLabel(item.type) }}</td>
                  <td>{{ item.title }}</td>
                  <td>
                    <span class="badge">{{ statusLabel(item.status) }}</span>
                  </td>
                  <td>
                    <button type="button" @click.stop="openReviewDetail(item.itemId)">查看</button>
                  </td>
                </tr>
                <tr v-if="(workbench?.recentTodos.length ?? 0) === 0">
                  <td colspan="5" class="empty-cell">暂无待办</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="panel">
            <div class="panel-header">
              <h2>今日处理流程</h2>
              <button type="button" @click="activeModule = 'governance'">进入社区治理</button>
            </div>
            <ol class="workflow-list">
              <li>先看工作台待办数，判断优先处理社区、举报还是日报。</li>
              <li>进入审核队列，按来源、类型、状态、内容安全来源、图片状态或风险标签筛选。</li>
              <li>打开详情确认上下文，再执行通过、驳回、隐藏或举报处理。</li>
              <li>进入日报运营，完成今日参悟或离谱卷宗草稿编辑、预览、立即发布或定时发布。</li>
              <li>大陆新闻在独立页面批量新增、编辑、发布和下线，不再作为日报板块维护。</li>
            </ol>
          </div>
        </section>
      </section>

      <section v-if="activeModule === 'supply'" class="page-grid">
        <section class="supply-config-layout">
          <section class="panel">
            <div class="panel-header">
              <div>
                <h2>补给项配置</h2>
                <small>新增、编辑、上下架、排序和有效期都会保存到补给铺配置。</small>
              </div>
              <div class="action-bar">
                <button type="button" @click="startCreateSupplyItem">新增补给</button>
                <button type="button" @click="batchUpdateSupplyStatus('published')">
                  批量上架
                </button>
                <button type="button" @click="batchUpdateSupplyStatus('offline')">批量下线</button>
                <button type="button" :disabled="loading" @click="() => loadSupplyCenterAdmin()">
                  刷新
                </button>
              </div>
            </div>
            <div class="filter-bar supply-filter-bar">
              <select v-model="supplyFilters.sectionKey" @change="() => loadSupplyCenterAdmin()">
                <option value="">全部板块</option>
                <option
                  v-for="option in SUPPLY_SECTION_OPTIONS"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
              <select v-model="supplyFilters.status" @change="() => loadSupplyCenterAdmin()">
                <option value="">全部状态</option>
                <option
                  v-for="option in SUPPLY_STATUS_OPTIONS"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
              <input
                v-model="supplyFilters.tag"
                placeholder="标签"
                @change="() => loadSupplyCenterAdmin()"
              />
              <select
                v-model="supplyFilters.recommendationSlot"
                @change="() => loadSupplyCenterAdmin()"
              >
                <option value="">全部时段</option>
                <option :value="SupplyRecommendationSlot.Lunch">午间</option>
                <option :value="SupplyRecommendationSlot.Afternoon">下午</option>
                <option :value="SupplyRecommendationSlot.MorningCommute">上班通勤</option>
                <option :value="SupplyRecommendationSlot.EveningCommute">下班通勤</option>
              </select>
              <button type="button" @click="() => loadSupplyCenterAdmin()">筛选</button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>选择</th>
                  <th>标题</th>
                  <th>板块</th>
                  <th>标签</th>
                  <th>状态</th>
                  <th>优先级/排序</th>
                  <th>活动标识</th>
                  <th>有效期</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in supplyItems"
                  :key="item.id"
                  :class="{ selected: selectedSupplyItemId === item.id }"
                >
                  <td>
                    <input
                      type="checkbox"
                      :checked="selectedSupplyItemIds.includes(item.id)"
                      @change="
                        toggleSupplySelection(item.id, ($event.target as HTMLInputElement).checked)
                      "
                    />
                  </td>
                  <td class="title-cell">
                    <strong>{{ item.title }}</strong>
                    <small>{{ item.description }}</small>
                  </td>
                  <td>{{ sectionLabel(item.sectionKey) }}</td>
                  <td>{{ item.userVisibleTags.join(" / ") }}</td>
                  <td>{{ statusLabel(item.status) }}</td>
                  <td>{{ item.displayPriority }} / {{ item.sortOrder }}</td>
                  <td>{{ item.jutuikeActId }}</td>
                  <td>{{ formatSupplyValidity(item) }}</td>
                  <td>
                    <div class="table-actions">
                      <button type="button" @click="editSupplyItem(item)">编辑</button>
                      <button
                        v-if="item.status !== SupplyItemStatus.Published"
                        type="button"
                        @click="quickUpdateSupplyItem(item, { status: SupplyItemStatus.Published })"
                      >
                        上架
                      </button>
                      <button
                        v-if="item.status !== SupplyItemStatus.Offline"
                        type="button"
                        @click="quickUpdateSupplyItem(item, { status: SupplyItemStatus.Offline })"
                      >
                        下线
                      </button>
                      <button
                        type="button"
                        @click="quickUpdateSupplyItem(item, { sortOrder: item.sortOrder - 10 })"
                      >
                        上移
                      </button>
                      <button
                        type="button"
                        @click="quickUpdateSupplyItem(item, { sortOrder: item.sortOrder + 10 })"
                      >
                        下移
                      </button>
                      <button type="button" @click="copySupplyItem(item)">复制</button>
                    </div>
                  </td>
                </tr>
                <tr v-if="supplyItems.length === 0">
                  <td colspan="9" class="empty-cell">暂无补给项</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section class="panel">
            <div class="panel-header">
              <div>
                <h2>{{ selectedSupplyItemId ? "编辑补给项" : "新增补给项" }}</h2>
                <small>活动标识填写聚推客 act_id；未到有效期或下线状态不会在小程序展示。</small>
              </div>
              <button type="button" class="primary" :disabled="loading" @click="saveSupplyItem">
                保存补给
              </button>
            </div>
            <div class="supply-form-grid">
              <label>
                稳定 ID
                <input v-model="supplyForm.id" placeholder="留空自动生成，编辑时不建议修改" />
              </label>
              <label>
                标题
                <input v-model="supplyForm.title" placeholder="例如：美团外卖午间饭票" />
              </label>
              <label class="span-2">
                描述
                <textarea v-model="supplyForm.description" placeholder="小程序补给卡片描述" />
              </label>
              <label>
                板块
                <select v-model="supplyForm.sectionKey">
                  <option
                    v-for="option in SUPPLY_SECTION_OPTIONS"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </label>
              <label>
                入账分类
                <select v-model="supplyForm.defaultCategoryKey">
                  <option
                    v-for="option in SUPPLY_CATEGORY_OPTIONS"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </label>
              <label>
                状态
                <select v-model="supplyForm.status">
                  <option
                    v-for="option in SUPPLY_STATUS_OPTIONS"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </label>
              <label>
                排序
                <input v-model.number="supplyForm.sortOrder" type="number" step="10" />
              </label>
              <label>
                操作文案
                <input v-model="supplyForm.actionText" placeholder="去补给" />
              </label>
              <label>
                聚推客活动标识
                <input v-model="supplyForm.jutuikeActId" placeholder="act_id" />
              </label>
              <label>
                活动分组
                <select v-model="supplyForm.groupKey">
                  <option
                    v-for="option in SUPPLY_GROUP_OPTIONS"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </label>
              <label>
                展示优先级
                <input v-model.number="supplyForm.displayPriority" type="number" min="0" />
              </label>
              <label class="span-2">
                用户可见标签
                <input
                  v-model="supplyForm.userVisibleTagsText"
                  placeholder="外卖, 午间饭票, 工作日推荐"
                />
              </label>
              <label>
                推荐时段
                <input
                  v-model="supplyForm.recommendationSlotsText"
                  placeholder="lunch, afternoon"
                />
              </label>
              <label>
                工作日规则
                <select v-model="supplyForm.displayWorkdayRule">
                  <option
                    v-for="option in SUPPLY_WORKDAY_RULE_OPTIONS"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </label>
              <label>
                归因窗口小时
                <input v-model.number="supplyForm.attributionWindowHours" type="number" min="1" />
              </label>
              <label>
                转链有效分钟
                <input v-model.number="supplyForm.transferExpiresMinutes" type="number" min="1" />
              </label>
              <label>
                重复点击窗口秒
                <input v-model.number="supplyForm.clickDedupeWindowSeconds" type="number" min="0" />
              </label>
              <label>
                备用策略
                <select v-model="supplyForm.fallbackStrategy">
                  <option
                    v-for="option in SUPPLY_FALLBACK_OPTIONS"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </label>
              <label>
                备用目标类型
                <select v-model="supplyForm.fallbackTargetType">
                  <option value="">自动</option>
                  <option value="webview">WebView</option>
                  <option value="miniapp">小程序</option>
                </select>
              </label>
              <label>
                有效开始
                <input v-model="supplyForm.validFrom" type="datetime-local" />
              </label>
              <label>
                有效结束
                <input v-model="supplyForm.validUntil" type="datetime-local" />
              </label>
              <label class="span-2">
                封面图 URL
                <input v-model="supplyForm.coverImageUrl" placeholder="可选，https://..." />
              </label>
              <label class="span-2">
                备用链接 URL
                <input v-model="supplyForm.fallbackUrl" placeholder="服务端允许的备用入口" />
              </label>
              <label>
                备用小程序 AppID
                <input v-model="supplyForm.fallbackMiniappAppId" />
              </label>
              <label>
                备用小程序路径
                <input v-model="supplyForm.fallbackMiniappPath" />
              </label>
              <label class="span-2">
                内部备注
                <textarea v-model="supplyForm.internalNote" placeholder="仅后台排查可见" />
              </label>
            </div>
          </section>
        </section>

        <section class="two-column">
          <div class="panel">
            <div class="panel-header">
              <h2>补给点击排查</h2>
            </div>
            <table>
              <thead>
                <tr>
                  <th>时间</th>
                  <th>补给项</th>
                  <th>板块</th>
                  <th>活动</th>
                  <th>sid</th>
                  <th>跳转</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="click in supplyClicks" :key="click.id">
                  <td>{{ formatDate(click.clickedAt) }}</td>
                  <td>{{ click.supplyItemId }}</td>
                  <td>{{ click.sectionKey }}</td>
                  <td>{{ click.jutuikeActId }}</td>
                  <td>{{ click.sidMasked }}</td>
                  <td>{{ statusLabel(click.jumpStatus) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="panel">
            <div class="panel-header">
              <h2>订单同步排查</h2>
            </div>
            <table>
              <thead>
                <tr>
                  <th>订单</th>
                  <th>活动</th>
                  <th>品牌</th>
                  <th>状态</th>
                  <th>匹配</th>
                  <th>入账</th>
                  <th>账单</th>
                  <th>原因</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="record in supplyOrderSyncs" :key="record.id">
                  <td>{{ record.sourceOrderId }}</td>
                  <td>{{ record.actId || "--" }}</td>
                  <td>{{ record.brandId || "--" }}</td>
                  <td>{{ record.sourceStatus }}</td>
                  <td>{{ record.matched ? "已匹配" : "未匹配" }}</td>
                  <td>{{ statusLabel(record.ledgerSyncStatus) }}</td>
                  <td>{{ record.ledgerBillId || "--" }}</td>
                  <td>{{ record.failureReason || "--" }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="two-column">
          <div class="panel">
            <div class="panel-header">
              <div>
                <h2>CPS 异常池</h2>
                <small>只允许查看和重试可恢复异常，不提供无归因强行分配入口。</small>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>订单</th>
                  <th>类型</th>
                  <th>sid</th>
                  <th>金额</th>
                  <th>原因</th>
                  <th>更新时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in supplyExceptions" :key="item.id">
                  <td>{{ item.sourceOrderId }}</td>
                  <td>{{ item.exceptionType }}</td>
                  <td>{{ item.sidMasked || "--" }}</td>
                  <td>{{ (item.amountMinor / 100).toFixed(2) }}</td>
                  <td>{{ item.failureExplanation }}</td>
                  <td>{{ formatDate(item.updatedAt) }}</td>
                </tr>
                <tr v-if="supplyExceptions.length === 0">
                  <td colspan="6" class="empty-cell">暂无异常订单</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="panel">
            <div class="panel-header">
              <div>
                <h2>CPS 指标面板</h2>
                <small>点击、转链、订单回流、有效入账和异常订单。</small>
              </div>
            </div>
            <div class="metric-grid supply-metric-grid">
              <div class="metric-card">
                <small>今日点击</small>
                <strong>{{ supplyMetrics?.todayClickCount ?? 0 }}</strong>
              </div>
              <div class="metric-card">
                <small>独立用户</small>
                <strong>{{ supplyMetrics?.uniqueClickUserCount ?? 0 }}</strong>
              </div>
              <div class="metric-card">
                <small>转链成功率</small>
                <strong>{{ Math.round((supplyMetrics?.transferSuccessRate ?? 0) * 100) }}%</strong>
              </div>
              <div class="metric-card">
                <small>有效订单</small>
                <strong>{{ supplyMetrics?.effectiveOrderCount ?? 0 }}</strong>
              </div>
              <div class="metric-card">
                <small>异常订单</small>
                <strong>{{ supplyMetrics?.exceptionOrderCount ?? 0 }}</strong>
              </div>
            </div>
            <dl class="world-meta-list">
              <dt>入账金额</dt>
              <dd>{{ ((supplyMetrics?.ledgerAmountMinor ?? 0) / 100).toFixed(2) }}</dd>
              <dt>订单回流</dt>
              <dd>{{ supplyMetrics?.orderReturnCount ?? 0 }}</dd>
              <dt>普通用户预览</dt>
              <dd>{{ supplyPreview?.preview.todayPanel.scenarioLabel || "未生成" }}</dd>
            </dl>
          </div>
        </section>
      </section>

      <section v-if="activeModule === 'review'" class="review-layout">
        <div class="panel">
          <div class="panel-header">
            <div>
              <h2>{{ reviewQueueTitle }}</h2>
              <small>{{ queuePendingCount }} 条当前结果 · {{ reviewQueueHint }}</small>
            </div>
            <button type="button" @click="loadReviewQueue">刷新队列</button>
          </div>

          <div class="review-group-tabs">
            <button
              type="button"
              :class="{ active: isContentReviewMode }"
              @click="setReviewQueueGroup('content')"
            >
              <span>内容审核</span>
              <strong>{{ contentReviewPendingCount }}</strong>
            </button>
            <button
              type="button"
              :class="{ active: isReportReviewMode }"
              @click="setReviewQueueGroup('report')"
            >
              <span>举报审核</span>
              <strong>{{ reportReviewPendingCount }}</strong>
            </button>
            <button
              type="button"
              :class="{ active: reviewFilters.reviewGroup === 'all' }"
              @click="setReviewQueueGroup('all')"
            >
              <span>全部待办</span>
              <strong>{{ contentReviewPendingCount + reportReviewPendingCount }}</strong>
            </button>
          </div>

          <div class="filter-bar">
            <template v-if="!isReportReviewMode">
              <select v-model="reviewFilters.source" @change="loadReviewQueue">
                <option value="">全部来源</option>
                <option value="community">社区</option>
                <option value="daily_content">日报</option>
              </select>
              <select v-model="reviewFilters.type" @change="loadReviewQueue">
                <option value="">全部内容类型</option>
                <option value="community_post">社区帖子</option>
                <option value="community_comment">社区评论</option>
                <option value="community_reply">社区回复</option>
                <option value="daily_content_comment">日报评论</option>
              </select>
            </template>
            <input v-model="reviewFilters.status" placeholder="状态，如 pending" />
            <template v-if="!isContentReviewMode">
              <select v-model="reviewFilters.reportReasonCode" @change="loadReviewQueue">
                <option value="">全部举报原因</option>
                <option
                  v-for="reasonCode in COMMUNITY_REPORT_REASON_CODES"
                  :key="reasonCode"
                  :value="reasonCode"
                >
                  {{ reportReasonLabel(reasonCode) }}
                </option>
              </select>
              <select v-model="reviewFilters.reportTargetType" @change="loadReviewQueue">
                <option value="">全部举报目标</option>
                <option :value="CommunityReportTargetType.Post">帖子</option>
                <option :value="CommunityReportTargetType.Comment">评论</option>
                <option :value="CommunityReportTargetType.Reply">回复</option>
              </select>
              <select v-model="reviewFilters.reportPriority" @change="loadReviewQueue">
                <option value="">全部举报优先级</option>
                <option :value="CommunityReportPriority.High">高优先级</option>
                <option :value="CommunityReportPriority.Normal">普通</option>
              </select>
            </template>
            <template v-if="!isReportReviewMode">
              <input v-model="reviewFilters.aiRiskTag" placeholder="内容/AI 风险标签" />
              <select v-model="reviewFilters.lowCostRiskLevel" @change="loadReviewQueue">
                <option value="">全部风险等级</option>
                <option value="high">高风险</option>
                <option value="medium">中风险</option>
                <option value="low">低风险</option>
              </select>
              <input v-model="reviewFilters.lowCostRiskTag" placeholder="本地风险标签" />
              <select v-model="reviewFilters.reviewDecision" @change="loadReviewQueue">
                <option value="">全部决策</option>
                <option value="manual_review">人工复核</option>
                <option value="auto_approve">自动通过</option>
                <option value="auto_reject">自动驳回</option>
              </select>
              <input v-model="reviewFilters.userRiskReason" placeholder="用户风险原因" />
              <select v-model="reviewFilters.contentSecuritySource" @change="loadReviewQueue">
                <option value="">全部内容安全来源</option>
                <option value="local_rules">本地规则</option>
                <option value="wechat_text_security">微信文本</option>
                <option value="wechat_image_security">微信图片</option>
                <option value="wechat_content_security_mock">微信/mock</option>
                <option value="manual_fallback">人工兜底</option>
              </select>
              <input
                v-model="reviewFilters.contentSecurityRiskTag"
                placeholder="内容安全风险标签"
              />
              <input v-model="reviewFilters.manualReviewReason" placeholder="人工复核原因" />
              <select v-model="reviewFilters.imageAuditStatus" @change="loadReviewQueue">
                <option value="">全部图片状态</option>
                <option value="pending_callback">等待微信回调</option>
                <option value="approved">图片通过</option>
                <option value="rejected">图片违规</option>
                <option value="manual_review">图片需人工复核</option>
                <option value="timeout">回调超时</option>
                <option value="failed">审核失败</option>
              </select>
            </template>
            <button type="button" class="primary" @click="loadReviewQueue">应用筛选</button>
          </div>

          <table>
            <thead>
              <tr>
                <th>来源</th>
                <th>对象</th>
                <th>状态</th>
                <th>风险标签</th>
                <th>审核来源</th>
                <th>图片状态</th>
                <th>用户风险</th>
                <th>IP属地</th>
                <th>摘要</th>
                <th>作者</th>
                <th>时间</th>
                <th>处理态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in reviewQueue"
                :key="item.itemId"
                :class="{
                  selected: selectedReviewItem?.itemId === item.itemId,
                  'report-row': item.type === 'community_report'
                }"
                @click="openReviewDetail(item.itemId)"
              >
                <td>{{ sourceLabel(item.source) }}</td>
                <td>
                  <span class="badge">{{ typeLabel(item.type) }}</span>
                </td>
                <td>
                  <span class="badge">{{ statusLabel(item.status) }}</span>
                </td>
                <td>
                  {{ queueRiskLabel(item) }}
                </td>
                <td>
                  {{ queueAuditSourceLabel(item) }}
                  <small v-if="item.aiSummary?.contentSecurity">
                    {{ contentSecurityDecisionLabel(item.aiSummary.contentSecurity.decision) }}
                  </small>
                </td>
                <td>{{ imageAuditSummaryLabel(item) }}</td>
                <td>{{ item.userRiskReasons?.join(", ") || item.manualReviewReason || "无" }}</td>
                <td>{{ ipLocationSummaryLabel(item.ipLocation) }}</td>
                <td class="title-cell">
                  <strong>{{ item.title }}</strong>
                  <small>{{ item.summary }}</small>
                </td>
                <td>
                  {{ item.author?.displayName ?? "无公开作者" }}
                </td>
                <td>{{ formatDate(item.createdAt) }}</td>
                <td>
                  <span class="badge">{{ statusLabel(queueProcessingState(item.itemId)) }}</span>
                </td>
                <td class="table-actions">
                  <button
                    type="button"
                    :disabled="isQueueItemProcessing(item.itemId)"
                    @click.stop="openReviewDetail(item.itemId)"
                  >
                    详情
                  </button>
                  <button
                    v-if="canBanReportedAuthor(item)"
                    type="button"
                    class="text-danger"
                    :disabled="isQueueItemProcessing(item.itemId)"
                    @click.stop="banReportedAuthor(item)"
                  >
                    封禁账号
                  </button>
                  <button
                    v-for="actionName in item.availableActions.filter(
                      (entry) => entry !== 'view_detail'
                    )"
                    :key="actionName"
                    type="button"
                    :class="{
                      primary: actionName === 'approve',
                      'text-danger': isHighRiskAction(actionName)
                    }"
                    :disabled="isQueueItemProcessing(item.itemId)"
                    @click.stop="runReviewAction(item, actionName)"
                  >
                    {{ actionLabel(actionName) }}
                  </button>
                </td>
              </tr>
              <tr v-if="reviewQueue.length === 0">
                <td colspan="13" class="empty-cell">当前筛选下暂无待处理内容</td>
              </tr>
            </tbody>
          </table>
        </div>

        <aside class="detail-panel">
          <template v-if="selectedReviewItem">
            <div class="panel-header">
              <div>
                <h2>审核详情</h2>
                <small>{{ selectedReviewItem.context.label }}</small>
              </div>
              <span class="badge">{{ statusLabel(selectedReviewItem.status) }}</span>
            </div>
            <dl>
              <dt>标题</dt>
              <dd>{{ selectedReviewItem.title }}</dd>
              <dt>正文</dt>
              <dd>{{ selectedReviewItem.body }}</dd>
              <dt>作者</dt>
              <dd>
                {{ selectedReviewItem.author?.displayName ?? "无公开作者" }}
              </dd>
              <dt>发布 IP 属地</dt>
              <dd>{{ ipLocationSummaryLabel(selectedReviewItem.ipLocation) }}</dd>
              <dt>身份合规</dt>
              <dd>{{ identityComplianceLabel(selectedReviewItem.identityCompliance) }}</dd>
              <template v-if="selectedReviewItem.type === 'community_report'">
                <dt>举报原因</dt>
                <dd>{{ reportReasonLabel(selectedReviewItem.reportReasonCode) }}</dd>
                <dt>补充说明</dt>
                <dd>{{ selectedReviewItem.reportReasonText || "无" }}</dd>
                <dt>举报优先级</dt>
                <dd>{{ reportPriorityLabel(selectedReviewItem.reportPriority) }}</dd>
                <dt>同目标举报</dt>
                <dd>{{ selectedReviewItem.reportCount ?? 1 }} 条</dd>
                <dt>原因分布</dt>
                <dd>{{ reportDistributionLabel(selectedReviewItem) }}</dd>
                <dt>举报目标</dt>
                <dd>
                  {{ selectedReviewItem.related?.reportTargetType ?? "未知" }} /
                  {{ selectedReviewItem.related?.reportTargetId ?? selectedReviewItem.targetId }}
                </dd>
              </template>
              <template v-if="selectedReviewItem.mediaAssets?.length">
                <dt>上传图片</dt>
                <dd>
                  <div class="review-media-grid">
                    <a
                      v-for="asset in selectedReviewItem.mediaAssets"
                      :key="asset.id"
                      :href="publicAssetUrl(asset.url)"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        :src="publicAssetUrl(asset.thumbnailUrl || asset.url)"
                        alt="用户上传图片"
                      />
                    </a>
                  </div>
                </dd>
              </template>
              <dt>审核判断</dt>
              <dd>{{ reviewAiSummaryLabel(selectedReviewItem) }}</dd>
              <template v-if="selectedReviewItem.aiSummary?.contentSecurity">
                <dt>内容安全来源</dt>
                <dd>
                  {{
                    contentSecuritySourceLabel(selectedReviewItem.aiSummary.contentSecurity.source)
                  }}
                </dd>
                <dt>内容安全风险</dt>
                <dd>
                  {{
                    selectedReviewItem.aiSummary.contentSecurity.riskTags.join(", ") || "无风险标签"
                  }}
                </dd>
                <dt>人工复核原因</dt>
                <dd>{{ contentSecurityManualReasonLabel(selectedReviewItem) }}</dd>
                <dt>脱敏任务摘要</dt>
                <dd>{{ selectedReviewItem.aiSummary.contentSecurity.traceIdDigest || "无" }}</dd>
              </template>
              <template v-if="selectedReviewItem.aiSummary?.imageAudits?.length">
                <dt>图片审核状态</dt>
                <dd>
                  <div
                    v-for="(audit, index) in selectedReviewItem.aiSummary.imageAudits"
                    :key="`${selectedReviewItem.itemId}-image-audit-${index}`"
                    class="audit-line"
                  >
                    <strong>图 {{ index + 1 }}</strong>
                    <span>{{
                      imageAuditStatusLabel(audit.imageAuditStatus ?? audit.decision)
                    }}</span>
                    <small>{{ audit.reason || audit.suggestion || "无原因" }}</small>
                    <small v-if="audit.traceIdDigest">trace {{ audit.traceIdDigest }}</small>
                  </div>
                </dd>
              </template>
              <template v-if="selectedReviewItem.reviewDecision">
                <dt>审核决策</dt>
                <dd>{{ selectedReviewItem.reviewDecision }}</dd>
              </template>
              <template v-if="selectedReviewItem.userRiskReasons?.length">
                <dt>用户风险原因</dt>
                <dd>{{ selectedReviewItem.userRiskReasons.join(", ") }}</dd>
              </template>
              <template v-if="selectedReviewItem.aiSummary?.commentReview">
                <dt>处理建议</dt>
                <dd>{{ selectedReviewItem.aiSummary.commentReview.suggestion }}</dd>
              </template>
              <template v-if="selectedReviewItem.aiSummary?.lowCost">
                <dt>命中词</dt>
                <dd>
                  {{ selectedReviewItem.aiSummary.lowCost.hitTerms.join(", ") || "无" }}
                </dd>
                <dt>命中字段</dt>
                <dd>
                  {{ selectedReviewItem.aiSummary.lowCost.hitFields.join(", ") || "无" }}
                </dd>
              </template>
            </dl>
            <div class="detail-actions">
              <button
                v-if="canBanReportedAuthor(selectedReviewItem)"
                type="button"
                class="text-danger"
                :disabled="isQueueItemProcessing(selectedReviewItem.itemId)"
                @click="banReportedAuthor(selectedReviewItem)"
              >
                封禁账号
              </button>
              <button
                v-for="actionName in selectedReviewItem.availableActions.filter(
                  (entry) => entry !== 'view_detail'
                )"
                :key="actionName"
                type="button"
                :class="{
                  primary: actionName === 'approve' || actionName === 'publish_now',
                  'text-danger': isHighRiskAction(actionName)
                }"
                :disabled="isQueueItemProcessing(selectedReviewItem.itemId)"
                @click="runReviewAction(selectedReviewItem, actionName)"
              >
                {{ actionLabel(actionName) }}
              </button>
            </div>
          </template>
          <template v-else>
            <h2>选择一条队列项</h2>
            <p>在表格中点击“详情”后，这里会展示原文、上下文、AI 标签和可用操作。</p>
          </template>
        </aside>
      </section>

      <section v-if="activeModule === 'governance'" class="review-layout">
        <div class="panel">
          <div class="panel-header">
            <div>
              <h2>社区帖子总览</h2>
              <small>{{ governancePosts.length }} 条后台可见帖子</small>
            </div>
            <button type="button" @click="loadGovernancePosts">刷新总览</button>
          </div>

          <div v-if="governanceNotice" class="operation-notice">
            {{ governanceNotice }}
          </div>

          <div class="filter-bar">
            <input v-model="governanceFilters.keyword" placeholder="标题、正文、ID、作者昵称" />
            <select v-model="governanceFilters.status" @change="loadGovernancePosts">
              <option value="">全部状态</option>
              <option value="pending">待处理</option>
              <option value="approved">已通过</option>
              <option value="rejected">已驳回</option>
              <option value="hidden">已隐藏</option>
              <option value="removed">已移除</option>
            </select>
            <select v-model="governanceFilters.sectionKey" @change="loadGovernancePosts">
              <option value="">全部分区</option>
              <option value="recommended">推荐</option>
              <option value="key_shadow">键影</option>
              <option value="water_escape">运影</option>
              <option value="sky_strategy">策影</option>
              <option value="wanderer">行影</option>
              <option value="boss_rant">魔王吐槽</option>
            </select>
            <input v-model="governanceFilters.authorUserId" placeholder="作者 userId" />
            <select v-model="governanceFilters.lowCostRiskLevel" @change="loadGovernancePosts">
              <option value="">全部风险</option>
              <option value="high">高风险</option>
              <option value="medium">中风险</option>
              <option value="low">低风险</option>
            </select>
            <input v-model="governanceFilters.riskTag" placeholder="风险标签" />
            <button type="button" class="primary" @click="loadGovernancePosts">搜索</button>
          </div>

          <table>
            <thead>
              <tr>
                <th>帖子</th>
                <th>作者</th>
                <th>分区</th>
                <th>风险</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="post in governancePosts"
                :key="post.id"
                :class="{ selected: selectedGovernanceDetail?.post.id === post.id }"
                @click="openGovernanceDetail(post.id)"
              >
                <td class="title-cell">
                  <strong>{{ post.title }}</strong>
                  <small>{{ post.excerpt }}</small>
                </td>
                <td>
                  {{ post.author.displayName }}
                  <small>{{ post.authorUserId }}</small>
                </td>
                <td>{{ post.sectionKey }}</td>
                <td>{{ governanceRiskLabel(post.riskSummary) }}</td>
                <td>
                  <span class="badge">{{ statusLabel(post.status) }}</span>
                </td>
                <td class="table-actions">
                  <button type="button" @click.stop="openGovernanceDetail(post.id)">详情</button>
                  <button
                    type="button"
                    @click.stop="runGovernanceAction('posts', post.id, 'hide_post')"
                  >
                    隐藏
                  </button>
                  <button
                    type="button"
                    class="text-danger"
                    @click.stop="runGovernanceAction('posts', post.id, 'remove_post')"
                  >
                    移除
                  </button>
                </td>
              </tr>
              <tr v-if="governancePosts.length === 0">
                <td colspan="6" class="empty-cell">当前筛选下暂无社区帖子</td>
              </tr>
            </tbody>
          </table>
        </div>

        <aside class="detail-panel">
          <template v-if="selectedGovernanceDetail">
            <div class="panel-header">
              <div>
                <h2>治理详情</h2>
                <small>{{ selectedGovernanceDetail.post.author.displayName }}</small>
              </div>
              <span class="badge">{{ statusLabel(selectedGovernanceDetail.post.status) }}</span>
            </div>
            <section class="governance-post-detail">
              <small>帖子标题</small>
              <strong>{{ selectedGovernanceDetail.post.title }}</strong>
              <small>帖子正文</small>
              <p>{{ selectedGovernanceDetail.post.body }}</p>
            </section>
            <section
              v-if="selectedGovernanceDetail.post.mediaAssets.length"
              class="governance-post-detail"
            >
              <small>帖子图片</small>
              <div class="governance-image-grid">
                <a
                  v-for="asset in selectedGovernanceDetail.post.mediaAssets"
                  :key="asset.id"
                  :href="publicAssetUrl(asset.url)"
                  target="_blank"
                  rel="noreferrer"
                >
                  <img :src="publicAssetUrl(asset.thumbnailUrl || asset.url)" alt="帖子图片" />
                </a>
              </div>
            </section>
            <dl>
              <dt>作者治理状态</dt>
              <dd>{{ statusLabel(selectedGovernanceDetail.authorGovernance.status) }}</dd>
              <dt>作者身份合规</dt>
              <dd>
                手机号验证：{{
                  selectedGovernanceDetail.authorGovernance.phoneVerified ? "是" : "否"
                }}
                / 隐私版本：{{
                  selectedGovernanceDetail.authorGovernance.privacyPolicyVersion ?? "未记录"
                }}
                / 社区协议：{{
                  selectedGovernanceDetail.authorGovernance.communityAgreementVersion ?? "未记录"
                }}
              </dd>
              <dt>作者最近公开 IP 属地</dt>
              <dd>
                {{ selectedGovernanceDetail.authorGovernance.recentIpLocationLabel ?? "未知" }}
              </dd>
              <dt>帖子发布 IP 属地</dt>
              <dd>{{ ipLocationSummaryLabel(selectedGovernanceDetail.post.ipLocation) }}</dd>
              <dt>帖子身份合规</dt>
              <dd>
                {{ identityComplianceLabel(selectedGovernanceDetail.post.identityCompliance) }}
              </dd>
              <dt>内容安全摘要</dt>
              <dd>{{ governanceRiskLabel(selectedGovernanceDetail.post.riskSummary) }}</dd>
              <dt>图片审核状态</dt>
              <dd>
                {{
                  imageAuditStatusLabel(selectedGovernanceDetail.post.riskSummary?.imageAuditStatus)
                }}
              </dd>
              <dt>脱敏 trace 摘要</dt>
              <dd>{{ selectedGovernanceDetail.post.riskSummary?.traceIdDigest ?? "无" }}</dd>
              <dt>举报摘要</dt>
              <dd>{{ selectedGovernanceDetail.reports.length }} 条举报</dd>
              <template v-if="selectedGovernanceDetail.reportCases?.length">
                <dt>举报案件</dt>
                <dd>
                  <div
                    v-for="reportCase in selectedGovernanceDetail.reportCases"
                    :key="reportCase.targetKey"
                    class="audit-line"
                  >
                    <strong>{{ reportCase.targetSummary }}</strong>
                    <span>
                      {{ reportCase.reportCount }} 条 ·
                      {{ reportPriorityLabel(reportCase.priority) }}
                    </span>
                    <small>
                      {{
                        reportCase.reasonDistribution
                          .map((entry) => `${reportReasonLabel(entry.reasonCode)} ${entry.count}`)
                          .join(" / ") || "无原因分布"
                      }}
                    </small>
                  </div>
                </dd>
              </template>
              <dt>治理历史</dt>
              <dd>{{ selectedGovernanceDetail.governanceHistory.length }} 条记录</dd>
            </dl>
            <div class="detail-actions">
              <button type="button" @click="setAuthorGovernance('limited')">限制</button>
              <button type="button" @click="setAuthorGovernance('muted')">禁言</button>
              <button type="button" class="text-danger" @click="setAuthorGovernance('banned')">
                封禁
              </button>
              <button type="button" @click="clearAuthorGovernance">解除</button>
            </div>
            <section class="content-section">
              <h2>评论与回复</h2>
              <article
                v-for="comment in selectedGovernanceDetail.comments"
                :key="comment.id"
                class="issue-row"
              >
                <div>
                  <strong>{{ comment.author.displayName }}</strong>
                  <p>{{ comment.body }}</p>
                  <small>
                    {{ statusLabel(comment.status) }} ·
                    {{ governanceRiskLabel(comment.riskSummary) }} ·
                    {{ ipLocationSummaryLabel(comment.ipLocation) }}
                  </small>
                  <div v-for="reply in comment.replies" :key="reply.id" class="governance-reply">
                    <strong>{{ reply.author.displayName }}</strong>
                    <p>{{ reply.body }}</p>
                    <small>
                      {{ statusLabel(reply.status) }} ·
                      {{ governanceRiskLabel(reply.riskSummary) }} ·
                      {{ ipLocationSummaryLabel(reply.ipLocation) }}
                    </small>
                    <button
                      type="button"
                      @click="runGovernanceAction('replies', reply.id, 'hide_reply')"
                    >
                      隐藏回复
                    </button>
                    <button
                      type="button"
                      class="text-danger"
                      @click="runGovernanceAction('replies', reply.id, 'remove_reply')"
                    >
                      移除回复
                    </button>
                  </div>
                </div>
                <div class="table-actions">
                  <button
                    type="button"
                    @click="runGovernanceAction('comments', comment.id, 'hide_comment')"
                  >
                    隐藏
                  </button>
                  <button
                    type="button"
                    class="text-danger"
                    @click="runGovernanceAction('comments', comment.id, 'remove_comment')"
                  >
                    移除
                  </button>
                </div>
              </article>
            </section>
          </template>
          <template v-else>
            <h2>选择社区帖子</h2>
            <p>打开帖子后可查看全文、评论回复、举报摘要、作者状态和治理历史。</p>
          </template>
        </aside>
      </section>

      <section
        v-if="activeModule === 'daily'"
        class="daily-layout"
        @input="dailyEditorDirty = true"
      >
        <aside class="issue-panel">
          <div class="panel-header">
            <h2>日报列表</h2>
            <button type="button" @click="generateDraft">新建</button>
          </div>
          <div class="operation-notice">
            大陆新闻已拆到独立内容库，当前日报页只维护今日参悟和离谱卷宗。
            <button type="button" @click="activeModule = 'worldIntel'">进入大陆新闻管理</button>
          </div>
          <article
            v-for="issue in issues"
            :key="issue.id"
            class="issue-row"
            :class="{ active: selectedIssue?.id === issue.id }"
          >
            <button type="button" class="issue-select" @click="selectIssue(issue)">
              <strong>{{ issue.title }}</strong>
              <small>
                {{
                  DAILY_CONTENT_SECTION_LABELS[issue.sections[0]?.sectionKey ?? "daily_reflection"]
                }}
                · {{ issue.businessDate }} · {{ statusLabel(issue.status) }}
              </small>
            </button>
            <button type="button" class="text-danger" @click="deleteIssue(issue)">删除</button>
          </article>
          <p v-if="issues.length === 0" class="empty-text">暂无日报草稿</p>
        </aside>

        <section v-if="selectedIssue" class="edit-panel">
          <section class="content-section issue-settings-panel">
            <div class="panel-header">
              <div>
                <span class="badge">{{ statusLabel(selectedIssue.status) }}</span>
                <h2>{{ DAILY_CONTENT_SECTION_LABELS[selectedIssueSectionKey] }}</h2>
                <small>{{ selectedIssue.businessDate }} · 独立板块记录</small>
              </div>
              <div class="action-bar">
                <button
                  v-if="activeDailySection"
                  type="button"
                  @click="saveIssueSection(activeDailySection)"
                >
                  保存
                </button>
                <button type="button" @click="requestAiAssist">AI 辅助</button>
                <button
                  v-if="activeDailySection"
                  type="button"
                  @click="loadSectionPreview(activeDailySection.sectionKey)"
                >
                  预览
                </button>
                <button
                  v-if="activeDailySection"
                  type="button"
                  class="primary"
                  @click="publishSection(activeDailySection)"
                >
                  发布
                </button>
                <button type="button" @click="scheduleIssue">定时发布</button>
                <button type="button" @click="cancelScheduleIssue">取消定时</button>
                <button
                  v-if="activeDailySection"
                  type="button"
                  @click="addArticle(activeDailySection.sectionKey)"
                >
                  新增内容
                </button>
                <button type="button" @click="archiveIssue">归档</button>
              </div>
            </div>

            <div class="form-grid">
              <label class="span-2">
                定时发布时间
                <input v-model="scheduleInput" placeholder="2026-05-27T18:00:00.000Z" />
              </label>
            </div>
          </section>

          <div class="section-switcher single-section-banner">
            <button type="button" class="active">
              <span>{{ DAILY_CONTENT_SECTION_LABELS[selectedIssueSectionKey] }}</span>
              <small>
                {{ activeDailySection?.items.length ?? 0 }} 条 · 阻断
                {{ sectionBlockingCount(selectedIssueSectionKey) }} · 提示
                {{ sectionWarningCount(selectedIssueSectionKey) }}
              </small>
            </button>
          </div>

          <section v-if="activeDailySection" class="daily-section-grid">
            <article class="content-section daily-section-workspace">
              <div class="panel-header">
                <div>
                  <h2>{{ DAILY_CONTENT_SECTION_LABELS[activeDailySection.sectionKey] }}</h2>
                  <small> 当前只保存、预览和发布这个板块，其他板块不会被一起提交。 </small>
                </div>
              </div>

              <div class="section-check-strip">
                <span
                  :class="
                    sectionValidation(activeDailySection.sectionKey)?.canPublish
                      ? 'ok-dot'
                      : 'danger-dot'
                  "
                />
                <span>
                  {{
                    sectionValidation(activeDailySection.sectionKey)?.canPublish
                      ? "本板块可发布"
                      : "本板块需处理"
                  }}
                </span>
              </div>

              <ul
                v-if="sectionValidation(activeDailySection.sectionKey)?.issues.length"
                class="issue-list-compact section-issue-list"
              >
                <li
                  v-for="issue in sectionValidation(activeDailySection.sectionKey)?.issues ?? []"
                  :key="`${activeDailySection.sectionKey}-${issue.field}-${issue.message}`"
                >
                  <span :class="issue.severity === 'warning' ? 'warning-dot' : 'danger-dot'" />
                  {{ issue.message }}
                </li>
              </ul>

              <article
                v-for="item in activeDailySection.items"
                :key="item.id"
                class="article-editor"
              >
                <div class="article-toolbar">
                  <strong>{{ item.title || "未命名内容" }}</strong>
                  <div class="table-actions">
                    <button
                      type="button"
                      @click="moveArticle(activeDailySection.sectionKey, item.id, -1)"
                    >
                      上移
                    </button>
                    <button
                      type="button"
                      @click="moveArticle(activeDailySection.sectionKey, item.id, 1)"
                    >
                      下移
                    </button>
                    <button
                      type="button"
                      @click="removeArticle(activeDailySection.sectionKey, item.id)"
                    >
                      删除
                    </button>
                    <button
                      v-if="activeDailySection.sectionKey !== 'daily_reflection'"
                      type="button"
                      @click="loadArticlePreview(item.id)"
                    >
                      预览本文
                    </button>
                  </div>
                </div>

                <div class="form-grid">
                  <label>
                    内容标题
                    <input v-model="item.title" />
                  </label>
                  <label v-if="activeDailySection.sectionKey !== 'daily_reflection'" class="span-2">
                    摘要
                    <textarea v-model="item.summary" />
                  </label>
                  <label class="span-2">
                    正文
                    <textarea v-model="item.body" class="body-input" />
                  </label>
                </div>
                <label
                  v-if="activeDailySection.sectionKey !== 'daily_reflection'"
                  class="inline-upload"
                >
                  上传图片并插入正文
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    @change="uploadAndInsertImage($event, item)"
                  />
                </label>
                <button
                  v-if="!item.source && activeDailySection.sectionKey !== 'daily_reflection'"
                  type="button"
                  @click="ensureSource(activeDailySection.sectionKey, item.id)"
                >
                  补充来源字段
                </button>

                <div v-if="item.source" class="source-grid">
                  <label>
                    公开来源说明
                    <input v-model="item.source.publicSourceText" />
                  </label>
                  <label>
                    来源链接
                    <input v-model="item.source.sourceUrl" />
                  </label>
                </div>
              </article>
            </article>
          </section>
        </section>

        <aside class="inspector-panel">
          <div class="panel-header">
            <h2>发布检查</h2>
            <span class="badge">{{
              activeSectionValidation?.canPublish ? "可发布" : "需处理"
            }}</span>
          </div>
          <div class="check-summary">
            <strong>{{ activeSectionBlockingCount }}</strong>
            <span>阻断项</span>
            <strong>{{ activeSectionWarningCount }}</strong>
            <span>提示项</span>
          </div>
          <ul class="issue-list-compact">
            <li
              v-for="issue in activeSectionValidation?.issues ?? []"
              :key="`${issue.field}-${issue.message}`"
            >
              <span :class="issue.severity === 'warning' ? 'warning-dot' : 'danger-dot'" />
              {{ issue.message }}
            </li>
            <li v-if="(activeSectionValidation?.issues.length ?? 0) === 0">暂无校验问题</li>
          </ul>

          <div v-if="sectionPreview" class="preview-box">
            <h2>板块预览</h2>
            <strong>{{ sectionPreview.sectionLabel }}</strong>
            <p v-if="sectionPreview.reflection">{{ sectionPreview.reflection.text }}</p>
            <template v-if="sectionPreview.column">
              <p>{{ sectionPreview.column.summary }}</p>
              <small>{{ sectionPreview.column.articleCount }} 篇文章</small>
            </template>
            <small v-for="article in sectionPreview.articles" :key="article.id">
              {{ article.title }}
            </small>
          </div>

          <div v-if="articlePreview" class="preview-box">
            <h2>文章预览</h2>
            <strong>{{ articlePreview.article.title }}</strong>
            <p>{{ articlePreview.article.summary }}</p>
          </div>
        </aside>
      </section>

      <section
        v-if="activeModule === 'worldIntel'"
        class="world-intel-layout"
        @input="worldIntelFormDirty = true"
      >
        <aside class="world-intel-list-panel">
          <div class="panel-header">
            <div>
              <h2>大陆新闻库</h2>
              <small>{{ worldIntelArticles.length }} 篇后台可见文章</small>
            </div>
            <button type="button" @click="newWorldIntelArticle">新建</button>
          </div>
          <div class="world-filter-bar">
            <select v-model="worldIntelFilters.status" @change="loadWorldIntelArticles">
              <option value="">全部状态</option>
              <option :value="WORLD_INTEL_ARTICLE_STATUS.Draft">草稿</option>
              <option :value="WORLD_INTEL_ARTICLE_STATUS.Published">已发布</option>
              <option :value="WORLD_INTEL_ARTICLE_STATUS.Offline">已下线</option>
              <option :value="WORLD_INTEL_ARTICLE_STATUS.Hidden">已隐藏</option>
            </select>
            <input v-model="worldIntelFilters.keyword" placeholder="搜索标题、摘要、来源" />
            <button type="button" class="primary" @click="loadWorldIntelArticles">搜索</button>
          </div>
          <div class="world-intel-card-list">
            <article
              v-for="article in worldIntelArticles"
              :key="article.id"
              class="world-intel-card"
              :class="{ active: selectedWorldIntelArticleId === article.id }"
              @click="editWorldIntelArticle(article)"
            >
              <div class="world-card-title-row">
                <strong>{{ article.title }}</strong>
                <span class="badge">{{ statusLabel(article.status) }}</span>
              </div>
              <p>{{ article.summary }}</p>
              <small>
                {{ article.source?.sourceName || article.source?.publicSourceText || "无公开来源" }}
                · {{ formatDisplayTime(article.updatedAt) }}
              </small>
            </article>
            <p v-if="worldIntelArticles.length === 0" class="empty-text">暂无大陆新闻文章</p>
          </div>
        </aside>

        <section class="world-intel-editor-panel">
          <section class="content-section world-editor-section">
            <div class="panel-header">
              <div>
                <h2>{{ selectedWorldIntelArticleId ? "编辑文章" : "新建文章" }}</h2>
                <small>填写结构化字段，保存草稿后可发布、下线或隐藏。</small>
              </div>
              <div class="action-bar">
                <button type="button" @click="saveWorldIntelArticle(false)">保存草稿</button>
                <button type="button" class="primary" @click="saveWorldIntelArticle(true)">
                  保存并发布
                </button>
                <button type="button" @click="transitionSelectedWorldIntelArticle('offline')">
                  下线
                </button>
                <button
                  type="button"
                  class="text-danger"
                  @click="transitionSelectedWorldIntelArticle('hide')"
                >
                  隐藏
                </button>
              </div>
            </div>

            <div class="world-form-grid">
              <label class="span-2">
                标题
                <input v-model="worldIntelForm.title" placeholder="输入大陆新闻标题" />
              </label>
              <label class="span-2">
                摘要
                <textarea
                  v-model="worldIntelForm.summary"
                  class="compact-textarea"
                  placeholder="列表和详情页展示的摘要"
                />
              </label>
              <label class="span-2">
                正文
                <textarea
                  v-model="worldIntelForm.body"
                  class="world-body-input"
                  placeholder="输入正文，支持普通换行和 Markdown 图片"
                />
              </label>
              <label class="span-2">
                正文配图
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  @change="uploadWorldIntelImage"
                />
                <small>上传后会插入正文，目录图默认读取正文里的第一张图片。</small>
              </label>
              <label>
                引用提示
                <input v-model="worldIntelForm.quotePrompt" />
              </label>
              <label class="checkbox-label">
                <input v-model="worldIntelForm.allowLike" type="checkbox" />
                允许点赞
              </label>
              <label class="checkbox-label">
                <input v-model="worldIntelForm.allowCommunityQuote" type="checkbox" />
                允许引用到社区
              </label>
            </div>
          </section>
        </section>

        <aside class="world-intel-side-panel">
          <section class="content-section">
            <div class="panel-header">
              <div>
                <h2>快速批量</h2>
                <small>每篇用三行起步：标题、摘要、正文；文章之间用 --- 分隔。</small>
              </div>
            </div>
            <textarea
              v-model="worldIntelBatchText"
              class="batch-textarea"
              placeholder="第一篇标题&#10;第一篇摘要&#10;第一篇正文&#10;---&#10;第二篇标题&#10;第二篇摘要&#10;第二篇正文"
            />
            <label class="checkbox-label">
              <input v-model="worldIntelPublishOnCreate" type="checkbox" />
              批量创建后立即发布
            </label>
            <button
              type="button"
              class="primary wide-button"
              @click="createWorldIntelBatch(worldIntelPublishOnCreate)"
            >
              批量创建
            </button>
          </section>

          <section class="content-section">
            <div class="panel-header">
              <h2>当前文章</h2>
            </div>
            <dl class="world-meta-list">
              <dt>ID</dt>
              <dd>{{ selectedWorldIntelArticleId || "未保存" }}</dd>
              <dt>操作</dt>
              <dd>
                <button
                  v-if="selectedWorldIntelArticleId"
                  type="button"
                  @click="duplicateSelectedWorldIntelArticle"
                >
                  复制为草稿
                </button>
              </dd>
            </dl>
          </section>
        </aside>
      </section>
    </section>
  </main>
</template>

<style scoped>
.admin-shell {
  min-width: 1280px;
  min-height: 100vh;
  display: grid;
  grid-template-columns: 240px minmax(1040px, 1fr);
  color: v-bind("semanticTokens.primaryText");
  background: #080b12;
}

.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 24px;
  padding: 24px 18px;
  border-right: 1px solid v-bind("colors.border");
  background: #0d111c;
}

.brand {
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 12px;
  align-items: center;
}

.brand-mark {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 8px;
  color: #071018;
  font-weight: 900;
  background: v-bind("semanticTokens.reward");
}

.brand strong,
.brand small,
.sidebar-footer,
.nav,
.main-panel,
.topbar,
.system-status,
.page-grid,
.metric-grid,
.two-column,
.panel,
.panel-header,
.review-layout,
.daily-layout,
.issue-panel,
.issue-row,
.edit-panel,
.form-grid,
.section-switcher,
.daily-section-grid,
.content-section,
.article-editor,
.article-toolbar,
.source-grid,
.inspector-panel,
.detail-panel,
.detail-actions,
.preview-box {
  display: grid;
}

.operation-notice {
  display: grid;
  min-height: 40px;
  align-items: center;
  padding: 0 12px;
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 8px;
  color: #86efac;
  background: rgba(34, 197, 94, 0.08);
  font-size: 13px;
  font-weight: 700;
}

.brand small,
small,
label,
.empty-text,
.summary {
  color: v-bind("semanticTokens.secondaryText");
}

.nav,
.sidebar-footer {
  gap: 10px;
}

.nav button {
  justify-content: start;
  height: 42px;
  padding: 0 12px;
  border-color: transparent;
  background: transparent;
}

.nav button.active {
  color: #071018;
  background: v-bind("semanticTokens.reward");
}

.main-panel {
  align-content: start;
  gap: 22px;
  padding: 24px;
}

.topbar {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 24px;
  padding-bottom: 18px;
  border-bottom: 1px solid v-bind("colors.border");
}

.system-status {
  grid-auto-flow: column;
  align-items: center;
  gap: 12px;
}

.todo-alert {
  border-color: rgba(250, 204, 21, 0.5);
  color: #fef3c7;
  background: rgba(250, 204, 21, 0.14);
}

.realtime-panel {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
}

.eyebrow {
  margin: 0 0 6px;
  color: v-bind("semanticTokens.accent");
  font-size: 12px;
  font-weight: 800;
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  font-size: 28px;
  line-height: 1.2;
}

h2 {
  font-size: 16px;
}

.page-grid,
.panel,
.issue-panel,
.edit-panel,
.inspector-panel,
.detail-panel,
.content-section,
.article-editor {
  gap: 16px;
}

.metric-grid {
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
}

.metric-card,
.panel,
.issue-panel,
.edit-panel,
.inspector-panel,
.detail-panel {
  border: 1px solid v-bind("colors.border");
  border-radius: 8px;
  background: #101522;
}

.metric-card {
  justify-items: start;
  gap: 8px;
  padding: 16px;
}

.metric-card strong {
  font-size: 30px;
}

.two-column {
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.55fr);
  gap: 16px;
}

.panel,
.issue-panel,
.edit-panel,
.inspector-panel,
.detail-panel {
  padding: 16px;
}

.panel-header,
.article-toolbar {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
}

.workflow-list {
  display: grid;
  gap: 12px;
  margin: 0;
  padding-left: 20px;
  color: v-bind("semanticTokens.secondaryText");
}

.review-layout {
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 16px;
  align-items: start;
}

.review-group-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.review-group-tabs button {
  justify-items: start;
  min-height: 54px;
  padding: 10px 12px;
  border-color: v-bind("colors.border");
  background: #0c1220;
}

.review-group-tabs button.active {
  border-color: v-bind("semanticTokens.reward");
  color: v-bind("semanticTokens.primaryText");
  background: rgba(245, 158, 11, 0.14);
}

.review-group-tabs span,
.review-group-tabs strong {
  display: block;
}

.review-group-tabs strong {
  font-size: 18px;
}

.filter-bar {
  display: grid;
  grid-template-columns: 150px 180px 1fr 1fr 110px;
  gap: 10px;
}

.report-row {
  background: rgba(34, 211, 238, 0.04);
}

.audit-line {
  display: grid;
  gap: 4px;
  padding: 8px 0;
  border-bottom: 1px solid v-bind("colors.border");
}

.supply-filter-bar {
  display: grid;
  grid-template-columns: 130px 130px minmax(120px, 1fr) 150px auto;
  gap: 10px;
  align-items: center;
}

.supply-metric-grid {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.daily-layout {
  grid-template-columns: 260px minmax(0, 1fr) 320px;
  gap: 16px;
  align-items: start;
}

.issue-panel,
.inspector-panel {
  position: sticky;
  top: 24px;
}

.issue-row {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 6px;
  padding: 12px;
  border: 1px solid v-bind("colors.border");
  border-radius: 6px;
  border-color: v-bind("colors.border");
  background: #0c1220;
}

.issue-row.active {
  border-color: v-bind("semanticTokens.accent");
}

.issue-select {
  justify-content: start;
  min-height: auto;
  padding: 0;
  border: 0;
  background: transparent;
}

.issue-select strong,
.issue-select small {
  display: block;
}

.action-bar,
.table-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.form-grid,
.source-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.span-2 {
  grid-column: span 2;
}

.daily-section-grid {
  gap: 16px;
}

.section-switcher {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.section-switcher button {
  justify-items: start;
  gap: 4px;
  min-height: 58px;
  padding: 10px 12px;
}

.section-switcher button.active {
  border-color: v-bind("semanticTokens.reward");
  color: v-bind("semanticTokens.primaryText");
  background: rgba(245, 158, 11, 0.12);
}

.section-switcher span,
.section-switcher small {
  display: block;
}

.issue-settings-panel {
  border-color: rgba(34, 211, 238, 0.28);
}

.daily-section-workspace {
  gap: 16px;
}

.section-check-strip {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid rgba(34, 211, 238, 0.18);
  border-radius: 8px;
  background: #091321;
  color: v-bind("semanticTokens.secondaryText");
  font-size: 13px;
  font-weight: 700;
}

.section-issue-list {
  padding: 10px 12px;
  border: 1px solid v-bind("colors.border");
  border-radius: 8px;
  background: #090e19;
}

label {
  display: grid;
  gap: 6px;
  font-size: 13px;
}

.content-section,
.article-editor,
.preview-box {
  padding: 14px;
  border: 1px solid v-bind("colors.border");
  border-radius: 8px;
  background: #0c1220;
}

.governance-post-detail {
  display: grid;
  gap: 10px;
  padding: 14px;
  border: 1px solid rgba(34, 211, 238, 0.22);
  border-radius: 8px;
  background: #091321;
}

.governance-post-detail strong {
  color: v-bind("semanticTokens.primaryText");
  font-size: 16px;
  line-height: 1.5;
}

.governance-post-detail p {
  max-height: 360px;
  overflow: auto;
  color: v-bind("semanticTokens.primaryText");
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
}

.governance-image-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.governance-image-grid a {
  display: block;
  overflow: hidden;
  aspect-ratio: 1;
  border: 1px solid v-bind("colors.border");
  border-radius: 6px;
  background: #050914;
}

.governance-image-grid img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.body-input {
  min-height: 180px;
}

.json-input {
  width: 100%;
  min-height: 320px;
  font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
}

.world-intel-layout {
  display: grid;
  grid-template-columns: 300px minmax(520px, 1fr) 340px;
  gap: 16px;
  align-items: start;
}

.supply-config-layout {
  display: grid;
  grid-template-columns: minmax(620px, 1.1fr) minmax(420px, 0.9fr);
  gap: 16px;
  align-items: start;
}

.supply-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.world-intel-list-panel,
.world-intel-editor-panel,
.world-intel-side-panel {
  min-width: 0;
}

.world-intel-list-panel {
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 1px solid v-bind("colors.border");
  border-radius: 8px;
  background: #0c1220;
}

.world-filter-bar {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.world-intel-card-list {
  display: grid;
  gap: 10px;
  max-height: calc(100vh - 270px);
  overflow: auto;
  padding-right: 2px;
}

.world-intel-card {
  display: grid;
  gap: 8px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  background: #090e19;
  cursor: pointer;
}

.world-intel-card.active,
.world-intel-card:hover {
  border-color: v-bind("semanticTokens.reward");
  background: rgba(245, 158, 11, 0.1);
}

.world-card-title-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  justify-content: space-between;
}

.world-card-title-row strong,
.world-intel-card p {
  overflow-wrap: anywhere;
}

.world-intel-card p {
  margin: 0;
  color: v-bind("semanticTokens.secondaryText");
  font-size: 13px;
  line-height: 1.5;
}

.world-intel-card small {
  color: v-bind("semanticTokens.mutedText");
}

.world-editor-section {
  display: grid;
  gap: 16px;
}

.world-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.compact-textarea {
  min-height: 88px;
}

.world-body-input {
  min-height: 340px;
  line-height: 1.7;
}

.checkbox-label {
  display: flex;
  grid-template-columns: none;
  gap: 8px;
  align-items: center;
}

.checkbox-label input {
  width: auto;
}

.world-intel-side-panel {
  display: grid;
  gap: 16px;
}

.batch-textarea {
  min-height: 260px;
  line-height: 1.65;
  font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
}

.wide-button {
  width: 100%;
}

.world-meta-list {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 10px;
}

.world-meta-list dt {
  color: v-bind("semanticTokens.mutedText");
  font-size: 12px;
}

.world-meta-list dd {
  margin: 0;
  color: v-bind("semanticTokens.secondaryText");
  overflow-wrap: anywhere;
}

.inline-upload {
  width: max-content;
}

.uploaded-image-row {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 10px;
  border: 1px solid v-bind("colors.border");
  border-radius: 8px;
  background: #090e19;
}

.uploaded-image-row img {
  width: 120px;
  height: 68px;
  object-fit: cover;
  border-radius: 6px;
}

.review-media-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.review-media-grid a {
  display: block;
  overflow: hidden;
  aspect-ratio: 1;
  border: 1px solid v-bind("colors.border");
  border-radius: 6px;
  background: #090e19;
}

.review-media-grid img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.uploaded-image-row span {
  overflow: hidden;
  color: v-bind("semanticTokens.secondaryText");
  text-overflow: ellipsis;
  white-space: nowrap;
}

.check-summary {
  display: grid;
  grid-template-columns: auto 1fr auto 1fr;
  gap: 8px;
  align-items: baseline;
  padding: 12px;
  border-radius: 8px;
  background: #0c1220;
}

.check-summary strong {
  font-size: 24px;
}

.issue-list-compact {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.issue-list-compact li {
  display: grid;
  grid-template-columns: 10px 1fr;
  gap: 8px;
  align-items: start;
  color: v-bind("semanticTokens.secondaryText");
}

.warning-dot,
.danger-dot,
.ok-dot {
  width: 8px;
  height: 8px;
  margin-top: 6px;
  border-radius: 50%;
}

.warning-dot {
  background: v-bind("semanticTokens.reward");
}

.danger-dot {
  background: #ef4444;
}

.ok-dot {
  background: #22c55e;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

th,
td {
  padding: 11px 10px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
  text-align: left;
  vertical-align: top;
}

th {
  color: v-bind("semanticTokens.secondaryText");
  font-weight: 700;
}

tr.selected td {
  background: rgba(34, 211, 238, 0.06);
}

.title-cell {
  max-width: 460px;
}

.title-cell strong,
.title-cell small {
  display: block;
}

.title-cell small {
  max-height: 36px;
  overflow: hidden;
}

.badge {
  display: inline-grid;
  min-height: 24px;
  align-items: center;
  padding: 0 8px;
  border: 1px solid rgba(34, 211, 238, 0.28);
  border-radius: 999px;
  color: v-bind("semanticTokens.accent");
  background: rgba(34, 211, 238, 0.08);
  font-size: 12px;
  font-weight: 700;
}

.empty-cell {
  height: 96px;
  color: v-bind("semanticTokens.secondaryText");
  text-align: center;
}

dl {
  display: grid;
  gap: 8px;
  margin: 0;
}

dt {
  color: v-bind("semanticTokens.secondaryText");
  font-size: 12px;
}

dd {
  margin: 0 0 8px;
  line-height: 1.6;
}

input,
textarea,
select,
button {
  min-height: 36px;
  border: 1px solid v-bind("colors.border");
  border-radius: 6px;
  color: v-bind("semanticTokens.primaryText");
  background: #0b1020;
  font: inherit;
}

input,
textarea,
select {
  width: 100%;
  padding: 8px 10px;
}

textarea {
  min-height: 90px;
  resize: vertical;
}

button {
  display: inline-grid;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  cursor: pointer;
}

button.primary {
  border-color: transparent;
  color: #071018;
  background: v-bind("semanticTokens.reward");
  font-weight: 800;
}

button.primary.ghost {
  border-color: rgba(250, 204, 21, 0.55);
  color: v-bind("semanticTokens.reward");
  background: rgba(250, 204, 21, 0.08);
}

button.text-danger {
  color: #fca5a5;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
