import {
  TYPES, STACKS, AGENTS, ADDONS, SKILLS, STAGES, TASKS, PROFILES, TIERS,
  EVIDENCE_STATES, EVIDENCE_LAYERS, EVIDENCE_KINDS, OWNER, PROVENANCE, RUNTIME, ROUTE_SOPS
} from "./catalog.mjs";
import { assemble, xengDryRun, toMarkdown, toManifest } from "./engine.mjs";
import { skillKitCommand, skillsForStage, resolveSkillDependencies, discoverSkills } from "./install-contract.mjs";
import { starterMarkdown } from "./starter.mjs";
import { normalizeBaseline } from "./baseline.mjs";
import { stageHandoff } from "./handoff.mjs";
import { workspaceBundle } from "./workspace.mjs";
import { requiredEvidenceByStage } from "./routing.mjs";
import { normalizeEvidenceReport, evidenceSummary, emptyEvidenceReport, evidenceDisplayState } from "./evidence.mjs";
import { PLAYBOOKS, PLAYBOOK_STATUS } from "./playbooks.mjs";
import { GIT_WORKFLOW } from "./git-workflow.mjs";
import { MATURITY_LEVELS, MATURITY_TARGET } from "./maturity.mjs";
import { listProviders } from "./orchestration.mjs";

const one = selector => document.querySelector(selector);
const all = selector => [...document.querySelectorAll(selector)];
const newElement = (tag, cls, text) => {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text !== undefined) el.textContent = text;
  return el;
};

let kind = "mini-program";
let activeStage = 0;
let activeView = "launcher";
let generatedAt = "";
let toastTimeout;
let localBaseline = null;
let evidenceReport = emptyEvidenceReport();
let activeWorkspaceFile = null;
let activeSkillId = SKILLS[0]?.id ?? null;
let activeWorkflowTab = "stages";
let activePlaybook = PLAYBOOKS[0]?.id ?? "ai-application";

const names = { saas: "SaaS 应用", enterprise: "企业内部系统", "mini-program": "微信预约服务小程序", app: "移动端应用" };
const stackOptions = type => STACKS.filter(s => s.appliesTo.includes(type));

