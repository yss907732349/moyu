import { Injectable, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  AiModerationDecision,
  AiModerationManualReviewReason,
  AiModerationRiskTag,
  AiModerationSource,
  ContentSecurityDecision,
  ContentSecurityImageAuditStatus,
  ContentSecurityManualReviewReason,
  ContentSecurityRiskTag,
  ContentSecuritySource,
  createContentSecuritySummary,
  mapWechatContentSecurityResult,
  type AiContentModerationResult
} from "@moyuxia/shared";
import { PrismaService } from "./prisma.service";
import {
  WechatContentSecurityClient,
  WechatContentSecurityError
} from "./wechat-content-security.client";

export interface ModerateUserContentInput {
  contentType:
    | "daily_article_comment"
    | "world_intel_comment"
    | "community_post"
    | "community_comment"
    | "community_reply"
    | "profile_display_name";
  userId?: string;
  openid?: string;
  title?: string;
  body: string;
}

@Injectable()
export class AiContentModerationService {
  constructor(
    private readonly configService: ConfigService,
    @Optional() private readonly wechatClient?: WechatContentSecurityClient,
    @Optional() private readonly prisma?: PrismaService
  ) {}

  async moderateUserContent(input: ModerateUserContentInput): Promise<AiContentModerationResult> {
    const mockResult = this.configService.get<string>("AI_CONTENT_MODERATION_MOCK_RESULT");
    const now = new Date().toISOString();
    const text = normalizeModerationText(`${input.title ?? ""}\n${input.body}`);
    const hardRejectResult = this.moderateTextHardRules(text, now);

    if (hardRejectResult) {
      return hardRejectResult;
    }

    if (this.isWechatMockEnabled()) {
      return this.createWechatMockResult(
        this.configService.get<string>("WECHAT_CONTENT_SECURITY_MOCK_TEXT_RESULT") ||
          this.configService.get<string>("WECHAT_CONTENT_SECURITY_MOCK_RESULT") ||
          "pass",
        now
      );
    }

    if (mockResult) {
      return this.createMockResult(mockResult, now);
    }

    if (
      this.configService.get<string>("AI_CONTENT_MODERATION_FORCE_PROVIDER_ERROR") === "true" ||
      this.configService.get<string>("WECHAT_CONTENT_SECURITY_FORCE_PROVIDER_ERROR") === "true"
    ) {
      return this.needsManualReview(
        "内容安全供应商暂不可用，已转入人工复核。",
        AiModerationManualReviewReason.ProviderError,
        [AiModerationRiskTag.ProviderFailure],
        now,
        0,
        ContentSecuritySource.ManualFallback,
        ContentSecurityManualReviewReason.ProviderError
      );
    }

    if (this.isWechatEnabled()) {
      return this.moderateWithWechat(input, now);
    }

    if (hasAny(text, ["可能违规", "边界", "灰区", "不确定", "争议"])) {
      return this.needsManualReview(
        "AI 无法稳定确认内容风险，已转入人工复核。",
        AiModerationManualReviewReason.GreyArea,
        [AiModerationRiskTag.Ambiguous],
        now,
        0.52,
        ContentSecuritySource.LegacyAi,
        ContentSecurityManualReviewReason.GreyArea
      );
    }

    return {
      decision: AiModerationDecision.Approved,
      source: AiModerationSource.Ai,
      confidence: 0.9,
      riskTags: [AiModerationRiskTag.Safe],
      reason: "AI 初筛未发现明显风险，内容已公开。",
      moderatedAt: now,
      contentSecuritySummary: createContentSecuritySummary({
        source: ContentSecuritySource.LegacyAi,
        decision: ContentSecurityDecision.Approved,
        riskTags: [ContentSecurityRiskTag.Safe],
        reason: "AI 初筛未发现明显风险，内容已公开。",
        confidence: 0.9,
        normalizedAt: now
      })
    };
  }

