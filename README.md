# 摸鱼隐者

`摸鱼隐者` 是面向年轻打工人的微信小程序项目，Slogan 为 `大隐隐于市，摸鱼隐于职`。当前仓库已经从 foundation 进入 MVP 内测准备阶段，围绕首页已摸金额、首跑建档、隐者日报、轻社区、补给铺、生存账本和后台运营中心做端到端稳定化。

## 项目结构

```text
apps/
  miniapp/        微信小程序端，uni-app + Vue 3 + TypeScript
  api/            后端 API，NestJS + TypeScript
  admin/          管理后台，Vue 3 + Vite + TypeScript
packages/
  shared/         跨端共享契约、feature key、状态枚举和可复用计算逻辑
  ui-tokens/      暗黑忍者 RPG 视觉 token
  config/         共享 TypeScript / lint / format 配置
openspec/         OpenSpec 变更、规格和归档记录
scripts/          验证脚本、同步脚本和内测检查脚本
docs/             内测运行说明和人工检查清单
```

## 环境准备

1. 安装 Node.js 22 LTS 或兼容版本。
2. 启用 pnpm：

```bash
corepack enable
corepack prepare pnpm@9.15.4 --activate
```

3. 安装依赖：

```bash
pnpm install
```

4. 准备环境变量：

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/miniapp/.env.example apps/miniapp/.env
cp apps/admin/.env.example apps/admin/.env
```

`.env.example` 只允许出现本地样例值或占位值，不应提交真实数据库密码、微信密钥、后台令牌、聚推客密钥或 AI 服务密钥。小程序真机调试时，把 `VITE_API_BASE_URL` 从 `localhost` 改为电脑局域网 IP，例如 `http://192.168.1.23:3000`。

## 启动命令

```bash
pnpm dev:api          # 启动 NestJS API 开发服务
pnpm dev:admin        # 启动管理后台，默认 http://localhost:5173
pnpm dev:miniapp      # 构建/监听微信小程序输出
```

API 默认读取根目录和应用目录的 `.env.local` / `.env`；管理后台和小程序通过 Vite 读取各自目录下的 `VITE_*` 变量。后台接口需要 `ADMIN_OPERATIONS_TOKEN`，本地默认样例为 `dev-admin-token`。

## 常用验证

```bash
pnpm verify:mvp-beta-config      # 检查内测配置样例、占位值和误提交风险
pnpm verify:mvp-beta-readiness   # MVP 内测总 smoke，默认不依赖真实外部服务
pnpm typecheck                   # 执行 workspace 类型检查
pnpm build:api                   # 构建后端 API
pnpm build:admin                 # 构建管理后台
pnpm build:miniapp               # 构建微信小程序产物
```

更多纵向验证命令可查看根 `package.json` 的 `verify:*` 脚本。总 smoke 会复用关键纵向脚本，并补充首跑、内容、CPS、后台、配置、数据状态和敏感字段边界的横向断言。

## MVP 内测范围

已纳入内测闭环：

- `work-value-tracker`：工作档案、已摸金额、倒计时、隐藏模式和节假日倒计时。
- `user-growth-profile`：微信登录、隐者档案、阵营、等级资源、签到和角色资料。
- `daily-content-feed` / `world-intel-content`：隐者日报、大陆新闻、文章详情、评论和后台发布。
- `community-lite`：发帖、评论、回复、通知、收藏、举报和审核链路。
- `supply-center` / `accounting-ledger`：补给铺点击归因、聚推客转链、订单同步和生存账本。
- `admin-operations`：后台工作台、统一审核队列、社区治理、日报运营、补给铺排查和实时待办。

当前主 tab 为 `首页`、`社区`、`我的`。漫画/IP 内容第一版收敛到社区入口或后续内容承载，不再作为独立主 tab 暴露。

## 内测运行说明

完整内测运行、数据准备、复位和人工检查说明见 [MVP 内测就绪说明](./docs/mvp-beta-readiness.md) 与 [人工内测检查清单](./docs/mvp-beta-manual-checklist.md)。默认总 smoke 只走本地确定性路径；真实微信登录、真实聚推客转链、真实订单回流和真实 AI 审核属于人工联调检查，不作为默认 smoke 通过前提。
