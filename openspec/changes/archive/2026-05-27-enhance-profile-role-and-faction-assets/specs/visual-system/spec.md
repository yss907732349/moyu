## ADDED Requirements

### Requirement: Profile faction asset presentation

个人中心页 SHALL 以阵营头像、阵营徽章和阵营插画表达用户当前阵营身份，并 SHALL 保持暗黑忍者 RPG 视觉系统一致。

#### Scenario: 顶部身份卡展示阵营头像和徽章

- **WHEN** 用户已创建成长资料并打开个人中心页
- **THEN** 顶部身份卡 SHALL 展示当前头像资产、昵称、改名 icon、阵营、称号、等级经验条和当前阵营徽章
- **AND** 头像、徽章和经验条 SHALL 在小屏设备上保持可读且不重叠

#### Scenario: 头像不可上传

- **WHEN** 用户查看顶部身份卡
- **THEN** 头像区域 SHALL NOT 展示“上传”角标
- **AND** 头像区域 SHALL NOT 使用上传态视觉暗示

#### Scenario: 阵营插画位预留

- **WHEN** 个人中心页展示阵营插画卡
- **THEN** 插画位 SHALL 使用统一尺寸和比例约束，优先按 `5:7` 竖图资源适配
- **AND** 插画核心内容 SHALL 在移动端可见区域内完整展示
- **AND** 插画文件未接入时 SHALL 展示对应阵营 key 的占位，而不是通用时间场景

### Requirement: Profile menu cleanup

个人中心页 SHALL 移除无效、重复或尚未开放的占位入口，并保留与当前 MVP 已落地能力相关的入口。

#### Scenario: 无效入口不展示

- **WHEN** 用户打开个人中心页
- **THEN** 页面 SHALL NOT 展示“称号收藏”、“我的评论”、“隐者大陆百科”和“设置”入口
- **AND** 页面 SHALL NOT 展示无实际功能的“我的成就”占位板块

#### Scenario: 高价值入口保留

- **WHEN** 用户打开个人中心页
- **THEN** 页面 SHALL 展示“我的角色”、“我的帖子”、“收藏帖子”和“论坛消息”等可用或即将实现的高价值入口
- **AND** 论坛消息入口 SHALL 能展示未读数量提示

#### Scenario: 我的角色作为资料中心

- **WHEN** 用户点击“我的角色”
- **THEN** 页面 SHALL 进入或展开角色详情与资料编辑体验
- **AND** 该体验 SHALL 承载职业填写、职业类型、当前阵营、推荐阵营提示和手动切换阵营入口

## MODIFIED Requirements

### Requirement: Primary miniapp page layout patterns

视觉系统 SHALL 定义首页、社区页和个人中心页的第一版布局模式，后续业务页面 SHOULD 优先沿用这些布局。

#### Scenario: Home layout is applied

- **WHEN** 首页实现真实业务数据
- **THEN** 首页 SHALL 包含顶部身份区域、已摸金额主卡、上班状态场景、设置入口、主要功能入口、倒计时卡组、辅助工具横幅和底部 tab

#### Scenario: Community layout is applied

- **WHEN** 社区页实现真实内容数据
- **THEN** 社区页 SHALL 包含顶部标题、内容或活动 Banner、分区 tabs、筛选 chips、发布入口、帖子卡列表和底部 tab

#### Scenario: Profile layout is applied

- **WHEN** 个人中心页实现真实用户数据
- **THEN** 个人中心页 SHALL 包含资料卡、等级经验、资源统计、每日签到、功能宫格、精简菜单区域、我的角色详情入口、阵营插画卡和底部 tab
- **AND** 个人中心页 SHALL NOT 强制包含无实际功能的成就栏

### Requirement: Reusable RPG UI components

小程序端 SHALL 通过可复用 RPG UI 组件组合页面，并 SHALL 避免在具体页面中散落重复样式结构。

#### Scenario: Home components are rendered

- **WHEN** 首页渲染收益、功能入口、倒计时或辅助工具横幅
- **THEN** 页面 SHALL 使用共享组件或符合共享组件契约的结构
- **AND** 组件 SHALL 支持动态文本和状态变化

#### Scenario: Community components are rendered

- **WHEN** 社区页渲染分区、筛选、发布入口或帖子列表
- **THEN** 页面 SHALL 使用统一的 tabs、chips、post card、badge 和 interaction stat 表现

#### Scenario: Profile components are rendered

- **WHEN** 个人中心页渲染资料、资源、功能宫格、角色资料、阵营插画或菜单
- **THEN** 页面 SHALL 使用统一的 profile summary、resource stat、feature grid item、role detail、faction artwork 和 menu item 表现
