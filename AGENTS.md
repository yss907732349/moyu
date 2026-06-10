# AGENTS.md

## 项目概述

`摸鱼隐者` 是一款计划面向年轻打工人的微信小程序。

已确定方向：

- 应用名称：`摸鱼隐者`
- Slogan：`大隐隐于市，摸鱼隐于职`
- 世界观：`隐者大陆`
- 用户身份：`隐者`
- 视觉方向：暗黑忍者 RPG，结合像素角色、RPG 面板、阵营身份和上班工具属性
- 核心产品循环：将上班时间转化为可见金额、倒计时和 RPG 成长反馈

## 当前规划来源

当前 OpenSpec 状态：

- 最近归档的 `add-miniapp-workplace-mode-default` 已完成实现、验收与归档，小程序用户端默认视觉切换为浅色工位模式、隐者模式主动切换、全页面组件级适配、导航栏/tabBar 模式化、资产模式可读性、摸鱼工作台例外和业务边界保持已纳入当前事实来源。
- 最近归档的 `polish-community-profile-follow-experience` 已完成实现、验收与归档，社区作者入口可点击感、公开个人页隐者名片、关注/取消关注反馈、关注/粉丝列表状态、“我的”页三项数据排版、小屏社交体验和敏感字段过滤加固已纳入当前事实来源。
- 最近归档的 `harden-community-identity-and-ip-attribution` 已完成实现、验收与归档，社区发布身份门槛、隐私同意、微信手机号验证、IP 属地公开展示、后台脱敏治理和内测检查口径已纳入当前事实来源。
- 最近归档的 `add-community-follow-profile-system` 已完成实现、验收与归档，社区公开个人页、关注/粉丝关系、关注/粉丝列表、作者头像/昵称跳转、“我的”页顶部关注/粉丝统计和隐币/能量普通 UI 隐藏口径已纳入当前事实来源。
- 最近归档的 `refine-miniapp-pixel-card-frame-and-icon-system` 已完成实现、验收与归档，小程序三档卡片层级、重点像素框白名单、普通卡片轻立体质感、原生 tabBar 像素 icon、语义 icon registry 收敛和包体检查已纳入当前事实来源。
- 最近归档的 `unify-miniapp-global-camp-ui` 已完成实现、验收与归档，小程序用户侧全局营地 UI、暗色像素 Material、板块完整性、统一时间展示、长文本防溢出、真实视觉资产保留和包体检查已纳入当前事实来源。
- 最近归档的 `integrate-wechat-content-security-moderation` 已完成实现、验收与归档，微信内容安全、供应商无关内容安全摘要、文本/图片审核、图片异步回调、作者自见、公开资料字段审核、后台内容安全摘要和内测配置补充已纳入当前事实来源。
- 最近归档的 `enhance-miniapp-visual-polish-and-illustration-system` 已完成实现、验收与归档，小程序 UI 质感、插画资产规范、状态视觉、首页/社区/我的等高频页面视觉补齐和设计文档已纳入当前事实来源。
- 第一版小程序主视觉、排版、icon 和插画资产已暂定；后续视觉相关工作应以 `docs/miniapp-global-ui-design-prd.md`、`docs/miniapp-visual-illustration-system.md` 和 `openspec/specs/visual-system/spec.md` 为当前事实来源，默认只做局部替换、补齐、裁切、遮罩、小屏可读性和包体优化。
- 最近归档的 `deepen-cps-supply-commercial-loop` 已完成实现、验收与归档，补给铺商业化推荐、聚推客转链降级、点击归因脱敏、订单异常池、来源订单幂等、退款/取消回滚、后台指标和数据兼容策略已纳入当前事实来源。
- 最近归档的 `stabilize-mvp-end-to-end-beta-readiness` 已完成实现、验收与归档，MVP 内测端到端就绪、总 smoke、配置检查、数据准备/复位说明和人工内测检查清单已纳入当前事实来源。
- 最近归档的 `improve-admin-realtime-review-and-operations-ux` 已完成实现、验收与归档，后台实时待办事件、降级轮询、可控刷新、队列局部处理反馈和后台运营交互优化已纳入当前事实来源。
- 最近归档的 `refine-miniapp-layout-and-entry-hierarchy` 已完成实现、验收与归档，小程序首页/我的页入口层级、无效入口清理和 UI 设计规范同步已纳入当前事实来源。
- 最近归档的 `build-cps-supply-center-foundation` 已完成实现、验收与归档，补给铺、聚推客转链、点击归因、订单同步入账和后台补给配置已纳入当前事实来源。
- 同日归档的 `stabilize-archived-verification-references` 已修正历史归档验证引用，应作为后续验收命令和文档查验的当前事实来源。
- 近期归档的 `stabilize-miniapp-first-run-user-flow`、`extract-world-intel-as-standalone-content`、`separate-admin-daily-content-sections` 和 `fold-comic-ip-content-into-community` 也已纳入当前事实来源。

近期已归档并应作为当前事实来源的 change：

- `openspec/changes/archive/2026-05-22-setup-project-foundation`
- `openspec/changes/archive/2026-05-22-define-visual-system`
- `openspec/changes/archive/2026-05-22-define-feature-registry-contract`
- `openspec/changes/archive/2026-05-22-add-feature-registry-api`
- `openspec/changes/archive/2026-05-22-define-work-profile-contract`
- `openspec/changes/archive/2026-05-22-build-work-profile-settings`
- `openspec/changes/archive/2026-05-22-build-home-work-value-tracker`
- `openspec/changes/archive/2026-05-22-add-static-holiday-countdown`
- `openspec/changes/archive/2026-05-25-build-user-growth-profile-foundation`
- `openspec/changes/archive/2026-05-25-define-accounting-ledger-contract`
- `openspec/changes/archive/2026-05-25-redefine-accounting-ledger-as-cps-survival-ledger`
- `openspec/changes/archive/2026-05-26-define-community-lite-contract`
- `openspec/changes/archive/2026-05-26-rework-daily-content-feed-article-experience`
- `openspec/changes/archive/2026-05-26-define-daily-content-manual-ai-moderation`
- `openspec/changes/archive/2026-05-26-mature-community-lite-forum-experience`
- `openspec/changes/archive/2026-05-27-enhance-daily-content-feed-operations-experience`
- `openspec/changes/archive/2026-05-27-build-admin-operations-center`
- `openspec/changes/archive/2026-05-27-add-low-cost-content-moderation`
- `openspec/changes/archive/2026-05-27-add-admin-community-content-governance`
- `openspec/changes/archive/2026-05-27-reduce-comment-manual-review-load`
- `openspec/changes/archive/2026-05-27-enhance-profile-role-and-faction-assets`
- `openspec/changes/archive/2026-05-28-add-daily-topic-quote-posting`
- `openspec/changes/archive/2026-05-28-extract-world-intel-as-standalone-content`
- `openspec/changes/archive/2026-05-28-fold-comic-ip-content-into-community`
- `openspec/changes/archive/2026-05-28-refine-community-list-experience`
- `openspec/changes/archive/2026-05-28-separate-admin-daily-content-sections`
- `openspec/changes/archive/2026-05-28-stabilize-miniapp-first-run-user-flow`
- `openspec/changes/archive/2026-05-29-build-cps-supply-center-foundation`
- `openspec/changes/archive/2026-05-29-stabilize-archived-verification-references`
- `openspec/changes/archive/2026-06-01-improve-admin-realtime-review-and-operations-ux`
- `openspec/changes/archive/2026-06-01-refine-miniapp-layout-and-entry-hierarchy`
- `openspec/changes/archive/2026-06-01-stabilize-mvp-end-to-end-beta-readiness`
- `openspec/changes/archive/2026-06-02-deepen-cps-supply-commercial-loop`
- `openspec/changes/archive/2026-06-02-enhance-miniapp-visual-polish-and-illustration-system`
- `openspec/changes/archive/2026-06-02-integrate-wechat-content-security-moderation`
- `openspec/changes/archive/2026-06-04-unify-miniapp-global-camp-ui`
- `openspec/changes/archive/2026-06-04-refine-miniapp-pixel-card-frame-and-icon-system`
- `openspec/changes/archive/2026-06-08-harden-community-identity-and-ip-attribution`
- `openspec/changes/archive/2026-06-08-add-community-follow-profile-system`
- `openspec/changes/archive/2026-06-08-polish-community-profile-follow-experience`
- `openspec/changes/archive/2026-06-10-add-miniapp-workplace-mode-default`

已暂停的总体规划参考：

- `openspec/changes/archive/define-moyu-xia-mvp-paused`

核心文档：

- `openspec/changes/archive/define-moyu-xia-mvp-paused/proposal.md`
- `openspec/changes/archive/define-moyu-xia-mvp-paused/design.md`
- `openspec/changes/archive/define-moyu-xia-mvp-paused/specs/*/spec.md`

在开始实现或进行重大规划调整前，可以参考这些文件，但不要把该暂停规划直接作为当前执行 change。

如果近期归档 change 与暂停规划存在差异，应优先遵循近期归档 change 和当前主规格。

## 当前工程基线

项目已经进入 monorepo 工程阶段，不再是纯规划仓库。

已确定技术栈：

- 包管理与仓库结构：`pnpm workspace` monorepo
- 小程序端：`apps/miniapp`，使用 `uni-app + Vue 3 + TypeScript`，部署/发布平台为微信小程序
- 后端 API：`apps/api`，使用 `NestJS + TypeScript`
- 管理后台：`apps/admin`，使用 `Vue 3 + Vite + TypeScript`
- 共享契约：`packages/shared`
- 视觉 token：`packages/ui-tokens`
- 共享工程配置：`packages/config`
- 持久化基础：`MySQL + Prisma`

项目目录：

```text
apps/
  miniapp/        微信小程序端，uni-app + Vue 3 + TypeScript
  api/            后端 API，NestJS + TypeScript
  admin/          管理后台，Vue 3 + Vite + TypeScript
packages/
  shared/         跨端共享契约、feature key、状态枚举、工作档案类型与校验
  ui-tokens/      暗黑忍者 RPG 视觉 token
  config/         共享 TypeScript / lint / format 等工程配置
openspec/         OpenSpec 变更、规格和归档记录
scripts/          项目验证脚本和辅助脚本
docs/             内测运行说明和人工检查清单
.agent/           本地 agent 相关配置或缓存
.codex/           Codex 本地技能和项目配置
```

目录使用原则：

- 小程序页面、组件、客户端服务优先放在 `apps/miniapp`。
- 后端模块、控制器、服务、Prisma schema 和迁移优先放在 `apps/api`。
- 管理后台页面、运营配置界面和后台客户端逻辑优先放在 `apps/admin`。
- 跨端类型、枚举、feature registry、工作档案契约、校验和可复用计算逻辑优先放在 `packages/shared`。
- 视觉色彩、间距、面板和状态语义 token 优先放在 `packages/ui-tokens`。
- 新的计划、需求、设计和任务拆解应先进入 `openspec/changes/<change-name>`。
- 验证脚本优先放在 `scripts/`，并在根 `package.json` 中提供可执行命令。
- 内测运行说明、人工检查清单和跨角色操作说明优先放在 `docs/`。
- CPS 商业闭环数据兼容、订单回滚、异常排查和内测补充说明优先放在 `docs/`。
- 小程序插画资产、状态视觉、生成提示词、fallback 和页面映射说明优先放在 `docs/miniapp-visual-illustration-system.md`。
- 小程序用户端全局营地 UI、页面统一、时间展示、长文本可读性、小屏验收和包体约束优先参考 `docs/miniapp-global-ui-design-prd.md`。
- 小程序第一版主视觉、排版层级、三档卡片、重点像素框白名单、原生 tabBar 像素 icon、语义 icon registry 和插画资产映射的跨文档口径应同步维护在 `AGENTS.md`、`docs/miniapp-global-ui-design-prd.md`、`docs/miniapp-visual-illustration-system.md` 和 `openspec/specs/visual-system/spec.md`。

常用命令：

- `pnpm dev:miniapp`：构建/监听微信小程序输出
- `pnpm build:miniapp`：构建微信小程序产物
- `pnpm dev:api`：启动后端 API 开发服务
- `pnpm build:api`：构建后端 API
- `pnpm dev:admin`：启动管理后台开发服务
- `pnpm build:admin`：构建管理后台
- `pnpm typecheck`：执行 workspace 类型检查
- `pnpm lint`：执行统一 lint
- `pnpm format`：使用 Prettier 格式化项目文件
- `pnpm format:check`：检查格式
- `pnpm prisma:generate`：生成 Prisma Client
- `pnpm prisma:migrate`：基于 MySQL 执行本地迁移

验证脚本：

- `pnpm verify:feature-registry`
- `pnpm verify:feature-registry-api`
- `pnpm verify:miniapp-feature-registry`
- `pnpm verify:miniapp-api-config`
- `pnpm verify:work-profile`
- `pnpm verify:work-profile-api`
- `pnpm verify:miniapp-work-profile`
- `pnpm verify:user-growth-profile`
- `pnpm verify:user-growth-profile-api`
- `pnpm verify:miniapp-user-growth-profile`
- `pnpm verify:accounting-ledger`
- `pnpm verify:accounting-ledger-api`
- `pnpm verify:miniapp-accounting-ledger`
- `pnpm verify:miniapp-package-size`
- `pnpm verify:supply-center`
- `pnpm verify:supply-center-api`
- `pnpm verify:miniapp-supply-center`
- `pnpm verify:admin-supply-center`
- `pnpm verify:community-lite`
- `pnpm verify:community-lite-api`
- `pnpm verify:community-follow-profile-system`
- `pnpm verify:miniapp-community-lite`
- `pnpm verify:admin-community-lite`
- `pnpm verify:admin-community-governance`
- `pnpm verify:daily-content-feed`
- `pnpm verify:daily-content-feed-api`
- `pnpm verify:miniapp-daily-content-feed`
- `pnpm verify:admin-daily-content-feed`
- `pnpm verify:admin-operations`
- `pnpm verify:ai-content-moderation`
- `pnpm sync:sensitive-lexicon`
- `pnpm verify:low-cost-content-moderation`
- `pnpm verify:comment-review-automation`
- `pnpm sync:holidays`
- `pnpm verify:holidays`
- `pnpm verify:mvp-beta-config`
- `pnpm verify:mvp-beta-readiness`

