# visual-system Specification

## Purpose

视觉系统定义 `摸鱼隐者` 小程序用户端的工位模式默认外观、隐者模式暗黑像素忍者 RPG 视觉身份、生产级页面布局、字体层级、插画资产预留、组件边界和移动端可读性约束。后续首页、社区、个人中心、补给铺、生存账本、日报、大陆新闻、工作设置、首跑、空状态和错误态应优先遵循本规格。

## Requirements

### Requirement: Dark ninja RPG visual identity

小程序端 SHALL 保留暗黑像素忍者 RPG 视觉身份作为“隐者模式”，并 SHALL 将 `隐者大陆`、`隐者`、上班工具和像素 RPG 反馈统一到可切换的隐者视觉系统中；小程序用户端默认视觉 SHALL 为浅色工位模式。

#### Scenario: Primary page uses workplace mode by default

- **WHEN** 用户首次打开首页、社区页或个人中心页且本地没有已保存视觉模式
- **THEN** 页面 SHALL 使用浅色工位模式作为默认整页背景
- **AND** 页面 SHALL 使用浅色卡片、深色文字、清晰细描边、办公场景友好的按钮和状态色
- **AND** 页面 SHALL 保持工具信息可读，而不是只呈现装饰性游戏画面

#### Scenario: Hermit mode retains visual identity

- **WHEN** 用户主动切换到隐者模式后打开首页、社区页或个人中心页
- **THEN** 页面 SHALL 使用深色夜幕、黑蓝或深紫黑作为整页背景
- **AND** 页面 SHALL 使用暗色 RPG 面板、清晰细描边、克制辉光、像素资产和金/紫/蓝/青/橙等状态强调色
- **AND** 页面 SHALL 通过像素插画、徽章、图标、banner 和状态点缀保留忍者 RPG 识别度

#### Scenario: Visual identity remains consistent across tabs

- **WHEN** 用户在底部 tab 间切换
- **THEN** 首页、社区页和个人中心页 SHALL 保持当前视觉模式下的一致背景、面板、描边、文字层级、图标风格和选中态表达
- **AND** 底部主导航 SHALL NOT 依赖独立漫画 tab 才能表达 `隐者大陆` 世界观

#### Scenario: Light style is the default workplace mode

- **WHEN** 页面需要表达纸张、卷轴、吐槽气泡、图标高光、插画道具或办公场景低暴露界面
- **THEN** 页面 MAY 在工位模式下使用浅色视觉作为主背景和主卡片语言
- **AND** 页面 SHALL NOT 将浅色默认外观命名为白昼模式或夜间模式

### Requirement: 工位模式作为小程序用户端默认外观

小程序用户端 SHALL 将工位模式作为所有用户端页面的默认视觉模式，并 SHALL 将隐者模式作为用户主动切换进入的暗黑忍者 RPG 沉浸模式。

#### Scenario: 首次打开默认工位模式

- **WHEN** 用户首次打开小程序且本地没有已保存视觉模式
- **THEN** 小程序用户端 SHALL 使用工位模式渲染页面、导航栏和原生 tabBar
- **AND** 页面 SHALL 使用浅色背景、浅色卡片、深色文字、浅色描边、办公场景友好的按钮和状态色
- **AND** 页面 SHALL NOT 默认展示整页暗黑 RPG 背景

#### Scenario: 本地保存视觉模式

- **WHEN** 用户切换工位模式或隐者模式
- **THEN** 小程序 SHALL 将选择保存到本地存储 `moyuxia.visualMode`
- **AND** 用户重新打开小程序后 SHALL 保持上次选择
- **AND** 视觉模式 SHALL NOT 依赖服务端账号同步、远端配置或系统主题跟随

#### Scenario: 模式命名避免昼夜语义

- **WHEN** 页面展示视觉模式入口、反馈或调试摘要
- **THEN** 文案 SHALL 使用“工位模式”和“隐者模式”
- **AND** 页面 SHALL NOT 使用“白昼模式”“暗夜模式”“夜间模式”作为面向用户的主文案

### Requirement: 首页右上角模式切换入口

首页 SHALL 在首屏右上角提供工位模式和隐者模式的快捷切换入口，并 SHALL 让该入口具有明确可点击感。

#### Scenario: 工位模式显示进入隐者模式

- **WHEN** 首页处于工位模式
- **THEN** 首页右上角模式切换入口 SHALL 显示“隐者模式”
- **AND** 入口 SHALL 以按钮、胶囊按钮或等价可点击控件展示
- **AND** 入口 SHALL NOT 被设计成不可点击的阵营、等级或身份标签

#### Scenario: 隐者模式显示返回工位

- **WHEN** 首页处于隐者模式
- **THEN** 首页右上角模式切换入口 SHALL 显示“返回工位”
- **AND** 用户点击后 SHALL 切回工位模式并保存本地选择

#### Scenario: 切换不改变身份数据

- **WHEN** 用户点击模式切换入口
- **THEN** 页面 SHALL 只改变视觉模式、导航栏样式和 tabBar 样式
- **AND** 页面 SHALL NOT 修改用户阵营、等级、称号、工作档案、隐藏模式、签到状态或社区状态

### Requirement: 模式化导航栏与原生 tabBar

小程序用户端 SHALL 根据当前视觉模式同步设置页面导航栏和微信原生 tabBar 的颜色，且 SHALL 保持既有首页、社区、我的三项主 tab 结构不变。

#### Scenario: 工位模式导航与 tabBar

- **WHEN** 用户处于工位模式并打开任一普通用户端页面
- **THEN** 页面导航栏 SHALL 使用浅色背景和深色前景
- **AND** 原生 tabBar SHALL 使用浅色背景、深色默认文字和清晰选中文字
- **AND** tabBar SHALL 继续只有首页、社区、我的三个主 tab

#### Scenario: 隐者模式导航与 tabBar

- **WHEN** 用户处于隐者模式并打开首页、社区或我的 tab 页面
- **THEN** 页面导航栏和原生 tabBar SHALL 切换到与暗黑 RPG 视觉一致的暗色背景和亮色文字
- **AND** tabBar SHALL NOT 改成自定义 tabBar、额外主 tab 或新的 tab 状态同步逻辑

#### Scenario: webview 只控制外壳

- **WHEN** 用户打开 webview 落地页
- **THEN** 小程序 SHALL 按当前视觉模式控制自身导航栏、加载态、错误态和页面外壳
- **AND** 小程序 SHALL NOT 承诺控制外部 webview 内容的背景、字体、按钮或第三方页面视觉

### Requirement: 小程序用户端全页面组件级适配

小程序用户端所有已注册页面 SHALL 在工位模式下完成组件级视觉适配，覆盖页面内所有可见组件、交互状态、反馈状态和弹层状态，不得仅完成页面背景或主卡片换色。

#### Scenario: 所有注册页面进入工位模式

- **WHEN** 用户在工位模式下打开 `apps/miniapp/src/pages.json` 注册的任一用户端页面
- **THEN** 页面 SHALL 使用工位模式视觉渲染页面根背景、导航栏、文字、卡片、列表、按钮、输入控件、状态提示和可见业务区域
- **AND** 页面 SHALL NOT 出现整页暗色旧版断层

#### Scenario: 组件细节完整适配

