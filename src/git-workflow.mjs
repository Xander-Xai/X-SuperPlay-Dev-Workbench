// Project-level Git guidance. Advisory by default: a target project's own rules win.
// G-01 (branch/commit/PR) and the worktree/per-agent half of G-02 live here.
// This is a semantic rewrite, not a copy of any organisation's governance body.

export const GIT_WORKFLOW_STATUS = Object.freeze("ADVISORY_PROJECT_GUIDANCE");

export const GIT_WORKFLOW = Object.freeze({
  id: "project-git-workflow",
  name: "项目级 Git 工作流",
  status: GIT_WORKFLOW_STATUS,
  authority: "建议性项目级指导。目标仓库已有的 CONTRIBUTING、AGENTS、分支保护或组织规范优先；本项目不覆盖它们，也不引入 Git 托管或自动推送。",

  // G-02: the organisation-level half of Git/Worktree governance is not owned here.
  governanceBoundary: {
    owner: "Xander-Xai/X-SuperPlay-OPC-Blueprint",
    organizationScope: "跨仓库治理、组合与本地 worktree 生命周期、OPC 本地路径、分支前缀契约与 worktree 脚本由 OPC-Blueprint 定义。",
    projectScope: "Workbench 只提供产品仓与生成项目的交付级 Git/Worktree 使用建议；不定义组织级路径、标签、分支白名单或生命周期命令。",
    precedence: [
      "目标仓库本地的 CONTRIBUTING / AGENTS.md / 分支保护 / CODEOWNERS",
      "OPC-Blueprint 对 OPC 管理仓库的组织级治理",
      "Workbench 的建议性 Git 指导"
    ],
    conflictRule: "冲突时更严格的一方生效；Workbench 建议不得覆盖、放宽或替代项目本地规则与 OPC 组织级规则。",
    nonCopy: "不把 OPC 的 worktree 根目录、脚本、分支前缀或生命周期命令复制进 Workbench 或生成项目；需要时只引用其公开治理入口。"
  },

  agentRoleSplit: [
    { task: "交互式实现、调试、UI 验证与操作循环", defaultAgent: "Claude Code", note: "需要频繁观察、调整和真实页面验证的任务。" },
    { task: "大上下文重构、跨文件机械变更、批量生成", defaultAgent: "Codex", note: "以清晰契约、可验证测试和限定范围为前提。" },
    { task: "高风险 diff 的独立第二意见", defaultAgent: "另一个 Agent", note: "写者不单独批准自己产出的高风险变更。" },
    { task: "内容、研究、浏览器取证与多工具流水线", defaultAgent: "Claude Code", note: "需要逐步核验来源与中间结果。" },
    { task: "同一文件的并行写入", defaultAgent: "禁止", note: "改为串行，或为每个 Agent 分配独立 worktree。" }
  ],
  agentSplitRule: "分工不明确时：交互、紧循环、需要现有 Skill 生态 → Claude Code；大范围机械扫描、批量生成、第二意见 → Codex。实际分工写入计划与 PR，便于复盘归因。",

  baseSha: [
    "开工前记录 exact base SHA：git rev-parse HEAD；接手项目时同时记录 git status --short 的 dirty 状态。",
    "每个工作区产物、PR 描述和 Agent 交接都引用同一个 base SHA；base 变了要显式更新，不能静默沿用旧值。",
    "已有项目的只读基线（HEAD / dirty / 检测到的技术标记）不等于测试通过。"
  ],

  branches: [
    "main（或项目默认分支）保持可部署；代码变更走短分支。",
    "命名与任务绑定：feat/<slug>、fix/<slug>、chore/<slug>、docs/<slug>；有任务 id 时写入分支名。",
    "一个分支一个意图；评审需要拆分时再拆，不为形式提前制造大量分支。",
    "不建立长期 develop/staging 分支；环境通过配置区分，不靠分支区分。",
    "Tier A 的代码变更 PR-only；文档错字、CI 配置等低风险变更可按项目规则直推（项目规则优先）。",
    "不向共享分支 force-push 或重写历史；只允许对自己刚创建、尚未共享的分支在本会话内处理。"
  ],

  worktrees: [
    "并行 Agent 或实验线使用独立 worktree：一个 worktree、一个意图、一个 Agent；不要让两个 Agent 写同一棵树。",
    "推荐位置：项目约定目录（例如 .claude/worktrees/ 或团队指定的 _worktrees 根）；命名 <repo>-<slug>。",
    "创建：git worktree add <path> -b <branch>；清理：git worktree remove <path>，不要手工删除目录，避免残留元数据。",
    "移除前在该 worktree 执行 git status；有未提交工作时先 stash -u 或提交。",
    "worktree 共享 .git 但不共享未跟踪文件；每个 worktree 单独准备 .env 与本地配置。",
    "worktree 不绕过评审：仍通过 PR 合入。"
  ],

  commits: [
    "使用 Conventional Commits，祈使句，主题 ≤72 字符：<type>(<scope>): <summary>。",
    "type 使用 feat / fix / docs / test / refactor / chore / ci / perf；scope 用小写模块或路径名。",
    "需要时使用 footer：BREAKING CHANGE: 与 Refs:；破坏性变更不得只写在正文里。",
    "一个提交一个逻辑变更；重构、修复、文档混在一起时在评审前拆分。",
    "提交正文写“为什么”和被否决的替代方案；diff 已经说明“改了什么”。",
    "Bug 修复正文包含复现链接或根因摘要；“fix bug”单独一句是评审气味。",
    "不提交密钥、.env、大二进制、注释掉的死代码；提交前扫描 diff。",
    "生成文件在正文标注 (generated) 或使用 chore(gen): 并写明生成器；署名 footer 按工具配置生成，不伪造协作者。",
    "Tier A/B 默认 squash merge；PR 标题成为提交信息，PR 描述保存完整上下文。"
  ],

  pullRequest: [
    "PR 描述必须包含：Why、Scope（含明确不做的事）、Verification（命令 + 结果）、Risks、Rollback。",
    "Verification 必须列出实际执行命令、通过/失败/跳过项、证据链接；空验证段在 Tier A/B 直接阻断评审。",
    "所有未执行或无法执行的检查显式写 UNKNOWN / NOT_RUN，不能留空让人误以为通过。",
    "PR 描述引用 base SHA 与变更后 SHA；Agent 生成的 PR 额外注明模型/会话与遵循的指令。",
    "真实变更超过约 400 行时拆分，除非是机械重命名或迁移；自审后再请求评审。",
    "必需检查失败时不合并、不覆盖；本地绿而远端红通常意味着环境漂移，要调查。",
    "合并后删除已合并的短分支；保留发布标签与历史审计能力（git log --follow）。"
  ],

  review: [
    "评审同时核对 Spec 轴（AC 是否达成）与 Standards 轴（安全、边界、测试、性能、可维护性）。",
    "结论明确为 approve / block / block-security；安全阻断不可协商。",
    "Finding 不自动变成新需求；只有不修就无法诚实满足原始 AC 的问题才默认回到主线。",
    "建议性 Finding 可进入后续工单，不阻塞本次主线。"
  ],

  agentOperating: [
    {
      agent: "Claude Code",
      notes: [
        "交互式实现、调试、UI 验证与操作循环；按任务加载项目 CLAUDE.md → 最近 AGENTS.md → Spec 切片，不读整仓。",
        "先路由任务类型，再检查停止条件；在切片内实现并逐段验证。",
        "自审 diff 后填写 PR 模板；不因 Agent 请求而修改权限设置或 hooks。"
      ]
    },
    {
      agent: "Codex",
      notes: [
        "适合大上下文重构、跨文件机械变更和独立第二意见；同样先读 AGENTS/CLAUDE 与真实当前状态。",
        "不以“能编译”作为完成证据；证据规则与 Agent 无关。",
        "与 Claude Code 同时工作时，一个写、一个审，绝不并发写同一文件。"
      ]
    },
    {
      agent: "OpenCode",
      notes: [
        "使用项目级 .opencode/skills；先确认本地治理与 Skill 发现路径，再执行。",
        "安装/加载状态必须单独验证；文件存在不等于 Agent 已发现或调用。",
        "与其他 Agent 并行时使用独立 worktree。"
      ]
    }
  ],

  prohibitions: [
    "不自动 push、创建/删除远端分支、开 PR 或发评论，除非用户明确要求。",
    "不跳过 hooks（--no-verify）、不绕过必需检查、不 force-push 共享分支。",
    "不在没有检查未提交工作时执行 checkout/restore/reset/clean 等可能丢弃工作的命令。",
    "不读取或提交 .env、凭证、私钥或生产数据。",
    "不把 CI 通过当作真实设备、消费者验收或生产发布。"
  ],

  merge: [
    "合并前确认分支只包含预期提交：git log <base>..HEAD --oneline 并逐条阅读。",
    "合并后删除短分支、同步默认分支、确认部署/发布回执；PR merged ≠ 已发布 ≠ 已验收。",
    "回滚优先 revert 合并提交；需要重写历史时由仓库所有者单独批准。"
  ]
});

