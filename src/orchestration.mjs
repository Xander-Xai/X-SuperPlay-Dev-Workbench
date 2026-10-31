// Agent orchestration adapter registry.
//
// This module is a *capability registry and handoff planner*, not a runtime.
// It records what external multi-agent environments can do, as verified against
// upstream source and documentation on a fixed date, and turns one approved
// Workbench ticket into a reviewable PLAN_ONLY handoff.
//
// It never spawns a process, never builds a shell command from ticket fields and
// never promotes external output to VERIFIED. The canonical 11-stage lifecycle,
// the task router and the evidence state machine stay authoritative.
//
// Browser-safe: pure data + pure functions, no Node imports.

import { TICKET_CONTRACT_FIELDS, LOOP_DEFAULTS } from "./delivery.mjs";

export const VERIFICATION = Object.freeze({
  VERIFIED_UPSTREAM: "VERIFIED_UPSTREAM",
  VERIFIED_LOCAL: "VERIFIED_LOCAL",
  UNVERIFIED: "UNVERIFIED",
  UNSUPPORTED: "UNSUPPORTED",
  BLOCKED: "BLOCKED"
});

export const CAPABILITY = Object.freeze({
  SUPPORTED: "SUPPORTED",
  PARTIAL: "PARTIAL",
  UNSUPPORTED: "UNSUPPORTED",
  UNVERIFIED: "UNVERIFIED"
});

export const PLATFORM_IDS = Object.freeze(["windows", "wsl2", "linux", "macos"]);

const CAPABILITY_IDS = Object.freeze([
  "parallel_agents", "worktree_isolation", "agent_state", "session_resume",
  "task_dispatch", "failure_recovery", "cli", "api", "plugins", "hooks",
  "mcp", "custom_task_contract", "run_receipts", "independent_review",
  "human_approval", "cancel"
]);

const VERIFICATION_VALUES = Object.freeze(Object.values(VERIFICATION));
const CAPABILITY_VALUES = Object.freeze(Object.values(CAPABILITY));

// ---------------------------------------------------------------- agent runtimes
//
// These are the execution engines a provider can host. Only OMP is pinned and
// verified here; the other three are existing user workflows and are not
// redistributed or pinned by this repository.

export const AGENT_RUNTIMES = Object.freeze([
  Object.freeze({
    id: "omp",
    name: "Oh My Pi (OMP)",
    repo: "can1357/oh-my-pi",
    pinned_commit: "91afeb4385ad0bb07efef33b877057f8d1fb930b",
    release: "18.14.1",
    license: "MIT",
    license_status: VERIFICATION.VERIFIED_UPSTREAM,
    binary: "omp",
    verified_at: "2026-10-31",
    invocation: Object.freeze({
      headless: Object.freeze(["omp", "-p"]),
      rpc: Object.freeze(["omp", "--mode", "rpc"]),
      acp: Object.freeze(["omp", "acp"])
    }),
    platforms: Object.freeze({ windows: VERIFICATION.VERIFIED_UPSTREAM, wsl2: VERIFICATION.UNVERIFIED, linux: VERIFICATION.VERIFIED_UPSTREAM, macos: VERIFICATION.VERIFIED_UPSTREAM }),
    note: "Native Windows binary (no WSL bridge). `omp -p` answers one prompt and exits; `--mode rpc` speaks NDJSON. Workbench does not invoke either yet."
  }),
  Object.freeze({
    id: "claude-code",
    name: "Claude Code",
    repo: null,
    pinned_commit: null,
    release: "UNPINNED",
    license: "UNVERIFIED",
    license_status: VERIFICATION.UNVERIFIED,
    binary: "claude",
    verified_at: "NOT_PINNED",
    invocation: Object.freeze({}),
    platforms: Object.freeze({ windows: VERIFICATION.UNVERIFIED, wsl2: VERIFICATION.UNVERIFIED, linux: VERIFICATION.UNVERIFIED, macos: VERIFICATION.UNVERIFIED }),
    note: "Existing user workflow runtime; the registry only records the binary name. It does not pin, install or invoke it."
  }),
  Object.freeze({
    id: "codex",
    name: "Codex",
    repo: null,
    pinned_commit: null,
    release: "UNPINNED",
    license: "UNVERIFIED",
    license_status: VERIFICATION.UNVERIFIED,
    binary: "codex",
    verified_at: "NOT_PINNED",
    invocation: Object.freeze({}),
    platforms: Object.freeze({ windows: VERIFICATION.UNVERIFIED, wsl2: VERIFICATION.UNVERIFIED, linux: VERIFICATION.UNVERIFIED, macos: VERIFICATION.UNVERIFIED }),
    note: "Existing user workflow runtime; the registry only records the binary name. It does not pin, install or invoke it."
  }),
  Object.freeze({
    id: "opencode",
    name: "OpenCode",
    repo: null,
    pinned_commit: null,
    release: "UNPINNED",
    license: "UNVERIFIED",
    license_status: VERIFICATION.UNVERIFIED,
    binary: "opencode",
    verified_at: "NOT_PINNED",
    invocation: Object.freeze({}),
    platforms: Object.freeze({ windows: VERIFICATION.UNVERIFIED, wsl2: VERIFICATION.UNVERIFIED, linux: VERIFICATION.UNVERIFIED, macos: VERIFICATION.UNVERIFIED }),
    note: "Existing user workflow runtime; the registry only records the binary name. It does not pin, install or invoke it."
  })
]);

export const AGENT_RUNTIME_IDS = Object.freeze(AGENT_RUNTIMES.map(r => r.id));

export function getAgentRuntime(id) {
  return AGENT_RUNTIMES.find(r => r.id === id) ?? null;
}

// ---------------------------------------------------------------- providers

const CAPS = (overrides = {}) => {
  const out = {};
  for (const id of CAPABILITY_IDS) out[id] = overrides[id] ?? CAPABILITY.UNVERIFIED;
  return Object.freeze(out);
};

