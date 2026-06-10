import {
  COMMUNITY_PUBLIC_RESPONSE_SENSITIVE_FIELD_BLACKLIST,
  CommunityCommentStatus,
  CommunityFollowState,
  CommunityLiteErrorCode,
  CommunityPostStatus,
  CommunityPhoneVerificationStatus,
  CommunityPublishNextAction,
  CommunityReportTargetType,
  CommunitySectionKey,
  isCommunitySectionKey,
  type AcceptCommunityPrivacyConsentRequest,
  type AcceptCommunityPrivacyConsentResponse,
  type CommunityComment,
  type CommunityInteractionResponse,
  type CommunityMyPostSummary,
  type CommunityNotification,
  type CommunityPostDetail,
  type CommunityPostSummary,
  type CommunityFollowActionResponse,
  type CommunityPublishEligibilityResponse,
  type CommunityPublicPostListItem,
  type CommunityPublicUserListItem,
  type CreateCommunityReplyResponse,
  type CreateCommunityCommentResponse,
  type CreateCommunityPostRequest,
  type CreateCommunityPostResponse,
  type CreateCommunityReportRequest,
  type CreateCommunityReportResponse,
  type GetCommunityPostResponse,
  type GetCommunityPublicProfilePageResponse,
  type GetCommunityPublicUserProfileResponse,
  type GetMyCommunityFollowStatsResponse,
  type ListCommunityPublicUsersRequest,
  type ListCommunityPublicUsersResponse,
  type ListCommunityMessagesResponse,
  type ListMyCommunityPostsResponse,
  type ListCommunityPostsRequest,
  type ListCommunityPostsResponse,
  type MarkCommunityNotificationReadResponse,
  type UploadCommunityMediaAssetResponse,
  type VerifyWechatPhoneNumberRequest,
  type VerifyWechatPhoneNumberResponse
} from "@moyuxia/shared";
import { getMiniappApiBaseUrl, MINIAPP_API_TIMEOUT_MS } from "./api-config.ts";
import { getAuthHeaders } from "./auth";
import { cacheApiImageForDisplay } from "./image-cache";

const apiBaseUrl = getMiniappApiBaseUrl();

type PostWithMediaAssets = {
  mediaAssets: CommunityPostSummary["mediaAssets"];
};

interface CommunityRequestOptions {
  request?: typeof uni.request;
}

type CommunityReportInput =
  | string
  | Pick<CreateCommunityReportRequest, "reason" | "reasonCode" | "reasonText">;

export class CommunityLiteClientError extends Error {
  readonly errorCode?: string;
  readonly fieldErrors: Record<string, string>;

  constructor(message: string, errorCode?: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "CommunityLiteClientError";
    this.errorCode = errorCode;
    this.fieldErrors = fieldErrors;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const publicSensitiveFieldSet = new Set<string>([
  ...COMMUNITY_PUBLIC_RESPONSE_SENSITIVE_FIELD_BLACKLIST
]);

function hasPublicSensitiveFields(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => hasPublicSensitiveFields(item));
  }

  if (!isRecord(value)) {
    return false;
  }

  return Object.entries(value).some(
    ([key, child]) => publicSensitiveFieldSet.has(key) || hasPublicSensitiveFields(child)
  );
}

export function isCommunityPostSummary(
  value: unknown,
  options: { allowAuthorPending?: boolean } = {}
): value is CommunityPostSummary {
  const record = isRecord(value) ? value : undefined;
  const status = record?.status;
  const visiblePostStatus =
    status === CommunityPostStatus.Approved ||
    (options.allowAuthorPending === true &&
      status === CommunityPostStatus.Pending &&
      record?.visibleToAuthorOnly === true);

  return (
    record !== undefined &&
    typeof record.id === "string" &&
    typeof record.title === "string" &&
    typeof record.excerpt === "string" &&
    isRecord(record.author) &&
    typeof record.author.displayName === "string" &&
    !("monthlyAmount" in record.author) &&
    !("workStartTime" in record.author) &&
    !("openid" in record.author) &&
    isCommunitySectionKey(String(record.sectionKey)) &&
    visiblePostStatus &&
    Array.isArray(record.mediaAssets) &&
    Array.isArray(record.imageKeys) &&
    isRecord(record.stats) &&
    Number.isInteger(record.stats.likeCount) &&
    Number.isInteger(record.stats.commentCount) &&
    Number.isInteger(record.stats.favoriteCount)
  );
}

