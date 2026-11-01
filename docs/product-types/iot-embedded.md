# IoT / 嵌入式设备固件：初步独立开发路线

> **状态：`RESEARCH_PLACEHOLDER / NOT_RUNTIME_ROUTE / NOT_REAL_PROJECT_VERIFIED`**。资料核对：2026-11-02。本文是专用品类占位，不是已注册的 CLI `type`、不是完整可执行 Route Pack，也不是平台审核回执。

## 1. 适用范围 / 排除

- **交付对象**：ESP32 等设备固件、驱动、网络连接与 OTA。
- **不要混用**：真实板级验证、功耗/温度和设备安全不能由后端单测替代。
- **可参考但不代表已支持的 Profile**：infrastructure/backend（外围参考；embedded 专项待新增）。
- **扩展优先级**：P3（仅路线建设顺序）。

## 2. 从需求到交付：对应权威 11 阶段

| 权威阶段映射 | 本品类应做什么 | 最低产物 |
|---|---|---|
| `intake / discovery` | 确定芯片/开发板、传感器、安全级别和功耗约束 | 需求简报/授权/用户旅程 |
| `specification` | 定义设备协议、启动恢复、升级和故障安全 AC | Spec/AC 与负例 |
| `architecture` | 设计 Bootloader、证书、设备身份及边缘/云信任边界 | ADR/信任与部署边界 |
| `planning` | 板级点灯→采集→联网→OTA 纵切 | Tickets/预算/停止条件 |
| `implementation` | 实现驱动/任务调度、配置、可刷写固件 | 可运行纵向切片与测试 |
| `verification / review` | 硬件在环验证断电/离线/功耗/升级；安全 Review | 实际测试结果/独立 Review |
| `release` | 固件签名、灰度 OTA 与回滚记录 | 构建/发布/回滚回执 |
| `operation / postmortem` | 监控失联、硬件批次与故障 | 运维观测/复盘报告 |

> 为首次阅读将部分连续阶段并排呈现，但每个原始阶段仍由 `src/catalog.mjs` 统一定义，不能凭此表自行跳过对应 Gate。

## 3. 候选 Skills 与必需工具

- **本品类优先学习/按需装配**：`specification`、`architecture`、`implementation`、`verification`、`security-review`、`release-engineering`。它们属于仓库已有 14 个候选 Skill，未因本文执行、安装或晋级。
- **不能让 Skill 代替的工具/账号**：目标开发板、烧录工具、硬件在环测试。外部平台、设备和真实发布权仍需人工授权。

## 4. 本品类真正不同的验收

- **首批必须设计的负例**：断电升级损坏、设备密钥泄漏、重连死循环、传感器漂移。
- **关键发布 Gate**：真实板刷写、断电/重连/OTA 回退及功耗测试。未执行或未获授权必须写为 `NOT_RUN` / `BLOCKED`；不得由 Mock/CI 绿替代。
- **首张 Ticket 建议**：板级点灯→采集→联网→OTA 纵切；先满足一个端到端成功路径和至少一个失败路径，并记录实际环境、命令、结果与工件。

## 5. 官方资料与升级界线

- 主要依据：[平台/标准官方入口](https://docs.espressif.com/projects/esp-idf/en/stable/esp32/get-started/index.html)。更新平台规则前重新核查原文，本文不永久保证资质、审核或 API 版本要求。
- **从研究占位升级的条件**：独立 `PREFLIGHT` + Route SOP + 每阶段产物/退出标准 + 专属负例和 Gate + 技术栈分支 + 新旧路由兼容测试 + 至少一次授权真实项目验证。当前全部未执行。

返回 [产品品类导航](README.md)。
