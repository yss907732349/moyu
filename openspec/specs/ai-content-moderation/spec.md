# ai-content-moderation Specification

## Purpose

`ai-content-moderation` 用于定义用户生成内容的统一 AI 审核分流、公开边界和测试环境审核约束。

## Requirements

### Requirement: 统一 AI 内容审核分流

系统 SHALL 提供统一内容安全审核能力，用于日报文章评论、论坛帖子、论坛评论、论坛回复和可公开资料字段的公开前审核分流。第一版 SHALL 在 AI、微信内容安全或第三方供应商之前执行本地低成本硬规则；微信内容安全结果 SHALL 作为第一版真实供应商增强分流能力，mock AI 或人工兜底 SHALL 仅用于测试、降级或兼容。

#### Scenario: 本地硬规则判定违规

- **WHEN** 用户生成内容提交后命中本地硬规则中的明确违规内容
- **THEN** 系统 SHALL 将内容状态设为 `rejected`
- **AND** 系统 SHALL 记录归一化风险标签、审核来源、命中字段和用户可理解的拒绝原因
- **AND** 系统 SHALL NOT 继续调用微信内容安全来覆盖明确驳回结果

#### Scenario: 内容安全供应商判定安全

- **WHEN** 用户生成内容进入微信内容安全或等价供应商审核
- **AND** 供应商明确判定文本合规
- **AND** 相关图片、用户治理状态和业务规则均满足公开条件
- **THEN** 系统 SHALL 可以将评论、回复或帖子状态设为 `approved`
- **AND** 系统 SHALL 记录审核来源、供应商归一化结果和审核时间

#### Scenario: 内容安全供应商判定违规

- **WHEN** 微信内容安全或等价供应商明确判定内容包含违规、涉政、涉黄、违法、辱骂、人身攻击、隐私泄露、广告引流或其他禁止内容
- **THEN** 系统 SHALL 将内容状态设为 `rejected`
- **AND** 系统 SHALL 记录归一化风险标签和用户可理解的拒绝原因

#### Scenario: 内容安全供应商无法确认

- **WHEN** 微信内容安全或等价供应商返回需要复核、低置信度、无法判断、灰区风险、超时、供应商错误或响应格式异常
- **THEN** 系统 SHALL 将内容状态设为 `pending`
- **AND** 系统 SHALL 记录待人工复核原因
- **AND** 后台 SHALL 可以人工通过、驳回或隐藏该内容

### Requirement: AI 审核公开边界

内容安全审核信息 SHALL 在后台可排查，但不得在普通用户公开响应中暴露内部 prompt、微信供应商响应、接口凭证、完整微信身份或敏感配置。

#### Scenario: 普通用户读取公开内容

- **WHEN** 普通用户读取日报评论、论坛帖子、论坛评论、论坛回复或公开资料
- **THEN** API SHALL NOT 返回 AI 原始 prompt、微信供应商原始响应、内部风险细节、密钥、代理配置、完整 openid、`sessionKey` 或后台审核备注

#### Scenario: 后台查看审核原因

- **WHEN** 管理员查看待审核或已驳回内容
- **THEN** 后台 SHALL 可以展示归一化风险标签、内容安全简短原因、审核来源和待人工复核原因
- **AND** 后台 SHALL NOT 展示供应商密钥、完整原始 prompt、微信 `access_token`、`sessionKey` 或完整 openid

### Requirement: 测试免审核移除

系统 SHALL 移除用户生成内容的测试免审核路径，测试不得依赖绕过审核生命周期来公开内容。

#### Scenario: 本地测试用户生成内容

- **WHEN** 系统处于本地或测试环境
- **AND** 用户提交日报评论、论坛帖子或论坛评论
- **THEN** 系统 SHALL 使用 AI 审核、mock AI 审核结果或人工审核降级
- **AND** 系统 SHALL NOT 因测试免审核配置直接将内容公开
