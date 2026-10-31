import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {STAGE_IDS,SKILL_IDS,EVIDENCE_STATES,ROUTE_SOPS,TYPES} from "../src/catalog.mjs";
import {
  MACRO_STAGES,ACTIVITIES,PLATFORM_BRANCHES,AI_OVERLAY,DELIVERY_STATES,DELIVERY_STATE_IDS,
  LOOP_PHASES,LOOP_TERMINAL_STATES,LOOP_TERMINAL_IDS,TICKET_CONTRACT_FIELDS,TICKET_CONTRACT_STATUS,
  ACCEPTANCE_TEST_POLICY,
  EXTERNAL_SKILLS,SKILL_VERIFICATION_LAYERS,SKILL_RELATION_POLICY,LEARNING_PATH,
  validateDelivery,deliveryMatrix,activityById,activitiesForStage,macroStageFor,canAdvanceDelivery
} from "../src/delivery.mjs";
import {assemble} from "../src/engine.mjs";
import {makeStarter} from "../src/starter.mjs";

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const cli=(...args)=>spawnSync(process.execPath,["tools/xeng.mjs",...args],{cwd:ROOT,encoding:"utf8"});

test("delivery model validates and never invents a second lifecycle",()=>{
  assert.deepEqual(validateDelivery(),[]);
  assert.equal(MACRO_STAGES.length,8);
  assert.equal(ACTIVITIES.length,18);
});

test("8 macro stages map every canonical stage exactly once",()=>{
  const covered=MACRO_STAGES.flatMap(m=>m.canonicalStages);
  assert.equal(new Set(covered).size,STAGE_IDS.length);
  assert.deepEqual([...new Set(covered)].sort(),[...STAGE_IDS].sort());
  for(const m of MACRO_STAGES) assert.ok(m.canonicalStages.every(s=>STAGE_IDS.includes(s)));
  for(const id of STAGE_IDS) assert.ok(macroStageFor(id),id);
});

test("18 activities cover all stages, each with one primary owner and full fields",()=>{
  const covered=new Set(ACTIVITIES.flatMap(a=>a.stages));
  assert.deepEqual([...covered].sort(),[...STAGE_IDS].sort());
  for(const a of ACTIVITIES){
    assert.ok(SKILL_IDS.includes(a.primarySkill),a.id);
    assert.ok(!a.alternateSkills.includes(a.primarySkill),a.id);
    for(const key of ["knowledge","inputs","humanDecisions","agentOperations","tools","outputs","stopConditions","deterministicControls"])
      assert.ok(Array.isArray(a[key])&&a[key].length>0,a.id+" "+key);
    for(const key of ["happyPath","negative","greenfield","brownfield","skillNote"])
      assert.ok(typeof a[key]==="string"&&a[key].trim(),a.id+" "+key);
  }
  assert.deepEqual(activitiesForStage("implementation").map(a=>a.id),["A07","A09","A10","A11","A13"]);
});

test("four product branches reuse route SOPs and the AI overlay cannot bypass them",()=>{
  assert.deepEqual(PLATFORM_BRANCHES.map(b=>b.id).sort(),Object.keys(TYPES).sort());
  for(const b of PLATFORM_BRANCHES){
    assert.equal(ROUTE_SOPS[b.routeSop].id,b.id);
    assert.ok(b.coverage.length>0&&b.negative.length>0&&b.platformGates.length>0);
  }
  for(const cap of ["LLM","RAG","Agent","多 Agent","自动化工作流","AI-native UX"]) assert.ok(AI_OVERLAY.capabilities.includes(cap),cap);
  assert.match(AI_OVERLAY.rule,/不能绕过/);
});

test("commercial delivery states are forward-only and cannot substitute",()=>{
  assert.deepEqual(DELIVERY_STATE_IDS,["CODE_TESTED","CI_VERIFIED","STAGING_VERIFIED","RELEASED","CONSUMER_ACCEPTED"]);
  assert.equal(canAdvanceDelivery("CODE_TESTED","CI_VERIFIED"),true);
  assert.equal(canAdvanceDelivery("CODE_TESTED","RELEASED"),false);
  assert.equal(canAdvanceDelivery("RELEASED","CODE_TESTED"),false);
  for(const s of DELIVERY_STATES) assert.ok(s.cannotSubstitute.trim());
});

test("bounded loop terminal states map onto the canonical evidence model",()=>{
  assert.equal(LOOP_PHASES.length,9);
  assert.equal(LOOP_PHASES[0],"PREPARE");
  assert.equal(LOOP_PHASES.at(-1),"STOP_OR_NEXT");
  assert.equal(LOOP_TERMINAL_STATES.length,7);
  for(const t of LOOP_TERMINAL_STATES){
    assert.ok(EVIDENCE_STATES.includes(t.evidenceState),t.id);
    assert.equal(t.stopReason,t.id);
  }
  for(const id of ["VERIFIED","BLOCKED","HUMAN_REQUIRED","NO_PROGRESS","BUDGET_EXCEEDED","SECURITY_STOP","SCOPE_DRIFT"])
    assert.ok(LOOP_TERMINAL_IDS.includes(id),id);
  assert.equal(LOOP_TERMINAL_STATES.find(t=>t.id==="NO_PROGRESS").evidenceState,"UNKNOWN");
});

