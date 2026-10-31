---
name: verification
description: Produce the evidence that proves work is done before claiming it is done. Use at the end of every task, before a PR, and before any release or completion claim.
status: candidate
version: 0.2.0
license: UNLICENSED-PROPRIETARY
provenance: Xander-Xai/X-SuperPlay-AI-Engineering-OS@8553124f238ab463d4a50debad34e871ef8de060
self_contained: true
---

# Verification

## Steps

1. **Read the required evidence** for the task type and the project's `ENGINEERING_PROFILE.yaml`. That list is the done contract.
2. **Run each evidence producer:**
   - `test` → full relevant suite on the final state; record passed/failed/skipped and why any skip exists.
   - `eval` → pinned dataset version; record numbers vs threshold, dataset hash and run config.
   - `integration-probe` → against the real dependency; record what was hit and the response.
   - `manual-probe` → perform it; record the receipt (screenshot, log excerpt, output file).
   - `doc-update` → docs edited in the same change; links resolve.
3. **Triage failures.** Real bug → fix. Outdated test → fix with a stated reason. Environmental → prove it. Never "ignore".
4. **Compose the evidence block:** command → result → artifact, one line each.
5. **Mark UNKNOWN honestly.** Anything not verified is UNKNOWN with the blocker named. UNKNOWN is not PASS.
6. **Update current-truth files** the work invalidated, with a fresh `last_verified`.

## Rules

- Evidence from another session or another person does not verify your change. Rerun.
- Name the evidence layer you actually reached: code check, real environment, or consumer acceptance.
- If you cannot produce the required evidence, the task is not done. Say so and route to the blocker.

## Output

An evidence block using `references/evidence-block.md`.
