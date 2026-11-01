import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {STAGES} from "../src/catalog.mjs";
import {IDS,BRANCHES,validateGuide,validateHost,validateLinks,auditProductDocs} from "../tools/product-doc-check.mjs";
const BT=String.fromCharCode(96);
test("14 guides have all 11 stages, real Skill IDs, host branches and valid local links",async()=>{
  assert.equal(IDS.length,14);
  assert.equal(Object.values(BRANCHES).flat().length,14);
  assert.equal(STAGES.length,11);
  assert.deepEqual(await auditProductDocs(),[]);
});
test("missing review stage cannot pass",async()=>{
  const s=await readFile(resolve("docs/product-types/desktop.md"),"utf8");
  const lines=s.split("\n").filter(x=>!x.startsWith("| "+BT+"review"+BT+" "));
  assert.match(validateGuide("desktop",lines.join("\n")).join("\n"),/expected 11 canonical rows/);
});
test("unknown Skill cannot pass",async()=>{
  const s=await readFile(resolve("docs/product-types/pwa.md"),"utf8");
  assert.match(validateGuide("pwa",s.replace(BT+"verification"+BT+"（输入：",BT+"bad-skill"+BT+"（输入：")).join("\n"),/unknown Skill bad-skill/);
});
test("missing real Gate and host link cannot pass",async()=>{
  const s=await readFile(resolve("docs/product-types/bot.md"),"utf8");
  const broken=s.replace("**真实平台 Gate**","missing").replace("platforms/bot/dingtalk.md","platforms/bot/not-found.md");
  const errs=validateGuide("bot",broken).join("\n");
  assert.match(errs,/真实平台 Gate/);
  assert.match(errs,/missing host link dingtalk/);
});
test("host guides require first ticket, source and own parent link",async()=>{
  const s=await readFile(resolve("docs/product-types/platforms/bot/slack.md"),"utf8");
  assert.deepEqual(validateHost("bot","slack",s),[]);
  assert.match(validateHost("bot","slack",s.replace("## 4. 宿主官方来源","## 4. TODO")).join("\n"),/宿主官方来源/);
});
test("broken relative documentation links fail",()=>{
  const file=resolve("docs/product-types/README.md");
  const available=new Set([file,resolve("docs/product-types/pwa.md")]);
  assert.deepEqual(validateLinks("[PWA](pwa.md)",file,available),[]);
  assert.match(validateLinks("[wrong](missing.md)",file,available).join("\n"),/broken link/);
});
