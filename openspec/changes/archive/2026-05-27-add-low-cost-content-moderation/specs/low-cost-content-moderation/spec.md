## ADDED Requirements

### Requirement: 本地敏感词库同步

系统 SHALL 提供显式脚本同步本地敏感词库，并 SHALL 将同步结果保存为项目内可验证缓存，运行时不得依赖实时访问外部 GitHub 仓库。

#### Scenario: 同步用户指定词库

- **WHEN** 开发者运行敏感词库同步命令
- **THEN** 脚本 SHALL 从 `https://github.com/konsheng/Sensitive-lexicon` 读取可用文本词库
- **AND** 脚本 SHALL 将词条归一化、去重并写入项目内缓存
- **AND** 脚本 SHALL 记录来源仓库、同步时间、词条数量和许可说明

#### Scenario: 同步失败不覆盖缓存

- **WHEN** GitHub 不可访问、下载失败或词库结构异常
- **THEN** 脚本 SHALL 保留已有可用缓存
- **AND** 脚本 SHALL 返回可理解的失败原因

#### Scenario: 验证词库缓存

- **WHEN** 开发者运行低成本审核验证命令
- **THEN** 验证 SHALL 检查词库缓存结构、来源元数据、词条数量和关键风险类别
- **AND** 验证 SHALL 确保缓存可被共享包和 API 运行时加载

### Requirement: 文本归一化与风险匹配

系统 SHALL 在审核用户生成文本前执行归一化处理，并 SHALL 基于本地词库和规则输出可解释的风险结果。

#### Scenario: 归一化简单规避文本

- **WHEN** 用户提交包含空格、标点、大小写或简单分隔符规避的文本
- **THEN** 系统 SHALL 在匹配前移除或归一化这些干扰字符
- **AND** 系统 SHALL 仍可命中对应风险词

#### Scenario: 明确违规文本

- **WHEN** 文本命中性暴力、严重辱骂、暴力威胁、违法、隐私泄露或广告引流等明确违规词
- **THEN** 审核结果 SHALL 为 `reject`
- **AND** 结果 SHALL 包含归一化风险标签、命中字段和用户可理解的拒绝原因

#### Scenario: 灰区文本

- **WHEN** 文本命中弱风险、涉政争议、疑似广告或上下文不明内容
- **THEN** 审核结果 SHALL 为 `review`
- **AND** 后台 SHALL 可以查看命中词、风险等级和处理建议

#### Scenario: 低风险文本

- **WHEN** 文本未命中本地硬规则且不触发限流或重复提交规则
- **THEN** 审核结果 MAY 为 `pass`
- **AND** 系统 SHALL 记录审核来源为本地规则

### Requirement: 可信用户快速通道

系统 SHALL 为低风险、短文本、低频且无近期违规记录的用户提供评论快速通过能力，并 SHALL 对新用户、异常用户和被举报用户收紧策略。

#### Scenario: 可信用户提交低风险短评论

- **WHEN** 已登录且已创建档案的可信用户提交低风险短评论
- **THEN** 系统 MAY 将评论状态设为 `approved`
- **AND** 公开评论列表 SHALL 可以展示该评论

#### Scenario: 新用户或异常用户提交评论

- **WHEN** 新用户、近期有违规记录用户或触发频率限制的用户提交评论
- **THEN** 系统 SHALL 将评论设为 `pending` 或 `rejected`
- **AND** 系统 SHALL NOT 因文本未命中风险词就直接公开

#### Scenario: 重复刷屏评论

- **WHEN** 同一用户短时间重复提交相同或高度相似评论
- **THEN** 系统 SHALL 拒绝或限制继续提交
- **AND** 系统 SHALL 返回可理解的频率或重复提交提示

### Requirement: 人工复核优先级

系统 SHALL 将低成本审核结果用于后台人工复核排序和展示，提升后台处理效率。

#### Scenario: 后台查看命中原因

- **WHEN** 管理员查看待复核评论、回复或帖子
- **THEN** 后台 SHALL 展示风险等级、归一化风险标签、命中词、命中字段和处理建议
- **AND** 后台 SHALL NOT 展示普通用户不应看到的内部词库调试细节

#### Scenario: 风险内容优先排序

- **WHEN** 后台读取审核队列
- **THEN** 系统 SHOULD 将高风险待复核内容排在普通待复核内容之前
- **AND** 系统 SHALL 保留按来源、类型、状态和风险标签筛选能力
