import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,rmSync,symlinkSync} from "node:fs";
import {createHash} from "node:crypto";
import {tmpdir} from "node:os";
import {join,dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {selectedSkills,skillInstallContract,skillKitCommand,resolveSkillDependencies} from "../src/install-contract.mjs";
import {run,readSkillBundle} from "../tools/skill-kit.mjs";
import {assemble} from "../src/engine.mjs";
import {PROVENANCE} from "../src/catalog.mjs";

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const hash=b=>createHash("sha256").update(b).digest("hex");

function withTarget(fn){
  const target=mkdtempSync(join(tmpdir(),"workbench-kit-"));
  try{return fn(target);}finally{rmSync(target,{recursive:true,force:true});}
}
const args=(target,skills="verification")=>["install","--target",target,"--agent","codex","--skills",skills];
const installed=(target,skill="verification",file="SKILL.md")=>join(target,".agents","skills",skill,file);
const lockPath=target=>join(target,".x-superplay","skill-kit.lock.json");

test("restrict skill names and agent destinations",()=>{
  assert.deepEqual(selectedSkills("verification,code-review,verification"),["verification","code-review"]);
  assert.throws(()=>selectedSkills("verification,../../evil"),/Unknown skill/);
  assert.throws(()=>selectedSkills(""),/--skills/);
  assert.equal(skillInstallContract({agent:"codex",skills:"verification"}).directory,".agents/skills");
  assert.equal(skillInstallContract({agent:"claude-code",skills:"verification"}).directory,".claude/skills");
  assert.equal(skillInstallContract({agent:"opencode",skills:"verification"}).directory,".opencode/skills");
  assert.throws(()=>skillInstallContract({agent:"other",skills:"verification"}),/Unsupported/);
});
test("dependency closure installs prerequisites first",()=>{
  assert.deepEqual(resolveSkillDependencies("implementation-plan"),["specification","implementation-plan"]);
  assert.deepEqual(resolveSkillDependencies("code-review"),["verification","code-review"]);
});
test("CLI help and missing args cannot write",()=>{
  const help=spawnSync(process.execPath,["tools/skill-kit.mjs","--help"],{encoding:"utf8"});
  assert.equal(help.status,0,help.stderr);assert.match(help.stdout,/dry-run/i);
  const bad=spawnSync(process.execPath,["tools/skill-kit.mjs","--apply","--skills","verification"],{encoding:"utf8"});
  assert.equal(bad.status,1);assert.match(bad.stderr,/Missing --target/);
});
test("the legacy private-source flag is rejected",()=>withTarget(target=>{
  const r=spawnSync(process.execPath,["tools/skill-kit.mjs","install","--target",target,"--agent","codex","--skills","verification","--source","../X-SuperPlay-AI-Engineering-OS"],{encoding:"utf8"});
  assert.equal(r.status,1);
  assert.match(r.stderr,/Unknown option: --source/);
}));
test("browser generated command is dry run and bundled",()=>{
  const cmd=skillKitCommand(assemble({type:"saas",agent:"codex"}));
  assert.match(cmd,/node tools\/skill-kit\.mjs install --target \.\.\//);
  assert.match(cmd,/--agent codex/);assert.match(cmd,/--skills project-discovery/);
  assert.ok(!cmd.includes("--apply"));assert.ok(!cmd.includes("--source"));
});
test("dry-run, install, verify, update, uninstall and rollback",()=>withTarget(target=>{
  const dry=run(args(target),{silent:true});
  assert.equal(dry.status,"DRY_RUN");
  assert.equal(dry.skills[0].skill,"verification");
  assert.equal(existsSync(installed(target)),false);
  assert.equal(existsSync(lockPath(target)),false);

  assert.throws(()=>run([...args(target),"--apply"],{silent:true}),/confirm-reviewed/);
  const apply=run([...args(target),"--apply","--confirm-reviewed"],{silent:true});
  assert.equal(apply.status,"FILES_INSTALLED_NOT_TESTED");
  assert.ok(existsSync(installed(target)));
  assert.ok(existsSync(installed(target,"verification","references/evidence-block.md")));
  assert.ok(existsSync(join(target,apply.receipt)));
  const lock=JSON.parse(readFileSync(lockPath(target),"utf8"));
  assert.equal(lock.schemaVersion,2);
  assert.equal(lock.managed.length,1);
  assert.equal(lock.managed[0].files.length,2);
  assert.equal(lock.managed[0].bundleSha256.length,64);
  assert.equal(lock.historicalProvenance.repository,PROVENANCE.repository);

  assert.equal(run(["verify","--target",target],{silent:true}).status,"VERIFIED_UNCHANGED");
  assert.equal(run(["update","--target",target],{silent:true}).status,"UP_TO_DATE");
  assert.equal(run(args(target),{silent:true}).skills[0].alreadyManaged,true);
  assert.throws(()=>run([...args(target),"--apply","--confirm-reviewed"],{silent:true}),/Already managed/);

  const uninstall=["uninstall","--target",target,"--agent","codex","--skills","verification","--apply","--confirm-reviewed"];
  const removed=run(uninstall,{silent:true});
  assert.equal(removed.status,"FILES_UNINSTALLED");
  assert.equal(existsSync(installed(target)),false);
  assert.equal(JSON.parse(readFileSync(lockPath(target),"utf8")).managed.length,0);

  const rolled=run(["rollback","--target",target,"--receipt",removed.receipt,"--apply","--confirm-reviewed"],{silent:true});
  assert.equal(rolled.status,"ROLLED_BACK");
  assert.ok(existsSync(installed(target)));
  assert.equal(JSON.parse(readFileSync(lockPath(target),"utf8")).managed.length,1);
}));
test("installing a dependent skill installs its prerequisite",()=>withTarget(target=>{
  const out=run(args(target,"implementation-plan"),{silent:true});
  assert.deepEqual(out.skills.map(s=>s.skill).sort(),["implementation-plan","specification"]);
  run([...args(target,"implementation-plan"),"--apply","--confirm-reviewed"],{silent:true});
  assert.ok(existsSync(installed(target,"specification")));
  assert.ok(existsSync(installed(target,"implementation-plan")));
}));
test("modified managed files block update and uninstall",()=>withTarget(target=>{
  run([...args(target),"--apply","--confirm-reviewed"],{silent:true});
  writeFileSync(installed(target),"user edit");
  assert.equal(run(["verify","--target",target],{silent:true}).status,"DRIFT_DETECTED");
  assert.throws(()=>run(["update","--target",target,"--apply","--confirm-reviewed"],{silent:true}),/Refuse to update modified/);
  assert.throws(()=>run(["uninstall","--target",target,"--apply","--confirm-reviewed"],{silent:true}),/Refuse to uninstall modified/);
  assert.equal(readFileSync(installed(target),"utf8"),"user edit");
}));
test("preexisting files cannot be overwritten",()=>withTarget(target=>{
  mkdirSync(dirname(installed(target)),{recursive:true});
  writeFileSync(installed(target),"original");
  assert.throws(()=>run([...args(target),"--apply","--confirm-reviewed"],{silent:true}),/Overwrite forbidden/);
  assert.equal(readFileSync(installed(target),"utf8"),"original");
  assert.equal(existsSync(lockPath(target)),false);
}));
test("schemaVersion 1 locks are read, verified and upgraded without losing provenance",()=>withTarget(target=>{
  const content=readFileSync(join(ROOT,"skills","verification","SKILL.md"));
  mkdirSync(dirname(installed(target)),{recursive:true});
  writeFileSync(installed(target),content);
  mkdirSync(join(target,".x-superplay"),{recursive:true});
  writeFileSync(lockPath(target),JSON.stringify({
    schemaVersion:1,source:PROVENANCE.repository,
    managed:[{agent:"codex",skill:"verification",path:".agents/skills/verification/SKILL.md",
      sha256:hash(content),sourceCommit:PROVENANCE.commit}]
  },null,2));
  assert.equal(run(["verify","--target",target],{silent:true}).status,"VERIFIED_UNCHANGED");
  const out=run(["uninstall","--target",target,"--apply","--confirm-reviewed"],{silent:true});
  assert.equal(out.status,"FILES_UNINSTALLED");
  const lock=JSON.parse(readFileSync(lockPath(target),"utf8"));
  assert.equal(lock.schemaVersion,2);
  assert.equal(lock.managed.length,0);
}));
test("target symlink is rejected",{skip:process.platform==="win32"},()=>withTarget(target=>{
  mkdirSync(join(target,".agents"),{recursive:true});
  const external=mkdtempSync(join(tmpdir(),"workbench-outside-"));
  try{
    symlinkSync(external,join(target,".agents","skills"));
    assert.throws(()=>run([...args(target),"--apply","--confirm-reviewed"],{silent:true}),/Symlink destination/);
  }finally{rmSync(external,{recursive:true,force:true});}
}));
test("rollback refuses when a file changed after the receipt",()=>withTarget(target=>{
  run([...args(target),"--apply","--confirm-reviewed"],{silent:true});
  const removed=run(["uninstall","--target",target,"--apply","--confirm-reviewed"],{silent:true});
  mkdirSync(dirname(installed(target)),{recursive:true});
  writeFileSync(installed(target),"someone else's file");
  assert.throws(()=>run(["rollback","--target",target,"--receipt",removed.receipt,"--apply","--confirm-reviewed"],{silent:true}),/Rollback refused/);
}));
test("CRLF checkouts still parse skill frontmatter",()=>{
  const root=mkdtempSync(join(tmpdir(),"workbench-crlf-"));
  try{
    const dir=join(root,"verification");
    mkdirSync(dir,{recursive:true});
    const body=["---","name: verification","description: CRLF fixture","self_contained: true","---","","# Body",""].join("\r\n");
    writeFileSync(join(dir,"SKILL.md"),body);
    const bundle=readSkillBundle("verification",root);
    assert.equal(bundle.id,"verification");
    assert.ok(bundle.files.some(f=>f.path==="SKILL.md"));
  }finally{rmSync(root,{recursive:true,force:true});}
});
