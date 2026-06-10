/* global process */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const service = readFileSync("apps/api/src/supply-center.service.ts", "utf8");
const controller = readFileSync("apps/api/src/supply-center.controller.ts", "utf8");
const appModule = readFileSync("apps/api/src/app.module.ts", "utf8");
const schema = readFileSync("apps/api/prisma/schema.prisma", "utf8");

assert.equal(controller.includes('@Controller("supply-center")'), true);
assert.equal(controller.includes('@Post("items/:itemId/click")'), true);
assert.equal(controller.includes('@Controller("admin/supply-center")'), true);
assert.equal(controller.includes('@Headers("x-admin-token")'), true);
assert.equal(controller.includes("items/batch-status"), true);
assert.equal(controller.includes("items/:itemId/copy"), true);
assert.equal(controller.includes("public-preview"), true);
assert.equal(controller.includes("exceptions"), true);
assert.equal(controller.includes("metrics"), true);
assert.equal(controller.includes("traces"), true);
assert.equal(service.includes("JUTUIKE_API_KEY"), true);
assert.equal(service.includes("createSid"), true);
assert.equal(service.includes("assertSupplySidSafe"), true);
assert.equal(service.includes("digestSid"), true);
assert.equal(service.includes("sidDigest"), true);
assert.equal(service.includes("sidMasked"), true);
assert.equal(service.includes("findReusableLinkedClick"), true);
assert.equal(service.includes("SupplyFallbackStrategy"), true);
assert.equal(service.includes("SupplyTransferAttemptStatus"), true);
assert.equal(service.includes("syncJutuikeOrders"), true);
assert.equal(service.includes("importCpsOrder"), true);
assert.equal(service.includes("SidMissing"), true);
assert.equal(service.includes("ActivityMismatch"), true);
assert.equal(service.includes("SidExpired"), true);
assert.equal(service.includes("SupplyLedgerSyncStatus.Excluded"), true);
assert.equal(service.includes("SupplyLedgerSyncStatus.RolledBack"), true);
assert.equal(appModule.includes("SupplyCenterController"), true);
assert.equal(appModule.includes("AdminSupplyCenterController"), true);
assert.equal(appModule.includes("SupplyCenterService"), true);
assert.equal(schema.includes("model SupplyItem"), true);
assert.equal(schema.includes("model SupplyClick"), true);
assert.equal(schema.includes("model SupplyTransferAttempt"), true);
assert.equal(schema.includes("model SupplyOrderSync"), true);
assert.equal(schema.includes("sidDigest"), true);
assert.equal(schema.includes("attributionWindowEndsAt"), true);
assert.equal(schema.includes("fallbackStrategy"), true);
assert.equal(schema.includes("@@unique([sourceProvider, sourceOrderId])"), true);
assert.equal(service.includes("ledgerBillId: record.ledgerBillId"), true);
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
assert.equal(service.includes("openid"), false);
assert.equal(service.includes("JUTUIKE_API_KEY") && !controller.includes("JUTUIKE_API_KEY"), true);

process.stdout.write("supply-center-api verification passed\n");
