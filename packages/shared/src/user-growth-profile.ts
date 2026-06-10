export const UserFaction = {
  KeyShadow: "key_shadow",
  WaterEscape: "water_escape",
  SkyStrategy: "sky_strategy",
  Wanderer: "wanderer"
} as const;

export type UserFaction = (typeof UserFaction)[keyof typeof UserFaction];

export const USER_FACTION_LABELS: Record<UserFaction, string> = {
  [UserFaction.KeyShadow]: "键影隐者",
  [UserFaction.WaterEscape]: "运影隐者",
  [UserFaction.SkyStrategy]: "策影隐者",
  [UserFaction.Wanderer]: "行影隐者"
};

export const UserProfessionType = {
  Engineering: "engineering",
  CreativeOperations: "creative_operations",
  ProductStrategy: "product_strategy",
  BusinessSupport: "business_support"
} as const;

export type UserProfessionType = (typeof UserProfessionType)[keyof typeof UserProfessionType];

export const USER_PROFESSION_LABELS: Record<UserProfessionType, string> = {
  [UserProfessionType.Engineering]: "数字与技术",
  [UserProfessionType.CreativeOperations]: "运营与商业",
  [UserProfessionType.ProductStrategy]: "创意与内容",
  [UserProfessionType.BusinessSupport]: "现实与执行"
};

export const PROFESSION_FACTION_MAP: Record<UserProfessionType, UserFaction> = {
  [UserProfessionType.Engineering]: UserFaction.KeyShadow,
  [UserProfessionType.CreativeOperations]: UserFaction.WaterEscape,
  [UserProfessionType.ProductStrategy]: UserFaction.SkyStrategy,
  [UserProfessionType.BusinessSupport]: UserFaction.Wanderer
};

export const USER_GROWTH_DEFAULT_TITLE_KEY = "newcomer_hidden_one";

export const USER_GROWTH_TITLE_LABELS: Record<string, string> = {
  [USER_GROWTH_DEFAULT_TITLE_KEY]: "一阶隐者"
};

export function resolveUserGrowthTitleLabel(titleKey?: string): string {
  if (!titleKey) {
    return "一阶隐者";
  }

  return USER_GROWTH_TITLE_LABELS[titleKey] ?? "隐者";
}

export interface UserProfileRecommendation {
  recommendedFaction: UserFaction;
  recommendedFactionLabel: string;
  isCurrentFactionRecommended: boolean;
}

export interface GrowthResourceSnapshot {
  level: number;
  totalExperience: number;
  currentLevelExperience: number;
  nextLevelExperience: number;
  experienceProgress: number;
  hiddenCoins: number;
  energy: number;
}

