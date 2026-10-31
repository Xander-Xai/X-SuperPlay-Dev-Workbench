import {
  PROVENANCE, OWNER, GOVERNANCE, RUNTIME, TYPES, STACKS, AGENTS, ADDONS,
  SKILLS, STAGES, PROFILES, PROFILE_IDS, TASKS, TASK_IDS, TIERS, DEFAULT_STACK,
  ROUTE_SOPS, ROUTE_SOP_IDS, SKILL_STATUSES
} from "./catalog.mjs";
import { normalizeBaseline, baselineSummary } from "./baseline.mjs";
import { composeRoute, validateRoute, stageSkillIds, tierObligations, profileObligations } from "./routing.mjs";
import { validatePlaybooks } from "./playbooks.mjs";
import { validateGitWorkflow } from "./git-workflow.mjs";
import { validateDelivery } from "./delivery.mjs";
import { validateOrchestration } from "./orchestration.mjs";

const hasId = (arr, id) => arr.some(x => x.id === id);
const clean = (value, max) => String(value ?? "").replace(/\0/g, "").trim().slice(0, max);

export function slugify(value) {
  return String(value || "").toLowerCase().normalize("NFKC")
    .replace(/[^a-z0-9一-鿿 -]/g, "").trim()
    .replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 64) || "new-project";
}

function stackFor(type, stack) {
  const candidate = stack && STACKS.find(s => s.id === stack && s.appliesTo.includes(type));
  if (candidate) return candidate.id;
  return DEFAULT_STACK[type] ?? null;
}

export function normalizeConfig(config = {}) {
  const type = Object.hasOwn(TYPES, config.type) ? config.type : "mini-program";
  const normalized = {
    type,
    stack: stackFor(type, config.stack),
    agent: hasId(AGENTS, config.agent) ? config.agent : "claude-code",
    addons: [...new Set((Array.isArray(config.addons) ? config.addons : []).filter(x => hasId(ADDONS, x)))],
    tier: Object.hasOwn(TIERS, config.tier) ? config.tier : "B",
    mode: config.mode === "existing" ? "existing" : "new",
    task: TASK_IDS.includes(config.task) ? config.task : "feature",
    name: clean(config.name, 100) || "我的新项目",
    description: clean(config.description, 2000)
  };
  if (config.baseline) {
    const baseline = normalizeBaseline(config.baseline);
    if (baseline.projectType !== normalized.type) throw new Error("Baseline project type does not match selected route");
    normalized.baseline = baseline;
  }
  return normalized;
}

export function assemble(input = {}) {
  const config = normalizeConfig(input);
  const type = TYPES[config.type];
  const route = composeRoute(config);
  const errors = validateRoute(route);
  if (errors.length) throw new Error("Invalid route: " + errors.join("; "));

  const stages = route.stages.map(s => ({
    ...s,
    skills: SKILLS.filter(k => stageSkillIds(s.id).includes(k.id))
  }));

  return {
    schemaVersion: 2,
    kind: "WORKBENCH_PLAN",
    ownership: { historical: PROVENANCE, currentOwner: OWNER, governance: GOVERNANCE, runtime: RUNTIME },
    config, slug: slugify(config.name),
    type, task: route.task, tier: route.tier, mode: route.mode, stack: route.stack,
    profiles: route.profiles,
    routeSop: route.routeSop,
    profileObligations: route.profileObligations,
    stages, skipped: route.skipped,
    skills: SKILLS, routeSkills: route.skills,
    evidence: route.evidence,
    warnings: route.warnings,
    status: "GENERATED_NOT_EXECUTED"
  };
}

export function xengDryRun(plan) {
  if (!plan?.profiles?.every(x => /^[a-z][a-z-]*$/.test(x))) throw new Error("Invalid profile");
  const parts = [
    RUNTIME.cli, "init", "../" + slugify(plan.config.name),
    "--profile", plan.profiles.join(","),
    "--tier", plan.config.tier,
    "--task", plan.config.task,
    "--mode", plan.config.mode,
    "--dry-run"
  ];
  return parts.join(" ");
}

const quote = s => (s || "尚未填写；请先完成需求发现")
  .replace(/\r\n/g, "\n").split("\n").map(line => "> " + line.replace(/\x60/g, "'")).join("\n");

