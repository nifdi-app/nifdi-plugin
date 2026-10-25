// The hosted plugin is its own directory, because Codex reads one manifest per
// plugin directory and neither client follows a path out of a plugin's root.
// Its skills are therefore a copy, and skills/ is the one to edit: this
// replaces cloud/skills/ with it, and the structure test fails until the two
// trees match.
import {cp, rm} from "node:fs/promises";
import {join} from "node:path";
import {repoRoot} from "../test/lib/server.mjs";

const source = join(repoRoot, "skills");
const copy = join(repoRoot, "cloud", "skills");

await rm(copy, {recursive: true, force: true});
await cp(source, copy, {recursive: true});
