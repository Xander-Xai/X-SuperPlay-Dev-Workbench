---
name: security-review
description: Use when a change touches authentication, authorization, user input, secrets, dependencies, external integrations, file uploads, AI prompts, or production data. Covers trust boundaries, negative tests, and block-security decisions.
license: UNLICENSED-PROPRIETARY
metadata:
  version: "0.4.0"
  status: CANDIDATE
  owner: Xander-Xai/X-SuperPlay-Dev-Workbench
  provenance: Xander-Xai/X-SuperPlay-AI-Engineering-OS@8553124f238ab463d4a50debad34e871ef8de060
  self_contained: true
  lifecycle_stage: architecture
  supported_agents: claude-code,codex,opencode
  prerequisites: architecture
  dependencies: architecture
  install_method: node tools/skill-kit.mjs install --target <project> --agent <agent> --skills security-review
  tests: static frontmatter, catalog mapping, install dry-run, agent discovery, real-project effect
  upstream_equivalents: security-and-hardening,code-review-and-quality,trailofbits-skills
---

# Security Review

## Core principle

Security review is a **trust-boundary check with negative tests**, not a checklist read aloud. If a boundary has no negative test, it has no evidence.

## When to use

Use at architecture, before release, and during review when the change touches:

- authentication, sessions, tokens, passwords, recovery;
- authorization, roles, tenancy, admin actions;
- user input, file upload, URL fetch, template rendering, shell/SQL;
- secrets, environment variables, CI credentials;
- dependencies, lockfiles, build scripts, container images;
- LLM prompts, tool calls, retrieved documents, agent actions;
- logs, analytics, exports, backups, production data.

## Procedure

1. **Draw the trust boundaries.** List every place data crosses from untrusted to trusted: browser→API, API→DB, service→service, document→prompt, model→tool, tool→external system.
2. **Map assets and actors.** What can be read, changed, deleted, or spent? Who is allowed to do it? What is the tenant/role boundary?
3. **Check authentication and session lifecycle.** Login, logout, expiry, rotation, revocation, cookie flags, CSRF, redirect allowlists.
4. **Check authorization server-side.** Every protected operation must re-check permission at the data layer. Frontend hiding is not authorization.
5. **Check input and output boundaries.** Validation, canonicalization, parameterization, output encoding, CSP, SSRF allowlists, upload type/size limits.
6. **Check secrets and supply chain.** Secret scan, `.env` not committed, least-privilege tokens, dependency audit, lockfile integrity, SBOM where required.
7. **Check AI-specific risks.** Prompt injection, retrieved-content injection, tool permission scope, data exfiltration, model output treated as untrusted, human approval for irreversible actions.
8. **Write negative tests.** Unauthenticated, wrong role, expired session, tenant A→B, malformed input, oversized upload, replayed webhook, injected prompt. Each test must fail closed.
9. **Decide severity.** `block-security` for exploitable auth bypass, secret exposure, cross-tenant access, injection, or unapproved irreversible action. `block` for missing evidence. `advisory` only for hardening with a tracked follow-up.

## Evidence

- Threat model or boundary list with owners.
- Negative test command + result.
- Secret/dependency scan command + result.
- Any accepted risk with owner, scope, expiry, and compensating control.

## Anti-rationalization

| Excuse | Reality |
|---|---|
| "The frontend already hides it" | Attackers call the API directly. Authorization belongs on the server and at the data layer. |
| "It's internal-only" | Internal networks have phishing, SSRF, and compromised credentials. Boundary still exists. |
| "The model won't do that" | Models are untrusted input processors. Constrain tools and require approval for irreversible actions. |
| "We'll add tests later" | A boundary without a negative test is unverified. This is a release blocker for Tier A/B. |
| "The dependency is popular" | Popular packages get compromised too. Check version, lockfile, and advisories. |
| "It's just a log" | Logs leak tokens, PII, and prompts. Redact at the source. |

## Red flags

- Authorization checked only in UI or middleware, not at the data access point.
- Secrets in source, logs, prompts, screenshots, or error messages.
- Tenant ID taken from the request body without server-side ownership check.
- Webhook accepted without signature and replay protection.
- Model/tool output used to build a shell, SQL, URL, or file path.
- Security finding downgraded to "advisory" without an owner and expiry.