  private moderateTextHardRules(text: string, now: string): AiContentModerationResult | undefined {
    if (
      hasAny(text, [
        "广告",
        "加微信",
        "私聊返利",
        "开户链接",
        "推广链接",
        "tg群",
        "电报群",
        "身份证",
        "手机号",
        "银行卡号"
      ])
    ) {
      return {
        decision: AiModerationDecision.Rejected,
        source: AiModerationSource.Ai,
        confidence: 0.94,
        riskTags: [AiModerationRiskTag.Advertisement, AiModerationRiskTag.PrivacyLeak],
        reason: "内容疑似包含广告引流或隐私信息，请修改后再提交。",
        moderatedAt: now,
        contentSecuritySummary: createContentSecuritySummary({
          source: ContentSecuritySource.LegacyAi,
          decision: ContentSecurityDecision.Rejected,
          riskTags: [ContentSecurityRiskTag.Advertisement, ContentSecurityRiskTag.PrivacyLeak],
          reason: "内容疑似包含广告引流或隐私信息，请修改后再提交。",
          confidence: 0.94,
          normalizedAt: now
        })
      };
    }

    if (
      hasAny(text, [
        "涉黄",
        "色情",
        "黄图",
        "黄片",
        "裸聊",
        "约炮",
        "奶子",
        "黄虫",
        "黄色网站",
        "成人视频"
      ])
    ) {
      return {
        decision: AiModerationDecision.Rejected,
        source: AiModerationSource.Ai,
        confidence: 0.96,
        riskTags: [AiModerationRiskTag.Pornography],
        reason: "内容包含低俗或涉黄表达，未公开展示。",
        moderatedAt: now,
        contentSecuritySummary: createContentSecuritySummary({
          source: ContentSecuritySource.LegacyAi,
          decision: ContentSecurityDecision.Rejected,
          riskTags: [ContentSecurityRiskTag.Pornography],
          reason: "内容包含低俗或涉黄表达，未公开展示。",
          confidence: 0.96,
          normalizedAt: now
        })
      };
    }

    if (
      hasAny(text, [
        "辱骂",
        "人身攻击",
        "违法",
        "涉政",
        "强奸",
        "強奸",
        "轮奸",
        "迷奸",
        "猥亵",
        "强暴",
        "杀人",
        "砍死",
        "弄死",
        "去死",
        "傻逼",
        "煞笔",
        "草你妈",
        "操你妈",
        "妈的",
        "nmsl"
      ])
    ) {
      return {
        decision: AiModerationDecision.Rejected,
        source: AiModerationSource.Ai,
        confidence: 0.96,
        riskTags: [AiModerationRiskTag.Abuse, AiModerationRiskTag.Illegal],
        reason: "内容包含明显违规表达，未公开展示。",
        moderatedAt: now,
        contentSecuritySummary: createContentSecuritySummary({
          source: ContentSecuritySource.LegacyAi,
          decision: ContentSecurityDecision.Rejected,
          riskTags: [ContentSecurityRiskTag.Abuse, ContentSecurityRiskTag.Illegal],
          reason: "内容包含明显违规表达，未公开展示。",
          confidence: 0.96,
          normalizedAt: now
        })
      };
    }

    return undefined;
  }

