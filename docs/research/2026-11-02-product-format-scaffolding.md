# 2026-11-02 产品品类研究占位和差距报告

> 审查基线：`main@2e2ba2ca11bdd792113ed689dd976b00fa6330cb`；核对 `src/catalog.mjs`、`src/routing.mjs`、`src/route-packs.mjs`、`docs/routes/*`。本轮不改运行时代码/网站/Skills；没有声称经过真实平台验收。

## 分类与建设结果

- 既有正式 Routes：SaaS、Enterprise、微信小程序、Mobile 共 **4 条**，各有生成的 Route Pack；11 阶段、14 个候选 Skill 不变。
- 新增占位：**14 个独立产品交付形态**，每份有范围/排除、8 组合阶段（明确映射 11 权威阶段）、候选 Skills、实际平台工具、负例、发布 Gate 和官方入口。详见 [导航](../product-types/README.md)。
- 单独的业务/能力场景：AI/RAG/Agent、电商支付、内容社区、BI 数据分析共 **4 份**；不计为四条可发布平台路线。
- 新增 SaaS 实践导航说明使用权威 Route Pack 的方法。旧四条权威路线文件和生成器不被修改。

## 为什么不能把所有品类丢在一个表单流程

| 分类维度 | 产物的主要差异 |
|---|---|
| SaaS | 租户隔离、订阅、数据迁移、恢复和计费 |
| PWA | 安装体验、浏览器差异、离线缓存和同步 |
| Desktop | OS/CPU、系统权限、签名与更新 |
| Extension/Plugin | Manifest、宿主沙箱与专用商店审核 |
| CLI/API | 命令/退出码契约或 OpenAPI/SDK 版本契约 |
| Automation/Bot | 事件、平台 OAuth、重试与可恢复副作用 |
| Game/IoT/XR | 游戏帧预算、硬件在环或头显真实交互验收 |

## 调研来源（2026-11-02；链接仅证明被引用的技术要点）

| 类别 | 官方原始出处 |
|---|---|
| 网站 / 静态 Web / H5 | https://developers.cloudflare.com/pages/framework-guides/deploy-anything/ |
| PWA / 可安装离线 Web | https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable |
| 桌面应用（Electron / Tauri / 原生） | https://www.electronjs.org/docs/latest/tutorial/distribution-overview |
| 浏览器扩展（Chrome / Edge） | https://developer.chrome.com/docs/extensions/get-started |
| CLI / 脚本产品 | https://packaging.python.org/en/latest/guides/ |
| API-first 服务 / SDK | https://spec.openapis.org/oas/ |
| 工作流自动化 / 系统集成 | https://docs.n8n.io/build/flow-logic/handle-errors-gracefully |
| 消息平台机器人（飞书/钉钉/Slack/Discord） | https://docs.slack.dev/authentication/installing-with-oauth/ |
| 生态插件（VS Code / Figma / WordPress） | https://developers.figma.com/docs/plugins/manifest/ |
| 非微信平台小程序（抖音/支付宝等） | https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/introduction/usage-guide |
| 基础设施 / 部署运维工具 | https://docs.docker.com/compose/how-tos/production/ |
| 游戏产品（网页/PC/移动） | https://docs.godotengine.org/en/stable/tutorials/export/exporting_projects.html |
| IoT / 嵌入式设备固件 | https://docs.espressif.com/projects/esp-idf/en/stable/esp32/get-started/index.html |
| XR / VR / AR / MR | https://registry.khronos.org/OpenXR/ |

