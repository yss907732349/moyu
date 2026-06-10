import { type WechatLoginResponse } from "@moyuxia/shared";
import {
  getMiniappApiBaseUrl,
  isLocalOrPrivateApiBaseUrl,
  MINIAPP_API_TIMEOUT_MS
} from "./api-config.ts";

const AUTH_TOKEN_STORAGE_KEY = "moyuxia.authToken";
const AUTH_USER_ID_STORAGE_KEY = "moyuxia.authUserId";
const apiBaseUrl = getMiniappApiBaseUrl();
const allowLocalWechatCodeFallback =
  import.meta.env?.VITE_WECHAT_LOGIN_MOCK_ENABLED === "true" ||
  import.meta.env?.DEV ||
  isLocalOrPrivateApiBaseUrl(apiBaseUrl);

interface AuthRequestOptions {
  request?: typeof uni.request;
  login?: typeof uni.login;
}

export class AuthClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthClientError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function getAppAuthToken(): string | null {
  try {
    const token = uni.getStorageSync(AUTH_TOKEN_STORAGE_KEY) as unknown;
    return typeof token === "string" && token ? token : null;
  } catch {
    return null;
  }
}

export function saveAppAuthSession(response: WechatLoginResponse): void {
  uni.setStorageSync(AUTH_TOKEN_STORAGE_KEY, response.token);
  uni.setStorageSync(AUTH_USER_ID_STORAGE_KEY, response.userId);
}

export function clearAppAuthSession(): void {
  uni.removeStorageSync(AUTH_TOKEN_STORAGE_KEY);
  uni.removeStorageSync(AUTH_USER_ID_STORAGE_KEY);
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAppAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function isWechatLoginResponse(value: unknown): value is WechatLoginResponse {
  return (
    isRecord(value) &&
    typeof value.token === "string" &&
    typeof value.userId === "string" &&
    typeof value.isNewUser === "boolean" &&
    typeof value.expiresAt === "string"
  );
}

function loginWithWechat(login: typeof uni.login): Promise<string> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const fallbackToLocalCode = () => {
      if (settled) {
        return;
      }

      settled = true;
      if (allowLocalWechatCodeFallback) {
        resolve(`local-dev-${Date.now()}`);
        return;
      }

      reject(new AuthClientError("微信登录失败，请稍后重试"));
    };

    const timeoutId = setTimeout(fallbackToLocalCode, 1500);

    login({
      provider: "weixin",
      success: (res) => {
        if (settled) {
          return;
        }

        if (typeof res.code === "string" && res.code) {
          settled = true;
          clearTimeout(timeoutId);
          resolve(res.code);
          return;
        }

        fallbackToLocalCode();
      },
      fail: () => {
        clearTimeout(timeoutId);
        fallbackToLocalCode();
      }
    });
  });
}

function requestWechatLogin(code: string, request: typeof uni.request): Promise<unknown> {
  return new Promise((resolve, reject) => {
    request({
      url: `${apiBaseUrl}/auth/wechat-login`,
      method: "POST",
      data: { code },
      timeout: MINIAPP_API_TIMEOUT_MS,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
          return;
        }

        reject(new AuthClientError("登录失败，请稍后重试"));
      },
      fail: () => reject(new AuthClientError("网络异常，请稍后重试"))
    });
  });
}

export async function loginWithWechatMiniapp(
  options: AuthRequestOptions = {}
): Promise<WechatLoginResponse> {
  const code = await loginWithWechat(options.login ?? uni.login);
  const data = await requestWechatLogin(code, options.request ?? uni.request);

  if (!isWechatLoginResponse(data)) {
    throw new AuthClientError("登录响应结构异常");
  }

  saveAppAuthSession(data);
  return data;
}
