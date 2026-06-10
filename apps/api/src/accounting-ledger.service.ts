import { Injectable, NotFoundException } from "@nestjs/common";
import {
  CpsOrderStatus,
  CurrencyCode,
  calculateSurvivalLedgerTodaySummary,
  calculateSurvivalLedgerWeeklyReport,
  classifyCpsSurvivalOrder,
  getBusinessDateForAccounting,
  isCpsOrderStatus,
  isSurvivalLedgerCategoryKey,
  toSurvivalLedgerDisplayStatus,
  validateCpsSurvivalOrderSource,
  validateListSurvivalLedgerBillsRequest,
  type CpsOrderStatus as CpsOrderStatusValue,
  type CpsSourceProvider,
  type ImportCpsSurvivalOrderRequest,
  type ListSurvivalLedgerBillsRequest,
  type ListSurvivalLedgerBillsResponse,
  type SurvivalLedgerBillSnapshot,
  type SurvivalLedgerCategoryKey,
  type SurvivalLedgerTodaySummaryResponse,
  type SurvivalLedgerWeeklyReportResponse
} from "@moyuxia/shared";
import { PrismaService } from "./prisma.service";

interface SurvivalLedgerBillRecord {
  id: string;
  userId: string;
  sourceProvider: string;
  sourceOrderId: string;
  sourceStatus: string;
  amountMinor: number;
  currency: string;
  categoryKey: string;
  displayTitle: string;
  occurredAt: Date;
  occurredOn: string;
  displayStatus: string;
  countsTowardConsumption: boolean;
  displayStatusReason: string | null;
  stateHistory: unknown;
  ledgerStateReason: string | null;
  productTitle: string | null;
  productCategory: string | null;
  merchantTags: unknown;
  commuteDistanceMeters: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SurvivalLedgerBillDelegate {
  upsert(input: {
    where: { sourceProvider_sourceOrderId: { sourceProvider: string; sourceOrderId: string } };
    create: Record<string, unknown>;
    update: Record<string, unknown>;
  }): Promise<SurvivalLedgerBillRecord>;
  findMany(input: {
    where: Record<string, unknown>;
    orderBy?: unknown;
  }): Promise<SurvivalLedgerBillRecord[]>;
  findFirst(input: {
    where: { id: string; userId: string };
  }): Promise<SurvivalLedgerBillRecord | null>;
}

@Injectable()
export class AccountingLedgerService {
  private readonly memoryBills = new Map<string, SurvivalLedgerBillSnapshot>();
  private readonly sourceIndex = new Map<string, string>();

  constructor(private readonly prisma: PrismaService) {}

