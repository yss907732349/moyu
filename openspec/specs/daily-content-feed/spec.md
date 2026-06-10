# daily-content-feed Specification

## Purpose

`daily-content-feed` 用于定义隐者日报的公开响应、来源边界、草稿审核和文章化内容结构。

## Requirements

### Requirement: 日报公开响应文章化

隐者日报公开响应 SHALL 从三板块正文直出调整为文章化结构，包含首页轻量摘要、每日参悟、大陆新闻入口、离谱卷宗栏目入口和文章列表/详情资源。大陆新闻入口 SHALL 指向独立大陆新闻内容库，而不是返回某个日报 `world_intel` 板块内的文章列表。

#### Scenario: 读取日报摘要

- **WHEN** 小程序读取当前已发布日报摘要
- **THEN** API SHALL 返回业务日期、标题、首页摘要、每日参悟、大陆新闻入口摘要和离谱卷宗入口摘要
- **AND** API SHALL NOT 在摘要响应中返回大陆新闻或离谱卷宗所有文章正文

#### Scenario: 读取日报文章资源

- **WHEN** 小程序读取日报栏目列表或文章详情
- **THEN** API SHALL 只返回已发布日报下对应栏目的公开文章字段
- **AND** 大陆新闻列表和详情 SHALL 使用大陆新闻独立内容库资源
- **AND** API SHALL NOT 返回后台草稿、审核备注、AI 原始 prompt、内部风险标签或供应商配置

### Requirement: 旧内容项迁移边界

系统 SHALL 为现有三板块内容项提供迁移或兼容策略，使已发布测试日报可以进入新的文章化展示结构。大陆新闻 `world_intel` 内容项 SHALL 迁移或兼容为独立大陆新闻文章，不再受单个日报栏目 10 篇公开上限约束。

#### Scenario: 迁移今日参悟

- **WHEN** 系统遇到旧结构中的 `daily_reflection` 内容项
- **THEN** 系统 SHALL 将其迁移或映射为每日参悟正文
- **AND** 系统 SHALL NOT 将其作为栏目文章公开展示

#### Scenario: 迁移大陆新闻内容

- **WHEN** 系统遇到旧结构中的 `world_intel` 内容项
- **THEN** 系统 SHALL 将其迁移或映射为独立大陆新闻文章
- **AND** 公开大陆新闻文章数量 SHALL NOT 受单个日报栏目 10 篇上限约束

#### Scenario: 迁移离谱卷宗内容

- **WHEN** 系统遇到旧结构中的 `absurd_casefile` 内容项
- **THEN** 系统 SHALL 将其迁移或映射为离谱卷宗栏目的文章
- **AND** 单个离谱卷宗栏目公开文章数量 SHALL NOT 超过 10 篇

### Requirement: 日报人工采编

隐者日报 SHALL 由后台运营人工创建、编辑、预览和发布，不再依赖第三方来源自动采集。后台编辑能力 SHALL 支持今日参悟、离谱卷宗栏目文章、来源字段、配图字段、文章增删和排序的完整运营流程。大陆新闻 SHALL 从日报人工采编中拆出，由独立大陆新闻后台管理能力承载。后台第一阶段 SHALL 使用轻量发布流程，允许运营在发布前校验通过后直接立即发布或设置定时发布，不强制经过提交审核和审核通过步骤。

#### Scenario: 人工创建日报草稿

- **WHEN** 授权后台用户创建隐者日报草稿
- **THEN** 系统 SHALL 允许手动填写业务日期、日报标题、首页摘要、今日参悟、离谱卷宗文章标题、摘要、正文和来源字段
- **AND** 来源字段 SHALL 包含来源类型、可选的来源说明、来源站点、来源标题、来源 URL、配图 URL 和发布时间
- **AND** 系统 SHALL NOT 要求在日报草稿中维护大陆新闻文章列表

#### Scenario: 后台增删栏目文章

- **WHEN** 后台编辑离谱卷宗
- **THEN** 系统 SHALL 允许运营新增、删除和编辑栏目文章
- **AND** 系统 SHALL 保持离谱卷宗最多 10 篇文章

#### Scenario: 后台调整栏目文章顺序

- **WHEN** 后台调整离谱卷宗文章排序
- **THEN** 系统 SHALL 保存排序结果
- **AND** 公开栏目列表 SHALL 按保存后的顺序展示

#### Scenario: 日报栏目数量

