import type { AiContentModerationTrace } from "./ai-content-moderation";

export const DailyContentSectionKey = {
  DailyReflection: "daily_reflection",
  WorldIntel: "world_intel",
  AbsurdCasefile: "absurd_casefile"
} as const;

export type DailyContentSectionKey =
  (typeof DailyContentSectionKey)[keyof typeof DailyContentSectionKey];

export const DAILY_CONTENT_SECTION_KEYS: readonly DailyContentSectionKey[] = [
  DailyContentSectionKey.DailyReflection,
  DailyContentSectionKey.WorldIntel,
  DailyContentSectionKey.AbsurdCasefile
] as const;

export const DAILY_CONTENT_SECTION_LABELS: Record<DailyContentSectionKey, string> = {
  [DailyContentSectionKey.DailyReflection]: "今日参悟",
  [DailyContentSectionKey.WorldIntel]: "大陆新闻",
  [DailyContentSectionKey.AbsurdCasefile]: "离谱卷宗"
};

export const DAILY_CONTENT_ARTICLE_SECTION_KEYS = [DailyContentSectionKey.AbsurdCasefile] as const;

export type DailyContentArticleSectionKey = (typeof DAILY_CONTENT_ARTICLE_SECTION_KEYS)[number];

export const DailyContentStatus = {
  Draft: "draft",
  PendingReview: "pending_review",
  Rejected: "rejected",
  Approved: "approved",
  Scheduled: "scheduled",
  Published: "published",
  Archived: "archived"
} as const;

export type DailyContentStatus = (typeof DailyContentStatus)[keyof typeof DailyContentStatus];

export const DailyContentGenerationStatus = {
  NotRequested: "not_requested",
  Succeeded: "succeeded",
  Failed: "failed"
} as const;

export type DailyContentGenerationStatus =
  (typeof DailyContentGenerationStatus)[keyof typeof DailyContentGenerationStatus];

export const DailyContentSourceType = {
  Original: "original",
  Curated: "curated"
} as const;

export type DailyContentSourceType =
  (typeof DailyContentSourceType)[keyof typeof DailyContentSourceType];

export interface DailyContentSourceInput {
  sourceType?: DailyContentSourceType;
  sectionKey?: DailyContentSectionKey;
  sourceIndex?: number;
  sourceTitle?: string;
  sourceName?: string;
  sourceUrl?: string;
  imageUrl?: string;
  publishedAt?: string;
  collectedAt?: string;
  searchQuery?: string;
  publicSourceText?: string;
  inputMode?: "admin_manual";
}

export interface DailyContentAiDraftMetadata {
  provider: "deepseek" | "manual" | string;
  modelName: string;
  promptVersion: string;
  inputSourceSummary: string;
  generatedAt: string;
  generationStatus: DailyContentGenerationStatus;
  failureReason?: string;
  rawPrompt?: string;
  internalRiskTags?: readonly string[];
}

export interface DailyContentItem {
  id: string;
  sectionKey: DailyContentSectionKey;
  title: string;
  summary: string;
  body: string;
  source?: DailyContentSourceInput;
  sortOrder?: number;
  allowLike: boolean;
  allowCommunityQuote: boolean;
  quotePrompt?: string;
  likeCount: number;
  viewerLiked?: boolean;
}

export type DailyContentArticle = DailyContentItem & {
  sectionKey: DailyContentArticleSectionKey;
  coverImageKey?: string;
  commentCount?: number;
};

export interface DailyContentSection {
  sectionKey: DailyContentSectionKey;
  title: string;
  summary: string;
  illustrationKey?: string;
  sortOrder?: number;
  items: DailyContentItem[];
}

export interface DailyContentReflection {
  id: string;
  text: string;
  quotePrompt?: string;
}

export interface DailyContentColumnEntry {
  sectionKey: typeof DailyContentSectionKey.WorldIntel | DailyContentArticleSectionKey;
  title: string;
  summary: string;
  illustrationKey: string;
  articleCount: number;
  route?: string;
}

