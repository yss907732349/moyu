## ADDED Requirements

### Requirement: 小程序 API base URL 统一配置

小程序端 SHALL 通过统一配置来源决定所有客户端服务的 API base URL，不得由各服务维护互相不一致的默认后端地址。

#### Scenario: 所有服务使用同一 base URL

- **WHEN** 小程序端调用登录、用户资料、工作档案、功能入口、日报、社区或生存账本服务
- **THEN** 这些服务 SHALL 使用同一个 API base URL 配置来源
- **AND** 服务之间 SHALL NOT 同时混用 `127.0.0.1`、`localhost`、局域网 IP 或其他默认地址作为事实默认值

#### Scenario: 环境变量覆盖默认地址

- **WHEN** 构建环境提供 `VITE_API_BASE_URL`
- **THEN** 小程序客户端服务 SHALL 使用该值作为 API base URL
- **AND** 默认地址 SHALL 仅在未显式配置环境变量时使用

#### Scenario: 真机调试使用显式配置

- **WHEN** 开发者需要在微信真机中访问局域网 API
- **THEN** 项目 SHALL 允许通过环境配置显式设置局域网 API 地址
- **AND** 小程序服务代码 SHALL NOT 为单个服务硬编码特殊局域网地址

### Requirement: 首跑状态推导

小程序端 SHALL 基于真实登录态、用户成长资料状态和工作档案状态推导首跑状态，用于首页引导和跨页面链路串联。

#### Scenario: 未登录状态

- **WHEN** 本地没有有效应用登录态
- **THEN** 首跑状态 SHALL 为 `logged_out`
- **AND** 首页 SHALL 引导用户先完成微信登录

#### Scenario: 已登录未建档状态

- **WHEN** 本地存在有效应用登录态
- **AND** 本人资料 API 返回 `profileCreated: false`
- **AND** 本地没有合法用户成长资料快照可降级
- **THEN** 首跑状态 SHALL 为 `profile_missing`
- **AND** 首页 SHALL 引导用户创建隐者档案

#### Scenario: 已建档未配置工作档案状态

- **WHEN** 小程序端拥有合法用户成长资料或合法本地用户成长资料快照
- **AND** 工作档案 API 返回未配置状态
- **AND** 本地没有合法工作档案快照可降级
- **THEN** 首跑状态 SHALL 为 `work_profile_missing`
- **AND** 首页 SHALL 引导用户配置薪资和工作时间

#### Scenario: 首跑完成状态

- **WHEN** 小程序端拥有合法用户成长资料或合法本地用户成长资料快照
- **AND** 小程序端拥有合法工作档案快照或远端已配置工作档案
- **THEN** 首跑状态 SHALL 为 `ready`
- **AND** 首页 SHALL 可以展示基于工作档案快照计算的已摸金额

#### Scenario: 首跑状态不依赖独立完成标记

- **WHEN** 小程序端判断用户是否完成首跑链路
- **THEN** 系统 SHALL 以登录态、用户成长资料和工作档案真实状态作为事实来源
- **AND** 本地引导偏好或上次步骤记录 SHALL NOT 覆盖真实未登录、未建档或未配置状态

### Requirement: 首跑链路串联

小程序端 SHALL 将首次用户链路串联为登录、创建隐者档案、配置工作档案和回首页查看已摸金额。

#### Scenario: 登录后同步资料

- **WHEN** 用户在首跑链路中完成微信登录
- **THEN** 小程序端 SHALL 使用返回的应用登录态同步本人用户成长资料
- **AND** 如果资料尚未创建，系统 SHALL 引导用户进入创建隐者档案步骤

#### Scenario: 创建档案后引导配置工作档案

- **WHEN** 用户成功创建隐者档案
- **THEN** 小程序端 SHALL 保存合法用户成长资料快照
- **AND** 小程序端 SHALL 给出配置工作档案的明确下一步入口

#### Scenario: 保存工作档案后返回首页

- **WHEN** 用户成功保存工作档案
- **THEN** 小程序端 SHALL 保存合法工作档案快照
- **AND** 小程序端 SHALL 引导或返回首页
- **AND** 首页 SHALL 使用最新快照立即计算今日已摸金额

#### Scenario: 链路中断后可恢复

- **WHEN** 用户在首跑链路任一步骤退出或重新打开小程序
- **THEN** 首页 SHALL 重新推导首跑状态
- **AND** 首页 SHALL 展示当前真实状态对应的下一步行动

### Requirement: 首跑降级边界

小程序端 SHALL 在网络异常时使用合法本地快照提供可恢复体验，但不得伪造已完成状态。

#### Scenario: 有合法快照时降级展示

- **WHEN** 用户资料或工作档案 API 暂时不可用
- **AND** 本地存在对应合法快照
- **THEN** 小程序端 MAY 使用该快照展示身份或计算已摸金额
- **AND** 页面 SHALL 提示正在使用本地快照或同步失败

#### Scenario: 无合法快照时不伪造状态

- **WHEN** API 不可用且本地没有合法用户资料或工作档案快照
- **THEN** 小程序端 SHALL 展示可恢复错误或对应未完成状态
- **AND** 小程序端 SHALL NOT 使用静态演示身份、演示金额或假工作档案作为真实状态
