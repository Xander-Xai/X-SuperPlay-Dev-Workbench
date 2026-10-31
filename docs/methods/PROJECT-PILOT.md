# 真实项目试点 SOP：Spec → Skills → Harness → Bounded Loop → Demo

> 参考 [完整方法定义](AI-NATIVE-SPEC-HARNESS-SKILLS-LOOP.md) 与 [固定上游来源](UPSTREAM-SOURCES.md)。这是**可复制的执行协议和练习模板**，不是已完成的真实交付案例。默认单人、单 Agent、单任务和最低权限；支持 Claude Code / Codex / OpenCode。真实运行证据必须留在产品仓，不要写入公开 Workbench。

## 0. 选择试点：一个能够运行的完整纵切片

**样例：知识库问答小型灯塔项目（合成场景，无客户数据）**

> 用户上传一份合法的示例文档，服务端建立索引，用户提交一个问题；模型给出有证据的回答和引用；证据不足时拒答；非授权用户不能访问其他人的文档。

- **范围**：简易 UI、API、认证/会话边界、数据存储、检索+引用、可控回答、测试与启动说明。
- **非目标**：多租户收费、复杂多 Agent、生产环境自动发布、真实客户文档或企业认证。
- **数据**：完全合成的公开测试文档；外部模型/API 若无批准与预算，仅以 Mock 测试，并将 real-provider 测试标 `NOT_RUN`。
- **Tier**：建议 B（交付验证）/ C（学习实验），Profile 为 `web + backend + ai-application + rag`，实际由 Workbench route 推导。
- **目标证据**：可重现的本地启动命令、固定版本、UI→API→检索→回答实际截图或集成测试、权限负例、失败恢复和成本说明；真实 provider 评测必须单独列证据。

## 1. 只读发现（Brownfield 必做；Greenfield 先立最小基线）

在 Workbench 仓库：
```bash
npm run verify
node tools/xeng.mjs method
node tools/xeng.mjs method sources
node tools/xeng.mjs task feature --type=saas --tier=B
# 请用真实的类型/任务/Tier；下面的 target 仅占位
node tools/xeng.mjs assemble --target ../your-project --type saas --task feature --tier B --agent codex
```

`assemble` 默认 dry-run，不写目标。先在**目标产品仓**核验分支、HEAD/dirty、`AGENTS.md`/`CLAUDE.md`、许可、CI、已有测试、真实 run/test 命令、依赖/环境、数据许可；对已有工程可用 `npm run probe -- --target ../your-project --type saas` 只读探测，但它不会实际运行测试或理解业务代码。

**停机条件**：目标没有访问授权、当前事实不可核对、需操作真实客户/秘密数据、要求凭据或外部有副作用写入却未批准。先报 `BLOCKED`，不进入实现。

## 2. 复制到产品仓的最小 Spec

```markdown
# SPEC-001 · 可引用的知识问答 MVP（草案）
source: ENGINEERING_HYPOTHESIS
owner: PENDING
target_repo: PENDING
base_sha: UNKNOWN
tier: B
scope: 上传示例文档、按权限检索、引用/拒答
non_goals: 生产认证、付费、自动扩容、多智能体
assumptions: provider、OCR、数据授权、并发规模均需复核

AC-01 Given 合法样例文档 When 上传并完成索引 Then UI 显示已可检索，后端能返回同一 document_id。
  evidence: 单测 + API/UI 集成检查；未执行 NOT_RUN
AC-02 Given 授权用户和索引文档 When 提问 Then 回答携带可追溯的文档引用。
  evidence: 集成测试；若使用 Mock，标明与真实模型评测分开
AC-03 Given 检索结果为空 When 提问 Then 系统按策略拒答而不是编造引用。
  evidence: 负例测试
AC-04 Given 用户 B When 查询用户 A 的私有文档 Then API 明确拒绝且不泄露文档片段。
  evidence: 跨身份/跨租户测试；不得只测 UI 隐藏按钮
AC-05 Given 服务端超时/上传失败 When 重试 Then 错误可观察且状态可恢复，无重复记录。
  evidence: 超时与幂等/恢复测试
AC-06 Given 本地依赖按 README 启动 When 从浏览器演示完整流 Then 可重现 UI→API→retrieval→response 流程。
  evidence: 启动命令、环境版本、截图/视频、日志、明确未测项

release_conditions: Owner 批准 + 真实部署身份 + rollback + 用户验收（当前未满足）
```

