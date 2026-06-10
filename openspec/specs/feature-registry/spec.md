## Purpose

`feature-registry` 用于统一小程序端功能入口的稳定标识、展示元数据、状态、展示区域、导航拦截和公开配置边界，避免首页、个人中心、社区、漫画、补给等页面各自硬编码入口状态，并为后续服务端配置和后台运营管理保留稳定契约。

## Requirements

### Requirement: 功能入口结构

系统 SHALL 为每个功能入口定义稳定的 `featureKey`、展示标题、图标引用、状态、展示区域、展示排序和可选描述。

#### Scenario: 校验功能 key 格式

- **WHEN** 创建或加载功能入口时
- **THEN** 系统校验 `featureKey` 使用 snake_case，并且在标题、图标、路由和排序变化时保持稳定

#### Scenario: 引用共享契约

- **WHEN** 应用需要功能入口 key、状态、展示区域或入口类型时
- **THEN** 应用可以从项目共享包导入共享契约，而不是在本地重新定义这些值

#### Scenario: 渲染功能入口

- **WHEN** 小程序渲染已配置的功能入口时
- **THEN** 小程序使用 `feature-registry` 中的 `featureKey`、标题、图标引用、状态、展示区域和展示排序

#### Scenario: 功能元数据变化

- **WHEN** 管理员或版本发布调整功能标题、图标、路由或展示排序时
- **THEN** `featureKey` 在导航、统计和未来配置中保持不变

### Requirement: 功能状态契约

系统 SHALL 支持 `enabled`、`locked`、`coming_soon`、`disabled` 和 `hidden` 作为功能入口状态。

#### Scenario: 点击已开放功能

- **WHEN** 用户点击带有可用公开路由的 `enabled` 功能时
- **THEN** 小程序导航到已配置路由

#### Scenario: 点击未解锁功能

- **WHEN** 用户点击 `locked` 功能时
- **THEN** 小程序阻止导航，并展示已配置的解锁要求

#### Scenario: 未解锁功能没有结构化条件

- **WHEN** `locked` 功能只有 `unlockText`，没有结构化解锁条件时
- **THEN** 小程序仍展示解锁文案，并且不要求自动计算解锁状态

#### Scenario: 点击敬请期待功能

- **WHEN** 用户点击 `coming_soon` 功能时
- **THEN** 小程序阻止导航，并展示已配置的敬请期待文案

#### Scenario: 点击停用功能

- **WHEN** 用户点击 `disabled` 功能时
- **THEN** 小程序阻止导航，并展示已配置的不可用原因

#### Scenario: 配置中存在隐藏功能

- **WHEN** 普通用户请求功能入口时
- **THEN** 系统不返回 `hidden` 功能入口

### Requirement: 基于展示区域获取功能入口

系统 SHALL 允许客户端按展示区域请求功能入口，并且只接收符合该展示区域的入口。

#### Scenario: 使用本地默认注册表

- **WHEN** 第一版没有远端功能注册表服务时
- **THEN** 小程序可以通过相同的基于展示区域的契约，从本地默认注册表获取入口

#### Scenario: 请求首页快捷入口

- **WHEN** 小程序请求 `home_quick_entry` 入口时
- **THEN** 系统返回配置在 `home_quick_entry` 的入口，并按展示排序排列

#### Scenario: 功能出现在多个展示区域

- **WHEN** 一个功能配置在多个展示区域时
- **THEN** 系统可以在每个已配置展示区域返回相同且稳定的 `featureKey`，并使用对应区域的排序

### Requirement: 公开配置响应

系统 SHALL 只向小程序暴露公开的功能配置字段。

#### Scenario: 客户端请求功能注册表

- **WHEN** 小程序请求功能注册表数据时
- **THEN** 响应包含公开展示元数据、状态、已开放入口路由、解锁文案、敬请期待文案和不可用文案等适用字段

#### Scenario: 存在敏感配置

- **WHEN** 功能注册表数据包含内部备注、灰度控制、审核字段或未发布路由信息时
- **THEN** 系统从普通用户响应中排除这些字段

### Requirement: 路由安全

系统 SHALL 只允许带有已配置公开路由的可见 `enabled` 入口进行导航。

#### Scenario: 已开放功能没有公开路由

- **WHEN** 用户点击没有公开路由的 `enabled` 功能时
- **THEN** 小程序阻止导航，并展示不可用提示

#### Scenario: 非开放功能内部配置了路由

- **WHEN** 用户点击状态不是 `enabled` 的功能时
- **THEN** 即使内部配置存在路由，小程序也不会导航到该路由

### Requirement: 后台配置边界