  async submitImageContentSecurity(input: {
    userId?: string;
    openid?: string;
    mediaUrl: string;
    mediaType?: "image";
  }): Promise<AiContentModerationResult> {
    const now = new Date().toISOString();

    if (this.isWechatMockEnabled()) {
      const mockResult =
        this.configService.get<string>("WECHAT_CONTENT_SECURITY_MOCK_IMAGE_RESULT") || "review";
      return this.createWechatMockResult(mockResult, now, ContentSecuritySource.WechatImage);
    }

    if (!isValidWechatMediaUrl(input.mediaUrl)) {
      return this.needsManualReview(
        "图片地址无法提供给微信内容安全下载，已转入人工复核。",
        AiModerationManualReviewReason.ProviderUnavailable,
        [AiModerationRiskTag.ProviderFailure],
        now,
        0,
        ContentSecuritySource.WechatImage,
        ContentSecurityManualReviewReason.MediaDownloadFailed,
        ContentSecurityImageAuditStatus.Failed
      );
    }

    if (!this.isWechatEnabled()) {
      return this.needsManualReview(
        "微信图片内容安全未启用，已转入人工复核。",
        AiModerationManualReviewReason.ProviderUnavailable,
        [AiModerationRiskTag.ProviderFailure],
        now,
        0,
        ContentSecuritySource.WechatImage,
        ContentSecurityManualReviewReason.ProviderUnavailable,
        ContentSecurityImageAuditStatus.ManualReview
      );
    }

    const openid = await this.resolveOpenid(input);
    if (!openid) {
      return this.needsManualReview(
        "缺少有效微信 openid，图片已转入人工复核。",
        AiModerationManualReviewReason.ProviderUnavailable,
        [AiModerationRiskTag.ProviderFailure],
        now,
        0,
        ContentSecuritySource.WechatImage,
        ContentSecurityManualReviewReason.OpenidUnavailable,
        ContentSecurityImageAuditStatus.ManualReview
      );
    }

    if (!this.wechatClient) {
      return this.needsManualReview(
        "微信内容安全客户端未注册，图片已转入人工复核。",
        AiModerationManualReviewReason.ProviderUnavailable,
        [AiModerationRiskTag.ProviderFailure],
        now,
        0,
        ContentSecuritySource.WechatImage,
        ContentSecurityManualReviewReason.ProviderUnavailable,
        ContentSecurityImageAuditStatus.ManualReview
      );
    }

    try {
      const response = await this.wechatClient.submitImage({
        openid,
        mediaUrl: input.mediaUrl,
        mediaType: 2,
        scene: 3
      });
      const summary = mapWechatContentSecurityResult({
        suggest: response.result?.suggest ?? "review",
        label: response.result?.label,
        errcode: response.errcode,
        errmsg: response.errmsg,
        traceId: response.trace_id,
        checkedAt: now,
        source: ContentSecuritySource.WechatImage
      });

      return contentSecuritySummaryToAiResult(
        {
          ...summary,
          imageAuditStatus:
            summary.decision === ContentSecurityDecision.Approved
              ? ContentSecurityImageAuditStatus.PendingCallback
              : summary.decision === ContentSecurityDecision.Rejected
                ? ContentSecurityImageAuditStatus.Rejected
                : ContentSecurityImageAuditStatus.ManualReview
        },
        now
      );
    } catch (error) {
      return this.providerErrorResult(error, now, ContentSecuritySource.WechatImage);
    }
  }

  private createMockResult(mockResult: string, now: string): AiContentModerationResult {
    if (mockResult === AiModerationDecision.Approved) {
      return {
        decision: AiModerationDecision.Approved,
        source: AiModerationSource.Mock,
        confidence: 0.99,
        riskTags: [AiModerationRiskTag.Safe],
        reason: "mock AI 审核通过",
        moderatedAt: now,
        contentSecuritySummary: createContentSecuritySummary({
          source: ContentSecuritySource.MockAi,
          decision: ContentSecurityDecision.Approved,
          riskTags: [ContentSecurityRiskTag.Safe],
          reason: "mock AI 审核通过",
          confidence: 0.99,
          normalizedAt: now
        })
      };
    }

    if (mockResult === AiModerationDecision.Rejected) {
      return {
        decision: AiModerationDecision.Rejected,
        source: AiModerationSource.Mock,
        confidence: 0.99,
        riskTags: [AiModerationRiskTag.Spam],
        reason: "mock AI 审核驳回",
        moderatedAt: now,
        contentSecuritySummary: createContentSecuritySummary({
          source: ContentSecuritySource.MockAi,
          decision: ContentSecurityDecision.Rejected,
          riskTags: [ContentSecurityRiskTag.Spam],
          reason: "mock AI 审核驳回",
          confidence: 0.99,
          normalizedAt: now
        })
      };
    }

    if (mockResult === "provider_error") {
      return this.needsManualReview(
        "mock AI 供应商失败，已转入人工复核。",
        AiModerationManualReviewReason.ProviderError,
        [AiModerationRiskTag.ProviderFailure],
        now,
        0,
        ContentSecuritySource.MockAi,
        ContentSecurityManualReviewReason.ProviderError
      );
    }

    return this.needsManualReview(
      "mock AI 低置信度，已转入人工复核。",
      AiModerationManualReviewReason.LowConfidence,
      [AiModerationRiskTag.Ambiguous],
      now,
      0.4,
      ContentSecuritySource.MockAi,
      ContentSecurityManualReviewReason.LowConfidence
    );
  }

