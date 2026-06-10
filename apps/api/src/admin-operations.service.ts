import { Injectable, NotFoundException } from "@nestjs/common";
import {
  AdminOperationsSource,
  AdminOperationsRealtimeEventType,
  AdminOperationsRealtimeTargetType,
  AdminReviewAction,
  AdminReviewItemType,
  AdminReviewStatus,
  assertAdminOperationsNoSensitiveFields,
  createAdminOperationsAiSummary,
  type AdminOperationsRealtimeEvent,
  type AdminOperationsTodoSummary,
  type AdminOperationsReviewDetail,
  type AdminOperationsReviewDetailResponse,
  type AdminOperationsReviewQueueItem,
  type AdminOperationsReviewQueueQuery,
  type AdminOperationsReviewQueueResponse,
  type AdminOperationsWorkbenchResponse,
  type CommunityReportReviewDetail,
  type DailyContentArticleComment,
  type DailyContentIssue
} from "@moyuxia/shared";
import { CommunityLiteService } from "./community-lite.service";
import { DailyContentFeedService } from "./daily-content-feed.service";

@Injectable()
export class AdminOperationsService {
  private readonly realtimeSubscribers = new Set<(event: AdminOperationsRealtimeEvent) => void>();
  private eventSequence = 0;

  constructor(
    private readonly communityLiteService: CommunityLiteService,
    private readonly dailyContentFeedService: DailyContentFeedService
  ) {}

  async getWorkbench(): Promise<AdminOperationsWorkbenchResponse> {
    const [communityQueue, communityDiscussionStats, dailyComments, dailyIssues] =
      await Promise.all([
        this.communityLiteService.listPendingQueue(),
        this.communityLiteService.getDiscussionReviewDecisionStats(),
        this.dailyContentFeedService.listPendingArticleComments(),
        this.dailyContentFeedService.listAdminIssues()
      ]);
    const pendingDailyIssueStatuses = new Set<string>([
      AdminReviewStatus.Draft,
      AdminReviewStatus.Scheduled
    ]);
    const pendingDailyIssues = dailyIssues.filter((issue) =>
      pendingDailyIssueStatuses.has(issue.status)
    );
    const items = [
      ...communityQueue.posts.map(postToQueueItem),
      ...communityQueue.comments.map(commentToQueueItem),
      ...communityQueue.replies.map(replyToQueueItem),
      ...communityQueue.reports.map(reportToQueueItem),
      ...dailyComments.map(dailyCommentToQueueItem),
      ...pendingDailyIssues.map(dailyIssueToQueueItem)
    ].sort((first, second) => second.createdAt.localeCompare(first.createdAt));
    const response = {
      counts: {
        pendingCommunityPosts: communityQueue.posts.length,
        pendingCommunityComments: communityQueue.comments.length,
        pendingCommunityReplies: communityQueue.replies.length,
        pendingCommunityReports: communityQueue.reports.length,
        pendingDailyContentComments: dailyComments.length,
        pendingDailyContentIssues: pendingDailyIssues.length,
        autoApprovedCommunityDiscussions: communityDiscussionStats.autoApproved,
        autoRejectedCommunityDiscussions: communityDiscussionStats.autoRejected,
        manualReviewCommunityDiscussions: communityDiscussionStats.manualReview,
        contentSecurityAutoApproved: communityDiscussionStats.autoApproved,
        contentSecurityAutoRejected: communityDiscussionStats.autoRejected,
        wechatImagePendingCallbacks: countPendingImageCallbacks(items),
        wechatUnableToConfirm: countUnableToConfirm(items)
      },
      communityGovernanceEntry: {
        title: "社区内容治理",
        description: "查看全量帖子、搜索历史内容并处理作者治理状态",
        endpoint: "/admin/community-governance/posts"
      },
      recentTodos: items.slice(0, 10)
    };
    assertAdminOperationsNoSensitiveFields(response);
    return response;
  }

  async getTodoSummary(): Promise<AdminOperationsTodoSummary> {
    const workbench = await this.getWorkbench();
    const pendingCount = totalPendingCount(workbench.counts);
    const response: AdminOperationsTodoSummary = {
      pendingCount,
      counts: workbench.counts,
      queueDelta: {
        added: 0,
        removed: 0,
        updated: 0,
        pendingTotal: pendingCount,
        source: AdminOperationsSource.Workbench,
        targetType: AdminOperationsRealtimeTargetType.Workbench
      },
      generatedAt: new Date().toISOString()
    };
    assertAdminOperationsNoSensitiveFields(response);
    return response;
  }

