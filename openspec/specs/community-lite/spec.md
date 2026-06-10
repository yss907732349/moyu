# community-lite Specification

## Purpose

TBD - created by archiving change define-community-lite-contract. Update Purpose after archive.

## Requirements

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

系统 SHALL 定义社区帖子模型，包含标题、正文、图片预留、作者公开身份快照、作者阵营、目标分区、审核状态、发布时间和互动统计。小程序端 SHALL 使用作者公开身份快照渲染可见作者信息，并 SHALL 将头像 key 或阵营信息解析为项目内置头像资产。

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

#### Scenario: 小程序渲染作者头像资产

- **WHEN** 小程序展示社区帖子、评论或回复作者
- **THEN** 小程序 SHALL 使用作者公开身份快照中的头像 key 或阵营信息渲染项目内置头像资产
- **AND** 小程序 SHALL NOT 在头像框中直接展示 `avatarKey` 字符串作为用户头像

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

系统 SHALL 维护帖子审核状态，包含 `pending`、`approved`、`rejected` 和 `hidden`，并 SHALL 仅向其他用户公开展示审核通过的帖子。统一内容安全审核 SHALL 可以在本地规则、微信文本审核和图片审核均满足公开条件时自动通过帖子；无法确认时 SHALL 进入后台人工审核。

#### Scenario: 用户提交帖子

- **WHEN** 用户提交合法帖子
- **THEN** API SHALL 创建状态为 `pending` 的帖子
- **AND** API SHALL NOT 将该帖子加入其他用户的公开列表或公开详情
- **AND** API SHALL 保存本地规则和内容安全风险判断、标签、来源和建议原因供后台参考
- **AND** 提交者本人 SHALL 可以在本人视图看到该帖子处于审核中

#### Scenario: 内容安全判定帖子可公开

- **WHEN** 本地规则未驳回帖子
- **AND** 微信文本内容安全或等价供应商明确判定标题和正文通过
- **AND** 帖子没有图片或所有图片内容安全审核均通过
- **AND** 用户治理状态不阻止公开
- **THEN** 系统 SHALL 将帖子状态更新为 `approved`
- **AND** 系统 SHALL 设置或更新帖子发布时间
- **AND** 该帖子 SHALL 可进入公开列表和公开详情

#### Scenario: 内容安全判定帖子违规

- **WHEN** 本地规则或微信内容安全明确判定帖子标题、正文或图片违规
- **THEN** 系统 SHALL 将帖子状态更新为 `rejected`
- **AND** 该帖子 SHALL NOT 进入公开列表或公开详情
- **AND** 系统 SHALL 向作者保留可展示的驳回提示

#### Scenario: 内容安全无法确认帖子

- **WHEN** 帖子文本或图片审核返回需要复核、超时、供应商错误、回调失败或无法满足 openid 条件
- **THEN** 系统 SHALL 保持帖子状态为 `pending`
- **AND** 后台 SHALL 可以人工通过、驳回或隐藏该帖子

#### Scenario: 人工审核通过帖子

- **WHEN** 管理员人工审核通过待审核帖子
- **THEN** 系统 SHALL 将帖子状态更新为 `approved`
- **AND** 系统 SHALL 设置或更新帖子发布时间
- **AND** 该帖子 SHALL 可进入公开列表和公开详情

#### Scenario: 人工驳回帖子

- **WHEN** 管理员人工驳回待审核帖子
- **THEN** 系统 SHALL 将帖子状态更新为 `rejected`
- **AND** 该帖子 SHALL NOT 进入公开列表或公开详情
- **AND** 系统 SHALL 向作者保留可展示的驳回提示

#### Scenario: 隐藏已公开帖子

- **WHEN** 管理员隐藏已公开帖子
- **THEN** 系统 SHALL 将帖子状态更新为 `hidden`
- **AND** 该帖子 SHALL 从公开列表和公开详情中移除

#### Scenario: 普通公开查询过滤审核状态

- **WHEN** 普通用户请求帖子列表或帖子详情
- **THEN** API SHALL 只返回 `approved` 帖子
- **AND** API SHALL NOT 返回 `pending`、`rejected` 或 `hidden` 帖子作为公开内容

### Requirement: 评论与评论审核

