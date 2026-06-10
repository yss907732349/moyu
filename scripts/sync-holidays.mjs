/* global fetch, process */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(rootDir, "packages/shared/src/static-holiday-calendar.data.ts");
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const currentYear = new Date().getFullYear();
const years = (process.env.HOLIDAY_SYNC_YEARS ?? `${currentYear},${currentYear + 1}`)
  .split(",")
  .map((item) => Number(item.trim()))
  .filter((item) => Number.isInteger(item));

if (years.length === 0) {
  fail("HOLIDAY_SYNC_YEARS 未提供有效年份");
}

const previousContent = readFileSync(outputPath, "utf8");

try {
  const yearCaches = [];

  for (const year of years) {
    const syncedAt = new Date().toISOString();
    const sourceUrl = `https://timor.tech/api/holiday/year/${year}`;
    const response = await fetch(sourceUrl);

    if (!response.ok) {
      throw new Error(`${year} 年接口响应异常：${response.status}`);
    }

    const payload = await response.json();
    const holidays = normalizeTimorHolidayPayload(payload, year);

    if (holidays.length === 0) {
      throw new Error(`${year} 年接口未返回可用节假日区间`);
    }

    yearCaches.push({
      year,
      status: "pending_verification",
      machineSource: {
        provider: "timor.tech",
        url: sourceUrl,
        syncedAt,
        coveredYears: [year]
      },
      authorityVerification: {
        status: "pending_verification"
      },
      holidays
    });
  }

  const calendar = {
    region: "CN",
    years: yearCaches
  };

  validateCalendar(calendar);
  writeFileSync(outputPath, renderCalendarDataModule(calendar), "utf8");
  process.stdout.write(`holiday cache synced: ${years.join(", ")}\n`);
} catch (error) {
  writeFileSync(outputPath, previousContent, "utf8");
  fail(error instanceof Error ? error.message : String(error));
}

function normalizeTimorHolidayPayload(payload, year) {
  if (!payload || typeof payload !== "object" || !payload.holiday) {
    throw new Error(`${year} 年接口字段缺失：holiday`);
  }

  const days = Object.values(payload.holiday)
    .filter((item) => item && typeof item === "object" && item.holiday === true)
    .map((item) => ({
      name: String(item.name ?? "").trim(),
      date: String(item.date ?? "").trim()
    }))
    .filter(
      (item) => item.name && datePattern.test(item.date) && Number(item.date.slice(0, 4)) === year
    )
    .sort((first, second) => first.date.localeCompare(second.date));

  const ranges = [];

  for (const day of days) {
    const previous = ranges.at(-1);

    if (previous && previous.name === day.name && isNextDate(previous.endDate, day.date)) {
      previous.endDate = day.date;
      continue;
    }

    ranges.push({
      name: day.name,
      year,
      startDate: day.date,
      endDate: day.date
    });
  }

  return ranges;
}

function isNextDate(previousDate, nextDate) {
  const previous = parseDate(previousDate);
  previous.setDate(previous.getDate() + 1);
  return formatDate(previous) === nextDate;
}

function validateCalendar(calendar) {
  if (calendar.region !== "CN" || !Array.isArray(calendar.years)) {
    throw new Error("节假日缓存结构不合法");
  }

  for (const yearCache of calendar.years) {
    if (!Number.isInteger(yearCache.year)) {
      throw new Error("节假日年份不合法");
    }

    for (const holiday of yearCache.holidays) {
      if (!datePattern.test(holiday.startDate) || !datePattern.test(holiday.endDate)) {
        throw new Error(`${holiday.name} 日期格式不合法`);
      }

      if (parseDate(holiday.endDate) < parseDate(holiday.startDate)) {
        throw new Error(`${holiday.name} 结束日期早于开始日期`);
      }
    }
  }
}

function renderCalendarDataModule(calendar) {
  return `import type { StaticHolidayCalendar } from "./static-holiday-calendar";\n\nexport const DEFAULT_STATUTORY_HOLIDAY_CALENDAR: StaticHolidayCalendar = ${JSON.stringify(
    calendar,
    null,
    2
  )} as const;\n`;
}

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fail(message) {
  process.stderr.write(`holiday sync failed: ${message}\n`);
  process.exit(1);
}
