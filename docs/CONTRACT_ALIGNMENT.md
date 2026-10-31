# 跨仓治理契约对齐（`ai-native-governance-contract/v1`）

本文件是对治理仓 PR #57 中公开安全契约的**独立摘要与实现对账**，不是该文件的副本，也不构成运行时依赖。契约原文由 AI-Native Work Learning OS 拥有；Workbench 只按自己的语义实现，并在此记录采用、部分采用与未实现的部分。

- 对账日期：2026-10-31
- 契约版本：`v1` / revision `1.1`
- 契约来源：AI-Native PR #57 @ `5a990745f155523bc212969c222b7c596a525c48`（contract blob `592bea79de5f5b5f9b883fb89d65af30186b542e`，size 13823）
- 契约 PR 状态（2026-10-31 观测）：`MERGED`（merge commit `15beebf955d1f2a515e2791dc8b375806598d36a`，2026-10-31T05:51:20Z）；合并后 blob 未变
- 观测到的 head 漂移：`2b3013ca` → `41f27219` → `5a990745`；只固定最新观测，不追随移动 PR
- Workbench 版本：`0.2.0`
- 结论：**6 项均为部分实现**；状态词汇兼容已采用；Review Convergence 与 Knowledge Promotion 存在明确的未实现子项；无运行时依赖。

## 1. Task Contract（任务契约）

| 契约要求 | Workbench 现状 | 状态 |
|---|---|---|
| 稳定任务身份 | 任务类型 + 方案 slug；工作区 manifest 记录 task/type/mode | 部分 |
| 原始目标冻结 | `originalRequest` 原样保存，扩大范围需显式修改 | 部分 |
| 可验证 AC | Spec 草案与 Ticket 的 AC 字段；业务方确认前为待定 | 部分 |
| 授权范围 | Ticket 含 `permission`、`agent`、`baseSha`；handoff 限定单阶段 | 部分 |
| 禁止动作 | Ticket 的 `forbiddenActions` 与 handoff 执行纪律均结构化列出 | 部分 |
| 停止条件 | 阶段 `stopWhen` + Ticket `stopConditions` + handoff 停止条件 | 已覆盖 |
| 证据计划 | 阶段 `evidencePlan` 派生到 Ticket 的 `evidencePlan` | 部分 |
| 有界迭代 | Ticket 记录 `iterationBudget`（每假设 2 次、无新证据即停止、单活动任务） | 部分 |

缺口：单执行窗口单任务仍是纪律约束，不是工具层锁；API token 级权限层级未建模。证据：`src/starter.mjs`、`src/handoff.mjs`、`test/starter.test.mjs`。

## 2. Evidence / Verification Identity（证据与验证身份）

| 契约要求 | Workbench 现状 | 状态 |
|---|---|---|
| 状态不可混同 | `NOT_RUN / BLOCKED / IN_PROGRESS / UNKNOWN / VERIFIED` 显式状态机 | 已覆盖 |
| UNKNOWN 不等于 PASS | 无法运行的检查保持 `UNKNOWN`；导入报告不提升 | 已覆盖 |
| 晋级需直接证据 | `transition()` 要求 command/result/artifact 且层为已执行层 | 已覆盖 |
| 阶段完成看全部 Gate | `evidenceSummary()` 按阶段必需 Gate 计算，缺失即不完整 | 已覆盖 |
| 导入声明不可信 | `IMPORTED_NOT_TRUSTED`，`trusted:false`，`promotion:NONE` | 已覆盖 |
| reviewed candidate 身份 | `src/evidence-identity.mjs` 可记录 `reviewed_candidate` 与 sha256 digest | 部分 |
| built / released / runtime / consumer 身份 | 五类身份可记录并检查 source commit 一致，但仍未接入构建/发布流水线 | 部分 |

缺口：身份链已建模为 `RECORDED_NOT_TRUSTED` 并拒绝混合 source commit，但 stage Gate 仍不要求身份链，构建与发布流水线也未自动写入 digest。证据：`src/evidence-identity.mjs`、`src/evidence.mjs`、`test/evidence.test.mjs`。

### 状态词汇兼容（§2.3）

**已采用**：`NOT_RUN` / `UNKNOWN` 不被当作通过；迁移状态 `MIGRATED_NOT_VERIFIED`、CI 回执、发布回执与业务验收分别记录；`CI_PASS` 不升级为 runtime 或 consumer 验收。证据见 `src/evidence.mjs` 与迁移清单的 `verification_status` / `local_checks` / `decommission_status` 分列。

## 3. Agent Side-Effect Permission（Agent 副作用权限）

| 契约要求 | Workbench 现状 | 状态 |
|---|---|---|
| 只读优先 | 新项目/已有项目默认只读发现；`xeng init` 默认 dry-run | 已覆盖 |
| 外部可见动作需明确指令 | 网站不部署、不推送、不安装；Skill 安装需 `--apply --confirm-reviewed` | 已覆盖 |
| 不升级权限 | handoff 要求权限阻断时停止并交回人类 | 部分 |
| 跨会话消息不携带授权 | 文档与 handoff 明示；无工具级拦截 | 部分 |
| 破坏性操作先确认 | 无删除/重置工具；CLI 不提供 force 路径 | 部分 |
| 凭据不进入上下文 | 工具不读取 `.env`/凭证；无上传端点 | 已覆盖 |
| 例外显式 | `xeng audit` 支持带 scope/到期日的例外 | 部分 |

