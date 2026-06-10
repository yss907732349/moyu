## ADDED Requirements

### Requirement: 账单模型

系统 SHALL 定义本人账单模型，用于记录用户确认的基础收入和支出。

#### Scenario: 用户创建支出账单

- **WHEN** 已登录用户提交有效的支出金额、支出分类、发生日期和可选备注
- **THEN** 系统 SHALL 创建归属于该用户本人的支出账单
- **AND** 账单 SHALL 包含稳定账单 ID、方向、金额、币种、分类、发生日期、状态、来源、创建时间和更新时间

#### Scenario: 用户创建收入账单

- **WHEN** 已登录用户提交有效的收入金额、收入分类、发生日期和可选备注
- **THEN** 系统 SHALL 创建归属于该用户本人的收入账单
- **AND** 账单 SHALL 使用收入方向参与后续统计

#### Scenario: 金额使用最小货币单位

- **WHEN** 系统保存或统计账单金额
- **THEN** 金额 SHALL 使用最小货币单位表示
- **AND** 第一版默认币种 SHALL 为 `CNY`

### Requirement: 账单分类

系统 SHALL 提供第一版内置账单分类，并通过稳定 `categoryKey` 标识分类。

#### Scenario: 使用内置支出分类

- **WHEN** 用户记录支出账单
- **THEN** 系统 SHALL 允许用户选择内置支出分类
- **AND** 支出分类 SHALL 至少覆盖餐饮、交通、购物、娱乐、居住、通讯、医疗、学习和其他

#### Scenario: 使用内置收入分类

- **WHEN** 用户记录收入账单
- **THEN** 系统 SHALL 允许用户选择内置收入分类
- **AND** 收入分类 SHALL 至少覆盖工资、副业、奖金、报销和其他

#### Scenario: 拒绝方向不匹配分类

- **WHEN** 用户提交的账单方向与分类方向不匹配
- **THEN** 系统 SHALL 拒绝保存该账单
- **AND** 系统 SHALL 返回可用于表单反馈的分类错误

### Requirement: 账单校验

系统 SHALL 在创建或更新账单前校验金额、分类、发生日期和备注。

#### Scenario: 拒绝非法金额

- **WHEN** 用户提交金额为空、为零、为负数或超出支持范围
- **THEN** 系统 SHALL 拒绝保存账单
- **AND** 错误反馈 SHALL 指向金额字段

#### Scenario: 拒绝非法发生日期

- **WHEN** 用户提交格式非法或超出支持范围的发生日期
- **THEN** 系统 SHALL 拒绝保存账单
- **AND** 错误反馈 SHALL 指向发生日期字段

#### Scenario: 限制备注长度

- **WHEN** 用户提交超过第一版长度限制的备注
- **THEN** 系统 SHALL 拒绝保存账单
- **AND** 错误反馈 SHALL 指向备注字段

### Requirement: 账单状态

系统 SHALL 使用账单状态区分正式账单、草稿和作废账单。

#### Scenario: 手动账单默认正式入账

- **WHEN** 用户通过手动记账流程成功创建账单
- **THEN** 账单状态 SHALL 为 `posted`
- **AND** 账单 SHALL 参与本人当日和本月统计

#### Scenario: 作废账单不参与统计

- **WHEN** 用户删除或作废一笔账单
- **THEN** 系统 SHALL 将该账单从正式统计口径中排除
- **AND** 系统 SHALL NOT 在本人当日或本月统计中继续计入该账单金额

#### Scenario: 草稿账单不参与统计

- **WHEN** 系统存在 `draft` 状态账单
- **THEN** 该账单 SHALL NOT 参与本人当日或本月统计
- **AND** 小程序端 SHALL 明确展示其待确认状态

### Requirement: 统计口径

系统 SHALL 为本人账本提供当日和本月统计，统计收入、支出和净额。

#### Scenario: 统计当日账单

- **WHEN** 用户查看当日统计
- **THEN** 系统 SHALL 仅统计发生日期属于该业务日期的本人 `posted` 账单
- **AND** 系统 SHALL 分别返回收入总额、支出总额和净额

#### Scenario: 统计本月账单

- **WHEN** 用户查看本月统计
- **THEN** 系统 SHALL 仅统计发生日期属于该自然月的本人 `posted` 账单
- **AND** 系统 SHALL 分别返回收入总额、支出总额和净额

#### Scenario: 统计排除非本人账单

- **WHEN** 系统计算本人账本统计
- **THEN** 系统 SHALL NOT 计入其他用户的账单
- **AND** 系统 SHALL NOT 返回其他用户的账单明细

### Requirement: 本人账本 API

系统 SHALL 提供本人账本 API，用于创建、读取、更新、作废账单和获取统计。

#### Scenario: 创建本人账单

- **WHEN** 小程序端提交有效账单创建请求
- **THEN** API SHALL 在当前本人上下文下创建账单
- **AND** API SHALL 返回创建后的账单快照

#### Scenario: 读取本人账单列表