export interface DailyContentIssue {
  id: string;
  businessDate: string;
  title: string;
  homeSummary: string;
  status: DailyContentStatus;
  sections: DailyContentSection[];
  publishedAt?: string;
  scheduledPublishAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  aiDraftMetadata?: DailyContentAiDraftMetadata;
  reviewNote?: string;
  internalRiskTags?: readonly string[];
  createdAt: string;
  updatedAt: string;
}

export interface DailyContentSummarySection {
  sectionKey: DailyContentSectionKey;
  title: string;
  summary: string;
}

export interface DailyContentPublicSummary {
  id: string;
  businessDate: string;
  title: string;
  homeSummary: string;
  status: typeof DailyContentStatus.Published;
  publishedAt: string;
  reflection: DailyContentReflection;
  columns: DailyContentColumnEntry[];
  sections: DailyContentSummarySection[];
}

export interface DailyContentPublicDetail extends DailyContentPublicSummary {
  sections: DailyContentSection[];
}

export interface DailyContentArticleSummary {
  id: string;
  issueId: string;
  sectionKey: DailyContentArticleSectionKey;
  sectionLabel: string;
  title: string;
  summary: string;
  coverImageKey?: string;
  source?: DailyContentSourceInput;
  likeCount: number;
  commentCount: number;
  viewerLiked?: boolean;
}

export interface DailyContentArticleDetail extends DailyContentArticleSummary {
  body: string;
  allowLike: boolean;
  allowCommunityQuote: boolean;
  quotePrompt?: string;
}

export interface GetDailyContentSummaryResponse {
  issue: DailyContentPublicSummary | null;
}

export interface GetDailyContentDetailResponse {
  issue: DailyContentPublicDetail;
}

export interface GetDailyContentColumnArticlesResponse {
  issueId: string;
  sectionKey: DailyContentArticleSectionKey;
  sectionLabel: string;
  articles: DailyContentArticleSummary[];
}

export interface GetDailyContentArticleDetailResponse {
  article: DailyContentArticleDetail;
  comments: DailyContentArticleComment[];
}

export interface DailyContentLikeResponse {
  issueId: string;
  itemId: string;
  liked: boolean;
  likeCount: number;
}

export interface DailyContentQuoteSnapshot {
  sourceType?: "daily_reflection" | "daily_article" | "world_intel_article";
  issueId: string;
  itemId: string;
  articleId?: string;
  sectionKey: DailyContentSectionKey;
  sectionLabel: string;
  title: string;
  summary: string;
  businessDate?: string;
  reflectionText?: string;
  quotePrompt?: string;
}

export type DailyContentReflectionQuoteDraft = DailyContentQuoteSnapshot & {
  sourceType: "daily_reflection";
  sectionKey: typeof DailyContentSectionKey.DailyReflection;
  businessDate: string;
  reflectionText: string;
};

export interface DailyContentArticleComment {
  id: string;
  articleId: string;
  body: string;
  author: {
    displayName: string;
    avatarKey: string;
    factionLabel: string;
    level: number;
    titleKey: string;
  };
  status: "pending" | "approved" | "rejected" | "hidden";
  createdAt: string;
  approvedAt: string;
  visibleToAuthorOnly?: true;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNote?: string;
  moderation?: AiContentModerationTrace;
}

export interface CreateDailyContentArticleCommentRequest {
  body: string;
}

export interface CreateDailyContentArticleCommentResponse {
  commentId: string;
  status: "pending" | "approved" | "rejected";
  message: string;
}

export interface DailyContentValidationIssue {
  field: string;
  message: string;
  severity?: "blocking" | "warning";
  itemId?: string;
  sectionKey?: DailyContentSectionKey;
}

export interface DailyContentEditValidationResult {
  canSaveDraft: boolean;
  canSubmitReview: boolean;
  canPublish: boolean;
  issues: DailyContentValidationIssue[];
}

export interface DailyContentIssuePreviewResponse {
  preview: true;
  validation: DailyContentEditValidationResult;
  issue: DailyContentPublicSummary | null;
}

