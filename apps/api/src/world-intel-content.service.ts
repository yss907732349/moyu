import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import {
  AiModerationDecision,
  ContentSecurityDecision,
  ContentSecurityManualReviewReason,
  ContentSecurityRiskTag,
  ContentSecuritySource,
  CommunityLiteErrorCode,
  DailyContentSectionKey,
  DailyContentSourceType,
  LowCostModerationDecision,
  WorldIntelArticleStatus,
  createContentSecuritySummary,
  createCommunityAuthorSnapshot,
  extractFirstWorldIntelBodyImageUrl,
  toWorldIntelArticleDetail,
  toWorldIntelArticleSummary,
  validateWorldIntelArticleSourceForPublish,
  type AdminWorldIntelArticleInput,
  type AdminWorldIntelArticleResponse,
  type AdminWorldIntelBatchCreateRequest,
  type AdminWorldIntelBatchCreateResponse,
  type AdminWorldIntelListResponse,
  type CreateDailyContentArticleCommentResponse,
  type DailyContentArticleComment,
  type DailyContentLikeResponse,
  type DailyContentQuoteSnapshot,
  type DailyContentItem,
  type DailyContentIssue,
  type DailyContentSourceInput,
  type GetWorldIntelArticleDetailResponse,
  type GetWorldIntelArticlesResponse,
  type WorldIntelArticle,
  type LowCostContentModerationResult
} from "@moyuxia/shared";
import { AiContentModerationService } from "./ai-content-moderation.service";
import { LowCostContentModerationService } from "./low-cost-content-moderation.service";
import { PrismaService } from "./prisma.service";
import { UserGrowthProfileService } from "./user-growth-profile.service";

interface WorldIntelArticleRecord {
  id: string;
  title: string;
  summary: string;
  body: string;
  source: unknown;
  coverImageUrl: string | null;
  coverImageKey: string | null;
  status: string;
  publishedAt: Date | null;
  sortOrder: number;
  allowLike: boolean;
  allowCommunityQuote: boolean;
  quotePrompt: string | null;
  legacyDailyContentItemId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface WorldIntelArticleDelegate {
  create(input: Record<string, unknown>): Promise<WorldIntelArticleRecord>;
  findMany(input: Record<string, unknown>): Promise<WorldIntelArticleRecord[]>;
  findUnique(input: Record<string, unknown>): Promise<WorldIntelArticleRecord | null>;
  update(input: Record<string, unknown>): Promise<WorldIntelArticleRecord>;
  count(input: Record<string, unknown>): Promise<number>;
}

@Injectable()
export class WorldIntelContentService {
  private readonly memoryArticles = new Map<string, WorldIntelArticle>();
  private readonly memoryLikes = new Set<string>();
  private readonly memoryComments = new Map<
    string,
    Array<
      DailyContentArticleComment & {
        authorUserId?: string;
        status: "pending" | "approved" | "rejected" | "hidden";
      }
    >
  >();
  private legacyIssueProvider?: () => Promise<DailyContentIssue[]>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly userGrowthProfileService?: UserGrowthProfileService,
    private readonly aiContentModerationService?: AiContentModerationService,
    private readonly lowCostContentModerationService?: LowCostContentModerationService
  ) {}

  registerLegacyIssueProvider(provider: () => Promise<DailyContentIssue[]>): void {
    this.legacyIssueProvider = provider;
  }

  async listPublicArticles(query: {
    page?: string | number;
    pageSize?: string | number;
  }): Promise<GetWorldIntelArticlesResponse> {
    await this.migrateLegacyWorldIntelArticles(await this.loadLegacyIssues());
    const pagination = normalizePagination(query.page, query.pageSize);
    const allArticles = await this.findAllArticles();
    const published = allArticles
      .filter(
        (article) => article.status === WorldIntelArticleStatus.Published && article.publishedAt
      )
      .sort(comparePublicArticles);
    const pageArticles = published.slice(
      (pagination.page - 1) * pagination.pageSize,
      pagination.page * pagination.pageSize
    );

    return {
      articles: pageArticles
        .map(toWorldIntelArticleSummary)
        .filter((article): article is NonNullable<typeof article> => Boolean(article)),
      pagination: {
        ...pagination,
        total: published.length,
        hasMore: pagination.page * pagination.pageSize < published.length
      }
    };
  }

