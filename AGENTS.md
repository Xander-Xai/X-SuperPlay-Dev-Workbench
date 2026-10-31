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

## Repository governance

- **Merge conditions**: a PR merges only when the required `verify` check (Workbench checks) is green on its head commit, it has no conflicts with `main`, the PR template's verification section names commands and results, and no secrets or private data are included. `main` accepts changes only through pull requests; force pushes and branch deletion are blocked. Fix a failing check; do not bypass it.
- **Stacked PRs**: keep a downstream PR's base on its upstream branch. Retarget to `main` and wait for real Actions only after the upstream PR merges; never retarget early just to trigger CI.
- **Issue closure**: close only when every acceptance item has evidence in the issue (command, environment, exact SHA, result). `PLAN_ONLY`, `PARTIAL`, `NOT_RUN`, `BLOCKED` and `UNKNOWN` are not `DONE`. Keep the issue open with the remaining items listed rather than hiding a capability gap.
- **Branches**: short-lived `feat/` `fix/` `chore/` `docs/`; merged branches are deleted (`delete_branch_on_merge` is enabled). Do not force-push a shared branch, and keep a Dependabot branch while its PR is open.
- **Dependabot**: merge one PR at a time and re-check the next PR's diff and CI after each merge. Before merging, confirm the pinned SHA equals the upstream release tag, read the release notes for breaking changes, confirm no permission expansion, and require the `verify` check. Never batch-merge dependency PRs.
- **Evidence boundary**: a green CI run, a merged PR and a successful Pages deploy prove only this repository's build, tests and static publish. They are not real-project acceptance, real-device validation or customer sign-off.

## Acceptance

No evidence, no DONE. PR merged does not mean site published. Agent outputs are proposals until the user and project verify them.
