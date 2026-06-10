## ADDED Requirements

### Requirement: CPS 订单幂等状态机

系统 SHALL 以 CPS 来源订单为幂等事实源，基于订单状态机创建、更新、排除或回滚本人生存账单。

#### Scenario: 来源订单幂等键

- **WHEN** 系统同步或导入 CPS 订单
- **THEN** 系统 SHALL 使用 `sourceProvider` 和 `sourceOrderId` 作为幂等键
- **AND** 重复同步同一来源订单 SHALL 更新已有同步记录和对应生存账单
- **AND** 系统 SHALL NOT 为同一来源订单创建多条计入统计的生存账单

#### Scenario: 有效订单入账

- **WHEN** CPS 订单状态映射为有效且存在有效归因用户
- **THEN** 系统 SHALL 创建或更新该用户本人生存账单
- **AND** 该账单 SHALL 按 `隐者食堂`、`下午续命` 或 `通勤` 分类参与今日摘要和本周报告

#### Scenario: 待确认订单不计入有效统计

- **WHEN** CPS 订单状态为未支付、待支付、未知、待排查或无法确认有效
- **THEN** 系统 SHALL 保存同步记录和排查原因
- **AND** 系统 SHALL NOT 将该订单金额计入今日摘要或本周报告

#### Scenario: 状态历史可追踪

- **WHEN** 同一 CPS 来源订单发生状态变化
- **THEN** 系统 SHALL 保存最新状态和可用于后台排查的状态变化记录或等价审计信息
- **AND** 后台 SHALL 能区分首次同步、重复同步、状态升级、退款回滚和异常排除

### Requirement: CPS 订单退款回滚

系统 SHALL 在已入账 CPS 订单后续变为退款、取消、无效、风控或结算失败时回滚生存账本统计。

#### Scenario: 已入账订单变为退款

- **WHEN** 已计入生存账本的 CPS 订单后续同步为退款、取消、无效、风控或结算失败
- **THEN** 系统 SHALL 将对应生存账单更新为不计入有效生存消耗
- **AND** 首页今日摘要和本周生存报告 SHALL 不再统计该订单金额

#### Scenario: 退款回滚保持明细可解释

- **WHEN** 用户查看已回滚订单所在期间的生存账本详情
- **THEN** 小程序 SHALL 以普通用户可理解状态展示该笔补给已失效或未计入
- **AND** 小程序 SHALL NOT 展示退款佣金、结算失败原因、聚推客订单号、完整 `sid` 或后台异常原因码

#### Scenario: 金额变更更新账本

- **WHEN** 同一 CPS 来源订单重复同步且有效金额发生变化
- **THEN** 系统 SHALL 更新对应生存账单金额
- **AND** 今日摘要和本周生存报告 SHALL 使用最新有效金额重新计算

### Requirement: 无归因订单异常池

系统 SHALL 将无法匹配有效归因的 CPS 订单保存为后台异常记录，并 SHALL NOT 写入任意用户生存账本。

#### Scenario: 订单缺少 sid

- **WHEN** CPS 订单缺少 `sid` 或等价归因 token
- **THEN** 系统 SHALL 将订单标记为无归因异常
- **AND** 系统 SHALL NOT 将订单归入任何用户生存账本

#### Scenario: sid 无法匹配

- **WHEN** CPS 订单携带的 `sid` 无法匹配有效补给点击归因
- **THEN** 系统 SHALL 将订单标记为归因未匹配异常
- **AND** 系统 SHALL NOT 基于活动标识、品牌标识、金额或时间猜测用户归属

#### Scenario: sid 过期或活动不匹配

- **WHEN** CPS 订单匹配到归因 token 但归因窗口已过期或活动标识不一致
- **THEN** 系统 SHALL 将订单标记为过期归因或活动不匹配异常
- **AND** 系统 SHALL NOT 将该订单写入用户生存账本

### Requirement: CPS 生存分类优先级

系统 SHALL 使用可解释的分类优先级将有效 CPS 订单归入三类生存账本分类。

#### Scenario: 优先使用补给项默认分类

- **WHEN** CPS 订单通过有效 `sid` 匹配到补给点击
- **THEN** 系统 SHALL 优先使用该补给项配置的默认生存分类
- **AND** 订单标题、品牌或活动兜底规则 SHALL NOT 覆盖补给项默认分类

#### Scenario: 使用兜底分类

- **WHEN** CPS 订单没有可用补给项默认分类但已被允许进行兜底归类
- **THEN** 系统 SHALL 根据活动、品牌、商品标题或来源标签归入 `隐者食堂`、`下午续命` 或 `通勤`
- **AND** 系统 SHALL NOT 将非上班生存类订单默认归入三类生存账本

#### Scenario: 分类无法确定

- **WHEN** CPS 订单无法确定属于三类生存分类
- **THEN** 系统 SHALL 将订单标记为分类异常或不计入
- **AND** 系统 SHALL NOT 创建展示给用户的模糊分类账单

### Requirement: CPS 闭环账本验证

项目 SHALL 提供验证覆盖 CPS 商业闭环中的订单幂等、归因异常、状态变更和退款回滚。

#### Scenario: 验证重复同步

- **WHEN** 开发者运行生存账本或 CPS 补给铺相关验证命令
- **THEN** 验证 SHALL 检查同一来源订单重复同步只更新一条生存账单
- **AND** 验证 SHALL 检查今日摘要和本周报告不会重复计入金额

#### Scenario: 验证退款回滚

- **WHEN** 验证输入先同步有效订单再同步退款或无效状态
- **THEN** 验证 SHALL 检查对应生存账单不再计入有效统计
- **AND** 验证 SHALL 检查用户侧响应不暴露聚推客内部字段

#### Scenario: 验证无归因订单

- **WHEN** 验证输入包含缺少 `sid`、`sid` 无法匹配、`sid` 过期或活动不匹配的订单
- **THEN** 验证 SHALL 检查这些订单进入异常记录或不计入状态
- **AND** 验证 SHALL 检查这些订单不会写入任何用户生存账本