- **WHEN** 页面展示卡片、列表行、按钮、图标按钮、胶囊、chip、badge、头像框、图片框、插画遮罩、输入框、textarea、picker、switch、checkbox、tab、筛选项、进度条、经验条、倒计时条、分割线、固定底栏或评论输入栏
- **THEN** 每个组件 SHALL 使用当前视觉模式对应的背景、文字、边框、阴影、按压态、选中态、禁用态和加载态
- **AND** 普通组件 SHALL NOT 依赖只适合隐者模式的黑底、暗色描边、暗色阴影或深色渐变表达可读性
- **AND** 插画卡、Banner 或深色图片区域 MAY 按底图明度使用白字与文字阴影，但 SHALL 使用当前模式自己的边框、按钮和状态规则

#### Scenario: 反馈状态完整适配

- **WHEN** 页面展示空状态、加载态、错误态、降级态、同步提示、骨架屏、举报弹层、隐私同意弹层、手机号验证弹层、评论弹层、详情弹层或图片查看外壳
- **THEN** 状态组件 SHALL 在工位模式和隐者模式下均保持文字可读、层级清晰、触区可点和小屏不溢出
- **AND** 状态组件 SHALL NOT 遗留暗色模式专用背景导致浅色模式突兀

#### Scenario: 页面组无暂缓

- **WHEN** 本 change 验收工位模式覆盖范围
- **THEN** 首页、社区、发帖、帖子详情、公开个人页、关注/粉丝列表、我的社区内容、社区消息、社区规则、隐者日报、大陆新闻、我的、我的角色、工作档案、补给铺、webview 外壳、生存账本、漫画兼容页和摸鱼工作台页面组 SHALL 均完成工位模式可读性和组件细节检查
- **AND** 验收 SHALL NOT 将日报、大陆新闻、消息、协议、漫画兼容页或 webview 外壳标记为可暂缓

### Requirement: 插画与像素资产模式可读性

小程序用户端 SHALL 在工位模式和隐者模式下复用既有稳定资产 key，并 SHALL 通过外框、底座、文字颜色、文字阴影、必要时的局部文字底或占位状态保障插画、头像、像素 icon 和业务图片可读。

#### Scenario: 不重画整套白版资产

- **WHEN** 工位模式展示首页主图、社区 Banner、头像、徽章、阵营插画、补给图、账本背景、日报封面、大陆新闻封面、状态图或像素 icon
- **THEN** 页面 SHALL 优先复用既有静态资产 key 和语义 icon registry
- **AND** 页面 MAY 根据底图明度使用白字、深色字、文字阴影、描边或必要时的局部文字底提升可读性
- **AND** 页面 SHALL NOT 将工位模式理解为所有插画叠字都必须使用黑字或浅色文字卡
- **AND** 工位模式下深色插画卡 SHALL 使用工位模式边框、按钮和文字覆盖规则，不得复用隐者模式紫色像素框作为默认工位边框
- **AND** 隐者模式的暗色遮罩、紫色像素框、暗色底座和 RPG 质感 SHALL 与工位模式覆盖规则隔离
- **AND** 页面 SHALL NOT 对正式插画整图叠加滤镜、扫描线或大面积遮罩来挽救文字可读性
- **AND** 页面 SHALL NOT 因工位模式新增一套完全独立且未纳入 registry 的白版资产体系

#### Scenario: 用户和商品图片不做内容改造

- **WHEN** 页面展示社区用户上传图片、评论图片、补给商品图或外部内容封面
- **THEN** 页面 SHALL 只调整图片容器、占位、边框、背景和错误态
- **AND** 页面 SHALL NOT 对图片内容本身做会改变含义的滤镜、裁切承诺或重新生成

### Requirement: 视觉模式不改变业务边界

工位模式默认化和隐者模式切换 SHALL 只改变小程序用户端视觉层、静态样式、模式本地存储、导航栏和 tabBar 外观，不得改变既有业务流程和敏感字段边界。

#### Scenario: 业务流程保持不变

- **WHEN** 用户在工位模式或隐者模式下使用登录、建档、工作档案保存、金额计算、隐藏模式、日报浏览、社区发帖、评论、回复、举报、关注、取消关注、补给转链、订单同步、账本详情或内容安全流程
- **THEN** 业务行为、接口路径、请求参数、响应字段、storage key、路由、审核状态和统计计算 SHALL 保持原有语义
- **AND** 页面 SHALL NOT 因视觉模式切换新增、删除、隐藏或替换已开放业务板块

#### Scenario: 敏感字段仍隐藏

- **WHEN** 普通用户查看首页、社区、我的、补给铺、生存账本、日报、大陆新闻、webview 外壳或视觉模式反馈
- **THEN** 页面 SHALL NOT 展示 CPS、聚推客、佣金、订单源 ID、apikey、sid、brand_id、act_id、后台备注、供应商原始错误、审核字段、手机号、薪资、工作时间或未脱敏归因字段，除非对应能力已有明确公开展示要求

### Requirement: 第一版主视觉与资产基线

小程序用户端 SHALL 将当前已确认的主视觉排版、三档卡片层级、重点像素框白名单、原生 tabBar 像素 icon、语义 icon registry 和插画资产映射作为第一版视觉基线，并 SHALL 在工位模式默认化后保持整体业务结构、资产 key 和页面层级稳定。

#### Scenario: 后续视觉优化保持基线

- **WHEN** 小程序用户端继续优化首页、社区、我的、补给铺、隐者日报、大陆新闻、生存账本、工作档案、首跑、空状态或错误态视觉
- **THEN** 页面 SHALL 保持 `工位模式默认 + 隐者模式可切换 + 隐者营地信息流` 的统一视觉语言
- **AND** 页面 SHALL 保持已确认的主导航、页面主视觉层级、重点像素框白名单和三档卡片分级
- **AND** 页面 SHALL NOT 在未新建 OpenSpec change 的情况下重开整体视觉方向、底部主导航或核心页面排版

#### Scenario: 替换图片保持稳定 key

- **WHEN** 后续替换头像、徽章、阵营插画、Banner、账本背景、状态图或 tabBar icon
- **THEN** 替换 SHALL 保持既有 asset key、静态文件路径、展示比例、安全区和业务语义稳定
- **AND** 替换 SHALL 只改变视觉表现
- **AND** 替换 SHALL NOT 改变 feature key、路由、点击权限、审核状态、订单状态、账本统计、首跑状态或工作价值计算

#### Scenario: icon 补齐不改变导航和业务

- **WHEN** 页面补齐菜单、状态、补给、账本、日报、工作设置或功能入口 icon
- **THEN** icon SHALL 通过稳定 asset key、语义 icon key、统一 resolver 或 registry 接入
- **AND** 页面 SHALL NOT 在局部新增与 registry 无关的临时 icon 体系
- **AND** 底部主导航 SHALL 继续使用首页、社区、我的三个微信原生 tabBar 项，不得因 icon 优化引入自定义 tabBar、新增主 tab 或新的 tab 状态同步逻辑

### Requirement: Visual token contract

视觉系统 SHALL 在 `packages/ui-tokens` 中定义小程序端可复用的基础 token、语义 token 和模式化 token，覆盖工位模式与隐者模式的背景、卡片、文字、边框、按钮、状态色和组件状态。

#### Scenario: Page consumes semantic tokens

