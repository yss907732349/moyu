## ADDED Requirements

### Requirement: 日报公开响应文章化

隐者日报公开响应 SHALL 从三板块正文直出调整为文章化结构，包含首页轻量摘要、每日参悟、栏目入口和文章列表/详情资源。

#### Scenario: 读取日报摘要

- **WHEN** 小程序读取当前已发布日报摘要
- **THEN** API SHALL 返回业务日期、标题、首页摘要、每日参悟和两个栏目入口摘要
- **AND** API SHALL NOT 在摘要响应中返回两个栏目所有文章正文

#### Scenario: 读取日报文章资源

- **WHEN** 小程序读取栏目列表或文章详情
- **THEN** API SHALL 只返回已发布日报下对应栏目的公开文章字段
- **AND** API SHALL NOT 返回后台草稿、审核备注、AI 原始 prompt、内部风险标签或供应商配置

### Requirement: 旧内容项迁移边界

系统 SHALL 为现有三板块内容项提供迁移或兼容策略，使已发布测试日报可以进入新的文章化展示结构。

#### Scenario: 迁移今日参悟

- **WHEN** 系统遇到旧结构中的 `daily_reflection` 内容项
- **THEN** 系统 SHALL 将其迁移或映射为每日参悟正文
- **AND** 系统 SHALL NOT 将其作为栏目文章公开展示

#### Scenario: 迁移两大栏目内容

- **WHEN** 系统遇到旧结构中的 `world_intel` 或 `absurd_casefile` 内容项
- **THEN** 系统 SHALL 将其迁移或映射为对应栏目的文章
- **AND** 单个栏目公开文章数量 SHALL NOT 超过 10 篇
