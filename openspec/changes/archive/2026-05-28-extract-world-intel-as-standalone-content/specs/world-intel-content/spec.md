## ADDED Requirements

### Requirement: 大陆新闻独立文章库

大陆新闻 SHALL 作为独立内容库管理，不再依赖隐者日报 `world_intel` 板块记录承载公开文章。

#### Scenario: 发布文章持续累积

- **WHEN** 后台用户发布新的大陆新闻文章
- **THEN** 系统 SHALL 将该文章加入大陆新闻公开文章库
- **AND** 系统 SHALL NOT 删除、覆盖或归档此前已发布的大陆新闻文章

#### Scenario: 历史文章保留可见

- **WHEN** 普通用户读取大陆新闻公开列表
- **THEN** API SHALL 返回符合分页条件的已发布大陆新闻文章
- **AND** 旧文章 SHALL 在未被下线、隐藏或删除前继续可被分页访问

#### Scenario: 大陆新闻不受日报栏目上限约束

- **WHEN** 大陆新闻文章库中已发布文章数量超过 10 篇
- **THEN** 系统 SHALL 继续保留并分页展示超过 10 篇之后的历史文章
- **AND** 系统 SHALL NOT 因总量超过 10 篇拒绝新增或发布大陆新闻文章

### Requirement: 大陆新闻公开列表和详情

大陆新闻 SHALL 提供独立公开列表和详情读取能力，公开响应只返回可公开内容和可公开来源字段。

#### Scenario: 读取公开列表

- **WHEN** 普通用户读取大陆新闻文章列表
- **THEN** API SHALL 返回文章 ID、标题、摘要、公开来源、配图、发布时间、更新时间和分页信息
- **AND** API SHALL 按发布时间倒序或运营配置顺序返回已发布文章

#### Scenario: 公开列表分页

- **WHEN** 普通用户请求大陆新闻文章列表并提供分页参数
- **THEN** API SHALL 返回对应分页范围内的文章
- **AND** API SHALL 对单次返回数量设置服务端最大值

#### Scenario: 读取文章详情

- **WHEN** 普通用户读取某篇已发布大陆新闻文章详情
- **THEN** API SHALL 返回标题、摘要、正文、公开来源、配图、发布时间、更新时间、点赞状态和可引用状态
- **AND** API SHALL NOT 返回后台草稿、审核备注、AI 原始 prompt、内部风险标签或供应商配置

#### Scenario: 读取不可公开文章

- **WHEN** 普通用户读取草稿、已下线、隐藏或不存在的大陆新闻文章
- **THEN** API SHALL 拒绝返回文章详情
- **AND** API SHALL NOT 暴露后台草稿内容

### Requirement: 大陆新闻后台管理

后台 SHALL 提供大陆新闻独立管理页面和管理接口，用于创建、批量新增、编辑、发布、下线和隐藏大陆新闻文章。

#### Scenario: 后台查看大陆新闻列表

- **WHEN** 携带有效 `x-admin-token` 的后台用户打开大陆新闻管理页面
- **THEN** 后台 SHALL 展示大陆新闻文章列表
- **AND** 列表 SHALL 支持按状态、标题或来源进行基础筛选或搜索

#### Scenario: 批量新增大陆新闻

- **WHEN** 后台用户一次提交多篇大陆新闻文章
- **THEN** API SHALL 创建对应数量的大陆新闻草稿或发布记录
- **AND** API SHALL NOT 使用 10 条作为单次新增的业务上限
- **AND** API SHALL 继续校验请求体大小、字段长度和来源字段格式

#### Scenario: 编辑已发布大陆新闻

- **WHEN** 后台用户修改已发布大陆新闻的标题、摘要、正文、来源或配图
- **THEN** API SHALL 保存修改并更新 `updatedAt`
- **AND** 后续公开详情 SHALL 返回修改后的最新内容

#### Scenario: 下线大陆新闻

- **WHEN** 后台用户下线或隐藏某篇已发布大陆新闻
- **THEN** API SHALL 将该文章从公开列表和公开详情中过滤
- **AND** API SHALL 保留后台可见记录用于后续排查或重新编辑

### Requirement: 大陆新闻来源完整性

大陆新闻 SHALL 延续日报文章来源边界，外部采编内容必须具备可追溯来源，原创内容不得被强制要求外部来源。

#### Scenario: 发布外部采编文章

- **WHEN** 后台用户发布来源类型为外部采编的大陆新闻文章
- **THEN** API SHALL 要求来源 URL、来源标题和来源站点完整
- **AND** API SHALL 校验来源 URL 格式

#### Scenario: 发布原创文章

- **WHEN** 后台用户发布来源类型为原创的大陆新闻文章
- **THEN** API SHALL NOT 因缺少来源 URL、来源标题或来源站点拒绝发布
- **AND** 如果原创文章填写了来源 URL，API SHALL 校验来源 URL 格式

### Requirement: 大陆新闻历史数据兼容

系统 SHALL 为既有日报 `world_intel` 已发布文章提供迁移或兼容读取策略，避免大陆新闻独立化后历史内容丢失。

#### Scenario: 迁移历史日报大陆新闻

- **WHEN** 系统执行大陆新闻历史迁移
- **THEN** 已发布日报中 `world_intel` 板块的文章 SHALL 被写入大陆新闻独立文章库
- **AND** 迁移 SHALL 保留标题、摘要、正文、公开来源、配图、发布时间和可追溯的旧内容 ID

#### Scenario: 避免重复迁移

- **WHEN** 历史迁移重复执行
- **THEN** 系统 SHALL 根据旧内容 ID 或等价唯一标识避免创建重复大陆新闻文章
- **AND** 已迁移文章 SHALL 保持可公开读取

#### Scenario: 兼容未迁移开发数据

- **WHEN** 开发或本地环境尚未完成历史迁移
- **THEN** 系统 MAY 临时从已发布日报 `world_intel` 内容中兼容读取大陆新闻文章
- **AND** 兼容读取 SHALL 去重并遵守公开响应敏感字段边界
