import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppAuthService } from "./app-auth.service";
import { AdminOperationsController } from "./admin-operations.controller";
import { AdminOperationsService } from "./admin-operations.service";
import { AccountingLedgerController } from "./accounting-ledger.controller";
import { AccountingLedgerService } from "./accounting-ledger.service";
import { AiContentModerationService } from "./ai-content-moderation.service";
import { AuthController } from "./auth.controller";
import {
  AdminCommunityGovernanceController,
  CommunityLiteController,
  CommunityModerationController
} from "./community-lite.controller";
import { CommunityLiteService } from "./community-lite.service";
import { CurrentUserContextService } from "./current-user.context";
import {
  DailyContentAdminController,
  DailyContentFeedController
} from "./daily-content-feed.controller";
import { DailyContentFeedService } from "./daily-content-feed.service";
import { FeatureRegistryController } from "./feature-registry.controller";
import { HealthController } from "./health.controller";
import { LowCostContentModerationService } from "./low-cost-content-moderation.service";
import { PrismaService } from "./prisma.service";
import { AdminSupplyCenterController, SupplyCenterController } from "./supply-center.controller";
import { SupplyCenterService } from "./supply-center.service";
import { UserGrowthProfileController } from "./user-growth-profile.controller";
import { UserGrowthProfileService } from "./user-growth-profile.service";
import { WechatLoginClient } from "./wechat-login.client";
import { WechatContentSecurityClient } from "./wechat-content-security.client";
import { WechatPhoneNumberClient } from "./wechat-phone-number.client";
import { WorkProfileController } from "./work-profile.controller";
import { WorkProfileService } from "./work-profile.service";
import {
  WorldIntelAdminController,
  WorldIntelContentController
} from "./world-intel-content.controller";
import { WorldIntelContentService } from "./world-intel-content.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["../../.env.local", ".env.local", "../../.env", ".env"]
    })
  ],
  controllers: [
    HealthController,
    FeatureRegistryController,
    WorkProfileController,
    AuthController,
    UserGrowthProfileController,
    AccountingLedgerController,
    CommunityLiteController,
    CommunityModerationController,
    AdminCommunityGovernanceController,
    DailyContentFeedController,
    DailyContentAdminController,
    WorldIntelContentController,
    WorldIntelAdminController,
    SupplyCenterController,
    AdminSupplyCenterController,
    AdminOperationsController
  ],
  providers: [
    PrismaService,
    AppAuthService,
    CurrentUserContextService,
    WechatLoginClient,
    WechatContentSecurityClient,
    WechatPhoneNumberClient,
    WorkProfileService,
    UserGrowthProfileService,
    AccountingLedgerService,
    AiContentModerationService,
    LowCostContentModerationService,
    CommunityLiteService,
    WorldIntelContentService,
    DailyContentFeedService,
    SupplyCenterService,
    AdminOperationsService
  ]
})
export class AppModule {}
