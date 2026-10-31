# 阶段 → Skill 矩阵与来源核验

> 本页区分 **Prompt / Skill / MCP / Plugin / Framework / Harness / Loop Runner**，并给出每个 Skill 的真实仓库、固定版本、许可证、触发条件、输入输出与验收方式。
>
> 核验时间：2026-10-31。核验方式：GitHub API 读取仓库 tree 与 LICENSE，未安装、未执行任何第三方 Skill。

## 0. 术语边界

| 概念 | 是什么 | 不是什么 |
|---|---|---|
| **Prompt** | 一次会话请求或片段 | 不是可复用过程资产 |
| **Skill** | 带触发条件、步骤、输入输出、引用与约束的可复用过程（`SKILL.md`） | 不等于执行权限，不保证 Agent 自动发现 |
| **MCP** | 模型上下文协议服务器，提供工具/资源 | 不是 Skill，不自动改变工作流 |
| **Plugin** | 宿主（Claude Code / Codex 等）的扩展包，可含命令、hooks、skills | 不是单一 Skill，安装需信任审查 |
| **Framework / CLI** | 如 Spec Kit、OpenSpec，提供模板、命令与工作流 | 不等于“每个 Skill 都可用” |
| **Harness** | Agent 的执行环境：上下文、工具、权限、测试反馈 | 不是提示词，不是 Loop |
| **Loop Runner** | 自动迭代执行器 | 本仓库未实现 |

## 1. 本地候选 Skills（8 个，全部 CANDIDATE）

来源：`src/catalog.mjs` 的冻结快照语义重写；许可证 `UNLICENSED-PROPRIETARY`；未在真实项目执行。

| Skill | 阶段 | 依赖 | 状态 | 与外部的关系 |
|---|---|---|---|---|
| `project-discovery` | intake, discovery | — | CANDIDATE | 语义借鉴 `grill-with-docs`，非功能等同 |
| `specification` | specification | — | CANDIDATE | 语义借鉴 `to-spec`，非功能等同 |
| `architecture` | architecture | — | CANDIDATE | 语义借鉴 `codebase-design` / `domain-modeling` |
| `implementation-plan` | planning | specification | CANDIDATE | 语义借鉴 `to-tickets`；**不等价于完整 `implement`/`tdd`** |
| `systematic-debugging` | implementation, verification, operation, postmortem | — | CANDIDATE | 语义借鉴 superpowers `systematic-debugging` / mattpocock `diagnosing-bugs` |
| `verification` | verification, review, release | — | CANDIDATE | 语义借鉴 `verification-before-completion` / `tdd` |
| `code-review` | review | verification | CANDIDATE | 语义借鉴 `code-review` |
| `documentation-sync` | release, operation, postmortem | — | CANDIDATE | 部分借鉴 `retro` |

**没有本地 `implement` / `tdd` / `frontend-design` / `webapp-testing` / `security-review` Skill。** 需要时只能引用外部候选，或由目标项目自行实现。

## 2. 外部 Skills（固定版本，未安装）

### 2.1 Matt Pocock · `mattpocock/skills`

- 固定版本：`5beb35b040e3de97e54fa9e386d7e42d15c295c2`（2026-10-19；本仓库既有研究 pin）
- 标签参考：`v1.3.1` → commit `24fe0ef7737efae15c87225755e9f6f5965e4888`（2026-10-04）
- 许可证：MIT（`LICENSE` at pin）
- 状态：`REFERENCE_PINNED`（只读参考，未安装）

