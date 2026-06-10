# community-identity-and-ip-attribution Specification

## Purpose

TBD - created by archiving change harden-community-identity-and-ip-attribution. Update Purpose after archive.

## Requirements

### Requirement: 社区发布隐私同意门槛

系统 SHALL 在用户发帖、评论或回复前要求其同意当前版本的隐私政策和社区用户协议，并 SHALL 在服务端保存同意版本、同意时间、同意场景和用户标识。

#### Scenario: 未同意当前隐私政策时尝试发布

- **WHEN** 已登录且已创建隐者档案的用户尝试发帖、评论或回复
- **AND** 用户尚未同意当前版本的隐私政策或社区用户协议
- **THEN** API SHALL 拒绝该写操作
- **AND** API SHALL 返回客户端可识别的隐私同意门槛错误

#### Scenario: 小程序引导隐私同意

- **WHEN** 小程序收到隐私同意门槛错误
- **THEN** 小程序 SHALL 展示隐私政策、社区用户协议和小程序用户隐私保护指引入口
- **AND** 小程序 SHALL 要求用户主动同意后才进入手机号验证流程
- **AND** 小程序 SHALL NOT 默认勾选同意状态

#### Scenario: 用户拒绝隐私同意

- **WHEN** 用户在隐私同意面板中取消或拒绝
- **THEN** 小程序 SHALL NOT 调用微信手机号验证能力
- **AND** 小程序 SHALL NOT 提交发帖、评论或回复内容

#### Scenario: 隐私政策版本变化

- **WHEN** 隐私政策、社区用户协议或个人信息处理目的版本发生变化
- **AND** 旧用户再次尝试发帖、评论或回复
- **THEN** 系统 SHALL 要求用户重新同意当前版本后再继续发布流程

### Requirement: 社区手机号验证发布门槛

系统 SHALL 使用微信手机号验证作为社区发帖、评论和回复的真实身份认证路径；未完成手机号验证的用户 SHALL NOT 发布社区帖子、评论或回复。

#### Scenario: 未完成手机号验证时尝试发帖

- **WHEN** 已登录、已创建隐者档案且已同意当前隐私政策的用户尝试发帖
- **AND** 用户尚未完成手机号验证
- **THEN** API SHALL 拒绝创建帖子
- **AND** API SHALL 返回客户端可识别的手机号验证门槛错误

#### Scenario: 未完成手机号验证时尝试评论或回复

- **WHEN** 已登录、已创建隐者档案且已同意当前隐私政策的用户尝试评论或回复
- **AND** 用户尚未完成手机号验证
- **THEN** API SHALL 拒绝创建评论或回复
- **AND** API SHALL NOT 创建待审核内容

#### Scenario: 手机号验证成功

- **WHEN** 用户通过小程序手机号验证组件获得动态 `code`
- **THEN** 小程序 SHALL 将该 `code` 发送给服务端换取并校验手机号
- **AND** 服务端 SHALL 保存手机号验证状态、验证时间和验证来源
- **AND** 服务端 SHALL NOT 将微信登录 `code` 与手机号验证 `code` 混用

#### Scenario: 手机号验证失败

- **WHEN** 微信手机号验证接口失败、`code` 失效或服务端无法确认验证结果
- **THEN** 系统 SHALL 保持用户为未完成手机号验证状态
- **AND** 小程序 SHALL 展示可重试的明确提示
- **AND** API SHALL NOT 因验证失败绕过发布门槛

### Requirement: 手机号验证状态非公开

系统 SHALL 将手机号验证状态作为内部发布门槛和后台合规状态，不 SHALL 将其作为公开身份信息、作者标签或社交资产展示。

#### Scenario: 公开社区内容不展示手机号验证状态

- **WHEN** API 返回帖子列表、帖子详情、评论、回复、作者快照、个人公开主页或社区通知
- **THEN** 响应 SHALL NOT 包含完整手机号、手机号尾号或手机号验证展示字段
- **AND** 小程序 SHALL NOT 展示“已验证手机号”、认证徽章或手机号尾号

#### Scenario: 用户本人页面不常驻展示手机号验证状态

- **WHEN** 用户打开“我的”页或个人主页
- **THEN** 小程序 SHALL NOT 将手机号验证状态作为常驻身份资产展示
- **AND** 小程序 MAY 在用户尝试发帖、评论或回复时提示需要完成手机号验证

#### Scenario: 后台常规治理只展示验证布尔状态

- **WHEN** 后台读取社区治理详情或作者治理摘要
- **THEN** 后台响应 MAY 包含用户是否完成手机号验证的布尔状态
- **AND** 后台响应 SHALL NOT 包含完整手机号或手机号尾号

### Requirement: 社区 IP 属地归因

系统 SHALL 在发帖、评论和回复创建时由服务端从可信请求来源识别客户端 IP，并生成发布时 IP 属地快照。

#### Scenario: 服务端生成发布时 IP 属地

- **WHEN** 用户成功创建社区帖子、评论或回复
- **THEN** API SHALL 从服务端请求上下文识别客户端 IP
- **AND** API SHALL 保存发布时 IP 属地快照
- **AND** API SHALL NOT 接受小程序前端传入的 IP 或 IP 属地作为事实来源

