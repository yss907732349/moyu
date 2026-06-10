import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Post,
  Put,
  Query,
  Req,
  StreamableFile
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AdminOperationsRealtimeTargetType, AdminOperationsSource } from "@moyuxia/shared";
import { AdminOperationsService } from "./admin-operations.service";
import { CurrentUserContextService } from "./current-user.context";
import {
  AdminDailyContentDraftRequest,
  AdminDailyContentSectionUpdateRequest,
  AdminDailyContentUpdateRequest,
  DailyContentFeedService
} from "./daily-content-feed.service";

interface RequestLike {
  headers: {
    authorization?: string;
  };
}

@Controller("daily-content")
export class DailyContentFeedController {
  constructor(
    private readonly currentUserContext: CurrentUserContextService,
    private readonly dailyContentFeedService: DailyContentFeedService,
    private readonly adminOperationsService: AdminOperationsService
  ) {}

  @Get("summary")
  getSummary() {
    return this.dailyContentFeedService.getCurrentSummary();
  }

  @Get("issues/:issueId")
  getDetail(@Req() request: RequestLike, @Param("issueId") issueId: string) {
    let viewerUserId: string | undefined;
    try {
      viewerUserId = this.currentUserContext.getCurrentUser(request).userId;
    } catch {
      viewerUserId = undefined;
    }
    return this.dailyContentFeedService.getIssueDetail(issueId, viewerUserId);
  }

  @Get("issues/:issueId/sections/:sectionKey/articles")
  listArticles(
    @Req() request: RequestLike,
    @Param("issueId") issueId: string,
    @Param("sectionKey") sectionKey: string
  ) {
    let viewerUserId: string | undefined;
    try {
      viewerUserId = this.currentUserContext.getCurrentUser(request).userId;
    } catch {
      viewerUserId = undefined;
    }
    return this.dailyContentFeedService.listColumnArticles(issueId, sectionKey, viewerUserId);
  }

  @Get("articles/:articleId")
  getArticle(@Req() request: RequestLike, @Param("articleId") articleId: string) {
    let viewerUserId: string | undefined;
    try {
      viewerUserId = this.currentUserContext.getCurrentUser(request).userId;
    } catch {
      viewerUserId = undefined;
    }
    return this.dailyContentFeedService.getArticleDetail(articleId, viewerUserId);
  }

  @Post("items/:itemId/like")
  likeItem(@Req() request: RequestLike, @Param("itemId") itemId: string) {
    return this.dailyContentFeedService.setItemLike(
      this.currentUserContext.getCurrentUser(request).userId,
      itemId,
      true
    );
  }

  @Delete("items/:itemId/like")
  unlikeItem(@Req() request: RequestLike, @Param("itemId") itemId: string) {
    return this.dailyContentFeedService.setItemLike(
      this.currentUserContext.getCurrentUser(request).userId,
      itemId,
      false
    );
  }

  @Post("articles/:articleId/like")
  likeArticle(@Req() request: RequestLike, @Param("articleId") articleId: string) {
    return this.dailyContentFeedService.setItemLike(
      this.currentUserContext.getCurrentUser(request).userId,
      articleId,
      true
    );
  }

  @Delete("articles/:articleId/like")
  unlikeArticle(@Req() request: RequestLike, @Param("articleId") articleId: string) {
    return this.dailyContentFeedService.setItemLike(
      this.currentUserContext.getCurrentUser(request).userId,
      articleId,
      false
    );
  }

  @Post("articles/:articleId/comments")
  async createArticleComment(
    @Req() request: RequestLike,
    @Param("articleId") articleId: string,
    @Body("body") body: string
  ) {
    const response = await this.dailyContentFeedService.createArticleComment(
      this.currentUserContext.getCurrentUser(request).userId,
      articleId,
      body
    );
    await this.adminOperationsService.publishReviewCreated(
      AdminOperationsSource.DailyContent,
      AdminOperationsRealtimeTargetType.DailyContentComment,
      (response as { commentId?: string; id?: string }).commentId ??
        (response as { commentId?: string; id?: string }).id ??
        articleId
    );
    return response;
  }

  @Post("issues/:issueId/reflection/quote")
  createReflectionQuote(@Req() request: RequestLike, @Param("issueId") issueId: string) {
    this.currentUserContext.getCurrentUser(request);
    return this.dailyContentFeedService.createReflectionQuoteSnapshot(issueId);
  }

