export const ContentSecurityDecision = {
  Approved: "approved",
  Rejected: "rejected",
  NeedsManualReview: "needs_manual_review"
} as const;

export type ContentSecurityDecision =
  (typeof ContentSecurityDecision)[keyof typeof ContentSecurityDecision];

export const ContentSecuritySource = {
  LocalRules: "local_rules",
  LegacyAi: "legacy_ai",
  MockAi: "mock_ai",
  WechatText: "wechat_text_security",
  WechatImage: "wechat_image_security",
  WechatMock: "wechat_content_security_mock",
  ManualFallback: "manual_fallback"
} as const;

export type ContentSecuritySource =
  (typeof ContentSecuritySource)[keyof typeof ContentSecuritySource];

export const ContentSecurityRiskTag = {
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
  Fraud: "fraud",
  Ambiguous: "ambiguous",
  ProviderFailure: "provider_failure"
} as const;

export type ContentSecurityRiskTag =
  (typeof ContentSecurityRiskTag)[keyof typeof ContentSecurityRiskTag];

export const ContentSecurityManualReviewReason = {
  LowConfidence: "low_confidence",
  GreyArea: "grey_area",
  Timeout: "timeout",
  ProviderError: "provider_error",
  InvalidProviderResponse: "invalid_provider_response",
  ProviderUnavailable: "provider_unavailable",
  OpenidUnavailable: "openid_unavailable",
  RecentVisitRequired: "recent_visit_required",
  ImageCallbackPending: "image_callback_pending",
  ImageCallbackTimeout: "image_callback_timeout",
  MediaDownloadFailed: "media_download_failed"
} as const;

export type ContentSecurityManualReviewReason =
  (typeof ContentSecurityManualReviewReason)[keyof typeof ContentSecurityManualReviewReason];

export const AuthorVisibleStatus = {
  Public: "public",
  AuthorOnly: "author_only",
  Hidden: "hidden"
} as const;

export type AuthorVisibleStatus = (typeof AuthorVisibleStatus)[keyof typeof AuthorVisibleStatus];

export const ContentSecurityImageAuditStatus = {
  NotRequired: "not_required",
  PendingCallback: "pending_callback",
  Approved: "approved",
  Rejected: "rejected",
  ManualReview: "manual_review",
  Timeout: "timeout",
  Failed: "failed"
} as const;

export type ContentSecurityImageAuditStatus =
  (typeof ContentSecurityImageAuditStatus)[keyof typeof ContentSecurityImageAuditStatus];

export interface ContentSecurityReviewSummary {
  source: ContentSecuritySource;
  decision: ContentSecurityDecision;
  riskTags: readonly ContentSecurityRiskTag[];
  reason: string;
  suggestion: string;
  confidence?: number;
  manualReviewReason?: ContentSecurityManualReviewReason;
  providerSuggest?: string;
  providerLabel?: string;
  traceIdDigest?: string;
  imageAuditStatus?: ContentSecurityImageAuditStatus;
  normalizedAt: string;
}

export interface ContentSecurityModerationTrace {
  contentSecuritySummary?: ContentSecurityReviewSummary;
  contentSecurityImageSummaries?: readonly ContentSecurityReviewSummary[];
}

export interface WechatContentSecurityMappingInput {
  suggest?: string;
  label?: string | number;
  errcode?: number;
  errmsg?: string;
  traceId?: string;
  checkedAt?: string;
  source?: ContentSecuritySource;
}

export function mapWechatContentSecurityResult(
  input: WechatContentSecurityMappingInput
): ContentSecurityReviewSummary {
  const normalizedAt = input.checkedAt ?? new Date().toISOString();
  const source = input.source ?? ContentSecuritySource.WechatText;

  if (typeof input.errcode === "number" && input.errcode !== 0) {
    return {
      source,
      decision: ContentSecurityDecision.NeedsManualReview,
      riskTags: [ContentSecurityRiskTag.ProviderFailure],
      reason: "微信内容安全接口未能确认内容风险，已转入人工复核。",
      suggestion: "建议人工查看上下文后决定通过、驳回或隐藏。",
      manualReviewReason: mapWechatErrorToManualReviewReason(input.errcode),
      providerSuggest: "error",
      providerLabel: input.errcode.toString(),
      traceIdDigest: input.traceId ? digestTraceId(input.traceId) : undefined,
      normalizedAt
    };
  }

  const suggest = normalizeWechatSuggest(input.suggest);
  const riskTags = mapWechatLabelToRiskTags(input.label);
  const decision =
    suggest === "pass"
      ? ContentSecurityDecision.Approved
      : suggest === "risky"
        ? ContentSecurityDecision.Rejected
        : ContentSecurityDecision.NeedsManualReview;

  return {
    source,
    decision,
    riskTags:
      decision === ContentSecurityDecision.Approved ? [ContentSecurityRiskTag.Safe] : riskTags,
    reason: createWechatContentSecurityReason(decision),
    suggestion: createContentSecuritySuggestion(decision),
    manualReviewReason:
      decision === ContentSecurityDecision.NeedsManualReview
        ? ContentSecurityManualReviewReason.GreyArea
        : undefined,
    providerSuggest: suggest,
    providerLabel: input.label === undefined ? undefined : String(input.label),
    traceIdDigest: input.traceId ? digestTraceId(input.traceId) : undefined,
    normalizedAt
  };
}

