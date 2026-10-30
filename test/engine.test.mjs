import test from "node:test";
import assert from "node:assert/strict";
import {TYPES,STAGES,SKILLS,SOURCE} from "../src/catalog.mjs";
import {slugify,normalizeConfig,assemble,xengDryRun,toMarkdown,toManifest,validateCatalog} from "../src/engine.mjs";
test("catalog contains expected routes, stages, skill statuses",()=>{
  assert.equal(Object.keys(TYPES).length,4);
  assert.equal(STAGES.length,11);
  assert.equal(SKILLS.length,8);
  assert.ok(SKILLS.every(x=>x.status==="candidate" && x.installed===false));
  assert.deepEqual(validateCatalog(),[]);
});
test("every product route resolves a baseline profile",()=>{
  assert.deepEqual(assemble({type:"saas"}).profiles,["saas","web","backend"]);
  assert.deepEqual(assemble({type:"enterprise"}).profiles,["web","backend"]);
  assert.deepEqual(assemble({type:"mini-program"}).profiles,["mini-program","backend"]);
  assert.deepEqual(assemble({type:"app"}).profiles,["flutter","backend"]);
});
test("all APP technology stacks compose correctly",()=>{
  assert.deepEqual(assemble({type:"app",stack:"react-native"}).profiles,["react-native","backend"]);
  assert.deepEqual(assemble({type:"app",stack:"android"}).profiles,["android","backend"]);
  assert.deepEqual(assemble({type:"app",stack:"ios"}).profiles,["ios","backend"]);
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
  assert.match(xengDryRun(p),/^python tools\/xeng\.py init \.\.\/[a-z0-9-]+ --profile mini-program,backend --tier B --dry-run$/);
  assert.ok(!xengDryRun(p).includes("rm -rf"));
});
test("filenames are sanitized",()=>{
  assert.equal(slugify("../x\\bye"),"xbye");
  assert.equal(slugify("!@#$%^&*"),"new-project");
  assert.equal(slugify("我的 SaaS 产品"),"我的-saas-产品");
});
test("manifest does not claim verification or installation",()=>{
  const m=toManifest(assemble({name:"Demo",description:"Business task"}));
  assert.equal(m.status,"GENERATED_NOT_EXECUTED");
  assert.ok(m.stages.every(s=>s.evidence==="NOT_RUN"));
  assert.ok(m.skills.every(s=>s.status==="candidate" && !s.installed));
  assert.equal(m.source.commit,SOURCE.commit);
});
test("Markdown outputs all stages and safety caveats",()=>{
  const md=toMarkdown(assemble({type:"enterprise",name:"Test",description:"hello\nworld"}));
  assert.match(md,/# Test · 开发方案/);
  assert.match(md,/> hello\n> world/);
  assert.equal((md.match(/^### \d{2} /gm)||[]).length,11);
  assert.match(md,/NOT_RUN/);
  assert.match(md,/--dry-run/);
  assert.match(md,/RBAC/);
});
test("input lengths are bounded",()=>{
  const cfg=normalizeConfig({name:"a".repeat(400),description:"b".repeat(5000)});
  assert.equal(cfg.name.length,100);assert.equal(cfg.description.length,2000);
});
