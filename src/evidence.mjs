// Evidence model. A state can only advance with a matching, inspectable record.
import { EVIDENCE_STATES, EVIDENCE_KINDS, EVIDENCE_LAYERS, STAGE_IDS } from "./catalog.mjs";

export const TRANSITIONS = Object.freeze({
  NOT_RUN: ["IN_PROGRESS", "BLOCKED"],
  IN_PROGRESS: ["BLOCKED", "UNKNOWN", "VERIFIED"],
  BLOCKED: ["IN_PROGRESS", "UNKNOWN"],
  UNKNOWN: ["IN_PROGRESS", "BLOCKED"],
  VERIFIED: []
});

const cap = (v, max) => String(v ?? "").replace(/\0/g, "").trim().slice(0, max);

export function canPromote(from, to) {
  if (!EVIDENCE_STATES.includes(from) || !EVIDENCE_STATES.includes(to)) return false;
  return (TRANSITIONS[from] ?? []).includes(to);
}

export function transition(record, to) {
  if (!record) throw new Error("Evidence record required");
  if (!canPromote(record.state, to))
    throw new Error("Illegal evidence transition " + record.state + " -> " + to + " (no silent promotion)");
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
    return {
      stage: item.stage, kind: item.kind, layer,
      state: item.state,
      command: cap(item.command, 500), result: cap(item.result, 500),
      artifact: cap(item.artifact, 500), recordedAt: cap(item.recordedAt, 40) || "UNRECORDED"
    };
  });
  return Object.freeze({
    schemaVersion: 1, kind: "LOCAL_EVIDENCE_REPORT", status: "IMPORTED_NOT_TRUSTED",
    source: "LOCAL_READ_ONLY_IMPORT",
    items,
    note: "Imported evidence is a claim, not a verified fact. Code check, real environment and consumer acceptance are distinct layers."
  });
}

export function evidenceSummary(report) {
  const normalized = normalizeEvidenceReport(report);
  const stages = {};
  for (const id of STAGE_IDS) stages[id] = { state: "NOT_RUN", items: [] };
  for (const item of normalized.items) {
    stages[item.stage].items.push(item);
    const order = ["NOT_RUN", "BLOCKED", "IN_PROGRESS", "UNKNOWN", "VERIFIED"];
    if (order.indexOf(item.state) > order.indexOf(stages[item.stage].state))
      stages[item.stage].state = item.state;
  }
  return { stages, layers: EVIDENCE_LAYERS, items: normalized.items, trusted: false };
}

export function emptyEvidenceReport() {
  return Object.freeze({
    schemaVersion: 1, kind: "LOCAL_EVIDENCE_REPORT", status: "IMPORTED_NOT_TRUSTED",
    source: "NONE", items: [],
    note: "No evidence imported. Every stage stays NOT_RUN."
  });
}
