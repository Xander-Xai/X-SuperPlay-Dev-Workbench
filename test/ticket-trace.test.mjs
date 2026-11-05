import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { traceTicketEvidence } from "../src/ticket-trace.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

const SHA = "a".repeat(40);
const input = () => ({
  headSha: SHA,
  spec: { spec_id: "SPEC-1", acceptanceCriteria: [{ ac_id: "AC-1" }] },
  tickets: [{ ticket_id: "T-1", spec_id: "SPEC-1", base_sha: SHA, accepted_AC_ids: ["AC-1"], blocked_by: [], status: "READY" }],
  tests: [{ test_id: "TEST-1", ticket_id: "T-1", accepted_AC_ids: ["AC-1"], execution: "COMPLETED", exitCode: 0, status: "PASSED", receiptId: "R-1" }],
  receipts: [{ receiptId: "R-1", ticketId: "T-1", specId: "SPEC-1", gitSha: SHA, evidenceState: "UNTRUSTED", promotion: "NONE", artifact: "evidence/R-1.json" }]
});

test("trace maps Spec AC through Ticket, executed Test, receipt and matching SHA without promoting trust", () => {
  const report = traceTicketEvidence(input());
  assert.equal(report.status, "TRACE_COMPLETE_UNTRUSTED");
  assert.equal(report.mappingComplete, true);
  assert.equal(report.trusted, false);
  assert.equal(report.promotion, "NONE");
  assert.deepEqual(report.rows[0].chain, { specId: "SPEC-1", acId: "AC-1", ticketId: "T-1", testId: "TEST-1", receiptId: "R-1", gitSha: SHA });
  assert.ok(report.issues.some(issue => issue.code === "EVIDENCE_UNTRUSTED"));
});

test("trace diagnoses missing AC mapping, unknown ticket, unresolved dependency and absent evidence", () => {
  const data = input();
  data.tickets[0].accepted_AC_ids = [];
  data.tickets[0].blocked_by = ["T-MISSING"];
  data.tests[0].ticket_id = "T-UNKNOWN";
  data.receipts = [];
  const report = traceTicketEvidence(data);
  const codes = report.issues.map(issue => issue.code);
  assert.ok(codes.includes("AC_MAPPING_MISSING"));
  assert.ok(codes.includes("TICKET_NOT_FOUND"));
  assert.ok(codes.includes("DEPENDENCY_INCOMPLETE"));
  assert.ok(codes.includes("RECEIPT_MISSING"));
  assert.equal(report.mappingComplete, false);
});

test("trace rejects unexecuted tests and receipts bound to another SHA", () => {
  const data = input();
  data.tests[0].execution = "NOT_RUN";
  data.tests[0].exitCode = null;
  data.receipts[0].gitSha = "b".repeat(40);
  const report = traceTicketEvidence(data);
  const codes = report.issues.map(issue => issue.code);
  assert.ok(codes.includes("TEST_NOT_EXECUTED"));
  assert.ok(codes.includes("RECEIPT_SHA_MISMATCH"));
});

test("trace marks missing test identity and evidence artifact as incomplete", () => {
  const data = input();
  data.tests[0].test_id = "";
  data.receipts[0].artifact = "";
  const report = traceTicketEvidence(data);
  const codes = report.issues.map(issue => issue.code);
  assert.ok(codes.includes("TEST_ID_MISSING"));
  assert.ok(codes.includes("EVIDENCE_ARTIFACT_MISSING"));
});

test("trace requires an explicit current Git SHA", () => {
  const data = input();
  delete data.headSha;
  const report = traceTicketEvidence(data);
  assert.equal(report.status, "TRACE_INCOMPLETE");
  assert.ok(report.issues.some(issue => issue.code === "HEAD_SHA_INVALID"));
});

test("ticket-trace CLI reports untrusted mapping separately from incomplete mapping", () => {
  const dir = mkdtempSync(join(tmpdir(), "xeng-ticket-trace-"));
  const file = join(dir, "trace.json");
  try {
    writeFileSync(file, JSON.stringify(input()));
    const complete = spawnSync(process.execPath, [join(ROOT, "tools/xeng.mjs"), "ticket-trace", "--input", file, "--json"], { encoding: "utf8" });
    assert.equal(complete.status, 0, complete.stderr);
    assert.equal(JSON.parse(complete.stdout).status, "TRACE_COMPLETE_UNTRUSTED");

    const incomplete = input();
    incomplete.tests[0].execution = "NOT_RUN";
    writeFileSync(file, JSON.stringify(incomplete));
    const blocked = spawnSync(process.execPath, [join(ROOT, "tools/xeng.mjs"), "ticket-trace", "--input", file, "--json"], { encoding: "utf8" });
    assert.equal(blocked.status, 1, blocked.stderr);
    assert.equal(JSON.parse(blocked.stdout).status, "TRACE_INCOMPLETE");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
