## ADDED Requirements

### Requirement: 补给铺视觉状态

补给铺 SHALL 使用统一插画、语义 icon 和状态面板表达三类补给、主推荐、空补给、补给不可用和转链失败状态。

#### Scenario: 三类补给展示语义 icon

- **WHEN** 补给铺展示 `隐者食堂`、`下午续命` 和 `通勤补给` 板块
- **THEN** 每个板块 SHALL 展示与场景语义匹配的像素 icon 或同风格 fallback
- **AND** 页面 SHALL NOT 使用完全相同的无语义圆点替代所有板块 icon

#### Scenario: 主推荐保持工具可读

- **WHEN** 补给铺展示主推荐
- **THEN** 主推荐 SHALL 使用暗色 RPG 面板、标题、说明、标签和原生操作按钮承载动态信息
- **AND** 插画或背景 SHALL NOT 暴露 CPS、聚推客、佣金、活动内部 ID 或平台密钥语义

#### Scenario: 空补给展示状态场景

- **WHEN** 当前无可展示补给或某个板块暂未上架补给
- **THEN** 补给铺 SHALL 展示统一空状态视觉、原因说明和可恢复提示
- **AND** 页面 SHALL NOT 注入假补给项或假订单作为展示数据

#### Scenario: 转链失败展示错误视觉

- **WHEN** 用户点击补给项但转链、备用通道或跳转目标不可用
- **THEN** 补给铺 SHALL 展示转链失败状态视觉和重试或返回操作
- **AND** 页面 SHALL NOT 在小程序公开侧展示聚推客密钥、内部排查字段或原始错误响应
