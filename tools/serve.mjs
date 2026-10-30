import {createServer} from "node:http";
import {readFile,stat} from "node:fs/promises";
import {resolve,extname,sep,dirname} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const types={".html":"text/html; charset=utf-8",".mjs":"text/javascript; charset=utf-8",
  ".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8"};
const port=Number(process.env.PORT||4173);
const server=createServer(async(req,res)=>{
  try{
    if(req.method!=="GET" && req.method!=="HEAD"){res.writeHead(405);res.end();return;}
    const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
    const safe=pathname==="/"?"index.html":pathname.replace(/^\/+/,"");
    const target=resolve(root,safe);
    if(target!==root && !target.startsWith(root+sep)){res.writeHead(403);res.end();return;}
    if(safe.split("/").some(x=>x.startsWith(".") || x==="node_modules" || x==="test" || x==="tools")){
      res.writeHead(404);res.end();return;
    }
    if(!(await stat(target)).isFile()){res.writeHead(404);res.end();return;}
    const data=await readFile(target);
    res.writeHead(200,{"Content-Type":types[extname(target)]||"application/octet-stream",
      "Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});
    if(req.method==="HEAD")res.end();else res.end(data);
  }catch{res.writeHead(404);res.end("Not Found");}
});
server.listen(port,"127.0.0.1",()=>console.log("Dev Workbench: http://127.0.0.1:"+port));
