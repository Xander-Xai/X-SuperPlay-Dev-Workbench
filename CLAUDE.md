# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

The normative project instructions are in [AGENTS.md](AGENTS.md); this file adds navigation and the build/test mechanics. When they conflict, AGENTS.md wins.

## What this repository is

The current owner of the engineering runtime: 11-stage lifecycle, task routing, Profiles, bundled Skills, `xeng` CLI, evidence model and the static Workbench site. The old Engineering OS is historical provenance only and must not become a runtime dependency.

Two runtimes share one catalog:

- **Browser app** — [index.html](index.html) → [src/app.mjs](src/app.mjs). Static, no network, no filesystem, CSP `default-src 'self'` / `connect-src 'none'`. Everything it imports must be browser-safe.
- **Node CLI** — [tools/xeng.mjs](tools/xeng.mjs), [tools/skill-kit.mjs](tools/skill-kit.mjs), [tools/project-probe.mjs](tools/project-probe.mjs). Imports `src/`; the reverse never happens.

Prose documentation is Chinese; code, comments, CLI output, test names and commit messages are English.

## Commands

Node ≥ 20 (CI uses 22; local 24 also passes). Zero runtime dependencies — there is nothing to `npm install` and you should not run it.

~~~bash
npm run verify   # check + dependency scan + security gate + full test suite
npm run check    # catalog validation + required files + required DOM ids + legacy-flag guards
npm test         # node:test over test/*.test.mjs
npm run security # secret-scan gate; fail-closed, redacted
npm run scan     # rejects active runtime references to the retired repositories
npm run build    # writes dist/ from an explicit allowlist, then audits it
npm run dev      # http://127.0.0.1:4173 (PORT overrides); refuses tools/, test/, dotfiles
~~~

~~~bash
npm run probe -- --target ../your-project --type saas --output project-baseline.json
npm run xeng -- playbook --json
npm run skills -- list
~~~

Single test file, or a single test inside it:

~~~bash
node --test test/engine.test.mjs
node --test --test-name-pattern="catalog contains" test/engine.test.mjs
~~~

`npm run verify` does **not** run `build` or the site smoke test. CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs `check → security → test → build`, then boots the dev server and asserts `tools/check.mjs` is not served. Run `npm run build` before claiming a publishing change is done.

`npm run scan` fails on any *active* reference to the retired repositories, including a legacy `--source` flag pointing at a relative clone. Historical mentions are only allowlisted in `src/catalog.mjs`, `README.md`, `docs/MIGRATION.md`, `docs/ARCHITECTURE.md`, `migration/*`, and `test/` — new prose must not cite the old repo outside them.

## Architecture

Data flows one way:

~~~text
catalog (frozen constants)
  → routing (composeRoute: type × task × mode × tier → stages + skill closure)
  → engine (assemble / validateCatalog / Markdown+Manifest export)
  → workspace, starter, handoff (generated artifacts, all DRAFT_NOT_EXECUTED)
~~~

`delivery.mjs` (8/18 view) and `orchestration.mjs` (provider registry) are **read-only compatibility layers**; `validateCatalog()` calls `validateDelivery()` / `validateOrchestration()`, so they are validated even though nothing depends on them. `identity.mjs` is shared by starter/handoff/workspace; `engine.mjs` must not import `workspace.mjs` (the dependency is one-way).

Invariants enforced by code, not convention:

- **Counts are assertions.** 11 stages / 13 tasks / 17 profiles / 14 skills / 4 route types are checked in [src/engine.mjs](src/engine.mjs) and [test/engine.test.mjs](test/engine.test.mjs). Changing the catalog means updating both, plus the counts repeated in README/docs.
- **The 8 macro stages / 18 activities must map back onto the 11 canonical stages exactly once**, and each activity has exactly one primary Skill. This is `validateDelivery()` inside `validateCatalog()`.
- **Default states are the safety contract:** evidence starts `NOT_RUN`, generated artifacts are `DRAFT_NOT_EXECUTED`, Skills are `CANDIDATE`, imported reports are `IMPORTED_NOT_TRUSTED`. `VERIFIED` is terminal and requires command + result + artifact in an executed layer; nothing promotes it automatically — not CI, not a merged PR, not a successful provider plan.
- **Orchestration is planning only.** `plan` stays `PLAN_ONLY / DRY_RUN`; external receipts stay `UNTRUSTED / promotion:NONE`; no provider gets push, deploy, merge or PR authority.

## Adding browser code

A new module in the browser bundle needs four coordinated edits; missing any one fails `check` or `build`:

1. Import it from [src/app.mjs](src/app.mjs) — `build` rejects any `node:` import reachable from the entrypoint.
2. Add it to `FILES` in [tools/build-site.mjs](tools/build-site.mjs) — anything published outside that allowlist is an error, and the built `catalog.mjs` may not contain `node:fs` / `node:path` / `child_process` / `process.env`.
3. Add it to the `required` list in [tools/check.mjs](tools/check.mjs).
4. Any new UI region needs its `id` in `index.html` and in the `essential` list in `check.mjs`.

`index.html` must keep `src="./src/app.mjs"` and `<meta name="workbench-commit">`; `catalog.mjs` must keep `buildSha: "UNKNOWN_UNTIL_BUILT"` — the build substitutes both.

## Where to look

- [src/catalog.mjs](src/catalog.mjs) — lifecycle, tasks, profiles, skills, route SOPs, maturity/tier data. The single source of truth.
- [src/routing.mjs](src/routing.mjs) — type × task × mode × tier → stages, skills and evidence plan.
- [src/engine.mjs](src/engine.mjs) — plan composition, export and catalog validation.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — ownership layers, dependency direction, evidence model, browser security.
- [docs/METHOD.md](docs/METHOD.md) — the 8/18/11 compatibility view and delivery gates.
- [docs/ORCHESTRATION.md](docs/ORCHESTRATION.md) — Orca / Herdr / Multica / Tern registry, adapter contract and security limits.
- [docs/ROADMAP.md](docs/ROADMAP.md) — current status; check it before claiming something is implemented.
- [docs/learning/START-HERE.md](docs/learning/START-HERE.md) — learning entry (18-activity guide, stage-to-skill matrix, prompts, L1–L6 routes).
- [docs/methods/](docs/methods/) — canonical local synthesis, pinned upstream sources, product/Agent design, Skill factory, pilot SOP.

## Rules that matter here

- Generated artifacts stay `DRAFT_NOT_EXECUTED`; evidence starts `NOT_RUN`.
- The 8 macro stages / 18 activities are a compatibility view; they must map back to the 11 canonical stages and must not become a second lifecycle or state machine.
- Orchestration providers are execution environments, not a second lifecycle. `plan` stays `PLAN_ONLY / DRY_RUN`; external receipts stay `UNTRUSTED`; no provider gets push, deploy, merge or PR authority.
- Do not add a runtime dependency on `X-SuperPlay-AI-Engineering-OS`.
- Do not add client-side tokens, remote installers or deployment actions.
- Project-local rules in a target repository win over the advisory Git/playbook guidance.
- `main` accepts changes only through PRs whose required `verify` check is green on the head commit; never force-push or bypass the check. Merge Dependabot PRs one at a time.
- `docs/` and `skills/` are never published — the public artifact is only `index.html`, `styles.css`, `src/`, `.nojekyll`.
- Run `npm run verify` and review mobile layout (screenshots at desktop and ~390px, not code-reading) before claiming UI changes are complete.
