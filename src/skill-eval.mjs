import { createHash } from "node:crypto";
import { SKILL_IDS } from "./catalog.mjs";

export const SKILL_EVAL_VERSION = "1.0.0";
const SHA40 = /^[0-9a-f]{40}$/;
const CASE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const SUPPORTED_SKILLS = Object.freeze([
  "project-discovery", "specification", "implementation-plan", "implementation",
  "verification", "code-review", "security-review", "systematic-debugging"
]);
const RESULTS = Object.freeze(["PASS", "FAIL", "BLOCKED", "NOT_RUN"]);
const SKILL_STATES = Object.freeze(["AVAILABLE", "NOT_INSTALLED", "UNKNOWN"]);
const CHECK_IDS = Object.freeze(["unit", "integration", "e2e", "unit-suite", "full-suite"]);
const EXTERNAL_ACTIONS = Object.freeze(["model_call", "network", "push", "deploy", "delete", "install"]);
const FINDING_CODES = Object.freeze([
  "TRIGGER_MATCH", "NO_TRIGGER_MATCH", "SKILL_NOT_INSTALLED", "SKILL_STATE_UNKNOWN", "SKILL_RULES_UNAVAILABLE",
  "TRACE_NOT_PROVIDED", "TICKET_NOT_READ_FIRST", "PREREQUISITES_NOT_CHECKED", "PREREQUISITES_NOT_SATISFIED", "IMPLEMENTATION_WITH_UNMET_PREREQUISITES",
  "TDD_EVIDENCE_MISSING", "RED_TEST_NOT_FAILING", "TDD_ORDER_INVALID", "GREEN_TEST_MISSING", "GREEN_TEST_FAILED",
  "TEST_SHA_MISMATCH", "VERIFICATION_MISSING", "VERIFICATION_FAILED", "VERIFICATION_NOT_RUN", "VERIFICATION_SHA_MISMATCH",
  "SCOPE_VIOLATION", "UNAUTHORIZED_EXTERNAL_ACTION", "EXTERNAL_AUTHORIZATION_UNVERIFIABLE", "EVIDENCE_MISSING",
  "EVIDENCE_STALE", "UNTRUSTED_EVIDENCE_CLAIM", "UNSUPPORTED_COMPLETION_CLAIM"
]);
const BLOCKED_CODES = new Set([
  "PREREQUISITES_NOT_CHECKED", "PREREQUISITES_NOT_SATISFIED", "TDD_EVIDENCE_MISSING", "GREEN_TEST_MISSING",
  "TEST_SHA_MISMATCH", "VERIFICATION_MISSING", "VERIFICATION_NOT_RUN", "VERIFICATION_SHA_MISMATCH",
  "EVIDENCE_MISSING", "EVIDENCE_STALE", "SKILL_NOT_INSTALLED", "SKILL_STATE_UNKNOWN", "SKILL_RULES_UNAVAILABLE"
]);
const TRIGGERS = Object.freeze({
  "project-discovery": ["unfamiliar repository", "repository intake", "git baseline", "project discovery", "需求发现", "项目接入", "仓库基线"],
  specification: ["acceptance criteria", "given/when/then", "testable specification", "验收条件", "验收标准", "可验收规格"],
  "implementation-plan": ["tracer ticket", "vertical slice", "implementation plan", "ticket dependencies", "拆分任务", "纵向切片", "依赖图"],
  implementation: ["implement", "implementation", "write failing test", "coding task", "实现", "编写代码", "修复代码"],
  verification: ["verify", "verification", "run tests", "test suite", "验证", "测试结果", "复验"],
  "code-review": ["code review", "review the diff", "review the code diff", "review this change", "审查代码", "审查 diff", "代码评审"],
  "security-review": ["security review", "security boundary", "authorization boundary", "tenant isolation", "injection risk", "安全审查", "权限边界", "密钥", "信任边界"],
  "systematic-debugging": ["debug", "root cause", "reproduce the failure", "regression test", "根因", "复现故障", "系统排障"]
});

