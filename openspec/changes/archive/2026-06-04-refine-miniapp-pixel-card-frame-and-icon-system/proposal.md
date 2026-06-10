## Why

小程序用户端已经完成全局“隐者营地”暗色像素 Material 统一，但重点像素框、普通卡片和语义 icon 的使用边界仍不够明确。若将新的像素框全局套到基础卡片类上，首页、社区、评论、订单、表单和列表都会同时变重，削弱主循环、身份卡和 Banner 的仪式感，也会让信息流页面变得嘈杂。

本 change 需要在不改业务能力的前提下，进一步固化小程序像素卡片框使用规则、普通卡片立体层级和像素 icon 体系，让视觉重点更克制、更稳定。

## What Changes

- 为小程序用户端定义三档卡片视觉层级：
  - 重点像素框：仅用于有身份、有仪式感、有主视觉重量的主卡、Banner、身份卡和页面主推荐。
  - 轻立体卡：用于列表卡、内容卡、补给项、账本统计、入口卡等常规可点击或可扫读内容。
  - 扁平容器：用于表单、评论、回复、tab、badge、输入框、订单行和筛选控件。
- 明确重点像素框不得全局套用到 `vs-panel`、`camp-card`、信息流列表、表单分组、评论、回复、订单行、tab、badge 或输入框。
- 收紧重点像素框应用位置：
  - 首页今日已摸金额主卡可使用重点像素框。
  - 社区顶部世界观 Banner 可使用重点像素框。
  - 我的页身份主卡和角色页阵营身份主卡可使用重点像素框。
  - 补给铺仅主推荐卡可使用重点像素框，分类 section 和补给 item 使用轻立体卡。
  - 隐者日报仅今日话题/今日参悟主卡可使用重点像素框，文章列表和详情阅读区使用轻立体或扁平阅读容器。
  - 生存账本详情页顶部今日生存消耗统计卡可使用重点像素框；首页今日生存消耗入口默认使用轻立体卡，避免与首页主金额卡争夺主视觉。
  - 工作档案设置页不使用重点像素框，表单区使用轻立体或扁平容器。
- 统一普通卡片轻立体质感，包括暗面层级、内高光、底部投影、轻描边和按压反馈，使其能与重点像素框共处但不抢主卡风头。
- 为首页、社区、我的三个原生 tabBar 补齐未选中/选中像素 icon 资产，并在 `pages.json` 中使用微信原生 tabBar `iconPath` / `selectedIconPath`。
- 将菜单、状态、补给、账本、日报、工作设置等语义 icon 收敛到稳定像素 icon registry 或资产映射，减少页面内临时 CSS 画法各自发挥。
- 保留当前三 tab 信息架构，不改为自定义 tabBar，不新增底部主 tab，不改路由和 feature key。
- 只改视觉层、icon 资产、卡片样式和文档规范；不改 API、数据库、CPS、社区、日报、首跑、工作价值计算、内容安全或订单同步逻辑。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `visual-system`: 补充小程序重点像素框准入规则、三档卡片层级、原生 tabBar 像素 icon 要求、语义 icon registry 收敛要求，以及视觉优化不得改变业务能力的边界。

## Impact

- 主要影响：
  - `apps/miniapp/src/pages.json`
  - `apps/miniapp/src/styles/visual-system.css`
  - `apps/miniapp/src/visual-system/illustration-registry.ts`
  - `apps/miniapp/src/visual-system/assets.ts`
  - `apps/miniapp/src/static` 下的小程序像素 icon 资产目录
  - `apps/miniapp/src/pages/home`
  - `apps/miniapp/src/pages/community`
  - `apps/miniapp/src/pages/profile`
  - `apps/miniapp/src/pages/supply-center`
  - `apps/miniapp/src/pages/daily-content`
  - `apps/miniapp/src/pages/world-intel`
  - `apps/miniapp/src/pages/accounting-ledger`
  - `apps/miniapp/src/pages/work-profile`
  - `docs/miniapp-global-ui-design-prd.md`
  - `docs/miniapp-visual-illustration-system.md`
- 不影响：
  - API 契约、接口路径、请求参数和响应字段。
  - 服务端业务逻辑、Prisma schema 和数据库迁移。
  - 登录、建档、首跑状态推导和本地缓存事实。
  - 工作价值计算、薪资时间保存和隐藏模式业务规则。
  - 社区发帖、评论、回复、举报、审核和内容安全逻辑。
  - 补给铺 CPS 转链、点击归因、订单同步、退款/取消回滚和账本统计口径。
  - feature key、主 tab 数量、页面路由和已开放业务板块。
