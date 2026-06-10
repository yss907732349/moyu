import type { AiContentModerationTrace } from "./ai-content-moderation";
import type {
  CommunityAuthorSnapshot,
  CommunityIdentityComplianceSummary,
  CommunityIpLocationAdminSummary,
  CommunityPublicMediaAsset,
  CommunityReportCaseSummary,
  CommunityReportPriority,
  CommunityReportReasonCode,
  CommunityReportReasonCount,
  CommunityReportTargetSnapshot,
  CommunityReportTargetType
} from "./community-lite";
import type {
  CommentReviewDecision,
  CommentReviewDecisionSummary,
  CommentReviewUserRiskReason,
  LowCostModerationRiskLevel,
  LowCostModerationRiskTag
} from "./low-cost-content-moderation";
import type {
  ContentSecurityImageAuditStatus,
  ContentSecurityReviewSummary,
  ContentSecurityRiskTag,
  ContentSecuritySource
} from "./content-security-moderation";

export const AdminOperationsSource = {
  Community: "community",
  DailyContent: "daily_content",
  SupplyCenter: "supply_center",
  Workbench: "workbench"
} as const;

export type AdminOperationsSource =
  (typeof AdminOperationsSource)[keyof typeof AdminOperationsSource];

export const AdminReviewItemType = {
  CommunityPost: "community_post",
  CommunityComment: "community_comment",
  CommunityReply: "community_reply",
  CommunityReport: "community_report",
  DailyContentComment: "daily_content_comment",
  DailyContentIssue: "daily_content_issue"
} as const;

export type AdminReviewItemType = (typeof AdminReviewItemType)[keyof typeof AdminReviewItemType];

export const AdminReviewAction = {
  Approve: "approve",
  Reject: "reject",
  Hide: "hide",
  HandleReportKeep: "handle_report_keep",
  HandleReportHide: "handle_report_hide",
  HandleReportRemove: "handle_report_remove",
  HandleReportFalse: "handle_report_false",
  PublishNow: "publish_now",
  SchedulePublish: "schedule_publish",
  CancelSchedule: "cancel_schedule",
  Archive: "archive",
  ViewDetail: "view_detail"
} as const;

export type AdminReviewAction = (typeof AdminReviewAction)[keyof typeof AdminReviewAction];

export const AdminReviewStatus = {
  Pending: "pending",
  Approved: "approved",
  Rejected: "rejected",
  Hidden: "hidden",
  Removed: "removed",
  Kept: "kept",
  FalseReport: "false_report",
  Draft: "draft",
  Scheduled: "scheduled",
  Published: "published",
  Archived: "archived"
} as const;

export type AdminReviewStatus = (typeof AdminReviewStatus)[keyof typeof AdminReviewStatus];

export const AdminOperationsRealtimeEventType = {
  ReviewCreated: "review_created",
  ReportCreated: "report_created",
  DailyCommentReviewCreated: "daily_comment_review_created",
  WorkbenchCountsChanged: "workbench_counts_changed",
  ReviewStateChanged: "review_state_changed",
  Heartbeat: "heartbeat"
} as const;

export type AdminOperationsRealtimeEventType =
  (typeof AdminOperationsRealtimeEventType)[keyof typeof AdminOperationsRealtimeEventType];

export const AdminOperationsRealtimeTargetType = {
  Workbench: "workbench",
  ReviewQueue: "review_queue",
  CommunityPost: AdminReviewItemType.CommunityPost,
  CommunityComment: AdminReviewItemType.CommunityComment,
  CommunityReply: AdminReviewItemType.CommunityReply,
  CommunityReport: AdminReviewItemType.CommunityReport,
  DailyContentComment: AdminReviewItemType.DailyContentComment,
  DailyContentIssue: AdminReviewItemType.DailyContentIssue,
  SupplyCenterItem: "supply_center_item",
  SupplyCenterOrderSync: "supply_center_order_sync"
} as const;

export type AdminOperationsRealtimeTargetType =
  (typeof AdminOperationsRealtimeTargetType)[keyof typeof AdminOperationsRealtimeTargetType];

