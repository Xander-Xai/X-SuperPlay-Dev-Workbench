---
name: architecture
description: Use when designing system boundaries, data models, APIs, trust boundaries, or irreversible technical choices, and when an architecture decision must be recorded for future agents.
license: UNLICENSED-PROPRIETARY
metadata:
  version: "0.4.0"
  status: CANDIDATE
  owner: Xander-Xai/X-SuperPlay-Dev-Workbench
  provenance: Xander-Xai/X-SuperPlay-AI-Engineering-OS@8553124f238ab463d4a50debad34e871ef8de060
  self_contained: true
  lifecycle_stage: architecture
  supported_agents: claude-code,codex,opencode
  prerequisites: none
  dependencies: none
  install_method: node tools/skill-kit.mjs install --target <project> --agent <agent> --skills architecture
  tests: static frontmatter, catalog mapping, install dry-run, agent discovery, real-project effect
  upstream_equivalents: documentation-and-adrs,api-and-interface-design,doubt-driven-development
---

# Architecture

## Core principle

**Record the decision and its failure conditions, not just the diagram.** An architecture that cannot be falsified is a preference.

## Procedure

1. **State the forces.** Scale, latency, cost, team size, existing systems, compliance, reversibility.
2. **List at least two real options.** One option is usually a disguised constraint. Record the rejected option and why.
3. **Define boundaries.** Components, ownership, dependency direction, data ownership, trust boundaries.
4. **Define contracts.** API shape, error model, versioning, idempotency, compatibility window.
5. **Model failure.** Timeouts, retries, partial failure, duplicate delivery, rollback, degradation.
6. **Write the ADR.** Use Status / Context / Decision / Consequences; include alternatives and negative consequences.
7. **Define fitness functions.** Automated checks that prove the architecture still holds (dependency direction, schema compatibility, latency budget, authorization coverage).
8. **Adversarial review.** Ask what would make this decision wrong, and what evidence would reveal it.

## ADR rules

- One page is usually enough.
- Never edit an accepted ADR; supersede it with a new one.
- Include the falsifier: the observation that would force a revisit.
- Link the ADR to the spec, the code, and the tests that enforce it.
- Record negative consequences explicitly; an ADR with only benefits is marketing.

## API and data contracts

- Define request/response/error shapes and status codes.
- Define authentication and authorization at the boundary.
- Define pagination, filtering, idempotency, and rate limits.
- Define migration and backward compatibility.
- Treat external, user, and model output as untrusted.

## Fitness functions

Examples:

- import-direction test (domain must not import infrastructure);
- OpenAPI diff gate;
- schema migration up/down test;
- authorization coverage test;
- latency/cost budget in CI;
- contract test against a real dependency.

## Anti-rationalization

| Excuse | Reality |
|---|---|
| "The diagram is the architecture" | A diagram without decisions and consequences is decoration. |
| "There is only one option" | Then you have a constraint, not a decision. Name the constraint. |
| "We'll document it after" | Future agents inherit the code, not your memory. Write the ADR now. |
| "This choice is reversible" | Prove it. If not, say so and add a rollback plan. |
| "Security is a separate review" | Trust boundaries are architecture. Model them here. |
| "The API is obvious" | Obvious contracts still need error, auth, versioning, and idempotency. |

## Red flags

- Single-option ADR.
- No negative consequences.
- No falsifier or fitness function.
- Authorization only in the UI.
- Contract change with no compatibility plan.
- Accepted ADR edited in place instead of superseded.
