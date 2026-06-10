# CPS 补给铺商业闭环数据兼容策略

## 目标

本策略用于 `deepen-cps-supply-commercial-loop` 变更落地时兼容既有补给项、点击记录、订单同步记录和生存账本记录，避免旧数据阻塞内测链路。

## 兼容规则

- 既有补给项按 `sectionKey` 补齐活动分组、用户可见标签、推荐时段和工作日展示规则。
- 既有补给项默认使用 `displayPriority = 50`、`attributionWindowHours = 168`、`transferExpiresMinutes = 30`、`clickDedupeWindowSeconds = 300` 和 `fallbackStrategy = none`。
- 既有点击记录保留旧 `sid` 兼容未完成回流订单，同时生成 `sidDigest = SHA2(sid, 256)` 和 `sidMasked`；后台和普通用户响应只使用脱敏值。
- 既有订单同步记录补齐 `sourceProvider = jutuike`、`mappedStatus`、`ledgerAction` 和首条 `statusHistory`。
- 既有已入账生存账本记录补齐用户可读 `displayStatusReason`；后续退款、取消、无效或风控状态通过来源订单幂等更新回滚。

## 执行方式

- 新增迁移：`apps/api/prisma/migrations/20260601120000_deepen_cps_supply_commercial_loop/migration.sql`。
- 验证命令：`pnpm verify:supply-center`、`pnpm verify:supply-center-api`、`pnpm verify:accounting-ledger`、`pnpm verify:admin-supply-center` 和 `pnpm verify:admin-operations`。
- 回滚时保留新增字段，恢复旧补给铺展示也不回退来源订单幂等键，避免重复入账。
