## Why

`feature-registry` 已经定义了功能入口契约和本地默认配置，但小程序端后续需要通过稳定 API 获取公开入口配置，避免未来接入后台运营配置时再次改动入口组件和页面逻辑。

现在补充 API change，可以把“本地默认配置”和“未来服务端配置”统一到同一响应形态，并明确普通用户接口的字段过滤、状态过滤和路由安全边界。

## What Changes

- 新增小程序端读取功能入口配置的公开 API 契约，支持按 `placement` 获取入口列表。
- 新增 API 响应结构要求，复用 `packages/shared` 中的 `FeatureRegistryResponse` / `PublicFeatureEntry` 形态。
- 新增服务端过滤规则：普通用户响应不得返回 `hidden` 条目、内部备注、灰度控制、审核字段或未发布路由。
- 新增服务端排序规则：按展示区域内 `displayOrder` 稳定排序，排序相同再按 `featureKey` 排序。
- 新增小程序端读取策略：优先通过统一客户端方法读取功能入口，远端不可用时可回退到本地默认配置。
- 不实现完整后台配置发布流程，不新增数据库表，不实现运营端编辑界面。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `feature-registry`: 增加公开 API 获取、响应字段过滤、服务端排序、远端失败回退和 API 验证要求。

## Impact

- 影响后端 API：新增 feature registry 查询模块、控制器或等价接口。
- 影响小程序端：入口配置读取从直接本地调用收敛为统一客户端读取方法，并保留本地默认配置回退。
- 影响共享包：优先复用现有 `FeaturePlacement`、`FeatureRegistryResponse`、`PublicFeatureEntry`、过滤和校验方法。
- 影响测试：需要覆盖 API 正常响应、非法 `placement`、隐藏/内部字段过滤、排序、多展示区域和回退读取行为。