- **WHEN** 页面需要渲染背景、面板、文本、描边、收益、奖励、能量、等级、锁定、危险、选中、禁用、加载、错误或弹层状态
- **THEN** 页面 SHALL 优先使用 `packages/ui-tokens`、全局 CSS 变量或模式化语义 token
- **AND** 页面 SHOULD NOT 在局部样式中重复硬编码同类状态色值

#### Scenario: Tokens cover mode-aware panel hierarchy

- **WHEN** 组件需要区分普通面板、浮起面板、交互面板、选中面板、禁用面板、锁定面板、表单容器、列表行或弹层容器
- **THEN** 视觉 token SHALL 提供工位模式和隐者模式对应的背景、描边、文本、阴影和状态语义

#### Scenario: Tokens cover native chrome

- **WHEN** 页面需要设置导航栏、原生 tabBar、页面根背景或安全区背景
- **THEN** 视觉 token SHALL 提供当前模式下的背景色、前景色、默认文字色、选中文字色和边框语义

### Requirement: 插画资产预留体系

小程序用户端 SHALL 为关键插画和图标建立稳定预留位、命名、分类和加载约定，并 SHALL 允许正式插画在后续制作完成后按稳定 key 替换。

#### Scenario: 关键页面预留插画位

- **WHEN** 用户打开首页、社区页、个人中心页、补给铺、日报、大陆新闻、生存账本、工作设置页或首跑引导页面
- **THEN** 页面 SHALL 为与暗黑像素忍者 RPG 世界观一致的插画、图标或状态图预留稳定展示位置
- **AND** 插画预留位 SHALL 定义稳定比例、最小高度、安全留白和 asset key
- **AND** 页面 SHALL NOT 展示 `px-* 200×200`、`placeholder`、`badge_placeholder` 或等价占位文本作为正式 UI 内容

#### Scenario: 资产分类稳定

- **WHEN** 小程序端引用头像、阵营徽章、阵营插画、功能 icon、页面 banner、补给板块图、内容封面、空状态或错误态资产
- **THEN** 资产 SHALL 使用稳定 key 或稳定文件命名
- **AND** 页面 SHALL NOT 依赖随意硬编码的临时文字占位来表达资产

#### Scenario: 正式插画缺失时使用风格化 fallback

- **WHEN** 某个正式插画文件尚未制作完成
- **THEN** 页面 SHALL 使用同风格的剪影、图案底纹、暗色场景、色块面板或默认图标作为 fallback
- **AND** 页面 SHALL NOT 暴露开发态尺寸文字、文件名、TODO 文案或无语义圆点 icon

#### Scenario: 后续替换不改页面结构

- **WHEN** 后续补充正式插画文件
- **THEN** 小程序端 SHALL 能通过已有 asset key 或文件映射替换 fallback
- **AND** 页面结构、入口布局和业务逻辑 SHALL NOT 因替换插画而重写

### Requirement: 插画场景与组件叠加

小程序用户端 SHALL 以插画场景承载主要氛围，并在必要位置叠加原生组件；信息密集区域 SHALL 优先保持组件可读性。

#### Scenario: 插画作为关键氛围层

- **WHEN** 页面展示首页主 banner、社区顶部 banner、个人中心阵营插画卡、补给铺板块头图、日报封面、账本空状态或首跑引导
- **THEN** 页面 MAY 使用插画作为底层场景
- **AND** 页面 SHALL 在插画上使用遮罩、安全留白或固定区域承载文字和按钮

#### Scenario: 组件保持信息层可读

- **WHEN** 页面展示金额、倒计时、帖子列表、表单、筛选、菜单入口、账本明细或补给项列表
- **THEN** 页面 SHALL 使用原生组件、RPG 面板或清晰列表承载动态信息
- **AND** 页面 SHALL NOT 因插画背景导致文字、数字、按钮或列表内容难以辨认

#### Scenario: 不是每个模块都必须插画化

- **WHEN** 模块属于高密度工具信息、表单输入、审核状态、帖子列表或账本明细
- **THEN** 模块 MAY 使用纯面板、列表或卡片结构
- **AND** 系统 SHALL NOT 要求每个模块都使用插画背景才能符合视觉系统

### Requirement: 正式中文字体

小程序用户端 SHALL 使用具备明确商业发布授权口径的正式中文字体栈，并 SHALL 为中文可读性、授权边界和加载失败提供降级策略。

#### Scenario: 字体资源接入

- **WHEN** 小程序构建用户端静态资源
- **THEN** 项目 SHALL 记录统一字体名称、来源、授权口径和使用范围
- **AND** 小程序 SHALL 默认使用方正黑体字体栈作为展示字体和正文字体
- **AND** 项目 SHALL NOT 使用来源不明、不可商用或未确认小程序嵌入授权的字体文件作为发布字体

#### Scenario: 字体分层使用

- **WHEN** 页面展示品牌标题、金额数字、等级、倒计时、badge、入口标题或短标签
- **THEN** 页面 SHALL 使用统一方正展示字体栈强化视觉一致性
- **AND** 页面展示长正文、帖子内容、表单说明或错误提示时 SHALL 保持中文可读性优先

#### Scenario: 字体文件嵌入边界

- **WHEN** 项目尚未取得覆盖微信小程序嵌入或在线调用的字体授权
- **THEN** 小程序 SHALL NOT 通过 `@font-face` 打包方正字体文件或在线字体文件
- **AND** 小程序 SHALL 使用字体名称声明和系统中文字体 fallback 保持可读

#### Scenario: 字体降级

- **WHEN** 设备未安装方正黑体、字体名称不可用或在低端设备上表现异常
- **THEN** 页面 SHALL 使用配置好的系统字体或可读中文字体 fallback
- **AND** 页面 SHALL NOT 出现乱码、方块字、不可读字形或明显破坏排版的字体跳变

### Requirement: Reusable RPG UI components

小程序端 SHALL 通过可复用 RPG UI 组件组合页面，并 SHALL 避免在具体页面中散落重复样式结构。

#### Scenario: Home components are rendered

- **WHEN** 首页渲染收益、功能入口、倒计时或今日生存消耗大卡
- **THEN** 页面 SHALL 使用共享组件或符合共享组件契约的结构
- **AND** 组件 SHALL 支持动态文本和状态变化

#### Scenario: Community components are rendered

- **WHEN** 社区页渲染分区、筛选、发布入口、消息入口或帖子列表
- **THEN** 页面 SHALL 使用统一的 tabs、筛选控件、post card、badge、作者头像和 interaction stat 表现
- **AND** 帖子列表卡片 SHALL 使用固定信息密度布局，避免单个帖子因图片比例过高而占用异常大屏幕空间

#### Scenario: Community post card thumbnail is stable

- **WHEN** 社区页帖子卡片展示图片
- **THEN** 卡片 SHALL 最多在列表中展示一张缩略图
- **AND** 缩略图容器 SHALL 使用固定正方形尺寸
- **AND** 缩略图 SHALL 使用裁切填充方式适配容器，不得随原始图片比例改变卡片高度
- **AND** 多图帖子 SHALL 仅展示第一张缩略图并可以显示剩余图片数量提示

#### Scenario: Profile components are rendered

- **WHEN** 个人中心页渲染资料、资源、本人状态摘要、角色资料入口、阵营插画或菜单
- **THEN** 页面 SHALL 使用统一的 profile summary、resource stat、status summary、role detail、faction artwork 和 menu item 表现

