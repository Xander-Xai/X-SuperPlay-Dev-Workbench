# SaaS / Micro-SaaS：拿到仓库后如何从零开始

> `CURRENT_FORMAL_ROUTE / READING_GUIDE_ONLY / DOGFOOD_NOT_RUN`。本页是导航，不重复定义权威 Gate；细节以 [自动生成 SaaS Route Pack](../routes/saas.md) 为准。

## 一个最小 SaaS 项目（团队任务板）

先准备两个隔离的测试租户 A、B，管理员与普通成员两种角色；目标是“登录→建任务→仅本租户可见”。非目标暂时包括企业 SSO、复杂工作流和多 Agent，除非真实客户需求存在。真客户数据及密钥不放入 Workbench。

## 11 阶段读法：每步都有产物与专用 Skill

| 阶段 | SaaS 必须做的动作 | 候选 Skill / 证据 |
|---|---|---|
| intake | 明确租户、角色、隐私、定价和授权范围 | project-discovery / intent.md |
| discovery | 访谈管理员和终端用户，梳理注册→使用→退出 | project-discovery / 两条旅程 |
| specification | 写跨租户拒绝、会话过期、订阅/账单（仅启用时）AC | specification / Spec 与负例 |
| architecture | 决定租户列/RLS 或可证明的隔离方案；定义 API、DB 迁移和身份 | architecture, security-review / ADR、威胁模型 |
| planning | 首张 Tracer Ticket：A 登录→写数据→B 不可读；控制文件和预算 | implementation-plan / Ticket |
| implementation | UI→API→DB 完整一条链；授权不能只写前端 | implementation / 测试与代码 |
| verification | 测 IDOR、跨租户读写、会话撤销、迁移升/降级与恢复 | verification / 真实命令、响应及结果 |
| review | 检查代码、依赖、权限、重放/幂等、日志脱敏 | code-review, security-review / Finding |
| release | staging 先演练备份/恢复、迁移及回滚，人工授权发布 | release-engineering / 发布回执 |
| operation | 监控延迟、异常与账单对账，定义告警 | incident-response / 运维日志 |
| postmortem | 根因、改进单与复用规则回流 | documentation-sync / 复盘 |

## 开始操作（Workbench 根目录；均为只读/预览）

```bash
node tools/xeng.mjs route-pack saas --json
node tools/xeng.mjs task feature --type saas --tier B --json
node tools/xeng.mjs init ../your-project --profile saas,web,backend --tier B --task feature --mode new --dry-run
```

**不要跳过负例**：A token 请求 B 对象/导出必须被服务端拒绝；撤销成员权限后旧 token 不可继续写入；如启用支付，重复回调与对账需真实沙箱。未实际执行就标 `NOT_RUN`。真实生产发布与用户验收需要另外授权和回执。

- [SaaS Route Pack：PREFLIGHT、11 阶段、Gates、负例、Skill core](../routes/saas.md)
- [CLI 用法](../CLI_REFERENCE.md)
- [回到品类导航](README.md)
