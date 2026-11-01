---
name: documentation-sync
description: Use when code, configuration, APIs, commands, or ownership changed and current-truth documentation may have drifted. Covers last_verified dates, dead links/commands, ADR indexes, and handoff.
license: UNLICENSED-PROPRIETARY
metadata:
  version: "0.4.0"
  status: CANDIDATE
  owner: Xander-Xai/X-SuperPlay-Dev-Workbench
  provenance: Xander-Xai/X-SuperPlay-AI-Engineering-OS@8553124f238ab463d4a50debad34e871ef8de060
  self_contained: true
  lifecycle_stage: release
  supported_agents: claude-code,codex,opencode
  prerequisites: none
  dependencies: none
  install_method: node tools/skill-kit.mjs install --target <project> --agent <agent> --skills documentation-sync
  tests: static frontmatter, catalog mapping, install dry-run, agent discovery, real-project effect
  upstream_equivalents: documentation-and-adrs,writing-guidelines
---

# Documentation Sync

## Core principle

**Documentation is a claim about current behavior, not a historical narrative.** If it is not verified, date it or remove it.

## What to sync

- README commands and prerequisites;
- configuration and environment variable names;
- API contracts and versioning;
- architecture decision index and superseded links;
- runbooks and rollback steps;
- ownership and contact paths;
- current-state facts and `last_verified`.

## Procedure

1. **Find the claims.** Grep for commands, paths, versions, and status statements.
2. **Run the commands.** A documented command that fails is a defect.
3. **Check the links.** Relative links must resolve; external links are best-effort.
4. **Update or date.** If verified, set `last_verified: YYYY-MM-DD`. If unverified, say so or delete the claim.
5. **Update the ADR index.** New ADRs linked; superseded ADRs marked.
6. **Remove stale instructions.** Do not leave a "deprecated" path that still looks runnable.
7. **Hand off.** A reader should be able to reproduce the current state without the author.

## Boundaries

- `documentation-sync` owns drift, links, commands, and current-truth dates.
- Postmortems belong to `incident-response`.
- Architecture decisions belong to `architecture`.
- Do not edit accepted ADRs; supersede them.

## Anti-rationalization

| Excuse | Reality |
|---|---|
| "The docs are close enough" | Close enough still sends the next agent down a dead path. |
| "We'll update docs in the next PR" | The next PR rarely comes. Update in the same change. |
| "It's just a comment" | Comments and docs are claims; stale claims mislead. |
| "The link works for me" | Check it in the repository, not your local cache. |
| "Nobody reads this" | Future agents and reviewers do. And they act on it. |

## Evidence

- list of claims checked;
- commands run and results;
- links checked;
- files updated with dates;
- remaining UNKNOWNs.
