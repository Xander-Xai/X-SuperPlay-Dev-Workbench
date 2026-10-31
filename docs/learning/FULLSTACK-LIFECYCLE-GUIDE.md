# 完整开发生命周期知识指南（18 活动 × 11 权威阶段）

> 权威生命周期：`src/catalog.mjs` 的 11 阶段。兼容视图：`src/delivery.mjs` 的 8 宏阶段与 18 活动。本文不建立第二套状态机。

## 总览

| 宏阶段 | 活动 | 权威阶段 |
|---|---|---|
| G0 机会与项目接入 | A01 需求发现、A02 用户研究与价值判断 | intake, discovery |
| G1 产品定义 | A03 AI-native 产品设计、A04 PRD/Spec/AC、A05 UI/UX 与交互设计 | specification |
| G2 工程设计 | A06 技术架构及 ADR、A07 数据库/API/认证权限 | architecture |
| G3 Tickets 与执行环境 | A08 纵向 Tracer Tickets、A09 Harness 与 Agent 执行环境 | planning |
| G4 纵向实现 | A10 前后端完整功能实现、A11 TDD/集成/契约测试 | implementation |
| G5 工程验证 | A12 浏览器 E2E 与 UX QA、A13 故障诊断与根因分析、A14 独立双轴代码审查、A15 安全/隐私/权限审计 | verification, review |
| G6 发布交付 | A16 CI/CD 与发布 | release |
| G7 运营复盘 | A17 监控/恢复/运营、A18 文档/交接/复盘 | operation, postmortem |

> 活动可映射多个权威阶段，但**不产生新的状态源**。每项活动只有一个主用 Skill（见 [STAGE-TO-SKILL-MATRIX.md](STAGE-TO-SKILL-MATRIX.md)）。

## 如何阅读每一节

每节固定回答 15 个问题：意义、为什么必须、基础知识、原理 vs 操作、进入前输入、对应 Skill、Skill 前准备、如何向 Agent 提任务、Skill 产出、不能交给 Agent 的决定、如何验收、出错用哪个 Debug Skill、常见错误、通过后进入、可跳过条件与代价。提示词正文见 [AGENT-PROMPT-RECIPES.md](AGENT-PROMPT-RECIPES.md)。

---

## A01 · 需求发现

- **阶段意义**：确认问题来源、真实用户、授权边界、现有系统基线与停止条件。
- **为什么必须**：在错误问题、无授权或错误假设上投入，是最昂贵的返工来源。
- **基础知识**：问题陈述、用户工作流、仓库/系统现状、Tier 与预算、合规边界。
- **必须理解原理**：价值判断、授权与风险；**熟悉操作**：`git`、只读探测、文档阅读。
- **进入前输入**：原始需求、项目类型与 Tier、现有仓库状态、授权范围。
- **对应 Skill**：本地 `project-discovery`（CANDIDATE）；外部 `grill-with-docs`（mattpocock/skills，MIT，REFERENCE_PINNED）。
- **Skill 前准备**：只读权限、目标仓库路径、项目本地 `AGENTS.md`/`CLAUDE.md`、最便宜的可运行命令。
- **如何提任务**：让 Agent 先只读核查，报告事实与 UNKNOWN，不写代码。见提示词 A01。
- **Skill 产出**：`project-brief.md`、`baseline.json`、`risk-summary.md`。
- **不能交给 Agent 自动决定**：是否启动、真实用户是谁、授权范围、可接受风险。
- **如何验收**：需求来源可核验；每个假设有验证动作；无法核实项标 `UNKNOWN`。
- **出错用哪个 Debug Skill**：基线命令失败 → 本地 `systematic-debugging` / 外部 superpowers `systematic-debugging`。
- **常见错误**：把 JD/面经当已签客户；跳过只读基线；把 README 当事实；无授权就动手。
- **通过后进入**：A02 用户研究，或直接 A04 Spec（小任务）。
- **可跳过？代价**：所有路线起点，不可跳过。跳过代价是方向错误与越权。

## A02 · 用户研究与价值判断

