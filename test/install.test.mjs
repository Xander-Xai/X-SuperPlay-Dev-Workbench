import test from "node:test";
import assert from "node:assert/strict";
import {execFileSync,spawnSync} from "node:child_process";
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,rmSync,symlinkSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,dirname} from "node:path";
import {selectedSkills,skillInstallContract,skillKitCommand} from "../src/install-contract.mjs";
import {run} from "../tools/skill-kit.mjs";
import {assemble} from "../src/engine.mjs";
const git=(cwd,...a)=>execFileSync("git",["-C",cwd,...a],{encoding:"utf8"});
function fixture({extra=false,content=null}={}){
  const workspace=mkdtempSync(join(tmpdir(),"workbench-kit-"));
  const source=join(workspace,"os"),target=join(workspace,"project");
  mkdirSync(source);mkdirSync(target);
  const dir=join(source,"05-skills","verification");mkdirSync(dir,{recursive:true});
  writeFileSync(join(dir,"SKILL.md"),content??"---\nname: verification\ndescription: Verify the project.\n---\n# Verification\n");
  if(extra){mkdirSync(join(dir,"references"));writeFileSync(join(dir,"references","steps.md"),"extra");}
  git(source,"init","-q");
  git(source,"add",".");
  git(source,"-c","user.name=Fixture","-c","user.email=fixture@example.test","commit","-qm","fixture");
  const sha=git(source,"rev-parse","HEAD").trim();
  const args=["--source",source,"--target",target,"--agent","codex","--skills","verification"];
  return {workspace,source,target,sha,args,installed:join(target,".agents","skills","verification","SKILL.md"),
    lock:join(target,".x-superplay","skill-kit.lock.json")};
}
function withFixture(callback,opts){
  const f=fixture(opts);
  try{return callback(f);}finally{rmSync(f.workspace,{recursive:true,force:true});}
}
test("restrict skill names and agent destinations",()=>{
  assert.deepEqual(selectedSkills("verification,code-review,verification"),["verification","code-review"]);
  assert.throws(()=>selectedSkills("verification,../../evil"),/Unknown skill/);
  assert.throws(()=>selectedSkills(""),/--skills/);
  assert.equal(skillInstallContract({agent:"codex",skills:"verification"}).directory,".agents/skills");
  assert.equal(skillInstallContract({agent:"claude-code",skills:"verification"}).directory,".claude/skills");
  assert.equal(skillInstallContract({agent:"opencode",skills:"verification"}).directory,".opencode/skills");
  assert.throws(()=>skillInstallContract({agent:"other",skills:"verification"}),/Unsupported/);
});
test("CLI help and missing args cannot write",()=>{
  const help=spawnSync(process.execPath,["tools/skill-kit.mjs","--help"],{encoding:"utf8"});
  assert.equal(help.status,0,help.stderr);assert.match(help.stdout,/dry-run/i);
  const bad=spawnSync(process.execPath,["tools/skill-kit.mjs","--apply","--skills","verification"],{encoding:"utf8"});
  assert.equal(bad.status,1);assert.match(bad.stderr,/Missing --target/);
});
test("browser generated command is dry run",()=>{
  const cmd=skillKitCommand(assemble({type:"saas",agent:"codex"}));
  assert.match(cmd,/--agent codex/);assert.match(cmd,/--skills project-discovery/);
  assert.ok(!cmd.includes("--apply"));
});
test("git fixture: dry-run, apply, lock receipt, uninstall",()=>withFixture(f=>{
  const dry=run(f.args,{sourceCommit:f.sha,silent:true});
  assert.equal(dry.status,"DRY_RUN");
  assert.equal(dry.visibility,"NOT_VERIFIED_USER_MUST_CONFIRM");
  assert.equal(existsSync(f.installed),false);
  assert.equal(existsSync(f.lock),false);
  assert.throws(()=>run([...f.args,"--apply"],{sourceCommit:f.sha,silent:true}),/confirm-reviewed/);
  const apply=run([...f.args,"--apply","--confirm-reviewed"],{sourceCommit:f.sha,silent:true});
  assert.equal(apply.status,"FILES_INSTALLED_NOT_TESTED");
  assert.equal(existsSync(f.installed),true);
  const lock=JSON.parse(readFileSync(f.lock,"utf8"));
  assert.equal(lock.managed.length,1);
  assert.equal(lock.managed[0].sourceCommit,f.sha);
  assert.throws(()=>run(f.args,{sourceCommit:f.sha,silent:true}),/Already registered/);
  const args=["--target",f.target,"--agent","codex","--skills","verification","--uninstall"];
  assert.equal(run(args,{silent:true}).status,"UNINSTALL_DRY_RUN");
  assert.equal(existsSync(f.installed),true);
  assert.equal(run([...args,"--apply","--confirm-reviewed"],{silent:true}).status,"FILES_UNINSTALLED");
  assert.equal(existsSync(f.installed),false);
  assert.equal(JSON.parse(readFileSync(f.lock,"utf8")).managed.length,0);
}));
test("modified files cannot be silently uninstalled",()=>withFixture(f=>{
  run([...f.args,"--apply","--confirm-reviewed"],{sourceCommit:f.sha,silent:true});
  writeFileSync(f.installed,"user edit");
  const args=["--target",f.target,"--agent","codex","--skills","verification","--uninstall","--apply","--confirm-reviewed"];
  assert.throws(()=>run(args,{silent:true}),/Modified file/);
  assert.equal(readFileSync(f.installed,"utf8"),"user edit");
}));
test("preexisting file cannot be overwritten",()=>withFixture(f=>{
  mkdirSync(dirname(f.installed),{recursive:true});writeFileSync(f.installed,"original");
  assert.throws(()=>run([...f.args,"--apply","--confirm-reviewed"],{sourceCommit:f.sha,silent:true}),/overwrite forbidden/);
  assert.equal(readFileSync(f.installed,"utf8"),"original");
  assert.equal(existsSync(f.lock),false);
}));
test("extra dependency assets are rejected until reviewed",()=>withFixture(f=>{
  assert.throws(()=>run(f.args,{sourceCommit:f.sha,silent:true}),/unsupported bundle layout/);
  assert.equal(existsSync(f.installed),false);
},{extra:true}));
test("invalid frontmatter is rejected",()=>withFixture(f=>{
  assert.throws(()=>run(f.args,{sourceCommit:f.sha,silent:true}),/Invalid SKILL.md/);
},{content:"plain text"}));
test("cross-directory references block apply unless explicitly acknowledged",()=>withFixture(f=>{
  const args=[...f.args,"--apply","--confirm-reviewed"];
  assert.throws(()=>run(args,{sourceCommit:f.sha,silent:true}),/cross-directory references/);
  assert.equal(existsSync(f.installed),false);
  assert.equal(existsSync(f.lock),false);
  const applied=run([...args,"--acknowledge-relative-links"],{sourceCommit:f.sha,silent:true});
  assert.equal(applied.status,"FILES_INSTALLED_NOT_TESTED");
  assert.equal(existsSync(f.installed),true);
},{content:"---\nname: verification\ndescription: Verify.\n---\n[guide](../../02-standards/testing.md)\n"}));
test("source relative links are reported",()=>withFixture(f=>{
  const p=run(f.args,{sourceCommit:f.sha,silent:true});
  assert.match(p.skills[0].warnings.join(" "),/Relative links/);
},{content:"---\nname: verification\ndescription: Verify.\n---\n[policy](../../00-governance/example.md)\n"}));
test("target symlink is rejected", {skip:process.platform==="win32"},()=>withFixture(f=>{
  mkdirSync(join(f.target,".agents"),{recursive:true});
  const external=join(f.workspace,"outside");mkdirSync(external);
  symlinkSync(external,join(f.target,".agents","skills"));
  assert.throws(()=>run(f.args,{sourceCommit:f.sha,silent:true}),/Symlink destination/);
}));
test("missing source commit never writes",()=>withFixture(f=>{
  assert.throws(()=>run(f.args,{sourceCommit:"a".repeat(40),silent:true}),/Command failed/);
  assert.equal(existsSync(f.installed),false);
}));
