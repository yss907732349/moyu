import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional
} from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { type Prisma, type UserGrowthProfile as UserGrowthProfileRecord } from "@prisma/client";
import {
  DAILY_CHECKIN_REWARD,
  UserFaction,
  UserProfessionType,
  applyDailyCheckinReward,
  createDefaultUserGrowthProfile,
  createUserGrowthProfileSnapshot,
  getDefaultAvatarKeyForFaction,
  getDefaultBadgeKeyForFaction,
  getBusinessDate,
  isPreviousBusinessDate,
  isUserFaction,
  isUserProfessionType,
  validateDisplayName,
  validateJobTitle,
  type CreateUserProfileResponse,
  type DailyCheckinResponse,
  type GetUserProfileResponse,
  type UpdateUserProfileRequest,
  type UpdateUserProfileResponse,
  type UserGrowthProfile,
  type UserGrowthProfileSnapshot
} from "@moyuxia/shared";
import { PrismaService } from "./prisma.service";
import { AiContentModerationService } from "./ai-content-moderation.service";
import { type WechatSession } from "./wechat-login.client";

interface UserIdentityResult {
  userId: string;
  isNewUser: boolean;
}

@Injectable()
export class UserGrowthProfileService {
  private readonly memoryUsersByOpenid = new Map<string, string>();
  private readonly memoryProfiles = new Map<string, UserGrowthProfile>();
  private readonly memoryCheckins = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly aiContentModerationService?: AiContentModerationService
  ) {}

  async findOrCreateUserByWechatSession(session: WechatSession): Promise<UserIdentityResult> {
    if (!this.isDatabaseConfigured()) {
      const existing = this.memoryUsersByOpenid.get(session.openid);

      if (existing) {
        return { userId: existing, isNewUser: false };
      }

      const userId = `user_${this.memoryUsersByOpenid.size + 1}`;
      this.memoryUsersByOpenid.set(session.openid, userId);
      return { userId, isNewUser: true };
    }

    const existingIdentity = await this.prisma.wechatIdentity.findUnique({
      where: { openid: session.openid }
    });

    if (existingIdentity) {
      await this.prisma.wechatIdentity.update({
        where: { openid: session.openid },
        data: {
          unionid: session.unionid,
          sessionKey: session.sessionKey
        }
      });
      return { userId: existingIdentity.userId, isNewUser: false };
    }

    const user = await this.prisma.appUser.create({
      data: {
        wechatIdentities: {
          create: {
            openid: session.openid,
            unionid: session.unionid,
            sessionKey: session.sessionKey
          }
        }
      }
    });

    return { userId: user.id, isNewUser: true };
  }

  async getProfile(userId: string): Promise<GetUserProfileResponse> {
    const profile = await this.findProfile(userId);

    return {
      profileCreated: Boolean(profile),
      profile: profile ? await this.createSnapshotWithTotalCheckins(profile) : null
    };
  }

  async createProfile(
    userId: string,
    professionType: UserProfessionType
  ): Promise<CreateUserProfileResponse> {
    const existing = await this.findProfile(userId);

    if (existing) {
      return {
        profileCreated: true,
        profile: await this.createSnapshotWithTotalCheckins(existing),
        alreadyCreated: true
      };
    }

    const now = new Date().toISOString();
    const profile = {
      ...createDefaultUserGrowthProfile({ userId, professionType, now }),
      publicProfileId: this.generatePublicProfileId()
    };
    const saved = await this.saveNewProfile(profile);

    return {
      profileCreated: true,
      profile: await this.createSnapshotWithTotalCheckins(saved),
      alreadyCreated: false
    };
  }

  async dailyCheckin(userId: string): Promise<DailyCheckinResponse> {
    const profile = await this.findProfile(userId);

    if (!profile) {
      throw new NotFoundException({
        errorCode: "profile_not_created",
        message: "请先创建隐者档案"
      });
    }

    const businessDate = getBusinessDate(new Date());
    const checkinKey = `${userId}:${businessDate}`;

    if (!this.isDatabaseConfigured() && this.memoryCheckins.has(checkinKey)) {
      return {
        checkedInToday: true,
        alreadyCheckedIn: true,
        businessDate,
        reward: { experience: 0, hiddenCoins: 0, energy: 0 },
        profile: await this.createSnapshotWithTotalCheckins(profile)
      };
    }

    if (this.isDatabaseConfigured()) {
      const existing = await this.prisma.dailyCheckin.findUnique({
        where: { userId_businessDate: { userId, businessDate } }
      });

      if (existing) {
        return {
          checkedInToday: true,
          alreadyCheckedIn: true,
          businessDate,
          reward: { experience: 0, hiddenCoins: 0, energy: 0 },
          profile: await this.createSnapshotWithTotalCheckins(profile)
        };
      }
    }

    const rewardedProfile = applyDailyCheckinReward(profile, DAILY_CHECKIN_REWARD);
    const nextProfile: UserGrowthProfile = {
      ...rewardedProfile,
      checkinStreak: isPreviousBusinessDate(profile.lastCheckinDate, businessDate)
        ? profile.checkinStreak + 1
        : 1,
      lastCheckinDate: businessDate,
      updatedAt: new Date().toISOString()
    };

    const saved = await this.saveExistingProfile(nextProfile, businessDate);

    return {
      checkedInToday: true,
      alreadyCheckedIn: false,
      businessDate,
      reward: DAILY_CHECKIN_REWARD,
      profile: await this.createSnapshotWithTotalCheckins(saved)
    };
  }

  async updateProfile(
    userId: string,
    patch: UpdateUserProfileRequest
  ): Promise<UpdateUserProfileResponse> {
    const profile = await this.findProfile(userId);

    if (!profile) {
      throw new NotFoundException({
        errorCode: "profile_not_created",
        message: "请先创建隐者档案"
      });
    }

    const nextProfile: UserGrowthProfile = {
      ...profile,
      updatedAt: new Date().toISOString()
    };

    if (typeof patch.displayName === "string") {
      const displayName = patch.displayName.trim();
      const issues = validateDisplayName(displayName);

      if (issues.length > 0) {
        throw new BadRequestException({
          errorCode: "invalid_display_name",
          message: issues.join("；")
        });
      }

      if (this.aiContentModerationService) {
        const moderation = await this.aiContentModerationService.moderateUserContent({
          userId,
          contentType: "profile_display_name",
          body: displayName
        });
        if (moderation.decision !== "approved") {
          throw new BadRequestException({
            errorCode: "display_name_content_security_failed",
            message:
              moderation.decision === "rejected"
                ? "昵称未通过内容安全审核，请换一个更稳妥的名字"
                : "昵称暂时无法确认安全，请稍后重试或换一个名字"
          });
        }
      }

      nextProfile.displayName = displayName;
    }

    if (typeof patch.jobTitle === "string") {
      const jobTitle = patch.jobTitle.trim();
      const issues = validateJobTitle(jobTitle);

      if (issues.length > 0) {
        throw new BadRequestException({
          errorCode: "invalid_job_title",
          message: issues.join("；")
        });
      }

      nextProfile.jobTitle = jobTitle;
    }

    if (patch.professionType !== undefined) {
      if (!isUserProfessionType(String(patch.professionType))) {
        throw new BadRequestException({
          errorCode: "invalid_profession_type",
          message: "职业类型无效"
        });
      }

      nextProfile.professionType = patch.professionType;
    }

    if (patch.faction !== undefined) {
      if (!isUserFaction(String(patch.faction))) {
        throw new BadRequestException({
          errorCode: "invalid_faction",
          message: "阵营无效"
        });
      }

      nextProfile.faction = patch.faction;
      nextProfile.avatarKey = getDefaultAvatarKeyForFaction(patch.faction);
      nextProfile.equippedBadgeKeys = [getDefaultBadgeKeyForFaction(patch.faction)];
    }

    const saved = await this.saveProfilePatch(nextProfile);
    return { profile: await this.createSnapshotWithTotalCheckins(saved) };
  }

  private async findProfile(userId: string): Promise<UserGrowthProfile | null> {
    if (!this.isDatabaseConfigured()) {
      const profile = this.memoryProfiles.get(userId) ?? null;
      return profile ? this.ensureProfilePublicProfileId(profile) : null;
    }

    const record = await this.prisma.userGrowthProfile.findUnique({ where: { userId } });
    return record ? this.ensureProfilePublicProfileId(this.recordToProfile(record)) : null;
  }

  async getOrCreatePublicProfileId(userId: string): Promise<string | null> {
    const profile = await this.findProfile(userId);
    return profile?.publicProfileId ?? null;
  }

  async findProfileByPublicProfileId(
    publicProfileId: string
  ): Promise<UserGrowthProfileSnapshot | null> {
    if (!publicProfileId) {
      return null;
    }

    if (!this.isDatabaseConfigured()) {
      const profile =
        [...this.memoryProfiles.values()].find(
          (profile) => profile.publicProfileId === publicProfileId
        ) ?? null;
      return profile ? this.createSnapshotWithTotalCheckins(profile) : null;
    }

    const record = await (
      this.prisma.userGrowthProfile as unknown as {
        findFirst(input: {
          where: Record<string, unknown>;
        }): Promise<UserGrowthProfileRecord | null>;
      }
    ).findFirst({
      where: { publicProfileId }
    });
    return record ? this.createSnapshotWithTotalCheckins(this.recordToProfile(record)) : null;
  }

  private async createSnapshotWithTotalCheckins(
    profile: UserGrowthProfile
  ): Promise<UserGrowthProfileSnapshot> {
    return createUserGrowthProfileSnapshot(profile, {
      totalCheckinCount: await this.getTotalCheckinCount(profile.userId)
    });
  }

  private async getTotalCheckinCount(userId: string): Promise<number> {
    if (!this.isDatabaseConfigured()) {
      const prefix = `${userId}:`;
      return [...this.memoryCheckins].filter((key) => key.startsWith(prefix)).length;
    }

    return this.prisma.dailyCheckin.count({ where: { userId } });
  }

  private async saveNewProfile(profile: UserGrowthProfile): Promise<UserGrowthProfile> {
    if (!this.isDatabaseConfigured()) {
      this.memoryProfiles.set(profile.userId, profile);
      return profile;
    }

    try {
      const record = await this.prisma.userGrowthProfile.create({
        data: this.profileToCreateInput(profile)
      });
      return this.recordToProfile(record);
    } catch (error) {
      if (isPrismaUniqueError(error)) {
        const existing = await this.findProfile(profile.userId);

        if (existing) {
          return existing;
        }
      }

      throw error;
    }
  }

  private async saveExistingProfile(
    profile: UserGrowthProfile,
    businessDate: string
  ): Promise<UserGrowthProfile> {
    if (!this.isDatabaseConfigured()) {
      this.memoryProfiles.set(profile.userId, profile);
      this.memoryCheckins.add(`${profile.userId}:${businessDate}`);
      return profile;
    }

    try {
      const record = await this.prisma.$transaction(async (tx) => {
        await tx.dailyCheckin.create({
          data: {
            userId: profile.userId,
            businessDate,
            reward: DAILY_CHECKIN_REWARD as unknown as Prisma.InputJsonValue
          }
        });

        return tx.userGrowthProfile.update({
          where: { userId: profile.userId },
          data: {
            level: profile.level,
            totalExperience: profile.totalExperience,
            hiddenCoins: profile.hiddenCoins,
            energy: profile.energy,
            checkinStreak: profile.checkinStreak,
            lastCheckinDate: profile.lastCheckinDate
          }
        });
      });

      return this.recordToProfile(record);
    } catch (error) {
      if (isPrismaUniqueError(error)) {
        throw new ConflictException({
          errorCode: "already_checked_in",
          message: "今日已经签到"
        });
      }

      throw error;
    }
  }

  private profileToCreateInput(profile: UserGrowthProfile): Prisma.UserGrowthProfileCreateInput {
    return {
      user: { connect: { id: profile.userId } },
      professionType: profile.professionType,
      jobTitle: profile.jobTitle,
      faction: profile.faction,
      displayName: profile.displayName,
      avatarKey: profile.avatarKey,
      level: profile.level,
      totalExperience: profile.totalExperience,
      publicProfileId: profile.publicProfileId,
      hiddenCoins: profile.hiddenCoins,
      energy: profile.energy,
      checkinStreak: profile.checkinStreak,
      lastCheckinDate: profile.lastCheckinDate,
      titleKey: profile.titleKey,
      equippedBadgeKeys: profile.equippedBadgeKeys as unknown as Prisma.InputJsonValue
    } as unknown as Prisma.UserGrowthProfileCreateInput;
  }

  private recordToProfile(record: UserGrowthProfileRecord): UserGrowthProfile {
    const professionType = String(record.professionType);
    const faction = String(record.faction);

    return {
      userId: record.userId,
      professionType: isUserProfessionType(professionType) ? professionType : "business_support",
      faction: isUserFaction(faction) ? faction : UserFaction.Wanderer,
      displayName: record.displayName,
      publicProfileId:
        "publicProfileId" in record && typeof record.publicProfileId === "string"
          ? record.publicProfileId
          : undefined,
      jobTitle: "jobTitle" in record && typeof record.jobTitle === "string" ? record.jobTitle : "",
      avatarKey:
        typeof record.avatarKey === "string" && record.avatarKey
          ? record.avatarKey
          : getDefaultAvatarKeyForFaction(isUserFaction(faction) ? faction : UserFaction.Wanderer),
      level: record.level,
      totalExperience: record.totalExperience,
      hiddenCoins: record.hiddenCoins,
      energy: record.energy,
      checkinStreak: record.checkinStreak,
      lastCheckinDate: record.lastCheckinDate ?? undefined,
      titleKey: record.titleKey,
      equippedBadgeKeys: normalizeStringArray(
        record.equippedBadgeKeys,
        isUserFaction(faction) ? faction : UserFaction.Wanderer
      ),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString()
    };
  }

  private async saveProfilePatch(profile: UserGrowthProfile): Promise<UserGrowthProfile> {
    if (!this.isDatabaseConfigured()) {
      this.memoryProfiles.set(profile.userId, profile);
      return profile;
    }

    const data = {
      displayName: profile.displayName,
      jobTitle: profile.jobTitle,
      professionType: profile.professionType,
      faction: profile.faction,
      avatarKey: profile.avatarKey,
      equippedBadgeKeys: profile.equippedBadgeKeys as unknown as Prisma.InputJsonValue
    } as unknown as Prisma.UserGrowthProfileUpdateInput;

    const record = await this.prisma.userGrowthProfile.update({
      where: { userId: profile.userId },
      data
    });

    return this.recordToProfile(record);
  }

  private isDatabaseConfigured(): boolean {
    if (typeof this.prisma.isDatabaseConfigured !== "function") {
      return true;
    }

    return this.prisma.isDatabaseConfigured();
  }

  private async ensureProfilePublicProfileId(
    profile: UserGrowthProfile
  ): Promise<UserGrowthProfile> {
    if (profile.publicProfileId) {
      return profile;
    }

    const publicProfileId = this.generatePublicProfileId();
    const nextProfile = { ...profile, publicProfileId };

    if (!this.isDatabaseConfigured()) {
      this.memoryProfiles.set(profile.userId, nextProfile);
      return nextProfile;
    }

    try {
      const record = await this.prisma.userGrowthProfile.update({
        where: { userId: profile.userId },
        data: { publicProfileId } as unknown as Prisma.UserGrowthProfileUpdateInput
      });
      return this.recordToProfile(record);
    } catch (error) {
      if (isPrismaUniqueError(error)) {
        return this.ensureProfilePublicProfileId(profile);
      }

      throw error;
    }
  }

  private generatePublicProfileId(): string {
    return `pp_${randomBytes(12).toString("base64url")}`;
  }
}

function normalizeStringArray(value: Prisma.JsonValue, faction: UserFaction): readonly string[] {
  const keys = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    : [];

  return keys.length > 0 ? keys : [getDefaultBadgeKeyForFaction(faction)];
}

function isPrismaUniqueError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}
