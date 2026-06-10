import { UserFaction, type UserFaction as UserFactionValue } from "@moyuxia/shared";

export const PROFILE_ROLE_HERO_ARTWORK_PATH = "/static/profile/role-hero.jpg";

const profileFactionAvatarKeys = {
  [UserFaction.KeyShadow]: "avatar_key_shadow_default",
  [UserFaction.WaterEscape]: "avatar_water_escape_default",
  [UserFaction.SkyStrategy]: "avatar_sky_strategy_default",
  [UserFaction.Wanderer]: "avatar_wanderer_default"
} as const;

const profileFactionBadgeKeys = {
  [UserFaction.KeyShadow]: "badge_key_shadow_default",
  [UserFaction.WaterEscape]: "badge_water_escape_default",
  [UserFaction.SkyStrategy]: "badge_sky_strategy_default",
  [UserFaction.Wanderer]: "badge_wanderer_default"
} as const;

const profileFactionArtworkKeys = {
  [UserFaction.KeyShadow]: "scene_key_shadow_default",
  [UserFaction.WaterEscape]: "scene_water_escape_default",
  [UserFaction.SkyStrategy]: "scene_sky_strategy_default",
  [UserFaction.Wanderer]: "scene_wanderer_default"
} as const;

export const profileFactionAvatarKeyPaths = {
  avatar_key_shadow_default: "/static/profile/factions/key_shadow/avatar.jpg",
  avatar_water_escape_default: "/static/profile/factions/water_escape/avatar.jpg",
  avatar_sky_strategy_default: "/static/profile/factions/sky_strategy/avatar.jpg",
  avatar_wanderer_default: "/static/profile/factions/wanderer/avatar.jpg"
} as const;

export const profileFactionBadgeKeyPaths = {
  badge_key_shadow_default: "/static/profile/factions/key_shadow/badge.png",
  badge_water_escape_default: "/static/profile/factions/water_escape/badge.png",
  badge_sky_strategy_default: "/static/profile/factions/sky_strategy/badge.png",
  badge_wanderer_default: "/static/profile/factions/wanderer/badge.png"
} as const;

export const profileFactionArtworkKeyPaths = {
  scene_key_shadow_default: "/static/profile/factions/key_shadow/artwork.jpg",
  scene_water_escape_default: "/static/profile/factions/water_escape/artwork.jpg",
  scene_sky_strategy_default: "/static/profile/factions/sky_strategy/artwork.jpg",
  scene_wanderer_default: "/static/profile/factions/wanderer/artwork.jpg"
} as const;

export const profileFactionAssetPaths = {
  [UserFaction.KeyShadow]: {
    avatar: "/static/profile/factions/key_shadow/avatar.jpg",
    badge: "/static/profile/factions/key_shadow/badge.png",
    artwork: "/static/profile/factions/key_shadow/artwork.jpg"
  },
  [UserFaction.WaterEscape]: {
    avatar: "/static/profile/factions/water_escape/avatar.jpg",
    badge: "/static/profile/factions/water_escape/badge.png",
    artwork: "/static/profile/factions/water_escape/artwork.jpg"
  },
  [UserFaction.SkyStrategy]: {
    avatar: "/static/profile/factions/sky_strategy/avatar.jpg",
    badge: "/static/profile/factions/sky_strategy/badge.png",
    artwork: "/static/profile/factions/sky_strategy/artwork.jpg"
  },
  [UserFaction.Wanderer]: {
    avatar: "/static/profile/factions/wanderer/avatar.jpg",
    badge: "/static/profile/factions/wanderer/badge.png",
    artwork: "/static/profile/factions/wanderer/artwork.jpg"
  }
} as const;

export function resolveProfileAvatarPath(faction: UserFactionValue): string {
  return profileFactionAssetPaths[faction].avatar;
}

export function resolveProfileAvatarPathByKey(
  avatarKey: string,
  fallbackFaction: UserFactionValue
): string {
  const expectedKey = profileFactionAvatarKeys[fallbackFaction];
  return isProfileAvatarKey(avatarKey)
    ? profileFactionAvatarKeyPaths[avatarKey]
    : profileFactionAvatarKeyPaths[expectedKey];
}

export function resolveProfileBadgePath(faction: UserFactionValue): string {
  return profileFactionAssetPaths[faction].badge;
}

export function resolveProfileBadgePathByKey(
  badgeKey: string,
  fallbackFaction: UserFactionValue
): string {
  const expectedKey = profileFactionBadgeKeys[fallbackFaction];
  return isProfileBadgeKey(badgeKey)
    ? profileFactionBadgeKeyPaths[badgeKey]
    : profileFactionBadgeKeyPaths[expectedKey];
}

export function resolveProfileArtworkPath(faction: UserFactionValue): string {
  return profileFactionAssetPaths[faction].artwork;
}

export function resolveProfileArtworkPathByKey(
  artworkKey: string,
  fallbackFaction: UserFactionValue
): string {
  const expectedKey = profileFactionArtworkKeys[fallbackFaction];
  return isProfileArtworkKey(artworkKey)
    ? profileFactionArtworkKeyPaths[artworkKey]
    : profileFactionArtworkKeyPaths[expectedKey];
}

export function resolveProfileHeroArtworkPath(): string {
  return PROFILE_ROLE_HERO_ARTWORK_PATH;
}

function isProfileAvatarKey(value: string): value is keyof typeof profileFactionAvatarKeyPaths {
  return value in profileFactionAvatarKeyPaths;
}

function isProfileBadgeKey(value: string): value is keyof typeof profileFactionBadgeKeyPaths {
  return value in profileFactionBadgeKeyPaths;
}

function isProfileArtworkKey(value: string): value is keyof typeof profileFactionArtworkKeyPaths {
  return value in profileFactionArtworkKeyPaths;
}