| Skill | 精确路径 | 阶段 | 触发 | 不应触发 | 输入 → 输出 | 验收 |
|---|---|---|---|---|---|---|
| `grill-with-docs` | `skills/engineering/grill-with-docs/SKILL.md` | A01/A02 | 需求模糊、领域术语不清 | 已有批准 Spec | 需求/文档 → 澄清问题与共享上下文 | 问题清单覆盖目标/非目标/风险 |
| `to-spec` | `skills/engineering/to-spec/SKILL.md` | A04 | 需要可测 Spec | 已有可验证 AC | 讨论/需求 → Spec + AC | 每条 AC 有验证方法 |
| `to-tickets` | `skills/engineering/to-tickets/SKILL.md` | A08 | 多步任务需切片 | 单文件小改 | Spec → 纵向 Ticket + 依赖 | 每卡可独立验证 |
| `implement` | `skills/engineering/implement/SKILL.md` | A10 | 执行单张已批准 Ticket | 需求未定 | Ticket → 最小 diff + 测试 | 测试通过、diff 在范围内 |
| `implement-spec` | `skills/engineering/implement-spec/SKILL.md` | A10 | 从 Spec 直接实现 | 无 Spec | Spec → 实现 | 对齐 Spec 的 AC |
| `tdd` | `skills/engineering/tdd/SKILL.md` | A10/A11 | 有测试接缝 | 无测试框架 | 行为 → 红绿重构 | 失败测试先于实现 |
| `code-review` | `skills/engineering/code-review/SKILL.md` | A14 | 合并前审查 | 纯文档拼写 | diff + Spec → Finding | 双轴结论、阻断项清零 |
| `retro` | `skills/engineering/retro/SKILL.md` | A18 | 迭代/事故后复盘 | 无证据 | 事件/证据 → 复盘与改进 | 行动项可验证、不宣称稳定 |
| `diagnosing-bugs` | `skills/engineering/diagnosing-bugs/SKILL.md` | A13 | 行为不符预期 | 无复现 | 现象/日志 → 根因与回归测试 | 根因有证据 |
| `triage` | `skills/engineering/triage/SKILL.md` | A02/A08 | 需求/缺陷需排序 | 已排好优先级 | 列表 → 优先级与理由 | 排序可解释 |
| `pr` | `skills/engineering/pr/SKILL.md` | A16 | 准备 PR | 未验证 | diff → PR 描述 | 含命令、结果、未验证项 |
| `research` | `skills/engineering/research/SKILL.md` | A01 | 需要外部事实 | 已有可靠来源 | 问题 → 带来源结论 | 来源可核验 |
| `codebase-design` | `skills/engineering/codebase-design/SKILL.md` | A06 | 模块边界设计 | 单文件改动 | 现状 → 边界方案 | 选项与后果 |
| `domain-modeling` | `skills/engineering/domain-modeling/SKILL.md` | A06 | 领域模型不清 | 模型已稳定 | 业务 → 模型 | 术语与不变量清晰 |
| `prototype` | `skills/engineering/prototype/SKILL.md` | A01/A05 | 需要快速验证 | 已确定方案 | 假设 → 原型 | 原型回答特定问题 |
| `wayfinder` | `skills/engineering/wayfinder/SKILL.md` | A01 | 方向不清 | 目标明确 | 现状 → 路线选项 | 选项与取舍 |

链接模板：`https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/<path>`

### 2.2 Superpowers · `obra/superpowers`

- 固定版本：`2ce8aa15d05bd57213e6f746f953aafb7ded7a8b`（tag `v7.0.1`）
- 许可证：MIT
- 状态：`REFERENCE_PINNED`

| Skill | 精确路径 | 阶段 | 触发 | 输入 → 输出 | 验收 |
|---|---|---|---|---|---|
| `systematic-debugging` | `skills/systematic-debugging/SKILL.md` | A13 | 失败/异常 | 现象 → 根因 + 回归测试 | 假设被证据验证 |
| `test-driven-development` | `skills/test-driven-development/SKILL.md` | A10/A11 | 需要测试先行 | 行为 → 红绿重构 | 先失败后通过 |
| `brainstorming` | `skills/brainstorming/SKILL.md` | A02/A03 | 方案未定 | 问题 → 选项 | 选项与取舍 |
| `writing-plans` | `skills/writing-plans/SKILL.md` | A08 | 需要计划 | Spec → 计划 | 步骤可执行 |
| `executing-plans` | `skills/executing-plans/SKILL.md` | A10 | 执行计划 | 计划 → 增量 | 每步可验证 |
| `requesting-code-review` | `skills/requesting-code-review/SKILL.md` | A14 | 请求审查 | diff → 审查请求 | 审查范围明确 |
| `receiving-code-review` | `skills/receiving-code-review/SKILL.md` | A14 | 接收审查 | Finding → 处理 | 阻断项闭环 |
| `verification-before-completion` | `skills/verification-before-completion/SKILL.md` | A11/A16 | 声称完成前 | 变更 → 验证命令 | 证据先于声明 |
| `using-git-worktrees` | `skills/using-git-worktrees/SKILL.md` | A09 | 需要隔离 | 仓库 → worktree | 不污染主工作树 |
| `writing-skills` | `skills/writing-skills/SKILL.md` | A18/Skill 建设 | 需要新 Skill | 过程 → SKILL.md | 触发/行为评测 |
| `dispatching-parallel-agents` | `skills/dispatching-parallel-agents/SKILL.md` | A09 | 独立并行任务 | 任务 → 并行执行 | 无共享状态冲突 |
| `subagent-driven-development` | `skills/subagent-driven-development/SKILL.md` | A10 | 子代理执行 | 计划 → 子任务 | 结果可复核 |

