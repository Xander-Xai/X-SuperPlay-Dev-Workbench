---
name: specification
description: Use when turning an intent or feature request into testable acceptance criteria, negative cases, data contracts, and scope boundaries before design or implementation.
license: UNLICENSED-PROPRIETARY
metadata:
  version: "0.4.0"
  status: CANDIDATE
  owner: Xander-Xai/X-SuperPlay-Dev-Workbench
  provenance: Xander-Xai/X-SuperPlay-AI-Engineering-OS@8553124f238ab463d4a50debad34e871ef8de060
  self_contained: true
  lifecycle_stage: specification
  supported_agents: claude-code,codex,opencode
  prerequisites: none
  dependencies: none
  install_method: node tools/skill-kit.mjs install --target <project> --agent <agent> --skills specification
  tests: static frontmatter, catalog mapping, install dry-run, agent discovery, real-project effect
  upstream_equivalents: spec-driven-development,to-spec,to-prd
---

# Specification

## Core principle

**An acceptance criterion is a test that has not been written yet.** If you cannot name how it will be observed, it is not an AC.

## Structure

1. **Intent** — problem, user, expected outcome, non-goals.
2. **Scenarios** — 5–15 behavior statements, covering:
   - happy path;
   - edge/boundary;
   - error/failure;
   - security/permission;
   - concurrency/recovery where relevant.
3. **Acceptance criteria** — one observable condition per AC, numbered, each mapped to a test level.
4. **Data contracts** — input/output shape, required fields, validation, error codes.
5. **Non-functional constraints** — latency/cost budget, availability, accessibility, privacy, compatibility.
6. **Out of scope** — explicitly excluded behavior, so review can reject scope creep.
7. **Open questions** — owner and deadline; unresolved questions block implementation.

## EARS patterns

Use EARS to remove ambiguity:

- **Ubiquitous:** "The system shall …"
- **Event-driven:** "WHEN <trigger>, the system shall …"
- **State-driven:** "WHILE <state>, the system shall …"
- **Unwanted behavior:** "IF <condition>, THEN the system shall …"
- **Optional feature:** "WHERE <feature is enabled>, the system shall …"

Avoid "should", "fast", "user-friendly", "handle errors", and other untestable words.

## AC → test mapping

For each AC, record:

| AC | Test level | Test name / command | Evidence |
|---|---|---|---|
| AC-01 | unit | `...` | test output |
| AC-02 | integration | `...` | contract diff |
| AC-03 | manual / device | `...` | screenshot / receipt |

If an AC has no test level, it is a wish. If a test maps to no AC, it is either missing scope or dead weight.

## Data contracts

- Define required/optional fields and types.
- Define validation and rejection behavior.
- Define backward compatibility and versioning.
- Treat external and model output as untrusted input.

## Anti-rationalization

| Excuse | Reality |
|---|---|
| "The requirement is clear" | Clear in conversation ≠ testable in code. Write the AC. |
| "We'll define edge cases later" | Later is during implementation, when they become bugs. List them now. |
| "Given/When/Then is enough" | It is a start. Add EARS, data contracts, and non-functional constraints. |
| "More scenarios is better" | 5–15 focused scenarios beat 100 vague ones. |
| "Out of scope is obvious" | Writing it prevents silent scope creep during review. |
| "The model output is the answer" | Model output is untrusted input; specify validation and fallback. |

## Red flags

- ACs with no observable outcome.
- No negative or permission cases.
- No data contract for an API or model boundary.
- No non-goals.
- Open questions with no owner.
- Tests that do not map to any AC.
