import test from "node:test";
import assert from "node:assert/strict";
import {assemble} from "../src/engine.mjs";
import {
  engineeringProfileYaml,adrTemplate,verificationPlan,releaseChecklist,routeSopMarkdown,reviewRecord,workspaceBundle,
  implementationPlan,postmortemTemplate,externalDemandBrief,pullRequestDocument,gitWorkflowMarkdown,engineeringPlaybookMarkdown
} from "../src/workspace.mjs";

const plan=()=>assemble({type:"saas",task:"feature",name:"Demo",description:"Build it",agent:"codex"});
const baselinePlan=()=>assemble({
  type:"saas",task:"feature",name:"Demo",description:"Build it",agent:"codex",
  baseline:{schemaVersion:1,kind:"LOCAL_PROJECT_BASELINE",status:"READ_ONLY_DISCOVERY",
    name:"Demo",projectType:"saas",headSha:"a".repeat(40),dirty:false,detected:["git"]}
});

test("workspace emits sixteen reviewable artifacts",()=>{
  const bundle=workspaceBundle(plan());
  const names=Object.keys(bundle);
  assert.equal(names.length,16);
  assert.ok(names.every(n=>bundle[n].length>0));
  assert.ok(names.some(n=>n.endsWith("-manifest.json")));
  assert.ok(names.some(n=>n.endsWith("-ENGINEERING_PROFILE.yaml")));
  assert.ok(names.some(n=>n.endsWith("-spec-and-tickets-draft.md")));
  assert.ok(names.some(n=>n.endsWith("-adr-draft.md")));
  assert.ok(names.some(n=>n.endsWith("-verification-plan.md")));
  assert.ok(names.some(n=>n.endsWith("-release-checklist.md")));
  assert.ok(names.some(n=>n.endsWith("-agent-handoff.md")));
  assert.ok(names.some(n=>n.endsWith("-route-sop.md")));
  assert.ok(names.some(n=>n.endsWith("-review-record.md")));
  assert.ok(names.some(n=>n.endsWith("-implementation-plan.md")));
  assert.ok(names.some(n=>n.endsWith("-postmortem-template.md")));
  assert.ok(names.some(n=>n.endsWith("-external-demand-brief.md")));
  assert.ok(names.some(n=>n.endsWith("-pull-request-template.md")));
  assert.ok(names.some(n=>n.endsWith("-git-workflow.md")));
  assert.ok(names.some(n=>n.endsWith("-engineering-playbook.md")));
  assert.ok(names.some(n=>n.endsWith("-bundle.json")));
});
test("every artifact shares one project id and base SHA",()=>{
  const p=baselinePlan();
  const bundle=workspaceBundle(p);
  const artifacts=Object.entries(bundle).filter(([n])=>!n.endsWith("-bundle.json")&&!n.endsWith("-manifest.json"));
  assert.equal(artifacts.length,14);
  for(const [name,text] of artifacts){
    assert.match(text,new RegExp('project_id: "?'+p.slug),name);
    assert.match(text,new RegExp('base_sha: "?'+"a".repeat(40)),name);
  }
  assert.match(bundle[p.slug+"-spec-and-tickets-draft.md"],/baseSha|base_sha/);
  const pack=JSON.parse(bundle[p.slug+"-bundle.json"]);
  assert.equal(pack.kind,"WORKBENCH_PROJECT_BUNDLE");
  assert.equal(pack.status,"DRAFT_NOT_EXECUTED");
  assert.equal(pack.identity.projectId,p.slug);
  assert.equal(pack.identity.baseSha,"a".repeat(40));
  assert.equal(pack.files.length,15);
  for(const f of pack.files){
    assert.ok(f.content.includes(p.slug),f.name);
    assert.ok(f.content.includes("a".repeat(40)),f.name);
    assert.equal(f.bytes,new TextEncoder().encode(f.content).length,f.name);
  }
  const manifest=JSON.parse(bundle[p.slug+"-manifest.json"]);
  assert.equal(manifest.project.baseSha,"a".repeat(40));
  assert.equal(manifest.project.slug,p.slug);
});
test("route SOPs are distinct and carry platform limits",()=>{
  const saas=routeSopMarkdown(assemble({type:"saas",name:"S"}));
  const enterprise=routeSopMarkdown(assemble({type:"enterprise",name:"E"}));
  const mini=routeSopMarkdown(assemble({type:"mini-program",name:"M"}));
  const app=routeSopMarkdown(assemble({type:"app",stack:"ios",name:"A"}));
  assert.match(saas,/租户 B/);
  assert.match(enterprise,/UAT/);
  assert.match(mini,/真机/);
  assert.match(app,/Android/);
  assert.match(app,/商店审核/);
  assert.equal(new Set([saas,enterprise,mini,app]).size,4);
  for(const text of [saas,enterprise,mini,app]) assert.match(text,/NOT_RUN/);
});
test("review record separates Spec and Standards axes and finding classes",()=>{
  const text=reviewRecord(plan());
  assert.match(text,/NOT_RUN/);
  assert.match(text,/Spec 轴/);
  assert.match(text,/Standards 轴/);
  assert.match(text,/MAINLINE_BLOCKER/);
  assert.match(text,/NON_BLOCKING/);
  assert.match(text,/Scope Change/);
  assert.match(text,/reviewed_candidate：NOT_RECORDED/);
});
test("manifest artifact is the same safe manifest used by exports",()=>{
  const p=plan();
  const bundle=workspaceBundle(p);
  const raw=Object.entries(bundle).find(([n])=>n.endsWith("-manifest.json"))[1];
  const manifest=JSON.parse(raw);
  assert.equal(manifest.kind,"WORKBENCH_PLAN");
  assert.equal(manifest.status,"GENERATED_NOT_EXECUTED");
  assert.equal(manifest.ownership.currentEngineeringOwner.repository,p.ownership.currentOwner.repository);
});
test("engineering profile carries ownership and explicit levels",()=>{
  const yaml=engineeringProfileYaml(plan());
  assert.match(yaml,/current_owner:/);
  assert.match(yaml,/historical_provenance:/);
  assert.match(yaml,/governance_reference:/);
  assert.match(yaml,/profiles: \[saas, web, backend\]/);
  assert.match(yaml,/exceptions: \[\]/);
  assert.match(yaml,/unit_tests: required/);
  assert.match(yaml,/evals: not_applicable/);
});
test("drafts never claim execution",()=>{
  const p=plan();
  for(const text of [adrTemplate(p),verificationPlan(p),releaseChecklist(p)])
    assert.match(text,/NOT_RUN/);
  assert.match(verificationPlan(p),/代码检查：/);
  assert.match(releaseChecklist(p),/- \[ \] 回滚方案/);
});
test("AI profiles require evals in the generated profile",()=>{
  const yaml=engineeringProfileYaml(assemble({type:"saas",addons:["rag"]}));
  assert.match(yaml,/evals: required/);
});

