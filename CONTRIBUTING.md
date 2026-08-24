# Contributing

This repo holds the *teaching* layer for nifdi diagrams. Contributions are welcome —
especially provider conventions, worked recipes, and genre skills (flowcharts, network
diagrams, sequence-style layouts).

The MCP server remains usable without these skills, because a raw MCP client never sees them.
Nothing required for correct tool use therefore belongs only in a skill: tool behaviour,
accepted inputs and errors stay in the server, while this repo carries deeper explanations,
recipes, visual judgement and provider conventions.

## Repository layout

```
.claude-plugin/                 Claude Code plugin and marketplace metadata
.codex-plugin/ and .mcp.json   Codex plugin and MCP server metadata
.agents/plugins/               the Codex repo marketplace
skills/nifdi/                  the core skill and its progressively loaded references
test/                          contract CI for every fenced skill example
```

## The two rules

### 1. Testable, or cut

A claim about what nifdi *does* needs a fenced example that CI runs. Craft judgement — "prefer
one container per trust boundary", "put the title astride the border so a badge can share the
edge" — needs no test and is exactly what this repo is for. The line is:

| Claim | Needs |
|---|---|
| "prefer X over Y, because it reads better" | nothing; it is judgement |
| "the server will do X when you write Y" | a fenced example, executed by CI |

A pull request asserting the second kind without a runnable example will be asked for one.
This is not bureaucracy: the skills live in a **different repo** from the code whose behaviour
they describe, version independently, and are read by agents that cannot check them. Words
getting ahead of behaviour is the failure this repo is built to prevent.

### 2. A behaviour defect is fixed in the server, not here

Once a teaching layer exists, every problem looks fixable by adding prose to it. It is not.

If a tool misbehaves, **report it against the server**. A skill that teaches agents to work
around a broken tool hides the defect from every client that does not load skills, and from
the bare evaluation configuration that is supposed to catch it. Workaround prose will be
declined with a pointer to the server issue.

## Fenced examples

Every fenced block in a skill declares how it is checked. That rule is enforced by
`npm run test:structure`, and it is rule 1 made mechanical.

````markdown
```xml tool=insert
<icon asset="aws:amazon-ec2"><text>Amazon EC2</text></icon>
```
````

### Directives

| Directive | Meaning |
|---|---|
| `tool=insert` | A fragment. Preflighted with `normalize_diagram`, then actually inserted. |
| `tool=set_diagram` | A whole `<diagram>` document. Preflighted, then committed. |
| `tool=normalize_diagram` | Preflight only, for XML shown but not committed. |
| `tool=set_style` | A stylesheet. Run through `set_style` (no skips, something applied) **and** through an XML `<style>` block, because the two must be one grammar. |
| `tool=path` | A bare `<path>`, read with two blocks seeded — a path means nothing without endpoints. |
| `tool=skip why="…"` | Not executable (a shell command, a JSON snippet, illustrative pseudo-XML). The reason is required. |
| `id=<name>` | Names the state this example produces, for others to start from. Only on `insert` / `set_diagram`. |
| `setup=<name>` | Replays an earlier `id=` example first, then runs this one. States compose. |
| `expect="…"` | A substring the tool's own report must contain. Use it when the prose claims an outcome. |

An example with no `setup=` runs against an empty diagram — except `set_style` and `path`
examples, which run against a small built-in world (`test/lib/worlds.mjs`) holding a
container, a nested labelled icon and a labelled connector. If your selectors need something
else, set up your own world with a `tool=set_diagram id=…` fence and point at it. That is
usually better teaching anyway: the reader sees the diagram the sheet is written against.

## Running the checks

```sh
npm install && npm test
```

`npm test` needs the pinned `@nifdi/mcp` from npm. To run against a local server build
instead:

```sh
NIFDI_MCP_SPEC=../nifdi-app/mcp npm run test:examples
```

`NIFDI_MCP_SPEC` accepts anything `npx --package` does: a directory, a `.tgz`, or an npm spec
such as `@nifdi/mcp@latest`.

The skills record the server version they were tested against, and both client manifests pin
that same version so an install receives a coherent pair. A scheduled run also checks the skills
against `@nifdi/mcp@latest`, catching a server release that invalidates a recipe before an agent
encounters it while making a diagram.

## Adding a skill

Skills follow the [Agent Skills spec](https://agentskills.io/specification). Structure:

```
skills/<name>/
├── SKILL.md          index: what this covers, and when to read which reference
└── references/       the depth, loaded on demand
```

Constraints CI enforces:

- `name` matches the directory, ≤64 chars, lowercase alphanumeric and single hyphens.
- `description` ≤1,024 characters, and it is the **only** thing an agent sees before deciding
  to load the skill. Say what it does *and when to use it*, with the words a matching task
  would contain.
- Frontmatter stays on the spec's six fields: `name`, `description`, `license`,
  `compatibility`, `metadata`, `allowed-tools`. Claude-Code-only extensions are rejected by
  claude.ai and the Skills API, and cross-client reach is why the skills are in this format at
  all.
- `SKILL.md` body ≤500 lines. Move depth into `references/`.
- `metadata.nifdi-mcp-version` matches the server pinned in `.claude-plugin/plugin.json`.

Keep references one level deep from `SKILL.md`, and keep each one focused — an agent loads a
whole reference file to answer one question.

## What belongs in a provider skill

Not "how do I attach a caption" — the core skill covers that. A provider skill answers **what
a good AWS / Azure / GCP diagram looks like, and which nifdi vocabulary produces it**: the
grouping conventions, the iconography, the palette, the layout norms those providers publish,
translated into nifdi recipes.

Being wrong about a convention is cheap to catch — check any claimed convention against the
providers' own published diagrams before asserting it.

## Style

Write for an agent that will act on what you say, in prose that a human reviewer can check.
Say what to do and why it pays; name the failure mode a rule prevents. Avoid restating what a
tool description already carries — the tool descriptions are delivered whole to every client,
and duplicating them here means two places to go stale.
