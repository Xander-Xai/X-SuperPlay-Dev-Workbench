# Microsoft Edge Add-ons · 宿主专用流程分册

> `PLATFORM_BRANCH_GUIDE / NOT_RUNTIME_ROUTE / NOT_REAL_PROJECT_VERIFIED`，研究日期 2026-11-02。仅适用于 **Microsoft Edge Add-ons**，不是对其他宿主的通用规则；账号、SDK/政策、真实设备、审核均须在开工时复查。

返回 [browser-extension 主路线（11 阶段及 Skills）](../../browser-extension.md)。**本页仅添加宿主专用差异，不新增生命周期。**

## 1. 选型前检查 / 必需条件

Edge 与 Chrome API 大体兼容，但并非所有 API 直接一致；在 Edge 侧载并检查 Partner Center 认证状态。

- **限定工具链**：Edge Extension API / Partner Center；记录版本、主体/账号所有者、资质、可测试的真实宿主、测试数据范围及回退授权。
- **不能混用**：其他宿主的 manifest、权限、签名、事件传输、审核与版本回执。

## 2. 如何完成第一轮开发（对应主路线的专用动作）

1. **intake / discovery**：确认目标宿主与授权、版本和用户入口；取得真实测试环境。缺权限记为 `BLOCKED`。
2. **specification / architecture**：从 Chrome 版本迁移时逐项核查 API、品牌文案和 update_url，确认是否涉及 native messaging。输出宿主级 AC、错误路径、权限矩阵和 ADR。
3. **planning / implementation**：使用 Edge Partner Center 提交包、隐私资料与审核；企业策略分发另行登记。拆一张可独立测试的 Ticket，先实现最小一条链，写清输入/输出、失败与回退。
4. **verification**：在指定的宿主及适用的测试账号/设备验证正常、拒绝/撤权、重试/升级路径，记录命令/版本、结果和工件。
5. **review**：由独立审者核对权限、凭据、用户数据、商店政策和负例，不应以同平台的文档模板声称已审查。
6. **release / operation / postmortem**：先取得授权再提审/发布，保留真实平台回执、失败回滚方式、宿主兼容变化与复盘台账。

## 3. 首张 Demo Ticket 与独立验收

- **Ticket**：`browser-extension-edge-T001`，`DRAFT_NOT_EXECUTED`。
- **最小成功路径**：Edge 本地侧载同一最小操作→拒绝站点权限时阻止读取；执行一条不兼容 API 的降级测试。
- **负例与风险**：Chrome-only API、错误 update_url、商店材料不全、企业安装策略问题。
- **真实验收 Gate**：Edge 实测、Add-ons 审核状态与正式分发回执；不把 Chrome Web Store 视为通过。
- **执行技能**：主路线的 `specification`→`architecture`→`implementation-plan`→`implementation`→`verification`→`code-review`→`release-engineering`，需要安全审查时加入 `security-review`；实际测试不由 Skill 或文档代替。
- **状态**：没有宿主安装、平台审核/真机或发布凭证时，保持 `NOT_RUN` 或 `BLOCKED`。

## 4. 宿主官方来源

- https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/developer-guide/port-chrome-extension
- https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension

> 外部文档可能变更。此处只引用平台明确描述的流程或规范；未看到的政策细节不得自行推断。