- **阶段意义**：用真实证据判断“是否值得继续投入”，而不是只凭愿望。
- **为什么必须**：没有真实用户证据的功能，通常是团队内部假设。
- **基础知识**：访谈与观察、价值假设、反证实验、采购/合规约束。
- **必须理解原理**：证据强度与反证；**熟悉操作**：访谈记录、证据台账。
- **进入前输入**：访谈记录或真实反馈、竞品、可观察指标。
- **对应 Skill**：本地 `project-discovery`；外部 `grill-with-docs`、`grilling`（mattpocock，MIT）。
- **Skill 前准备**：明确哪些是真实客户、哪些是二手摘要；准备可证伪假设。
- **如何提任务**：要求 Agent 整理证据与矛盾，提出最便宜的反证实验。见提示词 A02。
- **Skill 产出**：`value-hypothesis.md`、`evidence-ledger.md`。
- **不能交给 Agent 自动决定**：是否继续投入、目标用户优先级、价值证据是否成立。
- **如何验收**：价值假设有真实证据或明确反证计划；二手来源标 `ENGINEERING_HYPOTHESIS`。
- **出错用哪个 Debug Skill**：证据冲突 → `systematic-debugging`（区分事实与推断）。
- **常见错误**：把愿望当事实；只收集支持性证据；忽略采购/合规否决项。
- **通过后进入**：A03 产品设计或 A04 Spec。
- **可跳过？代价**：Tier D 可最小化，但不得把假设写成已验收。代价是做出无人需要的功能。

## A03 · AI-native 产品设计

- **阶段意义**：决定 AI 是否必要、如何与用户协作、失败与人工接管路径。
- **为什么必须**：AI 能力有不确定性与成本；没有降级路径的 AI 功能会放大错误。
- **基础知识**：模型边界、HITL、成本/延迟/隐私、评测意识。
- **必须理解原理**：AI 失败模式与评测；**熟悉操作**：提示词/模型配置外置。
- **进入前输入**：价值假设、AI Profile 选择、数据与模型约束。
- **对应 Skill**：本地 `specification`、`architecture`；外部无专用“AI 产品设计 Skill”，以本仓 `docs/methods/AI-NATIVE-PRODUCT-AGENT-DESIGN.md` 与三份 Playbook 为准。
- **Skill 前准备**：明确数据授权、模型版本、不可接受的自动化程度。
- **如何提任务**：要求 Agent 给出 AI-native UX、降级路径与评测计划。见提示词 A03。
- **Skill 产出**：`ai-product-design.md`、`eval-plan.md`。
- **不能交给 Agent 自动决定**：AI 是否必要、HITL 边界、隐私与合规取舍。
- **如何验收**：有输入/输出/失败/人工接管路径；有评测计划；AI 不绕过平台权限 Gate。
- **出错用哪个 Debug Skill**：评测异常 → `systematic-debugging`；数据问题 → `verification`。
- **常见错误**：把模型输出当可信输入；无降级；提示词含密钥；无评测就上线。
- **通过后进入**：A04 Spec。
- **可跳过？代价**：非 AI 项目可跳过。AI 项目跳过会留下不可评测的行为。

## A04 · PRD、Spec 与验收标准

- **阶段意义**：把模糊需求变成可观察、可验证的 AC 与负例。
- **为什么必须**：没有可验证 AC，就无法判断“完成”，也无法审查。
- **基础知识**：Given/When/Then、非目标、负例、验证方法。
- **必须理解原理**：可验证性；**熟悉操作**：Spec 模板。
- **进入前输入**：需求发现结论、业务方确认、扩展义务（AI/支付）。
- **对应 Skill**：本地 `specification`；外部 `to-spec`（mattpocock，MIT）。
- **Skill 前准备**：明确范围与非目标；确认业务方能否签字。
- **如何提任务**：要求 Agent 写 Goal/Non-goals/AC/负例/验证方法，标出待确认项。见提示词 A04。
- **Skill 产出**：`spec.md`、`acceptance-criteria.md`。
- **不能交给 Agent 自动决定**：AC 是否可接受、范围变更、业务负例。
- **如何验收**：每条 AC 可观察、可验证并命名验证方法；负例齐全。
- **出错用哪个 Debug Skill**：AC 不可验证 → 回到 `specification` 重写，不是调试。
- **常见错误**：AC 写成实现细节；缺负例；业务方未确认就进入实现。
- **通过后进入**：A05 UI/UX 或 A06 架构。
- **可跳过？代价**：Tier C/D 可裁剪，但必须记录理由。跳过代价是范围蔓延与验收争议。

