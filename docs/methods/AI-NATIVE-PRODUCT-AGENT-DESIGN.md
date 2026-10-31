# AI 原生产品设计与 Agent 产品架构：从业务问题到可演示产品

**分类：ADVISORY_METHOD / NOT_REAL_PROJECT_VERIFIED**。本文件是 [Spec–Skills–Harness–Loop 总范式](AI-NATIVE-SPEC-HARNESS-SKILLS-LOOP.md) 的产品与智能体设计层，不新增第二套生命周期或独立 Gate，不代表招聘方的官方授课方法。实际交付仍按 [Workbench 11 阶段与四路线](../PLAYBOOK.md)、目标项目规则和 [Agent Profile Playbook](../PLAYBOOKS.md)。

## 1. AI-native ≠ 在传统页面加一个聊天框

AI-native 产品设计从**用户任务和可验证业务结果**出发，选择确定性软件与概率性模型各自负责的部分。先证明有需求，再证明 Agent 比固定流程合适，再投入模型与工具的成本。AI 快速编码不能替代需求真实性、用户体验、数据授权和可靠性工程。

```text
Opportunity evidence → 用户/场景/Job-to-be-Done → Value metric
  → 用户旅程和失败旅程 → AI suitability decision
  → MVP / non-goals / risk-tier → Prototype / Demo → Spec + AC
  → Tracer Ticket → Harness → Bounded Loop → 用户可观察结果
  → 真实访谈/试用/付费信号 → 继续 / 缩小 / 停止
```

### 需求调查与机会判断（Discovery）

| 问题 | 必须生成的项目资产 | 证据原则 |
|---|---|---|
| 谁是用户？ | Persona / Job / 使用频率、环境与权限 | 与用户访谈、流程记录区分；JD 推断标 `HYPOTHESIS` |
| 具体困难？ | 现行任务旅程、时间/出错/成本基线、失败场景 | 没有基线就不得声称提效 |
| 为什么用 AI？ | 决策表：规则、搜索、RAG、Workflow、单 Agent、多 Agent | 选择简单方案作为 baseline |
| 怎样算有效？ | 可观察的 North-Star + 成功率/耗时/正确性/成本/转化指标 | 定义测量口径、样本和对照组 |
| 不能失败什么？ | 隐私、权限、支付、不可逆写入、模型幻觉、回滚方案 | 安全负例列为 AC |
| MVP 的最小闭环？ | 1 页 PRD-Lite / Spec、用户故事、原型、首张纵切 Ticket | “能点击”不等于真实闭环 |

**设计模板（填入目标项目）**：

```yaml
product_brief_version: 1
demand_source: ENGINEERING_HYPOTHESIS  # 或带来源的真实客户需求
owner: PENDING
persona_and_job: UNKNOWN
user_situation: UNKNOWN
baseline_metric: UNKNOWN
success_metric: UNKNOWN
smallest_user_value: UNKNOWN
model_needed_because: UNKNOWN
simpler_non_ai_alternative: UNKNOWN
data_source_rights: UNKNOWN
security_privacy_failure_cases: []
mvp_in_scope: []
non_goals: []
ui_entrypoint: UNKNOWN
journey_happy_path: []
journey_failure_path: []
acceptance_criteria: []
experiment: {sample: UNKNOWN, method: UNKNOWN, threshold: UNKNOWN}
decision: NOT_READY  # VALIDATE / BUILD_SMALL_SLICE / STOP / NOT_READY
```

### 产品原型与 Demo 的可靠闭环

1. 以任务为中心画**一条主旅程、一条错误旅程**，标记登录、输入、状态反馈、结果可引用性、恢复/人工接管。
2. 设计可见反馈：处理中、重试、证据来源、信心/未知限制、工具执行的审批状态，禁止将模型“正在做”显示为已生效。
3. 先做可演示的 UI/API 纵向切片；模型不可用可以用可声明的 Mock 验证交互，但**不能**把 Mock 当真实 AI 能力。
4. 用 [PROJECT-PILOT](PROJECT-PILOT.md) 建立一套带可测 AC 的 Spec/Tickets；在真实项目仓的 CI、操作记录与消费者访谈中验证。
5. 商业验证另设假设：用户愿意用、愿意付费、交付成本有余量；路演评分不等于用户付费或企业录用。

## 2. Agent 产品设计决策树

**按下面的升级顺序选择，而不是先建多 Agent。**

| 任务形态 | 优先方案 | 升级为 Agent 的必要证据 |
|---|---|---|
| 固定字段/业务判断 | 规则 + 普通服务接口 | 无；确定性更可靠 |
| 查知识、带引用答疑 | RAG + 显式检索/拒答 | 多步动态执行可证明提升任务成功率 |
| 有限定分支流程 | 固定 Workflow / 状态机 | 分支无法事先穷举且模型决策可评测 |
| 需要模型选择工具、规划多步操作 | 单 Agent + 显式 Tool Contract | 同等 Eval 集成功率、成本与安全负例成立 |
| 多角色分工/独立权限/复杂协作 | 多 Agent / Supervisor / Handoff | 对单 Agent 的可复验增益高于延迟/成本/复杂度 |

**Agent 绝对不能代替业务系统拥有事实源、最终权限审批、金融交易记录或不可逆副作用控制。** 外部工具返回值、检索文本、网页内容均为不可信输入。Model/Prompt 中写“不要越权”不是安全边界。

### Agent Architecture Card（按业务场景填写，不是自动生成系统）

