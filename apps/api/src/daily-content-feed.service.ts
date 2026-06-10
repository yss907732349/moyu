import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import {
  AiModerationDecision,
  ContentSecurityDecision,
  ContentSecurityManualReviewReason,
  ContentSecurityRiskTag,
  ContentSecuritySource,
  LowCostModerationDecision,
  createContentSecuritySummary,
  DAILY_CONTENT_SECTION_KEYS,
  DAILY_CONTENT_SECTION_LABELS,
  DailyContentGenerationStatus,
  DailyContentSectionKey,
  DailyContentSourceType,
  DailyContentStatus,
  CommunityLiteErrorCode,
  createCommunityAuthorSnapshot,
  createDailyContentQuoteSnapshot,
  createDailyContentReflectionQuoteSnapshot,
  getBusinessDate,
  isDailyContentArticleSectionKey,
  isDailyContentSectionKey,
  toDailyContentPublicDetail,
  toDailyContentPublicSummary,
  toDailyContentArticleDetail,
  toDailyContentArticleSummary,
  validateDailyContentEdit,
  validateDailyContentForSubmitOrPublish,
  validateDailyContentIssue,
  validateDailyContentSectionEdit,
  validateDailyContentSectionForPublish,
  type AdminDailyContentIssueUpdateRequest,
  type AdminDailyContentSectionUpdateRequest as SharedAdminDailyContentSectionUpdateRequest,
  type DailyContentAiDraftMetadata,
  type DailyContentArticleComment,
  type DailyContentArticlePreviewResponse,
  type DailyContentEditValidationResult,
  type DailyContentIssuePreviewResponse,
  type DailyContentSectionPreviewResponse,
  DailyContentValidationError,
  type DailyContentIssue,
  type DailyContentItem,
  type DailyContentLikeResponse,
  type DailyContentPublicDetail,
  type DailyContentPublicSummary,
  type DailyContentQuoteSnapshot,
  type DailyContentSection,
  type DailyContentSourceInput,
  type GetDailyContentArticleDetailResponse,
  type GetDailyContentColumnArticlesResponse,
  type GetDailyContentDetailResponse,
  type GetDailyContentSummaryResponse,
  type CreateDailyContentArticleCommentResponse,
  type LowCostContentModerationResult
} from "@moyuxia/shared";
import { AiContentModerationService } from "./ai-content-moderation.service";
import { LowCostContentModerationService } from "./low-cost-content-moderation.service";
import { PrismaService } from "./prisma.service";
import { UserGrowthProfileService } from "./user-growth-profile.service";
import { WorldIntelContentService } from "./world-intel-content.service";

type ReviewAction = "approve" | "reject";

interface DailyContentIssueRecord {
  id: string;
  businessDate: string;
  title: string;
  homeSummary: string;
  status: string;
  scheduledPublishAt: Date | null;
  publishedAt: Date | null;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  reviewNote: string | null;
  aiDraftMetadata: unknown;
  internalRiskTags: unknown;
  createdAt: Date;
  updatedAt: Date;
  sections?: DailyContentSectionRecord[];
}

interface DailyContentSectionRecord {
  id: string;
  issueId: string;
  sectionKey: string;
  title: string;
  summary: string;
  illustrationKey: string | null;
  sortOrder: number;
  items?: DailyContentItemRecord[];
}

interface DailyContentItemRecord {
  id: string;
  sectionId: string;
  issueId: string;
  sectionKey: string;
  title: string;
  summary: string;
  body: string;
  source: unknown;
  allowLike: boolean;
  allowCommunityQuote: boolean;
  quotePrompt: string | null;
  sortOrder: number;
}

interface DailyContentArticleCommentRecord {
  id: string;
  articleId: string;
  authorUserId: string;
  body: string;
  authorSnapshot: unknown;
  status: string;
  approvedAt: Date | null;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  reviewNote: string | null;
  moderation: unknown;
  createdAt: Date;
  updatedAt: Date;
}

interface DailyContentIssueDelegate {
  create(input: {
    data: Record<string, unknown>;
    include?: Record<string, unknown>;
  }): Promise<DailyContentIssueRecord>;
  findMany(input: Record<string, unknown>): Promise<DailyContentIssueRecord[]>;
  findFirst(input: Record<string, unknown>): Promise<DailyContentIssueRecord | null>;
  findUnique(input: Record<string, unknown>): Promise<DailyContentIssueRecord | null>;
  update(input: Record<string, unknown>): Promise<DailyContentIssueRecord>;
}

interface DailyContentItemLikeDelegate {
  upsert(input: Record<string, unknown>): Promise<unknown>;
  deleteMany(input: Record<string, unknown>): Promise<unknown>;
  findUnique(input: Record<string, unknown>): Promise<unknown | null>;
  count(input: Record<string, unknown>): Promise<number>;
}

interface DailyContentSectionDelegate {
  upsert(input: Record<string, unknown>): Promise<DailyContentSectionRecord>;
  deleteMany(input: Record<string, unknown>): Promise<unknown>;
}

interface DailyContentItemDelegate {
  upsert(input: Record<string, unknown>): Promise<DailyContentItemRecord>;
  deleteMany(input: Record<string, unknown>): Promise<unknown>;
}

interface DailyContentArticleCommentDelegate {
  create(input: Record<string, unknown>): Promise<DailyContentArticleCommentRecord>;
  findMany(input: Record<string, unknown>): Promise<DailyContentArticleCommentRecord[]>;
  findUnique(input: Record<string, unknown>): Promise<DailyContentArticleCommentRecord | null>;
  update(input: Record<string, unknown>): Promise<DailyContentArticleCommentRecord>;
  deleteMany(input: Record<string, unknown>): Promise<unknown>;
  count(input: Record<string, unknown>): Promise<number>;
}

interface GeneratedDailyContentDraft {
  title: string;
  homeSummary: string;
  sections: Array<{
    sectionKey: DailyContentSectionKey;
    summary: string;
    items: Array<{
      title: string;
      summary: string;
      body: string;
      sourceIndex?: number;
      sourceTitle?: string;
      sourceName?: string;
      sourceUrl?: string;
      sourceType?: DailyContentSourceType;
      imageUrl?: string;
      publishedAt?: string;
      publicSourceText?: string;
      quotePrompt?: string;
    }>;
  }>;
}

type CollectedDailyContentSource = DailyContentSourceInput & {
  sectionKey: DailyContentSectionKey;
  sourceIndex: number;
};

export interface AdminDailyContentDraftRequest {
  businessDate?: string;
  sectionKey?: DailyContentSectionKey;
  sourceInputs?: Array<Record<string, unknown>>;
}

export type AdminDailyContentUpdateRequest = AdminDailyContentIssueUpdateRequest;
export type AdminDailyContentSectionUpdateRequest = SharedAdminDailyContentSectionUpdateRequest;

const DAILY_CONTENT_UPLOAD_MIME_TYPES = new Map([
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"]
]);

const MAX_DAILY_CONTENT_UPLOAD_BYTES = 5 * 1024 * 1024;

@Injectable()
export class DailyContentFeedService {
  private readonly memoryIssues = new Map<string, DailyContentIssue>();
  private readonly memoryLikes = new Set<string>();
  private readonly memoryArticleComments = new Map<
    string,
    Array<
      DailyContentArticleComment & {
        authorUserId?: string;
        status: "pending" | "approved" | "rejected" | "hidden";
      }
    >
  >();

  constructor(
    private readonly prisma: PrismaService,
    private readonly userGrowthProfileService: UserGrowthProfileService,
    private readonly configService: ConfigService,
    private readonly worldIntelContentService: WorldIntelContentService,
    private readonly aiContentModerationService?: AiContentModerationService,
    private readonly lowCostContentModerationService?: LowCostContentModerationService
  ) {
    this.worldIntelContentService.registerLegacyIssueProvider(() => this.findIssues());
  }

  async getCurrentSummary(): Promise<GetDailyContentSummaryResponse> {
    const issue = await this.findComposedPublishedIssue();
    return {
      issue: issue
        ? await this.withWorldIntelColumnSummary(toDailyContentPublicSummary(issue))
        : null
    };
  }

  async getIssueDetail(
    issueId: string,
    viewerUserId?: string
  ): Promise<GetDailyContentDetailResponse> {
    const issue =
      issueId === "daily-content-composed-current"
        ? await this.findComposedPublishedIssue()
        : await this.findIssue(issueId);
    const detail = issue ? await this.toViewerDetail(issue, viewerUserId) : null;

    if (!detail) {
      throw new NotFoundException({
        errorCode: "daily_content_not_found",
        message: "日报不存在或尚未公开"
      });
    }

    return { issue: detail };
  }

  async listColumnArticles(
    issueId: string,
    sectionKey: string,
    viewerUserId?: string
  ): Promise<GetDailyContentColumnArticlesResponse> {
    if (sectionKey === DailyContentSectionKey.WorldIntel) {
      throw new BadRequestException({
        errorCode: "daily_content_world_intel_standalone",
        message: "大陆新闻已迁移到独立内容库，请使用 /world-intel/articles"
      });
    }
    if (!isDailyContentArticleSectionKey(sectionKey)) {
      throw new BadRequestException({
        errorCode: "daily_content_invalid_section",
        message: "日报栏目不存在"
      });
    }

    const issue =
      issueId === "daily-content-composed-current"
        ? await this.findComposedPublishedIssue()
        : await this.findIssue(issueId);
    const publicDetail = issue ? await this.toViewerDetail(issue, viewerUserId) : null;
    const section = publicDetail?.sections.find((entry) => entry.sectionKey === sectionKey);

    if (!publicDetail || !section) {
      throw new NotFoundException({
        errorCode: "daily_content_not_found",
        message: "日报栏目不存在或尚未公开"
      });
    }

    const articles = await Promise.all(
      section.items.slice(0, 10).map(async (item) =>
        toDailyContentArticleSummary({
          issueId: publicDetail.id,
          item,
          commentCount: await this.countArticleComments(item.id)
        })
      )
    );

    return {
      issueId: publicDetail.id,
      sectionKey,
      sectionLabel: DAILY_CONTENT_SECTION_LABELS[sectionKey],
      articles
    };
  }

