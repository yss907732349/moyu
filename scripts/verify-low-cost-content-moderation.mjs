import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import {
  LowCostModerationDecision,
  LowCostModerationRiskTag,
  SENSITIVE_LEXICON_CACHE,
  createContentFingerprint,
  isSensitiveLexiconCache,
  moderateWithLowCostRules,
  normalizeModerationText
} from "../packages/shared/dist/index.js";
import { API_SENSITIVE_LEXICON_CACHE } from "../apps/api/dist/content-moderation/sensitive-lexicon.data.js";
import { LowCostContentModerationService } from "../apps/api/dist/low-cost-content-moderation.service.js";

const communityServiceSource = readFileSync("apps/api/src/community-lite.service.ts", "utf8");

assert.equal(isSensitiveLexiconCache(SENSITIVE_LEXICON_CACHE), true, "词库缓存结构无效");
assert.equal(
  SENSITIVE_LEXICON_CACHE.sourceRepository,
  "https://github.com/konsheng/Sensitive-lexicon",
  "词库来源仓库不正确"
);
assert.equal(SENSITIVE_LEXICON_CACHE.sourceLicense, "MIT", "词库许可元数据不正确");
assert.ok(SENSITIVE_LEXICON_CACHE.entryCount >= 20, "词库词条数量过少");
assert.ok(SENSITIVE_LEXICON_CACHE.categories.length >= 4, "词库风险分类不足");
assert.equal(
  isSensitiveLexiconCache(API_SENSITIVE_LEXICON_CACHE),
  true,
  "API 全量词库缓存结构无效"
);
assert.ok(API_SENSITIVE_LEXICON_CACHE.entryCount >= 45000, "API 全量词库词条数量过少");
assert.ok(
  API_SENSITIVE_LEXICON_CACHE.categories.includes("pornography"),
  "API 全量词库缺少涉黄分类"
);

for (const term of ["奶子", "黄片", "色情网站", "按摩棒"]) {
  const normalizedTerm = normalizeModerationText(term);
  assert.ok(
    API_SENSITIVE_LEXICON_CACHE.entries.some((entry) => entry.normalizedTerm === normalizedTerm),
    `API 全量词库缺少词条：${term}`
  );
}

const normalized = normalizeModerationText("加 微-信 返利");
assert.ok(normalized.includes("加微信返利"), "文本归一化未移除简单规避字符");

const rejectResult = moderateWithLowCostRules({
  fields: [{ field: "body", value: "你这个傻 逼，去死吧" }]
});
assert.equal(rejectResult.decision, LowCostModerationDecision.Reject, "明显辱骂应被拒绝");
assert.ok(rejectResult.riskTags.includes(LowCostModerationRiskTag.Abuse), "缺少辱骂风险标签");
assert.ok(
  rejectResult.hits.some((hit) => hit.field === "body"),
  "命中字段未记录"
);

const pornographyResult = moderateWithLowCostRules({
  fields: [
    { field: "title", value: "奶子黄虫" },
    { field: "body", value: "234324234324324324" }
  ]
});
assert.equal(
  pornographyResult.decision,
  LowCostModerationDecision.Reject,
  "明显低俗涉黄标题应被拒绝"
);
assert.ok(
  pornographyResult.riskTags.includes(LowCostModerationRiskTag.Pornography),
  "缺少涉黄风险标签"
);

const reviewResult = moderateWithLowCostRules({
  fields: [{ field: "body", value: "加 微 信 私聊返利" }]
});
assert.equal(reviewResult.decision, LowCostModerationDecision.Review, "广告引流应进入复核");
assert.ok(
  reviewResult.riskTags.includes(LowCostModerationRiskTag.Advertisement),
  "缺少广告风险标签"
);

const passResult = moderateWithLowCostRules({
  fields: [{ field: "body", value: "今天准点下班，茶馆见" }]
});
assert.equal(passResult.decision, LowCostModerationDecision.Pass, "普通短评论应通过");
assert.equal(
  createContentFingerprint("今天准点下班，茶馆见"),
  createContentFingerprint("今天 准点 下班 茶馆见"),
  "重复内容指纹应忽略简单空格标点差异"
);

const apiModerationService = new LowCostContentModerationService();
const apiPornographyResult = apiModerationService.moderateFields({
  fields: [
    { field: "title", value: "来点色情网站资源" },
    { field: "body", value: "普通正文" }
  ]
});
assert.equal(
  apiPornographyResult.decision,
  LowCostModerationDecision.Reject,
  "API 服务端全量词库应先拦截明显涉黄标题"
);
assert.ok(
  apiPornographyResult.riskTags.includes(LowCostModerationRiskTag.Pornography),
  "API 服务端全量词库缺少涉黄风险标签"
);

assert.equal(
  communityServiceSource.includes("countRecentEffectiveReportsAgainstUser"),
  true,
  "社区评论审核缺少有效举报风险统计"
);
assert.equal(
  communityServiceSource.includes("CommentReviewUserRiskReason.EffectiveReport"),
  true,
  "社区评论审核缺少有效举报风险原因"
);
assert.equal(
  communityServiceSource.includes("providerModeration.decision === AiModerationDecision.Approved"),
  true,
  "供应商通过时仍需保留有效举报人工复核边界"
);

console.log("低成本内容审核验证通过");
