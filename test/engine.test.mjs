import test from "node:test";
import assert from "node:assert/strict";
import {TYPES,STAGES,SKILLS,TASKS,PROFILES,OWNER,PROVENANCE,SOURCE,ROUTE_SOPS,SKILL_STATUSES,skillMetadata} from "../src/catalog.mjs";
import {slugify,normalizeConfig,assemble,xengDryRun,toMarkdown,toManifest,validateCatalog} from "../src/engine.mjs";
import {PLAYBOOKS,playbookById,playbookMarkdown,validatePlaybooks} from "../src/playbooks.mjs";
import {GIT_WORKFLOW,validateGitWorkflow} from "../src/git-workflow.mjs";
import {MATURITY_LEVELS,maturityReport} from "../src/maturity.mjs";

test("catalog contains the preserved routes, stages, tasks, profiles and skills",()=>{
  assert.equal(Object.keys(TYPES).length,4);
  assert.equal(STAGES.length,11);
  assert.equal(new Set(STAGES.map(s=>s.id)).size,11);
  assert.equal(TASKS.length,13);
  assert.equal(PROFILES.length,17);
  assert.equal(SKILLS.length,8);
  assert.ok(SKILLS.every(x=>x.status==="CANDIDATE" && x.installed===false && x.selfContained===true));
  assert.deepEqual(validateCatalog(),[]);
});
test("every product route resolves its base profiles",()=>{
  assert.deepEqual(assemble({type:"saas"}).profiles,["saas","web","backend"]);
  assert.deepEqual(assemble({type:"enterprise"}).profiles,["enterprise","web","backend"]);
  assert.deepEqual(assemble({type:"mini-program"}).profiles,["mini-program","backend"]);
  assert.deepEqual(assemble({type:"app"}).profiles,["mobile","flutter","backend"]);
});
test("all APP technology stacks compose correctly",()=>{
  assert.deepEqual(assemble({type:"app",stack:"react-native"}).profiles,["mobile","react-native","backend"]);
  assert.deepEqual(assemble({type:"app",stack:"android"}).profiles,["mobile","android","backend"]);
  assert.deepEqual(assemble({type:"app",stack:"ios"}).profiles,["mobile","ios","backend"]);
});
test("mini-program stacks compose correctly",()=>{
  assert.deepEqual(assemble({type:"mini-program",stack:"mini-taro"}).profiles,["mini-program","web","backend"]);
  assert.deepEqual(assemble({type:"mini-program",stack:"mini-cloud"}).profiles,["mini-program"]);
});
test("RAG and Agent add AI application exactly once",()=>{
  const p=assemble({type:"saas",addons:["rag","agent","rag","unknown"]});
  assert.deepEqual(p.profiles,["saas","web","backend","ai-application","rag","agent"]);
  assert.deepEqual(p.config.addons,["rag","agent"]);
});
test("invalid inputs do not create shell injection",()=>{
  const p=assemble({type:"../../x",tier:"Z",agent:"$(boom)",name:"; rm -rf / && hi"});
  assert.equal(p.config.type,"mini-program");
  assert.equal(p.config.tier,"B");
  assert.equal(p.config.agent,"claude-code");
  assert.match(xengDryRun(p),/^node tools\/xeng\.mjs init \.\.\/[a-z0-9-]+ --profile mini-program,backend --tier B --task feature --mode new --dry-run$/);
  assert.ok(!xengDryRun(p).includes("rm -rf"));
});
test("filenames are sanitized",()=>{
  assert.equal(slugify("../x\\bye"),"xbye");
  assert.equal(slugify("!@#$%^&*"),"new-project");
  assert.equal(slugify("我的 SaaS 产品"),"我的-saas-产品");
});
test("manifest separates ownership and does not claim verification or installation",()=>{
  const m=toManifest(assemble({name:"Demo",description:"Business task"}));
  assert.equal(m.status,"GENERATED_NOT_EXECUTED");
  assert.equal(m.ownership.currentEngineeringOwner.repository,OWNER.repository);
  assert.equal(m.ownership.historicalProvenance.commit,PROVENANCE.commit);
  assert.equal(m.ownership.historicalProvenance.status,"HISTORICAL_PROVENANCE");
  assert.ok(m.route.stages.every(s=>s.state==="NOT_RUN"));
  assert.ok(m.skills.every(s=>s.status==="CANDIDATE" && !s.installed));
  assert.equal(m.ownership.historicalProvenance.commit,SOURCE.commit);
});
test("Markdown outputs the task route and safety caveats",()=>{
  const plan=assemble({type:"enterprise",name:"Test",description:"hello\nworld"});
  const md=toMarkdown(plan);
  assert.match(md,/# Test · 开发方案/);
  assert.match(md,/> hello\n> world/);
  assert.equal((md.match(/^### \d{2} /gm)||[]).length,plan.stages.length);
  assert.match(md,/NOT_RUN/);
  assert.match(md,/--dry-run/);
  assert.match(md,/RBAC/);
});
test("task choice changes the route without inventing stages",()=>{
  const bug=assemble({task:"bug"});
  assert.deepEqual(bug.stages.map(s=>s.id),["discovery","implementation","verification","review"]);
  assert.deepEqual(bug.skipped.map(s=>s.id).sort(),["architecture","intake","operation","planning","postmortem","release","specification"].sort());
  const doc=assemble({task:"documentation"});
  assert.deepEqual(doc.stages.map(s=>s.id),["verification","implementation","review"]);
});
test("input lengths are bounded",()=>{
  const cfg=normalizeConfig({name:"a".repeat(400),description:"b".repeat(5000)});
  assert.equal(cfg.name.length,100);assert.equal(cfg.description.length,2000);
});
test("every product route owns a distinct, complete SOP",()=>{
  assert.equal(Object.keys(ROUTE_SOPS).length,4);
  const cases={
    saas:/租户 B/,
    enterprise:/越权/,
    "mini-program":/非法域名/,
    app:/权限被拒绝/
  };
  for(const [id,sop] of Object.entries(ROUTE_SOPS)){
    assert.equal(sop.id,id);
    assert.ok(sop.prerequisites.length>0);
    assert.ok(sop.platformConstraints.length>0);
    assert.ok(sop.preInstallChecks.length>0);
    assert.ok(sop.gates.length>0);
    assert.ok(sop.failureHandling.length>0);
    assert.ok(sop.rollback.length>0);
    assert.ok(sop.optionalBranches.length>0);
    assert.match(sop.negativeCase,cases[id]);
    assert.match(sop.platformConstraints.join(" "),/.+/);
    for(const key of ["prerequisites","platformConstraints","deliverables","gates","failureHandling","rollback"])
      for(const text of sop[key]) assert.ok(text.trim().length>10,id+"."+key);
  }
  const app=assemble({type:"app",stack:"flutter"});
  assert.equal(app.routeSop.id,"app");
  assert.ok(app.routeSop.platformConstraints.join(" ").includes("签名"));
});
test("skill metadata is complete and status cannot self-promote",()=>{
  assert.deepEqual(SKILL_STATUSES,["CANDIDATE","LOCALLY_VERIFIED","REAL_PROJECT_VERIFIED","REUSABLE"]);
  for(const skill of SKILLS){
    const meta=skillMetadata(skill);
    for(const key of ["id","version","owner","source","license","supported_agents","lifecycle_stage","prerequisites","dependencies","install_method","tests","status"])
      assert.ok(Object.hasOwn(meta,key),"missing "+key+" for "+skill.id);
    assert.equal(meta.status,"CANDIDATE");
    assert.equal(meta.license,"UNLICENSED-PROPRIETARY");
    assert.deepEqual(meta.supported_agents,["claude-code","codex","opencode"]);
    assert.ok(meta.lifecycle_stage);
    assert.ok(meta.install_method.includes("skill-kit.mjs"));
    assert.ok(meta.tests.length>0);
    assert.equal(skill.evidence,undefined);
  }
});

test("three engineering playbooks exist and bind to real profiles",()=>{
  assert.deepEqual(PLAYBOOKS.map(p=>p.id),["ai-application","rag","agent"]);
  for(const p of PLAYBOOKS){
    assert.ok(PROFILES.some(x=>x.id===p.profile),p.id);
    assert.equal(p.status,"ADVISORY_PLAYBOOK_NOT_VERIFIED");
    assert.ok(p.phases.length>=5);
    assert.ok(p.triage.length>=3);
    assert.ok(playbookById(p.id)===p);
  }
  assert.deepEqual(validatePlaybooks(),[]);
  assert.match(playbookMarkdown(PLAYBOOKS[0]),/11 阶段/);
});

test("git workflow covers base SHA, worktrees, PR evidence and agent operating notes",()=>{
  assert.deepEqual(validateGitWorkflow(),[]);
  assert.equal(GIT_WORKFLOW.status,"ADVISORY_PROJECT_GUIDANCE");
  const all=JSON.stringify(GIT_WORKFLOW);
  for(const token of ["base SHA","worktree","命令 + 结果","UNKNOWN","Claude Code","Codex","OpenCode","force-push"])
    assert.ok(all.toLowerCase().includes(token.toLowerCase()),token);
});

test("maturity starts at L0 without controls and never auto-claims L6",()=>{
  assert.equal(MATURITY_LEVELS.length,7);
  const report=maturityReport([], {tier:"B",profiles:["saas"]});
  assert.equal(report.level,"L0");
  assert.equal(report.target,"L2");
  assert.equal(report.target_met,false);
  assert.equal(report.l6.status,"NOT_VERIFIABLE");
  assert.ok(report.missing_controls.some(x=>x.startsWith("L1.reproducible")));
});
