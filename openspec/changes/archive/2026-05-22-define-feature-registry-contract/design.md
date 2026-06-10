## Context

`摸鱼侠` 当前没有已生效的 `feature-registry` 规格，但暂停的 MVP 规划已经明确需要通过稳定功能入口承载已开放、未解锁和敬请期待模块。

这个 change 只定义功能入口配置契约，不重新选择前端框架、后端框架、数据库或部署平台。它应复用 `setup-project-foundation` 中已经确定的 `packages/shared` 基础约定，并与 `define-visual-system` 中的功能入口视觉状态契约衔接。第一版实现先使用本地默认配置，保留与后续服务端接口一致的数据形态；后续接入服务端和后台管理时，对小程序端暴露的字段和行为应保持一致。

## Goals / Non-Goals

**Goals:**

- 定义功能入口条目的稳定字段、状态、展示位置、排序和点击行为，并复用 `packages/shared` 中的基础 key 与状态枚举。
- 让首页、我的页、社区、漫画、补给等入口从同一配置来源渲染。
- 支持 `enabled`、`locked`、`coming_soon`、`hidden`、`disabled` 等状态，避免页面内散落硬编码。
- 保护未开放功能和敏感配置，前端只能拿到可展示、可解释的公开配置。
- 为后台运营配置和未来模块扩展预留稳定契约。

**Non-Goals:**

- 不实现完整后台运营系统。
- 不实现赛季排行、复杂小游戏、称号商店、皮肤商店、实时聊天、私信或高级社交关系。
- 不提前决定具体技术栈、数据库表结构或部署方式。
- 不把薪资、上班时间、用户隐私数据放入功能入口配置。

## Decisions

### Decision: 使用稳定 `featureKey` 作为功能入口主标识

每个功能入口都使用全局稳定的 `featureKey`，并统一采用 snake_case，例如 `work_value_tracker`、`daily_checkin`、`community_lite`、`season_rank`。页面、埋点、权限判断和后台配置都引用同一个 key。若 `packages/shared` 已存在基础 feature key 常量，本 change 的实现应在其基础上扩展，不重复创建另一套业务常量。

Rationale: 标题、图标、路由和排序都可能变化，`featureKey` 需要在版本迭代中保持稳定，避免配置迁移和统计口径混乱。

Alternatives considered:

- 使用标题作为标识。中文标题容易改名，不适合作为稳定契约。
- 使用路由作为标识。未开放功能可能没有真实路由，且路由重构不应影响业务配置。
- 使用 kebab-case 作为业务字段。它适合 OpenSpec capability 和 URL 片段，但在 TypeScript 常量、对象 key 和后续数据库字段中不如 snake_case 稳定易用。

### Decision: 第一版以本地默认配置为事实来源

第一版先在共享包或小程序侧提供默认功能入口配置，并保持返回结构接近未来 API 响应。小程序端通过统一读取方法按 `placement` 获取入口；未来接入服务端时替换数据来源，不改入口组件和点击逻辑。

Rationale: 当前项目基础仍在搭建阶段，直接引入完整服务端配置和后台发布链路会扩大范围。本地默认配置足以支撑首页、我的页和未来入口占位，同时为后续 API 留出稳定契约。

Alternatives considered:

- 立即实现服务端接口和后台配置。长期更完整，但会把本 change 扩大到 admin operations 和数据库模型。
- 各页面直接写本地数组。最快，但会破坏统一契约，后续迁移成本高。

### Decision: 功能状态驱动展示和点击行为

功能入口状态使用枚举表达：`enabled` 表示可进入；`locked` 表示可见但不可进入，并展示解锁条件；`coming_soon` 表示可见占位，并展示敬请期待提示；`disabled` 表示临时不可用，并展示配置化原因；`hidden` 表示不向普通用户返回。

Rationale: 状态枚举让不同页面用同一套逻辑处理入口，不需要各自判断“未解锁”“维护中”“未上线”等情况。

