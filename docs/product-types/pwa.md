# PWA / 可安装离线 Web：初步独立开发路线

> **状态：`RESEARCH_PLACEHOLDER / NOT_RUNTIME_ROUTE / NOT_REAL_PROJECT_VERIFIED`**。资料核对：2026-11-02。本文是专用品类占位，不是已注册的 CLI `type`、不是完整可执行 Route Pack，也不是平台审核回执。

## 1. 适用范围 / 排除

- **交付对象**：基于 Web 但需要安装、离线读取或离线写入的产品。
- **不要混用**：Service Worker 非所有 PWA 安装场景的硬性条件；不以浏览器安装代替 App 商店验收。
- **可参考但不代表已支持的 Profile**：web。
- **扩展优先级**：P0（仅路线建设顺序）。

## 2. 从需求到交付：对应权威 11 阶段

| 权威阶段映射 | 本品类应做什么 | 最低产物 |
|---|---|---|
| `intake / discovery` | 确定支持的桌面/移动浏览器及离线需求 | 需求简报/授权/用户旅程 |
| `specification` | 区分离线可读/可写范围、同步失败和升级 AC | Spec/AC 与负例 |
| `architecture` | 设计 Manifest、缓存版本、更新提示和冲突合并策略 | ADR/信任与部署边界 |
| `planning` | 按在线→安装→断网恢复拆分 Ticket | Tickets/预算/停止条件 |
| `implementation` | 实现 Manifest、缓存策略、安装引导与同步队列 | 可运行纵向切片与测试 |
| `verification / review` | 设备实测安装/断网/更新；检查数据留存、独立 Review | 实际测试结果/独立 Review |
| `release` | HTTPS 上线、检查安装入口、验证旧缓存回滚 | 构建/发布/回滚回执 |
| `operation / postmortem` | 分析安装/同步失败并复盘 | 运维观测/复盘报告 |

> 为首次阅读将部分连续阶段并排呈现，但每个原始阶段仍由 `src/catalog.mjs` 统一定义，不能凭此表自行跳过对应 Gate。

## 3. 候选 Skills 与必需工具

- **本品类优先学习/按需装配**：`specification`、`architecture`、`implementation`、`verification`、`security-review`、`release-engineering`。它们属于仓库已有 14 个候选 Skill，未因本文执行、安装或晋级。
- **不能让 Skill 代替的工具/账号**：Web App Manifest、Service Worker、真实浏览器设备。外部平台、设备和真实发布权仍需人工授权。

## 4. 本品类真正不同的验收

- **首批必须设计的负例**：离线重复写入、缓存敏感数据、旧版本资源与同步冲突。
- **关键发布 Gate**：HTTPS/安装体验及真实断网/重连/更新回执。未执行或未获授权必须写为 `NOT_RUN` / `BLOCKED`；不得由 Mock/CI 绿替代。
- **首张 Ticket 建议**：按在线→安装→断网恢复拆分 Ticket；先满足一个端到端成功路径和至少一个失败路径，并记录实际环境、命令、结果与工件。

## 5. 官方资料与升级界线

- 主要依据：[平台/标准官方入口](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)。更新平台规则前重新核查原文，本文不永久保证资质、审核或 API 版本要求。
- **从研究占位升级的条件**：独立 `PREFLIGHT` + Route SOP + 每阶段产物/退出标准 + 专属负例和 Gate + 技术栈分支 + 新旧路由兼容测试 + 至少一次授权真实项目验证。当前全部未执行。

返回 [产品品类导航](README.md)。
