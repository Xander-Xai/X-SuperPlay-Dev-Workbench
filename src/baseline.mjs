// Browser-safe allowlist for importing a local read-only project report.
import {TYPES} from "./catalog.mjs";
const KNOWN=new Set(["git","python","node","frontend","docker","ci","tests","migrations","agent-guidance","env-example"]);
const cap=(v,max=120)=>String(v??"").trim().slice(0,max);
export function normalizeBaseline(input){
  if(!input || typeof input!=="object" || input.schemaVersion!==1
     || input.kind!=="LOCAL_PROJECT_BASELINE"
     || input.status!=="READ_ONLY_DISCOVERY")
    throw new Error("Not a supported local Workbench baseline report");
  if(!Object.hasOwn(TYPES,input.projectType))throw new Error("Unknown project type in baseline");
  const commit=cap(input.headSha,40);
  if(commit!=="UNKNOWN"&&!/^[0-9a-f]{40}$/.test(commit))
    throw new Error("Invalid Git HEAD in baseline");
  if(!Array.isArray(input.detected)||input.detected.length>20
     ||!input.detected.every(x=>KNOWN.has(x)))
    throw new Error("Invalid baseline capabilities");
  if(typeof input.dirty!=="boolean" && input.dirty!==null)
    throw new Error("Invalid Git state");
  return Object.freeze({
    schemaVersion:1,
    kind:"LOCAL_PROJECT_BASELINE",
    status:"READ_ONLY_DISCOVERY",
    name:cap(input.name,100)||"unnamed",
    projectType:input.projectType,
    headSha:commit,
    dirty:input.dirty,
    detected:[...new Set(input.detected)],
    verification:"NOT_RUN",
    security:"LOCAL_ONLY_NO_REMOTE_UPLOAD"
  });
}
export function baselineSummary(input){
  const b=normalizeBaseline(input);
  return {
    source:"LOCAL_READ_ONLY_PROBE",
    projectName:b.name,projectType:b.projectType,headSha:b.headSha,
    dirty:b.dirty,detected:[...b.detected],
    verification:"NOT_RUN"
  };
}
