# Security P0 整改与迁移独立验收

- 验收日期：2026-10-31
- 目标仓库：`Xander-Xai/X-SuperPlay-Dev-Workbench`
- 只读来源：`Xander-Xai/X-SuperPlay-AI-Engineering-OS@8553124f238ab463d4a50debad34e871ef8de060`（冻结快照）
- 来源当前 HEAD（仅观测）：`fa20126e93c57b1faab56d9c4cecc717b1eea46e`（已 superseded / archived）
- 分支：`fix/security-secret-output-and-independent-acceptance`
- PR：`#21`
- 本报告只判定 Workbench 的安全整改与内容独立复核；真实项目、真机、staging、生产发布与旧仓退役是独立事项。

## 1. 最终 gates

| Gate | 结果 | 依据 |
|---|---|---|
| `SECURITY_SECRET_OUTPUT` | **PASS** | 14 个安全测试覆盖 stdout、stderr、JSON、CI gate；完整与局部密钥字符串均未出现 |
| `SECURITY_GATE_FAIL_CLOSED` | **PASS** | 伪造/过期 `security.secret_scan` 例外仍为 `FAIL`；独立 gate 对植入密钥退出 2 |
| `ENGINEERING_CONTENT_INDEPENDENTLY_VERIFIED` | **PASS** | 106/106 冻结文件、四个历史缺口、三份 Playbook 重新核对；外部人工复核 `NOT_RUN` |
| `CROSS_REPO_GIT_OWNERSHIP` | **PASS** | OPC 组织级 / 项目级 / Workbench 建议级边界已结构化并测试；未复制 OPC 规则或脚本 |
| `NO_OLD_RUNTIME_DEPENDENCY` | **PASS** | `npm run scan`：活跃依赖 0；历史引用仅限显式记录文件 |

## 2. 漏洞根因

`tools/xeng.mjs` 的旧实现有三处叠加风险：

1. **命中正文进入报告**：扫描循环把 `m[0]` 截断到 60 字符后写入 `findings[].detail`。该 `detail` 同时流入终端 human 输出、`audit --json` 报告和 CI 日志。真实凭证一旦进入目标仓库，会被再次广播到这些通道。
2. **安全门禁可被普通例外降级**：`checkExceptions(report, ep, "security.secret_scan", f.rel)` 会把命中移入 `waived`；当没有未豁免命中时，检查状态被写成 `NOT_APPLICABLE`。一个项目级 YAML 例外即可让真实密钥扫描“变绿”。
3. **`xeng init` 跟随符号链接**：`join(target, rel)`、`existsSync`、`mkdirSync`、`writeFileSync` 没有检查生成路径中的 symlink/junction，也没有拒绝绝对路径或 `..`。恶意或受损的目标仓库可把生成文件重定向到目标目录之外。

补充发现：`checkExceptions` 在遍历 `report.checks` 时向同一数组追加 `exception.*` 检查；遇到过期非安全例外会无限循环。该问题在本轮被修复。

## 3. 改动前后

### 3.1 密钥输出

~~~js
// BEFORE — matched text copied into detail
const frag = m[0].length > 60 ? m[0].slice(0, 60) + "…" : m[0];
findings.push({ rel, detail: rel + ": " + label + " :: " + frag });
...
if (unwaived.length) add("security.secret_scan", "FAIL", unwaived.slice(0, 10).join("; "), "security.secret_scan");
else if (waived.length) add("security.secret_scan", "NOT_APPLICABLE", ...);
~~~

~~~js
// AFTER — only path, line, rule ID and count
const line = text.slice(0, m.index).split(/\r\n|\r|\n/).length;
findings.push({ rel, line, ruleId: rule.id });
...
add("security.secret_scan", "FAIL",
  findings.length + " finding(s) in " + fileCount + " file(s) [" + ruleCounts + "]: " +
  listed + more + "; match text withheld", "security.secret_scan");
~~~

`detail` 的最高信息量是：

~~~text
2 finding(s) in 1 file(s) [secret.generic-assignment=1, secret.github-token=1]:
config.js:1 [secret.generic-assignment]; config.js:1 [secret.github-token]; match text withheld
~~~

### 3.2 fail-closed

- `checkExceptions` 对 `security.secret_scan` 直接返回 `null`，不允许任何项目例外豁免。
- 任何指向 `security.secret_scan` 的项目例外都会新增 `security.secret_scan_exception: FAIL`，即使当前没有命中。
- 安全扫描不再产生 `waived` 分支，也不会把结果写成 `NOT_APPLICABLE`。
- 新增 `tools/security-gate.mjs`：只读取脱敏 audit 结果；`security.secret_scan` 不是 `PASS` 或存在安全 `FAIL` 时退出 2。
- `npm run verify` 现在为 `check + scan + security + test`；`.github/workflows/ci.yml` 增加显式 Security gate 步骤。