## 文档语言要求

后续项目文档应使用中文编写，包括但不限于：

- OpenSpec change
- `proposal.md`
- `design.md`
- `tasks.md`
- `specs/*/spec.md`
- 产品说明
- 技术说明
- 设计说明
- 需求补充

只有在代码、接口字段、命令、配置项、第三方专有名词或英文原文必须保留时，才使用英文。

与用户沟通时，对用户可见的思考说明、分析过程、执行计划、进度更新、问题判断和最终总结也应使用中文展示；只有在引用代码、接口字段、命令、配置项、错误信息、第三方专有名词或英文原文必须保留时，才使用英文。

## 已确定的 MVP 能力

MVP 围绕以下能力组织：

- `work-value-tracker`：已摸金额、薪资/时间设置、倒计时、节假日提醒和隐藏模式
- `user-growth-profile`：微信登录、个人资料、阵营、等级、经验、称号、隐币、能量、签到和成就
- `daily-content-feed`：文章化隐者日报、每日参悟、离谱卷宗、文章详情、互动和后台审核；大陆新闻入口指向独立内容库
- `world-intel-content`：大陆新闻独立内容库、后台管理、公开分页列表、文章详情、发布生命周期和历史数据兼容
- `community-lite`：论坛/轻社区发帖、阵营专区、评论、回复、图片、通知、点赞、收藏、举报、日报参悟引用发帖、审核流程和后台运营处理
- `community-media-asset`：社区图片上传、绑定、图片内容安全状态、孤儿清理、上传限制和公开展示边界
- `community-identity-and-ip-attribution`：社区发布隐私同意、微信手机号验证门槛、服务端可信 IP 提取、发布时 IP 属地快照、公开降精度属地展示和后台脱敏合规摘要
- `community-follow-profile-system`：社区公开个人页、稳定公开标识、作者头像/昵称跳转、单向关注/取消关注、关注/粉丝列表、公开统计、隐者名片体验和敏感字段过滤
- `comic-ip-content`：漫画/IP 世界观内容预期已从独立主 tab 收敛为社区页 Banner 或后续社区内入口
- `accounting-ledger`：CPS 生存账单、三类生存消耗、聚推客订单入账、来源订单幂等、退款/取消回滚、订单详情、本周生存报告、首页今日生存消耗入口
- `supply-center`：补给铺、三类上班生存补给、场景化推荐、聚推客点击归因、转链跳转、备用通道、订单同步入账、异常池、后台配置和排查
- `feature-registry`：已开放、未解锁、敬请期待的功能入口配置
- `admin-operations`：后台运营中心、工作台、统一审核队列、审核详情、实时待办提示、降级轮询、可控刷新、日报发布待办、补给铺配置排查、CPS 指标/异常排查和后台令牌边界
- `wechat-content-security-moderation`：微信内容安全文本/图片审核、mock、供应商错误降级、图片异步回调、作者自见和敏感字段边界
- `low-cost-content-moderation`：本地敏感词库、文本归一化、风险分级、评论/回复低成本审核和后台风险提示
- `admin-community-content-governance`：后台社区内容总览、搜索、治理详情、内容移除、用户治理和操作审计
- `comment-review-automation`：评论/回复自动通过、自动驳回、人工复核三通道分流和复核队列减负
- `miniapp-first-run-user-flow`：小程序首跑状态推导、首页总控引导、统一 API 配置、跨页面链路串联和降级边界
- `visual-system`：工位模式默认、隐者模式可切换、暗黑忍者 RPG 像素 UI、第一版主视觉/排版/icon/插画基线、统一时间展示、长文本可读性和可复用组件
- `mvp-beta-readiness`：MVP 内测端到端闭环、配置样例、总 smoke、数据准备/复位、人工检查清单和敏感字段验收边界

## 已落地或已固化的能力约定

### `feature-registry`

- 功能入口必须使用稳定 `featureKey`，采用 snake_case。
- 功能入口状态包括 `enabled`、`locked`、`coming_soon`、`disabled` 和 `hidden`。
- 功能入口按 `placement` 获取，例如 `home_quick_entry`、`profile_feature_grid`、`community_entry`。
- 普通用户公开响应只返回可展示字段；不得返回内部备注、灰度控制、审核字段、未发布路由或 `hidden` 条目。
- 只有带公开路由的 `enabled` 入口可以导航；其他可见状态必须展示配置化提示并拦截导航。
- 第一版 API 使用 `GET /feature-registry/:placement` 读取公开入口配置，非法 `placement` 应返回客户端错误。
- 小程序端应通过统一客户端方法读取入口配置，并在远端不可用时回退到本地默认注册表。
- `salary_work_time_settings` 已开放入口应导航到工作档案设置页，而不是个人中心占位页。
- `supply_center` 已开放入口应导航到 `/pages/supply-center/index`；当 feature registry 将其配置为 `locked`、`coming_soon`、`disabled` 或 `hidden` 时，小程序必须按配置拦截或隐藏，不得绕过功能入口状态直达补给铺。
- `supply_center` 的普通用户可见文案只表达补给、食堂、续命、通勤等场景语义，不得暴露 CPS、聚推客、佣金、活动内部 ID、后台备注或订单源字段。
- `refine-miniapp-layout-and-entry-hierarchy` 后，个人中心不再展示无实际功能的功能宫格；常用入口应收敛为“我的角色”、“工作设置”、“我的帖子”、“收藏帖子”、“论坛消息”和“生存账本”等真实可用入口，未定义完整玩法的未来态入口不得以静态宫格冒充可用业务。

### `miniapp-first-run-user-flow` / 小程序首跑链路

- `stabilize-miniapp-first-run-user-flow` 已完成小程序首跑链路稳定：统一 API 配置、首跑状态推导、首页真实身份展示、登录/建档/工作档案串联、日报/社区/生存账本首跑空状态和开发种子边界。
- 小程序所有客户端服务必须通过 `apps/miniapp/src/services/api-config.ts` 读取统一 API base URL 和请求超时配置，不得在单个服务中维护独立 `DEFAULT_API_BASE_URL`。
- 小程序 API base URL 优先使用 `VITE_API_BASE_URL`；未配置时使用统一默认开发地址。微信真机调试需要局域网地址时，应通过环境变量显式配置，不要在某个服务里硬编码局域网 IP。
- 首跑状态只允许由真实登录态、用户成长资料状态和工作档案状态推导，状态包括 `logged_out`、`profile_missing`、`work_profile_missing` 和 `ready`。
- 小程序不得使用独立“已完成引导”标记覆盖真实未登录、未建档或未配置工作档案状态。
- 首页应消费 `apps/miniapp/src/services/first-run-flow.ts` 的首跑推导结果，并根据状态展示下一步行动：未登录引导登录，未建档引导创建隐者档案，未配置工作档案引导填写薪资时间，ready 状态展示真实已摸金额。
- 首页顶部身份区必须展示真实用户成长资料或合法本地快照；不得恢复静态“键影隐者 · 一阶”作为真实身份。
- 登录成功后应同步本人用户成长资料；创建隐者档案成功后应保存本地资料快照并明确引导配置工作档案；工作档案保存成功后应保存本地工作档案快照并引导或返回首页。
- 网络异常时，有合法本地用户资料或工作档案快照可以降级展示，并提示同步失败；没有合法快照时不得伪造已完成状态、演示身份、演示金额或假工作档案。
- 日报和社区可保留开发/演示种子策略用于本地验证，但生产公开侧不得默认注入伪造日报、伪造帖子或伪造用户互动。
- 生存账本首跑应区分真实 0 数据、空订单和 API 错误；不得为普通用户自动创建外卖、下午茶或通勤假订单，也不得恢复手动记账主流程。
- `refine-miniapp-layout-and-entry-hierarchy` 之后，“我的”页首屏不再展示空成就卡、空徽章列表或 `我的成就` 常用入口；后续恢复成就能力应先新建 change 定义成就来源、达成条件、展示规则和奖励。

### `comic-ip-content` / 漫画与世界观入口

- `fold-comic-ip-content-into-community` 已完成信息架构调整：小程序底部主导航从首页、社区、漫画、我的收敛为首页、社区、我的三个主 tab。
- `pages/comics/index` 不再作为主 tab 页面展示；如保留文件，只能作为非主导航兼容页、后续内容页或临时提示页。
- 漫画/IP/隐者大陆世界观内容第一版应放在社区页顶部 Banner 或社区内内容入口承载，不再占用独立主导航。
- `comic_ip_content` 稳定 feature key 可以保留，但默认不得作为个人中心功能宫格或独立公开漫画入口暴露空壳页面。
- 后续若要恢复独立漫画 tab、漫画列表、漫画详情、章节解锁、世界观百科或漫画后台运营，应先新建 OpenSpec change 重新定义业务范围。

### `user-growth-profile` / 用户成长资料

- `build-user-growth-profile-foundation` 已完成用户成长资料第一阶段能力：微信小程序登录第一版、应用登录态、首次创建隐者档案、职业到阵营分配、等级经验、隐币、能量、连续签到、称号和徽章占位。
- `enhance-profile-role-and-faction-assets` 已完成个人页隐者身份中心增强：真实成长资料展示、默认阵营头像、默认阵营徽章、阵营插画、昵称编辑、职业资料、推荐阵营和手动切换阵营已纳入当前事实来源。
- 小程序端登录流程使用微信登录 `code` 调用 `POST /auth/wechat-login`，服务端换取微信身份后创建或识别应用内用户，并返回应用自己的登录态。
- API 本人上下文应优先解析应用登录态；仅在明确开发环境或显式允许时使用 `temporary-dev-placeholder` fallback，且不得把 fallback 表达为真实微信登录能力。
- 微信登录配置通过环境变量提供，例如 `WECHAT_MINIAPP_APPID`、`WECHAT_MINIAPP_SECRET`、`WECHAT_LOGIN_MOCK_ENABLED`、`APP_AUTH_TOKEN_SECRET` 和 `APP_AUTH_TOKEN_TTL_SECONDS`；样例只能使用占位值，不得提交真实密钥。
- 每个应用内用户最多维护一份当前有效的用户成长资料，包含职业类型、阵营、显示名、头像 key、等级、经验、隐币、能量、连续签到、最后签到日期、称号 key 和已装备徽章 key。
- 首次创建隐者档案只要求用户选择最接近自己的职业/阵营分类；系统根据选择自动分配阵营、生成默认昵称、分配默认头像 key，并初始化成长资源。
- 首次创建隐者档案后，系统必须根据阵营同时分配默认头像 key 和默认徽章 key；资料快照必须提供当前头像 key、当前徽章 key、阵营插画 key 和推荐阵营信息。
- 小程序选择页第一版展示格式为：键影隐者（数字与技术）、运影隐者（运营与商业）、策影隐者（创意与内容）、行影隐者（现实与执行）。
- 职业类型到阵营的第一版映射为：`engineering` -> 键影隐者，`creative_operations` -> 运影隐者，`product_strategy` -> 策影隐者，`business_support` -> 行影隐者。
- 阵营稳定 key 保持为 `key_shadow`、`water_escape`、`sky_strategy` 和 `wanderer`，展示名分别为键影隐者、运影隐者、策影隐者和行影隐者。
- “一阶隐者、二阶隐者、三阶隐者”等阶级文案属于等级展示语义，初始用户应为一阶隐者，并随 `level` / 经验成长提升；页面不得把二阶、三阶作为新用户或静态默认值。
- 小程序“我的”页面应缓存合法 `moyuxia.userProfileSnapshot`，用于首屏展示和 API 不可用时的降级；远端同步成功后必须更新本地快照。
- 小程序“我的”页面必须使用真实用户成长资料或合法本地快照展示资料卡、等级经验、隐币、能量、连续签到、签到状态、称号、阵营头像、阵营徽章和阵营插画，不得使用无关演示数据替代个人状态。
- 每日签到第一版通过 `POST /me/daily-checkin` 完成，同一用户同一业务日期只能领取一次奖励；重复签到应返回已签到状态，不得重复发放经验、隐币或能量。
- 每日签到成功后，小程序必须使用 API 返回的最新用户成长资料刷新页面和本地缓存。
- 正式数据库配置下，签到记录和更新后的经验、隐币、能量、连续签到、最后签到日期必须持久化；未配置数据库时仅允许作为开发期内存 fallback，不得表达为正式持久化能力。
- mock 登录验证签到持久化时必须使用稳定 mock openid 或稳定应用用户身份，避免每次登录 code 变化导致测试用户漂移。
- 本人资料编辑已支持昵称、职业文本、职业类型和当前阵营；服务端必须校验昵称、职业文本、职业类型和阵营，非法输入不得保存。
- 会进入公开作者快照或公开资料展示的昵称等字段必须接入统一内容安全审核；内容安全未通过时不得保存为公开展示值，无法确认时必须进入明确处理边界或提示用户修改。
- 职业文本只作为本人资料和推荐阵营依据之一，不得公开到社区作者快照。
- 职业类型变化应返回推荐阵营和当前阵营是否一致的信息，但不得强制切换当前阵营。
- 用户可以在“我的角色”中手动切换当前阵营；后续社区发帖阵营权限应以更新后的当前阵营为准。
- 普通用户不得上传自定义头像；个人头像来自项目内置头像资产。后续头像替换只能从项目自制头像库选择已解锁头像，可使用隐币解锁，不接受用户上传头像文件。
- 个人页顶部昵称右侧应提供改名图标，点击后进入昵称修改流程并在保存成功后更新本地快照。
- 签到奖励、等级经验计算、默认资料生成和资料快照结构应复用 `packages/shared` 中的用户成长资料契约和函数。
- 称号、徽章和头像在第一阶段仅做基础展示：展示当前称号、当前阵营徽章和内置阵营头像；不表示称号商店、徽章商店、复杂成就系统、头像上传或资产后台已经开放。

### `work-value-tracker` / 工作档案