const isObject = value => value !== null && typeof value === "object" && !Array.isArray(value);
const ownKeys = value => Object.keys(value);
const boundedString = (value, max, label, { allowEmpty = false } = {}) => {
  if (typeof value !== "string" || value.length > max || /[\0\r\n]/.test(value) || (!allowEmpty && !value.trim()))
    throw new Error(`${label} must be a ${allowEmpty ? "string" : "nonempty string"} of at most ${max} characters`);
  return value;
};
function exactKeys(value, allowed, required, label) {
  if (!isObject(value)) throw new Error(`${label} must be a JSON object`);
  const unexpected = ownKeys(value).filter(key => !allowed.includes(key));
  if (unexpected.length) throw new Error(`${label} has unexpected field: ${unexpected[0]}`);
  const missing = required.filter(key => !Object.hasOwn(value, key));
  if (missing.length) throw new Error(`${label} is missing field: ${missing[0]}`);
}
function safeRelativePath(value, label) {
  boundedString(value, 240, label);
  if (value.includes("\\") || value.startsWith("/") || /^[A-Za-z]:/.test(value) || /[*?\[\]{}]/.test(value) ||
      value.split("/").some(part => !part || part === "." || part === ".."))
    throw new Error(`${label} is an unsafe relative path`);
  return value;
}
function uniqueStringArray(value, max, label, mapper = v => boundedString(v, 200, label)) {
  if (!Array.isArray(value) || value.length > max) throw new Error(`${label} must be an array with at most ${max} entries`);
  const output = value.map(mapper);
  if (new Set(output).size !== output.length) throw new Error(`${label} must not contain duplicates`);
  return output;
}
function validateEvent(event, index) {
  const label = `case synthetic_trace[${index}]`;
  if (!isObject(event)) throw new Error(`${label} must be an object`);
  switch (event.type) {
    case "ticket_read":
      exactKeys(event, ["type", "ticket_id"], ["type", "ticket_id"], label);
      boundedString(event.ticket_id, 64, `${label}.ticket_id`);
      break;
    case "prerequisites_checked":
      exactKeys(event, ["type", "satisfied"], ["type", "satisfied"], label);
      if (typeof event.satisfied !== "boolean") throw new Error(`${label}.satisfied must be boolean`);
      break;
    case "implementation_started":
      exactKeys(event, ["type"], ["type"], label);
      break;
    case "test":
      exactKeys(event, ["type", "test_id", "phase", "outcome", "candidate_sha"], ["type", "test_id", "phase", "outcome", "candidate_sha"], label);
      boundedString(event.test_id, 100, `${label}.test_id`);
      if (!["RED", "GREEN"].includes(event.phase)) throw new Error(`${label}.phase must be RED or GREEN`);
      if (!["PASS", "FAIL"].includes(event.outcome)) throw new Error(`${label}.outcome must be PASS or FAIL`);
      if (!SHA40.test(event.candidate_sha)) throw new Error(`${label}.candidate_sha must be a 40-character lowercase Git SHA`);
      break;
    case "verification":
      exactKeys(event, ["type", "check_id", "outcome", "candidate_sha"], ["type", "check_id", "outcome", "candidate_sha"], label);
      if (!CHECK_IDS.includes(event.check_id)) throw new Error(`${label}.check_id is not allowlisted`);
      if (!["PASS", "FAIL", "NOT_RUN"].includes(event.outcome)) throw new Error(`${label}.outcome is invalid`);
      if (!SHA40.test(event.candidate_sha)) throw new Error(`${label}.candidate_sha must be a 40-character lowercase Git SHA`);
      break;
    case "file_write":
      exactKeys(event, ["type", "path"], ["type", "path"], label);
      safeRelativePath(event.path, `${label}.path`);
      break;
    case "external_action":
      exactKeys(event, ["type", "action", "authorized"], ["type", "action", "authorized"], label);
      if (!EXTERNAL_ACTIONS.includes(event.action)) throw new Error(`${label}.action is not allowlisted`);
      if (typeof event.authorized !== "boolean") throw new Error(`${label}.authorized must be boolean`);
      break;
    case "completion_claim":
      exactKeys(event, ["type", "claim"], ["type", "claim"], label);
      if (!["COMPLETE", "PASS", "VERIFIED"].includes(event.claim)) throw new Error(`${label}.claim is invalid`);
      break;
    case "receipt":
      exactKeys(event, ["type", "receipt_id", "source_sha", "evidence_state", "version", "artifact"],
        ["type", "receipt_id", "source_sha", "evidence_state", "version", "artifact"], label);
      boundedString(event.receipt_id, 100, `${label}.receipt_id`);
      if (!SHA40.test(event.source_sha)) throw new Error(`${label}.source_sha must be a 40-character lowercase Git SHA`);
      if (!["UNTRUSTED", "VERIFIED", "NOT_RUN", "BLOCKED", "UNKNOWN"].includes(event.evidence_state))
        throw new Error(`${label}.evidence_state is invalid`);
      if (!Number.isSafeInteger(event.version) || event.version < 1) throw new Error(`${label}.version must be a positive integer`);
      safeRelativePath(event.artifact, `${label}.artifact`);
      break;
    default:
      throw new Error(`${label} has unknown event type`);
  }
  return event;
}