export interface UserGrowthProfile {
  userId: string;
  publicProfileId?: string;
  professionType: UserProfessionType;
  jobTitle: string;
  faction: UserFaction;
  displayName: string;
  avatarKey: string;
  level: number;
  totalExperience: number;
  hiddenCoins: number;
  energy: number;
  checkinStreak: number;
  lastCheckinDate?: string;
  titleKey: string;
  equippedBadgeKeys: readonly string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserGrowthProfileSnapshot extends Omit<
  UserGrowthProfile,
  "createdAt" | "updatedAt"
> {
  totalCheckinCount?: number;
  factionLabel: string;
  professionLabel: string;
  currentBadgeKey: string;
  factionArtworkKey: string;
  recommendation: UserProfileRecommendation;
  levelProgress: GrowthResourceSnapshot;
  updatedAt: string;
}

export interface WechatLoginRequest {
  code: string;
}

export interface WechatLoginResponse {
  token: string;
  userId: string;
  isNewUser: boolean;
  expiresAt: string;
}

export interface GetUserProfileResponse {
  profileCreated: boolean;
  profile: UserGrowthProfileSnapshot | null;
}

export interface CreateUserProfileRequest {
  professionType: UserProfessionType;
}

export interface CreateUserProfileResponse {
  profileCreated: true;
  profile: UserGrowthProfileSnapshot;
  alreadyCreated: boolean;
}

export interface UpdateUserProfileRequest {
  displayName?: string;
  jobTitle?: string;
  professionType?: UserProfessionType;
  faction?: UserFaction;
}

export interface UpdateUserProfileResponse {
  profile: UserGrowthProfileSnapshot;
}

export interface DailyCheckinReward {
  experience: number;
  hiddenCoins: number;
  energy: number;
}

export interface DailyCheckinResponse {
  checkedInToday: boolean;
  alreadyCheckedIn: boolean;
  businessDate: string;
  reward: DailyCheckinReward;
  profile: UserGrowthProfileSnapshot;
}

export const DAILY_CHECKIN_REWARD: DailyCheckinReward = {
  experience: 20,
  hiddenCoins: 18,
  energy: 10
};

const LEVEL_BASE_EXPERIENCE = 100;
const LEVEL_GROWTH_EXPERIENCE = 40;
const MAX_ENERGY = 100;

const factionAvatarKeys: Record<UserFaction, string> = {
  [UserFaction.KeyShadow]: "avatar_key_shadow_default",
  [UserFaction.WaterEscape]: "avatar_water_escape_default",
  [UserFaction.SkyStrategy]: "avatar_sky_strategy_default",
  [UserFaction.Wanderer]: "avatar_wanderer_default"
};

const factionBadgeKeys: Record<UserFaction, string> = {
  [UserFaction.KeyShadow]: "badge_key_shadow_default",
  [UserFaction.WaterEscape]: "badge_water_escape_default",
  [UserFaction.SkyStrategy]: "badge_sky_strategy_default",
  [UserFaction.Wanderer]: "badge_wanderer_default"
};

const factionArtworkKeys: Record<UserFaction, string> = {
  [UserFaction.KeyShadow]: "scene_key_shadow_default",
  [UserFaction.WaterEscape]: "scene_water_escape_default",
  [UserFaction.SkyStrategy]: "scene_sky_strategy_default",
  [UserFaction.Wanderer]: "scene_wanderer_default"
};

const DISPLAY_NAME_MAX_LENGTH = 16;
const JOB_TITLE_MAX_LENGTH = 24;
const SYMBOL_ONLY_PATTERN = /^[\p{P}\p{S}\s]+$/u;
const FORBIDDEN_PROFILE_TEXT_PATTERN = /(admin|管理员|官方|系统|客服|微信|wxid)/iu;

export function isUserFaction(value: string): value is UserFaction {
  return (Object.values(UserFaction) as string[]).includes(value);
}

export function isUserProfessionType(value: string): value is UserProfessionType {
  return (Object.values(UserProfessionType) as string[]).includes(value);
}

export function getFactionForProfession(professionType: UserProfessionType): UserFaction {
  return PROFESSION_FACTION_MAP[professionType];
}

export function getDefaultAvatarKeyForFaction(faction: UserFaction): string {
  return factionAvatarKeys[faction];
}

export function getDefaultBadgeKeyForFaction(faction: UserFaction): string {
  return factionBadgeKeys[faction];
}

export function getFactionArtworkKeyForFaction(faction: UserFaction): string {
  return factionArtworkKeys[faction];
}

export function getProfileRecommendation(input: {
  professionType: UserProfessionType;
  faction: UserFaction;
}): UserProfileRecommendation {
  const recommendedFaction = getFactionForProfession(input.professionType);

  return {
    recommendedFaction,
    recommendedFactionLabel: USER_FACTION_LABELS[recommendedFaction],
    isCurrentFactionRecommended: recommendedFaction === input.faction
  };
}

export function validateDisplayName(value: string): string[] {
  const normalized = value.trim();
  const issues: string[] = [];

  if (!normalized) {
    issues.push("昵称不能为空");
  }

  if (normalized.length > DISPLAY_NAME_MAX_LENGTH) {
    issues.push(`昵称不能超过 ${DISPLAY_NAME_MAX_LENGTH} 个字符`);
  }

  if (normalized && SYMBOL_ONLY_PATTERN.test(normalized)) {
    issues.push("昵称不能只包含符号");
  }

  if (FORBIDDEN_PROFILE_TEXT_PATTERN.test(normalized)) {
    issues.push("昵称包含不可使用的词");
  }

  return issues;
}

export function validateJobTitle(value: string): string[] {
  const normalized = value.trim();
  const issues: string[] = [];

  if (normalized.length > JOB_TITLE_MAX_LENGTH) {
    issues.push(`职业不能超过 ${JOB_TITLE_MAX_LENGTH} 个字符`);
  }

  if (normalized && SYMBOL_ONLY_PATTERN.test(normalized)) {
    issues.push("职业不能只包含符号");
  }

  if (FORBIDDEN_PROFILE_TEXT_PATTERN.test(normalized)) {
    issues.push("职业包含不可使用的词");
  }

  return issues;
}

export function generateDefaultDisplayName(faction: UserFaction, seed: string): string {
  const digits = stableNumericSuffix(seed);
  return `${USER_FACTION_LABELS[faction]}${digits}`;
}

export function createInitialGrowthResources(): Pick<
  UserGrowthProfile,
  "level" | "totalExperience" | "hiddenCoins" | "energy" | "checkinStreak"
> {
  return {
    level: 1,
    totalExperience: 0,
    hiddenCoins: 88,
    energy: 60,
    checkinStreak: 0
  };
}

export function createDefaultUserGrowthProfile(input: {
  userId: string;
  professionType: UserProfessionType;
  now: string;
}): UserGrowthProfile {
  const faction = getFactionForProfession(input.professionType);
  return {
    userId: input.userId,
    professionType: input.professionType,
    jobTitle: "",
    faction,
    displayName: generateDefaultDisplayName(faction, input.userId),
    avatarKey: getDefaultAvatarKeyForFaction(faction),
    ...createInitialGrowthResources(),
    titleKey: USER_GROWTH_DEFAULT_TITLE_KEY,
    equippedBadgeKeys: [getDefaultBadgeKeyForFaction(faction)],
    createdAt: input.now,
    updatedAt: input.now
  };
}

export function applyExperience(
  totalExperience: number,
  addedExperience: number
): GrowthResourceSnapshot {
  const nextTotal = Math.max(0, totalExperience + Math.max(0, addedExperience));
  const level = resolveLevelFromTotalExperience(nextTotal);
  const currentLevelStart = getTotalExperienceRequiredForLevel(level);
  const nextLevelStart = getTotalExperienceRequiredForLevel(level + 1);
  const currentLevelExperience = nextTotal - currentLevelStart;
  const nextLevelExperience = nextLevelStart - currentLevelStart;

  return {
    level,
    totalExperience: nextTotal,
    currentLevelExperience,
    nextLevelExperience,
    experienceProgress: nextLevelExperience > 0 ? currentLevelExperience / nextLevelExperience : 1,
    hiddenCoins: 0,
    energy: 0
  };
}

export function createLevelProgress(
  totalExperience: number,
  hiddenCoins: number,
  energy: number
): GrowthResourceSnapshot {
  return {
    ...applyExperience(totalExperience, 0),
    hiddenCoins,
    energy
  };
}

export function applyDailyCheckinReward(
  profile: UserGrowthProfile,
  reward: DailyCheckinReward = DAILY_CHECKIN_REWARD
): UserGrowthProfile {
  const levelProgress = applyExperience(profile.totalExperience, reward.experience);
  return {
    ...profile,
    level: levelProgress.level,
    totalExperience: levelProgress.totalExperience,
    hiddenCoins: profile.hiddenCoins + reward.hiddenCoins,
    energy: Math.min(MAX_ENERGY, profile.energy + reward.energy)
  };
}

export function createUserGrowthProfileSnapshot(
  profile: UserGrowthProfile,
  options: { totalCheckinCount?: number } = {}
): UserGrowthProfileSnapshot {
  return {
    userId: profile.userId,
    publicProfileId: profile.publicProfileId,
    professionType: profile.professionType,
    faction: profile.faction,
    factionLabel: USER_FACTION_LABELS[profile.faction],
    professionLabel: USER_PROFESSION_LABELS[profile.professionType],
    displayName: profile.displayName,
    avatarKey: profile.avatarKey,
    level: profile.level,
    totalExperience: profile.totalExperience,
    hiddenCoins: profile.hiddenCoins,
    energy: profile.energy,
    checkinStreak: profile.checkinStreak,
    totalCheckinCount: options.totalCheckinCount ?? profile.checkinStreak,
    lastCheckinDate: profile.lastCheckinDate,
    titleKey: profile.titleKey,
    equippedBadgeKeys: normalizeProfileBadgeKeys(profile.equippedBadgeKeys, profile.faction),
    currentBadgeKey: normalizeProfileBadgeKeys(profile.equippedBadgeKeys, profile.faction)[0],
    jobTitle: profile.jobTitle ?? "",
    factionArtworkKey: getFactionArtworkKeyForFaction(profile.faction),
    recommendation: getProfileRecommendation({
      professionType: profile.professionType,
      faction: profile.faction
    }),
    levelProgress: createLevelProgress(
      profile.totalExperience,
      profile.hiddenCoins,
      profile.energy
    ),
    updatedAt: profile.updatedAt
  };
}

export function getBusinessDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isPreviousBusinessDate(previous: string | undefined, current: string): boolean {
  if (!previous) {
    return false;
  }

  const previousDate = parseBusinessDate(previous);
  const currentDate = parseBusinessDate(current);

  if (!previousDate || !currentDate) {
    return false;
  }

  previousDate.setDate(previousDate.getDate() + 1);
  return getBusinessDate(previousDate) === getBusinessDate(currentDate);
}

function resolveLevelFromTotalExperience(totalExperience: number): number {
  let level = 1;

  while (totalExperience >= getTotalExperienceRequiredForLevel(level + 1)) {
    level += 1;
  }

  return level;
}

function getTotalExperienceRequiredForLevel(level: number): number {
  if (level <= 1) {
    return 0;
  }

  let total = 0;
  for (let current = 1; current < level; current += 1) {
    total += LEVEL_BASE_EXPERIENCE + (current - 1) * LEVEL_GROWTH_EXPERIENCE;
  }
  return total;
}

function stableNumericSuffix(seed: string): string {
  let hash = 0;

  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) % 9000;
  }

  return String(hash + 1000);
}

function normalizeProfileBadgeKeys(
  badgeKeys: readonly string[] | undefined,
  faction: UserFaction
): readonly string[] {
  const keys = badgeKeys?.filter((item) => typeof item === "string" && item.trim()) ?? [];
  return keys.length > 0 ? keys : [getDefaultBadgeKeyForFaction(faction)];
}

function parseBusinessDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}
