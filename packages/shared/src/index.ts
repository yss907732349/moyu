import { type UserFaction } from "./user-growth-profile";

export const APP_NAME = "摸鱼隐者";
export const APP_SLOGAN = "大隐隐于市，摸鱼隐于职";
export const WORLD_NAME = "隐者大陆";
export const USER_IDENTITY_NAME = "隐者";

export * from "./work-profile";
export * from "./display-time";
export { formatDisplayTime } from "./display-time";
export type { FormatDisplayTimeOptions } from "./display-time";
export * from "./static-holiday-calendar";
export * from "./user-growth-profile";
export * from "./accounting-ledger";
export * from "./supply-center";
export * from "./community-lite";
export * from "./daily-content-feed";
export * from "./world-intel-content";
export * from "./content-security-moderation";
export * from "./ai-content-moderation";
export * from "./low-cost-content-moderation";
export * from "./admin-operations";
export * from "./admin-community-governance";

export const FEATURE_KEYS = {
  workValueTracker: "work_value_tracker",
  salaryWorkTimeSettings: "salary_work_time_settings",
  hideMode: "hide_mode",
  lightweightAccounting: "lightweight_accounting",
  accountingLedger: "accounting_ledger",
  userGrowthProfile: "user_growth_profile",
  factionSelection: "faction_selection",
  dailyCheckin: "daily_checkin",
  dailyContentFeed: "daily_content_feed",
  communityLite: "community_lite",
  stealthWorkbenchMode: "stealth_workbench_mode",
  comicIpContent: "comic_ip_content",
  supplyCenter: "supply_center",
  seasonRank: "season_rank",
  complexMiniGame: "complex_mini_game",
  titleShop: "title_shop",
  skinShop: "skin_shop",
  featureRegistry: "feature_registry",
  adminOperations: "admin_operations",
  visualSystem: "visual_system"
} as const;

export type FeatureKey = (typeof FEATURE_KEYS)[keyof typeof FEATURE_KEYS];

export const FeatureStatus = {
  Enabled: "enabled",
  Locked: "locked",
  ComingSoon: "coming_soon",
  Disabled: "disabled",
  Hidden: "hidden"
} as const;

export type FeatureStatus = (typeof FeatureStatus)[keyof typeof FeatureStatus];

export const FeaturePlacement = {
  HomeQuickEntry: "home_quick_entry",
  HomeAccountingBanner: "home_accounting_banner",
  ProfileFeatureGrid: "profile_feature_grid",
  CommunityEntry: "community_entry",
  ComicsEntry: "comics_entry",
  SupplyEntry: "supply_entry",
  FuturePlaceholder: "future_placeholder",
  AdminOperations: "admin_operations"
} as const;

export type FeaturePlacement = (typeof FeaturePlacement)[keyof typeof FeaturePlacement];

export const FeatureAvailability = {
  Open: FeatureStatus.Enabled,
  Locked: FeatureStatus.Locked,
  ComingSoon: FeatureStatus.ComingSoon
} as const;

export type FeatureAvailability = (typeof FeatureAvailability)[keyof typeof FeatureAvailability];

export const ModerationStatus = {
  Draft: "draft",
  PendingReview: "pending_review",
  Approved: "approved",
  Rejected: "rejected"
} as const;

export type ModerationStatus = (typeof ModerationStatus)[keyof typeof ModerationStatus];

export interface FeatureUnlockCondition {
  minLevel?: number;
  requiredFaction?: UserFaction;
  requiredCheckinDays?: number;
  requiredAchievementKey?: string;
}

export interface FeaturePlacementConfig {
  placement: FeaturePlacement;
  order: number;
}

export interface FeaturePromptText {
  unlockText?: string;
  comingSoonText?: string;
  unavailableText?: string;
}