Alternatives considered:

- 使用多个布尔字段组合。组合状态容易冲突，例如同时 `isLocked` 和 `isComingSoon`。
- 页面自行决定入口状态。短期灵活，但会导致不同页面展示不一致。

### Decision: 按展示区域拉取配置，而不是按页面硬编码

功能入口应支持 `placements`，例如 `home_quick_entry`、`profile_feature_grid`、`community_entry`。小程序端按展示区域读取条目，服务端或本地配置负责过滤状态、排序和文案。

Rationale: 同一功能可能出现在多个位置，展示区域比页面名更稳定，也方便未来在首页替换签到横幅位置时复用配置。

Alternatives considered:

- 每个页面维护单独配置。会产生重复条目和排序冲突。
- 只提供全量配置给前端自行过滤。实现简单，但容易泄露不应展示的隐藏功能和内部配置。

### Decision: 前端对不可进入状态做统一拦截

小程序端在点击入口时先读取状态：`enabled` 才允许导航到公开路由；其他可见状态必须展示配置化提示，不进入未开放业务页面。

Rationale: 功能入口本质是导航边界，必须在用户侧防止误入未完成、未审核或不应公开的功能。

Alternatives considered:

- 仅依赖后端接口拒绝。后端仍需防护，但用户会看到无效页面或错误体验。
- 为每个入口写独立点击逻辑。入口数量增加后维护成本高。

### Decision: 管理端可以配置展示元数据，但不能发布不安全能力

后台可管理标题、图标、排序、状态、展示区域、解锁文案和敬请期待文案；真实业务路由、需要登录、灰度策略和是否公开应受系统约束或权限校验保护。

Rationale: 运营需要调整入口，但不应通过配置绕过审核、权限或技术未完成状态。

Alternatives considered:

- 完全开放所有字段给运营配置。灵活但风险高。
- 完全代码内配置。安全但每次调整都需要发版。

### Decision: 第一版解锁规则只强制用户可读文案

`locked` 入口第一版必须提供 `unlockText`，用于解释解锁要求。结构化条件可以保留为可选字段，但不要求第一版实现等级、阵营、签到天数等自动计算。

Rationale: 未解锁入口的 MVP 价值主要是让用户理解未来目标。真实解锁计算依赖成长体系、签到、阵营等后续能力，不应在本 change 中提前固化。

Alternatives considered:

- 立即实现结构化解锁条件。可测试性更强，但会绑定尚未完成的成长和用户资料模型。
- 只显示统一锁定文案。实现最简单，但无法体现不同未来功能的成长目标。

## Risks / Trade-offs

- [Risk] 状态枚举过多导致 MVP 实现变重 -> Mitigation: 第一版必须实现 `enabled`、`locked`、`coming_soon`，`disabled` 和 `hidden` 可以先作为契约和配置保留，并优先从 `packages/shared` 导出统一枚举。
- [Risk] 过早设计复杂解锁规则 -> Mitigation: 第一版只要求可读的 `unlockText`，结构化条件仅作为可选扩展字段，真实解锁计算由后续 change 细化。
- [Risk] 后台误配置导致入口不可用 -> Mitigation: 配置发布前校验 `featureKey`、状态、展示区域、排序和公开路由。
- [Risk] 隐藏功能信息泄露 -> Mitigation: 普通用户接口不得返回 `hidden` 条目和内部备注字段。

## Migration Plan

1. 在 `packages/shared` 现有基础约定上补充 snake_case `featureKey`、`feature-registry` 共享类型和本地默认种子配置。
2. 小程序端入口区域改为读取功能入口配置渲染。
3. 增加统一点击处理：可进入、未解锁、敬请期待、维护中、隐藏。
4. 后续接入服务端或后台时复用同一字段契约，并在发布前做配置校验。
5. 回滚时可退回默认本地配置，或将风险入口状态切换为 `hidden` / `disabled`。

## Open Questions

无。
