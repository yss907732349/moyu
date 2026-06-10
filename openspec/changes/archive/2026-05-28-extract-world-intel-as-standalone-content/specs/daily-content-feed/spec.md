## MODIFIED Requirements

### Requirement: 日报公开响应文章化

隐者日报公开响应 SHALL 从三板块正文直出调整为文章化结构，包含首页轻量摘要、每日参悟、大陆新闻入口、离谱卷宗栏目入口和文章列表/详情资源。大陆新闻入口 SHALL 指向独立大陆新闻内容库，而不是返回某个日报 `world_intel` 板块内的文章列表。

#### Scenario: 读取日报摘要

- **WHEN** 小程序读取当前已发布日报摘要
- **THEN** API SHALL 返回业务日期、标题、首页摘要、每日参悟、大陆新闻入口摘要和离谱卷宗入口摘要
- **AND** API SHALL NOT 在摘要响应中返回大陆新闻或离谱卷宗所有文章正文

#### Scenario: 读取日报文章资源

- **WHEN** 小程序读取日报栏目列表或文章详情
- **THEN** API SHALL 只返回已发布日报下对应栏目的公开文章字段
- **AND** 大陆新闻列表和详情 SHALL 使用大陆新闻独立内容库资源
- **AND** API SHALL NOT 返回后台草稿、审核备注、AI 原始 prompt、内部风险标签或供应商配置

### Requirement: 旧内容项迁移边界

系统 SHALL 为现有三板块内容项提供迁移或兼容策略，使已发布测试日报可以进入新的文章化展示结构。大陆新闻 `world_intel` 内容项 SHALL 迁移或兼容为独立大陆新闻文章，不再受单个日报栏目 10 篇公开上限约束。

#### Scenario: 迁移今日参悟

- **WHEN** 系统遇到旧结构中的 `daily_reflection` 内容项
- **THEN** 系统 SHALL 将其迁移或映射为每日参悟正文
- **AND** 系统 SHALL NOT 将其作为栏目文章公开展示

#### Scenario: 迁移大陆新闻内容

- **WHEN** 系统遇到旧结构中的 `world_intel` 内容项
- **THEN** 系统 SHALL 将其迁移或映射为独立大陆新闻文章
- **AND** 公开大陆新闻文章数量 SHALL NOT 受单个日报栏目 10 篇上限约束

#### Scenario: 迁移离谱卷宗内容

- **WHEN** 系统遇到旧结构中的 `absurd_casefile` 内容项
- **THEN** 系统 SHALL 将其迁移或映射为离谱卷宗栏目的文章
- **AND** 单个离谱卷宗栏目公开文章数量 SHALL NOT 超过 10 篇

### Requirement: 日报人工采编

隐者日报 SHALL 由后台运营人工创建、编辑、预览和发布，不再依赖第三方来源自动采集。后台编辑能力 SHALL 支持今日参悟、离谱卷宗栏目文章、来源字段、配图字段、文章增删和排序的完整运营流程。大陆新闻 SHALL 从日报人工采编中拆出，由独立大陆新闻后台管理能力承载。后台第一阶段 SHALL 使用轻量发布流程，允许运营在发布前校验通过后直接立即发布或设置定时发布，不强制经过提交审核和审核通过步骤。

#### Scenario: 人工创建日报草稿

- **WHEN** 授权后台用户创建隐者日报草稿
- **THEN** 系统 SHALL 允许手动填写业务日期、日报标题、首页摘要、今日参悟、离谱卷宗文章标题、摘要、正文和来源字段
- **AND** 来源字段 SHALL 包含来源类型、可选的来源说明、来源站点、来源标题、来源 URL、配图 URL 和发布时间
- **AND** 系统 SHALL NOT 要求在日报草稿中维护大陆新闻文章列表

#### Scenario: 后台增删栏目文章

- **WHEN** 后台编辑离谱卷宗
- **THEN** 系统 SHALL 允许运营新增、删除和编辑栏目文章
- **AND** 系统 SHALL 保持离谱卷宗最多 10 篇文章

#### Scenario: 后台调整栏目文章顺序

- **WHEN** 后台调整离谱卷宗文章排序
- **THEN** 系统 SHALL 保存排序结果
- **AND** 公开栏目列表 SHALL 按保存后的顺序展示

#### Scenario: 日报栏目数量