  async getPublicArticle(
    articleId: string,
    viewerUserId?: string
  ): Promise<GetWorldIntelArticleDetailResponse> {
    await this.migrateLegacyWorldIntelArticles(await this.loadLegacyIssues());
    const article = await this.findArticle(articleId);
    const detail = article ? toWorldIntelArticleDetail(article) : null;
    if (!detail) {
      throw new NotFoundException({
        errorCode: "world_intel_article_not_found",
        message: "大陆新闻不存在或尚未公开"
      });
    }
    return {
      article: {
        ...detail,
        likeCount: await this.countLikes(articleId)
      },
      comments: await this.listVisibleComments(articleId, viewerUserId)
    };
  }

  async setArticleLike(
    userId: string,
    articleId: string,
    liked: boolean
  ): Promise<DailyContentLikeResponse> {
    await this.requireProfile(userId);
    const article = await this.findArticle(articleId);
    if (!article || article.status !== WorldIntelArticleStatus.Published || !article.allowLike) {
      throw new BadRequestException({
        errorCode: "world_intel_article_not_public",
        message: "只能点赞已发布大陆新闻"
      });
    }

    const key = `${articleId}:${userId}`;
    if (liked) {
      this.memoryLikes.add(key);
    } else {
      this.memoryLikes.delete(key);
    }
    return {
      issueId: "world-intel",
      itemId: articleId,
      liked,
      likeCount: await this.countLikes(articleId)
    };
  }

