import {copyFile,mkdir,rm,readFile,readdir,writeFile} from "node:fs/promises";
import {execFileSync} from "node:child_process";
import {dirname,resolve,join} from "node:path";
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
  "src/handoff.mjs","src/workspace.mjs","src/evidence.mjs","src/identity.mjs","src/evidence-identity.mjs"
];
export async function build(){
  const html=await readFile(resolve(root,"index.html"),"utf8");
  if(!html.includes('src="./src/app.mjs"'))throw Error("Unexpected runtime entrypoint");
  const js=await readFile(resolve(root,"src/app.mjs"),"utf8");
  for(const spec of ["./install-contract.mjs","./workspace.mjs","./evidence.mjs"])
    if(!js.includes(spec))throw Error("Missing runtime module: "+spec);
  if(/from\s+["']node:/.test(js))throw Error("Browser entrypoint imports a Node API");
  await rm(output,{recursive:true,force:true});
  for(const name of FILES){
    const from=resolve(root,name),to=resolve(output,name);
    await mkdir(dirname(to),{recursive:true});
    await copyFile(from,to);
  }
  const commit=buildCommit();
  const distIndex=resolve(output,"index.html");
  const distHtml=await readFile(distIndex,"utf8");
  if(!distHtml.includes('name="workbench-commit"'))throw Error("Missing build commit placeholder");
  await writeFile(distIndex,distHtml.replace(/<meta name="workbench-commit" content="[^"]*"/,
    '<meta name="workbench-commit" content="'+commit+'"'));
  const distCatalog=resolve(output,"src","catalog.mjs");
  const catalogText=await readFile(distCatalog,"utf8");
  if(!catalogText.includes('buildSha: "UNKNOWN_UNTIL_BUILT"'))throw Error("Missing build SHA placeholder");
  await writeFile(distCatalog,catalogText.replace('buildSha: "UNKNOWN_UNTIL_BUILT"','buildSha: "'+commit+'"'));
  await writeFile(join(output,".nojekyll"),"");
  const names=await readdir(output);
  if(names.some(x=>!["index.html","styles.css","src",".nojekyll"].includes(x)))
    throw Error("Unexpected public artifact");
  const published=await readdir(join(output,"src"));
  if(published.some(x=>!FILES.includes("src/"+x)))throw Error("Unexpected published module");
  const bundle=await readFile(join(output,"src","catalog.mjs"),"utf8");
  for(const token of ["node:fs","node:path","child_process","process.env"])
    if(bundle.includes(token))throw Error("Catalog is not browser-safe: "+token);
  console.log("Pages allowlist verified: "+FILES.join(", "));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await build();
