## Why

当前仓库尚未建立应用代码和工程约定，后续 MVP 能力如果直接分散实现，会先遇到技术栈、目录边界、启动方式、共享类型、数据库迁移和质量工具不一致的问题。

本 change 用于正式确定并搭建 `摸鱼侠` 的项目地基，让后续 `work-value-tracker`、`user-growth-profile`、`feature-registry`、`admin-operations` 等业务 change 可以在同一套工程结构中稳定推进。

## What Changes

- 确定第一阶段技术栈：微信小程序端使用 `uni-app + Vue 3 + TypeScript`，后端使用 `NestJS + TypeScript`，管理后台使用 `Vue 3 + Vite + TypeScript`。
- 建立 `pnpm workspace` 管理的 monorepo 结构，区分小程序端、后端、管理后台和共享包。
- 初始化小程序端、后端 API、管理后台三个应用工程，并提供本地启动命令。
- 初始化共享包，用于放置跨端共享的基础类型、稳定 feature key、状态枚举和视觉 token 基础约定。
- 初始化数据库访问和迁移机制，默认使用 `MySQL + Prisma`，但不实现完整业务数据模型。
- 提供后端健康检查接口和最小可运行 API 骨架。
- 提供小程序端四个主 tab 的页面壳：首页、社区、漫画、我的；页面仅用于导航骨架和占位，不实现业务逻辑。
- 提供管理后台基础壳页面或占位登录入口，不实现真实权限和运营功能。
- 建立环境变量样例、README、本地开发说明、基础 lint/format/typecheck 命令。
- 明确 foundation 阶段的非目标：不实现真实微信登录、薪资计算、内容发布、社区审核、漫画内容、商业位或生产美术资产。

## Capabilities

### New Capabilities

- `project-foundation`: 定义项目技术栈、monorepo 结构、应用骨架、共享包、数据库迁移机制、环境配置、本地启动方式和基础质量工具。

### Modified Capabilities

- None.

## Impact

- 新增 `apps/miniapp`、`apps/api`、`apps/admin` 等应用目录。
- 新增 `packages/shared`、`packages/config`、`packages/ui-tokens` 等共享目录。
- 新增 workspace、TypeScript、lint、format、环境变量和 README 等项目级配置。
- 新增 Prisma 数据库迁移基础设施和后端健康检查接口。
- 后续业务 change 将依赖本 change 建立的目录结构、包管理方式、共享类型约定和启动命令。
