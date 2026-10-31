import {readFile,stat} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {resolve,dirname} from "node:path";
import {validateCatalog} from "../src/engine.mjs";
import {PROFILES,TASKS,SKILLS,STAGES} from "../src/catalog.mjs";
const base=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const failures=validateCatalog();
const html=await readFile(resolve(base,"index.html"),"utf-8");
const essential=[
  "route-grid","project-name","project-description","project-agent","project-stack","project-task",
  "addon-list","stage-list","stage-inspector","init-command","download-md","download-json",
  "skills-grid","skill-search","skill-agent","skill-install-command","download-starter",
  "baseline-file","baseline-state","workflow-tabs","workflow-body",
  "workspace-files","workspace-preview","download-workspace-file","download-bundle",
  "evidence-body","install-command","copy-install","build-marker"
];
for(const id of essential) if(!html.includes('id="'+id+'"'))failures.push("missing DOM id "+id);
const required=[
  "styles.css","src/catalog.mjs","src/routing.mjs","src/engine.mjs","src/app.mjs",
  "src/install-contract.mjs","src/starter.mjs","src/baseline.mjs","src/handoff.mjs",
  "src/workspace.mjs","src/evidence.mjs","src/identity.mjs","src/evidence-identity.mjs",
  "tools/project-probe.mjs","tools/skill-kit.mjs","tools/xeng.mjs",
  "README.md","docs/ARCHITECTURE.md","docs/MIGRATION.md","docs/AGENT_SKILL_LOAD.md",
  "migration/eng-os-split-20261031.json"
];
for(const file of required){
  try{if(!(await stat(resolve(base,file))).isFile())failures.push("missing "+file);}
  catch{failures.push("missing "+file);}
}
for(const skill of SKILLS){
  try{if(!(await stat(resolve(base,skill.bundle,"SKILL.md"))).isFile())failures.push("missing bundle "+skill.id);}
  catch{failures.push("missing bundle "+skill.id);}
}
if(/(github_pat_|ghp_[A-Za-z0-9]{20}|sk-[a-zA-Z0-9]{20})/.test(html))failures.push("potential secret in HTML");
if(/python\s+tools\/xeng\.py/.test(html))failures.push("legacy Python CLI referenced in UI");
if(/--source\s+\.\.\/X-SuperPlay-AI-Engineering-OS/.test(html))failures.push("legacy private source flag referenced in UI");
if(failures.length){console.error(failures.join("\n"));process.exitCode=1;}
else console.log("CHECK PASS: "+STAGES.length+" stages, "+TASKS.length+" tasks, "+PROFILES.length+" profiles, "+SKILLS.length+" candidates, expected UI");
