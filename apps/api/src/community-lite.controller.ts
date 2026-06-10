import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
  Res
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  CommunityLiteValidationError,
  AdminOperationsRealtimeTargetType,
  AdminOperationsSource,
  CommunityReportHandleAction,
  CommunityReportTargetType,
  type AcceptCommunityPrivacyConsentRequest,
  type AdminCommunityGovernanceActionRequest,
  type AdminCommunityPostSearchRequest,
  type AdminCommunityUserGovernanceRequest,
  type AdminCommunityClearUserGovernanceRequest,
  type CreateCommunityCommentRequest,
  type CreateCommunityPostRequest,
  type CreateCommunityReportRequest,
  type CreateCommunityReplyRequest,
  type ListCommunityPublicUsersRequest,
  type ListCommunityPostsRequest,
  type VerifyWechatPhoneNumberRequest
} from "@moyuxia/shared";
import { AdminOperationsService } from "./admin-operations.service";
import { CommunityLiteService } from "./community-lite.service";
import { CurrentUserContextService } from "./current-user.context";

interface RequestLike {
  headers: Record<string, string | string[] | undefined> & {
    authorization?: string;
  };
  socket?: {
    remoteAddress?: string;
  };
  ip?: string;
}

@Controller("admin/community-governance")
export class AdminCommunityGovernanceController {
  constructor(
    private readonly communityLiteService: CommunityLiteService,
    private readonly configService: ConfigService,
    private readonly adminOperationsService: AdminOperationsService
  ) {}

  @Get("posts")
  listPosts(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Query() query: AdminCommunityPostSearchRequest
  ) {
    this.assertAdmin(adminToken);
    return this.communityLiteService.listGovernancePosts(normalizeGovernancePostQuery(query));
  }

  @Get("posts/:postId")
  getPostDetail(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Param("postId") postId: string
  ) {
    this.assertAdmin(adminToken);
    return this.communityLiteService.getGovernancePostDetail(postId);
  }

  @Post("posts/:postId/actions")
  async governPost(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Param("postId") postId: string,
    @Body() body: AdminCommunityGovernanceActionRequest
  ) {
    this.assertAdmin(adminToken);
    await this.communityLiteService.governPost(postId, normalizeGovernanceAction(body));
    await this.adminOperationsService.publishReviewStateChanged(
      AdminOperationsSource.Community,
      AdminOperationsRealtimeTargetType.CommunityPost,
      postId
    );
    return { accepted: true };
  }

  @Post("comments/:commentId/actions")
  async governComment(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Param("commentId") commentId: string,
    @Body() body: AdminCommunityGovernanceActionRequest
  ) {
    this.assertAdmin(adminToken);
    await this.communityLiteService.governComment(commentId, normalizeGovernanceAction(body));
    await this.adminOperationsService.publishReviewStateChanged(
      AdminOperationsSource.Community,
      AdminOperationsRealtimeTargetType.CommunityComment,
      commentId
    );
    return { accepted: true };
  }

  @Post("replies/:replyId/actions")
  async governReply(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Param("replyId") replyId: string,
    @Body() body: AdminCommunityGovernanceActionRequest
  ) {
    this.assertAdmin(adminToken);
    await this.communityLiteService.governReply(replyId, normalizeGovernanceAction(body));
    await this.adminOperationsService.publishReviewStateChanged(
      AdminOperationsSource.Community,
      AdminOperationsRealtimeTargetType.CommunityReply,
      replyId
    );
    return { accepted: true };
  }

  @Get("users/:userId/governance")
  getUserGovernance(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Param("userId") userId: string
  ) {
    this.assertAdmin(adminToken);
    return this.communityLiteService.getUserGovernance(userId);
  }

  @Post("users/:userId/governance")
  async setUserGovernance(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Param("userId") userId: string,
    @Body() body: AdminCommunityUserGovernanceRequest
  ) {
    this.assertAdmin(adminToken);
    const response = await this.communityLiteService.setUserGovernance(
      userId,
      normalizeUserGovernance(body)
    );
    await this.adminOperationsService.publishWorkbenchCountsChanged(
      AdminOperationsSource.Community,
      AdminOperationsRealtimeTargetType.Workbench,
      userId
    );
    return response;
  }