export interface DailyContentArticlePreviewResponse {
  preview: true;
  validation: DailyContentEditValidationResult;
  article: DailyContentArticleDetail;
}

export interface DailyContentSectionPreviewResponse {
  preview: true;
  validation: DailyContentEditValidationResult;
  sectionKey: DailyContentSectionKey;
  sectionLabel: string;
  reflection?: DailyContentReflection;
  column?: DailyContentColumnEntry;
  articles: DailyContentArticleSummary[];
}

export interface AdminDailyContentEditItemInput {
  id?: string;
  sectionKey: DailyContentSectionKey;
  title: string;
  summary: string;
  body: string;
  source?: DailyContentSourceInput;
  sortOrder?: number;
  allowLike?: boolean;
  allowCommunityQuote?: boolean;
  quotePrompt?: string;
}

export interface AdminDailyContentEditSectionInput {
  sectionKey: DailyContentSectionKey;
  title?: string;
  summary: string;
  illustrationKey?: string;
  sortOrder?: number;
  items: AdminDailyContentEditItemInput[];
}

export interface AdminDailyContentIssueUpdateRequest {
  title?: string;
  homeSummary?: string;
  sections?: AdminDailyContentEditSectionInput[];
  scheduledPublishAt?: string;
}

export type AdminDailyContentSectionUpdateRequest = AdminDailyContentEditSectionInput;

export interface ScheduleDailyContentIssueRequest {
  scheduledPublishAt: string;
}

export interface ScheduleDailyContentIssueResponse {
  issue: DailyContentIssue;
}

export interface CancelDailyContentIssueScheduleResponse {
  issue: DailyContentIssue;
}

export class DailyContentValidationError extends Error {
  readonly issues: DailyContentValidationIssue[];

  constructor(issues: DailyContentValidationIssue[]) {
    super("隐者日报校验失败");
    this.name = "DailyContentValidationError";
    this.issues = issues;
  }
}

const INTERNAL_DAILY_CONTENT_FIELDS = [
  "aiDraftMetadata",
  "rawPrompt",
  "reviewNote",
  "internalRiskTags",
  "aiModerationResult",
  "aiModerationReason",
  "manualReviewReason",
  "failureReason",
  "providerApiKey",
  "apiKey"
] as const;

export function isDailyContentSectionKey(value: string): value is DailyContentSectionKey {
  return (DAILY_CONTENT_SECTION_KEYS as readonly string[]).includes(value);
}

export function isDailyContentArticleSectionKey(
  value: string
): value is DailyContentArticleSectionKey {
  return (DAILY_CONTENT_ARTICLE_SECTION_KEYS as readonly string[]).includes(value);
}

export function isDailyContentStatus(value: string): value is DailyContentStatus {
  return (Object.values(DailyContentStatus) as string[]).includes(value);
}

export function isDailyContentSourceType(value: string): value is DailyContentSourceType {
  return (Object.values(DailyContentSourceType) as string[]).includes(value);
}

export function getDailyContentSectionLabel(sectionKey: DailyContentSectionKey): string {
  return DAILY_CONTENT_SECTION_LABELS[sectionKey];
}

export function validateDailyContentIssue(issue: DailyContentIssue): void {
  const issues = collectDailyContentEditIssues(issue, {
    includeWarnings: false,
    requirePublishReady: issue.status === DailyContentStatus.Published
  });

  throwIfIssues(issues);
}

export function validateDailyContentForSubmitOrPublish(issue: DailyContentIssue): void {
  throwIfIssues(
    collectDailyContentEditIssues(issue, {
      includeWarnings: false,
      requirePublishReady: true
    })
  );
}

export function validateDailyContentEdit(
  issue: DailyContentIssue
): DailyContentEditValidationResult {
  const issues = collectDailyContentEditIssues(issue, {
    includeWarnings: true,
    requirePublishReady: true
  });
  const blockingIssues = issues.filter((issue) => issue.severity !== "warning");
  return {
    canSaveDraft: true,
    canSubmitReview: blockingIssues.length === 0,
    canPublish: blockingIssues.length === 0,
    issues
  };
}

