# 小程序插画资产与状态视觉说明

本文记录 `摸鱼隐者` 小程序用户端插画资产、生成提示词、fallback、页面映射和内测检查边界。后续新增或替换图片时，应优先复用 `apps/miniapp/src/visual-system/illustration-registry.ts` 中的稳定 asset key。

## 第一版资产定稿口径

当前第一版小程序主视觉、排版、icon 和插画资产映射已经暂定。`add-miniapp-workplace-mode-default` 后，小程序用户端默认进入浅色“工位模式”，暗黑像素忍者 RPG 视觉保留为首页右上角主动切换的“隐者模式”。本文件记录的资产类型、页面映射、语义 icon registry、tabBar icon 路径、阵营头像/徽章/插画路径、生存账本场景背景和 fallback 规则，均作为后续视觉工作的默认基线。

`polish-community-profile-follow-experience` 归档后，公开个人页、关注列表、粉丝列表和“我的”页三项状态已经确定为轻量社交 UI：复用阵营头像、徽章、语义 icon 和暗色列表层级，不新增公开主页大插画、关注关系专属插画、隐币/能量资源图标或假用户空状态资产。

后续新增或替换图片时，应遵循以下约束：

- 保持既有 asset key、静态文件路径、展示比例、安全区和业务语义稳定；除非新 OpenSpec change 明确要求迁移 key 或重排页面。
- 替换图片只能改变视觉表现，不得改变 feature key、路由、点击权限、审核状态、订单状态、账本统计、首跑状态或工作价值计算。
- 工位模式下优先通过浅色外框、图片底座、文字颜色、文字阴影、文字安全区和占位状态保证可读性；深色正式插画可以直接使用白字，不新增一整套白版插画、白版头像或白版 icon 体系。
- 缺失 icon 或状态图应优先通过 `illustration-registry`、`resolveSemanticIconClass(iconKey)` 或同风格 fallback 补齐，不在页面局部新增临时图标体系。
- 原生 tabBar icon 路径固定为 `apps/miniapp/src/static/tabbar/home.png`、`home-active.png`、`community.png`、`community-active.png`、`profile.png` 和 `profile-active.png`；底部主导航仍只包含首页、社区、我的三个 tab，默认 tabBar 背景和文字色为工位模式，运行时跟随 `moyuxia.visualMode` 切换。
- 阵营头像、徽章和插画继续使用 `apps/miniapp/src/static/profile/factions/<faction>/avatar.jpg`、`badge.png` 和 `artwork.jpg` 的稳定目录结构。
- 生存账本和首页生存消耗场景图继续使用当前 `apps/miniapp/src/static/ledger/*` 资产；图片裁切、压缩、文字阴影或必要时的局部文字底不得遮挡金额、按钮、分类标题和同步状态。
- 插画和 icon 不得包含动态业务文本、二维码、真实品牌标识、CPS 平台标识、佣金、活动内部 ID、订单源 ID 或可反推出用户身份的字段。
- 公开个人页、关注列表、粉丝列表和“我的”页三项状态复用阵营头像、语义 icon 和暗色列表层级；普通 UI 不为隐币、能量新增 icon、插画或资源位。

### 工位模式资产适配口径

- 首页主图、社区 Banner、日报/大陆新闻封面、补给图、生存账本背景、阵营头像、徽章和插画继续复用既有稳定 asset key。
- 工位模式的可读性由容器负责：浅色卡片底、细描边、文字颜色、文字阴影、文字安全区、占位框和失败图统一在 `visual-system.css` 中处理。
- 首页主图、社区 Banner、生存账本和首页生存消耗这类正式插画默认保留原图色彩，不在整张图上叠滤镜、扫描线或大面积遮罩；深色底图可以直接白字，只有复杂背景才处理文字所在的局部背景。
- 工位模式下的深色插画卡可以保留深底和白字，但边框、按钮和状态底座必须使用工位模式覆盖规则；隐者模式的紫色像素框、暗色遮罩和 RPG 底座不得被工位模式修正连带改动。
- 用户上传图片、评论图片、补给商品图和外部内容封面只调整容器、占位、边框、背景和错误态；不得对图片内容做改变含义的滤镜、重绘或重新生成。
- 隐者模式仍使用暗色像素 RPG fallback、白字高对比叠字和原有高对比状态图，不因工位模式默认化删除暗色资产。

