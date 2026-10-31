# 2026-11 Skill 与流程对抗审计

> 观测日期：2026-11-01。范围：本仓 11 阶段、审计时点的 8 个候选 Skill（本轮扩至 14 个）、四条路线 SOP、Agent 编排与 Git 协作。  
> 结论状态：`AUDIT_COMPLETED`。本文是决策证据，不是能力声明；任何“更好”都只表示当前证据下更合适。

## 1. 方法

对每个阶段与产物，按六条判断，而不是只看名称是否对得上：

1. 是否给出可执行步骤与顺序，而不只是原则；
2. 是否有失败模式、停止条件和反合理化规则；
3. 是否把验证落成命令、结果与回执；
4. 是否覆盖 2026 年平台与合规义务；
5. 是否支持多 Agent 协作（上下文边界、文件所有权、写者/审者分离）；
6. 是否有许可证与可维护性边界。

证据来源分三类：

- **公开规范/官方文档**：Anthropic《The AI-Native SDLC Playbook》（2026-08-21）、Agent Skills 规范（agentskills.io）、Claude Code Skills 文档、GitHub Spec Kit、Kiro、OpenSpec。
- **当前主流 Skill 集合**：`obra/superpowers`、`mattpocock/skills`、`addyosmani/agent-skills`、`trailofbits/skills`，以及本机已安装的同类 Skill。
- **平台规则**：微信公众平台 2026 备案/隐私/内容安全要求；Apple App Store 2026 审核要求；Google Play 2026 目标 API 与 Data Safety；EU AI Act 2026-08-02 高风险义务。

不复制任何第三方 Skill 正文。许可证未核实的一律 `LICENSE_UNVERIFIED`，只记录仓库、固定 commit 与用途。

## 2. 逐阶段对照

| # | 阶段 | 本仓现在 | 2026-11 更强选择 | 判断 | 动作 |
|---|---|---|---|---|---|
| 1 | intake | `project-discovery` | `repo-intake-and-plan`、`context-engineering` | 能用但偏简报；缺最小上下文、授权/干系人、停止条件 | 保留 ID，补强 |
| 2 | discovery | `project-discovery` | `brainstorming`、`grill-with-docs`、`interview-me`、`intent.md` | 不够对抗，容易接受第一版表述 | 增加一次一问的 interrogate 协议与 intent 产物 |
| 3 | specification | `specification` | `spec-driven-development`、`to-spec/to-prd`、Spec Kit | 只有 Given/When/Then；缺 EARS、场景分类、数据契约、AC→测试 1:1 | 补强 |
| 4 | architecture | `architecture` | `documentation-and-adrs`、`api-and-interface-design`、`doubt-driven-development` | 有 ADR；缺 API 契约、fitness function、对抗式设计评审 | 补强 |
| 5 | planning | `implementation-plan` | `writing-plans`、`planning-and-task-breakdown`、`to-issues` | 有纵切；缺 HITL/AFK、`blocked_by`、prefactoring、尺寸上限、协作分配 | 补强 |
| 6 | implementation | **无**（仅推荐 `systematic-debugging`） | `test-driven-development`、`incremental-implementation`、`executing-plans`、`subagent-driven-development` | **明显能力缺口**：排障不是实现 | 新增 `implementation` 必装 |
| 7 | verification | `verification` | `verification-before-completion`、`webapp-testing`、`browser-testing-with-devtools`、`performance-optimization` | 有证据块；缺测试层、真实浏览器/真机、性能预算、flake 隔离 | 补强 |
| 8 | review | `code-review` | `code-review-and-quality`、`requesting-code-review`、`receiving-code-review`、`security-and-hardening` | 有双轴；安全审计无独立 Skill；缺测试弱化检测、依赖/可观测性、风险分级 | 补强 + 新增 `security-review` |
| 9 | release | `verification`（借来的） | `shipping-and-launch`、`ci-cd-and-automation`、`finishing-a-development-branch`、`deprecation-and-migration` | **主用错误**：发布不是验证 | 新增 `release-engineering` 必装 |
| 10 | operation | **无** | `debugging-and-error-recovery`、`devops`、SRE 观察性实践 | **能力缺口**：无 SLO、黄金信号、告警、值班、事故角色 | 新增 `incident-response` 必装 |
| 11 | postmortem | `documentation-sync` | blameless postmortem、`documentation-and-adrs` | **主用错误**：文档同步不是复盘 | `incident-response` 必装，`documentation-sync` 转备选 |

横切新增：`security-review`、`eval-engineering`、`agent-collaboration`。  
明确不新增：`frontend-quality`、`data-modeling`、独立 `observability`、`i18n`。它们是产物质量维度，检查项进入 `architecture`、`verification`、`code-review` 与路线 Gate；在没有真实项目证明需要独立流程前不拆顶层 Skill。

## 3. 按产物的流程审计

