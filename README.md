<a href="https://nifdi.app"><picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://nifdi.app/images/longtail_logo.svg">
  <img src="https://nifdi.app/images/longtail_logo-black.svg" alt="nifdi" height="80">
</picture></a>

# nifdi™ — collaborative diagrams for you and your coding agent

**[Download nifdi (hosted)](https://github.com/nifdi-app/nifdi-plugin/releases/latest/download/nifdi.zip)**
or **[nifdi-local](https://github.com/nifdi-app/nifdi-plugin/releases/latest/download/nifdi-local.zip)**
— one plugin per ZIP. Browse [all releases](https://github.com/nifdi-app/nifdi-plugin/releases)
for the complete repository source bundle (`nifdi-plugin.zip`).

Agent-led diagrams with fine-grained control. [nifdi](https://nifdi.app) gives
coding agents tools to create and edit architecture, flow, system and network diagrams. It also
bundles a visual web editor for precise, hands-on refinement. Ask your agent to open the
editor—in its built-in browser (where supported) and choose the best
interaction for each change - type/speak or point with your mouse.

Your agent and the editor work on the same structured `.nifdi.svg` file, so you can move
between natural-language requests and WYSIWYG editing without flattening the diagram into a
generated image. This plugin combines the `@nifdi/mcp` diagram tools and bundled editor with
skills for layout, labels, styling, connectors and a render-and-review workflow.

## What you can do

- Build a diagram from a description or an existing image.
- Make wholesale changes through follow-up requests, then fine-tune visually in the editor.
- Use provider icon libraries for architecture diagrams.
- Keep the result as a structured file that both the editor and your coding agent can edit again.

## Install

This marketplace holds two plugins. Each installs one nifdi MCP server and the same
diagram-authoring skills.

| Plugin | Diagrams | Account |
|---|---|---|
| `nifdi` | in the nifdi cloud: shared, and edited live in the browser at nifdi.app | [nifdi Pro](https://nifdi.app/pricing); you sign in on first use |
| `nifdi-local` | `.nifdi.svg` files in your project, which diff and merge like code | none |

Install whichever you need, or both: the skills say which to use for what.

Each plugin uses the portable [Agent Plugins format](https://developers.openai.com/plugins/build/plugins):
`plugin.json` identifies it, `mcp.json` configures its server, and `skills/` contains its skills.
OpenAI listing settings live in `plugin.json` under `extensions.com.openai.interface`.
The `.claude-plugin/plugin.json` and `.mcp.json` files retain Claude compatibility.

For ChatGPT web, the hosted plugin needs the public MCP submission and review flow.
Directly importing a ZIP with MCP server declarations marks it Desktop only, even for an HTTPS
server. To test the hosted tools on the web, use Add custom MCP server with
`https://nifdi.app/api/mcp`. See the [OpenAI testing guide](https://developers.openai.com/plugins/deploy/connect-chatgpt).

> **Upgrading from 0.2?** The plugin called `nifdi` used to be the local one. It now connects
> to the hosted server. To keep working on files in your project, install `nifdi-local`, and
> uninstall `nifdi` unless you have nifdi Pro.

### Claude Code

```sh
claude plugin marketplace add nifdi-app/nifdi-plugin
claude plugin install nifdi@nifdi-plugin
```

Start a new session, run `/mcp`, choose `plugin:nifdi:nifdi` and sign in to nifdi in the
browser. For local files, install `nifdi-local@nifdi-plugin` instead; it needs no sign-in.

### Codex

```sh
codex plugin marketplace add nifdi-app/nifdi-plugin
codex plugin add nifdi@nifdi-plugin
codex mcp login nifdi
```

Start a new Codex task after installation. For local files, add `nifdi-local@nifdi-plugin`
instead. You can also open `/plugins` in Codex CLI or use the Plugins browser in the ChatGPT
desktop app.

To sign in as a different nifdi account, sign out of nifdi in your browser first: otherwise the
browser's existing session signs the client straight back in.

### Other MCP and Agent Skills clients

If your client supports [Agent Skills](https://agentskills.io),
[download the latest release](https://github.com/nifdi-app/nifdi-plugin/releases/latest/download/nifdi-plugin.zip)
and install or copy the complete `skills/nifdi/` directory, including its `references/`
directory. Then configure a nifdi server. The hosted one is an HTTP MCP server that signs in with
OAuth:

```sh
claude mcp add --transport http nifdi https://nifdi.app/api/mcp
```

The local one is a stdio server:

```sh
npx -y @nifdi/mcp@latest
```

A common client configuration shape is:

```json
{
  "mcpServers": {
    "nifdi-diagram": {
      "command": "npx",
      "args": ["-y", "@nifdi/mcp@latest"],
      "env": {
        "NIFDI_ROOT": "/absolute/path/to/your/diagrams"
      }
    }
  }
}
```

MCP standardises the server protocol and stdio transport, but clients use different
configuration files and installation interfaces. Translate the command, arguments and
environment variables into your client's MCP configuration.

Clients that support MCP but not Agent Skills can still use the server; they simply will not
receive the additional authoring guidance bundled with this repository.

## Try it

Ask your agent:

- “Create a three-tier web architecture diagram with a load balancer, API service and database.”
- “Recreate this architecture screenshot as an editable nifdi diagram.”
- “Add a cache beside the database and route read traffic through it.”
- “Open the diagram editor so I can fine-tune the layout.”

With `nifdi-local`, nifdi writes `.nifdi.svg` files to the project root the client supplies.
Otherwise, set `NIFDI_ROOT` to the directory where diagrams should be stored.

## Contributing

Provider conventions, worked recipes and skills for more diagram genres are especially welcome.
See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution guide and local checks.

## Licence

Licensed under [Apache-2.0](LICENSE).

nifdi™ is a trademark of Nifdi Systems Limited. The licence does not grant permission to use it.
