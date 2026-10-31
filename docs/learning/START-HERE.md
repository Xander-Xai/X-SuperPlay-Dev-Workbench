# START HERE · AI-Native 全栈交付学习体系

本目录是 Workbench 的**学习与操作文档入口**。目标只有一个：让已经具备 Python / FastAPI / RAG / Agent 基础、但缺少商业级完整项目经验的人，能够按文档理解并执行从需求到交付的完整流程。

> 本目录是文档，不是运行时能力。它不安装任何第三方 Skill，不启动自动 Loop，不部署网站，也不代表任何真实项目已交付。

## 单一导航链

```text
README
  → docs/METHOD.md（机器可读方法视图）
  → docs/learning/START-HERE.md（本页）
  → docs/learning/FULLSTACK-LIFECYCLE-GUIDE.md（18 活动知识）
  → docs/learning/STAGE-TO-SKILL-MATRIX.md（Skill 映射与来源）
  → docs/learning/AGENT-PROMPT-RECIPES.md（可复制提示词）
  → docs/learning/PRODUCT-GUIDES.md（四类产品 + 静态 Web + Greenfield/Brownfield + AI Overlay）
  → docs/learning/KNOWLEDGE-ROADMAP.md（L1–L6 学习路线 + 30/60 天）
  → docs/learning/ACCEPTANCE-CHECKLIST.md（文档验收与覆盖矩阵）
```

权威生命周期始终是 `src/catalog.mjs` 的 11 个阶段。8 宏阶段（G0–G7）与 18 项活动（A01–A18）是**兼容视图**，定义在 `src/delivery.mjs`，不构成第二套状态机。

## 状态图例

| 标记 | 含义 |
|---|---|
| `DOCUMENTED` | 本仓库有可阅读、可核对的文档 |
| `CANDIDATE` | 本地 Skill 正文可审查，未在真实项目执行 |
| `REFERENCE_PINNED` | 上游来源有固定 commit/tag，未安装、未执行 |
| `LICENSE_VERIFIED` | 已核对许可证与再分发边界 |
| `LICENSE_UNVERIFIED` | 未找到明确许可证；禁止复制正文 |
| `UNVERIFIED` | 缺少证据，不得当作事实 |
| `NOT_RUN` | 未执行 |
| `BLOCKED` | 缺少授权或外部条件 |
| `SOURCE_UNAVAILABLE` | 原始报告全文不在授权目录 |

## 这份学习体系覆盖什么

- 11 个权威工程阶段，以及 18 项活动的意义、输入、知识、Skill、提示词、产出、验收、失败处理、下一步与跳过代价。
- 外部 GitHub Skills 的真实仓库、精确路径、固定 commit/tag、许可证、触发条件与验收方式。
- 四类产品（SaaS、企业 Web、微信小程序、移动 APP）的完整流程，以及静态 Web、Greenfield/Brownfield、AI Overlay。
- 从 L1 到 L6 的学习层级与 30+60 天路线（学习层级，不是工程成熟度 L0–L6）。

## 这份学习体系不覆盖什么

- 不证明任何真实项目、设备、部署或客户验收。`REAL_PROJECT_DOGFOOD = NOT_RUN / BLOCKED`。
- 不把本地 8 个候选 Skill 写成已验证。它们全部是 `CANDIDATE`。
- 不把外部 Skill 仓库整体等同于“其中每个 Skill 都可用”。
- 不把文档完成写成运行时实现完成。`RUNTIME_IMPLEMENTATION` 本轮保持不变。

## 研究来源状态

R1《AI-Native 全栈产品交付能力体系深度研究报告》、R2《AI-Native Full-Stack Delivery Capability System》、R3《AI 原生全栈软件交付能力体系研究报告》的**完整原文仍不在授权目录**，标记 `SOURCE_UNAVAILABLE`。本学习体系使用任务简报提供的结构摘要、本仓库既有方法文档和可核验的上游仓库事实；未声称逐段全文验收。

详见 [三报告整合与证据对账](../research/2026-10-31-ai-native-fullstack-synthesis.md)。

## 建议阅读顺序

1. 先读 [FULLSTACK-LIFECYCLE-GUIDE.md](FULLSTACK-LIFECYCLE-GUIDE.md) 的“总览”，建立 11 阶段 / 8 宏阶段 / 18 活动的整体地图。
2. 按活动顺序读 A01–A18；每节都回答同样的 15 个问题。
3. 读 [STAGE-TO-SKILL-MATRIX.md](STAGE-TO-SKILL-MATRIX.md)，确认每个阶段该用什么 Skill、来源和验收。
4. 读 [AGENT-PROMPT-RECIPES.md](AGENT-PROMPT-RECIPES.md)，复制提示词到你自己的项目会话。
5. 读 [PRODUCT-GUIDES.md](PRODUCT-GUIDES.md)，按你的产品类型选择路线。
6. 读 [KNOWLEDGE-ROADMAP.md](KNOWLEDGE-ROADMAP.md)，规划 30+60 天学习。
7. 用 [ACCEPTANCE-CHECKLIST.md](ACCEPTANCE-CHECKLIST.md) 自检文档覆盖是否完整。

## 边界

- 本目录只做文档，不修改 `src/`、`tools/`、`skills/`、`test/`。
- 不安装、不 Vendor、不自动执行任何第三方 Skill。
- 提示词只作为学习素材；本轮不执行其中的产品开发、部署、安装或外部写入。
