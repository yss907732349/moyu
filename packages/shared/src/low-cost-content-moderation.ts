import { SENSITIVE_LEXICON_CACHE } from "./content-moderation/sensitive-lexicon.data";

export { SENSITIVE_LEXICON_CACHE };

export const LowCostModerationDecision = {
  Pass: "pass",
  Review: "review",
  Reject: "reject"
} as const;

export type LowCostModerationDecision =
  (typeof LowCostModerationDecision)[keyof typeof LowCostModerationDecision];

export const LowCostModerationRiskLevel = {
  Low: "low",
  Medium: "medium",
  High: "high"
} as const;

export type LowCostModerationRiskLevel =
  (typeof LowCostModerationRiskLevel)[keyof typeof LowCostModerationRiskLevel];

export const LowCostModerationRiskTag = {
  Safe: "safe",
  Politics: "politics",
  Pornography: "pornography",
  Illegal: "illegal",
  Abuse: "abuse",
  PersonalAttack: "personal_attack",
  PrivacyLeak: "privacy_leak",
  Advertisement: "advertisement",
  Spam: "spam",
  Violence: "violence",
  Ambiguous: "ambiguous",
  FrequencyLimit: "frequency_limit",
  DuplicateContent: "duplicate_content",
  UserRisk: "user_risk"
} as const;

export type LowCostModerationRiskTag =
  (typeof LowCostModerationRiskTag)[keyof typeof LowCostModerationRiskTag];

export const LowCostModerationSource = {
  LocalRules: "local_rules"
} as const;

export type LowCostModerationSource =
  (typeof LowCostModerationSource)[keyof typeof LowCostModerationSource];

export interface SensitiveLexiconEntry {
  term: string;
  normalizedTerm: string;
  category: string;
  riskLevel: LowCostModerationRiskLevel;
  riskTag: LowCostModerationRiskTag;
}

export interface SensitiveLexiconCache {
  version: number;
  sourceRepository: string;
  sourceLicense: string;
  syncedAt: string;
  entryCount: number;
  categories: readonly string[];
  entries: readonly SensitiveLexiconEntry[];
}

export interface LowCostModerationHit {
  term: string;
  normalizedTerm: string;
  category: string;
  riskLevel: LowCostModerationRiskLevel;
  riskTag: LowCostModerationRiskTag;
  field: string;
}

export interface LowCostContentModerationResult {
  decision: LowCostModerationDecision;
  source: LowCostModerationSource;
  riskLevel: LowCostModerationRiskLevel;
  riskTags: readonly LowCostModerationRiskTag[];
  hits: readonly LowCostModerationHit[];
  reason: string;
  suggestion: string;
  fingerprint: string;
  moderatedAt: string;
}

export interface LowCostContentModerationInputField {
  field: string;
  value: string;
}

export interface LowCostContentModerationOptions {
  fields: readonly LowCostContentModerationInputField[];
  lexicon?: SensitiveLexiconCache;
  moderatedAt?: string;
  extraRiskTags?: readonly LowCostModerationRiskTag[];
}

export interface LowCostContentModerationTrace {
  lowCostModerationResult?: LowCostContentModerationResult;
}

export const CommentReviewDecision = {
  AutoApprove: "auto_approve",
  AutoReject: "auto_reject",
  ManualReview: "manual_review"
} as const;

export type CommentReviewDecision =
  (typeof CommentReviewDecision)[keyof typeof CommentReviewDecision];

export const CommentReviewUserRiskReason = {
  NewUser: "new_user",
  TrustedUser: "trusted_user",
  LimitedUser: "limited_user",
  ViolatedUser: "violated_user",
  EffectiveReport: "effective_report",
  RateLimited: "rate_limited",
  DuplicateContent: "duplicate_content",
  TextRisk: "text_risk"
} as const;

export type CommentReviewUserRiskReason =
  (typeof CommentReviewUserRiskReason)[keyof typeof CommentReviewUserRiskReason];

