## ADDED Requirements

### Requirement: 微信内容安全供应商配置

系统 SHALL 提供微信小程序内容安全供应商接入配置，用于服务端调用文本和图片审核能力，并 SHALL 在配置缺失、关闭或测试模式下提供明确降级结果。

#### Scenario: 配置真实微信内容安全

- **WHEN** 服务端配置了微信小程序 `appId`、`secret` 和内容安全启用开关
- **THEN** 系统 SHALL 仅在服务端获取和缓存微信接口调用凭证
- **AND** 系统 SHALL NOT 将微信 `secret`、`access_token`、`sessionKey` 或完整 openid 返回给小程序、普通 API 响应或后台默认字段

#### Scenario: 缺少微信内容安全配置

- **WHEN** 内容安全供应商启用但微信配置缺失或接口凭证获取失败
- **THEN** 系统 SHALL 将本次供应商审核结果归一化为需要人工复核
- **AND** 系统 SHALL 记录可排查的降级原因
- **AND** 系统 SHALL NOT 将内容错误表达为已通过微信审核

#### Scenario: 使用内容安全 mock

- **WHEN** 本地、测试或内测环境显式启用微信内容安全 mock
- **THEN** 系统 SHALL 使用配置的 mock 结果生成通过、驳回、人工复核或供应商错误场景
- **AND** 审核 trace SHALL 明确标记来源为 mock

### Requirement: 微信文本内容安全审核

系统 SHALL 使用微信文本内容安全能力审核用户提交的公开文本，并 SHALL 将微信返回结果归一化为通过、驳回或人工复核。

#### Scenario: 审核社区和评论文本

- **WHEN** 已登录且可识别微信 openid 的用户提交社区帖子、评论、回复、日报评论或大陆新闻评论
- **THEN** 系统 SHALL 按内容类型选择微信内容安全场景枚举
- **AND** 系统 SHALL 将标题、正文、评论体或回复体传入文本内容安全审核
- **AND** 系统 SHALL 保存归一化审核来源、风险标签、建议结果和审核时间

#### Scenario: 微信文本审核通过

- **WHEN** 微信文本内容安全结果明确为 `pass`
- **THEN** 系统 SHALL 将供应商审核结果归一化为通过
- **AND** 后续业务 SHALL 继续结合本地规则、用户治理状态、图片审核状态和内容类型决定是否公开

#### Scenario: 微信文本审核违规

- **WHEN** 微信文本内容安全结果明确为 `risky`
- **THEN** 系统 SHALL 将供应商审核结果归一化为驳回
- **AND** 用户生成内容 SHALL NOT 对其他用户公开
- **AND** 系统 SHALL 返回用户可理解的修改提示

#### Scenario: 微信文本审核需要复核

- **WHEN** 微信文本内容安全结果为 `review`、响应格式异常、接口超时、供应商错误或无法满足 openid 访问要求
- **THEN** 系统 SHALL 将内容设为需要人工复核
- **AND** 后台 SHALL 可以查看归一化降级原因

### Requirement: 微信图片内容安全审核

系统 SHALL 使用微信多媒体内容安全能力异步审核社区图片，并 SHALL 通过回调或超时处理控制图片和帖子公开状态。

#### Scenario: 提交图片审核任务

- **WHEN** 用户提交带社区图片资产的帖子
- **THEN** 系统 SHALL 为每个待公开图片提交微信图片内容安全审核任务
- **AND** 系统 SHALL 使用可被微信检测服务器下载的图片 URL
- **AND** 系统 SHALL 保存微信返回的 `trace_id` 或等价任务标识

#### Scenario: 图片审核通过回调

- **WHEN** 微信图片内容安全回调返回 `pass`
- **THEN** 系统 SHALL 将对应图片资产审核状态标记为通过
- **AND** 系统 SHALL 在帖子文本和全部图片均满足公开条件后允许帖子公开

#### Scenario: 图片审核违规回调

- **WHEN** 微信图片内容安全回调返回 `risky`
- **THEN** 系统 SHALL 将对应图片资产标记为不可公开
- **AND** 绑定该图片的帖子 SHALL NOT 对其他用户公开

#### Scenario: 图片审核不确定或超时

- **WHEN** 微信图片内容安全回调返回 `review`、下载错误、响应异常或超过配置等待时间仍未回调
- **THEN** 系统 SHALL 将相关帖子保留为待人工复核
- **AND** 后台 SHALL 能看到图片审核待复核或超时原因

### Requirement: 内容安全敏感字段边界

系统 SHALL 对微信内容安全相关字段进行最小化保存和响应过滤，避免泄露供应商密钥、完整微信身份或原始供应商响应。

#### Scenario: 普通用户读取内容

- **WHEN** 普通用户读取公开帖子、评论、日报评论、大陆新闻评论或公开资料
- **THEN** API SHALL NOT 返回微信 `access_token`、`sessionKey`、完整 openid、完整 `trace_id`、供应商原始响应、接口错误原文或内部审核配置

#### Scenario: 后台查看审核摘要

- **WHEN** 管理员查看统一审核队列、审核详情或社区治理详情
- **THEN** 后台响应 SHALL 可以展示供应商来源、归一化风险标签、简短原因、降级原因和脱敏任务标识
- **AND** 后台响应 SHALL NOT 默认展示微信密钥、完整 openid、`sessionKey`、`access_token` 或完整原始响应
