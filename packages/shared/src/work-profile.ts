export const SalaryMode = {
  SimpleMonthly: "simple_monthly"
} as const;

export type SalaryMode = (typeof SalaryMode)[keyof typeof SalaryMode];

export const CurrencyCode = {
  CNY: "CNY"
} as const;

export type CurrencyCode = (typeof CurrencyCode)[keyof typeof CurrencyCode];

export const WorkdayRuleType = {
  StandardWeekdays: "standard_weekdays",
  CustomWeekdays: "custom_weekdays"
} as const;

export type WorkdayRuleType = (typeof WorkdayRuleType)[keyof typeof WorkdayRuleType];

export const PaydayWeekendStrategy = {
  KeepCalendarDay: "keep_calendar_day",
  PreviousWorkday: "previous_workday",
  NextWorkday: "next_workday"
} as const;

export type PaydayWeekendStrategy =
  (typeof PaydayWeekendStrategy)[keyof typeof PaydayWeekendStrategy];

export const WorkProfileConfigStatus = {
  Unconfigured: "unconfigured",
  Partial: "partial",
  Configured: "configured"
} as const;

export type WorkProfileConfigStatus =
  (typeof WorkProfileConfigStatus)[keyof typeof WorkProfileConfigStatus];

export const WorkStatus = {
  BeforeWork: "before_work",
  Working: "working",
  OnBreak: "on_break",
  AfterWork: "after_work",
  RestDay: "rest_day"
} as const;

export type WorkStatus = (typeof WorkStatus)[keyof typeof WorkStatus];

export const WorkProfileAccessErrorCode = {
  Unauthenticated: "unauthenticated",
  Forbidden: "forbidden",
  NotFound: "not_found"
} as const;

export type WorkProfileAccessErrorCode =
  (typeof WorkProfileAccessErrorCode)[keyof typeof WorkProfileAccessErrorCode];

export interface SalaryRule {
  mode: SalaryMode;
  monthlyAmount: number;
  currency: CurrencyCode;
}

export interface WorkTimeRule {
  startTime: string;
  endTime: string;
  breaks: readonly WorkBreak[];
}

export interface WorkBreak {
  id?: string;
  startTime: string;
  endTime: string;
  label?: string;
}

export interface WorkdayRule {
  type: WorkdayRuleType;
  weekdays: readonly Weekday[];
}

export interface PaydayRule {
  dayOfMonth: number;
  weekendStrategy: PaydayWeekendStrategy;
}

export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface WorkProfile {
  userId: string;
  salary: SalaryRule;
  workTime: WorkTimeRule;
  workdays: WorkdayRule;
  payday: PaydayRule;
  hideModeEnabled: boolean;
  configStatus: typeof WorkProfileConfigStatus.Configured;
  createdAt: string;
  updatedAt: string;
}

export type WorkProfileDraft = Partial<
  Pick<WorkProfile, "userId" | "salary" | "workTime" | "workdays" | "payday" | "hideModeEnabled">
>;

export type WorkProfileSnapshot = Pick<
  WorkProfile,
  "salary" | "workTime" | "workdays" | "payday" | "hideModeEnabled" | "configStatus" | "updatedAt"
>;

export type WorkProfilePrivateView = WorkProfile;

export interface WorkProfilePublicView {
  userId: string;
}

export type WorkProfileSensitiveField =
  | "salary"
  | "workTime"
  | "workdays"
  | "payday"
  | "hideModeEnabled";

export const WORK_PROFILE_SENSITIVE_FIELDS: readonly WorkProfileSensitiveField[] = [
  "salary",
  "workTime",
  "workdays",
  "payday",
  "hideModeEnabled"
];

export interface SaveWorkProfileRequest {
  profile: Omit<WorkProfile, "createdAt" | "updatedAt" | "configStatus">;
}

export interface SaveWorkProfileResponse {
  profile: WorkProfilePrivateView;
  snapshot: WorkProfileSnapshot;
}

export interface GetWorkProfileResponse {
  profile: WorkProfilePrivateView | null;
  configStatus: WorkProfileConfigStatus;
  snapshot?: WorkProfileSnapshot;
}

export interface WorkProfileAccessDeniedResponse {
  errorCode: WorkProfileAccessErrorCode;
  message: string;
}

export interface WorkValueCalculationInput {
  snapshot: WorkProfileSnapshot | null;
  now: Date;
}

