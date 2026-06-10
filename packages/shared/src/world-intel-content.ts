import {
  DailyContentSourceType,
  type CreateDailyContentArticleCommentResponse,
  type DailyContentArticleComment,
  type DailyContentLikeResponse,
  type DailyContentQuoteSnapshot,
  type DailyContentSourceInput,
  type DailyContentValidationIssue
} from "./daily-content-feed";

export const WorldIntelArticleStatus = {
  Draft: "draft",
  Published: "published",
  Offline: "offline",
  Hidden: "hidden"
} as const;

export type WorldIntelArticleStatus =
  (typeof WorldIntelArticleStatus)[keyof typeof WorldIntelArticleStatus];

export interface WorldIntelPublicSource {
  sourceType?: DailyContentSourceType;
  sourceTitle?: string;
  sourceName?: string;
  sourceUrl?: string;
  imageUrl?: string;
  publishedAt?: string;
  publicSourceText?: string;
}

export interface WorldIntelArticle {
  id: string;
  title: string;
  summary: string;
  body: string;
  source?: DailyContentSourceInput;
  coverImageUrl?: string;
  coverImageKey?: string;
  status: WorldIntelArticleStatus;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  sortOrder?: number;
  allowLike: boolean;
  allowCommunityQuote: boolean;
  quotePrompt?: string;
  legacyDailyContentItemId?: string;
}

export interface WorldIntelArticleSummary {
  id: string;
  title: string;
  summary: string;
  source?: WorldIntelPublicSource;
  coverImageUrl?: string;
  coverImageKey?: string;
  publishedAt: string;
  updatedAt: string;
  allowCommunityQuote: boolean;
}

export interface WorldIntelArticleDetail extends WorldIntelArticleSummary {
  body: string;
  allowLike: boolean;
  quotePrompt?: string;
  viewerLiked?: boolean;
  likeCount?: number;
}

export interface WorldIntelPagination {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export interface GetWorldIntelArticlesResponse {
  articles: WorldIntelArticleSummary[];
  pagination: WorldIntelPagination;
}

export interface GetWorldIntelArticleDetailResponse {
  article: WorldIntelArticleDetail;
  comments: DailyContentArticleComment[];
}

export type WorldIntelArticleLikeResponse = DailyContentLikeResponse;

export type CreateWorldIntelArticleCommentResponse = CreateDailyContentArticleCommentResponse;

export type WorldIntelQuoteSnapshot = DailyContentQuoteSnapshot;

export interface AdminWorldIntelArticleInput {
  id?: string;
  title: string;
  summary: string;
  body: string;
  source?: DailyContentSourceInput;
  coverImageUrl?: string;
  coverImageKey?: string;
  status?: WorldIntelArticleStatus;
  publishedAt?: string;
  sortOrder?: number;
  allowLike?: boolean;
  allowCommunityQuote?: boolean;
  quotePrompt?: string;
  legacyDailyContentItemId?: string;
}

export type AdminWorldIntelArticleUpdateRequest = AdminWorldIntelArticleInput;

export interface AdminWorldIntelBatchCreateRequest {
  articles: AdminWorldIntelArticleInput[];
  publishNow?: boolean;
}

export interface AdminWorldIntelListResponse {
  articles: WorldIntelArticle[];
  pagination: WorldIntelPagination;
}

export interface AdminWorldIntelArticleResponse {
  article: WorldIntelArticle;
}

export interface AdminWorldIntelBatchCreateResponse {
  articles: WorldIntelArticle[];
}

export function isWorldIntelArticleStatus(value: string): value is WorldIntelArticleStatus {
  return (Object.values(WorldIntelArticleStatus) as string[]).includes(value);
}

export function validateWorldIntelArticleSourceForPublish(
  article: Pick<WorldIntelArticle, "id" | "title" | "source">
): DailyContentValidationIssue[] {
  const issues: DailyContentValidationIssue[] = [];
  const source = article.source;

  if (source?.sourceUrl && !isValidHttpUrl(source.sourceUrl)) {
    issues.push({
      field: "source.sourceUrl",
      itemId: article.id,
      message: `「${article.title}」来源 URL 格式无效`
    });
  }

  return issues;
}

export function toWorldIntelPublicSource(
  source?: DailyContentSourceInput
): WorldIntelPublicSource | undefined {
  if (!source) {
    return undefined;
  }

  return {
    sourceType: source.sourceType,
    sourceTitle: source.sourceTitle,
    sourceName: source.sourceName,
    sourceUrl: source.sourceUrl,
    imageUrl: source.imageUrl,
    publishedAt: source.publishedAt,
    publicSourceText: source.publicSourceText
  };
}

export function toWorldIntelArticleSummary(
  article: WorldIntelArticle
): WorldIntelArticleSummary | null {
  if (article.status !== WorldIntelArticleStatus.Published || !article.publishedAt) {
    return null;
  }

  return {
    id: article.id,
    title: article.title,
    summary: article.summary,
    source: toWorldIntelPublicSource(article.source),
    coverImageUrl:
      extractFirstWorldIntelBodyImageUrl(article.body) ??
      normalizeOptionalUrl(article.coverImageUrl) ??
      normalizeOptionalUrl(article.source?.imageUrl),
    coverImageKey: article.coverImageKey,
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt,
    allowCommunityQuote: article.allowCommunityQuote
  };
}

export function extractFirstWorldIntelBodyImageUrl(body: string): string | undefined {
  const match = /!\[[^\]]*]\(([^)\s]+)\)/.exec(body);
  return normalizeOptionalUrl(match?.[1]);
}

function normalizeOptionalUrl(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function toWorldIntelArticleDetail(
  article: WorldIntelArticle
): WorldIntelArticleDetail | null {
  const summary = toWorldIntelArticleSummary(article);
  if (!summary) {
    return null;
  }

  return {
    ...summary,
    body: article.body,
    allowLike: article.allowLike,
    quotePrompt: article.quotePrompt
  };
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
