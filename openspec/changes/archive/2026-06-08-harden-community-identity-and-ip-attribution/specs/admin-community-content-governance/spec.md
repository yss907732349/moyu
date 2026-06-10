## ADDED Requirements

### Requirement: 后台社区身份与 IP 合规摘要

后台社区治理 SHALL 在帖子、评论、回复和作者治理详情中展示必要的身份与 IP 合规摘要，并 SHALL 继续过滤完整手机号、明文 IP 和微信身份字段。

#### Scenario: 后台查看帖子治理详情

- **WHEN** 后台用户读取帖子治理详情
- **THEN** API SHALL 可以返回作者手机号验证布尔状态、隐私同意版本、帖子发布时 IP 属地标签和 IP 解析状态
- **AND** API SHALL NOT 返回完整手机号、手机号尾号、明文 IP、微信 openid、微信 unionid、微信 sessionKey 或用户登录态

#### Scenario: 后台查看评论和回复上下文

- **WHEN** 后台用户在帖子治理详情查看评论和回复上下文
- **THEN** 每条评论和回复 SHALL 可以包含发布时 IP 属地标签和 IP 解析状态
- **AND** 每条评论和回复 SHALL NOT 包含明文 IP 或 IP 来源 header

#### Scenario: 后台查看作者治理摘要

- **WHEN** 后台用户查看作者治理摘要
- **THEN** API SHALL 可以返回作者是否完成手机号验证、最近公开发布 IP 属地和当前社区治理状态
- **AND** API SHALL NOT 返回完整手机号、手机号尾号、明文 IP 或微信身份字段

#### Scenario: 后台查看 IP 解析失败内容

- **WHEN** 社区内容的 IP 属地解析失败
- **THEN** 后台 SHALL 可以看到解析失败摘要或 `未知` 标签
- **AND** 后台 SHALL NOT 因解析失败看到明文 IP

### Requirement: 后台身份与 IP 敏感字段验证

后台社区治理验证 SHALL 覆盖身份与 IP 合规摘要，并检查敏感字段不会进入后台响应。

#### Scenario: 运行后台社区治理验证

- **WHEN** 开发者运行后台社区治理验证命令
- **THEN** 验证 SHALL 检查帖子、评论、回复和作者治理详情包含必要的脱敏合规摘要
- **AND** 验证 SHALL 检查响应不包含完整手机号、明文 IP、微信 openid、微信 unionid、微信 sessionKey 或用户登录态

#### Scenario: 后台不依赖手机号或明文 IP 执行治理

- **WHEN** 后台用户隐藏、移除、限制、禁言或封禁社区用户
- **THEN** 系统 SHALL 继续以内容 ID、作者用户 ID 和治理状态执行操作
- **AND** 系统 SHALL NOT 要求后台查看完整手机号或明文 IP 才能完成治理
