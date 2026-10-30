import {AGENTS,SKILLS,SOURCE} from "./catalog.mjs";

export const SKILL_DESTINATIONS=Object.freeze({
  "claude-code":".claude/skills",
  "codex":".agents/skills",
  "opencode":".opencode/skills"
});
export function selectedSkills(text) {
  if(typeof text!=="string" || !text.trim())throw new Error("--skills must list one or more skill IDs");
  const names=[...new Set(text.split(",").map(x=>x.trim()))];
  const known=new Set(SKILLS.map(x=>x.id));
  if(!names.every(x=>known.has(x)))throw new Error("Unknown skill in --skills: "+names.filter(x=>!known.has(x)).join(", "));
  return names;
}
export function skillInstallContract({agent,skills}) {
  if(!AGENTS.some(x=>x.id===agent))throw new Error("Unsupported agent: "+agent);
  const names=selectedSkills(skills);
  return {agent,directory:SKILL_DESTINATIONS[agent],skills:names,
    sourceRepository:SOURCE.repository,sourceCommit:SOURCE.commit,
    installState:"DRY_RUN_ONLY"};
}
export function skillsForStage(plan,stageId) {
  if (!plan || !Array.isArray(plan.stages)) throw new TypeError("Invalid plan");
  const stage=plan.stages.find(s=>s.id===stageId);
  if (!stage) throw new Error("Unknown lifecycle stage: "+stageId);
  const names=[...new Set(stage.skills.map(s=>s.id))];
  if (!names.length || !names.every(id=>SKILLS.some(s=>s.id===id)))
    throw new Error("Stage has no approved candidate Skill mapping");
  return names;
}
export function skillKitCommand(plan,stageId="intake") {
  const ids=skillsForStage(plan,stageId);
  return "node tools/skill-kit.mjs --source ../X-SuperPlay-AI-Engineering-OS"+
    " --target ../"+plan.slug+" --agent "+plan.config.agent+
    " --skills "+ids.join(",");
}
