import test from "node:test";
import assert from "node:assert/strict";
import {TYPES,TASKS,TASK_IDS,STAGE_IDS,TIERS,SKILL_IDS} from "../src/catalog.mjs";
import {
  resolveProfiles,skillClosure,tierObligations,profileObligations,
  routeForTask,composeRoute,validateRoute,stageSkillIds,
  evidencePlanFor,requiredEvidenceByStage
} from "../src/routing.mjs";

test("4 types x 13 tasks x 4 tiers x 2 modes always produce a valid route",()=>{
  for(const type of Object.keys(TYPES))
    for(const task of TASK_IDS)
      for(const tier of Object.keys(TIERS))
        for(const mode of ["new","existing"]){
          const route=composeRoute({type,task,tier,mode});
          assert.deepEqual(validateRoute(route),[],type+"/"+task+"/"+tier+"/"+mode);
          assert.equal(new Set(route.stages.map(s=>s.id)).size,route.stages.length);
          assert.ok(route.stages.every(s=>s.state==="NOT_RUN"));
          assert.ok(route.stages.every(s=>STAGE_IDS.includes(s.id)));
          assert.ok(route.profiles.length>0);
        }
});
test("existing mode prepends intake and discovery exactly once",()=>{
  const route=composeRoute({type:"saas",task:"investigation",mode:"existing"});
  assert.deepEqual(route.stages.map(s=>s.id),["intake","discovery"]);
  const bug=composeRoute({type:"saas",task:"bug",mode:"existing"});
  assert.deepEqual(bug.stages.map(s=>s.id).slice(0,3),["intake","discovery","implementation"]);
});
test("Tier C/D mark feature specification and architecture optional, never silently drop them",()=>{
  for(const tier of ["C","D"]){
    const route=composeRoute({type:"saas",task:"feature",tier});
    for(const id of ["specification","architecture"]){
      const stage=route.stages.find(s=>s.id===id);
      assert.equal(stage.role,"optional");
      assert.ok(stage.optionalReason);
    }
  }
  const a=composeRoute({type:"saas",task:"feature",tier:"A"});
  assert.ok(a.stages.filter(s=>["specification","architecture"].includes(s.id)).every(s=>s.role==="required"));
  assert.ok(a.stages.every(s=>s.role==="required"));
});
test("skipped stages are explicit and never reported as complete",()=>{
  const route=composeRoute({type:"saas",task:"bug"});
  assert.ok(route.skipped.length>0);
  assert.ok(route.skipped.every(s=>s.reason.includes("不包含")));
  const active=new Set(route.stages.map(s=>s.id));
  assert.ok(route.skipped.every(s=>!active.has(s.id)));
});
test("profiles resolve by type, stack and addon; conflicts and implications are surfaced",()=>{
  assert.deepEqual(resolveProfiles({type:"mini-program",stack:"mini-native"}).profiles,["mini-program","backend"]);
  assert.throws(()=>resolveProfiles({type:"app",stack:"mini-taro"}),/does not apply/);
  assert.ok(resolveProfiles({type:"saas",addons:["payments"]}).profiles.includes("payments"));
  const rag=resolveProfiles({type:"saas",addons:["rag"]});
  assert.ok(rag.profiles.includes("rag")&&rag.profiles.includes("ai-application"));
  assert.ok(rag.warnings.some(w=>w.includes("ai-application")));
  assert.throws(()=>resolveProfiles({type:"nope"}),/Unknown project type/);
  assert.throws(()=>resolveProfiles({type:"app",stack:"nope"}),/Unknown stack/);
  assert.throws(()=>resolveProfiles({type:"saas",addons:["nope"]}),/Unknown addon/);
});
test("skill closure resolves dependencies and rejects cycles",()=>{
  assert.deepEqual(skillClosure(["implementation-plan"]),["specification","implementation-plan"]);
  assert.deepEqual(skillClosure(["code-review"]),["verification","code-review"]);
  assert.deepEqual(skillClosure(["verification","code-review"]),["verification","code-review"]);
  assert.throws(()=>skillClosure(["nope"]),/Unknown skill/);
});
test("tier and profile obligations are unions, not guesses",()=>{
  assert.equal(tierObligations("A").rollback,"required");
  assert.equal(tierObligations("D").spec,"optional");
  assert.throws(()=>tierObligations("Z"),/Unknown tier/);
  const o=profileObligations(["web","backend"]);
  assert.ok(o.tests.length>0);
  assert.equal(new Set(o.tests).size,o.tests.length);
});
test("routeForTask rejects unknown tasks",()=>{
  assert.equal(routeForTask("feature").id,"feature");
  assert.throws(()=>routeForTask("nope"),/Unknown task type/);
});
test("stage skill mapping only returns known candidate skills",()=>{
  for(const id of STAGE_IDS){
    const ids=stageSkillIds(id);
    assert.ok(ids.every(x=>SKILL_IDS.includes(x)));
  }
  assert.throws(()=>stageSkillIds("nope"),/Unknown lifecycle stage/);
});
test("every task route references only canonical stages and evidence kinds",()=>{
  for(const task of TASKS){
    const route=composeRoute({type:"saas",task:task.id});
    assert.ok(route.evidence.length>0);
    assert.ok(route.stages.every(s=>s.evidence.length>0));
  }
});
test("non-AI bug routes do not require model eval",()=>{
  const route=composeRoute({type:"enterprise",task:"bug"});
  const required=route.stages.find(s=>s.id==="verification").evidencePlan.required;
  assert.ok(!required.includes("eval"));
  assert.ok(required.includes("test"));
});
test("SaaS API changes require contract and permission evidence",()=>{
  const route=composeRoute({type:"saas",task:"feature"});
  const verification=route.stages.find(s=>s.id==="verification").evidencePlan.required;
  const review=route.stages.find(s=>s.id==="review").evidencePlan.required;
  assert.ok(verification.includes("integration-probe"));
  assert.ok(review.includes("review"));
});
test("RAG behaviour changes cannot drop the applicable eval gate",()=>{
  for(const tier of ["A","B","C","D"]){
    const route=composeRoute({type:"saas",task:"feature",tier,addons:["rag"]});
    const required=route.stages.find(s=>s.id==="verification").evidencePlan.required;
    assert.ok(required.includes("eval"),tier);
  }
});
test("release requires a real release receipt, not a unit test",()=>{
  const route=composeRoute({type:"saas",task:"release"});
  const plan=route.stages.find(s=>s.id==="release").evidencePlan;
  assert.ok(plan.required.includes("receipt"));
  assert.ok(!plan.required.includes("test"));
  assert.ok(plan.notApplicable.includes("test"));
});
test("Tier C/D never remove a security gate and never weaken an existing project",()=>{
  const security=composeRoute({type:"saas",task:"security",tier:"D"});
  assert.ok(security.stages.find(s=>s.id==="review").evidencePlan.required.includes("review"));
  assert.ok(security.stages.find(s=>s.id==="verification").evidencePlan.required.includes("test"));

  const existing=composeRoute({type:"saas",task:"feature",tier:"D",mode:"existing"});
  const verification=existing.stages.find(s=>s.id==="verification").evidencePlan;
  assert.ok(verification.required.includes("integration-probe"));
  assert.ok(!verification.rationale["integration-probe"].includes("demoted"));
});
test("tier demotion is explicit and limited to non-safety gates",()=>{
  const route=composeRoute({type:"saas",task:"feature",tier:"C"});
  const architecture=route.stages.find(s=>s.id==="architecture").evidencePlan;
  assert.ok(architecture.recommended.includes("adr") || architecture.recommended.includes("review"));
  assert.ok(Object.values(architecture.rationale).some(r=>r==="tier-demoted"));
});
test("the route evidence plan and summary share the same required gates",()=>{
  const route=composeRoute({type:"saas",task:"feature",addons:["rag"]});
  const required=requiredEvidenceByStage(route);
  assert.deepEqual(required.verification,route.stages.find(s=>s.id==="verification").evidencePlan.required);
  assert.ok(required.verification.includes("eval"));
  const plan=evidencePlanFor({task:"feature",tier:"B",mode:"new",profiles:["saas","web","backend","ai-application","rag"],stages:route.stages});
  assert.deepEqual(plan.stages.verification.required,required.verification);
});
