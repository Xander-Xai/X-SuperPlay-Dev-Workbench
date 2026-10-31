# Security Policy

## Reporting a vulnerability

Do not report exploitable vulnerabilities, credentials, private project data or customer information in public Issues or Pull Requests.

Use GitHub's **Report a vulnerability** flow (private vulnerability reporting) for this repository when it is enabled. If that option is unavailable, contact the repository maintainer privately through GitHub.

Include:

- the affected commit or version;
- the affected file or command;
- impact and a minimal reproduction;
- redacted examples only. Never include a live credential.

If a real credential has already been exposed, rotate it first. Rotation matters more than removing the text.

## Scope

This repository contains engineering methodology, generated templates, a static site and the zero-dependency `xeng` CLI. Relevant reports include:

- secret or private data emitted by `xeng audit`, `xeng init`, generated artifacts or CI logs;
- a path that lets `xeng init` write outside its target directory, including symlink and junction escapes;
- a generated project artifact that introduces an insecure default;
- a supply-chain or dependency issue in the build or deployment path.

The methodology text itself is advisory. A project-local rule that is stricter than the Workbench guidance always wins.

## Secret-scanning behavior

`xeng audit` reports only the relative path, line number, rule ID, hit count and risk status. It never prints the matched text or a fragment of it. The `security.secret_scan` finding is fail-closed: a project exception cannot downgrade it to `NOT_APPLICABLE`. Any exception that targets this rule is itself reported as a failure and must be removed.

## Supported versions

Security fixes target the current `main` branch. Historical commits are provenance, not supported releases.

## No bug bounty

This repository does not operate a paid vulnerability program.