### Requirement: Primary miniapp page layout patterns

视觉系统 SHALL 定义首页、社区页、个人中心页和主要用户端业务页面的生产级布局模式，后续业务页面 SHOULD 优先沿用这些布局。

#### Scenario: Home layout is applied

- **WHEN** 首页实现真实业务数据
- **THEN** 首页 SHALL 包含顶部身份区域、已摸金额主卡、上班状态场景、主金额隐藏开关、核心功能入口、必要倒计时、今日生存消耗大卡和底部 tab
- **AND** 首页 SHALL 将今日已摸金额、工作状态、距离下班倒计时和今日进度条作为工作价值主卡核心信息
- **AND** 首页主 banner SHALL 为普通状态和隐藏状态预留插画位，并在正式插画缺失时使用同风格 fallback
- **AND** 首页 SHALL NOT 将未实现、低价值或重复入口作为首屏主行动展示

#### Scenario: Community layout is applied

- **WHEN** 社区页实现真实内容数据
- **THEN** 社区页 SHALL 包含顶部标题、漫画/IP 内容 Banner、分区 tabs、筛选控件、消息入口、发布入口、帖子卡列表和底部 tab
- **AND** 社区页 Banner SHALL 承载漫画/IP 内容入口、世界观内容入口、活动或后续内容入口
- **AND** 社区页 SHALL 接入正式字体、生产 icon、生产 banner 和帖子列表统一视觉
- **AND** 社区页 Banner SHALL NOT 以“漫画模块封印中”“敬请期待”等无操作价值占位说明作为主要内容
- **AND** 社区页 SHALL NOT 在首页操作区展示“我的帖子”入口

#### Scenario: Profile layout is applied

- **WHEN** 个人中心页实现真实用户数据
- **THEN** 个人中心页 SHALL 包含资料卡、等级经验、资源统计、每日签到、本人状态摘要、精简菜单区域、我的角色二级页入口、阵营插画卡和底部 tab
- **AND** 个人中心页 SHALL NOT 强制包含无实际功能的功能宫格导航或完整成就系统占位
- **AND** 个人中心页下半区 SHALL 保留左侧入口列表和右侧阵营插画卡的排版

#### Scenario: Secondary pages use production visual system

- **WHEN** 用户打开工作设置页、补给铺、生存账本、日报、大陆新闻、WebView 回退页、登录建档页、空状态或错误态
- **THEN** 页面 SHALL 使用统一背景、正式字体、语义 icon、RPG 面板和必要插画预留位
- **AND** 页面 SHALL NOT 继续展示开发态占位文案或与主 tab 明显不一致的临时视觉

### Requirement: Profile faction asset presentation

个人中心页 SHALL 以阵营头像、阵营徽章和阵营插画表达用户当前阵营身份，并 SHALL 保持暗黑忍者 RPG 视觉系统一致。

#### Scenario: 顶部身份卡展示阵营头像和徽章

- **WHEN** 用户已创建成长资料并打开个人中心页
- **THEN** 顶部身份卡 SHALL 展示当前头像资产、昵称、改名 icon、阵营、称号、等级经验条和当前阵营徽章
- **AND** 头像、徽章和经验条 SHALL 在小屏设备上保持可读且不重叠

#### Scenario: 头像不可上传

- **WHEN** 用户查看顶部身份卡
- **THEN** 头像区域 SHALL NOT 展示“上传”角标
- **AND** 头像区域 SHALL NOT 使用上传态视觉暗示

#### Scenario: 阵营插画位预留

- **WHEN** 个人中心页展示阵营插画卡
- **THEN** 插画位 SHALL 使用统一尺寸和比例约束，优先按 `5:7` 竖图资源适配
- **AND** 插画核心内容 SHALL 在移动端可见区域内完整展示
- **AND** 插画文件未接入时 SHALL 展示对应阵营 key 的风格化 fallback 或稳定预留位，而不是开发态文字占位

### Requirement: Profile menu cleanup

个人中心页 SHALL 移除无效、重复或尚未开放的占位入口，并保留与当前 MVP 已落地能力相关的入口。

#### Scenario: 无效入口不展示

- **WHEN** 用户打开个人中心页
- **THEN** 页面 SHALL NOT 展示“称号收藏”、“我的评论”、“隐者大陆百科”、完整成就系统、称号商店、皮肤商店或赛季排行入口
- **AND** 页面 SHALL NOT 展示无实际功能的功能宫格导航

#### Scenario: 高价值入口保留

- **WHEN** 用户打开个人中心页
- **THEN** 页面 SHALL 展示“我的角色”、“工作设置”、“我的帖子”、“收藏帖子”、“论坛消息”和“生存账本”等可用高价值入口
- **AND** 每个入口标题前 SHALL 展示与功能语义匹配的 icon
- **AND** 论坛消息入口 SHALL 能展示未读数量提示

#### Scenario: 我的角色作为资料中心

- **WHEN** 用户点击“我的角色”
- **THEN** 页面 SHALL 进入角色详情与资料编辑二级页
- **AND** 该体验 SHALL 承载职业填写、职业类型、当前阵营、推荐阵营提示和手动切换阵营入口

### Requirement: Home utility banner

首页 SHALL 在底部 tab 上方提供今日生存消耗大卡，用于承载本人今日三类生存消耗摘要和生存账本详情入口。

#### Scenario: Accounting entry is rendered

- **WHEN** 首页渲染今日生存消耗入口
- **THEN** 卡片 SHALL 显示 `今日生存消耗`、`查看详情` 和 `隐者食堂`、`下午续命`、`通勤` 三类金额
- **AND** 三类金额 SHALL 在同一张大卡中平分展示
- **AND** 本 change SHALL NOT 定义新的记账数据模型、账单分类、统计规则、接口或存储流程

#### Scenario: Utility card remains focused

- **WHEN** 首页展示今日生存消耗大卡
- **THEN** 卡片 SHALL NOT 使用签到、任务、商城或手动记账主流程语义
- **AND** 卡片 SHALL 作为生存账本详情入口，而不是专业记账创建入口

### Requirement: Pixel art asset taxonomy

视觉系统 SHALL 定义像素资产分类，并 SHALL 约束像素资产与原生 UI 的边界。

#### Scenario: Asset category is selected

- **WHEN** 页面需要展示角色、场景、功能图标、成就徽章、阵营标识、Banner、漫画封面、空状态、错误态或锁定态
- **THEN** 系统 SHALL 从对应资产分类中选择像素资产或风格化 fallback

#### Scenario: Dynamic UI remains native

- **WHEN** 页面展示金额、倒计时、等级、经验、按钮、tabs、列表、标签或状态文本
- **THEN** 这些内容 SHALL 使用原生 UI 渲染
- **AND** 整屏页面 SHALL NOT 作为静态图片切片交付

### Requirement: Feature status visual states

视觉系统 SHALL 为功能入口、内容卡片和成长反馈定义统一状态表现。

#### Scenario: Feature entry displays availability

- **WHEN** 功能入口处于已开放、未解锁、敬请期待、禁用或当前选中状态
- **THEN** 入口 SHALL 使用统一的图标、描边、透明度、标签或锁定提示表达状态

#### Scenario: Content card displays metadata state

