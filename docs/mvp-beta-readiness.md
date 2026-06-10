# MVP 内测就绪说明

本文档用于 `stabilize-mvp-end-to-end-beta-readiness` 的开发、测试和内测准备。默认路径只依赖本地源码、mock/fixture 和已有验证脚本；真实微信、聚推客、AI 服务和代理联调见人工清单。

## 环境变量

实际读取来源：

- 根目录：`.env.example` 覆盖 API、数据库、微信登录、后台 token、CPS、AI 审核、代理和脚本变量。
- `apps/api/.env.example`：API 开发服务的同名变量，NestJS 会读取根目录和应用目录的 `.env.local` / `.env`。
- `apps/miniapp/.env.example`：小程序端只读取 `VITE_API_BASE_URL` 和 `VITE_WECHAT_LOGIN_MOCK_ENABLED`。
- `apps/admin/.env.example`：管理后台只读取 `VITE_API_BASE_URL`。

真机调试时，`VITE_API_BASE_URL` 必须使用电脑局域网地址，不使用 `localhost`。真实外部服务联调时，微信、聚推客、DeepSeek、数据库和代理变量只写入本地 `.env` 或部署平台，不提交到仓库。

### 微信内容安全

微信内容安全用于社区帖子、评论、回复、日报评论、大陆新闻评论、公开昵称和社区图片审核。内测默认可以使用 mock：

- `WECHAT_CONTENT_SECURITY_ENABLED=false`
- `WECHAT_CONTENT_SECURITY_MOCK_ENABLED=true`
- `WECHAT_CONTENT_SECURITY_MOCK_TEXT_RESULT=pass`
- `WECHAT_CONTENT_SECURITY_MOCK_IMAGE_RESULT=review`
- `WECHAT_CONTENT_SECURITY_FORCE_PROVIDER_ERROR=false`
- `WECHAT_CONTENT_SECURITY_TIMEOUT_MS=3000`

内测目标若是减少人工审核，文本 mock 可以保持 `pass`；图片 mock 默认保持 `review`，避免把未接入真实微信异步回调的用户图片直接公开。只有验证图片通过链路时，才临时把 `WECHAT_CONTENT_SECURITY_MOCK_IMAGE_RESULT` 切换为 `pass`，验证后应恢复为 `review`。

真实联调时需要配置 `WECHAT_MINIAPP_APPID`、`WECHAT_MINIAPP_SECRET`，并将 `WECHAT_CONTENT_SECURITY_ENABLED=true`、`WECHAT_CONTENT_SECURITY_MOCK_ENABLED=false`。图片异步审核需要把微信回调域名指向 API 的 `/community/content-security/wechat/media-callback`，并在服务端配置 `WECHAT_CONTENT_SECURITY_IMAGE_CALLBACK_TOKEN` 和 `WECHAT_CONTENT_SECURITY_IMAGE_CALLBACK_MAX_DELAY_SECONDS`。回调 token 只写入本地或部署环境，不提交真实值。

图片审核提交给微信时必须使用微信服务器可下载的公网或局域网穿透 URL。开发环境可通过 `COMMUNITY_MEDIA_PUBLIC_BASE_URL`、`API_PUBLIC_BASE_URL` 或 `WECHAT_CONTENT_SECURITY_MEDIA_PUBLIC_BASE_URL` 提供 API 公开 origin；若上传后的 `/community/media-assets/files/...` 无法转换成可下载绝对地址，系统会转入人工复核。

内容安全失败、超时、无有效 openid、近两小时访问条件不满足或图片回调未到达时，系统应进入人工复核，不得表达为已经通过微信审核。后台只展示归一化来源、风险标签、人工复核原因和脱敏 `trace_id` 摘要，不展示微信 `secret`、`access_token`、完整 openid、sessionKey 或供应商完整原始响应。

### 社区身份门槛与 IP 属地

社区发帖、评论和回复默认开启身份门槛：用户必须先同意当前隐私政策和社区用户协议，再完成微信手机号验证。内测可使用手机号验证 mock：

- `COMMUNITY_IDENTITY_GATE_ENABLED=true`
- `COMMUNITY_PRIVACY_POLICY_VERSION=2026-06-08`
- `COMMUNITY_AGREEMENT_VERSION=2026-06-08`
- `WECHAT_PHONE_NUMBER_MOCK_ENABLED=true`
- `WECHAT_PHONE_NUMBER_MOCK_PHONE=replace-with-mock-phone-number`
- `WECHAT_PHONE_NUMBER_MOCK_ERROR=`
- `COMMUNITY_PHONE_HASH_SALT=replace-with-community-phone-hash-salt`