### 摸鱼模式资产例外

`pages/stealth-workbench/*` 是 `add-stealth-workbench-mode` 明确授权的办公表格视觉例外，不接入本文件的插画、语义 icon、头像、徽章、阵营插画、Banner 或状态图体系。

该页面组不得新增摸鱼模式专属插画或 icon 资产，不得复用 `IllustrationKeys`、`resolveSemanticIconPath`、`resolveSemanticIconClass`、阵营头像、徽章或普通社区图片缩略图来装饰页面。附件图片只能在用户从附件清单显式点击 `查看` 后，以无动画全屏单图查看层短暂显示。

## 资产规格

| 类型         | 推荐导出尺寸 | 展示比例  | 安全区                     | 透明背景 | 用途                            |
| ------------ | ------------ | --------- | -------------------------- | -------- | ------------------------------- |
| `banner`     | `686x220`    | `686/220` | 底部 `60rpx` 可叠文字      | 否       | 首页入口、社区 Banner、日报封面 |
| `bannerTall` | `686x280`    | `686/280` | 底部 `80rpx` 可叠文字      | 否       | 首页工作场景主卡                |
| `artwork`    | `360x540`    | `5/7`     | 顶部 `40rpx`、底部 `80rpx` | 否       | 我的页与角色页阵营插画          |
| `scene`      | `640x480`    | `4/3`     | 底部 `60rpx` 可叠文字      | 否       | 首跑、空状态、错误状态          |
| `cardScene`  | `704x480`    | `22/15`   | 左下 `120rpx` 可叠文字     | 否       | 首页/账本三类生存消耗卡片背景   |
| `wideScene`  | `1376x560`   | `86/35`   | 左侧 `260rpx` 可叠文字     | 否       | 生存账本顶部/首页账本入口背景   |
| `homeBoard`  | `1376x448`   | `43/14`   | 中左 `320rpx` 可叠文字     | 否       | 首页今日生存消耗整卡背景        |
| `icon`       | `96x96`      | `1/1`     | 不叠文字                   | 是       | 菜单、板块、分类、倒计时        |
| `tabBarIcon` | `32x32`      | `1/1`     | 不叠文字                   | 是       | 微信原生 tabBar 未选中/选中图标 |
| `avatar`     | `160x160`    | `1/1`     | 不叠文字                   | 是       | 阵营头像                        |
| `badge`      | `96x96`      | `1/1`     | 不叠文字                   | 是       | 阵营徽章                        |

## 页面映射

