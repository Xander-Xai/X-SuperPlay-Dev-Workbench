# X-SuperPlay Dev Workbench

**AI-Native 软件交付工作台。** 从一个真实项目出发，选择项目类型、项目状态与任务类型，组合工程 Profiles 与候选 Skills，得到可执行的十一阶段路线、工作区资产和 Agent 交接。

本仓库是这套工程运行时的**当前所有者**：生命周期、任务路由、Profiles、Skills、xeng CLI 与证据模型都在这里维护。历史 Engineering OS 已标记为 superseded 并退役，其 GitHub 仓库由所有者决定处置；它只作为来源记录，不再是运行时依赖。

> 生成 ≠ 已安装 ≠ 已测试 ≠ 已发布 ≠ 已验收。所有导出的证据状态默认 `NOT_RUN`。

## 完整开发范式：AI-Native Spec-Driven Harness & Loop Engineering

**中文：AI 原生规格驱动的 Harness–Skills–Loop 全栈工程范式。** 本仓已维护完整的 [方法定义与 Workbench 映射](docs/methods/AI-NATIVE-SPEC-HARNESS-SKILLS-LOOP.md)、[Matt Pocock / Harness / Ralph 的固定版本上游参考](docs/methods/UPSTREAM-SOURCES.md)、[真实全栈灯塔项目试点 SOP 和模板](docs/methods/PROJECT-PILOT.md)、[AI 原生产品与 Agent 架构设计](docs/methods/AI-NATIVE-PRODUCT-AGENT-DESIGN.md)、[Skill Engineering Factory 与代码专家 Skill 生成方法](docs/methods/SKILL-ENGINEERING-FACTORY.md)。它不是原作者或招聘方的官方命名，也不是新的第二套生命周期。

```text
需求 → Discovery → Spec/AC → Tracer Tickets → Skills → Harness
     → 单任务 Bounded Loop（实现→测试→双轴评审→证据）→ 全栈 Demo → 授权发布/复盘
```

```bash
node tools/xeng.mjs method          # 完整范式（只读）
node tools/xeng.mjs method sources  # 上游固定版本、许可与对应关系
node tools/xeng.mjs method pilot    # 项目纵切 SOP、Harness/Loop 记录模板与启动提示词
node tools/xeng.mjs method design   # AI 原生产品和 Agent 架构设计
node tools/xeng.mjs method skills   # Skill 工厂/代码专家 Skill 创建与评测方法
```

**完成度边界**：方法文档与离线 CLI 已纳入本仓版本控制；Skill Factory 自动生成器、Harness/Loop 独立 Runner **未实现**；外部 Skills **未安装**；真实项目 Dogfood、Provider/设备与消费者验收仍为 `NOT_RUN`。文档和 CI 不证明产品已交付。

## 三分钟运行

需要 Node.js 20+。零运行时依赖，无需 `npm install`，无需数据库或 API Key。

~~~bash
git clone https://github.com/Xander-Xai/X-SuperPlay-Dev-Workbench.git
cd X-SuperPlay-Dev-Workbench
npm run verify
npm run security
npm run dev
~~~

打开 <http://127.0.0.1:4173>（仅监听本机）。

## 六个入口

| 入口 | 作用 |
|---|---|
| **项目启动器** | 项目类型 → 新/旧项目 → 任务类型 → Tier / 技术栈 / 扩展 → 生成路线、阶段 Gate、路线 SOP、导出 |
| **工作流浏览器** | 11 个唯一阶段、4 条路线 SOP、13 种任务路由、17 个 Profile、Git 工作流、L0–L6 成熟度、A/B/C/D 等级义务 |
| **Skills 能力库** | 8 个自包含候选 Skill、标准元数据、依赖闭包、按 Agent 生成 dry-run 安装命令 |
| **项目工作区** | 生成 16 份可审查草案：Manifest、ENGINEERING_PROFILE、Spec/Tickets、ADR、验证计划、发布清单、Agent 交接、路线 SOP、Review 记录、实施计划、复盘、外部需求简报、PR 模板、Git 工作流、工程 Playbook、完整资产包 |
| **工程 Playbook** | 3 份 Profile 附属操作手册：AI 应用日常研发、企业 RAG 从零构建、企业 Agent 从零开发 |
| **证据与改进** | 证据状态机、本地报告导入（不上传）、阶段摘要与改进闭环 |

