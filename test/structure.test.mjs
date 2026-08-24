import {readFile, readdir} from "node:fs/promises";
import {basename, dirname, join} from "node:path";
import assert from "node:assert/strict";
import {describe, test} from "node:test";
import {collectSkillExamples} from "./lib/examples.mjs";
import {TOOLS} from "./lib/examples.mjs";
import {describeExample} from "./lib/execute.mjs";
import {SPEC_FIELDS, parseFrontmatter, validateName} from "./lib/frontmatter.mjs";
import {readManifest, repoRoot} from "./lib/server.mjs";

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
    const manifest = await readManifest();
    const pinned = manifest.mcpServers["nifdi-diagram"].args.at(-1).replace("@nifdi/mcp@", "");
    for (const directory of await skillDirectories()) {
      const file = join(directory, "SKILL.md");
      const {fields} = parseFrontmatter(await readFile(file, "utf8"), file);
      assert.equal(
        fields.metadata?.["nifdi-mcp-version"],
        pinned,
        `${file}: pins a different server version than .claude-plugin/plugin.json`,
      );
    }
  });
});

describe("the plugin manifests", () => {
  test("the marketplace lists the plugin this repo holds", async () => {
    const marketplace = JSON.parse(await readFile(join(repoRoot, ".claude-plugin", "marketplace.json"), "utf8"));
    const manifest = await readManifest();
    assert.ok(marketplace.name, "marketplace needs a name");
    assert.ok(marketplace.owner?.name, "marketplace needs an owner");
    const entry = marketplace.plugins.find(plugin => plugin.name === manifest.name);
    assert.ok(entry, `marketplace.json lists no plugin named "${manifest.name}"`);
    assert.equal(entry.source, "./", "the plugin is this repo");
  });

  test("the server is pinned, not floating", async () => {
    const manifest = await readManifest();
    const spec = manifest.mcpServers["nifdi-diagram"].args.at(-1);
    assert.match(spec, /^@nifdi\/mcp@\d+\.\d+\.\d+$/, "the manifest must pin an exact @nifdi/mcp version");
  });

  test("the Codex plugin installs the same skills and server", async () => {
    const claude = await readManifest();
    const codex = JSON.parse(await readFile(join(repoRoot, ".codex-plugin", "plugin.json"), "utf8"));
    const mcp = JSON.parse(await readFile(join(repoRoot, ".mcp.json"), "utf8"));

    assert.equal(codex.name, claude.name);
    assert.equal(codex.version, claude.version);
    assert.equal(codex.skills, "./skills/");
    assert.equal(codex.mcpServers, "./.mcp.json");
    assert.deepEqual(mcp.mcpServers, claude.mcpServers);
  });

  test("the Codex marketplace lists the plugin this repo holds", async () => {
    const marketplace = JSON.parse(
      await readFile(join(repoRoot, ".agents", "plugins", "marketplace.json"), "utf8"),
    );
    const manifest = JSON.parse(
      await readFile(join(repoRoot, ".codex-plugin", "plugin.json"), "utf8"),
    );
    const entry = marketplace.plugins.find(plugin => plugin.name === manifest.name);

    assert.ok(marketplace.name, "marketplace needs a name");
    assert.ok(entry, `marketplace.json lists no plugin named "${manifest.name}"`);
    assert.deepEqual(entry.source, {source: "local", path: "./"});
    assert.equal(entry.policy.installation, "AVAILABLE");
    assert.equal(entry.policy.authentication, "ON_INSTALL");
    assert.equal(entry.category, "Productivity");
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