const PROVIDER = (o) => Object.freeze({
  provider_id: o.provider_id,
  name: o.name,
  vendor: o.vendor,
  priority: o.priority,
  classification: o.classification,
  repo: o.repo ?? null,
  pinned_commit: o.pinned_commit ?? null,
  license: o.license,
  license_status: o.license_status,
  license_review: o.license_review,
  source_url: o.source_url,
  verified_at: "2026-10-31",
  binary: o.binary,
  platforms: Object.freeze({ ...o.platforms }),
  agent_runtimes: Object.freeze({ ...o.agent_runtimes }),
  capabilities: CAPS(o.capabilities),
  cloud_required: o.cloud_required,
  install_requires: Object.freeze([...o.install_requires]),
  resource_profile: o.resource_profile,
  adapter_status: o.adapter_status,
  known_limitations: Object.freeze([...o.known_limitations]),
  sources: Object.freeze(o.sources.map(s => Object.freeze({ ...s })))
});

export const PROVIDERS = Object.freeze([
  PROVIDER({
    provider_id: "orca",
    name: "Orca",
    vendor: "Stably AI",
    priority: "P1",
    classification: "PRIMARY_CANDIDATE",
    repo: "stablyai/orca",
    pinned_commit: "bbd324a57a368e0381fe3f38804518ac46bfa4b6",
    license: "MIT",
    license_status: VERIFICATION.VERIFIED_UPSTREAM,
    license_review: "NOT_REQUIRED",
    source_url: "https://github.com/stablyai/orca",
    binary: "orca",
    platforms: {
      windows: VERIFICATION.VERIFIED_UPSTREAM,
      wsl2: VERIFICATION.VERIFIED_UPSTREAM,
      linux: VERIFICATION.VERIFIED_UPSTREAM,
      macos: VERIFICATION.VERIFIED_UPSTREAM
    },
    agent_runtimes: {
      omp: VERIFICATION.VERIFIED_UPSTREAM,
      "claude-code": VERIFICATION.VERIFIED_UPSTREAM,
      codex: VERIFICATION.VERIFIED_UPSTREAM,
      opencode: VERIFICATION.VERIFIED_UPSTREAM
    },
    capabilities: {
      parallel_agents: CAPABILITY.SUPPORTED,
      worktree_isolation: CAPABILITY.SUPPORTED,
      agent_state: CAPABILITY.SUPPORTED,
      session_resume: CAPABILITY.UNVERIFIED,
      task_dispatch: CAPABILITY.SUPPORTED,
      failure_recovery: CAPABILITY.SUPPORTED,
      cli: CAPABILITY.SUPPORTED,
      api: CAPABILITY.UNVERIFIED,
      plugins: CAPABILITY.SUPPORTED,
      hooks: CAPABILITY.UNVERIFIED,
      mcp: CAPABILITY.SUPPORTED,
      custom_task_contract: CAPABILITY.SUPPORTED,
      run_receipts: CAPABILITY.SUPPORTED,
      independent_review: CAPABILITY.SUPPORTED,
      human_approval: CAPABILITY.SUPPORTED,
      cancel: CAPABILITY.SUPPORTED
    },
    cloud_required: false,
    install_requires: [
      "Desktop app from onorca.dev or GitHub releases.",
      "Register the CLI under Settings → General → Orca CLI; on Linux the binary is `orca-ide`."
    ],
    resource_profile: "Desktop app with one PTY per worker; not a 2 vCPU / 2 GB VPS target.",
    adapter_status: "PLAN_ONLY",
    known_limitations: [
      "Orchestration (Run/Task/Dispatch/Decision gate) is marked Experimental upstream.",
      "Documented orchestration `--agent` IDs name claude, codex, cursor, antigravity, muse and opencode; OMP is supported by code paths but is not in that documented dispatch list.",
      "WSL2 support is evidenced by in-repo WSL guest code, not by a documented support matrix.",
      "No public HTTP API is documented; automation uses the local `orca` CLI against a running editor."
    ],
    sources: [
      { label: "Repository", url: "https://github.com/stablyai/orca" },
      { label: "CLI overview", url: "https://www.onorca.dev/docs/cli" },
      { label: "Orchestration", url: "https://www.onorca.dev/docs/cli/orchestration" }
    ]
  }),

  PROVIDER({
    provider_id: "herdr",
    name: "Herdr",
    vendor: "herdrdev",
    priority: "P1",
    classification: "PRIMARY_CANDIDATE",
    repo: "herdrdev/herdr",
    pinned_commit: "ee5bfb5041bb3e4a49d591c72308aae3c81ecdde",
    license: "Apache-2.0",
    license_status: VERIFICATION.VERIFIED_UPSTREAM,
    license_review: "NOT_REQUIRED",
    source_url: "https://github.com/herdrdev/herdr",
    binary: "herdr",
    platforms: {
      windows: VERIFICATION.VERIFIED_UPSTREAM,
      wsl2: VERIFICATION.UNVERIFIED,
      linux: VERIFICATION.VERIFIED_UPSTREAM,
      macos: VERIFICATION.VERIFIED_UPSTREAM
    },
    agent_runtimes: {
      omp: VERIFICATION.VERIFIED_UPSTREAM,
      "claude-code": VERIFICATION.VERIFIED_UPSTREAM,
      codex: VERIFICATION.VERIFIED_UPSTREAM,
      opencode: VERIFICATION.VERIFIED_UPSTREAM
    },
    capabilities: {
      parallel_agents: CAPABILITY.SUPPORTED,
      worktree_isolation: CAPABILITY.PARTIAL,
      agent_state: CAPABILITY.SUPPORTED,
      session_resume: CAPABILITY.SUPPORTED,
      task_dispatch: CAPABILITY.SUPPORTED,
      failure_recovery: CAPABILITY.PARTIAL,
      cli: CAPABILITY.SUPPORTED,
      api: CAPABILITY.SUPPORTED,
      plugins: CAPABILITY.SUPPORTED,
      hooks: CAPABILITY.UNVERIFIED,
      mcp: CAPABILITY.UNVERIFIED,
      custom_task_contract: CAPABILITY.PARTIAL,
      run_receipts: CAPABILITY.PARTIAL,
      independent_review: CAPABILITY.PARTIAL,
      human_approval: CAPABILITY.SUPPORTED,
      cancel: CAPABILITY.PARTIAL
    },
    cloud_required: false,
    install_requires: [
      "Single Rust binary: Homebrew, mise, install.sh, or the PowerShell installer on Windows.",
      "Windows uses ConPTY; the upstream page states native Windows support is generally available."
    ],
    resource_profile: "Terminal multiplexer with a background server; light host overhead, but each agent still consumes its own model budget.",
    adapter_status: "PLAN_ONLY",
    known_limitations: [
      "Windows support is GA but upstream warns that not every terminal/ConPTY combination is verified and some capabilities differ from Unix.",
      "WSL2 has no separate support matrix; WSL is only mentioned for cursor rendering and a WezTerm test, so it stays UNVERIFIED.",
      "Worktree isolation is not core; it comes from plugins such as a worktrunk integration, so Workbench treats it as PARTIAL.",
      "`agent wait` observes lifecycle state, not completion of a specific job; `idle` is not authorization to approve an action.",
      "Agent output is terminal text; there is no signed execution receipt."
    ],
    sources: [
      { label: "Repository", url: "https://github.com/herdrdev/herdr" },
      { label: "Supported agents", url: "https://herdr.dev/docs/agents/" },
      { label: "Agent automation", url: "https://herdr.dev/docs/agent-automation/" },
      { label: "Windows support", url: "https://herdr.dev/docs/windows-beta/" }
    ]
  }),

  PROVIDER({
    provider_id: "multica",
    name: "Multica",
    vendor: "Index Labs (Hong Kong) Limited",
    priority: "P2",
    classification: "SECONDARY_CANDIDATE",
    repo: "multica-ai/multica",
    pinned_commit: "0d627e54e1bd4d2521359f293d04521246495ce2",
    license: "Multica License (Apache-2.0 + additional conditions)",
    license_status: "CUSTOM_SOURCE_AVAILABLE",
    license_review: "REQUIRED",
    source_url: "https://github.com/multica-ai/multica",
    binary: "multica",
    platforms: {
      windows: VERIFICATION.VERIFIED_UPSTREAM,
      wsl2: VERIFICATION.UNVERIFIED,
      linux: VERIFICATION.VERIFIED_UPSTREAM,
      macos: VERIFICATION.VERIFIED_UPSTREAM
    },
    agent_runtimes: {
      omp: VERIFICATION.VERIFIED_UPSTREAM,
      "claude-code": VERIFICATION.VERIFIED_UPSTREAM,
      codex: VERIFICATION.VERIFIED_UPSTREAM,
      opencode: VERIFICATION.VERIFIED_UPSTREAM
    },
    capabilities: {
      parallel_agents: CAPABILITY.SUPPORTED,
      worktree_isolation: CAPABILITY.SUPPORTED,
      agent_state: CAPABILITY.SUPPORTED,
      session_resume: CAPABILITY.PARTIAL,
      task_dispatch: CAPABILITY.SUPPORTED,
      failure_recovery: CAPABILITY.SUPPORTED,
      cli: CAPABILITY.SUPPORTED,
      api: CAPABILITY.SUPPORTED,
      plugins: CAPABILITY.UNVERIFIED,
      hooks: CAPABILITY.UNVERIFIED,
      mcp: CAPABILITY.SUPPORTED,
      custom_task_contract: CAPABILITY.PARTIAL,
      run_receipts: CAPABILITY.SUPPORTED,
      independent_review: CAPABILITY.SUPPORTED,
      human_approval: CAPABILITY.SUPPORTED,
      cancel: CAPABILITY.SUPPORTED
    },
    cloud_required: false,
    install_requires: [
      "Self-host with Docker Compose or Helm, or connect to Multica Cloud.",
      "CLI sign-in via browser or a personal access token; a local daemon must be running."
    ],
    resource_profile: "Server + daemon + agent runtimes; heavier than a terminal multiplexer and not aimed at a 2 vCPU / 2 GB VPS.",
    adapter_status: "DISABLED_PENDING_LICENSE_REVIEW",
    known_limitations: [
      "License is not plain Apache-2.0: Part I adds hosted-service, branding and attribution conditions. Commercial hosting or embedding requires a separate licence.",
      "The runtime list documented on the daemon page names Pi but not OMP; OMP support is evidenced by in-repo runtime code.",
      "Setup defaults to Multica Cloud; self-hosting requires operating a server and daemon.",
      "Workbench does not introduce an executable dependency until the licence review is complete."
    ],
    sources: [
      { label: "Repository", url: "https://github.com/multica-ai/multica" },
      { label: "Licence", url: "https://github.com/multica-ai/multica/blob/main/LICENSE" },
      { label: "CLI", url: "https://multica.ai/docs/cli" },
      { label: "Daemon and runtimes", url: "https://multica.ai/docs/daemon-runtimes" }
    ]
  }),

  PROVIDER({
    provider_id: "tern",
    name: "Tern",
    vendor: "Stencil Labs",
    priority: "P3",
    classification: "DEFERRED_CLOSED_BETA",
    repo: null,
    pinned_commit: null,
    license: "UNVERIFIED",
    license_status: VERIFICATION.UNVERIFIED,
    license_review: "REQUIRED",
    source_url: "https://stencil.so/tern",
    binary: "tern",
    platforms: {
      windows: VERIFICATION.BLOCKED,
      wsl2: VERIFICATION.BLOCKED,
      linux: VERIFICATION.UNVERIFIED,
      macos: VERIFICATION.VERIFIED_UPSTREAM
    },
    agent_runtimes: {
      omp: VERIFICATION.VERIFIED_UPSTREAM,
      "claude-code": VERIFICATION.UNVERIFIED,
      codex: VERIFICATION.UNVERIFIED,
      opencode: VERIFICATION.UNVERIFIED
    },
    capabilities: {
      parallel_agents: CAPABILITY.UNVERIFIED,
      worktree_isolation: CAPABILITY.UNVERIFIED,
      agent_state: CAPABILITY.PARTIAL,
      session_resume: CAPABILITY.SUPPORTED,
      task_dispatch: CAPABILITY.PARTIAL,
      failure_recovery: CAPABILITY.UNVERIFIED,
      cli: CAPABILITY.SUPPORTED,
      api: CAPABILITY.UNVERIFIED,
      plugins: CAPABILITY.SUPPORTED,
      hooks: CAPABILITY.UNVERIFIED,
      mcp: CAPABILITY.UNVERIFIED,
      custom_task_contract: CAPABILITY.UNVERIFIED,
      run_receipts: CAPABILITY.PARTIAL,
      independent_review: CAPABILITY.UNVERIFIED,
      human_approval: CAPABILITY.UNVERIFIED,
      cancel: CAPABILITY.UNVERIFIED
    },
    cloud_required: false,
    install_requires: [
      "Closed beta: join the waitlist with a Stencil account.",
      "No public package or release channel is documented."
    ],
    resource_profile: "Native macOS terminal workspace; no documented Windows/Linux resource profile.",
    adapter_status: "DISABLED_CLOSED_BETA",
    known_limitations: [
      "Tern is in closed beta and requires a Stencil account/waitlist.",
      "Its site documents macOS plus iPhone and browser tabs; Windows and WSL2 are not documented, so they are BLOCKED for this environment.",
      "Only OMP is named as a native agent; Claude Code, Codex and OpenCode are unverified.",
      "No worktree isolation or parallel-agent claim is documented.",
      "License and redistribution terms are not established."
    ],
    sources: [
      { label: "Product", url: "https://stencil.so/tern" },
      { label: "Plugin SDK", url: "https://docs.stencil.so/tern/" }
    ]
  })
]);