export function toMarkdown(plan) {
  const { config, type, profiles, stages, skipped, task, tier } = plan;
  const lines = [
    "# " + config.name + " · 开发方案", "",
    "> 状态：GENERATED / NOT_RUN。方案不代表已安装、已测试、已部署或已验收。",
    "> 当前工程所有者：" + OWNER.repository + "（" + RUNTIME.name + " " + RUNTIME.version + "）",
    "> 历史来源：" + PROVENANCE.repository + " @ " + PROVENANCE.commit + "（只读溯源，不是运行依赖）",
    "> 通用治理参考：" + GOVERNANCE.repository + "（未复制正文）", "",
    "## 项目需求", "", quote(config.description), "",
    "- 类型：" + type.name,
    "- 任务类型：" + task.id + " · " + task.name,
    "- 模式：" + (config.mode === "new" ? "从零开发" : "已有工程迭代"),
    "- Agent：" + config.agent,
    "- Tier：" + tier.id + " · " + tier.name,
    "- 技术路线：" + (plan.stack || "不适用"),
    "- Profiles：" + profiles.join(", "),
    "- AI / 支付扩展：" + (config.addons.join(", ") || "无"), "",
    ...(config.baseline ? [
      "## 现有工程只读基线", "",
      "- Git HEAD：" + config.baseline.headSha,
      "- 工作树有变更：" + (config.baseline.dirty === null ? "UNKNOWN" : String(config.baseline.dirty)),
      "- 检测到：" + config.baseline.detected.join(", "),
      "- 验证状态：NOT_RUN（只读文件扫描不代表测试通过）", ""
    ] : []),
    "## 任务路线", "",
    "本次任务只执行以下阶段；其余阶段被明确跳过，不视为已完成。", "",
    ...stages.map(s => "- " + String(s.index).padStart(2, "0") + " " + s.name + "（" + s.focus + "）"),
    "", "跳过阶段：" + (skipped.map(s => s.id).join(", ") || "无"), "",
    "## 工程初始化（先预览）", "",
    "在本 Workbench 仓库执行（不再需要旧 Engineering OS 克隆）：", "",
    "~~~bash", xengDryRun(plan), "~~~", "",
    "仅在确认目标目录和文件差异后，手动移除 --dry-run 执行。", "",
    "## 阶段与证据门禁", ""
  ];
  for (const s of stages) {
    lines.push(
      "### " + String(s.index).padStart(2, "0") + " " + s.name + " · " + s.en, "",
      "- 目标：" + s.goal,
      "- 本任务重点：" + s.focus,
      "- 交付：" + s.deliverable,
      "- Gate：" + s.gate,
      "- 角色：" + s.role + (s.optionalReason ? "（" + s.optionalReason + "）" : ""),
      "- 相关 Skills：" + (s.skills.map(x => x.id + " [CANDIDATE, 未安装]").join(", ") || "无"),
      "- 所需证据：" + s.evidence.join(", "),
      "- 证据状态：NOT_RUN", ""
    );
  }
  const sop = plan.routeSop;
  lines.push(
    "## 路线 SOP · " + sop.name, "",
    "- 前置条件：" + sop.prerequisites.join("；"),
    "- 本地不可替代的平台环节：" + sop.platformConstraints.join("；"),
    "- 安装前检查：" + sop.preInstallChecks.join("；"),
    "- 必须覆盖的负例：" + sop.negativeCase,
    "- 路线关键 Gate：" + sop.gates.join("；"),
    "- 失败处理：" + sop.failureHandling.join("；"),
    "- 回退方式：" + sop.rollback.join("；"),
    "- 可选分支：" + sop.optionalBranches.join("；"), "",
    "## Profiles 义务", "",
    "- 必需产物：" + (plan.profileObligations.artifacts.join("；") || "无"),
    "- 必需实践：" + (plan.profileObligations.practices.join("；") || "无"),
    "- 必需测试：" + (plan.profileObligations.tests.join("；") || "无"),
    "- 验证面：" + (plan.profileObligations.verification.join("；") || "无"),
    "- 安全：" + (plan.profileObligations.security.join("；") || "无"),
    "- 发布：" + (plan.profileObligations.release.join("；") || "无"), "",
    "## 平台专属检查", "",
    ...type.checks.map(x => "- [ ] " + x), "",
    "**验收标准**：" + type.acceptance, "",
    "## 必需证据", "",
    ...plan.evidence.map(k => "- " + k), "",
    "UNKNOWN 不等于 PASS；没有真实回执的证据保持 NOT_RUN。", "",
    "## 迭代反馈", "",
    "- [ ] 保存真实 PR / CI / 测试 / 设备 / 发布回执",
    "- [ ] 记录失败模式与当前阻碍，不把 UNKNOWN 作为 PASS",
    "- [ ] 经跨项目复用和实证验证后，再提出 Skill 或 Gate 改进", ""
  );
  return lines.join("\n");
}

