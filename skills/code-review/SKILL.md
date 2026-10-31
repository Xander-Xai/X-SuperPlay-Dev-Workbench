---
name: code-review
description: Review a diff adversarially before merge, whether your own work or another agent's. Use when completing a task, before requesting merge, or when reviewing an AI-generated changeset.
status: CANDIDATE
version: 0.2.0
license: UNLICENSED-PROPRIETARY
provenance: Xander-Xai/X-SuperPlay-AI-Engineering-OS@8553124f238ab463d4a50debad34e871ef8de060
self_contained: true
---

# Code Review

## Steps

1. **Get the intent first.** Read the spec/ACs and the plan step for this diff. Review against intent, not the diff's own claims.
2. **Correctness against ACs.** Does each AC have implementing code and a test that encodes it? Missing test is a finding.
3. **Security surface.** Auth/authz on new routes, tenant boundary, injection points (including model output and tool results as input), secret exposure, rate limiting on new expensive paths. These are `block-security`.
4. **Boundary damage.** Changed contracts, cross-repo impact, nested AGENTS rules, migration downgrade path.
5. **Test quality.** Do tests encode behavior or implementation? Would they catch the bug they claim to catch? Flaky or skipped patterns?
6. **Simplification.** Dead code, premature abstraction, duplicated logic, over-engineering. These are suggestions, not blockers.
7. **Verdict.** `approve` | `block` (specific, testable objections) | `block-security`. "I would have done it differently" is a follow-up, not a verdict.
8. **Record it.** PR comment or PR body self-review section. Objections cite file:line.

## AI-diff specifics

- Assume the author agent overclaims: verify every "done" against the actual diff.
- Look for classic agent artifacts: unreachable defensive code, duplicated existing logic, stubs that swallow cases, tests asserting implementation details.
- Check that nothing outside the plan's file list was touched.

## Solo rule

Self-review is mandatory. Produce the verdict and objection list even when you are the only reviewer.

## Output

A review using `references/review-checklist.md`.
