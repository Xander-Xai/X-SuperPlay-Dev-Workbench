import {readFile,stat} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import {resolve,dirname} from "node:path";
import {validateCatalog} from "../src/engine.mjs";
const base=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const failures=validateCatalog();
const html=await readFile(resolve(base,"index.html"),"utf-8");
const essential=["route-grid","project-name","project-description","project-agent","project-stack",
  "addon-list","stage-list","stage-inspector","init-command","download-md","download-json",
  "skills-grid","quality-body","feedback-body","install-command","copy-install","download-starter","baseline-file","baseline-state"];
for(const id of essential) if(!html.includes('id="'+id+'"'))failures.push("missing DOM id "+id);
const required=["styles.css","src/catalog.mjs","src/engine.mjs","src/app.mjs","src/install-contract.mjs","src/starter.mjs","src/baseline.mjs","tools/project-probe.mjs","tools/skill-kit.mjs","README.md"];
for(const file of required){
  try{if(!(await stat(resolve(base,file))).isFile())failures.push("missing "+file);}
  catch{failures.push("missing "+file);}
}
if(/(github_pat_|ghp_|sk-[a-zA-Z0-9]{20})/.test(html))failures.push("potential secret in HTML");
if(failures.length){console.error(failures.join("\n"));process.exitCode=1;}
else console.log("CHECK PASS: 11 stages, 14 known Profiles, 8 candidates, expected UI");
