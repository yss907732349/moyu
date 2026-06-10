## ADDED Requirements

### Requirement: 统一 AI 内容审核分流

系统 SHALL 提供统一 AI 内容审核能力，用于日报文章评论、论坛帖子和论坛评论的公开前审核分流。

#### Scenario: AI 判定安全

- **WHEN** 用户生成内容提交后进入 AI 审核
- **AND** AI 明确判定内容合规且置信度达到系统阈值
- **THEN** 系统 SHALL 将内容状态设为 `approved`
- **AND** 系统 SHALL 记录审核来源为 `ai`

#### Scenario: AI 判定违规

- **WHEN** AI 明确判定内容包含违规、涉政、涉黄、违法、辱骂、人身攻击、隐私泄露、广告引流或其他禁止内容
- **THEN** 系统 SHALL 将内容状态设为 `rejected`
- **AND** 系统 SHALL 记录归一化风险标签和用户可理解的拒绝原因

#### Scenario: AI 无法确认

- **WHEN** AI 返回低置信度、无法判断、灰区风险、超时、供应商错误或响应格式异常
- **THEN** 系统 SHALL 将内容状态设为 `pending`
- **AND** 系统 SHALL 记录待人工复核原因
- **AND** 后台 SHALL 可以人工通过、驳回或隐藏该内容

### Requirement: AI 审核公开边界

AI 审核信息 SHALL 在后台可排查，但不得在普通用户公开响应中暴露内部 prompt、供应商响应或敏感配置。

#### Scenario: 普通用户读取公开内容

- **WHEN** 普通用户读取日报评论、论坛帖子或论坛评论
- **THEN** API SHALL NOT 返回 AI 原始 prompt、供应商原始响应、内部风险细节、密钥、代理配置或后台审核备注

#### Scenario: 后台查看审核原因

- **WHEN** 管理员查看待审核或已驳回内容
- **THEN** 后台 SHALL 可以展示归一化风险标签、AI 简短原因、审核来源和待人工复核原因
- **AND** 后台 SHALL NOT 展示供应商密钥或完整原始 prompt

### Requirement: 测试免审核移除

系统 SHALL 移除用户生成内容的测试免审核路径，测试不得依赖绕过审核生命周期来公开内容。

#### Scenario: 本地测试用户生成内容

- **WHEN** 系统处于本地或测试环境
- **AND** 用户提交日报评论、论坛帖子或论坛评论
- **THEN** 系统 SHALL 使用 AI 审核、mock AI 审核结果或人工审核降级
- **AND** 系统 SHALL NOT 因测试免审核配置直接将内容公开
