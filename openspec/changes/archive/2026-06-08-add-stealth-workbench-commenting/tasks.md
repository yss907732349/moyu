## 1. 页面状态与服务接入

- [x] 1.1 在摸鱼模式帖子详情页引入 `createCommunityComment`，保留现有 `getCommunityPost`、标记、归档和附件查看能力
- [x] 1.2 新增评论输入内容、提交中状态和提交反馈状态，避免重复提交
- [x] 1.3 复用现有帖子详情刷新逻辑，评论提交成功后重新同步帖子详情和评论列表

## 2. 表格化发表评论 UI

- [x] 2.1 在摸鱼模式帖子详情评论区域附近新增表格化评论输入区
- [x] 2.2 评论操作文案使用 `发表评论`，并保持文字下划线操作样式
- [x] 2.3 输入区使用合并单元格或等价表格结构，确保 320px、375px 和 414px 小屏不横向滚动、不遮挡
- [x] 2.4 提交失败时保留输入内容并使用轻量文字反馈，不使用普通社区卡片、头像、气泡、底部固定评论栏或 RPG 视觉

## 3. 审核状态隐藏与能力边界

- [x] 3.1 评论提交继续走现有社区评论接口和审核流程，不新增后端 API 或本地伪造公开评论
- [x] 3.2 摸鱼模式不展示 `pending`、`approved`、`rejected`、`reviewDecision`、审核原因、仅自己可见或人工复核等状态文案
- [x] 3.3 摸鱼模式仍不开放回复、举报、发帖、图片上传、消息中心、我的帖子、我的评论、我的回复或收藏管理入口
- [x] 3.4 评论列表继续以表格行或合并单元格展示评论人、内容、时间和回复层级

## 4. 验证与回归

- [x] 4.1 更新 `scripts/verify-miniapp-stealth-workbench-mode.mjs`，允许 `createCommunityComment`，检查 `发表评论` 和详情刷新逻辑
- [x] 4.2 更新验证脚本，继续禁止 `createCommunityReply`、举报、发帖、图片上传、消息中心和个人社区中心入口
- [x] 4.3 运行 `corepack pnpm verify:miniapp-stealth-workbench-mode`
- [x] 4.4 运行 `corepack pnpm verify:miniapp-community-lite`
- [x] 4.5 运行 `corepack pnpm typecheck`
- [x] 4.6 运行 `corepack pnpm build:miniapp`
