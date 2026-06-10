import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, timingSafeEqual } from "node:crypto";

export interface AppAuthPayload {
  userId: string;
  source: "app-token";
}

@Injectable()
export class AppAuthService {
  constructor(private readonly configService: ConfigService) {}

  sign(userId: string): { token: string; expiresAt: string } {
    const expiresAtMs = Date.now() + this.getTtlSeconds() * 1000;
    const payload = toBase64Url(JSON.stringify({ userId, exp: expiresAtMs }));
    const signature = this.signPayload(payload);
    return {
      token: `${payload}.${signature}`,
      expiresAt: new Date(expiresAtMs).toISOString()
    };
  }

  verify(token: string | undefined): AppAuthPayload | null {
    if (!token) {
      return null;
    }

    const [payload, signature] = token.split(".");

    if (!payload || !signature || !this.isValidSignature(payload, signature)) {
      return null;
    }

    try {
      const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
        userId?: unknown;
        exp?: unknown;
      };

      if (typeof parsed.userId !== "string" || typeof parsed.exp !== "number") {
        return null;
      }

      if (Date.now() >= parsed.exp) {
        return null;
      }

      return { userId: parsed.userId, source: "app-token" };
    } catch {
      return null;
    }
  }

  assert(token: string | undefined): AppAuthPayload {
    const payload = this.verify(token);

    if (!payload) {
      throw new UnauthorizedException({
        errorCode: "unauthenticated",
        message: "请先登录"
      });
    }

    return payload;
  }

  private signPayload(payload: string): string {
    return createHmac("sha256", this.getSecret()).update(payload).digest("base64url");
  }

  private isValidSignature(payload: string, signature: string): boolean {
    const expected = this.signPayload(payload);
    const expectedBuffer = Buffer.from(expected);
    const actualBuffer = Buffer.from(signature);

    return (
      expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer)
    );
  }

  private getSecret(): string {
    return (
      this.configService.get<string>("APP_AUTH_TOKEN_SECRET") ||
      "moyuxia-local-development-token-secret"
    );
  }

  private getTtlSeconds(): number {
    const configured = Number(this.configService.get<string>("APP_AUTH_TOKEN_TTL_SECONDS"));
    return Number.isFinite(configured) && configured > 0 ? configured : 60 * 60 * 24 * 30;
  }
}

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}
