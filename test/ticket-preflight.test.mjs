import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { validateTicketPreflight } from "../src/ticket-preflight.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SHA = "a".repeat(40);

function repo(fn) {
  const target = mkdtempSync(join(tmpdir(), "xeng-preflight-"));
  const git = (...args) => spawnSync("git", ["-C", target, ...args], { encoding: "utf8" });
  try {
    git("init", "-q");
    git("config", "user.email", "fixture@example.invalid");
    git("config", "user.name", "Fixture");
    writeFileSync(join(target, "README.md"), "fixture\n");
    git("add", "."); git("commit", "-qm", "fixture");
    const head = git("rev-parse", "HEAD").stdout.trim();
    return fn(target, head);
  } finally { rmSync(target, { recursive: true, force: true }); }
}

function ticket(baseSha, overrides = {}) {
  return {
    ticket_id: "T-01", spec_id: "SPEC-01", base_sha: baseSha,
    approval_status: "APPROVED", approved_by: "product-owner", approved_at: "2026-11-05T12:00:00Z",
    accepted_AC: ["AC-01: document upload is shown after successful API response"],
    blocked_by: [], allowed_files: ["src/upload.mjs", "test/upload.test.mjs"],
    allowed_commands: ["node --test test/upload.test.mjs"],
    iteration_budget: { maxAttemptsPerTicket: 2, maxReviewFixRounds: 1 },
    time_budget: "30", external_cost_budget: "0", stop_conditions: ["Stop if scope expands"],
    ...overrides
  };
}

const preflight = (target, current, currentTicket, ticketSet = [currentTicket]) =>
  validateTicketPreflight({ target, ticket: currentTicket, tickets: ticketSet });

// This file is a pure integration fixture; no agent, model, external service or
// command from the ticket is executed by the validator.

test("approved ticket with exact HEAD and declared test command passes only static preflight", () => repo((target, head) => {
  const result = preflight(target, head, ticket(head));
  assert.equal(result.status, "PREFLIGHT_CLEAR_NOT_HARNESS_READY");
  assert.equal(result.harnessReady, false);
  assert.equal(result.execution, "NOT_RUN");
  assert.equal(result.checks.find(x => x.id === "git_head").status, "PASS");
  assert.equal(result.checks.find(x => x.id === "test_entrypoint").status, "DECLARED_NOT_VERIFIED");
}));

test("preflight blocks missing owner approval, pending AC and mismatched base SHA", () => repo((target, head) => {
  assert.ok(preflight(target, head, ticket(head, { approval_status: "DRAFT" })).blockers.some(x => /approval/i.test(x)));
  assert.ok(preflight(target, head, ticket(head, { accepted_AC: ["PENDING_OWNER_CONFIRMATION"] })).blockers.some(x => /accepted_AC/i.test(x)));
  assert.ok(preflight(target, head, ticket("b".repeat(40))).blockers.some(x => /base_sha/.test(x)));
}));

test("preflight blocks missing, incomplete, or cyclically absent dependency claims", () => repo((target, head) => {
  const current = ticket(head, { blocked_by: ["T-00"] });
  assert.ok(preflight(target, head, current, [current]).blockers.some(x => /missing dependency ticket T-00/.test(x)));
  const incompleteDependency = { ticket_id: "T-00", status: "IN_PROGRESS" };
  const result = preflight(target, head, current, [incompleteDependency, current]);
  assert.ok(result.blockers.some(x => /T-00/.test(x)));
}));

test("preflight refuses unsafe, globbed, or symlink-escaping allowed file paths", () => repo((target, head) => {
  for (const path of ["../outside", "src/**", "src/*.mjs", "C:/outside"]) {
    const result = preflight(target, head, ticket(head, { allowed_files: [path] }));
    assert.notEqual(result.status, "PREFLIGHT_CLEAR_NOT_HARNESS_READY", path);
  }
  const outside = mkdtempSync(join(tmpdir(), "xeng-preflight-outside-"));
  try {
    mkdirSync(join(target, "linked"));
    symlinkSync(outside, join(target, "linked", "escape"), process.platform === "win32" ? "junction" : "dir");
    const result = preflight(target, head, ticket(head, { allowed_files: ["linked/escape/file.txt"] }));
    assert.ok(result.blockers.some(x => /symlink/i.test(x)));
  } finally { rmSync(outside, { recursive: true, force: true }); }
}));

test("preflight requires a declared test command and nonempty execution budgets", () => repo((target, head) => {
  const noTest = ticket(head, { allowed_commands: ["node tools/xeng.mjs version"] });
  assert.ok(preflight(target, head, noTest).blockers.some(x => /test command/i.test(x)));
  const noBudget = ticket(head, { time_budget: "UNSET", iteration_budget: {} });
  assert.ok(preflight(target, head, noBudget).blockers.some(x => /budget/i.test(x)));
}));

