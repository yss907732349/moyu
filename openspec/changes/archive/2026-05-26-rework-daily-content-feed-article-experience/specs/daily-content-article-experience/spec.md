## ADDED Requirements

### Requirement: 日报首页轻量结构

小程序 SHALL 将隐者日报首页展示为当前已发布日报的轻量入口页，包含每日一句 `今日参悟` 和两个文章栏目入口。

#### Scenario: 打开日报首页

- **WHEN** 用户打开隐者日报首页且存在当前已发布日报
- **THEN** 小程序 SHALL 展示业务日期、日报标题、首页摘要和 `今日参悟`
- **AND** 小程序 SHALL 展示 `尘世情报` 与 `离谱卷宗` 两个栏目入口卡
- **AND** 小程序 SHALL NOT 在日报首页直接铺出两个栏目所有文章正文

#### Scenario: 今日参悟是一句话

- **WHEN** 小程序展示 `今日参悟`
- **THEN** 页面 SHALL 将其展示为一句话或短段落
- **AND** 页面 SHALL 提供引用到社区发帖入口
- **AND** 页面 SHALL NOT 将 `今日参悟` 展示为文章列表或长文章详情

#### Scenario: 没有已发布日报

- **WHEN** 用户打开隐者日报首页但没有可公开的当前日报
- **THEN** 小程序 SHALL 展示日报未发布或稍后再看的空状态
- **AND** 小程序 SHALL NOT 使用本地演示日报冒充真实已发布内容

### Requirement: 日报栏目入口卡

系统 SHALL 为 `尘世情报` 和 `离谱卷宗` 提供栏目入口卡，入口卡包含栏目名称、简介、插画 key、文章数量和进入按钮。

#### Scenario: 展示栏目入口

- **WHEN** 小程序渲染日报首页
- **THEN** `world_intel` SHALL 展示为 `尘世情报`
- **AND** `absurd_casefile` SHALL 展示为 `离谱卷宗`
- **AND** 每个栏目入口 SHALL 展示名称、简介、插画 key 对应视觉和进入按钮

#### Scenario: 点击栏目入口

- **WHEN** 用户点击 `尘世情报` 或 `离谱卷宗` 栏目入口
- **THEN** 小程序 SHALL 导航到对应栏目文章列表页
- **AND** 列表页 SHALL 使用栏目稳定 key 读取文章

### Requirement: 栏目文章列表

系统 SHALL 为 `尘世情报` 和 `离谱卷宗` 分别提供最多 10 篇已发布日报文章的列表。

#### Scenario: 读取栏目文章列表

- **WHEN** 用户打开某个日报栏目列表页
- **THEN** API SHALL 返回该栏目下当前已发布日报的文章列表
- **AND** 单个栏目公开返回的文章数量 SHALL NOT 超过 10 篇

#### Scenario: 文章列表展示字段

- **WHEN** 小程序展示栏目文章列表
- **THEN** 每篇文章 SHALL 展示标题、摘要、封面或插画 key、公开来源说明、点赞统计、评论统计和进入详情入口
- **AND** 页面 SHALL NOT 展示 AI 原始 prompt、审核备注、内部风险标签或供应商配置

#### Scenario: 非公开文章不可见

- **WHEN** 普通用户请求未发布、已归档、已驳回或后台草稿中的日报文章
- **THEN** API SHALL 拒绝公开访问或返回不可见结果

### Requirement: 日报文章详情

小程序 SHALL 提供日报文章详情页，用于展示已发布日报文章正文、来源说明、互动统计、评论区和引用发帖入口。

#### Scenario: 打开文章详情

- **WHEN** 用户点击栏目列表中的文章
- **THEN** 小程序 SHALL 打开文章详情页
- **AND** 页面 SHALL 展示文章标题、摘要、正文、栏目名称、发布日期、公开来源说明和互动统计

#### Scenario: 详情页移动端可读

- **WHEN** 小程序渲染文章详情页
- **THEN** 页面 SHALL 使用暗黑忍者 RPG 面板、清晰描边、可读字号和稳定间距
- **AND** 页面 SHALL 保持小屏幕文字、按钮和评论区域不重叠

### Requirement: 日报文章点赞

系统 SHALL 支持已登录且已创建隐者档案的用户点赞或取消点赞已发布日报文章。