  @Post("issues/:issueId/items/:itemId/quote")
  createQuote(
    @Req() request: RequestLike,
    @Param("issueId") issueId: string,
    @Param("itemId") itemId: string
  ) {
    this.currentUserContext.getCurrentUser(request);
    return this.dailyContentFeedService.createQuoteSnapshot(issueId, itemId);
  }

  @Get("assets/:assetId")
  async getAsset(@Param("assetId") assetId: string) {
    const asset = await this.dailyContentFeedService.getUploadedAsset(assetId);
    return new StreamableFile(asset.buffer, {
      type: asset.mimeType,
      disposition: `inline; filename="${asset.fileName}"`
    });
  }
}

@Controller("admin/daily-content")
export class DailyContentAdminController {
  constructor(
    private readonly configService: ConfigService,
    private readonly dailyContentFeedService: DailyContentFeedService,
    private readonly adminOperationsService: AdminOperationsService
  ) {}

  @Get("issues")
  listIssues(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Query("status") status?: string,
    @Query("businessDate") businessDate?: string
  ) {
    this.assertAdmin(adminToken);
    return this.dailyContentFeedService.listAdminIssues(status, businessDate);
  }

  @Post("drafts/generate")
  async generateDraft(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Body() body: AdminDailyContentDraftRequest
  ) {
    this.assertAdmin(adminToken);
    const response = await this.dailyContentFeedService.generateDraft(body);
    await this.adminOperationsService.publishWorkbenchCountsChanged(
      AdminOperationsSource.DailyContent,
      AdminOperationsRealtimeTargetType.DailyContentIssue,
      response.id
    );
    return response;
  }

  @Post("assist")
  assistDraft(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Body()
    body: {
      issueId?: string;
      title?: string;
      homeSummary?: string;
      sections?: AdminDailyContentUpdateRequest["sections"];
      action?: "rewrite" | "polish" | "summarize" | "risk_check" | "format";
    }
  ) {
    this.assertAdmin(adminToken);
    return this.dailyContentFeedService.assistDraft(body);
  }

  @Post("assets")
  uploadAsset(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Body()
    body: { fileName?: string; mimeType?: string; dataUrl?: string; thumbnailDataUrl?: string }
  ) {
    this.assertAdmin(adminToken);
    return this.dailyContentFeedService.uploadAdminAsset(body);
  }

  @Get("issues/:issueId")
  getIssue(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Param("issueId") issueId: string
  ) {
    this.assertAdmin(adminToken);
    return this.dailyContentFeedService.getAdminIssue(issueId);
  }

  @Get("issues/:issueId/validation")
  validateIssue(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Param("issueId") issueId: string
  ) {
    this.assertAdmin(adminToken);
    return this.dailyContentFeedService.validateAdminIssue(issueId);
  }

  @Get("issues/:issueId/sections/:sectionKey/validation")
  validateIssueSection(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Param("issueId") issueId: string,
    @Param("sectionKey") sectionKey: string
  ) {
    this.assertAdmin(adminToken);
    return this.dailyContentFeedService.validateAdminIssueSection(issueId, sectionKey);
  }

  @Get("issues/:issueId/preview")
  previewIssue(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Param("issueId") issueId: string
  ) {
    this.assertAdmin(adminToken);
    return this.dailyContentFeedService.previewIssue(issueId);
  }

  @Get("issues/:issueId/sections/:sectionKey/preview")
  previewSection(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Param("issueId") issueId: string,
    @Param("sectionKey") sectionKey: string
  ) {
    this.assertAdmin(adminToken);
    return this.dailyContentFeedService.previewSection(issueId, sectionKey);
  }

  @Get("issues/:issueId/articles/:articleId/preview")
  previewArticle(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Param("issueId") issueId: string,
    @Param("articleId") articleId: string
  ) {
    this.assertAdmin(adminToken);
    return this.dailyContentFeedService.previewArticle(issueId, articleId);
  }

  @Put("issues/:issueId")
  updateIssue(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Param("issueId") issueId: string,
    @Body() body: AdminDailyContentUpdateRequest
  ) {
    this.assertAdmin(adminToken);
    return this.dailyContentFeedService.updateAdminIssue(issueId, body);
  }

  @Put("issues/:issueId/sections/:sectionKey")
  updateIssueSection(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Param("issueId") issueId: string,
    @Param("sectionKey") sectionKey: string,
    @Body() body: AdminDailyContentSectionUpdateRequest
  ) {
    this.assertAdmin(adminToken);
    return this.dailyContentFeedService.updateAdminIssueSection(issueId, sectionKey, body);
  }

