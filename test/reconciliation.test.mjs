import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {createHash} from "node:crypto";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const FILE=resolve(ROOT,"migration/eng-os-semantic-reconciliation-20261031.json");
const FROZEN_COMMIT="8553124f238ab463d4a50debad34e871ef8de060";
const EXPECTED_DIGEST="18a62493f23fdaa30663b0e35d8733ccfb2e6f5519dd5b137c76aabbfd9a63e1";
const VERIFIED=new Set(["MIGRATED_VERIFIED","EQUIVALENT_VERIFIED"]);

function load(){return JSON.parse(readFileSync(FILE,"utf8"));}

function localPaths(value){
  return String(value??"").split(";").map(x=>x.trim()).filter(Boolean).filter(x=>{
    if(/^(N\/A|CI|npm|site|node|UNKNOWN|NOT_RUN|HISTORICAL|no runtime)/i.test(x))return false;
    return x.includes("/")||x.includes(".");
  });
}

test("frozen snapshot has exactly one entry per source path",()=>{
  const data=load();
  assert.equal(data.entries.length,106);
  assert.equal(data.source_snapshot_commit,FROZEN_COMMIT);
  const paths=data.entries.map(e=>e.source_path);
  assert.equal(new Set(paths).size,paths.length);
  for(const e of data.entries){
    assert.equal(e.source_sha,FROZEN_COMMIT,e.source_path);
    assert.match(e.source_blob_sha,/^[0-9a-f]{40}$/,e.source_path);
    assert.ok(data.dispositions.includes(e.disposition),e.source_path);
    for(const key of ["source_path","semantic_capability","destination","implementation","test","evidence","disposition"])
      assert.ok(String(e[key]??"").trim(),e.source_path+" missing "+key);
  }
});

test("source tree digest matches the frozen blob set",()=>{
  const data=load();
  const sorted=[...data.entries].sort((a,b)=>a.source_path.localeCompare(b.source_path));
  const digest=createHash("sha256").update(sorted.map(e=>e.source_path+"\0"+e.source_blob_sha+"\n").join(""),"utf8").digest("hex");
  assert.equal(digest,EXPECTED_DIGEST);
  assert.equal(data.source_tree_digest.algorithm,"sha256");
  assert.equal(data.source_tree_digest.blob_count,106);
  assert.equal(data.source_tree_digest.value,EXPECTED_DIGEST);
});

test("summary counts match dispositions and no file is partial or dropped",()=>{
  const data=load();
  const counts={};
  for(const e of data.entries)counts[e.disposition]=(counts[e.disposition]??0)+1;
  assert.deepEqual(counts,data.summary.counts);
  assert.equal(data.summary.total_files,106);
  assert.equal(data.summary.not_silently_dropped,106);
  assert.equal(data.summary.runtime_dependency,false);
  assert.equal((counts.PARTIAL??0),0);
  assert.equal((counts.NOT_MIGRATED??0),0);
});

test("every local implementation and test path exists",()=>{
  const data=load();
  for(const e of data.entries){
    for(const key of ["implementation","test"]){
      for(const path of localPaths(e[key]))
        assert.ok(existsSync(resolve(ROOT,path)),e.source_path+" -> "+key+" missing "+path);
    }
  }
});

test("independent review records the four gaps and three playbooks as verified",()=>{
  const data=load();
  assert.equal(data.independent_review.external_human_review,"NOT_RUN");
  assert.equal(data.independent_review.source_tree_verification,"VERIFIED");
  const gaps=Object.values(data.independent_review.historical_gaps);
  assert.equal(gaps.length,4);
  for(const v of gaps)assert.ok(VERIFIED.has(v),v);
  assert.deepEqual(Object.keys(data.independent_review.playbooks).sort(),["agent","ai-application","rag"]);
  for(const v of Object.values(data.independent_review.playbooks))assert.ok(VERIFIED.has(v),v);
});

test("post-freeze increments are reconciled separately from the frozen snapshot",()=>{
  const data=JSON.parse(readFileSync(resolve(ROOT,"migration/eng-os-post-freeze-increments-20261031.json"),"utf8"));
  assert.equal(data.ahead_by,10);
  assert.equal(data.commits.length,10);
  assert.equal(data.independent_of_frozen_106,true);
  assert.equal(data.boundary.runtime_dependency_added,false);
  assert.equal(data.public_boundary.opc_link_copied,false);
  assert.equal(data.public_boundary.private_registry_copied,false);
  assert.equal(data.archive_state.source_marked_superseded,true);
  const prs=new Set(data.commits.map(c=>c.pr));
  for(const pr of ["#5","#6","#9","#10","#12","#13","#14","#15","#16","#17"])assert.ok(prs.has(pr),pr);
  const known=new Set(["MIGRATED_VERIFIED","EQUIVALENT_VERIFIED","NOT_APPLICABLE_TO_RUNTIME","HISTORICAL_ONLY"]);
  for(const c of data.commits)assert.ok(known.has(c.assessment),c.pr);
});
