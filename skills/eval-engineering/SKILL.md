---
name: eval-engineering
description: Use when building or changing AI, RAG, or agent behavior, prompts, models, retrieval, or tool policies. Covers dataset versioning, layered evals, thresholds, red teaming, and regression evidence.
license: UNLICENSED-PROPRIETARY
metadata:
  version: "0.4.0"
  status: CANDIDATE
  owner: Xander-Xai/X-SuperPlay-Dev-Workbench
  provenance: Xander-Xai/X-SuperPlay-AI-Engineering-OS@8553124f238ab463d4a50debad34e871ef8de060
  self_contained: true
  lifecycle_stage: specification
  supported_agents: claude-code,codex,opencode
  prerequisites: verification
  dependencies: verification
  install_method: node tools/skill-kit.mjs install --target <project> --agent <agent> --skills eval-engineering
  tests: static frontmatter, catalog mapping, install dry-run, agent discovery, real-project effect
  upstream_equivalents: verification-before-completion,ai-research-reproduction,academic-paper-reviewer
---

# Eval Engineering

## Core principle

**A model change without a versioned eval is an opinion.** Evals are the regression suite for non-deterministic behavior. They must be reproducible, thresholded, and run before and after the change.

## Eval pyramid

1. **Deterministic checks (base).** Schema validity, required citations, banned phrases, tool-call shape, latency/cost caps. Cheap, fast, CI-blocking.
2. **Rubric / LLM judge (middle).** Task quality against a written rubric, calibrated against human labels. Record judge model, prompt, and version.
3. **Red team / canary (top).** Adversarial prompts, prompt injection, data exfiltration, unsafe tool use, distribution shift. Small but high-signal.

## Procedure

1. **Define the behavior and failure modes.** What must the system do, and what must it never do? Tie each to a product AC.
2. **Version the dataset.** Store cases with IDs, inputs, expected properties, and provenance. Hash the dataset. Changing a case is a reviewed change.
3. **Choose metrics and thresholds.** Retrieval: Hit@K, Recall@K, MRR. Generation: groundedness, citation accuracy, answer correctness. Agent: task success, steps, tool errors, cost. Set pass/fail thresholds before looking at results.
4. **Run the baseline.** Record model, prompt, retrieval index, dataset hash, and environment.
5. **Run the candidate.** Same dataset and config. Compare to baseline; report deltas, not just absolute numbers.
6. **Inspect failures.** Sample failing cases; classify as data, retrieval, prompt, model, or tooling. Do not tune on the test set without a held-out set.
7. **Gate the change.** CI fails when a metric crosses its threshold or a safety check regresses.
8. **Record evidence.** Eval report with dataset hash, config, numbers, and reviewer.

## RAG specifics

- Separate retrieval quality from answer quality.
- Require citations that resolve to the retrieved source.
- Test unanswerable questions: the system must say "unknown", not hallucinate.
- Version the index/embedding/reranker configuration with the eval.

## Agent specifics

- Evaluate the trajectory, not only the final answer: tool choices, arguments, retries, stop reason.
- Test permission boundaries and irreversible actions; require human approval where specified.
- Budget steps, time, and cost; a correct answer that costs 10× is a regression.

## Anti-rationalization

| Excuse | Reality |
|---|---|
| "It looks better" | Looking better on a few examples is anecdote. Run the versioned eval. |
| "The judge agrees with me" | An uncalibrated judge is a random number generator with confidence. Calibrate or use deterministic checks. |
| "We'll add evals after launch" | Then you cannot detect regressions. Evals are part of the feature, not a postscript. |
| "The dataset is too small" | Small and versioned beats large and unknown. Grow it from real failures. |
| "We tuned the prompt on the test set" | That is training on the test set. Keep a held-out set and report both. |
| "Safety evals slow us down" | A prompt-injection regression in production is slower. |

## Evidence

- dataset ID/hash and case count;
- baseline and candidate config;
- metric table with thresholds and deltas;
- failing-case sample and classification;
- red-team results;
- CI gate result.
