# 三报告整合与证据对账 · AI-Native Full-Stack Delivery

- 日期：2026-10-31
- 范围：把三份研究报告（R1/R2/R3）的建议与 Workbench 现有运行时交叉核验，形成可执行的兼容视图。
- 结论状态：`RECONCILED_WITH_SOURCE_GAPS`
- 权威生命周期：`src/catalog.mjs` 的 11 阶段；本文件不建立第二套状态机。

## 0. 来源状态（先说清楚缺什么）

| 编号 | 报告 | 本地可得性 | 状态 |
|---|---|---|---|
| R1 | 《AI-Native 全栈产品交付能力体系深度研究报告》 | 未在授权目录找到完整原文 | `SOURCE_UNAVAILABLE` |
| R2 | 《AI-Native Full-Stack Delivery Capability System》 | 未在授权目录找到完整原文 | `SOURCE_UNAVAILABLE` |
| R3 | 《AI 原生全栈软件交付能力体系研究报告》 | 未在授权目录找到完整原文 | `SOURCE_UNAVAILABLE` |

已检索的授权范围：本仓库、`D:\AI-Outputs\X-SuperPlay-Dev-Workbench`、`D:\Projects\X-SuperPlay-AI-Engineering-OS`、`D:\Projects\X-SuperPlay-OPC-Blueprint`、`D:\Temp\AI-Agents\claude-20261031-review`。未扫描私人目录。

**可核验的相关来源（实际读到）**：

- `D:\Projects\X-SuperPlay-AI-Engineering-OS\03-ai-coding\ai-native-spec-harness-loop.md` — 本地综合范式（非规范性）。
- `D:\Projects\X-SuperPlay-AI-Engineering-OS\09-reference\ai-native-upstream-source-manifest.md` — 上游 pin 与许可证记录。
- 合并进本仓库的 `docs/methods/`（来自 PR #28）：`AI-NATIVE-SPEC-HARNESS-SKILLS-LOOP.md`、`UPSTREAM-SOURCES.md`、`PROJECT-PILOT.md`、`AI-NATIVE-PRODUCT-AGENT-DESIGN.md`、`SKILL-ENGINEERING-FACTORY.md`。
- 任务简报本身对 R1/R2/R3 的结构化摘要（18 阶段、8 宏阶段、Skills 分级、30+60 天路线、灯塔项目等）。

因此：**本文件不对 R1/R2/R3 做逐段比对**；只使用任务简报中可核验的结构性主张，并明确标注哪些主张无法核实。任何“报告原文说 X”的措辞都限定为“任务简报转述”。

### 证据分类图例

- `RESEARCH_FACT`：本地文件、GitHub API 或实际命令可直接核验。
- `UPSTREAM_CLAIM`：上游仓库/作者声明，未在本地复现。
- `ENGINEERING_INFERENCE`：基于现有代码与约束的工程推断。
- `UNVERIFIED`：缺少证据，不得当作既成事实。

## 1. 三报告共同结论（任务简报转述，`UPSTREAM_CLAIM`）

1. 交付应从**可观察的产品规格**出发，而不是从框架或代码出发。
2. **Skills** 是可复用的过程资产，不等于执行权限；需要分级与证据晋级。
3. **Harness** 是 Agent 的执行环境：上下文、工具、权限、测试与反馈。
4. **有界 Loop** 优于无界自主循环：单切片、预算、停止规则、人工批准。
5. 全栈交付必须覆盖 UI、API/认证、数据、集成、部署/回滚与用户验收。
6. 学习目标是能独立交付商业级产品，而不是收集证书。

这些结论与现有 Workbench 的 `PLAYBOOK.md`、`AGENTS.md`、`docs/ARCHITECTURE.md` 方向一致，属于 `ENGINEERING_INFERENCE` 可接受范围。

## 2. 不一致与消解决策

| 冲突点 | 三报告口径 | Workbench 决策 | 理由 |
|---|---|---|---|
| 生命周期阶段数 | 11 / 15 / 18 / 8 宏阶段并存 | **11 阶段为唯一权威**；15 不采用；18 活动与 8 宏阶段作为兼容视图 | 避免第二套状态机；证据模型已绑定 11 阶段 |
| Skills 数量与来源 | 报告推荐大量外部 Skills | 本地 8 个 `CANDIDATE` 为主；外部仅候选、需显式触发 | 未验证许可证与运行时行为的第三方不得默认启用 |
| Matt Pocock v1.3.1 commit | 报告称 `59db609` | **实际 v1.3.1 = `24fe0ef7737efae15c87225755e9f6f5965e4888`** | GitHub API 核验，见 §5 |
| Agent Skill 加载状态 | 报告可能描述为“已加载” | 以 `docs/AGENT_SKILL_LOAD.md` 的实测矩阵为准 | 旧结论可能过期；Codex 调用仍 `BLOCKED` |
| 灯塔项目 | 报告提出 4 个候选 | 仅候选，不默认启动法律合同/真实 ERP/支付/生产库 | 无真实用户授权与维护成本评估 |
| 学习路线 | 30+60 天 | 保留，但绑定真实 Ticket 与证据 | 不以课程完成度冒充交付能力 |