export interface FeatureEntry extends FeaturePromptText {
  featureKey: FeatureKey;
  title: string;
  icon: string;
  status: FeatureStatus;
  placements: readonly FeaturePlacementConfig[];
  description?: string;
  publicRoute?: string;
  unlockCondition?: FeatureUnlockCondition;
  internalRoute?: string;
  internalNotes?: string;
  rolloutControl?: string;
  auditStatus?: ModerationStatus;
}

export interface PublicFeatureEntry extends FeaturePromptText {
  featureKey: FeatureKey;
  title: string;
  icon: string;
  status: Exclude<FeatureStatus, typeof FeatureStatus.Hidden>;
  placement: FeaturePlacement;
  displayOrder: number;
  description?: string;
  publicRoute?: string;
}

export interface FeatureRegistryResponse {
  placement: FeaturePlacement;
  entries: PublicFeatureEntry[];
}

export interface FeatureRegistrySource {
  listEntries(): readonly FeatureEntry[];
}

export interface FeatureRegistryActor {
  id: string;
  permissions: readonly string[];
}

export type FeatureAdminOperation = "create" | "update" | "publish" | "hide";

export type AdminFeatureConfigPatch = Partial<
  Pick<
    FeatureEntry,
    | "title"
    | "icon"
    | "status"
    | "placements"
    | "description"
    | "unlockText"
    | "comingSoonText"
    | "unavailableText"
  >
>;

export const FEATURE_ADMIN_PERMISSION = "feature_registry:write";

export const FEATURE_ADMIN_CONFIGURABLE_FIELDS = [
  "title",
  "icon",
  "status",
  "placements",
  "description",
  "unlockText",
  "comingSoonText",
  "unavailableText"
] as const;

export const FEATURE_INTERNAL_FIELDS = [
  "internalRoute",
  "internalNotes",
  "rolloutControl",
  "auditStatus"
] as const;

const FEATURE_KEY_PATTERN = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;
const PUBLIC_ROUTE_PATTERN = /^\/pages\/[a-z0-9_/-]+$/;

const featureStatusValues = Object.values(FeatureStatus);
const featurePlacementValues = Object.values(FeaturePlacement);

export class FeatureRegistryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeatureRegistryValidationError";
  }
}

export class FeatureRegistryAuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeatureRegistryAuthorizationError";
  }
}