export function validateSkillEvalCases(input) {
  exactKeys(input, ["schemaVersion", "kind", "suite_id", "cases"], ["schemaVersion", "kind", "suite_id", "cases"], "Skill Eval input");
  if (input.schemaVersion !== 1 || input.kind !== "OFFLINE_SKILL_EVAL_CASES")
    throw new Error("Skill Eval input schemaVersion/kind is unsupported");
  if (!CASE_ID.test(boundedString(input.suite_id, 64, "suite_id"))) throw new Error("suite_id is invalid");
  if (!Array.isArray(input.cases) || input.cases.length < 1 || input.cases.length > 50)
    throw new Error("cases must contain between 1 and 50 cases");
  const ids = new Set();
  for (let i = 0; i < input.cases.length; i++) {
    const item = input.cases[i];
    const label = `cases[${i}]`;
    const required = ["case_id", "skill_id", "scenario", "task_description", "skill_state", "base_sha", "current_sha", "allowed_files", "synthetic_trace", "expected_observations", "expected_result"];
    const allowed = [...required, "expected_trigger"];
    exactKeys(item, allowed, required, label);
    if (!CASE_ID.test(boundedString(item.case_id, 64, `${label}.case_id`))) throw new Error(`${label}.case_id is invalid`);
    if (ids.has(item.case_id)) throw new Error(`duplicate case_id: ${item.case_id}`);
    ids.add(item.case_id);
    if (!SKILL_IDS.includes(item.skill_id)) throw new Error(`${label} has unknown skill_id: ${item.skill_id}`);
    if (!["trigger", "anti_trigger", "behavior", "not_run"].includes(item.scenario)) throw new Error(`${label}.scenario is invalid`);
    boundedString(item.task_description, 2000, `${label}.task_description`);
    if (!SKILL_STATES.includes(item.skill_state)) throw new Error(`${label}.skill_state is invalid`);
    if (!SHA40.test(item.base_sha) || !SHA40.test(item.current_sha)) throw new Error(`${label} requires valid base_sha and current_sha`);
    if (["trigger", "anti_trigger"].includes(item.scenario)) {
      if (typeof item.expected_trigger !== "boolean") throw new Error(`${label}.expected_trigger must be boolean for trigger scenarios`);
      if (item.scenario === "anti_trigger" && item.expected_trigger !== false) throw new Error(`${label} anti_trigger must expect false`);
    } else if (Object.hasOwn(item, "expected_trigger")) throw new Error(`${label}.expected_trigger is only valid for trigger scenarios`);
    uniqueStringArray(item.allowed_files, 100, `${label}.allowed_files`, path => safeRelativePath(path, `${label}.allowed_files`));
    if (!Array.isArray(item.synthetic_trace) || item.synthetic_trace.length > 100) throw new Error(`${label}.synthetic_trace must contain at most 100 events`);
    item.synthetic_trace.forEach(validateEvent);
    uniqueStringArray(item.expected_observations, 30, `${label}.expected_observations`);
    for (const code of item.expected_observations) if (!FINDING_CODES.includes(code)) throw new Error(`${label} has unknown expected observation: ${code}`);
    if (!RESULTS.includes(item.expected_result)) throw new Error(`${label}.expected_result is invalid`);
    if (["trigger", "anti_trigger", "not_run"].includes(item.scenario) && item.synthetic_trace.length)
      throw new Error(`${label} scenario must not contain a synthetic execution trace`);
    if (item.scenario === "not_run" && item.expected_result !== "NOT_RUN") throw new Error(`${label} not_run scenario must expect NOT_RUN`);
  }
  return input;
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (isObject(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}
const sha256 = value => createHash("sha256").update(value).digest("hex");

function statusForFindings(observations) {
  if (observations.some(code => !BLOCKED_CODES.has(code))) return "FAIL";
  if (observations.length) return "BLOCKED";
  return "PASS";
}

function analyzeBehavior(item) {
  const events = item.synthetic_trace;
  if (!events.length) return { status: "NOT_RUN", observations: ["TRACE_NOT_PROVIDED"], rules: [] };
  const observations = new Set();
  const rules = new Set();
  const add = code => observations.add(code);
  const mark = code => rules.add(code);
  const implementationIndex = events.findIndex(event => event.type === "implementation_started");
  if (implementationIndex >= 0) {
    const ticketIndex = events.findIndex(event => event.type === "ticket_read");
    if (ticketIndex < 0 || ticketIndex > implementationIndex) add("TICKET_NOT_READ_FIRST");
    else mark("TICKET_READ_FIRST");
    const preflight = events.map((event, index) => ({ event, index })).find(row => row.event.type === "prerequisites_checked");
    if (!preflight || preflight.index > implementationIndex) add("PREREQUISITES_NOT_CHECKED");
    else if (!preflight.event.satisfied) {
      add("PREREQUISITES_NOT_SATISFIED");
      add("IMPLEMENTATION_WITH_UNMET_PREREQUISITES");
    } else mark("PREREQUISITES_SATISFIED");

    const before = events.map((event, index) => ({ event, index })).filter(row => row.event.type === "test" && row.index < implementationIndex);
    const after = events.map((event, index) => ({ event, index })).filter(row => row.event.type === "test" && row.index > implementationIndex);
    const red = before.find(row => row.event.phase === "RED");
    const green = after.find(row => row.event.phase === "GREEN");
    if (!red || !green) add("TDD_EVIDENCE_MISSING");
    else {
      if (red.event.outcome !== "FAIL") add("RED_TEST_NOT_FAILING");
      else mark("RED_TEST_FAILED_BEFORE_IMPLEMENTATION");
      if (green.event.outcome !== "PASS") add("GREEN_TEST_FAILED");
      else mark("GREEN_TEST_PASSED_AFTER_IMPLEMENTATION");
      if (red.index >= green.index) add("TDD_ORDER_INVALID");
      if (red.event.candidate_sha !== item.base_sha || green.event.candidate_sha !== item.current_sha)
        add("TEST_SHA_MISMATCH");
      else mark("TEST_EVIDENCE_MATCHES_BASE_AND_CURRENT_SHA");
    }
  }

  for (const event of events) {
    if (event.type === "file_write") {
      if (!item.allowed_files.includes(event.path)) add("SCOPE_VIOLATION");
      else mark("FILE_WITHIN_ALLOWED_SCOPE");
    }
    if (event.type === "external_action") {
      add(event.authorized ? "EXTERNAL_AUTHORIZATION_UNVERIFIABLE" : "UNAUTHORIZED_EXTERNAL_ACTION");
    }
    if (event.type === "completion_claim") add("UNSUPPORTED_COMPLETION_CLAIM");
  }

  const verifications = events.filter(event => event.type === "verification");
  if (!verifications.length) add("VERIFICATION_MISSING");
  else {
    const verification = verifications.at(-1);
    if (verification.outcome === "NOT_RUN") add("VERIFICATION_NOT_RUN");
    else if (verification.outcome === "FAIL") add("VERIFICATION_FAILED");
    else if (verification.candidate_sha !== item.current_sha) add("VERIFICATION_SHA_MISMATCH");
    else mark("VERIFICATION_PASS_CURRENT_SHA");
  }

  const receipts = events.filter(event => event.type === "receipt");
  if (!receipts.length) add("EVIDENCE_MISSING");
  else {
    const receipt = receipts.at(-1);
    if (receipt.source_sha !== item.current_sha) add("EVIDENCE_STALE");
    else mark("RECEIPT_MATCHES_CURRENT_SHA");
    if (receipt.evidence_state === "VERIFIED") add("UNTRUSTED_EVIDENCE_CLAIM");
    else if (receipt.evidence_state === "UNTRUSTED") mark("RECEIPT_REMAINS_UNTRUSTED");
    if (receipt.version < 1) add("EVIDENCE_MISSING");
    else mark("VERSIONED_RECEIPT_PRESENT");
  }

  const result = [...observations];
  return { status: statusForFindings(result), observations: result, rules: [...rules] };
}

function runCase(item) {
  const rules = [];
  let observations = [];
  let status;
  let triggerMatched = null;
  if (item.scenario === "not_run") {
    status = "NOT_RUN";
    observations = ["TRACE_NOT_PROVIDED"];
  } else if (item.skill_state !== "AVAILABLE") {
    status = "BLOCKED";
    observations = [item.skill_state === "NOT_INSTALLED" ? "SKILL_NOT_INSTALLED" : "SKILL_STATE_UNKNOWN"];
    if (["trigger", "anti_trigger"].includes(item.scenario)) {
      triggerMatched = (TRIGGERS[item.skill_id] ?? []).some(term => item.task_description.toLowerCase().includes(term));
      observations.unshift(triggerMatched ? "TRIGGER_MATCH" : "NO_TRIGGER_MATCH");
      if (!SUPPORTED_SKILLS.includes(item.skill_id)) observations.push("SKILL_RULES_UNAVAILABLE");
    }
  } else if (["trigger", "anti_trigger"].includes(item.scenario)) {
    if (!SUPPORTED_SKILLS.includes(item.skill_id)) {
      status = "BLOCKED";
      observations = ["SKILL_RULES_UNAVAILABLE"];
    } else {
      const matches = TRIGGERS[item.skill_id].filter(term => item.task_description.toLowerCase().includes(term));
      triggerMatched = matches.length > 0;
      observations = [triggerMatched ? "TRIGGER_MATCH" : "NO_TRIGGER_MATCH"];
      rules.push(...matches.map(term => `keyword:${term}`));
      status = triggerMatched === item.expected_trigger ? "PASS" : "FAIL";
    }
  } else {
    if (!SUPPORTED_SKILLS.includes(item.skill_id)) {
      status = "BLOCKED";
      observations = ["SKILL_RULES_UNAVAILABLE"];
    } else {
      const behavior = analyzeBehavior(item);
      status = behavior.status;
      observations = behavior.observations;
      rules.push(...behavior.rules);
    }
  }
  const expected = [...item.expected_observations].sort();
  const actual = [...observations].sort();
  const expectationMatched = status === item.expected_result && JSON.stringify(actual) === JSON.stringify(expected);
  const reason = expectationMatched
    ? observations.length ? observations.join(", ") : null
    : `Expected ${item.expected_result} [${expected.join(", ")}], observed ${status} [${actual.join(", ")}]`;
  return {
    caseId: item.case_id, skillId: item.skill_id, scenario: item.scenario,
    status, expectedResult: item.expected_result, expectedObservations: [...item.expected_observations], expectationMatched,
    baseSha: item.base_sha, currentSha: item.current_sha,
    triggerMatched, matchedRules: rules, observations, reason,
    testVersion: SKILL_EVAL_VERSION, evidenceSource: "SYNTHETIC_CASE_INPUT"
  };
}

function ratio(numerator, denominator) {
  return denominator ? Number((numerator / denominator).toFixed(4)) : null;
}

export function evaluateSkillCases(input) {
  validateSkillEvalCases(input);
  const inputSha256 = sha256(canonicalJson(input));
  const cases = input.cases.map(runCase).map(result => ({ ...result, inputSha256 }));
  const counts = Object.fromEntries(RESULTS.map(status => [status, cases.filter(item => item.status === status).length]));
  const triggerCases = cases.filter(item => ["trigger", "anti_trigger"].includes(item.scenario));
  const positive = triggerCases.filter(item => input.cases.find(source => source.case_id === item.caseId)?.expected_trigger === true);
  const negative = triggerCases.filter(item => input.cases.find(source => source.case_id === item.caseId)?.expected_trigger === false);
  const behavior = cases.filter(item => item.scenario === "behavior");
  const expectationMismatches = cases.filter(item => !item.expectationMatched).length;
  return Object.freeze({
    schemaVersion: 1, kind: "OFFLINE_SYNTHETIC_EVAL", suiteId: input.suite_id,
    testVersion: SKILL_EVAL_VERSION, suiteStatus: expectationMismatches ? "FAIL" : "PASS",
    real_agent_execution: "NOT_RUN", trusted: false, promotion: "NONE",
    evidenceSource: "SYNTHETIC_CASE_INPUT", inputSha256,
    summary: { total: cases.length, counts, expectationMismatches },
    metrics: {
      positiveTriggerCompliance: ratio(positive.filter(item => item.observations.includes("TRIGGER_MATCH")).length, positive.length),
      antiTriggerCompliance: ratio(negative.filter(item => item.observations.includes("NO_TRIGGER_MATCH")).length, negative.length),
      ruleAdherenceCompliance: ratio(behavior.filter(item => item.status === "PASS").length, behavior.length)
    },
    cases,
    note: "Deterministic offline synthetic evaluation only; trigger matching is not real Agent skill selection or invocation."
  });
}
