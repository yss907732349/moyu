## MODIFIED Requirements

### Requirement: Dark ninja RPG visual identity

小程序端 SHALL 使用暗黑忍者 RPG 视觉身份，并 SHALL 将 `隐者大陆`、`隐者`、上班工具和像素 RPG 反馈统一到同一套视觉系统中。

#### Scenario: Primary page uses visual identity

- **WHEN** 用户打开首页、社区页或个人中心页
- **THEN** 页面 SHALL 使用深色夜幕背景、RPG 面板、清晰描边、像素资产和金/紫/蓝/青/橙等状态强调色
- **AND** 页面 SHALL 保持工具信息可读，而不是只呈现装饰性游戏画面

#### Scenario: Visual identity remains consistent across tabs

- **WHEN** 用户在底部 tab 间切换
- **THEN** 首页、社区页和个人中心页 SHALL 保持一致的背景、面板、描边、文字层级、图标风格和选中态表达
- **AND** 底部主导航 SHALL NOT 依赖独立漫画 tab 才能表达 `隐者大陆` 世界观

### Requirement: Primary miniapp page layout patterns

视觉系统 SHALL 定义首页、社区页和个人中心页的第一版布局模式，后续业务页面 SHOULD 优先沿用这些布局。

#### Scenario: Home layout is applied

- **WHEN** 首页实现真实业务数据
- **THEN** 首页 SHALL 包含顶部身份区域、已摸金额主卡、上班状态场景、设置入口、主要功能入口、倒计时卡组、辅助工具横幅和底部 tab

#### Scenario: Community layout is applied

- **WHEN** 社区页实现真实内容数据
- **THEN** 社区页 SHALL 包含顶部标题、世界观或漫画/IP 内容 Banner、分区 tabs、筛选 chips、发布入口、帖子卡列表和底部 tab
- **AND** 社区页 Banner SHALL 能承载“漫画模块封印中”、世界观预告、活动或后续内容入口，而不是只展示无操作价值的社区说明

#### Scenario: Profile layout is applied

- **WHEN** 个人中心页实现真实用户数据
- **THEN** 个人中心页 SHALL 包含资料卡、等级经验、资源统计、每日签到、当前徽章成就、精简菜单区域、我的角色二级页入口、阵营插画卡和底部 tab
- **AND** 个人中心页 SHALL NOT 强制包含无实际功能的功能宫格导航或完整成就系统占位
