// Task x Profile x Stage x Skill routing. Pure functions; safe in browser and Node.
import {
  TYPES, STACKS, ADDONS, PROFILES, PROFILE_IDS, PROFILE_CONFLICTS,
  TASKS, TASK_IDS, STAGES, STAGE_IDS, TIERS, SKILLS, SKILL_IDS, ROUTE_SOPS, DEFAULT_STACK, EVIDENCE_KINDS
} from "./catalog.mjs";

const byId = (arr, id) => arr.find(x => x.id === id);
const uniq = arr => [...new Set(arr)];

export function resolveProfiles({ type, stack, addons = [] }) {
  const warnings = [];
  if (!Object.hasOwn(TYPES, type)) throw new Error("Unknown project type: " + type);
  const chosenStack = stack ? byId(STACKS, stack) : null;
  if (stack && !chosenStack) throw new Error("Unknown stack: " + stack);
  if (chosenStack && !chosenStack.appliesTo.includes(type))
    throw new Error("Stack " + stack + " does not apply to " + type);

  const base = chosenStack ? chosenStack.profiles : TYPES[type].profiles;
  const addonProfiles = addons.flatMap(id => {
    const addon = byId(ADDONS, id);
    if (!addon) throw new Error("Unknown addon: " + id);
    if (addon.appliesTo && !addon.appliesTo.includes(type))
      throw new Error("Addon " + id + " does not apply to " + type);
    return addon.profiles;
  });
  const profiles = uniq([...base, ...addonProfiles]);

  for (const [a, b] of PROFILE_CONFLICTS) {
    if (profiles.includes(a) && profiles.includes(b))
      warnings.push("Profile conflict: " + a + " and " + b + " both selected; choose one primary stack");
  }
  if (addons.includes("rag") && !addons.includes("ai-application"))
    warnings.push("rag implies ai-application (added automatically)");
  if (addons.includes("agent") && !addons.includes("ai-application"))
    warnings.push("agent implies ai-application (added automatically)");

  const unknown = profiles.filter(p => !PROFILE_IDS.includes(p));
  if (unknown.length) throw new Error("Unknown profile(s): " + unknown.join(", "));
  return { profiles, warnings };
}

export function skillClosure(ids) {
  const out = [];
  const visit = (id, stack) => {
    if (!SKILL_IDS.includes(id)) throw new Error("Unknown skill: " + id);
    if (stack.includes(id)) throw new Error("Skill dependency cycle: " + [...stack, id].join(" -> "));
    if (out.includes(id)) return;
    const skill = byId(SKILLS, id);
    for (const dep of skill.dependencies ?? []) visit(dep, [...stack, id]);
    out.push(id);
  };
  for (const id of ids) visit(id, []);
  return out;
}

export function tierObligations(tier) {
  if (!Object.hasOwn(TIERS, tier)) throw new Error("Unknown tier: " + tier);
  return TIERS[tier];
}

export function profileObligations(profiles) {
  const merged = { artifacts: [], practices: [], tests: [], verification: [], security: [], release: [], recommended: [] };
  for (const id of profiles) {
    const profile = byId(PROFILES, id);
    if (!profile) throw new Error("Unknown profile: " + id);
    for (const key of ["artifacts", "practices", "tests", "verification", "security", "release"])
      merged[key].push(...profile.required[key]);
    merged.recommended.push(...profile.recommended);
  }
  for (const key of Object.keys(merged)) merged[key] = uniq(merged[key]);
  return merged;
}

// Where a task-level evidence kind is normally proven.
const KIND_STAGES = Object.freeze({
  test: ["implementation", "verification"],
  eval: ["verification"],
  "integration-probe": ["implementation", "verification"],
  "manual-probe": ["discovery", "verification", "operation"],
  receipt: ["verification", "release", "operation"],
  review: ["architecture", "review", "release"],
  "doc-update": ["intake", "discovery", "specification", "planning", "verification", "postmortem"],
  adr: ["architecture"]
});

const AI_PROFILES = ["ai-application", "rag", "agent"];
const ENTERPRISE_PROFILES = ["saas", "enterprise", "backend"];
const DEVICE_PROFILES = ["mini-program", "mobile", "android", "ios", "flutter", "react-native"];

function addKinds(set, kinds) {
  for (const kind of kinds) if (EVIDENCE_KINDS.includes(kind)) set.add(kind);
}