export const DEFAULT_MVP_FEATURE_REGISTRY: readonly FeatureEntry[] = [
  {
    featureKey: FEATURE_KEYS.workValueTracker,
    title: "今日已摸",
    icon: "px-icon-work-value",
    status: FeatureStatus.Enabled,
    placements: [{ placement: FeaturePlacement.HomeQuickEntry, order: 10 }],
    description: "已摸金额和下班倒计时",
    publicRoute: "/pages/home/index"
  },
  {
    featureKey: FEATURE_KEYS.salaryWorkTimeSettings,
    title: "工作设置",
    icon: "px-icon-menu-work-settings",
    status: FeatureStatus.Enabled,
    placements: [
      { placement: FeaturePlacement.HomeQuickEntry, order: 20 },
      { placement: FeaturePlacement.ProfileFeatureGrid, order: 15 }
    ],
    description: "配置薪资和上班节奏",
    publicRoute: "/pages/work-profile/settings"
  },
  {
    featureKey: FEATURE_KEYS.hideMode,
    title: "隐藏模式",
    icon: "px-icon-hide-mode",
    status: FeatureStatus.Hidden,
    placements: [{ placement: FeaturePlacement.FuturePlaceholder, order: 5 }],
    description: "首页主金额旁即时开关，不作为独立快捷入口",
    internalNotes: "隐藏模式已移至首页主金额旁的小眼睛开关，不再作为独立功能入口。"
  },
  {
    featureKey: FEATURE_KEYS.dailyContentFeed,
    title: "隐者日报",
    icon: "px-icon-daily",
    status: FeatureStatus.Enabled,
    placements: [
      { placement: FeaturePlacement.HomeQuickEntry, order: 40 },
      { placement: FeaturePlacement.ProfileFeatureGrid, order: 40 }
    ],
    description: "热梗、信息差和摸鱼补给",
    publicRoute: "/pages/daily-content/index"
  },
  {
    featureKey: FEATURE_KEYS.accountingLedger,
    title: "生存账本",
    icon: "px-icon-menu-ledger",
    status: FeatureStatus.Enabled,
    placements: [
      { placement: FeaturePlacement.HomeAccountingBanner, order: 10 },
      { placement: FeaturePlacement.ProfileFeatureGrid, order: 50 }
    ],
    description: "今日生存消耗和本周报告",
    publicRoute: "/pages/accounting-ledger/index"
  },
  {
    featureKey: FEATURE_KEYS.userGrowthProfile,
    title: "我的角色",
    icon: "px-icon-menu-role",
    status: FeatureStatus.Enabled,
    placements: [{ placement: FeaturePlacement.ProfileFeatureGrid, order: 10 }],
    description: "等级、经验和资源",
    publicRoute: "/pages/profile/role"
  },
  {
    featureKey: FEATURE_KEYS.factionSelection,
    title: "阵营选择",
    icon: "px-icon-faction",
    status: FeatureStatus.Locked,
    placements: [{ placement: FeaturePlacement.ProfileFeatureGrid, order: 20 }],
    description: "选择隐者流派",
    unlockText: "完成微信登录和基础档案后开放阵营选择。"
  },
  {
    featureKey: FEATURE_KEYS.dailyCheckin,
    title: "每日签到",
    icon: "px-icon-checkin",
    status: FeatureStatus.Enabled,
    placements: [{ placement: FeaturePlacement.ProfileFeatureGrid, order: 30 }],
    description: "领取隐币和能量",
    publicRoute: "/pages/profile/index"
  },
  {
    featureKey: FEATURE_KEYS.communityLite,
    title: "阵营茶馆",
    icon: "px-icon-community",
    status: FeatureStatus.Enabled,
    placements: [
      { placement: FeaturePlacement.HomeQuickEntry, order: 50 },
      { placement: FeaturePlacement.CommunityEntry, order: 10 }
    ],
    description: "发帖、评论和点赞",
    publicRoute: "/pages/community/index"
  },
  {
    featureKey: FEATURE_KEYS.stealthWorkbenchMode,
    title: "摸鱼模式",
    icon: "px-icon-work-value",
    status: FeatureStatus.Enabled,
    placements: [{ placement: FeaturePlacement.HomeQuickEntry, order: 55 }],
    description: "低暴露工作表浏览",
    publicRoute: "/pages/stealth-workbench/index"
  },
  {
    featureKey: FEATURE_KEYS.comicIpContent,
    title: "隐者漫画",
    icon: "px-icon-comic",
    status: FeatureStatus.Hidden,
    placements: [{ placement: FeaturePlacement.CommunityEntry, order: 20 }],
    description: "解锁隐者大陆世界观",
    internalRoute: "/pages/comics/index",
    internalNotes: "漫画/IP 内容第一版降级为社区页世界观 Banner，不作为默认公开入口。"
  },
  {
    featureKey: FEATURE_KEYS.supplyCenter,
    title: "补给铺",
    icon: "px-icon-supply",
    status: FeatureStatus.Enabled,
    placements: [
      { placement: FeaturePlacement.HomeQuickEntry, order: 60 },
      { placement: FeaturePlacement.SupplyEntry, order: 10 }
    ],
    description: "外卖、咖啡茶饮和通勤补给",
    publicRoute: "/pages/supply-center/index"
  },
  {
    featureKey: FEATURE_KEYS.seasonRank,
    title: "赛季排行",
    icon: "px-icon-rank",
    status: FeatureStatus.Hidden,
    placements: [{ placement: FeaturePlacement.FuturePlaceholder, order: 10 }],
    description: "全服隐者摸鱼榜",
    comingSoonText: "赛季排行不属于第一版，后续活动开放。",
    internalNotes: "未定义完整玩法，不展示给普通用户。"
  },
  {
    featureKey: FEATURE_KEYS.complexMiniGame,
    title: "忍术试炼",
    icon: "px-icon-game",
    status: FeatureStatus.Hidden,
    placements: [{ placement: FeaturePlacement.FuturePlaceholder, order: 20 }],
    description: "小游戏试炼场",
    unlockText: "复杂小游戏待后续 change 明确规则后开放。",
    internalNotes: "未定义完整玩法，不展示给普通用户。"
  },
  {
    featureKey: FEATURE_KEYS.titleShop,
    title: "称号商店",
    icon: "px-icon-title-shop",
    status: FeatureStatus.Hidden,
    placements: [{ placement: FeaturePlacement.FuturePlaceholder, order: 30 }],
    description: "用隐币兑换称号",
    comingSoonText: "称号商店暂未开放交易。",
    internalNotes: "未定义完整玩法，不展示给普通用户。"
  },
  {
    featureKey: FEATURE_KEYS.skinShop,
    title: "皮肤商店",
    icon: "px-icon-skin-shop",
    status: FeatureStatus.Disabled,
    placements: [{ placement: FeaturePlacement.FuturePlaceholder, order: 40 }],
    description: "像素皮肤收藏",
    unavailableText: "皮肤商店维护中，当前不会进入业务页。",
    internalNotes: "仅作为 disabled 状态验证样例，不展示给普通用户。"
  },
  {
    featureKey: FEATURE_KEYS.adminOperations,
    title: "运营后台",
    icon: "px-icon-admin",
    status: FeatureStatus.Hidden,
    placements: [{ placement: FeaturePlacement.AdminOperations, order: 10 }],
    description: "内部运营能力",
    internalRoute: "/admin/features",
    internalNotes: "普通用户不可见。"
  }
] as const;