- **WHEN** 后台编辑日报内容
- **THEN** 离谱卷宗 SHALL 最多保存 10 篇文章
- **AND** 今日参悟 SHALL 最多保存 1 条可引用短句或短段落
- **AND** 大陆新闻 SHALL NOT 使用日报栏目数量规则限制文章总量或单次新增数量

#### Scenario: 人工发布官方日报

- **WHEN** 后台运营完成日报编辑并选择立即发布
- **THEN** 系统 SHALL 执行发布前校验
- **AND** 校验通过后系统 SHALL 将日报公开发布
- **AND** 系统 SHALL NOT 因 AI 判断安全而自动公开日报

#### Scenario: 人工设置定时发布

- **WHEN** 后台运营完成日报编辑并选择定时发布
- **THEN** 系统 SHALL 执行发布前校验并保存计划发布时间
- **AND** 系统 SHALL NOT 因 AI 判断安全而自动设置定时发布

### Requirement: 日报定时发布

日报后台 SHALL 支持已通过发布前校验的日报设置定时发布，并 SHALL 在到达计划时间后自动公开发布。

#### Scenario: 设置定时发布

- **WHEN** 后台用户为草稿日报设置晚于当前时间的定时发布时间
- **THEN** 系统 SHALL 执行发布前校验
- **AND** 校验通过后系统 SHALL 将日报状态设为 `scheduled` 并保存 `scheduledPublishAt`

#### Scenario: 定时时间无效

- **WHEN** 后台用户设置空值、格式无效或不晚于当前时间的定时发布时间
- **THEN** 系统 SHALL 拒绝设置定时发布
- **AND** 后台 SHALL 展示可理解的错误提示

#### Scenario: 修改定时发布时间

- **WHEN** 后台用户修改 `scheduled` 日报的定时发布时间
- **THEN** 系统 SHALL 重新校验新的定时发布时间
- **AND** 系统 SHALL 保存新的 `scheduledPublishAt`

#### Scenario: 取消定时发布

- **WHEN** 后台用户取消 `scheduled` 日报的定时发布
- **THEN** 系统 SHALL 将日报恢复为 `draft`
- **AND** 系统 SHALL 清除或停用原定时发布时间

#### Scenario: 到点自动发布

- **WHEN** 系统检测到 `scheduled` 日报的 `scheduledPublishAt` 已到达或早于当前时间
- **THEN** 系统 SHALL 再次执行发布前校验
- **AND** 校验通过后系统 SHALL 将日报状态设为 `published` 并设置公开发布时间

#### Scenario: 到点发布校验失败

- **WHEN** 定时日报到点但发布前校验失败
- **THEN** 系统 SHALL 保持日报未公开
- **AND** 后台 SHALL 能看到该日报仍需人工处理

### Requirement: 日报 AI 辅助改写

日报后台 SHALL 支持 AI 基于运营已输入内容进行改写、润色、摘要生成、标题建议和风险提示。

#### Scenario: AI 基于当前编辑内容处理

- **WHEN** 后台用户请求 AI 辅助处理日报草稿
- **THEN** 系统 SHALL 将当前草稿文本和人工来源字段传给 AI
- **AND** AI SHALL 只基于这些输入输出改写建议、摘要、标题建议和风险提示

#### Scenario: AI 不得编造来源

- **WHEN** AI 返回日报改写结果
- **THEN** 系统 SHALL 保留人工输入的 `sourceUrl`、`imageUrl`、来源标题和来源站点
- **AND** 系统 SHALL NOT 接收 AI 新增、替换或伪造的来源链接、配图链接或来源站点

### Requirement: 日报评论 AI 审核

日报文章评论 SHALL 接入统一内容安全审核，先执行本地低成本规则，再按需调用微信文本内容安全或等价供应商。明确安全自动公开，明确违规自动驳回，无法确认进入后台人工审核。

#### Scenario: 评论自动通过

- **WHEN** 已登录且已创建隐者档案的用户提交日报文章评论
- **AND** 本地规则未命中风险
- **AND** 内容安全供应商明确判定该评论合规
- **THEN** 系统 SHALL 将评论状态设为 `approved`
- **AND** 公开评论列表 SHALL 可以展示该评论

#### Scenario: 评论自动驳回

