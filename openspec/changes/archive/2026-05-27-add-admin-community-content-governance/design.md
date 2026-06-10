## Context

当前社区后台能力主要围绕待审核帖子、待复核评论/回复和举报处理展开，后台运营中心的统一审核队列也只覆盖“待处理事项”。这能解决审核流转，但不能解决日常治理中的历史内容查找、按时间巡检、评论上下文处置和高风险作者限制。

现有社区数据模型已经有帖子、评论、回复、举报、通知、媒体资产和作者公开快照。帖子、评论和回复状态支持 `pending`、`approved`、`rejected`、`hidden`。这为隐藏公开内容提供了基础，但还缺少“后台移除”、用户禁言/封禁、治理操作审计和后台全量检索契约。

第一版仍使用 `x-admin-token`，不引入完整后台账号系统。后台治理接口必须延续现有敏感字段边界，不返回薪资、工作档案、生存账单、微信身份、登录态、供应商密钥或 AI 原始 prompt。

## Goals / Non-Goals

**Goals:**

- 新增社区内容治理总览，后台可按时间倒序查看所有用户发出的帖子。
- 支持关键词搜索和基础筛选，帮助运营定位历史帖子。
- 在帖子详情中管理帖子、评论和一层回复，并保留上下文。
- 提供隐藏、软删除/移除、禁言、封禁、解封等治理操作。
- 对封禁用户的社区写操作进行服务端拦截。
- 记录后台治理操作审计，支撑复查、申诉和后续风控。
- 预留 IP 风险信息边界，但第一版以 `userId` 禁言/封禁为准。
- 扩展验证脚本，覆盖总览、搜索、详情、处置、封禁和敏感字段过滤。

**Non-Goals:**

- 不引入后台账号系统、RBAC、权限菜单或管理员登录态。
- 不实现复杂全文搜索引擎、拼音搜索、分词排序或搜索高亮。
- 不实现批量隐藏、批量封禁、自动封禁或机器学习风控。
- 不保存明文 IP，不以 IP 封禁作为第一版核心能力。
- 不物理删除社区内容、评论、回复、举报或审计记录。
- 不改变小程序公开侧只展示合规公开内容的基本边界。

## Decisions

### 社区内容治理总览独立于统一审核队列

新增后台社区内容治理接口，例如：

```text
GET /admin/community-governance/posts
GET /admin/community-governance/posts/:postId
GET /admin/community-governance/users/:userId/governance
POST /admin/community-governance/posts/:postId/actions
POST /admin/community-governance/comments/:commentId/actions
POST /admin/community-governance/replies/:replyId/actions
POST /admin/community-governance/users/:userId/ban
POST /admin/community-governance/users/:userId/unban
```

统一审核队列继续服务“待处理事项”，社区内容治理总览服务“全量内容检索和处置”。后台首页可以给出入口，但两者不混成一个列表。

备选方案是扩展 `GET /admin/operations/review-queue` 支持所有状态和搜索。该方案复用接口较多，但会让审核队列承担历史内容管理、用户治理和评论树详情，语义过重，也容易影响现有待办体验。

### 软删除/移除不做物理删除

后台“删除”按钮在第一版落为软删除/移除语义。实现上可以新增 `removed` 状态，或新增 `removedAt`、`removedBy`、`removeReason` 字段，同时保持公开侧不可见。

推荐状态语义：

```text
pending   待审核或待复核
approved  已公开
rejected  已驳回
hidden    已隐藏，可作为违规内容留存
removed   已移除，后台留档，公开侧不可见
```

如果短期不想扩展公开状态枚举，也可以先用 `hidden` 加治理审计记录表达“移除”，但共享契约中应区分后台动作 `remove` 和状态结果，避免用户界面把“删除”误解为物理删除。

### 封禁以 userId 为主，IP 只做风险辅助

第一版新增用户社区治理状态：

```text
normal   正常
limited  收紧审核，写内容进入人工复核或更严格规则
muted    禁言，禁止发帖、评论、回复和上传社区图片
banned   社区封禁，禁止社区写操作，可保留浏览公开内容
```