export function isCommunityMyPostSummary(value: unknown): value is CommunityMyPostSummary {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.excerpt === "string" &&
    isRecord(value.author) &&
    typeof value.author.displayName === "string" &&
    isCommunitySectionKey(String(value.sectionKey)) &&
    typeof value.status === "string" &&
    Array.isArray(value.mediaAssets) &&
    Array.isArray(value.imageKeys) &&
    isRecord(value.stats)
  );
}

export function isCommunityComment(value: unknown): value is CommunityComment {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.postId === "string" &&
    typeof value.body === "string" &&
    isRecord(value.author) &&
    isCommunityVisibleCommentStatus(value.status) &&
    (value.visibleToAuthorOnly === undefined || value.visibleToAuthorOnly === true) &&
    Array.isArray(value.replies) &&
    value.replies.every(isCommunityCommentReply)
  );
}

function isCommunityCommentReply(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.postId === "string" &&
    typeof value.commentId === "string" &&
    typeof value.body === "string" &&
    isRecord(value.author) &&
    isCommunityVisibleCommentStatus(value.status) &&
    (value.visibleToAuthorOnly === undefined || value.visibleToAuthorOnly === true)
  );
}

function isCommunityVisibleCommentStatus(value: unknown): boolean {
  return value === CommunityCommentStatus.Approved || value === CommunityCommentStatus.Pending;
}

export function isListCommunityPostsResponse(value: unknown): value is ListCommunityPostsResponse {
  return (
    isRecord(value) &&
    isCommunitySectionKey(String(value.sectionKey)) &&
    Array.isArray(value.posts) &&
    value.posts.every((post) => isCommunityPostSummary(post))
  );
}

export function isGetCommunityPostResponse(value: unknown): value is GetCommunityPostResponse {
  return (
    isRecord(value) &&
    isCommunityPostSummary(value.post, { allowAuthorPending: true }) &&
    typeof (value.post as CommunityPostDetail).body === "string" &&
    Array.isArray(value.comments) &&
    value.comments.every(isCommunityComment)
  );
}

function isCommunityMessage(value: unknown): value is CommunityNotification {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.type === "string" &&
    typeof value.targetType === "string" &&
    typeof value.targetId === "string" &&
    typeof value.title === "string" &&
    typeof value.body === "string" &&
    typeof value.createdAt === "string"
  );
}

function isListMyCommunityPostsResponse(value: unknown): value is ListMyCommunityPostsResponse {
  return (
    isRecord(value) && Array.isArray(value.posts) && value.posts.every(isCommunityMyPostSummary)
  );
}

function isListCommunityMessagesResponse(value: unknown): value is ListCommunityMessagesResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.messages) &&
    value.messages.every(isCommunityMessage) &&
    Number.isInteger(value.unreadCount)
  );
}

function isCreateCommunityPostResponse(value: unknown): value is CreateCommunityPostResponse {
  return (
    isRecord(value) &&
    typeof value.postId === "string" &&
    (
      [
        CommunityPostStatus.Pending,
        CommunityPostStatus.Approved,
        CommunityPostStatus.Rejected
      ] as readonly string[]
    ).includes(String(value.status)) &&
    typeof value.message === "string"
  );
}

function isCreateCommunityCommentResponse(value: unknown): value is CreateCommunityCommentResponse {
  return (
    isRecord(value) &&
    typeof value.commentId === "string" &&
    (
      [
        CommunityCommentStatus.Pending,
        CommunityCommentStatus.Approved,
        CommunityCommentStatus.Rejected
      ] as readonly string[]
    ).includes(String(value.status)) &&
    typeof value.message === "string"
  );
}

function isCreateCommunityReplyResponse(value: unknown): value is CreateCommunityReplyResponse {
  return (
    isRecord(value) &&
    typeof value.replyId === "string" &&
    (
      [
        CommunityCommentStatus.Pending,
        CommunityCommentStatus.Approved,
        CommunityCommentStatus.Rejected
      ] as readonly string[]
    ).includes(String(value.status)) &&
    typeof value.message === "string"
  );
}