## A05 · UI/UX 与交互设计

- **阶段意义**：把 AC 变成可检查的页面、状态与交互。
- **为什么必须**：用户看到的是界面；空态、错误态、移动宽度常被忽略。
- **基础知识**：信息架构、可访问性、状态设计（空/错/加载）。
- **必须理解原理**：交互与可访问性；**熟悉操作**：截图、浏览器检查。
- **进入前输入**：Spec/AC、品牌约束、目标设备与浏览器。
- **对应 Skill**：本地 `specification`、`architecture`；外部 `frontend-design`（anthropics/skills，Apache-2.0）、`web-design-guidelines`（vercel-labs，LICENSE_UNVERIFIED）；React Native 可用 `expo-design-system`（expo/skills，MIT）。
- **Skill 前准备**：确认设计系统与组件库；准备目标宽度（如 390px）。
- **如何提任务**：要求 Agent 先列状态清单，再实现可运行原型并截图。见提示词 A05。
- **Skill 产出**：`ui-states.md`、`screenshots/`。
- **不能交给 Agent 自动决定**：视觉方向、关键交互取舍、可访问性底线。
- **如何验收**：主路径/空态/错误态/加载态/移动宽度均可检查；截图真实存在。
- **出错用哪个 Debug Skill**：布局异常 → `webapp-testing`（anthropics，Apache-2.0）+ `systematic-debugging`。
- **常见错误**：只读代码判断布局；只测桌面宽度；忽略控制台错误。
- **通过后进入**：A06 架构。
- **可跳过？代价**：纯 API/CLI 项目可跳过。跳过代价是可用性与验收返工。

## A06 · 技术架构及 ADR

- **阶段意义**：确定边界、依赖方向、失败模式与可逆性，并记录取舍。
- **为什么必须**：不可逆决策越晚发现，代价越高。
- **基础知识**：系统边界、依赖方向、失败模式、ADR。
- **必须理解原理**：可逆性与失效条件；**熟悉操作**：ADR 模板、依赖图。
- **进入前输入**：Spec/AC、现有架构、非功能约束。
- **对应 Skill**：本地 `architecture`；外部 `codebase-design`、`domain-modeling`（mattpocock，MIT）。
- **Skill 前准备**：明确至少两个真实选项；准备现有 ADR 与依赖清单。
- **如何提任务**：要求 Agent 列选项、后果、falsifier 与回滚边界。见提示词 A06。
- **Skill 产出**：`adr/NNNN-*.md`、`api-contract.yaml`、`dependency-graph.md`。
- **不能交给 Agent 自动决定**：关键选型、不可逆决策、失效条件。
- **如何验收**：至少两个真实选项；有后果与 falsifier；安全/失败/回滚边界明确。
- **出错用哪个 Debug Skill**：架构假设被证伪 → `systematic-debugging` + 新 ADR。
- **常见错误**：单选项决策；无失效条件；忽略运维与安全义务。
- **通过后进入**：A07 数据/API/权限。
- **可跳过？代价**：Tier C/D 可裁剪；Tier A 不允许。跳过代价是后期大改。

## A07 · 数据库、API 与认证权限

- **阶段意义**：把数据模型、接口契约与授权边界落到可验证的实现约束。
- **为什么必须**：数据与权限错误是最高危、最难回滚的缺陷。
- **基础知识**：schema/迁移、认证与授权、幂等、租户隔离。
- **必须理解原理**：授权与数据边界；**熟悉操作**：迁移工具、OpenAPI。
- **进入前输入**：架构决策、权限矩阵、数据保留/合规要求。
- **对应 Skill**：本地 `architecture`、`code-review`；外部 `supabase`、`supabase-postgres-best-practices`（supabase/agent-skills，MIT）。
- **Skill 前准备**：确认迁移升降级路径、数据脱敏、权限模型。
- **如何提任务**：要求 Agent 起草 schema/迁移/API 与越权负例。见提示词 A07。
- **Skill 产出**：`schema.sql`、`migrations/`、`api-contract.yaml`、`authz-matrix.md`。
- **不能交给 Agent 自动决定**：数据归属、角色与数据域、迁移窗口。
- **如何验收**：服务端强制授权；迁移含升降级；重复请求幂等；越权负例通过。
- **出错用哪个 Debug Skill**：越权/数据异常 → `systematic-debugging`；契约漂移 → `verification`。
- **常见错误**：前端隐藏替代服务端校验；无迁移回滚；生产数据未脱敏。
- **通过后进入**：A08 Tickets。
- **可跳过？代价**：无数据/无认证项目可裁剪。跳过代价是安全与数据事故。

