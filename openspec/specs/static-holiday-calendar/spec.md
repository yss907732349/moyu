# static-holiday-calendar Specification

## Purpose

TBD - created by archiving change add-static-holiday-countdown. Update Purpose after archive.

## Requirements

### Requirement: 节假日缓存数据结构

系统 SHALL 定义中国大陆法定节假日缓存数据结构，用于保存已同步并可被前端本地消费的节假日信息。

#### Scenario: 缓存节假日区间

- **WHEN** 系统保存某一年的法定节假日缓存
- **THEN** 缓存 SHALL 包含节假日名称、开始日期、结束日期、所属年份和数据状态
- **AND** 日期 SHALL 使用稳定的 `YYYY-MM-DD` 格式

#### Scenario: 记录来源元数据

- **WHEN** 系统保存某一年的法定节假日缓存
- **THEN** 缓存 SHALL 记录机器同步来源、同步时间和覆盖年份
- **AND** 缓存 SHALL 能记录权威来源 URL、通知标题和核验日期

#### Scenario: 区分数据状态

- **WHEN** 某一年节假日数据来自第三方免费接口但尚未完成权威核验
- **THEN** 系统 SHALL 将该年份标记为待核验状态
- **AND** 系统 SHALL NOT 将其表达为权威已核验数据

### Requirement: 节假日同步脚本

系统 SHALL 提供显式节假日同步脚本，用于从候选免费接口获取机器可读节假日数据并更新本地缓存。

#### Scenario: 同步候选接口数据

- **WHEN** 开发者运行节假日同步命令
- **THEN** 脚本 SHALL 请求配置的候选免费节假日接口
- **AND** 脚本 SHALL 将返回数据归一化为共享节假日缓存结构

#### Scenario: 同步失败保留旧缓存

- **WHEN** 候选免费接口不可用、返回结构不合法或网络请求失败
- **THEN** 同步脚本 SHALL 报告失败原因
- **AND** 同步脚本 SHALL NOT 用不完整或不可解析的数据覆盖现有可用缓存

#### Scenario: 不在小程序运行时同步

- **WHEN** 小程序首页需要展示节假日倒计时
- **THEN** 小程序 SHALL 使用项目内已同步的节假日缓存和共享查询函数
- **AND** 小程序 SHALL NOT 在首页运行时直接请求第三方免费节假日接口

### Requirement: 权威核验边界

系统 SHALL 将国务院办公厅正式通知等权威来源作为中国大陆法定节假日最终核验依据。

#### Scenario: 权威通知已发布

- **WHEN** 某一年国务院办公厅正式节假日安排已经发布且完成核验
- **THEN** 该年份缓存 SHALL 记录权威来源 URL、通知标题和核验日期
- **AND** 该年份数据 MAY 标记为已核验

#### Scenario: 权威通知未发布

- **WHEN** 某一年国务院办公厅正式节假日安排尚未发布
- **THEN** 系统 SHALL 将该年份标记为待发布或待同步状态
- **AND** 系统 SHALL NOT 使用预测日期将该年份标记为已核验

### Requirement: 下一个法定节假日查询

系统 SHALL 提供共享查询能力，用于根据当前日期从节假日缓存中获取下一个法定节假日。

#### Scenario: 存在未来节假日

- **WHEN** 调用方传入当前日期且缓存中存在当前日期之后的法定节假日
- **THEN** 查询结果 SHALL 返回最近的节假日名称、开始日期、结束日期、剩余天数和数据状态

#### Scenario: 当前处于节假日区间

- **WHEN** 当前日期位于某个节假日开始日期和结束日期之间
- **THEN** 查询结果 SHALL 返回该节假日
- **AND** 剩余天数 SHALL 表示当前距离节假日开始日期不大于 0 或使用明确的进行中状态

#### Scenario: 无可用未来数据

- **WHEN** 缓存中不存在当前日期之后的可用节假日
- **THEN** 查询结果 SHALL 返回无可用数据状态
- **AND** 调用方 SHALL 能据此展示待发布、待同步或待接入占位

### Requirement: 节假日数据验证

系统 SHALL 提供节假日缓存验证脚本，用于在提交或发布前发现日期错误、来源缺失和过期风险。

#### Scenario: 验证日期与区间

- **WHEN** 开发者运行节假日验证命令
- **THEN** 脚本 SHALL 检查所有日期是否为 `YYYY-MM-DD` 格式
- **AND** 脚本 SHALL 检查每个结束日期不早于开始日期

#### Scenario: 验证年份覆盖

- **WHEN** 开发者运行节假日验证命令
- **THEN** 脚本 SHALL 检查当前年份和下一年份的数据状态
- **AND** 脚本 SHALL 对下一年份权威通知未发布的情况给出明确提示，而不是要求预测数据通过核验

#### Scenario: 验证来源元数据

- **WHEN** 某一年缓存被标记为已核验
- **THEN** 验证脚本 SHALL 要求该年份存在权威来源 URL、通知标题和核验日期
- **AND** 验证脚本 SHALL 在缺失这些字段时失败

#### Scenario: 验证过期风险

- **WHEN** 当前日期已经超过缓存覆盖范围且没有未来节假日可查询
- **THEN** 验证脚本 SHALL 失败或给出阻断级错误
- **AND** 系统 SHALL NOT 继续把过期节假日数据作为首页真实倒计时来源
