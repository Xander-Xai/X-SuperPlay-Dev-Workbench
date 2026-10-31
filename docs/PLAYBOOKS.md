# 工程 Playbook（Profile 附属操作手册）

三份操作手册补齐旧 Engineering OS 中仍有使用价值、此前未被完整承接的工程内容。它们**不是新的生命周期**：11 阶段、任务路由、Profile 义务与证据模型仍是唯一权威。

| Playbook | 绑定的 Profile | 解决的问题 | 入口 |
|---|---|---|---|
| `ai-application` | `ai-application` | AI 应用日常 Feature / Bug / 性能 / 事故；接管陌生代码 | 网站「工程 Playbook」/ `xeng playbook ai-application` |
| `rag` | `rag` | RAG 从业务需求、语料、切分、索引、检索、评测到上线 | 网站「工程 Playbook」/ `xeng playbook rag` |
| `agent` | `agent` | Agent 任务契约、Tool Schema、权限、状态机、编排、HITL、测试 | 网站「工程 Playbook」/ `xeng playbook agent` |

## 权威边界

- 手册是建议性操作指南，状态固定为 `ADVISORY_PLAYBOOK_NOT_VERIFIED`。
- 每个阶段仍是 11 阶段之一；手册不新增 Gate、不改任务路由。
- 手册内容中没有任何真实客户数据；示例均为合成/脱敏契约。
- 手册不会自动安装 Skill、不会提升证据状态，也不会替代真实项目验收。

## 来源与重写

内容是对旧 Engineering OS 三份 Profile 手册的语义重写与压缩，不是逐字复制：

- `04-profiles/ai-application/daily-development-sop.md`
- `04-profiles/rag/from-zero-playbook.md`
- `04-profiles/agent/from-zero-playbook.md`

逐文件去向见 [migration/eng-os-semantic-reconciliation-20261031.json](../migration/eng-os-semantic-reconciliation-20261031.json)。

## 在项目中如何取得

1. 网站「项目启动器」选择对应扩展（AI Application / RAG / Agent）。
2. 「项目工作区」会生成 `<slug>-engineering-playbook.md`（按所选 Profiles 附带手册）。
3. 本地 CLI：`node tools/xeng.mjs playbook <id>` 打印 Markdown；`--json` 输出结构化内容。

生成的手册仍是草案；Agent 交接中不得声称其已执行或已验证。