export interface WorkValueState {
  configStatus: WorkProfileConfigStatus;
  status: WorkStatus | null;
  amountToday: number;
  amountPerSecond: number;
  effectiveWorkedSecondsToday: number;
  effectiveWorkSecondsToday: number;
  workProgress: number;
  countdowns: WorkValueCountdowns;
  hidden: boolean;
  displayAmountMasked: boolean;
}

export interface WorkValueCountdowns {
  secondsUntilWorkStart?: number;
  secondsUntilWorkEnd?: number;
  secondsUntilRestDay?: number;
  secondsUntilPayday?: number;
  externalCalendarRequired?: boolean;
  externalActivityRequired?: boolean;
}

export interface ValidationIssue {
  field: string;
  message: string;
}

export class WorkProfileValidationError extends Error {
  readonly issues: readonly ValidationIssue[];

  constructor(issues: readonly ValidationIssue[]) {
    super(issues.map((issue) => `${issue.field}: ${issue.message}`).join("; "));
    this.name = "WorkProfileValidationError";
    this.issues = issues;
  }
}

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MIN_MONTHLY_AMOUNT = 1;
const MAX_MONTHLY_AMOUNT = 10_000_000;

export function validateWorkProfile(
  profile: WorkProfile | SaveWorkProfileRequest["profile"]
): void {
  const issues: ValidationIssue[] = [];

  validateSalaryRule(profile.salary, issues);
  validateWorkTimeRule(profile.workTime, issues);
  validateWorkdayRule(profile.workdays, issues);
  validatePaydayRule(profile.payday, issues);

  if (!profile.userId) {
    issues.push({ field: "userId", message: "用户标识不能为空" });
  }

  if (typeof profile.hideModeEnabled !== "boolean") {
    issues.push({ field: "hideModeEnabled", message: "隐藏模式必须是布尔值" });
  }

  if (issues.length > 0) {
    throw new WorkProfileValidationError(issues);
  }
}

export function getWorkProfileConfigStatus(
  profile: WorkProfileDraft | null | undefined
): WorkProfileConfigStatus {
  if (!profile) {
    return WorkProfileConfigStatus.Unconfigured;
  }

  const requiredFields: Array<keyof WorkProfileDraft> = [
    "salary",
    "workTime",
    "workdays",
    "payday"
  ];
  const presentCount = requiredFields.filter((field) => Boolean(profile[field])).length;

  if (presentCount === 0) {
    return WorkProfileConfigStatus.Unconfigured;
  }

  if (presentCount < requiredFields.length || !profile.userId) {
    return WorkProfileConfigStatus.Partial;
  }

  try {
    validateWorkProfile({
      userId: profile.userId,
      salary: profile.salary,
      workTime: profile.workTime,
      workdays: profile.workdays,
      payday: profile.payday,
      hideModeEnabled: profile.hideModeEnabled ?? false
    } as SaveWorkProfileRequest["profile"]);
    return WorkProfileConfigStatus.Configured;
  } catch {
    return WorkProfileConfigStatus.Partial;
  }
}

export function createWorkProfileSnapshot(profile: WorkProfile): WorkProfileSnapshot {
  return {
    salary: profile.salary,
    workTime: profile.workTime,
    workdays: profile.workdays,
    payday: profile.payday,
    hideModeEnabled: profile.hideModeEnabled,
    configStatus: profile.configStatus,
    updatedAt: profile.updatedAt
  };
}

export function toPublicWorkProfile(profile: WorkProfile): WorkProfilePublicView {
  return { userId: profile.userId };
}

export function assertOwnWorkProfileAccess(actorUserId?: string, targetUserId?: string): void {
  if (!actorUserId) {
    throw new WorkProfileAccessError(WorkProfileAccessErrorCode.Unauthenticated, "请先登录");
  }

  if (!targetUserId || actorUserId !== targetUserId) {
    throw new WorkProfileAccessError(WorkProfileAccessErrorCode.Forbidden, "不能读取他人工作档案");
  }
}

export class WorkProfileAccessError extends Error {
  readonly errorCode: WorkProfileAccessErrorCode;

  constructor(errorCode: WorkProfileAccessErrorCode, message: string) {
    super(message);
    this.name = "WorkProfileAccessError";
    this.errorCode = errorCode;
  }
}

