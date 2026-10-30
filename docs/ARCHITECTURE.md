# Workbench 架构与所有权

## 系统边界

Workbench 是工程运行时的当前所有者。它拥有生命周期、任务路由、Profiles、标准摘要、Skills bundle、CLI 与证据模型。网站只是这些能力的本地可视化入口。

~~~text
Workbench runtime (this repository)
  src/catalog.mjs        canonical data: 11 stages, 13 tasks, 17 profiles, 8 skills, tiers
  src/routing.mjs        type x task x mode x tier -> ordered stages + skill closure
  src/engine.mjs         plan composition, Markdown/Manifest export, catalog validation
  src/workspace.mjs      seven reviewable project artifacts
  src/evidence.mjs       state machine + local report import
  src/install-contract.mjs  agent destinations + skill dependency closure
  src/app.mjs            browser UI (no network, no filesystem)
        │
        ├── tools/xeng.mjs          init / audit / doctor / validate-registry / selftest / task
        ├── tools/skill-kit.mjs     bundled install / verify / update / uninstall / rollback
        ├── tools/project-probe.mjs read-only local baseline
        └── tools/build-site.mjs    dist allowlist
        │
        ▼
  local download / target project repo / agent session
        │
        ▼
  real tests, real devices, real acceptance — recorded in the product repo, never here
~~~

## 所有权分层

| 数据 | 所有者 | 本仓库职责 |
|---|---|---|
| 生命周期、任务路由、Profiles、Tiers | Workbench | 定义、验证、版本化 |
| Skills bundle | Workbench | 维护自包含目录与依赖闭包 |
| 标准摘要 | Workbench | 以公开、可执行的语言维护 |
| 历史来源 | 旧 Engineering OS | 仅记录 repository + commit 作为溯源 |
| 通用治理语义 | AI-Native Work Learning OS | 只引用，不复制正文 |
| 项目本地决策 | 产品仓库 | 生成草案；不得覆盖项目本地规则 |
| 真实测试、部署、验收 | 产品仓库 / 平台 | 永不伪造 PASS |

`PROVENANCE`、`OWNER`、`GOVERNANCE`、`RUNTIME` 四个常量在 `src/catalog.mjs` 中显式分离。历史 commit 是溯源信息，不是权限、不是同步状态、也不是运行依赖。

## 任务路由

`composeRoute` 的输入是 `type / task / tier / mode / stack / addons`：

1. 由 type + stack + addons 解析 Profiles，检测叠加与冲突。
2. 由 task 选择阶段序列；`existing` 模式在最前面补 `intake` 与 `discovery`。
3. Tier C/D 的 `feature` 任务把 `specification` / `architecture` 标为 `optional`，并记录理由——不静默删除。
4. 未进入路线的阶段写入 `skipped`，明确说明“不包含”，不视为完成。
5. Skills 通过依赖闭包解析；所有 Skill 初始 `candidate / installed=false`。
6. 每个阶段初始 `state = NOT_RUN`，证据种类来自阶段定义与任务定义。

## 证据模型

~~~text
NOT_RUN ──► IN_PROGRESS ──► VERIFIED
   │             │
   └──► BLOCKED ◄┘
          │
          └──► UNKNOWN
~~~

- `VERIFIED` 是终态，不能回退。
- `VERIFIED` 记录必须包含 command、result、artifact。
- 导入的本地报告状态固定为 `IMPORTED_NOT_TRUSTED`，只做摘要。
- 代码检查 / 真实环境 / 消费者验收是三个独立层，不可互相替代。

## 浏览器安全

- `index.html` 使用 CSP：`default-src 'self'`、`connect-src 'none'`、`form-action 'none'`。
- 浏览器模块只导入 `src/` 下的公开文件，不使用 Node API。
- 无 GitHub Token、无远程脚本、无上传端点、无自动部署。
- `tools/`、`test/`、`docs/`、`skills/` 不进入 `dist/`；发布产物只有 `index.html`、`styles.css`、`src/`、`.nojekyll`。

## 依赖方向

~~~text
catalog ──► routing ──► engine ──► workspace
   │           │          │           │
   │           └──────────┴───────────┴──► starter / handoff / install-contract
   │
   └──► baseline（浏览器安全）◄── project-probe（Node，只读）
~~~

`engine.mjs` 不导入 `workspace.mjs`；`workspace.mjs` 导入 `engine.mjs` 的 `toManifest`，保持单向依赖。CLI 工具导入 `src/`，反向不成立。

## 版本与漂移

- 运行时版本在 `RUNTIME.version`，当前 `0.2.0`。
- 目录数据变更必须通过 `validateCatalog()` 与 `npm run verify`。
- `tools/dependency-scan.mjs` 检查是否存在对旧私有仓的运行时依赖；历史溯源只在显式允许的文件中出现。
- 旧仓退役不由本仓库自动执行；需要所有者确认、真实项目验证和单独的回滚计划。

## Gate 语义

`GENERATED_NOT_EXECUTED`、`NOT_RUN`、`candidate` 是硬编码的安全默认值。任何“已完成”都必须来自目标项目的真实执行回执，不能通过网页开关或 CI 通过来提升。
