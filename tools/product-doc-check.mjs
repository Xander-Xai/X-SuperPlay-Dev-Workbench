// Local-only research document contract. No network, installation or user project execution.
import {readFile,stat} from "node:fs/promises";
import {dirname,resolve,sep} from "node:path";
import {fileURLToPath} from "node:url";
import {STAGES,SKILL_IDS} from "../src/catalog.mjs";
const BT=String.fromCharCode(96);
export const IDS=Object.freeze(["web-static","pwa","desktop","browser-extension","cli","api-sdk","automation","bot","ecosystem-plugin","mini-other","infrastructure","game","iot-embedded","xr"]);
export const BRANCHES=Object.freeze({desktop:["electron","tauri","native"],"browser-extension":["chrome","edge"],bot:["feishu","dingtalk","slack","discord"],"ecosystem-plugin":["vscode","figma","wordpress"],"mini-other":["douyin","alipay"]});
export const SCENARIOS=Object.freeze(["ai-rag-agent","commerce","community-content","data-bi"]);
const STAGE_IDS=STAGES.map(s=>s.id);
const SKILLS=new Set(SKILL_IDS);
export function validateGuide(id,markdown){
  const err=[];
  if(!IDS.includes(id))return ["unknown guide "+id];
  for(const marker of ["RESEARCH_PLACEHOLDER / NOT_RUNTIME_ROUTE / NOT_REAL_PROJECT_VERIFIED","## 02. PREFLIGHT","## 03. 权威 11 阶段","## 04. 一张最小端到端 Demo Ticket","**负例优先**","**真实平台 Gate**","NOT_RUN","https://"])
    if(!markdown.includes(marker))err.push(id+": missing "+marker);
  const rows=markdown.split("\n").filter(s=>s.startsWith("| "+BT));
  if(rows.length!==11)err.push(id+": expected 11 canonical rows, found "+rows.length);
  rows.forEach((line,i)=>{
    const cells=line.split("|").slice(1,-1).map(s=>s.trim());
    if(cells.length!==6){err.push(id+": table column count row "+i);return;}
    const stageId=cells[0].split(BT)[1];
    if(stageId!==STAGE_IDS[i])err.push(id+": stage order "+i+" got "+stageId);
    for(let k=1;k<=5;k++)if(cells[k].length<14)err.push(id+": shallow cell "+i+" "+k);
    const refs=[...cells[2].matchAll(new RegExp(BT+"([a-z-]+)"+BT,"g"))].map(m=>m[1]);
    if(!refs.length)err.push(id+": missing stage Skill "+stageId);
    for(const ref of refs)if(!SKILLS.has(ref))err.push(id+": unknown Skill "+ref);
    if(STAGES[i]&&STAGES[i].requiredSkills.length&&!STAGES[i].requiredSkills.some(x=>refs.includes(x)))
      err.push(id+": canonical required Skill missing "+stageId);
  });
  for(const host of BRANCHES[id]||[])if(!markdown.includes("platforms/"+id+"/"+host+".md"))
    err.push(id+": missing host link "+host);
  return err;
}
export function validateHost(group,host,markdown){
  if(!(BRANCHES[group]||[]).includes(host))return ["unknown host "+group+"/"+host];
  return ["PLATFORM_BRANCH_GUIDE / NOT_RUNTIME_ROUTE / NOT_REAL_PROJECT_VERIFIED","## 1. 选型前检查","## 2. 如何完成第一轮开发","## 3. 首张 Demo Ticket","## 4. 宿主官方来源","../../"+group+".md","NOT_RUN","https://"]
    .filter(s=>!markdown.includes(s)).map(s=>group+"/"+host+": missing "+s);
}
export function validateLinks(markdown,source,available){
  const errors=[];
  for(const m of markdown.matchAll(/\]\(([^)]+)\)/g)){
    const uri=m[1].split(/\s+"/)[0].trim();
    if(!uri||/^https?:\/\//.test(uri)||uri.startsWith("#")||uri.startsWith("mailto:"))continue;
    const path=uri.split("#")[0].split("?")[0];
    if(path&&!available.has(resolve(dirname(source),decodeURIComponent(path))))errors.push(source+": broken link "+uri);
  }
  return errors;
}
export async function auditProductDocs(root=resolve(dirname(fileURLToPath(import.meta.url)),"..")){
  const failures=[],files=[
    "README.md","docs/learning/START-HERE.md","docs/learning/PRODUCT-GUIDES.md","docs/ROADMAP.md",
    "docs/research/2026-11-02-product-format-scaffolding.md",
    "docs/product-types/README.md","docs/product-types/saas-walkthrough.md",
    ...IDS.map(x=>"docs/product-types/"+x+".md"),
    ...SCENARIOS.map(x=>"docs/product-types/scenarios/"+x+".md"),
    ...Object.entries(BRANCHES).flatMap(([g,hs])=>hs.map(h=>"docs/product-types/platforms/"+g+"/"+h+".md"))
  ],content=new Map();
  for(const file of files){
    const p=resolve(root,file);
    try{if(!(await stat(p)).isFile())throw Error("not file");content.set(p,await readFile(p,"utf8"));}
    catch{failures.push("missing document "+file);}
  }
  const index=content.get(resolve(root,"docs/product-types/README.md"))||"";
  if(!(content.get(resolve(root,"README.md"))||"").includes("docs/product-types/README.md"))failures.push("README lacks navigation");
  for(const id of IDS){
    const p=resolve(root,"docs/product-types/"+id+".md");
    if(content.has(p))failures.push(...validateGuide(id,content.get(p)));
    if(!index.includes("("+id+".md)"))failures.push("index missing "+id);
  }
  for(const [group,hosts] of Object.entries(BRANCHES))for(const host of hosts){
    const p=resolve(root,"docs/product-types/platforms/"+group+"/"+host+".md");
    if(content.has(p))failures.push(...validateHost(group,host,content.get(p)));
  }
  for(const id of SCENARIOS)if(!index.includes("(scenarios/"+id+".md)"))failures.push("index missing scenario "+id);
  const available=new Set(content.keys());
  for(const name of ["saas.md","enterprise.md","mini-program.md","app.md"])available.add(resolve(root,"docs/routes",name));
  available.add(resolve(root,"docs/CLI_REFERENCE.md"));
  for(const [file,body] of content)if(file.includes(sep+"docs"+sep+"product-types"+sep))
    failures.push(...validateLinks(body,file,available));
  return failures;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const problems=await auditProductDocs();
  if(problems.length){console.error(problems.join("\n"));process.exitCode=1;}
  else console.log("PRODUCT DOC CHECK PASS: 14 guides, 14 host branches, 4 scenarios, 11 canonical stages");
}
