import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface WechatSession {
  openid: string;
  unionid?: string;
  sessionKey?: string;
}

export class WechatLoginError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WechatLoginError";
  }
}

@Injectable()
export class WechatLoginClient {
  constructor(private readonly configService: ConfigService) {}

  async codeToSession(code: string): Promise<WechatSession> {
    if (!code.trim()) {
      throw new WechatLoginError("微信登录凭证不能为空");
    }

    if (this.isMockEnabled()) {
      return {
        openid: `mock-openid-${code}`,
        unionid: `mock-unionid-${code}`,
        sessionKey: "mock-session-key"
      };
    }

    const appid = this.configService.get<string>("WECHAT_MINIAPP_APPID");
    const secret = this.configService.get<string>("WECHAT_MINIAPP_SECRET");

    if (!appid || !secret) {
      throw new WechatLoginError("微信登录配置缺失");
    }

    const url = new URL("https://api.weixin.qq.com/sns/jscode2session");
    url.searchParams.set("appid", appid);
    url.searchParams.set("secret", secret);
    url.searchParams.set("js_code", code);
    url.searchParams.set("grant_type", "authorization_code");

    const response = await fetch(url);
    const data = (await response.json()) as Record<string, unknown>;

    if (!response.ok || typeof data.openid !== "string") {
      const message = typeof data.errmsg === "string" ? data.errmsg : "微信登录失败";
      throw new WechatLoginError(message);
    }

    return {
      openid: data.openid,
      unionid: typeof data.unionid === "string" ? data.unionid : undefined,
      sessionKey: typeof data.session_key === "string" ? data.session_key : undefined
    };
  }

  private isMockEnabled(): boolean {
    if (this.configService.get<string>("WECHAT_LOGIN_MOCK_ENABLED") === "true") {
      return true;
    }

    const hasWechatConfig = Boolean(
      this.configService.get<string>("WECHAT_MINIAPP_APPID") &&
      this.configService.get<string>("WECHAT_MINIAPP_SECRET")
    );

    return !hasWechatConfig && this.configService.get<string>("NODE_ENV") !== "production";
  }
}
