# XR / VR / AR / MR：初步独立开发路线

> **状态：`RESEARCH_PLACEHOLDER / NOT_RUNTIME_ROUTE / NOT_REAL_PROJECT_VERIFIED`**。资料核对：2026-11-02。本文是专用品类占位，不是已注册的 CLI `type`、不是完整可执行 Route Pack，也不是平台审核回执。

## 1. 适用范围 / 排除

- **交付对象**：头显、空间计算、跟踪输入和沉浸式交互。
- **不要混用**：不能用普通手机浏览器测试代替 XR 实机舒适度和追踪验证。
- **可参考但不代表已支持的 Profile**：mobile/desktop 部分参考；xr 专项待定义。
- **扩展优先级**：P3（仅路线建设顺序）。

## 2. 从需求到交付：对应权威 11 阶段

| 权威阶段映射 | 本品类应做什么 | 最低产物 |
|---|---|---|
| `intake / discovery` | 确定目标头显/活动空间、舒适度与用户能力 | 需求简报/授权/用户旅程 |
| `specification` | 规定追踪失败、输入、边界安全、帧率延迟 AC | Spec/AC 与负例 |
| `architecture` | 选 OpenXR 与目标设备 SDK、空间场景/渲染方案 | ADR/信任与部署边界 |
| `planning` | 入场景→交互一次→安全退出的短纵切 | Tickets/预算/停止条件 |
| `implementation` | 实现空间交互、锚点、状态恢复和设备能力降级 | 可运行纵向切片与测试 |
| `verification / review` | 在目标头显验证追踪/输入/性能/舒适度；安全 Review | 实际测试结果/独立 Review |
| `release` | 目标设备签名/提审/分发和回滚 | 构建/发布/回滚回执 |
| `operation / postmortem` | 监控兼容性、追踪异常与使用反馈 | 运维观测/复盘报告 |

> 为首次阅读将部分连续阶段并排呈现，但每个原始阶段仍由 `src/catalog.mjs` 统一定义，不能凭此表自行跳过对应 Gate。

## 3. 候选 Skills 与必需工具

- **本品类优先学习/按需装配**：`project-discovery`、`specification`、`architecture`、`implementation`、`verification`、`security-review`、`release-engineering`。它们属于仓库已有 14 个候选 Skill，未因本文执行、安装或晋级。
- **不能让 Skill 代替的工具/账号**：OpenXR/Unity XR、目标头显、性能剖析工具。外部平台、设备和真实发布权仍需人工授权。

## 4. 本品类真正不同的验收

- **首批必须设计的负例**：追踪丢失、晕动症风险、权限拒绝、低帧率、设备边界失效。
- **关键发布 Gate**：目标头显真实运行、交互/舒适度/性能及设备分发回执。未执行或未获授权必须写为 `NOT_RUN` / `BLOCKED`；不得由 Mock/CI 绿替代。
- **首张 Ticket 建议**：入场景→交互一次→安全退出的短纵切；先满足一个端到端成功路径和至少一个失败路径，并记录实际环境、命令、结果与工件。

## 5. 官方资料与升级界线

- 主要依据：[平台/标准官方入口](https://registry.khronos.org/OpenXR/)。更新平台规则前重新核查原文，本文不永久保证资质、审核或 API 版本要求。
- **从研究占位升级的条件**：独立 `PREFLIGHT` + Route SOP + 每阶段产物/退出标准 + 专属负例和 Gate + 技术栈分支 + 新旧路由兼容测试 + 至少一次授权真实项目验证。当前全部未执行。

返回 [产品品类导航](README.md)。