## A08 · 纵向 Tracer Tickets

- **阶段意义**：把 Spec 拆成可独立交付、可独立验证的纵向切片。
- **为什么必须**：横向切片（先做完所有 UI）无法尽早验证风险。
- **基础知识**：纵向切片、依赖排序、验证命令。
- **必须理解原理**：风险优先排序；**熟悉操作**：Ticket 模板。
- **进入前输入**：Spec/架构、现有测试/CI、Agent 能力与预算。
- **对应 Skill**：本地 `implementation-plan`；外部 `to-tickets`（mattpocock，MIT）、`writing-plans`（superpowers，MIT）。
- **Skill 前准备**：确认首张 Ticket 能由新会话独立执行；准备真实测试命令。
- **如何提任务**：要求 Agent 输出依赖图、blocked_by、每卡验证命令与预算。见提示词 A08。
- **Skill 产出**：`tickets.json`、`plans/*.md`。
- **不能交给 Agent 自动决定**：切片优先级、风险接受、预算上限。
- **如何验收**：首卡可独立执行；依赖无环；每卡有真实验证命令。
- **出错用哪个 Debug Skill**：切片无法验证 → `implementation-plan` 重切；依赖成环 → `systematic-debugging`。
- **常见错误**：横向切片；无验证命令；依赖不清。
- **通过后进入**：A09 Harness 或 A10 实现。
- **可跳过？代价**：单文件小改可合并为一张卡。跳过代价是失控的大 diff。

## A09 · Harness 与 Agent 执行环境

- **阶段意义**：给 Agent 最小上下文、受限工具、真实反馈与停止规则。
- **为什么必须**：没有 Harness，Agent 会在错误上下文与无限重试中放大错误。
- **基础知识**：上下文工程、工具权限、测试/lint/type 反馈、预算。
- **必须理解原理**：权限与停止规则；**熟悉操作**：配置测试命令与写范围。
- **进入前输入**：Ticket 契约、项目本地规则、真实测试/lint 命令。
- **对应 Skill**：本地 `implementation-plan`、`systematic-debugging`；外部无专用 Harness Skill，参考 OpenAI Harness 文章（无 Git SHA）。
- **Skill 前准备**：明确 `allowed_files`、`allowed_commands`、`forbidden_actions`、预算。
- **如何提任务**：要求 Agent 先报告已读事实与可用命令，再执行单卡。见提示词 A09。
- **Skill 产出**：`harness-contract.md`、`allowed-commands.txt`。
- **不能交给 Agent 自动决定**：允许命令与文件范围、外部成本预算、升级条件。
- **如何验收**：上下文最小、写范围明确、反馈可运行、停止规则清晰。
- **出错用哪个 Debug Skill**：反馈不可靠 → `systematic-debugging`。
- **常见错误**：注入生产密钥；授予提升权限；无停止规则；无限循环。
- **通过后进入**：A10 实现。
- **可跳过？代价**：纯人工开发可跳过。跳过代价是 Agent 越权与成本失控。

## A10 · 前后端完整功能实现

- **阶段意义**：以最小可运行增量实现单张 Ticket，并维护测试契约。
- **为什么必须**：实现是交付核心；但必须受 Ticket 与 Harness 约束。
- **基础知识**：最小变更、测试先行、可运行增量。
- **必须理解原理**：最小 diff 与可回滚；**熟悉操作**：框架与测试命令。
- **进入前输入**：Tracer Ticket、项目本地规则、已批准权限。
- **对应 Skill**：本地无 `implement`/`tdd` Skill；主用 `implementation-plan` 作为过程约束，外部 `implement`、`implement-spec`、`tdd`（mattpocock，MIT）、`test-driven-development`（superpowers，MIT）仅参考，未安装。
- **Skill 前准备**：确认失败测试可写、真实测试命令可运行、写范围已批准。
- **如何提任务**：要求 Agent 先写失败测试，再最小实现，记录命令与结果。见提示词 A10。
- **Skill 产出**：`commit`、`test-output.txt`。
- **不能交给 Agent 自动决定**：实现取舍、技术债接受、范围变更。
- **如何验收**：增量可运行；相关测试通过；失败可复现；diff 在允许范围内。
- **出错用哪个 Debug Skill**：`systematic-debugging`（本地或 superpowers）。
- **常见错误**：删除断言换通过；超范围改动；无测试就声称完成。
- **通过后进入**：A11 测试或 A12 E2E。
- **可跳过？代价**：不可跳过。跳过等于没有交付。

