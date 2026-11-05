// Static Ticket preflight only. This module does not execute commands or claim
// that an owner approval, dependency receipt, or test command is authentic.
import { existsSync, lstatSync } from "node:fs";
import { resolve, join, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { normalizeAllowedCommand, normalizeRepoPath, normalizeTicketContract } from "./orchestration.mjs";

const HEX40 = /^[0-9a-f]{40}$/;
const UNSET = /^(UNSET|PENDING|NOT_RUN|UNKNOWN|TBD|TODO)/i;
const exactRepoPath = value => {
  const path = normalizeRepoPath(value);
  if (/[*?\[\]{}]/.test(path)) throw new Error("allowed_files must name exact paths, not globs: " + path);
  return path;
};

function inspectGit(target) {
  const git = args => spawnSync("git", ["-C", target, ...args], {
    encoding: "utf8", windowsHide: true, timeout: 5000
  });
  const root = git(["rev-parse", "--show-toplevel"]);
  if (root.status !== 0) throw new Error("target is not inside a readable Git repository");
  const gitRoot = resolve(root.stdout.trim());
  if (gitRoot !== target) throw new Error("target must be the Git repository root");
  const head = git(["rev-parse", "--verify", "HEAD"]);
  if (head.status !== 0 || !HEX40.test(head.stdout.trim())) throw new Error("Git HEAD is unavailable");
  const status = git(["status", "--porcelain", "--untracked-files=all"]);
  if (status.status !== 0) throw new Error("Git working tree status is unavailable");
  return { headSha: head.stdout.trim(), dirty: status.stdout.trim().length > 0 };
}

function inspectPath(target, relativePath, { mustExist = false } = {}) {
  const normalized = normalizeRepoPath(relativePath);
  const absolute = resolve(target, normalized.split("/").join(sep));
  if (absolute !== target && !absolute.startsWith(target + sep)) throw new Error("path escapes target: " + normalized);
  let current = target;
  for (const segment of normalized.split("/")) {
    current = join(current, segment);
    try {
      const stat = lstatSync(current);
      if (stat.isSymbolicLink()) throw new Error("symlink path is forbidden: " + normalized);
      if (current !== absolute && !stat.isDirectory()) throw new Error("non-directory path component: " + normalized);
      if (current === absolute && stat.isDirectory()) throw new Error("allowed path must identify a file, not a directory: " + normalized);
    } catch (error) {
      if (error.code === "ENOENT") break;
      throw error;
    }
  }
  if (mustExist && !existsSync(absolute)) throw new Error("evidence artifact is missing: " + normalized);
  if (mustExist && !lstatSync(absolute).isFile()) throw new Error("evidence artifact must be a regular file: " + normalized);
  return absolute;
}

function check(id, status, detail) { return { id, status, detail }; }
function placeholder(value) { return typeof value !== "string" || !value.trim() || UNSET.test(value.trim()); }
function numericBudget(value, allowZero = false) {
  if (typeof value !== "string" && typeof value !== "number") return false;
  const text = String(value).trim();
  if (!/^(?:\d+(?:\.\d+)?)(?:\s*(?:minutes?|mins?|hours?|hrs?|usd|dollars?|\$))?$/i.test(text)) return false;
  const amount = Number(text.match(/^\d+(?:\.\d+)?/)[0]);
  return Number.isFinite(amount) && (allowZero ? amount >= 0 : amount > 0);
}

function checkDependency(depId, byId, target, headSha, git) {
  const dependency = byId.get(depId);
  if (!dependency) return { status: "BLOCKED", detail: "missing dependency ticket " + depId };
  if (dependency.status !== "VERIFIED")
    return { status: "BLOCKED", detail: depId + " is not marked VERIFIED" };
  const evidence = dependency.execution_evidence;
  if (!evidence || typeof evidence !== "object")
    return { status: "BLOCKED", detail: depId + " has no execution_evidence receipt" };
  if (!HEX40.test(evidence.candidate_sha ?? "") || placeholder(evidence.command) ||
      evidence.exit_code !== 0 || placeholder(evidence.result) || placeholder(evidence.artifact))
    return { status: "BLOCKED", detail: depId + " has incomplete execution_evidence" };
  try {
    normalizeAllowedCommand(evidence.command);
    const artifact = inspectPath(target, evidence.artifact, { mustExist: true });
    const ancestor = git(["merge-base", "--is-ancestor", evidence.candidate_sha, headSha]);
    if (ancestor.status !== 0)
      return { status: "BLOCKED", detail: depId + " candidate_sha is not an ancestor of current HEAD" };
    if (!artifact) return { status: "BLOCKED", detail: depId + " evidence artifact is unavailable" };
  } catch (error) {
    return { status: "BLOCKED", detail: depId + " evidence rejected: " + error.message };
  }
  return { status: "CLAIMED_COMPLETE_UNTRUSTED", detail: depId + " has a structurally complete, untrusted execution receipt" };
}

export function validateTicketPreflight({ target, ticket, tickets = [ticket] } = {}) {
  if (typeof target !== "string" || !target.trim()) throw new Error("target is required");
  const repo = resolve(target);
  let gitState;
  try { gitState = inspectGit(repo); }
  catch (error) {
    return Object.freeze({
      schemaVersion: 1, kind: "TICKET_PREFLIGHT", status: "BLOCKED", ticketId: ticket?.ticket_id ?? null,
      target: repo, headSha: "UNKNOWN", harnessReady: false, execution: "NOT_RUN",
      checks: [check("git_repository", "BLOCKED", error.message)], blockers: [error.message], warnings: []
    });
  }

  let normalized;
  try { normalized = normalizeTicketContract(ticket); }
  catch (error) {
    const detail = "invalid ticket contract: " + error.message;
    return Object.freeze({
      schemaVersion: 1, kind: "TICKET_PREFLIGHT", status: "BLOCKED", ticketId: ticket?.ticket_id ?? null,
      target: repo, headSha: gitState.headSha, harnessReady: false, execution: "NOT_RUN",
      checks: [check("ticket_contract", "BLOCKED", detail)], blockers: [detail], warnings: []
    });
  }
  const checks = [], blockers = [], warnings = [];
  const add = (id, status, detail, blocking = false) => {
    checks.push(check(id, status, detail));
    if (blocking) blockers.push(detail);
  };

  add("git_head", normalized.base_sha === gitState.headSha ? "PASS" : "BLOCKED",
    normalized.base_sha === gitState.headSha
      ? "ticket base_sha matches current HEAD"
      : "base_sha mismatch: ticket=" + (normalized.base_sha ?? "UNSET") + " HEAD=" + gitState.headSha,
    normalized.base_sha !== gitState.headSha);
  add("working_tree", gitState.dirty ? "BLOCKED" : "PASS",
    gitState.dirty ? "working tree is dirty; freeze or re-establish the baseline" : "working tree is clean",
    gitState.dirty);

  const approvalOk = ticket?.approval_status === "APPROVED" &&
    typeof ticket?.approved_by === "string" && ticket.approved_by.trim().length > 0 &&
    typeof ticket?.approved_at === "string" && Number.isFinite(Date.parse(ticket.approved_at));
  add("owner_approval", approvalOk ? "DECLARED_UNVERIFIED" : "BLOCKED",
    approvalOk ? "ticket declares owner approval; identity/authenticity is not verified" : "explicit approval_status, approved_by, and approved_at are required",
    !approvalOk);

  const acValid = normalized.accepted_AC.length > 0 && normalized.accepted_AC.every(ac => !placeholder(ac));
  add("approved_ac", acValid ? "DECLARED_UNVERIFIED" : "BLOCKED",
    acValid ? normalized.accepted_AC.length + " acceptance criteria are declared; approval authenticity is not verified" : "accepted_AC must contain specific, non-placeholder acceptance criteria",
    !acValid);

  add("ticket_identity", normalized.ticket_id ? "PASS" : "BLOCKED",
    normalized.ticket_id ? "ticket_id is present" : "ticket_id is required before preflight",
    !normalized.ticket_id);
  add("spec_identity", normalized.spec_id && !placeholder(normalized.spec_id) ? "PASS" : "BLOCKED",
    normalized.spec_id && !placeholder(normalized.spec_id) ? "spec_id is present" : "spec_id is missing or a placeholder",
    !normalized.spec_id || placeholder(normalized.spec_id));

  let pathsOk = normalized.allowed_files.length > 0;
  const pathErrors = [];
  for (const value of normalized.allowed_files) {
    try { exactRepoPath(value); inspectPath(repo, value); }
    catch (error) { pathsOk = false; pathErrors.push(error.message); }
  }
  add("allowed_files", pathsOk ? "PASS" : "BLOCKED",
    pathsOk ? normalized.allowed_files.length + " exact in-repository paths; no glob patterns or symlink components" : (pathErrors.join("; ") || "allowed_files must contain at least one path"),
    !pathsOk);

  const commandsOk = normalized.allowed_commands.length > 0;
  const commandErrors = [];
  for (const command of normalized.allowed_commands) {
    try { normalizeAllowedCommand(command); } catch (error) { commandErrors.push(error.message); }
  }
  const testCommand = normalized.allowed_commands.find(command => /\b(test|check|lint|typecheck|pytest|vitest|playwright|jest|mocha|cargo test|go test)\b/i.test(command));
  const commandContractOk = commandsOk && commandErrors.length === 0;
  add("allowed_commands", commandContractOk ? "PASS" : "BLOCKED",
    commandContractOk ? normalized.allowed_commands.length + " command strings pass syntax safety checks; none will be executed" : (commandErrors.join("; ") || "allowed_commands must not be empty"),
    !commandContractOk);
  add("test_entrypoint", testCommand ? "DECLARED_NOT_VERIFIED" : "BLOCKED",
    testCommand ? "declared test command: " + testCommand + " (not executed or trusted)" : "a test command or check command (test/lint/typecheck) must be declared; this does not prove it is usable",
    !testCommand);

  const budgetsValid = Number.isInteger(normalized.iteration_budget.maxAttemptsPerTicket) && normalized.iteration_budget.maxAttemptsPerTicket > 0 &&
    Number.isInteger(normalized.iteration_budget.maxReviewFixRounds) && normalized.iteration_budget.maxReviewFixRounds > 0 &&
    numericBudget(normalized.time_budget, false) && numericBudget(normalized.external_cost_budget, true) && normalized.stop_conditions.length > 0;
  add("budgets_and_stop_conditions", budgetsValid ? "PASS" : "BLOCKED",
    budgetsValid ? "positive iteration/review budgets, time/cost budget declarations, and stop conditions are present" : "positive iteration/review budgets, explicit time/cost budgets, and stop_conditions are required",
    !budgetsValid);

  const set = Array.isArray(tickets) ? tickets : [];
  const byId = new Map();
  let duplicateTicketIds = false;
  for (const row of set) if (row && typeof row.ticket_id === "string") {
    if (byId.has(row.ticket_id)) {
      duplicateTicketIds = true;
      warnings.push("duplicate ticket-set id: " + row.ticket_id);
    }
    byId.set(row.ticket_id, row);
  }
  add("ticket_set", duplicateTicketIds ? "BLOCKED" : "PASS",
    duplicateTicketIds ? "ticket set contains duplicate ticket_id values" : set.length + " ticket records indexed",
    duplicateTicketIds);
  const git = args => spawnSync("git", ["-C", repo, ...args], { encoding: "utf8", windowsHide: true, timeout: 5000 });
  const dependencyResults = normalized.blocked_by.map(id => ({ ticketId: id, ...checkDependency(id, byId, repo, gitState.headSha, git) }));
  const dependenciesOk = dependencyResults.every(dep => dep.status === "CLAIMED_COMPLETE_UNTRUSTED");
  add("blocked_by", dependenciesOk ? "CLAIMED_COMPLETE_UNTRUSTED" : normalized.blocked_by.length ? "BLOCKED" : "PASS",
    normalized.blocked_by.length
      ? dependencyResults.map(dep => dep.ticketId + ": " + dep.detail).join("; ")
      : "no blocking tickets declared",
    normalized.blocked_by.length > 0 && !dependenciesOk);
  if (dependencyResults.some(dep => dep.status === "CLAIMED_COMPLETE_UNTRUSTED"))
    warnings.push("dependency receipts are structural claims only; no signer or execution runtime is verified");

  warnings.push("Preflight validates declarations and repository state only; it does not create a runtime file/command sandbox.");
  warnings.push("No ticket command was executed; Harness readiness remains false until a trusted test runner and execution evidence exist.");
  const status = blockers.length ? "BLOCKED" : "PREFLIGHT_CLEAR_NOT_HARNESS_READY";
  return Object.freeze({
    schemaVersion: 1, kind: "TICKET_PREFLIGHT", status, ticketId: normalized.ticket_id,
    target: repo, headSha: gitState.headSha, harnessReady: false, execution: "NOT_RUN",
    checks, blockers, warnings, dependencies: dependencyResults,
    commandPolicy: { declared: normalized.allowed_commands, executed: [], enforcement: "STATIC_PREFLIGHT_ONLY" },
    note: "A clear preflight is not permission enforcement, command execution, or verified completion."
  });
}
