---
name: implementation
description: Use when implementing any feature, bugfix, or behavior change, before writing production code. Covers red-green-refactor, minimal diffs, allowed files and commands, stop conditions, and execution evidence.
license: UNLICENSED-PROPRIETARY
metadata:
  version: "0.4.0"
  status: CANDIDATE
  owner: Xander-Xai/X-SuperPlay-Dev-Workbench
  provenance: Xander-Xai/X-SuperPlay-AI-Engineering-OS@8553124f238ab463d4a50debad34e871ef8de060
  self_contained: true
  lifecycle_stage: implementation
  supported_agents: claude-code,codex,opencode
  prerequisites: implementation-plan
  dependencies: implementation-plan
  install_method: node tools/skill-kit.mjs install --target <project> --agent <agent> --skills implementation
  tests: static frontmatter, catalog mapping, install dry-run, agent discovery, real-project effect
  upstream_equivalents: test-driven-development,incremental-implementation,executing-plans,subagent-driven-development
---

# Implementation

## Core principle

**No production code without a failing test that proves the behavior is missing.**

Implementation is not "write the feature, then test it". It is a sequence of small, evidence-backed loops. A diff that cannot name the test it makes pass is not ready for review.

## Loop

1. **Read the ticket contract.** Confirm `ticket_id`, accepted AC, `base_sha`, `allowed_files`, `allowed_commands`, stop conditions, and reviewer.
2. **RED — one test.**
   - Write the smallest test that expresses one AC or negative case.
   - Run it. It must fail.
   - Confirm it fails for the expected reason, not because of a typo or missing import.
3. **GREEN — minimal code.**
   - Write only enough code to make that test pass.
   - Run the test and the nearest regression suite.
   - Do not add speculative abstractions.
4. **REFACTOR — only while green.**
   - Remove duplication, improve names, simplify control flow.
   - Run the same tests after every refactor step.
5. **Repeat** for the next AC. Commit one logical change at a time.

## Contract rules

- Stay inside `allowed_files`. If the fix requires a file outside the list, stop and amend the ticket; do not silently expand scope.
- Run only `allowed_commands` plus the project's documented test/lint/type commands. Do not install tools or reach the network without approval.
- Keep the working tree deterministic: no generated files, no secrets, no local absolute paths.
- Do not weaken, skip, or delete an existing assertion to make the suite pass. If a test is wrong, change it in a separate, reviewed commit with a stated reason.
- One test at a time. A batch of failing tests hides which change made which test pass.

## Stop conditions

Stop and report `BLOCKED` or `HUMAN_REQUIRED` when:

- credentials or permissions are missing;
- two consecutive fix attempts produced no new evidence or changed no assumption;
- the change needs a dependency, migration, or public contract change not in the ticket;
- the iteration/time/cost budget is exhausted;
- the implementation drifts outside the accepted AC.

## Evidence

Record, per slice:

- test name and the command that ran it;
- RED output (expected failure) and GREEN output (pass);
- files changed and why;
- commands run and their results;
- any UNKNOWN left open.

## Anti-rationalization

| Excuse | Reality |
|---|---|
| "I'll write tests after it works" | Tests-after describe what the code does, not what it should do. You will bake in bugs. |
| "This is too small to test" | Small changes break production too. The test is the specification. |
| "The test is hard to write" | That is design feedback: the unit is too coupled or the AC is unclear. Fix the design or the spec. |
| "I already tested it manually" | Manual checks do not persist and cannot be re-run by review or CI. |
| "The existing test is wrong" | Then change it deliberately, in its own commit, with evidence. Never delete it silently. |
| "I need to refactor first" | Prefactor only if the ticket allows it and the refactor is covered by tests. |

## Red flags

- Production code exists before any failing test.
- A test passes on its first run.
- The diff includes files outside `allowed_files`.
- The test was changed to match the implementation.
- "All tests pass" without a pasted command and output.
