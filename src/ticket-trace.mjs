const HEX40 = /^[0-9a-f]{40}$/;
const array = value => Array.isArray(value) ? value : [];
const identity = value => typeof value === "string" ? value.trim() : "";
const ticketAcIds = ticket => {
  const explicit = ticket?.accepted_AC_ids ?? ticket?.accepted_ac_ids;
  if (Array.isArray(explicit)) return explicit.map(identity).filter(Boolean);
  return array(ticket?.accepted_AC).map(identity).filter(value => /^AC-[A-Za-z0-9._-]+$/.test(value));
};

/** Deterministic cross-reference checker. It reports claims; it never promotes evidence. */
export function traceTicketEvidence({ spec, tickets = [], tests = [], receipts = [], headSha } = {}) {
  const specId = identity(spec?.spec_id ?? spec?.specId);
  const acs = array(spec?.acceptanceCriteria ?? spec?.acceptance_criteria ?? spec?.accepted_AC);
  const acIds = acs.map(ac => identity(typeof ac === "string" ? ac : ac?.ac_id ?? ac?.id)).filter(Boolean);
  const ticketList = array(tickets);
  const testList = array(tests);
  const receiptList = array(receipts);
  const ticketsById = new Map(ticketList.filter(ticket => identity(ticket?.ticket_id)).map(ticket => [ticket.ticket_id, ticket]));
  const receiptsById = new Map(receiptList.filter(receipt => identity(receipt?.receiptId ?? receipt?.receipt_id)).map(receipt => [receipt.receiptId ?? receipt.receipt_id, receipt]));
  const issues = [];
  const add = (code, detail, severity = "BLOCKING") => issues.push({ code, severity, detail });

  if (!specId) add("SPEC_ID_MISSING", "Spec identity is missing.");
  if (!acIds.length) add("AC_LIST_MISSING", "Spec has no identifiable acceptance criteria.");
  if (!HEX40.test(headSha ?? "")) add("HEAD_SHA_INVALID", "Current headSha must be a 40-character Git SHA.");
  for (const test of testList) {
    const testId = identity(test?.test_id ?? test?.testId) || "<missing-id>";
    const ticketId = identity(test?.ticket_id ?? test?.ticketId);
    if (ticketId && !ticketsById.has(ticketId)) add("TICKET_NOT_FOUND", `Test ${testId} references missing Ticket ${ticketId}.`);
    const receiptId = identity(test?.receiptId ?? test?.receipt_id);
    if (!receiptId || !receiptsById.has(receiptId)) add("RECEIPT_MISSING", `Test ${testId} has no matching receipt.`);
  }
  for (const ticket of ticketList) {
    for (const dependencyId of array(ticket?.blocked_by)) {
      const dependency = ticketsById.get(dependencyId);
      if (!dependency || dependency.status !== "VERIFIED")
        add("DEPENDENCY_INCOMPLETE", `Ticket ${ticket.ticket_id} depends on ${dependencyId}, which is missing or not declared VERIFIED.`);
    }
  }

  const rows = acIds.map(acId => {
    const candidates = ticketList.filter(ticket => ticket?.spec_id === specId && ticketAcIds(ticket).includes(acId));
    if (!candidates.length) {
      add("AC_MAPPING_MISSING", `Acceptance criterion ${acId} has no Ticket mapping.`);
      return { acId, chain: { specId, acId, ticketId: null, testId: null, receiptId: null, gitSha: null } };
    }
    if (candidates.length > 1) add("AC_MAPPING_AMBIGUOUS", `Acceptance criterion ${acId} maps to multiple Tickets.`);
    const ticket = candidates[0];
    const matchingTests = testList.filter(item => (item.ticket_id ?? item.ticketId) === ticket.ticket_id && array(item.accepted_AC_ids ?? item.accepted_ac_ids).includes(acId));
    if (!matchingTests.length) {
      add("TEST_MISSING", `Ticket ${ticket.ticket_id} has no Test mapped to ${acId}.`);
      return { acId, chain: { specId, acId, ticketId: ticket.ticket_id, testId: null, receiptId: null, gitSha: null } };
    }
    const item = matchingTests[0];
    const testId = identity(item.test_id ?? item.testId);
    if (!testId) add("TEST_ID_MISSING", `Test mapped to ${acId} has no Test ID.`);
    if (item.execution !== "COMPLETED") add("TEST_NOT_EXECUTED", `Test ${testId || "<missing-id>"} was not completed.`);
    else if (item.status !== "PASSED" || item.exitCode !== 0)
      add("TEST_FAILED", `Test ${testId || "<missing-id>"} did not report PASSED with exit code 0.`);

    const receiptId = identity(item.receiptId ?? item.receipt_id);
    const receipt = receiptId ? receiptsById.get(receiptId) : null;
    if (!receipt) {
      return { acId, chain: { specId, acId, ticketId: ticket.ticket_id, testId: testId || null, receiptId: receiptId || null, gitSha: null } };
    }
    const gitSha = identity(receipt.gitSha ?? receipt.baseSha ?? receipt.base_sha);
    if (receipt.ticketId !== ticket.ticket_id || receipt.specId !== specId)
      add("RECEIPT_IDENTITY_MISMATCH", `Receipt ${receiptId} does not match Ticket ${ticket.ticket_id} and Spec ${specId}.`);
    if (!HEX40.test(gitSha) || gitSha !== ticket.base_sha || (headSha && gitSha !== headSha))
      add("RECEIPT_SHA_MISMATCH", `Receipt ${receiptId} SHA does not match the Ticket baseline and supplied current SHA.`);
    if (!identity(receipt.artifact ?? receipt.path)) add("EVIDENCE_ARTIFACT_MISSING", `Receipt ${receiptId} has no evidence artifact reference.`);
    add("EVIDENCE_UNTRUSTED", `Receipt ${receiptId} is an untrusted claim; no trust promotion is performed.`, "WARNING");
    return { acId, chain: { specId, acId, ticketId: ticket.ticket_id, testId: testId || null, receiptId, gitSha: gitSha || null } };
  });

  const mappingComplete = acIds.length > 0 && !issues.some(issue => issue.severity === "BLOCKING");
  return Object.freeze({
    schemaVersion: 1, kind: "SPEC_TICKET_TRACE",
    status: mappingComplete ? "TRACE_COMPLETE_UNTRUSTED" : "TRACE_INCOMPLETE",
    specId: specId || null, headSha: headSha ?? "UNKNOWN", mappingComplete,
    trusted: false, promotion: "NONE", rows, issues,
    note: "This report checks declared links only. Receipt claims are never promoted to VERIFIED or consumer acceptance."
  });
}
