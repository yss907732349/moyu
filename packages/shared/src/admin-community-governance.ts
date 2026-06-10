import type { AiContentModerationTrace } from "./ai-content-moderation";
import type {
  CommunityAuthorSnapshot,
  CommunityCommentStatus,
  CommunityIdentityComplianceSummary,
  CommunityInteractionStats,
  CommunityIpLocationAdminSummary,
  CommunityPostStatus,
  CommunityPublicMediaAsset,
  CommunityReportCaseSummary,
  CommunityReportHandleAction,
  CommunityReportPriority,
  CommunityReportReasonCode,
  CommunityReportReasonCount,
  CommunityReportStatus,
  CommunityReportTargetSnapshot,
  CommunityReportTargetType,
  CommunitySectionKey
} from "./community-lite";
import type {
  LowCostModerationRiskLevel,
  LowCostModerationRiskTag
} from "./low-cost-content-moderation";
import type {
  ContentSecurityImageAuditStatus,
  ContentSecurityRiskTag,
  ContentSecuritySource
} from "./content-security-moderation";

export const AdminCommunityGovernanceAction = {
  ViewDetail: "view_detail",
  HidePost: "hide_post",
  RemovePost: "remove_post",
  HideComment: "hide_comment",
  RemoveComment: "remove_comment",
  HideReply: "hide_reply",
  RemoveReply: "remove_reply",
  LimitUser: "limit_user",
  MuteUser: "mute_user",
  BanUser: "ban_user",
  ClearUserRestriction: "clear_user_restriction",
  UnbanUser: "unban_user"
} as const;

export type AdminCommunityGovernanceAction =
  (typeof AdminCommunityGovernanceAction)[keyof typeof AdminCommunityGovernanceAction];

export const CommunityUserGovernanceStatus = {
  Normal: "normal",
  Limited: "limited",
  Muted: "muted",
  Banned: "banned"
} as const;

export type CommunityUserGovernanceStatus =
  (typeof CommunityUserGovernanceStatus)[keyof typeof CommunityUserGovernanceStatus];

export const AdminCommunityGovernanceTargetType = {
  Post: "post",
  Comment: "comment",
  Reply: "reply",
  User: "user"
} as const;

export type AdminCommunityGovernanceTargetType =
  (typeof AdminCommunityGovernanceTargetType)[keyof typeof AdminCommunityGovernanceTargetType];

