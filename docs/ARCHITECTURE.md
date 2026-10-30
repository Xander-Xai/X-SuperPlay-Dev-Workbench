# Workbench 架构与 Canonical Ownership

## 系统边界

由私有 X-SuperPlay-AI-Engineering-OS 维护唯一生命周期、Profile、Skills、Gate、xeng 逻辑。
本公开 Workbench 只提供 **curated metadata → workflow composition → browser UI → export**。

~~~text
Private Engineering OS (normative, source commit pinned)
       │  owner-authorized metadata review (manual for MVP)
       ▼
src/catalog.mjs  ← publicly safe summary; never private bodies
       │
src/engine.mjs   ← composition + safe filename/command generation
       │
src/app.mjs      ← browser UI (no remote writes)
       │
Markdown / JSON ← local download, NOT_RUN evidence
       │
real project repo ← human review + authorized agent + actual tests
       │
engineering improvement PR → private OS (not this public UI)
~~~

## Canonical ownership contract

| Data | Authority | Workbench responsibility |
| --- | --- | --- |
| Engineering lifecycle/gates | Engineering OS | Label and link; do not fork normative texts |
| Profile obligations | Engineering OS | Pinned name mapping and high-level public guidance |
| SKILL.md + actual status | Engineering OS | Display candidate metadata only |
| Project-local decisions | Product repository | Export seed; never override real project rules |
| Executed tests and deployment | Product repository / platform | Never manufacture PASS |
| AI collaboration mechanics | AI-Native-Work-Learning-OS | Reference selectively; do not re-own |
| Business demand and ROI | FDE OS / OPC Blueprint | Link; do not copy client data |

## Privacy rule

The current public catalog is hand-curated from the source *names* and generic engineering concepts. It deliberately omits private Skills code, evidence, customer names, company implementation specifics, secrets and full governance contents. Source SHA 8553124f... is provenance, not a permission grant. Front-end modules import only bundled public files.

No browser-side GitHub token, no external Skill script execution and no privileged backend.

## Versioning / drift

Update process: inspect source main commit and the two Registry YAMLs in an authorized environment → change only intentionally public metadata → update pinned commit and verified date → validate with npm run verify → review changes via PR.

If the source is not accessible, keep the last pinned snapshot with an explicit stale badge. Never silently claim live sync. A future private connector/CLI may produce an allowlisted export artifact for this repository; a public CI job must not fetch private data.

## Gate semantics

GENERATED_NOT_EXECUTED, NOT_RUN and candidate are hardcoded safe defaults of this MVP. Real evidence is collected and validated in product repos, not by toggling a website checkbox.

## Future installer

Current MVP includes tools/skill-kit.mjs: an explicitly local-only, offline, default dry-run copier for a fixed Git SHA of the authorized source. It verifies skill frontmatter, exact path, duplicate targets, and prints SHA-256 receipts. It never executes a Skill or fetches credentials, and --apply is required for copying. Supported direct SKILL.md only; directories with extra assets are rejected until reviewed. It does not automatically verify licensing or the privacy of the target project; the operator must review both. Future iterations may add signed bundles, lockfiles and proven rollback.
