## ADDED Requirements

### Requirement: 首跑引导视觉状态

首跑状态 SHALL 映射到统一视觉状态，使未登录、未建档、工作档案缺失和 ready 状态在首页、我的页和相关引导页之间保持一致。

#### Scenario: 未登录状态使用统一登录视觉

- **WHEN** 首跑状态推导为 `logged_out`
- **THEN** 小程序 SHALL 展示统一登录引导视觉、登录说明和登录操作
- **AND** 页面 SHALL NOT 展示已登录用户的演示身份或演示金额
- **AND** 首页工作价值主卡 SHALL 不展示重复解释工作档案保存条件的长文案

#### Scenario: 未建档状态使用统一建档视觉

- **WHEN** 首跑状态推导为 `profile_missing`
- **THEN** 小程序 SHALL 展示统一建档引导视觉和创建隐者档案入口
- **AND** 页面 SHALL NOT 展示已创建档案才拥有的阵营头像、阵营徽章或签到资源
- **AND** 首页工作价值主卡 SHALL 不展示重复解释工作档案配置链路的长文案

#### Scenario: 工作档案缺失状态使用统一配置视觉

- **WHEN** 首跑状态推导为 `work_profile_missing`
- **THEN** 小程序 SHALL 展示统一工作档案配置视觉和工作设置入口
- **AND** 首页 SHALL NOT 使用假薪资、假时间或演示金额表达 ready 状态
- **AND** 首页 SHALL 仅展示必要状态、占位金额/倒计时和配置入口，不展示“填写后首页会显示”等重复说明

#### Scenario: ready 状态不展示首跑引导

- **WHEN** 首跑状态推导为 `ready`
- **THEN** 小程序 SHALL 展示真实用户资料、工作价值和已落地业务入口
- **AND** 页面 SHALL NOT 继续展示登录、建档或工作档案配置的主引导状态
