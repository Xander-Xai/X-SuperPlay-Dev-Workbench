# Engineering OS → Workbench 语义迁移

迁移 ID：`eng-os-split-20261031`  
机器可读清单：[migration/eng-os-split-20261031.json](../migration/eng-os-split-20261031.json)  
冻结后增量审计：[migration/eng-os-delta-audit-20261031.json](../migration/eng-os-delta-audit-20261031.json)

## 结论

Workbench 现在是工程运行时的所有者。旧 Engineering OS 只保留为**历史来源**，网站、CLI、Skill 安装与测试均不读取它作为运行依赖。

2026-10-31 重新核验后的事实：

- 旧 Engineering OS 仓库已由 **private 变为 public**；可见性变化不等于内容批准，也不改变本迁移的冻结快照。
- Workbench PR #12 已合并到 `main`，合并提交 `74402bf7172c5896e3610364d32b3279a9c8d851`。
- 该提交上的 CI 与 Pages 部署成功；Pages 地址为 <https://xander-xai.github.io/X-SuperPlay-Dev-Workbench/>。
- Windows CRLF Skill frontmatter 修复已作为 PR #13 合并，提交 `32e0342`，远端 CI 通过。
- 旧仓 PR #5、#6、#9 均已合并；迁移清单中“#5 未合并”的旧表述已作废。
- Learning OS PR #57 仍为 OPEN，未作为已合并契约权威。

本迁移是**语义重写**，不是 subtree、submodule 或目录复制：

- 不复制私有 SKILL.md 正文；8 个 Skill 以公开、自包含的 bundle 重写。
- 不复制私有治理文件、客户证据、内部路径或凭证。
- 生命周期保留 11 个唯一阶段；任务路由 13 种；Profiles 14 个基础 + 3 个叠加；Skills 8 个候选；4 条路线各有独立 SOP。
- 所有导出证据保持 `NOT_RUN`。

## 可复核迁移事实表

| 角色 | 仓库 | SHA | 状态 |
|---|---|---|---|
| 冻结历史来源 | `Xander-Xai/X-SuperPlay-AI-Engineering-OS` | `8553124f238ab463d4a50debad34e871ef8de060` | `HISTORICAL_PROVENANCE`，永不覆盖 |
| 来源当前 HEAD（仅观测） | `Xander-Xai/X-SuperPlay-AI-Engineering-OS` | `2b792242894937d303c4680208daf9df97ea0027` | public，只读观测，不是同步承诺 |
| 运行时迁移合并 | `Xander-Xai/X-SuperPlay-Dev-Workbench` | `74402bf7172c5896e3610364d32b3279a9c8d851` | PR #12 squash merge |
| 迁移分支历史头 | `Xander-Xai/X-SuperPlay-Dev-Workbench` | `527499f1ab3befdf5e87af042e746853cbbcf665` | PR #12 head，保留作历史 |
| Windows 修复合并 | `Xander-Xai/X-SuperPlay-Dev-Workbench` | `32e0342` | PR #13，CI 通过 |
| 通用治理参考 | `Xander-Xai/AI-Native-Work-Learning-OS` | `f1289d685c95c7fac6f1d50068527a60f080ee1b` | PR #57 OPEN，仅引用 |

模块级 `source_repo / source_sha / destination_repo / destination_sha / module / ownership / migration_status / verification_status / evidence` 见清单 `fact_table` 字段。

## 兼容表

| 旧运行时能力 | 旧位置 | 新位置 | 变化 |
|---|---|---|---|
| 生命周期阶段 | 私有 lifecycle 文档 | `src/catalog.mjs` `STAGES` | 11 个唯一阶段，公开语义重写 |
| 任务路由 | `03-ai-coding/task-router.yaml` | `TASKS` + `src/routing.mjs` | 13 种任务，映射到 11 阶段 |
| Profiles | `registry/profiles.yaml` + `04-profiles/*` | `PROFILES` | 14 基础 + 3 叠加 |
| 路线 SOP | 分散在旧模板与检查单 | `ROUTE_SOPS` + `src/workspace.mjs#routeSopMarkdown` | 4 条路线的前置、平台限制、负例、Gate、失败处理与回退 |
| Skills 注册表 | `registry/skills.yaml` | `SKILLS` | 8 个候选，完整元数据，`installed=false` |
| 标准 | `registry/standards.yaml` | Profile 义务字段 | 10 类标准语义并入 required/recommended |
| 模板 | `06-templates/*` | `src/starter.mjs` / `src/workspace.mjs` | Spec、Tickets、ADR、验证、发布、交接、路线 SOP、资产包 |
| xeng init | `tools/xeng.py` | `tools/xeng.mjs init` | Node 实现，默认 dry-run，不覆盖 |
| xeng audit | `tools/xeng.py audit` | `tools/xeng.mjs audit` | 同一检查族，输出 JSON |
| xeng doctor | `tools/xeng.py doctor` | `tools/xeng.mjs doctor` | 坏链接、死路径、过期事实、env 漂移 |
| xeng validate-registry | `tools/xeng.py` | `tools/xeng.mjs validate-registry` | 校验 catalog + bundle 结构 + status/license 一致 |
| xeng selftest | `tools/xeng.py` | `tools/xeng.mjs selftest` | 调用 `node --test` |
| Skill 安装 | `tools/skill-kit.mjs --source <private>` | `tools/skill-kit.mjs install` | 从本仓 `skills/` 读取，无 `--source` |
| 证据状态 | 私有证据约定 | `src/evidence.mjs` | 显式状态机，禁止静默升级 |
| 项目基线 | 私有脚本 | `tools/project-probe.mjs` | 只读，增加 stack/profile/task 建议 |

