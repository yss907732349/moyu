import { miniappTokens, stateTokens } from "@moyuxia/ui-tokens";
import type { MiniappVisualStateKey } from "./visual-states";

export type VisualState =
  | "default"
  | "selected"
  | "disabled"
  | "locked"
  | "loading"
  | "empty"
  | MiniappVisualStateKey;

export const componentContracts = {
  home: {
    RpgPanel: ["title", "subtitle", "variant", "state", "slot"],
    PixelBanner: ["assetKey", "title", "description", "badge", "actionText"],
    CurrencyCounter: ["label", "amount", "unit", "trend", "state"],
    CountdownCard: ["label", "value", "description", "state"],
    FeatureEntry: ["featureKey", "iconAssetKey", "label", "status", "badge"],
    UtilityBanner: ["featureKey", "assetKey", "title", "description", "primaryAction", "feedback"]
  },
  community: {
    SectionTabs: ["items", "activeKey", "onChange"],
    FilterChips: ["items", "selectedKeys", "onToggle"],
    PostCard: ["author", "faction", "title", "summary", "badges", "stats", "reviewState"],
    FactionBadge: ["factionKey", "label", "tone"],
    InteractionStats: ["likes", "comments", "favorites"]
  },
  profile: {
    ProfileSummary: ["avatarAssetKey", "nickname", "faction", "level", "experience"],
    ResourceStat: ["resourceKey", "label", "value", "state"],
    FeatureGridItem: ["featureKey", "iconAssetKey", "label", "status"],
    AchievementBadge: ["assetKey", "label", "progress", "state"],
    ProfileMenuItem: ["iconAssetKey", "label", "description", "status"],
    BottomTabBar: ["items", "activeKey", "safeAreaInsetBottom"]
  }
} as const;

export const componentStateRules = {
  default: "使用普通面板背景、基础描边和主要/次要文本层级。",
  selected: "使用 selected token、高亮描边和明确选中底色。",
  disabled: "使用 disabled token，降低透明度，保留可读标签。",
  locked: "使用 locked token、锁定徽标或解锁条件，不允许触发主操作。",
  loading: "保留组件稳定尺寸，使用骨架块或占位文本。",
  empty: "保留容器和标题，展示短空态文案和可选引导操作。",
  ready: "展示真实业务数据，不再展示首跑主引导。",
  logged_out: "展示统一登录视觉和登录操作，不展示演示身份。",
  profile_missing: "展示统一建档视觉和创建档案入口，不展示阵营资源。",
  work_profile_missing: "展示统一工作档案配置视觉，不展示演示金额。",
  network_failed: "展示可恢复错误视觉、错误说明和重试操作。",
  degraded: "展示本地快照降级提示，不遮挡仍可展示的真实数据。",
  supply_unavailable: "展示补给不可用视觉和重新同步操作，不注入假补给。",
  supply_link_failed: "展示补给通道失败视觉，不暴露内部排查字段。",
  orders_not_synced: "展示订单未同步视觉，不创建假订单或表达真实 0 消费结论。"
} satisfies Record<VisualState, string>;

export const featureStatusTokens = {
  open: stateTokens.selected,
  locked: stateTokens.locked,
  comingSoon: stateTokens.disabled,
  disabled: stateTokens.disabled,
  selected: stateTokens.selected,
  new: stateTokens.new,
  pinned: stateTokens.pinned,
  reward: stateTokens.reward
} as const;

export const mobileReadability = {
  minFontRpx: miniappTokens.rpx.minText,
  bodyFontRpx: miniappTokens.rpx.bodyText,
  minLineHeight: 1.4,
  minTouchTargetRpx: miniappTokens.rpx.touchTarget,
  pagePaddingRpx: miniappTokens.rpx.pagePadding,
  safeGapRpx: miniappTokens.rpx.safeGap,
  truncation: "单行状态标签使用省略，多行正文限制 2 行，金额和倒计时优先保留完整显示。",
  smallScreenChecks: ["320px", "375px", "414px"]
} as const;