- 工作档案是首页已摸金额、工作状态、倒计时等工作价值计算的唯一用户输入来源。
- 第一版薪资模式为 `simple_monthly`，默认币种为 `CNY`；展示结果是娱乐化估算，不应表达为真实工资、税后收入或结算结果。
- 工作档案包含月薪、币种、薪资模式、上班开始/结束时间、一个或多个休息段、工作日规则、发薪日和隐藏模式。
- 工作日规则支持 `standard_weekdays` 和 `custom_weekdays`；法定节假日、调休、请假、大小周和复杂排班不由工作档案直接决定。
- 小程序端应基于已保存 `WorkProfileSnapshot` 在本地实时计算今日已摸金额和工作状态，服务端不负责每秒更新。
- 小程序首页应优先读取本地 `moyuxia.workProfileSnapshot` 快照作为首屏计算输入；随后通过统一工作档案客户端服务后台同步 `/me/work-profile`，成功后更新本地快照和首页状态。
- 首页在 API 不可用但本地存在合法快照时，应继续使用本地快照计算，不得回退到视觉演示金额。
- 首页工作价值计算应调用 `packages/shared` 中的 `calculateWorkValueState({ snapshot, now })`；页面层只负责快照读取、生命周期刷新、状态文案映射和展示格式化。
- 首页计时器只负责按当前时间重新计算工作价值状态，不应使用固定基准金额、演示每秒收益或假数据模拟增长。
- 首页应在页面显示时刷新快照并启动计算计时器，在页面隐藏或卸载时清理计时器。
- 工作状态至少区分未上班、工作中、休息中、已下班和休息日。
- 未配置工作档案时，首页应展示配置引导，不得把视觉演示数据当作真实已保存档案。
- 首页倒计时第一版只展示工作档案可直接推导的信息，例如距上班、距下班、距休息日和距发薪日；法定节假日、调休或运营活动倒计时在外部日历或运营配置接入前只能展示为非真实占位。
- `add-static-holiday-countdown` 已完成“距下一个法定节假日”倒计时：通过脚本从候选免费接口同步机器可读数据，保存为项目内可验证缓存，并在 `packages/shared` 提供查询函数供首页消费。
- 法定节假日数据不得由小程序首页运行时直接请求第三方免费接口；首页应消费项目内已同步并验证过的缓存数据，接口不可用时不影响首屏。
- 国务院办公厅正式通知等权威来源是中国大陆法定节假日最终核验依据；第三方免费接口只能作为同步来源或辅助来源，不得默认视为权威已核验。
- 未来年份权威安排未发布前，不得凭预测日期写入为已核验数据；应使用待发布、待同步或待核验状态，并由验证脚本明确提示。
- 法定节假日倒计时只是首页信息展示，不应改变 `calculateWorkValueState({ snapshot, now })` 的今日已摸金额、工作状态、每秒收益或工作进度计算。
- 薪资、工作时间、休息段、工作日、发薪日和隐藏模式均属于本人敏感工作档案字段，不得在社区、排行榜、公开资料、功能入口或其他公开接口默认暴露。
- 隐藏模式第一版主要遮挡首页显性敏感金额展示和每秒收益，并切换安全视觉状态；不要求遮挡所有可推断薪资的信息。

### `static-holiday-calendar` / 节假日缓存

- `static-holiday-calendar` 能力已落地，用于承载中国大陆法定节假日缓存数据、同步来源、权威核验元数据、查询函数和验证边界。
- 节假日缓存数据结构应优先放在 `packages/shared`，包含节假日名称、所属年份、开始日期、结束日期、数据状态、同步来源、同步时间、覆盖年份和权威核验元数据。
- 节假日同步脚本应放在 `scripts/`，作为显式命令运行；同步失败、接口结构异常或数据不完整时，不得覆盖现有可用缓存。
- 节假日验证脚本应检查日期格式、区间顺序、当前年和下一年数据状态、来源元数据、权威核验状态和过期风险。
- 根命令 `pnpm sync:holidays` 和 `pnpm verify:holidays` 已可用。
- 第一版不做调休上班日、请假、大小周、多班次轮班、复杂排班或个人实际休假计算。

### 工作档案设置落地

- 小程序端已规划/落地独立设置页 `pages/work-profile/settings`。
- 设置页应通过 `salary_work_time_settings` 功能入口进入。
- 设置页覆盖月薪金额、上班开始时间、上班结束时间、休息段、工作日规则、发薪日和隐藏模式。
- 小程序端应通过统一工作档案客户端服务读取和保存，不要在页面内直接散落 API 请求、响应校验和错误归一逻辑。
- 后端本人工作档案接口使用 `/me/work-profile` 语义：
  - `GET /me/work-profile`
  - `PUT /me/work-profile`
- API 响应契约复用 `packages/shared` 中的 `GetWorkProfileResponse` 和 `SaveWorkProfileResponse`。
- 保存成功后应返回与首页后续本地计算兼容的 `WorkProfileSnapshot`。
- 设置页保存或读取成功后，应把合法 `WorkProfileSnapshot` 写入本地缓存，供首页返回时立即消费。
- 工作档案 API 应通过统一本人上下文识别用户：优先使用应用登录态，开发环境可使用明确标记的 `temporary-dev-placeholder` fallback。
- 同一用户只保存一份当前有效工作档案；覆盖保存应更新原记录和更新时间。

### `accounting-ledger` / 记账

- `redefine-accounting-ledger-as-cps-survival-ledger` 已将第一版记账能力重新定义为 CPS 生存账单，不再按专业手动记账软件推进。
- `build-cps-supply-center-foundation` 已把补给铺点击归因、聚推客统一订单和生存账单自动入账串成第一版商业闭环。
- `deepen-cps-supply-commercial-loop` 已深化 CPS 生存账单商业闭环：来源订单使用 `sourceProvider + sourceOrderId` 幂等导入，重复同步只能更新同一账单，不得重复入账。
- 第一版账单事实源为已接入的 CPS 订单，由系统自动导入或同步，不再要求用户手动创建收入/支出账单。
- 第一版只支持三类稳定生存消耗：`隐者食堂`、`下午续命` 和 `通勤`。
- 外卖 CPS 订单默认归入 `隐者食堂`；商品标题、商品分类或商户标签命中咖啡、奶茶、茶饮、甜品、蛋糕、下午茶等语义时归入 `下午续命`。
- `通勤` 第一版仅统计滴滴打车 CPS 订单，不扩展公交、地铁、自驾或手动通勤补录。
- 小程序普通用户界面不得展示美团、饿了么、滴滴等 CPS 平台名称；平台来源字段仅允许服务端用于去重、状态同步、退款/取消处理和运营排查。
- 聚推客订单必须通过补给点击产生的 `sid` 匹配用户；无法匹配有效点击归因的订单不得写入任何用户的生存账单。
- 聚推客有效订单才可计入生存账单；未支付、退款、无效、风控、未知或无法确认状态的订单不得计入今日摘要、本周报告或历史有效消费。
- 聚推客订单分类应优先使用补给项配置的默认生存消耗分类，再使用品牌、活动、商品标题或来源标签兜底归类。
- 聚推客订单状态必须映射为稳定 CPS 订单状态；退款、取消、无效、风控或结算失败状态应通过同一来源订单更新账单为回滚或排除状态，`countsTowardConsumption` 必须为 `false`。
- CPS 订单状态变化必须保留状态历史，至少记录首次同步、状态升级、金额变化、退款/取消回滚、异常排除或重复同步等变化语义，供后台排查。
- 生存账单展示状态应区分有效、待确认、已回滚和已排除；普通用户统计只计算 `countsTowardConsumption = true` 的有效订单。
- 生存账单普通用户响应不得暴露聚推客 `apikey`、`sid`、`brand_id`、`act_id`、佣金、订单源 ID、原始同步响应或后台排查字段。
- 首页底部 tab 上方的横向辅助工具横幅应展示 `今日生存消耗`、三类金额和 `查看详情` 入口，不再作为 `记一笔` 手动记录入口。
- 生存账单详情页应展示本人订单详情和本周生存报告；本周报告可统计外卖次数、下午续命次数、通勤订单数或通勤距离、三类金额。
- 取消、退款或无效 CPS 订单不得继续计入今日摘要和本周生存报告。
- `击败了 X% 的键隐者` 等排行文案第一版不得表达为真实用户排行，只能作为预留字段或非真实占位。
- 旧手动收入/支出账单数据不得自动迁移或混入新的 CPS 生存账单统计；旧手动入口应下线、禁用、重定向或与新流程隔离。
- 生存账单明细、消费来源、分类统计和本周报告属于本人私有消费习惯数据，不应在社区、排行榜、公开资料或功能入口公开暴露。
- 专业记账能力，包括手动记账、收入记录、多分类账本、预算、资产账户、真实财务净额、报表导出、发票管理和多人共享，不属于第一版范围，除非后续 OpenSpec change 明确扩展。

### `supply-center` / 补给铺

- `build-cps-supply-center-foundation` 已完成补给铺基础能力，并作为当前补给铺、CPS 点击归因和聚推客订单同步事实来源。
- `deepen-cps-supply-commercial-loop` 已完成补给铺商业闭环深化，并作为当前补给推荐、转链降级、归因脱敏、异常池、指标和兼容策略事实来源。
- 补给铺第一版围绕上班生存场景组织为三个板块：`隐者食堂`、`下午续命` 和 `通勤补给`。
- 第一版补给活动白名单优先覆盖美团外卖、饿了么、瑞幸、库迪、奈雪、喜茶、滴滴/花小猪和高德打车；新增更泛化电商类目、非上班生存类活动或高风险活动前应先新建 OpenSpec change。
- 补给项必须支持活动分组、用户可见标签、展示优先级、推荐时段、工作日展示规则、归因窗口、转链有效期、重复点击窗口和备用跳转策略；缺省值应由共享契约统一补齐。
- 小程序公开页面为 `/pages/supply-center/index`；需要承接外部 H5 跳转时使用 `/pages/webview/index` 作为受控 WebView 回退页。
- 公开 API 第一版包括 `GET /supply-center` 和 `POST /supply-center/items/:itemId/click`，小程序端必须通过统一补给铺客户端服务访问。
- 后台 API 第一版包括 `/admin/supply-center/items`、`/admin/supply-center/items/batch-status`、`/admin/supply-center/items/:itemId/copy`、`/admin/supply-center/public-preview`、`/admin/supply-center/clicks`、`/admin/supply-center/order-syncs`、`/admin/supply-center/traces`、`/admin/supply-center/exceptions`、`/admin/supply-center/metrics` 和 `/admin/supply-center/jutuike-orders/sync`，均必须校验 `x-admin-token` 或等价后台令牌。
- 用户点击补给项时只能由服务端生成不可反推用户身份的随机或签名 `sid`；`sid` 不得包含明文用户 ID、微信 openid、微信 unionid、手机号、昵称或其他可识别个人身份的信息。
- 服务端保存和排查点击归因时应使用 `sidDigest` 和 `sidMasked`；普通用户响应、后台列表、后台追踪、实时事件和日志说明不得展示完整 `sid`。
- `JUTUIKE_API_KEY` 和 `JUTUIKE_TRANSFER_URL` 只允许作为服务端环境变量持有；小程序、管理后台前端、共享包和公开响应不得保存或返回聚推客密钥。
- 小程序不得直接请求聚推客接口；补给点击必须经后端记录归因、生成 `sid`、获取转链目标后再返回可跳转结果。
- 聚推客转链成功、失败、复用、备用可归因和备用不可归因都应记录转链尝试；备用通道可打开不等于订单必然可归因，用户侧必须用文案区分。
- 补给铺公开列表应只返回普通用户可见字段、今日场景面板、主推荐和分板块列表；不得暴露 CPS、聚推客、佣金、活动内部 ID、后台备注、`sidDigest` 或订单同步排查字段。
- 补给点击本身不创建生存账单金额；只有聚推客订单同步确认有效后，才允许创建或更新对应用户的生存账单记录。
- 管理后台可配置补给项标题、描述、板块、封面、行动文案、排序、状态、有效期、默认生存消耗分类、聚推客活动字段、活动分组、标签、推荐时段、展示规则、转链/归因窗口、备用跳转和内部备注。
- 管理后台可查看补给点击、脱敏 `sid`、转链尝试、订单同步状态、异常类型、失败原因、最近同步信息、公开预览、CPS 指标和追踪详情，用于排查归因与订单回流；不得在普通用户界面展示这些内部排查字段。
- CPS 异常池只能展示和重试可恢复异常；缺失归因、归因不存在或无法确认用户的订单不得提供“强行分配给用户”的后台入口。
- 数据兼容策略文档位于 `docs/cps-supply-commercial-loop-data-compatibility.md`；涉及既有补给项、点击、订单和账单兼容时必须同步该文档或说明无需更新。
- 普通用户侧补给铺只展示场景化补给内容、可点击行动、跳转失败提示和必要的空状态；不得展示佣金、返利、平台内部来源、聚推客字段或订单同步后台状态。

### `community-lite` / 论坛

