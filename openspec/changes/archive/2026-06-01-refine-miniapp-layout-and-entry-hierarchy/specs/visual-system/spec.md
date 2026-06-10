## MODIFIED Requirements

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
- **THEN** 页面 SHALL 使用同风格的剪影、图案底纹、渐变场景、色块面板或默认图标作为 fallback
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

### Requirement: 正式像素字体

小程序用户端 SHALL 接入具备合法授权的正式像素字体，并 SHALL 为中文可读性和加载失败提供降级策略。

#### Scenario: 字体资源接入

- **WHEN** 小程序构建用户端静态资源
- **THEN** 项目 SHALL 包含正式像素字体文件或明确的字体加载配置
- **AND** 项目 SHALL 记录字体名称、来源和授权信息
- **AND** 项目 SHALL NOT 使用来源不明或不可商用字体作为发布字体

#### Scenario: 字体分层使用

- **WHEN** 页面展示品牌标题、金额数字、等级、倒计时、badge、入口标题或短标签
- **THEN** 页面 MAY 使用正式像素字体强化 RPG 视觉
- **AND** 页面展示长正文、帖子内容、表单说明或错误提示时 SHALL 保持中文可读性优先

#### Scenario: 字体降级

- **WHEN** 像素字体未覆盖某些中文字符、加载失败或在低端设备上表现异常
- **THEN** 页面 SHALL 使用配置好的系统字体或可读中文字体 fallback
- **AND** 页面 SHALL NOT 出现乱码、方块字、不可读字形或明显破坏排版的字体跳变

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

## MODIFIED Requirements

### Requirement: Dark ninja RPG visual identity

小程序端 SHALL 使用暗黑像素忍者 RPG 视觉身份，并 SHALL 将 `隐者大陆`、`隐者`、上班工具和像素 RPG 反馈统一到同一套暗色视觉系统中。

#### Scenario: Primary page uses visual identity

- **WHEN** 用户打开首页、社区页或个人中心页
- **THEN** 页面 SHALL 使用深色夜幕、黑蓝或深紫黑作为默认整页背景
- **AND** 页面 SHALL 使用暗色 RPG 面板、清晰细描边、克制辉光、像素资产和金/紫/蓝/青/橙等状态强调色
- **AND** 页面 SHALL 通过像素插画、徽章、图标、banner 和状态点缀保留忍者 RPG 识别度
- **AND** 页面 SHALL 保持工具信息可读，而不是只呈现装饰性游戏画面

#### Scenario: Visual identity remains consistent across tabs

- **WHEN** 用户在底部 tab 间切换
- **THEN** 首页、社区页和个人中心页 SHALL 保持一致的暗色背景、暗色面板、描边、文字层级、图标风格和选中态表达
- **AND** 底部主导航 SHALL NOT 依赖独立漫画 tab 才能表达 `隐者大陆` 世界观

#### Scenario: Light style is limited to local accents

- **WHEN** 页面需要表达纸张、卷轴、吐槽气泡、图标高光或插画道具
- **THEN** 页面 MAY 使用局部浅色元素
- **AND** 页面 SHALL NOT 将主 tab 默认背景改为全屏白色或浅色风格

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
