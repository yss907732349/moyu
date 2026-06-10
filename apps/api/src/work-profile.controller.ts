import { BadRequestException, Body, Controller, Get, Put, Req } from "@nestjs/common";
import { WorkProfileValidationError, type SaveWorkProfileRequest } from "@moyuxia/shared";
import { CurrentUserContextService } from "./current-user.context";
import { WorkProfileService } from "./work-profile.service";

@Controller("me/work-profile")
export class WorkProfileController {
  constructor(
    private readonly currentUserContext: CurrentUserContextService,
    private readonly workProfileService: WorkProfileService
  ) {}

  @Get()
  getMine(@Req() request?: { headers: { authorization?: string } }) {
    return this.workProfileService.getByUserId(
      this.currentUserContext.getCurrentUser(request).userId
    );
  }

  @Put()
  async saveMine(
    @Req() httpRequestOrBody: { headers: { authorization?: string } } | SaveWorkProfileRequest,
    @Body() maybeRequest?: SaveWorkProfileRequest
  ) {
    const httpRequest = maybeRequest ? httpRequestOrBody : undefined;
    const request = maybeRequest ?? (httpRequestOrBody as SaveWorkProfileRequest);

    try {
      return await this.workProfileService.saveForUserId(
        this.currentUserContext.getCurrentUser(
          httpRequest as { headers: { authorization?: string } } | undefined
        ).userId,
        request
      );
    } catch (error) {
      if (error instanceof WorkProfileValidationError) {
        throw new BadRequestException({
          errorCode: "work_profile_validation_error",
          message: "工作档案校验失败",
          issues: error.issues
        });
      }

      throw error;
    }
  }
}