function isCreateCommunityReportResponse(value: unknown): value is CreateCommunityReportResponse {
  return (
    isRecord(value) &&
    typeof value.reportId === "string" &&
    value.accepted === true &&
    typeof value.message === "string"
  );
}

function isUploadCommunityMediaAssetResponse(
  value: unknown
): value is UploadCommunityMediaAssetResponse {
  return (
    isRecord(value) &&
    isRecord(value.asset) &&
    typeof value.asset.id === "string" &&
    typeof value.asset.url === "string"
  );
}

function isMarkNotificationReadResponse(
  value: unknown
): value is MarkCommunityNotificationReadResponse {
  return isRecord(value) && value.accepted === true && Number.isInteger(value.unreadCount);
}

function isCommunityPublishEligibilityResponse(
  value: unknown
): value is CommunityPublishEligibilityResponse {
  return (
    isRecord(value) &&
    typeof value.privacyPolicyVersion === "string" &&
    typeof value.communityAgreementVersion === "string" &&
    typeof value.profileCreated === "boolean" &&
    typeof value.privacyConsentSatisfied === "boolean" &&
    typeof value.phoneVerified === "boolean" &&
    (value.phoneVerificationStatus === CommunityPhoneVerificationStatus.Verified ||
      value.phoneVerificationStatus === CommunityPhoneVerificationStatus.Unverified) &&
    typeof value.canPublish === "boolean" &&
    Object.values(CommunityPublishNextAction).includes(
      value.nextAction as CommunityPublishNextAction
    ) &&
    Array.isArray(value.unmetRequirements) &&
    typeof value.message === "string"
  );
}

function isAcceptPrivacyConsentResponse(
  value: unknown
): value is AcceptCommunityPrivacyConsentResponse {
  return (
    isRecord(value) &&
    value.accepted === true &&
    typeof value.acceptedAt === "string" &&
    isCommunityPublishEligibilityResponse(value.eligibility)
  );
}

function isVerifyWechatPhoneNumberResponse(
  value: unknown
): value is VerifyWechatPhoneNumberResponse {
  return (
    isRecord(value) &&
    value.verified === true &&
    typeof value.verifiedAt === "string" &&
    isCommunityPublishEligibilityResponse(value.eligibility)
  );
}

function isGetCommunityPublicUserProfileResponse(
  value: unknown
): value is GetCommunityPublicUserProfileResponse {
  return (
    isRecord(value) &&
    !hasPublicSensitiveFields(value) &&
    isRecord(value.profile) &&
    typeof value.profile.userId === "string" &&
    isRecord(value.profile.author) &&
    typeof value.profile.author.displayName === "string"
  );
}

function isCommunityFollowState(value: unknown): value is CommunityFollowState {
  return Object.values(CommunityFollowState).includes(value as CommunityFollowState);
}

function isCommunityPublicIdentity(value: unknown): boolean {
  return (
    isRecord(value) &&
    !hasPublicSensitiveFields(value) &&
    typeof value.publicProfileId === "string" &&
    typeof value.displayName === "string" &&
    typeof value.avatarKey === "string" &&
    typeof value.faction === "string" &&
    typeof value.factionLabel === "string" &&
    Number.isInteger(value.level) &&
    typeof value.titleKey === "string" &&
    typeof value.titleLabel === "string"
  );
}

function isCommunityFollowStats(value: unknown): boolean {
  return (
    isRecord(value) &&
    Number.isInteger(value.followingCount) &&
    Number.isInteger(value.followerCount) &&
    Number.isInteger(value.publicPostCount)
  );
}

