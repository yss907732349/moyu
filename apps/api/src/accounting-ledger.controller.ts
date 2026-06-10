import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req
} from "@nestjs/common";
import {
  AccountingLedgerValidationError,
  type ImportCpsSurvivalOrderRequest,
  type ListSurvivalLedgerBillsRequest
} from "@moyuxia/shared";
import { AccountingLedgerService } from "./accounting-ledger.service";
import { CurrentUserContextService } from "./current-user.context";

@Controller("me/accounting-ledger")
export class AccountingLedgerController {
  constructor(
    private readonly currentUserContext: CurrentUserContextService,
    private readonly accountingLedgerService: AccountingLedgerService
  ) {}

  @Get("today-summary")
  getTodaySummary(
    @Req() request: { headers: { authorization?: string } },
    @Query("businessDate") businessDate?: string
  ) {
    return this.wrapValidation(() =>
      this.accountingLedgerService.getTodaySummaryForUser(
        this.currentUserContext.getCurrentUser(request).userId,
        businessDate
      )
    );
  }

  @Get("bills")
  listBills(
    @Req() request: { headers: { authorization?: string } },
    @Query() query: ListSurvivalLedgerBillsRequest
  ) {
    return this.wrapValidation(() =>
      this.accountingLedgerService.listForUser(
        this.currentUserContext.getCurrentUser(request).userId,
        {
          startDate: query.startDate,
          endDate: query.endDate,
          categoryKey: query.categoryKey
        }
      )
    );
  }

  @Get("bills/:billId")
  async getBill(
    @Req() request: { headers: { authorization?: string } },
    @Param("billId") billId: string
  ) {
    return {
      bill: await this.accountingLedgerService.getBillForUser(
        this.currentUserContext.getCurrentUser(request).userId,
        billId
      )
    };
  }

  @Get("weekly-report")
  getWeeklyReport(
    @Req() request: { headers: { authorization?: string } },
    @Query("businessDate") businessDate?: string
  ) {
    return this.wrapValidation(() =>
      this.accountingLedgerService.getWeeklyReportForUser(
        this.currentUserContext.getCurrentUser(request).userId,
        businessDate
      )
    );
  }

  @Post("cps-orders")
  async importCpsOrder(
    @Req() request: { headers: { authorization?: string } },
    @Body() body: Omit<ImportCpsSurvivalOrderRequest, "userId">
  ) {
    return this.wrapValidation(async () => ({
      bill: await this.accountingLedgerService.importCpsOrder({
        ...body,
        userId: this.currentUserContext.getCurrentUser(request).userId
      })
    }));
  }

  @Post("bills")
  createManualBillDisabled(): never {
    throw new BadRequestException({
      errorCode: "manual_accounting_disabled",
      message: "第一版账本已改为 CPS 生存账单，不支持手动记一笔。"
    });
  }

  private async wrapValidation<T>(handler: () => Promise<T>): Promise<T> {
    try {
      return await handler();
    } catch (error) {
      if (error instanceof AccountingLedgerValidationError) {
        throw new BadRequestException({
          errorCode: "accounting_ledger_validation_error",
          message: "生存账本校验失败",
          issues: error.issues
        });
      }

      throw error;
    }
  }
}
