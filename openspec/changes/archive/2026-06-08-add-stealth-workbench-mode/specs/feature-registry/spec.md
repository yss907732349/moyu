## ADDED Requirements

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
