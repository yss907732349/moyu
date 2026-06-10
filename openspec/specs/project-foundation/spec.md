## Purpose

`project-foundation` 定义 `摸鱼侠` 的 monorepo 工程地基、应用骨架、共享包、数据库迁移基础和开发工作流文档，确保后续业务 change 可以在稳定项目结构中推进，同时避免 foundation 阶段提前实现具体业务能力。

## Requirements

### Requirement: Monorepo workspace structure

项目 SHALL 使用 `pnpm workspace` 管理 monorepo，并 SHALL 明确区分应用工程和共享包。

#### Scenario: Workspace directories are present

- **WHEN** 开发者查看仓库根目录
- **THEN** 仓库 SHALL 包含 `apps/miniapp`、`apps/api`、`apps/admin`、`packages/shared`、`packages/config` 和 `packages/ui-tokens`

#### Scenario: Workspace install is available

- **WHEN** 开发者在仓库根目录执行依赖安装
- **THEN** workspace SHALL 能解析所有应用和共享包的依赖关系

### Requirement: Mini program foundation

小程序端 SHALL 使用 `uni-app + Vue 3 + TypeScript` 初始化，并 SHALL 以微信小程序作为第一目标平台。

#### Scenario: Mini program can start

- **WHEN** 开发者执行小程序端本地开发命令
- **THEN** 系统 SHALL 启动或构建可供微信小程序开发工具使用的工程输出

#### Scenario: Mini program has tab shell

- **WHEN** 用户打开小程序端页面壳
- **THEN** 小程序 SHALL 提供首页、社区、我的三个主 tab 入口
- **AND** 小程序 SHALL NOT 将漫画/IP 内容作为独立主 tab 展示

#### Scenario: Mini program shell has no business behavior

- **WHEN** 用户查看小程序端 foundation 页面
- **THEN** 页面 SHALL NOT 计算真实已摸金额、发起真实微信登录、提交社区内容或加载真实漫画内容

### Requirement: API foundation

后端 SHALL 使用 `NestJS + TypeScript` 初始化，并 SHALL 提供最小可运行 API 骨架。

#### Scenario: API health check is available

- **WHEN** 开发者启动后端 API 并请求健康检查接口
- **THEN** API SHALL 返回表示服务可用的响应

#### Scenario: API keeps business modules out of foundation

- **WHEN** 开发者查看 foundation 阶段的 API 模块
- **THEN** API SHALL NOT 实现薪资计算、微信登录、内容发布、社区审核或漫画解锁业务流程

### Requirement: Admin foundation

管理后台 SHALL 使用 `Vue 3 + Vite + TypeScript` 初始化，并 SHALL 提供可运行的后台壳页面。

#### Scenario: Admin app can start

- **WHEN** 开发者执行管理后台本地开发命令
- **THEN** 系统 SHALL 启动管理后台开发服务

#### Scenario: Admin shell has no operational authority

- **WHEN** 用户打开 foundation 阶段的管理后台
- **THEN** 管理后台 SHALL NOT 提供真实用户管理、内容审核、成长配置、商业位配置或数据统计操作

### Requirement: Shared foundation packages

项目 SHALL 提供共享包承载跨端基础约定，并 SHALL 避免在共享包中放入具体业务流程。

#### Scenario: Shared package exposes stable constants

- **WHEN** 应用需要引用 feature key、基础状态枚举或跨端类型
- **THEN** 应用 SHALL 能从 `packages/shared` 引用这些基础约定

#### Scenario: UI tokens package exists

- **WHEN** 前端应用需要引用基础视觉 token
- **THEN** 应用 SHALL 能从 `packages/ui-tokens` 引用暗黑忍者 RPG 方向的基础颜色、间距或语义 token

#### Scenario: Shared packages avoid business logic

- **WHEN** 开发者查看 foundation 阶段的共享包
- **THEN** 共享包 SHALL NOT 包含已摸金额计算、成长发奖、内容审核或登录会话等业务流程实现

### Requirement: Database migration foundation

项目 SHALL 使用 `MySQL + Prisma` 建立数据库访问和迁移基础设施。

#### Scenario: Prisma configuration is present

- **WHEN** 开发者查看后端或数据库目录
- **THEN** 项目 SHALL 包含 Prisma schema、迁移命令和数据库连接环境变量样例

#### Scenario: Foundation avoids complete business schema

- **WHEN** 开发者查看 foundation 阶段的 Prisma schema
- **THEN** schema SHALL NOT 提前定义完整用户成长、社区、内容、漫画或商业位业务表

### Requirement: Developer workflow documentation

项目 SHALL 提供中文开发说明、环境变量样例和基础质量命令。

#### Scenario: README explains local development

- **WHEN** 新开发者查看仓库 README
- **THEN** README SHALL 用中文说明依赖安装、环境变量准备、各应用启动命令和当前 foundation 范围

#### Scenario: Environment examples are provided

- **WHEN** 开发者准备本地环境
- **THEN** 项目 SHALL 提供不包含敏感值的环境变量样例文件

#### Scenario: Quality commands are available

- **WHEN** 开发者在仓库根目录执行质量检查命令
- **THEN** 项目 SHALL 提供 lint、format 和 typecheck 的统一入口

### Requirement: Archived change verification references

项目验证脚本 SHALL 对已归档 OpenSpec change 的附属文档使用归档后的稳定路径，并 SHALL 避免继续依赖已失效的活跃 change 路径。

#### Scenario: Verification script references archived change document

- **WHEN** 验证脚本需要读取已归档 change 中的附属验收文档
- **THEN** 验证脚本 SHALL 引用 `openspec/changes/archive/<archive-id>/...` 下的文件
- **AND** 验证脚本 SHALL NOT 只引用 `openspec/changes/<change-id>/...` 下的文件

#### Scenario: Required archived verification document is missing

- **WHEN** 验证脚本依赖已归档 change 附属文档来确认当前验收规则
- **AND** 该文档不存在或路径失效
- **THEN** 验证脚本 SHALL 失败并给出可定位的错误信息
- **AND** 验证脚本 SHALL NOT 静默跳过该策略断言

#### Scenario: Historical archive prose keeps old implementation references

- **WHEN** 归档文档中仅以历史叙述方式提到旧的 `openspec/changes/<change-id>/...` 路径
- **THEN** 系统 MAY 保留该历史文本
- **AND** 当前质量命令 SHALL NOT 依赖该旧路径作为可执行验证输入
