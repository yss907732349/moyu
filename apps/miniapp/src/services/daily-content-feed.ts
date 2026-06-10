import {
  DAILY_CONTENT_SECTION_KEYS,
  DailyContentStatus,
  isDailyContentArticleSectionKey,
  isDailyContentSectionKey,
  type CreateDailyContentArticleCommentResponse,
  type DailyContentArticleComment,
  type DailyContentArticleDetail,
  type DailyContentArticleSummary,
  type DailyContentSourceInput,
  type DailyContentLikeResponse,
  type DailyContentPublicDetail,
  type DailyContentPublicSummary,
  type DailyContentQuoteSnapshot,
  type DailyContentArticleSectionKey,
  type GetWorldIntelArticleDetailResponse,
  type GetWorldIntelArticlesResponse,
  type WorldIntelArticleDetail,
  type WorldIntelPublicSource,
  type WorldIntelArticleSummary,
  type CreateWorldIntelArticleCommentResponse,
  type GetDailyContentArticleDetailResponse,
  type GetDailyContentColumnArticlesResponse,
  type GetDailyContentDetailResponse,
  type GetDailyContentSummaryResponse
} from "@moyuxia/shared";
import { getMiniappApiBaseUrl, MINIAPP_API_TIMEOUT_MS } from "./api-config.ts";
import { getAuthHeaders } from "./auth";
import { cacheApiImageForDisplay } from "./image-cache";

const apiBaseUrl = getMiniappApiBaseUrl();

interface DailyContentRequestOptions {
  request?: typeof uni.request;
}

export class DailyContentClientError extends Error {
  readonly errorCode?: string;

  constructor(message: string, errorCode?: string) {
    super(message);
    this.name = "DailyContentClientError";
    this.errorCode = errorCode;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isDailyContentPublicSummary(value: unknown): value is DailyContentPublicSummary {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.businessDate === "string" &&
    typeof value.title === "string" &&
    typeof value.homeSummary === "string" &&
    value.status === DailyContentStatus.Published &&
    typeof value.publishedAt === "string" &&
    isRecord(value.reflection) &&
    typeof value.reflection.id === "string" &&
    typeof value.reflection.text === "string" &&
    Array.isArray(value.columns) &&
    Array.isArray(value.sections) &&
    value.sections.length > 0 &&
    value.sections.length <= DAILY_CONTENT_SECTION_KEYS.length &&
    value.sections.every(
      (section) =>
        isRecord(section) &&
        isDailyContentSectionKey(String(section.sectionKey)) &&
        typeof section.title === "string" &&
        typeof section.summary === "string"
    ) &&
    !("aiDraftMetadata" in value) &&
    !("reviewNote" in value)
  );
}

export function isDailyContentPublicDetail(value: unknown): value is DailyContentPublicDetail {
  return (
    isDailyContentPublicSummary(value) &&
    Array.isArray(value.sections) &&
    value.sections.every(
      (section) =>
        isRecord(section) &&
        Array.isArray(section.items) &&
        section.items.every(
          (item) =>
            isRecord(item) &&
            typeof item.id === "string" &&
            isDailyContentSectionKey(String(item.sectionKey)) &&
            typeof item.title === "string" &&
            typeof item.summary === "string" &&
            typeof item.body === "string" &&
            typeof item.allowLike === "boolean" &&
            typeof item.allowCommunityQuote === "boolean" &&
            Number.isInteger(item.likeCount)
        )
    )
  );
}

function isSummaryResponse(value: unknown): value is GetDailyContentSummaryResponse {
  return isRecord(value) && (value.issue === null || isDailyContentPublicSummary(value.issue));
}

function isDetailResponse(value: unknown): value is GetDailyContentDetailResponse {
  return isRecord(value) && isDailyContentPublicDetail(value.issue);
}

function isArticleSummary(value: unknown): value is DailyContentArticleSummary {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.issueId === "string" &&
    isDailyContentArticleSectionKey(String(value.sectionKey)) &&
    typeof value.sectionLabel === "string" &&
    typeof value.title === "string" &&
    typeof value.summary === "string" &&
    Number.isInteger(value.likeCount) &&
    Number.isInteger(value.commentCount)
  );
}