function isCommunityPublicPostListItem(value: unknown): value is CommunityPublicPostListItem {
  return (
    isRecord(value) &&
    !hasPublicSensitiveFields(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.excerpt === "string" &&
    typeof value.sectionKey === "string" &&
    typeof value.sectionLabel === "string" &&
    Array.isArray(value.mediaAssets) &&
    Array.isArray(value.imageKeys) &&
    isRecord(value.stats) &&
    !("authorUserId" in value)
  );
}

function isGetCommunityPublicProfilePageResponse(
  value: unknown
): value is GetCommunityPublicProfilePageResponse {
  return (
    isRecord(value) &&
    !hasPublicSensitiveFields(value) &&
    isRecord(value.profile) &&
    typeof value.profile.publicProfileId === "string" &&
    isCommunityPublicIdentity(value.profile.identity) &&
    isCommunityFollowStats(value.profile.stats) &&
    isCommunityFollowState(value.profile.viewerFollowState) &&
    Array.isArray(value.profile.posts) &&
    value.profile.posts.every(isCommunityPublicPostListItem)
  );
}

function isCommunityFollowActionResponse(value: unknown): value is CommunityFollowActionResponse {
  return (
    isRecord(value) &&
    !hasPublicSensitiveFields(value) &&
    typeof value.publicProfileId === "string" &&
    isCommunityFollowState(value.viewerFollowState) &&
    isCommunityFollowStats(value.stats)
  );
}

function isCommunityPublicUserListItem(value: unknown): value is CommunityPublicUserListItem {
  return (
    isCommunityPublicIdentity(value) &&
    isRecord(value) &&
    isCommunityFollowState(value.viewerFollowState)
  );
}

function isListCommunityPublicUsersResponse(
  value: unknown
): value is ListCommunityPublicUsersResponse {
  return (
    isRecord(value) &&
    !hasPublicSensitiveFields(value) &&
    typeof value.publicProfileId === "string" &&
    (value.listType === "following" || value.listType === "followers") &&
    Array.isArray(value.items) &&
    value.items.every(isCommunityPublicUserListItem)
  );
}

function isGetMyCommunityFollowStatsResponse(
  value: unknown
): value is GetMyCommunityFollowStatsResponse {
  return (
    isRecord(value) &&
    !hasPublicSensitiveFields(value) &&
    (value.publicProfileId === undefined || typeof value.publicProfileId === "string") &&
    isCommunityFollowStats(value.stats)
  );
}

function requestJson(
  path: string,
  method: "GET" | "POST" | "DELETE",
  body: unknown,
  request: typeof uni.request
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    request({
      url: `${apiBaseUrl}${path}`,
      method,
      data: body as UniApp.RequestOptions["data"],
      header: getAuthHeaders(),
      timeout: MINIAPP_API_TIMEOUT_MS,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
          return;
        }

        const data = isRecord(res.data) ? res.data : {};
        const serverMessage = typeof data.message === "string" ? data.message : "";
        const fieldErrors = normalizeFieldErrors(data.issues);
        const issueMessage = Object.values(fieldErrors).join("；");
        const notFoundMessage =
          res.statusCode === 404 &&
          path.startsWith("/community/") &&
          typeof data.errorCode !== "string"
            ? "社区接口未部署或后端服务未重启"
            : "";
        const phoneVerificationMessage =
          path === "/community/me/phone-verification" && res.statusCode === 400
            ? `${serverMessage || "手机号验证失败"}。请重新点击微信手机号验证；本地调试请确认后端已开启手机号验证 mock。`
            : "";
        reject(
          new CommunityLiteClientError(
            phoneVerificationMessage ||
              notFoundMessage ||
              issueMessage ||
              serverMessage ||
              `社区接口返回 ${res.statusCode}`,
            typeof data.errorCode === "string" ? data.errorCode : undefined,
            fieldErrors
          )
        );
      },
      fail: () => reject(new CommunityLiteClientError("网络异常，请稍后重试"))
    });
  });
}

function normalizeFieldErrors(issues: unknown): Record<string, string> {
  if (!Array.isArray(issues)) {
    return {};
  }

  const fieldErrors: Record<string, string> = {};

  for (const issue of issues) {
    if (isRecord(issue) && typeof issue.field === "string" && typeof issue.message === "string") {
      fieldErrors[issue.field] = issue.message;
    }
  }

  return fieldErrors;
}

export async function listCommunityPosts(
  requestBody: ListCommunityPostsRequest = {},
  options: CommunityRequestOptions = {}
): Promise<ListCommunityPostsResponse> {
  const query = buildQuery({
    sectionKey: requestBody.sectionKey ?? CommunitySectionKey.Recommended,
    sort: requestBody.sort,
    cursor: requestBody.cursor,
    limit: requestBody.limit ? String(requestBody.limit) : undefined
  });
  const data = await requestJson(
    `/community/posts${query ? `?${query}` : ""}`,
    "GET",
    undefined,
    options.request ?? uni.request
  );

  if (!isListCommunityPostsResponse(data)) {
    throw new CommunityLiteClientError("社区列表响应结构异常");
  }

  return { ...data, posts: await Promise.all(data.posts.map(preparePostMediaAssetUrls)) };
}

