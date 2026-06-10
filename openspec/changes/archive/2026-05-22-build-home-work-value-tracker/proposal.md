## Why

工作档案设置已经完成保存、回读和本地快照同步，但首页仍展示视觉演示金额、静态倒计时和未接入的隐藏模式。这个 change 用于把首页核心体验接上已保存的 `WorkProfileSnapshot`，让用户配置薪资和上班时间后能看到真实的娱乐化已摸金额、工作状态和倒计时反馈。

## What Changes

- 首页读取已保存工作档案快照，并使用共享计算函数在小程序端本地实时计算今日已摸金额、每秒收益、工作状态和工作进度。
- 首页未配置工作档案时展示配置引导，不再把视觉演示金额当作真实数据。
- 用户从工作档案设置页保存并返回首页后，首页刷新并消费最新快照。
- 首页倒计时卡替换为工作档案可直接推导的距上班、距下班、距休息日和距发薪日信息。
- 首页隐藏模式遮挡显性敏感金额展示，并切换为低调安全视觉状态。
- 保留 feature registry 入口和独立设置页路径，不新增工作档案字段、薪资模式或后端每秒更新能力。
- 不接入法定节假日、调休、请假、大小周、复杂排班、真实微信登录、成长发奖或记账业务模型。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `work-value-tracker`: 补充首页真实工作价值展示、未配置状态、快照刷新、倒计时展示和隐藏模式消费要求。

## Impact

- `apps/miniapp/src/pages/home/index.vue`: 替换演示金额、静态倒计时和隐藏按钮行为，接入工作档案快照与共享计算结果。
- `apps/miniapp/src/services/work-profile.ts`: 复用现有本人工作档案客户端服务，必要时补充首页读取快照的辅助方法。
- `packages/shared/src/work-profile.ts`: 复用现有 `calculateWorkValueState`、`WorkValueState`、`WorkStatus` 和倒计时输出；如发现展示所需格式缺口，应优先以小程序展示层适配。
- `scripts/verify-miniapp-work-profile.ts` 或新增验证脚本：覆盖首页快照消费、未配置状态、隐藏模式和倒计时映射。
- 不影响后端 API 路由、Prisma 工作档案模型或 feature registry 公开契约。
