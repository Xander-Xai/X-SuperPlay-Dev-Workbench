import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,rmSync,lstatSync,symlinkSync,readdirSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const cli=(...args)=>spawnSync(process.execPath,["tools/xeng.mjs",...args],{cwd:ROOT,encoding:"utf8"});
const gate=target=>spawnSync(process.execPath,["tools/security-gate.mjs",target],{cwd:ROOT,encoding:"utf8"});
// Every synthetic value is assembled at runtime so this suite never contains a
// complete credential-shaped literal.
const block="A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8";
const fakeToken=prefix=>prefix+(block.repeat(4)).slice(0,prefix==="ghp_"?120:32);

function withTemp(fn){
  const dir=mkdtempSync(join(tmpdir(),"workbench-security-"));
  try{return fn(dir);}
  finally{
    for(const p of [join(dir,"repo","docs"),join(dir,"target","docs"),join(dir,"linked-target")]){
      try{if(lstatSync(p).isSymbolicLink())rmSync(p,{force:true});}catch{}
    }
    rmSync(dir,{recursive:true,force:true});
  }
}

function makeProject(dir){
  const target=join(dir,"repo");
  mkdirSync(target,{recursive:true});
  mkdirSync(join(target,".git"),{recursive:true});
  mkdirSync(join(target,"tests"),{recursive:true});
  mkdirSync(join(target,".github","workflows"),{recursive:true});
  writeFileSync(join(target,"README.md"),"# Fixture\n");
  writeFileSync(join(target,"AGENTS.md"),"# Agents\n");
  writeFileSync(join(target,"CLAUDE.md"),"# Claude\n");
  writeFileSync(join(target,".gitignore"),".env\n*.pem\n*.key\n*.p12\n*.pfx\n");
  writeFileSync(join(target,".env.example"),"# placeholders only\n");
  writeFileSync(join(target,"tests","smoke.test.mjs"),"import test from 'node:test';\n");
  writeFileSync(join(target,".github","workflows","ci.yml"),"name: ci\non: push\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo ok\n");
  writeFileSync(join(target,"ENGINEERING_PROFILE.yaml"),"project:\n  name: fixture\n  tier: B\n  profiles: []\nexceptions: []\n");
  return target;
}

function assertNoLeak(result,secrets){
  for(const secret of secrets){
    assert.equal(result.stdout.includes(secret),false,"stdout leaked matched text");
    assert.equal(result.stderr.includes(secret),false,"stderr leaked matched text");
    assert.equal(result.stdout.includes(secret.slice(0,40)),false,"stdout leaked a partial fragment");
    assert.equal(result.stderr.includes(secret.slice(0,40)),false,"stderr leaked a partial fragment");
  }
}

function addException(target,yaml){
  const file=join(target,"ENGINEERING_PROFILE.yaml");
  writeFileSync(file,readFileSync(file,"utf8").replace("exceptions: []","exceptions:\n"+yaml));
}

test("clean project passes the secret gate",()=>withTemp(dir=>{
  const target=makeProject(dir);
  const r=cli("audit",target,"--json");
  assert.equal(r.status,0,r.stderr);
  const report=JSON.parse(r.stdout);
  const check=report.checks.find(c=>c.name==="security.secret_scan");
  assert.equal(check.status,"PASS");
  assert.match(check.detail,/no secret-shaped findings/);
  assert.equal(report.checks.some(c=>c.status==="FAIL"),false);
}));

test("GitHub PAT is reported without printing it, in human and JSON output",()=>withTemp(dir=>{
  const target=makeProject(dir);
  const secret=fakeToken("ghp_");
  writeFileSync(join(target,"config.js"),"const token = \""+secret+"\";\n");
  const human=cli("audit",target);
  assert.equal(human.status,2);
  assertNoLeak(human,[secret]);
  assert.match(human.stdout,/config\.js:1/);
  assert.match(human.stdout,/secret\.github-token/);
  assert.match(human.stdout,/match text withheld/);
  assert.doesNotMatch(human.stdout,new RegExp(secret.slice(0,12)));
  const json=cli("audit",target,"--json");
  assert.equal(json.status,2);
  assertNoLeak(json,[secret]);
  const report=JSON.parse(json.stdout);
  const check=report.checks.find(c=>c.name==="security.secret_scan");
  assert.equal(check.status,"FAIL");
  assert.equal(check.rule,"security.secret_scan");
  assert.equal(JSON.stringify(report).includes(secret),false,"JSON report leaked matched text");
}));

