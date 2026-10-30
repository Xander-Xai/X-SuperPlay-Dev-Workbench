import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {mkdtempSync,readFileSync,existsSync,rmSync,writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {selectedSkills,skillInstallContract,skillKitCommand} from "../src/install-contract.mjs";
import {assemble} from "../src/engine.mjs";
test("only vetted skill identifiers are selectable",()=>{
  assert.deepEqual(selectedSkills("verification,code-review,verification"),["verification","code-review"]);
  assert.throws(()=>selectedSkills("verification,../../evil"),/Unknown skill/);
  assert.throws(()=>selectedSkills(""),/--skills/);
});
test("correct per-agent project skill directories",()=>{
  assert.equal(skillInstallContract({agent:"claude-code",skills:"verification"}).directory,".claude/skills");
  assert.equal(skillInstallContract({agent:"codex",skills:"verification"}).directory,".agents/skills");
  assert.equal(skillInstallContract({agent:"opencode",skills:"verification"}).directory,".opencode/skills");
  assert.throws(()=>skillInstallContract({agent:"other",skills:"verification"}),/Unsupported/);
});
test("CLI offers a non-writing help path",()=>{
  const result=spawnSync(process.execPath,["tools/skill-kit.mjs","--help"],{encoding:"utf8"});
  assert.equal(result.status,0,result.stderr);
  assert.match(result.stdout,/dry-run/i);
});
test("CLI invalid argument fails before any changes",()=>{
  const result=spawnSync(process.execPath,["tools/skill-kit.mjs","--apply","--skills","../x"],{encoding:"utf8"});
  assert.equal(result.status,1);
  assert.match(result.stderr,/Missing --source/);
});
test("generated install command is non-applying and pinned by tool",()=>{
  const p=assemble({type:"saas",agent:"codex"});
  const cmd=skillKitCommand(p);
  assert.match(cmd,/--agent codex/);
  assert.match(cmd,/--skills project-discovery/);
  assert.ok(!cmd.includes("--apply"));
});
