## ADDED Requirements

### Requirement: 社区分区

系统 SHALL 提供轻社区第一阶段分区，包含推荐、键影、运影、策影、行影和魔王吐槽。

#### Scenario: 用户打开社区首页

- **WHEN** 用户打开社区首页
- **THEN** 小程序 SHALL 展示推荐、键影、运影、策影、行影和魔王吐槽分区入口
- **AND** 默认选中推荐分区

#### Scenario: 分区使用稳定 key

- **WHEN** API 或小程序端表达社区分区
- **THEN** 系统 SHALL 使用稳定分区 key：`recommended`、`key_shadow`、`water_escape`、`sky_strategy`、`wanderer` 和 `boss_rant`
- **AND** 阵营分区 key SHALL 复用用户成长资料中的阵营稳定 key

### Requirement: 未登录和未建档访问边界

系统 SHALL 允许未登录或未创建隐者档案的用户浏览推荐分区帖子列表预览，并 SHALL 在用户尝试完整社区操作时引导其前往“我的”页完成登录和隐者档案创建。

#### Scenario: 未登录用户浏览推荐列表

- **WHEN** 未登录用户打开社区首页
- **THEN** 小程序 SHALL 展示推荐分区的已审核帖子列表预览
- **AND** 小程序 SHALL NOT 允许用户直接进入推荐以外分区

#### Scenario: 未登录用户尝试进入帖子详情

- **WHEN** 未登录用户点击推荐列表中的帖子详情
- **THEN** 小程序 SHALL 跳转到“我的”页
- **AND** 小程序 SHALL 引导用户完成登录

#### Scenario: 未登录用户尝试社区互动

- **WHEN** 未登录用户尝试切换分区、发帖、评论、点赞、收藏或举报
- **THEN** 小程序 SHALL 跳转到“我的”页
- **AND** 小程序 SHALL 引导用户完成登录

#### Scenario: 已登录但未创建隐者档案用户尝试完整社区操作

- **WHEN** 已登录但未创建隐者档案的用户尝试进入帖子详情、切换分区、发帖、评论、点赞、收藏或举报
- **THEN** 小程序 SHALL 跳转到“我的”页
- **AND** 小程序 SHALL 引导用户创建隐者档案和阵营身份

#### Scenario: API 拒绝未满足身份门槛的操作

- **WHEN** 未登录或未创建隐者档案的请求访问社区详情、发帖、评论、点赞、收藏或举报接口
- **THEN** API SHALL 拒绝该操作
- **AND** API SHALL 返回客户端可识别的身份门槛错误

### Requirement: 社区帖子模型

系统 SHALL 定义社区帖子模型，包含标题、正文、图片预留、作者公开身份快照、作者阵营、目标分区、审核状态、发布时间和互动统计。

#### Scenario: 帖子字段可跨端复用

- **WHEN** API、小程序端或共享包需要表达社区帖子
- **THEN** 系统 SHALL 使用共享契约定义帖子 ID、标题、正文、图片 key 列表、作者公开身份快照、作者阵营 key、分区 key、审核状态、创建时间、发布时间和互动统计

#### Scenario: 图片作为预留字段

- **WHEN** 第一阶段帖子包含图片信息
- **THEN** 系统 SHALL 使用图片 key 列表作为预留表达
- **AND** 系统 SHALL NOT 要求第一阶段实现完整图片上传资产流或图片审核供应商接入

#### Scenario: 作者身份使用公开快照

- **WHEN** 帖子在公开列表或详情中展示作者
- **THEN** 系统 SHALL 只返回昵称、头像 key、阵营、等级、称号和可选徽章 key 等公开身份字段
- **AND** 系统 SHALL NOT 返回薪资、工作时间、工作档案、生存账单、消费统计、微信 openid、微信 unionid 或登录态

### Requirement: 阵营专区发帖规则

系统 SHALL 限制阵营专区只允许对应阵营用户发帖，并 SHALL 允许所有已登录且已创建隐者档案的用户浏览和互动。

#### Scenario: 同阵营用户在阵营专区发帖

- **WHEN** 已登录且已创建隐者档案的用户向自己阵营对应的分区发帖
- **THEN** API SHALL 接受合法发帖请求并创建待审核帖子

#### Scenario: 非同阵营用户在阵营专区发帖

- **WHEN** 用户向非本人阵营对应的阵营专区发帖
- **THEN** API SHALL 拒绝该发帖请求
- **AND** API SHALL 返回客户端可识别的阵营限制提示

#### Scenario: 用户在推荐或魔王吐槽发帖

- **WHEN** 已登录且已创建隐者档案的用户向推荐或魔王吐槽分区发帖
- **THEN** API SHALL 不因用户阵营不同而拒绝该发帖请求