  subscribeRealtimeEvents(subscriber: (event: AdminOperationsRealtimeEvent) => void): () => void {
    this.realtimeSubscribers.add(subscriber);
    return () => {
      this.realtimeSubscribers.delete(subscriber);
    };
  }

  async createSnapshotEvent(): Promise<AdminOperationsRealtimeEvent> {
    return this.createRealtimeEvent({
      eventType: AdminOperationsRealtimeEventType.WorkbenchCountsChanged,
      source: AdminOperationsSource.Workbench,
      targetType: AdminOperationsRealtimeTargetType.Workbench,
      targetId: "workbench",
      queueDelta: { added: 0, removed: 0, updated: 0 }
    });
  }

  async publishReviewCreated(
    source: AdminOperationsSource,
    targetType: AdminOperationsRealtimeTargetType,
    targetId: string
  ): Promise<void> {
    await this.publishRealtimeEvent({
      eventType:
        targetType === AdminOperationsRealtimeTargetType.CommunityReport
          ? AdminOperationsRealtimeEventType.ReportCreated
          : targetType === AdminOperationsRealtimeTargetType.DailyContentComment
            ? AdminOperationsRealtimeEventType.DailyCommentReviewCreated
            : AdminOperationsRealtimeEventType.ReviewCreated,
      source,
      targetType,
      targetId,
      queueDelta: { added: 1, removed: 0, updated: 0 }
    });
  }

  async publishReviewStateChanged(
    source: AdminOperationsSource,
    targetType: AdminOperationsRealtimeTargetType,
    targetId: string
  ): Promise<void> {
    await this.publishRealtimeEvent({
      eventType: AdminOperationsRealtimeEventType.ReviewStateChanged,
      source,
      targetType,
      targetId,
      queueDelta: { added: 0, removed: 1, updated: 1 }
    });
  }

  async publishWorkbenchCountsChanged(
    source: AdminOperationsSource,
    targetType: AdminOperationsRealtimeTargetType,
    targetId: string
  ): Promise<void> {
    await this.publishRealtimeEvent({
      eventType: AdminOperationsRealtimeEventType.WorkbenchCountsChanged,
      source,
      targetType,
      targetId,
      queueDelta: { added: 0, removed: 0, updated: 1 }
    });
  }

  private async publishRealtimeEvent(input: {
    eventType: AdminOperationsRealtimeEventType;
    source: AdminOperationsSource;
    targetType: AdminOperationsRealtimeTargetType;
    targetId: string;
    queueDelta: Pick<AdminOperationsRealtimeEvent["queueDelta"], "added" | "removed" | "updated">;
  }): Promise<void> {
    const event = await this.createRealtimeEvent(input);
    for (const subscriber of this.realtimeSubscribers) {
      subscriber(event);
    }
  }

  private async createRealtimeEvent(input: {
    eventType: AdminOperationsRealtimeEventType;
    source: AdminOperationsSource;
    targetType: AdminOperationsRealtimeTargetType;
    targetId: string;
    queueDelta: Pick<AdminOperationsRealtimeEvent["queueDelta"], "added" | "removed" | "updated">;
  }): Promise<AdminOperationsRealtimeEvent> {
    const summary = await this.getTodoSummary();
    const event: AdminOperationsRealtimeEvent = {
      eventId: `admin-event-${Date.now()}-${++this.eventSequence}`,
      eventType: input.eventType,
      source: input.source,
      targetType: input.targetType,
      targetId: input.targetId,
      createdAt: new Date().toISOString(),
      pendingCount: summary.pendingCount,
      queueDelta: {
        ...input.queueDelta,
        pendingTotal: summary.pendingCount,
        source: input.source,
        targetType: input.targetType
      }
    };
    assertAdminOperationsNoSensitiveFields(event);
    return event;
  }

