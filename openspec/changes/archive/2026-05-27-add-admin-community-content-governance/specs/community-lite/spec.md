## ADDED Requirements

### Requirement: 社区内容移除语义

系统 SHALL 支持后台对社区帖子、评论和回复执行软删除或移除语义，并 SHALL 保留内容、上下文和治理审计记录。

#### Scenario: 后台移除帖子

- **WHEN** 后台用户对社区帖子执行移除操作
- **THEN** 系统 SHALL 将该帖子从公开列表、公开详情、我的收藏和公开引用入口中移除
- **AND** 系统 SHALL 保留帖子原文、作者快照、评论上下文、举报记录和治理审计记录

#### Scenario: 后台移除评论或回复

- **WHEN** 后台用户对社区评论或回复执行移除操作
- **THEN** 系统 SHALL 将对应评论或回复从公开评论区移除
- **AND** 系统 SHALL 保留原文、作者快照、关联帖子和治理审计记录

#### Scenario: 公开查询过滤移除内容

- **WHEN** 普通用户请求社区帖子列表、帖子详情、评论列表、我的收藏或我的论坛内容
- **THEN** API SHALL NOT 将已移除内容表达为可公开互动内容
- **AND** 已移除内容 SHALL NOT 被表达为正常公开内容

### Requirement: 社区用户治理状态

系统 SHALL 维护社区用户治理状态，用于表达正常、限制、禁言和社区封禁。

#### Scenario: 用户默认治理状态

- **WHEN** 用户首次创建或尚无社区治理记录
- **THEN** 系统 SHALL 将其视为 `normal` 社区治理状态
- **AND** 该默认状态 SHALL NOT 阻止其在满足身份门槛和审核规则时使用社区写操作

#### Scenario: 用户被设置为限制状态

- **WHEN** 后台将用户设置为 `limited`
- **THEN** 系统 SHALL 对该用户的发帖、评论和回复采用更严格审核策略
- **AND** 系统 SHALL NOT 因低风险快速通道直接公开该用户的新评论或回复

#### Scenario: 用户被禁言

- **WHEN** 后台将用户设置为 `muted`
- **THEN** 系统 SHALL 拒绝该用户发帖、评论、回复和上传社区图片
- **AND** 系统 SHALL 返回客户端可识别的社区禁言提示

#### Scenario: 用户被社区封禁

- **WHEN** 后台将用户设置为 `banned`
- **THEN** 系统 SHALL 拒绝该用户执行社区写操作
- **AND** 系统 SHALL 返回客户端可识别的社区封禁提示

### Requirement: 被限制用户写操作拦截

社区服务 SHALL 在发帖、评论、回复和社区图片上传等写入口统一检查用户治理状态。

#### Scenario: 被禁言用户发帖

- **WHEN** 被禁言用户尝试创建社区帖子
- **THEN** API SHALL 拒绝该操作
- **AND** API SHALL NOT 创建新的待审核帖子

#### Scenario: 被封禁用户评论

- **WHEN** 被社区封禁用户尝试评论或回复
- **THEN** API SHALL 拒绝该操作
- **AND** API SHALL NOT 创建新的评论或回复记录

#### Scenario: 被限制用户上传社区图片

- **WHEN** 被禁言或社区封禁用户尝试上传社区媒体资产
- **THEN** API SHALL 拒绝该上传
- **AND** API SHALL NOT 创建新的可绑定社区媒体资产

#### Scenario: 限制过期后恢复写操作

- **WHEN** 用户的禁言、限制或封禁期限已经到期
- **THEN** 系统 SHALL 不再因该过期治理记录拒绝用户社区写操作
- **AND** 系统 SHALL 继续执行身份门槛、分区权限和内容审核规则

### Requirement: 社区 IP 风险信息边界

系统 MAY 记录脱敏或哈希后的 IP 风险信息用于后台排查、限流或后续风控，但 SHALL NOT 将明文 IP 作为第一版社区封禁的必要条件。

#### Scenario: 创建社区内容时记录 IP 风险信息

- **WHEN** 服务端需要记录社区内容提交来源风险
- **THEN** 系统 MAY 保存脱敏 IP、IP 哈希或风险摘要
- **AND** 系统 SHALL NOT 在社区公开响应中返回该信息

#### Scenario: 后台响应不暴露明文 IP

- **WHEN** 后台读取社区帖子总览、治理详情或作者治理详情
- **THEN** 响应 SHALL NOT 包含明文 IP
- **AND** 如返回 IP 风险信息，响应 SHALL 仅包含脱敏值、哈希摘要或风险标签

#### Scenario: 封禁不依赖 IP

- **WHEN** 后台封禁社区用户
- **THEN** 系统 SHALL 允许仅基于 `userId` 完成封禁
- **AND** 系统 SHALL NOT 要求必须存在 IP 记录
