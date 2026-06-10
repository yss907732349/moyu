/* global process */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const adminApp = readFileSync("apps/admin/src/App.vue", "utf8");
const adminClient = readFileSync("apps/admin/src/services/admin-client.ts", "utf8");
const adminService = readFileSync("apps/api/src/admin-operations.service.ts", "utf8");
const communityService = readFileSync("apps/api/src/community-lite.service.ts", "utf8");

assert.equal(adminApp.includes("/admin/operations/review-queue"), true);
assert.equal(adminApp.includes("/admin/community/posts/"), true);
assert.equal(adminApp.includes("/admin/community/comments/"), true);
assert.equal(adminApp.includes("/admin/community/replies/"), true);
assert.equal(adminApp.includes("/admin/community/reports/"), true);
assert.equal(adminClient.includes('"x-admin-token"'), true);
assert.equal(adminApp.includes("runReviewAction"), true);
assert.equal(adminApp.includes("review-media-grid"), true);
assert.equal(adminApp.includes("selectedReviewItem.mediaAssets"), true);
assert.equal(adminApp.includes("publicAssetUrl"), true);
assert.equal(adminApp.includes("隐藏内容"), true);
assert.equal(adminApp.includes("标记误报"), true);
assert.equal(adminApp.includes("handle_report_keep"), true);
assert.equal(adminApp.includes("handle_report_remove"), true);
assert.equal(adminApp.includes("resolveReviewActionNote"), true);
assert.equal(adminService.includes("mediaAssets: post.mediaAssets"), true);
assert.equal(adminService.includes("reportDetailToReviewDetail"), true);
assert.equal(communityService.includes("includeBound"), true);
assert.equal(communityService.includes("CommunityMediaAssetStatus.Bound"), true);
assert.equal(communityService.includes("createReportHandledNotification"), true);
assert.equal(communityService.includes("createReportedContentNotification"), true);

process.stdout.write("admin community-lite verification passed\n");