export function calculateWorkValueState(input: WorkValueCalculationInput): WorkValueState {
  const { snapshot, now } = input;

  if (!snapshot || snapshot.configStatus !== WorkProfileConfigStatus.Configured) {
    return {
      configStatus: snapshot?.configStatus ?? WorkProfileConfigStatus.Unconfigured,
      status: null,
      amountToday: 0,
      amountPerSecond: 0,
      effectiveWorkedSecondsToday: 0,
      effectiveWorkSecondsToday: 0,
      workProgress: 0,
      countdowns: {
        externalCalendarRequired: true,
        externalActivityRequired: true
      },
      hidden: Boolean(snapshot?.hideModeEnabled),
      displayAmountMasked: false
    };
  }

  const workStart = dateAtTime(now, snapshot.workTime.startTime);
  const workEnd = dateAtTime(now, snapshot.workTime.endTime);
  const breaks = snapshot.workTime.breaks.map((item) => ({
    start: dateAtTime(now, item.startTime),
    end: dateAtTime(now, item.endTime)
  }));
  const effectiveWorkSecondsToday = calculateEffectiveSecondsBetween(workStart, workEnd, breaks);
  const amountPerSecond =
    effectiveWorkSecondsToday > 0
      ? snapshot.salary.monthlyAmount / getMonthlyWorkSeconds(snapshot, now)
      : 0;
  const isWorkday = isDateWorkday(now, snapshot.workdays);
  const status = resolveWorkStatus(now, snapshot);
  const effectiveWorkedSecondsToday = isWorkday
    ? calculateEffectiveSecondsBetween(workStart, minDate(now, workEnd), breaks)
    : 0;

  return {
    configStatus: snapshot.configStatus,
    status,
    amountToday: roundMoney(effectiveWorkedSecondsToday * amountPerSecond),
    amountPerSecond,
    effectiveWorkedSecondsToday,
    effectiveWorkSecondsToday,
    workProgress:
      effectiveWorkSecondsToday > 0
        ? clamp(effectiveWorkedSecondsToday / effectiveWorkSecondsToday, 0, 1)
        : 0,
    countdowns: {
      ...calculateWorkCountdowns(now, snapshot),
      externalCalendarRequired: true,
      externalActivityRequired: true
    },
    hidden: snapshot.hideModeEnabled,
    displayAmountMasked: snapshot.hideModeEnabled
  };
}

export function resolveWorkStatus(now: Date, snapshot: WorkProfileSnapshot): WorkStatus {
  if (!isDateWorkday(now, snapshot.workdays)) {
    return WorkStatus.RestDay;
  }

  const workStart = dateAtTime(now, snapshot.workTime.startTime);
  const workEnd = dateAtTime(now, snapshot.workTime.endTime);

  if (now < workStart) {
    return WorkStatus.BeforeWork;
  }

  if (now >= workEnd) {
    return WorkStatus.AfterWork;
  }

  if (
    snapshot.workTime.breaks.some(
      (item) => now >= dateAtTime(now, item.startTime) && now < dateAtTime(now, item.endTime)
    )
  ) {
    return WorkStatus.OnBreak;
  }

  return WorkStatus.Working;
}

export function isDateWorkday(date: Date, rule: WorkdayRule): boolean {
  const weekday = toWeekday(date);
  const weekdays =
    rule.type === WorkdayRuleType.StandardWeekdays ? ([1, 2, 3, 4, 5] as const) : rule.weekdays;

  return weekdays.includes(weekday);
}

export function calculateEffectiveSecondsBetween(
  start: Date,
  end: Date,
  breaks: readonly { start: Date; end: Date }[] = []
): number {
  if (end <= start) {
    return 0;
  }

  const totalSeconds = secondsBetween(start, end);
  const breakSeconds = breaks.reduce((sum, item) => {
    const overlapStart = maxDate(start, item.start);
    const overlapEnd = minDate(end, item.end);
    return sum + secondsBetween(overlapStart, overlapEnd);
  }, 0);

  return Math.max(0, totalSeconds - breakSeconds);
}