export function validateGitWorkflow() {
  const errors = [];
  for (const key of ["baseSha", "branches", "worktrees", "commits", "pullRequest", "review", "agentOperating", "prohibitions", "merge"]) {
    if (!Array.isArray(GIT_WORKFLOW[key]) || !GIT_WORKFLOW[key].length) errors.push("git workflow missing " + key);
  }
  if (!GIT_WORKFLOW.baseSha.some(x => x.includes("base SHA"))) errors.push("git workflow must name base SHA");
  if (!GIT_WORKFLOW.pullRequest.some(x => x.includes("命令"))) errors.push("git workflow must require commands");
  if (!GIT_WORKFLOW.pullRequest.some(x => x.includes("UNKNOWN"))) errors.push("git workflow must require unverified items");
  for (const a of GIT_WORKFLOW.agentOperating)
    if (!a.agent || !Array.isArray(a.notes) || !a.notes.length) errors.push("agent operating notes incomplete");
  const boundary = GIT_WORKFLOW.governanceBoundary;
  if (!boundary || typeof boundary !== "object") errors.push("git workflow missing governance boundary");
  else {
    for (const key of ["owner", "organizationScope", "projectScope", "conflictRule", "nonCopy"])
      if (typeof boundary[key] !== "string" || !boundary[key].trim()) errors.push("governance boundary missing " + key);
    if (!Array.isArray(boundary.precedence) || boundary.precedence.length < 2) errors.push("governance boundary missing precedence");
    if (!boundary.organizationScope.includes("OPC")) errors.push("governance boundary must name the OPC organisation scope");
  }
  if (!Array.isArray(GIT_WORKFLOW.agentRoleSplit) || !GIT_WORKFLOW.agentRoleSplit.length) errors.push("git workflow missing agent role split");
  else for (const row of GIT_WORKFLOW.agentRoleSplit)
    if (!row.task || !row.defaultAgent || !row.note) errors.push("agent role split row incomplete");
  if (typeof GIT_WORKFLOW.agentSplitRule !== "string" || !GIT_WORKFLOW.agentSplitRule.includes("Claude Code") || !GIT_WORKFLOW.agentSplitRule.includes("Codex"))
    errors.push("agent split rule must name both default agents");
  return errors;
}
