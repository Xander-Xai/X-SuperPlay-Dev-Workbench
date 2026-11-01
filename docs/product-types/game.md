# 游戏产品（网页/PC/移动）：初步独立开发路线

> **状态：`RESEARCH_PLACEHOLDER / NOT_RUNTIME_ROUTE / NOT_REAL_PROJECT_VERIFIED`**。资料核对：2026-11-02。本文是专用品类占位，不是已注册的 CLI `type`、不是完整可执行 Route Pack，也不是平台审核回执。

## 1. 适用范围 / 排除

- **交付对象**：Godot/Unity 引擎游戏、关卡、资源与交互循环。
- **不要混用**：帧预算、玩法平衡和游戏资产许可不是通用 CRUD Web 验收。
- **可参考但不代表已支持的 Profile**：web/mobile/desktop 按目标平台选；game 专项待定义。
- **扩展优先级**：P3（仅路线建设顺序）。

## 2. 从需求到交付：对应权威 11 阶段

| 权威阶段映射 | 本品类应做什么 | 最低产物 |
|---|---|---|
| `intake / discovery` | 锁定玩法循环、目标玩家、设备及资源授权 | 需求简报/授权/用户旅程 |
| `specification` | 定义可玩性、帧率、存读档、失败重试 AC | Spec/AC 与负例 |
| `architecture` | 选游戏引擎、资源管线、渲染与输入架构 | ADR/信任与部署边界 |
| `planning` | 一关可玩→存档→失败恢复纵切 | Tickets/预算/停止条件 |
| `implementation` | 实现最小玩法、资源、音画和控制器支持 | 可运行纵向切片与测试 |
| `verification / review` | 在目标设备测试 FPS/存档/关卡边界，试玩 Review | 实际测试结果/独立 Review |
| `release` | 按平台导出、签名/商店发布及恢复版本 | 构建/发布/回滚回执 |
| `operation / postmortem` | 观察崩溃和关卡流失反馈 | 运维观测/复盘报告 |

> 为首次阅读将部分连续阶段并排呈现，但每个原始阶段仍由 `src/catalog.mjs` 统一定义，不能凭此表自行跳过对应 Gate。

## 3. 候选 Skills 与必需工具

- **本品类优先学习/按需装配**：`project-discovery`、`specification`、`architecture`、`implementation`、`verification`、`release-engineering`。它们属于仓库已有 14 个候选 Skill，未因本文执行、安装或晋级。
- **不能让 Skill 代替的工具/账号**：Godot/Unity 导出工具、手柄/目标设备、试玩记录。外部平台、设备和真实发布权仍需人工授权。

## 4. 本品类真正不同的验收

- **首批必须设计的负例**：存档损坏、帧率下降、关卡软锁、资源漏打包。
- **关键发布 Gate**：目标平台真机/导出包、性能与玩家试玩回执。未执行或未获授权必须写为 `NOT_RUN` / `BLOCKED`；不得由 Mock/CI 绿替代。
- **首张 Ticket 建议**：一关可玩→存档→失败恢复纵切；先满足一个端到端成功路径和至少一个失败路径，并记录实际环境、命令、结果与工件。

## 5. 官方资料与升级界线

- 主要依据：[平台/标准官方入口](https://docs.godotengine.org/en/stable/tutorials/export/exporting_projects.html)。更新平台规则前重新核查原文，本文不永久保证资质、审核或 API 版本要求。
- **从研究占位升级的条件**：独立 `PREFLIGHT` + Route SOP + 每阶段产物/退出标准 + 专属负例和 Gate + 技术栈分支 + 新旧路由兼容测试 + 至少一次授权真实项目验证。当前全部未执行。

返回 [产品品类导航](README.md)。
