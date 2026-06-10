import type {
  AdminOperationErrorReason as AdminOperationErrorReasonType,
  DailyContentValidationIssue
} from "@moyuxia/shared";

export type HttpMethod = "GET" | "POST" | "PUT";

export type AdminRequestError = Error & {
  status?: number;
  errorCode?: string;
  errorReason: AdminOperationErrorReasonType;
  validationIssues?: DailyContentValidationIssue[];
};

const AdminOperationErrorReason = {
  Unauthorized: "unauthorized",
  NetworkFailure: "network_failure",
  StatusNotAllowed: "status_not_allowed",
  TargetNotFound: "target_not_found",
  ValidationFailed: "validation_failed",
  StateChanged: "state_changed",
  Unknown: "unknown"
} as const satisfies Record<string, AdminOperationErrorReasonType>;

export interface AdminRequestClientOptions {
  baseUrl: string;
  getToken(): string;
}

export function createAdminRequestClient(options: AdminRequestClientOptions) {
  return {
    request: (path: string, method: HttpMethod, body?: unknown) =>
      requestAdmin(options, path, method, body)
  };
}

export async function requestAdmin(
  options: AdminRequestClientOptions,
  path: string,
  method: HttpMethod,
  body?: unknown
) {
  let response: Response;
  try {
    response = await fetch(`${options.baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": options.getToken()
      },
      body: method === "GET" ? undefined : JSON.stringify(body ?? {})
    });
  } catch {
    throw createAdminRequestError("网络连接失败，请稍后重试", 0, undefined, undefined);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw createAdminRequestError(
      formatAdminError(data, response.status),
      response.status,
      data,
      Array.isArray((data as { issues?: unknown } | null)?.issues)
        ? (data as { issues: DailyContentValidationIssue[] }).issues
        : undefined
    );
  }
  return data;
}

export function isAdminRequestError(error: unknown): error is AdminRequestError {
  return error instanceof Error && "errorReason" in error;
}

export function formatAdminOperationError(error: unknown, fallback: string): string {
  if (!isAdminRequestError(error)) {
    return error instanceof Error && error.message ? error.message : fallback;
  }

  const reasonText: Record<AdminOperationErrorReasonType, string> = {
    [AdminOperationErrorReason.Unauthorized]: "后台令牌失效，请检查令牌",
    [AdminOperationErrorReason.NetworkFailure]: "网络失败，操作未提交",
    [AdminOperationErrorReason.StatusNotAllowed]: "当前状态不允许执行该操作",
    [AdminOperationErrorReason.TargetNotFound]: "目标不存在或已被处理",
    [AdminOperationErrorReason.ValidationFailed]: "提交内容未通过校验",
    [AdminOperationErrorReason.StateChanged]: "状态已变化，请刷新后再处理",
    [AdminOperationErrorReason.Unknown]: "后台返回未知错误"
  };

  return `${reasonText[error.errorReason]}：${error.message || fallback}`;
}

function createAdminRequestError(
  message: string,
  status?: number,
  data?: unknown,
  validationIssues?: DailyContentValidationIssue[]
): AdminRequestError {
  const error = new Error(message) as AdminRequestError;
  error.status = status;
  error.errorCode =
    data &&
    typeof data === "object" &&
    typeof (data as { errorCode?: unknown }).errorCode === "string"
      ? (data as { errorCode: string }).errorCode
      : undefined;
  error.errorReason = normalizeAdminErrorReason(status, error.errorCode, validationIssues);
  error.validationIssues = validationIssues;
  return error;
}

function formatAdminError(data: unknown, status: number): string {
  if (!data || typeof data !== "object") {
    return `后台接口返回 ${status}`;
  }

  const payload = data as {
    message?: unknown;
    issues?: unknown;
  };
  const message =
    typeof payload.message === "string" && payload.message.trim()
      ? payload.message
      : `后台接口返回 ${status}`;
  const issues = Array.isArray(payload.issues)
    ? payload.issues
        .map((issue) =>
          issue && typeof issue === "object" && "message" in issue
            ? String((issue as { message?: unknown }).message ?? "")
            : ""
        )
        .filter(Boolean)
    : [];

  return issues.length > 0 ? `${message}：${issues.join("；")}` : message;
}

function normalizeAdminErrorReason(
  status?: number,
  errorCode?: string,
  validationIssues?: DailyContentValidationIssue[]
): AdminOperationErrorReasonType {
  if (status === 0) {
    return AdminOperationErrorReason.NetworkFailure;
  }
  if (status === 401 || status === 403 || errorCode === "admin_unauthorized") {
    return AdminOperationErrorReason.Unauthorized;
  }
  if (status === 404) {
    return AdminOperationErrorReason.TargetNotFound;
  }
  if (status === 409 || errorCode?.includes("state_changed") || errorCode?.includes("already")) {
    return AdminOperationErrorReason.StateChanged;
  }
  if (status === 400 && validationIssues?.length) {
    return AdminOperationErrorReason.ValidationFailed;
  }
  if (status === 400) {
    return AdminOperationErrorReason.StatusNotAllowed;
  }
  return AdminOperationErrorReason.Unknown;
}