- `define-community-lite-contract` 已完成轻社区第一阶段契约与实现验收，覆盖帖子、分区、评论、互动、举报、审核生命周期、公开身份展示和隐私边界。
- `define-daily-content-manual-ai-moderation` 已把论坛帖子和论坛评论接入统一 AI 内容审核分流：AI 明确安全可通过，明确违规可驳回，无法确认或服务不可用进入人工复核。
- `mature-community-lite-forum-experience` 已完成论坛成熟化体验实现、验收与归档，图片资产、持久通知、一层回复、我的论坛和后台社区处理已纳入当前事实来源。
- `add-low-cost-content-moderation` 已完成实现、验收与归档，评论和回复审核链路已接入本地低成本审核、风险分级、重复内容判断、频率限制和后台风险提示。
- `add-admin-community-content-governance` 已完成实现、验收与归档，帖子总览检索、作者禁言/封禁、治理审计和内容移除语义已纳入当前事实来源。
- `reduce-comment-manual-review-load` 已完成实现、验收与归档，评论/回复审核从“可快速通过”强化为 `auto_approve`、`auto_reject`、`manual_review` 三通道自动分流。
- `integrate-wechat-content-security-moderation` 已将社区帖子、评论、回复和社区图片接入统一内容安全链路；本地规则前置、微信内容安全二次审核、人工复核兜底和作者自见体验已纳入当前事实来源。
- `harden-community-identity-and-ip-attribution` 已完成实现、验收与归档，社区发帖、评论和回复前必须先完成隐私政策/社区用户协议同意和微信手机号验证；浏览、点赞、收藏不强制手机号验证；举报只要求登录和建档，不强制手机号验证。
- 社区手机号验证只作为发布门槛和后台合规状态，不作为公开身份资产展示；普通用户公开侧不得展示手机号、手机号尾号、手机号验证状态或“已验证”徽章。
- 社区发布 IP 和属地只能由服务端从可信请求来源计算并保存发布时快照，不得信任小程序前端传入的 IP、属地、header 或定位信息。
- 社区公开侧 IP 属地展示范围限定为境内省/自治区/直辖市、境外国家或地区、未知等降精度标签；不得显示完整 IP、市、区县、街道、来源 header 或解析原始结果，也不得提供用户关闭 IP 属地的开关。
- 帖子详情、评论、回复和后续公开个人页可展示弱化的 `IP属地`；社区帖子列表默认不展示 IP 属地，以保持列表密度。
- 后台社区治理可展示隐私同意版本、手机号验证布尔状态、IP 属地摘要和解析失败提示，但不得展示完整手机号、手机号尾号、明文 IP、微信 openid、微信 unionid、微信 sessionKey 或用户登录态。
- `add-community-follow-profile-system` 已完成实现、验收与归档，社区公开个人页、作者头像/昵称跳转、关注/取消关注、关注列表、粉丝列表和“我的”页关注/粉丝统计已按单向轻关注边界落地；后续调整前必须先读取 `openspec/specs/community-follow-profile-system/spec.md` 及相关主规格，并通过 OpenSpec 严格校验。
- `polish-community-profile-follow-experience` 已完成实现、验收与归档，并已纳入主规格：帖子详情、评论和回复作者入口应有克制可点击感；公开个人页应呈现隐者名片层级；关注成功轻反馈、取消关注需二次确认或等价意图表达；关注/粉丝列表需覆盖加载、空、失败、分页和没有更多状态；“我的”页三项数据需保持关注、粉丝和连续签到的稳定排版；公开响应和小程序展示继续过滤手机号、手机号尾号、手机号验证状态、完整 IP、微信身份、工作档案、隐币、能量、后台治理和内容安全内部字段。
- 关注/粉丝第一版已落地为单向轻关注关系，不做私信、拉黑、好友确认、关注流、动态流、推荐排序、排行榜、用户搜索、新增粉丝通知或后台关注关系运营面板。
- 公开个人页使用稳定不可预测的 `publicProfileId` 或等价公开标识跳转，不得使用微信 openid、unionid、手机号、昵称、登录态或可直接枚举的内部身份字段作为公开路由凭据。
- 公开个人页、关注列表和粉丝列表只展示最小公开身份、关注状态和必要统计；不得公开手机号、真实姓名、完整 IP、微信身份字段、登录态、薪资、工作时间、工作档案、隐藏模式、隐币、能量、生存账单、消费统计、CPS 来源、后台治理状态或内容安全内部风险信息。
- “我的”页顶部三项状态数据已调整为关注数、粉丝数和连续签到天数；关注数和粉丝数可点击进入对应列表，隐币和能量仅暂时从普通 UI 隐藏，不删除内部成长资料字段。
- `refine-community-list-experience` 已完成实现并归档；社区首页已收敛为高密度论坛列表，顶部保留消息入口和发布主操作，社区首页不再展示“我的帖子”入口。
- `add-daily-topic-quote-posting` 已完成实现并归档；日报 `今日参悟` 已升级为日报首页话题卡，可直接携带 `daily_reflection` 引用草稿进入社区发帖。
- 社区分区第一版包含推荐、键影、运影、策影、行影和魔王吐槽；稳定 key 分别为 `recommended`、`key_shadow`、`water_escape`、`sky_strategy`、`wanderer` 和 `boss_rant`。
- 未登录或未创建隐者档案的用户只能浏览推荐分区已审核帖子列表预览；进入详情、切换其他分区、发帖、评论、点赞、收藏或举报时，应跳转“我的”页引导登录并创建隐者档案。
- 阵营专区只限制发帖：键影、运影、策影、行影专区只允许对应阵营用户发帖；所有已登录且已创建隐者档案的用户都可以浏览、查看详情、评论、点赞、收藏和举报。
- 推荐和魔王吐槽不限制发帖阵营。
- 公开内容状态仍必须遵循 `pending`、`approved`、`rejected` 和 `hidden` 生命周期；`rejected` 和 `hidden` 不得进入公开列表、公开详情或公开评论区。
- 第一阶段 API 覆盖帖子列表、帖子详情、发帖、评论、点赞、取消点赞、收藏、取消收藏和举报；服务端必须校验登录态、隐者档案、阵营发帖权限、内容状态和互动对象状态。
- 帖子必须人工审核确认后公开；AI 仅用于风险判断、标签和后台分流辅助。
- 内容安全接入后，帖子文本和图片可以在本地规则与微信内容安全均确认通过后自动公开；无法确认、图片回调未完成、微信复核或供应商失败时必须保持 `pending` 或进入人工复核。
- 评论和回复由 AI 审核自动处理：AI 通过可公开，AI 驳回不可公开，AI 不确定或供应商失败时进入人工复核。
- 评论和回复当前以前置本地低成本审核和评论自动化分流为主：可信低风险短评论/短回复应自动公开，明显违规应自动驳回，灰区、冷启动用户、近期风险用户、治理受限用户、重复内容或频率异常进入人工复核。
- 评论和回复的灰区内容应优先进入微信文本内容安全；微信仍无法确认、缺少有效微信 `openid`、近两小时访问条件不满足、供应商错误或超时时进入人工复核。
- 评论和回复提交响应应返回客户端可识别的审核后状态和可选审核决策；`pending` 且未被明确驳回的评论/回复允许提交者本人在详情中看到，并标记为仅自己可见，其他用户不可见。
- 社区帖子、评论和回复的作者自见不是公开展示；公开列表和其他用户详情仍只能读取 `approved` 内容，小程序必须用“审核中/仅自己可见/通过后公开”之类文案区分。
- 后台社区能力已支持帖子审核、评论/回复复核、举报处理、内容隐藏、审核备注和后台令牌权限校验。
- 小程序端应通过统一社区客户端服务访问 API，处理身份门槛错误、降级提示和跳转引导，不要在页面中散落 API URL、状态枚举或兜底演示数据。
- 公开作者身份使用发帖或评论时的快照，字段仅限昵称、头像 key、阵营、等级、称号和可选徽章 key。
- 社区公开响应不得暴露工作档案、薪资、上班时间、隐藏模式、生存账单、消费统计、CPS 平台来源、微信 openid、微信 unionid 或登录态。
- 社区页面不得把本地演示帖子、演示点赞或演示收藏作为真实社区状态。
- 论坛实现应沿用视觉系统中的社区页布局：顶部标题、内容或活动 Banner、分区 tabs、筛选 chips、发布入口、帖子卡列表和底部 tab。
- 社区首页顶部 Banner 第一版是漫画/IP/隐者大陆世界观的正式内容入口，不再只是“封印中/敬请期待”的占位说明。
- 社区首页高频操作只保留发布和消息；“我的帖子”、收藏帖子和论坛消息等个人论坛内容从“我的”页进入。
- 社区帖子列表卡片应保持固定信息密度：标题、摘要、作者信息和统计区限制占用高度；图片最多展示第一张正方形缩略图，多图只显示轻量数量提示，卡片高度不得随原图比例变化。
- 社区列表和详情应使用公开作者快照中的头像信息渲染内置头像资产，无法识别时按阵营默认头像回退；不得在头像框里直接展示 `avatarKey` 字符串。
- 带 `daily_reflection` 的社区帖子应展示“引用今日参悟”来源信息；引用快照包含日报 ID、业务日期、参悟正文和引用提示，且仍按社区帖子审核生命周期公开或隐藏。

### `community-lite` 成熟化能力

- 社区图片资产已用于发帖图片上传、归属校验、帖子绑定和公开展示；旧 `imageKeys` 只作为历史兼容字段。
- 社区媒体资产保存资产 ID、所有者、用途、URL、缩略图 URL、内容安全审核状态、脱敏任务标识摘要和关联帖子。
- 社区图片资产已接入微信图片内容安全异步审核；带图帖子在所有图片通过前不得对其他用户公开，任一图片违规应阻止公开，回调超时、下载失败或无法确认时进入人工复核。
- 微信图片回调必须幂等处理，迟到回调不得把已经被人工驳回、隐藏、移除或治理处理的帖子重新公开。
- 帖子详情已支持评论和一层回复；第一版不做无限楼中楼。
- 社区通知已持久化，覆盖点赞、收藏、评论、回复、帖子审核结果、评论/回复审核结果，并支持未读、单条已读和全部已读。
- “我的论坛”已覆盖我的帖子、我的评论/回复和我的收藏。
- 后台社区接口复用后台令牌校验，`admin/community` 读取、审核、举报处理和隐藏接口必须校验 `x-admin-token` 或等价后台令牌。
- 论坛成熟化阶段明确不做复杂推荐算法、搜索引擎、排行榜、赛季体系、实时聊天、私信、在线状态、自动封禁或完整用户治理后台；关注关系仅能按已归档 `add-community-follow-profile-system` 主规格或后续明确 change 的轻关注边界推进。
- 社区内容状态已包含移除语义：帖子、评论和回复可被后台移除并从公开列表、公开详情、我的收藏、公开引用入口和公开评论区过滤；移除不是物理删除，必须保留原文、作者快照、上下文、举报记录和治理审计。
- 社区用户治理状态包含 `normal`、`limited`、`muted` 和 `banned`；`muted` 与 `banned` 用户不得发帖、评论、回复或上传社区图片，`limited` 用户不得走低风险快速公开路径。
- 用户治理限制必须支持期限、原因、后台备注、解除限制和过期恢复；过期限制不得继续阻止社区写操作。
- 第一版社区封禁以 `userId` 为主键，不依赖明文 IP；如记录来源风险，只允许保存脱敏 IP、IP 哈希或风险摘要，公开响应和后台响应不得暴露明文 IP。

### `daily-content-feed` / 隐者日报

- `rework-daily-content-feed-article-experience` 已完成日报文章化体验实现、验收与归档。
- `define-daily-content-manual-ai-moderation` 已完成日报人工采编、AI 辅助和统一 AI 内容审核分流，并已归档。
- `enhance-daily-content-feed-operations-experience` 已完成日报运营体验增强并归档，补齐日报后台运营编辑、来源完整性、发布前预览、评论持久化、数据库保存边界和小程序公开体验优化。
- `separate-admin-daily-content-sections` 已完成后台日报板块级运营拆分并归档，`今日参悟`、`尘世情报` 和 `离谱卷宗` 曾被拆为独立工作区。
- `extract-world-intel-as-standalone-content` 已完成大陆新闻独立化并归档；`大陆新闻` / `world_intel` 不再作为隐者日报后台板块维护，而是独立内容库。
- `build-admin-operations-center` 已将日报发布流程调整为轻量发布：草稿通过发布前校验后可立即发布或设置定时发布，不再强制经过提交审核和审核通过步骤。
- 旧的 `define-daily-content-feed-contract` 已被日报文章化体验覆盖，不应再作为最终日报产品方向的事实来源。
- 隐者日报第一版结构为：`今日参悟` 每日一句或短段落、`离谱卷宗` 日报文章栏目，以及指向独立大陆新闻内容库的入口。
- 日报第一版采用后台人工采编：运营手动创建、编辑和维护每日参悟、离谱卷宗文章、来源标题、来源站点、来源链接和配图链接；大陆新闻由独立内容库后台维护。
- 首页和日报首页只展示摘要与入口，不应把两大栏目所有文章正文直接铺在首屏。
- `今日参悟` 支持引用到社区发帖；发帖仍走 `community-lite` 审核流程，正式默认不得绕过人工审核。
- `大陆新闻` 和 `离谱卷宗` 可以作为日报首页入口卡展示，包含名称、简介、插画/像素资产占位和进入按钮；大陆新闻入口必须进入独立内容库列表，不再读取日报 `world_intel` 板块文章。
- 离谱卷宗等仍属于日报文章栏目的内容遵循日报栏目展示和校验边界；大陆新闻不受日报栏目最多 10 篇的业务上限约束。
- 日报文章详情页支持点赞、评论和转发；转发语义为“引用到茶馆”并创建社区帖子草稿或待审核帖子。
- 日报文章评论第一版复用社区审核与公开身份边界，不得额外暴露薪资、工作档案、生存账单、CPS 来源或微信身份标识。
- 日报文章评论已接入统一内容安全链路；提交者本人可以看到待审核评论并标记为仅自己可见，其他用户只能看到已公开评论。
- `daily_content_feed` 功能入口仍指向隐者日报首页；日报内部栏目列表和文章详情不应单独创建 feature key。
- 管理后台应支持编辑每日参悟、日报栏目简介、插画 key、每篇日报文章内容、文章来源、AI 生成元数据、AI 风险提示和审核状态。
- 后台日报编辑应支持今日参悟和离谱卷宗的栏目文章新增、删除、排序、字段保存和状态反馈；不得再在日报运营页直接编辑大陆新闻。
- 后台日报运营主工作单元已经从整期 issue 拆到单个板块记录；单板块保存、校验、预览和发布不得要求其他板块同时完成，也不得覆盖其他板块草稿。
- 后台板块级保存应使用或等价实现 `PUT /admin/daily-content/issues/:issueId/sections/:sectionKey`，请求体只更新目标板块内容。
- 单板块发布流程应先保存当前板块，再执行当前板块发布检查，并通过 `publish-sections` 或等价接口只发布目标 `sectionKey`。
- 日报板块级保存和发布接口必须拒绝 `world_intel`，并提示使用大陆新闻独立管理接口；不得因此修改任何日报草稿。
- 发布检查应按当前板块展示阻断项和提示项；整期级日期、总标题、首页摘要、定时发布、整期发布和归档能力可以保留，但不得作为单板块发文的必经路径。
- 小程序公开侧日报结构保持兼容，仍通过同一日报入口展示今日参悟、离谱卷宗栏目入口和文章详情；大陆新闻入口应跳转到独立大陆新闻历史列表。
- 后台编辑期应展示来源 URL、来源标题、来源站点、配图 URL、公开来源说明、正文长度和栏目文章数量等完整性提示；编辑期提示不必阻断草稿保存。
- 发布或提交审核前应执行来源完整性校验；时事和趣闻文章缺少可追溯来源时不得公开发布。
- 日报文章来源类型分为原创和外部采编；原创文章不要求外部来源标题、站点或 URL，外部采编文章发布、定时发布和到点自动发布前必须补齐来源标题、来源站点和来源 URL。
- 日报定时发布必须保存计划发布时间；修改定时时间、取消定时和到点自动发布都应保持清晰状态。到点自动发布必须重新执行发布前校验，校验失败时不得公开，并应在后台保留待处理状态。
- 后台发布前预览应复用公开响应过滤逻辑，展示与小程序公开侧一致的日报摘要、栏目列表和文章详情预览，同时不得绕过审核和发布状态。
- 数据库模式下保存日报时必须同步持久化 issue、section 和 item，确保后台保存后公开侧读取到最新内容。
- 日报文章评论已作为独立持久化模型处理，包含文章 ID、用户 ID、作者公开快照、正文、状态、AI 审核痕迹、人工复核信息和时间字段；公开文章详情只返回 `approved` 评论。
- 小程序日报页面应处理无内容、无配图、来源缺失、栏目空状态、评论待审核、评论被驳回和引用发帖不可用等状态，不得使用本地演示文章填充真实日报状态。
- DeepSeek 或其他 AI 只能基于后台当前编辑内容辅助改写、润色、摘要生成、风险提示和格式化，不得自行编造事实、来源、链接或配图。
- 官方日报公开发布仍必须经过后台显式发布动作；AI 辅助不等于自动公开发布官方内容。