export function filterDailyContentValidationIssuesForSection(
  issues: readonly DailyContentValidationIssue[],
  issue: DailyContentIssue,
  sectionKey: DailyContentSectionKey
): DailyContentValidationIssue[] {
  const sectionItemIds = new Set(
    issue.sections
      .find((section) => section.sectionKey === sectionKey)
      ?.items.map((item) => item.id) ?? []
  );

  return issues.filter((issue) => {
    if (issue.sectionKey) {
      return issue.sectionKey === sectionKey;
    }

    if (issue.itemId) {
      return sectionItemIds.has(issue.itemId);
    }

    return issue.field.startsWith(`sections.${sectionKey}.`);
  });
}

export function validateDailyContentSectionEdit(
  issue: DailyContentIssue,
  sectionKey: DailyContentSectionKey
): DailyContentEditValidationResult {
  const section = issue.sections.find((entry) => entry.sectionKey === sectionKey);
  const issues = section
    ? filterDailyContentValidationIssuesForSection(
        validateDailyContentEdit(issue).issues,
        issue,
        sectionKey
      )
    : [
        {
          field: `sections.${sectionKey}`,
          sectionKey,
          message: `缺少${DAILY_CONTENT_SECTION_LABELS[sectionKey]}`
        }
      ];
  const blockingIssues = issues.filter((issue) => issue.severity !== "warning");

  return {
    canSaveDraft: true,
    canSubmitReview: blockingIssues.length === 0,
    canPublish: blockingIssues.length === 0,
    issues
  };
}

export function validateDailyContentSectionForPublish(
  issue: DailyContentIssue,
  sectionKey: DailyContentSectionKey
): void {
  if (sectionKey === DailyContentSectionKey.WorldIntel) {
    throwIfIssues([
      {
        field: "sections.world_intel",
        sectionKey,
        message: "大陆新闻已迁移到独立内容库，请使用大陆新闻管理接口"
      }
    ]);
  }
  const validation = validateDailyContentSectionEdit(issue, sectionKey);
  throwIfIssues(validation.issues.filter((issue) => issue.severity !== "warning"));
}

function collectDailyContentEditIssues(
  issue: DailyContentIssue,
  options: { includeWarnings: boolean; requirePublishReady: boolean }
): DailyContentValidationIssue[] {
  const issues: DailyContentValidationIssue[] = [];

  validateText("businessDate", issue.businessDate, 10, 10, issues);
  validateText("title", issue.title, 4, 80, issues);
  validateText("homeSummary", issue.homeSummary, 4, 200, issues);

  if (!isDailyContentStatus(String(issue.status))) {
    issues.push({ field: "status", message: "日报状态无效" });
  }

  if (issue.sections.length === 0) {
    issues.push({ field: "sections", message: "日报至少需要一个板块" });
  }

  for (const section of issue.sections) {
    if (!isDailyContentSectionKey(String(section.sectionKey))) {
      issues.push({ field: "sections.sectionKey", message: "日报板块 key 无效" });
      continue;
    }

    if (section.title !== DAILY_CONTENT_SECTION_LABELS[section.sectionKey]) {
      issues.push({ field: "sections.title", message: "日报板块标题需匹配固定展示名" });
    }

    if (section.sectionKey === DailyContentSectionKey.AbsurdCasefile && section.items.length > 10) {
      issues.push({ field: "sections.items", message: "每个日报文章栏目最多 10 篇文章" });
    }

    if (section.sectionKey === DailyContentSectionKey.DailyReflection && section.items.length > 1) {
      issues.push({ field: "sections.items", message: "今日参悟最多 1 条" });
    }

    if (options.includeWarnings && isDailyContentArticleSectionKey(section.sectionKey)) {
      if (section.items.length === 0) {
        issues.push({
          field: `sections.${section.sectionKey}.items`,
          sectionKey: section.sectionKey,
          severity: "warning",
          message: `${DAILY_CONTENT_SECTION_LABELS[section.sectionKey]}暂无文章`
        });
      }
    }

    for (const item of section.items) {
      validateDailyContentItem(item, section.sectionKey, issues);

      if (options.includeWarnings && isDailyContentArticleSectionKey(section.sectionKey)) {
        if (!item.source?.sourceUrl) {
          issues.push({
            field: `items.${item.id}.source.sourceUrl`,
            itemId: item.id,
            sectionKey: section.sectionKey,
            severity: "warning",
            message: `「${item.title}」缺少来源链接`
          });
        }
        if (!item.source?.publicSourceText) {
          issues.push({
            field: `items.${item.id}.source.publicSourceText`,
            itemId: item.id,
            sectionKey: section.sectionKey,
            severity: "warning",
            message: `「${item.title}」缺少公开来源说明`
          });
        }
      }
    }
  }

  if (options.requirePublishReady) {
    for (const section of issue.sections) {
      for (const item of section.items) {
        if (requiresVisibleSourceFields(item.sectionKey) && !hasVisibleSourceFields(item.source)) {
          issues.push({
            field: `items.${item.id}.source`,
            itemId: item.id,
            sectionKey: item.sectionKey,
            message: `「${item.title}」必须补齐来源链接和公开来源说明`
          });
        }
        if (item.source?.sourceUrl && !isValidHttpUrl(item.source.sourceUrl)) {
          issues.push({
            field: `items.${item.id}.source.sourceUrl`,
            itemId: item.id,
            sectionKey: item.sectionKey,
            message: `「${item.title}」来源 URL 格式无效`
          });
        }
      }
    }
  }

  return issues;
}

