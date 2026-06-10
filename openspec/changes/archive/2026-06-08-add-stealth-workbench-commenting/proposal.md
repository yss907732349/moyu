## Why

摸鱼模式第一版如果只能浏览和标记帖子，社区参与感会偏弱；评论是论坛闭环的核心能力，适合纳入第一版。与此同时，摸鱼模式必须继续保持低暴露的办公表格体验，不能把普通社区详情页的复杂评论、回复、举报和审核状态完整搬进来。

## What Changes

- 在摸鱼模式帖子详情中新增发表评论能力，入口文案正常使用 `发表评论`。
- 评论提交复用现有社区评论接口、身份门槛、内容安全审核、自动通过、人工复核、作者自见、频控和用户治理流程。
- 摸鱼模式提交评论后不展示审核状态、审核原因、仅自己可见等状态文案，只使用轻量提交反馈和刷新后的评论列表。
- 摸鱼模式评论列表继续直接展示在表格 UI 中，并展示评论人、内容和时间。
- 第一版不在摸鱼模式开放回复、举报、图片上传、消息中心、我的评论或评论管理入口。
- 不新增后端 API、数据库模型或独立评论审核流程。

## Capabilities

### New Capabilities

- `stealth-workbench-commenting`: 定义摸鱼模式帖子详情中的发表评论能力、表格化评论输入与展示、正常社区评论流程复用和审核状态隐藏边界。

### Modified Capabilities

- 无。

## Impact

- 小程序端：影响 `apps/miniapp/src/pages/stealth-workbench/forum-detail.vue` 和摸鱼模式表格样式/验证脚本。
- 小程序服务：复用 `apps/miniapp/src/services/community-lite.ts` 中的 `createCommunityComment` 和 `getCommunityPost`，不新增服务方法。
- 后端 API：复用现有社区评论接口，不改变请求和响应契约。
- 内容安全与审核：继续沿用 `community-lite`、`low-cost-content-moderation`、`comment-review-automation` 和微信内容安全相关既有规则。
- 验证：更新摸鱼模式验证，允许引用评论创建能力，但仍禁止回复、举报、发帖、图片上传、消息中心和个人社区中心入口。
