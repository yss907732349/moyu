## 1. 共享契约与配置

- [x] 1.1 扩展 `packages/shared`，新增统一 AI 审核结果、审核来源、风险标签、置信度、审核原因和人工复核原因类型
- [x] 1.2 更新日报契约，明确日报来源字段为后台人工录入字段，AI 不得新增或改写来源链接
- [x] 1.3 更新社区契约，记录帖子和评论的 AI 审核结果、AI 审核原因和待人工复核原因
- [x] 1.4 更新 `.env.example`，保留 AI 服务配置占位值并移除测试免审核相关配置

## 2. 日报人工采编与 AI 辅助

- [x] 2.1 调整日报后台生成/编辑流程，以人工创建和编辑每日参悟、尘世情报文章、离谱卷宗文章为主
- [x] 2.2 实现 AI 辅助改写/润色/摘要/风险提示动作，输入必须来自后台当前编辑内容
- [x] 2.3 校验 AI 输出不得新增、替换或伪造 `sourceUrl`、`imageUrl`、来源标题或来源站点
- [x] 2.4 确保官方日报仍只能通过后台显式审核/发布动作公开，AI 辅助不自动发布日报

## 3. 统一 AI 内容审核

- [x] 3.1 在 API 内新增统一 AI 内容审核服务，输出 `approved`、`rejected` 或 `needs_manual_review`
- [x] 3.2 实现明确违规内容自动驳回，并记录风险标签和用户可理解的拒绝原因
- [x] 3.3 实现明确安全内容自动通过，并记录审核来源为 AI
- [x] 3.4 实现 AI 超时、供应商错误、低置信度或灰区内容进入后台人工审核
- [x] 3.5 移除 `REVIEW_BYPASS_FOR_TESTING` 或同等测试免审核路径，测试改用 mock AI 审核结果

## 4. 日报评论和论坛接入

- [x] 4.1 将日报文章评论提交接入统一 AI 审核，自动通过后公开展示，自动拒绝后不公开，无法确认时进入后台审核
- [x] 4.2 将论坛发帖接入统一 AI 审核，替代默认全部人工审核；阵营权限、登录态和引用校验仍先于 AI 审核
- [x] 4.3 将论坛评论接入统一 AI 审核，自动通过后公开展示，自动拒绝后不公开，无法确认时进入后台审核
- [x] 4.4 更新后台待审核列表，展示 AI 无法确认的日报评论、论坛帖子和论坛评论，并保留人工通过/驳回/隐藏能力
- [x] 4.5 确保公开响应不暴露 AI 原始 prompt、供应商响应、内部风险细节或密钥配置

## 5. 验证与验收

- [x] 5.1 新增 `pnpm verify:ai-content-moderation`，验证 AI 自动通过、自动驳回、人工复核和供应商失败降级
- [x] 5.2 更新 `pnpm verify:daily-content-feed`，验证日报来源为人工录入字段、公开字段过滤和 AI 不改写来源链接
- [x] 5.3 更新 `pnpm verify:daily-content-feed-api`，验证日报评论 AI 审核三分流和测试免审核移除
- [x] 5.4 更新 `pnpm verify:community-lite` 和 `pnpm verify:community-lite-api`，验证论坛帖子/评论 AI 审核三分流
- [x] 5.5 更新 `pnpm verify:miniapp-daily-content-feed` 和 `pnpm verify:miniapp-community-lite`，验证提交反馈和公开展示状态
- [x] 5.6 运行 `openspec validate define-daily-content-manual-ai-moderation --strict`
- [x] 5.7 运行 `pnpm format` 和 `pnpm format:check`
- [x] 5.8 运行 `pnpm lint`、`pnpm typecheck`、`pnpm build:api`、`pnpm build:admin` 和 `pnpm build:miniapp`
