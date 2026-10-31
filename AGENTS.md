# AGENTS.md

This public repository owns the **website, public engineering methodology/adaptation, runtime catalog, profiles, candidate Skills, offline CLI and safe plan generation**. It does **not** own third-party Skill implementations, private governance material, customer data, production evidence, or customer repositories. The method guide is navigation/advice; existing 11-stage lifecycle and project-local rules remain authoritative.

## Required workflow

- Read README.md, docs/ARCHITECTURE.md, docs/METHOD.md, src/catalog.mjs, src/engine.mjs, tests before changes. For AI-native methodology or learning-content changes also read docs/methods/AI-NATIVE-SPEC-HARNESS-SKILLS-LOOP.md, docs/methods/UPSTREAM-SOURCES.md, docs/methods/PROJECT-PILOT.md and docs/learning/START-HERE.md. For Agent orchestration changes also read docs/ORCHESTRATION.md and src/orchestration.mjs.
- For a catalog update, confirm the authoritative Engineering OS commit and registry via authorized access. Do NOT copy private normative documents or SKILL.md bodies.
- Preserve 11 unique stages, 8 candidate skills, and the four original routes unless an authorized source change justifies migration.
- Compatibility views (8 macro stages, 18 activities, delivery gates) must map back to the 11 canonical stages; never introduce a second lifecycle or state machine.
- External orchestration providers are execution environments, not lifecycles. They never receive push, deploy, merge or PR authority. External receipts stay UNTRUSTED and cannot promote evidence to VERIFIED.
- Do not vendor third-party provider source, add an executable dependency, install a provider or log into an account without explicit owner approval and a licence review.
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