export const AdminReviewQueueItemProcessingState = {
  Idle: "idle",
  Processing: "processing",
  Succeeded: "succeeded",
  Failed: "failed",
  Stale: "stale"
} as const;

export type AdminReviewQueueItemProcessingState =
  (typeof AdminReviewQueueItemProcessingState)[keyof typeof AdminReviewQueueItemProcessingState];

export const AdminOperationsConnectionStatus = {
  Connecting: "connecting",
  Live: "live",
  DegradedPolling: "degraded_polling",
  Offline: "offline",
  Recovering: "recovering"
} as const;

export type AdminOperationsConnectionStatus =
  (typeof AdminOperationsConnectionStatus)[keyof typeof AdminOperationsConnectionStatus];

export const AdminModuleLoadState = {
  Idle: "idle",
  Loading: "loading",
  Loaded: "loaded",
  Empty: "empty",
  NoResults: "no_results",
  Error: "error"
} as const;

export type AdminModuleLoadState = (typeof AdminModuleLoadState)[keyof typeof AdminModuleLoadState];

export const AdminOperationFeedbackStatus = {
  Idle: "idle",
  Processing: "processing",
  Succeeded: "succeeded",
  Failed: "failed",
  Stale: "stale"
} as const;

export type AdminOperationFeedbackStatus =
  (typeof AdminOperationFeedbackStatus)[keyof typeof AdminOperationFeedbackStatus];

export const AdminOperationErrorReason = {
  Unauthorized: "unauthorized",
  NetworkFailure: "network_failure",
  StatusNotAllowed: "status_not_allowed",
  TargetNotFound: "target_not_found",
  ValidationFailed: "validation_failed",
  StateChanged: "state_changed",
  Unknown: "unknown"
} as const;

export type AdminOperationErrorReason =
  (typeof AdminOperationErrorReason)[keyof typeof AdminOperationErrorReason];

export interface AdminOperationsWorkbenchCounts {
  pendingCommunityPosts: number;
  pendingCommunityComments: number;
  pendingCommunityReplies: number;
  pendingCommunityReports: number;
  pendingDailyContentComments: number;
  pendingDailyContentIssues: number;
  autoApprovedCommunityDiscussions: number;
  autoRejectedCommunityDiscussions: number;
  manualReviewCommunityDiscussions: number;
  contentSecurityAutoApproved: number;
  contentSecurityAutoRejected: number;
  wechatImagePendingCallbacks: number;
  wechatUnableToConfirm: number;
}

export interface AdminOperationsQueueDeltaSummary {
  added: number;
  removed: number;
  updated: number;
  pendingTotal: number;
  source?: AdminOperationsSource;
  targetType?: AdminOperationsRealtimeTargetType;
}

export interface AdminOperationsTodoSummary {
  pendingCount: number;
  counts: AdminOperationsWorkbenchCounts;
  queueDelta: AdminOperationsQueueDeltaSummary;
  generatedAt: string;
}

export interface AdminOperationsRealtimeEvent {
  eventId: string;
  eventType: AdminOperationsRealtimeEventType;
  source: AdminOperationsSource;
  targetType: AdminOperationsRealtimeTargetType;
  targetId: string;
  createdAt: string;
  pendingCount: number;
  queueDelta: AdminOperationsQueueDeltaSummary;
}

export interface AdminOperationsActionTarget {
  source: AdminOperationsSource;
  type: AdminReviewItemType;
  targetId: string;
  endpoint: string;
}

export interface AdminOperationsAiSummary {
  source?: "ai" | "manual" | "system" | string;
  riskTags: readonly string[];
  reason?: string;
  confidence?: number;
  manualReviewReason?: string;
  lowCost?: AdminOperationsLowCostSummary;
  commentReview?: CommentReviewDecisionSummary;
  contentSecurity?: AdminOperationsContentSecuritySummary;
  imageAudits?: readonly AdminOperationsContentSecuritySummary[];
}

