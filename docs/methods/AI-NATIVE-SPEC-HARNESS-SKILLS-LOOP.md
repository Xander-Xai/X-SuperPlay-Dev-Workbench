# AI-Native Spec-Driven Harness & Loop Engineering

> 中文：**AI 原生规格驱动的 Harness–Skills–Loop 全栈工程范式**
>
> **定位**：X-SuperPlay 的本地综合方法名称（local synthesis），并非 Matt Pocock、OpenAI、Anthropic 的联合产品、行业标准或招聘企业的官方名称。适用于 Claude Code / Codex / OpenCode 等 Coding Agent 驱动的真实产品开发。
>
> **权威边界**：本文件是 Workbench 的**方法入口与实施映射**，不是第二条生命周期、第二套安全 Gate、自动运行器或可替代项目本地规则的规范。权威为 `src/catalog.mjs` 的 11 stages / 13 task routes / Profiles、`src/routing.mjs`、证据模型与目标仓库 `AGENTS.md`/`CLAUDE.md`。
>
> 状态：`METHOD_DOCUMENTED_AND_ROUTED`；真实项目端到端试点 `NOT_RUN`；独立 Harness/Loop Runner `NOT_IMPLEMENTED`。文档存在、CLI 能显示，不代表第三方 Skill 已安装、Agent 已执行或产品已发布。

## 1. 一句话定义和完整路径

先确认**可观察、可验收的产品结果**，由 Spec/AC 固定边界；用 Skills 表达可复用过程，用 Harness 提供 Agent 可读上下文、受限工具、测试/评测反馈；每次只对一个批准的纵切任务执行**有界循环**；以真实 UI→API→业务逻辑/Agent→数据的证据证明产品，再由人控制合并和发布。

```text
原始需求/市场信号
  ↓ 需求有效性与授权（UNKNOWN 可以拒绝启动）
Discovery / Grill：目标用户、场景、非目标、风险和约束
  ↓
Spec + AC + negative cases + evidence plan
  ↓
Tracer Tickets：依赖图、纵向切片、每卡预算/停止条件
  ↓
Skills：按阶段选择候选过程，核查实际可用/授权
  ↓
Harness：仓库当前事实 + 可用工具 + 沙箱/权限 + checks/evals + trace/feedback
  ↓
Bounded Loop：选一张卡 → baseline → test/repro → smallest diff → verify → review → record
  ├─ AC+Standards 满足：形成可复验提交和 PR
  ├─ 新证据/新假设且预算内：同卡重试
  └─ 无授权/无新证据/风险/预算耗尽：STOP + 阻断记录
  ↓
Full-stack demonstration → independent review → authorized merge/release → observe → postmortem
  ↓
项目证据 → 跨任务/项目复用 → 经过评审的 Pattern/Skill 晋级候选
```

### 不可混淆的五个组件

| 组件 | 定义 | 输入 / 输出 | **不**意味着 |
|---|---|---|---|
| **Spec-driven** | 先确定可观察完成标准，拒绝纯提示词“做完了” | 需求→Spec、AC、负例、验证方法 | 所有需求都要冗长 PRD |
| **Skills** | 按需加载、可版本化的过程知识（`SKILL.md` / references） | 阶段与任务→候选 Skill→实测回执 | 安装即成功；Skill 赋予权限 |
| **Harness Engineering** | 围绕 Agent 的工程环境：上下文、工具、沙箱、约束、验证、反馈 | 仓库事实/权限/工具→可复现执行面 | 仅换个 System Prompt；自动具备生产访问 |
| **Loop Engineering** | 任务状态、验证反馈和止损策略控制迭代 | 单任务、失败证据、预算→PASS/BLOCKED/STOP | 无限自主重试；“循环”即 Ralph 插件 |
| **AI-native full-stack** | 把验证贯通界面、后端、权限、数据、模型/工具、用户使用 | 实际运行路径→测试/演示/交付证据 | 本地 Mock 证明真实 Provider 或生产可用 |

**区分**：Skill 是“怎么做”；Harness 是“在哪些真实约束与反馈中做”；Loop 是“失败后是否、何时及怎样再试”。工程主体仍是可验证的产品结果。

## 2. Workbench 的唯一集成落点

