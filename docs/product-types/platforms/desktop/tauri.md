# Tauri v2 Desktop · 宿主专用流程分册

> `PLATFORM_BRANCH_GUIDE / NOT_RUNTIME_ROUTE / NOT_REAL_PROJECT_VERIFIED`，研究日期 2026-11-02。仅适用于 **Tauri v2 Desktop**，不是对其他宿主的通用规则；账号、SDK/政策、真实设备、审核均须在开工时复查。

返回 [desktop 主路线（11 阶段及 Skills）](../../desktop.md)。**本页仅添加宿主专用差异，不新增生命周期。**

## 1. 选型前检查 / 必需条件

Tauri v2 的 capabilities/permissions 为前端 WebView 访问核心命令设边界；Updater 签名密钥不进入前端或仓库。

- **限定工具链**：Tauri CLI / Rust + WebView；记录版本、主体/账号所有者、资质、可测试的真实宿主、测试数据范围及回退授权。
- **不能混用**：其他宿主的 manifest、权限、签名、事件传输、审核与版本回执。

## 2. 如何完成第一轮开发（对应主路线的专用动作）

1. **intake / discovery**：确认目标宿主与授权、版本和用户入口；取得真实测试环境。缺权限记为 `BLOCKED`。
2. **specification / architecture**：明确 Rust/web 前端版本和跨 OS 功能差异；写 capabilities 与命令权限的最小清单。输出宿主级 AC、错误路径、权限矩阵和 ADR。
3. **planning / implementation**：配置目标平台 bundle/updater，保管更新签名私钥，验证签名升级与失败回退。拆一张可独立测试的 Ticket，先实现最小一条链，写清输入/输出、失败与回退。
4. **verification**：在指定的宿主及适用的测试账号/设备验证正常、拒绝/撤权、重试/升级路径，记录命令/版本、结果和工件。
5. **review**：由独立审者核对权限、凭据、用户数据、商店政策和负例，不应以同平台的文档模板声称已审查。
6. **release / operation / postmortem**：先取得授权再提审/发布，保留真实平台回执、失败回滚方式、宿主兼容变化与复盘台账。

## 3. 首张 Demo Ticket 与独立验收

- **Ticket**：`desktop-tauri-T001`，`DRAFT_NOT_EXECUTED`。
- **最小成功路径**：Tauri 窗口→受限命令打开允许目录→返回结果；无 capability 时调用必须失败。
- **负例与风险**：越权 invoke、WebView 来源越界、命令参数注入、更新包无有效签名。
- **真实验收 Gate**：目标 OS 打包安装、权限拒绝及更新签名探针；不能用 Electron 测试代替。
- **执行技能**：主路线的 `specification`→`architecture`→`implementation-plan`→`implementation`→`verification`→`code-review`→`release-engineering`，需要安全审查时加入 `security-review`；实际测试不由 Skill 或文档代替。
- **状态**：没有宿主安装、平台审核/真机或发布凭证时，保持 `NOT_RUN` 或 `BLOCKED`。

## 4. 宿主官方来源

- https://v2.tauri.app/plugin/updater/
- https://tauri.app/security/capabilities/

> 外部文档可能变更。此处只引用平台明确描述的流程或规范；未看到的政策细节不得自行推断。
