# 项目级 Git 工作流（G-01 / G-02）

本文件是 Workbench 对生成项目的**建议性** Git 指导。机器可读数据在 [src/git-workflow.mjs](../src/git-workflow.mjs)，网站「工作流浏览器 → Git 工作流」与生成的 `<slug>-git-workflow.md` 使用同一份数据。

> 目标仓库已有的 `CONTRIBUTING`、`AGENTS.md`、分支保护或组织规范优先。本文件不覆盖项目规则，也不授权自动推送、强制推送或历史重写。

## 治理边界（G-02）

Git/Worktree 有两层权威，不能混为一层：

| 层 | 所有者 | 内容 |
|---|---|---|
| 组织级 | `Xander-Xai/X-SuperPlay-OPC-Blueprint` | 跨仓库治理、组合与本地 worktree 生命周期、OPC 本地路径、分支前缀契约、worktree 脚本 |
| 项目级 | 目标仓库 | `CONTRIBUTING`、`AGENTS.md`、分支保护、`CODEOWNERS`、项目 Git 规则 |
| 建议级 | Workbench | 产品仓与生成项目的交付级 Git/Worktree 使用建议；不定义组织级路径、标签或分支白名单 |

优先级：**目标仓库本地规则 > OPC 组织级治理 > Workbench 建议**。冲突时更严格的一方生效；Workbench 不覆盖、不放宽、不替代项目本地或 OPC 组织级规则。OPC 的 worktree 根目录、脚本、分支前缀与生命周期命令不复制进 Workbench 或生成项目。

## 最小规程

1. **Base SHA**：开工前 `git rev-parse HEAD`，接手项目同时记录 `git status --short`；所有产物、PR 描述与 Agent 交接引用同一 base SHA。
2. **分支**：`main` 保持可部署；代码变更走短分支 `feat/<slug>` / `fix/<slug>` / `chore/<slug>` / `docs/<slug>`；一个分支一个意图。
3. **Worktree**：并行 Agent 一个 worktree、一个意图、一个 Agent；命名 `<repo>-<slug>`；移除前 `git status`，有未提交工作先 stash `-u` 或提交；不要手工删除目录。
4. **提交粒度**：Conventional Commits；一个提交一个逻辑变更；正文写“为什么”；不提交密钥、`.env`、大二进制或死代码。
5. **PR 检查**：Why / Scope / Base SHA / Verification（命令 + 结果 + 跳过项）/ Risks / Rollback；空验证段阻断评审。
6. **Review 完成**：Spec 轴与 Standards 轴分别记录；结论为 approve / block / block-security；安全阻断不可协商。
7. **合并后清理**：确认分支只含预期提交，删除短分支，确认部署/发布回执；PR merged ≠ 已发布 ≠ 已验收。

## 双 Agent 默认分工

默认建议，不是平台限制；项目本地规则与任务实际需要优先。

| 任务 | 默认 Agent | 说明 |
|---|---|---|
| 交互式实现、调试、UI 验证与操作循环 | Claude Code | 需要频繁观察、调整和真实页面验证 |
| 大上下文重构、跨文件机械变更、批量生成 | Codex | 以清晰契约、可验证测试和限定范围为前提 |
| 高风险 diff 的独立第二意见 | 另一个 Agent | 写者不单独批准自己产出的高风险变更 |
| 内容、研究、浏览器取证与多工具流水线 | Claude Code | 需要逐步核验来源与中间结果 |
| 同一文件的并行写入 | 禁止 | 改为串行，或为每个 Agent 分配独立 worktree |

分工不明确时：交互、紧循环、需要现有 Skill 生态 → Claude Code；大范围机械扫描、批量生成、第二意见 → Codex。实际分工写入计划与 PR，便于复盘归因。

## 按 Agent 的要点

- **Claude Code**：交互实现、调试、UI 验证；先读项目 CLAUDE.md → 最近 AGENTS.md → Spec 切片；自审 diff 后填写 PR 模板。
- **Codex**：大上下文重构、跨文件机械变更、独立第二意见；不以“能编译”作为完成证据。
- **OpenCode**：使用项目级 `.opencode/skills`；安装/加载状态单独验证；并行时使用独立 worktree。

详细规则与禁止动作见网站或 `xeng playbook` 之外的 `src/git-workflow.mjs`；生成项目还会收到 `docs/git-workflow.md` 与 `.github/pull_request_template.md`。
