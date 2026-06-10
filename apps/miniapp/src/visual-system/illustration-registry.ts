/**
 * 小程序用户端插画预留清单
 * 所有插画位使用稳定 assetKey，正式插画制作完成后按 key 替换 fallback。
 */

export const IllustrationKeys = {
  // 首页
  homeBannerNormal: "px-banner-home-work",
  homeBannerHidden: "px-banner-home-hidden",
  homeDailyEntry: "px-banner-home-daily",
  homeSupplyEntry: "px-banner-home-supply",
  homeCountdownIcon: "px-icon-home-countdown",
  homeSurvivalIcon: "px-icon-home-survival",

  // 原生 tabBar
  tabBarHome: "px-icon-tab-home",
  tabBarHomeActive: "px-icon-tab-home-active",
  tabBarCommunity: "px-icon-tab-community",
  tabBarCommunityActive: "px-icon-tab-community-active",
  tabBarProfile: "px-icon-tab-profile",
  tabBarProfileActive: "px-icon-tab-profile-active",

  // 社区
  communityBanner: "px-banner-community-top",
  communityIconSection: "px-icon-community-section",
  communityIconPost: "px-icon-community-post",
  communityIconMessage: "px-icon-community-message",
  communityPostThumb: "px-banner-community-post-thumb",
  communityEmpty: "px-scene-community-empty",

  // 我的
  profileAvatarWanderer: "px-faction-wanderer-avatar",
  profileAvatarKeyShadow: "px-faction-key_shadow-avatar",
  profileAvatarSkyStrategy: "px-faction-sky_strategy-avatar",
  profileAvatarWaterEscape: "px-faction-water_escape-avatar",
  profileBadgeWanderer: "px-faction-wanderer-badge",
  profileBadgeKeyShadow: "px-faction-key_shadow-badge",
  profileBadgeSkyStrategy: "px-faction-sky_strategy-badge",
  profileBadgeWaterEscape: "px-faction-water_escape-badge",
  profileArtworkWanderer: "px-faction-wanderer-artwork",
  profileArtworkKeyShadow: "px-faction-key_shadow-artwork",
  profileArtworkSkyStrategy: "px-faction-sky_strategy-artwork",
  profileArtworkWaterEscape: "px-faction-water_escape-artwork",
  profileMenuRole: "px-icon-menu-role",
  profileMenuWorkSettings: "px-icon-menu-work-settings",
  profileMenuMyPosts: "px-icon-menu-my-posts",
  profileMenuFavorites: "px-icon-menu-favorites",
  profileMenuMessages: "px-icon-menu-messages",
  profileMenuLedger: "px-icon-menu-ledger",

  // 补给铺
  supplyBannerCanteen: "px-banner-supply-canteen",
  supplyBannerAfternoon: "px-banner-supply-afternoon",
  supplyBannerCommute: "px-banner-supply-commute",
  supplyItemDefault: "px-banner-supply-item-default",
  supplyLinkFail: "px-scene-supply-link-fail",
  supplyEmpty: "px-scene-supply-empty",

  // 日报 / 大陆新闻
  dailyContentCover: "px-banner-daily-cover",
  worldIntelCover: "px-banner-world-intel-cover",

  // 生存账本
  ledgerEmpty: "px-scene-ledger-empty",
  ledgerError: "px-scene-ledger-error",
  ledgerIconCanteen: "px-icon-ledger-canteen",
  ledgerIconAfternoon: "px-icon-ledger-afternoon",
  ledgerIconCommute: "px-icon-ledger-commute",

  // 工作设置
  workSettingsIcon: "px-icon-work-settings",

  // 首跑 / 登录 / 建档
  firstRunGuide: "px-scene-first-run",
  loginScene: "px-scene-login",
  createProfileScene: "px-scene-create-profile",

  // 空状态 / 错误态
  emptyDefault: "px-scene-empty-default",
  errorDefault: "px-scene-error-default",
  loadingDefault: "px-scene-loading-default"
} as const;