- **WHEN** 用户提交的日报文章评论被本地规则或内容安全供应商明确判定为违规
- **THEN** 系统 SHALL 将评论状态设为 `rejected`
- **AND** 公开评论列表 SHALL NOT 展示该评论
- **AND** 系统 SHALL 记录归一化审核原因和风险标签供后台排查

#### Scenario: 评论进入人工审核

- **WHEN** 内容安全供应商无法确认、返回需要复核、超时或供应商不可用
- **THEN** 系统 SHALL 将评论状态设为 `pending`
- **AND** 提交者本人 SHALL 可以看到该评论处于审核中
- **AND** 后台 SHALL 可以人工通过、驳回或隐藏该评论

### Requirement: 日报测试免审核移除

日报内容和日报评论 SHALL NOT 通过测试免审核配置绕过正式审核生命周期。

#### Scenario: 测试配置不直接公开评论

- **WHEN** 系统处于本地或测试环境
- **AND** 用户提交日报文章评论
- **THEN** 系统 SHALL 仍执行 AI 审核或进入人工审核降级
- **AND** 系统 SHALL NOT 因 `REVIEW_BYPASS_FOR_TESTING` 或同等配置直接公开评论

### Requirement: 日报公开响应边界

公开日报响应 SHALL 只暴露可公开内容和可公开来源字段，不得暴露 AI 原始 prompt、供应商响应、后台审核备注或内部风险细节。

#### Scenario: 公开文章来源字段

- **WHEN** 普通用户读取日报栏目列表或文章详情
- **THEN** API SHALL 返回公开来源说明、来源站点、来源标题、来源 URL 和可用图片 URL
- **AND** API SHALL NOT 返回 AI 原始 prompt、供应商响应、后台审核备注、内部风险标签或密钥配置

### Requirement: 日报后台编辑校验

日报后台 SHALL 在保存、预览、立即发布和定时发布前提供可读的编辑校验结果，覆盖栏目数量、文章数量、文章来源类型、外部采编来源完整性、正文长度、配图缺失和可引用状态。

#### Scenario: 后台查看编辑问题

- **WHEN** 后台用户编辑隐者日报草稿
- **THEN** 系统 SHALL 展示当前日报的字段级问题或提示
- **AND** 系统 SHALL 区分阻断发布的问题和仅建议优化的问题

#### Scenario: 保存存在非阻断问题的草稿

- **WHEN** 日报草稿存在配图缺失、原创内容缺少外部来源或来源说明不完整等非阻断问题
- **THEN** 后台 SHALL 允许保存草稿
- **AND** 系统 SHALL 保留问题提示供运营继续补齐

#### Scenario: 发布原创日报文章

- **WHEN** 离谱卷宗文章标记为原创内容
- **THEN** 系统 SHALL NOT 因该文章缺少来源 URL、来源标题或来源站点而拒绝公开发布
- **AND** 如果原创文章填写了来源 URL，系统 SHALL 校验 URL 格式

#### Scenario: 发布外部采编日报文章

- **WHEN** 离谱卷宗文章标记为外部采编内容且缺少来源 URL、来源标题或来源站点
- **THEN** 系统 SHALL 拒绝立即发布、设置定时发布或到点自动发布
- **AND** 后台 SHALL 展示需要补齐的文章和字段

#### Scenario: AI 不得伪造来源类型

- **WHEN** AI 辅助处理日报内容
- **THEN** 系统 SHALL NOT 接受 AI 将无来源内容伪装为外部采编来源
- **AND** 系统 SHALL 以后台运营明确选择或保存的来源类型作为发布校验依据

### Requirement: 日报图片上传安全边界

日报后台图片上传 SHALL 在开发期提供基础压缩、缩略图和大小限制，避免后台误传大图导致 API 或前端加载压力异常。

#### Scenario: 后台上传日报图片时自动压缩

- **WHEN** 后台运营上传 jpg、png 或 webp 图片作为日报插图或正文图片
- **THEN** 后台 SHALL 在发送给 API 前将图片按最长边限制进行压缩
- **AND** API SHALL 继续拒绝超过服务端大小上限的图片

#### Scenario: 后台上传日报图片时生成缩略图

- **WHEN** 后台运营上传支持压缩的日报图片
- **THEN** 后台 SHALL 同步生成缩略图数据并提交给 API
- **AND** API SHALL 保存缩略图并在上传响应中返回缩略图公开路径

#### Scenario: 不支持压缩的图片类型