## 旧仓依赖消除

迁移前存在三类运行依赖：

1. 网站命令 `python tools/xeng.py ...`，要求本地私有仓克隆。
2. Skill Kit 的 `--source ../X-SuperPlay-AI-Engineering-OS`。
3. `src/catalog.mjs` 的 `SOURCE` 指向私有仓，并被当作当前来源展示。

迁移后：

- 网站命令改为 `node tools/xeng.mjs init ...`。
- Skill Kit 从 `skills/<id>/` 整包安装，`--source` 被明确拒绝。
- `PROVENANCE` 仅作为历史溯源；`OWNER` 是当前所有者；`RUNTIME` 是发布运行时；来源当前 HEAD 仅以 `currentHeadObserved` 记录。
- `npm run scan` 检查活跃依赖；历史出现必须位于显式允许的文件中。
- 网站 `dist` 只包含 index、样式与浏览器安全模块，不含 `tools/` 或旧仓路径。

## 源文件清单对账

冻结源快照共 **106 个文件**（Git tree，未截断），Workbench 以 **11 项模块级记录**承接。按类别对账：

| 源类别 | 文件数 | Workbench 处置 |
|---|---|---|
| `00-governance` | 5 | 由 AI-Native 治理仓承接；Workbench 只保留公开语义摘要与引用 |
| `01-lifecycle` | 12 | 11 个阶段迁入 `STAGES`；市场/外部需求接入并入 `intake` 语义，未单列阶段 |
| `02-standards` | 10 | 并入 Profile 义务字段；分支/提交/PR/Git 细则未结构化迁入（G-01） |
| `03-ai-coding` | 10 | 路由、验证、Agent 交接、停止条件迁入；`worktree` 与逐 Agent 操作手册未迁入（G-02） |
| `04-profiles` | 18 | 14 个基础 Profile 迁入；企业/移动/支付为 Workbench 叠加扩展 |
| `05-skills` | 9 | 8 个 Skill 自包含重写；README 不迁入 |
| `06-templates` | 8 | Spec、Tickets、ADR、Profile、验证、发布迁入；postmortem、PR、review、外部需求简报未迁入（G-03） |
| `07-checklists` | 4 | 发布与验证检查单迁入；AI 项目与安全检查单未单独迁入（G-04） |
| `08-automation` | 1 | 仅说明文件；无运行时代码 |
| `09-reference` | 2 | 上游来源清单为历史参考，不迁入 |
| `registry` | 4 | profiles / skills / standards 语义迁入；repositories 注册表未迁入（G-05） |
| `tools` | 2 | `xeng` 以 Node 重写并扩展；原 Python 测试不迁入 |
| 根文件 / `docs` / `lab` / `.github` | 20 | 历史入口、ADR、审计与 CI 不作为公开运行时迁入 |

结论：**没有发现被静默丢弃的 Skill 依赖**；8 个 Skill 的依赖闭包在 `src/routing.mjs` 中重建。未迁入的工程约束记录为缺口。

### 冻结快照之后的 delta audit

来源仓在冻结快照后前进 **3 个提交**（`ahead_by: 3`）：

| 提交 | PR | 变更 | 处置 |
|---|---|---|---|
| `bbd5910f` | #5 | 修改 `03-ai-coding/ai-native-spec-harness-loop.md`；新增 `upstream-method-adoption.md`、`06-templates/tracer-ticket.md`；修改 `06-templates/implementation-plan.md` | 部分覆盖：bounded loop 由 handoff 停止条件与证据模型表达；模板正文未吸收 |
| `f1369b5d` | #6 | 修改 README，说明仓库职责与跨仓交接 | 不适用于运行时 |
| `2b792242` | #9 | 新增 `.github/pull_request_template.md` | 部分等效：`xeng init` 为目标项目生成 PR 模板；本仓库自身未携带 |

结论：没有新增运行时依赖；`tracer-ticket.md`、更新后的 `implementation-plan.md` 与 `upstream-method-adoption.md` **未吸收**。这是工程改进候选，不是已交付能力。