- **WHEN** 内容卡片需要展示 `NEW`、置顶、推荐、阵营、等级、互动统计或审核相关状态
- **THEN** 卡片 SHALL 使用统一 badge、chip、计数和强调色表达状态

### Requirement: 克制的信息密度和视觉层级

小程序首页、个人中心和补给铺 SHALL 使用暗黑像素忍者 RPG 视觉，并 SHALL 通过更克制的信息密度、字号层级、按钮层级和卡片强调来提升可读性。

#### Scenario: 页面主任务优先

- **WHEN** 用户打开首页、补给铺或“我的”页
- **THEN** 页面 SHALL 让当前页面主任务成为首屏最强视觉层级
- **AND** 次要入口 SHALL 使用较弱的按钮、列表或卡片层级展示

#### Scenario: 发光和强调色受控

- **WHEN** 页面渲染多个面板或卡片
- **THEN** 页面 SHALL 将强发光、稀有色和主按钮样式用于关键状态或主行动
- **AND** 页面 SHALL NOT 让每个模块都使用同等级强强调样式

#### Scenario: 文本和按钮不互相挤压

- **WHEN** 页面在小屏设备上展示高密度信息
- **THEN** 页面 SHALL 使用稳定行高、截断、换行或固定尺寸防止文字重叠
- **AND** 页面 SHALL 保持主要按钮和入口可点击区域符合移动端操作尺寸

### Requirement: Mobile readability and interaction constraints

视觉系统 SHALL 保证暗黑 RPG 高密度界面在小程序移动端保持可读和可操作。

#### Scenario: Dense card text is displayed

- **WHEN** 页面在小屏设备上展示高密度卡片、帖子、功能入口或资源统计
- **THEN** 文本 SHALL 保持可读字号和行高
- **AND** 文本 SHALL 使用截断、换行或布局降级避免与相邻内容重叠

#### Scenario: Interactive controls are tapped

- **WHEN** 用户点击按钮、功能入口、tabs、chips、菜单项或底部 tab
- **THEN** 可点击区域 SHALL 满足移动端触控尺寸要求
- **AND** 图标视觉尺寸 SHALL NOT 成为唯一的点击区域

### Requirement: 小程序插画资产矩阵

视觉系统 SHALL 为小程序用户端插画资产定义统一矩阵，覆盖资产类型、稳定 key、推荐尺寸、展示比例、安全区、透明背景要求和使用禁区。

#### Scenario: 定义资产规格

- **WHEN** 小程序端新增或替换 `banner`、`artwork`、`scene`、`icon`、`avatar`、`badge` 或状态图资产
- **THEN** 资产 SHALL 具备稳定 asset key、推荐导出尺寸、展示比例和安全区说明
- **AND** 资产 SHALL 记录适用页面、fallback 策略和是否允许透明背景

#### Scenario: 禁止把动态 UI 画进插画

- **WHEN** 插画资产用于首页、补给铺、社区、我的页、生存账本、首跑引导、空状态或错误状态
- **THEN** 插画 SHALL NOT 承载金额、倒计时、按钮、等级、经验、订单金额、tabs、筛选项、状态标签或会随业务变化的文案
- **AND** 这些动态内容 SHALL 使用原生 UI 渲染

#### Scenario: 生成提示词可复用

- **WHEN** 项目文档记录插画生成提示词或美术交付说明
- **THEN** 文档 SHALL 包含暗黑像素忍者 RPG 风格、尺寸比例、安全区、禁用元素和输出格式
- **AND** 文档 SHALL NOT 要求使用未经授权品牌、真实 CPS 平台标识、二维码或不可商用字体

### Requirement: 统一视觉状态系统

视觉系统 SHALL 为加载、空数据、未登录、未建档、配置缺失、网络失败、降级展示、补给不可用和订单未同步等状态定义统一视觉表达。

#### Scenario: 页面选择状态视觉

- **WHEN** 小程序页面需要展示非正常业务状态
- **THEN** 页面 SHALL 从统一状态类型中选择对应的标题、说明、操作按钮、插画 asset key 或同风格 fallback
- **AND** 页面 SHALL NOT 只展示孤立纯文本作为主要状态反馈

#### Scenario: 状态不伪造业务数据

- **WHEN** 页面处于未登录、未建档、工作档案未配置、网络失败或订单未同步状态
- **THEN** 状态视觉 SHALL 明确表达当前状态和下一步操作
- **AND** 页面 SHALL NOT 通过演示金额、演示订单、演示帖子或演示用户资料伪造 ready 状态

#### Scenario: 缺图 fallback 可发布

- **WHEN** 状态插画尚未制作完成
- **THEN** 页面 SHALL 使用暗色图案、像素剪影、语义 icon、阵营符号或状态 scene fallback
- **AND** 页面 SHALL NOT 展示 `placeholder`、TODO、文件名、尺寸文字或无语义圆点作为正式视觉

### Requirement: 高频页面视觉验收

视觉系统 SHALL 为首页、补给铺、社区列表、我的页和生存账本提供移动端视觉验收边界。

#### Scenario: 高频页面信息可读

- **WHEN** 用户在小屏设备打开高频页面
- **THEN** 页面 SHALL 保持主任务信息、按钮、入口、金额、列表和状态说明不重叠
- **AND** 插画 SHALL NOT 降低文字对比度或遮挡主要操作

#### Scenario: 高频页面风格一致

- **WHEN** 用户在首页、补给铺、社区列表、我的页和生存账本之间切换
- **THEN** 页面 SHALL 保持一致的暗色背景、RPG 面板、描边、字号层级、icon 风格和状态反馈
- **AND** 页面 SHALL NOT 出现明显临时、浅色网页化或与暗黑像素忍者 RPG 不一致的主视觉

#### Scenario: 厚像素按钮不依赖无关图标

- **WHEN** 小程序页面展示真实操作按钮
- **THEN** 按钮 SHALL 使用粗暗色外框、内高光、底部压暗阴影和按压下沉反馈形成厚像素按钮质感
- **AND** 按钮 SHALL NOT 为了装饰加入与当前操作无关的图标

#### Scenario: 首页首屏主卡状态切换稳定

- **WHEN** 首页在未登录、未建档、工作档案未配置和 ready 状态之间切换
- **THEN** 工作价值主卡 SHALL 保持相近尺寸和稳定插画区域
- **AND** 主卡 SHALL 避免重复说明文案挤占金额、倒计时和操作入口

### Requirement: 全局营地 UI 视觉统一

小程序用户端 SHALL 将已确认的“隐者营地”暗色像素 Material 方向纳入全局视觉系统，并 SHALL 在首页、社区、帖子详情、我的、补给铺、隐者日报、大陆新闻、生存账本、工作档案、WebView 和兼容页中保持一致的暗色背景、像素卡片、紫色激活态、青色状态、金色主操作、克制发光和移动端信息密度。

#### Scenario: 高频页面使用统一视觉语言

- **WHEN** 用户打开小程序首页、社区、我的、补给铺、隐者日报、大陆新闻、生存账本或工作档案页面
- **THEN** 页面 SHALL 使用统一的暗色像素 Material + 暗黑忍者 RPG 视觉语言
- **AND** 页面 SHALL 使用一致的页面背景、卡片面、描边、文字层级、主色、状态色、金额色和操作反馈
- **AND** 页面 SHALL NOT 呈现明显割裂的浅色网页风、临时占位风或独立页面自造视觉系统

