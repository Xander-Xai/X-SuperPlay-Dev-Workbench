---
name: systematic-debugging
description: Use when a test fails, a build breaks, behavior differs from expectations, or an incident needs root-cause analysis. Covers reproduction, hypotheses, bisect, and regression tests.
license: UNLICENSED-PROPRIETARY
metadata:
  version: "0.4.0"
  status: CANDIDATE
  owner: Xander-Xai/X-SuperPlay-Dev-Workbench
  provenance: Xander-Xai/X-SuperPlay-AI-Engineering-OS@8553124f238ab463d4a50debad34e871ef8de060
  self_contained: true
  lifecycle_stage: implementation
  supported_agents: claude-code,codex,opencode
  prerequisites: none
  dependencies: none
  install_method: node tools/skill-kit.mjs install --target <project> --agent <agent> --skills systematic-debugging
  tests: static frontmatter, catalog mapping, install dry-run, agent discovery, real-project effect
  upstream_equivalents: debugging-and-error-recovery,systematic-debugging
---

# Systematic Debugging

## Core principle

**Reproduce, then test one hypothesis at a time.** A fix without a confirmed cause is a guess with extra steps.

## Procedure

1. **Reproduce.** Make the failure happen on demand. Record the exact command, environment, input, and commit.
2. **Minimize.** Remove unrelated steps until the smallest reproduction remains.
3. **Observe.** Read logs, stack traces, metrics, and the actual state. Do not start from the suspected line.
4. **Form one hypothesis.** State what must be true for the failure to occur.
5. **Test the hypothesis.** Change one variable or add one observation. Record the result.
6. **Bisect when needed.** Use `git bisect` or disable components to find the first bad change.
7. **Fix the cause.** Add a regression test that fails before the fix and passes after.
8. **Verify the surrounding behavior.** Run the nearest suite; look for the same failure elsewhere.

## Stop conditions

- The failure cannot be reproduced: gather more evidence before changing code.
- Two consecutive hypotheses produced no new evidence: change the model, ask for help, or escalate.
- The fix requires production access or an irreversible action: stop and get authorization.
- The symptom disappears without explanation: keep investigating; flaky disappearance is not a fix.

## Anti-rationalization

| Excuse | Reality |
|---|---|
| "I know what it is" | Then write the hypothesis and test it. Knowledge without evidence is a guess. |
| "Just add a try/catch" | Swallowing the error hides the cause and moves the failure downstream. |
| "It's flaky, ignore it" | Flakiness is a real defect in the test or the system. Classify and fix. |
| "It works now" | Without a cause, it will return. Record what changed. |
| "One more guess" | After two failed hypotheses, change the approach, not the guess. |
| "The logs are enough" | Logs are observations, not proof of cause. Test the mechanism. |

## Evidence

- reproduction command and input;
- hypothesis log;
- bisect range or experiment results;
- regression test name and result;
- root cause statement and affected surfaces.
