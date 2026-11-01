# 独立开发产品类型导航

> 更新时间：2026-11-02。**正式运行时路线：4 条**；**各有独立开发指南的研究占位：14 条**；**独立场景补充：4 个**。研究占位不等于 `TYPES`、Route Pack、可自动装配、已发布或经过真实项目验收。

## 先选交付物，不要把流程混在一起

明确用户最终拿到的是：网站、可安装 Web、桌面安装包、浏览器扩展、CLI、API、消息 Bot、第三方宿主插件、其他小程序、基础设施、游戏、设备固件、XR。再判断是否叠加 SaaS 商业模式、AI/RAG/Agent、电商、内容或 BI；业务场景不能取代交付平台的 SDK、权限、审核和设备验收。

### 当前四条正式路线（权威代码产生的独立 Route Pack）

| 产品 | 入口 | 真正独立的工程门槛 |
|---|---|---|
| SaaS / Micro-SaaS | [11 阶段 Route Pack](../routes/saas.md) · [从零开发指南](saas-walkthrough.md) | 租户隔离、认证、计费/迁移/回滚 |
| 企业自研系统 | [Route Pack](../routes/enterprise.md) | SSO、RBAC、数据迁移、企业 UAT |
| 微信小程序 | [Route Pack](../routes/mini-program.md) | 微信资质、SDK、真机、官方审核 |
| 移动 APP | [Route Pack](../routes/app.md) | 真机、签名、隐私与商店发布 |

### 新增独立研究占位（尚不可在网页/CLI 选择）

| 品类 | 优先级 | 具体开发步骤/Skills/Gate |
|---|---|---|
| 网站 / 静态 Web / H5 | P0 | [独立指南](web-static.md) |
| PWA / 可安装离线 Web | P0 | [独立指南](pwa.md) |
| 桌面应用（Electron / Tauri / 原生） | P0 | [独立指南](desktop.md) |
| 浏览器扩展（Chrome / Edge） | P0 | [独立指南](browser-extension.md) |
| CLI / 脚本产品 | P1 | [独立指南](cli.md) |
| API-first 服务 / SDK | P1 | [独立指南](api-sdk.md) |
| 工作流自动化 / 系统集成 | P1 | [独立指南](automation.md) |
| 消息平台机器人（飞书/钉钉/Slack/Discord） | P1 | [独立指南](bot.md) |
| 生态插件（VS Code / Figma / WordPress） | P2 | [独立指南](ecosystem-plugin.md) |
| 非微信平台小程序（抖音/支付宝等） | P1 | [独立指南](mini-other.md) |
| 基础设施 / 部署运维工具 | P2 | [独立指南](infrastructure.md) |
| 游戏产品（网页/PC/移动） | P3 | [独立指南](game.md) |
| IoT / 嵌入式设备固件 | P3 | [独立指南](iot-embedded.md) |
| XR / VR / AR / MR | P3 | [独立指南](xr.md) |

### 只作为业务/能力场景（不是新的平台 Route Pack）

- [AI / RAG / Agent 能力层](scenarios/ai-rag-agent.md)：按实际平台再叠加独立业务契约。
- [电商 / 交易 / 订阅场景](scenarios/commerce.md)：按实际平台再叠加独立业务契约。
- [内容 / UGC / 社区场景](scenarios/community-content.md)：按实际平台再叠加独立业务契约。
- [数据分析 / ETL / BI 场景](scenarios/data-bi.md)：按实际平台再叠加独立业务契约。


## 技术栈 / 宿主的独立分册（每个平台有自己的 SDK 和验收）

| 产品路线 | 必须先选择的专用子路线 |
|---|---|
| 桌面应用 | [Electron](platforms/desktop/electron.md) · [Tauri v2](platforms/desktop/tauri.md) · [原生桌面](platforms/desktop/native.md) |
| 浏览器扩展 | [Chrome MV3](platforms/browser-extension/chrome.md) · [Microsoft Edge](platforms/browser-extension/edge.md) |
| 消息机器人 | [飞书](platforms/bot/feishu.md) · [钉钉 Stream](platforms/bot/dingtalk.md) · [Slack](platforms/bot/slack.md) · [Discord](platforms/bot/discord.md) |
| 生态插件 | [VS Code](platforms/ecosystem-plugin/vscode.md) · [Figma](platforms/ecosystem-plugin/figma.md) · [WordPress](platforms/ecosystem-plugin/wordpress.md) |
| 非微信小程序 | [抖音](platforms/mini-other/douyin.md) · [支付宝](platforms/mini-other/alipay.md) |

分册只补该宿主独有的技术/权限/发布动作，完整 11 阶段与逐阶段 Skill 仍在对应主指南。若一个项目跨多个宿主，则分别保存验收回执；不能用同类其他平台的审核来替代。

## 规则：一个品类一条可检验的交付链

- 每条正式路线要回答：项目开始需什么资源？11 阶段各做什么？何时使用哪个候选 Skill？用什么具体工具？平台特有 Gate/负例是什么？怎样真正发布/回滚？
- 通用阶段只作为结构，**不把 SaaS 的租户隔离、微信的审核或桌面的签名塞进其他品类**。不同宿主平台（如 VS Code/Figma，支付宝/抖音）即使放在同一个占位入口，执行时也要先锁定唯一平台，再细分专用清单。
- Skills 负责方法步骤；SDK/设备/审批/商店回执由真实平台提供。未安装、未测试、未交付时分别保留 `CANDIDATE / NOT_RUN / BLOCKED`。
- 以后若把占位加入 `src/catalog.mjs`，必须同时补 `src/route-packs.mjs`、路由/证据模型、CLI/UI 以及回归测试。此次**不变更**旧四路线、14 Skills、网页运行时与发布权限。

[本次来源和差距报告](../research/2026-11-02-product-format-scaffolding.md)。
