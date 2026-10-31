# 上游来源与采纳边界（Pinned Upstream Sources）

本页为 [AI-Native Spec-Driven Harness & Loop Engineering](AI-NATIVE-SPEC-HARNESS-SKILLS-LOOP.md) 的**来源证明与学习入口**。来源固定版本沿用旧 Engineering OS 在 **2026-10-26** 的审核清单；本次仅迁移公开、可核对的引用，不声称在 2026-10-31 再度逐文件审计了上游运行行为。若需部署/再分发，必须独立复核当下版本、许可及供应链。

| 思路 | 固定上游 | 本仓库采纳 | 不可冒充 |
|---|---|---|---|
| **Matt Pocock Skills** | [mattpocock/skills @ `5beb35b040e3de97e54fa9e386d7e42d15c295c2`](https://github.com/mattpocock/skills/tree/5beb35b040e3de97e54fa9e386d7e42d15c295c2) · [README](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/README.md) · [MIT at pin](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/LICENSE) | Discovery→Spec→Tickets→实现→评审的分层工作流；本仓自有 Skill 仅为语义候选 | 原版 Skill 已在本仓安装、验证或原作者背书 |
| **OpenAI Harness Engineering** | [2026-02-11 官方工程文章](https://openai.com/index/harness-engineering/)（网页，没有 Git SHA） | 项目可读上下文、可执行约束、工具权限、测试反馈与持续修复 | 官方 Harness 代码包或生产级保证 |
| **Anthropic Ralph Wiggum** | [claude-code 插件 @ `2eff7a8d21c80be48904f62ebdea36d945d7b504`](https://github.com/anthropics/claude-code/tree/2eff7a8d21c80be48904f62ebdea36d945d7b504/plugins/ralph-wiggum) | 有界、文件/状态驱动、证据反馈的迭代原则 | 插件已安装、允许无限循环、允许绕过审批 |
| **本仓库旧工程方法** | [旧工程仓原方法](https://github.com/Xander-Xai/X-SuperPlay-AI-Engineering-OS/blob/bbd5910fb8169d6372f78c6a73b45992350e3fb4/03-ai-coding/ai-native-spec-harness-loop.md) · [适配 SOP](https://github.com/Xander-Xai/X-SuperPlay-AI-Engineering-OS/blob/bbd5910fb8169d6372f78c6a73b45992350e3fb4/03-ai-coding/upstream-method-adoption.md) · [源清单](https://github.com/Xander-Xai/X-SuperPlay-AI-Engineering-OS/blob/bbd5910fb8169d6372f78c6a73b45992350e3fb4/09-reference/ai-native-upstream-source-manifest.md) | Workbench 维护新的自有叙述、路由映射与 CLI 入口 | 旧归档仓仍是实时依赖或新方法已经 Dogfood |

## Matt Pocock 原始 Skills（只读参考）

这些链接是具体的**上游文件路径**，不是 Workbench 的 `skills/` 安装清单：

| Step | 原版入口 | Workbench 对应 | 当前等价性 |
|---|---|---|---|
| 澄清需求 | [grill-with-docs](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/skills/engineering/grill-with-docs/SKILL.md) | `skills/project-discovery` | 语义借鉴，非功能等同 |
| 输出规格 | [to-spec](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/skills/engineering/to-spec/SKILL.md) | `skills/specification` | 语义借鉴，非功能等同 |
| 拆分可追踪任务 | [to-tickets](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/skills/engineering/to-tickets/SKILL.md) · [设计说明](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/docs/engineering/to-tickets.md) | `skills/implementation-plan` + workspace tickets | 语义借鉴，非功能等同 |
| 执行任务 | [implement](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/skills/engineering/implement/SKILL.md) · [implement-spec](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/skills/engineering/implement-spec/SKILL.md) | Workbench `implementation` 阶段 + 目标项目 Agent | 无对应的原版 Skill 注册 |
| 测试驱动 | [tdd](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/skills/engineering/tdd/SKILL.md) | `skills/verification` + 目标项目测试框架 | 不声称 TDD Skill 已安装 |
| 代码评审 | [code-review](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/skills/engineering/code-review/SKILL.md) | `skills/code-review` + Spec/Standards 双轴 | 语义借鉴，非功能等同 |

## Ralph Wiggum（研究插件结构，不启用无限循环）

- [README](https://github.com/anthropics/claude-code/blob/2eff7a8d21c80be48904f62ebdea36d945d7b504/plugins/ralph-wiggum/README.md)
- [命令文档](https://github.com/anthropics/claude-code/blob/2eff7a8d21c80be48904f62ebdea36d945d7b504/plugins/ralph-wiggum/commands/ralph-loop.md)
- [停止 Hook](https://github.com/anthropics/claude-code/blob/2eff7a8d21c80be48904f62ebdea36d945d7b504/plugins/ralph-wiggum/hooks/stop-hook.sh)

插件许可状态：旧清单明确为**未独立确认**；不得基于 GitHub 可访问性推定可复制、修改、商业再分发。这里只学习终止策略，不引入插件本身。

## 安全阅读（不安装、不执行）

```bash
git clone https://github.com/mattpocock/skills.git
cd skills
git checkout --detach 5beb35b040e3de97e54fa9e386d7e42d15c295c2
git rev-parse HEAD
# 只读查看 skills/engineering 下的 SKILL.md / README；不运行未知脚本
```

这里的 `git clone` 仅是可选学习步骤，不属于 Workbench CLI 的在线依赖，也不是推荐自动安装方式。浏览器阅读以上固定 SHA 链接同样可行。

**采纳流程**：先参考、不复制；再在隔离实验仓审查和验证；仅在明确权限、路径、版本和许可证后考虑安装；产生至少两次真实复用证据后评估是否纳入本仓候选 Skill。禁止直接复制整套第三方 Skills、将下载当作安装验收或使 CI 隐式联网。

**证据状态**：`REFERENCE_PINNED` ≠ `SOURCE_AUDITED_NOW` ≠ `INSTALLED` ≠ `AGENT_LOADED` ≠ `WORKFLOW_VERIFIED`。
