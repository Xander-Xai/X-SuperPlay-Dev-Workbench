# 工作流自动化 / 系统集成：初步独立开发路线

> **状态：`RESEARCH_PLACEHOLDER / NOT_RUNTIME_ROUTE / NOT_REAL_PROJECT_VERIFIED`**。资料核对：2026-11-02。本文是专用品类占位，不是已注册的 CLI `type`、不是完整可执行 Route Pack，也不是平台审核回执。

## 1. 适用范围 / 排除

- **交付对象**：n8n、Coze、Dify 等确定性触发器、定时器及系统集成。
- **不要混用**：不默认等于 Agent；只有需要动态规划及工具调用时叠加 agent。
- **可参考但不代表已支持的 Profile**：backend（按需）。
- **扩展优先级**：P1（仅路线建设顺序）。

## 2. 从需求到交付：对应权威 11 阶段

| 权威阶段映射 | 本品类应做什么 | 最低产物 |
|---|---|---|
| `intake / discovery` | 画触发、输入、目标动作和失败影响图 | 需求简报/授权/用户旅程 |
| `specification` | 定义事件 schema、幂等、重试/超时 AC | Spec/AC 与负例 |
| `architecture` | 设计状态存储、补偿、死信和凭据边界 | ADR/信任与部署边界 |
| `planning` | 触发→一个动作→失败告警作为纵切 | Tickets/预算/停止条件 |
| `implementation` | 实现有版本的工作流，分离测试/生产入口 | 可运行纵向切片与测试 |
| `verification / review` | 测试 429/超时/重复/乱序，审核授权和日志脱敏 | 实际测试结果/独立 Review |
| `release` | 人工授权生产启用、记录停用/回放和回滚 | 构建/发布/回滚回执 |
| `operation / postmortem` | 监控失败率、队列积压及补偿 | 运维观测/复盘报告 |

> 为首次阅读将部分连续阶段并排呈现，但每个原始阶段仍由 `src/catalog.mjs` 统一定义，不能凭此表自行跳过对应 Gate。

## 3. 候选 Skills 与必需工具

- **本品类优先学习/按需装配**：`project-discovery`、`specification`、`architecture`、`implementation`、`verification`、`security-review`。它们属于仓库已有 14 个候选 Skill，未因本文执行、安装或晋级。
- **不能让 Skill 代替的工具/账号**：官方工作流环境、测试/生产 Webhook、外部接口沙箱。外部平台、设备和真实发布权仍需人工授权。

## 4. 本品类真正不同的验收

- **首批必须设计的负例**：重复回调、乱序、超时/429、部分写入、重放损坏。
- **关键发布 Gate**：真实触发端→目标系统端到端回执及异常告警/补偿。未执行或未获授权必须写为 `NOT_RUN` / `BLOCKED`；不得由 Mock/CI 绿替代。
- **首张 Ticket 建议**：触发→一个动作→失败告警作为纵切；先满足一个端到端成功路径和至少一个失败路径，并记录实际环境、命令、结果与工件。

## 5. 官方资料与升级界线

- 主要依据：[平台/标准官方入口](https://docs.n8n.io/build/flow-logic/handle-errors-gracefully)。更新平台规则前重新核查原文，本文不永久保证资质、审核或 API 版本要求。
- **从研究占位升级的条件**：独立 `PREFLIGHT` + Route SOP + 每阶段产物/退出标准 + 专属负例和 Gate + 技术栈分支 + 新旧路由兼容测试 + 至少一次授权真实项目验证。当前全部未执行。

返回 [产品品类导航](README.md)。
