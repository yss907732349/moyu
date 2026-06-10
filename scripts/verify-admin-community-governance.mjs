/* global process */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const shared = readFileSync("packages/shared/src/admin-community-governance.ts", "utf8");
const communityShared = readFileSync("packages/shared/src/community-lite.ts", "utf8");
const controller = readFileSync("apps/api/src/community-lite.controller.ts", "utf8");
const service = readFileSync("apps/api/src/community-lite.service.ts", "utf8");
const schema = readFileSync("apps/api/prisma/schema.prisma", "utf8");
const adminApp = readFileSync("apps/admin/src/App.vue", "utf8");
const operationsShared = readFileSync("packages/shared/src/admin-operations.ts", "utf8");
const realtimeClient = readFileSync("apps/admin/src/services/admin-realtime.ts", "utf8");
const appModule = readFileSync("apps/api/src/app.module.ts", "utf8");

for (const token of [
  "AdminCommunityPostSearchRequest",
  "AdminCommunityPostSearchResponse",
  "AdminCommunityPostGovernanceDetail",
  "AdminCommunityCommentGovernanceItem",
  "AdminCommunityReplyGovernanceItem",
  "AdminCommunityGovernanceAudit",
  "AdminCommunityReportSummary",
  "CommunityUserGovernanceStatus",
  "contentSecuritySource",
  "contentSecurityRiskTags",
  "contentSecurityDecision",
  "imageAuditStatus",
  "traceIdDigest",
  "ipLocation?: CommunityIpLocationAdminSummary",
  "identityCompliance?: CommunityIdentityComplianceSummary",
  "phoneVerified?: boolean",
  "privacyPolicyVersion?: string",
  "communityAgreementVersion?: string",
  "recentIpLocationLabel?: string",
  "ADMIN_COMMUNITY_GOVERNANCE_FORBIDDEN_FIELDS"
]) {
  assert.equal(shared.includes(token), true, `missing shared contract ${token}`);
}

for (const action of [
  "hide_post",
  "remove_post",
  "hide_comment",
  "remove_comment",
  "hide_reply",
  "remove_reply",
  "limit_user",
  "mute_user",
  "ban_user",
  "clear_user_restriction",
  "view_detail"
]) {
  assert.equal(shared.includes(`"${action}"`), true, `missing governance action ${action}`);
}

for (const status of ["normal", "limited", "muted", "banned"]) {
  assert.equal(shared.includes(`"${status}"`), true, `missing user governance status ${status}`);
}

assert.equal(communityShared.includes('Removed: "removed"'), true);
assert.equal(schema.includes("model CommunityUserGovernance"), true);
assert.equal(schema.includes("model CommunityGovernanceAudit"), true);
assert.equal(schema.includes("@@index([sectionKey, status, createdAt])"), true);

assert.equal(controller.includes('@Controller("admin/community-governance")'), true);
assert.equal(controller.includes('@Get("posts")'), true);
assert.equal(controller.includes('@Get("posts/:postId")'), true);
assert.equal(controller.includes('@Post("posts/:postId/actions")'), true);
assert.equal(controller.includes('@Post("comments/:commentId/actions")'), true);
assert.equal(controller.includes('@Post("replies/:replyId/actions")'), true);
assert.equal(controller.includes('@Get("users/:userId/governance")'), true);
assert.equal(controller.includes('@Post("users/:userId/governance")'), true);
assert.equal(controller.includes('@Post("users/:userId/unban")'), true);
assert.equal(controller.includes('@Headers("x-admin-token")'), true);
assert.equal(controller.includes("publishReviewStateChanged"), true);
assert.equal(controller.includes("publishWorkbenchCountsChanged"), true);
assert.equal(appModule.includes("AdminCommunityGovernanceController"), true);

for (const token of [
  "listGovernancePosts",
  "getGovernancePostDetail",
  "buildReportCaseSummaries",
  "reportToGovernanceSummary",
  "effectiveForAuthorRisk",
  "governPost",
  "governComment",
  "governReply",
  "setUserGovernance",
  "clearUserGovernance",
  "assertCommunityWriteAllowed",
  "CommunityLiteErrorCode.UserMuted",
  "CommunityLiteErrorCode.UserBanned",
  "createIdentityComplianceSummary",
  "ipLocationToAdminSummary",
  "findRecentPublicIpLocationForUser",
  "assertAdminCommunityGovernanceNoSensitiveFields"
]) {
  assert.equal(service.includes(token), true, `missing service behavior ${token}`);
}

for (const forbidden of [
  "sessionKey",
  "phoneNumber",
  "phoneTail",
  "phoneLast4",
  "mobilePhone",
  "rawIp",
  "plainIp",
  "ipAddress",
  "clientIp",
  "workProfile",
  "survivalBills",
  "openid",
  "unionid",
  "rawPrompt",
  "providerRawResponse",
  "providerApiKey"
]) {
  assert.equal(shared.includes(`"${forbidden}"`), true, `missing forbidden field ${forbidden}`);
  assert.equal(
    operationsShared.includes(`"${forbidden}"`),
    true,
    `operations blacklist missing ${forbidden}`
  );
  assert.equal(
    realtimeClient.includes(forbidden),
    false,
    `realtime prompt must not expose ${forbidden}`
  );
}

assert.equal(adminApp.includes("社区治理"), true);
assert.equal(adminApp.includes("/admin/community-governance/posts"), true);
assert.equal(adminApp.includes("selectedGovernanceDetail"), true);
assert.equal(adminApp.includes("governanceFilters"), true);
assert.equal(adminApp.includes("governanceNotice"), true);
assert.equal(adminApp.includes("governanceDetailDirty"), true);
assert.equal(adminApp.includes("governanceRiskLabel"), true);
assert.equal(adminApp.includes("内容安全摘要"), true);
assert.equal(adminApp.includes("图片审核状态"), true);
assert.equal(adminApp.includes("脱敏 trace 摘要"), true);
assert.equal(adminApp.includes("举报案件"), true);
assert.equal(adminApp.includes("reportCases"), true);
assert.equal(adminApp.includes("封禁账号"), true);
assert.equal(adminApp.includes("banReportedAuthor"), true);
assert.equal(adminApp.includes("canBanReportedAuthor"), true);
assert.equal(adminApp.includes("/ban`"), true);
assert.equal(adminApp.includes("reasonDistribution"), true);
assert.equal(adminApp.includes("formatAdminOperationError"), true);
assert.equal(adminApp.includes("runGovernanceAction"), true);
assert.equal(adminApp.includes("setAuthorGovernance"), true);
assert.equal(adminApp.includes("clearAuthorGovernance"), true);
assert.equal(adminApp.includes("remove_post"), true);
assert.equal(adminApp.includes("remove_comment"), true);
assert.equal(adminApp.includes("remove_reply"), true);
assert.equal(adminApp.includes("作者身份合规"), true);
assert.equal(adminApp.includes("手机号验证："), true);
assert.equal(adminApp.includes("隐私版本"), true);
assert.equal(adminApp.includes("社区协议"), true);
assert.equal(adminApp.includes("作者最近公开 IP 属地"), true);
assert.equal(adminApp.includes("帖子发布 IP 属地"), true);
assert.equal(adminApp.includes("帖子身份合规"), true);
assert.equal(adminApp.includes("ipLocationSummaryLabel"), true);
assert.equal(adminApp.includes("identityComplianceLabel"), true);
assert.equal(adminApp.includes("发布 IP 属地"), true);

process.stdout.write("admin community governance verification passed\n");
