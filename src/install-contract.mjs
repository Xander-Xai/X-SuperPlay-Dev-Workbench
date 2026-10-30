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
export function skillKitCommand(plan) {
  return "node tools/skill-kit.mjs --source ../X-SuperPlay-AI-Engineering-OS"+
    " --target ../"+plan.slug+" --agent "+plan.config.agent+
    " --skills "+plan.skills.map(s=>s.id).join(",");
}