export function createContentSecuritySummary(input: {
  source: ContentSecuritySource;
  decision: ContentSecurityDecision;
  riskTags?: readonly ContentSecurityRiskTag[];
  reason: string;
  suggestion?: string;
  confidence?: number;
  manualReviewReason?: ContentSecurityManualReviewReason;
  providerSuggest?: string;
  providerLabel?: string;
  traceId?: string;
  imageAuditStatus?: ContentSecurityImageAuditStatus;
  normalizedAt?: string;
}): ContentSecurityReviewSummary {
  return {
    source: input.source,
    decision: input.decision,
    riskTags:
      input.riskTags && input.riskTags.length > 0 ? input.riskTags : [ContentSecurityRiskTag.Safe],
    reason: input.reason,
    suggestion: input.suggestion ?? createContentSecuritySuggestion(input.decision),
    confidence: input.confidence,
    manualReviewReason: input.manualReviewReason,
    providerSuggest: input.providerSuggest,
    providerLabel: input.providerLabel,
    traceIdDigest: input.traceId ? digestTraceId(input.traceId) : undefined,
    imageAuditStatus: input.imageAuditStatus,
    normalizedAt: input.normalizedAt ?? new Date().toISOString()
  };
}

export function createContentSecuritySuggestion(decision: ContentSecurityDecision): string {
  if (decision === ContentSecurityDecision.Approved) {
    return "可公开展示，后续仍可通过举报治理。";
  }

  if (decision === ContentSecurityDecision.Rejected) {
    return "建议驳回，并提示用户修改明显违规表达。";
  }

  return "建议人工查看上下文后决定通过、驳回或隐藏。";
}

export function digestTraceId(traceId: string): string {
  let hash = 2166136261;
  for (let index = 0; index < traceId.length; index += 1) {
    hash ^= traceId.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `trace_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function mapWechatLabelToRiskTags(
  label: string | number | undefined
): ContentSecurityRiskTag[] {
  const normalized = String(label ?? "").toLowerCase();

  if (!normalized || normalized === "100" || normalized === "normal" || normalized === "pass") {
    return [ContentSecurityRiskTag.Safe];
  }

  const mapping: Record<string, ContentSecurityRiskTag[]> = {
    "10001": [ContentSecurityRiskTag.Advertisement, ContentSecurityRiskTag.Spam],
    "20001": [ContentSecurityRiskTag.Politics],
    "20002": [ContentSecurityRiskTag.Pornography],
    "20003": [ContentSecurityRiskTag.Abuse, ContentSecurityRiskTag.PersonalAttack],
    "20006": [ContentSecurityRiskTag.Illegal],
    "20008": [ContentSecurityRiskTag.Fraud, ContentSecurityRiskTag.Spam],
    "20012": [ContentSecurityRiskTag.Ambiguous],
    politics: [ContentSecurityRiskTag.Politics],
    pornography: [ContentSecurityRiskTag.Pornography],
    porn: [ContentSecurityRiskTag.Pornography],
    illegal: [ContentSecurityRiskTag.Illegal],
    abuse: [ContentSecurityRiskTag.Abuse, ContentSecurityRiskTag.PersonalAttack],
    ad: [ContentSecurityRiskTag.Advertisement, ContentSecurityRiskTag.Spam],
    advertisement: [ContentSecurityRiskTag.Advertisement, ContentSecurityRiskTag.Spam],
    spam: [ContentSecurityRiskTag.Spam],
    privacy: [ContentSecurityRiskTag.PrivacyLeak],
    fraud: [ContentSecurityRiskTag.Fraud, ContentSecurityRiskTag.Spam],
    violence: [ContentSecurityRiskTag.Violence]
  };

  return mapping[normalized] ?? [ContentSecurityRiskTag.Ambiguous];
}

export function mapWechatErrorToManualReviewReason(
  errcode: number
): ContentSecurityManualReviewReason {
  if (errcode === 47001) {
    return ContentSecurityManualReviewReason.InvalidProviderResponse;
  }

  if (errcode === 40003 || errcode === 41030) {
    return ContentSecurityManualReviewReason.OpenidUnavailable;
  }

  if (errcode === 87014 || errcode === 87009) {
    return ContentSecurityManualReviewReason.RecentVisitRequired;
  }

  return ContentSecurityManualReviewReason.ProviderError;
}

function normalizeWechatSuggest(value: unknown): "pass" | "risky" | "review" {
  if (value === "pass" || value === "risky" || value === "review") {
    return value;
  }

  return "review";
}

function createWechatContentSecurityReason(decision: ContentSecurityDecision): string {
  if (decision === ContentSecurityDecision.Approved) {
    return "微信内容安全未发现明显风险。";
  }

  if (decision === ContentSecurityDecision.Rejected) {
    return "微信内容安全判定内容存在风险，请修改后再提交。";
  }

  return "微信内容安全无法确认内容风险，已转入人工复核。";
}
