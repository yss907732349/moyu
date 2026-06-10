import { Controller, ForbiddenException, Get, Headers, Param, Query, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type {
  AdminOperationsRealtimeEvent,
  AdminOperationsReviewQueueQuery
} from "@moyuxia/shared";
import { AdminOperationsService } from "./admin-operations.service";

interface AdminOperationsEventStreamResponse {
  setHeader(name: string, value: string): void;
  status?(statusCode: number): AdminOperationsEventStreamResponse;
  flushHeaders?(): void;
  write(chunk: string): void;
  end(): void;
  on(event: "close", listener: () => void): void;
}

@Controller("admin/operations")
export class AdminOperationsController {
  constructor(
    private readonly configService: ConfigService,
    private readonly adminOperationsService: AdminOperationsService
  ) {}

  @Get("workbench")
  getWorkbench(@Headers("x-admin-token") adminToken: string | undefined) {
    this.assertAdmin(adminToken);
    return this.adminOperationsService.getWorkbench();
  }

  @Get("todo-summary")
  getTodoSummary(@Headers("x-admin-token") adminToken: string | undefined) {
    this.assertAdmin(adminToken);
    return this.adminOperationsService.getTodoSummary();
  }

  @Get("events")
  async streamEvents(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Res() response: AdminOperationsEventStreamResponse
  ) {
    this.assertAdmin(adminToken);

    response.status?.(200);
    response.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    response.setHeader("Cache-Control", "no-cache, no-transform");
    response.setHeader("Connection", "keep-alive");
    response.setHeader("X-Accel-Buffering", "no");
    response.flushHeaders?.();

    const writeEvent = (event: AdminOperationsRealtimeEvent) => {
      response.write(`id: ${event.eventId}\n`);
      response.write(`event: ${event.eventType}\n`);
      response.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    const unsubscribe = this.adminOperationsService.subscribeRealtimeEvents(writeEvent);
    const heartbeat = setInterval(() => {
      response.write(": heartbeat\n\n");
    }, 25000);

    response.on("close", () => {
      clearInterval(heartbeat);
      unsubscribe();
    });

    writeEvent(await this.adminOperationsService.createSnapshotEvent());
  }

  @Get("review-queue")
  getReviewQueue(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Query() query: AdminOperationsReviewQueueQuery
  ) {
    this.assertAdmin(adminToken);
    return this.adminOperationsService.getReviewQueue(query);
  }

  @Get("review-queue/:itemId")
  getReviewDetail(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Param("itemId") itemId: string
  ) {
    this.assertAdmin(adminToken);
    return this.adminOperationsService.getReviewDetail(itemId);
  }

  private assertAdmin(adminToken?: string): void {
    const expectedToken =
      this.configService.get<string>("ADMIN_OPERATIONS_TOKEN") || "dev-admin-token";

    if (adminToken !== expectedToken) {
      throw new ForbiddenException({
        errorCode: "admin_unauthorized",
        message: "无权访问后台运营中心"
      });
    }
  }
}
