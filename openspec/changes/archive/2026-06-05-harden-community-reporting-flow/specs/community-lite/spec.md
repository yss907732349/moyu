## MODIFIED Requirements

### Requirement: 社区举报

系统 SHALL 支持已登录且已创建隐者档案的用户举报已公开帖子、已公开评论或已公开回复，并 SHALL 将通过服务端校验的举报纳入后续人工处理。举报请求 SHALL 使用稳定举报原因分类和可选补充说明；系统 SHALL 防止重复举报、自己举报自己、非公开内容举报和异常频率举报影响后台队列质量。

#### Scenario: 用户举报帖子

- **WHEN** 用户举报 `approved` 帖子并提交合法举报原因分类
- **THEN** API SHALL 创建帖子举报记录或返回该用户对同一帖子的既有举报受理状态
- **AND** API SHALL NOT 因单次举报自动公开展示处理结论
- **AND** API SHALL NOT 因单次举报自动隐藏帖子

#### Scenario: 用户举报评论

- **WHEN** 用户举报 `approved` 评论并提交合法举报原因分类
- **THEN** API SHALL 创建评论举报记录或返回该用户对同一评论的既有举报受理状态
- **AND** API SHALL NOT 因单次举报自动公开展示处理结论
- **AND** API SHALL NOT 因单次举报自动隐藏评论

#### Scenario: 用户举报回复

- **WHEN** 用户举报 `approved` 回复并提交合法举报原因分类
- **THEN** API SHALL 创建回复举报记录或返回该用户对同一回复的既有举报受理状态
- **AND** API SHALL NOT 因单次举报自动公开展示处理结论
- **AND** API SHALL NOT 因单次举报自动隐藏回复

#### Scenario: 提交结构化举报原因

- **WHEN** 用户提交举报请求
- **THEN** API SHALL 校验 `reasonCode` 是否属于稳定举报原因集合
- **AND** API SHALL 接受长度受限的 `reasonText` 作为补充说明
- **AND** 当 `reasonCode` 为 `other` 时 API SHALL 要求提供非空补充说明

#### Scenario: 用户重复举报同一对象

- **WHEN** 同一用户重复举报同一帖子、评论或回复
- **THEN** API SHALL NOT 创建重复举报记录
- **AND** API SHALL 返回当前举报已受理或已处理的客户端可识别状态

#### Scenario: 用户举报自己内容

- **WHEN** 用户举报自己发布的帖子、评论或回复
- **THEN** API SHALL 拒绝该举报请求
- **AND** API SHALL NOT 创建举报记录

#### Scenario: 用户举报非公开内容

- **WHEN** 用户尝试举报 `pending`、`rejected`、`hidden` 或 `removed` 内容
- **THEN** API SHALL 拒绝该举报请求
- **AND** API SHALL NOT 暴露该非公开内容的额外审核或治理细节

#### Scenario: 用户举报频率异常

- **WHEN** 用户在限制窗口内超过举报频率上限
- **THEN** API SHALL 拒绝或延迟受理新的举报请求
- **AND** API SHALL 返回客户端可理解的频率限制提示

### Requirement: 社区举报处理

后台 SHALL 提供社区举报人工处理能力，管理员可保留、隐藏、移除或标记误报，并记录处理人、处理时间、处理动作、处理备注和由该举报触发的内容治理结果。举报处理 SHALL 以人工审核结论为准；系统 SHALL NOT 将未处理举报直接计为有效举报。

#### Scenario: 管理员处理帖子举报

- **WHEN** 管理员处理帖子举报并选择隐藏内容
- **THEN** 系统 SHALL 将对应帖子更新为 `hidden`
- **AND** 系统 SHALL 将该举报标记为已隐藏处理
- **AND** 系统 SHALL 记录处理人、处理时间、处理动作和处理备注

#### Scenario: 管理员处理评论或回复举报

- **WHEN** 管理员处理评论或回复举报并选择隐藏内容
- **THEN** 系统 SHALL 将对应评论或回复更新为 `hidden`
- **AND** 该内容 SHALL 从公开评论区移除
- **AND** 系统 SHALL 将该举报标记为已隐藏处理

#### Scenario: 管理员移除被举报内容

- **WHEN** 管理员处理举报并选择移除帖子、评论或回复
- **THEN** 系统 SHALL 将对应内容更新为 `removed`
- **AND** 系统 SHALL 保留原文、作者快照、举报记录和治理审计记录
- **AND** 系统 SHALL 将该举报标记为已移除处理

#### Scenario: 管理员保留被举报内容

- **WHEN** 管理员判断内容无需隐藏或移除
- **THEN** 系统 SHALL 保留被举报内容的当前公开状态
- **AND** 系统 SHALL 将举报标记为已处理且内容保留
- **AND** 系统 SHALL NOT 将该举报计为被举报作者的有效举报

#### Scenario: 管理员标记举报误报

- **WHEN** 管理员判断举报明显不成立或存在滥用迹象
- **THEN** 系统 SHALL 保留被举报内容的当前公开状态
- **AND** 系统 SHALL 将举报标记为误报
- **AND** 系统 SHALL NOT 将该举报计为被举报作者的有效举报

## ADDED Requirements

### Requirement: 小程序举报体验

小程序端 SHALL 在社区帖子详情页为公开帖子、公开评论和公开回复提供真实举报面板，使用户可以选择举报原因、填写补充说明、确认提交并获得明确反馈。

#### Scenario: 打开举报面板

- **WHEN** 已登录且已创建隐者档案的用户点击公开帖子、评论或回复的举报入口
- **THEN** 小程序 SHALL 展示举报原因选项、补充说明输入、取消操作和提交操作
- **AND** 小程序 SHALL 展示被举报对象的轻量摘要，帮助用户确认举报目标

#### Scenario: 提交举报成功

- **WHEN** 用户选择合法举报原因并提交举报成功
- **THEN** 小程序 SHALL 展示举报已受理提示
- **AND** 小程序 SHALL 将该对象在当前页面标记为已举报或禁用重复提交入口

#### Scenario: 举报失败

- **WHEN** 举报请求因未登录、未建档、重复提交、频率限制或目标不可举报失败
- **THEN** 小程序 SHALL 展示服务端返回的明确提示
- **AND** 小程序 SHALL NOT 伪造举报已受理状态