| 范式步骤 | 现有权威模块 | 用法 / 输出 | 现状 |
|---|---|---|---|
| 需求分流与判断 | `src/catalog.mjs`, `src/routing.mjs`, `docs/PLAYBOOK.md` | 选择 SaaS / enterprise / mini-program / mobile、new/existing、task、Tier、AI/RAG/Agent | 已有 |
| Discovery、Spec、AC | `skills/project-discovery`, `skills/specification`, `src/starter.mjs` | Scope / Non-goals、Given–When–Then、权限负例及证据计划 | 候选 Skill / 草案 |
| Tracer Tickets / 架构 | `skills/implementation-plan`, `skills/architecture`, `src/workspace.mjs` | 每张卡竖切 UI→API→data、blocked_by、验证/预算/回退 | 有草案生成 |
| Skills 选择与安装 | `src/install-contract.mjs`, `tools/skill-kit.mjs`, `docs/SKILL_KIT.md` | 阶段路由、依赖闭包、dry-run、受控安装、锁/回滚 | 已有；8 个自有候选 Skill |
| Harness 预备 | `tools/project-probe.mjs`, `src/handoff.mjs`, `docs/AGENT_SKILL_LOAD.md` | HEAD/dirty、指令、最小上下文、工具/权限、真实测试命令 | 部分实现；无独立 Harness 守护进程 |
| Bounded Loop | `src/handoff.mjs`, `src/workspace.mjs`, `docs/PLAYBOOK.md` | 单任务、每假设最多两次无增量修复、双轴审查、STOP | 文档/模板约束；无自动 Loop Runner |
| 验证与证据身份 | `src/evidence.mjs`, `src/evidence-identity.mjs` | VERIFIED/UNKNOWN 等严格区分、项目/构建身份 | 模型已实现；未接入全部真实 CI/发布链 |
| RAG/Agent 交付 | `src/playbooks.mjs`, `docs/PLAYBOOKS.md` | Golden Set、Tool/State/Authorization/HITL、真实 Provider Eval | 方法可用；真实试点未验收 |
| 发布与升级 | `src/git-workflow.mjs`, `docs/CONTRACT_ALIGNMENT.md` | PR、独立 Review、Release/Consumer evidence、跨项目 Pattern 晋级 | 部分实现 |

**使用顺序**：`node tools/xeng.mjs method`（本指南）→ `method sources`（原始来源）→ `method pilot`（实战步骤）→ `xeng task/assemble/playbook`（现有工具）。本方法**不能**绕过 11 阶段路由或再产生一套自定义 Gate。

## 3. Spec → Tickets → Skills → Harness → Loop 操作规程

### A. Demand / Discovery（借鉴 grill-with-docs）

- 写清：谁遇到什么问题、真实证据是什么、当前流程、成功指标、关键约束、业务负责人及数据/代码授权。
- 区分：已验证客户需求 / 未验证市场信号 / 招聘 JD 推断 / 个人学习题材。后二者标 `ENGINEERING_HYPOTHESIS`，不冒充客户验收。
- 只追问会阻断本张任务卡的事实；无法核实就保留 `UNKNOWN`，不自动扩大作用域。

### B. Spec / AC（借鉴 to-spec）

至少明确 Goal、Non-goals、数据/权限边界、主流程、负例、可运行验证与通过阈值。AC 要逐项写明 Given/When/Then；对于模型功能另列真实 Provider/数据集版本、指标与不可验证项。未经 Owner 授权不更改批准的 AC。

### C. Tracer Tickets（借鉴 to-tickets）

每张卡为**垂直切片**，而不是“先完成全部前端”之类的横向模块。记录 `ticket_id`、`base_sha`、`blocked_by`、AC 对应、文件边界、允许/禁止动作、风险、测试命令、预计证据、预算、停止条件、回滚、Review 责任。一次执行窗口只有一张 Active Ticket；前置依赖不满足不得进入实现。

### D. Skills 的明确边界

按真实任务挑选最少数量的 Workbench 自有候选 Skills：
`project-discovery → specification → implementation-plan → verification → code-review`，按需叠加 `architecture`、`systematic-debugging`、`documentation-sync`。

可研究 Matt Pocock 的 `grill-with-docs → to-spec → to-tickets → implement / tdd → code-review`，但**这些名称不能等同于本仓库的 8 个自有候选 Skills**。先查看 [固定版本来源](UPSTREAM-SOURCES.md)，验证许可证、实现方式、可用 Agent 和供应链风险；安装/执行第三方代码需明确授权。`skill-kit` 的安装回执仅证明受管文件存在，Agent 实际加载须独立探针证明。

### E. Harness Contract（必须在目标产品仓核对）

| 维度 | 最低要求 | 失败处理 |
|---|---|---|
| Freshness | target path、branch、exact HEAD、dirty 状态、最新项目规则 | HEAD 漂移重做基线 |
| Context | 只读 `README/AGENTS/CLAUDE`、当前 Spec/Ticket、相关模块/测试、接口契约 | 无法确定时 `UNKNOWN`，不索要整仓敏感文件 |
| Permissions | 允许读/写范围、禁止动作、外部写入审批、密钥/客户数据边界 | 越权立即停止，不能靠 Prompt 自我授权 |
| Sandbox | 独立分支/worktree，最小环境和数据，受控网络/工具 | 依赖/环境不可用则 `BLOCKED` |
| Verification | 项目真实 test/lint/typecheck、负例、集成探针；RAG/Agent 另需 eval/trace | Mock、静态扫描、CI 和消费者验收分层报告 |
| Observability | 失败输入、工具调用轨迹、耗时/成本、脱敏日志、前后对比 | 无复现或无反馈时禁止盲试 |
| Recovery | 最小可逆 diff、可观测回滚、冲突/数据迁移说明 | 发现不可逆影响先求审批 |