test("preflight treats a complete dependency receipt as an untrusted claim", () => repo((target, head) => {
  const artifact = "evidence/T-00.log";
  mkdirSync(join(target, "evidence"));
  writeFileSync(join(target, artifact), "fixture test passed\n");
  const git = (...args) => spawnSync("git", ["-C", target, ...args], { encoding: "utf8" });
  assert.equal(git("add", artifact).status, 0);
  assert.equal(git("commit", "-qm", "add dependency evidence").status, 0);
  const currentHead = git("rev-parse", "HEAD").stdout.trim();
  const dependency = {
    ticket_id: "T-00", status: "VERIFIED",
    execution_evidence: {
      candidate_sha: head,
      command: "node --test test/T-00.test.mjs",
      exit_code: 0, result: "PASS", artifact
    }
  };
  const current = ticket(currentHead, { blocked_by: ["T-00"] });
  const result = preflight(target, currentHead, current, [dependency, current]);
  assert.equal(result.status, "PREFLIGHT_CLEAR_NOT_HARNESS_READY");
  assert.equal(result.dependencies[0].status, "CLAIMED_COMPLETE_UNTRUSTED");
  assert.ok(result.warnings.some(x => /structural claims only/i.test(x)));
  assert.equal(result.harnessReady, false);
}));

test("preflight blocks placeholder dependency commands, invalid SHA, and missing evidence", () => repo((target, head) => {
  const artifact = "evidence/T-00.log";
  mkdirSync(join(target, "evidence"));
  writeFileSync(join(target, artifact), "fixture\n");
  const git = (...args) => spawnSync("git", ["-C", target, ...args], { encoding: "utf8" });
  git("add", artifact); git("commit", "-qm", "add evidence");
  const currentHead = git("rev-parse", "HEAD").stdout.trim();
  const dependency = {
    ticket_id: "T-00", status: "VERIFIED",
    execution_evidence: { candidate_sha: head, command: "PENDING", exit_code: 0, result: "PASS", artifact }
  };
  const current = ticket(currentHead, { blocked_by: ["T-00"] });
  const report = preflight(target, currentHead, current, [dependency, current]);
  assert.ok(report.blockers.some(x => /incomplete execution_evidence/.test(x)));

  dependency.execution_evidence = {
    candidate_sha: "c".repeat(40), command: "node --test test/T-00.test.mjs", exit_code: 0, result: "PASS", artifact
  };
  assert.ok(preflight(target, currentHead, current, [dependency, current]).blockers.some(x => /candidate_sha/.test(x)));

  dependency.execution_evidence = {
    candidate_sha: head, command: "node --test test/T-00.test.mjs", exit_code: 0, result: "PASS", artifact: "missing.log"
  };
  assert.ok(preflight(target, currentHead, current, [dependency, current]).blockers.some(x => /artifact/.test(x)));
}));

test("preflight blocks command injection and duplicate ticket identifiers", () => repo((target, head) => {
  const invalidCommand = ticket(head, { allowed_commands: ["node --test test/upload.test.mjs && whoami"] });
  assert.notEqual(preflight(target, head, invalidCommand).status, "PREFLIGHT_CLEAR_NOT_HARNESS_READY");
  const current = ticket(head, { blocked_by: ["T-00"] });
  const duplicated = preflight(target, head, current, [
    { ticket_id: "T-00", status: "IN_PROGRESS" },
    { ticket_id: "T-00", status: "VERIFIED" },
    current
  ]);
  assert.ok(duplicated.blockers.some(x => /duplicate ticket_id/.test(x)));
}));

test("preflight blocks dirty trees and never executes listed commands", () => repo((target, head) => {
  writeFileSync(join(target, "README.md"), "dirty\n");
  const result = preflight(target, head, ticket(head));
  assert.ok(result.blockers.some(x => /working tree is dirty/i.test(x)));
  assert.equal(result.execution, "NOT_RUN");
}));

test("CLI ticket-preflight emits JSON and exits nonzero for a draft ticket", () => repo((target, head) => {
  const file = join(target, "ticket.json");
  writeFileSync(file, JSON.stringify(ticket(head, { approval_status: "DRAFT" })));
  const result = spawnSync(process.execPath, ["tools/xeng.mjs", "ticket-preflight", "--target", target, "--ticket", file, "--json"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(result.status, 2);
  const report = JSON.parse(result.stdout);
  assert.equal(report.kind, "TICKET_PREFLIGHT");
  assert.equal(report.harnessReady, false);
}));
