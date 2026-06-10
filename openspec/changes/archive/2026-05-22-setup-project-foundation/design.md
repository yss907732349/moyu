## Context

`摸鱼侠` 当前仓库只有 OpenSpec 文档，没有应用代码、工程目录、包管理配置、数据库迁移机制或本地启动说明。暂停的 MVP 规划已经指出产品第一阶段需要微信小程序端、后端 API、管理后台、共享配置和数据持久化能力，但 AGENTS.md 也明确要求在正式实现前通过 OpenSpec 固化关键技术决策。

本 change 负责把项目从“只有规划”推进到“可持续开发的工程基线”。它不承接具体业务能力，只建立后续业务 change 可以依赖的目录结构、技术栈、启动方式、共享包、数据库基础设施和质量检查命令。

## Goals / Non-Goals

**Goals:**

- 建立 `pnpm workspace` monorepo，让小程序端、后端、管理后台和共享包在同一仓库中协同开发。
- 初始化 `apps/miniapp`，使用 `uni-app + Vue 3 + TypeScript` 作为微信小程序端工程。
- 初始化 `apps/api`，使用 `NestJS + TypeScript` 作为后端 API 工程。
- 初始化 `apps/admin`，使用 `Vue 3 + Vite + TypeScript` 作为管理后台工程。
- 初始化 `packages/shared`，承载共享类型、feature key、状态枚举等跨端基础约定。
- 初始化 `packages/ui-tokens`，承载暗黑忍者 RPG 视觉方向的基础 token，但不生产最终美术资产。
- 初始化 `packages/config`，承载共享 TypeScript、lint、format 等工程配置。
- 使用 `MySQL + Prisma` 建立数据库连接、schema 和迁移机制。
- 提供最小可运行骨架：小程序四个 tab 占位、API 健康检查、管理后台壳页面。
- 提供中文 README、环境变量样例和统一开发命令。

**Non-Goals:**

- 不实现首页已摸金额、倒计时、薪资设置、节假日提醒或隐藏模式。
- 不实现微信登录、用户资料、阵营选择、成长、签到或成就。
- 不实现内容发布、AI 草稿、社区发帖、评论、举报、审核或漫画内容。
- 不实现真实管理后台权限、运营配置、数据统计或商业位管理。
- 不确定生产部署平台、节假日数据来源、CPS 服务商或最终美术资产。
- 不把暂停的总体 MVP 规划直接恢复为当前活跃 change。

## Decisions

### Decision: Use `pnpm workspace` monorepo

项目 SHALL 使用 `pnpm workspace` 管理 `apps/*` 和 `packages/*`。

Rationale: MVP 会同时包含小程序、API、管理后台和共享类型。monorepo 能减少跨仓库同步成本，并让 feature key、状态枚举、视觉 token 等基础约定可以被多个应用直接复用。

Alternatives considered:

- 多仓库拆分：边界清晰，但当前阶段会增加配置、发布和类型同步成本。
- 单应用目录内混放：起步更快，但后续小程序、后台和 API 的职责会变得模糊。

### Decision: Use `uni-app + Vue 3 + TypeScript` for mini program

微信小程序端 SHALL 初始化为 `uni-app + Vue 3 + TypeScript` 工程，并以微信小程序作为第一目标平台。

Rationale: `uni-app` 能覆盖微信小程序开发需求，同时与 Vue 3 管理后台共享前端心智和部分类型约定。TypeScript 有利于后续 salary profile、feature registry、内容状态等模型保持一致。

Alternatives considered:

- 原生微信小程序：平台贴合度高，但与 Vue 管理后台共享能力较弱。
- Taro：也可行，但当前暂停规划已有 `uni-app` 推荐，且本项目没有已有代码包袱。

### Decision: Use `NestJS + TypeScript` for API

后端 API SHALL 初始化为 `NestJS + TypeScript` 工程，并从一开始按模块化结构组织。

Rationale: 后续会有用户、工作设置、内容、社区、审核、成长、feature registry、后台管理等多个领域。NestJS 的模块、控制器、服务和依赖注入结构适合在 MVP 扩展中保持边界。

Alternatives considered:

- Express/Fastify 裸项目：初始轻量，但业务模块增多后需要自行补齐结构约定。
- 云函数优先：适合小规模能力，但会提前绑定部署形态；当前 AGENTS.md 仍把部署平台列为未知项。

