import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppAuthService } from "./app-auth.service";

export interface CurrentUserContext {
  userId: string;
  source: "app-token" | "temporary-dev-placeholder";
}

interface RequestLike {
  headers: {
    authorization?: string;
  };
}

const DEFAULT_TEMP_USER_ID = "dev-temp-user";

@Injectable()
export class CurrentUserContextService {
  constructor(
    private readonly configService: ConfigService,
    private readonly appAuthService: AppAuthService
  ) {}

  getCurrentUser(request?: RequestLike): CurrentUserContext {
    const tokenUser = this.appAuthService.verify(extractBearerToken(request));

    if (tokenUser) {
      return tokenUser;
    }

    if (!this.isTemporaryFallbackAllowed()) {
      throw new UnauthorizedException({
        errorCode: "unauthenticated",
        message: "请先登录"
      });
    }

    return {
      userId: this.configService.get<string>("TEMP_CURRENT_USER_ID") || DEFAULT_TEMP_USER_ID,
      source: "temporary-dev-placeholder"
    };
  }

  private isTemporaryFallbackAllowed(): boolean {
    return (
      this.configService.get<string>("ALLOW_TEMP_CURRENT_USER_FALLBACK") === "true" ||
      this.configService.get<string>("NODE_ENV") !== "production"
    );
  }
}

function extractBearerToken(request?: RequestLike): string | undefined {
  const authorization = request?.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return undefined;
  }

  return authorization.slice("Bearer ".length);
}