  @Post("users/:userId/ban")
  async banUser(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Param("userId") userId: string,
    @Body() body: Omit<AdminCommunityUserGovernanceRequest, "status">
  ) {
    this.assertAdmin(adminToken);
    const response = await this.communityLiteService.setUserGovernance(userId, {
      ...body,
      status: "banned"
    });
    await this.adminOperationsService.publishWorkbenchCountsChanged(
      AdminOperationsSource.Community,
      AdminOperationsRealtimeTargetType.Workbench,
      userId
    );
    return response;
  }

  @Post("users/:userId/unban")
  async unbanUser(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Param("userId") userId: string,
    @Body() body: AdminCommunityClearUserGovernanceRequest
  ) {
    this.assertAdmin(adminToken);
    const response = await this.communityLiteService.clearUserGovernance(
      userId,
      normalizeClearGovernance(body)
    );
    await this.adminOperationsService.publishWorkbenchCountsChanged(
      AdminOperationsSource.Community,
      AdminOperationsRealtimeTargetType.Workbench,
      userId
    );
    return response;
  }

  private assertAdmin(adminToken?: string): void {
    const expectedToken =
      this.configService.get<string>("ADMIN_OPERATIONS_TOKEN") || "dev-admin-token";

    if (adminToken !== expectedToken) {
      throw new ForbiddenException({
        errorCode: "admin_unauthorized",
        message: "无权访问社区内容治理"
      });
    }
  }
}

interface ResponseLike {
  setHeader(name: string, value: string): void;
  send(body: Buffer): void;
}

type ListCommunityPostsQuery = Omit<ListCommunityPostsRequest, "limit"> & {
  limit?: string | number;
};

type ListCommunityPublicUsersQuery = Omit<ListCommunityPublicUsersRequest, "limit"> & {
  limit?: string | number;
};

@Controller("community")
export class CommunityLiteController {
  constructor(
    private readonly currentUserContext: CurrentUserContextService,
    private readonly communityLiteService: CommunityLiteService,
    private readonly adminOperationsService: AdminOperationsService,
    private readonly configService: ConfigService
  ) {}

  @Get("posts")
  listPosts(@Query() query: ListCommunityPostsQuery) {
    return this.wrapValidation(() =>
      this.communityLiteService.listPosts(normalizeListCommunityPostsQuery(query))
    );
  }

  @Get("me/posts")
  listMyPosts(@Req() request: RequestLike) {
    return this.communityLiteService.listMyPosts(
      this.currentUserContext.getCurrentUser(request).userId
    );
  }

  @Get("me/publish-eligibility")
  getPublishEligibility(@Req() request: RequestLike) {
    return this.communityLiteService.getPublishEligibility(
      this.currentUserContext.getCurrentUser(request).userId
    );
  }

  @Post("me/privacy-consent")
  acceptPrivacyConsent(
    @Req() request: RequestLike,
    @Body() body: AcceptCommunityPrivacyConsentRequest
  ) {
    return this.communityLiteService.acceptPrivacyConsent(
      this.currentUserContext.getCurrentUser(request).userId,
      body
    );
  }

  @Post("me/phone-verification")
  verifyWechatPhoneNumber(
    @Req() request: RequestLike,
    @Body() body: VerifyWechatPhoneNumberRequest
  ) {
    return this.communityLiteService.verifyWechatPhoneNumber(
      this.currentUserContext.getCurrentUser(request).userId,
      body
    );
  }

  @Get("me/messages")
  listMessages(@Req() request: RequestLike) {
    return this.communityLiteService.listMessages(
      this.currentUserContext.getCurrentUser(request).userId
    );
  }

  @Get("me/follow-stats")
  getMyFollowStats(@Req() request: RequestLike) {
    return this.communityLiteService.getMyFollowStats(
      this.currentUserContext.getCurrentUser(request).userId
    );
  }

  @Post("me/messages/:notificationId/read")
  markMessageRead(@Req() request: RequestLike, @Param("notificationId") notificationId: string) {
    return this.communityLiteService.markNotificationRead(
      this.currentUserContext.getCurrentUser(request).userId,
      notificationId
    );
  }