Spec 要么由真客户/负责人批准，要么继续以假设身份用于学习。不要将示例 AC 伪称产品完成度。

## 3. Tracer Tickets（每张都贯通可见功能链）

| Ticket | 依赖 | 纵向结果 | 负例与检查 |
|---|---|---|---|
| T-01 | 无 | UI 上传样例→API 校验→存储/索引状态→读取状态 | 越界类型/大小、重复上传、无认证 |
| T-02 | T-01 | UI 提问→API→授权检索→引用/拒答→结果显示 | 无命中、跨用户检索、Mock 与真实 Provider 分离 |
| T-03 | T-02 | 本地一键运行→集成与失败恢复→演示证据 | 断网/超时/重试、不可恢复失败、可观测回退 |

每卡必须具备：`ticket_id / accepted_AC / blocked_by / current_base_sha / scope_files / forbidden_actions / allowed_commands / tests_evals / evidence_artifacts / iteration_budget / stop_conditions / rollback / reviewer`。先验收 T-01，再处理 T-02；不能因前端看起来可用就声称纵切完成。

## 4. Harness 准备清单（在目标产品仓填写）

```yaml
# 仅是记录模板：不要把密钥或客户数据写进这里
task_id: T-01
branch: UNKNOWN
base_sha: UNKNOWN
dirty: UNKNOWN
agent: codex  # or claude-code / opencode
context:
  local_rules: [AGENTS.md, CLAUDE.md]
  spec: docs/specs/SPEC-001.md
  ticket: docs/plans/T-01.md
  relevant_tests: UNKNOWN
tools:
  allowed: [read, edit-scoped, run-approved-local-tests]
  forbidden: [deploy, push, secret-read, destructive-reset, external-write]
  external_network: DENIED_UNTIL_APPROVED
validation:
  commands: [] # 在目标产品仓复核后填入真实、可运行命令
  negative_tests: [unauthorized_read, invalid_upload]
  real_provider_eval: NOT_RUN
budget:
  active_tickets: 1
  no_new_evidence_retries_per_hypothesis: 2
  max_wall_clock: OWNER_TO_CONFIRM
  max_external_cost: OWNER_TO_CONFIRM
  stop_on: [permission_violation, repeated_unchanged_failure, scope_drift, missing_evidence]
evidence:
  commands_and_exits: []
  artifact_paths: []
  status: NOT_RUN
```

没有核实的命令填 `UNKNOWN`，不能把空命令清单当成已具备 Harness。高风险行为必须有实际的环境/工具限制，而非只靠语言承诺。

## 5. 单 Ticket 有界 Loop

```text
PREPARE: Owner 授权、任务 AC 固定、HEAD 基线、权限与测试入口已核实
REPRODUCE: 先得到失败 AC / 可复现输入（无测试接口则修复 Harness 或标阻断）
IMPLEMENT: 最小作用域写入（禁止超出 Ticket 范围）
VERIFY: 运行真实 check/test/eval；保存命令、退出码、版本与脱敏输出
REVIEW: Spec/AC 与 Standards/security 分开给证据
RECORD: 状态、diff、失败假设、剩余预算、待人工决定项
IF PASS: 准备 PR；不自动发布
IF FAIL + 新假设 + 预算: 同 Ticket 下一次尝试
IF FAIL 无新证据两次/越权/安全风险/预算用尽: STOP 并移交人类
```

**Loop 记录模板**（每次实际执行填一条，不填写就不能声明完成）：