#### Scenario: 非同阵营用户浏览和互动

- **WHEN** 已登录且已创建隐者档案的用户浏览非本人阵营专区
- **THEN** 小程序 SHALL 允许其查看已审核帖子、评论、点赞、收藏和举报
- **AND** 小程序 SHALL NOT 允许其在该阵营专区发帖

### Requirement: 帖子审核生命周期

系统 SHALL 维护帖子审核状态，包含 `pending`、`approved`、`rejected` 和 `hidden`，并 SHALL 仅公开展示人工审核通过的帖子。

#### Scenario: 用户提交帖子

- **WHEN** 用户提交合法帖子
- **THEN** API SHALL 创建状态为 `pending` 的帖子
- **AND** API SHALL NOT 将该帖子加入公开列表或公开详情

#### Scenario: 人工审核通过帖子

- **WHEN** 管理员人工审核通过待审核帖子
- **THEN** 系统 SHALL 将帖子状态更新为 `approved`
- **AND** 系统 SHALL 设置或更新帖子发布时间
- **AND** 该帖子 SHALL 可进入公开列表和公开详情

#### Scenario: 人工驳回帖子

- **WHEN** 管理员人工驳回待审核帖子
- **THEN** 系统 SHALL 将帖子状态更新为 `rejected`
- **AND** 该帖子 SHALL NOT 进入公开列表或公开详情

#### Scenario: 隐藏已公开帖子

- **WHEN** 管理员隐藏已公开帖子
- **THEN** 系统 SHALL 将帖子状态更新为 `hidden`
- **AND** 该帖子 SHALL 从公开列表和公开详情中移除

#### Scenario: 普通公开查询过滤审核状态

- **WHEN** 普通用户请求帖子列表或帖子详情
- **THEN** API SHALL 只返回 `approved` 帖子
- **AND** API SHALL NOT 返回 `pending`、`rejected` 或 `hidden` 帖子作为公开内容

### Requirement: 评论与评论审核

系统 SHALL 支持已登录且已创建隐者档案的用户评论已公开帖子，并 SHALL 对评论执行公开前人工审核。

#### Scenario: 用户提交评论

- **WHEN** 用户对 `approved` 帖子提交合法评论
- **THEN** API SHALL 创建状态为 `pending` 的评论
- **AND** API SHALL NOT 将该评论加入公开评论列表

#### Scenario: 人工审核通过评论

- **WHEN** 管理员人工审核通过待审核评论
- **THEN** 系统 SHALL 将评论状态更新为 `approved`
- **AND** 该评论 SHALL 可进入公开评论列表

#### Scenario: 评论对象不是公开帖子

- **WHEN** 用户尝试评论 `pending`、`rejected` 或 `hidden` 帖子
- **THEN** API SHALL 拒绝该评论请求

#### Scenario: 普通公开查询过滤评论状态

- **WHEN** 普通用户请求帖子评论列表
- **THEN** API SHALL 只返回 `approved` 评论
- **AND** API SHALL NOT 返回 `pending`、`rejected` 或 `hidden` 评论作为公开内容

### Requirement: 社区互动

系统 SHALL 支持已登录且已创建隐者档案的用户对已公开帖子点赞、收藏，并 SHALL 提供可重复点击的取消操作。

#### Scenario: 用户点赞帖子

- **WHEN** 用户点赞 `approved` 帖子
- **THEN** API SHALL 记录该用户对该帖子的点赞状态
- **AND** API SHALL 返回更新后的点赞状态和互动统计

#### Scenario: 用户取消点赞帖子

- **WHEN** 已点赞用户取消点赞 `approved` 帖子
- **THEN** API SHALL 移除该用户对该帖子的点赞状态
- **AND** API SHALL 返回更新后的点赞状态和互动统计

#### Scenario: 用户收藏帖子

- **WHEN** 用户收藏 `approved` 帖子
- **THEN** API SHALL 记录该用户对该帖子的收藏状态
- **AND** API SHALL 返回更新后的收藏状态和互动统计

#### Scenario: 用户取消收藏帖子

- **WHEN** 已收藏用户取消收藏 `approved` 帖子
- **THEN** API SHALL 移除该用户对该帖子的收藏状态
- **AND** API SHALL 返回更新后的收藏状态和互动统计

#### Scenario: 用户互动非公开帖子

- **WHEN** 用户尝试点赞或收藏 `pending`、`rejected` 或 `hidden` 帖子
- **THEN** API SHALL 拒绝该互动请求

### Requirement: 社区举报

系统 SHALL 支持已登录且已创建隐者档案的用户举报已公开帖子或已公开评论，并 SHALL 将举报纳入后续人工处理。