- **WHEN** 小程序端请求本人账单列表
- **THEN** API SHALL 返回当前本人可见的账单列表
- **AND** API SHALL 支持按发生日期范围和账单方向过滤

#### Scenario: 更新本人账单

- **WHEN** 小程序端提交有效账单更新请求且账单归属于当前本人
- **THEN** API SHALL 更新该账单
- **AND** API SHALL 返回更新后的账单快照

#### Scenario: 拒绝访问他人账单

- **WHEN** 用户尝试读取、更新或作废不属于自己的账单
- **THEN** API SHALL 拒绝该操作
- **AND** API SHALL NOT 返回该账单的敏感字段

### Requirement: 小程序记账流程

小程序端 SHALL 提供正式记账流程，用于记录和查看本人账单。

#### Scenario: 用户进入记账页

- **WHEN** 用户从首页记账入口进入记账流程
- **THEN** 小程序端 SHALL 展示记账页面
- **AND** 页面 SHALL 支持选择收入或支出、分类、金额、发生日期和备注

#### Scenario: 用户保存账单后查看统计

- **WHEN** 用户成功保存一笔账单
- **THEN** 小程序端 SHALL 刷新本人账单列表或统计摘要
- **AND** 小程序端 SHALL NOT 只更新本地演示计数

#### Scenario: API 不可用时提示失败

- **WHEN** 小程序端保存账单时 API 请求失败或返回不可用响应
- **THEN** 小程序端 SHALL 展示保存失败反馈
- **AND** 小程序端 SHALL NOT 将失败请求展示为已正式入账

### Requirement: 首页记账入口

首页底部 tab 上方横向辅助工具横幅 SHALL 作为正式记账入口。

#### Scenario: 首页展示记账入口

- **WHEN** 用户打开首页
- **THEN** 首页 SHALL 展示记账入口横幅
- **AND** 横幅 SHALL 包含账本相关标题、简短说明和 `记一笔` 主操作

#### Scenario: 点击记一笔进入正式流程

- **WHEN** 用户点击首页横幅中的 `记一笔`
- **THEN** 小程序端 SHALL 导航到正式记账记录页
- **AND** 首页 SHALL NOT 只增加本地计数或展示演示成功状态

#### Scenario: 首页展示账本摘要

- **WHEN** 首页可以读取本人账本统计摘要
- **THEN** 首页 MAY 展示当日或本月账本摘要
- **AND** 摘要 SHALL 来自正式账本统计或统一账本客户端服务

### Requirement: 账本隐私边界

系统 SHALL 将账单明细、分类偏好和统计数据作为本人私有财务习惯数据处理。

#### Scenario: 本人读取账本数据

- **WHEN** 已登录用户读取自己的账本列表或统计
- **THEN** 系统 SHALL 返回该用户本人可见的账本数据

#### Scenario: 公开场景不暴露账本数据

- **WHEN** 社区、排行榜、公开资料、功能入口或其他公开接口需要展示用户信息
- **THEN** 系统 SHALL NOT 默认暴露用户账单明细、账本统计、分类偏好或消费来源

#### Scenario: 客户端不能指定任意用户

- **WHEN** 小程序端请求账本 API
- **THEN** API SHALL 从本人上下文识别用户
- **AND** API SHALL NOT 接受客户端提交的任意用户 ID 作为账本归属依据

### Requirement: CPS 来源预留

系统 SHALL 为未来 CPS 订单来源预留账单来源字段，但第一版不得默认自动入账。

#### Scenario: 手动账单来源

- **WHEN** 用户通过手动记账流程创建账单
- **THEN** 账单来源 SHALL 为 `manual`
- **AND** 账单 SHALL 不要求存在 CPS 平台或订单 ID

#### Scenario: CPS 订单不得直接正式入账

- **WHEN** 未来系统获得美团、饿了么、京东外卖、滴滴打车或会员充值 CPS 订单
- **THEN** 系统 SHALL NOT 默认将该订单直接写入 `posted` 正式账单
- **AND** 系统 SHALL 只能生成待确认草稿、入口提示或其他非正式入账状态

#### Scenario: 用户确认后才纳入统计

- **WHEN** 用户确认由 CPS 订单生成的账单草稿
- **THEN** 系统 SHALL 将确认后的账单转为正式账单
- **AND** 该账单 SHALL 从确认后按正式账单统计口径参与统计

### Requirement: 共享账本契约

跨端共享包 SHALL 提供账本类型、枚举、分类、校验和统计函数。

#### Scenario: API 复用共享契约

- **WHEN** API 处理账单请求或返回账单响应
- **THEN** API SHALL 复用共享包中的账本类型、状态枚举、分类定义和响应契约

#### Scenario: 小程序端复用共享契约

- **WHEN** 小程序端渲染记账表单、账单列表或统计摘要
- **THEN** 小程序端 SHALL 复用共享包中的分类、校验和展示所需契约

#### Scenario: 统计函数可复用

- **WHEN** 系统需要基于账单快照计算收入、支出和净额
- **THEN** 系统 SHALL 调用共享统计函数或遵循等价共享统计口径
