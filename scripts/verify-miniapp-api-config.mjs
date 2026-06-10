/* global process */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const serviceDir = "apps/miniapp/src/services";
const serviceFiles = collectFiles(serviceDir).filter((file) => file.endsWith(".ts"));
const pageFiles = collectFiles("apps/miniapp/src/pages").filter((file) => file.endsWith(".vue"));
const apiConfigSource = readFileSync("apps/miniapp/src/services/api-config.ts", "utf8");

assert.equal(
  apiConfigSource.includes('MINIAPP_DEFAULT_API_BASE_URL = "http://127.0.0.1:3000"'),
  true
);
assert.equal(apiConfigSource.includes("VITE_API_BASE_URL"), true);
assert.equal(apiConfigSource.includes("isLocalOrPrivateApiBaseUrl"), true);

for (const file of serviceFiles) {
  const source = readFileSync(file, "utf8");
  if (file.endsWith("api-config.ts")) {
    continue;
  }

  assert.equal(
    source.includes("DEFAULT_API_BASE_URL"),
    false,
    `${file} must not define its own DEFAULT_API_BASE_URL`
  );

  if (source.includes("request({") || source.includes("url: `${apiBaseUrl}")) {
    assert.equal(
      source.includes("getMiniappApiBaseUrl"),
      true,
      `${file} must use shared miniapp API config`
    );
  }
}

for (const file of [...serviceFiles, ...pageFiles]) {
  const source = readFileSync(file, "utf8");
  if (file.endsWith("api-config.ts")) {
    continue;
  }

  assert.equal(source.includes("http://10.0.0.11:3000"), false, `${file} has stale LAN API URL`);
  assert.equal(
    source.includes('|| "http://127.0.0.1:3000"'),
    false,
    `${file} has inline API fallback`
  );
}

function collectFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? collectFiles(path) : [path];
  });
}

process.stdout.write("miniapp API config verification passed\n");
