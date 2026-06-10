## MODIFIED Requirements

### Requirement: 评论回复审核三通道分流

系统 SHALL 对社区评论和回复执行三通道审核分流，并 SHALL 将每次审核决策归一化为 `auto_approve`、`auto_reject` 或 `manual_review`。本地规则 SHALL 先执行前置门禁；灰区、用户风险、频率异常或供应商需要确认的内容 SHALL 优先进入微信内容安全；微信仍无法确认或不可用时 SHALL 进入人工复核。

#### Scenario: 低风险可信评论自动公开

- **WHEN** 可信用户提交短评论
- **AND** 文本未命中明确违规、灰区风险、重复提交或频率异常
- **THEN** 系统 SHALL 将审核决策设为 `auto_approve`
- **AND** 系统 SHALL 创建状态为 `approved` 的评论
- **AND** 公开评论列表 SHALL 可以展示该评论

#### Scenario: 低风险可信回复自动公开

- **WHEN** 可信用户对已公开评论提交短回复
- **AND** 文本未命中明确违规、灰区风险、重复提交或频率异常
- **THEN** 系统 SHALL 将审核决策设为 `auto_approve`
- **AND** 系统 SHALL 创建状态为 `approved` 的回复
- **AND** 公开帖子详情 SHALL 可以展示该回复

#### Scenario: 明确违规自动驳回

- **WHEN** 评论或回复命中本地明确违规硬规则
- **OR** 微信内容安全明确判定评论或回复违规
- **THEN** 系统 SHALL 将审核决策设为 `auto_reject`
- **AND** 系统 SHALL 将内容状态设为 `rejected` 或拒绝其公开
- **AND** 公开评论区 SHALL NOT 展示该内容

#### Scenario: 灰区先走微信后进人工复核

- **WHEN** 评论或回复命中灰区风险、上下文不明、用户风险较高、频率异常或本地规则无法确认
- **THEN** 系统 SHALL 优先调用微信文本内容安全或等价供应商审核
- **AND** 当供应商返回 `review`、超时、错误或无法满足 openid 条件时，系统 SHALL 将审核决策设为 `manual_review`
- **AND** 系统 SHALL 创建状态为 `pending` 的评论或回复
- **AND** 公开评论区 SHALL NOT 展示该内容直到人工复核通过

#### Scenario: 待复核评论回复作者自己可见

- **WHEN** 评论或回复未被明确驳回但进入供应商审核或人工复核
- **THEN** 提交者本人查看帖子详情时 SHALL 看到该评论或回复
- **AND** 响应 SHALL 标记该内容仅作者自己可见
- **AND** 其他用户 SHALL NOT 在帖子详情或公开评论区看到该内容
- **AND** 微信审核或人工复核通过后该内容 SHALL 按公开评论或回复展示
