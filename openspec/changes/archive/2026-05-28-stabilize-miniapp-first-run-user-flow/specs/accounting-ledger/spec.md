## ADDED Requirements

### Requirement: 生存账本首跑空状态

小程序生存账本 SHALL 区分真实 0 数据、无订单空状态和 API 错误态，不得使用种子账单伪造用户消费。

#### Scenario: 今日无生存消耗

- **WHEN** 用户今日没有计入统计的 CPS 生存账单
- **THEN** 首页今日生存消耗 SHALL 展示 `¥0.00` 或等价 0 值状态
- **AND** 三类生存消耗 SHALL 分别展示 0 值或明确无订单状态
- **AND** 首页 SHALL NOT 将真实 0 数据展示为接口不可用

#### Scenario: 账本详情无订单

- **WHEN** 用户进入生存账本详情页且当前筛选范围没有账单
- **THEN** 小程序 SHALL 展示暂无同步到的生存消耗
- **AND** 页面 SHALL 说明订单同步后会自动归类到三类生存消耗
- **AND** 页面 SHALL NOT 引导用户手动记账作为第一版主流程

#### Scenario: 本周报告无数据

- **WHEN** 用户本周没有计入统计的生存账单
- **THEN** 本周生存报告 SHALL 展示 0 值报告
- **AND** 外卖次数、下午续命次数、通勤订单数和三类金额 SHALL 使用 0 值或空状态表达

#### Scenario: 账本 API 错误

- **WHEN** 生存账本 API 不可用或返回错误
- **THEN** 小程序 SHALL 展示生存账本暂不可用或重试提示
- **AND** 小程序 SHALL NOT 将接口错误伪装为真实 0 消费

### Requirement: 生存账本不使用用户消费种子

系统 SHALL NOT 为普通用户自动创建种子消费账单来填充首跑体验。

#### Scenario: 首次用户没有 CPS 订单

- **WHEN** 新用户尚未同步任何 CPS 订单
- **THEN** 系统 SHALL 返回空账单、0 值今日摘要和 0 值本周报告
- **AND** 系统 SHALL NOT 自动创建外卖、下午茶或通勤假订单

#### Scenario: 开发验证账本空状态

- **WHEN** 开发者验证生存账本首跑体验
- **THEN** 验证 SHALL 覆盖无订单的 0 值和空状态
- **AND** 验证 SHALL NOT 依赖默认伪造消费来通过
