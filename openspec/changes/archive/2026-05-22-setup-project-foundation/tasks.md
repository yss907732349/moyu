## 1. Workspace 基础

- [x] 1.1 创建根 `package.json`、`pnpm-workspace.yaml` 和基础 workspace 脚本
- [x] 1.2 创建 `apps/miniapp`、`apps/api`、`apps/admin`、`packages/shared`、`packages/config`、`packages/ui-tokens` 目录
- [x] 1.3 配置根 TypeScript、lint、format、typecheck 的统一入口
- [x] 1.4 添加 `.gitignore`、环境变量样例和基础工程元数据

## 2. 共享包

- [x] 2.1 初始化 `packages/shared`，导出基础类型、feature key 和状态枚举
- [x] 2.2 初始化 `packages/ui-tokens`，导出暗黑忍者 RPG 方向的基础视觉 token
- [x] 2.3 初始化 `packages/config`，沉淀共享 TypeScript、lint 或格式化配置
- [x] 2.4 验证三个应用可以引用共享包而不复制常量

## 3. 小程序端骨架

- [x] 3.1 初始化 `apps/miniapp` 为 `uni-app + Vue 3 + TypeScript` 工程
- [x] 3.2 配置微信小程序目标平台的开发或构建命令
- [x] 3.3 添加首页、社区、漫画、我的四个 tab 占位页面
- [x] 3.4 确认小程序端不包含真实薪资计算、微信登录、社区提交或漫画加载逻辑

## 4. 后端 API 骨架

- [x] 4.1 初始化 `apps/api` 为 `NestJS + TypeScript` 工程
- [x] 4.2 添加应用配置模块和环境变量读取基础
- [x] 4.3 添加健康检查接口
- [x] 4.4 确认 API 不包含真实业务模块实现

## 5. 数据库与迁移

- [x] 5.1 引入 Prisma 并配置 MySQL datasource
- [x] 5.2 添加 Prisma schema、迁移命令和生成命令
- [x] 5.3 添加数据库连接环境变量样例
- [x] 5.4 确认 schema 不提前定义完整业务表

## 6. 管理后台骨架

- [x] 6.1 初始化 `apps/admin` 为 `Vue 3 + Vite + TypeScript` 工程
- [x] 6.2 添加后台壳页面或占位登录入口
- [x] 6.3 配置管理后台本地开发、类型检查和构建命令
- [x] 6.4 确认后台不包含真实用户管理、内容审核、成长配置、商业位或数据统计操作

## 7. 文档与验证

- [x] 7.1 编写中文 README，说明项目结构、安装方式、环境变量、启动命令和 foundation 范围
- [x] 7.2 运行依赖安装并验证 workspace 依赖解析
- [x] 7.3 运行 lint、format、typecheck 或等价质量检查命令
- [x] 7.4 验证小程序端、API 和管理后台的本地启动或构建命令
- [x] 7.5 运行 `openspec status --change setup-project-foundation` 确认 change artifacts 完整
