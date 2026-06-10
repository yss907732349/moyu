## ADDED Requirements

### Requirement: 社区作者自见乐观发布体验

社区 SHALL 支持作者提交后立即在本人视图看到待审核帖子、评论和回复，但 SHALL 在审核通过前阻止其他用户看到这些内容。

#### Scenario: 作者查看待审核帖子

- **WHEN** 用户提交社区帖子后该帖子仍处于 `pending`
- **THEN** 提交者本人 SHALL 可以在我的帖子、提交后的详情或等价本人视图看到该帖子
- **AND** 该帖子 SHALL 标记为仅作者可见或审核中
- **AND** 其他用户 SHALL NOT 在公开社区列表或详情中看到该帖子

#### Scenario: 作者查看待审核评论或回复

- **WHEN** 用户提交评论或回复后该内容仍处于 `pending`
- **THEN** 提交者本人 SHALL 可以在帖子详情中看到该评论或回复
- **AND** 该内容 SHALL 标记为仅作者可见或审核中
- **AND** 其他用户 SHALL NOT 在公开评论区看到该评论或回复

#### Scenario: 小程序不误导为已公开

- **WHEN** 小程序展示仅作者可见的帖子、评论或回复
- **THEN** 页面 SHALL 使用轻量状态提示表达审核中或通过后其他人可见
- **AND** 页面 SHALL NOT 将未公开内容表达为已经对所有用户公开

## MODIFIED Requirements

### Requirement: 帖子审核生命周期

系统 SHALL 维护帖子审核状态，包含 `pending`、`approved`、`rejected` 和 `hidden`，并 SHALL 仅向其他用户公开展示审核通过的帖子。统一内容安全审核 SHALL 可以在本地规则、微信文本审核和图片审核均满足公开条件时自动通过帖子；无法确认时 SHALL 进入后台人工审核。

#### Scenario: 用户提交帖子

- **WHEN** 用户提交合法帖子
- **THEN** API SHALL 创建状态为 `pending` 的帖子
- **AND** API SHALL NOT 将该帖子加入其他用户的公开列表或公开详情
- **AND** API SHALL 保存本地规则和内容安全风险判断、标签、来源和建议原因供后台参考
- **AND** 提交者本人 SHALL 可以在本人视图看到该帖子处于审核中

#### Scenario: 内容安全判定帖子可公开

- **WHEN** 本地规则未驳回帖子
- **AND** 微信文本内容安全或等价供应商明确判定标题和正文通过
- **AND** 帖子没有图片或所有图片内容安全审核均通过
- **AND** 用户治理状态不阻止公开
- **THEN** 系统 SHALL 将帖子状态更新为 `approved`
- **AND** 系统 SHALL 设置或更新帖子发布时间
- **AND** 该帖子 SHALL 可进入公开列表和公开详情

#### Scenario: 内容安全判定帖子违规

- **WHEN** 本地规则或微信内容安全明确判定帖子标题、正文或图片违规
- **THEN** 系统 SHALL 将帖子状态更新为 `rejected`
- **AND** 该帖子 SHALL NOT 进入公开列表或公开详情
- **AND** 系统 SHALL 向作者保留可展示的驳回提示

#### Scenario: 内容安全无法确认帖子

- **WHEN** 帖子文本或图片审核返回需要复核、超时、供应商错误、回调失败或无法满足 openid 条件
- **THEN** 系统 SHALL 保持帖子状态为 `pending`
- **AND** 后台 SHALL 可以人工通过、驳回或隐藏该帖子

#### Scenario: 人工审核通过帖子

- **WHEN** 管理员人工审核通过待审核帖子
- **THEN** 系统 SHALL 将帖子状态更新为 `approved`
- **AND** 系统 SHALL 设置或更新帖子发布时间
- **AND** 该帖子 SHALL 可进入公开列表和公开详情

#### Scenario: 人工驳回帖子

- **WHEN** 管理员人工驳回待审核帖子
- **THEN** 系统 SHALL 将帖子状态更新为 `rejected`
- **AND** 该帖子 SHALL NOT 进入公开列表或公开详情
- **AND** 系统 SHALL 向作者保留可展示的驳回提示

#### Scenario: 隐藏已公开帖子

- **WHEN** 管理员隐藏已公开帖子
- **THEN** 系统 SHALL 将帖子状态更新为 `hidden`
- **AND** 该帖子 SHALL 从公开列表和公开详情中移除