## 3. 11 / 15 / 18 / 8 宏阶段的兼容关系

- **11 阶段（权威）**：`intake → discovery → specification → architecture → planning → implementation → verification → review → release → operation → postmortem`（`src/catalog.mjs`）。
- **8 宏阶段（兼容视图）**：G0–G7，定义于 `src/delivery.mjs` 的 `MACRO_STAGES`。
- **18 项活动（兼容视图）**：A01–A18，定义于 `src/delivery.mjs` 的 `ACTIVITIES`，每项映射回 1–3 个权威阶段。
- **15 阶段**：未采用。没有可靠来源证明它优于 11 阶段，且引入会破坏证据模型与测试。

校验规则（`validateDelivery()`，已接入 `validateCatalog()`）：

- 每个宏阶段只映射权威阶段，8 个宏阶段**恰好覆盖** 11 个阶段一次（无孤儿、无重复权威）。
- 18 项活动**覆盖**全部 11 个阶段；每项有且仅有一个主用 Skill。
- 宏阶段顺序固定 G0→G7，无循环。

## 4. 现有 Workbench 对应源码与实现状态

| 能力 | 现有源码 | 状态 | 说明 |
|---|---|---|---|
| 11 阶段生命周期 | `src/catalog.mjs` `STAGES` | 已实现 | 唯一权威 |
| 任务路由 | `src/routing.mjs` `composeRoute` | 已实现 | 13 任务 × 4 类型 × 4 Tier × 2 模式 |
| Profiles | `src/catalog.mjs` `PROFILES` | 已实现 | 17 个（14 基础 + 3 叠加） |
| 路线 SOP | `src/catalog.mjs` `ROUTE_SOPS` | 已实现 | SaaS / 企业 / 小程序 / APP |
| Skills bundle | `skills/`、`src/catalog.mjs` `SKILLS` | 已实现（CANDIDATE） | 8 个自包含候选 |
| 证据模型 | `src/evidence.mjs` | 已实现 | 状态机 + 本地导入不可信 |
| 工作区资产 | `src/workspace.mjs` | 已实现 | 16 份草案 |
| 8 宏阶段 / 18 活动 | `src/delivery.mjs`（新增） | **已实现（兼容视图）** | CLI：`xeng method activities` / `matrix` |
| 方法文档入口 | `docs/methods/`（PR #28） | 已实现 | `xeng method overview/sources/pilot/design/skills` |
| 方法论回归 | `test/methodology.test.mjs`（PR #28） | 已实现 | CLI 可发现性与来源 pin |
| Harness Ticket 契约 | `src/delivery.mjs`、`src/starter.mjs` | **部分实现** | 字段已生成；工具层强制未实现 |
| 有界 Loop 运行时 | `src/delivery.mjs` | **仅契约** | 无自动编排器；`LOOP_DEFAULT` 为保守参数 |
| 商业交付 Gate | `src/delivery.mjs` `DELIVERY_STATES` | **已定义** | 与既有证据层对齐；未接入流水线 |
| Skills 冲突矩阵 | `src/delivery.mjs` `EXTERNAL_SKILLS` | **已定义** | 元数据已核验；路径级等价未逐一复核 |
| 学习路径 | `src/delivery.mjs` `LEARNING_PATH` | **已定义** | 30/60 天绑定真实 Ticket |
| 真实项目 Dogfood | — | **未实现 / BLOCKED** | 无授权真实项目 |
| 真实 Agent 调用 | `docs/AGENT_SKILL_LOAD.md` | **部分** | Claude Code / OpenCode 已验；Codex `BLOCKED` |

## 5. Skills 重叠与上游核验（`RESEARCH_FACT`，2026-10-31）

GitHub API 实测：

