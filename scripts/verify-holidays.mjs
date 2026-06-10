/* global process */
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const shared = require("../packages/shared/dist/index.js");

const {
  DEFAULT_STATUTORY_HOLIDAY_CALENDAR,
  HolidayDataStatus,
  HolidayQueryStatus,
  getNextStatutoryHoliday
} = shared;

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const verifyYear = Number(process.env.HOLIDAY_VERIFY_YEAR ?? new Date().getFullYear());
const requiredYears = [verifyYear, verifyYear + 1];
const issues = [];
const notes = [];

verifyCalendar(DEFAULT_STATUTORY_HOLIDAY_CALENDAR);

if (issues.length > 0) {
  for (const issue of issues) {
    process.stderr.write(`holiday verification error: ${issue}\n`);
  }
  process.exit(1);
}

for (const note of notes) {
  process.stdout.write(`holiday verification note: ${note}\n`);
}

process.stdout.write("holiday verification passed\n");

function verifyCalendar(calendar) {
  assert.equal(calendar.region, "CN");
  assert(Array.isArray(calendar.years));

  const byYear = new Map(calendar.years.map((yearCache) => [yearCache.year, yearCache]));

  for (const year of requiredYears) {
    const yearCache = byYear.get(year);

    if (!yearCache) {
      issues.push(`${year} 年缺少缓存状态`);
      continue;
    }

    verifyYearCache(yearCache);
  }

  for (const yearCache of calendar.years) {
    verifyYearCache(yearCache);
  }

  const queryResult = getNextStatutoryHoliday({
    calendar,
    now: new Date(`${verifyYear}-05-22T10:00:00+08:00`)
  });

  if (queryResult.status === HolidayQueryStatus.NoAvailableData) {
    const nextYear = byYear.get(verifyYear + 1);

    if (nextYear?.status === HolidayDataStatus.PendingPublication) {
      notes.push(`${verifyYear + 1} 年权威通知未发布，首页应展示待发布占位`);
    } else {
      issues.push("当前日期之后没有可用节假日数据");
    }
  }
}

function verifyYearCache(yearCache) {
  if (!Number.isInteger(yearCache.year)) {
    issues.push("年份必须是整数");
    return;
  }

  if (!Object.values(HolidayDataStatus).includes(yearCache.status)) {
    issues.push(`${yearCache.year} 年数据状态无效`);
  }

  if (!yearCache.machineSource?.provider || !yearCache.machineSource?.url) {
    issues.push(`${yearCache.year} 年缺少机器同步来源`);
  }

  if (!yearCache.machineSource?.syncedAt) {
    issues.push(`${yearCache.year} 年缺少同步时间`);
  }

  if (!yearCache.machineSource?.coveredYears?.includes(yearCache.year)) {
    issues.push(`${yearCache.year} 年同步来源未声明覆盖年份`);
  }

  if (yearCache.status === HolidayDataStatus.Verified) {
    verifyAuthorityMetadata(yearCache);
  }

  if (
    yearCache.status === HolidayDataStatus.PendingPublication ||
    yearCache.status === HolidayDataStatus.PendingSync
  ) {
    if (yearCache.holidays.length > 0) {
      issues.push(`${yearCache.year} 年处于 ${yearCache.status} 时不得包含预测节假日日期`);
    }
    notes.push(`${yearCache.year} 年状态为 ${yearCache.status}`);
    return;
  }

  if (yearCache.holidays.length === 0) {
    issues.push(`${yearCache.year} 年缺少节假日区间`);
  }

  for (const holiday of yearCache.holidays) {
    if (!holiday.name) {
      issues.push(`${yearCache.year} 年存在缺少名称的节假日`);
    }

    if (holiday.year !== yearCache.year) {
      issues.push(`${holiday.name} 所属年份与缓存年份不一致`);
    }

    if (!datePattern.test(holiday.startDate) || !datePattern.test(holiday.endDate)) {
      issues.push(`${holiday.name} 日期必须使用 YYYY-MM-DD`);
      continue;
    }

    if (parseDate(holiday.endDate) < parseDate(holiday.startDate)) {
      issues.push(`${holiday.name} 结束日期早于开始日期`);
    }
  }
}

function verifyAuthorityMetadata(yearCache) {
  const authority = yearCache.authorityVerification;

  if (authority?.status !== HolidayDataStatus.Verified) {
    issues.push(`${yearCache.year} 年已核验数据的权威核验状态不一致`);
  }

  if (!authority?.url || !authority?.title || !authority?.verifiedAt) {
    issues.push(`${yearCache.year} 年已核验数据缺少权威 URL、通知标题或核验日期`);
  }
}

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}