export interface FeatureRegistryItem {
  key: FeatureKey;
  name: string;
  availability: FeatureAvailability;
  unlockHint?: string;
}

export interface AppShellInfo {
  appName: typeof APP_NAME;
  slogan: typeof APP_SLOGAN;
  worldName: typeof WORLD_NAME;
}

export const appShellInfo: AppShellInfo = {
  appName: APP_NAME,
  slogan: APP_SLOGAN,
  worldName: WORLD_NAME
};

export const isFeatureKey = (value: string): value is FeatureKey =>
  (Object.values(FEATURE_KEYS) as string[]).includes(value);

export const isFeatureStatus = (value: string): value is FeatureStatus =>
  (featureStatusValues as string[]).includes(value);

export const isFeaturePlacement = (value: string): value is FeaturePlacement =>
  (featurePlacementValues as string[]).includes(value);

export function validateFeatureEntry(entry: FeatureEntry): void {
  if (!FEATURE_KEY_PATTERN.test(entry.featureKey) || !isFeatureKey(entry.featureKey)) {
    throw new FeatureRegistryValidationError(`Invalid featureKey: ${entry.featureKey}`);
  }

  if (!isFeatureStatus(entry.status)) {
    throw new FeatureRegistryValidationError(`Invalid feature status: ${entry.status}`);
  }

  if (entry.placements.length === 0) {
    throw new FeatureRegistryValidationError(
      `Feature ${entry.featureKey} needs at least one placement`
    );
  }

  for (const placement of entry.placements) {
    if (!isFeaturePlacement(placement.placement)) {
      throw new FeatureRegistryValidationError(`Invalid feature placement: ${placement.placement}`);
    }

    if (!Number.isInteger(placement.order) || placement.order < 0) {
      throw new FeatureRegistryValidationError(`Invalid display order for ${entry.featureKey}`);
    }
  }

  if (entry.publicRoute && !PUBLIC_ROUTE_PATTERN.test(entry.publicRoute)) {
    throw new FeatureRegistryValidationError(`Invalid public route for ${entry.featureKey}`);
  }

  if (entry.status === FeatureStatus.Locked && !entry.unlockText) {
    throw new FeatureRegistryValidationError(
      `Locked feature ${entry.featureKey} requires unlockText`
    );
  }
}

