export const HolidayDataStatus = {
  Verified: "verified",
  PendingVerification: "pending_verification",
  PendingPublication: "pending_publication",
  PendingSync: "pending_sync",
  SyncFailed: "sync_failed"
} as const;

export type HolidayDataStatus = (typeof HolidayDataStatus)[keyof typeof HolidayDataStatus];

export const HolidayQueryStatus = {
  Available: "available",
  Ongoing: "ongoing",
  NoAvailableData: "no_available_data"
} as const;

export type HolidayQueryStatus = (typeof HolidayQueryStatus)[keyof typeof HolidayQueryStatus];

export interface HolidayMachineSource {
  provider: string;
  url: string;
  syncedAt: string;
  coveredYears: readonly number[];
}

export interface HolidayAuthorityVerification {
  status: HolidayDataStatus;
  url?: string;
  title?: string;
  verifiedAt?: string;
  documentNumber?: string;
}

export interface StatutoryHoliday {
  name: string;
  year: number;
  startDate: string;
  endDate: string;
}

export interface StaticHolidayYearCache {
  year: number;
  status: HolidayDataStatus;
  machineSource: HolidayMachineSource;
  authorityVerification: HolidayAuthorityVerification;
  holidays: readonly StatutoryHoliday[];
}

export interface StaticHolidayCalendar {
  region: "CN";
  years: readonly StaticHolidayYearCache[];
}

export interface NextStatutoryHolidayAvailableResult {
  status: typeof HolidayQueryStatus.Available | typeof HolidayQueryStatus.Ongoing;
  holiday: StatutoryHoliday;
  dataStatus: HolidayDataStatus;
  secondsUntilStart: number;
  daysUntilStart: number;
}

export interface NextStatutoryHolidayUnavailableResult {
  status: typeof HolidayQueryStatus.NoAvailableData;
  reason: Exclude<HolidayDataStatus, typeof HolidayDataStatus.Verified>;
}

export type NextStatutoryHolidayResult =
  | NextStatutoryHolidayAvailableResult
  | NextStatutoryHolidayUnavailableResult;

export function getNextStatutoryHoliday(input: {
  calendar: StaticHolidayCalendar;
  now: Date;
}): NextStatutoryHolidayResult {
  const today = startOfLocalDay(input.now);
  const candidates = input.calendar.years
    .filter((year) => year.status === HolidayDataStatus.Verified)
    .flatMap((year) => year.holidays.map((holiday) => ({ holiday, dataStatus: year.status })))
    .filter(({ holiday }) => parseLocalDate(holiday.endDate) >= today)
    .sort(
      (first, second) =>
        parseLocalDate(first.holiday.startDate).getTime() -
        parseLocalDate(second.holiday.startDate).getTime()
    );

  const next = candidates[0];

  if (next) {
    const start = parseLocalDate(next.holiday.startDate);
    const end = parseLocalDate(next.holiday.endDate);
    const ongoing = today >= start && today <= end;
    const secondsUntilStart = ongoing
      ? 0
      : Math.max(0, Math.floor((start.getTime() - input.now.getTime()) / 1000));

    return {
      status: ongoing ? HolidayQueryStatus.Ongoing : HolidayQueryStatus.Available,
      holiday: next.holiday,
      dataStatus: next.dataStatus,
      secondsUntilStart,
      daysUntilStart: ongoing ? 0 : Math.ceil(secondsUntilStart / 86400)
    };
  }

  const currentYear = input.now.getFullYear();
  const currentOrFutureYear = input.calendar.years
    .filter((year) => year.year >= currentYear)
    .sort((first, second) => first.year - second.year)
    .find((year) => year.status !== HolidayDataStatus.Verified);
  const reason: NextStatutoryHolidayUnavailableResult["reason"] =
    currentOrFutureYear?.status === HolidayDataStatus.PendingVerification ||
    currentOrFutureYear?.status === HolidayDataStatus.PendingPublication ||
    currentOrFutureYear?.status === HolidayDataStatus.PendingSync ||
    currentOrFutureYear?.status === HolidayDataStatus.SyncFailed
      ? currentOrFutureYear.status
      : HolidayDataStatus.PendingSync;

  return {
    status: HolidayQueryStatus.NoAvailableData,
    reason
  };
}

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfLocalDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export { DEFAULT_STATUTORY_HOLIDAY_CALENDAR } from "./static-holiday-calendar.data";