系统 SHALL 允许授权管理员配置功能入口展示元数据、状态、展示区域、排序和用户可见提示文案。

#### Scenario: 管理员更新展示元数据

- **WHEN** 授权管理员更新功能标题、图标、状态、展示区域、排序或提示文案时
- **THEN** 系统在配置对普通用户可见之前完成校验

#### Scenario: 未授权用户尝试配置

- **WHEN** 没有功能配置权限的用户尝试创建、更新、发布或隐藏功能入口时
- **THEN** 系统拒绝该操作

### Requirement: 默认 MVP 功能注册表

系统 SHALL 为第一版产品界面提供默认功能入口，包括已开放的 MVP 功能和必要的隐藏或未来态内部配置，但普通用户默认入口 SHALL 优先展示真实可用能力。

#### Scenario: 初始化默认注册表

- **WHEN** 应用初始化第一版功能注册表数据时
- **THEN** 注册表包含已摸金额、薪资和上班时间设置、个人资料、每日签到、隐者日报、轻社区、生存账本和补给铺等 MVP 能力
- **AND** `hide_mode` SHALL NOT 作为首页独立快捷入口展示
- **AND** `comic_ip_content` SHALL NOT 作为默认公开独立主导航入口或个人中心主要入口展示

#### Scenario: 漫画 IP 内容降级为社区内容入口

- **WHEN** 第一版仍需要展示漫画/IP 或 `隐者大陆` 世界观预告
- **THEN** 系统 SHALL 通过社区页内容 Banner 或后续社区相关展示区域承载该入口
- **AND** 系统 SHALL NOT 要求普通用户通过独立漫画 tab 或独立漫画空壳页访问该内容

#### Scenario: 未来功能尚未实现

- **WHEN** 注册表在实现前包含赛季排行、复杂小游戏、称号商店或皮肤商店等未来功能时
- **THEN** 该入口配置为 `locked`、`coming_soon` 或 `disabled`，并且不暴露可用业务能力

### Requirement: 公开功能入口 API

系统 SHALL 提供普通用户可访问的功能入口读取 API，用于按展示区域获取公开功能入口配置。

#### Scenario: 按展示区域请求功能入口

- **WHEN** 小程序端请求合法展示区域的功能入口 API
- **THEN** API 返回与 `FeatureRegistryResponse` 等价的响应结构，包含请求的 `placement` 和对应 `entries`

#### Scenario: API 复用共享契约

- **WHEN** API 构造功能入口响应时
- **THEN** API 使用项目共享包中的功能入口 key、状态、展示区域和公开响应类型，而不是在 API 层重新定义一套契约

#### Scenario: 首页快捷入口 API 响应

- **WHEN** 小程序端请求 `home_quick_entry` 的功能入口 API
- **THEN** API 返回配置在 `home_quick_entry` 的公开入口，并按展示排序稳定排列

### Requirement: API placement validation

系统 SHALL 校验功能入口 API 请求中的 `placement` 参数。

#### Scenario: 合法 placement 被接受

- **WHEN** 请求中的 `placement` 属于共享 `FeaturePlacement` 枚举
- **THEN** API 使用该展示区域查询并返回功能入口响应

#### Scenario: 非法 placement 被拒绝

- **WHEN** 请求中的 `placement` 不属于共享 `FeaturePlacement` 枚举
- **THEN** API 返回客户端错误，并且不返回任意功能入口列表

### Requirement: API public response boundary

系统 SHALL 确保功能入口 API 只返回普通用户可见的公开字段。

#### Scenario: hidden 条目不出现在 API 响应

- **WHEN** 功能注册表中存在 `hidden` 状态条目
- **THEN** 功能入口 API 不返回该条目

#### Scenario: 内部字段不出现在 API 响应

- **WHEN** 功能注册表条目包含内部路由、内部备注、灰度控制或审核字段
- **THEN** 功能入口 API 响应不包含这些字段

#### Scenario: 非开放入口不暴露可导航路由

- **WHEN** 功能入口状态不是 `enabled`
- **THEN** 功能入口 API 响应不返回可用于导航的 `publicRoute`

### Requirement: Mini program feature registry client

小程序端 SHALL 通过统一客户端方法读取功能入口配置，并保留本地默认配置回退。

#### Scenario: 远端 API 可用

- **WHEN** 功能入口 API 成功返回合法响应
- **THEN** 小程序端使用 API 响应渲染对应展示区域的功能入口

#### Scenario: 远端 API 不可用

- **WHEN** 功能入口 API 请求失败、超时或返回不可用响应
- **THEN** 小程序端回退到本地默认功能入口配置，并保持入口区域可渲染

