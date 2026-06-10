## MODIFIED Requirements

### Requirement: 社区内容 AI 审核

论坛帖子和论坛评论 SHALL 接入统一 AI 内容审核，明确安全自动公开，明确违规自动驳回，无法确认进入后台人工审核。

#### Scenario: 帖子自动通过

- **WHEN** 已登录且已创建隐者档案的用户提交论坛帖子
- **AND** 用户满足分区发帖权限、引用合法性和基础字段校验
- **AND** AI 明确判定帖子内容合规
- **THEN** 系统 SHALL 将帖子状态设为 `approved`
- **AND** 公开帖子列表 SHALL 可以展示该帖子

#### Scenario: 帖子自动驳回

- **WHEN** AI 明确判定帖子内容违规
- **THEN** 系统 SHALL 将帖子状态设为 `rejected`
- **AND** 公开帖子列表和详情 SHALL NOT 展示该帖子
- **AND** 后台 SHALL 可以查看 AI 审核原因和风险标签

#### Scenario: 帖子进入人工审核

- **WHEN** AI 无法确认、置信度不足、超时或供应商不可用
- **THEN** 系统 SHALL 将帖子状态设为 `pending`
- **AND** 后台 SHALL 可以人工通过、驳回或隐藏该帖子

#### Scenario: 评论自动通过

- **WHEN** 已登录且已创建隐者档案的用户提交论坛评论
- **AND** AI 明确判定评论内容合规
- **THEN** 系统 SHALL 将评论状态设为 `approved`
- **AND** 公开评论列表 SHALL 可以展示该评论

#### Scenario: 评论自动驳回或人工复核

- **WHEN** AI 明确判定论坛评论违规
- **THEN** 系统 SHALL 将评论状态设为 `rejected`
- **AND** 公开评论列表 SHALL NOT 展示该评论
- **WHEN** AI 无法确认、置信度不足、超时或供应商不可用
- **THEN** 系统 SHALL 将评论状态设为 `pending`
- **AND** 后台 SHALL 可以人工通过、驳回或隐藏该评论

### Requirement: 社区测试免审核移除

论坛帖子和评论 SHALL NOT 通过测试免审核配置绕过审核生命周期。

#### Scenario: 测试配置不直接公开社区内容

- **WHEN** 系统处于本地或测试环境
- **AND** 用户提交论坛帖子或评论
- **THEN** 系统 SHALL 仍执行 AI 审核或进入人工审核降级
- **AND** 系统 SHALL NOT 因 `REVIEW_BYPASS_FOR_TESTING` 或同等配置直接公开帖子或评论