  async getArticleDetail(
    articleId: string,
    viewerUserId?: string
  ): Promise<GetDailyContentArticleDetailResponse> {
    const located = await this.findPublishedItem(articleId);

    if (!located || !isDailyContentArticleSectionKey(located.item.sectionKey)) {
      throw new NotFoundException({
        errorCode: "daily_content_article_not_found",
        message: "日报文章不存在或尚未公开"
      });
    }

    const item: DailyContentItem = {
      ...located.item,
      likeCount: await this.countItemLikes(articleId),
      viewerLiked: viewerUserId ? await this.isItemLiked(articleId, viewerUserId) : false
    };

    return {
      article: toDailyContentArticleDetail({
        issueId: located.issue.id,
        item,
        commentCount: await this.countArticleComments(articleId)
      }),
      comments: await this.listVisibleArticleComments(articleId, viewerUserId)
    };
  }

  async setItemLike(
    userId: string,
    itemId: string,
    liked: boolean
  ): Promise<DailyContentLikeResponse> {
    await this.requireProfile(userId);
    const located = await this.findPublishedItem(itemId);

    if (!located || !located.item.allowLike) {
      throw new BadRequestException({
        errorCode: "daily_content_item_not_public",
        message: "只能点赞已发布日报内容项"
      });
    }

    if (!this.isDatabaseConfigured()) {
      const key = `${itemId}:${userId}`;
      if (liked) {
        this.memoryLikes.add(key);
      } else {
        this.memoryLikes.delete(key);
      }
    } else if (liked) {
      await this.dailyContentItemLike.upsert({
        where: { itemId_userId: { itemId, userId } },
        create: { itemId, userId },
        update: {}
      });
    } else {
      await this.dailyContentItemLike.deleteMany({ where: { itemId, userId } });
    }

    return {
      issueId: located.issue.id,
      itemId,
      liked,
      likeCount: await this.countItemLikes(itemId)
    };
  }

  async createArticleComment(
    userId: string,
    articleId: string,
    body: string
  ): Promise<CreateDailyContentArticleCommentResponse> {
    const profileResponse = await this.userGrowthProfileService.getProfile(userId);
    if (!profileResponse.profileCreated || !profileResponse.profile) {
      throw new ForbiddenException({
        errorCode: CommunityLiteErrorCode.ProfileRequired,
        message: "请先创建隐者档案"
      });
    }

    const located = await this.findPublishedItem(articleId);
    if (!located || !isDailyContentArticleSectionKey(located.item.sectionKey)) {
      throw new BadRequestException({
        errorCode: "daily_content_article_not_public",
        message: "只能评论已发布日报文章"
      });
    }

    const trimmedBody = typeof body === "string" ? body.trim() : "";
    if (trimmedBody.length < 2 || trimmedBody.length > 500) {
      throw new BadRequestException({
        errorCode: "daily_content_comment_invalid",
        message: "评论需为 2-500 个字"
      });
    }

    const now = new Date().toISOString();
    const moderation = await this.moderateArticleComment(userId, trimmedBody);
    const status = moderationResultToDailyCommentStatus(moderation.result.decision);
    const comment: DailyContentArticleComment & {
      authorUserId?: string;
      status: "pending" | "approved" | "rejected" | "hidden";
    } = {
      id: `daily-article-comment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      articleId,
      body: trimmedBody,
      author: createCommunityAuthorSnapshot(profileResponse.profile),
      authorUserId: userId,
      status,
      createdAt: now,
      approvedAt: status === "approved" ? now : "",
      visibleToAuthorOnly: status === "pending" ? true : undefined,
      moderation: moderation.trace
    };

    if (!this.isDatabaseConfigured()) {
      const comments = this.memoryArticleComments.get(articleId) ?? [];
      this.memoryArticleComments.set(articleId, [...comments, comment]);
    } else {
      await this.dailyContentArticleComment.create({
        data: {
          id: comment.id,
          articleId,
          authorUserId: userId,
          body: comment.body,
          authorSnapshot: comment.author,
          status,
          approvedAt: status === "approved" ? new Date(now) : null,
          moderation: moderation.trace
        }
      });
    }

    return {
      commentId: comment.id,
      status,
      message: createDailyCommentModerationMessage(status, moderation.result.reason)
    };
  }

  async reviewArticleComment(
    commentId: string,
    action: ReviewAction,
    reviewerId: string,
    reviewNote?: string
  ): Promise<{ commentId: string; status: string; reviewedBy: string; reviewNote?: string }> {
    if (this.isDatabaseConfigured()) {
      const target = await this.dailyContentArticleComment.findUnique({ where: { id: commentId } });
      if (!target) {
        throw new NotFoundException({
          errorCode: "daily_content_comment_not_found",
          message: "日报评论不存在"
        });
      }
      assertDailyCommentReviewable(target.status);

      const nextStatus: "approved" | "rejected" = action === "approve" ? "approved" : "rejected";
      await this.dailyContentArticleComment.update({
        where: { id: commentId },
        data: {
          status: nextStatus,
          approvedAt: action === "approve" ? new Date() : target.approvedAt,
          reviewedAt: new Date(),
          reviewedBy: reviewerId,
          reviewNote
        }
      });
      return { commentId, status: nextStatus, reviewedBy: reviewerId, reviewNote };
    }

    for (const [articleId, comments] of this.memoryArticleComments.entries()) {
      const targetIndex = comments.findIndex((comment) => comment.id === commentId);
      if (targetIndex >= 0) {
        const nextStatus: "approved" | "rejected" = action === "approve" ? "approved" : "rejected";
        assertDailyCommentReviewable(comments[targetIndex].status);
        const updated = {
          ...comments[targetIndex],
          status: nextStatus,
          approvedAt:
            action === "approve" ? new Date().toISOString() : comments[targetIndex].approvedAt
        };
        const nextComments = [...comments];
        nextComments[targetIndex] = updated;
        this.memoryArticleComments.set(articleId, nextComments);
        return { commentId, status: nextStatus, reviewedBy: reviewerId, reviewNote };
      }
    }

    throw new NotFoundException({
      errorCode: "daily_content_comment_not_found",
      message: "日报评论不存在"
    });
  }

  async listPendingArticleComments(): Promise<
    Array<DailyContentArticleComment & { status: "pending" | "approved" | "rejected" | "hidden" }>
  > {
    if (this.isDatabaseConfigured()) {
      const records = await this.dailyContentArticleComment.findMany({
        where: { status: "pending" },
        orderBy: [{ createdAt: "asc" }]
      });
      return records.map(recordToArticleComment);
    }

    return [...this.memoryArticleComments.values()]
      .flat()
      .filter((comment) => comment.status === "pending")
      .sort((first, second) => first.createdAt.localeCompare(second.createdAt));
  }

  async createQuoteSnapshot(issueId: string, itemId: string): Promise<DailyContentQuoteSnapshot> {
    const issue = await this.findPublicIssueForRead(issueId);
    const publicDetail = issue ? toDailyContentPublicDetail(issue) : null;
    const item = publicDetail?.sections
      .flatMap((section) => section.items)
      .find((entry) => entry.id === itemId);

    if (!publicDetail || !item || !item.allowCommunityQuote) {
      throw new BadRequestException({
        errorCode: "daily_content_quote_unavailable",
        message: "日报引用不可用"
      });
    }

    return createDailyContentQuoteSnapshot({
      issueId: publicDetail.id,
      businessDate: publicDetail.businessDate,
      item
    });
  }

  async createReflectionQuoteSnapshot(issueId: string): Promise<DailyContentQuoteSnapshot> {
    const issue = await this.findPublicIssueForRead(issueId);
    const publicSummary = issue ? toDailyContentPublicSummary(issue) : null;
    const reflectionItem = issue?.sections
      .find((section) => section.sectionKey === DailyContentSectionKey.DailyReflection)
      ?.items.at(0);

    if (!publicSummary || !reflectionItem?.allowCommunityQuote || !publicSummary.reflection.text) {
      throw new BadRequestException({
        errorCode: "daily_content_quote_unavailable",
        message: "今日参悟引用不可用"
      });
    }

    return createDailyContentReflectionQuoteSnapshot({
      issueId: publicSummary.id,
      businessDate: publicSummary.businessDate,
      reflection: publicSummary.reflection
    });
  }

  async assertQuoteAvailable(quote: DailyContentQuoteSnapshot): Promise<void> {
    const snapshot =
      quote.sourceType === "daily_reflection"
        ? await this.createReflectionQuoteSnapshot(quote.issueId)
        : await this.createQuoteSnapshot(quote.issueId, quote.articleId ?? quote.itemId);
    if (
      snapshot.sourceType !== quote.sourceType ||
      snapshot.itemId !== quote.itemId ||
      snapshot.sectionKey !== quote.sectionKey ||
      snapshot.title !== quote.title ||
      snapshot.summary !== quote.summary ||
      snapshot.businessDate !== quote.businessDate ||
      snapshot.reflectionText !== quote.reflectionText ||
      snapshot.quotePrompt !== quote.quotePrompt
    ) {
      throw new BadRequestException({
        errorCode: "daily_content_quote_unavailable",
        message: "日报引用快照已失效"
      });
    }
  }

  async uploadAdminAsset(request: {
    fileName?: string;
    mimeType?: string;
    dataUrl?: string;
    thumbnailDataUrl?: string;
  }): Promise<{
    assetId: string;
    fileName: string;
    mimeType: string;
    publicUrl: string;
    thumbnailPublicUrl?: string;
  }> {
    const parsed = parseDailyContentImageDataUrl(request.dataUrl, request.mimeType);
    const extension = DAILY_CONTENT_UPLOAD_MIME_TYPES.get(parsed.mimeType);
    if (!extension) {
      throw new BadRequestException({
        errorCode: "daily_content_asset_invalid_type",
        message: "只支持 png、jpg、webp 或 gif 图片"
      });
    }

    if (parsed.buffer.byteLength > MAX_DAILY_CONTENT_UPLOAD_BYTES) {
      throw new BadRequestException({
        errorCode: "daily_content_asset_too_large",
        message: "图片不能超过 5MB"
      });
    }

    const assetId = `daily-content-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const safeFileName = normalizeUploadFileName(request.fileName, extension, assetId);
    const uploadDir = getDailyContentUploadDir();
    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, `${assetId}${extension}`), parsed.buffer);
    const thumbnailPublicUrl = await this.writeDailyContentThumbnail({
      assetId,
      uploadDir,
      thumbnailDataUrl: request.thumbnailDataUrl
    });

