# Agent Orchestration Adapters

Status: `REGISTRY_AND_PLAN_ONLY`
Verified upstream: 2026-10-31
Real provider execution: `REAL_PROVIDER_NOT_TESTED`

This document describes the optional Agent orchestration layer for the Workbench. It lets one
approved Workbench ticket be handed to a chosen external multi-Agent environment, without
creating a second lifecycle, a second evidence model or a second permission boundary.

It is a capability registry and a dry-run planner. It is not a multi-Agent platform, and it does
not install, run or manage any third-party tool.

## 1. Scope

Implemented:

- a read-only provider registry for Orca, Herdr, Multica and Tern;
- a fixed Agent-runtime registry for OMP, Claude Code, Codex and OpenCode;
- `PLAN_ONLY` handoff plans derived from the existing ticket contract;
- static conflict checks (one writer per ticket, overlapping file scopes, dependency cycles);
- a restricted external receipt importer that always stays `UNTRUSTED`;
- CLI commands and one read-only Workbench UI tab.

Not implemented, and not claimed:

- spawning any provider or Agent;
- runtime file locks, automatic retry or automatic recovery;
- provider API calls, credentials or account login;
- auto-merge, auto-push, deployment or PR creation;
- promoting external output to `VERIFIED`.

## 2. Upstream verification (2026-10-31)

`VERIFIED_UPSTREAM` means the upstream source or official documentation was read on the date
below. It does not mean the tool was installed, run, or verified on this machine.

| Provider | Source | Pinned commit | Licence | Windows | WSL2 | OMP | Priority |
|---|---|---|---|---|---|---|---|
| Orca | `stablyai/orca` | `bbd324a57a368e0381fe3f38804518ac46bfa4b6` | MIT | Verified | Verified (WSL guest code) | Verified (code; not in documented `--agent` list) | P1 |
| Herdr | `herdrdev/herdr` | `ee5bfb5041bb3e4a49d591c72308aae3c81ecdde` | Apache-2.0 | Verified (native GA, ConPTY) | Unverified | Verified (`--kind omp` + integration) | P1 |
| Multica | `multica-ai/multica` | `0d627e54e1bd4d2521359f293d04521246495ce2` | Multica License | Verified (desktop/web) | Unverified | Verified (runtime code) | P2 |
| Tern | `stencil.so/tern` | no public repo | Unverified | Blocked | Blocked | Verified (native `omp`) | P3 |
| OMP | `can1357/oh-my-pi` | `91afeb4385ad0bb07efef33b877057f8d1fb930b` (v18.14.1) | MIT | Verified (native) | Unverified | — | runtime |

Key upstream facts:

- **Orca** runs agents side by side, one git worktree per task. Its structured orchestration
  layer (Run / Task / Dispatch / Decision gate) is marked Experimental. The documented
  orchestration `--agent` IDs name `claude`, `codex`, `cursor`, `antigravity`, `muse` and
  `opencode`; OMP support exists in code (`src/shared/omp-*.ts`, `src/wsl-guest/omp-status-extension.ts`)
  but is not in that documented dispatch list. No public HTTP API is documented.
- **Herdr** is a terminal runtime with a background server, agent lifecycle state
  (`working` / `blocked` / `idle` / `done` / `unknown`), a CLI and a socket API. `--kind omp`
  is documented and the OMP integration is shipped. Worktree isolation is not core; it comes
  from plugins. Upstream warns that `agent wait` observes state, not completion of a specific
  job, and that `idle` is not authorization to approve an action.
- **Multica** is an issue-driven, self-hostable workspace. The licence is **not** plain
  Apache-2.0: Part I adds hosted-service, branding and attribution conditions. Internal use does
  not require a commercial licence, but offering it as a hosted service does. OMP is supported in
  runtime code (`server/pkg/agent/omp_session.go`). Setup defaults to Multica Cloud, with a
  self-hosted path.
- **Tern** is in **closed beta** and requires a Stencil account/waitlist. Its site documents
  macOS, iPhone and browser tabs. Windows and WSL2 are not documented, so Workbench records them
  as `BLOCKED` for this environment. Only OMP is named as a native agent; worktree isolation and
  parallel Agents are not documented.
- **OMP** is a native macOS/Linux/Windows coding agent. `omp -p` answers one prompt and exits;
  `omp --mode rpc` speaks NDJSON; `omp acp` hands control to another program. OMP's own `task`
  tool fans out subagents into isolated worktrees. Workbench does not invoke any of these yet.

Verification states used in the registry:

- `VERIFIED_UPSTREAM` — upstream source or official docs confirm it.
- `VERIFIED_LOCAL` — a local test confirmed it. **No provider currently has this.**
- `UNVERIFIED` — not checked.
- `UNSUPPORTED` — checked and not supported.
- `BLOCKED` — an explicit blocker (closed beta, undocumented platform, licence review).

## 3. Adapter contract

Every plan carries the same minimal fields:

```text
provider_id          provider_version     agent_runtime
capabilities         platform             installation_status
task_contract        workspace_policy     permission_scope
execution_mode       verification_status  evidence_reference
known_limitations
```

Rules:

- The adapter converts and forwards an **already approved** ticket. It does not redefine the
  Spec, the acceptance criteria or a Gate.
