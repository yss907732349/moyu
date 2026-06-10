## ADDED Requirements

### Requirement: 微信登录第一版

系统 SHALL 支持微信小程序登录第一版，用于创建或识别应用内用户，并为本人资料、签到和后续本人接口提供登录态。

#### Scenario: 新用户通过微信登录

- **WHEN** 小程序端提交有效微信登录凭证
- **THEN** API SHALL 通过服务端微信登录流程识别微信用户
- **AND** 系统 SHALL 创建应用内用户记录
- **AND** API SHALL 返回应用自己的登录态和本人用户标识

#### Scenario: 已有用户再次登录

- **WHEN** 已绑定微信身份的用户再次提交有效微信登录凭证
- **THEN** API SHALL 识别同一个应用内用户
- **AND** API SHALL 返回可用于后续 `/me/*` 请求的应用登录态

#### Scenario: 微信登录失败

- **WHEN** 微信登录凭证无效、过期或微信服务返回错误
- **THEN** API SHALL 返回客户端可识别的登录失败响应
- **AND** 系统 SHALL NOT 创建未绑定有效微信身份的真实用户资料

### Requirement: 本人上下文使用登录态优先

系统 SHALL 在本人接口中优先通过应用登录态识别当前用户，并仅在明确开发环境中允许临时本人上下文 fallback。

#### Scenario: 登录态访问本人接口

- **WHEN** 请求携带有效应用登录态访问 `/me/profile` 或 `/me/daily-checkin`
- **THEN** API SHALL 使用该登录态对应的应用内用户作为当前用户

#### Scenario: 未登录访问本人接口

- **WHEN** 请求未携带有效应用登录态且不处于允许 fallback 的开发环境
- **THEN** API SHALL 拒绝访问本人资料和签到接口

#### Scenario: 开发 fallback 被明确标记

- **WHEN** 本地开发环境使用临时本人上下文 fallback
- **THEN** 系统 SHALL 将该来源明确标记为 `temporary-dev-placeholder`
- **AND** 该机制 SHALL NOT 表达为真实微信登录能力

### Requirement: 用户成长资料契约

系统 SHALL 为每个应用内用户维护一份当前有效的用户成长资料，包含职业类型、阵营、显示名、头像 key、等级、经验、隐币、能量、连续签到、称号和徽章展示字段。

#### Scenario: 资料字段可供跨端复用

- **WHEN** 小程序端或 API 需要读取用户成长资料
- **THEN** 系统 SHALL 使用共享包中定义的用户成长资料类型、职业类型、阵营类型和响应契约

#### Scenario: 默认成长资料初始化

- **WHEN** 系统创建用户成长资料
- **THEN** 系统 SHALL 初始化等级、经验、隐币、能量、连续签到、称号 key、徽章 key 和头像 key
- **AND** 初始化结果 SHALL 可转换为小程序首页或个人中心可消费的资料快照

#### Scenario: 敏感边界

- **WHEN** 用户成长资料被社区、功能入口或公开资料引用
- **THEN** 系统 SHALL NOT 默认暴露薪资、工作时间或工作档案敏感字段

### Requirement: 首次创建隐者档案

小程序端 SHALL 在用户首次打开“我的”且当前用户没有成长资料时，引导用户创建隐者档案。

#### Scenario: 未创建资料打开我的页面

- **WHEN** 已登录用户打开“我的”且 API 返回资料未创建状态
- **THEN** 小程序端 SHALL 展示创建隐者档案流程
- **AND** 小程序端 SHALL 要求用户选择职业类型后才能创建资料

#### Scenario: 已创建资料打开我的页面

- **WHEN** 已登录用户打开“我的”且已存在有效成长资料
- **THEN** 小程序端 SHALL 展示用户成长资料、资源统计、功能宫格、成就占位、菜单区域和个人场景卡

#### Scenario: 未登录打开我的页面

- **WHEN** 用户打开“我的”但没有有效应用登录态
- **THEN** 小程序端 SHALL 展示微信登录入口
- **AND** 小程序端 SHALL NOT 在未登录状态下创建真实成长资料

### Requirement: 职业类型决定初始阵营

系统 SHALL 根据用户首次创建隐者档案时选择的职业类型分配初始阵营。

#### Scenario: 技术类职业分配键影

- **WHEN** 用户选择技术开发、测试、运维或等价技术类职业类型
- **THEN** 系统 SHALL 将初始阵营分配为键影

#### Scenario: 创意运营类职业分配水遁

- **WHEN** 用户选择设计、运营、内容、市场或等价创意运营类职业类型
- **THEN** 系统 SHALL 将初始阵营分配为水遁

#### Scenario: 产品策略类职业分配策天

- **WHEN** 用户选择产品、项目、管理、咨询或等价产品策略类职业类型
- **THEN** 系统 SHALL 将初始阵营分配为策天

#### Scenario: 商务支持类职业分配游侠

- **WHEN** 用户选择销售、客服、行政、其他或等价商务支持类职业类型
- **THEN** 系统 SHALL 将初始阵营分配为游侠

### Requirement: 默认昵称和默认头像

系统 SHALL 在首次创建隐者档案时生成阵营默认昵称并分配阵营默认头像 key。

#### Scenario: 自动生成默认昵称

- **WHEN** 用户完成职业类型选择并创建隐者档案
- **THEN** 系统 SHALL 生成包含阵营名和随机数字后缀的默认昵称
- **AND** 默认昵称 SHALL 可用于个人中心资料卡展示

#### Scenario: 自动分配默认头像 key

- **WHEN** 系统创建用户成长资料
- **THEN** 系统 SHALL 根据用户阵营分配默认头像 key
- **AND** 小程序端 SHALL 可在真实头像资产未完成时使用该 key 展示占位或默认阵营头像

