import type { AiContentModerationTrace } from "./ai-content-moderation";
import type { ContentSecurityImageAuditStatus } from "./content-security-moderation";
import type { CommentReviewDecisionSummary } from "./low-cost-content-moderation";
import {
  USER_FACTION_LABELS,
  UserFaction,
  isUserFaction,
  resolveUserGrowthTitleLabel,
  type UserFaction as UserFactionValue
} from "./user-growth-profile";
import { isDailyContentSectionKey, type DailyContentQuoteSnapshot } from "./daily-content-feed";

export const CommunitySectionKey = {
  Recommended: "recommended",
  KeyShadow: UserFaction.KeyShadow,
  WaterEscape: UserFaction.WaterEscape,
  SkyStrategy: UserFaction.SkyStrategy,
  Wanderer: UserFaction.Wanderer,
  BossRant: "boss_rant"
} as const;

export type CommunitySectionKey = (typeof CommunitySectionKey)[keyof typeof CommunitySectionKey];

export const COMMUNITY_SECTION_LABELS: Record<CommunitySectionKey, string> = {
  [CommunitySectionKey.Recommended]: "推荐",
  [CommunitySectionKey.KeyShadow]: "键影",
  [CommunitySectionKey.WaterEscape]: "运影",
  [CommunitySectionKey.SkyStrategy]: "策影",
  [CommunitySectionKey.Wanderer]: "行影",
  [CommunitySectionKey.BossRant]: "魔王吐槽"
};

export const COMMUNITY_SECTION_KEYS: readonly CommunitySectionKey[] = [
  CommunitySectionKey.Recommended,
  CommunitySectionKey.KeyShadow,
  CommunitySectionKey.WaterEscape,
  CommunitySectionKey.SkyStrategy,
  CommunitySectionKey.Wanderer,
  CommunitySectionKey.BossRant
] as const;

export const COMMUNITY_FACTION_SECTION_KEYS: readonly UserFactionValue[] = [
  UserFaction.KeyShadow,
  UserFaction.WaterEscape,
  UserFaction.SkyStrategy,
  UserFaction.Wanderer
] as const;

export const CommunityPostStatus = {
  Pending: "pending",
  Approved: "approved",
  Rejected: "rejected",
  Hidden: "hidden",
  Removed: "removed"
} as const;

export type CommunityPostStatus = (typeof CommunityPostStatus)[keyof typeof CommunityPostStatus];

export const CommunityCommentStatus = {
  Pending: "pending",
  Approved: "approved",
  Rejected: "rejected",
  Hidden: "hidden",
  Removed: "removed"
} as const;

export type CommunityCommentStatus =
  (typeof CommunityCommentStatus)[keyof typeof CommunityCommentStatus];

export const CommunityReportTargetType = {
  Post: "post",
  Comment: "comment",
  Reply: "reply"
} as const;

export type CommunityReportTargetType =
  (typeof CommunityReportTargetType)[keyof typeof CommunityReportTargetType];

export const CommunityReportReasonCode = {
  Illegal: "illegal",
  Harassment: "harassment",
  Privacy: "privacy",
  Spam: "spam",
  Sexual: "sexual",
  Misinformation: "misinformation",
  Other: "other"
} as const;

export type CommunityReportReasonCode =
  (typeof CommunityReportReasonCode)[keyof typeof CommunityReportReasonCode];

export const COMMUNITY_REPORT_REASON_LABELS: Record<CommunityReportReasonCode, string> = {
  [CommunityReportReasonCode.Illegal]: "违法违规",
  [CommunityReportReasonCode.Harassment]: "辱骂骚扰",
  [CommunityReportReasonCode.Privacy]: "隐私泄露",
  [CommunityReportReasonCode.Spam]: "广告诈骗",
  [CommunityReportReasonCode.Sexual]: "色情低俗",
  [CommunityReportReasonCode.Misinformation]: "不实误导",
  [CommunityReportReasonCode.Other]: "其他"
};

export const COMMUNITY_REPORT_REASON_CODES: readonly CommunityReportReasonCode[] = [
  CommunityReportReasonCode.Illegal,
  CommunityReportReasonCode.Harassment,
  CommunityReportReasonCode.Privacy,
  CommunityReportReasonCode.Spam,
  CommunityReportReasonCode.Sexual,
  CommunityReportReasonCode.Misinformation,
  CommunityReportReasonCode.Other
] as const;

export const CommunityReportPriority = {
  Normal: "normal",
  High: "high"
} as const;

export type CommunityReportPriority =
  (typeof CommunityReportPriority)[keyof typeof CommunityReportPriority];

export const CommunityPostSort = {
  Latest: "latest",
  Hot: "hot"
} as const;

export type CommunityPostSort = (typeof CommunityPostSort)[keyof typeof CommunityPostSort];

