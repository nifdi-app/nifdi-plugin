import {readFile, readdir} from "node:fs/promises";
import {join} from "node:path";

const FENCE = /^```(\S*)([^\n]*)\n([\s\S]*?)\n?```$/gm;
const DIRECTIVE = /([a-z][a-z-]*)=(?:"([^"]*)"|(\S+))/g;

export const TOOLS = ["insert", "set_diagram", "normalize_diagram", "set_style", "path", "skip"];

function parseDirectives(info) {
  const directives = {};
  for (const [, key, quoted, bare] of info.matchAll(DIRECTIVE)) {
    directives[key] = quoted ?? bare;
  }
  return directives;
}

function lineOf(source, index) {
  return source.slice(0, index).split("\n").length;
}

export function collectExamples(source, file) {
  const examples = [];
  for (const match of source.matchAll(FENCE)) {
    examples.push({
      file,
      line: lineOf(source, match.index),
      language: match[1],
      directives: parseDirectives(match[2]),
      body: match[3].trim(),
    });
  }
  return examples;
}

async function markdownFiles(directory) {
  const entries = await readdir(directory, {withFileTypes: true, recursive: true});
  return entries
    .filter(entry => entry.isFile() && entry.name.endsWith(".md"))
    .map(entry => join(entry.parentPath ?? entry.path, entry.name))
    .sort();
}

export async function collectSkillExamples(skillsRoot) {
  const files = await markdownFiles(skillsRoot);
  const examples = [];
  for (const file of files) {
    examples.push(...collectExamples(await readFile(file, "utf8"), file));
  }
  return examples;
}
