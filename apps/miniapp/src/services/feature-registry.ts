import {
  FeatureStatus,
  getFeatureEntriesByPlacement,
  isFeaturePlacement,
  type FeaturePlacement,
  type FeatureRegistryResponse,
  type PublicFeatureEntry
} from "@moyuxia/shared";
import { getMiniappApiBaseUrl, MINIAPP_API_TIMEOUT_MS } from "./api-config.ts";

const apiBaseUrl = getMiniappApiBaseUrl();

interface FeatureRegistryRequestOptions {
  request?: typeof uni.request;
}

const publicFeatureStatuses = new Set<string>([
  FeatureStatus.Enabled,
  FeatureStatus.Locked,
  FeatureStatus.ComingSoon,
  FeatureStatus.Disabled
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPublicFeatureEntry(
  value: unknown,
  placement: FeaturePlacement
): value is PublicFeatureEntry {
  if (!isRecord(value)) {
    return false;
  }

  if (value.placement !== placement || !publicFeatureStatuses.has(String(value.status))) {
    return false;
  }

  if (value.status !== FeatureStatus.Enabled && "publicRoute" in value) {
    return false;
  }

  return (
    typeof value.featureKey === "string" &&
    typeof value.title === "string" &&
    typeof value.icon === "string" &&
    Number.isInteger(value.displayOrder) &&
    !("internalRoute" in value) &&
    !("internalNotes" in value) &&
    !("rolloutControl" in value) &&
    !("auditStatus" in value)
  );
}

export function isFeatureRegistryResponse(
  value: unknown,
  placement: FeaturePlacement
): value is FeatureRegistryResponse {
  return (
    isRecord(value) &&
    value.placement === placement &&
    Array.isArray(value.entries) &&
    value.entries.every((entry) => isPublicFeatureEntry(entry, placement))
  );
}

function getLocalFeatureRegistryByPlacement(placement: FeaturePlacement): FeatureRegistryResponse {
  return getFeatureEntriesByPlacement(placement);
}

function requestFeatureRegistry(
  placement: FeaturePlacement,
  request: typeof uni.request
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    request({
      url: `${apiBaseUrl}/feature-registry/${placement}`,
      method: "GET",
      timeout: MINIAPP_API_TIMEOUT_MS,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
          return;
        }

        reject(new Error(`Feature registry API returned ${res.statusCode}`));
      },
      fail: reject
    });
  });
}

export async function getFeatureRegistryByPlacement(
  placement: FeaturePlacement,
  options: FeatureRegistryRequestOptions = {}
): Promise<FeatureRegistryResponse> {
  if (!isFeaturePlacement(placement)) {
    return getLocalFeatureRegistryByPlacement(placement);
  }

  try {
    const data = await requestFeatureRegistry(placement, options.request ?? uni.request);

    if (isFeatureRegistryResponse(data, placement)) {
      return data;
    }
  } catch (error) {
    if (import.meta.env?.DEV) {
      console.warn("feature registry fallback to local defaults", error);
    }
  }

  return getLocalFeatureRegistryByPlacement(placement);
}
