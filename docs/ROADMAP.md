# Roadmap · Evidence over Features

## v0.1 已实现（历史）

- 四路线 / 四种 APP 技术选择；基础 + AI 扩展 Profiles 组合。
- 11 阶段可点击视图、8 候选 Skills 搜索和映射。
- 项目需求 / 工具 / Tier 配置、xeng dry-run 命令、Markdown / JSON 浏览器下载。
- 静态本机预览服务器、Node 逻辑测试、CI 计划。
- 工程验收状态阶梯、反馈回流说明、公共 / 私有 Source of Truth 边界。

## v0.2 运行时整合（2026-10-31，已合并）

目标：把旧私有 Engineering OS 的运行时能力语义迁移进 Workbench，并消除运行时依赖。

- [x] 11 阶段 / 13 任务 / 14 基础 + 3 叠加 Profiles / 8 候选 Skills 在 `src/catalog.mjs` 中重建。
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

## AI-Native Spec–Skills–Harness–Loop 方法完整落盘（2026-10-31，分支 PR 进行中）

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

状态：`METHOD_DOCUMENTED_AND_ROUTED`（待 PR CI/合并）；`HARNESS_LOOP_RUNTIME_NOT_IMPLEMENTED`；`REAL_PROJECT_DOGFOOD_NOT_RUN`。详情见[方法定义](methods/AI-NATIVE-SPEC-HARNESS-SKILLS-LOOP.md)。

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
