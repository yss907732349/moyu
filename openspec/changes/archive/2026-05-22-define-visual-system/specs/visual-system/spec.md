## ADDED Requirements

### Requirement: Dark ninja RPG visual identity

小程序端 SHALL 使用暗黑忍者 RPG 视觉身份，并 SHALL 将 `隐者大陆`、`隐者`、上班工具和像素 RPG 反馈统一到同一套视觉系统中。

#### Scenario: Primary page uses visual identity

- **WHEN** 用户打开首页、社区页、漫画页或个人中心页
- **THEN** 页面 SHALL 使用深色夜幕背景、RPG 面板、清晰描边、像素资产和金/紫/蓝/青/橙等状态强调色
- **AND** 页面 SHALL 保持工具信息可读，而不是只呈现装饰性游戏画面

#### Scenario: Visual identity remains consistent across tabs

- **WHEN** 用户在底部 tab 间切换
- **THEN** 各主页面 SHALL 保持一致的背景、面板、描边、文字层级、图标风格和选中态表达

### Requirement: Visual token contract

视觉系统 SHALL 在 `packages/ui-tokens` 中定义小程序端可复用的基础 token 和语义 token。

#### Scenario: Page consumes semantic tokens

- **WHEN** 页面需要渲染背景、面板、文本、描边、收益、奖励、能量、等级、锁定或危险状态
- **THEN** 页面 SHALL 优先使用 `packages/ui-tokens` 导出的语义 token
- **AND** 页面 SHOULD NOT 在局部样式中重复硬编码同类状态色值

#### Scenario: Tokens cover RPG panel hierarchy

- **WHEN** 组件需要区分普通面板、浮起面板、交互面板、选中面板、禁用面板或锁定面板
- **THEN** 视觉 token SHALL 提供对应的背景、描边、文本和状态语义

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

- **WHEN** 个人中心页渲染资料、资源、功能宫格、成就或菜单
- **THEN** 页面 SHALL 使用统一的 profile summary、resource stat、feature grid item、achievement badge 和 menu item 表现

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
- **THEN** 个人中心页 SHALL 包含资料卡、等级经验、资源统计、功能宫格、成就栏、菜单区域、个人场景卡和底部 tab

### Requirement: Home utility banner

首页 SHALL 在底部 tab 上方提供一个横向辅助工具横幅，用于承载记账、签到、活动或其他高频轻操作入口。

#### Scenario: Accounting entry is rendered

- **WHEN** 首页配置该横幅为记账入口
- **THEN** 横幅 SHALL 显示像素角色或账本相关资产、记账标题、简短说明和 `记一笔` 主操作
- **AND** 横幅 MAY 显示今日支出、今日结余或最近一笔等轻量反馈占位
- **AND** 本 change SHALL NOT 定义记账数据模型、账单分类、统计规则、接口或存储流程

#### Scenario: Utility banner remains configurable

- **WHEN** 后续 change 需要将该横幅配置为签到、活动或其他入口
- **THEN** 横幅 SHALL 能复用相同布局结构，并通过 feature key、文案、资产和主操作配置表达不同功能

### Requirement: Pixel art asset taxonomy

视觉系统 SHALL 定义像素资产分类，并 SHALL 约束像素资产与原生 UI 的边界。

#### Scenario: Asset category is selected

- **WHEN** 页面需要展示角色、场景、功能图标、成就徽章、阵营标识、Banner、漫画封面或锁定态
- **THEN** 系统 SHALL 从对应资产分类中选择像素资产

#### Scenario: Dynamic UI remains native

- **WHEN** 页面展示金额、倒计时、等级、经验、按钮、tabs、列表、标签或状态文本
- **THEN** 这些内容 SHALL 使用原生 UI 渲染
- **AND** 整屏页面 SHALL NOT 作为静态图片切片交付

### Requirement: Feature status visual states

视觉系统 SHALL 为功能入口、内容卡片和成长反馈定义统一状态表现。

#### Scenario: Feature entry displays availability

- **WHEN** 功能入口处于已开放、未解锁、敬请期待、禁用或当前选中状态
- **THEN** 入口 SHALL 使用统一的图标、描边、透明度、标签或锁定提示表达状态

#### Scenario: Content card displays metadata state

- **WHEN** 内容卡片需要展示 `NEW`、置顶、推荐、阵营、等级、互动统计或审核相关状态
- **THEN** 卡片 SHALL 使用统一 badge、chip、计数和强调色表达状态

### Requirement: Mobile readability and interaction constraints

视觉系统 SHALL 保证暗黑 RPG 高密度界面在小程序移动端保持可读和可操作。

#### Scenario: Dense card text is displayed

- **WHEN** 页面在小屏设备上展示高密度卡片、帖子、功能入口或资源统计
- **THEN** 文本 SHALL 保持可读字号和行高
- **AND** 文本 SHALL 使用截断、换行或布局降级避免与相邻内容重叠

#### Scenario: Interactive controls are tapped

- **WHEN** 用户点击按钮、功能入口、tabs、chips、菜单项或底部 tab
- **THEN** 可点击区域 SHALL 满足移动端触控尺寸要求
- **AND** 图标视觉尺寸 SHALL NOT 成为唯一的点击区域
