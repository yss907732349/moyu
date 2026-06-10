## ADDED Requirements

### Requirement: 日报多来源引用发帖

社区发帖能力 SHALL 支持从隐者日报每日参悟和日报文章携带引用快照创建待审核帖子。

#### Scenario: 创建带每日参悟引用的帖子

- **WHEN** 已登录且已创建隐者档案的用户从 `今日参悟` 提交社区帖子
- **THEN** API SHALL 按社区发帖规则创建帖子
- **AND** 帖子 SHALL 保存来源类型 `daily_reflection`、日报 ID、业务日期、参悟正文和引用提示的公开快照

#### Scenario: 创建带日报文章引用的帖子

- **WHEN** 已登录且已创建隐者档案的用户从已发布日报文章提交社区帖子
- **THEN** API SHALL 按社区发帖规则创建帖子
- **AND** 帖子 SHALL 保存来源类型 `daily_article`、日报 ID、文章 ID、栏目 key、引用标题和引用摘要的公开快照

#### Scenario: 日报引用不绕过正式审核

- **WHEN** 用户提交带日报引用的社区帖子
- **THEN** API SHALL 创建状态为 `pending` 的帖子
- **AND** API SHALL NOT 因引用来源为官方日报而直接公开帖子

#### Scenario: 公开展示日报引用

- **WHEN** 带日报引用的社区帖子通过人工审核并公开展示
- **THEN** 公开响应 SHALL 可以展示日报引用类型、标题或参悟正文、摘要、栏目名称和跳转到日报公开资源的标识
- **AND** 公开响应 SHALL NOT 暴露日报后台审核备注、AI 原始 prompt、内部风险标签或供应商配置

#### Scenario: 非公开日报资源不得被引用

- **WHEN** 用户尝试引用未发布、已归档、已驳回或不可公开访问的日报资源创建社区帖子
- **THEN** API SHALL 拒绝创建该引用帖子