export const CommunityLiteErrorCode = {
  Unauthenticated: "community_unauthenticated",
  ProfileRequired: "community_profile_required",
  InvalidInput: "community_invalid_input",
  PrivacyConsentRequired: "community_privacy_consent_required",
  PhoneVerificationRequired: "community_phone_verification_required",
  PhoneVerificationFailed: "community_phone_verification_failed",
  FactionPostRestricted: "community_faction_post_restricted",
  PostNotFound: "community_post_not_found",
  CommentNotFound: "community_comment_not_found",
  ReplyNotFound: "community_reply_not_found",
  PublicProfileNotAccessible: "community_public_profile_not_accessible",
  SelfFollowNotAllowed: "community_self_follow_not_allowed",
  MediaAssetNotFound: "community_media_asset_not_found",
  TargetNotPublic: "community_target_not_public",
  DailyContentQuoteUnavailable: "community_daily_content_quote_unavailable",
  DuplicateReport: "community_duplicate_report",
  ReportRateLimited: "community_report_rate_limited",
  SelfReportNotAllowed: "community_self_report_not_allowed",
  UserLimited: "community_user_limited",
  UserMuted: "community_user_muted",
  UserBanned: "community_user_banned"
} as const;

export type CommunityLiteErrorCode =
  (typeof CommunityLiteErrorCode)[keyof typeof CommunityLiteErrorCode];

export const CommunityPhoneVerificationStatus = {
  Unverified: "unverified",
  Verified: "verified"
} as const;

export type CommunityPhoneVerificationStatus =
  (typeof CommunityPhoneVerificationStatus)[keyof typeof CommunityPhoneVerificationStatus];

export const CommunityPublishRequirement = {
  Login: "login",
  Profile: "profile",
  PrivacyConsent: "privacy_consent",
  PhoneVerification: "phone_verification",
  Governance: "governance"
} as const;

export type CommunityPublishRequirement =
  (typeof CommunityPublishRequirement)[keyof typeof CommunityPublishRequirement];

export const CommunityPublishNextAction = {
  Login: "login",
  CreateProfile: "create_profile",
  AcceptPrivacy: "accept_privacy",
  VerifyPhone: "verify_phone",
  BlockedByGovernance: "blocked_by_governance",
  Ready: "ready"
} as const;

export type CommunityPublishNextAction =
  (typeof CommunityPublishNextAction)[keyof typeof CommunityPublishNextAction];

export const CommunityPrivacyConsentScene = {
  CommunityPublish: "community_publish",
  CommunityComment: "community_comment",
  CommunityReply: "community_reply"
} as const;

export type CommunityPrivacyConsentScene =
  (typeof CommunityPrivacyConsentScene)[keyof typeof CommunityPrivacyConsentScene];

export interface CommunityPrivacyConsentVersionSummary {
  privacyPolicyVersion: string;
  communityAgreementVersion: string;
}

export interface CommunityPublishEligibilityResponse extends CommunityPrivacyConsentVersionSummary {
  profileCreated: boolean;
  privacyConsentSatisfied: boolean;
  privacyConsentAcceptedAt?: string;
  phoneVerificationStatus: CommunityPhoneVerificationStatus;
  phoneVerified: boolean;
  canPublish: boolean;
  nextAction: CommunityPublishNextAction;
  unmetRequirements: CommunityPublishRequirement[];
  governanceStatus?: string;
  message: string;
}

export interface AcceptCommunityPrivacyConsentRequest {
  scene?: CommunityPrivacyConsentScene;
  privacyPolicyVersion?: string;
  communityAgreementVersion?: string;
}

export interface AcceptCommunityPrivacyConsentResponse {
  accepted: true;
  acceptedAt: string;
  eligibility: CommunityPublishEligibilityResponse;
}

export interface VerifyWechatPhoneNumberRequest {
  code: string;
}

export interface VerifyWechatPhoneNumberResponse {
  verified: true;
  verifiedAt: string;
  eligibility: CommunityPublishEligibilityResponse;
}

export const CommunityIpLocationResolveStatus = {
  Resolved: "resolved",
  Unknown: "unknown",
  Failed: "failed"
} as const;

export type CommunityIpLocationResolveStatus =
  (typeof CommunityIpLocationResolveStatus)[keyof typeof CommunityIpLocationResolveStatus];

export interface CommunityIpLocationPublicSummary {
  ipLocationLabel?: string;
}

export interface CommunityIpLocationAdminSummary {
  ipLocationLabel: string;
  countryOrRegion?: string;
  province?: string;
  source: string;
  status: CommunityIpLocationResolveStatus;
  resolvedAt?: string;
  failureReason?: string;
}

export interface CommunityIdentityComplianceSummary {
  phoneVerified: boolean;
  privacyPolicyVersion?: string;
  communityAgreementVersion?: string;
  privacyConsentAcceptedAt?: string;
  privacyConsentScene?: string;
  phoneVerifiedAt?: string;
  phoneVerificationSource?: string;
}

export interface CommunityAuthorSnapshot {
  displayName: string;
  avatarKey: string;
  faction: UserFactionValue;
  factionLabel: string;
  level: number;
  titleKey: string;
  equippedBadgeKey?: string;
  publicProfileId?: CommunityPublicProfileId;
}

export interface CommunityInteractionStats {
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
}

export type CommunityPublicProfileId = string;