  async importCpsOrder(
    request: ImportCpsSurvivalOrderRequest
  ): Promise<SurvivalLedgerBillSnapshot> {
    validateCpsSurvivalOrderSource(request);
    const now = new Date().toISOString();
    const categoryKey = classifyCpsSurvivalOrder(request);
    const occurredAt = new Date(request.occurredAt);
    const occurredOn = getBusinessDateForAccounting(occurredAt);
    const displayStatus = toSurvivalLedgerDisplayStatus(request.sourceStatus);
    const countsTowardConsumption = request.sourceStatus === CpsOrderStatus.Effective;
    const displayTitle = buildDisplayTitle(categoryKey);
    const displayStatusReason = buildDisplayStatusReason(request.sourceStatus);

    if (!this.isDatabaseConfigured()) {
      const sourceKey = createSourceKey(request.sourceProvider, request.sourceOrderId);
      const existingId = this.sourceIndex.get(sourceKey);
      const id = existingId ?? `survival_bill_${this.memoryBills.size + 1}`;
      const existing = existingId ? this.memoryBills.get(existingId) : undefined;
      const bill: SurvivalLedgerBillSnapshot = {
        id,
        userId: request.userId,
        amountMinor: request.amountMinor,
        currency: request.currency ?? CurrencyCode.CNY,
        categoryKey,
        displayTitle,
        occurredAt: request.occurredAt,
        occurredOn,
        orderStatus: request.sourceStatus,
        displayStatus,
        countsTowardConsumption,
        displayStatusReason,
        commuteDistanceMeters: request.commuteDistanceMeters ?? null,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      };
      this.sourceIndex.set(sourceKey, id);
      this.memoryBills.set(id, bill);
      return bill;
    }

    const record = await this.survivalLedgerBill.upsert({
      where: {
        sourceProvider_sourceOrderId: {
          sourceProvider: request.sourceProvider,
          sourceOrderId: request.sourceOrderId
        }
      },
      create: {
        userId: request.userId,
        sourceProvider: request.sourceProvider,
        sourceOrderId: request.sourceOrderId,
        sourceStatus: request.sourceStatus,
        amountMinor: request.amountMinor,
        currency: request.currency ?? CurrencyCode.CNY,
        categoryKey,
        displayTitle,
        occurredAt,
        occurredOn,
        displayStatus,
        countsTowardConsumption,
        displayStatusReason,
        stateHistory: request.stateHistory ? [...request.stateHistory] : undefined,
        ledgerStateReason: request.ledgerExclusionReason,
        productTitle: request.productTitle,
        productCategory: request.productCategory,
        merchantTags: request.merchantTags ? [...request.merchantTags] : undefined,
        commuteDistanceMeters: request.commuteDistanceMeters ?? null
      },
      update: {
        userId: request.userId,
        sourceStatus: request.sourceStatus,
        amountMinor: request.amountMinor,
        currency: request.currency ?? CurrencyCode.CNY,
        categoryKey,
        displayTitle,
        occurredAt,
        occurredOn,
        displayStatus,
        countsTowardConsumption,
        displayStatusReason,
        stateHistory: request.stateHistory ? [...request.stateHistory] : undefined,
        ledgerStateReason: request.ledgerExclusionReason,
        productTitle: request.productTitle,
        productCategory: request.productCategory,
        merchantTags: request.merchantTags ? [...request.merchantTags] : undefined,
        commuteDistanceMeters: request.commuteDistanceMeters ?? null
      }
    });

    return this.recordToBill(record);
  }

  async listForUser(
    userId: string,
    request: ListSurvivalLedgerBillsRequest
  ): Promise<ListSurvivalLedgerBillsResponse> {
    validateListSurvivalLedgerBillsRequest(request);

    if (!this.isDatabaseConfigured()) {
      return { bills: this.filterBills([...this.memoryBills.values()], userId, request) };
    }

    const records = await this.survivalLedgerBill.findMany({
      where: {
        userId,
        ...(request.categoryKey ? { categoryKey: request.categoryKey } : {}),
        ...(request.startDate || request.endDate
          ? {
              occurredOn: {
                ...(request.startDate ? { gte: request.startDate } : {}),
                ...(request.endDate ? { lte: request.endDate } : {})
              }
            }
          : {})
      },
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }]
    });

