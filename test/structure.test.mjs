import {readFile, readdir} from "node:fs/promises";
import {basename, dirname, join, relative} from "node:path";
import assert from "node:assert/strict";
import {describe, test} from "node:test";
import {collectSkillExamples} from "./lib/examples.mjs";
import {TOOLS} from "./lib/examples.mjs";
import {describeExample} from "./lib/execute.mjs";
import {SPEC_FIELDS, parseFrontmatter, validateName} from "./lib/frontmatter.mjs";
import {readLocalManifest, repoRoot} from "./lib/server.mjs";

const skillsRoot = join(repoRoot, "skills");

async function skillDirectories() {
  const entries = await readdir(skillsRoot, {withFileTypes: true});
  return entries.filter(entry => entry.isDirectory()).map(entry => join(skillsRoot, entry.name));
}

describe("every skill is a valid Agent Skill", () => {
  test("skills exist", async () => {
    assert.ok((await skillDirectories()).length > 0, "no skills in skills/");
  });

  test("frontmatter stays on the spec's fields and inside its limits", async () => {
    for (const directory of await skillDirectories()) {
      const file = join(directory, "SKILL.md");
      const {fields, body} = parseFrontmatter(await readFile(file, "utf8"), file);

      assert.ok(fields.name, `${file}: name is required`);
      assert.equal(validateName(fields.name), undefined, `${file}: name "${fields.name}" is invalid`);
      assert.equal(fields.name, basename(directory), `${file}: name must match its directory`);

      assert.ok(fields.description, `${file}: description is required`);
      assert.ok(
        fields.description.length <= 1024,
        `${file}: description is ${fields.description.length} characters, the spec allows 1024`,
      );

      for (const field of Object.keys(fields)) {
        assert.ok(SPEC_FIELDS.includes(field), `${file}: "${field}" is not one of the spec's fields`);
      }

      const lines = body.split("\n").length;
      assert.ok(lines <= 500, `${file}: body is ${lines} lines, the spec recommends 500 or fewer`);
    }
  });

  test("every skill pins the server version the manifest installs", async () => {
    const manifest = await readLocalManifest();
    const pinned = manifest.mcpServers["nifdi-diagram"].args.at(-1).replace("@nifdi/mcp@", "");
    for (const directory of await skillDirectories()) {
      const file = join(directory, "SKILL.md");
      const {fields} = parseFrontmatter(await readFile(file, "utf8"), file);
      assert.equal(
        fields.metadata?.["nifdi-mcp-version"],
        pinned,
        `${file}: pins a different server version than plugins/nifdi-local/.claude-plugin/plugin.json`,
      );
    }
  });
});

const HOSTED_SERVER = {nifdi: {type: "http", url: "https://nifdi.app/api/mcp"}};

const PLUGINS = [
  {name: "nifdi", directory: "plugins/nifdi", server: "nifdi"},
  {name: "nifdi-local", directory: "plugins/nifdi-local", server: "nifdi-diagram"},
];

async function readJson(...segments) {
  return JSON.parse(await readFile(join(repoRoot, ...segments), "utf8"));
}

async function filesBelow(directory) {
  const entries = await readdir(directory, {withFileTypes: true, recursive: true});
  const files = entries
    .filter(entry => entry.isFile())
    .map(entry => relative(directory, join(entry.parentPath ?? entry.path, entry.name)));
  return files.sort();
}

const NOT_SEARCHED = new Set([".git", "node_modules"]);

async function pluginManifestsBelow(directory) {
  const manifests = [];
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    if (!entry.isDirectory() || NOT_SEARCHED.has(entry.name)) {
      continue;
    }
    const path = join(directory, entry.name);
    if (entry.name === ".claude-plugin") {
      manifests.push(...(await readdir(path)).filter(name => name === "plugin.json").map(name => relative(repoRoot, join(path, name))));
      continue;
    }
    manifests.push(...(await pluginManifestsBelow(path)));
  }
  return manifests;
}

