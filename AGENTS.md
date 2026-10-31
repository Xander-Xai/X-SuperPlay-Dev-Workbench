# AGENTS.md

This public repository owns the **website**, the curated public catalog and safe plan generation. It does not own engineering methodology, private Skills, production evidence, or customers.

## Required workflow

- Read README.md, docs/ARCHITECTURE.md, src/catalog.mjs, src/engine.mjs, tests before changes.
- For a catalog update, confirm the authoritative Engineering OS commit and registry via authorized access. Do NOT copy private normative documents or SKILL.md bodies.
- Preserve 11 unique stages, 8 candidate skills, and the four original routes unless an authorized source change justifies migration.
- Compatibility views (8 macro stages, 18 activities, delivery gates) must map back to the 11 canonical stages; never introduce a second lifecycle or state machine.
- Keep every exported evidence state NOT_RUN unless a different, explicit and verifiable evidence import is designed and independently audited.
- Never add a public client-side GitHub token, API secret, remote script installer or production deployment action.
- Run npm run verify. Code changes should also be smoke-tested with npm run dev and reviewed on mobile.
- Change via topic branch/PR; keep accurate verification and outstanding UNKNOWNs. Do not claim UI screenshots or real-device tests without running them.

## Project boundaries

- All product code, signed releases, test reports and real client material stay in their owning project repositories or secured systems.
- This repository may generate Markdown and JSON drafts with safe profile names and dry-run commands only.
- Source commit and date in src/catalog.mjs are pinned metadata; they do NOT imply live synchronization.

## Acceptance

No evidence, no DONE. PR merged does not mean site published. Agent outputs are proposals until the user and project verify them.
