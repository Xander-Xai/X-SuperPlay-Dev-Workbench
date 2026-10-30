# 真项目工程开发 SOP（从需求到复盘）

## 项目开始：明确交付边界

确定用户是谁、解决什么问题、业务/安全底线、现状、哪些条件仍未知。需求来自 JD 或面经时必须标记“工程场景假设”，不能当作已签客户。新项目和现有项目分别处理；已有代码先运行可重复的 baseline。

## 01 选择路线与 Profile

SaaS：saas + web + backend；关注租户隔离、账号会话、迁移/回滚、商业交易边界。
企业系统：web + backend；关注 RBAC/SSO、接口兼容、数据迁移、关键岗位 UAT。企业 Profile 尚不是独立权威 Profile。
小程序：mini-program + backend；关注平台登录、合法域名、真机、版本提审。
APP：Flutter/React Native/Android/iOS 中**择一**，再按需 backend；不是同时安装四种端。
有 AI 能力时再追加 ai-application / rag / agent。RAG 和 Agent 必须同时满足基础应用的质量要求。

## 02–04 形成可检查的工作合同

需求 → Spec（Goal / Non-goals / Given-When-Then / 权限负例）→ 架构与 ADR（接口、数据边界、恢复和取舍）→ 任务规划（Tracer Ticket，blocked_by，测试命令和最低预算）。首张卡应纵向穿过必要 UI、API、数据库和测试，而不是先做完所有 UI 再联调所有后端。

## 05–08 有界实现与真实验证

逐 Ticket：读取项目本地 AGENTS.md/CLAUDE.md → 复现 baseline → 写测试 → 最小实现 → 运行真实测试/集成探针/端侧验证 → 独立 Review → 保存证据和当前状态。

遇到无权限、需求不可验证、重复同种失败、明确超预算时立即停止并汇报。Review 要同时核对 Spec 和 Standards；CI 成功不能证明真实客户使用成功。

## 09–11 发布、观察与方法升级

发布前确认备份、数据迁移、回滚方式、权限与审批。记录具体版本、构建、设备和平台回执。监控错误、性能、成本和用户反馈；在项目仓形成复盘。

把复盘分类为：需求模板 / 文档更新 / AGENTS 规则 / Skill 候选 / 测试 / Hook / CI Gate。优先让已有检查捕捉重复错误，而非不断增加新文档。经过不同任务真实复用和验证，再由 Engineering OS 评审晋级。

## 典型小程序垂直切片

Ticket 1：微信授权登录 → 服务端会话 → 查询可预约时段；含无权限与空态负例。
Ticket 2：选时段 → API 创建预约 → 数据库存储 → 管理后台可见；含重复预约、并发冲突与幂等。
Ticket 3：真机弱网/失败恢复 → 审核预检查 → 在获授权时提交平台审核。

每张卡记录 source commit、验收 AC、负责 Agent/人、批准权限、真实测试命令及结果。不存在实际执行回执时，状态就是 NOT_RUN。

## Agent 阶段交接

在 Workbench 中选择目标项目类型及当前阶段，先审查本地基线，再点击“复制本阶段 Agent 任务提示词”。粘贴到项目自己的 Claude Code/Codex/OpenCode 会话，由它在项目目录核实本地治理、源 Skill 是否可用、真实命令与权限。该提示词本身不具备执行权限，也不能代替业务方确认的 AC 和环境审查。
