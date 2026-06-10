export const homeLayoutTemplate = [
  "顶部身份区域",
  "已摸金额主卡",
  "像素上班状态场景",
  "主金额隐藏模式即时开关",
  "日报/餐厅主要功能入口",
  "必要倒计时卡组",
  "今日生存消耗大卡",
  "底部 Tab"
] as const;

export const communityLayoutTemplate = [
  "顶部标题",
  "漫画或活动 Banner",
  "分区 Tabs",
  "筛选 chips",
  "发布入口",
  "帖子卡列表",
  "底部 Tab"
] as const;

export const profileLayoutTemplate = [
  "资料卡",
  "等级经验",
  "资源统计",
  "每日签到",
  "本人状态摘要",
  "左侧高价值入口列表",
  "右侧阵营插画卡",
  "底部 Tab"
] as const;

export const templateBoundary = {
  usesPlaceholderData: false,
  implementsBusinessLogic: false,
  notes:
    "布局模板只表达视觉结构、状态和稳定插画预留位，不实现真实收益计算、账本统计、社区或成长流程；正式插画缺失时使用风格化 fallback，不展示开发态占位文本。"
} as const;
