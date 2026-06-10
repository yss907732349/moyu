# comment-review-automation Specification

## Purpose

`comment-review-automation` 定义社区评论和回复的三通道自动分流、可信用户快速通过、风险用户收紧、人工复核队列减负和审核决策可观测边界。

## Requirements

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

### Requirement: 低风险短文本快速通过门禁

系统 SHALL 使用用户风险、内容风险和提交行为共同决定评论或回复是否可以快速通过。

#### Scenario: 用户满足快速通过门槛

- **WHEN** 用户已登录、已创建隐者档案且近期无驳回、有效举报、禁言、封禁或 `limited` 治理状态
- **AND** 用户提交低风险短评论或短回复
- **THEN** 系统 SHALL 允许该内容进入快速通过判断

#### Scenario: 冷启动用户提交低风险短文本

- **WHEN** 新用户或未通过冷启动期的用户提交评论或回复
- **AND** 文本为低风险短文本
- **AND** 未触发重复提交、频率异常、近期违规、有效举报、禁言、封禁或 `limited` 治理状态
- **THEN** 系统 SHALL 允许该内容快速公开
- **AND** 系统 SHALL 记录审核决策为 `auto_approve`

#### Scenario: 近期违规用户不直接快速通过

- **WHEN** 用户近期存在评论或回复驳回、有效举报、后台隐藏、禁言、封禁或 `limited` 治理状态
- **THEN** 系统 SHALL 取消该用户评论和回复的快速通过资格
- **AND** 其后续低风险内容 SHALL 进入人工复核或更严格处理

#### Scenario: 重复或高频提交不直接快速通过

- **WHEN** 同一用户短时间内重复提交相同或高度相似评论或回复
- **OR** 同一用户触发评论或回复频率限制
- **THEN** 系统 SHALL 拒绝继续提交或将内容设为 `pending`
- **AND** 系统 SHALL NOT 将该内容自动公开

### Requirement: 审核决策可观测

系统 SHALL 记录评论和回复的审核决策摘要，用于后台复核、治理排查和验证脚本检查。

#### Scenario: 后台查看人工复核项

- **WHEN** 后台读取待人工复核的评论或回复
- **THEN** 响应 SHALL 包含审核决策、风险标签、用户风险原因、命中字段、处理建议和创建时间
- **AND** 响应 SHALL NOT 包含供应商密钥、AI 原始 prompt、完整供应商原始响应或普通用户不应看到的内部调试信息

#### Scenario: 后台查看自动处理摘要

- **WHEN** 后台在内容治理详情查看已自动通过或自动驳回的评论或回复
- **THEN** 响应 SHALL 展示归一化审核决策、简短原因和风险摘要
- **AND** 后台 SHALL 可以据此执行隐藏、移除或进一步治理操作

#### Scenario: 普通公开响应不暴露审核细节

- **WHEN** 普通用户请求公开评论列表或帖子详情
- **THEN** 响应 SHALL NOT 返回审核决策细节、命中词、用户风险原因或后台处理建议
- **AND** 响应 SHALL 只返回公开可展示的 `approved` 评论和回复

### Requirement: 人工复核队列减负验证

项目 SHALL 提供验证脚本，确保评论和回复低风险快速通过能力可被自动检查。

#### Scenario: 验证低风险短评论快速通过

- **WHEN** 开发者运行评论审核减负验证命令
- **THEN** 验证 SHALL 构造普通用户提交 `你好`、`hi` 等低风险短评论的场景
- **AND** 验证 SHALL 断言评论状态为 `approved` 且审核决策为 `auto_approve`

#### Scenario: 验证风险用户进入人工复核

- **WHEN** 开发者运行评论审核减负验证命令
- **THEN** 验证 SHALL 构造近期违规用户或 `limited` 用户提交低风险评论的场景
- **AND** 验证 SHALL 断言该评论不会因文本低风险直接公开

#### Scenario: 验证帖子不自动公开

- **WHEN** 开发者运行评论审核减负验证命令
- **AND** 验证构造低风险可信用户提交帖子的场景
- **THEN** 验证 SHALL 断言帖子仍保持 `pending`
- **AND** 验证 SHALL 断言本 change 不改变帖子人工审核主导边界
