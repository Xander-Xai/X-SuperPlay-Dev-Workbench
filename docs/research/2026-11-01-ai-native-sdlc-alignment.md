# 六阶段 AI-Native SDLC 对照（2026-11-01）

> 状态：`REFERENCE_ALIGNED`。六阶段是**交付视图**，不是第二套生命周期。  
> 权威模型仍是 `src/catalog.mjs` 的 11 阶段；机器可读对照在 `src/delivery.mjs` 的 `SDLC_CROSSWALK`。

## 1. 六阶段与产物链

| 阶段 | 目标 | 产物 | 对应 11 阶段 | 对应活动 |
|---|---|---|---|---|
| Plan | 把意图变成可验收的范围 | `intent.md`、`spec.md` | intake / discovery / specification | A01 / A02 / A04 |
| Design | 定边界、契约与取舍 | `adr/NNNN-*.md`、`api-contract.yaml` | architecture | A03 / A05 / A06 |
| Build | 以可运行增量实现 | `plan.md`、`tickets.json`、`commit`、`test-output.txt` | planning / implementation | A07–A11 |
| Test | 用证据证明行为并独立评审 | `test-report.md`、`e2e-report.md`、`review.md`、`evidence.json` | verification / review | A12 / A14 |
| Deploy | 授权、发布、回滚 | `release-receipt.md`、`changelog.md` | release | A16 |
| Maintain | 观察、响应、复盘 | `ops-log.md`、`incident-ledger.md`、`postmortem.md` | operation / postmortem | A13 / A17 / A18 |

## 2. 采纳

- `intent.md` 先于 `spec.md`：问题、预期结果、影响面、约束、开放问题。
- plan mode 默认：先计划、人类批准，再执行。
- skills 是建议性、hook 是确定性：能自动阻断的检查不要只写在文档里。
- eval 进入 CI：20–50 个真实任务做回归，而不是只看单次演示。
- worktree 隔离与写者/审者分离：并行工作必须有独立工作树。
- 人守生产门：合并、发布、权限、花费、破坏性动作必须由人类批准。

## 3. 不采纳

- 不用六阶段替换 11 阶段；不新增第二套状态机。
- 不引入无限 Loop、自动合并、自动生产发布。
- 不把 CI 通过当作真实设备、商店审核或消费者验收。
- 不把 agent teams 作为默认协作方式；单仓任务默认 solo/subagents。

## 4. 映射规则

- 每个六阶段行必须至少映射到一个 canonical stage。
- 六阶段合起来必须覆盖全部 11 阶段，且不重复定义状态。
- `SDLC_CROSSWALK` 只做展示与机器读取；所有 Gate 仍由 11 阶段、路线 SOP 与证据模型定义。
- 任何冲突以 `src/catalog.mjs` 与 `src/engine.mjs` 的校验为准。