### Decision: Use `Vue 3 + Vite + TypeScript` for admin

管理后台 SHALL 初始化为 `Vue 3 + Vite + TypeScript` 工程。

Rationale: 管理后台需要支持内容审核、运营配置、用户管理等后续能力。Vue 3 与小程序端技术心智接近，Vite 适合快速开发后台壳和后续页面。

Alternatives considered:

- React 管理后台：生态成熟，但会引入另一套前端心智。
- 直接使用低代码后台：短期快，但容易限制内容审核、成长配置和 feature registry 的定制能力。

### Decision: Use `MySQL + Prisma` for persistence foundation

后端 SHALL 使用 `MySQL + Prisma` 建立数据库 schema、连接配置和迁移机制。foundation 阶段 SHALL 只提供迁移基础设施和必要示例，不提前实现完整业务数据模型。

Rationale: MySQL 适合用户、内容、社区、配置、审核状态等关系型数据。Prisma 的 schema、迁移和类型生成能降低早期迭代成本，并让 TypeScript API 更容易保持数据类型一致。

Alternatives considered:

- TypeORM：与 NestJS 常见组合度高，但迁移和类型体验更依赖项目约定。
- SQLite：本地开发简单，但与目标线上关系型数据库形态有差异。
- MongoDB：灵活，但审核流、内容状态、用户设置和后台查询更适合关系模型。

### Decision: Keep foundation pages and APIs as shells

foundation 阶段 SHALL 提供小程序 tab 壳、管理后台壳和 API 健康检查，但 SHALL NOT 实现真实业务流程。

Rationale: 壳页面和健康检查能验证工程、路由、启动命令和跨应用边界。真实业务逻辑属于后续能力 change，过早实现会模糊 OpenSpec 范围。

Alternatives considered:

- 完全不建页面：工程更空，但无法验证小程序导航和后台启动体验。
- 顺手实现部分业务：短期看似推进快，但会绕过当前 change 的范围控制。

## Risks / Trade-offs

- [Risk] `uni-app`、NestJS、Prisma 三套工具链一次性引入，初始配置工作量较大 -> Mitigation: foundation 只做最小可运行骨架和统一脚本，不在本 change 扩展业务复杂度。
- [Risk] Prisma 与未来生产数据库策略不匹配 -> Mitigation: 当前只固化 MySQL 关系模型和迁移机制；如未来部署平台要求变化，应通过新的 OpenSpec change 调整。
- [Risk] 小程序 tab 壳被误解为业务范围已开始 -> Mitigation: 页面文案、tasks 和 spec 明确标记为占位，不接入真实数据或业务计算。
- [Risk] 共享包过早膨胀为“大杂烩” -> Mitigation: foundation 只允许共享基础类型、feature key、状态枚举和视觉 token；业务逻辑留在对应应用或后续领域包。
- [Risk] 后续业务 change 绕过 feature key 和共享类型约定 -> Mitigation: README 和 spec 要求新入口、锁定状态和跨端状态优先使用 `packages/shared` 中的稳定约定。

## Migration Plan

1. 创建 workspace 根配置、统一脚本和中文 README。
2. 初始化 `apps/miniapp`、`apps/api`、`apps/admin` 三个应用工程。
3. 初始化 `packages/shared`、`packages/config`、`packages/ui-tokens` 三个共享包。
4. 配置 TypeScript、lint、format、typecheck 等基础质量命令。
5. 配置 Prisma、数据库环境变量样例和初始迁移机制。
6. 添加 API 健康检查、小程序 tab 壳和管理后台壳页面。
7. 验证本地安装、类型检查、lint、构建或启动命令可运行。

Rollback strategy: foundation 变更尚未承载生产数据。若某个工具链初始化失败，可以在当前 change 内调整对应应用骨架；若需要更换核心技术栈，应先更新本 design 和 spec，再执行实现。

## Open Questions

- 是否需要在 foundation 阶段加入 Docker Compose 提供本地 MySQL，还是只提供 `.env.example` 和连接说明。
- 管理后台是否需要在 foundation 阶段引入具体 UI 组件库，还是等 `admin-operations` change 再决定。
- 小程序端是否需要在 foundation 阶段接入状态管理库，还是等第一个真实业务页面出现后再引入。
