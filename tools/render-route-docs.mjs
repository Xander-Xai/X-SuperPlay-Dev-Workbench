// Generate docs/routes/<type>.md from src/route-packs.mjs.
// `npm run check` compares the generated text with the checked-in files.
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ROUTE_PACKS, routePackDocMarkdown } from "../src/route-packs.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function renderRouteDocs() {
  return Object.fromEntries(
    Object.keys(ROUTE_PACKS).map(id => ["docs/routes/" + id + ".md", routePackDocMarkdown(ROUTE_PACKS[id])])
  );
}

export async function writeRouteDocs() {
  const docs = renderRouteDocs();
  for (const [name, content] of Object.entries(docs)) {
    const path = resolve(root, name);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content, "utf8");
  }
  return Object.keys(docs);
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  writeRouteDocs()
    .then(files => console.log("ROUTE DOCS WRITTEN: " + files.join(", ")))
    .catch(error => { console.error(error.message); process.exitCode = 1; });
}
