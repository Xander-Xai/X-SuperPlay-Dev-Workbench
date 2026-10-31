import test from "node:test";
import assert from "node:assert/strict";
import {assemble} from "../src/engine.mjs";
import {
  engineeringProfileYaml,adrTemplate,verificationPlan,releaseChecklist,routeSopMarkdown,workspaceBundle
} from "../src/workspace.mjs";

const plan=()=>assemble({type:"saas",task:"feature",name:"Demo",description:"Build it",agent:"codex"});
const baselinePlan=()=>assemble({
  type:"saas",task:"feature",name:"Demo",description:"Build it",agent:"codex",
  baseline:{schemaVersion:1,kind:"LOCAL_PROJECT_BASELINE",status:"READ_ONLY_DISCOVERY",
    name:"Demo",projectType:"saas",headSha:"a".repeat(40),dirty:false,detected:["git"]}
});

test("workspace emits nine reviewable artifacts",()=>{
  const bundle=workspaceBundle(plan());
  const names=Object.keys(bundle);
  assert.equal(names.length,9);
  assert.ok(names.every(n=>bundle[n].length>0));
  assert.ok(names.some(n=>n.endsWith("-manifest.json")));
  assert.ok(names.some(n=>n.endsWith("-ENGINEERING_PROFILE.yaml")));
  assert.ok(names.some(n=>n.endsWith("-spec-and-tickets-draft.md")));
  assert.ok(names.some(n=>n.endsWith("-adr-draft.md")));
  assert.ok(names.some(n=>n.endsWith("-verification-plan.md")));
  assert.ok(names.some(n=>n.endsWith("-release-checklist.md")));
  assert.ok(names.some(n=>n.endsWith("-agent-handoff.md")));
  assert.ok(names.some(n=>n.endsWith("-route-sop.md")));
  assert.ok(names.some(n=>n.endsWith("-bundle.json")));
});
test("every artifact shares one project id and base SHA",()=>{
  const p=baselinePlan();
  const bundle=workspaceBundle(p);
  const artifacts=Object.entries(bundle).filter(([n])=>!n.endsWith("-bundle.json")&&!n.endsWith("-manifest.json"));
  assert.equal(artifacts.length,7);
  for(const [name,text] of artifacts){
    assert.match(text,new RegExp('project_id: "?'+p.slug),name);
    assert.match(text,new RegExp('base_sha: "?'+"a".repeat(40)),name);
  }
  assert.match(bundle[p.slug+"-spec-and-tickets-draft.md"],/baseSha|base_sha/);
  const pack=JSON.parse(bundle[p.slug+"-bundle.json"]);
  assert.equal(pack.kind,"WORKBENCH_PROJECT_BUNDLE");
  assert.equal(pack.status,"DRAFT_NOT_EXECUTED");
  assert.equal(pack.identity.projectId,p.slug);
  assert.equal(pack.identity.baseSha,"a".repeat(40));
  assert.equal(pack.files.length,8);
  for(const f of pack.files){
    assert.ok(f.content.includes(p.slug),f.name);
    assert.ok(f.content.includes("a".repeat(40)),f.name);
    assert.equal(f.bytes,new TextEncoder().encode(f.content).length,f.name);
  }
  const manifest=JSON.parse(bundle[p.slug+"-manifest.json"]);
  assert.equal(manifest.project.baseSha,"a".repeat(40));
  assert.equal(manifest.project.slug,p.slug);
});
test("route SOPs are distinct and carry platform limits",()=>{
  const saas=routeSopMarkdown(assemble({type:"saas",name:"S"}));
  const enterprise=routeSopMarkdown(assemble({type:"enterprise",name:"E"}));
  const mini=routeSopMarkdown(assemble({type:"mini-program",name:"M"}));
  const app=routeSopMarkdown(assemble({type:"app",stack:"ios",name:"A"}));
  assert.match(saas,/租户 B/);
  assert.match(enterprise,/UAT/);
  assert.match(mini,/真机/);
  assert.match(app,/Android/);
  assert.match(app,/商店审核/);
  assert.equal(new Set([saas,enterprise,mini,app]).size,4);
  for(const text of [saas,enterprise,mini,app]) assert.match(text,/NOT_RUN/);
});
test("manifest artifact is the same safe manifest used by exports",()=>{
  const p=plan();
  const bundle=workspaceBundle(p);
  const raw=Object.entries(bundle).find(([n])=>n.endsWith("-manifest.json"))[1];
  const manifest=JSON.parse(raw);
  assert.equal(manifest.kind,"WORKBENCH_PLAN");
  assert.equal(manifest.status,"GENERATED_NOT_EXECUTED");
  assert.equal(manifest.ownership.currentEngineeringOwner.repository,p.ownership.currentOwner.repository);
});
test("engineering profile carries ownership and explicit levels",()=>{
  const yaml=engineeringProfileYaml(plan());
  assert.match(yaml,/current_owner:/);
  assert.match(yaml,/historical_provenance:/);
  assert.match(yaml,/governance_reference:/);
  assert.match(yaml,/profiles: \[saas, web, backend\]/);
  assert.match(yaml,/exceptions: \[\]/);
  assert.match(yaml,/unit_tests: required/);
  assert.match(yaml,/evals: not_applicable/);
});
test("drafts never claim execution",()=>{
  const p=plan();
  for(const text of [adrTemplate(p),verificationPlan(p),releaseChecklist(p)])
    assert.match(text,/NOT_RUN/);
  assert.match(verificationPlan(p),/代码检查：/);
  assert.match(releaseChecklist(p),/- \[ \] 回滚方案/);
});
test("AI profiles require evals in the generated profile",()=>{
  const yaml=engineeringProfileYaml(assemble({type:"saas",addons:["rag"]}));
  assert.match(yaml,/evals: required/);
});
