## ADDED Requirements

### Requirement: 个人中心功能宫格消费功能注册表

小程序个人中心功能宫格 SHALL 通过 `profile_feature_grid` 展示区域读取功能入口配置，并使用统一功能入口状态控制导航和提示。

#### Scenario: 读取个人中心宫格入口

- **WHEN** 用户打开“我的”页面且功能宫格需要渲染
- **THEN** 小程序端 SHALL 通过统一 feature registry 客户端读取 `profile_feature_grid` 入口
- **AND** 页面 SHALL 按功能注册表返回的展示排序渲染入口

#### Scenario: 远端配置不可用

- **WHEN** `profile_feature_grid` 远端功能入口 API 请求失败、超时或返回非法响应
- **THEN** 小程序端 SHALL 回退到本地默认功能注册表
- **AND** 页面 SHALL 保持个人中心功能宫格可渲染

#### Scenario: 已开放个人中心入口导航

- **WHEN** 用户点击 `profile_feature_grid` 中带有公开路由的 `enabled` 入口
- **THEN** 小程序端 SHALL 导航到该入口配置的公开路由

#### Scenario: 非开放个人中心入口阻断

- **WHEN** 用户点击 `profile_feature_grid` 中 `locked`、`coming_soon` 或 `disabled` 状态的入口
- **THEN** 小程序端 SHALL 阻止导航
- **AND** 小程序端 SHALL 展示功能注册表配置的解锁、敬请期待或不可用提示

#### Scenario: 页面不维护静态宫格事实来源

- **WHEN** 个人中心页面实现真实用户成长资料
- **THEN** 页面 SHALL NOT 使用页面内静态数组作为功能宫格的事实来源
- **AND** 页面 SHALL 以 feature registry 响应作为入口标题、图标、状态、排序和路由来源
