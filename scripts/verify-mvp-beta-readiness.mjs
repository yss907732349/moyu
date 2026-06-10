/* global process */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const skipCommands = process.argv.includes("--skip-commands");

const verifyCommands = [
  {
    name: "配置样例",
    script: "verify:mvp-beta-config",
    reason: "API 地址、后台 token、微信、CPS、AI、数据库和代理变量缺失或仍为占位值"
  },
  {
    name: "小程序 API 配置",
    script: "verify:miniapp-api-config",
    reason: "小程序可能绕过统一 API base URL"
  },
  {
    name: "首跑工作档案",
    script: "verify:miniapp-work-profile",
    reason: "工作档案、本地快照或首页计算链路异常"
  },
  {
    name: "首跑用户资料",
    script: "verify:miniapp-user-growth-profile",
    reason: "登录、建档、资料快照或签到链路异常"
  },
  {
    name: "内容 API",
    script: "verify:daily-content-feed-api",
    reason: "后台发布、日报评论或公开读取契约异常"
  },
  {
    name: "内容安全审核",
    script: "verify:ai-content-moderation",
    reason: "微信内容安全 mock、供应商降级或敏感字段边界异常"
  },
  {
    name: "小程序内容",
    script: "verify:miniapp-daily-content-feed",
    reason: "日报列表、详情、评论或引用发帖入口异常"
  },
  {
    name: "社区 API",
    script: "verify:community-lite-api",
    reason: "发帖、评论、审核队列或身份边界异常"
  },
  {
    name: "补给铺共享契约",
    script: "verify:supply-center",
    reason: "补给白名单、sid、订单状态或生存分类异常"
  },
  {
    name: "补给铺 API",
    script: "verify:supply-center-api",
    reason: "补给点击、转链、订单同步或账本入账链路异常"
  },
  {
    name: "小程序补给铺",
    script: "verify:miniapp-supply-center",
    reason: "小程序补给铺页面、跳转配置或普通用户字段边界异常"
  },
  {
    name: "生存账本 API",
    script: "verify:accounting-ledger-api",
    reason: "有效订单、退款无效订单或今日/本周统计异常"
  },
  {
    name: "后台补给铺",
    script: "verify:admin-supply-center",
    reason: "后台补给配置或排查字段边界异常"
  },
  {
    name: "后台运营中心",
    script: "verify:admin-operations",
    reason: "后台 token、实时待办、降级轮询或局部处理反馈异常"
  },
  {
    name: "后台社区治理",
    script: "verify:admin-community-governance",
    reason: "社区治理详情、操作反馈或敏感字段边界异常"
  }
];