#### Scenario: 全局背景保持克制

- **WHEN** 页面渲染全局背景
- **THEN** 页面 SHALL 使用干净深色背景和克制氛围光
- **AND** 页面 SHALL NOT 使用满屏高对比网格、强扫描线或明显干扰阅读的纹理作为默认整页背景

#### Scenario: 社区页作为视觉标杆

- **WHEN** 后续页面应用全局 UI 优化
- **THEN** 页面 SHOULD 以用户确认满意的社区营地 UI 为视觉基准
- **AND** 页面 SHALL 保持紫色激活、青色状态、金色主操作、像素边框和暗色信息流密度的一致表达

### Requirement: 全局 UI 优化保持业务能力不变

全局 UI 优化 SHALL 仅改变视觉展示、布局密度、字体层级、颜色、边框、间距、遮罩、动效、图片展示容器和纯展示格式化，不得改变核心业务能力、接口契约、路由语义、数据模型、权限判断、内容安全审核、订单同步、账本统计、首跑状态推导或工作价值计算。

#### Scenario: 视觉更新不改变业务逻辑

- **WHEN** 小程序用户端应用全局 UI 优化
- **THEN** 现有 API 调用、route 目标、feature key、storage key、登录态判断、审核状态判断、订单状态判断和统计计算 SHALL 保持不变
- **AND** UI 优化 SHALL NOT 修改服务端代码、Prisma schema、共享业务契约或数据库迁移

#### Scenario: 纯展示格式化允许隔离调整

- **WHEN** 页面需要优化用户侧时间、金额遮挡、状态文案或长文本可读性
- **THEN** 页面 MAY 调整纯展示格式化逻辑
- **AND** 这些展示格式化 SHALL NOT 改变服务端数据、排序字段、业务日期、统计结果、审核结果、订单状态或用户权限

### Requirement: 已开放页面板块完整性

全局 UI 优化 SHALL 保留所有已开放页面的现有业务板块和主要操作，不得通过视觉优化删除、合并、隐藏、新增或替换既有用户可访问能力。

#### Scenario: 首页板块保持完整

- **WHEN** 首页应用全局 UI 优化
- **THEN** 首页 SHALL 保留身份区、今日已摸金额、距下班倒计时、工作状态、工作进度、工作设置入口、隐者日报入口、补给铺入口、倒计时卡组、今日生存消耗和底部三 tab 导航
- **AND** 首页 SHALL NOT 展示假金额、假工作档案或未定义功能入口

#### Scenario: 社区板块保持完整

- **WHEN** 社区列表页应用全局 UI 优化
- **THEN** 社区 SHALL 保留世界观 Banner、分区 tab、最新/热门筛选、消息入口、发布或登录建档入口、帖子列表、图片附件、日报引用、赞评藏统计和底部三 tab 导航
- **AND** 社区 SHALL NOT 新增无定义板块、删除现有筛选或替换现有插画

#### Scenario: 帖子详情板块保持完整

- **WHEN** 帖子详情页应用全局 UI 优化
- **THEN** 详情页 SHALL 保留作者信息、标题、正文、日报引用、图片、点赞、收藏、评论、回复、举报和底部评论输入
- **AND** 详情页 SHALL 保持评论和回复的提交、审核提示、作者自见和举报入口可用

#### Scenario: 我的页板块保持完整

- **WHEN** 我的页应用全局 UI 优化
- **THEN** 我的页 SHALL 保留真实角色身份、阵营、等级资源、签到、我的角色、工作设置、我的帖子、收藏帖子、论坛消息和生存账本入口
- **AND** 我的页 SHALL NOT 恢复空成就卡、空徽章列表、未定义功能宫格或无实际功能入口

#### Scenario: 商业和内容页面板块保持完整

- **WHEN** 补给铺、隐者日报、大陆新闻、生存账本或工作档案页面应用全局 UI 优化
- **THEN** 页面 SHALL 保留其既有分类、列表、详情、状态、表单、主要操作和错误/空状态
- **AND** 页面 SHALL NOT 因视觉统一改变用户可访问能力或业务状态边界

### Requirement: 真实视觉资产保留

全局 UI 优化 SHALL 继续使用项目内已有真实插画、头像、徽章、Banner 和封面资产，并 SHALL 只调整展示容器、遮罩、圆角、裁切、安全区和局部样式。

#### Scenario: 现有插画不被替换

- **WHEN** 页面已有项目内真实插画、头像、徽章、Banner 或封面资产
- **THEN** UI 优化 SHALL 保留现有资产文件引用
- **AND** UI 优化 SHALL NOT 将其替换成外链图片、生成图、无关占位图或开发态 placeholder

#### Scenario: 图片容器优化不遮挡内容

- **WHEN** 页面调整图片容器、遮罩、裁切或安全区
- **THEN** 图片主体和关键视觉信息 SHALL 保持可识别
- **AND** 图片 SHALL NOT 遮挡金额、按钮、标题、正文、状态或主要操作

### Requirement: 用户侧时间展示格式

小程序用户端 SHALL 对社区、评论、回复、消息、内容列表、订单和用户可见记录中的时间进行统一展示格式化，并 SHALL 避免直接展示 raw ISO datetime 字符串。

#### Scenario: 同日时间显示时分

- **WHEN** 用户可见时间与当前本地日期属于同一自然日
- **THEN** 页面 SHALL 显示 `HH:mm`
- **AND** 页面 SHALL NOT 显示完整日期或 raw ISO 字符串

#### Scenario: 三天内时间显示相对天数

- **WHEN** 用户可见时间早于当前本地日期 1 至 3 个自然日
- **THEN** 页面 SHALL 显示 `1天前`、`2天前` 或 `3天前`
- **AND** 页面 SHALL NOT 显示 raw ISO 字符串

#### Scenario: 同年较早时间显示月日时分

- **WHEN** 用户可见时间早于当前本地日期超过 3 个自然日且属于同一年
- **THEN** 页面 SHALL 显示 `M月D日 HH:mm`

#### Scenario: 跨年时间显示年份

- **WHEN** 用户可见时间与当前本地日期不属于同一年
- **THEN** 页面 SHALL 显示 `YYYY年M月D日 HH:mm`

### Requirement: 用户文本可读性与防溢出

小程序用户端 SHALL 确保用户生成内容、服务端内容、评论、回复、文章标题、订单标签、系统提示和错误信息在小屏设备上可读，并 SHALL 防止长连续字符导致横向溢出。

#### Scenario: 长连续字符自动换行

- **WHEN** 标题、正文、评论、回复、摘要、引用、消息或订单标签包含长连续数字、英文、URL 或无空格混排文本
- **THEN** 文本 SHALL 在其容器内自动换行或按页面规则截断
- **AND** 页面 SHALL NOT 发生横向滚动、穿出卡片或遮挡相邻内容

#### Scenario: 短 UI 文案保持稳定

- **WHEN** 页面展示按钮、tab、状态短标签、阵营 badge 或作者昵称单行区域
- **THEN** 文案 SHALL 使用单行省略或固定布局保持稳定
- **AND** 页面 SHALL NOT 因全局 `break-all` 规则把短 UI 文案切割得难以阅读