系统 SHALL 支持已登录且已创建隐者档案的用户评论已公开帖子，并 SHALL 对评论执行低成本规则、微信内容安全和人工复核的分层审核。明显违规评论 SHALL 被直接驳回；可信低风险短评论 SHALL 可以快速公开；灰区、异常用户或微信无法确认场景 SHALL 进入人工复核。公开评论列表 SHALL 只展示 `approved` 评论。

#### Scenario: 普通用户提交低风险评论

- **WHEN** 普通用户对 `approved` 帖子提交合法短评论
- **AND** 本地敏感词库、重复提交和频率限制均未命中风险
- **AND** 用户近期无违规、有效举报或社区治理限制
- **THEN** API SHALL 可以创建状态为 `approved` 的评论
- **AND** 该评论 SHALL 可进入公开评论列表
- **AND** API SHALL 返回可供客户端识别的已公开状态

#### Scenario: 用户提交明显违规评论

- **WHEN** 用户对 `approved` 帖子提交评论且本地硬规则或微信内容安全判定为明确违规
- **THEN** API SHALL 创建状态为 `rejected` 的评论或拒绝该评论公开
- **AND** 该评论 SHALL NOT 进入公开评论列表
- **AND** 系统 SHALL 记录可后台查看的风险标签、命中信息和拒绝原因

#### Scenario: 用户提交灰区评论

- **WHEN** 用户对 `approved` 帖子提交评论且本地规则判定为灰区、疑似风险、新用户风险、治理限制或异常频率
- **THEN** API SHALL 优先调用微信内容安全或等价供应商审核
- **AND** 当供应商无法确认或不可用时，API SHALL 创建状态为 `pending` 的评论
- **AND** 该评论 SHALL NOT 进入公开评论列表直到内容安全或人工复核通过
- **AND** 提交者本人 SHALL 可在帖子详情中看到该评论并识别其仅自己可见
- **AND** API SHALL 返回可供客户端识别的审核中状态

#### Scenario: 人工审核通过评论

- **WHEN** 管理员人工审核通过待复核评论
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

### Requirement: 社区 API 契约

系统 SHALL 提供轻社区第一阶段 API，用于帖子列表、帖子详情、发帖、评论、点赞、收藏和举报，并 SHALL 在评论和回复提交响应中返回客户端可识别的审核后状态。

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
- **THEN** API SHALL 按低成本分层审核结果创建 `approved`、`pending` 或 `rejected` 评论并返回提交结果
- **AND** API SHALL NOT 默认把所有合法评论都创建为待审核评论

#### Scenario: 执行互动和举报

- **WHEN** 已登录且已创建隐者档案的用户对 `approved` 帖子、评论或回复执行点赞、收藏或举报相关操作
- **THEN** API SHALL 基于当前用户身份记录操作
- **AND** API SHALL 不接受客户端伪造作者身份或阵营身份

### Requirement: 小程序社区页面

小程序端 SHALL 提供社区首页、发帖页和帖子详情页，并 SHALL 沿用视觉系统中的社区页布局模式。社区首页 SHALL 以公共浏览、分区筛选、漫画/IP 内容入口、消息提醒和发布操作为主，不 SHALL 在社区首页展示“我的帖子”入口。

#### Scenario: 社区首页渲染真实数据

- **WHEN** 已登录且已创建隐者档案的用户打开社区首页
- **THEN** 小程序 SHALL 读取社区帖子列表接口
- **AND** 页面 SHALL 展示顶部标题、漫画/IP 内容 Banner、分区 tabs、筛选控件、消息入口、发布入口、帖子卡列表和底部 tab
- **AND** 页面 SHALL NOT 展示“我的帖子”入口

#### Scenario: 社区首页保留漫画入口

- **WHEN** 用户打开社区首页
- **THEN** 小程序 SHALL 展示社区内漫画/IP 内容 Banner
- **AND** 该 Banner SHALL 作为漫画/IP 内容在社区页内的公开入口
- **AND** 该 Banner SHALL NOT 使用“模块封印中”“敬请期待”等无操作价值占位文案作为主要表达

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

### Requirement: 日报多来源引用发帖

社区发帖能力 SHALL 支持从隐者日报每日参悟和日报文章携带引用快照创建待审核帖子。

#### Scenario: 创建带每日参悟引用的帖子

- **WHEN** 已登录且已创建隐者档案的用户从 `今日参悟` 提交社区帖子
- **THEN** API SHALL 按社区发帖规则创建帖子
- **AND** 帖子 SHALL 保存来源类型 `daily_reflection`、日报 ID、业务日期、参悟正文和引用提示的公开快照

