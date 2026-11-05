import { createHash, randomUUID } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import { lstat, open, realpath, readFile, rename, unlink } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { relative, isAbsolute, sep, join, resolve } from "node:path";
import { normalizeTicketContract } from "./orchestration.mjs";
import { validateTicketPreflight } from "./ticket-preflight.mjs";
import { identityChain } from "./evidence-identity.mjs";

export const FIXTURE_COMMAND = "xeng-fixture-test:sandbox-smoke-v1";
export const FIXTURE_PATH = "test/fixtures/sandbox-smoke.json";
export const FIXTURE_PAYLOAD = Object.freeze({ schemaVersion: 1, expected: "isolated" });
const MAX_OUTPUT_BYTES = 8192;
const MAX_INPUT_BYTES = 1024;
const SANDBOX_TIMEOUT_MS = 20_000;
const EXPECTED_LIMITS = Object.freeze({
  addressSpaceBytes: [268435456, 268435456], cpuSeconds: [10, 10], processes: [16, 16],
  fileBytes: [1048576, 1048576], openFiles: [64, 64]
});
const PYTHON_SMOKE = [
  "import json, os, platform, resource, socket, sys",
  "payload = json.loads(sys.argv[1])",
  "assert payload == {'schemaVersion': 1, 'expected': 'isolated'}",
  "assert os.getuid() == 65534 and os.getgid() == 65534",
  "assert os.getpid() < 16",
  "assert all(k in {'PATH', 'PWD', 'LC_CTYPE'} for k in os.environ)",
  "assert socket.if_nameindex() == [(1, 'lo')]",
  "assert not os.path.exists('/mnt/c') and not os.path.exists('/run')",
  "status = open('/proc/self/status').read()",
  "assert 'NoNewPrivs:\\t1' in status",
  "limits = {'addressSpaceBytes': list(resource.getrlimit(resource.RLIMIT_AS)), 'cpuSeconds': list(resource.getrlimit(resource.RLIMIT_CPU)), 'processes': list(resource.getrlimit(resource.RLIMIT_NPROC)), 'fileBytes': list(resource.getrlimit(resource.RLIMIT_FSIZE)), 'openFiles': list(resource.getrlimit(resource.RLIMIT_NOFILE))}",
  "assert limits == {'addressSpaceBytes': [268435456, 268435456], 'cpuSeconds': [10, 10], 'processes': [16, 16], 'fileBytes': [1048576, 1048576], 'openFiles': [64, 64]}",
  "try:",
  "    open('/usr/xeng-write-probe', 'w').close()",
  "    raise AssertionError('runtime mount unexpectedly writable')",
  "except OSError as error:",
  "    assert error.errno in (1, 13, 30)",
  "print(json.dumps({'fixture': 'sandbox-smoke-v1', 'result': 'PASS', 'uid': os.getuid(), 'network_interfaces': ['lo'], 'host_mount_visible': False, 'runtime_read_only': True, 'no_new_privs': True, 'kernel': platform.release(), 'python': platform.python_version(), 'resource_limits': limits}))"
].join("\n");

const hash = value => createHash("sha256").update(value).digest("hex");
function sealReceipt(receipt) {
  const body = JSON.stringify(receipt);
  return {
    ...receipt,
    receiptIntegrity: { schemaVersion: 1, algorithm: "sha256", digest: hash(body) }
  };
}

export function verifyTicketReceiptIntegrity(receipt) {
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt) ||
      receipt.receiptIntegrity?.schemaVersion !== 1 || receipt.receiptIntegrity?.algorithm !== "sha256" ||
      !/^[0-9a-f]{64}$/.test(receipt.receiptIntegrity?.digest ?? ""))
    return Object.freeze({ valid: false, reason: "INTEGRITY_METADATA_INVALID" });
  const { receiptIntegrity, ...body } = receipt;
  const valid = hash(JSON.stringify(body)) === receiptIntegrity.digest;
  return Object.freeze({ valid, reason: valid ? "INTEGRITY_MATCH" : "INTEGRITY_MISMATCH" });
}