export type IllustrationKey = (typeof IllustrationKeys)[keyof typeof IllustrationKeys];

export type IllustrationAssetKind =
  | "banner"
  | "bannerTall"
  | "artwork"
  | "scene"
  | "icon"
  | "avatar"
  | "badge";

export type IllustrationAssetSpec = {
  readonly assetKey: IllustrationKey;
  readonly kind: IllustrationAssetKind;
  readonly recommendedSize: string;
  readonly ratio: string;
  readonly minHeightRpx: number;
  readonly safeZone: string;
  readonly transparentBackground: boolean;
  readonly pages: readonly string[];
  readonly fallbackClass: string;
  readonly sourcePath?: string;
  readonly note: string;
};

/**
 * 插画预留位规格
 * ratio: width/height 比例字符串，用于 aspect-ratio CSS
 * minHeight: 最小高度 rpx
 * safeZone: 文字叠加安全区描述
 */
export const IllustrationSpecs: Record<
  IllustrationAssetKind,
  { ratio: string; recommendedSize: string; minHeightRpx: number; safeZone: string }
> = {
  banner: {
    ratio: "686/220",
    recommendedSize: "686x220",
    minHeightRpx: 220,
    safeZone: "底部 60rpx 为文字叠加安全区"
  },
  bannerTall: {
    ratio: "686/280",
    recommendedSize: "686x280",
    minHeightRpx: 280,
    safeZone: "底部 80rpx 为文字叠加安全区"
  },
  artwork: {
    ratio: "5/7",
    recommendedSize: "360x540",
    minHeightRpx: 420,
    safeZone: "顶部 40rpx 和底部 80rpx 为安全区"
  },
  scene: {
    ratio: "4/3",
    recommendedSize: "640x480",
    minHeightRpx: 240,
    safeZone: "底部 60rpx 为文字叠加安全区"
  },
  icon: { ratio: "1/1", recommendedSize: "96x96", minHeightRpx: 64, safeZone: "无文字叠加" },
  avatar: {
    ratio: "1/1",
    recommendedSize: "160x160",
    minHeightRpx: 96,
    safeZone: "无文字叠加"
  },
  badge: { ratio: "1/1", recommendedSize: "96x96", minHeightRpx: 64, safeZone: "无文字叠加" }
};

const profileFactionSources = {
  [IllustrationKeys.profileAvatarWanderer]: "/static/profile/factions/wanderer/avatar.jpg",
  [IllustrationKeys.profileAvatarKeyShadow]: "/static/profile/factions/key_shadow/avatar.jpg",
  [IllustrationKeys.profileAvatarSkyStrategy]: "/static/profile/factions/sky_strategy/avatar.jpg",
  [IllustrationKeys.profileAvatarWaterEscape]: "/static/profile/factions/water_escape/avatar.jpg",
  [IllustrationKeys.profileBadgeWanderer]: "/static/profile/factions/wanderer/badge.png",
  [IllustrationKeys.profileBadgeKeyShadow]: "/static/profile/factions/key_shadow/badge.png",
  [IllustrationKeys.profileBadgeSkyStrategy]: "/static/profile/factions/sky_strategy/badge.png",
  [IllustrationKeys.profileBadgeWaterEscape]: "/static/profile/factions/water_escape/badge.png",
  [IllustrationKeys.profileArtworkWanderer]: "/static/profile/factions/wanderer/artwork.jpg",
  [IllustrationKeys.profileArtworkKeyShadow]: "/static/profile/factions/key_shadow/artwork.jpg",
  [IllustrationKeys.profileArtworkSkyStrategy]: "/static/profile/factions/sky_strategy/artwork.jpg",
  [IllustrationKeys.profileArtworkWaterEscape]: "/static/profile/factions/water_escape/artwork.jpg"
} satisfies Partial<Record<IllustrationKey, string>>;

