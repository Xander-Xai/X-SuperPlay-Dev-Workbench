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

## 占位 → 可用的最小升级门槛

- [ ] 先锁定唯一目标平台及真实用户，确认它确实不是既有 Route + Overlay 能表达的场景。
- [ ] 写独立 `PREFLIGHT`、完整 11 阶段 SOP、候选 Skill 映射、负例、发布/回滚与阻断 Gate。
- [ ] 经授权变更 `TYPES / ROUTE_SOPS / route-packs / routing`、网页选择器、证据模型与测试，旧四路线须保持兼容。
- [ ] 用真实宿主/浏览器/设备或沙箱验证并记录命令、结果、工件；分别验证 `CODE_TESTED`、`CI_VERIFIED`、`RELEASED`、`CONSUMER_ACCEPTED`，不能混用。

## 建议分批优先级

P0：Web、PWA、Desktop、Browser Extension。P1：CLI、API/SDK、Automation、Bot、非微信小程序。P2：生态插件、Infrastructure。P3：Game、IoT、XR。**先完成独立真实项目 Dogfood，再让研究占位成为正式运行时路由；不要一次性把 14 条注册到 CLI 并假称可开发完成。**
