# Vibe Coding 项目导航与跨会话恢复：Intent → Spec → Ticket → Evidence → NOW

> **定位：ADVISORY_METHOD / NOT_REAL_PROJECT_VERIFIED**。解决“写着写着忘了目标、不知道下一步干什么”的日常使用问题，沿用本仓 [11 阶段唯一权威生命周期](../ARCHITECTURE.md)、[Spec–Skills–Harness–Loop](AI-NATIVE-SPEC-HARNESS-SKILLS-LOOP.md) 与 [真实项目试点 SOP](PROJECT-PILOT.md)。这不是新的生命周期、状态机、自动 Runner 或授权系统。请仅把以下模板用于**经授权的目标产品仓**，不要把真实客户数据或凭据放入公开 Workbench。

## 1. 一句话原则

**每轮开发只批准一张能推进当前版本目标、且能以证据验收的 Ticket。结束前恢复“做成什么、做到哪里、下一步唯一任务”。**

代码量、PR 数量、测试数量不等于用户价值。Skill 告诉 Agent 怎样做；Spec 规定做成什么；Harness 限定怎样安全地做；NOW 只是对现有事实的导航快照。

## 2. 三种尺度，不产生新的权威状态

| 尺度 | 现有权威或建议载体 | 必须回答 | 谁决定 |
|---|---|---|---|
| 产品/版本 | 已生成的 `*-intent.md`；目标产品仓已批准的 PRD/版本目标 | 谁需要？为什么值得？这一版的最小闭环、Non-goals、退出条件是什么？ | 人类 Owner |
| 功能/任务 | Spec、AC、Tracer Tickets、GitHub Issues；目标仓本地规则 | 当前任务是否直接推进版本目标？可观察 AC、负例、依赖、预算是什么？ | 人类批准；Agent 负责拟议与执行 |
| 会话/恢复 | 目标产品仓的 `NOW.md`（**派生快照，可选文件名**） | 哪个分支/SHA？哪些 AC 真正通过？当前阻塞？下一步唯一任务？ | Agent 根据仓库事实整理，人类复核 |

不得把 Workbench 自己的 `docs/ROADMAP.md` 当作目标产品仓的版本 Roadmap。目标项目如果已经有 `STATUS.md`、`CURRENT.md`、Issue Board 或其他等效快照，**复用原文件**，不再创建 `NOW.md`。

优先级：目标仓权限/安全指令与真实 Git、测试、平台回执 > 目标仓已批准 Intent/Spec/Issue > NOW 快照 > 此方法建议。发生冲突时停止并报告，不能静默覆盖前者。

## 3. 先定“停止开发”的条件，再开始实现

当前版本的 Intent 应明确：

1. **目标用户与触发场景**：真实反馈、二手材料和工程假设分别标注来源。
2. **一个最小完整用户旅程**：输入 → UI/API/业务/数据（如适用）→ 用户可观察输出；至少一条失败/恢复路径。
3. **可观察成功标准**：样本、测量方法、验收者和目标值；未知填 `UNKNOWN`，不捏造指标。
4. **Non-goals**：这一版故意不做什么；避免因发现可优化项就扩展架构。
5. **决策时点**：什么条件下演示/试用/发布，什么条件下缩小范围、转向或停止；发布仍需现有权限 Gate。

没有用户证据的实验性 MVP 可以继续，但须写为 `ENGINEERING_HYPOTHESIS`，并设计最便宜的反证动作；不能把功能交付替代用户价值验证。

## 4. 每次打开 Claude Code / Codex 的 5 分钟流程