提审包和生产包不得关闭身份门槛，也不得给普通用户提供关闭帖子详情、评论、回复或公开个人主页 IP 属地展示位的开关。手机号验证只作为发布门槛和后台合规状态，公开帖子、评论、回复、作者快照、通知和公开个人主页不得展示完整手机号、手机号尾号或“已验证手机号”状态。

IP 属地由服务端在发帖、评论和回复创建时从可信请求来源计算。代理部署时需配置 `COMMUNITY_TRUSTED_PROXY_HEADERS`、`COMMUNITY_TRUSTED_PROXY_ADDRS`，或兼容变量 `TRUSTED_PROXY_IP_HEADERS`、`TRUSTED_PROXY_REMOTE_ADDRS`；未配置可信代理时，不信任普通请求中的 `X-Forwarded-For`。内测可用 `COMMUNITY_IP_LOCATION_MOCK_LABEL`、`COMMUNITY_IP_LOCATION_MOCK_COUNTRY`、`COMMUNITY_IP_LOCATION_MOCK_PROVINCE` 固定降精度属地；未配置解析服务时公开侧展示 `IP属地：未知`，不得伪造省份或国家。

合规文档检查应同时覆盖 `docs/privacy-policy.md` 和 `docs/community-user-agreement.md`：隐私政策需说明手机号验证、IP 属地展示、内容安全审核、举报治理、后台处理和保存边界；社区用户协议需说明发帖、评论、回复、审核、隐藏、移除、禁言、封禁、举报和申诉边界。

### 社区公开个人页与关注关系

社区公开个人页、关注/取消关注、关注列表、粉丝列表和“我的”页三项数据已经进入 MVP 内测范围。内测时应按弱社交边界验证：关注关系为单向关系，不引入私信、拉黑、好友确认、关注流、动态流、推荐排序、排行榜、用户搜索、新增粉丝通知或后台关注关系运营面板。

公开个人页必须使用稳定公开标识 `publicProfileId` 进入，不使用微信 openid、unionid、手机号、昵称、登录态或内部自增 ID 作为路由凭据。帖子详情、评论区和回复区中只有拥有合法公开标识的作者头像/昵称才可点击；种子作者、无真实用户映射作者或公开标识不可访问的作者只能展示普通快照，并使用泛化提示。

公开个人页首屏应呈现“隐者名片”体验：头像、昵称、阵营、等级、称号、关注操作、关注数、粉丝数、公开帖数和公开帖子列表开头清晰可读；`IP属地` 保留但弱化展示，不做强徽章、主按钮色或统计位。关注成功使用轻量反馈，取消关注必须先确认或使用等价二次意图表达，失败时恢复为请求前状态或服务端事实状态。

关注列表和粉丝列表必须覆盖加载、真实空、失败重试、分页加载和没有更多状态；空状态不得注入推荐用户、假用户或开发种子用户。公开个人页、关注/粉丝列表、关注操作响应、小程序页面绑定、本地缓存和调试日志不得包含手机号、手机号尾号、手机号验证状态、完整 IP、市/区县/街道、IP 来源 header、微信身份字段、登录态、薪资、工作档案、隐藏模式、隐币、能量、生存账本、CPS 来源、后台治理状态或内容安全内部风险字段。

配置检查：

```bash
pnpm verify:mvp-beta-config
pnpm verify:mvp-beta-config -- --local
```

默认检查样例文件是否完整、是否仍被 `.gitignore` 保护、是否存在疑似真实密钥误提交。`--local` 会检查本地 `.env` / `.env.local` 是否缺少内测必需开关或仍使用占位值，适合内测前自查。

## 稳定测试标识

内测 fixture 使用固定前缀，便于复位和隔离：

- 测试用户：`mvp_beta_user_001`
- 社交目标用户：`mvp_beta_user_follow_target_001`
- 社交粉丝用户：`mvp_beta_user_follower_001`
- 测试日报：`mvp_beta_daily_issue_001`
- 日报评论：`mvp_beta_daily_comment_001`
- 社区帖子：`mvp_beta_community_post_001`
- 社区评论：`mvp_beta_community_comment_001`
- 补给项：`mvp_beta_supply_item_001`
- 补给点击：`mvp_beta_supply_click_001`
- 模拟订单：`mvp_beta_order_effective_001`、`mvp_beta_order_refunded_001`、`mvp_beta_order_unmatched_001`
- 审核队列：`mvp_beta_review_queue_001`

