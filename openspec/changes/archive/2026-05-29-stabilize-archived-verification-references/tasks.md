## 1. 验证脚本路径修正

- [x] 1.1 将 `scripts/verify-miniapp-daily-content-feed.mjs` 中对 `stabilize-miniapp-first-run-user-flow/dev-seed-strategy.md` 的引用改为归档路径。
- [x] 1.2 将 `scripts/verify-miniapp-accounting-ledger.ts` 中对 `stabilize-miniapp-first-run-user-flow/dev-seed-strategy.md` 的引用改为归档路径。
- [x] 1.3 确保依赖 `dev-seed-strategy.md` 的验证脚本在文件缺失时失败并给出明确断言信息。

## 2. 规则与回归检查

- [x] 2.1 使用全文搜索确认 `scripts/` 中不再存在指向已归档 change 的未归档路径引用。
- [x] 2.2 运行 `pnpm verify:miniapp-daily-content-feed`、`pnpm verify:miniapp-accounting-ledger` 和 `pnpm verify:miniapp-community-lite`。
- [x] 2.3 运行 OpenSpec 校验，确认 `project-foundation` delta 和本 change 文档结构有效。
