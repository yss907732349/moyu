import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { WechatContentSecurityClient } from "./wechat-content-security.client";

export interface WechatPhoneNumberResult {
  phoneNumber: string;
}

export class WechatPhoneNumberError extends Error {
  readonly errcode?: number;

  constructor(message: string, errcode?: number) {
    super(message);
    this.name = "WechatPhoneNumberError";
    this.errcode = errcode;
  }
}

@Injectable()
export class WechatPhoneNumberClient {
  constructor(
    private readonly configService: ConfigService,
    private readonly wechatContentSecurityClient: WechatContentSecurityClient
  ) {}

  async getPhoneNumber(code: string): Promise<WechatPhoneNumberResult> {
    const normalizedCode = code.trim();
    if (!normalizedCode) {
      throw new WechatPhoneNumberError("手机号验证凭证不能为空");
    }
    if (/^(login|wx_login|wechat_login)[_-]/iu.test(normalizedCode)) {
      throw new WechatPhoneNumberError("手机号验证不能使用微信登录 code");
    }

    if (this.isMockEnabled()) {
      const mockFailure = this.configService.get<string>("WECHAT_PHONE_NUMBER_MOCK_ERROR");
      if (mockFailure === "true" || mockFailure === normalizedCode) {
        throw new WechatPhoneNumberError("手机号验证 mock 失败");
      }

      return {
        phoneNumber:
          this.configService.get<string>("WECHAT_PHONE_NUMBER_MOCK_PHONE") || "13800000000"
      };
    }

    const accessToken = await this.wechatContentSecurityClient.getAccessToken();
    const response = await fetch(
      `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${encodeURIComponent(
        accessToken
      )}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalizedCode })
      }
    );
    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    const errcode = typeof data.errcode === "number" ? data.errcode : undefined;

    if (!response.ok || (errcode !== undefined && errcode !== 0)) {
      throw new WechatPhoneNumberError(
        typeof data.errmsg === "string" ? data.errmsg : "微信手机号验证失败",
        errcode
      );
    }

    const phoneInfo = data.phone_info;
    const phoneNumber =
      phoneInfo && typeof phoneInfo === "object"
        ? ((phoneInfo as { phoneNumber?: unknown; purePhoneNumber?: unknown }).phoneNumber ??
          (phoneInfo as { phoneNumber?: unknown; purePhoneNumber?: unknown }).purePhoneNumber)
        : undefined;

    if (typeof phoneNumber !== "string" || !phoneNumber.trim()) {
      throw new WechatPhoneNumberError("微信手机号响应缺少有效手机号");
    }

    return { phoneNumber: phoneNumber.trim() };
  }

  private isMockEnabled(): boolean {
    if (this.configService.get<string>("WECHAT_PHONE_NUMBER_MOCK_ENABLED") === "true") {
      return true;
    }

    const hasWechatConfig = Boolean(
      this.configService.get<string>("WECHAT_MINIAPP_APPID") &&
      this.configService.get<string>("WECHAT_MINIAPP_SECRET")
    );

    return !hasWechatConfig && this.configService.get<string>("NODE_ENV") !== "production";
  }
}
