#!/usr/bin/env node
// Workbench engineering CLI. Node-only, zero dependencies, no network.
import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync, readdirSync, lstatSync } from "node:fs";
import { resolve, join, dirname, relative, sep, basename, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  TYPES, PROFILES, PROFILE_IDS, STAGES, STAGE_IDS, TASKS, TASK_IDS, TIERS, SKILLS, SKILL_IDS,
  PROVENANCE, OWNER, GOVERNANCE, RUNTIME
} from "../src/catalog.mjs";
import { composeRoute, tierObligations } from "../src/routing.mjs";
import { validateCatalog } from "../src/engine.mjs";
import { resolveSkillDependencies } from "../src/install-contract.mjs";
import { PLAYBOOKS, playbookById, playbookMarkdown } from "../src/playbooks.mjs";
import { maturityReport, MATURITY_LEVELS } from "../src/maturity.mjs";
import { GIT_WORKFLOW } from "../src/git-workflow.mjs";
import {
  MACRO_STAGES, ACTIVITIES, PLATFORM_BRANCHES, AI_OVERLAY, DELIVERY_STATES,
  LOOP_PHASES, LOOP_TERMINAL_STATES, LOOP_DEFAULTS, TICKET_CONTRACT_FIELDS,
  TICKET_CONTRACT_STATUS, ACCEPTANCE_TEST_POLICY, EXTERNAL_SKILLS, SKILL_VERIFICATION_LAYERS,
  SKILL_RELATION_POLICY, LEARNING_PATH, deliveryMatrix, activityById, learningPathTickets
} from "../src/delivery.mjs";
import { run as runSkillKit } from "./skill-kit.mjs";
import {
  PROVIDERS, AGENT_RUNTIMES, PROVIDER_IDS, AGENT_RUNTIME_IDS,
  listProviders, getProvider, planHandoff, normalizeExternalReceipt, verifyReceiptAgainstPlan
} from "../src/orchestration.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LEVEL_ORDER = { not_applicable: 0, optional: 1, recommended: 2, required: 3 };
const STATUS_ORDER = { PASS: 0, NOT_APPLICABLE: 1, WARN: 2, UNKNOWN: 3, FAIL: 4 };
const IGNORED_DIRS = new Set([".git", "node_modules", "__pycache__", ".venv", "venv", "dist", "build", ".pytest_cache", "_worktrees"]);
const IGNORED_PATHS = new Set([".claude/worktrees", ".agents/worktrees", ".opencode/worktrees"]);
const SCAN_EXTS = new Set([".py", ".js", ".mjs", ".ts", ".tsx", ".jsx", ".go", ".yaml", ".yml", ".json", ".md", ".toml", ".sh", ".ps1", ".env", ".txt", ".pem", ".key", ".p12", ".pfx"]);
const SCAN_NAMES = new Set([".env.example", ".npmrc", ".pypirc", ".netrc", ".git-credentials", "Dockerfile", "Makefile", "id_rsa", "id_dsa", "id_ecdsa", "id_ed25519"]);

const readText = p => { try { return readFileSync(p, "utf8"); } catch { return null; } };
const isDir = p => { try { return statSync(p).isDirectory(); } catch { return false; } };
const isFile = p => { try { return statSync(p).isFile(); } catch { return false; } };
const sha256 = b => createHash("sha256").update(b).digest("hex");

// ---------------------------------------------------------------- simple YAML

function parseScalar(raw) {
  const s = raw.trim();
  if (s === "") return null;
  if (s === "[]") return [];
  if (s.startsWith("[") && s.endsWith("]"))
    return s.slice(1, -1).split(",").map(x => parseScalar(x)).filter(x => x !== null);
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'")))
    return s.slice(1, -1);
  if (/^(true|false)$/i.test(s)) return s.toLowerCase() === "true";
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  return s;
}

export function parseSimpleYaml(text) {
  const root = {};
  const stack = [{ indent: -1, node: root }];
  const lines = String(text ?? "").replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  const nextMeaningful = from => {
    for (let j = from; j < lines.length; j++) {
      if (lines[j].trim() && !lines[j].trim().startsWith("#")) return j;
    }
    return -1;
  };
  while (i < lines.length) {
    const raw = lines[i];
    if (!raw.trim() || raw.trim().startsWith("#")) { i++; continue; }
    const indent = raw.match(/^ */)[0].length;
    const line = raw.trim();
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();
    const parent = stack[stack.length - 1].node;

    if (line.startsWith("- ")) {
      const content = line.slice(2).trim();
      const target = Array.isArray(parent) ? parent : null;
      if (!target) { i++; continue; }
      if (content.includes(":") && !content.startsWith('"') && !content.startsWith("'")) {
        const idx = content.indexOf(":");
        const obj = { [content.slice(0, idx).trim()]: parseScalar(content.slice(idx + 1)) };
        target.push(obj);
        stack.push({ indent, node: obj });
      } else {
        target.push(parseScalar(content));
      }
      i++;
      continue;
    }

    const m = line.match(/^([^:]+):\s*(.*)$/);
    if (!m) { i++; continue; }
    const key = m[1].trim();
    const value = m[2];
    if (value === "" || value === "|" || value === ">") {
      const n = nextMeaningful(i + 1);
      const childIndent = n === -1 ? -1 : lines[n].match(/^ */)[0].length;
      const isList = n !== -1 && childIndent > indent && lines[n].trim().startsWith("- ");
      const child = isList ? [] : {};
      parent[key] = child;
      stack.push({ indent, node: child });
      i++;
      continue;
    }
    parent[key] = parseScalar(value);
    i++;
  }
  return root;
}

function renderYaml(obj, indent = 0) {
  const pad = "  ".repeat(indent);
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    if (Array.isArray(v)) {
      out.push(pad + k + ": " + (v.length ? "[" + v.join(", ") + "]" : "[]"));
    } else if (v && typeof v === "object") {
      out.push(pad + k + ":");
      out.push(renderYaml(v, indent + 1));
    } else {
      out.push(pad + k + ": " + (v ?? ""));
    }
  }
  return out.join("\n");
}

// ---------------------------------------------------------------- init

const INIT_FILES = {
  "README.md": `# <project-name>

> TODO: What this project IS, what it is NOT, and the one success signal.

Governed by [X-SuperPlay Dev Workbench](https://github.com/Xander-Xai/X-SuperPlay-Dev-Workbench) (defaults; this repository's local knowledge wins).
`,
  "AGENTS.md": `# AGENTS.md

Rules for AI agents working in this repository.

## Boundary
<What this repo is / is not.>

## Source of truth
- CURRENT TRUTH: docs/current-state.md (last_verified discipline)
- Historical reports are append-only, never current fact.

## Verification before DONE
- <command that proves it> (fill in; agents rely on this)

## Permissions
- Agents do not push/deploy/delete without explicit instruction.
`,
  "CLAUDE.md": `# CLAUDE.md

Context for Claude Code sessions.

## What this repo is
<One paragraph.>

## Navigation
- <key files, key docs>

## Common commands
~~~bash
# <install / run / test commands>
~~~
`,
  ".github/pull_request_template.md": `## Why
<One paragraph; link the spec/task.>

## Scope
<What changed; what deliberately did not.>

## Base SHA
- Base: \`<exact base sha>\`
- Head: \`<commit sha>\`

## Verification
| Check | Command | Result | Skipped / not run why |
|---|---|---|---|
| tests | \`<command>\` | NOT_RUN | |
| integration / contract | \`<command>\` | NOT_RUN | |
| eval (AI change) | \`<command>\` | NOT_RUN | |
| manual / device probe | \`<step>\` | NOT_RUN | |

Evidence links: <artifacts / receipts>

## Unverified / Unknown
- [ ] <what could not be executed and why; do not leave blank>

## Risks
<What could break; blast radius.>

## Rollback
<How to undo: revert commit / migration downgrade / config flip.>

## Agent provenance (if agent-authored)
<Which model/session produced this, which instructions/docs it followed.>
`,
  "docs/current-state.md": `# Current State

<!-- CURRENT TRUTH — update in place; touch last_verified when you re-verify. -->

last_verified: YYYY-MM-DD
version: <version>

## What is true now
<Compact facts with command provenance: how to regenerate each number.>
`,
  ".gitignore": `.env
.env.*
!.env.example
*.pem
*.key
*.p12
*.pfx
__pycache__/
*.pyc
node_modules/
dist/
.DS_Store
`
};

const PROFILE_DIRS = {
  saas: ["migrations", "tests"], backend: ["tests"], web: ["tests"],
  "ai-application": ["evals"], rag: ["evals"], agent: ["evals"],
  cli: ["tests"], enterprise: ["tests"], mobile: ["tests"],
  android: ["tests"], ios: ["tests"], "react-native": ["tests"], flutter: ["tests"],
  desktop: ["tests"], infrastructure: []
};

