# Roadmap · Evidence over Features

## v0.1 已实现（历史）

- 四路线 / 四种 APP 技术选择；基础 + AI 扩展 Profiles 组合。
- 11 阶段可点击视图、8 候选 Skills 搜索和映射。
- 项目需求 / 工具 / Tier 配置、xeng dry-run 命令、Markdown / JSON 浏览器下载。
- 静态本机预览服务器、Node 逻辑测试、CI 计划。
- 工程验收状态阶梯、反馈回流说明、公共 / 私有 Source of Truth 边界。

## v0.2 运行时整合（2026-10-31，已合并）

目标：把旧私有 Engineering OS 的运行时能力语义迁移进 Workbench，并消除运行时依赖。

- [x] 11 阶段 / 13 任务 / 17 个 Profile（13 基础 + 4 叠加）/ 8 候选 Skills 在 `src/catalog.mjs` 中重建。
- [x] 任务路由：type × task × tier × mode × stack → 有序阶段 + Skill 依赖闭包（`src/routing.mjs`）。
- [x] 显式证据状态机与本地报告导入，全部初始 `NOT_RUN`（`src/evidence.mjs`）。
- [x] 7 件项目工作区产物：manifest、ENGINEERING_PROFILE.yaml、Spec、Tickets、ADR、验证计划、发布检查单（`src/workspace.mjs`）。
- [x] 9 件工作区资产：新增路线 SOP 与共享 project_id / base_sha 的完整资产包。
- [x] 4 条路线独立 SOP：前置条件、平台不可替代环节、负例、Gate、失败处理与回退。
- [x] 8 个 Skill 的标准化元数据与 `CANDIDATE` 状态阶梯；无证据不晋级。
- [x] 自包含 8 个 Skill bundle；安装器从本仓 `skills/` 读取，拒绝 `--source`。
- [x] 锁文件 v2 + SHA-256 校验 + 回执 + 受控卸载 / 回滚。
- [x] `tools/xeng.mjs` Node CLI：init / audit / doctor / validate-registry / selftest / task / version。
- [x] 只读项目基线探测，输出 stack / profile / task 建议。
- [x] 五视图网站：启动器、工作流、Skills、工作区、证据。
- [x] `npm run scan` 区分活跃旧仓依赖与历史溯源。
- [x] 迁移清单 `migration/eng-os-split-20261031.json` 与 `docs/MIGRATION.md`。
- [x] 分支合并、CI 与 Pages 回执：PR #12 → `74402bf`；PR #13 → `32e0342`；CI 成功，Pages 已部署。
- [x] 浏览器真实交互与移动端截图复核：1440px / 390px 无头 Chrome。
- [ ] 三个 Agent 的真实 Skill 加载路径：`NOT_VERIFIED`。
- [ ] 真实项目 Dogfood：`BLOCKED`（没有获得授权的真实小程序 / SaaS 项目）。

## v0.2.1 工程内容补全（2026-10-31）

目标：逐文件核对旧仓，补齐尚未承接的工程内容；不重做网站、不新增第二套生命周期。

- [x] 文件级语义对账：冻结快照 106/106 文件，逐项 disposition。
- [x] 三份 Profile 操作手册（AI 应用日常、RAG 从零、Agent 从零）重构为 `src/playbooks.mjs`、网站视图与 `xeng playbook`。
- [x] 工作区新增实施计划、复盘、外部需求简报、PR 模板、Git 工作流、工程 Playbook；条目 10 → 16。
- [x] G-01：`src/git-workflow.mjs`、`docs/GIT_WORKFLOW.md`、仓库级 PR 模板、`xeng init` 项目级 Git 指南。
- [x] G-02：worktree 与 Claude Code / Codex / OpenCode 操作要点。
- [x] G-03：postmortem、implementation-plan、external-demand、PR 模板。
- [x] L0–L6 保留为 `xeng maturity` 缺口诊断；L6 不由静态审计宣称。
- [ ] 独立第三方复核（`INDEPENDENT_REVIEW_NOT_RUN`）。

## AI-Native Spec–Skills–Harness–Loop 方法完整落盘（2026-10-31；按提交、CI 与 PR 验证）

- [x] 将原方法名称、五组件定义、全流程及 Workbench 唯一模块映射写入 `docs/methods/AI-NATIVE-SPEC-HARNESS-SKILLS-LOOP.md`。
- [x] 建立带原始 SHA 的 Matt Pocock Skills / Ralph / OpenAI Harness 来源清单和许可证边界；不 Vendor 任何第三方代码。
- [x] 建立端到端灯塔试点 SOP（样例 Spec、Tracer Tickets、Harness Contract、Loop 记录、Agent 启动提示词及验收清单）。
- [x] 补充 AI 原生产品设计与 Agent Architecture Card（用户任务、价值指标、非 AI baseline、Tool/State/HITL/Eval、负例）。
- [x] 补充 Skill Engineering Factory（Skill 结构、Code Expert Skill 样例、正负触发/行为评测、供应链与证据晋级）。
- [x] 使 Workbench 站点首页及 CLI 可发现完整开发范式与上述两类新增资料。
- [x] `xeng method [overview|sources|pilot] [--json]` 只读 CLI 入口与回归测试。
- [ ] 在真实产品仓实测 Harness 反馈链/一张 Ticket 的有界 Loop，保存可复核证据。
- [ ] 将迭代预算转为可执行的单任务锁/超时/成本 Gate，按 Owner 授权设计独立 Loop Runner。
- [ ] Agent 实际调用第三方 Skill 的兼容性、许可证和供应链试验；未经批准不安装。
- [ ] Code Expert Skill 自动生成器与跨项目行为评测工具（此次仅落盘生成 SOP、模板和评测契约）。
- [ ] 真实全栈 Demo、用户验收、跨项目模式晋级；不得使用 Workbench 的 CI 代替。