export interface AdminOperationsContentSecuritySummary {
  source: ContentSecuritySource | string;
  decision: string;
  riskTags: readonly ContentSecurityRiskTag[];
  reason?: string;
  suggestion?: string;
  manualReviewReason?: string;
  providerSuggest?: string;
  providerLabel?: string;
  traceIdDigest?: string;
  imageAuditStatus?: ContentSecurityImageAuditStatus;
  normalizedAt?: string;
}

export interface AdminOperationsLowCostSummary {
  source: string;
  riskLevel: LowCostModerationRiskLevel;
  riskTags: readonly LowCostModerationRiskTag[];
  hitTerms: readonly string[];
  hitFields: readonly string[];
  suggestion: string;
}

export interface AdminOperationsReviewQueueItem {
  itemId: string;
  source: AdminOperationsSource;
  type: AdminReviewItemType;
  targetId: string;
  status: AdminReviewStatus | string;
  title: string;
  summary: string;
  author?: CommunityAuthorSnapshot | DailyContentCommentAuthorSnapshot;
  createdAt: string;
  aiSummary?: AdminOperationsAiSummary;
  reviewDecision?: CommentReviewDecision;
  userRiskReasons?: readonly CommentReviewUserRiskReason[];
  manualReviewReason?: string;
  ipLocation?: CommunityIpLocationAdminSummary;
  identityCompliance?: CommunityIdentityComplianceSummary;
  mediaAssets?: CommunityPublicMediaAsset[];
  imageAuditStatus?: ContentSecurityImageAuditStatus | string;
  reportReasonCode?: CommunityReportReasonCode | string;
  reportReasonText?: string;
  reportPriority?: CommunityReportPriority | string;
  reportCount?: number;
  reportReasonDistribution?: readonly CommunityReportReasonCount[];
  reportTargetSnapshot?: CommunityReportTargetSnapshot;
  reportCaseSummary?: CommunityReportCaseSummary;
  availableActions: AdminReviewAction[];
  actionTarget: AdminOperationsActionTarget;
  related?: AdminOperationsRelatedObject;
}

export interface DailyContentCommentAuthorSnapshot {
  displayName: string;
  avatarKey: string;
  factionLabel: string;
  level: number;
  titleKey: string;
}

export interface AdminOperationsRelatedObject {
  issueId?: string;
  articleId?: string;
  postId?: string;
  commentId?: string;
  replyId?: string;
  reportId?: string;
  reportTargetKey?: string;
  reportPriority?: CommunityReportPriority | string;
  reportTargetType?: CommunityReportTargetType | string;
  reportTargetId?: string;
}

export interface AdminOperationsReviewDetail extends AdminOperationsReviewQueueItem {
  body: string;
  context: AdminOperationsReviewContext;
}

export interface AdminOperationsReviewContext {
  label: string;
  title?: string;
  summary?: string;
  body?: string;
  targetType?: string;
  targetId?: string;
}

export interface AdminOperationsWorkbenchResponse {
  counts: AdminOperationsWorkbenchCounts;
  recentTodos: AdminOperationsReviewQueueItem[];
  communityGovernanceEntry?: {
    title: string;
    description: string;
    endpoint: string;
  };
}

export interface AdminOperationsReviewQueueResponse {
  items: AdminOperationsReviewQueueItem[];
}

export interface AdminOperationsReviewDetailResponse {
  item: AdminOperationsReviewDetail;
}

export interface AdminOperationsReviewQueueQuery {
  reviewGroup?: "content" | "report" | "all";
  source?: AdminOperationsSource;
  type?: AdminReviewItemType;
  status?: string;
  aiRiskTag?: string;
  reportReasonCode?: CommunityReportReasonCode | string;
  reportTargetType?: CommunityReportTargetType | string;
  reportPriority?: CommunityReportPriority | string;
  lowCostRiskTag?: string;
  lowCostRiskLevel?: string;
  reviewDecision?: string;
  userRiskReason?: string;
  contentSecuritySource?: string;
  contentSecurityRiskTag?: string;
  manualReviewReason?: string;
  imageAuditStatus?: string;
}

