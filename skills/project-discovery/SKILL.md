---
name: project-discovery
description: Rapidly build an accurate, evidence-based mental model of a repository before changing it. Use at project intake, when onboarding an unfamiliar codebase, or when docs and reality may disagree.
status: CANDIDATE
version: 0.2.0
license: UNLICENSED-PROPRIETARY
provenance: Xander-Xai/X-SuperPlay-AI-Engineering-OS@8553124f238ab463d4a50debad34e871ef8de060
self_contained: true
---

# Project Discovery

Build an honest model of what the repository **is**, not what its README claims.

## Steps

1. **Read the governance layer first.** README, AGENTS.md (including nested), CLAUDE.md, ENGINEERING_PROFILE.yaml. Note contradictions instead of resolving them silently.
2. **Read the reality layer.** Directory tree, task runner targets (`package.json` scripts, Makefile, pyproject), test layout, CI workflows, `.env.example`.
3. **Audit current truth.** Find the file that answers "what is true now". Check its `last_verified` date. Treat dated reports as historical snapshots, never current fact.
4. **Verify one command.** Run the cheapest documented test or lint command. A broken documented command is a primary finding.
5. **Map boundaries.** Upstream/downstream repositories, external services (env vars), generated artifacts.
6. **Write a discovery note.** Dated, at most one page: what this repo is, what is true, what is stale, what is risky. See `references/discovery-note.md`.

## Outputs

- A dated discovery note.
- A list of drift items for the project owner.
- Explicit UNKNOWN items with the next verification step.

## Failure modes

- Trusting the README before running one command.
- Treating an old audit as current truth.
- Reading code before knowing which tests are green.
- Presenting assumptions as facts.
