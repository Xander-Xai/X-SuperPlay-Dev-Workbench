import test from "node:test";
import assert from "node:assert/strict";
import {execFileSync,spawnSync} from "node:child_process";
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,existsSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {normalizeBaseline,baselineSummary} from "../src/baseline.mjs";
import {probeProject} from "../tools/project-probe.mjs";
import {assemble,toManifest,toMarkdown} from "../src/engine.mjs";
import {makeStarter} from "../src/starter.mjs";
function fixture(fn){
  const root=mkdtempSync(join(tmpdir(),"workbench-probe-"));
  try{
    mkdirSync(join(root,"frontend"));mkdirSync(join(root,"backend"));mkdirSync(join(root,"backend","tests"));
    mkdirSync(join(root,".github"));mkdirSync(join(root,".github","workflows"));
    writeFileSync(join(root,"frontend","package.json"),'{"scripts":{"test":"vitest run"}}');
    writeFileSync(join(root,"backend","requirements.txt"),"pytest\n");
    writeFileSync(join(root,"CLAUDE.md"),"local rule");
    writeFileSync(join(root,".env"),"DUMMY_LOCAL_ONLY");
    execFileSync("git",["-C",root,"init","-q"]);
    execFileSync("git",["-C",root,"add","."]);
    execFileSync("git",["-C",root,"-c","user.name=Fixture","-c","user.email=fixture@example.test","commit","-qm","init"]);
    return fn(root);
  }finally{rmSync(root,{recursive:true,force:true});}
}
test("read-only probe scans metadata but never includes file content or absolute target",()=>fixture(root=>{
  const b=probeProject({target:root,type:"saas"});
  assert.equal(b.status,"READ_ONLY_DISCOVERY");
  assert.equal(b.projectType,"saas");
  assert.match(b.headSha,/^[0-9a-f]{40}$/);
  assert.equal(b.dirty,false);
  assert.ok(b.detected.includes("python"));
  assert.ok(b.detected.includes("frontend"));
  assert.ok(b.detected.includes("tests"));
  assert.ok(b.detected.includes("agent-guidance"));
  assert.ok(b.detected.includes("ci"));
  const s=JSON.stringify(b);
  assert.ok(!s.includes(root));
  assert.ok(!s.includes("DUMMY_LOCAL_ONLY"));
  assert.ok(!s.includes("local rule"));
  assert.equal(existsSync(join(root,"project-baseline.json")),false);
}));
test("dirty Git status is represented without exposing file names",()=>fixture(root=>{
  writeFileSync(join(root,".env"),"new local secret");
  const b=probeProject({target:root,type:"enterprise"});
  assert.equal(b.dirty,true);
  assert.ok(!JSON.stringify(b).includes("new local secret"));
}));
test("missing and invalid local project input is rejected",()=>{
  assert.throws(()=>probeProject({target:"/unlikely-workbench-test-missing-repo",type:"saas"}),/existing real directory/);
  assert.throws(()=>probeProject({target:".",type:"fake"}),/Unknown project type/);
  assert.throws(()=>normalizeBaseline({schemaVersion:2,kind:"LOCAL_PROJECT_BASELINE"}),/Not a supported/);
});
test("import normalization rejects mismatched routes and forged SHA",()=>{
  const raw={schemaVersion:1,kind:"LOCAL_PROJECT_BASELINE",status:"READ_ONLY_DISCOVERY",
    name:"SaaS",projectType:"saas",headSha:"b".repeat(40),dirty:false,detected:["git","python","tests"]};
  const norm=normalizeBaseline(raw);
  assert.equal(baselineSummary(norm).verification,"NOT_RUN");
  assert.throws(()=>assemble({type:"mini-program",baseline:norm}),/does not match/);
  assert.throws(()=>normalizeBaseline({...raw,headSha:"bad!"}),/Invalid Git HEAD/);
  assert.throws(()=>normalizeBaseline({...raw,detected:["auth-secret"]}),/Invalid baseline capabilities/);
  const plan=assemble({type:"saas",mode:"existing",baseline:norm});
  assert.equal(plan.config.baseline.headSha,"b".repeat(40));
  assert.equal(toManifest(plan).baseline.headSha,"b".repeat(40));
  assert.match(toMarkdown(plan),/现有工程只读基线/);
  assert.equal(makeStarter(plan).tickets[0].baseSha,"b".repeat(40));
  assert.equal(makeStarter(plan).tickets[0].evidence,"NOT_RUN");
});
test("CLI prints JSON by default, does not create output unless explicitly requested",()=>fixture(root=>{
  const cli=spawnSync(process.execPath,["tools/project-probe.mjs","--target",root,"--type","saas"],{
    encoding:"utf8"
  });
  assert.equal(cli.status,0,cli.stderr);
  const b=JSON.parse(cli.stdout);
  assert.equal(b.status,"READ_ONLY_DISCOVERY");
  assert.equal(existsSync(join(root,"project-baseline.json")),false);
}));
