## MODIFIED Requirements

### Requirement: 默认 MVP 功能注册表

系统 SHALL 为第一版产品界面提供默认功能入口，包括已开放的 MVP 功能和未来功能的可见占位入口。

#### Scenario: 初始化默认注册表

- **WHEN** 应用初始化第一版功能注册表数据时
- **THEN** 注册表包含已摸金额、薪资和上班时间设置、隐藏模式、轻量记账入口、个人资料、阵营选择、每日签到、隐者日报、轻社区、生存账本，以及未来锁定、敬请期待或停用入口
- **AND** `comic_ip_content` SHALL NOT 作为默认公开独立主导航入口或个人中心主要入口展示

#### Scenario: 漫画 IP 内容降级为社区内容入口

- **WHEN** 第一版仍需要展示漫画/IP 或 `隐者大陆` 世界观预告
- **THEN** 系统 SHALL 通过社区页内容 Banner 或后续社区相关展示区域承载该入口
- **AND** 系统 SHALL NOT 要求普通用户通过独立漫画 tab 或独立漫画空壳页访问该内容

#### Scenario: 未来功能尚未实现

- **WHEN** 注册表在实现前包含赛季排行、复杂小游戏、称号商店或皮肤商店等未来功能时
- **THEN** 该入口配置为 `locked`、`coming_soon` 或 `disabled`，并且不暴露可用业务能力

## ADDED Requirements

### Requirement: 漫画 IP 入口非主导航边界

功能注册表 SHALL 保留漫画/IP 内容后续扩展空间，但 SHALL 防止未完成的漫画空壳作为默认公开主入口暴露。

#### Scenario: 默认入口不暴露漫画空壳路由

- **WHEN** 小程序读取默认公开功能入口配置
- **THEN** `comic_ip_content` SHALL NOT 以 `enabled` 状态返回指向 `/pages/comics/index` 的公开路由
- **AND** 普通用户 SHALL NOT 从首页快捷入口、个人中心功能宫格或底部主导航进入独立漫画空壳

#### Scenario: 后续恢复漫画能力

- **WHEN** 后续 change 明确实现漫画/IP 内容列表、详情或解锁流程
- **THEN** 系统 SHALL 在新的规格中重新定义 `comic_ip_content` 的展示区域、状态和公开路由
- **AND** 系统 SHALL NOT 仅通过恢复旧 tab 配置表达完整漫画能力
