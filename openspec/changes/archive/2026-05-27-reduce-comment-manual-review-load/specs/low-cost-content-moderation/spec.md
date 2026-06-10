## MODIFIED Requirements

### Requirement: 可信用户快速通道

系统 SHALL 为低风险、短文本、低频且无近期违规记录的用户提供评论和回复快速通过能力，并 SHALL 对新用户、异常用户、被举报用户和受社区治理限制的用户收紧策略。满足快速通过条件的评论和回复 SHALL 自动公开；不满足条件的内容 SHALL 根据风险进入人工复核或自动驳回。

#### Scenario: 可信用户提交低风险短评论

- **WHEN** 已登录且已创建档案的可信用户提交低风险短评论
- **AND** 文本未命中明确违规、灰区风险、重复提交或频率异常
- **THEN** 系统 SHALL 将评论状态设为 `approved`
- **AND** 公开评论列表 SHALL 可以展示该评论
- **AND** 系统 SHALL 记录审核决策为 `auto_approve`

#### Scenario: 可信用户提交低风险短回复

- **WHEN** 已登录且已创建档案的可信用户提交低风险短回复
- **AND** 文本未命中明确违规、灰区风险、重复提交或频率异常
- **THEN** 系统 SHALL 将回复状态设为 `approved`
- **AND** 公开帖子详情 SHALL 可以展示该回复
- **AND** 系统 SHALL 记录审核决策为 `auto_approve`

#### Scenario: 新用户或异常用户提交评论

- **WHEN** 新用户、近期有违规记录用户、被有效举报用户、治理状态为 `limited` 的用户或触发频率限制的用户提交评论
- **THEN** 系统 SHALL 将评论设为 `pending` 或 `rejected`
- **AND** 系统 SHALL NOT 因文本未命中风险词就直接公开
- **AND** 系统 SHALL 记录用户风险原因供后台查看

#### Scenario: 重复刷屏评论

- **WHEN** 同一用户短时间重复提交相同或高度相似评论
- **THEN** 系统 SHALL 拒绝或限制继续提交
- **AND** 系统 SHALL 返回可理解的频率或重复提交提示
- **AND** 系统 SHALL NOT 将该评论自动公开

### Requirement: 人工复核优先级

系统 SHALL 将低成本审核结果和评论/回复自动分流结果用于后台人工复核排序和展示，提升后台处理效率，并 SHALL 使统一审核队列优先承载需要人工判断的 `manual_review` 内容。

#### Scenario: 后台查看命中原因

- **WHEN** 管理员查看待复核评论、回复或帖子
- **THEN** 后台 SHALL 展示风险等级、归一化风险标签、命中词、命中字段、审核决策、用户风险原因和处理建议
- **AND** 后台 SHALL NOT 展示普通用户不应看到的内部词库调试细节

#### Scenario: 风险内容优先排序

- **WHEN** 后台读取审核队列
- **THEN** 系统 SHALL 将高风险待复核内容排在普通待复核内容之前
- **AND** 系统 SHALL 保留按来源、类型、状态、审核决策、用户风险原因和风险标签筛选能力

#### Scenario: 自动处理内容不进入待人工复核队列

- **WHEN** 评论或回复审核决策为 `auto_approve` 或 `auto_reject`
- **THEN** 系统 SHALL NOT 将该内容作为待人工复核项返回
- **AND** 后台内容治理详情 SHALL 仍可查看其自动处理摘要
