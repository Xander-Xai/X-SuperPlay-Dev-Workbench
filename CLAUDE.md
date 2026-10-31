# CLAUDE.md

Context for Claude Code sessions in this repository. The normative project instructions are in [AGENTS.md](AGENTS.md); this file only adds navigation.

## What this repository is

The current owner of the engineering runtime: 11-stage lifecycle, task routing, Profiles, bundled Skills, `xeng` CLI, evidence model and the static Workbench site. The old Engineering OS is historical provenance only and must not become a runtime dependency.

## Navigation

- `src/catalog.mjs` — lifecycle, tasks, profiles, skills, route SOPs, maturity/tier data.
- `src/routing.mjs` — type × task × mode × tier → stages, skills and evidence plan.
- `src/workspace.mjs` — generated project artifacts (16 entries).
- `src/playbooks.mjs` — AI application / RAG / Agent operating manuals.
- `src/git-workflow.mjs` — advisory project Git guidance and per-agent notes.
- `src/maturity.mjs` — L0–L6 gap diagnostic.
- `tools/xeng.mjs` — init / audit / doctor / maturity / playbook / **method** / task / assemble.
- `docs/methods/AI-NATIVE-SPEC-HARNESS-SKILLS-LOOP.md` — canonical local synthesis; source/version caveats.
- `docs/methods/UPSTREAM-SOURCES.md` — pinned Matt Pocock / OpenAI Harness / Ralph reference.
- `docs/methods/AI-NATIVE-PRODUCT-AGENT-DESIGN.md` — product discovery and Agent architecture card.
- `docs/methods/SKILL-ENGINEERING-FACTORY.md` — Skill creation, Code Expert example, evaluation/promotion.
- `docs/methods/PROJECT-PILOT.md` — lighthouse product pilot with evidence/STOP.
- `docs/` — architecture, migration, playbook, Git workflow and maturity documentation.

## Common commands

~~~bash
npm run verify     # check + dependency scan + tests
npm run dev        # local site at http://127.0.0.1:4173
npm run build      # audited Pages artifact
node tools/xeng.mjs playbook --json
node tools/xeng.mjs method design
node tools/xeng.mjs method skills
~~~

## Rules that matter here

- Generated artifacts stay `DRAFT_NOT_EXECUTED`; evidence starts `NOT_RUN`.
- Do not add a runtime dependency on `X-SuperPlay-AI-Engineering-OS`.
- Do not add client-side tokens, remote installers or deployment actions.
- Project-local rules in a target repository win over the advisory Git/playbook guidance.
- Run `npm run verify` and review mobile layout before claiming UI changes are complete.
