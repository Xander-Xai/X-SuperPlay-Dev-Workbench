import test from "node:test";
import assert from "node:assert/strict";
import {TYPES,STAGES,SKILLS,TASKS,PROFILES,OWNER,PROVENANCE,SOURCE} from "../src/catalog.mjs";
import {slugify,normalizeConfig,assemble,xengDryRun,toMarkdown,toManifest,validateCatalog} from "../src/engine.mjs";

test("catalog contains the preserved routes, stages, tasks, profiles and skills",()=>{
  assert.equal(Object.keys(TYPES).length,4);
  assert.equal(STAGES.length,11);
  assert.equal(new Set(STAGES.map(s=>s.id)).size,11);
  assert.equal(TASKS.length,13);
  assert.equal(PROFILES.length,17);
  assert.equal(SKILLS.length,8);
  assert.ok(SKILLS.every(x=>x.status==="candidate" && x.installed===false && x.selfContained===true));
  assert.deepEqual(validateCatalog(),[]);
});
test("every product route resolves its base profiles",()=>{
  assert.deepEqual(assemble({type:"saas"}).profiles,["saas","web","backend"]);
  assert.deepEqual(assemble({type:"enterprise"}).profiles,["enterprise","web","backend"]);
  assert.deepEqual(assemble({type:"mini-program"}).profiles,["mini-program","backend"]);
  assert.deepEqual(assemble({type:"app"}).profiles,["mobile","flutter","backend"]);
});
test("all APP technology stacks compose correctly",()=>{
  assert.deepEqual(assemble({type:"app",stack:"react-native"}).profiles,["mobile","react-native","backend"]);
  assert.deepEqual(assemble({type:"app",stack:"android"}).profiles,["mobile","android","backend"]);
  assert.deepEqual(assemble({type:"app",stack:"ios"}).profiles,["mobile","ios","backend"]);
});
test("mini-program stacks compose correctly",()=>{
  assert.deepEqual(assemble({type:"mini-program",stack:"mini-taro"}).profiles,["mini-program","web","backend"]);
  assert.deepEqual(assemble({type:"mini-program",stack:"mini-cloud"}).profiles,["mini-program"]);
});
test("RAG and Agent add AI application exactly once",()=>{
  const p=assemble({type:"saas",addons:["rag","agent","rag","unknown"]});
  assert.deepEqual(p.profiles,["saas","web","backend","ai-application","rag","agent"]);
  assert.deepEqual(p.config.addons,["rag","agent"]);
});
test("invalid inputs do not create shell injection",()=>{
  const p=assemble({type:"../../x",tier:"Z",agent:"$(boom)",name:"; rm -rf / && hi"});
  assert.equal(p.config.type,"mini-program");
  assert.equal(p.config.tier,"B");
  assert.equal(p.config.agent,"claude-code");
  assert.match(xengDryRun(p),/^node tools\/xeng\.mjs init \.\.\/[a-z0-9-]+ --profile mini-program,backend --tier B --task feature --mode new --dry-run$/);
  assert.ok(!xengDryRun(p).includes("rm -rf"));
});
test("filenames are sanitized",()=>{
  assert.equal(slugify("../x\\bye"),"xbye");
  assert.equal(slugify("!@#$%^&*"),"new-project");
  assert.equal(slugify("我的 SaaS 产品"),"我的-saas-产品");
});
test("manifest separates ownership and does not claim verification or installation",()=>{
  const m=toManifest(assemble({name:"Demo",description:"Business task"}));
  assert.equal(m.status,"GENERATED_NOT_EXECUTED");
  assert.equal(m.ownership.currentEngineeringOwner.repository,OWNER.repository);
  assert.equal(m.ownership.historicalProvenance.commit,PROVENANCE.commit);
  assert.equal(m.ownership.historicalProvenance.status,"HISTORICAL_PROVENANCE");
  assert.ok(m.route.stages.every(s=>s.state==="NOT_RUN"));
  assert.ok(m.skills.every(s=>s.status==="candidate" && !s.installed));
  assert.equal(m.ownership.historicalProvenance.commit,SOURCE.commit);
});
test("Markdown outputs the task route and safety caveats",()=>{
  const plan=assemble({type:"enterprise",name:"Test",description:"hello\nworld"});
  const md=toMarkdown(plan);
  assert.match(md,/# Test · 开发方案/);
  assert.match(md,/> hello\n> world/);
  assert.equal((md.match(/^### \d{2} /gm)||[]).length,plan.stages.length);
  assert.match(md,/NOT_RUN/);
  assert.match(md,/--dry-run/);
  assert.match(md,/RBAC/);
});
test("task choice changes the route without inventing stages",()=>{
  const bug=assemble({task:"bug"});
  assert.deepEqual(bug.stages.map(s=>s.id),["discovery","implementation","verification","review"]);
  assert.deepEqual(bug.skipped.map(s=>s.id).sort(),["architecture","intake","operation","planning","postmortem","release","specification"].sort());
  const doc=assemble({task:"documentation"});
  assert.deepEqual(doc.stages.map(s=>s.id),["verification","implementation","review"]);
});
test("input lengths are bounded",()=>{
  const cfg=normalizeConfig({name:"a".repeat(400),description:"b".repeat(5000)});
  assert.equal(cfg.name.length,100);assert.equal(cfg.description.length,2000);
});