### 缺口处置决定（重新评估）

| ID | 缺口 | 旧结论 | 新结论 | 理由 |
|---|---|---|---|---|
| G-01 | 分支 / 提交 / PR / Git 细则 | 明确延期 | **部分等效** | `xeng init` 生成目标项目 PR 模板；仓库级 Git 规范仍由项目本地规则与 CI 承接 |
| G-02 | worktree 与逐 Agent 操作手册 | 已有等效替代 | **维持等效替代** | handoff 权限/停止条件 + Agent 目标目录覆盖运行时需要 |
| G-03 | postmortem / PR / review / 外部需求 / tracer 模板 | 已有等效替代 | **修正为部分替代** | 旧结论过强；上游新增 tracer-ticket 与 implementation-plan 模板未被吸收 |
| G-04 | AI 项目与安全检查单 | 已有等效替代 | **维持等效替代** | Profile 义务字段 + `xeng audit` 的密钥/env/迁移/回滚检查 |
| G-05 | repositories 注册表 | 只需保留历史 | **维持历史保留** | 组织级仓库清单不是工程运行时 |

## 源仓 PR #5 / #6 / #9 状态

- PR #5：**已合并**，`2026-10-31T04:17:52Z`，合并提交 `bbd5910fb8169d6372f78c6a73b45992350e3fb4`。
- PR #6：**已合并**，`2026-10-31T04:19:54Z`，合并提交 `f1369b5d39600a82833fcb1bfcb4700f87f4babd`。
- PR #9：**已合并**，`2026-10-31T04:21:16Z`，合并提交 `2b792242894937d303c4680208daf9df97ea0027`。

Workbench 对 PR #5 的覆盖：

- **已覆盖**：Tracer Ticket 的纵向切片、`blocked_by`、AC/负例、base SHA、权限范围、真实测试命令占位。
- **部分覆盖**：Harness / 有界 Loop 以 handoff 停止条件与单阶段纪律表达，没有独立运行时。
- **未覆盖**：迭代预算字段、双轴（Spec / Standards）评审记录、上游方法采纳说明、上游 tracer/implementation-plan 模板正文。

## 跨仓契约对齐

`ai-native-governance-contract/v1`（PR #57 @ `2b3013ca`，contract blob `df6f5100`）的六类契约对账见 [CONTRACT_ALIGNMENT.md](CONTRACT_ALIGNMENT.md) 与 [migration/contract-alignment-v1.json](../migration/contract-alignment-v1.json)。结论：6 项均为部分实现，状态词汇兼容已采用；无运行时依赖；Review Convergence 与 Knowledge Promotion 有明确未实现子项。PR #57 在 2026-10-31 仍为 OPEN，本文件不对未合并契约作权威声明。

## 未解决项

| ID | 项 | 状态 |
|---|---|---|
| U-01 | 目标提交 SHA | `74402bf7172c5896e3610364d32b3279a9c8d851` 已合并；PR head `527499f` 作为历史保留 |
| U-02 | 浏览器真实交互与移动端截图 | 1440px / 390px 无头 Chrome 截图与脚本化交互已执行；真机复核仍未执行 |
| U-03 | Windows 11 / WSL2 / Claude Code / Codex / OpenCode 真实加载 | Windows 11 本地验证通过；三个 Agent 的真实 Skill 加载仍未全部验证 |
| U-04 | 真实项目 Dogfood、真机、生产发布 | `BLOCKED`：没有获得授权的真实小程序 / SaaS 项目 |
| U-05 | 旧仓 PR #5 / #6 / #9 最终合并状态 | 已合并（2026-10-31 观测） |
| U-06 | 许可证 | `UNLICENSED-PROPRIETARY`，需所有者确定 |
| U-07 | CI 与 Pages 部署回执 | `74402bf` 与 `32e0342` 上 CI 成功、Pages 已部署 |
| U-08 | 未迁入的工程约束（G-01…G-05） | G-01/G-03 为部分替代；G-02/G-04/G-05 维持；不宣称覆盖 |
| U-09 | 治理契约完整实现 | 6 项均为部分实现；Finding 分类、不可变候选、晋级阶梯未实现 |

## 退役检查单

旧仓**未归档、未删除**。只有在以下条件全部满足后，才由仓库所有者单独确认退役：

- [x] 迁移提交已合并到 main，CI 全绿，Pages 构建成功（`74402bf`、`32e0342`）。
- [ ] 至少一个真实项目完成从 init → 实现 → 验证 → 发布的完整路径。
- [ ] 第二个项目验证 Profile / Skill / 证据模型可复用。
- [ ] 三个 Agent 的真实 Skill 加载路径验证通过。
- [ ] 旧仓所有者确认没有未合并的必要变更；delta audit 的未吸收模板已决定去留。
- [ ] 保留只读归档与回滚方案。

当前状态：`DECOMMISSION_NOT_VERIFIED`。