export function toManifest(plan) {
  const { config, slug, profiles, stages, task, tier } = plan;
  return {
    schemaVersion: 2,
    kind: "WORKBENCH_PLAN",
    status: "GENERATED_NOT_EXECUTED",
    ownership: {
      historicalProvenance: { repository: PROVENANCE.repository, commit: PROVENANCE.commit, status: PROVENANCE.status },
      currentEngineeringOwner: { repository: OWNER.repository, role: OWNER.role },
      genericGovernanceReference: { repository: GOVERNANCE.repository, commit: GOVERNANCE.commit, status: GOVERNANCE.status },
      publishedRuntime: { name: RUNTIME.name, version: RUNTIME.version, buildSha: RUNTIME.buildSha }
    },
    project: {
      name: config.name, slug, type: config.type, mode: config.mode, tier: config.tier,
      description: config.description, stack: config.stack, task: config.task,
      baseSha: config.baseline?.headSha ?? "UNKNOWN"
    },
    task: { id: task.id, name: task.name, notes: task.notes },
    agent: config.agent,
    addons: config.addons,
    profiles,
    routeSop: {
      id: plan.routeSop.id, name: plan.routeSop.name,
      negativeCase: plan.routeSop.negativeCase,
      platformConstraints: [...plan.routeSop.platformConstraints],
      gates: [...plan.routeSop.gates]
    },
    profileObligations: plan.profileObligations,
    baseline: config.baseline ? baselineSummary(config.baseline) : null,
    route: {
      stages: stages.map(s => ({
        id: s.id, index: s.index, role: s.role, focus: s.focus,
        deliverable: s.deliverable, gate: s.gate,
        skills: s.skills.map(x => x.id), evidence: s.evidence, state: "NOT_RUN"
      })),
      skipped: plan.skipped,
      requiredEvidence: plan.evidence
    },
    skills: plan.skills.map(x => ({ id: x.id, status: x.status, installed: false, version: x.version })),
    commands: {
      init: xengDryRun(plan),
      installSkills: "node tools/skill-kit.mjs install --target ../" + slug + " --agent " + config.agent + " --skills <stage-skill-ids>"
    }
  };
}

