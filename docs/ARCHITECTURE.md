# Workbench 架构与所有权

> 方法导航：[AI-Native Spec–Skills–Harness–Bounded Loop](methods/AI-NATIVE-SPEC-HARNESS-SKILLS-LOOP.md)、[AI 产品与 Agent 架构设计](methods/AI-NATIVE-PRODUCT-AGENT-DESIGN.md)、[Skill Factory](methods/SKILL-ENGINEERING-FACTORY.md)、[灯塔项目试点](methods/PROJECT-PILOT.md)。以上是本仓公开方法入口，复用原有生命周期/治理与权限模型，不是第二套运行时。

## 系统边界

Workbench 是工程运行时的当前所有者。它拥有生命周期、任务路由、Profiles、标准摘要、Skills bundle、CLI 与证据模型。网站只是这些能力的本地可视化入口。

~~~text
Workbench runtime (this repository)
  src/catalog.mjs        canonical data: 11 stages, 13 tasks, 17 profiles, 8 skills, tiers
  src/routing.mjs        type x task x mode x tier -> ordered stages + skill closure
  src/engine.mjs         plan composition, Markdown/Manifest export, catalog validation
  src/workspace.mjs      sixteen reviewable project artifacts + bundle
  src/playbooks.mjs      AI application / RAG / Agent operating manuals
  src/git-workflow.mjs   advisory project Git guidance + per-agent notes
  src/maturity.mjs       L0-L6 gap diagnostic derived from audit checks
  src/delivery.mjs       8 macro stages / 18 activities / delivery gates / skills matrix (compatibility view)
  src/identity.mjs       shared project_id / base_sha header for every artifact
  src/evidence.mjs       state machine + local report import
  src/evidence-identity.mjs  sha256 identities for reports, artifacts and runtime receipts
  src/starter.mjs        Spec + tracer tickets, including ticket-harness contract fields
  src/handoff.mjs        per-stage Agent handoff and forbidden-action notes
  src/baseline.mjs       browser-safe normalization of the read-only project baseline
  src/install-contract.mjs  agent destinations + skill dependency closure
  src/app.mjs            browser UI (no network, no filesystem)
        │
        ├── tools/xeng.mjs          init / audit / doctor / maturity / playbook / method / matrix / delivery / skills-matrix / assemble / agent-check / validate-registry / selftest / task
        ├── tools/skill-kit.mjs     bundled install / verify / update / uninstall / rollback
        ├── tools/project-probe.mjs read-only local baseline
        └── tools/build-site.mjs    dist allowlist
        │
        ▼
  local download / target project repo / agent session
        │
        ▼
  real tests, real devices, real acceptance — recorded in the product repo, never here
~~~

## 所有权分层

| 数据 | 所有者 | 本仓库职责 |
|---|---|---|
| 生命周期、任务路由、Profiles、Tiers | Workbench | 定义、验证、版本化 |
| Skills bundle | Workbench | 维护自包含目录与依赖闭包 |
| 标准摘要 | Workbench | 以公开、可执行的语言维护 |
| 历史来源 | 旧 Engineering OS | 仅记录 repository + commit 作为溯源 |
| 通用治理语义 | AI-Native Work Learning OS | 只引用，不复制正文 |
| 项目本地决策 | 产品仓库 | 生成草案；不得覆盖项目本地规则 |
| 真实测试、部署、验收 | 产品仓库 / 平台 | 永不伪造 PASS |

`PROVENANCE`、`OWNER`、`GOVERNANCE`、`RUNTIME` 四个常量在 `src/catalog.mjs` 中显式分离。历史 commit 是溯源信息，不是权限、不是同步状态、也不是运行依赖。

## 任务路由

`composeRoute` 的输入是 `type / task / tier / mode / stack / addons`：

1. 由 type + stack + addons 解析 Profiles，检测叠加与冲突。
2. 由 task 选择阶段序列；`existing` 模式在最前面补 `intake` 与 `discovery`。
3. Tier C/D 的 `feature` 任务把 `specification` / `architecture` 标为 `optional`，并记录理由——不静默删除。
4. 未进入路线的阶段写入 `skipped`，明确说明“不包含”，不视为完成。
5. Skills 通过依赖闭包解析；所有 Skill 初始 `CANDIDATE / installed=false`，晋级需要真实使用证据。
6. 每个阶段初始 `state = NOT_RUN`，证据种类来自阶段定义与任务定义。
7. 4 条产品路线各自带一份 `ROUTE_SOPS`：前置条件、平台不可替代环节、必须覆盖的负例、Gate、失败处理与回退；复用 11 阶段，不建立第二套生命周期。

## 方法视图与学习文档

在 11 阶段权威生命周期之上，仓库提供两层**只读兼容视图**，不建立第二套状态机：

- `src/delivery.mjs`：8 宏阶段 G0–G7、18 活动 A01–A18、商业交付状态、有界 Loop、Ticket Harness 契约与 Skills 冲突矩阵。`validateDelivery()` 接入 `validateCatalog()` 与 `npm run check`。
- `docs/METHOD.md`：上述机器可读视图的人类可读导航；`xeng method / matrix / delivery / skills-matrix` 输出同一份数据。

学习材料位于 `docs/learning/`（START-HERE、18 活动知识、阶段到 Skill 矩阵、可复制提示词、产品指南、L1–L6 与 30+60 天路线、验收清单），完整方法文档位于 `docs/methods/`。两者都是文档层：不安装 Skill、不运行 Loop、不提升证据状态，也不进入 `dist/` 发布产物。8 宏阶段与 18 活动必须映射回 11 权威阶段；`npm run check` 会拒绝孤儿阶段、重复映射或活动缺少主用 Skill。

