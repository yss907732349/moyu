## MODIFIED Requirements

### Requirement: 统一 AI 内容审核分流

系统 SHALL 提供统一内容审核能力，用于日报文章评论、论坛帖子和论坛评论的公开前审核分流。第一版 SHALL 在 AI 或第三方供应商之前执行本地低成本硬规则；AI 或第三方供应商结果 SHALL 作为增强分流能力，而不是前期唯一审核来源。

#### Scenario: 本地硬规则判定违规

- **WHEN** 用户生成内容提交后命中本地硬规则中的明确违规内容
- **THEN** 系统 SHALL 将内容状态设为 `rejected`
- **AND** 系统 SHALL 记录归一化风险标签、审核来源、命中字段和用户可理解的拒绝原因

#### Scenario: AI 判定安全

- **WHEN** 用户生成内容提交后进入 AI 审核
- **AND** AI 明确判定内容合规且置信度达到系统阈值
- **THEN** 系统 MAY 将评论或回复状态设为 `approved`
- **AND** 系统 SHALL 记录审核来源为 `ai`
- **AND** 系统 SHALL NOT 因 AI 判定安全而直接公开用户帖子

#### Scenario: AI 判定违规

- **WHEN** AI 明确判定内容包含违规、涉政、涉黄、违法、辱骂、人身攻击、隐私泄露、广告引流或其他禁止内容
- **THEN** 系统 SHALL 将内容状态设为 `rejected`
- **AND** 系统 SHALL 记录归一化风险标签和用户可理解的拒绝原因

#### Scenario: AI 无法确认

- **WHEN** AI 返回低置信度、无法判断、灰区风险、超时、供应商错误或响应格式异常
- **THEN** 系统 SHALL 将内容状态设为 `pending`
- **AND** 系统 SHALL 记录待人工复核原因
- **AND** 后台 SHALL 可以人工通过、驳回或隐藏该内容
