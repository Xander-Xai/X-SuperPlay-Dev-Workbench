---
name: code-review
description: Use before merging any change, especially AI-generated diffs. Covers spec compliance, engineering standards, test weakening, dependencies, observability, risk-tiered depth, and reviewer independence.
license: UNLICENSED-PROPRIETARY
metadata:
  version: "0.4.0"
  status: CANDIDATE
  owner: Xander-Xai/X-SuperPlay-Dev-Workbench
  provenance: Xander-Xai/X-SuperPlay-AI-Engineering-OS@8553124f238ab463d4a50debad34e871ef8de060
  self_contained: true
  lifecycle_stage: review
  supported_agents: claude-code,codex,opencode
  prerequisites: verification
  dependencies: verification
  install_method: node tools/skill-kit.mjs install --target <project> --agent <agent> --skills code-review
  tests: static frontmatter, catalog mapping, install dry-run, agent discovery, real-project effect
  upstream_equivalents: code-review-and-quality,requesting-code-review,receiving-code-review
---

# Code Review

## Core principle

**Review the change against two axes: does it satisfy the spec, and does it meet engineering standards?** A review that only reads the diff for style is incomplete.

## Axes

1. **Spec axis** — each accepted AC is implemented and evidenced; negative cases are covered; scope matches the ticket.
2. **Standards axis** — correctness, security, tests, dependencies, observability, maintainability, performance, accessibility.

## Risk-tiered depth

| Risk | Examples | Required depth |
|---|---|---|
| High | auth, payments, data migration, tenant boundary, irreversible ops, public API | line-by-line + threat model + independent reviewer |
| Medium | business logic, integrations, UI flow | full diff + tests + contract check |
| Low | docs, comments, formatting | targeted check + CI |

## Checklist

- **Correctness:** edge cases, error paths, null/empty, concurrency, idempotency.
- **Security:** trust boundaries, authorization server-side, injection, secrets, dependency/supply chain.
- **Tests:** do they prove the AC? Were any assertions weakened, skipped, or deleted? Is the failure path tested?
- **Dependencies:** new package justified, pinned, license checked, no typosquat.
- **Observability:** logs/metrics/traces for new failure modes; no PII/tokens in logs.
- **Maintainability:** naming, duplication, dead code, hidden coupling, comments that explain why.
- **Performance:** obvious N+1, unbounded loops, payload size, cost.
- **Compatibility:** API/schema migration, versioning, rollback.
- **Observability of the change itself:** can the reviewer reproduce the evidence?

## Findings

Classify each finding:

- `block-security` — exploitable auth/data/injection issue. Non-negotiable.
- `block` — cannot satisfy the AC or evidence is missing.
- `advisory` — improvement with a tracked follow-up, does not block.
- `nit` — style; do not inflate.

A finding does not automatically become a new requirement. Only issues that prevent honest satisfaction of the original AC return to the mainline.

## Reviewer independence

- The writer must not be the sole reviewer of a high-risk change.
- The reviewer should start from the spec and evidence, not the author's narrative.
- If the reviewer lacks context, ask for the smallest missing artifact; do not guess.

## Anti-rationalization

| Excuse | Reality |
|---|---|
| "The tests pass" | Tests can be weakened or miss the failure path. Read them. |
| "It's AI-generated, so it's probably fine" | AI diffs need more scrutiny, not less. Check assumptions and scope. |
| "We can fix it in a follow-up" | Security and AC gaps block. Only advisories can wait. |
| "The diff is too large to review" | Then split it. A large diff is a process finding. |
| "I wrote it, I know it works" | You share the assumptions that produced the bug. Use an independent reviewer. |
| "The new dependency is standard" | Check version, lockfile, license, and advisories. |

## Output

- `review.md` with axis-by-axis verdict;
- findings with severity and file/line;
- explicit approve / block / block-security;
- evidence checked;
- follow-ups with owner and date.