export function toDailyContentPublicSummary(
  issue: DailyContentIssue
): DailyContentPublicSummary | null {
  if (issue.status !== DailyContentStatus.Published || !issue.publishedAt) {
    return null;
  }

  validateDailyContentIssue(issue);
  return {
    id: issue.id,
    businessDate: issue.businessDate,
    title: issue.title,
    homeSummary: issue.homeSummary,
    status: DailyContentStatus.Published,
    publishedAt: issue.publishedAt,
    reflection: getIssueReflection(issue),
    columns: getIssueColumns(issue),
    sections: issue.sections.map((section) => ({
      sectionKey: section.sectionKey,
      title: section.title,
      summary: section.summary
    }))
  };
}

export function toDailyContentPublicDetail(
  issue: DailyContentIssue
): DailyContentPublicDetail | null {
  const summary = toDailyContentPublicSummary(issue);

  if (!summary) {
    return null;
  }

  return {
    ...summary,
    sections: issue.sections.map((section) => ({
      sectionKey: section.sectionKey,
      title: section.title,
      summary: section.summary,
      illustrationKey: section.illustrationKey,
      items: section.items.map((item) => ({
        id: item.id,
        sectionKey: item.sectionKey,
        title: item.title,
        summary: item.summary,
        body: item.body,
        source: item.source
          ? {
              sectionKey: item.source.sectionKey,
              sourceIndex: item.source.sourceIndex,
              sourceName: item.source.sourceName,
              sourceUrl: item.source.sourceUrl,
              imageUrl: item.source.imageUrl,
              publicSourceText: item.source.publicSourceText,
              sourceTitle: item.source.sourceTitle,
              sourceType: item.source.sourceType,
              publishedAt: item.source.publishedAt,
              searchQuery: item.source.searchQuery
            }
          : undefined,
        allowLike: item.allowLike,
        allowCommunityQuote: item.allowCommunityQuote,
        quotePrompt: item.quotePrompt,
        likeCount: item.likeCount,
        viewerLiked: item.viewerLiked
      }))
    }))
  };
}

