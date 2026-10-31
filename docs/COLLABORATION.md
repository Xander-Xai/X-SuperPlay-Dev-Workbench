# 开发协作与委派

> 状态：`ADVISORY_CONTRACT_VALIDATED`。机器可读定义在 `src/collaboration.mjs`；本文件解释如何使用，不新增第二套编排器。

## 1. 原则

- **Plan mode first**：先写计划与 AC，人类批准范围、命令与预算，再执行。
- **写者不审自己**：高风险变更必须有独立 reviewer。
- **并行写者不共享工作树**：一个写者一个 worktree，允许文件不相交。
- **人工 Gate 不可绕过**：合并、发布、生产访问、权限、花费、外部沟通、破坏性动作必须由人类批准。
- **Workbench 只校验，不执行**：不自动创建 worktree、不合并、不发布、不改权限。

## 2. 协作模式

| 模式 | 适用 | 隔离 | 禁止 |
|---|---|---|---|
| `solo` | 单写者、小范围 | 当前工作树 | 并行写同一文件 |
| `subagents` | 同会话独立切片 | 共享树；多写者必须改 worktree | 两写者同文件 |
| `worktrees` | 多写者/实验线 | 每写者一树一支 | 共享可写树 |
| `agent-teams` | 需要共享任务表与消息 | 写入仍需独立 worktree | 假设平台自动隔离 |
| `batch-pr` | 大量独立机械任务 | 一 worker 一树一 PR | 多 worker 合一个 PR |

## 3. 委派契约

每个委派任务必须包含：

| 字段 | 说明 |
|---|---|
| `ticket_id` | 稳定 ID |
| `writer` | 写者 |
| `reviewer` | 独立审者 |
| `worktree` | 并行写者必填 |
| `branch` | 分支 |
| `base_sha` | 起始提交 |
| `allowed_files` | 写范围 |
| `allowed_commands` | 可执行命令 |
| `stop_conditions` | 停止条件 |
| `handoff` | 回传格式 |
| `human_gates` | 适用的人工 Gate |

缺任一字段，不得委派。

## 4. 文件所有权

- 按文件/模块分区；两个写者不能并行改同一文件。
- 共享文件必须串行或指定单一 owner。
- 冲突由 orchestrator 按合并顺序解决；worker 不互相合并。
- reviewer 不得是同一变更的 writer。

## 5. 人工 Gate

`src/collaboration.mjs` 的 `HUMAN_GATES`：

`merge`、`release`、`production-access`、`permissions`、`spend`、`external-comms`、`destructive`。

任何 agent 不得自批、不得禁用 hook、不得绕过必需检查。

## 6. Handoff

回传应短：

- base SHA / 分支 / worktree；
- 修改文件与原因；
- 运行过的命令与结果；
- 证据路径；
- 未决问题与 UNKNOWN；
- 建议下一步。

## 7. 与外部编排器的关系

- `src/orchestration.mjs` 管外部 provider 的能力注册与 PLAN_ONLY 交接。
- `src/collaboration.mjs` 管本仓交付级委派契约。
- 两者都只读；不互相替代，也不自动执行。
- 外部回执保持 `UNTRUSTED`，不能提升证据状态。

## 8. 校验

```bash
node --test test/collaboration.test.mjs
npm run check
```

以下情况会被拒绝：

- 写者 = 审者；
- 并行写者没有独立 worktree；
- 两个写者 `allowed_files` 重叠；
- release/production/destructive 缺人工 Gate；
- `batch-pr` 两个 worker 共享 PR。
