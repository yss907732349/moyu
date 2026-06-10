## 1. 视觉规则和资产准备

- [x] 1.1 梳理当前小程序页面中 `vs-panel`、`camp-card`、重点主卡、列表卡、表单区、评论、订单行和 tab/badge 的使用位置，确认重点像素框白名单和禁用位置。
- [x] 1.2 新增或整理重点像素框、轻立体卡、扁平容器的全局样式，确保重点像素框通过显式 opt-in 使用，不修改基础面板默认语义。
- [x] 1.3 准备首页、社区、我的三组原生 tabBar 未选中/选中像素 icon 静态资产，使用项目内路径并控制小程序包体。
- [x] 1.4 在 `pages.json` 为首页、社区、我的配置 `iconPath` 和 `selectedIconPath`，保持原生 tabBar 和三 tab 结构不变。

## 2. 语义 icon registry 收敛

- [x] 2.1 补齐或调整 `visual-system` 中首页、社区、我的、补给、账本、日报、工作设置、状态面板相关语义 icon key 和 fallback 映射。
- [x] 2.2 将我的页菜单、首页倒计时/生存消耗、补给铺分类、生存账本分类、状态面板等页面 icon 入口统一走稳定 resolver 或资产映射。
- [x] 2.3 检查并减少页面局部临时 CSS icon 画法，保留必要 fallback 时也要通过 registry 统一解析。

## 3. 页面卡片层级应用

- [x] 3.1 首页仅让今日已摸金额主卡使用重点像素框，日报/补给入口、倒计时卡组和今日生存消耗入口使用轻立体卡。
- [x] 3.2 社区首页仅让顶部世界观 Banner 使用重点像素框，帖子卡、筛选、分区 tab、互动统计和空状态保持轻立体或扁平层级。
- [x] 3.3 帖子详情页保持阅读优先，正文、评论区、评论、回复、举报和底部输入栏不得使用重点像素框。
- [x] 3.4 我的页身份主卡使用重点像素框，工作/账本状态卡、菜单列表和阵营插画辅助卡使用轻立体或普通容器。
- [x] 3.5 我的角色页阵营身份主卡使用重点像素框，资料编辑、阵营切换和提示区域保持轻立体或扁平层级。
- [x] 3.6 补给铺仅主推荐卡使用重点像素框，分类 section、补给 item、标签和转链状态保持轻立体或扁平层级。
- [x] 3.7 隐者日报仅今日话题/今日参悟主卡使用重点像素框，栏目入口、文章列表、文章详情和评论保持轻立体或阅读容器。
- [x] 3.8 大陆新闻列表和详情保持扫读/阅读优先，不对文章卡、正文区和评论使用重点像素框。
- [x] 3.9 生存账本页顶部今日生存消耗统计卡可使用重点像素框，本周报告、近期订单容器、订单行和详情字段使用轻立体或扁平层级。
- [x] 3.10 工作档案设置页移除表单分组的重框表达，薪资、时间、工作日、发薪日、隐藏模式和保存反馈使用轻立体或扁平表单样式。

## 4. 文档同步

- [x] 4.1 更新 `docs/miniapp-global-ui-design-prd.md`，写入重点像素框白名单、禁用位置、三档卡片层级和原生 tabBar icon 规则。
- [x] 4.2 更新 `docs/miniapp-visual-illustration-system.md`，记录 tabBar icon、菜单 icon、状态 icon、补给/账本/日报/工作设置 icon 的 asset key、fallback 和使用边界。
- [x] 4.3 检查文档中是否仍有“所有卡片都使用像素重框”一类模糊表述，并改为按页面主任务和信息密度分级。

## 5. 回归验证

- [x] 5.1 执行 `corepack pnpm build:miniapp`，确认小程序构建通过。
- [x] 5.2 执行 `corepack pnpm verify:miniapp-package-size`，确认新增 icon 后包体仍符合约束。
- [x] 5.3 执行 `corepack pnpm verify:miniapp-community-lite`，确认社区列表、详情、评论、回复和审核边界未被视觉调整破坏。
- [x] 5.4 执行 `corepack pnpm verify:miniapp-user-growth-profile`，确认我的页、我的角色、身份资料和菜单入口仍可用。
- [x] 5.5 执行 `corepack pnpm verify:miniapp-supply-center` 和 `corepack pnpm verify:miniapp-accounting-ledger`，确认补给铺、转链状态、账本摘要、订单展示和内部字段隐藏边界未变。
- [x] 5.6 执行 `corepack pnpm verify:miniapp-daily-content-feed` 和 `corepack pnpm verify:miniapp-work-profile`，确认日报/大陆新闻阅读和工作档案表单仍可用。
- [x] 5.7 人工检查 320px、375px、414px 小屏下首页、社区、帖子详情、我的、补给铺、日报、大陆新闻、生存账本和工作档案页面，确认重点像素框数量受控、普通卡片不抢主视觉、文字不溢出、底部 tab icon 正常显示。
