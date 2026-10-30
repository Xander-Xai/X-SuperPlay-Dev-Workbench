import test from "node:test";
import assert from "node:assert/strict";
import {assemble} from "../src/engine.mjs";
import {makeStarter,starterMarkdown} from "../src/starter.mjs";
import {TYPES} from "../src/catalog.mjs";

test("all development routes produce 3 scoped, dependent and unexecuted tickets",()=>{
  for(const type of Object.keys(TYPES)){
    const plan=assemble({type,name:"Example",description:"Original user request",agent:"codex"});
    const pack=makeStarter(plan);
    assert.equal(pack.status,"DRAFT_REQUIRES_OWNER_APPROVAL");
    assert.equal(pack.sourceCommit,plan.ownership.historical.commit);
    assert.equal(pack.originalRequest,"Original user request");
    assert.equal(pack.tickets.length,3);
    assert.deepEqual(pack.tickets.map(t=>t.id),["T01","T02","T03"]);
    assert.deepEqual(pack.tickets.map(t=>t.blockedBy),[[],["T01"],["T02"]]);
    assert.ok(pack.tickets.every(t=>t.status==="PROPOSED_NOT_READY"));
    assert.ok(pack.tickets.every(t=>t.evidence==="NOT_RUN"&&t.baseSha==="UNKNOWN"));
    assert.ok(pack.tickets.every(t=>t.negative&&t.testIdea&&t.outcome));
    assert.equal((starterMarkdown(plan).match(/^### T\d{2}/gm)||[]).length,3);
  }
});
test("user request is preserved, not treated as verified acceptance",()=>{
  const md=starterMarkdown(assemble({type:"mini-program",description:"客户提出：预约服务\n但还没确定支付"}));
  assert.match(md,/> 客户提出：预约服务\n> 但还没确定支付/);
  assert.match(md,/DRAFT_REQUIRES_OWNER_APPROVAL/);
  assert.match(md,/测试命令：NOT_YET_IDENTIFIED/);
  assert.match(md,/业务方待确认/);
});
test("there is a cross-tenant security negative case for SaaS",()=>{
  const tickets=makeStarter(assemble({type:"saas"})).tickets;
  assert.match(tickets[0].negative,/租户/);
  assert.match(tickets[1].negative,/越权/);
});
test("invalid input cannot masquerade as a plan",()=>{
  assert.throws(()=>makeStarter(null),/Invalid plan/);
  assert.throws(()=>makeStarter({config:{type:"unknown"}}),/Invalid plan/);
});
