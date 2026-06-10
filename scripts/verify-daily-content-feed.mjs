/* global process */
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const shared = require("../packages/shared/dist/index.js");

const {
  DAILY_CONTENT_SECTION_KEYS,
  DAILY_CONTENT_SECTION_LABELS,
  DAILY_CONTENT_ARTICLE_SECTION_KEYS,
  DailyContentGenerationStatus,
  DailyContentStatus,
  DailyContentSourceType,
  DailyContentValidationError,
  WorldIntelArticleStatus,
  AiModerationDecision,
  assertDailyContentPublicResponse,
  createDailyContentQuoteSnapshot,
  toDailyContentPublicDetail,
  toDailyContentPublicSummary,
  toWorldIntelArticleDetail,
  validateWorldIntelArticleSourceForPublish,
  validateDailyContentEdit,
  validateDailyContentIssue
} = shared;

assert.deepEqual(DAILY_CONTENT_SECTION_KEYS, [
  "daily_reflection",
  "world_intel",
  "absurd_casefile"
]);
assert.deepEqual(DAILY_CONTENT_ARTICLE_SECTION_KEYS, ["absurd_casefile"]);
assert.equal(DAILY_CONTENT_SECTION_LABELS.daily_reflection, "今日参悟");
assert.equal(DailyContentStatus.Published, "published");
assert.equal(WorldIntelArticleStatus.Published, "published");
assert.equal(DailyContentGenerationStatus.Failed, "failed");
assert.equal(AiModerationDecision.Approved, "approved");

const issue = {
  id: "daily-1",
  businessDate: "2026-05-26",
  title: "今日隐者日报",
  homeSummary: "今日卷轴摘要，首页只展示轻量信息。",
  status: DailyContentStatus.Published,
  publishedAt: "2026-05-26T01:00:00.000Z",
  aiDraftMetadata: {
    provider: "deepseek",
    modelName: "deepseek-chat",
    promptVersion: "daily-content-v1",
    inputSourceSummary: "source_count=21",
    generatedAt: "2026-05-26T00:00:00.000Z",
    generationStatus: DailyContentGenerationStatus.Succeeded,
    rawPrompt: "internal prompt"
  },
  reviewNote: "internal review",
  internalRiskTags: ["internal"],
  sections: DAILY_CONTENT_SECTION_KEYS.map((sectionKey) => ({
    sectionKey,
    title: DAILY_CONTENT_SECTION_LABELS[sectionKey],
    summary: `${DAILY_CONTENT_SECTION_LABELS[sectionKey]}摘要`,
    items: [
      {
        id: `${sectionKey}-1`,
        sectionKey,
        title: `${DAILY_CONTENT_SECTION_LABELS[sectionKey]}标题`,
        summary: "内容摘要",
        body: "内容正文",
        source:
          sectionKey === "daily_reflection"
            ? undefined
            : {
                sourceName: "来源站点",
                sourceTitle: `${DAILY_CONTENT_SECTION_LABELS[sectionKey]}来源标题`,
                sourceUrl: `https://example.com/${sectionKey}`,
                imageUrl: `https://example.com/${sectionKey}.jpg`,
                publicSourceText: "来源站点公开说明",
                inputMode: "admin_manual"
              },
        allowLike: true,
        allowCommunityQuote: true,
        quotePrompt: "我从这条日报想到：",
        likeCount: 0
      }
    ]
  })),
  createdAt: "2026-05-26T00:00:00.000Z",
  updatedAt: "2026-05-26T00:00:00.000Z"
};

validateDailyContentIssue(issue);
const editValidation = validateDailyContentEdit(issue);
assert.equal(editValidation.canSaveDraft, true);
assert.equal(editValidation.canSubmitReview, true);
assert.equal(editValidation.canPublish, true);
const summary = toDailyContentPublicSummary(issue);
const detail = toDailyContentPublicDetail(issue);
assert.equal(summary.status, DailyContentStatus.Published);
assert.equal(summary.sections.length, 3);
assert.equal(
  summary.columns.find((column) => column.sectionKey === "world_intel").route,
  "/pages/world-intel/list"
);
assert.equal("aiDraftMetadata" in summary, false);
assert.equal("reviewNote" in detail, false);
assertDailyContentPublicResponse(summary);
assertDailyContentPublicResponse(detail);
assert.equal(detail.sections[1].items[0].source.sourceUrl, "https://example.com/world_intel");
assert.equal(detail.sections[1].items[0].source.imageUrl, "https://example.com/world_intel.jpg");

const quote = createDailyContentQuoteSnapshot({
  issueId: issue.id,
  item: detail.sections[1].items[0]
});
assert.equal(quote.sectionLabel, "大陆新闻");
assert.equal(quote.title, "大陆新闻标题");

assert.equal(validateDailyContentEdit(issue).canPublish, true);

const worldIntelArticle = {
  id: "world-intel-1",
  title: "大陆新闻标题",
  summary: "大陆新闻摘要",
  body: "大陆新闻正文",
  status: WorldIntelArticleStatus.Published,
  publishedAt: "2026-05-26T01:00:00.000Z",
  createdAt: "2026-05-26T00:00:00.000Z",
  updatedAt: "2026-05-26T00:00:00.000Z",
  allowLike: true,
  allowCommunityQuote: true,
  source: {
    sourceType: DailyContentSourceType.Curated,
    sourceName: "来源站点",
    sourceTitle: "来源标题",
    sourceUrl: "https://example.com/world-intel",
    publicSourceText: "来源站点公开说明"
  }
};
assert.equal(validateWorldIntelArticleSourceForPublish(worldIntelArticle).length, 0);
assert.equal(
  toWorldIntelArticleDetail(worldIntelArticle).source.sourceUrl,
  "https://example.com/world-intel"
);
assert.equal(
  validateWorldIntelArticleSourceForPublish({
    ...worldIntelArticle,
    source: { sourceType: DailyContentSourceType.Curated }
  }).length,
  1
);

const warningValidation = validateDailyContentEdit({
  ...issue,
  status: DailyContentStatus.Draft,
  sections: issue.sections.map((section) =>
    section.sectionKey === "world_intel"
      ? {
          ...section,
          items: section.items.map((item) => ({
            ...item,
            source: { ...item.source, imageUrl: undefined, publicSourceText: undefined }
          }))
        }
      : section
  )
});
assert.equal(warningValidation.canSaveDraft, true);
assert.equal(
  warningValidation.issues.some((entry) => entry.severity === "warning"),
  true
);

assert.throws(
  () => assertDailyContentPublicResponse({ ...summary, rawPrompt: "never expose" }),
  DailyContentValidationError
);

process.stdout.write("daily-content-feed verification passed\n");
