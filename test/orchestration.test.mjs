import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  PROVIDERS, AGENT_RUNTIMES, PROVIDER_IDS, AGENT_RUNTIME_IDS,
  listProviders, getProvider, providerAgentMatrix,
  planHandoff, normalizeTicketContract, normalizeRepoPath, normalizeAllowedCommand,
  checkTicketSet, checkAssignments, normalizeExternalReceipt, verifyReceiptAgainstPlan,
  validateOrchestration, missingTicketFields, VERIFICATION
} from "../src/orchestration.mjs";
import { TICKET_CONTRACT_FIELDS } from "../src/delivery.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cli = (...args) => spawnSync(process.execPath, ["tools/xeng.mjs", ...args], { cwd: ROOT, encoding: "utf8" });

const SHA_A = "a".repeat(40);
const SHA_B = "b".repeat(40);

function ticket(overrides = {}) {
  return {
    ticket_id: "T01",
    spec_id: "demo-spec",
    base_sha: SHA_A,
    accepted_AC: ["AC1: approved ticket becomes a plan"],
    blocked_by: [],
    allowed_files: ["src/app.mjs", "test/orchestration.test.mjs"],
    allowed_commands: ["npm test", "node --test test/orchestration.test.mjs"],
    forbidden_actions: ["push", "deploy"],
    negative_tests: ["invalid receipt is rejected"],
    iteration_budget: { maxAttemptsPerTicket: 3, maxReviewFixRounds: 2 },
    time_budget: "60",
    external_cost_budget: "0",
    stop_conditions: ["two failed attempts with no new evidence"],
    rollback: "git revert HEAD",
    evidence_paths: ["evidence/"],
    reviewer: "independent-reviewer",
    ...overrides
  };
}

function withTemp(fn) {
  const dir = mkdtempSync(join(tmpdir(), "workbench-orch-"));
  try { return fn(dir); } finally { rmSync(dir, { recursive: true, force: true }); }
}

// ---------------------------------------------------------------- registry

