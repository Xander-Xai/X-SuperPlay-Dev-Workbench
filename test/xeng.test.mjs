import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {mkdtempSync,writeFileSync,readFileSync,existsSync,rmSync,appendFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const cli=(...args)=>spawnSync(process.execPath,["tools/xeng.mjs",...args],{cwd:ROOT,encoding:"utf8"});

function withTemp(fn){
  const dir=mkdtempSync(join(tmpdir(),"workbench-xeng-"));
  try{return fn(dir);}finally{rmSync(dir,{recursive:true,force:true});}
}

test("help and version are offline and non-destructive",()=>{
  const help=cli("--help");
  assert.equal(help.status,0);
  assert.match(help.stdout,/xeng init/);
  const version=cli("version");
  assert.equal(version.status,0);
  assert.match(version.stdout,/0\.2\.0/);
});

test("init --dry-run writes nothing",()=>withTemp(dir=>{
  const target=join(dir,"dry-project");
  const r=cli("init",target,"--profile","saas,web","--tier","B","--dry-run");
  assert.equal(r.status,0,r.stderr);
  assert.match(r.stdout,/dry-run complete/);
  assert.equal(existsSync(target),false);
}));

test("init creates the expected baseline without overwriting",()=>withTemp(dir=>{
  const target=join(dir,"project");
  const r=cli("init",target,"--profile","saas,web","--tier","A","--task","feature","--mode","new");
  assert.equal(r.status,0,r.stderr);
  for(const file of ["ENGINEERING_PROFILE.yaml","README.md","AGENTS.md","CLAUDE.md",".github/pull_request_template.md","docs/current-state.md",".gitignore"])
    assert.ok(existsSync(join(target,file)),file);
  assert.ok(existsSync(join(target,"tests")));
  assert.ok(existsSync(join(target,"migrations")));
  const profile=readFileSync(join(target,"ENGINEERING_PROFILE.yaml"),"utf8");
  assert.match(profile,/tier: A/);
  assert.match(profile,/profiles: \[saas, web\]/);
  assert.match(profile,/rollback_plan: required/);
  assert.match(readFileSync(join(target,"docs","current-state.md"),"utf8"),/last_verified: \d{4}-\d{2}-\d{2}/);

  const before=readFileSync(join(target,"README.md"),"utf8");
  const again=cli("init",target,"--profile","saas","--tier","B");
  assert.equal(again.status,0,again.stderr);
  assert.equal(readFileSync(join(target,"README.md"),"utf8"),before);
  assert.ok(existsSync(join(target,"README.md.suggested.md")));
}));

test("init rejects unknown profiles and invalid tiers",()=>withTemp(dir=>{
  const target=join(dir,"p");
  const bad=cli("init",target,"--profile","nope","--tier","B","--dry-run");
  assert.equal(bad.status,2);
  assert.match(bad.stderr,/unknown profile/);
  const tier=cli("init",target,"--profile","saas","--tier","Z","--dry-run");
  assert.equal(tier.status,2);
}));

test("audit reports checks as JSON and never fails on an uninitialized template",()=>withTemp(dir=>{
  const target=join(dir,"project");
  assert.equal(cli("init",target,"--profile","saas,web","--tier","A").status,0);
  const r=cli("audit",target,"--json");
  const report=JSON.parse(r.stdout);
  assert.ok(report.checks.some(c=>c.name==="security.secret_scan"));
  assert.ok(report.checks.every(c=>c.status!=="FAIL"),JSON.stringify(report.checks));
  assert.ok(["PASS","NOT_APPLICABLE"].includes(report.checks.find(c=>c.name==="security.secret_scan").status));
}));

test("audit fails on a secret-shaped assignment and names the rule",()=>withTemp(dir=>{
  const target=join(dir,"project");
  assert.equal(cli("init",target,"--profile","saas","--tier","B").status,0);
  writeFileSync(join(target,"src-config.js"),'const api_key = "abcdefghijklmnopqrstuvwx";\n');
  const r=cli("audit",target,"--json");
  const report=JSON.parse(r.stdout);
  const secret=report.checks.find(c=>c.name==="security.secret_scan");
  assert.equal(secret.status,"FAIL");
  assert.equal(secret.rule,"security.secret_scan");
  assert.equal(r.status,2);
}));

test("audit accepts a scoped, unexpired exception and rejects an expired one",()=>withTemp(dir=>{
  const target=join(dir,"project");
  assert.equal(cli("init",target,"--profile","saas","--tier","B").status,0);
  writeFileSync(join(target,"src-config.js"),'const api_key = "abcdefghijklmnopqrstuvwx";\n');
  const profile=readFileSync(join(target,"ENGINEERING_PROFILE.yaml"),"utf8")
    .replace("exceptions: []","exceptions:\n  - id: EX-1\n    rule: security.secret_scan\n    scope: src-config.js\n    reason: synthetic fixture\n    until: 2999-01-01");
  writeFileSync(join(target,"ENGINEERING_PROFILE.yaml"),profile);
  const ok=JSON.parse(cli("audit",target,"--json").stdout);
  assert.ok(ok.checks.every(c=>c.status!=="FAIL"));

  writeFileSync(join(target,"ENGINEERING_PROFILE.yaml"),profile.replace("2999-01-01","2000-01-01"));
  const expired=JSON.parse(cli("audit",target,"--json").stdout);
  assert.ok(expired.checks.some(c=>c.status==="FAIL"&&c.name.startsWith("exception.")));
}));

test("doctor detects broken relative links and dead documented scripts",()=>withTemp(dir=>{
  const target=join(dir,"project");
  assert.equal(cli("init",target,"--profile","saas","--tier","B").status,0);
  appendFileSync(join(target,"README.md"),"\n[missing](./docs/does-not-exist.md)\n");
  appendFileSync(join(target,"CLAUDE.md"),"\n~~~bash\npython tools/missing.py\n~~~\n");
  const r=cli("doctor",target);
  assert.equal(r.status,1);
  assert.match(r.stdout,/broken-link/);
  assert.match(r.stdout,/dead-path/);
}));

test("validate-registry accepts the shipped catalog and bundles",()=>{
  const r=cli("validate-registry");
  assert.equal(r.status,0,r.stdout+r.stderr);
  assert.match(r.stdout,/validate-registry: PASS/);
});

test("task prints the route for a task type",()=>{
  const r=cli("task","bug","--type=saas","--tier=B","--mode=new");
  assert.equal(r.status,0,r.stderr);
  assert.match(r.stdout,/task=bug/);
  assert.match(r.stdout,/discovery/);
  assert.match(r.stdout,/skipped:/);
});

test("unknown command exits non-zero",()=>{
  const r=cli("nope");
  assert.equal(r.status,2);
  assert.match(r.stderr,/Unknown command/);
});
