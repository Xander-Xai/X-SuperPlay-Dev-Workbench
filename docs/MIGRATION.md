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
| 当前工程所有者 | `Xander-Xai/X-SuperPlay-Dev-Workbench` | 本分支提交 SHA（合并前为 `UNKNOWN_UNTIL_COMMIT`） |

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

## 未解决项

| ID | 项 | 状态 |
|---|---|---|
| U-01 | 目标提交 SHA | `UNKNOWN_UNTIL_COMMIT`，合并前无法固定 |
| U-02 | 浏览器真实交互与移动端截图 | 已用无头 Chrome 在 1440px / 390px 完成截图与脚本化交互；真机复核仍未执行 |
| U-03 | Windows 11 / WSL2 / Claude Code / Codex / OpenCode 真实加载 | 未全部验证 |
| U-04 | 真实项目 Dogfood、真机、生产发布 | `NOT_RUN` |
| U-05 | 旧仓 PR #5 / #6 的最终合并状态 | 迁移基于冻结 SHA，不依赖未合并 PR |
| U-06 | 许可证 | `UNLICENSED-PROPRIETARY`，需所有者确定 |
| U-07 | CI 与 Pages 部署回执 | 需在分支推送后由 GitHub Actions 产生 |

## 退役检查单

旧仓**未归档、未删除**。只有在以下条件全部满足后，才由仓库所有者单独确认退役：

- [ ] 本分支合并到 main，CI 全绿，Pages 构建成功。
- [ ] 至少一个真实项目完成从 init → 实现 → 验证 → 发布的完整路径。
- [ ] 第二个项目验证 Profile / Skill / 证据模型可复用。
- [ ] 三个 Agent 的真实 Skill 加载路径验证通过。
- [ ] 旧仓所有者确认没有未合并的必要变更。
- [ ] 保留只读归档与回滚方案。

当前状态：`DECOMMISSION_NOT_VERIFIED`。
