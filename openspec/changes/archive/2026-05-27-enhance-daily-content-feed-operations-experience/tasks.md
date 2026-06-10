## 1. 共享契约与数据模型

- [x] 1.1 扩展 `packages/shared` 日报契约，新增编辑校验结果、预览响应、文章排序和评论持久化字段
- [x] 1.2 调整日报编辑请求类型，明确栏目、文章、来源、配图、引用提示和排序字段
- [x] 1.3 新增日报评论 Prisma 模型，包含文章 ID、用户 ID、作者快照、状态、AI 审核、人工复核和时间字段
- [x] 1.4 补充 Prisma 迁移，确保日报评论和现有日报 issue、section、item 关系可查询

## 2. API 与持久化

- [x] 2.1 修复数据库模式下 `updateAdminIssue` / `replaceIssue` 对 `DailyContentSection` 和 `DailyContentItem` 的持久化更新
- [x] 2.2 实现栏目文章新增、删除、排序和字段保存的服务层逻辑
- [x] 2.3 实现日报编辑校验函数，区分阻断发布问题和建议优化问题
- [x] 2.4 在提交审核或发布前执行来源完整性校验，阻止缺少可追溯来源的时事和趣闻文章公开
- [x] 2.5 实现后台日报摘要预览和文章详情预览接口，并复用公开响应过滤逻辑
- [x] 2.6 将日报文章评论创建、AI 审核结果、待复核列表和人工复核结果改为数据库持久化
- [x] 2.7 确保公开日报摘要、栏目列表、文章详情和评论列表不返回后台备注、AI 原始信息或内部风险字段

## 3. 后台运营界面

- [x] 3.1 更新 `apps/admin` 日报编辑器，支持栏目文章新增、删除和排序
- [x] 3.2 在后台展示来源 URL、来源标题、来源站点、配图 URL 和公开来源说明的完整性提示
- [x] 3.3 增加发布前预览区域，展示日报摘要、栏目列表和选中文章详情
- [x] 3.4 更新后台日报评论审核区，读取持久化评论并支持通过、驳回和状态刷新
- [x] 3.5 优化后台保存、提交审核、审核通过、发布失败时的错误提示，明确阻断字段

## 4. 小程序公开体验

- [x] 4.1 优化日报首页无内容、无配图、来源缺失和栏目空状态展示
- [x] 4.2 优化栏目文章列表，确保无图片文章不展示破损图片并保留来源可读性
- [x] 4.3 优化文章详情页评论提交反馈，区分已公开、待审核和被驳回状态
- [x] 4.4 优化引用发帖入口，在不允许引用或身份不足时展示明确提示并阻止无效跳转
- [x] 4.5 确保小程序日报页面不使用本地演示文章填充真实日报状态

## 5. 验证与验收

- [x] 5.1 更新 `verify:daily-content-feed`，覆盖编辑契约、来源完整性、预览响应和公开响应边界
- [x] 5.2 更新 `verify:daily-content-feed-api`，覆盖数据库模式下栏目/文章保存、预览、评论持久化和审核过滤
- [x] 5.3 更新 `verify:miniapp-daily-content-feed`，覆盖空状态、无配图、评论状态和引用不可用提示
- [x] 5.4 增加或更新后台日报验证，覆盖文章增删排序、来源提示、预览和持久评论审核入口
- [x] 5.5 运行 `openspec validate enhance-daily-content-feed-operations-experience --strict`
- [x] 5.6 运行 `pnpm format` 后运行 `pnpm format:check`
- [x] 5.7 运行 `pnpm lint` 和 `pnpm typecheck`
- [x] 5.8 运行 `pnpm verify:daily-content-feed`、`pnpm verify:daily-content-feed-api`、`pnpm verify:miniapp-daily-content-feed`
- [x] 5.9 运行 `pnpm build:api`、`pnpm build:admin` 和 `pnpm build:miniapp`