export function assertDailyContentPublicResponse(value: Record<string, unknown>): void {
  for (const field of INTERNAL_DAILY_CONTENT_FIELDS) {
    if (field in value) {
      throw new DailyContentValidationError([{ field, message: `公开日报响应不得包含 ${field}` }]);
    }
  }

  for (const nested of Object.values(value)) {
    if (nested && typeof nested === "object") {
      assertDailyContentPublicResponse(nested as Record<string, unknown>);
    }
  }
}

export function createDailyContentQuoteSnapshot(input: {
  issueId: string;
  businessDate?: string;
  item: Pick<DailyContentItem, "id" | "sectionKey" | "title" | "summary" | "quotePrompt">;
}): DailyContentQuoteSnapshot {
  return {
    sourceType:
      input.item.sectionKey === DailyContentSectionKey.DailyReflection
        ? "daily_reflection"
        : "daily_article",
    issueId: input.issueId,
    itemId: input.item.id,
    articleId:
      input.item.sectionKey === DailyContentSectionKey.DailyReflection ? undefined : input.item.id,
    sectionKey: input.item.sectionKey,
    sectionLabel: DAILY_CONTENT_SECTION_LABELS[input.item.sectionKey],
    title: input.item.title,
    summary: input.item.summary,
    businessDate: input.businessDate,
    reflectionText:
      input.item.sectionKey === DailyContentSectionKey.DailyReflection
        ? input.item.summary
        : undefined,
    quotePrompt: input.item.quotePrompt
  };
}

export function createDailyContentReflectionQuoteSnapshot(input: {
  issueId: string;
  businessDate: string;
  reflection: DailyContentReflection;
}): DailyContentReflectionQuoteDraft {
  return {
    sourceType: "daily_reflection",
    issueId: input.issueId,
    itemId: input.reflection.id,
    sectionKey: DailyContentSectionKey.DailyReflection,
    sectionLabel: DAILY_CONTENT_SECTION_LABELS[DailyContentSectionKey.DailyReflection],
    title: DAILY_CONTENT_SECTION_LABELS[DailyContentSectionKey.DailyReflection],
    summary: input.reflection.text,
    businessDate: input.businessDate,
    reflectionText: input.reflection.text,
    quotePrompt: input.reflection.quotePrompt
  };
}

export function toDailyContentArticleSummary(input: {
  issueId: string;
  item: DailyContentItem;
  commentCount?: number;
}): DailyContentArticleSummary {
  const sectionKey = input.item.sectionKey;
  if (!isDailyContentArticleSectionKey(sectionKey)) {
    throw new DailyContentValidationError([
      { field: "sectionKey", message: "今日参悟不是日报文章栏目" }
    ]);
  }
  const bodyImageUrl = extractFirstDailyContentBodyImageUrl(input.item.body);
  const sourceImageUrl = input.item.source?.imageUrl ?? bodyImageUrl;

  return {
    id: input.item.id,
    issueId: input.issueId,
    sectionKey,
    sectionLabel: DAILY_CONTENT_SECTION_LABELS[sectionKey],
    title: input.item.title,
    summary: input.item.summary,
    source:
      input.item.source || sourceImageUrl
        ? {
            sectionKey: input.item.source?.sectionKey,
            sourceIndex: input.item.source?.sourceIndex,
            sourceName: input.item.source?.sourceName,
            sourceUrl: input.item.source?.sourceUrl,
            imageUrl: sourceImageUrl,
            publicSourceText: input.item.source?.publicSourceText,
            sourceTitle: input.item.source?.sourceTitle,
            sourceType: input.item.source?.sourceType,
            publishedAt: input.item.source?.publishedAt,
            searchQuery: input.item.source?.searchQuery
          }
        : undefined,
    likeCount: input.item.likeCount,
    commentCount: input.commentCount ?? 0,
    viewerLiked: input.item.viewerLiked
  };
}

export function extractFirstDailyContentBodyImageUrl(body: string): string | undefined {
  const match = /!\[[^\]]*]\(([^)\s]+)\)/.exec(body);
  return normalizeOptionalUrl(match?.[1]);
}

