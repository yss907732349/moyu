## ADDED Requirements

### Requirement: 社区列表视觉打磨

社区列表 SHALL 使用生产级 Banner、统一空状态、身份引导和稳定帖子缩略图，保持公共浏览和发帖主流程可读。

#### Scenario: 社区 Banner 展示世界观入口

- **WHEN** 用户打开社区首页
- **THEN** 页面 SHALL 展示承载漫画/IP 内容入口、世界观内容入口或活动入口的生产级 Banner
- **AND** Banner SHALL NOT 使用“模块封印中”“敬请期待”或无操作价值占位文案作为主要表达

#### Scenario: 社区空列表展示状态视觉

- **WHEN** 社区列表没有公开帖子或接口读取失败
- **THEN** 页面 SHALL 展示统一空状态或错误状态视觉、原因说明和可恢复操作
- **AND** 页面 SHALL NOT 使用本地演示帖子冒充真实社区内容

#### Scenario: 未登录或未建档引导进入身份链路

- **WHEN** 未登录或未创建隐者档案的用户打开社区列表
- **THEN** 页面 SHALL 使用统一身份引导视觉提示登录或建档
- **AND** 页面 SHALL 不展示可提交发帖的主行动

#### Scenario: 帖子缩略图不破坏列表密度

- **WHEN** 社区列表展示带图片帖子
- **THEN** 缩略图 SHALL 使用固定容器和裁切填充方式展示
- **AND** 单个帖子 SHALL NOT 因原始图片比例过高而占用异常大屏幕空间
