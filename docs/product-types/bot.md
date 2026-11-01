# 消息平台机器人（飞书/钉钉/Slack/Discord）：独立开发流程与 Skill 用法（研究占位）

> `RESEARCH_PLACEHOLDER / NOT_RUNTIME_ROUTE / NOT_REAL_PROJECT_VERIFIED` · 资料核对：2026-11-02。本文为初步教学 SOP，不是 `xeng --type` 可选项；不修改权威 11 阶段、现有 4 Route Pack，也不声称真实测试或发布完成。

## 01. 选择此路线的条件

- **交付物**：宿主群组事件、命令、组织安装与消息处理。
- **区别/排除**：不同消息平台 API/权限/分发机制必须分支处理，不与一般 AI Agent 混称。
- **参考 Profile**：backend；ai-application/agent（可选）；**路线建设优先级**：P1。
- **平台专有边界**：Feishu 事件、DingTalk Stream、Slack HTTP 签名、Discord Interaction 的传输/验签差异各有子文档。

## 02. PREFLIGHT（开工前，不是第 12 阶段）

宿主平台测试组织、事件/机器人能力授权、管理员与撤销策略。 记录主体/所有者、平台/SDK 版本、账号/授权、真实环境、依赖、成本预算、测试设备、回滚责任人及所有 `UNKNOWN/BLOCKED`。没有授权不执行外部写入、商店提审或生产变更。

## 03. 权威 11 阶段：每阶段做什么、用哪个 Skill、如何退出

