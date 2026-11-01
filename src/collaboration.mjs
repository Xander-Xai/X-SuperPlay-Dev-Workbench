// Delivery-level collaboration contract. Advisory data + pure validation only:
// this module never creates worktrees, merges, deploys or changes permissions.

export const COLLABORATION_STATUS = Object.freeze("ADVISORY_CONTRACT_VALIDATED");

export const COLLABORATION_MODES = Object.freeze([
  Object.freeze({
    id: "solo", name: "单写者",
    useWhen: "一个写者、小范围变更、无需并行。",
    isolation: "当前工作树。",
    forbidden: "并行写同一文件；自动合并或发布。"
  }),
  Object.freeze({
    id: "subagents", name: "Subagents",
    useWhen: "同一会话内可拆成互不依赖的研究或实现切片。",
    isolation: "共享工作树，但文件所有权必须不相交；多个写者时改用 worktrees。",
    forbidden: "两个写者编辑同一文件；子代理绕过人工 Gate。"
  }),
  Object.freeze({
    id: "worktrees", name: "独立 Worktree",
    useWhen: "多个写者、实验分支或需要隔离未提交状态。",
    isolation: "每个写者一个 worktree、一个分支。",
    forbidden: "共享可写工作树；手工删除 worktree 目录。"
  }),
  Object.freeze({
    id: "agent-teams", name: "Agent Teams",
    useWhen: "需要共享任务表与点对点消息的探索性协作。",
    isolation: "写入仍必须使用独立 worktree；平台不自动隔离文件。",
    forbidden: "假设平台自动隔离；让团队自行决定合并顺序。"
  }),
  Object.freeze({
    id: "batch-pr", name: "Batch PR Workers",
    useWhen: "大量互不依赖的机械任务，可并行产出多个 PR。",
    isolation: "一个 worker 一个 worktree、一个 PR。",
    forbidden: "多个 worker 合入一个 PR；批量合并未经审查。"
  })
]);

export const COLLABORATION_MODE_IDS = Object.freeze(COLLABORATION_MODES.map(m => m.id));

export const DELEGATION_FIELDS = Object.freeze([
  "ticket_id", "writer", "reviewer", "worktree", "branch", "base_sha",
  "allowed_files", "allowed_commands", "stop_conditions", "handoff", "human_gates"
]);

export const HUMAN_GATES = Object.freeze([
  Object.freeze({ id: "merge", name: "合并到受保护分支", rule: "必须由人类批准；写者不得自批。" }),
  Object.freeze({ id: "release", name: "发布/部署", rule: "必须由授权人类在发布窗口批准。" }),
  Object.freeze({ id: "production-access", name: "生产访问", rule: "必须由授权人类授予，最小权限、限时。" }),
  Object.freeze({ id: "permissions", name: "权限/凭据变更", rule: "必须由仓库或平台所有者批准。" }),
  Object.freeze({ id: "spend", name: "超出预算的花费", rule: "必须由预算所有者批准。" }),
  Object.freeze({ id: "external-comms", name: "外部沟通", rule: "对外发布、邮件或客户沟通必须由人类批准。" }),
  Object.freeze({ id: "destructive", name: "破坏性或不可逆动作", rule: "删除、迁移、覆盖、回滚等必须由人类批准。" })
]);

export const HUMAN_GATE_IDS = Object.freeze(HUMAN_GATES.map(g => g.id));

const uniq = arr => [...new Set(arr)];
const isNonEmptyString = v => typeof v === "string" && v.trim().length > 0;

export function collaborationMode(id) {
  return COLLABORATION_MODES.find(m => m.id === id) ?? null;
}

export function validateCollaboration() {
  const errors = [];
  if (COLLABORATION_MODES.length !== 5) errors.push("collaboration: expected 5 modes");
  if (new Set(COLLABORATION_MODE_IDS).size !== COLLABORATION_MODES.length) errors.push("collaboration: duplicate mode ids");
  for (const mode of COLLABORATION_MODES)
    for (const key of ["id", "name", "useWhen", "isolation", "forbidden"])
      if (!isNonEmptyString(mode[key])) errors.push("collaboration: mode " + mode.id + " missing " + key);
  if (DELEGATION_FIELDS.length !== 11) errors.push("collaboration: expected 11 delegation fields");
  if (HUMAN_GATE_IDS.length !== 7) errors.push("collaboration: expected 7 human gates");
  if (new Set(HUMAN_GATE_IDS).size !== HUMAN_GATES.length) errors.push("collaboration: duplicate human gate ids");
  for (const gate of HUMAN_GATES)
    for (const key of ["id", "name", "rule"])
      if (!isNonEmptyString(gate[key])) errors.push("collaboration: gate " + gate.id + " missing " + key);
  return errors;
}