export interface CommentFastPassEligibility {
  eligible: boolean;
  approvedDiscussionCount: number;
  requiredApprovedDiscussionCount: number;
  shortText: boolean;
  maxLength: number;
  userRiskReasons: readonly CommentReviewUserRiskReason[];
}

export interface CommentReviewDecisionSummary {
  decision: CommentReviewDecision;
  reason: string;
  riskTags: readonly LowCostModerationRiskTag[];
  hitFields: readonly string[];
  userRiskReasons: readonly CommentReviewUserRiskReason[];
  fastPass: CommentFastPassEligibility;
  suggestion: string;
  decidedAt: string;
}

export interface CommentReviewDecisionInput {
  moderation: LowCostContentModerationResult;
  body: string;
  approvedDiscussionCount: number;
  requiredApprovedDiscussionCount?: number;
  maxFastPassLength?: number;
  userRiskReasons?: readonly CommentReviewUserRiskReason[];
  decidedAt?: string;
}

const RISK_LEVEL_WEIGHT: Record<LowCostModerationRiskLevel, number> = {
  [LowCostModerationRiskLevel.Low]: 1,
  [LowCostModerationRiskLevel.Medium]: 2,
  [LowCostModerationRiskLevel.High]: 3
};

export function normalizeModerationText(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\u200b-\u200f\ufeff]+/g, "")
    .replace(/[^\p{L}\p{N}\u4e00-\u9fff]/gu, "");
}

