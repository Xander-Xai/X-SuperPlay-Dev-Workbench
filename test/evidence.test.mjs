import test from "node:test";
import assert from "node:assert/strict";
import {
  TRANSITIONS,canPromote,transition,hasInspectableProof,normalizeEvidenceReport,
  evidenceSummary,stageGateSummary,emptyEvidenceReport,evidenceDisplayState
} from "../src/evidence.mjs";
import {EVIDENCE_STATES,STAGE_IDS} from "../src/catalog.mjs";

const verifiedItem=(over={})=>({
  stage:"verification",kind:"test",layer:"LOCAL_TESTED",state:"VERIFIED",
  command:"npm test",result:"42 passed",artifact:"test-report.md",recordedAt:"2026-10-31",
  ...over
});
const reportOf=(items)=>({
  schemaVersion:1,kind:"LOCAL_EVIDENCE_REPORT",status:"IMPORTED_NOT_TRUSTED",items
});

test("evidence transitions forbid silent promotion",()=>{
  assert.equal(canPromote("NOT_RUN","IN_PROGRESS"),true);
  assert.equal(canPromote("NOT_RUN","VERIFIED"),false);
  assert.equal(canPromote("VERIFIED","IN_PROGRESS"),false);
  for(const state of EVIDENCE_STATES)
    assert.deepEqual(TRANSITIONS[state],Array.isArray(TRANSITIONS[state])?TRANSITIONS[state]:[]);
  assert.throws(()=>transition({state:"NOT_RUN"},"VERIFIED"),/Illegal evidence transition/);
  assert.throws(()=>transition(null,"IN_PROGRESS"),/required/);
  const next=transition({state:"NOT_RUN"},"IN_PROGRESS");
  assert.equal(next.state,"IN_PROGRESS");
  assert.equal(next.history.length,1);
});

test("IN_PROGRESS cannot become VERIFIED without inspectable proof",()=>{
  const base={state:"IN_PROGRESS",layer:"LOCAL_TESTED"};
  assert.throws(()=>transition(base,"VERIFIED"),/command, result and artifact/);
  assert.throws(()=>transition({...base,command:"npm test"},"VERIFIED"),/command, result and artifact/);
  assert.throws(()=>transition({...base,command:"npm test",result:"ok"},"VERIFIED"),/command, result and artifact/);
  assert.equal(hasInspectableProof(base),false);
  const ok=transition({...base,command:"npm test",result:"42 passed",artifact:"report.md"},"VERIFIED");
  assert.equal(ok.state,"VERIFIED");
  assert.equal(ok.history.at(-1).to,"VERIFIED");
});

test("VERIFIED requires an executed evidence layer",()=>{
  const proof={state:"IN_PROGRESS",command:"npm test",result:"ok",artifact:"report.md"};
  assert.throws(()=>transition({...proof,layer:"NOT_RUN"},"VERIFIED"),/executed layer/);
  assert.throws(()=>transition(proof,"VERIFIED"),/executed layer/);
  assert.equal(transition({...proof,layer:"CI_VERIFIED"},"VERIFIED").state,"VERIFIED");
});

test("only the supported local report shape is accepted",()=>{
  assert.throws(()=>normalizeEvidenceReport(null),/supported/);
  assert.throws(()=>normalizeEvidenceReport({...reportOf([verifiedItem()]),schemaVersion:2}),/supported/);
  assert.throws(()=>normalizeEvidenceReport({...reportOf([verifiedItem()]),status:"TRUSTED"}),/supported/);
  assert.throws(()=>normalizeEvidenceReport({...reportOf([verifiedItem()]),items:"x"}),/Invalid evidence items/);
  assert.throws(()=>normalizeEvidenceReport({...reportOf([verifiedItem()]),items:new Array(201).fill({})}),/Invalid evidence items/);
});