function isColumnArticlesResponse(value: unknown): value is GetDailyContentColumnArticlesResponse {
  return (
    isRecord(value) &&
    typeof value.issueId === "string" &&
    isDailyContentArticleSectionKey(String(value.sectionKey)) &&
    typeof value.sectionLabel === "string" &&
    Array.isArray(value.articles) &&
    value.articles.every(isArticleSummary)
  );
}

function isArticleDetail(value: unknown): value is DailyContentArticleDetail {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isArticleSummary(value) &&
    typeof value.body === "string" &&
    typeof value.allowLike === "boolean" &&
    typeof value.allowCommunityQuote === "boolean"
  );
}

function isArticleComment(value: unknown): value is DailyContentArticleComment {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.articleId === "string" &&
    typeof value.body === "string" &&
    isRecord(value.author) &&
    typeof value.author.displayName === "string"
  );
}

function isArticleDetailResponse(value: unknown): value is GetDailyContentArticleDetailResponse {
  return (
    isRecord(value) &&
    isArticleDetail(value.article) &&
    Array.isArray(value.comments) &&
    value.comments.every(isArticleComment)
  );
}

function isLikeResponse(value: unknown): value is DailyContentLikeResponse {
  return (
    isRecord(value) &&
    typeof value.issueId === "string" &&
    typeof value.itemId === "string" &&
    typeof value.liked === "boolean" &&
    Number.isInteger(value.likeCount)
  );
}

function isQuoteSnapshot(value: unknown): value is DailyContentQuoteSnapshot {
  return (
    isRecord(value) &&
    typeof value.issueId === "string" &&
    typeof value.itemId === "string" &&
    isDailyContentSectionKey(String(value.sectionKey)) &&
    typeof value.sectionLabel === "string" &&
    typeof value.title === "string" &&
    typeof value.summary === "string"
  );
}

function isCreateCommentResponse(
  value: unknown
): value is CreateDailyContentArticleCommentResponse {
  return (
    isRecord(value) &&
    typeof value.commentId === "string" &&
    ["pending", "approved", "rejected"].includes(String(value.status)) &&
    typeof value.message === "string"
  );
}

function isWorldIntelArticleSummary(value: unknown): value is WorldIntelArticleSummary {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.summary === "string" &&
    typeof value.publishedAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isWorldIntelListResponse(value: unknown): value is GetWorldIntelArticlesResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.articles) &&
    value.articles.every(isWorldIntelArticleSummary) &&
    isRecord(value.pagination) &&
    Number.isInteger(value.pagination.page) &&
    Number.isInteger(value.pagination.pageSize) &&
    Number.isInteger(value.pagination.total)
  );
}

function isWorldIntelArticleDetail(value: unknown): value is WorldIntelArticleDetail {
  return isRecord(value) && isWorldIntelArticleSummary(value) && typeof value.body === "string";
}

function isWorldIntelDetailResponse(value: unknown): value is GetWorldIntelArticleDetailResponse {
  return (
    isRecord(value) &&
    isWorldIntelArticleDetail(value.article) &&
    Array.isArray(value.comments) &&
    value.comments.every(isArticleComment)
  );
}

function requestJson(
  path: string,
  method: "GET" | "POST" | "DELETE",
  body: unknown,
  request: typeof uni.request
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    request({
      url: `${apiBaseUrl}${path}`,
      method,
      data: body as UniApp.RequestOptions["data"],
      header: getAuthHeaders(),
      timeout: MINIAPP_API_TIMEOUT_MS,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
          return;
        }

        const data = isRecord(res.data) ? res.data : {};
        reject(
          new DailyContentClientError(
            typeof data.message === "string" ? data.message : `日报接口返回 ${res.statusCode}`,
            typeof data.errorCode === "string" ? data.errorCode : undefined
          )
        );
      },
      fail: () => reject(new DailyContentClientError("网络异常，请稍后重试"))
    });
  });
}