const staticIconSources = {
  homeDailyEntry: "/static/icons/home-entry-daily-v2.png",
  homeSupplyEntry: "/static/icons/home-entry-supply-v2.png",
  countdownRest: "/static/icons/home-countdown-rest-v2.png",
  countdownPayday: "/static/icons/home-countdown-payday-v2.png",
  countdownHoliday: "/static/icons/home-countdown-holiday-v2.png",
  workSettings: "/static/icons/work-settings-rpg-v2.png",
  forumEmpty: "/static/icons/forum-empty-rpg.png",
  resourceHiddenCoin: "/static/icons/resource-hidden-coin-rpg-v2.png",
  resourceEnergy: "/static/icons/resource-energy-rpg-v2.png",
  resourceCheckin: "/static/icons/resource-checkin-rpg-v2.png",
  survivalCanteen: "/static/icons/survival-canteen-rpg-v2.png",
  survivalAfternoon: "/static/icons/survival-afternoon-rpg-v2.png",
  survivalCommute: "/static/icons/survival-commute-rpg-v2.png",
  menuRole: "/static/icons/menu-role-rpg-v2.png",
  menuPosts: "/static/icons/menu-posts-rpg-v2.png",
  menuFavorites: "/static/icons/menu-favorites-rpg-v2.png",
  menuMessages: "/static/icons/menu-messages-rpg-v2.png",
  menuLedger: "/static/icons/menu-ledger-rpg-v2.png"
} as const;

const explicitSources = {
  ...profileFactionSources,
  [IllustrationKeys.tabBarHome]: "/static/tabbar/home.png",
  [IllustrationKeys.tabBarHomeActive]: "/static/tabbar/home-active.png",
  [IllustrationKeys.tabBarCommunity]: "/static/tabbar/community.png",
  [IllustrationKeys.tabBarCommunityActive]: "/static/tabbar/community-active.png",
  [IllustrationKeys.tabBarProfile]: "/static/tabbar/profile.png",
  [IllustrationKeys.tabBarProfileActive]: "/static/tabbar/profile-active.png",
  [IllustrationKeys.communityEmpty]: staticIconSources.forumEmpty,
  [IllustrationKeys.profileMenuRole]: staticIconSources.menuRole,
  [IllustrationKeys.profileMenuWorkSettings]: staticIconSources.workSettings,
  [IllustrationKeys.profileMenuMyPosts]: staticIconSources.menuPosts,
  [IllustrationKeys.profileMenuFavorites]: staticIconSources.menuFavorites,
  [IllustrationKeys.profileMenuMessages]: staticIconSources.menuMessages,
  [IllustrationKeys.profileMenuLedger]: staticIconSources.menuLedger,
  [IllustrationKeys.homeDailyEntry]: staticIconSources.homeDailyEntry,
  [IllustrationKeys.homeSupplyEntry]: staticIconSources.homeSupplyEntry,
  [IllustrationKeys.ledgerIconCanteen]: staticIconSources.survivalCanteen,
  [IllustrationKeys.ledgerIconAfternoon]: staticIconSources.survivalAfternoon,
  [IllustrationKeys.ledgerIconCommute]: staticIconSources.survivalCommute,
  [IllustrationKeys.workSettingsIcon]: staticIconSources.workSettings,
  [IllustrationKeys.emptyDefault]: staticIconSources.forumEmpty,
  [IllustrationKeys.supplyItemDefault]: "/static/covers/supply-cover.jpg",
  [IllustrationKeys.dailyContentCover]: "/static/covers/daily-cover.jpg",
  [IllustrationKeys.worldIntelCover]: "/static/daily-content/world-intel-cover.jpg"
} satisfies Partial<Record<IllustrationKey, string>>;

