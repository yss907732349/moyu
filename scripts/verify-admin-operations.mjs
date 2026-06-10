/* global process */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const adminApp = readFileSync("apps/admin/src/App.vue", "utf8");
const appModule = readFileSync("apps/api/src/app.module.ts", "utf8");
const controller = readFileSync("apps/api/src/admin-operations.controller.ts", "utf8");
const service = readFileSync("apps/api/src/admin-operations.service.ts", "utf8");
const shared = readFileSync("packages/shared/src/admin-operations.ts", "utf8");
const adminClient = readFileSync("apps/admin/src/services/admin-client.ts", "utf8");
const adminRealtime = readFileSync("apps/admin/src/services/admin-realtime.ts", "utf8");
const dailyController = readFileSync("apps/api/src/daily-content-feed.controller.ts", "utf8");
const communityController = readFileSync("apps/api/src/community-lite.controller.ts", "utf8");
const communityService = readFileSync("apps/api/src/community-lite.service.ts", "utf8");

assert.equal(adminApp.includes("后台运营中心"), true);
assert.equal(adminApp.includes("/admin/operations/workbench"), true);
assert.equal(adminApp.includes("/admin/operations/review-queue"), true);
assert.equal(adminApp.includes("CPS 异常池"), true);
assert.equal(adminApp.includes("CPS 指标面板"), true);
assert.equal(adminApp.includes("/admin/supply-center/metrics"), true);
assert.equal(adminApp.includes("/admin/supply-center/exceptions"), true);
assert.equal(adminApp.includes("内容审核队列"), true);
assert.equal(adminApp.includes("举报审核队列"), true);
assert.equal(adminApp.includes("review-group-tabs"), true);
assert.equal(adminApp.includes("setReviewQueueGroup"), true);
assert.equal(adminApp.includes("reviewFilters.reviewGroup"), true);
assert.equal(adminApp.includes("isReportReviewMode"), true);
assert.equal(adminApp.includes("isContentReviewMode"), true);
assert.equal(adminApp.includes("社区治理"), true);
assert.equal(adminApp.includes("/admin/community-governance/posts"), true);
assert.equal(adminApp.includes("availableActions"), true);
assert.equal(adminApp.includes("review-media-grid"), true);
assert.equal(adminApp.includes("selectedReviewItem.mediaAssets"), true);
assert.equal(adminApp.includes("publicAssetUrl"), true);
assert.equal(adminApp.includes("contentSecuritySummaryLabel"), true);
assert.equal(adminApp.includes("contentSecuritySourceLabel"), true);
assert.equal(adminApp.includes("imageAuditSummaryLabel"), true);
assert.equal(adminApp.includes("reviewFilters.contentSecuritySource"), true);
assert.equal(adminApp.includes("reviewFilters.contentSecurityRiskTag"), true);
assert.equal(adminApp.includes("reviewFilters.manualReviewReason"), true);
assert.equal(adminApp.includes("reviewFilters.imageAuditStatus"), true);
assert.equal(adminApp.includes("reviewFilters.reportReasonCode"), true);
assert.equal(adminApp.includes("reviewFilters.reportTargetType"), true);
assert.equal(adminApp.includes("reviewFilters.reportPriority"), true);
assert.equal(adminApp.includes("封禁账号"), true);
assert.equal(adminApp.includes("banReportedAuthor"), true);
assert.equal(adminApp.includes("canBanReportedAuthor"), true);
assert.equal(adminApp.includes("/admin/community-governance/users/"), true);
assert.equal(adminApp.includes("COMMUNITY_REPORT_REASON_CODES"), true);
assert.equal(adminApp.includes("CommunityReportTargetType"), true);
assert.equal(adminApp.includes("CommunityReportPriority"), true);
assert.equal(adminApp.includes("resolveReviewActionNote"), true);
assert.equal(adminApp.includes("内容安全自动通过"), true);
assert.equal(adminApp.includes("微信图片待回调"), true);
assert.equal(adminApp.includes("设置定时"), true);
assert.equal(adminApp.includes("取消定时"), true);
assert.equal(adminApp.includes("sourceType"), true);
assert.equal(adminClient.includes('"x-admin-token"'), true);

assert.equal(appModule.includes("AdminOperationsController"), true);
assert.equal(appModule.includes("AdminOperationsService"), true);
assert.equal(controller.includes('@Controller("admin/operations")'), true);
assert.equal(controller.includes('@Get("workbench")'), true);
assert.equal(controller.includes('@Get("review-queue")'), true);
assert.equal(controller.includes('@Get("review-queue/:itemId")'), true);
assert.equal(controller.includes("@Query() query"), true);
assert.equal(controller.includes('@Get("events")'), true);
assert.equal(controller.includes('@Get("todo-summary")'), true);
assert.equal(controller.includes('@Headers("x-admin-token")'), true);
assert.equal(controller.includes("text/event-stream"), true);
assert.equal(controller.includes("subscribeRealtimeEvents"), true);