async function writeReceiptAtomically(file, receipt) {
  const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`;
  let handle;
  try {
    handle = await open(temporary, fsConstants.O_CREAT | fsConstants.O_EXCL | fsConstants.O_WRONLY, 0o600);
    await handle.writeFile(JSON.stringify(sealReceipt(receipt), null, 2) + "\n", "utf8");
    await handle.sync();
    await handle.close();
    handle = null;
    await rename(temporary, file);
  } finally {
    if (handle) await handle.close().catch(() => {});
    await unlink(temporary).catch(error => { if (error.code !== "ENOENT") throw error; });
  }
}

const repoPath = (target, rel) => resolve(target, rel.split("/").join(sep));
const inside = (parent, child) => {
  const rel = relative(parent, child);
  return rel === "" || (rel !== ".." && !rel.startsWith(".." + sep) && !isAbsolute(rel));
};

function wslSandboxArgs(payloadText) {
  const code = `${PYTHON_SMOKE}\n`;
  return [
    "-d", "Ubuntu-22.04", "-u", "root", "--", "/usr/bin/bwrap",
    "--unshare-user", "--unshare-pid", "--unshare-net", "--unshare-ipc", "--unshare-uts", "--unshare-cgroup",
    "--die-with-parent", "--new-session",
    "--ro-bind", "/usr", "/usr", "--ro-bind", "/bin", "/bin",
    "--ro-bind", "/lib", "/lib", "--ro-bind", "/lib64", "/lib64",
    "--proc", "/proc", "--dev", "/dev", "--dir", "/tmp", "--clearenv",
    "--setenv", "PATH", "/usr/bin:/bin", "--uid", "65534", "--gid", "65534", "--cap-drop", "ALL",
    "--", "/usr/bin/setpriv", "--no-new-privs", "--",
    "/usr/bin/prlimit", "--as=268435456", "--cpu=10", "--nproc=16", "--fsize=1048576", "--nofile=64", "--",
    "/usr/bin/python3", "-I", "-c", code, payloadText
  ];
}

function budgetTimeoutMs(value) {
  const match = String(value ?? "").trim().match(/^(\d+(?:\.\d+)?)(?:\s*(minutes?|mins?|hours?|hrs?))?$/i);
  if (!match) return SANDBOX_TIMEOUT_MS;
  const amount = Number(match[1]);
  const unit = (match[2] ?? "minutes").toLowerCase();
  const multiplier = unit.startsWith("h") ? 3_600_000 : 60_000;
  return Math.max(1, Math.min(SANDBOX_TIMEOUT_MS, Math.floor(amount * multiplier)));
}

function classifyResult(execution) {
  if (execution.error?.code === "ETIMEDOUT") return "TIMEOUT";
  if (execution.error?.code === "ENOBUFS") return "OUTPUT_LIMIT";
  if (execution.status === 0) return "PASSED";
  if (execution.status === 127 || /bwrap:|Operation not permitted|No such file|setgroups failed|There is no distribution|WSL_E_|not recognized as an internal|The system cannot find/i.test(execution.stderr ?? ""))
    return "BLOCKED_ISOLATION_UNAVAILABLE";
  return "FAILED";
}

export function classifyFixtureOutcome(execution, sandboxReport) {
  const lowLevelStatus = classifyResult(execution);
  const sandboxOk = lowLevelStatus === "PASSED" && sandboxReport?.fixture === "sandbox-smoke-v1" && sandboxReport?.result === "PASS" &&
    sandboxReport?.uid === 65534 && sandboxReport?.host_mount_visible === false && sandboxReport?.runtime_read_only === true &&
    sandboxReport?.no_new_privs === true && JSON.stringify(sandboxReport?.resource_limits) === JSON.stringify(EXPECTED_LIMITS);
  const status = sandboxOk ? "PASSED_UNTRUSTED_FIXTURE" : lowLevelStatus === "PASSED" ? "BLOCKED_SANDBOX_ASSERTION" : lowLevelStatus;
  const executionState = sandboxOk ? "COMPLETED" : ["BLOCKED_ISOLATION_UNAVAILABLE", "PASSED"].includes(lowLevelStatus) ? "BLOCKED" :
    ["TIMEOUT", "OUTPUT_LIMIT"].includes(lowLevelStatus) ? "TERMINATED" : "COMPLETED";
  return Object.freeze({
    status, execution: executionState,
    sandboxStatus: sandboxOk ? "CAPABILITIES_ASSERTED_BY_FIXTURE" : "BLOCKED",
    passed: sandboxOk, lowLevelStatus
  });
}

async function pathExists(path) {
  try { await lstat(path); return true; }
  catch (error) { if (error.code === "ENOENT") return false; throw error; }
}

async function reserveReceipt(evidenceDir, target, ticketId, baseSha) {
  const requestedDir = resolve(evidenceDir);
  const dir = await realpath(requestedDir);
  const repo = await realpath(target);
  if (dir !== requestedDir) throw new Error("evidence directory path must not contain symlinks");
  if (inside(repo, dir)) throw new Error("evidence directory must be outside the target repository");
  const stat = await lstat(dir);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error("evidence directory must be a real directory, not a symlink");
  const file = join(dir, `${ticketId}-${baseSha}.json`);
  const lockPath = `${file}.lock`;
  if (await pathExists(file)) throw Object.assign(new Error("receipt already exists"), { code: "EEXIST" });
  let handle;
  try { handle = await open(lockPath, fsConstants.O_CREAT | fsConstants.O_EXCL | fsConstants.O_WRONLY, 0o600); }
  catch (error) {
    if (error.code === "EEXIST") throw Object.assign(new Error("a prior execution reservation exists; it may be active or interrupted"), { code: "EINPROGRESS" });
    throw error;
  }
  if (await pathExists(file)) {
    await handle.close();
    await unlink(lockPath).catch(() => {});
    throw Object.assign(new Error("receipt already exists"), { code: "EEXIST" });
  }
  return { file, lockPath, handle };
}

/** Run only the Workbench's fixed synthetic smoke test in a WSL2 bubblewrap sandbox. */
export async function runTicketFixture({ target, ticket, tickets = [ticket], execute = false, confirmReviewed = false, evidenceDir } = {}) {
  if (typeof target !== "string" || !target.trim()) throw new Error("target is required");
  const repo = resolve(target);
  const contract = normalizeTicketContract(ticket);
  const timeoutMs = budgetTimeoutMs(contract.time_budget);
  const preflight = validateTicketPreflight({ target: repo, ticket, tickets });
  const ticketSha256 = hash(JSON.stringify(ticket));
  const response = {
    schemaVersion: 1, kind: "TICKET_FIXTURE_RUN", status: "DRY_RUN",
    ticketId: contract.ticket_id, specId: contract.spec_id, baseSha: preflight.headSha,
    inputIdentity: { ticketId: contract.ticket_id, specId: contract.spec_id, baseSha: preflight.headSha, ticketSha256 },
    execution: "NOT_RUN", harnessReady: false, preflight,
    commandPolicy: { declared: contract.allowed_commands, executedArgv: [], enforcement: "FIXED_FIXTURE_ARGV_ONLY" },
    sandbox: { backend: "WSL2_BUBBLEWRAP", status: "NOT_PROBED", limits: { wallClockMs: timeoutMs, maxSandboxWallClockMs: SANDBOX_TIMEOUT_MS, outputBytes: MAX_OUTPUT_BYTES, addressSpaceBytes: 268435456, cpuSeconds: 10, processesPerUid: 16, fileBytes: 1048576 } },
    evidence: null,
    note: "Dry-run only. A live run executes a fixed synthetic smoke test, not Ticket code; its receipt remains untrusted."
  };
  if (preflight.status !== "PREFLIGHT_CLEAR_NOT_HARNESS_READY") {
    response.status = "BLOCKED_PREFLIGHT";
    return response;
  }
  if (ticket?.blocked_by?.length) {
    response.status = "BLOCKED_DEPENDENCY_UNTRUSTED";
    response.note = "The fixture runner refuses dependency declarations because preflight receipts are untrusted claims.";
    return response;
  }
  if (contract.allowed_commands.length !== 1 || contract.allowed_commands[0] !== FIXTURE_COMMAND) {
    response.status = "BLOCKED_COMMAND_NOT_ALLOWLISTED";
    response.note = "Only the exact built-in fixture command is executable; Ticket command strings are never parsed or launched.";
    return response;
  }
  if (contract.allowed_files.length !== 1 || contract.allowed_files[0] !== FIXTURE_PATH) {
    response.status = "BLOCKED_FILE_SCOPE";
    response.note = "The synthetic runner accepts only its one exact fixture input path.";
    return response;
  }
  if (contract.iteration_budget.maxAttemptsPerTicket !== 1 || Number(String(contract.external_cost_budget).replace(/[^0-9.]/g, "")) !== 0) {
    response.status = "BLOCKED_BUDGET";
    response.note = "Fixture execution requires one attempt and a zero external-cost budget.";
    return response;
  }
  if (!execute) return response;
  if (!confirmReviewed) throw new Error("--execute requires --confirm-reviewed after reviewing the target and synthetic-only execution boundary");
  if (process.platform !== "win32") {
    response.status = "BLOCKED_PLATFORM_UNSUPPORTED";
    response.sandbox.status = "BLOCKED";
    response.note = "Only the Windows-to-WSL2 backend is implemented; native WSL invocation is not available from this host.";
    return response;
  }
  if (!evidenceDir) throw new Error("--execute requires --evidence-dir outside the target repository");

  let reservation;
  try { reservation = await reserveReceipt(resolve(evidenceDir), repo, contract.ticket_id, preflight.headSha); }
  catch (error) {
    response.status = error.code === "EEXIST" ? "BLOCKED_DUPLICATE_EXECUTION" : error.code === "EINPROGRESS" ? "BLOCKED_PRIOR_RUN_INCOMPLETE" : "BLOCKED_EVIDENCE_PATH";
    response.note = error.code === "EEXIST"
      ? "A receipt already exists for this Ticket and base SHA; repeated execution is blocked."
      : error.code === "EINPROGRESS"
        ? "A prior reservation exists; the run may still be active or may have been interrupted. Manual review is required; automatic recovery is disabled."
        : error.message;
    return response;
  }
  const { file: receiptPath, lockPath, handle } = reservation;
  const startedAt = new Date().toISOString();
  response.receiptPath = receiptPath;
  response.receiptReference = { schemaVersion: 1, evidenceVersion: 1, path: receiptPath, integrityAlgorithm: "sha256" };
  const running = { ...response, status: "RUNNING", execution: "RUNNING", startedAt,
    evidence: { trusted: false, evidenceState: "UNTRUSTED", promotion: "NONE" } };
  try {
    await handle.writeFile(JSON.stringify(running, null, 2) + "\n", "utf8");
    await handle.sync();
    const fixturePath = repoPath(repo, FIXTURE_PATH);
    const fixtureStat = await lstat(fixturePath);
    if (!fixtureStat.isFile() || fixtureStat.isSymbolicLink()) {
      response.status = "BLOCKED_FIXTURE_INPUT";
      response.note = "Fixture input must be a regular, non-symlink file.";
      return response;
    }
    const fixtureBytes = await readFile(fixturePath);
    if (fixtureBytes.length > MAX_INPUT_BYTES) {
      response.status = "BLOCKED_FIXTURE_INPUT";
      response.note = `Fixture JSON exceeds the ${MAX_INPUT_BYTES}-byte input cap.`;
      return response;
    }
    let payload;
    try { payload = JSON.parse(fixtureBytes.toString("utf8")); }
    catch { response.status = "BLOCKED_FIXTURE_INPUT"; response.note = "Fixture JSON is invalid."; return response; }
    if (JSON.stringify(payload) !== JSON.stringify(FIXTURE_PAYLOAD)) {
      response.status = "BLOCKED_FIXTURE_INPUT";
      response.note = "Fixture JSON does not match the exact synthetic smoke-test schema and value.";
      return response;
    }
    const afterRead = await lstat(fixturePath);
    if (fixtureStat.dev !== afterRead.dev || fixtureStat.ino !== afterRead.ino || fixtureStat.size !== afterRead.size || fixtureStat.mtimeMs !== afterRead.mtimeMs) {
      response.status = "BLOCKED_FIXTURE_RACE";
      response.note = "Fixture changed during snapshot validation.";
      return response;
    }
    const executable = process.env.SystemRoot ? join(process.env.SystemRoot, "System32", "wsl.exe") : "wsl.exe";
    const safeEnv = { SystemRoot: process.env.SystemRoot ?? "C:\\Windows", WINDIR: process.env.WINDIR ?? "C:\\Windows", PATH: process.env.PATH ?? "" };
    const args = wslSandboxArgs(fixtureBytes.toString("utf8"));
    response.commandPolicy.executedArgv = [executable, ...args];
    const execution = spawnSync(executable, args, {
      cwd: repo, env: safeEnv, encoding: "utf8", timeout: timeoutMs,
      maxBuffer: MAX_OUTPUT_BYTES, windowsHide: true, shell: false
    });
    const stdout = (execution.stdout ?? "").slice(0, MAX_OUTPUT_BYTES);
    const stderr = (execution.stderr ?? "").slice(0, MAX_OUTPUT_BYTES);
    let sandboxReport = null;
    try { sandboxReport = JSON.parse(stdout.trim()); } catch {}
    const outcome = classifyFixtureOutcome(execution, sandboxReport);
    response.status = outcome.status;
    response.execution = outcome.execution;
    response.sandbox.status = outcome.sandboxStatus;
    response.sandbox.report = sandboxReport;
    response.evidence = {
      version: 1, trusted: false, evidenceState: "UNTRUSTED", promotion: "NONE", ticketId: contract.ticket_id,
      specId: contract.spec_id, gitSha: preflight.headSha, ticketSha256, receiptPath,
      identityChain: identityChain([
        { kind: "reviewed_candidate", algorithm: "sha256", digest: ticketSha256, sourceCommit: preflight.headSha, locator: `ticket:${contract.ticket_id}` },
        { kind: "built_artifact", algorithm: "sha256", digest: hash(fixtureBytes), sourceCommit: preflight.headSha, locator: FIXTURE_PATH }
      ], { sourceCommit: preflight.headSha }),
      fixtureSha256: hash(fixtureBytes), command: [executable, ...args], exitCode: execution.status,
      signal: execution.signal ?? null, result: outcome.passed ? "PASS" : response.status,
      environment: { host: "Windows", backend: "WSL2 Ubuntu-22.04", node: process.version, kernel: sandboxReport?.kernel ?? null, python: sandboxReport?.python ?? null },
      log: { stdout, stderr, stdoutSha256: hash(stdout), stderrSha256: hash(stderr), truncated: Boolean(execution.error?.code === "ENOBUFS") },
      startedAt, finishedAt: new Date().toISOString(), stopReason: outcome.passed ? "FIXTURE_COMPLETED" : execution.error?.code ?? "SANDBOX_ASSERTION_FAILED"
    };
    response.receiptPath = receiptPath;
    response.note = "Only a fixed synthetic sandbox smoke test ran. This is not product Dogfood, arbitrary Ticket execution, or VERIFIED evidence.";
    return response;
  } catch (error) {
    response.status = "FAILED_RUNNER_INTERNAL";
    response.execution = "FAILED";
    response.note = "Runner failed before it could record a normal outcome; the durable lock remains for manual recovery.";
    response.failure = { code: error?.code ?? "RUNNER_EXCEPTION", message: String(error?.message ?? "unknown error").slice(0, 500) };
    response.evidence = {
      version: 1, trusted: false, evidenceState: "UNTRUSTED", promotion: "NONE",
      ticketId: contract.ticket_id, specId: contract.spec_id, gitSha: preflight.headSha,
      ticketSha256, receiptPath, result: "FAILED_RUNNER_INTERNAL", stopReason: "RUNNER_EXCEPTION"
    };
    return response;
  } finally {
    try {
      await writeReceiptAtomically(receiptPath, response);
      await handle.close();
      await unlink(lockPath);
    } catch (error) {
      await handle.close().catch(() => {});
      throw error;
    }
  }
}