export const CommunityFollowState = {
  Self: "self",
  Following: "following",
  NotFollowing: "not_following"
} as const;

export type CommunityFollowState = (typeof CommunityFollowState)[keyof typeof CommunityFollowState];

export interface CommunityFollowStats {
  followingCount: number;
  followerCount: number;
  publicPostCount: number;
}

export interface CommunityPublicIdentity {
  publicProfileId: CommunityPublicProfileId;
  displayName: string;
  avatarKey: string;
  faction: UserFactionValue;
  factionLabel: string;
  level: number;
  titleKey: string;
  titleLabel: string;
  equippedBadgeKey?: string;
}

export interface CommunityPublicPostListItem {
  id: string;
  title: string;
  excerpt: string;
  sectionKey: CommunitySectionKey;
  sectionLabel: string;
  mediaAssets: CommunityPublicMediaAsset[];
  imageKeys: readonly string[];
  createdAt: string;
  approvedAt: string;
  stats: CommunityInteractionStats;
}

export interface CommunityPublicProfilePage {
  publicProfileId: CommunityPublicProfileId;
  identity: CommunityPublicIdentity;
  stats: CommunityFollowStats;
  viewerFollowState: CommunityFollowState;
  ipLocationLabel?: string;
  posts: CommunityPublicPostListItem[];
  nextCursor?: string;
}

export interface CommunityPublicUserListItem extends CommunityPublicIdentity {
  viewerFollowState: CommunityFollowState;
}

export interface CommunityViewerInteraction {
  liked: boolean;
  favorited: boolean;
}

export const CommunityMediaAssetStatus = {
  Uploaded: "uploaded",
  Bound: "bound",
  Approved: "approved",
  Hidden: "hidden"
} as const;

export type CommunityMediaAssetStatus =
  (typeof CommunityMediaAssetStatus)[keyof typeof CommunityMediaAssetStatus];

export interface CommunityMediaAsset {
  id: string;
  ownerUserId?: string;
  usage: "post_image";
  url: string;
  thumbnailUrl?: string;
  status: CommunityMediaAssetStatus;
  contentSecurityStatus?: ContentSecurityImageAuditStatus;
  contentSecurityTraceIdDigest?: string;
  postId?: string;
  createdAt: string;
}

export interface CommunityPublicMediaAsset {
  id: string;
  url: string;
  thumbnailUrl?: string;
}

export interface CommunityPostSummary {
  id: string;
  title: string;
  excerpt: string;
  author: CommunityAuthorSnapshot;
  authorFaction: UserFactionValue;
  sectionKey: CommunitySectionKey;
  status: CommunityPostStatus;
  mediaAssets: CommunityPublicMediaAsset[];
  imageKeys: readonly string[];
  createdAt: string;
  approvedAt: string;
  stats: CommunityInteractionStats;
  viewerInteraction?: CommunityViewerInteraction;
  visibleToAuthorOnly?: true;
  dailyContentQuote?: DailyContentQuoteSnapshot;
}

export interface CommunityMyPostSummary extends Omit<
  CommunityPostSummary,
  "status" | "approvedAt"
> {
  status: CommunityPostStatus;
  approvedAt?: string;
  reviewNote?: string;
  moderation?: AiContentModerationTrace;
}

export interface CommunityPostDetail extends CommunityPostSummary {
  body: string;
  ipLocationLabel?: string;
  reviewNote?: string;
  moderation?: AiContentModerationTrace;
}

export interface CommunityCommentReply {
  id: string;
  postId: string;
  commentId: string;
  body: string;
  author: CommunityAuthorSnapshot;
  status: CommunityCommentStatus;
  createdAt: string;
  approvedAt?: string;
  ipLocationLabel?: string;
  visibleToAuthorOnly?: true;
}

export interface CommunityComment {
  id: string;
  postId: string;
  body: string;
  author: CommunityAuthorSnapshot;
  status: CommunityCommentStatus;
  createdAt: string;
  approvedAt?: string;
  ipLocationLabel?: string;
  visibleToAuthorOnly?: true;
  replies: CommunityCommentReply[];
}

export interface CommunityPublicUserProfile {
  userId: string;
  author: CommunityAuthorSnapshot;
  recentIpLocationLabel?: string;
}

export interface GetCommunityPublicUserProfileResponse {
  profile: CommunityPublicUserProfile;
}

export interface GetCommunityPublicProfilePageResponse {
  profile: CommunityPublicProfilePage;
}

export interface CommunityFollowActionResponse {
  publicProfileId: CommunityPublicProfileId;
  viewerFollowState: CommunityFollowState;
  stats: CommunityFollowStats;
}

export interface ListCommunityPublicUsersRequest {
  cursor?: string;
  limit?: number;
}

export interface ListCommunityPublicUsersResponse {
  publicProfileId: CommunityPublicProfileId;
  listType: "following" | "followers";
  items: CommunityPublicUserListItem[];
  nextCursor?: string;
}

export interface GetMyCommunityFollowStatsResponse {
  publicProfileId?: CommunityPublicProfileId;
  stats: CommunityFollowStats;
}