  async createArticleComment(
    userId: string,
    articleId: string,
    body: string
  ): Promise<CreateDailyContentArticleCommentResponse> {
    const profileResponse = await this.requireProfile(userId);
    const article = await this.findArticle(articleId);
    if (!article || article.status !== WorldIntelArticleStatus.Published) {
      throw new BadRequestException({
        errorCode: "world_intel_article_not_public",
        message: "只能评论已发布大陆新闻"
      });
    }

    const trimmedBody = typeof body === "string" ? body.trim() : "";
    if (trimmedBody.length < 2 || trimmedBody.length > 500) {
      throw new BadRequestException({
        errorCode: "world_intel_comment_invalid",
        message: "评论需为 2-500 个字"
      });
    }

    const moderation = await this.moderateArticleComment(userId, trimmedBody);
    const status = moderationResultToCommentStatus(moderation.result.decision);
    const now = new Date().toISOString();
    const comment: DailyContentArticleComment & {
      authorUserId?: string;
      status: "pending" | "approved" | "rejected" | "hidden";
    } = {
      id: `world-intel-comment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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
    this.memoryComments.set(articleId, [...(this.memoryComments.get(articleId) ?? []), comment]);

    return {
      commentId: comment.id,
      status,
      message: createModerationMessage(status, moderation.result.reason)
    };
  }

  async createQuoteSnapshot(articleId: string): Promise<DailyContentQuoteSnapshot> {
    const article = await this.findArticle(articleId);
    if (
      !article ||
      article.status !== WorldIntelArticleStatus.Published ||
      !article.allowCommunityQuote
    ) {
      throw new BadRequestException({
        errorCode: "world_intel_quote_unavailable",
        message: "大陆新闻引用不可用"
      });
    }

    return {
      sourceType: "world_intel_article",
      issueId: "world-intel",
      itemId: article.id,
      articleId: article.id,
      sectionKey: DailyContentSectionKey.WorldIntel,
      sectionLabel: "大陆新闻",
      title: article.title,
      summary: article.summary,
      quotePrompt: article.quotePrompt
    };
  }

  async getPublishedSummary(): Promise<{ articleCount: number; latestSummary?: string }> {
    await this.migrateLegacyWorldIntelArticles(await this.loadLegacyIssues());
    const published = (await this.findAllArticles())
      .filter(
        (article) => article.status === WorldIntelArticleStatus.Published && article.publishedAt
      )
      .sort(comparePublicArticles);
    return {
      articleCount: published.length,
      latestSummary: published[0]?.summary
    };
  }

  async listAdminArticles(query: {
    status?: string;
    keyword?: string;
    page?: string | number;
    pageSize?: string | number;
  }): Promise<AdminWorldIntelListResponse> {
    const pagination = normalizePagination(query.page, query.pageSize);
    const keyword = normalizeOptionalText(query.keyword)?.toLowerCase();
    const status = query.status && isWorldIntelStatus(query.status) ? query.status : undefined;
    const filtered = (await this.findAllArticles())
      .filter((article) => !status || article.status === status)
      .filter(
        (article) =>
          !keyword ||
          article.title.toLowerCase().includes(keyword) ||
          article.summary.toLowerCase().includes(keyword) ||
          article.source?.sourceName?.toLowerCase().includes(keyword) ||
          article.source?.sourceTitle?.toLowerCase().includes(keyword)
      )
      .sort(compareAdminArticles);
    return {
      articles: filtered.slice(
        (pagination.page - 1) * pagination.pageSize,
        pagination.page * pagination.pageSize
      ),
      pagination: {
        ...pagination,
        total: filtered.length,
        hasMore: pagination.page * pagination.pageSize < filtered.length
      }
    };
  }

  async getAdminArticle(articleId: string): Promise<AdminWorldIntelArticleResponse> {
    const article = await this.findArticle(articleId);
    if (!article) {
      throw new NotFoundException({
        errorCode: "world_intel_article_not_found",
        message: "大陆新闻不存在"
      });
    }
    return { article };
  }

  async createAdminArticle(
    input: AdminWorldIntelArticleInput
  ): Promise<AdminWorldIntelArticleResponse> {
    return { article: await this.createArticle(input) };
  }

  async batchCreateAdminArticles(
    request: AdminWorldIntelBatchCreateRequest
  ): Promise<AdminWorldIntelBatchCreateResponse> {
    if (!Array.isArray(request.articles) || request.articles.length === 0) {
      throw new BadRequestException({
        errorCode: "world_intel_articles_required",
        message: "请至少提交一篇大陆新闻"
      });
    }

    const articles: WorldIntelArticle[] = [];
    for (const item of request.articles) {
      articles.push(
        await this.createArticle({
          ...item,
          status: request.publishNow ? WorldIntelArticleStatus.Published : item.status
        })
      );
    }
    return { articles };
  }

  async updateAdminArticle(
    articleId: string,
    input: AdminWorldIntelArticleInput
  ): Promise<AdminWorldIntelArticleResponse> {
    const existing = await this.findArticle(articleId);
    if (!existing) {
      throw new NotFoundException({
        errorCode: "world_intel_article_not_found",
        message: "大陆新闻不存在"
      });
    }
    const nextArticle = normalizeArticleInput(input, existing);
    assertWorldIntelPublishReady(nextArticle);
    return { article: await this.persistArticle(nextArticle) };
  }

  async transitionAdminArticle(
    articleId: string,
    status: WorldIntelArticleStatus
  ): Promise<AdminWorldIntelArticleResponse> {
    const existing = await this.findArticle(articleId);
    if (!existing) {
      throw new NotFoundException({
        errorCode: "world_intel_article_not_found",
        message: "大陆新闻不存在"
      });
    }
    const nextArticle = {
      ...existing,
      status,
      publishedAt:
        status === WorldIntelArticleStatus.Published
          ? (existing.publishedAt ?? new Date().toISOString())
          : existing.publishedAt,
      updatedAt: new Date().toISOString()
    };
    assertWorldIntelPublishReady(nextArticle);
    return { article: await this.persistArticle(nextArticle) };
  }

  async migrateLegacyWorldIntelArticles(
    issues?: DailyContentIssue[]
  ): Promise<{ migrated: number }> {
    if (!issues?.length) {
      return { migrated: 0 };
    }

    let migrated = 0;
    for (const issue of issues) {
      if (issue.status !== "published" || !issue.publishedAt) {
        continue;
      }
      const section = issue.sections.find(
        (entry) => entry.sectionKey === DailyContentSectionKey.WorldIntel
      );
      for (const item of section?.items ?? []) {
        if (await this.findByLegacyItemId(item.id)) {
          continue;
        }
        await this.createArticle(legacyItemToArticleInput(issue, item));
        migrated += 1;
      }
    }
    return { migrated };
  }

  private async createArticle(input: AdminWorldIntelArticleInput): Promise<WorldIntelArticle> {
    const article = normalizeArticleInput(input);
    assertWorldIntelPublishReady(article);
    if (
      article.legacyDailyContentItemId &&
      (await this.findByLegacyItemId(article.legacyDailyContentItemId))
    ) {
      return (await this.findByLegacyItemId(article.legacyDailyContentItemId)) as WorldIntelArticle;
    }
    return this.persistArticle(article);
  }

  private async countLikes(articleId: string): Promise<number> {
    let count = 0;
    for (const key of this.memoryLikes) {
      if (key.startsWith(`${articleId}:`)) {
        count += 1;
      }
    }
    return count;
  }

  private async listPublicComments(articleId: string): Promise<DailyContentArticleComment[]> {
    return (this.memoryComments.get(articleId) ?? [])
      .filter((comment) => comment.status === "approved")
      .map((comment) => articleCommentForViewer({ ...comment, status: "approved" }, {}));
  }

  private async listVisibleComments(
    articleId: string,
    viewerUserId?: string
  ): Promise<DailyContentArticleComment[]> {
    return (this.memoryComments.get(articleId) ?? [])
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

  private async requireProfile(userId: string) {
    if (!this.userGrowthProfileService) {
      throw new ForbiddenException({
        errorCode: CommunityLiteErrorCode.ProfileRequired,
        message: "请先创建隐者档案"
      });
    }
    const response = await this.userGrowthProfileService.getProfile(userId);
    if (!response.profileCreated || !response.profile) {
      throw new ForbiddenException({
        errorCode: CommunityLiteErrorCode.ProfileRequired,
        message: "请先创建隐者档案"
      });
    }
    return response as typeof response & { profile: NonNullable<typeof response.profile> };
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
      const rejected = localWorldIntelCommentModerationToAiResult(lowCost);
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
          contentType: "world_intel_comment",
          body
        })
      : missingWorldIntelCommentProviderResult();

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

  private async loadLegacyIssues(): Promise<DailyContentIssue[] | undefined> {
    return this.legacyIssueProvider ? this.legacyIssueProvider() : undefined;
  }

  private async persistArticle(article: WorldIntelArticle): Promise<WorldIntelArticle> {
    if (!this.isDatabaseConfigured()) {
      this.memoryArticles.set(article.id, article);
      return article;
    }

    const data = articleToRecordInput(article);
    const existing = await this.worldIntelArticle.findUnique({ where: { id: article.id } });
    const record = existing
      ? await this.worldIntelArticle.update({ where: { id: article.id }, data })
      : await this.worldIntelArticle.create({ data });
    return recordToWorldIntelArticle(record);
  }

  private async findArticle(articleId: string): Promise<WorldIntelArticle | null> {
    if (!this.isDatabaseConfigured()) {
      return this.memoryArticles.get(articleId) ?? null;
    }
    const record = await this.worldIntelArticle.findUnique({ where: { id: articleId } });
    return record ? recordToWorldIntelArticle(record) : null;
  }

  private async findByLegacyItemId(
    legacyDailyContentItemId: string
  ): Promise<WorldIntelArticle | null> {
    if (!this.isDatabaseConfigured()) {
      return (
        [...this.memoryArticles.values()].find(
          (article) => article.legacyDailyContentItemId === legacyDailyContentItemId
        ) ?? null
      );
    }
    const record = await this.worldIntelArticle.findUnique({
      where: { legacyDailyContentItemId }
    });
    return record ? recordToWorldIntelArticle(record) : null;
  }

  private async findAllArticles(): Promise<WorldIntelArticle[]> {
    if (!this.isDatabaseConfigured()) {
      return [...this.memoryArticles.values()];
    }
    const records = await this.worldIntelArticle.findMany({
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }]
    });
    return records.map(recordToWorldIntelArticle);
  }

  private isDatabaseConfigured(): boolean {
    return (
      typeof this.prisma.isDatabaseConfigured !== "function" || this.prisma.isDatabaseConfigured()
    );
  }

  private get worldIntelArticle(): WorldIntelArticleDelegate {
    return (this.prisma as unknown as { worldIntelArticle: WorldIntelArticleDelegate })
      .worldIntelArticle;
  }
}

function normalizeArticleInput(
  input: AdminWorldIntelArticleInput,
  existing?: WorldIntelArticle
): WorldIntelArticle {
  const now = new Date().toISOString();
  const status =
    input.status && isWorldIntelStatus(input.status)
      ? input.status
      : (existing?.status ?? WorldIntelArticleStatus.Draft);
  const body = normalizeText(input.body ?? existing?.body, "大陆新闻正文", 2, 8000);
  const firstBodyImageUrl = extractFirstWorldIntelBodyImageUrl(body);
  const source = withBodyImageAsDirectoryImage(input.source ?? existing?.source, firstBodyImageUrl);
  return {
    id:
      input.id ??
      existing?.id ??
      `world-intel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: normalizeText(input.title ?? existing?.title, "大陆新闻标题", 2, 80),
    summary: normalizeText(input.summary ?? existing?.summary, "大陆新闻摘要", 2, 240),
    body,
    source,
    coverImageUrl: firstBodyImageUrl ?? input.coverImageUrl ?? existing?.coverImageUrl,
    coverImageKey: input.coverImageKey ?? existing?.coverImageKey,
    status,
    publishedAt:
      input.publishedAt ??
      existing?.publishedAt ??
      (status === WorldIntelArticleStatus.Published ? now : undefined),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    sortOrder: input.sortOrder ?? existing?.sortOrder ?? 0,
    allowLike: input.allowLike ?? existing?.allowLike ?? true,
    allowCommunityQuote: input.allowCommunityQuote ?? existing?.allowCommunityQuote ?? true,
    quotePrompt: input.quotePrompt ?? existing?.quotePrompt,
    legacyDailyContentItemId: input.legacyDailyContentItemId ?? existing?.legacyDailyContentItemId
  };
}

function withBodyImageAsDirectoryImage(
  source: DailyContentSourceInput | undefined,
  firstBodyImageUrl: string | undefined
): DailyContentSourceInput | undefined {
  if (!firstBodyImageUrl) {
    return source;
  }
  return {
    ...(source ?? { sourceType: DailyContentSourceType.Original }),
    imageUrl: firstBodyImageUrl
  };
}

function assertWorldIntelPublishReady(article: WorldIntelArticle): void {
  if (article.status !== WorldIntelArticleStatus.Published) {
    return;
  }
  const issues = validateWorldIntelArticleSourceForPublish(article);
  if (issues.length > 0) {
    throw new BadRequestException({
      errorCode: "world_intel_validation_failed",
      message: "大陆新闻校验失败",
      issues
    });
  }
}

function legacyItemToArticleInput(
  issue: DailyContentIssue,
  item: DailyContentItem
): AdminWorldIntelArticleInput {
  return {
    id: `world-intel-legacy-${item.id}`,
    title: item.title,
    summary: item.summary,
    body: item.body,
    source: item.source
      ? { ...item.source, sectionKey: DailyContentSectionKey.WorldIntel }
      : {
          sourceType: DailyContentSourceType.Original,
          sectionKey: DailyContentSectionKey.WorldIntel
        },
    coverImageUrl: item.source?.imageUrl,
    status: WorldIntelArticleStatus.Published,
    publishedAt: issue.publishedAt,
    sortOrder: item.sortOrder,
    allowLike: item.allowLike,
    allowCommunityQuote: item.allowCommunityQuote,
    quotePrompt: item.quotePrompt,
    legacyDailyContentItemId: item.id
  };
}

function normalizePagination(page: unknown, pageSize: unknown): { page: number; pageSize: number } {
  const normalizedPage = Math.max(1, Number.parseInt(String(page ?? "1"), 10) || 1);
  const requestedPageSize = Number.parseInt(String(pageSize ?? "10"), 10) || 10;
  return { page: normalizedPage, pageSize: Math.min(Math.max(requestedPageSize, 1), 50) };
}

function normalizeText(value: unknown, field: string, min: number, max: number): string {
  if (typeof value !== "string" || value.trim().length < min || value.trim().length > max) {
    throw new BadRequestException({
      errorCode: "world_intel_article_invalid",
      message: `${field}长度需在 ${min}-${max} 个字符之间`
    });
  }
  return value.trim();
}

function normalizeOptionalText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isWorldIntelStatus(value: string): value is WorldIntelArticleStatus {
  return (Object.values(WorldIntelArticleStatus) as string[]).includes(value);
}

function comparePublicArticles(first: WorldIntelArticle, second: WorldIntelArticle): number {
  if ((second.sortOrder ?? 0) !== (first.sortOrder ?? 0)) {
    return (second.sortOrder ?? 0) - (first.sortOrder ?? 0);
  }
  return (second.publishedAt ?? "").localeCompare(first.publishedAt ?? "");
}

function compareAdminArticles(first: WorldIntelArticle, second: WorldIntelArticle): number {
  return second.updatedAt.localeCompare(first.updatedAt);
}

function articleToRecordInput(article: WorldIntelArticle): Record<string, unknown> {
  return {
    id: article.id,
    title: article.title,
    summary: article.summary,
    body: article.body,
    source: article.source,
    coverImageUrl: article.coverImageUrl,
    coverImageKey: article.coverImageKey,
    status: article.status,
    publishedAt: article.publishedAt ? new Date(article.publishedAt) : null,
    sortOrder: article.sortOrder ?? 0,
    allowLike: article.allowLike,
    allowCommunityQuote: article.allowCommunityQuote,
    quotePrompt: article.quotePrompt,
    legacyDailyContentItemId: article.legacyDailyContentItemId
  };
}

function recordToWorldIntelArticle(record: WorldIntelArticleRecord): WorldIntelArticle {
  return {
    id: record.id,
    title: record.title,
    summary: record.summary,
    body: record.body,
    source:
      record.source && typeof record.source === "object"
        ? (record.source as WorldIntelArticle["source"])
        : undefined,
    coverImageUrl: record.coverImageUrl ?? undefined,
    coverImageKey: record.coverImageKey ?? undefined,
    status: isWorldIntelStatus(record.status) ? record.status : WorldIntelArticleStatus.Hidden,
    publishedAt: record.publishedAt?.toISOString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    sortOrder: record.sortOrder,
    allowLike: record.allowLike,
    allowCommunityQuote: record.allowCommunityQuote,
    quotePrompt: record.quotePrompt ?? undefined,
    legacyDailyContentItemId: record.legacyDailyContentItemId ?? undefined
  };
}

function moderationResultToCommentStatus(
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

function localWorldIntelCommentModerationToAiResult(
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

function missingWorldIntelCommentProviderResult(): Awaited<
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

function createModerationMessage(
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
