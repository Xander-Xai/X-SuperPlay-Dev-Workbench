# AI-Native Full-Stack Delivery · 方法视图

本文件是 `src/delivery.mjs` 的人类可读导航。它**不是**第二套生命周期：11 阶段、任务路由、Profiles 与证据模型仍是唯一权威（见 [ARCHITECTURE.md](ARCHITECTURE.md)）。

本文件与 `docs/methods/` 的关系：`docs/methods/` 是完整方法文档（范式、上游来源、灯塔试点、AI 产品/Agent 设计、Skill 工厂）；本文件是其上的**机器可读兼容视图**（8 宏阶段 / 18 活动 / 交付 Gate）。`xeng method` 同时服务两者。

## 三层关系

~~~text
8 宏阶段 G0–G7      （汇报 / 学习视图）
        │ 映射
18 项详细活动 A01–A18 （操作视图）
        │ 映射
11 权威阶段           （唯一状态机，src/catalog.mjs）
        │
        ▼
证据模型 + 商业交付状态（CODE_TESTED → … → CONSUMER_ACCEPTED）
~~~

校验由 `validateDelivery()` 完成，并已接入 `validateCatalog()` / `npm run check`：

- 8 宏阶段恰好覆盖 11 阶段一次，无孤儿、无重复权威。
- 18 活动覆盖全部 11 阶段；每项有且仅有一个主用 Skill。
- 宏阶段顺序固定，无循环。

## CLI

~~~bash
node tools/xeng.mjs method                 # 默认打印完整方法文档 overview
node tools/xeng.mjs method activities      # 列出 8 宏阶段与 18 活动
node tools/xeng.mjs method activities --json
node tools/xeng.mjs method A04             # 查看单项活动全部字段
node tools/xeng.mjs method A04 --json
node tools/xeng.mjs method --template      # 生成 Markdown 矩阵模板
node tools/xeng.mjs method matrix          # 11 阶段 × 宏阶段 × 活动
node tools/xeng.mjs matrix --json
node tools/xeng.mjs delivery --json        # 交付状态、Loop、Ticket 契约、四路线、AI Overlay
node tools/xeng.mjs skills-matrix --json   # 本地/外部 Skills 与验证层
~~~

## 每项活动包含什么

| 字段 | 含义 |
|---|---|
| `id` / `name` | A01–A18 |
| `stages` | 映射的权威阶段 |
| `knowledge` | 必备工程知识 |
| `inputs` | 前置条件与输入 |
| `humanDecisions` | 人类负责的决定 |
| `agentOperations` | Agent 可执行的操作 |
| `primarySkill` / `alternateSkills` | 主用 / 替代 Skill（本地 8 个候选） |
| `skillNote` | 来源、许可与验证状态 |
| `tools` | CLI / 工具 / 框架 |
| `outputs` | 可审查工件 |
| `happyPath` / `negative` | 正常路径 / 负向验收 |
| `stopConditions` | STOP / BLOCKED |
| `deterministicControls` | 可升级为确定性检查的控制 |
| `greenfield` / `brownfield` | 两种入口的特殊要求 |

## 有界执行环

`PREPARE → RED → IMPLEMENT → GREEN → REFACTOR → VERIFY → REVIEW → RECORD → STOP_OR_NEXT`

终止状态映射到既有证据状态，额外原因写入结构化 `stop_reason`：

| 终止状态 | 证据状态 |
|---|---|
| VERIFIED | VERIFIED |
| BLOCKED | BLOCKED |
| HUMAN_REQUIRED | BLOCKED |
| NO_PROGRESS | UNKNOWN |
| BUDGET_EXCEEDED | UNKNOWN |
| SECURITY_STOP | BLOCKED |
| SCOPE_DRIFT | BLOCKED |

初始参数：单 Ticket 最多 3 次尝试、Review-Fix 最多 2 轮、单执行窗口 1 个活动 Ticket。保守值，可收紧不可放宽安全边界。

## Ticket Harness 契约

`xeng method` / `xeng delivery --json` 暴露字段；`src/starter.mjs` 生成的每张 Ticket 已带：

`ticket_id, spec_id, base_sha, accepted_AC, blocked_by, allowed_files, allowed_commands, forbidden_actions, negative_tests, iteration_budget, time_budget, external_cost_budget, stop_conditions, rollback, evidence_paths, reviewer`

状态：`CONTRACT_DEFINED_NOT_RUNTIME_ENFORCED`。字段已定义并生成，**工具层强制（文件锁、命令白名单执行）尚未实现**。

## 商业交付 Gate

| 状态 | 含义 | 不能被谁替代 |
|---|---|---|
| `CODE_TESTED` | 对最终代码真实执行测试 | 不等于 CI / 部署 / 验收 |
| `CI_VERIFIED` | 目标 SHA 的远端必需检查成功 | 不等于预发 / 发布 / 验收 |
| `STAGING_VERIFIED` | 预发环境主路径与迁移通过 | 不等于生产发布 |
| `RELEASED` | 真实部署或商店发布有平台回执 | 不等于用户验收 |
| `CONSUMER_ACCEPTED` | 真实消费者按 AC 验收 | 不可由自动化替代 |

## 四路线与 AI Overlay

- SaaS / 企业 / 小程序 / APP 的覆盖清单见 `PLATFORM_BRANCHES`，与 `ROUTE_SOPS` 一一对应。
- AI Overlay（LLM / RAG / Agent / 多 Agent / 自动化工作流 / AI-native UX）**不能绕过底层平台权限 Gate**。
- AI 能力需要 `eval`、`integration-probe`、`review`；假模型、静态扫描、CI 通过不能替代真实评测。

## Skills 选择

- 本地 8 个候选均为 `CANDIDATE`，`UNLICENSED-PROPRIETARY`。
- 外部 Skills 仅 `USER_EXPLICIT` 触发，不自动安装、不 Vendor。
- 许可证未知（`anthropics/skills`、`vercel-labs/agent-skills`）时禁止复制正文。
- 验证分层：`STATIC_CHECK → INSTALL → AGENT_DISCOVERY → AGENT_INVOCATION → REAL_PROJECT_EFFECT`，不可互相替代。

## 学习路径

`LEARNING_PATH` 绑定真实 Ticket：

- 0–30 天：一个真实可运行、可验证的 Web MVP。
- 31–90 天：企业业务系统 + Agent 工作流 + 可选小程序分支。
- 映射：市场需求 → 真实任务 → 能力缺口 → 最小知识学习 → Skill 辅助 → 代码实现 → 测试证据 → 复盘。
- 已有 Python / FastAPI / RAG / LangGraph 基础不重复学习。

## 边界

- 本视图不新增 Gate、不自动安装 Skill、不提升任何证据状态。
- 真实测试、部署、验收留在目标项目仓。
- 三报告整合细节与未验证项见 [research/2026-10-31-ai-native-fullstack-synthesis.md](research/2026-10-31-ai-native-fullstack-synthesis.md)。