export const PROVIDER_IDS = Object.freeze(PROVIDERS.map(p => p.provider_id));

export function listProviders() {
  return PROVIDERS.map(p => ({
    provider_id: p.provider_id,
    name: p.name,
    priority: p.priority,
    classification: p.classification,
    license: p.license,
    license_review: p.license_review,
    platforms: { ...p.platforms },
    agent_runtimes: { ...p.agent_runtimes },
    adapter_status: p.adapter_status,
    cloud_required: p.cloud_required,
    source_url: p.source_url
  }));
}

export function getProvider(id) {
  return PROVIDERS.find(p => p.provider_id === id) ?? null;
}

export function providerAgentMatrix() {
  return PROVIDERS.map(p => ({
    provider_id: p.provider_id,
    priority: p.priority,
    ...Object.fromEntries(AGENT_RUNTIME_IDS.map(id => [id, p.agent_runtimes[id]]))
  }));
}

// ---------------------------------------------------------------- path / command safety

const MAX_FIELD = 500;
const clean = (v, max = MAX_FIELD) => String(v ?? "").replace(/\0/g, "").trim().slice(0, max);

export function normalizeRepoPath(value) {
  if (typeof value !== "string") throw new Error("allowed_files entries must be strings");
  const raw = value.replace(/\\/g, "/").trim();
  if (!raw) throw new Error("allowed_files entries must not be empty");
  if (raw.startsWith("/") || /^[A-Za-z]:/.test(raw)) throw new Error("absolute path is not allowed in allowed_files: " + raw);
  const segments = raw.split("/");
  if (segments.some(s => s === "" || s === "." || s === "..")) throw new Error("unsafe path segment in allowed_files: " + raw);
  if (/[\u0000-\u001f\u007f]/.test(raw)) throw new Error("control characters are not allowed in allowed_files");
  return raw;
}