export function validateFeatureRegistry(entries: readonly FeatureEntry[]): void {
  for (const entry of entries) {
    validateFeatureEntry(entry);
  }
}

export function toPublicFeatureEntry(
  entry: FeatureEntry,
  placement: FeaturePlacement
): PublicFeatureEntry | null {
  if (entry.status === FeatureStatus.Hidden) {
    return null;
  }

  const placementConfig = entry.placements.find((item) => item.placement === placement);

  if (!placementConfig) {
    return null;
  }

  return {
    featureKey: entry.featureKey,
    title: entry.title,
    icon: entry.icon,
    status: entry.status,
    placement,
    displayOrder: placementConfig.order,
    description: entry.description,
    publicRoute: entry.status === FeatureStatus.Enabled ? entry.publicRoute : undefined,
    unlockText: entry.unlockText,
    comingSoonText: entry.comingSoonText,
    unavailableText: entry.unavailableText
  };
}

export function getFeatureEntriesByPlacement(
  placement: FeaturePlacement,
  source: FeatureRegistrySource = defaultFeatureRegistrySource
): FeatureRegistryResponse {
  const entries = source
    .listEntries()
    .map((entry) => toPublicFeatureEntry(entry, placement))
    .filter((entry): entry is PublicFeatureEntry => Boolean(entry))
    .sort((first, second) => {
      if (first.displayOrder !== second.displayOrder) {
        return first.displayOrder - second.displayOrder;
      }

      return first.featureKey.localeCompare(second.featureKey);
    });

  return { placement, entries };
}

export const defaultFeatureRegistrySource: FeatureRegistrySource = {
  listEntries: () => DEFAULT_MVP_FEATURE_REGISTRY
};

export function createLocalFeatureRegistrySource(
  entries: readonly FeatureEntry[] = DEFAULT_MVP_FEATURE_REGISTRY
): FeatureRegistrySource {
  validateFeatureRegistry(entries);
  return {
    listEntries: () => entries
  };
}

export function getFeatureEntryBlockedMessage(entry: PublicFeatureEntry): string {
  if (entry.status === FeatureStatus.Locked) {
    return entry.unlockText ?? "该功能尚未解锁";
  }

  if (entry.status === FeatureStatus.ComingSoon) {
    return entry.comingSoonText ?? "敬请期待";
  }

  return entry.unavailableText ?? "该功能暂不可用";
}

export function canNavigateFeatureEntry(entry: PublicFeatureEntry): boolean {
  return entry.status === FeatureStatus.Enabled && Boolean(entry.publicRoute);
}

export function assertFeatureAdminAuthorized(
  actor?: FeatureRegistryActor,
  operation: FeatureAdminOperation = "update"
): void {
  if (!actor?.permissions.includes(FEATURE_ADMIN_PERMISSION)) {
    throw new FeatureRegistryAuthorizationError(`未授权${operation}功能入口配置`);
  }
}

export function validateAdminFeatureConfigPatch(patch: Record<string, unknown>): void {
  const allowed = new Set<string>(FEATURE_ADMIN_CONFIGURABLE_FIELDS);

  for (const field of Object.keys(patch)) {
    if (!allowed.has(field)) {
      throw new FeatureRegistryValidationError(`Feature admin field is not configurable: ${field}`);
    }
  }
}

export function applyAdminFeatureConfigPatch(
  entry: FeatureEntry,
  patch: AdminFeatureConfigPatch,
  actor?: FeatureRegistryActor
): FeatureEntry {
  assertFeatureAdminAuthorized(actor, "update");
  validateAdminFeatureConfigPatch(patch as Record<string, unknown>);

  const nextEntry = { ...entry, ...patch };
  validateFeatureEntry(nextEntry);

  return nextEntry;
}

validateFeatureRegistry(DEFAULT_MVP_FEATURE_REGISTRY);
