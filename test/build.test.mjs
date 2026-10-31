import test from "node:test";
import assert from "node:assert/strict";
import {readFile,stat,readdir} from "node:fs/promises";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {build,FILES} from "../tools/build-site.mjs";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const BUILD_SHA="b".repeat(40);
test("Pages artifact only has allowlisted browser files",async()=>{
  process.env.GITHUB_SHA=BUILD_SHA;
  await build();
  for(const name of FILES) assert.ok((await stat(resolve(root,"dist",name))).isFile());
  assert.deepEqual((await readdir(resolve(root,"dist"))).sort(),
    [".nojekyll","index.html","src","styles.css"].sort());
  assert.deepEqual((await readdir(resolve(root,"dist/src"))).sort(),
    ["app.mjs","baseline.mjs","catalog.mjs","engine.mjs","evidence-identity.mjs","evidence.mjs","handoff.mjs","identity.mjs","install-contract.mjs","routing.mjs","starter.mjs","workspace.mjs"].sort());
  const html=await readFile(resolve(root,"dist/index.html"),"utf8");
  assert.match(html,/Content-Security-Policy/);
  assert.doesNotMatch(html,/fonts\.googleapis\.com/);
  assert.match(html,/name="workbench-commit" content="[0-9a-f]{40}"/);
  assert.ok(html.includes(BUILD_SHA));
  const catalog=await readFile(resolve(root,"dist","src","catalog.mjs"),"utf8");
  assert.ok(catalog.includes('buildSha: "'+BUILD_SHA+'"'));
});