  @Post("me/messages/read-all")
  markAllMessagesRead(@Req() request: RequestLike) {
    return this.communityLiteService.markAllNotificationsRead(
      this.currentUserContext.getCurrentUser(request).userId
    );
  }

  @Post("media-assets")
  uploadMediaAsset(
    @Req() request: RequestLike,
    @Body()
    body: {
      fileUrl?: string;
      fileName?: string;
      mimeType?: string;
      fileSizeBytes?: number;
      thumbnailUrl?: string;
      dataUrl?: string;
      thumbnailDataUrl?: string;
    }
  ) {
    return this.communityLiteService.uploadMediaAsset(
      this.currentUserContext.getCurrentUser(request).userId,
      body
    );
  }

  @Get("media-assets/files/:assetId")
  async getMediaAssetFile(@Param("assetId") assetId: string, @Res() response: ResponseLike) {
    const asset = await this.communityLiteService.getUploadedMediaAsset(assetId);
    response.setHeader("Content-Type", asset.mimeType);
    response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    response.send(asset.buffer);
  }

  @Post("content-security/wechat/media-callback")
  handleWechatMediaSecurityCallback(
    @Headers("x-wechat-content-security-token") callbackToken: string | undefined,
    @Body() body: Record<string, unknown>
  ) {
    const expectedToken = this.configService.get<string>(
      "WECHAT_CONTENT_SECURITY_IMAGE_CALLBACK_TOKEN"
    );
    if (expectedToken && callbackToken !== expectedToken) {
      throw new ForbiddenException({
        errorCode: "wechat_content_security_callback_forbidden",
        message: "微信图片审核回调校验失败"
      });
    }
    return this.communityLiteService.handleWechatMediaSecurityCallback(body);
  }

  @Get("posts/:postId")
  getPost(@Req() request: RequestLike, @Param("postId") postId: string) {
    return this.wrapValidation(() =>
      this.communityLiteService.getPost(
        postId,
        this.currentUserContext.getCurrentUser(request).userId
      )
    );
  }

  @Get("profiles/:publicProfileId")
  getPublicProfilePage(
    @Req() request: RequestLike,
    @Param("publicProfileId") publicProfileId: string,
    @Query() query: ListCommunityPublicUsersQuery
  ) {
    return this.wrapValidation(() =>
      this.communityLiteService.getPublicProfilePage(
        publicProfileId,
        this.currentUserContext.getCurrentUser(request).userId,
        normalizeListCommunityPublicUsersQuery(query)
      )
    );
  }

  @Post("profiles/:publicProfileId/follow")
  followPublicProfile(
    @Req() request: RequestLike,
    @Param("publicProfileId") publicProfileId: string
  ) {
    return this.wrapValidation(() =>
      this.communityLiteService.followPublicProfile(
        publicProfileId,
        this.currentUserContext.getCurrentUser(request).userId
      )
    );
  }

  @Delete("profiles/:publicProfileId/follow")
  unfollowPublicProfile(
    @Req() request: RequestLike,
    @Param("publicProfileId") publicProfileId: string
  ) {
    return this.wrapValidation(() =>
      this.communityLiteService.unfollowPublicProfile(
        publicProfileId,
        this.currentUserContext.getCurrentUser(request).userId
      )
    );
  }

  @Get("profiles/:publicProfileId/following")
  listFollowing(
    @Req() request: RequestLike,
    @Param("publicProfileId") publicProfileId: string,
    @Query() query: ListCommunityPublicUsersQuery
  ) {
    return this.wrapValidation(() =>
      this.communityLiteService.listFollowing(
        publicProfileId,
        this.currentUserContext.getCurrentUser(request).userId,
        normalizeListCommunityPublicUsersQuery(query)
      )
    );
  }

  @Get("profiles/:publicProfileId/followers")
  listFollowers(
    @Req() request: RequestLike,
    @Param("publicProfileId") publicProfileId: string,
    @Query() query: ListCommunityPublicUsersQuery
  ) {
    return this.wrapValidation(() =>
      this.communityLiteService.listFollowers(
        publicProfileId,
        this.currentUserContext.getCurrentUser(request).userId,
        normalizeListCommunityPublicUsersQuery(query)
      )
    );
  }