## 四条路线 SOP

4 条交付路线复用同一套 11 阶段生命周期，各自增加前置条件、平台不可替代环节、必须覆盖的负例、Gate、失败处理与回退：

- **SaaS**：租户隔离、认证会话、迁移升降级、订阅/支付幂等、备份与监控；必须证明租户 A 无法读取或修改租户 B 的数据。
- **企业自研**：业务访谈、流程与权限矩阵、SSO/RBAC、集成契约、审计、数据迁移、UAT 与运行交接。
- **微信小程序**：AppID/资质、登录与服务端会话、合法域名、隐私授权、真机、提审与发布；平台审核和资质不能由本地测试替代。
- **移动 APP**：在 Flutter / React Native / Android / iOS 中择一，覆盖导航状态、设备权限、安全存储、离线恢复、签名与商店审核；不同时强制四套技术栈。

路线 SOP 会随方案进入工作区资产包；平台不可替代的环节必须标 `BLOCKED` / `NOT_RUN`，不得用本地测试冒充平台回执。

## 三份工程 Playbook

三份操作手册补齐旧 Engineering OS 中仍有使用价值、此前未完整承接的工程内容。它们复用 11 阶段，不建立第二套生命周期：

- **AI 应用日常研发**：Feature / Bug / RAG 质量 / Agent 调错工具 / 性能成本 / 事故的任务分流，接管陌生代码的 Call-chain Map，最小变更合同，分层诊断与 Definition of Done。
- **企业 RAG 从零**：业务与数据 SPEC、B1–B7 最小端到端链路、Golden Set 与检索/生成/运行指标、企业加固、失败诊断树、发布与回退。
- **企业 Agent 从零**：P0–P10 阶段、Tool/State/Authorization Spec、HITL 风险分级、L1–L4 评测证据分层、故障恢复与可观测性。

手册状态固定为 `ADVISORY_PLAYBOOK_NOT_VERIFIED`：不新增 Gate、不自动安装 Skill、不提升任何证据状态。网站「工程 Playbook」、`node tools/xeng.mjs playbook <id>` 与工作区 `<slug>-engineering-playbook.md` 使用同一份数据。示例均为合成/脱敏契约。

## 方法视图：8 宏阶段 / 18 活动 / 商业交付 Gate

在 11 阶段权威生命周期之上，新增一层**兼容视图**（`src/delivery.mjs`），不建立第二套状态机：

- **8 宏阶段 G0–G7**：机会接入、产品定义、工程设计、Tickets 与执行环境、纵向实现、工程验证、发布交付、运营复盘。
- **18 项详细活动 A01–A18**：每项映射回 1–3 个权威阶段，带知识、输入、人类决定、Agent 操作、主用/替代 Skill、工具、工件、正负验收、停止条件、可确定性化控制与 Greenfield/Brownfield 要求。
- **商业交付状态**：`CODE_TESTED → CI_VERIFIED → STAGING_VERIFIED → RELEASED → CONSUMER_ACCEPTED`，五层不可互相替代。
- **有界 Loop**：`PREPARE → RED → IMPLEMENT → GREEN → REFACTOR → VERIFY → REVIEW → RECORD → STOP/NEXT`，终止原因写入结构化 `stop_reason`。
- **Ticket Harness 契约**：`ticket_id / spec_id / base_sha / accepted_AC / allowed_files / allowed_commands / negative_tests / budgets / rollback / evidence_paths / reviewer` 等字段；当前为 `CONTRACT_DEFINED_NOT_RUNTIME_ENFORCED`。

