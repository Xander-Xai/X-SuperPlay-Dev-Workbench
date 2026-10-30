# Offline Skill Kit · operational contract

The installer is a local Node CLI. The public website never runs it. This release adds a managed lockfile and hash-verified selective uninstall.

## Preview then apply

~~~bash
node tools/skill-kit.mjs --source ../X-SuperPlay-AI-Engineering-OS --target ../your-project --agent codex --skills verification
node tools/skill-kit.mjs --source ../X-SuperPlay-AI-Engineering-OS --target ../your-project --agent codex --skills verification --apply --confirm-reviewed
~~~

## Uninstall

~~~bash
node tools/skill-kit.mjs --target ../your-project --agent codex --skills verification --uninstall
node tools/skill-kit.mjs --target ../your-project --agent codex --skills verification --uninstall --apply --confirm-reviewed
~~~

The explicit confirmation flag means the operator personally checked source licenses, source contents, target repository visibility, and affected paths. This CLI does not itself verify license terms or private/public status.

## Receipt, integrity and limits

- Target-local receipt: .x-superplay/skill-kit.lock.json with source SHA, managed relative file paths and sha256 hashes. No API tokens or absolute source paths are saved.
- Source is read only from the pinned 40-char commit specified in src/catalog.mjs. In-process synthetic fixture tests may inject a fixture SHA; the public CLI exposes no option to override its pin.
- Regular SKILL.md only. Reject symlink modes, unexpected additional bundled files, preexisting destinations, and target symlinks. Cross-repository relative links receive warnings; operator must inspect them.
- Uninstall removes only previously managed paths with matching hashes. Modified user files are preserved, with an explicit refusal.
- On a failed installation, newly copied files are rolled back to the extent possible; no claim is made of transaction safety under hostile concurrent filesystem modifications.
- Copying a candidate Skill is not execution, a successful runtime discovery, or production validation.
- Real Windows 11 and WSL2 integration, target repo public visibility checks, bundle dependencies, supply-chain/license scanning and real Agent discovery remain NOT_VERIFIED.

## Cross-directory reference audit

A 2026-10-31 read-only scan of the eight pinned candidate SKILL.md files found **7/8** linking to documentation outside their own Skill folder. A copied SKILL.md is not a self-contained portable bundle. The default dry-run reports relative-link warnings; installation (`--apply`) now rejects such Skills unless the operator has checked the source docs and explicitly adds `--acknowledge-relative-links`. That flag only acknowledges risk; it does **not** copy missing files or repair links. `project-discovery` was the only candidate without links of this form in the pinned snapshot. A source-authorized, dependency-aware bundle is a separate future feature; never publish private reference contents accidentally.