#### Scenario: 普通公开查询过滤审核状态

- **WHEN** 普通用户请求帖子列表或帖子详情
- **THEN** API SHALL 只返回 `approved` 帖子
- **AND** API SHALL NOT 返回 `pending`、`rejected` 或 `hidden` 帖子作为公开内容

### Requirement: 评论与评论审核

系统 SHALL 支持已登录且已创建隐者档案的用户评论已公开帖子，并 SHALL 对评论执行低成本规则、微信内容安全和人工复核的分层审核。明显违规评论 SHALL 被直接驳回；可信低风险短评论 SHALL 可以快速公开；灰区、异常用户或微信无法确认场景 SHALL 进入人工复核。公开评论列表 SHALL 只展示 `approved` 评论。

#### Scenario: 普通用户提交低风险评论

- **WHEN** 普通用户对 `approved` 帖子提交合法短评论
- **AND** 本地敏感词库、重复提交和频率限制均未命中风险
- **AND** 用户近期无违规、有效举报或社区治理限制
- **THEN** API SHALL 可以创建状态为 `approved` 的评论
- **AND** 该评论 SHALL 可进入公开评论列表
- **AND** API SHALL 返回可供客户端识别的已公开状态

#### Scenario: 用户提交明显违规评论

- **WHEN** 用户对 `approved` 帖子提交评论且本地硬规则或微信内容安全判定为明确违规
- **THEN** API SHALL 创建状态为 `rejected` 的评论或拒绝该评论公开
- **AND** 该评论 SHALL NOT 进入公开评论列表
- **AND** 系统 SHALL 记录可后台查看的风险标签、命中信息和拒绝原因

#### Scenario: 用户提交灰区评论

- **WHEN** 用户对 `approved` 帖子提交评论且本地规则判定为灰区、疑似风险、新用户风险、治理限制或异常频率
- **THEN** API SHALL 优先调用微信内容安全或等价供应商审核
- **AND** 当供应商无法确认或不可用时，API SHALL 创建状态为 `pending` 的评论
- **AND** 该评论 SHALL NOT 进入公开评论列表直到内容安全或人工复核通过
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

### Requirement: 社区内容 AI 审核

论坛帖子、论坛评论和回复 SHALL 接入统一内容安全流程。第一版 SHALL 以前置本地低成本审核为门禁，明确违规直接驳回，可信低风险评论和回复快速公开；帖子和图片 SHALL 在微信内容安全或等价供应商通过后公开，无法确认进入后台人工审核。

#### Scenario: 帖子进入内容安全审核

- **WHEN** 已登录且已创建隐者档案的用户提交论坛帖子
- **THEN** 系统 SHALL 创建 `pending` 帖子
- **AND** 系统 SHALL 执行本地低成本审核并保存风险标签、命中信息和建议原因
- **AND** 系统 SHALL 在未被本地规则驳回时继续执行微信内容安全或等价供应商审核

#### Scenario: 帖子内容安全通过

- **WHEN** 帖子文本和所有图片均通过内容安全审核
- **AND** 用户治理状态允许公开
- **THEN** 系统 SHALL 将帖子更新为 `approved`
- **AND** 公开社区列表和详情 SHALL 可以展示该帖子

#### Scenario: 帖子明确违规

- **WHEN** 本地低成本审核或内容安全供应商明确判定帖子内容违规
- **THEN** 系统 SHALL 将帖子设为 `rejected`
- **AND** 后台 SHALL 可以查看审核原因和风险标签

#### Scenario: 评论快速通过

- **WHEN** 已登录且已创建隐者档案的用户提交论坛评论
- **AND** 本地低成本审核判定评论低风险且用户满足可信快速通道
- **THEN** 系统 SHALL 将评论状态设为 `approved`
- **AND** 公开评论列表 SHALL 可以展示该评论

#### Scenario: 评论自动驳回或人工复核

- **WHEN** 本地低成本审核或内容安全供应商明确判定论坛评论违规
- **THEN** 系统 SHALL 将评论状态设为 `rejected`
- **AND** 公开评论列表 SHALL NOT 展示该评论
- **WHEN** 本地审核无法确认、用户风险较高、频率异常、内容安全供应商超时或供应商不可用
- **THEN** 系统 SHALL 将评论状态设为 `pending`
- **AND** 后台 SHALL 可以人工通过、驳回或隐藏该评论
