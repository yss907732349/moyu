/* global process */
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const shared = require("../packages/shared/dist/index.js");

const {
  CurrencyCode,
  PaydayWeekendStrategy,
  SalaryMode,
  WorkProfileAccessError,
  WorkProfileAccessErrorCode,
  WorkProfileConfigStatus,
  WorkProfileValidationError,
  WorkStatus,
  WorkdayRuleType,
  WORK_PROFILE_SENSITIVE_FIELDS,
  assertOwnWorkProfileAccess,
  calculateEffectiveSecondsBetween,
  calculateWorkValueState,
  createWorkProfileSnapshot,
  getWorkProfileConfigStatus,
  resolveWorkStatus,
  toPublicWorkProfile,
  validateWorkProfile
} = shared;

const profile = {
  userId: "user-1",
  salary: {
    mode: SalaryMode.SimpleMonthly,
    monthlyAmount: 22000,
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
  hideModeEnabled: false,
  configStatus: WorkProfileConfigStatus.Configured,
  createdAt: "2026-05-22T00:00:00.000Z",
  updatedAt: "2026-05-22T00:00:00.000Z"
};

validateWorkProfile(profile);

assert.equal(getWorkProfileConfigStatus(null), WorkProfileConfigStatus.Unconfigured);
assert.equal(
  getWorkProfileConfigStatus({ salary: profile.salary }),
  WorkProfileConfigStatus.Partial
);
assert.equal(getWorkProfileConfigStatus(profile), WorkProfileConfigStatus.Configured);

assert.throws(
  () => validateWorkProfile({ ...profile, salary: { ...profile.salary, monthlyAmount: 0 } }),
  WorkProfileValidationError
);
assert.throws(
  () => validateWorkProfile({ ...profile, salary: { ...profile.salary, currency: "USD" } }),
  WorkProfileValidationError
);
assert.throws(
  () => validateWorkProfile({ ...profile, salary: { ...profile.salary, mode: "hourly" } }),
  WorkProfileValidationError
);
assert.throws(
  () =>
    validateWorkProfile({
      ...profile,
      workTime: { ...profile.workTime, endTime: "09:00" }
    }),
  WorkProfileValidationError
);
assert.throws(
  () =>
    validateWorkProfile({
      ...profile,
      workTime: {
        ...profile.workTime,
        breaks: [
          { startTime: "12:00", endTime: "13:30" },
          { startTime: "13:00", endTime: "14:00" }
        ]
      }
    }),
  WorkProfileValidationError
);
assert.throws(
  () =>
    validateWorkProfile({
      ...profile,
      workdays: { type: WorkdayRuleType.CustomWeekdays, weekdays: [] }
    }),
  WorkProfileValidationError
);
assert.throws(
  () =>
    validateWorkProfile({
      ...profile,
      payday: { ...profile.payday, dayOfMonth: 32 }
    }),
  WorkProfileValidationError
);
assert.throws(
  () =>
    validateWorkProfile({
      ...profile,
      payday: { ...profile.payday, weekendStrategy: "nearest_workday" }
    }),
  WorkProfileValidationError
);

const snapshot = createWorkProfileSnapshot(profile);
const getResponse = {
  profile,
  configStatus: WorkProfileConfigStatus.Configured,
  snapshot
};
const saveResponse = {
  profile,
  snapshot
};
assert.equal(getResponse.profile.userId, "user-1");
assert.equal(getResponse.snapshot.configStatus, WorkProfileConfigStatus.Configured);
assert.equal(saveResponse.snapshot.updatedAt, profile.updatedAt);

const beforeWork = new Date("2026-05-22T09:00:00+08:00");
const working = new Date("2026-05-22T10:30:00+08:00");
const onBreak = new Date("2026-05-22T12:30:00+08:00");
const afterWork = new Date("2026-05-22T19:00:00+08:00");
const restDay = new Date("2026-05-23T10:30:00+08:00");

assert.equal(resolveWorkStatus(beforeWork, snapshot), WorkStatus.BeforeWork);
assert.equal(resolveWorkStatus(working, snapshot), WorkStatus.Working);
assert.equal(resolveWorkStatus(onBreak, snapshot), WorkStatus.OnBreak);
assert.equal(resolveWorkStatus(afterWork, snapshot), WorkStatus.AfterWork);
assert.equal(resolveWorkStatus(restDay, snapshot), WorkStatus.RestDay);

const effectiveSeconds = calculateEffectiveSecondsBetween(
  new Date("2026-05-22T09:30:00+08:00"),
  new Date("2026-05-22T18:30:00+08:00"),
  [
    {
      start: new Date("2026-05-22T12:00:00+08:00"),
      end: new Date("2026-05-22T13:30:00+08:00")
    }
  ]
);
assert.equal(effectiveSeconds, 7.5 * 60 * 60);

const workingState = calculateWorkValueState({ snapshot, now: working });
const breakState = calculateWorkValueState({ snapshot, now: onBreak });
assert.equal(workingState.status, WorkStatus.Working);
assert(workingState.amountPerSecond > 0);
assert(workingState.amountToday > 0);
assert.equal(breakState.status, WorkStatus.OnBreak);
assert.equal(
  breakState.amountToday,
  calculateWorkValueState({ snapshot, now: new Date("2026-05-22T12:00:00+08:00") }).amountToday
);
assert.equal(workingState.countdowns.externalCalendarRequired, true);
assert.equal(workingState.countdowns.externalActivityRequired, true);

const hiddenState = calculateWorkValueState({
  snapshot: { ...snapshot, hideModeEnabled: true },
  now: working
});
assert.equal(hiddenState.displayAmountMasked, true);
assert.equal(hiddenState.hidden, true);

const unconfiguredState = calculateWorkValueState({ snapshot: null, now: working });
assert.equal(unconfiguredState.configStatus, WorkProfileConfigStatus.Unconfigured);
assert.equal(unconfiguredState.amountToday, 0);
assert.equal(unconfiguredState.status, null);

assert.deepEqual(toPublicWorkProfile(profile), { userId: "user-1" });
for (const field of WORK_PROFILE_SENSITIVE_FIELDS) {
  assert.equal(field in toPublicWorkProfile(profile), false);
}

assert.doesNotThrow(() => assertOwnWorkProfileAccess("user-1", "user-1"));
assert.throws(() => assertOwnWorkProfileAccess(undefined, "user-1"), WorkProfileAccessError);
try {
  assertOwnWorkProfileAccess("user-1", "user-2");
} catch (error) {
  assert(error instanceof WorkProfileAccessError);
  assert.equal(error.errorCode, WorkProfileAccessErrorCode.Forbidden);
}

process.stdout.write("work-profile verification passed\n");