export function createContentFingerprint(text: string): string {
  const normalized = normalizeModerationText(text);
  let hash = 2166136261;

  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function matchSensitiveLexicon(
  fields: readonly LowCostContentModerationInputField[],
  lexicon: SensitiveLexiconCache = SENSITIVE_LEXICON_CACHE
): LowCostModerationHit[] {
  const normalizedFields = fields.map((field) => ({
    field: field.field,
    value: normalizeModerationText(field.value)
  }));

  return lexicon.entries.flatMap((entry) =>
    normalizedFields
      .filter((field) => field.value.includes(entry.normalizedTerm))
      .map((field) => ({
        term: entry.term,
        normalizedTerm: entry.normalizedTerm,
        category: entry.category,
        riskLevel: entry.riskLevel,
        riskTag: entry.riskTag,
        field: field.field
      }))
  );
}

export function moderateWithLowCostRules(
  options: LowCostContentModerationOptions
): LowCostContentModerationResult {
  const lexicon = options.lexicon ?? SENSITIVE_LEXICON_CACHE;
  const hits = matchSensitiveLexicon(options.fields, lexicon);
  const extraRiskTags = options.extraRiskTags ?? [];
  const riskTags = uniqueStrings([
    ...hits.map((hit) => hit.riskTag),
    ...extraRiskTags
  ]) as LowCostModerationRiskTag[];
  const riskLevel = highestRiskLevel(hits);
  const hasExtraReviewRisk = extraRiskTags.length > 0;
  const decision =
    riskLevel === LowCostModerationRiskLevel.High
      ? LowCostModerationDecision.Reject
      : riskLevel === LowCostModerationRiskLevel.Medium || hasExtraReviewRisk
        ? LowCostModerationDecision.Review
        : LowCostModerationDecision.Pass;
  const fallbackRiskTags =
    riskTags.length > 0 ? riskTags : ([LowCostModerationRiskTag.Safe] as const);
  const joinedText = options.fields.map((field) => field.value).join("\n");

  return {
    decision,
    source: LowCostModerationSource.LocalRules,
    riskLevel,
    riskTags: fallbackRiskTags,
    hits,
    reason: createLowCostModerationReason(decision, hits, hasExtraReviewRisk),
    suggestion: createLowCostModerationSuggestion(decision),
    fingerprint: createContentFingerprint(joinedText),
    moderatedAt: options.moderatedAt ?? new Date().toISOString()
  };
}

export function createLowCostModerationReason(
  decision: LowCostModerationDecision,
  hits: readonly LowCostModerationHit[],
  hasExtraReviewRisk = false
): string {
  if (decision === LowCostModerationDecision.Reject) {
    return "内容命中本地明确违规规则，未公开展示。";
  }

  if (decision === LowCostModerationDecision.Review) {
    if (hits.length > 0) {
      return "内容命中本地灰区风险规则，已转入人工复核。";
    }
    return hasExtraReviewRisk
      ? "账号频率、重复内容或近期风险异常，已转入人工复核。"
      : "内容需要人工复核。";
  }

  return "本地低成本审核未发现明显风险，内容已公开。";
}

export function createLowCostModerationSuggestion(decision: LowCostModerationDecision): string {
  if (decision === LowCostModerationDecision.Reject) {
    return "建议驳回，并提示用户修改明显违规表达。";
  }

  if (decision === LowCostModerationDecision.Review) {
    return "建议人工查看上下文后决定通过、驳回或隐藏。";
  }

  return "可快速通过，后续仍可通过举报治理。";
}

export function decideCommentReview(
  input: CommentReviewDecisionInput
): CommentReviewDecisionSummary {
  const requiredApprovedDiscussionCount = input.requiredApprovedDiscussionCount ?? 0;
  const maxLength = input.maxFastPassLength ?? 120;
  const shortText = input.body.trim().length <= maxLength;
  const baseUserRiskReasons = uniqueStrings(input.userRiskReasons ?? []);
  const userRiskReasons = baseUserRiskReasons as CommentReviewUserRiskReason[];

  if (
    input.moderation.decision === LowCostModerationDecision.Reject ||
    input.moderation.riskLevel === LowCostModerationRiskLevel.High
  ) {
    return createCommentDecisionSummary({
      decision: CommentReviewDecision.AutoReject,
      moderation: input.moderation,
      body: input.body,
      approvedDiscussionCount: input.approvedDiscussionCount,
      requiredApprovedDiscussionCount,
      maxLength,
      shortText,
      userRiskReasons: ensureRiskReason(userRiskReasons, CommentReviewUserRiskReason.TextRisk),
      reason: input.moderation.reason,
      suggestion: "已自动驳回，公开侧不可见。",
      decidedAt: input.decidedAt
    });
  }

  if (input.moderation.decision === LowCostModerationDecision.Review) {
    return createCommentDecisionSummary({
      decision: CommentReviewDecision.ManualReview,
      moderation: input.moderation,
      body: input.body,
      approvedDiscussionCount: input.approvedDiscussionCount,
      requiredApprovedDiscussionCount,
      maxLength,
      shortText,
      userRiskReasons: ensureRiskReason(userRiskReasons, CommentReviewUserRiskReason.TextRisk),
      reason: input.moderation.reason,
      suggestion: input.moderation.suggestion,
      decidedAt: input.decidedAt
    });
  }

  const coldStart =
    input.approvedDiscussionCount < requiredApprovedDiscussionCount
      ? CommentReviewUserRiskReason.NewUser
      : undefined;
  const fastPassReasons = coldStart
    ? ensureRiskReason(userRiskReasons, coldStart)
    : userRiskReasons;
  const eligible = shortText && fastPassReasons.length === 0;

  if (eligible) {
    return createCommentDecisionSummary({
      decision: CommentReviewDecision.AutoApprove,
      moderation: input.moderation,
      body: input.body,
      approvedDiscussionCount: input.approvedDiscussionCount,
      requiredApprovedDiscussionCount,
      maxLength,
      shortText,
      userRiskReasons,
      reason: "低风险短评论已自动公开。",
      suggestion: "无需人工处理，后续可通过举报和治理入口追踪。",
      decidedAt: input.decidedAt
    });
  }

  return createCommentDecisionSummary({
    decision: CommentReviewDecision.ManualReview,
    moderation: input.moderation,
    body: input.body,
    approvedDiscussionCount: input.approvedDiscussionCount,
    requiredApprovedDiscussionCount,
    maxLength,
    shortText,
    userRiskReasons: fastPassReasons,
    reason: shortText ? "用户未满足快速通过门槛，已转入人工复核。" : "评论过长，已转入人工复核。",
    suggestion: "建议人工查看上下文后决定通过、驳回或隐藏。",
    decidedAt: input.decidedAt
  });
}

export function isSensitiveLexiconCache(value: unknown): value is SensitiveLexiconCache {
  if (!value || typeof value !== "object") {
    return false;
  }

  const cache = value as SensitiveLexiconCache;
  return (
    cache.version === 1 &&
    typeof cache.sourceRepository === "string" &&
    typeof cache.sourceLicense === "string" &&
    typeof cache.syncedAt === "string" &&
    Number.isInteger(cache.entryCount) &&
    Array.isArray(cache.categories) &&
    Array.isArray(cache.entries) &&
    cache.entryCount === cache.entries.length &&
    cache.entries.every(isSensitiveLexiconEntry)
  );
}

function isSensitiveLexiconEntry(value: unknown): value is SensitiveLexiconEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const entry = value as SensitiveLexiconEntry;
  return (
    typeof entry.term === "string" &&
    typeof entry.normalizedTerm === "string" &&
    typeof entry.category === "string" &&
    isRiskLevel(entry.riskLevel) &&
    isRiskTag(entry.riskTag)
  );
}

