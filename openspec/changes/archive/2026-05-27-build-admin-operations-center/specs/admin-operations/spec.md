## ADDED Requirements

### Requirement: 后台运营中心工作台

系统 SHALL 提供后台运营中心工作台，用于集中展示社区审核、日报评论复核、举报处理和日报发布待办。

#### Scenario: 读取工作台待办

- **WHEN** 携带有效 `x-admin-token` 的后台请求读取运营工作台
- **THEN** API SHALL 返回待审核帖子、待复核评论/回复、待处理举报、日报评论待复核和待发布日报的计数
- **AND** API SHALL 返回最近待办列表，供后台首页快速进入处理流程

#### Scenario: 工作台入口跳转队列

- **WHEN** 后台用户点击工作台中的社区、日报评论或举报待办卡片
- **THEN** 后台 SHALL 进入统一审核队列
- **AND** 后台 SHALL 自动应用与该卡片对应的来源、类型或状态筛选

### Requirement: 统一审核队列

系统 SHALL 提供统一审核队列，聚合社区帖子、社区评论、社区回复、社区举报和日报评论的后台处理事项。

#### Scenario: 读取统一审核队列

- **WHEN** 携带有效 `x-admin-token` 的后台请求读取统一审核队列
- **THEN** API SHALL 返回统一队列项列表
- **AND** 每个队列项 SHALL 包含来源、对象类型、业务对象 ID、状态、内容摘要、作者公开快照、创建时间、AI 审核摘要、可用操作和详情入口标识

#### Scenario: 按来源类型状态筛选

- **WHEN** 后台用户按来源、对象类型或状态筛选队列
- **THEN** API SHALL 只返回符合筛选条件的队列项
- **AND** 支持的来源 SHALL 至少包含社区和日报

#### Scenario: 按 AI 风险筛选

- **WHEN** 后台用户按 AI 风险标签筛选队列
- **THEN** API SHALL 返回包含对应归一化风险标签的队列项
- **AND** API SHALL NOT 返回 AI 原始 prompt、供应商原始响应或密钥配置

### Requirement: 统一审核详情

系统 SHALL 提供统一审核详情数据，使后台用户可以在操作前查看原文、上下文、风险原因和可用操作。

#### Scenario: 查看内容详情

- **WHEN** 后台用户打开社区帖子、社区评论、社区回复或日报评论的审核详情
- **THEN** API SHALL 返回原文全文、作者公开快照、当前状态、创建时间、AI 风险标签、AI 简短原因、人工复核原因和可用操作
- **AND** API SHALL 返回足够定位上下文的关联对象信息

#### Scenario: 查看举报详情

- **WHEN** 后台用户打开社区举报详情
- **THEN** API SHALL 返回举报原因、举报对象类型、举报对象 ID、被举报内容摘要、当前举报状态和可用处理操作
- **AND** API SHALL 支持后台进入被举报对象的详情查看上下文

### Requirement: 后台统一操作体验

后台 SHALL 在统一审核队列和详情中提供通过、驳回、隐藏、处理举报和查看详情等操作入口，并 SHALL 只展示当前对象允许的操作。

#### Scenario: 内容审核操作

- **WHEN** 队列项是可人工处理的帖子、评论、回复或日报评论
- **THEN** 后台 SHALL 基于队列项 `availableActions` 展示通过、驳回、隐藏或查看详情入口
- **AND** 后台执行操作时 SHALL 携带 `x-admin-token`

#### Scenario: 举报处理操作

- **WHEN** 队列项是待处理举报
- **THEN** 后台 SHALL 基于队列项 `availableActions` 展示保留内容、隐藏内容、标记误报和查看详情入口
- **AND** 后台 SHALL NOT 将举报误表达为普通内容的通过或驳回操作

### Requirement: 后台令牌权限

后台运营中心的聚合读取接口和相关操作入口 SHALL 继续使用 `x-admin-token` 校验，不引入完整账号系统。

#### Scenario: 无令牌读取运营中心

- **WHEN** 请求未携带有效 `x-admin-token` 访问后台运营中心接口
- **THEN** API SHALL 拒绝请求
- **AND** API SHALL NOT 返回待审内容、举报内容、日报草稿或任何后台待办数据

#### Scenario: 有效令牌读取运营中心

- **WHEN** 请求携带有效 `x-admin-token` 访问后台运营中心接口
- **THEN** API SHALL 返回对应后台运营数据
- **AND** API SHALL 只返回后台第一阶段允许展示的字段

### Requirement: 后台敏感字段边界

后台运营中心响应 SHALL 过滤与运营处理无关的敏感字段和内部供应商细节。

#### Scenario: 队列响应不暴露用户私密数据

- **WHEN** 后台读取工作台、审核队列或审核详情
- **THEN** 响应 SHALL NOT 包含薪资、工作档案、上班时间、隐藏模式、生存账单、消费统计、CPS 平台来源、微信 openid、微信 unionid 或用户登录态
- **AND** 作者信息 SHALL 使用公开作者快照或后台允许展示的最小字段

#### Scenario: 队列响应不暴露 AI 内部细节

- **WHEN** 后台读取包含 AI 审核结果的队列项或详情
- **THEN** 响应 SHALL 可以包含归一化风险标签、AI 简短原因、审核来源、置信度和人工复核原因
- **AND** 响应 SHALL NOT 包含 AI 原始 prompt、供应商完整原始响应、供应商密钥或代理配置

### Requirement: 后台运营验证脚本

项目 SHALL 提供后台运营中心验证脚本，覆盖入口、队列、操作按钮、后台令牌和敏感字段边界。

#### Scenario: 运行后台运营验证

- **WHEN** 开发者运行 `pnpm verify:admin-operations`
- **THEN** 验证 SHALL 检查后台运营中心入口、统一审核队列、审核操作入口、举报处理入口和 `x-admin-token` 请求头
- **AND** 验证 SHALL 检查后台聚合响应不包含敏感字段黑名单

### Requirement: 社区媒体资产风险控制

社区媒体资产入口 SHALL 在第一版提供基础大小限制、类型限制、上传频率限制和孤儿资产清理能力，避免未来论坛图片能力开放后无限占用服务端资源。

#### Scenario: 上传媒体资产时校验大小和类型

- **WHEN** 已登录且已创建档案的用户上传社区媒体资产
- **THEN** API SHALL 只接受受支持的图片 MIME 类型
- **AND** API SHALL 拒绝超过单图大小上限的媒体资产

#### Scenario: 上传媒体资产时限流

- **WHEN** 同一用户在单个业务日内上传社区媒体资产超过配置上限
- **THEN** API SHALL 拒绝继续上传
- **AND** API SHALL 返回可理解的限流提示

#### Scenario: 清理未绑定媒体资产

- **WHEN** 后台或定时任务触发社区媒体资产清理
- **THEN** 系统 SHALL 将超过保留时间且未绑定帖子的已上传媒体资产标记为隐藏或不可公开
- **AND** 系统 SHALL 返回本次清理的资产数量，供后台或日志记录
