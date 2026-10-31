# Agent Skill 加载验证记录

本文件区分三件事，任何一项都不能由另一项代替：

1. **文件已安装**：`skill-kit install --apply` 写入目标目录，锁文件与 SHA-256 校验通过。
2. **Agent 已发现**：Agent 自己的调试/发现命令列出了该 Skill 的 `SKILL.md` 路径。
3. **Agent 已调用**：Agent 在真实会话中读取 Skill 并按契约产出可观察结果（含引用文件访问）。

`xeng agent-check` 只能证明第 1 项。第 2、3 项必须在真实 Agent 中执行，未执行即 `NOT_VERIFIED`。

## 结论矩阵（2026-10-31 实测）

| Agent | 版本 | 安装目录 | 发现 | 调用 | 引用文件 | Windows/WSL 路径 | 结论 |
|---|---|---|---|---|---|---|---|
| Claude Code | 2.1.296 | `.claude/skills/<id>/` | PASS | PASS | PASS | Windows PASS | `SKILL_LOAD_VERIFIED` |
| Codex CLI | 0.159.0 | `.agents/skills/<id>/` | PASS | BLOCKED | 未到该步 | Windows PASS | `PARTIAL` |
| OpenCode | 1.18.35 | `.opencode/skills/<id>/` | PASS | PASS | PASS | Windows PASS；WSL2 PASS | `SKILL_LOAD_VERIFIED` |

Codex 的调用步骤先被 MiniMax MCP 的 HTTP 403（Cloudflare）阻断，禁用该 MCP 后又遇到 ChatGPT 用量上限（提示稍后重试），因此**没有拿到 Codex 模型真实调用 Skill 的回执**。发现步骤是独立命令，结果有效；调用保持 `BLOCKED`，不写成 PASS。

## 复现命令

以下命令均在临时 fixture 中执行，安装目标为 `D:\Temp\AI-Agents\claude\x-superplay-agent-load-20261031\`，不涉及任何真实项目。

```bash
# 1) 受控安装（三选一，示例为 codex）
node tools/xeng.mjs assemble --target <fixture> --type saas --task feature --tier B --agent codex --apply --confirm-reviewed
node tools/xeng.mjs agent-check --target <fixture> --agent codex   # 只校验文件与锁

# 2) 发现
cd <fixture> && claude -p "/verification ..."          # Claude Code：调用即验证
cd <fixture> && codex debug prompt-input                # Codex：列出可用 Skill 路径
cd <fixture> && opencode debug skill                    # OpenCode：列出 Skill 与 location

# 3) OpenCode 真实调用
cd <fixture> && opencode run --agent plan --auto "<要求读取 verification Skill 并给出第一步与 Evidence Block>"

# 4) WSL2 路径
wsl -d Ubuntu-22.04 -- bash -lc 'cd /mnt/d/.../opencode-wsl && opencode debug skill'
```

## 证据位置

外部证据（不属于仓库，避免把会话/日志提交进 Git）：

- `D:\Temp\AI-Agents\claude\x-superplay-agent-load-20261031\claude-code\`：`claude-result.json`、`claude-debug.log`（项目 Skill 目录被列出）。
- 同目录 `codex\`：`codex-prompt-input.json`（`verification: (file: r7/verification/SKILL.md)`）、`codex-stderr*.log`（403 与用量上限）。
- 同目录 `opencode\`：`oc-skills.json`（location `.opencode/skills/verification/SKILL.md`）、`oc-run4.jsonl`（读取引用文件并输出 `# Evidence Block`）。
- 同目录 `opencode-wsl\`：`wsl-skills.json`（`/mnt/d/...` 路径发现成功）。

证据文件可能包含模型/工具输出，属于运行日志；不要复制其中的任何凭据、令牌或环境配置到仓库、Issue、报告或提交中。

## 安装生命周期（自动化测试覆盖，非真实 Agent）

`test/assemble.test.mjs` 与 `test/install.test.mjs` 覆盖：

- 默认 dry-run 零写入，只选择路线阶段必需的 Skill 及依赖闭包；
- `--apply` 缺少 `--confirm-reviewed` 时退出码 2 且不写文件；
- 已存在非受管文件时拒绝覆盖，且不写锁文件；
- 重复安装返回 `ALREADY_MANAGED`；
- 安装后 `verify` 为 `VERIFIED_UNCHANGED`；
- 修改受管文件后 update/uninstall 拒绝；
- 卸载与回滚按回执恢复，锁文件 schema v2。

这些测试证明**安装器行为**，不证明任何 Agent 的运行时加载。真实 Agent 的加载结论只来自上表对应的实测命令。

## 边界

- 未测试 macOS/Linux 原生路径；WSL2 只验证了发现步骤。
- 未测试企业代理、受限网络或非默认 Agent 配置下的加载。
- 未执行真实项目安装；所有 fixture 均为临时目录。
- Agent 版本变化后需重新验证，旧结论不自动延续。