  @Get("users/:userId/profile")
  getPublicUserProfile(@Param("userId") userId: string) {
    return this.communityLiteService.getPublicUserProfile(userId);
  }

  @Post("posts")
  createPost(@Req() request: RequestLike, @Body() body: CreateCommunityPostRequest) {
    return this.wrapValidation(async () => {
      const response = await this.communityLiteService.createPost(
        this.currentUserContext.getCurrentUser(request).userId,
        body,
        request
      );
      await this.adminOperationsService.publishReviewCreated(
        AdminOperationsSource.Community,
        AdminOperationsRealtimeTargetType.CommunityPost,
        (response as { postId?: string; id?: string }).postId ??
          (response as { postId?: string; id?: string }).id ??
          "community_post"
      );
      return response;
    });
  }

  @Post("posts/:postId/comments")
  createComment(
    @Req() request: RequestLike,
    @Param("postId") postId: string,
    @Body() body: CreateCommunityCommentRequest
  ) {
    return this.wrapValidation(async () => {
      const response = await this.communityLiteService.createComment(
        this.currentUserContext.getCurrentUser(request).userId,
        postId,
        body,
        request
      );
      await this.adminOperationsService.publishReviewCreated(
        AdminOperationsSource.Community,
        AdminOperationsRealtimeTargetType.CommunityComment,
        (response as { commentId?: string; id?: string }).commentId ??
          (response as { commentId?: string; id?: string }).id ??
          postId
      );
      return response;
    });
  }

  @Post("comments/:commentId/replies")
  createReply(
    @Req() request: RequestLike,
    @Param("commentId") commentId: string,
    @Body() body: CreateCommunityReplyRequest
  ) {
    return this.wrapValidation(async () => {
      const response = await this.communityLiteService.createReply(
        this.currentUserContext.getCurrentUser(request).userId,
        commentId,
        body,
        request
      );
      await this.adminOperationsService.publishReviewCreated(
        AdminOperationsSource.Community,
        AdminOperationsRealtimeTargetType.CommunityReply,
        (response as { replyId?: string; id?: string }).replyId ??
          (response as { replyId?: string; id?: string }).id ??
          commentId
      );
      return response;
    });
  }

  @Post("posts/:postId/like")
  likePost(@Req() request: RequestLike, @Param("postId") postId: string) {
    return this.communityLiteService.setPostLike(
      this.currentUserContext.getCurrentUser(request).userId,
      postId,
      true
    );
  }

  @Delete("posts/:postId/like")
  unlikePost(@Req() request: RequestLike, @Param("postId") postId: string) {
    return this.communityLiteService.setPostLike(
      this.currentUserContext.getCurrentUser(request).userId,
      postId,
      false
    );
  }

  @Post("posts/:postId/favorite")
  favoritePost(@Req() request: RequestLike, @Param("postId") postId: string) {
    return this.communityLiteService.setPostFavorite(
      this.currentUserContext.getCurrentUser(request).userId,
      postId,
      true
    );
  }

  @Delete("posts/:postId/favorite")
  unfavoritePost(@Req() request: RequestLike, @Param("postId") postId: string) {
    return this.communityLiteService.setPostFavorite(
      this.currentUserContext.getCurrentUser(request).userId,
      postId,
      false
    );
  }

  @Post("posts/:postId/reports")
  reportPost(
    @Req() request: RequestLike,
    @Param("postId") postId: string,
    @Body() body: Omit<CreateCommunityReportRequest, "targetType" | "targetId"> | string = {}
  ) {
    return this.wrapValidation(async () => {
      const response = await this.communityLiteService.createReport(
        this.currentUserContext.getCurrentUser(request).userId,
        {
          ...normalizeReportBody(body),
          targetType: CommunityReportTargetType.Post,
          targetId: postId
        }
      );
      if (!response.alreadyReported) {
        await this.adminOperationsService.publishReviewCreated(
          AdminOperationsSource.Community,
          AdminOperationsRealtimeTargetType.CommunityReport,
          (response as { reportId?: string; id?: string }).reportId ?? postId
        );
      }
      return response;
    });
  }

