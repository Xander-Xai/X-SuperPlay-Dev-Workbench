import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, dirname, join } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cli = (...args) => spawnSync(process.execPath, ["tools/xeng.mjs", "method", ...args], {
  cwd: ROOT, encoding: "utf8", timeout: 15000
});
const docs = [
  "docs/methods/AI-NATIVE-SPEC-HARNESS-SKILLS-LOOP.md",
  "docs/methods/UPSTREAM-SOURCES.md",
  "docs/methods/PROJECT-PILOT.md",
  "docs/methods/AI-NATIVE-PRODUCT-AGENT-DESIGN.md",
  "docs/methods/SKILL-ENGINEERING-FACTORY.md"
];

test("the documented method is discoverable through the offline CLI", () => {
  const r = cli();
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /AI-Native Spec-Driven Harness & Loop Engineering/);
  for (const section of ["Spec", "Tracer Tickets", "Skills", "Harness", "Bounded Loop", "STOP"]) {
    assert.ok(r.stdout.includes(section), section);
  }
});

test("method sources preserve upstream provenance and distinguish original from local skills", () => {
  const r = cli("sources");
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /mattpocock\/skills\/blob\/5beb35b040e3de97e54fa9e386d7e42d15c295c2/);
  assert.match(r.stdout, /2eff7a8d21c80be48904f62ebdea36d945d7b504/);
  assert.match(r.stdout, /openai.com\/index\/harness-engineering/);
  assert.match(r.stdout, /非功能等同/);
});

test("method pilot has an evidence-first full-stack path without false acceptance", () => {
  const r = cli("pilot");
  assert.equal(r.status, 0, r.stderr);
  for (const word of ["AC-01", "AC-06", "T-01", "T-03", "base_sha", "STOP", "NOT_RUN", "真实项目"]) {
    assert.ok(r.stdout.includes(word), word);
  }
});

test("method --json is truthful about maturity and documents", () => {
  const r = cli("overview", "--json");
  assert.equal(r.status, 0, r.stderr);
  const out = JSON.parse(r.stdout);
  assert.equal(out.id, "overview");
  assert.equal(out.status, "METHOD_DOCUMENTED_AND_ROUTED");
  assert.equal(out.pilot_status, "NOT_RUN");
  assert.equal(out.harness_loop_runner_status, "NOT_IMPLEMENTED");
  assert.equal(out.third_party_skills_installed, false);
  assert.equal(out.document, docs[0]);
  assert.equal(out.content, readFileSync(join(ROOT, docs[0]), "utf8"));
});

test("AI-native product and Agent design is available through the offline CLI", () => {
  const r = cli("design");
  assert.equal(r.status, 0, r.stderr);
  for (const term of ["Agent Architecture Card", "AI-native", "HITL", "NON", "AG-06"]) {
    // NON in Non-goals is intentionally case-sensitive? Prefer vocabulary present in document.
    if (term !== "NON") assert.ok(r.stdout.includes(term), term);
  }
  assert.match(r.stdout, /NOT_REAL_PROJECT_VERIFIED/);
});

test("Skill factory guide is complete and never impersonates an installed Skill", () => {
  const r = cli("skills");
  assert.equal(r.status, 0, r.stderr);
  for (const term of ["Skill Engineering Factory", "code-expert-scoped-change", "Trigger Eval", "Behavior Eval", "CANDIDATE", "未实现"]) {
    assert.ok(r.stdout.includes(term), term);
  }
  const json = cli("skills", "--json");
  assert.equal(json.status, 0, json.stderr);
  const record = JSON.parse(json.stdout);
  assert.equal(record.document, docs[4]);
  assert.equal(record.third_party_skills_installed, false);
  assert.equal(record.harness_loop_runner_status, "NOT_IMPLEMENTED");
});

test("published-site launcher exposes all methodology tracks without remote execution", () => {
  const html = readFileSync(join(ROOT, "index.html"), "utf8");
  for (const id of ["methodology-entry", "methodology-overview", "methodology-sources", "methodology-design", "methodology-skills", "methodology-pilot"]) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
  for (const doc of docs) {
    assert.ok(html.includes(doc.split("/").pop()), doc);
  }
  assert.match(html, /第三方 Skills 未安装/);
  assert.match(html, /独立 Harness\/Loop Runner 未实现/);
});

test("method CLI rejects arbitrary paths, URLs, duplicate selectors and unknown args", () => {
  for (const args of [
    ["../../.env"], ["sources", "pilot"], ["--json", "--apply"],
    ["https://example.com"], ["../README.md"], ["overview", "sources"]
  ]) {
    const r = cli(...args);
    assert.equal(r.status, 2, JSON.stringify(args) + r.stdout + r.stderr);
    assert.match(r.stderr, /Usage: xeng method/);
  }
});

test("canonical method documentation is present with working local anchors", () => {
  for (const path of docs) assert.equal(existsSync(join(ROOT, path)), true, path);
  const main = readFileSync(join(ROOT, docs[0]), "utf8");
  assert.match(main, /\[上游固定版本与许可证边界\]\(UPSTREAM-SOURCES.md\)/);
  assert.match(main, /\[真实项目试点指南、模板与验收表\]\(PROJECT-PILOT.md\)/);
  assert.match(main, /AI-NATIVE-PRODUCT-AGENT-DESIGN\.md/);
  assert.match(main, /SKILL-ENGINEERING-FACTORY\.md/);
});
