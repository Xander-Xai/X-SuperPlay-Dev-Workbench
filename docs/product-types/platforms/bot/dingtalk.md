# 钉钉 Stream 机器人 · 宿主专用流程分册

> `PLATFORM_BRANCH_GUIDE / NOT_RUNTIME_ROUTE / NOT_REAL_PROJECT_VERIFIED`，研究日期 2026-11-02。仅适用于 **钉钉 Stream 机器人**，不是对其他宿主的通用规则；账号、SDK/政策、真实设备、审核均须在开工时复查。

返回 [bot 主路线（11 阶段及 Skills）](../../bot.md)。**本页仅添加宿主专用差异，不新增生命周期。**

## 1. 选型前检查 / 必需条件

Stream Mode 使用应用主动建立的出站连接接收消息，不应默认要求公开 Webhook URL 或套 Slack HTTP 签名协议。

- **限定工具链**：钉钉开发者后台 / Stream SDK；记录版本、主体/账号所有者、资质、可测试的真实宿主、测试数据范围及回退授权。
- **不能混用**：其他宿主的 manifest、权限、签名、事件传输、审核与版本回执。

## 2. 如何完成第一轮开发（对应主路线的专用动作）

1. **intake / discovery**：确认目标宿主与授权、版本和用户入口；取得真实测试环境。缺权限记为 `BLOCKED`。
2. **specification / architecture**：按官方流程创建应用/机器人，取得 Client ID 与 Secret（仅保存在受控环境），选 Stream 模式和 SDK。输出宿主级 AC、错误路径、权限矩阵和 ADR。
3. **planning / implementation**：实现连接生命周期、消息幂等与重试；上线时记录机器人发布/权限与停用策略。拆一张可独立测试的 Ticket，先实现最小一条链，写清输入/输出、失败与回退。
4. **verification**：在指定的宿主及适用的测试账号/设备验证正常、拒绝/撤权、重试/升级路径，记录命令/版本、结果和工件。
5. **review**：由独立审者核对权限、凭据、用户数据、商店政策和负例，不应以同平台的文档模板声称已审查。
6. **release / operation / postmortem**：先取得授权再提审/发布，保留真实平台回执、失败回滚方式、宿主兼容变化与复盘台账。

## 3. 首张 Demo Ticket 与独立验收

- **Ticket**：`bot-dingtalk-T001`，`DRAFT_NOT_EXECUTED`。
- **最小成功路径**：在测试企业创建应用并开启机器人 Stream→发送一条 AT 消息→返回回复；断线重连后正常接收。
- **负例与风险**：连接中断、重复消息、撤销应用、越权群/用户、凭据泄露。
- **真实验收 Gate**：在真实钉钉测试组织里验证 WebSocket 重连/重复消息；不依赖公网入口作为必要条件。
- **执行技能**：主路线的 `specification`→`architecture`→`implementation-plan`→`implementation`→`verification`→`code-review`→`release-engineering`，需要安全审查时加入 `security-review`；实际测试不由 Skill 或文档代替。
- **状态**：没有宿主安装、平台审核/真机或发布凭证时，保持 `NOT_RUN` 或 `BLOCKED`。

## 4. 宿主官方来源

- https://opensource.dingtalk.com/developerpedia/docs/explore/tutorials/stream/bot/nodejs/create-bot/
- https://opensource.dingtalk.com/developerpedia/docs/learn/stream/overview/

> 外部文档可能变更。此处只引用平台明确描述的流程或规范；未看到的政策细节不得自行推断。
