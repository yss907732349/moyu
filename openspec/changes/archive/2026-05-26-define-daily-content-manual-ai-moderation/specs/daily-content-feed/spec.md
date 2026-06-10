## ADDED Requirements

### Requirement: 日报人工采编

隐者日报 SHALL 由后台运营人工创建、编辑、审核和发布，不再依赖第三方来源自动采集。

#### Scenario: 人工创建日报草稿

- **WHEN** 授权后台用户创建隐者日报草稿
- **THEN** 系统 SHALL 允许手动填写业务日期、日报标题、首页摘要、今日参悟、栏目文章标题、摘要、正文和来源字段
- **AND** 来源字段 SHALL 包含可选的来源说明、来源站点、来源标题、来源 URL、配图 URL 和发布时间

#### Scenario: 日报栏目数量

- **WHEN** 后台编辑尘世情报或离谱卷宗
- **THEN** 每个栏目 SHALL 最多保存 10 篇文章
- **AND** 今日参悟 SHALL 最多保存 1 条可引用短句或短段落

#### Scenario: 人工发布官方日报

- **WHEN** AI 已完成改写或风险提示
- **THEN** 系统 SHALL NOT 因 AI 判断安全而自动公开日报
- **AND** 官方日报 SHALL 仍由后台管理员显式提交审核、审核通过和发布

### Requirement: 日报 AI 辅助改写

日报后台 SHALL 支持 AI 基于运营已输入内容进行改写、润色、摘要生成、标题建议和风险提示。

#### Scenario: AI 基于当前编辑内容处理

- **WHEN** 后台用户请求 AI 辅助处理日报草稿
- **THEN** 系统 SHALL 将当前草稿文本和人工来源字段传给 AI
- **AND** AI SHALL 只基于这些输入输出改写建议、摘要、标题建议和风险提示

#### Scenario: AI 不得编造来源

- **WHEN** AI 返回日报改写结果
- **THEN** 系统 SHALL 保留人工输入的 `sourceUrl`、`imageUrl`、来源标题和来源站点
- **AND** 系统 SHALL NOT 接收 AI 新增、替换或伪造的来源链接、配图链接或来源站点

### Requirement: 日报评论 AI 审核

日报文章评论 SHALL 接入统一 AI 内容审核，明确安全自动公开，明确违规自动驳回，无法确认进入后台人工审核。

#### Scenario: 评论自动通过

- **WHEN** 已登录且已创建隐者档案的用户提交日报文章评论
- **AND** AI 明确判定该评论合规
- **THEN** 系统 SHALL 将评论状态设为 `approved`
- **AND** 公开评论列表 SHALL 可以展示该评论

#### Scenario: 评论自动驳回

- **WHEN** 用户提交的日报文章评论被 AI 明确判定为违规
- **THEN** 系统 SHALL 将评论状态设为 `rejected`
- **AND** 公开评论列表 SHALL NOT 展示该评论
- **AND** 系统 SHALL 记录 AI 审核原因和风险标签供后台排查

#### Scenario: 评论进入人工审核

- **WHEN** AI 无法确认、置信度不足、超时或供应商不可用
- **THEN** 系统 SHALL 将评论状态设为 `pending`
- **AND** 后台 SHALL 可以人工通过、驳回或隐藏该评论

### Requirement: 日报测试免审核移除

日报内容和日报评论 SHALL NOT 通过测试免审核配置绕过正式审核生命周期。

#### Scenario: 测试配置不直接公开评论

- **WHEN** 系统处于本地或测试环境
- **AND** 用户提交日报文章评论
- **THEN** 系统 SHALL 仍执行 AI 审核或进入人工审核降级
- **AND** 系统 SHALL NOT 因 `REVIEW_BYPASS_FOR_TESTING` 或同等配置直接公开评论

### Requirement: 日报公开响应边界

公开日报响应 SHALL 只暴露可公开内容和可公开来源字段，不得暴露 AI 原始 prompt、供应商响应、后台审核备注或内部风险细节。

#### Scenario: 公开文章来源字段

- **WHEN** 普通用户读取日报栏目列表或文章详情
- **THEN** API SHALL 返回公开来源说明、来源站点、来源标题、来源 URL 和可用图片 URL
- **AND** API SHALL NOT 返回 AI 原始 prompt、供应商响应、后台审核备注、内部风险标签或密钥配置
