---
name: architecture
description: Make and record boundary or component decisions as ADRs with options, consequences and a falsifier. Use when adding a service, a dependency class, a cross-repo boundary, or any choice that would cost days to reverse.
status: CANDIDATE
version: 0.2.0
license: UNLICENSED-PROPRIETARY
provenance: Xander-Xai/X-SuperPlay-AI-Engineering-OS@8553124f238ab463d4a50debad34e871ef8de060
self_contained: true
---

# Architecture

## Steps

1. **Name the decision in one sentence.** "Use Qdrant for vector storage", not "improve RAG".
2. **State the forces.** Scale, cost, team, existing components, regulatory constraints.
3. **List at least two real options.** For each, one line on consequences. A one-option decision is usually a constraint wearing a costume.
4. **Record the decision and why.** Include the falsifier: what fact would make you revisit.
5. **State consequences.** Positive, negative, neutral. Name the obligations created: ops, security, testing.
6. **Write the ADR.** Use `references/adr-template.md`. Supersede old ADRs via status only; never rewrite an old body.

## Rules

- Cross-repo boundaries also record which repository owns each side.
- Boundary contracts (OpenAPI, schema, CLI contract) are part of the consequences.
- If you cannot name how you would know the architecture works, it is not decided yet.
- Right-size: reversible decisions get light ADRs; do not produce ADR theater.

## Output

`docs/adr/NNNN-kebab-title.md`.