export async function getDailyContentSummary(
  options: DailyContentRequestOptions = {}
): Promise<GetDailyContentSummaryResponse> {
  const data = await requestJson(
    "/daily-content/summary",
    "GET",
    undefined,
    options.request ?? uni.request
  );
  if (!isSummaryResponse(data)) {
    throw new DailyContentClientError("日报摘要响应结构异常");
  }
  return data;
}

export async function getDailyContentDetail(
  issueId: string,
  options: DailyContentRequestOptions = {}
): Promise<GetDailyContentDetailResponse> {
  const data = await requestJson(
    `/daily-content/issues/${encodeURIComponent(issueId)}`,
    "GET",
    undefined,
    options.request ?? uni.request
  );
  if (!isDetailResponse(data)) {
    throw new DailyContentClientError("日报详情响应结构异常");
  }
  return data;
}

export async function getDailyContentColumnArticles(
  issueId: string,
  sectionKey: DailyContentArticleSectionKey,
  options: DailyContentRequestOptions = {}
): Promise<GetDailyContentColumnArticlesResponse> {
  const data = await requestJson(
    `/daily-content/issues/${encodeURIComponent(issueId)}/sections/${encodeURIComponent(sectionKey)}/articles`,
    "GET",
    undefined,
    options.request ?? uni.request
  );
  if (!isColumnArticlesResponse(data)) {
    throw new DailyContentClientError("日报栏目响应结构异常");
  }
  return {
    ...data,
    articles: await Promise.all(data.articles.map(prepareDailyArticleSummaryAssetUrls))
  };
}

export async function getDailyContentArticleDetail(
  articleId: string,
  options: DailyContentRequestOptions = {}
): Promise<GetDailyContentArticleDetailResponse> {
  const data = await requestJson(
    `/daily-content/articles/${encodeURIComponent(articleId)}`,
    "GET",
    undefined,
    options.request ?? uni.request
  );
  if (!isArticleDetailResponse(data)) {
    throw new DailyContentClientError("日报文章响应结构异常");
  }
  return {
    ...data,
    article: await prepareDailyArticleDetailAssetUrls(data.article)
  };
}

export async function setDailyContentItemLike(
  itemId: string,
  liked: boolean,
  options: DailyContentRequestOptions = {}
): Promise<DailyContentLikeResponse> {
  const data = await requestJson(
    `/daily-content/items/${encodeURIComponent(itemId)}/like`,
    liked ? "POST" : "DELETE",
    {},
    options.request ?? uni.request
  );
  if (!isLikeResponse(data)) {
    throw new DailyContentClientError("日报点赞响应结构异常");
  }
  return data;
}

export async function createDailyContentArticleComment(
  articleId: string,
  body: string,
  options: DailyContentRequestOptions = {}
): Promise<CreateDailyContentArticleCommentResponse> {
  const data = await requestJson(
    `/daily-content/articles/${encodeURIComponent(articleId)}/comments`,
    "POST",
    { body },
    options.request ?? uni.request
  );
  if (!isCreateCommentResponse(data)) {
    throw new DailyContentClientError("日报评论响应结构异常");
  }
  return data;
}

export async function createDailyContentQuoteSnapshot(
  issueId: string,
  itemId: string,
  options: DailyContentRequestOptions = {}
): Promise<DailyContentQuoteSnapshot> {
  const data = await requestJson(
    `/daily-content/issues/${encodeURIComponent(issueId)}/items/${encodeURIComponent(itemId)}/quote`,
    "POST",
    {},
    options.request ?? uni.request
  );
  if (!isQuoteSnapshot(data)) {
    throw new DailyContentClientError("日报引用响应结构异常");
  }
  return data;
}

