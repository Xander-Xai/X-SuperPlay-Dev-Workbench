import { AGENTS, SKILLS, SKILL_IDS, RUNTIME, PROVENANCE, skillMetadata } from "./catalog.mjs";
import { skillClosure } from "./routing.mjs";

export const SKILL_DESTINATIONS = Object.freeze(Object.fromEntries(
  AGENTS.map(a => [a.id, a.skillsDir])
));

export function selectedSkills(text) {
  if (typeof text !== "string" || !text.trim()) throw new Error("--skills must list one or more skill IDs");
  const names = [...new Set(text.split(",").map(x => x.trim()))];
  const known = new Set(SKILL_IDS);
  if (!names.every(x => known.has(x)))
    throw new Error("Unknown skill in --skills: " + names.filter(x => !known.has(x)).join(", "));
  return names;
}

export function resolveSkillDependencies(text) {
  const requested = selectedSkills(text);
  return skillClosure(requested);
}

export function discoverSkills() {
  return SKILLS.map(s => ({
    id: s.id, name: s.name, description: s.description,
    stages: s.stages, version: s.version, status: s.status,
    bundle: s.bundle, dependencies: s.dependencies,
    selfContained: s.selfContained, license: s.license,
    supportedAgents: [...s.supportedAgents],
    lifecycleStage: s.lifecycle_stage,
    prerequisites: [...s.prerequisites],
    installMethod: s.installMethod,
    tests: [...s.tests],
    provenance: s.provenance,
    metadata: skillMetadata(s)
  }));
}

export function skillInstallContract({ agent, skills, bundleRoot = "skills" }) {
  if (!AGENTS.some(x => x.id === agent)) throw new Error("Unsupported agent: " + agent);
  const requested = selectedSkills(skills);
  const resolved = skillClosure(requested);
  return {
    agent,
    directory: SKILL_DESTINATIONS[agent],
    requested,
    resolved,
    source: {
      kind: "BUNDLED",
      repository: RUNTIME.name,
      bundleRoot,
      historicalProvenance: { repository: PROVENANCE.repository, commit: PROVENANCE.commit }
    },
    installState: "DRY_RUN_ONLY",
    runtime: "NOT_EXECUTED",
    license: "UNLICENSED-PROPRIETARY",
    installMethod: "node tools/skill-kit.mjs install --target <project> --agent <agent> --skills <ids>",
    skillRuntime: "NOT_EXECUTED"
  };
}

export function skillsForStage(plan, stageId) {
  if (!plan || !Array.isArray(plan.stages)) throw new TypeError("Invalid plan");
  const stage = plan.stages.find(s => s.id === stageId);
  if (!stage) throw new Error("Unknown lifecycle stage: " + stageId);
  const names = [...new Set((stage.skills ?? []).map(s => s.id))];
  if (!names.length || !names.every(id => SKILL_IDS.includes(id)))
    throw new Error("Stage has no approved candidate Skill mapping");
  return names;
}

export function skillKitCommand(plan, stageId) {
  const target = stageId ?? plan?.stages?.[0]?.id;
  const ids = resolveSkillDependencies(skillsForStage(plan, target).join(","));
  return RUNTIME.skillCli + " install --target ../" + plan.slug +
    " --agent " + plan.config.agent +
    " --skills " + ids.join(",");
}
