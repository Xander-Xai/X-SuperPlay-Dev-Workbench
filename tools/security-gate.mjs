import {spawnSync} from "node:child_process";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const target=process.argv[2]?resolve(process.argv[2]):root;
const result=spawnSync(process.execPath,[resolve(root,"tools","xeng.mjs"),"audit",target,"--json"],{
  cwd:root,encoding:"utf8"
});
if(!result.stdout){
  console.error("SECURITY GATE FAIL: audit produced no JSON (exit "+(result.status??"unknown")+")");
  process.exit(2);
}
let report;
try{report=JSON.parse(result.stdout);}
catch{
  console.error("SECURITY GATE FAIL: audit output was not valid JSON");
  process.exit(2);
}
const checks=report.checks.filter(c=>c.name==="security.secret_scan"||c.name==="security.secret_scan_exception");
const scan=checks.find(c=>c.name==="security.secret_scan");
if(!scan){
  console.error("SECURITY GATE FAIL: security.secret_scan check is missing");
  process.exit(2);
}
const problems=checks.filter(c=>c.status==="FAIL");
if(problems.length||scan.status!=="PASS"){
  for(const c of problems)console.error(c.name+": FAIL — "+c.detail);
  if(scan.status!=="PASS")console.error("security.secret_scan: "+scan.status+" — "+scan.detail);
  process.exit(2);
}
console.log("SECURITY GATE PASS: "+scan.detail);