// Commands are recorded, never executed. Reject anything that would let one
// entry chain into a second command, or that names a destructive/remote action.
// This is defence in depth, not a sandbox.
const DESTRUCTIVE_COMMAND = /(^|[\s/\\])(rm|rmdir|del)(\s|$)|(^|\s)(shutdown|reboot|mkfs|dd|powershell|pwsh|cmd|curl|wget|ssh|scp|docker|kubectl|terraform|aws|gcloud|az)(\s|$)|git\s+push(\s|$)|git\s+reset\s+--hard(\s|$)|npm\s+publish(\s|$)/i;

export function normalizeAllowedCommand(value) {
  if (typeof value !== "string") throw new Error("allowed_commands entries must be strings");
  const raw = value.replace(/\r\n?/g, "\n").trim();
  if (!raw) throw new Error("allowed_commands entries must not be empty");
  if (raw.length > MAX_FIELD) throw new Error("allowed_commands entry is too long");
  if (/[\n\r\0]/.test(raw)) throw new Error("allowed_commands must be a single line");
  if (/(;|&&|&|\|\||\||`|\$|>|<)/.test(raw)) throw new Error("shell chaining/expansion is not allowed in allowed_commands: " + raw);
  if (DESTRUCTIVE_COMMAND.test(raw)) throw new Error("destructive or remote command is not allowed in allowed_commands: " + raw);
  return raw;
}

function stringArray(value, field) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error(field + " must be an array");
  return value.map(v => clean(v, MAX_FIELD)).filter(Boolean);
}

const HEX40 = /^[0-9a-f]{40}$/;
const TICKET_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

export function normalizeTicketContract(ticket = {}) {
  if (ticket === null || typeof ticket !== "object" || Array.isArray(ticket))
    throw new Error("ticket must be an object");
  const ticketId = ticket.ticket_id === undefined ? null : clean(ticket.ticket_id, 64);
  if (ticketId !== null && !TICKET_ID.test(ticketId))
    throw new Error("ticket_id must match [A-Za-z0-9][A-Za-z0-9._-]{0,63}");

  const baseSha = ticket.base_sha === undefined ? null : clean(ticket.base_sha, 40);
  if (baseSha !== null && baseSha !== "UNKNOWN" && !HEX40.test(baseSha))
    throw new Error("base_sha must be a 40-char lowercase hex commit or UNKNOWN");

  const allowedFiles = stringArray(ticket.allowed_files, "allowed_files").map(normalizeRepoPath);
  const allowedCommands = stringArray(ticket.allowed_commands, "allowed_commands").map(normalizeAllowedCommand);

  const iterationBudget = ticket.iteration_budget && typeof ticket.iteration_budget === "object" && !Array.isArray(ticket.iteration_budget)
    ? Object.freeze({
        maxAttemptsPerTicket: Number.isInteger(ticket.iteration_budget.maxAttemptsPerTicket) ? ticket.iteration_budget.maxAttemptsPerTicket : null,
        maxReviewFixRounds: Number.isInteger(ticket.iteration_budget.maxReviewFixRounds) ? ticket.iteration_budget.maxReviewFixRounds : null
      })
    : Object.freeze({});

  return Object.freeze({
    ticket_id: ticketId,
    spec_id: ticket.spec_id === undefined ? null : clean(ticket.spec_id, 120),
    base_sha: baseSha,
    accepted_AC: Object.freeze(stringArray(ticket.accepted_AC, "accepted_AC")),
    blocked_by: Object.freeze(stringArray(ticket.blocked_by, "blocked_by")),
    allowed_files: Object.freeze(allowedFiles),
    allowed_commands: Object.freeze(allowedCommands),
    forbidden_actions: Object.freeze(stringArray(ticket.forbidden_actions, "forbidden_actions")),
    negative_tests: Object.freeze(stringArray(ticket.negative_tests, "negative_tests")),
    iteration_budget: iterationBudget,
    time_budget: ticket.time_budget === undefined ? null : clean(ticket.time_budget, 60),
    external_cost_budget: ticket.external_cost_budget === undefined ? null : clean(ticket.external_cost_budget, 60),
    stop_conditions: Object.freeze(stringArray(ticket.stop_conditions, "stop_conditions")),
    rollback: ticket.rollback === undefined ? null : clean(ticket.rollback, MAX_FIELD),
    evidence_paths: Object.freeze(stringArray(ticket.evidence_paths, "evidence_paths")),
    reviewer: ticket.reviewer === undefined ? null : clean(ticket.reviewer, 120)
  });
}

const UNSET_PREFIX = /^(UNSET|UNSET_|PENDING_|NOT_YET_IDENTIFIED|UNASSIGNED|NOT_RUN|UNKNOWN)/i;

function isUnset(value) {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  const s = String(value).trim();
  return !s || UNSET_PREFIX.test(s);
}

export function missingTicketFields(ticket) {
  return TICKET_CONTRACT_FIELDS.filter(field => {
    const value = ticket[field];
    if (field === "blocked_by") return !Array.isArray(value); // no dependencies is a valid state
    if (field === "iteration_budget") {
      return !value || !Number.isInteger(value.maxAttemptsPerTicket) || !Number.isInteger(value.maxReviewFixRounds);
    }
    return isUnset(value);
  });
}

// ---------------------------------------------------------------- conflict checks

function pathOverlaps(a, b, caseInsensitive = true) {
  const norm = s => caseInsensitive ? s.toLowerCase() : s;
  const A = norm(a).split("/"), B = norm(b).split("/");
  const n = Math.min(A.length, B.length);
  for (let i = 0; i < n; i++) {
    const x = A[i], y = B[i];
    if (x === "**" || y === "**") return true;
    if (x === "*" || y === "*") continue;
    if (x !== y) return false;
  }
  return true; // one path is a prefix of the other
}

function dependencyMap(tickets) {
  const map = new Map();
  for (const t of tickets) map.set(t.ticket_id, Array.isArray(t.blocked_by) ? [...t.blocked_by] : []);
  return map;
}

function reaches(deps, from, target) {
  const seen = new Set();
  const stack = [...(deps.get(from) ?? [])];
  while (stack.length) {
    const id = stack.pop();
    if (id === target) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    stack.push(...(deps.get(id) ?? []));
  }
  return false;
}

function hasCycle(deps) {
  const state = new Map();
  const visit = id => {
    if (state.get(id) === "grey") return true;
    if (state.get(id) === "black") return false;
    state.set(id, "grey");
    for (const dep of deps.get(id) ?? []) {
      if (!deps.has(dep)) continue;
      if (visit(dep)) return true;
    }
    state.set(id, "black");
    return false;
  };
  for (const id of deps.keys()) if (visit(id)) return true;
  return false;
}

// Plan-level isolation. Does not create locks; it only proves whether a ticket
// set is safe to schedule. A single ticket may never have two writers.
export function checkTicketSet(tickets, options = {}) {
  if (!Array.isArray(tickets) || tickets.length === 0) throw new Error("tickets must be a non-empty array");
  const errors = [], warnings = [];
  const maxParallel = Number.isInteger(options.maxParallel) ? options.maxParallel : LOOP_DEFAULTS.maxParallelTickets;
  const caseInsensitive = options.caseInsensitive !== false;
  const ids = new Set();

  for (const ticket of tickets) {
    if (!ticket || typeof ticket !== "object") throw new Error("each ticket must be an object");
    const id = clean(ticket.ticket_id, 64);
    if (!id) { errors.push("ticket without ticket_id"); continue; }
    if (ids.has(id)) errors.push("duplicate ticket_id: " + id);
    ids.add(id);
  }

  const deps = dependencyMap(tickets.filter(t => t?.ticket_id));
  if (hasCycle(deps)) errors.push("blocked_by contains a cycle");

  for (const ticket of tickets) {
    if (!ticket?.ticket_id) continue;
    const id = ticket.ticket_id;

    // `agent` and `agents` are two ways to declare the same thing. Combine them
    // so agent=A + agents=[B] is correctly read as two writers, not one.
    const declared = [];
    if (ticket.agent !== undefined) {
      if (typeof ticket.agent !== "string") errors.push("ticket " + id + " agent must be a string");
      else if (ticket.agent.trim()) declared.push(ticket.agent.trim());
    }
    if (ticket.agents !== undefined) {
      if (!Array.isArray(ticket.agents)) errors.push("ticket " + id + " agents must be an array");
      else for (const value of ticket.agents) {
        if (typeof value !== "string") errors.push("ticket " + id + " agents entries must be strings");
        else if (value.trim()) declared.push(value.trim());
      }
    }
    const writers = [...new Set(declared)];
    if (writers.length === 0) errors.push("ticket " + id + " has no writer");
    if (writers.length > 1) errors.push("ticket " + id + " has more than one active writer: " + writers.join(", "));

    if (ticket.reviewer && writers.some(w => String(ticket.reviewer) === w))
      errors.push("ticket " + id + " uses the same agent as writer and reviewer");

    if (ticket.blocked_by !== undefined && !Array.isArray(ticket.blocked_by))
      errors.push("ticket " + id + " blocked_by must be an array");
    for (const dep of (Array.isArray(ticket.blocked_by) ? ticket.blocked_by : [])) {
      if (!ids.has(dep)) errors.push("ticket " + id + " depends on unknown ticket " + dep);
    }

    const files = Array.isArray(ticket.allowed_files) ? ticket.allowed_files.map(normalizeRepoPath) : [];
    if (files.length === 0) warnings.push("ticket " + id + " declares no allowed_files; it cannot start");
  }

  for (let i = 0; i < tickets.length; i++) {
    for (let j = i + 1; j < tickets.length; j++) {
      const a = tickets[i], b = tickets[j];
      if (!a?.ticket_id || !b?.ticket_id) continue;
      const serial = reaches(deps, a.ticket_id, b.ticket_id) || reaches(deps, b.ticket_id, a.ticket_id);
      if (serial) continue;
      const filesA = Array.isArray(a.allowed_files) ? a.allowed_files : [];
      const filesB = Array.isArray(b.allowed_files) ? b.allowed_files : [];
      for (const fa of filesA) for (const fb of filesB) {
        if (pathOverlaps(fa, fb, caseInsensitive))
          errors.push("parallel write conflict: " + a.ticket_id + "(" + fa + ") overlaps " + b.ticket_id + "(" + fb + ")");
      }
    }
  }

  if (tickets.length > maxParallel)
    warnings.push("ticket set exceeds maxParallel=" + maxParallel + "; schedule serially or raise it explicitly with worktree isolation");

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    scheduling: {
      tickets: tickets.length,
      maxParallel,
      requestedParallel: tickets.length,
      effectiveParallel: Math.min(maxParallel, tickets.length),
      enforcement: "STATIC_PLAN_CHECK_ONLY",
      case_insensitive_paths: caseInsensitive,
      note: "A clean result is not a runtime lock. Workbench does not create worktrees or lock files."
    }
  };
}

const ACTIVE_ASSIGNMENT = new Set(["PENDING", "RUNNING", "QUEUED", "REVIEW"]);

export function checkAssignments(assignments) {
  if (!Array.isArray(assignments)) throw new Error("assignments must be an array");
  const errors = [], warnings = [];
  const activeWriters = new Map();
  const activeReviewers = new Map();

  for (const a of assignments) {
    if (!a || typeof a !== "object") throw new Error("each assignment must be an object");
    const id = clean(a.ticket_id, 64);
    if (!id) { errors.push("assignment without ticket_id"); continue; }
    if (!["writer", "reviewer"].includes(a.role)) { errors.push("assignment " + id + " has invalid role"); continue; }
    if (!ACTIVE_ASSIGNMENT.has(a.status)) continue;
    const key = String(a.provider_id ?? "") + ":" + String(a.agent_runtime ?? "");
    if (a.role === "writer") {
      if (activeWriters.has(id)) errors.push("ticket " + id + " has more than one active writer");
      activeWriters.set(id, key);
    } else {
      activeReviewers.set(id, key);
    }
  }

  for (const [id, reviewerKey] of activeReviewers) {
    if (activeWriters.has(id) && activeWriters.get(id) === reviewerKey)
      errors.push("ticket " + id + " has the same active writer and reviewer");
    if (!activeWriters.has(id)) warnings.push("ticket " + id + " has an active reviewer but no active writer");
  }

  return { ok: errors.length === 0, errors, warnings };
}

// ---------------------------------------------------------------- handoff plan

const platformStatus = (provider, platform) => provider.platforms[platform] ?? VERIFICATION.UNVERIFIED;

function comboVerdict(status) {
  if (status === VERIFICATION.VERIFIED_UPSTREAM || status === VERIFICATION.VERIFIED_LOCAL) return "PASS";
  if (status === CAPABILITY.PARTIAL || status === VERIFICATION.UNVERIFIED || status === CAPABILITY.UNVERIFIED) return "WARN";
  return "FAIL";
}

function preflight(check, status, detail) {
  return Object.freeze({ check, status, detail });
}

export function planHandoff(options = {}) {
  const {
    providerId, agentRuntime, ticket = null, platform = "windows",
    projectId = null, repository = null, installationStatus = "NOT_PROBED"
  } = options;

  if (!PLATFORM_IDS.includes(platform)) throw new Error("Unknown platform: " + platform);
  const provider = getProvider(providerId);
  if (!provider) throw new Error("Unknown provider: " + providerId + " (available: " + PROVIDER_IDS.join(", ") + ")");
  const runtime = getAgentRuntime(agentRuntime);
  if (!runtime) throw new Error("Unknown agent runtime: " + agentRuntime + " (available: " + AGENT_RUNTIME_IDS.join(", ") + ")");

  const contract = normalizeTicketContract(ticket ?? {});
  const missing = missingTicketFields(contract);
  const checks = [];
  const warnings = [];
  const blocked = [];

  checks.push(preflight("provider_registered", "PASS", provider.provider_id + " @ " + provider.priority));
  checks.push(preflight("agent_runtime_registered", "PASS", runtime.id));

  const runtimeStatus = provider.agent_runtimes[runtime.id] ?? VERIFICATION.UNVERIFIED;
  const runtimeVerdict = comboVerdict(runtimeStatus);
  checks.push(preflight("provider_runtime_support", runtimeVerdict, runtime.id + " = " + runtimeStatus));
  if (runtimeVerdict === "FAIL") blocked.push(provider.provider_id + " does not support " + runtime.id);
  if (runtimeVerdict === "WARN") warnings.push(provider.provider_id + " + " + runtime.id + " is " + runtimeStatus + "; verify on install");

  const platformVerdict = comboVerdict(platformStatus(provider, platform));
  checks.push(preflight("platform_support", platformVerdict, platform + " = " + platformStatus(provider, platform)));
  if (platformVerdict === "FAIL") blocked.push(provider.provider_id + " is not available on " + platform);
  if (platformVerdict === "WARN") warnings.push(provider.provider_id + " on " + platform + " is " + platformStatus(provider, platform));

  const installVerdict = installationStatus === "INSTALLED" ? "PASS"
    : installationStatus === "NOT_PROBED" ? "UNKNOWN" : "WARN";
  checks.push(preflight("provider_installation", installVerdict, installationStatus));

  if (provider.license_review === "REQUIRED") {
    checks.push(preflight("license_review", "WARN", "licence review required before any executable dependency"));
    warnings.push(provider.provider_id + ": licence review required; no executable dependency may be added yet");
  } else {
    checks.push(preflight("license_review", "PASS", provider.license));
  }

  if (provider.adapter_status.startsWith("DISABLED")) {
    checks.push(preflight("adapter_status", "WARN", provider.adapter_status));
  } else {
    checks.push(preflight("adapter_status", "PASS", provider.adapter_status));
  }

  const ticketVerdict = missing.length === 0 ? "PASS" : "WARN";
  checks.push(preflight("ticket_contract", ticketVerdict,
    missing.length === 0 ? "all " + TICKET_CONTRACT_FIELDS.length + " fields set" : "missing: " + missing.join(", ")));
  if (missing.length) warnings.push("ticket contract incomplete: " + missing.join(", "));

  const baseShaValid = contract.base_sha !== null && HEX40.test(contract.base_sha);
  checks.push(preflight("base_sha", baseShaValid ? "PASS" : "WARN",
    contract.base_sha === null ? "UNSET" : contract.base_sha));
  if (!baseShaValid) warnings.push("base_sha must be a real 40-char commit before execution");

  checks.push(preflight("allowed_files", contract.allowed_files.length ? "PASS" : "WARN",
    contract.allowed_files.join(", ") || "UNSET"));
  if (!contract.allowed_files.length) warnings.push("allowed_files is empty");

  checks.push(preflight("allowed_commands", contract.allowed_commands.length ? "PASS" : "WARN",
    contract.allowed_commands.join(", ") || "UNSET"));
  if (!contract.allowed_commands.length) warnings.push("allowed_commands is empty");

  const reviewerIndependent = !!contract.reviewer && contract.reviewer !== agentRuntime && contract.reviewer !== provider.provider_id;
  checks.push(preflight("reviewer_independence", reviewerIndependent ? "PASS" : "WARN",
    contract.reviewer ? "reviewer=" + contract.reviewer : "reviewer UNSET"));
  if (!reviewerIndependent) warnings.push("an independent reviewer must be assigned before execution");

  const hardFail = checks.some(c => c.status === "FAIL");
  const status = hardFail ? "BLOCKED"
    : missing.length === 0 ? "PLAN_ONLY_READY" : "PLAN_ONLY_INCOMPLETE";

  const isolation = provider.capabilities.worktree_isolation === CAPABILITY.SUPPORTED
    ? "GIT_WORKTREE" : "MANUAL_ISOLATED_BRANCH";

  const resolvedProjectId = projectId ?? contract.spec_id ?? "UNKNOWN";
  const evidenceReference = contract.ticket_id && baseShaValid
    ? "orchestration://" + provider.provider_id + "/" + contract.ticket_id + "/" + contract.base_sha
    : "UNSET";

  const knownLimitations = [
    ...provider.known_limitations,
    ...(runtime.note ? [runtime.id + ": " + runtime.note] : []),
    ...warnings
  ];

  return Object.freeze({
    schemaVersion: 1,
    kind: "ORCHESTRATION_HANDOFF_PLAN",
    status,
    provider_id: provider.provider_id,
    provider_version: provider.pinned_commit ?? provider.release ?? "UNPINNED",
    agent_runtime: runtime.id,
    capabilities: { ...provider.capabilities },
    platform,
    installation_status: installationStatus,
    project_id: resolvedProjectId,
    repository,
    task_contract: contract,
    // Six separate gates. A valid plan is not an installed provider, an
    // executable provider, a reviewed licence, owner authorization or a run.
    readiness: Object.freeze({
      plan_fields_complete: missing.length === 0,
      provider_installed: installationStatus === "INSTALLED",
      provider_executable: false,
      license_reviewed: provider.license_review !== "REQUIRED",
      owner_authorized: false,
      execution_verified: false,
      execution_ready: false,
      note: "execution_ready stays false until all six gates have independent evidence; Workbench never records owner authorization or execution itself."
    }),
    status_note: "PLAN_ONLY_READY means the plan fields and provider/runtime combination are valid. It does not mean installed, executable, licensed, owner-authorized or executed.",
    workspace_policy: Object.freeze({
      isolation,
      branch_pattern: contract.ticket_id ? "ticket/" + contract.ticket_id : "UNSET",
      base_sha: contract.base_sha,
      allowed_files: contract.allowed_files,
      write_owner: runtime.id,
      conflict_policy: "ONE_ACTIVE_WRITER_PER_TICKET",
      enforcement: "STATIC_PLAN_CHECK_ONLY",
      shared_resource_check: "REQUIRED_BEFORE_SCHEDULING"
    }),
    permission_scope: Object.freeze({
      mode: "PLAN_ONLY",
      push: false,
      deploy: false,
      merge: false,
      create_pr: false,
      network_from_workbench: "NONE",
      allowed_commands: contract.allowed_commands,
      forbidden_actions: contract.forbidden_actions
    }),
    execution_mode: "DRY_RUN",
    verification_status: "NOT_RUN",
    evidence_reference: evidenceReference,
    known_limitations: Object.freeze([...new Set(knownLimitations)]),
    preflight: Object.freeze(checks),
    blocked_reasons: Object.freeze(blocked),
    warnings: Object.freeze([...new Set(warnings)]),
    runtime_invocation: Object.freeze({
      status: provider.adapter_status === "PLAN_ONLY" ? "MANUAL_HANDOFF_ONLY" : provider.adapter_status,
      reason: "No verified, parameterised provider CLI contract is implemented. Workbench does not build or execute shell commands from ticket fields.",
      documentation: provider.sources
    }),
    non_actions: Object.freeze([
      "No process was spawned.",
      "No command was executed.",
      "No file was written.",
      "No network call was made.",
      "No provider account was used."
    ])
  });
}

// ---------------------------------------------------------------- evidence adapter

export const RECEIPT_SCHEMA_VERSION = 1;

export function normalizeExternalReceipt(input) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("receipt must be an object");
  if (input.schemaVersion !== RECEIPT_SCHEMA_VERSION || input.kind !== "EXTERNAL_EXECUTION_RECEIPT")
    throw new Error("unsupported receipt schema");
  if (input.trust !== undefined && input.trust !== "UNTRUSTED")
    throw new Error("external receipts cannot self-declare trust");
  if (input.evidence_state === "VERIFIED" || input.state === "VERIFIED")
    throw new Error("external receipts cannot self-declare VERIFIED");

  const provider = getProvider(input.provider_id);
  if (!provider) throw new Error("receipt references an unknown provider: " + input.provider_id);
  if (!AGENT_RUNTIME_IDS.includes(input.agent_runtime))
    throw new Error("receipt references an unknown agent runtime: " + input.agent_runtime);

  const ticketId = clean(input.ticket_id, 64);
  if (!TICKET_ID.test(ticketId)) throw new Error("receipt ticket_id is invalid");

  const baseSha = clean(input.base_sha, 40);
  const headSha = clean(input.head_sha, 40);
  if (!HEX40.test(baseSha)) throw new Error("receipt base_sha must be 40 lowercase hex");
  if (!HEX40.test(headSha)) throw new Error("receipt head_sha must be 40 lowercase hex");

  if (input.exit_code !== null && input.exit_code !== undefined && !Number.isInteger(input.exit_code))
    throw new Error("receipt exit_code must be an integer or null");

  const result = clean(input.result, MAX_FIELD);
  const artifact = clean(input.artifact, MAX_FIELD);
  if (!result) throw new Error("receipt requires a result");
  if (!artifact) throw new Error("receipt requires an artifact reference");

  return Object.freeze({
    schemaVersion: RECEIPT_SCHEMA_VERSION,
    kind: "EXTERNAL_EXECUTION_RECEIPT",
    provider_id: provider.provider_id,
    provider_version: clean(input.provider_version, 80) || provider.pinned_commit || "UNPINNED",
    agent_runtime: input.agent_runtime,
    ticket_id: ticketId,
    project_id: clean(input.project_id, 120) || "UNKNOWN",
    repository: clean(input.repository, 200) || "UNKNOWN",
    base_sha: baseSha,
    head_sha: headSha,
    operation: clean(input.operation, 120) || "UNRECORDED",
    command: clean(input.command, MAX_FIELD) || "UNRECORDED",
    exit_code: input.exit_code ?? null,
    result,
    artifact,
    started_at: clean(input.started_at, 40) || "UNRECORDED",
    finished_at: clean(input.finished_at, 40) || "UNRECORDED",
    environment: clean(input.environment, 200) || "UNRECORDED",
    source: "EXTERNAL_TOOL",
    trust: "UNTRUSTED",
    evidence_state: "UNKNOWN",
    promotion: "NONE",
    note: "External output is a claim. A zero exit code or a self-report is not a verified test result or acceptance."
  });
}

export function verifyReceiptAgainstPlan(receipt, plan) {
  if (!plan || plan.kind !== "ORCHESTRATION_HANDOFF_PLAN")
    throw new Error("plan must be an ORCHESTRATION_HANDOFF_PLAN");
  const normalized = normalizeExternalReceipt(receipt);
  const mismatches = [];
  const compare = (field, expected) => {
    if (expected !== null && expected !== undefined && normalized[field] !== expected)
      mismatches.push(field + ": receipt=" + normalized[field] + " plan=" + expected);
  };
  compare("provider_id", plan.provider_id);
  compare("agent_runtime", plan.agent_runtime);
  compare("ticket_id", plan.task_contract?.ticket_id);
  compare("base_sha", plan.task_contract?.base_sha);
  compare("project_id", plan.project_id);
  compare("repository", plan.repository);
  return Object.freeze({
    ok: mismatches.length === 0,
    mismatches: Object.freeze(mismatches),
    trust: "UNTRUSTED",
    promotion: "NONE",
    note: "Matching identity does not verify content. Keep the receipt as an untrusted claim."
  });
}

// ---------------------------------------------------------------- validation

export function validateOrchestration() {
  const errors = [];
  if (PROVIDERS.length !== 4) errors.push("orchestration: expected 4 providers");
  if (new Set(PROVIDER_IDS).size !== PROVIDERS.length) errors.push("orchestration: duplicate provider ids");
  for (const id of ["orca", "herdr", "multica", "tern"])
    if (!PROVIDER_IDS.includes(id)) errors.push("orchestration: missing provider " + id);
  if (!PROVIDERS.some(p => p.priority === "P1")) errors.push("orchestration: at least one P1 provider is required");

  for (const p of PROVIDERS) {
    if (!["P1", "P2", "P3"].includes(p.priority)) errors.push("orchestration: provider " + p.provider_id + " has invalid priority");
    if (!p.license?.trim()) errors.push("orchestration: provider " + p.provider_id + " has no licence");
    if (!/^https:\/\//.test(p.source_url)) errors.push("orchestration: provider " + p.provider_id + " has no https source");
    if (p.pinned_commit !== null && !HEX40.test(p.pinned_commit))
      errors.push("orchestration: provider " + p.provider_id + " pinned_commit must be 40 hex");
    for (const platform of PLATFORM_IDS)
      if (!VERIFICATION_VALUES.includes(p.platforms[platform]))
        errors.push("orchestration: provider " + p.provider_id + " has invalid " + platform + " status");
    for (const runtime of AGENT_RUNTIME_IDS)
      if (!VERIFICATION_VALUES.includes(p.agent_runtimes[runtime]))
        errors.push("orchestration: provider " + p.provider_id + " has invalid " + runtime + " status");
    for (const cap of CAPABILITY_IDS)
      if (!CAPABILITY_VALUES.includes(p.capabilities[cap]))
        errors.push("orchestration: provider " + p.provider_id + " has invalid capability " + cap);
    if (p.license_status === VERIFICATION.VERIFIED_LOCAL)
      errors.push("orchestration: provider " + p.provider_id + " cannot claim VERIFIED_LOCAL without a local test");
    if (!p.known_limitations.length) errors.push("orchestration: provider " + p.provider_id + " has no known limitations");
  }

  for (const r of AGENT_RUNTIMES) {
    if (!r.id || !r.binary) errors.push("orchestration: agent runtime is missing id/binary");
    if (r.pinned_commit !== null && !HEX40.test(r.pinned_commit))
      errors.push("orchestration: agent runtime " + r.id + " pinned_commit must be 40 hex");
  }

  const tern = getProvider("tern");
  if (tern && (tern.platforms.windows !== VERIFICATION.BLOCKED || tern.license_review !== "REQUIRED"))
    errors.push("orchestration: Tern must stay BLOCKED on Windows with a licence review");
  const multica = getProvider("multica");
  if (multica && multica.license_review !== "REQUIRED")
    errors.push("orchestration: Multica must require a licence review");
  if (multica && /Apache-2.0/.test(multica.license) && !/additional conditions/i.test(multica.license))
    errors.push("orchestration: Multica licence must not be recorded as plain Apache-2.0");

  // The canonical ticket contract stays the only field list.
  if (TICKET_CONTRACT_FIELDS.length !== 16) errors.push("orchestration: ticket contract field count changed");
  const contract = normalizeTicketContract({});
  for (const field of TICKET_CONTRACT_FIELDS)
    if (!Object.hasOwn(contract, field)) errors.push("orchestration: normalized ticket is missing " + field);

  return errors;
}
