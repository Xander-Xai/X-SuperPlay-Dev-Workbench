#!/usr/bin/env node
// Local-only read-only inspector: never opens .env, source files or customer data.
import {execFileSync} from "node:child_process";
import {existsSync,lstatSync,writeFileSync} from "node:fs";
import {basename,join,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {TYPES} from "../src/catalog.mjs";
import {normalizeBaseline} from "../src/baseline.mjs";
function args(argv){
  const x={};for(let i=0;i<argv.length;i++){
    const flag=argv[i];if(flag==="--help"){x.help=true;continue;}
    if(!["--target","--type","--output"].includes(flag) || !argv[i+1] || argv[i+1].startsWith("--"))
      throw Error("Usage: node tools/project-probe.mjs --target <project-dir> --type saas|enterprise|mini-program|app [--output report.json]");
    const name=flag.slice(2);if(Object.hasOwn(x,name))throw Error("Duplicate "+flag);x[name]=argv[++i];
  }
  if(!x.help&&(!x.target||!x.type))throw Error("Missing --target or --type");
  return x;
}
const git=(path,...parameters)=>execFileSync("git",["-C",path,...parameters],{
  timeout:8000,maxBuffer:1024*1024,windowsHide:true,stdio:["ignore","pipe","pipe"]
}).toString("utf8").trim();
function check(root,path){
  let current=root;
  for(const part of path.split("/")){
    current=join(current,part);
    if(!existsSync(current) || lstatSync(current).isSymbolicLink())return false;
  }
  return true;
}
export function probeProject({target,type}){
  if(!Object.hasOwn(TYPES,type))throw Error("Unknown project type: "+type);
  const root=resolve(target);
  if(!existsSync(root)||!lstatSync(root).isDirectory()||lstatSync(root).isSymbolicLink())
    throw Error("Target must be an existing real directory");
  let headSha="UNKNOWN",dirty=null;
  try{
    const gitRoot=resolve(git(root,"rev-parse","--show-toplevel"));
    if(gitRoot!==root)throw Error("Target must be the Git repository root");
    headSha=git(root,"rev-parse","HEAD");
    dirty=git(root,"status","--porcelain").length>0;
  }catch(e){
    if(e.message==="Target must be the Git repository root")throw e;
  }
  const markers=[
    ["git",".git"],["python","pyproject.toml"],["python","requirements.txt"],
    ["python","backend/requirements.txt"],["node","package.json"],
    ["frontend","frontend/package.json"],["docker","Dockerfile"],
    ["docker","docker-compose.yml"],["docker","infra/docker-compose.yml"],
    ["ci",".github/workflows"],["tests","test"],["tests","tests"],
    ["tests","backend/tests"],["migrations","alembic.ini"],
    ["migrations","backend/alembic"],["agent-guidance","AGENTS.md"],
    ["agent-guidance","CLAUDE.md"],["env-example",".env.example"]
  ];
  const detected=[...new Set(markers.filter(([,file])=>check(root,file)).map(([tag])=>tag))];
  return normalizeBaseline({
    schemaVersion:1,kind:"LOCAL_PROJECT_BASELINE",status:"READ_ONLY_DISCOVERY",
    name:basename(root),projectType:type,headSha,dirty,detected
  });
}
export function main(argv=process.argv.slice(2)){
  const opts=args(argv);
  if(opts.help){console.log("node tools/project-probe.mjs --target ../project --type saas [--output baseline.json]");return;}
  const baseline=probeProject(opts);
  const result=JSON.stringify(baseline,null,2)+"\n";
  if(opts.output){
    writeFileSync(resolve(opts.output),result,{flag:"wx",mode:0o600});
    console.log("Baseline written locally; NOT_RUN. Review before importing.");
  }else console.log(result);
  return baseline;
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{main();}catch(e){console.error("ERROR: "+e.message);process.exitCode=1;}
}
