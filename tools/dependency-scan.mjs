#!/usr/bin/env node
// Read-only scan for runtime dependencies on the retiring private repositories.
// Historical provenance is allowed in an explicit allowlist; anything else is active.
import {readdir,readFile} from "node:fs/promises";
import {resolve,dirname,join,relative,sep,extname} from "node:path";
import {fileURLToPath} from "node:url";

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const SKIP_DIRS=new Set([".git","node_modules","dist",".claude",".agents",".opencode",".x-superplay"]);
const EXTS=new Set([".mjs",".js",".html",".json",".md",".yml",".yaml",".css"]);

const PATTERNS=[
  {id:"legacy-python-cli",severity:"ACTIVE",rx:/python\s+tools\/xeng\.py|tools\/xeng\.py/g,
   meaning:"Python xeng CLI from the private source"},
  {id:"legacy-source-flag",severity:"ACTIVE",rx:/--source\s+(?:\.\.\/|\S*X-SuperPlay-AI-Engineering-OS)\S*/g,
   meaning:"Skill Kit reading from a private source clone"},
  {id:"legacy-relative-repo",severity:"ACTIVE",rx:/\.\.\/X-SuperPlay-AI-Engineering-OS/g,
   meaning:"relative path into the private source clone"},
  {id:"legacy-acknowledge-flag",severity:"ACTIVE",rx:/--acknowledge-relative-links/g,
   meaning:"old escape hatch for unresolved skill links"},
  {id:"legacy-skill-path",severity:"HISTORICAL",rx:/05-skills\/[A-Za-z0-9_-]+/g,
   meaning:"historical source path recorded as provenance"},
  {id:"historical-repository",severity:"HISTORICAL",rx:/X-SuperPlay-AI-Engineering-OS|AI-Native-Work-Learning-OS/g,
   meaning:"repository name used as historical or governance reference"}
];

const HISTORICAL_FILES=new Set([
  "src/catalog.mjs","README.md","docs/MIGRATION.md","docs/ARCHITECTURE.md",
  "migration/eng-os-split-20261031.json"
]);
const HISTORICAL_PREFIXES=["test/","migration/"];

async function walk(dir){
  const out=[];
  let entries=[];
  try{entries=await readdir(dir,{withFileTypes:true});}catch{return out;}
  for(const entry of entries.sort((a,b)=>a.name.localeCompare(b.name))){
    if(entry.name.startsWith(".")&&SKIP_DIRS.has(entry.name))continue;
    const abs=join(dir,entry.name);
    if(entry.isDirectory()){if(!SKIP_DIRS.has(entry.name))out.push(...await walk(abs));}
    else if(entry.isFile()&&(EXTS.has(extname(entry.name))||entry.name==="package.json"))out.push(abs);
  }
  return out;
}

function isHistorical(file,id){
  if(HISTORICAL_FILES.has(file))return true;
  if(HISTORICAL_PREFIXES.some(p=>file.startsWith(p)))return true;
  return false;
}

export async function scan(root=ROOT){
  const findings=[];
  for(const abs of await walk(root)){
    const file=relative(root,abs).split(sep).join("/");
    if(file==="tools/dependency-scan.mjs")continue;
    const text=await readFile(abs,"utf8");
    const lines=text.split(/\r?\n/);
    for(let i=0;i<lines.length;i++){
      for(const pattern of PATTERNS){
        pattern.rx.lastIndex=0;
        let m;
        while((m=pattern.rx.exec(lines[i]))){
          const severity=pattern.severity==="ACTIVE"&&!isHistorical(file,pattern.id)?"ACTIVE":"HISTORICAL";
          findings.push({file,line:i+1,id:pattern.id,severity,meaning:pattern.meaning,text:m[0]});
          if(!pattern.rx.global)break;
        }
      }
    }
  }
  const active=findings.filter(f=>f.severity==="ACTIVE");
  const historical=findings.filter(f=>f.severity==="HISTORICAL");
  return {
    status:active.length?"FAIL_ACTIVE_DEPENDENCY":"PASS_NO_ACTIVE_DEPENDENCY",
    scanned_root:root,
    active_count:active.length,
    historical_count:historical.length,
    active,
    historical
  };
}

export async function main(argv=process.argv.slice(2)){
  const json=argv.includes("--json");
  const report=await scan();
  if(json)console.log(JSON.stringify(report,null,2));
  else{
    console.log("Active dependencies on retiring repositories: "+report.active_count);
    for(const f of report.active)console.log("  ACTIVE  "+f.file+":"+f.line+"  "+f.id+"  "+f.text);
    console.log("Historical / reference occurrences: "+report.historical_count);
    for(const f of report.historical.slice(0,20))console.log("  HIST    "+f.file+":"+f.line+"  "+f.id);
    console.log(report.status);
  }
  return report.active_count?1:0;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  main().then(code=>{process.exitCode=code;}).catch(e=>{console.error("ERROR: "+e.message);process.exitCode=2;});
}
