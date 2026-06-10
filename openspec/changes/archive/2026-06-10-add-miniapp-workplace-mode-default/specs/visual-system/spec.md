## ADDED Requirements

### Requirement: 工位模式作为小程序用户端默认外观

小程序用户端 SHALL 将工位模式作为所有用户端页面的默认视觉模式，并 SHALL 将隐者模式作为用户主动切换进入的暗黑忍者 RPG 沉浸模式。

#### Scenario: 首次打开默认工位模式

- **WHEN** 用户首次打开小程序且本地没有已保存视觉模式
- **THEN** 小程序用户端 SHALL 使用工位模式渲染页面、导航栏和原生 tabBar
- **AND** 页面 SHALL 使用浅色背景、浅色卡片、深色文字、浅色描边、办公场景友好的按钮和状态色
- **AND** 页面 SHALL NOT 默认展示整页暗黑 RPG 背景

#### Scenario: 本地保存视觉模式

- **WHEN** 用户切换工位模式或隐者模式
- **THEN** 小程序 SHALL 将选择保存到本地存储
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

## MODIFIED Requirements

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