- The canonical 11-stage lifecycle, the 13 task types, the 17 Profiles and the 8 candidate
  Skills remain authoritative. A provider is an execution environment, never a lifecycle.
- A provider never receives push, deploy, merge or PR permission from Workbench.
- `task_contract` uses exactly the 16 fields from `src/delivery.mjs`
  (`TICKET_CONTRACT_FIELDS`). There is no second ticket schema.

## 4. CLI

All commands are read-only and offline.

```bash
node tools/xeng.mjs orchestrator list [--json]
node tools/xeng.mjs orchestrator doctor [--provider <id>] [--json]
node tools/xeng.mjs orchestrator plan --provider orca --agent omp --ticket ticket.json [--json]
node tools/xeng.mjs orchestrator receipt --file receipt.json [--plan plan.json] [--json]
```

- `list` reads the registry; it needs no external program.
- `doctor` resolves each provider/runtime binary on `PATH` and probes `--version` only when the
  binary is not a `.cmd` shim. A missing provider is reported as `NOT_INSTALLED` and the command
  exits `1`. A present binary is **not** capability verification.
- `plan` emits `PLAN_ONLY_READY`, `PLAN_ONLY_INCOMPLETE` or `BLOCKED`. It never spawns a process.
  An incomplete ticket stays incomplete; an unsupported combination exits `2`.
- `receipt` imports an execution receipt as `UNTRUSTED` / `UNKNOWN` / `promotion: NONE` and can
  check its identity against a plan. Identity match does not verify content.

## 5. Conflict and isolation rules

`checkTicketSet` and `checkAssignments` implement static, testable checks:

- one ticket has at most one active writer;
- `allowed_files` scopes of tickets with no dependency relationship must not overlap;
- `blocked_by` must reference known tickets and must not contain a cycle;
- the reviewer must differ from the writer;
- the ticket set reports when it exceeds `LOOP_DEFAULTS.maxParallelTickets`.

These are planning checks, not runtime locks. Workbench does not claim to have implemented
file locking, worktree creation or automatic recovery. The provider or the human owner performs
those actions after the plan is reviewed.

## 6. Evidence

`src/evidence.mjs` and `src/evidence-identity.mjs` stay authoritative. External receipts add no
new state.

- An external receipt is a claim, never a fact.
- A zero exit code, a log line, or an Agent saying "done" does not become `VERIFIED`.
- Development tests, CI, release and consumer acceptance remain separate layers.
- `VERIFIED` still requires command, result and artifact at an executed layer, recorded inside
  the target project.
- Workbench does not sign receipts and does not verify their origin.

## 7. Provider strategy

- **P1 Orca** — default recommendation for Worktree-per-task parallel work. Strengths: built-in
  worktrees, structured orchestration, JSON CLI receipts, Windows support. Limits: orchestration
  is Experimental; OMP is not in the documented dispatch list; no public HTTP API.
- **P1 Herdr** — alternative for terminal-native, session-persistent work. Strengths: native
  Windows, OMP integration, agent state, CLI and socket API. Limits: worktree isolation is a
  plugin concern; lifecycle state is not job completion.
- **P2 Multica** — issue-driven team workflows. Do not add an executable dependency until the
  licence, deployment cost, data flow, auth and revocation are reviewed and approved.
- **P3 Tern** — deferred. Closed beta, macOS-first, Windows/WSL2 undocumented. Keep as a
  terminal-experience candidate only.

Orca and Herdr are mutually optional. There is no requirement to install both, and no default
runtime is forced on the user.

## 8. Test status

```text
Registry validation        PASS (npm run check / validateOrchestration)
Plan generation            PASS (offline unit + CLI tests)
Conflict/safety checks     PASS (offline unit tests)
Receipt handling           PASS (offline unit tests)
Real provider execution    NOT_RUN  (REAL_PROVIDER_NOT_TESTED)
Windows + WSL2 run         NOT_RUN  (no provider installed)
```

Local probe on 2026-10-31: Orca, Herdr, Multica, Tern and OMP were **not** installed. Claude Code,
Codex and OpenCode were present but were not used as orchestration providers.

## 9. Dogfood steps

1. Obtain explicit owner approval before installing any third-party tool.
2. Install one provider under the owner's normal package manager; do not pipe remote scripts.
3. Run `node tools/xeng.mjs orchestrator doctor` and record the real output.
4. Fill one approved ticket with all 16 contract fields, including `base_sha`, `allowed_files`,
   `allowed_commands`, budgets, stop conditions, rollback and an independent reviewer.
5. Run `orchestrator plan` and review `preflight`, `blocked_reasons` and `known_limitations`.
6. Create the isolated worktree/branch manually or through the provider's own documented CLI.
7. Hand the plan to the Agent. Workbench does not execute it.
8. Import the provider's output with `orchestrator receipt`; keep it `UNTRUSTED`.
9. Run the real tests and the independent review in the target repository; record those layers
   separately.

## 10. Security boundary

- No shell command is built from ticket fields; `allowed_commands` that contain chaining,
  expansion, redirection or a destructive/remote command are rejected.
- `allowed_files` rejects absolute paths, drive letters, `..` segments and control characters.
- No network call, credential read, account login or repository upload happens in Workbench.
- No provider receives merge, push or deployment authority.
- Third-party output is untrusted input, not instructions.
- Hooks and static checks are guardrails, not an operating-system security boundary.
