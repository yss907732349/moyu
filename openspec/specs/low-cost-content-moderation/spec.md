# low-cost-content-moderation Specification

## Purpose

TBD - created by archiving change add-low-cost-content-moderation. Update Purpose after archive.

## Requirements

### Requirement: 本地敏感词库同步

系统 SHALL 提供显式脚本同步本地敏感词库，并 SHALL 将同步结果保存为项目内可验证缓存，运行时不得依赖实时访问外部 GitHub 仓库。

#### Scenario: 同步用户指定词库

- **WHEN** 开发者运行敏感词库同步命令
- **THEN** 脚本 SHALL 从 `https://github.com/konsheng/Sensitive-lexicon` 读取可用文本词库
- **AND** 脚本 SHALL 将词条归一化、去重并写入项目内缓存
- **AND** 脚本 SHALL 记录来源仓库、同步时间、词条数量和许可说明

#### Scenario: 同步失败不覆盖缓存

- **WHEN** GitHub 不可访问、下载失败或词库结构异常
- **THEN** 脚本 SHALL 保留已有可用缓存
- **AND** 脚本 SHALL 返回可理解的失败原因

#### Scenario: 验证词库缓存

- **WHEN** 开发者运行低成本审核验证命令
- **THEN** 验证 SHALL 检查词库缓存结构、来源元数据、词条数量和关键风险类别
- **AND** 验证 SHALL 确保缓存可被共享包和 API 运行时加载

### Requirement: 文本归一化与风险匹配

系统 SHALL 在审核用户生成文本前执行归一化处理，并 SHALL 基于本地词库和规则输出可解释的风险结果。

#### Scenario: 归一化简单规避文本

- **WHEN** 用户提交包含空格、标点、大小写或简单分隔符规避的文本
- **THEN** 系统 SHALL 在匹配前移除或归一化这些干扰字符
- **AND** 系统 SHALL 仍可命中对应风险词

#### Scenario: 明确违规文本

- **WHEN** 文本命中性暴力、严重辱骂、暴力威胁、违法、隐私泄露或广告引流等明确违规词
- **THEN** 审核结果 SHALL 为 `reject`
- **AND** 结果 SHALL 包含归一化风险标签、命中字段和用户可理解的拒绝原因

#### Scenario: 灰区文本

- **WHEN** 文本命中弱风险、涉政争议、疑似广告或上下文不明内容
- **THEN** 审核结果 SHALL 为 `review`
- **AND** 后台 SHALL 可以查看命中词、风险等级和处理建议

#### Scenario: 低风险文本

- **WHEN** 文本未命中本地硬规则且不触发限流或重复提交规则
- **THEN** 审核结果 MAY 为 `pass`
- **AND** 系统 SHALL 记录审核来源为本地规则

### Requirement: 低风险短文本快速通道

系统 SHALL 为低风险、短文本、低频且无近期违规记录的用户提供评论和回复快速通过能力，并 SHALL 对异常用户、被举报用户和受社区治理限制的用户收紧策略。满足快速通过条件的评论和回复 SHALL 自动公开；不满足条件的内容 SHALL 根据风险进入人工复核或自动驳回。

#### Scenario: 普通用户提交低风险短评论

- **WHEN** 已登录且已创建档案的普通用户提交低风险短评论
- **AND** 文本未命中明确违规、灰区风险、重复提交或频率异常
- **THEN** 系统 SHALL 将评论状态设为 `approved`
- **AND** 公开评论列表 SHALL 可以展示该评论
- **AND** 系统 SHALL 记录审核决策为 `auto_approve`

#### Scenario: 普通用户提交低风险短回复

- **WHEN** 已登录且已创建档案的普通用户提交低风险短回复
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

### Requirement: 有效举报风险来源

低成本评论和回复审核 SHALL 只将人工确认成立的社区举报计为用户近期有效举报风险。待处理举报、内容保留举报和误报 SHALL NOT 直接收紧被举报作者的评论或回复快速通过资格。

#### Scenario: 人工确认成立的举报影响快速通道

- **WHEN** 用户近期存在因举报处理而隐藏或移除内容的记录
- **THEN** 该用户提交评论或回复时 SHALL 被视为存在近期有效举报风险
- **AND** 系统 SHALL NOT 仅因文本低风险就直接公开该评论或回复
- **AND** 系统 SHALL 记录用户风险原因为有效举报或等价语义

#### Scenario: 待处理举报不影响被举报作者

- **WHEN** 用户只有待处理举报记录且没有人工确认成立的举报
- **THEN** 系统 SHALL NOT 因该待处理举报收紧其低风险短文本快速通过资格
- **AND** 系统 SHALL 继续依据文本风险、频率、治理状态和历史违规记录做审核决策

#### Scenario: 保留或误报不影响被举报作者

- **WHEN** 后台将针对用户内容的举报处理为保留内容或误报
- **THEN** 系统 SHALL NOT 将该举报计入被举报作者的有效举报风险
- **AND** 后续评论或回复审核 SHALL NOT 因该举报结果单独取消快速通过资格

#### Scenario: 误报影响举报人治理判断

- **WHEN** 用户近期存在多次被后台标记为误报的举报
- **THEN** 系统 SHALL 将该记录作为举报频率限制或举报滥用判断的可用输入
- **AND** 系统 SHALL NOT 将举报人误报记录误用为其评论或回复内容违规记录

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

### Requirement: 本地规则前置门禁与微信升级

系统 SHALL 将本地敏感词库、文本归一化、频率和重复提交规则作为全局内容安全链路的前置门禁，并 SHALL 根据风险等级决定自动驳回、快速通过、升级到微信内容安全或进入人工复核。

#### Scenario: 本地明确高危直接驳回

- **WHEN** 用户提交的文本命中本地明确高危规则
- **THEN** 系统 SHALL 自动驳回该内容
- **AND** 系统 SHALL NOT 调用微信内容安全来覆盖该高危驳回结果

#### Scenario: 本地灰区升级微信审核

- **WHEN** 用户提交的文本命中本地灰区风险、用户风险、重复提交风险或频率异常
- **THEN** 系统 SHALL 优先将该内容升级到微信内容安全或等价供应商审核
- **AND** 当供应商不可用或无法确认时，系统 SHALL 将内容转入人工复核

#### Scenario: 可信短评论快速通过

- **WHEN** 可信用户提交短评论或短回复
- **AND** 本地规则未命中风险
- **AND** 用户近期无治理限制、有效举报、驳回记录、重复提交或频率异常
- **THEN** 系统 SHALL 可以保留低成本快速通过能力
- **AND** 系统 SHALL 记录该内容由本地规则快速通过

#### Scenario: 帖子和图片不只依赖本地低风险

- **WHEN** 用户提交社区帖子或带图片内容
- **AND** 本地规则未命中风险
- **THEN** 系统 SHALL 继续执行微信内容安全或等价供应商审核
- **AND** 系统 SHALL NOT 仅因本地规则低风险就对其他用户公开帖子或图片
