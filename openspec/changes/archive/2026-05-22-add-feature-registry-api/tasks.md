## 1. API 模块与契约复用

- [x] 1.1 在 API 应用中新增 feature registry 查询模块、控制器或等价结构，并接入 `AppModule`。
- [x] 1.2 在 API 层复用 `@moyuxia/shared` 的 `FeaturePlacement`、`FeatureRegistryResponse`、`isFeaturePlacement` 和 `getFeatureEntriesByPlacement`。
- [x] 1.3 实现公开读取接口 `GET /feature-registry/:placement`，返回 `{ placement, entries }` 形态。
- [x] 1.4 对非法 `placement` 返回 400 类客户端错误，不返回空入口列表。

## 2. 公开响应边界

- [x] 2.1 确保 API 响应不会返回 `hidden` 条目。
- [x] 2.2 确保 API 响应不会返回 `internalRoute`、`internalNotes`、`rolloutControl`、`auditStatus` 等内部字段。
- [x] 2.3 确保非 `enabled` 入口不会在 API 响应中返回可导航 `publicRoute`。
- [x] 2.4 确保 API 响应按 `displayOrder` 排序，并在排序相同时按 `featureKey` 稳定排序。

## 3. 小程序读取客户端

- [x] 3.1 新增小程序端统一功能入口读取方法，按 `placement` 请求远端 API。
- [x] 3.2 为统一读取方法实现请求失败、超时或响应不可用时的本地默认配置回退。
- [x] 3.3 将首页或至少一个入口区域改为通过统一读取方法获取 `FeatureRegistryResponse`。
- [x] 3.4 保持入口组件和点击拦截逻辑只依赖公开入口数据，不关心远端或本地来源。

## 4. 验证

- [x] 4.1 覆盖合法 `placement` 的 API 成功响应测试或等价验证。
- [x] 4.2 覆盖非法 `placement` 返回客户端错误的测试或等价验证。
- [x] 4.3 覆盖 `hidden` 条目、内部字段和非开放路由不出现在 API 响应中的测试或等价验证。
- [x] 4.4 覆盖小程序端远端失败后回退本地默认配置的测试或等价验证。
- [x] 4.5 执行 `openspec validate add-feature-registry-api --strict`、类型检查和相关应用构建或说明无法执行的原因。
