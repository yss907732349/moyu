import { WorkProfileConfigStatus, type UserGrowthProfileSnapshot } from "@moyuxia/shared";
import { getAppAuthToken } from "./auth.ts";
import {
  getLocalUserProfileSnapshot,
  getUserProfile,
  type UserProfileLoadResult
} from "./user-growth-profile.ts";
import {
  getLocalWorkProfileSnapshot,
  getWorkProfile,
  saveLocalWorkProfileSnapshot
} from "./work-profile.ts";

export type MiniappFirstRunState =
  | "logged_out"
  | "profile_missing"
  | "work_profile_missing"
  | "ready";

export interface MiniappFirstRunResult {
  state: MiniappFirstRunState;
  profileSnapshot: UserGrowthProfileSnapshot | null;
  workProfileConfigured: boolean;
  usedLocalProfileSnapshot: boolean;
  usedLocalWorkProfileSnapshot: boolean;
  profileSyncMessage: string;
  workProfileSyncMessage: string;
}

export interface MiniappFirstRunOptions {
  request?: typeof uni.request;
}

export async function resolveMiniappFirstRunState(
  options: MiniappFirstRunOptions = {}
): Promise<MiniappFirstRunResult> {
  if (!getAppAuthToken()) {
    return createFirstRunResult("logged_out");
  }

  const localProfileSnapshot = getLocalUserProfileSnapshot();
  let profileLoadResult: UserProfileLoadResult | null = null;
  let profileSnapshot: UserGrowthProfileSnapshot | null = localProfileSnapshot;
  let profileSyncMessage = "";
  let usedLocalProfileSnapshot = Boolean(localProfileSnapshot);

  try {
    profileLoadResult = await getUserProfile({ request: options.request });
    profileSnapshot = profileLoadResult.response.profile;
    usedLocalProfileSnapshot = profileLoadResult.source === "local-cache";
    profileSyncMessage = profileLoadResult.recoverableError
      ? `身份资料同步失败，已使用本地快照：${profileLoadResult.recoverableError}`
      : "";
  } catch (error) {
    if (!localProfileSnapshot) {
      return createFirstRunResult("profile_missing", {
        profileSyncMessage: error instanceof Error ? error.message : "用户资料暂时不可用"
      });
    }

    profileSnapshot = localProfileSnapshot;
    profileSyncMessage = `身份资料同步失败，已使用本地快照：${formatErrorMessage(error, "用户资料暂时不可用")}`;
  }

  if (!profileSnapshot) {
    return createFirstRunResult("profile_missing", {
      profileSyncMessage,
      usedLocalProfileSnapshot
    });
  }

  const localWorkSnapshot = getLocalWorkProfileSnapshot();
  let workProfileConfigured = Boolean(localWorkSnapshot);
  let usedLocalWorkProfileSnapshot = Boolean(localWorkSnapshot);
  let workProfileSyncMessage = "";

  try {
    const response = await getWorkProfile({ request: options.request });
    if (
      response.configStatus === WorkProfileConfigStatus.Configured &&
      (response.snapshot || response.profile)
    ) {
      if (response.snapshot) {
        saveLocalWorkProfileSnapshot(response.snapshot);
      }
      workProfileConfigured = true;
      usedLocalWorkProfileSnapshot = false;
    } else if (!localWorkSnapshot) {
      workProfileConfigured = false;
      usedLocalWorkProfileSnapshot = false;
    }
  } catch (error) {
    if (!localWorkSnapshot) {
      workProfileConfigured = false;
      workProfileSyncMessage = formatErrorMessage(error, "工作档案暂时不可用");
    } else {
      workProfileConfigured = true;
      workProfileSyncMessage = `工作档案同步失败，已使用本地快照：${formatErrorMessage(error, "工作档案暂时不可用")}`;
    }
  }

  return {
    state: workProfileConfigured ? "ready" : "work_profile_missing",
    profileSnapshot,
    workProfileConfigured,
    usedLocalProfileSnapshot,
    usedLocalWorkProfileSnapshot,
    profileSyncMessage,
    workProfileSyncMessage
  };
}

function createFirstRunResult(
  state: MiniappFirstRunState,
  override: Partial<MiniappFirstRunResult> = {}
): MiniappFirstRunResult {
  return {
    state,
    profileSnapshot: null,
    workProfileConfigured: false,
    usedLocalProfileSnapshot: false,
    usedLocalWorkProfileSnapshot: false,
    profileSyncMessage: "",
    workProfileSyncMessage: "",
    ...override
  };
}

function formatErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
