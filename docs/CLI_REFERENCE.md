# CLI 参考

> 状态：`CURRENT`（2026-11-01）。所有命令离线运行，不联网；`init` 不覆盖已有文件；`assemble` 与 `skill-kit` 默认 dry-run。

## 1. `xeng`

```bash
node tools/xeng.mjs <command> [options]
```

| 命令 | 作用 | 主要参数 |
|---|---|---|
| `init <path>` | 生成项目基线（默认 dry-run） | `--profile a,b`（必填）、`--tier A\|B\|C\|D`、`--task`、`--mode new\|existing`、`--name`、`--dry-run` |
| `audit [path]` | 只读工程检查 | `--json` |
| `doctor [path]` | 链接/命令/漂移检查 | — |
| `maturity [path]` | L0–L6 缺口诊断 | `--json` |
| `playbook [id]` | 三份工程手册 | `--json` |
| `method [...]` | 方法视图 | `overview\|sources\|pilot\|design\|skills\|activities\|matrix\|A01..A18`、`--json`、`--template` |
| `validate-registry` | 校验 14 个 Skill bundle 与 catalog 一致 | — |
| `selftest` | 运行完整测试套件 | — |
| `task <task-id>` | 某任务类型的阶段路线 | `--tier=`、`--mode=`、`--type=`、`--json`（含 `routePack`） |
| `route-pack [type]` | 四条路线的开工前检查、11 阶段流程、Gate、负例与 Skill 侧重 | `--json`；无参数列出四条路线 |
| `matrix` | 8/18/11 矩阵 | `--json` |
| `delivery` | 交付状态、Loop、Ticket 契约、crosswalk、AI Overlay | `--json` |
| `skills-matrix` | 本地/外部 Skill 关系矩阵 | `--json` |
| `orchestrator list\|doctor\|plan\|receipt` | 外部编排只读注册表与 PLAN_ONLY 交接 | `--json`；`plan` 另支持 `--provider`、`--agent`、`--ticket`、`--base-sha`、`--project-id`、`--repository`、`--platform` |
| `assemble` | 为目标项目生成 Skill 安装计划 | `--target`（必填）、`--type`、`--task`、`--tier`、`--mode`、`--agent`（必填）、`--stack`、`--addons`、`--apply --confirm-reviewed` |
| `agent-check` | 校验 bundle 内容与已安装文件哈希；Agent 发现/调用/效果单独保持 `NOT_RUN` 直到真实探针 | `--target`、`--agent` |
| `ticket-preflight` | 对单张批准 Ticket 做静态开工检查；不执行命令、不产生 Harness Ready | `--target`、`--ticket`、可选 `--tickets`、`--json` |
| `ticket-run` | 仅对内置合成 sandbox smoke fixture 做受控测试；默认 dry-run，不运行 Ticket 提供的代码 | `--target`、`--ticket`、`--execute --confirm-reviewed --evidence-dir <existing-dir>` |
| `ticket-trace` | 确定性检查 Spec AC → Ticket → Test → Receipt → Git SHA 声明链；不提升证据可信度 | `--input <trace.json>`、`--json` |
| `skill-eval` | 离线确定性评测 Skill 触发规则与合成轨迹；不安装 Skill、不调用 Agent/模型 | `--input <cases.json>`、`--json` |
| `version` | 打印版本 | — |

### 退出码

| 码 | 含义 |
|---|---|
| 0 | 成功 |
| 1 | `doctor` 发现漂移、`maturity` 有阻断项，或 Skill Eval 预期与观察结果不符 |
| 2 | 参数错误、安全阻断、覆盖拒绝、未知命令 |

### 示例

```bash
node tools/xeng.mjs init ../my-app --profile saas,web,backend --tier B --dry-run
node tools/xeng.mjs task bug --type saas --json
node tools/xeng.mjs route-pack mini-program --json
node tools/xeng.mjs assemble --target ../my-app --type saas --task feature --tier B --agent codex
node tools/xeng.mjs orchestrator plan --provider orca --agent omp --ticket ticket.json --platform windows
node tools/xeng.mjs ticket-preflight --target ../my-app --ticket ticket.json --tickets tickets.json --json
node tools/xeng.mjs ticket-run --target <synthetic-git-fixture> --ticket <approved-smoke-ticket.json> --json
node tools/xeng.mjs ticket-run --target <synthetic-git-fixture> --ticket <approved-smoke-ticket.json> --execute --confirm-reviewed --evidence-dir <existing-dir> --json
node tools/xeng.mjs ticket-trace --input <spec-ticket-test-receipts.json> --json
node tools/xeng.mjs skill-eval --input test/fixtures/skill-eval-cases.json --json
```

`ticket-preflight` requires a clean target Git root, exact `base_sha`, explicit approval and non-placeholder ACs, exact non-glob file paths without symlink components, safe declared commands, a declared test/check command, budgets and stop conditions. Dependencies require structurally complete receipts whose claims remain untrusted. A clear result is `PREFLIGHT_CLEAR_NOT_HARNESS_READY`: no commands ran, there is no runtime scope/command sandbox, and `harnessReady` stays `false`.

