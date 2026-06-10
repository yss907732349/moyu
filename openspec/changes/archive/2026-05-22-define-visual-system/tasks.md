## 1. Token 契约

- [x] 1.1 扩展 `packages/ui-tokens` 的颜色、语义色、字号、行高、间距、圆角、边框和状态 token
- [x] 1.2 定义收益、隐币、能量、经验、等级、奖励、锁定、置顶、NEW、选中和禁用状态的 token 映射
- [x] 1.3 为小程序端输出适合 Vue/uni-app 使用的 token 结构

## 2. 组件规范

- [x] 2.1 定义 `RpgPanel`、`PixelBanner`、`CurrencyCounter`、`CountdownCard`、`FeatureEntry`、`UtilityBanner` 等首页组件契约
- [x] 2.2 定义 `SectionTabs`、`FilterChips`、`PostCard`、`FactionBadge`、`InteractionStats` 等社区组件契约
- [x] 2.3 定义 `ProfileSummary`、`ResourceStat`、`FeatureGridItem`、`AchievementBadge`、`ProfileMenuItem`、`BottomTabBar` 等个人中心组件契约
- [x] 2.4 定义组件的默认态、选中态、禁用态、锁定态、加载态和空态表现

## 3. 页面布局模板

- [x] 3.1 按视觉系统定义首页布局模板，包括收益主卡、功能入口、倒计时卡和记账辅助工具横幅
- [x] 3.2 按视觉系统定义社区页布局模板，包括 Banner、分区导航、筛选、发布入口和帖子卡列表
- [x] 3.3 按视觉系统定义个人中心页布局模板，包括资料卡、资源统计、功能宫格、成就栏和菜单区域
- [x] 3.4 确认布局模板不实现真实业务数据和交互流程

## 4. 像素资产规范

- [x] 4.1 定义角色、场景、图标、徽章、Banner、漫画、阵营和锁定态资产分类
- [x] 4.2 定义资产命名、尺寸建议、透明背景、明暗边缘和占位资产规则
- [x] 4.3 明确整屏 UI 不得作为静态图片使用，动态文本和交互必须保留为原生 UI

## 5. 移动端可读性与验收

- [x] 5.1 定义小程序移动端最小字号、行高、触控区域、截断和安全间距约束
- [x] 5.2 验证首页、社区页、个人中心页在典型小屏宽度下无文字重叠和按钮溢出
- [x] 5.3 运行 OpenSpec 校验并确认 `visual-system` capability 完整