| 字段 | 必填证据 |
|---|---|
| `attempt_id / ticket_id / base_sha / candidate_sha` | 真实 Git 指针；未提交用 diff 摘要 |
| `hypothesis + changed_assumption` | 解释本次与上次不同在哪里 |
| `command / exit_code / output_ref` | 实际执行，不抄示例 PASS |
| `AC_pass / AC_fail / AC_not_run` | 每个 AC 与具体命令/回执对应 |
| `standards_review / security_findings` | 单独独立评审，不能仅说 CI 绿 |
| `remaining_budget / stop_reason` | 达到 STOP 后不得自动继续 |

## 6. 给 Coding Agent 的真实项目启动提示词

> 在**目标产品仓**使用，不要在 Workbench 直接生成客户代码。只读首轮不要求授予全仓写权限。

```text
角色：真实全栈项目的受限 Coding Agent。仅执行当前获批准的一张 Tracer Ticket。
目标：根据项目本地 AGENTS.md/CLAUDE.md 与 docs/specs 中确认的 Spec 工作。
方法入口：X-SuperPlay-Dev-Workbench/docs/methods/AI-NATIVE-SPEC-HARNESS-SKILLS-LOOP.md
优先级：项目的安全/权限规则和现有测试事实 > 该方法指南 > 本提示词。

第一阶段只读：
1. 输出 repo、HEAD/dirty、AGENTS/CLAUDE、可复现命令、相关接口与风险；
2. 标明 FACT / ASSUMPTION / UNKNOWN；核实本轮授权，绝不读取或输出凭据；
3. 形成一页可验收 Spec 与 AC（含权限/失败负例）、按依赖的首张纵切 Ticket；
4. 提议最小 Skills 与 Harness 反馈路径，说明第三方 Skills 是否真的安装/加载；
5. 如存在阻断点先汇报，不要写代码或调用有副作用工具。

只有当前 Ticket 已批准且权限/预算/测试入口明确后：
A. 复现或先写失败测试；B. 最小实现；C. 运行真实允许的验证；
D. 做 Spec+Standards 双轴 Review，保存命令/退出码/证据；
E. 若两次重复失败却无新假设、新证据，或出现越权、秘密、不可逆影响、成本超支，立刻 STOP。
无明确批准禁止自动 push/merge/deploy/付费/第三方安装/数据删除。
输出按 AC 列 PASS/FAIL/UNKNOWN/NOT_RUN 和下一步，绝不把 Mock/CI 成功冒充用户验收。
```

## 7. 灯塔项目实战验收（尚未执行）

- [ ] 产品仓真实 HEAD/dirty、项目规则、数据与权限已核实；基线证据入产品仓
- [ ] Spec 全部 AC 可测，负例覆盖越权/无命中/失败恢复；Owner 对范围作出决定
- [ ] T-01/T-02/T-03 每张有依赖、Scope、预算与 STOP 回执
- [ ] 最少一个完整 Harness 反馈路径已实际运行；Agent Skill 实际加载单独取证
- [ ] 至少一轮 Loop 真实运行并留失败/修改/验证/Review 的完整轨迹
- [ ] 真正的 UI→API→RAG→引用/拒答 demo；若无真实 provider，说明不足
- [ ] PR 有 exact base/head SHA、实际测试、未覆盖项、风险、回滚；未经授权不合并
- [ ] 若要发布/收费，额外检查平台资质、资金/隐私、部署回滚和消费者验收
- [ ] 第二项目复用后再考虑提升为通用 Skill/Pattern

**判定**：本页的发布仅能证明“有文档可用”。`NOT_RUN` 需逐项变为具有实际回执的状态；不能直接改为 `VERIFIED`。不要将外部招聘方的“选拔路演/每日淘汰”流程写作本 Workbench 的既有能力；如需练习，可在产品仓附加演示评分表，但成绩与正式 Offer 不可由代码自动推断。