function gitWorkflowGuide() {
  const section = (title, values) => "## " + title + "\n\n" + values.map(v => "- " + v).join("\n") + "\n";
  const b = GIT_WORKFLOW.governanceBoundary;
  const boundary = [
    "## 治理边界（G-02）",
    "",
    "- 组织级所有者：" + b.owner,
    "- 组织级范围：" + b.organizationScope,
    "- 项目级范围：" + b.projectScope,
    "- 优先级：" + b.precedence.join(" > "),
    "- 冲突规则：" + b.conflictRule,
    "- 不复制：" + b.nonCopy,
    ""
  ].join("\n");
  const roleSplit = [
    "## Agent 默认分工",
    "",
    "> 默认建议，不是平台限制；项目本地规则与任务实际需要优先。",
    "",
    "| 任务 | 默认 Agent | 说明 |",
    "|---|---|---|",
    ...GIT_WORKFLOW.agentRoleSplit.map(r => "| " + r.task + " | " + r.defaultAgent + " | " + r.note + " |"),
    "",
    "分工不明确时：" + GIT_WORKFLOW.agentSplitRule.replace(/^分工不明确时：/, ""),
    ""
  ].join("\n");
  return [
    "# Project Git Workflow (advisory)",
    "",
    "> Generated by Workbench. This repository's own CONTRIBUTING / AGENTS / branch protection wins.",
    "> This file does not authorise push, deployment or history rewriting.",
    "",
    boundary,
    roleSplit,
    section("Base SHA", GIT_WORKFLOW.baseSha),
    section("Branches", GIT_WORKFLOW.branches),
    section("Worktrees", GIT_WORKFLOW.worktrees),
    section("Commits", GIT_WORKFLOW.commits),
    section("Pull requests", GIT_WORKFLOW.pullRequest),
    section("Review", GIT_WORKFLOW.review),
    section("Prohibited without explicit instruction", GIT_WORKFLOW.prohibitions),
    section("After merge", GIT_WORKFLOW.merge)
  ].join("\n");
}

export function composeProfileContract({ profiles, tier, name, task = "feature", mode = "new" }) {
  const levels = tierObligations(tier);
  const merged = {
    ownership: {
      current_owner: OWNER.repository,
      historical_provenance: PROVENANCE.repository + "@" + PROVENANCE.commit,
      governance_reference: "AI-Native-Work-Learning-OS (reference only)",
      runtime: RUNTIME.name + " " + RUNTIME.version
    },
    project: { name, tier, task, mode, profiles },
    lifecycle: {
      spec_required: levels.spec,
      plan_required: levels.plan,
      adr_required: levels.adr,
      review_required: levels.review
    },
    quality: {
      unit_tests: "required",
      integration_tests: profiles.includes("saas") || profiles.includes("enterprise") ? "required" : "recommended",
      e2e: levels.e2e,
      evals: profiles.some(p => ["ai-application", "rag", "agent"].includes(p)) ? "required" : "not_applicable"
    },
    security: {
      secret_scan: "required",
      review: levels.review,
      dependency_audit: profiles.some(p => ["web", "backend", "mobile"].includes(p)) ? "required" : "recommended"
    },
    operations: {
      observability: "recommended",
      rollback_plan: levels.rollback,
      backup: profiles.some(p => ["saas", "enterprise", "infrastructure"].includes(p)) ? "required" : "optional"
    },
    exceptions: []
  };
  return merged;
}

function lstatMaybe(p) {
  try { return lstatSync(p); } catch (e) { if (e.code === "ENOENT") return null; throw e; }
}

function assertSafeInitTarget(target) {
  const st = lstatMaybe(target);
  if (st?.isSymbolicLink()) throw new Error("refusing symlink init target: " + target);
  if (st && !st.isDirectory()) throw new Error("init target is not a directory: " + target);
}

// Generated paths are fixed, but a target repository can contain symlinks that
// redirect a write outside it. Reject absolute/.. segments and any symlink in
// the path before creating or overwriting anything.
function safeInitPath(root, rel) {
  const clean = String(rel).replace(/\\/g, "/");
  const segments = clean.split("/").filter(Boolean);
  if (isAbsolute(clean) || segments.some(s => s === "." || s === "..")) throw new Error("unsafe generated path: " + rel);
  const rootAbs = resolve(root);
  let current = rootAbs;
  for (let i = 0; i < segments.length; i++) {
    current = join(current, segments[i]);
    const st = lstatMaybe(current);
    if (st?.isSymbolicLink()) throw new Error("refusing to write through symlink: " + clean);
    if (i < segments.length - 1 && st && !st.isDirectory()) throw new Error("path component is not a directory: " + clean);
  }
  const finalAbs = resolve(current);
  if (finalAbs !== rootAbs && !finalAbs.startsWith(rootAbs + sep)) throw new Error("generated path escapes target: " + clean);
  return current;
}

function cmdInit(argv) {
  const opts = { profile: null, tier: "B", task: "feature", mode: "new", name: null, dryRun: false, path: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") { opts.dryRun = true; continue; }
    if (["--profile", "--tier", "--task", "--mode", "--name"].includes(a)) {
      if (!argv[i + 1] || argv[i + 1].startsWith("--")) throw new Error("Missing value for " + a);
      const key = a.slice(2);
      opts[key === "dry-run" ? "dryRun" : key] = argv[++i];
      continue;
    }
    if (a.startsWith("--")) throw new Error("Unknown option: " + a);
    if (opts.path) throw new Error("Only one target path is allowed");
    opts.path = a;
  }
  if (!opts.path) throw new Error("Usage: xeng init <path> --profile a,b --tier A|B|C|D [--task feature] [--mode new|existing] [--dry-run]");
  if (!opts.profile) throw new Error("Missing --profile");
  if (!Object.hasOwn(TIERS, opts.tier)) throw new Error("Tier must be A|B|C|D");
  if (!TASK_IDS.includes(opts.task)) throw new Error("Unknown task: " + opts.task);
  if (!["new", "existing"].includes(opts.mode)) throw new Error("Mode must be new|existing");

  const target = resolve(opts.path);
  assertSafeInitTarget(target);
  const profiles = opts.profile.split(",").map(x => x.trim()).filter(Boolean);
  const unknown = profiles.filter(p => !PROFILE_IDS.includes(p));
  if (unknown.length) {
    console.error("FAIL: unknown profile(s): " + unknown.join(", "));
    console.error("available: " + PROFILE_IDS.join(", "));
    return 2;
  }
  const name = opts.name || basename(target);
  const contract = composeProfileContract({ profiles, tier: opts.tier, name, task: opts.task, mode: opts.mode });
  const created = [], skipped = [], suggested = [];
  const log = msg => { if (!opts.dryRun) console.log(msg); };

  if (!existsSync(target) && !opts.dryRun) mkdirSync(target, { recursive: true });

  const planFile = (rel, content) => {
    const dest = safeInitPath(target, rel);
    const rendered = content.replace(/YYYY-MM-DD/g, new Date().toISOString().slice(0, 10));
    if (existsSync(dest)) {
      skipped.push(rel);
      const suggRel = rel + ".suggested.md";
      const sugg = safeInitPath(target, suggRel);
      if (!opts.dryRun && !existsSync(sugg)) { writeFileSync(sugg, rendered); suggested.push(basename(sugg)); }
      return;
    }
    if (opts.dryRun) { console.log("[dry-run] would create " + rel); }
    else { mkdirSync(dirname(dest), { recursive: true }); writeFileSync(dest, rendered); }
    created.push(rel);
  };

  const ep = safeInitPath(target, "ENGINEERING_PROFILE.yaml");
  if (existsSync(ep)) skipped.push("ENGINEERING_PROFILE.yaml");
  else {
    const body = "# ENGINEERING_PROFILE.yaml — generated by Workbench; owned and editable by this project.\n" +
      "# Levels: required | recommended | optional | not_applicable\n\n" + renderYaml(contract) + "\n";
    if (opts.dryRun) console.log("[dry-run] would create ENGINEERING_PROFILE.yaml");
    else writeFileSync(ep, body);
    created.push("ENGINEERING_PROFILE.yaml");
  }

  for (const [rel, content] of Object.entries(INIT_FILES)) planFile(rel, content);
  planFile("docs/git-workflow.md", gitWorkflowGuide());

  const dirs = new Set();
  for (const p of profiles) for (const d of (PROFILE_DIRS[p] ?? [])) dirs.add(d);
  if (["A", "B"].includes(opts.tier)) dirs.add("tests");
  for (const d of [...dirs].sort()) {
    const dd = safeInitPath(target, d);
    if (existsSync(dd)) continue;
    if (opts.dryRun) console.log("[dry-run] would create directory " + d + "/");
    else {
      mkdirSync(dd, { recursive: true });
      const readme = safeInitPath(target, d + "/README.md");
      if (!existsSync(readme)) writeFileSync(readme, "# " + d + "\n\n<describe conventions for this directory>\n");
    }
    created.push(d + "/");
  }

  const label = opts.dryRun ? "[dry-run] " : "";
  console.log(label + "init " + target + " profiles=" + profiles.join(",") + " tier=" + opts.tier + " task=" + opts.task);
  console.log("  created:   " + created.length + " entries");
  console.log("  skipped (exist, untouched): " + skipped.length);
  if (suggested.length) console.log("  suggested: " + suggested.length + " *.suggested.md files written next to existing files");
  if (opts.dryRun) console.log("dry-run complete — no files were modified");
  return 0;
}

// ---------------------------------------------------------------- audit

function iterRepoFiles(root) {
  const out = [];
  const relOf = p => relative(root, p).split(sep).join("/");
  const walk = dir => {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const fp = join(dir, e.name);
      if (e.isDirectory()) {
        if (IGNORED_DIRS.has(e.name) || IGNORED_PATHS.has(relOf(fp))) continue;
        walk(fp);
      }
      else if (SCAN_EXTS.has(extnameLower(e.name)) || SCAN_NAMES.has(e.name)) out.push(fp);
    }
  };
  walk(root);
  return out;
}
const extnameLower = n => { const i = n.lastIndexOf("."); return i < 0 ? "" : n.slice(i).toLowerCase(); };

