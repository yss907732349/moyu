## ADDED Requirements

### Requirement: 社区写操作身份门槛升级

社区发帖、评论和回复 SHALL 在既有登录、隐者档案和用户治理状态检查之外，额外要求用户已同意当前隐私政策/社区用户协议并完成手机号验证。

#### Scenario: 已完成身份门槛的用户发帖

- **WHEN** 用户已登录、已创建隐者档案、已同意当前隐私政策和社区用户协议、已完成手机号验证
- **AND** 用户未被禁言或社区封禁
- **THEN** API SHALL 继续按分区权限、内容安全和审核生命周期处理发帖请求

#### Scenario: 未完成手机号验证的用户发帖

- **WHEN** 用户已登录且已创建隐者档案但未完成手机号验证
- **AND** 用户尝试创建社区帖子
- **THEN** API SHALL 拒绝该请求
- **AND** API SHALL NOT 创建 `pending` 帖子
- **AND** 小程序 SHALL 引导用户先完成隐私同意和手机号验证

#### Scenario: 未完成手机号验证的用户评论或回复

- **WHEN** 用户已登录且已创建隐者档案但未完成手机号验证
- **AND** 用户尝试评论公开帖子或回复公开评论
- **THEN** API SHALL 拒绝该请求
- **AND** API SHALL NOT 创建 `approved`、`pending` 或 `rejected` 评论/回复记录

#### Scenario: 点赞收藏不强制手机号验证

- **WHEN** 已登录且已创建隐者档案的用户点赞或收藏公开帖子
- **THEN** API SHALL NOT 因用户未完成手机号验证而拒绝该互动
- **AND** API SHALL 继续按公开内容、登录态和治理状态边界处理互动

#### Scenario: 举报不强制手机号验证

- **WHEN** 已登录且已创建隐者档案的用户举报公开帖子、评论或回复
- **THEN** API SHALL NOT 因用户未完成手机号验证而拒绝举报
- **AND** API SHALL 继续执行重复举报、自己举报自己、非公开内容和频率限制校验

### Requirement: 社区内容 IP 属地快照

社区帖子、评论和回复 SHALL 保存发布时 IP 属地快照，并 SHALL 在公开详情响应中返回降精度 IP 属地标签。

#### Scenario: 创建帖子保存 IP 属地快照

- **WHEN** 用户成功创建社区帖子
- **THEN** API SHALL 保存该帖子的发布时 IP 属地快照
- **AND** 帖子公开详情响应 SHALL 可以返回降精度 `ipLocationLabel`
- **AND** 帖子列表响应 MAY 不返回或不展示该字段

#### Scenario: 创建评论保存 IP 属地快照

- **WHEN** 用户成功创建社区评论
- **THEN** API SHALL 保存该评论的发布时 IP 属地快照
- **AND** 公开评论列表 SHALL 返回该评论的降精度 `ipLocationLabel`

#### Scenario: 创建回复保存 IP 属地快照

- **WHEN** 用户成功创建社区回复
- **THEN** API SHALL 保存该回复的发布时 IP 属地快照
- **AND** 公开回复列表 SHALL 返回该回复的降精度 `ipLocationLabel`

#### Scenario: 社区公开响应不暴露明文 IP

- **WHEN** API 返回帖子、评论或回复的公开响应
- **THEN** 响应 SHALL NOT 包含明文 IP、IP 哈希、IP 来源 header 或 IP 解析原始结果
- **AND** 响应 MAY 包含 `IP属地` 所需的降精度展示标签

### Requirement: 小程序社区 IP 属地展示

小程序社区详情页 SHALL 为帖子、评论和回复展示发布时 IP 属地；社区列表页 MAY 不展示 IP 属地。

#### Scenario: 帖子详情展示 IP 属地

- **WHEN** 用户打开公开帖子详情页
- **THEN** 页面 SHALL 在帖子作者信息或发布时间附近展示该帖子的 `IP属地`
- **AND** 页面 SHALL 保持展示弱化，不将 IP 属地设计成醒目身份徽章

#### Scenario: 评论区展示 IP 属地

- **WHEN** 用户查看公开帖子评论区
- **THEN** 每条公开评论 SHALL 在作者信息区域展示评论发布时 `IP属地`
- **AND** 页面 SHALL 保持小屏文本不溢出

#### Scenario: 回复区展示 IP 属地

- **WHEN** 用户查看评论下的一层公开回复
- **THEN** 每条公开回复 SHALL 在作者信息区域展示回复发布时 `IP属地`
- **AND** 页面 SHALL NOT 因 IP 属地挤压回复正文或操作入口

#### Scenario: 社区列表保持信息密度

- **WHEN** 用户查看社区帖子列表
- **THEN** 页面 MAY 不展示帖子 IP 属地
- **AND** 用户进入帖子详情后 SHALL 能看到该帖子的 IP 属地展示位

#### Scenario: 提审和生产环境展示 IP 属地

- **WHEN** 小程序构建提审包或生产包
- **THEN** 帖子详情、评论区和回复区的 IP 属地展示 SHALL 默认开启
- **AND** 小程序 SHALL NOT 通过普通用户开关隐藏这些展示位

### Requirement: 社区身份门槛错误提示

小程序 SHALL 区分未登录、未建档、未同意隐私政策、未完成手机号验证和社区治理限制等社区写操作失败原因，并给出对应引导。

#### Scenario: 未同意隐私政策提示

- **WHEN** 社区写请求因未同意当前隐私政策或社区用户协议失败
- **THEN** 小程序 SHALL 展示隐私同意面板
- **AND** 小程序 SHALL NOT 直接展示手机号验证按钮替代隐私同意

#### Scenario: 未完成手机号验证提示

- **WHEN** 社区写请求因未完成手机号验证失败
- **THEN** 小程序 SHALL 引导用户完成手机号验证
- **AND** 验证成功后用户 MAY 返回原发布流程继续提交

#### Scenario: 社区治理限制提示

- **WHEN** 社区写请求因用户被限制、禁言或封禁失败
- **THEN** 小程序 SHALL 展示服务端返回的治理限制提示
- **AND** 小程序 SHALL NOT 将该失败误导为手机号验证问题
