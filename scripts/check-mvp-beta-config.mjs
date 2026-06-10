/* global process */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const localMode = process.argv.includes("--local");

const expectedRootKeys = [
  "NODE_ENV",
  "API_PORT",
  "API_HOST",
  "ADMIN_CORS_ORIGINS",
  "DATABASE_URL",
  "APP_AUTH_TOKEN_SECRET",
  "APP_AUTH_TOKEN_TTL_SECONDS",
  "TEMP_CURRENT_USER_ID",
  "ALLOW_TEMP_CURRENT_USER_FALLBACK",
  "COMMUNITY_MEDIA_PUBLIC_BASE_URL",
  "WECHAT_MINIAPP_APPID",
  "WECHAT_MINIAPP_SECRET",
  "WECHAT_LOGIN_MOCK_ENABLED",
  "WECHAT_PHONE_NUMBER_MOCK_ENABLED",
  "WECHAT_PHONE_NUMBER_MOCK_PHONE",
  "WECHAT_PHONE_NUMBER_MOCK_ERROR",
  "COMMUNITY_PRIVACY_POLICY_VERSION",
  "COMMUNITY_AGREEMENT_VERSION",
  "COMMUNITY_IDENTITY_GATE_ENABLED",
  "COMMUNITY_PHONE_HASH_SALT",
  "COMMUNITY_TRUSTED_PROXY_HEADERS",
  "COMMUNITY_TRUSTED_PROXY_ADDRS",
  "TRUSTED_PROXY_IP_HEADERS",
  "TRUSTED_PROXY_REMOTE_ADDRS",
  "COMMUNITY_IP_LOCATION_MOCK_LABEL",
  "COMMUNITY_IP_LOCATION_MOCK_COUNTRY",
  "COMMUNITY_IP_LOCATION_MOCK_PROVINCE",
  "ADMIN_OPERATIONS_TOKEN",
  "DEEPSEEK_API_KEY",
  "DEEPSEEK_MODEL_NAME",
  "AI_CONTENT_MODERATION_MOCK_RESULT",
  "AI_CONTENT_MODERATION_FORCE_PROVIDER_ERROR",
  "WECHAT_CONTENT_SECURITY_ENABLED",
  "WECHAT_CONTENT_SECURITY_MOCK_ENABLED",
  "WECHAT_CONTENT_SECURITY_MOCK_TEXT_RESULT",
  "WECHAT_CONTENT_SECURITY_MOCK_IMAGE_RESULT",
  "WECHAT_CONTENT_SECURITY_FORCE_PROVIDER_ERROR",
  "WECHAT_CONTENT_SECURITY_TIMEOUT_MS",
  "WECHAT_CONTENT_SECURITY_IMAGE_CALLBACK_TOKEN",
  "WECHAT_CONTENT_SECURITY_IMAGE_CALLBACK_MAX_DELAY_SECONDS",
  "DEEPSEEK_PROXY_URL",
  "JUTUIKE_API_KEY",
  "JUTUIKE_TRANSFER_URL",
  "JUTUIKE_PROXY_URL",
  "VITE_API_BASE_URL",
  "VITE_WECHAT_LOGIN_MOCK_ENABLED",
  "HOLIDAY_SYNC_YEARS",
  "HOLIDAY_VERIFY_YEAR"
];

const expectedApiKeys = expectedRootKeys.filter(
  (key) => !key.startsWith("VITE_") && !key.startsWith("HOLIDAY_") && key !== "NODE_ENV"
);
const expectedMiniappKeys = ["VITE_API_BASE_URL", "VITE_WECHAT_LOGIN_MOCK_ENABLED"];
const expectedAdminKeys = ["VITE_API_BASE_URL"];

const sensitiveKeys = [
  "DATABASE_URL",
  "APP_AUTH_TOKEN_SECRET",
  "WECHAT_MINIAPP_APPID",
  "WECHAT_MINIAPP_SECRET",
  "COMMUNITY_PHONE_HASH_SALT",
  "WECHAT_CONTENT_SECURITY_IMAGE_CALLBACK_TOKEN",
  "ADMIN_OPERATIONS_TOKEN",
  "DEEPSEEK_API_KEY",
  "JUTUIKE_API_KEY"
];

const placeholderTokens = [
  "replace-with",
  "dev-",
  "local",
  "example",
  "password",
  "moyuxia",
  "localhost",
  "127.0.0.1"
];

const files = [
  { path: ".env.example", keys: expectedRootKeys, name: "根目录样例" },
  { path: "apps/api/.env.example", keys: expectedApiKeys, name: "API 样例" },
  { path: "apps/miniapp/.env.example", keys: expectedMiniappKeys, name: "小程序样例" },
  { path: "apps/admin/.env.example", keys: expectedAdminKeys, name: "管理后台样例" }
];

function read(path) {
  assert.equal(existsSync(path), true, `缺少配置文件：${path}`);
  return readFileSync(path, "utf8");
}