#### Scenario: 页面不直接处理数据来源

- **WHEN** 首页或其他页面需要读取功能入口
- **THEN** 页面通过统一读取方法获取 `FeatureRegistryResponse`，而不是直接散落远端请求和本地回退逻辑

### Requirement: Feature registry API verification

系统 SHALL 验证功能入口 API 的成功响应、错误响应、过滤规则和前端回退行为。

#### Scenario: API 响应排序被验证

- **WHEN** 同一展示区域存在多个功能入口
- **THEN** 验证覆盖 API 按 `displayOrder` 排序，并在排序相同时按 `featureKey` 稳定排序

#### Scenario: API 字段过滤被验证

- **WHEN** 注册表包含 `hidden` 条目或内部管理字段
- **THEN** 验证覆盖 API 响应不会暴露这些条目或字段

#### Scenario: 小程序回退被验证

- **WHEN** 远端功能入口 API 不可用
- **THEN** 验证覆盖小程序端统一读取方法会回退到本地默认配置

### Requirement: 薪资时间入口路由

默认功能注册表 SHALL 将 `salary_work_time_settings` 配置为可导航到工作档案设置页的已开放入口。

#### Scenario: 首页薪资时间入口导航

- **WHEN** 小程序端渲染首页快捷入口中的 `salary_work_time_settings`
- **THEN** 该入口 SHALL 保持 `enabled` 状态
- **AND** 该入口的公开路由 SHALL 指向工作档案设置页

#### Scenario: 入口不再导航到个人中心占位

- **WHEN** 用户点击 `salary_work_time_settings` 入口
- **THEN** 小程序端 SHALL 导航到薪资和上班时间设置体验
- **AND** 小程序端 SHALL NOT 仅导航到个人中心占位页

### Requirement: 个人中心常用入口收口

小程序个人中心 SHALL 展示真实可用的常用入口，并隐藏未定义完整玩法的未来态入口。

#### Scenario: 个人中心展示常用入口

- **WHEN** 用户打开“我的”页
- **THEN** 页面 SHALL 展示 `我的角色`、`工作设置`、`我的帖子`、`收藏帖子`、`论坛消息` 和 `生存账本`
- **AND** 每个入口 SHALL 具备语义 icon、标题和可导航目标或可解释阻断提示

#### Scenario: 成就和未来态入口隐藏

- **WHEN** 成就系统、称号商店、皮肤商店、赛季排行或复杂小游戏尚未定义完整玩法
- **THEN** 这些入口 SHALL NOT 出现在个人中心常用入口中
- **AND** 功能注册表 SHALL NOT 返回它们作为普通用户可点击的 `enabled` 入口

### Requirement: 隐者日报文章化入口路由

默认功能注册表 SHALL 将 `daily_content_feed` 配置为进入隐者日报文章化体验的已开放入口。

#### Scenario: 首页日报入口导航到日报首页

- **WHEN** 小程序端渲染首页快捷入口中的 `daily_content_feed`
- **THEN** 该入口 SHALL 保持 `enabled` 状态
- **AND** 该入口的公开路由 SHALL 指向隐者日报首页

#### Scenario: 日报内部路由不进入功能注册表

- **WHEN** 小程序从日报首页进入栏目列表或文章详情
- **THEN** 小程序 SHALL 使用日报内部页面路由和资源 ID
- **AND** 系统 SHALL NOT 要求为每个日报栏目或文章创建独立 feature key

#### Scenario: 入口禁用时阻断日报体验

- **WHEN** `daily_content_feed` 被配置为 `locked`、`coming_soon`、`disabled` 或 `hidden`
- **THEN** 小程序 SHALL 按功能注册表状态阻断或隐藏入口
- **AND** 小程序 SHALL NOT 通过首页快捷入口导航到日报文章化体验

### Requirement: 漫画 IP 入口非主导航边界

功能注册表 SHALL 保留漫画/IP 内容后续扩展空间，但 SHALL 防止未完成的漫画空壳作为默认公开主入口暴露。

#### Scenario: 默认入口不暴露漫画空壳路由

- **WHEN** 小程序读取默认公开功能入口配置
- **THEN** `comic_ip_content` SHALL NOT 以 `enabled` 状态返回指向 `/pages/comics/index` 的公开路由
- **AND** 普通用户 SHALL NOT 从首页快捷入口、个人中心常用入口或底部主导航进入独立漫画空壳

#### Scenario: 后续恢复漫画能力

- **WHEN** 后续 change 明确实现漫画/IP 内容列表、详情或解锁流程
- **THEN** 系统 SHALL 在新的规格中重新定义 `comic_ip_content` 的展示区域、状态和公开路由
- **AND** 系统 SHALL NOT 仅通过恢复旧 tab 配置表达完整漫画能力

