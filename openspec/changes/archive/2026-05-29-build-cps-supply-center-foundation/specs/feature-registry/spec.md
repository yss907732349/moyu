## ADDED Requirements

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
