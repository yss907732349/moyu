/* global process */
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const shared = require("../packages/shared/dist/index.js");
const { WorkProfileController } = require("../apps/api/dist/work-profile.controller.js");
const { WorkProfileService } = require("../apps/api/dist/work-profile.service.js");

const {
  CurrencyCode,
  PaydayWeekendStrategy,
  SalaryMode,
  WorkProfileConfigStatus,
  WorkdayRuleType
} = shared;

const records = new Map();

const prisma = {
  workProfile: {
    async findUnique({ where }) {
      return records.get(where.userId) ?? null;
    },
    async upsert({ where, create, update }) {
      const now = new Date("2026-05-22T08:00:00.000Z");
      const existing = records.get(where.userId);
      const record = existing
        ? { ...existing, ...update, updatedAt: new Date("2026-05-22T09:00:00.000Z") }
        : { id: "profile-1", ...create, createdAt: now, updatedAt: now };
      records.set(where.userId, record);
      return record;
    }
  }
};

const context = {
  getCurrentUser() {
    return { userId: "dev-user", source: "temporary-dev-placeholder" };
  }
};

const service = new WorkProfileService(prisma);
const controller = new WorkProfileController(context, service);

const emptyResponse = await controller.getMine();
assert.equal(emptyResponse.profile, null);
assert.equal(emptyResponse.configStatus, WorkProfileConfigStatus.Unconfigured);

const request = {
  profile: {
    userId: "client-supplied-user",
    salary: {
      mode: SalaryMode.SimpleMonthly,
      monthlyAmount: 18000,
      currency: CurrencyCode.CNY
    },
    workTime: {
      startTime: "09:30",
      endTime: "18:30",
      breaks: [{ id: "lunch", startTime: "12:00", endTime: "13:30", label: "午休" }]
    },
    workdays: {
      type: WorkdayRuleType.StandardWeekdays,
      weekdays: [1, 2, 3, 4, 5]
    },
    payday: {
      dayOfMonth: 10,
      weekendStrategy: PaydayWeekendStrategy.KeepCalendarDay
    },
    hideModeEnabled: false
  }
};

const firstSave = await controller.saveMine(request);
assert.equal(firstSave.profile.userId, "dev-user");
assert.equal(firstSave.profile.salary.monthlyAmount, 18000);
assert.equal(firstSave.snapshot.configStatus, WorkProfileConfigStatus.Configured);

const secondSave = await controller.saveMine({
  profile: {
    ...request.profile,
    salary: { ...request.profile.salary, monthlyAmount: 21000 },
    hideModeEnabled: true
  }
});
assert.equal(secondSave.profile.salary.monthlyAmount, 21000);
assert.equal(secondSave.profile.hideModeEnabled, true);
assert.equal(records.size, 1);

const loaded = await controller.getMine();
assert.equal(loaded.profile.salary.monthlyAmount, 21000);
assert.equal(loaded.snapshot.hideModeEnabled, true);

await assert.rejects(
  () =>
    controller.saveMine({
      profile: {
        ...request.profile,
        salary: { ...request.profile.salary, monthlyAmount: 0 }
      }
    }),
  (error) =>
    typeof error?.getStatus === "function" &&
    error.getStatus() === 400 &&
    error.response?.issues?.some((issue) => issue.field === "salary.monthlyAmount")
);

process.stdout.write("work-profile api verification passed\n");