### Requirement: 补给铺入口开放

默认功能注册表 SHALL 支持将 `supply_center` 作为第一期可开放入口，并通过公开路由进入补给铺体验。

#### Scenario: 首页展示补给铺入口

- **WHEN** `supply_center` 被配置为 `enabled` 且位于 `home_quick_entry`
- **THEN** 小程序首页快捷入口 SHALL 展示补给铺入口
- **AND** 用户点击后 SHALL 导航到补给铺页面

#### Scenario: 补给铺入口公开路由

- **WHEN** 功能注册表返回 `supply_center` 已开放入口
- **THEN** 该入口 SHALL 包含指向补给铺页面的公开路由
- **AND** 该公开路由 SHALL NOT 指向个人中心占位页、漫画空壳页或生存账本详情页

#### Scenario: 补给铺关闭时阻断导航

- **WHEN** `supply_center` 被配置为 `locked`、`coming_soon`、`disabled` 或 `hidden`
- **THEN** 小程序 SHALL 按功能注册表状态阻断或隐藏入口
- **AND** 小程序 SHALL NOT 通过硬编码入口绕过功能注册表进入补给铺

### Requirement: 补给铺入口文案

功能注册表 SHALL 使用补给铺用户语义展示入口，不得将 CPS、聚推客或佣金作为普通用户入口文案。

#### Scenario: 入口展示用户语义

- **WHEN** 小程序渲染 `supply_center` 功能入口
- **THEN** 入口标题 SHALL 使用 `补给铺` 或等价用户可理解文案
- **AND** 入口描述 SHALL 表达外卖、咖啡茶饮或通勤补给语义

#### Scenario: 入口不展示内部商业字段

- **WHEN** 功能入口 API 返回 `supply_center`
- **THEN** 响应 SHALL NOT 包含聚推客、CPS 平台、佣金、推广者 ID、订单同步策略或内部活动源字段

### Requirement: 首页快捷入口收口

默认功能注册表和小程序首页 SHALL 控制首页核心快捷入口数量和语义，避免低价值、重复或未实现入口抢占首页。

#### Scenario: 首页核心入口展示

- **WHEN** 小程序渲染首页核心快捷入口
- **THEN** 首页 SHALL 优先展示工作设置、隐者日报、社区和补给相关真实可用入口
- **AND** 首页 SHALL NOT 同时将隐藏模式作为独立功能入口展示

#### Scenario: 补给入口不重复抢占

- **WHEN** 首页已经通过核心卡片或今日生存消耗区域展示补给入口
- **THEN** 首页 MAY 从快捷入口中移除重复补给入口
- **AND** 用户 SHALL 仍可从首页进入补给铺

### Requirement: 摸鱼模式功能入口

默认功能注册表 SHALL 支持 `stealth_workbench_mode` 功能入口，并通过公开路由进入摸鱼模式工作台。

#### Scenario: 首页展示摸鱼模式入口

- **WHEN** `stealth_workbench_mode` 被配置为 `enabled` 且位于 `home_quick_entry` 或等价首页入口展示区域
- **THEN** 小程序首页 SHALL 展示摸鱼模式入口
- **AND** 用户点击后 SHALL 导航到摸鱼模式工作台首页

#### Scenario: 摸鱼模式入口公开路由

- **WHEN** 功能注册表返回 `stealth_workbench_mode` 已开放入口
- **THEN** 该入口 SHALL 包含指向摸鱼模式工作台首页的公开路由
- **AND** 该公开路由 SHALL NOT 指向普通社区页、普通日报页、个人中心占位页、漫画空壳页或补给铺页面

#### Scenario: 摸鱼模式关闭时阻断导航

- **WHEN** `stealth_workbench_mode` 被配置为 `locked`、`coming_soon`、`disabled` 或 `hidden`
- **THEN** 小程序 SHALL 按功能注册表状态阻断或隐藏入口
- **AND** 小程序 SHALL NOT 通过硬编码首页按钮绕过功能注册表进入摸鱼模式

#### Scenario: 摸鱼模式入口文案不暴露内部实现

- **WHEN** 小程序渲染 `stealth_workbench_mode` 功能入口
- **THEN** 入口标题 SHALL 使用 `摸鱼模式`、`隐身工作台`、`工作表模式` 或等价用户语义
- **AND** 入口描述 SHALL 表达低暴露办公浏览或工作表伪装语义
- **AND** 入口 SHALL NOT 暴露内部页面路径、开发态文案、审核字段或未发布路由
