import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { ROUTE_SOPS, SKILL_IDS, STAGE_IDS, TYPES } from "../src/catalog.mjs";
import {
  ROUTE_PACK_IDS, ROUTE_PACKS, ROUTE_PACK_STATUS, routePackDocMarkdown, validateRoutePacks
} from "../src/route-packs.mjs";
import { renderRouteDocs } from "../tools/render-route-docs.mjs";

test("route packs validate against the canonical lifecycle", () => {
  assert.deepEqual(validateRoutePacks(), []);
  assert.deepEqual([...ROUTE_PACK_IDS].sort(), Object.keys(TYPES).sort());
});

test("every route pack maps all eleven stages in order without a second lifecycle", () => {
  for (const id of ROUTE_PACK_IDS) {
    const pack = ROUTE_PACKS[id];
    assert.equal(pack.stageFlow.length, STAGE_IDS.length);
    assert.deepEqual(pack.stageFlow.map(x => x.stage), STAGE_IDS);
    for (const item of [...pack.readiness, ...pack.negativeCases, ...pack.gatePlan])
      assert.ok(!("role" in item), "readiness and gates are not stages");
  }
});

test("gate plans cover every route SOP gate exactly once", () => {
  for (const id of ROUTE_PACK_IDS) {
    const pack = ROUTE_PACKS[id];
    const indexes = pack.gatePlan.map(g => g.gateIndex).sort((a, b) => a - b);
    assert.deepEqual(indexes, ROUTE_SOPS[id].gates.map((_, i) => i));
    assert.equal(new Set(indexes).size, ROUTE_SOPS[id].gates.length);
  }
});

test("skill emphasis partitions all known skills and keeps the implementation core", () => {
  for (const id of ROUTE_PACK_IDS) {
    const e = ROUTE_PACKS[id].skillEmphasis;
    const all = [...e.core, ...e.strengthen, ...e.reference];
    assert.equal(all.length, SKILL_IDS.length);
    assert.deepEqual([...new Set(all)].sort(), [...SKILL_IDS].sort());
    for (const required of ["implementation", "verification", "release-engineering"])
      assert.ok(e.core.includes(required), id + " core lacks " + required);
  }
});

test("each route carries its platform and compliance tokens", () => {
  const text = id => JSON.stringify(ROUTE_PACKS[id]);
  assert.match(text("saas"), /租户 B/);
  assert.match(text("saas"), /DPA/);
  assert.match(text("saas"), /DSAR/);
  assert.match(text("enterprise"), /UAT/);
  assert.match(text("enterprise"), /职责分离/);
  assert.match(text("enterprise"), /SCIM/);
  assert.match(text("mini-program"), /ICP/);
  assert.match(text("mini-program"), /requirePrivacyAuthorize/);
  assert.match(text("mini-program"), /内容安全/);
  assert.match(text("mini-program"), /虚拟支付/);
  assert.match(text("app"), /API 36/);
  assert.match(text("app"), /Data Safety/);
  assert.match(text("app"), /COPPA/);
});

test("route pack rendering is explicit about unexecuted evidence", () => {
  for (const id of ROUTE_PACK_IDS) {
    const markdown = routePackDocMarkdown(ROUTE_PACKS[id]);
    assert.equal(ROUTE_PACK_STATUS, "GENERATED_NOT_EXECUTED");
    assert.match(markdown, /GENERATED \/ NOT_RUN/);
    assert.match(markdown, /不是合规声明/);
    assert.match(markdown, /PREFLIGHT/);
    assert.doesNotMatch(markdown, /已满足|已合规|已通过审核/);
    assert.doesNotMatch(markdown, /undefined/);
  }
});

test("checked-in route docs are generated from the single source", async () => {
  const docs = renderRouteDocs();
  assert.equal(Object.keys(docs).length, ROUTE_PACK_IDS.length);
  for (const [name, expected] of Object.entries(docs)) {
    const actual = (await readFile(resolve(name), "utf-8")).replace(/\r\n/g, "\n");
    assert.equal(actual, expected, name + " drift; run npm run routes:docs");
  }
});
