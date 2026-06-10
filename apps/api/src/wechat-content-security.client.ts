import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface WechatTextSecurityRequest {
  openid: string;
  content: string;
  scene: number;
}

export interface WechatImageSecurityRequest {
  openid: string;
  mediaUrl: string;
  mediaType: number;
  scene: number;
}

export interface WechatContentSecurityResponse {
  errcode?: number;
  errmsg?: string;
  result?: {
    suggest?: string;
    label?: string | number;
  };
  trace_id?: string;
}

interface CachedAccessToken {
  token: string;
  expiresAt: number;
}

export class WechatContentSecurityError extends Error {
  readonly errcode?: number;

  constructor(message: string, errcode?: number) {
    super(message);
    this.name = "WechatContentSecurityError";
    this.errcode = errcode;
  }
}

@Injectable()
export class WechatContentSecurityClient {
  private cachedAccessToken?: CachedAccessToken;

  constructor(private readonly configService: ConfigService) {}

  async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.cachedAccessToken && this.cachedAccessToken.expiresAt > now + 60_000) {
      return this.cachedAccessToken.token;
    }

    const appid = this.configService.get<string>("WECHAT_MINIAPP_APPID");
    const secret = this.configService.get<string>("WECHAT_MINIAPP_SECRET");
    if (!appid || !secret) {
      throw new WechatContentSecurityError("微信内容安全配置缺失");
    }

    const url = new URL("https://api.weixin.qq.com/cgi-bin/token");
    url.searchParams.set("grant_type", "client_credential");
    url.searchParams.set("appid", appid);
    url.searchParams.set("secret", secret);

    const data = await this.fetchJson<Record<string, unknown>>(url.toString(), {
      method: "GET"
    });

    if (typeof data.access_token !== "string") {
      throw new WechatContentSecurityError(
        typeof data.errmsg === "string" ? data.errmsg : "微信 access token 获取失败",
        typeof data.errcode === "number" ? data.errcode : undefined
      );
    }

    const expiresIn =
      typeof data.expires_in === "number" && data.expires_in > 0 ? data.expires_in : 7200;
    this.cachedAccessToken = {
      token: data.access_token,
      expiresAt: now + Math.max(60, expiresIn - 300) * 1000
    };
    return data.access_token;
  }

  async checkText(request: WechatTextSecurityRequest): Promise<WechatContentSecurityResponse> {
    const accessToken = await this.getAccessToken();
    const url = `https://api.weixin.qq.com/wxa/msg_sec_check?access_token=${encodeURIComponent(
      accessToken
    )}`;

    return this.fetchJson<WechatContentSecurityResponse>(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        version: 2,
        openid: request.openid,
        scene: request.scene,
        content: request.content
      })
    });
  }

  async submitImage(request: WechatImageSecurityRequest): Promise<WechatContentSecurityResponse> {
    const accessToken = await this.getAccessToken();
    const url = `https://api.weixin.qq.com/wxa/media_check_async?access_token=${encodeURIComponent(
      accessToken
    )}`;

    return this.fetchJson<WechatContentSecurityResponse>(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        version: 2,
        openid: request.openid,
        scene: request.scene,
        media_type: request.mediaType,
        media_url: request.mediaUrl
      })
    });
  }

  sanitizeError(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    return message
      .replace(/access_token=[^&\s]+/gi, "access_token=<redacted>")
      .replace(/secret=[^&\s]+/gi, "secret=<redacted>")
      .replace(/openid[-_a-zA-Z0-9]{4,}/g, "openid<redacted>");
  }

  private async fetchJson<T>(url: string, init: RequestInit): Promise<T> {
    const timeoutMs = normalizePositiveInteger(
      this.configService.get<string>("WECHAT_CONTENT_SECURITY_TIMEOUT_MS"),
      3000,
      500,
      15000
    );
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      if (!response.ok) {
        throw new WechatContentSecurityError(
          typeof data.errmsg === "string" ? data.errmsg : `微信接口返回 ${response.status}`,
          typeof data.errcode === "number" ? data.errcode : undefined
        );
      }
      return data as T;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new WechatContentSecurityError("微信内容安全接口超时");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

function normalizePositiveInteger(
  value: unknown,
  fallback: number,
  min: number,
  max: number
): number {
  const parsed = Number(value ?? fallback);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}