| 页面/状态            | asset key 或 fallback                                                                                         | 要求                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 首页工作主卡         | `px-banner-home-work` / `vs-fallback-work`                                                                    | 金额、倒计时、设置按钮必须由原生 UI 渲染；未登录、未建档、未配置和 ready 状态主卡尺寸保持一致                            |
| 首页隐藏模式         | `px-banner-home-hidden` / `vs-fallback-hidden`                                                                | 遮挡敏感金额，保留恢复入口                                                                                               |
| 首页未配置工作档案   | `work_profile_missing` 状态                                                                                   | 不使用假薪资、假时间或演示金额；仅保留状态、占位金额/倒计时和配置入口，不展示重复解释文案                                |
| 首页本地快照降级     | `degraded` 状态                                                                                               | 不遮挡真实金额、倒计时和设置入口                                                                                         |
| 首页日报入口         | `px-banner-home-daily` / `vs-icon-daily`                                                                      | 不把动态日报标题画进图                                                                                                   |
| 首页补给入口         | `px-banner-home-supply` / `vs-icon-supply`                                                                    | 不暴露平台、佣金或活动内部字段                                                                                           |
| 首页倒计时           | `px-icon-rest`、`px-icon-salary`、`px-icon-calendar` fallback                                                 | 倒计时文本由原生 UI 渲染                                                                                                 |
| 首页生存消耗入口     | `survival-ledger-board-home-v2` + `survival-canteen-card`、`survival-afternoon-card`、`survival-commute-card` | 整块轻立体卡使用偏明亮的像素 RPG 任务公告板背景，三张小卡使用插画铺底、白字和文字阴影，不与主金额卡抢视觉                |
| 原生 tabBar          | `px-icon-tab-home`、`px-icon-tab-community`、`px-icon-tab-profile` 及 `*-active`                              | 使用 `static/tabbar/*.png`，保留首页、社区、我的三 tab，不引入自定义 tabBar                                              |
| 补给铺三类板块       | `px-icon-supply-canteen`、`px-icon-supply-afternoon`、`px-icon-supply-commute`                                | 通过 registry fallback 到 `vs-icon-canteen`、`vs-icon-afternoon`、`vs-icon-commute`                                      |
| 补给铺空/不可用      | `supply_unavailable` 状态                                                                                     | 不注入假补给                                                                                                             |
| 补给转链失败         | `supply_link_failed` 状态                                                                                     | 不展示内部错误响应或排查字段                                                                                             |
| 生存账本顶部统计     | `survival-ledger-hero`                                                                                        | 使用原账本大插画背景，金额、同步状态和按钮均由原生 UI 渲染                                                               |
| 生存账本分类         | `survival-canteen-card`、`survival-afternoon-card`、`survival-commute-card`                                   | 三类统计可复用首页场景背景，不展示平台名、佣金、订单源 ID                                                                |
| 生存账本空订单       | `orders_not_synced` 状态                                                                                      | 不创建假订单，不表达真实 0 消费                                                                                          |
| 社区 Banner          | `px-banner-community-top` / `vs-fallback-community`                                                           | 作为世界观/绘卷入口，不使用无操作价值占位                                                                                |
| 社区空/错误/身份缺失 | `empty`、`network_failed`、`logged_out`、`profile_missing`                                                    | 未登录或未建档不展示发帖主操作                                                                                           |
| 社区公开个人页       | `px-faction-*-avatar`、`px-faction-*-badge` fallback                                                          | 使用目标用户公开身份资产；首屏为隐者名片，关注按钮、弱化 `IP属地` 和统计由原生 UI 渲染，不新增主页大插画或成长资源图标   |
| 关注/粉丝列表        | `px-faction-*-avatar` fallback                                                                                | 列表项只用阵营头像和最小公开身份；加载、空、失败、分页和没有更多状态由原生 UI 渲染，空状态不填推荐用户、假用户或长篇说明 |
| 我的页菜单           | `px-icon-menu-*` fallback                                                                                     | 我的角色、工作设置、我的帖子、收藏帖子、论坛消息、生存账本分别有语义 icon                                                |
| 我的页阵营资产       | `px-faction-*-avatar`、`px-faction-*-badge`、`px-faction-*-artwork`                                           | 使用当前用户阵营，不用无关演示图                                                                                         |
| 我的页三项状态       | `px-icon-menu-my-posts`、`px-icon-menu-messages`、`px-icon-resource-checkin` fallback                         | 展示关注数、粉丝数和连续签到天数；关注/粉丝可有轻量入口箭头，连续签到不作为社交入口；不展示隐币、能量或未开放成长资源位  |
| 工作设置             | `px-icon-menu-work-settings` / `px-icon-work-settings`                                                        | 用于首页设置入口、工作档案状态和工作档案设置，不单页临时手画                                                             |
| 状态面板 icon        | `px-icon-state-*` fallback                                                                                    | 加载、空、登录、建档、错误、降级、补给、账本状态统一经 `resolveSemanticIconClass` 解析                                   |
| 首跑状态             | `logged_out`、`profile_missing`、`work_profile_missing`、`ready`                                              | 首页、我的页和引导页标题、说明、主操作语义一致                                                                           |