  private async moderateWithWechat(
    input: ModerateUserContentInput,
    now: string
  ): Promise<AiContentModerationResult> {
    const openid = await this.resolveOpenid(input);
    if (!openid) {
      return this.needsManualReview(
        "缺少有效微信 openid，内容已转入人工复核。",
        AiModerationManualReviewReason.ProviderUnavailable,
        [AiModerationRiskTag.ProviderFailure],
        now,
        0,
        ContentSecuritySource.WechatText,
        ContentSecurityManualReviewReason.OpenidUnavailable
      );
    }

    if (!this.wechatClient) {
      return this.needsManualReview(
        "微信内容安全客户端未注册，已转入人工复核。",
        AiModerationManualReviewReason.ProviderUnavailable,
        [AiModerationRiskTag.ProviderFailure],
        now,
        0,
        ContentSecuritySource.WechatText,
        ContentSecurityManualReviewReason.ProviderUnavailable
      );
    }

    try {
      const response = await this.wechatClient.checkText({
        openid,
        content: `${input.title ?? ""}\n${input.body}`.trim(),
        scene: contentTypeToWechatScene(input.contentType)
      });
      return contentSecuritySummaryToAiResult(
        mapWechatContentSecurityResult({
          suggest: response.result?.suggest,
          label: response.result?.label,
          errcode: response.errcode,
          errmsg: response.errmsg,
          traceId: response.trace_id,
          checkedAt: now,
          source: ContentSecuritySource.WechatText
        }),
        now
      );
    } catch (error) {
      return this.providerErrorResult(error, now, ContentSecuritySource.WechatText);
    }
  }

  private createWechatMockResult(
    mockResult: string,
    now: string,
    source: ContentSecuritySource = ContentSecuritySource.WechatMock
  ): AiContentModerationResult {
    const normalized = mockResult === "approved" ? "pass" : mockResult;
    const summary = mapWechatContentSecurityResult({
      suggest:
        normalized === "pass" || normalized === "risky" || normalized === "review"
          ? normalized
          : "review",
      label:
        normalized === "risky"
          ? "10001"
          : normalized === "review" || normalized === "provider_error"
            ? "ambiguous"
            : "100",
      errcode: normalized === "provider_error" ? -1 : 0,
      checkedAt: now,
      traceId: `mock-trace-${now}`,
      source
    });
    return contentSecuritySummaryToAiResult(
      {
        ...summary,
        source,
        imageAuditStatus:
          source === ContentSecuritySource.WechatImage
            ? normalized === "pass"
              ? ContentSecurityImageAuditStatus.Approved
              : normalized === "risky"
                ? ContentSecurityImageAuditStatus.Rejected
                : ContentSecurityImageAuditStatus.ManualReview
            : undefined
      },
      now
    );
  }