// Derive REQUIRED / RECOMMENDED / OPTIONAL / NOT_APPLICABLE per routed stage.
// Safety obligations survive Tier C/D; existing projects are never weakened.
export function evidencePlanFor(route) {
  const task = route.task?.id ?? route.task;
  const tier = route.tier?.id ?? route.tier;
  const mode = route.mode ?? "new";
  const profiles = new Set(route.profiles ?? []);
  const stages = route.stages ?? [];
  if (!stages.length) return { stages: {}, context: "UNKNOWN" };

  const taskDef = byId(TASKS, task) ?? { evidence: [], optionalEvidence: [] };
  const isAI = AI_PROFILES.some(p => profiles.has(p));
  const isEnterprise = ENTERPRISE_PROFILES.some(p => profiles.has(p));
  const isDevice = DEVICE_PROFILES.some(p => profiles.has(p));
  const existing = mode === "existing";
  const demote = (tier === "C" || tier === "D") && !existing;
  const routeStageIds = new Set(stages.map(s => s.id));
  const firstStage = stages[0].id;

  const planned = {};
  for (const stage of stages) {
    const candidate = [...(stage.evidence ?? STAGES.find(s => s.id === stage.id)?.evidence ?? [])];
    const required = new Set();
    const recommended = new Set();
    const rationale = {};

    for (const kind of taskDef.evidence ?? []) {
      const targets = KIND_STAGES[kind] ?? [];
      const applies = targets.includes(stage.id) ||
        (!targets.some(t => routeStageIds.has(t)) && stage.id === firstStage);
      if (applies) { required.add(kind); rationale[kind] = "task-required"; }
    }
    for (const kind of taskDef.optionalEvidence ?? []) {
      if ((KIND_STAGES[kind] ?? []).includes(stage.id)) {
        recommended.add(kind); rationale[kind] = "task-recommended";
      }
    }

    if (stage.id === "verification" && isAI) { required.add("eval"); rationale.eval = "profile:ai"; }
    if (stage.id === "verification" && isEnterprise) {
      required.add("integration-probe"); rationale["integration-probe"] = "profile:enterprise";
    }
    if (stage.id === "verification" && isDevice) {
      required.add("manual-probe"); rationale["manual-probe"] = "profile:device";
    }
    if (stage.id === "release") { required.add("receipt"); rationale.receipt = "stage:release"; }
    if (task === "security" && stage.id === "review") {
      required.add("review"); rationale.review = "task:security";
    }
    if (task === "migration" && stage.id === "verification") {
      required.add("integration-probe"); rationale["integration-probe"] = "task:migration";
    }
    if (task === "migration" && stage.id === "release") {
      required.add("receipt"); rationale.receipt = "task:migration";
    }

    if (demote) {
      for (const kind of [...required]) {
        const protectedKind =
          (task === "security" && ["review", "test"].includes(kind)) ||
          (stage.id === "release" && kind === "receipt") ||
          (task === "migration" && ["integration-probe", "receipt"].includes(kind)) ||
          (isAI && kind === "eval") ||
          (isEnterprise && kind === "integration-probe") ||
          (isDevice && kind === "manual-probe");
        if (!protectedKind) {
          required.delete(kind);
          recommended.add(kind);
          rationale[kind] = "tier-demoted";
        }
      }
    }

    const optional = new Set(candidate.filter(k => !required.has(k) && !recommended.has(k)));
    const notApplicable = EVIDENCE_KINDS.filter(
      k => !candidate.includes(k) && !required.has(k) && !recommended.has(k)
    );

    planned[stage.id] = {
      required: [...required],
      recommended: [...recommended],
      optional: [...optional],
      notApplicable,
      rationale,
      context: "KNOWN"
    };
  }

  const stagesWithPlan = stages.map(s => ({ ...s, evidencePlan: planned[s.id] }));
  return {
    stages: planned,
    stageList: stagesWithPlan,
    context: "KNOWN",
    task, tier, mode,
    notes: [
      "Required evidence is derived from task, type/profile, tier and stage; it is not the full catalog list.",
      "Tier C/D may demote non-safety obligations, but never existing-project safety duties.",
      "Missing context keeps a stage NOT_RUN/UNKNOWN instead of promoting it."
    ]
  };
}

export function requiredEvidenceByStage(plan) {
  const map = {};
  for (const stage of plan?.stages ?? []) {
    const required = stage.evidencePlan?.required;
    if (Array.isArray(required)) map[stage.id] = required;
  }
  return map;
}

export function routeForTask(taskId) {
  const task = byId(TASKS, taskId);
  if (!task) throw new Error("Unknown task type: " + taskId);
  return task;
}

export function routeSopFor(type) {
  if (!Object.hasOwn(ROUTE_SOPS, type)) throw new Error("Unknown route SOP: " + type);
  return ROUTE_SOPS[type];
}