### `world-intel-content` / 大陆新闻独立内容库

- `extract-world-intel-as-standalone-content` 已新增 `world-intel-content` 能力，定义大陆新闻独立文章库、后台管理、公开分页列表、文章详情、发布生命周期、编辑边界和历史数据兼容要求。
- 大陆新闻应使用独立模型或等价独立内容库承载，不再依赖 `DailyContentIssue -> world_intel -> items` 作为公开文章事实来源。
- 公开侧大陆新闻应提供独立列表和详情能力，例如 `GET /world-intel/articles` 和 `GET /world-intel/articles/:articleId` 或等价接口；列表必须分页，并由服务端限制最大 `pageSize`。
- 大陆新闻文章应支持持续累积和历史回看；发布新文章不得覆盖旧文章，已发布文章可以由后台编辑并让公开侧读取最新版本。
- 后台大陆新闻应作为独立管理页面和菜单入口，支持新建单篇、批量新增、编辑草稿或已发布文章、发布草稿、下线或隐藏已发布文章、搜索和状态筛选。
- 大陆新闻后台不设置“每栏目最多 10 篇”这类日报业务上限，但必须保留请求体大小、字段长度、分页大小和超时等工程保护。
- 外部采编类大陆新闻必须保留可追溯来源；原创内容不强制要求外部来源。公开响应不得暴露后台备注、内部审核细节、供应商响应、后台令牌或其它敏感字段。
- 历史 `world_intel` 日报栏目内容必须迁移到独立大陆新闻文章库或提供兼容读取策略，避免已发布大陆新闻文章丢失；生产稳定后应以独立文章库为事实来源。
- 大陆新闻文章可以保留点赞、评论和引用到社区能力边界；引用快照应保存发帖时的标题和摘要，复杂版本历史不属于第一版范围。
- 大陆新闻文章评论已接入统一内容安全链路；提交者本人可以看到待审核评论并标记为仅自己可见，其他用户只能看到已公开评论。

### `ai-content-moderation` / AI 内容审核

- `define-daily-content-manual-ai-moderation` 已新增统一 AI 内容审核能力，覆盖日报文章评论、论坛帖子和论坛评论。
- `add-low-cost-content-moderation` 已在统一审核能力前增加本地低成本硬规则层；AI 或第三方供应商结果属于增强分流能力，不是前期唯一审核来源。
- `integrate-wechat-content-security-moderation` 已把原 AI 审核链路扩展为供应商无关内容安全链路；`AiContentModerationService` 可以保留兼容名称和旧 trace 字段，但当前审核事实应优先看 `contentSecuritySummary`。
- AI 审核结果包括 `approved`、`rejected` 和 `needs_manual_review` 三类，并记录审核来源、风险标签、置信度、审核原因和人工复核原因。
- AI 明确判定安全且置信度达到阈值时，系统可以将用户生成内容设为 `approved`，并记录审核来源为 `ai`。
- AI 明确判定违规、涉政、涉黄、违法、辱骂、人身攻击、隐私泄露、广告引流或其他禁止内容时，系统应将内容设为 `rejected`，并记录归一化风险标签和用户可理解的拒绝原因。
- AI 低置信度、无法判断、灰区风险、超时、供应商错误或响应格式异常时，系统应将内容设为 `pending` 并进入人工复核。
- 普通用户公开响应不得暴露 AI 原始 prompt、供应商原始响应、内部风险细节、密钥、代理配置或后台审核备注。
- 后台可以展示归一化风险标签、AI 简短原因、审核来源和待人工复核原因，但不得展示供应商密钥或完整原始 prompt。
- `REVIEW_BYPASS_FOR_TESTING` 或同等测试免审核路径已移除；测试应使用 mock AI 审核结果或人工审核降级，不得绕过审核生命周期直接公开用户生成内容。

### `wechat-content-security-moderation` / 微信内容安全

- `integrate-wechat-content-security-moderation` 新增微信内容安全能力，微信作为第一版真实内容安全供应商，本地开发和内测可使用明确标记的 mock。
- 全局 UGC 审核链路为：本地关键词/规则初筛 -> 微信内容安全二次审核 -> 人工复核兜底；本地高危可直接驳回，可信低风险短评论可快速通过，灰区、帖子、图片、新用户风险、治理限制、供应商失败或微信无法确认必须进入微信审核或人工复核。
- 文本内容安全使用服务端调用微信 `msgSecCheck`；覆盖社区帖子、社区评论、社区回复、日报评论、大陆新闻评论和公开资料字段，例如昵称。
- 图片内容安全使用服务端调用微信 `mediaCheckAsync`；图片必须具备可被微信检测服务器下载的 URL，回调通过前不得对其他用户公开带图帖子。
- 微信内容安全结果必须归一化为 `approved`、`rejected` 或 `needs_manual_review`，并映射稳定风险标签、人工复核原因、建议文案和脱敏 `traceIdDigest`。
- 微信 `pass` 可进入公开条件，`risky` 应驳回或阻止公开，`review`、接口失败、超时、无有效 `openid`、近两小时访问条件不满足、回调异常或响应格式异常应进入人工复核。
- 正式环境缺少微信内容安全配置时，不得假装已完成真实微信审核；只能使用明确 mock、保留本地规则结果或进入人工复核。
- 微信内容安全配置通过环境变量控制，例如 `WECHAT_CONTENT_SECURITY_ENABLED`、`WECHAT_CONTENT_SECURITY_MOCK_ENABLED`、`WECHAT_CONTENT_SECURITY_MOCK_TEXT_RESULT`、`WECHAT_CONTENT_SECURITY_MOCK_IMAGE_RESULT`、`WECHAT_CONTENT_SECURITY_FORCE_PROVIDER_ERROR`、`WECHAT_CONTENT_SECURITY_TIMEOUT_MS`、`WECHAT_CONTENT_SECURITY_IMAGE_CALLBACK_TOKEN` 和 `WECHAT_CONTENT_SECURITY_IMAGE_CALLBACK_MAX_DELAY_SECONDS`。
- 微信内容安全密钥、`access_token`、完整 `openid`、完整 `unionid`、`sessionKey`、完整 `trace_id`、供应商完整原始响应和回调 token 不得进入小程序公开响应、后台普通字段、实时事件、验证脚本输出或项目文档示例。
- 微信图片回调 API 第一版为 `/community/content-security/wechat/media-callback` 或等价最小回调路径；回调必须校验 token 或来源、按 `trace_id` 幂等匹配图片任务，并对迟到回调做状态保护。

### `admin-operations` / 后台运营中心

- `build-admin-operations-center` 已完成后台运营中心能力，并作为当前后台运营事实来源。
- `add-admin-community-content-governance` 已在后台运营中心新增社区内容治理入口，并与统一审核队列区分。
- `reduce-comment-manual-review-load` 已扩展后台运营中心，使工作台和统一审核队列区分评论/回复自动通过、自动驳回和人工复核统计。
- `build-cps-supply-center-foundation` 已在后台补充补给铺配置、点击归因和聚推客订单同步排查能力。
- `improve-admin-realtime-review-and-operations-ux` 已完成后台实时待办和运营交互优化：新增后台专用 SSE 事件流、低频降级轮询、新待办提示、队列行级处理态、状态已变化反馈和跨模块加载/错误/空状态一致化。
- `deepen-cps-supply-commercial-loop` 已扩展后台补给铺运营：补给项筛选、批量上下架、复制、普通用户预览、CPS 异常池、指标面板和追踪排查已纳入后台运营事实来源。
- `integrate-wechat-content-security-moderation` 已扩展后台运营中心，使工作台、统一审核队列和审核详情展示本地规则、微信文本、微信图片、mock、降级和人工复核的归一化内容安全摘要。
- 后台运营中心第一版提供工作台、统一审核队列、审核详情、实时待办提示、日报发布待办、补给铺配置排查和后台令牌校验，不引入完整后台账号系统、角色权限、WebSocket、多管理员协同锁或用户侧推送体系。
- API 入口包括 `GET /admin/operations/workbench`、`GET /admin/operations/todo-summary`、`GET /admin/operations/events`、`GET /admin/operations/review-queue` 和 `GET /admin/operations/review-queue/:itemId`，均必须校验 `x-admin-token` 或等价后台令牌。
- `GET /admin/operations/events` 使用 `text/event-stream` 返回后台待办事件；后台前端必须使用 `fetch` 流式读取以携带 `x-admin-token`，不得把长期后台令牌放入 SSE query 参数。
- 后台实时事件只用于提示“有新待办”或工作台计数变化，payload 只能包含事件 ID、事件类型、来源、目标类型、目标 ID、创建时间、待办数量和队列变化摘要等最小字段；工作台、队列、详情和补给铺排查事实源仍必须来自普通后台 API。
- 实时事件或降级轮询发现变化时，后台只展示顶部新待办提示和连接状态；在用户点击刷新前不得强制替换当前审核队列、详情面板、日报正文、社区治理处理上下文或补给项表单。
- 实时连接失败、断开或超时时，后台应进入 `degraded_polling` 或等价降级状态，并低频读取 `todo-summary`；实时连接恢复后应停止降级轮询。
- 统一审核队列前端处理态包括 `idle`、`processing`、`succeeded`、`failed` 和 `stale`；队列项处理中不得重复提交，成功后应局部移出或更新当前行，状态已变化或目标不存在时应标记为需要刷新。
- 工作台聚合待审核帖子、待复核评论/回复、待处理举报、日报评论待复核和待发布日报计数，并提供评论/回复自动处理统计和最近待办入口。
- 统一审核队列聚合社区帖子、社区评论、社区回复、社区举报和日报评论，支持来源、对象类型、状态、审核决策、用户风险原因、AI 风险标签、低成本审核风险标签、内容安全来源、内容安全风险标签、人工复核原因和图片审核状态筛选。
- 社区评论/回复队列应主要承载审核决策为 `manual_review` 的人工必处理内容；`auto_approve` 和 `auto_reject` 评论/回复不应作为待人工复核队列项返回，但可在社区内容治理详情中查看自动处理摘要。
- 审核队列和详情可展示作者公开快照、正文摘要或原文、AI 兼容摘要、低成本审核摘要、内容安全归一化摘要、图片审核状态、审核决策、用户风险原因、人工复核原因、当前状态、可用操作和关联对象信息。
- 后台统一操作入口覆盖通过、驳回、隐藏、举报处理和查看详情；第一版写操作可继续复用现有领域接口。
- 后台运营中心响应和实时事件不得暴露薪资、工作档案、上班时间、隐藏模式、生存账单明细、无关消费统计、微信完整 openid、微信完整 unionid、微信 `sessionKey`、微信内容安全 `access_token`、完整 `trace_id`、用户登录态、AI 原始 prompt、供应商完整原始响应、供应商密钥、聚推客 `apikey`、完整订单同步原始响应、服务端环境变量或代理配置；补给铺排查如需展示 CPS 来源、`sid` 或同步字段，必须限于后台授权视图并做脱敏。
- 后台工作台、审核队列、日报运营、大陆新闻、社区治理和补给铺排查应统一加载态、错误态、空状态、无结果状态、刷新入口和操作反馈；筛选、选中项和返回上下文应尽量保留。
- 后台补给铺运营必须把公开预览、点击排查、订单同步排查、异常池和指标面板作为授权后台视图处理；这些视图可以展示脱敏 `sid`、活动 ID、订单状态和失败解释，但不得展示完整 `sid`、密钥、原始同步响应或普通用户不需要的商业字段。
- 社区媒体资产已补充基础风险控制：上传 MIME 类型限制、单图大小限制、单用户单日上传频率限制和孤儿资产清理能力。
- 后续社区内容治理响应还必须过滤微信 `sessionKey`、明文 IP、后台令牌、用户登录态和社区治理无关的敏感字段；如展示来源风险，只能展示脱敏值、哈希摘要或风险标签。

### `low-cost-content-moderation` / 低成本内容审核

