# community-media-asset Specification

## Purpose

TBD - created by archiving change mature-community-lite-forum-experience. Update Purpose after archive.

## Requirements

### Requirement: 社区图片资产上传

系统 SHALL 提供社区发帖图片资产上传能力，使小程序选择的本地图片在提交帖子前转换为可持久保存和后续展示的社区媒体资产。

#### Scenario: 用户上传发帖图片

- **WHEN** 已登录且已创建隐者档案的用户在发帖页上传合法图片
- **THEN** API SHALL 创建归属于该用户的社区媒体资产
- **AND** API SHALL 返回稳定资产 ID、展示 URL、可选缩略图 URL 和上传状态

#### Scenario: 未满足身份门槛上传图片

- **WHEN** 未登录或未创建隐者档案的用户尝试上传社区图片
- **THEN** API SHALL 拒绝上传
- **AND** API SHALL 返回客户端可识别的身份门槛错误

#### Scenario: 图片数量超过限制

- **WHEN** 用户提交超过 9 张社区图片
- **THEN** 小程序和 API SHALL 拒绝该请求
- **AND** 系统 SHALL 提示用户最多只能上传 9 张图片

### Requirement: 社区图片资产绑定帖子

系统 SHALL 允许用户将本人已上传且未绑定其他公开内容的社区图片资产绑定到帖子，并 SHALL 随帖子文本审核、图片内容安全审核和帖子生命周期控制图片公开展示。

#### Scenario: 创建带图片帖子

- **WHEN** 用户提交带社区图片资产 ID 的合法帖子
- **THEN** API SHALL 校验图片资产归属当前用户
- **AND** API SHALL 将图片资产绑定到该帖子
- **AND** 图片 SHALL 跟随帖子和图片内容安全结果保持非公开状态直到满足公开条件

#### Scenario: 绑定他人图片资产

- **WHEN** 用户尝试将他人的社区图片资产绑定到自己的帖子
- **THEN** API SHALL 拒绝创建或保存该帖子
- **AND** API SHALL NOT 暴露他人图片资产的私有信息

### Requirement: 社区图片公开展示

系统 SHALL 在帖子审核通过且相关图片内容安全通过后向公开列表和详情返回可展示的图片资产信息。

#### Scenario: 公开帖子包含图片

- **WHEN** 普通用户读取已审核通过、包含图片且图片内容安全通过的帖子列表或详情
- **THEN** API SHALL 返回该帖子的公开图片资产 ID、展示 URL 和可选缩略图 URL
- **AND** 小程序 SHALL 在帖子卡片或详情页展示图片

#### Scenario: 非公开帖子图片不可公开读取

- **WHEN** 普通用户读取 `pending`、`rejected` 或 `hidden` 帖子相关图片
- **OR** 图片内容安全尚未通过
- **THEN** API SHALL NOT 返回可公开展示的图片 URL
- **AND** 小程序 SHALL NOT 将非公开图片作为公开社区内容展示

### Requirement: 社区图片兼容旧占位

系统 SHALL 兼容历史帖子中的图片 key 占位，但 SHALL NOT 将占位 key 表达为真实可展示图片。

#### Scenario: 历史帖子只有 imageKeys

- **WHEN** 公开帖子仅包含历史 `imageKeys` 且没有社区媒体资产
- **THEN** API SHALL 可以保留 `imageKeys` 兼容字段
- **AND** 小程序 SHALL 展示图片不可用占位或不展示图片
- **AND** 小程序 SHALL NOT 尝试把 `local_image_*` 当作真实图片 URL 请求

### Requirement: 社区图片内容安全审核

社区图片资产 SHALL 接入微信图片内容安全异步审核，并 SHALL 与帖子文本审核结果共同决定图片和帖子是否可公开。

#### Scenario: 图片绑定后提交审核

- **WHEN** 用户创建带社区图片资产的帖子
- **THEN** 系统 SHALL 校验图片归属和绑定状态
- **AND** 系统 SHALL 为待公开图片提交微信图片内容安全审核任务
- **AND** 图片 SHALL 在审核通过前保持非公开状态

#### Scenario: 图片审核通过

- **WHEN** 微信图片内容安全回调确认图片通过
- **THEN** 系统 SHALL 将图片资产标记为可公开
- **AND** 当帖子文本和所有图片均通过时，帖子 SHALL 可以进入公开状态

#### Scenario: 图片审核违规

- **WHEN** 微信图片内容安全回调确认图片违规
- **THEN** 系统 SHALL 将图片资产标记为不可公开
- **AND** 绑定该图片的帖子 SHALL 被驳回或保持不可公开

#### Scenario: 图片审核待人工复核

- **WHEN** 图片审核结果为需要复核、下载失败、超时或回调异常
- **THEN** 系统 SHALL 将绑定帖子保留为 `pending`
- **AND** 后台 SHALL 可以查看图片审核原因并人工处理帖子
