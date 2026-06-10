export interface FormatDisplayTimeOptions {
  now?: Date | string | number;
  invalidFallback?: string;
}

export function formatDisplayTime(
  value: Date | string | number | undefined | null,
  options: FormatDisplayTimeOptions = {}
): string {
  const date = toValidDate(value);
  if (!date) {
    return options.invalidFallback ?? "--";
  }

  const now = toValidDate(options.now) ?? new Date();
  const dayDelta = differenceInCalendarDays(now, date);
  const time = `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;

  if (dayDelta === 0) {
    return time;
  }

  if (dayDelta > 0 && dayDelta <= 3) {
    return `${dayDelta}天前`;
  }

  const monthDayTime = `${date.getMonth() + 1}月${date.getDate()}日 ${time}`;
  if (date.getFullYear() === now.getFullYear()) {
    return monthDayTime;
  }

  return `${date.getFullYear()}年${monthDayTime}`;
}

function differenceInCalendarDays(later: Date, earlier: Date): number {
  const laterStart = startOfLocalDay(later).getTime();
  const earlierStart = startOfLocalDay(earlier).getTime();
  return Math.round((laterStart - earlierStart) / 86400000);
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toValidDate(value: Date | string | number | undefined | null): Date | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}