~~~bash
node tools/xeng.mjs method --template   # 8 宏阶段 × 18 活动 × 11 阶段矩阵
node tools/xeng.mjs matrix --json
node tools/xeng.mjs delivery --json
node tools/xeng.mjs skills-matrix --json
~~~

映射校验接入 `npm run check`：8 宏阶段恰好覆盖 11 阶段一次，18 活动覆盖全部阶段，每项活动只有一个主用 Skill。详见 [docs/METHOD.md](docs/METHOD.md) 与 [三报告整合](docs/research/2026-10-31-ai-native-fullstack-synthesis.md)。

## 支持范围

- 交付对象：SaaS、企业自研系统、微信小程序、移动 APP。
- APP 技术栈：Flutter / React Native / Android / iOS，择一。
- 小程序技术栈：原生 / Taro / uni-app / 微信云开发。
- 可选叠加：AI Application、RAG、Agent、订阅与支付。
- 任务路由：idea、feature、bug、refactor、architecture、investigation、performance、security、documentation、migration、dependency-update、release、incident。
- 工程等级：A 生产级 / B 交付验证 / C 学习实验 / D 一次性试验。

## xeng CLI（Node，离线）

~~~bash
node tools/xeng.mjs init ../your-project --profile saas,web,backend --tier B --task feature --mode new --dry-run
node tools/xeng.mjs audit ../your-project --json
node tools/xeng.mjs doctor ../your-project
node tools/xeng.mjs maturity ../your-project --json
node tools/xeng.mjs playbook rag
node tools/xeng.mjs method
node tools/xeng.mjs validate-registry
node tools/xeng.mjs task bug --type=saas --tier=B
~~~

`init` 默认不覆盖任何已有文件；冲突时写入 `*.suggested.md` 供人工合并。`audit` 检查 README、Agent 规则、工程 Profile、测试、CI、密钥、env 配对、迁移、回滚与例外有效期。`doctor` 检查坏链接、失效脚本路径、过期当前事实和 env 漂移。`maturity` 复用 audit 的实际检查输出 L0–L6 缺口，不把等级当质量分数，L6 不由静态审计宣称。

`init` 还会生成建议性的 `docs/git-workflow.md` 与 `.github/pull_request_template.md`：前者覆盖 base SHA、分支、worktree、提交粒度、PR 检查与合并后清理；项目本地规则始终优先。

### 一次装配（组装路线 + 最小 Skills + 目标检查）

~~~bash
# 预览：不改目标项目
node tools/xeng.mjs assemble --target ../your-project --type saas --task feature --tier B --agent codex

# 受控安装：必须显式确认已审查
node tools/xeng.mjs assemble --target ../your-project --type saas --task feature --tier B --agent codex --apply --confirm-reviewed

# 校验已安装文件与回执（不代表 Agent 真的加载了 Skill）
node tools/xeng.mjs agent-check --target ../your-project --agent codex
~~~

`assemble` 只安装该路线阶段真正需要的 Skill（含依赖闭包），默认 dry-run；目标目录必须是已存在的非符号链接目录。`--apply` 需要 `--confirm-reviewed`，遇到已存在且非受管的文件直接拒绝且不写锁。输出区分：

- `ASSEMBLY_DRY_RUN`：仅预览，零写入。
- `ASSEMBLY_INSTALLED_NOT_TESTED`：文件已安装且哈希校验通过，**运行时加载未验证**。
- `ALREADY_MANAGED`：幂等重复安装，未重复改动。
- `agent-check` 的 `FILES_VERIFIED_RUNTIME_NOT_VERIFIED` 只证明磁盘文件与锁一致；Agent 发现/调用需按 [docs/AGENT_SKILL_LOAD.md](docs/AGENT_SKILL_LOAD.md) 的探针命令单独验证。没有真实 Agent 回执时一律 `NOT_VERIFIED`。

## Skills：自包含 bundle

8 个候选 Skill 均位于 `skills/<id>/`，包含 `SKILL.md` 与 `references/`，不再依赖旧仓目录结构。每个 Skill 都带标准化元数据：`id / version / owner / source / license / supported_agents / lifecycle_stage / prerequisites / dependencies / install_method / tests / status`。

