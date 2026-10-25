// Each plugin is its own directory under plugins/, because Codex reads one
// manifest per plugin directory, claude.ai refuses a plugin that contains
// another, and no client follows a path out of a plugin's root. Their skills
// are therefore copies, and skills/ is the one to edit: this replaces each
// plugin's skills/ with it, and the structure test fails until they match.
import {cp, rm} from "node:fs/promises";
import {join} from "node:path";
import {PLUGIN_DIRECTORIES, repoRoot} from "../test/lib/server.mjs";

const source = join(repoRoot, "skills");

for (const directory of PLUGIN_DIRECTORIES) {
  const copy = join(repoRoot, directory, "skills");
  await rm(copy, {recursive: true, force: true});
  await cp(source, copy, {recursive: true});
}