| 阶段 | 本产品的具体动作 | 候选 Skill（输入 → 输出） | 工具/环境 | 最低产物 | 退出条件（未做不得宣称完成） |
|---|---|---|---|---|---|
| `intake` 项目接入 | 确认目标宿主、组织安装授权与管理员边界。记录实际交付物和平台，不借用其他品类的认证/签名要求。 | `project-discovery`（输入：项目 brief；输出：project-brief.md / 授权与 PREFLIGHT） | 用户/平台资质清单、工作区只读探测 | project-brief.md / 授权与 PREFLIGHT | 范围、目标环境与所有者已确认；未知项明确标 UNKNOWN |
| `discovery` 需求发现 | 模拟组织安装、频道权限、机器人触发和用户退出的真实交互。收集用户路径与宿主版本信息；仅把有来源的信息当成事实。 | `project-discovery`（输入：project-brief.md / 授权与 PREFLIGHT；输出：discovery-note.md / baseline） | 宿主开放平台/测试群组、平台 SDK、事件/长连接探针 | discovery-note.md / baseline | 至少一条真实用户旅程和失败旅程有来源，不把假设写为事实 |
| `specification` 可验收规格 | 定义消息/命令、角色、审批与权限拒绝 AC。输入上一阶段已核验旅程；输出可观察的成功、失败和权限约束。 | `specification`（输入：discovery-note.md / baseline；输出：spec.md / AC 与反例） | Spec 与 Given/When/Then | spec.md / AC 与反例 | 每项关键 AC 有 Given/When/Then、负例和测量办法 |
| `architecture` 架构决策 | 设计 OAuth scopes、签名校验、幂等、回调队列。比较至少两个可行技术选项，并写明因平台限制被否决的方案。 | `architecture`（输入：spec.md / AC 与反例；输出：adr/*.md / 接口或数据边界） | 宿主开放平台/测试群组、平台 SDK、事件/长连接探针 | adr/*.md / 接口或数据边界 | 选择唯一主栈；安全、平台 API 和回滚边界经审阅 |
| `planning` 实施计划 | 命令→授权→回复→失败告警纵切。优先高风险纵切，明示测试如何覆盖平台特别 Gate。 | `implementation-plan`（输入：adr/*.md / 接口或数据边界；输出：tickets.json / 允许文件与预算） | Git worktree / Ticket Harness（仅契约，非 Runner） | tickets.json / 允许文件与预算 | 首张 Ticket 有 base SHA、blocked_by、预算、验证命令、停止条件 |
| `implementation` 实现联调 | 用宿主 SDK 编写最小 Bot 和安装配置。不跳过 SDK 鉴权/权限失败分支；Mock 不构成真实平台通过。 | `implementation`（输入：tickets.json / 允许文件与预算；输出：commit / test-output.txt） | 宿主开放平台/测试群组、平台 SDK、事件/长连接探针 | commit / test-output.txt | 最小成功/失败路径可运行；变更遵守允许范围并有单测输出 |
| `verification` 验证评测 | 真实测试工作区回放事件/撤权/限流。必须覆盖：撤销安装后仍可用、事件重放、消息风暴、越权频道访问。 | `verification`（输入：commit / test-output.txt；输出：test-report.md / 真实探针） | 宿主开放平台/测试群组、平台 SDK、事件/长连接探针 | test-report.md / 真实探针 | 在目标环境执行主路径与负例并保留命令、设备/版本、实际结果 |
| `review` 独立评审 | 独立核查宿主授权、事件真实性、消息内容脱敏、限流、恶意指令和人工审批。由与实现者不同的人对照 Spec、平台特殊规则和测试证据逐项评审。 | `code-review`（输入：test-report.md / 真实探针；输出：review.md / Finding） | PR diff / 负例台账 / 供应链扫描 | review.md / Finding | 独立审者签署阻断项处理结论；安全问题未解决不得放行 |
| `release` 发布交付 | 按宿主发布/卸载，保存回执与恢复路径。必须核查：真实宿主安装/卸载、权限拒绝、签名及投递回执。未获得审核/签名/实际发布回执时保持 BLOCKED 或 NOT_RUN。 | `release-engineering`（输入：review.md / Finding；输出：release-receipt.md / 回退记录） | 宿主开放平台/测试群组、平台 SDK、事件/长连接探针 | release-receipt.md / 回退记录 | 发布责任人与回滚方法明确，只有真实平台回执才可记 RELEASED |
| `operation` 运行观察 | 跟踪消息投递、权限失效和误回复。避免把网页可访问/服务在线误认为消费者验收；记录来源和观测窗口。 | `incident-response`（输入：release-receipt.md / 回退记录；输出：ops-log.md / 告警） | 平台日志、告警和错误回执 | ops-log.md / 告警 | 已记录平台特定成功率/故障与告警；无生产部署则 NOT_RUN |
| `postmortem` 复盘改进 | 按宿主分别追踪消息重复、消息延迟、退群失效和权限收缩。只将验证过的修复升级为通用测试，不将一次样例冒充可复用 Skill。 | `incident-response`、`documentation-sync`（输入：ops-log.md / 告警；输出：postmortem.md / 改进项） | Issue/PR、Runbook 与回归清单 | postmortem.md / 改进项 | 事实、根因、复现、行动人和复测计划可追溯；无事件记录跳过理由 |

> Skills 均是本仓库 `CANDIDATE`，表中 `code-review`、`incident-response` 等可能是补充技能，不表示自动安装。一个项目可按实际风险增减推荐项，但必须显式保留省略理由。执行前阅读目标项目的 `AGENTS.md`、当前 Git HEAD 和真实 CI。

## 04. 一张最小端到端 Demo Ticket（第一轮实战）

**目标路径**：测试组织里发送一条指定命令 → Bot 按权限回复；撤权后不得读取或继续推送。

- `ticket_id`: `bot-T001`；`status`: `DRAFT_NOT_EXECUTED`；`base_sha`: `UNKNOWN`（在目标仓填写）。
- **输入**：用户路径、约束、权限、平台 SDK 版本；**输出**：最小可运行构建、测试命令/运行环境、正负用例、Review 记录。
- **允许操作范围**：先仅修改目标项目对应模块；`allowed_files / allowed_commands / reviewer` 由实际项目确定，不能复制本仓模板直接授予权限。
- **成功 AC**：用户完成上述完整纵向操作，关键结果可观察、可复验；**失败 AC**：撤销安装后仍可用、事件重放、消息风暴、越权频道访问。
- **停止条件**：缺少平台授权、真实设备/沙箱、核心失败用例无法执行，或者需要不可逆生产写入 → `BLOCKED` 并人工决定。
- **验证后才可交付**：写下命令、结果、工件和时间；无测试不得写 PASS，发布与消费者验收是两个独立层。

## 05. 此品类必须有的差异化 Gate 与工具

- **负例优先**：撤销安装后仍可用、事件重放、消息风暴、越权频道访问。
- **真实平台 Gate**：真实宿主安装/卸载、权限拒绝、签名及投递回执。
- **不能由 Skill 替代的工具/账号**：宿主开放平台/测试群组、平台 SDK、事件/长连接探针。
- **准入规则**：Feishu 事件、DingTalk Stream、Slack HTTP 签名、Discord Interaction 的传输/验签差异各有子文档。

## 06. 按技术栈/宿主选择唯一平台分册（不得混用）

- [feishu 专用开发/发布差异](platforms/bot/feishu.md)
- [dingtalk 专用开发/发布差异](platforms/bot/dingtalk.md)
- [slack 专用开发/发布差异](platforms/bot/slack.md)
- [discord 专用开发/发布差异](platforms/bot/discord.md)

对应的签名、OAuth/事件、商店审核、更新 SDK 等以所选分册为准。一个真实产品同时支持多平台时，每个平台分别记录自己的证据。

## 07. 官方参考与仍待验证

- [官方平台/标准资料](https://docs.slack.dev/authentication/installing-with-oauth/)（截至 2026-11-02 的研究入口；上线前应重新核对 SDK/政策版本）。
- **本轮无真实项目证明**：账号、设备、沙箱、授权、生产发布/消费者验收尚未执行，均 `NOT_RUN`。
- **升级为正式 Route Pack 的条件**：专属 PREFLIGHT、11 阶段级动作与 Gate、Skill 依赖/冲突验证、CLI/UI 接入及回归、在授权真实项目中留存测试/发布/回退证据。

返回 [独立产品类型导航](README.md)。
