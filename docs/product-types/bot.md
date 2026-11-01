# 消息平台机器人（飞书/钉钉/Slack/Discord）：初步独立开发路线

> **状态：`RESEARCH_PLACEHOLDER / NOT_RUNTIME_ROUTE / NOT_REAL_PROJECT_VERIFIED`**。资料核对：2026-11-02。本文是专用品类占位，不是已注册的 CLI `type`、不是完整可执行 Route Pack，也不是平台审核回执。

## 1. 适用范围 / 排除

- **交付对象**：宿主群组事件、命令、组织安装与消息处理。
- **不要混用**：不同消息平台 API/权限/分发机制必须分支处理，不与一般 AI Agent 混称。
- **可参考但不代表已支持的 Profile**：backend；ai-application/agent（可选）。
- **扩展优先级**：P1（仅路线建设顺序）。

## 2. 从需求到交付：对应权威 11 阶段

| 权威阶段映射 | 本品类应做什么 | 最低产物 |
|---|---|---|
| `intake / discovery` | 确认目标宿主、组织安装授权与管理员边界 | 需求简报/授权/用户旅程 |
| `specification` | 定义消息/命令、角色、审批与权限拒绝 AC | Spec/AC 与负例 |
| `architecture` | 设计 OAuth scopes、签名校验、幂等、回调队列 | ADR/信任与部署边界 |
| `planning` | 命令→授权→回复→失败告警纵切 | Tickets/预算/停止条件 |
| `implementation` | 用宿主 SDK 编写最小 Bot 和安装配置 | 可运行纵向切片与测试 |
| `verification / review` | 真实测试工作区回放事件/撤权/限流；安全 Review | 实际测试结果/独立 Review |
| `release` | 按宿主发布/卸载，保存回执与恢复路径 | 构建/发布/回滚回执 |
| `operation / postmortem` | 跟踪消息投递、权限失效和误回复 | 运维观测/复盘报告 |

> 为首次阅读将部分连续阶段并排呈现，但每个原始阶段仍由 `src/catalog.mjs` 统一定义，不能凭此表自行跳过对应 Gate。

## 3. 候选 Skills 与必需工具

- **本品类优先学习/按需装配**：`project-discovery`、`specification`、`architecture`、`implementation`、`verification`、`security-review`、`release-engineering`。它们属于仓库已有 14 个候选 Skill，未因本文执行、安装或晋级。
- **不能让 Skill 代替的工具/账号**：宿主开放平台、OAuth/事件签名、测试工作区。外部平台、设备和真实发布权仍需人工授权。

## 4. 本品类真正不同的验收

- **首批必须设计的负例**：撤销安装后仍可用、事件重放、消息风暴、越权频道访问。
- **关键发布 Gate**：真实宿主安装/卸载、权限拒绝、签名及投递回执。未执行或未获授权必须写为 `NOT_RUN` / `BLOCKED`；不得由 Mock/CI 绿替代。
- **首张 Ticket 建议**：命令→授权→回复→失败告警纵切；先满足一个端到端成功路径和至少一个失败路径，并记录实际环境、命令、结果与工件。

## 5. 官方资料与升级界线

- 主要依据：[平台/标准官方入口](https://docs.slack.dev/authentication/installing-with-oauth/)。更新平台规则前重新核查原文，本文不永久保证资质、审核或 API 版本要求。
- **从研究占位升级的条件**：独立 `PREFLIGHT` + Route SOP + 每阶段产物/退出标准 + 专属负例和 Gate + 技术栈分支 + 新旧路由兼容测试 + 至少一次授权真实项目验证。当前全部未执行。

返回 [产品品类导航](README.md)。