export function composeRoute(input = {}) {
  const type = Object.hasOwn(TYPES, input.type) ? input.type : "mini-program";
  const tierId = Object.hasOwn(TIERS, input.tier) ? input.tier : "B";
  const mode = input.mode === "existing" ? "existing" : "new";
  const task = routeForTask(input.task ?? "feature");
  const stack = input.stack ?? DEFAULT_STACK[type] ?? null;
  const { profiles, warnings } = resolveProfiles({ type, stack, addons: input.addons ?? [] });
  const tier = tierObligations(tierId);

  const required = new Set(task.stages);
  const ordered = [...task.stages];
  if (mode === "existing" && !required.has("discovery")) ordered.unshift("discovery");
  if (mode === "existing" && !required.has("intake")) ordered.unshift("intake");

  const stages = ordered.map((id, i) => {
    const stage = byId(STAGES, id);
    if (!stage) throw new Error("Unknown stage in task route: " + id);
    const optional = (tierId === "C" || tierId === "D") &&
      ["specification", "architecture"].includes(id) && task.id === "feature";
    return {
      id: stage.id, index: i + 1, name: stage.name, en: stage.en,
      goal: stage.goal, deliverable: stage.deliverable, gate: stage.gate,
      focus: task.focus?.[id] ?? stage.goal,
      inputs: [...stage.inputs], outputs: [...stage.outputs],
      agentOps: [...stage.agentOps], stopWhen: [...stage.stopWhen],
      evidence: [...stage.evidence],
      role: optional ? "optional" : "required",
      optionalReason: optional ? "Tier " + tierId + " 可裁剪；跳过需记录理由" : null,
      state: "NOT_RUN"
    };
  });

  const skipped = STAGE_IDS.filter(id => !ordered.includes(id)).map(id => ({
    id, reason: "任务路线 " + task.id + " 不包含该阶段"
  }));

  const stageSkillIds = stages.flatMap(s => {
    const stage = byId(STAGES, s.id);
    return [...stage.requiredSkills, ...stage.recommendedSkills];
  });
  const requestedSkills = uniq([...task.skills, ...stageSkillIds]);
  const skills = skillClosure(requestedSkills).map(id => {
    const required = stages.some(s => byId(STAGES, s.id).requiredSkills.includes(id));
    const recommended = !required &&
      (stages.some(s => byId(STAGES, s.id).recommendedSkills.includes(id)) || task.skills.includes(id));
    return {
      id, required, recommended,
      dependencies: byId(SKILLS, id).dependencies ?? [],
      status: "CANDIDATE", installed: false
    };
  });

  const evidence = uniq([...task.evidence, ...stages.flatMap(s => s.evidence)]);
  const plan = evidencePlanFor({ task: task.id, type, tier: tierId, mode, profiles, stages });
  const plannedStages = plan.stageList ?? stages;

  return {
    task: { id: task.id, name: task.name, notes: task.notes, stages: task.stages },
    type, tier: { id: tierId, ...tier }, mode, stack,
    profiles, profileObligations: profileObligations(profiles),
    routeSop: ROUTE_SOPS[type],
    stages: plannedStages, skipped, skills, evidence, evidencePlan: plan,
    warnings,
    status: "GENERATED_NOT_EXECUTED"
  };
}

export function validateRoute(route) {
  const errors = [];
  if (!route || route.status !== "GENERATED_NOT_EXECUTED") errors.push("route status must be GENERATED_NOT_EXECUTED");
  if (!TASK_IDS.includes(route?.task?.id)) errors.push("unknown task");
  if (!route?.stages?.length) errors.push("route has no stages");
  if (!route?.routeSop || route.routeSop.id !== route.type) errors.push("route SOP missing or mismatched");
  for (const stage of route?.stages ?? []) {
    if (!STAGE_IDS.includes(stage.id)) errors.push("unknown stage " + stage.id);
    if (stage.state !== "NOT_RUN") errors.push("stage " + stage.id + " must start NOT_RUN");
  }
  for (const skill of route?.skills ?? []) {
    if (!SKILL_IDS.includes(skill.id)) errors.push("unknown skill " + skill.id);
    if (skill.installed !== false) errors.push("skill " + skill.id + " must start uninstalled");
  }
  for (const profile of route?.profiles ?? [])
    if (!PROFILE_IDS.includes(profile)) errors.push("unknown profile " + profile);
  return errors;
}

export function stageSkillIds(stageId) {
  const stage = byId(STAGES, stageId);
  if (!stage) throw new Error("Unknown lifecycle stage: " + stageId);
  return uniq([...stage.requiredSkills, ...stage.recommendedSkills]);
}
