## ADDED Requirements

### Requirement: 日报评论作者自见

日报文章评论 SHALL 支持提交者本人即时看到待审核评论，但 SHALL 在审核通过前阻止其他用户看到该评论。

#### Scenario: 作者查看待审核日报评论

- **WHEN** 用户提交日报文章评论后评论状态为 `pending`
- **THEN** 提交者本人 SHALL 可以在文章详情中看到该评论
- **AND** 该评论 SHALL 标记为仅作者自己可见或审核中
- **AND** 其他用户 SHALL NOT 在公开评论列表中看到该评论

#### Scenario: 日报评论审核通过后公开

- **WHEN** 待审核日报评论经内容安全或人工复核通过
- **THEN** 系统 SHALL 将评论状态更新为 `approved`
- **AND** 公开文章评论列表 SHALL 可以展示该评论

## MODIFIED Requirements

### Requirement: 日报评论 AI 审核

日报文章评论 SHALL 接入统一内容安全审核，先执行本地低成本规则，再按需调用微信文本内容安全或等价供应商。明确安全自动公开，明确违规自动驳回，无法确认进入后台人工审核。

#### Scenario: 评论自动通过

- **WHEN** 已登录且已创建隐者档案的用户提交日报文章评论
- **AND** 本地规则未命中风险
- **AND** 内容安全供应商明确判定该评论合规
- **THEN** 系统 SHALL 将评论状态设为 `approved`
- **AND** 公开评论列表 SHALL 可以展示该评论

#### Scenario: 评论自动驳回

- **WHEN** 用户提交的日报文章评论被本地规则或内容安全供应商明确判定为违规
- **THEN** 系统 SHALL 将评论状态设为 `rejected`
- **AND** 公开评论列表 SHALL NOT 展示该评论
- **AND** 系统 SHALL 记录归一化审核原因和风险标签供后台排查

#### Scenario: 评论进入人工审核

- **WHEN** 内容安全供应商无法确认、返回需要复核、超时或供应商不可用
- **THEN** 系统 SHALL 将评论状态设为 `pending`
- **AND** 提交者本人 SHALL 可以看到该评论处于审核中
- **AND** 后台 SHALL 可以人工通过、驳回或隐藏该评论