const assetKindMap = {
  [IllustrationKeys.homeBannerNormal]: "bannerTall",
  [IllustrationKeys.homeBannerHidden]: "bannerTall",
  [IllustrationKeys.homeDailyEntry]: "icon",
  [IllustrationKeys.homeSupplyEntry]: "icon",
  [IllustrationKeys.homeCountdownIcon]: "icon",
  [IllustrationKeys.homeSurvivalIcon]: "icon",
  [IllustrationKeys.tabBarHome]: "icon",
  [IllustrationKeys.tabBarHomeActive]: "icon",
  [IllustrationKeys.tabBarCommunity]: "icon",
  [IllustrationKeys.tabBarCommunityActive]: "icon",
  [IllustrationKeys.tabBarProfile]: "icon",
  [IllustrationKeys.tabBarProfileActive]: "icon",
  [IllustrationKeys.communityBanner]: "banner",
  [IllustrationKeys.communityIconSection]: "icon",
  [IllustrationKeys.communityIconPost]: "icon",
  [IllustrationKeys.communityIconMessage]: "icon",
  [IllustrationKeys.communityPostThumb]: "banner",
  [IllustrationKeys.communityEmpty]: "scene",
  [IllustrationKeys.profileAvatarWanderer]: "avatar",
  [IllustrationKeys.profileAvatarKeyShadow]: "avatar",
  [IllustrationKeys.profileAvatarSkyStrategy]: "avatar",
  [IllustrationKeys.profileAvatarWaterEscape]: "avatar",
  [IllustrationKeys.profileBadgeWanderer]: "badge",
  [IllustrationKeys.profileBadgeKeyShadow]: "badge",
  [IllustrationKeys.profileBadgeSkyStrategy]: "badge",
  [IllustrationKeys.profileBadgeWaterEscape]: "badge",
  [IllustrationKeys.profileArtworkWanderer]: "artwork",
  [IllustrationKeys.profileArtworkKeyShadow]: "artwork",
  [IllustrationKeys.profileArtworkSkyStrategy]: "artwork",
  [IllustrationKeys.profileArtworkWaterEscape]: "artwork",
  [IllustrationKeys.profileMenuRole]: "icon",
  [IllustrationKeys.profileMenuWorkSettings]: "icon",
  [IllustrationKeys.profileMenuMyPosts]: "icon",
  [IllustrationKeys.profileMenuFavorites]: "icon",
  [IllustrationKeys.profileMenuMessages]: "icon",
  [IllustrationKeys.profileMenuLedger]: "icon",
  [IllustrationKeys.supplyBannerCanteen]: "icon",
  [IllustrationKeys.supplyBannerAfternoon]: "icon",
  [IllustrationKeys.supplyBannerCommute]: "icon",
  [IllustrationKeys.supplyItemDefault]: "banner",
  [IllustrationKeys.supplyLinkFail]: "scene",
  [IllustrationKeys.supplyEmpty]: "scene",
  [IllustrationKeys.dailyContentCover]: "banner",
  [IllustrationKeys.worldIntelCover]: "banner",
  [IllustrationKeys.ledgerEmpty]: "scene",
  [IllustrationKeys.ledgerError]: "scene",
  [IllustrationKeys.ledgerIconCanteen]: "icon",
  [IllustrationKeys.ledgerIconAfternoon]: "icon",
  [IllustrationKeys.ledgerIconCommute]: "icon",
  [IllustrationKeys.workSettingsIcon]: "icon",
  [IllustrationKeys.firstRunGuide]: "scene",
  [IllustrationKeys.loginScene]: "scene",
  [IllustrationKeys.createProfileScene]: "scene",
  [IllustrationKeys.emptyDefault]: "scene",
  [IllustrationKeys.errorDefault]: "scene",
  [IllustrationKeys.loadingDefault]: "scene"
} satisfies Record<IllustrationKey, IllustrationAssetKind>;

