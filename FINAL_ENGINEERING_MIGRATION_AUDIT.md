# Final Engineering Migration Audit

- 审计日期：2026-10-31
- 目标仓库：`Xander-Xai/X-SuperPlay-Dev-Workbench`
- 只读来源：`Xander-Xai/X-SuperPlay-AI-Engineering-OS@8553124f238ab463d4a50debad34e871ef8de060`（冻结快照）；观测 HEAD `2b792242894937d303c4680208daf9df97ea0027`
- 治理参考：`Xander-Xai/AI-Native-Work-Learning-OS`（只引用，不复制正文）
- 迁移分支：`feat/engineering-migration-completion`
- 运行时版本：`0.3.0`

> 本审计只判定**工程内容迁移**。真实小程序 / SaaS 运行验收、真机、生产发布与旧仓退役是独立事项，不能用本文的结论替代。

## 0. 结论摘要

| 项 | 结论 |
|---|---|
| 冻结快照文件级去向 | 106/106 有明确处置；`PARTIAL=0`、`NOT_MIGRATED=0` |
| 三份工程操作手册 | 已重构为 `src/playbooks.mjs`，网站 / CLI / 工作区三处可访问 |
| G-01 Git 工程操作规范 | `MIGRATED_VERIFIED`（建议性，项目本地规则优先） |
| G-02 Worktree / Agent 操作说明 | `EQUIVALENT_VERIFIED` |
| G-03 工程模板 | `MIGRATED_VERIFIED`；工作区 10 → 16 项 |
| G-04 AI / 安全检查单 | `EQUIVALENT_VERIFIED` |
| G-05 组织级仓库注册表 | `HISTORICAL_ONLY`，未复制 |
| L0–L6 成熟度 | 保留为 `xeng maturity` 本地缺口诊断；L6 不由静态审计宣称 |
| 运行时 / 网站 / CLI 旧仓依赖 | `PASS_NO_ACTIVE_DEPENDENCY` |
| `ENGINEERING_CONTENT_MIGRATION_COMPLETE` | **PASS**（内容迁移；CI/合并回执见 §6） |
| 真实项目 / 真机 / 生产验收 | `NOT_RUN / BLOCKED`，与内容迁移分开判定 |

## 1. 原仓全部源文件的语义去向

机器可读清单：[migration/eng-os-semantic-reconciliation-20261031.json](../migration/eng-os-semantic-reconciliation-20261031.json)

每条记录包含要求的八列：`source_path / source_sha / semantic_capability / destination / implementation / test / evidence / disposition`。

汇总：

| disposition | 数量 | 含义 |
|---|---:|---|
| `MIGRATED_VERIFIED` | 61 | 语义已迁入并有本地测试或可复核实现 |
| `EQUIVALENT_VERIFIED` | 32 | 以不同结构实现同等行为，不复制原文 |
| `HISTORICAL_ONLY` | 8 | 有历史价值但不进入公开运行时 |
| `NOT_APPLICABLE` | 5 | 索引 / 占位 / 旧版本记录 |
| `PARTIAL` | 0 | — |
| `NOT_MIGRATED` | 0 | — |

按类别：

| 源类别 | 文件数 | 处置 |
|---|---:|---|
| `00-governance` | 5 | 决策/原则/来源语义等效；例外与 L0–L6 已实现为 `xeng audit` 与 `xeng maturity` |
| `01-lifecycle` | 12 | 11 阶段进入 `STAGES`；外部需求接入并入 `intake` 并新增简报模板 |
| `02-standards` | 10 | Profile 义务 + `src/git-workflow.mjs` + PR 模板 |
| `03-ai-coding` | 10 | 路由、验证、交接、停止条件、worktree、逐 Agent 操作全部承接 |
| `04-profiles` | 18 | 14 个基础 Profile；三份手册重构为 Playbook |
| `05-skills` | 9 | 8 个 Skill 自包含重写；README 不迁入 |
| `06-templates` | 8 | Spec/Tickets/ADR/验证/发布/复盘/PR/Review/外部需求全部承接 |
| `07-checklists` | 4 | 发布与验证专用产物；AI 与安全检查行为等效 |
| `08-automation` | 1 | 无运行时代码 |
| `09-reference` | 2 | 历史参考 |
| `registry` | 4 | profiles/skills/standards 迁入；repositories 历史保留 |
| `tools` | 2 | Node CLI 重写；Python 测试行为等效覆盖 |
| 根文件 / `docs` / `lab` / `.github` | 20 | 入口与 CI 等效；旧 ADR/审计/实验/组织关联历史保留 |