### 3.3 init 路径

~~~js
// AFTER — reject absolute/traversal, symlink components and escapes
function safeInitPath(root, rel) {
  const clean = String(rel).replace(/\\/g, "/");
  const segments = clean.split("/").filter(Boolean);
  if (isAbsolute(clean) || segments.some(s => s === "." || s === "..")) throw new Error(...);
  const rootAbs = resolve(root);
  let current = rootAbs;
  for (let i = 0; i < segments.length; i++) {
    current = join(current, segments[i]);
    const st = lstatMaybe(current);
    if (st?.isSymbolicLink()) throw new Error("refusing to write through symlink: " + clean);
    if (i < segments.length - 1 && st && !st.isDirectory()) throw new Error(...);
  }
  const finalAbs = resolve(current);
  if (finalAbs !== rootAbs && !finalAbs.startsWith(rootAbs + sep)) throw new Error(...);
  return current;
}
~~~

`init` 还会拒绝 symlink 目标目录本身。测试同时覆盖“目标被链接”和“目标内的生成路径被链接”两种情况，并断言外部目录保持为空。

## 4. 敏感字符串未泄漏的证明

`test/security.test.mjs` 的所有合成凭证都在运行时拼接，测试源码不含完整凭证字面量。每个用例同时检查：

- human stdout；
- human stderr；
- `--json` stdout；
- `--json` stderr；
- 完整字符串；
- 前 40 字符的局部片段。

覆盖矩阵：

| 用例 | 规则/通道 |
|---|---|
| GitHub PAT | `secret.github-token`；human + JSON |
| AWS / GCP / JWT / OpenAI / Slack | 对应规则；多文件、多行 |
| 私钥块 | `secret.private-key`；含 `.pem` 文件 |
| URL 内嵌认证 | `secret.url-credential`；密码片段不出现 |
| 超长 token / 多次命中 | 只输出 path:line、rule、count；前缀不出现 |
| Agent 配置 | `.claude/settings.json` 被扫描 |
| 嵌套 worktree | `.claude/worktrees/**` 被排除 |
| CRLF | 行号正确，路径保持 `/` |
| 伪造例外 | `security.secret_scan` 仍 `FAIL`，并新增 exception FAIL |
| 过期例外 | 仍 `FAIL` |
| 非安全例外 | 仍可作用于 `governance.agents`，证明机制未被整体禁用 |
| 独立 gate | clean 通过；植入密钥退出 2，stdout/stderr 无正文 |
| Workbench 自扫描 | `npm run security`：77 文件，`PASS` |

命令与结果：

~~~text
node --test test/security.test.mjs        # 14 passed
npm run security                          # SECURITY GATE PASS: scanned 77 files
npm run verify                            # 131 passed, 1 skipped, 0 failed
~~~

## 5. 106 文件独立复核

### 5.1 方法

- 从冻结 commit 重新读取 `git ls-tree -r 8553124...`，为每个 `source_path` 记录 `source_blob_sha`。
- 重新计算 digest：`sha256(sorted(source_path + NUL + blob_sha + LF))`。
- 断言 106 个 `source_path` 唯一，`source_sha` 全为冻结 commit。
- 断言 `PARTIAL=0`、`NOT_MIGRATED=0`、`not_silently_dropped=106`。
- 断言所有本地 `implementation` 与 `test` 路径存在。
- 结果：`source_tree_sha256 = 18a62493f23fdaa30663b0e35d8733ccfb2e6f5519dd5b137c76aabbfd9a63e1`；计数 `61 MIGRATED_VERIFIED / 32 EQUIVALENT_VERIFIED / 8 HISTORICAL_ONLY / 5 NOT_APPLICABLE`。
- 测试：[test/reconciliation.test.mjs](test/reconciliation.test.mjs)。

### 5.2 四个历史缺口

| 缺口 | 结论 | 独立复核证据 |
|---|---|---|
| L0–L6 成熟度 | **MIGRATED_VERIFIED** | `src/maturity.mjs` 以 audit 检查推导；连续等级；`out_of_band_controls` 记录更高层已满足的单个控制，等价旧模型 `[+]`，不提升等级；L6 固定 `NOT_VERIFIABLE` |
| `02-standards/commits.md` | **MIGRATED_VERIFIED** | `GIT_WORKFLOW.commits` 覆盖格式、小写 scope、body why、footer、单逻辑变更、密钥扫描、生成标记、署名、squash 与“修复需复现/根因” |
| `06-templates/postmortem.md` | **MIGRATED_VERIFIED** | `postmortemTemplate` 覆盖事实/影响/根因/控制/核心行动项/被推翻假设/未验证项，并补充 Blameless 与“一页为主” |
| `03-ai-coding/codex.md` 双 Agent 分工 | **EQUIVALENT_VERIFIED** | `GIT_WORKFLOW.agentRoleSplit` 与 `agentSplitRule` 覆盖大上下文/机械变更、交互调试、内容研究、独立第二意见、批量生成、同文件并发禁止；明确写者不审自己的高风险变更、上下文卫生与同一 PR 标准 |

