## Context

当前项目已经具备 `pnpm workspace` monorepo、微信小程序端、NestJS API、Prisma/MySQL、共享契约、feature registry、工作档案和首页工作价值计算。`apps/api` 目前通过 `CurrentUserContextService` 提供明确标记的 `temporary-dev-placeholder` 本人上下文，`/me/work-profile` 已经基于该上下文保存敏感工作档案。

个人中心页已经存在暗黑忍者 RPG 视觉模板，但资料、资源、功能宫格、成就和菜单仍是页面内静态数据。`packages/shared` 已有 `user_growth_profile`、`faction_selection`、`daily_checkin` 等 feature key，以及旧的 `UserFaction` 枚举；这些契约需要在本 change 中收束为真实产品命名和可持久化资料模型。

微信登录应成为用户成长资料的身份基础，但第一阶段只建立小程序登录和应用内用户识别，不扩展到手机号、微信昵称头像授权、复杂 session 生命周期或社交账号体系。

## Goals / Non-Goals

**Goals:**

- 建立微信登录第一版：小程序获取登录凭证，API 换取微信身份，系统创建或识别应用内用户，并返回应用登录态。
- 将 `/me/profile`、`/me/daily-checkin` 和后续本人接口统一到“登录态优先、开发占位 fallback”的本人上下文。
- 建立用户成长资料共享契约和持久化结构，包括职业类型、阵营、默认昵称、默认头像 key、等级、经验、隐币、能量、连续签到、称号和徽章占位。
- 首次进入“我的”且资料未创建时，通过轻量职业选择完成隐者档案创建；职业类型决定初始阵营。
- 实现每日签到第一版，保证同一用户同一自然日不重复发奖，并更新成长资源。
- 个人中心展示真实资料快照，并通过 `profile_feature_grid` 读取功能入口。

**Non-Goals:**

- 不实现手机号授权、微信头像昵称授权、用户资料自动读取或真实头像上传。
- 不实现完整账号注销、session 刷新、多设备踢下线、权限体系或后台用户运营。
- 不实现称号商店、徽章解锁规则、成就系统、任务系统、皮肤系统或复杂成长经济。
- 不改变工作档案的薪资、工时、隐藏模式和首页工作价值计算规则。
- 不在本 change 中实现社区身份约束、阵营专区权限或日报个性化推荐。

## Decisions

### Decision: 微信登录使用应用自有登录态承接

小程序端调用微信登录能力获得临时 `code`，提交给 `POST /auth/wechat-login`。API 使用服务端配置的微信小程序 `appid` 和 `secret` 调用微信登录换取接口，获取 `openid` 和可选 `unionid` 后，创建或读取应用用户，再签发应用自己的轻量登录态返回给小程序。

Rationale: 微信 `code` 是短期凭证，不适合作为业务 API 的长期鉴权输入；服务端持有微信密钥和 `session_key`，小程序端只保存应用登录态，后续 `/me/*` 不需要重复暴露微信登录流程。

Alternatives:

- 继续使用固定临时本人上下文。实现更快，但成长资料、签到和阵营会缺少真实用户基础，后续社区与后台用户能力无法可靠复用。
- 小程序端直接保存 `openid`。实现简单，但暴露微信身份标识，且绕过服务端会话边界，不适合作为 API 设计。

### Decision: 本人上下文改为登录态优先，开发 fallback 保留

新增认证上下文解析逻辑：当请求携带有效应用登录态时，`/me/*` 使用登录用户；本地开发环境可继续使用明确标记的 `temporary-dev-placeholder` fallback。生产环境不得默认使用固定占位用户写入成长资料。

Rationale: 这能平滑迁移已有 `/me/work-profile`，同时避免本 change 一次性重写所有本人接口。开发 fallback 仍保留本地联调效率，但语义上不能被误认为真实登录。

Alternatives:

- 只让新资料接口使用登录态，工作档案继续使用旧上下文。实现范围更小，但同一用户的薪资档案和成长资料可能绑定到不同用户来源。
- 直接移除开发 fallback。语义最干净，但会增加本地开发、脚本验证和无微信环境测试成本。

### Decision: 首次资料创建只要求职业类型

首次打开“我的”且当前用户没有成长资料时，小程序展示创建隐者档案面板。用户必须选择职业类型，系统自动分配阵营、生成默认昵称、分配默认头像 key，并初始化成长资源。

职业类型第一版建议使用稳定 key 表达现实工作类型，例如：

- `engineering`：技术开发、测试、运维等，默认分配 `key_shadow` / 键影。
- `creative_operations`：设计、运营、内容、市场等，默认分配 `water_escape` / 水遁。
- `product_strategy`：产品、项目、管理、咨询等，默认分配 `sky_strategy` / 策天。
- `business_support`：销售、客服、行政、其他等，默认分配 `wanderer` / 游侠。

Rationale: 用户只填一个轻量选择，降低首次进入阻力；阵营由系统分配能强化世界观反馈，也为后续阵营测试、改阵营和社区身份留出空间。

Alternatives:

- 让用户直接选择阵营。更直观，但会削弱“职业映射世界观身份”的产品特色。
- 要求昵称、头像、职业、阵营都填写。资料更完整，但首次进入成本过高，不符合第一阶段基础建设目标。

### Decision: 阵营契约在本 change 中修正为产品命名