export interface ListCommunityPostsRequest {
  sectionKey?: CommunitySectionKey;
  sort?: CommunityPostSort;
  cursor?: string;
  limit?: number;
}

export interface ListCommunityPostsResponse {
  sectionKey: CommunitySectionKey;
  posts: CommunityPostSummary[];
  nextCursor?: string;
}

export interface GetCommunityPostResponse {
  post: CommunityPostDetail;
  comments: CommunityComment[];
}

export interface CreateCommunityPostRequest {
  title: string;
  body: string;
  mediaAssetIds?: readonly string[];
  imageKeys?: readonly string[];
  sectionKey: CommunitySectionKey;
  dailyContentQuote?: DailyContentQuoteSnapshot;
}

export interface CreateCommunityPostResponse {
  postId: string;
  status:
    | typeof CommunityPostStatus.Pending
    | typeof CommunityPostStatus.Approved
    | typeof CommunityPostStatus.Rejected;
  message: string;
}

export interface CreateCommunityCommentRequest {
  body: string;
}

export interface CreateCommunityCommentResponse {
  commentId: string;
  status:
    | typeof CommunityCommentStatus.Pending
    | typeof CommunityCommentStatus.Approved
    | typeof CommunityCommentStatus.Rejected;
  message: string;
  reviewDecision?: CommentReviewDecisionSummary["decision"];
}

export interface CreateCommunityReplyRequest {
  body: string;
}

export interface CreateCommunityReplyResponse {
  replyId: string;
  status:
    | typeof CommunityCommentStatus.Pending
    | typeof CommunityCommentStatus.Approved
    | typeof CommunityCommentStatus.Rejected;
  message: string;
  reviewDecision?: CommentReviewDecisionSummary["decision"];
}

export interface CommunityInteractionResponse {
  postId: string;
  viewerInteraction: CommunityViewerInteraction;
  stats: CommunityInteractionStats;
}

export interface CreateCommunityReportRequest {
  targetType: CommunityReportTargetType;
  targetId: string;
  reason?: string;
  reasonCode?: CommunityReportReasonCode;
  reasonText?: string;
}

export interface NormalizedCommunityReportRequest {
  targetType: CommunityReportTargetType;
  targetId: string;
  reason: string;
  reasonCode: CommunityReportReasonCode;
  reasonText: string;
}

export interface CreateCommunityReportResponse {
  reportId: string;
  accepted: true;
  message: string;
  status?: CommunityReportStatus;
  alreadyReported?: true;
}

export const CommunityNotificationType = {
  Like: "like",
  Favorite: "favorite",
  Comment: "comment",
  Reply: "reply",
  PostReviewApproved: "post_review_approved",
  PostReviewRejected: "post_review_rejected",
  CommentReviewApproved: "comment_review_approved",
  CommentReviewRejected: "comment_review_rejected",
  ReplyReviewApproved: "reply_review_approved",
  ReplyReviewRejected: "reply_review_rejected",
  ReportHandled: "report_handled"
} as const;

export type CommunityNotificationType =
  (typeof CommunityNotificationType)[keyof typeof CommunityNotificationType];

export interface CommunityNotification {
  id: string;
  recipientUserId?: string;
  actor?: CommunityAuthorSnapshot;
  type: CommunityNotificationType;
  targetType: "post" | "comment" | "reply" | "report";
  targetId: string;
  postId?: string;
  postTitle?: string;
  title: string;
  body: string;
  createdAt: string;
  readAt?: string;
}

export interface ListMyCommunityPostsResponse {
  posts: CommunityMyPostSummary[];
  comments?: CommunityMyCommentSummary[];
  replies?: CommunityMyReplySummary[];
  favorites?: CommunityPostSummary[];
}

export interface ListCommunityMessagesResponse {
  messages: CommunityNotification[];
  unreadCount: number;
}

export interface ListCommunityNotificationsResponse {
  notifications: CommunityNotification[];
  unreadCount: number;
}

export interface MarkCommunityNotificationReadResponse {
  accepted: true;
  unreadCount: number;
}

export interface CommunityMyCommentSummary extends Omit<CommunityComment, "status" | "approvedAt"> {
  status: CommunityCommentStatus;
  approvedAt?: string;
  reviewNote?: string;
  moderation?: AiContentModerationTrace;
}

export interface CommunityMyReplySummary extends Omit<
  CommunityCommentReply,
  "status" | "approvedAt"
> {
  status: CommunityCommentStatus;
  approvedAt?: string;
  reviewNote?: string;
  moderation?: AiContentModerationTrace;
}

export const CommunityReportStatus = {
  Pending: "pending",
  Kept: "kept",
  Hidden: "hidden",
  Removed: "removed",
  FalseReport: "false_report"
} as const;

export type CommunityReportStatus =
  (typeof CommunityReportStatus)[keyof typeof CommunityReportStatus];

export const CommunityReportHandleAction = {
  Keep: "keep",
  Hide: "hide",
  Remove: "remove",
  FalseReport: "false_report"
} as const;

export type CommunityReportHandleAction =
  (typeof CommunityReportHandleAction)[keyof typeof CommunityReportHandleAction];

