import { Injectable } from "@nestjs/common";
import { type Prisma, type WorkProfile as WorkProfileRecord } from "@prisma/client";
import {
  WorkProfileConfigStatus,
  WorkdayRuleType,
  createWorkProfileSnapshot,
  validateWorkProfile,
  type GetWorkProfileResponse,
  type SaveWorkProfileRequest,
  type SaveWorkProfileResponse,
  type Weekday,
  type WorkBreak,
  type WorkProfile
} from "@moyuxia/shared";
import { PrismaService } from "./prisma.service";

@Injectable()
export class WorkProfileService {
  private readonly memoryProfiles = new Map<string, WorkProfile>();

  constructor(private readonly prisma: PrismaService) {}

  async getByUserId(userId: string): Promise<GetWorkProfileResponse> {
    if (!this.isDatabaseConfigured()) {
      const profile = this.memoryProfiles.get(userId) ?? null;

      if (!profile) {
        return {
          profile: null,
          configStatus: WorkProfileConfigStatus.Unconfigured
        };
      }

      return {
        profile,
        configStatus: profile.configStatus,
        snapshot: createWorkProfileSnapshot(profile)
      };
    }

    const record = await this.prisma.workProfile.findUnique({ where: { userId } });

    if (!record) {
      return {
        profile: null,
        configStatus: WorkProfileConfigStatus.Unconfigured
      };
    }

    const profile = this.recordToProfile(record);
    return {
      profile,
      configStatus: profile.configStatus,
      snapshot: createWorkProfileSnapshot(profile)
    };
  }

  async saveForUserId(
    userId: string,
    request: SaveWorkProfileRequest
  ): Promise<SaveWorkProfileResponse> {
    const profileDraft = {
      ...request.profile,
      userId
    };

    validateWorkProfile(profileDraft);

    if (!this.isDatabaseConfigured()) {
      const existing = this.memoryProfiles.get(userId);
      const now = new Date().toISOString();
      const profile: WorkProfile = {
        ...profileDraft,
        configStatus: WorkProfileConfigStatus.Configured,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      };

      validateWorkProfile(profile);
      this.memoryProfiles.set(userId, profile);

      return {
        profile,
        snapshot: createWorkProfileSnapshot(profile)
      };
    }

    const record = await this.prisma.workProfile.upsert({
      where: { userId },
      create: {
        userId,
        salaryMode: profileDraft.salary.mode,
        monthlyAmount: profileDraft.salary.monthlyAmount,
        currency: profileDraft.salary.currency,
        workStartTime: profileDraft.workTime.startTime,
        workEndTime: profileDraft.workTime.endTime,
        workBreaks: profileDraft.workTime.breaks as unknown as Prisma.InputJsonValue,
        workdayRuleType: profileDraft.workdays.type,
        workdayWeekdays: profileDraft.workdays.weekdays as unknown as Prisma.InputJsonValue,
        paydayDayOfMonth: profileDraft.payday.dayOfMonth,
        paydayWeekendStrategy: profileDraft.payday.weekendStrategy,
        hideModeEnabled: profileDraft.hideModeEnabled
      },
      update: {
        salaryMode: profileDraft.salary.mode,
        monthlyAmount: profileDraft.salary.monthlyAmount,
        currency: profileDraft.salary.currency,
        workStartTime: profileDraft.workTime.startTime,
        workEndTime: profileDraft.workTime.endTime,
        workBreaks: profileDraft.workTime.breaks as unknown as Prisma.InputJsonValue,
        workdayRuleType: profileDraft.workdays.type,
        workdayWeekdays: profileDraft.workdays.weekdays as unknown as Prisma.InputJsonValue,
        paydayDayOfMonth: profileDraft.payday.dayOfMonth,
        paydayWeekendStrategy: profileDraft.payday.weekendStrategy,
        hideModeEnabled: profileDraft.hideModeEnabled
      }
    });

    const savedProfile = this.recordToProfile(record);
    return {
      profile: savedProfile,
      snapshot: createWorkProfileSnapshot(savedProfile)
    };
  }

  private isDatabaseConfigured(): boolean {
    if (typeof this.prisma.isDatabaseConfigured !== "function") {
      return true;
    }

    return this.prisma.isDatabaseConfigured();
  }

  private recordToProfile(record: WorkProfileRecord): WorkProfile {
    const profile: WorkProfile = {
      userId: record.userId,
      salary: {
        mode: record.salaryMode as WorkProfile["salary"]["mode"],
        monthlyAmount: Number(record.monthlyAmount),
        currency: record.currency as WorkProfile["salary"]["currency"]
      },
      workTime: {
        startTime: record.workStartTime,
        endTime: record.workEndTime,
        breaks: normalizeBreaks(record.workBreaks)
      },
      workdays: {
        type: record.workdayRuleType as WorkProfile["workdays"]["type"],
        weekdays:
          record.workdayRuleType === WorkdayRuleType.StandardWeekdays
            ? ([1, 2, 3, 4, 5] as const)
            : normalizeWeekdays(record.workdayWeekdays)
      },
      payday: {
        dayOfMonth: record.paydayDayOfMonth,
        weekendStrategy: record.paydayWeekendStrategy as WorkProfile["payday"]["weekendStrategy"]
      },
      hideModeEnabled: record.hideModeEnabled,
      configStatus: WorkProfileConfigStatus.Configured,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString()
    };

    validateWorkProfile(profile);
    return profile;
  }
}

function normalizeBreaks(value: Prisma.JsonValue): readonly WorkBreak[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return (value as unknown[])
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item) => ({
      id: typeof item.id === "string" ? item.id : undefined,
      startTime: String(item.startTime ?? ""),
      endTime: String(item.endTime ?? ""),
      label: typeof item.label === "string" ? item.label : undefined
    }));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeWeekdays(value: Prisma.JsonValue): readonly Weekday[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => Number(item))
    .filter((item): item is Weekday => Number.isInteger(item) && item >= 1 && item <= 7);
}