缺口：没有结构化权限层级对象；permission laundering 主要靠文档约束，而非可执行检查。

## 4. Context / State Freshness（上下文与状态新鲜度）

| 契约要求 | Workbench 现状 | 状态 |
|---|---|---|
| Fresh over complete | 文档明确 Current Truth 优先；`xeng doctor` 检查过期事实 | 部分 |
| 分层加载 | handoff 要求先读本地导航与 Spec 切片 | 部分 |
| Point, don't paste | handoff 引用路径，不内联易漂移正文 | 已覆盖 |
| 仓库事实需本会话来源 | handoff 要求报告已读事实与未知项 | 部分 |
| 上下文污染防护 | 文档要求冲突时重读；无自动机制 | 部分 |
| 状态新鲜度锚点 | baseline 记录 HEAD/dirty；manifest 记录目标提交；`buildSha` 为 UNKNOWN | 部分 |

缺口：生成的项目 Profile 没有强制的 `current_truth_anchor` 字段；下游状态失效未自动传播。

## 5. Review Convergence（评审收敛）

| 契约要求 | Workbench 现状 | 状态 |
|---|---|---|
| Finding 不自动成为任务 | `review-record.md` 明确 Finding 不自动成为新需求 | 已覆盖 |
| 仅 Mainline Blocker 阻塞 | Review 模板提供 `MAINLINE_BLOCKER / NON_BLOCKING / QUESTION / SUGGESTION` | 部分 |
| 禁止静默提高 AC | 文档与 Review 模板要求显式 Scope Change；无工具校验 | 部分 |
| 独立评审 | Review 阶段要求独立审查；无独立 Agent 编排 | 部分 |
| 不可变候选 | Review 模板保留 `reviewed_candidate` 字段，未接入 digest 链 | 部分 |
| 不用 Scope Lock 掩盖问题 | Review 模板含 Scope Lock 检查项；无执行机制 | 部分 |

缺口：Finding 分类与双轴评审已模板化，但 immutable candidate digest 与 Scope Lock 执行仍是人工约束。证据：`src/workspace.mjs#reviewRecord`、`test/workspace.test.mjs`。

## 6. Knowledge / Pattern Promotion（知识 / 模式晋级）

| 契约要求 | Workbench 现状 | 状态 |
|---|---|---|
| 逐级晋级 | 文档与 UI 说明“真实失败 → 补测试/Gate → 第二项目复现 → 才考虑 Skill” | 部分 |
| Project Evidence → Domain Pattern | 无跨任务证据聚合模型 | 未实现 |
| Cross-Domain Pattern | 无 | 未实现 |
| Durable Principle | 无 | 未实现 |
| Skill 晋级需两真实任务 | Skill 固定 `CANDIDATE`，未记录复用证据 | 部分 |
| Artifact 晋级需真实消费者 | 工作区产物明确为草案，未记录消费者 | 部分 |

缺口：晋级阶梯目前是文档规则，不是数据结构；没有跨项目证据索引。

## Adoption Record

机器可读记录：[migration/contract-alignment-v1.json](../migration/contract-alignment-v1.json)。

| 章节 | 状态 | 具名缺口 |
|---|---|---|
| Task Contract | PARTIAL | 字段已结构化；单活动任务未工具化 |
| Evidence Identity | PARTIAL | 身份链已建模；未接入 Gate 与流水线 |
| Status Vocabulary | ADOPTED | — |
| Agent Permissions | PARTIAL | 结构化权限层级；可执行防绕过 |
| Context Freshness | PARTIAL | 强制锚点；下游失效 |
| Review Convergence | PARTIAL | 不可变候选 digest；Scope Lock 执行 |
| Knowledge Promotion | PARTIAL | 跨项目证据索引；消费者记录 |

`ADOPTED` 仅用于有本地实现与可复核证据的项；迁移状态、CI 状态和验收状态不互相升级。PR #57 已合并，因此本文件引用的是合并后的契约；但 Workbench 的 `adoption_status` 仍为 `PARTIAL`，未实现的项不以合并事实冒充本地实现。

## 采用与拒绝

**已采用（语义）**：证据状态分离、已执行层要求、导入不可信、Gate 完整性、停止条件、只读优先、不升级权限、历史溯源与 `NOT_RUN` 默认。

**部分采用**：任务契约字段、权限层级、状态新鲜度锚点、评审收敛、知识晋级。

**未采用**：私有文件结构、Gate 名称、CLI 格式、L0–L6 成熟度阶梯作为通用模型。

**拒绝**：任何运行时读取私有仓、循环依赖、把契约当作行业标准或已验收证明。

## 边界

- 本对齐不证明任何真实项目、企业环境或生产系统已验收。
- 契约原文变更时，本文件需重新对账；当前只对 `v1` 负责。
- 未实现的项保持显式记录，不以文档措辞冒充实现。
