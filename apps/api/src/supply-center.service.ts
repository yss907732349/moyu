import { createHash, randomBytes } from "node:crypto";
import { request as httpRequest } from "node:http";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  BUILTIN_SURVIVAL_LEDGER_CATEGORIES,
  CpsLedgerImportAction,
  CpsOrderStatus,
  CpsSourceProvider,
  DEFAULT_SUPPLY_ITEMS,
  SupplyActivityGroupKey,
  SupplyAttributionFailureReason,
  SupplyClickJumpStatus,
  SupplyFallbackStrategy,
  SupplyItemStatus,
  SupplyLedgerSyncStatus,
  SupplyOrderExceptionType,
  SupplyRecommendationSlot,
  SupplyTransferAttemptStatus,
  appendCpsOrderStateHistory,
  assertPublicSupplyPreviewSafe,
  assertSupplySidSafe,
  buildAdminSupplyPublicPreview,
  buildSupplyCenterPublicList,
  classifyJutuikeOrderFallback,
  cpsLedgerExclusionReasonForStatus,
  decideCpsLedgerImport,
  explainSupplyAttributionFailure,
  isSupplyItemPubliclyAvailable,
  mapJutuikeOrderStatusToCpsOrderStatus,
  maskSupplySid,
  normalizeJutuikeOrderToCpsInput,
  validateSupplyItemConfig,
  withSupplyItemDefaults,
  type AdminSupplyBatchStatusResponse,
  type AdminSupplyClickListResponse,
  type AdminSupplyExceptionPoolItem,
  type AdminSupplyExceptionPoolQuery,
  type AdminSupplyExceptionPoolResponse,
  type AdminSupplyItemFilters,
  type AdminSupplyItemListResponse,
  type AdminSupplyMetricsQuery,
  type AdminSupplyMetricsResponse,
  type AdminSupplyOrderSyncListResponse,
  type AdminSupplyPublicPreviewResponse,
  type AdminSupplyTraceResponse,
  type CpsOrderStateHistoryEntry,
  type JutuikeUnifiedOrder,
  type PublicSupplyItem,
  type SupplyCenterPublicListResponse,
  type SupplyClickAttribution,
  type SupplyClickResponse,
  type SupplyItemConfig,
  type SupplyJumpTarget,
  type SupplyOrderSyncRecord,
  type SupplyTransferAttemptRecord,
  type SyncJutuikeOrdersResponse
} from "@moyuxia/shared";
import { AccountingLedgerService } from "./accounting-ledger.service";
import { PrismaService } from "./prisma.service";
import { UserGrowthProfileService } from "./user-growth-profile.service";

interface SupplyItemRecord {
  id: string;
  title: string;
  description: string;
  sectionKey: string;
  coverImageUrl: string | null;
  actionText: string;
  sortOrder: number;
  status: string;
  validFrom: Date | null;
  validUntil: Date | null;
  defaultCategoryKey: string;
  jutuikeActId: string;
  jutuikeSourceName: string;
  internalNote: string | null;
  groupKey: string;
  userVisibleTags: unknown;
  displayPriority: number;
  recommendationTimeWindows: unknown;
  displayWorkdayRule: string;
  attributionWindowHours: number;
  transferExpiresMinutes: number;
  clickDedupeWindowSeconds: number;
  fallbackStrategy: string;
  fallbackTargetType: string | null;
  fallbackUrl: string | null;
  fallbackMiniappAppId: string | null;
  fallbackMiniappPath: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SupplyClickRecord {
  id: string;
  userId: string;
  supplyItemId: string;
  sectionKey: string;
  defaultCategoryKey: string;
  jutuikeActId: string;
  sid: string;
  sidDigest: string | null;
  sidMasked: string;
  jumpStatus: string;
  failureReason: string | null;
  transferExpiresAt: Date | null;
  attributionWindowEndsAt: Date | null;
  jumpTargetType: string | null;
  jumpTargetExpiresAt: Date | null;
  fallbackAttributable: boolean;
  reusedFromClickId: string | null;
  clickedAt: Date;
  updatedAt: Date;
}

interface SupplyTransferAttemptRecordDb {
  id: string;
  clickId: string;
  supplyItemId: string;
  sidDigest: string | null;
  sidMasked: string;
  status: string;
  targetType: string | null;
  targetPayload: unknown;
  usedFallback: boolean;
  fallbackAttributable: boolean;
  failureReason: string | null;
  targetExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SupplyOrderSyncRecordDb {
  id: string;
  sourceProvider: string;
  sourceOrderId: string;
  sid: string | null;
  sidDigest: string | null;
  sidMasked: string | null;
  actId: string | null;
  brandId: string | null;
  sourceStatus: string;
  mappedStatus: string;
  amountMinor: number;
  paidAt: Date | null;
  matched: boolean;
  matchedClickId: string | null;
  matchedSupplyItemId: string | null;
  ledgerSyncStatus: string;
  ledgerAction: string;
  ledgerBillId: string | null;
  attributionFailureReason: string | null;
  exceptionType: string | null;
  failureReason: string | null;
  failureExplanation: string | null;
  statusHistory: unknown;
  createdAt: Date;
  updatedAt: Date;
}

type AdminClickRow = Omit<SupplyClickAttribution, "sid" | "sidDigest" | "userId" | "jumpTarget">;

@Injectable()
export class SupplyCenterService {
  private readonly memoryItems = new Map<string, SupplyItemConfig>(
    DEFAULT_SUPPLY_ITEMS.map((item) => [item.id, item])
  );
  private readonly memoryClicks = new Map<string, SupplyClickAttribution>();
  private readonly memoryTransferAttempts = new Map<string, SupplyTransferAttemptRecord>();
  private readonly memoryOrders = new Map<string, SupplyOrderSyncRecord>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly userGrowthProfileService: UserGrowthProfileService,
    private readonly accountingLedgerService: AccountingLedgerService
  ) {}

  async listPublicItems(): Promise<SupplyCenterPublicListResponse> {
    const items = await this.listAllItems();
    return buildSupplyCenterPublicList(items);
  }

  async createClick(userId: string, itemId: string): Promise<SupplyClickResponse> {
    await this.assertProfileCreated(userId);
    const item = await this.findItem(itemId);
    if (!item || !isSupplyItemPubliclyAvailable(item)) {
      throw new NotFoundException({
        errorCode: "supply_item_not_available",
        message: "补给项暂不可用"
      });
    }

    const saved = await this.saveClick(this.createClickRecord(userId, item));
    const reusable = await this.findReusableLinkedClick(userId, item);
    if (reusable?.jumpTarget) {
      const reused = await this.updateClickJumpStatus(saved.id, SupplyClickJumpStatus.Reused, {
        reusedFromClickId: reusable.id,
        jumpTarget: reusable.jumpTarget,
        jumpTargetExpiresAt: reusable.jumpTargetExpiresAt,
        fallbackAttributable: reusable.fallbackAttributable
      });
      await this.saveTransferAttempt(
        this.createTransferAttempt(reused, SupplyTransferAttemptStatus.Reused, {
          jumpTarget: reusable.jumpTarget,
          targetExpiresAt: reusable.jumpTargetExpiresAt
        })
      );
      return this.toClickResponse(reused, "补给通道已复用，订单同步后才会进入生存账本。");
    }

    try {
      const jumpTarget = await this.transferJutuikeLink(item, saved.sid);
      const targetExpiresAt = saved.transferExpiresAt;
      const linked = await this.updateClickJumpStatus(saved.id, SupplyClickJumpStatus.Linked, {
        jumpTarget,
        jumpTargetExpiresAt: targetExpiresAt
      });
      await this.saveTransferAttempt(
        this.createTransferAttempt(linked, SupplyTransferAttemptStatus.Success, {
          jumpTarget,
          targetExpiresAt
        })
      );
      return this.toClickResponse(linked, "补给已打开，订单同步成功后会自动进入生存账本。");
    } catch (error) {
      const reason = error instanceof Error ? error.message : "转链服务不可用";
      const fallback = this.buildFallbackTarget(item);
      if (fallback) {
        const fallbackAttributable =
          item.fallbackStrategy === SupplyFallbackStrategy.AttributableLink;
        const status = fallbackAttributable
          ? SupplyTransferAttemptStatus.FallbackAttributable
          : SupplyTransferAttemptStatus.FallbackNonAttributable;
        const linked = await this.updateClickJumpStatus(
          saved.id,
          SupplyClickJumpStatus.FallbackLinked,
          {
            failureReason: reason,
            jumpTarget: fallback,
            jumpTargetExpiresAt: saved.transferExpiresAt,
            fallbackAttributable
          }
        );
        await this.saveTransferAttempt(
          this.createTransferAttempt(linked, status, {
            jumpTarget: fallback,
            targetExpiresAt: saved.transferExpiresAt,
            usedFallback: true,
            fallbackAttributable,
            failureReason: reason
          })
        );
        return this.toClickResponse(
          linked,
          fallbackAttributable
            ? "补给暂时切换备用通道，订单同步后才会进入生存账本。"
            : "补给暂时切换备用通道，本次不承诺订单自动收纳到账本。"
        );
      }

      const failed = await this.updateClickJumpStatus(saved.id, SupplyClickJumpStatus.Unavailable, {
        failureReason: reason
      });
      await this.saveTransferAttempt(
        this.createTransferAttempt(failed, SupplyTransferAttemptStatus.Failed, {
          failureReason: reason
        })
      );
      throw new ServiceUnavailableException({
        errorCode: "supply_transfer_unavailable",
        message: "补给暂不可用，请稍后重试",
        clickId: failed.id,
        sidMasked: failed.sidMasked
      });
    }
  }