## 语义 icon registry 规则

- 页面需要菜单、状态、补给、账本、日报、工作设置、倒计时和功能入口 icon 时，应优先使用 `resolveSemanticIconClass(iconKey)` 或 `IllustrationKeys` 中的稳定 asset key。
- 正式 PNG 尚未补齐时，可以使用 `vs-icon-*` CSS fallback，但 fallback 必须经 registry 解析，不在页面局部新增无关 CSS 图标体系。
- 新增 icon 只能改变视觉表达，不得改变 feature key、路由、点击权限、审核状态、订单状态、账本统计或首跑状态。
- tabBar icon 使用项目内透明 PNG，小尺寸发布资源，不使用外链图片、二维码、真实平台 logo、开发态 placeholder 或含动态业务文本的图片。
- 隐币和能量当前只保留为内部成长资料字段；普通用户页面、公开个人页、关注列表和粉丝列表不得通过 icon、插画、徽章或统计位暗示该玩法已经开放。

## 生成提示词

通用正向提示词：

```text
暗黑像素忍者 RPG，小程序移动端插画，夜幕工位，像素角色剪影，忍者道具，RPG 面板氛围，低饱和暗色背景，金色/青色/紫色少量高光，清晰边缘，保留底部安全区，不包含文字，不包含按钮，不包含二维码，不包含真实品牌标识，JPG 输出；透明徽章 PNG 输出
```

按类型补充：

| 类型         | 补充要求                                                             |
| ------------ | -------------------------------------------------------------------- |
| `banner`     | 横向构图，主体位于中上部，底部预留文字安全区                         |
| `artwork`    | 竖向角色/阵营场景，核心人物完整落在中间安全区                        |
| `scene`      | 状态场景清晰，能表达加载、空、错误或降级，不画业务文案               |
| `icon`       | 透明背景，粗像素边缘，单个语义道具，深色描边                         |
| `tabBarIcon` | 透明背景，32px 小尺寸像素道具，未选中弱文字色，选中使用主紫/金色强调 |
| `avatar`     | 透明背景或深色纯底，脸部/头部居中，适合圆形裁切                      |
| `badge`      | 透明背景，阵营符号居中，边缘可读                                     |

禁用元素：

- 禁止金额、倒计时、等级、经验、订单金额、tabs、筛选项、状态标签、按钮文案或会随业务变化的文字进入插画。
- 禁止未经授权品牌、真实 CPS 平台标识、二维码、聚推客字段、佣金、活动内部 ID、平台密钥或订单源 ID。
- 禁止浅色网页化插画、营销海报式大字、不可商用字体和与暗黑像素忍者 RPG 风格不一致的图。

## 原生 UI 口径

- 小程序全局字体统一使用方正黑体字体栈，展示字体、正文、按钮、金额、倒计时和短标签均从全局变量继承。
- 当前不内嵌方正字体文件；设备未安装时降级到 `PingFang SC`、`Hiragino Sans GB`、`Microsoft YaHei` 等可读中文字体。
- 若后续要把方正字体文件打包进小程序或使用在线字体，应先确认授权范围覆盖微信小程序嵌入/调用。
- 小程序真实按钮优先使用厚像素文字按钮：黑色粗外框、内高光、底部压暗阴影和按压下沉反馈。
- 按钮不得为了“像素风”硬塞无关图标；只有存在明确业务语义、且图标来自当前视觉系统时，才允许图标进入按钮。
- 首页主金额卡在未登录、未建档、未配置工作档案和 ready 状态下应保持相近尺寸；状态变化只替换必要文案、状态标签和操作入口。
- 首页未登录、未建档或未配置工作档案时，不展示“登录后才能保存”“填写后首页会显示”等重复说明文案，避免首屏文字拥挤。

