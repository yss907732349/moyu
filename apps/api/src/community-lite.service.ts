import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  Optional
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { isIP } from "node:net";
import { extname, join, resolve } from "node:path";
import {
  AiModerationDecision,
  AdminCommunityGovernanceAction,
  AdminCommunityGovernanceTargetType,
  CommunityUserGovernanceStatus,
  CommentReviewDecision,
  CommentReviewUserRiskReason,
  AiModerationManualReviewReason,
  type AiContentModerationResult,
  type AiContentModerationTrace,
  ContentSecurityDecision,
  ContentSecurityImageAuditStatus,
  ContentSecurityManualReviewReason,
  ContentSecurityRiskTag,
  ContentSecuritySource,
  createContentSecuritySummary,
  digestTraceId,
  mapWechatContentSecurityResult,
  assertAdminCommunityGovernanceNoSensitiveFields,
  CommunityCommentStatus,
  CommunityIpLocationResolveStatus,
  CommunityFollowState,
  CommunityLiteErrorCode,
  CommunityMediaAssetStatus,
  CommunityNotificationType,
  CommunityPhoneVerificationStatus,
  CommunityPostSort,
  CommunityPostStatus,
  CommunityPrivacyConsentScene,
  CommunityPublishNextAction,
  CommunityPublishRequirement,
  CommunityReportHandleAction,
  CommunityReportPriority,
  CommunityReportReasonCode,
  CommunityReportStatus,
  CommunityReportTargetType,
  CommunitySectionKey,
  createCommunityPublicIdentity,
  LowCostModerationDecision,
  LowCostModerationRiskTag,
  createContentFingerprint,
  decideCommentReview,
  type LowCostContentModerationResult,
  type CommentReviewDecisionSummary,
  canUserPostToCommunitySection,
  createCommunityAuthorSnapshot,
  getCommunitySectionLabel,
  isCommunityPublicProfileId,
  isUserFaction,
  validateCommunityPublicProfileId,
  validateCreateCommunityCommentRequest,
  validateCreateCommunityPostRequest,
  validateCreateCommunityReplyRequest,
  validateCreateCommunityReportRequest,
  validateListCommunityPublicUsersRequest,
  validateListCommunityPostsRequest,
  type CommunityAuthorSnapshot,
  type CommunityAdminPendingComment,
  type CommunityAdminPendingPost,
  type CommunityAdminPendingQueueResponse,
  type CommunityComment,
  type CommunityCommentReply,
  type CommunityFollowActionResponse,
  type CommunityFollowStats,
  type CommunityIdentityComplianceSummary,
  type CommunityIpLocationAdminSummary,
  type CommunityMediaAsset,
  type CommunityMyCommentSummary,
  type CommunityInteractionResponse,
  type CommunityInteractionStats,
  type CommunityMyReplySummary,
  type CommunityNotification,
  type CommunityPublicMediaAsset,
  type CommunityPublishEligibilityResponse,
  type CommunityReportCaseSummary,
  type CommunityReportReasonCount,
  type CommunityReportReviewItem,
  type CommunityReportReviewDetail,
  type CommunityReportTargetSnapshot,
  type CommunityMyPostSummary,
  type CommunityPostDetail,
  type CommunityPublicIdentity,
  type CommunityPostSummary,
  type CommunityPublicPostListItem,
  type CommunityPublicUserListItem,
  type AcceptCommunityPrivacyConsentRequest,
  type AcceptCommunityPrivacyConsentResponse,
  type CreateCommunityCommentRequest,
  type CreateCommunityCommentResponse,
  type CreateCommunityPostRequest,
  type CreateCommunityPostResponse,
  type CreateCommunityReplyRequest,
  type CreateCommunityReplyResponse,
  type CreateCommunityReportRequest,
  type CreateCommunityReportResponse,
  type GetCommunityPostResponse,
  type GetCommunityPublicProfilePageResponse,
  type GetCommunityPublicUserProfileResponse,
  type GetMyCommunityFollowStatsResponse,
  type ListCommunityPublicUsersRequest,
  type ListCommunityPublicUsersResponse,
  type ListCommunityMessagesResponse,
  type ListMyCommunityPostsResponse,
  type ListCommunityPostsRequest,
  type ListCommunityPostsResponse,
  type MarkCommunityNotificationReadResponse,
  type NormalizedCommunityReportRequest,
  type UploadCommunityMediaAssetRequest,
  type UploadCommunityMediaAssetResponse,
  type VerifyWechatPhoneNumberRequest,
  type VerifyWechatPhoneNumberResponse,
  type AdminCommunityClearUserGovernanceRequest,
  type AdminCommunityCommentGovernanceItem,
  type AdminCommunityGovernanceActionRequest,
  type AdminCommunityGovernanceAudit,
  type AdminCommunityGovernanceRiskSummary,
  type AdminCommunityPostGovernanceDetail,
  type AdminCommunityPostOverviewItem,
  type AdminCommunityPostSearchRequest,
  type AdminCommunityPostSearchResponse,
  type AdminCommunityReplyGovernanceItem,
  type AdminCommunityReportSummary,
  type AdminCommunityUserGovernance,
  type AdminCommunityUserGovernanceRequest,
  isDailyContentSectionKey,
  type DailyContentQuoteSnapshot,
  type UserFaction,
  type UserGrowthProfileSnapshot
} from "@moyuxia/shared";
import { AiContentModerationService } from "./ai-content-moderation.service";
import { DailyContentFeedService } from "./daily-content-feed.service";
import { LowCostContentModerationService } from "./low-cost-content-moderation.service";
import { PrismaService } from "./prisma.service";
import { UserGrowthProfileService } from "./user-growth-profile.service";
import { WechatPhoneNumberClient, WechatPhoneNumberError } from "./wechat-phone-number.client";

