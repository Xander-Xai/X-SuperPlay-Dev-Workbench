# CLI / 脚本产品：初步独立开发路线

> **状态：`RESEARCH_PLACEHOLDER / NOT_RUNTIME_ROUTE / NOT_REAL_PROJECT_VERIFIED`**。资料核对：2026-11-02。本文是专用品类占位，不是已注册的 CLI `type`、不是完整可执行 Route Pack，也不是平台审核回执。

## 1. 适用范围 / 排除

- **交付对象**：Python、Node、Rust 命令行工具及可安装脚本。
- **不要混用**：无需默认 Web、租户或客户端商店；按真实目标 OS/shell 测试。
- **可参考但不代表已支持的 Profile**：cli。
- **扩展优先级**：P1（仅路线建设顺序）。

## 2. 从需求到交付：对应权威 11 阶段

| 权威阶段映射 | 本品类应做什么 | 最低产物 |
|---|---|---|
| `intake / discovery` | 定义用户 OS、终端及输入输出场景 | 需求简报/授权/用户旅程 |
| `specification` | 先规定命令/参数、退出码、stderr、兼容性和 dry-run AC | Spec/AC 与负例 |
| `architecture` | 设计配置、日志、凭据边界及扩展方式 | ADR/信任与部署边界 |
| `planning` | 先做 --help→单一命令→错误退出 Ticket | Tickets/预算/停止条件 |
| `implementation` | 实现解析、非交互执行、错误语义与安装包 | 可运行纵向切片与测试 |
| `verification / review` | subprocess E2E 覆盖非 TTY/编码/错误参数；安全 Review | 实际测试结果/独立 Review |
| `release` | 包构建、测试仓库、授权发布与卸载回滚 | 构建/发布/回滚回执 |
| `operation / postmortem` | 管理兼容版本、迁移和弃用声明 | 运维观测/复盘报告 |

> 为首次阅读将部分连续阶段并排呈现，但每个原始阶段仍由 `src/catalog.mjs` 统一定义，不能凭此表自行跳过对应 Gate。

## 3. 候选 Skills 与必需工具

- **本品类优先学习/按需装配**：`specification`、`architecture`、`implementation`、`verification`、`security-review`、`release-engineering`。它们属于仓库已有 14 个候选 Skill，未因本文执行、安装或晋级。
- **不能让 Skill 代替的工具/账号**：Python Packaging / npm、子进程 E2E、目标 shell。外部平台、设备和真实发布权仍需人工授权。

## 4. 本品类真正不同的验收

- **首批必须设计的负例**：非 TTY 失败、危险操作缺少 dry-run、退出码不一致、路径注入。
- **关键发布 Gate**：干净环境安装、--help/--version 与跨平台执行回执。未执行或未获授权必须写为 `NOT_RUN` / `BLOCKED`；不得由 Mock/CI 绿替代。
- **首张 Ticket 建议**：先做 --help→单一命令→错误退出 Ticket；先满足一个端到端成功路径和至少一个失败路径，并记录实际环境、命令、结果与工件。

## 5. 官方资料与升级界线

- 主要依据：[平台/标准官方入口](https://packaging.python.org/en/latest/guides/)。更新平台规则前重新核查原文，本文不永久保证资质、审核或 API 版本要求。
- **从研究占位升级的条件**：独立 `PREFLIGHT` + Route SOP + 每阶段产物/退出标准 + 专属负例和 Gate + 技术栈分支 + 新旧路由兼容测试 + 至少一次授权真实项目验证。当前全部未执行。

返回 [产品品类导航](README.md)。