test("registry contains four providers with honest verification states", () => {
  assert.equal(PROVIDERS.length, 4);
  assert.deepEqual([...PROVIDER_IDS].sort(), ["herdr", "multica", "orca", "tern"]);
  for (const p of PROVIDERS) {
    assert.ok(["P1", "P2", "P3"].includes(p.priority));
    assert.ok(p.license.trim());
    assert.match(p.source_url, /^https:\/\//);
    assert.ok(p.known_limitations.length > 0);
    assert.notEqual(p.license_status, VERIFICATION.VERIFIED_LOCAL);
    for (const platform of ["windows", "wsl2", "linux", "macos"]) assert.ok(p.platforms[platform]);
    for (const runtime of AGENT_RUNTIME_IDS) assert.ok(p.agent_runtimes[runtime]);
  }
  assert.equal(validateOrchestration().length, 0, validateOrchestration().join("; "));
});

test("Tern is blocked on Windows and Multica requires a licence review", () => {
  const tern = getProvider("tern");
  assert.equal(tern.platforms.windows, VERIFICATION.BLOCKED);
  assert.equal(tern.adapter_status, "DISABLED_CLOSED_BETA");
  const multica = getProvider("multica");
  assert.equal(multica.license_review, "REQUIRED");
  assert.match(multica.license, /additional conditions/i);
  assert.notEqual(multica.license, "Apache-2.0");
});

test("registry is readable without any external program", () => {
  const rows = listProviders();
  assert.equal(rows.length, 4);
  assert.equal(getProvider("nope"), null);
  const matrix = providerAgentMatrix();
  assert.equal(matrix.length, 4);
  for (const row of matrix) assert.ok(row.omp);
});

test("canonical ticket contract is the only field list", () => {
  const contract = normalizeTicketContract({});
  for (const field of TICKET_CONTRACT_FIELDS) assert.ok(Object.hasOwn(contract, field), field);
  assert.deepEqual(missingTicketFields(ticket()).filter(f => f !== "blocked_by"), []);
  assert.equal(missingTicketFields(normalizeTicketContract({})).length > 0, true);
});

// ---------------------------------------------------------------- plans

test("a complete ticket becomes a ready PLAN_ONLY handoff for Orca + OMP", () => {
  const plan = planHandoff({ providerId: "orca", agentRuntime: "omp", ticket: ticket(), projectId: "demo-spec", repository: "demo/repo" });
  assert.equal(plan.status, "PLAN_ONLY_READY");
  assert.equal(plan.kind, "ORCHESTRATION_HANDOFF_PLAN");
  assert.equal(plan.execution_mode, "DRY_RUN");
  assert.equal(plan.verification_status, "NOT_RUN");
  assert.equal(plan.permission_scope.push, false);
  assert.equal(plan.permission_scope.merge, false);
  assert.equal(plan.workspace_policy.isolation, "GIT_WORKTREE");
  assert.match(plan.evidence_reference, /^orchestration:\/\/orca\/T01\//);
  assert.ok(plan.non_actions.some(x => /No process was spawned/.test(x)));
  for (const field of TICKET_CONTRACT_FIELDS) assert.ok(Object.hasOwn(plan.task_contract, field));
});

test("an incomplete ticket stays incomplete, never ready", () => {
  const plan = planHandoff({ providerId: "herdr", agentRuntime: "omp", ticket: {} });
  assert.equal(plan.status, "PLAN_ONLY_INCOMPLETE");
  assert.notEqual(plan.verification_status, "VERIFIED");
});

test("unsupported provider/platform combinations are rejected, not planned as success", () => {
  const plan = planHandoff({ providerId: "tern", agentRuntime: "omp", ticket: ticket() });
  assert.equal(plan.status, "BLOCKED");
  assert.ok(plan.blocked_reasons.some(r => /not available on windows/.test(r)));
});

test("Multica plans but reports a pending licence review and no executable adapter", () => {
  const plan = planHandoff({ providerId: "multica", agentRuntime: "omp", ticket: ticket() });
  assert.equal(plan.status, "PLAN_ONLY_READY");
  assert.ok(plan.warnings.some(w => /licence review/i.test(w)));
  assert.equal(plan.runtime_invocation.status, "DISABLED_PENDING_LICENSE_REVIEW");
});

test("two providers produce the same core contract for the same ticket", () => {
  const a = planHandoff({ providerId: "orca", agentRuntime: "omp", ticket: ticket() });
  const b = planHandoff({ providerId: "herdr", agentRuntime: "omp", ticket: ticket() });
  assert.deepEqual(a.task_contract, b.task_contract);
  assert.equal(a.workspace_policy.conflict_policy, b.workspace_policy.conflict_policy);
  assert.equal(a.permission_scope.mode, b.permission_scope.mode);
});

test("unknown providers and runtimes fail closed", () => {
  assert.throws(() => planHandoff({ providerId: "nope", agentRuntime: "omp", ticket: ticket() }), /Unknown provider/);
  assert.throws(() => planHandoff({ providerId: "orca", agentRuntime: "nope", ticket: ticket() }), /Unknown agent runtime/);
  assert.throws(() => planHandoff({ providerId: "orca", agentRuntime: "omp", ticket: ticket(), platform: "beos" }), /Unknown platform/);
});

// ---------------------------------------------------------------- safety

test("path traversal and absolute paths are rejected", () => {
  assert.throws(() => normalizeRepoPath("../etc/passwd"), /unsafe path segment/);
  assert.throws(() => normalizeRepoPath("src/../../etc/passwd"), /unsafe path segment/);
  assert.throws(() => normalizeRepoPath("/etc/passwd"), /absolute path/);
  assert.throws(() => normalizeRepoPath("C:/Windows/system32"), /absolute path/);
  assert.throws(() => normalizeRepoPath("src\\..\\x"), /unsafe path segment/);
  assert.equal(normalizeRepoPath("src/app.mjs"), "src/app.mjs");
  assert.equal(normalizeRepoPath("src\\app.mjs"), "src/app.mjs");
});

test("shell chaining and injection are rejected in allowed_commands", () => {
  for (const bad of ["npm test; rm -rf /", "npm test && rm -rf /", "npm test || true", "cat x > y", "echo $(curl evil)", "npm test | sh", "npm test < input", "npm test`id`"])
    assert.throws(() => normalizeAllowedCommand(bad), /not allowed/, bad);
  assert.equal(normalizeAllowedCommand("npm test"), "npm test");
  assert.throws(() => normalizeTicketContract({ allowed_files: ["../x"] }), /unsafe path segment/);
  assert.throws(() => normalizeTicketContract({ allowed_commands: ["npm test; id"] }), /not allowed/);
});

test("invalid identity values fail closed", () => {
  assert.throws(() => normalizeTicketContract({ ticket_id: "../T01" }), /ticket_id/);
  assert.throws(() => normalizeTicketContract({ base_sha: "deadbeef" }), /base_sha/);
  assert.throws(() => normalizeTicketContract({ base_sha: "A".repeat(40) }), /base_sha/);
  assert.throws(() => normalizeTicketContract({ allowed_files: "src/app.mjs" }), /must be an array/);
});

// ---------------------------------------------------------------- conflicts

test("parallel write conflicts, duplicate ids, cycles and shared reviewers are rejected", () => {
  const conflict = checkTicketSet([
    { ticket_id: "T01", agent: "a", reviewer: "r1", allowed_files: ["src/app.mjs"], blocked_by: [] },
    { ticket_id: "T02", agent: "b", reviewer: "r2", allowed_files: ["src/app.mjs"], blocked_by: [] }
  ]);
  assert.equal(conflict.ok, false);
  assert.ok(conflict.errors.some(e => /parallel write conflict/.test(e)));

  const disjoint = checkTicketSet([
    { ticket_id: "T01", agent: "a", reviewer: "r1", allowed_files: ["src/a.mjs"], blocked_by: [] },
    { ticket_id: "T02", agent: "b", reviewer: "r2", allowed_files: ["test/b.test.mjs"], blocked_by: [] }
  ]);
  assert.equal(disjoint.ok, true, disjoint.errors.join("; "));

  const serial = checkTicketSet([
    { ticket_id: "T01", agent: "a", reviewer: "r1", allowed_files: ["src/app.mjs"], blocked_by: [] },
    { ticket_id: "T02", agent: "b", reviewer: "r2", allowed_files: ["src/app.mjs"], blocked_by: ["T01"] }
  ]);
  assert.equal(serial.ok, true, serial.errors.join("; "));

  const duplicate = checkTicketSet([
    { ticket_id: "T01", agent: "a", reviewer: "r1", allowed_files: ["src/a"], blocked_by: [] },
    { ticket_id: "T01", agent: "b", reviewer: "r2", allowed_files: ["src/b"], blocked_by: [] }
  ]);
  assert.ok(duplicate.errors.some(e => /duplicate ticket_id/.test(e)));

  const cycle = checkTicketSet([
    { ticket_id: "T01", agent: "a", reviewer: "r1", allowed_files: ["src/a"], blocked_by: ["T02"] },
    { ticket_id: "T02", agent: "b", reviewer: "r2", allowed_files: ["src/b"], blocked_by: ["T01"] }
  ]);
  assert.ok(cycle.errors.some(e => /cycle/.test(e)));

  const sameReviewer = checkTicketSet([
    { ticket_id: "T01", agent: "same", reviewer: "same", allowed_files: ["src/a"], blocked_by: [] }
  ]);
  assert.ok(sameReviewer.errors.some(e => /same agent as writer and reviewer/.test(e)));

  const twoWriters = checkTicketSet([
    { ticket_id: "T01", agents: ["a", "b"], reviewer: "r", allowed_files: ["src/a"], blocked_by: [] }
  ]);
  assert.ok(twoWriters.errors.some(e => /more than one active writer/.test(e)));
});

test("only one active writer per ticket, and the reviewer must differ", () => {
  const twoWriters = checkAssignments([
    { ticket_id: "T01", role: "writer", provider_id: "orca", agent_runtime: "omp", status: "RUNNING" },
    { ticket_id: "T01", role: "writer", provider_id: "herdr", agent_runtime: "codex", status: "PENDING" }
  ]);
  assert.equal(twoWriters.ok, false);

  const same = checkAssignments([
    { ticket_id: "T01", role: "writer", provider_id: "orca", agent_runtime: "omp", status: "RUNNING" },
    { ticket_id: "T01", role: "reviewer", provider_id: "orca", agent_runtime: "omp", status: "RUNNING" }
  ]);
  assert.equal(same.ok, false);

  const done = checkAssignments([
    { ticket_id: "T01", role: "writer", provider_id: "orca", agent_runtime: "omp", status: "DONE" },
    { ticket_id: "T01", role: "writer", provider_id: "herdr", agent_runtime: "omp", status: "RUNNING" }
  ]);
  assert.equal(done.ok, true, done.errors.join("; "));
});

// ---------------------------------------------------------------- receipts

const validReceipt = () => ({
  schemaVersion: 1,
  kind: "EXTERNAL_EXECUTION_RECEIPT",
  provider_id: "orca",
  provider_version: "bbd324a57a368e0381fe3f38804518ac46bfa4b6",
  agent_runtime: "omp",
  ticket_id: "T01",
  project_id: "demo-spec",
  repository: "demo/repo",
  base_sha: SHA_A,
  head_sha: SHA_B,
  operation: "run tests",
  command: "npm test",
  exit_code: 0,
  result: "154 tests passed",
  artifact: "evidence/test-output.txt",
  started_at: "2026-10-31T12:00:00Z",
  finished_at: "2026-10-31T12:01:00Z",
  environment: "orca/omp/windows"
});

test("external receipts stay UNTRUSTED and never promote to VERIFIED", () => {
  const receipt = normalizeExternalReceipt(validReceipt());
  assert.equal(receipt.trust, "UNTRUSTED");
  assert.equal(receipt.evidence_state, "UNKNOWN");
  assert.equal(receipt.promotion, "NONE");
  assert.match(receipt.note, /not a verified test result or acceptance/);
});

test("a receipt that self-declares trust or VERIFIED is rejected", () => {
  assert.throws(() => normalizeExternalReceipt({ ...validReceipt(), trust: "VERIFIED" }), /cannot self-declare trust/);
  assert.throws(() => normalizeExternalReceipt({ ...validReceipt(), evidence_state: "VERIFIED" }), /cannot self-declare VERIFIED/);
  assert.throws(() => normalizeExternalReceipt({ ...validReceipt(), provider_id: "nope" }), /unknown provider/);
  assert.throws(() => normalizeExternalReceipt({ ...validReceipt(), base_sha: "short" }), /base_sha/);
});

test("receipt identity is checked against the plan without verifying content", () => {
  const plan = planHandoff({ providerId: "orca", agentRuntime: "omp", ticket: ticket(), projectId: "demo-spec" });
  const ok = verifyReceiptAgainstPlan(validReceipt(), plan);
  assert.equal(ok.ok, true);
  assert.equal(ok.trust, "UNTRUSTED");

  const wrong = verifyReceiptAgainstPlan({ ...validReceipt(), base_sha: SHA_B }, plan);
  assert.equal(wrong.ok, false);
  assert.ok(wrong.mismatches.some(m => /base_sha/.test(m)));
});

// ---------------------------------------------------------------- CLI

test("CLI list is read-only JSON with four providers", () => {
  const a = cli("orchestrator", "list", "--json");
  assert.equal(a.status, 0, a.stderr);
  const out = JSON.parse(a.stdout);
  assert.equal(out.providers.length, 4);
  assert.equal(out.status, "READ_ONLY");
  const b = cli("orchestrator", "list", "--json");
  assert.equal(b.stdout, a.stdout);
});

test("CLI doctor reports missing providers honestly and never claims a real test", () => {
  const r = cli("orchestrator", "doctor", "--json");
  const out = JSON.parse(r.stdout);
  assert.equal(out.real_provider_tested, false);
  assert.ok(Array.isArray(out.providers));
  assert.equal(out.providers.length, 4);
  assert.equal(out.missing_providers.length === 0, out.status === "PROVIDERS_PRESENT");
  if (out.missing_providers.length) assert.equal(r.status, 1);
  for (const row of out.providers) assert.ok(["INSTALLED", "NOT_INSTALLED"].includes(row.install.status));
});

test("CLI plan writes a ready plan for a valid ticket and blocks Tern", () => withTemp(dir => {
  const ticketFile = join(dir, "ticket.json");
  writeFileSync(ticketFile, JSON.stringify(ticket()));
  const ok = cli("orchestrator", "plan", "--provider", "orca", "--agent", "omp", "--ticket", ticketFile, "--json");
  assert.equal(ok.status, 0, ok.stderr);
  const plan = JSON.parse(ok.stdout);
  assert.equal(plan.status, "PLAN_ONLY_READY");
  assert.equal(plan.execution_mode, "DRY_RUN");

  const blocked = cli("orchestrator", "plan", "--provider", "tern", "--agent", "omp", "--json");
  assert.equal(blocked.status, 2);
  assert.equal(JSON.parse(blocked.stdout).status, "BLOCKED");

  assert.equal(existsSync(join(ROOT, "evidence")), false);
}));

test("CLI plan rejects unsafe ticket files and bad flags", () => withTemp(dir => {
  const unsafe = join(dir, "unsafe.json");
  writeFileSync(unsafe, JSON.stringify(ticket({ allowed_files: ["../escape"] })));
  const traversal = cli("orchestrator", "plan", "--provider", "orca", "--agent", "omp", "--ticket", unsafe);
  assert.equal(traversal.status, 2);
  assert.match(traversal.stderr, /unsafe path segment/);

  const unknownProvider = cli("orchestrator", "plan", "--provider", "nope", "--agent", "omp");
  assert.equal(unknownProvider.status, 2);
  assert.match(unknownProvider.stderr, /Unknown provider/);

  const missing = cli("orchestrator", "plan", "--provider", "orca");
  assert.equal(missing.status, 2);
}));

test("CLI receipt imports untrusted evidence and fails on identity mismatch", () => withTemp(dir => {
  const planFile = join(dir, "plan.json");
  const plan = planHandoff({ providerId: "orca", agentRuntime: "omp", ticket: ticket(), projectId: "demo-spec" });
  writeFileSync(planFile, JSON.stringify(plan));
  const receiptFile = join(dir, "receipt.json");
  writeFileSync(receiptFile, JSON.stringify(validReceipt()));

  const ok = cli("orchestrator", "receipt", "--file", receiptFile, "--plan", planFile, "--json");
  assert.equal(ok.status, 0, ok.stderr);
  const out = JSON.parse(ok.stdout);
  assert.equal(out.receipt.trust, "UNTRUSTED");
  assert.equal(out.receipt.promotion, "NONE");
  assert.equal(out.verification.ok, true);
  assert.equal(out.real_provider_tested, false);

  writeFileSync(receiptFile, JSON.stringify({ ...validReceipt(), base_sha: SHA_B }));
  const mismatch = cli("orchestrator", "receipt", "--file", receiptFile, "--plan", planFile, "--json");
  assert.equal(mismatch.status, 2);
  assert.equal(JSON.parse(mismatch.stdout).verification.ok, false);

  writeFileSync(receiptFile, JSON.stringify({ ...validReceipt(), evidence_state: "VERIFIED" }));
  const selfVerified = cli("orchestrator", "receipt", "--file", receiptFile);
  assert.equal(selfVerified.status, 2);
  assert.match(selfVerified.stderr, /cannot self-declare VERIFIED/);
}));

test("existing help still lists the new command and no legacy Python CLI", () => {
  const help = cli("--help");
  assert.equal(help.status, 0);
  assert.match(help.stdout, /orchestrator list\|doctor\|plan\|receipt/);
  assert.doesNotMatch(help.stdout, /xeng\.py/);
});
