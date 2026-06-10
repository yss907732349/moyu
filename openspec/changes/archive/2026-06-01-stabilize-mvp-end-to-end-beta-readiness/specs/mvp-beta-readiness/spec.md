## ADDED Requirements

### Requirement: MVP 内测闭环范围

系统 SHALL 将 MVP 内测就绪定义为既有首跑、内容、CPS、后台、配置、数据和验收链路的横向闭环稳定化，不得借本能力新增玩法、扩大普通用户可见内部字段或把开发 mock 表达为生产能力。

#### Scenario: 内测就绪不新增玩法

- **WHEN** 开发者实现 `mvp-beta-readiness` 相关任务
- **THEN** 实现 SHALL 聚焦验证、配置、数据状态、错误态、降级态和阻断闭环的问题修复
- **AND** 实现 SHALL NOT 新增成长玩法、社区玩法、补给品类、商业模式或新的普通用户公开字段

#### Scenario: 已有能力作为事实源

- **WHEN** 内测闭环涉及首跑、日报、社区、补给铺、生存账本或后台运营能力
- **THEN** 系统 SHALL 复用对应已归档或当前规格中的业务规则
- **AND** 本能力 SHALL 只定义跨能力验收和内测就绪要求

### Requirement: 首跑链路内测验收

系统 SHALL 提供可验证的首跑链路，覆盖登录、创建隐者档案、保存工作档案、返回首页展示真实已摸金额和本地快照降级。

#### Scenario: 新用户首跑完整路径

- **WHEN** 内测用户从未登录状态进入小程序并按引导完成登录、建档和工作档案配置
- **THEN** 首页 SHALL 基于真实登录态、用户成长资料和工作档案推导 ready 状态
- **AND** 首页已摸金额 SHALL 基于保存后的 `WorkProfileSnapshot` 计算
- **AND** 首页 SHALL NOT 使用静态演示身份、演示金额或伪造工作档案替代真实状态

#### Scenario: 首跑降级路径

- **WHEN** API 暂时不可用但本地存在合法用户资料快照和工作档案快照
- **THEN** 首页 SHALL 使用合法本地快照降级展示并提示同步失败
- **AND** 首页 SHALL NOT 将无合法快照的用户伪造成 ready 状态

### Requirement: 内容链路内测验收

系统 SHALL 提供可验证的内容链路，覆盖后台日报发布、普通用户日报评论、日报引用发帖、社区审核队列和审核结果回显。

#### Scenario: 日报发布到评论

- **WHEN** 授权后台用户创建或选择一篇满足发布规则的日报并发布
- **THEN** 小程序 SHALL 能在日报列表或详情读取该已发布日报
- **AND** 普通用户 SHALL 能提交日报评论并进入既有审核或展示流程

#### Scenario: 日报引用发帖到审核队列

- **WHEN** 普通用户从日报参悟或文章引用入口发起社区帖子
- **THEN** 帖子 SHALL 携带合法日报引用快照
- **AND** 需要审核的帖子 SHALL 进入社区或统一审核队列
- **AND** 后台审核后，小程序 SHALL 按审核结果展示可见、待审或驳回反馈

### Requirement: CPS 链路内测验收

系统 SHALL 提供可验证的 CPS 链路，覆盖补给铺展示、补给点击、服务端生成 `sid`、转链结果、订单同步、有效订单入账和生存账本展示。

#### Scenario: 补给点击生成归因

- **WHEN** 已建档用户点击可用补给项
- **THEN** 请求 SHALL 经后端记录点击归因并生成不可反推用户身份的 `sid`
- **AND** 小程序响应 SHALL 只包含普通用户需要的跳转信息和失败提示
- **AND** 小程序响应 SHALL NOT 暴露聚推客密钥、佣金、订单源 ID、后台备注或完整同步排查字段

#### Scenario: 有效订单同步入账

- **WHEN** 聚推客订单同步或模拟同步记录携带可匹配有效点击归因的已支付有效订单
- **THEN** 系统 SHALL 为归因用户创建或更新对应生存账单记录
- **AND** 今日摘要和本周报告 SHALL 只统计有效订单
- **AND** 未支付、退款、无效、风控、未知或无法匹配归因的订单 SHALL NOT 计入普通用户账单统计

### Requirement: 后台链路内测验收

系统 SHALL 提供可验证的后台链路，覆盖后台 token 校验、实时待办提示、降级轮询、统一审核队列、社区治理、日报运营和补给铺排查。

#### Scenario: 后台 token 边界

- **WHEN** 请求后台运营、审核、社区治理、日报管理或补给铺排查接口时未携带有效后台 token
- **THEN** API SHALL 拒绝请求
- **AND** API SHALL NOT 返回后台队列、治理详情、补给点击、订单同步记录、内部备注或环境变量

#### Scenario: 实时待办与降级轮询

- **WHEN** 新增待审核内容、举报、日报评论复核或工作台计数变化
- **THEN** 后台 SHALL 能通过实时事件或降级轮询获得最小待办摘要
- **AND** 事件 payload SHALL NOT 包含薪资、工作档案、微信身份、用户登录态、AI 原始 prompt、供应商完整原始响应、聚推客 `apikey`、完整订单同步原始响应或服务端环境变量