test("implementation plan carries assumptions, budget, stop conditions and rollback",()=>{
  const text=implementationPlan(plan());
  assert.match(text,/DRAFT_NOT_EXECUTED/);
  assert.match(text,/## 假设（未核实）/);
  assert.match(text,/## 停止条件/);
  assert.match(text,/每个假设最多 2 次修复尝试/);
  assert.match(text,/## 回退/);
  assert.match(text,/Scope Change/);
});

test("postmortem separates facts, impact, root cause, actions and unverified items",()=>{
  const text=postmortemTemplate(plan());
  assert.match(text,/TEMPLATE_NOT_EXECUTED/);
  assert.match(text,/Blameless/);
  assert.match(text,/一页为主/);
  assert.match(text,/## 1\. 事实与时间线/);
  assert.match(text,/## 2\. 影响/);
  assert.match(text,/## 3\. 根因/);
  assert.match(text,/## 5\. 行动项/);
  assert.match(text,/## 7\. 未验证项/);
  assert.match(text,/如果每个行动项都是“更小心一点”/);
});

test("external demand brief cannot become an approved spec by itself",()=>{
  const text=externalDemandBrief(plan());
  assert.match(text,/TEMPLATE_NOT_EXECUTED/);
  assert.match(text,/不进入已批准 Spec/);
  assert.match(text,/SOURCE_UNVERIFIED/);
  assert.match(text,/ENGINEERING_HYPOTHESIS/);
  assert.match(text,/## 5\. 进入已批准 Spec 的条件/);
});

test("pull request template requires commands, results, base SHA and unverified items",()=>{
  const text=pullRequestDocument(baselinePlan());
  assert.match(text,/TEMPLATE_NOT_EXECUTED/);
  assert.match(text,/## Base SHA/);
  assert.match(text,/a{40}/);
  assert.match(text,/## Verification/);
  assert.match(text,/NOT_RUN/);
  assert.match(text,/## 未验证项/);
  assert.match(text,/Agent provenance/);
});

test("git workflow is advisory and carries base SHA, worktrees and agent notes",()=>{
  const text=gitWorkflowMarkdown(plan());
  assert.match(text,/ADVISORY_PROJECT_GUIDANCE/);
  assert.match(text,/Base SHA/);
  assert.match(text,/Worktree 隔离/);
  assert.match(text,/Claude Code/);
  assert.match(text,/Codex/);
  assert.match(text,/OpenCode/);
  assert.match(text,/项目本地规则/);
});

test("AI profiles receive a matching engineering playbook; others get an explicit no-playbook note",()=>{
  const ai=assemble({type:"saas",addons:["rag"]});
  const text=engineeringPlaybookMarkdown(ai);
  assert.match(text,/AI 应用日常研发手册/);
  assert.match(text,/企业 RAG 从零构建手册/);
  assert.match(text,/ADVISORY_PLAYBOOK_NOT_VERIFIED/);
  const plain=engineeringPlaybookMarkdown(assemble({type:"saas"}));
  assert.match(plain,/NO_AI_PLAYBOOK_ATTACHED/);
});
