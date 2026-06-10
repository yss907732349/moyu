/* global process */
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const registry = require("../packages/shared/dist/index.js");

const {
  DEFAULT_MVP_FEATURE_REGISTRY,
  FEATURE_ADMIN_PERMISSION,
  FEATURE_KEYS,
  FeaturePlacement,
  FeatureRegistryAuthorizationError,
  FeatureRegistryValidationError,
  FeatureStatus,
  applyAdminFeatureConfigPatch,
  assertFeatureAdminAuthorized,
  canNavigateFeatureEntry,
  createLocalFeatureRegistrySource,
  getFeatureEntriesByPlacement,
  toPublicFeatureEntry,
  validateFeatureEntry,
  validateFeatureRegistry
} = registry;

validateFeatureRegistry(DEFAULT_MVP_FEATURE_REGISTRY);

const byKey = new Map(DEFAULT_MVP_FEATURE_REGISTRY.map((entry) => [entry.featureKey, entry]));

assert.equal(byKey.get(FEATURE_KEYS.workValueTracker).status, FeatureStatus.Enabled);
assert.equal(
  byKey.get(FEATURE_KEYS.salaryWorkTimeSettings).publicRoute,
  "/pages/work-profile/settings"
);
assert.equal(byKey.get(FEATURE_KEYS.accountingLedger).status, FeatureStatus.Enabled);
assert.equal(
  byKey.get(FEATURE_KEYS.accountingLedger).publicRoute,
  "/pages/accounting-ledger/index"
);
assert.equal(byKey.get(FEATURE_KEYS.supplyCenter).status, FeatureStatus.Enabled);
assert.equal(byKey.get(FEATURE_KEYS.supplyCenter).publicRoute, "/pages/supply-center/index");
assert.equal(byKey.get(FEATURE_KEYS.comicIpContent).status, FeatureStatus.Hidden);
assert.equal(byKey.get(FEATURE_KEYS.comicIpContent).publicRoute, undefined);
assert.equal(byKey.get(FEATURE_KEYS.skinShop).status, FeatureStatus.Disabled);
assert.equal(byKey.get(FEATURE_KEYS.adminOperations).status, FeatureStatus.Hidden);

const homeResponse = getFeatureEntriesByPlacement(FeaturePlacement.HomeQuickEntry);
assert.equal(homeResponse.placement, FeaturePlacement.HomeQuickEntry);
assert.deepEqual(
  homeResponse.entries.map((entry) => entry.displayOrder),
  [...homeResponse.entries.map((entry) => entry.displayOrder)].sort((a, b) => a - b)
);
assert(homeResponse.entries.some((entry) => entry.featureKey === FEATURE_KEYS.dailyContentFeed));
assert(!homeResponse.entries.some((entry) => entry.featureKey === FEATURE_KEYS.comicIpContent));
assert.equal(
  homeResponse.entries.find((entry) => entry.featureKey === FEATURE_KEYS.dailyContentFeed)
    .publicRoute,
  "/pages/daily-content/index"
);
assert(!homeResponse.entries.some((entry) => entry.status === FeatureStatus.Hidden));

const profileResponse = getFeatureEntriesByPlacement(FeaturePlacement.ProfileFeatureGrid);
assert(profileResponse.entries.some((entry) => entry.featureKey === FEATURE_KEYS.dailyContentFeed));
assert(!profileResponse.entries.some((entry) => entry.featureKey === FEATURE_KEYS.comicIpContent));
assert.equal(
  profileResponse.entries.find((entry) => entry.featureKey === FEATURE_KEYS.dailyContentFeed)
    .publicRoute,
  "/pages/daily-content/index"
);

const comicsEntryResponse = getFeatureEntriesByPlacement(FeaturePlacement.ComicsEntry);
assert.equal(comicsEntryResponse.entries.length, 0);
const communityEntryResponse = getFeatureEntriesByPlacement(FeaturePlacement.CommunityEntry);
assert(
  !communityEntryResponse.entries.some((entry) => entry.featureKey === FEATURE_KEYS.comicIpContent)
);