## A11 · TDD、集成测试与契约测试

- **阶段意义**：用测试证明 AC 与负例，而不只是“代码看起来对”。
- **为什么必须**：没有测试的行为无法回归，也无法审查。
- **基础知识**：红绿重构、契约测试、测试质量。
- **必须理解原理**：测试是否编码行为；**熟悉操作**：测试框架。
- **进入前输入**：AC/负例、API 契约、真实依赖或可控替身。
- **对应 Skill**：本地 `verification`、`systematic-debugging`；外部 `tdd`（mattpocock）、`test-driven-development`（superpowers）。
- **Skill 前准备**：明确哪些是 mock、哪些是真实依赖；准备契约文件。
- **如何提任务**：要求 Agent 写 AC→测试映射、契约测试与失败路径。见提示词 A11。
- **Skill 产出**：`test-report.md`、`contract-diff.json`。
- **不能交给 Agent 自动决定**：测试阈值、可接受替身范围、阻塞标准。
- **如何验收**：每条 AC/负例有测试；契约变更可检测；mock 不冒充真实依赖。
- **出错用哪个 Debug Skill**：`systematic-debugging`。
- **常见错误**：只测实现细节；跳过失败测试；mock 通过就宣称真实通过。
- **通过后进入**：A12 E2E。
- **可跳过？代价**：Tier D 可最小化。跳过代价是无回归网。

## A12 · 浏览器 E2E 和 UX QA

- **阶段意义**：在真实浏览器/设备上验证黄金路径、移动宽度与关键负例。
- **为什么必须**：单元测试不能证明页面真的能用。
- **基础知识**：E2E 稳定性、跨浏览器/设备、可访问性。
- **必须理解原理**：真实渲染与交互；**熟悉操作**：Playwright/截图。
- **进入前输入**：可运行应用、黄金路径、目标设备矩阵。
- **对应 Skill**：本地 `verification`；外部 `webapp-testing`（anthropics，Apache-2.0）、`web-design-guidelines`（vercel，LICENSE_UNVERIFIED）。
- **Skill 前准备**：启动应用；准备测试账号/数据；确认目标宽度。
- **如何提任务**：要求 Agent 运行浏览器脚本、截图并分析布局与控制台错误。见提示词 A12。
- **Skill 产出**：`e2e-report.md`、`screenshots/`、`console-errors.txt`。
- **不能交给 Agent 自动决定**：验收设备范围、可接受视觉差异、阻断级 UX 缺陷。
- **如何验收**：黄金路径/移动宽度/关键负例在真实浏览器通过；截图存在。
- **出错用哪个 Debug Skill**：`systematic-debugging` + `webapp-testing`。
- **常见错误**：未运行浏览器就声称通过；只测桌面；忽略控制台错误。
- **通过后进入**：A14 审查或 A13 调试。
- **可跳过？代价**：纯 API 项目可跳过。跳过代价是 UI 缺陷流入生产。

## A13 · 故障诊断与根因分析

- **阶段意义**：先复现与定位根因，再修复，并留下回归测试。
- **为什么必须**：盲改会引入新缺陷并掩盖真实原因。
- **基础知识**：复现、二分、日志/追踪、根因 vs 症状。
- **必须理解原理**：假设驱动与证据；**熟悉操作**：调试器、bisect。
- **进入前输入**：失败现象、日志/指标/追踪、最近变更。
- **对应 Skill**：本地 `systematic-debugging`；外部 superpowers `systematic-debugging`、mattpocock `diagnosing-bugs`。
- **Skill 前准备**：稳定复现；准备最小失败样本。
- **如何提任务**：要求 Agent 先复现、提出假设、验证假设，再修复。见提示词 A13。
- **Skill 产出**：`rca.md`、`regression-test`。
- **不能交给 Agent 自动决定**：止血 vs 根因、生产操作授权、回滚决策。
- **如何验收**：根因有证据；修复附回归测试；失败可复现。
- **出错用哪个 Debug Skill**：本身就是 Debug 阶段；若工具异常，用 `verification` 交叉验证。
- **常见错误**：盲改；把偶发当系统性；无复现就修复。
- **通过后进入**：A14 审查。
- **可跳过？代价**：无故障时跳过。跳过代价是重复故障。

