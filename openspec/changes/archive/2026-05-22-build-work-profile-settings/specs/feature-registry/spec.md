## ADDED Requirements

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