  @Post("comments/:commentId/reports")
  reportComment(
    @Req() request: RequestLike,
    @Param("commentId") commentId: string,
    @Body() body: Omit<CreateCommunityReportRequest, "targetType" | "targetId"> | string = {}
  ) {
    return this.wrapValidation(async () => {
      const response = await this.communityLiteService.createReport(
        this.currentUserContext.getCurrentUser(request).userId,
        {
          ...normalizeReportBody(body),
          targetType: CommunityReportTargetType.Comment,
          targetId: commentId
        }
      );
      if (!response.alreadyReported) {
        await this.adminOperationsService.publishReviewCreated(
          AdminOperationsSource.Community,
          AdminOperationsRealtimeTargetType.CommunityReport,
          (response as { reportId?: string; id?: string }).reportId ?? commentId
        );
      }
      return response;
    });
  }

  @Post("replies/:replyId/reports")
  reportReply(
    @Req() request: RequestLike,
    @Param("replyId") replyId: string,
    @Body() body: Omit<CreateCommunityReportRequest, "targetType" | "targetId"> | string = {}
  ) {
    return this.wrapValidation(async () => {
      const response = await this.communityLiteService.createReport(
        this.currentUserContext.getCurrentUser(request).userId,
        {
          ...normalizeReportBody(body),
          targetType: CommunityReportTargetType.Reply,
          targetId: replyId
        }
      );
      if (!response.alreadyReported) {
        await this.adminOperationsService.publishReviewCreated(
          AdminOperationsSource.Community,
          AdminOperationsRealtimeTargetType.CommunityReport,
          (response as { reportId?: string; id?: string }).reportId ?? replyId
        );
      }
      return response;
    });
  }

  private async wrapValidation<T>(handler: () => Promise<T>): Promise<T> {
    try {
      return await handler();
    } catch (error) {
      if (error instanceof CommunityLiteValidationError) {
        throw new BadRequestException({
          errorCode: "community_invalid_input",
          message: "社区输入校验失败",
          issues: error.issues
        });
      }

      throw error;
    }
  }
}

function normalizeListCommunityPostsQuery(
  query: ListCommunityPostsQuery
): ListCommunityPostsRequest {
  return {
    ...query,
    limit: query.limit === undefined ? undefined : Number(query.limit)
  };
}

function normalizeListCommunityPublicUsersQuery(
  query: ListCommunityPublicUsersQuery
): ListCommunityPublicUsersRequest {
  return {
    ...query,
    limit: query.limit === undefined ? undefined : Number(query.limit)
  };
}

function normalizeGovernancePostQuery(
  query: AdminCommunityPostSearchRequest
): AdminCommunityPostSearchRequest {
  return {
    ...query,
    page: query.page === undefined ? undefined : Number(query.page),
    pageSize: query.pageSize === undefined ? undefined : Number(query.pageSize)
  };
}

function normalizeGovernanceAction(
  body: AdminCommunityGovernanceActionRequest
): AdminCommunityGovernanceActionRequest {
  if (!body?.reason || typeof body.reason !== "string") {
    throw new BadRequestException({
      errorCode: "admin_community_governance_reason_required",
      message: "治理操作必须填写原因"
    });
  }
  return {
    action: body.action,
    reason: body.reason.trim(),
    note: typeof body.note === "string" ? body.note.trim() : undefined
  };
}

function normalizeReportBody(
  body: Omit<CreateCommunityReportRequest, "targetType" | "targetId"> | string | undefined
): Omit<CreateCommunityReportRequest, "targetType" | "targetId"> {
  return typeof body === "string" ? { reason: body } : (body ?? {});
}

function normalizeUserGovernance(
  body: AdminCommunityUserGovernanceRequest
): AdminCommunityUserGovernanceRequest {
  if (!body?.reason || typeof body.reason !== "string") {
    throw new BadRequestException({
      errorCode: "admin_community_governance_reason_required",
      message: "用户治理必须填写原因"
    });
  }
  return {
    status: body.status,
    reason: body.reason.trim(),
    note: typeof body.note === "string" ? body.note.trim() : undefined,
    expiresAt: typeof body.expiresAt === "string" && body.expiresAt ? body.expiresAt : undefined
  };
}

