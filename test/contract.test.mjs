import {join} from "node:path";
import assert from "node:assert/strict";
import {after, before, describe, test} from "node:test";
import {collectSkillExamples} from "./lib/examples.mjs";
import {RUNNING_TOOLS, buildStates, describeExample, runExample} from "./lib/execute.mjs";
import {repoRoot, serverCommand, startServer} from "./lib/server.mjs";

const examples = await collectSkillExamples(join(repoRoot, "skills"));
const states = buildStates(examples);
const runnable = examples.filter(example => RUNNING_TOOLS.includes(example.directives.tool));

// Principle 1, applied from the outside: the skills live in a different repo
// from the code whose behaviour they describe, so every example they teach is
// executed through the published server the manifest installs.
describe("every fenced example works through the tool its fence names", async () => {
  let session;

  before(async () => {
    const {command, args} = await serverCommand();
    console.error(`running examples through: ${command} ${args.join(" ")}`);
    session = await startServer();
  }, {timeout: 300_000});

  after(async () => {
    await session?.close();
  });

  test("there are examples to run", () => {
    assert.ok(runnable.length > 0, "no runnable examples found in skills/");
  });

  for (const example of runnable) {
    test(`${describeExample(example)} (${example.directives.tool})`, {timeout: 120_000}, async () => {
      await runExample(session, example, states);
    });
  }
});