- **WHEN** 后台运营上传 gif 或浏览器无法解码的图片
- **THEN** 后台 MAY 保留原图上传
- **AND** API SHALL 继续执行 MIME 类型和大小限制

### Requirement: 日报发布前预览

日报后台 SHALL 提供发布前预览能力，使运营在发布前查看与小程序公开响应一致的日报摘要、栏目列表和文章详情。

#### Scenario: 后台预览日报摘要

- **WHEN** 授权后台用户请求预览日报
- **THEN** API SHALL 返回按公开响应结构生成的日报摘要预览
- **AND** 预览 SHALL NOT 暴露 AI 原始 prompt、供应商响应、密钥配置或内部风险细节

#### Scenario: 后台预览文章详情

- **WHEN** 授权后台用户预览某篇日报文章
- **THEN** API SHALL 返回与小程序文章详情一致的标题、摘要、正文、来源和配图字段
- **AND** API SHALL 标记该响应为预览用途，不改变日报状态

#### Scenario: 普通用户不能访问预览

- **WHEN** 未携带有效后台令牌的请求访问日报预览接口
- **THEN** API SHALL 拒绝请求
- **AND** API SHALL NOT 返回草稿或未发布日报内容

### Requirement: 日报数据库编辑持久化

系统 SHALL 在数据库模式下持久化日报主表、栏目和文章内容的编辑结果，确保后台保存后公开侧和后台读取结果一致。

#### Scenario: 保存栏目摘要和插画

- **WHEN** 后台用户保存栏目摘要或插画 key
- **THEN** API SHALL 持久化对应 `DailyContentSection` 更新
- **AND** 后续后台读取 SHALL 返回保存后的栏目字段

#### Scenario: 保存文章内容和来源

- **WHEN** 后台用户保存文章标题、摘要、正文、来源字段、配图 URL 或引用提示
- **THEN** API SHALL 持久化对应 `DailyContentItem` 更新
- **AND** 后续公开预览和发布后公开读取 SHALL 使用保存后的文章字段

#### Scenario: 调整文章顺序

- **WHEN** 后台用户调整栏目内文章顺序
- **THEN** API SHALL 持久化排序结果
- **AND** 栏目公开文章列表 SHALL 按保存后的顺序返回

### Requirement: 日报评论持久化

日报文章评论 SHALL 持久化保存评论正文、作者公开快照、审核状态、AI 审核痕迹和人工复核结果。

#### Scenario: 用户提交日报评论

- **WHEN** 已登录且已创建隐者档案的用户提交日报文章评论
- **THEN** API SHALL 持久化评论记录
- **AND** 评论 SHALL 保存作者公开身份快照和初始审核状态

#### Scenario: 公开读取文章评论

- **WHEN** 普通用户读取日报文章详情
- **THEN** API SHALL 只返回 `approved` 评论
- **AND** API SHALL NOT 返回 `pending`、`rejected` 或 `hidden` 评论作为公开内容

#### Scenario: 后台复核待审核评论

- **WHEN** 管理员人工通过或驳回待审核日报评论
- **THEN** 系统 SHALL 持久化评论审核状态、复核人、复核时间和复核备注
- **AND** 后续公开读取 SHALL 按最新状态过滤评论

### Requirement: 小程序日报公开体验优化

小程序日报页面 SHALL 对无配图、来源缺失、评论审核中、引用不可用和空栏目状态提供清晰、非演示化的展示。

#### Scenario: 文章没有配图

- **WHEN** 日报文章没有可用图片 URL
- **THEN** 小程序 SHALL 展示符合隐者日报视觉的内容占位或直接省略图片区域
- **AND** 小程序 SHALL NOT 展示破损图片或把占位 key 当作真实图片 URL

#### Scenario: 评论提交后待审核

- **WHEN** 用户提交日报评论后状态为 `pending`
- **THEN** 小程序 SHALL 提示评论已进入审核
- **AND** 小程序 SHALL NOT 立即把该评论加入公开评论列表

#### Scenario: 引用发帖不可用

- **WHEN** 日报文章或今日参悟不允许引用到社区
- **THEN** 小程序 SHALL 禁用引用发帖入口或展示不可用提示
- **AND** 小程序 SHALL NOT 创建无效社区发帖草稿

#### Scenario: 栏目暂无文章

- **WHEN** 已发布日报的某个文章栏目没有公开文章
- **THEN** 小程序 SHALL 展示空栏目状态
- **AND** 小程序 SHALL NOT 使用本地演示文章填充该栏目