  @Post("issues/:issueId/submit-review")
  submitReview(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Param("issueId") issueId: string
  ) {
    this.assertAdmin(adminToken);
    return this.dailyContentFeedService.submitReview(issueId);
  }

  @Post("issues/:issueId/review")
  async reviewIssue(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Param("issueId") issueId: string,
    @Body() body: { action: "approve" | "reject"; reviewNote?: string }
  ) {
    this.assertAdmin(adminToken);
    const response = await this.dailyContentFeedService.review(
      issueId,
      body.action,
      "admin",
      body.reviewNote
    );
    await this.adminOperationsService.publishReviewStateChanged(
      AdminOperationsSource.DailyContent,
      AdminOperationsRealtimeTargetType.DailyContentIssue,
      issueId
    );
    return response;
  }

  @Post("issues/:issueId/schedule")
  async scheduleIssue(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Param("issueId") issueId: string,
    @Body("scheduledPublishAt") scheduledPublishAt: string
  ) {
    this.assertAdmin(adminToken);
    const response = await this.dailyContentFeedService.schedule(issueId, scheduledPublishAt);
    await this.adminOperationsService.publishWorkbenchCountsChanged(
      AdminOperationsSource.DailyContent,
      AdminOperationsRealtimeTargetType.DailyContentIssue,
      issueId
    );
    return response;
  }

  @Post("issues/:issueId/cancel-schedule")
  async cancelScheduleIssue(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Param("issueId") issueId: string
  ) {
    this.assertAdmin(adminToken);
    const response = await this.dailyContentFeedService.cancelSchedule(issueId);
    await this.adminOperationsService.publishWorkbenchCountsChanged(
      AdminOperationsSource.DailyContent,
      AdminOperationsRealtimeTargetType.DailyContentIssue,
      issueId
    );
    return response;
  }

  @Post("scheduled/process-due")
  processDueScheduledIssues(@Headers("x-admin-token") adminToken: string | undefined) {
    this.assertAdmin(adminToken);
    return this.dailyContentFeedService.processDueScheduledIssues();
  }

  @Post("issues/:issueId/publish")
  async publishIssue(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Param("issueId") issueId: string
  ) {
    this.assertAdmin(adminToken);
    const response = await this.dailyContentFeedService.publish(issueId);
    await this.adminOperationsService.publishReviewStateChanged(
      AdminOperationsSource.DailyContent,
      AdminOperationsRealtimeTargetType.DailyContentIssue,
      issueId
    );
    return response;
  }

  @Post("issues/:issueId/publish-sections")
  async publishIssueSections(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Param("issueId") issueId: string,
    @Body("sectionKeys") sectionKeys: string[]
  ) {
    this.assertAdmin(adminToken);
    const response = await this.dailyContentFeedService.publishSections(issueId, sectionKeys);
    await this.adminOperationsService.publishReviewStateChanged(
      AdminOperationsSource.DailyContent,
      AdminOperationsRealtimeTargetType.DailyContentIssue,
      issueId
    );
    return response;
  }

  @Post("issues/:issueId/archive")
  async archiveIssue(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Param("issueId") issueId: string
  ) {
    this.assertAdmin(adminToken);
    const response = await this.dailyContentFeedService.archive(issueId);
    await this.adminOperationsService.publishReviewStateChanged(
      AdminOperationsSource.DailyContent,
      AdminOperationsRealtimeTargetType.DailyContentIssue,
      issueId
    );
    return response;
  }

  @Post("comments/:commentId/review")
  async reviewArticleComment(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Param("commentId") commentId: string,
    @Body() body: { action: "approve" | "reject"; reviewNote?: string }
  ) {
    this.assertAdmin(adminToken);
    const response = await this.dailyContentFeedService.reviewArticleComment(
      commentId,
      body.action,
      "admin",
      body.reviewNote
    );
    await this.adminOperationsService.publishReviewStateChanged(
      AdminOperationsSource.DailyContent,
      AdminOperationsRealtimeTargetType.DailyContentComment,
      commentId
    );
    return response;
  }

  @Get("comments/pending")
  listPendingArticleComments(@Headers("x-admin-token") adminToken: string | undefined) {
    this.assertAdmin(adminToken);
    return this.dailyContentFeedService.listPendingArticleComments();
  }

  private assertAdmin(adminToken?: string): void {
    const expectedToken =
      this.configService.get<string>("ADMIN_OPERATIONS_TOKEN") || "dev-admin-token";

    if (adminToken !== expectedToken) {
      throw new ForbiddenException({
        errorCode: "admin_unauthorized",
        message: "无权操作隐者日报后台"
      });
    }
  }
}
