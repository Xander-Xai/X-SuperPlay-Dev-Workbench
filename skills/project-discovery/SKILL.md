---
name: project-discovery
description: Use when entering an unfamiliar repository, starting intake, or when documentation may have drifted from code. Covers minimal context, one-question-at-a-time discovery, baseline evidence, and intent capture.
license: UNLICENSED-PROPRIETARY
metadata:
  version: "0.4.0"
  status: CANDIDATE
  owner: Xander-Xai/X-SuperPlay-Dev-Workbench
  provenance: Xander-Xai/X-SuperPlay-AI-Engineering-OS@8553124f238ab463d4a50debad34e871ef8de060
  self_contained: true
  lifecycle_stage: intake
  supported_agents: claude-code,codex,opencode
  prerequisites: none
  dependencies: none
  install_method: node tools/skill-kit.mjs install --target <project> --agent <agent> --skills project-discovery
  tests: static frontmatter, catalog mapping, install dry-run, agent discovery, real-project effect
  upstream_equivalents: repo-intake-and-plan,context-engineering,brainstorming,interview-me
---

# Project Discovery

## Core principle

**Read enough to change behavior, not enough to write a tour.** Context is expensive. A repository overview that restates the directory tree usually adds cost without changing the next action.

## Intake sequence

1. **Find the governing rules.** Read the nearest `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, CI config, and branch protection. Project-local rules win over generic advice.
2. **Establish the real state.** Record `git rev-parse HEAD`, `git status --short`, the default branch, and the last CI result. Dirty or unknown state is a finding, not a footnote.
3. **Run the cheapest real command.** `npm test`, `make test`, `pytest -q`, or the documented smoke command. A command that fails is more informative than a README that claims it passes.
4. **Trace one path.** Follow a single user-visible flow from entrypoint to storage. This reveals the actual architecture faster than a diagram.
5. **List facts, assumptions, and UNKNOWNs separately.** Do not let a plausible inference become a fact.

## Interrogate the intent

Ask one question at a time, and challenge the first answer:

- What problem is this for, and who feels it?
- What happens if we do nothing?
- What is explicitly out of scope?
- What must never happen (security, data, money, reputation)?
- What is the smallest observable outcome that proves success?
- What authorization, budget, or deadline constrains us?

Stop when the answers are specific enough to write a testable acceptance criterion.

## Minimal context rules

- Do not write a directory tree or dependency inventory that can be regenerated.
- Do not restate framework documentation.
- Do write rules that change execution: commands, constraints, ownership, forbidden actions, current incidents.
- Link to files instead of pasting them.
- Keep `current-state` facts dated with `last_verified`.

## Output

- `project-brief.md`: problem, users, scope, constraints, authorization, stop conditions.
- `intent.md`: problem, expected outcome, impacted surfaces, constraints, open questions.
- `baseline.json`: HEAD, dirty state, detected stack, commands run.
- Drift list: documentation claims contradicted by code or commands.
- UNKNOWN list with the next verification action.

## Anti-rationalization

| Excuse | Reality |
|---|---|
| "I'll read the whole repo first" | Whole-repo reading burns context and rarely changes the first action. Trace one path. |
| "The README says it works" | Documentation is a claim. Run the command. |
| "The requirement is obvious" | Obvious to whom? Write it as a testable AC or it is still an assumption. |
| "I don't need to ask, I can infer" | Inferences are allowed, but must be labeled and verified. |
| "Git state doesn't matter" | Dirty or detached state changes what evidence means. Record it. |

## Red flags

- Editing before reading project-local rules.
- Treating a code comment or README as verified behavior.
- No baseline SHA or command output.
- Context notes that restate discoverable structure.
- Skipping user intent and jumping to a solution.
