## Why

当前小程序已经完成 MVP 主链路和暗黑像素忍者 RPG 视觉方向，但首页、补给铺、社区列表、我的页、生存账本和多类异常/空状态仍存在插画预留位、纯文本状态和局部占位视觉并存的问题。内测前需要把插画资产、页面信息密度和状态反馈收束为可持续执行的规范，避免后续页面越做越散。

## What Changes

- 建立小程序用户端插画资产规范，明确首页、补给铺、社区、我的、生存账本、首跑引导、空状态和错误状态使用的资产类型、尺寸比例、安全区、命名和使用禁区。
- 优化高频用户链路 UI，优先覆盖首页、补给铺、社区列表、我的页和生存账本，不先改后台运营中心。
- 补齐统一视觉状态，覆盖加载、空数据、未登录、未建档、工作档案未配置、网络失败、本地快照降级、补给不可用和订单未同步等场景。
- 将正式插画缺失时的 fallback 从开发态占位收束为同风格剪影、暗色图案、语义 icon 或状态场景。
- 同步设计规范和相关能力规格，明确动态金额、倒计时、按钮、列表、状态标签和业务文案必须由原生 UI 渲染，不作为静态图片切片交付。
- 不新增后台能力、不改 CPS/账本/社区/用户资料数据模型、不恢复漫画独立 tab、不引入成就商店或复杂动画系统。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `visual-system`: 收紧插画资产矩阵、状态视觉、移动端信息密度、fallback 和原生 UI 边界要求。
- `work-value-tracker`: 首页主卡、隐藏模式、工作档案未配置和同步失败状态需要遵循统一插画/状态视觉。
- `supply-center`: 补给铺板块 icon、主推荐、空补给、补给不可用和转链失败状态需要具备统一视觉表达。
- `community-lite`: 社区列表 Banner、空列表、未登录/未建档引导和帖子缩略图视觉需要统一。
- `accounting-ledger`: 生存账本空订单、订单同步中和网络失败状态需要使用统一状态视觉。
- `user-growth-profile`: 我的页阵营资产、菜单语义 icon、未登录/未建档/错误状态需要与插画系统一致。
- `miniapp-first-run-user-flow`: 首跑引导、登录、建档和工作档案缺失状态需要共享状态视觉语言。

## Impact

- 影响小程序端页面：`apps/miniapp/src/pages/home`、`apps/miniapp/src/pages/supply-center`、`apps/miniapp/src/pages/community`、`apps/miniapp/src/pages/profile`、`apps/miniapp/src/pages/accounting-ledger`。
- 影响小程序视觉系统：`apps/miniapp/src/visual-system`、`apps/miniapp/src/styles/visual-system.css`、`apps/miniapp/src/static`。
- 影响共享视觉 token：可能需要在 `packages/ui-tokens` 中补充状态或资产语义 token。
- 影响规格与文档：`openspec/specs/visual-system` 及相关用户端能力规格，后续文档需记录插画尺寸、生成提示词、资产禁区和验收边界。
