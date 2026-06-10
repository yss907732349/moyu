## MODIFIED Requirements

### Requirement: Primary miniapp page layout patterns

视觉系统 SHALL 定义首页、社区页和个人中心页的第一版布局模式，后续业务页面 SHOULD 优先沿用这些布局。

#### Scenario: Home layout is applied

- **WHEN** 首页实现真实业务数据
- **THEN** 首页 SHALL 包含顶部身份区域、已摸金额主卡、上班状态场景、设置入口、主要功能入口、倒计时卡组、辅助工具横幅和底部 tab

#### Scenario: Community layout is applied

- **WHEN** 社区页实现真实内容数据
- **THEN** 社区页 SHALL 包含顶部标题、漫画/IP 内容 Banner、分区 tabs、筛选控件、消息入口、发布入口、帖子卡列表和底部 tab
- **AND** 社区页 Banner SHALL 承载漫画/IP 内容入口、世界观内容入口、活动或后续内容入口
- **AND** 社区页 Banner SHALL NOT 以“漫画模块封印中”“敬请期待”等无操作价值占位说明作为主要内容
- **AND** 社区页 SHALL NOT 在首页操作区展示“我的帖子”入口

#### Scenario: Profile layout is applied

- **WHEN** 个人中心页实现真实用户数据
- **THEN** 个人中心页 SHALL 包含资料卡、等级经验、资源统计、每日签到、当前徽章成就、精简菜单区域、我的角色二级页入口、阵营插画卡和底部 tab
- **AND** 个人中心页 SHALL NOT 强制包含无实际功能的功能宫格导航或完整成就系统占位

### Requirement: Reusable RPG UI components

小程序端 SHALL 通过可复用 RPG UI 组件组合页面，并 SHALL 避免在具体页面中散落重复样式结构。

#### Scenario: Home components are rendered

- **WHEN** 首页渲染收益、功能入口、倒计时或辅助工具横幅
- **THEN** 页面 SHALL 使用共享组件或符合共享组件契约的结构
- **AND** 组件 SHALL 支持动态文本和状态变化

#### Scenario: Community components are rendered

- **WHEN** 社区页渲染分区、筛选、发布入口、消息入口或帖子列表
- **THEN** 页面 SHALL 使用统一的 tabs、筛选控件、post card、badge、作者头像和 interaction stat 表现
- **AND** 帖子列表卡片 SHALL 使用固定信息密度布局，避免单个帖子因图片比例过高而占用异常大屏幕空间

#### Scenario: Community post card thumbnail is stable

- **WHEN** 社区页帖子卡片展示图片
- **THEN** 卡片 SHALL 最多在列表中展示一张缩略图
- **AND** 缩略图容器 SHALL 使用固定正方形尺寸
- **AND** 缩略图 SHALL 使用裁切填充方式适配容器，不得随原始图片比例改变卡片高度
- **AND** 多图帖子 SHALL 仅展示第一张缩略图并可以显示剩余图片数量提示

#### Scenario: Profile components are rendered

- **WHEN** 个人中心页渲染资料、资源、当前徽章成就、角色资料入口、阵营插画或菜单
- **THEN** 页面 SHALL 使用统一的 profile summary、resource stat、achievement badge、role detail、faction artwork 和 menu item 表现