`packages/shared` 当前旧 `UserFaction` 值为 `shadow`、`mist`、`forge`、`grove`，与已讨论的“键影、水遁、策天、游侠”不完全一致。本 change 应在尚无真实用户数据前修正为稳定语义 key，并提供展示名映射。

Rationale: 阵营是后续社区身份、徽章、称号、活动和视觉资产的基础字段。现在修正成本最低，避免后续把 `forge/grove` 误用为产品事实。

Alternatives:

- 保留旧 key，只修改中文展示名。迁移成本最低，但语义漂移会长期存在。

### Decision: 用户成长资料使用服务端持久化，小程序保留本地快照

API 持久化应用用户、微信身份、成长资料和签到记录。小程序保存 `moyuxia.userProfileSnapshot` 作为首屏兜底；打开“我的”时可先展示合法本地快照，再后台同步 `/me/profile`。

Rationale: 成长资料会被社区、日报、后台和活动复用，必须有服务端事实来源。本地快照只用于弱网首屏和体验连续性，不作为最终权威数据。

Alternatives:

- 仅小程序本地保存资料。实现快，但换设备、社区身份和后台管理都无法成立。

### Decision: 每日签到按用户本地业务日期幂等

签到接口 `POST /me/daily-checkin` 由服务端根据业务日期判断当日是否已签到。成功签到时发放固定第一版奖励，例如经验、隐币和能量；重复签到返回当前签到状态，不重复发奖。连续签到按自然日连续关系更新，断签则从 1 重新开始。

Rationale: 签到是成长系统最早的写操作，必须由服务端保证幂等，不能只靠小程序按钮禁用。

Alternatives:

- 由前端根据本地日期判断是否可签到。体验实现简单，但用户可以绕过，且多端状态不一致。

### Decision: 称号、徽章和头像使用 key 预留

第一阶段资料中保存 `titleKey`、`equippedBadgeKeys` 和 `avatarKey`，页面根据 key 展示默认文案、占位图标或像素资产。暂不实现商店、上传、解锁、佩戴管理或资产后台。

Rationale: 这些字段会影响个人页结构和社区身份展示，但完整资产和经济系统不应阻塞用户资料地基。

Alternatives:

- 暂不保存这些字段。实现更窄，但后续接社区卡片和个人页成就区时会再次修改核心资料契约。

### Decision: 个人中心宫格通过 feature registry 驱动

个人中心功能宫格读取 `FeaturePlacement.ProfileFeatureGrid`，按公开响应展示入口，并复用已有导航拦截规则。页面不得继续维护独立静态宫格数组作为事实来源。

Rationale: `feature-registry` 已经定义入口状态、展示区域、路由安全和本地 fallback；个人中心应成为该契约的消费者，而不是额外维护一套入口配置。

Alternatives:

- 保留页面内静态宫格。实现简单，但入口状态、文案和路由会与共享注册表漂移。

## Risks / Trade-offs

- [Risk] 微信登录需要真实 `appid`、`secret` 和微信接口网络能力，本地或 CI 环境可能不可用。→ Mitigation: 提供明确的开发 fallback、环境变量样例和可注入的微信登录客户端，验证脚本覆盖契约与错误处理，不依赖真实密钥。
- [Risk] 登录态设计过重会拖慢第一阶段。→ Mitigation: 使用轻量 token 或 session 标识承接本人上下文，暂不做刷新、多端管理和权限体系。
- [Risk] 职业到阵营映射可能后续调整。→ Mitigation: 使用稳定职业 key 和阵营 key，集中定义映射函数，避免页面硬编码。
- [Risk] 每日签到与时区边界可能引发重复或断签争议。→ Mitigation: 第一版固定使用服务端业务日期，并在响应中返回 `checkedInToday`、`lastCheckinDate` 和 `checkinStreak`。
- [Risk] 修改本人上下文可能影响 `/me/work-profile`。→ Mitigation: 登录态优先、开发 fallback 保留；工作档案数据迁移不在本 change 强制处理，但接口解析路径需兼容无登录开发模式。

## Migration Plan

1. 新增共享契约和验证脚本，先固定职业类型、阵营、资料快照、签到和登录响应结构。
2. 新增 Prisma 用户、微信身份、成长资料、签到记录模型和迁移；保留现有 `WorkProfile.userId` 字段语义。
3. 新增 API 登录、本人资料和签到服务，并让本人上下文优先解析应用登录态。
4. 新增小程序登录与资料服务，保存应用登录态和 `moyuxia.userProfileSnapshot`。
5. 替换个人中心静态数据为真实资料状态，接入首次创建档案、签到和 `profile_feature_grid`。
6. 补充验证脚本、格式化、lint、typecheck 和受影响应用构建。

Rollback strategy: 如果微信登录联调阻塞，可暂时保留开发 fallback 并将 `user_growth_profile` 入口维持在本地可演示状态；数据库迁移按 Prisma 本地迁移流程回滚或重建。不得在生产路径中悄悄回到固定占位用户。

## Open Questions

- 微信小程序正式 `appid`、`secret` 和环境变量命名是否已经确定？如果尚未确定，第一版应只提供样例和本地 fallback。
- 应用登录态第一版使用签名 token、数据库 session 还是内存 session？建议实现前根据现有依赖选择最小可验证方案。
- 职业类型文案是否需要更贴近目标用户行业口吻？当前映射适合第一版，但上线前可再做一次产品文案打磨。
