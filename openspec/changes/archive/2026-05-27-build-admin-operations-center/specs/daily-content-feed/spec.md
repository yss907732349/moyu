## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: 日报人工采编

隐者日报 SHALL 由后台运营人工创建、编辑、预览和发布，不再依赖第三方来源自动采集。后台编辑能力 SHALL 支持今日参悟、栏目文章、来源字段、配图字段、文章增删和排序的完整运营流程。后台第一阶段 SHALL 使用轻量发布流程，允许运营在发布前校验通过后直接立即发布或设置定时发布，不强制经过提交审核和审核通过步骤。

#### Scenario: 人工创建日报草稿

- **WHEN** 授权后台用户创建隐者日报草稿
- **THEN** 系统 SHALL 允许手动填写业务日期、日报标题、首页摘要、今日参悟、栏目文章标题、摘要、正文和来源字段
- **AND** 来源字段 SHALL 包含来源类型、可选的来源说明、来源站点、来源标题、来源 URL、配图 URL 和发布时间

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

- **WHEN** 后台运营完成日报编辑并选择立即发布
- **THEN** 系统 SHALL 执行发布前校验
- **AND** 校验通过后系统 SHALL 将日报公开发布
- **AND** 系统 SHALL NOT 因 AI 判断安全而自动公开日报

#### Scenario: 人工设置定时发布

- **WHEN** 后台运营完成日报编辑并选择定时发布
- **THEN** 系统 SHALL 执行发布前校验并保存计划发布时间
- **AND** 系统 SHALL NOT 因 AI 判断安全而自动设置定时发布

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

- **WHEN** 大陆新闻或离谱卷宗文章标记为原创内容
- **THEN** 系统 SHALL NOT 因该文章缺少来源 URL、来源标题或来源站点而拒绝公开发布
- **AND** 如果原创文章填写了来源 URL，系统 SHALL 校验 URL 格式

#### Scenario: 发布外部采编日报文章

- **WHEN** 大陆新闻或离谱卷宗文章标记为外部采编内容且缺少来源 URL、来源标题或来源站点
- **THEN** 系统 SHALL 拒绝立即发布、设置定时发布或到点自动发布
- **AND** 后台 SHALL 展示需要补齐的文章和字段

#### Scenario: AI 不得伪造来源类型

- **WHEN** AI 辅助处理日报内容
- **THEN** 系统 SHALL NOT 接受 AI 将无来源内容伪装为外部采编来源
- **AND** 系统 SHALL 以后台运营明确选择或保存的来源类型作为发布校验依据