1. **恢复**（默认只读）：阅读目标仓 `AGENTS.md`/`CLAUDE.md`、已批准 Intent、当前 Spec/Issue、上次 NOW，再核实 `git status`、HEAD、相关测试和可访问回执。
2. **对齐**：回答“这一版做成什么、当前任务推进哪条 AC、为什么现在做它？”；若说不清，停在 `HUMAN_REQUIRED/BLOCKED`（已有证据状态和原因字段），不得自动改需求。
3. **锁定一个任务**：列出 `ticket_id`、`spec_id`、允许文件、依赖、预算、测试命令与负例；Agent **不自行**启动下一张 Ticket。
4. **受控执行**：遵循 [PROJECT-PILOT](PROJECT-PILOT.md) 的 `PREPARE → REPRODUCE → IMPLEMENT → VERIFY → REVIEW → RECORD`；只在实际权限范围内运行，记录命令/环境/精确 SHA/结果。
5. **恢复快照**：用真实证据更新 NOW 的完成项、未验收项、阻塞原因与唯一下一步；一次会话结束时停止。

### 处理中发现了别的问题？

| 发现 | 处理 | 不允许 |
|---|---|---|
| 当前 AC 必须修复的 Bug、安全/数据阻断 | 在当前 Ticket 范围和授权预算内修复；越权就 STOP | 用“顺手优化”为名改整套架构 |
| 影响未来版本的新功能/体验建议 | 记录 Backlog，标明来源、价值假设与必要证据，等 Owner 排序 | 发现即开发 |
| 与当前 Intent 相冲突的商业或产品需求 | 提出变更请求：旧目标、提议目标、代价/风险、需要的决策 | AI 私自重写 Intent 并继续编码 |
| 现有质量问题但不阻断本轮 AC | 标记 NON_BLOCKING，进入后续风险排序 | 自动派生无穷整改票 |
| 当前 Ticket 被依赖、权限、真实环境阻断 | 标 `BLOCKED`，给出恢复动作及需要的批准者 | 用 Mock、测试绿或 README 冒充验收 |

## 5. 目标产品仓的 NOW.md 模板（人工审查后复制）

```markdown
# NOW — 当前项目快照（派生，不是新的事实源）

updated_at: UNKNOWN
owner: UNKNOWN
target_repository: UNKNOWN
branch: UNKNOWN
head_sha: UNKNOWN
dirty_worktree: UNKNOWN
snapshot_state: UNVERIFIED

## 北极星与版本目标
- Intent：<链接至目标仓已批准的 intent / PRD>
- 用户与当前主要问题：UNKNOWN
- 当前版本/里程碑：UNKNOWN
- 最小可演示业务闭环：UNKNOWN
- 本期完成标准 / 对应 AC：UNKNOWN
- 本期 Non-goals：UNKNOWN
- 价值验证动作：UNKNOWN

## 当前唯一执行任务
- Ticket/Issue：UNKNOWN
- Spec/AC：UNKNOWN
- 为什么优先执行它：UNKNOWN
- 前置依赖与允许范围：UNKNOWN
- 批准状态：NOT_APPROVED
- 剩余时间/重试/外部成本预算：UNKNOWN

## 最近真实证据（按完成/未验证/阻塞分类）
| AC / 用户路径 | 状态 | 环境、命令或回执 | 精确 SHA | 备注 |
|---|---|---|---|---|
| UNKNOWN | NOT_RUN | NOT_RUN | UNKNOWN | 未实测不得写 PASS |

## 未解决问题与决策
- 阻塞（Owner/恢复动作）：UNKNOWN
- 新需求 Backlog（不擅自执行）：NONE_RECORDED
- 待人类批准的范围变更：NONE_RECORDED

## 下一步唯一行动
- 行动：先核实当前 Ticket 的事实和权限
- 预期产物：一项可验证的 AC 或明确阻塞
- Stop 条件：范围漂移 / 权限不明 / 无新证据 / 预算耗尽
```

本模板默认 **NOT_RUN / UNKNOWN**；项目自有的状态系统仍然权威。NOW 只能引用实际回执，不能写“全部完成”“上线成功”而无证据。敏感数据与凭据禁止记录。

