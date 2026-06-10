import {
  CurrencyCode,
  PaydayWeekendStrategy,
  SalaryMode,
  WorkProfileConfigStatus,
  WorkdayRuleType,
  type GetWorkProfileResponse,
  type SaveWorkProfileRequest,
  type SaveWorkProfileResponse,
  type ValidationIssue,
  type WorkBreak,
  type WorkProfile,
  type WorkProfileSnapshot
} from "@moyuxia/shared";
import { getMiniappApiBaseUrl, MINIAPP_API_TIMEOUT_MS } from "./api-config.ts";

const WORK_PROFILE_SNAPSHOT_STORAGE_KEY = "moyuxia.workProfileSnapshot";
const AUTH_TOKEN_STORAGE_KEY = "moyuxia.authToken";
const apiBaseUrl = getMiniappApiBaseUrl();

interface WorkProfileRequestOptions {
  request?: typeof uni.request;
}

export interface NormalizedWorkProfileError {
  message: string;
  fieldErrors: Record<string, string>;
}

export class WorkProfileClientError extends Error {
  readonly fieldErrors: Record<string, string>;

  constructor(message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "WorkProfileClientError";
    this.fieldErrors = fieldErrors;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getAuthHeaders(): Record<string, string> {
  try {
    const token = uni.getStorageSync(AUTH_TOKEN_STORAGE_KEY) as unknown;
    return typeof token === "string" && token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

function isBreak(value: unknown): value is WorkBreak {
  return (
    isRecord(value) &&
    typeof value.startTime === "string" &&
    typeof value.endTime === "string" &&
    (!("id" in value) || typeof value.id === "string") &&
    (!("label" in value) || typeof value.label === "string")
  );
}

function isWorkProfile(value: unknown): value is WorkProfile {
  return (
    isRecord(value) &&
    typeof value.userId === "string" &&
    isRecord(value.salary) &&
    value.salary.mode === SalaryMode.SimpleMonthly &&
    value.salary.currency === CurrencyCode.CNY &&
    typeof value.salary.monthlyAmount === "number" &&
    isRecord(value.workTime) &&
    typeof value.workTime.startTime === "string" &&
    typeof value.workTime.endTime === "string" &&
    Array.isArray(value.workTime.breaks) &&
    value.workTime.breaks.every(isBreak) &&
    isRecord(value.workdays) &&
    [WorkdayRuleType.StandardWeekdays, WorkdayRuleType.CustomWeekdays].includes(
      value.workdays.type as WorkdayRuleType
    ) &&
    Array.isArray(value.workdays.weekdays) &&
    value.workdays.weekdays.every((weekday) => Number.isInteger(weekday)) &&
    isRecord(value.payday) &&
    Number.isInteger(value.payday.dayOfMonth) &&
    Object.values(PaydayWeekendStrategy).includes(
      value.payday.weekendStrategy as PaydayWeekendStrategy
    ) &&
    typeof value.hideModeEnabled === "boolean" &&
    value.configStatus === WorkProfileConfigStatus.Configured &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

export function isWorkProfileSnapshot(value: unknown): value is WorkProfileSnapshot {
  return (
    isRecord(value) &&
    isWorkProfile({
      userId: "snapshot",
      salary: value.salary,
      workTime: value.workTime,
      workdays: value.workdays,
      payday: value.payday,
      hideModeEnabled: value.hideModeEnabled,
      configStatus: value.configStatus,
      createdAt: value.updatedAt,
      updatedAt: value.updatedAt
    })
  );
}

export function getLocalWorkProfileSnapshot(): WorkProfileSnapshot | null {
  try {
    const snapshot = uni.getStorageSync(WORK_PROFILE_SNAPSHOT_STORAGE_KEY) as unknown;
    return isWorkProfileSnapshot(snapshot) ? snapshot : null;
  } catch {
    return null;
  }
}

export function saveLocalWorkProfileSnapshot(snapshot: WorkProfileSnapshot): void {
  uni.setStorageSync(WORK_PROFILE_SNAPSHOT_STORAGE_KEY, snapshot);
}

export function clearLocalWorkProfileSnapshot(): void {
  uni.removeStorageSync(WORK_PROFILE_SNAPSHOT_STORAGE_KEY);
}

export function isGetWorkProfileResponse(value: unknown): value is GetWorkProfileResponse {
  if (
    !isRecord(value) ||
    !Object.values(WorkProfileConfigStatus).includes(value.configStatus as WorkProfileConfigStatus)
  ) {
    return false;
  }

  if (value.profile === null) {
    return value.configStatus === WorkProfileConfigStatus.Unconfigured && !("snapshot" in value);
  }

  return (
    isWorkProfile(value.profile) &&
    value.configStatus === value.profile.configStatus &&
    (!("snapshot" in value) || isWorkProfileSnapshot(value.snapshot))
  );
}

export function isSaveWorkProfileResponse(value: unknown): value is SaveWorkProfileResponse {
  return isRecord(value) && isWorkProfile(value.profile) && isWorkProfileSnapshot(value.snapshot);
}

function normalizeValidationIssues(data: unknown): NormalizedWorkProfileError | null {
  if (!isRecord(data) || !Array.isArray(data.issues)) {
    return null;
  }

  const fieldErrors: Record<string, string> = {};

  for (const issue of data.issues) {
    if (isRecord(issue) && typeof issue.field === "string" && typeof issue.message === "string") {
      fieldErrors[issue.field] = issue.message;
    }
  }

  return {
    message: typeof data.message === "string" ? data.message : "工作档案校验失败",
    fieldErrors
  };
}

function requestJson(
  path: string,
  method: "GET" | "PUT",
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

        const validationError = normalizeValidationIssues(res.data);
        if (validationError) {
          reject(new WorkProfileClientError(validationError.message, validationError.fieldErrors));
          return;
        }

        reject(new WorkProfileClientError(`工作档案接口返回 ${res.statusCode}`));
      },
      fail: () => reject(new WorkProfileClientError("网络异常，请稍后重试"))
    });
  });
}

export async function getWorkProfile(
  options: WorkProfileRequestOptions = {}
): Promise<GetWorkProfileResponse> {
  const data = await requestJson(
    "/me/work-profile",
    "GET",
    undefined,
    options.request ?? uni.request
  );

  if (!isGetWorkProfileResponse(data)) {
    throw new WorkProfileClientError("工作档案响应结构异常");
  }

  return data;
}

export async function saveWorkProfile(
  requestBody: SaveWorkProfileRequest,
  options: WorkProfileRequestOptions = {}
): Promise<SaveWorkProfileResponse> {
  const data = await requestJson(
    "/me/work-profile",
    "PUT",
    requestBody,
    options.request ?? uni.request
  );

  if (!isSaveWorkProfileResponse(data)) {
    throw new WorkProfileClientError("工作档案保存响应结构异常");
  }

  return data;
}

export function normalizeWorkProfileError(error: unknown): NormalizedWorkProfileError {
  if (error instanceof WorkProfileClientError) {
    return {
      message: error.message,
      fieldErrors: error.fieldErrors
    };
  }

  return {
    message: "工作档案暂时无法保存",
    fieldErrors: {}
  };
}

export type { ValidationIssue };