没有文件被静默丢弃；历史与不适用项均有显式决定。

## 2. 三份工程 SOP 的迁移与验证

| 源文件 | 重构后的能力 | 入口 | 测试 / 证据 | 状态 |
|---|---|---|---|---|
| `04-profiles/ai-application/daily-development-sop.md` | 任务分流、Call-chain Map、最小变更合同、分层诊断、DoD、Agent 交接与回退 | `src/playbooks.mjs#ai-application`；网站「工程 Playbook」；`xeng playbook ai-application`；`<slug>-engineering-playbook.md` | `test/engine.test.mjs`、`test/workspace.test.mjs`、`test/xeng.test.mjs` | `MIGRATED_VERIFIED` / `ADVISORY_PLAYBOOK_NOT_VERIFIED` |
| `04-profiles/rag/from-zero-playbook.md` | 需求与数据 SPEC、B1–B7 最小链路、Golden Set 与指标、企业加固、诊断树、发布回退 | `src/playbooks.mjs#rag`；同一网站 / CLI / 工作区入口 | 同上 | `MIGRATED_VERIFIED` / `ADVISORY_PLAYBOOK_NOT_VERIFIED` |
| `04-profiles/agent/from-zero-playbook.md` | P0–P10、Tool/State/Authorization Spec、HITL 风险分级、L1–L4 评测分层、恢复与观测 | `src/playbooks.mjs#agent`；同一网站 / CLI / 工作区入口 | 同上 | `MIGRATED_VERIFIED` / `ADVISORY_PLAYBOOK_NOT_VERIFIED` |

对照结论：

- 三份手册复用 11 阶段生命周期，未新增第二套生命周期或 Gate。
- 覆盖了 AI 应用 Feature / Bug / 性能 / 事故；RAG 从业务需求到上线；Agent 从任务契约到 HITL 与测试。
- Brownfield / Greenfield 路径分别说明：已有仓库先只读重建现状，再做增量切片。
- 失败案例、验证条件、Agent 交接与回退步骤均结构化保留。
- 示例工具契约与 Golden 样本为合成/脱敏内容，不包含真实客户数据。
- 手册是建议性内容，不自动安装 Skill、不提升任何证据状态。

## 3. G-01 至 G-05 最终结论

### G-01 Git 工程操作规范 — `MIGRATED_VERIFIED`（建议性）

实现：

- `src/git-workflow.mjs`：base SHA、分支、worktree、提交粒度、PR 检查、Review、合并后清理、禁止动作。
- `docs/GIT_WORKFLOW.md`：人类可读版本，明确项目本地规则优先。
- `.github/pull_request_template.md`：仓库级 PR 模板，要求 base SHA、命令、结果、跳过项、未验证项、回滚与 Agent 来源。
- `xeng init`：为生成项目写入 `docs/git-workflow.md` 与增强后的 `.github/pull_request_template.md`。

验证：`test/engine.test.mjs`、`test/xeng.test.mjs`、`test/workspace.test.mjs`。

### G-02 Worktree / Agent 操作说明 — `EQUIVALENT_VERIFIED`

worktree 隔离与 Claude Code / Codex / OpenCode 的操作要点进入 `GIT_WORKFLOW.worktrees` 与 `GIT_WORKFLOW.agentOperating`，并随生成项目输出。行为等效：一个 worktree 一个意图一个 Agent；并行写同一文件被禁止；Agent 加载状态仍需单独探针验证。

