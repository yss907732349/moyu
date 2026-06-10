import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { networkInterfaces } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiPort = process.env.DEV_API_PORT || "3000";
const adminPort = process.env.DEV_ADMIN_PORT || "5173";
const explicitIp = process.env.DEV_LAN_IP?.trim();

const selectedIp = explicitIp ? validateExplicitIp(explicitIp) : detectLanIp();
const apiBaseUrl = `http://${selectedIp}:${apiPort}`;

updateEnvFile(".env.local", {
  ADMIN_CORS_ORIGINS: [
    `http://localhost:${adminPort}`,
    `http://127.0.0.1:${adminPort}`,
    `http://${selectedIp}:${adminPort}`
  ].join(","),
  COMMUNITY_MEDIA_PUBLIC_BASE_URL: `${apiBaseUrl}/uploads/community`,
  VITE_API_BASE_URL: apiBaseUrl
});

updateEnvFile("apps/miniapp/.env.local", {
  VITE_API_BASE_URL: apiBaseUrl
});

updateEnvFile("apps/admin/.env.local", {
  VITE_API_BASE_URL: apiBaseUrl
});

console.log(`已同步本机物理局域网 IP：${selectedIp}`);
console.log(`API 地址：${apiBaseUrl}`);
console.log(`后台地址：http://${selectedIp}:${adminPort}`);

function validateExplicitIp(value) {
  if (!isIpv4(value)) {
    throw new Error(`DEV_LAN_IP 不是合法 IPv4 地址：${value}`);
  }

  if (!isPrivateLanIp(value)) {
    throw new Error(
      `DEV_LAN_IP 必须是物理局域网地址，当前值 ${value} 不在 10.x、172.16-31.x 或 192.168.x 段。`
    );
  }

  return value;
}

function detectLanIp() {
  const candidates = [];

  for (const [name, entries = []] of Object.entries(networkInterfaces())) {
    for (const entry of entries) {
      if (entry.family !== "IPv4" || entry.internal || !isPrivateLanIp(entry.address)) {
        continue;
      }

      candidates.push({
        address: entry.address,
        name,
        score: scoreInterface(name, entry.address)
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  if (candidates.length === 0) {
    throw new Error(
      "未找到可用的物理局域网 IPv4 地址。请连接正常网络，或临时使用 DEV_LAN_IP=10.x.x.x 指定。"
    );
  }

  return candidates[0].address;
}

function scoreInterface(name, address) {
  const lowerName = name.toLowerCase();
  let score = 0;

  if (lowerName.includes("以太网") || lowerName.includes("ethernet")) {
    score += 50;
  }

  if (lowerName.includes("wlan") || lowerName.includes("wi-fi") || lowerName.includes("wifi")) {
    score += 40;
  }

  if (
    /virtual|vmware|hyper-v|vbox|docker|wsl|meta|tunnel|tap|tailscale|zerotier|clash/.test(
      lowerName
    )
  ) {
    score -= 100;
  }

  if (address.startsWith("192.168.")) {
    score += 20;
  } else if (address.startsWith("10.")) {
    score += 15;
  } else if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(address)) {
    score += 10;
  }

  return score;
}

function isPrivateLanIp(value) {
  return (
    /^10\.(\d{1,3}\.){2}\d{1,3}$/.test(value) ||
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(value) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(value)
  );
}

function isIpv4(value) {
  const parts = value.split(".");
  return (
    parts.length === 4 &&
    parts.every((part) => /^\d+$/.test(part) && Number(part) >= 0 && Number(part) <= 255)
  );
}

function updateEnvFile(relativePath, updates) {
  const absolutePath = path.join(rootDir, relativePath);
  let content = existsSync(absolutePath) ? readFileSync(absolutePath, "utf8") : "";
  content = content.replace(/\r\n/g, "\n");

  for (const [key, value] of Object.entries(updates)) {
    const line = `${key}="${value}"`;
    const pattern = new RegExp(`^${escapeRegExp(key)}=.*$`, "m");

    if (pattern.test(content)) {
      content = content.replace(pattern, line);
    } else {
      content = `${content.replace(/\n?$/, "\n")}${line}\n`;
    }
  }

  writeFileSync(absolutePath, content.endsWith("\n") ? content : `${content}\n`, "utf8");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
