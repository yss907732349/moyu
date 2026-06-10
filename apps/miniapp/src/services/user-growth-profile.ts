import {
  isUserFaction,
  isUserProfessionType,
  type CreateUserProfileRequest,
  type CreateUserProfileResponse,
  type DailyCheckinResponse,
  type GetUserProfileResponse,
  type UpdateUserProfileRequest,
  type UpdateUserProfileResponse,
  type UserGrowthProfileSnapshot
} from "@moyuxia/shared";
import { getMiniappApiBaseUrl, MINIAPP_API_TIMEOUT_MS } from "./api-config.ts";

const USER_PROFILE_SNAPSHOT_STORAGE_KEY = "moyuxia.userProfileSnapshot";
const AUTH_TOKEN_STORAGE_KEY = "moyuxia.authToken";
const apiBaseUrl = getMiniappApiBaseUrl();

interface ProfileRequestOptions {
  request?: typeof uni.request;
}

export interface UserProfileLoadResult {
  source: "remote" | "local-cache";
  response: GetUserProfileResponse;
  recoverableError?: string;
}

export class UserProfileClientError extends Error {
  readonly recoverable: boolean;

  constructor(message: string, recoverable = true) {
    super(message);
    this.name = "UserProfileClientError";
    this.recoverable = recoverable;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getAppAuthToken(): string | null {
  try {
    const token = uni.getStorageSync(AUTH_TOKEN_STORAGE_KEY) as unknown;
    return typeof token === "string" && token ? token : null;
  } catch {
    return null;
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = getAppAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function isUserProfileSnapshot(value: unknown): value is UserGrowthProfileSnapshot {
  return (
    isRecord(value) &&
    typeof value.userId === "string" &&
    (value.publicProfileId === undefined || typeof value.publicProfileId === "string") &&
    isUserProfessionType(String(value.professionType)) &&
    isUserFaction(String(value.faction)) &&
    typeof value.factionLabel === "string" &&
    typeof value.professionLabel === "string" &&
    typeof value.displayName === "string" &&
    typeof value.avatarKey === "string" &&
    typeof value.jobTitle === "string" &&
    typeof value.currentBadgeKey === "string" &&
    typeof value.factionArtworkKey === "string" &&
    isRecord(value.recommendation) &&
    isUserFaction(String(value.recommendation.recommendedFaction)) &&
    typeof value.recommendation.recommendedFactionLabel === "string" &&
    typeof value.recommendation.isCurrentFactionRecommended === "boolean" &&
    Number.isInteger(value.level) &&
    Number.isInteger(value.totalExperience) &&
    Number.isInteger(value.hiddenCoins) &&
    Number.isInteger(value.energy) &&
    Number.isInteger(value.checkinStreak) &&
    (value.totalCheckinCount === undefined || Number.isInteger(value.totalCheckinCount)) &&
    typeof value.titleKey === "string" &&
    Array.isArray(value.equippedBadgeKeys) &&
    value.equippedBadgeKeys.every((item) => typeof item === "string") &&
    isRecord(value.levelProgress) &&
    typeof value.updatedAt === "string"
  );
}

export function getLocalUserProfileSnapshot(): UserGrowthProfileSnapshot | null {
  try {
    const snapshot = uni.getStorageSync(USER_PROFILE_SNAPSHOT_STORAGE_KEY) as unknown;
    return isUserProfileSnapshot(snapshot) ? snapshot : null;
  } catch {
    return null;
  }
}

export function saveLocalUserProfileSnapshot(snapshot: UserGrowthProfileSnapshot): void {
  uni.setStorageSync(USER_PROFILE_SNAPSHOT_STORAGE_KEY, snapshot);
}

export function clearLocalUserProfileSnapshot(): void {
  uni.removeStorageSync(USER_PROFILE_SNAPSHOT_STORAGE_KEY);
}

export function isGetUserProfileResponse(value: unknown): value is GetUserProfileResponse {
  return (
    isRecord(value) &&
    typeof value.profileCreated === "boolean" &&
    (value.profile === null || isUserProfileSnapshot(value.profile))
  );
}

export function isCreateUserProfileResponse(value: unknown): value is CreateUserProfileResponse {
  return (
    isRecord(value) &&
    value.profileCreated === true &&
    typeof value.alreadyCreated === "boolean" &&
    isUserProfileSnapshot(value.profile)
  );
}

export function isDailyCheckinResponse(value: unknown): value is DailyCheckinResponse {
  return (
    isRecord(value) &&
    typeof value.checkedInToday === "boolean" &&
    typeof value.alreadyCheckedIn === "boolean" &&
    typeof value.businessDate === "string" &&
    isRecord(value.reward) &&
    typeof value.reward.experience === "number" &&
    typeof value.reward.hiddenCoins === "number" &&
    typeof value.reward.energy === "number" &&
    isUserProfileSnapshot(value.profile)
  );
}

export function isUpdateUserProfileResponse(value: unknown): value is UpdateUserProfileResponse {
  return isRecord(value) && isUserProfileSnapshot(value.profile);
}

function requestJson(
  path: string,
  method: "GET" | "POST" | "PUT",
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

        reject(new UserProfileClientError(`用户资料接口返回 ${res.statusCode}`));
      },
      fail: () => reject(new UserProfileClientError("网络异常，请稍后重试"))
    });
  });
}

export async function getUserProfile(
  options: ProfileRequestOptions = {}
): Promise<UserProfileLoadResult> {
  if (!getAppAuthToken()) {
    throw new UserProfileClientError("请先登录", false);
  }

  try {
    const data = await requestJson("/me/profile", "GET", undefined, options.request ?? uni.request);

    if (!isGetUserProfileResponse(data)) {
      throw new UserProfileClientError("用户资料响应结构异常");
    }

    if (data.profile) {
      saveLocalUserProfileSnapshot(data.profile);
    } else {
      clearLocalUserProfileSnapshot();
    }

    return { source: "remote", response: data };
  } catch (error) {
    const snapshot = getLocalUserProfileSnapshot();

    if (snapshot) {
      return {
        source: "local-cache",
        response: { profileCreated: true, profile: snapshot },
        recoverableError: error instanceof Error ? error.message : "用户资料同步失败"
      };
    }

    throw error;
  }
}

export async function createUserProfile(
  requestBody: CreateUserProfileRequest,
  options: ProfileRequestOptions = {}
): Promise<CreateUserProfileResponse> {
  const data = await requestJson(
    "/me/profile",
    "POST",
    requestBody,
    options.request ?? uni.request
  );

  if (!isCreateUserProfileResponse(data)) {
    throw new UserProfileClientError("创建档案响应结构异常");
  }

  saveLocalUserProfileSnapshot(data.profile);
  return data;
}

export async function dailyCheckin(
  options: ProfileRequestOptions = {}
): Promise<DailyCheckinResponse> {
  const data = await requestJson("/me/daily-checkin", "POST", {}, options.request ?? uni.request);

  if (!isDailyCheckinResponse(data)) {
    throw new UserProfileClientError("签到响应结构异常");
  }

  saveLocalUserProfileSnapshot(data.profile);
  return data;
}

export async function updateUserProfile(
  requestBody: UpdateUserProfileRequest,
  options: ProfileRequestOptions = {}
): Promise<UpdateUserProfileResponse> {
  const data = await requestJson("/me/profile", "PUT", requestBody, options.request ?? uni.request);

  if (!isUpdateUserProfileResponse(data)) {
    throw new UserProfileClientError("资料更新响应结构异常");
  }

  saveLocalUserProfileSnapshot(data.profile);
  return data;
}
