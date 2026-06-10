/* global process */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const adminApp = readFileSync("apps/admin/src/App.vue", "utf8");
const controller = readFileSync("apps/api/src/supply-center.controller.ts", "utf8");
const service = readFileSync("apps/api/src/supply-center.service.ts", "utf8");

assert.equal(adminApp.includes("补给铺配置"), true);
assert.equal(adminApp.includes("/admin/supply-center/items"), true);
assert.equal(adminApp.includes("/admin/supply-center/items/batch-status"), true);
assert.equal(adminApp.includes("/copy"), true);
assert.equal(adminApp.includes("/admin/supply-center/clicks"), true);
assert.equal(adminApp.includes("/admin/supply-center/order-syncs"), true);
assert.equal(adminApp.includes("/admin/supply-center/public-preview"), true);
assert.equal(adminApp.includes("/admin/supply-center/exceptions"), true);
assert.equal(adminApp.includes("/admin/supply-center/metrics"), true);
assert.equal(adminApp.includes("saveSupplyItem"), true);
assert.equal(adminApp.includes("quickUpdateSupplyItem"), true);
assert.equal(adminApp.includes("copySupplyItem"), true);
assert.equal(adminApp.includes("batchUpdateSupplyStatus"), true);
assert.equal(adminApp.includes("supplyFilters"), true);
assert.equal(adminApp.includes("userVisibleTagsText"), true);
assert.equal(adminApp.includes("displayPriority"), true);
assert.equal(adminApp.includes("fallbackStrategy"), true);
assert.equal(adminApp.includes("validFrom"), true);
assert.equal(adminApp.includes("validUntil"), true);
assert.equal(adminApp.includes("sidMasked"), true);
assert.equal(adminApp.includes("CPS 异常池"), true);
assert.equal(adminApp.includes("CPS 指标面板"), true);
assert.equal(adminApp.includes("supplyFormDirty"), true);
assert.equal(adminApp.includes("formatAdminOperationError"), true);
assert.equal(adminApp.includes("loadSupplyCenterAdmin({ preserveDirty: false })"), true);
assert.equal(adminApp.includes("JUTUIKE_API_KEY"), false);
assert.equal(controller.includes('@Headers("x-admin-token")'), true);
assert.equal(controller.includes('@Post("items/batch-status")'), true);
assert.equal(controller.includes('@Get("metrics")'), true);
assert.equal(controller.includes("publishWorkbenchCountsChanged"), true);
assert.equal(controller.includes("JUTUIKE_API_KEY"), false);
assert.equal(service.includes("rawResponse"), false);
assert.equal(service.includes("listAdminClicks"), true);
assert.equal(service.includes("listAdminOrderSyncs"), true);
assert.equal(service.includes("previewAdminItems"), true);
assert.equal(service.includes("listExceptionPool"), true);
assert.equal(service.includes("getAdminMetrics"), true);
assert.equal(service.includes("markExceptionForRetry"), true);
assert.equal(service.includes("无有效归因的订单不能强行分配给任意用户"), true);
assert.equal(service.includes("sidMasked: click.sidMasked"), true);
assert.equal(service.includes("userId"), true);
assert.equal(service.includes("openid"), false);
assert.equal(service.includes("unionid"), false);
assert.equal(
  existsSync("apps/api/prisma/migrations/20260529110000_add_supply_center/migration.sql"),
  true
);
assert.equal(
  existsSync(
    "apps/api/prisma/migrations/20260601120000_deepen_cps_supply_commercial_loop/migration.sql"
  ),
  true
);

process.stdout.write("admin-supply-center verification passed\n");