#### Scenario: 用户举报帖子

- **WHEN** 用户举报 `approved` 帖子并提交合法举报原因
- **THEN** API SHALL 创建帖子举报记录
- **AND** API SHALL NOT 因单次举报自动公开展示处理结论

#### Scenario: 用户举报评论

- **WHEN** 用户举报 `approved` 评论并提交合法举报原因
- **THEN** API SHALL 创建评论举报记录
- **AND** API SHALL NOT 因单次举报自动公开展示处理结论

#### Scenario: 用户举报非公开内容

- **WHEN** 用户尝试举报 `pending`、`rejected` 或 `hidden` 内容
- **THEN** API SHALL 拒绝该举报请求

### Requirement: 社区 API 契约

系统 SHALL 提供轻社区第一阶段 API，用于帖子列表、帖子详情、发帖、评论、点赞、收藏和举报。

#### Scenario: 读取帖子列表

- **WHEN** 客户端请求社区帖子列表
- **THEN** API SHALL 支持按分区 key、排序方式、游标和数量读取帖子
- **AND** API SHALL 只返回公开可展示字段

#### Scenario: 读取帖子详情

- **WHEN** 已登录且已创建隐者档案的用户请求帖子详情
- **THEN** API SHALL 返回 `approved` 帖子的详情、作者公开身份、当前用户互动状态和互动统计

#### Scenario: 创建帖子

- **WHEN** 已登录且已创建隐者档案的用户提交合法标题、正文、图片 key 列表和分区 key
- **THEN** API SHALL 创建待审核帖子并返回提交结果

#### Scenario: 创建评论

- **WHEN** 已登录且已创建隐者档案的用户对 `approved` 帖子提交合法评论
- **THEN** API SHALL 创建待审核评论并返回提交结果

#### Scenario: 执行互动和举报

- **WHEN** 已登录且已创建隐者档案的用户对 `approved` 帖子或评论执行点赞、收藏或举报相关操作
- **THEN** API SHALL 基于当前用户身份记录操作
- **AND** API SHALL 不接受客户端伪造作者身份或阵营身份

### Requirement: 小程序社区页面

小程序端 SHALL 提供社区首页、发帖页和帖子详情页，并 SHALL 沿用视觉系统中的社区页布局模式。

#### Scenario: 社区首页渲染真实数据

- **WHEN** 已登录且已创建隐者档案的用户打开社区首页
- **THEN** 小程序 SHALL 读取社区帖子列表接口
- **AND** 页面 SHALL 展示顶部标题、内容或活动 Banner、分区 tabs、筛选 chips、发布入口、帖子卡列表和底部 tab

#### Scenario: 发帖页提交帖子

- **WHEN** 已登录且已创建隐者档案的用户打开发帖页
- **THEN** 小程序 SHALL 提供标题、正文、图片预留和分区选择
- **AND** 提交成功后 SHALL 展示待审核提示

#### Scenario: 帖子详情页展示内容

- **WHEN** 已登录且已创建隐者档案的用户打开帖子详情页
- **THEN** 小程序 SHALL 展示帖子正文、作者公开身份、互动按钮、评论列表、评论输入和举报入口

#### Scenario: 页面不再使用演示互动作为真实数据

- **WHEN** 社区页面接入真实 `community-lite` 能力
- **THEN** 小程序 SHALL 使用统一社区客户端服务访问 API
- **AND** 小程序 SHALL NOT 将本地演示帖子、演示点赞或演示收藏作为真实社区状态

### Requirement: 社区隐私边界

系统 SHALL 保证社区公开内容只展示公开身份和内容字段，不公开工作档案、薪资、工作时间、生存账单、消费统计、CPS 来源或微信身份标识。

#### Scenario: 公开帖子返回作者信息

- **WHEN** API 返回公开帖子列表、帖子详情或评论列表
- **THEN** 响应 SHALL 只包含作者公开身份快照
- **AND** 响应 SHALL NOT 包含工作档案、薪资、工作时间、隐藏模式、生存账单、消费统计、CPS 平台来源、微信 openid、微信 unionid 或登录态

#### Scenario: 社区与生存账单隔离

- **WHEN** 社区内容展示作者、阵营、等级、互动统计或举报状态
- **THEN** 系统 SHALL NOT 展示该用户的生存消耗明细、订单来源、消费分类金额或本周生存报告

#### Scenario: 社区与工作档案隔离

- **WHEN** 社区内容展示作者、阵营、等级、互动统计或举报状态
- **THEN** 系统 SHALL NOT 展示该用户的月薪、上班开始时间、上班结束时间、休息段、发薪日或隐藏模式设置
