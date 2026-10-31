import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {mkdtempSync,writeFileSync,readFileSync,existsSync,rmSync,mkdirSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const cli=(...args)=>spawnSync(process.execPath,["tools/xeng.mjs",...args],{cwd:ROOT,encoding:"utf8",timeout:30000});

function fixture(){
  const dir=mkdtempSync(join(tmpdir(),"workbench-assemble-"));
  spawnSync("git",["init","-q",dir]);
  spawnSync("git",["-C",dir,"config","user.email","t@example.com"]);
  spawnSync("git",["-C",dir,"config","user.name","T"]);
  writeFileSync(join(dir,"README.md"),"# Existing project\n");
  spawnSync("git",["-C",dir,"add","."]);
  spawnSync("git",["-C",dir,"commit","-qm","init"]);
  return dir;
}
const runJson=(...args)=>{
  const r=cli(...args);
  let json=null;
  try{json=JSON.parse(r.stdout);}catch{}
  return {r,json};
};

test("assemble is dry-run by default and selects only route-required skills",()=>{
  const dir=fixture();
  try{
    const before=readFileSync(join(dir,"README.md"),"utf8");
    const {r,json}=runJson("assemble","--target",dir,"--type","saas","--task","feature","--tier","B","--agent","codex");
    assert.equal(r.status,0,r.stderr);
    assert.equal(json.status,"ASSEMBLY_DRY_RUN");
    assert.deepEqual(json.project.profiles,["saas","web","backend"]);
    assert.equal(json.target.dirty,false);
    assert.match(json.target.headSha,/^[0-9a-f]{40}$/);
    assert.ok(json.skills.required.includes("verification"));
    assert.ok(json.skills.required.includes("specification"));
    assert.ok(!json.skills.resolved.includes("documentation-sync"),"must not install unrelated skills");
    assert.ok(json.skills.items.every(x=>x.conflicts.length===0&&x.alreadyManaged===false));
    assert.equal(existsSync(join(dir,".agents")),false);
    assert.equal(readFileSync(join(dir,"README.md"),"utf8"),before);
    assert.equal(json.agent.runtimeLoad,"NOT_VERIFIED");
  }finally{rmSync(dir,{recursive:true,force:true});}
});

test("assemble apply refuses without confirmation, then installs without overwriting",()=>{
  const dir=fixture();
  try{
    const before=readFileSync(join(dir,"README.md"),"utf8");
    const dry=runJson("assemble","--target",dir,"--type","mini-program","--task","feature","--tier","B","--agent","claude-code","--apply");
    assert.equal(dry.r.status,2);
    assert.match(dry.r.stderr,/confirm-reviewed/);
    assert.equal(existsSync(join(dir,".claude")),false);

    const apply=runJson("assemble","--target",dir,"--type","mini-program","--task","feature","--tier","B","--agent","claude-code","--apply","--confirm-reviewed");
    assert.equal(apply.r.status,0,apply.r.stderr);
    assert.equal(apply.json.status,"ASSEMBLY_INSTALLED_NOT_TESTED");
    assert.ok(existsSync(join(dir,".claude","skills","verification","SKILL.md")));
    assert.ok(existsSync(join(dir,apply.json.receipt)));
    assert.equal(apply.json.verification.status,"VERIFIED_UNCHANGED");
    assert.equal(readFileSync(join(dir,"README.md"),"utf8"),before);

    const again=runJson("assemble","--target",dir,"--type","mini-program","--task","feature","--tier","B","--agent","claude-code","--apply","--confirm-reviewed");
    assert.equal(again.r.status,0,again.r.stderr);
    assert.equal(again.json.status,"ALREADY_MANAGED");

    const check=runJson("agent-check","--target",dir,"--agent","claude-code");
    assert.equal(check.r.status,0,check.r.stderr);
    assert.equal(check.json.status,"FILES_VERIFIED_RUNTIME_NOT_VERIFIED");
    assert.equal(check.json.runtimeLoad,"NOT_VERIFIED");
    assert.match(check.json.probeCommand,/claude/);
  }finally{rmSync(dir,{recursive:true,force:true});}
});

test("assemble refuses to overwrite a preexisting skill file",()=>{
  const dir=fixture();
  try{
    const file=join(dir,".agents","skills","verification","SKILL.md");
    mkdirSync(dirname(file),{recursive:true});
    writeFileSync(file,"user content");
    const {r}=runJson("assemble","--target",dir,"--type","saas","--task","feature","--tier","B","--agent","codex","--apply","--confirm-reviewed");
    assert.equal(r.status,2);
    assert.match(r.stderr,/Overwrite forbidden/);
    assert.equal(readFileSync(file,"utf8"),"user content");
    assert.equal(existsSync(join(dir,".x-superplay","skill-kit.lock.json")),false);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
