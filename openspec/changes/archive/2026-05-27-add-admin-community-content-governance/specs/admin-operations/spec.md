## ADDED Requirements

### Requirement: 后台社区内容治理入口

后台运营中心 SHALL 提供社区内容治理入口，并 SHALL 将其与统一审核队列区分。

#### Scenario: 工作台展示社区内容治理入口

- **WHEN** 后台用户打开运营中心工作台
- **THEN** 后台 SHALL 展示进入社区内容治理总览的入口
- **AND** 该入口 SHALL NOT 被表达为仅处理待审核事项的统一审核队列

#### Scenario: 从审核详情进入治理详情

- **WHEN** 后台用户在统一审核队列中查看社区帖子、评论、回复或举报
- **THEN** 后台 MAY 提供进入社区内容治理详情的入口
- **AND** 治理详情 SHALL 能展示该对象所在帖子的完整后台上下文

### Requirement: 社区治理后台令牌权限

后台社区内容治理接口 SHALL 继续使用 `x-admin-token` 校验，不引入完整后台账号系统。

#### Scenario: 无令牌访问社区内容治理

- **WHEN** 请求未携带有效 `x-admin-token` 访问社区内容治理总览、搜索、详情或治理操作接口
- **THEN** API SHALL 拒绝请求
- **AND** API SHALL NOT 返回历史帖子、评论、回复、举报、作者治理状态或审计记录

#### Scenario: 有效令牌访问社区内容治理

- **WHEN** 请求携带有效 `x-admin-token` 访问社区内容治理接口
- **THEN** API SHALL 允许读取或执行对应后台治理能力
- **AND** API SHALL 只返回后台第一阶段允许展示的字段

### Requirement: 社区治理敏感字段边界

后台社区内容治理响应 SHALL 过滤与社区治理无关的用户私密数据、内部身份字段和供应商细节。

#### Scenario: 社区治理响应不暴露用户私密数据

- **WHEN** 后台读取社区内容总览、搜索结果、帖子治理详情、作者治理详情或治理审计记录
- **THEN** 响应 SHALL NOT 包含薪资、工作档案、上班时间、隐藏模式、生存账单、消费统计、CPS 平台来源、微信 openid、微信 unionid、微信 sessionKey 或用户登录态
- **AND** 作者信息 SHALL 使用公开作者快照和后台治理所需的最小用户 ID

#### Scenario: 社区治理响应不暴露内部审核细节

- **WHEN** 后台读取包含内容审核信息的社区治理响应
- **THEN** 响应 SHALL 可以包含归一化风险标签、命中字段、命中词摘要、AI 简短原因、低成本审核建议、置信度和人工复核原因
- **AND** 响应 SHALL NOT 包含 AI 原始 prompt、供应商完整原始响应、供应商密钥或代理配置

#### Scenario: 社区治理响应不暴露明文 IP

- **WHEN** 后台读取社区治理响应
- **THEN** 响应 SHALL NOT 包含明文 IP
- **AND** 如展示来源风险，只能展示脱敏值、哈希摘要或风险标签

### Requirement: 后台运营验证扩展

后台运营验证 SHALL 覆盖社区内容治理入口、令牌校验和敏感字段边界。

#### Scenario: 运行后台运营验证

- **WHEN** 开发者运行 `pnpm verify:admin-operations` 或后台社区治理验证命令
- **THEN** 验证 SHALL 检查后台运营中心存在社区内容治理入口
- **AND** 验证 SHALL 检查社区内容治理请求携带 `x-admin-token`
- **AND** 验证 SHALL 检查社区治理响应不包含敏感字段黑名单