export async function getCommunityPost(
  postId: string,
  options: CommunityRequestOptions = {}
): Promise<GetCommunityPostResponse> {
  const data = await requestJson(
    `/community/posts/${encodeURIComponent(postId)}`,
    "GET",
    undefined,
    options.request ?? uni.request
  );

  if (!isGetCommunityPostResponse(data)) {
    throw new CommunityLiteClientError("帖子详情响应结构异常");
  }

  return {
    ...data,
    post: await preparePostMediaAssetUrls(data.post)
  };
}

export async function listMyCommunityPosts(
  options: CommunityRequestOptions = {}
): Promise<ListMyCommunityPostsResponse> {
  const data = await requestJson(
    "/community/me/posts",
    "GET",
    undefined,
    options.request ?? uni.request
  );

  if (!isListMyCommunityPostsResponse(data)) {
    throw new CommunityLiteClientError("我的帖子响应结构异常");
  }

  return {
    ...data,
    posts: await Promise.all(data.posts.map(preparePostMediaAssetUrls)),
    favorites: data.favorites
      ? await Promise.all(data.favorites.map(preparePostMediaAssetUrls))
      : undefined
  };
}

export async function listCommunityMessages(
  options: CommunityRequestOptions = {}
): Promise<ListCommunityMessagesResponse> {
  const data = await requestJson(
    "/community/me/messages",
    "GET",
    undefined,
    options.request ?? uni.request
  );

  if (!isListCommunityMessagesResponse(data)) {
    throw new CommunityLiteClientError("社区消息响应结构异常");
  }

  return data;
}

export async function getCommunityPublishEligibility(
  options: CommunityRequestOptions = {}
): Promise<CommunityPublishEligibilityResponse> {
  const data = await requestJson(
    "/community/me/publish-eligibility",
    "GET",
    undefined,
    options.request ?? uni.request
  );

  if (!isCommunityPublishEligibilityResponse(data)) {
    throw new CommunityLiteClientError("发布资格响应结构异常");
  }

  return data;
}

export async function acceptCommunityPrivacyConsent(
  requestBody: AcceptCommunityPrivacyConsentRequest = {},
  options: CommunityRequestOptions = {}
): Promise<AcceptCommunityPrivacyConsentResponse> {
  const data = await requestJson(
    "/community/me/privacy-consent",
    "POST",
    requestBody,
    options.request ?? uni.request
  );

  if (!isAcceptPrivacyConsentResponse(data)) {
    throw new CommunityLiteClientError("隐私同意响应结构异常");
  }

  return data;
}

export async function verifyWechatPhoneNumber(
  requestBody: VerifyWechatPhoneNumberRequest,
  options: CommunityRequestOptions = {}
): Promise<VerifyWechatPhoneNumberResponse> {
  const data = await requestJson(
    "/community/me/phone-verification",
    "POST",
    requestBody,
    options.request ?? uni.request
  );

  if (!isVerifyWechatPhoneNumberResponse(data)) {
    throw new CommunityLiteClientError("手机号验证响应结构异常");
  }

  return data;
}

export async function getCommunityPublicUserProfile(
  userId: string,
  options: CommunityRequestOptions = {}
): Promise<GetCommunityPublicUserProfileResponse> {
  const data = await requestJson(
    `/community/users/${encodeURIComponent(userId)}/profile`,
    "GET",
    undefined,
    options.request ?? uni.request
  );

  if (!isGetCommunityPublicUserProfileResponse(data)) {
    throw new CommunityLiteClientError("公开主页响应结构异常");
  }

  return data;
}