export interface CommunityReportReviewItem {
  id: string;
  targetType: CommunityReportTargetType;
  targetId: string;
  reason: string;
  reasonCode: CommunityReportReasonCode;
  reasonText?: string;
  status: CommunityReportStatus;
  targetKey: string;
  priority: CommunityReportPriority;
  targetSummary?: string;
  targetSnapshot?: CommunityReportTargetSnapshot;
  reportCount?: number;
  reasonDistribution?: readonly CommunityReportReasonCount[];
  firstReportedAt?: string;
  latestReportedAt?: string;
  handledAction?: CommunityReportHandleAction;
  effectiveForAuthorRisk?: boolean;
  createdAt: string;
  handledAt?: string;
  handlerId?: string;
  handleNote?: string;
}

export interface CommunityReportTargetSnapshot {
  targetType: CommunityReportTargetType;
  targetId: string;
  postId?: string;
  commentId?: string;
  replyId?: string;
  title?: string;
  body: string;
  status: string;
  author: CommunityAuthorSnapshot;
  authorUserId?: string;
  createdAt: string;
}

export interface CommunityReportReasonCount {
  reasonCode: CommunityReportReasonCode;
  count: number;
}

export interface CommunityReportCaseSummary {
  targetKey: string;
  targetType: CommunityReportTargetType;
  targetId: string;
  status: CommunityReportStatus | string;
  priority: CommunityReportPriority;
  targetSummary: string;
  targetSnapshot?: CommunityReportTargetSnapshot;
  reportCount: number;
  pendingCount: number;
  handledCount: number;
  reasonDistribution: readonly CommunityReportReasonCount[];
  firstReportedAt: string;
  latestReportedAt: string;
}

export interface CommunityReportReviewDetail extends CommunityReportReviewItem {
  caseSummary: CommunityReportCaseSummary;
  relatedReports: CommunityReportReviewItem[];
}

export interface CommunityAdminPendingQueueResponse {
  posts: CommunityAdminPendingPost[];
  comments: CommunityAdminPendingComment[];
  replies: CommunityAdminPendingReply[];
  reports: CommunityReportReviewItem[];
}

export interface CommunityAdminPendingPost extends CommunityPostDetail {
  ipLocation?: CommunityIpLocationAdminSummary;
  identityCompliance?: CommunityIdentityComplianceSummary;
}

export interface CommunityAdminPendingComment extends CommunityMyCommentSummary {
  ipLocation?: CommunityIpLocationAdminSummary;
}

export interface CommunityAdminPendingReply extends CommunityMyReplySummary {
  ipLocation?: CommunityIpLocationAdminSummary;
}

export interface CommunityAdminActionResponse {
  accepted: true;
}

export interface UploadCommunityMediaAssetRequest {
  fileUrl?: string;
  fileName?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  thumbnailUrl?: string;
  dataUrl?: string;
  thumbnailDataUrl?: string;
}

export interface UploadCommunityMediaAssetResponse {
  asset: CommunityMediaAsset;
}

export interface CommunityValidationIssue {
  field: string;
  message: string;
}

export class CommunityLiteValidationError extends Error {
  readonly issues: CommunityValidationIssue[];

  constructor(issues: CommunityValidationIssue[]) {
    super("社区输入校验失败");
    this.name = "CommunityLiteValidationError";
    this.issues = issues;
  }
}

export const COMMUNITY_PUBLIC_RESPONSE_SENSITIVE_FIELD_BLACKLIST = [
  "phone",
  "phoneNumber",
  "phoneNumberHash",
  "phoneTail",
  "phoneLast4",
  "phoneVerified",
  "phoneVerifiedAt",
  "phoneVerificationStatus",
  "phoneVerificationSource",
  "mobile",
  "mobilePhone",
  "realName",
  "idCard",
  "rawIp",
  "ip",
  "ipAddress",
  "clientIp",
  "plainIp",
  "city",
  "district",
  "county",
  "street",
  "streetAddress",
  "ipSourceHeader",
  "ipSourceHeaders",
  "xForwardedFor",
  "forwardedFor",
  "remoteAddress",
  "ipResolverRawResponse",
  "ipLocationCountryOrRegion",
  "ipLocationProvince",
  "ipLocationSource",
  "ipLocationResolvedAt",
  "ipLocationFailureReason",
  "openid",
  "unionid",
  "sessionKey",
  "wechatIdentity",
  "wechatIdentities",
  "token",
  "authorization",
  "salary",
  "monthlyAmount",
  "workStartTime",
  "workEndTime",
  "workBreaks",
  "workdayRule",
  "workProfile",
  "hideModeEnabled",
  "hiddenCoins",
  "energy",
  "survivalBills",
  "survivalLedger",
  "accountingBills",
  "consumerStats",
  "sourceProvider",
  "sourceOrderId",
  "sid",
  "sidDigest",
  "cps",
  "commission",
  "governanceStatus",
  "communityGovernance",
  "riskFlags",
  "internalRiskTags",
  "contentSecuritySummary",
  "contentSecurityTraceIdDigest",
  "contentSecurityTraceIdMasked",
  "providerRawResponse",
  "providerFullResponse",
  "providerOriginalResponse",
  "rawModerationResponse",
  "moderation",
  "reviewNote",
  "auditStatus",
  "adminNote",
  "backendNote"
] as const;