test("known token, cloud key, JWT, private key and URL credential shapes are all redacted",()=>withTemp(dir=>{
  const target=makeProject(dir);
  const aws="AKIA"+"ABCDEFGHIJKLMNOP";
  const gcp="AIza"+"a".repeat(35);
  const jwt="eyJ"+"a".repeat(12)+"."+"b".repeat(12)+"."+"c".repeat(12);
  const password="u5er"+"P4ss"+"w0rd"+"Zz9";
  const url="https"+"://"+"user"+":"+password+"@"+"example.test/path";
  const pemHeader="-----BEGIN "+"RSA PRIVATE KEY"+"-----";
  const pemBody="MIIE"+"Q".repeat(96);
  const openai="sk-"+"proj-"+"D".repeat(24);
  mkdirSync(join(target,"certs"));
  writeFileSync(join(target,"multi.txt"),[aws,gcp,jwt,url,pemHeader,pemBody,openai].join("\n")+"\n");
  writeFileSync(join(target,"certs","server.pem"),pemHeader+"\n"+pemBody+"\n");
  const r=cli("audit",target,"--json");
  assert.equal(r.status,2);
  assertNoLeak(r,[aws,gcp,jwt,password,pemBody,openai]);
  const report=JSON.parse(r.stdout);
  const check=report.checks.find(c=>c.name==="security.secret_scan");
  assert.equal(check.status,"FAIL");
  for(const rule of ["secret.aws-access-key","secret.gcp-api-key","secret.jwt","secret.private-key","secret.openai-token","secret.url-credential"]){
    assert.match(check.detail,new RegExp(rule.replace(/\./g,"\\.")));
  }
  assert.match(check.detail,/multi\.txt:1/);
  assert.match(check.detail,/certs\/server\.pem:1/);
  assert.doesNotMatch(check.detail,new RegExp(aws));
  assert.doesNotMatch(check.detail,new RegExp(password));
}));

test("long and repeated hits report counts only, never a prefix",()=>withTemp(dir=>{
  const target=makeProject(dir);
  const one=fakeToken("ghp_");
  const two="ghp_"+"Z".repeat(90);
  writeFileSync(join(target,"secrets.txt"),one+"\nkeep\n"+two+"\n");
  const r=cli("audit",target);
  assert.equal(r.status,2);
  assertNoLeak(r,[one,two]);
  assert.match(r.stdout,/secrets\.txt:1/);
  assert.match(r.stdout,/secrets\.txt:3/);
  assert.match(r.stdout,/secret\.github-token=2/);
  assert.match(r.stdout,/2 finding\(s\)/);
}));

test("multiple files are counted and each path is relative",()=>withTemp(dir=>{
  const target=makeProject(dir);
  const a=fakeToken("ghp_");
  const b="AKIA"+"QRSTUVWXYZABCDEF";
  mkdirSync(join(target,"nested"));
  writeFileSync(join(target,"nested","a.js"),"const token = \""+a+"\";\n");
  writeFileSync(join(target,"b.yaml"),"aws: "+b+"\n");
  const r=cli("audit",target,"--json");
  assert.equal(r.status,2);
  assertNoLeak(r,[a,b]);
  const report=JSON.parse(r.stdout);
  const check=report.checks.find(c=>c.name==="security.secret_scan");
  assert.match(check.detail,/nested\/a\.js:1/);
  assert.match(check.detail,/b\.yaml:1/);
  assert.match(check.detail,/2 file\(s\)/);
}));

test("agent configuration files are scanned",()=>withTemp(dir=>{
  const target=makeProject(dir);
  const secret=fakeToken("ghp_");
  mkdirSync(join(target,".claude"));
  writeFileSync(join(target,".claude","settings.json"),"{\"api_key\":\""+secret+"\"}\n");
  const r=cli("audit",target,"--json");
  assert.equal(r.status,2);
  assertNoLeak(r,[secret]);
  const check=JSON.parse(r.stdout).checks.find(c=>c.name==="security.secret_scan");
  assert.equal(check.status,"FAIL");
  assert.match(check.detail,/\.claude\/settings\.json:1/);
}));

test("nested agent worktree state is excluded",()=>withTemp(dir=>{
  const target=makeProject(dir);
  const secret=fakeToken("ghp_");
  mkdirSync(join(target,".claude","worktrees","wt"),{recursive:true});
  writeFileSync(join(target,".claude","worktrees","wt","config.js"),"const token = \""+secret+"\";\n");
  const r=cli("audit",target,"--json");
  assert.equal(r.status,0,r.stderr);
  assertNoLeak(r,[secret]);
  assert.equal(JSON.parse(r.stdout).checks.find(c=>c.name==="security.secret_scan").status,"PASS");
}));

test("fixture placeholders do not trigger a false positive",()=>withTemp(dir=>{
  const target=makeProject(dir);
  writeFileSync(join(target,"placeholder.js"),"const api_key = \"${API_KEY}\";\nconst token = \"short\";\nconst password = \"changeme\";\n");
  writeFileSync(join(target,".env.example"),"API_KEY=${API_KEY}\nPASSWORD=changeme\n");
  const r=cli("audit",target,"--json");
  assert.equal(r.status,0,r.stderr);
  assert.equal(JSON.parse(r.stdout).checks.find(c=>c.name==="security.secret_scan").status,"PASS");
}));