- `add-low-cost-content-moderation` 已完成实现、验收与归档，并已作为当前审核事实来源。
- `reduce-comment-manual-review-load` 已将可信用户快速通道强化为评论/回复审核分流的核心要求。
- 低成本审核使用项目内敏感词库缓存、文本归一化、风险分级、风险标签、命中词、命中字段、处理建议和内容指纹。
- 敏感词库同步命令为 `pnpm sync:sensitive-lexicon`，来源为 `https://github.com/konsheng/Sensitive-lexicon`；同步结果固化为项目内可验证缓存，运行时不得依赖实时访问外部 GitHub 仓库。
- 同步失败、仓库不可访问或结构异常时不得覆盖已有可用缓存。
- 低成本审核验证命令为 `pnpm verify:low-cost-content-moderation`。
- 评论和回复采用本地硬规则优先并输出归一化审核决策：低风险可信短内容可以 `auto_approve`，明确违规应 `auto_reject`，灰区或用户风险内容应进入微信内容安全或 `manual_review`。
- 重复内容、频率限制、冷启动用户、近期违规、有效举报、后台隐藏、`limited` 治理状态等会取消快速通过资格；异常用户不得仅因文本未命中风险词就直接公开。
- 帖子不得仅因本地低风险自动公开；内容安全接入后，帖子文本和图片均通过微信或等价内容安全确认后才可自动公开，否则进入人工复核。
- 图片审核第一版不接付费第三方供应商；发帖图片接入微信图片内容安全异步审核，评论图片继续不开放。
- 后台审核队列和详情可展示低成本审核风险等级、风险标签、命中词、命中字段、审核来源、审核决策、用户风险原因和处理建议，并支持按低成本审核风险标签、风险等级、审核决策和用户风险原因筛选。

### `admin-community-content-governance` / 后台社区内容治理

- `add-admin-community-content-governance` 已完成实现、验收与归档，并作为当前后台社区治理事实来源。
- 后台社区帖子总览展示所有状态帖子，默认按创建时间倒序排列，并支持分页、状态筛选、分区筛选和基础风险筛选。
- 后台社区内容搜索支持按帖子标题、正文、帖子 ID、作者用户 ID 和作者公开昵称定位内容。
- 后台帖子治理详情展示帖子全文、作者公开快照、作者用户 ID、分区、状态、审核摘要、低成本审核摘要、举报摘要、评论和一层回复上下文。
- 后台治理操作支持隐藏和移除帖子、评论、回复；移除属于软删除语义，公开侧不可见，但保留原文、上下文、举报记录和治理审计记录，不做物理删除。
- 社区用户治理状态包含 `normal`、`limited`、`muted` 和 `banned`；第一版以 `userId` 作为封禁主键，不依赖明文 IP。
- 被 `muted` 或 `banned` 的用户应被拦截发帖、评论、回复和社区图片上传；`limited` 用户应取消低风险快速公开路径并采用更严格审核。
- 治理限制支持期限、原因、后台备注、解除限制和过期恢复。
- 社区治理操作审计记录内容治理和用户治理操作的对象、旧状态、新状态、原因、备注、操作人和创建时间。
- 社区治理应与统一审核队列共享实时待办提示、筛选保留、操作反馈和状态变化处理语义；从新待办进入社区治理时，列表和详情仍必须通过后台治理接口读取事实源。
- 社区治理列表和详情只展示当前状态允许执行的操作；隐藏、移除、限制、禁言、封禁或解除限制后应展示明确反馈，并局部刷新列表或详情。
- 第一版不引入完整后台账号系统、RBAC、复杂搜索引擎、批量治理、自动封禁、真实 IP 明文存储或跨平台设备指纹系统。

### `comment-review-automation` / 评论审核自动化

- `reduce-comment-manual-review-load` 已完成实现、验收与归档，并作为当前评论/回复审核减负事实来源。
- `integrate-wechat-content-security-moderation` 已扩展评论/回复自动化，灰区内容优先进入微信文本内容安全，微信无法确认时进入人工复核。
- 评论和回复审核决策统一为 `auto_approve`、`auto_reject` 和 `manual_review`。
- 可信用户提交低风险短评论或短回复，且文本未命中明确违规、灰区风险、重复提交或频率异常时，应自动公开为 `approved`。
- 明确违规评论或回复应自动驳回为 `rejected` 或拒绝公开。
- 灰区、上下文不明、冷启动用户、近期风险用户、频率异常、重复内容、治理受限用户应进入微信内容安全或人工复核；审核服务不可确认时应进入 `manual_review` 并保持 `pending`。
- 进入人工复核但未明确驳回的评论/回复，提交者本人可在帖子详情中看到，并应标记为仅作者自己可见；其他用户不可见。
- 系统应记录审核决策摘要，包括决策、简短原因、风险标签、命中字段、用户风险原因、快速通过门槛和处理建议。
- 系统还应记录内容安全摘要，包括本地规则、微信文本、微信图片、mock、人工兜底来源、归一化风险标签、人工复核原因和脱敏 trace 摘要。
- 普通公开响应不得暴露审核决策细节、命中词、用户风险原因或后台处理建议。
- 该能力不允许仅凭低风险可信用户或本地规则安全自动公开帖子；帖子自动公开必须满足当前内容安全规格定义的文本与图片通过条件。

### `mvp-beta-readiness` / MVP 内测就绪

- `stabilize-mvp-end-to-end-beta-readiness` 已完成实现并进入验收，作为当前 MVP 内测端到端稳定化事实来源。
- MVP 内测就绪是横向闭环能力，只定义首跑、内容、CPS、后台、配置、数据状态和验收链路的稳定化标准，不新增玩法、补给品类、商业模式或普通用户公开字段。
- 根命令 `pnpm verify:mvp-beta-config` 用于检查 `.env.example`、应用级环境变量样例、`.gitignore` 保护、占位值和真实密钥误提交风险。
- 根命令 `pnpm verify:mvp-beta-readiness` 是默认确定性总 smoke，会复用关键纵向 `verify:*` 命令，并补充首跑、内容、CPS、后台、配置、数据状态和敏感字段边界的横向断言。
- 默认总 smoke 不依赖真实微信、真实聚推客、真实 DeepSeek、真实生产数据库或真实外部网络；真实微信登录、真实补给转链、真实订单回流和真实 AI 审核属于人工内测检查清单。
- 内测说明文档位于 `docs/mvp-beta-readiness.md`，人工检查清单位于 `docs/mvp-beta-manual-checklist.md`；清单应按普通用户、后台运营人员和开发配置人员拆分路径，并标注是否依赖真实外部服务、微信内容安全 mock 或真实微信回调。
- 内测默认可以使用微信内容安全 mock；真实联调必须配置微信小程序凭据、内容安全开关、图片回调域名和回调 token，且不得记录真实 `openid`、`access_token` 或完整 `trace_id`。
- 内测数据应使用稳定测试标识并具备复位或隔离策略，不得为普通用户伪造消费订单、伪造真实互动或伪造生产内容来源。
- smoke、配置检查、文档和普通用户响应不得输出后台 token、微信身份、聚推客 `apikey`、完整 `sid`、完整订单同步原始响应、AI 原始 prompt 或其它敏感字段。

### `visual-system` / 小程序全局营地 UI

- `unify-miniapp-global-camp-ui` 已完成小程序用户端全局 UI 统一，并作为当前小程序视觉、展示层格式化、长文本可读性和小屏验收事实来源。
- `refine-miniapp-pixel-card-frame-and-icon-system` 已完成小程序重点像素框、普通卡片轻立体层级和像素 icon 体系归档，并作为当前卡片分级、tabBar icon 和语义 icon registry 事实来源。
- `add-miniapp-workplace-mode-default` 已完成实现、验收与归档，并已将小程序用户端默认视觉切换为浅色“工位模式”，暗黑像素忍者 RPG 视觉保留为首页右上角主动进入的“隐者模式”。
- 当前小程序用户侧统一视觉语言为“工位模式默认 + 隐者模式可切换 + 隐者营地信息流”；社区页营地 UI 的信息结构仍是后续页面统一的视觉基准。
- 当前第一版视觉基线已确认：首页、社区、我的、补给铺、隐者日报、大陆新闻、生存账本、工作档案、首跑/空状态/错误态的主视觉排版、三档卡片层级、重点像素框白名单、原生 tabBar 像素 icon、语义 icon registry 和插画 asset key 暂定。
- 后续视觉优化默认只允许局部替换图片、补齐缺失 icon、优化图片裁切/遮罩/安全区、改善小屏可读性、轻量增强普通卡片质感和控制包体；不得在未新建 OpenSpec change 的情况下重开整体主视觉、主导航、卡片层级、已确认 asset key 或页面业务结构。
- 当前小程序卡片视觉分为三档：重点像素框、轻立体卡和扁平容器；重点像素框必须显式 opt-in，不能挂到 `vs-panel`、`camp-card`、`camp-feed-card` 等基础类默认语义上。
- 重点像素框只适合首页已摸金额主卡、社区世界观 Banner、我的页身份主卡、我的角色阵营身份主卡、补给铺主推荐、日报今日话题/今日参悟主卡和生存账本顶部核心统计卡等高仪式感位置。
- 评论、回复、订单行、表单分组、筛选 tab、badge、输入框、文章正文阅读区和普通信息流列表不得使用重点像素框，应使用轻立体卡或扁平容器保持扫读效率。
- 首页、社区和我的三个底部主 tab 使用微信原生 tabBar，并通过 `pages.json` 配置项目内未选中/选中像素 icon；`pages.json` 默认色彩为工位模式，运行时按本地 `moyuxia.visualMode` 切换导航栏和原生 tabBar 色彩，不得引入自定义 tabBar、额外主 tab 或新的 tab 状态同步逻辑。
- 菜单、状态、补给、账本、日报、工作设置等语义 icon 应收敛到稳定 asset key、resolver 或 registry，减少页面内临时 CSS icon 各自发挥。
- 全局营地 UI 只改变视觉展示、布局密度、字体层级、颜色、边框、间距、遮罩、动效、图片展示容器和纯展示格式化，不得改变核心业务能力、接口契约、路由语义、数据模型、权限判断、内容安全审核、订单同步、账本统计、首跑状态推导或工作价值计算。
- 全局视觉 token、页面背景、像素卡片、按钮、标签、tab、输入框、状态面板和信息流卡片基底优先沉淀在 `apps/miniapp/src/styles/visual-system.css`，页面局部样式不得自造割裂的网页风、临时占位风或独立视觉系统。
- 全局背景默认使用浅色工位背景、浅色卡片、深色文字和细描边；隐者模式使用干净深色背景和克制氛围光。满屏高对比网格、强扫描线或干扰阅读的纹理不得作为默认整页背景，像素纹理、扫描线和发光只能局部用于 Banner、卡片或激活状态。
- 视觉模式只保存在本地 `moyuxia.visualMode`，取值为 `workplace` 或 `hermit`；没有本地值时默认 `workplace`。模式切换只改变视觉、导航栏和 tabBar 外观，不改变用户身份、工作档案、隐藏模式、金额计算、社区、补给或账本业务逻辑。
- 所有普通用户端已注册页面根节点应挂载 `vs-mode-workplace` 或 `vs-mode-hermit`；`pages/stealth-workbench/*` 是办公表格视觉例外，固定使用工位/办公表格视觉，不跟随隐者模式变成暗黑 RPG。
- 首页、社区、帖子详情、我的、补给铺、隐者日报、大陆新闻、生存账本、工作档案、WebView 和兼容页应用视觉优化时，必须保留原有业务板块、主要操作、底部三 tab、真实状态和错误/空状态，不得通过视觉优化删除、合并、隐藏、新增或替换既有用户可访问能力。
- 首页必须保留身份区、今日已摸金额、距下班倒计时、工作状态、工作进度、工作设置入口、隐者日报入口、补给铺入口、倒计时卡组、今日生存消耗和底部三 tab；不得展示假金额、假工作档案或假 ready 状态。
- 社区必须保留世界观 Banner、分区 tab、最新/热门筛选、消息入口、发布或登录建档入口、帖子列表、图片附件、日报引用、赞评藏统计和底部三 tab；帖子详情必须保留作者、标题、正文、日报引用、图片、点赞、收藏、评论、回复、举报和底部评论输入。
- 我的页必须保留真实角色身份、阵营、等级资源、签到、我的角色、工作设置、我的帖子、收藏帖子、论坛消息和生存账本入口；不得恢复空成就卡、空徽章列表、未定义功能宫格或无实际功能入口。
- 补给铺、隐者日报、大陆新闻、生存账本和工作档案必须保留既有分类、列表、详情、状态、表单、主要操作和错误/空状态；不得因视觉统一改变用户可访问能力或业务状态边界。
- 项目内已有真实插画、头像、徽章、Banner 和封面资产必须保留；视觉优化只能调整展示容器、遮罩、圆角、裁切、安全区和局部样式，不得替换成外链图片、生成图、无关占位图或开发态 placeholder。
- 用户侧时间展示必须复用或对齐 `packages/shared/src/display-time.ts` 中的 `formatDisplayTime(value, { now?, invalidFallback? })`：同日显示 `HH:mm`，1 至 3 个自然日前显示 `1天前` / `2天前` / `3天前`，同年超过 3 天显示 `M月D日 HH:mm`，跨年显示 `YYYY年M月D日 HH:mm`，普通小程序界面不得直接展示 raw ISO datetime。
- 用户生成内容、服务端内容、评论、回复、文章标题、订单标签、系统提示和错误信息必须在小屏设备上可读；长连续数字、英文、URL 或无空格混排文本应在容器内自动换行或按页面规则截断，不得横向滚动、穿出卡片或遮挡相邻内容。
- 长文本防溢出样式只应用于用户输入和服务端长文本；按钮、tab、状态短标签、阵营 badge、作者昵称等短 UI 文案应保持稳定单行、省略或固定布局，不得被全局 `break-all` 切碎到难以阅读。
- 普通用户侧页面必须隐藏供应商、CPS、订单同步、点击归因和后台排查相关内部字段；补给铺和生存账本不得展示 CPS、聚推客、佣金、订单源 ID、`apikey`、`sid`、`brand_id`、`act_id`、后台备注、供应商原始错误、原始同步响应或未脱敏归因字段。
- 小程序用户端 UI 更新必须在 320px、375px 和 414px 等常见小屏宽度下检查文字、按钮、图片、底部导航、底部输入栏和主要卡片不重叠、不遮挡、不横向溢出。