| 产物 | 已有 | 2026-11 必须但缺失 | 结论 |
|---|---|---|---|
| SaaS/Web | 多租户隔离、认证/会话、迁移升降级、支付幂等/对账、备份回滚 | OIDC/SAML SSO、SCIM、会话撤销、审计保留/不可篡改、DPA/子处理者/数据驻留、DSAR、Webhook 签名+重放保护、PCI 范围、canary、恢复演练 | 部分正确，补 Gate |
| 企业系统 | RBAC/SSO、ERP/CRM 契约、迁移/审计/UAT | OIDC 与 SAML 明确、SCIM、ABAC/字段级、职责分离、审批状态机、审计 WORM、电子签收、双跑切换、供应商退出 | 方向正确，集成/审计不足 |
| 微信小程序 | AppID/类目/域名/登录/隐私授权/真机/体验版/提审 | ICP 备案（主体一致）+ 公安备案 + 付费认证；隐私指引与接口 1:1；`wx.getPrivacySetting` / `wx.requirePrivacyAuthorize`；禁止默认勾选；UGC 内容安全 API 前后端双审；类目-功能匹配；包体积；TLS 1.2+ 全链；域名限制；iOS 虚拟支付；灰度；PIPL 境内存储；注销删除 | 流程不完整 |
| 移动 APP | 技术栈、权限、离线、签名、商店、灰度、回滚 | Android API 36（2026-08）、16 KB page size、AAB + upload/release key；Xcode 26 / iOS 26 SDK（2026-04-28 起）、隐私清单/营养标签/ATT、AI 提供商同意弹窗；Data Safety 含三方 SDK；账号删除 URL；UGC 审核/年龄分级；COPPA；demo 账号；6.9"/13" 截图；分阶段发布 | 流程不完整 |
| AI/RAG/Agent | eval/integration/review；不得绕过底层权限 | EU AI Act 2026-08-02：风险分类、AI 注册表、人类监督、日志、技术文档、数据治理、鲁棒性、上市后监测；Article 50 披露；OWASP LLM Top 10；eval 数据集版本；RAG groundedness；Agent 状态契约；成本/延迟；不可逆动作 HITL；红队/canary | 流程不完整 |

平台规则会变化。上述条目是 `OBSERVED_2026-11-01`，不是永久承诺；未取得外部回执时证据保持 `NOT_RUN`。

## 4. 协作审计

| 能力 | 2026 主流 | 本仓现状 | 缺口 | 动作 |
|---|---|---|---|---|
| Plan mode first | 先计划、后执行 | 无 | 无阶段/Skill 要求 | `agent-collaboration` + `implementation-plan` |
| Subagents | 单会话委派，回传证据与未决项 | 无 | 无委派契约 | delegation contract |
| Agent teams | 3–5 teammates，共享任务表、点对点消息，不自动隔离 worktree | 无 | 无模式说明 | collaboration modes + 风险提示 |
| Worktrees | 每写者一树 | Git 指南 + provider capability | 只在建议层 | 并行写者强制独立 worktree |
| `/batch` | 多 worker、各自开 PR | provider `parallel_agents` 能力位 | 无批次规则 | batch-pr，一 worker 一 PR |
| Maker/checker | 写者不审自己 | `orchestration.mjs` 校验 ticket | 未进阶段 | 阶段级 reviewer independence |
| File ownership | 按文件分区 | `allowed_files` 重叠检查 | 未进 workspace | `delegation-plan.md` |
| Human gates | merge/release/permissions/spend | 证据模型隐含 | 无命名 Gate | `HUMAN_GATES` |
| Handoff | base SHA、分支、命令、未决项 | 有 handover 模板 | 缺 Agent 字段 | 扩展模板 |

结论：协作是“有零件、没装配”。本轮把规则写进 `src/collaboration.mjs` 与 `delegation-plan.md`，但运行时仍不自动创建 worktree、不自动合并、不自动发布。

## 5. 采纳与拒绝

采纳：

- 逐阶段主用 Skill 换到 2026 更强选择，保留稳定 ID。
- `intent.md` 前置产物、`delegation-plan.md` 协作产物、incident record 复盘产物。
- 测试/验证命令化，未知保持 `UNKNOWN`，发布/审核/备案只认外部回执。
- plan mode、worktree 隔离、写者/审者分离、人工生产 Gate。

拒绝：

- 不把 11 阶段换成六阶段；六阶段只做交付视图。
- 不引入 Spec Kit/Kiro/OpenSpec 作为运行时依赖。
- 不以 agent teams 为默认；单仓任务默认 solo/subagents。
- 不 Vendor 任何第三方 Skill 正文。
- 不采纳自动合并、自动发布、无限 Loop。

## 6. 未知项

- 第三方 Skill 的逐路径兼容性未在目标仓实测；本轮只做语义等价与来源标注。
- Claude Code / Codex / OpenCode 对 `metadata` 扩展字段的实际发现行为未逐 host 验证。
- 真实项目 Dogfood 未运行；所有新 Skill 仍是 `CANDIDATE`。
- 微信、Apple、Google 的审核细则与 EU AI Act 的成员国执行口径可能继续变化。
