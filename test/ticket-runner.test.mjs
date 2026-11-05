import { createHash } from "node:crypto";
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { runTicketFixture, classifyFixtureOutcome, verifyTicketReceiptIntegrity, FIXTURE_COMMAND, FIXTURE_PATH, FIXTURE_PAYLOAD } from "../src/ticket-runner.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
async function fixture(fn) {
  const base = mkdtempSync(join(tmpdir(), "xeng-ticket-runner-"));
  const target = join(base, "repo");
  mkdirSync(target);
  const git = (...args) => spawnSync("git", ["-C", target, ...args], { encoding: "utf8" });
  try {
    assert.equal(git("init", "-q").status, 0);
    assert.equal(git("config", "user.email", "fixture@example.invalid").status, 0);
    assert.equal(git("config", "user.name", "Fixture").status, 0);
    mkdirSync(join(target, "test", "fixtures"), { recursive: true });
    writeFileSync(join(target, FIXTURE_PATH), JSON.stringify(FIXTURE_PAYLOAD) + "\n");
    assert.equal(git("add", ".").status, 0);
    assert.equal(git("commit", "-qm", "fixture").status, 0);
    const head = git("rev-parse", "HEAD").stdout.trim();
    return await fn({ base, target, head });
  } finally { rmSync(base, { recursive: true, force: true }); }
}
function ticket(head, overrides = {}) {
  return {
    ticket_id: "SMOKE-01", spec_id: "SANDBOX-SMOKE", base_sha: head,
    approval_status: "APPROVED", approved_by: "fixture-owner", approved_at: "2026-11-05T12:00:00Z",
    accepted_AC: ["AC-01: the fixed sandbox smoke fixture reports its isolation assertions"],
    blocked_by: [], allowed_files: [FIXTURE_PATH], allowed_commands: [FIXTURE_COMMAND],
    iteration_budget: { maxAttemptsPerTicket: 1, maxReviewFixRounds: 1 },
    time_budget: "1 minute", external_cost_budget: "0", stop_conditions: ["Stop on any isolation assertion failure"] ,
    ...overrides
  };
}

test("fixture outcome classifier distinguishes successful, blocked, failed, and terminated states", () => {
  const report = {
    fixture: "sandbox-smoke-v1", result: "PASS", uid: 65534, host_mount_visible: false,
    runtime_read_only: true, no_new_privs: true,
    resource_limits: {
      addressSpaceBytes: [268435456, 268435456], cpuSeconds: [10, 10], processes: [16, 16],
      fileBytes: [1048576, 1048576], openFiles: [64, 64]
    }
  };
  assert.equal(classifyFixtureOutcome({ status: 0, stdout: "" }, report).status, "PASSED_UNTRUSTED_FIXTURE");
  assert.equal(classifyFixtureOutcome({ status: 127, stderr: "bwrap: not found" }, null).status, "BLOCKED_ISOLATION_UNAVAILABLE");
  assert.equal(classifyFixtureOutcome({ status: 0 }, null).status, "BLOCKED_SANDBOX_ASSERTION");
  assert.equal(classifyFixtureOutcome({ status: 1, stderr: "assertion failed" }, null).status, "FAILED");
  assert.equal(classifyFixtureOutcome({ status: null, error: { code: "ETIMEDOUT" } }, null).status, "TIMEOUT");
});

test("ticket runner defaults to a non-executing dry run", () => fixture(async ({ target, head, base }) => {
  const result = await runTicketFixture({ target, ticket: ticket(head) });
  assert.equal(result.status, "DRY_RUN");
  assert.equal(result.execution, "NOT_RUN");
  assert.equal(result.harnessReady, false);
  assert.deepEqual(result.commandPolicy.executedArgv, []);
  assert.equal(existsSync(join(base, "evidence")), false);
}));

test("ticket runner rejects arbitrary commands and file scopes", () => fixture(async ({ target, head }) => {
  const arbitrary = await runTicketFixture({ target, ticket: ticket(head, { allowed_commands: ["node --test test/whatever.test.mjs"] }) });
  assert.equal(arbitrary.status, "BLOCKED_COMMAND_NOT_ALLOWLISTED");
  const outsideScope = await runTicketFixture({ target, ticket: ticket(head, { allowed_files: ["src/other.mjs"] }) });
  assert.equal(outsideScope.status, "BLOCKED_FILE_SCOPE");
  const multipleAttempts = await runTicketFixture({ target, ticket: ticket(head, { iteration_budget: { maxAttemptsPerTicket: 2, maxReviewFixRounds: 1 } }) });
  assert.equal(multipleAttempts.status, "BLOCKED_BUDGET");
}));