test("CRLF input reports the correct line and a forward-slash path",()=>withTemp(dir=>{
  const target=makeProject(dir);
  const secret=fakeToken("ghp_");
  mkdirSync(join(target,"nested"));
  writeFileSync(join(target,"nested","config.js"),"first\r\nsecond\r\nconst token = \""+secret+"\";\r\n");
  const r=cli("audit",target,"--json");
  assert.equal(r.status,2);
  assertNoLeak(r,[secret]);
  const check=JSON.parse(r.stdout).checks.find(c=>c.name==="security.secret_scan");
  assert.match(check.detail,/nested\/config\.js:3/);
}));

test("a project exception cannot waive the security gate",()=>withTemp(dir=>{
  const target=makeProject(dir);
  const secret=fakeToken("ghp_");
  writeFileSync(join(target,"config.js"),"const token = \""+secret+"\";\n");
  addException(target,"  - id: EX-SEC\n    rule: security.secret_scan\n    scope: /\n    reason: synthetic fixture\n    until: 2999-01-01\n");
  const r=cli("audit",target,"--json");
  assert.equal(r.status,2);
  assertNoLeak(r,[secret]);
  const report=JSON.parse(r.stdout);
  assert.equal(report.checks.find(c=>c.name==="security.secret_scan").status,"FAIL");
  assert.equal(report.checks.find(c=>c.name==="security.secret_scan_exception").status,"FAIL");
  assert.notEqual(report.checks.find(c=>c.name==="security.secret_scan").status,"NOT_APPLICABLE");
  assert.equal(JSON.stringify(report).includes("synthetic fixture"),false,"exception reason was echoed");
}));

test("an expired security exception still fails closed",()=>withTemp(dir=>{
  const target=makeProject(dir);
  const secret=fakeToken("ghp_");
  writeFileSync(join(target,"config.js"),"const token = \""+secret+"\";\n");
  addException(target,"  - id: EX-OLD\n    rule: security.secret_scan\n    scope: config.js\n    until: 2000-01-01\n");
  const r=cli("audit",target);
  assert.equal(r.status,2);
  assertNoLeak(r,[secret]);
  assert.match(r.stdout,/FAIL\s+security\.secret_scan\b/);
  assert.match(r.stdout,/FAIL\s+exception\.EX-OLD\b/);
}));

test("ordinary non-security exceptions still apply",()=>withTemp(dir=>{
  const target=makeProject(dir);
  rmSync(join(target,"AGENTS.md"));
  addException(target,"  - id: EX-AGENTS\n    rule: governance.agents\n    scope: /\n    until: 2999-01-01\n");
  const r=cli("audit",target,"--json");
  assert.equal(r.status,0,r.stderr);
  const report=JSON.parse(r.stdout);
  assert.equal(report.checks.find(c=>c.name==="agents.md").status,"NOT_APPLICABLE");
  assert.equal(report.checks.some(c=>c.status==="FAIL"),false);
}));

test("init refuses a symlinked target and a symlinked generated path",()=>withTemp(dir=>{
  const real=join(dir,"real-target");
  mkdirSync(real);
  const targetLink=join(dir,"linked-target");
  symlinkSync(real,targetLink,process.platform==="win32"?"junction":"dir");
  const viaTarget=cli("init",targetLink,"--profile","saas","--tier","B");
  assert.equal(viaTarget.status,2);
  assert.match(viaTarget.stderr,/symlink/i);
  assert.equal(readdirSync(real).length,0);

  const target=join(dir,"target");
  mkdirSync(target);
  const outside=join(dir,"outside");
  mkdirSync(outside);
  symlinkSync(outside,join(target,"docs"),process.platform==="win32"?"junction":"dir");
  const viaChild=cli("init",target,"--profile","saas","--tier","B");
  assert.equal(viaChild.status,2);
  assert.match(viaChild.stderr,/symlink/i);
  assert.equal(readdirSync(outside).length,0);
}));

test("standalone security gate passes a clean project and fails a planted secret without printing it",()=>withTemp(dir=>{
  const clean=makeProject(dir);
  const ok=gate(clean);
  assert.equal(ok.status,0,ok.stderr);
  assert.match(ok.stdout,/SECURITY GATE PASS/);

  const dirty=join(dir,"dirty");
  mkdirSync(dirty);
  const secret=fakeToken("ghp_");
  writeFileSync(join(dirty,"README.md"),"# Dirty\n");
  writeFileSync(join(dirty,"config.js"),"const token = \""+secret+"\";\n");
  const bad=gate(dirty);
  assert.equal(bad.status,2);
  assertNoLeak(bad,[secret]);
  assert.match(bad.stdout+bad.stderr,/security\.secret_scan: FAIL/);
  assert.doesNotMatch(bad.stdout+bad.stderr,/NOT_APPLICABLE/);
}));
