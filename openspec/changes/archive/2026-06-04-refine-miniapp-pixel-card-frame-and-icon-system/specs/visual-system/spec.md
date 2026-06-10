## ADDED Requirements

### Requirement: 重点像素框使用准入

小程序用户端 SHALL 将重点像素框作为显式主视觉样式使用，并 SHALL 限制其只出现在有身份、有仪式感、有主视觉重量的页面主卡、Banner、身份卡、主推荐或核心统计卡上。

#### Scenario: 重点像素框只用于页面主角

- **WHEN** 页面渲染首页今日已摸金额主卡、社区顶部世界观 Banner、我的页身份主卡、角色页阵营身份主卡、补给铺主推荐卡、隐者日报今日话题卡或生存账本页顶部今日生存消耗统计卡
- **THEN** 页面 MAY 使用重点像素框
- **AND** 该重点像素框 SHALL 成为当前页面或当前区域最强视觉层级

#### Scenario: 基础面板不默认获得重点像素框

- **WHEN** 页面渲染通用 `vs-panel`、`camp-card`、信息流卡片、状态面板或普通功能入口卡
- **THEN** 系统 SHALL NOT 因基础类名自动套用重点像素框
- **AND** 重点像素框 SHALL 通过页面明确选择的样式、组件属性或等价 opt-in 机制启用

#### Scenario: 高频信息容器禁用重点像素框

- **WHEN** 页面渲染普通列表项、帖子卡、评论、回复、订单行、表单分组、筛选 tab、小标签、badge、输入框或底部输入栏
- **THEN** 这些元素 SHALL NOT 使用重点像素框
- **AND** 这些元素 SHALL 使用轻立体卡、扁平容器或对应控件样式保持信息可读

### Requirement: 三档卡片视觉层级

小程序用户端 SHALL 使用重点像素框、轻立体卡和扁平容器三档视觉层级管理页面信息权重，并 SHALL 避免所有卡片使用同等级强强调。

#### Scenario: 重点像素框表达仪式和身份

- **WHEN** 页面展示工作价值主循环、角色身份、世界观 Banner、主推荐或页面核心统计
- **THEN** 页面 MAY 使用更强的像素边框、角标结构、内高光、底部压暗阴影和克制辉光
- **AND** 页面 SHALL 保证同屏重点像素框数量受控，避免多个主卡互相抢占视觉主位

#### Scenario: 轻立体卡表达常规内容

- **WHEN** 页面展示列表卡、内容卡、补给项、账本报告、倒计时卡、功能入口卡或普通统计卡
- **THEN** 页面 SHALL 使用暗面层级、轻描边、内高光、底部投影和按压反馈形成轻立体质感
- **AND** 页面 SHALL NOT 使用与重点像素框同等级的粗框、强角标或强辉光

#### Scenario: 扁平容器表达输入和密集信息

- **WHEN** 页面展示表单字段、picker、switch、segment、评论、回复、订单行、tab、chip、badge、输入框或短状态标签
- **THEN** 页面 SHALL 使用扁平或低强调容器
- **AND** 页面 SHALL 优先保证文字、触区、输入状态和列表扫读效率

### Requirement: 页面级重点像素框白名单

小程序用户端 SHALL 按页面语义控制重点像素框应用位置，并 SHALL 避免同一页面中次要模块与主循环使用相同视觉重量。

#### Scenario: 首页主视觉保持唯一

- **WHEN** 用户打开首页
- **THEN** 今日已摸金额主卡 MAY 使用重点像素框
- **AND** 首页今日生存消耗入口、隐者日报入口、补给铺入口和倒计时卡组 SHALL 默认使用轻立体卡或普通入口样式
- **AND** 首页 SHALL NOT 让今日生存消耗入口与今日已摸金额主卡使用同等级重点像素框

#### Scenario: 社区和内容阅读保持扫读

- **WHEN** 用户打开社区列表、帖子详情、隐者日报列表、隐者日报详情、大陆新闻列表或大陆新闻详情
- **THEN** 社区顶部世界观 Banner 和隐者日报今日话题卡 MAY 使用重点像素框
- **AND** 帖子卡、文章卡、评论、回复、详情正文阅读区和互动统计 SHALL NOT 使用重点像素框

#### Scenario: 身份中心使用重点像素框

- **WHEN** 用户打开我的页或我的角色页
- **THEN** 我的页身份主卡和角色页阵营身份主卡 MAY 使用重点像素框
- **AND** 工作档案摘要、今日生存消耗摘要、菜单列表和阵营插画辅助卡 SHALL 使用轻立体卡或普通容器

#### Scenario: 补给和账本按页面主任务分级

- **WHEN** 用户打开补给铺页面
- **THEN** 补给铺主推荐卡 MAY 使用重点像素框
- **AND** 补给分类 section、补给 item、标签和转链状态 SHALL NOT 使用重点像素框
- **WHEN** 用户打开生存账本页面
- **THEN** 账本页顶部今日生存消耗统计卡 MAY 使用重点像素框
- **AND** 本周报告、近期订单容器、订单行和订单详情字段 SHALL NOT 使用重点像素框

