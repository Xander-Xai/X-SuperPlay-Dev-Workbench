---
name: implementation-plan
description: Turn a verified specification into ordered vertical slices, each ending in a runnable, verifiable state. Use after specification and before implementation for any multi-step change.
status: CANDIDATE
version: 0.2.0
license: UNLICENSED-PROPRIETARY
provenance: Xander-Xai/X-SuperPlay-AI-Engineering-OS@8553124f238ab463d4a50debad34e871ef8de060
self_contained: true
---

# Implementation Plan

## Steps

1. **Slice vertically.** Each slice touches every layer needed for a visible, verifiable increment — not "all models, then all routes, then all tests".
2. **Order by risk.** The slice that could kill the design goes first; the riskiest assumption is tested cheapest.
3. **Record per slice:**
   - Intent (one sentence, outcome-phrased).
   - Files/components touched.
   - Tests added or changed.
   - Verification: the command(s) whose green output ends the slice.
   - Evidence: the artifact that proves it.
4. **Assign executors.** Human, Claude Code, Codex or OpenCode per slice.
5. **Reality-check slice 1.** Small enough to finish and verify in one session. If not, split again.

## Rules

- Plan against the spec text, not your memory of it. Reread the ACs before writing the plan.
- Scope changes update the plan file first, then the implementation.
- Spec drift gets a spec change with a note, never a quiet reinterpretation.
- Keep the plan where the work happens (`docs/plans/`), not in chat scrollback.

## Output

`docs/plans/<date>-<slug>.md`, using `references/ticket-template.md`.