#### Scenario: 后台操作结果回显

- **WHEN** 授权后台用户处理审核队列、社区治理、日报发布或补给铺配置排查任务
- **THEN** 后台 SHALL 展示处理中的局部反馈、成功反馈或明确失败原因
- **AND** 返回列表或刷新模块时 SHALL 保留必要筛选条件和当前待办提示语义

### Requirement: 内测配置就绪

系统 SHALL 提供完整的内测配置样例和说明，覆盖 API 地址、后台 token、微信登录、CPS、AI 审核、数据库、代理和小程序真机调试地址。

#### Scenario: 环境变量样例完整

- **WHEN** 开发者查看根目录或应用目录环境变量样例
- **THEN** 样例 SHALL 包含内测运行所需的非敏感占位配置
- **AND** 样例 SHALL 覆盖 `VITE_API_BASE_URL`、`ADMIN_OPERATIONS_TOKEN`、`WECHAT_MINIAPP_APPID`、`WECHAT_MINIAPP_SECRET`、`WECHAT_LOGIN_MOCK_ENABLED`、`JUTUIKE_API_KEY`、`JUTUIKE_TRANSFER_URL`、`DATABASE_URL`、AI 审核和代理相关配置
- **AND** 样例 SHALL NOT 写入真实密钥、真实 token、真实数据库密码或可识别个人身份的信息

#### Scenario: 内测运行说明

- **WHEN** 内测成员按 README 或内测检查清单准备环境
- **THEN** 文档 SHALL 说明 API、后台、小程序和数据库的启动命令
- **AND** 文档 SHALL 区分本地 mock 验收、真机调试和真实外部服务联调所需配置
- **AND** 文档 SHALL 提供常见配置失败的排查入口

### Requirement: 数据状态内测验收

系统 SHALL 明确内测数据准备、空状态、错误态、真实 0 数据、降级状态和复位策略，确保多轮内测可重复执行。

#### Scenario: 开发种子边界

- **WHEN** 系统提供开发或内测数据准备脚本、fixture 或检查清单
- **THEN** 种子数据 SHALL 仅用于开发、测试或演示环境
- **AND** 种子数据 SHALL 使用稳定测试标识，便于复位和隔离
- **AND** 系统 SHALL NOT 为普通用户伪造消费订单、伪造真实互动或伪造生产内容来源

#### Scenario: 空状态与真实 0 数据

- **WHEN** 用户没有日报内容、社区内容、补给订单或生存账单记录
- **THEN** 小程序和后台 SHALL 区分真实 0 数据、空订单、无结果和 API 错误
- **AND** 页面 SHALL NOT 使用伪造内容或伪造消费填充普通用户首跑体验

#### Scenario: 数据复位

- **WHEN** 内测者完成一轮 smoke 或人工检查
- **THEN** 项目 SHALL 提供清晰的复位步骤或隔离策略
- **AND** 下一轮检查 SHALL NOT 依赖上一轮遗留的审核状态、订单状态、通知状态或本地缓存污染

### Requirement: 总 smoke 验收

系统 SHALL 提供一个默认确定性的总 smoke 验证入口，用于验证 MVP 内测核心闭环和敏感字段边界。

#### Scenario: 默认 smoke 不依赖真实外部服务

- **WHEN** 开发者运行总 smoke 命令
- **THEN** 命令 SHALL 在默认模式下复用本地构建、既有纵向验证、mock 或 fixture 完成验证
- **AND** 命令 SHALL NOT 强制依赖真实微信、真实聚推客、真实 DeepSeek、真实生产数据库或真实外部网络

#### Scenario: 总 smoke 覆盖跨链路断言

- **WHEN** 总 smoke 执行成功
- **THEN** 验证 SHALL 覆盖首跑、内容、CPS、后台、配置和数据状态的关键跨链路断言
- **AND** 验证 SHALL 输出简洁结果摘要
- **AND** 验证 SHALL NOT 输出后台 token、微信身份、聚推客 `apikey`、完整 `sid`、完整订单同步原始响应、AI 原始 prompt 或其他敏感字段

#### Scenario: 总 smoke 失败反馈

- **WHEN** 总 smoke 中任一链路失败
- **THEN** 命令 SHALL 以非零状态退出
- **AND** 输出 SHALL 指向失败链路、可能的配置原因或对应纵向验证命令

### Requirement: 人工内测检查清单

系统 SHALL 提供一份人工内测检查清单，覆盖脚本无法稳定完全模拟的微信开发者工具、后台实时交互、真实转链和外部服务配置检查。

#### Scenario: 检查清单覆盖角色路径

- **WHEN** 内测者执行人工检查清单
- **THEN** 清单 SHALL 分别覆盖普通用户、后台运营人员和开发配置人员的关键路径
- **AND** 每个检查项 SHALL 标明预期结果、失败记录方式和是否依赖真实外部服务

#### Scenario: 检查清单覆盖外部服务

- **WHEN** 内测者执行真实微信登录、真实补给转链、真实订单回流或真实 AI 审核检查
- **THEN** 清单 SHALL 明确所需环境变量、账号权限、代理或网络要求
- **AND** 清单 SHALL 标明这些检查不属于默认确定性 smoke 的通过前提
