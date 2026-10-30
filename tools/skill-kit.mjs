#!/usr/bin/env node
// This CLI runs ONLY on a user's local machine. No network, automatic downloads or shell scripts.
import {execFileSync} from "node:child_process";
import {realpathSync,existsSync,lstatSync,mkdirSync,writeFileSync,unlinkSync} from "node:fs";
import {resolve,join,dirname,sep} from "node:path";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";
import {skillInstallContract} from "../src/install-contract.mjs";

function usage(){
  return [
    "Local Skill Kit (default: dry-run, no writes)",
    "node tools/skill-kit.mjs --source /authorized/Engineering-OS --target /your/project",
    "  --agent claude-code|codex|opencode --skills project-discovery,specification",
    "Add --apply only after inspecting the dry-run, source version and permissions.",
    "No remote fetch, no secret handling, no overwrites, no automatic execution.",
  ].join("\n");
}
function parse(args){
  if(args.includes("--help")||args.includes("-h"))return {help:true};
  const result={apply:false};
  for(let i=0;i<args.length;i++){
    const flag=args[i];
    if(flag==="--apply"){result.apply=true;continue;}
    if(!["--source","--target","--agent","--skills"].includes(flag))throw new Error("Unknown option: "+flag);
    if(!args[i+1]||args[i+1].startsWith("--"))throw new Error("Missing value for "+flag);
    const prop=flag.slice(2);
    if(Object.hasOwn(result,prop))throw new Error("Duplicate option: "+flag);
    result[prop]=args[++i];
  }
  for(const p of ["source","target","agent","skills"])
    if(!result[p])throw new Error("Missing --"+p);
  return result;
}
function git(source,...args){
  return execFileSync("git",["-C",source,...args],{
    timeout:12000,maxBuffer:1024*1024,windowsHide:true
  });
}
function noSymlinkAncestors(path,root){
  const relative=path.slice(root.length).replace(/^[/\\]/,"");
  let current=root;
  for(const piece of relative.split(/[\\/]/).filter(Boolean)){
    current=join(current,piece);
    if(existsSync(current) && lstatSync(current).isSymbolicLink())
      throw new Error("Symlink path is not allowed: "+current);
  }
}
export function run(args=process.argv.slice(2)){
  const flags=parse(args);
  if(flags.help){console.log(usage());return {help:true};}
  const contract=skillInstallContract(flags);
  const source=realpathSync(resolve(flags.source)),target=realpathSync(resolve(flags.target));
  if(source===target)throw new Error("Source and target must be different directories");
  const commit=contract.sourceCommit;
  git(source,"cat-file","-e",commit+"^{commit}");
  const names=contract.skills, entries=[];
  for(const name of names){
    const path="05-skills/"+name+"/SKILL.md";
    const scope="05-skills/"+name;
    const listing=git(source,"ls-tree","-r","--name-only",commit,scope).toString("utf8").trim().split(/\r?\n/).filter(Boolean);
    if(listing.length!==1 || listing[0]!==path)
      throw new Error(name+" has missing/extra files; this MVP only copies SKILL.md. Review dependencies manually.");
    const data=git(source,"show",commit+":"+path);
    if(data.length>256*1024)throw new Error("Skill too large: "+name);
    const content=data.toString("utf8");
    if(!content.startsWith("---\n") || !content.includes("\nname: "+name+"\n") || !/\ndescription:\s*\S/.test(content))
      throw new Error("Invalid SKILL.md frontmatter: "+name);
    const dest=resolve(target,contract.directory,name,"SKILL.md");
    if(!dest.startsWith(target+sep))throw new Error("Unsafe destination");
    noSymlinkAncestors(dirname(dest),target);
    if(existsSync(dest))throw new Error("Already exists; overwrite forbidden: "+dest);
    entries.push({name,dest,data,sha256:createHash("sha256").update(data).digest("hex")});
  }
  const summary={status:flags.apply?"APPLY_REQUESTED":"DRY_RUN",
    sourceRepository:contract.sourceRepository,sourceCommit:commit,
    target,agent:contract.agent,
    skills:entries.map(e=>({name:e.name,destination:e.dest,sha256:e.sha256,skillStatus:"candidate"})),
    verification:"FILE_INSTALL_ONLY_NO_RUNTIME_PROOF"};
  if(!flags.apply){console.log(JSON.stringify(summary,null,2));return summary;}
  const created=[];
  try{
    for(const entry of entries){
      noSymlinkAncestors(dirname(entry.dest),target);
      mkdirSync(dirname(entry.dest),{recursive:true});
      writeFileSync(entry.dest,entry.data,{flag:"wx",mode:0o644});
      created.push(entry.dest);
    }
  }catch(err){
    for(const path of created.reverse())try{unlinkSync(path);}catch{}
    throw err;
  }
  summary.status="FILES_INSTALLED_NOT_TESTED";
  console.log(JSON.stringify(summary,null,2));
  return summary;
}
if(process.argv[1] && resolve(process.argv[1])===resolve(fileURLToPath(import.meta.url))){
  try{run();}catch(err){console.error("ERROR: "+err.message);process.exitCode=1;}
}
