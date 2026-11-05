import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateSkillCases, validateSkillEvalCases } from "../src/skill-eval.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CASES = JSON.parse(readFileSync(join(ROOT, "test/fixtures/skill-eval-cases.json"), "utf8"));
const cli = (...args) => spawnSync(process.execPath, [join(ROOT, "tools/xeng.mjs"), ...args], { cwd: ROOT, encoding: "utf8" });

function withInput(input, fn) {
  const dir = mkdtempSync(join(tmpdir(), "workbench-skill-eval-"));
  const file = join(dir, "cases.json");
  try {
    writeFileSync(file, typeof input === "string" ? input : JSON.stringify(input));
    return fn(file);
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

test("offline Skill Eval reports deterministic trigger, anti-trigger, and behavior outcomes", () => {
  const before = structuredClone(CASES);
  const report = evaluateSkillCases(CASES);
  assert.equal(report.kind, "OFFLINE_SYNTHETIC_EVAL");
  assert.equal(report.schemaVersion, 1);
  assert.equal(report.real_agent_execution, "NOT_RUN");
  assert.equal(report.trusted, false);
  assert.equal(report.promotion, "NONE");
  assert.match(report.inputSha256, /^[0-9a-f]{64}$/);
  assert.equal(report.suiteStatus, "PASS");
  assert.ok(report.summary.counts.PASS >= 8);
  assert.ok(report.summary.counts.FAIL >= 3);
  assert.ok(report.summary.counts.BLOCKED >= 3);
  assert.equal(report.summary.counts.NOT_RUN, 1);
  assert.equal(report.metrics.positiveTriggerCompliance, 1);
  assert.equal(report.metrics.antiTriggerCompliance, 1);
  assert.ok(report.metrics.ruleAdherenceCompliance < 1);
  assert.equal(report.cases.find(row => row.caseId === "GOOD_IMPLEMENTATION_TRACE").status, "PASS");
  const evidenceCase = report.cases.find(row => row.caseId === "GOOD_IMPLEMENTATION_TRACE");
  assert.equal(evidenceCase.inputSha256, report.inputSha256);
  assert.equal(evidenceCase.baseSha, "a".repeat(40));
  assert.equal(evidenceCase.currentSha, "b".repeat(40));
  assert.deepEqual(evidenceCase.expectedObservations, []);
  assert.equal(report.cases.find(row => row.caseId === "TICKET_NOT_READ").status, "FAIL");
  assert.equal(report.cases.find(row => row.caseId === "PREREQUISITES_UNMET").status, "FAIL");
  assert.deepEqual(report.cases.find(row => row.caseId === "SCOPE_ESCAPE").observations, ["SCOPE_VIOLATION"]);
  assert.equal(report.cases.find(row => row.caseId === "GREEN_TEST_FAILURE").status, "FAIL");
  assert.equal(report.cases.find(row => row.caseId === "MISSING_RECEIPT").status, "BLOCKED");
  assert.ok(report.cases.find(row => row.caseId === "STALE_EVIDENCE").observations.includes("EVIDENCE_STALE"));
  assert.ok(report.cases.find(row => row.caseId === "UNTRUSTED_PROMOTION_CLAIM").observations.includes("UNTRUSTED_EVIDENCE_CLAIM"));
  assert.equal(report.cases.find(row => row.caseId === "SKILL_NOT_INSTALLED").status, "BLOCKED");
  assert.deepEqual(CASES, before, "evaluation must not mutate the case input");
  assert.deepEqual(report, evaluateSkillCases(CASES));
});

test("offline Skill Eval never invokes model/network functions and keeps evidence untrusted", () => {
  const previousFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = () => { calls++; throw new Error("network must not be called by offline Skill Eval"); };
  try {
    const report = evaluateSkillCases(CASES);
    assert.equal(calls, 0);
    assert.equal(report.real_agent_execution, "NOT_RUN");
    assert.equal(report.trusted, false);
    assert.equal(report.promotion, "NONE");
    assert.ok(report.cases.find(row => row.caseId === "GOOD_IMPLEMENTATION_TRACE").matchedRules.includes("RECEIPT_REMAINS_UNTRUSTED"));
  } finally { globalThis.fetch = previousFetch; }
});

test("offline Skill Eval rejects unknown Skills, duplicate case IDs, forged results, and unsafe paths", () => {
  const unknown = structuredClone(CASES);
  unknown.cases[0].skill_id = "not-a-real-skill";
  assert.throws(() => validateSkillEvalCases(unknown), /unknown skill/i);

  const duplicate = structuredClone(CASES);
  duplicate.cases[1].case_id = duplicate.cases[0].case_id;
  assert.throws(() => validateSkillEvalCases(duplicate), /duplicate case_id/i);

  const forged = structuredClone(CASES);
  forged.cases[0].actual_result = "PASS";
  assert.throws(() => validateSkillEvalCases(forged), /unexpected field/i);

  const unsafe = structuredClone(CASES);
  unsafe.cases[9].allowed_files = ["../outside.mjs"];
  assert.throws(() => validateSkillEvalCases(unsafe), /unsafe.*path/i);

  const executable = structuredClone(CASES);
  executable.cases[0].synthetic_trace = [{ type: "external_action", action: "shell", command: "whoami", authorized: true }];
  assert.throws(() => validateSkillEvalCases(executable), /unknown.*event|unexpected field/i);
});

test("offline Skill Eval CLI reads cases only and emits explicit synthetic evidence markers", () => withInput(CASES, file => {
  const result = cli("skill-eval", "--input", file, "--json");
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.kind, "OFFLINE_SYNTHETIC_EVAL");
  assert.equal(report.real_agent_execution, "NOT_RUN");
  assert.equal(report.trusted, false);
  assert.equal(report.promotion, "NONE");
  assert.equal(report.summary.total, CASES.cases.length);
}));

test("Skill Eval CLI rejects malformed JSON and duplicate or missing input options", () => {
  withInput("{not-json", file => {
    const malformed = cli("skill-eval", "--input", file, "--json");
    assert.equal(malformed.status, 2);
    assert.match(malformed.stderr, /invalid JSON/i);
  });
  withInput(CASES, file => {
    const link = join(dirname(file), "linked-input");
    symlinkSync(dirname(file), link, process.platform === "win32" ? "junction" : "dir");
    const rejected = cli("skill-eval", "--input", link, "--json");
    assert.equal(rejected.status, 2);
    assert.match(rejected.stderr, /regular, non-symlink/i);
  });
  const duplicate = cli("skill-eval", "--input", "cases.json", "--input", "other.json");
  assert.equal(duplicate.status, 2);
  const missing = cli("skill-eval", "--json");
  assert.equal(missing.status, 2);

  const invalidCases = [];
  const unknownSkill = structuredClone(CASES); unknownSkill.cases[0].skill_id = "not-a-real-skill"; invalidCases.push(unknownSkill);
  const duplicateIds = structuredClone(CASES); duplicateIds.cases[1].case_id = duplicateIds.cases[0].case_id; invalidCases.push(duplicateIds);
  const forged = structuredClone(CASES); forged.cases[0].actual_result = "PASS"; invalidCases.push(forged);
  const unsafePath = structuredClone(CASES); unsafePath.cases[9].allowed_files = ["../outside.mjs"]; invalidCases.push(unsafePath);
  for (const invalid of invalidCases) withInput(invalid, file => {
    const rejected = cli("skill-eval", "--input", file, "--json");
    assert.equal(rejected.status, 2, rejected.stderr);
  });
});