    return {
      assetId,
      fileName: safeFileName,
      mimeType: parsed.mimeType,
      publicUrl: `/daily-content/assets/${assetId}${extension}`,
      thumbnailPublicUrl
    };
  }

  private async writeDailyContentThumbnail(input: {
    assetId: string;
    uploadDir: string;
    thumbnailDataUrl?: string;
  }): Promise<string | undefined> {
    if (!input.thumbnailDataUrl) {
      return undefined;
    }

    const parsed = parseDailyContentImageDataUrl(input.thumbnailDataUrl, "image/jpeg");
    const extension = DAILY_CONTENT_UPLOAD_MIME_TYPES.get(parsed.mimeType);
    if (!extension || parsed.buffer.byteLength > MAX_DAILY_CONTENT_UPLOAD_BYTES) {
      return undefined;
    }

    const thumbnailName = `${input.assetId}-thumb${extension}`;
    await writeFile(join(input.uploadDir, thumbnailName), parsed.buffer);
    return `/daily-content/assets/${thumbnailName}`;
  }

  async getUploadedAsset(assetId: string): Promise<{
    buffer: Buffer;
    fileName: string;
    mimeType: string;
  }> {
    const normalizedAssetId = assetId.replace(/[^a-zA-Z0-9._-]/g, "");
    const extension = extname(normalizedAssetId).toLowerCase();
    const mimeType =
      [...DAILY_CONTENT_UPLOAD_MIME_TYPES.entries()].find(
        ([, value]) => value === extension
      )?.[0] ?? "application/octet-stream";

    if (!normalizedAssetId || !DAILY_CONTENT_UPLOAD_MIME_TYPES.has(mimeType)) {
      throw new NotFoundException({
        errorCode: "daily_content_asset_not_found",
        message: "日报图片不存在"
      });
    }

    try {
      return {
        buffer: await readFile(join(getDailyContentUploadDir(), normalizedAssetId)),
        fileName: normalizedAssetId,
        mimeType
      };
    } catch {
      throw new NotFoundException({
        errorCode: "daily_content_asset_not_found",
        message: "日报图片不存在"
      });
    }
  }

  async generateDraft(request: AdminDailyContentDraftRequest = {}): Promise<DailyContentIssue> {
    const now = new Date();
    const businessDate = request.businessDate ?? getBusinessDate(now);
    const sectionKey = request.sectionKey
      ? normalizeRequiredSectionKey(request.sectionKey)
      : DailyContentSectionKey.DailyReflection;
    assertDailyContentEditableSection(sectionKey);
    const generation = await this.generateManualDraft(businessDate, request.sourceInputs ?? []);
    const issue = createFallbackDraftIssue({
      id: `daily-content-${sectionKey}-${Date.now()}`,
      businessDate,
      sectionKey,
      now,
      metadata: generation.metadata,
      generatedDraft: generation.draft,
      sourceInputs: generation.sourceInputs
    });

    validateDailyContentIssue(issue);
    return this.saveNewIssue(issue);
  }

  async listAdminIssues(status?: string, businessDate?: string): Promise<DailyContentIssue[]> {
    const issues = await this.findIssues();
    return issues
      .filter((issue) => !status || issue.status === status)
      .filter((issue) => !businessDate || issue.businessDate === businessDate)
      .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));
  }

  async getAdminIssue(issueId: string): Promise<DailyContentIssue> {
    const issue = await this.findIssue(issueId);
    if (!issue) {
      throw new NotFoundException({ errorCode: "daily_content_not_found", message: "日报不存在" });
    }
    return issue;
  }

  async updateAdminIssue(
    issueId: string,
    request: AdminDailyContentUpdateRequest
  ): Promise<DailyContentIssue> {
    const issue = await this.getAdminIssue(issueId);
    const nextIssue: DailyContentIssue = {
      ...issue,
      title: request.title ?? issue.title,
      homeSummary: request.homeSummary ?? issue.homeSummary,
      sections: request.sections
        ? normalizeEditableSections(issue.id, request.sections)
        : issue.sections,
      scheduledPublishAt: request.scheduledPublishAt,
      updatedAt: new Date().toISOString()
    };

    return this.replaceIssue(nextIssue);
  }

  async updateAdminIssueSection(
    issueId: string,
    sectionKey: string,
    request: AdminDailyContentSectionUpdateRequest
  ): Promise<DailyContentIssue> {
    const normalizedSectionKey = normalizeRequiredSectionKey(sectionKey);
    assertDailyContentEditableSection(normalizedSectionKey);
    if (request.sectionKey !== normalizedSectionKey) {
      throw new BadRequestException({
        errorCode: "daily_content_section_key_mismatch",
        message: "请求板块 key 与路径不一致"
      });
    }

    const issue = await this.getAdminIssue(issueId);
    const normalizedSection = normalizeEditableSections(issue.id, [request])[0];
    const nextIssue: DailyContentIssue = {
      ...issue,
      sections: issue.sections.map((section) =>
        section.sectionKey === normalizedSectionKey ? normalizedSection : section
      ),
      updatedAt: new Date().toISOString()
    };

    if (!issue.sections.some((section) => section.sectionKey === normalizedSectionKey)) {
      nextIssue.sections = [...nextIssue.sections, normalizedSection].sort(
        (first, second) =>
          DAILY_CONTENT_SECTION_KEYS.indexOf(first.sectionKey) -
          DAILY_CONTENT_SECTION_KEYS.indexOf(second.sectionKey)
      );
    }

    return this.replaceIssue(nextIssue);
  }

  async submitReview(issueId: string): Promise<DailyContentIssue> {
    assertDailyContentPublishReady(await this.getAdminIssue(issueId));
    return this.transition(issueId, { status: DailyContentStatus.PendingReview });
  }

  async review(
    issueId: string,
    action: ReviewAction,
    reviewerId: string,
    reviewNote?: string
  ): Promise<DailyContentIssue> {
    const issue = await this.getAdminIssue(issueId);
    if (issue.status !== DailyContentStatus.PendingReview) {
      throw new ConflictException({
        errorCode: "daily_content_issue_state_changed",
        message: "日报审核状态已变化，请刷新后再处理"
      });
    }
    return this.transition(issueId, {
      status: action === "approve" ? DailyContentStatus.Approved : DailyContentStatus.Rejected,
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewerId,
      reviewNote
    });
  }

  async schedule(issueId: string, scheduledPublishAt: string): Promise<DailyContentIssue> {
    const issue = await this.getAdminIssue(issueId);
    for (const section of issue.sections) {
      assertDailyContentSectionPublishReady(issue, section.sectionKey);
    }
    const scheduledAt = parseFutureDate(scheduledPublishAt);
    return this.transition(issueId, {
      status: DailyContentStatus.Scheduled,
      scheduledPublishAt: scheduledAt.toISOString(),
      publishedAt: undefined
    });
  }

  async publish(issueId: string): Promise<DailyContentIssue> {
    const issue = await this.getAdminIssue(issueId);
    for (const section of issue.sections) {
      assertDailyContentSectionPublishReady(issue, section.sectionKey);
    }
    return this.transition(issueId, {
      status: DailyContentStatus.Published,
      publishedAt: new Date().toISOString()
    });
  }

  async publishSections(issueId: string, sectionKeys: string[]): Promise<DailyContentIssue> {
    const issue = await this.getAdminIssue(issueId);
    const normalizedSectionKeys = normalizePublishSectionKeys(sectionKeys);
    for (const sectionKey of normalizedSectionKeys) {
      assertDailyContentSectionPublishReady(issue, sectionKey);
    }
    return this.transition(issue.id, {
      status: DailyContentStatus.Published,
      publishedAt: new Date().toISOString()
    });
  }

  async archive(issueId: string): Promise<DailyContentIssue> {
    return this.transition(issueId, { status: DailyContentStatus.Archived });
  }

  async cancelSchedule(issueId: string): Promise<DailyContentIssue> {
    const issue = await this.getAdminIssue(issueId);
    if (issue.status !== DailyContentStatus.Scheduled) {
      throw new BadRequestException({
        errorCode: "daily_content_not_scheduled",
        message: "只有定时发布中的日报可以取消定时"
      });
    }
    return this.transition(issueId, {
      status: DailyContentStatus.Draft,
      scheduledPublishAt: undefined
    });
  }

  async processDueScheduledIssues(now = new Date()): Promise<{
    publishedIssueIds: string[];
    failedIssueIds: string[];
  }> {
    const dueIssues = (await this.findIssues()).filter(
      (issue) =>
        issue.status === DailyContentStatus.Scheduled &&
        issue.scheduledPublishAt &&
        new Date(issue.scheduledPublishAt).getTime() <= now.getTime()
    );
    const publishedIssueIds: string[] = [];
    const failedIssueIds: string[] = [];

    for (const issue of dueIssues) {
      try {
        for (const section of issue.sections) {
          assertDailyContentSectionPublishReady(issue, section.sectionKey);
        }
        await this.publish(issue.id);
        publishedIssueIds.push(issue.id);
      } catch (error) {
        failedIssueIds.push(issue.id);
        await this.transition(issue.id, {
          reviewNote: `定时发布失败：${normalizeErrorMessage(error)}`
        });
      }
    }

    return { publishedIssueIds, failedIssueIds };
  }

  async validateAdminIssue(issueId: string): Promise<DailyContentEditValidationResult> {
    return validateDailyContentEdit(await this.getAdminIssue(issueId));
  }

  async validateAdminIssueSection(
    issueId: string,
    sectionKey: string
  ): Promise<DailyContentEditValidationResult> {
    const normalizedSectionKey = normalizeRequiredSectionKey(sectionKey);
    return validateDailyContentSectionEdit(await this.getAdminIssue(issueId), normalizedSectionKey);
  }

  async previewIssue(issueId: string): Promise<DailyContentIssuePreviewResponse> {
    const issue = await this.getAdminIssue(issueId);
    return {
      preview: true,
      validation: validateDailyContentEdit(issue),
      issue: createPreviewSummary(issue)
    };
  }

  async previewSection(
    issueId: string,
    sectionKey: string
  ): Promise<DailyContentSectionPreviewResponse> {
    const normalizedSectionKey = normalizeRequiredSectionKey(sectionKey);
    const issue = await this.getAdminIssue(issueId);
    const validation = validateDailyContentSectionEdit(issue, normalizedSectionKey);
    const section = issue.sections.find((entry) => entry.sectionKey === normalizedSectionKey);
    const articles =
      section && isDailyContentArticleSectionKey(normalizedSectionKey)
        ? await Promise.all(
            section.items.map(async (item) =>
              toDailyContentArticleSummary({
                issueId: issue.id,
                item,
                commentCount: await this.countArticleComments(item.id)
              })
            )
          )
        : [];

    return {
      preview: true,
      validation,
      sectionKey: normalizedSectionKey,
      sectionLabel: DAILY_CONTENT_SECTION_LABELS[normalizedSectionKey],
      reflection:
        normalizedSectionKey === DailyContentSectionKey.DailyReflection
          ? {
              id: section?.items[0]?.id ?? `${issue.id}-reflection`,
              text: section?.items[0]?.summary || section?.items[0]?.body || "今日参悟尚未写入。",
              quotePrompt: section?.items[0]?.quotePrompt ?? "我从今日参悟想到："
            }
          : undefined,
      column: isDailyContentArticleSectionKey(normalizedSectionKey)
        ? {
            sectionKey: normalizedSectionKey,
            title: DAILY_CONTENT_SECTION_LABELS[normalizedSectionKey],
            summary: section?.summary ?? "本栏目尚未发布内容。",
            illustrationKey: section?.illustrationKey ?? `daily_${normalizedSectionKey}`,
            articleCount: Math.min(section?.items.length ?? 0, 10)
          }
        : undefined,
      articles
    };
  }

  async previewArticle(
    issueId: string,
    articleId: string
  ): Promise<DailyContentArticlePreviewResponse> {
    const issue = await this.getAdminIssue(issueId);
    const item = issue.sections
      .flatMap((section) => section.items)
      .find((entry) => entry.id === articleId);
    if (!item || !isDailyContentArticleSectionKey(item.sectionKey)) {
      throw new NotFoundException({
        errorCode: "daily_content_article_not_found",
        message: "日报文章不存在"
      });
    }
    return {
      preview: true,
      validation: validateDailyContentEdit(issue),
      article: toDailyContentArticleDetail({
        issueId: issue.id,
        item,
        commentCount: await this.countArticleComments(item.id)
      })
    };
  }

  async assistDraft(request: {
    issueId?: string;
    title?: string;
    homeSummary?: string;
    sections?: AdminDailyContentUpdateRequest["sections"];
    action?: "rewrite" | "polish" | "summarize" | "risk_check" | "format";
  }): Promise<{
    action: string;
    suggestions: string[];
    riskTags: string[];
    sections?: DailyContentSection[];
  }> {
    const baseIssue = request.issueId ? await this.getAdminIssue(request.issueId) : undefined;
    const sections = request.sections
      ? normalizeEditableSections(
          request.issueId ?? baseIssue?.id ?? "daily-content-preview",
          request.sections
        )
      : (baseIssue?.sections ?? []);
    const sourceWarnings = validateAiAssistedSources(sections);
    const action = request.action ?? "polish";

    return {
      action,
      suggestions: [
        action === "summarize"
          ? `首页摘要建议控制在 80 字内：${normalizeText(request.homeSummary, baseIssue?.homeSummary ?? "待填写日报摘要").slice(0, 80)}`
          : "请基于当前编辑内容做语气优化，来源字段保持人工录入值。",
        ...sourceWarnings
      ],
      riskTags: sourceWarnings.length > 0 ? ["source_integrity"] : [],
      sections
    };
  }

  private async transition(
    issueId: string,
    patch: Partial<DailyContentIssue>
  ): Promise<DailyContentIssue> {
    const issue = await this.getAdminIssue(issueId);
    const nextIssue = { ...issue, ...patch, updatedAt: new Date().toISOString() };
    assertDailyContentIssueValid(nextIssue);
    return this.replaceIssue(nextIssue);
  }

  private async withWorldIntelColumnSummary(
    issue: DailyContentPublicDetail | null
  ): Promise<DailyContentPublicDetail | null>;
  private async withWorldIntelColumnSummary(
    issue: DailyContentPublicSummary | null
  ): Promise<DailyContentPublicSummary | null>;
  private async withWorldIntelColumnSummary(
    issue: DailyContentPublicSummary | DailyContentPublicDetail | null
  ): Promise<DailyContentPublicSummary | DailyContentPublicDetail | null> {
    if (!issue) {
      return issue;
    }
    const summary = await this.worldIntelContentService.getPublishedSummary();
    return {
      ...issue,
      columns: issue.columns.map((column) =>
        column.sectionKey === DailyContentSectionKey.WorldIntel
          ? {
              ...column,
              summary: summary.latestSummary ?? column.summary,
              articleCount: summary.articleCount,
              route: "/pages/world-intel/list"
            }
          : column
      )
    };
  }

  private async toViewerDetail(
    issue: DailyContentIssue,
    viewerUserId?: string
  ): Promise<DailyContentPublicDetail | null> {
    const withLikes: DailyContentIssue = {
      ...issue,
      sections: await Promise.all(
        issue.sections.map(async (section) => ({
          ...section,
          items: await Promise.all(
            section.items.map(async (item) => ({
              ...item,
              likeCount: await this.countItemLikes(item.id),
              viewerLiked: viewerUserId ? await this.isItemLiked(item.id, viewerUserId) : false
            }))
          )
        }))
      )
    };
    const detail = toDailyContentPublicDetail(withLikes);
    return detail ? this.withWorldIntelColumnSummary(detail) : null;
  }

  private async findPublishedItem(
    itemId: string
  ): Promise<{ issue: DailyContentIssue; item: DailyContentItem } | null> {
    const issues = await this.findIssues();
    for (const issue of issues.filter((entry) => entry.status === DailyContentStatus.Published)) {
      const item = issue.sections
        .flatMap((section) => section.items)
        .find((entry) => entry.id === itemId);
      if (item) {
        return { issue, item };
      }
    }
    return null;
  }

  private async findCurrentPublishedIssue(): Promise<DailyContentIssue | null> {
    const issues = await this.findIssues();
    return (
      issues
        .filter((issue) => issue.status === DailyContentStatus.Published)
        .sort((first, second) => second.businessDate.localeCompare(first.businessDate))[0] ?? null
    );
  }

  private async findComposedPublishedIssue(): Promise<DailyContentIssue | null> {
    const issues = (await this.findIssues())
      .filter((issue) => issue.status === DailyContentStatus.Published && issue.publishedAt)
      .sort((first, second) => (second.publishedAt ?? "").localeCompare(first.publishedAt ?? ""));
    const sections = DAILY_CONTENT_SECTION_KEYS.flatMap((sectionKey) => {
      const sourceIssue = issues.find((issue) =>
        issue.sections.some((section) => section.sectionKey === sectionKey && section.items.length)
      );
      const section = sourceIssue?.sections.find((entry) => entry.sectionKey === sectionKey);
      return section ? [section] : [];
    });
    if (sections.length === 0) {
      return null;
    }
    await this.worldIntelContentService.migrateLegacyWorldIntelArticles(issues);
    const latest = issues[0];
    return {
      ...latest,
      id: "daily-content-composed-current",
      title: "今日隐者日报",
      homeSummary: "今日参悟、大陆新闻和离谱卷宗已按板块独立更新。",
      status: DailyContentStatus.Published,
      sections,
      publishedAt: latest.publishedAt
    };
  }

  private async findPublicIssueForRead(issueId: string): Promise<DailyContentIssue | null> {
    return issueId === "daily-content-composed-current"
      ? await this.findComposedPublishedIssue()
      : await this.findIssue(issueId);
  }

  private async findIssue(issueId: string): Promise<DailyContentIssue | null> {
    if (!this.isDatabaseConfigured()) {
      return this.memoryIssues.get(issueId) ?? null;
    }

    const record = await this.dailyContentIssue.findUnique({
      where: { id: issueId },
      include: issueInclude
    });
    return record ? recordToIssue(record) : null;
  }

  private async findIssues(): Promise<DailyContentIssue[]> {
    if (!this.isDatabaseConfigured()) {
      return [...this.memoryIssues.values()];
    }

    const records = await this.dailyContentIssue.findMany({
      include: issueInclude,
      orderBy: [{ updatedAt: "desc" }]
    });
    return records.map(recordToIssue);
  }

  private async saveNewIssue(issue: DailyContentIssue): Promise<DailyContentIssue> {
    if (!this.isDatabaseConfigured()) {
      this.memoryIssues.set(issue.id, issue);
      return issue;
    }

    const created = await this.dailyContentIssue.create({
      data: issueToCreateInput(issue),
      include: issueInclude
    });
    return recordToIssue(created);
  }

  private async replaceIssue(issue: DailyContentIssue): Promise<DailyContentIssue> {
    if (!this.isDatabaseConfigured()) {
      this.memoryIssues.set(issue.id, issue);
      return issue;
    }

    await this.dailyContentIssue.update({
      where: { id: issue.id },
      data: issueToUpdateInput(issue)
    });
    await syncIssueSectionsAndItems({
      issue,
      sectionDelegate: this.dailyContentSection,
      itemDelegate: this.dailyContentItem,
      likeDelegate: this.dailyContentItemLike,
      commentDelegate: this.dailyContentArticleComment
    });
    const record = await this.dailyContentIssue.findUnique({
      where: { id: issue.id },
      include: issueInclude
    });
    return recordToIssue(record!);
  }

  private async archivePublishedForBusinessDate(
    businessDate: string,
    exceptIssueId: string
  ): Promise<void> {
    const published = (await this.findIssues()).filter(
      (issue) =>
        issue.businessDate === businessDate &&
        issue.id !== exceptIssueId &&
        issue.status === DailyContentStatus.Published
    );
    for (const issue of published) {
      await this.replaceIssue({
        ...issue,
        status: DailyContentStatus.Archived,
        updatedAt: new Date().toISOString()
      });
    }
  }

  private async requireProfile(userId: string): Promise<void> {
    const response = await this.userGrowthProfileService.getProfile(userId);
    if (!response.profileCreated || !response.profile) {
      throw new ForbiddenException({
        errorCode: CommunityLiteErrorCode.ProfileRequired,
        message: "请先创建隐者档案"
      });
    }
  }

  private async countArticleComments(articleId: string): Promise<number> {
    if (this.isDatabaseConfigured()) {
      return this.dailyContentArticleComment.count({ where: { articleId, status: "approved" } });
    }
    return this.listPublicArticleComments(articleId).then((comments) => comments.length);
  }

  private async listPublicArticleComments(
    articleId: string
  ): Promise<DailyContentArticleComment[]> {
    if (this.isDatabaseConfigured()) {
      const records = await this.dailyContentArticleComment.findMany({
        where: { articleId, status: "approved" },
        orderBy: [{ approvedAt: "asc" }, { createdAt: "asc" }]
      });
      return records
        .map(recordToArticleComment)
        .map((comment) => articleCommentForViewer({ ...comment, status: "approved" }, {}));
    }

    return (this.memoryArticleComments.get(articleId) ?? [])
      .filter((comment) => comment.status === "approved")
      .map((comment) => articleCommentForViewer({ ...comment, status: "approved" }, {}));
  }

  private async listVisibleArticleComments(
    articleId: string,
    viewerUserId?: string
  ): Promise<DailyContentArticleComment[]> {
    if (this.isDatabaseConfigured()) {
      const records = await this.dailyContentArticleComment.findMany({
        where: {
          articleId,
          OR: [
            { status: "approved" },
            ...(viewerUserId ? [{ status: "pending", authorUserId: viewerUserId }] : [])
          ]
        },
        orderBy: [{ approvedAt: "asc" }, { createdAt: "asc" }]
      });
      return records.map((record) =>
        articleCommentForViewer(recordToArticleComment(record), {
          authorUserId: record.authorUserId,
          viewerUserId
        })
      );
    }

    return (this.memoryArticleComments.get(articleId) ?? [])
      .filter(
        (comment) =>
          comment.status === "approved" ||
          (viewerUserId && comment.status === "pending" && comment.authorUserId === viewerUserId)
      )
      .map((comment) =>
        articleCommentForViewer(comment, {
          authorUserId: comment.authorUserId,
          viewerUserId
        })
      );
  }

  private async countItemLikes(itemId: string): Promise<number> {
    if (!this.isDatabaseConfigured()) {
      return countSetPrefix(this.memoryLikes, `${itemId}:`);
    }
    return this.dailyContentItemLike.count({ where: { itemId } });
  }

  private async isItemLiked(itemId: string, userId: string): Promise<boolean> {
    if (!this.isDatabaseConfigured()) {
      return this.memoryLikes.has(`${itemId}:${userId}`);
    }
    return Boolean(
      await this.dailyContentItemLike.findUnique({ where: { itemId_userId: { itemId, userId } } })
    );
  }

  private async generateManualDraft(
    businessDate: string,
    sourceInputs: Array<Record<string, unknown>>
  ): Promise<{
    metadata: DailyContentAiDraftMetadata;
    draft?: GeneratedDailyContentDraft;
    sourceInputs: CollectedDailyContentSource[];
  }> {
    const modelName = this.configService.get<string>("DEEPSEEK_MODEL_NAME") || "deepseek-chat";
    const now = new Date().toISOString();
    const collectedSourceInputs =
      sourceInputs.length > 0 ? normalizeProvidedSourceInputs(sourceInputs, now) : [];
    return {
      metadata: {
        provider: "manual",
        modelName,
        promptVersion: "daily-content-manual-editor-v1",
        inputSourceSummary: summarizeSourceInputs(collectedSourceInputs),
        generatedAt: now,
        generationStatus: DailyContentGenerationStatus.NotRequested,
        failureReason: "日报第一版改为后台人工采编，AI 只基于当前编辑内容提供辅助建议"
      },
      sourceInputs: collectedSourceInputs
    };
  }

  private isDatabaseConfigured(): boolean {
    return (
      typeof this.prisma.isDatabaseConfigured !== "function" || this.prisma.isDatabaseConfigured()
    );
  }

  private async moderateArticleComment(
    userId: string,
    body: string
  ): Promise<{
    result: Awaited<ReturnType<AiContentModerationService["moderateUserContent"]>>;
    trace: DailyContentArticleComment["moderation"];
  }> {
    const lowCost = this.lowCostContentModerationService?.moderateFields({
      fields: [{ field: "body", value: body }]
    });

    if (lowCost?.decision === "reject") {
      const rejected = localDailyCommentModerationToAiResult(lowCost);
      return {
        result: rejected,
        trace: {
          lowCostModerationResult: lowCost,
          aiModerationResult: rejected,
          aiModerationReason: rejected.reason,
          manualReviewReason: rejected.manualReviewReason,
          contentSecuritySummary: rejected.contentSecuritySummary
        }
      };
    }

    const result = this.aiContentModerationService
      ? await this.aiContentModerationService.moderateUserContent({
          userId,
          contentType: "daily_article_comment",
          body
        })
      : missingDailyCommentProviderResult();

    return {
      result,
      trace: {
        lowCostModerationResult: lowCost,
        aiModerationResult: result,
        aiModerationReason: result.reason,
        manualReviewReason: result.manualReviewReason,
        contentSecuritySummary: result.contentSecuritySummary
      }
    };
  }

  private get dailyContentIssue(): DailyContentIssueDelegate {
    return (this.prisma as unknown as { dailyContentIssue: DailyContentIssueDelegate })
      .dailyContentIssue;
  }

  private get dailyContentItemLike(): DailyContentItemLikeDelegate {
    return (this.prisma as unknown as { dailyContentItemLike: DailyContentItemLikeDelegate })
      .dailyContentItemLike;
  }

  private get dailyContentSection(): DailyContentSectionDelegate {
    return (this.prisma as unknown as { dailyContentSection: DailyContentSectionDelegate })
      .dailyContentSection;
  }

  private get dailyContentItem(): DailyContentItemDelegate {
    return (this.prisma as unknown as { dailyContentItem: DailyContentItemDelegate })
      .dailyContentItem;
  }

  private get dailyContentArticleComment(): DailyContentArticleCommentDelegate {
    return (
      this.prisma as unknown as { dailyContentArticleComment: DailyContentArticleCommentDelegate }
    ).dailyContentArticleComment;
  }
}

