## Context

当前后台已经存在日报编辑、日报评论复核、社区待审内容和举报处理接口，但 `apps/admin` 仍以日报编辑为主入口，社区和评论审核被嵌入在日报编辑页下方。运营人员缺少一个可以先看待办、再进入队列、再查看详情并处理的统一工作面。

服务端已经具备 `admin/community` 和 `admin/daily-content` 领域接口，并统一使用 `x-admin-token`。第一阶段后台运营中心应复用这些领域能力，同时新增聚合读取模型，避免前端继续把不同业务域的状态和风险字段硬拼在页面里。

日报发布方面，现有状态包含 `draft`、`pending_review`、`approved`、`scheduled`、`published` 等，但第一阶段日报内容主要由后台人工创建和维护。如果强制“提交审核、审核通过、发布”作为默认路径，会增加日常运营负担。更合适的第一阶段是保留底层兼容状态，但后台默认提供草稿、预览、立即发布和定时发布。

## Goals / Non-Goals

**Goals:**

- 建立后台运营中心首页，集中展示社区、日报评论、举报和日报发布待办。
- 建立统一审核队列读取模型，让后台能按来源、类型、状态和 AI 风险筛选待处理事项。
- 提供审核详情视图所需的数据，包括原文、上下文、作者公开快照、AI 审核摘要、当前状态和可用操作。
- 保持 `x-admin-token` 权限模型，不引入账号、角色或登录系统。
- 简化日报发布流程，支持草稿直接立即发布或定时发布。
- 按文章来源类型执行发布前校验：原创内容不强制外部来源，外部采编内容必须补齐可追溯来源。
- 提供 `pnpm verify:admin-operations` 验证后台入口、队列、操作、令牌和敏感字段边界。

**Non-Goals:**

- 不实现完整后台账号系统、RBAC、权限菜单或管理员登录态。
- 不实现批量审核、复杂搜索、处理人分配、操作审计时间线或用户封禁。
- 不实现运营数据分析大屏、增长漏斗或推荐干预。
- 不把所有审核写操作强制收敛为一个万能接口。
- 不让 AI 自动发布官方日报或伪造外部来源。

## Decisions

### 新增聚合读取接口，写操作继续复用领域接口

新增后台运营聚合读取接口：

```text
GET /admin/operations/workbench
GET /admin/operations/review-queue
GET /admin/operations/review-queue/:itemId
```

这些接口负责把社区帖子、社区评论、社区回复、社区举报、日报评论和日报发布待办整理为统一后台视图。第一阶段写操作继续复用现有领域接口：

```text
POST /admin/community/posts/:postId/review
POST /admin/community/comments/:commentId/review
POST /admin/community/replies/:replyId/review
POST /admin/community/reports/:reportId/handle
POST /admin/daily-content/comments/:commentId/review
POST /admin/daily-content/issues/:issueId/publish
POST /admin/daily-content/issues/:issueId/schedule
```

原因：读取聚合能明显改善后台页面和验证脚本的契约清晰度；写操作保留领域接口可以降低第一阶段实现风险，避免新建一个需要理解所有业务状态的万能 action 服务。

备选方案是前端继续聚合现有接口。该方案改动更小，但会让状态映射、敏感字段过滤和可用操作判断继续散落在 `apps/admin`，不利于后续扩展。

### 队列项返回可用操作而不是让前端硬编码

统一队列项包含 `availableActions` 和 `actionTarget`。`availableActions` 表达后台当前可以展示的操作，例如 `approve`、`reject`、`hide`、`handle_report_keep`、`handle_report_hide`、`handle_report_false`、`view_detail`。`actionTarget` 提供领域类型和目标 ID，前端据此调用现有领域接口。

原因：不同对象的合法操作不同，举报也不是普通内容审核状态。由服务端给出可用操作，可以避免前端误把“驳回举报”这类不存在的动作展示出来。

### 日报采用轻量发布流程

后台默认流程调整为：

```text
draft
  ├─ publish_now      → published
  ├─ schedule_publish → scheduled
  └─ archive          → archived

scheduled
  ├─ 到点发布         → published
  ├─ 修改时间         → scheduled
  ├─ 取消定时         → draft
  └─ 立即发布         → published

published
  └─ archive          → archived
```

底层可以兼容 `pending_review` 和 `approved`，但第一阶段后台不强制运营必须提交审核和审核通过后才能发布。立即发布和定时发布前必须执行发布前校验；定时任务到点发布时也必须再次执行同一校验。

原因：日报是后台官方人工内容，不是普通 UGC。第一阶段真正要防的是空内容、错误结构、外部采编无来源、AI 伪造来源和内部字段泄露，而不是强制多一步人工审批。

### 来源校验按文章来源类型执行

日报文章来源类型第一阶段至少包含：

```text
original 原创内容
curated  外部采编
```

原创内容不要求来源 URL、来源标题或来源站点。外部采编内容在立即发布、定时发布和到点自动发布前必须补齐来源标题、来源站点和来源 URL。若原创内容填写了来源 URL，系统仍应校验 URL 格式。

原因：大陆新闻等栏目可能包含摸鱼侠原创内容，强制外部来源会阻塞真实运营；但标记为外部采编的内容仍需可追溯来源，避免伪造来源或无来源转载。

### 定时发布优先做服务端轻量扫描

第一阶段在 API 服务内提供可验证的定时发布处理能力，可以通过 NestJS 定时任务或内部服务方法按分钟扫描 `scheduled` 且 `scheduledPublishAt <= now` 的日报，并发布通过校验的内容。后续如果部署环境需要，可以迁移到外部 cron 调用同一服务方法。

原因：当前 monorepo 还没有独立任务服务，引入外部队列或调度平台会扩大范围。服务方法可被验证脚本直接调用或通过受控命令触发，便于验收。

## Risks / Trade-offs

- [Risk] 写操作仍分散在领域接口，前端需要根据 `actionTarget` 分流调用。→ Mitigation: 队列项必须返回 `availableActions` 和明确目标类型，验证脚本检查按钮与请求头。
- [Risk] 保留底层 `pending_review` / `approved` 可能让状态语义混乱。→ Mitigation: 规格明确后台第一阶段默认轻量发布路径，兼容状态仅作为历史和后续扩展使用。
- [Risk] API 内置定时扫描在多实例部署时可能重复执行。→ Mitigation: 发布操作必须幂等，更新时基于当前状态限定 `scheduled`，后续可迁移到外部 cron。
- [Risk] 原创内容不要求来源可能降低内容可信感。→ Mitigation: 使用来源类型明确“原创”和“外部采编”，外部采编仍必须补齐来源，不允许 AI 伪造来源。
- [Risk] 后台聚合接口可能不小心暴露私有字段。→ Mitigation: 共享契约定义后台可展示字段，验证脚本检查薪资、工作档案、生存账单、微信身份、AI 原始 prompt、供应商响应和密钥字段不得出现在响应中。
