import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  FEATURE_KEYS,
  FeaturePlacement,
  FeatureStatus,
  getFeatureEntriesByPlacement,
  type FeatureRegistryResponse
} from "@moyuxia/shared";
import {
  getFeatureRegistryByPlacement,
  isFeatureRegistryResponse
} from "../apps/miniapp/src/services/feature-registry.ts";

const remoteResponse: FeatureRegistryResponse = {
  placement: FeaturePlacement.HomeQuickEntry,
  entries: [
    {
      featureKey: FEATURE_KEYS.workValueTracker,
      title: "远端入口",
      icon: "px-icon-work-value",
      status: FeatureStatus.Enabled,
      placement: FeaturePlacement.HomeQuickEntry,
      displayOrder: 10,
      publicRoute: "/pages/home/index"
    }
  ]
};

const requestSuccess: typeof uni.request = ((options: UniApp.RequestOptions) => {
  options.success?.({
    statusCode: 200,
    data: remoteResponse,
    header: {},
    cookies: []
  } as UniApp.RequestSuccessCallbackResult);
  return {} as UniApp.RequestTask;
}) as typeof uni.request;

const successResponse = await getFeatureRegistryByPlacement(FeaturePlacement.HomeQuickEntry, {
  request: requestSuccess
});
assert.equal(successResponse.entries[0]?.title, "远端入口");
const salaryEntry = getFeatureEntriesByPlacement(FeaturePlacement.HomeQuickEntry).entries.find(
  (entry) => entry.featureKey === FEATURE_KEYS.salaryWorkTimeSettings
);
assert.equal(salaryEntry?.publicRoute, "/pages/work-profile/settings");

const requestFailure: typeof uni.request = ((options: UniApp.RequestOptions) => {
  options.fail?.({ errMsg: "request:fail timeout" });
  return {} as UniApp.RequestTask;
}) as typeof uni.request;

const fallbackResponse = await getFeatureRegistryByPlacement(FeaturePlacement.HomeQuickEntry, {
  request: requestFailure
});
assert.deepEqual(fallbackResponse, getFeatureEntriesByPlacement(FeaturePlacement.HomeQuickEntry));
assert.equal(
  getFeatureEntriesByPlacement(FeaturePlacement.ProfileFeatureGrid).entries.some(
    (entry) =>
      entry.featureKey === FEATURE_KEYS.comicIpContent &&
      entry.status === FeatureStatus.Enabled &&
      entry.publicRoute === "/pages/comics/index"
  ),
  false
);
assert.equal(
  getFeatureEntriesByPlacement(FeaturePlacement.ComicsEntry).entries.some(
    (entry) => entry.publicRoute === "/pages/comics/index"
  ),
  false
);

const requestInvalid: typeof uni.request = ((options: UniApp.RequestOptions) => {
  options.success?.({
    statusCode: 200,
    data: {
      placement: FeaturePlacement.HomeQuickEntry,
      entries: [{ status: FeatureStatus.Hidden }]
    },
    header: {},
    cookies: []
  } as UniApp.RequestSuccessCallbackResult);
  return {} as UniApp.RequestTask;
}) as typeof uni.request;

const invalidResponse = await getFeatureRegistryByPlacement(FeaturePlacement.HomeQuickEntry, {
  request: requestInvalid
});
assert.deepEqual(invalidResponse, getFeatureEntriesByPlacement(FeaturePlacement.HomeQuickEntry));
assert.equal(isFeatureRegistryResponse(remoteResponse, FeaturePlacement.HomeQuickEntry), true);

const pagesJson = JSON.parse(readFileSync("apps/miniapp/src/pages.json", "utf8")) as {
  tabBar?: { list?: Array<{ pagePath?: string }> };
};
assert.deepEqual(
  pagesJson.tabBar?.list?.map((item) => item.pagePath),
  ["pages/home/index", "pages/community/index", "pages/profile/index"]
);
assert.equal(
  pagesJson.tabBar?.list?.some((item) => item.pagePath === "pages/comics/index"),
  false
);

process.stdout.write("miniapp feature-registry verification passed\n");
