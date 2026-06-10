## Context

正式 `feature-registry` 规格已经定义了功能入口结构、状态、展示区域、公开响应字段和本地默认注册表。当前后端 API 仍处于 foundation 阶段，只有 `GET /health`，小程序首页已经可以直接从 `@moyuxia/shared` 的本地默认配置读取功能入口。

本 change 的目标是在不引入数据库、后台发布链路或完整运营系统的前提下，补齐公开读取 API，让小程序端后续可以从远端读取相同形态的数据，并在远端不可用时继续回退到本地默认配置。

## Goals / Non-Goals

**Goals:**

- 提供公开 API：按 `placement` 查询功能入口列表。
- 服务端复用 `packages/shared` 中的 `FeaturePlacement`、`FeatureRegistryResponse`、`getFeatureEntriesByPlacement` 和默认 registry source。
- API 响应只包含普通用户可见字段，不返回 `hidden` 条目和内部管理字段。
- 小程序端通过统一客户端方法读取入口配置，保留本地默认配置回退。
- 为后续替换为数据库或后台发布配置保留 `FeatureRegistrySource` 扩展点。

**Non-Goals:**

- 不实现功能入口数据库表、Prisma migration 或远端持久化。
- 不实现后台编辑、发布、审核或灰度配置页面。
- 不实现用户个性化解锁计算、登录态权限计算或阵营/等级判断。
- 不重新定义 feature key、状态枚举、展示区域或视觉样式。

## Decisions

### Decision: 第一版 API 复用共享包默认 registry source

API 服务第一版直接调用 `getFeatureEntriesByPlacement(placement)`，使用共享包中已校验的 `DEFAULT_MVP_FEATURE_REGISTRY` 作为数据源。

Rationale: 现阶段还没有后台运营系统和数据库模型。复用共享包可以保证服务端响应与小程序本地回退完全一致，并避免出现两套默认配置。

Alternatives considered:

- 立即落 MySQL 表。长期可运营，但会把本 change 扩大到数据模型、迁移、后台发布和审核流程。
- 在 API 模块内复制一份配置。实现直接，但会破坏 `featureKey` 和入口文案的单一来源。

### Decision: 使用按 placement 查询的公开 GET 接口

公开接口采用 `GET /feature-registry/:placement`，其中 `placement` 必须是共享枚举 `FeaturePlacement` 的合法值。成功响应使用 `FeatureRegistryResponse` 形态：`{ placement, entries }`。

Rationale: 现有规格已经以 `placement` 作为稳定展示区域，按区域查询可以避免返回全量配置，也减少隐藏功能或内部字段泄露风险。

Alternatives considered:

- `GET /feature-registry?placement=...`。同样可行，但路径参数更明确表达这是按展示区域读取资源。
- 返回全量配置给前端过滤。会增加泄露面，并让不同页面可能出现过滤逻辑不一致。

### Decision: 非法 placement 返回客户端错误

当请求中的 `placement` 不属于 `FeaturePlacement` 枚举时，API 返回 400 类错误，不返回空列表。

Rationale: 非法展示区域通常意味着客户端版本、配置或调用代码错误。返回空列表会掩盖问题，导致页面静默缺入口。

Alternatives considered:

- 返回空列表。用户体验看似平滑，但排查成本高。
- 自动回退到默认区域。会造成错误页面展示不相关入口。

### Decision: 小程序端使用统一读取客户端并保留本地回退

小程序端应封装 `getFeatureRegistryByPlacement` 或等价方法：优先请求 API；请求失败、超时或响应不可用时，使用 `@moyuxia/shared` 的本地默认配置回退。

Rationale: 小程序端已有本地默认数据，回退可以保证首页入口在 API 未部署或网络失败时仍可用。统一方法可以让页面组件不关心数据来源。

Alternatives considered:

- 页面直接调用 `uni.request`。会让多个页面重复错误处理和回退逻辑。
- 强依赖远端 API。会让功能入口在网络失败时不可用，不符合当前本地默认配置策略。

### Decision: API 不暴露管理字段和非公开路由

服务端只返回 `PublicFeatureEntry` 字段；非 `enabled` 状态不返回可导航 `publicRoute`；`hidden` 条目不返回。

Rationale: 功能入口 API 是普通用户公开接口，必须保持和既有公开配置响应边界一致。

Alternatives considered:

- 返回内部字段供前端判断。会泄露运营备注、灰度控制或未发布路由。
- 所有状态都返回路由再由前端拦截。会增加误导航和未开放功能泄露风险。

## Risks / Trade-offs

- [Risk] 默认配置同时被服务端和小程序端打包，后续修改需要重新发布对应端 -> Mitigation: 当前阶段接受本地默认配置作为单一源码；后续后台配置 change 再替换 API 数据源。
- [Risk] 远端失败回退会掩盖 API 故障 -> Mitigation: 小程序端回退时可在开发环境输出日志，生产环境保持用户体验稳定。
- [Risk] API 路径和未来管理接口命名冲突 -> Mitigation: 公开读取接口使用 `/feature-registry/:placement`，后续管理接口另行放入 admin 路由或受权限保护的模块。
- [Risk] 非法 placement 错误处理在小程序端表现不一致 -> Mitigation: 统一客户端方法处理错误并回退，页面不直接调用接口。

## Migration Plan

1. 新增 API 侧 feature registry 查询模块或控制器，接入 `AppModule`。
2. API 使用共享包校验 `placement` 并返回 `FeatureRegistryResponse`。
3. 小程序端新增统一读取方法，优先远端、失败回退本地默认配置。
4. 首页或至少一个入口区域改为通过统一读取方法获取配置。
5. 后续接入后台配置时替换服务端 `FeatureRegistrySource`，保持 API 响应不变。

回滚时，小程序端仍可直接使用本地默认配置，API 控制器可以从 `AppModule` 移除，不影响现有页面基础功能。

## Open Questions

无。