// Each rule reports only its ID, the relative path, the line and a count.
// Matched text is never stored or printed.
const SECRET_RULES = [
  { id: "secret.generic-assignment", rx: /['"]?(?:api[_-]?key|secret|token|passwd|password|pwd)['"]?\s*[:=]\s*['"]?[A-Za-z0-9_\-/+=]{16,}/gi },
  { id: "secret.private-key", rx: /-----BEGIN (?:[A-Z0-9 ]+ )?PRIVATE KEY-----/g },
  { id: "secret.github-token", rx: /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g },
  { id: "secret.openai-token", rx: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g },
  { id: "secret.slack-token", rx: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
  { id: "secret.aws-access-key", rx: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g },
  { id: "secret.gcp-api-key", rx: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  { id: "secret.jwt", rx: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g },
  { id: "secret.url-credential", rx: /\b[a-z][a-z0-9+.-]*:\/\/[^/\s:@]+:[^/\s@]+@/gi }
];

function loadEngineeringProfile(root) {
  const file = join(root, "ENGINEERING_PROFILE.yaml");
  if (!isFile(file)) return null;
  try { return parseSimpleYaml(readText(file) ?? ""); } catch { return null; }
}

function contractField(ep, section, key) {
  const sec = ep?.[section];
  return sec && typeof sec === "object" ? (sec[key] ?? null) : null;
}

function checkExceptions(report, ep, rule, findingPath = null) {
  if (rule === "security.secret_scan") return null;
  const exceptions = Array.isArray(ep?.exceptions) ? ep.exceptions : [];
  for (const ex of exceptions) {
    if (!ex || typeof ex !== "object") continue;
    if (String(ex.rule ?? "") !== rule) continue;
    const scope = String(ex.scope ?? "/");
    if (findingPath && scope !== "/" && scope !== findingPath && !findingPath.startsWith(scope.replace(/\/$/, "") + "/")) continue;
    const until = ex.until ? String(ex.until) : null;
    const expired = until && /^\d{4}-\d{2}-\d{2}$/.test(until) && new Date(until) < new Date(new Date().toISOString().slice(0, 10));
    if (expired) { report.add("exception." + ex.id, "FAIL", "exception expired " + until, rule); continue; }
    report.add("exception." + ex.id, "PASS", "exception active for " + rule + " in scope " + scope + " (until " + (until ?? "no expiry") + ")", rule);
    return ex.id;
  }
  return null;
}

class AuditReport {
  constructor(repo) { this.repo = repo; this.checks = []; }
  add(name, status, detail = "", rule = "") { this.checks.push({ name, status, detail, rule }); }
  worst() {
    let worst = "PASS";
    for (const c of this.checks) if ((STATUS_ORDER[c.status] ?? 0) > (STATUS_ORDER[worst] ?? 0)) worst = c.status;
    return worst;
  }
  toJSON() { return { repo: this.repo, checks: this.checks, worst: this.worst() }; }
}

function buildAudit(root) {
  if (!isDir(root)) throw new Error("not a directory: " + root);
  const ep = loadEngineeringProfile(root);
  const tier = String(ep?.project?.tier ?? "B");
  let profiles = ep?.project?.profiles ?? [];
  if (typeof profiles === "string") profiles = profiles.replace(/^\[|\]$/g, "").split(",").map(x => x.trim()).filter(Boolean);
  if (!Array.isArray(profiles)) profiles = [];
  const report = new AuditReport(root);
  const add = (n, s, d = "", r = "") => report.add(n, s, d, r);

  add("readme", isFile(join(root, "README.md")) ? "PASS" : "WARN", isFile(join(root, "README.md")) ? "" : "README.md missing");
  for (const [file, rule] of [["AGENTS.md", "governance.agents"], ["CLAUDE.md", "governance.claude"]])
    add(file.toLowerCase(), isFile(join(root, file)) ? "PASS" : "WARN", isFile(join(root, file)) ? "" : file + " missing", rule);
  add("engineering_profile", ep ? "PASS" : "WARN", ep ? "" : "ENGINEERING_PROFILE.yaml missing — tier/profiles unknown", "governance.profile");
  add("git.repo", isDir(join(root, ".git")) ? "PASS" : "WARN", isDir(join(root, ".git")) ? "git repository present" : "no .git");

  const envExample = join(root, ".env.example");
  let envFiles = [];
  try { envFiles = readdirSync(root).filter(n => n.startsWith(".env") && n !== ".env.example"); } catch {}
  if (isFile(envExample)) add("config.env_example", "PASS");
  else if (envFiles.length) add("config.env_example", "FAIL", ".env files exist but no .env.example", "configuration.env_example");
  else add("config.env_example", "NOT_APPLICABLE", "no env config detected");

  const gi = join(root, ".gitignore");
  if (isFile(gi)) {
    const text = readText(gi) ?? "";
    add("git.gitignore", text.includes(".env") ? "PASS" : "WARN", text.includes(".env") ? "" : ".gitignore does not ignore .env");
  } else add("git.gitignore", "WARN", "no .gitignore");

  const testDirs = ["tests", "test", "spec"].filter(d => isDir(join(root, d)));
  const testFiles = iterRepoFiles(root).filter(p => /(^|[/\\])test_|_test\.|\.test\.|\.spec\./.test(basename(p)));
  if (testDirs.length || testFiles.length) add("tests.present", "PASS", testFiles.length + " test files found");
  else {
    const q = contractField(ep, "quality", "unit_tests");
    if (q === "not_applicable" || ["C", "D"].includes(tier)) add("tests.present", "NOT_APPLICABLE", "tier C/D or unit_tests not_applicable");
    else add("tests.present", "WARN", "no tests detected", "quality.unit_tests");
  }

  const aiProfiles = ["ai-application", "rag", "agent"].filter(p => profiles.includes(p));
  if (aiProfiles.length) {
    const present = ["evals", "evaluation", "tests/eval", "tests/evals", "benchmark", "benchmarks"].some(d => isDir(join(root, d)));
    add("evals.present", present ? "PASS" : "WARN", present ? "" : "profiles " + aiProfiles.join(",") + " declared but no evals directory", "quality.evals");
  } else add("evals.present", "NOT_APPLICABLE", "no AI profiles declared");

  const ciDir = join(root, ".github", "workflows");
  let ciFiles = [];
  try { ciFiles = readdirSync(ciDir).filter(n => /\.ya?ml$/.test(n)); } catch {}
  if (ciFiles.length) add("ci.present", "PASS", ciFiles.length + " workflow(s)");
  else if (["A", "B"].includes(tier)) add("ci.present", "WARN", "no CI workflows — verification not repeatable", "quality.ci");
  else add("ci.present", "NOT_APPLICABLE", "no CI (tier C/D)");

  const ctCandidates = ["STATE.md", "docs/current-state.md", "docs/reference/current-state.md", "CURRENT_STATE.md"].map(f => join(root, f));
  const ct = ctCandidates.find(isFile);
  if (ct) {
    const text = readText(ct) ?? "";
    const m = text.match(/last_verified[:=]\s*(\d{4}-\d{2}-\d{2})/);
    if (!m) add("docs.freshness", "WARN", "current-truth file lacks last_verified", "docs.freshness");
    else {
      const age = Math.floor((Date.now() - Date.parse(m[1] + "T00:00:00Z")) / 86400000);
      if (age > 30 && ["A", "B"].includes(tier)) add("docs.freshness", "WARN", "current truth " + age + "d stale", "docs.freshness");
      else add("docs.freshness", "PASS", "last_verified " + m[1] + " (" + age + "d)");
    }
  } else add("docs.freshness", "NOT_APPLICABLE", "no current-truth file");

  const securityExceptions = (Array.isArray(ep?.exceptions) ? ep.exceptions : [])
    .filter(ex => ex && typeof ex === "object" && String(ex.rule ?? "") === "security.secret_scan");
  if (securityExceptions.length)
    add("security.secret_scan_exception", "FAIL", securityExceptions.length + " project exception(s) target security.secret_scan; secret findings cannot be waived", "security.secret_scan");

  const findings = [];
  let scanned = 0;
  for (const fp of iterRepoFiles(root)) {
    scanned++;
    const text = readText(fp);
    if (!text) continue;
    const rel = relative(root, fp).split(sep).join("/").replace(/[\u0000-\u001f\u007f]/g, "?");
    for (const rule of SECRET_RULES) {
      rule.rx.lastIndex = 0;
      let m;
      while ((m = rule.rx.exec(text))) {
        const line = text.slice(0, m.index).split(/\r\n|\r|\n/).length;
        findings.push({ rel, line, ruleId: rule.id });
        if (!rule.rx.global) break;
      }
    }
  }
  findings.sort((a, b) => a.rel.localeCompare(b.rel) || a.line - b.line || a.ruleId.localeCompare(b.ruleId));
  if (findings.length) {
    const byRule = {};
    for (const f of findings) byRule[f.ruleId] = (byRule[f.ruleId] ?? 0) + 1;
    const ruleCounts = Object.keys(byRule).sort().map(k => k + "=" + byRule[k]).join(", ");
    const fileCount = new Set(findings.map(f => f.rel)).size;
    const listed = findings.slice(0, 10).map(f => f.rel + ":" + f.line + " [" + f.ruleId + "]").join("; ");
    const more = findings.length > 10 ? " (+" + (findings.length - 10) + " more)" : "";
    add("security.secret_scan", "FAIL", findings.length + " finding(s) in " + fileCount + " file(s) [" + ruleCounts + "]: " + listed + more + "; match text withheld", "security.secret_scan");
  } else {
    add("security.secret_scan", "PASS", "scanned " + scanned + " files, no secret-shaped findings", "security.secret_scan");
  }

  const envKeys = new Set();
  if (isFile(envExample)) for (const line of (readText(envExample) ?? "").split(/\r?\n/)) {
    const m = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)=/); if (m) envKeys.add(m[1]);
  }
  const readVars = new Set();
  for (const fp of iterRepoFiles(root)) {
    if (![".py", ".go", ".ts", ".js", ".mjs", ".ps1", ".sh"].includes(extnameLower(fp))) continue;
    const text = readText(fp); if (!text) continue;
    const rx = /(?:os\.environ(?:\.get)?|os\.getenv|getenv)\(\s*['"]([A-Z][A-Z0-9_]{2,})['"]|process\.env\.([A-Z][A-Z0-9_]{2,})|\$env:([A-Z][A-Z0-9_]{2,})/g;
    let m; while ((m = rx.exec(text))) readVars.add(m[1] || m[2] || m[3]);
  }
  for (const v of [...readVars]) if (/^(PYTHON|SYSTEM|CI_|GITHUB_|PATH|HOME|USER|TMP|TEMP|APPDATA|LOCALAPPDATA|PROGRAM|COMPUTERNAME|OS|SHELL|TERM|LANG|PWD)/.test(v)) readVars.delete(v);
  if (isFile(envExample)) {
    const undocumented = [...readVars].filter(v => !envKeys.has(v)).sort();
    if (undocumented.length) add("config.env_pairing", "WARN", "read but absent from .env.example: " + undocumented.slice(0, 8).join(", "), "configuration.env_example");
    else add("config.env_pairing", "PASS", envKeys.size + " documented vars consistent with " + readVars.size + " read");
  } else if (readVars.size) add("config.env_pairing", "UNKNOWN", readVars.size + " env vars read but no .env.example to compare", "configuration.env_example");

  const changelog = join(root, "CHANGELOG.md");
  if (tier === "A") {
    if (!isFile(changelog)) add("release.changelog", "WARN", "Tier A without CHANGELOG.md", "release.changelog");
    else if (/\[\d+\.\d+\.\d+\]\s*[-—]\s*\d{4}-\d{2}-\d{2}/.test(readText(changelog) ?? "")) add("release.changelog", "PASS");
    else add("release.changelog", "WARN", "CHANGELOG exists but no [version] - date entries", "release.changelog");
  } else add("release.changelog", "NOT_APPLICABLE", "tier " + tier);

  const migDirs = ["migrations", "alembic", "db/migrations"].filter(d => isDir(join(root, d)));
  if (migDirs.length) add("db.migrations", "PASS", "migration handling: " + migDirs[0]);
  else add("db.migrations", "NOT_APPLICABLE", "no migrations directory found (verify DB usage manually)");

  const rollbackHits = [];
  for (const fp of iterRepoFiles(root)) {
    if (extnameLower(fp) !== ".md") continue;
    if (/rollback|回滚/i.test(readText(fp) ?? "")) { rollbackHits.push(relative(root, fp).split(sep).join("/")); if (rollbackHits.length >= 3) break; }
  }
  const needRollback = tier === "A" || profiles.includes("saas") || profiles.includes("infrastructure");
  if (!needRollback) add("ops.rollback", "NOT_APPLICABLE", "tier " + tier + ", profiles " + (profiles.join(",") || "none"));
  else if (rollbackHits.length) add("ops.rollback", "PASS", "rollback documented in: " + rollbackHits.join(", "));
  else add("ops.rollback", "WARN", "no doc mentioning rollback/回滚 found", "operations.rollback_plan");

  for (const check of [...report.checks]) {
    if (["WARN", "FAIL", "UNKNOWN"].includes(check.status) && check.rule && check.rule !== "security.secret_scan") {
      const ex = checkExceptions(report, ep, check.rule);
      if (ex) { check.status = "NOT_APPLICABLE"; check.detail += " — exception " + ex + " applied (repo-wide)"; }
    }
  }

  if (ep && Array.isArray(ep.exceptions)) {
    const knownRules = new Set(report.checks.map(c => c.rule).filter(Boolean));
    const seen = new Set(report.checks.filter(c => c.name.startsWith("exception.")).map(c => c.name.split(".")[1]));
    for (const ex of ep.exceptions) {
      if (!ex || typeof ex !== "object") continue;
      const id = String(ex.id ?? "?");
      if (seen.has(id)) continue;
      const until = ex.until ? String(ex.until) : null;
      if (until && /^\d{4}-\d{2}-\d{2}$/.test(until) && new Date(until) < new Date(new Date().toISOString().slice(0, 10)))
        add("exception." + id, "FAIL", "exception expired " + until, String(ex.rule ?? ""));
      else if (ex.rule && !knownRules.has(String(ex.rule)))
        add("exception." + id, "WARN", "exception references rule '" + ex.rule + "' not checked in this audit", String(ex.rule));
    }
  }

  report.context = { tier, profiles };
  return report;
}

function cmdAudit(argv) {
  const json = argv.includes("--json");
  const repoArg = argv.find(a => !a.startsWith("--")) ?? ".";
  const root = resolve(repoArg);
  if (!isDir(root)) { console.error("FAIL: not a directory: " + root); return 2; }
  const report = buildAudit(root);
  const worst = report.worst();
  if (json) console.log(JSON.stringify(report.toJSON(), null, 2));
  else {
    for (const c of report.checks) console.log(c.status.padEnd(14) + c.name + (c.detail ? " — " + c.detail : ""));
    console.log("\nAUDIT RESULT: " + worst + "  (" + report.checks.length + " checks)");
    if (worst === "UNKNOWN") console.log("NOTE: UNKNOWN is not PASS.");
  }
  return ["PASS", "NOT_APPLICABLE"].includes(worst) ? 0 : (worst === "FAIL" ? 2 : 1);
}

// ---------------------------------------------------------------- maturity

function cmdMaturity(argv) {
  const json = argv.includes("--json");
  const repoArg = argv.find(a => !a.startsWith("--")) ?? ".";
  const root = resolve(repoArg);
  if (!isDir(root)) { console.error("FAIL: not a directory: " + root); return 2; }
  const report = buildAudit(root);
  const out = maturityReport(report.checks, report.context ?? {});
  if (json) { console.log(JSON.stringify(out, null, 2)); return 0; }
  console.log("MATURITY " + out.level + " / target " + out.target + (out.target_met ? " (met)" : " (gap)"));
  for (const level of MATURITY_LEVELS) {
    const reached = MATURITY_LEVELS.findIndex(l => l.id === level.id) <= MATURITY_LEVELS.findIndex(l => l.id === out.level);
    console.log("  " + (reached ? "✓" : "·") + " " + level.id + " " + level.name + " — " + level.meaning);
  }
  console.log("\nControls:");
  for (const c of out.controls) console.log("  " + (c.met ? "PASS " : "GAP  ") + c.id + (c.met ? "" : " — missing: " + c.missing.join(", ")));
  console.log("\nL6: " + out.l6.status + " — " + out.l6.reason);
  console.log("NOTE: maturity is a gap indicator, not a quality score; not a project or production acceptance.");
  return out.target_met ? 0 : 1;
}

// ---------------------------------------------------------------- playbook

function cmdPlaybook(argv) {
  const json = argv.includes("--json");
  const id = argv.find(a => !a.startsWith("--"));
  if (!id) {
    if (json) { console.log(JSON.stringify(PLAYBOOKS.map(p => ({ id: p.id, name: p.name, profile: p.profile, status: p.status })), null, 2)); return 0; }
    console.log("Engineering playbooks (advisory, not verified):");
    for (const p of PLAYBOOKS) console.log("  " + p.id + " — " + p.name + " [" + p.status + "]");
    console.log("\nUse: xeng playbook <id> [--json]");
    return 0;
  }
  const playbook = playbookById(id);
  if (!playbook) { console.error("FAIL: unknown playbook: " + id + " (available: " + PLAYBOOKS.map(p => p.id).join(", ") + ")"); return 2; }
  console.log(json ? JSON.stringify(playbook, null, 2) : playbookMarkdown(playbook));
  return 0;
}

// ---------------------------------------------------------------- method (read-only local entrypoint)
//
// Two complementary surfaces share one command:
//   1. Fixed repository-owned method documents (overview/sources/pilot/design/skills).
//   2. The 8 macro stage / 18 activity compatibility view (activities/matrix/A01..A18).
// Never accept arbitrary paths or URLs.

// Only these fixed repository-owned documents are readable; never accept arbitrary paths or URLs.
const METHOD_DOCUMENTS = Object.freeze({
  overview: "docs/methods/AI-NATIVE-SPEC-HARNESS-SKILLS-LOOP.md",
  sources: "docs/methods/UPSTREAM-SOURCES.md",
  pilot: "docs/methods/PROJECT-PILOT.md",
  design: "docs/methods/AI-NATIVE-PRODUCT-AGENT-DESIGN.md",
  skills: "docs/methods/SKILL-ENGINEERING-FACTORY.md"
});

const METHOD_ACTIVITY_IDS = new Set(ACTIVITIES.map(a => a.id));
const METHOD_USAGE = "Usage: xeng method [overview|sources|pilot|design|skills|activities|matrix|A01..A18] [--json] [--template]";

function cmdMethod(argv) {
  const flags = new Set(["--json", "--template"]);
  const selectors = argv.filter(a => !a.startsWith("--"));
  const unknownFlags = argv.filter(a => a.startsWith("--") && !flags.has(a));
  const json = argv.includes("--json");
  const template = argv.includes("--template");
  if (unknownFlags.length || selectors.length > 1 || (template && selectors.length)) {
    console.error(METHOD_USAGE);
    return 2;
  }
  const id = selectors[0] ?? "overview";

  if (template) { console.log(methodTemplate()); return 0; }

  if (id === "activities") {
    if (json) { console.log(JSON.stringify({ macroStages: MACRO_STAGES, activities: ACTIVITIES }, null, 2)); return 0; }
    console.log("AI-Native Full-Stack Delivery · 8 macro stages / 18 activities");
    for (const m of MACRO_STAGES) console.log("  " + m.id + " " + m.name.padEnd(18) + m.canonicalStages.join(", "));
    console.log("\nActivities:");
    for (const a of ACTIVITIES) console.log("  " + a.id + " " + a.name.padEnd(22) + a.stages.join(", "));
    console.log("\nUse: xeng method A01..A18 [--json] | xeng method matrix | xeng method --template");
    return 0;
  }

  if (id === "matrix") {
    const rows = deliveryMatrix();
    if (json) { console.log(JSON.stringify(rows, null, 2)); return 0; }
    console.log("Stage coverage matrix (canonical 11 stages)");
    for (const [stage, info] of Object.entries(rows))
      console.log("  " + stage.padEnd(16) + (info.macro ?? "—").padEnd(4) + info.activities.join(", "));
    return 0;
  }

  if (METHOD_ACTIVITY_IDS.has(id)) {
    const activity = activityById(id);
    if (json) { console.log(JSON.stringify(activity, null, 2)); return 0; }
    console.log(activity.id + " · " + activity.name);
    console.log("stages: " + activity.stages.join(", "));
    console.log("primary skill: " + activity.primarySkill + " | alternate: " + (activity.alternateSkills.join(", ") || "—"));
    console.log("knowledge: " + activity.knowledge.join("；"));
    console.log("inputs: " + activity.inputs.join("；"));
    console.log("human decisions: " + activity.humanDecisions.join("；"));
    console.log("agent operations: " + activity.agentOperations.join("；"));
    console.log("tools: " + activity.tools.join("；"));
    console.log("outputs: " + activity.outputs.join("；"));
    console.log("happy path: " + activity.happyPath);
    console.log("negative: " + activity.negative);
    console.log("stop conditions: " + activity.stopConditions.join("；"));
    console.log("deterministic controls: " + activity.deterministicControls.join("；"));
    console.log("greenfield: " + activity.greenfield);
    console.log("brownfield: " + activity.brownfield);
    console.log("skill note: " + activity.skillNote);
    return 0;
  }

  if (!Object.hasOwn(METHOD_DOCUMENTS, id)) {
    console.error("FAIL: unknown method selector: " + id + "\n" + METHOD_USAGE);
    return 2;
  }
  const doc = METHOD_DOCUMENTS[id];
  const content = readText(join(ROOT, doc));
  if (content === null) {
    console.error("FAIL: method document missing: " + doc);
    return 2;
  }
  if (json) {
    console.log(JSON.stringify({
      id, name: "AI-Native Spec-Driven Harness & Loop Engineering",
      classification: "LOCAL_SYNTHESIS_NOT_INDUSTRY_STANDARD",
      status: "METHOD_DOCUMENTED_AND_ROUTED",
      pilot_status: "NOT_RUN",
      harness_loop_runner_status: "NOT_IMPLEMENTED",
      third_party_skills_installed: false,
      document: doc,
      content
    }, null, 2));
  } else {
    console.log(content);
  }
  return 0;
}

// ---------------------------------------------------------------- doctor

function cmdDoctor(argv) {
  const repoArg = argv.find(a => !a.startsWith("--")) ?? ".";
  const root = resolve(repoArg);
  if (!isDir(root)) { console.error("FAIL: not a directory: " + root); return 2; }
  const findings = [];
  const add = (kind, location, evidence, recommendation) => findings.push({ kind, location, evidence, recommendation });

  for (const fp of iterRepoFiles(root)) {
    if (extnameLower(fp) !== ".md") continue;
    const text = readText(fp); if (!text) continue;
    const rel = relative(root, fp).split(sep).join("/");
    const rx = /\[[^\]]+\]\(([^)#?]+?)(?:#[^)]*)?\)/g;
    let m;
    while ((m = rx.exec(text))) {
      const target = m[1].trim();
      if (!target || /^(https?:|mailto:|#|claude\.ai)/.test(target)) continue;
      if (/^[A-Z]+[-_a-z0-9]*$/.test(target) || target.includes("<") || target.includes("NNNN") || target.includes("{")) continue;
      const dest = resolve(dirname(fp), target);
      if (!dest.startsWith(root + sep) && dest !== root) continue;
      if (!existsSync(dest)) add("broken-link", rel, "link target missing: " + target, "fix or remove the link");
    }
  }

  for (const name of ["AGENTS.md", "CLAUDE.md", "README.md"]) {
    const f = join(root, name);
    if (!isFile(f)) continue;
    const text = readText(f) ?? "";
    const rx = /(?:```|~~~)(?:powershell|pwsh|sh|bash|shell)?\n([\s\S]*?)(?:```|~~~)/g;
    let m;
    while ((m = rx.exec(text))) {
      for (const line of m[1].split(/\r?\n/)) {
        const mm = line.trim().match(/^(?:python\s+|py\s+)?([\w./\\-]+\.(?:py|ps1|sh))\b/);
        if (!mm) continue;
        const script = mm[1];
        if (!existsSync(join(root, script)) && !existsSync(join(root, script.replace(/\\/g, "/"))))
          add("dead-path", name, "documented script does not exist: " + script, "remove or fix the path");
      }
    }
  }

  for (const rel of ["STATE.md", "docs/current-state.md", "docs/reference/current-state.md"]) {
    const f = join(root, rel);
    if (!isFile(f)) continue;
    const m = (readText(f) ?? "").match(/last_verified[:=]\s*(\d{4}-\d{2}-\d{2})/);
    if (!m) add("stale-truth", rel, "current-truth file has no last_verified date", "add last_verified: YYYY-MM-DD");
    else {
      const age = Math.floor((Date.now() - Date.parse(m[1] + "T00:00:00Z")) / 86400000);
      if (age > 60) add("stale-truth", rel, "last_verified is " + age + "d old (" + m[1] + ")", "re-verify or downgrade the claim");
    }
  }

  const envExample = join(root, ".env.example");
  if (isFile(envExample)) {
    const keys = new Set((readText(envExample) ?? "").split(/\r?\n/).filter(l => l.trim() && !l.trim().startsWith("#") && l.includes("=")).map(l => l.split("=")[0].trim()));
    for (const envf of readdirSync(root).filter(n => n.startsWith(".env") && n !== ".env.example" && n !== ".gitignore")) {
      const local = new Set((readText(join(root, envf)) ?? "").split(/\r?\n/).filter(l => l.trim() && !l.trim().startsWith("#") && l.includes("=")).map(l => l.split("=")[0].trim()));
      const missing = [...keys].filter(k => !local.has(k));
      if (missing.length) add("env-drift", envf, "keys in .env.example but missing locally: " + missing.slice(0, 6).join(", "), "copy new keys and set values locally");
    }
  }

  if (!findings.length) { console.log("DOCTOR: no drift findings"); return 0; }
  console.log("DOCTOR: " + findings.length + " finding(s)\n");
  const byKind = {};
  for (const f of findings) (byKind[f.kind] ??= []).push(f);
  for (const kind of Object.keys(byKind).sort()) {
    console.log("## " + kind + " (" + byKind[kind].length + ")");
    for (const f of byKind[kind].slice(0, 15)) console.log("- [" + f.location + "] " + f.evidence + "\n  recommendation: " + f.recommendation);
    if (byKind[kind].length > 15) console.log("  … and " + (byKind[kind].length - 15) + " more");
    console.log();
  }
  return 1;
}

// ---------------------------------------------------------------- validate-registry

function cmdValidateRegistry() {
  const errors = validateCatalog();
  const warns = [];
  for (const skill of SKILLS) {
    const dir = join(ROOT, skill.bundle);
    if (!isDir(dir)) { errors.push(skill.id + ": missing bundle directory " + skill.bundle); continue; }
    const skillFile = join(dir, "SKILL.md");
    if (!isFile(skillFile)) { errors.push(skill.id + ": missing SKILL.md"); continue; }
    const text = (readText(skillFile) ?? "").replace(/\r\n/g, "\n");
    if (!text.startsWith("---\n")) errors.push(skill.id + ": SKILL.md must start with frontmatter");
    if (!text.includes("\nname: " + skill.id + "\n")) errors.push(skill.id + ": frontmatter name mismatch");
    if (!/\ndescription:\s*\S/.test(text)) errors.push(skill.id + ": missing description");
    if (!text.includes("self_contained: true")) errors.push(skill.id + ": must declare self_contained: true");
    const statusLine = (text.match(/\nstatus:\s*(\S+)/) ?? [])[1];
    if (statusLine !== skill.status) errors.push(skill.id + ": frontmatter status does not match catalog");
    const licenseLine = (text.match(/\nlicense:\s*(\S+)/) ?? [])[1];
    if (licenseLine !== skill.license) errors.push(skill.id + ": frontmatter license does not match catalog");
    if (/\]\(\.\.\//.test(text)) errors.push(skill.id + ": bundle contains cross-directory links");
    for (const dep of skill.dependencies) if (!SKILL_IDS.includes(dep)) errors.push(skill.id + ": unknown dependency " + dep);
  }
  for (const e of errors) console.log("ERROR: " + e);
  for (const w of warns) console.log("WARN: " + w);
  if (errors.length) { console.log("\nvalidate-registry: FAIL (" + errors.length + " errors, " + warns.length + " warnings)"); return 2; }
  console.log("validate-registry: PASS (" + warns.length + " warnings)");
  return 0;
}

// ---------------------------------------------------------------- selftest

function cmdSelftest() {
  const r = spawnSync(process.execPath, ["--test"], { cwd: ROOT, stdio: "inherit", windowsHide: true });
  return r.status ?? 1;
}

// ---------------------------------------------------------------- task

function cmdTask(argv) {
  const taskId = argv.find(a => !a.startsWith("--")) ?? "feature";
  const tier = (argv.find(a => a.startsWith("--tier=")) ?? "--tier=B").slice(7);
  const mode = (argv.find(a => a.startsWith("--mode=")) ?? "--mode=new").slice(7);
  const type = (argv.find(a => a.startsWith("--type=")) ?? "--type=mini-program").slice(7);
  const route = composeRoute({ type, task: taskId, tier, mode });
  console.log("task=" + route.task.id + " (" + route.task.name + ") tier=" + route.tier.id + " mode=" + route.mode);
  for (const s of route.stages) console.log(String(s.index).padStart(2, "0") + " " + s.id.padEnd(16) + s.role.padEnd(9) + s.focus);
  console.log("skipped: " + (route.skipped.map(s => s.id).join(", ") || "none"));
  console.log("evidence: " + route.evidence.join(", "));
  console.log("skills: " + route.skills.map(s => s.id).join(", "));
  return 0;
}

// ---------------------------------------------------------------- assemble

function targetRepoState(target) {
  const git = (args) => spawnSync("git", ["-C", target, ...args], { encoding: "utf8", windowsHide: true });
  const top = git(["rev-parse", "--show-toplevel"]);
  if (top.status !== 0) return { gitRoot: null, headSha: "UNKNOWN", dirty: null };
  const head = git(["rev-parse", "HEAD"]);
  const status = git(["status", "--porcelain"]);
  return {
    gitRoot: resolve(top.stdout.trim()),
    isGitRoot: resolve(top.stdout.trim()) === resolve(target),
    headSha: head.status === 0 ? head.stdout.trim() : "UNKNOWN",
    dirty: status.status === 0 ? status.stdout.trim().length > 0 : null
  };
}

function parseAssembleFlags(argv) {
  const opts = { type: "mini-program", task: "feature", tier: "B", mode: "existing", stack: null, addons: [], apply: false, confirmReviewed: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--apply") { opts.apply = true; continue; }
    if (a === "--confirm-reviewed") { opts.confirmReviewed = true; continue; }
    if (!["--target", "--type", "--task", "--tier", "--mode", "--stack", "--addons", "--agent"].includes(a))
      throw new Error("Unknown option: " + a);
    if (!argv[i + 1] || argv[i + 1].startsWith("--")) throw new Error("Missing value for " + a);
    opts[a.slice(2)] = argv[++i];
  }
  if (!opts.target) throw new Error("assemble requires --target");
  if (!opts.agent) throw new Error("assemble requires --agent claude-code|codex|opencode");
  if (!Object.hasOwn(TYPES, opts.type)) throw new Error("Unknown project type: " + opts.type);
  if (!TASK_IDS.includes(opts.task)) throw new Error("Unknown task: " + opts.task);
  if (!Object.hasOwn(TIERS, opts.tier)) throw new Error("Tier must be A|B|C|D");
  if (!["new", "existing"].includes(opts.mode)) throw new Error("Mode must be new|existing");
  opts.addons = opts.addons ? String(opts.addons).split(",").map(x => x.trim()).filter(Boolean) : [];
  return opts;
}

function cmdAssemble(argv) {
  const opts = parseAssembleFlags(argv);
  const target = resolve(opts.target);
  if (!existsSync(target) || !isDir(target)) throw new Error("Target must be an existing directory: " + target);
  if (lstatSync(target).isSymbolicLink()) throw new Error("Target must not be a symlink");

  const route = composeRoute({
    type: opts.type, task: opts.task, tier: opts.tier, mode: opts.mode,
    stack: opts.stack ?? undefined, addons: opts.addons
  });
  const stageSkills = route.stages.map(s => ({
    stage: s.id, name: s.name, role: s.role,
    skills: [...(STAGES.find(x => x.id === s.id)?.requiredSkills ?? [])]
  }));
  const required = [...new Set(stageSkills.flatMap(s => s.skills))];
  const resolved = resolveSkillDependencies(required.join(","));
  const plan = runSkillKit(["plan", "--target", target, "--agent", opts.agent, "--skills", resolved.join(",")], { silent: true });
  const repo = targetRepoState(target);
  const warnings = [...route.warnings];
  if (repo.gitRoot && !repo.isGitRoot) warnings.push("Target is inside a Git repo but is not its root");
  if (!repo.gitRoot) warnings.push("Target is not a Git repository; base SHA is UNKNOWN");
  warnings.push("Skills are UNLICENSED-PROPRIETARY; confirm target visibility and distribution rights");

  const out = {
    status: "ASSEMBLY_DRY_RUN",
    runtime: RUNTIME.name + " " + RUNTIME.version,
    target: { path: target, ...repo },
    project: {
      name: basename(target), type: opts.type, task: route.task.id, tier: route.tier.id,
      mode: route.mode, stack: route.stack, profiles: route.profiles
    },
    route: {
      stages: stageSkills,
      skipped: route.skipped.map(s => s.id),
      sop: { negativeCase: route.routeSop.negativeCase, platformConstraints: route.routeSop.platformConstraints }
    },
    skills: {
      required, resolved,
      planStatus: plan.status,
      license: "UNLICENSED-PROPRIETARY",
      items: plan.skills.map(s => ({ skill: s.skill, path: s.path, conflicts: s.conflicts, alreadyManaged: s.alreadyManaged }))
    },
    agent: {
      id: opts.agent,
      filesWillInstallTo: plan.directory,
      runtimeLoad: "NOT_VERIFIED",
      probeCommand: opts.agent === "opencode"
        ? "cd <target> && opencode debug skill"
        : opts.agent === "codex"
          ? "cd <target> && codex debug prompt-input"
          : "cd <target> && claude -p \"/<skill> ...\""
    },
    next: [
      "Review the plan and target visibility.",
      "Re-run with --apply --confirm-reviewed to install files.",
      "Run: node tools/xeng.mjs agent-check --target <target> --agent " + opts.agent,
      "Verify the Agent actually discovers the skill before claiming it loaded."
    ],
    warnings
  };

  if (opts.apply) {
    if (!opts.confirmReviewed) throw new Error("--apply requires --confirm-reviewed after reviewing target visibility and license");
    const already = plan.skills.filter(s => s.alreadyManaged);
    if (already.length && already.length !== plan.skills.length)
      throw new Error("Partial managed install; resolve with skill-kit update before assembling");
    if (already.length) {
      out.status = "ALREADY_MANAGED";
    } else {
      const install = runSkillKit([
        "install", "--target", target, "--agent", opts.agent, "--skills", resolved.join(","),
        "--apply", "--confirm-reviewed"
      ], { silent: true });
      out.status = "ASSEMBLY_INSTALLED_NOT_TESTED";
      out.receipt = install.receipt;
      out.skills.installed = install.skills;
    }
    out.verification = runSkillKit(["verify", "--target", target, "--agent", opts.agent], { silent: true });
  }
  console.log(JSON.stringify(out, null, 2));
  return 0;
}

function cmdAgentCheck(argv) {
  const opts = { agent: null, target: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!["--target", "--agent"].includes(a)) throw new Error("Unknown option: " + a);
    if (!argv[i + 1] || argv[i + 1].startsWith("--")) throw new Error("Missing value for " + a);
    opts[a.slice(2)] = argv[++i];
  }
  if (!opts.target || !opts.agent) throw new Error("agent-check requires --target and --agent");
  const target = resolve(opts.target);
  if (!existsSync(target) || !isDir(target)) throw new Error("Target does not exist: " + target);
  const verify = runSkillKit(["verify", "--target", target, "--agent", opts.agent], { silent: true });
  const installed = (verify.skills ?? []).length > 0;
  const filesOk = verify.status === "VERIFIED_UNCHANGED";
  const out = {
    status: !installed ? "NOT_INSTALLED" : filesOk ? "FILES_VERIFIED_RUNTIME_NOT_VERIFIED" : "DRIFT_DETECTED",
    agent: opts.agent,
    target,
    skills: verify.skills ?? [],
    runtimeLoad: "NOT_VERIFIED",
    probeCommand: opts.agent === "opencode"
      ? "cd <target> && opencode debug skill"
      : opts.agent === "codex"
        ? "cd <target> && codex debug prompt-input"
        : "cd <target> && claude -p \"/<skill> ...\"",
    note: "File hashes do not prove the Agent discovered or executed the skill. Record the probe output separately."
  };
  console.log(JSON.stringify(out, null, 2));
  return installed && filesOk ? 0 : 1;
}

// ---------------------------------------------------------------- method / matrix / delivery / skills-matrix

function methodTemplate() {
  const lines = [
    "# AI-Native Full-Stack Delivery · 8 宏阶段 × 18 活动 × 11 权威阶段", "",
    "> 兼容视图，不是第二套生命周期。权威阶段仍来自 src/catalog.mjs。", "",
    "## 宏阶段", "",
    "| 宏阶段 | 名称 | 权威阶段 |", "|---|---|---|",
    ...MACRO_STAGES.map(m => "| " + m.id + " | " + m.name + " | " + m.canonicalStages.join(", ") + " |"),
    "", "## 18 项活动", "",
    "| ID | 活动 | 权威阶段 | 主用 Skill | 替代 Skill |", "|---|---|---|---|---|",
    ...ACTIVITIES.map(a => "| " + a.id + " | " + a.name + " | " + a.stages.join(", ") + " | " + a.primarySkill + " | " + (a.alternateSkills.join(", ") || "—") + " |"),
    "", "## 覆盖矩阵", "",
    "| 权威阶段 | 宏阶段 | 活动 |", "|---|---|---|"
  ];
  const rows = deliveryMatrix();
  for (const [stage, info] of Object.entries(rows))
    lines.push("| " + stage + " | " + (info.macro ?? "—") + " | " + (info.activities.join(", ") || "—") + " |");
  lines.push("", "所有活动均为草案映射；真实执行证据留在目标项目。", "");
  return lines.join("\n");
}

function cmdMatrix(argv) {
  const json = argv.includes("--json");
  const rows = deliveryMatrix();
  if (json) { console.log(JSON.stringify(rows, null, 2)); return 0; }
  console.log("Stage coverage matrix (canonical 11 stages)");
  for (const [stage, info] of Object.entries(rows))
    console.log("  " + stage.padEnd(16) + (info.macro ?? "—").padEnd(4) + info.activities.join(", "));
  return 0;
}

function cmdDelivery(argv) {
  const json = argv.includes("--json");
  const data = {
    deliveryStates: DELIVERY_STATES,
    loopPhases: LOOP_PHASES,
    terminalStates: LOOP_TERMINAL_STATES,
    loopDefaults: LOOP_DEFAULTS,
    ticketContractFields: TICKET_CONTRACT_FIELDS,
    ticketContractStatus: TICKET_CONTRACT_STATUS,
    acceptanceTestPolicy: ACCEPTANCE_TEST_POLICY,
    platformBranches: PLATFORM_BRANCHES,
    aiOverlay: AI_OVERLAY,
    learningPath: LEARNING_PATH,
    learningPathTickets: learningPathTickets()
  };
  if (json) { console.log(JSON.stringify(data, null, 2)); return 0; }
  console.log("Commercial delivery states (forward-only):");
  for (const s of DELIVERY_STATES) console.log("  " + s.id.padEnd(18) + s.name + " — " + s.cannotSubstitute);
  console.log("\nBounded loop: " + LOOP_PHASES.join(" → "));
  console.log("Terminal states: " + LOOP_TERMINAL_STATES.map(t => t.id + "(" + t.evidenceState + ")").join(", "));
  console.log("Defaults: " + LOOP_DEFAULTS.maxAttemptsPerTicket + " attempts/ticket, " + LOOP_DEFAULTS.maxReviewFixRounds + " review-fix rounds, maxParallel=" + LOOP_DEFAULTS.maxParallelTickets);
  console.log("\nTicket contract: " + TICKET_CONTRACT_STATUS.status);
  console.log("Fields: " + TICKET_CONTRACT_FIELDS.join(", "));
  console.log("\nPlatform branches: " + PLATFORM_BRANCHES.map(b => b.id).join(", "));
  console.log("AI overlay: " + AI_OVERLAY.capabilities.join(", ") + " — " + AI_OVERLAY.rule);
  return 0;
}

function cmdSkillsMatrix(argv) {
  const json = argv.includes("--json");
  const data = {
    local: SKILLS.map(s => ({ id: s.id, status: s.status, license: s.license, lifecycle_stage: s.lifecycle_stage })),
    external: EXTERNAL_SKILLS,
    verificationLayers: SKILL_VERIFICATION_LAYERS,
    policy: SKILL_RELATION_POLICY,
    learningPath: LEARNING_PATH
  };
  if (json) { console.log(JSON.stringify(data, null, 2)); return 0; }
  console.log("Local candidate skills (all CANDIDATE, UNLICENSED-PROPRIETARY):");
  for (const s of SKILLS) console.log("  " + s.id.padEnd(22) + s.status + " · " + s.lifecycle_stage);
  console.log("\nExternal candidates (not vendored; user-explicit trigger only):");
  for (const x of EXTERNAL_SKILLS) console.log("  " + x.id.padEnd(28) + x.version.padEnd(10) + x.license + " · " + x.verification);
  console.log("\nVerification layers are separate: " + SKILL_VERIFICATION_LAYERS.join(" → "));
  console.log("Policy: one primary owner per activity; " + SKILL_RELATION_POLICY.note);
  return 0;
}

// ---------------------------------------------------------------- orchestrator
//
// Read-only. `list` and `plan` never touch external programs. `doctor` only runs
// `<binary> --version`; absence is reported as NOT_INSTALLED, never as success.
// No provider command is ever constructed from ticket fields.

// Resolve a binary on PATH without invoking a shell. On Windows, prefer real
// executables and .cmd shims over the extensionless POSIX wrapper npm also writes.
function findOnPath(binary) {
  const exts = process.platform === "win32" ? [".exe", ".cmd", ".bat", ""] : [""];
  const sep = process.platform === "win32" ? ";" : ":";
  for (const dir of String(process.env.PATH ?? "").split(sep)) {
    if (!dir) continue;
    for (const ext of exts) {
      const candidate = join(dir, binary + ext);
      if (isFile(candidate)) return candidate;
    }
  }
  return null;
}

function probeBinary(binary) {
  const found = findOnPath(binary);
  if (!found) return { status: "NOT_INSTALLED", detail: "not found on PATH" };
  if (/\.(cmd|bat)$/i.test(found)) return { status: "INSTALLED", detail: found + " (shim; version not probed)" };
  const r = spawnSync(found, ["--version"], { encoding: "utf8", timeout: 5000, windowsHide: true });
  if (r.error) return { status: "INSTALLED", detail: found + " (version not probed: " + String(r.error.code ?? "error").slice(0, 40) + ")" };
  const first = String(r.stdout ?? "").split(/\r?\n/).find(line => line.trim()) ?? "";
  return { status: "INSTALLED", detail: (first || "exit " + r.status).trim().slice(0, 120) };
}

const orchestratorUsage = () => [
  "Usage:",
  "  xeng orchestrator list [--json]",
  "  xeng orchestrator doctor [--provider <id>] [--json]",
  "  xeng orchestrator plan --provider <id> --agent <runtime> [--ticket <file.json>] [--base-sha <sha>] [--project-id <id>] [--repository <owner/repo>] [--platform windows|wsl2|linux|macos] [--json]",
  "  xeng orchestrator receipt --file <receipt.json> [--plan <plan.json>] [--json]",
  "",
  "Providers: " + PROVIDER_IDS.join(", "),
  "Agent runtimes: " + AGENT_RUNTIME_IDS.join(", "),
  "All commands are read-only. plan is PLAN_ONLY/DRY_RUN; receipt stays UNTRUSTED."
].join("\n");

function cmdOrchestrator(argv) {
  const sub = argv[0];
  const rest = argv.slice(1);
  if (!sub || sub === "--help" || sub === "-h") { console.log(orchestratorUsage()); return 0; }
  if (sub === "list") return orchestratorList(rest);
  if (sub === "doctor") return orchestratorDoctor(rest);
  if (sub === "plan") return orchestratorPlan(rest);
  if (sub === "receipt") return orchestratorReceipt(rest);
  console.error("Unknown orchestrator subcommand: " + sub + "\n\n" + orchestratorUsage());
  return 2;
}

function orchestratorList(argv) {
  const unknown = argv.filter(a => a.startsWith("--") && a !== "--json");
  if (unknown.length) { console.error("Unknown option: " + unknown[0]); return 2; }
  const json = argv.includes("--json");
  const out = { kind: "ORCHESTRATION_PROVIDER_REGISTRY", status: "READ_ONLY", providers: listProviders(), agentRuntimes: AGENT_RUNTIMES.map(r => ({ id: r.id, name: r.name, binary: r.binary, license: r.license })) };
  if (json) { console.log(JSON.stringify(out, null, 2)); return 0; }
  console.log("Agent orchestration providers (read-only registry)");
  for (const p of PROVIDERS) {
    console.log("  " + p.provider_id.padEnd(8) + p.priority + "  " + p.name.padEnd(8) + " " + p.license.padEnd(18) + " windows=" + p.platforms.windows.padEnd(18) + " omp=" + p.agent_runtimes.omp);
  }
  console.log("\nAgent runtimes: " + AGENT_RUNTIMES.map(r => r.id + "(" + r.binary + ")").join(", "));
  console.log("Plan only: xeng orchestrator plan --provider <id> --agent <runtime> --ticket <file.json>");
  return 0;
}

function orchestratorDoctor(argv) {
  let filter = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") continue;
    if (a === "--provider") {
      if (!argv[i + 1] || argv[i + 1].startsWith("--")) { console.error("Missing value for --provider"); return 2; }
      filter = argv[++i];
      continue;
    }
    console.error("Unknown option: " + a);
    return 2;
  }
  if (filter && !PROVIDER_IDS.includes(filter)) { console.error("Unknown provider: " + filter); return 2; }
  const json = argv.includes("--json");
  const providerRows = PROVIDERS.filter(p => !filter || p.provider_id === filter).map(p => ({
    provider_id: p.provider_id, priority: p.priority, binary: p.binary,
    install: probeBinary(p.binary), adapter_status: p.adapter_status,
    license_review: p.license_review
  }));
  const runtimeRows = AGENT_RUNTIMES.map(r => ({ id: r.id, binary: r.binary, install: probeBinary(r.binary) }));
  const missing = providerRows.filter(r => r.install.status !== "INSTALLED").map(r => r.provider_id);
  const out = {
    kind: "ORCHESTRATION_DOCTOR",
    status: missing.length ? "PROVIDERS_MISSING" : "PROVIDERS_PRESENT",
    real_provider_tested: false,
    providers: providerRows,
    agentRuntimes: runtimeRows,
    missing_providers: missing,
    note: "Installation is not capability verification. A present binary has not been run against a ticket here."
  };
  if (json) console.log(JSON.stringify(out, null, 2));
  else {
    console.log("ORCHESTRATION DOCTOR (read-only)");
    for (const r of providerRows) console.log("  " + r.install.status.padEnd(24) + r.provider_id.padEnd(8) + (r.install.detail ?? ""));
    console.log("\nAgent runtimes:");
    for (const r of runtimeRows) console.log("  " + r.install.status.padEnd(24) + r.id.padEnd(12) + (r.install.detail ?? ""));
    console.log("\nREAL PROVIDER TEST: NOT_RUN (no orchestration provider was executed)");
  }
  return missing.length ? 1 : 0;
}

function readJsonFileStrict(file) {
  const abs = resolve(file);
  const st = lstatMaybe(abs);
  if (!st || !st.isFile()) throw new Error("file not found: " + file);
  if (st.isSymbolicLink()) throw new Error("refusing symlink input: " + file);
  const text = readText(abs);
  if (text === null) throw new Error("cannot read file: " + file);
  let parsed;
  try { parsed = JSON.parse(text); } catch { throw new Error("invalid JSON: " + file); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("expected a JSON object: " + file);
  return parsed;
}

function orchestratorPlan(argv) {
  const opts = { provider: null, agent: null, ticket: null, baseSha: null, projectId: null, repository: null, platform: "windows", json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") { opts.json = true; continue; }
    const key = { "--provider": "provider", "--agent": "agent", "--ticket": "ticket", "--base-sha": "baseSha", "--project-id": "projectId", "--repository": "repository", "--platform": "platform" }[a];
    if (!key) { console.error("Unknown option: " + a); return 2; }
    if (!argv[i + 1] || argv[i + 1].startsWith("--")) { console.error("Missing value for " + a); return 2; }
    opts[key] = argv[++i];
  }
  if (!opts.provider || !opts.agent) { console.error("plan requires --provider and --agent\n\n" + orchestratorUsage()); return 2; }
  if (!PROVIDER_IDS.includes(opts.provider)) { console.error("Unknown provider: " + opts.provider + " (available: " + PROVIDER_IDS.join(", ") + ")"); return 2; }
  if (!AGENT_RUNTIME_IDS.includes(opts.agent)) { console.error("Unknown agent runtime: " + opts.agent + " (available: " + AGENT_RUNTIME_IDS.join(", ") + ")"); return 2; }

  let ticket = opts.ticket ? readJsonFileStrict(opts.ticket) : {};
  if (opts.baseSha && (ticket.base_sha === undefined || ticket.base_sha === null)) ticket = { ...ticket, base_sha: opts.baseSha };
  if (opts.projectId && (ticket.spec_id === undefined || ticket.spec_id === null)) ticket = { ...ticket, spec_id: opts.projectId };

  const provider = getProvider(opts.provider);
  const install = probeBinary(provider.binary).status;
  let plan;
  try {
    plan = planHandoff({
      providerId: opts.provider, agentRuntime: opts.agent, ticket,
      platform: opts.platform, projectId: opts.projectId, repository: opts.repository,
      installationStatus: install
    });
  } catch (e) {
    console.error("BLOCKED: " + e.message);
    return 2;
  }

  if (opts.json) console.log(JSON.stringify(plan, null, 2));
  else {
    console.log("ORCHESTRATION HANDOFF PLAN (PLAN_ONLY / DRY_RUN)");
    console.log("  status: " + plan.status);
    console.log("  provider: " + plan.provider_id + " @ " + plan.provider_version + "  agent: " + plan.agent_runtime);
    console.log("  platform: " + plan.platform + "  installation: " + plan.installation_status);
    console.log("  isolation: " + plan.workspace_policy.isolation + "  verification: " + plan.verification_status);
    console.log("\nPreflight:");
    for (const c of plan.preflight) console.log("  " + c.status.padEnd(7) + c.check + " — " + c.detail);
    if (plan.blocked_reasons.length) console.log("\nBlocked:\n" + plan.blocked_reasons.map(r => "  - " + r).join("\n"));
    if (plan.warnings.length) console.log("\nWarnings:\n" + plan.warnings.map(r => "  - " + r).join("\n"));
    console.log("\nNon-actions: " + plan.non_actions.join(" "));
  }
  return plan.status === "BLOCKED" ? 2 : 0;
}

function orchestratorReceipt(argv) {
  const opts = { file: null, plan: null, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") { opts.json = true; continue; }
    const key = { "--file": "file", "--plan": "plan" }[a];
    if (!key) { console.error("Unknown option: " + a); return 2; }
    if (!argv[i + 1] || argv[i + 1].startsWith("--")) { console.error("Missing value for " + a); return 2; }
    opts[key] = argv[++i];
  }
  if (!opts.file) { console.error("receipt requires --file\n\n" + orchestratorUsage()); return 2; }
  const raw = readJsonFileStrict(opts.file);
  const receipt = normalizeExternalReceipt(raw);
  let verification = null;
  if (opts.plan) {
    const plan = readJsonFileStrict(opts.plan);
    verification = verifyReceiptAgainstPlan(raw, plan);
  }
  const out = { kind: "ORCHESTRATION_RECEIPT_IMPORT", receipt, verification, real_provider_tested: false };
  if (opts.json) console.log(JSON.stringify(out, null, 2));
  else {
    console.log("EXTERNAL EXECUTION RECEIPT (UNTRUSTED)");
    console.log("  provider: " + receipt.provider_id + "  agent: " + receipt.agent_runtime);
    console.log("  ticket: " + receipt.ticket_id + "  base_sha: " + receipt.base_sha + "  head_sha: " + receipt.head_sha);
    console.log("  trust: " + receipt.trust + "  evidence_state: " + receipt.evidence_state + "  promotion: " + receipt.promotion);
    if (verification) console.log("  identity match: " + (verification.ok ? "PASS" : "FAIL — " + verification.mismatches.join("; ")));
    console.log("  note: " + receipt.note);
  }
  return verification && !verification.ok ? 2 : 0;
}

// ---------------------------------------------------------------- main

function usage() {
  return [
    "Workbench xeng CLI (Node, offline)",
    "",
    "  xeng init <path> --profile a,b --tier A|B|C|D [--task feature] [--mode new|existing] [--dry-run]",
    "  xeng audit [path] [--json]",
    "  xeng doctor [path]",
    "  xeng maturity [path] [--json]",
    "  xeng playbook [id] [--json]",
    "  xeng method [overview|sources|pilot|design|skills|activities|matrix|A01..A18] [--json] [--template]",
    "  xeng validate-registry",
    "  xeng selftest",
    "  xeng task <type> [--tier=A] [--mode=new] [--type=saas]",
    "  xeng matrix [--json]",
    "  xeng delivery [--json]",
    "  xeng skills-matrix [--json]",
    "  xeng orchestrator list|doctor|plan|receipt [--json]",
    "  xeng assemble --target <dir> --type saas --task feature --tier B --agent codex [--apply --confirm-reviewed]",
    "  xeng agent-check --target <dir> --agent codex",
    "  xeng version",
    "",
    "No network access. init never overwrites existing files. assemble reuses skill-kit and is dry-run by default."
  ].join("\n");
}

export function main(argv = process.argv.slice(2)) {
  const [cmd, ...rest] = argv;
  if (!cmd || cmd === "--help" || cmd === "-h") { console.log(usage()); return 0; }
  switch (cmd) {
    case "init": return cmdInit(rest);
    case "audit": return cmdAudit(rest);
    case "doctor": return cmdDoctor(rest);
    case "maturity": return cmdMaturity(rest);
    case "playbook": return cmdPlaybook(rest);
    case "method": return cmdMethod(rest);
    case "validate-registry": return cmdValidateRegistry(rest);
    case "selftest": return cmdSelftest(rest);
    case "task": return cmdTask(rest);
    case "matrix": return cmdMatrix(rest);
    case "delivery": return cmdDelivery(rest);
    case "skills-matrix": return cmdSkillsMatrix(rest);
    case "orchestrator": return cmdOrchestrator(rest);
    case "assemble": return cmdAssemble(rest);
    case "agent-check": return cmdAgentCheck(rest);
    case "version": console.log(RUNTIME.name + " " + RUNTIME.version); return 0;
    default: console.error("Unknown command: " + cmd + "\n\n" + usage()); return 2;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exitCode = main(); }
  catch (e) { console.error("ERROR: " + e.message); process.exitCode = 2; }
}