- **WHEN** 后台编辑日报内容
- **THEN** 离谱卷宗 SHALL 最多保存 10 篇文章
- **AND** 今日参悟 SHALL 最多保存 1 条可引用短句或短段落
- **AND** 大陆新闻 SHALL NOT 使用日报栏目数量规则限制文章总量或单次新增数量

#### Scenario: 人工发布官方日报

- **WHEN** 后台运营完成日报编辑并选择立即发布
- **THEN** 系统 SHALL 执行发布前校验
- **AND** 校验通过后系统 SHALL 将日报公开发布
- **AND** 系统 SHALL NOT 因 AI 判断安全而自动公开日报

#### Scenario: 人工设置定时发布

- **WHEN** 后台运营完成日报编辑并选择定时发布
- **THEN** 系统 SHALL 执行发布前校验并保存计划发布时间
- **AND** 系统 SHALL NOT 因 AI 判断安全而自动设置定时发布

### Requirement: 日报板块级后台保存

日报后台 SHALL 支持按 `sectionKey` 新建并保存 `今日参悟` 或 `离谱卷宗` 的单板块内容记录，并 SHALL 保证保存一个板块时不覆盖、删除或归档其他板块记录。大陆新闻 SHALL 不再作为日报板块级保存对象。

#### Scenario: 单独保存今日参悟

- **WHEN** 授权后台用户只保存 `daily_reflection` 板块
- **THEN** API SHALL 只更新该 `daily_reflection` 板块记录
- **AND** API SHALL 保持 `absurd_casefile` 的草稿或已发布记录不变

#### Scenario: 单独保存离谱卷宗

- **WHEN** 授权后台用户只保存 `absurd_casefile` 板块
- **THEN** API SHALL 只更新该 `absurd_casefile` 板块记录的摘要、插画、文章、来源字段和排序
- **AND** API SHALL 保持 `daily_reflection` 的草稿或已发布记录不变

#### Scenario: 拒绝按日报板块保存大陆新闻

- **WHEN** 后台请求通过日报板块级保存接口保存 `world_intel`
- **THEN** API SHALL 拒绝请求或提示使用大陆新闻独立管理接口
- **AND** API SHALL NOT 修改任何日报草稿内容

#### Scenario: 非法板块 key

- **WHEN** 后台请求使用不属于日报可编辑板块的 `sectionKey`
- **THEN** API SHALL 拒绝保存
- **AND** API SHALL NOT 修改任何日报草稿内容

### Requirement: 日报板块级发布

日报后台 SHALL 支持单独发布 `今日参悟` 或 `离谱卷宗` 的板块记录，并 SHALL 不要求其他未发布板块同时满足发布条件。大陆新闻 SHALL 通过独立大陆新闻发布能力公开，不再通过日报 `publish-sections` 发布。

#### Scenario: 发布单个板块

- **WHEN** 授权后台用户发布某一个日报可编辑板块
- **THEN** 系统 SHALL 在发布前保存并校验该板块的最新内容
- **AND** 校验通过后系统 SHALL 公开该板块记录
- **AND** 系统 SHALL NOT 因其他板块为空、来源缺失或草稿未完成而拒绝本次板块发布
- **AND** 系统 SHALL NOT 清空、删除或归档其他板块记录

#### Scenario: 拒绝通过日报发布大陆新闻

- **WHEN** 后台用户请求通过日报板块发布接口发布 `world_intel`
- **THEN** API SHALL 拒绝请求或提示使用大陆新闻独立发布接口
- **AND** API SHALL NOT 覆盖、删除或归档任何已发布大陆新闻文章

#### Scenario: 单板块发布失败

- **WHEN** 目标板块未通过板块级发布检查
- **THEN** 系统 SHALL 拒绝公开该板块
- **AND** 系统 SHALL 保持已有公开日报内容不被本次失败操作覆盖

#### Scenario: 公开侧组合最新板块

- **WHEN** 小程序读取当前日报摘要
- **THEN** API SHALL 分别选择 `daily_reflection` 和 `absurd_casefile` 的最新已发布记录组合公开响应
- **AND** 大陆新闻入口 SHALL 从独立大陆新闻内容库读取公开计数或近期摘要
- **AND** 任一日报板块未发布 SHALL NOT 阻止其他已发布板块公开展示

#### Scenario: 定时发布单个板块

- **WHEN** 后台用户为某个日报可编辑板块记录设置晚于当前时间的定时发布时间
- **THEN** 系统 SHALL 只校验并定时该板块记录
- **AND** 到点发布 SHALL NOT 要求其他板块同时满足发布条件