### Requirement: 日报首跑空状态

小程序日报入口和日报页面 SHALL 在没有已发布日报时展示清晰空状态，不得使用本地演示文章填充真实日报状态。

#### Scenario: 首页没有已发布日报

- **WHEN** 首页读取日报摘要且 API 返回无已发布日报
- **THEN** 首页日报卡 SHALL 展示今日卷轴尚未公开或等价空状态
- **AND** 首页 SHALL NOT 展示本地演示标题、演示文章或假发布时间作为真实日报

#### Scenario: 日报首页没有已发布日报

- **WHEN** 用户进入隐者日报首页且当前没有已发布日报
- **THEN** 小程序 SHALL 展示空状态和可返回首页的正常界面
- **AND** 页面 SHALL NOT 因无内容而报错或展示破损栏目列表

#### Scenario: 已发布日报栏目为空

- **WHEN** 已发布日报的某个文章栏目没有公开文章
- **THEN** 小程序 SHALL 展示该栏目暂无文章状态
- **AND** 小程序 SHALL NOT 使用本地演示文章填充该栏目

### Requirement: 日报开发演示种子策略

系统 MAY 提供开发或演示环境的已发布日报种子数据，但生产公开侧 SHALL 不自动伪造今日日报。

#### Scenario: 开发环境使用日报种子

- **WHEN** 开发者显式运行日报种子初始化脚本或启用演示数据准备流程
- **THEN** 系统 MAY 创建一份满足发布规则的已发布日报
- **AND** 该日报 SHALL 支持首页摘要、日报首页、栏目列表和文章详情链路验证

#### Scenario: 种子日报来源完整

- **WHEN** 种子日报包含外部采编文章
- **THEN** 种子数据 SHALL 提供来源标题、来源站点和来源 URL
- **AND** 种子数据 SHALL NOT 编造无法追溯的外部采编来源

#### Scenario: 生产环境不自动伪造日报

- **WHEN** 生产环境没有运营发布的日报
- **THEN** 公开侧 SHALL 返回无已发布日报状态或空状态
- **AND** 系统 SHALL NOT 自动生成假日报作为真实官方内容

### Requirement: 日报板块级后台保存

日报后台 SHALL 支持按 `sectionKey` 新建并保存 `今日参悟` 或 `离谱卷宗` 的单板块内容记录，并 SHALL 保证保存一个板块时不覆盖、删除或归档其他板块记录。大陆新闻 SHALL 不再作为日报板块级保存对象。

#### Scenario: 单独保存今日参悟

- **WHEN** 授权后台用户只保存 `daily_reflection` 板块
- **THEN** API SHALL 只更新该 `daily_reflection` 板块记录
- **AND** API SHALL 保持 `absurd_casefile` 的草稿或已发布记录不变

#### Scenario: 单独保存离谱卷宗

- **WHEN** 授权后台用户只保存 `absurd_casefile` 板块
- **THEN** API SHALL 只更新该 `absurd_casefile` 板块记录的摘要、插画、文章、来源字段和排序
- **AND** API SHALL 保持 `daily_reflection` 的草稿或已发布记录不变

#### Scenario: 拒绝按日报板块保存大陆新闻

- **WHEN** 后台请求通过日报板块级保存接口保存 `world_intel`
- **THEN** API SHALL 拒绝请求或提示使用大陆新闻独立管理接口
- **AND** API SHALL NOT 修改任何日报草稿内容

#### Scenario: 非法板块 key

- **WHEN** 后台请求使用不属于日报可编辑板块的 `sectionKey`
- **THEN** API SHALL 拒绝保存
- **AND** API SHALL NOT 修改任何日报草稿内容

### Requirement: 日报板块级发布检查

日报后台 SHALL 支持按板块执行发布前校验，并 SHALL 只用目标板块的阻断项判断该板块是否可发布。

#### Scenario: 当前板块可发布

- **WHEN** 后台用户查看 `absurd_casefile` 的板块级发布检查
- **THEN** API SHALL 返回 `absurd_casefile` 相关的阻断项和提示项
- **AND** `daily_reflection` 的问题 SHALL NOT 阻止 `absurd_casefile` 的板块级发布判断

#### Scenario: 外部采编来源缺失

- **WHEN** 目标板块内存在标记为外部采编但缺少来源 URL、来源标题或来源站点的文章
- **THEN** 板块级发布检查 SHALL 返回阻断项
- **AND** 后台 SHALL 不允许发布该板块

