## 1. 共享契约

- [x] 1.1 在 `packages/shared` 新增后台运营中心契约，覆盖工作台计数、最近待办、统一审核队列项、审核详情、可用操作和敏感字段黑名单。
- [x] 1.2 扩展日报契约，补充文章来源类型 `original` / `curated`、定时发布请求/响应和取消定时发布响应。
- [x] 1.3 更新共享导出入口，确保 API、后台和验证脚本可复用后台运营与日报发布契约。

## 2. 后台运营 API

- [x] 2.1 新增 `admin/operations` 后台聚合控制器和服务，所有接口校验 `x-admin-token`。
- [x] 2.2 实现 `GET /admin/operations/workbench`，返回社区审核、日报评论、举报和日报发布待办计数及最近待办。
- [x] 2.3 实现 `GET /admin/operations/review-queue`，聚合社区帖子、社区评论、社区回复、社区举报和日报评论，并支持来源、类型、状态和 AI 风险标签筛选。
- [x] 2.4 实现 `GET /admin/operations/review-queue/:itemId`，返回原文、上下文、作者公开快照、AI 审核摘要、当前状态和可用操作。
- [x] 2.5 确保后台运营聚合响应不包含薪资、工作档案、生存账单、CPS 来源、微信身份、登录态、AI 原始 prompt、供应商原始响应或密钥字段。

## 3. 日报轻量发布与定时发布

- [x] 3.1 调整日报发布前校验：原创文章不强制外部来源，外部采编文章必须补齐来源标题、来源站点和来源 URL。
- [x] 3.2 调整后台日报发布服务，使草稿可在校验通过后直接立即发布，不强制提交审核和审核通过。
- [x] 3.3 完善 `POST /admin/daily-content/issues/:issueId/schedule`，校验定时时间晚于当前时间并保存 `scheduledPublishAt`。
- [x] 3.4 新增取消定时发布接口，将 `scheduled` 日报恢复为 `draft` 并清除或停用定时发布时间。
- [x] 3.5 实现定时发布处理服务，扫描到点 `scheduled` 日报并在再次校验通过后发布。
- [x] 3.6 确保到点发布失败时不公开日报，并保留后台可见的待处理状态或失败提示。

## 4. 管理后台界面

- [x] 4.1 重组 `apps/admin` 首页为后台运营中心工作台，展示待审核帖子、待复核评论/回复、待处理举报、日报评论待复核和日报发布待办。
- [x] 4.2 新增统一审核队列视图，支持来源、类型、状态和 AI 风险标签筛选。
- [x] 4.3 新增或完善审核详情视图，展示原文、上下文、AI 标签和原因、当前状态、备注输入和可用操作。
- [x] 4.4 将通过、驳回、隐藏、保留内容、隐藏内容和标记误报操作接入现有领域接口，并确保请求携带 `x-admin-token`。
- [x] 4.5 调整日报运营界面，提供保存草稿、预览、立即发布、设置定时发布、修改时间、取消定时和归档入口。
- [x] 4.6 在日报编辑界面提供文章来源类型选择，并按原创/外部采编展示相应来源字段提示。

## 5. 验证脚本

- [x] 5.1 新增 `scripts/verify-admin-operations` 验证脚本，检查后台运营中心入口、队列展示、操作按钮和日报定时发布入口。
- [x] 5.2 验证后台请求或客户端封装会携带 `x-admin-token`。
- [x] 5.3 验证统一审核队列覆盖社区和日报评论来源，并展示 AI 风险标签和原因。
- [x] 5.4 验证后台运营聚合响应不暴露敏感字段黑名单。
- [x] 5.5 在根 `package.json` 新增 `pnpm verify:admin-operations` 命令。

## 6. 验收

- [x] 6.1 运行 `openspec validate build-admin-operations-center --strict`。
- [x] 6.2 运行 `pnpm format`。
- [x] 6.3 运行 `pnpm format:check`。
- [x] 6.4 运行 `pnpm lint`。
- [x] 6.5 运行 `pnpm typecheck`。
- [x] 6.6 运行 `pnpm verify:admin-operations`。
- [x] 6.7 运行 `pnpm verify:daily-content-feed`、`pnpm verify:daily-content-feed-api` 和 `pnpm verify:admin-daily-content-feed`。
- [x] 6.8 运行 `pnpm build:api` 和 `pnpm build:admin`。

## 7. 图片与媒体风险补强

- [x] 7.1 为日报后台图片上传增加前端压缩、缩略图生成和上传响应中的缩略图路径。
- [x] 7.2 为社区媒体资产上传增加 MIME 类型、单图大小和单用户日上传频率限制。
- [x] 7.3 为社区媒体资产增加后台清理入口，隐藏超过保留时间且未绑定帖子的孤儿资产。
- [x] 7.4 更新验证脚本覆盖日报图片压缩入口、缩略图字段、社区媒体限流和清理入口。
- [x] 7.5 运行 OpenSpec、格式、lint、typecheck、相关验证脚本和受影响应用构建。