test("each item is validated against the catalog",()=>{
  assert.throws(()=>normalizeEvidenceReport(reportOf([verifiedItem({stage:"nope"})])),/Unknown stage/);
  assert.throws(()=>normalizeEvidenceReport(reportOf([verifiedItem({kind:"nope"})])),/Unknown evidence kind/);
  assert.throws(()=>normalizeEvidenceReport(reportOf([verifiedItem({state:"PASS"})])),/Unknown evidence state/);
  assert.throws(()=>normalizeEvidenceReport(reportOf([verifiedItem({command:""})])),/VERIFIED evidence requires/);
});

test("imported VERIFIED cannot use a NOT_RUN layer",()=>{
  assert.throws(()=>normalizeEvidenceReport(reportOf([verifiedItem({layer:"NOT_RUN"})])),/executed layer/);
  const report=normalizeEvidenceReport(reportOf([verifiedItem()]));
  assert.equal(report.status,"IMPORTED_NOT_TRUSTED");
  assert.equal(report.trusted,undefined);
});

test("a single VERIFIED item does not complete a multi-gate stage",()=>{
  const summary=evidenceSummary(reportOf([verifiedItem()]),{
    requiredByStage:{verification:["test","eval","integration-probe"]}
  });
  const v=summary.stages.verification;
  assert.notEqual(v.state,"VERIFIED");
  assert.equal(v.state,"UNKNOWN");
  assert.equal(v.complete,false);
  assert.ok(v.missing.includes("eval"));
  assert.ok(v.missing.includes("integration-probe"));
  assert.equal(v.gates.find(g=>g.kind==="test").verified,1);
  assert.equal(summary.trusted,false);
  assert.equal(summary.promotion,"NONE");
});

test("VERIFIED plus BLOCKED in one stage cannot summarise as VERIFIED",()=>{
  const summary=evidenceSummary(reportOf([
    verifiedItem(),
    verifiedItem({kind:"eval",state:"BLOCKED",layer:"NOT_RUN",command:"",result:"",artifact:""})
  ]),{requiredByStage:{verification:["test","eval"]}});
  const v=summary.stages.verification;
  assert.equal(v.state,"BLOCKED");
  assert.equal(v.complete,false);
  assert.equal(v.conflict,true);
  assert.equal(summary.trusted,false);
});

test("VERIFIED plus NOT_RUN in one stage stays NOT_RUN",()=>{
  const summary=evidenceSummary(reportOf([
    verifiedItem(),
    verifiedItem({kind:"eval",state:"NOT_RUN",layer:"NOT_RUN",command:"",result:"",artifact:""})
  ]),{requiredByStage:{verification:["test","eval"]}});
  const v=summary.stages.verification;
  assert.equal(v.state,"NOT_RUN");
  assert.equal(v.complete,false);
});

test("a claim is complete only when every required gate is VERIFIED, still untrusted",()=>{
  const summary=evidenceSummary(reportOf([
    verifiedItem({stage:"intake",kind:"doc-update"})
  ]),{requiredByStage:{intake:["doc-update"]}});
  const s=summary.stages.intake;
  assert.equal(s.state,"VERIFIED");
  assert.equal(s.complete,true);
  assert.deepEqual(s.missing,[]);
  assert.equal(summary.trusted,false);
  assert.equal(summary.promotion,"NONE");
});

test("callers may narrow required gates per stage",()=>{
  const summary=evidenceSummary(reportOf([verifiedItem()]),{
    requiredByStage:{verification:["test"]}
  });
  assert.equal(summary.stages.verification.state,"VERIFIED");
  assert.equal(summary.stages.verification.complete,true);
  assert.equal(summary.trusted,false);
});

test("stageGateSummary rejects a blocked gate even if others are verified",()=>{
  const s=stageGateSummary([
    {kind:"test",state:"VERIFIED"},
    {kind:"review",state:"BLOCKED"}
  ],["test","review"]);
  assert.equal(s.state,"BLOCKED");
  assert.equal(s.complete,false);
  assert.equal(s.conflict,true);
  assert.deepEqual(s.missing,["review"]);
});

