---
name: release-engineering
description: Use when preparing, approving, executing, or rolling back a release or deployment. Covers immutable artifacts, migration compatibility, canary/blue-green/feature flags, rollback drills, and release receipts.
license: UNLICENSED-PROPRIETARY
metadata:
  version: "0.4.0"
  status: CANDIDATE
  owner: Xander-Xai/X-SuperPlay-Dev-Workbench
  provenance: Xander-Xai/X-SuperPlay-AI-Engineering-OS@8553124f238ab463d4a50debad34e871ef8de060
  self_contained: true
  lifecycle_stage: release
  supported_agents: claude-code,codex,opencode
  prerequisites: verification
  dependencies: verification
  install_method: node tools/skill-kit.mjs install --target <project> --agent <agent> --skills release-engineering
  tests: static frontmatter, catalog mapping, install dry-run, agent discovery, real-project effect
  upstream_equivalents: shipping-and-launch,ci-cd-and-automation,finishing-a-development-branch,deprecation-and-migration
---

# Release Engineering

## Core principle

**Build once, promote the same artifact, and keep a rollback that has been exercised.** A release is not "CI is green". It is an authorized change with a receipt.

## Preconditions

Do not start a release unless all are true:

- review is approved and blocking findings are closed;
- required evidence exists for the delivery state being claimed;
- the artifact is identified by an immutable digest or version;
- migrations are backward compatible for the deploy window, or an expand-contract plan exists;
- backup/restore has been verified, not merely documented;
- rollback steps and the person authorized to trigger them are named.

## Procedure

1. **Freeze the artifact.** Build once in CI; promote that digest through environments. Do not rebuild per environment.
2. **Check migration order.** Expand → deploy compatible code → backfill → contract old paths. Never drop or rename in the same step as the code change.
3. **Choose a rollout.** Canary or blue-green for user-facing services; feature flags for behavior changes; staged rollout for mobile/store releases. Name the abort threshold.
4. **Deploy with observability open.** Watch the four golden signals and the service's SLO/error budget during and after rollout.
5. **Verify the release.** Health check, smoke path, version/digest check, and the route's platform receipt. CI success is not a production receipt.
6. **Record the receipt.** Artifact digest, environment, start/end time, operator, checks run, result, rollback state.
7. **Close or roll back.** If the abort threshold is hit, roll back first; diagnose after stabilization.

## Rollback

- Prefer redeploying the previous immutable artifact.
- Revert the code commit if the artifact cannot be promoted back.
- Roll back migrations only with a tested down path or a verified backup; otherwise use a forward fix.
- For mobile/store releases, use staged rollout halt and server-side flags; you cannot un-ship a binary.
- Record the rollback receipt separately from the failed release receipt.

## Anti-rationalization

| Excuse | Reality |
|---|---|
| "CI passed, so it's released" | CI proves checks on a SHA. Release needs a deployment/store receipt and acceptance. |
| "We'll rebuild for prod" | Rebuilding changes the artifact. Build once and promote the digest. |
| "The migration is safe" | Prove it on a copy, including the down path. "Safe" without evidence is a guess. |
| "Rollback is just the previous image" | Only if the schema and config are compatible. Test the rollback, not the theory. |
| "We'll watch it after launch" | Watching without an abort threshold and an authorized operator is not a rollout plan. |
| "Feature flags are optional" | Flags are how you separate deploy from release. Use them for risky behavior changes. |

## Evidence

- artifact digest/version and environment;
- migration plan + dry-run result;
- rollout strategy and abort threshold;
- health/smoke result;
- platform/deployment receipt;
- rollback drill or actual rollback record.