  async syncJutuikeOrders(
    orders: readonly JutuikeUnifiedOrder[]
  ): Promise<SyncJutuikeOrdersResponse> {
    const records: SupplyOrderSyncRecord[] = [];
    for (const order of orders) {
      records.push(await this.syncOneJutuikeOrder(order));
    }
    return { records };
  }

  async listAdminItems(filters: AdminSupplyItemFilters = {}): Promise<AdminSupplyItemListResponse> {
    const items = (await this.listAllItems())
      .filter((item) => !filters.sectionKey || item.sectionKey === filters.sectionKey)
      .filter((item) => !filters.status || item.status === filters.status)
      .filter(
        (item) =>
          !filters.tag ||
          item.userVisibleTags.some((tag) =>
            tag.toLowerCase().includes(String(filters.tag).toLowerCase())
          )
      )
      .filter(
        (item) =>
          !filters.recommendationSlot ||
          item.recommendationTimeWindows.some(
            (window) => window.slot === filters.recommendationSlot
          )
      )
      .filter((item) => !filters.sourceName || item.jutuikeSourceName === filters.sourceName)
      .filter((item) =>
        filters.effectiveAt
          ? isSupplyItemPubliclyAvailable(item, new Date(filters.effectiveAt))
          : true
      );
    return { items };
  }

  async saveAdminItem(
    patch: Partial<SupplyItemConfig> & { id?: string }
  ): Promise<SupplyItemConfig> {
    const now = new Date().toISOString();
    const existing = patch.id ? await this.findItem(patch.id) : undefined;
    const item = withSupplyItemDefaults({
      id: existing?.id ?? patch.id ?? `supply_custom_${Date.now()}`,
      title: patch.title ?? existing?.title ?? "",
      description: patch.description ?? existing?.description ?? "",
      sectionKey: patch.sectionKey ?? existing?.sectionKey ?? "canteen",
      coverImageUrl: patch.coverImageUrl ?? existing?.coverImageUrl,
      actionText: patch.actionText ?? existing?.actionText ?? "去补给",
      sortOrder: patch.sortOrder ?? existing?.sortOrder ?? 100,
      status: patch.status ?? existing?.status ?? SupplyItemStatus.Draft,
      validFrom: patch.validFrom ?? existing?.validFrom,
      validUntil: patch.validUntil ?? existing?.validUntil,
      defaultCategoryKey: patch.defaultCategoryKey ?? existing?.defaultCategoryKey ?? "canteen",
      jutuikeActId: patch.jutuikeActId ?? existing?.jutuikeActId ?? "",
      jutuikeSourceName: "jutuike",
      internalNote: patch.internalNote ?? existing?.internalNote,
      groupKey: patch.groupKey ?? existing?.groupKey ?? SupplyActivityGroupKey.General,
      userVisibleTags: patch.userVisibleTags ?? existing?.userVisibleTags ?? [],
      displayPriority: patch.displayPriority ?? existing?.displayPriority ?? 50,
      recommendationTimeWindows:
        patch.recommendationTimeWindows ?? existing?.recommendationTimeWindows ?? [],
      displayWorkdayRule: patch.displayWorkdayRule ?? existing?.displayWorkdayRule,
      attributionWindowHours: patch.attributionWindowHours ?? existing?.attributionWindowHours,
      transferExpiresMinutes: patch.transferExpiresMinutes ?? existing?.transferExpiresMinutes,
      clickDedupeWindowSeconds:
        patch.clickDedupeWindowSeconds ?? existing?.clickDedupeWindowSeconds,
      fallbackStrategy: patch.fallbackStrategy ?? existing?.fallbackStrategy,
      fallbackTargetType: patch.fallbackTargetType ?? existing?.fallbackTargetType,
      fallbackUrl: patch.fallbackUrl ?? existing?.fallbackUrl,
      fallbackMiniappAppId: patch.fallbackMiniappAppId ?? existing?.fallbackMiniappAppId,
      fallbackMiniappPath: patch.fallbackMiniappPath ?? existing?.fallbackMiniappPath,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    });
    validateSupplyItemConfig(item);

    if (!this.isDatabaseConfigured()) {
      this.memoryItems.set(item.id, item);
      return item;
    }

    const record = await this.supplyItem.upsert({
      where: { id: item.id },
      create: this.itemToPrismaData(item),
      update: this.itemToPrismaData(item)
    });
    return this.recordToItem(record);
  }

  async batchUpdateAdminItems(
    itemIds: readonly string[],
    status: typeof SupplyItemStatus.Published | typeof SupplyItemStatus.Offline
  ): Promise<AdminSupplyBatchStatusResponse> {
    const updated: SupplyItemConfig[] = [];
    const failed: { id: string; reason: string }[] = [];
    for (const itemId of itemIds) {
      const item = await this.findItem(itemId);
      if (!item) {
        failed.push({ id: itemId, reason: "补给项不存在" });
        continue;
      }
      updated.push(await this.saveAdminItem({ ...item, status }));
    }
    return { updated, failed };
  }

  async copyAdminItem(itemId: string): Promise<SupplyItemConfig> {
    const item = await this.findItem(itemId);
    if (!item) {
      throw new NotFoundException({
        errorCode: "supply_item_not_found",
        message: "补给项不存在"
      });
    }
    return this.saveAdminItem({
      ...item,
      id: `${item.id}_copy_${Date.now()}`,
      title: `${item.title} 副本`,
      status: SupplyItemStatus.Draft
    });
  }

  async previewAdminItems(): Promise<AdminSupplyPublicPreviewResponse> {
    const response = buildAdminSupplyPublicPreview(await this.listAllItems());
    assertPublicSupplyPreviewSafe(response);
    return response;
  }

  async listAdminClicks(): Promise<AdminSupplyClickListResponse> {
    const clicks = this.isDatabaseConfigured()
      ? (await this.supplyClick.findMany({ orderBy: { clickedAt: "desc" }, take: 100 })).map(
          (record) => this.recordToClick(record)
        )
      : [...this.memoryClicks.values()].sort((a, b) => b.clickedAt.localeCompare(a.clickedAt));

    return {
      clicks: clicks.map(
        (click): AdminClickRow => ({
          id: click.id,
          supplyItemId: click.supplyItemId,
          sectionKey: click.sectionKey,
          defaultCategoryKey: click.defaultCategoryKey,
          jutuikeActId: click.jutuikeActId,
          sidMasked: click.sidMasked,
          jumpStatus: click.jumpStatus,
          clickedAt: click.clickedAt,
          updatedAt: click.updatedAt,
          transferExpiresAt: click.transferExpiresAt,
          attributionWindowEndsAt: click.attributionWindowEndsAt,
          jumpTargetExpiresAt: click.jumpTargetExpiresAt,
          fallbackAttributable: click.fallbackAttributable,
          reusedFromClickId: click.reusedFromClickId,
          failureReason: click.failureReason
        })
      )
    };
  }