export async function createDailyContentReflectionQuoteSnapshot(
  issueId: string,
  options: DailyContentRequestOptions = {}
): Promise<DailyContentQuoteSnapshot> {
  const data = await requestJson(
    `/daily-content/issues/${encodeURIComponent(issueId)}/reflection/quote`,
    "POST",
    {},
    options.request ?? uni.request
  );
  if (!isQuoteSnapshot(data)) {
    throw new DailyContentClientError("今日参悟引用响应结构异常");
  }
  return data;
}

export async function getWorldIntelArticles(
  page = 1,
  pageSize = 10,
  options: DailyContentRequestOptions = {}
): Promise<GetWorldIntelArticlesResponse> {
  const data = await requestJson(
    `/world-intel/articles?page=${page}&pageSize=${pageSize}`,
    "GET",
    undefined,
    options.request ?? uni.request
  );
  if (!isWorldIntelListResponse(data)) {
    throw new DailyContentClientError("大陆新闻列表响应结构异常");
  }
  return {
    ...data,
    articles: await Promise.all(data.articles.map(prepareWorldIntelSummaryAssetUrls))
  };
}

export async function getWorldIntelArticleDetail(
  articleId: string,
  options: DailyContentRequestOptions = {}
): Promise<GetWorldIntelArticleDetailResponse> {
  const data = await requestJson(
    `/world-intel/articles/${encodeURIComponent(articleId)}`,
    "GET",
    undefined,
    options.request ?? uni.request
  );
  if (!isWorldIntelDetailResponse(data)) {
    throw new DailyContentClientError("大陆新闻详情响应结构异常");
  }
  return {
    ...data,
    article: await prepareWorldIntelDetailAssetUrls(data.article)
  };
}

export async function setWorldIntelArticleLike(
  articleId: string,
  liked: boolean,
  options: DailyContentRequestOptions = {}
): Promise<DailyContentLikeResponse> {
  const data = await requestJson(
    `/world-intel/articles/${encodeURIComponent(articleId)}/like`,
    liked ? "POST" : "DELETE",
    {},
    options.request ?? uni.request
  );
  if (!isLikeResponse(data)) {
    throw new DailyContentClientError("大陆新闻点赞响应结构异常");
  }
  return data;
}

export async function createWorldIntelArticleComment(
  articleId: string,
  body: string,
  options: DailyContentRequestOptions = {}
): Promise<CreateWorldIntelArticleCommentResponse> {
  const data = await requestJson(
    `/world-intel/articles/${encodeURIComponent(articleId)}/comments`,
    "POST",
    { body },
    options.request ?? uni.request
  );
  if (!isCreateCommentResponse(data)) {
    throw new DailyContentClientError("大陆新闻评论响应结构异常");
  }
  return data;
}

export async function createWorldIntelQuoteSnapshot(
  articleId: string,
  options: DailyContentRequestOptions = {}
): Promise<DailyContentQuoteSnapshot> {
  const data = await requestJson(
    `/world-intel/articles/${encodeURIComponent(articleId)}/quote`,
    "POST",
    {},
    options.request ?? uni.request
  );
  if (!isQuoteSnapshot(data)) {
    throw new DailyContentClientError("大陆新闻引用响应结构异常");
  }
  return data;
}

function normalizeDailyArticleSummaryAssetUrls<T extends DailyContentArticleSummary>(
  article: T
): T {
  return {
    ...article,
    source: normalizeDailyContentSourceAssetUrl(article.source)
  };
}

async function prepareDailyArticleSummaryAssetUrls<T extends DailyContentArticleSummary>(
  article: T
): Promise<T> {
  const normalized = normalizeDailyArticleSummaryAssetUrls(article);
  return {
    ...normalized,
    source: normalized.source?.imageUrl
      ? {
          ...normalized.source,
          imageUrl: await cacheApiImageForDisplay(normalized.source.imageUrl)
        }
      : normalized.source
  };
}

async function prepareDailyArticleDetailAssetUrls(
  article: DailyContentArticleDetail
): Promise<DailyContentArticleDetail> {
  const normalized = await prepareDailyArticleSummaryAssetUrls(article);
  return {
    ...normalized,
    body: await cacheMarkdownImageUrlsForDisplay(normalizeMarkdownImageUrls(article.body))
  };
}

