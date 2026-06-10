## ADDED Requirements

### Requirement: 社区评论回复

系统 SHALL 支持已登录且已创建隐者档案的用户对已公开评论发布一层回复，并 SHALL 将回复纳入 AI 审核、公开展示、举报和通知边界。

#### Scenario: 用户回复公开评论

- **WHEN** 用户对已公开帖子下的已公开评论提交合法回复
- **THEN** API SHALL 创建回复并执行 AI 审核
- **AND** AI 审核通过的回复 SHALL 公开展示

#### Scenario: 用户回复非公开评论

- **WHEN** 用户尝试回复 `pending`、`rejected` 或 `hidden` 评论
- **THEN** API SHALL 拒绝该回复请求
- **AND** 回复 SHALL NOT 公开展示

#### Scenario: 回复不支持多级嵌套

- **WHEN** 用户尝试对回复继续回复
- **THEN** 系统 SHALL 将该操作转换为对原评论的一层回复或拒绝该操作
- **AND** API SHALL NOT 创建无限层级回复结构

### Requirement: 我的论坛内容

小程序端 SHALL 提供用户本人论坛内容视图，覆盖帖子、评论、回复和收藏，并清晰展示审核状态。

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

### Requirement: 社区举报处理

后台 SHALL 提供社区举报处理能力，管理员可保留、隐藏或标记误报，并记录处理备注。

#### Scenario: 管理员处理帖子举报

- **WHEN** 管理员处理帖子举报并选择隐藏内容
- **THEN** 系统 SHALL 将对应帖子更新为 `hidden`
- **AND** 系统 SHALL 记录处理人、处理时间和处理备注

#### Scenario: 管理员处理评论或回复举报

- **WHEN** 管理员处理评论或回复举报并选择隐藏内容
- **THEN** 系统 SHALL 将对应评论或回复更新为 `hidden`
- **AND** 该内容 SHALL 从公开评论区移除

#### Scenario: 管理员标记举报误报

- **WHEN** 管理员判断举报不成立
- **THEN** 系统 SHALL 保留被举报内容的当前公开状态
- **AND** 系统 SHALL 将举报标记为已处理或误报

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

## MODIFIED Requirements

### Requirement: 帖子审核生命周期

系统 SHALL 维护帖子审核状态，包含 `pending`、`approved`、`rejected` 和 `hidden`，并 SHALL 仅公开展示人工审核通过的帖子。AI 审核 SHALL 只作为风险判断、标签、置信度和后台排序辅助，不得直接把用户帖子公开。

#### Scenario: 用户提交帖子

- **WHEN** 用户提交合法帖子
- **THEN** API SHALL 创建状态为 `pending` 的帖子
- **AND** API SHALL NOT 将该帖子加入公开列表或公开详情
- **AND** API SHALL 保存 AI 风险判断、标签、置信度和建议原因供后台参考

#### Scenario: AI 判定帖子低风险

- **WHEN** AI 审核判定用户帖子低风险或通过
- **THEN** 系统 SHALL 保持帖子状态为 `pending`
- **AND** 系统 SHALL NOT 因 AI 通过而直接公开帖子

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

系统 SHALL 支持已登录且已创建隐者档案的用户评论已公开帖子，并 SHALL 对评论执行 AI 审核。AI 审核通过的评论 SHALL 可自动公开；AI 审核驳回的评论 SHALL 不公开；AI 不确定或供应商失败的评论 SHALL 进入人工复核。

#### Scenario: 用户提交评论且 AI 审核通过

- **WHEN** 用户对 `approved` 帖子提交合法评论且 AI 审核通过
- **THEN** API SHALL 创建状态为 `approved` 的评论
- **AND** 该评论 SHALL 可进入公开评论列表

#### Scenario: 用户提交评论且 AI 审核驳回

- **WHEN** 用户对 `approved` 帖子提交评论且 AI 审核驳回
- **THEN** API SHALL 创建状态为 `rejected` 的评论或拒绝该评论公开
- **AND** 该评论 SHALL NOT 进入公开评论列表

#### Scenario: 用户提交评论且 AI 不确定

- **WHEN** 用户对 `approved` 帖子提交评论且 AI 判断不确定或审核供应商失败
- **THEN** API SHALL 创建状态为 `pending` 的评论
- **AND** 该评论 SHALL NOT 进入公开评论列表直到人工复核通过

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
