import { BadRequestException, Body, Controller, Post } from "@nestjs/common";
import { type WechatLoginRequest } from "@moyuxia/shared";
import { AppAuthService } from "./app-auth.service";
import { UserGrowthProfileService } from "./user-growth-profile.service";
import { WechatLoginClient, WechatLoginError } from "./wechat-login.client";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly appAuthService: AppAuthService,
    private readonly wechatLoginClient: WechatLoginClient,
    private readonly userGrowthProfileService: UserGrowthProfileService
  ) {}

  @Post("wechat-login")
  async wechatLogin(@Body() request: WechatLoginRequest) {
    try {
      const session = await this.wechatLoginClient.codeToSession(String(request.code ?? ""));
      const result = await this.userGrowthProfileService.findOrCreateUserByWechatSession(session);
      const token = this.appAuthService.sign(result.userId);

      return {
        token: token.token,
        userId: result.userId,
        isNewUser: result.isNewUser,
        expiresAt: token.expiresAt
      };
    } catch (error) {
      if (error instanceof WechatLoginError) {
        throw new BadRequestException({
          errorCode: "wechat_login_failed",
          message: error.message
        });
      }

      throw error;
    }
  }
}