状态：`METHOD_DOCUMENTED_AND_ROUTED`（仓库方法与入口层；与真实执行分层）；`HARNESS_LOOP_RUNTIME_NOT_IMPLEMENTED`；`REAL_PROJECT_DOGFOOD_NOT_RUN`。详情见[方法定义](methods/AI-NATIVE-SPEC-HARNESS-SKILLS-LOOP.md)。

## v0.2.2 AI-Native 全栈交付整合（2026-10-31；已合入 PR #31）

> 分支 `docs/ai-native-learning-system` 已合入 `main`（merge commit `1b5cfc8`）。`[x]` 表示已实现并通过 CI `verify` 与本地 `npm run verify`。

目标：在方法文档之上补齐可执行的兼容视图；不新增第二套生命周期。

- [x] `src/delivery.mjs`：8 宏阶段 G0–G7、18 项活动 A01–A18，全部映射回 11 权威阶段。
- [x] 四路线覆盖清单 + AI Overlay 权限规则（不能绕过平台 Gate）。
- [x] 商业交付状态 `CODE_TESTED → CI_VERIFIED → STAGING_VERIFIED → RELEASED → CONSUMER_ACCEPTED`。
- [x] 有界 Loop 阶段与 7 个终止状态，映射到既有证据状态，额外原因用 `stop_reason`。
- [x] Ticket Harness 契约字段生成到 `src/starter.mjs`（`CONTRACT_DEFINED_NOT_RUNTIME_ENFORCED`）。
- [x] Skills 冲突矩阵与上游 pin/许可证核验（更正 Matt Pocock v1.3.1 commit；不替换既有 `5beb35b` 研究 pin）。
- [x] 扩展 `xeng method`（`activities` / `activity <id>` / `matrix` / `--template`），并新增 `xeng matrix / delivery / skills-matrix`。
- [x] `validateDelivery()` 接入 `validateCatalog()` 与 `npm run check`。
- [x] 三报告整合文档 `docs/research/2026-10-31-ai-native-fullstack-synthesis.md` 与 `docs/METHOD.md`。
- [ ] 工具层强制 `allowed_files` / `allowed_commands`（当前仅字段）。
- [ ] 真实项目执行 `CODE_TESTED` → `CONSUMER_ACCEPTED` 证据链。

## v0.2.3 Agent 编排适配（2026-10-31；已合入 PR #32）

> 目标：让同一套交付契约可选择不同 Agent 执行环境，不新增第二套生命周期。`[x]` 表示已实现并通过 CI `verify` 与本地 `npm run verify`（merge commit `1f9ebf0`）。

- [x] `src/orchestration.mjs`：Orca / Herdr / Multica / Tern 只读能力注册表与 OMP / Claude Code / Codex / OpenCode 运行时清单。
- [x] 上游核验：固定 commit、许可证、平台与 OMP 支持，逐项标记 `VERIFIED_UPSTREAM / UNVERIFIED / BLOCKED`。
- [x] `xeng orchestrator list|doctor|plan|receipt`：默认只读；未安装如实报告，不报成功。
- [x] `PLAN_ONLY / DRY_RUN` 交接计划：复用 16 字段 Ticket Harness 契约；不执行命令、不写文件、不联网。
- [x] 静态隔离检查：单写入者、`allowed_files` 冲突、依赖成环、审查者独立性。
- [x] 外部回执导入固定 `UNTRUSTED`；不得自称 `VERIFIED`，不得自动提升证据状态。
- [x] 安全负例：路径穿越、绝对路径、Shell 链接 / 重定向注入、错误 SHA、未授权组合均被拒绝。
- [x] `validateOrchestration()` 接入 `validateCatalog()` 与 `npm run check`；网站新增只读「Agent 编排」页签。
- [ ] 真实 Provider 安装与执行（当前 `REAL_PROVIDER_NOT_TESTED`）。
- [ ] 运行时锁、自动重试与失败恢复（当前只有计划检查）。
- [ ] Multica 许可证、部署成本、数据流与鉴权审查通过后再评估可执行依赖。
- [ ] Tern 结束闭测并给出 Windows / WSL2 支持声明后再评估。

## v0.3：真实项目 Dogfood

- [ ] 已有微信小程序真实仓库：固定 base SHA，导出 Spec + 3 张可执行 Ticket。
- [ ] xeng init 对目标实际目录 dry-run 成功；人工批准写入，产生项目局部配置。
- [ ] 端到端真机测试产生用户可查验回执；问题反馈保留在项目仓。
- [ ] 第二个 SaaS 项目验证多租户负例、迁移、部署 / 回滚，审查 Profile 兼容性。
- [ ] 用真实项目验证 Skill bundle 的 references/ 深度、许可证与目标仓库公开性检查。
- [ ] Claude Code / Codex / OpenCode 的实际消费路径及负例测试。
- [ ] 可导出的项目 starter bundle，兼容原项目本地规则。

## v1.0：可信工程系统

- [ ] 正式可追溯的本地项目进度及证据导入，状态模型不允许 UNKNOWN→PASS。
- [ ] 真实跨项目试点证明流程重用收益；量化开发工时、返工与错误阻断。
- [ ] 改进反馈 → 候选规则 / Skill → 真实复用 → 源仓 PR → 版本化发布。
- [ ] 安全、私有源边界、可访问性、移动端与用户体验的综合复核。
- [ ] 旧仓退役：需所有者确认、两个项目验证、只读归档与回滚方案（`DECOMMISSION_NOT_VERIFIED`）。

**不要以文档数量、Skills 数量或网站 UI 完成度代替生产交付。**
