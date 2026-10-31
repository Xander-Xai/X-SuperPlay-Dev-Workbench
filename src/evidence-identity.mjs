// Evidence identity records. A digest is a record of what was hashed, not a
// verification claim. No record can promote a stage or replace execution.
export const EVIDENCE_IDENTITY_KINDS = Object.freeze([
  "reviewed_candidate",
  "built_artifact",
  "released_artifact",
  "runtime_receipt",
  "consumer_acceptance"
]);

const HEX64 = /^[0-9a-f]{64}$/;
const HEX40 = /^[0-9a-f]{40}$/;
const cap = (v, max) => String(v ?? "").replace(/\0/g, "").trim().slice(0, max);

export function normalizeIdentity(input, index = 0) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Invalid evidence identity " + index);
  if (!EVIDENCE_IDENTITY_KINDS.includes(input.kind))
    throw new Error("Unknown evidence identity kind " + index);
  if (input.algorithm !== "sha256")
    throw new Error("Evidence identity " + index + " must use sha256");
  if (!HEX64.test(input.digest ?? ""))
    throw new Error("Evidence identity " + index + " requires a 64-char sha256 digest");
  if (!HEX40.test(input.sourceCommit ?? ""))
    throw new Error("Evidence identity " + index + " requires a 40-char source commit");
  const locator = cap(input.locator, 500);
  if (!locator) throw new Error("Evidence identity " + index + " requires a locator");
  return Object.freeze({
    kind: input.kind,
    algorithm: "sha256",
    digest: input.digest,
    sourceCommit: input.sourceCommit,
    locator,
    recordedAt: cap(input.recordedAt, 40) || "UNRECORDED",
    trust: "RECORDED_NOT_TRUSTED"
  });
}

export function identityChain(inputs = [], options = {}) {
  if (!Array.isArray(inputs) || inputs.length > 50)
    throw new Error("Evidence identity chain must be an array of at most 50 records");
  const identities = inputs.map(normalizeIdentity);
  const commits = [...new Set(identities.map(x => x.sourceCommit))];
  if (options.sourceCommit && !HEX40.test(options.sourceCommit))
    throw new Error("Evidence identity chain sourceCommit must be 40 hex chars");
  if (options.sourceCommit && commits.some(c => c !== options.sourceCommit))
    throw new Error("Evidence identity chain mixes source commits");
  if (commits.length > 1) throw new Error("Evidence identity chain mixes source commits");
  const present = new Set(identities.map(x => x.kind));
  return Object.freeze({
    schemaVersion: 1,
    kind: "EVIDENCE_IDENTITY_CHAIN",
    status: "RECORDED_NOT_TRUSTED",
    sourceCommit: options.sourceCommit ?? commits[0] ?? "UNKNOWN",
    identities,
    missing: EVIDENCE_IDENTITY_KINDS.filter(k => !present.has(k)),
    note: "Digests prove byte identity only. They do not prove execution, review or acceptance."
  });
}
