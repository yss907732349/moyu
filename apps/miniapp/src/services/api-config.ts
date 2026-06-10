export const MINIAPP_DEFAULT_API_BASE_URL = "http://127.0.0.1:3000";
export const MINIAPP_API_TIMEOUT_MS = 3000;

export function getMiniappApiBaseUrl(): string {
  const configured = import.meta.env?.VITE_API_BASE_URL?.trim();
  return configured || MINIAPP_DEFAULT_API_BASE_URL;
}

export function isLocalOrPrivateApiBaseUrl(apiBaseUrl = getMiniappApiBaseUrl()): boolean {
  return (
    apiBaseUrl.includes("localhost") ||
    apiBaseUrl.includes("127.0.0.1") ||
    isPrivateNetworkUrl(apiBaseUrl)
  );
}

function isPrivateNetworkUrl(value: string): boolean {
  try {
    const hostname = new URL(value).hostname;
    return (
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
    );
  } catch {
    return false;
  }
}
