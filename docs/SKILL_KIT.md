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

## Bundle 布局

每个 Skill 是 `skills/<id>/` 下的完整目录：

~~~text
skills/verification/
  SKILL.md
  references/evidence-block.md
~~~

- `SKILL.md` 必须包含 frontmatter：`name` 与目录一致、`description`、`self_contained: true`。
- 安装时整包递归复制，保持相对路径。
- 拒绝符号链接、绝对路径、`..`、超过 256 KiB 的单文件。
- 跨目录链接会在 dry-run 中警告；bundle 设计上要求自包含。

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
- 真实 Windows 11 / WSL2、三个 Agent 的加载路径、许可证与供应链扫描仍为 `NOT_VERIFIED`。