  async getReviewQueue(
    query: AdminOperationsReviewQueueQuery | Record<string, string | undefined>
  ): Promise<AdminOperationsReviewQueueResponse> {
    const reportFilters = createReportReviewFilters(query);
    const useReportProjection = hasReportReviewFilters(query);
    const [communityQueue, dailyComments, reviewReports] = await Promise.all([
      this.communityLiteService.listPendingQueue(),
      this.dailyContentFeedService.listPendingArticleComments(),
      useReportProjection
        ? this.communityLiteService.listReportsForReview(reportFilters)
        : Promise.resolve(undefined)
    ]);
    const reports = reviewReports ?? communityQueue.reports;
    const items = [
      ...communityQueue.posts.map(postToQueueItem),
      ...communityQueue.comments.map(commentToQueueItem),
      ...communityQueue.replies.map(replyToQueueItem),
      ...reports.map(reportToQueueItem),
      ...dailyComments.map(dailyCommentToQueueItem)
    ]
      .filter((item) => matchesReviewGroup(item, query.reviewGroup))
      .filter((item) => !query.source || item.source === query.source)
      .filter((item) => !query.type || item.type === query.type)
      .filter((item) => !query.status || item.status === query.status)
      .filter(
        (item) => !query.aiRiskTag || item.aiSummary?.riskTags.includes(String(query.aiRiskTag))
      )
      .filter(
        (item) =>
          !query.lowCostRiskTag ||
          (item.aiSummary?.lowCost?.riskTags as readonly string[] | undefined)?.includes(
            String(query.lowCostRiskTag)
          )
      )
      .filter(
        (item) =>
          !query.lowCostRiskLevel || item.aiSummary?.lowCost?.riskLevel === query.lowCostRiskLevel
      )
      .filter((item) => !query.reviewDecision || item.reviewDecision === query.reviewDecision)
      .filter(
        (item) =>
          !query.contentSecuritySource ||
          item.aiSummary?.contentSecurity?.source === query.contentSecuritySource
      )
      .filter(
        (item) =>
          !query.contentSecurityRiskTag ||
          (item.aiSummary?.contentSecurity?.riskTags as readonly string[] | undefined)?.includes(
            String(query.contentSecurityRiskTag)
          )
      )
      .filter(
        (item) =>
          !query.manualReviewReason ||
          item.manualReviewReason === query.manualReviewReason ||
          item.aiSummary?.manualReviewReason === query.manualReviewReason
      )
      .filter(
        (item) =>
          !query.imageAuditStatus ||
          item.imageAuditStatus === query.imageAuditStatus ||
          item.aiSummary?.imageAudits?.some(
            (summary) => summary.imageAuditStatus === query.imageAuditStatus
          )
      )
      .filter(
        (item) =>
          !query.userRiskReason ||
          (item.userRiskReasons as readonly string[] | undefined)?.includes(
            String(query.userRiskReason)
          )
      )
      .filter(
        (item) =>
          !query.reportReasonCode || item.reportReasonCode === String(query.reportReasonCode)
      )
      .filter(
        (item) =>
          !query.reportTargetType ||
          item.related?.reportTargetType === String(query.reportTargetType)
      )
      .filter(
        (item) => !query.reportPriority || item.reportPriority === String(query.reportPriority)
      )
      .sort(compareReviewQueueItems);
    const response = { items };
    assertAdminOperationsNoSensitiveFields(response);
    return response;
  }

  async getReviewDetail(itemId: string): Promise<AdminOperationsReviewDetailResponse> {
    const queue = await this.getReviewQueue({});
    let item = queue.items.find((entry) => entry.itemId === itemId);

    if (!item) {
      const dailyIssues = await this.dailyContentFeedService.listAdminIssues();
      item = dailyIssues
        .filter(
          (issue) =>
            issue.status === AdminReviewStatus.Draft || issue.status === AdminReviewStatus.Scheduled
        )
        .map(dailyIssueToQueueItem)
        .find((entry) => entry.itemId === itemId);
    }

    if (!item && itemId.startsWith(`${AdminReviewItemType.CommunityReport}:`)) {
      const reportDetail = await this.communityLiteService.getReportReviewDetail(
        itemId.slice(`${AdminReviewItemType.CommunityReport}:`.length)
      );
      const response = { item: reportDetailToReviewDetail(reportDetail) };
      assertAdminOperationsNoSensitiveFields(response);
      return response;
    }

    if (!item) {
      throw new NotFoundException({
        errorCode: "admin_operations_item_not_found",
        message: "后台待办不存在或已处理"
      });
    }

    if (item.type === AdminReviewItemType.CommunityReport) {
      const reportDetail = await this.communityLiteService.getReportReviewDetail(item.targetId);
      const detail = reportDetailToReviewDetail(reportDetail, item);
      const response = { item: detail };
      assertAdminOperationsNoSensitiveFields(response);
      return response;
    }

    const detail: AdminOperationsReviewDetail = {
      ...item,
      body: item.summary,
      context: {
        label: contextLabel(item),
        title: item.title,
        summary: item.summary,
        targetType: item.related?.reportTargetType,
        targetId: item.related?.reportTargetId
      }
    };
    const response = { item: detail };
    assertAdminOperationsNoSensitiveFields(response);
    return response;
  }
}