const issueInclude = {
  sections: {
    include: { items: { orderBy: [{ sortOrder: "asc" }] } },
    orderBy: [{ sortOrder: "asc" }]
  }
};

function createFallbackDraftIssue(input: {
  id: string;
  businessDate: string;
  sectionKey?: DailyContentSectionKey;
  now: Date;
  metadata: DailyContentAiDraftMetadata;
  generatedDraft?: GeneratedDailyContentDraft;
  sourceInputs: CollectedDailyContentSource[];
}): DailyContentIssue {
  const now = input.now.toISOString();
  const generatedSections = normalizeGeneratedSections(
    input.generatedDraft,
    now,
    input.sourceInputs
  );
  return {
    id: input.id,
    businessDate: input.businessDate,
    title: input.generatedDraft?.title ?? "今日隐者日报",
    homeSummary:
      input.generatedDraft?.homeSummary ?? "日报草稿已生成，等待运营编辑来源、正文和审核结论。",
    status: DailyContentStatus.Draft,
    aiDraftMetadata: input.metadata,
    sections: (input.sectionKey ? [input.sectionKey] : DAILY_CONTENT_SECTION_KEYS).map(
      (sectionKey, sectionIndex) => ({
        sectionKey,
        title: DAILY_CONTENT_SECTION_LABELS[sectionKey],
        summary: generatedSections[sectionKey]?.summary ?? "待运营编辑本板块摘要。",
        items: createDraftItems({
          issueId: input.id,
          sectionKey,
          sectionIndex,
          now,
          generatedItems: generatedSections[sectionKey]?.items ?? []
        })
      })
    ),
    createdAt: now,
    updatedAt: now
  };
}

