## ADDED Requirements

### Requirement: 阵营默认徽章和插画资产

系统 SHALL 为每个用户阵营提供稳定的默认头像 key、默认徽章 key 和个人页阵营插画 key。

#### Scenario: 首次创建资料分配阵营资产

- **WHEN** 系统首次创建用户成长资料
- **THEN** 系统 SHALL 根据用户初始阵营分配默认头像 key
- **AND** 系统 SHALL 根据用户初始阵营分配默认徽章 key
- **AND** 系统 SHALL 在资料快照中提供可用于个人页展示的当前头像 key 和当前徽章 key

#### Scenario: 个人页读取阵营插画 key

- **WHEN** 小程序“我的”页面拥有合法成长资料快照
- **THEN** 小程序端 SHALL 能根据当前阵营解析对应的个人页阵营插画 key
- **AND** 插画资源尚未接入时 SHALL 展示明确的阵营插画占位，不得展示无关演示场景作为真实阵营插画

#### Scenario: 阵营资产 key 稳定

- **WHEN** 小程序端更新头像、徽章或插画文件
- **THEN** 系统 SHALL 保持用户成长资料中的阵营资产 key 稳定
- **AND** 系统 SHALL NOT 因替换本地图片文件而要求迁移用户资料记录

### Requirement: 用户头像来源限制

系统 SHALL 禁止普通用户上传自定义头像，用户头像 SHALL 来自项目内置头像资产。

#### Scenario: 个人页不提供上传头像

- **WHEN** 用户打开“我的”页面
- **THEN** 页面 SHALL NOT 展示上传头像按钮、上传角标或本地图片选择入口
- **AND** 点击头像 SHALL NOT 调起相册或相机选择

#### Scenario: 后续头像替换来自头像库

- **WHEN** 后续开放头像替换能力
- **THEN** 系统 SHALL 仅允许用户从项目自制头像库中选择已解锁头像
- **AND** 系统 MAY 使用隐币作为头像解锁成本
- **AND** 系统 SHALL NOT 接受用户上传的自定义头像文件作为个人头像

### Requirement: 本人资料编辑

系统 SHALL 支持当前用户编辑本人角色资料，包括昵称、职业文本、职业类型和当前阵营。

#### Scenario: 修改昵称

- **WHEN** 已登录且已创建成长资料的用户提交合法新昵称
- **THEN** API SHALL 更新当前用户成长资料中的显示名
- **AND** API SHALL 返回更新后的用户成长资料快照
- **AND** 小程序端 SHALL 更新本地 `moyuxia.userProfileSnapshot`

#### Scenario: 拒绝非法昵称

- **WHEN** 用户提交空昵称、过长昵称、纯符号昵称或命中禁止规则的昵称
- **THEN** API SHALL 拒绝保存
- **AND** 小程序端 SHALL 保持原昵称

#### Scenario: 填写职业文本

- **WHEN** 已登录且已创建成长资料的用户提交合法职业文本
- **THEN** API SHALL 保存该职业文本到本人用户成长资料
- **AND** 职业文本 SHALL 仅作为本人资料和推荐阵营依据之一
- **AND** 系统 SHALL NOT 将职业文本公开到社区作者快照

#### Scenario: 修改职业类型

- **WHEN** 用户修改职业类型
- **THEN** 系统 SHALL 根据新的职业类型计算推荐阵营
- **AND** API SHALL 返回当前阵营与推荐阵营是否一致的信息
- **AND** 系统 SHALL NOT 因职业类型变化强制切换当前阵营

#### Scenario: 手动切换阵营

- **WHEN** 用户在“我的角色”中选择合法阵营并确认切换
- **THEN** API SHALL 更新当前用户成长资料中的阵营
- **AND** 系统 SHALL 同步更新默认阵营资产展示所需的头像、徽章或插画解析结果
- **AND** 后续社区发帖阵营权限 SHALL 以更新后的当前阵营为准

### Requirement: 签到持久化验证边界

系统 SHALL 明确区分正式数据库持久化与开发期内存 fallback，避免把开发期内存状态表达为正式签到保存能力。

#### Scenario: 数据库配置下签到持久化

- **WHEN** API 配置有效 `DATABASE_URL` 且用户完成当日首次签到
- **THEN** 系统 SHALL 将签到记录和更新后的用户成长资料持久化到数据库
- **AND** API 重启后再次读取本人资料 SHALL 返回已持久化的经验、隐币、能量、连续签到和最后签到日期

#### Scenario: 未配置数据库使用内存 fallback

- **WHEN** API 未配置 `DATABASE_URL`
- **THEN** 系统 SHALL 仅使用开发期内存存储用户资料和签到记录
- **AND** 文档或日志 SHALL 明确该状态在 API 进程重启后不会持久保留

#### Scenario: mock 登录身份稳定

- **WHEN** 使用 mock 微信登录验证签到持久化
- **THEN** 测试环境 SHALL 使用稳定 mock openid 或稳定应用用户身份
- **AND** 系统 SHALL NOT 因每次登录 code 变化而把同一测试用户识别为不同用户

## MODIFIED Requirements

### Requirement: 默认昵称和默认头像

系统 SHALL 在首次创建隐者档案时生成阵营默认昵称，并分配阵营默认头像 key 与阵营默认徽章 key。

#### Scenario: 自动生成默认昵称

- **WHEN** 用户完成职业类型选择并创建隐者档案
- **THEN** 系统 SHALL 生成包含阵营名和随机数字后缀的默认昵称
- **AND** 默认昵称 SHALL 可用于个人中心资料卡展示

#### Scenario: 自动分配默认头像 key

- **WHEN** 系统创建用户成长资料
- **THEN** 系统 SHALL 根据用户阵营分配默认头像 key
- **AND** 小程序端 SHALL 可在真实头像资产未完成时使用该 key 展示占位或默认阵营头像

#### Scenario: 自动分配默认徽章 key

- **WHEN** 系统创建用户成长资料
- **THEN** 系统 SHALL 根据用户阵营分配默认徽章 key
- **AND** 小程序端 SHALL 在顶部身份卡展示该阵营徽章或明确占位

### Requirement: 我的页面成长资料展示

小程序“我的”页面 SHALL 使用真实用户成长资料或合法本地快照渲染资料卡、等级经验、资源统计、签到状态、称号、阵营徽章和阵营插画，不得使用无关演示数据替代真实个人状态。

#### Scenario: 展示基础身份

- **WHEN** “我的”页面拥有合法成长资料快照
- **THEN** 页面 SHALL 展示用户默认昵称或用户修改后的昵称、阵营、等级、经验进度、称号、头像和阵营徽章
- **AND** 页面 SHALL 在昵称右侧展示可点击的改名 icon

#### Scenario: 展示成长资源

- **WHEN** “我的”页面拥有合法成长资料快照
- **THEN** 页面 SHALL 展示隐币、能量和连续签到天数
- **AND** 页面 SHALL 在每日签到成功后使用 API 返回的资料快照刷新这些资源

#### Scenario: 展示阵营插画

- **WHEN** “我的”页面拥有合法成长资料快照
- **THEN** 页面 SHALL 根据用户当前阵营展示对应阵营插画或对应阵营插画占位
- **AND** 页面 SHALL NOT 继续使用按时间变化的无关修行场景表达用户阵营身份

#### Scenario: 展示称号和徽章边界

- **WHEN** 用户尚未拥有真实称号商店或徽章解锁能力
- **THEN** 页面 SHALL 仅展示当前称号和当前阵营徽章
- **AND** 页面 SHALL NOT 表达称号购买、徽章商店、成就系统或复杂解锁能力已经开放
