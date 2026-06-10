## Why

社区公开个人页、关注/取消关注、关注列表/粉丝列表和“我的”页三项数据已经完成第一轮能力闭环，但当前体验仍偏“功能可用”：作者头像/昵称的可点击感不够强，公开个人页视觉还像资料表格，关注/取消关注反馈偏硬，列表空态/加载态/失败态略简陋，小屏长昵称、长称号和长数字的验收需要再加一道人工口径。

这个 change 聚焦社交体验 polish：让用户更容易发现“这个隐者可以点进去看看”，让公开个人页更像暗黑忍者 RPG 的“隐者名片”，让关注关系的反馈更稳、更舒服，并继续收紧公开响应和页面展示的敏感字段边界。

## What Changes

- 强化帖子详情、评论区和回复区作者头像/昵称的可点击感，包括视觉 affordance、点击热区、按压态和不可点击作者的差异展示。
- 重塑公开个人页首屏为“隐者名片”：头像、阵营、昵称、等级、称号、轻量 IP 属地、关注操作和三项统计形成身份卡，而不是表格化信息堆叠。
- 优化关注/取消关注交互：关注立即给出柔和正反馈；取消关注增加防误触确认或等价二次意图表达；失败时回滚为服务端事实状态并给出不泄露内部原因的提示。
- 优化关注列表/粉丝列表空状态、加载态、失败态和分页加载态，保持真实空数据，不引入推荐用户或假用户。
- 打磨“我的”页关注数、粉丝数、连续签到天数三项数据排版，关注/粉丝入口清晰，连续签到保留成长反馈，不恢复隐币/能量普通 UI。
- 对 320px、375px、414px 三档小屏进行长昵称、长称号、长数字、长按钮文案人工验收，要求不重叠、不横向溢出、不遮挡头像/关注按钮/签到按钮。
- 弱化 IP 属地展示层级：保留合规展示位，但不抢昵称、阵营、称号、关注按钮和统计的主信息层级。
- 继续加固敏感字段过滤：公开个人页、关注/粉丝列表、作者入口、关注操作响应和小程序本地展示不得暴露手机号、手机号尾号、手机号验证状态、微信身份、完整 IP、IP 来源 header、薪资、工作档案、隐币、能量、生存账单、CPS 来源、后台治理状态或内容安全内部字段。

## Capabilities

### Modified Capabilities

- `community-follow-profile-system`: 细化公开个人页、关注/取消关注、关注/粉丝列表的体验状态、误触防护和敏感字段边界。
- `community-lite`: 细化帖子详情、评论区和回复区作者入口的可点击感、不可点击作者边界和入口失败提示。
- `user-growth-profile`: 细化“我的”页关注/粉丝/连续签到三项数据排版、小屏数字处理和隐币/能量隐藏边界。
- `visual-system`: 补充隐者名片、作者入口、关注按钮、列表状态和弱化 IP 属地的视觉规范。
- `mvp-beta-readiness`: 增加社交 polish 的人工验收、截图验收和公开响应敏感字段抽查。

## Non-Goals

- 不新增私信、拉黑、好友确认、动态流、关注流、推荐算法、排行榜、用户搜索、新增粉丝通知或后台关注关系运营面板。
- 不改变发帖、评论、回复、图片审核、举报、作者自见或后台治理生命周期。
- 不新增头像上传、头像商店、称号商店、成就系统、隐币/能量玩法公开展示或成长资源消费入口。
- 不改变 IP 属地的合规展示事实，不给普通用户提供关闭、自定义或伪造 IP 属地的能力。
- 不重做全局视觉系统，不替换既有真实头像、徽章、阵营图、Banner 或插画资产。

## Impact

- 小程序：`apps/miniapp/src/pages/community/detail.vue`、评论/回复展示结构、`apps/miniapp/src/pages/community/profile.vue`、`apps/miniapp/src/pages/community/follow-list.vue`、`apps/miniapp/src/pages/profile/index.vue` 和相关样式。
- 后端 API：`apps/api/src/community-lite.controller.ts`、`apps/api/src/community-lite.service.ts` 的公开个人页、关注/取消关注、关注列表/粉丝列表和作者入口响应字段过滤。
- 共享契约：`packages/shared/src/community-lite.ts` 中公开响应类型、敏感字段黑名单验证和 follow/profile 相关校验。
- 验证脚本：`scripts/verify-community-follow-profile-system.mjs`、`scripts/verify-miniapp-community-lite.mjs`、`scripts/verify-miniapp-user-growth-profile.ts`、`scripts/verify-mvp-beta-readiness.mjs`。
- 文档：`docs/miniapp-global-ui-design-prd.md`、`docs/miniapp-visual-illustration-system.md`、`docs/mvp-beta-manual-checklist.md`。
