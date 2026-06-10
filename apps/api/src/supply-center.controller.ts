import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
  ForbiddenException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  AdminOperationsRealtimeTargetType,
  AdminOperationsSource,
  SupplyItemStatus,
  type AdminSupplyExceptionPoolQuery,
  type AdminSupplyItemFilters,
  type AdminSupplyMetricsQuery,
  type SupplyItemConfig,
  type SyncJutuikeOrdersRequest
} from "@moyuxia/shared";
import { AdminOperationsService } from "./admin-operations.service";
import { CurrentUserContextService } from "./current-user.context";
import { SupplyCenterService } from "./supply-center.service";

@Controller("supply-center")
export class SupplyCenterController {
  constructor(
    private readonly currentUserContext: CurrentUserContextService,
    private readonly supplyCenterService: SupplyCenterService
  ) {}

  @Get()
  listPublicItems() {
    return this.supplyCenterService.listPublicItems();
  }

  @Post("items/:itemId/click")
  createClick(
    @Req() request: { headers: { authorization?: string } },
    @Param("itemId") itemId: string
  ) {
    return this.supplyCenterService.createClick(
      this.currentUserContext.getCurrentUser(request).userId,
      itemId
    );
  }
}

@Controller("admin/supply-center")
export class AdminSupplyCenterController {
  constructor(
    private readonly configService: ConfigService,
    private readonly supplyCenterService: SupplyCenterService,
    private readonly adminOperationsService: AdminOperationsService
  ) {}

  @Get("items")
  listItems(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Query() query: AdminSupplyItemFilters
  ) {
    this.assertAdmin(adminToken);
    return this.supplyCenterService.listAdminItems(query);
  }

  @Post("items")
  async saveItem(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Body() body: Partial<SupplyItemConfig>
  ) {
    this.assertAdmin(adminToken);
    const response = await this.supplyCenterService.saveAdminItem(body);
    await this.adminOperationsService.publishWorkbenchCountsChanged(
      AdminOperationsSource.SupplyCenter,
      AdminOperationsRealtimeTargetType.SupplyCenterItem,
      response.id
    );
    return response;
  }

  @Post("items/batch-status")
  async batchStatus(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Body() body: { itemIds?: string[]; status?: string }
  ) {
    this.assertAdmin(adminToken);
    const status =
      body.status === SupplyItemStatus.Published
        ? SupplyItemStatus.Published
        : SupplyItemStatus.Offline;
    const response = await this.supplyCenterService.batchUpdateAdminItems(
      Array.isArray(body.itemIds) ? body.itemIds : [],
      status
    );
    await this.adminOperationsService.publishWorkbenchCountsChanged(
      AdminOperationsSource.SupplyCenter,
      AdminOperationsRealtimeTargetType.SupplyCenterItem,
      "batch-status"
    );
    return response;
  }

  @Post("items/:itemId/copy")
  async copyItem(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Param("itemId") itemId: string
  ) {
    this.assertAdmin(adminToken);
    const response = await this.supplyCenterService.copyAdminItem(itemId);
    await this.adminOperationsService.publishWorkbenchCountsChanged(
      AdminOperationsSource.SupplyCenter,
      AdminOperationsRealtimeTargetType.SupplyCenterItem,
      response.id
    );
    return response;
  }

  @Get("public-preview")
  previewPublicItems(@Headers("x-admin-token") adminToken: string | undefined) {
    this.assertAdmin(adminToken);
    return this.supplyCenterService.previewAdminItems();
  }

  @Get("clicks")
  listClicks(@Headers("x-admin-token") adminToken: string | undefined) {
    this.assertAdmin(adminToken);
    return this.supplyCenterService.listAdminClicks();
  }

  @Get("order-syncs")
  listOrderSyncs(@Headers("x-admin-token") adminToken: string | undefined) {
    this.assertAdmin(adminToken);
    return this.supplyCenterService.listAdminOrderSyncs();
  }

  @Get("traces")
  getTrace(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Query("clickId") clickId?: string,
    @Query("sourceOrderId") sourceOrderId?: string
  ) {
    this.assertAdmin(adminToken);
    return this.supplyCenterService.getAdminTrace({ clickId, sourceOrderId });
  }

  @Get("exceptions")
  listExceptions(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Query() query: AdminSupplyExceptionPoolQuery
  ) {
    this.assertAdmin(adminToken);
    return this.supplyCenterService.listExceptionPool(query);
  }

  @Post("exceptions/:recordId/retry")
  retryException(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Param("recordId") recordId: string
  ) {
    this.assertAdmin(adminToken);
    return this.supplyCenterService.markExceptionForRetry(recordId);
  }

  @Get("metrics")
  getMetrics(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Query() query: AdminSupplyMetricsQuery
  ) {
    this.assertAdmin(adminToken);
    return this.supplyCenterService.getAdminMetrics(query);
  }

  @Post("jutuike-orders/sync")
  async syncOrders(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Body() body: SyncJutuikeOrdersRequest
  ) {
    this.assertAdmin(adminToken);
    const response = await this.supplyCenterService.syncJutuikeOrders(
      Array.isArray(body.orders) ? body.orders : []
    );
    await this.adminOperationsService.publishWorkbenchCountsChanged(
      AdminOperationsSource.SupplyCenter,
      AdminOperationsRealtimeTargetType.SupplyCenterOrderSync,
      "jutuike-orders"
    );
    return response;
  }

  private assertAdmin(adminToken?: string): void {
    const expectedToken =
      this.configService.get<string>("ADMIN_OPERATIONS_TOKEN") || "dev-admin-token";

    if (adminToken !== expectedToken) {
      throw new ForbiddenException({
        errorCode: "admin_unauthorized",
        message: "无权访问后台补给铺运营"
      });
    }
  }
}