const IMAGE_KEY_PATTERN = /^[a-z0-9][a-z0-9_-]{1,63}$/;
const MEDIA_ASSET_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{1,127}$/;
const PUBLIC_PROFILE_ID_PATTERN = /^pp_[a-zA-Z0-9_-]{16,64}$/;
const MAX_IMAGE_KEYS = 9;
export const COMMUNITY_MAX_POST_IMAGE_COUNT = 9;
const MAX_LIST_LIMIT = 50;

export function isCommunitySectionKey(value: string): value is CommunitySectionKey {
  return (COMMUNITY_SECTION_KEYS as readonly string[]).includes(value);
}

export function isCommunityFactionSectionKey(value: string): value is UserFactionValue {
  return (COMMUNITY_FACTION_SECTION_KEYS as readonly string[]).includes(value);
}

export function isCommunityPostStatus(value: string): value is CommunityPostStatus {
  return (Object.values(CommunityPostStatus) as string[]).includes(value);
}

export function isCommunityCommentStatus(value: string): value is CommunityCommentStatus {
  return (Object.values(CommunityCommentStatus) as string[]).includes(value);
}

export function isCommunityReportTargetType(value: string): value is CommunityReportTargetType {
  return (Object.values(CommunityReportTargetType) as string[]).includes(value);
}

export function isCommunityReportReasonCode(value: string): value is CommunityReportReasonCode {
  return (COMMUNITY_REPORT_REASON_CODES as readonly string[]).includes(value);
}

export function isCommunityReportPriority(value: string): value is CommunityReportPriority {
  return (Object.values(CommunityReportPriority) as string[]).includes(value);
}

export function isCommunityMediaAssetStatus(value: string): value is CommunityMediaAssetStatus {
  return (Object.values(CommunityMediaAssetStatus) as string[]).includes(value);
}

export function isCommunityNotificationType(value: string): value is CommunityNotificationType {
  return (Object.values(CommunityNotificationType) as string[]).includes(value);
}

export function isCommunityReportStatus(value: string): value is CommunityReportStatus {
  return (Object.values(CommunityReportStatus) as string[]).includes(value);
}

export function isCommunityReportHandleAction(value: string): value is CommunityReportHandleAction {
  return (Object.values(CommunityReportHandleAction) as string[]).includes(value);
}

export function getCommunityReportReasonLabel(reasonCode: CommunityReportReasonCode): string {
  return COMMUNITY_REPORT_REASON_LABELS[reasonCode];
}

export function isCommunityPostSort(value: string): value is CommunityPostSort {
  return (Object.values(CommunityPostSort) as string[]).includes(value);
}

export function isCommunityPublicProfileId(value: unknown): value is CommunityPublicProfileId {
  return typeof value === "string" && PUBLIC_PROFILE_ID_PATTERN.test(value);
}

export function isCommunityFollowState(value: string): value is CommunityFollowState {
  return (Object.values(CommunityFollowState) as string[]).includes(value);
}

export function getCommunitySectionLabel(sectionKey: CommunitySectionKey): string {
  return COMMUNITY_SECTION_LABELS[sectionKey];
}

export function canUserPostToCommunitySection(
  userFaction: UserFactionValue,
  sectionKey: CommunitySectionKey
): boolean {
  return !isCommunityFactionSectionKey(sectionKey) || sectionKey === userFaction;
}

export function createCommunityAuthorSnapshot(profile: {
  displayName: string;
  avatarKey: string;
  faction: UserFactionValue;
  level: number;
  titleKey: string;
  equippedBadgeKeys?: readonly string[];
  publicProfileId?: CommunityPublicProfileId;
}): CommunityAuthorSnapshot {
  return {
    displayName: profile.displayName,
    avatarKey: profile.avatarKey,
    faction: profile.faction,
    factionLabel: USER_FACTION_LABELS[profile.faction],
    level: profile.level,
    titleKey: profile.titleKey,
    equippedBadgeKey: profile.equippedBadgeKeys?.[0],
    publicProfileId: isCommunityPublicProfileId(profile.publicProfileId)
      ? profile.publicProfileId
      : undefined
  };
}

export function createCommunityPublicIdentity(profile: {
  publicProfileId: CommunityPublicProfileId;
  displayName: string;
  avatarKey: string;
  faction: UserFactionValue;
  level: number;
  titleKey: string;
  equippedBadgeKeys?: readonly string[];
}): CommunityPublicIdentity {
  return {
    publicProfileId: profile.publicProfileId,
    displayName: profile.displayName,
    avatarKey: profile.avatarKey,
    faction: profile.faction,
    factionLabel: USER_FACTION_LABELS[profile.faction],
    level: profile.level,
    titleKey: profile.titleKey,
    titleLabel: resolveUserGrowthTitleLabel(profile.titleKey),
    equippedBadgeKey: profile.equippedBadgeKeys?.[0]
  };
}

