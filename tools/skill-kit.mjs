#!/usr/bin/env node
// Offline Skill Kit for bundled, self-contained Skills.
// The published web page never runs this program. No network, no Skill execution.
import {
  existsSync, lstatSync, mkdirSync, writeFileSync, readFileSync, unlinkSync,
  renameSync, readdirSync, rmdirSync
} from "node:fs";
import { resolve, join, dirname, sep, relative, posix } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  skillInstallContract, selectedSkills, SKILL_DESTINATIONS, resolveSkillDependencies
} from "../src/install-contract.mjs";
import { SKILL_IDS, PROVENANCE, RUNTIME, OWNER } from "../src/catalog.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LOCK_PATH = ".x-superplay/skill-kit.lock.json";
const RECEIPT_DIR = ".x-superplay/skill-kit-receipts";
const MAX_FILE = 256 * 1024;
const MAX_RECEIPT = 2 * 1024 * 1024;

const hash = data => createHash("sha256").update(data).digest("hex");
const posixRel = p => p.split(sep).join("/");

function usage() {
  return [
    "Offline Skill Kit — bundled Skills, dry-run by default, no network.",
    "",
    "  node tools/skill-kit.mjs list",
    "  node tools/skill-kit.mjs plan      --target ../project --agent codex --skills verification",
    "  node tools/skill-kit.mjs install   --target ../project --agent codex --skills verification [--apply --confirm-reviewed]",
    "  node tools/skill-kit.mjs verify    --target ../project [--agent codex] [--skills a,b]",
    "  node tools/skill-kit.mjs update    --target ../project [--agent codex] [--skills a,b] [--apply --confirm-reviewed]",
    "  node tools/skill-kit.mjs uninstall --target ../project [--agent codex] [--skills a,b] [--apply --confirm-reviewed]",
    "  node tools/skill-kit.mjs rollback  --target ../project --receipt <path> [--apply --confirm-reviewed]",
    "",
    "Skills are installed as whole bundle directories (SKILL.md + references/).",
    "Existing files are never overwritten. Uninstall and update refuse modified files.",
    "Every --apply writes a receipt under .x-superplay/skill-kit-receipts/."
  ].join("\n");
}

function parse(argv) {
  const commands = new Set(["list", "plan", "install", "verify", "update", "uninstall", "rollback"]);
  const flags = { apply: false, confirmReviewed: false };
  let command = null;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") { flags.help = true; continue; }
    if (!arg.startsWith("--") && commands.has(arg) && !command) { command = arg; continue; }
    if (arg === "--apply") { flags.apply = true; continue; }
    if (arg === "--confirm-reviewed") { flags.confirmReviewed = true; continue; }
    if (!["--target", "--agent", "--skills", "--receipt", "--bundle-root"].includes(arg))
      throw new Error("Unknown option: " + arg);
    if (!argv[i + 1] || argv[i + 1].startsWith("--")) throw new Error("Missing value for " + arg);
    const key = arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (Object.hasOwn(flags, key)) throw new Error("Duplicate option: " + arg);
    flags[key] = argv[++i];
  }
  if (flags.help) return { help: true };
  if (!command) {
    // Legacy invocation without a subcommand was an install preview.
    command = "install";
  }
  if (command !== "list" && !flags.target) throw new Error("Missing --target");
  if (command === "install" && (!flags.agent || !flags.skills))
    throw new Error("install requires --agent and --skills");
  if (command === "rollback" && !flags.receipt) throw new Error("rollback requires --receipt");
  if (flags.apply && !flags.confirmReviewed)
    throw new Error("--apply requires --confirm-reviewed after checking scope and target visibility");
  return { ...flags, command };
}

function maybeStat(path) {
  try { return lstatSync(path); } catch (e) { if (e.code === "ENOENT") return null; throw e; }
}