  private providerErrorResult(
    error: unknown,
    now: string,
    source: ContentSecuritySource
  ): AiContentModerationResult {
    const isTimeout = error instanceof WechatContentSecurityError && error.message.includes("超时");
    return this.needsManualReview(
      "微信内容安全接口未能确认内容风险，已转入人工复核。",
      isTimeout
        ? AiModerationManualReviewReason.Timeout
        : AiModerationManualReviewReason.ProviderError,
      [AiModerationRiskTag.ProviderFailure],
      now,
      0,
      source,
      isTimeout
        ? ContentSecurityManualReviewReason.Timeout
        : ContentSecurityManualReviewReason.ProviderError,
      source === ContentSecuritySource.WechatImage
        ? isTimeout
          ? ContentSecurityImageAuditStatus.Timeout
          : ContentSecurityImageAuditStatus.Failed
        : undefined
    );
  }

  private async resolveOpenid(input: { openid?: string; userId?: string }): Promise<string | null> {
    if (input.openid?.trim()) {
      return input.openid.trim();
    }

    if (!input.userId || !this.prisma || !this.isDatabaseConfigured()) {
      return null;
    }

    const delegate = (
      this.prisma as unknown as {
        wechatIdentity?: {
          findFirst(input: Record<string, unknown>): Promise<{ openid: string } | null>;
        };
      }
    ).wechatIdentity;

    const identity = await delegate?.findFirst({
      where: { userId: input.userId },
      orderBy: [{ updatedAt: "desc" }]
    });
    return identity?.openid ?? null;
  }

  private isWechatEnabled(): boolean {
    return this.configService.get<string>("WECHAT_CONTENT_SECURITY_ENABLED") === "true";
  }

  private isWechatMockEnabled(): boolean {
    return this.configService.get<string>("WECHAT_CONTENT_SECURITY_MOCK_ENABLED") === "true";
  }

  private isDatabaseConfigured(): boolean {
    return (
      !this.prisma ||
      typeof this.prisma.isDatabaseConfigured !== "function" ||
      this.prisma.isDatabaseConfigured()
    );
  }

  private needsManualReview(
    reason: string,
    manualReviewReason: AiModerationManualReviewReason,
    riskTags: readonly AiModerationRiskTag[],
    moderatedAt: string,
    confidence = 0,
    source: ContentSecuritySource = ContentSecuritySource.ManualFallback,
    contentSecurityManualReviewReason: ContentSecurityManualReviewReason = ContentSecurityManualReviewReason.ProviderUnavailable,
    imageAuditStatus?: ContentSecurityImageAuditStatus
  ): AiContentModerationResult {
    return {
      decision: AiModerationDecision.NeedsManualReview,
      source: AiModerationSource.ManualFallback,
      confidence,
      riskTags,
      reason,
      manualReviewReason,
      moderatedAt,
      contentSecuritySummary: createContentSecuritySummary({
        source,
        decision: ContentSecurityDecision.NeedsManualReview,
        riskTags: [ContentSecurityRiskTag.ProviderFailure],
        reason,
        confidence,
        manualReviewReason: contentSecurityManualReviewReason,
        imageAuditStatus,
        normalizedAt: moderatedAt
      })
    };
  }
}

function contentSecuritySummaryToAiResult(
  summary: ReturnType<typeof createContentSecuritySummary>,
  moderatedAt: string
): AiContentModerationResult {
  const decision = contentSecurityDecisionToAiDecision(summary.decision);
  return {
    decision,
    source: contentSecuritySourceToAiSource(summary.source),
    confidence: summary.confidence ?? (decision === AiModerationDecision.Approved ? 0.95 : 0.4),
    riskTags: summary.riskTags.map(contentSecurityRiskTagToAiRiskTag),
    reason: summary.reason,
    manualReviewReason:
      decision === AiModerationDecision.NeedsManualReview
        ? contentSecurityManualReviewReasonToAi(summary.manualReviewReason)
        : undefined,
    moderatedAt,
    contentSecuritySummary: summary
  };
}