### G-03 工程模板 — `MIGRATED_VERIFIED`

工作区新增：

- `<slug>-implementation-plan.md`：假设、切片、停止条件、迭代预算、回退、Scope Change。
- `<slug>-postmortem-template.md`：事实/时间线、影响、根因、控制、行动项、被推翻假设、未验证项。
- `<slug>-external-demand-brief.md`：来源可信度、需求身份、接入决策、AC、权限边界；默认 `ENGINEERING_HYPOTHESIS`，不进入已批准 Spec。
- `<slug>-pull-request-template.md`：base SHA、命令、结果、跳过项、风险、回滚、Agent 来源、未验证项。
- `<slug>-git-workflow.md` 与 `<slug>-engineering-playbook.md`。

工作区条目从 10 增至 16；全部保持 `DRAFT_NOT_EXECUTED` / `TEMPLATE_NOT_EXECUTED`。未新增第二套 Review 或 Ticket 系统。

### G-04 AI 项目与安全检查单 — `EQUIVALENT_VERIFIED`

- Profile `required.security / tests / verification / release` 字段覆盖 AI、RAG、Agent、SaaS、企业、设备。
- `xeng audit` 执行密钥扫描、env 配对、CI、迁移、回滚、例外到期检查。
- 三份 Playbook 明确工具鉴权、权限负例、注入防护、PII 脱敏、真实消费者验收与失败关闭。
- 没有单独复制检查单正文，避免与 Profile 义务重复。

### G-05 组织级仓库注册表 — `HISTORICAL_ONLY`

`registry/repositories.yaml` 是组织清单，不是工程运行时。未复制进公开 Workbench；退役 / 归档由仓库所有者单独决定。

## 4. L0–L6 成熟度模型的去留

**保留**，但改变定位：从旧仓的通用治理阶梯改为 Workbench 本地工程诊断能力。

- 数据与纯函数：`src/maturity.mjs`。
- CLI：`node tools/xeng.mjs maturity <path> [--json]`，复用 `xeng audit` 的实际检查。
- 文档：`docs/MATURITY.md`；网站「工作流浏览器 → 成熟度 · L0–L6」。
- Tier 目标：A → L4、B → L2、C → L1、D → L0。
- 等级按连续达成计算；`missing_controls` 是可执行输出。
- L6 固定 `NOT_VERIFIABLE`：需要长期运行记录证明事故/摩擦已转化为规则、测试或 Gate，静态审计不能宣称。
- 不作为通用组织模型，不复制旧仓正文。

验证：`test/engine.test.mjs`、`test/xeng.test.mjs`。

## 5. 运行时、网站与 CLI 无旧仓依赖的证据

| 证据 | 结果 |
|---|---|
| `npm run scan` | `PASS_NO_ACTIVE_DEPENDENCY`，`active_count=0` |
| `src/catalog.mjs` | `PROVENANCE` / `OWNER` / `GOVERNANCE` / `RUNTIME` 显式分离；来源 HEAD 仅观测 |
| Skill Kit | 只从本仓 `skills/` 读取；`--source` 被拒绝 |
| `npm run build` | `dist` 仅含 `index.html`、`styles.css`、17 个 `src/*.mjs`、`.nojekyll`；不含 `tools/`、`docs/`、`skills/`、`migration/` |
| 网站 CSP | `default-src 'self'`、`connect-src 'none'`、`form-action 'none'`；无 Token、无远程脚本、无上传 |
| CLI | `tools/xeng.mjs` 本地 Node；`init` 默认 dry-run；`assemble` 需 `--apply --confirm-reviewed` |
| 历史引用 | 仅出现在显式 allowlist 文件；不在运行时路径 |

## 6. 新增 / 修改文件、PR、SHA、CI

### 新增