const adminPublicEntry = toPublicFeatureEntry(
  byKey.get(FEATURE_KEYS.adminOperations),
  FeaturePlacement.AdminOperations
);
assert.equal(adminPublicEntry, null);

const supplyEntry = homeResponse.entries.find(
  (entry) => entry.featureKey === FEATURE_KEYS.supplyCenter
);
assert.equal(canNavigateFeatureEntry(supplyEntry), true);
assert.equal(supplyEntry.publicRoute, "/pages/supply-center/index");
assert.equal("internalNotes" in supplyEntry, false);
assert.equal("internalRoute" in supplyEntry, false);
assert.equal("rolloutControl" in supplyEntry, false);
assert.equal("auditStatus" in supplyEntry, false);

const enabledWithoutRoute = {
  ...toPublicFeatureEntry(
    byKey.get(FEATURE_KEYS.workValueTracker),
    FeaturePlacement.HomeQuickEntry
  ),
  publicRoute: undefined
};
assert.equal(canNavigateFeatureEntry(enabledWithoutRoute), false);

assert.throws(
  () =>
    validateFeatureEntry({
      ...byKey.get(FEATURE_KEYS.factionSelection),
      unlockText: undefined
    }),
  FeatureRegistryValidationError
);

assert.throws(
  () =>
    validateFeatureEntry({
      ...byKey.get(FEATURE_KEYS.workValueTracker),
      featureKey: "bad-key"
    }),
  FeatureRegistryValidationError
);

const customSource = createLocalFeatureRegistrySource([
  {
    ...byKey.get(FEATURE_KEYS.dailyContentFeed),
    placements: [
      { placement: FeaturePlacement.HomeQuickEntry, order: 20 },
      { placement: FeaturePlacement.ProfileFeatureGrid, order: 5 }
    ]
  },
  {
    ...byKey.get(FEATURE_KEYS.communityLite),
    placements: [{ placement: FeaturePlacement.HomeQuickEntry, order: 10 }]
  }
]);

assert.deepEqual(
  getFeatureEntriesByPlacement(FeaturePlacement.HomeQuickEntry, customSource).entries.map(
    (entry) => entry.featureKey
  ),
  [FEATURE_KEYS.communityLite, FEATURE_KEYS.dailyContentFeed]
);
assert.deepEqual(
  getFeatureEntriesByPlacement(FeaturePlacement.ProfileFeatureGrid, customSource).entries.map(
    (entry) => entry.featureKey
  ),
  [FEATURE_KEYS.dailyContentFeed]
);

assert.throws(
  () =>
    applyAdminFeatureConfigPatch(
      byKey.get(FEATURE_KEYS.supplyCenter),
      { title: "补给站" },
      { id: "viewer", permissions: [] }
    ),
  FeatureRegistryAuthorizationError
);

for (const operation of ["create", "update", "publish", "hide"]) {
  assert.throws(
    () => assertFeatureAdminAuthorized({ id: "viewer", permissions: [] }, operation),
    FeatureRegistryAuthorizationError
  );
}

assert.throws(
  () =>
    applyAdminFeatureConfigPatch(
      byKey.get(FEATURE_KEYS.supplyCenter),
      { publicRoute: "/pages/home/index" },
      { id: "admin", permissions: [FEATURE_ADMIN_PERMISSION] }
    ),
  FeatureRegistryValidationError
);

const updatedEntry = applyAdminFeatureConfigPatch(
  byKey.get(FEATURE_KEYS.supplyCenter),
  { title: "补给站" },
  { id: "admin", permissions: [FEATURE_ADMIN_PERMISSION] }
);
assert.equal(updatedEntry.title, "补给站");
assert.equal(updatedEntry.featureKey, FEATURE_KEYS.supplyCenter);

process.stdout.write("feature-registry verification passed\n");
