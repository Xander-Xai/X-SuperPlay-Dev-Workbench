import test from "node:test";
import assert from "node:assert/strict";
import {readFile,stat,readdir} from "node:fs/promises";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {build,FILES} from "../tools/build-site.mjs";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
test("Pages artifact only has allowlisted browser files",async()=>{
  await build();
  for(const name of FILES) assert.ok((await stat(resolve(root,"dist",name))).isFile());
  assert.deepEqual((await readdir(resolve(root,"dist"))).sort(),
    [".nojekyll","index.html","src","styles.css"].sort());
  assert.deepEqual((await readdir(resolve(root,"dist/src"))).sort(),
    ["app.mjs","catalog.mjs","engine.mjs","install-contract.mjs","starter.mjs"].sort());
  const html=await readFile(resolve(root,"dist/index.html"),"utf8");
  assert.match(html,/Content-Security-Policy/);
  assert.doesNotMatch(html,/fonts\.googleapis\.com/);
});