function createDraftItems(input: {
  issueId: string;
  sectionKey: DailyContentSectionKey;
  sectionIndex: number;
  now: string;
  generatedItems: Array<Omit<DailyContentItem, "id" | "sectionKey" | "likeCount" | "viewerLiked">>;
}): DailyContentItem[] {
  const limit = input.sectionKey === DailyContentSectionKey.DailyReflection ? 1 : 10;
  const sourceItems =
    input.generatedItems.length > 0
      ? input.generatedItems.slice(0, limit)
      : createFallbackSectionItems(input.sectionKey, input.now, limit);

  return sourceItems.map((item, itemIndex) => ({
    ...item,
    id: `${input.issueId}-item-${input.sectionIndex + 1}-${itemIndex + 1}`,
    sectionKey: input.sectionKey,
    likeCount: 0
  }));
}

function createFallbackSectionItems(
  sectionKey: DailyContentSectionKey,
  now: string,
  count: number
): Array<Omit<DailyContentItem, "id" | "sectionKey" | "likeCount" | "viewerLiked">> {
  if (sectionKey === DailyContentSectionKey.DailyReflection) {
    return [
      {
        title: "今日参悟",
        summary: "把大任务切成小飞镖，先命中一件，再假装只是顺手。",
        body: "今日参悟：把大任务切成小飞镖，先命中一件，再假装只是顺手。",
        allowLike: true,
        allowCommunityQuote: true,
        quotePrompt: "我从今日参悟想到："
      }
    ];
  }

  return Array.from({ length: count }, (_, index) => {
    const order = index + 1;
    const label = DAILY_CONTENT_SECTION_LABELS[sectionKey];
    return {
      title: `${label}测试文章 ${order}`,
      summary:
        sectionKey === DailyContentSectionKey.WorldIntel
          ? `第 ${order} 条工位情报：今天适合把信息差整理成一张小纸条。`
          : `第 ${order} 份离谱卷宗：看似荒诞，其实很适合拿来发帖吐槽。`,
      body:
        sectionKey === DailyContentSectionKey.WorldIntel
          ? `这是一篇用于测试的大陆新闻文章 ${order}。它不声称来自真实新闻，只用于验证列表、详情、点赞、评论和引用发帖链路。等 DeepSeek 或运营来源可用后，后台可以替换成正式内容。`
          : `这是一篇用于测试的离谱卷宗文章 ${order}。它保留摸鱼侠的吐槽口吻，但不表达为真实已核验事件，适合验证详情页互动、评论审核和引用到茶馆。`,
      source: {
        sourceType: DailyContentSourceType.Original,
        sourceName: "本地测试草稿",
        publicSourceText: "本地测试内容，待运营替换真实来源",
        collectedAt: now
      },
      allowLike: true,
      allowCommunityQuote: true,
      quotePrompt: `我从「${label}测试文章 ${order}」想到：`
    };
  });
}