export function validateListCommunityPostsRequest(
  request: ListCommunityPostsRequest
): ListCommunityPostsRequest {
  const sectionKey = request.sectionKey ?? CommunitySectionKey.Recommended;
  const sort = request.sort ?? CommunityPostSort.Latest;
  const limit = request.limit ?? 20;
  const issues: CommunityValidationIssue[] = [];

  if (!isCommunitySectionKey(String(sectionKey))) {
    issues.push({ field: "sectionKey", message: "社区分区无效" });
  }

  if (!isCommunityPostSort(String(sort))) {
    issues.push({ field: "sort", message: "排序方式无效" });
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIST_LIMIT) {
    issues.push({ field: "limit", message: "列表数量需在 1-50 之间" });
  }

  throwIfIssues(issues);
  return { sectionKey, sort, cursor: request.cursor, limit };
}

export function validateListCommunityPublicUsersRequest(
  request: ListCommunityPublicUsersRequest
): ListCommunityPublicUsersRequest {
  const limit = request.limit ?? 20;
  const issues: CommunityValidationIssue[] = [];

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIST_LIMIT) {
    issues.push({ field: "limit", message: "列表数量需在 1-50 之间" });
  }

  if (
    request.cursor !== undefined &&
    (typeof request.cursor !== "string" || request.cursor.trim().length > 80)
  ) {
    issues.push({ field: "cursor", message: "分页游标无效" });
  }

  throwIfIssues(issues);
  return { cursor: request.cursor?.trim(), limit };
}

export function validateCommunityPublicProfileId(
  publicProfileId: unknown
): CommunityPublicProfileId {
  if (!isCommunityPublicProfileId(publicProfileId)) {
    throw new CommunityLiteValidationError([
      { field: "publicProfileId", message: "公开个人页标识无效" }
    ]);
  }

  return publicProfileId;
}

export function validateCreateCommunityPostRequest(
  request: CreateCommunityPostRequest
): CreateCommunityPostRequest {
  const issues: CommunityValidationIssue[] = [];
  validateTextField("title", request.title, 4, 60, issues);
  validateTextField("body", request.body, 10, 2000, issues);

  if (!isCommunitySectionKey(String(request.sectionKey))) {
    issues.push({ field: "sectionKey", message: "社区分区无效" });
  }

  validateMediaAssetIds(request.mediaAssetIds ?? [], issues);
  validateImageKeys(request.imageKeys ?? [], issues);
  if ((request.mediaAssetIds?.length ?? 0) + (request.imageKeys?.length ?? 0) > MAX_IMAGE_KEYS) {
    issues.push({ field: "mediaAssetIds", message: "最多只能上传或预留 9 张图片" });
  }
  const dailyContentQuote = validateDailyContentQuote(request.dailyContentQuote, issues);
  throwIfIssues(issues);

  return {
    title: request.title.trim(),
    body: request.body.trim(),
    mediaAssetIds: [...(request.mediaAssetIds ?? [])],
    imageKeys: [...(request.imageKeys ?? [])],
    sectionKey: request.sectionKey,
    dailyContentQuote
  };
}

export function validateCreateCommunityCommentRequest(
  request: CreateCommunityCommentRequest
): CreateCommunityCommentRequest {
  const issues: CommunityValidationIssue[] = [];
  validateTextField("body", request.body, 2, 500, issues);
  throwIfIssues(issues);
  return { body: request.body.trim() };
}

export function validateCreateCommunityReplyRequest(
  request: CreateCommunityReplyRequest
): CreateCommunityReplyRequest {
  return validateCreateCommunityCommentRequest(request);
}

export function validateCreateCommunityReportRequest(
  request: CreateCommunityReportRequest
): NormalizedCommunityReportRequest {
  const issues: CommunityValidationIssue[] = [];

  if (!isCommunityReportTargetType(String(request.targetType))) {
    issues.push({ field: "targetType", message: "举报对象类型无效" });
  }

  validateTextField("targetId", request.targetId, 1, 128, issues);
  const legacyReason = typeof request.reason === "string" ? request.reason.trim() : "";
  const rawReasonCode =
    typeof request.reasonCode === "string" && request.reasonCode
      ? request.reasonCode
      : legacyReason
        ? CommunityReportReasonCode.Other
        : "";
  const reasonCode = isCommunityReportReasonCode(rawReasonCode)
    ? rawReasonCode
    : CommunityReportReasonCode.Other;
  const reasonText =
    typeof request.reasonText === "string" ? request.reasonText.trim() : legacyReason;

  if (!rawReasonCode || !isCommunityReportReasonCode(rawReasonCode)) {
    issues.push({ field: "reasonCode", message: "举报原因无效" });
  }

  if (reasonText.length > 300) {
    issues.push({ field: "reasonText", message: "补充说明最多 300 个字符" });
  }

  if (reasonCode === CommunityReportReasonCode.Other && reasonText.length < 4) {
    issues.push({ field: "reasonText", message: "选择其他原因时需填写 4-300 个字符说明" });
  }

  throwIfIssues(issues);

  const fallbackReason = getCommunityReportReasonLabel(reasonCode);
  return {
    targetType: request.targetType as CommunityReportTargetType,
    targetId: request.targetId.trim(),
    reason: reasonText || fallbackReason,
    reasonCode,
    reasonText
  };
}

