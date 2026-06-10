## ADDED Requirements

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

系统 SHALL 允许用户将本人已上传且未绑定其他公开内容的社区图片资产绑定到帖子，并 SHALL 随帖子审核生命周期控制图片公开展示。

#### Scenario: 创建带图片帖子

- **WHEN** 用户提交带社区图片资产 ID 的合法帖子
- **THEN** API SHALL 校验图片资产归属当前用户
- **AND** API SHALL 将图片资产绑定到该帖子
- **AND** 图片 SHALL 跟随帖子保持非公开状态直到帖子人工审核通过

#### Scenario: 绑定他人图片资产

- **WHEN** 用户尝试将他人的社区图片资产绑定到自己的帖子
- **THEN** API SHALL 拒绝创建或保存该帖子
- **AND** API SHALL NOT 暴露他人图片资产的私有信息

### Requirement: 社区图片公开展示

系统 SHALL 在帖子人工审核通过后向公开列表和详情返回可展示的图片资产信息。

#### Scenario: 公开帖子包含图片

- **WHEN** 普通用户读取已审核通过且包含图片的帖子列表或详情
- **THEN** API SHALL 返回该帖子的公开图片资产 ID、展示 URL 和可选缩略图 URL
- **AND** 小程序 SHALL 在帖子卡片或详情页展示图片

#### Scenario: 非公开帖子图片不可公开读取

- **WHEN** 普通用户读取 `pending`、`rejected` 或 `hidden` 帖子相关图片
- **THEN** API SHALL NOT 返回可公开展示的图片 URL
- **AND** 小程序 SHALL NOT 将非公开图片作为公开社区内容展示

### Requirement: 社区图片兼容旧占位

系统 SHALL 兼容历史帖子中的图片 key 占位，但 SHALL NOT 将占位 key 表达为真实可展示图片。

#### Scenario: 历史帖子只有 imageKeys

- **WHEN** 公开帖子仅包含历史 `imageKeys` 且没有社区媒体资产
- **THEN** API SHALL 可以保留 `imageKeys` 兼容字段
- **AND** 小程序 SHALL 展示图片不可用占位或不展示图片
- **AND** 小程序 SHALL NOT 尝试把 `local_image_*` 当作真实图片 URL 请求
