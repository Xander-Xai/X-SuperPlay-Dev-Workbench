# Chrome Extension MV3 · 宿主专用流程分册

> `PLATFORM_BRANCH_GUIDE / NOT_RUNTIME_ROUTE / NOT_REAL_PROJECT_VERIFIED`，研究日期 2026-11-02。仅适用于 **Chrome Extension MV3**，不是对其他宿主的通用规则；账号、SDK/政策、真实设备、审核均须在开工时复查。

返回 [browser-extension 主路线（11 阶段及 Skills）](../../browser-extension.md)。**本页仅添加宿主专用差异，不新增生命周期。**

## 1. 选型前检查 / 必需条件

MV3 service worker 可能被终止；权限分为 permissions、host_permissions，远程逻辑受商店政策约束。

- **限定工具链**：Chrome Extensions API / Chrome Web Store；记录版本、主体/账号所有者、资质、可测试的真实宿主、测试数据范围及回退授权。
- **不能混用**：其他宿主的 manifest、权限、签名、事件传输、审核与版本回执。

## 2. 如何完成第一轮开发（对应主路线的专用动作）

1. **intake / discovery**：确认目标宿主与授权、版本和用户入口；取得真实测试环境。缺权限记为 `BLOCKED`。
2. **specification / architecture**：声明最小 hosts、content scripts、后台 service worker 消息边界和数据保存期限。输出宿主级 AC、错误路径、权限矩阵和 ADR。
3. **planning / implementation**：Chrome 浏览器中侧载检查，上传商店包并保留隐私/权限声明、审核与版本记录。拆一张可独立测试的 Ticket，先实现最小一条链，写清输入/输出、失败与回退。
4. **verification**：在指定的宿主及适用的测试账号/设备验证正常、拒绝/撤权、重试/升级路径，记录命令/版本、结果和工件。
5. **review**：由独立审者核对权限、凭据、用户数据、商店政策和负例，不应以同平台的文档模板声称已审查。
6. **release / operation / postmortem**：先取得授权再提审/发布，保留真实平台回执、失败回滚方式、宿主兼容变化与复盘台账。

## 3. 首张 Demo Ticket 与独立验收

- **Ticket**：`browser-extension-chrome-T001`，`DRAFT_NOT_EXECUTED`。
- **最小成功路径**：在一个允许站点点击 action→content script 读取选中区域→popup 展示；撤销 host 权限后失败关闭。
- **负例与风险**：service worker 生命周期中断、网页伪造消息、远程代码、过度 host 权限。
- **真实验收 Gate**：Chrome 本地侧载及 Chrome Web Store 独立审核证据，不用 Edge 回执替代。
- **执行技能**：主路线的 `specification`→`architecture`→`implementation-plan`→`implementation`→`verification`→`code-review`→`release-engineering`，需要安全审查时加入 `security-review`；实际测试不由 Skill 或文档代替。
- **状态**：没有宿主安装、平台审核/真机或发布凭证时，保持 `NOT_RUN` 或 `BLOCKED`。

## 4. 宿主官方来源

- https://developer.chrome.com/docs/extensions/get-started
- https://developer.chrome.com/docs/webstore/program-policies/policies

> 外部文档可能变更。此处只引用平台明确描述的流程或规范；未看到的政策细节不得自行推断。
