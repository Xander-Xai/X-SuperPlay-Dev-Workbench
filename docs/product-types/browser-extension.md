# 浏览器扩展（Chrome / Edge）：初步独立开发路线

> **状态：`RESEARCH_PLACEHOLDER / NOT_RUNTIME_ROUTE / NOT_REAL_PROJECT_VERIFIED`**。资料核对：2026-11-02。本文是专用品类占位，不是已注册的 CLI `type`、不是完整可执行 Route Pack，也不是平台审核回执。

## 1. 适用范围 / 排除

- **交付对象**：浏览器侧边栏、popup、content scripts 和浏览器事件。
- **不要混用**：浏览器扩展不是普通网站；不能以 Web 发布证明商店审核。
- **可参考但不代表已支持的 Profile**：web（基础）、browser-extension（待新增）。
- **扩展优先级**：P0（仅路线建设顺序）。

## 2. 从需求到交付：对应权威 11 阶段

| 权威阶段映射 | 本品类应做什么 | 最低产物 |
|---|---|---|
| `intake / discovery` | 选使用场景、网页域名范围与最低权限 | 需求简报/授权/用户旅程 |
| `specification` | 定义 popup/side panel 行为及拒绝授权 AC | Spec/AC 与负例 |
| `architecture` | 设计 Manifest V3、service worker、消息通道/存储边界 | ADR/信任与部署边界 |
| `planning` | 拆解一次浏览器动作→结果→失败处理 Ticket | Tickets/预算/停止条件 |
| `implementation` | 实现扩展、限制 host permissions、完成本地侧载 | 可运行纵向切片与测试 |
| `verification / review` | 真实浏览器测 worker 生命周期/拒绝权限；安全 Review | 实际测试结果/独立 Review |
| `release` | 打包、提交目标商店、记录审核状态与版本回滚 | 构建/发布/回滚回执 |
| `operation / postmortem` | 监控目标页面变化和权限兼容 | 运维观测/复盘报告 |

> 为首次阅读将部分连续阶段并排呈现，但每个原始阶段仍由 `src/catalog.mjs` 统一定义，不能凭此表自行跳过对应 Gate。

## 3. 候选 Skills 与必需工具

- **本品类优先学习/按需装配**：`specification`、`architecture`、`implementation`、`verification`、`security-review`、`release-engineering`。它们属于仓库已有 14 个候选 Skill，未因本文执行、安装或晋级。
- **不能让 Skill 代替的工具/账号**：Chrome/Edge Extension API、Manifest V3、扩展商店。外部平台、设备和真实发布权仍需人工授权。

## 4. 本品类真正不同的验收

- **首批必须设计的负例**：host_permissions 过宽、内容脚本注入、worker 被回收、网页结构变化。
- **关键发布 Gate**：真实浏览器加载、权限拒绝与扩展商店提交/审核回执。未执行或未获授权必须写为 `NOT_RUN` / `BLOCKED`；不得由 Mock/CI 绿替代。
- **首张 Ticket 建议**：拆解一次浏览器动作→结果→失败处理 Ticket；先满足一个端到端成功路径和至少一个失败路径，并记录实际环境、命令、结果与工件。

## 5. 官方资料与升级界线

- 主要依据：[平台/标准官方入口](https://developer.chrome.com/docs/extensions/get-started)。更新平台规则前重新核查原文，本文不永久保证资质、审核或 API 版本要求。
- **从研究占位升级的条件**：独立 `PREFLIGHT` + Route SOP + 每阶段产物/退出标准 + 专属负例和 Gate + 技术栈分支 + 新旧路由兼容测试 + 至少一次授权真实项目验证。当前全部未执行。

返回 [产品品类导航](README.md)。