#### Scenario: 工作档案设置保持工具属性

- **WHEN** 用户打开工作档案设置页
- **THEN** 薪资、上班时段、工作日、发薪日、隐藏模式和保存反馈 SHALL 使用轻立体卡、扁平容器或表单控件样式
- **AND** 工作档案设置页 SHALL NOT 使用重点像素框表达表单分组

### Requirement: 原生 tabBar 像素图标

小程序用户端 SHALL 为首页、社区和我的三个微信原生 tabBar 项提供未选中和选中两种像素 icon 资产，并 SHALL 通过 `pages.json` 的原生 tabBar 图标配置接入。

#### Scenario: 三个主 tab 显示像素 icon

- **WHEN** 用户打开小程序任一主 tab 页面
- **THEN** 底部原生 tabBar SHALL 显示首页、社区和我的三个 tab 的未选中或选中像素 icon
- **AND** 每个 tab SHALL 同时保留原有文字标签

#### Scenario: 原生 tabBar 结构保持不变

- **WHEN** 小程序接入 tabBar 像素 icon
- **THEN** 底部主导航 SHALL 继续使用微信原生 tabBar
- **AND** 底部主导航 SHALL 继续只包含首页、社区和我的三个主 tab
- **AND** 本 change SHALL NOT 引入自定义 tabBar、额外主 tab 或新的 tab 状态同步逻辑

#### Scenario: tabBar icon 资产可发布

- **WHEN** 小程序构建发布包
- **THEN** tabBar icon SHALL 使用项目内静态像素图片资产
- **AND** tabBar icon SHALL NOT 使用外链图片、真实平台 logo、二维码、开发态 placeholder 或含动态业务文本的图片

### Requirement: 语义像素 icon registry

小程序用户端 SHALL 通过稳定语义 icon registry 或资产映射管理菜单、状态、补给、账本、日报、工作设置和功能入口 icon，并 SHALL 避免页面内各自临时绘制语义 icon。

#### Scenario: 页面通过稳定 key 获取语义 icon

- **WHEN** 页面需要展示我的角色、工作设置、我的帖子、收藏帖子、论坛消息、生存账本、隐者日报、补给铺、隐者食堂、下午续命、通勤、加载、空状态、错误状态或降级状态 icon
- **THEN** 页面 SHALL 通过稳定 asset key、语义 icon key 或统一 resolver 获取 icon
- **AND** 页面 SHALL NOT 在页面局部样式中新增一套与 registry 无关的临时 CSS icon 体系

#### Scenario: CSS fallback 可作为过渡

- **WHEN** 某个正式 PNG 像素 icon 尚未制作完成
- **THEN** 页面 MAY 使用现有同风格 CSS fallback 或语义 fallback
- **AND** fallback SHALL 通过 registry 统一解析
- **AND** fallback SHALL NOT 暴露文件名、尺寸文字、TODO、placeholder 或无语义圆点

#### Scenario: 新增 icon 不改变业务语义

- **WHEN** 页面使用新的像素 icon 或替换 fallback icon
- **THEN** icon SHALL 只改变视觉表达
- **AND** icon SHALL NOT 改变 feature key、路由、点击权限、状态判断、审核结果、订单状态、账本统计或首跑状态

### Requirement: 像素框和 icon 优化保持业务边界

像素框和 icon 系统优化 SHALL 仅改变小程序用户端视觉层、静态资产引用、卡片层级、图标样式、文档规范和纯展示样式，不得改变现有业务能力。

#### Scenario: 视觉优化不改接口和路由

- **WHEN** 小程序应用像素框和 icon 系统优化
- **THEN** 现有 API 调用、接口路径、请求参数、响应字段、feature key、页面路由、storage key 和主 tab 数量 SHALL 保持不变
- **AND** 本 change SHALL NOT 修改服务端代码、Prisma schema、共享业务契约或数据库迁移

#### Scenario: 视觉优化不改业务流程

- **WHEN** 用户使用首页、社区、我的、补给铺、隐者日报、大陆新闻、生存账本或工作档案页面
- **THEN** 登录、建档、工作档案保存、金额计算、隐藏模式、社区发帖、评论、回复、举报、审核提示、补给转链、订单同步、账本统计和内容安全边界 SHALL 保持原有行为
- **AND** 页面 SHALL NOT 因卡片或 icon 调整新增、删除、隐藏或替换已开放业务板块

#### Scenario: 普通用户内部字段仍隐藏

- **WHEN** 普通用户查看补给铺、生存账本、首页今日生存消耗或相关状态
- **THEN** 页面 SHALL NOT 因 icon、卡片或调试文案调整展示 CPS、聚推客、佣金、订单源 ID、apikey、sid、brand_id、act_id、后台备注、供应商原始错误或未脱敏归因字段
