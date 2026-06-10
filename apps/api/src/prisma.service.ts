import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  isDatabaseConfigured(): boolean {
    return Boolean(process.env.DATABASE_URL);
  }

  async onModuleInit(): Promise<void> {
    if (!this.isDatabaseConfigured()) {
      this.logger.warn("DATABASE_URL 未配置，API 将使用开发期内存工作档案存储。");
      return;
    }

    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.isDatabaseConfigured()) {
      return;
    }

    await this.$disconnect();
  }
}