export function validateCatalog() {
  const errors = [];
  for (const [id, type] of Object.entries(TYPES)) {
    if (!type.profiles.every(p => PROFILE_IDS.includes(p))) errors.push("unknown profile in type " + id);
    if (!type.checks?.length) errors.push("empty checks in " + id);
  }
  if (ROUTE_SOP_IDS.length !== Object.keys(TYPES).length)
    errors.push("route SOP count must match product types");
  for (const id of Object.keys(TYPES)) {
    const sop = ROUTE_SOPS[id];
    if (!sop) { errors.push("missing route SOP " + id); continue; }
    if (sop.id !== id) errors.push("route SOP id mismatch " + id);
    for (const key of ["prerequisites", "platformConstraints", "preInstallChecks", "deliverables", "gates", "failureHandling", "rollback", "optionalBranches"])
      if (!Array.isArray(sop[key]) || !sop[key].length || !sop[key].every(x => typeof x === "string" && x.trim()))
        errors.push("route SOP " + id + " has invalid " + key);
    if (typeof sop.negativeCase !== "string" || !sop.negativeCase.trim())
      errors.push("route SOP " + id + " lacks a negative case");
    if (!sop.keySkills.length || !sop.keySkills.every(s => SKILLS.some(k => k.id === s)))
      errors.push("route SOP " + id + " references an unknown skill");
  }
  for (const item of STACKS) {
    if (!item.profiles.every(p => PROFILE_IDS.includes(p))) errors.push("unknown profile in stack " + item.id);
    if (!item.appliesTo.every(t => Object.hasOwn(TYPES, t))) errors.push("unknown type in stack " + item.id);
  }
  for (const item of ADDONS)
    if (!item.profiles.every(p => PROFILE_IDS.includes(p))) errors.push("unknown profile in addon " + item.id);

  if (new Set(PROFILES.map(p => p.id)).size !== PROFILES.length) errors.push("duplicate profile ids");
  for (const p of PROFILES)
    for (const key of ["artifacts", "practices", "tests", "verification", "security", "release"])
      if (!Array.isArray(p.required[key])) errors.push("profile " + p.id + " missing required." + key);

  const stageSet = new Set(STAGES.map(x => x.id));
  if (stageSet.size !== 11) errors.push("lifecycle must contain 11 unique stages");
  for (const stage of STAGES) {
    if (!stage.requiredSkills.every(s => SKILLS.some(k => k.id === s)))
      errors.push("unknown required skill in stage " + stage.id);
    if (!stage.recommendedSkills.every(s => SKILLS.some(k => k.id === s)))
      errors.push("unknown recommended skill in stage " + stage.id);
    if (!stage.next.every(n => n === "END" || stageSet.has(n)))
      errors.push("unknown next stage in " + stage.id);
  }

  if (new Set(TASKS.map(t => t.id)).size !== TASKS.length) errors.push("duplicate task ids");
  const kinds = ["test", "eval", "integration-probe", "manual-probe", "receipt", "review", "doc-update", "adr"];
  for (const task of TASKS) {
    if (!task.stages.every(s => stageSet.has(s))) errors.push("unknown stage in task " + task.id);
    if (!task.skills.every(s => SKILLS.some(k => k.id === s))) errors.push("unknown skill in task " + task.id);
    if (!task.evidence.every(e => kinds.includes(e))) errors.push("unknown evidence in task " + task.id);
  }
  if (TASKS.length !== 13) errors.push("task router must contain 13 task types");

  if (new Set(SKILLS.map(x => x.id)).size !== 8) errors.push("skills must contain 8 unique candidates");
  for (const skill of SKILLS) {
    if (!skill.stages.every(x => stageSet.has(x))) errors.push("unknown stage in skill " + skill.id);
    if (!skill.dependencies.every(d => SKILLS.some(k => k.id === d))) errors.push("unknown dependency in skill " + skill.id);
    if (skill.selfContained !== true) errors.push("skill " + skill.id + " must be self-contained");
    if (!SKILL_STATUSES.includes(skill.status)) errors.push("invalid skill status " + skill.id);
    if (skill.owner !== OWNER.repository) errors.push("skill " + skill.id + " has no current owner");
    if (!skill.source || skill.source.repository !== PROVENANCE.repository ||
        skill.source.commit !== PROVENANCE.commit || !skill.source.path)
      errors.push("skill " + skill.id + " has incomplete source metadata");
    if (skill.license !== "UNLICENSED-PROPRIETARY") errors.push("skill " + skill.id + " license changed without authorization");
    if (!Array.isArray(skill.supportedAgents) || !skill.supportedAgents.length ||
        !skill.supportedAgents.every(a => AGENTS.some(x => x.id === a)))
      errors.push("skill " + skill.id + " lists an unsupported agent");
    if (!skill.stages.includes(skill.lifecycle_stage)) errors.push("skill " + skill.id + " lifecycle_stage is not in stages");
    if (!Array.isArray(skill.prerequisites) || !skill.prerequisites.every(d => SKILLS.some(k => k.id === d)))
      errors.push("skill " + skill.id + " has invalid prerequisites");
    if (typeof skill.installMethod !== "string" || !skill.installMethod.includes("skill-kit.mjs"))
      errors.push("skill " + skill.id + " has no installation method");
    if (!Array.isArray(skill.tests) || !skill.tests.length) errors.push("skill " + skill.id + " has no tests");
    if (skill.status !== "CANDIDATE" && (!Array.isArray(skill.evidence) || !skill.evidence.length))
      errors.push("skill " + skill.id + " cannot advance without real use evidence");
  }
  for (const tier of ["A", "B", "C", "D"]) if (!Object.hasOwn(TIERS, tier)) errors.push("missing tier " + tier);
  errors.push(...validatePlaybooks());
  errors.push(...validateGitWorkflow());
  errors.push(...validateDelivery());
  errors.push(...validateOrchestration());
  return errors;
}

export { tierObligations, profileObligations };
