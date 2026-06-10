## Why

`摸鱼侠` 已经完成项目 foundation，仓库中存在 `packages/ui-tokens` 和小程序四个 tab 页面壳，但当前视觉约定仍停留在基础 token 和历史暂停规划中的方向性描述。用户提供的新 UI 图已经明确了第一版小程序的目标体验：暗黑忍者 RPG、像素角色、RPG 面板、阵营身份、上班工具属性和高密度移动端信息面板。

本 change 用于把该 UI 方向固化为可执行的视觉系统契约，让后续 `work-value-tracker`、`user-growth-profile`、`daily-content-feed`、`community-lite`、`feature-registry` 等业务 change 可以沿用统一 token、组件、页面布局和资产规范，而不是在各页面中重复定义样式。

## What Changes

- 定义 `摸鱼侠` 小程序端第一版暗黑忍者 RPG 视觉身份，包括夜幕背景、像素角色、RPG 面板、金/紫/蓝/青/橙状态色和高密度工具界面方向。
- 扩展 `packages/ui-tokens` 的目标契约，覆盖颜色、语义色、字号、行高、间距、圆角、边框、状态和层级 token。
- 定义首页、社区页、个人中心页的主页面布局模式，作为后续真实业务页面的视觉结构基线。
- 定义可复用 RPG UI 组件清单，包括面板、横幅、收益计数、倒计时卡、功能入口、帖子卡、资料头、资源统计、成就徽章、菜单项和底部 tab。
- 定义像素资产分类、用途、命名和使用边界，确保资产用于角色、场景、图标、徽章、Banner 和漫画内容，不把整屏 UI 做成静态图片。
- 定义 feature 状态视觉规则，覆盖已开放、未解锁、敬请期待、置顶、NEW、当前选中、奖励、等级和进度等状态。
- 将首页底部原“每日签到”横向区域调整为可配置的辅助工具横幅，当前视觉实例为记账入口，但本 change 不实现记账业务逻辑。
- 定义移动端可读性、触控尺寸、文字截断和布局密度约束。

## Capabilities

### New Capabilities

- `visual-system`: 定义小程序端暗黑忍者 RPG 视觉系统、页面布局模式、组件契约、像素资产规则、状态表现和移动端可读性约束。

### Modified Capabilities

- None.

## Impact

- 新增 `openspec/changes/define-visual-system/specs/visual-system/spec.md`。
- 后续小程序业务 change SHOULD 优先使用本 change 定义的 token、组件和页面布局模式。
- 后续实现可能会修改 `packages/ui-tokens`，并在 `apps/miniapp` 中新增共享 UI 组件目录，但本 proposal 只定义目标契约。
- 不新增生产美术资产，不实现首页收益计算、记账、社区发帖、用户成长、签到或内容管理业务。
