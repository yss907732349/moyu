/* global process */
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const shared = require("../packages/shared/dist/index.js");
const { FeatureRegistryController } = require("../apps/api/dist/feature-registry.controller.js");

const {
  FEATURE_KEYS,
  FeaturePlacement,
  FeatureStatus,
  createLocalFeatureRegistrySource,
  getFeatureEntriesByPlacement
} = shared;

const controller = new FeatureRegistryController();

const response = controller.getByPlacement(FeaturePlacement.HomeQuickEntry);

assert.equal(response.placement, FeaturePlacement.HomeQuickEntry);
assert(response.entries.length > 0);
assert(response.entries.some((entry) => entry.featureKey === FEATURE_KEYS.workValueTracker));

assert.throws(
  () => controller.getByPlacement("bad_placement"),
  (error) =>
    typeof error?.getStatus === "function" &&
    error.getStatus() === 400 &&
    error.response?.statusCode === 400
);

for (const entry of response.entries) {
  assert.notEqual(entry.status, FeatureStatus.Hidden);
  assert.equal("internalRoute" in entry, false);
  assert.equal("internalNotes" in entry, false);
  assert.equal("rolloutControl" in entry, false);
  assert.equal("auditStatus" in entry, false);

  if (entry.status !== FeatureStatus.Enabled) {
    assert.equal(entry.publicRoute, undefined);
  }
}

const entries = getFeatureEntriesByPlacement(
  FeaturePlacement.HomeQuickEntry,
  createLocalFeatureRegistrySource([
    {
      featureKey: FEATURE_KEYS.dailyContentFeed,
      title: "B",
      icon: "px-icon-b",
      status: FeatureStatus.Enabled,
      placements: [{ placement: FeaturePlacement.HomeQuickEntry, order: 10 }],
      publicRoute: "/pages/home/index"
    },
    {
      featureKey: FEATURE_KEYS.communityLite,
      title: "A",
      icon: "px-icon-a",
      status: FeatureStatus.Enabled,
      placements: [{ placement: FeaturePlacement.HomeQuickEntry, order: 10 }],
      publicRoute: "/pages/community/index"
    }
  ])
).entries;

assert.deepEqual(
  entries.map((entry) => entry.featureKey),
  [FEATURE_KEYS.communityLite, FEATURE_KEYS.dailyContentFeed]
);

process.stdout.write("feature-registry api verification passed\n");
