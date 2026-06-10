import { getMiniappApiBaseUrl, MINIAPP_API_TIMEOUT_MS } from "./api-config.ts";

const apiBaseUrl = getMiniappApiBaseUrl();
const cachedImages = new Map<string, Promise<string>>();

export function cacheApiImageForDisplay(url: string): Promise<string> {
  const trimmed = url.trim();
  if (!shouldCacheApiImage(trimmed)) {
    return Promise.resolve(trimmed);
  }

  const existing = cachedImages.get(trimmed);
  if (existing) {
    return existing;
  }

  const pending = writeApiImageToLocalFile(trimmed).catch(() => trimmed);
  cachedImages.set(trimmed, pending);
  return pending;
}

function shouldCacheApiImage(url: string): boolean {
  return (
    /^https?:/.test(url) &&
    url.startsWith(apiBaseUrl) &&
    (url.includes("/community/media-assets/files/") || url.includes("/daily-content/assets/"))
  );
}

function writeApiImageToLocalFile(url: string): Promise<string> {
  const fileSystem = uni.getFileSystemManager?.();
  const userDataPath = getUserDataPath();
  if (!fileSystem || !userDataPath) {
    return Promise.resolve(url);
  }

  const filePath = `${userDataPath}/${buildCacheFileName(url)}`;

  return new Promise((resolve) => {
    fileSystem.access({
      path: filePath,
      success: () => resolve(filePath),
      fail: () => {
        uni.request({
          url,
          method: "GET",
          responseType: "arraybuffer",
          timeout: MINIAPP_API_TIMEOUT_MS,
          success: (res) => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
              resolve(url);
              return;
            }

            const data = res.data;
            if (!(data instanceof ArrayBuffer)) {
              resolve(url);
              return;
            }

            fileSystem.writeFile({
              filePath,
              data,
              success: () => resolve(filePath),
              fail: () => resolve(url)
            });
          },
          fail: () => resolve(url)
        });
      }
    });
  });
}

function getUserDataPath(): string | undefined {
  const uniEnv = (uni as unknown as { env?: { USER_DATA_PATH?: string } }).env;
  const wxEnv = (globalThis as unknown as { wx?: { env?: { USER_DATA_PATH?: string } } }).wx?.env;
  return uniEnv?.USER_DATA_PATH ?? wxEnv?.USER_DATA_PATH;
}

function buildCacheFileName(url: string): string {
  return `moyuxia-image-${hashString(url)}${getImageExtension(url)}`;
}

function getImageExtension(url: string): string {
  const match = /\.(png|jpe?g|webp|gif)(?:[?#]|$)/i.exec(url);
  const extension = match?.[1]?.toLowerCase() ?? "jpg";
  return extension === "jpeg" ? ".jpg" : `.${extension}`;
}

function hashString(value: string): string {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
}