function totalPendingCount(counts: AdminOperationsWorkbenchResponse["counts"]): number {
  return (
    counts.pendingCommunityPosts +
    counts.pendingCommunityComments +
    counts.pendingCommunityReplies +
    counts.pendingCommunityReports +
    counts.pendingDailyContentComments +
    counts.pendingDailyContentIssues
  );
}

function hasReportReviewFilters(
  query: AdminOperationsReviewQueueQuery | Record<string, string | undefined>
): boolean {
  return Boolean(
    query.reviewGroup === "report" ||
    query.reportReasonCode ||
    query.reportTargetType ||
    query.reportPriority ||
    query.type === AdminReviewItemType.CommunityReport
  );
}

function createReportReviewFilters(
  query: AdminOperationsReviewQueueQuery | Record<string, string | undefined>
): {
  status?: string;
  reasonCode?: string;
  targetType?: string;
  priority?: string;
} {
  return {
    status:
      typeof query.status === "string" && query.status ? query.status : AdminReviewStatus.Pending,
    reasonCode:
      typeof query.reportReasonCode === "string" && query.reportReasonCode
        ? query.reportReasonCode
        : undefined,
    targetType:
      typeof query.reportTargetType === "string" && query.reportTargetType
        ? query.reportTargetType
        : undefined,
    priority:
      typeof query.reportPriority === "string" && query.reportPriority
        ? query.reportPriority
        : undefined
  };
}

function matchesReviewGroup(item: AdminOperationsReviewQueueItem, group?: string): boolean {
  if (group === "report") {
    return item.type === AdminReviewItemType.CommunityReport;
  }
  if (group === "content") {
    return item.type !== AdminReviewItemType.CommunityReport;
  }
  return true;
}

function countPendingImageCallbacks(items: readonly AdminOperationsReviewQueueItem[]): number {
  return items.filter((item) =>
    item.aiSummary?.imageAudits?.some((summary) => summary.imageAuditStatus === "pending_callback")
  ).length;
}

function countUnableToConfirm(items: readonly AdminOperationsReviewQueueItem[]): number {
  return items.filter(
    (item) =>
      item.aiSummary?.manualReviewReason === "provider_error" ||
      item.aiSummary?.manualReviewReason === "provider_unavailable" ||
      item.aiSummary?.manualReviewReason === "timeout" ||
      item.aiSummary?.manualReviewReason === "invalid_provider_response" ||
      item.aiSummary?.manualReviewReason === "openid_unavailable" ||
      item.aiSummary?.manualReviewReason === "recent_visit_required"
  ).length;
}

function compareReviewQueueItems(
  first: AdminOperationsReviewQueueItem,
  second: AdminOperationsReviewQueueItem
): number {
  const firstReportPriority = first.reportPriority === "high" ? 1 : 0;
  const secondReportPriority = second.reportPriority === "high" ? 1 : 0;
  if (firstReportPriority !== secondReportPriority) {
    return secondReportPriority - firstReportPriority;
  }

  const riskOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
  const firstRisk = riskOrder[first.aiSummary?.lowCost?.riskLevel ?? "low"] ?? 1;
  const secondRisk = riskOrder[second.aiSummary?.lowCost?.riskLevel ?? "low"] ?? 1;

  if (firstRisk !== secondRisk) {
    return secondRisk - firstRisk;
  }

  return second.createdAt.localeCompare(first.createdAt);
}