链接模板：`https://github.com/obra/superpowers/blob/2ce8aa15d05bd57213e6f746f953aafb7ded7a8b/<path>`

### 2.3 Anthropic · `anthropics/skills`

- 固定版本：`ca45fc496a3436251f191354091d557da31c15b5`（2026-10-28）
- 许可证：**已核对的 `frontend-design`、`webapp-testing`、`skill-creator` 目录内 `LICENSE.txt` 为 Apache-2.0**；仓库根目录无统一 LICENSE，另有 `THIRD_PARTY_NOTICES.md`；其他 Skill 需逐一复核。
- 状态：`REFERENCE_PINNED`；再分发前仍需逐 Skill 复核 `LICENSE.txt`

| Skill | 精确路径 | 阶段 | 触发 | 输入 → 输出 | 验收 |
|---|---|---|---|---|---|
| `frontend-design` | `skills/frontend-design/SKILL.md` | A05 | 需要高质量前端视觉 | 需求 → 页面设计 | 布局/状态/可访问性可检查 |
| `webapp-testing` | `skills/webapp-testing/SKILL.md` | A12 | 需要浏览器验证 | 应用 → 测试与截图 | 真实渲染通过 |
| `skill-creator` | `skills/skill-creator/SKILL.md` | Skill 建设 | 需要创建新 Skill | 过程 → SKILL.md | 触发/行为评测 |
| `mcp-builder` | `skills/mcp-builder/SKILL.md` | A06/A07 | 需要 MCP 服务 | 接口 → MCP server | 工具契约可测 |
| `claude-api` | `skills/claude-api/SKILL.md` | A03/A10 | 使用 Claude API | 需求 → 集成代码 | 缓存/错误处理正确 |

链接模板：`https://github.com/anthropics/skills/blob/ca45fc496a3436251f191354091d557da31c15b5/<path>`

### 2.4 Vercel Labs · `vercel-labs/agent-skills`

- 固定版本：`1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62`（2026-10-27）
- 许可证：**仓库根目录无 LICENSE，未找到明确 license 字段** → `LICENSE_UNVERIFIED`；禁止复制正文
- 状态：`REFERENCE_PINNED`（仅阅读，不 Vendor）

| Skill | 精确路径 | 阶段 | 触发 |
|---|---|---|---|
| `react-best-practices` | `skills/react-best-practices/SKILL.md` | A10 | React 实现 |
| `react-native-skills` | `skills/react-native-skills/SKILL.md` | A10 | React Native/Expo |
| `web-design-guidelines` | `skills/web-design-guidelines/SKILL.md` | A05 | Web 设计审查 |
| `composition-patterns` | `skills/composition-patterns/SKILL.md` | A06/A10 | 组件组合 |
| `deploy-to-vercel` | `skills/deploy-to-vercel/SKILL.md` | A16 | Vercel 部署（需授权） |
| `vercel-optimize` | `skills/vercel-optimize/SKILL.md` | A17 | Vercel 性能 |
| `writing-guidelines` | `skills/writing-guidelines/SKILL.md` | A18 | 文档写作 |

### 2.5 Expo · `expo/skills`

- 固定版本：`05754e71d02abe0d2d7a2fb5259ccac41f5ea59c`（2026-10-28）
- 许可证：MIT
- 状态：`REFERENCE_PINNED`；仅在 APP 路线选择 Expo/React Native 时使用