const assetPages = {
  [IllustrationKeys.homeBannerNormal]: ["首页"],
  [IllustrationKeys.homeBannerHidden]: ["首页隐藏模式"],
  [IllustrationKeys.homeDailyEntry]: ["首页", "隐者日报入口"],
  [IllustrationKeys.homeSupplyEntry]: ["首页", "补给铺入口"],
  [IllustrationKeys.homeCountdownIcon]: ["首页倒计时"],
  [IllustrationKeys.homeSurvivalIcon]: ["首页", "生存账本入口"],
  [IllustrationKeys.tabBarHome]: ["原生 tabBar", "首页未选中"],
  [IllustrationKeys.tabBarHomeActive]: ["原生 tabBar", "首页选中"],
  [IllustrationKeys.tabBarCommunity]: ["原生 tabBar", "社区未选中"],
  [IllustrationKeys.tabBarCommunityActive]: ["原生 tabBar", "社区选中"],
  [IllustrationKeys.tabBarProfile]: ["原生 tabBar", "我的未选中"],
  [IllustrationKeys.tabBarProfileActive]: ["原生 tabBar", "我的选中"],
  [IllustrationKeys.communityBanner]: ["社区首页"],
  [IllustrationKeys.communityIconSection]: ["社区分区"],
  [IllustrationKeys.communityIconPost]: ["社区帖子"],
  [IllustrationKeys.communityIconMessage]: ["论坛消息"],
  [IllustrationKeys.communityPostThumb]: ["社区列表缩略图"],
  [IllustrationKeys.communityEmpty]: ["社区空状态"],
  [IllustrationKeys.profileAvatarWanderer]: ["我的页", "角色页"],
  [IllustrationKeys.profileAvatarKeyShadow]: ["我的页", "角色页"],
  [IllustrationKeys.profileAvatarSkyStrategy]: ["我的页", "角色页"],
  [IllustrationKeys.profileAvatarWaterEscape]: ["我的页", "角色页"],
  [IllustrationKeys.profileBadgeWanderer]: ["我的页", "角色页"],
  [IllustrationKeys.profileBadgeKeyShadow]: ["我的页", "角色页"],
  [IllustrationKeys.profileBadgeSkyStrategy]: ["我的页", "角色页"],
  [IllustrationKeys.profileBadgeWaterEscape]: ["我的页", "角色页"],
  [IllustrationKeys.profileArtworkWanderer]: ["我的页", "角色页"],
  [IllustrationKeys.profileArtworkKeyShadow]: ["我的页", "角色页"],
  [IllustrationKeys.profileArtworkSkyStrategy]: ["我的页", "角色页"],
  [IllustrationKeys.profileArtworkWaterEscape]: ["我的页", "角色页"],
  [IllustrationKeys.profileMenuRole]: ["我的页菜单"],
  [IllustrationKeys.profileMenuWorkSettings]: ["我的页菜单"],
  [IllustrationKeys.profileMenuMyPosts]: ["我的页菜单"],
  [IllustrationKeys.profileMenuFavorites]: ["我的页菜单"],
  [IllustrationKeys.profileMenuMessages]: ["我的页菜单"],
  [IllustrationKeys.profileMenuLedger]: ["我的页菜单"],
  [IllustrationKeys.supplyBannerCanteen]: ["补给铺", "隐者食堂"],
  [IllustrationKeys.supplyBannerAfternoon]: ["补给铺", "下午续命"],
  [IllustrationKeys.supplyBannerCommute]: ["补给铺", "通勤补给"],
  [IllustrationKeys.supplyItemDefault]: ["补给铺商品"],
  [IllustrationKeys.supplyLinkFail]: ["补给铺转链失败"],
  [IllustrationKeys.supplyEmpty]: ["补给铺空状态"],
  [IllustrationKeys.dailyContentCover]: ["隐者日报", "首页入口"],
  [IllustrationKeys.worldIntelCover]: ["大陆新闻", "社区入口"],
  [IllustrationKeys.ledgerEmpty]: ["生存账本空订单"],
  [IllustrationKeys.ledgerError]: ["生存账本错误"],
  [IllustrationKeys.ledgerIconCanteen]: ["生存账本", "隐者食堂"],
  [IllustrationKeys.ledgerIconAfternoon]: ["生存账本", "下午续命"],
  [IllustrationKeys.ledgerIconCommute]: ["生存账本", "通勤"],
  [IllustrationKeys.workSettingsIcon]: ["工作档案设置"],
  [IllustrationKeys.firstRunGuide]: ["首跑引导"],
  [IllustrationKeys.loginScene]: ["登录引导"],
  [IllustrationKeys.createProfileScene]: ["建档引导"],
  [IllustrationKeys.emptyDefault]: ["通用空状态"],
  [IllustrationKeys.errorDefault]: ["通用错误状态"],
  [IllustrationKeys.loadingDefault]: ["通用加载状态"]
} satisfies Record<IllustrationKey, readonly string[]>;

