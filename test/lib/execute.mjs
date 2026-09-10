import {parseReport} from "./server.mjs";
import {DEFAULT_WORLD, PATH_SEED} from "./worlds.mjs";

export const RUNNING_TOOLS = ["insert", "set_diagram", "normalize_diagram", "set_style", "path"];

export function describeExample(example) {
  return `${example.file}:${example.line}`;
}

// A named example is a state other examples can start from: `id=world` records
// the steps that produced it, and `setup=world` replays them. States compose, so
// a skill can show a diagram, then an edit to it, then a sheet against the
// result — each fence running the real sequence a reader would run.
export function buildStates(examples) {
  const states = new Map();
  for (const example of examples) {
    const {tool, id, setup} = example.directives;
    if (id === undefined) {
      continue;
    }
    if (tool !== "insert" && tool !== "set_diagram") {
      throw new Error(`${describeExample(example)}: only insert and set_diagram examples may declare id=`);
    }
    const base = setup === undefined ? emptyState() : requireState(states, setup, example);
    states.set(id, {
      steps: [...base.steps, {tool, body: example.body}],
      document: tool === "set_diagram" ? example.body : base.document,
    });
  }
  return states;
}

function emptyState() {
  return {steps: [], document: DEFAULT_WORLD};
}

function requireState(states, name, example) {
  const state = states.get(name);
  if (state === undefined) {
    throw new Error(`${describeExample(example)}: setup="${name}" names no earlier id= example`);
  }
  return state;
}

function stateFor(states, example) {
  const {setup} = example.directives;
  return setup === undefined ? emptyState() : requireState(states, setup, example);
}

async function replay(session, diagramId, steps, context) {
  for (const step of steps) {
    await session.callOrThrow(step.tool, {xml: step.body, diagramId}, `${context} setup`);
  }
}

function errorDiagnostics(report) {
  return (report.diagnostics ?? []).filter(diagnostic => diagnostic.severity === "error");
}

function assertNoErrors(report, context, what) {
  const failures = errorDiagnostics(report);
  if (failures.length > 0) {
    throw new Error(`${context}: ${what} reported errors\n${JSON.stringify(failures, undefined, 2)}`);
  }
}

function assertExpected(example, text) {
  const expected = example.directives.expect;
  if (expected !== undefined && !text.includes(expected)) {
    throw new Error(`${describeExample(example)}: result does not contain expect="${expected}"\n${text}`);
  }
}

export async function runExample(session, example, states) {
  const context = describeExample(example);
  const {tool} = example.directives;
  const state = stateFor(states, example);
  const diagramId = await session.newDiagram();
  await replay(session, diagramId, state.steps, context);

  if (tool === "path") {
    return runPathExample(session, example, diagramId, context);
  }
  if (tool === "set_style") {
    return runStyleExample(session, example, diagramId, context, state);
  }
  return runXmlExample(session, example, diagramId, context, tool);
}

// Principle 3: a fragment normalize_diagram accepts must mean the same thing to
// insert, which is the tool a reader reaches for after preflighting one. So an
// insert example is preflighted and then actually inserted, and only a fragment
// that survives both is a taught fragment.
async function runXmlExample(session, example, diagramId, context, tool) {
  const document = tool === "set_diagram" ? example.body : wrapFragment(example.body);
  const preflight = parseReport(
    (await session.callOrThrow("normalize_diagram", {xml: document, diagramId}, context)).text,
  );
  assertNoErrors(preflight, context, "normalize_diagram");
  if (tool === "normalize_diagram") {
    return assertExpected(example, JSON.stringify(preflight));
  }
  const applied = await session.callOrThrow(tool, {xml: example.body, diagramId}, context);
  assertExpected(example, applied.text);
}

function wrapFragment(fragment) {
  return `<diagram><canvas>${fragment}</canvas></diagram>`;
}

async function runPathExample(session, example, diagramId, context) {
  const document = wrapFragment(`${PATH_SEED}${example.body}`);
  const report = parseReport(
    (await session.callOrThrow("normalize_diagram", {xml: document, diagramId}, context)).text,
  );
  assertNoErrors(report, context, "normalize_diagram");
  assertExpected(example, JSON.stringify(report));
}

// A sheet is held to two things: set_style applies every declaration in it, and
// the XML <style> parser reads the same sheet the same way. One grammar per
// concept means preflighting a sheet with set_style has to predict what pasting
// it into XML will do.
async function runStyleExample(session, example, diagramId, context, state) {
  if (state.steps.length === 0) {
    await session.callOrThrow("set_diagram", {xml: DEFAULT_WORLD, diagramId}, `${context} setup`);
  }
  const report = parseReport((await session.callOrThrow("set_style", {style: example.body, diagramId}, context)).text);
  if ((report.skips ?? []).length > 0) {
    throw new Error(`${context}: set_style skipped declarations\n${JSON.stringify(report.skips, undefined, 2)}`);
  }
  if ((report.applied ?? []).length === 0) {
    throw new Error(`${context}: set_style applied nothing — the selector reaches nothing in this diagram`);
  }
  const styled = state.document.replace("</diagram>", `<style>${example.body}</style></diagram>`);
  const parsed = parseReport(
    (await session.callOrThrow("normalize_diagram", {xml: styled, diagramId}, context)).text,
  );
  assertNoErrors(parsed, context, "the same sheet inside a <style> block");
  assertExpected(example, JSON.stringify(report));
}
