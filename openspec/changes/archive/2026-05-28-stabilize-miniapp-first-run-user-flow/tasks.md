## 1. Implementation

- [x] 1.1 统一小程序客户端服务 API base URL 配置。
- [x] 1.2 实现首跑状态推导，覆盖未登录、未建档、未配置工作档案和 ready 状态。
- [x] 1.3 首页身份区接入真实用户成长资料或合法本地快照，移除静态身份展示。
- [x] 1.4 首页工作档案未配置时展示配置引导，移除演示金额和假工作状态。
- [x] 1.5 工作档案保存成功后写入本地快照并返回首页即时计算。
- [x] 1.6 建档成功后在个人页提供配置工作档案下一步入口。
- [x] 1.7 已完成工作档案配置的用户不再看到待办式配置入口。
- [x] 1.8 保留“我的成就”区域，不删除或重命名。
- [x] 1.9 日报补齐无已发布内容、空栏目和接口错误体验。
- [x] 1.10 社区补齐未登录、未建档、空分区和接口错误体验。
- [x] 1.11 生存账本补齐真实 0 数据、无订单和接口错误体验。
- [x] 1.12 明确日报、社区和生存账本开发演示种子边界。

## 2. Verification

- [x] 2.1 `openspec validate stabilize-miniapp-first-run-user-flow --strict`
- [x] 2.2 `corepack pnpm format:check`
- [x] 2.3 `corepack pnpm lint`
- [x] 2.4 `corepack pnpm -r --workspace-concurrency=1 typecheck`
- [x] 2.5 `corepack pnpm verify:miniapp-api-config`
- [x] 2.6 `corepack pnpm verify:miniapp-user-growth-profile`
- [x] 2.7 `corepack pnpm verify:miniapp-work-profile`
- [x] 2.8 `corepack pnpm verify:miniapp-daily-content-feed`
- [x] 2.9 `corepack pnpm verify:miniapp-community-lite`
- [x] 2.10 `corepack pnpm verify:miniapp-accounting-ledger`
- [x] 2.11 `corepack pnpm build:miniapp`