function postToQueueItem(
  post: Awaited<ReturnType<CommunityLiteService["listPendingPosts"]>>[number]
): AdminOperationsReviewQueueItem {
  return {
    itemId: `${AdminReviewItemType.CommunityPost}:${post.id}`,
    source: AdminOperationsSource.Community,
    type: AdminReviewItemType.CommunityPost,
    targetId: post.id,
    status: AdminReviewStatus.Pending,
    title: post.title,
    summary: post.body,
    author: post.author,
    createdAt: post.createdAt,
    mediaAssets: post.mediaAssets,
    ipLocation: post.ipLocation,
    identityCompliance: post.identityCompliance,
    aiSummary: createAdminOperationsAiSummary(post.moderation),
    imageAuditStatus: createAdminOperationsAiSummary(post.moderation)?.imageAudits?.[0]
      ?.imageAuditStatus,
    manualReviewReason: createAdminOperationsAiSummary(post.moderation)?.manualReviewReason,
    availableActions: [
      AdminReviewAction.Approve,
      AdminReviewAction.Reject,
      AdminReviewAction.Hide,
      AdminReviewAction.ViewDetail
    ],
    actionTarget: {
      source: AdminOperationsSource.Community,
      type: AdminReviewItemType.CommunityPost,
      targetId: post.id,
      endpoint: `/admin/community/posts/${post.id}/review`
    },
    related: { postId: post.id }
  };
}

function commentToQueueItem(
  comment: Awaited<ReturnType<CommunityLiteService["listPendingQueue"]>>["comments"][number]
): AdminOperationsReviewQueueItem {
  return {
    itemId: `${AdminReviewItemType.CommunityComment}:${comment.id}`,
    source: AdminOperationsSource.Community,
    type: AdminReviewItemType.CommunityComment,
    targetId: comment.id,
    status: comment.status,
    title: "论坛评论待复核",
    summary: comment.body,
    author: comment.author,
    createdAt: comment.createdAt,
    ipLocation: comment.ipLocation,
    aiSummary: createAdminOperationsAiSummary(comment.moderation),
    reviewDecision: comment.moderation?.commentReviewDecision?.decision,
    userRiskReasons: comment.moderation?.commentReviewDecision?.userRiskReasons,
    manualReviewReason: comment.moderation?.commentReviewDecision?.reason,
    availableActions: [
      AdminReviewAction.Approve,
      AdminReviewAction.Reject,
      AdminReviewAction.Hide,
      AdminReviewAction.ViewDetail
    ],
    actionTarget: {
      source: AdminOperationsSource.Community,
      type: AdminReviewItemType.CommunityComment,
      targetId: comment.id,
      endpoint: `/admin/community/comments/${comment.id}/review`
    },
    related: { postId: comment.postId, commentId: comment.id }
  };
}

function replyToQueueItem(
  reply: Awaited<ReturnType<CommunityLiteService["listPendingQueue"]>>["replies"][number]
): AdminOperationsReviewQueueItem {
  return {
    itemId: `${AdminReviewItemType.CommunityReply}:${reply.id}`,
    source: AdminOperationsSource.Community,
    type: AdminReviewItemType.CommunityReply,
    targetId: reply.id,
    status: reply.status,
    title: "论坛回复待复核",
    summary: reply.body,
    author: reply.author,
    createdAt: reply.createdAt,
    ipLocation: reply.ipLocation,
    aiSummary: createAdminOperationsAiSummary(reply.moderation),
    reviewDecision: reply.moderation?.commentReviewDecision?.decision,
    userRiskReasons: reply.moderation?.commentReviewDecision?.userRiskReasons,
    manualReviewReason: reply.moderation?.commentReviewDecision?.reason,
    availableActions: [
      AdminReviewAction.Approve,
      AdminReviewAction.Reject,
      AdminReviewAction.Hide,
      AdminReviewAction.ViewDetail
    ],
    actionTarget: {
      source: AdminOperationsSource.Community,
      type: AdminReviewItemType.CommunityReply,
      targetId: reply.id,
      endpoint: `/admin/community/replies/${reply.id}/review`
    },
    related: { postId: reply.postId, commentId: reply.commentId, replyId: reply.id }
  };
}

