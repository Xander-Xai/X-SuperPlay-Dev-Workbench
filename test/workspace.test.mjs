import test from "node:test";
import assert from "node:assert/strict";
import {assemble} from "../src/engine.mjs";
import {
  engineeringProfileYaml,adrTemplate,verificationPlan,releaseChecklist,workspaceBundle
} from "../src/workspace.mjs";

const plan=()=>assemble({type:"saas",task:"feature",name:"Demo",description:"Build it",agent:"codex"});

test("workspace emits seven reviewable artifacts",()=>{
  const bundle=workspaceBundle(plan());
  const names=Object.keys(bundle);
  assert.equal(names.length,7);
  assert.ok(names.every(n=>bundle[n].length>0));
  assert.ok(names.some(n=>n.endsWith("-manifest.json")));
  assert.ok(names.some(n=>n.endsWith("-ENGINEERING_PROFILE.yaml")));
  assert.ok(names.some(n=>n.endsWith("-spec-and-tickets-draft.md")));
  assert.ok(names.some(n=>n.endsWith("-adr-draft.md")));
  assert.ok(names.some(n=>n.endsWith("-verification-plan.md")));
  assert.ok(names.some(n=>n.endsWith("-release-checklist.md")));
  assert.ok(names.some(n=>n.endsWith("-agent-handoff.md")));
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
