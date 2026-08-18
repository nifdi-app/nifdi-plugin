# nifdi plugin

The [nifdi](https://nifdi.app) diagram plugin: the `@nifdi/mcp` diagram server bundled with the
**skills** that teach it — the model in depth, the placement grammar, worked recipes, and the
build loop that keeps what you build looking like what you meant.

The server is the verb surface. The skills are the craft. They install as one thing.

## Install

```sh
claude plugin marketplace add nifdi-app/nifdi-plugin
```

```sh
claude plugin install nifdi@nifdi-plugin
```

That registers this repo as a marketplace and installs the plugin: the `nifdi-diagram` MCP
server (launched with `npx -y @nifdi/mcp@<pinned>`) plus the skills, loaded progressively by
your client as a task calls for them.

Under Claude Code no directory configuration is needed — it injects the project root, and
diagrams land as `.nifdi.svg` files in the repo you are working in. On a client that does not,
set `NIFDI_ROOT` to the folder you want them in.

The server alone, without the teaching layer, remains installable exactly as before:

```sh
claude mcp add nifdi-diagram -s project -- npx -y @nifdi/mcp@latest
```

## What is in here

```
.claude-plugin/plugin.json       the plugin: pins the server version, ships the skills
.claude-plugin/marketplace.json  the single-plugin marketplace
skills/nifdi/                    the core skill: the model, placement, styling, connectors, workflow
test/                            contract CI — every fenced example, through the pinned server
```

The core skill's `SKILL.md` is an index at the same altitude as the server's own instructions;
the depth lives in `skills/nifdi/references/`, which a client loads only when the path it took
needs it.

## The bare server still stands alone

Skills are optional context — a raw MCP client never sees them. So **nothing an agent needs
for correct tool use lives only in a skill**. What lives here is the unbounded layer: model
deep-dives, recipes, style judgement, provider conventions. The contract — what each tool
does, accepts and rejects — stays in the server, delivered to every client.

The corollary matters more: **a behaviour defect is fixed in the server, never papered over
in a skill.** A skill that teaches agents to route around a broken tool hides the defect from
every bare-MCP client. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Skills are contracts too

Every fenced example in every skill is executed by CI through the published `@nifdi/mcp` — the
same round-trip discipline the server applies to its own quoted examples, applied from the
outside. A recipe whose XML no longer parses, or whose claimed outcome no longer matches what
the tool reports, fails the build.

The skills pin the server version they were tested against and the manifest pins both
together, so an install is a coherent pair. A scheduled run tests the skills against
`@nifdi/mcp@latest` as well, so a server release that invalidates a recipe is detected here
rather than discovered by an agent mid-diagram.

```sh
npm install && npm test
```

To run the contract against a server build that is not on npm — a local checkout, a tarball,
a release candidate — point `NIFDI_MCP_SPEC` at it:

```sh
NIFDI_MCP_SPEC=../nifdi-app/mcp npm run test:examples
```

> **Status.** `@nifdi/mcp@0.1.1` — the version this repo pins — is not yet published to npm.
> Until it is, the install commands above and the pinned CI job cannot resolve the server, and
> the contract runs only via `NIFDI_MCP_SPEC`.

## Contributing

Provider conventions — what a *good* AWS, Azure or GCP diagram looks like, and which nifdi
vocabulary produces it — are the flagship contribution surface: valuable, bounded, and needing
no access to nifdi internals. [CONTRIBUTING.md](CONTRIBUTING.md) has the bar and how to run
the checks locally.

## Licence

[Apache-2.0](LICENSE). The nifdi application itself is closed; this teaching layer is open.
