import { Controller, Get } from "@nestjs/common";
import { APP_NAME, FEATURE_KEYS } from "@moyuxia/shared";

@Controller("health")
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: "ok",
      service: APP_NAME,
      foundationFeature: FEATURE_KEYS.adminOperations
    };
  }
}