function toast(message) {
  const el = one("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.classList.remove("show"), 3200);
}

function readConfig() {
  return {
    type: kind,
    stack: one("#project-stack").value,
    agent: one("#project-agent").value,
    addons: all("#addon-list input:checked").map(x => x.value),
    name: one("#project-name").value,
    description: one("#project-description").value,
    tier: one("#project-tier").value,
    mode: one("#project-mode").value,
    task: one("#project-task").value,
    baseline: localBaseline && localBaseline.projectType === kind && one("#project-mode").value === "existing" ? localBaseline : null
  };
}

function plan() {
  const p = assemble(readConfig());
  p.manifest = toManifest(p);
  return p;
}

function download(name, body, mime) {
  const blob = new Blob([body], { type: mime });
  const url = URL.createObjectURL(blob), a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ------------------------------------------------------------ launcher

function renderRoutes() {
  const grid = one("#route-grid");
  grid.replaceChildren();
  for (const [id, item] of Object.entries(TYPES)) {
    const btn = newElement("button", "route-card" + (id === kind ? " selected" : ""));
    btn.type = "button";
    btn.setAttribute("aria-pressed", String(id === kind));
    btn.append(newElement("span", "route-icon", item.icon));
    btn.append(newElement("strong", "route-title", item.name));
    btn.append(newElement("span", "route-subtitle", item.tagline));
    btn.append(newElement("span", "route-selection", id === kind ? "已选择 ●" : "选择路线 ↗"));
    btn.addEventListener("click", () => {
      const oldName = one("#project-name").value;
      if (Object.values(names).includes(oldName)) one("#project-name").value = names[id];
      kind = id;
      activeStage = 0;
      if (localBaseline && localBaseline.projectType !== id) localBaseline = null;
      renderStackSelect();
      render();
    });
    grid.append(btn);
  }
}

function renderStackSelect() {
  const options = stackOptions(kind);
  const select = one("#project-stack");
  select.replaceChildren();
  for (const option of options) {
    const node = document.createElement("option");
    node.value = option.id;
    node.textContent = option.name;
    select.append(node);
  }
  if (options.length) select.value = options[0].id;
  one("#app-stack-field").hidden = options.length === 0;
}

function renderSelects() {
  const taskSelect = one("#project-task");
  taskSelect.replaceChildren();
  for (const task of TASKS) {
    const node = document.createElement("option");
    node.value = task.id;
    node.textContent = task.name + " · " + task.id;
    taskSelect.append(node);
  }
  taskSelect.value = "feature";
  const agentSelect = one("#project-agent");
  agentSelect.replaceChildren();
  for (const agent of AGENTS) {
    const node = document.createElement("option");
    node.value = agent.id;
    node.textContent = agent.name;
    agentSelect.append(node);
  }
  agentSelect.value = "claude-code";
  renderStackSelect();
}

function renderAddons() {
  const root = one("#addon-list");
  root.replaceChildren();
  for (const addon of ADDONS) {
    const label = newElement("label", "addon");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = addon.id;
    if (addon.appliesTo && !addon.appliesTo.includes(kind)) cb.disabled = true;
    const content = newElement("span", "addon-text");
    content.append(newElement("strong", "", addon.name), newElement("small", "", addon.note));
    label.append(cb, content);
    cb.addEventListener("change", render);
    root.append(label);
  }
}

function renderSummary(p) {
  one("#summary-type").textContent = p.type.name + " · " + p.profiles.length + " Profiles";
  one("#summary-acceptance").textContent = p.type.acceptance + " 必须覆盖的负例：" + p.routeSop.negativeCase;
  one("#summary-task").textContent = p.task.name + "（" + p.task.id + "） · " + p.stages.length + " 阶段 · " + p.mode + " · Tier " + p.tier.id;
  const chipRoot = one("#profile-chips");
  chipRoot.replaceChildren();
  p.profiles.forEach(id => chipRoot.append(newElement("span", "chip", id)));
  const list = one("#obligation-list");
  list.replaceChildren();
  const rows = [
    ["产物", p.profileObligations.artifacts],
    ["测试", p.profileObligations.tests],
    ["验证面", p.profileObligations.verification],
    ["安全", p.profileObligations.security]
  ];
  for (const [label, values] of rows) {
    const li = newElement("li");
    li.append(newElement("span", "check-marker", "○"), newElement("span", "", label + "：" + (values.join("；") || "无")));
    list.append(li);
  }
  one("#baseline-state").textContent = p.config.baseline
    ? "已导入只读基线：" + p.config.baseline.name + " · HEAD " + p.config.baseline.headSha.slice(0, 12) + " · 测试 NOT_RUN"
    : "未导入基线。可本地运行 project-probe.mjs 并选择 JSON；不会上传。";
}

function renderStages(p) {
  const list = one("#stage-list");
  list.replaceChildren();
  p.stages.forEach((stage, i) => {
    const btn = newElement("button", "stage-row" + (i === activeStage ? " active" : ""));
    btn.type = "button";
    btn.setAttribute("aria-pressed", String(i === activeStage));
    btn.append(newElement("span", "stage-n", String(stage.index).padStart(2, "0")));
    const mid = newElement("span", "stage-main");
    mid.append(newElement("strong", "", stage.name), newElement("small", "", stage.en + " · " + stage.focus));
    btn.append(mid, newElement("span", "stage-chevron", stage.role === "optional" ? "◇" : "↗"));
    btn.addEventListener("click", () => {
      activeStage = i;
      const current = plan();
      renderStages(current);
      renderOutput(current);
    });
    list.append(btn);
  });

  const s = p.stages[activeStage];
  const ins = one("#stage-inspector");
  ins.replaceChildren();
  ins.append(newElement("div", "inspector-eyebrow", "STAGE " + String(s.index).padStart(2, "0") + " / " + s.en.toUpperCase() + " / " + s.role.toUpperCase()));
  ins.append(newElement("h3", "", s.name));
  ins.append(newElement("span", "pending-label", "NOT_RUN"));
  ins.append(newElement("p", "inspector-goal", s.focus));
  if (s.optionalReason) ins.append(newElement("p", "install-disclaimer", "可裁剪：" + s.optionalReason));

  for (const field of [
    { title: "阶段目标", value: s.goal },
    { title: "预期交付物", value: s.deliverable },
    { title: "阶段验收 Gate", value: s.gate },
    { title: "所需证据", value: s.evidence.join(", ") }
  ]) {
    const block = newElement("div", "inspector-block");
    block.append(newElement("small", "", field.title), newElement("p", "", field.value));
    ins.append(block);
  }

  const ops = newElement("div", "inspector-block");
  ops.append(newElement("small", "", "Agent 操作"));
  const opList = newElement("ul", "inline-points");
  s.agentOps.forEach(v => opList.append(newElement("li", "", v)));
  ops.append(opList);
  ins.append(ops);

  const skillArea = newElement("div", "inspector-skillarea");
  skillArea.append(newElement("small", "", "本阶段关联候选 Skills"));
  const row = newElement("div", "chips");
  if (!s.skills.length) row.append(newElement("span", "muted", "本阶段不强制调用 Skill"));
  s.skills.forEach(skill => row.append(newElement("span", "chip muted-chip", skill.id)));
  skillArea.append(row);
  ins.append(skillArea);

  const handoffButton = newElement("button", "outline-button stage-handoff", "复制本阶段 Agent 任务交接 ↗");
  handoffButton.type = "button";
  handoffButton.addEventListener("click", async () => {
    const text = stageHandoff(plan(), s.id);
    try {
      await navigator.clipboard.writeText(text);
      toast("已复制本阶段交接。请在真实项目仓库核实并执行。");
    } catch {
      toast("复制失败，请检查剪贴板权限或人工编辑。");
    }
  });
  ins.append(handoffButton);
  ins.append(newElement("div", "inspector-note", "阶段只有在目标项目产生真实测试与验收证据后，才能标为完成。"));
}

function renderOutput(p) {
  one("#init-command").textContent = xengDryRun(p);
  const stage = p.stages[activeStage] ?? p.stages[0];
  one("#selected-install-stage").textContent = "当前阶段：" + stage.name;
  one("#selected-install-skills").textContent = "按需候选：" + skillsForStage(p, stage.id).join(", ");
  one("#install-command").textContent = skillKitCommand(p, stage.id);
  one("#export-state").textContent = generatedAt
    ? "当前页面展示最新装配预览；上次生成：" + generatedAt
    : "尚未导出。所有结果默认为 NOT_RUN。";
}

function render() {
  const p = plan();
  renderRoutes();
  renderSummary(p);
  renderStages(p);
  renderOutput(p);
  if (activeView === "workspace") renderWorkspace(p);
}

// ------------------------------------------------------------ workflow explorer

function table(headers, rows) {
  const el = newElement("table", "data-table");
  const thead = document.createElement("thead");
  const tr = document.createElement("tr");
  headers.forEach(h => tr.append(newElement("th", "", h)));
  thead.append(tr);
  const tbody = document.createElement("tbody");
  for (const row of rows) {
    const r = document.createElement("tr");
    for (const cell of row) {
      const td = document.createElement("td");
      if (cell instanceof Node) td.append(cell);
      else td.textContent = cell;
      r.append(td);
    }
    tbody.append(r);
  }
  el.append(thead, tbody);
  return el;
}

function renderWorkflow() {
  all("#workflow-tabs .tab").forEach(t => t.classList.toggle("active", t.dataset.tab === activeWorkflowTab));
  const body = one("#workflow-body");
  body.replaceChildren();
  if (activeWorkflowTab === "stages") {
    body.append(newElement("p", "muted", "11 个唯一阶段。任务路线选择其中若干阶段；未选择的阶段被明确跳过，不视为完成。"));
    body.append(table(
      ["#", "阶段", "目标", "交付物", "Gate", "证据"],
      STAGES.map((s, i) => [String(i + 1).padStart(2, "0"), s.name + " · " + s.en, s.goal, s.deliverable, s.gate, s.evidence.join(", ")])
    ));
  } else if (activeWorkflowTab === "tasks") {
    body.append(newElement("p", "muted", "13 种任务路由。路线会按任务性质裁剪阶段，并追加必需证据。"));
    body.append(table(
      ["任务", "名称", "阶段数", "阶段序列", "必需证据"],
      TASKS.map(t => [t.id, t.name, String(t.stages.length), t.stages.join(" → "), t.evidence.join(", ")])
    ));
  } else if (activeWorkflowTab === "routes") {
    body.append(newElement("p", "muted", "4 条交付路线的专属 SOP。复用 11 阶段生命周期，只补充前置条件、平台限制、负例、Gate 与回退。"));
    body.append(table(
      ["路线", "前置条件", "必须覆盖的负例", "关键 Gate", "平台不可替代", "回退"],
      Object.values(ROUTE_SOPS).map(s => [
        s.name, s.prerequisites.join("；"), s.negativeCase,
        s.gates.join("；"), s.platformConstraints.join("；"), s.rollback.join("；")
      ])
    ));
  } else if (activeWorkflowTab === "profiles") {
    const overlayCount = PROFILES.filter(p => p.overlay).length;
    body.append(newElement("p", "muted", PROFILES.length + " 个 Profile（" + (PROFILES.length - overlayCount) + " 个基础 + " + overlayCount + " 个叠加）。叠加 Profile 只作用于适用项目类型。"));
    body.append(table(
      ["Profile", "适用", "类型", "必需产物", "必需测试"],
      PROFILES.map(p => [p.id, p.appliesWhen, p.overlay ? "OVERLAY" : "BASE", p.required.artifacts.join("；"), p.required.tests.join("；")])
    ));
  } else if (activeWorkflowTab === "git") {
    body.append(newElement("p", "muted", GIT_WORKFLOW.authority));
    const b = GIT_WORKFLOW.governanceBoundary;
    body.append(newElement("h3", "workflow-heading", "治理边界（G-02）"));
    const boundary = newElement("ul", "inline-points");
    [
      "组织级所有者：" + b.owner,
      "组织级范围：" + b.organizationScope,
      "项目级范围：" + b.projectScope,
      "优先级：" + b.precedence.join(" > "),
      "冲突规则：" + b.conflictRule,
      "不复制：" + b.nonCopy
    ].forEach(v => boundary.append(newElement("li", "", v)));
    body.append(boundary);
    for (const [title, key] of [
      ["Base SHA", "baseSha"], ["分支模型", "branches"], ["Worktree 隔离", "worktrees"],
      ["提交粒度", "commits"], ["PR 检查", "pullRequest"], ["Review 完成", "review"],
      ["禁止动作", "prohibitions"], ["合并后清理", "merge"]
    ]) {
      body.append(newElement("h3", "workflow-heading", title));
      const ul = newElement("ul", "inline-points");
      GIT_WORKFLOW[key].forEach(v => ul.append(newElement("li", "", v)));
      body.append(ul);
    }
    body.append(newElement("h3", "workflow-heading", "Agent 默认分工"));
    const roleSplit = newElement("div", "agent-note-list");
    GIT_WORKFLOW.agentRoleSplit.forEach(r => {
      const card = newElement("div", "agent-note");
      card.append(newElement("strong", "", r.task), newElement("span", "", r.defaultAgent), newElement("p", "", r.note));
      roleSplit.append(card);
    });
    body.append(roleSplit);
    body.append(newElement("p", "install-disclaimer", GIT_WORKFLOW.agentSplitRule));
    body.append(newElement("h3", "workflow-heading", "按 Agent 的操作要点"));
    const agentNotes = newElement("div", "agent-note-list");
    GIT_WORKFLOW.agentOperating.forEach(a => {
      const card = newElement("div", "agent-note");
      card.append(newElement("strong", "", a.agent), newElement("p", "", a.notes.join(" ")));
      agentNotes.append(card);
    });
    body.append(agentNotes);
    body.append(newElement("p", "install-disclaimer", "这是建议，不是组织级强制规范；项目本地规则与 CI 门禁优先。生成项目还会收到 docs/git-workflow.md 与 .github/pull_request_template.md。"));
  } else if (activeWorkflowTab === "maturity") {
    body.append(newElement("p", "muted", "L0–L6 是缺口诊断，不是质量分数。xeng maturity 复用 audit 的实际检查，L6 不由静态审计宣称。"));
    body.append(table(
      ["Level", "名称", "可审计含义", "Tier 目标"],
      MATURITY_LEVELS.map(l => [l.id, l.name, l.meaning, Object.entries(MATURITY_TARGET).filter(([, v]) => v === l.id).map(([k]) => k).join(", ") || "—"])
    ));
    body.append(newElement("p", "install-disclaimer", "运行：node tools/xeng.mjs maturity <path> [--json]。等级按连续达成计算；missing_controls 才是可执行输出。"));
  } else if (activeWorkflowTab === "orchestrators") {
    body.append(newElement("p", "muted", "4 个外部多 Agent 编排候选。这里是只读能力注册表，不是已安装或已接入的声明；未安装时 doctor 会如实报告缺失。"));
    body.append(table(
      ["Provider", "优先级", "许可证", "Windows", "WSL2", "OMP", "适配状态"],
      listProviders().map(p => [p.name, p.priority, p.license, p.platforms.windows, p.platforms.wsl2, p.agent_runtimes.omp, p.adapter_status])
    ));
    const notes = newElement("ul", "inline-points");
    [
      "Orca / Herdr 为 P1 候选；互斥可选，不要求同时安装。",
      "Multica 为 P2；许可证含附加条件，审查通过前不引入可执行依赖。",
      "Tern 为 P3 闭测候选；Windows / WSL2 未获支持声明，当前标记 BLOCKED。",
      "外部运行输出一律 UNTRUSTED；Agent 自称完成不等于 VERIFIED。"
    ].forEach(v => notes.append(newElement("li", "", v)));
    body.append(notes);
    body.append(newElement("p", "install-disclaimer", "生成计划（只读）：node tools/xeng.mjs orchestrator plan --provider orca --agent omp --ticket <file.json>"));
  } else {
    body.append(newElement("p", "muted", "Tier 决定 spec / plan / ADR / review / e2e / rollback / evidence 的最低义务。Tier C/D 可裁剪部分阶段，但必须记录理由。"));
    body.append(table(
      ["Tier", "名称", "Spec", "Plan", "ADR", "Review", "E2E", "Rollback", "证据"],
      Object.entries(TIERS).map(([id, t]) => [id, t.name, t.spec, t.plan, t.adr, t.review, t.e2e, t.rollback, t.evidence])
    ));
  }
}

// ------------------------------------------------------------ engineering playbooks

function renderPlaybooks() {
  all("#playbook-tabs .tab").forEach(t => t.classList.toggle("active", t.dataset.playbook === activePlaybook));
  const body = one("#playbook-body");
  body.replaceChildren();
  const p = PLAYBOOKS.find(x => x.id === activePlaybook) ?? PLAYBOOKS[0];
  if (!p) return;
  const listSection = (title, values) => {
    body.append(newElement("h3", "workflow-heading", title));
    const ul = newElement("ul", "inline-points");
    values.forEach(x => ul.append(newElement("li", "", x)));
    body.append(ul);
  };
  body.append(newElement("p", "install-disclaimer",
    "状态：" + PLAYBOOK_STATUS + "。11 阶段与 Profile 义务仍是权威；本手册不新增 Gate，也不提升任何证据状态。"));

  const card = newElement("section", "card playbook-card");
  card.append(newElement("div", "card-title"));
  card.querySelector(".card-title").append(newElement("strong", "", p.name), newElement("span", "", p.profile));
  card.append(newElement("p", "", p.appliesWhen));
  card.append(newElement("p", "install-disclaimer", p.authority));
  body.append(card);

  listSection("原则", p.principles);
  if (p.acceptanceExamples) listSection("验收示例（合成场景）", p.acceptanceExamples);
  if (p.negativeCases) listSection("必须覆盖的负例", p.negativeCases);
  if (p.stopConditions) listSection("停止条件", p.stopConditions);
  if (p.antiClaims) listSection("不可宣称", p.antiClaims);
  if (p.rhythm) listSection("每日节律", p.rhythm);
  if (p.reporting) {
    body.append(newElement("h3", "workflow-heading", "汇报句式"));
    body.append(newElement("p", "", p.reporting));
  }

  body.append(newElement("h3", "workflow-heading", "任务分流"));
  body.append(newElement("p", "table-hint", "移动端可左右滑动表格查看完整列。"));
  body.append(table(
    ["任务", "第一步", "完成证据"],
    p.triage.map(t => [t.task, t.firstMove, t.evidence])
  ));

  body.append(newElement("h3", "workflow-heading", "阶段手册"));
  body.append(newElement("p", "table-hint", "移动端可左右滑动表格查看完整列。"));
  body.append(table(
    ["阶段", "问题", "最小实现", "退出证据"],
    p.phases.map(phase => [phase.id + " · " + phase.title, phase.question, phase.minimal, phase.exitEvidence.join("；")])
  ));

  if (p.toolContract) {
    body.append(newElement("h3", "workflow-heading", "工具契约示例"));
    body.append(newElement("p", "install-disclaimer", p.toolContract.note));
    const pre = newElement("pre", "playbook-code", p.toolContract.example.join("\n"));
    body.append(pre);
  }

  if (p.evaluationLevels) {
    body.append(newElement("h3", "workflow-heading", "评测分层"));
    body.append(table(
      ["层级", "证明什么", "不证明什么"],
      p.evaluationLevels.map(x => [x.level, x.proves, x.doesNotProve])
    ));
  }
  if (p.evaluation) {
    body.append(newElement("h3", "workflow-heading", "评测规则"));
    const rules = newElement("ul", "inline-points");
    p.evaluation.metrics.forEach(x => rules.append(newElement("li", "", x)));
    p.evaluation.rules.forEach(x => rules.append(newElement("li", "", x)));
    body.append(rules);
  }
  if (p.riskMatrix) {
    body.append(newElement("h3", "workflow-heading", "风险与权限"));
    body.append(table(
      ["风险", "例子", "权限流程"],
      p.riskMatrix.map(x => [x.risk, x.examples, x.control])
    ));
  }
  if (p.stateContract) listSection("状态契约", p.stateContract);
  if (p.durabilityRules) listSection("持久化与恢复", p.durabilityRules);
  if (p.hitlRules) listSection("人工接管（HITL）", p.hitlRules);
  if (p.evalMetrics) listSection("评测指标与覆盖", p.evalMetrics);
  if (p.rerankDecision) {
    body.append(newElement("h3", "workflow-heading", "Rerank 决策"));
    body.append(newElement("p", "", p.rerankDecision));
  }

  body.append(newElement("h3", "workflow-heading", "失败诊断"));
  const diag = newElement("ul", "inline-points");
  p.failureDiagnosis.forEach(x => diag.append(newElement("li", "", x.symptom + "：" + x.order.join(" → ") + "。停止规则：" + x.stopRule)));
  body.append(diag);

  body.append(newElement("h3", "workflow-heading", "Definition of Done"));
  const done = newElement("ul", "inline-points");
  p.definitionOfDone.forEach(x => done.append(newElement("li", "", x)));
  body.append(done);

  body.append(newElement("h3", "workflow-heading", "Agent 交接与回退"));
  const handoff = newElement("ul", "inline-points");
  p.handoff.forEach(x => handoff.append(newElement("li", "", x)));
  p.rollback.forEach(x => handoff.append(newElement("li", "", "回退：" + x)));
  body.append(handoff);
  if (p.exercises) listSection("隔离练习", p.exercises);

  const code = newElement("div", "code-bar");
  code.append(newElement("code", "", "node tools/xeng.mjs playbook " + p.id));
  body.append(code);
}

// ------------------------------------------------------------ skill center

function installCommandFor(skillId, agent) {
  const ids = resolveSkillDependencies(skillId);
  return RUNTIME.skillCli + " install --target ../<project> --agent " + agent + " --skills " + ids.join(",");
}

function renderSkillAgentSelect() {
  const select = one("#skill-agent");
  select.replaceChildren();
  for (const agent of AGENTS) {
    const node = document.createElement("option");
    node.value = agent.id;
    node.textContent = agent.name + " · " + agent.skillsDir;
    select.append(node);
  }
  select.value = "claude-code";
  select.addEventListener("change", renderSkills);
}

function renderSkills() {
  const q = one("#skill-search").value.trim().toLowerCase();
  const agent = one("#skill-agent").value || "claude-code";
  const grid = one("#skills-grid");
  grid.replaceChildren();
  const items = discoverSkills().filter(s =>
    [s.id, s.version, s.status, s.dependencies.join(" ")].join(" ").toLowerCase().includes(q));
  for (const skill of items) {
    const card = newElement("article", "skill-card" + (skill.id === activeSkillId ? " selected" : ""));
    const header = newElement("div", "skill-head");
    header.append(newElement("span", "skill-logo", "◇"), newElement("span", "candidate-label", skill.status));
    card.append(header, newElement("strong", "skill-name", skill.id), newElement("p", "", skill.description));
    card.append(newElement("div", "skill-stage", "用于：" + skill.stages.map(x => STAGES.find(s => s.id === x).name).join(" / ")));
    card.append(newElement("div", "skill-meta", "v" + skill.version + " · 阶段 " + skill.lifecycleStage +
      " · 依赖：" + (skill.dependencies.join(", ") || "无") + " · " + skill.license));
    card.append(newElement("div", "skill-meta", "Agents：" + skill.supportedAgents.join(", ") +
      (skill.prerequisites.length ? " · 前置：" + skill.prerequisites.join(", ") : "")));
    card.append(newElement("code", "skill-path", skill.bundle + "/SKILL.md + references/"));
    card.title = "安装方式：" + skill.installMethod + "\n测试：" + skill.tests.join(", ");
    card.addEventListener("click", () => {
      activeSkillId = skill.id;
      one("#skill-install-command").textContent = installCommandFor(skill.id, agent);
      renderSkills();
    });
    grid.append(card);
  }
  if (!items.length) grid.append(newElement("p", "muted", "没有匹配结果"));
  if (activeSkillId) one("#skill-install-command").textContent = installCommandFor(activeSkillId, agent);
}

// ------------------------------------------------------------ workspace

function renderWorkspace(p) {
  const bundle = workspaceBundle(p);
  const names = Object.keys(bundle);
  if (!activeWorkspaceFile || !bundle[activeWorkspaceFile]) activeWorkspaceFile = names[0];
  const list = one("#workspace-files");
  list.replaceChildren();
  for (const name of names) {
    const btn = newElement("button", "file-row" + (name === activeWorkspaceFile ? " active" : ""), name);
    btn.type = "button";
    btn.addEventListener("click", () => {
      activeWorkspaceFile = name;
      renderWorkspace(p);
    });
    list.append(btn);
  }
  one("#workspace-file-name").textContent = activeWorkspaceFile;
  one("#workspace-preview").textContent = bundle[activeWorkspaceFile] ?? "";
}

// ------------------------------------------------------------ evidence

function statePill(state) {
  return newElement("span", "state-pill state-" + state.toLowerCase(), state);
}

function renderEvidence() {
  const root = one("#evidence-body");
  root.replaceChildren();

  const intro = newElement("div", "info-panel");
  intro.append(newElement("strong", "", "证据阶梯：越往下要求越高"),
    newElement("p", "", "代码检查、真实环境、消费者验收是三个独立层。任何无法验证的步骤保持 UNKNOWN / NOT_RUN；导入的报告只是声明，不是事实。"));
  root.append(intro);

  const ladder = newElement("div", "quality-ladder");
  for (const [i, layer] of EVIDENCE_LAYERS.entries()) {
    const card = newElement("div", "quality-step");
    card.append(newElement("span", "quality-number", String(i + 1).padStart(2, "0")));
    const middle = newElement("div");
    middle.append(newElement("strong", "", layer.name + " · " + layer.id), newElement("p", "", layer.meaning));
    card.append(middle, newElement("code", "", layer.id));
    ladder.append(card);
  }
  root.append(ladder);

  const importPanel = newElement("section", "card evidence-import");
  const importTitle = newElement("div", "card-title");
  importTitle.append(newElement("strong", "", "导入本地证据报告"), newElement("span", "", "LOCAL ONLY"));
  importPanel.append(importTitle);
  importPanel.append(newElement("p", "install-disclaimer",
    "报告格式：schemaVersion=1, kind=LOCAL_EVIDENCE_REPORT, status=IMPORTED_NOT_TRUSTED, items[]。纯浏览器解析，不上传、不执行。"));
  const input = document.createElement("input");
  input.type = "file";
  input.id = "evidence-file";
  input.accept = ".json,application/json";
  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      if (file.size > 65536) throw new Error("文件过大：证据报告最多 64KB");
      evidenceReport = normalizeEvidenceReport(JSON.parse(await file.text()));
      renderEvidence();
      toast("已本地导入证据报告；状态为 IMPORTED_NOT_TRUSTED，未提升任何阶段。");
    } catch (e) {
      toast("证据导入失败：" + e.message);
    } finally {
      input.value = "";
    }
  });
  importPanel.append(input);
  root.append(importPanel);

  const currentPlan = plan();
  const summary = evidenceSummary(evidenceReport, {
    requiredByStage: requiredEvidenceByStage(currentPlan)
  });
  const panel = newElement("section", "card");
  const panelTitle = newElement("div", "card-title");
  panelTitle.append(newElement("strong", "", "证据摘要"), newElement("span", "", summary.trusted ? "TRUSTED" : "NOT_TRUSTED"));
  panel.append(panelTitle);
  const counts = {};
  for (const item of summary.items) counts[item.state] = (counts[item.state] ?? 0) + 1;
  const statRow = newElement("div", "stat-row");
  for (const state of EVIDENCE_STATES) {
    const stat = newElement("div", "stat");
    stat.append(newElement("strong", "", String(counts[state] ?? 0)), newElement("small", "", state));
    statRow.append(stat);
  }
  panel.append(statRow);
  const stageTable = newElement("div", "table-scroll");
  stageTable.append(table(
    ["阶段", "声明状态", "缺失必需 Gate", "证据数"],
    STAGES.map(s => {
      const st = summary.stages[s.id];
      const display = evidenceDisplayState(st);
      const stateCell = newElement("span");
      stateCell.append(statePill(display.state));
      const noteText = display.note === "CONTEXT_UNKNOWN"
        ? "缺少项目上下文 · 不判定"
        : display.note === "CONFLICT"
          ? "冲突：同时存在 VERIFIED 与阻断项"
          : display.note === "CLAIM_COMPLETE_NOT_TRUSTED"
            ? "声明完整 · 未受信"
            : display.note === "MISSING_GATES"
              ? "必需 Gate 未全部证明"
              : "无证据";
      stateCell.append(newElement("small", "gate-note", " " + noteText));
      return [
        s.name,
        stateCell,
        st.missing.length ? st.missing.join(", ") : "—",
        String(st.items.length)
      ];
    })
  ));
  panel.append(stageTable);
  root.append(panel);

  const improve = newElement("div", "info-panel");
  improve.append(newElement("strong", "", "从证据到改进"),
    newElement("p", "", "真实失败模式 → 补测试或 Gate → 在第二个项目复现 → 才考虑提炼 Skill。没有证据的“经验”不进入候选 Skill。"));
  root.append(improve);
}