export async function getCommunityPublicProfilePage(
  publicProfileId: string,
  requestBody: ListCommunityPublicUsersRequest = {},
  options: CommunityRequestOptions = {}
): Promise<GetCommunityPublicProfilePageResponse> {
  const query = buildQuery({
    cursor: requestBody.cursor,
    limit: requestBody.limit ? String(requestBody.limit) : undefined
  });
  const data = await requestJson(
    `/community/profiles/${encodeURIComponent(publicProfileId)}${query ? `?${query}` : ""}`,
    "GET",
    undefined,
    options.request ?? uni.request
  );

  if (!isGetCommunityPublicProfilePageResponse(data)) {
    throw new CommunityLiteClientError("公开主页响应结构异常");
  }

  return {
    ...data,
    profile: {
      ...data.profile,
      posts: await Promise.all(data.profile.posts.map(preparePublicProfilePostMediaAssetUrls))
    }
  };
}

export async function followCommunityPublicProfile(
  publicProfileId: string,
  options: CommunityRequestOptions = {}
): Promise<CommunityFollowActionResponse> {
  const data = await requestJson(
    `/community/profiles/${encodeURIComponent(publicProfileId)}/follow`,
    "POST",
    {},
    options.request ?? uni.request
  );

  if (!isCommunityFollowActionResponse(data)) {
    throw new CommunityLiteClientError("关注响应结构异常");
  }

  return data;
}

export async function unfollowCommunityPublicProfile(
  publicProfileId: string,
  options: CommunityRequestOptions = {}
): Promise<CommunityFollowActionResponse> {
  const data = await requestJson(
    `/community/profiles/${encodeURIComponent(publicProfileId)}/follow`,
    "DELETE",
    undefined,
    options.request ?? uni.request
  );

  if (!isCommunityFollowActionResponse(data)) {
    throw new CommunityLiteClientError("取消关注响应结构异常");
  }

  return data;
}

export async function listCommunityProfileFollowing(
  publicProfileId: string,
  requestBody: ListCommunityPublicUsersRequest = {},
  options: CommunityRequestOptions = {}
): Promise<ListCommunityPublicUsersResponse> {
  return listCommunityProfileUsers(publicProfileId, "following", requestBody, options);
}

export async function listCommunityProfileFollowers(
  publicProfileId: string,
  requestBody: ListCommunityPublicUsersRequest = {},
  options: CommunityRequestOptions = {}
): Promise<ListCommunityPublicUsersResponse> {
  return listCommunityProfileUsers(publicProfileId, "followers", requestBody, options);
}

export async function getMyCommunityFollowStats(
  options: CommunityRequestOptions = {}
): Promise<GetMyCommunityFollowStatsResponse> {
  const data = await requestJson(
    "/community/me/follow-stats",
    "GET",
    undefined,
    options.request ?? uni.request
  );

  if (!isGetMyCommunityFollowStatsResponse(data)) {
    throw new CommunityLiteClientError("关注统计响应结构异常");
  }

  return data;
}

async function listCommunityProfileUsers(
  publicProfileId: string,
  listType: "following" | "followers",
  requestBody: ListCommunityPublicUsersRequest,
  options: CommunityRequestOptions
): Promise<ListCommunityPublicUsersResponse> {
  const query = buildQuery({
    cursor: requestBody.cursor,
    limit: requestBody.limit ? String(requestBody.limit) : undefined
  });
  const data = await requestJson(
    `/community/profiles/${encodeURIComponent(publicProfileId)}/${listType}${
      query ? `?${query}` : ""
    }`,
    "GET",
    undefined,
    options.request ?? uni.request
  );

  if (!isListCommunityPublicUsersResponse(data)) {
    throw new CommunityLiteClientError("关注列表响应结构异常");
  }

  return data;
}

export async function createCommunityPost(
  requestBody: CreateCommunityPostRequest,
  options: CommunityRequestOptions = {}
): Promise<CreateCommunityPostResponse> {
  const data = await requestJson(
    "/community/posts",
    "POST",
    requestBody,
    options.request ?? uni.request
  );

  if (!isCreateCommunityPostResponse(data)) {
    throw new CommunityLiteClientError("发帖响应结构异常");
  }

  return data;
}

