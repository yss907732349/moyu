## ADDED Requirements

### Requirement: 运营队列身份与 IP 合规边界

后台统一审核队列、实时待办和运营摘要 SHALL 可以展示社区内容的脱敏身份与 IP 合规摘要，但 SHALL NOT 暴露完整手机号、明文 IP 或微信身份字段。

#### Scenario: 审核队列展示 IP 属地摘要

- **WHEN** 后台用户查看社区帖子、评论或回复审核队列
- **THEN** 队列项 MAY 展示发布时 IP 属地标签、手机号验证布尔状态和隐私同意版本摘要
- **AND** 队列项 SHALL NOT 展示完整手机号、手机号尾号、明文 IP、微信 openid、微信 unionid、微信 sessionKey 或用户登录态

#### Scenario: 实时待办不暴露敏感字段

- **WHEN** 社区内容审核、举报或治理相关事件进入实时待办提示
- **THEN** 事件数据 MAY 包含降精度 IP 属地标签和必要合规状态
- **AND** 事件数据 SHALL NOT 包含完整手机号、明文 IP、微信身份、用户登录态或 IP 来源 header

#### Scenario: 后台敏感字段黑名单扩展

- **WHEN** 开发者运行后台运营验证命令
- **THEN** 验证 SHALL 将完整手机号、手机号尾号、明文 IP、IP 来源 header、微信 openid、微信 unionid、微信 sessionKey 和用户登录态纳入敏感字段黑名单
- **AND** 验证 SHALL 检查统一审核队列、实时待办和运营摘要均不返回这些字段