interface CommunityPostRecord {
  id: string;
  authorUserId: string;
  sectionKey: string;
  authorFaction: string;
  title: string;
  body: string;
  imageKeys: unknown;
  authorSnapshot: unknown;
  status: string;
  approvedAt: Date | null;
  reviewNote: string | null;
  riskFlags: unknown;
  moderation: unknown;
  dailyContentQuote?: unknown;
  ipLocationLabel?: string | null;
  ipLocationCountryOrRegion?: string | null;
  ipLocationProvince?: string | null;
  ipLocationSource?: string | null;
  ipLocationStatus?: string | null;
  ipLocationResolvedAt?: Date | null;
  ipLocationFailureReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CommunityCommentRecord {
  id: string;
  postId: string;
  authorUserId: string;
  body: string;
  authorSnapshot: unknown;
  status: string;
  approvedAt: Date | null;
  reviewNote: string | null;
  riskFlags: unknown;
  moderation: unknown;
  ipLocationLabel?: string | null;
  ipLocationCountryOrRegion?: string | null;
  ipLocationProvince?: string | null;
  ipLocationSource?: string | null;
  ipLocationStatus?: string | null;
  ipLocationResolvedAt?: Date | null;
  ipLocationFailureReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CommunityReplyRecord {
  id: string;
  postId: string;
  commentId: string;
  authorUserId: string;
  body: string;
  authorSnapshot: unknown;
  status: string;
  approvedAt: Date | null;
  reviewNote: string | null;
  riskFlags: unknown;
  moderation: unknown;
  ipLocationLabel?: string | null;
  ipLocationCountryOrRegion?: string | null;
  ipLocationProvince?: string | null;
  ipLocationSource?: string | null;
  ipLocationStatus?: string | null;
  ipLocationResolvedAt?: Date | null;
  ipLocationFailureReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CommunityMediaAssetRecord {
  id: string;
  ownerUserId: string;
  usage: string;
  url: string;
  thumbnailUrl: string | null;
  status: string;
  postId: string | null;
  contentSecurityStatus?: string;
  contentSecurityTraceIdDigest?: string | null;
  contentSecurityTraceIdMasked?: string | null;
  contentSecuritySummary?: unknown;
  contentSecurityCheckedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CommunityNotificationRecord {
  id: string;
  recipientUserId: string;
  actorUserId: string | null;
  type: string;
  targetType: string;
  targetId: string;
  postId: string | null;
  commentId: string | null;
  replyId: string | null;
  title: string;
  body: string;
  actorSnapshot: unknown;
  readAt: Date | null;
  createdAt: Date;
}

interface CommunityReportRecord {
  id: string;
  reporterUserId: string;
  targetType: string;
  targetKey: string;
  postId: string | null;
  commentId: string | null;
  replyId: string | null;
  reason: string;
  reasonCode: string;
  reasonText: string | null;
  targetSnapshot: unknown;
  priority: string;
  status: string;
  handledAction: string | null;
  effectiveForAuthorRisk: boolean;
  handledBy: string | null;
  handledAt: Date | null;
  handleNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CommunityUserGovernanceRecord {
  id: string;
  userId: string;
  status: string;
  reason: string;
  note: string | null;
  startsAt: Date;
  expiresAt: Date | null;
  operatorId: string;
  clearedAt: Date | null;
  clearedBy: string | null;
  clearReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CommunityGovernanceAuditRecord {
  id: string;
  targetType: string;
  targetId: string;
  targetAuthorUserId: string | null;
  action: string;
  oldStatus: string | null;
  newStatus: string | null;
  reason: string;
  note: string | null;
  operatorId: string;
  createdAt: Date;
}

interface CommunityFollowRecord {
  id: string;
  followerUserId: string;
  followingUserId: string;
  createdAt: Date;
}

interface AppUserComplianceRecord {
  id: string;
  privacyPolicyVersion: string | null;
  communityAgreementVersion: string | null;
  privacyConsentAcceptedAt: Date | null;
  privacyConsentScene: string | null;
  phoneVerified: boolean;
  phoneVerifiedAt: Date | null;
  phoneVerificationSource: string | null;
}

interface MemoryCommunityComplianceRecord extends AppUserComplianceRecord {
  phoneNumberHash?: string | null;
}

interface CommunityWriteRequestContext {
  headers?: Record<string, string | string[] | undefined>;
  socket?: {
    remoteAddress?: string;
  };
  ip?: string;
}

interface CommunityIpLocationSnapshot {
  ipLocationLabel: string;
  ipLocationCountryOrRegion?: string;
  ipLocationProvince?: string;
  ipLocationSource: string;
  ipLocationStatus: CommunityIpLocationResolveStatus;
  ipLocationResolvedAt?: Date;
  ipLocationFailureReason?: string;
}

interface CommunityIpLocationPublicRecord {
  ipLocationLabel?: string;
  publishedAt: Date;
  hasIpLocationSnapshot: boolean;
}

type ReviewAction = "approve" | "reject" | "hide";

interface TextModerationOutcome {
  decision: AiModerationDecision;
  trace: AiContentModerationTrace;
  reason: string;
  riskTags: readonly string[];
}

interface DiscussionModerationOutcome extends TextModerationOutcome {
  status: CommunityCommentStatus;
  reviewDecision: CommentReviewDecisionSummary;
}

interface ReportableCommunityTarget {
  targetType: CommunityReportTargetType;
  targetId: string;
  targetKey: string;
  postId: string | null;
  commentId: string | null;
  replyId: string | null;
  postContextId?: string;
  commentContextId?: string;
  title?: string;
  body: string;
  status: string;
  authorUserId: string;
  author: CommunityAuthorSnapshot;
  createdAt: Date;
}

interface PagedRecords<T> {
  items: T[];
  nextCursor?: string;
}

interface CommunityReportReviewFilters {
  status?: string;
  reasonCode?: string;
  targetType?: string;
  priority?: string;
}

const COMMUNITY_MEDIA_ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif"
]);
const COMMUNITY_MEDIA_UPLOAD_EXTENSIONS = new Map([
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"]
]);
const COMMUNITY_MEDIA_MAX_FILE_BYTES = 5 * 1024 * 1024;
const COMMUNITY_MEDIA_DAILY_UPLOAD_LIMIT = 60;
const COMMUNITY_MEDIA_ORPHAN_TTL_MS = 24 * 60 * 60 * 1000;
const COMMUNITY_COMMENT_DAILY_SUBMIT_LIMIT = 80;
const COMMUNITY_COMMENT_RECENT_WINDOW_MS = 10 * 60 * 1000;
const COMMUNITY_COMMENT_RECENT_LIMIT = 12;
const COMMUNITY_COMMENT_DUPLICATE_WINDOW_MS = 10 * 60 * 1000;
const COMMUNITY_RECENT_VIOLATION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const COMMUNITY_REPORT_DAILY_LIMIT = 10;
const COMMUNITY_REPORT_RECENT_WINDOW_MS = 30 * 60 * 1000;
const COMMUNITY_REPORT_RECENT_TARGET_THRESHOLD = 3;
const COMMUNITY_REPORT_TARGET_SUMMARY_LENGTH = 80;

interface CommunityPostDelegate {
  create(input: { data: Record<string, unknown> }): Promise<CommunityPostRecord>;
  findMany(input: Record<string, unknown>): Promise<CommunityPostRecord[]>;
  findUnique(input: { where: { id: string } }): Promise<CommunityPostRecord | null>;
  update(input: {
    where: { id: string };
    data: Record<string, unknown>;
  }): Promise<CommunityPostRecord>;
  count(input: { where: Record<string, unknown> }): Promise<number>;
}

interface CommunityCommentDelegate {
  create(input: { data: Record<string, unknown> }): Promise<CommunityCommentRecord>;
  findMany(input: Record<string, unknown>): Promise<CommunityCommentRecord[]>;
  findUnique(input: { where: { id: string } }): Promise<CommunityCommentRecord | null>;
  update(input: {
    where: { id: string };
    data: Record<string, unknown>;
  }): Promise<CommunityCommentRecord>;
  count(input: { where: Record<string, unknown> }): Promise<number>;
}

interface CommunityRelationDelegate {
  findMany(input: {
    where: Record<string, unknown>;
  }): Promise<Array<{ userId: string; postId: string }>>;
  upsert(input: {
    where: { postId_userId: { postId: string; userId: string } };
    create: { postId: string; userId: string };
    update: Record<string, never>;
  }): Promise<unknown>;
  deleteMany(input: { where: { postId: string; userId: string } }): Promise<unknown>;
  findUnique(input: {
    where: { postId_userId: { postId: string; userId: string } };
  }): Promise<unknown | null>;
  count(input: { where: { postId: string } }): Promise<number>;
}

interface CommunityFollowDelegate {
  findMany(input: Record<string, unknown>): Promise<CommunityFollowRecord[]>;
  findUnique(input: {
    where: {
      followerUserId_followingUserId: {
        followerUserId: string;
        followingUserId: string;
      };
    };
  }): Promise<CommunityFollowRecord | null>;
  upsert(input: {
    where: {
      followerUserId_followingUserId: {
        followerUserId: string;
        followingUserId: string;
      };
    };
    create: { followerUserId: string; followingUserId: string };
    update: Record<string, never>;
  }): Promise<CommunityFollowRecord>;
  deleteMany(input: {
    where: { followerUserId: string; followingUserId: string };
  }): Promise<unknown>;
  count(input: { where: Record<string, unknown> }): Promise<number>;
}

interface CommunityReportDelegate {
  create(input: { data: Record<string, unknown> }): Promise<CommunityReportRecord>;
  findMany(input: Record<string, unknown>): Promise<CommunityReportRecord[]>;
  findUnique(input: { where: { id: string } }): Promise<CommunityReportRecord | null>;
  update(input: {
    where: { id: string };
    data: Record<string, unknown>;
  }): Promise<CommunityReportRecord>;
}

interface CommunityReplyDelegate {
  create(input: { data: Record<string, unknown> }): Promise<CommunityReplyRecord>;
  findMany(input: Record<string, unknown>): Promise<CommunityReplyRecord[]>;
  findUnique(input: { where: { id: string } }): Promise<CommunityReplyRecord | null>;
  update(input: {
    where: { id: string };
    data: Record<string, unknown>;
  }): Promise<CommunityReplyRecord>;
  count(input: { where: Record<string, unknown> }): Promise<number>;
}

interface CommunityMediaAssetDelegate {
  create(input: { data: Record<string, unknown> }): Promise<CommunityMediaAssetRecord>;
  findMany(input: Record<string, unknown>): Promise<CommunityMediaAssetRecord[]>;
  updateMany(input: {
    where: Record<string, unknown>;
    data: Record<string, unknown>;
  }): Promise<unknown>;
}

interface CommunityNotificationDelegate {
  create(input: { data: Record<string, unknown> }): Promise<CommunityNotificationRecord>;
  findMany(input: Record<string, unknown>): Promise<CommunityNotificationRecord[]>;
  update(input: {
    where: { id: string };
    data: Record<string, unknown>;
  }): Promise<CommunityNotificationRecord>;
  updateMany(input: {
    where: Record<string, unknown>;
    data: Record<string, unknown>;
  }): Promise<unknown>;
  count(input: { where: Record<string, unknown> }): Promise<number>;
}

interface CommunityUserGovernanceDelegate {
  findUnique(input: { where: { userId: string } }): Promise<CommunityUserGovernanceRecord | null>;
  upsert(input: {
    where: { userId: string };
    create: Record<string, unknown>;
    update: Record<string, unknown>;
  }): Promise<CommunityUserGovernanceRecord>;
}

interface CommunityGovernanceAuditDelegate {
  create(input: { data: Record<string, unknown> }): Promise<CommunityGovernanceAuditRecord>;
  findMany(input: Record<string, unknown>): Promise<CommunityGovernanceAuditRecord[]>;
}

interface AppUserComplianceDelegate {
  findUnique(input: {
    where: { id: string };
    select?: Record<string, boolean>;
  }): Promise<AppUserComplianceRecord | null>;
  upsert(input: {
    where: { id: string };
    create: Record<string, unknown>;
    update: Record<string, unknown>;
    select?: Record<string, boolean>;
  }): Promise<AppUserComplianceRecord>;
  update(input: {
    where: { id: string };
    data: Record<string, unknown>;
    select?: Record<string, boolean>;
  }): Promise<AppUserComplianceRecord>;
}

@Injectable()
export class CommunityLiteService {
  private readonly logger = new Logger(CommunityLiteService.name);
  private readonly memoryPosts = new Map<string, CommunityPostRecord>();
  private readonly memoryComments = new Map<string, CommunityCommentRecord>();
  private readonly memoryReplies = new Map<string, CommunityReplyRecord>();
  private readonly memoryMediaAssets = new Map<string, CommunityMediaAssetRecord>();
  private readonly memoryNotifications = new Map<string, CommunityNotificationRecord>();
  private readonly memoryLikes = new Set<string>();
  private readonly memoryFavorites = new Set<string>();
  private readonly memoryFollows = new Map<string, CommunityFollowRecord>();
  private readonly memoryPublicProfileIds = new Map<string, string>();
  private readonly memoryPublicProfileUsers = new Map<string, string>();
  private readonly memoryReports = new Map<string, CommunityReportRecord>();
  private readonly memoryUserGovernance = new Map<string, CommunityUserGovernanceRecord>();
  private readonly memoryGovernanceAudits = new Map<string, CommunityGovernanceAuditRecord>();
  private readonly memoryCompliance = new Map<string, MemoryCommunityComplianceRecord>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly userGrowthProfileService: UserGrowthProfileService,
    @Optional() private readonly dailyContentFeedService?: DailyContentFeedService,
    @Optional() private readonly aiContentModerationService?: AiContentModerationService,
    @Optional() private readonly lowCostContentModerationService?: LowCostContentModerationService,
    @Optional() private readonly configService?: ConfigService,
    @Optional() private readonly wechatPhoneNumberClient?: WechatPhoneNumberClient
  ) {}

  async listPosts(
    request: ListCommunityPostsRequest,
    viewerUserId?: string
  ): Promise<ListCommunityPostsResponse> {
    const normalized = validateListCommunityPostsRequest(request);
    const posts = await this.findApprovedPosts(normalized);

    return {
      sectionKey: normalized.sectionKey ?? CommunitySectionKey.Recommended,
      posts: await Promise.all(posts.map((post) => this.postToSummary(post, viewerUserId)))
    };
  }

  async getPublishEligibility(userId: string) {
    const profileResponse = await this.userGrowthProfileService.getProfile(userId);
    const compliance = await this.findComplianceRecord(userId);
    const governance = await this.getUserGovernance(userId);
    return this.createPublishEligibility({
      profileCreated: Boolean(profileResponse.profileCreated && profileResponse.profile),
      compliance,
      governance
    });
  }

  async acceptPrivacyConsent(
    userId: string,
    request: AcceptCommunityPrivacyConsentRequest
  ): Promise<AcceptCommunityPrivacyConsentResponse> {
    await this.requireProfile(userId);
    const now = new Date();
    await this.savePrivacyConsent(userId, {
      privacyPolicyVersion: this.currentPrivacyPolicyVersion(),
      communityAgreementVersion: this.currentCommunityAgreementVersion(),
      acceptedAt: now,
      scene: normalizePrivacyConsentScene(request.scene)
    });

    return {
      accepted: true,
      acceptedAt: now.toISOString(),
      eligibility: await this.getPublishEligibility(userId)
    };
  }

  async verifyWechatPhoneNumber(
    userId: string,
    request: VerifyWechatPhoneNumberRequest
  ): Promise<VerifyWechatPhoneNumberResponse> {
    await this.requireProfile(userId);
    const eligibility = await this.getPublishEligibility(userId);
    if (!eligibility.privacyConsentSatisfied) {
      throw new ForbiddenException({
        errorCode: CommunityLiteErrorCode.PrivacyConsentRequired,
        message: "请先同意当前隐私政策和社区用户协议",
        eligibility
      });
    }

    try {
      const result = this.wechatPhoneNumberClient
        ? await this.wechatPhoneNumberClient.getPhoneNumber(String(request.code ?? ""))
        : await this.createMockPhoneNumber(String(request.code ?? ""));
      const now = new Date();
      await this.savePhoneVerification(userId, {
        verifiedAt: now,
        source: this.isPhoneMockEnabled() ? "wechat_phone_mock" : "wechat_phone",
        phoneNumberHash: this.hashPhoneNumber(result.phoneNumber)
      });

      return {
        verified: true,
        verifiedAt: now.toISOString(),
        eligibility: await this.getPublishEligibility(userId)
      };
    } catch (error) {
      const message =
        error instanceof WechatPhoneNumberError ? error.message : "手机号验证失败，请稍后重试";
      throw new BadRequestException({
        errorCode: CommunityLiteErrorCode.PhoneVerificationFailed,
        message
      });
    }
  }

  async getPublicUserProfile(userId: string): Promise<GetCommunityPublicUserProfileResponse> {
    const profile = await this.requireProfile(userId);
    const recentIp = await this.findRecentPublicIpLocationForUser(userId);
    const response = {
      profile: {
        userId,
        author: createCommunityAuthorSnapshot(profile),
        recentIpLocationLabel: recentIp?.ipLocationLabel
      }
    };
    return response;
  }

  async getMyFollowStats(userId: string): Promise<GetMyCommunityFollowStatsResponse> {
    const profile = await this.requireProfile(userId);
    return {
      publicProfileId: await this.resolvePublicProfileIdForProfile(profile),
      stats: await this.getFollowStats(userId)
    };
  }

  async getPublicProfilePage(
    publicProfileId: string,
    viewerUserId: string,
    request: ListCommunityPublicUsersRequest = {}
  ): Promise<GetCommunityPublicProfilePageResponse> {
    await this.requireProfile(viewerUserId);
    const normalizedPublicProfileId = validateCommunityPublicProfileId(publicProfileId);
    const targetProfile = await this.findProfileByPublicProfileId(normalizedPublicProfileId);
    if (!targetProfile) {
      throw new NotFoundException({
        errorCode: CommunityLiteErrorCode.PublicProfileNotAccessible,
        message: "该隐者主页暂不可访问"
      });
    }

    const targetPublicProfileId = await this.resolvePublicProfileIdForProfile(targetProfile);
    const postPage = await this.findPublicPostsForAuthor(
      targetProfile.userId,
      validateListCommunityPublicUsersRequest(request)
    );

    return {
      profile: {
        publicProfileId: targetPublicProfileId,
        identity: this.profileToPublicIdentity(targetProfile, targetPublicProfileId),
        stats: await this.getFollowStats(targetProfile.userId),
        viewerFollowState: await this.resolveViewerFollowState(viewerUserId, targetProfile.userId),
        ipLocationLabel: (await this.findRecentPublicIpLocationForUser(targetProfile.userId))
          ?.ipLocationLabel,
        posts: await Promise.all(
          postPage.items.map((post) => this.postToPublicProfilePostItem(post))
        ),
        nextCursor: postPage.nextCursor
      }
    };
  }

  async followPublicProfile(
    publicProfileId: string,
    followerUserId: string
  ): Promise<CommunityFollowActionResponse> {
    await this.requireProfile(followerUserId);
    const targetProfile = await this.requireProfileByPublicProfileId(publicProfileId);
    if (targetProfile.userId === followerUserId) {
      throw new BadRequestException({
        errorCode: CommunityLiteErrorCode.SelfFollowNotAllowed,
        message: "不能关注自己"
      });
    }

    await this.upsertFollow(followerUserId, targetProfile.userId);
    return {
      publicProfileId: await this.resolvePublicProfileIdForProfile(targetProfile),
      viewerFollowState: CommunityFollowState.Following,
      stats: await this.getFollowStats(targetProfile.userId)
    };
  }

  async unfollowPublicProfile(
    publicProfileId: string,
    followerUserId: string
  ): Promise<CommunityFollowActionResponse> {
    await this.requireProfile(followerUserId);
    const targetProfile = await this.requireProfileByPublicProfileId(publicProfileId);
    if (targetProfile.userId !== followerUserId) {
      await this.deleteFollow(followerUserId, targetProfile.userId);
    }

    return {
      publicProfileId: await this.resolvePublicProfileIdForProfile(targetProfile),
      viewerFollowState:
        targetProfile.userId === followerUserId
          ? CommunityFollowState.Self
          : CommunityFollowState.NotFollowing,
      stats: await this.getFollowStats(targetProfile.userId)
    };
  }

  async listFollowing(
    publicProfileId: string,
    viewerUserId: string,
    request: ListCommunityPublicUsersRequest = {}
  ): Promise<ListCommunityPublicUsersResponse> {
    await this.requireProfile(viewerUserId);
    const targetProfile = await this.requireProfileByPublicProfileId(publicProfileId);
    const normalized = validateListCommunityPublicUsersRequest(request);
    const page = await this.findFollowPage("following", targetProfile.userId, normalized);
    return {
      publicProfileId: await this.resolvePublicProfileIdForProfile(targetProfile),
      listType: "following",
      items: await this.followRecordsToPublicUsers(page.items, "following", viewerUserId),
      nextCursor: page.nextCursor
    };
  }

  async listFollowers(
    publicProfileId: string,
    viewerUserId: string,
    request: ListCommunityPublicUsersRequest = {}
  ): Promise<ListCommunityPublicUsersResponse> {
    await this.requireProfile(viewerUserId);
    const targetProfile = await this.requireProfileByPublicProfileId(publicProfileId);
    const normalized = validateListCommunityPublicUsersRequest(request);
    const page = await this.findFollowPage("followers", targetProfile.userId, normalized);
    return {
      publicProfileId: await this.resolvePublicProfileIdForProfile(targetProfile),
      listType: "followers",
      items: await this.followRecordsToPublicUsers(page.items, "followers", viewerUserId),
      nextCursor: page.nextCursor
    };
  }

  async getPost(postId: string, viewerUserId: string): Promise<GetCommunityPostResponse> {
    await this.requireProfile(viewerUserId);
    const post = await this.findPost(postId);

    const isAuthorPendingPost =
      post?.authorUserId === viewerUserId && post.status === CommunityPostStatus.Pending;
    if (!post || (post.status !== CommunityPostStatus.Approved && !isAuthorPendingPost)) {
      throw new NotFoundException({
        errorCode: CommunityLiteErrorCode.PostNotFound,
        message: "帖子不存在或尚未公开"
      });
    }

    return {
      post: await this.postToDetail(post, viewerUserId),
      comments: await Promise.all(
        (post.status === CommunityPostStatus.Approved
          ? await this.findVisibleCommentsForViewer(postId, viewerUserId)
          : []
        ).map((comment) => this.commentToPublic(comment, viewerUserId))
      )
    };
  }

  async listMyPosts(userId: string): Promise<ListMyCommunityPostsResponse> {
    await this.requireProfile(userId);
    const posts = await this.findPostsForAuthor(userId);

    return {
      posts: await Promise.all(posts.map((post) => this.postToMySummary(post, userId))),
      comments: await Promise.all(
        (await this.findCommentsForAuthor(userId)).map((comment) =>
          this.commentToMySummary(comment)
        )
      ),
      replies: await Promise.all(
        (await this.findRepliesForAuthor(userId)).map((reply) => this.replyToMySummary(reply))
      ),
      favorites: await Promise.all(
        (await this.findFavoritePostsForUser(userId)).map((post) =>
          this.postToSummary(post, userId)
        )
      )
    };
  }

  async listMessages(userId: string): Promise<ListCommunityMessagesResponse> {
    await this.requireProfile(userId);
    const notifications = await this.findNotificationsForUser(userId);
    return {
      messages: notifications.map((notification) => this.notificationToPublic(notification)),
      unreadCount: await this.countUnreadNotifications(userId)
    };
  }

  async markNotificationRead(
    userId: string,
    notificationId: string
  ): Promise<MarkCommunityNotificationReadResponse> {
    await this.requireProfile(userId);
    const now = new Date();

    if (!this.isDatabaseConfigured()) {
      const notification = this.memoryNotifications.get(notificationId);
      if (notification && notification.recipientUserId === userId) {
        this.memoryNotifications.set(notificationId, { ...notification, readAt: now });
      }
      return { accepted: true, unreadCount: await this.countUnreadNotifications(userId) };
    }

    await this.communityNotification.updateMany({
      where: { id: notificationId, recipientUserId: userId },
      data: { readAt: now }
    });
    return { accepted: true, unreadCount: await this.countUnreadNotifications(userId) };
  }

  async markAllNotificationsRead(userId: string): Promise<MarkCommunityNotificationReadResponse> {
    await this.requireProfile(userId);
    const now = new Date();

    if (!this.isDatabaseConfigured()) {
      for (const notification of this.memoryNotifications.values()) {
        if (notification.recipientUserId === userId && !notification.readAt) {
          this.memoryNotifications.set(notification.id, { ...notification, readAt: now });
        }
      }
      return { accepted: true, unreadCount: 0 };
    }

    await this.communityNotification.updateMany({
      where: { recipientUserId: userId, readAt: null },
      data: { readAt: now }
    });
    return { accepted: true, unreadCount: 0 };
  }

  async uploadMediaAsset(
    userId: string,
    request: UploadCommunityMediaAssetRequest
  ): Promise<UploadCommunityMediaAssetResponse> {
    await this.requireProfile(userId);
    await this.assertCommunityWriteAllowed(userId);
    await this.assertMediaUploadAllowed(userId, request);
    const now = new Date();
    const id = `community-media-${this.memoryMediaAssets.size + 1}`;
    const uploadedFile = request.dataUrl
      ? await this.tryWriteCommunityMediaAsset({
          assetId: id,
          dataUrl: request.dataUrl,
          mimeType: request.mimeType,
          thumbnailDataUrl: request.thumbnailDataUrl
        })
      : null;
    const fileUrl =
      uploadedFile?.url ??
      (typeof request.fileUrl === "string" && request.fileUrl.trim()
        ? request.fileUrl.trim()
        : `${process.env.COMMUNITY_MEDIA_PUBLIC_BASE_URL ?? "https://static.moyuxia.local/community"}/${id}.jpg`);
    const record: CommunityMediaAssetRecord = {
      id,
      ownerUserId: userId,
      usage: "post_image",
      url: fileUrl,
      thumbnailUrl:
        uploadedFile?.thumbnailUrl ?? normalizeOptionalUrl(request.thumbnailUrl) ?? fileUrl,
      status: CommunityMediaAssetStatus.Uploaded,
      postId: null,
      contentSecurityStatus: ContentSecurityImageAuditStatus.NotRequired,
      contentSecurityTraceIdDigest: null,
      contentSecurityTraceIdMasked: null,
      contentSecuritySummary: null,
      contentSecurityCheckedAt: null,
      createdAt: now,
      updatedAt: now
    };

    this.memoryMediaAssets.set(id, record);

    if (!this.isDatabaseConfigured() || !this.hasCommunityMediaAssetDelegate()) {
      return { asset: this.mediaAssetToPublicOwner(record) };
    }

    try {
      const created = await this.communityMediaAsset.create({
        data: {
          id: record.id,
          ownerUserId: userId,
          usage: record.usage,
          url: record.url,
          thumbnailUrl: record.thumbnailUrl,
          status: record.status,
          contentSecurityStatus: record.contentSecurityStatus
        }
      });
      this.memoryMediaAssets.set(created.id, created);
      return { asset: this.mediaAssetToPublicOwner(created) };
    } catch (error) {
      this.logger.warn(
        `社区图片资产持久化失败，已使用开发期内存资产：${normalizeErrorMessage(error)}`
      );
      return { asset: this.mediaAssetToPublicOwner(record) };
    }
  }

  async cleanupOrphanMediaAssets(now = new Date()): Promise<{ cleanedCount: number }> {
    const cutoff = new Date(now.getTime() - COMMUNITY_MEDIA_ORPHAN_TTL_MS);
    let cleanedCount = 0;

    for (const asset of this.memoryMediaAssets.values()) {
      if (
        asset.status === CommunityMediaAssetStatus.Uploaded &&
        !asset.postId &&
        asset.createdAt.getTime() < cutoff.getTime()
      ) {
        cleanedCount += 1;
        this.memoryMediaAssets.set(asset.id, {
          ...asset,
          status: CommunityMediaAssetStatus.Hidden,
          updatedAt: now
        });
      }
    }

    if (this.isDatabaseConfigured() && this.hasCommunityMediaAssetDelegate()) {
      const assets = await this.communityMediaAsset.findMany({
        where: {
          status: CommunityMediaAssetStatus.Uploaded,
          postId: null,
          createdAt: { lt: cutoff }
        }
      });
      if (assets.length > 0) {
        await this.communityMediaAsset.updateMany({
          where: {
            status: CommunityMediaAssetStatus.Uploaded,
            postId: null,
            createdAt: { lt: cutoff }
          },
          data: { status: CommunityMediaAssetStatus.Hidden }
        });
        cleanedCount += assets.length;
      }
    }

    return { cleanedCount };
  }

  async getUploadedMediaAsset(assetId: string): Promise<{
    buffer: Buffer;
    fileName: string;
    mimeType: string;
  }> {
    const normalizedAssetId = assetId.replace(/[^a-zA-Z0-9._-]/g, "");
    const extension = extname(normalizedAssetId).toLowerCase();
    const mimeType =
      [...COMMUNITY_MEDIA_UPLOAD_EXTENSIONS.entries()].find(
        ([, value]) => value === extension
      )?.[0] ?? "application/octet-stream";

    if (!normalizedAssetId || !COMMUNITY_MEDIA_UPLOAD_EXTENSIONS.has(mimeType)) {
      throw new NotFoundException({
        errorCode: "community_media_file_not_found",
        message: "社区图片不存在"
      });
    }

    try {
      return {
        buffer: await readFile(join(getCommunityMediaUploadDir(), normalizedAssetId)),
        fileName: normalizedAssetId,
        mimeType
      };
    } catch {
      throw new NotFoundException({
        errorCode: "community_media_file_not_found",
        message: "社区图片不存在"
      });
    }
  }

  private async assertMediaUploadAllowed(
    userId: string,
    request: UploadCommunityMediaAssetRequest
  ): Promise<void> {
    if (request.mimeType && !COMMUNITY_MEDIA_ALLOWED_MIME_TYPES.has(request.mimeType)) {
      throw new BadRequestException({
        errorCode: "community_media_invalid_type",
        message: "只支持 png、jpg、webp 或 gif 图片"
      });
    }

    if (
      request.fileSizeBytes !== undefined &&
      (!Number.isInteger(request.fileSizeBytes) ||
        request.fileSizeBytes <= 0 ||
        request.fileSizeBytes > COMMUNITY_MEDIA_MAX_FILE_BYTES)
    ) {
      throw new BadRequestException({
        errorCode: "community_media_too_large",
        message: "图片不能超过 5MB"
      });
    }

    const uploadedToday = await this.countMediaUploadsToday(userId);
    if (uploadedToday >= COMMUNITY_MEDIA_DAILY_UPLOAD_LIMIT) {
      throw new HttpException(
        {
          errorCode: "community_media_daily_limit",
          message: "今日图片上传次数已达上限，请明天再试"
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
  }

  private async writeCommunityMediaAsset(input: {
    assetId: string;
    dataUrl: string;
    mimeType?: string;
    thumbnailDataUrl?: string;
  }): Promise<{ url: string; thumbnailUrl?: string }> {
    const parsed = parseCommunityImageDataUrl(input.dataUrl, input.mimeType);
    const extension = COMMUNITY_MEDIA_UPLOAD_EXTENSIONS.get(parsed.mimeType);
    if (!extension) {
      throw new BadRequestException({
        errorCode: "community_media_invalid_type",
        message: "只支持 png、jpg、webp 或 gif 图片"
      });
    }

    if (parsed.buffer.byteLength > COMMUNITY_MEDIA_MAX_FILE_BYTES) {
      throw new BadRequestException({
        errorCode: "community_media_too_large",
        message: "图片不能超过 5MB"
      });
    }

    const uploadDir = getCommunityMediaUploadDir();
    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, `${input.assetId}${extension}`), parsed.buffer);

    return {
      url: `/community/media-assets/files/${input.assetId}${extension}`,
      thumbnailUrl: await this.writeCommunityMediaThumbnail({
        assetId: input.assetId,
        uploadDir,
        thumbnailDataUrl: input.thumbnailDataUrl
      })
    };
  }

  private async tryWriteCommunityMediaAsset(input: {
    assetId: string;
    dataUrl: string;
    mimeType?: string;
    thumbnailDataUrl?: string;
  }): Promise<{ url: string; thumbnailUrl?: string } | null> {
    try {
      return await this.writeCommunityMediaAsset(input);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.warn(
        `社区图片写入本地文件失败，保留资产记录并使用客户端临时地址：${normalizeErrorMessage(error)}`
      );
      return null;
    }
  }

  private async writeCommunityMediaThumbnail(input: {
    assetId: string;
    uploadDir: string;
    thumbnailDataUrl?: string;
  }): Promise<string | undefined> {
    if (!input.thumbnailDataUrl) {
      return undefined;
    }

    const parsed = parseCommunityImageDataUrl(input.thumbnailDataUrl, "image/jpeg");
    const extension = COMMUNITY_MEDIA_UPLOAD_EXTENSIONS.get(parsed.mimeType);
    if (!extension || parsed.buffer.byteLength > COMMUNITY_MEDIA_MAX_FILE_BYTES) {
      return undefined;
    }

    const thumbnailName = `${input.assetId}-thumb${extension}`;
    await writeFile(join(input.uploadDir, thumbnailName), parsed.buffer);
    return `/community/media-assets/files/${thumbnailName}`;
  }

  private async countMediaUploadsToday(userId: string, now = new Date()): Promise<number> {
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const memoryCount = [...this.memoryMediaAssets.values()].filter(
      (asset) => asset.ownerUserId === userId && asset.createdAt >= startOfDay
    ).length;

    if (!this.isDatabaseConfigured() || !this.hasCommunityMediaAssetDelegate()) {
      return memoryCount;
    }

    const records = await this.communityMediaAsset.findMany({
      where: { ownerUserId: userId, createdAt: { gte: startOfDay } }
    });
    return Math.max(memoryCount, records.length);
  }

  private async countUserDiscussionSubmissionsSince(userId: string, since: Date): Promise<number> {
    const memoryCount =
      [...this.memoryComments.values()].filter(
        (comment) => comment.authorUserId === userId && comment.createdAt >= since
      ).length +
      [...this.memoryReplies.values()].filter(
        (reply) => reply.authorUserId === userId && reply.createdAt >= since
      ).length;

    if (!this.isDatabaseConfigured()) {
      return memoryCount;
    }

    const [commentCount, replyCount] = await Promise.all([
      this.communityComment.count({ where: { authorUserId: userId, createdAt: { gte: since } } }),
      this.communityReply.count({ where: { authorUserId: userId, createdAt: { gte: since } } })
    ]);
    return Math.max(memoryCount, commentCount + replyCount);
  }

  private async countRecentRejectedDiscussion(userId: string, since: Date): Promise<number> {
    const rejectedStatuses: CommunityCommentStatus[] = [
      CommunityCommentStatus.Rejected,
      CommunityCommentStatus.Hidden
    ];
    const isRejectedStatus = (status: CommunityCommentStatus): boolean =>
      status === CommunityCommentStatus.Rejected || status === CommunityCommentStatus.Hidden;
    const memoryCount =
      [...this.memoryComments.values()].filter(
        (comment) =>
          comment.authorUserId === userId &&
          comment.createdAt >= since &&
          isRejectedStatus(normalizeCommentStatus(comment.status))
      ).length +
      [...this.memoryReplies.values()].filter(
        (reply) =>
          reply.authorUserId === userId &&
          reply.createdAt >= since &&
          isRejectedStatus(normalizeCommentStatus(reply.status))
      ).length;

    if (!this.isDatabaseConfigured()) {
      return memoryCount;
    }

    const [commentCount, replyCount] = await Promise.all([
      this.communityComment.count({
        where: { authorUserId: userId, createdAt: { gte: since }, status: { in: rejectedStatuses } }
      }),
      this.communityReply.count({
        where: { authorUserId: userId, createdAt: { gte: since }, status: { in: rejectedStatuses } }
      })
    ]);
    return Math.max(memoryCount, commentCount + replyCount);
  }

  private async countRecentEffectiveReportsAgainstUser(
    userId: string,
    since: Date
  ): Promise<number> {
    const filterReports = async (reports: CommunityReportRecord[]): Promise<number> => {
      let count = 0;
      for (const report of reports) {
        const targetAuthorUserId =
          normalizeReportTargetSnapshot(report.targetSnapshot)?.authorUserId ??
          (await this.resolveReportRecordTarget(report))?.authorUserId;
        if (targetAuthorUserId === userId) {
          count += 1;
        }
      }
      return count;
    };

    const memoryReports = [...this.memoryReports.values()].filter(
      (report) =>
        report.effectiveForAuthorRisk &&
        (report.handledAt ?? report.updatedAt ?? report.createdAt) >= since
    );

    if (!this.isDatabaseConfigured()) {
      return filterReports(memoryReports);
    }

    const records = await this.communityReport.findMany({
      where: { effectiveForAuthorRisk: true, handledAt: { gte: since } }
    });
    return Math.max(await filterReports(memoryReports), await filterReports(records));
  }

  private async hasRecentDuplicateDiscussion(
    userId: string,
    body: string,
    since: Date
  ): Promise<boolean> {
    const fingerprint = createContentFingerprint(body);
    const recentRecords = [
      ...(await this.findCommentsForAuthor(userId)),
      ...(await this.findRepliesForAuthor(userId))
    ].filter((record) => record.createdAt >= since);

    return recentRecords.some((record) => createContentFingerprint(record.body) === fingerprint);
  }

  async createPost(
    userId: string,
    request: CreateCommunityPostRequest,
    context?: CommunityWriteRequestContext
  ): Promise<CreateCommunityPostResponse> {
    const profile = await this.requireProfile(userId);
    const governance = await this.assertCommunityPublishAllowed(userId);
    const normalized = validateCreateCommunityPostRequest(request);

    if (
      normalized.dailyContentQuote &&
      normalized.dailyContentQuote.sourceType !== "world_intel_article" &&
      this.dailyContentFeedService
    ) {
      try {
        await this.dailyContentFeedService.assertQuoteAvailable(normalized.dailyContentQuote);
      } catch {
        throw new BadRequestException({
          errorCode: CommunityLiteErrorCode.DailyContentQuoteUnavailable,
          message: "今日参悟引用不可用，请重新从隐者日报进入"
        });
      }
    }

    if (!canUserPostToCommunitySection(profile.faction, normalized.sectionKey)) {
      throw new ForbiddenException({
        errorCode: CommunityLiteErrorCode.FactionPostRestricted,
        message: "只能在自己的阵营专区发帖"
      });
    }

    if ((normalized.mediaAssetIds?.length ?? 0) === 0 && (normalized.imageKeys?.length ?? 0) > 0) {
      throw new BadRequestException({
        errorCode: "community_media_asset_required",
        message: "图片必须通过上传入口生成资产后发布"
      });
    }

    const now = new Date();
    const ipLocation = this.resolvePublishIpLocation(context);
    const id = `community-post-${this.memoryPosts.size + 1}`;
    const textModeration = await this.moderatePost(userId, normalized.title, normalized.body);
    const hasMediaAssets = (normalized.mediaAssetIds?.length ?? 0) > 0;
    const status = postTextModerationToStatus(textModeration, {
      hasPendingImages: hasMediaAssets,
      limited: governance.status === CommunityUserGovernanceStatus.Limited
    });
    const record: CommunityPostRecord = {
      id,
      authorUserId: userId,
      sectionKey: normalized.sectionKey,
      authorFaction: profile.faction,
      title: normalized.title,
      body: normalized.body,
      imageKeys: normalized.imageKeys ?? [],
      authorSnapshot: createCommunityAuthorSnapshot(profile),
      status,
      approvedAt: status === CommunityPostStatus.Approved ? now : null,
      reviewNote: null,
      riskFlags: textModeration.riskTags,
      moderation: textModeration.trace,
      dailyContentQuote: normalized.dailyContentQuote,
      ...ipLocationToRecordFields(ipLocation),
      createdAt: now,
      updatedAt: now
    };

    if (!this.isDatabaseConfigured()) {
      this.bindMemoryMediaAssets(userId, normalized.mediaAssetIds ?? [], id, status);
      this.memoryPosts.set(id, record);
      await this.resolvePostImageSecurityAfterCreate(
        userId,
        id,
        normalized.mediaAssetIds ?? [],
        textModeration
      );
      const latest = this.memoryPosts.get(id) ?? record;
      return createPostResponse(id, normalizePostStatus(latest.status), textModeration.reason);
    }

    const created = await this.communityPost.create({
      data: {
        authorUserId: userId,
        sectionKey: record.sectionKey,
        authorFaction: record.authorFaction,
        title: record.title,
        body: record.body,
        imageKeys: record.imageKeys,
        authorSnapshot: record.authorSnapshot,
        status: record.status,
        approvedAt: record.approvedAt,
        riskFlags: record.riskFlags,
        moderation: record.moderation,
        dailyContentQuote: record.dailyContentQuote,
        ...ipLocationToRecordFields(ipLocation)
      }
    });
    await this.bindMediaAssetsToPost(userId, normalized.mediaAssetIds ?? [], created.id, status);
    await this.resolvePostImageSecurityAfterCreate(
      userId,
      created.id,
      normalized.mediaAssetIds ?? [],
      textModeration
    );

    const latest = await this.findPost(created.id);
    return createPostResponse(
      created.id,
      normalizePostStatus(latest?.status ?? status),
      textModeration.reason
    );
  }

  async createComment(
    userId: string,
    postId: string,
    request: CreateCommunityCommentRequest,
    context?: CommunityWriteRequestContext
  ): Promise<CreateCommunityCommentResponse> {
    const profile = await this.requireProfile(userId);
    const governance = await this.assertCommunityPublishAllowed(userId);
    const post = await this.findPost(postId);

    if (!post || post.status !== CommunityPostStatus.Approved) {
      throw new BadRequestException({
        errorCode: CommunityLiteErrorCode.TargetNotPublic,
        message: "只能评论已公开帖子"
      });
    }

    const normalized = validateCreateCommunityCommentRequest(request);
    const now = new Date();
    const ipLocation = this.resolvePublishIpLocation(context);
    const id = `community-comment-${this.memoryComments.size + 1}`;
    await this.assertCommentSubmitAllowed(userId, normalized.body);
    const moderationOutcome = await this.moderateDiscussion(userId, normalized.body, {
      limited: governance.status === CommunityUserGovernanceStatus.Limited
    });
    const status = moderationOutcome.status;
    const moderationTrace = moderationOutcome.trace;
    const record: CommunityCommentRecord = {
      id,
      postId,
      authorUserId: userId,
      body: normalized.body,
      authorSnapshot: createCommunityAuthorSnapshot(profile),
      status,
      approvedAt: status === CommunityCommentStatus.Approved ? now : null,
      reviewNote: null,
      riskFlags: moderationOutcome.riskTags,
      moderation: moderationTrace,
      ...ipLocationToRecordFields(ipLocation),
      createdAt: now,
      updatedAt: now
    };

    if (!this.isDatabaseConfigured()) {
      this.memoryComments.set(id, record);
      await this.createCommentNotifications(post, record, moderationOutcome.reviewDecision.reason);
      return createCommentResponse(
        id,
        status,
        moderationOutcome.reviewDecision.reason,
        moderationOutcome.reviewDecision
      );
    }

    const created = await this.communityComment.create({
      data: {
        postId,
        authorUserId: userId,
        body: record.body,
        authorSnapshot: record.authorSnapshot,
        status: record.status,
        approvedAt: record.approvedAt,
        riskFlags: record.riskFlags,
        moderation: moderationTrace,
        ...ipLocationToRecordFields(ipLocation)
      }
    });
    await this.createCommentNotifications(post, created, moderationOutcome.reviewDecision.reason);

    return createCommentResponse(
      created.id,
      status,
      moderationOutcome.reviewDecision.reason,
      moderationOutcome.reviewDecision
    );
  }

  async createReply(
    userId: string,
    commentId: string,
    request: CreateCommunityReplyRequest,
    context?: CommunityWriteRequestContext
  ): Promise<CreateCommunityReplyResponse> {
    const profile = await this.requireProfile(userId);
    const governance = await this.assertCommunityPublishAllowed(userId);
    const comment = await this.findComment(commentId);

    if (!comment || comment.status !== CommunityCommentStatus.Approved) {
      throw new BadRequestException({
        errorCode: CommunityLiteErrorCode.TargetNotPublic,
        message: "只能回复已公开评论"
      });
    }

    const post = await this.findPost(comment.postId);
    if (!post || post.status !== CommunityPostStatus.Approved) {
      throw new BadRequestException({
        errorCode: CommunityLiteErrorCode.TargetNotPublic,
        message: "只能回复公开帖子下的评论"
      });
    }

    const normalized = validateCreateCommunityReplyRequest(request);
    const now = new Date();
    const ipLocation = this.resolvePublishIpLocation(context);
    const id = `community-reply-${this.memoryReplies.size + 1}`;
    await this.assertCommentSubmitAllowed(userId, normalized.body);
    const moderationOutcome = await this.moderateDiscussion(userId, normalized.body, {
      limited: governance.status === CommunityUserGovernanceStatus.Limited
    });
    const status = moderationOutcome.status;
    const moderationTrace = moderationOutcome.trace;
    const record: CommunityReplyRecord = {
      id,
      postId: comment.postId,
      commentId,
      authorUserId: userId,
      body: normalized.body,
      authorSnapshot: createCommunityAuthorSnapshot(profile),
      status,
      approvedAt: status === CommunityCommentStatus.Approved ? now : null,
      reviewNote: null,
      riskFlags: moderationOutcome.riskTags,
      moderation: moderationTrace,
      ...ipLocationToRecordFields(ipLocation),
      createdAt: now,
      updatedAt: now
    };

    if (!this.isDatabaseConfigured()) {
      this.memoryReplies.set(id, record);
      await this.createReplyNotifications(comment, record, moderationOutcome.reviewDecision.reason);
      return createReplyResponse(
        id,
        status,
        moderationOutcome.reviewDecision.reason,
        moderationOutcome.reviewDecision
      );
    }

    const created = await this.communityReply.create({
      data: {
        postId: record.postId,
        commentId,
        authorUserId: userId,
        body: record.body,
        authorSnapshot: record.authorSnapshot,
        status: record.status,
        approvedAt: record.approvedAt,
        riskFlags: record.riskFlags,
        moderation: moderationTrace,
        ...ipLocationToRecordFields(ipLocation)
      }
    });
    await this.createReplyNotifications(comment, created, moderationOutcome.reviewDecision.reason);
    return createReplyResponse(
      created.id,
      status,
      moderationOutcome.reviewDecision.reason,
      moderationOutcome.reviewDecision
    );
  }

  async setPostLike(
    userId: string,
    postId: string,
    liked: boolean
  ): Promise<CommunityInteractionResponse> {
    await this.requireApprovedPostForInteraction(userId, postId);
    await this.setPostRelation("like", userId, postId, liked);
    return this.interactionResponse(postId, userId);
  }

  async setPostFavorite(
    userId: string,
    postId: string,
    favorited: boolean
  ): Promise<CommunityInteractionResponse> {
    await this.requireApprovedPostForInteraction(userId, postId);
    await this.setPostRelation("favorite", userId, postId, favorited);
    return this.interactionResponse(postId, userId);
  }

  async createReport(
    userId: string,
    request: CreateCommunityReportRequest
  ): Promise<CreateCommunityReportResponse> {
    await this.requireProfile(userId);
    const normalized = validateCreateCommunityReportRequest(request);
    const target = await this.resolveReportableTarget(userId, normalized);

    const existing = await this.findReportByReporterAndTarget(userId, target.targetKey);
    if (existing) {
      return reportResponse(existing.id, {
        status: reportStatus(existing.status),
        alreadyReported: true
      });
    }

    await this.assertReportSubmitAllowed(userId);

    const priority = await this.resolveReportPriority(target.targetKey, normalized.reasonCode);
    const targetSnapshot = this.createReportTargetSnapshot(target);

    const reportId = `community-report-${this.memoryReports.size + 1}`;

    if (!this.isDatabaseConfigured()) {
      const now = new Date();
      this.memoryReports.set(reportId, {
        id: reportId,
        reporterUserId: userId,
        targetType: normalized.targetType,
        targetKey: target.targetKey,
        postId: target.postId,
        commentId: target.commentId,
        replyId: target.replyId,
        reason: normalized.reason,
        reasonCode: normalized.reasonCode,
        reasonText: normalized.reasonText || null,
        targetSnapshot,
        priority,
        status: CommunityReportStatus.Pending,
        handledAction: null,
        effectiveForAuthorRisk: false,
        handledBy: null,
        handledAt: null,
        handleNote: null,
        createdAt: now,
        updatedAt: now
      });
      return reportResponse(reportId);
    }

    const created = await this.communityReport.create({
      data: {
        reporterUserId: userId,
        targetType: normalized.targetType,
        targetKey: target.targetKey,
        postId: target.postId,
        commentId: target.commentId,
        replyId: target.replyId,
        reason: normalized.reason,
        reasonCode: normalized.reasonCode,
        reasonText: normalized.reasonText || null,
        targetSnapshot,
        priority,
        status: CommunityReportStatus.Pending,
        handledAction: null,
        effectiveForAuthorRisk: false
      }
    });

    return reportResponse(created.id);
  }

  private async resolveReportableTarget(
    reporterUserId: string,
    request: NormalizedCommunityReportRequest
  ): Promise<ReportableCommunityTarget> {
    if (request.targetType === CommunityReportTargetType.Post) {
      const post = await this.findPost(request.targetId);
      if (!post || post.status !== CommunityPostStatus.Approved) {
        throw new BadRequestException({
          errorCode: CommunityLiteErrorCode.TargetNotPublic,
          message: "只能举报已公开帖子"
        });
      }
      this.assertNotSelfReport(reporterUserId, post.authorUserId);
      return {
        targetType: CommunityReportTargetType.Post,
        targetId: post.id,
        targetKey: buildReportTargetKey(CommunityReportTargetType.Post, post.id),
        postId: post.id,
        commentId: null,
        replyId: null,
        postContextId: post.id,
        title: post.title,
        body: post.body,
        status: post.status,
        authorUserId: post.authorUserId,
        author: normalizeAuthorSnapshot(post.authorSnapshot),
        createdAt: post.createdAt
      };
    }

    if (request.targetType === CommunityReportTargetType.Comment) {
      const comment = await this.findComment(request.targetId);
      if (!comment || comment.status !== CommunityCommentStatus.Approved) {
        throw new BadRequestException({
          errorCode: CommunityLiteErrorCode.TargetNotPublic,
          message: "只能举报已公开评论"
        });
      }
      this.assertNotSelfReport(reporterUserId, comment.authorUserId);
      const post = await this.findPost(comment.postId);
      return {
        targetType: CommunityReportTargetType.Comment,
        targetId: comment.id,
        targetKey: buildReportTargetKey(CommunityReportTargetType.Comment, comment.id),
        postId: null,
        commentId: comment.id,
        replyId: null,
        postContextId: comment.postId,
        title: post?.title,
        body: comment.body,
        status: comment.status,
        authorUserId: comment.authorUserId,
        author: normalizeAuthorSnapshot(comment.authorSnapshot),
        createdAt: comment.createdAt
      };
    }

    const reply = await this.findReply(request.targetId);
    if (!reply || reply.status !== CommunityCommentStatus.Approved) {
      throw new BadRequestException({
        errorCode: CommunityLiteErrorCode.TargetNotPublic,
        message: "只能举报已公开回复"
      });
    }
    this.assertNotSelfReport(reporterUserId, reply.authorUserId);
    const post = await this.findPost(reply.postId);
    return {
      targetType: CommunityReportTargetType.Reply,
      targetId: reply.id,
      targetKey: buildReportTargetKey(CommunityReportTargetType.Reply, reply.id),
      postId: null,
      commentId: null,
      replyId: reply.id,
      postContextId: reply.postId,
      commentContextId: reply.commentId,
      title: post?.title,
      body: reply.body,
      status: reply.status,
      authorUserId: reply.authorUserId,
      author: normalizeAuthorSnapshot(reply.authorSnapshot),
      createdAt: reply.createdAt
    };
  }

  private assertNotSelfReport(reporterUserId: string, authorUserId: string): void {
    if (reporterUserId !== authorUserId) {
      return;
    }

    throw new BadRequestException({
      errorCode: CommunityLiteErrorCode.SelfReportNotAllowed,
      message: "不能举报自己发布的内容"
    });
  }

  private async assertReportSubmitAllowed(userId: string): Promise<void> {
    const since = startOfLocalDay(new Date());
    const reportsToday = await this.findReportsByReporterSince(userId, since);
    const falseReportsToday = reportsToday.filter(
      (report) => report.status === CommunityReportStatus.FalseReport
    );
    const limit =
      falseReportsToday.length >= 3
        ? Math.max(3, Math.floor(COMMUNITY_REPORT_DAILY_LIMIT / 2))
        : COMMUNITY_REPORT_DAILY_LIMIT;

    if (reportsToday.length >= limit) {
      throw new HttpException(
        {
          errorCode: CommunityLiteErrorCode.ReportRateLimited,
          message: "今日举报次数已达上限，请明天再试"
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
  }

  private async resolveReportPriority(
    targetKey: string,
    reasonCode: CommunityReportReasonCode
  ): Promise<CommunityReportPriority> {
    if (
      reasonCode === CommunityReportReasonCode.Illegal ||
      reasonCode === CommunityReportReasonCode.Privacy
    ) {
      return CommunityReportPriority.High;
    }

    const recentReports = (await this.findReportsByTargetKey(targetKey)).filter(
      (report) => report.createdAt >= new Date(Date.now() - COMMUNITY_REPORT_RECENT_WINDOW_MS)
    );
    const uniqueReporters = new Set(recentReports.map((report) => report.reporterUserId));
    return uniqueReporters.size + 1 >= COMMUNITY_REPORT_RECENT_TARGET_THRESHOLD
      ? CommunityReportPriority.High
      : CommunityReportPriority.Normal;
  }

  private createReportTargetSnapshot(
    target: ReportableCommunityTarget
  ): CommunityReportTargetSnapshot {
    return {
      targetType: target.targetType,
      targetId: target.targetId,
      postId: target.postContextId,
      commentId: target.commentContextId ?? target.commentId ?? undefined,
      replyId: target.replyId ?? undefined,
      title: target.title,
      body: truncateText(target.body, 500),
      status: target.status,
      author: target.author,
      authorUserId: target.authorUserId,
      createdAt: target.createdAt.toISOString()
    };
  }

  async listPendingPosts(): Promise<CommunityAdminPendingPost[]> {
    const posts = await this.findPostsByStatus(CommunityPostStatus.Pending);
    return Promise.all(
      posts.map(async (post) => ({
        ...(await this.postToDetail(post)),
        ipLocation: ipLocationToAdminSummary(post),
        identityCompliance: await this.createIdentityComplianceSummary(post.authorUserId)
      }))
    );
  }

  async listPendingComments(): Promise<CommunityAdminPendingComment[]> {
    return Promise.all(
      (await this.findCommentsByStatus(CommunityCommentStatus.Pending)).map(async (comment) => ({
        ...(await this.commentToMySummary(comment)),
        ipLocation: ipLocationToAdminSummary(comment)
      }))
    );
  }

  async listPendingQueue(): Promise<CommunityAdminPendingQueueResponse> {
    const pendingReports = await this.findPendingReports();
    return {
      posts: await this.listPendingPosts(),
      comments: await this.listPendingComments(),
      replies: await Promise.all(
        (await this.findRepliesByStatus(CommunityCommentStatus.Pending)).map(async (reply) => ({
          ...(await this.replyToMySummary(reply)),
          ipLocation: ipLocationToAdminSummary(reply)
        }))
      ),
      reports: await Promise.all(pendingReports.map((report) => this.reportToReviewItem(report)))
    };
  }

  async listReportsForReview(
    filters: CommunityReportReviewFilters = {}
  ): Promise<CommunityReportReviewItem[]> {
    const reports = await this.findReportsForReview(filters);
    return Promise.all(reports.map((report) => this.reportToReviewItem(report)));
  }

  async getReportReviewDetail(reportId: string): Promise<CommunityReportReviewDetail> {
    const report = await this.findReport(reportId);
    if (!report) {
      throw new NotFoundException({
        errorCode: "community_report_not_found",
        message: "举报不存在"
      });
    }

    const caseSummary = await this.buildReportCaseSummary(report);
    const relatedReports = await Promise.all(
      (await this.findReportsByTargetKey(report.targetKey))
        .filter((item) => item.id !== report.id)
        .map((item) => this.reportToReviewItem(item))
    );

    return {
      ...(await this.reportToReviewItem(report)),
      caseSummary,
      relatedReports
    };
  }

  async getDiscussionReviewDecisionStats(): Promise<{
    autoApproved: number;
    autoRejected: number;
    manualReview: number;
  }> {
    const comments = this.isDatabaseConfigured()
      ? await this.communityComment.findMany({ where: {} })
      : [...this.memoryComments.values()];
    const replies = this.isDatabaseConfigured()
      ? await this.communityReply.findMany({ where: {} })
      : [...this.memoryReplies.values()];
    const stats = { autoApproved: 0, autoRejected: 0, manualReview: 0 };

    for (const record of [...comments, ...replies]) {
      const decision = getCommentReviewDecisionFromModeration(record.moderation, record.status);
      if (decision === CommentReviewDecision.AutoApprove) {
        stats.autoApproved += 1;
      } else if (decision === CommentReviewDecision.AutoReject) {
        stats.autoRejected += 1;
      } else if (decision === CommentReviewDecision.ManualReview) {
        stats.manualReview += 1;
      }
    }

    return stats;
  }

  async listGovernancePosts(
    query: AdminCommunityPostSearchRequest
  ): Promise<AdminCommunityPostSearchResponse> {
    const page = normalizePositiveInteger(query.page, 1, 500, 1);
    const pageSize = normalizePositiveInteger(query.pageSize, 1, 50, 20);
    const keyword = normalizeSearchKeyword(query.keyword);
    const allPosts = await this.findGovernancePosts();
    const filtered = allPosts
      .filter((post) => !query.status || post.status === query.status)
      .filter((post) => !query.sectionKey || post.sectionKey === query.sectionKey)
      .filter((post) => !query.authorUserId || post.authorUserId === query.authorUserId)
      .filter((post) => !query.createdFrom || post.createdAt >= new Date(query.createdFrom))
      .filter((post) => !query.createdTo || post.createdAt <= new Date(query.createdTo))
      .filter((post) => matchesGovernanceKeyword(post, keyword))
      .filter((post) => matchesGovernanceRisk(post, query.riskTag, query.lowCostRiskLevel))
      .sort((first, second) => second.createdAt.getTime() - first.createdAt.getTime());
    const start = (page - 1) * pageSize;
    const response = {
      items: await Promise.all(
        filtered.slice(start, start + pageSize).map((post) => this.postToGovernanceOverview(post))
      ),
      pageInfo: {
        page,
        pageSize,
        total: filtered.length,
        hasMore: start + pageSize < filtered.length
      }
    };
    assertAdminCommunityGovernanceNoSensitiveFields(response);
    return response;
  }

  async getGovernancePostDetail(postId: string): Promise<AdminCommunityPostGovernanceDetail> {
    const post = await this.findPost(postId);
    if (!post) {
      throwPostNotFound();
    }

    const comments = await this.findAllCommentsForPost(postId);
    const reports = await this.findReportsForPost(postId);
    const reportCases = await this.buildReportCaseSummaries(reports);
    const detail = {
      post: {
        ...(await this.postToGovernanceOverview(post)),
        body: post.body,
        reviewNote: post.reviewNote ?? undefined,
        moderation: normalizeModerationTrace(post.moderation, post.reviewNote)
      },
      comments: await Promise.all(comments.map((comment) => this.commentToGovernanceItem(comment))),
      reports: reports.map((report) => this.reportToGovernanceSummary(report)),
      reportCases,
      authorGovernance: await this.getUserGovernance(post.authorUserId),
      governanceHistory: await this.findGovernanceAuditsForPost(post)
    };
    assertAdminCommunityGovernanceNoSensitiveFields(detail);
    return detail;
  }

  async governPost(
    postId: string,
    request: AdminCommunityGovernanceActionRequest,
    operatorId = "admin"
  ): Promise<void> {
    const post = await this.findPost(postId);
    if (!post) {
      throwPostNotFound();
    }
    const status = governanceActionToPostStatus(request.action);
    const updated = await this.updatePostStatus(postId, status, request.reason);
    await this.recordGovernanceAudit({
      targetType: AdminCommunityGovernanceTargetType.Post,
      targetId: postId,
      targetAuthorUserId: post.authorUserId,
      action: request.action,
      oldStatus: post.status,
      newStatus: updated.status,
      reason: request.reason,
      note: request.note,
      operatorId
    });
  }

  async governComment(
    commentId: string,
    request: AdminCommunityGovernanceActionRequest,
    operatorId = "admin"
  ): Promise<void> {
    const comment = await this.findComment(commentId);
    if (!comment) {
      throwCommentNotFound();
    }
    const status = governanceActionToCommentStatus(request.action);
    const updated = await this.updateCommentStatus(commentId, status, request.reason);
    await this.recordGovernanceAudit({
      targetType: AdminCommunityGovernanceTargetType.Comment,
      targetId: commentId,
      targetAuthorUserId: comment.authorUserId,
      action: request.action,
      oldStatus: comment.status,
      newStatus: updated.status,
      reason: request.reason,
      note: request.note,
      operatorId
    });
  }

  async governReply(
    replyId: string,
    request: AdminCommunityGovernanceActionRequest,
    operatorId = "admin"
  ): Promise<void> {
    const reply = await this.findReply(replyId);
    if (!reply) {
      throwReplyNotFound();
    }
    const status = governanceActionToCommentStatus(request.action);
    const updated = await this.updateReplyStatus(replyId, status, request.reason);
    await this.recordGovernanceAudit({
      targetType: AdminCommunityGovernanceTargetType.Reply,
      targetId: replyId,
      targetAuthorUserId: reply.authorUserId,
      action: request.action,
      oldStatus: reply.status,
      newStatus: updated.status,
      reason: request.reason,
      note: request.note,
      operatorId
    });
  }

  async getUserGovernance(userId: string): Promise<AdminCommunityUserGovernance> {
    const record = await this.findUserGovernanceRecord(userId);
    const compliance = await this.findComplianceRecord(userId);
    const recentIpLocation = await this.findRecentPublicIpLocationForUser(userId);
    const effective = {
      ...normalizeUserGovernanceRecord(userId, record),
      phoneVerified: compliance.phoneVerified,
      privacyPolicyVersion: compliance.privacyPolicyVersion ?? undefined,
      communityAgreementVersion: compliance.communityAgreementVersion ?? undefined,
      recentIpLocationLabel: recentIpLocation?.ipLocationLabel
    };
    assertAdminCommunityGovernanceNoSensitiveFields(effective);
    return effective;
  }

  async setUserGovernance(
    userId: string,
    request: AdminCommunityUserGovernanceRequest,
    operatorId = "admin"
  ): Promise<AdminCommunityUserGovernance> {
    const now = new Date();
    const oldGovernance = await this.getUserGovernance(userId);
    const expiresAt = request.expiresAt ? new Date(request.expiresAt) : null;
    const record: CommunityUserGovernanceRecord = {
      id: `community-user-governance-${this.memoryUserGovernance.size + 1}`,
      userId,
      status: request.status,
      reason: request.reason,
      note: request.note ?? null,
      startsAt: now,
      expiresAt,
      operatorId,
      clearedAt: null,
      clearedBy: null,
      clearReason: null,
      createdAt: now,
      updatedAt: now
    };

    let saved = record;
    if (!this.isDatabaseConfigured() || !this.hasCommunityUserGovernanceDelegate()) {
      this.memoryUserGovernance.set(userId, record);
    } else {
      saved = await this.communityUserGovernance.upsert({
        where: { userId },
        create: {
          userId,
          status: record.status,
          reason: record.reason,
          note: record.note,
          startsAt: record.startsAt,
          expiresAt: record.expiresAt,
          operatorId
        },
        update: {
          status: record.status,
          reason: record.reason,
          note: record.note,
          startsAt: record.startsAt,
          expiresAt: record.expiresAt,
          operatorId,
          clearedAt: null,
          clearedBy: null,
          clearReason: null
        }
      });
    }

    await this.recordGovernanceAudit({
      targetType: AdminCommunityGovernanceTargetType.User,
      targetId: userId,
      targetAuthorUserId: userId,
      action: governanceStatusToAction(request.status),
      oldStatus: oldGovernance.status,
      newStatus: saved.status,
      reason: request.reason,
      note: request.note,
      operatorId
    });
    return normalizeUserGovernanceRecord(userId, saved);
  }

  async clearUserGovernance(
    userId: string,
    request: AdminCommunityClearUserGovernanceRequest,
    operatorId = "admin"
  ): Promise<AdminCommunityUserGovernance> {
    const oldGovernance = await this.getUserGovernance(userId);
    const now = new Date();
    const record: CommunityUserGovernanceRecord = {
      id: `community-user-governance-${this.memoryUserGovernance.size + 1}`,
      userId,
      status: CommunityUserGovernanceStatus.Normal,
      reason: request.reason,
      note: request.note ?? null,
      startsAt: now,
      expiresAt: null,
      operatorId,
      clearedAt: now,
      clearedBy: operatorId,
      clearReason: request.reason,
      createdAt: now,
      updatedAt: now
    };
    let saved = record;
    if (!this.isDatabaseConfigured() || !this.hasCommunityUserGovernanceDelegate()) {
      this.memoryUserGovernance.set(userId, record);
    } else {
      saved = await this.communityUserGovernance.upsert({
        where: { userId },
        create: {
          userId,
          status: record.status,
          reason: record.reason,
          note: record.note,
          startsAt: record.startsAt,
          expiresAt: record.expiresAt,
          operatorId,
          clearedAt: record.clearedAt,
          clearedBy: record.clearedBy,
          clearReason: record.clearReason
        },
        update: {
          status: record.status,
          reason: record.reason,
          note: record.note,
          startsAt: record.startsAt,
          expiresAt: record.expiresAt,
          operatorId,
          clearedAt: record.clearedAt,
          clearedBy: record.clearedBy,
          clearReason: record.clearReason
        }
      });
    }
    await this.recordGovernanceAudit({
      targetType: AdminCommunityGovernanceTargetType.User,
      targetId: userId,
      targetAuthorUserId: userId,
      action: AdminCommunityGovernanceAction.ClearUserRestriction,
      oldStatus: oldGovernance.status,
      newStatus: CommunityUserGovernanceStatus.Normal,
      reason: request.reason,
      note: request.note,
      operatorId
    });
    return normalizeUserGovernanceRecord(userId, saved);
  }

  async reviewPost(postId: string, action: ReviewAction, reviewNote?: string): Promise<void> {
    const status = reviewActionToPostStatus(action);
    const approvedAt = status === CommunityPostStatus.Approved ? new Date() : null;

    if (!this.isDatabaseConfigured()) {
      const post = this.memoryPosts.get(postId);
      if (!post) {
        throwPostNotFound();
      }
      assertReviewActionAllowed(post.status, action);
      const updated = { ...post, status, approvedAt, reviewNote: reviewNote ?? null };
      this.memoryPosts.set(postId, updated);
      this.bindMemoryMediaAssets(post.authorUserId, [], postId, status);
      await this.createReviewNotificationForPost(updated, reviewNote);
      return;
    }

    const existing = await this.findPost(postId);
    if (!existing) {
      throwPostNotFound();
    }
    assertReviewActionAllowed(existing.status, action);
    const updated = await this.communityPost.update({
      where: { id: postId },
      data: { status, approvedAt, reviewNote: reviewNote ?? null }
    });
    await this.bindMediaAssetsToPost(updated.authorUserId, [], postId, status);
    await this.createReviewNotificationForPost(updated, reviewNote);
  }

  async reviewComment(commentId: string, action: ReviewAction, reviewNote?: string): Promise<void> {
    const status = reviewActionToCommentStatus(action);
    const approvedAt = status === CommunityCommentStatus.Approved ? new Date() : null;

    if (!this.isDatabaseConfigured()) {
      const comment = this.memoryComments.get(commentId);
      if (!comment) {
        throwCommentNotFound();
      }
      assertReviewActionAllowed(comment.status, action);
      this.memoryComments.set(commentId, {
        ...comment,
        status,
        approvedAt,
        reviewNote: reviewNote ?? null
      });
      await this.createReviewNotificationForComment(
        { ...comment, status, approvedAt, reviewNote: reviewNote ?? null },
        reviewNote
      );
      return;
    }

    const existing = await this.findComment(commentId);
    if (!existing) {
      throwCommentNotFound();
    }
    assertReviewActionAllowed(existing.status, action);
    const updated = await this.communityComment.update({
      where: { id: commentId },
      data: { status, approvedAt, reviewNote: reviewNote ?? null }
    });
    await this.createReviewNotificationForComment(updated, reviewNote);
  }

  async reviewReply(replyId: string, action: ReviewAction, reviewNote?: string): Promise<void> {
    const status = reviewActionToCommentStatus(action);
    const approvedAt = status === CommunityCommentStatus.Approved ? new Date() : null;

    if (!this.isDatabaseConfigured()) {
      const reply = this.memoryReplies.get(replyId);
      if (!reply) {
        throwReplyNotFound();
      }
      assertReviewActionAllowed(reply.status, action);
      const updated = { ...reply, status, approvedAt, reviewNote: reviewNote ?? null };
      this.memoryReplies.set(replyId, updated);
      await this.createReviewNotificationForReply(updated, reviewNote);
      return;
    }

    const existing = await this.findReply(replyId);
    if (!existing) {
      throwReplyNotFound();
    }
    assertReviewActionAllowed(existing.status, action);
    const updated = await this.communityReply.update({
      where: { id: replyId },
      data: { status, approvedAt, reviewNote: reviewNote ?? null }
    });
    await this.createReviewNotificationForReply(updated, reviewNote);
  }

  async handleReport(
    reportId: string,
    action: CommunityReportHandleAction,
    handlerId: string,
    handleNote?: string
  ): Promise<void> {
    if (!Object.values(CommunityReportHandleAction).includes(action)) {
      throw new BadRequestException({
        errorCode: "community_report_invalid_action",
        message: "不支持的举报处理操作"
      });
    }

    const report = await this.findReport(reportId);
    if (!report) {
      throw new NotFoundException({
        errorCode: "community_report_not_found",
        message: "举报不存在"
      });
    }
    if (report.status !== CommunityReportStatus.Pending) {
      throw new ConflictException({
        errorCode: "community_report_state_changed",
        message: "举报状态已变化，请刷新后再处理"
      });
    }

    const status =
      action === CommunityReportHandleAction.Hide
        ? CommunityReportStatus.Hidden
        : action === CommunityReportHandleAction.Remove
          ? CommunityReportStatus.Removed
          : action === CommunityReportHandleAction.FalseReport
            ? CommunityReportStatus.FalseReport
            : CommunityReportStatus.Kept;
    const effectiveForAuthorRisk =
      action === CommunityReportHandleAction.Hide || action === CommunityReportHandleAction.Remove;

    if (effectiveForAuthorRisk) {
      await this.applyReportedTargetAction(report, action, handlerId, handleNote);
    }

    const now = new Date();
    if (!this.isDatabaseConfigured()) {
      this.memoryReports.set(reportId, {
        ...report,
        status,
        handledAction: action,
        effectiveForAuthorRisk,
        handledBy: handlerId,
        handledAt: now,
        handleNote: handleNote ?? null,
        updatedAt: now
      });
      await this.createReportHandledNotification(
        { ...report, status, handledAction: action },
        action
      );
      return;
    }

    await this.communityReport.update({
      where: { id: reportId },
      data: {
        status,
        handledAction: action,
        effectiveForAuthorRisk,
        handledBy: handlerId,
        handledAt: now,
        handleNote: handleNote ?? null
      }
    });
    await this.createReportHandledNotification(
      { ...report, status, handledAction: action },
      action
    );
  }

  private async requireApprovedPostForInteraction(userId: string, postId: string): Promise<void> {
    await this.requireProfile(userId);
    const post = await this.findPost(postId);

    if (!post || post.status !== CommunityPostStatus.Approved) {
      throw new BadRequestException({
        errorCode: CommunityLiteErrorCode.TargetNotPublic,
        message: "只能操作已公开帖子"
      });
    }
  }

  private async requireProfile(userId: string) {
    const response = await this.userGrowthProfileService.getProfile(userId);

    if (!response.profileCreated || !response.profile) {
      throw new ForbiddenException({
        errorCode: CommunityLiteErrorCode.ProfileRequired,
        message: "请先创建隐者档案"
      });
    }

    return response.profile;
  }

  private async requireProfileByPublicProfileId(
    publicProfileId: string
  ): Promise<UserGrowthProfileSnapshot> {
    const normalizedPublicProfileId = validateCommunityPublicProfileId(publicProfileId);
    const profile = await this.findProfileByPublicProfileId(normalizedPublicProfileId);
    if (!profile) {
      throw new NotFoundException({
        errorCode: CommunityLiteErrorCode.PublicProfileNotAccessible,
        message: "该隐者主页暂不可访问"
      });
    }

    return profile;
  }

  private async findProfileByPublicProfileId(
    publicProfileId: string
  ): Promise<UserGrowthProfileSnapshot | null> {
    const mappedUserId = this.memoryPublicProfileUsers.get(publicProfileId);
    if (mappedUserId) {
      const response = await this.userGrowthProfileService.getProfile(mappedUserId);
      if (response.profile) {
        return response.profile;
      }
    }

    const service = this.userGrowthProfileService as unknown as {
      findProfileByPublicProfileId?: (id: string) => Promise<UserGrowthProfileSnapshot | null>;
    };
    const profile = service.findProfileByPublicProfileId
      ? await service.findProfileByPublicProfileId(publicProfileId)
      : null;

    if (profile) {
      this.rememberPublicProfileId(profile.userId, publicProfileId);
    }

    return profile;
  }

  private async resolvePublicProfileIdForUser(userId: string): Promise<string | undefined> {
    const known = this.memoryPublicProfileIds.get(userId);
    if (known) {
      return known;
    }

    const service = this.userGrowthProfileService as unknown as {
      getOrCreatePublicProfileId?: (id: string) => Promise<string | null>;
    };
    const publicProfileId = service.getOrCreatePublicProfileId
      ? await service.getOrCreatePublicProfileId(userId)
      : undefined;
    if (publicProfileId && isCommunityPublicProfileId(publicProfileId)) {
      this.rememberPublicProfileId(userId, publicProfileId);
      return publicProfileId;
    }

    const response = await this.userGrowthProfileService.getProfile(userId);
    return response.profile
      ? await this.resolvePublicProfileIdForProfile(response.profile)
      : undefined;
  }

  private async resolvePublicProfileIdForProfile(
    profile: UserGrowthProfileSnapshot
  ): Promise<string> {
    if (isCommunityPublicProfileId(profile.publicProfileId)) {
      this.rememberPublicProfileId(profile.userId, profile.publicProfileId);
      return profile.publicProfileId;
    }

    const existing = this.memoryPublicProfileIds.get(profile.userId);
    if (existing) {
      return existing;
    }

    const generated = this.generatePublicProfileId();
    this.rememberPublicProfileId(profile.userId, generated);
    return generated;
  }

  private rememberPublicProfileId(userId: string, publicProfileId: string): void {
    if (!isCommunityPublicProfileId(publicProfileId)) {
      return;
    }

    this.memoryPublicProfileIds.set(userId, publicProfileId);
    this.memoryPublicProfileUsers.set(publicProfileId, userId);
  }

  private generatePublicProfileId(): string {
    return `pp_${randomBytes(12).toString("base64url")}`;
  }

  private profileToPublicIdentity(
    profile: UserGrowthProfileSnapshot,
    publicProfileId: string
  ): CommunityPublicIdentity {
    return createCommunityPublicIdentity({
      publicProfileId,
      displayName: profile.displayName,
      avatarKey: profile.avatarKey,
      faction: profile.faction,
      level: profile.level,
      titleKey: profile.titleKey,
      equippedBadgeKeys: profile.equippedBadgeKeys
    });
  }

  private async normalizeAuthorSnapshotForUser(
    snapshot: unknown,
    userId: string
  ): Promise<CommunityAuthorSnapshot> {
    const author = normalizeAuthorSnapshot(snapshot);
    if (author.publicProfileId) {
      this.rememberPublicProfileId(userId, author.publicProfileId);
      return author;
    }

    const publicProfileId = await this.resolvePublicProfileIdForUser(userId);
    return publicProfileId ? { ...author, publicProfileId } : author;
  }

  private async getFollowStats(userId: string): Promise<CommunityFollowStats> {
    const memoryFollowingCount = [...this.memoryFollows.values()].filter(
      (follow) => follow.followerUserId === userId
    ).length;
    const memoryFollowerCount = [...this.memoryFollows.values()].filter(
      (follow) => follow.followingUserId === userId
    ).length;
    const publicPostCount = await this.countPublicPostsForAuthor(userId);

    if (!this.isDatabaseConfigured() || !this.hasCommunityFollowDelegate()) {
      return {
        followingCount: memoryFollowingCount,
        followerCount: memoryFollowerCount,
        publicPostCount
      };
    }

    const [followingCount, followerCount] = await Promise.all([
      this.communityFollow.count({ where: { followerUserId: userId } }),
      this.communityFollow.count({ where: { followingUserId: userId } })
    ]);

    return {
      followingCount: Math.max(memoryFollowingCount, followingCount),
      followerCount: Math.max(memoryFollowerCount, followerCount),
      publicPostCount
    };
  }

  private async countPublicPostsForAuthor(authorUserId: string): Promise<number> {
    const memoryCount = [...this.memoryPosts.values()].filter(
      (post) =>
        post.authorUserId === authorUserId &&
        normalizePostStatus(post.status) === CommunityPostStatus.Approved
    ).length;

    if (!this.isDatabaseConfigured()) {
      return memoryCount;
    }

    const persistedCount = await this.communityPost.count({
      where: { authorUserId, status: CommunityPostStatus.Approved }
    });
    return Math.max(memoryCount, persistedCount);
  }

  private async resolveViewerFollowState(
    viewerUserId: string,
    targetUserId: string
  ): Promise<CommunityFollowState> {
    if (viewerUserId === targetUserId) {
      return CommunityFollowState.Self;
    }

    return (await this.isFollowing(viewerUserId, targetUserId))
      ? CommunityFollowState.Following
      : CommunityFollowState.NotFollowing;
  }

  private async isFollowing(followerUserId: string, followingUserId: string): Promise<boolean> {
    if (this.memoryFollows.has(followKey(followerUserId, followingUserId))) {
      return true;
    }

    if (!this.isDatabaseConfigured() || !this.hasCommunityFollowDelegate()) {
      return false;
    }

    const record = await this.communityFollow.findUnique({
      where: { followerUserId_followingUserId: { followerUserId, followingUserId } }
    });
    return Boolean(record);
  }

  private async upsertFollow(followerUserId: string, followingUserId: string): Promise<void> {
    const key = followKey(followerUserId, followingUserId);
    if (!this.memoryFollows.has(key)) {
      this.memoryFollows.set(key, {
        id: `community-follow-${this.memoryFollows.size + 1}`,
        followerUserId,
        followingUserId,
        createdAt: new Date()
      });
    }

    if (!this.isDatabaseConfigured() || !this.hasCommunityFollowDelegate()) {
      return;
    }

    await this.communityFollow.upsert({
      where: { followerUserId_followingUserId: { followerUserId, followingUserId } },
      create: { followerUserId, followingUserId },
      update: {}
    });
  }

  private async deleteFollow(followerUserId: string, followingUserId: string): Promise<void> {
    this.memoryFollows.delete(followKey(followerUserId, followingUserId));

    if (!this.isDatabaseConfigured() || !this.hasCommunityFollowDelegate()) {
      return;
    }

    await this.communityFollow.deleteMany({
      where: { followerUserId, followingUserId }
    });
  }

  private async findFollowPage(
    listType: "following" | "followers",
    userId: string,
    request: ListCommunityPublicUsersRequest
  ): Promise<PagedRecords<CommunityFollowRecord>> {
    const limit = request.limit ?? 20;
    const cursorDate = parseCursorDate(request.cursor);
    const matches = (follow: CommunityFollowRecord): boolean =>
      listType === "following"
        ? follow.followerUserId === userId
        : follow.followingUserId === userId;
    const applyCursor = (follow: CommunityFollowRecord): boolean =>
      !cursorDate || follow.createdAt.getTime() < cursorDate.getTime();

    if (!this.isDatabaseConfigured() || !this.hasCommunityFollowDelegate()) {
      const records = [...this.memoryFollows.values()]
        .filter((follow) => matches(follow) && applyCursor(follow))
        .sort((first, second) => second.createdAt.getTime() - first.createdAt.getTime());
      const page = records.slice(0, limit + 1);
      return {
        items: page.slice(0, limit),
        nextCursor: page.length > limit ? page[limit - 1]?.createdAt.toISOString() : undefined
      };
    }

    const where: Record<string, unknown> =
      listType === "following" ? { followerUserId: userId } : { followingUserId: userId };
    if (cursorDate) {
      where.createdAt = { lt: cursorDate };
    }
    const page = await this.communityFollow.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      take: limit + 1
    });
    return {
      items: page.slice(0, limit),
      nextCursor: page.length > limit ? page[limit - 1]?.createdAt.toISOString() : undefined
    };
  }

  private async followRecordsToPublicUsers(
    records: readonly CommunityFollowRecord[],
    listType: "following" | "followers",
    viewerUserId: string
  ): Promise<CommunityPublicUserListItem[]> {
    const items = await Promise.all(
      records.map(async (follow) => {
        const userId = listType === "following" ? follow.followingUserId : follow.followerUserId;
        const response = await this.userGrowthProfileService.getProfile(userId);
        if (!response.profile) {
          return null;
        }
        return this.profileToPublicUserListItem(response.profile, viewerUserId);
      })
    );

    return items.filter((item): item is CommunityPublicUserListItem => Boolean(item));
  }

  private async profileToPublicUserListItem(
    profile: UserGrowthProfileSnapshot,
    viewerUserId: string
  ): Promise<CommunityPublicUserListItem> {
    const publicProfileId = await this.resolvePublicProfileIdForProfile(profile);
    return {
      ...this.profileToPublicIdentity(profile, publicProfileId),
      viewerFollowState: await this.resolveViewerFollowState(viewerUserId, profile.userId)
    };
  }

  private async findPublicPostsForAuthor(
    authorUserId: string,
    request: ListCommunityPublicUsersRequest
  ): Promise<PagedRecords<CommunityPostRecord>> {
    const limit = request.limit ?? 20;
    const cursorDate = parseCursorDate(request.cursor);

    if (!this.isDatabaseConfigured()) {
      const records = [...this.memoryPosts.values()]
        .filter(
          (post) =>
            post.authorUserId === authorUserId &&
            normalizePostStatus(post.status) === CommunityPostStatus.Approved &&
            (!cursorDate || post.createdAt.getTime() < cursorDate.getTime())
        )
        .sort((first, second) => second.createdAt.getTime() - first.createdAt.getTime());
      const page = records.slice(0, limit + 1);
      return {
        items: page.slice(0, limit),
        nextCursor: page.length > limit ? page[limit - 1]?.createdAt.toISOString() : undefined
      };
    }

    const where: Record<string, unknown> = {
      authorUserId,
      status: CommunityPostStatus.Approved
    };
    if (cursorDate) {
      where.createdAt = { lt: cursorDate };
    }
    const page = await this.communityPost.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      take: limit + 1
    });
    return {
      items: page.slice(0, limit),
      nextCursor: page.length > limit ? page[limit - 1]?.createdAt.toISOString() : undefined
    };
  }

  private async postToPublicProfilePostItem(
    post: CommunityPostRecord
  ): Promise<CommunityPublicPostListItem> {
    const sectionKey = normalizeSectionKey(post.sectionKey);
    return {
      id: post.id,
      title: post.title,
      excerpt: createExcerpt(post.body),
      sectionKey,
      sectionLabel: getCommunitySectionLabel(sectionKey),
      mediaAssets: (await this.findMediaAssetsForPost(post.id)).map((asset) =>
        this.mediaAssetToPublic(asset)
      ),
      imageKeys: normalizeStringArray(post.imageKeys),
      createdAt: post.createdAt.toISOString(),
      approvedAt: (post.approvedAt ?? post.createdAt).toISOString(),
      stats: await this.getStats(post.id)
    };
  }

  private currentPrivacyPolicyVersion(): string {
    return (
      this.getConfigValue("COMMUNITY_PRIVACY_POLICY_VERSION") ||
      this.getConfigValue("PRIVACY_POLICY_VERSION") ||
      "2026-06-08"
    );
  }

  private currentCommunityAgreementVersion(): string {
    return (
      this.getConfigValue("COMMUNITY_AGREEMENT_VERSION") ||
      this.getConfigValue("COMMUNITY_USER_AGREEMENT_VERSION") ||
      "2026-06-08"
    );
  }

  private isCommunityIdentityGateEnforced(): boolean {
    const configured = this.getConfigValue("COMMUNITY_IDENTITY_GATE_ENABLED");
    if (configured !== undefined) {
      return configured !== "false";
    }

    return Boolean(this.configService);
  }

  private async findComplianceRecord(userId: string): Promise<AppUserComplianceRecord> {
    if (!this.isDatabaseConfigured() || !this.hasAppUserComplianceDelegate()) {
      return this.memoryCompliance.get(userId) ?? createEmptyComplianceRecord(userId);
    }

    const record = await this.appUser.findUnique({
      where: { id: userId },
      select: createAppUserComplianceSelect()
    });

    return record ?? createEmptyComplianceRecord(userId);
  }

  private async savePrivacyConsent(
    userId: string,
    input: {
      privacyPolicyVersion: string;
      communityAgreementVersion: string;
      acceptedAt: Date;
      scene: CommunityPrivacyConsentScene;
    }
  ): Promise<void> {
    const existing = await this.findComplianceRecord(userId);
    const next: MemoryCommunityComplianceRecord = {
      ...existing,
      privacyPolicyVersion: input.privacyPolicyVersion,
      communityAgreementVersion: input.communityAgreementVersion,
      privacyConsentAcceptedAt: input.acceptedAt,
      privacyConsentScene: input.scene
    };
    this.memoryCompliance.set(userId, next);

    if (!this.isDatabaseConfigured() || !this.hasAppUserComplianceDelegate()) {
      return;
    }

    await this.appUser.upsert({
      where: { id: userId },
      create: {
        id: userId,
        privacyPolicyVersion: next.privacyPolicyVersion,
        communityAgreementVersion: next.communityAgreementVersion,
        privacyConsentAcceptedAt: next.privacyConsentAcceptedAt,
        privacyConsentScene: next.privacyConsentScene
      },
      update: {
        privacyPolicyVersion: next.privacyPolicyVersion,
        communityAgreementVersion: next.communityAgreementVersion,
        privacyConsentAcceptedAt: next.privacyConsentAcceptedAt,
        privacyConsentScene: next.privacyConsentScene
      },
      select: createAppUserComplianceSelect()
    });
  }

  private async savePhoneVerification(
    userId: string,
    input: {
      verifiedAt: Date;
      source: string;
      phoneNumberHash: string;
    }
  ): Promise<void> {
    const existing = await this.findComplianceRecord(userId);
    const next: MemoryCommunityComplianceRecord = {
      ...existing,
      phoneVerified: true,
      phoneVerifiedAt: input.verifiedAt,
      phoneVerificationSource: input.source,
      phoneNumberHash: input.phoneNumberHash
    };
    this.memoryCompliance.set(userId, next);

    if (!this.isDatabaseConfigured() || !this.hasAppUserComplianceDelegate()) {
      return;
    }

    await this.appUser.upsert({
      where: { id: userId },
      create: {
        id: userId,
        phoneVerified: true,
        phoneVerifiedAt: input.verifiedAt,
        phoneVerificationSource: input.source,
        phoneNumberHash: input.phoneNumberHash
      },
      update: {
        phoneVerified: true,
        phoneVerifiedAt: input.verifiedAt,
        phoneVerificationSource: input.source,
        phoneNumberHash: input.phoneNumberHash
      },
      select: createAppUserComplianceSelect()
    });
  }

  private createPublishEligibility(input: {
    profileCreated: boolean;
    compliance: AppUserComplianceRecord;
    governance: AdminCommunityUserGovernance;
  }): CommunityPublishEligibilityResponse {
    const privacyPolicyVersion = this.currentPrivacyPolicyVersion();
    const communityAgreementVersion = this.currentCommunityAgreementVersion();
    const privacyConsentSatisfied =
      Boolean(input.compliance.privacyConsentAcceptedAt) &&
      input.compliance.privacyPolicyVersion === privacyPolicyVersion &&
      input.compliance.communityAgreementVersion === communityAgreementVersion;
    const phoneVerified = Boolean(input.compliance.phoneVerified);
    const governanceBlocked =
      input.governance.status === CommunityUserGovernanceStatus.Muted ||
      input.governance.status === CommunityUserGovernanceStatus.Banned;
    const enforceIdentityGate = this.isCommunityIdentityGateEnforced();
    const unmetRequirements: CommunityPublishRequirement[] = [];

    if (!input.profileCreated) {
      unmetRequirements.push(CommunityPublishRequirement.Profile);
    }
    if (enforceIdentityGate && !privacyConsentSatisfied) {
      unmetRequirements.push(CommunityPublishRequirement.PrivacyConsent);
    }
    if (enforceIdentityGate && privacyConsentSatisfied && !phoneVerified) {
      unmetRequirements.push(CommunityPublishRequirement.PhoneVerification);
    }
    if (governanceBlocked) {
      unmetRequirements.push(CommunityPublishRequirement.Governance);
    }

    const nextAction = !input.profileCreated
      ? CommunityPublishNextAction.CreateProfile
      : governanceBlocked
        ? CommunityPublishNextAction.BlockedByGovernance
        : enforceIdentityGate && !privacyConsentSatisfied
          ? CommunityPublishNextAction.AcceptPrivacy
          : enforceIdentityGate && !phoneVerified
            ? CommunityPublishNextAction.VerifyPhone
            : CommunityPublishNextAction.Ready;

    return {
      privacyPolicyVersion,
      communityAgreementVersion,
      profileCreated: input.profileCreated,
      privacyConsentSatisfied,
      privacyConsentAcceptedAt: input.compliance.privacyConsentAcceptedAt?.toISOString(),
      phoneVerificationStatus: phoneVerified
        ? CommunityPhoneVerificationStatus.Verified
        : CommunityPhoneVerificationStatus.Unverified,
      phoneVerified,
      canPublish: unmetRequirements.length === 0,
      nextAction,
      unmetRequirements,
      governanceStatus: input.governance.status,
      message: createPublishEligibilityMessage(nextAction, input.governance.reason)
    };
  }

  private async assertCommunityPublishAllowed(
    userId: string
  ): Promise<AdminCommunityUserGovernance> {
    const governance = await this.assertCommunityWriteAllowed(userId);
    if (!this.isCommunityIdentityGateEnforced()) {
      return governance;
    }

    const compliance = await this.findComplianceRecord(userId);
    const eligibility = this.createPublishEligibility({
      profileCreated: true,
      compliance,
      governance
    });

    if (!eligibility.privacyConsentSatisfied) {
      throw new ForbiddenException({
        errorCode: CommunityLiteErrorCode.PrivacyConsentRequired,
        message: "请先同意当前隐私政策和社区用户协议",
        eligibility
      });
    }

    if (!eligibility.phoneVerified) {
      throw new ForbiddenException({
        errorCode: CommunityLiteErrorCode.PhoneVerificationRequired,
        message: "发帖、评论和回复前需要完成微信手机号验证",
        eligibility
      });
    }

    return governance;
  }

  private async createMockPhoneNumber(code: string): Promise<{ phoneNumber: string }> {
    const normalizedCode = code.trim();
    if (!normalizedCode) {
      throw new WechatPhoneNumberError("手机号验证凭证不能为空");
    }
    if (/^(login|wx_login|wechat_login)[_-]/iu.test(normalizedCode)) {
      throw new WechatPhoneNumberError("手机号验证不能使用微信登录 code");
    }
    const mockFailure = this.getConfigValue("WECHAT_PHONE_NUMBER_MOCK_ERROR");
    if (mockFailure === "true" || mockFailure === normalizedCode) {
      throw new WechatPhoneNumberError("手机号验证 mock 失败");
    }

    return {
      phoneNumber: this.getConfigValue("WECHAT_PHONE_NUMBER_MOCK_PHONE") || "13800000000"
    };
  }

  private isPhoneMockEnabled(): boolean {
    if (this.getConfigValue("WECHAT_PHONE_NUMBER_MOCK_ENABLED") === "true") {
      return true;
    }

    const hasWechatConfig = Boolean(
      this.getConfigValue("WECHAT_MINIAPP_APPID") && this.getConfigValue("WECHAT_MINIAPP_SECRET")
    );
    return !hasWechatConfig && this.getConfigValue("NODE_ENV") !== "production";
  }

  private hashPhoneNumber(phoneNumber: string): string {
    const salt =
      this.getConfigValue("COMMUNITY_PHONE_HASH_SALT") ||
      this.getConfigValue("APP_AUTH_TOKEN_SECRET") ||
      "moyuxia-community-phone";
    return createHash("sha256").update(`${salt}:${phoneNumber.trim()}`).digest("hex");
  }

  private resolvePublishIpLocation(
    context?: CommunityWriteRequestContext
  ): CommunityIpLocationSnapshot {
    const now = new Date();
    const mockLabel = this.getConfigValue("COMMUNITY_IP_LOCATION_MOCK_LABEL");
    if (mockLabel?.trim()) {
      return {
        ipLocationLabel: mockLabel.trim(),
        ipLocationCountryOrRegion:
          this.getConfigValue("COMMUNITY_IP_LOCATION_MOCK_COUNTRY") || "中国",
        ipLocationProvince:
          this.getConfigValue("COMMUNITY_IP_LOCATION_MOCK_PROVINCE") || mockLabel.trim(),
        ipLocationSource: "mock_config",
        ipLocationStatus: CommunityIpLocationResolveStatus.Resolved,
        ipLocationResolvedAt: now
      };
    }

    const clientIp = this.extractTrustedClientIp(context);
    if (!clientIp) {
      return createUnknownIpLocationSnapshot(now, "private_or_missing_ip");
    }

    if (isPrivateOrLocalIp(clientIp)) {
      return createUnknownIpLocationSnapshot(now, "private_or_missing_ip");
    }

    return createUnknownIpLocationSnapshot(now, "resolver_not_configured");
  }

  private extractTrustedClientIp(context?: CommunityWriteRequestContext): string | undefined {
    const remoteIp = normalizeIpAddress(context?.socket?.remoteAddress ?? context?.ip);
    const configuredHeaders = splitConfigList(
      this.getConfigValue("COMMUNITY_TRUSTED_PROXY_HEADERS") ||
        this.getConfigValue("TRUSTED_PROXY_IP_HEADERS")
    ).map((header) => header.toLowerCase());
    const trustedProxyAddrs = splitConfigList(
      this.getConfigValue("COMMUNITY_TRUSTED_PROXY_ADDRS") ||
        this.getConfigValue("TRUSTED_PROXY_REMOTE_ADDRS")
    );

    if (remoteIp && configuredHeaders.length > 0 && isTrustedProxyIp(remoteIp, trustedProxyAddrs)) {
      const headers = normalizeRequestHeaders(context?.headers);
      for (const headerName of configuredHeaders) {
        const value = headers[headerName];
        const headerIp = extractFirstValidPublicIp(value);
        if (headerIp) {
          return headerIp;
        }
      }
    }

    return remoteIp && isIP(remoteIp) ? remoteIp : undefined;
  }

  private async findRecentPublicIpLocationForUser(
    userId: string
  ): Promise<CommunityIpLocationPublicRecord | undefined> {
    const approvedStatus = CommunityPostStatus.Approved;
    const approvedCommentStatus = CommunityCommentStatus.Approved;
    const records: CommunityIpLocationPublicRecord[] = [];

    if (!this.isDatabaseConfigured()) {
      records.push(
        ...[...this.memoryPosts.values()]
          .filter((post) => post.authorUserId === userId && post.status === approvedStatus)
          .map((post) => ipLocationRecordFromContent(post)),
        ...[...this.memoryComments.values()]
          .filter(
            (comment) => comment.authorUserId === userId && comment.status === approvedCommentStatus
          )
          .map((comment) => ipLocationRecordFromContent(comment)),
        ...[...this.memoryReplies.values()]
          .filter(
            (reply) => reply.authorUserId === userId && reply.status === approvedCommentStatus
          )
          .map((reply) => ipLocationRecordFromContent(reply))
      );
    } else {
      const [posts, comments, replies] = await Promise.all([
        this.communityPost.findMany({
          where: { authorUserId: userId, status: approvedStatus },
          orderBy: [{ approvedAt: "desc" }, { createdAt: "desc" }],
          take: 20
        }),
        this.communityComment.findMany({
          where: { authorUserId: userId, status: approvedCommentStatus },
          orderBy: [{ approvedAt: "desc" }, { createdAt: "desc" }],
          take: 20
        }),
        this.communityReply.findMany({
          where: { authorUserId: userId, status: approvedCommentStatus },
          orderBy: [{ approvedAt: "desc" }, { createdAt: "desc" }],
          take: 20
        })
      ]);
      records.push(
        ...posts.map((post) => ipLocationRecordFromContent(post)),
        ...comments.map((comment) => ipLocationRecordFromContent(comment)),
        ...replies.map((reply) => ipLocationRecordFromContent(reply))
      );
    }

    return records
      .sort((first, second) => second.publishedAt.getTime() - first.publishedAt.getTime())
      .find((record) => record.hasIpLocationSnapshot);
  }

  private async createIdentityComplianceSummary(
    userId: string
  ): Promise<CommunityIdentityComplianceSummary> {
    const compliance = await this.findComplianceRecord(userId);
    return {
      phoneVerified: compliance.phoneVerified,
      privacyPolicyVersion: compliance.privacyPolicyVersion ?? undefined,
      communityAgreementVersion: compliance.communityAgreementVersion ?? undefined,
      privacyConsentAcceptedAt: compliance.privacyConsentAcceptedAt?.toISOString(),
      privacyConsentScene: compliance.privacyConsentScene ?? undefined,
      phoneVerifiedAt: compliance.phoneVerifiedAt?.toISOString(),
      phoneVerificationSource: compliance.phoneVerificationSource ?? undefined
    };
  }

  private getConfigValue(name: string): string | undefined {
    const value = this.configService?.get<string>(name) ?? process.env[name];
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
  }

  private async moderatePost(
    userId: string,
    title: string,
    body: string
  ): Promise<TextModerationOutcome> {
    const localModeration = this.lowCostContentModerationService
      ? this.lowCostContentModerationService.moderateFields({
          fields: [
            { field: "title", value: title },
            { field: "body", value: body }
          ]
        })
      : undefined;

    if (
      localModeration &&
      (localModeration.decision === LowCostModerationDecision.Reject ||
        localModeration.riskLevel === "high")
    ) {
      return {
        decision: AiModerationDecision.Rejected,
        trace: createTextModerationTrace(localModeration),
        reason: localModeration.reason,
        riskTags: localModeration.riskTags
      };
    }

    const providerModeration = this.aiContentModerationService
      ? this.aiContentModerationService.moderateUserContent({
          userId,
          contentType: "community_post",
          title,
          body
        })
      : {
          decision: AiModerationDecision.NeedsManualReview,
          source: "manual_fallback" as const,
          confidence: 0,
          riskTags: ["provider_failure" as const],
          reason: "AI 审核服务未注册，已转入人工复核。",
          manualReviewReason: "provider_unavailable" as const,
          moderatedAt: new Date().toISOString()
        };
    const providerResult = await providerModeration;
    return {
      decision: providerResult.decision,
      trace: createTextModerationTrace(localModeration, providerResult),
      reason: providerResult.reason,
      riskTags: [...new Set([...(localModeration?.riskTags ?? []), ...providerResult.riskTags])]
    };
  }

  private async moderateComment(
    userId: string,
    body: string
  ): Promise<LowCostContentModerationResult> {
    const extraRiskTags = await this.getCommentBehaviorRiskTags(userId, body);

    if (this.lowCostContentModerationService) {
      return this.lowCostContentModerationService.moderateFields({
        fields: [{ field: "body", value: body }],
        extraRiskTags
      });
    }

    return {
      decision: LowCostModerationDecision.Pass,
      source: "local_rules",
      riskLevel: "low",
      riskTags:
        extraRiskTags.length > 0 ? extraRiskTags : ([LowCostModerationRiskTag.Safe] as const),
      hits: [],
      reason: "本地低成本审核服务未注册，按低风险评论进入后续分流。",
      suggestion: "继续执行内容安全或人工兜底判断。",
      fingerprint: createContentFingerprint(body),
      moderatedAt: new Date().toISOString()
    };
  }

  private async moderateDiscussion(
    userId: string,
    body: string,
    options: { limited: boolean }
  ): Promise<DiscussionModerationOutcome> {
    const localModeration = await this.moderateComment(userId, body);
    const localReviewDecision = await this.decideDiscussionReview(
      userId,
      body,
      localModeration,
      options
    );

    if (
      isLowCostModerationResult(localModeration) &&
      localReviewDecision.decision === CommentReviewDecision.AutoApprove
    ) {
      return {
        decision: AiModerationDecision.Approved,
        status: CommunityCommentStatus.Approved,
        trace: createDiscussionModerationTrace(localModeration, localReviewDecision),
        reason: localReviewDecision.reason,
        riskTags: localModeration.riskTags,
        reviewDecision: localReviewDecision
      };
    }

    if (
      isLowCostModerationResult(localModeration) &&
      localReviewDecision.decision === CommentReviewDecision.AutoReject
    ) {
      return {
        decision: AiModerationDecision.Rejected,
        status: CommunityCommentStatus.Rejected,
        trace: createDiscussionModerationTrace(localModeration, localReviewDecision),
        reason: localReviewDecision.reason,
        riskTags: localModeration.riskTags,
        reviewDecision: localReviewDecision
      };
    }

    const providerModeration = this.aiContentModerationService
      ? await this.aiContentModerationService.moderateUserContent({
          userId,
          contentType: "community_comment",
          body
        })
      : undefined;

    if (!providerModeration) {
      return {
        decision: AiModerationDecision.NeedsManualReview,
        status: CommunityCommentStatus.Pending,
        trace: createDiscussionModerationTrace(localModeration, localReviewDecision),
        reason: localReviewDecision.reason,
        riskTags: "riskTags" in localModeration ? localModeration.riskTags : [],
        reviewDecision: localReviewDecision
      };
    }

    if (
      localReviewDecision.decision === CommentReviewDecision.ManualReview &&
      localReviewDecision.userRiskReasons.includes(CommentReviewUserRiskReason.EffectiveReport) &&
      providerModeration.decision === AiModerationDecision.Approved
    ) {
      return {
        decision: AiModerationDecision.NeedsManualReview,
        status: CommunityCommentStatus.Pending,
        trace: createDiscussionModerationTrace(
          localModeration,
          localReviewDecision,
          providerModeration
        ),
        reason: localReviewDecision.reason,
        riskTags: [...new Set([...localModeration.riskTags, ...providerModeration.riskTags])],
        reviewDecision: localReviewDecision
      };
    }

    const providerReviewDecision = createLegacyDiscussionReviewDecision(providerModeration);
    const status = commentReviewDecisionToStatus(
      providerReviewDecision.decision,
      providerModeration.decision
    );
    return {
      decision: providerModeration.decision,
      status,
      trace: createDiscussionModerationTrace(
        localModeration,
        providerReviewDecision,
        providerModeration
      ),
      reason: providerReviewDecision.reason,
      riskTags: [...new Set([...localModeration.riskTags, ...providerModeration.riskTags])],
      reviewDecision: providerReviewDecision
    };
  }
  private async decideDiscussionReview(
    userId: string,
    body: string,
    moderation: LowCostContentModerationResult | AiContentModerationResult,
    options: { limited: boolean }
  ): Promise<CommentReviewDecisionSummary> {
    if (!isLowCostModerationResult(moderation)) {
      return createLegacyDiscussionReviewDecision(moderation);
    }

    const [approvedDiscussionCount, userRiskReasons] = await Promise.all([
      this.countApprovedDiscussionsForUser(userId),
      this.getCommentUserRiskReasons(userId, options)
    ]);

    return decideCommentReview({
      moderation,
      body,
      approvedDiscussionCount,
      userRiskReasons
    });
  }

  private async assertCommentSubmitAllowed(userId: string, body: string): Promise<void> {
    const [dailyCount, recentCount, hasDuplicate] = await Promise.all([
      this.countUserDiscussionSubmissionsSince(userId, startOfLocalDay(new Date())),
      this.countUserDiscussionSubmissionsSince(
        userId,
        new Date(Date.now() - COMMUNITY_COMMENT_RECENT_WINDOW_MS)
      ),
      this.hasRecentDuplicateDiscussion(
        userId,
        body,
        new Date(Date.now() - COMMUNITY_COMMENT_DUPLICATE_WINDOW_MS)
      )
    ]);

    if (dailyCount >= COMMUNITY_COMMENT_DAILY_SUBMIT_LIMIT) {
      throw new HttpException(
        {
          errorCode: "community_comment_daily_limit",
          message: "今日评论和回复提交次数已达上限，请明天再试"
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    if (recentCount >= COMMUNITY_COMMENT_RECENT_LIMIT) {
      throw new HttpException(
        {
          errorCode: "community_comment_rate_limited",
          message: "评论太频繁，先歇一会儿再发"
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    if (hasDuplicate) {
      throw new HttpException(
        {
          errorCode: "community_comment_duplicate",
          message: "短时间内请不要重复提交相同内容"
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
  }

  private async getCommentBehaviorRiskTags(
    userId: string,
    body: string
  ): Promise<LowCostModerationRiskTag[]> {
    const riskTags: LowCostModerationRiskTag[] = [];
    const since = new Date(Date.now() - COMMUNITY_RECENT_VIOLATION_WINDOW_MS);
    const [recentViolationCount, recentEffectiveReportCount] = await Promise.all([
      this.countRecentRejectedDiscussion(userId, since),
      this.countRecentEffectiveReportsAgainstUser(userId, since)
    ]);

    if (recentViolationCount > 0 || recentEffectiveReportCount > 0) {
      riskTags.push(LowCostModerationRiskTag.UserRisk);
    }

    if (
      await this.hasRecentDuplicateDiscussion(
        userId,
        body,
        new Date(Date.now() - COMMUNITY_COMMENT_DUPLICATE_WINDOW_MS)
      )
    ) {
      riskTags.push(LowCostModerationRiskTag.DuplicateContent);
    }

    return riskTags;
  }

  private async getCommentUserRiskReasons(
    userId: string,
    options: { limited: boolean }
  ): Promise<CommentReviewUserRiskReason[]> {
    const reasons: CommentReviewUserRiskReason[] = [];
    const since = new Date(Date.now() - COMMUNITY_RECENT_VIOLATION_WINDOW_MS);
    const [recentViolationCount, recentEffectiveReportCount] = await Promise.all([
      this.countRecentRejectedDiscussion(userId, since),
      this.countRecentEffectiveReportsAgainstUser(userId, since)
    ]);

    if (options.limited) {
      reasons.push(CommentReviewUserRiskReason.LimitedUser);
    }

    if (recentViolationCount > 0) {
      reasons.push(CommentReviewUserRiskReason.ViolatedUser);
    }

    if (recentEffectiveReportCount > 0) {
      reasons.push(CommentReviewUserRiskReason.EffectiveReport);
    }

    return [...new Set(reasons)];
  }

  private async countApprovedDiscussionsForUser(userId: string): Promise<number> {
    const isApproved = (status: string): boolean =>
      normalizeCommentStatus(status) === CommunityCommentStatus.Approved;
    const memoryCount =
      [...this.memoryComments.values()].filter(
        (comment) => comment.authorUserId === userId && isApproved(comment.status)
      ).length +
      [...this.memoryReplies.values()].filter(
        (reply) => reply.authorUserId === userId && isApproved(reply.status)
      ).length;

    if (!this.isDatabaseConfigured()) {
      return memoryCount;
    }

    const [commentCount, replyCount] = await Promise.all([
      this.communityComment.count({
        where: { authorUserId: userId, status: CommunityCommentStatus.Approved }
      }),
      this.communityReply.count({
        where: { authorUserId: userId, status: CommunityCommentStatus.Approved }
      })
    ]);
    return Math.max(memoryCount, commentCount + replyCount);
  }

  private async findApprovedPosts(
    request: ListCommunityPostsRequest
  ): Promise<CommunityPostRecord[]> {
    if (!this.isDatabaseConfigured()) {
      return [...this.memoryPosts.values()]
        .filter((post) => post.status === CommunityPostStatus.Approved)
        .filter(
          (post) => post.sectionKey === (request.sectionKey ?? CommunitySectionKey.Recommended)
        )
        .sort(sortPosts(request.sort))
        .slice(0, request.limit ?? 20);
    }

    return this.communityPost.findMany({
      where: {
        status: CommunityPostStatus.Approved,
        sectionKey: request.sectionKey ?? CommunitySectionKey.Recommended
      },
      orderBy:
        request.sort === CommunityPostSort.Hot
          ? [{ approvedAt: "desc" }, { createdAt: "desc" }]
          : [{ approvedAt: "desc" }, { createdAt: "desc" }],
      take: request.limit ?? 20
    });
  }

  private async findPostsByStatus(status: string): Promise<CommunityPostRecord[]> {
    if (!this.isDatabaseConfigured()) {
      return [...this.memoryPosts.values()].filter((post) => post.status === status);
    }

    return this.communityPost.findMany({ where: { status }, orderBy: [{ createdAt: "asc" }] });
  }

  private async findPostsForAuthor(authorUserId: string): Promise<CommunityPostRecord[]> {
    if (!this.isDatabaseConfigured()) {
      return [...this.memoryPosts.values()]
        .filter((post) => post.authorUserId === authorUserId)
        .sort((first, second) => second.createdAt.getTime() - first.createdAt.getTime());
    }

    return this.communityPost.findMany({
      where: { authorUserId },
      orderBy: [{ createdAt: "desc" }]
    });
  }

  private async findGovernancePosts(): Promise<CommunityPostRecord[]> {
    if (!this.isDatabaseConfigured()) {
      return [...this.memoryPosts.values()];
    }

    return this.communityPost.findMany({
      where: {},
      orderBy: [{ createdAt: "desc" }],
      take: 500
    });
  }

  private async findAllCommentsForPost(postId: string): Promise<CommunityCommentRecord[]> {
    if (!this.isDatabaseConfigured()) {
      return [...this.memoryComments.values()]
        .filter((comment) => comment.postId === postId)
        .sort((first, second) => first.createdAt.getTime() - second.createdAt.getTime());
    }

    return this.communityComment.findMany({
      where: { postId },
      orderBy: [{ createdAt: "asc" }]
    });
  }

  private async findAllRepliesForComment(commentId: string): Promise<CommunityReplyRecord[]> {
    if (!this.isDatabaseConfigured()) {
      return [...this.memoryReplies.values()]
        .filter((reply) => reply.commentId === commentId)
        .sort((first, second) => first.createdAt.getTime() - second.createdAt.getTime());
    }

    return this.communityReply.findMany({
      where: { commentId },
      orderBy: [{ createdAt: "asc" }]
    });
  }

  private async findCommentsForPosts(
    postIds: readonly string[]
  ): Promise<CommunityCommentRecord[]> {
    if (postIds.length === 0) {
      return [];
    }

    if (!this.isDatabaseConfigured()) {
      return [...this.memoryComments.values()]
        .filter(
          (comment) =>
            postIds.includes(comment.postId) && comment.status === CommunityCommentStatus.Approved
        )
        .sort((first, second) => second.createdAt.getTime() - first.createdAt.getTime());
    }

    return this.communityComment.findMany({
      where: { postId: { in: [...postIds] }, status: CommunityCommentStatus.Approved },
      orderBy: [{ createdAt: "desc" }]
    });
  }

  private async findCommentsByStatus(status: string): Promise<CommunityCommentRecord[]> {
    if (!this.isDatabaseConfigured()) {
      return [...this.memoryComments.values()].filter((comment) => comment.status === status);
    }

    return this.communityComment.findMany({ where: { status }, orderBy: [{ createdAt: "asc" }] });
  }

  private async findCommentsForAuthor(authorUserId: string): Promise<CommunityCommentRecord[]> {
    if (!this.isDatabaseConfigured()) {
      return [...this.memoryComments.values()]
        .filter((comment) => comment.authorUserId === authorUserId)
        .sort((first, second) => second.createdAt.getTime() - first.createdAt.getTime());
    }

    return this.communityComment.findMany({
      where: { authorUserId },
      orderBy: [{ createdAt: "desc" }]
    });
  }

  private async findRepliesForAuthor(authorUserId: string): Promise<CommunityReplyRecord[]> {
    if (!this.isDatabaseConfigured()) {
      return [...this.memoryReplies.values()]
        .filter((reply) => reply.authorUserId === authorUserId)
        .sort((first, second) => second.createdAt.getTime() - first.createdAt.getTime());
    }

    return this.communityReply.findMany({
      where: { authorUserId },
      orderBy: [{ createdAt: "desc" }]
    });
  }

  private async findRepliesByStatus(status: string): Promise<CommunityReplyRecord[]> {
    if (!this.isDatabaseConfigured()) {
      return [...this.memoryReplies.values()].filter((reply) => reply.status === status);
    }

    return this.communityReply.findMany({ where: { status }, orderBy: [{ createdAt: "asc" }] });
  }

  private async findApprovedComments(postId: string): Promise<CommunityCommentRecord[]> {
    if (!this.isDatabaseConfigured()) {
      return [...this.memoryComments.values()]
        .filter(
          (comment) =>
            comment.postId === postId && comment.status === CommunityCommentStatus.Approved
        )
        .sort((first, second) => first.createdAt.getTime() - second.createdAt.getTime());
    }

    return this.communityComment.findMany({
      where: { postId, status: CommunityCommentStatus.Approved },
      orderBy: [{ approvedAt: "asc" }, { createdAt: "asc" }]
    });
  }

  private async findVisibleCommentsForViewer(
    postId: string,
    viewerUserId: string
  ): Promise<CommunityCommentRecord[]> {
    const comments = await this.findAllCommentsForPost(postId);
    return comments.filter(
      (comment) =>
        comment.status === CommunityCommentStatus.Approved ||
        (comment.authorUserId === viewerUserId && comment.status === CommunityCommentStatus.Pending)
    );
  }

  private async findApprovedReplies(commentId: string): Promise<CommunityReplyRecord[]> {
    if (!this.isDatabaseConfigured()) {
      return [...this.memoryReplies.values()]
        .filter(
          (reply) =>
            reply.commentId === commentId && reply.status === CommunityCommentStatus.Approved
        )
        .sort((first, second) => first.createdAt.getTime() - second.createdAt.getTime());
    }

    return this.communityReply.findMany({
      where: { commentId, status: CommunityCommentStatus.Approved },
      orderBy: [{ approvedAt: "asc" }, { createdAt: "asc" }]
    });
  }

  private async findVisibleRepliesForViewer(
    commentId: string,
    viewerUserId?: string
  ): Promise<CommunityReplyRecord[]> {
    const replies = await this.findAllRepliesForComment(commentId);
    return replies.filter(
      (reply) =>
        reply.status === CommunityCommentStatus.Approved ||
        (viewerUserId &&
          reply.authorUserId === viewerUserId &&
          reply.status === CommunityCommentStatus.Pending)
    );
  }

  private async findPost(postId: string): Promise<CommunityPostRecord | null> {
    if (!this.isDatabaseConfigured()) {
      return this.memoryPosts.get(postId) ?? null;
    }

    return this.communityPost.findUnique({ where: { id: postId } });
  }

  private async findComment(commentId: string): Promise<CommunityCommentRecord | null> {
    if (!this.isDatabaseConfigured()) {
      return this.memoryComments.get(commentId) ?? null;
    }

    return this.communityComment.findUnique({ where: { id: commentId } });
  }

  private async findReply(replyId: string): Promise<CommunityReplyRecord | null> {
    if (!this.isDatabaseConfigured()) {
      return this.memoryReplies.get(replyId) ?? null;
    }

    return this.communityReply.findUnique({ where: { id: replyId } });
  }

  private async findFavoritePostsForUser(userId: string): Promise<CommunityPostRecord[]> {
    if (!this.isDatabaseConfigured()) {
      const postIds = [...this.memoryFavorites]
        .filter((item) => item.endsWith(`:${userId}`))
        .map((item) => item.split(":")[0]);
      return [...this.memoryPosts.values()].filter(
        (post) => postIds.includes(post.id) && post.status === CommunityPostStatus.Approved
      );
    }

    const favorites = (await this.communityPostFavorite.findMany({
      where: { userId }
    })) as Array<{ postId: string }>;
    if (favorites.length === 0) {
      return [];
    }
    return this.communityPost.findMany({
      where: {
        id: { in: favorites.map((favorite) => favorite.postId) },
        status: CommunityPostStatus.Approved
      },
      orderBy: [{ approvedAt: "desc" }]
    });
  }

  private async findMediaAssetsForPost(
    postId: string,
    options: { includeBound?: boolean } = {}
  ): Promise<CommunityMediaAssetRecord[]> {
    const allowedStatuses = options.includeBound
      ? [CommunityMediaAssetStatus.Bound, CommunityMediaAssetStatus.Approved]
      : [CommunityMediaAssetStatus.Approved];
    const memoryAssets = [...this.memoryMediaAssets.values()].filter(
      (asset) =>
        asset.postId === postId &&
        (allowedStatuses as readonly string[]).includes(String(asset.status))
    );

    if (!this.isDatabaseConfigured() || !this.hasCommunityMediaAssetDelegate()) {
      return memoryAssets;
    }

    try {
      const persistedAssets = await this.communityMediaAsset.findMany({
        where: { postId, status: { in: allowedStatuses } },
        orderBy: [{ createdAt: "asc" }]
      });
      const memoryById = new Map(memoryAssets.map((asset) => [asset.id, asset]));
      return [
        ...persistedAssets,
        ...memoryAssets.filter((asset) => !persistedAssets.some((item) => item.id === asset.id))
      ].map((asset) => memoryById.get(asset.id) ?? asset);
    } catch (error) {
      this.logger.warn(
        `社区图片资产读取失败，已回退开发期内存资产：${normalizeErrorMessage(error)}`
      );
      return memoryAssets;
    }
  }

  private async findNotificationsForUser(userId: string): Promise<CommunityNotificationRecord[]> {
    if (!this.isDatabaseConfigured()) {
      return [...this.memoryNotifications.values()]
        .filter((notification) => notification.recipientUserId === userId)
        .sort((first, second) => second.createdAt.getTime() - first.createdAt.getTime());
    }

    return this.communityNotification.findMany({
      where: { recipientUserId: userId },
      orderBy: [{ createdAt: "desc" }],
      take: 50
    });
  }

  private async countUnreadNotifications(userId: string): Promise<number> {
    if (!this.isDatabaseConfigured()) {
      return [...this.memoryNotifications.values()].filter(
        (notification) => notification.recipientUserId === userId && !notification.readAt
      ).length;
    }

    return this.communityNotification.count({ where: { recipientUserId: userId, readAt: null } });
  }

  private async findPendingReports(): Promise<CommunityReportRecord[]> {
    if (!this.isDatabaseConfigured()) {
      return [...this.memoryReports.values()].filter(
        (report) => report.status === CommunityReportStatus.Pending
      );
    }

    return this.communityReport.findMany({
      where: { status: CommunityReportStatus.Pending },
      orderBy: [{ createdAt: "asc" }]
    });
  }

  private async findReportsForReview(
    filters: CommunityReportReviewFilters
  ): Promise<CommunityReportRecord[]> {
    const status = filters.status?.trim();
    const reasonCode = filters.reasonCode?.trim();
    const targetType = filters.targetType?.trim();
    const priority = filters.priority?.trim();
    const matches = (report: CommunityReportRecord): boolean =>
      (!status || report.status === status) &&
      (!reasonCode || report.reasonCode === reasonCode) &&
      (!targetType || report.targetType === targetType) &&
      (!priority || report.priority === priority);

    if (!this.isDatabaseConfigured()) {
      return sortReportsForReview([...this.memoryReports.values()].filter(matches));
    }

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }
    if (reasonCode) {
      where.reasonCode = reasonCode;
    }
    if (targetType) {
      where.targetType = targetType;
    }
    if (priority) {
      where.priority = priority;
    }

    const reports = await this.communityReport.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      take: 100
    });
    return sortReportsForReview(reports);
  }

  private async findReportsByTargetKey(targetKey: string): Promise<CommunityReportRecord[]> {
    if (!this.isDatabaseConfigured()) {
      return [...this.memoryReports.values()]
        .filter((report) => report.targetKey === targetKey)
        .sort((first, second) => second.createdAt.getTime() - first.createdAt.getTime());
    }

    return this.communityReport.findMany({
      where: { targetKey },
      orderBy: [{ createdAt: "desc" }]
    });
  }

  private async findReportByReporterAndTarget(
    reporterUserId: string,
    targetKey: string
  ): Promise<CommunityReportRecord | null> {
    if (!this.isDatabaseConfigured()) {
      return (
        [...this.memoryReports.values()].find(
          (report) => report.reporterUserId === reporterUserId && report.targetKey === targetKey
        ) ?? null
      );
    }

    const reports = await this.communityReport.findMany({
      where: { reporterUserId, targetKey },
      orderBy: [{ createdAt: "desc" }],
      take: 1
    });
    return reports[0] ?? null;
  }

  private async findReportsByReporterSince(
    reporterUserId: string,
    since: Date
  ): Promise<CommunityReportRecord[]> {
    if (!this.isDatabaseConfigured()) {
      return [...this.memoryReports.values()].filter(
        (report) => report.reporterUserId === reporterUserId && report.createdAt >= since
      );
    }

    return this.communityReport.findMany({
      where: { reporterUserId, createdAt: { gte: since } },
      orderBy: [{ createdAt: "desc" }]
    });
  }

  private async findReport(reportId: string): Promise<CommunityReportRecord | null> {
    if (!this.isDatabaseConfigured()) {
      return this.memoryReports.get(reportId) ?? null;
    }

    return this.communityReport.findUnique({ where: { id: reportId } });
  }

  private async findReportsForPost(postId: string): Promise<CommunityReportRecord[]> {
    if (!this.isDatabaseConfigured()) {
      return [...this.memoryReports.values()]
        .filter(
          (report) =>
            report.postId === postId ||
            this.reportSnapshotPostId(report) === postId ||
            this.memoryComments.get(report.commentId ?? "")?.postId === postId ||
            this.memoryReplies.get(report.replyId ?? "")?.postId === postId
        )
        .sort((first, second) => second.createdAt.getTime() - first.createdAt.getTime());
    }

    return this.communityReport.findMany({
      where: {
        OR: [
          { postId },
          { comment: { postId } },
          { reply: { postId } },
          { targetSnapshot: { path: ["postId"], equals: postId } }
        ]
      },
      orderBy: [{ createdAt: "desc" }]
    });
  }

  private reportSnapshotPostId(report: CommunityReportRecord): string | undefined {
    if (!report.targetSnapshot || typeof report.targetSnapshot !== "object") {
      return undefined;
    }
    const snapshot = report.targetSnapshot as { postId?: unknown };
    return typeof snapshot.postId === "string" ? snapshot.postId : undefined;
  }

  private async findUserGovernanceRecord(
    userId: string
  ): Promise<CommunityUserGovernanceRecord | null> {
    const memoryRecord = this.memoryUserGovernance.get(userId) ?? null;
    if (!this.isDatabaseConfigured() || !this.hasCommunityUserGovernanceDelegate()) {
      return memoryRecord;
    }

    try {
      return await this.communityUserGovernance.findUnique({ where: { userId } });
    } catch (error) {
      this.logger.warn(`读取社区用户治理状态失败，使用默认状态：${normalizeErrorMessage(error)}`);
      return memoryRecord;
    }
  }

  private async findGovernanceAuditsForPost(
    post: CommunityPostRecord
  ): Promise<AdminCommunityGovernanceAudit[]> {
    const postIds = [post.id];
    const commentIds = (await this.findAllCommentsForPost(post.id)).map((comment) => comment.id);
    const replyIds = (
      await Promise.all(commentIds.map((commentId) => this.findAllRepliesForComment(commentId)))
    )
      .flat()
      .map((reply) => reply.id);
    const records = await this.findGovernanceAudits([
      { targetType: AdminCommunityGovernanceTargetType.Post, targetIds: postIds },
      { targetType: AdminCommunityGovernanceTargetType.Comment, targetIds: commentIds },
      { targetType: AdminCommunityGovernanceTargetType.Reply, targetIds: replyIds },
      { targetType: AdminCommunityGovernanceTargetType.User, targetIds: [post.authorUserId] }
    ]);
    return records
      .sort((first, second) => second.createdAt.getTime() - first.createdAt.getTime())
      .map(auditToPublic);
  }

  private async findGovernanceAudits(
    groups: readonly { targetType: string; targetIds: readonly string[] }[]
  ): Promise<CommunityGovernanceAuditRecord[]> {
    const normalized = groups.filter((group) => group.targetIds.length > 0);
    if (normalized.length === 0) {
      return [];
    }

    if (!this.isDatabaseConfigured() || !this.hasCommunityGovernanceAuditDelegate()) {
      return [...this.memoryGovernanceAudits.values()].filter((audit) =>
        normalized.some(
          (group) =>
            audit.targetType === group.targetType && group.targetIds.includes(audit.targetId)
        )
      );
    }

    return this.communityGovernanceAudit.findMany({
      where: {
        OR: normalized.map((group) => ({
          targetType: group.targetType,
          targetId: { in: [...group.targetIds] }
        }))
      },
      orderBy: [{ createdAt: "desc" }],
      take: 100
    });
  }

  private async postToSummary(
    post: CommunityPostRecord,
    viewerUserId?: string
  ): Promise<CommunityPostSummary> {
    const stats = await this.getStats(post.id);
    const authorFaction = isUserFaction(post.authorFaction)
      ? post.authorFaction
      : (CommunitySectionKey.Wanderer as UserFaction);

    return {
      id: post.id,
      title: post.title,
      excerpt: createExcerpt(post.body),
      author: await this.normalizeAuthorSnapshotForUser(post.authorSnapshot, post.authorUserId),
      authorFaction,
      sectionKey: normalizeSectionKey(post.sectionKey),
      status: normalizePostStatus(post.status),
      mediaAssets: (
        await this.findMediaAssetsForPost(post.id, {
          includeBound: post.status !== CommunityPostStatus.Approved
        })
      ).map((asset) => this.mediaAssetToPublic(asset)),
      imageKeys: normalizeStringArray(post.imageKeys),
      createdAt: post.createdAt.toISOString(),
      approvedAt: (post.approvedAt ?? post.createdAt).toISOString(),
      stats,
      viewerInteraction: viewerUserId
        ? await this.getViewerInteraction(post.id, viewerUserId)
        : undefined,
      visibleToAuthorOnly:
        post.status === CommunityPostStatus.Pending && post.authorUserId === viewerUserId
          ? true
          : undefined,
      dailyContentQuote: normalizeDailyContentQuote(post.dailyContentQuote)
    };
  }

  private async postToMySummary(
    post: CommunityPostRecord,
    viewerUserId: string
  ): Promise<CommunityMyPostSummary> {
    const publicLikeFields = await this.postToSummary(
      {
        ...post,
        status: CommunityPostStatus.Approved,
        approvedAt: post.approvedAt ?? post.createdAt
      },
      viewerUserId
    );
    return {
      ...publicLikeFields,
      status: normalizePostStatus(post.status),
      approvedAt: post.approvedAt?.toISOString(),
      reviewNote: post.reviewNote ?? undefined,
      moderation: normalizeModerationTrace(post.moderation, post.reviewNote)
    };
  }

  private async postToDetail(
    post: CommunityPostRecord,
    viewerUserId?: string
  ): Promise<CommunityPostDetail> {
    return {
      ...(await this.postToSummary(post, viewerUserId)),
      body: post.body,
      ipLocationLabel: post.ipLocationLabel ?? undefined,
      reviewNote: post.reviewNote ?? undefined,
      moderation: viewerUserId
        ? undefined
        : normalizeModerationTrace(post.moderation, post.reviewNote)
    };
  }

  private async postToGovernanceOverview(
    post: CommunityPostRecord
  ): Promise<AdminCommunityPostOverviewItem> {
    const stats = await this.getStats(post.id);

    return {
      id: post.id,
      title: post.title,
      excerpt: createExcerpt(post.body),
      author: normalizeAuthorSnapshot(post.authorSnapshot),
      authorUserId: post.authorUserId,
      sectionKey: normalizeSectionKey(post.sectionKey),
      status: normalizePostStatus(post.status),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      riskSummary: createGovernanceRiskSummary(post.moderation, post.reviewNote),
      ipLocation: ipLocationToAdminSummary(post),
      identityCompliance: await this.createIdentityComplianceSummary(post.authorUserId),
      stats,
      mediaAssets: (
        await this.findMediaAssetsForPost(post.id, {
          includeBound: post.status !== CommunityPostStatus.Approved
        })
      ).map((asset) => this.mediaAssetToPublic(asset)),
      availableActions: [
        AdminCommunityGovernanceAction.ViewDetail,
        AdminCommunityGovernanceAction.HidePost,
        AdminCommunityGovernanceAction.RemovePost
      ]
    };
  }

  private async commentToGovernanceItem(
    comment: CommunityCommentRecord
  ): Promise<AdminCommunityCommentGovernanceItem> {
    return {
      id: comment.id,
      postId: comment.postId,
      body: comment.body,
      author: await this.normalizeAuthorSnapshotForUser(
        comment.authorSnapshot,
        comment.authorUserId
      ),
      authorUserId: comment.authorUserId,
      status: normalizeCommentStatus(comment.status),
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      riskSummary: createGovernanceRiskSummary(comment.moderation, comment.reviewNote),
      ipLocation: ipLocationToAdminSummary(comment),
      replies: await Promise.all(
        (await this.findAllRepliesForComment(comment.id)).map((reply) =>
          this.replyToGovernanceItem(reply)
        )
      ),
      availableActions: [
        AdminCommunityGovernanceAction.ViewDetail,
        AdminCommunityGovernanceAction.HideComment,
        AdminCommunityGovernanceAction.RemoveComment
      ]
    };
  }

  private replyToGovernanceItem(reply: CommunityReplyRecord): AdminCommunityReplyGovernanceItem {
    return {
      id: reply.id,
      postId: reply.postId,
      commentId: reply.commentId,
      body: reply.body,
      author: normalizeAuthorSnapshot(reply.authorSnapshot),
      authorUserId: reply.authorUserId,
      status: normalizeCommentStatus(reply.status),
      createdAt: reply.createdAt.toISOString(),
      updatedAt: reply.updatedAt.toISOString(),
      riskSummary: createGovernanceRiskSummary(reply.moderation, reply.reviewNote),
      ipLocation: ipLocationToAdminSummary(reply),
      availableActions: [
        AdminCommunityGovernanceAction.ViewDetail,
        AdminCommunityGovernanceAction.HideReply,
        AdminCommunityGovernanceAction.RemoveReply
      ]
    };
  }

  private async buildReportCaseSummary(
    report: CommunityReportRecord
  ): Promise<CommunityReportCaseSummary> {
    const reports = await this.findReportsByTargetKey(report.targetKey);
    const sorted = [...reports].sort(
      (first, second) => first.createdAt.getTime() - second.createdAt.getTime()
    );
    const targetSnapshot =
      normalizeReportTargetSnapshot(report.targetSnapshot) ??
      normalizeReportTargetSnapshot(reports.find((item) => item.targetSnapshot)?.targetSnapshot);
    const reasonCounts = new Map<CommunityReportReasonCode, number>();
    for (const item of reports) {
      const code = reportReasonCode(item.reasonCode);
      reasonCounts.set(code, (reasonCounts.get(code) ?? 0) + 1);
    }
    const reasonDistribution: CommunityReportReasonCount[] = [...reasonCounts.entries()].map(
      ([reasonCode, count]) => ({ reasonCode, count })
    );
    const highestPriority = reports.some(
      (item) => reportPriority(item.priority) === CommunityReportPriority.High
    )
      ? CommunityReportPriority.High
      : CommunityReportPriority.Normal;
    const first = sorted[0] ?? report;
    const latest = sorted[sorted.length - 1] ?? report;

    return {
      targetKey: report.targetKey,
      targetType: reportTargetType(report.targetType),
      targetId: report.postId ?? report.commentId ?? report.replyId ?? "",
      status: reportStatus(report.status),
      priority: highestPriority,
      targetSummary: targetSnapshot
        ? summarizeReportTarget(targetSnapshot)
        : truncateText(report.reason, COMMUNITY_REPORT_TARGET_SUMMARY_LENGTH),
      targetSnapshot,
      reportCount: reports.length || 1,
      pendingCount: reports.filter((item) => item.status === CommunityReportStatus.Pending).length,
      handledCount: reports.filter((item) => item.status !== CommunityReportStatus.Pending).length,
      reasonDistribution,
      firstReportedAt: first.createdAt.toISOString(),
      latestReportedAt: latest.createdAt.toISOString()
    };
  }

  private async buildReportCaseSummaries(
    reports: readonly CommunityReportRecord[]
  ): Promise<CommunityReportCaseSummary[]> {
    const firstByTarget = new Map<string, CommunityReportRecord>();
    for (const report of reports) {
      if (!firstByTarget.has(report.targetKey)) {
        firstByTarget.set(report.targetKey, report);
      }
    }

    const summaries = await Promise.all(
      [...firstByTarget.values()].map((report) => this.buildReportCaseSummary(report))
    );
    return summaries.sort((first, second) =>
      second.latestReportedAt.localeCompare(first.latestReportedAt)
    );
  }

  private reportToGovernanceSummary(report: CommunityReportRecord): AdminCommunityReportSummary {
    const targetSnapshot = normalizeReportTargetSnapshot(report.targetSnapshot);
    return {
      id: report.id,
      targetType: reportTargetType(report.targetType),
      targetId: report.postId ?? report.commentId ?? report.replyId ?? "",
      reason: report.reason,
      reasonCode: reportReasonCode(report.reasonCode),
      reasonText: report.reasonText ?? undefined,
      targetKey: report.targetKey,
      priority: reportPriority(report.priority),
      targetSummary: targetSnapshot ? summarizeReportTarget(targetSnapshot) : undefined,
      targetSnapshot,
      status: reportStatus(report.status),
      handledAction: reportHandleAction(report.handledAction),
      effectiveForAuthorRisk: report.effectiveForAuthorRisk,
      createdAt: report.createdAt.toISOString(),
      handledAt: report.handledAt?.toISOString(),
      handleNote: report.handleNote ?? undefined
    };
  }

  private async commentToPublic(
    comment: CommunityCommentRecord,
    viewerUserId?: string
  ): Promise<CommunityComment> {
    const status = normalizeCommentStatus(comment.status);
    return {
      id: comment.id,
      postId: comment.postId,
      body: comment.body,
      author: await this.normalizeAuthorSnapshotForUser(
        comment.authorSnapshot,
        comment.authorUserId
      ),
      status,
      createdAt: comment.createdAt.toISOString(),
      approvedAt: comment.approvedAt?.toISOString(),
      ipLocationLabel: comment.ipLocationLabel ?? undefined,
      visibleToAuthorOnly:
        status === CommunityCommentStatus.Pending && comment.authorUserId === viewerUserId
          ? true
          : undefined,
      replies: await Promise.all(
        (await this.findVisibleRepliesForViewer(comment.id, viewerUserId)).map((reply) =>
          this.replyToPublic(reply, viewerUserId)
        )
      )
    };
  }

  private async commentToMySummary(
    comment: CommunityCommentRecord
  ): Promise<CommunityMyCommentSummary> {
    return {
      id: comment.id,
      postId: comment.postId,
      body: comment.body,
      author: await this.normalizeAuthorSnapshotForUser(
        comment.authorSnapshot,
        comment.authorUserId
      ),
      status: normalizeCommentStatus(comment.status),
      createdAt: comment.createdAt.toISOString(),
      approvedAt: comment.approvedAt?.toISOString(),
      ipLocationLabel: comment.ipLocationLabel ?? undefined,
      replies: [],
      reviewNote: comment.reviewNote ?? undefined,
      moderation: normalizeModerationTrace(comment.moderation, comment.reviewNote)
    };
  }

  private async replyToPublic(
    reply: CommunityReplyRecord,
    viewerUserId?: string
  ): Promise<CommunityCommentReply> {
    const status = normalizeCommentStatus(reply.status);
    return {
      id: reply.id,
      postId: reply.postId,
      commentId: reply.commentId,
      body: reply.body,
      author: await this.normalizeAuthorSnapshotForUser(reply.authorSnapshot, reply.authorUserId),
      status,
      createdAt: reply.createdAt.toISOString(),
      approvedAt: reply.approvedAt?.toISOString(),
      ipLocationLabel: reply.ipLocationLabel ?? undefined,
      visibleToAuthorOnly:
        status === CommunityCommentStatus.Pending && reply.authorUserId === viewerUserId
          ? true
          : undefined
    };
  }

  private async replyToMySummary(reply: CommunityReplyRecord): Promise<CommunityMyReplySummary> {
    return {
      ...(await this.replyToPublic({
        ...reply,
        status: CommunityCommentStatus.Approved,
        approvedAt: reply.approvedAt ?? reply.createdAt
      })),
      status: normalizeCommentStatus(reply.status),
      approvedAt: reply.approvedAt?.toISOString(),
      reviewNote: reply.reviewNote ?? undefined,
      moderation: normalizeModerationTrace(reply.moderation, reply.reviewNote)
    };
  }

  private mediaAssetToPublic(asset: CommunityMediaAssetRecord): CommunityPublicMediaAsset {
    return {
      id: asset.id,
      url: asset.url,
      thumbnailUrl: asset.thumbnailUrl ?? undefined
    };
  }

  private mediaAssetToPublicOwner(asset: CommunityMediaAssetRecord): CommunityMediaAsset {
    return {
      ...this.mediaAssetToPublic(asset),
      ownerUserId: asset.ownerUserId,
      usage: "post_image",
      status: mediaAssetStatus(asset.status),
      contentSecurityStatus: imageAuditStatus(asset.contentSecurityStatus),
      contentSecurityTraceIdDigest: asset.contentSecurityTraceIdDigest ?? undefined,
      postId: asset.postId ?? undefined,
      createdAt: asset.createdAt.toISOString()
    };
  }

  private notificationToPublic(notification: CommunityNotificationRecord): CommunityNotification {
    return {
      id: notification.id,
      recipientUserId: notification.recipientUserId,
      actor: notification.actorSnapshot
        ? normalizeAuthorSnapshot(notification.actorSnapshot)
        : undefined,
      type: Object.values(CommunityNotificationType).includes(
        notification.type as CommunityNotificationType
      )
        ? (notification.type as CommunityNotificationType)
        : CommunityNotificationType.ReportHandled,
      targetType:
        notification.targetType === "comment" ||
        notification.targetType === "reply" ||
        notification.targetType === "report"
          ? notification.targetType
          : "post",
      targetId: notification.targetId,
      postId: notification.postId ?? undefined,
      postTitle: undefined,
      title: notification.title,
      body: notification.body,
      createdAt: notification.createdAt.toISOString(),
      readAt: notification.readAt?.toISOString()
    };
  }

  private async reportToReviewItem(
    report: CommunityReportRecord
  ): Promise<CommunityReportReviewItem> {
    const targetSnapshot = normalizeReportTargetSnapshot(report.targetSnapshot);
    const caseSummary = await this.buildReportCaseSummary(report);
    return {
      id: report.id,
      targetType: reportTargetType(report.targetType),
      targetId: report.postId ?? report.commentId ?? report.replyId ?? "",
      reason: report.reason,
      reasonCode: reportReasonCode(report.reasonCode),
      reasonText: report.reasonText ?? undefined,
      status: reportStatus(report.status),
      targetKey: report.targetKey,
      priority: reportPriority(report.priority),
      targetSummary: targetSnapshot
        ? summarizeReportTarget(targetSnapshot)
        : caseSummary.targetSummary,
      targetSnapshot,
      reportCount: caseSummary.reportCount,
      reasonDistribution: caseSummary.reasonDistribution,
      firstReportedAt: caseSummary.firstReportedAt,
      latestReportedAt: caseSummary.latestReportedAt,
      handledAction: reportHandleAction(report.handledAction),
      effectiveForAuthorRisk: report.effectiveForAuthorRisk,
      createdAt: report.createdAt.toISOString(),
      handledAt: report.handledAt?.toISOString(),
      handlerId: report.handledBy ?? undefined,
      handleNote: report.handleNote ?? undefined
    };
  }

  private async setPostRelation(
    type: "like" | "favorite",
    userId: string,
    postId: string,
    enabled: boolean
  ): Promise<void> {
    const key = `${postId}:${userId}`;

    if (!this.isDatabaseConfigured()) {
      const store = type === "like" ? this.memoryLikes : this.memoryFavorites;
      if (enabled) {
        store.add(key);
      } else {
        store.delete(key);
      }
      if (enabled) {
        await this.createInteractionNotification(type, userId, postId);
      }
      return;
    }

    const delegate = type === "like" ? this.communityPostLike : this.communityPostFavorite;
    if (enabled) {
      await delegate.upsert({
        where: { postId_userId: { postId, userId } },
        create: { postId, userId },
        update: {}
      });
      await this.createInteractionNotification(type, userId, postId);
    } else {
      await delegate.deleteMany({ where: { postId, userId } });
    }
  }

  private async interactionResponse(
    postId: string,
    userId: string
  ): Promise<CommunityInteractionResponse> {
    return {
      postId,
      viewerInteraction: await this.getViewerInteraction(postId, userId),
      stats: await this.getStats(postId)
    };
  }

  private async getViewerInteraction(
    postId: string,
    userId: string
  ): Promise<{ liked: boolean; favorited: boolean }> {
    if (!this.isDatabaseConfigured()) {
      return {
        liked: this.memoryLikes.has(`${postId}:${userId}`),
        favorited: this.memoryFavorites.has(`${postId}:${userId}`)
      };
    }

    const [liked, favorited] = await Promise.all([
      this.communityPostLike.findUnique({ where: { postId_userId: { postId, userId } } }),
      this.communityPostFavorite.findUnique({ where: { postId_userId: { postId, userId } } })
    ]);
    return { liked: Boolean(liked), favorited: Boolean(favorited) };
  }

  private async getStats(postId: string): Promise<CommunityInteractionStats> {
    if (!this.isDatabaseConfigured()) {
      return {
        likeCount: countSetPrefix(this.memoryLikes, `${postId}:`),
        commentCount: [...this.memoryComments.values()].filter(
          (comment) =>
            comment.postId === postId && comment.status === CommunityCommentStatus.Approved
        ).length,
        favoriteCount: countSetPrefix(this.memoryFavorites, `${postId}:`)
      };
    }

    const [likeCount, commentCount, favoriteCount] = await Promise.all([
      this.communityPostLike.count({ where: { postId } }),
      this.communityComment.count({ where: { postId, status: CommunityCommentStatus.Approved } }),
      this.communityPostFavorite.count({ where: { postId } })
    ]);
    return { likeCount, commentCount, favoriteCount };
  }

  private async findLikeUserIds(postId: string): Promise<string[]> {
    if (!this.isDatabaseConfigured()) {
      const prefix = `${postId}:`;
      return [...this.memoryLikes]
        .filter((item) => item.startsWith(prefix))
        .map((item) => item.slice(prefix.length));
    }

    const records = (await this.communityPostLike.findMany({ where: { postId } })) as Array<{
      userId: string;
    }>;
    return records.map((record) => record.userId);
  }

  private async findAuthorSnapshotForUser(userId: string): Promise<CommunityAuthorSnapshot | null> {
    const response = await this.userGrowthProfileService.getProfile(userId);
    return response.profile ? createCommunityAuthorSnapshot(response.profile) : null;
  }

  async handleWechatMediaSecurityCallback(
    payload: Record<string, unknown>
  ): Promise<{ accepted: true }> {
    const traceId = getWechatCallbackTraceId(payload);
    if (!traceId) {
      return { accepted: true };
    }

    const summary = mapWechatContentSecurityResult({
      suggest: getWechatCallbackSuggest(payload),
      label: getWechatCallbackLabel(payload),
      traceId,
      checkedAt: new Date().toISOString(),
      source: ContentSecuritySource.WechatImage
    });
    const imageSummary = {
      ...summary,
      imageAuditStatus:
        summary.decision === ContentSecurityDecision.Approved
          ? ContentSecurityImageAuditStatus.Approved
          : summary.decision === ContentSecurityDecision.Rejected
            ? ContentSecurityImageAuditStatus.Rejected
            : ContentSecurityImageAuditStatus.ManualReview
    };
    const asset = await this.findMediaAssetByTraceDigest(digestTraceId(traceId));
    if (!asset) {
      return { accepted: true };
    }

    await this.updateMediaAssetSecuritySummary(asset.id, imageSummary);
    if (asset.postId) {
      await this.mergePostImageSecuritySummary(asset.postId, imageSummary);
      await this.tryResolvePostVisibilityFromImages(asset.postId);
    }

    return { accepted: true };
  }

  private async resolvePostImageSecurityAfterCreate(
    userId: string,
    postId: string,
    assetIds: readonly string[],
    textModeration: TextModerationOutcome
  ): Promise<void> {
    if (assetIds.length === 0 || textModeration.decision === AiModerationDecision.Rejected) {
      return;
    }

    const assets = (await this.findMediaAssetsForPost(postId, { includeBound: true })).filter(
      (asset) => assetIds.includes(asset.id)
    );
    const summaries = [];

    for (const asset of assets) {
      const imageResult = this.aiContentModerationService
        ? await this.aiContentModerationService.submitImageContentSecurity({
            userId,
            mediaUrl: resolveCommunityMediaAuditUrl(asset.url),
            mediaType: "image"
          })
        : createMissingImageProviderResult();
      const summary =
        imageResult.contentSecuritySummary ??
        createContentSecuritySummary({
          source: ContentSecuritySource.WechatImage,
          decision: ContentSecurityDecision.NeedsManualReview,
          riskTags: [ContentSecurityRiskTag.ProviderFailure],
          reason: imageResult.reason,
          manualReviewReason: ContentSecurityManualReviewReason.ProviderUnavailable,
          imageAuditStatus: ContentSecurityImageAuditStatus.ManualReview
        });
      await this.updateMediaAssetSecuritySummary(asset.id, summary);
      summaries.push(summary);
    }

    if (summaries.length === 0) {
      return;
    }

    const post = await this.findPost(postId);
    const trace = normalizeModerationTrace(post?.moderation);
    await this.updatePostModerationTrace(postId, {
      ...trace,
      contentSecurityImageSummaries: summaries
    });
    await this.tryResolvePostVisibilityFromImages(postId);
  }

  private async tryResolvePostVisibilityFromImages(postId: string): Promise<void> {
    const post = await this.findPost(postId);
    if (!post || post.status !== CommunityPostStatus.Pending) {
      return;
    }

    const trace = normalizeModerationTrace(post.moderation);
    const textDecision =
      trace?.contentSecuritySummary?.decision ??
      (trace?.aiModerationResult?.decision === AiModerationDecision.Approved
        ? ContentSecurityDecision.Approved
        : trace?.aiModerationResult?.decision === AiModerationDecision.Rejected
          ? ContentSecurityDecision.Rejected
          : undefined);
    const assets = await this.findMediaAssetsForPost(postId, { includeBound: true });
    const imageStatuses = assets.map((asset) => imageAuditStatus(asset.contentSecurityStatus));

    if (
      textDecision === ContentSecurityDecision.Rejected ||
      imageStatuses.includes(ContentSecurityImageAuditStatus.Rejected)
    ) {
      await this.updatePostStatus(postId, CommunityPostStatus.Rejected, "图片内容安全未通过");
      return;
    }

    if (
      textDecision === ContentSecurityDecision.Approved &&
      imageStatuses.length > 0 &&
      imageStatuses.every((status) => status === ContentSecurityImageAuditStatus.Approved)
    ) {
      await this.updatePostStatus(postId, CommunityPostStatus.Approved, "文本和图片内容安全已通过");
      await this.bindMediaAssetsToPost(post.authorUserId, [], postId, CommunityPostStatus.Approved);
    }
  }

  private async mergePostImageSecuritySummary(
    postId: string,
    summary: NonNullable<AiContentModerationTrace["contentSecuritySummary"]>
  ): Promise<void> {
    const post = await this.findPost(postId);
    const trace = normalizeModerationTrace(post?.moderation);
    const existing = trace?.contentSecurityImageSummaries ?? [];
    const nextSummaries = [
      ...existing.filter((item) => item.traceIdDigest !== summary.traceIdDigest),
      summary
    ];
    await this.updatePostModerationTrace(postId, {
      ...trace,
      contentSecurityImageSummaries: nextSummaries
    });
  }

  private async updatePostModerationTrace(
    postId: string,
    trace: AiContentModerationTrace
  ): Promise<void> {
    if (!this.isDatabaseConfigured()) {
      const post = this.memoryPosts.get(postId);
      if (post) {
        this.memoryPosts.set(postId, { ...post, moderation: trace, updatedAt: new Date() });
      }
      return;
    }

    await this.communityPost.update({
      where: { id: postId },
      data: { moderation: trace }
    });
  }

  private async findMediaAssetByTraceDigest(
    traceIdDigest: string
  ): Promise<CommunityMediaAssetRecord | null> {
    const memoryAsset =
      [...this.memoryMediaAssets.values()].find(
        (asset) => asset.contentSecurityTraceIdDigest === traceIdDigest
      ) ?? null;
    if (!this.isDatabaseConfigured() || !this.hasCommunityMediaAssetDelegate()) {
      return memoryAsset;
    }

    const records = await this.communityMediaAsset.findMany({
      where: { contentSecurityTraceIdDigest: traceIdDigest },
      take: 1
    });
    return records[0] ?? memoryAsset;
  }

  private async updateMediaAssetSecuritySummary(
    assetId: string,
    summary: NonNullable<AiContentModerationTrace["contentSecuritySummary"]>
  ): Promise<void> {
    const nextStatus =
      summary.imageAuditStatus === ContentSecurityImageAuditStatus.Approved
        ? CommunityMediaAssetStatus.Approved
        : summary.imageAuditStatus === ContentSecurityImageAuditStatus.Rejected
          ? CommunityMediaAssetStatus.Hidden
          : CommunityMediaAssetStatus.Bound;
    const checkedAt = new Date(summary.normalizedAt);
    const data = {
      status: nextStatus,
      contentSecurityStatus:
        summary.imageAuditStatus ?? ContentSecurityImageAuditStatus.ManualReview,
      contentSecurityTraceIdDigest: summary.traceIdDigest ?? null,
      contentSecurityTraceIdMasked: summary.traceIdDigest ?? null,
      contentSecuritySummary: summary,
      contentSecurityCheckedAt: Number.isNaN(checkedAt.getTime()) ? new Date() : checkedAt,
      updatedAt: new Date()
    };

    const memoryAsset = this.memoryMediaAssets.get(assetId);
    if (memoryAsset) {
      this.memoryMediaAssets.set(assetId, { ...memoryAsset, ...data });
    }

    if (!this.isDatabaseConfigured() || !this.hasCommunityMediaAssetDelegate()) {
      return;
    }

    await this.communityMediaAsset.updateMany({
      where: { id: assetId },
      data
    });
  }

  private bindMemoryMediaAssets(
    userId: string,
    assetIds: readonly string[],
    postId: string,
    postStatus: string
  ): void {
    const nextStatus =
      postStatus === CommunityPostStatus.Approved
        ? CommunityMediaAssetStatus.Approved
        : CommunityMediaAssetStatus.Bound;
    const assets =
      assetIds.length > 0
        ? assetIds.map((assetId) => this.memoryMediaAssets.get(assetId)).filter(Boolean)
        : [...this.memoryMediaAssets.values()].filter((asset) => asset.postId === postId);

    for (const asset of assets) {
      if (!asset || asset.ownerUserId !== userId || (asset.postId && asset.postId !== postId)) {
        throw new BadRequestException({
          errorCode: CommunityLiteErrorCode.MediaAssetNotFound,
          message: "图片资产不存在或不属于当前用户"
        });
      }
      this.memoryMediaAssets.set(asset.id, {
        ...asset,
        postId,
        status: nextStatus,
        updatedAt: new Date()
      });
    }
  }

  private async bindMediaAssetsToPost(
    userId: string,
    assetIds: readonly string[],
    postId: string,
    postStatus: string
  ): Promise<void> {
    const nextStatus =
      postStatus === CommunityPostStatus.Approved
        ? CommunityMediaAssetStatus.Approved
        : CommunityMediaAssetStatus.Bound;

    const hasMemoryAsset =
      assetIds.length > 0
        ? assetIds.some((assetId) => this.memoryMediaAssets.has(assetId))
        : [...this.memoryMediaAssets.values()].some((asset) => asset.postId === postId);

    if (hasMemoryAsset) {
      this.bindMemoryMediaAssets(userId, assetIds, postId, postStatus);
    }

    if (!this.isDatabaseConfigured() || !this.hasCommunityMediaAssetDelegate()) {
      return;
    }

    const where =
      assetIds.length > 0
        ? { id: { in: [...assetIds] }, ownerUserId: userId, postId: null }
        : { ownerUserId: userId, postId };
    try {
      await this.communityMediaAsset.updateMany({
        where,
        data: { postId, status: nextStatus }
      });
    } catch (error) {
      this.logger.warn(
        `社区图片资产绑定失败，已保留开发期内存绑定：${normalizeErrorMessage(error)}`
      );
    }
  }

  private async updatePostStatus(
    postId: string,
    status: CommunityPostStatus,
    reviewNote: string
  ): Promise<CommunityPostRecord> {
    const approvedAt = status === CommunityPostStatus.Approved ? new Date() : null;
    if (!this.isDatabaseConfigured()) {
      const post = this.memoryPosts.get(postId);
      if (!post) {
        throwPostNotFound();
      }
      const updated = { ...post, status, approvedAt, reviewNote, updatedAt: new Date() };
      this.memoryPosts.set(postId, updated);
      return updated;
    }

    return this.communityPost.update({
      where: { id: postId },
      data: { status, approvedAt, reviewNote }
    });
  }

  private async updateCommentStatus(
    commentId: string,
    status: CommunityCommentStatus,
    reviewNote: string
  ): Promise<CommunityCommentRecord> {
    const approvedAt = status === CommunityCommentStatus.Approved ? new Date() : null;
    if (!this.isDatabaseConfigured()) {
      const comment = this.memoryComments.get(commentId);
      if (!comment) {
        throwCommentNotFound();
      }
      const updated = { ...comment, status, approvedAt, reviewNote, updatedAt: new Date() };
      this.memoryComments.set(commentId, updated);
      return updated;
    }

    return this.communityComment.update({
      where: { id: commentId },
      data: { status, approvedAt, reviewNote }
    });
  }

  private async updateReplyStatus(
    replyId: string,
    status: CommunityCommentStatus,
    reviewNote: string
  ): Promise<CommunityReplyRecord> {
    const approvedAt = status === CommunityCommentStatus.Approved ? new Date() : null;
    if (!this.isDatabaseConfigured()) {
      const reply = this.memoryReplies.get(replyId);
      if (!reply) {
        throwReplyNotFound();
      }
      const updated = { ...reply, status, approvedAt, reviewNote, updatedAt: new Date() };
      this.memoryReplies.set(replyId, updated);
      return updated;
    }

    return this.communityReply.update({
      where: { id: replyId },
      data: { status, approvedAt, reviewNote }
    });
  }

  private async assertCommunityWriteAllowed(userId: string): Promise<AdminCommunityUserGovernance> {
    const governance = await this.getUserGovernance(userId);
    if (governance.status === CommunityUserGovernanceStatus.Muted) {
      throw new ForbiddenException({
        errorCode: CommunityLiteErrorCode.UserMuted,
        message: "你已被禁言，暂时不能发布社区内容"
      });
    }
    if (governance.status === CommunityUserGovernanceStatus.Banned) {
      throw new ForbiddenException({
        errorCode: CommunityLiteErrorCode.UserBanned,
        message: "你已被社区封禁，暂时不能发布社区内容"
      });
    }
    return governance;
  }

  private async recordGovernanceAudit(input: {
    targetType: AdminCommunityGovernanceTargetType;
    targetId: string;
    targetAuthorUserId?: string;
    action: AdminCommunityGovernanceAction;
    oldStatus?: string;
    newStatus?: string;
    reason: string;
    note?: string;
    operatorId: string;
  }): Promise<void> {
    const now = new Date();
    const record: CommunityGovernanceAuditRecord = {
      id: `community-governance-audit-${this.memoryGovernanceAudits.size + 1}`,
      targetType: input.targetType,
      targetId: input.targetId,
      targetAuthorUserId: input.targetAuthorUserId ?? null,
      action: input.action,
      oldStatus: input.oldStatus ?? null,
      newStatus: input.newStatus ?? null,
      reason: input.reason,
      note: input.note ?? null,
      operatorId: input.operatorId,
      createdAt: now
    };
    this.memoryGovernanceAudits.set(record.id, record);

    if (!this.isDatabaseConfigured() || !this.hasCommunityGovernanceAuditDelegate()) {
      return;
    }

    await this.communityGovernanceAudit.create({
      data: {
        targetType: record.targetType,
        targetId: record.targetId,
        targetAuthorUserId: record.targetAuthorUserId,
        action: record.action,
        oldStatus: record.oldStatus,
        newStatus: record.newStatus,
        reason: record.reason,
        note: record.note,
        operatorId: record.operatorId
      }
    });
  }

  private async createInteractionNotification(
    type: "like" | "favorite",
    actorUserId: string,
    postId: string
  ): Promise<void> {
    const post = await this.findPost(postId);
    if (!post || post.authorUserId === actorUserId) {
      return;
    }

    const actor = await this.findAuthorSnapshotForUser(actorUserId);
    await this.createNotification({
      recipientUserId: post.authorUserId,
      actorUserId,
      actorSnapshot: actor,
      type: type === "like" ? CommunityNotificationType.Like : CommunityNotificationType.Favorite,
      targetType: "post",
      targetId: postId,
      postId,
      title: type === "like" ? "帖子收到点赞" : "帖子被收藏",
      body: `${actor?.displayName ?? "有隐者"}${type === "like" ? "赞了" : "收藏了"}你的帖子《${post.title}》`
    });
  }

  private async createCommentNotifications(
    post: CommunityPostRecord,
    comment: CommunityCommentRecord,
    moderationReason: string
  ): Promise<void> {
    if (
      comment.status === CommunityCommentStatus.Approved &&
      post.authorUserId !== comment.authorUserId
    ) {
      await this.createNotification({
        recipientUserId: post.authorUserId,
        actorUserId: comment.authorUserId,
        actorSnapshot: normalizeAuthorSnapshot(comment.authorSnapshot),
        type: CommunityNotificationType.Comment,
        targetType: "comment",
        targetId: comment.id,
        postId: post.id,
        commentId: comment.id,
        title: "帖子收到评论",
        body: comment.body
      });
    }

    if (comment.status === CommunityCommentStatus.Rejected) {
      await this.createNotification({
        recipientUserId: comment.authorUserId,
        type: CommunityNotificationType.CommentReviewRejected,
        targetType: "comment",
        targetId: comment.id,
        postId: post.id,
        commentId: comment.id,
        title: "评论未通过审核",
        body: moderationReason
      });
    }
  }

  private async createReplyNotifications(
    comment: CommunityCommentRecord,
    reply: CommunityReplyRecord,
    moderationReason: string
  ): Promise<void> {
    if (
      reply.status === CommunityCommentStatus.Approved &&
      comment.authorUserId !== reply.authorUserId
    ) {
      await this.createNotification({
        recipientUserId: comment.authorUserId,
        actorUserId: reply.authorUserId,
        actorSnapshot: normalizeAuthorSnapshot(reply.authorSnapshot),
        type: CommunityNotificationType.Reply,
        targetType: "reply",
        targetId: reply.id,
        postId: reply.postId,
        commentId: reply.commentId,
        replyId: reply.id,
        title: "评论收到回复",
        body: reply.body
      });
    }

    if (reply.status === CommunityCommentStatus.Rejected) {
      await this.createNotification({
        recipientUserId: reply.authorUserId,
        type: CommunityNotificationType.ReplyReviewRejected,
        targetType: "reply",
        targetId: reply.id,
        postId: reply.postId,
        commentId: reply.commentId,
        replyId: reply.id,
        title: "回复未通过审核",
        body: moderationReason
      });
    }
  }

  private async createReviewNotificationForPost(
    post: CommunityPostRecord,
    reviewNote?: string
  ): Promise<void> {
    if (
      post.status !== CommunityPostStatus.Approved &&
      post.status !== CommunityPostStatus.Rejected
    ) {
      return;
    }
    await this.createNotification({
      recipientUserId: post.authorUserId,
      type:
        post.status === CommunityPostStatus.Approved
          ? CommunityNotificationType.PostReviewApproved
          : CommunityNotificationType.PostReviewRejected,
      targetType: "post",
      targetId: post.id,
      postId: post.id,
      title: post.status === CommunityPostStatus.Approved ? "帖子已通过审核" : "帖子未通过审核",
      body:
        reviewNote ||
        (post.status === CommunityPostStatus.Approved ? "你的帖子已公开" : "帖子暂未公开")
    });
  }

  private async createReviewNotificationForComment(
    comment: CommunityCommentRecord,
    reviewNote?: string
  ): Promise<void> {
    if (
      comment.status !== CommunityCommentStatus.Approved &&
      comment.status !== CommunityCommentStatus.Rejected
    ) {
      return;
    }
    await this.createNotification({
      recipientUserId: comment.authorUserId,
      type:
        comment.status === CommunityCommentStatus.Approved
          ? CommunityNotificationType.CommentReviewApproved
          : CommunityNotificationType.CommentReviewRejected,
      targetType: "comment",
      targetId: comment.id,
      postId: comment.postId,
      commentId: comment.id,
      title:
        comment.status === CommunityCommentStatus.Approved ? "评论已通过审核" : "评论未通过审核",
      body:
        reviewNote ||
        (comment.status === CommunityCommentStatus.Approved ? "你的评论已公开" : "评论暂未公开")
    });
  }

  private async createReviewNotificationForReply(
    reply: CommunityReplyRecord,
    reviewNote?: string
  ): Promise<void> {
    if (
      reply.status !== CommunityCommentStatus.Approved &&
      reply.status !== CommunityCommentStatus.Rejected
    ) {
      return;
    }
    await this.createNotification({
      recipientUserId: reply.authorUserId,
      type:
        reply.status === CommunityCommentStatus.Approved
          ? CommunityNotificationType.ReplyReviewApproved
          : CommunityNotificationType.ReplyReviewRejected,
      targetType: "reply",
      targetId: reply.id,
      postId: reply.postId,
      commentId: reply.commentId,
      replyId: reply.id,
      title: reply.status === CommunityCommentStatus.Approved ? "回复已通过审核" : "回复未通过审核",
      body:
        reviewNote ||
        (reply.status === CommunityCommentStatus.Approved ? "你的回复已公开" : "回复暂未公开")
    });
  }

  private async createNotification(input: {
    recipientUserId: string;
    actorUserId?: string;
    actorSnapshot?: CommunityAuthorSnapshot | null;
    type: string;
    targetType: "post" | "comment" | "reply" | "report";
    targetId: string;
    postId?: string;
    commentId?: string;
    replyId?: string;
    title: string;
    body: string;
  }): Promise<void> {
    const now = new Date();
    const record: CommunityNotificationRecord = {
      id: `community-notification-${this.memoryNotifications.size + 1}`,
      recipientUserId: input.recipientUserId,
      actorUserId: input.actorUserId ?? null,
      type: input.type,
      targetType: input.targetType,
      targetId: input.targetId,
      postId: input.postId ?? null,
      commentId: input.commentId ?? null,
      replyId: input.replyId ?? null,
      title: input.title,
      body: input.body,
      actorSnapshot: input.actorSnapshot ?? null,
      readAt: null,
      createdAt: now
    };

    if (!this.isDatabaseConfigured()) {
      this.memoryNotifications.set(record.id, record);
      return;
    }

    await this.communityNotification.create({
      data: {
        recipientUserId: record.recipientUserId,
        actorUserId: record.actorUserId,
        type: record.type,
        targetType: record.targetType,
        targetId: record.targetId,
        postId: record.postId,
        commentId: record.commentId,
        replyId: record.replyId,
        title: record.title,
        body: record.body,
        actorSnapshot: record.actorSnapshot
      }
    });
  }

  private async applyReportedTargetAction(
    report: CommunityReportRecord,
    action: CommunityReportHandleAction,
    operatorId: string,
    handleNote?: string
  ): Promise<void> {
    const reason =
      action === CommunityReportHandleAction.Remove ? "举报处理后移除" : "举报处理后隐藏";
    if (report.targetType === CommunityReportTargetType.Post && report.postId) {
      await this.governPost(
        report.postId,
        {
          action:
            action === CommunityReportHandleAction.Remove
              ? AdminCommunityGovernanceAction.RemovePost
              : AdminCommunityGovernanceAction.HidePost,
          reason,
          note: handleNote
        },
        operatorId
      );
      await this.createReportedContentNotification(report, action);
      return;
    }
    if (report.targetType === CommunityReportTargetType.Comment && report.commentId) {
      await this.governComment(
        report.commentId,
        {
          action:
            action === CommunityReportHandleAction.Remove
              ? AdminCommunityGovernanceAction.RemoveComment
              : AdminCommunityGovernanceAction.HideComment,
          reason,
          note: handleNote
        },
        operatorId
      );
      await this.createReportedContentNotification(report, action);
      return;
    }
    if (report.targetType === CommunityReportTargetType.Reply && report.replyId) {
      await this.governReply(
        report.replyId,
        {
          action:
            action === CommunityReportHandleAction.Remove
              ? AdminCommunityGovernanceAction.RemoveReply
              : AdminCommunityGovernanceAction.HideReply,
          reason,
          note: handleNote
        },
        operatorId
      );
      await this.createReportedContentNotification(report, action);
    }
  }

  private async createReportHandledNotification(
    report: CommunityReportRecord,
    action: CommunityReportHandleAction
  ): Promise<void> {
    const handled =
      action === CommunityReportHandleAction.Hide || action === CommunityReportHandleAction.Remove;
    await this.createNotification({
      recipientUserId: report.reporterUserId,
      type: CommunityNotificationType.ReportHandled,
      targetType: "report",
      targetId: report.id,
      postId: this.reportSnapshotPostId(report) ?? report.postId ?? undefined,
      title: "举报已处理",
      body: handled
        ? "你提交的举报已由运营复核，相关内容已完成处理。"
        : "你提交的举报已由运营复核，暂未发现需要处理的内容。"
    });
  }

  private async createReportedContentNotification(
    report: CommunityReportRecord,
    action: CommunityReportHandleAction
  ): Promise<void> {
    const target = await this.resolveReportRecordTarget(report);
    if (!target) {
      return;
    }

    await this.createNotification({
      recipientUserId: target.authorUserId,
      type: CommunityNotificationType.ReportHandled,
      targetType: target.targetType,
      targetId: target.targetId,
      postId: target.postId,
      commentId: target.commentId,
      replyId: target.replyId,
      title: "内容已处理",
      body:
        action === CommunityReportHandleAction.Remove
          ? "你的内容经举报复核后已移除，请留意社区规则。"
          : "你的内容经举报复核后已隐藏，请留意社区规则。"
    });
  }

  private async resolveReportRecordTarget(report: CommunityReportRecord): Promise<{
    targetType: "post" | "comment" | "reply";
    targetId: string;
    postId?: string;
    commentId?: string;
    replyId?: string;
    authorUserId: string;
  } | null> {
    if (report.targetType === CommunityReportTargetType.Post && report.postId) {
      const post = await this.findPost(report.postId);
      return post
        ? {
            targetType: "post",
            targetId: post.id,
            postId: post.id,
            authorUserId: post.authorUserId
          }
        : null;
    }
    if (report.targetType === CommunityReportTargetType.Comment && report.commentId) {
      const comment = await this.findComment(report.commentId);
      return comment
        ? {
            targetType: "comment",
            targetId: comment.id,
            postId: comment.postId,
            commentId: comment.id,
            authorUserId: comment.authorUserId
          }
        : null;
    }
    if (report.targetType === CommunityReportTargetType.Reply && report.replyId) {
      const reply = await this.findReply(report.replyId);
      return reply
        ? {
            targetType: "reply",
            targetId: reply.id,
            postId: reply.postId,
            commentId: reply.commentId,
            replyId: reply.id,
            authorUserId: reply.authorUserId
          }
        : null;
    }
    return null;
  }

  private isDatabaseConfigured(): boolean {
    if (typeof this.prisma.isDatabaseConfigured !== "function") {
      return true;
    }

    return this.prisma.isDatabaseConfigured();
  }

  private hasCommunityMediaAssetDelegate(): boolean {
    return Boolean(
      (this.prisma as unknown as { communityMediaAsset?: CommunityMediaAssetDelegate })
        .communityMediaAsset
    );
  }

  private hasCommunityUserGovernanceDelegate(): boolean {
    return Boolean(
      (this.prisma as unknown as { communityUserGovernance?: CommunityUserGovernanceDelegate })
        .communityUserGovernance
    );
  }

  private hasCommunityGovernanceAuditDelegate(): boolean {
    return Boolean(
      (this.prisma as unknown as { communityGovernanceAudit?: CommunityGovernanceAuditDelegate })
        .communityGovernanceAudit
    );
  }

  private hasCommunityFollowDelegate(): boolean {
    return Boolean(
      (this.prisma as unknown as { communityFollow?: CommunityFollowDelegate }).communityFollow
    );
  }

  private hasAppUserComplianceDelegate(): boolean {
    return Boolean((this.prisma as unknown as { appUser?: AppUserComplianceDelegate }).appUser);
  }

  private get appUser(): AppUserComplianceDelegate {
    return (this.prisma as unknown as { appUser: AppUserComplianceDelegate }).appUser;
  }

  private get communityPost(): CommunityPostDelegate {
    return (this.prisma as unknown as { communityPost: CommunityPostDelegate }).communityPost;
  }

  private get communityComment(): CommunityCommentDelegate {
    return (this.prisma as unknown as { communityComment: CommunityCommentDelegate })
      .communityComment;
  }

  private get communityPostLike(): CommunityRelationDelegate {
    return (this.prisma as unknown as { communityPostLike: CommunityRelationDelegate })
      .communityPostLike;
  }

  private get communityPostFavorite(): CommunityRelationDelegate {
    return (this.prisma as unknown as { communityPostFavorite: CommunityRelationDelegate })
      .communityPostFavorite;
  }

  private get communityFollow(): CommunityFollowDelegate {
    return (this.prisma as unknown as { communityFollow: CommunityFollowDelegate }).communityFollow;
  }

  private get communityReport(): CommunityReportDelegate {
    return (this.prisma as unknown as { communityReport: CommunityReportDelegate }).communityReport;
  }

  private get communityReply(): CommunityReplyDelegate {
    return (this.prisma as unknown as { communityReply: CommunityReplyDelegate }).communityReply;
  }

  private get communityMediaAsset(): CommunityMediaAssetDelegate {
    return (this.prisma as unknown as { communityMediaAsset: CommunityMediaAssetDelegate })
      .communityMediaAsset;
  }

  private get communityNotification(): CommunityNotificationDelegate {
    return (this.prisma as unknown as { communityNotification: CommunityNotificationDelegate })
      .communityNotification;
  }

  private get communityUserGovernance(): CommunityUserGovernanceDelegate {
    return (this.prisma as unknown as { communityUserGovernance: CommunityUserGovernanceDelegate })
      .communityUserGovernance;
  }

  private get communityGovernanceAudit(): CommunityGovernanceAuditDelegate {
    return (
      this.prisma as unknown as { communityGovernanceAudit: CommunityGovernanceAuditDelegate }
    ).communityGovernanceAudit;
  }
}

function createPostResponse(
  postId: string,
  status: CommunityPostStatus,
  moderationReason: string
): CreateCommunityPostResponse {
  return {
    postId,
    status:
      status === CommunityPostStatus.Approved || status === CommunityPostStatus.Rejected
        ? status
        : CommunityPostStatus.Pending,
    message: createModerationMessage(status, "帖子", moderationReason)
  };
}

function createCommentResponse(
  commentId: string,
  status: CommunityCommentStatus,
  moderationReason: string,
  reviewDecision?: CommentReviewDecisionSummary
): CreateCommunityCommentResponse {
  return {
    commentId,
    status:
      status === CommunityCommentStatus.Approved || status === CommunityCommentStatus.Rejected
        ? status
        : CommunityCommentStatus.Pending,
    message: createModerationMessage(status, "评论", moderationReason),
    reviewDecision: reviewDecision?.decision
  };
}

function createReplyResponse(
  replyId: string,
  status: CommunityCommentStatus,
  moderationReason: string,
  reviewDecision?: CommentReviewDecisionSummary
): CreateCommunityReplyResponse {
  return {
    replyId,
    status:
      status === CommunityCommentStatus.Approved || status === CommunityCommentStatus.Rejected
        ? status
        : CommunityCommentStatus.Pending,
    message: createModerationMessage(status, "回复", moderationReason),
    reviewDecision: reviewDecision?.decision
  };
}

function followKey(followerUserId: string, followingUserId: string): string {
  return `${followerUserId}:${followingUserId}`;
}

function parseCursorDate(cursor?: string): Date | undefined {
  if (!cursor) {
    return undefined;
  }

  const date = new Date(cursor);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function createModerationMessage(status: string, noun: string, moderationReason: string): string {
  if (status === CommunityPostStatus.Approved || status === CommunityCommentStatus.Approved) {
    return `${noun}已公开`;
  }
  if (status === CommunityPostStatus.Rejected || status === CommunityCommentStatus.Rejected) {
    return moderationReason;
  }
  return `${noun}审核中，仅自己可见，通过后其他隐者可见`;
}

function commentReviewDecisionToStatus(
  decision: CommentReviewDecision,
  fallbackDecision: LowCostModerationDecision | AiModerationDecision
): CommunityCommentStatus {
  if (decision === CommentReviewDecision.AutoApprove) {
    return CommunityCommentStatus.Approved;
  }
  if (decision === CommentReviewDecision.AutoReject) {
    return CommunityCommentStatus.Rejected;
  }
  if (
    fallbackDecision === LowCostModerationDecision.Reject ||
    fallbackDecision === AiModerationDecision.Rejected
  ) {
    return CommunityCommentStatus.Rejected;
  }
  return CommunityCommentStatus.Pending;
}

function createTextModerationTrace(
  localModeration?: LowCostContentModerationResult,
  providerModeration?: AiContentModerationResult
): AiContentModerationTrace {
  return {
    lowCostModerationResult: localModeration,
    aiModerationResult: providerModeration,
    aiModerationReason: providerModeration?.reason ?? localModeration?.reason,
    manualReviewReason:
      providerModeration?.manualReviewReason ??
      (localModeration?.decision === LowCostModerationDecision.Review
        ? AiModerationManualReviewReason.GreyArea
        : undefined),
    contentSecuritySummary:
      providerModeration?.contentSecuritySummary ??
      (localModeration ? localModerationToContentSecuritySummary(localModeration) : undefined)
  };
}

function createDiscussionModerationTrace(
  moderation: LowCostContentModerationResult | AiContentModerationResult,
  reviewDecision: CommentReviewDecisionSummary,
  providerModeration?: AiContentModerationResult
): AiContentModerationTrace {
  if (isLowCostModerationResult(moderation)) {
    return {
      lowCostModerationResult: moderation,
      aiModerationResult: providerModeration,
      aiModerationReason: moderation.reason,
      commentReviewDecision: reviewDecision,
      manualReviewReason:
        providerModeration?.manualReviewReason ??
        (reviewDecision.decision === CommentReviewDecision.ManualReview
          ? AiModerationManualReviewReason.GreyArea
          : undefined),
      contentSecuritySummary:
        providerModeration?.contentSecuritySummary ??
        localModerationToContentSecuritySummary(moderation)
    };
  }

  return {
    aiModerationResult: moderation,
    aiModerationReason: moderation.reason,
    manualReviewReason: moderation.manualReviewReason,
    commentReviewDecision: reviewDecision,
    contentSecuritySummary: moderation.contentSecuritySummary
  };
}

function localModerationToContentSecuritySummary(moderation: LowCostContentModerationResult) {
  return createContentSecuritySummary({
    source: ContentSecuritySource.LocalRules,
    decision:
      moderation.decision === LowCostModerationDecision.Pass
        ? ContentSecurityDecision.Approved
        : moderation.decision === LowCostModerationDecision.Reject
          ? ContentSecurityDecision.Rejected
          : ContentSecurityDecision.NeedsManualReview,
    riskTags: moderation.riskTags.map(lowCostRiskTagToContentSecurityRiskTag),
    reason: moderation.reason,
    suggestion: moderation.suggestion,
    manualReviewReason:
      moderation.decision === LowCostModerationDecision.Review
        ? ContentSecurityManualReviewReason.GreyArea
        : undefined,
    normalizedAt: moderation.moderatedAt
  });
}

function lowCostRiskTagToContentSecurityRiskTag(
  tag: LowCostModerationRiskTag
): ContentSecurityRiskTag {
  const mapping: Partial<Record<LowCostModerationRiskTag, ContentSecurityRiskTag>> = {
    [LowCostModerationRiskTag.Safe]: ContentSecurityRiskTag.Safe,
    [LowCostModerationRiskTag.Politics]: ContentSecurityRiskTag.Politics,
    [LowCostModerationRiskTag.Pornography]: ContentSecurityRiskTag.Pornography,
    [LowCostModerationRiskTag.Illegal]: ContentSecurityRiskTag.Illegal,
    [LowCostModerationRiskTag.Abuse]: ContentSecurityRiskTag.Abuse,
    [LowCostModerationRiskTag.PersonalAttack]: ContentSecurityRiskTag.PersonalAttack,
    [LowCostModerationRiskTag.PrivacyLeak]: ContentSecurityRiskTag.PrivacyLeak,
    [LowCostModerationRiskTag.Advertisement]: ContentSecurityRiskTag.Advertisement,
    [LowCostModerationRiskTag.Spam]: ContentSecurityRiskTag.Spam,
    [LowCostModerationRiskTag.Violence]: ContentSecurityRiskTag.Violence,
    [LowCostModerationRiskTag.Ambiguous]: ContentSecurityRiskTag.Ambiguous,
    [LowCostModerationRiskTag.FrequencyLimit]: ContentSecurityRiskTag.Spam,
    [LowCostModerationRiskTag.DuplicateContent]: ContentSecurityRiskTag.Spam,
    [LowCostModerationRiskTag.UserRisk]: ContentSecurityRiskTag.Ambiguous
  };
  return mapping[tag] ?? ContentSecurityRiskTag.Ambiguous;
}

function postTextModerationToStatus(
  outcome: TextModerationOutcome,
  options: { hasPendingImages: boolean; limited: boolean }
): CommunityPostStatus {
  if (outcome.decision === AiModerationDecision.Rejected) {
    return CommunityPostStatus.Rejected;
  }

  if (
    outcome.decision === AiModerationDecision.Approved &&
    !options.hasPendingImages &&
    !options.limited
  ) {
    return CommunityPostStatus.Approved;
  }

  return CommunityPostStatus.Pending;
}

function createLegacyDiscussionReviewDecision(
  moderation: AiContentModerationResult
): CommentReviewDecisionSummary {
  const decision =
    moderation.decision === AiModerationDecision.Approved
      ? CommentReviewDecision.AutoApprove
      : moderation.decision === AiModerationDecision.Rejected
        ? CommentReviewDecision.AutoReject
        : CommentReviewDecision.ManualReview;
  const riskTags = moderation.riskTags as unknown as LowCostModerationRiskTag[];
  return {
    decision,
    reason: moderation.reason,
    riskTags,
    hitFields: [],
    userRiskReasons:
      decision === CommentReviewDecision.ManualReview ? [CommentReviewUserRiskReason.TextRisk] : [],
    fastPass: {
      eligible: decision === CommentReviewDecision.AutoApprove,
      approvedDiscussionCount: 0,
      requiredApprovedDiscussionCount: 0,
      shortText: true,
      maxLength: 120,
      userRiskReasons: []
    },
    suggestion:
      decision === CommentReviewDecision.AutoApprove
        ? "无需人工处理，后续可通过举报治理。"
        : decision === CommentReviewDecision.AutoReject
          ? "已自动驳回，公开侧不可见。"
          : "建议人工查看上下文后决定通过或驳回。",
    decidedAt: moderation.moderatedAt
  };
}

function getCommentReviewDecisionFromModeration(
  moderation: unknown,
  status?: string
): CommentReviewDecision | undefined {
  const trace = normalizeModerationTrace(moderation);
  if (trace?.commentReviewDecision?.decision) {
    return trace.commentReviewDecision.decision;
  }
  if (status === CommunityCommentStatus.Approved) {
    return CommentReviewDecision.AutoApprove;
  }
  if (status === CommunityCommentStatus.Rejected) {
    return CommentReviewDecision.AutoReject;
  }
  if (status === CommunityCommentStatus.Pending) {
    return CommentReviewDecision.ManualReview;
  }
  return undefined;
}

function reportResponse(
  reportId: string,
  options: { status?: CommunityReportStatus; alreadyReported?: true } = {}
): CreateCommunityReportResponse {
  return {
    reportId,
    accepted: true,
    status: options.status ?? CommunityReportStatus.Pending,
    alreadyReported: options.alreadyReported,
    message: options.alreadyReported ? "你已经举报过该内容" : "举报已提交，等待人工处理"
  };
}

function reviewActionToPostStatus(action: ReviewAction): string {
  if (action === "approve") {
    return CommunityPostStatus.Approved;
  }
  if (action === "hide") {
    return CommunityPostStatus.Hidden;
  }
  return CommunityPostStatus.Rejected;
}

function reviewActionToCommentStatus(action: ReviewAction): string {
  if (action === "approve") {
    return CommunityCommentStatus.Approved;
  }
  if (action === "hide") {
    return CommunityCommentStatus.Hidden;
  }
  return CommunityCommentStatus.Rejected;
}

function governanceActionToPostStatus(action: AdminCommunityGovernanceAction): CommunityPostStatus {
  if (action === AdminCommunityGovernanceAction.HidePost) {
    return CommunityPostStatus.Hidden;
  }
  if (action === AdminCommunityGovernanceAction.RemovePost) {
    return CommunityPostStatus.Removed;
  }
  throw new BadRequestException({
    errorCode: "admin_community_governance_invalid_action",
    message: "不支持的帖子治理操作"
  });
}

function governanceActionToCommentStatus(
  action: AdminCommunityGovernanceAction
): CommunityCommentStatus {
  if (
    action === AdminCommunityGovernanceAction.HideComment ||
    action === AdminCommunityGovernanceAction.HideReply
  ) {
    return CommunityCommentStatus.Hidden;
  }
  if (
    action === AdminCommunityGovernanceAction.RemoveComment ||
    action === AdminCommunityGovernanceAction.RemoveReply
  ) {
    return CommunityCommentStatus.Removed;
  }
  throw new BadRequestException({
    errorCode: "admin_community_governance_invalid_action",
    message: "不支持的评论或回复治理操作"
  });
}

function governanceStatusToAction(
  status: CommunityUserGovernanceStatus
): AdminCommunityGovernanceAction {
  if (status === CommunityUserGovernanceStatus.Limited) {
    return AdminCommunityGovernanceAction.LimitUser;
  }
  if (status === CommunityUserGovernanceStatus.Muted) {
    return AdminCommunityGovernanceAction.MuteUser;
  }
  return AdminCommunityGovernanceAction.BanUser;
}

function normalizeUserGovernanceRecord(
  userId: string,
  record: CommunityUserGovernanceRecord | null
): AdminCommunityUserGovernance {
  if (!record || record.clearedAt) {
    return { userId, status: CommunityUserGovernanceStatus.Normal };
  }

  if (record.expiresAt && record.expiresAt.getTime() <= Date.now()) {
    return {
      userId,
      status: CommunityUserGovernanceStatus.Normal,
      reason: record.reason,
      note: record.note ?? undefined,
      startsAt: record.startsAt.toISOString(),
      expiresAt: record.expiresAt.toISOString(),
      operatorId: record.operatorId
    };
  }

  const status = Object.values(CommunityUserGovernanceStatus).includes(
    record.status as CommunityUserGovernanceStatus
  )
    ? (record.status as CommunityUserGovernanceStatus)
    : CommunityUserGovernanceStatus.Normal;

  return {
    userId,
    status,
    reason: record.reason,
    note: record.note ?? undefined,
    startsAt: record.startsAt.toISOString(),
    expiresAt: record.expiresAt?.toISOString(),
    operatorId: record.operatorId,
    clearedBy: record.clearedBy ?? undefined,
    clearReason: record.clearReason ?? undefined
  };
}

function auditToPublic(record: CommunityGovernanceAuditRecord): AdminCommunityGovernanceAudit {
  return {
    id: record.id,
    targetType: record.targetType as AdminCommunityGovernanceTargetType,
    targetId: record.targetId,
    targetAuthorUserId: record.targetAuthorUserId ?? undefined,
    action: record.action as AdminCommunityGovernanceAction,
    oldStatus: record.oldStatus ?? undefined,
    newStatus: record.newStatus ?? undefined,
    reason: record.reason,
    note: record.note ?? undefined,
    operatorId: record.operatorId,
    createdAt: record.createdAt.toISOString()
  };
}

function createGovernanceRiskSummary(
  moderation: unknown,
  reviewNote?: string | null
): AdminCommunityGovernanceRiskSummary | undefined {
  const trace = normalizeModerationTrace(moderation, reviewNote);
  const lowCost = trace?.lowCostModerationResult;
  const ai = trace?.aiModerationResult;
  const contentSecurity = trace?.contentSecuritySummary;
  const firstImage = trace?.contentSecurityImageSummaries?.[0];
  if (!trace && !lowCost && !ai && !contentSecurity && !firstImage) {
    return undefined;
  }

  return {
    riskTags: contentSecurity?.riskTags ?? lowCost?.riskTags ?? ai?.riskTags ?? [],
    lowCostRiskTags: lowCost?.riskTags,
    lowCostRiskLevel: lowCost?.riskLevel,
    contentSecuritySource: contentSecurity?.source ?? firstImage?.source,
    contentSecurityRiskTags: contentSecurity?.riskTags,
    contentSecurityDecision: contentSecurity?.decision,
    imageAuditStatus: firstImage?.imageAuditStatus,
    traceIdDigest: firstImage?.traceIdDigest ?? contentSecurity?.traceIdDigest,
    hitTerms: lowCost?.hits.map((hit) => hit.term),
    hitFields: lowCost ? [...new Set(lowCost.hits.map((hit) => hit.field))] : undefined,
    reason: contentSecurity?.reason ?? lowCost?.reason ?? trace?.aiModerationReason ?? ai?.reason,
    suggestion: contentSecurity?.suggestion ?? lowCost?.suggestion,
    confidence: ai?.confidence,
    manualReviewReason: contentSecurity?.manualReviewReason ?? trace?.manualReviewReason
  };
}

function normalizeSearchKeyword(keyword: unknown): string | undefined {
  if (keyword === undefined || keyword === null || String(keyword).trim() === "") {
    return undefined;
  }

  const normalized = String(keyword).trim();
  if (normalized.length < 2 || normalized.length > 80) {
    throw new BadRequestException({
      errorCode: "admin_community_governance_invalid_keyword",
      message: "搜索关键词长度需在 2-80 个字符之间"
    });
  }
  return normalized.toLowerCase();
}

function matchesGovernanceKeyword(post: CommunityPostRecord, keyword?: string): boolean {
  if (!keyword) {
    return true;
  }
  const author = normalizeAuthorSnapshot(post.authorSnapshot);
  return (
    post.id.toLowerCase() === keyword ||
    post.authorUserId.toLowerCase() === keyword ||
    post.title.toLowerCase().includes(keyword) ||
    post.body.toLowerCase().includes(keyword) ||
    author.displayName.toLowerCase().includes(keyword)
  );
}

function matchesGovernanceRisk(
  post: CommunityPostRecord,
  riskTag?: string,
  lowCostRiskLevel?: string
): boolean {
  const summary = createGovernanceRiskSummary(post.moderation, post.reviewNote);
  if (riskTag && !summary?.riskTags.includes(riskTag)) {
    return false;
  }
  if (lowCostRiskLevel && summary?.lowCostRiskLevel !== lowCostRiskLevel) {
    return false;
  }
  return true;
}

function normalizePositiveInteger(
  value: unknown,
  min: number,
  max: number,
  fallback: number
): number {
  const numberValue = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(numberValue) || numberValue < min || numberValue > max) {
    throw new BadRequestException({
      errorCode: "admin_community_governance_invalid_pagination",
      message: `分页参数需在 ${min}-${max} 之间`
    });
  }
  return numberValue;
}

function normalizeAuthorSnapshot(value: unknown): CommunityAuthorSnapshot {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const faction = isUserFaction(String(record.faction))
    ? (record.faction as UserFaction)
    : CommunitySectionKey.Wanderer;

  return {
    displayName: typeof record.displayName === "string" ? record.displayName : "匿名隐者",
    avatarKey: typeof record.avatarKey === "string" ? record.avatarKey : "avatar_wanderer_default",
    faction,
    factionLabel: typeof record.factionLabel === "string" ? record.factionLabel : "行影隐者",
    level: Number.isInteger(record.level) ? (record.level as number) : 1,
    titleKey: typeof record.titleKey === "string" ? record.titleKey : "newcomer_hidden_one",
    equippedBadgeKey:
      typeof record.equippedBadgeKey === "string" ? record.equippedBadgeKey : undefined,
    publicProfileId: isCommunityPublicProfileId(record.publicProfileId)
      ? record.publicProfileId
      : undefined
  };
}

function normalizeSectionKey(value: string) {
  return Object.values(CommunitySectionKey).includes(value as CommunitySectionKey)
    ? (value as CommunitySectionKey)
    : CommunitySectionKey.Recommended;
}

function normalizePostStatus(value: string): CommunityPostStatus {
  return Object.values(CommunityPostStatus).includes(value as CommunityPostStatus)
    ? (value as CommunityPostStatus)
    : CommunityPostStatus.Hidden;
}

function normalizeCommentStatus(value: string): CommunityCommentStatus {
  return Object.values(CommunityCommentStatus).includes(value as CommunityCommentStatus)
    ? (value as CommunityCommentStatus)
    : CommunityCommentStatus.Hidden;
}

function normalizeStringArray(value: unknown): readonly string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function normalizeDailyContentQuote(value: unknown): DailyContentQuoteSnapshot | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const sectionKey = String(record.sectionKey);
  if (
    typeof record.issueId !== "string" ||
    typeof record.itemId !== "string" ||
    !isDailyContentSectionKey(sectionKey) ||
    typeof record.sectionLabel !== "string" ||
    typeof record.title !== "string" ||
    typeof record.summary !== "string"
  ) {
    return undefined;
  }

  return {
    sourceType:
      record.sourceType === "daily_reflection" ||
      record.sourceType === "daily_article" ||
      record.sourceType === "world_intel_article"
        ? record.sourceType
        : undefined,
    issueId: record.issueId,
    itemId: record.itemId,
    articleId: typeof record.articleId === "string" ? record.articleId : undefined,
    sectionKey,
    sectionLabel: record.sectionLabel,
    title: record.title,
    summary: record.summary,
    businessDate: typeof record.businessDate === "string" ? record.businessDate : undefined,
    reflectionText: typeof record.reflectionText === "string" ? record.reflectionText : undefined,
    quotePrompt: typeof record.quotePrompt === "string" ? record.quotePrompt : undefined
  };
}

function normalizeModerationTrace(
  value: unknown,
  reviewNote?: string | null
): AiContentModerationTrace | undefined {
  const result = value && typeof value === "object" ? value : undefined;
  if (result && isLowCostModerationResult(result)) {
    return {
      lowCostModerationResult: result,
      aiModerationReason: result.reason
    };
  }

  if (result && "lowCostModerationResult" in result) {
    const trace = result as AiContentModerationTrace;
    return {
      lowCostModerationResult:
        trace.lowCostModerationResult && isLowCostModerationResult(trace.lowCostModerationResult)
          ? trace.lowCostModerationResult
          : undefined,
      aiModerationResult: trace.aiModerationResult,
      aiModerationReason: trace.aiModerationReason,
      manualReviewReason: trace.manualReviewReason,
      commentReviewDecision: trace.commentReviewDecision,
      contentSecuritySummary: trace.contentSecuritySummary,
      contentSecurityImageSummaries: trace.contentSecurityImageSummaries
    };
  }

  return result
    ? {
        aiModerationResult: result as AiContentModerationResult,
        aiModerationReason:
          typeof (result as { reason?: unknown }).reason === "string"
            ? (result as { reason: string }).reason
            : (reviewNote ?? undefined),
        manualReviewReason:
          typeof (result as { manualReviewReason?: unknown }).manualReviewReason === "string"
            ? ((result as { manualReviewReason: string })
                .manualReviewReason as AiModerationManualReviewReason)
            : undefined
      }
    : undefined;
}

function isLowCostModerationResult(value: object): value is LowCostContentModerationResult {
  return (
    "decision" in value &&
    ((value as { decision?: unknown }).decision === LowCostModerationDecision.Pass ||
      (value as { decision?: unknown }).decision === LowCostModerationDecision.Review ||
      (value as { decision?: unknown }).decision === LowCostModerationDecision.Reject) &&
    (value as { source?: unknown }).source === "local_rules"
  );
}

function normalizePrivacyConsentScene(
  scene: CommunityPrivacyConsentScene | undefined
): CommunityPrivacyConsentScene {
  return scene && (Object.values(CommunityPrivacyConsentScene) as string[]).includes(scene)
    ? scene
    : CommunityPrivacyConsentScene.CommunityPublish;
}

function createAppUserComplianceSelect(): Record<string, boolean> {
  return {
    id: true,
    privacyPolicyVersion: true,
    communityAgreementVersion: true,
    privacyConsentAcceptedAt: true,
    privacyConsentScene: true,
    phoneVerified: true,
    phoneVerifiedAt: true,
    phoneVerificationSource: true
  };
}

function createEmptyComplianceRecord(userId: string): AppUserComplianceRecord {
  return {
    id: userId,
    privacyPolicyVersion: null,
    communityAgreementVersion: null,
    privacyConsentAcceptedAt: null,
    privacyConsentScene: null,
    phoneVerified: false,
    phoneVerifiedAt: null,
    phoneVerificationSource: null
  };
}

function createPublishEligibilityMessage(
  nextAction: CommunityPublishNextAction,
  governanceReason?: string
): string {
  if (nextAction === CommunityPublishNextAction.CreateProfile) {
    return "请先创建隐者档案";
  }
  if (nextAction === CommunityPublishNextAction.AcceptPrivacy) {
    return "请先同意当前隐私政策和社区用户协议";
  }
  if (nextAction === CommunityPublishNextAction.VerifyPhone) {
    return "发帖、评论和回复前需要完成微信手机号验证";
  }
  if (nextAction === CommunityPublishNextAction.BlockedByGovernance) {
    return governanceReason || "当前账号存在社区治理限制，暂时不能发布";
  }
  return "可以发布社区内容";
}

function createUnknownIpLocationSnapshot(
  now: Date,
  failureReason: string
): CommunityIpLocationSnapshot {
  return {
    ipLocationLabel: "未知",
    ipLocationCountryOrRegion: undefined,
    ipLocationProvince: undefined,
    ipLocationSource: "server_request",
    ipLocationStatus: CommunityIpLocationResolveStatus.Unknown,
    ipLocationResolvedAt: now,
    ipLocationFailureReason: failureReason
  };
}

function ipLocationToRecordFields(snapshot: CommunityIpLocationSnapshot): Record<string, unknown> {
  return {
    ipLocationLabel: snapshot.ipLocationLabel,
    ipLocationCountryOrRegion: snapshot.ipLocationCountryOrRegion ?? null,
    ipLocationProvince: snapshot.ipLocationProvince ?? null,
    ipLocationSource: snapshot.ipLocationSource,
    ipLocationStatus: snapshot.ipLocationStatus,
    ipLocationResolvedAt: snapshot.ipLocationResolvedAt ?? null,
    ipLocationFailureReason: snapshot.ipLocationFailureReason ?? null
  };
}

function ipLocationToAdminSummary(
  record: Partial<CommunityPostRecord | CommunityCommentRecord | CommunityReplyRecord>
): CommunityIpLocationAdminSummary | undefined {
  if (!record.ipLocationLabel && !record.ipLocationStatus) {
    return undefined;
  }

  return {
    ipLocationLabel: record.ipLocationLabel ?? "未知",
    countryOrRegion: record.ipLocationCountryOrRegion ?? undefined,
    province: record.ipLocationProvince ?? undefined,
    source: record.ipLocationSource ?? "server_request",
    status: normalizeIpLocationStatus(record.ipLocationStatus),
    resolvedAt: record.ipLocationResolvedAt?.toISOString(),
    failureReason: record.ipLocationFailureReason ?? undefined
  };
}

function normalizeIpLocationStatus(
  value: string | CommunityIpLocationResolveStatus | null | undefined
): CommunityIpLocationResolveStatus {
  return Object.values(CommunityIpLocationResolveStatus).includes(
    value as CommunityIpLocationResolveStatus
  )
    ? (value as CommunityIpLocationResolveStatus)
    : CommunityIpLocationResolveStatus.Unknown;
}

function ipLocationRecordFromContent(
  record: CommunityPostRecord | CommunityCommentRecord | CommunityReplyRecord
): CommunityIpLocationPublicRecord {
  return {
    ipLocationLabel: record.ipLocationLabel ?? undefined,
    publishedAt: record.approvedAt ?? record.createdAt,
    hasIpLocationSnapshot: Boolean(record.ipLocationLabel || record.ipLocationStatus)
  };
}

function splitConfigList(value: string | undefined): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(/[,\s;]+/u)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeRequestHeaders(
  headers: Record<string, string | string[] | undefined> | undefined
): Record<string, string | string[] | undefined> {
  const normalized: Record<string, string | string[] | undefined> = {};
  for (const [key, value] of Object.entries(headers ?? {})) {
    normalized[key.toLowerCase()] = value;
  }
  return normalized;
}

function extractFirstValidPublicIp(value: string | string[] | undefined): string | undefined {
  const joined = Array.isArray(value) ? value.join(",") : value;
  if (!joined) {
    return undefined;
  }

  for (const item of joined.split(",")) {
    const normalized = normalizeIpAddress(item);
    if (normalized && !isPrivateOrLocalIp(normalized)) {
      return normalized;
    }
  }
  return undefined;
}

function normalizeIpAddress(value: string | undefined): string | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  let normalized = value.trim();
  const bracketed = normalized.match(/^\[([^\]]+)\](?::\d+)?$/u);
  if (bracketed) {
    normalized = bracketed[1];
  }
  if (normalized.startsWith("::ffff:")) {
    normalized = normalized.slice("::ffff:".length);
  }
  if (!isIP(normalized)) {
    const ipv4WithPort = normalized.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/u);
    normalized = ipv4WithPort ? ipv4WithPort[1] : normalized;
  }

  return isIP(normalized) ? normalized : undefined;
}

function isTrustedProxyIp(remoteIp: string, trustedProxyAddrs: readonly string[]): boolean {
  if (trustedProxyAddrs.length === 0) {
    return false;
  }
  return trustedProxyAddrs.some((trusted) => trusted === remoteIp);
}

function isPrivateOrLocalIp(ip: string): boolean {
  if (!isIP(ip)) {
    return true;
  }
  if (ip === "::1" || ip === "127.0.0.1" || ip === "0.0.0.0") {
    return true;
  }
  if (ip.includes(":")) {
    const lower = ip.toLowerCase();
    return (
      lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80") || lower === "::"
    );
  }

  const [first, second] = ip.split(".").map((part) => Number(part));
  return (
    first === 10 ||
    first === 127 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 169 && second === 254)
  );
}

function mediaAssetStatus(value: string): CommunityMediaAssetStatus {
  return Object.values(CommunityMediaAssetStatus).includes(value as CommunityMediaAssetStatus)
    ? (value as CommunityMediaAssetStatus)
    : CommunityMediaAssetStatus.Hidden;
}

function imageAuditStatus(value: unknown): ContentSecurityImageAuditStatus {
  return Object.values(ContentSecurityImageAuditStatus).includes(
    value as ContentSecurityImageAuditStatus
  )
    ? (value as ContentSecurityImageAuditStatus)
    : ContentSecurityImageAuditStatus.NotRequired;
}

function getWechatCallbackTraceId(payload: Record<string, unknown>): string | undefined {
  const traceId = payload.trace_id ?? payload.traceId;
  return typeof traceId === "string" && traceId.trim() ? traceId.trim() : undefined;
}

function getWechatCallbackSuggest(payload: Record<string, unknown>): string | undefined {
  const result = payload.result;
  if (result && typeof result === "object") {
    const suggest = (result as { suggest?: unknown }).suggest;
    return typeof suggest === "string" ? suggest : undefined;
  }
  return typeof payload.suggest === "string" ? payload.suggest : undefined;
}

function getWechatCallbackLabel(payload: Record<string, unknown>): string | number | undefined {
  const result = payload.result;
  if (result && typeof result === "object") {
    const label = (result as { label?: unknown }).label;
    return typeof label === "string" || typeof label === "number" ? label : undefined;
  }
  return typeof payload.label === "string" || typeof payload.label === "number"
    ? payload.label
    : undefined;
}

function createMissingImageProviderResult(): AiContentModerationResult {
  const now = new Date().toISOString();
  return {
    decision: AiModerationDecision.NeedsManualReview,
    source: "manual_fallback" as const,
    confidence: 0,
    riskTags: ["provider_failure" as const],
    reason: "微信图片内容安全服务未注册，已转入人工复核。",
    manualReviewReason: "provider_unavailable" as const,
    moderatedAt: now,
    contentSecuritySummary: createContentSecuritySummary({
      source: ContentSecuritySource.WechatImage,
      decision: ContentSecurityDecision.NeedsManualReview,
      riskTags: [ContentSecurityRiskTag.ProviderFailure],
      reason: "微信图片内容安全服务未注册，已转入人工复核。",
      manualReviewReason: ContentSecurityManualReviewReason.ProviderUnavailable,
      imageAuditStatus: ContentSecurityImageAuditStatus.ManualReview,
      normalizedAt: now
    })
  };
}

function parseCommunityImageDataUrl(
  dataUrl: unknown,
  providedMimeType?: string
): { mimeType: string; buffer: Buffer } {
  if (typeof dataUrl !== "string") {
    throw new BadRequestException({
      errorCode: "community_media_invalid",
      message: "图片上传数据无效"
    });
  }

  const matched = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([a-zA-Z0-9+/_=\s-]+)$/);
  if (!matched) {
    throw new BadRequestException({
      errorCode: "community_media_invalid",
      message: "图片上传数据必须是 base64 data URL"
    });
  }

  return {
    mimeType: providedMimeType || matched[1],
    buffer: Buffer.from(
      matched[2].replace(/\s/g, "").replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    )
  };
}

function getCommunityMediaUploadDir(): string {
  const cwd = process.cwd();
  return cwd.endsWith(`${join("apps", "api")}`)
    ? resolve(cwd, "uploads", "community")
    : resolve(cwd, "apps", "api", "uploads", "community");
}

function normalizeOptionalUrl(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function resolveCommunityMediaAuditUrl(url: string): string {
  if (/^https?:\/\//iu.test(url)) {
    return url;
  }

  if (url.startsWith("/community/media-assets/files/")) {
    const publicOrigin = resolveConfiguredPublicOrigin(
      process.env.WECHAT_CONTENT_SECURITY_MEDIA_PUBLIC_BASE_URL ||
        process.env.API_PUBLIC_BASE_URL ||
        process.env.VITE_API_BASE_URL ||
        process.env.COMMUNITY_MEDIA_PUBLIC_BASE_URL
    );
    return publicOrigin ? `${publicOrigin}${url}` : url;
  }

  return url;
}

function resolveConfiguredPublicOrigin(value: string | undefined): string | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  try {
    const parsed = new URL(value.trim());
    return parsed.origin;
  } catch {
    return undefined;
  }
}

function reportStatus(value: string): CommunityReportStatus {
  return Object.values(CommunityReportStatus).includes(value as CommunityReportStatus)
    ? (value as CommunityReportStatus)
    : CommunityReportStatus.Pending;
}

function reportReasonCode(value: string): CommunityReportReasonCode {
  return Object.values(CommunityReportReasonCode).includes(value as CommunityReportReasonCode)
    ? (value as CommunityReportReasonCode)
    : CommunityReportReasonCode.Other;
}

function reportPriority(value: string): CommunityReportPriority {
  return Object.values(CommunityReportPriority).includes(value as CommunityReportPriority)
    ? (value as CommunityReportPriority)
    : CommunityReportPriority.Normal;
}

function reportHandleAction(value: string | null): CommunityReportHandleAction | undefined {
  return value &&
    Object.values(CommunityReportHandleAction).includes(value as CommunityReportHandleAction)
    ? (value as CommunityReportHandleAction)
    : undefined;
}

function reportTargetType(value: string): CommunityReportTargetType {
  return Object.values(CommunityReportTargetType).includes(value as CommunityReportTargetType)
    ? (value as CommunityReportTargetType)
    : CommunityReportTargetType.Post;
}

function buildReportTargetKey(targetType: CommunityReportTargetType, targetId: string): string {
  return `${targetType}:${targetId}`;
}

function sortReportsForReview(reports: CommunityReportRecord[]): CommunityReportRecord[] {
  return reports.sort((first, second) => {
    const firstPriority = reportPriority(first.priority) === CommunityReportPriority.High ? 1 : 0;
    const secondPriority = reportPriority(second.priority) === CommunityReportPriority.High ? 1 : 0;
    if (firstPriority !== secondPriority) {
      return secondPriority - firstPriority;
    }
    return second.createdAt.getTime() - first.createdAt.getTime();
  });
}

function normalizeReportTargetSnapshot(value: unknown): CommunityReportTargetSnapshot | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const snapshot = value as Partial<CommunityReportTargetSnapshot>;
  if (
    !snapshot.targetId ||
    typeof snapshot.targetId !== "string" ||
    !snapshot.body ||
    typeof snapshot.body !== "string" ||
    !snapshot.author ||
    typeof snapshot.author !== "object" ||
    !snapshot.createdAt ||
    typeof snapshot.createdAt !== "string"
  ) {
    return undefined;
  }

  return {
    targetType: reportTargetType(String(snapshot.targetType)),
    targetId: snapshot.targetId,
    postId: typeof snapshot.postId === "string" ? snapshot.postId : undefined,
    commentId: typeof snapshot.commentId === "string" ? snapshot.commentId : undefined,
    replyId: typeof snapshot.replyId === "string" ? snapshot.replyId : undefined,
    title: typeof snapshot.title === "string" ? snapshot.title : undefined,
    body: snapshot.body,
    status: typeof snapshot.status === "string" ? snapshot.status : "unknown",
    author: normalizeAuthorSnapshot(snapshot.author),
    authorUserId: typeof snapshot.authorUserId === "string" ? snapshot.authorUserId : undefined,
    createdAt: snapshot.createdAt
  };
}

function summarizeReportTarget(snapshot: CommunityReportTargetSnapshot): string {
  const prefix = snapshot.title ? `${snapshot.title}：` : "";
  return truncateText(`${prefix}${snapshot.body}`, COMMUNITY_REPORT_TARGET_SUMMARY_LENGTH);
}

function truncateText(value: string, maxLength: number): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length <= maxLength ? normalized : `${normalized.slice(0, maxLength)}...`;
}

function createExcerpt(body: string): string {
  return body.length > 80 ? `${body.slice(0, 80)}...` : body;
}

function sortPosts(sort?: string) {
  return (first: CommunityPostRecord, second: CommunityPostRecord) => {
    if (sort === CommunityPostSort.Hot) {
      return second.createdAt.getTime() - first.createdAt.getTime();
    }

    return (
      (second.approvedAt ?? second.createdAt).getTime() -
      (first.approvedAt ?? first.createdAt).getTime()
    );
  };
}

function countSetPrefix(set: Set<string>, prefix: string): number {
  let count = 0;
  for (const value of set) {
    if (value.startsWith(prefix)) {
      count += 1;
    }
  }
  return count;
}

function normalizeErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function startOfLocalDay(now: Date): Date {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return start;
}

function throwPostNotFound(): never {
  throw new NotFoundException({
    errorCode: CommunityLiteErrorCode.PostNotFound,
    message: "帖子不存在"
  });
}

function assertReviewActionAllowed(status: string, action: ReviewAction): void {
  const isPending =
    status === CommunityPostStatus.Pending || status === CommunityCommentStatus.Pending;
  const canHidePublished =
    action === "hide" &&
    (status === CommunityPostStatus.Approved || status === CommunityCommentStatus.Approved);

  if (!isPending && !canHidePublished) {
    throw new ConflictException({
      errorCode: "community_review_state_changed",
      message: "审核状态已变化，请刷新后再处理"
    });
  }
}

function throwCommentNotFound(): never {
  throw new NotFoundException({
    errorCode: CommunityLiteErrorCode.CommentNotFound,
    message: "评论不存在"
  });
}

function throwReplyNotFound(): never {
  throw new NotFoundException({
    errorCode: CommunityLiteErrorCode.ReplyNotFound,
    message: "回复不存在"
  });
}