**Harness 合格条件**：至少存在一条可运行的反馈路径，而非只存在测试名称；高风险跨权限/支付/发布动作必须有实际阻断手段。不提供测试/执行授权时允许完成规划，但不得把规划标成“已开发验证”。

### F. Bounded Loop（借鉴 Ralph 的反馈思想，非无限循环）

```text
input: approved Ticket + frozen ACs + base SHA + permissions + iteration budget
if dependencies unresolved or permissions missing: STOP/BLOCKED
while budget remains:
  assert HEAD/scope/current task still valid
  reproduce one failing AC (or name why NOT_RUN)
  implement smallest authorized change
  run exact permitted checks; retain commands, exit codes and redacted outputs
  independent review in two axes: Spec (ACs) and Standards (quality/security)
  if all required acceptance checks evidenced: STOP -> REVIEW_READY
  if scope/authority/secret/safety/irreversible risk or budget exceeded: STOP -> BLOCKED
  if failure repeats without changed hypothesis or new evidence: STOP -> INVESTIGATE
  update hypothesis and evidence, consume one attempt; continue same Ticket
end -> STOP/BLOCKED; never auto-promote UNKNOWN to PASS
```

默认指导预算：**每个失败假设最多 2 次没有新证据的修复尝试**；它是建议性上限，不能代替项目负责人对任务、成本、时间预算的明确批准。每一步记录 `attempt`、`hypothesis`、`command`、`result`、`new_evidence`、`diff`、`remaining_budget`。无授权/密钥风险/明显重复失败/需求漂移均可提前 STOP。禁止默认启动无人监管、无限制的 Agent 循环。

### G. Product Demo / Review / Release

- 纵向演示 UI→API/鉴权→工具/RAG/Agent→存储/结果，记录视频/截图或真实测试回执（不得伪造）；覆盖空态、失败、超时、越权、重复操作、恢复。
- Spec 评审与 Standards 评审分别给结论。仅 `MAINLINE_BLOCKER` 阻断当前主线，但安全/权限问题不能被错误降级。
- `PR merged ≠ staging deployed ≠ production released ≠ consumer accepted`；受控发布需要版本身份、授权与回滚证据。
- 复盘优先改进测试、Gate、模板或上下文；**跨两个真实任务/项目重复有效**后再提出自有 Skill 晋级，不凭一次 Demo 认定 REUSABLE。

## 4. Agent/使用者快速入口

**学习原理**：[上游固定版本与许可证边界](UPSTREAM-SOURCES.md)；**动手实践**：[真实项目试点指南、模板与验收表](PROJECT-PILOT.md)。其他工程手册 [真项目 SOP](../PLAYBOOK.md)、[RAG/Agent Playbook](../PLAYBOOKS.md)、[Git 工作流](../GIT_WORKFLOW.md)、[治理对齐及未实现项](../CONTRACT_ALIGNMENT.md)。

```bash
node tools/xeng.mjs method
node tools/xeng.mjs method sources
node tools/xeng.mjs method pilot
node tools/xeng.mjs task feature --type=saas --tier=B
node tools/xeng.mjs assemble --target ../your-project --type saas --task feature --tier B --agent codex
node tools/xeng.mjs playbook agent
```

**注意**：`method` 只打印仓库中的本地文档；`assemble` 默认为 dry-run；以上命令不运行外部 Skill、不启动 Agent 自动开发。

## 5. 范式真实落地的证据门槛

- `METHOD_DOCUMENTED_AND_ROUTED`：本仓库有入口、映射、固定来源、示例及 CLI/测试。
- `HARNESS_READY_FOR_TARGET`：某个真实产品仓经过只读基线、上下文、执行权限、反馈命令/日志检查。
- `LOOP_EXECUTED_WITH_EVIDENCE`：至少一张已批准任务卡真实执行，失败/成功及停止规则有可复核回执。
- `PROJECT_DEMO_VERIFIED`：完整产品路径测试；Mock 和真实 Provider 证据分开。
- `CONSUMER_ACCEPTED` / `PRODUCTION_PROVEN`：必须另有消费者和生产证据；Workbench 的文档/CI 绝不自动提升此状态。

目前只声明第一层的**待 PR 合并文档与 CLI 集成**；后四层需在真实产品仓由当次证据逐级证明。独立 Harness/Loop Runner、自动的单任务锁、Scope Lock、跨项目知识晋级索引仍是明确缺口，不因为本文存在而宣称完成。
