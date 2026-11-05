import {copyFile,mkdir,rm,readFile,readdir,writeFile,lstat,realpath} from "node:fs/promises";
import {execFileSync} from "node:child_process";
import {dirname,resolve,join,relative,sep,isAbsolute} from "node:path";
import {tmpdir} from "node:os";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const output=resolve(root,"dist");
function buildCommit(){
  const fromEnv=process.env.GITHUB_SHA;
  if(fromEnv&&/^[0-9a-f]{40}$/.test(fromEnv))return fromEnv;
  try{return execFileSync("git",["rev-parse","HEAD"],{cwd:root,encoding:"utf8"}).trim();}
  catch{return "DEV_UNCOMMITTED";}
}
export const FILES=[
  "index.html","styles.css",
  "src/app.mjs","src/catalog.mjs","src/routing.mjs","src/engine.mjs",
  "src/install-contract.mjs","src/starter.mjs","src/baseline.mjs",
  "src/handoff.mjs","src/workspace.mjs","src/evidence.mjs","src/identity.mjs","src/evidence-identity.mjs",
  "src/playbooks.mjs","src/git-workflow.mjs","src/maturity.mjs","src/delivery.mjs","src/orchestration.mjs","src/collaboration.mjs",
  "src/route-packs.mjs"
];

function containsPath(parent,child){
  const rel=relative(parent,child);
  return rel===""||(rel!==".."&&!rel.startsWith(".."+sep)&&!isAbsolute(rel));
}

/** Validate an existing, empty test output directory under the OS temporary root. */
export async function validateIsolatedTestOutputDir(candidate){
  if(typeof candidate!=="string"||!candidate.trim()||candidate.includes("\0"))
    throw new Error("isolated test output must be a nonempty path");
  const requested=resolve(candidate);
  const repo=await realpath(root);
  if(containsPath(repo,requested))
    throw new Error("isolated test output must be outside the repository");
  const temporaryRoot=await realpath(tmpdir());
  let actual;
  try{actual=await realpath(requested);}
  catch(error){if(error.code==="ENOENT")throw new Error("isolated test output must be an existing directory");throw error;}
  if(actual!==requested)
    throw new Error("isolated test output path must be canonical and contain no symlink components");
  if(!containsPath(temporaryRoot,actual)||actual===temporaryRoot)
    throw new Error("isolated test output must be a strict child of the system temporary directory");
  const stat=await lstat(actual);
  if(!stat.isDirectory()||stat.isSymbolicLink())
    throw new Error("isolated test output must be an existing directory, not a symlink or file");
  if((await readdir(actual)).length)
    throw new Error("isolated test output directory must be empty");
  return actual;
}

async function clearProductionOutput(){
  try{
    const stat=await lstat(output);
    if(!stat.isDirectory()||stat.isSymbolicLink()||await realpath(output)!==output)
      throw new Error("refusing to clear dist unless it is the repository's real dist directory");
  }catch(error){if(error.code!=="ENOENT")throw error;}
  await rm(output,{recursive:true,force:true});
}

export async function build(options={}){
  const isolated=options.testOutputDir!==undefined;
  const destination=isolated?await validateIsolatedTestOutputDir(options.testOutputDir):output;
  const html=await readFile(resolve(root,"index.html"),"utf8");
  if(!html.includes('src="./src/app.mjs"'))throw Error("Unexpected runtime entrypoint");
  const js=await readFile(resolve(root,"src/app.mjs"),"utf8");
  for(const spec of ["./install-contract.mjs","./workspace.mjs","./evidence.mjs"])
    if(!js.includes(spec))throw Error("Missing runtime module: "+spec);
  if(/from\s+["']node:/.test(js))throw Error("Browser entrypoint imports a Node API");
  if(!isolated)await clearProductionOutput();
  for(const name of FILES){
    const from=resolve(root,name),to=resolve(destination,name);
    await mkdir(dirname(to),{recursive:true});
    await copyFile(from,to);
  }
  const commit=buildCommit();
  const distIndex=resolve(destination,"index.html");
  const distHtml=await readFile(distIndex,"utf8");
  if(!distHtml.includes('name="workbench-commit"'))throw Error("Missing build commit placeholder");
  await writeFile(distIndex,distHtml.replace(/<meta name="workbench-commit" content="[^"]*"/,
    '<meta name="workbench-commit" content="'+commit+'"'));
  const distCatalog=resolve(destination,"src","catalog.mjs");
  const catalogText=await readFile(distCatalog,"utf8");
  if(!catalogText.includes('buildSha: "UNKNOWN_UNTIL_BUILT"'))throw Error("Missing build SHA placeholder");
  await writeFile(distCatalog,catalogText.replace('buildSha: "UNKNOWN_UNTIL_BUILT"','buildSha: "'+commit+'"'));
  await writeFile(join(destination,".nojekyll"),"");
  const names=await readdir(destination);
  if(names.some(x=>!["index.html","styles.css","src",".nojekyll"].includes(x)))
    throw Error("Unexpected public artifact");
  const published=await readdir(join(destination,"src"));
  if(published.some(x=>!FILES.includes("src/"+x)))throw Error("Unexpected published module");
  const bundle=await readFile(join(destination,"src","catalog.mjs"),"utf8");
  for(const token of ["node:fs","node:path","child_process","process.env"])
    if(bundle.includes(token))throw Error("Catalog is not browser-safe: "+token);
  console.log("Pages allowlist verified: "+FILES.join(", "));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await build();
