import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { type NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>("API_PORT", 3000);
  const host = configService.get<string>("API_HOST", "0.0.0.0");
  const allowedOrigins = (
    configService.get<string>("ADMIN_CORS_ORIGINS") ?? "http://localhost:5173,http://127.0.0.1:5173"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.useBodyParser("json", { limit: "20mb" });
  app.enableCors({
    origin: allowedOrigins,
    allowedHeaders: ["Content-Type", "Authorization", "x-admin-token"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  });

  await app.listen(port, host);
}

void bootstrap();