### Requirement: 本人资料 API

系统 SHALL 提供本人用户成长资料 API，用于读取和创建当前登录用户的成长资料。

#### Scenario: 读取已有资料

- **WHEN** 已登录用户请求 `GET /me/profile` 且已创建成长资料
- **THEN** API SHALL 返回包含用户成长资料快照的成功响应

#### Scenario: 读取未创建资料状态

- **WHEN** 已登录用户请求 `GET /me/profile` 但尚未创建成长资料
- **THEN** API SHALL 返回资料未创建状态
- **AND** API SHALL NOT 返回静态演示资料作为真实资料

#### Scenario: 创建本人资料

- **WHEN** 已登录用户提交合法职业类型创建本人资料
- **THEN** API SHALL 创建当前用户的成长资料
- **AND** API SHALL 返回创建后的用户成长资料快照

#### Scenario: 重复创建本人资料

- **WHEN** 已创建成长资料的用户再次提交创建资料请求
- **THEN** API SHALL NOT 创建第二份当前有效成长资料
- **AND** API SHALL 返回可识别的重复创建结果或当前已有资料

### Requirement: 小程序资料快照缓存

小程序端 SHALL 缓存合法的本人用户成长资料快照，用于“我的”页面首屏展示和 API 不可用时的降级体验。

#### Scenario: 本地快照首屏展示

- **WHEN** 用户打开“我的”且本地存在合法 `moyuxia.userProfileSnapshot`
- **THEN** 小程序端 SHALL 可以先基于本地快照展示资料
- **AND** 小程序端 SHALL 在后台同步本人资料 API

#### Scenario: API 同步成功更新缓存

- **WHEN** 本人资料 API 返回合法成长资料快照
- **THEN** 小程序端 SHALL 更新 `moyuxia.userProfileSnapshot`
- **AND** “我的”页面 SHALL 使用最新快照刷新展示

#### Scenario: 无缓存且 API 不可用

- **WHEN** 用户打开“我的”且没有本地合法快照，同时本人资料 API 不可用
- **THEN** 小程序端 SHALL 展示可恢复的错误或重试状态
- **AND** 小程序端 SHALL NOT 展示静态演示资料作为真实资料

### Requirement: 我的页面成长资料展示

小程序“我的”页面 SHALL 使用真实用户成长资料或合法本地快照渲染资料卡、等级经验、资源统计、签到状态、称号和徽章占位。

#### Scenario: 展示基础身份

- **WHEN** “我的”页面拥有合法成长资料快照
- **THEN** 页面 SHALL 展示用户默认昵称、阵营、等级、经验进度、称号和头像

#### Scenario: 展示成长资源

- **WHEN** “我的”页面拥有合法成长资料快照
- **THEN** 页面 SHALL 展示隐币、能量和连续签到天数

#### Scenario: 展示占位称号和徽章

- **WHEN** 用户尚未拥有真实称号商店或徽章解锁能力
- **THEN** 页面 SHALL 仅展示当前称号、默认徽章或占位徽章
- **AND** 页面 SHALL NOT 表达称号购买、徽章商店或复杂解锁能力已经开放

### Requirement: 每日签到

系统 SHALL 支持当前用户每日签到第一版，同一用户同一业务日期只能领取一次签到奖励。

#### Scenario: 当日首次签到

- **WHEN** 已登录且已创建成长资料的用户在当日首次请求签到
- **THEN** 系统 SHALL 发放第一版签到奖励
- **AND** 系统 SHALL 更新经验、隐币、能量、连续签到天数和最后签到日期
- **AND** API SHALL 返回更新后的用户成长资料快照和签到结果

#### Scenario: 当日重复签到

- **WHEN** 用户在同一业务日期重复请求签到
- **THEN** 系统 SHALL NOT 重复发放奖励
- **AND** API SHALL 返回已签到状态和当前用户成长资料快照

#### Scenario: 未创建资料签到

- **WHEN** 已登录但未创建成长资料的用户请求签到
- **THEN** API SHALL 拒绝签到
- **AND** API SHALL 提示需要先创建隐者档案

### Requirement: 等级经验第一版

系统 SHALL 在签到奖励或后续成长事件增加经验后，按第一版等级规则更新用户等级和经验进度。

#### Scenario: 经验未达到升级阈值

- **WHEN** 用户获得经验但总经验未达到下一等级阈值
- **THEN** 系统 SHALL 保持当前等级
- **AND** 系统 SHALL 返回当前经验进度

#### Scenario: 经验达到升级阈值

- **WHEN** 用户获得经验后达到或超过下一等级阈值
- **THEN** 系统 SHALL 更新用户等级
- **AND** 系统 SHALL 返回新的等级和经验进度

#### Scenario: 等级规则可复用

- **WHEN** API 或小程序端需要展示等级经验进度
- **THEN** 系统 SHALL 复用共享包中的等级规则或等级快照契约

### Requirement: 微信登录配置安全

系统 SHALL 通过环境变量或安全配置读取微信小程序登录所需密钥，并 SHALL NOT 在代码、样例或文档中写入真实密钥。

#### Scenario: 配置缺失

- **WHEN** 微信登录所需配置缺失
- **THEN** API SHALL 返回可识别的配置错误或使用明确允许的开发 fallback
- **AND** 系统 SHALL NOT 使用硬编码真实密钥

#### Scenario: 环境变量样例

- **WHEN** 项目提供微信登录相关环境变量样例
- **THEN** 样例 SHALL 使用占位值
- **AND** 样例 SHALL NOT 包含真实微信密钥