function normalizeClearGovernance(
  body: AdminCommunityClearUserGovernanceRequest
): AdminCommunityClearUserGovernanceRequest {
  return {
    reason:
      typeof body?.reason === "string" && body.reason.trim()
        ? body.reason.trim()
        : "解除社区治理限制",
    note: typeof body?.note === "string" ? body.note.trim() : undefined
  };
}

@Controller("admin/community")
export class CommunityModerationController {
  constructor(
    private readonly communityLiteService: CommunityLiteService,
    private readonly configService: ConfigService,
    private readonly adminOperationsService: AdminOperationsService
  ) {}

  @Get("pending")
  listPending(@Headers("x-admin-token") adminToken: string | undefined) {
    this.assertAdmin(adminToken);
    return this.communityLiteService.listPendingQueue();
  }

  @Get("pending-posts")
  listPendingPosts(@Headers("x-admin-token") adminToken: string | undefined) {
    this.assertAdmin(adminToken);
    return this.communityLiteService.listPendingPosts();
  }

  @Get("pending-comments")
  listPendingComments(@Headers("x-admin-token") adminToken: string | undefined) {
    this.assertAdmin(adminToken);
    return this.communityLiteService.listPendingComments();
  }

  @Post("posts/:postId/review")
  async reviewPost(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Param("postId") postId: string,
    @Body() body: { action: "approve" | "reject" | "hide"; reviewNote?: string }
  ) {
    this.assertAdmin(adminToken);
    await this.communityLiteService.reviewPost(postId, body.action, body.reviewNote);
    await this.adminOperationsService.publishReviewStateChanged(
      AdminOperationsSource.Community,
      AdminOperationsRealtimeTargetType.CommunityPost,
      postId
    );
    return { accepted: true };
  }

  @Post("comments/:commentId/review")
  async reviewComment(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Param("commentId") commentId: string,
    @Body() body: { action: "approve" | "reject" | "hide"; reviewNote?: string }
  ) {
    this.assertAdmin(adminToken);
    await this.communityLiteService.reviewComment(commentId, body.action, body.reviewNote);
    await this.adminOperationsService.publishReviewStateChanged(
      AdminOperationsSource.Community,
      AdminOperationsRealtimeTargetType.CommunityComment,
      commentId
    );
    return { accepted: true };
  }

  @Post("replies/:replyId/review")
  async reviewReply(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Param("replyId") replyId: string,
    @Body() body: { action: "approve" | "reject" | "hide"; reviewNote?: string }
  ) {
    this.assertAdmin(adminToken);
    await this.communityLiteService.reviewReply(replyId, body.action, body.reviewNote);
    await this.adminOperationsService.publishReviewStateChanged(
      AdminOperationsSource.Community,
      AdminOperationsRealtimeTargetType.CommunityReply,
      replyId
    );
    return { accepted: true };
  }

  @Post("reports/:reportId/handle")
  async handleReport(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Param("reportId") reportId: string,
    @Body() body: { action: CommunityReportHandleAction; handleNote?: string }
  ) {
    this.assertAdmin(adminToken);
    await this.communityLiteService.handleReport(reportId, body.action, "admin", body.handleNote);
    await this.adminOperationsService.publishReviewStateChanged(
      AdminOperationsSource.Community,
      AdminOperationsRealtimeTargetType.CommunityReport,
      reportId
    );
    return { accepted: true };
  }

  @Post("media-assets/cleanup")
  cleanupMediaAssets(@Headers("x-admin-token") adminToken: string | undefined) {
    this.assertAdmin(adminToken);
    return this.communityLiteService.cleanupOrphanMediaAssets();
  }

  private assertAdmin(adminToken?: string): void {
    const expectedToken =
      this.configService.get<string>("ADMIN_OPERATIONS_TOKEN") || "dev-admin-token";

    if (adminToken !== expectedToken) {
      throw new ForbiddenException({
        errorCode: "admin_unauthorized",
        message: "无权操作论坛后台"
      });
    }
  }
}
