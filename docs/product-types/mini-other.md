# 非微信平台小程序（抖音/支付宝等）：初步独立开发路线

> **状态：`RESEARCH_PLACEHOLDER / NOT_RUNTIME_ROUTE / NOT_REAL_PROJECT_VERIFIED`**。资料核对：2026-11-02。本文是专用品类占位，不是已注册的 CLI `type`、不是完整可执行 Route Pack，也不是平台审核回执。

## 1. 适用范围 / 排除

- **交付对象**：运行在抖音、支付宝等宿主 App 的小程序。
- **不要混用**：不得照搬 wx.* API、微信资质及特定支付限制；每个平台须单独核实。
- **可参考但不代表已支持的 Profile**：mini-program（现有通用 Profile，非现有微信路线）。
- **扩展优先级**：P1（仅路线建设顺序）。

## 2. 从需求到交付：对应权威 11 阶段

| 权威阶段映射 | 本品类应做什么 | 最低产物 |
|---|---|---|
| `intake / discovery` | 只选一个目标宿主、确认主体/类目/能力授权 | 需求简报/授权/用户旅程 |
| `specification` | 针对该宿主定义登录、支付、隐私和失败 AC | Spec/AC 与负例 |
| `architecture` | 设计宿主 SDK、服务端会话、合法域名和数据边界 | ADR/信任与部署边界 |
| `planning` | 授权登录→一个业务动作→后端写入纵切 | Tickets/预算/停止条件 |
| `implementation` | 使用目标宿主开发工具与 SDK，不能混用微信接口 | 可运行纵向切片与测试 |
| `verification / review` | 宿主真机测弱网/隐私拒绝/支付沙箱；安全 Review | 实际测试结果/独立 Review |
| `release` | 平台提审、分阶段发布，缺回执标 BLOCKED | 构建/发布/回滚回执 |
| `operation / postmortem` | 追踪宿主政策及 API 更新 | 运维观测/复盘报告 |

> 为首次阅读将部分连续阶段并排呈现，但每个原始阶段仍由 `src/catalog.mjs` 统一定义，不能凭此表自行跳过对应 Gate。

## 3. 候选 Skills 与必需工具

- **本品类优先学习/按需装配**：`project-discovery`、`specification`、`architecture`、`implementation`、`verification`、`security-review`、`release-engineering`。它们属于仓库已有 14 个候选 Skill，未因本文执行、安装或晋级。
- **不能让 Skill 代替的工具/账号**：目标宿主开发者工具、SDK、主体/类目及真机。外部平台、设备和真实发布权仍需人工授权。

## 4. 本品类真正不同的验收

- **首批必须设计的负例**：宿主鉴权失败、错误合法域名、审核不通过、支付能力缺失。
- **关键发布 Gate**：宿主真机 SDK、主体资质、平台审核及正式发布回执。未执行或未获授权必须写为 `NOT_RUN` / `BLOCKED`；不得由 Mock/CI 绿替代。
- **首张 Ticket 建议**：授权登录→一个业务动作→后端写入纵切；先满足一个端到端成功路径和至少一个失败路径，并记录实际环境、命令、结果与工件。

## 5. 官方资料与升级界线

- 主要依据：[平台/标准官方入口](https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/introduction/usage-guide)。更新平台规则前重新核查原文，本文不永久保证资质、审核或 API 版本要求。
- **从研究占位升级的条件**：独立 `PREFLIGHT` + Route SOP + 每阶段产物/退出标准 + 专属负例和 Gate + 技术栈分支 + 新旧路由兼容测试 + 至少一次授权真实项目验证。当前全部未执行。

返回 [产品品类导航](README.md)。