export async function uploadCommunityMediaAsset(
  fileUrl: string,
  metadata: { fileName?: string; mimeType?: string; fileSizeBytes?: number } = {},
  options: CommunityRequestOptions = {}
): Promise<UploadCommunityMediaAssetResponse> {
  const dataUrl = await readLocalFileAsDataUrl(fileUrl, metadata.mimeType);
  if (!dataUrl) {
    throw new CommunityLiteClientError("图片读取失败，请重新选择后上传");
  }
  const data = await requestJson(
    "/community/media-assets",
    "POST",
    { fileUrl, dataUrl, ...metadata },
    options.request ?? uni.request
  );

  if (!isUploadCommunityMediaAssetResponse(data)) {
    throw new CommunityLiteClientError("图片上传响应结构异常");
  }

  return data;
}

function readLocalFileAsDataUrl(
  filePath: string,
  mimeType = "image/jpeg"
): Promise<string | undefined> {
  return new Promise((resolve) => {
    const fileSystem = uni.getFileSystemManager?.();
    if (!fileSystem) {
      resolve(undefined);
      return;
    }

    fileSystem.readFile({
      filePath,
      encoding: "base64",
      success: (res) => {
        const base64 = typeof res.data === "string" ? res.data : "";
        resolve(base64 ? `data:${mimeType};base64,${base64}` : undefined);
      },
      fail: () => resolve(undefined)
    });
  });
}

function normalizePostMediaAssetUrls<T extends PostWithMediaAssets>(post: T): T {
  return {
    ...post,
    mediaAssets: post.mediaAssets.map((asset) => ({
      ...asset,
      url: resolveCommunityPublicAssetUrl(asset.url),
      thumbnailUrl: asset.thumbnailUrl
        ? resolveCommunityPublicAssetUrl(asset.thumbnailUrl)
        : undefined
    }))
  };
}

async function preparePostMediaAssetUrls<T extends PostWithMediaAssets>(post: T): Promise<T> {
  const normalized = normalizePostMediaAssetUrls(post);
  return {
    ...normalized,
    mediaAssets: await Promise.all(
      normalized.mediaAssets.map(async (asset) => ({
        ...asset,
        url: await cacheApiImageForDisplay(asset.url),
        thumbnailUrl: asset.thumbnailUrl
          ? await cacheApiImageForDisplay(asset.thumbnailUrl)
          : undefined
      }))
    )
  };
}

async function preparePublicProfilePostMediaAssetUrls(
  post: CommunityPublicPostListItem
): Promise<CommunityPublicPostListItem> {
  return preparePostMediaAssetUrls(post);
}

export function resolveCommunityPublicAssetUrl(url: string, cacheKey?: string): string {
  if (/^(https?:|data:|blob:|wxfile:)/.test(url)) {
    return appendCommunityAssetCacheKey(url, cacheKey);
  }
  const resolved = url.startsWith("/community/") ? `${apiBaseUrl}${url}` : url;
  return appendCommunityAssetCacheKey(resolved, cacheKey);
}

function appendCommunityAssetCacheKey(url: string, cacheKey?: string): string {
  if (!cacheKey || !/^https?:/.test(url) || !url.includes("/community/media-assets/files/")) {
    return url;
  }

  return `${url}${url.includes("?") ? "&" : "?"}v=${encodeURIComponent(cacheKey)}`;
}

export async function createCommunityComment(
  postId: string,
  body: string,
  options: CommunityRequestOptions = {}
): Promise<CreateCommunityCommentResponse> {
  const data = await requestJson(
    `/community/posts/${encodeURIComponent(postId)}/comments`,
    "POST",
    { body },
    options.request ?? uni.request
  );

  if (!isCreateCommunityCommentResponse(data)) {
    throw new CommunityLiteClientError("评论响应结构异常");
  }

  return data;
}

export async function createCommunityReply(
  commentId: string,
  body: string,
  options: CommunityRequestOptions = {}
): Promise<CreateCommunityReplyResponse> {
  const data = await requestJson(
    `/community/comments/${encodeURIComponent(commentId)}/replies`,
    "POST",
    { body },
    options.request ?? uni.request
  );

  if (!isCreateCommunityReplyResponse(data)) {
    throw new CommunityLiteClientError("回复响应结构异常");
  }

  return data;
}

export async function setCommunityPostLike(
  postId: string,
  liked: boolean,
  options: CommunityRequestOptions = {}
): Promise<CommunityInteractionResponse> {
  return requestInteraction(postId, liked ? "POST" : "DELETE", "like", options);
}

