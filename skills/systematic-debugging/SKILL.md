---
name: systematic-debugging
description: Find root causes before fixing. Use when behavior does not match expectations, tests fail inexplicably, builds break, or any "works on my machine" situation appears.
status: CANDIDATE
version: 0.2.0
license: UNLICENSED-PROPRIETARY
provenance: Xander-Xai/X-SuperPlay-AI-Engineering-OS@8553124f238ab463d4a50debad34e871ef8de060
self_contained: true
---

# Systematic Debugging

## Steps

1. **Reproduce deterministically.** Record command, input and environment. A bug you cannot reproduce on demand cannot be verified as fixed. If reproduction is impossible, say why and switch to investigation mode.
2. **State the failure precisely.** Expected vs actual, with the exact observable.
3. **Form one hypothesis with a mechanism.** "X because Y happens between A and B", not "maybe it's X".
4. **Design the cheapest experiment that could falsify it.** Log line, breakpoint, unit repro, bisect.
5. **Run it and record the result.** Falsified → next hypothesis informed by the result. Confirmed → root cause in one sentence.
6. **Fix the root cause**, not the nearby symptom. If the fix is at a different layer, say why.
7. **Add a regression test** that fails before the fix and passes after it.
8. **Verify the whole surface** the fix touches, not only the new test.

## Rules

- Two failed fixes on the same root cause without a hypothesis change → STOP. Gather more evidence, get a second opinion, or question the architecture.
- Never "fix" by deleting the test or assertion that caught the bug.
- If you are trying changes to see what happens, you have left this procedure.

## Output

A hypothesis log using `references/hypothesis-log.md`, plus the regression test.
