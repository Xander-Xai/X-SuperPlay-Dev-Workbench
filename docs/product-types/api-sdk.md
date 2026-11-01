# API-first 服务 / SDK：初步独立开发路线

> **状态：`RESEARCH_PLACEHOLDER / NOT_RUNTIME_ROUTE / NOT_REAL_PROJECT_VERIFIED`**。资料核对：2026-11-02。本文是专用品类占位，不是已注册的 CLI `type`、不是完整可执行 Route Pack，也不是平台审核回执。

## 1. 适用范围 / 排除

- **交付对象**：面向开发者的 API、Webhook 接口、SDK 或按调用计费服务。
- **不要混用**：API 合同不能被通用后端 Profile 完全替代；客户端另走对应载体路线。
- **可参考但不代表已支持的 Profile**：backend。
- **扩展优先级**：P1（仅路线建设顺序）。

## 2. 从需求到交付：对应权威 11 阶段

| 权威阶段映射 | 本品类应做什么 | 最低产物 |
|---|---|---|
| `intake / discovery` | 确认 API 消费者、SLO、配额和价格/授权边界 | 需求简报/授权/用户旅程 |
| `specification` | 规定 OpenAPI、分页、错误码、版本兼容和弃用 AC | Spec/AC 与负例 |
| `architecture` | 设计认证、API Key 轮换、幂等、限流、Webhook 威胁模型 | ADR/信任与部署边界 |
| `planning` | API 鉴权→一次读写→SDK 错误处理做纵切 | Tickets/预算/停止条件 |
| `implementation` | 实现 API、契约校验和一个最小 SDK | 可运行纵向切片与测试 |
| `verification / review` | 测试对象级授权、限流、负载、SDK 兼容；独立 Review | 实际测试结果/独立 Review |
| `release` | 部署 API、发布版本化文档/SDK 与回滚记录 | 构建/发布/回滚回执 |
| `operation / postmortem` | 监控调用、错误、配额和消费者版本 | 运维观测/复盘报告 |

> 为首次阅读将部分连续阶段并排呈现，但每个原始阶段仍由 `src/catalog.mjs` 统一定义，不能凭此表自行跳过对应 Gate。

## 3. 候选 Skills 与必需工具

- **本品类优先学习/按需装配**：`specification`、`architecture`、`implementation`、`verification`、`security-review`、`release-engineering`。它们属于仓库已有 14 个候选 Skill，未因本文执行、安装或晋级。
- **不能让 Skill 代替的工具/账号**：OpenAPI、契约测试、SDK 打包与压测。外部平台、设备和真实发布权仍需人工授权。

## 4. 本品类真正不同的验收

- **首批必须设计的负例**：BOLA 越权、无鉴权接口、Webhook 重放、破坏性版本升级。
- **关键发布 Gate**：OpenAPI/真实 API 一致、限流/鉴权负例及 SDK 安装回执。未执行或未获授权必须写为 `NOT_RUN` / `BLOCKED`；不得由 Mock/CI 绿替代。
- **首张 Ticket 建议**：API 鉴权→一次读写→SDK 错误处理做纵切；先满足一个端到端成功路径和至少一个失败路径，并记录实际环境、命令、结果与工件。

## 5. 官方资料与升级界线

- 主要依据：[平台/标准官方入口](https://spec.openapis.org/oas/)。更新平台规则前重新核查原文，本文不永久保证资质、审核或 API 版本要求。
- **从研究占位升级的条件**：独立 `PREFLIGHT` + Route SOP + 每阶段产物/退出标准 + 专属负例和 Gate + 技术栈分支 + 新旧路由兼容测试 + 至少一次授权真实项目验证。当前全部未执行。

返回 [产品品类导航](README.md)。