| Skill 组 | 路径前缀 | 阶段 |
|---|---|---|
| `expo-project-structure`、`expo-router`、`expo-native-ui`、`expo-ui`、`expo-design-system`、`expo-data-fetching`、`expo-dev-client`、`expo-upgrade`、`expo-brownfield`、`expo-web-to-native` | `plugins/expo/skills/<name>/SKILL.md` | A05/A06/A10 |
| `eas-build`/`eas-submit`/`eas-update`/`eas-observe`/`eas-simulator`/`eas-workflows`/`eas-hosting`/`eas-app-stores` | `plugins/expo/skills/<name>/SKILL.md` | A16/A17 |

### 2.6 Supabase · `supabase/agent-skills`

- 固定版本：`c9be0e931b7930f7d02126d04774d904c381e7d7`（2026-10-02）
- 许可证：MIT
- 状态：`REFERENCE_PINNED`

| Skill | 精确路径 | 阶段 |
|---|---|---|
| `supabase` | `skills/supabase/SKILL.md` | A07 |
| `supabase-postgres-best-practices` | `skills/supabase-postgres-best-practices/SKILL.md` | A07 |

### 2.7 框架 / CLI（不是单一 Skill）

| 项目 | 固定版本 | 许可证 | 性质 | 用法 |
|---|---|---|---|---|
| `github/spec-kit` | `4572a67fe0e72a6837e2d7bb0fda875bc41482e5`（v1.2.5） | MIT | CLI + 模板 + 工作流 | 生成 Spec/Tasks，不自动安装 Skill |
| `Fission-AI/OpenSpec` | `27c0515724decc633818c735ee596481eec78a8b`（v1.16.0） | MIT | CLI + 变更管理 + `skills/openspec-*` | 变更提案与归档；skills 需自行安装 |
| OpenAI Harness | 网页文章，无 Git SHA | 文章，非软件许可 | 概念 | 只读学习 |

### 2.8 安全审查

| 来源 | 固定版本 | 许可证 | 性质 | 状态 |
|---|---|---|---|---|
| `anthropics/claude-code-security-review` | 仓库默认分支（GitHub Action） | MIT | GitHub Action，不是 Skill | `REFERENCE_PINNED` |
| 独立 `security-review` Skill | 未找到可核验公共仓库 | — | — | `UNVERIFIED` |

宿主（如 Claude Code）内置的 `/security-review` 属于运行环境能力，不是本仓库可固定的公共 Skill。

### 2.9 Loop 参考

| 来源 | 固定版本 | 许可证 | 状态 |
|---|---|---|---|
| `anthropics/claude-code` Ralph Wiggum 插件 | `2eff7a8d21c80be48904f62ebdea36d945d7b504` | 未独立确立 | `REFERENCE_PINNED`，仅学习终止策略，不启用 |

## 3. 关系规则

- 每项活动**至多一个主用 Skill**（本地优先）。
- `equivalent_to` 仅表示语义借鉴，不表示功能等同。
- `conflicts_with` 示例：spec-kit 与 OpenSpec 定位重叠；同一活动只选一个主流程。
- `replaces`：本仓库当前没有用外部 Skill 替换本地 Skill。
- 外部 Skill 一律 `USER_EXPLICIT` 触发；不自动安装、不 Vendor。
- 验证分层：`STATIC_CHECK → INSTALL → AGENT_DISCOVERY → AGENT_INVOCATION → REAL_PROJECT_EFFECT`，不可互相替代。

## 4. 覆盖矩阵（需求 → 来源 → 阶段 → Skill → 文档 → 验收）

