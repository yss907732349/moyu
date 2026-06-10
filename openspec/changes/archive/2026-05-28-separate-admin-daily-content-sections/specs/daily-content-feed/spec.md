## ADDED Requirements

### Requirement: 日报板块级后台保存

日报后台 SHALL 支持按 `sectionKey` 新建并保存 `今日参悟`、`大陆新闻` 或 `离谱卷宗` 的单板块内容记录，并 SHALL 保证保存一个板块时不覆盖、删除或归档其他板块记录。

#### Scenario: 单独保存今日参悟

- **WHEN** 授权后台用户只保存 `daily_reflection` 板块
- **THEN** API SHALL 只更新该 `daily_reflection` 板块记录
- **AND** API SHALL 保持 `world_intel` 和 `absurd_casefile` 的草稿或已发布记录不变

#### Scenario: 单独保存大陆新闻

- **WHEN** 授权后台用户只保存 `world_intel` 板块
- **THEN** API SHALL 只更新该 `world_intel` 板块记录的摘要、插画、文章、来源字段和排序
- **AND** API SHALL 保持 `daily_reflection` 和 `absurd_casefile` 的草稿或已发布记录不变

#### Scenario: 单独保存离谱卷宗

- **WHEN** 授权后台用户只保存 `absurd_casefile` 板块
- **THEN** API SHALL 只更新该 `absurd_casefile` 板块记录的摘要、插画、文章、来源字段和排序
- **AND** API SHALL 保持 `daily_reflection` 和 `world_intel` 的草稿或已发布记录不变

#### Scenario: 非法板块 key

- **WHEN** 后台请求使用不属于日报三板块的 `sectionKey`
- **THEN** API SHALL 拒绝保存
- **AND** API SHALL NOT 修改任何日报草稿内容

### Requirement: 日报板块级发布检查

日报后台 SHALL 支持按板块执行发布前校验，并 SHALL 只用目标板块的阻断项判断该板块是否可发布。

#### Scenario: 当前板块可发布

- **WHEN** 后台用户查看 `world_intel` 的板块级发布检查
- **THEN** API SHALL 返回 `world_intel` 相关的阻断项和提示项
- **AND** `daily_reflection` 或 `absurd_casefile` 的问题 SHALL NOT 阻止 `world_intel` 的板块级发布判断

#### Scenario: 外部采编来源缺失

- **WHEN** 目标板块内存在标记为外部采编但缺少来源 URL、来源标题或来源站点的文章
- **THEN** 板块级发布检查 SHALL 返回阻断项
- **AND** 后台 SHALL 不允许发布该板块

#### Scenario: 原创文章缺少外部来源

- **WHEN** 目标板块内文章标记为原创内容且未填写外部来源 URL、来源标题或来源站点
- **THEN** 板块级发布检查 SHALL NOT 因缺少外部来源阻止发布
- **AND** 如果原创文章填写了来源 URL，系统 SHALL 校验 URL 格式

### Requirement: 日报板块级预览

日报后台 SHALL 支持按板块预览当前草稿的公开效果，并 SHALL 不改变日报状态。

#### Scenario: 预览今日参悟

- **WHEN** 授权后台用户请求预览 `daily_reflection`
- **THEN** API SHALL 返回与小程序今日参悟公开展示一致的预览字段
- **AND** API SHALL 标记该响应为预览用途

#### Scenario: 预览文章栏目

- **WHEN** 授权后台用户请求预览 `world_intel` 或 `absurd_casefile`
- **THEN** API SHALL 返回该栏目入口摘要、插画和文章列表预览
- **AND** API SHALL NOT 返回其他板块的正文或文章列表作为当前板块预览内容

#### Scenario: 预览栏目文章

- **WHEN** 授权后台用户请求预览某篇日报文章
- **THEN** API SHALL 返回该文章与小程序文章详情一致的标题、摘要、正文、来源和配图字段
- **AND** API SHALL NOT 改变文章或日报发布状态

### Requirement: 日报板块级发布

日报后台 SHALL 支持单独发布 `今日参悟`、`大陆新闻` 或 `离谱卷宗` 的板块记录，并 SHALL 不要求其他未发布板块同时满足发布条件。

#### Scenario: 发布单个板块

- **WHEN** 授权后台用户发布某一个日报板块
- **THEN** 系统 SHALL 在发布前保存并校验该板块的最新内容
- **AND** 校验通过后系统 SHALL 公开该板块记录
- **AND** 系统 SHALL NOT 因其他板块为空、来源缺失或草稿未完成而拒绝本次板块发布
- **AND** 系统 SHALL NOT 清空、删除或归档其他板块记录

#### Scenario: 单板块发布失败

- **WHEN** 目标板块未通过板块级发布检查
- **THEN** 系统 SHALL 拒绝公开该板块
- **AND** 系统 SHALL 保持已有公开日报内容不被本次失败操作覆盖

#### Scenario: 公开侧组合最新板块

- **WHEN** 小程序读取当前日报摘要
- **THEN** API SHALL 分别选择 `daily_reflection`、`world_intel` 和 `absurd_casefile` 的最新已发布记录组合公开响应
- **AND** 任一板块未发布 SHALL NOT 阻止其他已发布板块公开展示

#### Scenario: 定时发布单个板块

- **WHEN** 后台用户为某个日报板块记录设置晚于当前时间的定时发布时间
- **THEN** 系统 SHALL 只校验并定时该板块记录
- **AND** 到点发布 SHALL NOT 要求其他板块同时满足发布条件
