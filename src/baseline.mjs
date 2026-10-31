// Browser-safe allowlist for importing a local read-only project report.
import {TYPES,STACKS,PROFILE_IDS,TASK_IDS} from "./catalog.mjs";
const KNOWN=new Set(["git","python","node","frontend","docker","ci","tests","migrations","agent-guidance","env-example"]);
const cap=(v,max=120)=>String(v??"").trim().slice(0,max);

function normalizeSuggestions(input,projectType){
  if(input===undefined||input===null)return null;
  if(typeof input!=="object"||Array.isArray(input))
    throw new Error("Invalid baseline suggestions");
  const stack=input.stack==null?null:String(input.stack);
  if(stack!==null){
    const known=STACKS.find(s=>s.id===stack&&s.appliesTo.includes(projectType));
    if(!known)throw new Error("Suggested stack does not apply to project type");
  }
  const profiles=input.profiles===undefined?[]:input.profiles;
  if(!Array.isArray(profiles)||profiles.length>20||!profiles.every(p=>PROFILE_IDS.includes(p)))
    throw new Error("Invalid suggested profiles");
  const tasks=input.tasks===undefined?[]:input.tasks;
  if(!Array.isArray(tasks)||tasks.length>13||!tasks.every(t=>TASK_IDS.includes(t)))
    throw new Error("Invalid suggested tasks");
  const notes=input.notes===undefined?[]:input.notes;
  if(!Array.isArray(notes)||notes.length>10||!notes.every(n=>typeof n==="string"))
    throw new Error("Invalid suggestion notes");
  return Object.freeze({
    stack,
    profiles:Object.freeze([...new Set(profiles)]),
    tasks:Object.freeze([...new Set(tasks)]),
    notes:Object.freeze(notes.map(n=>cap(n,160)))
  });
}

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
    suggestions:normalizeSuggestions(input.suggestions,input.projectType),
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
    suggestions:b.suggestions,
    verification:"NOT_RUN"
  };
}