| 活动 | 报告来源 | 权威阶段 | 主用 Skill（本地/外部） | 文档位置 | 验收状态 |
|---|---|---|---|---|---|
| A01 需求发现 | 任务简报摘要；本地方法文档 | intake, discovery | `project-discovery` / `grill-with-docs` | [Guide A01](FULLSTACK-LIFECYCLE-GUIDE.md#a01--需求发现) | DOCUMENTED |
| A02 用户研究 | 任务简报摘要 | discovery | `project-discovery` / `grilling` | [Guide A02](FULLSTACK-LIFECYCLE-GUIDE.md#a02--用户研究与价值判断) | DOCUMENTED |
| A03 AI-native 设计 | 任务简报摘要；本仓 AI 设计文档 | specification, architecture | `specification` / 本仓 playbook | [Guide A03](FULLSTACK-LIFECYCLE-GUIDE.md#a03--ai-native-产品设计) | DOCUMENTED |
| A04 PRD/Spec/AC | 任务简报摘要 | specification | `specification` / `to-spec` | [Guide A04](FULLSTACK-LIFECYCLE-GUIDE.md#a04--prdspec-与验收标准) | DOCUMENTED |
| A05 UI/UX | 任务简报摘要 | specification, architecture | `specification` / `frontend-design` | [Guide A05](FULLSTACK-LIFECYCLE-GUIDE.md#a05--uiux-与交互设计) | DOCUMENTED |
| A06 架构/ADR | 任务简报摘要 | architecture | `architecture` / `codebase-design` | [Guide A06](FULLSTACK-LIFECYCLE-GUIDE.md#a06--技术架构及-adr) | DOCUMENTED |
| A07 DB/API/权限 | 任务简报摘要 | architecture, implementation | `architecture` / `supabase` | [Guide A07](FULLSTACK-LIFECYCLE-GUIDE.md#a07--数据库api-与认证权限) | DOCUMENTED |
| A08 Tracer Tickets | 任务简报摘要 | planning | `implementation-plan` / `to-tickets` | [Guide A08](FULLSTACK-LIFECYCLE-GUIDE.md#a08--纵向-tracer-tickets) | DOCUMENTED |
| A09 Harness | 任务简报摘要；OpenAI 文章 | planning, implementation | `implementation-plan` | [Guide A09](FULLSTACK-LIFECYCLE-GUIDE.md#a09--harness-与-agent-执行环境) | DOCUMENTED |
| A10 实现 | 任务简报摘要 | implementation | `implementation-plan` / `implement`+`tdd`（外部） | [Guide A10](FULLSTACK-LIFECYCLE-GUIDE.md#a10--前后端完整功能实现) | DOCUMENTED |
| A11 TDD/契约 | 任务简报摘要 | implementation, verification | `verification` / `tdd` | [Guide A11](FULLSTACK-LIFECYCLE-GUIDE.md#a11--tdd集成测试与契约测试) | DOCUMENTED |
| A12 E2E/UX QA | 任务简报摘要 | verification | `verification` / `webapp-testing` | [Guide A12](FULLSTACK-LIFECYCLE-GUIDE.md#a12--浏览器-e2e-和-ux-qa) | DOCUMENTED |
| A13 调试 | 任务简报摘要 | discovery, implementation, operation | `systematic-debugging` | [Guide A13](FULLSTACK-LIFECYCLE-GUIDE.md#a13--故障诊断与根因分析) | DOCUMENTED |
| A14 双轴审查 | 任务简报摘要 | review | `code-review` | [Guide A14](FULLSTACK-LIFECYCLE-GUIDE.md#a14--独立双轴代码审查) | DOCUMENTED |
| A15 安全审计 | 任务简报摘要 | architecture, verification, review | `code-review` / security action | [Guide A15](FULLSTACK-LIFECYCLE-GUIDE.md#a15--安全隐私和权限审计) | DOCUMENTED |
| A16 CI/CD/发布 | 任务简报摘要 | verification, release | `verification` / spec-kit/OpenSpec | [Guide A16](FULLSTACK-LIFECYCLE-GUIDE.md#a16--cicd-与发布) | DOCUMENTED |
| A17 监控/运营 | 任务简报摘要 | operation | `systematic-debugging` / expo-observe | [Guide A17](FULLSTACK-LIFECYCLE-GUIDE.md#a17--监控恢复和运营) | DOCUMENTED |
| A18 文档/复盘 | 任务简报摘要 | release, operation, postmortem | `documentation-sync` / `retro` | [Guide A18](FULLSTACK-LIFECYCLE-GUIDE.md#a18--文档交接和复盘) | DOCUMENTED |

> `DOCUMENTED` 只表示文档覆盖，不表示 Skill 已安装或项目已执行。R1/R2/R3 完整原文 `SOURCE_UNAVAILABLE`，来源列使用任务简报结构摘要。

## 5. 核验方法与限制

- 所有外部路径通过 GitHub API `git/trees/<sha>?recursive=1` 读取，确认 `SKILL.md` 存在。
- 许可证通过仓库 `LICENSE` / 目录 `LICENSE.txt` 与 GitHub license 元数据读取。
- **未逐文件阅读每个 SKILL.md 的行为**；未安装、未执行、未做 Agent 触发评测。
- 版本会漂移；引用前必须重新核对 commit、路径与许可证。