## A14 · 独立双轴代码审查

- **阶段意义**：独立对照 Spec 与工程/安全标准，给出明确结论。
- **为什么必须**：作者自审有盲区；审查是最后的低成本质量门。
- **基础知识**：Spec 达成度、工程标准、Finding 分类。
- **必须理解原理**：双轴与阻断判定；**熟悉操作**：diff、PR 模板。
- **进入前输入**：实现 diff、Spec/AC、验证证据。
- **对应 Skill**：本地 `code-review`、`verification`；外部 mattpocock `code-review`、superpowers `requesting-code-review`/`receiving-code-review`。
- **Skill 前准备**：准备 AC 对照表与验证证据；明确阻断标准。
- **如何提任务**：要求 Agent 分 Spec 轴与 Standards 轴，给出 Finding 分类与结论。见提示词 A14。
- **Skill 产出**：`review.md`、`pr-comment`。
- **不能交给 Agent 自动决定**：Mainline Blocker 判定、Scope Change 批准、合并决策。
- **如何验收**：双轴均有结论；阻断项清零；Finding 不自动变需求。
- **出错用哪个 Debug Skill**：审查发现的缺陷 → `systematic-debugging`。
- **常见错误**：建议冒充阻断；无证据通过；审查者改验收测试。
- **通过后进入**：A15 安全审计或 A16 发布。
- **可跳过？代价**：Tier C/D 可自审。跳过代价是缺陷与安全风险。

## A15 · 安全、隐私和权限审计

- **阶段意义**：系统检查密钥、依赖、越权、注入与隐私边界。
- **为什么必须**：安全缺陷通常不可逆，且不能用功能测试替代。
- **基础知识**：威胁建模、认证/授权负例、隐私最小化。
- **必须理解原理**：信任边界与攻击面；**熟悉操作**：扫描工具。
- **进入前输入**：权限矩阵、数据流、依赖清单。
- **对应 Skill**：本地 `code-review`、`verification`；外部 `claude-code-security-review`（anthropics，MIT，GitHub Action，不是 Skill）、`security-review` 独立 Skill 未核实（UNVERIFIED）。
- **Skill 前准备**：准备权限矩阵与数据流；确认扫描范围。
- **如何提任务**：要求 Agent 跑密钥/依赖扫描，写越权/注入负例，检查日志脱敏。见提示词 A15。
- **Skill 产出**：`security-review.md`、`scan-receipt.json`。
- **不能交给 Agent 自动决定**：风险接受、合规边界、安全阻断。
- **如何验收**：密钥/依赖/越权/注入负例均有证据；日志无敏感字段。
- **出错用哪个 Debug Skill**：`systematic-debugging`（安全缺陷复现与修复）。
- **常见错误**：Tier 降级绕过安全；日志含敏感字段；提示词注入未处理。
- **通过后进入**：A16 发布。
- **可跳过？代价**：不可跳过安全负例；Tier C/D 只降低非安全义务。跳过代价是安全事故。

## A16 · CI/CD 与发布

- **阶段意义**：在目标 SHA 上运行必需检查，完成迁移、备份、发布与回滚。
- **为什么必须**：本地通过不等于可发布；发布需要回执与回滚。
- **基础知识**：可复现构建、必需检查、发布/回滚。
- **必须理解原理**：证据分层（代码/CI/预发/发布/验收）；**熟悉操作**：CI 配置。
- **进入前输入**：Review 结论、发布检查单、授权与回滚方案。
- **对应 Skill**：本地 `verification`、`documentation-sync`；外部 spec-kit / OpenSpec 是框架/CLI（不是 Skill），`deploy-to-vercel`（vercel，LICENSE_UNVERIFIED）仅参考。
- **Skill 前准备**：确认备份、迁移升降级、健康检查、回滚路径。
- **如何提任务**：要求 Agent 配置 CI、验证构建与迁移、保存回执。见提示词 A16。
- **Skill 产出**：`ci-run-receipt.json`、`release-receipt.md`、`changelog.md`。
- **不能交给 Agent 自动决定**：发布授权、窗口与灰度、回滚触发条件。
- **如何验收**：目标 SHA 必需检查成功；发布有平台回执；回滚可用。
- **出错用哪个 Debug Skill**：`systematic-debugging`；构建/部署异常用 `verification`。
- **常见错误**：CI 通过冒充生产验收；无备份发布；无回滚。
- **通过后进入**：A17 运营。
- **可跳过？代价**：不可跳过发布回执；内部工具可记录不发布理由。跳过代价是线上事故。