#### Scenario: 创建带日报文章引用的帖子

- **WHEN** 已登录且已创建隐者档案的用户从已发布日报文章提交社区帖子
- **THEN** API SHALL 按社区发帖规则创建帖子
- **AND** 帖子 SHALL 保存来源类型 `daily_article`、日报 ID、文章 ID、栏目 key、引用标题和引用摘要的公开快照

#### Scenario: 日报引用不绕过正式审核

- **WHEN** 用户提交带日报引用的社区帖子
- **THEN** API SHALL 创建状态为 `pending` 的帖子
- **AND** API SHALL NOT 因引用来源为官方日报而直接公开帖子

#### Scenario: 公开展示日报引用

- **WHEN** 带日报引用的社区帖子通过人工审核并公开展示
- **THEN** 公开响应 SHALL 可以展示日报引用类型、标题或参悟正文、摘要、栏目名称和跳转到日报公开资源的标识
- **AND** 公开响应 SHALL NOT 暴露日报后台审核备注、AI 原始 prompt、内部风险标签或供应商配置

#### Scenario: 非公开日报资源不得被引用

- **WHEN** 用户尝试引用未发布、已归档、已驳回或不可公开访问的日报资源创建社区帖子
- **THEN** API SHALL 拒绝创建该引用帖子

### Requirement: 社区发帖页承接日报参悟引用

社区发帖页 SHALL 支持承接来自隐者日报首页的 `daily_reflection` 引用草稿，展示引用来源，并在提交时将引用快照传给社区发帖能力。

#### Scenario: 承接今日参悟引用草稿

- **WHEN** 社区发帖页通过页面参数、本地草稿或统一客户端状态接收到 `daily_reflection` 引用草稿
- **THEN** 页面 SHALL 展示来源类型、业务日期、参悟正文和引用提示
- **AND** 页面 SHALL 允许用户补充帖子标题、正文、分区和图片

#### Scenario: 提交带今日参悟引用的帖子

- **WHEN** 已登录且已创建隐者档案的用户提交带 `daily_reflection` 引用草稿的社区帖子
- **THEN** API SHALL 按社区发帖规则创建帖子
- **AND** 帖子 SHALL 保存日报 ID、业务日期、参悟正文和引用提示的公开快照
- **AND** 帖子 SHALL 保持 `pending` 或社区规则决定的非公开初始状态，不因引用官方日报而自动公开

#### Scenario: 公开帖子展示今日参悟引用

- **WHEN** 带 `daily_reflection` 引用的社区帖子通过审核并进入公开列表或详情
- **THEN** 公开响应 SHALL 可以展示 `引用今日参悟`、业务日期、参悟正文和跳回日报公开资源的标识
- **AND** 公开响应 SHALL NOT 暴露日报后台审核备注、AI 原始 prompt、内部风险标签或供应商配置

#### Scenario: 拒绝无效今日参悟引用

- **WHEN** 用户提交的 `daily_reflection` 引用指向不存在、未发布或不可公开访问的日报参悟
- **THEN** API SHALL 拒绝创建该引用帖子
- **AND** API SHALL 返回客户端可识别的引用不可用提示

### Requirement: 社区内容 AI 审核

论坛帖子、论坛评论和回复 SHALL 接入统一内容安全流程。第一版 SHALL 以前置本地低成本审核为门禁，明确违规直接驳回，可信低风险评论和回复快速公开；帖子和图片 SHALL 在微信内容安全或等价供应商通过后公开，无法确认进入后台人工审核。

#### Scenario: 帖子进入内容安全审核

- **WHEN** 已登录且已创建隐者档案的用户提交论坛帖子
- **THEN** 系统 SHALL 创建 `pending` 帖子
- **AND** 系统 SHALL 执行本地低成本审核并保存风险标签、命中信息和建议原因
- **AND** 系统 SHALL 在未被本地规则驳回时继续执行微信内容安全或等价供应商审核

#### Scenario: 帖子内容安全通过

- **WHEN** 帖子文本和所有图片均通过内容安全审核
- **AND** 用户治理状态允许公开
- **THEN** 系统 SHALL 将帖子更新为 `approved`
- **AND** 公开社区列表和详情 SHALL 可以展示该帖子

#### Scenario: 帖子明确违规

