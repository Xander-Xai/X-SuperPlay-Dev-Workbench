# 跨仓治理契约对齐（`ai-native-governance-contract/v1`）

本文件是对私有治理仓 PR #57 中公开安全契约的**独立摘要与实现对账**，不是该文件的副本，也不构成运行时依赖。契约原文由 AI-Native Work Learning OS 拥有；Workbench 只按自己的语义实现，并在此记录采用、部分采用与未实现的部分。

- 对账日期：2026-10-31
- 契约版本：`v1`
- Workbench 版本：`0.2.0`
- 结论：**6 项均为部分实现**；Review Convergence 与 Knowledge Promotion 存在明确的未实现子项；无运行时依赖。

## 1. Task Contract（任务契约）

| 契约要求 | Workbench 现状 | 状态 |
|---|---|---|
| 稳定任务身份 | 任务类型 + 方案 slug；工作区 manifest 记录 task/type/mode | 部分 |
| 原始目标冻结 | `originalRequest` 原样保存，扩大范围需显式修改 | 部分 |
| 可验证 AC | Spec 草案与 Ticket 的 AC 字段；业务方确认前为待定 | 部分 |
| 授权范围 | Ticket 含 `permission`、`agent`、`baseSha`；handoff 限定单阶段 | 部分 |
| 禁止动作 | handoff 的“执行纪律”列出禁止项，但不是结构化字段 | 部分 |
| 停止条件 | 阶段 `stopWhen` + handoff 停止条件 | 已覆盖 |
| 证据计划 | 阶段 `evidence` 种类 + Ticket `testIdea` / `evidence` | 部分 |

缺口：Ticket 没有独立的 `FORBIDDEN_ACTIONS` 与 `EVIDENCE_PLAN` 结构化字段；单执行窗口单任务未在工具层强制（静态规划器不持有执行会话）。

## 2. Evidence / Verification Identity（证据与验证身份）

| 契约要求 | Workbench 现状 | 状态 |
|---|---|---|
| 状态不可混同 | `NOT_RUN / BLOCKED / IN_PROGRESS / UNKNOWN / VERIFIED` 显式状态机 | 已覆盖 |
| UNKNOWN 不等于 PASS | 无法运行的检查保持 `UNKNOWN`；导入报告不提升 | 已覆盖 |
| 晋级需直接证据 | `transition()` 要求 command/result/artifact 且层为已执行层 | 已覆盖 |
| 阶段完成看全部 Gate | `evidenceSummary()` 按阶段必需 Gate 计算，缺失即不完整 | 已覆盖 |
| 导入声明不可信 | `IMPORTED_NOT_TRUSTED`，`trusted:false`，`promotion:NONE` | 已覆盖 |
| reviewed candidate 身份 | manifest 记录目标提交，但 Ticket/证据不绑定不可变 digest | 部分 |
| built / released / runtime / consumer 身份 | 仅有证据层标签，没有逐产物 SHA 链 | 部分 |

缺口：`reviewed_candidate`、`built_artifact`、`released_artifact`、`runtime_receipt`、`consumer_acceptance` 尚未建模为带 digest 的身份对象。

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
| Finding 不自动成为任务 | Review 阶段 Gate 与文档有相关表述 | 部分 |
| 仅 Mainline Blocker 阻塞 | 未建模 Finding 分类枚举 | 未实现 |
| 禁止静默提高 AC | 文档要求显式变更；无工具校验 | 部分 |
| 独立评审 | Review 阶段要求独立审查；无独立 Agent 编排 | 部分 |
| 不可变候选 | 未绑定 review candidate digest | 未实现 |
| 不用 Scope Lock 掩盖问题 | 文档表述；无执行机制 | 部分 |

缺口：Finding 分类、Scope Change 决策、不可变候选是主要未实现项。

## 6. Knowledge / Pattern Promotion（知识 / 模式晋级）

| 契约要求 | Workbench 现状 | 状态 |
|---|---|---|
| 逐级晋级 | 文档与 UI 说明“真实失败 → 补测试/Gate → 第二项目复现 → 才考虑 Skill” | 部分 |
| Project Evidence → Domain Pattern | 无跨任务证据聚合模型 | 未实现 |
| Cross-Domain Pattern | 无 | 未实现 |
| Durable Principle | 无 | 未实现 |
| Skill 晋级需两真实任务 | Skill 固定 `candidate`，未记录复用证据 | 部分 |
| Artifact 晋级需真实消费者 | 工作区产物明确为草案，未记录消费者 | 部分 |

缺口：晋级阶梯目前是文档规则，不是数据结构；没有跨项目证据索引。

## 采用与拒绝

**已采用（语义）**：证据状态分离、已执行层要求、导入不可信、Gate 完整性、停止条件、只读优先、不升级权限、历史溯源与 `NOT_RUN` 默认。

**部分采用**：任务契约字段、权限层级、状态新鲜度锚点、评审收敛、知识晋级。

**未采用**：私有文件结构、Gate 名称、CLI 格式、L0–L6 成熟度阶梯作为通用模型。

**拒绝**：任何运行时读取私有仓、循环依赖、把契约当作行业标准或已验收证明。

## 边界

- 本对齐不证明任何真实项目、企业环境或生产系统已验收。
- 契约原文变更时，本文件需重新对账；当前只对 `v1` 负责。
- 未实现的项保持显式记录，不以文档措辞冒充实现。
