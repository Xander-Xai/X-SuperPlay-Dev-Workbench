#!/usr/bin/env node
// Local-only read-only inspector: never opens .env, source files or customer data.
import {execFileSync} from "node:child_process";
import {existsSync,lstatSync,writeFileSync} from "node:fs";
import {basename,join,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {TYPES,PROFILE_IDS,TASK_IDS} from "../src/catalog.mjs";
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
const all=(root,paths)=>paths.every(p=>check(root,p));
const any=(root,paths)=>paths.some(p=>check(root,p));

const STACK_MARKERS=[
  ["flutter",["pubspec.yaml"],["app"]],
  ["react-native",["metro.config.js"],["app"]],
  ["android",["settings.gradle"],["app"]],
  ["ios",["Podfile"],["app"]],
  ["mini-native",["project.config.json"],["mini-program"]],
  ["mini-taro",["taro.config.js"],["mini-program"]],
  ["mini-taro",["config/index.js"],["mini-program"]],
  ["mini-uniapp",["manifest.json","pages.json"],["mini-program"]],
  ["mini-cloud",["cloudfunctions"],["mini-program"]]
];

function suggest(root,type,detected){
  const notes=[];
  let stack=null;
  for(const [id,paths,types] of STACK_MARKERS){
    if(!types.includes(type))continue;
    if(all(root,paths)){stack=id;break;}
  }
  if(type==="app"&&!stack&&any(root,["android","ios"]))stack="react-native";
  if(type==="mini-program"&&!stack&&check(root,"miniprogram"))stack="mini-native";
  if(type==="app"&&!stack)notes.push("未识别到 Flutter / React Native / Android / iOS 工程标记；技术路线需人工确认。");
  if(type==="mini-program"&&!stack)notes.push("未识别到原生 / Taro / uni-app / 云开发标记；技术路线需人工确认。");

  const profiles=new Set(TYPES[type].profiles);
  if(check(root,"backend"))profiles.add("backend");
  if(check(root,"frontend"))profiles.add("web");
  if(check(root,"evals"))profiles.add("ai-application");
  if(check(root,"migrations")||check(root,"alembic.ini"))profiles.add("saas");
  const suggestedProfiles=[...profiles].filter(p=>PROFILE_IDS.includes(p));

  const tasks=new Set(["feature"]);
  if(detected.includes("migrations"))tasks.add("migration");
  if(detected.includes("ci")&&!detected.includes("tests"))notes.push("检测到 CI 但没有测试目录；建议先 investigation，再补最小测试。");
  if(!detected.includes("tests"))notes.push("未检测到测试目录；任何“已完成”声明都缺少可复现证据。");
  if(!detected.includes("agent-guidance"))notes.push("未检测到 AGENTS.md / CLAUDE.md；Agent 交接前应补项目边界说明。");
  const suggestedTasks=[...tasks].filter(t=>TASK_IDS.includes(t));

  return {stack,profiles:suggestedProfiles,tasks:suggestedTasks,notes};
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
    name:basename(root),projectType:type,headSha,dirty,detected,
    suggestions:suggest(root,type,detected)
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