#### Scenario: 原创文章缺少外部来源

- **WHEN** 目标板块内文章标记为原创内容且未填写外部来源 URL、来源标题或来源站点
- **THEN** 板块级发布检查 SHALL NOT 因缺少外部来源阻止发布
- **AND** 如果原创文章填写了来源 URL，系统 SHALL 校验 URL 格式

### Requirement: 日报板块级预览

日报后台 SHALL 支持按板块预览当前草稿的公开效果，并 SHALL 不改变日报状态。

#### Scenario: 预览今日参悟

- **WHEN** 授权后台用户请求预览 `daily_reflection`
- **THEN** API SHALL 返回与小程序今日参悟公开展示一致的预览字段
- **AND** API SHALL 标记该响应为预览用途

#### Scenario: 预览文章栏目

- **WHEN** 授权后台用户请求预览 `absurd_casefile`
- **THEN** API SHALL 返回该栏目入口摘要、插画和文章列表预览
- **AND** API SHALL NOT 返回其他板块的正文或文章列表作为当前板块预览内容

#### Scenario: 预览栏目文章

- **WHEN** 授权后台用户请求预览某篇日报文章
- **THEN** API SHALL 返回该文章与小程序文章详情一致的标题、摘要、正文、来源和配图字段
- **AND** API SHALL NOT 改变文章或日报发布状态

### Requirement: 日报板块级发布

日报后台 SHALL 支持单独发布 `今日参悟` 或 `离谱卷宗` 的板块记录，并 SHALL 不要求其他未发布板块同时满足发布条件。大陆新闻 SHALL 通过独立大陆新闻发布能力公开，不再通过日报 `publish-sections` 发布。

#### Scenario: 发布单个板块

- **WHEN** 授权后台用户发布某一个日报可编辑板块
- **THEN** 系统 SHALL 在发布前保存并校验该板块的最新内容
- **AND** 校验通过后系统 SHALL 公开该板块记录
- **AND** 系统 SHALL NOT 因其他板块为空、来源缺失或草稿未完成而拒绝本次板块发布
- **AND** 系统 SHALL NOT 清空、删除或归档其他板块记录

#### Scenario: 拒绝通过日报发布大陆新闻

- **WHEN** 后台用户请求通过日报板块发布接口发布 `world_intel`
- **THEN** API SHALL 拒绝请求或提示使用大陆新闻独立发布接口
- **AND** API SHALL NOT 覆盖、删除或归档任何已发布大陆新闻文章

#### Scenario: 单板块发布失败

- **WHEN** 目标板块未通过板块级发布检查
- **THEN** 系统 SHALL 拒绝公开该板块
- **AND** 系统 SHALL 保持已有公开日报内容不被本次失败操作覆盖

#### Scenario: 公开侧组合最新板块

- **WHEN** 小程序读取当前日报摘要
- **THEN** API SHALL 分别选择 `daily_reflection` 和 `absurd_casefile` 的最新已发布记录组合公开响应
- **AND** 大陆新闻入口 SHALL 从独立大陆新闻内容库读取公开计数或近期摘要
- **AND** 任一日报板块未发布 SHALL NOT 阻止其他已发布板块公开展示

#### Scenario: 定时发布单个板块

- **WHEN** 后台用户为某个日报可编辑板块记录设置晚于当前时间的定时发布时间
- **THEN** 系统 SHALL 只校验并定时该板块记录
- **AND** 到点发布 SHALL NOT 要求其他板块同时满足发布条件

### Requirement: 日报评论作者自见

日报文章评论 SHALL 支持提交者本人即时看到待审核评论，但 SHALL 在审核通过前阻止其他用户看到该评论。

#### Scenario: 作者查看待审核日报评论

- **WHEN** 用户提交日报文章评论后评论状态为 `pending`
- **THEN** 提交者本人 SHALL 可以在文章详情中看到该评论
- **AND** 该评论 SHALL 标记为仅作者自己可见或审核中
- **AND** 其他用户 SHALL NOT 在公开评论列表中看到该评论

#### Scenario: 日报评论审核通过后公开

- **WHEN** 待审核日报评论经内容安全或人工复核通过
- **THEN** 系统 SHALL 将评论状态更新为 `approved`
- **AND** 公开文章评论列表 SHALL 可以展示该评论