export function calculateWorkCountdowns(
  now: Date,
  snapshot: WorkProfileSnapshot
): WorkValueCountdowns {
  const status = resolveWorkStatus(now, snapshot);
  const workStart = dateAtTime(now, snapshot.workTime.startTime);
  const workEnd = dateAtTime(now, snapshot.workTime.endTime);

  return {
    secondsUntilWorkStart:
      status === WorkStatus.BeforeWork
        ? secondsBetween(now, workStart)
        : secondsUntilNextWorkStart(now, snapshot),
    secondsUntilWorkEnd:
      status === WorkStatus.Working || status === WorkStatus.OnBreak
        ? secondsBetween(now, workEnd)
        : undefined,
    secondsUntilRestDay: secondsUntilNextRestDay(now, snapshot.workdays),
    secondsUntilPayday: secondsUntilNextPayday(now, snapshot.payday)
  };
}

function validateSalaryRule(rule: SalaryRule | undefined, issues: ValidationIssue[]): void {
  if (!rule) {
    issues.push({ field: "salary", message: "薪资规则不能为空" });
    return;
  }

  if (rule.mode !== SalaryMode.SimpleMonthly) {
    issues.push({ field: "salary.mode", message: "第一版仅支持 simple_monthly" });
  }

  if (rule.currency !== CurrencyCode.CNY) {
    issues.push({ field: "salary.currency", message: "第一版仅支持 CNY" });
  }

  if (
    !Number.isFinite(rule.monthlyAmount) ||
    rule.monthlyAmount < MIN_MONTHLY_AMOUNT ||
    rule.monthlyAmount > MAX_MONTHLY_AMOUNT
  ) {
    issues.push({
      field: "salary.monthlyAmount",
      message: `月薪金额必须在 ${MIN_MONTHLY_AMOUNT} 到 ${MAX_MONTHLY_AMOUNT} 之间`
    });
  }
}

function validateWorkTimeRule(rule: WorkTimeRule | undefined, issues: ValidationIssue[]): void {
  if (!rule) {
    issues.push({ field: "workTime", message: "工作时间不能为空" });
    return;
  }

  const start = parseTimeToSeconds(rule.startTime);
  const end = parseTimeToSeconds(rule.endTime);

  if (start === null) {
    issues.push({ field: "workTime.startTime", message: "上班开始时间格式必须为 HH:mm" });
  }

  if (end === null) {
    issues.push({ field: "workTime.endTime", message: "上班结束时间格式必须为 HH:mm" });
  }

  if (start !== null && end !== null && end <= start) {
    issues.push({ field: "workTime.endTime", message: "上班结束时间必须晚于开始时间" });
  }

  const parsedBreaks = rule.breaks.map((item, index) => ({
    index,
    start: parseTimeToSeconds(item.startTime),
    end: parseTimeToSeconds(item.endTime)
  }));

  for (const item of parsedBreaks) {
    if (item.start === null || item.end === null) {
      issues.push({
        field: `workTime.breaks.${item.index}`,
        message: "休息段时间格式必须为 HH:mm"
      });
      continue;
    }

    if (item.end <= item.start) {
      issues.push({
        field: `workTime.breaks.${item.index}`,
        message: "休息段结束时间必须晚于开始时间"
      });
    }

    if (start !== null && end !== null && (item.start < start || item.end > end)) {
      issues.push({ field: `workTime.breaks.${item.index}`, message: "休息段必须位于上班时段内" });
    }
  }

  const validBreaks = parsedBreaks.filter(
    (item): item is { index: number; start: number; end: number } =>
      item.start !== null && item.end !== null && item.end > item.start
  );
  const sortedBreaks = [...validBreaks].sort((first, second) => first.start - second.start);

  for (let index = 1; index < sortedBreaks.length; index += 1) {
    if (sortedBreaks[index].start < sortedBreaks[index - 1].end) {
      issues.push({ field: "workTime.breaks", message: "休息段不能重叠" });
      break;
    }
  }
}

function validateWorkdayRule(rule: WorkdayRule | undefined, issues: ValidationIssue[]): void {
  if (!rule) {
    issues.push({ field: "workdays", message: "工作日规则不能为空" });
    return;
  }

  if (![WorkdayRuleType.StandardWeekdays, WorkdayRuleType.CustomWeekdays].includes(rule.type)) {
    issues.push({ field: "workdays.type", message: "工作日规则类型无效" });
  }

  const weekdays = rule.type === WorkdayRuleType.StandardWeekdays ? [1, 2, 3, 4, 5] : rule.weekdays;
  const uniqueWeekdays = new Set(weekdays);

  if (uniqueWeekdays.size === 0) {
    issues.push({ field: "workdays.weekdays", message: "至少需要一个有效工作日" });
  }

  for (const weekday of uniqueWeekdays) {
    if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7) {
      issues.push({ field: "workdays.weekdays", message: "星期值必须在 1 到 7 之间" });
      break;
    }
  }
}