- **WHEN** 本地低成本审核或内容安全供应商明确判定帖子内容违规
- **THEN** 系统 SHALL 将帖子设为 `rejected`
- **AND** 后台 SHALL 可以查看审核原因和风险标签

#### Scenario: 评论快速通过

- **WHEN** 已登录且已创建隐者档案的用户提交论坛评论
- **AND** 本地低成本审核判定评论低风险且用户满足可信快速通道
- **THEN** 系统 SHALL 将评论状态设为 `approved`
- **AND** 公开评论列表 SHALL 可以展示该评论

#### Scenario: 评论自动驳回或人工复核

- **WHEN** 本地低成本审核或内容安全供应商明确判定论坛评论违规
- **THEN** 系统 SHALL 将评论状态设为 `rejected`
- **AND** 公开评论列表 SHALL NOT 展示该评论
- **WHEN** 本地审核无法确认、用户风险较高、频率异常、内容安全供应商超时或供应商不可用
- **THEN** 系统 SHALL 将评论状态设为 `pending`
- **AND** 后台 SHALL 可以人工通过、驳回或隐藏该评论

### Requirement: 社区测试免审核移除

论坛帖子和评论 SHALL NOT 通过测试免审核配置绕过审核生命周期。

#### Scenario: 测试配置不直接公开社区内容

- **WHEN** 系统处于本地或测试环境
- **AND** 用户提交论坛帖子或评论
- **THEN** 系统 SHALL 仍执行 AI 审核或进入人工审核降级
- **AND** 系统 SHALL NOT 因 `REVIEW_BYPASS_FOR_TESTING` 或同等配置直接公开帖子或评论

### Requirement: 社区评论回复

系统 SHALL 支持已登录且已创建隐者档案的用户对已公开评论发布一层回复，并 SHALL 将回复纳入低成本内容审核、公开展示、举报和通知边界。可信低风险回复 SHALL 自动公开；明确违规回复 SHALL 被驳回；灰区回复 SHALL 进入人工复核。

#### Scenario: 用户回复公开评论

- **WHEN** 用户对已公开帖子下的已公开评论提交合法回复
- **THEN** API SHALL 创建回复并执行低成本内容审核
- **AND** 低风险可信回复 SHALL 公开展示
- **AND** 明确违规回复 SHALL 被驳回，灰区回复 SHALL 进入人工复核
- **AND** 灰区回复在人工复核通过前 SHALL 仅提交者本人可见

#### Scenario: 用户回复非公开评论

- **WHEN** 用户尝试回复 `pending`、`rejected` 或 `hidden` 评论
- **THEN** API SHALL 拒绝该回复请求
- **AND** 回复 SHALL NOT 公开展示

#### Scenario: 回复不支持多级嵌套

- **WHEN** 用户尝试对回复继续回复
- **THEN** 系统 SHALL 将该操作转换为对原评论的一层回复或拒绝该操作
- **AND** API SHALL NOT 创建无限层级回复结构

### Requirement: 我的论坛内容

小程序端 SHALL 提供用户本人论坛内容视图，覆盖帖子、评论、回复和收藏，并清晰展示审核状态。个人论坛内容入口 SHALL 从“我的”页进入，社区首页不 SHALL 作为“我的帖子”的入口来源。

#### Scenario: 用户查看我的帖子

- **WHEN** 已登录且已创建隐者档案的用户打开我的帖子
- **THEN** 小程序 SHALL 展示本人帖子及其 `pending`、`approved`、`rejected` 或 `hidden` 状态
- **AND** 被驳回帖子 SHALL 展示可公开给用户的审核提示

#### Scenario: 用户查看我的评论和回复

- **WHEN** 用户打开我的评论或我的回复
- **THEN** 小程序 SHALL 展示本人评论或回复及其审核状态
- **AND** 非公开评论或回复 SHALL NOT 被表达为已经公开

#### Scenario: 用户查看我的收藏

- **WHEN** 用户打开我的收藏
- **THEN** 小程序 SHALL 展示本人收藏的仍然公开可见帖子
- **AND** 已隐藏或已删除的帖子 SHALL 展示不可用状态或从列表移除

#### Scenario: 我的论坛入口从个人页进入

- **WHEN** 用户需要查看我的帖子、我的收藏或论坛消息
- **THEN** 小程序 SHALL 在“我的”页提供对应入口
- **AND** 社区首页 SHALL NOT 展示“我的帖子”入口

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

