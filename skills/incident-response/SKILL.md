---
name: incident-response
description: Use when a production service degrades, an alert fires, a security or data event occurs, or a postmortem is due. Covers severity, incident roles, stabilization, rollback, communication, and blameless review.
license: UNLICENSED-PROPRIETARY
metadata:
  version: "0.4.0"
  status: CANDIDATE
  owner: Xander-Xai/X-SuperPlay-Dev-Workbench
  provenance: Xander-Xai/X-SuperPlay-AI-Engineering-OS@8553124f238ab463d4a50debad34e871ef8de060
  self_contained: true
  lifecycle_stage: operation
  supported_agents: claude-code,codex,opencode
  prerequisites: systematic-debugging
  dependencies: systematic-debugging
  install_method: node tools/skill-kit.mjs install --target <project> --agent <agent> --skills incident-response
  tests: static frontmatter, catalog mapping, install dry-run, agent discovery, real-project effect
  upstream_equivalents: debugging-and-error-recovery,devops,verification-before-completion
---

# Incident Response

## Core principle

**Stabilize first, diagnose second, learn without blame.** An incident is managed by explicit roles, a shared timeline, and evidence — not by whoever is loudest in the channel.

## Detect and classify

- Watch the four golden signals: latency, traffic, errors, saturation.
- Alert on user-visible symptoms, not on every internal metric.
- Assign severity:
  - **SEV-1**: data loss, security breach, full outage, or irreversible harm.
  - **SEV-2**: major feature unavailable or severe degradation.
  - **SEV-3**: limited impact with a workaround.
  - **SEV-4**: minor/no user impact; handle in normal flow.

## Roles

| Role | Responsibility |
|---|---|
| Incident Commander (IC) | Owns decisions, priorities, and the timeline; does not debug. |
| Operations lead | Runs diagnosis and mitigation; coordinates technical work. |
| Communications lead | Updates users/stakeholders at a fixed cadence. |
| Scribe | Records timestamps, hypotheses, actions, and evidence. |

One person may hold multiple roles in a small incident, but the IC must not also be the only debugger.

## Procedure

1. **Open the incident record.** Start the timeline, severity, IC, and affected systems.
2. **Protect people and data.** For security/data events, preserve evidence and follow the legal/compliance escalation path; do not destroy logs.
3. **Stabilize.** Roll back, disable the flag, shed load, fail over, or restore from backup. Prefer reversible actions.
4. **Diagnose with `systematic-debugging`.** Reproduce, form hypotheses, test one at a time, record results.
5. **Communicate on cadence.** State impact, current action, next update time. Do not speculate about root cause.
6. **Recover and verify.** Confirm the golden signals, SLO/error budget, and a real user path. "Service is up" is not "incident is over".
7. **Close with a postmortem.** Within 48 hours for SEV-1/2.

## Blameless postmortem

Include:

- summary and user impact;
- timeline with timestamps and evidence links;
- contributing factors (technical, process, organizational), not a single "human error";
- what went well and what was luck;
- action items with owner, date, and verification method;
- detection/response gaps.

Do not name individuals as causes. Fix systems, incentives, and safeguards.

## Anti-rationalization

| Excuse | Reality |
|---|---|
| "It's back up, we're done" | Recovery must be verified against SLO and a real user path. Postmortem still due. |
| "We know the cause" | If you did not test the hypothesis, you have a suspect, not a cause. |
| "No time for a postmortem" | Without one, the same incident repeats. 48 hours, timeboxed. |
| "It was human error" | Humans act inside systems. Find the missing guardrail, alert, or review. |
| "We'll add monitoring later" | Detection gaps are action items, not aspirations. |
| "Don't tell users until fixed" | Silence erodes trust and delays workarounds. Communicate impact and cadence. |

## Evidence

- incident record and timeline;
- severity and role assignment;
- mitigation/rollback commands and results;
- user-facing communication log;
- postmortem with owned action items.
