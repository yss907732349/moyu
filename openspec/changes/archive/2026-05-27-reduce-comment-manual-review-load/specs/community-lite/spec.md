## MODIFIED Requirements

### Requirement: 评论与评论审核

系统 SHALL 支持已登录且已创建隐者档案的用户评论已公开帖子，并 SHALL 对评论执行低成本分层审核。明显违规评论 SHALL 被本地硬规则直接驳回；灰区、异常用户或供应商不可用场景 SHALL 进入人工复核；可信用户提交的低风险短评论 SHALL 快速公开。公开评论列表 SHALL 只展示 `approved` 评论。

#### Scenario: 可信用户提交低风险评论

- **WHEN** 可信用户对 `approved` 帖子提交合法短评论
- **AND** 本地敏感词库、重复提交和频率限制均未命中风险
- **AND** 用户近期无违规、有效举报或社区治理限制
- **THEN** API SHALL 创建状态为 `approved` 的评论
- **AND** 该评论 SHALL 可进入公开评论列表
- **AND** API SHALL 返回可供客户端识别的已公开状态

#### Scenario: 用户提交明显违规评论

- **WHEN** 用户对 `approved` 帖子提交评论且本地硬规则判定为明确违规
- **THEN** API SHALL 创建状态为 `rejected` 的评论或拒绝该评论公开
- **AND** 该评论 SHALL NOT 进入公开评论列表
- **AND** 系统 SHALL 记录可后台查看的风险标签、命中信息和拒绝原因

#### Scenario: 用户提交灰区评论

- **WHEN** 用户对 `approved` 帖子提交评论且本地规则判定为灰区、疑似风险、新用户风险、治理限制或异常频率
- **THEN** API SHALL 创建状态为 `pending` 的评论
- **AND** 该评论 SHALL NOT 进入公开评论列表直到人工复核通过
- **AND** 提交者本人 SHALL 可在帖子详情中看到该评论并识别其仅自己可见
- **AND** API SHALL 返回可供客户端识别的审核中状态

#### Scenario: 人工审核通过评论

- **WHEN** 管理员人工审核通过待复核评论
- **THEN** 系统 SHALL 将评论状态更新为 `approved`
- **AND** 该评论 SHALL 可进入公开评论列表

#### Scenario: 评论对象不是公开帖子

- **WHEN** 用户尝试评论 `pending`、`rejected` 或 `hidden` 帖子
- **THEN** API SHALL 拒绝该评论请求

#### Scenario: 普通公开查询过滤评论状态

- **WHEN** 普通用户请求帖子评论列表
- **THEN** API SHALL 只返回 `approved` 评论
- **AND** API SHALL NOT 返回 `pending`、`rejected` 或 `hidden` 评论作为公开内容

### Requirement: 社区 API 契约

系统 SHALL 提供轻社区第一阶段 API，用于帖子列表、帖子详情、发帖、评论、点赞、收藏和举报，并 SHALL 在评论和回复提交响应中返回客户端可识别的审核后状态。

#### Scenario: 读取帖子列表

- **WHEN** 客户端请求社区帖子列表
- **THEN** API SHALL 支持按分区 key、排序方式、游标和数量读取帖子
- **AND** API SHALL 只返回公开可展示字段

#### Scenario: 读取帖子详情

- **WHEN** 已登录且已创建隐者档案的用户请求帖子详情
- **THEN** API SHALL 返回 `approved` 帖子的详情、作者公开身份、当前用户互动状态和互动统计

#### Scenario: 创建帖子

- **WHEN** 已登录且已创建隐者档案的用户提交合法标题、正文、图片 key 列表和分区 key
- **THEN** API SHALL 创建待审核帖子并返回提交结果

#### Scenario: 创建评论

- **WHEN** 已登录且已创建隐者档案的用户对 `approved` 帖子提交合法评论
- **THEN** API SHALL 按低成本分层审核结果创建 `approved`、`pending` 或 `rejected` 评论并返回提交结果
- **AND** API SHALL NOT 默认把所有合法评论都创建为待审核评论

#### Scenario: 执行互动和举报

- **WHEN** 已登录且已创建隐者档案的用户对 `approved` 帖子或评论执行点赞、收藏或举报相关操作
- **THEN** API SHALL 基于当前用户身份记录操作
- **AND** API SHALL 不接受客户端伪造作者身份或阵营身份

### Requirement: 社区内容 AI 审核

论坛帖子、论坛评论和回复 SHALL 接入统一内容审核流程。第一版 SHALL 以前置本地低成本审核为主，明确违规直接驳回，可信低风险评论和回复自动公开，无法确认进入后台人工审核；第三方 AI 或内容安全供应商 SHALL 作为后续可选增强，不作为内容公开的唯一依赖。

#### Scenario: 帖子进入人工审核

- **WHEN** 已登录且已创建隐者档案的用户提交论坛帖子
- **THEN** 系统 SHALL 创建 `pending` 帖子
- **AND** 系统 SHALL 执行本地低成本审核并保存风险标签、命中信息和建议原因
- **AND** 系统 SHALL NOT 因本地规则或 AI 判定安全而直接公开帖子

#### Scenario: 帖子明确违规

- **WHEN** 本地低成本审核或未来供应商明确判定帖子内容违规
- **THEN** 系统 MAY 将帖子保持为 `pending` 供人工确认或直接设为 `rejected`
- **AND** 后台 SHALL 可以查看审核原因和风险标签

#### Scenario: 评论快速通过

- **WHEN** 已登录且已创建隐者档案的用户提交论坛评论
- **AND** 本地低成本审核判定评论低风险且用户满足可信快速通道
- **THEN** 系统 SHALL 将评论状态设为 `approved`
- **AND** 公开评论列表 SHALL 可以展示该评论

#### Scenario: 评论自动驳回或人工复核

- **WHEN** 本地低成本审核或未来供应商明确判定论坛评论违规
- **THEN** 系统 SHALL 将评论状态设为 `rejected`
- **AND** 公开评论列表 SHALL NOT 展示该评论
- **WHEN** 本地审核无法确认、用户风险较高、频率异常、未来供应商超时或供应商不可用
- **THEN** 系统 SHALL 将评论状态设为 `pending`
- **AND** 后台 SHALL 可以人工通过、驳回或隐藏该评论

### Requirement: 社区评论回复

系统 SHALL 支持已登录且已创建隐者档案的用户对已公开评论发布一层回复，并 SHALL 将回复纳入低成本内容审核、公开展示、举报和通知边界。可信低风险回复 SHALL 自动公开；明确违规回复 SHALL 被驳回；灰区回复 SHALL 进入人工复核。

#### Scenario: 用户回复公开评论

- **WHEN** 用户对已公开帖子下的已公开评论提交合法回复
- **THEN** API SHALL 创建回复并执行低成本内容审核
- **AND** 低风险可信回复 SHALL 公开展示
- **AND** 明确违规回复 SHALL 被驳回，灰区回复 SHALL 进入人工复核
- **AND** 灰区回复在人工复核通过前 SHALL 仅提交者本人可见

#### Scenario: 用户回复非公开评论

- **WHEN** 用户尝试回复 `pending`、`rejected` 或 `hidden` 评论
- **THEN** API SHALL 拒绝该回复请求
- **AND** 回复 SHALL NOT 公开展示

#### Scenario: 回复不支持多级嵌套

- **WHEN** 用户尝试对回复继续回复
- **THEN** 系统 SHALL 将该操作转换为对原评论的一层回复或拒绝该操作
- **AND** API SHALL NOT 创建无限层级回复结构