// ------------------------------------------------------------ views

const VIEWS = ["launcher", "workflow", "skills", "workspace", "playbooks", "evidence"];
const LABELS = { launcher: "LAUNCHER", workflow: "WORKFLOW", skills: "SKILLS", workspace: "WORKSPACE", playbooks: "PLAYBOOKS", evidence: "EVIDENCE" };

function switchView(view) {
  if (!VIEWS.includes(view)) view = "launcher";
  activeView = view;
  all(".nav-item").forEach(x => x.classList.toggle("active", x.dataset.view === view));
  all(".view").forEach(x => x.classList.toggle("active", x.id === "view-" + view));
  one("#breadcrumb").textContent = LABELS[view];
  if (view === "workflow") renderWorkflow();
  if (view === "skills") renderSkills();
  if (view === "workspace") renderWorkspace(plan());
  if (view === "playbooks") renderPlaybooks();
  if (view === "evidence") renderEvidence();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function init() {
  const commit = one('meta[name="workbench-commit"]')?.content || "DEV_UNCOMMITTED";
  one("#build-marker").textContent = "RUNTIME " + RUNTIME.version + " · " + commit.slice(0, 10);
  renderSelects();
  renderAddons();
  renderSkillAgentSelect();

  all("[data-view]").forEach(btn => btn.addEventListener("click", () => {
    switchView(btn.dataset.view);
    location.hash = btn.dataset.view;
  }));

  one("#baseline-file").addEventListener("change", async () => {
    const input = one("#baseline-file");
    const file = input.files?.[0];
    if (!file) return;
    try {
      if (file.size > 65536) throw new Error("文件过大：基线报告最多 64KB");
      const normalized = normalizeBaseline(JSON.parse(await file.text()));
      localBaseline = normalized;
      kind = normalized.projectType;
      one("#project-mode").value = "existing";
      if (Object.values(names).includes(one("#project-name").value))
        one("#project-name").value = normalized.name;
      activeStage = 0;
      renderStackSelect();
      render();
      toast("已本地导入只读基线；并未运行测试或上传数据。");
    } catch (e) {
      localBaseline = null;
      render();
      toast("基线导入失败：" + e.message);
    } finally {
      input.value = "";
    }
  });

  one("#project-name").addEventListener("input", render);
  one("#project-description").addEventListener("input", render);
  for (const id of ["#project-mode", "#project-agent", "#project-tier", "#project-task", "#project-stack"])
    one(id).addEventListener("change", render);
  one("#project-mode").addEventListener("change", () => { renderAddons(); render(); });

  one("#generate").addEventListener("click", () => {
    generatedAt = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    render();
    one(".pipeline-heading").scrollIntoView({ behavior: "smooth", block: "start" });
    toast("方案已装配。下一步可查看阶段门禁并导出工作区资产。");
  });

  one("#download-starter").addEventListener("click", () => {
    const p = plan();
    download(p.slug + "-spec-and-tickets-draft.md", starterMarkdown(p), "text/markdown;charset=utf-8");
    toast("已导出 Spec + 待审批任务卡；尚未执行或验收。");
  });
  one("#download-json").addEventListener("click", () => exportArtifact("json"));
  one("#download-md").addEventListener("click", () => exportArtifact("md"));
  one("#copy-install").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(one("#install-command").textContent);
      toast("已复制本地 Skills 安装预览命令。");
    } catch {
      toast("请手动选择并复制安装预览命令。");
    }
  });
  one("#copy-command").addEventListener("click", async () => {
    const text = one("#init-command").textContent;
    try {
      await navigator.clipboard.writeText(text);
      toast("已复制只读初始化预览命令。");
    } catch {
      toast("浏览器无法复制，请选中命令手动复制。");
    }
  });
  one("#skill-search").addEventListener("input", renderSkills);
  one("#skill-install-preview").addEventListener("click", () => {
    if (activeSkillId) {
      one("#skill-install-command").textContent = installCommandFor(activeSkillId, one("#skill-agent").value);
      toast("已生成 dry-run 安装预览命令。");
    }
  });
  one("#copy-skill-install").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(one("#skill-install-command").textContent);
      toast("已复制 Skills 安装预览命令。");
    } catch {
      toast("请手动复制命令。");
    }
  });
  one("#download-workspace-file").addEventListener("click", () => {
    const bundle = workspaceBundle(plan());
    if (!activeWorkspaceFile || !bundle[activeWorkspaceFile]) return;
    const isJson = activeWorkspaceFile.endsWith(".json");
    download(activeWorkspaceFile, bundle[activeWorkspaceFile], isJson ? "application/json;charset=utf-8" : "text/markdown;charset=utf-8");
    toast("已下载工作区草案文件；未执行任何安装或部署。");
  });
  one("#download-bundle").addEventListener("click", () => {
    const p = plan();
    const bundle = workspaceBundle(p);
    const name = p.slug + "-bundle.json";
    if (!bundle[name]) return;
    download(name, bundle[name], "application/json;charset=utf-8");
    toast("已导出完整项目资产包（同一 project_id / base_sha）；未执行任何安装或部署。");
  });
  all("#workflow-tabs .tab").forEach(tab => tab.addEventListener("click", () => {
    activeWorkflowTab = tab.dataset.tab;
    renderWorkflow();
  }));
  all("#playbook-tabs .tab").forEach(tab => tab.addEventListener("click", () => {
    activePlaybook = tab.dataset.playbook;
    renderPlaybooks();
  }));
  window.addEventListener("hashchange", () => switchView(location.hash.slice(1)));

  render();
  switchView(location.hash.slice(1) || "launcher");
}

function exportArtifact(format) {
  const p = plan();
  const str = format === "md" ? toMarkdown(p) : JSON.stringify(p.manifest, null, 2) + "\n";
  download(p.slug + (format === "md" ? "-engineering-plan.md" : "-manifest.json"), str,
    format === "md" ? "text/markdown;charset=utf-8" : "application/json;charset=utf-8");
  generatedAt = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  renderOutput(p);
  toast("已生成本地方案文件。未执行任何安装或部署。");
}

init();