#### Scenario: 可信代理链路解析客户端 IP

- **WHEN** API 部署在 CDN、网关或反向代理之后
- **THEN** API SHALL 仅在请求来自受信任代理时读取配置允许的代理 header
- **AND** API SHALL 忽略不可信请求中的 `X-Forwarded-For` 或同类 header

#### Scenario: IP 属地解析失败

- **WHEN** 服务端无法识别客户端 IP 或无法解析属地
- **THEN** API SHALL 保存解析失败摘要或 `未知` 属地标签
- **AND** API SHALL NOT 伪造省份、国家或地区
- **AND** 后台 SHALL 可以查看解析失败摘要

#### Scenario: 历史内容不伪造属地

- **WHEN** 历史社区内容没有发布时 IP 属地快照
- **THEN** 系统 SHALL NOT 根据当前用户请求、后台猜测或客户端传值补造属地
- **AND** 公开侧 MAY 隐藏该字段或展示 `IP属地：未知`

### Requirement: IP 属地公开展示范围

系统 SHALL 以合理范围公开展示社区 IP 属地；境内展示到省、自治区或直辖市，境外展示到国家或地区。

#### Scenario: 境内 IP 属地展示

- **WHEN** 社区内容的 IP 属地解析为中国大陆境内
- **THEN** 公开侧 SHALL 最多展示省、自治区或直辖市
- **AND** 公开侧 SHALL NOT 展示市、区县、街道或完整 IP

#### Scenario: 境外 IP 属地展示

- **WHEN** 社区内容的 IP 属地解析为境外
- **THEN** 公开侧 SHALL 最多展示国家或地区
- **AND** 公开侧 SHALL NOT 展示完整 IP 或更精细地址

#### Scenario: 用户不可关闭 IP 属地

- **WHEN** 用户查看个人设置、社区设置或发布入口
- **THEN** 系统 SHALL NOT 提供关闭、隐藏或自定义 IP 属地展示的开关

### Requirement: IP 属地展示位置

系统 SHALL 在个人主页和社区内容详情中提供 IP 属地展示位，并 SHALL 在提审包和生产环境默认展示这些展示位。

#### Scenario: 个人主页展示最近公开发布 IP 属地

- **WHEN** 用户打开某个用户的个人主页
- **THEN** 页面 SHALL 展示该用户最近一次公开发布行为对应的 IP 属地
- **AND** 页面 SHALL NOT 展示完整 IP 或手机号验证状态

#### Scenario: 帖子详情展示发布时 IP 属地

- **WHEN** 用户打开帖子详情页
- **THEN** 页面 SHALL 在作者信息、发布时间或相邻弱化信息行展示该帖子的发布时 IP 属地
- **AND** 页面 SHALL NOT 将 IP 属地做成醒目认证徽章

#### Scenario: 评论和回复展示发布时 IP 属地

- **WHEN** 用户查看帖子详情中的评论或回复
- **THEN** 页面 SHALL 在评论或回复作者信息区域展示对应内容的发布时 IP 属地
- **AND** 小屏布局 SHALL 保持文本不溢出且不遮挡正文

#### Scenario: 帖子列表不强制展示 IP 属地

- **WHEN** 用户查看社区帖子列表
- **THEN** 页面 MAY 不展示 IP 属地
- **AND** 列表不展示 IP 属地 SHALL NOT 影响帖子详情、评论、回复和个人主页展示

#### Scenario: 提审和生产环境不得关闭展示位

- **WHEN** 构建提审包或生产包
- **THEN** 帖子详情、评论、回复和个人主页的 IP 属地展示位 SHALL 默认开启
- **AND** 系统 SHALL NOT 通过普通用户配置关闭这些展示位

### Requirement: 身份与 IP 敏感字段边界

系统 SHALL 在公开响应、后台响应、日志和验证中保持手机号、微信身份和明文 IP 的最小暴露边界。

#### Scenario: 公开响应过滤敏感身份字段

- **WHEN** 普通用户读取社区公开内容、个人主页、评论、回复或通知
- **THEN** 响应 SHALL NOT 包含完整手机号、手机号尾号、微信 openid、微信 unionid、微信 sessionKey、用户登录态、明文 IP 或 IP 哈希
- **AND** 响应 MAY 包含降精度后的 `ipLocationLabel`

#### Scenario: 后台响应过滤明文 IP 和完整手机号

- **WHEN** 后台读取社区治理详情、审核队列、作者治理摘要或举报处理详情
- **THEN** 响应 SHALL NOT 包含完整手机号、明文 IP、微信 openid、微信 unionid、微信 sessionKey 或用户登录态
- **AND** 响应 MAY 包含手机号验证布尔状态、隐私同意版本、IP 属地标签和解析失败摘要

#### Scenario: 验证脚本检查敏感字段黑名单

- **WHEN** 开发者运行社区身份与 IP 相关验证命令
- **THEN** 验证 SHALL 检查公开响应和后台响应不包含完整手机号、明文 IP、微信身份或登录态
- **AND** 验证 SHALL 检查提审/生产配置不会关闭 IP 属地展示位