## 现有静态资产清单

| 文件                                                                | 尺寸       | 处理建议                                           |
| ------------------------------------------------------------------- | ---------- | -------------------------------------------------- |
| `apps/miniapp/src/static/daily-content/absurd-casefile-cover.jpg`   | `640x284`  | 保留，用作日报栏目封面；后续可按 `686x220` 重裁    |
| `apps/miniapp/src/static/daily-content/world-intel-cover.jpg`       | `640x284`  | 保留，用作大陆新闻封面；后续可按 `686x220` 重裁    |
| `apps/miniapp/src/static/profile/role-hero.jpg`                     | `640x306`  | 保留为历史角色横幅备用；角色页优先使用当前阵营插画 |
| `apps/miniapp/src/static/profile/factions/key_shadow/artwork.jpg`   | `360x540`  | 保留，符合 `artwork` 比例                          |
| `apps/miniapp/src/static/profile/factions/water_escape/artwork.jpg` | `360x540`  | 保留，符合 `artwork` 比例                          |
| `apps/miniapp/src/static/profile/factions/sky_strategy/artwork.jpg` | `360x540`  | 保留，符合 `artwork` 比例                          |
| `apps/miniapp/src/static/profile/factions/wanderer/artwork.jpg`     | `360x540`  | 保留，符合 `artwork` 比例                          |
| `apps/miniapp/src/static/profile/factions/*/avatar.jpg`             | `160x160`  | 保留，适合圆形头像裁切                             |
| `apps/miniapp/src/static/profile/factions/*/badge.png`              | `96x96`    | 保留，适合徽章展示                                 |
| `apps/miniapp/src/static/tabbar/home.png`                           | `32x32`    | 首页原生 tabBar 未选中 icon                        |
| `apps/miniapp/src/static/tabbar/home-active.png`                    | `32x32`    | 首页原生 tabBar 选中 icon                          |
| `apps/miniapp/src/static/tabbar/community.png`                      | `32x32`    | 社区原生 tabBar 未选中 icon                        |
| `apps/miniapp/src/static/tabbar/community-active.png`               | `32x32`    | 社区原生 tabBar 选中 icon                          |
| `apps/miniapp/src/static/tabbar/profile.png`                        | `32x32`    | 我的原生 tabBar 未选中 icon                        |
| `apps/miniapp/src/static/tabbar/profile-active.png`                 | `32x32`    | 我的原生 tabBar 选中 icon                          |
| `apps/miniapp/src/static/ledger/survival-ledger-hero.jpg`           | `1376x560` | 生存账本详情页顶部统计大卡背景                     |
| `apps/miniapp/src/static/ledger/survival-ledger-board-home-v2.jpg`  | `1376x448` | 首页今日生存消耗板块公告板背景                     |
| `apps/miniapp/src/static/ledger/survival-canteen-card.jpg`          | `704x480`  | 隐者食堂场景卡背景                                 |
| `apps/miniapp/src/static/ledger/survival-afternoon-card.jpg`        | `704x480`  | 下午续命场景卡背景                                 |
| `apps/miniapp/src/static/ledger/survival-commute-card.jpg`          | `704x480`  | 通勤场景卡背景                                     |

## 后续补图边界

- 首页生存消耗入口和生存账本顶部/分类统计已接入正式场景背景；补给铺、社区状态和部分账本状态仍可继续使用可发布的暗色 fallback。
- 后续补图只需按 asset key 补齐 `sourcePath` 或替换对应静态文件，页面结构和业务逻辑不应重写。
- 单张首屏图建议控制在 `400KB` 以内；非首屏状态图优先复用，避免小程序包体快速膨胀。
- 小屏验收优先看 `320px`、`375px` 和 `414px`：文字不重叠、按钮不被插画遮挡、列表缩略图不拉高卡片、公开侧不显示内部商业字段。
