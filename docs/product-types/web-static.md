# 网站 / 静态 Web / H5：初步独立开发路线

> **状态：`RESEARCH_PLACEHOLDER / NOT_RUNTIME_ROUTE / NOT_REAL_PROJECT_VERIFIED`**。资料核对：2026-11-02。本文是专用品类占位，不是已注册的 CLI `type`、不是完整可执行 Route Pack，也不是平台审核回执。

## 1. 适用范围 / 排除

- **交付对象**：官网、博客、落地页、纯浏览器工具。
- **不要混用**：不是默认多租户 SaaS；无后端的静态站点不用租户/支付/数据库迁移 Gate。
- **可参考但不代表已支持的 Profile**：web。
- **扩展优先级**：P0（仅路线建设顺序）。

## 2. 从需求到交付：对应权威 11 阶段

| 权威阶段映射 | 本品类应做什么 | 最低产物 |
|---|---|---|
| `intake / discovery` | 确定目标访问者、转化行为及目标语言；交付站点简报 | 需求简报/授权/用户旅程 |
| `specification` | 设计页面清单、表单/隐私 AC、导航和 SEO 验收 | Spec/AC 与负例 |
| `architecture` | 选静态/SSG/SSR、资源缓存及内容更新路径并记 ADR | ADR/信任与部署边界 |
| `planning` | 先做主页→CTA→成功页纵向 Ticket | Tickets/预算/停止条件 |
| `implementation` | 实现响应式页面、输入校验与构建流程 | 可运行纵向切片与测试 |
| `verification / review` | 跨浏览器 E2E、移动截图、性能与 XSS 回归；独立 Review | 实际测试结果/独立 Review |
| `release` | 预览→绑定域名 HTTPS→发布→验证回滚 | 构建/发布/回滚回执 |
| `operation / postmortem` | 监控转化、断链和错误；复盘 | 运维观测/复盘报告 |

> 为首次阅读将部分连续阶段并排呈现，但每个原始阶段仍由 `src/catalog.mjs` 统一定义，不能凭此表自行跳过对应 Gate。

## 3. 候选 Skills 与必需工具

- **本品类优先学习/按需装配**：`project-discovery`、`specification`、`architecture`、`implementation`、`verification`、`security-review`、`release-engineering`。它们属于仓库已有 14 个候选 Skill，未因本文执行、安装或晋级。
- **不能让 Skill 代替的工具/账号**：Cloudflare Pages / 静态托管；真实浏览器、HTTPS 域名。外部平台、设备和真实发布权仍需人工授权。

## 4. 本品类真正不同的验收

- **首批必须设计的负例**：XSS、断链、响应式失效、SEO 元信息缺失、表单服务端未校验。
- **关键发布 Gate**：真实移动浏览器与部署 URL、可访问性和回滚记录。未执行或未获授权必须写为 `NOT_RUN` / `BLOCKED`；不得由 Mock/CI 绿替代。
- **首张 Ticket 建议**：先做主页→CTA→成功页纵向 Ticket；先满足一个端到端成功路径和至少一个失败路径，并记录实际环境、命令、结果与工件。

## 5. 官方资料与升级界线

- 主要依据：[平台/标准官方入口](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/)。更新平台规则前重新核查原文，本文不永久保证资质、审核或 API 版本要求。
- **从研究占位升级的条件**：独立 `PREFLIGHT` + Route SOP + 每阶段产物/退出标准 + 专属负例和 Gate + 技术栈分支 + 新旧路由兼容测试 + 至少一次授权真实项目验证。当前全部未执行。

返回 [产品品类导航](README.md)。