`ticket-run` 当前只接受仓库内唯一文件 `test/fixtures/sandbox-smoke.json`（必须是 `{"schemaVersion":1,"expected":"isolated"}`）和唯一命令标识 `xeng-fixture-test:sandbox-smoke-v1`。它**不执行 Ticket 源码或 Ticket 的命令字符串**，而是将固定 smoke program 作为 argv 直接传给已有 WSL2 `bubblewrap`：独立 user/PID/network/IPC/UTS/cgroup namespaces、只读最小运行时、无 Windows 挂载/环境/互操作 socket、非特权 UID、capability drop、`no_new_privs` 与 `prlimit`。实际 smoke 观察并核对 RLIMIT：20 秒总超时（且不超过 Ticket 声明预算）、8 KiB 捕获输出、256 MiB 地址空间、10 秒 CPU、16 个进程/UID、1 MiB 单文件上限、64 个打开文件。缺少任一运行时能力时阻断；没有宿主机回退。它不是通用项目测试 Runner，也不接受 Agent 写入。默认只报告 dry-run；实际运行需 `--execute --confirm-reviewed`，并指定仓库外已存在的证据目录。该路径用排他创建防重复；重复 Ticket/base SHA 会阻断。

运行回执包含确切 argv、fixture SHA-256、退出码、受限日志及隔离断言，保存为本地 JSON；回执为 `UNTRUSTED`，`promotion` 永远为 `NONE`，不得当作 `VERIFIED` 或产品验收。只支持 Windows → 已配置的 WSL2 Ubuntu-22.04；原生 WSL/Linux/macOS `NOT_RUN`。WSL 内核/虚拟机逃逸、超出 WSL 内核能力的隔离、一般项目测试、修改产品仓、网络访问、密钥/生产/付费服务均不支持。

`ticket-trace --input` 接收一个 JSON 对象，包含 `headSha`、`spec.spec_id`、`spec.acceptanceCriteria[{ac_id}]`、`tickets[{ticket_id,spec_id,base_sha,accepted_AC_ids,blocked_by,status}]`、`tests[{test_id,ticket_id,accepted_AC_ids,execution,status,exitCode,receiptId}]`、`receipts[{receiptId,ticketId,specId,gitSha,evidenceState,promotion,artifact}]`。AC 与 Ticket 必须显式映射；报告区分 `TRACE_INCOMPLETE` 和 `TRACE_COMPLETE_UNTRUSTED`，后者只说明声明链可连通，不表示测试真实性或证据可信，不会提升到 `VERIFIED`。

`skill-eval --input` 接收 `schemaVersion:1`、`kind:OFFLINE_SKILL_EVAL_CASES` 的 JSON 用例包；case 中仅允许有限的事件类型和相对路径，不接受命令或 URL 执行字段。它计算关键 Skills 的固定关键词触发规则与合成执行轨迹，输出 `OFFLINE_SYNTHETIC_EVAL`、输入 SHA-256、逐 case 观察、预期匹配及汇总指标。`PASS/FAIL/BLOCKED/NOT_RUN` 是合成用例的观察状态；`suiteStatus: PASS` 表示观察与用例声明的预期一致（即使其中有预期 FAIL/BLOCKED 案例）。报告固定 `real_agent_execution: NOT_RUN`、`trusted:false`、`promotion:NONE`，不表示真实 Agent 的 Skill 调用或效果。

## 2. `skill-kit`

```bash
node tools/skill-kit.mjs <command> [options]
```

| 命令 | 作用 |
|---|---|
| `list` | 列出 14 个 bundle 与状态 |
| `plan --target <dir> --agent <agent> --skills a,b` | 预览安装 |
| `install ... [--apply --confirm-reviewed]` | 安装整个 bundle 目录；不覆盖已有文件 |
| `verify --target <dir> [--agent] [--skills]` | 校验已安装文件 |
| `update ... [--apply --confirm-reviewed]` | 更新；拒绝覆盖被修改文件 |
| `uninstall ... [--apply --confirm-reviewed]` | 受控卸载 |
| `rollback --target <dir> --receipt <path> [--apply --confirm-reviewed]` | 按回执回滚 |

### 约束

- 每个 Skill 以整个目录安装（`SKILL.md` + `references/`）。
- `--apply` 必须同时给 `--confirm-reviewed`。
- 每次 `--apply` 在 `.x-superplay/skill-kit-receipts/` 写回执。
- 安装 ≠ Agent 已发现 ≠ 已调用 ≠ 真实项目有效；四层分别留证。

## 3. 其他工具

| 命令 | 作用 |
|---|---|
| `node tools/project-probe.mjs --target <dir> --type <type> --output <file>` | 只读项目基线探测 |
| `node tools/check.mjs` | catalog、DOM、必需文件校验 |
| `node tools/dependency-scan.mjs` | 拒绝活跃的旧仓依赖引用 |
| `node tools/security-gate.mjs` | 密钥扫描；fail-closed、脱敏 |
| `node tools/build-site.mjs` | 构建并审计 Pages 白名单 |
| `node tools/serve.mjs` | 本地静态预览（`127.0.0.1:4173`） |