## 产品边界

第一版应优先聚焦：

- 首页已摸金额和倒计时体验
- 薪资和上班时间配置
- 隐藏模式
- CPS 生存账单能力，包括自动导入、三类生存消耗、今日摘要、订单详情、本周生存报告和首页入口
- 补给铺能力，包括三类上班生存补给、精选活动展示、点击归因、聚推客转链、有效订单同步入账和后台配置排查
- 用户资料和阵营选择
- 每日签到和基础成长
- 隐者日报文章化体验
- 论坛/轻社区基础能力，包括发帖、评论、点赞、收藏、举报和审核流程
- 未解锁或未来功能的预留入口
- 后台内容管理、统一运营工作台、统一审核队列和基础审核能力
- 个人页隐者身份中心，包括真实成长资源、每日签到、本人状态摘要、我的角色资料编辑、阵营资产展示和论坛相关入口
- 小程序主导航第一版固定为首页、社区、我的三个 tab；漫画/IP 不再作为独立主 tab。

第一版明确不做：

- 税前/税后切换、个税、社保、公积金、奖金、十三薪或真实工资结算。
- 调休、请假、大小周、多班次轮班或复杂排班。
- 专业手动记账、收入记录、多分类账本、预算、资产账户、真实财务净额、报表导出、发票管理和多人共享。
- 完整商城、购物车、SKU 库存、站内支付、收货地址、通用电商分类、用户手动订单补录、佣金展示或返利承诺。
- 用户自定义上传头像。

除非后续 OpenSpec change 明确确认，否则不要把以下内容视为第一版必须实现：

- 完整赛季排行
- 复杂小游戏
- 完整漫画生产工作流
- 称号商店
- 皮肤商店
- 头像上传、本地相册头像选择、微信头像授权作为个人头像来源
- 头像库、徽章商店、复杂成就系统或称号购买完整解锁流程
- 高级社交关系；轻量关注/粉丝关系只能按已归档 `add-community-follow-profile-system` 主规格的公开个人页和单向关注边界推进
- 实时聊天
- 私信
- 在线状态
- 无人工审核的 AI 自动发布
- 无人工复核兜底的生产级自动内容审核
- AI 凭空编写日报内容并伪造来源
- 弱智吧、微博热搜、固定博主或任意第三方来源自动爬虫
- 社区复杂推荐算法、搜索引擎、排行榜、赛季体系、实时聊天、私信、在线状态、关注流、动态流和好友关系
- 付费内容安全供应商强依赖
- 自动封禁、批量治理、复杂搜索引擎、明文 IP 封禁或跨平台设备指纹系统

## 实现原则

- 以 OpenSpec 作为计划行为的事实来源。
- 变更应限制在当前用户指定 change 或任务范围内，除非用户明确扩大范围。
- 不得仅凭 `openspec list` 中 `no-tasks`、空任务数、陌生名称或历史对话印象删除、重建、覆盖或归档 change；遇到来源不明的活跃 change，应先读取内容并向用户确认其归属和处理意图。
- 其他对话、其他 agent 或用户直接创建的 OpenSpec change 视为用户工作成果；除非用户明确点名要求处理该目录，否则只能读取、验收或提出建议，不得擅自删除。
- 每次修改代码、脚本、样式、JSON、Markdown 或 OpenSpec 文档后，提交验收前必须先运行 `pnpm format` 或等价 Prettier 格式化命令，再运行 `pnpm format:check` 确认格式通过。
- 不要只依赖 lint、typecheck 或业务验证脚本判断 change 完成；Prettier 格式检查失败视为验收阻断。
- 通过配置和稳定 feature key 保留未来扩展点。
- 未开放功能优先通过 feature registry 表达，不要在具体页面里散落硬编码。
- 跨端共享的 feature key、状态枚举、工作档案类型、校验、响应契约和计算函数应优先放在或复用 `packages/shared`。
- 页面优先消费统一服务层或共享契约，不要在页面内复制 API URL、状态枚举、校验规则或兜底数据。
- 小程序全局 UI、营地视觉、时间展示、长文本可读性、真实资产容器或包体策略调整不得夹带业务链路重构；相关需求应优先对齐 `docs/miniapp-global-ui-design-prd.md` 和 `openspec/specs/visual-system/spec.md`。
- 小程序第一版主视觉、排版、icon 和插画已暂定；后续若要改变整体视觉方向、底部主导航、重点像素框白名单、语义 icon registry 或现有 asset key，应先新建 OpenSpec change 明确理由、影响页面和验收边界。
- 小程序页面和服务不得复制 API base URL 默认值；新增小程序请求能力时必须复用 `getMiniappApiBaseUrl()` 和 `MINIAPP_API_TIMEOUT_MS`，并更新 `pnpm verify:miniapp-api-config` 覆盖范围。
- 涉及首页、登录、个人中心或工作档案的改动必须维护首跑状态推导，不能绕过 `first-run-flow` 另建一套未登录/未建档/未配置判断。
- 首页已摸金额应基于已保存设置在前端本地实时计算，不依赖服务端每秒更新。
- 首页真实工作价值展示不得恢复固定演示金额、静态节假日日期或硬编码收益自增逻辑；未接入的数据应使用配置引导、待配置或待接入占位。
- 新增或更新法定节假日缓存数据前，必须通过同步脚本或权威来源核验流程确认来源；不要凭记忆或预测填写节假日日期。
- 小程序首页不得直接依赖第三方免费节假日接口实时返回；第三方接口应由同步脚本消费，首页只读取项目内缓存和共享查询函数。
- 本人接口、新增资料接口和签到接口应优先消费统一认证/本人上下文服务，不要在控制器或页面内自行解析用户 ID。
- CPS 生存账单、补给铺、论坛、日报、AI/内容安全审核、微信内容安全、低成本内容审核、后台运营中心和后台社区内容治理都属于独立业务域，应先通过 OpenSpec 拆分 change 明确契约、数据模型、接口、页面流程和验证脚本，再进入实现。
- 补给铺、CPS 点击归因和生存账单用户侧必须隐藏服务商内部字段、佣金、源订单 ID、原始响应、密钥、后台备注和可反推用户身份的归因信息。
- 日报内容第一版应由后台人工采编并维护可追踪来源；AI 只能处理运营输入，不得联网找来源、伪造来源或补齐链接。
- 社区内容公开展示前必须经过审核生命周期。
- AI 生成内容必须先作为后台草稿，由管理员审核后发布。
- 薪资和上班时间属于敏感信息，不应公开暴露。
- 环境变量样例不得包含真实数据库密码、微信密钥或其他敏感值。
- 真实 `.env`、`.env.local`、后台 token、微信密钥、微信内容安全回调 token、微信 `access_token`、聚推客密钥和 AI 密钥只能留在本地或部署平台，并必须被 `.gitignore` 保护；验证脚本和文档不得打印真实值。
- MVP 内测总 smoke 应保持默认确定性；真实外部服务联调放入人工检查清单或显式本地检查，不作为默认 smoke 的通过前提。
- 本地开发、服务启动和临时检查产生的日志文件应统一写入根目录 `logs/`，不要在项目根目录直接生成 `*.log`、`*.out.log` 或 `*.err.log` 文件。
- 上线前提醒：当前日报后台图片和社区媒体资产仍以开发期本地/轻量链路为主；当产品进入生产部署、开放论坛用户图片上传、评论图片上传或图片访问量增长阶段时，必须重新评估并迁移到对象存储/CDN，保留或增强服务端 MIME/大小校验、前端或服务端压缩、缩略图、用户配额、上传限流、孤儿资产清理和内容安全审核，避免 API 本机磁盘、内存、带宽或小程序前端加载被图片撑爆。

## 验收原则