export function assertPublicCommunityAuthorSnapshot(author: Record<string, unknown>): void {
  for (const field of ["userId", ...COMMUNITY_PUBLIC_RESPONSE_SENSITIVE_FIELD_BLACKLIST] as const) {
    if (field in author) {
      throw new CommunityLiteValidationError([
        { field: "author", message: `公开作者快照不得包含 ${field}` }
      ]);
    }
  }

  if (
    typeof author.displayName !== "string" ||
    typeof author.avatarKey !== "string" ||
    !isUserFaction(String(author.faction)) ||
    typeof author.factionLabel !== "string" ||
    !Number.isInteger(author.level) ||
    typeof author.titleKey !== "string" ||
    (author.publicProfileId !== undefined && !isCommunityPublicProfileId(author.publicProfileId))
  ) {
    throw new CommunityLiteValidationError([{ field: "author", message: "公开作者快照无效" }]);
  }
}

function validateTextField(
  field: string,
  value: unknown,
  minLength: number,
  maxLength: number,
  issues: CommunityValidationIssue[]
): void {
  if (typeof value !== "string") {
    issues.push({ field, message: "必须是文本" });
    return;
  }

  const length = value.trim().length;

  if (length < minLength || length > maxLength) {
    issues.push({ field, message: `长度需在 ${minLength}-${maxLength} 个字符之间` });
  }
}

function validateImageKeys(imageKeys: readonly string[], issues: CommunityValidationIssue[]): void {
  if (!Array.isArray(imageKeys)) {
    issues.push({ field: "imageKeys", message: "图片 key 列表无效" });
    return;
  }

  if (imageKeys.length > MAX_IMAGE_KEYS) {
    issues.push({ field: "imageKeys", message: "最多只能预留 9 张图片" });
  }

  imageKeys.forEach((imageKey, index) => {
    if (typeof imageKey !== "string" || !IMAGE_KEY_PATTERN.test(imageKey)) {
      issues.push({ field: `imageKeys.${index}`, message: "图片 key 格式无效" });
    }
  });
}

function validateMediaAssetIds(
  mediaAssetIds: readonly string[],
  issues: CommunityValidationIssue[]
): void {
  if (!Array.isArray(mediaAssetIds)) {
    issues.push({ field: "mediaAssetIds", message: "图片资产 ID 列表无效" });
    return;
  }

  if (mediaAssetIds.length > COMMUNITY_MAX_POST_IMAGE_COUNT) {
    issues.push({ field: "mediaAssetIds", message: "最多只能上传 9 张图片" });
  }

  mediaAssetIds.forEach((assetId, index) => {
    if (typeof assetId !== "string" || !MEDIA_ASSET_ID_PATTERN.test(assetId)) {
      issues.push({ field: `mediaAssetIds.${index}`, message: "图片资产 ID 格式无效" });
    }
  });
}

function validateDailyContentQuote(
  quote: DailyContentQuoteSnapshot | undefined,
  issues: CommunityValidationIssue[]
): DailyContentQuoteSnapshot | undefined {
  if (quote === undefined) {
    return undefined;
  }

  if (
    typeof quote.issueId !== "string" ||
    typeof quote.itemId !== "string" ||
    (quote.sourceType !== undefined &&
      quote.sourceType !== "daily_reflection" &&
      quote.sourceType !== "daily_article" &&
      quote.sourceType !== "world_intel_article") ||
    !isDailyContentSectionKey(String(quote.sectionKey)) ||
    typeof quote.sectionLabel !== "string" ||
    typeof quote.title !== "string" ||
    typeof quote.summary !== "string"
  ) {
    issues.push({ field: "dailyContentQuote", message: "日报引用快照无效" });
    return undefined;
  }

  if (
    quote.sourceType === "daily_reflection" &&
    (quote.sectionKey !== "daily_reflection" ||
      typeof quote.businessDate !== "string" ||
      typeof quote.reflectionText !== "string")
  ) {
    issues.push({ field: "dailyContentQuote", message: "今日参悟引用快照无效" });
    return undefined;
  }

  return {
    sourceType: quote.sourceType,
    issueId: quote.issueId.trim(),
    itemId: quote.itemId.trim(),
    articleId: quote.articleId?.trim(),
    sectionKey: quote.sectionKey,
    sectionLabel: quote.sectionLabel.trim(),
    title: quote.title.trim(),
    summary: quote.summary.trim(),
    businessDate: quote.businessDate?.trim(),
    reflectionText: quote.reflectionText?.trim(),
    quotePrompt: quote.quotePrompt?.trim()
  };
}

function throwIfIssues(issues: CommunityValidationIssue[]): void {
  if (issues.length > 0) {
    throw new CommunityLiteValidationError(issues);
  }
}
