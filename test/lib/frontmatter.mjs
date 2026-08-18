// The spec's six fields, and only these: claude.ai and the Skills API reject
// Claude-Code-only extensions with an error, and cross-client reach is the whole
// reason the skills are in this format rather than in the server's instructions.
export const SPEC_FIELDS = ["name", "description", "license", "compatibility", "metadata", "allowed-tools"];

export function parseFrontmatter(source, file) {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(source);
  if (match === null) {
    throw new Error(`${file}: no YAML frontmatter`);
  }
  const fields = {};
  let nested;
  for (const line of match[1].split("\n")) {
    if (line.trim() === "") {
      continue;
    }
    const indented = /^\s+(\S+):\s*(.*)$/.exec(line);
    if (indented !== null && nested !== undefined) {
      nested[indented[1]] = unquote(indented[2]);
      continue;
    }
    const top = /^([a-z][a-z-]*):\s*(.*)$/.exec(line);
    if (top === null) {
      throw new Error(`${file}: cannot read frontmatter line: ${line}`);
    }
    if (top[2] === "") {
      nested = {};
      fields[top[1]] = nested;
      continue;
    }
    nested = undefined;
    fields[top[1]] = unquote(top[2]);
  }
  return {fields, body: source.slice(match[0].length)};
}

function unquote(value) {
  return /^"(.*)"$/.test(value) ? value.slice(1, -1) : value;
}

export function validateName(name) {
  if (name.length < 1 || name.length > 64) {
    return "must be 1-64 characters";
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
    return "must be lowercase alphanumeric and single hyphens, not starting or ending with one";
  }
  return undefined;
}