describe("the plugin manifests", () => {
  test("the marketplace lists both plugins, each from its own directory", async () => {
    const marketplace = await readJson(".claude-plugin", "marketplace.json");
    assert.ok(marketplace.name, "marketplace needs a name");
    assert.ok(marketplace.owner?.name, "marketplace needs an owner");
    for (const plugin of PLUGINS) {
      const entry = marketplace.plugins.find(listed => listed.name === plugin.name);
      assert.ok(entry, `marketplace.json lists no plugin named "${plugin.name}"`);
      assert.equal(entry.source, `./${plugin.directory}`);
      const manifest = await readJson(plugin.directory, ".claude-plugin", "plugin.json");
      assert.equal(manifest.name, plugin.name, `${plugin.directory}: the manifest name is the skill prefix`);
    }
  });

  test("the local server is pinned, not floating", async () => {
    const manifest = await readLocalManifest();
    const spec = manifest.mcpServers["nifdi-diagram"].args.at(-1);
    assert.match(spec, /^@nifdi\/mcp@\d+\.\d+\.\d+$/, "the manifest must pin an exact @nifdi/mcp version");
  });

  test("the hosted plugin connects to production nifdi over HTTP, and to nothing else", async () => {
    const manifest = await readJson("plugins", "nifdi", ".claude-plugin", "plugin.json");
    assert.deepEqual(manifest.mcpServers, HOSTED_SERVER);
  });

  test("each plugin carries its own server and no other", async () => {
    for (const plugin of PLUGINS) {
      const manifest = await readJson(plugin.directory, ".claude-plugin", "plugin.json");
      const mcp = await readJson(plugin.directory, ".mcp.json");
      assert.deepEqual(Object.keys(manifest.mcpServers), [plugin.server]);
      assert.deepEqual(mcp.mcpServers, manifest.mcpServers, `${plugin.directory}: .mcp.json and plugin.json differ`);
    }
  });

  test("both plugins and both clients carry one version", async () => {
    const versions = [(await readJson("package.json")).version];
    for (const plugin of PLUGINS) {
      versions.push((await readJson(plugin.directory, ".claude-plugin", "plugin.json")).version);
      versions.push((await readJson(plugin.directory, ".codex-plugin", "plugin.json")).version);
    }
    assert.equal(new Set(versions).size, 1, `versions differ: ${versions.join(", ")}`);
  });

  test("each Codex plugin installs the same skills and server as its Claude plugin", async () => {
    for (const plugin of PLUGINS) {
      const claude = await readJson(plugin.directory, ".claude-plugin", "plugin.json");
      const codex = await readJson(plugin.directory, ".codex-plugin", "plugin.json");
      assert.equal(codex.name, claude.name);
      assert.equal(codex.skills, "./skills/");
      assert.equal(codex.mcpServers, "./.mcp.json");
    }
  });

  test("the Codex marketplace lists both plugins, each from its own directory", async () => {
    const marketplace = await readJson(".agents", "plugins", "marketplace.json");
    assert.ok(marketplace.name, "marketplace needs a name");
    for (const plugin of PLUGINS) {
      const entry = marketplace.plugins.find(listed => listed.name === plugin.name);
      assert.ok(entry, `marketplace.json lists no plugin named "${plugin.name}"`);
      assert.deepEqual(entry.source, {source: "local", path: `./${plugin.directory}`});
      assert.equal(entry.policy.installation, "AVAILABLE");
      assert.equal(entry.policy.authentication, "ON_INSTALL");
      assert.equal(entry.category, "Productivity");
    }
  });

  test("each plugin's skills are an exact copy of skills/ (npm run sync:skills)", async () => {
    const files = await filesBelow(skillsRoot);
    for (const plugin of PLUGINS) {
      const copy = join(repoRoot, plugin.directory, "skills");
      assert.deepEqual(await filesBelow(copy), files, `${plugin.directory}/skills has different files from skills/`);
      for (const file of files) {
        const original = await readFile(join(skillsRoot, file), "utf8");
        assert.equal(await readFile(join(copy, file), "utf8"), original, `${plugin.directory}/skills/${file} differs from skills/${file}`);
      }
    }
  });

  test("no plugin directory holds another plugin's manifest, which claude.ai refuses", async () => {
    const manifests = await pluginManifestsBelow(repoRoot);
    const roots = manifests.map(manifest => dirname(dirname(manifest)));
    for (const root of roots) {
      const nested = roots.filter(other => other !== root && (root === "." || other.startsWith(`${root}/`)));
      assert.deepEqual(nested, [], `${root} holds another plugin`);
    }
    assert.deepEqual(manifests.sort(), PLUGINS.map(plugin => join(plugin.directory, ".claude-plugin", "plugin.json")).sort());
  });
});

// The testable-or-cut bar, made mechanical: a fenced block in a skill either
// runs against the server in CI or says in the fence itself why it does not.
// Prose that claims behaviour is what this repo exists to keep honest, and an
// untagged fence is how that claim gets in without a check.
describe("every fenced example declares how it is checked", () => {
  test("each fence names a tool, or a reason for skipping", async () => {
    const problems = [];
    for (const example of await collectSkillExamples(skillsRoot)) {
      const {tool, why} = example.directives;
      if (tool === undefined) {
        problems.push(`${describeExample(example)}: fence has no tool= directive`);
        continue;
      }
      if (!TOOLS.includes(tool)) {
        problems.push(`${describeExample(example)}: tool="${tool}" is not one of ${TOOLS.join(", ")}`);
      }
      if (tool === "skip" && why === undefined) {
        problems.push(`${describeExample(example)}: tool=skip needs why="…"`);
      }
    }
    assert.deepEqual(problems, []);
  });
});