### Requirement: 社区后台权限

社区后台审核、复核、举报处理和隐藏接口 SHALL 校验后台令牌。

#### Scenario: 无后台令牌访问社区后台接口

- **WHEN** 请求未携带有效后台令牌访问 `admin/community` 接口
- **THEN** API SHALL 拒绝请求
- **AND** API SHALL NOT 返回待审核内容、举报内容或执行审核操作

#### Scenario: 有效后台令牌访问社区后台接口

- **WHEN** 请求携带有效后台令牌访问社区后台接口
- **THEN** API SHALL 允许读取待处理队列或执行合法审核处理

### Requirement: 社区成熟体验验证

项目 SHALL 提供覆盖成熟论坛核心链路的验证脚本。

#### Scenario: 运行社区成熟体验验证

- **WHEN** 开发者运行社区相关验证命令
- **THEN** 验证 SHALL 覆盖帖子人工审核、评论 AI 审核、回复 AI 审核、图片资产展示、通知生成、后台权限和举报处理
- **AND** 验证失败 SHALL 阻断该 change 验收

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

### Requirement: 社区首跑空状态

小程序社区 SHALL 针对未登录、已登录未建档、已建档无内容和接口错误展示可区分的空状态或错误态。

#### Scenario: 未登录用户查看推荐分区空列表

- **WHEN** 未登录用户打开社区推荐分区
- **AND** 当前没有公开帖子
- **THEN** 小程序 SHALL 展示推荐分区暂无公开内容的空状态
- **AND** 小程序 SHALL 引导用户登录并创建隐者档案后参与发帖或互动

#### Scenario: 已登录未建档用户查看社区空列表

- **WHEN** 已登录但未创建隐者档案的用户打开社区
- **AND** 当前分区没有公开帖子
- **THEN** 小程序 SHALL 提示创建隐者档案后可发帖、评论、收藏和接收通知
- **AND** 小程序 SHALL 提供进入创建隐者档案流程的入口

#### Scenario: 已建档用户查看空分区

- **WHEN** 已创建隐者档案的用户查看某个没有公开帖子的分区
- **THEN** 小程序 SHALL 展示该分区暂无公开内容
- **AND** 如果用户具备该分区发帖权限，小程序 SHALL 可以引导发布第一帖并说明需审核后公开

#### Scenario: 社区接口错误

- **WHEN** 社区列表 API 不可用或返回错误
- **THEN** 小程序 SHALL 展示社区暂不可用或重试提示
- **AND** 小程序 SHALL NOT 将接口错误伪装为真实无内容状态

### Requirement: 社区开发演示种子边界

系统 MAY 提供开发或演示环境的已审核社区帖子种子数据，但生产环境 SHALL 不默认注入伪造用户帖子。

#### Scenario: 开发环境使用社区种子帖

- **WHEN** 开发者显式运行社区种子初始化脚本或启用演示数据准备流程
- **THEN** 系统 MAY 创建少量 `approved` 示例帖子用于验证社区列表和详情
- **AND** 种子帖子 SHALL 仅用于开发、测试或演示环境

#### Scenario: 种子帖子公开身份边界

- **WHEN** 社区种子帖子进入公开列表或详情
- **THEN** 公开响应 SHALL 仍只包含允许公开的作者快照字段
- **AND** 公开响应 SHALL NOT 暴露薪资、工作档案、生存账单、微信身份或后台审核内部字段

#### Scenario: 生产环境不默认注入 UGC

- **WHEN** 生产环境社区没有用户发布并审核通过的帖子
- **THEN** 社区公开列表 SHALL 返回空列表
- **AND** 系统 SHALL NOT 默认注入假用户帖子作为真实社区内容

### Requirement: 社区列表视觉打磨

社区列表 SHALL 使用生产级 Banner、统一空状态、身份引导和稳定帖子缩略图，保持公共浏览和发帖主流程可读。

#### Scenario: 社区 Banner 展示世界观入口

- **WHEN** 用户打开社区首页
- **THEN** 页面 SHALL 展示承载漫画/IP 内容入口、世界观内容入口或活动入口的生产级 Banner
- **AND** Banner SHALL NOT 使用“模块封印中”“敬请期待”或无操作价值占位文案作为主要表达

#### Scenario: 社区空列表展示状态视觉