function reportToQueueItem(
  report: Awaited<ReturnType<CommunityLiteService["listPendingQueue"]>>["reports"][number]
): AdminOperationsReviewQueueItem {
  return {
    itemId: `${AdminReviewItemType.CommunityReport}:${report.id}`,
    source: AdminOperationsSource.Community,
    type: AdminReviewItemType.CommunityReport,
    targetId: report.id,
    status: report.status,
    title: "社区举报待处理",
    summary: report.targetSummary ?? report.reason,
    author: report.targetSnapshot?.author,
    createdAt: report.createdAt,
    reportReasonCode: report.reasonCode,
    reportReasonText: report.reasonText,
    reportPriority: report.priority,
    reportCount: report.reportCount,
    reportReasonDistribution: report.reasonDistribution,
    reportTargetSnapshot: report.targetSnapshot,
    availableActions: [
      AdminReviewAction.HandleReportKeep,
      AdminReviewAction.HandleReportHide,
      AdminReviewAction.HandleReportRemove,
      AdminReviewAction.HandleReportFalse,
      AdminReviewAction.ViewDetail
    ],
    actionTarget: {
      source: AdminOperationsSource.Community,
      type: AdminReviewItemType.CommunityReport,
      targetId: report.id,
      endpoint: `/admin/community/reports/${report.id}/handle`
    },
    related: {
      reportId: report.id,
      reportTargetKey: report.targetKey,
      reportPriority: report.priority,
      reportTargetType: report.targetType,
      reportTargetId: report.targetId
    }
  };
}

function reportDetailToReviewDetail(
  reportDetail: CommunityReportReviewDetail,
  item: AdminOperationsReviewQueueItem = reportToQueueItem(reportDetail)
): AdminOperationsReviewDetail {
  return {
    ...item,
    summary: reportDetail.targetSummary ?? item.summary,
    body: reportDetail.targetSnapshot?.body ?? reportDetail.reason,
    author: reportDetail.targetSnapshot?.author ?? item.author,
    reportReasonCode: reportDetail.reasonCode,
    reportReasonText: reportDetail.reasonText,
    reportPriority: reportDetail.priority,
    reportCount: reportDetail.reportCount,
    reportReasonDistribution: reportDetail.reasonDistribution,
    reportTargetSnapshot: reportDetail.targetSnapshot,
    reportCaseSummary: reportDetail.caseSummary,
    context: {
      label: contextLabel(item),
      title: reportDetail.targetSnapshot?.title ?? item.title,
      summary: reportDetail.reason,
      body: reportDetail.targetSnapshot?.body,
      targetType: reportDetail.targetType,
      targetId: reportDetail.targetId
    }
  };
}

function dailyCommentToQueueItem(
  comment: DailyContentArticleComment
): AdminOperationsReviewQueueItem {
  return {
    itemId: `${AdminReviewItemType.DailyContentComment}:${comment.id}`,
    source: AdminOperationsSource.DailyContent,
    type: AdminReviewItemType.DailyContentComment,
    targetId: comment.id,
    status: comment.status,
    title: "日报评论待复核",
    summary: comment.body,
    author: comment.author,
    createdAt: comment.createdAt,
    aiSummary: createAdminOperationsAiSummary(comment.moderation),
    availableActions: [
      AdminReviewAction.Approve,
      AdminReviewAction.Reject,
      AdminReviewAction.ViewDetail
    ],
    actionTarget: {
      source: AdminOperationsSource.DailyContent,
      type: AdminReviewItemType.DailyContentComment,
      targetId: comment.id,
      endpoint: `/admin/daily-content/comments/${comment.id}/review`
    },
    related: { articleId: comment.articleId }
  };
}

function dailyIssueToQueueItem(issue: DailyContentIssue): AdminOperationsReviewQueueItem {
  return {
    itemId: `${AdminReviewItemType.DailyContentIssue}:${issue.id}`,
    source: AdminOperationsSource.DailyContent,
    type: AdminReviewItemType.DailyContentIssue,
    targetId: issue.id,
    status: issue.status,
    title: issue.title,
    summary: issue.homeSummary,
    createdAt: issue.updatedAt,
    availableActions: [
      AdminReviewAction.PublishNow,
      AdminReviewAction.SchedulePublish,
      AdminReviewAction.Archive,
      AdminReviewAction.ViewDetail
    ],
    actionTarget: {
      source: AdminOperationsSource.DailyContent,
      type: AdminReviewItemType.DailyContentIssue,
      targetId: issue.id,
      endpoint: `/admin/daily-content/issues/${issue.id}/publish`
    },
    related: { issueId: issue.id }
  };
}

function contextLabel(item: AdminOperationsReviewQueueItem): string {
  if (item.type === AdminReviewItemType.CommunityReport) {
    return "举报详情";
  }
  if (item.source === AdminOperationsSource.DailyContent) {
    return "隐者日报";
  }
  return "阵营茶馆";
}
