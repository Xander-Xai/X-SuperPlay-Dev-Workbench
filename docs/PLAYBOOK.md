# 真项目工程开发 SOP（从需求到复盘）

## 项目开始：明确交付边界

确定用户是谁、解决什么问题、业务/安全底线、现状、哪些条件仍未知。需求来自 JD 或面经时必须标记“工程场景假设”，不能当作已签客户。新项目和现有项目分别处理；已有代码先运行只读 baseline（`npm run probe`）。

## 01 选择路线、任务与 Profile

在 Workbench 启动器中选择：

- 交付对象：SaaS / 企业自研 / 微信小程序 / 移动 APP。
- 项目状态：从零开发 / 接手迭代（后者自动补 intake + discovery）。
- 任务类型：13 种之一。任务决定阶段序列，而不是每次都跑完整 11 阶段。
- Tier：A 生产级 / B 交付验证 / C 学习实验 / D 一次性试验。
- 技术栈：APP 四选一；小程序四选一。
- 扩展：AI Application / RAG / Agent / 支付。

Profile 组合：

- SaaS：`saas + web + backend`；租户隔离、会话、迁移/回滚、支付边界。
- 企业系统：`enterprise + web + backend`；RBAC/SSO、集成契约、迁移、UAT。
- 小程序：`mini-program + backend`；平台登录、合法域名、真机、提审。
- APP：`mobile + <flutter|react-native|android|ios> + backend`，不同时安装四种端。
- AI：追加 `ai-application`，按需再追加 `rag` / `agent`；评测是必需义务。

每条路线同时生成独立 SOP，列出前置条件、平台不可替代环节、必须覆盖的负例、验收 Gate、失败处理与回退。平台环节（支付渠道、企业 IdP、微信审核、设备签名/商店）只能产生 `BLOCKED` / `NOT_RUN` 或真实平台回执，不能用本地代码测试替代。

## 02–04 形成可检查的工作合同

需求 → Spec（Goal / Non-goals / Given-When-Then / 权限负例）→ 架构与 ADR（接口、数据边界、恢复与取舍）→ 任务规划（Tracer Ticket，blocked_by、测试命令、最低预算）。首张卡应纵向穿过必要 UI、API、数据库和测试，而不是先做完所有 UI 再联调所有后端。

Tier C/D 可以把 `specification` / `architecture` 标为 optional，但必须在任务记录中写明理由；不允许静默跳过。

## 05–08 有界实现与真实验证

逐 Ticket：读取项目本地 AGENTS.md/CLAUDE.md → 复现 baseline → 写测试 → 最小实现 → 运行真实测试/集成探针/端侧验证 → 独立 Review → 保存证据与当前状态。

遇到无权限、需求不可验证、连续两次修复未改变假设、明确超预算时立即停止并汇报。Review 同时核对 Spec 与工程标准；CI 成功不能证明真实客户使用成功。

## 09–11 发布、观察与方法升级

发布前确认备份、数据迁移、回滚方式、权限与审批。记录具体版本、构建、设备和平台回执。监控错误、性能、成本与用户反馈；在项目仓形成复盘。

复盘分类为：需求模板 / 文档更新 / AGENTS 规则 / Skill 候选 / 测试 / Hook / CI Gate。优先让已有检查捕捉重复错误，而不是不断增加新文档。经过不同任务真实复用和验证后，再向 Workbench 提出 Skill 或 Gate 改进。

## 典型小程序垂直切片

Ticket 1：微信授权登录 → 服务端会话 → 查询可预约时段；含无权限与空态负例。  
Ticket 2：选时段 → API 创建预约 → 数据库存储 → 管理后台可见；含重复预约、并发冲突与幂等。  
Ticket 3：真机弱网/失败恢复 → 审核预检查 → 在获授权时提交平台审核。

每张卡记录 source commit、验收 AC、负责 Agent/人、批准权限、真实测试命令及结果。没有执行回执时，状态就是 `NOT_RUN`。

## Agent 阶段交接

在 Workbench 中选择项目与当前阶段，审查本地基线，再复制本阶段 Agent 任务交接。粘贴到项目自己的 Claude Code / Codex / OpenCode 会话，由它在项目目录核实本地治理、Skill 是否可用、真实命令与权限。

交接文本本身不具备执行权限，不能代替业务方确认的 AC 和环境审查。Skill 安装状态在交接中固定为 `UNKNOWN`，除非目标项目另有可核验记录。

## 工具顺序

1. `node tools/xeng.mjs init <target> --dry-run` 预览工程基线。
2. `node tools/project-probe.mjs` 只读探测已有项目。
3. `node tools/skill-kit.mjs plan` 预览 Skill 安装。
4. 人工审查后 `--apply --confirm-reviewed`。
5. `node tools/xeng.mjs audit` / `doctor` 检查工程事实与漂移。
6. 真实执行、记录证据、再谈“完成”。
