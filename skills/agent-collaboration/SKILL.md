---
name: agent-collaboration
description: Use when planning or running work with multiple agents, subagents, worktrees, agent teams, or batch workers, or when assigning writers and reviewers. Covers delegation contracts, file ownership, human gates, and handoff.
license: UNLICENSED-PROPRIETARY
metadata:
  version: "0.4.0"
  status: CANDIDATE
  owner: Xander-Xai/X-SuperPlay-Dev-Workbench
  provenance: Xander-Xai/X-SuperPlay-AI-Engineering-OS@8553124f238ab463d4a50debad34e871ef8de060
  self_contained: true
  lifecycle_stage: planning
  supported_agents: claude-code,codex,opencode
  prerequisites: implementation-plan
  dependencies: implementation-plan
  install_method: node tools/skill-kit.mjs install --target <project> --agent <agent> --skills agent-collaboration
  tests: static frontmatter, catalog mapping, install dry-run, agent discovery, real-project effect
  upstream_equivalents: subagent-driven-development,dispatching-parallel-agents,using-git-worktrees,finishing-a-development-branch
---

# Agent Collaboration

## Core principle

**Parallelism without ownership is conflict.** More agents only help when each has a bounded task, a disjoint write set, and an independent checker. Otherwise they multiply token cost and merge pain.

## Plan mode first

Before dispatching any implementation agent:

1. Write the plan and the acceptance criteria.
2. Get human approval for scope, allowed commands, and budget.
3. Only then delegate execution.

A subagent must not be used to bypass a decision the human has not made.

## Modes

| Mode | Use when | Isolation | Forbidden |
|---|---|---|---|
| `solo` | One writer, small change | Current worktree | Parallel writers |
| `subagents` | Independent research or implementation slices in one session | Shared worktree, disjoint files | Two writers on one file |
| `worktrees` | Parallel writers or experiments | One worktree per writer | Shared uncommitted state |
| `agent-teams` | Exploratory work needing peer messaging and a shared task list | Worktrees still required for writes | Assuming the platform isolates files automatically |
| `batch-pr` | Many independent mechanical tasks | One worktree and one PR per worker | Batching several workers into one PR |

## Delegation contract

Every delegated task must state:

- `ticket_id` and the accepted AC;
- `writer` and `reviewer` (must be different);
- `base_sha` and branch;
- `worktree` path (required for parallel writers);
- `allowed_files` and `allowed_commands`;
- stop conditions and budget;
- required evidence paths;
- human gates;
- handoff format.

If any field is missing, the task is not ready to delegate.

## File ownership

- Partition by file or module. Two writers must not edit the same file in parallel.
- If a shared file must change, serialize it or assign one owner.
- A reviewer must not be the writer of the same change.
- The orchestrator owns the merge order and resolves conflicts; workers do not merge each other.

## Human gates

A human must approve:

- merge to the protected branch;
- production access or deployment;
- permission/credential changes;
- spend above the agreed budget;
- external communications;
- destructive or irreversible actions.

No agent may approve its own gate, disable a hook, or bypass a required check.

## Handoff

Return a compact handoff, not a transcript:

- base SHA and branch/worktree;
- files changed and why;
- commands run and results;
- evidence paths;
- open questions / UNKNOWNs;
- recommended next action.

## Anti-rationalization

| Excuse | Reality |
|---|---|
| "More agents = faster" | Coordination and token cost grow faster than throughput. Parallelize only independent slices. |
| "They can share the worktree" | Shared writable state causes lost edits and unreviewable diffs. Use worktrees. |
| "The agent can review its own work" | Self-review misses the assumptions that produced the bug. Use an independent reviewer. |
| "We'll resolve conflicts later" | Conflicts are cheapest before parallel work starts. Partition files up front. |
| "The team feature isolates work automatically" | Verify the platform's actual isolation. Do not assume. |
| "The human gate is a formality" | Gates exist for irreversible actions. Automating past them is the failure mode. |

## Red flags

- Two writers with overlapping `allowed_files`.
- A reviewer identical to the writer.
- A subagent with no base SHA or stop condition.
- Parallel work without worktrees.
- An agent merging, deploying, or changing permissions on its own.
- A handoff that says "done" without commands and evidence.