test("ticket runner preserves an incomplete reservation and blocks automatic recovery", () => fixture(async ({ target, head, base }) => {
  const evidenceDir = join(base, "evidence");
  mkdirSync(evidenceDir);
  const lockPath = join(evidenceDir, `SMOKE-01-${head}.json.lock`);
  const interrupted = JSON.stringify({ status: "RUNNING", ticketId: "SMOKE-01", baseSha: head });
  writeFileSync(lockPath, interrupted);
  const result = await runTicketFixture({ target, ticket: ticket(head), execute: true, confirmReviewed: true, evidenceDir });
  assert.equal(result.status, "BLOCKED_PRIOR_RUN_INCOMPLETE");
  assert.equal(readFileSync(lockPath, "utf8"), interrupted);
  assert.equal(existsSync(join(evidenceDir, `SMOKE-01-${head}.json`)), false);
}));

test("ticket runner records an actual isolated fixture PASS and rejects repetition", () => fixture(async ({ target, head, base }) => {
  const evidenceDir = join(base, "evidence");
  mkdirSync(evidenceDir);
  const approvedTicket = ticket(head);
  const first = await runTicketFixture({ target, ticket: approvedTicket, execute: true, confirmReviewed: true, evidenceDir });
  assert.equal(first.status, "PASSED_UNTRUSTED_FIXTURE", JSON.stringify(first));
  assert.equal(first.execution, "COMPLETED");
  assert.equal(first.evidence.exitCode, 0);
  assert.equal(first.evidence.result, "PASS");
  assert.equal(first.evidence.evidenceState, "UNTRUSTED");
  assert.equal(first.evidence.promotion, "NONE");
  assert.equal(first.sandbox.status, "CAPABILITIES_ASSERTED_BY_FIXTURE");
  assert.deepEqual(first.sandbox.report.network_interfaces, ["lo"]);
  assert.deepEqual(first.sandbox.report.resource_limits, {
    addressSpaceBytes: [268435456, 268435456], cpuSeconds: [10, 10], processes: [16, 16],
    fileBytes: [1048576, 1048576], openFiles: [64, 64]
  });
  assert.equal(first.evidence.environment.kernel, first.sandbox.report.kernel);

  const parsed = JSON.parse(readFileSync(first.receiptPath, "utf8"));
  assert.equal(parsed.status, "PASSED_UNTRUSTED_FIXTURE");
  assert.equal(verifyTicketReceiptIntegrity(parsed).valid, true);
  assert.equal(verifyTicketReceiptIntegrity({ ...parsed, status: "FAILED" }).reason, "INTEGRITY_MISMATCH");
  assert.deepEqual(readdirSync(evidenceDir), [basename(first.receiptPath)]);
  assert.equal(parsed.ticketId, "SMOKE-01");
  assert.equal(parsed.specId, "SANDBOX-SMOKE");
  assert.equal(parsed.baseSha, head);
  assert.equal(parsed.harnessReady, false);
  assert.equal(parsed.evidence.gitSha, head);
  assert.equal(parsed.evidence.ticketSha256, createHash("sha256").update(JSON.stringify(approvedTicket)).digest("hex"));
  assert.equal(parsed.evidence.version, 1);
  assert.equal(parsed.evidence.receiptPath, first.receiptPath);
  assert.equal(parsed.receiptReference.path, first.receiptPath);
  const { receiptIntegrity, ...receiptBody } = parsed;
  assert.equal(receiptIntegrity.algorithm, "sha256");
  assert.equal(receiptIntegrity.digest, createHash("sha256").update(JSON.stringify(receiptBody)).digest("hex"));
  assert.equal(parsed.evidence.evidenceState, "UNTRUSTED");
  assert.equal(parsed.evidence.promotion, "NONE");

  const second = await runTicketFixture({ target, ticket: approvedTicket, execute: true, confirmReviewed: true, evidenceDir });
  assert.equal(second.status, "BLOCKED_DUPLICATE_EXECUTION");
}));

test("ticket-run CLI accepts the dry-run command without changing existing CLI commands", () => fixture(async ({ target, head, base }) => {
  const ticketPath = join(base, "ticket.json");
  writeFileSync(ticketPath, JSON.stringify(ticket(head)));
  const result = spawnSync(process.execPath, ["tools/xeng.mjs", "ticket-run", "--target", target, "--ticket", ticketPath, "--json"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).status, "DRY_RUN");
}));

test("CLI syntax gate applies to xeng and legacy commands remain callable", () => {
  const syntax = spawnSync(process.execPath, ["--check", "tools/xeng.mjs"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(syntax.status, 0, syntax.stderr);
  const version = spawnSync(process.execPath, ["tools/xeng.mjs", "version"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(version.status, 0, version.stderr);
});
