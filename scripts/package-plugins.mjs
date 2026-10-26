// Package each plugin separately; a marketplace repository is not an
// installable plugin archive. Include dotfiles for Claude compatibility.
import {spawnSync} from "node:child_process";
import {cp, mkdir, mkdtemp, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "dist");
await mkdir(output, {recursive: true});
const staging = await mkdtemp(join(tmpdir(), "nifdi-packages-"));

try {
  for (const name of ["nifdi", "nifdi-local"]) {
    const directory = join(staging, name);
    await cp(join(root, "plugins", name), directory, {recursive: true});
    await cp(join(root, "LICENSE"), join(directory, "LICENSE"));
    const archive = join(output, `${name}.zip`);
    await rm(archive, {force: true});
    const result = spawnSync("zip", ["-q", "-r", archive, name], {cwd: staging, stdio: "inherit"});
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`zip failed for ${name}: ${result.status}`);
    console.log(archive);
  }
} finally {
  await rm(staging, {recursive: true, force: true});
}
