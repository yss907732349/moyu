import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Post,
  Put,
  Query,
  Req
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  WorldIntelArticleStatus,
  type AdminWorldIntelArticleInput,
  type AdminWorldIntelBatchCreateRequest
} from "@moyuxia/shared";
import { WorldIntelContentService } from "./world-intel-content.service";
import { CurrentUserContextService } from "./current-user.context";

interface RequestLike {
  headers: {
    authorization?: string;
  };
}

@Controller("world-intel")
export class WorldIntelContentController {
  constructor(
    private readonly currentUserContext: CurrentUserContextService,
    private readonly worldIntelContentService: WorldIntelContentService
  ) {}

  @Get("articles")
  listArticles(@Query("page") page?: string, @Query("pageSize") pageSize?: string) {
    return this.worldIntelContentService.listPublicArticles({ page, pageSize });
  }

  @Get("articles/:articleId")
  getArticle(@Req() request: RequestLike, @Param("articleId") articleId: string) {
    let viewerUserId: string | undefined;
    try {
      viewerUserId = this.currentUserContext.getCurrentUser(request).userId;
    } catch {
      viewerUserId = undefined;
    }
    return this.worldIntelContentService.getPublicArticle(articleId, viewerUserId);
  }

  @Post("articles/:articleId/like")
  likeArticle(@Req() request: RequestLike, @Param("articleId") articleId: string) {
    return this.worldIntelContentService.setArticleLike(
      this.currentUserContext.getCurrentUser(request).userId,
      articleId,
      true
    );
  }

  @Delete("articles/:articleId/like")
  unlikeArticle(@Req() request: RequestLike, @Param("articleId") articleId: string) {
    return this.worldIntelContentService.setArticleLike(
      this.currentUserContext.getCurrentUser(request).userId,
      articleId,
      false
    );
  }

  @Post("articles/:articleId/comments")
  createComment(
    @Req() request: RequestLike,
    @Param("articleId") articleId: string,
    @Body("body") body: string
  ) {
    return this.worldIntelContentService.createArticleComment(
      this.currentUserContext.getCurrentUser(request).userId,
      articleId,
      body
    );
  }

  @Post("articles/:articleId/quote")
  createQuote(@Req() request: RequestLike, @Param("articleId") articleId: string) {
    this.currentUserContext.getCurrentUser(request);
    return this.worldIntelContentService.createQuoteSnapshot(articleId);
  }
}

@Controller("admin/world-intel")
export class WorldIntelAdminController {
  constructor(
    private readonly configService: ConfigService,
    private readonly worldIntelContentService: WorldIntelContentService
  ) {}

  @Get("articles")
  listArticles(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Query("status") status?: string,
    @Query("keyword") keyword?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string
  ) {
    this.assertAdmin(adminToken);
    return this.worldIntelContentService.listAdminArticles({ status, keyword, page, pageSize });
  }

  @Get("articles/:articleId")
  getArticle(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Param("articleId") articleId: string
  ) {
    this.assertAdmin(adminToken);
    return this.worldIntelContentService.getAdminArticle(articleId);
  }

  @Post("articles")
  createArticle(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Body() body: AdminWorldIntelArticleInput
  ) {
    this.assertAdmin(adminToken);
    return this.worldIntelContentService.createAdminArticle(body);
  }

  @Post("articles/batch")
  batchCreateArticles(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Body() body: AdminWorldIntelBatchCreateRequest
  ) {
    this.assertAdmin(adminToken);
    return this.worldIntelContentService.batchCreateAdminArticles(body);
  }

  @Put("articles/:articleId")
  updateArticle(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Param("articleId") articleId: string,
    @Body() body: AdminWorldIntelArticleInput
  ) {
    this.assertAdmin(adminToken);
    return this.worldIntelContentService.updateAdminArticle(articleId, body);
  }

  @Post("articles/:articleId/publish")
  publishArticle(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Param("articleId") articleId: string
  ) {
    this.assertAdmin(adminToken);
    return this.worldIntelContentService.transitionAdminArticle(
      articleId,
      WorldIntelArticleStatus.Published
    );
  }

  @Post("articles/:articleId/offline")
  offlineArticle(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Param("articleId") articleId: string
  ) {
    this.assertAdmin(adminToken);
    return this.worldIntelContentService.transitionAdminArticle(
      articleId,
      WorldIntelArticleStatus.Offline
    );
  }

  @Post("articles/:articleId/hide")
  hideArticle(
    @Headers("x-admin-token") adminToken: string | undefined,
    @Param("articleId") articleId: string
  ) {
    this.assertAdmin(adminToken);
    return this.worldIntelContentService.transitionAdminArticle(
      articleId,
      WorldIntelArticleStatus.Hidden
    );
  }

  private assertAdmin(adminToken?: string): void {
    const expectedToken =
      this.configService.get<string>("ADMIN_OPERATIONS_TOKEN") || "dev-admin-token";

    if (adminToken !== expectedToken) {
      throw new ForbiddenException({
        errorCode: "admin_unauthorized",
        message: "无权操作大陆新闻后台"
      });
    }
  }
}
