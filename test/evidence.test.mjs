import test from "node:test";
import assert from "node:assert/strict";
import {
  TRANSITIONS,canPromote,transition,normalizeEvidenceReport,evidenceSummary,emptyEvidenceReport
} from "../src/evidence.mjs";
import {EVIDENCE_STATES,STAGE_IDS} from "../src/catalog.mjs";

const validReport=()=>({
  schemaVersion:1,kind:"LOCAL_EVIDENCE_REPORT",status:"IMPORTED_NOT_TRUSTED",
  items:[
    {stage:"verification",kind:"test",layer:"LOCAL_TESTED",state:"VERIFIED",
     command:"npm test",result:"42 passed",artifact:"test-report.md",recordedAt:"2026-10-31"},
    {stage:"review",kind:"review",layer:"NOT_RUN",state:"IN_PROGRESS",command:"",result:"",artifact:""}
  ]
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
test("only the supported local report shape is accepted",()=>{
  assert.throws(()=>normalizeEvidenceReport(null),/supported/);
  assert.throws(()=>normalizeEvidenceReport({...validReport(),schemaVersion:2}),/supported/);
  assert.throws(()=>normalizeEvidenceReport({...validReport(),status:"TRUSTED"}),/supported/);
  assert.throws(()=>normalizeEvidenceReport({...validReport(),items:"x"}),/Invalid evidence items/);
  assert.throws(()=>normalizeEvidenceReport({...validReport(),items:new Array(201).fill({})}),/Invalid evidence items/);
});
test("each item is validated against the catalog",()=>{
  const base=validReport();
  assert.throws(()=>normalizeEvidenceReport({...base,items:[{...base.items[0],stage:"nope"}]}),/Unknown stage/);
  assert.throws(()=>normalizeEvidenceReport({...base,items:[{...base.items[0],kind:"nope"}]}),/Unknown evidence kind/);
  assert.throws(()=>normalizeEvidenceReport({...base,items:[{...base.items[0],state:"PASS"}]}),/Unknown evidence state/);
  assert.throws(()=>normalizeEvidenceReport({...base,items:[{...base.items[0],command:""}]}),/VERIFIED evidence requires/);
});
test("verified evidence must be inspectable",()=>{
  const report=normalizeEvidenceReport(validReport());
  assert.equal(report.status,"IMPORTED_NOT_TRUSTED");
  assert.equal(report.items[0].state,"VERIFIED");
  assert.equal(report.items[0].command,"npm test");
  assert.equal(report.trusted,undefined);
});
test("summary keeps every stage NOT_RUN unless evidence exists",()=>{
  const summary=evidenceSummary(validReport());
  assert.equal(summary.trusted,false);
  assert.equal(summary.stages.verification.state,"VERIFIED");
  assert.equal(summary.stages.review.state,"IN_PROGRESS");
  for(const id of STAGE_IDS.filter(x=>!["verification","review"].includes(x)))
    assert.equal(summary.stages[id].state,"NOT_RUN");
});
test("empty report is explicit and cannot promote anything",()=>{
  const empty=emptyEvidenceReport();
  const summary=evidenceSummary(empty);
  assert.equal(summary.items.length,0);
  assert.ok(Object.values(summary.stages).every(s=>s.state==="NOT_RUN"));
});
