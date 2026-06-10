## 1. 小程序主导航调整

- [x] 1.1 更新 `apps/miniapp/src/pages.json`，将底部 `tabBar.list` 调整为首页、社区、我的三个入口。
- [x] 1.2 确认 `pages/comics/index` 不再作为主 tab 页面；如保留页面，确保它只作为非主导航兼容页存在。
- [x] 1.3 检查首页、社区页、我的页之间的 `switchTab` 和 `navigateTo` 调用，避免继续把漫画页当作主 tab。

## 2. 社区页 Banner 替换

- [x] 2.1 将 `apps/miniapp/src/pages/community/index.vue` 顶部 Banner 从阵营/审核说明替换为漫画/IP/世界观内容承载位。
- [x] 2.2 Banner 文案应表达“漫画模块封印中”或 `隐者大陆` 世界观预告，并保留社区页暗黑忍者 RPG 视觉风格。
- [x] 2.3 明确 Banner 点击行为：第一版可展示敬请期待提示，或跳转到保留的非主导航兼容页，但不得表现为已完成漫画业务。
- [x] 2.4 确认社区分区 tabs、筛选 chips、发布入口、我的帖子、消息和帖子列表不受 Banner 替换影响。

## 3. 功能注册表调整

- [x] 3.1 更新 `packages/shared/src/index.ts` 默认功能注册表，使 `comic_ip_content` 不再以 `enabled` 状态暴露 `/pages/comics/index` 公开路由。
- [x] 3.2 移除 `comic_ip_content` 在 `profile_feature_grid` 或独立 `comics_entry` 中的默认公开入口；如保留配置，应改为 `hidden` 或社区相关 `coming_soon` 入口。
- [x] 3.3 检查 `FeaturePlacement.ComicsEntry` 是否仍有必要保留；若保留，应确保默认公开响应不会依赖它。
- [x] 3.4 同步更新 `packages/shared/dist` 或构建产物的生成方式，避免源码和产物事实不一致。

## 4. 验证脚本与规格一致性

- [x] 4.1 更新或新增小程序验证脚本，断言底部主 tab 为三个且不包含 `pages/comics/index`。
- [x] 4.2 更新或新增 feature registry 验证，断言 `comic_ip_content` 不再返回指向漫画空壳页的默认公开独立入口。
- [x] 4.3 更新视觉系统或社区页验证，断言社区页顶部 Banner 承载漫画/IP/世界观语义。
- [x] 4.4 全仓搜索“四个主 tab”“漫画页主 tab”“ComicsEntry”等旧事实来源，并同步调整与本 change 冲突的文档或验证断言。

## 5. 验收

- [x] 5.1 运行 `openspec validate fold-comic-ip-content-into-community --strict`。
- [x] 5.2 运行 `pnpm verify:feature-registry`。
- [x] 5.3 运行 `pnpm verify:miniapp-feature-registry`。
- [x] 5.4 运行 `pnpm verify:miniapp-community-lite`。
- [x] 5.5 运行 `pnpm build:miniapp`，确认微信小程序构建配置可用。
- [x] 5.6 在微信小程序开发工具或构建产物中检查底部导航只展示首页、社区、我的三个入口。