```yaml
agent_architecture_version: 1
job_and_owner: UNKNOWN
route: workflow-first   # workflow-first / single-agent / multi-agent (needs measured justification)
model_role: interpret-and-propose
system_of_record: UNKNOWN
tools:
  - name: search_knowledge
    purpose: read-only-authorized-retrieval
    input_schema: UNKNOWN
    output_schema: UNKNOWN
    auth_scope: UNKNOWN
    timeout: UNKNOWN
    retry_idempotency: UNKNOWN
state:
  run_id: UNKNOWN
  thread_id: UNKNOWN
  checkpoint_store: UNKNOWN
  recovery_rule: UNKNOWN
safety:
  denied_actions: [unauthorized-read, unapproved-external-write, leak-secret]
  prompt_injection_test: NOT_RUN
  approval_thresholds: UNKNOWN
  human_in_loop: UNKNOWN
  side_effect_idempotency: UNKNOWN
evaluation:
  dataset_version: UNKNOWN
  task_success: UNKNOWN
  tool_selection_precision: UNKNOWN
  unauthorized_action_rate: UNKNOWN
  grounding_support: UNKNOWN
  p95_latency: UNKNOWN
  cost_per_completed_task: UNKNOWN
  failure_recovery: UNKNOWN
release_gate: HUMAN_AND_REAL_EVIDENCE_REQUIRED
```

### 架构应该回答的 10 个问题

1. **用户目标**：什么是工具调用成功、用户任务成功、人工接管成功？三者不同。
2. **工具 Schema**：输入、输出、幂等键、超时/重试、认证授权、失败码、速率/成本限制。
3. **状态与恢复**：状态机、Checkpoint、重入、去重、失败回滚；不能宣称 exactly-once。
4. **路由**：规则优先与模型路由的决策日志；复杂度增加需对照 baseline。
5. **知识工具**：授权检索、引用与拒答、文档生效期、用户跨租户隔离。
6. **审批**：只读优先；写操作需服务端政策与人类授权；审批过期/并发/撤权要有负例。
7. **安全**：Prompt Injection、工具响应污染、越权、PII/secret 泄露、外部写入。
8. **评测**：真实数据授权；任务、工具、路径、结果、恢复、拒答分别评估；Mock/离线/线上分层。
9. **运维**：Trace、P50/P95/P99、成本、失败率、fallback、灰度、开关、回滚。
10. **人类体验**：关键行动可解释、可撤销、可接管；证据不足时展示 UNKNOWN 而非完成。

## 3. 产品+Agent 的 Spec/AC 示例（合成）

**场景**：客户输入订单编号查询状态，系统经授权只读 Tool 返回带来源的状态。订单更改只能走独立审批流程。

| AC | 场景 | 必需证据 |
|---|---|---|
| AG-01 | 已登录且订单归属本人，查询订单状态 | Tool 的真实响应/模拟层标注、授权路径、UI 回执 |
| AG-02 | 查询他人订单 | 服务端拒绝，无 Tool 返回泄露；权限负例 |
| AG-03 | 工具超时、503 或无此订单 | 用户看到可恢复错误/UNKNOWN，而不是猜测成功 |
| AG-04 | 发送“绕过权限/忽略指令”的不可信订单文本 | 不能升级权限、调用未批准工具或泄露密钥 |
| AG-05 | 用户要求退款/改地址 | 不得直接写；需另行明确授权与审批/幂等链 |
| AG-06 | 两次相同只读问询 | 可评测响应正确、成本与时延；不凭模型自评宣称成功 |

每个 AC 都需给出数据集版本、实际测试命令/调用记录、执行环境和状态 `NOT_RUN / FAIL / BLOCKED / VERIFIED`。没有消费者验收时 `CONSUMER_ACCEPTED` 不可标记。

## 4. 单人限时灯塔路演：评审与学习（非招聘官方考核）

招聘描述涉及每日路演、工程实操、产品文档、学习力等。这里提供**可选、非权威**的自我演示练习，避免把企业选拔规则误写为 Workbench 的公共标准：

- **5 分钟陈述**：用户问题、非 AI baseline、为什么使用 AI、已完成纵切片和非目标。
- **5 分钟 Demo**：主旅程 + 权限/失败负例，明确哪些是 Mock、哪些是真实 Provider。
- **5 分钟工程答辩**：Spec、Ticket、Harness、Loop 证据、Git diff、测试回执、权限与成本。
- **5 分钟复盘**：问题、下一次可证伪假设、未通过的 Gate、取消/缩减的功能。

候选人可按自己需要用“可用性、证据可信度、工程质量、表达清晰度”自评；**不要捏造企业真实评分权重、淘汰门槛或 Offer 资格**。

## 5. 关联到唯一工程体系

- [从需求到代码的主范式](AI-NATIVE-SPEC-HARNESS-SKILLS-LOOP.md)：Spec → Skills → Harness → Bounded Loop。
- [Skill Engineering & Code Expert Skill Factory](SKILL-ENGINEERING-FACTORY.md)：从失败模式/复用规律到 Skill 设计、测试、晋级。
- [项目纵切实战](PROJECT-PILOT.md)：单任务试点。
- [Agent Profile 真实架构指南](../PLAYBOOKS.md) / `src/playbooks.mjs`：Tool/State/HITL/Checkpoints / Eval 的详细工程手册。

本文件的出现不构成真实 Demo 或用户试用；真实资产归产品仓。