export function validateDelegation(input = {}) {
  const errors = [];
  const mode = collaborationMode(input.mode);
  if (!mode) return ["unknown collaboration mode: " + input.mode];
  const writers = Array.isArray(input.writers) ? input.writers : [];
  if (!writers.length) errors.push("delegation: at least one writer is required");
  if (mode.id === "solo" && writers.length > 1) errors.push("delegation: solo mode allows one writer");

  const seen = new Set();
  const files = new Map();
  const prs = new Map();
  for (const writer of writers) {
    if (!isNonEmptyString(writer.id)) { errors.push("delegation: writer id is required"); continue; }
    if (seen.has(writer.id)) errors.push("delegation: duplicate writer " + writer.id);
    seen.add(writer.id);
    if (!isNonEmptyString(writer.reviewer)) errors.push("delegation: writer " + writer.id + " has no reviewer");
    else if (writer.reviewer.toLowerCase() === writer.id.toLowerCase())
      errors.push("delegation: writer " + writer.id + " cannot review their own work");
    if (!Array.isArray(writer.allowed_files) || !writer.allowed_files.length)
      errors.push("delegation: writer " + writer.id + " has no allowed_files");
    if (!Array.isArray(writer.allowed_commands) || !writer.allowed_commands.length)
      errors.push("delegation: writer " + writer.id + " has no allowed_commands");
    if (!isNonEmptyString(writer.base_sha)) errors.push("delegation: writer " + writer.id + " has no base_sha");
    const needsWorktree = ["worktrees", "agent-teams", "batch-pr"].includes(mode.id) || writers.length > 1;
    if (needsWorktree && !isNonEmptyString(writer.worktree))
      errors.push("delegation: writer " + writer.id + " needs an isolated worktree");
    for (const file of writer.allowed_files ?? []) {
      if (!isNonEmptyString(file)) { errors.push("delegation: writer " + writer.id + " has an empty file path"); continue; }
      const owners = files.get(file) ?? [];
      owners.push(writer.id);
      files.set(file, owners);
    }
    if (mode.id === "batch-pr") {
      if (!isNonEmptyString(writer.pr)) errors.push("delegation: batch writer " + writer.id + " has no PR id");
      else if (prs.has(writer.pr)) errors.push("delegation: PR " + writer.pr + " is shared by " + prs.get(writer.pr) + " and " + writer.id);
      else prs.set(writer.pr, writer.id);
    }
  }
  for (const [file, owners] of files)
    if (uniq(owners).length > 1) errors.push("delegation: file " + file + " has multiple writers: " + uniq(owners).join(", "));

  const gates = Array.isArray(input.human_gates) ? input.human_gates : [];
  for (const gate of gates) if (!HUMAN_GATE_IDS.includes(gate)) errors.push("delegation: unknown human gate " + gate);
  if (input.release && !gates.includes("release")) errors.push("delegation: release requires a human release gate");
  if (input.production && !gates.includes("production-access")) errors.push("delegation: production access requires a human gate");
  if (input.destructive && !gates.includes("destructive")) errors.push("delegation: destructive action requires a human gate");
  if (input.merge !== false && !gates.includes("merge")) errors.push("delegation: merge requires a human gate");
  return uniq(errors);
}

export function collaborationPlan(plan) {
  const baseSha = plan?.config?.baseline?.headSha ?? "UNKNOWN";
  const slug = plan?.slug ?? "project";
  const writer = "writer:" + (plan?.config?.agent ?? "claude-code");
  return {
    status: COLLABORATION_STATUS,
    mode: "solo",
    base_sha: baseSha,
    writers: [{
      id: writer,
      reviewer: "independent-reviewer",
      worktree: ".worktrees/" + slug + "-writer-1",
      branch: "feat/" + slug,
      base_sha: baseSha,
      allowed_files: ["<from ticket allowed_files>"],
      allowed_commands: ["<from ticket allowed_commands>"],
      stop_conditions: ["needs unapproved credential", "two failed hypotheses", "budget exhausted", "scope drift"],
      pr: null
    }],
    human_gates: ["merge", "release", "production-access", "permissions", "spend", "external-comms", "destructive"],
    note: "Template only. Workbench does not create worktrees, merge, deploy or change permissions."
  };
}