| 上游 | 版本/pin | License | 状态 |
|---|---|---|---|
| `mattpocock/skills` | v1.3.1 = `24fe0ef7737efae15c87225755e9f6f5965e4888`（2026-10-04） | MIT | `REPO_METADATA_VERIFIED` |
| `obra/superpowers` | v7.0.1 = `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b` | MIT | `REPO_METADATA_VERIFIED` |
| `anthropics/skills` | HEAD `ca45fc496a3436251f191354091d557da31c15b5` | **无 LICENSE 文件** | `LICENSE_UNVERIFIED` |
| `vercel-labs/agent-skills` | HEAD `1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62` | **无 LICENSE 文件** | `LICENSE_UNVERIFIED` |
| `github/spec-kit` | v1.2.5 = `4572a67fe0e72a6837e2d7bb0fda875bc41482e5` | MIT | `REPO_METADATA_VERIFIED` |
| `Fission-AI/OpenSpec` | v1.16.0 = `27c0515724decc633818c735ee596481eec78a8b` | MIT | `REPO_METADATA_VERIFIED` |
| `expo/skills` | HEAD `05754e71d02abe0d2d7a2fb5259ccac41f5ea59c` | MIT | `REPO_METADATA_VERIFIED` |

**关键更正**：任务简报/报告称 Matt Pocock v1.3.1 为 `59db609`。实测 `59db609eb1e18aaf59b63284d0e52255aff0c63c` 是 2026-10-27 的另一个提交（“Close blank issues and route requests by kind (#1169)”），**不是 v1.3.1 tag**。旧 manifest 与 `docs/methods/UPSTREAM-SOURCES.md` 使用的 `5beb35b`（2026-10-19）是研究用 pin，比 v1.3.1 领先 47 个提交；它不是 tag，也不应被误写成 v1.3.1。`src/delivery.mjs` 已记录 `reportedClaimStatus: "MISMATCH"`。

精度说明：`v1.3.1` 与 `v7.0.1` 是 annotated tag。tag object 分别为 `0b6cee10f260a2e048279cf737bfd3e37b1fce0b` 与 `cfd50a286baea35041505ed068c878d389ca9f7f`；peel 后的 commit 才是 `24fe0ef...` 与 `2ce8aa15...`。`EXTERNAL_SKILLS.commit` 记录的是 commit，不是 tag object。

重叠关系（`equivalent_to` / `conflicts_with`）：

- 本地 `specification` ↔ mattpocock `to-spec`、spec-kit、OpenSpec（三者定位重叠）。
- 本地 `implementation-plan` ↔ mattpocock `to-tickets`、spec-kit。
- 本地 `code-review` ↔ mattpocock `code-review`。
- spec-kit 与 OpenSpec 互为 `conflicts_with`：同一活动只允许一个主流程所有者。

限制：**未在 v1.3.1 的目录树上逐文件复核路径级等价**；现有 manifest 的路径证据来自 `5beb35b`。因此关系记录为候选，不宣称已验证。

原则（`SKILL_RELATION_POLICY`）：

1. 最小可组合集合；每项活动至多一个主流程所有者。
2. 外部 Skill 仅 `USER_EXPLICIT` 触发，不自动安装、不 Vendor。
3. 静态检查 / 安装 / Agent 发现 / Agent 调用 / 真实项目效果**分层验证**。
4. 许可证未知（anthropics/skills、vercel-labs/agent-skills）时禁止复制正文。

## 6. Greenfield / Brownfield 入口

- **Greenfield（`mode: new`）**：任务路线从任务定义的第一阶段开始；允许最小 Spec；首张 Ticket 纵向穿过 UI→API→DB→测试。
- **Brownfield（`mode: existing`）**：`composeRoute` 自动在最前面补 `intake` + `discovery`；先读项目本地 `AGENTS.md` / `CLAUDE.md` 与真实 CI；文档与代码冲突须记录。
- 校验：`test/routing.test.mjs` 断言 existing 模式恰好补一次 intake/discovery；18 活动对两种模式分别给出 `greenfield` / `brownfield` 字段。

## 7. 四类产品交付路线与 AI Overlay

| 分支 | 现有 `ROUTE_SOPS` | 新增覆盖清单（`PLATFORM_BRANCHES`） |
|---|---|---|
| SaaS / Micro-SaaS | `saas` | 认证、租户隔离、迁移、订阅权益、支付 Webhook（仅确有需求）、配额、日志、备份恢复 |
| 企业 Web / 管理系统 | `enterprise` | 流程图、RBAC、角色/数据域、字段授权、SSO、审批状态机、ERP/CRM、审计、超时幂等、UAT、交接 |
| 微信小程序 | `mini-program` | 主体/类目/AppID、备案适用性、合法域名、登录态、隐私授权、真机、体验版、平台审核、发布回执 |
| 移动 APP | `app` | 技术栈择一、路由、离线、安全存储、设备权限、签名、构建、TestFlight/测试轨道、商店审核、灰度、回滚 |

AI Overlay（`AI_OVERLAY`）：LLM / RAG / Agent / 多 Agent / 自动化工作流 / AI-native UX。硬规则：**AI Overlay 不能绕过底层 Web/SaaS/企业平台的权限 Gate**。AI 能力需要 `eval`、`integration-probe`、`review` 证据；脚本假模型、静态扫描、CI 通过不能替代真实评测或用户验收。

不默认要求同时学习 Flutter、React Native 和原生双端；APP 路线只择一。

## 8. 有界 Loop 的必要条件、成本与安全边界

- 阶段（`LOOP_PHASES`）：`PREPARE → RED → IMPLEMENT → GREEN → REFACTOR → VERIFY → REVIEW → RECORD → STOP_OR_NEXT`。
- 初始参数（`LOOP_DEFAULTS`，保守、非行业标准）：单 Ticket 最多 3 次尝试；自动 Review-Fix 最多 2 轮；无新证据即停止；编辑前必须有假设；单执行窗口 1 个活动 Ticket。
- 终止状态（`LOOP_TERMINAL_STATES`）与既有证据状态映射：
  - `VERIFIED → VERIFIED`
  - `BLOCKED → BLOCKED`
  - `HUMAN_REQUIRED → BLOCKED`
  - `NO_PROGRESS → UNKNOWN`
  - `BUDGET_EXCEEDED → UNKNOWN`
  - `SECURITY_STOP → BLOCKED`
  - `SCOPE_DRIFT → BLOCKED`
- 额外原因放在结构化 `stop_reason`，**不改写**已有证据状态机。
- 成本与安全：`time_budget`、`external_cost_budget`、`allowed_files`、`allowed_commands`、`forbidden_actions` 是 Ticket 必填字段；未授权凭据、生产数据、发布/支付动作一律停止并交回人类。
- 区分**开发用测试**与**独立受保护的验收用例**：Ticket 的 `negative_tests` 与 `accepted_AC` 记录独立验收；禁止 Agent 修改独立验收测试来制造通过，但不禁止正常 TDD 对项目测试的合法编辑。

## 9. 灯塔项目评估（候选，不默认启动）

任务简报提到四类候选（法律合同分析、AI 客户反馈 SaaS、企业采购 Agent、FieldOps Copilot 等）。本仓库**不选择主项目**，因为缺少：

- 真实用户与授权（`UNVERIFIED`）；
- 数据合规与真实 ERP/支付/生产库访问（`UNVERIFIED`）；
- 维护成本与商业可行性数据（`UNVERIFIED`）。

决策：灯塔项目保留为候选；选择标准写入 `LEARNING_PATH` 与 ROADMAP，需用户单独批准后才能启动。**不默认建设法律合同分析产品，不默认接入真实 ERP、支付或生产数据库。**

## 10. Agent Skill 加载状态（纠正可能过时的说法）

以 `docs/AGENT_SKILL_LOAD.md`（2026-10-31 实测）为准：

| Agent | 发现 | 调用 | 结论 |
|---|---|---|---|
| Claude Code | PASS | PASS | `SKILL_LOAD_VERIFIED` |
| Codex CLI | PASS | **BLOCKED**（403 + 用量上限） | `PARTIAL` |
| OpenCode | PASS | PASS | `SKILL_LOAD_VERIFIED` |

- 安装文件 ≠ Agent 发现 ≠ Agent 调用 ≠ 真实项目效果。
- `xeng agent-check` 只证明文件与锁一致（`FILES_VERIFIED_RUNTIME_NOT_VERIFIED`）。
- 上游存在 `agents/openai.yaml` 不代表本地候选 Skill 自动兼容 Codex；兼容性需在目标 Agent 实测。

## 11. 采用 / 修改采用 / 暂缓 / 拒绝

| 建议 | 决策 | 理由 |
|---|---|---|
| 18 项活动矩阵 | **采用（兼容视图）** | 补足 11 阶段的操作粒度，不新增状态源 |
| 8 宏阶段 | **采用（兼容视图）** | 便于学习与汇报；映射回 11 阶段 |
| 15 阶段 | **拒绝** | 无证据优于 11 阶段，破坏证据模型 |
| 外部 Skills 直接引入 | **暂缓** | 许可证/行为未验证；仅候选 |
| Matt Pocock 流程链 | **修改采用** | 作为学习参考，不 Vendor；pin 以实测为准 |
| 有界 Loop | **采用（契约）** | 先定义字段与终止状态，不扩建自动编排平台 |
| 商业交付 Gate | **采用（定义）** | 与既有证据层对齐；未接入流水线 |
| 30/60 天学习路线 | **采用（绑定真实 Ticket）** | 不以课程完成度冒充能力 |
| 灯塔项目默认启动 | **拒绝（暂缓）** | 无真实用户/授权/成本评估 |
| 法律合同分析默认产品 | **拒绝** | 未授权、合规风险高 |
| 真实 ERP/支付/生产库默认接入 | **拒绝** | 需单独授权与沙箱凭据 |

## 12. P0 / P1 / P2 行动与验收依据

### P0（本次已完成）

- [x] 11 阶段保持唯一权威；新增 8 宏阶段 / 18 活动兼容视图（`src/delivery.mjs`）。
- [x] 四类路线覆盖清单 + AI Overlay 权限规则。
- [x] Skills 冲突矩阵与上游 pin/许可证核验（含 `59db609` 更正）。
- [x] Harness Ticket 契约字段生成到 `src/starter.mjs`（含 camelCase + snake_case 契约键，`CONTRACT_DEFINED_NOT_RUNTIME_ENFORCED`）。
- [x] 学习路径 `LEARNING_PATH` 可转换为具体 Ticket 草案（`learningPathTickets()`，状态 `PROPOSED_NOT_READY` / `NOT_RUN`）。
- [x] 每项活动的 `skillNote` 明确本地主用 Skill 的来源、许可（UNLICENSED-PROPRIETARY）与状态（CANDIDATE）；外部 Skill 带 `acceptance` 定义。
- [x] 商业交付状态与 Loop 终止状态定义。
- [x] 校验接入 `validateCatalog()` 与 `npm run check`。
- 验收：`npm run verify`、`node --test test/delivery.test.mjs`、`xeng method --json`。

### P1（下一步，需要真实项目）

- [ ] 在授权真实项目生成并执行 Ticket，产生 `CODE_TESTED` → `CI_VERIFIED` → `RELEASED` → `CONSUMER_ACCEPTED` 证据。
- [ ] 把 `allowed_files` / `allowed_commands` 从“字段”升级为“工具层强制”。
- [ ] Codex 真实 Skill 调用解除 `BLOCKED`。
- [ ] 外部 Skill 在目标项目做一次有边界的沙箱试点（需用户批准与许可证复核）。
- 验收：真实项目仓的测试/CI/发布/验收回执，而非本仓库 CI。

### P2（长期）

- [ ] 跨项目证据索引与 Knowledge Promotion 数据结构（当前仅文档规则）。
- [ ] 自动 Review-Fix 编排（当前仅契约，未实现）。
- [ ] 灯塔项目选定与商业验证（需单独决策）。
- 验收：两个真实项目复用证据 + 独立复核。

## 13. 未验证清单（`UNVERIFIED`）

- R1/R2/R3 完整原文未获得，无法逐段比对。
- Matt Pocock v1.3.1 目录树的路径级等价未逐一复核（仅有旧 pin 的路径证据）。
- anthropics/skills 与 vercel-labs/agent-skills 的许可证未确立。
- 任何真实项目、真实设备、生产部署、真实客户验收均未执行。
- 四个灯塔项目的商业可行性与合规性未评估。
- 企业 ERP / 支付 / 生产数据库未接入。
- 本仓库 CI 通过 ≠ 真实交付。

## 14. 本地验证回执

| 命令 | 结果 |
|---|---|
| `npm run verify`（改动前基线） | 132 tests，131 pass，1 skipped，exit 0 |
| `node --test test/delivery.test.mjs test/starter.test.mjs test/engine.test.mjs` | 34 pass，exit 0 |
| `xeng method activities --json` / `matrix` / `delivery` / `skills-matrix` | 见 `test/delivery.test.mjs` |
| 独立验收脚本（34 项，不复用 `validateDelivery()` / `deliveryMatrix()`） | 34/34 pass |
| `npm run verify`（最终） | 155 tests，154 pass，1 skipped，exit 0 |
| `npm run build` | Pages allowlist verified，exit 0 |
| headless Chrome DOM 执行 | 页面渲染，无 JS 错误 |
| `npm run security` | 88 文件，无密钥形状发现 |

所有生成物与映射状态仍为草案/`NOT_RUN`；本文件不提升任何证据状态。