封禁记录应包含 `userId`、状态、原因、备注、开始时间、结束时间、操作人和解除信息。服务端在发帖、评论、回复、社区媒体上传等写入口统一检查用户治理状态。

IP 不作为第一版封禁主键。若需要记录 IP，只能记录脱敏值或哈希值，并明确用于后台排查、提交频率分析或后续风控，不在普通后台响应中展示明文。

### 治理操作必须审计

所有后台治理动作都写入审计记录，包括：

```text
hide_post
remove_post
hide_comment
remove_comment
hide_reply
remove_reply
ban_user
unban_user
limit_user
clear_user_restriction
```

审计记录至少包含对象类型、对象 ID、目标作者 ID、操作、原因、备注、操作人、创建时间和可选的旧状态/新状态。第一版操作人可以继续使用 `admin` 或后台令牌派生出的固定标识；未来后台账号系统上线后再迁移为真实管理员 ID。

### 搜索先用数据库基础能力

第一版搜索只承诺后台可用的基础关键词检索：

```text
title contains keyword
body contains keyword
postId exact
authorUserId exact
author displayName contains keyword
```

默认按 `createdAt desc` 排列，支持游标或分页，限制单页数量。关键词应有最小长度和最大长度，避免空关键词扫全库和过长输入拖慢查询。复杂全文索引、分词、拼音、错别字和相关性排序不进入第一版。

### 敏感字段边界复用并扩展

后台治理详情可以看到作者公开快照、作者用户 ID、内容正文、风险摘要、举报摘要和治理历史，但不得返回微信 openid、unionid、sessionKey、应用登录态、薪资、工作档案、生存账单、CPS 来源、明文 IP、供应商密钥、AI 原始 prompt 或完整供应商响应。

## Risks / Trade-offs

- [Risk] `hidden` 与 `removed` 状态扩展可能影响公开查询过滤。→ Mitigation: 所有公开帖子、评论、回复查询继续只允许 `approved`，验证脚本覆盖隐藏和移除后不可见。
- [Risk] 基础 `contains` 搜索在数据量大时性能有限。→ Mitigation: 第一版限制关键词长度、分页和筛选；后续再迁移到全文索引或搜索服务。
- [Risk] `x-admin-token` 无法识别具体管理员。→ Mitigation: 审计记录第一版使用固定后台操作者标识，规格保留未来迁移真实管理员 ID 的字段。
- [Risk] 封禁写入口遗漏会让被封禁用户继续操作。→ Mitigation: 在社区服务层提供统一用户治理检查，验证脚本覆盖发帖、评论、回复和媒体上传。
- [Risk] IP 相关需求容易扩大到隐私和合规风险。→ Mitigation: 第一版不做明文 IP 封禁；任何 IP 记录只能脱敏或哈希，并不得出现在普通后台响应中。
- [Risk] 后台详情可能误暴露用户私密数据。→ Mitigation: 共享契约定义治理响应白名单，验证脚本复用敏感字段黑名单检查。

## Migration Plan

1. 增加共享契约和 Prisma 模型或字段，保持现有公开接口兼容。
2. 对已有社区内容默认视为 `normal` 用户治理状态，不需要回填封禁记录。
3. 如新增 `removed` 状态，公开侧查询同步过滤非 `approved` 内容，后台总览可展示全部状态。
4. 部署后先开放后台只读总览和搜索，再开放治理写操作和封禁拦截。
5. 回滚时保留新增表不影响公开接口；后台入口隐藏即可停止使用新能力。

## Open Questions

- 第一版后台“删除”按钮展示文案是否使用“移除”以避免误解为物理删除？
- 封禁状态是否允许用户继续点赞、收藏和举报，还是只允许浏览？
- 禁言和封禁的默认期限选项是否固定为 1 天、7 天、30 天、永久？
- IP 哈希是否需要在本 change 实现，还是只在设计中预留字段边界？