const assetFallbacks = {
  [IllustrationKeys.homeBannerNormal]: "vs-fallback-work",
  [IllustrationKeys.homeBannerHidden]: "vs-fallback-hidden",
  [IllustrationKeys.homeDailyEntry]: "vs-icon-daily",
  [IllustrationKeys.homeSupplyEntry]: "vs-icon-supply",
  [IllustrationKeys.homeCountdownIcon]: "vs-icon-countdown",
  [IllustrationKeys.homeSurvivalIcon]: "vs-icon-ledger",
  [IllustrationKeys.tabBarHome]: "vs-icon-work-settings",
  [IllustrationKeys.tabBarHomeActive]: "vs-icon-work-settings",
  [IllustrationKeys.tabBarCommunity]: "vs-icon-community",
  [IllustrationKeys.tabBarCommunityActive]: "vs-icon-community",
  [IllustrationKeys.tabBarProfile]: "vs-icon-role",
  [IllustrationKeys.tabBarProfileActive]: "vs-icon-role",
  [IllustrationKeys.communityBanner]: "vs-fallback-community",
  [IllustrationKeys.communityIconSection]: "vs-icon-community",
  [IllustrationKeys.communityIconPost]: "vs-icon-posts",
  [IllustrationKeys.communityIconMessage]: "vs-icon-messages",
  [IllustrationKeys.communityPostThumb]: "vs-fallback-community-thumb",
  [IllustrationKeys.communityEmpty]: "vs-fallback-community",
  [IllustrationKeys.profileAvatarWanderer]: "vs-icon-role",
  [IllustrationKeys.profileAvatarKeyShadow]: "vs-icon-role",
  [IllustrationKeys.profileAvatarSkyStrategy]: "vs-icon-role",
  [IllustrationKeys.profileAvatarWaterEscape]: "vs-icon-role",
  [IllustrationKeys.profileBadgeWanderer]: "vs-icon-role",
  [IllustrationKeys.profileBadgeKeyShadow]: "vs-icon-role",
  [IllustrationKeys.profileBadgeSkyStrategy]: "vs-icon-role",
  [IllustrationKeys.profileBadgeWaterEscape]: "vs-icon-role",
  [IllustrationKeys.profileArtworkWanderer]: "vs-fallback-faction",
  [IllustrationKeys.profileArtworkKeyShadow]: "vs-fallback-faction",
  [IllustrationKeys.profileArtworkSkyStrategy]: "vs-fallback-faction",
  [IllustrationKeys.profileArtworkWaterEscape]: "vs-fallback-faction",
  [IllustrationKeys.profileMenuRole]: "vs-icon-role",
  [IllustrationKeys.profileMenuWorkSettings]: "vs-icon-work-settings",
  [IllustrationKeys.profileMenuMyPosts]: "vs-icon-posts",
  [IllustrationKeys.profileMenuFavorites]: "vs-icon-favorites",
  [IllustrationKeys.profileMenuMessages]: "vs-icon-messages",
  [IllustrationKeys.profileMenuLedger]: "vs-icon-ledger",
  [IllustrationKeys.supplyBannerCanteen]: "vs-icon-canteen",
  [IllustrationKeys.supplyBannerAfternoon]: "vs-icon-afternoon",
  [IllustrationKeys.supplyBannerCommute]: "vs-icon-commute",
  [IllustrationKeys.supplyItemDefault]: "vs-fallback-supply",
  [IllustrationKeys.supplyLinkFail]: "vs-fallback-error",
  [IllustrationKeys.supplyEmpty]: "vs-fallback-supply",
  [IllustrationKeys.dailyContentCover]: "vs-fallback-daily",
  [IllustrationKeys.worldIntelCover]: "vs-fallback-community",
  [IllustrationKeys.ledgerEmpty]: "vs-fallback-ledger",
  [IllustrationKeys.ledgerError]: "vs-fallback-error",
  [IllustrationKeys.ledgerIconCanteen]: "vs-icon-canteen",
  [IllustrationKeys.ledgerIconAfternoon]: "vs-icon-afternoon",
  [IllustrationKeys.ledgerIconCommute]: "vs-icon-commute",
  [IllustrationKeys.workSettingsIcon]: "vs-icon-work-settings",
  [IllustrationKeys.firstRunGuide]: "vs-fallback-first-run",
  [IllustrationKeys.loginScene]: "vs-fallback-login",
  [IllustrationKeys.createProfileScene]: "vs-fallback-profile",
  [IllustrationKeys.emptyDefault]: "vs-fallback-empty",
  [IllustrationKeys.errorDefault]: "vs-fallback-error",
  [IllustrationKeys.loadingDefault]: "vs-fallback-loading"
} satisfies Record<IllustrationKey, string>;

