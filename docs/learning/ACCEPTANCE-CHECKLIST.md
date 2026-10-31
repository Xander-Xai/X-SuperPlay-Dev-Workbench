# 文档验收清单与覆盖矩阵

> 本页记录本轮文档任务的验收结果。`DOCUMENTED` 只表示文档覆盖，不表示运行时实现或真实项目执行。

## 1. 十六项文档验收

| # | 检查项 | 结论 | 证据 |
|---|---|---|---|
| 1 | 18 个活动全部有详细说明 | PASS | [FULLSTACK-LIFECYCLE-GUIDE.md](FULLSTACK-LIFECYCLE-GUIDE.md) A01–A18，每项回答 15 问 |
| 2 | 11 个权威阶段没有被替换 | PASS | 文档统一引用 `src/catalog.mjs`；未定义新阶段 |
| 3 | 8 个宏阶段映射正确 | PASS | [Guide 总览](FULLSTACK-LIFECYCLE-GUIDE.md#总览) + `src/delivery.mjs` `validateDelivery()` |
| 4 | 每个活动至少一个可解释的 Skill/工具选择 | PASS | [STAGE-TO-SKILL-MATRIX.md](STAGE-TO-SKILL-MATRIX.md) 覆盖矩阵 |
| 5 | Skills 原始链接真实且可核验 | PASS（含 LICENSE_UNVERIFIED 标注） | 本页 §3；GitHub API 核验 2026-10-31 |
| 6 | Skill 调用方式有可阅读说明 | PASS | [AGENT-PROMPT-RECIPES.md](AGENT-PROMPT-RECIPES.md) + 矩阵“触发/输入输出” |
| 7 | 每个阶段有输入/输出/验收/失败/下一步 | PASS | [Guide](FULLSTACK-LIFECYCLE-GUIDE.md) 每节 15 问 |
| 8 | 四类产品路线完整 | PASS | [PRODUCT-GUIDES.md](PRODUCT-GUIDES.md) |
| 9 | Greenfield/Brownfield 入口完整 | PASS | [PRODUCT-GUIDES.md#greenfield--brownfield-入口](PRODUCT-GUIDES.md#greenfield--brownfield-入口) |
| 10 | AI Overlay 与底层安全义务正确 | PASS | [PRODUCT-GUIDES.md#ai-overlay](PRODUCT-GUIDES.md#ai-overlay) |
| 11 | 30+60 天学习路线明确 | PASS | [KNOWLEDGE-ROADMAP.md](KNOWLEDGE-ROADMAP.md) |
| 12 | 不存在重复、冲突的权威流程 | PASS | 单一权威：`src/catalog.mjs`；本文只做兼容视图 |
| 13 | README 能直接导航到学习入口 | PASS | README “学习入口”链接到 [START-HERE.md](START-HERE.md) |
| 14 | 没有把候选 Skills 标记为已验证 | PASS | 本地 8 个全部 `CANDIDATE`；外部 `REFERENCE_PINNED` |
| 15 | 没有把文档完成写成开发运行能力完成 | PASS | 本页 §4 与各文档边界声明 |
| 16 | 不存在未经授权安装或运行第三方代码 | PASS | 本轮只读 API + Markdown；未安装、未执行 |

## 2. 覆盖矩阵（需求 → 来源 → 阶段 → Skill → 文档 → 验收）

完整矩阵见 [STAGE-TO-SKILL-MATRIX.md §4](STAGE-TO-SKILL-MATRIX.md#4-覆盖矩阵需求--来源--阶段--skill--文档--验收)。摘要：

| 范围 | 覆盖 |
|---|---|
| A01–A18 | 全部有专节，映射到 11 阶段 |
| G0–G7 | 全部映射到 11 阶段，无孤儿 |
| 四类产品 | SaaS / 企业 / 小程序 / APP 全部有独立指南 |
| 横切 | 静态 Web、Greenfield/Brownfield、AI Overlay、专用工具 |
| Skills | 8 本地候选 + 7 组外部来源 + 2 框架 + 1 安全 Action |
| 学习 | L1–L6 + 30/60 天 |

## 3. Skills 来源核验摘要

| 来源 | 固定版本 | 许可证 | 状态 |
|---|---|---|---|
| mattpocock/skills | `5beb35b…`（v1.3.1 commit `24fe0ef…`） | MIT | REFERENCE_PINNED |
| obra/superpowers | `2ce8aa15…`（v7.0.1） | MIT | REFERENCE_PINNED |
| anthropics/skills | `ca45fc49…` | Apache-2.0（已核对 frontend-design / webapp-testing / skill-creator 的 `LICENSE.txt`；根目录无统一 LICENSE） | REFERENCE_PINNED |
| vercel-labs/agent-skills | `1a2c79d4…` | LICENSE_UNVERIFIED | REFERENCE_PINNED |
| expo/skills | `05754e71…` | MIT | REFERENCE_PINNED |
| supabase/agent-skills | `c9be0e93…` | MIT | REFERENCE_PINNED |
| github/spec-kit | `4572a67f…`（v1.2.5） | MIT | 框架/CLI |
| Fission-AI/OpenSpec | `27c05157…`（v1.16.0） | MIT | 框架/CLI + skills |
| anthropics/claude-code-security-review | 默认分支 | MIT | GitHub Action |
| 独立 security-review Skill | — | — | UNVERIFIED |

核验方式：GitHub API `git/trees/<sha>?recursive=1` 与 `contents/.../LICENSE`。未逐文件阅读行为，未安装、未执行、未做 Agent 触发评测。

## 4. 最终状态

| 状态项 | 结论 | 说明 |
|---|---|---|
| `METHODOLOGY_DOCUMENTED` | PASS | 方法入口与 8/18/11 视图已文档化 |
| `LIFECYCLE_DOCUMENTED` | PASS | 11 权威阶段 + 8 宏阶段 + 18 活动 |
| `STAGE_KNOWLEDGE_DOCUMENTED` | PASS | 每活动 15 问 |
| `SKILL_MAPPING_DOCUMENTED` | PASS | 含来源、版本、许可证、触发、验收 |
| `SKILL_USAGE_GUIDE_DOCUMENTED` | PASS | 18 份提示词 + 调用说明 |
| `LEARNING_PATH_DOCUMENTED` | PASS | L1–L6 + 30/60 天 |
| `RESEARCH_RECONCILIATION` | PARTIAL | R1/R2/R3 全文 `SOURCE_UNAVAILABLE` |
| `DELIVERY_COMPATIBILITY_VIEW` | IMPLEMENTED | `src/delivery.mjs`；`xeng method / matrix / delivery / skills-matrix`；`validateDelivery()` 已接入 `npm run check`；Ticket 契约字段已生成 |
| `HARNESS_LOOP_RUNTIME` | NOT_IMPLEMENTED | `allowed_files` / `allowed_commands` 仅字段；无文件锁、命令白名单执行或 Loop Runner |
| `RUNTIME_DOCS_COMMIT` | UNCHANGED_BY_DOCS_COMMIT | 本次文档提交未修改 `src/`、`tools/`、`skills/`、`test/`；分支已包含 delivery 兼容视图改动 |
| `REAL_PROJECT_DOGFOOD` | NOT_RUN / BLOCKED | 无授权真实项目 |

## 5. 仍未验证

- R1/R2/R3 完整原文逐段对账。
- 外部 Skill 的行为、触发评测与真实项目效果。
- 任何真实项目、设备、部署、客户验收。
- 运行时 Harness 强制与 Loop Runner。

## 6. 本轮不修改的内容

- 文档提交本身不修改 `src/`、`tools/`、`skills/`、`test/`；分支中已有的 delivery 兼容视图改动见 §4。
- 未安装、未 Vendor、未执行任何第三方 Skill。
- 未实现 Harness 文件锁 / 命令白名单强制与 Loop Runner。
- 未部署、未发布、未自动合并。
