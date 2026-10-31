// Evidence model. A state can only advance with a matching, inspectable record.
import { EVIDENCE_STATES, EVIDENCE_KINDS, EVIDENCE_LAYERS, STAGE_IDS } from "./catalog.mjs";
import { identityChain } from "./evidence-identity.mjs";

export const TRANSITIONS = Object.freeze({
  NOT_RUN: ["IN_PROGRESS", "BLOCKED"],
  IN_PROGRESS: ["BLOCKED", "UNKNOWN", "VERIFIED"],
  BLOCKED: ["IN_PROGRESS", "UNKNOWN"],
  UNKNOWN: ["IN_PROGRESS", "BLOCKED"],
  VERIFIED: []
});

// Only executed layers can back a VERIFIED claim. NOT_RUN is a placeholder.
export const EXECUTED_LAYERS = Object.freeze(["LOCAL_TESTED", "CI_VERIFIED", "RELEASED", "ACCEPTED"]);

const cap = (v, max) => String(v ?? "").replace(/\0/g, "").trim().slice(0, max);

export function canPromote(from, to) {
  if (!EVIDENCE_STATES.includes(from) || !EVIDENCE_STATES.includes(to)) return false;
  return (TRANSITIONS[from] ?? []).includes(to);
}

export function hasInspectableProof(record) {
  return ["command", "result", "artifact"].every(
    key => typeof record?.[key] === "string" && record[key].trim().length > 0
  );
}

export function transition(record, to) {
  if (!record) throw new Error("Evidence record required");
  if (!canPromote(record.state, to))
    throw new Error("Illegal evidence transition " + record.state + " -> " + to + " (no silent promotion)");
  if (to === "VERIFIED") {
    if (!hasInspectableProof(record))
      throw new Error("VERIFIED requires command, result and artifact");
    if (!EXECUTED_LAYERS.includes(record.layer))
      throw new Error("VERIFIED requires an executed layer, not " + (record.layer ?? "NOT_RUN"));
  }
  return { ...record, state: to, history: [...(record.history ?? []), { from: record.state, to, at: "UNRECORDED" }] };
}

export function normalizeEvidenceReport(input) {
  if (!input || typeof input !== "object" || input.schemaVersion !== 1 ||
      input.kind !== "LOCAL_EVIDENCE_REPORT" || input.status !== "IMPORTED_NOT_TRUSTED")
    throw new Error("Not a supported local Workbench evidence report");
  if (!Array.isArray(input.items) || input.items.length > 200)
    throw new Error("Invalid evidence items");
  const items = input.items.map((item, i) => {
    if (!item || typeof item !== "object") throw new Error("Invalid evidence item " + i);
    if (!STAGE_IDS.includes(item.stage)) throw new Error("Unknown stage in evidence item " + i);
    if (!EVIDENCE_KINDS.includes(item.kind)) throw new Error("Unknown evidence kind in item " + i);
    const layer = EVIDENCE_LAYERS.some(l => l.id === item.layer) ? item.layer : "NOT_RUN";
    if (!EVIDENCE_STATES.includes(item.state)) throw new Error("Unknown evidence state in item " + i);
    if (item.state === "VERIFIED" && (!item.command || !item.result || !item.artifact))
      throw new Error("VERIFIED evidence requires command, result and artifact");
    if (item.state === "VERIFIED" && !EXECUTED_LAYERS.includes(layer))
      throw new Error("VERIFIED evidence requires an executed layer");
    return {
      stage: item.stage, kind: item.kind, layer,
      state: item.state,
      command: cap(item.command, 500), result: cap(item.result, 500),
      artifact: cap(item.artifact, 500), recordedAt: cap(item.recordedAt, 40) || "UNRECORDED"
    };
  });
  const identities = input.identities === undefined ? [] : input.identities;
  if (!Array.isArray(identities) || identities.length > 50)
    throw new Error("Invalid evidence identities");
  const chain = identityChain(identities);
  return Object.freeze({
    schemaVersion: 1, kind: "LOCAL_EVIDENCE_REPORT", status: "IMPORTED_NOT_TRUSTED",
    source: "LOCAL_READ_ONLY_IMPORT",
    items,
    identities: chain.identities,
    identityChain: chain,
    note: "Imported evidence is a claim, not a verified fact. Code check, real environment and consumer acceptance are distinct layers."
  });
}