const iconKinds = new Set<IllustrationAssetKind>(["icon", "avatar", "badge"]);

export const IllustrationAssetRegistry = Object.values(IllustrationKeys).reduce(
  (registry, assetKey) => {
    const kind = assetKindMap[assetKey];
    const spec = IllustrationSpecs[kind];
    const sourcePath = (explicitSources as Partial<Record<IllustrationKey, string>>)[assetKey];

    registry[assetKey] = {
      assetKey,
      kind,
      recommendedSize: spec.recommendedSize,
      ratio: spec.ratio,
      minHeightRpx: spec.minHeightRpx,
      safeZone: spec.safeZone,
      transparentBackground: iconKinds.has(kind),
      pages: assetPages[assetKey],
      fallbackClass: assetFallbacks[assetKey],
      sourcePath,
      note: sourcePath
        ? "已有正式静态资产，按展示容器裁切。"
        : "正式插画待补，当前使用同风格 CSS fallback。"
    };

    return registry;
  },
  {} as Record<IllustrationKey, IllustrationAssetSpec>
);

export function resolveIllustrationAsset(assetKey: IllustrationKey): IllustrationAssetSpec {
  return (
    IllustrationAssetRegistry[assetKey] ?? IllustrationAssetRegistry[IllustrationKeys.emptyDefault]
  );
}

const semanticIconClassByKey: Record<string, string> = {
  "px-icon-work-value": "vs-icon-work-settings",
  "px-icon-home-countdown": "vs-icon-countdown",
  "px-icon-home-survival": "vs-icon-ledger",
  "px-icon-tab-home": "vs-icon-work-settings",
  "px-icon-tab-home-active": "vs-icon-work-settings",
  "px-icon-tab-community": "vs-icon-community",
  "px-icon-tab-community-active": "vs-icon-community",
  "px-icon-tab-profile": "vs-icon-role",
  "px-icon-tab-profile-active": "vs-icon-role",
  "px-icon-menu-work-settings": "vs-icon-work-settings",
  "px-icon-hide-mode": "vs-icon-degraded",
  "px-icon-daily": "vs-icon-daily",
  "px-banner-home-daily": "vs-icon-daily",
  "px-banner-home-supply": "vs-icon-supply",
  "px-icon-menu-ledger": "vs-icon-ledger",
  "px-icon-menu-role": "vs-icon-role",
  "px-icon-faction": "vs-icon-role",
  "px-icon-checkin": "vs-icon-countdown",
  "px-icon-community": "vs-icon-community",
  "px-icon-comic": "vs-icon-posts",
  "px-icon-supply": "vs-icon-supply",
  "px-icon-rank": "vs-icon-ledger",
  "px-icon-game": "vs-icon-posts",
  "px-icon-title-shop": "vs-icon-favorites",
  "px-icon-skin-shop": "vs-icon-role",
  "px-icon-admin": "vs-icon-work-settings",
  "px-icon-menu-my-posts": "vs-icon-posts",
  "px-icon-menu-favorites": "vs-icon-favorites",
  "px-icon-menu-messages": "vs-icon-messages",
  "px-icon-community-section": "vs-icon-community",
  "px-icon-community-post": "vs-icon-posts",
  "px-icon-community-message": "vs-icon-messages",
  "px-banner-supply-canteen": "vs-icon-canteen",
  "px-banner-supply-afternoon": "vs-icon-afternoon",
  "px-banner-supply-commute": "vs-icon-commute",
  "px-icon-supply-canteen": "vs-icon-canteen",
  "px-icon-supply-afternoon": "vs-icon-afternoon",
  "px-icon-supply-commute": "vs-icon-commute",
  "px-icon-ledger-canteen": "vs-icon-canteen",
  "px-icon-ledger-afternoon": "vs-icon-afternoon",
  "px-icon-ledger-afternoon-boost": "vs-icon-afternoon",
  "px-icon-ledger-commute": "vs-icon-commute",
  "px-icon-state-ready": "vs-icon-role",
  "px-icon-state-loading": "vs-icon-loading",
  "px-icon-state-empty": "vs-icon-empty",
  "px-icon-state-login": "vs-icon-login",
  "px-icon-state-profile": "vs-icon-role",
  "px-icon-state-error": "vs-icon-error",
  "px-icon-state-degraded": "vs-icon-degraded",
  "px-icon-state-supply": "vs-icon-supply",
  "px-icon-state-ledger": "vs-icon-ledger",
  "px-icon-rest": "vs-icon-countdown",
  "px-icon-salary": "vs-icon-ledger",
  "px-icon-calendar": "vs-icon-countdown"
};

