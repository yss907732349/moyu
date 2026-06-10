## ADDED Requirements

### Requirement: 社区发帖页承接日报参悟引用
社区发帖页 SHALL 支持承接来自隐者日报首页的 `daily_reflection` 引用草稿，展示引用来源，并在提交时将引用快照传给社区发帖能力。

#### Scenario: 承接今日参悟引用草稿
- **WHEN** 社区发帖页通过页面参数、本地草稿或统一客户端状态接收到 `daily_reflection` 引用草稿
- **THEN** 页面 SHALL 展示来源类型、业务日期、参悟正文和引用提示
- **AND** 页面 SHALL 允许用户补充帖子标题、正文、分区和图片

#### Scenario: 提交带今日参悟引用的帖子
- **WHEN** 已登录且已创建隐者档案的用户提交带 `daily_reflection` 引用草稿的社区帖子
- **THEN** API SHALL 按社区发帖规则创建帖子
- **AND** 帖子 SHALL 保存日报 ID、业务日期、参悟正文和引用提示的公开快照
- **AND** 帖子 SHALL 保持 `pending` 或社区规则决定的非公开初始状态，不因引用官方日报而自动公开

#### Scenario: 公开帖子展示今日参悟引用
- **WHEN** 带 `daily_reflection` 引用的社区帖子通过审核并进入公开列表或详情
- **THEN** 公开响应 SHALL 可以展示 `引用今日参悟`、业务日期、参悟正文和跳回日报公开资源的标识
- **AND** 公开响应 SHALL NOT 暴露日报后台审核备注、AI 原始 prompt、内部风险标签或供应商配置

#### Scenario: 拒绝无效今日参悟引用
- **WHEN** 用户提交的 `daily_reflection` 引用指向不存在、未发布或不可公开访问的日报参悟
- **THEN** API SHALL 拒绝创建该引用帖子
- **AND** API SHALL 返回客户端可识别的引用不可用提示
