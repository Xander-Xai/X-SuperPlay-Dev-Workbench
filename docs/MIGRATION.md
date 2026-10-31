# Engineering OS → Workbench 语义迁移

迁移 ID：`eng-os-split-20261031`  
机器可读清单：[migration/eng-os-split-20261031.json](../migration/eng-os-split-20261031.json)  
迁移分支：`feat/engineering-os-runtime-consolidation`

## 结论

Workbench 现在是工程运行时的所有者。旧私有 Engineering OS 只保留为**历史来源**，网站、CLI、Skill 安装与测试均不再读取它。

本迁移是**语义重写**，不是 subtree、submodule 或目录复制：

- 不复制私有 SKILL.md 正文；8 个 Skill 以公开、自包含的 bundle 重写。
- 不复制私有治理文件、客户证据、内部路径或凭证。
- 生命周期保留 11 个唯一阶段；任务路由 13 种；Profiles 14 个基础 + 3 个叠加；Skills 8 个候选。
- 所有导出证据保持 `NOT_RUN`。

## 来源与目标

| 角色 | 仓库 | 版本 |
|---|---|---|
| 历史来源（只读） | `Xander-Xai/X-SuperPlay-AI-Engineering-OS` | `8553124f238ab463d4a50debad34e871ef8de060` |
| 通用治理参考（未复制正文） | `Xander-Xai/AI-Native-Work-Learning-OS` | `f1289d685c95c7fac6f1d50068527a60f080ee1b` |
| 当前工程所有者 | `Xander-Xai/X-SuperPlay-Dev-Workbench` | 运行时迁移提交 `527499f1ab3befdf5e87af042e746853cbbcf665`；验收提交见清单 `acceptance_commit` |

## 兼容表

| 旧运行时能力 | 旧位置 | 新位置 | 变化 |
|---|---|---|---|
| 生命周期阶段 | 私有 lifecycle 文档 | `src/catalog.mjs` `STAGES` | 11 个唯一阶段，公开语义重写 |
| 任务路由 | `03-ai-coding/task-router.yaml` | `TASKS` + `src/routing.mjs` | 13 种任务，映射到 11 阶段 |
| Profiles | `registry/profiles.yaml` + `04-profiles/*` | `PROFILES` | 14 基础 + enterprise / mobile / payments 叠加 |
| Skills 注册表 | `registry/skills.yaml` | `SKILLS` | 8 个候选，`installed=false` |
| 标准 | `registry/standards.yaml` | Profile 义务字段 | 10 类标准语义并入 required/recommended |
| 模板 | `06-templates/*` | `src/starter.mjs` / `src/workspace.mjs` | Spec、Tickets、ADR、验证、发布、交接 |
| xeng init | `tools/xeng.py` | `tools/xeng.mjs init` | Node 实现，默认 dry-run，不覆盖 |
| xeng audit | `tools/xeng.py audit` | `tools/xeng.mjs audit` | 同一检查族，输出 JSON |
| xeng doctor | `tools/xeng.py doctor` | `tools/xeng.mjs doctor` | 坏链接、死路径、过期事实、env 漂移 |
| xeng validate-registry | `tools/xeng.py` | `tools/xeng.mjs validate-registry` | 校验 catalog + bundle 结构 |
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
- `PROVENANCE` 仅作为历史溯源；`OWNER` 是当前所有者；`RUNTIME` 是发布运行时。
- `npm run scan` 检查活跃依赖；历史出现必须位于显式允许的文件中。

## 源文件清单对账

冻结源快照共 **106 个文件**（Git tree，未截断），Workbench 以 **11 项模块级记录**承接。按类别对账：

| 源类别 | 文件数 | Workbench 处置 |
|---|---|---|
| `00-governance` | 5 | 由 AI-Native 治理仓承接；Workbench 只保留公开语义摘要与引用 |
| `01-lifecycle` | 12 | 11 个阶段迁入 `STAGES`；市场/外部需求接入并入 `intake` 语义，未单列阶段 |
| `02-standards` | 10 | 并入 Profile 义务字段；分支/提交/PR/Git 细则未结构化迁入（缺口 G-01） |
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

结论：**没有发现被静默丢弃的 Skill 依赖**；8 个 Skill 的依赖闭包在 `src/routing.mjs` 中重建。发现 5 类未迁入的工程约束，均记录为缺口，而不是宣称已覆盖。

## 源仓 PR #5 覆盖情况

源仓 PR #5 增加 tracer ticket 模板、Spec–Tickets–Harness–Loop 采纳 SOP 与实施计划扩展。Workbench 现状：

- **已覆盖**：Tracer Ticket 的纵向切片、`blocked_by`、AC/负例、base SHA、权限范围、真实测试命令占位。
- **部分覆盖**：Harness / 有界 Loop 以 handoff 的停止条件与单阶段纪律表达，没有独立运行时。
- **未覆盖**：迭代预算字段、双轴（Spec / Standards）评审记录、上游方法采纳说明。
- PR #5 未合并；Workbench 基于冻结 SHA 语义重写，不吸收未合并内容作为权威。

## 跨仓契约对齐

`ai-native-governance-contract/v1` 的六类契约对账见 [CONTRACT_ALIGNMENT.md](CONTRACT_ALIGNMENT.md) 与 [migration/contract-alignment-v1.json](../migration/contract-alignment-v1.json)。结论：6 项均为部分实现，无运行时依赖；Review Convergence 与 Knowledge Promotion 有明确未实现子项。

## 未解决项

| ID | 项 | 状态 |
|---|---|---|
| U-01 | 目标提交 SHA | 已固定为 `527499f1ab3befdf5e87af042e746853cbbcf665`（本迁移记录提交） |
| U-02 | 浏览器真实交互与移动端截图 | 已用无头 Chrome 在 1440px / 390px 完成截图与脚本化交互；真机复核仍未执行 |
| U-03 | Windows 11 / WSL2 / Claude Code / Codex / OpenCode 真实加载 | 未全部验证 |
| U-04 | 真实项目 Dogfood、真机、生产发布 | `NOT_RUN` |
| U-05 | 旧仓 PR #5 / #6 的最终合并状态 | 迁移基于冻结 SHA，不依赖未合并 PR |
| U-06 | 许可证 | `UNLICENSED-PROPRIETARY`，需所有者确定 |
| U-07 | CI 与 Pages 部署回执 | CI 已通过（见 PR #12 checks）；Pages 仅在合并到 main 后发布，尚无回执 |
| U-08 | 未迁入的工程约束（G-01…G-05） | 分支/提交/PR 细则、worktree、postmortem/PR/review 模板、安全/AI 检查单、repositories 注册表；未宣称覆盖 |
| U-09 | 治理契约完整实现 | 6 项均为部分实现；Finding 分类、不可变候选、晋级阶梯未实现 |

## 退役检查单

旧仓**未归档、未删除**。只有在以下条件全部满足后，才由仓库所有者单独确认退役：

- [ ] 本分支合并到 main，CI 全绿，Pages 构建成功。
- [ ] 至少一个真实项目完成从 init → 实现 → 验证 → 发布的完整路径。
- [ ] 第二个项目验证 Profile / Skill / 证据模型可复用。
- [ ] 三个 Agent 的真实 Skill 加载路径验证通过。
- [ ] 旧仓所有者确认没有未合并的必要变更。
- [ ] 保留只读归档与回滚方案。

当前状态：`DECOMMISSION_NOT_VERIFIED`。