    return { bills: records.map((record) => this.recordToBill(record)) };
  }

  async getTodaySummaryForUser(
    userId: string,
    businessDate = getBusinessDateForAccounting(new Date())
  ): Promise<SurvivalLedgerTodaySummaryResponse> {
    const bills = (
      await this.listForUser(userId, { startDate: businessDate, endDate: businessDate })
    ).bills;
    return calculateSurvivalLedgerTodaySummary({ bills, businessDate });
  }

  async getWeeklyReportForUser(
    userId: string,
    businessDate = getBusinessDateForAccounting(new Date())
  ): Promise<SurvivalLedgerWeeklyReportResponse> {
    const { weekStartDate, weekEndDate } = getWeekRange(businessDate);
    const bills = (
      await this.listForUser(userId, { startDate: weekStartDate, endDate: weekEndDate })
    ).bills;
    return calculateSurvivalLedgerWeeklyReport({ bills, businessDate });
  }

  async getBillForUser(userId: string, billId: string): Promise<SurvivalLedgerBillSnapshot> {
    if (!this.isDatabaseConfigured()) {
      const bill = this.memoryBills.get(billId);

      if (!bill || bill.userId !== userId) {
        throw new NotFoundException({
          errorCode: "survival_ledger_bill_not_found",
          message: "生存账单不存在或无权访问"
        });
      }

      return bill;
    }

    const record = await this.survivalLedgerBill.findFirst({ where: { id: billId, userId } });

    if (!record) {
      throw new NotFoundException({
        errorCode: "survival_ledger_bill_not_found",
        message: "生存账单不存在或无权访问"
      });
    }

    return this.recordToBill(record);
  }

  private filterBills(
    bills: readonly SurvivalLedgerBillSnapshot[],
    userId: string,
    request: ListSurvivalLedgerBillsRequest
  ): SurvivalLedgerBillSnapshot[] {
    return bills
      .filter((bill) => bill.userId === userId)
      .filter((bill) => !request.categoryKey || bill.categoryKey === request.categoryKey)
      .filter((bill) => !request.startDate || bill.occurredOn >= request.startDate)
      .filter((bill) => !request.endDate || bill.occurredOn <= request.endDate)
      .sort((first, second) => second.occurredAt.localeCompare(first.occurredAt));
  }

  private recordToBill(record: SurvivalLedgerBillRecord): SurvivalLedgerBillSnapshot {
    const orderStatus = isCpsOrderStatus(record.sourceStatus)
      ? record.sourceStatus
      : ("invalid" as CpsOrderStatusValue);
    const categoryKey = isSurvivalLedgerCategoryKey(record.categoryKey)
      ? record.categoryKey
      : ("canteen" as SurvivalLedgerCategoryKey);

    return {
      id: record.id,
      userId: record.userId,
      amountMinor: record.amountMinor,
      currency: CurrencyCode.CNY,
      categoryKey,
      displayTitle: record.displayTitle,
      occurredAt: record.occurredAt.toISOString(),
      occurredOn: record.occurredOn,
      orderStatus,
      displayStatus: toSurvivalLedgerDisplayStatus(orderStatus),
      countsTowardConsumption: record.countsTowardConsumption,
      displayStatusReason: record.displayStatusReason ?? buildDisplayStatusReason(orderStatus),
      commuteDistanceMeters: record.commuteDistanceMeters,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString()
    };
  }

  private isDatabaseConfigured(): boolean {
    if (typeof this.prisma.isDatabaseConfigured !== "function") {
      return true;
    }

    return this.prisma.isDatabaseConfigured();
  }

  private get survivalLedgerBill(): SurvivalLedgerBillDelegate {
    return (this.prisma as unknown as { survivalLedgerBill: SurvivalLedgerBillDelegate })
      .survivalLedgerBill;
  }
}

function createSourceKey(sourceProvider: CpsSourceProvider, sourceOrderId: string): string {
  return `${sourceProvider}:${sourceOrderId}`;
}

function buildDisplayTitle(categoryKey: SurvivalLedgerCategoryKey): string {
  if (categoryKey === "commute") {
    return "影遁通勤";
  }

  if (categoryKey === "afternoon_boost") {
    return "下午续命补给";
  }

  return "午间补给";
}

function buildDisplayStatusReason(status: CpsOrderStatusValue): string {
  if (status === CpsOrderStatus.Effective) {
    return "订单同步后已自动收纳";
  }
  if (status === CpsOrderStatus.Pending || status === CpsOrderStatus.Unpaid) {
    return "订单仍在确认中，暂未计入";
  }
  if (status === CpsOrderStatus.Refunded || status === CpsOrderStatus.Cancelled) {
    return "补给已失效，未计入生存消耗";
  }
  return "该补给未计入生存消耗";
}

function getWeekRange(businessDate: string): { weekStartDate: string; weekEndDate: string } {
  const date = new Date(`${businessDate}T00:00:00+08:00`);
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = new Date(date);
  start.setDate(date.getDate() + mondayOffset);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    weekStartDate: toDateString(start),
    weekEndDate: toDateString(end)
  };
}

function toDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}
