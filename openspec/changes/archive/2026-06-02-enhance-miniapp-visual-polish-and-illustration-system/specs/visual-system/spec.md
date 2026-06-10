## ADDED Requirements

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

### Requirement: 用户端统一中文字体

小程序用户端 SHALL 使用方正黑体字体栈统一展示字体、正文、按钮、金额、倒计时、badge 和短标签，并 SHALL 尊重字体文件嵌入授权边界。

#### Scenario: 方正黑体字体栈生效

- **WHEN** 小程序页面渲染真实 UI 文本
- **THEN** 页面 SHALL 优先使用方正黑体字体栈
- **AND** 设备未安装方正黑体时 SHALL 降级到可读中文系统字体

#### Scenario: 未授权前不内嵌字体文件

- **WHEN** 项目尚未取得覆盖微信小程序嵌入或在线调用的字体授权
- **THEN** 小程序 SHALL NOT 通过 `@font-face` 打包方正字体文件或在线字体文件
- **AND** 小程序 SHALL 通过字体名称声明和系统 fallback 保持可读
