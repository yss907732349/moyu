## ADDED Requirements

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
