import {
  IllustrationKeys,
  resolveSemanticIconClass,
  type IllustrationKey
} from "./illustration-registry";

export type MiniappVisualStateKey =
  | "ready"
  | "loading"
  | "empty"
  | "logged_out"
  | "profile_missing"
  | "work_profile_missing"
  | "network_failed"
  | "degraded"
  | "supply_unavailable"
  | "supply_link_failed"
  | "orders_not_synced";

export type MiniappVisualStateTone =
  | "neutral"
  | "gold"
  | "cyan"
  | "violet"
  | "green"
  | "warning"
  | "danger";

export type MiniappVisualStateConfig = {
  readonly key: MiniappVisualStateKey;
  readonly title: string;
  readonly description: string;
  readonly actionText?: string;
  readonly assetKey: IllustrationKey;
  readonly iconClass: string;
  readonly tone: MiniappVisualStateTone;
};

const semanticIcon = resolveSemanticIconClass;

export const VisualStateConfigs = {
  ready: {
    key: "ready",
    title: "隐者状态已就绪",
    description: "身份、工作档案和本地状态已串联，可以进入主流程。",
    assetKey: IllustrationKeys.firstRunGuide,
    iconClass: semanticIcon("px-icon-state-ready"),
    tone: "green"
  },
  loading: {
    key: "loading",
    title: "卷轴同步中",
    description: "正在读取当前状态，请稍候。",
    assetKey: IllustrationKeys.loadingDefault,
    iconClass: semanticIcon("px-icon-state-loading"),
    tone: "cyan"
  },
  empty: {
    key: "empty",
    title: "暂时没有内容",
    description: "当前没有可展示数据，稍后再来看看。",
    assetKey: IllustrationKeys.emptyDefault,
    iconClass: semanticIcon("px-icon-state-empty"),
    tone: "neutral"
  },
  logged_out: {
    key: "logged_out",
    title: "先确认隐者身份",
    description: "登录后再创建隐者档案，个人资料、工作档案和社区身份会保持一致。",
    actionText: "微信登录",
    assetKey: IllustrationKeys.loginScene,
    iconClass: semanticIcon("px-icon-state-login"),
    tone: "gold"
  },
  profile_missing: {
    key: "profile_missing",
    title: "创建隐者档案",
    description: "选择最接近你的职业底牌，系统会分配初始阵营、头像和徽章。",
    actionText: "创建隐者档案",
    assetKey: IllustrationKeys.createProfileScene,
    iconClass: semanticIcon("px-icon-state-profile"),
    tone: "violet"
  },
  work_profile_missing: {
    key: "work_profile_missing",
    title: "配置工作档案",
    description: "填写薪资和上班时间后，首页会用本地快照实时估算今日已摸金额。",
    actionText: "去配置",
    assetKey: IllustrationKeys.workSettingsIcon,
    iconClass: semanticIcon("px-icon-menu-work-settings"),
    tone: "gold"
  },
  network_failed: {
    key: "network_failed",
    title: "同步暂时失败",
    description: "网络或服务暂不可用，可以稍后重试。",
    actionText: "重试",
    assetKey: IllustrationKeys.errorDefault,
    iconClass: semanticIcon("px-icon-state-error"),
    tone: "danger"
  },
  degraded: {
    key: "degraded",
    title: "已使用本地快照",
    description: "远端同步暂时失败，当前先展示本地可验证数据。",
    assetKey: IllustrationKeys.errorDefault,
    iconClass: semanticIcon("px-icon-state-degraded"),
    tone: "warning"
  },
  supply_unavailable: {
    key: "supply_unavailable",
    title: "补给暂未上架",
    description: "当前场景没有可用补给，稍后可重新同步。",
    actionText: "重新同步",
    assetKey: IllustrationKeys.supplyEmpty,
    iconClass: semanticIcon("px-icon-state-supply"),
    tone: "warning"
  },
  supply_link_failed: {
    key: "supply_link_failed",
    title: "补给通道暂不可用",
    description: "当前跳转目标无法打开，可以稍后重试或返回补给列表。",
    actionText: "重新同步",
    assetKey: IllustrationKeys.supplyLinkFail,
    iconClass: semanticIcon("px-icon-state-error"),
    tone: "danger"
  },
  orders_not_synced: {
    key: "orders_not_synced",
    title: "暂未同步到订单",
    description: "有效订单同步后会自动归入隐者食堂、下午续命和通勤。",
    actionText: "重新同步",
    assetKey: IllustrationKeys.ledgerEmpty,
    iconClass: semanticIcon("px-icon-state-ledger"),
    tone: "neutral"
  }
} satisfies Record<MiniappVisualStateKey, MiniappVisualStateConfig>;

export const firstRunVisualStateMap = {
  logged_out: "logged_out",
  profile_missing: "profile_missing",
  work_profile_missing: "work_profile_missing",
  ready: "ready"
} as const;

export function resolveVisualState(key: MiniappVisualStateKey): MiniappVisualStateConfig {
  return VisualStateConfigs[key];
}

export function resolveFirstRunVisualState(
  state: keyof typeof firstRunVisualStateMap
): MiniappVisualStateConfig {
  return VisualStateConfigs[firstRunVisualStateMap[state]];
}
