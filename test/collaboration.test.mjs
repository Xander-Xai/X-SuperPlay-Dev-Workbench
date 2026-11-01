import test from "node:test";
import assert from "node:assert/strict";
import {
  COLLABORATION_MODES, COLLABORATION_MODE_IDS, DELEGATION_FIELDS, HUMAN_GATES, HUMAN_GATE_IDS,
  validateCollaboration, validateDelegation, collaborationPlan
} from "../src/collaboration.mjs";
import {assemble} from "../src/engine.mjs";

const validSolo = () => ({
  mode: "solo",
  writers: [{
    id: "writer:claude-code",
    reviewer: "independent-reviewer",
    worktree: ".worktrees/demo-writer-1",
    branch: "feat/demo",
    base_sha: "a".repeat(40),
    allowed_files: ["src/a.mjs"],
    allowed_commands: ["npm test"]
  }],
  human_gates: [...HUMAN_GATE_IDS]
});

test("collaboration contract has five modes, eleven fields and seven human gates",()=>{
  assert.deepEqual(validateCollaboration(),[]);
  assert.equal(COLLABORATION_MODES.length,5);
  assert.deepEqual(COLLABORATION_MODE_IDS,["solo","subagents","worktrees","agent-teams","batch-pr"]);
  assert.equal(DELEGATION_FIELDS.length,11);
  assert.equal(HUMAN_GATES.length,7);
});

test("valid solo delegation passes",()=>{
  assert.deepEqual(validateDelegation(validSolo()),[]);
});

test("writer cannot review their own work",()=>{
  const input=validSolo();
  input.writers[0].reviewer=input.writers[0].id;
  assert.match(validateDelegation(input).join(" "),/cannot review their own work/);
});

test("parallel writers need disjoint files and worktrees",()=>{
  const input=validSolo();
  input.mode="subagents";
  input.writers.push({
    id:"writer:codex", reviewer:"reviewer-2", branch:"feat/demo-2",
    base_sha:"a".repeat(40), allowed_files:["src/a.mjs"], allowed_commands:["npm test"]
  });
  const errors=validateDelegation(input).join(" ");
  assert.match(errors,/needs an isolated worktree/);
  assert.match(errors,/multiple writers/);
});

test("release and destructive actions require human gates",()=>{
  const input=validSolo();
  input.human_gates=[];
  input.release=true;
  input.destructive=true;
  const errors=validateDelegation(input).join(" ");
  assert.match(errors,/release requires a human release gate/);
  assert.match(errors,/destructive action requires a human gate/);
  assert.match(errors,/merge requires a human gate/);
});

test("batch-pr workers cannot share a PR",()=>{
  const input=validSolo();
  input.mode="batch-pr";
  input.writers=[
    {id:"w1",reviewer:"r1",worktree:".worktrees/w1",branch:"b1",pr:"PR-1",base_sha:"a".repeat(40),allowed_files:["a"],allowed_commands:["t"]},
    {id:"w2",reviewer:"r2",worktree:".worktrees/w2",branch:"b2",pr:"PR-1",base_sha:"a".repeat(40),allowed_files:["b"],allowed_commands:["t"]}
  ];
  assert.match(validateDelegation(input).join(" "),/PR PR-1 is shared/);
});

test("collaboration plan is a template, not an execution claim",()=>{
  const plan=collaborationPlan(assemble({name:"Demo",type:"saas"}));
  assert.equal(plan.status,"ADVISORY_CONTRACT_VALIDATED");
  assert.equal(plan.mode,"solo");
  assert.equal(plan.writers[0].reviewer,"independent-reviewer");
  assert.ok(plan.human_gates.includes("merge"));
  assert.match(plan.note,/does not create worktrees/);
  assert.deepEqual(validateDelegation({...plan,human_gates:plan.human_gates}),[]);
});
