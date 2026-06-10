## MODIFIED Requirements

### Requirement: 默认 MVP 功能注册表

系统 SHALL 为第一版产品界面提供默认功能入口，包括已开放的 MVP 功能和必要的隐藏或未来态内部配置，但普通用户默认入口 SHALL 优先展示真实可用能力。

#### Scenario: 初始化默认注册表

- **WHEN** 应用初始化第一版功能注册表数据时
- **THEN** 注册表包含已摸金额、薪资和上班时间设置、个人资料、每日签到、隐者日报、轻社区、生存账本和补给铺等 MVP 能力
- **AND** `hide_mode` SHALL NOT 作为首页独立快捷入口展示
- **AND** `comic_ip_content` SHALL NOT 作为默认公开独立主导航入口或个人中心主要入口展示

#### Scenario: 漫画 IP 内容降级为社区内容入口

- **WHEN** 第一版仍需要展示漫画/IP 或 `隐者大陆` 世界观预告
- **THEN** 系统 SHALL 通过社区页内容 Banner 或后续社区相关展示区域承载该入口
- **AND** 系统 SHALL NOT 要求普通用户通过独立漫画 tab 或独立漫画空壳页访问该内容

#### Scenario: 未来功能尚未实现

- **WHEN** 注册表在实现前包含赛季排行、复杂小游戏、称号商店、皮肤商店或完整成就系统等未来功能时
- **THEN** 该入口配置为 `hidden`、`locked`、`coming_soon` 或 `disabled`
- **AND** 该入口 SHALL NOT 出现在首页核心快捷入口或个人中心常用入口中冒充可用业务能力

## ADDED Requirements

### Requirement: 首页快捷入口收口

默认功能注册表和小程序首页 SHALL 控制首页核心快捷入口数量和语义，避免低价值、重复或未实现入口抢占首页。

#### Scenario: 首页核心入口展示

- **WHEN** 小程序渲染首页核心快捷入口
- **THEN** 首页 SHALL 优先展示工作设置、隐者日报、社区和补给相关真实可用入口
- **AND** 首页 SHALL NOT 同时将隐藏模式作为独立功能入口展示

#### Scenario: 补给入口不重复抢占

- **WHEN** 首页已经通过核心卡片或今日生存消耗区域展示补给入口
- **THEN** 首页 MAY 从快捷入口中移除重复补给入口
- **AND** 用户 SHALL 仍可从首页进入补给铺

## MODIFIED Requirements

### Requirement: 个人中心常用入口收口

小程序个人中心 SHALL 展示真实可用的常用入口，并隐藏未定义完整玩法的未来态入口。

#### Scenario: 个人中心展示常用入口

- **WHEN** 用户打开“我的”页
- **THEN** 页面 SHALL 展示 `我的角色`、`工作设置`、`我的帖子`、`收藏帖子`、`论坛消息` 和 `生存账本`
- **AND** 每个入口 SHALL 具备语义 icon、标题和可导航目标或可解释阻断提示

#### Scenario: 成就和未来态入口隐藏

- **WHEN** 成就系统、称号商店、皮肤商店、赛季排行或复杂小游戏尚未定义完整玩法
- **THEN** 这些入口 SHALL NOT 出现在个人中心常用入口中
- **AND** 功能注册表 SHALL NOT 返回它们作为普通用户可点击的 `enabled` 入口