### Requirement: 普通用户内部字段隐藏

普通用户侧页面 SHALL 隐藏供应商、CPS、订单同步、点击归因和后台排查相关内部字段，并 SHALL 只展示面向用户的补给、账本和状态语义。

#### Scenario: 补给铺不展示内部商业字段

- **WHEN** 普通用户查看补给铺列表、详情、跳转状态或失败状态
- **THEN** 页面 SHALL NOT 展示 CPS、聚推客、佣金、apikey、sid、brand_id、act_id、后台备注、供应商原始错误或未脱敏归因字段
- **AND** 页面 SHALL 使用补给、续命、通勤、食堂等普通用户语义

#### Scenario: 生存账本不展示订单源排查字段

- **WHEN** 普通用户查看生存账本摘要、订单详情或周报
- **THEN** 页面 SHALL NOT 展示订单源 ID、sourceOrderId、原始同步响应、佣金、供应商排查字段或后台备注
- **AND** 页面 SHALL 保持有效、待确认、已回滚和已排除状态的用户可理解表达

### Requirement: 全局 UI 小屏验收

全局 UI 优化 SHALL 在常见小屏宽度下通过人工视觉验收，确保文字、按钮、图片、底部导航、底部输入栏和主要卡片不重叠、不遮挡、不横向溢出。

#### Scenario: 常见小屏页面可读

- **WHEN** 页面在 320px、375px 或 414px 等小屏宽度下展示
- **THEN** 页面 SHALL 保持主标题、正文、按钮、金额、倒计时、图片缩略图、评论、回复和底部操作可读可点
- **AND** 页面 SHALL NOT 出现内容横向溢出、按钮文字被截断到不可理解、图片遮挡操作或底部输入栏覆盖正文的问题

#### Scenario: 极端数据状态可验收

- **WHEN** 页面展示正常数据、空数据、接口失败、长文本、多图、无图、未登录、未建档或未配置状态
- **THEN** 页面 SHALL 使用统一状态视觉和布局兜底
- **AND** 页面 SHALL NOT 通过假数据伪造 ready 状态

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

### Requirement: 摸鱼模式办公表格视觉例外

视觉系统 SHALL 将摸鱼模式定义为经 OpenSpec 明确授权的用户端视觉例外；摸鱼模式 SHALL 使用办公表格视觉语言，而不是暗黑忍者 RPG 视觉语言，且 SHALL 与默认工位模式保持兼容。

#### Scenario: 摸鱼模式豁免 RPG 主视觉

- **WHEN** 用户打开摸鱼模式工作台、表格版日报或表格版论坛页面
- **THEN** 页面 SHALL 使用浅色办公表格视觉
- **AND** 页面 SHALL NOT 套用普通用户端的暗色营地背景、RPG 面板、重点像素框、轻立体卡、语义像素 icon、插画资产、头像、徽章、阵营插画、RPG 发光或游戏化按钮

#### Scenario: 普通模式视觉不受摸鱼模式影响

- **WHEN** 用户打开首页、社区、帖子详情、我的、补给铺、隐者日报、大陆新闻、生存账本或工作档案页面
- **THEN** 页面 SHALL 默认遵循工位模式视觉，并 SHALL 在用户主动切换后遵循隐者模式视觉
- **AND** 页面 SHALL NOT 因摸鱼模式存在而改成办公表格信息架构或表格组件布局

#### Scenario: 摸鱼模式仍遵守可读性和边界

- **WHEN** 摸鱼模式展示金额、倒计时、日报、帖子、评论、回复、附件、加载状态、空状态或错误状态
- **THEN** 页面 SHALL 保持中文可读、小屏防溢出、触区可点、时间展示格式稳定和普通用户内部字段隐藏
- **AND** 页面 SHALL NOT 因视觉例外暴露 CPS、聚推客、佣金、订单源 ID、供应商错误、后台备注、审核字段或未脱敏归因字段

### Requirement: 摸鱼模式表格组件约束

视觉系统 SHALL 为摸鱼模式提供独立的表格组件约束，确保表头、字段行、列表行、合并单元格和操作列在移动端规则统一。

#### Scenario: 表格组件不复用 RPG 卡片层级

- **WHEN** 摸鱼模式渲染工作台数据、日报列表、论坛列表、帖子字段、评论或附件清单
- **THEN** 页面 SHALL 使用表格容器、表头、单元格、细分割线、固定操作列和文本按钮
- **AND** 页面 SHALL NOT 使用 `vs-panel`、`camp-card`、重点像素框、普通信息流卡片或普通社区帖子卡视觉承载这些内容

#### Scenario: 表格组件在小屏保持均衡

- **WHEN** 摸鱼模式表格组件在 320px、375px 或 414px 宽度下展示
- **THEN** 表格 SHALL 保持行高、列宽、操作列和数字列规则稳定
- **AND** 表格 SHALL NOT 因长标题、长正文、长评论、附件数量或互动计数发生横向溢出、内容重叠或操作列不可点

### Requirement: 摸鱼模式无动画交互

视觉系统 SHALL 规定摸鱼模式交互以即时文本和单元格状态反馈为主，不使用装饰性动画。

#### Scenario: 页面操作无游戏化动画

- **WHEN** 用户在摸鱼模式中进入详情、标记、归档、展开附件清单、打开图片或关闭图片
- **THEN** 页面 SHALL 使用即时状态变化、文本变化或计数变化反馈
- **AND** 页面 SHALL NOT 使用粒子、发光、弹跳、淡入淡出、滑动切换、奖励动效或游戏化动画

#### Scenario: 图片查看层无动画

- **WHEN** 摸鱼模式打开或关闭图片查看层
- **THEN** 图片查看层 SHALL 立即出现或立即消失
- **AND** 图片查看层 SHALL NOT 使用普通相册式工具栏、动画切换、滑动切图、保存按钮或转发按钮

### Requirement: 公开个人页布局

小程序公开个人页 SHALL 使用模式化隐者名片布局，在首屏展示身份、关注操作、三项公开统计和公开帖子列表开头；工位模式下 SHALL 使用浅色名片视觉，隐者模式下 SHALL 保留暗黑忍者 RPG 名片视觉。

#### Scenario: 公开个人页首屏结构

- **WHEN** 用户打开公开个人页
- **THEN** 页面 SHALL 在首屏展示返回入口、头像、昵称、阵营、等级、称号、可用的 IP 属地、关注操作、关注数、粉丝数、总公开发帖数和公开帖子列表开头
- **AND** 页面 SHALL 让公开帖子列表在首屏底部露出，表明下方存在内容

#### Scenario: 关注按钮不是身份徽章

- **WHEN** 页面展示关注、已关注或取消关注操作
- **THEN** 操作 SHALL 以按钮或等价操作控件展示
- **AND** 页面 SHALL NOT 将关注状态设计成阵营、等级或认证身份徽章

#### Scenario: 自己主页不展示关注自己

- **WHEN** 用户打开自己的公开个人页
- **THEN** 页面 SHALL NOT 展示关注自己按钮
- **AND** 如展示编辑入口，该入口 SHALL 低调跳转到现有“我的角色”页面

### Requirement: 我的页三项状态数据布局

小程序“我的”页顶部身份区域 SHALL 保持三项状态数据布局，展示关注数、粉丝数和连续签到天数。