这些标识只用于开发、测试或演示环境。不得用它们伪造普通用户生产订单、真实互动或生产内容来源。

## 数据准备

推荐顺序：

1. 使用 mock 登录或固定测试登录态创建 `mvp_beta_user_001`。
2. 创建隐者档案并保存工作档案，确认首页 ready 状态基于真实快照计算。
3. 创建或选择 `mvp_beta_daily_issue_001`，发布至少一个公开日报板块。
4. 用普通用户提交日报评论，并从今日参悟引用发帖生成 `mvp_beta_community_post_001`。
5. 在后台审核队列处理该帖子或评论，确认小程序回显待审、通过或驳回状态。
6. 使用 `WECHAT_CONTENT_SECURITY_MOCK_TEXT_RESULT=review` 提交评论，确认作者本人看到“审核中/仅自己可见”，其他用户不可见；切换为 `pass` 后确认内容公开，切换为 `risky` 后确认未公开。
7. 使用带图帖子验证图片审核：图片回调通过前帖子只对作者本人可见，回调通过后公开，回调违规或超时后保留人工复核或驳回边界。
8. 为 `mvp_beta_user_001`、`mvp_beta_user_follow_target_001` 和 `mvp_beta_user_follower_001` 创建隐者档案，确认均生成合法 `publicProfileId`，且普通响应不暴露微信身份、手机号、工作档案、隐币或能量。
9. 使用 `mvp_beta_user_follow_target_001` 发布并通过至少一条公开帖子，确认 `mvp_beta_user_001` 可从帖子详情、评论或回复作者入口进入公开个人页，公开帖子列表只展示仍可公开的内容。
10. 使用 `mvp_beta_user_001` 对目标用户执行关注、重复关注、取消关注、取消确认和重复取消；确认计数幂等、取消前有二次意图表达、关注不新增粉丝通知、不改变论坛消息未读数、不改变社区推荐排序。
11. 从公开个人页和“我的”页进入关注列表/粉丝列表，确认加载、真实空、失败重试、分页和没有更多状态清晰，列表项主体点击区与关注操作按钮可区分。
12. 创建或确认 `mvp_beta_supply_item_001`，点击后生成服务端 `sid` 和脱敏 `sidMasked`。
13. 使用模拟订单验证有效订单入账，退款、无效、风控、未知和无法匹配归因订单不计入今日摘要和本周报告。

## 复位策略

每轮内测结束后执行：

- 清理或隔离所有 `mvp_beta_*` 前缀内容。
- 将待审帖子、评论、回复、日报评论和举报处理到明确终态，避免下一轮队列漂移。
- 清理或隔离社交测试用户之间的关注关系、关注/粉丝计数缓存和公开个人页分页游标，避免下一轮社交列表漂移。
- 清理补给点击、订单同步记录和生存账本测试账单，或使用新一轮固定后缀。
- 清理小程序本地缓存：登录态、用户资料快照、工作档案快照、社区通知读取状态和页面缓存。
- 重新运行 `pnpm verify:mvp-beta-readiness`，确认源码契约和 fixture 约束仍然成立。

## 状态边界

小程序和后台必须区分：

- 真实 0 数据：金额为 `¥0.00`、订单数为 0，但接口成功。
- 空状态：没有公开日报、社区帖子、补给项或审核待办。
- 无结果：筛选条件下无匹配内容。
- API 错误：展示明确失败原因，不注入假内容。
- 本地降级：仅在存在合法用户资料快照和工作档案快照时展示，并提示同步失败。

## 总 smoke

```bash
pnpm verify:mvp-beta-readiness
```

默认 smoke 会复用关键纵向 `verify:*` 命令，并补充跨链路断言；社区公开个人页和关注关系应额外保持 `pnpm verify:community-follow-profile-system` 通过。成功输出只包含简洁摘要；失败时以非零状态退出，指向失败链路、可能配置原因和对应纵向验证命令。默认 smoke 不连接真实微信、真实聚推客、真实 DeepSeek、真实生产数据库或真实外部网络。
