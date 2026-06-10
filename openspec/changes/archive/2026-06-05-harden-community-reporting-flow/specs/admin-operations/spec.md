## ADDED Requirements

### Requirement: 举报人工审核队列

后台运营中心 SHALL 将社区举报作为人工审核事项展示，并 SHALL 支持按举报状态、举报原因、目标类型和优先级查看待处理举报。举报队列 SHALL 优先展示可帮助运营判断的最小必要上下文，不得暴露普通后台不需要的敏感字段。

#### Scenario: 查看待处理举报队列

- **WHEN** 携带有效 `x-admin-token` 的后台用户读取统一审核队列并筛选社区举报
- **THEN** API SHALL 返回待处理举报或举报案件条目
- **AND** 每个条目 SHALL 包含举报原因分类、补充说明摘要、目标类型、目标 ID、目标内容摘要、当前举报状态、创建时间和可用操作
- **AND** API SHALL NOT 返回微信 openid、unionid、sessionKey、应用登录态、薪资、工作档案、生存账单、CPS 来源、供应商密钥或完整供应商原始响应

#### Scenario: 按优先级展示举报

- **WHEN** 举报原因是隐私泄露、违法违规，或同一目标在短时间内收到多名用户举报
- **THEN** 后台 SHALL 将该举报或举报案件标记为高优先级
- **AND** 高优先级 SHALL 只影响队列排序和提示，不 SHALL 自动隐藏公开内容

#### Scenario: 合并同一目标举报

- **WHEN** 多名用户举报同一帖子、评论或回复
- **THEN** 后台 SHALL 能够按同一目标聚合展示举报数量、原因分布、首次举报时间和最近举报时间
- **AND** 后台 SHALL 支持进入聚合目标的举报明细和内容上下文

### Requirement: 举报审核详情

后台 SHALL 提供社区举报审核详情，使运营人员在处理前查看举报理由、被举报内容、关联上下文、作者治理状态、同目标举报明细和可用操作。

#### Scenario: 查看举报详情

- **WHEN** 后台用户打开社区举报详情
- **THEN** API SHALL 返回举报原因分类、补充说明、举报对象类型、举报对象 ID、目标内容摘要、目标内容当前状态、被举报作者公开快照、举报状态和可用处理操作
- **AND** API SHALL 支持后台进入被举报对象所在帖子的治理详情查看上下文

#### Scenario: 查看举报目标上下文

- **WHEN** 被举报对象是评论或回复
- **THEN** API SHALL 返回足够定位上下文的帖子 ID、帖子标题、父评论 ID 和评论区摘要
- **AND** API SHALL NOT 要求运营人员只能通过公开小程序页面查找上下文

#### Scenario: 查看已处理举报详情

- **WHEN** 后台用户打开已处理举报详情
- **THEN** API SHALL 返回处理动作、处理人、处理时间、处理备注和内容治理结果
- **AND** API SHALL NOT 允许后台重复处理状态已经变化的举报

### Requirement: 举报人工处理操作

后台 SHALL 支持对待处理举报执行保留内容、隐藏内容、移除内容和标记误报等人工处理操作，并 SHALL 在状态已变化时拒绝重复处理。

#### Scenario: 保留被举报内容

- **WHEN** 后台用户处理待处理举报并选择保留内容
- **THEN** API SHALL 将举报状态更新为内容保留
- **AND** API SHALL 保留被举报内容的当前状态
- **AND** API SHALL 记录处理备注

#### Scenario: 隐藏被举报内容

- **WHEN** 后台用户处理待处理举报并选择隐藏内容
- **THEN** API SHALL 将举报状态更新为已隐藏处理
- **AND** API SHALL 将对应帖子、评论或回复从公开侧移除
- **AND** API SHALL 创建对应社区治理审计记录

#### Scenario: 移除被举报内容

- **WHEN** 后台用户处理待处理举报并选择移除内容
- **THEN** API SHALL 将举报状态更新为已移除处理
- **AND** API SHALL 将对应帖子、评论或回复更新为 `removed`
- **AND** API SHALL 保留原始内容、举报记录和治理审计记录

#### Scenario: 标记误报

- **WHEN** 后台用户处理待处理举报并选择标记误报
- **THEN** API SHALL 将举报状态更新为误报
- **AND** API SHALL 保留被举报内容的当前状态
- **AND** API SHALL NOT 将该举报计入被举报作者的有效举报

#### Scenario: 重复处理举报

- **WHEN** 后台用户处理状态已经变化的举报
- **THEN** API SHALL 拒绝该操作
- **AND** API SHALL 返回后台可理解的状态已变化提示