状态阶梯为 `CANDIDATE → LOCALLY_VERIFIED → REAL_PROJECT_VERIFIED → REUSABLE`。没有真实使用证据，不会自动晋级；当前全部为 `CANDIDATE`。

~~~bash
node tools/skill-kit.mjs list
node tools/skill-kit.mjs plan    --target ../your-project --agent codex --skills verification
node tools/skill-kit.mjs install --target ../your-project --agent codex --skills verification --apply --confirm-reviewed
node tools/skill-kit.mjs verify  --target ../your-project
node tools/skill-kit.mjs update  --target ../your-project
node tools/skill-kit.mjs uninstall --target ../your-project --apply --confirm-reviewed
node tools/skill-kit.mjs rollback  --target ../your-project --receipt <receipt.json> --apply --confirm-reviewed
~~~

- 默认 dry-run；`--apply` 必须搭配 `--confirm-reviewed`。
- 整包复制，目标已存在文件则拒绝覆盖。
- 更新/卸载只处理受管且未修改的文件，修改过就拒绝。
- 锁文件 `.x-superplay/skill-kit.lock.json`（schemaVersion 2，兼容读取 v1）。
- 每次写入生成 SHA-256 回执，可按回执回滚。
- 安装文件不等于 Skill 已执行或已验证。

## 已有工程：只读基线

~~~bash
npm run probe -- --target ../your-project --type saas --output project-baseline.json
~~~

只读检查 Git HEAD / dirty 状态、常见工程标记，并给出 stack / profile / task 建议；**不读取业务代码、`.env`、凭证，不运行测试，不上传**。网页可本地导入该 JSON，导入后仍为 `NOT_RUN`。

## 证据模型

状态：`NOT_RUN → IN_PROGRESS / BLOCKED → UNKNOWN / VERIFIED`。`VERIFIED` 必须带 command、result、artifact 且使用已执行层；状态只能按允许的迁移前进，`VERIFIED` 不可回退，禁止静默升级。

必需 Gate 按项目类型、任务、Tier、Profile 与阶段推导（REQUIRED / RECOMMENDED / OPTIONAL / NOT_APPLICABLE），不再把目录中的全部证据种类当作所有项目的强制项。Tier C/D 只降低非安全义务；已有项目与安全 Gate 不因降级被弱化。

层：代码检查 / 真实环境 / 消费者验收，三层不可互相替代。

网页“证据与改进”可导入 `LOCAL_EVIDENCE_REPORT`（schemaVersion 1），导入结果为 `IMPORTED_NOT_TRUSTED`，按当前路线契约显示缺失 Gate；声明完整不等于真实验收。

## 仓库边界

- 本仓库拥有：生命周期、路由、Profiles、标准摘要、Skills bundle、CLI、证据模型、网站。
- 产品代码、真实测试回执、客户数据、发布凭证留在各项目仓或受控环境。
- 不包含私有 SKILL.md 正文、私有治理文档、客户证据、凭证或第三方受限代码。
- 不提供浏览器端 GitHub Token、远程脚本安装器或自动部署动作。

## 历史来源与迁移

