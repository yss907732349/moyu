## ADDED Requirements

### Requirement: 工作档案设置页

小程序端 SHALL 提供工作档案设置页，让用户配置第一版工作价值计算所需的本人设置。

#### Scenario: 用户进入工作档案设置页

- **WHEN** 用户通过薪资和上班时间设置入口进入设置页
- **THEN** 小程序端 SHALL 展示工作档案设置表单
- **AND** 表单 SHALL 覆盖月薪金额、上班开始时间、上班结束时间、休息段、工作日规则、发薪日和隐藏模式

#### Scenario: 设置页加载已有档案

- **WHEN** 用户进入设置页且本人已经保存工作档案
- **THEN** 小程序端 SHALL 读取本人工作档案
- **AND** 设置页 SHALL 使用已保存字段填充表单

#### Scenario: 设置页加载未配置状态

- **WHEN** 用户进入设置页且本人尚未保存工作档案
- **THEN** 设置页 SHALL 展示默认表单值或空状态引导
- **AND** 设置页 SHALL NOT 使用首页视觉演示数据作为已保存工作档案

### Requirement: 工作档案表单校验反馈

小程序端 SHALL 在保存工作档案前或保存失败后向用户展示可理解的字段级校验反馈。

#### Scenario: 用户提交非法月薪

- **WHEN** 用户提交超出支持范围或格式无效的月薪金额
- **THEN** 小程序端 SHALL 阻止保存或展示服务端返回的校验错误
- **AND** 错误反馈 SHALL 指向月薪字段

#### Scenario: 用户提交非法工作时间

- **WHEN** 用户提交结束时间不晚于开始时间，或休息段不在工作时段内
- **THEN** 小程序端 SHALL 阻止保存或展示服务端返回的校验错误
- **AND** 错误反馈 SHALL 指向工作时间或休息段字段

#### Scenario: 用户提交非法工作日规则

- **WHEN** 用户选择自定义工作日但没有选择任何有效星期
- **THEN** 小程序端 SHALL 阻止保存或展示服务端返回的校验错误
- **AND** 错误反馈 SHALL 指向工作日规则字段

### Requirement: 本人工作档案 API

系统 SHALL 提供本人工作档案读取与保存 API，用于小程序端同步敏感工作档案设置。

#### Scenario: 本人读取工作档案

- **WHEN** 小程序端请求本人工作档案
- **THEN** API SHALL 返回与 `GetWorkProfileResponse` 等价的响应结构
- **AND** 响应 SHALL 只包含当前本人可见的工作档案字段

#### Scenario: 本人保存工作档案

- **WHEN** 小程序端提交有效的工作档案保存请求
- **THEN** API SHALL 保存或覆盖当前本人的工作档案
- **AND** API SHALL 返回与 `SaveWorkProfileResponse` 等价的响应结构
- **AND** 响应 SHALL 包含保存后的 `WorkProfileSnapshot`

#### Scenario: API 拒绝非法工作档案

- **WHEN** 小程序端提交不符合共享校验规则的工作档案
- **THEN** API SHALL 拒绝保存
- **AND** API SHALL 返回客户端错误和可用于表单反馈的校验信息

### Requirement: 工作档案持久化

系统 SHALL 持久化保存每个用户本人的工作档案，并保证同一用户只有一份当前有效工作档案。

#### Scenario: 首次保存工作档案

- **WHEN** 当前本人尚无工作档案且提交有效保存请求
- **THEN** 系统 SHALL 创建该用户的工作档案记录
- **AND** 记录 SHALL 包含创建时间和更新时间

#### Scenario: 覆盖保存工作档案

- **WHEN** 当前本人已有工作档案且提交有效保存请求
- **THEN** 系统 SHALL 更新该用户现有工作档案记录
- **AND** 系统 SHALL 更新该记录的更新时间

#### Scenario: 持久化字段不公开

- **WHEN** 社区、公开资料、功能入口或其他普通公开接口返回用户信息
- **THEN** 系统 SHALL NOT 暴露持久化工作档案中的薪资、工作时间、休息段、工作日、发薪日或隐藏模式字段

### Requirement: 临时本人上下文

在真实微信登录实现前，系统 SHALL 使用明确标记的临时本人上下文支持工作档案 API 的本地开发和验证。

#### Scenario: 使用临时本人上下文保存

- **WHEN** 真实登录态尚未实现且小程序端保存工作档案
- **THEN** API SHALL 将请求归属到临时本人用户
- **AND** 该临时用户标识 SHALL NOT 被表达为真实微信登录能力

#### Scenario: 后续替换为真实登录态

- **WHEN** 后续微信登录能力提供真实当前用户身份
- **THEN** 工作档案 API SHALL 能以真实本人用户身份替换临时本人上下文
- **AND** API 路由和响应契约 SHALL 保持稳定

### Requirement: 小程序工作档案客户端服务

小程序端 SHALL 通过统一客户端服务读取和保存工作档案，而不是在页面中直接散落 API 请求逻辑。

#### Scenario: 设置页读取工作档案

- **WHEN** 设置页需要加载本人工作档案
- **THEN** 设置页 SHALL 调用统一工作档案客户端服务
- **AND** 客户端服务 SHALL 负责请求 API 和校验响应结构

#### Scenario: 设置页保存工作档案

- **WHEN** 设置页提交工作档案表单
- **THEN** 设置页 SHALL 调用统一工作档案客户端服务保存
- **AND** 客户端服务 SHALL 返回保存后的工作档案和快照，或返回可展示的错误

### Requirement: 设置页保存后快照同步

小程序端 SHALL 在工作档案保存成功后获得可供首页后续消费的 `WorkProfileSnapshot`。

#### Scenario: 保存成功后获得快照

- **WHEN** 设置页成功保存工作档案
- **THEN** 小程序端 SHALL 获得保存后的 `WorkProfileSnapshot`
- **AND** 该快照 SHALL 与后续首页本地计算契约兼容

#### Scenario: 本 change 不替换首页演示计算

- **WHEN** 工作档案设置页在本 change 中完成保存
- **THEN** 首页 MAY 仍保持视觉演示金额
- **AND** 首页真实已摸金额替换 SHALL 由后续 change 明确实现