### 5.3 三份 Playbook

| Playbook | 结论 | 补充的结构化语义 |
|---|---|---|
| AI 应用日常 | **MIGRATED_VERIFIED** | 5 条合成 AC、负例、停止条件、不可宣称、每日节律、汇报句式、3 个隔离实验 |
| RAG 从零 | **MIGRATED_VERIFIED** | 5 条 AC、负例、停止条件、不可宣称、Rerank 决策、3 个垂直切片 |
| Agent 从零 | **MIGRATED_VERIFIED** | 5 条 AC、负例、停止条件、不可宣称、状态契约、持久化/恢复规则、HITL 规则、评测指标、5–6 周练习 |

`validatePlaybooks()` 强制这些字段存在；`playbookMarkdown()`、网站 Playbook 视图和 `xeng playbook` 都渲染同一份数据。外部人工复核仍为 `NOT_RUN`。

## 6. G-02 权威边界

| 层 | 所有者 | 内容 |
|---|---|---|
| 组织级 | `Xander-Xai/X-SuperPlay-OPC-Blueprint` | 跨仓治理、组合/本地 worktree 生命周期、OPC 本地路径、分支前缀契约、worktree 脚本 |
| 项目级 | 目标仓库 | `CONTRIBUTING`、`AGENTS.md`、分支保护、`CODEOWNERS`、项目 Git 规则 |
| 建议级 | Workbench | 产品仓与生成项目的交付级 Git/Worktree 使用建议 |

优先级：**目标仓库本地规则 > OPC 组织级治理 > Workbench 建议**。冲突时更严格的一方生效；Workbench 不覆盖、不放宽、不替代项目本地或 OPC 组织级规则。OPC 的 worktree 根目录、脚本、分支前缀与生命周期命令不复制进 Workbench 或生成项目。

实现位置：`src/git-workflow.mjs#governanceBoundary`、`docs/GIT_WORKFLOW.md`、网站工作流 Git 标签页、`xeng init` 生成的 `docs/git-workflow.md`；`validateGitWorkflow()` 与 `test/engine.test.mjs` 断言边界存在且命名双方。

## 7. 最新来源增量（独立于 106 文件）

来源仓在冻结后前进 **10 个提交、65 个文件变化**（9 新增、55 修改、1 删除）。完整对账见 [migration/eng-os-post-freeze-increments-20261031.json](migration/eng-os-post-freeze-increments-20261031.json)。

| 增量 | 结论 | Workbench 处置 |
|---|---|---|
| #5 方法采纳 | `EQUIVALENT_VERIFIED` | bounded loop、tracer 字段、实施计划由 handoff/starter/workspace/Playbook 承接；未复制正文 |
| #6 README | `NOT_APPLICABLE_TO_RUNTIME` | 组合级说明 |
| #9 PR 模板 | `MIGRATED_VERIFIED` | 本仓已有 `.github/pull_request_template.md` |
| #10 安全加固 | `MIGRATED_VERIFIED` | 脱敏、fail-closed、扩展规则、Agent 配置扫描、密钥文件扫描、symlink-safe init、密钥忽略、SECURITY.md、固定 action SHA、actions-only Dependabot |
| #12 / #13 action 升级 | `NOT_APPLICABLE_TO_RUNTIME` | Workbench 使用自己的固定 SHA 与 Dependabot；无 Python 运行时 |
| #14 公开/私有分离 | `EQUIVALENT_VERIFIED` | 未复制私有注册表、客户证据、审计细节或 OPC-LINK；许可证仍待所有者决定 |
| #15–#17 归档 | `HISTORICAL_ONLY` | 来源已 superseded/archived；Workbench 仍是当前运行时所有者 |

可复用安全规则逐项覆盖：

