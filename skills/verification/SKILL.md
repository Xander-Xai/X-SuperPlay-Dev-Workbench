---
name: verification
description: Use at the end of every task, before a PR, release, or completion claim. Covers test levels, real browser/device checks, performance budgets, flaky isolation, AI eval handoff, and honest UNKNOWN.
license: UNLICENSED-PROPRIETARY
metadata:
  version: "0.4.0"
  status: CANDIDATE
  owner: Xander-Xai/X-SuperPlay-Dev-Workbench
  provenance: Xander-Xai/X-SuperPlay-AI-Engineering-OS@8553124f238ab463d4a50debad34e871ef8de060
  self_contained: true
  lifecycle_stage: verification
  supported_agents: claude-code,codex,opencode
  prerequisites: none
  dependencies: none
  install_method: node tools/skill-kit.mjs install --target <project> --agent <agent> --skills verification
  tests: static frontmatter, catalog mapping, install dry-run, agent discovery, real-project effect
  upstream_equivalents: verification-before-completion,webapp-testing,browser-testing-with-devtools,performance-optimization
---

# Verification

## Core principle

**A claim without a command, result, and artifact is not evidence.** UNKNOWN is an honest answer; PASS without evidence is a lie.

## Required evidence

Read the task type and `ENGINEERING_PROFILE.yaml` first. That list is the done contract. Then produce:

- `test` — full relevant suite on the final state; passed/failed/skipped and why.
- `eval` — pinned dataset version, numbers vs threshold, dataset hash.
- `integration-probe` — real dependency, what was hit, response.
- `manual-probe` — receipt: screenshot, log excerpt, output file.
- `review` — independent review record.
- `doc-update` — docs changed in the same commit, links resolve.

## Test levels

Use the smallest level that proves the behavior:

| Level | Use for | Speed |
|---|---|---|
| Unit | pure logic, validation, state machines | ms |
| Integration | API/database/contract boundaries | seconds |
| E2E | critical user paths | minutes |
| Manual/device | install, permissions, real store build | human |

Target roughly 70/20/10 for unit/integration/E2E. Do not mock the boundary you are trying to prove.

## Browser and device checks

For UI changes:

- run the app, not just the tests;
- capture desktop and ~390px widths;
- check console errors, network failures, overflow, truncation, empty states;
- for mobile, use a real device or the closest available simulator and record the version;
- store screenshots/artifacts with the evidence block.

## Performance and reliability

- Record a budget (latency, bundle size, memory, cost) and the actual number.
- Run the performance check on the final artifact, not a dev build.
- Quarantine flaky tests with an owner and expiry; do not delete them silently.
- For AI, hand off to `eval-engineering`; a passing unit suite does not prove model behavior.

## Flaky tests

1. Reproduce with the same seed/environment.
2. Classify: timing, shared state, network, randomness, ordering.
3. Fix the cause or quarantine with an owner and expiry.
4. Never mark a flaky test as "known failure" without a tracking issue.

## Evidence block

```
command: <exact command>
environment: <OS, runtime, device, commit>
result: <pass/fail/skip + counts>
artifact: <path or link>
```

## Anti-rationalization

| Excuse | Reality |
|---|---|
| "It works on my machine" | Then record the machine and make it reproducible. |
| "The tests pass, so the UI is fine" | Tests do not prove layout, console, or real device behavior. Run the browser. |
| "UNKNOWN is as good as PASS" | No. UNKNOWN is a blocker with a name. |
| "The flaky test is unrelated" | Prove it or quarantine it with an owner. |
| "CI is enough" | CI is code checks. Release and user acceptance need real receipts. |
| "I'll verify after the PR" | The PR is where verification is reviewed. Verify before claiming done. |

## Red flags

- "Done" with no command output.
- Tests run before the final edit.
- UI changed but no browser screenshot.
- Mobile change with no device/simulator record.
- Flaky test skipped without an owner.
- CI green used as a production or acceptance claim.
