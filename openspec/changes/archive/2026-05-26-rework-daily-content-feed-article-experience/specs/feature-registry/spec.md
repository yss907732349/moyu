## ADDED Requirements

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