## 6. 可复制的三段 Agent 提示词

### A. 项目迷路时：只读恢复（不能写代码）

```text
请担任当前项目的交付导航员。先读取本仓 AGENTS/CLAUDE、已批准 Intent、
当前 Spec/AC、Issue、上次 NOW，并核对实际 Git HEAD/dirty、CI 与测试回执。
只读分析，禁止改代码、改状态、安装工具、推送或部署。
按 FACT / HYPOTHESIS / UNKNOWN 分类：
1. 版本目标是什么，谁批准，完成证据要求是什么？
2. 最近真正完成了哪些 AC，哪些只有实现或文档、尚未验证？
3. 现在唯一应做的 Ticket 是什么，为什么推进该版本目标？
4. 有哪些新增需求属于 Backlog，而不是当前执行范围？
5. 如文档与实际仓库冲突，指出冲突并停止在待决策。
输出一份 NOW 更新草案；没有授权前不要写入。
```

### B. 开发前：锁定一个纵向 Ticket

```text
仅处理 Owner 已批准的当前 Ticket。请先复述：
Intent 版本目标、Spec/AC、依赖、允许文件、禁止动作、预算、失败负例、
验证命令及停止条件。若任务不能映射至本期 AC，停止并提交范围变更建议。
授权后按最小 diff → 针对性验证 → 双轴 Review → 证据记录执行。
不得自主开始下一票、重构无关模块，或自动 merge/deploy。
```

### C. 会话结束：交接与复盘

```text
停止新增功能。根据实际 Git 状态、Issue 与已执行测试，准备 NOW 更新：
本次修改文件、当前 HEAD/dirty、逐 AC 证据（命令/环境/SHA/结果）、
未测项、阻塞、剩余预算、Backlog 以及下一步唯一行动。
不得把 NOT_RUN/UNKNOWN/Mock/绿灯 CI 升级为真实客户验收。
若当前里程碑已达到可演示条件，建议转入演示/试用/审批，而不是自动增功能。
先展示改动草案；按目标仓授权规则决定是否写入、提交与推送。
```

## 7. 示例：100 种职业平台的一次正确闭环（仅假设）

- **Intent**：使用有来源的公开岗位 JD，产出可编辑的岗位工作流与教程；真实需求价值仍待访谈。
- **MVP 最小闭环**：导入一个 JD → 结构化职责 → 人工纠错/标注事实与推断 → 导出一份教程。
- **Ticket 1**：导入并保存 JD，含非法输入和失败反馈；Ticket 2：解析职责并允许人工修订；Ticket 3：导出结果及端到端验收。
- **Backlog，不进入 MVP**：企业 SSO、计费、复杂多 Agent、覆盖 100 岗位的全自动数据流水线。
- **完成与下一步**：已有样本和真实端到端回执时，转用户试用，记录“是否真的节省工作量”和失败场景。没有数据就标 `UNKNOWN`，不要为凑功能继续扩张。

## 8. Workbench 与真实产品仓的边界

Workbench 负责**候选方法、模板、只读路线建议与草案生成**，不读取目标产品的私有数据，不执行目标项目开发，也不宣称真实用户验收。本文件中的 NOW 必须由目标仓的执行层在 Owner 授权后维护。现有工作区输出仍是 `DRAFT_NOT_EXECUTED`；现有 Harness Contract 的文件锁、命令白名单等运行时强制能力**尚未完全实现**。

每次接近里程碑时，人类 Owner 只做三个决策：**继续（有证据） / 调整（先更新 Intent/Spec/AC） / 停止（成本、风险或价值不成立）**。这是人工业务决策，不是新增工程状态枚举。

关联：[方法视图](../METHOD.md) · [日常 SOP](../PLAYBOOK.md) · [灯塔试点](PROJECT-PILOT.md) · [AI 产品设计与价值指标](AI-NATIVE-PRODUCT-AGENT-DESIGN.md)。