- `src/playbooks.mjs`、`src/git-workflow.mjs`、`src/maturity.mjs`
- `docs/PLAYBOOKS.md`、`docs/GIT_WORKFLOW.md`、`docs/MATURITY.md`
- `.github/pull_request_template.md`、`CLAUDE.md`
- `migration/eng-os-semantic-reconciliation-20261031.json`
- `FINAL_ENGINEERING_MIGRATION_AUDIT.md`
- 新测试覆盖：workspace、engine、xeng

### 修改

- `src/workspace.mjs`（16 项产物）、`src/engine.mjs`（playbook / git 校验）、`src/app.mjs`（Playbook 视图、Git/成熟度标签页）
- `index.html`、`styles.css`、`tools/xeng.mjs`（maturity / playbook / init Git 指南）、`tools/check.mjs`、`tools/build-site.mjs`
- `README.md`、`docs/ARCHITECTURE.md`、`docs/MIGRATION.md`、`docs/ROADMAP.md`、`docs/CONTRACT_ALIGNMENT.md`
- `migration/eng-os-split-20261031.json`
- `package.json` / `src/catalog.mjs` 版本 `0.3.0`

### PR / SHA / CI

| 项 | 值 |
|---|---|
| Base commit | `716bc07d5829b7a0e918cee7e0b1a64f6b70f95b` |
| 分支 | `feat/engineering-migration-completion` |
| PR | PENDING_THIS_PR |
| Head SHA | PENDING_THIS_PR |
| 本地 `npm run verify` | PASS（111 tests，110 pass，1 platform skip） |
| 本地 `npm run build` | PASS |
| 远端 CI | PENDING_THIS_PR |
| Pages | PENDING_THIS_PR |

合并后以 PR 与 Actions 页面回执为准；本表在合并前不声称远端已通过。

## 7. 尚未满足的真实项目验证条件

这些条件**不影响工程内容迁移**，但阻止宣称方法论成熟或旧仓退役：

- Issue #3：真实微信小程序 / SaaS dogfood、真机与生产路径。`BLOCKED`：没有获得授权的真实项目。
- Issue #4：Skill Kit 的签名 bundle、依赖与回滚加固。当前已有 SHA-256 回执与受控回滚，但没有签名供应链；保持 OPEN。
- 三个 Agent 的真实 Skill 加载：Claude Code / OpenCode 有部分探针证据；Codex 仍为部分。整体 `NOT_VERIFIED`。
- 真实设备、商店审核、企业 IdP、支付渠道回执：`NOT_RUN / BLOCKED`。
- 独立第三方复核：`INDEPENDENT_REVIEW_NOT_RUN`。
- 许可证：`UNLICENSED-PROPRIETARY`，需所有者确定。
- 旧仓退役：`DECOMMISSION_NOT_VERIFIED`，未归档、未删除、未授权。

## 8. 最终判定

~~~text
ENGINEERING_CONTENT_MIGRATION_COMPLETE = PASS
~~~

依据：

1. 冻结快照 106/106 文件均有语义去向，`PARTIAL` 与 `NOT_MIGRATED` 均为 0。
2. 三份工程操作手册已重构为可导航、可 CLI 读取、可随项目导出的 Playbook。
3. G-01、G-03 已补迁移；G-02、G-04 行为等效；G-05 明确历史保留。
4. L0–L6 未被静默丢弃，已转为可执行诊断，且 L6 不由静态审计宣称。
5. 运行时、网站、CLI 与 Skill 安装均无旧仓活跃依赖。
6. 本地 `npm run verify` 与 `npm run build` 通过；远端 CI / Pages 回执在合并时补齐。

独立判定：

~~~text
REAL_PROJECT_ACCEPTANCE = NOT_RUN
DEVICE_AND_PLATFORM_ACCEPTANCE = NOT_RUN
AGENT_RUNTIME_SKILL_LOAD = NOT_VERIFIED
INDEPENDENT_REVIEW = NOT_RUN
DECOMMISSION = NOT_VERIFIED
~~~

内容迁移完成不等于 SaaS / 小程序真实运行验收，也不等于旧仓可以退役。
