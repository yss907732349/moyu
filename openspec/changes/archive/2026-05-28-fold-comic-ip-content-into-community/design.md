## Context

小程序当前已经从 foundation 阶段进入真实 MVP 工程阶段，但早期“四个主 tab：首页、社区、漫画、我的”的页面骨架仍保留在 `pages.json` 和部分规格中。漫画页目前只是“漫画模块封印中”的占位，不承载近期核心循环；社区页顶部 Banner 则仍是阵营说明和审核说明，信息密度较低。

本 change 将“漫画/IP 内容”从一级导航收敛为社区页内的世界观或内容 Banner。这样可以保留暗黑忍者 RPG 世界观入口，同时避免首版用户看到一个空壳主 tab。

## Goals / Non-Goals

**Goals:**

- 将小程序底部主导航调整为首页、社区、我的三个入口。
- 将社区页顶部 Banner 改为世界观、漫画/IP 预告或内容入口承载位。
- 调整默认功能注册表，使 `comic_ip_content` 不再出现在个人中心功能宫格或独立漫画展示区域中。
- 更新验证脚本和规格，避免后续实现继续以四 tab 或独立漫画页作为事实来源。

**Non-Goals:**

- 不实现完整漫画列表、漫画详情、章节解锁、世界观百科或漫画后台运营。
- 不新增漫画/IP 内容 API、数据库表或管理后台能力。
- 不删除社区论坛、日报、个人中心或现有成长能力。
- 不要求物理删除 `pages/comics/index` 文件；是否保留为兼容页由实现阶段按路由引用情况决定。

## Decisions

### Decision: 主导航固定为三个高频入口

底部 tabBar 只保留首页、社区和我的。漫画/IP 内容不再占用一级主导航。

备选方案是继续保留漫画 tab 但展示封印中状态。该方案对首版用户没有实际收益，还会让底部导航显得功能未完成。三个 tab 更符合当前 MVP 的高频路径：工作价值、社区互动、个人成长资料。

### Decision: 社区页 Banner 承载漫画/IP 和世界观预告

社区页顶部 Banner 从“社区审核/阵营说明”调整为“隐者大陆 / 漫画封印中 / 世界观内容入口”语义。它可以保持当前卡片结构，只替换文案、资产 key 和可选点击行为。

备选方案是把漫画入口放到个人中心功能宫格。该方案更像低频设置入口，不适合承担世界观内容曝光；同时个人中心近期已经在清理无效占位入口。

### Decision: `comic_ip_content` 保留稳定 key，但不作为公开独立入口

`comic_ip_content` 作为稳定 feature key 可以保留，方便后续恢复为社区内内容入口或运营配置项；但默认注册表中不应继续配置到 `profile_feature_grid` 或 `comics_entry` 并暴露 `/pages/comics/index` 作为已开放路由。

实现阶段可以选择：

- 将 `comic_ip_content` 设为 `hidden`，仅保留内部配置；
- 或将其迁移到 `community_entry`，状态为 `coming_soon`，用于社区 Banner 配置和提示。

若当前社区页 Banner 暂不消费 feature registry，第一版可先采用页面内稳定文案，同时保留后续配置化空间。

## Risks / Trade-offs

- [Risk] 用户仍可能通过历史链接访问 `/pages/comics/index`。→ 实现阶段可保留该页面为非 tab 兼容页，或重定向/提示前往社区。
- [Risk] 验证脚本或历史规格仍断言四个主 tab。→ 本 change 需要同步更新相关规格和验证脚本，把三 tab 作为新的事实来源。
- [Risk] `comic_ip_content` 从公开入口移除后，后续找不到 IP 内容扩展点。→ 保留稳定 feature key 和社区 Banner 语义，不删除概念，只降低入口层级。
- [Risk] 当前还有活跃日报后台 change。→ 本 change 不触碰日报后台分栏、日报 API 或后台运营流程，降低并行变更冲突。

## Migration Plan

1. 更新 `pages.json` 的 `tabBar.list`，移除漫画 tab。
2. 调整社区页 Banner 文案、资产占位和交互，替换当前低价值说明卡。
3. 调整默认 feature registry 中 `comic_ip_content` 的展示区域、状态和公开路由，确保普通用户不再通过独立公开入口进入漫画空壳。
4. 更新或新增验证脚本断言：小程序主 tab 为 3 个，且不包含 `pages/comics/index`；社区页存在世界观/漫画/IP Banner；个人中心或公开默认入口不展示独立漫画空壳。
5. 运行相关验证和构建命令。

Rollback 策略：如后续必须恢复独立漫画 tab，可在新的 OpenSpec change 中重新定义漫画/IP 作为独立主导航的业务范围，并恢复 tabBar、注册表公开路由和对应页面体验。

## Open Questions

- 社区页 Banner 第一版点击后是否只展示 toast，还是跳转到保留的 `/pages/comics/index` 兼容页？
- `comic_ip_content` 默认状态采用 `hidden` 还是 `coming_soon + community_entry` 更适合当前验证脚本？
