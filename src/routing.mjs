// Task x Profile x Stage x Skill routing. Pure functions; safe in browser and Node.
import {
  TYPES, STACKS, ADDONS, PROFILES, PROFILE_IDS, PROFILE_CONFLICTS,
  TASKS, TASK_IDS, STAGES, STAGE_IDS, TIERS, SKILLS, SKILL_IDS, DEFAULT_STACK
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

export function routeForTask(taskId) {
  const task = byId(TASKS, taskId);
  if (!task) throw new Error("Unknown task type: " + taskId);
  return task;
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
      status: "candidate", installed: false
    };
  });

  const evidence = uniq([...task.evidence, ...stages.flatMap(s => s.evidence)]);

  return {
    task: { id: task.id, name: task.name, notes: task.notes, stages: task.stages },
    type, tier: { id: tierId, ...tier }, mode, stack,
    profiles, profileObligations: profileObligations(profiles),
    stages, skipped, skills, evidence,
    warnings,
    status: "GENERATED_NOT_EXECUTED"
  };
}

export function validateRoute(route) {
  const errors = [];
  if (!route || route.status !== "GENERATED_NOT_EXECUTED") errors.push("route status must be GENERATED_NOT_EXECUTED");
  if (!TASK_IDS.includes(route?.task?.id)) errors.push("unknown task");
  if (!route?.stages?.length) errors.push("route has no stages");
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