const semanticIconSourceByKey: Record<string, string> = {
  "px-icon-menu-work-settings": staticIconSources.workSettings,
  "px-icon-work-settings": staticIconSources.workSettings,
  "px-banner-home-daily": staticIconSources.homeDailyEntry,
  "px-banner-home-supply": staticIconSources.homeSupplyEntry,
  "px-icon-rest": staticIconSources.countdownRest,
  "px-icon-salary": staticIconSources.countdownPayday,
  "px-icon-calendar": staticIconSources.countdownHoliday,
  "px-icon-state-empty": staticIconSources.forumEmpty,
  "px-scene-community-empty": staticIconSources.forumEmpty,
  "px-icon-resource-hidden-coin": staticIconSources.resourceHiddenCoin,
  "px-icon-resource-energy": staticIconSources.resourceEnergy,
  "px-icon-resource-checkin": staticIconSources.resourceCheckin,
  "px-icon-menu-role": staticIconSources.menuRole,
  "px-icon-menu-my-posts": staticIconSources.menuPosts,
  "px-icon-menu-favorites": staticIconSources.menuFavorites,
  "px-icon-menu-messages": staticIconSources.menuMessages,
  "px-icon-menu-ledger": staticIconSources.menuLedger,
  "px-icon-ledger-canteen": staticIconSources.survivalCanteen,
  "px-icon-ledger-afternoon": staticIconSources.survivalAfternoon,
  "px-icon-ledger-afternoon-boost": staticIconSources.survivalAfternoon,
  "px-icon-ledger-commute": staticIconSources.survivalCommute,
  "px-icon-supply-canteen": staticIconSources.survivalCanteen,
  "px-icon-supply-afternoon": staticIconSources.survivalAfternoon,
  "px-icon-supply-commute": staticIconSources.survivalCommute,
  "px-banner-supply-canteen": staticIconSources.survivalCanteen,
  "px-banner-supply-afternoon": staticIconSources.survivalAfternoon,
  "px-banner-supply-commute": staticIconSources.survivalCommute
};

export function resolveSemanticIconClass(iconKey: string | undefined): string {
  if (!iconKey) {
    return "vs-icon-empty";
  }

  return semanticIconClassByKey[iconKey] ?? "vs-icon-empty";
}

export function resolveSemanticIconPath(iconKey: string | undefined): string {
  if (!iconKey) {
    return "";
  }

  return semanticIconSourceByKey[iconKey] ?? "";
}
