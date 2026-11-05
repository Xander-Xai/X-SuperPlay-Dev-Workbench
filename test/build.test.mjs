import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, readlinkSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build, FILES, validateIsolatedTestOutputDir } from "../tools/build-site.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");

function snapshotTree(path) {
  if (!existsSync(path)) return null;
  const entries = [];
  const walk = dir => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const absolute = join(dir, entry.name);
      const name = relative(path, absolute).replaceAll("\\", "/");
      if (entry.isSymbolicLink()) entries.push({ name, type: "symlink", target: readlinkSync(absolute) });
      else if (entry.isDirectory()) { entries.push({ name, type: "directory" }); walk(absolute); }
      else entries.push({ name, type: "file", sha256: createHash("sha256").update(readFileSync(absolute)).digest("hex") });
    }
  };
  walk(path);
  return entries;
}

function temporaryRoot() { return mkdtempSync(join(tmpdir(), "workbench-build-test-")); }

async function assertDistUnchanged(action) {
  const before = snapshotTree(dist);
  let error;
  try { await action(); } catch (caught) { error = caught; }
  assert.deepEqual(snapshotTree(dist), before, "build tests must not modify the workspace dist directory");
  if (error) throw error;
}

test("Pages build uses an isolated output and preserves the workspace dist tree", async () => assertDistUnchanged(async () => {
  const temp = temporaryRoot();
  try {
    const output = join(temp, "output");
    mkdirSync(output);
    const siblingSentinel = join(temp, "do-not-delete.txt");
    writeFileSync(siblingSentinel, "outside output directory\n");

    await build({ testOutputDir: output });

    for (const name of FILES) assert.ok(lstatSync(resolve(output, name)).isFile(), name);
    assert.deepEqual(readdirSync(output).sort(), [".nojekyll", "index.html", "src", "styles.css"].sort());
    assert.deepEqual(readdirSync(join(output, "src")).sort(), FILES.filter(x => x.startsWith("src/")).map(x => x.slice(4)).sort());
    const html = readFileSync(join(output, "index.html"), "utf8");
    assert.match(html, /Content-Security-Policy/);
    assert.doesNotMatch(html, /fonts\.googleapis\.com/);
    const htmlSha = html.match(/name="workbench-commit" content="([0-9a-f]{40})"/)?.[1];
    assert.ok(htmlSha);
    const catalog = readFileSync(join(output, "src", "catalog.mjs"), "utf8");
    assert.ok(catalog.includes(`buildSha: "${htmlSha}"`));
    assert.equal(readFileSync(siblingSentinel, "utf8"), "outside output directory\n");
  } finally { rmSync(temp, { recursive: true, force: true }); }
}));

test("isolated build output validation rejects traversal, repository paths, missing paths, files, symlinks, and nonempty directories", async () => assertDistUnchanged(async () => {
  const temp = temporaryRoot();
  try {
    await assert.rejects(validateIsolatedTestOutputDir(resolve(temp, "..")), /strict child of the system temporary directory/i);
    await assert.rejects(validateIsolatedTestOutputDir(resolve(root, "dist")), /outside the repository/i);
    await assert.rejects(validateIsolatedTestOutputDir(join(temp, "missing")), /existing directory/i);

    const file = join(temp, "not-a-directory");
    writeFileSync(file, "sentinel\n");
    await assert.rejects(validateIsolatedTestOutputDir(file), /existing directory/i);
    assert.equal(readFileSync(file, "utf8"), "sentinel\n");

    const real = join(temp, "real-output");
    const link = join(temp, "linked-output");
    mkdirSync(real);
    symlinkSync(real, link, process.platform === "win32" ? "junction" : "dir");
    await assert.rejects(validateIsolatedTestOutputDir(link), /symlink|canonical/i);

    const nonempty = join(temp, "nonempty-output");
    mkdirSync(nonempty);
    const sentinel = join(nonempty, "keep.txt");
    writeFileSync(sentinel, "preserve me\n");
    await assert.rejects(validateIsolatedTestOutputDir(nonempty), /must be empty/i);
    assert.equal(readFileSync(sentinel, "utf8"), "preserve me\n");
  } finally { rmSync(temp, { recursive: true, force: true }); }
}));
