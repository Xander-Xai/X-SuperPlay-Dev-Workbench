#!/usr/bin/env node
// Offline local Skill Kit. The published web page never runs this program.
import {execFileSync} from "node:child_process";
import {realpathSync,existsSync,lstatSync,mkdirSync,writeFileSync,readFileSync,unlinkSync,renameSync} from "node:fs";
import {resolve,join,dirname,sep} from "node:path";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";
import {skillInstallContract,selectedSkills,SKILL_DESTINATIONS} from "../src/install-contract.mjs";
import {SOURCE} from "../src/catalog.mjs";
const hash=data=>createHash("sha256").update(data).digest("hex");
const LOCK_PATH=".x-superplay/skill-kit.lock.json";
function usage(){
  return [
    "Offline Skill Kit (dry-run by default; no network access)",
    "Install preview:",
    "  node tools/skill-kit.mjs --source ../X-SuperPlay-AI-Engineering-OS --target ../project --agent codex --skills verification",
    "Install after source/license/target review: add --apply --confirm-reviewed",
    "When source SKILL.md has cross-directory references, resolve them before use.",
    "To explicitly accept unresolved references: add --acknowledge-relative-links",
    "Uninstall preview:",
    "  node tools/skill-kit.mjs --target ../project --agent codex --skills verification --uninstall",
    "Uninstall only matching managed files: add --apply --confirm-reviewed",
    "No remote fetch, no execution of Skills, no overwrite and no secret handling."
  ].join("\n");
}
function parse(args){
  if(args.includes("--help")||args.includes("-h"))return {help:true};
  const flags={apply:false,uninstall:false,confirmReviewed:false,acknowledgeLinks:false};
  for(let i=0;i<args.length;i++){
    const arg=args[i];
    if(arg==="--apply"){flags.apply=true;continue;}
    if(arg==="--uninstall"){flags.uninstall=true;continue;}
    if(arg==="--confirm-reviewed"){flags.confirmReviewed=true;continue;}
    if(arg==="--acknowledge-relative-links"){flags.acknowledgeLinks=true;continue;}
    if(!["--source","--target","--agent","--skills"].includes(arg))throw Error("Unknown option: "+arg);
    if(!args[i+1]||args[i+1].startsWith("--"))throw Error("Missing value for "+arg);
    const key=arg.slice(2);
    if(Object.hasOwn(flags,key))throw Error("Duplicate option: "+arg);
    flags[key]=args[++i];
  }
  for(const key of ["target","agent","skills",...(flags.uninstall?[]:["source"])])
    if(!flags[key])throw Error("Missing --"+key);
  if(flags.apply&&!flags.confirmReviewed)
    throw Error("--apply requires --confirm-reviewed after checking license, scope and target visibility");
  return flags;
}
function git(source,...args){
  return execFileSync("git",["-C",source,...args],{timeout:12000,maxBuffer:1024*1024,windowsHide:true});
}
function maybeStat(path){
  try{return lstatSync(path);}catch(e){if(e.code==="ENOENT")return null;throw e;}
}
function denyLinks(path,root){
  if(path!==root&&!path.startsWith(root+sep))throw Error("Path escapes target");
  const relative=path===root?"":path.slice(root.length+1);
  let current=root;
  for(const segment of relative.split(/[\\/]/).filter(Boolean)){
    current=join(current,segment);
    if(maybeStat(current)?.isSymbolicLink())throw Error("Symlink destination forbidden: "+current);
  }
}
function lockFile(target){return resolve(target,LOCK_PATH);}
function expectedPath(agent,name){return SKILL_DESTINATIONS[agent]+"/"+name+"/SKILL.md";}
function loadLock(target){
  const file=lockFile(target);
  denyLinks(file,target);
  if(!existsSync(file))return {schemaVersion:1,source:SOURCE.repository,managed:[]};
  const lock=JSON.parse(readFileSync(file,"utf8"));
  if(lock?.schemaVersion!==1||lock?.source!==SOURCE.repository||!Array.isArray(lock.managed))
    throw Error("Invalid or foreign lockfile");
  const keys=new Set();
  for(const row of lock.managed){
    if(!Object.hasOwn(SKILL_DESTINATIONS,row.agent)||!selectedSkills(row.skill).includes(row.skill)
       ||row.path!==expectedPath(row.agent,row.skill)
       ||!/^[a-f0-9]{64}$/.test(row.sha256)
       ||!Object.hasOwn(row,"sourceCommit"))throw Error("Invalid lock record");
    const key=row.agent+":"+row.skill;
    if(keys.has(key))throw Error("Duplicate lock record");keys.add(key);
  }
  return lock;
}
function writeLock(target,lock){
  const file=lockFile(target);denyLinks(file,target);
  mkdirSync(dirname(file),{recursive:true});
  const temp=file+".tmp-"+process.pid;
  try{
    writeFileSync(temp,JSON.stringify(lock,null,2)+"\n",{flag:"wx",mode:0o600});
    if(maybeStat(file)?.isSymbolicLink())throw Error("Lockfile is a symlink");
    renameSync(temp,file);
  }catch(e){if(existsSync(temp))unlinkSync(temp);throw e;}
}
function getSourceSkill(source,commit,name){
  const path="05-skills/"+name+"/SKILL.md";
  const listing=git(source,"ls-tree","-r","--name-only",commit,"05-skills/"+name)
    .toString("utf8").trim().split(/\r?\n/).filter(Boolean);
  if(listing.length!==1||listing[0]!==path)
    throw Error(name+": unsupported bundle layout; review all assets before installation");
  const obj=git(source,"ls-tree",commit,path).toString("utf8");
  if(!/^100644 blob [0-9a-f]{40}\t/.test(obj))
    throw Error(name+": SKILL.md must be a regular git blob, not symlink");
  const data=git(source,"show",commit+":"+path);
  if(data.length>256*1024)throw Error("Skill exceeds size limit: "+name);
  const content=data.toString("utf8");
  if(!content.startsWith("---\n")||!content.includes("\nname: "+name+"\n")
     ||!/\ndescription:\s*\S/.test(content))
    throw Error("Invalid SKILL.md frontmatter: "+name);
  const warnings=[];
  if(/\]\(\.\.\/|\]\(\.\.\\/.test(content))
    warnings.push("Relative links to source repository may not resolve after installation");
  return {name,data,sha256:hash(data),warnings};
}
export function run(args=process.argv.slice(2),internal={}){
  const flags=parse(args);
  if(flags.help){if(!internal.silent)console.log(usage());return {help:true};}
  const target=realpathSync(resolve(flags.target));
  const names=selectedSkills(flags.skills);
  if(!Object.hasOwn(SKILL_DESTINATIONS,flags.agent))
    throw Error("Unsupported agent: "+flags.agent);
  const lock=loadLock(target);
  const records=[];
  let source=null,commit=null;
  if(!flags.uninstall){
    const contract=skillInstallContract({agent:flags.agent,skills:flags.skills});
    source=realpathSync(resolve(flags.source));
    if(source===target)throw Error("Source and target must differ");
    // No CLI flag can override the source commit. Synthetic fixtures only use the in-process test hook.
    commit=internal.sourceCommit||contract.sourceCommit;
    if(!/^[0-9a-f]{40}$/.test(commit))throw Error("Invalid source commit");
    git(source,"cat-file","-e",commit+"^{commit}");
  }
  for(const name of names){
    const rel=expectedPath(flags.agent,name),dest=resolve(target,rel);
    denyLinks(dest,target);
    const matching=lock.managed.find(r=>r.agent===flags.agent&&r.skill===name);
    if(flags.uninstall){
      if(!matching)throw Error("Not managed by Skill Kit: "+rel);
      const f=maybeStat(dest);
      if(!f||!f.isFile())throw Error("Managed file missing or not regular: "+rel);
      const old=readFileSync(dest);
      if(hash(old)!==matching.sha256)throw Error("Modified file; uninstall refused: "+rel);
      records.push({name,rel,dest,data:old,sha256:matching.sha256});
    }else{
      if(matching)throw Error("Already registered: "+rel);
      if(maybeStat(dest))throw Error("File already exists; overwrite forbidden: "+rel);
      const file=getSourceSkill(source,commit,name);
      records.push({...file,rel,dest});
    }
  }
  const summary={
    status:flags.uninstall?"UNINSTALL_DRY_RUN":"DRY_RUN",
    sourceRepository:SOURCE.repository,
    sourceCommit:commit||"FROM_LOCK",
    target,agent:flags.agent,
    visibility:"NOT_VERIFIED_USER_MUST_CONFIRM",
    license:"NOT_VERIFIED_USER_MUST_CONFIRM",
    skillRuntime:"NOT_EXECUTED",
    skills:records.map(r=>({name:r.name,path:r.rel,sha256:r.sha256,warnings:r.warnings||[]}))
  };
  if(!flags.apply){if(!internal.silent)console.log(JSON.stringify(summary,null,2));return summary;}
  if(!flags.uninstall && records.some(r=>(r.warnings||[]).length) && !flags.acknowledgeLinks)
    throw Error("Source Skill has cross-directory references that are NOT installed. Review/resolve dependencies; if explicitly accepted add --acknowledge-relative-links.");
  const completed=[];
  try{
    for(const record of records){
      denyLinks(record.dest,target);
      if(flags.uninstall){
        if(hash(readFileSync(record.dest))!==record.sha256)throw Error("Changed during uninstall");
        unlinkSync(record.dest);
      }else{
        mkdirSync(dirname(record.dest),{recursive:true});
        writeFileSync(record.dest,record.data,{flag:"wx",mode:0o600});
      }
      completed.push(record);
    }
    const selected=new Set(names.map(n=>flags.agent+":"+n));
    if(flags.uninstall)lock.managed=lock.managed.filter(r=>!selected.has(r.agent+":"+r.skill));
    else lock.managed.push(...records.map(r=>({agent:flags.agent,skill:r.name,
      path:r.rel,sha256:r.sha256,sourceCommit:commit})));
    writeLock(target,lock);
  }catch(err){
    for(const record of completed.reverse()){
      try{
        if(flags.uninstall){
          if(!maybeStat(record.dest))writeFileSync(record.dest,record.data,{flag:"wx",mode:0o600});
        }else if(maybeStat(record.dest)&&hash(readFileSync(record.dest))===record.sha256)
          unlinkSync(record.dest);
      }catch{}
    }
    throw err;
  }
  summary.status=flags.uninstall?"FILES_UNINSTALLED":"FILES_INSTALLED_NOT_TESTED";
  summary.receipt=LOCK_PATH;
  if(!internal.silent)console.log(JSON.stringify(summary,null,2));
  return summary;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{run();}catch(e){console.error("ERROR: "+e.message);process.exitCode=1;}
}