- **WHEN** 社区列表没有公开帖子或接口读取失败
- **THEN** 页面 SHALL 展示统一空状态或错误状态视觉、原因说明和可恢复操作
- **AND** 页面 SHALL NOT 使用本地演示帖子冒充真实社区内容

#### Scenario: 未登录或未建档引导进入身份链路

- **WHEN** 未登录或未创建隐者档案的用户打开社区列表
- **THEN** 页面 SHALL 使用统一身份引导视觉提示登录或建档
- **AND** 页面 SHALL 不展示可提交发帖的主行动

#### Scenario: 帖子缩略图不破坏列表密度

- **WHEN** 社区列表展示带图片帖子
- **THEN** 缩略图 SHALL 使用固定容器和裁切填充方式展示
- **AND** 单个帖子 SHALL NOT 因原始图片比例过高而占用异常大屏幕空间

### Requirement: 社区作者自见乐观发布体验

社区 SHALL 支持作者提交后立即在本人视图看到待审核帖子、评论和回复，但 SHALL 在审核通过前阻止其他用户看到这些内容。

#### Scenario: 作者查看待审核帖子

- **WHEN** 用户提交社区帖子后该帖子仍处于 `pending`
- **THEN** 提交者本人 SHALL 可以在我的帖子、提交后的详情或等价本人视图看到该帖子
- **AND** 该帖子 SHALL 标记为仅作者可见或审核中
- **AND** 其他用户 SHALL NOT 在公开社区列表或详情中看到该帖子

#### Scenario: 作者查看待审核评论或回复

- **WHEN** 用户提交评论或回复后该内容仍处于 `pending`
- **THEN** 提交者本人 SHALL 可以在帖子详情中看到该评论或回复
- **AND** 该内容 SHALL 标记为仅作者可见或审核中
- **AND** 其他用户 SHALL NOT 在公开评论区看到该评论或回复

#### Scenario: 小程序不误导为已公开

- **WHEN** 小程序展示仅作者可见的帖子、评论或回复
- **THEN** 页面 SHALL 使用轻量状态提示表达审核中或通过后其他人可见
- **AND** 页面 SHALL NOT 将未公开内容表达为已经对所有用户公开

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

### Requirement: 社区作者公开个人页入口

小程序社区帖子、评论和回复 SHALL 将可访问作者的头像或昵称作为进入公开个人页的入口，并 SHALL 保持社区内容审核和公开字段过滤边界。

#### Scenario: 点击帖子作者进入公开个人页

- **WHEN** 已登录且已创建隐者档案的用户在帖子详情页点击公开帖子作者头像或昵称
- **THEN** 小程序 SHALL 使用作者公开个人页标识进入该作者公开个人页
- **AND** 小程序 SHALL NOT 使用作者昵称、微信身份字段或手机号拼接公开个人页路由

#### Scenario: 点击评论作者进入公开个人页

- **WHEN** 已登录且已创建隐者档案的用户在评论区点击公开评论作者头像或昵称
- **THEN** 小程序 SHALL 使用评论作者公开个人页标识进入该作者公开个人页
- **AND** 评论正文、操作入口和举报入口 SHALL 保持可用

#### Scenario: 点击回复作者进入公开个人页

- **WHEN** 已登录且已创建隐者档案的用户在回复区点击公开回复作者头像或昵称
- **THEN** 小程序 SHALL 使用回复作者公开个人页标识进入该作者公开个人页
- **AND** 回复正文、操作入口和举报入口 SHALL 保持可用

#### Scenario: 作者入口不改变审核可见性

- **WHEN** 用户查看帖子、评论或回复作者入口
- **THEN** 小程序 SHALL 只为当前用户可见的公开内容或作者本人可见内容渲染入口
- **AND** 公开个人页 SHALL NOT 因作者入口暴露待审核、已驳回、已隐藏或已移除内容

#### Scenario: 种子或无映射作者不可进入生产公开页

- **WHEN** 帖子、评论或回复作者没有真实应用内用户映射或没有合法公开个人页标识
- **THEN** 小程序 SHALL 展示作者公开快照
- **AND** 小程序 SHALL NOT 将该作者头像或昵称作为可进入公开个人页的入口

### Requirement: 社区作者入口敏感字段边界

社区作者公开个人页入口 SHALL 继续复用作者公开快照和公开个人页标识，不 SHALL 扩大社区公开响应字段。

#### Scenario: 作者入口响应不暴露敏感字段

