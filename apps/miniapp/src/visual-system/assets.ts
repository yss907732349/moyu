export const assetTaxonomy = {
  character: {
    prefix: "px-character",
    sizes: ["96x96", "160x160", "240x240"],
    usage: "隐者头像、首页角色和个人场景角色"
  },
  scene: {
    prefix: "px-scene",
    sizes: ["320x160", "640x320"],
    usage: "上班状态、隐者大陆场景和个人中心场景"
  },
  icon: {
    prefix: "px-icon",
    sizes: ["32x32", "48x48", "64x64"],
    usage: "功能入口、菜单、资源和底部 tab"
  },
  badge: {
    prefix: "px-badge",
    sizes: ["48x48", "72x72"],
    usage: "等级、当前徽章、NEW、置顶和奖励"
  },
  banner: {
    prefix: "px-banner",
    sizes: ["686x220", "686x280"],
    usage: "日报、漫画更新、活动和辅助工具横幅"
  },
  comic: {
    prefix: "px-comic",
    sizes: ["240x320", "480x640"],
    usage: "漫画封面和可解锁世界观内容"
  },
  faction: {
    prefix: "px-faction",
    sizes: ["48x48", "96x96"],
    usage: "阵营标识、社区标签和个人身份"
  },
  locked: {
    prefix: "px-locked",
    sizes: ["48x48", "160x160"],
    usage: "未解锁功能、敬请期待和遮罩提示"
  }
} as const;

export const assetRules = {
  naming: "主插画使用 <prefix>-<domain>-<name>@<size>.jpg；透明徽章和图标使用 PNG。",
  transparentBackground: "角色、图标、徽章、阵营和锁定态资产优先透明背景。",
  edgeTreatment: "暗底资产需要保留 1-2px 明边或外发光，浅色局部需要深色描边。",
  placeholder:
    "生产资产缺失时使用同风格剪影、图案底纹、暗色场景、色块面板或默认图标作为 fallback，不展示开发态尺寸文字、文件名或 TODO 文案。",
  nativeUiBoundary: "金额、倒计时、等级、经验、按钮、tabs、列表、标签和状态文本必须由原生 UI 渲染。"
} as const;