#### Scenario: 三项数据保持同一行

- **WHEN** “我的”页拥有合法成长资料快照
- **THEN** 顶部身份区域 SHALL 以紧凑三列或等价稳定布局展示关注数、粉丝数和连续签到天数
- **AND** 页面 SHALL NOT 因隐藏隐币和能量留下空白占位或展示未开放文案

#### Scenario: 关注和粉丝可点击

- **WHEN** 用户点击“我的”页关注数或粉丝数
- **THEN** 页面 SHALL 进入本人关注列表或本人粉丝列表
- **AND** 点击区域 SHALL 清晰但不破坏身份卡信息密度

#### Scenario: 连续签到保持原语义

- **WHEN** 用户查看“我的”页三项状态数据
- **THEN** 连续签到 SHALL 继续表达签到连续天数
- **AND** 页面 SHALL NOT 将连续签到改造成关注关系入口或隐藏已有签到反馈

### Requirement: 关注和粉丝列表布局

关注列表和粉丝列表 SHALL 使用轻量列表布局，保持头像、身份信息和关注操作在小屏上稳定可读。

#### Scenario: 列表项展示最小身份

- **WHEN** 用户打开关注列表或粉丝列表
- **THEN** 每个列表项 SHALL 展示头像、昵称、阵营、等级、称号和当前关注状态操作
- **AND** 列表项 SHALL NOT 展示手机号、IP、隐币、能量、薪资、工作时间、治理状态或后台字段

#### Scenario: 列表项点击进入公开个人页

- **WHEN** 用户点击关注列表或粉丝列表中的头像、昵称或列表项主体
- **THEN** 页面 SHALL 进入对应用户公开个人页
- **AND** 关注操作按钮 SHALL 与进入个人页的点击区域保持可区分

#### Scenario: 空状态简洁

- **WHEN** 关注列表、粉丝列表或公开个人页帖子列表为空
- **THEN** 页面 SHALL 展示简洁空状态
- **AND** 页面 SHALL NOT 使用长篇功能说明、推荐用户占位或假数据填充空白

### Requirement: 公开个人页小屏可读性

公开个人页、关注列表、粉丝列表和“我的”页三项状态数据 SHALL 在常见小屏宽度下不重叠、不横向溢出。

#### Scenario: 长昵称不挤压统计和按钮

- **WHEN** 用户昵称、称号或阵营文本较长
- **THEN** 页面 SHALL 使用单行省略、换行或固定容器保持布局稳定
- **AND** 文本 SHALL NOT 遮挡关注按钮、统计数字、返回入口或帖子列表内容

#### Scenario: 统计数字增长不破坏布局

- **WHEN** 关注数、粉丝数、连续签到天数或公开发帖数增长到较长数字
- **THEN** 页面 SHALL 保持数字和标签在各自容器内可读
- **AND** 页面 SHALL NOT 出现横向滚动、重叠或按钮被挤出屏幕

### Requirement: 隐者名片视觉层级

小程序公开个人页 SHALL 使用模式化隐者名片视觉层级，强化身份感并保持首屏内容可读；名片结构 SHALL 在工位模式和隐者模式下保持一致。

#### Scenario: 名片主信息层级

- **WHEN** 用户打开公开个人页
- **THEN** 页面 SHALL 以头像、昵称、阵营、等级、称号和关注操作作为主视觉信息
- **AND** 关注数、粉丝数和公开帖数 SHALL 作为次级统计信息
- **AND** IP 属地 SHALL 作为弱化辅助信息
- **AND** 页面 SHALL NOT 使用工具表格、后台字段清单或过度营销式 hero 取代名片结构

#### Scenario: 名片不吞掉内容列表

- **WHEN** 公开个人页首屏渲染完成
- **THEN** 公开帖子列表开头 SHALL 在首屏底部露出
- **AND** 页面 SHALL NOT 只展示一张巨大身份卡导致用户看不到下方公开内容入口

### Requirement: 作者入口视觉 affordance

社区帖子详情、评论区和回复区可点击作者 SHALL 有清晰但克制的入口暗示。

#### Scenario: 可点击作者视觉

- **WHEN** 作者拥有合法公开个人页标识
- **THEN** 头像、昵称或作者身份主体 SHALL 具备可点击视觉暗示
- **AND** 点击态 SHALL 保持尺寸稳定，不造成文本跳动、头像位移或评论内容重排

#### Scenario: 不可点击作者视觉

- **WHEN** 作者没有合法公开个人页标识
- **THEN** 作者快照 SHALL 使用普通展示样式
- **AND** 页面 SHALL NOT 显示主页箭头、点击态、可点描边或其他入口暗示

### Requirement: 关注按钮与取消确认视觉

关注和取消关注控件 SHALL 清楚表达状态，并 SHALL 避免误触导致关系变化。

#### Scenario: 关注按钮状态

- **WHEN** 关注按钮展示关注、已关注、处理中或自己状态
- **THEN** 每种状态 SHALL 有明确文案和视觉差异
- **AND** 按钮尺寸 SHALL 稳定，文案变化 SHALL NOT 挤压昵称、称号或统计

#### Scenario: 取消关注确认

- **WHEN** 用户触发取消关注确认
- **THEN** 确认 UI SHALL 简洁明确
- **AND** 确认 UI SHALL NOT 使用恐吓性文案、夸张动效或遮挡关键身份信息过久

### Requirement: 社交列表状态视觉

关注列表和粉丝列表 SHALL 为加载、空、失败、分页和没有更多状态提供稳定视觉。

#### Scenario: 列表状态稳定

- **WHEN** 列表处于加载、空、失败、分页加载或没有更多状态
- **THEN** 页面 SHALL 保持标题、列表容器和重试/加载入口稳定
- **AND** 状态切换 SHALL NOT 造成明显跳屏、重叠或横向滚动

#### Scenario: 列表项点击区和操作区分离

- **WHEN** 列表项同时支持进入公开个人页和关注操作
- **THEN** 头像/昵称/主体点击区 SHALL 与关注按钮点击区可区分
- **AND** 小屏下二者 SHALL NOT 重叠

### Requirement: 社交小屏长内容可读性

公开个人页、关注列表、粉丝列表、“我的”页三项数据和作者入口 SHALL 在常见小屏下处理长昵称、长称号和长数字。

#### Scenario: 长昵称和长称号

- **WHEN** 昵称、称号、阵营文本或连续英文数字长串超出常规长度
- **THEN** 页面 SHALL 使用省略、换行、固定容器或合理断行保持布局稳定
- **AND** 文本 SHALL NOT 遮挡关注按钮、统计、头像、徽章、返回入口、评论正文或列表操作

#### Scenario: 长统计数字

- **WHEN** 关注数、粉丝数、公开帖数或连续签到天数增长到长数字
- **THEN** 页面 SHALL 保持数字和标签在各自容器内可读
- **AND** 页面 SHALL NOT 出现横向滚动、重叠、按钮被挤出屏幕或后续内容被遮挡

#### Scenario: 三档小屏人工验收

- **WHEN** 执行社交体验 polish 验收
- **THEN** 人工检查 SHALL 覆盖 320px、375px 和 414px 宽度
- **AND** 检查 SHALL 覆盖公开个人页、关注列表、粉丝列表、“我的”页三项数据、帖子详情作者区、评论作者区和回复作者区