function highestRiskLevel(hits: readonly LowCostModerationHit[]): LowCostModerationRiskLevel {
  if (hits.length === 0) {
    return LowCostModerationRiskLevel.Low;
  }

  return hits.reduce<LowCostModerationRiskLevel>(
    (highest, hit) =>
      RISK_LEVEL_WEIGHT[hit.riskLevel] > RISK_LEVEL_WEIGHT[highest] ? hit.riskLevel : highest,
    LowCostModerationRiskLevel.Low
  );
}

function isRiskLevel(value: string): value is LowCostModerationRiskLevel {
  return (Object.values(LowCostModerationRiskLevel) as string[]).includes(value);
}

function isRiskTag(value: string): value is LowCostModerationRiskTag {
  return (Object.values(LowCostModerationRiskTag) as string[]).includes(value);
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function ensureRiskReason(
  reasons: readonly CommentReviewUserRiskReason[],
  reason: CommentReviewUserRiskReason
): CommentReviewUserRiskReason[] {
  return uniqueStrings([...reasons, reason]) as CommentReviewUserRiskReason[];
}

function createCommentDecisionSummary(input: {
  decision: CommentReviewDecision;
  moderation: LowCostContentModerationResult;
  body: string;
  approvedDiscussionCount: number;
  requiredApprovedDiscussionCount: number;
  maxLength: number;
  shortText: boolean;
  userRiskReasons: readonly CommentReviewUserRiskReason[];
  reason: string;
  suggestion: string;
  decidedAt?: string;
}): CommentReviewDecisionSummary {
  return {
    decision: input.decision,
    reason: input.reason,
    riskTags: input.moderation.riskTags,
    hitFields: [...new Set(input.moderation.hits.map((hit) => hit.field))],
    userRiskReasons: input.userRiskReasons,
    fastPass: {
      eligible: input.decision === CommentReviewDecision.AutoApprove,
      approvedDiscussionCount: input.approvedDiscussionCount,
      requiredApprovedDiscussionCount: input.requiredApprovedDiscussionCount,
      shortText: input.shortText,
      maxLength: input.maxLength,
      userRiskReasons: input.userRiskReasons
    },
    suggestion: input.suggestion,
    decidedAt: input.decidedAt ?? new Date().toISOString()
  };
}