| 规则 | 状态 |
|---|---|
| 不输出命中正文/片段 | `MIGRATED_VERIFIED` |
| GitHub/云/JWT/私钥/URL 认证形态 | `MIGRATED_VERIFIED` |
| Agent 配置扫描、worktree 排除 | `MIGRATED_VERIFIED` |
| 密钥文件/名称扫描 | `MIGRATED_VERIFIED` |
| symlink-safe 生成路径 | `MIGRATED_VERIFIED` |
| 密钥文件 `.gitignore` | `MIGRATED_VERIFIED` |
| 私密漏洞报告政策 | `MIGRATED_VERIFIED` |
| CI 最小权限/并发/超时/固定 SHA | `MIGRATED_VERIFIED` |
| actions-only Dependabot | `MIGRATED_VERIFIED` |
| 依赖固定 | `NOT_APPLICABLE_ZERO_DEPENDENCIES` |
| 完整 CI self-audit | `PARTIAL_EQUIVALENT`：`npm run security` 是硬门禁；完整 `xeng audit` 仍有 WARN 级建议项 |

## 8. 验证回执

| 验证 | 结果 |
|---|---|
| `npm run verify` | `check` PASS；`scan` 活跃依赖 0；`security` 77 文件 PASS；`test` 131 passed / 1 skipped / 0 failed |
| `npm run build` | Pages allowlist 17 个浏览器文件，构建通过 |
| 四路线 CLI smoke | `saas` / `enterprise` / `mini-program` / `app` × `feature` × Tier B × new，均退出 0 |
| 安全负例 | 14/14 通过；植入密钥 gate 退出 2，输出无正文 |
| Windows 11 本地 | 上述命令在 Windows 11 + Node 24.16.0 执行通过 |
| Linux | 以真实 GitHub Actions 运行结果为准（见 §9） |
| 桌面渲染 | 1440px Playbook（AI/RAG/Agent）与 Git 边界截图；无页面级横向溢出 |
| 移动渲染 | 390px Playbook 与 Git 边界截图；`scrollWidth=clientWidth=390`；Git 卡片无裁剪；Playbook 表格有“左右滑动”提示 |
| 移动修复 | 移除重复“分工不明确时”前缀；Git 表改为卡片，避免右列被遮挡 |

截图位置（本地临时目录，不进入仓库）：`D:\Temp\AI-Agents\claude\workbench-visual\`。

## 9. PR / CI / 合并回执

- 分支：`fix/security-secret-output-and-independent-acceptance`
- PR：`#21`（squash merge）
- CI（PR）：run `41187013584`，`verify` success；Security gate step success
- 合并 SHA：`4f460603873ca5aed9455d03ca295e3ee5f393eb`
- CI（main）：run `41187127583`，`verify` success；Security gate step success
- Pages：run `41187127639`，`build` 与 `deploy` 均 success
- Pages 地址：<https://xander-xai.github.io/X-SuperPlay-Dev-Workbench/>

上述回执由本报告的后续回执提交记录；回执提交不改变代码结论。安全问题修复与合并已完成，真实项目/生产验收仍未执行。

## 10. 未完成事项

| ID | 项 | 状态 |
|---|---|---|
| U-01 | 外部人工独立复核 | `NOT_RUN`；本轮为同一 Agent 会话的独立重审 |
| U-02 | 真实项目 / 真机 / staging / 生产验收 | `NOT_RUN` |
| U-03 | Workbench 许可证 | `UNLICENSED-PROPRIETARY`，待所有者决定；未继承来源 MIT |
| U-04 | 完整 `xeng audit .` 作为 CI 硬门禁 | `PARTIAL`：当前仓库有 WARN 级建议项；安全子集已硬门禁 |
| U-05 | 来源 Git 历史重写 | 来源所有者已决定暂缓；Workbench 不复制或依赖其历史 |
| U-06 | Playbook 移动端宽表 | 保留横向滚动 + 显式提示；页面级无溢出 |

## 11. 证据索引

- 安全扫描实现：[tools/xeng.mjs](tools/xeng.mjs)
- 独立安全 gate：[tools/security-gate.mjs](tools/security-gate.mjs)
- 安全负例测试：[test/security.test.mjs](test/security.test.mjs)
- 目录对账测试：[test/reconciliation.test.mjs](test/reconciliation.test.mjs)
- 冻结文件对账：[migration/eng-os-semantic-reconciliation-20261031.json](migration/eng-os-semantic-reconciliation-20261031.json)
- 冻结后增量：[migration/eng-os-post-freeze-increments-20261031.json](migration/eng-os-post-freeze-increments-20261031.json)
- Git 边界：[src/git-workflow.mjs](src/git-workflow.mjs)、[docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md)
- Playbook：[src/playbooks.mjs](src/playbooks.mjs)、[docs/PLAYBOOKS.md](docs/PLAYBOOKS.md)
- 成熟度：[src/maturity.mjs](src/maturity.mjs)、[docs/MATURITY.md](docs/MATURITY.md)
- 安全政策：[SECURITY.md](SECURITY.md)
- 历史迁移回执：[FINAL_ENGINEERING_MIGRATION_AUDIT.md](FINAL_ENGINEERING_MIGRATION_AUDIT.md)