export const ADMIN_OPERATIONS_SENSITIVE_FIELD_BLACKLIST = [
  "salary",
  "monthlySalary",
  "monthlyAmount",
  "workProfile",
  "workStartTime",
  "workEndTime",
  "hideMode",
  "survivalBill",
  "survivalBills",
  "accountingBill",
  "accountingBills",
  "cpsPlatform",
  "platformSource",
  "openid",
  "unionid",
  "sessionKey",
  "token",
  "authorization",
  "loginToken",
  "accessToken",
  "refreshToken",
  "phoneNumber",
  "phone",
  "phoneTail",
  "phoneLast4",
  "mobile",
  "mobilePhone",
  "rawIp",
  "ip",
  "ipAddress",
  "clientIp",
  "plainIp",
  "rawPrompt",
  "providerRawResponse",
  "rawProviderResponse",
  "access_token",
  "secret",
  "traceId",
  "providerFullResponse",
  "providerApiKey",
  "apiKey",
  "apikey",
  "proxyConfig",
  "sid",
  "sidDigest",
  "sourceRawResponse",
  "rawSummary",
  "commission",
  "commissionRate",
  "rebate",
  "rebateAmount"
] as const;

export function assertAdminOperationsNoSensitiveFields(value: unknown): void {
  assertNoSensitiveFields(value, "$");
}

function assertNoSensitiveFields(value: unknown, path: string): void {
  if (!value || typeof value !== "object") {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoSensitiveFields(item, `${path}[${index}]`));
    return;
  }

  for (const [key, nested] of Object.entries(value)) {
    if ((ADMIN_OPERATIONS_SENSITIVE_FIELD_BLACKLIST as readonly string[]).includes(key)) {
      throw new Error(`后台运营响应不得包含敏感字段 ${path}.${key}`);
    }
    assertNoSensitiveFields(nested, `${path}.${key}`);
  }
}

export function createAdminOperationsAiSummary(
  moderation?: AiContentModerationTrace
): AdminOperationsAiSummary | undefined {
  const result = moderation?.aiModerationResult;
  const lowCostResult = moderation?.lowCostModerationResult;
  const contentSecuritySummary = moderation?.contentSecuritySummary;
  const imageSummaries = moderation?.contentSecurityImageSummaries;
  if (!moderation && !result && !lowCostResult && !contentSecuritySummary && !imageSummaries) {
    return undefined;
  }

  return {
    source: contentSecuritySummary?.source ?? lowCostResult?.source ?? result?.source,
    riskTags: contentSecuritySummary?.riskTags ?? lowCostResult?.riskTags ?? result?.riskTags ?? [],
    reason: contentSecuritySummary?.reason ?? moderation?.aiModerationReason ?? result?.reason,
    confidence: result?.confidence,
    manualReviewReason:
      contentSecuritySummary?.manualReviewReason ?? moderation?.manualReviewReason,
    commentReview: moderation?.commentReviewDecision,
    contentSecurity: contentSecuritySummary
      ? toAdminOperationsContentSecuritySummary(contentSecuritySummary)
      : undefined,
    imageAudits: imageSummaries?.map(toAdminOperationsContentSecuritySummary),
    lowCost: lowCostResult
      ? {
          source: lowCostResult.source,
          riskLevel: lowCostResult.riskLevel,
          riskTags: lowCostResult.riskTags,
          hitTerms: lowCostResult.hits.map((hit) => hit.term),
          hitFields: [...new Set(lowCostResult.hits.map((hit) => hit.field))],
          suggestion: lowCostResult.suggestion
        }
      : undefined
  };
}

function toAdminOperationsContentSecuritySummary(
  summary: ContentSecurityReviewSummary
): AdminOperationsContentSecuritySummary {
  return {
    source: summary.source,
    decision: summary.decision,
    riskTags: summary.riskTags,
    reason: summary.reason,
    suggestion: summary.suggestion,
    manualReviewReason: summary.manualReviewReason,
    providerSuggest: summary.providerSuggest,
    providerLabel: summary.providerLabel,
    traceIdDigest: summary.traceIdDigest,
    imageAuditStatus: summary.imageAuditStatus,
    normalizedAt: summary.normalizedAt
  };
}
