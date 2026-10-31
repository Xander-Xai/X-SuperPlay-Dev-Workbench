---
name: specification
description: Turn an idea or request into a short, verifiable specification with numbered acceptance criteria and a stated verification method for each. Use before feature work when requirements feel fuzzy or when acceptance is contested.
status: CANDIDATE
version: 0.2.0
license: UNLICENSED-PROPRIETARY
provenance: Xander-Xai/X-SuperPlay-AI-Engineering-OS@8553124f238ab463d4a50debad34e871ef8de060
self_contained: true
---

# Specification

## Steps

1. **Problem statement (≤3 sentences).** Who suffers, what breaks, what better means. If you cannot write it, return to discovery.
2. **Scope lines.** Write both `In scope:` and `Out of scope:`. Out-of-scope entries are load-bearing: they stop scope creep and expose misunderstandings.
3. **Acceptance criteria.** `AC-1 … AC-N`, each in `Given <state>, when <action>, then <observable outcome>` form. Every AC names its verification method: test / eval / integration probe / manual probe.
4. **Constraints.** Performance, security, compatibility, cost, regulatory.
5. **Risks.** Top 1–3, each with the mitigation you will take if it fires.
6. **Open questions.** Each with the default assumption you will proceed under if unanswered.

## Rules

- If an AC cannot be verified, rewrite the AC, not the plan.
- AI behavior changes require an eval set defined before implementation.
- The spec lives in the project (`docs/specs/`) and is current truth for the feature's duration.
- One page is usually enough. Length is a smell.

## Output

`docs/specs/<date>-<slug>.md`, using `references/ac-template.md`.
