import type {
  CommentReviewDecisionSummary,
  LowCostContentModerationResult
} from "./low-cost-content-moderation";
import type {
  ContentSecurityModerationTrace,
  ContentSecurityReviewSummary
} from "./content-security-moderation";

export const AiModerationDecision = {
  Approved: "approved",
  Rejected: "rejected",
  NeedsManualReview: "needs_manual_review"
} as const;

export type AiModerationDecision = (typeof AiModerationDecision)[keyof typeof AiModerationDecision];

export const AiModerationSource = {
  Ai: "ai",
  Mock: "mock_ai",
  WechatText: "wechat_text_security",
  WechatImage: "wechat_image_security",
  WechatMock: "wechat_content_security_mock",
  ManualFallback: "manual_fallback"
} as const;

export type AiModerationSource = (typeof AiModerationSource)[keyof typeof AiModerationSource];

export const AiModerationRiskTag = {
  Safe: "safe",
  Politics: "politics",
  Pornography: "pornography",
  Illegal: "illegal",
  Abuse: "abuse",
  PersonalAttack: "personal_attack",
  PrivacyLeak: "privacy_leak",
  Advertisement: "advertisement",
  Spam: "spam",
  Ambiguous: "ambiguous",
  ProviderFailure: "provider_failure"
} as const;

export type AiModerationRiskTag = (typeof AiModerationRiskTag)[keyof typeof AiModerationRiskTag];

export const AiModerationManualReviewReason = {
  LowConfidence: "low_confidence",
  GreyArea: "grey_area",
  Timeout: "timeout",
  ProviderError: "provider_error",
  InvalidProviderResponse: "invalid_provider_response",
  ProviderUnavailable: "provider_unavailable"
} as const;

export type AiModerationManualReviewReason =
  (typeof AiModerationManualReviewReason)[keyof typeof AiModerationManualReviewReason];

export interface AiContentModerationResult {
  decision: AiModerationDecision;
  source: AiModerationSource;
  confidence: number;
  riskTags: readonly AiModerationRiskTag[];
  reason: string;
  manualReviewReason?: AiModerationManualReviewReason;
  moderatedAt: string;
  contentSecuritySummary?: ContentSecurityReviewSummary;
}

export interface AiContentModerationTrace {
  aiModerationResult?: AiContentModerationResult;
  aiModerationReason?: string;
  manualReviewReason?: AiModerationManualReviewReason;
  lowCostModerationResult?: LowCostContentModerationResult;
  commentReviewDecision?: CommentReviewDecisionSummary;
  contentSecuritySummary?: ContentSecurityReviewSummary;
  contentSecurityImageSummaries?: ContentSecurityModerationTrace["contentSecurityImageSummaries"];
}

export function createAiModerationTrace(
  result: AiContentModerationResult
): AiContentModerationTrace {
  return {
    aiModerationResult: result,
    aiModerationReason: result.reason,
    manualReviewReason: result.manualReviewReason,
    contentSecuritySummary: result.contentSecuritySummary
  };
}