test("ticket contract defines every required harness field",()=>{
  for(const f of ["ticket_id","spec_id","base_sha","accepted_AC","blocked_by","allowed_files","allowed_commands","forbidden_actions","negative_tests","iteration_budget","time_budget","external_cost_budget","stop_conditions","rollback","evidence_paths","reviewer"])
    assert.ok(TICKET_CONTRACT_FIELDS.includes(f),f);
  assert.equal(TICKET_CONTRACT_STATUS.status,"CONTRACT_DEFINED_NOT_RUNTIME_ENFORCED");
});

test("generated tickets carry the harness contract without claiming execution",()=>{
  const tickets=makeStarter(assemble({type:"saas",name:"Demo"})).tickets;
  for(const t of tickets){
    assert.equal(t.ticket_id,t.id);
    assert.ok(t.spec_id.endsWith("-spec"));
    assert.equal(t.acceptedAC,"PENDING_OWNER_CONFIRMATION");
    assert.ok(Array.isArray(t.allowedFiles)&&Array.isArray(t.allowedCommands));
    assert.ok(Array.isArray(t.negativeTests)&&t.negativeTests.length>0);
    assert.equal(t.timeBudget,"UNSET_MINUTES");
    assert.equal(t.externalCostBudget,"UNSET");
    assert.equal(t.rollback,"UNSET_REQUIRES_OWNER");
    assert.equal(t.reviewer,"UNASSIGNED");
    assert.equal(t.evidence,"NOT_RUN");
  }
});

test("development tests and protected acceptance cases stay distinct",()=>{
  assert.match(ACCEPTANCE_TEST_POLICY.devTests,/TDD/);
  assert.match(ACCEPTANCE_TEST_POLICY.protectedAcceptanceTests,/accepted_AC/);
  assert.match(ACCEPTANCE_TEST_POLICY.forbidden,/验收/);
  assert.match(ACCEPTANCE_TEST_POLICY.evidence,/不等于/);
});

test("external skills are verified honestly and never vendored",()=>{
  const byId=Object.fromEntries(EXTERNAL_SKILLS.map(x=>[x.id,x]));
  assert.equal(byId["mattpocock-skills"].commit,"24fe0ef7737efae15c87225755e9f6f5965e4888");
  assert.equal(byId["mattpocock-skills"].reportedClaimStatus,"MISMATCH");
  assert.equal(byId["mattpocock-skills"].license,"MIT");
  assert.equal(byId["anthropics-skills"].license,"LICENSE_UNVERIFIED");
  assert.equal(byId["vercel-labs-agent-skills"].license,"LICENSE_UNVERIFIED");
  for(const x of EXTERNAL_SKILLS){
    assert.equal(x.vendored,false,x.id);
    assert.match(x.commit,/^[0-9a-f]{40}$/,x.id);
    assert.equal(x.trigger,"USER_EXPLICIT",x.id);
  }
  assert.equal(SKILL_RELATION_POLICY.maxPrimaryOwnersPerActivity,1);
  assert.deepEqual(SKILL_VERIFICATION_LAYERS,["STATIC_CHECK","INSTALL","AGENT_DISCOVERY","AGENT_INVOCATION","REAL_PROJECT_EFFECT"]);
});

test("learning path references real activities and ends in review",()=>{
  for(const phase of [LEARNING_PATH.phase30,LEARNING_PATH.phase60])
    for(const id of phase.priorityActivities) assert.ok(activityById(id),id);
  assert.match(LEARNING_PATH.mapping,/复盘/);
});

test("delivery matrix has a macro stage and activities for every canonical stage",()=>{
  const rows=deliveryMatrix();
  for(const id of STAGE_IDS){
    assert.ok(rows[id].macro,id);
    assert.ok(rows[id].activities.length>0,id);
  }
});

test("xeng method/matrix/delivery/skills-matrix expose JSON and never claim execution",()=>{
  const method=cli("method","activities","--json");
  assert.equal(method.status,0,method.stderr);
  const m=JSON.parse(method.stdout);
  assert.equal(m.macroStages.length,8);
  assert.equal(m.activities.length,18);

  const one=cli("method","A04","--json");
  assert.equal(one.status,0,one.stderr);
  assert.equal(JSON.parse(one.stdout).id,"A04");

  const template=cli("method","--template");
  assert.equal(template.status,0,template.stderr);
  assert.match(template.stdout,/8 宏阶段 × 18 活动/);
  assert.match(template.stdout,/NOT_RUN|草案映射/);

  const matrix=cli("matrix","--json");
  assert.equal(matrix.status,0,matrix.stderr);
  assert.equal(Object.keys(JSON.parse(matrix.stdout)).length,11);

  const delivery=cli("delivery","--json");
  assert.equal(delivery.status,0,delivery.stderr);
  assert.equal(JSON.parse(delivery.stdout).deliveryStates.length,5);

  const skills=cli("skills-matrix","--json");
  assert.equal(skills.status,0,skills.stderr);
  assert.equal(JSON.parse(skills.stdout).external.length,EXTERNAL_SKILLS.length);

  const unknown=cli("method","A99");
  assert.equal(unknown.status,2);
});
