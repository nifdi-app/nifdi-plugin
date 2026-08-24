# nifdi — collaborative diagrams for you and your coding agent

Agent-led diagrams with fine-grained control. [nifdi](https://nifdi.app) gives
coding agents tools to create and edit architecture, flow, system and network diagrams. It also
bundles a visual web editor for precise, hands-on refinement. Ask your agent to open the
editor—in its built-in browser (where supported) and choose the best
interaction for each change.

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

The plugin installs both the nifdi MCP server and its diagram-authoring skills.

### Codex

Add the nifdi marketplace, then install the plugin:

```sh
codex plugin marketplace add nifdi-app/nifdi-plugin
codex plugin add nifdi@nifdi-plugin
```

Start a new Codex task after installation. You can also open `/plugins` in Codex CLI or use
the Plugins browser in the ChatGPT desktop app.

### Claude Code

```sh
claude plugin marketplace add nifdi-app/nifdi-plugin
claude plugin install nifdi@nifdi-plugin
```

Start a new Claude Code session after installation.

### Other MCP and Agent Skills clients

If your client supports [Agent Skills](https://agentskills.io), install or copy the complete
`skills/nifdi/` directory, including its `references/` directory. Then configure the nifdi
server as a local MCP server using this stdio command:

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

When the client supplies its current project root, nifdi writes `.nifdi.svg` files there.
Otherwise, set `NIFDI_ROOT` to the directory where diagrams should be stored.

## Contributing

Provider conventions, worked recipes and skills for more diagram genres are especially welcome.
See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution guide and local checks.

## Licence

Licensed under [Apache-2.0](LICENSE).