function emptyStageSummary(context) {
  return {
    state: "NOT_RUN",
    complete: false,
    conflict: false,
    missing: [],
    gates: [],
    items: [],
    observations: [],
    context
  };
}

// A stage is complete only when every required gate has its own VERIFIED item
// and nothing in the stage is blocked, unknown, not run or still in progress.
export function stageGateSummary(items, requiredKinds, context = "KNOWN") {
  if (context !== "KNOWN" || !Array.isArray(requiredKinds)) {
    return { ...emptyStageSummary("UNKNOWN"), items };
  }
  const gates = requiredKinds.map(kind => {
    const matching = items.filter(i => i.kind === kind);
    const verified = matching.filter(i => i.state === "VERIFIED");
    const blocking = matching.find(i => ["BLOCKED", "UNKNOWN", "NOT_RUN"].includes(i.state));
    return {
      kind,
      state: verified.length ? "VERIFIED" : (blocking?.state ?? matching[0]?.state ?? "NOT_RUN"),
      verified: verified.length,
      total: matching.length
    };
  });
  const relevant = items.filter(i => requiredKinds.includes(i.kind));
  const missing = gates.filter(g => g.verified === 0).map(g => g.kind);
  const blocked = relevant.some(i => i.state === "BLOCKED");
  const unknown = relevant.some(i => i.state === "UNKNOWN");
  const notRun = relevant.some(i => i.state === "NOT_RUN");
  const inProgress = relevant.some(i => i.state === "IN_PROGRESS");
  const verified = relevant.some(i => i.state === "VERIFIED");
  const conflict = blocked && verified;

  let state = "NOT_RUN";
  if (relevant.length) {
    if (blocked) state = "BLOCKED";
    else if (unknown) state = "UNKNOWN";
    else if (notRun) state = "NOT_RUN";
    else if (inProgress) state = "IN_PROGRESS";
    else if (missing.length === 0) state = "VERIFIED";
    else state = "UNKNOWN";
  }

  return {
    state,
    complete: relevant.length > 0 && missing.length === 0 && !blocked && !unknown && !notRun && !inProgress,
    conflict,
    missing,
    gates,
    items,
    observations: items.filter(i => !requiredKinds.includes(i.kind)),
    context: "KNOWN"
  };
}

export function evidenceSummary(report, options = {}) {
  const normalized = normalizeEvidenceReport(report);
  const requiredByStage = options.requiredByStage;
  const hasContext = requiredByStage && typeof requiredByStage === "object";
  const stages = {};
  for (const id of STAGE_IDS) {
    const items = normalized.items.filter(i => i.stage === id);
    if (!hasContext) {
      stages[id] = stageGateSummary(items, [], "UNKNOWN");
      continue;
    }
    const kinds = requiredByStage[id];
    stages[id] = stageGateSummary(items, Array.isArray(kinds) ? kinds : [], Array.isArray(kinds) ? "KNOWN" : "UNKNOWN");
  }
  return {
    stages, layers: EVIDENCE_LAYERS, items: normalized.items,
    identities: normalized.identities,
    identityStatus: normalized.identityChain.status,
    trusted: false, promotion: "NONE",
    context: hasContext ? "KNOWN" : "UNKNOWN",
    note: hasContext
      ? "Every state here is an untrusted claim. Completeness of a claim does not make it verified fact."
      : "Project context is missing. Stage completion stays NOT_RUN/UNKNOWN; no optimistic promotion."
  };
}

export function evidenceDisplayState(stage) {
  const state = EVIDENCE_STATES.includes(stage?.state) ? stage.state : "NOT_RUN";
  let note = "NO_EVIDENCE";
  if (stage?.context === "UNKNOWN") note = "CONTEXT_UNKNOWN";
  else if (stage?.conflict) note = "CONFLICT";
  else if (stage?.items?.length) {
    if (stage.complete) note = "CLAIM_COMPLETE_NOT_TRUSTED";
    else if (stage.missing?.length) note = "MISSING_GATES";
  }
  return { state, note, trusted: false };
}

export function emptyEvidenceReport() {
  return Object.freeze({
    schemaVersion: 1, kind: "LOCAL_EVIDENCE_REPORT", status: "IMPORTED_NOT_TRUSTED",
    source: "NONE", items: [], identities: [],
    note: "No evidence imported. Every stage stays NOT_RUN."
  });
}
