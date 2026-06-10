## Why

近期多个业务 change 已完成归档，但部分验证脚本仍引用 `openspec/changes/<change-id>/...` 形式的未归档路径。归档后这些路径会失效，导致后续验收被历史文档位置绊住，而不是暴露真实产品或工程回归。

## What Changes

- 修正现有验证脚本中对已归档 change 附属文档的路径引用，统一指向 `openspec/changes/archive/<archive-id>/...`。
- 补充归档后验证脚本引用策略：验证脚本若必须读取历史 change 文档，应引用归档后的稳定路径，并在文件缺失时给出明确失败。
- 保持业务能力、API 契约、小程序页面和后台行为不变；本 change 只稳定工程验收边界。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `project-foundation`: 增加归档后验证脚本引用策略，确保工程质量命令不会依赖已失效的 OpenSpec 活跃 change 路径。

## Impact

- 影响 `scripts/verify-*` 中读取 OpenSpec 历史文档的验证脚本。
- 影响 `openspec/specs/project-foundation/spec.md` 中的开发工作流与质量命令约定。
- 不新增运行时依赖，不修改数据库结构，不改变用户侧产品行为。
