import {mkdtemp, readFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";
import {Client} from "@modelcontextprotocol/sdk/client/index.js";
import {StdioClientTransport} from "@modelcontextprotocol/sdk/client/stdio.js";

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export async function readManifest() {
  return JSON.parse(await readFile(join(repoRoot, ".claude-plugin", "plugin.json"), "utf8"));
}

// The harness runs the server the manifest installs, so what CI proves and what
// a user gets are the same artifact. NIFDI_MCP_SPEC replaces the pinned npm spec
// with a local build or a tarball, which is how the pair is tested before a
// release of either half reaches npm.
export async function serverCommand() {
  const manifest = await readManifest();
  const {command, args} = manifest.mcpServers["nifdi-diagram"];
  const override = process.env.NIFDI_MCP_SPEC;
  if (override === undefined) {
    return {command, args};
  }
  return {command, args: ["-y", "--package", override, "nifdi-mcp"]};
}

export async function startServer() {
  const {command, args} = await serverCommand();
  const workspace = await mkdtemp(join(tmpdir(), "nifdi-plugin-"));
  const transport = new StdioClientTransport({
    command,
    args,
    env: {
      ...process.env,
      NIFDI_ROOT: workspace,
      NIFDI_PORT: "off",
      NIFDI_OPEN_BROWSER: "false",
      NIFDI_OFFLINE: "true",
    },
  });
  const client = new Client({name: "nifdi-plugin-contract", version: "1.0.0"});
  await client.connect(transport);
  return new Session(client, workspace);
}

export class Session {
  constructor(client, workspace) {
    this.client = client;
    this.workspace = workspace;
  }

  async close() {
    await this.client.close();
  }

  async call(name, args) {
    const result = await this.client.callTool({name, arguments: args});
    const text = (result.content ?? [])
      .filter(block => block.type === "text")
      .map(block => block.text)
      .join("\n");
    return {isError: result.isError === true, text};
  }

  async callOrThrow(name, args, context) {
    const result = await this.call(name, args);
    if (result.isError) {
      throw new Error(`${context}: ${name} failed\n${result.text}`);
    }
    return result;
  }

  async newDiagram() {
    const result = await this.callOrThrow("create_diagram", {}, "create_diagram");
    return JSON.parse(result.text).id;
  }
}

export function parseReport(text) {
  const start = text.indexOf("{");
  if (start < 0) {
    throw new Error(`no JSON report in tool result:\n${text}`);
  }
  let depth = 0;
  for (let index = start; index < text.length; index += 1) {
    if (text[index] === "{") {
      depth += 1;
    }
    if (text[index] === "}") {
      depth -= 1;
      if (depth === 0) {
        return JSON.parse(text.slice(start, index + 1));
      }
    }
  }
  throw new Error(`unterminated JSON report in tool result:\n${text}`);
}