## 证据模型

~~~text
NOT_RUN ──► IN_PROGRESS ──► VERIFIED
   │             │
   └──► BLOCKED ◄┘
          │
          └──► UNKNOWN
~~~

- `VERIFIED` 是终态，不能回退。
- `VERIFIED` 记录必须包含 command、result、artifact，且证据层必须是已执行层（LOCAL_TESTED / CI_VERIFIED / RELEASED / ACCEPTED）。
- 阶段完成按**全部必需 Gate** 判定：任一必需 Gate 缺少 VERIFIED 项、或存在 BLOCKED / UNKNOWN / NOT_RUN / IN_PROGRESS 项，阶段就不能标记完成。
- 同阶段同时出现 VERIFIED 与阻断项时，汇总为 `BLOCKED` 并标记冲突，而不是取状态最大值。
- 导入的本地报告状态固定为 `IMPORTED_NOT_TRUSTED`，`trusted:false`、`promotion:NONE`；即使“声明完整”也不等于可信事实。
- 代码检查 / 真实环境 / 消费者验收是三个独立层，不可互相替代。

### Gate 适用性

`composeRoute()` 为每个阶段生成 `evidencePlan`：

- **REQUIRED**：任务必需证据、Profile 义务（AI/RAG 的 eval、SaaS/企业的接口与权限探针、设备的真机探针）以及发布回执。
- **RECOMMENDED**：任务可选证据、Tier C/D 降级的非安全义务。
- **OPTIONAL**：阶段候选但本项目不强制。
- **NOT_APPLICABLE**：本阶段不适用。

Tier C/D 只能降低非安全义务；`security` 的 review/test、`release` 的 receipt、AI/RAG 的 eval、企业接口探针、设备真机探针保持必需。`existing` 模式不降级任何必需 Gate。缺少项目上下文时，`evidenceSummary()` 返回 `context:"UNKNOWN"`，阶段保持 `NOT_RUN`，不做乐观晋级。

## 工作区资产与共享身份

`workspaceBundle()` 生成 16 个可审查条目：manifest、ENGINEERING_PROFILE、Spec/Tickets、ADR、验证计划、发布检查单、Agent 交接、路线 SOP、Review 记录、实施计划、复盘模板、外部需求简报、PR 模板、Git 工作流、工程 Playbook 与完整资产包。Review 记录按 Spec/Standards 双轴给出 Finding 分类（`MAINLINE_BLOCKER / NON_BLOCKING / QUESTION / SUGGESTION`）与 Scope Change 字段，`reviewed_candidate` 默认 `NOT_RECORDED`。除 manifest 与 bundle 自身外，每个 Markdown/YAML 文件都带同一段 `WORKBENCH_PROJECT_IDENTITY`：`project_id`、`project_type`、`task`、`mode`、`tier`、`base_sha`、`runtime`、`current_owner`、`status`。`<slug>-bundle.json` 汇总全部文件内容、字节数与身份，便于整体导出和一致性核对。

实施计划包含未核实假设、切片、每假设迭代预算、停止条件与回退；复盘模板区分事实、影响、根因、行动项与未验证项；外部需求简报默认 `ENGINEERING_HYPOTHESIS`，不进入已批准 Spec；PR 模板要求 base SHA、命令、结果、跳过项与未验证项；Git 工作流与工程 Playbook 均为建议性文件，项目本地规则优先。

所有产物状态为 `DRAFT_NOT_EXECUTED`；生成资产不等于写入目标仓库、安装 Skill、运行测试或完成验收。

## 浏览器安全

- `index.html` 使用 CSP：`default-src 'self'`、`connect-src 'none'`、`form-action 'none'`。
- 浏览器模块只导入 `src/` 下的公开文件，不使用 Node API。
- 无 GitHub Token、无远程脚本、无上传端点、无自动部署。
- `tools/`、`test/`、`docs/`、`skills/` 不进入 `dist/`；发布产物只有 `index.html`、`styles.css`、`src/`、`.nojekyll`。

## 依赖方向

~~~text
catalog ──► routing ──► engine ──► workspace ──► playbooks / git-workflow
   │           │          │           │
   │           └──────────┴───────────┴──► starter / handoff / install-contract
   │
   ├──► baseline（浏览器安全）◄── project-probe（Node，只读）
   ├──► maturity（纯函数，复用 audit checks）
   ├──► evidence-identity（sha256 身份，纯函数）
   └──► delivery（纯数据兼容视图：8 宏阶段 / 18 活动 / 交付 Gate / Skills 矩阵）
~~~

`engine.mjs` 不导入 `workspace.mjs`；`workspace.mjs` 导入 `engine.mjs` 的 `toManifest`，保持单向依赖。`identity.mjs` 只依赖 `catalog.mjs`，被 starter / handoff / workspace 共享。`playbooks.mjs`、`git-workflow.mjs`、`maturity.mjs`、`delivery.mjs`、`evidence-identity.mjs` 均为浏览器安全纯模块。CLI 工具导入 `src/`，反向不成立。

## 版本与漂移

- 运行时版本在 `RUNTIME.version`，当前 `0.3.0`。
- 目录数据变更必须通过 `validateCatalog()` 与 `npm run verify`。
- `tools/dependency-scan.mjs` 检查是否存在对旧私有仓的运行时依赖；历史溯源只在显式允许的文件中出现。
- 旧仓退役不由本仓库自动执行；需要所有者确认、真实项目验证和单独的回滚计划。

## Gate 语义

`GENERATED_NOT_EXECUTED`、`NOT_RUN`、`CANDIDATE` 是硬编码的安全默认值。任何“已完成”都必须来自目标项目的真实执行回执，不能通过网页开关或 CI 通过来提升。
