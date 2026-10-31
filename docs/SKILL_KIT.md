# Offline Skill Kit · 运行契约

Skill Kit 是本地 Node CLI。公开网站从不运行它，也不提供远程安装。本版本随 Workbench 发布自包含 Skill bundle，不再读取旧私有仓。

## 命令

~~~bash
node tools/skill-kit.mjs list
node tools/skill-kit.mjs plan      --target ../your-project --agent codex --skills verification
node tools/skill-kit.mjs install   --target ../your-project --agent codex --skills verification
node tools/skill-kit.mjs install   --target ../your-project --agent codex --skills verification --apply --confirm-reviewed
node tools/skill-kit.mjs verify    --target ../your-project
node tools/skill-kit.mjs update    --target ../your-project
node tools/skill-kit.mjs uninstall --target ../your-project --agent codex --skills verification
node tools/skill-kit.mjs uninstall --target ../your-project --agent codex --skills verification --apply --confirm-reviewed
node tools/skill-kit.mjs rollback  --target ../your-project --receipt .x-superplay/skill-kit-receipts/<file>.json
node tools/skill-kit.mjs rollback  --target ../your-project --receipt .x-superplay/skill-kit-receipts/<file>.json --apply --confirm-reviewed
~~~

`--apply` 必须搭配 `--confirm-reviewed`。该标志表示操作者已检查目标仓库可见性、许可证、受影响路径和 bundle 内容。CLI 本身不验证许可证或私有/公开状态。

## 一次装配入口（推荐）

`xeng assemble` 是 Skill Kit 之上的路线装配门面，不是第二套安装器：它解析路线阶段必需的 Skill，复用同一依赖闭包、锁文件与回执逻辑。

~~~bash
node tools/xeng.mjs assemble --target ../your-project --type saas --task feature --tier B --agent codex
node tools/xeng.mjs assemble --target ../your-project --type saas --task feature --tier B --agent codex --apply --confirm-reviewed
node tools/xeng.mjs agent-check --target ../your-project --agent codex
~~~

状态含义：

| 输出 | 含义 |
|---|---|
| `ASSEMBLY_DRY_RUN` | 仅预览，零写入 |
| `ASSEMBLY_INSTALLED_NOT_TESTED` | 文件已写入并校验，运行时加载未验证 |
| `ALREADY_MANAGED` | 幂等重复安装，无改动 |
| `FILES_VERIFIED_RUNTIME_NOT_VERIFIED` | `agent-check` 只证明文件与锁一致 |

`agent-check` 的 `runtimeLoad` 永远不是 `VERIFIED`；真实加载必须按 [AGENT_SKILL_LOAD.md](AGENT_SKILL_LOAD.md) 在对应 Agent 中执行并记录回执。

## Bundle 布局

每个 Skill 是 `skills/<id>/` 下的完整目录：

~~~text
skills/verification/
  SKILL.md
  references/evidence-block.md
~~~

- `SKILL.md` 必须包含 frontmatter：`name` 与目录一致、`description`、`self_contained: true`、`status` 与 `license` 与 catalog 一致。
- 安装时整包递归复制，保持相对路径。
- 拒绝符号链接、绝对路径、`..`、超过 256 KiB 的单文件。
- 跨目录链接会在 dry-run 中警告；bundle 设计上要求自包含。
- Windows CRLF 检出会先归一化 frontmatter 比较，但文件字节与 SHA-256 完整性语义不变。

## 元数据与状态

每个 Skill 在 catalog 中带标准元数据：`id / version / owner / source / license / supported_agents / lifecycle_stage / prerequisites / dependencies / install_method / tests / status`。`skillMetadata()` 输出 snake_case 合同，`discoverSkills()` 将其提供给网站。

状态阶梯：

~~~text
CANDIDATE → LOCALLY_VERIFIED → REAL_PROJECT_VERIFIED → REUSABLE
~~~

- `CANDIDATE`：正文可审查，未在真实项目执行。
- `LOCALLY_VERIFIED`：目标项目真实安装并在本地测试中使用。
- `REAL_PROJECT_VERIFIED`：至少一个真实项目产生可核验执行证据。
- `REUSABLE`：第二个真实项目复用并验证。
- 没有证据不允许晋级；`validateCatalog()` 会对非 `CANDIDATE` 但缺少 `evidence` 的 Skill 报错。
- 许可证固定为 `UNLICENSED-PROPRIETARY`；未经所有者授权不得改为 MIT/Apache-2.0，也不得把第三方受限正文复制进公开仓库。

## 依赖闭包

`--skills implementation-plan` 会按依赖先安装 `specification`，再安装 `implementation-plan`。闭包在 `src/routing.mjs` 中计算，循环依赖直接报错。

## 锁文件

`.x-superplay/skill-kit.lock.json`，当前 `schemaVersion: 2`：

~~~json
{
  "schemaVersion": 2,
  "runtime": "x-superplay-dev-workbench",
  "runtimeVersion": "0.2.0",
  "historicalProvenance": { "repository": "...", "commit": "..." },
  "managed": [
    {
      "agent": "codex",
      "skill": "verification",
      "path": ".agents/skills/verification",
      "files": [{ "path": "SKILL.md", "sha256": "..." }],
      "bundleSha256": "...",
      "installedAt": "..."
    }
  ]
}
~~~

- 只保存相对路径与哈希，不保存绝对路径、Token 或源仓克隆路径。
- `schemaVersion: 1` 的旧锁可读取、校验与卸载；下次写入时升级为 v2，并保留 `legacySourceCommit` 字段。

## 完整性

- `verify` 逐文件比对 SHA-256，并报告受管目录中的未跟踪文件；有漂移时退出码为 1。
- `update` 只替换未修改的受管文件；修改过就拒绝。
- `uninstall` 只删除哈希匹配的受管文件；修改过就拒绝。
- 每次 `--apply` 在 `.x-superplay/skill-kit-receipts/` 写入回执，包含操作前锁、操作前文件内容（base64）与操作后哈希。
- `rollback` 先验证当前状态与回执一致，再恢复文件与锁；不一致则拒绝。
- 安装/更新失败时自动按回执回滚。

## 边界

- 安装文件 ≠ Skill 已执行 ≠ 已验证 ≠ 业务验收。
- 不执行 Skill 代码，不访问网络，不读取凭证。
- 不自动检查目标仓库是否为私有；由操作者确认。
- 真实 Windows 11 本地安装/更新/卸载/回滚已通过 fixture 验证；WSL2、三个 Agent 的真实加载路径、许可证与供应链扫描仍为 `NOT_VERIFIED`。
