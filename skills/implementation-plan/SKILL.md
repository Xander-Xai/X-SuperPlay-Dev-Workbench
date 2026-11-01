---
name: implementation-plan
description: Use when a spec or architecture is ready and work must be split into independently verifiable, dependency-ordered implementation slices with owners and evidence.
license: UNLICENSED-PROPRIETARY
metadata:
  version: "0.4.0"
  status: CANDIDATE
  owner: Xander-Xai/X-SuperPlay-Dev-Workbench
  provenance: Xander-Xai/X-SuperPlay-AI-Engineering-OS@8553124f238ab463d4a50debad34e871ef8de060
  self_contained: true
  lifecycle_stage: planning
  supported_agents: claude-code,codex,opencode
  prerequisites: specification
  dependencies: specification
  install_method: node tools/skill-kit.mjs install --target <project> --agent <agent> --skills implementation-plan
  tests: static frontmatter, catalog mapping, install dry-run, agent discovery, real-project effect
  upstream_equivalents: writing-plans,planning-and-task-breakdown,to-issues
---

# Implementation Plan

## Core principle

**A ticket is a vertical slice with a verification command.** If a new session cannot execute it alone, it is not a ticket.

## Slice rules

- **Vertical, not horizontal.** A slice crosses UI → API → data → test for one behavior, not "all models" or "all endpoints".
- **One slice per session.** If it cannot fit in one focused session, split it.
- **Size cap.** Prefer ≤5 files or ≤400 changed lines. XL tickets are prohibited; split or prefactor first.
- **Dependency order.** Record `blocked_by` edges. No cycles. The first ticket must be executable with the current base.
- **Prefactoring.** If the change is hard because the code is shaped wrong, land a behavior-preserving refactor first, with tests.
- **HITL vs AFK.** Mark work that requires a human decision or environment. Agents must not guess through a gate.

## Ticket fields

| Field | Meaning |
|---|---|
| `ticket_id` | Stable ID |
| `spec_id` / AC | What it satisfies |
| `base_sha` | Starting commit |
| `blocked_by` | Dependency edges |
| `allowed_files` | Write scope |
| `allowed_commands` | Executable commands |
| `negative_tests` | Failure/permission cases |
| `writer` / `reviewer` | Distinct agents or humans |
| `worktree` | Required for parallel writers |
| `budgets` | Iterations, time, cost |
| `stop_conditions` | When to stop and escalate |
| `evidence_paths` | Where results are stored |

## Ordering

1. Baseline/regression tests for existing behavior.
2. Prefactor that makes the change easy.
3. First tracer bullet: thinnest end-to-end path, even if incomplete.
4. Risk-first slices: security, data migration, integration.
5. UX/performance polish after the path works.
6. Documentation/observability as the slice lands, not as a separate phase.

## Reviewability

- Each ticket has a clear "done" command and expected output.
- Each ticket can be reverted independently.
- The plan names what is explicitly out of scope.
- The plan names the human gates (merge, release, permissions, spend).

## Anti-rationalization

| Excuse | Reality |
|---|---|
| "It's one big feature, just build it" | Big-bang changes cannot be reviewed or reverted. Slice vertically. |
| "We'll figure out dependencies as we go" | Then parallel work will collide. Write `blocked_by` first. |
| "The ticket is small enough" | Check files/lines and whether a new session can verify it. |
| "Prefactoring is extra work" | Prefactoring is how you avoid an unreviewable diff. |
| "The agent can decide at the gate" | Gates are human decisions. Mark HITL and stop. |
| "Review doesn't need a separate person" | Self-review misses the assumptions that produced the bug. |

## Red flags

- Horizontal slices ("all models", "all endpoints").
- No verification command.
- Dependency cycles or missing base SHA.
- More than one writer for the same file.
- A ticket with no reviewer.
- XL ticket with no split or prefactor.
