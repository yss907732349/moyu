## Why

小程序用户端已经形成暗黑忍者 RPG 的基础视觉，但首页、社区、详情页、我的、补给铺、日报、账本和设置等页面仍存在视觉密度、背景噪音、卡片触感、时间显示、长文本换行和页面一致性不稳定的问题。用户已确认“隐者营地”暗色像素 Material 方向更符合预期，本 change 需要将该方向固化为全局 UI 规范并逐页统一。

本 change 以 `docs/miniapp-global-ui-design-prd.md` 为核心 PRD，目标是统一视觉和展示层，而不是重构业务能力。

## What Changes

- 统一小程序用户端全局 UI 视觉语言为“暗色像素 Material + 暗黑忍者 RPG + 隐者营地信息流”。
- 统一页面背景、卡片、按钮、标签、tab、输入框、状态面板、底部导航、信息流卡片和局部扫描线/发光规则。
- 优化首页、社区列表、帖子详情、我的页、补给铺、隐者日报、大陆新闻、生存账本、工作档案、WebView/兼容页的视觉一致性。
- 保留当前页面已有业务板块、功能入口、事件逻辑、路由语义、接口调用、状态推导、缓存 key、feature key 和真实插画资产。
- 规范用户侧时间展示：同日只显示时分，三天内显示 `1天前` / `2天前` / `3天前`，同年超过三天显示 `M月D日 HH:mm`，跨年显示 `YYYY年M月D日 HH:mm`，不得直接展示 raw ISO 时间。
- 修复用户生成内容、评论、回复、文章标题、订单标签等长连续字符在小屏中横向溢出的问题。
- 统一普通用户侧内部商业字段隐藏边界，补给铺和生存账本不得暴露 CPS、聚推客、佣金、订单源 ID、apikey、sid、brand_id、act_id、后台备注或原始同步响应。
- 明确全局背景不得使用大面积高对比网格；像素纹理和扫描线只能作为局部克制质感。
- 不新增底部主 tab，不恢复漫画独立主 tab，不新增未定义功能宫格，不注入假数据。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `visual-system`: 将已确认的“隐者营地”暗色像素 Material 方向纳入小程序全局视觉系统，并补充全局 UI 不动核心功能、板块完整、真实资产保留、时间展示、长文本可读性、内部字段隐藏和全页面验收要求。

## Impact

- 主要影响：
  - `apps/miniapp/src/styles/visual-system.css`
  - `apps/miniapp/src/pages/home`
  - `apps/miniapp/src/pages/community`
  - `apps/miniapp/src/pages/profile`
  - `apps/miniapp/src/pages/supply-center`
  - `apps/miniapp/src/pages/daily-content`
  - `apps/miniapp/src/pages/world-intel`
  - `apps/miniapp/src/pages/accounting-ledger`
  - `apps/miniapp/src/pages/work-profile`
  - `apps/miniapp/src/pages/webview`
  - `apps/miniapp/src/pages/comics`
- 可能新增或调整展示层工具：
  - 用户侧时间格式化工具。
  - 长文本换行/截断公共样式。
  - 全局 camp UI token 或语义 class。
- 不影响：
  - API 契约。
  - 服务端业务逻辑。
  - Prisma schema。
  - 内容安全审核。
  - 登录建档。
  - 首跑状态推导。
  - 工作价值计算。
  - CPS 订单同步、归因和账本统计。
  - 现有真实插画、头像、徽章、Banner 和封面资产。
