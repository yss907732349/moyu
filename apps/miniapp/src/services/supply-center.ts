import {
  DEFAULT_SUPPLY_ITEMS,
  SupplyClickJumpStatus,
  SupplySectionKey,
  buildSupplyCenterPublicList,
  type PublicSupplyItem,
  type SupplyCenterPublicListResponse,
  type SupplyClickResponse,
  type SupplyJumpTarget
} from "@moyuxia/shared";
import { getAuthHeaders } from "./auth";
import { getMiniappApiBaseUrl, MINIAPP_API_TIMEOUT_MS } from "./api-config.ts";

const apiBaseUrl = getMiniappApiBaseUrl();
const LOCAL_PREVIEW_SYNC_HINT = "网络异常，已展示本地补给预览；服务恢复后才可打开补给通道。";

interface SupplyRequestOptions {
  request?: typeof uni.request;
}

export class SupplyCenterClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupplyCenterClientError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isJumpTarget(value: unknown): value is SupplyJumpTarget {
  if (!isRecord(value)) {
    return false;
  }
  if (value.type === "miniapp") {
    return (
      typeof value.appId === "string" &&
      typeof value.path === "string" &&
      (!("fallbackUrl" in value) || typeof value.fallbackUrl === "string")
    );
  }
  return value.type === "webview" && typeof value.url === "string";
}

export function isSupplyCenterPublicListResponse(
  value: unknown
): value is SupplyCenterPublicListResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.sections) &&
    typeof value.syncHint === "string" &&
    isRecord(value.todayPanel) &&
    typeof value.todayPanel.title === "string" &&
    typeof value.todayPanel.scenarioLabel === "string" &&
    Array.isArray(value.todayPanel.sections) &&
    (!("mainRecommendation" in value) || isPublicSupplyItem(value.mainRecommendation)) &&
    value.sections.every(
      (entry) =>
        isRecord(entry) &&
        isRecord(entry.section) &&
        Object.values(SupplySectionKey).includes(entry.section.key as SupplySectionKey) &&
        Array.isArray(entry.items) &&
        entry.items.every(isPublicSupplyItem)
    )
  );
}

export function isSupplyClickResponse(value: unknown): value is SupplyClickResponse {
  return (
    isRecord(value) &&
    typeof value.clickId === "string" &&
    typeof value.sidMasked === "string" &&
    Object.values(SupplyClickJumpStatus).includes(value.jumpStatus as SupplyClickJumpStatus) &&
    typeof value.message === "string" &&
    typeof value.attributionReliable === "boolean" &&
    typeof value.ledgerHint === "string" &&
    (!("jumpTarget" in value) || isJumpTarget(value.jumpTarget))
  );
}

function isPublicSupplyItem(value: unknown): value is PublicSupplyItem {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    typeof value.actionText === "string" &&
    typeof value.clickable === "boolean" &&
    Array.isArray(value.tags) &&
    value.tags.every((tag) => typeof tag === "string") &&
    typeof value.syncHint === "string" &&
    !("jutuikeActId" in value) &&
    !("commissionRate" in value) &&
    !("sid" in value) &&
    !("sidDigest" in value) &&
    !("internalNote" in value)
  );
}

function requestJson(
  path: string,
  method: "GET" | "POST",
  request: typeof uni.request
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    request({
      url: `${apiBaseUrl}${path}`,
      method,
      header: getAuthHeaders(),
      timeout: MINIAPP_API_TIMEOUT_MS,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
          return;
        }
        const data = isRecord(res.data) ? res.data : {};
        reject(
          new SupplyCenterClientError(
            typeof data.message === "string" ? data.message : `补给铺接口返回 ${res.statusCode}`
          )
        );
      },
      fail: () => reject(new SupplyCenterClientError("网络异常，请稍后重试"))
    });
  });
}

export async function getSupplyCenterList(
  options: SupplyRequestOptions = {}
): Promise<SupplyCenterPublicListResponse> {
  const data = await requestJson("/supply-center", "GET", options.request ?? uni.request);
  if (!isSupplyCenterPublicListResponse(data)) {
    throw new SupplyCenterClientError("补给铺响应结构异常");
  }
  return data;
}

export function getLocalSupplyCenterPreview(now = new Date()): SupplyCenterPublicListResponse {
  const preview = buildSupplyCenterPublicList(DEFAULT_SUPPLY_ITEMS, now);
  const sections = preview.sections.map((section) => ({
    ...section,
    items: section.items.map(disablePreviewItem)
  }));
  const mainRecommendation = preview.mainRecommendation
    ? disablePreviewItem(preview.mainRecommendation)
    : undefined;

  return {
    ...preview,
    mainRecommendation,
    sections,
    syncHint: LOCAL_PREVIEW_SYNC_HINT,
    todayPanel: {
      ...preview.todayPanel,
      mainRecommendation,
      sections,
      syncHint: LOCAL_PREVIEW_SYNC_HINT
    }
  };
}

export async function createSupplyClick(
  itemId: string,
  options: SupplyRequestOptions = {}
): Promise<SupplyClickResponse> {
  const data = await requestJson(
    `/supply-center/items/${encodeURIComponent(itemId)}/click`,
    "POST",
    options.request ?? uni.request
  );
  if (!isSupplyClickResponse(data)) {
    throw new SupplyCenterClientError("补给点击响应结构异常");
  }
  return data;
}

export function normalizeSupplyCenterError(error: unknown): string {
  return error instanceof SupplyCenterClientError ? error.message : "补给铺暂时不可用";
}

function disablePreviewItem(item: PublicSupplyItem): PublicSupplyItem {
  return {
    ...item,
    actionText: "稍后再试",
    clickable: false,
    clickableReason: "服务暂不可用，稍后再试",
    syncHint: LOCAL_PREVIEW_SYNC_HINT
  };
}
