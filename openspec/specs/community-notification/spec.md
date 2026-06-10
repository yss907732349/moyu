# community-notification Specification

## Purpose

TBD - created by archiving change mature-community-lite-forum-experience. Update Purpose after archive.

## Requirements

### Requirement: 社区通知模型

系统 SHALL 持久化社区通知，用于表达互动、审核结果和运营处理结果。

#### Scenario: 创建社区通知

- **WHEN** 社区互动、审核或运营处理产生需要告知用户的事件
- **THEN** 系统 SHALL 创建包含接收人、触发人、通知类型、目标对象、关联帖子、标题、正文、创建时间和读取状态的通知记录

#### Scenario: 自己操作自己内容

- **WHEN** 用户点赞、收藏、评论或回复自己的内容
- **THEN** 系统 SHALL NOT 创建面向自己的互动通知

### Requirement: 互动通知

系统 SHALL 在用户内容收到他人点赞、收藏、评论或回复时创建社区通知。

#### Scenario: 帖子收到点赞

- **WHEN** 用户的已公开帖子被其他用户点赞
- **THEN** 系统 SHALL 为帖子作者创建点赞通知
- **AND** 通知 SHALL 可跳转到对应帖子详情

#### Scenario: 帖子收到收藏

- **WHEN** 用户的已公开帖子被其他用户收藏
- **THEN** 系统 SHALL 为帖子作者创建收藏通知或收藏聚合通知
- **AND** 通知 SHALL 可跳转到对应帖子详情

#### Scenario: 帖子收到评论

- **WHEN** 用户的已公开帖子收到其他用户的已公开评论
- **THEN** 系统 SHALL 为帖子作者创建评论通知
- **AND** 通知 SHALL 展示评论作者公开身份和评论摘要

#### Scenario: 评论收到回复

- **WHEN** 用户的评论收到其他用户的已公开回复
- **THEN** 系统 SHALL 为被回复评论作者创建回复通知
- **AND** 通知 SHALL 可跳转到对应帖子详情并定位到评论区域

### Requirement: 审核结果通知

系统 SHALL 在用户提交的帖子、评论或回复审核状态产生最终结果时创建通知。

#### Scenario: 帖子人工审核通过

- **WHEN** 管理员人工审核通过用户帖子
- **THEN** 系统 SHALL 为帖子作者创建审核通过通知
- **AND** 通知 SHALL 可跳转到公开帖子详情

#### Scenario: 帖子人工驳回

- **WHEN** 管理员人工驳回用户帖子
- **THEN** 系统 SHALL 为帖子作者创建审核驳回通知
- **AND** 通知 SHALL 展示可公开给用户的驳回原因或默认提示

#### Scenario: 评论或回复 AI 审核驳回

- **WHEN** AI 审核驳回用户评论或回复
- **THEN** 系统 SHALL 为提交者创建审核驳回通知
- **AND** 通知 SHALL NOT 暴露 AI 原始 prompt、供应商配置或内部风险细节

### Requirement: 举报通知边界

系统 SHALL 为举报提交和举报处理提供克制反馈边界。举报提交成功 SHALL 通过 API 响应或页面提示告知举报人；举报处理完成后 SHALL 在必要时创建社区通知。通知 SHALL 保护举报人身份，并 SHALL NOT 暴露后台处理细节。

#### Scenario: 举报提交成功反馈

- **WHEN** 用户成功提交举报
- **THEN** API SHALL 返回举报已受理的客户端可展示消息
- **AND** 系统 SHALL NOT 默认为提交成功创建一条持久化社区通知

#### Scenario: 举报处理后通知举报人

- **WHEN** 后台人工处理用户提交的举报
- **THEN** 系统 SHALL 为举报人创建举报处理结果通知
- **AND** 通知 SHALL 只表达举报已处理或未发现明显违规等克制结论
- **AND** 通知 SHALL NOT 暴露后台备注、具体处罚、其他举报人信息或被举报作者的非公开资料

#### Scenario: 被举报内容被隐藏或移除后通知作者

- **WHEN** 后台因举报处理隐藏或移除帖子、评论或回复
- **THEN** 系统 SHALL 为内容作者创建内容处理通知
- **AND** 通知 SHALL 展示可公开给作者的处理原因或默认提示
- **AND** 通知 SHALL NOT 暴露举报人身份、举报人数量或举报人补充说明全文

#### Scenario: 举报不成立时不通知内容作者

- **WHEN** 后台将举报处理为保留内容或误报
- **THEN** 系统 SHALL NOT 因该举报向被举报内容作者创建举报相关通知
- **AND** 系统 SHALL 保留举报处理审计记录供后台查看

#### Scenario: 用户读取举报通知

- **WHEN** 用户读取社区消息页
- **THEN** API SHALL 只返回当前用户作为举报人或内容作者可见的举报相关通知
- **AND** API SHALL NOT 暴露他人的举报记录或处理通知

### Requirement: 通知读取与未读状态

系统 SHALL 支持用户读取本人社区通知、查看未读状态并标记已读。

#### Scenario: 用户读取消息页

- **WHEN** 已登录且已创建隐者档案的用户打开社区消息页
- **THEN** 小程序 SHALL 读取本人社区通知列表
- **AND** API SHALL 只返回当前用户可见的通知

#### Scenario: 用户标记通知已读

- **WHEN** 用户标记单条或全部社区通知为已读
- **THEN** API SHALL 更新对应通知的读取时间
- **AND** 后续未读数量 SHALL 排除已读通知

#### Scenario: 用户读取他人通知

- **WHEN** 用户尝试读取或标记他人的社区通知
- **THEN** API SHALL 拒绝该操作
- **AND** API SHALL NOT 暴露他人通知内容