function normalizeWorldIntelSummaryAssetUrls<T extends WorldIntelArticleSummary>(article: T): T {
  return {
    ...article,
    coverImageUrl: article.coverImageUrl
      ? resolvePublicDailyAssetUrl(article.coverImageUrl)
      : article.coverImageUrl,
    source: normalizeWorldIntelSourceAssetUrl(article.source)
  };
}

async function prepareWorldIntelSummaryAssetUrls<T extends WorldIntelArticleSummary>(
  article: T
): Promise<T> {
  const normalized = normalizeWorldIntelSummaryAssetUrls(article);
  return {
    ...normalized,
    coverImageUrl: normalized.coverImageUrl
      ? await cacheApiImageForDisplay(normalized.coverImageUrl)
      : normalized.coverImageUrl,
    source: normalized.source?.imageUrl
      ? {
          ...normalized.source,
          imageUrl: await cacheApiImageForDisplay(normalized.source.imageUrl)
        }
      : normalized.source
  };
}

async function prepareWorldIntelDetailAssetUrls(
  article: WorldIntelArticleDetail
): Promise<WorldIntelArticleDetail> {
  const normalized = await prepareWorldIntelSummaryAssetUrls(article);
  return {
    ...normalized,
    body: await cacheMarkdownImageUrlsForDisplay(normalizeMarkdownImageUrls(article.body))
  };
}

function normalizeDailyContentSourceAssetUrl(
  source?: DailyContentSourceInput
): DailyContentSourceInput | undefined {
  if (!source?.imageUrl) {
    return source;
  }

  return {
    ...source,
    imageUrl: resolvePublicDailyAssetUrl(source.imageUrl)
  };
}

function normalizeWorldIntelSourceAssetUrl(
  source?: WorldIntelPublicSource
): WorldIntelPublicSource | undefined {
  if (!source?.imageUrl) {
    return source;
  }

  return {
    ...source,
    imageUrl: resolvePublicDailyAssetUrl(source.imageUrl)
  };
}

function normalizeMarkdownImageUrls(body: string): string {
  return body.replace(
    /(!\[[^\]]*\]\()([^)]+)(\))/g,
    (full, prefix: string, rawUrl: string, suffix: string) => {
      const trimmed = rawUrl.trim();
      if (!trimmed || /\s/.test(trimmed)) {
        return full;
      }

      return `${prefix}${resolvePublicDailyAssetUrl(trimmed)}${suffix}`;
    }
  );
}

async function cacheMarkdownImageUrlsForDisplay(body: string): Promise<string> {
  const imagePattern = /(!\[[^\]]*\]\()([^)]+)(\))/g;
  const replacements = await Promise.all(
    [...body.matchAll(imagePattern)].map(async (match) => {
      const rawUrl = match[2]?.trim();
      if (!rawUrl || /\s/.test(rawUrl)) {
        return null;
      }
      return {
        rawUrl,
        cachedUrl: await cacheApiImageForDisplay(rawUrl)
      };
    })
  );

  return replacements.reduce((nextBody, replacement) => {
    if (!replacement || replacement.rawUrl === replacement.cachedUrl) {
      return nextBody;
    }
    return nextBody.split(replacement.rawUrl).join(replacement.cachedUrl);
  }, body);
}

function resolvePublicDailyAssetUrl(url: string): string {
  const trimmed = url.trim();
  if (/^(https?:|data:|blob:|wxfile:)/.test(trimmed)) {
    return trimmed.replace(
      /^http:\/\/(localhost|127\.0\.0\.1):3000(?=\/daily-content\/assets\/)/,
      apiBaseUrl
    );
  }

  return trimmed.startsWith("/daily-content/assets/") ? `${apiBaseUrl}${trimmed}` : trimmed;
}

export function isDailyContentIdentityError(error: unknown): boolean {
  return (
    error instanceof DailyContentClientError &&
    (error.errorCode === "unauthenticated" || error.errorCode === "community_profile_required")
  );
}