#### Scenario: 点赞日报文章

- **WHEN** 已登录且已创建隐者档案的用户点赞已发布日报文章
- **THEN** API SHALL 记录该用户的点赞状态
- **AND** API SHALL 返回更新后的点赞状态和点赞统计

#### Scenario: 取消点赞日报文章

- **WHEN** 已点赞用户取消点赞已发布日报文章
- **THEN** API SHALL 移除该用户的点赞状态
- **AND** API SHALL 返回更新后的点赞状态和点赞统计

#### Scenario: 身份门槛不足时点赞

- **WHEN** 未登录或未创建隐者档案的用户尝试点赞日报文章
- **THEN** 小程序 SHALL 引导用户前往“我的”页完成登录和隐者档案创建
- **AND** API SHALL 拒绝未满足身份门槛的点赞请求

### Requirement: 日报文章评论

系统 SHALL 支持已登录且已创建隐者档案的用户评论已发布日报文章，并 SHALL 对评论执行公开前审核。

#### Scenario: 提交文章评论

- **WHEN** 已登录且已创建隐者档案的用户对已发布日报文章提交合法评论
- **THEN** API SHALL 创建状态为 `pending` 的评论
- **AND** API SHALL NOT 在审核通过前将该评论加入公开评论列表

#### Scenario: 公开文章评论

- **WHEN** 管理员人工审核通过日报文章评论
- **THEN** 系统 SHALL 将评论状态更新为 `approved`
- **AND** 该评论 SHALL 可进入文章详情页公开评论列表

#### Scenario: 评论公开身份边界

- **WHEN** API 返回日报文章公开评论列表
- **THEN** 响应 SHALL 只包含评论内容、互动统计和作者公开身份快照
- **AND** 响应 SHALL NOT 包含薪资、工作时间、工作档案、生存账单、消费统计、微信 openid、微信 unionid 或登录态

### Requirement: 日报转发为社区引用

系统 SHALL 将日报转发定义为引用到社区发帖，支持从 `今日参悟` 或具体日报文章创建社区发帖草稿。

#### Scenario: 引用今日参悟发帖

- **WHEN** 用户点击 `今日参悟` 的引用入口
- **THEN** 小程序 SHALL 打开社区发帖体验
- **AND** 发帖草稿 SHALL 携带来源类型 `daily_reflection`、日报 ID、业务日期、参悟正文和引用提示

#### Scenario: 引用日报文章发帖

- **WHEN** 用户点击日报文章详情页的转发或引用入口
- **THEN** 小程序 SHALL 打开社区发帖体验
- **AND** 发帖草稿 SHALL 携带来源类型 `daily_article`、日报 ID、文章 ID、栏目 key、标题、摘要和引用提示

#### Scenario: 引用发帖仍走审核

- **WHEN** 用户提交带日报引用的社区帖子
- **THEN** API SHALL 按 `community-lite` 发帖规则创建待审核帖子
- **AND** API SHALL NOT 因引用来源为官方日报而在正式审核机制下直接公开帖子

### Requirement: 文章化 AI 草稿

系统 SHALL 支持 AI 生成文章化隐者日报草稿，结构包含每日参悟、两个栏目入口元数据和每个栏目最多 10 篇文章。

#### Scenario: 生成文章化草稿

- **WHEN** 授权后台用户请求生成隐者日报 AI 草稿
- **THEN** 系统 SHALL 生成每日参悟、`尘世情报` 栏目文章和 `离谱卷宗` 栏目文章
- **AND** 每个栏目草稿文章数量 SHALL NOT 超过 10 篇
- **AND** 草稿 SHALL NOT 因生成完成而自动公开

#### Scenario: 后台编辑文章化草稿

- **WHEN** 授权后台用户编辑日报草稿
- **THEN** 后台 SHALL 允许编辑每日参悟、栏目名称、栏目简介、插画 key、文章标题、摘要、正文、来源说明和引用提示

#### Scenario: 真实内容来源边界

- **WHEN** AI 生成或后台编辑 `尘世情报` 与 `离谱卷宗` 的文章
- **THEN** 系统 SHALL 保存可追溯来源输入或公开来源说明
- **AND** 缺少来源的内容 SHALL NOT 被表达为真实新闻或已核验事实
