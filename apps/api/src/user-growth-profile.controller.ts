import { BadRequestException, Body, Controller, Get, Post, Put, Req } from "@nestjs/common";
import {
  isUserProfessionType,
  type CreateUserProfileRequest,
  type UpdateUserProfileRequest
} from "@moyuxia/shared";
import { CurrentUserContextService } from "./current-user.context";
import { UserGrowthProfileService } from "./user-growth-profile.service";

@Controller("me")
export class UserGrowthProfileController {
  constructor(
    private readonly currentUserContext: CurrentUserContextService,
    private readonly userGrowthProfileService: UserGrowthProfileService
  ) {}

  @Get("profile")
  getProfile(@Req() request: { headers: { authorization?: string } }) {
    const currentUser = this.currentUserContext.getCurrentUser(request);
    return this.userGrowthProfileService.getProfile(currentUser.userId);
  }

  @Post("profile")
  createProfile(
    @Req() request: { headers: { authorization?: string } },
    @Body() body: CreateUserProfileRequest
  ) {
    const professionType = String(body.professionType ?? "");

    if (!isUserProfessionType(professionType)) {
      throw new BadRequestException({
        errorCode: "invalid_profession_type",
        message: "职业类型无效"
      });
    }

    const currentUser = this.currentUserContext.getCurrentUser(request);
    return this.userGrowthProfileService.createProfile(currentUser.userId, professionType);
  }

  @Put("profile")
  updateProfile(
    @Req() request: { headers: { authorization?: string } },
    @Body() body: UpdateUserProfileRequest
  ) {
    const currentUser = this.currentUserContext.getCurrentUser(request);
    return this.userGrowthProfileService.updateProfile(currentUser.userId, body);
  }

  @Post("daily-checkin")
  dailyCheckin(@Req() request: { headers: { authorization?: string } }) {
    const currentUser = this.currentUserContext.getCurrentUser(request);
    return this.userGrowthProfileService.dailyCheckin(currentUser.userId);
  }
}