## A17 · 监控、恢复和运营

- **阶段意义**：追踪稳定性、成本、失败案例与用户反馈，并演练恢复。
- **为什么必须**：发布不是终点；没有可观测性就无法发现与恢复故障。
- **基础知识**：指标/日志/追踪、告警、Runbook。
- **必须理解原理**：SLO 与恢复；**熟悉操作**：监控平台。
- **进入前输入**：发布回执、监控配置、用户反馈。
- **对应 Skill**：本地 `systematic-debugging`、`documentation-sync`；外部 `expo-observe`/`eas-observe`（expo，MIT，仅 RN/Expo）。
- **Skill 前准备**：确认监控接入、告警阈值、恢复步骤。
- **如何提任务**：要求 Agent 观察指标、记录事件台账、起草恢复步骤。见提示词 A17。
- **Skill 产出**：`ops-log.md`、`incident-ledger.md`、`runbook.md`。
- **不能交给 Agent 自动决定**：SLO/告警阈值、事故等级、恢复授权。
- **如何验收**：服务在线；异常入台账；恢复路径可演练。
- **出错用哪个 Debug Skill**：`systematic-debugging`。
- **常见错误**：服务在线当业务验收；告警不可用；无恢复演练。
- **通过后进入**：A18 复盘。
- **可跳过？代价**：一次性实验可跳过。跳过代价是故障不可见。

## A18 · 文档、交接和复盘

- **阶段意义**：让文档与真实系统一致，完成交接，并从真实失败中提炼改进。
- **为什么必须**：文档漂移会让下一位工程师/Agent 做出错误决策。
- **基础知识**：文档漂移、交接完整性、Blameless 复盘。
- **必须理解原理**：改进晋级需要真实复用；**熟悉操作**：链接检查、模板。
- **进入前输入**：事件台账、验证/发布证据、失败模式。
- **对应 Skill**：本地 `documentation-sync`、`code-review`；外部 mattpocock `retro`、superpowers `finishing-a-development-branch`。
- **Skill 前准备**：准备事实时间线与未验证项；确认交接责任人。
- **如何提任务**：要求 Agent 更新当前事实、写复盘与改进候选、检查链接与命令。见提示词 A18。
- **Skill 产出**：`postmortem.md`、`handover.md`、`improvement-candidates.md`。
- **不能交给 Agent 自动决定**：改进优先级、规则/测试/Gate 取舍、复用判定。
- **如何验收**：文档与系统一致；交接可执行；改进候选不自动晋级。
- **出错用哪个 Debug Skill**：`systematic-debugging`（区分偶发与系统性）。
- **常见错误**：单次事件宣称 Skill 稳定；文档与代码漂移；交接缺命令。
- **通过后进入**：END，或回到 A08/A10 处理改进。
- **可跳过？代价**：无事件时可简化。跳过代价是知识流失与重复事故。

---

## 跨活动说明

- **Greenfield / Brownfield**：见 [PRODUCT-GUIDES.md](PRODUCT-GUIDES.md#greenfield--brownfield-入口)。
- **四类产品路线**：见 [PRODUCT-GUIDES.md](PRODUCT-GUIDES.md)。
- **AI Overlay**：AI 不能绕过底层平台权限 Gate；见 [PRODUCT-GUIDES.md](PRODUCT-GUIDES.md#ai-overlay)。
- **哪些环节不该强行找 Skill**：数据库迁移、支付对账、平台审核、签名发布等，应由专用工程工具与平台控制完成，见 [PRODUCT-GUIDES.md](PRODUCT-GUIDES.md#专用工具而非-skill-的环节)。

所有活动状态仍为文档/草案；真实执行证据留在目标项目仓。