- change 实现完成后，必须至少运行 `openspec validate <change-name> --strict`、`pnpm format:check`、`pnpm lint`、`pnpm typecheck` 和受影响应用的构建命令。
- 如果改动涉及小程序客户端服务、请求配置、环境变量读取、真机调试 API 地址或 `apps/miniapp/src/services/api-config.ts`，还必须运行 `pnpm verify:miniapp-api-config`、`pnpm lint`、`pnpm typecheck` 和 `pnpm build:miniapp`。
- 如果改动涉及小程序首跑链路、首页总控引导、未登录/未建档/未配置工作档案状态、登录后建档串联、建档后配置工作档案串联、工作档案保存后返回首页或本地快照降级，还必须运行 `pnpm verify:miniapp-api-config`、`pnpm verify:miniapp-user-growth-profile`、`pnpm verify:miniapp-work-profile`、`pnpm verify:miniapp-daily-content-feed`、`pnpm verify:miniapp-community-lite`、`pnpm verify:miniapp-accounting-ledger`、`pnpm lint`、`pnpm typecheck` 和 `pnpm build:miniapp`。
- 如果改动涉及小程序首页、工作档案或节假日倒计时，还必须运行 `pnpm verify:work-profile`、`pnpm verify:miniapp-work-profile`、`pnpm verify:holidays` 和 `pnpm build:miniapp`。
- 如果改动涉及微信登录、个人中心、用户成长资料、我的角色、昵称编辑、职业文本、职业类型、阵营推荐、手动切换阵营、默认阵营头像/徽章/插画、等级经验或签到，还必须运行 `pnpm verify:user-growth-profile`、`pnpm verify:user-growth-profile-api`、`pnpm verify:miniapp-user-growth-profile`、`pnpm build:api` 和 `pnpm build:miniapp`。
- 如果改动涉及 CPS 生存账单、账单分类、订单导入、首页生存消耗摘要、账单详情页或本周生存报告，还必须运行 `pnpm verify:accounting-ledger`、`pnpm verify:accounting-ledger-api`、`pnpm verify:miniapp-accounting-ledger`、`pnpm build:api` 和 `pnpm build:miniapp`。
- 如果改动涉及补给铺、CPS 点击归因、聚推客转链、转链降级、聚推客订单同步、来源订单幂等、退款/取消回滚、CPS 异常池、CPS 指标、补给项后台配置、补给点击排查、订单同步排查、`supply_center` 功能入口或补给订单入账，还必须运行 `pnpm verify:supply-center`、`pnpm verify:supply-center-api`、`pnpm verify:miniapp-supply-center`、`pnpm verify:admin-supply-center`、`pnpm verify:accounting-ledger`、`pnpm verify:accounting-ledger-api`、`pnpm verify:miniapp-accounting-ledger`、`pnpm verify:feature-registry`、`pnpm verify:admin-operations`、`pnpm lint`、`pnpm typecheck`、`pnpm build:api`、`pnpm build:admin` 和 `pnpm build:miniapp`。
- 如果改动涉及论坛/轻社区、帖子、评论、分区、点赞、收藏、举报、审核状态、社区公开身份或社区页面，还必须运行 `pnpm verify:community-lite`、`pnpm verify:community-lite-api`、`pnpm verify:miniapp-community-lite`、`pnpm build:api` 和 `pnpm build:miniapp`。
- 如果改动涉及社区发布身份门槛、隐私政策/社区用户协议同意、微信手机号验证、手机号验证 mock、可信客户端 IP 提取、IP 属地解析、IP 属地公开展示、公开个人页最近 IP 属地、后台身份/IP 合规摘要或明文 IP/手机号过滤，还必须运行 `pnpm verify:community-lite`、`pnpm verify:community-lite-api`、`pnpm verify:miniapp-community-lite`、`pnpm verify:admin-community-governance`、`pnpm verify:admin-operations`、`pnpm verify:mvp-beta-config`、`pnpm verify:mvp-beta-readiness`、`pnpm lint`、`pnpm typecheck`、`pnpm build:api`、`pnpm build:admin` 和 `pnpm build:miniapp`。
- 如果改动涉及公开个人页、`publicProfileId`、作者头像/昵称跳转、关注/取消关注、关注列表、粉丝列表、关注/粉丝统计、“我的”页关注/粉丝入口、隐藏隐币/能量普通 UI 展示或公开用户列表敏感字段过滤，还必须运行 `pnpm verify:community-lite`、`pnpm verify:community-lite-api`、`pnpm verify:community-follow-profile-system`、`pnpm verify:miniapp-community-lite`、`pnpm verify:user-growth-profile`、`pnpm verify:user-growth-profile-api`、`pnpm verify:miniapp-user-growth-profile`、`pnpm verify:mvp-beta-readiness`、`pnpm lint`、`pnpm typecheck`、`pnpm build:api` 和 `pnpm build:miniapp`。
- 如果改动涉及隐者日报、每日参悟、日报文章、栏目列表、文章详情、日报评论、日报引用发帖、日报后台审核、后台编辑器、板块级保存、板块级校验、板块级预览、板块级发布、发布前预览、来源完整性、定时发布或日报评论持久化，还必须运行 `pnpm verify:daily-content-feed`、`pnpm verify:daily-content-feed-api`、`pnpm verify:miniapp-daily-content-feed`、`pnpm verify:admin-daily-content-feed`、`pnpm verify:community-lite`、`pnpm build:api`、`pnpm build:admin` 和 `pnpm build:miniapp`。
- 如果改动涉及大陆新闻、`world-intel-content`、`world_intel` 迁移、独立大陆新闻公开列表/详情、后台大陆新闻管理、批量新增、编辑已发布文章、发布/下线大陆新闻或日报入口跳转大陆新闻列表，还必须运行 `pnpm verify:daily-content-feed-api`、`pnpm verify:admin-daily-content-feed`、`pnpm verify:miniapp-daily-content-feed`、`pnpm lint`、`pnpm typecheck`、`pnpm build:api`、`pnpm build:admin` 和 `pnpm build:miniapp`。
- 如果改动涉及小程序主导航、`pages.json`、底部 tab、社区页 Banner、漫画/IP 入口、`comic_ip_content` 功能入口或 `/pages/comics/index` 路由可见性，还必须运行 `pnpm verify:miniapp-feature-registry`、`pnpm verify:miniapp-community-lite`、`pnpm lint`、`pnpm typecheck` 和 `pnpm build:miniapp`。
- 如果改动涉及 AI 内容审核、AI 自动通过、AI 自动驳回、人工复核、审核来源、风险标签、置信度、测试免审核移除或供应商失败降级，还必须运行 `pnpm verify:ai-content-moderation`、`pnpm verify:daily-content-feed-api`、`pnpm verify:community-lite-api`、`pnpm build:api`、`pnpm build:admin` 和受影响小程序验证。
- 如果改动涉及微信内容安全、`msgSecCheck`、`mediaCheckAsync`、微信内容安全 mock、供应商错误降级、图片异步回调、作者自见、公开资料字段内容安全、`contentSecuritySummary`、`visibleToAuthorOnly`、`traceIdDigest`、微信内容安全配置或内容安全敏感字段过滤，还必须运行 `pnpm verify:ai-content-moderation`、`pnpm verify:community-lite`、`pnpm verify:community-lite-api`、`pnpm verify:miniapp-community-lite`、`pnpm verify:daily-content-feed-api`、`pnpm verify:miniapp-daily-content-feed`、`pnpm verify:user-growth-profile-api`、`pnpm verify:admin-operations`、`pnpm verify:admin-community-governance`、`pnpm verify:mvp-beta-config`、`pnpm verify:mvp-beta-readiness`、`pnpm lint`、`pnpm typecheck`、`pnpm build:api`、`pnpm build:admin` 和 `pnpm build:miniapp`。
- 如果改动涉及低成本内容审核、本地敏感词库、词库同步缓存、文本归一化、敏感词匹配、可信用户快速通道、重复内容去重、提交限流、近期违规用户收紧、评论/回复低成本审核分流或后台低成本风险提示，还必须运行 `pnpm verify:low-cost-content-moderation`、`pnpm verify:comment-review-automation`、`pnpm verify:ai-content-moderation`、`pnpm verify:community-lite`、`pnpm verify:community-lite-api`、`pnpm verify:miniapp-community-lite`、`pnpm verify:admin-operations`、`pnpm build:api`、`pnpm build:admin` 和 `pnpm build:miniapp`。如更新词库缓存，还必须运行 `pnpm sync:sensitive-lexicon` 或说明未同步原因。
- 如果改动涉及社区图片资产、社区通知、一层回复、我的论坛、后台社区审核、举报处理或后台社区权限，还必须更新并运行社区 shared/API/miniapp/admin 相关验证，至少包含 `pnpm verify:community-lite`、`pnpm verify:community-lite-api`、`pnpm verify:miniapp-community-lite`、`pnpm verify:admin-community-lite`、`pnpm build:api`、`pnpm build:admin` 和 `pnpm build:miniapp`。
- 如果改动涉及后台运营中心、工作台、统一审核队列、审核详情、实时待办事件、SSE、降级轮询、新待办提示、队列局部处理反馈、日报发布待办、后台令牌、后台敏感字段过滤或社区媒体资产风险控制，还必须运行 `pnpm verify:admin-operations`、相关领域验证脚本、`pnpm build:api` 和 `pnpm build:admin`。
- 如果改动涉及后台社区内容治理、帖子总览、关键词搜索、帖子治理详情、评论/回复移除、作者限制/禁言/封禁、解除限制、治理操作审计、实时待办一致性、筛选保留、明文 IP 边界或社区写操作拦截，还必须运行 `pnpm verify:admin-community-governance`、`pnpm verify:community-lite`、`pnpm verify:community-lite-api`、`pnpm verify:admin-community-lite`、`pnpm verify:admin-operations`、`pnpm build:api` 和 `pnpm build:admin`。
- 如果改动涉及评论/回复自动分流、`auto_approve`、`auto_reject`、`manual_review`、可信用户快速公开、冷启动保护、用户风险原因、作者自己可见的待审评论/回复或人工复核队列减负，还必须运行 `pnpm verify:comment-review-automation`、`pnpm verify:low-cost-content-moderation`、`pnpm verify:community-lite-api`、`pnpm verify:miniapp-community-lite`、`pnpm verify:admin-operations`、`pnpm build:api`、`pnpm build:admin` 和 `pnpm build:miniapp`。
- 如果改动涉及 MVP 内测就绪、端到端 smoke、环境变量样例、内测运行说明、人工检查清单、数据准备/复位、空状态/真实 0 数据/降级状态或跨链路敏感字段边界，还必须运行 `pnpm verify:mvp-beta-config`、`pnpm verify:mvp-beta-readiness`、`pnpm lint`、`pnpm typecheck`、`pnpm build:api`、`pnpm build:admin` 和 `pnpm build:miniapp`。
- 如果改动涉及小程序 UI 质感、插画资产、状态视觉、全局营地 UI、首页/社区/我的/补给铺/生存账本/日报/大陆新闻/工作档案视觉、统一时间展示、长文本防溢出、真实图片容器、语义 icon、视觉 fallback、`display-time`、`visual-system.css`、`illustration-registry`、`docs/miniapp-global-ui-design-prd.md`、`docs/miniapp-visual-illustration-system.md` 或 `packages/ui-tokens`，还必须运行 `pnpm verify:miniapp-work-profile`、`pnpm verify:miniapp-community-lite`、`pnpm verify:miniapp-supply-center`、`pnpm verify:miniapp-accounting-ledger`、`pnpm verify:miniapp-user-growth-profile`、`pnpm verify:miniapp-daily-content-feed`、`pnpm verify:miniapp-package-size`、`pnpm lint`、`pnpm typecheck` 和 `pnpm build:miniapp`。
- 如果 `pnpm format:check` 失败，应先运行 `pnpm format` 修复格式，再重新运行完整验收命令；不要把格式问题留到用户要求验收时才发现。
- 在沙箱环境中 `pnpm typecheck` 或 `pnpm build:miniapp` 可能因 `spawn EPERM` 失败；这类情况应在沙箱外重跑确认，不应直接视为真实类型或构建失败。

## UI 原则

- 页面应由可复用组件构成，不要依赖整屏静态图片。
- `enhance-miniapp-visual-polish-and-illustration-system` 已完成小程序视觉质感与插画系统归档；插画规格、页面映射、生成提示词、fallback 和禁用元素以 `docs/miniapp-visual-illustration-system.md` 为当前事实来源。
- `unify-miniapp-global-camp-ui` 已完成小程序全局营地 UI 归档；全局视觉、页面统一、时间展示、长文本可读性、小屏验收和包体边界以 `docs/miniapp-global-ui-design-prd.md` 和当前 `visual-system` 主规格为当前事实来源。
- `refine-miniapp-pixel-card-frame-and-icon-system` 已完成重点像素框和像素 icon 体系归档；重点像素框白名单、禁用位置、三档卡片层级和原生 tabBar icon 规则以 `docs/miniapp-global-ui-design-prd.md`、`docs/miniapp-visual-illustration-system.md` 和当前 `visual-system` 主规格为事实来源。
- 第一版主视觉、页面排版、重点像素框应用位置、原生 tabBar icon、语义 icon registry 和当前插画资产映射已经暂定；未通过新 OpenSpec change 重新定义前，不要把视觉优化扩大为更换整体风格、重做主导航、重排核心页面或重命名 asset key。
- 像素图应作为角色、场景、图标、徽章、Banner 和漫画等资产使用。
- 动态文本、计数器、按钮、列表、卡片和状态变化应保持为原生 UI。
- 页面应优先使用 `packages/ui-tokens` 导出的基础 token 和语义 token，避免在局部样式中重复硬编码同类状态色值。
- 暗黑忍者 RPG 视觉应同时保持工具信息可读，使用暗色像素 Material 营地基底、深色夜幕背景、RPG 面板、清晰描边、像素资产和金/紫/蓝/青/橙等状态强调色。
- 全局页面背景应保持干净深色和克制氛围光；不要用满屏高对比网格、强扫描线或高噪音纹理干扰阅读，扫描线和发光只作为局部质感。
- 首页布局应包含顶部身份区域、已摸金额主卡、上班状态场景、主金额旁隐藏模式即时开关、核心功能入口、必要倒计时、今日生存消耗大卡和底部 tab。
- 社区页布局应包含顶部标题、内容或活动 Banner、分区 tabs、筛选 chips、发布入口、帖子卡列表和底部 tab。
- 社区页顶部 Banner 第一版同时承担隐者大陆世界观、漫画/IP 预告或后续内容入口职责，不应再只是低价值说明卡。
- 小程序底部主导航第一版只保留首页、社区和我的三个入口；漫画/IP 内容不作为独立主 tab 展示。
- 个人中心页布局应包含资料卡、等级经验、资源统计、每日签到、本人状态摘要、精简菜单区域、我的角色详情入口、阵营插画卡和底部 tab；未定义完整玩法前不得展示空成就卡、空徽章列表或完整成就系统占位。
- 个人中心顶部身份卡应展示当前阵营头像、昵称、改名 icon、阵营、称号、等级经验条和当前阵营徽章，并在小屏设备上保持可读且不重叠。
- 个人中心头像区域不得展示上传角标、上传按钮、本地图片选择入口或上传态视觉暗示。
- 个人中心阵营插画位应使用统一尺寸和比例约束，优先适配 `5:7` 竖图资源；插画文件未接入时展示风格化 fallback 或对应阵营 key 的稳定预留位，不要展示开发态占位文本。
- 个人中心菜单应移除“称号收藏”、“我的评论”、“隐者大陆百科”、“设置”、“我的成就”等暂未实现或未定义完整玩法入口；保留“我的角色”、“工作设置”、“我的帖子”、“收藏帖子”、“论坛消息”和“生存账本”等高价值入口，论坛消息应能展示未读数。
- 首页底部 tab 上方的今日生存消耗大卡应展示 `隐者食堂`、`下午续命`、`通勤` 三类金额和 `查看详情` 入口，不再表达为手动 `记一笔`、签到、任务或商城入口。
- 补给铺页面应保持工具型高密度体验，优先展示三类补给板块、可点击补给卡片、跳转状态和轻量空状态，不做营销落地页式长篇介绍。
- 首页、社区、个人中心、补给铺、日报、大陆新闻、生存账本、工作设置、登录/建档、空状态和错误态应统一为深色夜幕背景、暗色 RPG 面板、正式字体层级、语义 icon、插画预留位和克制强调色。
- 全局 UI 优化必须保留页面已有业务板块、路由、feature key、API 调用、状态推导、缓存 key 和真实图片资产，不得用视觉优化名义删除入口、替换真实资产或注入假数据。
- 重点像素框不得全局套用到基础卡片、列表项、评论、回复、订单行、表单、tab、badge 或输入框；普通卡片应通过轻立体质感与重点框适配，而不是争夺主视觉。
- 底部主导航保持首页、社区和我的三个微信原生 tabBar 项，使用项目内像素 icon 资产，不引入自定义 tabBar 或新增主 tab。
- 用户可见时间不得直接展示 raw ISO datetime；社区、评论、回复、消息、内容列表、订单和用户可见记录应使用统一展示格式。
- 普通用户侧补给铺和生存账本不得展示 CPS、聚推客、佣金、订单源 ID、`apikey`、`sid`、`brand_id`、`act_id`、后台备注、供应商原始错误、原始同步响应或未脱敏归因字段。
- 正式像素字体只用于品牌标题、金额数字、等级、倒计时、badge、入口标题和短标签；长正文、帖子内容、表单说明和错误提示应优先保证中文可读性并使用系统字体 fallback。
- 插画资产应使用稳定 asset key、比例、安全区和风格化 fallback；不得把 `px-* 200×200`、`placeholder`、`badge_placeholder`、TODO 文案或无语义圆点 icon 当作正式 UI 内容。
- 首页、补给铺、社区、我的页、生存账本、首跑引导、空状态和错误状态应优先复用 `apps/miniapp/src/visual-system/illustration-registry.ts` 中的稳定 asset key；正式图片缺失时使用同风格 fallback，不要在页面里临时写死图片路径或开发态占位。
- 插画中不得包含金额、倒计时、等级、经验、订单金额、tabs、筛选项、状态标签、按钮文案、二维码、真实品牌标识、CPS 平台标识、佣金、活动内部 ID 或任何会随业务变化的文字。
- 移动端小屏幕上必须保持文字可读。
- 用户输入和服务端长文本应防止长数字、英文、URL 或无空格混排导致横向溢出；按钮、tab、badge 等短 UI 文案不得被全局断词样式破坏。
- 高密度 RPG 面板必须保证可读字号、行高、触控尺寸和安全间距，避免文本与相邻内容重叠。
- 未解锁和敬请期待的功能可以保留可见入口，但必须明确禁用状态或展示解锁要求。

## 暂不提前固化的未知项

以下内容除非后续文档明确确认，否则不要提前写死：

- 手机号授权、微信头像昵称授权、真实头像上传、账号注销、session 刷新、多设备管理和完整用户资料体系
- 聚推客之外是否增加其他 CPS 服务商，以及各服务商在生产环境的覆盖范围、结算规则和测试订单策略
- 微信小程序跳转第三方小程序、H5 WebView 业务域名和聚推客生产活动覆盖仍需按正式配置验证
- 最终生产美术资产的精修批次、更多状态插图、更多补给/社区/账本局部图标和多机型渲染细节仍可后续补齐；但第一版主视觉方向、排版层级、tabBar icon、语义 icon registry、现有头像/徽章/阵营插画 asset key 和页面映射已暂定，替换图片必须保持 key、比例、安全区和业务语义稳定。
- 正式像素字体文件完整入库和微信小程序多机型渲染兼容性；包体成本已新增 `pnpm verify:miniapp-package-size` 校验，后续涉及视觉资产、字体或小程序构建产物时必须持续检查
- 后台功能入口编辑、发布、审核、灰度配置和数据库持久化

当这些决策变得必要时，应先在 OpenSpec 中记录，再进行大范围实现。
