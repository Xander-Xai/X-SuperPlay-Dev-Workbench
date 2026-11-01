# 抖音小程序 · 宿主专用流程分册

> `PLATFORM_BRANCH_GUIDE / NOT_RUNTIME_ROUTE / NOT_REAL_PROJECT_VERIFIED`，研究日期 2026-11-02。仅适用于 **抖音小程序**，不是对其他宿主的通用规则；账号、SDK/政策、真实设备、审核均须在开工时复查。

返回 [mini-other 主路线（11 阶段及 Skills）](../../mini-other.md)。**本页仅添加宿主专用差异，不新增生命周期。**

## 1. 选型前检查 / 必需条件

抖音小程序以自身开发者账号/主体、AppID、IDE、服务端接口、版本提审和灰度流程为准，不能使用 wx.login。

- **限定工具链**：抖音开放平台 / 抖音 IDE；记录版本、主体/账号所有者、资质、可测试的真实宿主、测试数据范围及回退授权。
- **不能混用**：其他宿主的 manifest、权限、签名、事件传输、审核与版本回执。

## 2. 如何完成第一轮开发（对应主路线的专用动作）

1. **intake / discovery**：确认目标宿主与授权、版本和用户入口；取得真实测试环境。缺权限记为 `BLOCKED`。
2. **specification / architecture**：先查主体和类目准入/备案、创建 AppID，配置目标宿主允许域名及需要的开放能力。输出宿主级 AC、错误路径、权限矩阵和 ADR。
3. **planning / implementation**：在 IDE 上传版本→体验版测试→平台审查→发布/回退；审核拒绝不能宣称上线。拆一张可独立测试的 Ticket，先实现最小一条链，写清输入/输出、失败与回退。
4. **verification**：在指定的宿主及适用的测试账号/设备验证正常、拒绝/撤权、重试/升级路径，记录命令/版本、结果和工件。
5. **review**：由独立审者核对权限、凭据、用户数据、商店政策和负例，不应以同平台的文档模板声称已审查。
6. **release / operation / postmortem**：先取得授权再提审/发布，保留真实平台回执、失败回滚方式、宿主兼容变化与复盘台账。

## 3. 首张 Demo Ticket 与独立验收

- **Ticket**：`mini-other-douyin-T001`，`DRAFT_NOT_EXECUTED`。
- **最小成功路径**：开发者工具打开页面→官方登录→测试 API 写入→真机查看；拒绝授权应得到拒绝提示。
- **负例与风险**：错误 AppID/域名、未获资质调用支付、真机 API 不兼容、敏感权限无解释。
- **真实验收 Gate**：抖音 IDE+真机+开放平台审核/发布状态，不能以支付宝或微信审核代替。
- **执行技能**：主路线的 `specification`→`architecture`→`implementation-plan`→`implementation`→`verification`→`code-review`→`release-engineering`，需要安全审查时加入 `security-review`；实际测试不由 Skill 或文档代替。
- **状态**：没有宿主安装、平台审核/真机或发布凭证时，保持 `NOT_RUN` 或 `BLOCKED`。

## 4. 宿主官方来源

- https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/introduction/develop-process/prepare
- https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/introduction/develop-process/publish

> 外部文档可能变更。此处只引用平台明确描述的流程或规范；未看到的政策细节不得自行推断。
