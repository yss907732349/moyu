## 1. 词库同步与缓存

- [x] 1.1 新增敏感词库缓存结构，保存词条、分类、风险等级、来源仓库、许可、同步时间和词条数量。
- [x] 1.2 新增 `scripts/sync-sensitive-lexicon.mjs`，从 `https://github.com/konsheng/Sensitive-lexicon` 同步 `.txt` 词库并归一化去重。
- [x] 1.3 确保同步失败、仓库不可访问或结构异常时不覆盖已有可用缓存，并输出明确错误。
- [x] 1.4 新增 `scripts/verify-low-cost-content-moderation.mjs`，验证词库缓存、关键风险词和同步元数据。
- [x] 1.5 在根 `package.json` 新增词库同步与验证命令。

## 2. 共享审核契约

- [x] 2.1 在 `packages/shared` 新增低成本内容审核契约，覆盖审核结果 `pass`、`review`、`reject`、风险等级、风险标签、命中项和处理建议。
- [x] 2.2 新增文本归一化、敏感词匹配和重复内容指纹的共享函数或类型约束。
- [x] 2.3 更新共享导出入口，供 API、后台、小程序和验证脚本复用。

## 3. API 审核服务

- [x] 3.1 新增低成本内容审核服务，启动时加载项目内词库缓存并构建高效匹配结构。
- [x] 3.2 实现文本归一化、硬规则拒绝、灰区待审、低风险通过和可解释命中结果。
- [x] 3.3 实现评论/回复提交频率限制、重复内容去重和近期违规用户收紧策略。
- [x] 3.4 将社区评论与回复审核改为先消费低成本审核结果，再按结果设为 `approved`、`pending` 或 `rejected`。
- [x] 3.5 保持帖子人工审核为主，仅保存低成本审核风险信息用于后台排序和展示，不因低风险自动公开帖子。
- [x] 3.6 保留现有 AI 内容审核服务作为未来增强层，并确保本地硬规则优先于 AI 或第三方供应商。

## 4. 后台与小程序体验

- [x] 4.1 后台统一审核队列和详情展示风险等级、风险标签、命中词、命中字段、审核来源和处理建议。
- [x] 4.2 后台支持按低成本审核风险标签或风险等级筛选待审内容。
- [x] 4.3 小程序评论/回复提交后根据状态展示“已公开”“审核中”或“未通过”的明确反馈。
- [x] 4.4 “我的论坛”继续展示本人帖子、评论和回复状态，并避免把 `pending` 内容表达为已公开。

## 5. 验证

- [x] 5.1 运行 `openspec validate add-low-cost-content-moderation --strict`。
- [x] 5.2 运行 `pnpm format` 和 `pnpm format:check`。
- [x] 5.3 运行 `pnpm lint` 和 `pnpm typecheck`。
- [x] 5.4 运行 `pnpm verify:low-cost-content-moderation`、`pnpm verify:ai-content-moderation`、`pnpm verify:community-lite` 和 `pnpm verify:community-lite-api`。
- [x] 5.5 运行 `pnpm verify:miniapp-community-lite`、`pnpm verify:admin-operations`、`pnpm build:api`、`pnpm build:admin` 和 `pnpm build:miniapp`。
