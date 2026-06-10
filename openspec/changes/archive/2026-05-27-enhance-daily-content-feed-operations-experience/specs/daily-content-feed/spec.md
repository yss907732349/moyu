## ADDED Requirements

### Requirement: 日报后台编辑校验

日报后台 SHALL 在保存、提交审核和发布前提供可读的编辑校验结果，覆盖栏目数量、文章数量、来源完整性、正文长度、配图缺失和可引用状态。

#### Scenario: 后台查看编辑问题

- **WHEN** 后台用户编辑隐者日报草稿
- **THEN** 系统 SHALL 展示当前日报的字段级问题或提示
- **AND** 系统 SHALL 区分阻断发布的问题和仅建议优化的问题

#### Scenario: 保存存在非阻断问题的草稿

- **WHEN** 日报草稿存在配图缺失或来源说明不完整等非阻断问题
- **THEN** 后台 SHALL 允许保存草稿
- **AND** 系统 SHALL 保留问题提示供运营继续补齐

#### Scenario: 发布存在阻断问题的日报

- **WHEN** 大陆新闻或离谱卷宗文章缺少来源 URL、来源标题或来源站点
- **THEN** 系统 SHALL 拒绝公开发布
- **AND** 后台 SHALL 展示需要补齐的文章和字段

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

## MODIFIED Requirements

### Requirement: 日报人工采编

隐者日报 SHALL 由后台运营人工创建、编辑、审核和发布，不再依赖第三方来源自动采集。后台编辑能力 SHALL 支持今日参悟、栏目文章、来源字段、配图字段、文章增删和排序的完整运营流程。

#### Scenario: 人工创建日报草稿

- **WHEN** 授权后台用户创建隐者日报草稿
- **THEN** 系统 SHALL 允许手动填写业务日期、日报标题、首页摘要、今日参悟、栏目文章标题、摘要、正文和来源字段
- **AND** 来源字段 SHALL 包含可选的来源说明、来源站点、来源标题、来源 URL、配图 URL 和发布时间

#### Scenario: 后台增删栏目文章

- **WHEN** 后台编辑大陆新闻或离谱卷宗
- **THEN** 系统 SHALL 允许运营新增、删除和编辑栏目文章
- **AND** 系统 SHALL 保持每个栏目最多 10 篇文章

#### Scenario: 后台调整栏目文章顺序

- **WHEN** 后台调整大陆新闻或离谱卷宗文章排序
- **THEN** 系统 SHALL 保存排序结果
- **AND** 公开栏目列表 SHALL 按保存后的顺序展示

#### Scenario: 日报栏目数量

- **WHEN** 后台编辑大陆新闻或离谱卷宗
- **THEN** 每个栏目 SHALL 最多保存 10 篇文章
- **AND** 今日参悟 SHALL 最多保存 1 条可引用短句或短段落

#### Scenario: 人工发布官方日报

- **WHEN** AI 已完成改写或风险提示
- **THEN** 系统 SHALL NOT 因 AI 判断安全而自动公开日报
- **AND** 官方日报 SHALL 仍由后台管理员显式提交审核、审核通过和发布