function parseEnv(source) {
  const values = new Map();
  for (const line of source.split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/u);
    if (!match) continue;
    values.set(match[1], match[2].replace(/^['"]|['"]$/gu, ""));
  }
  return values;
}

function isPlaceholder(value) {
  const normalized = value.toLowerCase();
  return placeholderTokens.some((token) => normalized.includes(token));
}

function looksLikeRealSecret(value) {
  if (!value || isPlaceholder(value)) return false;
  if (value.length >= 24 && /^[A-Za-z0-9._:/@+-]+$/u.test(value)) return true;
  return /sk-[A-Za-z0-9_-]{16,}|appid_[A-Za-z0-9_-]{12,}/u.test(value);
}

function assertExampleFile(file) {
  const source = read(file.path);
  const values = parseEnv(source);
  for (const key of file.keys) {
    assert.equal(values.has(key), true, `${file.name} 缺少 ${key}`);
  }
  for (const key of sensitiveKeys) {
    if (!values.has(key)) continue;
    const value = values.get(key) ?? "";
    assert.equal(
      looksLikeRealSecret(value),
      false,
      `${file.name} 的 ${key} 疑似真实敏感值，请改为占位值`
    );
  }
}

function assertActualEnvIfRequested(path, requiredKeys) {
  if (!localMode || !existsSync(path)) return;
  const values = parseEnv(read(path));
  for (const key of requiredKeys) {
    assert.equal(values.has(key), true, `${path} 缺少内测变量 ${key}`);
    const value = values.get(key) ?? "";
    if (sensitiveKeys.includes(key)) {
      assert.equal(isPlaceholder(value), false, `${path} 的 ${key} 仍是占位值`);
    }
  }
  assertNoUnsafeImageMockPass(path, values);
}

function assertNoUnsafeImageMockPass(path, values) {
  const imageMockResult = values.get("WECHAT_CONTENT_SECURITY_MOCK_IMAGE_RESULT");
  assert.notEqual(
    imageMockResult,
    "pass",
    `${path} 的 WECHAT_CONTENT_SECURITY_MOCK_IMAGE_RESULT 不应长期保持 pass；图片未接真实微信回调时请使用 review`
  );
}

for (const file of files) {
  assertExampleFile(file);
}

assert.equal(read(".gitignore").includes(".env"), true, ".gitignore 必须忽略真实 .env");
assert.equal(read(".gitignore").includes("!.env.example"), true, ".gitignore 必须允许样例文件");
assert.equal(read("apps/miniapp/src/services/api-config.ts").includes("VITE_API_BASE_URL"), true);
assert.equal(read("apps/admin/src/App.vue").includes("VITE_API_BASE_URL"), true);
assert.equal(read("apps/api/src/app.module.ts").includes("../../.env.local"), true);

try {
  const tracked = execFileSync("git", ["ls-files"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"]
  });
  for (const path of [
    ".env",
    ".env.local",
    "apps/api/.env",
    "apps/miniapp/.env",
    "apps/admin/.env"
  ]) {
    assert.equal(tracked.split(/\r?\n/u).includes(path), false, `${path} 不应被 git 跟踪`);
  }
} catch {
  process.stdout.write("git 不可用，已跳过真实 .env 跟踪检查\n");
}

assertActualEnvIfRequested(".env", [
  "DATABASE_URL",
  "APP_AUTH_TOKEN_SECRET",
  "ADMIN_OPERATIONS_TOKEN",
  "WECHAT_LOGIN_MOCK_ENABLED",
  "WECHAT_CONTENT_SECURITY_ENABLED",
  "WECHAT_CONTENT_SECURITY_MOCK_ENABLED",
  "WECHAT_CONTENT_SECURITY_MOCK_TEXT_RESULT",
  "WECHAT_CONTENT_SECURITY_MOCK_IMAGE_RESULT",
  "WECHAT_CONTENT_SECURITY_FORCE_PROVIDER_ERROR"
]);
assertActualEnvIfRequested(".env.local", [
  "WECHAT_LOGIN_MOCK_ENABLED",
  "WECHAT_CONTENT_SECURITY_ENABLED",
  "WECHAT_CONTENT_SECURITY_MOCK_ENABLED",
  "WECHAT_CONTENT_SECURITY_MOCK_TEXT_RESULT",
  "WECHAT_CONTENT_SECURITY_MOCK_IMAGE_RESULT",
  "WECHAT_CONTENT_SECURITY_FORCE_PROVIDER_ERROR"
]);
assertActualEnvIfRequested("apps/api/.env", ["DATABASE_URL", "APP_AUTH_TOKEN_SECRET"]);
assertActualEnvIfRequested("apps/miniapp/.env", expectedMiniappKeys);
assertActualEnvIfRequested("apps/admin/.env", expectedAdminKeys);

process.stdout.write(
  localMode
    ? "mvp beta local config verification passed\n"
    : "mvp beta config example verification passed\n"
);
