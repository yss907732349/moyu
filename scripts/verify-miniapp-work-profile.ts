import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  calculateWorkValueState,
  CurrencyCode,
  PaydayWeekendStrategy,
  SalaryMode,
  WorkProfileConfigStatus,
  WorkdayRuleType,
  type GetWorkProfileResponse,
  type SaveWorkProfileResponse
} from "@moyuxia/shared";
import {
  WorkProfileClientError,
  getLocalWorkProfileSnapshot,
  getWorkProfile,
  isGetWorkProfileResponse,
  isWorkProfileSnapshot,
  isSaveWorkProfileResponse,
  normalizeWorkProfileError,
  saveLocalWorkProfileSnapshot,
  saveWorkProfile
} from "../apps/miniapp/src/services/work-profile.ts";

const profile = {
  userId: "dev-user",
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
  hideModeEnabled: false,
  configStatus: WorkProfileConfigStatus.Configured,
  createdAt: "2026-05-22T00:00:00.000Z",
  updatedAt: "2026-05-22T00:00:00.000Z"
} as const;

const getResponse: GetWorkProfileResponse = {
  profile,
  configStatus: WorkProfileConfigStatus.Configured,
  snapshot: {
    salary: profile.salary,
    workTime: profile.workTime,
    workdays: profile.workdays,
    payday: profile.payday,
    hideModeEnabled: profile.hideModeEnabled,
    configStatus: WorkProfileConfigStatus.Configured,
    updatedAt: profile.updatedAt
  }
};

const saveResponse: SaveWorkProfileResponse = {
  profile,
  snapshot: getResponse.snapshot!
};

const requestSuccess = (data: unknown): typeof uni.request =>
  ((options: UniApp.RequestOptions) => {
    options.success?.({
      statusCode: 200,
      data,
      header: {},
      cookies: []
    } as UniApp.RequestSuccessCallbackResult);
    return {} as UniApp.RequestTask;
  }) as typeof uni.request;

const storage = new Map<string, unknown>();
const storageUni = {
  getStorageSync: (key: string) => storage.get(key),
  setStorageSync: (key: string, value: unknown) => {
    storage.set(key, value);
  },
  removeStorageSync: (key: string) => {
    storage.delete(key);
  }
};

(globalThis as typeof globalThis & { uni: typeof storageUni }).uni = storageUni;

assert.equal(isGetWorkProfileResponse(getResponse), true);
assert.equal(isSaveWorkProfileResponse(saveResponse), true);
assert.equal(isWorkProfileSnapshot(getResponse.snapshot), true);
assert.equal(
  (await getWorkProfile({ request: requestSuccess(getResponse) })).profile?.userId,
  "dev-user"
);
assert.equal(
  (await saveWorkProfile({ profile }, { request: requestSuccess(saveResponse) })).snapshot
    .updatedAt,
  profile.updatedAt
);

await assert.rejects(
  () => getWorkProfile({ request: requestSuccess({ profile: { bad: true } }) }),
  WorkProfileClientError
);

const requestNetworkFailure: typeof uni.request = ((options: UniApp.RequestOptions) => {
  options.fail?.({ errMsg: "request:fail timeout" });
  return {} as UniApp.RequestTask;
}) as typeof uni.request;

await assert.rejects(
  () => getWorkProfile({ request: requestNetworkFailure }),
  (error) => {
    const normalized = normalizeWorkProfileError(error);
    return normalized.message.includes("网络异常");
  }
);

saveLocalWorkProfileSnapshot(saveResponse.snapshot);
const cachedSnapshot = getLocalWorkProfileSnapshot();
assert.deepEqual(cachedSnapshot, saveResponse.snapshot);

const locallyCalculated = calculateWorkValueState({
  snapshot: cachedSnapshot,
  now: new Date("2026-05-22T10:30:00+08:00")
});
assert.equal(locallyCalculated.configStatus, WorkProfileConfigStatus.Configured);
assert.equal(locallyCalculated.amountToday > 0, true);

await assert.rejects(
  () => getWorkProfile({ request: requestNetworkFailure }),
  WorkProfileClientError
);
assert.deepEqual(getLocalWorkProfileSnapshot(), saveResponse.snapshot);

const unconfiguredState = calculateWorkValueState({
  snapshot: null,
  now: new Date("2026-05-22T10:30:00+08:00")
});
assert.equal(unconfiguredState.amountToday, 0);
assert.equal(unconfiguredState.amountPerSecond, 0);
assert.equal(unconfiguredState.effectiveWorkedSecondsToday, 0);

const hiddenState = calculateWorkValueState({
  snapshot: { ...saveResponse.snapshot, hideModeEnabled: true },
  now: new Date("2026-05-22T10:30:00+08:00")
});
assert.equal(hiddenState.displayAmountMasked, true);
assert.equal(hiddenState.hidden, true);

const homeSource = readFileSync("apps/miniapp/src/pages/home/index.vue", "utf8");
assert.equal(homeSource.includes("baseAmount"), false);
assert.equal(homeSource.includes("profitPerSecond"), false);
assert.equal(homeSource.includes("3小时28分12秒"), false);
assert.equal(homeSource.includes("距端午节"), false);
assert.equal(homeSource.includes("6 月 10 日"), false);
assert.equal(homeSource.includes("getNextStatutoryHoliday"), true);
assert.equal(homeSource.includes("DEFAULT_STATUTORY_HOLIDAY_CALENDAR"), true);
assert.equal(homeSource.includes("secondsUntilWorkEnd"), true);
assert.equal(homeSource.includes("secondsUntilRestDay"), true);
assert.equal(homeSource.includes("secondsUntilPayday"), true);
assert.equal(homeSource.includes("countdownToWorkEndText"), true);
assert.equal(homeSource.includes("toggleHiddenMode"), true);
assert.equal(homeSource.includes("hero-card-hidden"), true);
assert.equal(homeSource.includes("heroEmptyGuideText"), true);
assert.equal(homeSource.includes("先登录并创建隐者档案"), true);
assert.equal(homeSource.includes("填写薪资和上班时间，开始本地实时估算"), true);

const requestValidationFailure: typeof uni.request = ((options: UniApp.RequestOptions) => {
  options.success?.({
    statusCode: 400,
    data: {
      errorCode: "work_profile_validation_error",
      message: "工作档案校验失败",
      issues: [{ field: "salary.monthlyAmount", message: "月薪金额无效" }]
    },
    header: {},
    cookies: []
  } as UniApp.RequestSuccessCallbackResult);
  return {} as UniApp.RequestTask;
}) as typeof uni.request;

await assert.rejects(
  () => saveWorkProfile({ profile }, { request: requestValidationFailure }),
  (error) => {
    const normalized = normalizeWorkProfileError(error);
    return normalized.fieldErrors["salary.monthlyAmount"] === "月薪金额无效";
  }
);

const settingsSource = readFileSync("apps/miniapp/src/pages/work-profile/settings.vue", "utf8");
assert.equal(settingsSource.includes('switchTab({ url: "/pages/home/index" })'), true);
assert.equal(settingsSource.includes("saveLocalWorkProfileSnapshot(response.snapshot)"), true);
assert.equal(settingsSource.includes("hideModeEnabled"), true);
assert.equal(settingsSource.includes("不再展示 UI"), true);

process.stdout.write("miniapp work-profile verification passed\n");