- **WHEN** API 返回帖子详情、评论列表或回复列表以支持作者公开个人页入口
- **THEN** 作者信息 SHALL 仍只包含昵称、头像 key、阵营、等级、称号、可选徽章 key 和公开个人页标识等公开字段
- **AND** 响应 SHALL NOT 包含薪资、工作时间、工作档案、隐藏模式、生存账单、消费统计、CPS 来源、手机号、手机号验证状态、微信 `openid`、微信 `unionid`、登录态、隐币、能量、后台治理状态或内容安全内部风险信息

#### Scenario: 入口失败不暴露内部原因

- **WHEN** 用户点击作者入口但目标公开个人页不可访问
- **THEN** 小程序 SHALL 展示泛化不可访问提示
- **AND** 小程序 SHALL NOT 展示目标用户后台治理状态、内部用户 ID、手机号状态或内容安全原因

### Requirement: 社区作者入口可点击感

小程序社区帖子详情、评论区和回复区 SHALL 让可访问作者头像和昵称具备清晰但克制的可点击感。

#### Scenario: 帖子作者入口可识别

- **WHEN** 帖子详情作者拥有合法公开个人页标识
- **THEN** 小程序 SHALL 将作者头像和昵称展示为可点击入口
- **AND** 入口 SHALL 具备视觉暗示、稳定点击热区和按压态
- **AND** 小程序 SHALL 使用公开个人页标识跳转，不使用昵称、手机号、微信身份或内部可枚举 ID 拼接路由

#### Scenario: 评论作者入口可识别

- **WHEN** 评论作者拥有合法公开个人页标识
- **THEN** 小程序 SHALL 将评论作者头像和昵称展示为可点击入口
- **AND** 点击热区 SHALL 不覆盖评论正文、回复入口、举报入口或其他评论操作
- **AND** 按压态 SHALL 不造成评论内容重排

#### Scenario: 回复作者入口可识别

- **WHEN** 回复作者拥有合法公开个人页标识
- **THEN** 小程序 SHALL 将回复作者头像和昵称展示为可点击入口
- **AND** 点击热区 SHALL 不覆盖回复正文、举报入口或其他回复操作
- **AND** 按压态 SHALL 不造成回复内容重排

#### Scenario: 不可点击作者不伪造入口

- **WHEN** 帖子、评论或回复作者来自开发种子、兼容历史快照、无真实用户映射或缺少合法公开个人页标识
- **THEN** 小程序 SHALL 只展示作者公开快照
- **AND** 小程序 SHALL NOT 显示主页箭头、可点击描边、入口按压态或可访问公开个人页的提示
- **AND** 小程序 SHALL NOT 为该作者伪造公开个人页、粉丝数、关注数或公开帖子

#### Scenario: 作者入口失败提示

- **WHEN** 用户点击作者入口但公开个人页不可访问
- **THEN** 小程序 SHALL 展示泛化不可访问提示
- **AND** 小程序 SHALL NOT 展示目标用户内部 ID、手机号状态、后台治理状态、内容安全原因、数据库错误或堆栈信息

### Requirement: 社区作者入口字段边界加固

社区作者入口 SHALL 复用最小公开作者快照和公开个人页标识，不 SHALL 为可点击体验扩大公开响应字段。

#### Scenario: 作者入口响应保持最小字段

- **WHEN** API 返回帖子详情、评论列表或回复列表以支持作者入口
- **THEN** 作者信息 SHALL 仍只包含昵称、头像 key、阵营、等级、称号、可选徽章 key 和公开个人页标识等公开字段
- **AND** 响应 SHALL NOT 包含手机号、手机号尾号、手机号验证状态、真实姓名、完整 IP、IP 来源 header、微信 `openid`、微信 `unionid`、微信 `sessionKey`、应用登录态、薪资、工作时间、工作档案、隐藏模式、隐币、能量、生存账单、CPS 来源、后台治理状态、内容安全内部风险信息或后台审核备注

#### Scenario: IP 属地不进入作者入口主信息

- **WHEN** 帖子详情、评论区或回复区展示作者入口
- **THEN** 作者入口 MAY 在内容元信息中展示内容发布时降精度 IP 属地
- **AND** IP 属地 SHALL NOT 成为作者昵称、头像、阵营、等级或入口点击暗示的主视觉元素
- **AND** 响应 SHALL NOT 返回完整 IP、市、区县、街道、IP 来源 header 或解析原始结果