  async listAdminOrderSyncs(): Promise<AdminSupplyOrderSyncListResponse> {
    const records = this.isDatabaseConfigured()
      ? (await this.supplyOrderSync.findMany({ orderBy: { updatedAt: "desc" }, take: 100 })).map(
          (record) => this.recordToOrder(record)
        )
      : [...this.memoryOrders.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return { records };
  }

  async getAdminTrace(query: {
    clickId?: string;
    sourceOrderId?: string;
  }): Promise<AdminSupplyTraceResponse> {
    const click = query.clickId ? await this.findClickById(query.clickId) : null;
    const order = query.sourceOrderId
      ? await this.findOrderSync(CpsSourceProvider.Jutuike, query.sourceOrderId)
      : null;
    const matchedClick =
      click ?? (order?.matchedClickId ? await this.findClickById(order.matchedClickId) : null);
    const item = matchedClick ? await this.findItem(matchedClick.supplyItemId) : null;
    const attempts = matchedClick ? await this.listTransferAttemptsForClick(matchedClick.id) : [];
    const failureReason = order?.attributionFailureReason;
    const response: AdminSupplyTraceResponse = {
      trace: {
        sourceActivity: item
          ? {
              itemId: item.id,
              title: item.title,
              sectionKey: item.sectionKey,
              activityId: item.jutuikeActId
            }
          : undefined,
        click: matchedClick
          ? {
              id: matchedClick.id,
              supplyItemId: matchedClick.supplyItemId,
              sectionKey: matchedClick.sectionKey,
              defaultCategoryKey: matchedClick.defaultCategoryKey,
              jutuikeActId: matchedClick.jutuikeActId,
              sidMasked: matchedClick.sidMasked,
              jumpStatus: matchedClick.jumpStatus,
              clickedAt: matchedClick.clickedAt,
              updatedAt: matchedClick.updatedAt,
              transferExpiresAt: matchedClick.transferExpiresAt,
              attributionWindowEndsAt: matchedClick.attributionWindowEndsAt,
              jumpTargetExpiresAt: matchedClick.jumpTargetExpiresAt,
              fallbackAttributable: matchedClick.fallbackAttributable,
              reusedFromClickId: matchedClick.reusedFromClickId,
              failureReason: matchedClick.failureReason
            }
          : undefined,
        transferAttempts: attempts,
        orderSync: order ?? undefined,
        ledger: order
          ? {
              ledgerBillId: order.ledgerBillId,
              syncStatus: order.ledgerSyncStatus,
              action: order.ledgerAction
            }
          : undefined,
        failure: failureReason
          ? {
              reason: failureReason,
              explanation: explainSupplyAttributionFailure(failureReason)
            }
          : undefined
      }
    };
    return response;
  }

  async listExceptionPool(
    query: AdminSupplyExceptionPoolQuery = {}
  ): Promise<AdminSupplyExceptionPoolResponse> {
    const records = (await this.listAdminOrderSyncs()).records
      .filter((record) => Boolean(record.exceptionType))
      .filter((record) => !query.type || record.exceptionType === query.type)
      .filter((record) => !query.reason || record.attributionFailureReason === query.reason)
      .filter((record) => !query.status || record.ledgerSyncStatus === query.status);
    return {
      exceptions: records.map(
        (record): AdminSupplyExceptionPoolItem => ({
          id: record.id,
          sourceOrderId: record.sourceOrderId,
          sourceProvider: record.sourceProvider,
          occurredAt: record.paidAt,
          sourceActivityId: record.actId,
          sidMasked: record.sidMasked,
          orderStatus: record.mappedStatus,
          amountMinor: record.amountMinor,
          exceptionType: record.exceptionType!,
          failureReason:
            record.attributionFailureReason ?? SupplyAttributionFailureReason.LedgerImportFailed,
          failureExplanation:
            record.failureExplanation ??
            explainSupplyAttributionFailure(
              record.attributionFailureReason ?? SupplyAttributionFailureReason.LedgerImportFailed
            ),
          recoverable:
            record.attributionFailureReason === SupplyAttributionFailureReason.LedgerImportFailed ||
            record.attributionFailureReason === SupplyAttributionFailureReason.OrderStatusInvalid,
          updatedAt: record.updatedAt
        })
      )
    };
  }

  async markExceptionForRetry(recordId: string): Promise<SupplyOrderSyncRecord> {
    const records = (await this.listAdminOrderSyncs()).records;
    const record = records.find((entry) => entry.id === recordId);
    if (!record) {
      throw new NotFoundException({
        errorCode: "supply_order_exception_not_found",
        message: "异常订单不存在"
      });
    }
    if (
      record.attributionFailureReason === SupplyAttributionFailureReason.SidMissing ||
      record.attributionFailureReason === SupplyAttributionFailureReason.SidNotFound
    ) {
      throw new BadRequestException({
        errorCode: "supply_order_exception_not_assignable",
        message: "无有效归因的订单不能强行分配给任意用户"
      });
    }
    return this.saveOrderSync({
      ...record,
      ledgerSyncStatus: SupplyLedgerSyncStatus.Failed,
      ledgerAction: CpsLedgerImportAction.Skipped,
      failureReason: "已标记待重试",
      failureExplanation: "状态或账本问题修复后可按来源订单幂等规则重试"
    });
  }

  async getAdminMetrics(query: AdminSupplyMetricsQuery = {}): Promise<AdminSupplyMetricsResponse> {
    const clicks = this.isDatabaseConfigured()
      ? (await this.supplyClick.findMany({ orderBy: { clickedAt: "desc" }, take: 1000 })).map(
          (record) => this.recordToClick(record)
        )
      : [...this.memoryClicks.values()];
    const orders = (await this.listAdminOrderSyncs()).records;
    const filteredClicks = clicks.filter((click) => withinDateRange(click.clickedAt, query));
    const filteredOrders = orders.filter((order) =>
      withinDateRange(order.paidAt ?? order.updatedAt, query)
    );
    const linkedClicks = filteredClicks.filter(
      (click) =>
        click.jumpStatus === SupplyClickJumpStatus.Linked ||
        click.jumpStatus === SupplyClickJumpStatus.FallbackLinked ||
        click.jumpStatus === SupplyClickJumpStatus.Reused
    );
    const effectiveOrders = filteredOrders.filter(
      (order) => order.ledgerSyncStatus === SupplyLedgerSyncStatus.Imported
    );
    const categoryStats = BUILTIN_SURVIVAL_LEDGER_CATEGORIES.map((category) => {
      const itemOrders = effectiveOrders.filter((order) => {
        const click = order.matchedClickId
          ? filteredClicks.find((entry) => entry.id === order.matchedClickId)
          : undefined;
        return click?.defaultCategoryKey === category.key;
      });
      return {
        categoryKey: category.key,
        displayName: category.displayName,
        amountMinor: sumOrders(itemOrders),
        orderCount: itemOrders.length
      };
    });
    const activityStats = (await this.listAllItems())
      .filter((item) => !query.itemId || item.id === query.itemId)
      .map((item) => {
        const itemClicks = filteredClicks.filter((click) => click.supplyItemId === item.id);
        const itemOrders = filteredOrders.filter((order) => order.matchedSupplyItemId === item.id);
        const itemEffectiveOrders = itemOrders.filter(
          (order) => order.ledgerSyncStatus === SupplyLedgerSyncStatus.Imported
        );
        return {
          itemId: item.id,
          title: item.title,
          clickCount: itemClicks.length,
          transferSuccessCount: itemClicks.filter(
            (click) =>
              click.jumpStatus === SupplyClickJumpStatus.Linked ||
              click.jumpStatus === SupplyClickJumpStatus.FallbackLinked ||
              click.jumpStatus === SupplyClickJumpStatus.Reused
          ).length,
          orderReturnCount: itemOrders.length,
          effectiveOrderCount: itemEffectiveOrders.length,
          ledgerAmountMinor: sumOrders(itemEffectiveOrders),
          exceptionReasonCounts: countBy(
            itemOrders
              .map((order) => order.attributionFailureReason)
              .filter((reason): reason is SupplyAttributionFailureReason => Boolean(reason))
          )
        };
      });
    return {
      generatedAt: new Date().toISOString(),
      todayClickCount: filteredClicks.length,
      uniqueClickUserCount: new Set(filteredClicks.map((click) => click.userId)).size,
      transferSuccessRate:
        filteredClicks.length > 0
          ? Number((linkedClicks.length / filteredClicks.length).toFixed(4))
          : 0,
      orderReturnCount: filteredOrders.length,
      effectiveOrderCount: effectiveOrders.length,
      ledgerAmountMinor: sumOrders(effectiveOrders),
      exceptionOrderCount: filteredOrders.filter((order) => Boolean(order.exceptionType)).length,
      categoryStats,
      activityStats
    };
  }

  private async syncOneJutuikeOrder(order: JutuikeUnifiedOrder): Promise<SupplyOrderSyncRecord> {
    const sourceProvider = CpsSourceProvider.Jutuike;
    const mappedStatus = mapJutuikeOrderStatusToCpsOrderStatus(order.status);
    const existing = await this.findOrderSync(sourceProvider, order.orderSn);
    const sidDigest = order.sid ? this.digestSid(order.sid) : undefined;
    const click = sidDigest ? await this.findClickBySidDigest(sidDigest, order.sid) : null;
    const paidAt = normalizePayTimeSafe(order.payTime);
    const baseRecord = {
      sourceProvider,
      sourceOrderId: order.orderSn,
      sidDigest,
      sidMasked: order.sid ? maskSupplySid(order.sid) : undefined,
      actId: order.actId,
      brandId: order.brandId,
      sourceStatus: String(order.status),
      mappedStatus,
      amountMinor: normalizePayPriceToMinor(order.payPrice),
      paidAt,
      matched: Boolean(click),
      matchedClickId: click?.id,
      matchedSupplyItemId: click?.supplyItemId
    };
    const attributionIssue = this.evaluateAttribution(order, click, paidAt);
    const categoryKey = click?.defaultCategoryKey ?? classifyJutuikeOrderFallback(order);

    if (attributionIssue) {
      return this.saveOrderSync(
        this.buildOrderRecord({
          ...baseRecord,
          existing,
          mappedStatus,
          ledgerSyncStatus: SupplyLedgerSyncStatus.NotMatched,
          ledgerAction: CpsLedgerImportAction.Skipped,
          attributionFailureReason: attributionIssue.reason,
          exceptionType: attributionIssue.exceptionType,
          failureReason: attributionIssue.explanation,
          failureExplanation: attributionIssue.explanation
        })
      );
    }

    if (!click) {
      return this.saveOrderSync(
        this.buildOrderRecord({
          ...baseRecord,
          existing,
          mappedStatus,
          ledgerSyncStatus: SupplyLedgerSyncStatus.NotMatched,
          ledgerAction: CpsLedgerImportAction.Skipped,
          attributionFailureReason: SupplyAttributionFailureReason.SidNotFound,
          exceptionType: SupplyOrderExceptionType.NoAttribution,
          failureReason: explainSupplyAttributionFailure(
            SupplyAttributionFailureReason.SidNotFound
          ),
          failureExplanation: explainSupplyAttributionFailure(
            SupplyAttributionFailureReason.SidNotFound
          )
        })
      );
    }

    if (!categoryKey) {
      return this.saveOrderSync(
        this.buildOrderRecord({
          ...baseRecord,
          existing,
          mappedStatus,
          ledgerSyncStatus: SupplyLedgerSyncStatus.Excluded,
          ledgerAction: CpsLedgerImportAction.Excluded,
          attributionFailureReason: SupplyAttributionFailureReason.ClassificationFailed,
          exceptionType: SupplyOrderExceptionType.ClassificationFailed,
          failureReason: explainSupplyAttributionFailure(
            SupplyAttributionFailureReason.ClassificationFailed
          ),
          failureExplanation: explainSupplyAttributionFailure(
            SupplyAttributionFailureReason.ClassificationFailed
          )
        })
      );
    }

    const decision = decideCpsLedgerImport({
      sourceProvider,
      sourceOrderId: order.orderSn,
      sourceStatus: mappedStatus,
      previousSourceStatus: existing?.mappedStatus,
      previousAmountMinor: existing?.amountMinor,
      amountMinor: baseRecord.amountMinor,
      reason: cpsLedgerExclusionReasonForStatus(mappedStatus)
    });
    const history = appendCpsOrderStateHistory({
      history: existing?.statusHistory,
      sourceStatus: mappedStatus,
      previousSourceStatus: existing?.mappedStatus,
      amountMinor: baseRecord.amountMinor,
      previousAmountMinor: existing?.amountMinor,
      ledgerAction: decision.ledgerAction,
      reason: decision.reason
    });
    const cpsInput = normalizeJutuikeOrderToCpsInput({
      order,
      userId: click.userId,
      categoryKey,
      ledgerExclusionReason: decision.reason,
      stateHistory: history
    });

    try {
      const bill = await this.accountingLedgerService.importCpsOrder(cpsInput);
      const ledgerSyncStatus =
        mappedStatus === CpsOrderStatus.Effective
          ? SupplyLedgerSyncStatus.Imported
          : mappedStatus === CpsOrderStatus.Refunded || mappedStatus === CpsOrderStatus.Cancelled
            ? SupplyLedgerSyncStatus.RolledBack
            : SupplyLedgerSyncStatus.Excluded;
      const reason =
        mappedStatus === CpsOrderStatus.Effective
          ? undefined
          : explainStatusExclusion(mappedStatus);
      return this.saveOrderSync(
        this.buildOrderRecord({
          ...baseRecord,
          existing,
          mappedStatus,
          ledgerSyncStatus,
          ledgerAction: decision.ledgerAction,
          ledgerBillId: bill.id,
          attributionFailureReason:
            mappedStatus === CpsOrderStatus.Effective
              ? existing
                ? SupplyAttributionFailureReason.DuplicateOrderUpdated
                : undefined
              : statusFailureReason(mappedStatus),
          exceptionType:
            mappedStatus === CpsOrderStatus.Effective
              ? undefined
              : SupplyOrderExceptionType.InvalidStatus,
          failureReason: reason,
          failureExplanation: reason,
          statusHistory: history
        })
      );
    } catch (error) {
      const reason =
        error instanceof Error
          ? error.message
          : explainSupplyAttributionFailure(SupplyAttributionFailureReason.LedgerImportFailed);
      return this.saveOrderSync(
        this.buildOrderRecord({
          ...baseRecord,
          existing,
          mappedStatus,
          ledgerSyncStatus: SupplyLedgerSyncStatus.Failed,
          ledgerAction: CpsLedgerImportAction.Failed,
          attributionFailureReason: SupplyAttributionFailureReason.LedgerImportFailed,
          exceptionType: SupplyOrderExceptionType.LedgerImportFailed,
          failureReason: reason,
          failureExplanation: explainSupplyAttributionFailure(
            SupplyAttributionFailureReason.LedgerImportFailed
          )
        })
      );
    }
  }

  private buildOrderRecord(
    input: Omit<SupplyOrderSyncRecord, "id" | "createdAt" | "updatedAt" | "statusHistory"> & {
      existing?: SupplyOrderSyncRecord | null;
      sidDigest?: string;
      statusHistory?: readonly CpsOrderStateHistoryEntry[];
    }
  ): Omit<SupplyOrderSyncRecord, "id" | "createdAt" | "updatedAt"> & { sidDigest?: string } {
    const history =
      input.statusHistory ??
      appendCpsOrderStateHistory({
        history: input.existing?.statusHistory,
        sourceStatus: input.mappedStatus,
        previousSourceStatus: input.existing?.mappedStatus,
        amountMinor: input.amountMinor,
        previousAmountMinor: input.existing?.amountMinor,
        ledgerAction: input.ledgerAction,
        reason: input.attributionFailureReason
      });
    return {
      sourceProvider: input.sourceProvider,
      sourceOrderId: input.sourceOrderId,
      sidDigest: input.sidDigest,
      sidMasked: input.sidMasked,
      actId: input.actId,
      brandId: input.brandId,
      sourceStatus: input.sourceStatus,
      mappedStatus: input.mappedStatus,
      amountMinor: input.amountMinor,
      paidAt: input.paidAt,
      matched: input.matched,
      matchedClickId: input.matchedClickId,
      matchedSupplyItemId: input.matchedSupplyItemId,
      ledgerSyncStatus: input.ledgerSyncStatus,
      ledgerAction: input.ledgerAction,
      ledgerBillId: input.ledgerBillId,
      attributionFailureReason: input.attributionFailureReason,
      exceptionType: input.exceptionType,
      failureReason: input.failureReason,
      failureExplanation: input.failureExplanation,
      statusHistory: history
    };
  }

  private evaluateAttribution(
    order: JutuikeUnifiedOrder,
    click: SupplyClickAttribution | null,
    paidAt?: string
  ):
    | {
        reason: SupplyAttributionFailureReason;
        exceptionType: SupplyOrderExceptionType;
        explanation: string;
      }
    | undefined {
    if (!order.sid) {
      return {
        reason: SupplyAttributionFailureReason.SidMissing,
        exceptionType: SupplyOrderExceptionType.NoAttribution,
        explanation: explainSupplyAttributionFailure(SupplyAttributionFailureReason.SidMissing)
      };
    }
    if (!click) {
      return {
        reason: SupplyAttributionFailureReason.SidNotFound,
        exceptionType: SupplyOrderExceptionType.NoAttribution,
        explanation: explainSupplyAttributionFailure(SupplyAttributionFailureReason.SidNotFound)
      };
    }
    if (paidAt && new Date(paidAt).getTime() > new Date(click.attributionWindowEndsAt).getTime()) {
      return {
        reason: SupplyAttributionFailureReason.SidExpired,
        exceptionType: SupplyOrderExceptionType.AttributionExpired,
        explanation: explainSupplyAttributionFailure(SupplyAttributionFailureReason.SidExpired)
      };
    }
    if (order.actId && click.jutuikeActId && order.actId !== click.jutuikeActId) {
      return {
        reason: SupplyAttributionFailureReason.ActivityMismatch,
        exceptionType: SupplyOrderExceptionType.ActivityMismatch,
        explanation: explainSupplyAttributionFailure(
          SupplyAttributionFailureReason.ActivityMismatch
        )
      };
    }
    return undefined;
  }

  private async transferJutuikeLink(
    item: SupplyItemConfig,
    sid: string
  ): Promise<SupplyJumpTarget> {
    const apiKey = this.configService.get<string>("JUTUIKE_API_KEY");
    const endpoint = this.configService.get<string>("JUTUIKE_TRANSFER_URL");
    if (!apiKey || !endpoint) {
      throw new Error("聚推客转链配置不可用");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    try {
      const form = new URLSearchParams({ apikey: apiKey, act_id: item.jutuikeActId, sid });
      const data = await this.postJutuikeForm(endpoint, form, controller.signal);
      const payload = readRecord(data, "data") ?? data;
      const miniappInfo = readRecord(payload, "we_app_info") ?? payload;
      const appId = readString(miniappInfo, ["app_id", "appId", "wx_appid"]);
      const path = readString(miniappInfo, ["page_path", "pagePath", "path"]);
      const url = readString(payload, ["h5", "url", "h5_url", "short_url", "long_h5"]);
      if (appId && path) {
        return { type: "miniapp", appId, path, fallbackUrl: url };
      }
      if (url) {
        return { type: "webview", url };
      }
      throw new Error("聚推客转链响应不可用");
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private buildFallbackTarget(item: SupplyItemConfig): SupplyJumpTarget | undefined {
    if (item.fallbackStrategy === SupplyFallbackStrategy.None) {
      return undefined;
    }
    if (item.fallbackMiniappAppId && item.fallbackMiniappPath) {
      return {
        type: "miniapp",
        appId: item.fallbackMiniappAppId,
        path: item.fallbackMiniappPath,
        fallbackUrl: item.fallbackUrl
      };
    }
    if (item.fallbackUrl) {
      return { type: "webview", url: item.fallbackUrl };
    }
    return undefined;
  }

  private async postJutuikeForm(
    endpoint: string,
    form: URLSearchParams,
    signal: AbortSignal
  ): Promise<Record<string, unknown>> {
    const proxyUrl =
      this.configService.get<string>("JUTUIKE_PROXY_URL") ||
      this.configService.get<string>("DEEPSEEK_PROXY_URL");

    if (proxyUrl) {
      return postFormJsonViaHttpProxy(endpoint, form, proxyUrl);
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form,
      signal
    });

    if (!response.ok) {
      throw new Error(`聚推客转链 HTTP ${response.status}`);
    }

    return (await response.json()) as Record<string, unknown>;
  }

  private async assertProfileCreated(userId: string): Promise<void> {
    const profile = await this.userGrowthProfileService.getProfile(userId);
    if (!profile.profileCreated) {
      throw new UnauthorizedException({
        errorCode: "profile_required",
        message: "请先创建隐者档案"
      });
    }
  }

  private async listAllItems(): Promise<SupplyItemConfig[]> {
    if (!this.isDatabaseConfigured()) {
      return [...this.memoryItems.values()].map(withSupplyItemDefaults).sort(compareItems);
    }

    const records = await this.supplyItem.findMany({
      orderBy: [{ sectionKey: "asc" }, { displayPriority: "desc" }, { sortOrder: "asc" }]
    });
    return (
      records.length > 0
        ? records.map((record) => this.recordToItem(record))
        : [...DEFAULT_SUPPLY_ITEMS]
    )
      .map(withSupplyItemDefaults)
      .sort(compareItems);
  }

  private async findItem(itemId: string): Promise<SupplyItemConfig | undefined> {
    if (!this.isDatabaseConfigured()) {
      return this.memoryItems.get(itemId);
    }
    const record = await this.supplyItem.findUnique({ where: { id: itemId } });
    return record
      ? this.recordToItem(record)
      : DEFAULT_SUPPLY_ITEMS.find((item) => item.id === itemId);
  }

  private createClickRecord(userId: string, item: SupplyItemConfig): SupplyClickAttribution {
    const nowDate = new Date();
    const now = nowDate.toISOString();
    const sid = this.createSid();
    assertSupplySidSafe(sid, [userId]);
    const transferExpiresAt = new Date(
      nowDate.getTime() + item.transferExpiresMinutes * 60 * 1000
    ).toISOString();
    const attributionWindowEndsAt = new Date(
      nowDate.getTime() + item.attributionWindowHours * 60 * 60 * 1000
    ).toISOString();
    return {
      id: `supply_click_${this.memoryClicks.size + 1}_${Date.now()}`,
      userId,
      supplyItemId: item.id,
      sectionKey: item.sectionKey,
      defaultCategoryKey: item.defaultCategoryKey,
      jutuikeActId: item.jutuikeActId,
      sid,
      sidDigest: this.digestSid(sid),
      sidMasked: maskSupplySid(sid),
      jumpStatus: SupplyClickJumpStatus.Created,
      clickedAt: now,
      updatedAt: now,
      transferExpiresAt,
      attributionWindowEndsAt
    };
  }

  private async saveClick(click: SupplyClickAttribution): Promise<SupplyClickAttribution> {
    if (!this.isDatabaseConfigured()) {
      this.memoryClicks.set(click.id, click);
      return click;
    }
    const record = await this.supplyClick.create({
      data: {
        userId: click.userId,
        supplyItemId: click.supplyItemId,
        sectionKey: click.sectionKey,
        defaultCategoryKey: click.defaultCategoryKey,
        jutuikeActId: click.jutuikeActId,
        sid: click.sid,
        sidDigest: click.sidDigest,
        sidMasked: click.sidMasked,
        jumpStatus: click.jumpStatus,
        transferExpiresAt: new Date(click.transferExpiresAt),
        attributionWindowEndsAt: new Date(click.attributionWindowEndsAt)
      }
    });
    return this.recordToClick(record);
  }

  private async updateClickJumpStatus(
    clickId: string,
    jumpStatus: SupplyClickJumpStatus,
    patch: {
      failureReason?: string;
      jumpTarget?: SupplyJumpTarget;
      jumpTargetExpiresAt?: string;
      fallbackAttributable?: boolean;
      reusedFromClickId?: string;
    } = {}
  ): Promise<SupplyClickAttribution> {
    if (!this.isDatabaseConfigured()) {
      const existing = this.memoryClicks.get(clickId);
      if (!existing) {
        throw new BadRequestException("补给点击不存在");
      }
      const next = {
        ...existing,
        ...patch,
        jumpStatus,
        updatedAt: new Date().toISOString()
      };
      this.memoryClicks.set(clickId, next);
      return next;
    }
    const record = await this.supplyClick.update({
      where: { id: clickId },
      data: {
        jumpStatus,
        failureReason: patch.failureReason,
        jumpTargetType: patch.jumpTarget?.type,
        jumpTargetExpiresAt: patch.jumpTargetExpiresAt ? new Date(patch.jumpTargetExpiresAt) : null,
        fallbackAttributable: patch.fallbackAttributable ?? false,
        reusedFromClickId: patch.reusedFromClickId
      }
    });
    const click = this.recordToClick(record);
    return {
      ...click,
      jumpTarget: patch.jumpTarget,
      jumpTargetExpiresAt: patch.jumpTargetExpiresAt,
      fallbackAttributable: patch.fallbackAttributable,
      reusedFromClickId: patch.reusedFromClickId
    };
  }

  private createTransferAttempt(
    click: SupplyClickAttribution,
    status: SupplyTransferAttemptStatus,
    patch: {
      jumpTarget?: SupplyJumpTarget;
      targetExpiresAt?: string;
      usedFallback?: boolean;
      fallbackAttributable?: boolean;
      failureReason?: string;
    } = {}
  ): SupplyTransferAttemptRecord {
    const now = new Date().toISOString();
    return {
      id: `supply_transfer_${this.memoryTransferAttempts.size + 1}_${Date.now()}`,
      clickId: click.id,
      supplyItemId: click.supplyItemId,
      sidMasked: click.sidMasked,
      status,
      targetType: patch.jumpTarget?.type,
      usedFallback: patch.usedFallback ?? false,
      fallbackAttributable: patch.fallbackAttributable ?? false,
      failureReason: patch.failureReason,
      targetExpiresAt: patch.targetExpiresAt,
      createdAt: now,
      updatedAt: now
    };
  }

  private async saveTransferAttempt(
    attempt: SupplyTransferAttemptRecord & { jumpTarget?: SupplyJumpTarget }
  ): Promise<SupplyTransferAttemptRecord> {
    if (!this.isDatabaseConfigured()) {
      this.memoryTransferAttempts.set(attempt.id, attempt);
      return attempt;
    }
    const click = await this.findClickById(attempt.clickId);
    const record = await this.supplyTransferAttempt.create({
      data: {
        clickId: attempt.clickId,
        supplyItemId: attempt.supplyItemId,
        sidDigest: click?.sidDigest,
        sidMasked: attempt.sidMasked,
        status: attempt.status,
        targetType: attempt.targetType,
        targetPayload: attempt.jumpTarget,
        usedFallback: attempt.usedFallback,
        fallbackAttributable: attempt.fallbackAttributable,
        failureReason: attempt.failureReason,
        targetExpiresAt: attempt.targetExpiresAt ? new Date(attempt.targetExpiresAt) : null
      }
    });
    return this.recordToTransferAttempt(record);
  }

  private async findReusableLinkedClick(
    userId: string,
    item: SupplyItemConfig
  ): Promise<SupplyClickAttribution | null> {
    const threshold = Date.now() - item.clickDedupeWindowSeconds * 1000;
    const candidates = this.isDatabaseConfigured()
      ? (
          await this.supplyClick.findMany({
            where: {
              userId,
              supplyItemId: item.id,
              clickedAt: { gte: new Date(threshold) }
            },
            orderBy: { clickedAt: "desc" },
            take: 5
          })
        ).map((record) => this.recordToClick(record))
      : [...this.memoryClicks.values()]
          .filter(
            (click) =>
              click.userId === userId &&
              click.supplyItemId === item.id &&
              new Date(click.clickedAt).getTime() >= threshold
          )
          .sort((a, b) => b.clickedAt.localeCompare(a.clickedAt));

    for (const click of candidates) {
      if (
        (click.jumpStatus === SupplyClickJumpStatus.Linked ||
          click.jumpStatus === SupplyClickJumpStatus.FallbackLinked) &&
        click.jumpTargetExpiresAt &&
        new Date(click.jumpTargetExpiresAt).getTime() > Date.now()
      ) {
        const attempt = (await this.listTransferAttemptsForClick(click.id)).find(
          (entry) => entry.status !== SupplyTransferAttemptStatus.Failed
        );
        if (click.jumpTarget || attempt?.targetType) {
          return click;
        }
      }
    }
    return null;
  }

  private async findClickBySidDigest(
    sidDigest: string,
    originalSid?: string
  ): Promise<SupplyClickAttribution | null> {
    if (!this.isDatabaseConfigured()) {
      return (
        [...this.memoryClicks.values()].find(
          (click) => click.sidDigest === sidDigest || click.sid === originalSid
        ) ?? null
      );
    }
    const record =
      (await this.supplyClick.findUnique({ where: { sidDigest } })) ??
      (originalSid ? await this.supplyClick.findUnique({ where: { sid: originalSid } }) : null);
    return record ? this.recordToClick(record) : null;
  }

  private async findClickById(clickId: string): Promise<SupplyClickAttribution | null> {
    if (!this.isDatabaseConfigured()) {
      return this.memoryClicks.get(clickId) ?? null;
    }
    const record = await this.supplyClick.findUnique({ where: { id: clickId } });
    return record ? this.recordToClick(record) : null;
  }

  private async listTransferAttemptsForClick(
    clickId: string
  ): Promise<SupplyTransferAttemptRecord[]> {
    if (!this.isDatabaseConfigured()) {
      return [...this.memoryTransferAttempts.values()]
        .filter((attempt) => attempt.clickId === clickId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return (
      await this.supplyTransferAttempt.findMany({
        where: { clickId },
        orderBy: { createdAt: "desc" }
      })
    ).map((record) => this.recordToTransferAttempt(record));
  }

  private async saveOrderSync(
    record: Omit<SupplyOrderSyncRecord, "id" | "createdAt" | "updatedAt"> & {
      sidDigest?: string;
    }
  ): Promise<SupplyOrderSyncRecord> {
    const now = new Date().toISOString();
    const key = `${record.sourceProvider}:${record.sourceOrderId}`;
    const publicRecord = { ...record };
    delete publicRecord.sidDigest;
    if (!this.isDatabaseConfigured()) {
      const existing = this.memoryOrders.get(key);
      const next: SupplyOrderSyncRecord = {
        ...publicRecord,
        id: existing?.id ?? `supply_order_${this.memoryOrders.size + 1}`,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      };
      this.memoryOrders.set(key, next);
      return next;
    }
    const saved = await this.supplyOrderSync.upsert({
      where: {
        sourceProvider_sourceOrderId: {
          sourceProvider: record.sourceProvider,
          sourceOrderId: record.sourceOrderId
        }
      },
      create: this.orderToPrismaData(record),
      update: this.orderToPrismaData(record)
    });
    return this.recordToOrder(saved);
  }

  private async findOrderSync(
    sourceProvider: CpsSourceProvider,
    sourceOrderId: string
  ): Promise<SupplyOrderSyncRecord | null> {
    if (!this.isDatabaseConfigured()) {
      return this.memoryOrders.get(`${sourceProvider}:${sourceOrderId}`) ?? null;
    }
    const record = await this.supplyOrderSync.findUnique({
      where: { sourceProvider_sourceOrderId: { sourceProvider, sourceOrderId } }
    });
    return record ? this.recordToOrder(record) : null;
  }

  private itemToPrismaData(item: SupplyItemConfig): Record<string, unknown> {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      sectionKey: item.sectionKey,
      coverImageUrl: item.coverImageUrl,
      actionText: item.actionText,
      sortOrder: item.sortOrder,
      status: item.status,
      validFrom: item.validFrom ? new Date(item.validFrom) : null,
      validUntil: item.validUntil ? new Date(item.validUntil) : null,
      defaultCategoryKey: item.defaultCategoryKey,
      jutuikeActId: item.jutuikeActId,
      jutuikeSourceName: "jutuike",
      internalNote: item.internalNote,
      groupKey: item.groupKey,
      userVisibleTags: [...item.userVisibleTags],
      displayPriority: item.displayPriority,
      recommendationTimeWindows: [...item.recommendationTimeWindows],
      displayWorkdayRule: item.displayWorkdayRule,
      attributionWindowHours: item.attributionWindowHours,
      transferExpiresMinutes: item.transferExpiresMinutes,
      clickDedupeWindowSeconds: item.clickDedupeWindowSeconds,
      fallbackStrategy: item.fallbackStrategy,
      fallbackTargetType: item.fallbackTargetType,
      fallbackUrl: item.fallbackUrl,
      fallbackMiniappAppId: item.fallbackMiniappAppId,
      fallbackMiniappPath: item.fallbackMiniappPath
    };
  }

  private orderToPrismaData(
    record: Omit<SupplyOrderSyncRecord, "id" | "createdAt" | "updatedAt"> & {
      sidDigest?: string;
    }
  ): Record<string, unknown> {
    return {
      sourceProvider: record.sourceProvider,
      sourceOrderId: record.sourceOrderId,
      sid: record.sidMasked,
      sidDigest: record.sidDigest,
      sidMasked: record.sidMasked,
      actId: record.actId,
      brandId: record.brandId,
      sourceStatus: record.sourceStatus,
      mappedStatus: record.mappedStatus,
      amountMinor: record.amountMinor,
      paidAt: record.paidAt ? new Date(record.paidAt) : null,
      matched: record.matched,
      matchedClickId: record.matchedClickId,
      matchedSupplyItemId: record.matchedSupplyItemId,
      ledgerSyncStatus: record.ledgerSyncStatus,
      ledgerAction: record.ledgerAction,
      ledgerBillId: record.ledgerBillId,
      attributionFailureReason: record.attributionFailureReason,
      exceptionType: record.exceptionType,
      failureReason: record.failureReason,
      failureExplanation: record.failureExplanation,
      statusHistory: [...record.statusHistory]
    };
  }

  private recordToItem(record: SupplyItemRecord): SupplyItemConfig {
    return withSupplyItemDefaults({
      id: record.id,
      title: record.title,
      description: record.description,
      sectionKey: record.sectionKey as SupplyItemConfig["sectionKey"],
      coverImageUrl: record.coverImageUrl ?? undefined,
      actionText: record.actionText,
      sortOrder: record.sortOrder,
      status: record.status as SupplyItemStatus,
      validFrom: record.validFrom?.toISOString(),
      validUntil: record.validUntil?.toISOString(),
      defaultCategoryKey: record.defaultCategoryKey as SupplyItemConfig["defaultCategoryKey"],
      jutuikeActId: record.jutuikeActId,
      jutuikeSourceName: "jutuike",
      internalNote: record.internalNote ?? undefined,
      groupKey: record.groupKey as SupplyItemConfig["groupKey"],
      userVisibleTags: arrayOfStrings(record.userVisibleTags),
      displayPriority: record.displayPriority,
      recommendationTimeWindows: arrayOfRecommendationWindows(record.recommendationTimeWindows),
      displayWorkdayRule: record.displayWorkdayRule as SupplyItemConfig["displayWorkdayRule"],
      attributionWindowHours: record.attributionWindowHours,
      transferExpiresMinutes: record.transferExpiresMinutes,
      clickDedupeWindowSeconds: record.clickDedupeWindowSeconds,
      fallbackStrategy: record.fallbackStrategy as SupplyItemConfig["fallbackStrategy"],
      fallbackTargetType: record.fallbackTargetType as SupplyItemConfig["fallbackTargetType"],
      fallbackUrl: record.fallbackUrl ?? undefined,
      fallbackMiniappAppId: record.fallbackMiniappAppId ?? undefined,
      fallbackMiniappPath: record.fallbackMiniappPath ?? undefined,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString()
    });
  }

  private recordToClick(record: SupplyClickRecord): SupplyClickAttribution {
    const sidDigest = record.sidDigest ?? this.digestSid(record.sid);
    return {
      id: record.id,
      userId: record.userId,
      supplyItemId: record.supplyItemId,
      sectionKey: record.sectionKey as SupplyClickAttribution["sectionKey"],
      defaultCategoryKey: record.defaultCategoryKey as SupplyClickAttribution["defaultCategoryKey"],
      jutuikeActId: record.jutuikeActId,
      sid: record.sid,
      sidDigest,
      sidMasked: record.sidMasked ?? maskSupplySid(record.sid),
      jumpStatus: record.jumpStatus as SupplyClickJumpStatus,
      clickedAt: record.clickedAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      transferExpiresAt: (record.transferExpiresAt ?? record.clickedAt).toISOString(),
      attributionWindowEndsAt: (record.attributionWindowEndsAt ?? record.clickedAt).toISOString(),
      jumpTargetExpiresAt: record.jumpTargetExpiresAt?.toISOString(),
      fallbackAttributable: record.fallbackAttributable,
      reusedFromClickId: record.reusedFromClickId ?? undefined,
      failureReason: record.failureReason ?? undefined
    };
  }

  private recordToTransferAttempt(
    record: SupplyTransferAttemptRecordDb
  ): SupplyTransferAttemptRecord {
    return {
      id: record.id,
      clickId: record.clickId,
      supplyItemId: record.supplyItemId,
      sidMasked: record.sidMasked,
      status: record.status as SupplyTransferAttemptStatus,
      targetType: record.targetType as SupplyJumpTarget["type"] | undefined,
      usedFallback: record.usedFallback,
      fallbackAttributable: record.fallbackAttributable,
      failureReason: record.failureReason ?? undefined,
      targetExpiresAt: record.targetExpiresAt?.toISOString(),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString()
    };
  }

  private recordToOrder(record: SupplyOrderSyncRecordDb): SupplyOrderSyncRecord {
    return {
      id: record.id,
      sourceProvider: (record.sourceProvider as CpsSourceProvider) || CpsSourceProvider.Jutuike,
      sourceOrderId: record.sourceOrderId,
      sidMasked: record.sidMasked ?? (record.sid ? maskSupplySid(record.sid) : undefined),
      actId: record.actId ?? undefined,
      brandId: record.brandId ?? undefined,
      sourceStatus: record.sourceStatus,
      mappedStatus: normalizeCpsOrderStatus(record.mappedStatus),
      amountMinor: record.amountMinor,
      paidAt: record.paidAt?.toISOString(),
      matched: record.matched,
      matchedClickId: record.matchedClickId ?? undefined,
      matchedSupplyItemId: record.matchedSupplyItemId ?? undefined,
      ledgerSyncStatus: record.ledgerSyncStatus as SupplyLedgerSyncStatus,
      ledgerAction: record.ledgerAction as CpsLedgerImportAction,
      ledgerBillId: record.ledgerBillId ?? undefined,
      attributionFailureReason:
        (record.attributionFailureReason as SupplyAttributionFailureReason | null) ?? undefined,
      exceptionType: (record.exceptionType as SupplyOrderExceptionType | null) ?? undefined,
      failureReason: record.failureReason ?? undefined,
      failureExplanation: record.failureExplanation ?? undefined,
      statusHistory: arrayOfStateHistory(record.statusHistory),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString()
    };
  }

  private toClickResponse(click: SupplyClickAttribution, message: string): SupplyClickResponse {
    const attributionReliable =
      click.jumpStatus === SupplyClickJumpStatus.Linked ||
      click.jumpStatus === SupplyClickJumpStatus.Reused ||
      click.fallbackAttributable === true;
    return {
      clickId: click.id,
      sidMasked: click.sidMasked,
      jumpStatus: click.jumpStatus,
      jumpTarget: click.jumpTarget,
      jumpTargetExpiresAt: click.jumpTargetExpiresAt,
      attributionReliable,
      ledgerHint: attributionReliable
        ? "订单同步成功后才会自动进入生存账本。"
        : "本次备用通道不承诺订单自动进入生存账本。",
      message
    };
  }

  private createSid(): string {
    return `sid_${randomBytes(18).toString("base64url")}`;
  }

  private digestSid(sid: string): string {
    return createHash("sha256").update(sid).digest("hex");
  }

  private isDatabaseConfigured(): boolean {
    return (
      typeof this.prisma.isDatabaseConfigured !== "function" || this.prisma.isDatabaseConfigured()
    );
  }

  private get supplyItem() {
    return (
      this.prisma as unknown as {
        supplyItem: {
          findMany(input?: unknown): Promise<SupplyItemRecord[]>;
          findUnique(input: { where: { id: string } }): Promise<SupplyItemRecord | null>;
          upsert(input: unknown): Promise<SupplyItemRecord>;
        };
      }
    ).supplyItem;
  }

  private get supplyClick() {
    return (
      this.prisma as unknown as {
        supplyClick: {
          create(input: unknown): Promise<SupplyClickRecord>;
          findUnique(input: {
            where: { id?: string; sid?: string; sidDigest?: string };
          }): Promise<SupplyClickRecord | null>;
          findMany(input?: unknown): Promise<SupplyClickRecord[]>;
          update(input: unknown): Promise<SupplyClickRecord>;
        };
      }
    ).supplyClick;
  }

  private get supplyTransferAttempt() {
    return (
      this.prisma as unknown as {
        supplyTransferAttempt: {
          create(input: unknown): Promise<SupplyTransferAttemptRecordDb>;
          findMany(input?: unknown): Promise<SupplyTransferAttemptRecordDb[]>;
        };
      }
    ).supplyTransferAttempt;
  }

  private get supplyOrderSync() {
    return (
      this.prisma as unknown as {
        supplyOrderSync: {
          upsert(input: unknown): Promise<SupplyOrderSyncRecordDb>;
          findUnique(input: {
            where: {
              sourceProvider_sourceOrderId: { sourceProvider: string; sourceOrderId: string };
            };
          }): Promise<SupplyOrderSyncRecordDb | null>;
          findMany(input?: unknown): Promise<SupplyOrderSyncRecordDb[]>;
        };
      }
    ).supplyOrderSync;
  }
}

function readString(data: Record<string, unknown>, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    if (typeof data[key] === "string" && data[key]) {
      return data[key];
    }
  }
  return undefined;
}

function readRecord(
  data: Record<string, unknown>,
  key: string
): Record<string, unknown> | undefined {
  const value = data[key];
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function postFormJsonViaHttpProxy(
  endpoint: string,
  form: URLSearchParams,
  proxyUrl: string
): Promise<Record<string, unknown>> {
  const proxy = new URL(proxyUrl);
  const target = new URL(endpoint);
  const body = form.toString();

  return new Promise((resolve, reject) => {
    const request = httpRequest(
      {
        hostname: proxy.hostname,
        port: proxy.port ? Number(proxy.port) : 80,
        method: "POST",
        path: endpoint,
        headers: {
          host: target.host,
          "content-type": "application/x-www-form-urlencoded",
          "content-length": Buffer.byteLength(body)
        },
        timeout: 5000
      },
      (response) => {
        let raw = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          raw += chunk;
        });
        response.on("end", () => {
          if ((response.statusCode ?? 500) < 200 || (response.statusCode ?? 500) >= 300) {
            reject(new Error(`聚推客代理转链 HTTP ${response.statusCode}`));
            return;
          }

          try {
            resolve(JSON.parse(raw) as Record<string, unknown>);
          } catch {
            reject(new Error("聚推客代理转链响应不是 JSON"));
          }
        });
      }
    );

    request.on("timeout", () => {
      request.destroy(new Error("聚推客代理转链超时"));
    });
    request.on("error", reject);
    request.write(body);
    request.end();
  });
}

function compareItems(
  first: SupplyItemConfig | PublicSupplyItem,
  second: SupplyItemConfig | PublicSupplyItem
): number {
  return first.sortOrder - second.sortOrder || first.id.localeCompare(second.id);
}

function arrayOfStrings(value: unknown): readonly string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function arrayOfRecommendationWindows(
  value: unknown
): SupplyItemConfig["recommendationTimeWindows"] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is { slot: string; startTime: string; endTime: string } =>
      Boolean(
        item &&
        typeof item === "object" &&
        typeof (item as { slot?: unknown }).slot === "string" &&
        typeof (item as { startTime?: unknown }).startTime === "string" &&
        typeof (item as { endTime?: unknown }).endTime === "string"
      )
    )
    .map((item) => ({
      slot: normalizeRecommendationSlot(item.slot),
      startTime: item.startTime,
      endTime: item.endTime
    }));
}

function arrayOfStateHistory(value: unknown): CpsOrderStateHistoryEntry[] {
  return Array.isArray(value) ? (value as CpsOrderStateHistoryEntry[]) : [];
}

function normalizeRecommendationSlot(value: string): SupplyRecommendationSlot {
  return (Object.values(SupplyRecommendationSlot) as string[]).includes(value)
    ? (value as SupplyRecommendationSlot)
    : SupplyRecommendationSlot.Anytime;
}

function normalizeCpsOrderStatus(value: string): CpsOrderStatus {
  return (Object.values(CpsOrderStatus) as string[]).includes(value)
    ? (value as CpsOrderStatus)
    : CpsOrderStatus.Unknown;
}

function normalizePayPriceToMinor(value: number | string): number {
  const amount = typeof value === "number" ? value : Number(value);
  return Math.round(amount * 100);
}

function normalizePayTimeSafe(value: string): string | undefined {
  const maybeNumeric = Number(value);
  const date =
    Number.isFinite(maybeNumeric) && /^\d{10,13}$/.test(value)
      ? new Date(value.length === 10 ? maybeNumeric * 1000 : maybeNumeric)
      : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function statusFailureReason(status: CpsOrderStatus): SupplyAttributionFailureReason | undefined {
  if (status === CpsOrderStatus.Unpaid || status === CpsOrderStatus.Pending) {
    return SupplyAttributionFailureReason.OrderUnpaid;
  }
  if (status === CpsOrderStatus.Effective) {
    return undefined;
  }
  return SupplyAttributionFailureReason.OrderStatusInvalid;
}

function explainStatusExclusion(status: CpsOrderStatus): string | undefined {
  const reason = statusFailureReason(status);
  return reason ? explainSupplyAttributionFailure(reason) : undefined;
}

function withinDateRange(value: string | undefined, query: AdminSupplyMetricsQuery): boolean {
  if (!value) {
    return true;
  }
  const businessDate = value.slice(0, 10);
  return (
    (!query.startDate || businessDate >= query.startDate) &&
    (!query.endDate || businessDate <= query.endDate)
  );
}

function sumOrders(orders: readonly Pick<SupplyOrderSyncRecord, "amountMinor">[]): number {
  return orders.reduce((sum, order) => sum + order.amountMinor, 0);
}

function countBy(values: readonly string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((result, value) => {
    result[value] = (result[value] ?? 0) + 1;
    return result;
  }, {});
}
