## Why

当前小程序底部仍保留“漫画”独立主 tab，但漫画/IP 内容并未进入近期 MVP 的真实业务闭环，继续作为一级页面会稀释首页、社区和我的三个高频入口。将漫画/IP 内容从独立主导航降级为社区页内的世界观或内容 Banner，可以保留 `隐者大陆` 的 IP 预期，同时让首版信息架构更聚焦。

## What Changes

- **BREAKING** 小程序底部主导航从“首页、社区、漫画、我的”调整为“首页、社区、我的”三个主 tab。
- `pages/comics/index` 不再作为主 tab 页面展示；如保留代码，只能作为非主导航的后续内容页或临时兼容页。
- 社区页顶部原有低价值说明 Banner 调整为漫画/IP/世界观内容承载位，用于展示“漫画模块封印中”或后续世界观内容入口。
- `comic_ip_content` 不再作为独立主导航入口；默认功能注册表应隐藏、下线或迁移到社区相关展示区域，避免用户从个人中心或独立漫画入口进入空壳页面。
- 视觉系统和项目地基规格同步从“四个主 tab”收敛为三个主 tab，并把漫画/IP 表达改为社区页内容 Banner 的一种配置。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `project-foundation`: 小程序主 tab 页面壳从四个入口调整为首页、社区、我的三个入口。
- `visual-system`: 主页面视觉一致性和社区页布局改为支持世界观/漫画/IP 内容 Banner，而不是要求独立漫画主页面。
- `feature-registry`: `comic_ip_content` 从默认公开独立入口调整为非主导航、非个人中心主要入口，避免暴露空壳漫画页。

## Impact

- 影响小程序路由配置和底部 `tabBar`：`apps/miniapp/src/pages.json`。
- 影响社区页 Banner 文案、视觉和可能的点击行为：`apps/miniapp/src/pages/community/index.vue`。
- 影响默认功能入口配置和验证脚本：`packages/shared/src/index.ts`、`scripts/verify-*` 中与漫画入口、主 tab 数量相关的断言。
- 影响规格文档：`openspec/specs/project-foundation`、`openspec/specs/visual-system`、`openspec/specs/feature-registry`。
- 不引入新的后端 API、数据库表、漫画内容管理后台或完整漫画发布流程。