const forbiddenOutputPatterns = [
  /ADMIN_OPERATIONS_TOKEN\s*=\s*["']?[^"'\s]+/u,
  /WECHAT_MINIAPP_SECRET\s*=\s*["']?[^"'\s]+/u,
  /JUTUIKE_API_KEY\s*=\s*["']?[^"'\s]+/u,
  /apikey=([A-Za-z0-9_-]{8,})/u,
  /sid_[A-Za-z0-9_-]{16,}/u,
  /rawPrompt/u,
  /providerRawResponse/u,
  /access_token=[A-Za-z0-9._-]+/u,
  /sessionKey["'=:\s]+[A-Za-z0-9+/=_-]{8,}/u
];

function read(path) {
  assert.equal(existsSync(path), true, `缺少文件：${path}`);
  return readFileSync(path, "utf8");
}

function assertIncludes(source, text, message) {
  assert.equal(source.includes(text), true, message ?? `缺少源码标识：${text}`);
}

function assertNotIncludes(source, text, message) {
  assert.equal(source.includes(text), false, message ?? `不应包含源码标识：${text}`);
}

function sanitize(text) {
  return text
    .replace(
      /(ADMIN_OPERATIONS_TOKEN|WECHAT_MINIAPP_SECRET|JUTUIKE_API_KEY)=\S+/gu,
      "$1=<redacted>"
    )
    .replace(/sid_[A-Za-z0-9_-]{16,}/gu, "sid_<redacted>")
    .replace(/apikey=[A-Za-z0-9_-]+/gu, "apikey=<redacted>");
}

function assertNoSensitiveOutput(text, label) {
  for (const pattern of forbiddenOutputPatterns) {
    assert.equal(pattern.test(text), false, `${label} 输出包含敏感字段，请脱敏后重试`);
  }
}

function runVerify(command) {
  const result = spawnSync(`corepack pnpm ${command.script}`, {
    shell: true,
    encoding: "utf8",
    stdio: "pipe"
  });
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  const clean = sanitize(output);
  assertNoSensitiveOutput(clean, command.name);
  if (result.status !== 0) {
    process.stderr.write(`\n[失败链路] ${command.name}\n`);
    process.stderr.write(`[对应命令] pnpm ${command.script}\n`);
    process.stderr.write(`[可能原因] ${command.reason}\n`);
    process.stderr.write(clean.slice(-4000));
    process.exit(result.status ?? 1);
  }
  process.stdout.write(`✓ ${command.name} (${command.script})\n`);
}

function verifyCrossLinks() {
  const runbook = read("docs/mvp-beta-readiness.md");
  const checklist = read("docs/mvp-beta-manual-checklist.md");
  const privacyPolicy = read("docs/privacy-policy.md");
  const communityAgreement = read("docs/community-user-agreement.md");
  const homePage = read("apps/miniapp/src/pages/home/index.vue");
  const firstRunService = read("apps/miniapp/src/services/first-run-flow.ts");
  const dailyDetail = read("apps/miniapp/src/pages/daily-content/detail.vue");
  const worldIntelDetail = read("apps/miniapp/src/pages/world-intel/detail.vue");
  const communityDetail = read("apps/miniapp/src/pages/community/detail.vue");
  const communityProfile = read("apps/miniapp/src/pages/community/profile.vue");
  const communityFollowList = read("apps/miniapp/src/pages/community/follow-list.vue");
  const profilePage = read("apps/miniapp/src/pages/profile/index.vue");
  const dailyHome = read("apps/miniapp/src/pages/daily-content/index.vue");
  const communityPost = read("apps/miniapp/src/pages/community/post.vue");
  const communityService = read("apps/miniapp/src/services/community-lite.ts");
  const communityShared = read("packages/shared/src/community-lite.ts");
  const communityApiService = read("apps/api/src/community-lite.service.ts");
  const supplyService = read("apps/miniapp/src/services/supply-center.ts");
  const supplyApiService = read("apps/api/src/supply-center.service.ts");
  const accountingApi = read("apps/api/src/accounting-ledger.service.ts");
  const adminApp = read("apps/admin/src/App.vue");
  const adminShared = read("packages/shared/src/admin-operations.ts");
  const betaConfigCheck = read("scripts/check-mvp-beta-config.mjs");
  const pagesJson = read("apps/miniapp/src/pages.json");

  for (const id of [
    "mvp_beta_user_001",
    "mvp_beta_daily_issue_001",
    "mvp_beta_community_post_001",
    "mvp_beta_supply_item_001",
    "mvp_beta_order_effective_001",
    "mvp_beta_order_refunded_001",
    "mvp_beta_order_unmatched_001",
    "mvp_beta_review_queue_001"
  ]) {
    assertIncludes(runbook, id, `内测数据说明缺少稳定标识 ${id}`);
  }

  assertIncludes(
    firstRunService,
    'state: workProfileConfigured ? "ready" : "work_profile_missing"'
  );
  assertIncludes(homePage, "calculateWorkValueState");
  assertIncludes(homePage, "同步失败，已使用本地快照");
  assertNotIncludes(homePage, "静态演示身份");
  assertNotIncludes(homePage, "演示金额");

  assertIncludes(dailyHome, "/pages/community/post?dailyQuote=");
  assertIncludes(dailyHome, "今日参悟暂不可引用");
  assertIncludes(dailyDetail, "createDailyContentArticleComment");
  assertIncludes(dailyDetail, "审核通过后会显示");
  assertIncludes(dailyDetail, "仅自己可见");
  assertIncludes(dailyDetail, "审核中，通过后其他隐者可见");
  assertIncludes(worldIntelDetail, "仅自己可见");
  assertIncludes(communityDetail, "仅自己可见");
  assertIncludes(communityPost, "dailyContentQuote");
  assertIncludes(communityPost, "低风险内容会自动公开");
  assertIncludes(communityPost, "/pages/community/detail?postId=");
  assertIncludes(communityPost, 'open-type="getPhoneNumber"');
  assertIncludes(communityPost, "@getphonenumber");
  assertIncludes(communityPost, "隐私政策");
  assertIncludes(communityPost, "社区用户协议");
  assertIncludes(communityPost, "小程序用户隐私保护指引");
  assertIncludes(communityDetail, 'open-type="getPhoneNumber"');
  assertIncludes(communityDetail, "@getphonenumber");
  assertIncludes(communityDetail, "IP属地");
  assertIncludes(communityDetail, "canOpenAuthorProfile");
  assertIncludes(communityDetail, "author-profile-entry-active");
  assertIncludes(communityDetail, "隐私政策");
  assertIncludes(communityDetail, "社区用户协议");
  assertIncludes(communityDetail, "小程序用户隐私保护指引");
  assertIncludes(communityService, "/community/me/publish-eligibility");
  assertIncludes(communityService, "/community/me/privacy-consent");
  assertIncludes(communityService, "/community/me/phone-verification");
  assertIncludes(communityService, "/community/users/");
  assertIncludes(communityService, "hasPublicSensitiveFields");
  assertIncludes(communityService, "COMMUNITY_PUBLIC_RESPONSE_SENSITIVE_FIELD_BLACKLIST");
  assertIncludes(communityShared, "recentIpLocationLabel");
  assertIncludes(communityShared, "ipSourceHeader");
  assertIncludes(communityShared, "providerRawResponse");
  assertIncludes(communityProfile, "隐者名片");
  assertIncludes(communityProfile, "confirmUnfollow");
  assertIncludes(communityProfile, "profile-skeleton");
  assertIncludes(communityProfile, "end-hint");
  assertIncludes(communityFollowList, "list-skeleton");
  assertIncludes(communityFollowList, "emptyDesc");
  assertIncludes(communityFollowList, "confirmUnfollow");
  assertIncludes(communityFollowList, "没有更多");
  assertIncludes(profilePage, "compactMetricCount");
  assertIncludes(profilePage, "resource-enter");
  assertIncludes(communityApiService, "assertCommunityPublishAllowed");
  assertIncludes(communityApiService, "PrivacyConsentRequired");
  assertIncludes(communityApiService, "PhoneVerificationRequired");
  assertIncludes(communityApiService, "resolvePublishIpLocation");

  assertIncludes(supplyApiService, "assertSupplySidSafe");
  assertIncludes(supplyApiService, "SupplyAttributionFailureReason.SidMissing");
  assertIncludes(supplyApiService, "SupplyAttributionFailureReason.SidNotFound");
  assertIncludes(supplyApiService, "SupplyLedgerSyncStatus.Excluded");
  assertIncludes(supplyApiService, "SupplyLedgerSyncStatus.Imported");
  assertIncludes(accountingApi, "countsTowardConsumption");
  assertIncludes(accountingApi, "request.sourceStatus === CpsOrderStatus.Effective");
  assertIncludes(supplyService, "createSupplyClick");
  assertIncludes(supplyService, '!("jutuikeActId" in value)');
  assertIncludes(supplyService, '!("commissionRate" in value)');
  assertIncludes(supplyService, '!("sid" in value)');
  assertIncludes(supplyService, '!("internalNote" in value)');
  for (const forbidden of ["JUTUIKE_API_KEY", "sourceOrderId"]) {
    assertNotIncludes(supplyService, forbidden, `小程序补给铺服务不得暴露 ${forbidden}`);
  }

  assertIncludes(adminApp, "hasDirtyAdminInput");
  assertIncludes(adminApp, "DegradedPolling");
  assertIncludes(adminApp, "queueProcessingState");
  assertIncludes(adminApp, "contentSecuritySourceLabel");
  assertIncludes(adminApp, "reviewFilters.contentSecuritySource");
  assertIncludes(adminApp, "imageAuditSummaryLabel");
  assertIncludes(adminApp, "AdminModuleLoadState.Empty");
  assertIncludes(adminApp, "AdminModuleLoadState.NoResults");
  assertIncludes(adminApp, "AdminModuleLoadState.Error");
  assertIncludes(adminApp, "ipLocationSummaryLabel");
  assertIncludes(adminApp, "identityComplianceLabel");
  assertIncludes(adminApp, "作者身份合规");
  assertIncludes(adminApp, "发布 IP 属地");
  for (const field of [
    "salary",
    "workProfile",
    "openid",
    "unionid",
    "sessionKey",
    "loginToken",
    "phoneNumber",
    "phoneTail",
    "phoneLast4",
    "mobilePhone",
    "rawIp",
    "plainIp",
    "ipAddress",
    "clientIp",
    "rawPrompt",
    "providerRawResponse",
    "apiKey",
    "access_token",
    "traceId",
    "providerFullResponse"
  ]) {
    assertIncludes(adminShared, `"${field}"`, `后台实时 payload 黑名单缺少 ${field}`);
  }

  assertIncludes(pagesJson, '"text": "首页"');
  assertIncludes(pagesJson, '"text": "社区"');
  assertIncludes(pagesJson, '"text": "我的"');
  assertNotIncludes(pagesJson, '"text": "漫画"', "漫画不应作为小程序主 tab");

  assertIncludes(checklist, "微信开发者工具首跑");
  assertIncludes(checklist, "真机 API 地址");
  assertIncludes(checklist, "后台实时待办");
  assertIncludes(checklist, "真实补给转链");
  assertIncludes(checklist, "真实订单回流");
  assertIncludes(checklist, "真实 AI 审核");
  assertIncludes(checklist, "微信内容安全");
  assertIncludes(checklist, "图片异步回调");
  assertIncludes(checklist, "仅自己可见");
  assertIncludes(checklist, "社区隐私同意门槛");
  assertIncludes(checklist, "社区手机号验证");
  assertIncludes(checklist, "社区 IP 属地展示");
  assertIncludes(checklist, "手机号状态非公开");
  assertIncludes(checklist, "取消关注前有确认");
  assertIncludes(checklist, "加载、真实空、失败重试、分页和没有更多状态清晰");
  assertIncludes(checklist, "IP header");
  assertIncludes(checklist, "社区身份摘要");
  assertIncludes(checklist, "完整手机号");
  assertIncludes(checklist, "明文 IP");
  assertIncludes(runbook, "WECHAT_CONTENT_SECURITY_ENABLED");
  assertIncludes(runbook, "WECHAT_CONTENT_SECURITY_IMAGE_CALLBACK_TOKEN");
  assertIncludes(runbook, "WECHAT_CONTENT_SECURITY_MOCK_TEXT_RESULT");
  for (const envName of [
    "WECHAT_PHONE_NUMBER_MOCK_ENABLED",
    "COMMUNITY_IDENTITY_GATE_ENABLED",
    "COMMUNITY_PRIVACY_POLICY_VERSION",
    "COMMUNITY_AGREEMENT_VERSION",
    "COMMUNITY_TRUSTED_PROXY_HEADERS",
    "COMMUNITY_IP_LOCATION_MOCK_LABEL"
  ]) {
    assertIncludes(runbook, envName, `内测说明缺少配置项 ${envName}`);
    assertIncludes(betaConfigCheck, envName, `配置检查缺少配置项 ${envName}`);
  }
  for (const keyword of [
    "手机号验证",
    "IP 属地",
    "内容安全",
    "举报治理",
    "后台",
    "保存",
    "完整手机号",
    "手机号尾号",
    "明文 IP"
  ]) {
    assertIncludes(privacyPolicy, keyword, `隐私政策缺少 ${keyword}`);
  }
  for (const keyword of [
    "发帖",
    "评论",
    "回复",
    "审核",
    "隐藏",
    "移除",
    "禁言",
    "封禁",
    "举报",
    "申诉",
    "IP 属地"
  ]) {
    assertIncludes(communityAgreement, keyword, `社区用户协议缺少 ${keyword}`);
  }
  assertIncludes(checklist, "不属于默认确定性总 smoke 的通过前提");
}

try {
  verifyCrossLinks();
  process.stdout.write("✓ 横向闭环与敏感字段断言\n");
  if (!skipCommands) {
    for (const command of verifyCommands) {
      runVerify(command);
    }
  }
  process.stdout.write("mvp beta readiness smoke passed\n");
} catch (error) {
  process.stderr.write(`\n[失败链路] 横向闭环断言\n`);
  process.stderr.write(`[对应命令] pnpm verify:mvp-beta-readiness\n`);
  process.stderr.write(
    `[可能原因] 首跑、内容、CPS、后台、配置或数据状态源码契约未满足；请先运行相关纵向 verify 命令定位。\n`
  );
  process.stderr.write(error instanceof Error ? `${error.message}\n` : `${String(error)}\n`);
  process.exit(1);
}