test("summary keeps every stage NOT_RUN unless evidence exists",()=>{
  const summary=evidenceSummary(reportOf([verifiedItem()]),{
    requiredByStage:{verification:["test"]}
  });
  for(const id of STAGE_IDS.filter(x=>x!=="verification"))
    assert.equal(summary.stages[id].state,"NOT_RUN");
});

test("missing project context cannot promote or claim a gate",()=>{
  const summary=evidenceSummary(reportOf([verifiedItem()]));
  assert.equal(summary.context,"UNKNOWN");
  for(const stage of Object.values(summary.stages)){
    assert.equal(stage.state,"NOT_RUN");
    assert.equal(stage.complete,false);
    assert.deepEqual(stage.gates,[]);
  }
  assert.equal(evidenceDisplayState(summary.stages.verification).note,"CONTEXT_UNKNOWN");
});

test("the state shown by the web UI is derived from gate completeness",()=>{
  const conflict=evidenceDisplayState({state:"BLOCKED",complete:false,conflict:true,missing:["eval"],items:[{}]});
  assert.deepEqual(conflict,{state:"BLOCKED",note:"CONFLICT",trusted:false});
  const partial=evidenceDisplayState({state:"UNKNOWN",complete:false,conflict:false,missing:["eval"],items:[{}]});
  assert.deepEqual(partial,{state:"UNKNOWN",note:"MISSING_GATES",trusted:false});
  const complete=evidenceDisplayState({state:"VERIFIED",complete:true,conflict:false,missing:[],items:[{}]});
  assert.deepEqual(complete,{state:"VERIFIED",note:"CLAIM_COMPLETE_NOT_TRUSTED",trusted:false});
  const none=evidenceDisplayState({state:"NOT_RUN",complete:false,conflict:false,missing:[],items:[]});
  assert.deepEqual(none,{state:"NOT_RUN",note:"NO_EVIDENCE",trusted:false});
  assert.equal(evidenceDisplayState({state:"PASS"}).state,"NOT_RUN");
});

test("empty report is explicit and cannot promote anything",()=>{
  const summary=evidenceSummary(emptyEvidenceReport());
  assert.equal(summary.items.length,0);
  assert.ok(Object.values(summary.stages).every(s=>s.state==="NOT_RUN"));
  assert.ok(Object.values(summary.stages).every(s=>s.complete===false));
  assert.equal(summary.trusted,false);
});

test("evidence identities are recorded but never trusted or promoted",()=>{
  const digest="a".repeat(64), commit="c".repeat(40);
  const report={...reportOf([verifiedItem()]),identities:[
    {kind:"reviewed_candidate",algorithm:"sha256",digest,sourceCommit:commit,locator:"artifacts/build.tar.gz",recordedAt:"2026-10-31"},
    {kind:"built_artifact",algorithm:"sha256",digest:"b".repeat(64),sourceCommit:commit,locator:"dist/app.js"}
  ]};
  const normalized=normalizeEvidenceReport(report);
  assert.equal(normalized.identityChain.status,"RECORDED_NOT_TRUSTED");
  assert.equal(normalized.identityChain.missing.includes("runtime_receipt"),true);
  const summary=evidenceSummary(report);
  assert.equal(summary.identityStatus,"RECORDED_NOT_TRUSTED");
  assert.equal(summary.trusted,false);
  assert.equal(summary.promotion,"NONE");
});
test("invalid or mixed evidence identities are rejected",()=>{
  const base={kind:"reviewed_candidate",algorithm:"sha256",digest:"a".repeat(64),sourceCommit:"c".repeat(40),locator:"x"};
  assert.throws(()=>normalizeEvidenceReport({...reportOf([]),identities:[{...base,digest:"short"}]}),/sha256 digest/);
  assert.throws(()=>normalizeEvidenceReport({...reportOf([]),identities:[base,{...base,sourceCommit:"d".repeat(40)}]}),/mixes source commits/);
  assert.throws(()=>normalizeEvidenceReport({...reportOf([]),identities:[{...base,kind:"unknown"}]}),/Unknown evidence identity kind/);
});
