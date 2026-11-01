# 生态插件（VS Code / Figma / WordPress）：初步独立开发路线

> **状态：`RESEARCH_PLACEHOLDER / NOT_RUNTIME_ROUTE / NOT_REAL_PROJECT_VERIFIED`**。资料核对：2026-11-02。本文是专用品类占位，不是已注册的 CLI `type`、不是完整可执行 Route Pack，也不是平台审核回执。

## 1. 适用范围 / 排除

- **交付对象**：第三方应用宿主里的插件、工具面板或扩展。
- **不要混用**：三个生态各自是不同 SDK 与审核；一个文档只能作为选宿主前的独立占位。
- **可参考但不代表已支持的 Profile**：web/cli（仅部分复用）。
- **扩展优先级**：P2（仅路线建设顺序）。

## 2. 从需求到交付：对应权威 11 阶段

| 权威阶段映射 | 本品类应做什么 | 最低产物 |
|---|---|---|
| `intake / discovery` | 先锁定唯一宿主与版本、商店政策和用户权限 | 需求简报/授权/用户旅程 |
| `specification` | 定义宿主命令、读写数据、沙箱及升级 AC | Spec/AC 与负例 |
| `architecture` | 设计插件 manifest、宿主 API、UI/Worker 安全边界 | ADR/信任与部署边界 |
| `planning` | 做一次宿主命令→可见结果的纵切 | Tickets/预算/停止条件 |
| `implementation` | 用该宿主 SDK 构建可加载插件包 | 可运行纵向切片与测试 |
| `verification / review` | 实装测试权限、升级、卸载与性能；安全 Review | 实际测试结果/独立 Review |
| `release` | 签署版本、向对应市场分发并保存审核回执 | 构建/发布/回滚回执 |
| `operation / postmortem` | 监测宿主 SDK 破坏性变更 | 运维观测/复盘报告 |

> 为首次阅读将部分连续阶段并排呈现，但每个原始阶段仍由 `src/catalog.mjs` 统一定义，不能凭此表自行跳过对应 Gate。

## 3. 候选 Skills 与必需工具

- **本品类优先学习/按需装配**：`specification`、`architecture`、`implementation`、`verification`、`security-review`、`release-engineering`。它们属于仓库已有 14 个候选 Skill，未因本文执行、安装或晋级。
- **不能让 Skill 代替的工具/账号**：VSIX/Figma manifest/宿主 Marketplace SDK。外部平台、设备和真实发布权仍需人工授权。

## 4. 本品类真正不同的验收

- **首批必须设计的负例**：宿主升级破坏 API、文件越权、网络白名单过宽、插件卡顿。
- **关键发布 Gate**：在指定宿主的真实版本运行及插件市场或受控分发回执。未执行或未获授权必须写为 `NOT_RUN` / `BLOCKED`；不得由 Mock/CI 绿替代。
- **首张 Ticket 建议**：做一次宿主命令→可见结果的纵切；先满足一个端到端成功路径和至少一个失败路径，并记录实际环境、命令、结果与工件。

## 5. 官方资料与升级界线

- 主要依据：[平台/标准官方入口](https://developers.figma.com/docs/plugins/manifest/)。更新平台规则前重新核查原文，本文不永久保证资质、审核或 API 版本要求。
- **从研究占位升级的条件**：独立 `PREFLIGHT` + Route SOP + 每阶段产物/退出标准 + 专属负例和 Gate + 技术栈分支 + 新旧路由兼容测试 + 至少一次授权真实项目验证。当前全部未执行。

返回 [产品品类导航](README.md)。
