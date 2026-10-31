---
name: documentation-sync
description: Make documentation match reality after a change, and detect where docs have already drifted. Use after any implementation change, and proactively when staleness is suspected.
status: CANDIDATE
version: 0.2.0
license: UNLICENSED-PROPRIETARY
provenance: Xander-Xai/X-SuperPlay-AI-Engineering-OS@8553124f238ab463d4a50debad34e871ef8de060
self_contained: true
---

# Documentation Sync

## Steps

1. **List what the change invalidated.** README claims, AGENTS/CLAUDE commands, current-state facts, config docs, API docs, CHANGELOG. Change first, then this list.
2. **Update current-truth surfaces in the same change.** The file that answers "what is true now" gets the new fact and a fresh `last_verified`.
3. **Verify commands.** Every command in the docs you touched must be runnable. Run the cheap ones; flag the expensive ones honestly.
4. **Check counts.** Replace hardcoded numbers ("37 tests", "12 endpoints") with links to generators or remove them.
5. **Preserve history.** Never edit dated reports to make them current. Write a new dated report and supersede-link the old one.
6. **Run mechanical checks.** Link check, dead paths, env drift, and the project's own doctor command.
7. **Register the document** if the project uses a document registry.

## Rules

- Docs in a later PR than the code create a drift window. Same-PR docs for behavior changes.
- If docs say X and code does Y, decide which is newer intent and fix one. Never leave both.
- Generated docs are regenerated, never hand-edited.

## Output

A docs diff in the same PR, `last_verified` touched, and the mechanical check output noted in the evidence block. Registry format: `references/doc-registry.md`.