function normalizeOptionalUrl(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function toDailyContentArticleDetail(input: {
  issueId: string;
  item: DailyContentItem;
  commentCount?: number;
}): DailyContentArticleDetail {
  return {
    ...toDailyContentArticleSummary(input),
    body: input.item.body,
    allowLike: input.item.allowLike,
    allowCommunityQuote: input.item.allowCommunityQuote,
    quotePrompt: input.item.quotePrompt
  };
}

function validateDailyContentItem(
  item: DailyContentItem,
  sectionKey: DailyContentSectionKey,
  issues: DailyContentValidationIssue[]
): void {
  if (item.sectionKey !== sectionKey) {
    issues.push({
      field: "items.sectionKey",
      itemId: item.id,
      sectionKey,
      message: "内容项板块 key 需与所在板块一致"
    });
  }

  validateItemText("items.title", item.title, 2, 80, item.id, sectionKey, issues);
  validateItemText("items.summary", item.summary, 2, 240, item.id, sectionKey, issues);
  validateItemText("items.body", item.body, 2, 4000, item.id, sectionKey, issues);

  if (sectionKey === DailyContentSectionKey.DailyReflection) {
    validateItemText("reflection", item.summary, 2, 240, item.id, sectionKey, issues);
  }
}

function getIssueReflection(issue: DailyContentIssue): DailyContentReflection {
  const reflectionItem = issue.sections
    .find((section) => section.sectionKey === DailyContentSectionKey.DailyReflection)
    ?.items.at(0);

  return {
    id: reflectionItem?.id ?? `${issue.id}-reflection`,
    text: reflectionItem?.summary || reflectionItem?.body || "今日参悟尚未写入。",
    quotePrompt: reflectionItem?.quotePrompt ?? "我从今日参悟想到："
  };
}

function getIssueColumns(issue: DailyContentIssue): DailyContentColumnEntry[] {
  const worldIntelSection = issue.sections.find(
    (entry) => entry.sectionKey === DailyContentSectionKey.WorldIntel
  );
  return [
    {
      sectionKey: DailyContentSectionKey.WorldIntel,
      title: DAILY_CONTENT_SECTION_LABELS[DailyContentSectionKey.WorldIntel],
      summary: worldIntelSection?.summary ?? "大陆新闻已进入独立情报库。",
      illustrationKey: worldIntelSection?.illustrationKey ?? "daily_world_intel",
      articleCount: 0,
      route: "/pages/world-intel/list"
    },
    ...DAILY_CONTENT_ARTICLE_SECTION_KEYS.map((sectionKey) => {
      const section = issue.sections.find((entry) => entry.sectionKey === sectionKey);
      return {
        sectionKey,
        title: DAILY_CONTENT_SECTION_LABELS[sectionKey],
        summary: section?.summary ?? "本栏目尚未发布内容。",
        illustrationKey: section?.illustrationKey ?? `daily_${sectionKey}`,
        articleCount: Math.min(section?.items.length ?? 0, 10)
      };
    })
  ];
}

function requiresVisibleSourceFields(sectionKey: DailyContentSectionKey): boolean {
  return sectionKey === DailyContentSectionKey.AbsurdCasefile;
}

function hasVisibleSourceFields(source?: DailyContentSourceInput): boolean {
  return Boolean(source?.sourceUrl && source.publicSourceText);
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validateText(
  field: string,
  value: unknown,
  minLength: number,
  maxLength: number,
  issues: DailyContentValidationIssue[]
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

function validateItemText(
  field: string,
  value: unknown,
  minLength: number,
  maxLength: number,
  itemId: string,
  sectionKey: DailyContentSectionKey,
  issues: DailyContentValidationIssue[]
): void {
  const beforeCount = issues.length;
  validateText(field, value, minLength, maxLength, issues);
  for (const issue of issues.slice(beforeCount)) {
    issue.itemId = itemId;
    issue.sectionKey = sectionKey;
  }
}

function throwIfIssues(issues: DailyContentValidationIssue[]): void {
  if (issues.length > 0) {
    throw new DailyContentValidationError(issues);
  }
}