- 历史来源（只读溯源，不是运行依赖）：`Xander-Xai/X-SuperPlay-AI-Engineering-OS@8553124f238ab463d4a50debad34e871ef8de060`。该仓已标记 superseded 并退役；退役状态不改变冻结快照。
- 来源当前 HEAD（仅观测）：`fa20126e93c57b1faab56d9c4cecc717b1eea46e`；早期 3 个提交见 [migration/eng-os-delta-audit-20261031.json](migration/eng-os-delta-audit-20261031.json)，安全与归档增量见 [migration/eng-os-post-freeze-increments-20261031.json](migration/eng-os-post-freeze-increments-20261031.json)。
- 通用治理参考（未复制正文）：`Xander-Xai/AI-Native-Work-Learning-OS@15beebf955d1f2a515e2791dc8b375806598d36a`；PR #57 已于 2026-10-31 合并，契约正文未复制，采用状态仍为 `PARTIAL`。
- 迁移清单：[migration/eng-os-split-20261031.json](migration/eng-os-split-20261031.json)
- 文件级语义对账：[migration/eng-os-semantic-reconciliation-20261031.json](migration/eng-os-semantic-reconciliation-20261031.json)（冻结快照 106/106 文件，逐项 `disposition`）
- 迁移说明：[docs/MIGRATION.md](docs/MIGRATION.md)
- 最终迁移审计：[FINAL_ENGINEERING_MIGRATION_AUDIT.md](FINAL_ENGINEERING_MIGRATION_AUDIT.md)
- 安全与独立验收：[SECURITY_AND_MIGRATION_INDEPENDENT_ACCEPTANCE.md](SECURITY_AND_MIGRATION_INDEPENDENT_ACCEPTANCE.md)

迁移 PR #12 已合并为 `74402bf`；Windows CRLF 修复 PR #13 已合并为 `32e0342`。两者 CI 通过，Pages 已部署。旧仓已由所有者标记 superseded 并批准退役；Workbench 不依赖其内容，GitHub 侧的具体处置以所有者决定为准。

## 验证状态

| 项 | 状态 |
|---|---|
| `npm run check` / `npm test` / `npm run verify` / `npm run build` | Windows 11 本地通过；远端 CI 在 `74402bf`、`32e0342` 通过 |
| 浏览器交互与移动端布局 | 1440px / 390px 无头 Chrome 截图与脚本化交互通过；真机未验证 |
| Windows 11 Skill 安装 / 更新 / 卸载 / 回滚 | 本地 fixture 通过；三个 Agent 的真实加载未全部验证 |
| 真实项目 Dogfood / 真机 / 生产发布 | `BLOCKED`：没有获得授权的真实小程序 / SaaS 项目 |
| GitHub Pages | 已部署：<https://xander-xai.github.io/X-SuperPlay-Dev-Workbench/> |
| 工程内容迁移（G-01…G-05、三份 SOP） | PR #19 合并为 `b2e29ae`；main CI run 41179291809 通过；Pages 已部署（run 41179291799）；文件级对账 106/106 |

**CI 通过只说明本仓库代码检查通过，不代表用户项目、真实设备或生产交付已验收。**

## 文档

- [架构与所有权](docs/ARCHITECTURE.md)
- [方法视图（8/18/11 与交付 Gate）](docs/METHOD.md)
- [三报告整合与证据对账](docs/research/2026-10-31-ai-native-fullstack-synthesis.md)
- [迁移与兼容表](docs/MIGRATION.md)
- [跨仓治理契约对齐](docs/CONTRACT_ALIGNMENT.md)
- [实际开发 SOP](docs/PLAYBOOK.md)
- [AI 原生 Spec–Skills–Harness–Loop 完整开发范式](docs/methods/AI-NATIVE-SPEC-HARNESS-SKILLS-LOOP.md)
- [Matt Pocock / Harness / Ralph 固定上游来源](docs/methods/UPSTREAM-SOURCES.md)
- [灯塔项目全栈实战及验收模板](docs/methods/PROJECT-PILOT.md)
- [AI 原生产品设计与 Agent 架构设计模板](docs/methods/AI-NATIVE-PRODUCT-AGENT-DESIGN.md)
- [Skill Engineering Factory 与代码专家 Skill 示例](docs/methods/SKILL-ENGINEERING-FACTORY.md)
- [工程 Playbook](docs/PLAYBOOKS.md)
- [项目级 Git 工作流](docs/GIT_WORKFLOW.md)
- [工程成熟度 L0–L6](docs/MATURITY.md)
- [Skill Kit 契约](docs/SKILL_KIT.md)
- [演进路线](docs/ROADMAP.md)

## 许可

本仓库尚未声明开源再分发许可（Skills 标记为 `UNLICENSED-PROPRIETARY`）。商业分发或接受外部贡献前，需仓库所有者确定许可。