function recordToIssue(record: DailyContentIssueRecord): DailyContentIssue {
  return {
    id: record.id,
    businessDate: record.businessDate,
    title: record.title,
    homeSummary: record.homeSummary,
    status: normalizeStatus(record.status),
    scheduledPublishAt: record.scheduledPublishAt?.toISOString(),
    publishedAt: record.publishedAt?.toISOString(),
    reviewedAt: record.reviewedAt?.toISOString(),
    reviewedBy: record.reviewedBy ?? undefined,
    reviewNote: record.reviewNote ?? undefined,
    aiDraftMetadata: normalizeAiMetadata(record.aiDraftMetadata),
    internalRiskTags: normalizeStringArray(record.internalRiskTags),
    sections: (record.sections ?? []).map(recordToSection),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

function recordToSection(record: DailyContentSectionRecord): DailyContentSection {
  const sectionKey = record.sectionKey as DailyContentSectionKey;
  return {
    sectionKey,
    title: record.title,
    summary: record.summary,
    illustrationKey: record.illustrationKey ?? undefined,
    sortOrder: record.sortOrder,
    items: (record.items ?? []).map(recordToItem)
  };
}

function recordToItem(record: DailyContentItemRecord): DailyContentItem {
  return {
    id: record.id,
    sectionKey: record.sectionKey as DailyContentSectionKey,
    title: record.title,
    summary: record.summary,
    body: record.body,
    source: normalizeSource(record.source),
    sortOrder: record.sortOrder,
    allowLike: record.allowLike,
    allowCommunityQuote: record.allowCommunityQuote,
    quotePrompt: record.quotePrompt ?? undefined,
    likeCount: 0
  };
}

function issueToCreateInput(issue: DailyContentIssue): Record<string, unknown> {
  return {
    id: issue.id,
    businessDate: issue.businessDate,
    title: issue.title,
    homeSummary: issue.homeSummary,
    status: issue.status,
    scheduledPublishAt: issue.scheduledPublishAt ? new Date(issue.scheduledPublishAt) : null,
    publishedAt: issue.publishedAt ? new Date(issue.publishedAt) : null,
    reviewedAt: issue.reviewedAt ? new Date(issue.reviewedAt) : null,
    reviewedBy: issue.reviewedBy,
    reviewNote: issue.reviewNote,
    aiDraftMetadata: issue.aiDraftMetadata,
    internalRiskTags: issue.internalRiskTags ?? [],
    sections: {
      create: issue.sections.map((section, sectionIndex) => ({
        sectionKey: section.sectionKey,
        title: section.title,
        summary: section.summary,
        illustrationKey: section.illustrationKey,
        sortOrder: sectionIndex,
        items: {
          create: section.items.map((item, itemIndex) => ({
            id: item.id,
            issueId: issue.id,
            sectionKey: item.sectionKey,
            title: item.title,
            summary: item.summary,
            body: item.body,
            source: item.source,
            allowLike: item.allowLike,
            allowCommunityQuote: item.allowCommunityQuote,
            quotePrompt: item.quotePrompt,
            sortOrder: itemIndex
          }))
        }
      }))
    }
  };
}

function issueToUpdateInput(issue: DailyContentIssue): Record<string, unknown> {
  return {
    title: issue.title,
    homeSummary: issue.homeSummary,
    status: issue.status,
    scheduledPublishAt: issue.scheduledPublishAt ? new Date(issue.scheduledPublishAt) : null,
    publishedAt: issue.publishedAt ? new Date(issue.publishedAt) : null,
    reviewedAt: issue.reviewedAt ? new Date(issue.reviewedAt) : null,
    reviewedBy: issue.reviewedBy,
    reviewNote: issue.reviewNote,
    aiDraftMetadata: issue.aiDraftMetadata,
    internalRiskTags: issue.internalRiskTags ?? []
  };
}

async function syncIssueSectionsAndItems(input: {
  issue: DailyContentIssue;
  sectionDelegate: DailyContentSectionDelegate;
  itemDelegate: DailyContentItemDelegate;
  likeDelegate: DailyContentItemLikeDelegate;
  commentDelegate: DailyContentArticleCommentDelegate;
}): Promise<void> {
  const nextItemIds = input.issue.sections.flatMap((section) =>
    section.items.map((item) => item.id)
  );
  await input.likeDelegate.deleteMany({
    where: { item: { issueId: input.issue.id }, itemId: { notIn: nextItemIds } }
  });
  await input.commentDelegate.deleteMany({
    where: { article: { issueId: input.issue.id }, articleId: { notIn: nextItemIds } }
  });
  await input.itemDelegate.deleteMany({
    where: { issueId: input.issue.id, id: { notIn: nextItemIds } }
  });

  for (const [sectionIndex, section] of input.issue.sections.entries()) {
    const sectionRecord = await input.sectionDelegate.upsert({
      where: { issueId_sectionKey: { issueId: input.issue.id, sectionKey: section.sectionKey } },
      create: {
        issueId: input.issue.id,
        sectionKey: section.sectionKey,
        title: section.title,
        summary: section.summary,
        illustrationKey: section.illustrationKey,
        sortOrder: section.sortOrder ?? sectionIndex
      },
      update: {
        title: section.title,
        summary: section.summary,
        illustrationKey: section.illustrationKey,
        sortOrder: section.sortOrder ?? sectionIndex
      }
    });

    for (const [itemIndex, item] of section.items.entries()) {
      await input.itemDelegate.upsert({
        where: { id: item.id },
        create: itemToUpsertInput(item, input.issue.id, sectionRecord.id, itemIndex),
        update: itemToUpsertInput(item, input.issue.id, sectionRecord.id, itemIndex)
      });
    }
  }
}

function itemToUpsertInput(
  item: DailyContentItem,
  issueId: string,
  sectionId: string,
  itemIndex: number
): Record<string, unknown> {
  return {
    id: item.id,
    sectionId,
    issueId,
    sectionKey: item.sectionKey,
    title: item.title,
    summary: item.summary,
    body: item.body,
    source: item.source,
    allowLike: item.allowLike,
    allowCommunityQuote: item.allowCommunityQuote,
    quotePrompt: item.quotePrompt,
    sortOrder: item.sortOrder ?? itemIndex
  };
}

function normalizeEditableSections(
  issueId: string,
  sections: AdminDailyContentIssueUpdateRequest["sections"]
): DailyContentSection[] {
  return (sections ?? []).map((section, sectionIndex) => {
    assertDailyContentEditableSection(section.sectionKey);
    return {
      sectionKey: section.sectionKey,
      title: section.title ?? DAILY_CONTENT_SECTION_LABELS[section.sectionKey],
      summary: section.summary,
      illustrationKey: section.illustrationKey,
      sortOrder: section.sortOrder ?? sectionIndex,
      items: section.items
        .slice(0, section.sectionKey === DailyContentSectionKey.DailyReflection ? 1 : 10)
        .map((item, itemIndex) => ({
          id: item.id ?? `${issueId}-${section.sectionKey}-item-${Date.now()}-${itemIndex + 1}`,
          sectionKey: section.sectionKey,
          title: item.title,
          summary: item.summary,
          body: item.body,
          source: item.source,
          sortOrder: item.sortOrder ?? itemIndex,
          allowLike: item.allowLike ?? true,
          allowCommunityQuote: item.allowCommunityQuote ?? true,
          quotePrompt: item.quotePrompt,
          likeCount: 0
        }))
    };
  });
}

function recordToArticleComment(
  record: DailyContentArticleCommentRecord
): DailyContentArticleComment {
  return {
    id: record.id,
    articleId: record.articleId,
    body: record.body,
    author:
      record.authorSnapshot && typeof record.authorSnapshot === "object"
        ? (record.authorSnapshot as DailyContentArticleComment["author"])
        : {
            displayName: "匿名隐者",
            avatarKey: "avatar_default",
            factionLabel: "隐者",
            level: 1,
            titleKey: "novice"
          },
    status: normalizeCommentStatus(record.status),
    createdAt: record.createdAt.toISOString(),
    approvedAt: record.approvedAt?.toISOString() ?? "",
    reviewedAt: record.reviewedAt?.toISOString(),
    reviewedBy: record.reviewedBy ?? undefined,
    reviewNote: record.reviewNote ?? undefined,
    moderation:
      record.moderation && typeof record.moderation === "object"
        ? (record.moderation as DailyContentArticleComment["moderation"])
        : undefined
  };
}

function normalizeCommentStatus(value: string): DailyContentArticleComment["status"] {
  return ["pending", "approved", "rejected", "hidden"].includes(value)
    ? (value as DailyContentArticleComment["status"])
    : "pending";
}

function createPreviewSummary(issue: DailyContentIssue) {
  const publishedLikeIssue = {
    ...issue,
    status: DailyContentStatus.Published,
    publishedAt: issue.publishedAt ?? new Date().toISOString()
  };
  return {
    id: publishedLikeIssue.id,
    businessDate: publishedLikeIssue.businessDate,
    title: publishedLikeIssue.title,
    homeSummary: publishedLikeIssue.homeSummary,
    status: DailyContentStatus.Published,
    publishedAt: publishedLikeIssue.publishedAt,
    reflection: {
      id:
        issue.sections.find(
          (section) => section.sectionKey === DailyContentSectionKey.DailyReflection
        )?.items[0]?.id ?? `${issue.id}-reflection`,
      text:
        issue.sections.find(
          (section) => section.sectionKey === DailyContentSectionKey.DailyReflection
        )?.items[0]?.summary ?? "今日参悟尚未写入。",
      quotePrompt:
        issue.sections.find(
          (section) => section.sectionKey === DailyContentSectionKey.DailyReflection
        )?.items[0]?.quotePrompt ?? "我从今日参悟想到："
    },
    columns: [DailyContentSectionKey.WorldIntel, DailyContentSectionKey.AbsurdCasefile].map(
      (sectionKey) => {
        const section = issue.sections.find((entry) => entry.sectionKey === sectionKey);
        return {
          sectionKey,
          title: DAILY_CONTENT_SECTION_LABELS[sectionKey],
          summary: section?.summary ?? "本栏目尚未发布内容。",
          illustrationKey: section?.illustrationKey ?? `daily_${sectionKey}`,
          articleCount: Math.min(section?.items.length ?? 0, 10)
        };
      }
    ),
    sections: issue.sections.map((section) => ({
      sectionKey: section.sectionKey,
      title: section.title,
      summary: section.summary
    }))
  };
}

function normalizeStatus(value: string) {
  return Object.values(DailyContentStatus).includes(value as DailyContentStatus)
    ? (value as DailyContentStatus)
    : DailyContentStatus.Archived;
}

function normalizeAiMetadata(value: unknown): DailyContentAiDraftMetadata | undefined {
  return value && typeof value === "object" ? (value as DailyContentAiDraftMetadata) : undefined;
}

function normalizeSource(value: unknown) {
  return value && typeof value === "object" ? (value as DailyContentItem["source"]) : undefined;
}

function normalizeStringArray(value: unknown): readonly string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function normalizeGeneratedSections(
  draft: GeneratedDailyContentDraft | undefined,
  now: string,
  sourceInputs: CollectedDailyContentSource[]
): Record<
  DailyContentSectionKey,
  {
    summary: string;
    items: Array<Omit<DailyContentItem, "id" | "sectionKey" | "likeCount" | "viewerLiked">>;
  }
> {
  const empty: Record<
    DailyContentSectionKey,
    {
      summary: string;
      items: Array<Omit<DailyContentItem, "id" | "sectionKey" | "likeCount" | "viewerLiked">>;
    }
  > = {
    [DailyContentSectionKey.DailyReflection]: { summary: "", items: [] },
    [DailyContentSectionKey.WorldIntel]: { summary: "", items: [] },
    [DailyContentSectionKey.AbsurdCasefile]: { summary: "", items: [] }
  };

  if (!draft) {
    return empty;
  }

  for (const section of draft.sections) {
    if (!DAILY_CONTENT_SECTION_KEYS.includes(section.sectionKey)) {
      continue;
    }

    empty[section.sectionKey] = {
      summary: normalizeText(
        section.summary,
        `${DAILY_CONTENT_SECTION_LABELS[section.sectionKey]}摘要`
      ),
      items: section.items
        .slice(0, section.sectionKey === DailyContentSectionKey.DailyReflection ? 1 : 10)
        .map((item, itemIndex) => {
          const source = findGeneratedItemSource({
            item,
            sectionKey: section.sectionKey,
            itemIndex,
            sourceInputs,
            now
          });
          return {
            title: normalizeText(
              item.title,
              source?.sourceTitle ?? `${DAILY_CONTENT_SECTION_LABELS[section.sectionKey]}内容`
            ),
            summary: normalizeText(item.summary, "今日日报内容摘要"),
            body: normalizeText(item.body, "今日日报正文"),
            source,
            allowLike: true,
            allowCommunityQuote: true,
            quotePrompt: normalizeText(item.quotePrompt, "我从这条日报想到：")
          };
        })
    };
  }

  return empty;
}

function normalizeProvidedSourceInputs(
  sourceInputs: Array<Record<string, unknown>>,
  now: string
): CollectedDailyContentSource[] {
  return sourceInputs
    .map((source, index) => {
      const sectionKey = normalizeSectionKey(source.sectionKey);
      const sourceIndex = normalizeOptionalNumber(source.sourceIndex) ?? index + 1;
      return {
        sectionKey,
        sourceIndex,
        sourceTitle: normalizeOptionalText(source.sourceTitle),
        sourceName: normalizeOptionalText(source.sourceName),
        sourceUrl: normalizeOptionalText(source.sourceUrl),
        sourceType: isDailyContentSourceTypeValue(source.sourceType)
          ? (source.sourceType as DailyContentSourceType)
          : DailyContentSourceType.Curated,
        imageUrl: normalizeOptionalText(source.imageUrl),
        publishedAt: normalizeOptionalText(source.publishedAt),
        collectedAt: normalizeOptionalText(source.collectedAt) ?? now,
        searchQuery: normalizeOptionalText(source.searchQuery),
        publicSourceText: normalizeOptionalText(source.publicSourceText)
      };
    })
    .filter((source) => Boolean(source.sourceUrl && (source.sourceTitle || source.sourceName)));
}

function countSectionSources(
  sourceInputs: CollectedDailyContentSource[],
  sectionKey: DailyContentSectionKey
): number {
  return sourceInputs.filter((source) => source.sectionKey === sectionKey).length;
}

function summarizeSourceInputs(sourceInputs: CollectedDailyContentSource[]): string {
  return [
    `source_count=${sourceInputs.length}`,
    `daily_reflection=${countSectionSources(sourceInputs, DailyContentSectionKey.DailyReflection)}`,
    `world_intel=${countSectionSources(sourceInputs, DailyContentSectionKey.WorldIntel)}`,
    `absurd_casefile=${countSectionSources(sourceInputs, DailyContentSectionKey.AbsurdCasefile)}`
  ].join(";");
}

function findGeneratedItemSource(input: {
  item: GeneratedDailyContentDraft["sections"][number]["items"][number];
  sectionKey: DailyContentSectionKey;
  itemIndex: number;
  sourceInputs: CollectedDailyContentSource[];
  now: string;
}): DailyContentSourceInput | undefined {
  const matchedSource =
    input.sourceInputs.find(
      (source) =>
        source.sectionKey === input.sectionKey &&
        input.item.sourceIndex !== undefined &&
        source.sourceIndex === input.item.sourceIndex
    ) ??
    input.sourceInputs.filter((source) => source.sectionKey === input.sectionKey)[input.itemIndex];

  if (!matchedSource && input.sectionKey === DailyContentSectionKey.DailyReflection) {
    return undefined;
  }

  const sourceTitle = input.item.sourceTitle ?? matchedSource?.sourceTitle;
  const sourceName = input.item.sourceName ?? matchedSource?.sourceName;
  const sourceUrl = input.item.sourceUrl ?? matchedSource?.sourceUrl;

  if (!sourceUrl || (!sourceTitle && !sourceName)) {
    return undefined;
  }

  return {
    sourceType: matchedSource?.sourceType ?? DailyContentSourceType.Curated,
    sectionKey: input.sectionKey,
    sourceIndex: input.item.sourceIndex ?? matchedSource?.sourceIndex ?? input.itemIndex + 1,
    sourceTitle,
    sourceName,
    sourceUrl,
    imageUrl: input.item.imageUrl ?? matchedSource?.imageUrl,
    publishedAt: input.item.publishedAt ?? matchedSource?.publishedAt,
    collectedAt: matchedSource?.collectedAt ?? input.now,
    searchQuery: matchedSource?.searchQuery,
    publicSourceText:
      input.item.publicSourceText ??
      matchedSource?.publicSourceText ??
      [sourceName, sourceTitle].filter(Boolean).join("：")
  };
}

function normalizeSectionKey(value: unknown): DailyContentSectionKey {
  const sectionKey = DAILY_CONTENT_SECTION_KEYS.includes(value as DailyContentSectionKey)
    ? (value as DailyContentSectionKey)
    : DailyContentSectionKey.WorldIntel;
  assertDailyContentEditableSection(sectionKey);
  return sectionKey;
}

function normalizePublishSectionKeys(sectionKeys: string[]): DailyContentSectionKey[] {
  const normalized = Array.isArray(sectionKeys)
    ? sectionKeys.filter((sectionKey): sectionKey is DailyContentSectionKey =>
        DAILY_CONTENT_SECTION_KEYS.includes(sectionKey as DailyContentSectionKey)
      )
    : [];

  if (normalized.length === 0) {
    throw new BadRequestException({
      errorCode: "daily_content_publish_section_required",
      message: "请选择至少一个要发布的日报板块"
    });
  }

  const unique = [...new Set(normalized)];
  for (const sectionKey of unique) {
    assertDailyContentEditableSection(sectionKey);
  }
  return unique;
}

function normalizeRequiredSectionKey(sectionKey: string): DailyContentSectionKey {
  if (!isDailyContentSectionKey(sectionKey)) {
    throw new BadRequestException({
      errorCode: "daily_content_invalid_section_key",
      message: "日报板块 key 无效"
    });
  }

  return sectionKey;
}

function assertDailyContentEditableSection(sectionKey: DailyContentSectionKey): void {
  if (sectionKey === DailyContentSectionKey.WorldIntel) {
    throw new BadRequestException({
      errorCode: "daily_content_world_intel_standalone",
      message: "大陆新闻已迁移到独立内容库，请使用大陆新闻管理接口"
    });
  }
}

function normalizeOptionalText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeOptionalNumber(value: unknown): number | undefined {
  return Number.isInteger(value) ? (value as number) : undefined;
}

function normalizeText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function parseDailyContentImageDataUrl(
  dataUrl: unknown,
  providedMimeType?: string
): { mimeType: string; buffer: Buffer } {
  if (typeof dataUrl !== "string") {
    throw new BadRequestException({
      errorCode: "daily_content_asset_invalid",
      message: "图片上传数据无效"
    });
  }

  const matched = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([a-zA-Z0-9+/=]+)$/);
  if (!matched) {
    throw new BadRequestException({
      errorCode: "daily_content_asset_invalid",
      message: "图片上传数据必须是 base64 data URL"
    });
  }

  const mimeType = providedMimeType || matched[1];
  return {
    mimeType,
    buffer: Buffer.from(matched[2], "base64")
  };
}

function normalizeUploadFileName(fileName: unknown, extension: string, fallback: string): string {
  if (typeof fileName !== "string" || !fileName.trim()) {
    return `${fallback}${extension}`;
  }
  const baseName = fileName
    .replace(/[\\/:"*?<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 80);
  return baseName.toLowerCase().endsWith(extension) ? baseName : `${baseName}${extension}`;
}

function getDailyContentUploadDir(): string {
  const cwd = process.cwd();
  return cwd.endsWith(`${join("apps", "api")}`)
    ? resolve(cwd, "uploads", "daily-content")
    : resolve(cwd, "apps", "api", "uploads", "daily-content");
}

function parseFutureDate(value: string): Date {
  const scheduledAt = new Date(value);
  if (!value || Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
    throw new BadRequestException({
      errorCode: "daily_content_invalid_schedule_time",
      message: "定时发布时间必须晚于当前时间"
    });
  }
  return scheduledAt;
}

function assertDailyCommentReviewable(status: string): void {
  if (status !== "pending") {
    throw new ConflictException({
      errorCode: "daily_content_comment_state_changed",
      message: "日报评论状态已变化，请刷新后再处理"
    });
  }
}

function assertDailyContentIssueValid(issue: DailyContentIssue): void {
  try {
    validateDailyContentIssue(issue);
  } catch (error) {
    throwDailyContentValidationError(error);
  }
}

function assertDailyContentPublishReady(issue: DailyContentIssue): void {
  try {
    validateDailyContentForSubmitOrPublish(issue);
  } catch (error) {
    throwDailyContentValidationError(error);
  }
}

function assertDailyContentSectionPublishReady(
  issue: DailyContentIssue,
  sectionKey: DailyContentSectionKey
): void {
  try {
    validateDailyContentSectionForPublish(issue, sectionKey);
  } catch (error) {
    throwDailyContentValidationError(error);
  }
}

function throwDailyContentValidationError(error: unknown): never {
  if (error instanceof DailyContentValidationError) {
    throw new BadRequestException({
      errorCode: "daily_content_validation_failed",
      message: error.message,
      issues: error.issues
    });
  }
  throw error;
}

function isDailyContentSourceTypeValue(value: unknown): value is DailyContentSourceType {
  return value === DailyContentSourceType.Original || value === DailyContentSourceType.Curated;
}

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
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

function moderationResultToDailyCommentStatus(
  decision: AiModerationDecision
): "pending" | "approved" | "rejected" {
  if (decision === AiModerationDecision.Approved) {
    return "approved";
  }
  if (decision === AiModerationDecision.Rejected) {
    return "rejected";
  }
  return "pending";
}

function articleCommentForViewer(
  comment: DailyContentArticleComment,
  context: { authorUserId?: string; viewerUserId?: string }
): DailyContentArticleComment {
  const visibleToAuthorOnly =
    comment.status === "pending" &&
    context.viewerUserId !== undefined &&
    context.authorUserId === context.viewerUserId;
  return {
    ...comment,
    visibleToAuthorOnly: visibleToAuthorOnly ? true : undefined,
    reviewNote: undefined,
    moderation: undefined
  };
}

function localDailyCommentModerationToAiResult(
  moderation: LowCostContentModerationResult
): Awaited<ReturnType<AiContentModerationService["moderateUserContent"]>> {
  const now = moderation.moderatedAt;
  const decision =
    moderation.decision === LowCostModerationDecision.Reject
      ? AiModerationDecision.Rejected
      : moderation.decision === LowCostModerationDecision.Pass
        ? AiModerationDecision.Approved
        : AiModerationDecision.NeedsManualReview;
  return {
    decision,
    source: "manual_fallback" as const,
    confidence: decision === AiModerationDecision.Approved ? 0.9 : 0,
    riskTags: moderation.riskTags as never,
    reason: moderation.reason,
    manualReviewReason:
      decision === AiModerationDecision.NeedsManualReview ? "grey_area" : undefined,
    moderatedAt: now,
    contentSecuritySummary: createContentSecuritySummary({
      source: ContentSecuritySource.LocalRules,
      decision:
        decision === AiModerationDecision.Approved
          ? ContentSecurityDecision.Approved
          : decision === AiModerationDecision.Rejected
            ? ContentSecurityDecision.Rejected
            : ContentSecurityDecision.NeedsManualReview,
      riskTags:
        moderation.riskTags.length > 0
          ? (moderation.riskTags as never)
          : [ContentSecurityRiskTag.Safe],
      reason: moderation.reason,
      suggestion: moderation.suggestion,
      manualReviewReason:
        decision === AiModerationDecision.NeedsManualReview
          ? ContentSecurityManualReviewReason.GreyArea
          : undefined,
      normalizedAt: now
    })
  };
}

function missingDailyCommentProviderResult(): Awaited<
  ReturnType<AiContentModerationService["moderateUserContent"]>
> {
  const now = new Date().toISOString();
  return {
    decision: AiModerationDecision.NeedsManualReview,
    source: "manual_fallback" as const,
    confidence: 0,
    riskTags: ["provider_failure" as const],
    reason: "内容安全服务未注册，已转入人工复核。",
    manualReviewReason: "provider_unavailable" as const,
    moderatedAt: now,
    contentSecuritySummary: createContentSecuritySummary({
      source: ContentSecuritySource.ManualFallback,
      decision: ContentSecurityDecision.NeedsManualReview,
      riskTags: [ContentSecurityRiskTag.ProviderFailure],
      reason: "内容安全服务未注册，已转入人工复核。",
      manualReviewReason: ContentSecurityManualReviewReason.ProviderUnavailable,
      normalizedAt: now
    })
  };
}

function createDailyCommentModerationMessage(
  status: "pending" | "approved" | "rejected",
  moderationReason: string
): string {
  if (status === "approved") {
    return "评论已通过内容安全审核并公开";
  }
  if (status === "rejected") {
    return moderationReason;
  }
  return "评论审核中，仅自己可见，通过后其他隐者可见";
}

function validateAiAssistedSources(sections: DailyContentSection[]): string[] {
  const warnings: string[] = [];
  for (const item of sections.flatMap((section) => section.items)) {
    if (!item.source) {
      continue;
    }
    if (item.source.sourceUrl && !item.source.publicSourceText) {
      warnings.push(`「${item.title}」来源链接缺少公开来源说明，需人工补齐。`);
    }
    item.source.inputMode = "admin_manual";
  }
  return warnings;
}
