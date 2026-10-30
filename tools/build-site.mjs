import {copyFile,mkdir,rm,readFile,readdir,writeFile} from "node:fs/promises";
import {dirname,resolve,join} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const output=resolve(root,"dist");
export const FILES=["index.html","styles.css","src/app.mjs","src/catalog.mjs","src/engine.mjs","src/install-contract.mjs","src/starter.mjs"];
export async function build(){
  const html=await readFile(resolve(root,"index.html"),"utf8");
  if(!html.includes('src="./src/app.mjs"'))throw Error("Unexpected runtime entrypoint");
  const js=await readFile(resolve(root,"src/app.mjs"),"utf8");
  if(!js.includes('./install-contract.mjs'))throw Error("Missing install contract");
  await rm(output,{recursive:true,force:true});
  for(const name of FILES){
    const from=resolve(root,name),to=resolve(output,name);
    await mkdir(dirname(to),{recursive:true});
    await copyFile(from,to);
  }
  await writeFile(join(output,".nojekyll"),"");
  const names=await readdir(output);
  if(names.some(x=>!["index.html","styles.css","src",".nojekyll"].includes(x)))
    throw Error("Unexpected public artifact");
  console.log("Pages allowlist verified: "+FILES.join(", "));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await build();