function denyLinks(path, root) {
  if (path !== root && !path.startsWith(root + sep)) throw new Error("Path escapes target");
  const rel = path === root ? "" : path.slice(root.length + 1);
  let current = root;
  for (const segment of rel.split(/[\\/]/).filter(Boolean)) {
    current = join(current, segment);
    if (maybeStat(current)?.isSymbolicLink()) throw new Error("Symlink destination forbidden: " + current);
  }
}

function bundleRoot(flags) {
  return resolve(flags.bundleRoot ? resolve(flags.bundleRoot) : join(ROOT, "skills"));
}

function listBundleFiles(dir, base = dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const abs = join(dir, entry.name);
    const st = lstatSync(abs);
    if (st.isSymbolicLink()) throw new Error("Bundle contains a symlink: " + abs);
    if (st.isDirectory()) out.push(...listBundleFiles(abs, base));
    else if (st.isFile()) out.push({ rel: posixRel(relative(base, abs)), abs, data: readFileSync(abs) });
  }
  return out;
}

export function readSkillBundle(id, root = join(ROOT, "skills")) {
  if (!SKILL_IDS.includes(id)) throw new Error("Unknown skill: " + id);
  const dir = join(root, id);
  if (!existsSync(dir)) throw new Error("Missing bundled skill: skills/" + id);
  const files = listBundleFiles(dir);
  if (!files.length) throw new Error("Empty bundled skill: " + id);
  const main = files.find(f => f.rel === "SKILL.md");
  if (!main) throw new Error(id + ": bundle has no SKILL.md at its root");
  for (const f of files) {
    if (f.data.length > MAX_FILE) throw new Error(id + ": file exceeds 256 KiB: " + f.rel);
    if (!/^[A-Za-z0-9._/-]+$/.test(f.rel) || f.rel.split("/").includes(".."))
      throw new Error(id + ": unsafe file name in bundle: " + f.rel);
  }
  const text = main.data.toString("utf8").replace(/\r\n/g, "\n");
  if (!text.startsWith("---\n")) throw new Error(id + ": SKILL.md must start with frontmatter");
  if (!text.includes("\nname: " + id + "\n")) throw new Error(id + ": frontmatter name mismatch");
  if (!/\ndescription:\s*\S/.test(text)) throw new Error(id + ": frontmatter lacks description");
  if (!text.includes("self_contained: true")) throw new Error(id + ": bundle is not declared self_contained");
  const warnings = [];
  for (const f of files) {
    const body = f.data.toString("utf8");
    if (/\]\(\.\.\//.test(body)) warnings.push(f.rel + ": cross-directory link does not resolve after install");
  }
  const manifest = files.map(f => f.rel + "\0" + hash(f.data)).sort().join("\n");
  return {
    id, dir,
    files: files.map(f => ({ path: f.rel, data: f.data, sha256: hash(f.data) })),
    bundleSha256: hash(manifest),
    warnings
  };
}

function expectedDir(agent, skill) { return SKILL_DESTINATIONS[agent] + "/" + skill; }
function lockFile(target) { return resolve(target, LOCK_PATH); }
function receiptDir(target) { return resolve(target, RECEIPT_DIR); }

function emptyLock() {
  return {
    schemaVersion: 2,
    runtime: RUNTIME.name,
    runtimeVersion: RUNTIME.version,
    historicalProvenance: { repository: PROVENANCE.repository, commit: PROVENANCE.commit },
    managed: []
  };
}

function validateFiles(files, id) {
  if (!Array.isArray(files) || !files.length) throw new Error("Invalid lock record: " + id);
  for (const f of files) {
    if (typeof f.path !== "string" || f.path.startsWith("/") || f.path.split("/").includes(".."))
      throw new Error("Invalid file path in lock record: " + id);
    if (!/^[a-f0-9]{64}$/.test(f.sha256)) throw new Error("Invalid file hash in lock record: " + id);
  }
  return files;
}

function normalizeLock(raw) {
  if (!raw || typeof raw !== "object") throw new Error("Invalid lockfile");
  if (raw.schemaVersion === 2) {
    if (!Array.isArray(raw.managed)) throw new Error("Invalid lockfile");
    const keys = new Set();
    for (const row of raw.managed) {
      if (!Object.hasOwn(SKILL_DESTINATIONS, row.agent) || !SKILL_IDS.includes(row.skill))
        throw new Error("Invalid lock record");
      if (row.path !== expectedDir(row.agent, row.skill)) throw new Error("Invalid lock path");
      validateFiles(row.files, row.skill);
      const key = row.agent + ":" + row.skill;
      if (keys.has(key)) throw new Error("Duplicate lock record");
      keys.add(key);
    }
    return raw;
  }
  if (raw.schemaVersion === 1) {
    const legacyRepo = raw.source;
    if (legacyRepo !== PROVENANCE.repository && legacyRepo !== OWNER.repository)
      throw new Error("Invalid or foreign lockfile");
    if (!Array.isArray(raw.managed)) throw new Error("Invalid lockfile");
    const lock = emptyLock();
    lock.historicalProvenance = { repository: legacyRepo, commit: PROVENANCE.commit, upgradedFrom: 1 };
    for (const row of raw.managed) {
      if (!Object.hasOwn(SKILL_DESTINATIONS, row.agent) || !SKILL_IDS.includes(row.skill))
        throw new Error("Invalid lock record");
      if (row.path !== expectedDir(row.agent, row.skill) + "/SKILL.md") throw new Error("Invalid lock path");
      if (!/^[a-f0-9]{64}$/.test(row.sha256)) throw new Error("Invalid lock hash");
      lock.managed.push({
        agent: row.agent, skill: row.skill, path: expectedDir(row.agent, row.skill),
        files: [{ path: "SKILL.md", sha256: row.sha256 }],
        legacySourceCommit: row.sourceCommit,
        legacySchema: 1
      });
    }
    return lock;
  }
  throw new Error("Unsupported lockfile schemaVersion: " + raw.schemaVersion);
}

function loadLock(target) {
  const file = lockFile(target);
  denyLinks(file, target);
  if (!existsSync(file)) return emptyLock();
  return normalizeLock(JSON.parse(readFileSync(file, "utf8")));
}

function writeLock(target, lock) {
  const file = lockFile(target);
  denyLinks(file, target);
  mkdirSync(dirname(file), { recursive: true });
  const temp = file + ".tmp-" + process.pid;
  try {
    writeFileSync(temp, JSON.stringify(lock, null, 2) + "\n", { flag: "wx", mode: 0o600 });
    if (maybeStat(file)?.isSymbolicLink()) throw new Error("Lockfile is a symlink");
    renameSync(temp, file);
  } catch (e) {
    if (existsSync(temp)) unlinkSync(temp);
    throw e;
  }
}

function readManagedFiles(target, row) {
  const dir = resolve(target, row.path);
  denyLinks(dir, target);
  return row.files.map(f => {
    const abs = resolve(dir, f.path);
    denyLinks(abs, target);
    const st = maybeStat(abs);
    if (!st) return { ...f, abs, state: "MISSING" };
    if (!st.isFile()) return { ...f, abs, state: "NOT_A_FILE" };
    const data = readFileSync(abs);
    return { ...f, abs, data, state: hash(data) === f.sha256 ? "OK" : "MODIFIED" };
  });
}

function managedRows(lock, { agent, skills }) {
  let rows = lock.managed;
  if (agent) rows = rows.filter(r => r.agent === agent);
  if (skills) {
    const names = selectedSkills(skills);
    rows = rows.filter(r => names.includes(r.skill));
  }
  return rows;
}

function writeReceipt(target, receipt) {
  const dir = receiptDir(target);
  denyLinks(dir, target);
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const name = stamp + "-" + receipt.operation + ".json";
  const file = join(dir, name);
  const body = JSON.stringify(receipt, null, 2) + "\n";
  if (body.length > MAX_RECEIPT) throw new Error("Receipt would exceed 2 MiB; refuse to proceed");
  writeFileSync(file, body, { flag: "wx", mode: 0o600 });
  return posixRel(relative(target, file));
}

function receiptFrom(target, operation, rows, entries) {
  return {
    schemaVersion: 1,
    operation,
    createdAt: new Date().toISOString(),
    target: posixRel(relative(ROOT, target)) || ".",
    agent: rows.length ? [...new Set(rows.map(r => r.agent))].join(",") : null,
    skills: rows.map(r => r.skill),
    lockBefore: loadLock(target),
    entries
  };
}

function applyEntries(target, entries, lockAfter) {
  for (const entry of entries) {
    denyLinks(entry.abs, target);
    if (entry.after === null) {
      if (maybeStat(entry.abs)) unlinkSync(entry.abs);
    } else {
      mkdirSync(dirname(entry.abs), { recursive: true });
      writeFileSync(entry.abs, entry.data, { flag: "wx", mode: 0o600 });
      if (hash(readFileSync(entry.abs)) !== entry.after) throw new Error("Write verification failed: " + entry.abs);
    }
  }
  writeLock(target, lockAfter);
}

function pruneEmptyDirs(dir, stop) {
  let current = dir;
  while (current !== stop && current.startsWith(stop + sep)) {
    try { rmdirSync(current); } catch { return; }
    current = dirname(current);
  }
}

function summarize(status, target, rows, extra = {}) {
  return {
    status,
    runtime: RUNTIME.name + " " + RUNTIME.version,
    target: posixRel(relative(ROOT, target)) || ".",
    lock: LOCK_PATH,
    skills: rows.map(r => ({ agent: r.agent, skill: r.skill, path: r.path })),
    ...extra
  };
}

// ---------------------------------------------------------------- commands

function cmdList(flags) {
  const root = bundleRoot(flags);
  const rows = SKILL_IDS.map(id => {
    const b = readSkillBundle(id, root);
    return { id, files: b.files.length, bytes: b.files.reduce((n, f) => n + f.data.length, 0), sha256: b.bundleSha256, warnings: b.warnings };
  });
  console.log(JSON.stringify({ bundled: rows.length, skills: rows }, null, 2));
  return 0;
}

function cmdPlan(flags, internal) {
  const target = resolve(flags.target);
  if (!existsSync(target)) throw new Error("Target does not exist: " + target);
  const contract = skillInstallContract({ agent: flags.agent, skills: flags.skills });
  const root = bundleRoot(flags);
  const lock = loadLock(target);
  const rows = contract.resolved.map(id => {
    const bundle = readSkillBundle(id, root);
    const existing = lock.managed.find(r => r.agent === flags.agent && r.skill === id);
    const destDir = resolve(target, expectedDir(flags.agent, id));
    const conflicts = bundle.files
      .filter(f => existsSync(resolve(destDir, f.path)))
      .map(f => expectedDir(flags.agent, id) + "/" + f.path);
    return {
      skill: id, requested: contract.requested.includes(id),
      path: expectedDir(flags.agent, id), files: bundle.files.map(f => f.path),
      sha256: bundle.bundleSha256, alreadyManaged: Boolean(existing), conflicts, warnings: bundle.warnings
    };
  });
  const out = {
    status: "DRY_RUN", target: posixRel(relative(ROOT, target)) || ".",
    agent: flags.agent, directory: SKILL_DESTINATIONS[flags.agent],
    requested: contract.requested, resolved: contract.resolved,
    source: contract.source, installState: "DRY_RUN_ONLY",
    license: "UNLICENSED-PROPRIETARY", skillRuntime: "NOT_EXECUTED",
    skills: rows
  };
  if (!internal.silent) console.log(JSON.stringify(out, null, 2));
  return out;
}

function cmdInstall(flags, internal) {
  const plan = cmdPlan(flags, { silent: true });
  const target = resolve(flags.target);
  if (!flags.apply) { if (!internal.silent) console.log(JSON.stringify(plan, null, 2)); return plan; }
  const already = plan.skills.filter(s => s.alreadyManaged);
  if (already.length) throw new Error("Already managed; use update: " + already.map(s => s.skill).join(", "));
  const blocked = plan.skills.filter(s => s.conflicts.length);
  if (blocked.length) throw new Error("Overwrite forbidden; existing files at: " + blocked.flatMap(s => s.conflicts).join(", "));

  const root = bundleRoot(flags);
  const lockBefore = loadLock(target);
  const lockAfter = structuredClone(lockBefore);
  const entries = [];
  for (const row of plan.skills) {
    const bundle = readSkillBundle(row.skill, root);
    const dirRel = expectedDir(flags.agent, row.skill);
    const absDir = resolve(target, dirRel);
    for (const f of bundle.files) {
      const abs = resolve(absDir, f.path);
      denyLinks(abs, target);
      if (maybeStat(abs)) throw new Error("File appeared during install: " + abs);
      entries.push({ abs, before: null, after: f.sha256, data: f.data });
    }
    lockAfter.managed.push({
      agent: flags.agent, skill: row.skill, path: dirRel,
      files: bundle.files.map(f => ({ path: f.path, sha256: f.sha256 })),
      bundleSha256: bundle.bundleSha256,
      installedAt: new Date().toISOString()
    });
  }
  lockAfter.updatedAt = new Date().toISOString();
  const receipt = receiptFrom(target, "install", plan.skills.map(s => ({ agent: flags.agent, skill: s.skill })), entries.map(e => ({
    path: posixRel(relative(target, e.abs)), before: null, after: e.after
  })));
  const receiptPath = writeReceipt(target, receipt);
  try { applyEntries(target, entries, lockAfter); }
  catch (e) { rollbackEntries(target, receipt); throw e; }
  const out = summarize("FILES_INSTALLED_NOT_TESTED", target, plan.skills.map(s => ({ agent: flags.agent, skill: s.skill, path: s.path })), {
    receipt: receiptPath, note: "Files installed. Skills were not executed; runtime behavior is NOT_TESTED."
  });
  if (!internal.silent) console.log(JSON.stringify(out, null, 2));
  return out;
}

function cmdVerify(flags, internal) {
  const target = resolve(flags.target);
  const lock = loadLock(target);
  const rows = managedRows(lock, flags);
  if (!rows.length) { const out = { status: "NOT_INSTALLED", target, skills: [] }; if (!internal.silent) console.log(JSON.stringify(out, null, 2)); return out; }
  const results = rows.map(row => {
    const files = readManagedFiles(target, row);
    const known = new Set(row.files.map(f => f.path));
    const dir = resolve(target, row.path);
    const untracked = [];
    const walk = d => {
      let entries = [];
      try { entries = readdirSync(d, { withFileTypes: true }); } catch { return; }
      for (const e of entries) {
        const abs = join(d, e.name);
        if (e.isDirectory()) walk(abs);
        else {
          const rel = posixRel(relative(dir, abs));
          if (!known.has(rel)) untracked.push(rel);
        }
      }
    };
    if (existsSync(dir)) walk(dir);
    const states = files.map(f => ({ path: f.path, state: f.state }));
    const ok = states.every(s => s.state === "OK") && untracked.length === 0;
    return { agent: row.agent, skill: row.skill, path: row.path, ok, files: states, untracked };
  });
  const ok = results.every(r => r.ok);
  const out = { status: ok ? "VERIFIED_UNCHANGED" : "DRIFT_DETECTED", target, skills: results };
  if (!internal.silent) console.log(JSON.stringify(out, null, 2));
  return out;
}

function cmdUpdate(flags, internal) {
  const target = resolve(flags.target);
  const lockBefore = loadLock(target);
  const rows = managedRows(lockBefore, flags);
  if (!rows.length) throw new Error("Nothing managed matches the requested scope");
  const root = bundleRoot(flags);
  const entries = [];
  const changes = [];
  const lockAfter = structuredClone(lockBefore);
  for (const row of rows) {
    const current = readManagedFiles(target, row);
    const bad = current.filter(f => f.state !== "OK");
    if (bad.length) throw new Error("Refuse to update modified or missing managed files: " + bad.map(f => row.path + "/" + f.path + " (" + f.state + ")").join(", "));
    const bundle = readSkillBundle(row.skill, root);
    const dirAbs = resolve(target, row.path);
    const newByPath = new Map(bundle.files.map(f => [f.path, f]));
    for (const f of current) {
      if (!newByPath.has(f.path)) {
        entries.push({ abs: f.abs, before: { sha256: f.sha256, contentBase64: f.data.toString("base64") }, after: null, data: null });
        changes.push(row.path + "/" + f.path + " removed");
      }
    }
    for (const f of bundle.files) {
      const abs = resolve(dirAbs, f.path);
      denyLinks(abs, target);
      const existing = current.find(c => c.path === f.path);
      if (existing) {
        if (existing.sha256 === f.sha256) continue;
        entries.push({ abs, before: { sha256: existing.sha256, contentBase64: existing.data.toString("base64") }, after: f.sha256, data: f.data, replace: true });
        changes.push(row.path + "/" + f.path + " updated");
      } else {
        entries.push({ abs, before: null, after: f.sha256, data: f.data });
        changes.push(row.path + "/" + f.path + " added");
      }
    }
    const targetRow = lockAfter.managed.find(r => r.agent === row.agent && r.skill === row.skill);
    targetRow.files = bundle.files.map(f => ({ path: f.path, sha256: f.sha256 }));
    targetRow.bundleSha256 = bundle.bundleSha256;
    targetRow.updatedAt = new Date().toISOString();
    if (bundle.warnings.length) changes.push(row.skill + ": " + bundle.warnings.join("; "));
  }
  if (!entries.length) {
    const out = { status: "UP_TO_DATE", target, skills: rows.map(r => ({ agent: r.agent, skill: r.skill })) };
    if (!internal.silent) console.log(JSON.stringify(out, null, 2));
    return out;
  }
  if (!flags.apply) {
    const out = { status: "UPDATE_DRY_RUN", target, changes, skills: rows.map(r => ({ agent: r.agent, skill: r.skill })) };
    if (!internal.silent) console.log(JSON.stringify(out, null, 2));
    return out;
  }
  lockAfter.updatedAt = new Date().toISOString();
  const receipt = receiptFrom(target, "update", rows, entries.map(e => ({
    path: posixRel(relative(target, e.abs)),
    before: e.before,
    after: e.after
  })));
  const receiptPath = writeReceipt(target, receipt);
  try {
    for (const entry of entries) {
      if (entry.replace) {
        if (hash(readFileSync(entry.abs)) !== entry.before.sha256) throw new Error("Changed during update: " + entry.abs);
        unlinkSync(entry.abs);
      }
    }
    applyEntries(target, entries, lockAfter);
  } catch (e) { rollbackEntries(target, receipt); throw e; }
  const out = summarize("FILES_UPDATED_NOT_TESTED", target, rows, { receipt: receiptPath, changes });
  if (!internal.silent) console.log(JSON.stringify(out, null, 2));
  return out;
}

function cmdUninstall(flags, internal) {
  const target = resolve(flags.target);
  const lockBefore = loadLock(target);
  const rows = managedRows(lockBefore, flags);
  if (!rows.length) throw new Error("Not managed by Skill Kit: " + (flags.skills || "any"));
  const entries = [];
  for (const row of rows) {
    const files = readManagedFiles(target, row);
    const bad = files.filter(f => f.state !== "OK");
    if (bad.length) throw new Error("Refuse to uninstall modified or missing files: " + bad.map(f => row.path + "/" + f.path + " (" + f.state + ")").join(", "));
    for (const f of files) entries.push({ abs: f.abs, before: { sha256: f.sha256, contentBase64: f.data.toString("base64") }, after: null, data: null });
  }
  if (!flags.apply) {
    const out = { status: "UNINSTALL_DRY_RUN", target, skills: rows.map(r => ({ agent: r.agent, skill: r.skill, path: r.path })) };
    if (!internal.silent) console.log(JSON.stringify(out, null, 2));
    return out;
  }
  const lockAfter = structuredClone(lockBefore);
  const selected = new Set(rows.map(r => r.agent + ":" + r.skill));
  lockAfter.managed = lockAfter.managed.filter(r => !selected.has(r.agent + ":" + r.skill));
  lockAfter.updatedAt = new Date().toISOString();
  const receipt = receiptFrom(target, "uninstall", rows, entries.map(e => ({
    path: posixRel(relative(target, e.abs)), before: e.before, after: null
  })));
  const receiptPath = writeReceipt(target, receipt);
  try {
    for (const entry of entries) {
      if (hash(readFileSync(entry.abs)) !== entry.before.sha256) throw new Error("Changed during uninstall: " + entry.abs);
      unlinkSync(entry.abs);
    }
    for (const row of rows) pruneEmptyDirs(resolve(target, row.path), target);
    writeLock(target, lockAfter);
  } catch (e) { rollbackEntries(target, receipt); throw e; }
  const out = summarize("FILES_UNINSTALLED", target, rows, { receipt: receiptPath });
  if (!internal.silent) console.log(JSON.stringify(out, null, 2));
  return out;
}

function resolveReceiptPath(target, receipt) {
  const direct = resolve(target, receipt);
  if (existsSync(direct)) return direct;
  const rel = resolve(ROOT, receipt);
  if (existsSync(rel)) return rel;
  throw new Error("Receipt not found: " + receipt);
}

function rollbackEntries(target, receipt) {
  for (const entry of [...receipt.entries].reverse()) {
    const abs = resolve(target, entry.path);
    denyLinks(abs, target);
    const current = maybeStat(abs);
    if (entry.after === null) {
      if (current) throw new Error("Rollback refused; file should be absent: " + entry.path);
    } else {
      if (!current || hash(readFileSync(abs)) !== entry.after)
        throw new Error("Rollback refused; file changed since receipt: " + entry.path);
    }
  }
  for (const entry of [...receipt.entries].reverse()) {
    const abs = resolve(target, entry.path);
    if (entry.before === null) {
      if (maybeStat(abs)) unlinkSync(abs);
    } else {
      mkdirSync(dirname(abs), { recursive: true });
      const data = Buffer.from(entry.before.contentBase64, "base64");
      if (hash(data) !== entry.before.sha256) throw new Error("Receipt content hash mismatch: " + entry.path);
      writeFileSync(abs, data, { mode: 0o600 });
    }
  }
  writeLock(target, receipt.lockBefore);
}

function cmdRollback(flags, internal) {
  const target = resolve(flags.target);
  const file = resolveReceiptPath(target, flags.receipt);
  const receipt = JSON.parse(readFileSync(file, "utf8"));
  if (receipt.schemaVersion !== 1 || !Array.isArray(receipt.entries))
    throw new Error("Unsupported receipt");
  const out = { status: flags.apply ? "ROLLED_BACK" : "ROLLBACK_DRY_RUN", receipt: flags.receipt, operation: receipt.operation, entries: receipt.entries.length };
  if (!flags.apply) { if (!internal.silent) console.log(JSON.stringify(out, null, 2)); return out; }
  rollbackEntries(target, receipt);
  if (!internal.silent) console.log(JSON.stringify(out, null, 2));
  return out;
}

// ---------------------------------------------------------------- entry

export function run(argv = process.argv.slice(2), internal = {}) {
  const flags = parse(argv);
  if (flags.help) { if (!internal.silent) console.log(usage()); return { help: true }; }
  switch (flags.command) {
    case "list": return cmdList(flags);
    case "plan": return cmdPlan(flags, internal);
    case "install": return cmdInstall(flags, internal);
    case "verify": return cmdVerify(flags, internal);
    case "update": return cmdUpdate(flags, internal);
    case "uninstall": return cmdUninstall(flags, internal);
    case "rollback": return cmdRollback(flags, internal);
    default: throw new Error("Unknown command: " + flags.command);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = run();
    if (result?.status === "DRIFT_DETECTED") process.exitCode = 1;
  } catch (e) { console.error("ERROR: " + e.message); process.exitCode = 1; }
}
