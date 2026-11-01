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
| `agent-check` | 检查 Agent 是否能发现已安装 Skill | `--target`、`--agent` |
| `version` | 打印版本 | — |

### 退出码

| 码 | 含义 |
|---|---|
| 0 | 成功 |
| 1 | `doctor` 发现漂移，或 `maturity` 检查存在阻断项 |
| 2 | 参数错误、安全阻断、覆盖拒绝、未知命令 |

### 示例

```bash
node tools/xeng.mjs init ../my-app --profile saas,web,backend --tier B --dry-run
node tools/xeng.mjs task bug --type saas --json
node tools/xeng.mjs route-pack mini-program --json
node tools/xeng.mjs assemble --target ../my-app --type saas --task feature --tier B --agent codex
node tools/xeng.mjs orchestrator plan --provider orca --agent omp --ticket ticket.json --platform windows
```

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
