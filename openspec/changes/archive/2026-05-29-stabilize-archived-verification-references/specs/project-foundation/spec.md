## ADDED Requirements

### Requirement: Archived change verification references

项目验证脚本 SHALL 对已归档 OpenSpec change 的附属文档使用归档后的稳定路径，并 SHALL 避免继续依赖已失效的活跃 change 路径。

#### Scenario: Verification script references archived change document

- **WHEN** 验证脚本需要读取已归档 change 中的附属验收文档
- **THEN** 验证脚本 SHALL 引用 `openspec/changes/archive/<archive-id>/...` 下的文件
- **AND** 验证脚本 SHALL NOT 只引用 `openspec/changes/<change-id>/...` 下的文件

#### Scenario: Required archived verification document is missing

- **WHEN** 验证脚本依赖已归档 change 附属文档来确认当前验收规则
- **AND** 该文档不存在或路径失效
- **THEN** 验证脚本 SHALL 失败并给出可定位的错误信息
- **AND** 验证脚本 SHALL NOT 静默跳过该策略断言

#### Scenario: Historical archive prose keeps old implementation references

- **WHEN** 归档文档中仅以历史叙述方式提到旧的 `openspec/changes/<change-id>/...` 路径
- **THEN** 系统 MAY 保留该历史文本
- **AND** 当前质量命令 SHALL NOT 依赖该旧路径作为可执行验证输入