function contentSecurityDecisionToAiDecision(
  decision: ContentSecurityDecision
): AiModerationDecision {
  if (decision === ContentSecurityDecision.Approved) {
    return AiModerationDecision.Approved;
  }
  if (decision === ContentSecurityDecision.Rejected) {
    return AiModerationDecision.Rejected;
  }
  return AiModerationDecision.NeedsManualReview;
}

function contentSecuritySourceToAiSource(source: ContentSecuritySource): AiModerationSource {
  if (source === ContentSecuritySource.WechatText) {
    return AiModerationSource.WechatText;
  }
  if (source === ContentSecuritySource.WechatImage) {
    return AiModerationSource.WechatImage;
  }
  if (source === ContentSecuritySource.WechatMock) {
    return AiModerationSource.WechatMock;
  }
  if (source === ContentSecuritySource.MockAi) {
    return AiModerationSource.Mock;
  }
  if (source === ContentSecuritySource.LegacyAi) {
    return AiModerationSource.Ai;
  }
  return AiModerationSource.ManualFallback;
}

function contentSecurityRiskTagToAiRiskTag(tag: ContentSecurityRiskTag): AiModerationRiskTag {
  const mapping: Partial<Record<ContentSecurityRiskTag, AiModerationRiskTag>> = {
    [ContentSecurityRiskTag.Safe]: AiModerationRiskTag.Safe,
    [ContentSecurityRiskTag.Politics]: AiModerationRiskTag.Politics,
    [ContentSecurityRiskTag.Pornography]: AiModerationRiskTag.Pornography,
    [ContentSecurityRiskTag.Illegal]: AiModerationRiskTag.Illegal,
    [ContentSecurityRiskTag.Abuse]: AiModerationRiskTag.Abuse,
    [ContentSecurityRiskTag.PersonalAttack]: AiModerationRiskTag.PersonalAttack,
    [ContentSecurityRiskTag.PrivacyLeak]: AiModerationRiskTag.PrivacyLeak,
    [ContentSecurityRiskTag.Advertisement]: AiModerationRiskTag.Advertisement,
    [ContentSecurityRiskTag.Spam]: AiModerationRiskTag.Spam,
    [ContentSecurityRiskTag.Ambiguous]: AiModerationRiskTag.Ambiguous,
    [ContentSecurityRiskTag.ProviderFailure]: AiModerationRiskTag.ProviderFailure
  };
  return mapping[tag] ?? AiModerationRiskTag.Ambiguous;
}

function contentSecurityManualReviewReasonToAi(
  reason?: ContentSecurityManualReviewReason
): AiModerationManualReviewReason {
  if (reason === ContentSecurityManualReviewReason.Timeout) {
    return AiModerationManualReviewReason.Timeout;
  }
  if (reason === ContentSecurityManualReviewReason.InvalidProviderResponse) {
    return AiModerationManualReviewReason.InvalidProviderResponse;
  }
  if (reason === ContentSecurityManualReviewReason.ProviderError) {
    return AiModerationManualReviewReason.ProviderError;
  }
  if (reason === ContentSecurityManualReviewReason.LowConfidence) {
    return AiModerationManualReviewReason.LowConfidence;
  }
  if (reason === ContentSecurityManualReviewReason.GreyArea) {
    return AiModerationManualReviewReason.GreyArea;
  }
  return AiModerationManualReviewReason.ProviderUnavailable;
}

function contentTypeToWechatScene(contentType: ModerateUserContentInput["contentType"]): number {
  if (contentType === "profile_display_name") {
    return 1;
  }
  if (contentType === "community_post") {
    return 3;
  }
  return 2;
}

function isValidWechatMediaUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function hasAny(text: string, keywords: readonly string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

function normalizeModerationText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[，。！？、,.!?;；:："'“”‘’()[\]{}<>《》|\\/_-]/g, "");
}