export async function setCommunityPostFavorite(
  postId: string,
  favorited: boolean,
  options: CommunityRequestOptions = {}
): Promise<CommunityInteractionResponse> {
  return requestInteraction(postId, favorited ? "POST" : "DELETE", "favorite", options);
}

export async function reportCommunityPost(
  postId: string,
  report: CommunityReportInput,
  options: CommunityRequestOptions = {}
): Promise<CreateCommunityReportResponse> {
  return requestReport(`/community/posts/${encodeURIComponent(postId)}/reports`, report, options);
}

export async function reportCommunityComment(
  commentId: string,
  report: CommunityReportInput,
  options: CommunityRequestOptions = {}
): Promise<CreateCommunityReportResponse> {
  return requestReport(
    `/community/comments/${encodeURIComponent(commentId)}/reports`,
    report,
    options
  );
}

export async function reportCommunityReply(
  replyId: string,
  report: CommunityReportInput,
  options: CommunityRequestOptions = {}
): Promise<CreateCommunityReportResponse> {
  return requestReport(
    `/community/replies/${encodeURIComponent(replyId)}/reports`,
    report,
    options
  );
}

export async function markCommunityMessageRead(
  notificationId: string,
  options: CommunityRequestOptions = {}
): Promise<MarkCommunityNotificationReadResponse> {
  const data = await requestJson(
    `/community/me/messages/${encodeURIComponent(notificationId)}/read`,
    "POST",
    {},
    options.request ?? uni.request
  );

  if (!isMarkNotificationReadResponse(data)) {
    throw new CommunityLiteClientError("消息已读响应结构异常");
  }

  return data;
}

export async function markAllCommunityMessagesRead(
  options: CommunityRequestOptions = {}
): Promise<MarkCommunityNotificationReadResponse> {
  const data = await requestJson(
    "/community/me/messages/read-all",
    "POST",
    {},
    options.request ?? uni.request
  );

  if (!isMarkNotificationReadResponse(data)) {
    throw new CommunityLiteClientError("消息全部已读响应结构异常");
  }

  return data;
}

export function isCommunityIdentityError(error: unknown): boolean {
  return (
    error instanceof CommunityLiteClientError &&
    (error.errorCode === CommunityLiteErrorCode.Unauthenticated ||
      error.errorCode === CommunityLiteErrorCode.ProfileRequired)
  );
}

export function isCommunityPublishGateError(error: unknown): boolean {
  return (
    error instanceof CommunityLiteClientError &&
    (error.errorCode === CommunityLiteErrorCode.Unauthenticated ||
      error.errorCode === CommunityLiteErrorCode.ProfileRequired ||
      error.errorCode === CommunityLiteErrorCode.PrivacyConsentRequired ||
      error.errorCode === CommunityLiteErrorCode.PhoneVerificationRequired ||
      error.errorCode === CommunityLiteErrorCode.UserLimited ||
      error.errorCode === CommunityLiteErrorCode.UserMuted ||
      error.errorCode === CommunityLiteErrorCode.UserBanned)
  );
}

function buildQuery(params: Record<string, string | undefined>): string {
  return Object.entries(params)
    .filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1] !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
}

async function requestInteraction(
  postId: string,
  method: "POST" | "DELETE",
  action: "like" | "favorite",
  options: CommunityRequestOptions
): Promise<CommunityInteractionResponse> {
  const data = await requestJson(
    `/community/posts/${encodeURIComponent(postId)}/${action}`,
    method,
    {},
    options.request ?? uni.request
  );

  if (!isRecord(data) || !isRecord(data.viewerInteraction) || !isRecord(data.stats)) {
    throw new CommunityLiteClientError("社区互动响应结构异常");
  }

  return data as unknown as CommunityInteractionResponse;
}

async function requestReport(
  path: string,
  report: CommunityReportInput,
  options: CommunityRequestOptions
): Promise<CreateCommunityReportResponse> {
  const data = await requestJson(
    path,
    "POST",
    typeof report === "string" ? { reason: report } : report,
    options.request ?? uni.request
  );

  if (!isCreateCommunityReportResponse(data)) {
    throw new CommunityLiteClientError("举报响应结构异常");
  }

  return data;
}

export const COMMUNITY_REPORT_TARGETS = CommunityReportTargetType;
