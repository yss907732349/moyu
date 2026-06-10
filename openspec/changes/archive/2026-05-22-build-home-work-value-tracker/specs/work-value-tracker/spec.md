## ADDED Requirements

### Requirement: 首页工作档案快照读取

小程序首页 SHALL 读取已保存的 `WorkProfileSnapshot` 作为工作价值展示输入，并在可用时同步本人工作档案 API 的最新结果。

#### Scenario: 首页使用本地快照首屏计算

- **WHEN** 用户打开首页且本地存在有效 `WorkProfileSnapshot`
- **THEN** 首页 SHALL 使用该快照立即计算工作价值状态
- **AND** 首页 SHALL NOT 等待 API 返回后才展示已配置状态

#### Scenario: 首页同步远端工作档案

- **WHEN** 首页通过统一工作档案客户端服务成功读取本人工作档案且响应包含快照
- **THEN** 首页 SHALL 使用最新快照重新计算工作价值状态
- **AND** 小程序端 SHALL 更新本地工作档案快照缓存

#### Scenario: 首页同步失败但存在本地快照

- **WHEN** 首页读取本人工作档案 API 失败且本地存在有效快照
- **THEN** 首页 SHALL 继续使用本地快照计算工作价值状态
- **AND** 首页 SHALL NOT 回退到视觉演示金额

### Requirement: 首页真实工作价值展示

小程序首页 SHALL 使用共享工作价值计算结果展示今日已摸金额、每秒收益、工作状态和工作进度。

#### Scenario: 首页展示已配置工作价值

- **WHEN** 首页拥有配置完成的 `WorkProfileSnapshot`
- **THEN** 首页 SHALL 调用共享计算函数生成工作价值状态
- **AND** 首页 SHALL 基于该状态展示今日已摸金额、每秒收益、工作状态和工作进度

#### Scenario: 首页实时刷新工作价值

- **WHEN** 首页处于显示状态且拥有配置完成的工作档案快照
- **THEN** 首页 SHALL 随时间重新计算工作价值状态
- **AND** 金额变化 SHALL 来自共享计算结果而不是固定演示基准金额自增

#### Scenario: 首页停止无效计时

- **WHEN** 首页隐藏或卸载
- **THEN** 小程序端 SHALL 停止首页工作价值刷新计时器

### Requirement: 首页工作价值倒计时

小程序首页 SHALL 展示工作档案可直接推导的倒计时，并避免把未接入的外部日历信息表达为真实倒计时。

#### Scenario: 展示工作档案倒计时

- **WHEN** 首页拥有配置完成的工作档案快照
- **THEN** 首页 SHALL 基于工作价值计算结果展示距上班、距下班、距休息日或距发薪日中的可用倒计时
- **AND** 倒计时 SHALL 使用工作档案快照和当前时间推导

#### Scenario: 倒计时字段不可用

- **WHEN** 工作价值计算结果中某个倒计时字段不可用
- **THEN** 首页 SHALL 使用待配置、待接入或其他非数值占位展示
- **AND** 首页 SHALL NOT 拼接空值作为倒计时

#### Scenario: 外部日历未接入

- **WHEN** 法定节假日、调休或运营活动日历尚未接入
- **THEN** 首页 SHALL NOT 展示硬编码节假日倒计时作为真实倒计时
- **AND** 工作档案 SHALL NOT 被用作法定节假日数据源

### Requirement: 首页保存后刷新

小程序首页 SHALL 在用户从工作档案设置页保存并返回后消费最新快照。

#### Scenario: 保存后返回首页

- **WHEN** 用户在工作档案设置页成功保存工作档案并返回首页
- **THEN** 首页 SHALL 刷新工作档案快照
- **AND** 首页 SHALL 使用最新快照重新计算工作价值状态

#### Scenario: 首页重复显示

- **WHEN** 首页从后台或其他页面返回显示
- **THEN** 首页 SHALL 重新检查本地工作档案快照
- **AND** 首页 SHALL 避免继续展示进入设置页前的旧计算结果

## MODIFIED Requirements

### Requirement: 隐藏模式基础行为

系统 SHALL 提供隐藏模式，用于遮挡首页显性敏感金额展示并切换安全视觉状态。

#### Scenario: 用户开启隐藏模式

- **WHEN** 用户在首页开启隐藏模式
- **THEN** 首页 SHALL 遮挡已摸金额等显性敏感金额展示
- **AND** 首页 SHALL 遮挡每秒收益或替换为安全文案
- **AND** 首页 SHALL 切换为隐藏状态视觉表现

#### Scenario: 隐藏模式不扩大为全量推断遮挡

- **WHEN** 隐藏模式开启
- **THEN** 系统 SHALL NOT 要求第一版遮挡所有可推断薪资的信息
- **AND** 月薪、发薪日、工时等信息的具体展示边界 MAY 由后续页面或设置 change 细化

### Requirement: 设置页保存后快照同步

小程序端 SHALL 在工作档案保存成功后获得可供首页消费的 `WorkProfileSnapshot`。

#### Scenario: 保存成功后获得快照

- **WHEN** 设置页成功保存工作档案
- **THEN** 小程序端 SHALL 获得保存后的 `WorkProfileSnapshot`
- **AND** 该快照 SHALL 与首页本地计算契约兼容

#### Scenario: 本 change 替换首页演示计算

- **WHEN** 工作档案设置页已完成保存且首页拥有配置完成的工作档案快照
- **THEN** 首页 SHALL 使用该快照进行真实工作价值计算
- **AND** 首页 SHALL NOT 继续使用视觉演示金额作为真实已摸金额