export interface AdminCommunityGovernancePageInfo {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export interface AdminCommunityGovernanceRiskSummary {
  riskTags: readonly string[];
  lowCostRiskTags?: readonly LowCostModerationRiskTag[];
  lowCostRiskLevel?: LowCostModerationRiskLevel;
  contentSecuritySource?: ContentSecuritySource | string;
  contentSecurityRiskTags?: readonly ContentSecurityRiskTag[];
  contentSecurityDecision?: string;
  imageAuditStatus?: ContentSecurityImageAuditStatus | string;
  traceIdDigest?: string;
  hitTerms?: readonly string[];
  hitFields?: readonly string[];
  reason?: string;
  suggestion?: string;
  confidence?: number;
  manualReviewReason?: string;
}

export interface AdminCommunityPostSearchRequest {
  keyword?: string;
  status?: CommunityPostStatus | string;
  sectionKey?: CommunitySectionKey | string;
  authorUserId?: string;
  riskTag?: string;
  lowCostRiskLevel?: string;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminCommunityPostOverviewItem {
  id: string;
  title: string;
  excerpt: string;
  author: CommunityAuthorSnapshot;
  authorUserId: string;
  sectionKey: CommunitySectionKey;
  status: CommunityPostStatus | string;
  createdAt: string;
  updatedAt: string;
  riskSummary?: AdminCommunityGovernanceRiskSummary;
  ipLocation?: CommunityIpLocationAdminSummary;
  identityCompliance?: CommunityIdentityComplianceSummary;
  stats: CommunityInteractionStats;
  mediaAssets: CommunityPublicMediaAsset[];
  availableActions: AdminCommunityGovernanceAction[];
}

export interface AdminCommunityPostSearchResponse {
  items: AdminCommunityPostOverviewItem[];
  pageInfo: AdminCommunityGovernancePageInfo;
}

export interface AdminCommunityReplyGovernanceItem {
  id: string;
  postId: string;
  commentId: string;
  body: string;
  author: CommunityAuthorSnapshot;
  authorUserId: string;
  status: CommunityCommentStatus | string;
  createdAt: string;
  updatedAt: string;
  riskSummary?: AdminCommunityGovernanceRiskSummary;
  ipLocation?: CommunityIpLocationAdminSummary;
  availableActions: AdminCommunityGovernanceAction[];
}

export interface AdminCommunityCommentGovernanceItem {
  id: string;
  postId: string;
  body: string;
  author: CommunityAuthorSnapshot;
  authorUserId: string;
  status: CommunityCommentStatus | string;
  createdAt: string;
  updatedAt: string;
  riskSummary?: AdminCommunityGovernanceRiskSummary;
  ipLocation?: CommunityIpLocationAdminSummary;
  replies: AdminCommunityReplyGovernanceItem[];
  availableActions: AdminCommunityGovernanceAction[];
}

export interface AdminCommunityReportSummary {
  id: string;
  targetType: CommunityReportTargetType | string;
  targetId: string;
  reason: string;
  reasonCode: CommunityReportReasonCode | string;
  reasonText?: string;
  targetKey: string;
  priority: CommunityReportPriority | string;
  targetSummary?: string;
  targetSnapshot?: CommunityReportTargetSnapshot;
  reportCount?: number;
  reasonDistribution?: readonly CommunityReportReasonCount[];
  status: CommunityReportStatus | string;
  handledAction?: CommunityReportHandleAction | string;
  effectiveForAuthorRisk?: boolean;
  createdAt: string;
  handledAt?: string;
  handleNote?: string;
}

export interface AdminCommunityUserGovernance {
  userId: string;
  status: CommunityUserGovernanceStatus;
  phoneVerified?: boolean;
  privacyPolicyVersion?: string;
  communityAgreementVersion?: string;
  recentIpLocationLabel?: string;
  reason?: string;
  note?: string;
  startsAt?: string;
  expiresAt?: string;
  operatorId?: string;
  clearedAt?: string;
  clearedBy?: string;
  clearReason?: string;
}

export interface AdminCommunityGovernanceAudit {
  id: string;
  targetType: AdminCommunityGovernanceTargetType;
  targetId: string;
  targetAuthorUserId?: string;
  action: AdminCommunityGovernanceAction;
  oldStatus?: string;
  newStatus?: string;
  reason: string;
  note?: string;
  operatorId: string;
  createdAt: string;
}

export interface AdminCommunityPostGovernanceDetail {
  post: AdminCommunityPostOverviewItem & {
    body: string;
    reviewNote?: string;
    moderation?: AiContentModerationTrace;
  };
  comments: AdminCommunityCommentGovernanceItem[];
  reports: AdminCommunityReportSummary[];
  reportCases: CommunityReportCaseSummary[];
  authorGovernance: AdminCommunityUserGovernance;
  governanceHistory: AdminCommunityGovernanceAudit[];
}

export interface AdminCommunityGovernanceActionRequest {
  action: AdminCommunityGovernanceAction;
  reason: string;
  note?: string;
}

export interface AdminCommunityUserGovernanceRequest {
  status: Exclude<CommunityUserGovernanceStatus, typeof CommunityUserGovernanceStatus.Normal>;
  reason: string;
  note?: string;
  expiresAt?: string;
}

export interface AdminCommunityClearUserGovernanceRequest {
  reason: string;
  note?: string;
}

export interface AdminCommunityGovernanceActionResponse {
  accepted: true;
}

export const ADMIN_COMMUNITY_GOVERNANCE_FORBIDDEN_FIELDS = [
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
  "providerApiKey",
  "apiKey",
  "proxyConfig"
] as const;

export function assertAdminCommunityGovernanceNoSensitiveFields(value: unknown): void {
  assertNoForbiddenFields(value, "$");
}

function assertNoForbiddenFields(value: unknown, path: string): void {
  if (!value || typeof value !== "object") {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenFields(item, `${path}[${index}]`));
    return;
  }

  for (const [key, nested] of Object.entries(value)) {
    if ((ADMIN_COMMUNITY_GOVERNANCE_FORBIDDEN_FIELDS as readonly string[]).includes(key)) {
      throw new Error(`社区治理响应不得包含敏感字段 ${path}.${key}`);
    }
    assertNoForbiddenFields(nested, `${path}.${key}`);
  }
}

export function isCommunityUserGovernanceStatus(
  value: string
): value is CommunityUserGovernanceStatus {
  return (Object.values(CommunityUserGovernanceStatus) as string[]).includes(value);
}

export function isAdminCommunityGovernanceAction(
  value: string
): value is AdminCommunityGovernanceAction {
  return (Object.values(AdminCommunityGovernanceAction) as string[]).includes(value);
}
