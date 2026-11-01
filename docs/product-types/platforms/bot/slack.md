# Slack Bot / App · 宿主专用流程分册

> `PLATFORM_BRANCH_GUIDE / NOT_RUNTIME_ROUTE / NOT_REAL_PROJECT_VERIFIED`，研究日期 2026-11-02。仅适用于 **Slack Bot / App**，不是对其他宿主的通用规则；账号、SDK/政策、真实设备、审核均须在开工时复查。

返回 [bot 主路线（11 阶段及 Skills）](../../bot.md)。**本页仅添加宿主专用差异，不新增生命周期。**

## 1. 选型前检查 / 必需条件

Slack HTTP 请求使用签名密钥做真实性校验并检查时效；与 DingTalk Stream 和 Discord Interaction 的验证方式不同。

- **限定工具链**：Slack App Manifest / OAuth / Events API；记录版本、主体/账号所有者、资质、可测试的真实宿主、测试数据范围及回退授权。
- **不能混用**：其他宿主的 manifest、权限、签名、事件传输、审核与版本回执。

## 2. 如何完成第一轮开发（对应主路线的专用动作）

1. **intake / discovery**：确认目标宿主与授权、版本和用户入口；取得真实测试环境。缺权限记为 `BLOCKED`。
2. **specification / architecture**：定义 OAuth scopes、组织安装/卸载、事件订阅及回调认证；验证时间戳和请求签名。输出宿主级 AC、错误路径、权限矩阵和 ADR。
3. **planning / implementation**：按 Slack 安装流程授权测试组织，记录安装 token 安全存储、可用事件和卸载影响。拆一张可独立测试的 Ticket，先实现最小一条链，写清输入/输出、失败与回退。
4. **verification**：在指定的宿主及适用的测试账号/设备验证正常、拒绝/撤权、重试/升级路径，记录命令/版本、结果和工件。
5. **review**：由独立审者核对权限、凭据、用户数据、商店政策和负例，不应以同平台的文档模板声称已审查。
6. **release / operation / postmortem**：先取得授权再提审/发布，保留真实平台回执、失败回滚方式、宿主兼容变化与复盘台账。

## 3. 首张 Demo Ticket 与独立验收

- **Ticket**：`bot-slack-T001`，`DRAFT_NOT_EXECUTED`。
- **最小成功路径**：测试工作区安装 Slack App→发一条允许的命令/事件→回复；撤销 OAuth scope 后访问拒绝。
- **负例与风险**：签名无效、时间戳过期、事件重复、scope 撤销、频道越权。
- **真实验收 Gate**：真实 Slack 测试 workspace 验证安装/事件与撤权，独立于飞书/钉钉回执。
- **执行技能**：主路线的 `specification`→`architecture`→`implementation-plan`→`implementation`→`verification`→`code-review`→`release-engineering`，需要安全审查时加入 `security-review`；实际测试不由 Skill 或文档代替。
- **状态**：没有宿主安装、平台审核/真机或发布凭证时，保持 `NOT_RUN` 或 `BLOCKED`。

## 4. 宿主官方来源

- https://docs.slack.dev/authentication/verifying-requests-from-slack/
- https://docs.slack.dev/authentication/installing-with-oauth/

> 外部文档可能变更。此处只引用平台明确描述的流程或规范；未看到的政策细节不得自行推断。