function validatePaydayRule(rule: PaydayRule | undefined, issues: ValidationIssue[]): void {
  if (!rule) {
    issues.push({ field: "payday", message: "发薪日规则不能为空" });
    return;
  }

  if (!Number.isInteger(rule.dayOfMonth) || rule.dayOfMonth < 1 || rule.dayOfMonth > 31) {
    issues.push({ field: "payday.dayOfMonth", message: "发薪日必须位于每月第 1 日至第 31 日" });
  }

  if (!Object.values(PaydayWeekendStrategy).includes(rule.weekendStrategy)) {
    issues.push({ field: "payday.weekendStrategy", message: "周末处理策略无效" });
  }
}

function parseTimeToSeconds(value: string): number | null {
  const match = TIME_PATTERN.exec(value);

  if (!match) {
    return null;
  }

  return Number(match[1]) * 60 * 60 + Number(match[2]) * 60;
}

function dateAtTime(base: Date, time: string): Date {
  const seconds = parseTimeToSeconds(time);
  const next = new Date(base);
  next.setHours(0, 0, 0, 0);
  next.setSeconds(seconds ?? 0);
  return next;
}

function secondsBetween(start: Date, end: Date): number {
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
}

function getMonthlyWorkSeconds(snapshot: WorkProfileSnapshot, now: Date): number {
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  let workdayCount = 0;

  for (let day = 1; day <= daysInMonth; day += 1) {
    if (isDateWorkday(new Date(now.getFullYear(), now.getMonth(), day), snapshot.workdays)) {
      workdayCount += 1;
    }
  }

  const dailySeconds = calculateEffectiveSecondsBetween(
    dateAtTime(now, snapshot.workTime.startTime),
    dateAtTime(now, snapshot.workTime.endTime),
    snapshot.workTime.breaks.map((item) => ({
      start: dateAtTime(now, item.startTime),
      end: dateAtTime(now, item.endTime)
    }))
  );

  return Math.max(1, workdayCount * dailySeconds);
}

function secondsUntilNextWorkStart(now: Date, snapshot: WorkProfileSnapshot): number | undefined {
  for (let offset = 0; offset <= 7; offset += 1) {
    const candidate = addDays(now, offset);

    if (!isDateWorkday(candidate, snapshot.workdays)) {
      continue;
    }

    const start = dateAtTime(candidate, snapshot.workTime.startTime);

    if (start > now) {
      return secondsBetween(now, start);
    }
  }

  return undefined;
}

function secondsUntilNextRestDay(now: Date, rule: WorkdayRule): number | undefined {
  for (let offset = 0; offset <= 7; offset += 1) {
    const candidate = addDays(now, offset);

    if (!isDateWorkday(candidate, rule)) {
      const startOfDay = new Date(candidate);
      startOfDay.setHours(0, 0, 0, 0);
      return secondsBetween(now, startOfDay);
    }
  }

  return undefined;
}

function secondsUntilNextPayday(now: Date, rule: PaydayRule): number {
  const candidate = normalizePayday(
    new Date(now.getFullYear(), now.getMonth(), rule.dayOfMonth),
    rule
  );

  if (candidate > now) {
    return secondsBetween(now, candidate);
  }

  return secondsBetween(
    now,
    normalizePayday(new Date(now.getFullYear(), now.getMonth() + 1, rule.dayOfMonth), rule)
  );
}

function normalizePayday(date: Date, rule: PaydayRule): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);

  while (normalized.getMonth() !== date.getMonth()) {
    normalized.setDate(normalized.getDate() - 1);
  }

  if (rule.weekendStrategy === PaydayWeekendStrategy.KeepCalendarDay) {
    return normalized;
  }

  const direction = rule.weekendStrategy === PaydayWeekendStrategy.PreviousWorkday ? -1 : 1;

  while (normalized.getDay() === 0 || normalized.getDay() === 6) {
    normalized.setDate(normalized.getDate() + direction);
  }

  return normalized;
}

function toWeekday(date: Date): Weekday {
  const day = date.getDay();
  return (day === 0 ? 7 : day) as Weekday;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function minDate(first: Date, second: Date): Date {
  return first <= second ? first : second;
}

function maxDate(first: Date, second: Date): Date {
  return first >= second ? first : second;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