额外安全来源：API [OWASP API Security Top 10](https://api-security.owasp.org/editions/2023/en/0x11-t10/)；PWA [离线机制](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation)；插件 [VS Code 扩展分发](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)；其他宿主 [支付宝小程序](https://miniprogram.alipay.com/docs/)；XR [Unity XR 包](https://docs.unity.com/en-us/engine/6000.0/manual/xr/support/support-packages)。这些是研究入口，不自动安装第三方代码。


## 2026-11-02 二次整改：针对独立验收发现的阻断项

**整改范围**（文档与验证器，不升级运行时类型）：

1. 14 份主路线从 8 行合并概述扩展为 **11 行权威阶段逐项指导**：每行独立说明适用动作、候选 Skill 的输入→输出、工具/真实环境、最低产物和退出 Gate。
2. 新增 **14 份宿主分册**：Electron/Tauri/原生、Chrome/Edge、飞书/钉钉/Slack/Discord、VS Code/Figma/WordPress、抖音/支付宝；不同协议和发布审核不混写。
3. 每份主指南补充 `PREFLIGHT`、`DRAFT_NOT_EXECUTED` 的首张纵切 Demo Ticket、正反 AC、阻断条件与平台 Gate。平台子分册也各有最小 Demo 和独立发布回执要求。
4. 新增 `tools/product-doc-check.mjs`，由原 `tools/check.mjs` 调用；新增 `test/product-docs.test.mjs`，由 `npm test` 自动执行。验证 14 类文档存在、阶段顺序严格匹配 `STAGES`、每阶段核心 Skill 存在且 ID 在 `SKILL_IDS`、14 分册索引、负例/发布 Gate、内部 Markdown 链接。附缺阶段、无效 Skill、漏平台、断链的负例单测。
5. 已观察首轮新检查在 CI 中发现 postmortem Skill 缺项并修复；后续 CI 与实际项目/平台验收仍需分别查看结果，不得混用。

### 关键宿主差异的新增官方依据

- **Tauri v2**：Updater 签名与 capability 最小权限：https://v2.tauri.app/plugin/updater/ 和 https://tauri.app/security/capabilities/
- **Electron**：打包、签名与分发：https://www.electronjs.org/docs/latest/tutorial/tutorial-packaging
- **Chrome/Edge**：MV3 远程代码政策及 Edge Partner Center 发布：https://developer.chrome.com/docs/webstore/program-policies/policies 与 https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension
- **飞书**：事件订阅：https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/event-subscription-guide/event-subscriptions
- **钉钉**：Stream 出站连接/机器人消息：https://opensource.dingtalk.com/developerpedia/docs/learn/stream/overview/
- **Slack**：HTTP Request 签名校验：https://docs.slack.dev/authentication/verifying-requests-from-slack/
- **VS Code/Figma/WordPress**：各自扩展 manifest、权限及宿主运行边界：https://code.visualstudio.com/api/get-started/your-first-extension 、https://developers.figma.com/docs/plugins/manifest/ 、https://developer.wordpress.org/plugins/plugin-basics/activation-deactivation-hooks/
- **抖音/支付宝**：抖音小程序开发/提审和支付宝服务商独立授权：https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/introduction/develop-process/publish 与 https://opendocs.alipay.com/mini/developer

### 尚未完成（不能冒充已验收）

- `xeng --type`、UI、Route Pack 注册和 14 种产品的真实开发/提审/生产回滚均未实现/未运行；保留 `RESEARCH_PLACEHOLDER / NOT_RUNTIME_ROUTE / NOT_REAL_PROJECT_VERIFIED`。
- 部分分册仍只是一轮概念性 Demo，不具备实际客户领域的具体代码仓、平台凭据、测试回执或可运营 SLA。外部接口/资质与标准仍须在实际开工时重新核对。

## 占位 → 可用的最小升级门槛

- [ ] 先锁定唯一目标平台及真实用户，确认它确实不是既有 Route + Overlay 能表达的场景。
- [ ] 写独立 `PREFLIGHT`、完整 11 阶段 SOP、候选 Skill 映射、负例、发布/回滚与阻断 Gate。
- [ ] 经授权变更 `TYPES / ROUTE_SOPS / route-packs / routing`、网页选择器、证据模型与测试，旧四路线须保持兼容。
- [ ] 用真实宿主/浏览器/设备或沙箱验证并记录命令、结果、工件；分别验证 `CODE_TESTED`、`CI_VERIFIED`、`RELEASED`、`CONSUMER_ACCEPTED`，不能混用。

## 建议分批优先级

P0：Web、PWA、Desktop、Browser Extension。P1：CLI、API/SDK、Automation、Bot、非微信小程序。P2：生态插件、Infrastructure。P3：Game、IoT、XR。**先完成独立真实项目 Dogfood，再让研究占位成为正式运行时路由；不要一次性把 14 条注册到 CLI 并假称可开发完成。**