assert.equal(service.includes("listPendingQueue"), true);
assert.equal(service.includes("listPendingArticleComments"), true);
assert.equal(service.includes("publishReviewCreated"), true);
assert.equal(service.includes("publishReviewStateChanged"), true);
assert.equal(service.includes("publishWorkbenchCountsChanged"), true);
assert.equal(service.includes("listReportsForReview"), true);
assert.equal(service.includes("getReportReviewDetail"), true);
assert.equal(service.includes("createReportReviewFilters"), true);
assert.equal(service.includes("reportReasonCode"), true);
assert.equal(service.includes("reportTargetType"), true);
assert.equal(service.includes("reportPriority"), true);
assert.equal(service.includes("reportDetailToReviewDetail"), true);
assert.equal(service.includes("matchesReviewGroup"), true);
assert.equal(shared.includes('reviewGroup?: "content" | "report" | "all"'), true);
assert.equal(service.includes("createSnapshotEvent"), true);
assert.equal(service.includes("createAdminOperationsAiSummary"), true);
assert.equal(service.includes("contentSecuritySource"), true);
assert.equal(service.includes("contentSecurityRiskTag"), true);
assert.equal(service.includes("imageAuditStatus"), true);
assert.equal(service.includes("wechatImagePendingCallbacks"), true);
assert.equal(service.includes("wechatUnableToConfirm"), true);
assert.equal(service.includes("mediaAssets: post.mediaAssets"), true);
assert.equal(communityService.includes("includeBound"), true);
assert.equal(communityService.includes("CommunityMediaAssetStatus.Bound"), true);
assert.equal(shared.includes("mediaAssets?: CommunityPublicMediaAsset[]"), true);
assert.equal(service.includes("assertAdminOperationsNoSensitiveFields"), true);
assert.equal(service.includes("communityGovernanceEntry"), true);
assert.equal(shared.includes("ADMIN_OPERATIONS_SENSITIVE_FIELD_BLACKLIST"), true);
assert.equal(shared.includes("AdminOperationsRealtimeEvent"), true);
assert.equal(shared.includes("AdminReviewQueueItemProcessingState"), true);
assert.equal(shared.includes("AdminOperationsConnectionStatus"), true);
assert.equal(shared.includes("AdminModuleLoadState"), true);
assert.equal(shared.includes("AdminOperationFeedbackStatus"), true);
assert.equal(shared.includes("AdminOperationErrorReason"), true);
assert.equal(shared.includes("ipLocation?: CommunityIpLocationAdminSummary"), true);
assert.equal(shared.includes("identityCompliance?: CommunityIdentityComplianceSummary"), true);
assert.equal(service.includes("ipLocation: post.ipLocation"), true);
assert.equal(service.includes("identityCompliance: post.identityCompliance"), true);
assert.equal(service.includes("ipLocation: comment.ipLocation"), true);
assert.equal(service.includes("ipLocation: reply.ipLocation"), true);
assert.equal(adminApp.includes("发布 IP 属地"), true);
assert.equal(adminApp.includes("身份合规"), true);
assert.equal(adminApp.includes("ipLocationSummaryLabel"), true);
assert.equal(adminApp.includes("identityComplianceLabel"), true);

assert.equal(adminClient.includes("createAdminRequestClient"), true);
assert.equal(adminClient.includes('"x-admin-token"'), true);
assert.equal(adminClient.includes("normalizeAdminErrorReason"), true);
assert.equal(adminClient.includes("formatAdminOperationError"), true);
assert.equal(adminRealtime.includes("fetch"), true);
assert.equal(adminRealtime.includes("/admin/operations/events"), true);
assert.equal(adminRealtime.includes("/admin/operations/todo-summary"), true);
assert.equal(adminRealtime.includes("ReadableStream"), true);
assert.equal(adminRealtime.includes("DegradedPolling"), true);
assert.equal(adminRealtime.includes("AbortController"), true);
assert.equal(adminApp.includes("connectAdminOperationsRealtime"), true);
assert.equal(adminApp.includes("newTodoCount"), true);
assert.equal(adminApp.includes("consumeRealtimeTodos"), true);
assert.equal(adminApp.includes("hasDirtyAdminInput"), true);
assert.equal(adminApp.includes("queueProcessingState"), true);
assert.equal(adminApp.includes("AdminReviewQueueItemProcessingState.Processing"), true);
assert.equal(adminApp.includes("AdminReviewQueueItemProcessingState.Stale"), true);
assert.equal(adminApp.includes("formatAdminOperationError"), true);

for (const field of [
  "salary",
  "workProfile",
  "survivalBills",
  "cpsPlatform",
  "openid",
  "unionid",
  "sessionKey",
  "loginToken",
  "rawPrompt",
  "providerRawResponse",
  "access_token",
  "secret",
  "traceId",
  "providerFullResponse",
  "providerApiKey",
  "apiKey",
  "phoneNumber",
  "phoneTail",
  "phoneLast4",
  "mobilePhone",
  "rawIp",
  "plainIp",
  "ipAddress",
  "clientIp",
  "sid",
  "sidDigest",
  "commission",
  "rebate"
]) {
  assert.equal(shared.includes(`"${field}"`), true, `missing blacklist field ${field}`);
  assert.equal(controller.includes(field), false, `event controller must not expose ${field}`);
  assert.equal(adminRealtime.includes(field), false, `realtime client must not expose ${field}`);
}

assert.equal(dailyController.includes("cancel-schedule"), true);
assert.equal(dailyController.includes("scheduled/process-due"), true);
assert.equal(communityController.includes("media-assets/cleanup"), true);
assert.equal(communityService.includes("cleanupOrphanMediaAssets"), true);
assert.equal(communityService.includes("COMMUNITY_MEDIA_DAILY_UPLOAD_LIMIT"), true);
assert.equal(communityService.includes("COMMUNITY_MEDIA_MAX_FILE_BYTES"), true);

process.stdout.write("admin operations verification passed\n");
