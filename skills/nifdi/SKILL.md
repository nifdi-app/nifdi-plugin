---
name: nifdi
description: Author and edit nifdi block-and-connector diagrams — architecture diagrams, flowcharts, system and network diagrams — through the nifdi-diagram MCP server. Use when building or changing a diagram of boxes and arrows, recreating one from a picture or a written description, or when a task mentions nifdi, .nifdi.svg files, diagrams-as-code, or the nifdi-diagram tools. Covers the block model, containment versus attachment, the placement grammar for labels and badges, the semantic style vocabulary, connectors and their labels, and the render-and-fix loop that keeps what you build looking like what you meant.
license: Apache-2.0
metadata:
  nifdi-mcp-version: "0.2.0"
---

# Building diagrams with nifdi

nifdi is a **structured** diagram editor: containers, text and icons, wired by paths.
Reach for it when the picture is boxes and arrows. It is not a vector canvas — the server
owns layout, and completes and repairs geometry rather than honouring pixel-exact
composition. Fighting that is the single most expensive mistake available here.

## The model in one screen

A diagram is a tree of **blocks** plus **paths** that wire them.

- **container** — a box that holds other blocks. Nesting is containment: a `<container>`
  holds its children directly, and there is no nested `<canvas>`.
- **text** — words.
- **icon** — artwork, referenced by `asset="library:name"` (find one with `search_icons`)
  or `asset="#asset-…"` for artwork already in the diagram.
- **path** — a connector between two blocks, wired through `<from>` and `<to>`.

Blocks carry `pos="x y"` and `size="w h"`, **both optional**. Omitted geometry is completed
by the server; a declared `pos` arranges blocks *against one another* rather than fixing
canvas coordinates. Style is a `<style>` block of `selector { property: value; }` rules with
nifdi's own semantic property names — not CSS.

## Keep the diagram id

There is no current diagram. `create_diagram` returns the id every diagram-scoped tool needs;
for an existing diagram, get that id from `list_diagrams`. Keep it and pass it as `diagramId`
on every call that reads, edits, preflights or renders that diagram. A pasted editor URL is also
accepted wherever `diagramId` is taken.

In a local workspace the id is the diagram's POSIX path relative to the workspace root. If the
file is moved or renamed, the old id stops working; call `list_diagrams` to find its new one.

```xml tool=insert
<container id="vpc" size="400 240"><text place="on top-edge">Production VPC</text>
  <icon id="api" asset="aws:amazon-ec2"><text>API server</text></icon></container>
```

That fragment shows the two relationships that matter, and they are **different**:

- `<icon>` is **inside** the container — containment. It lives in the box.
- `<text place="on top-edge">` is **attached** to the container — it is the box's title,
  riding its border, and it travels with the box.

## The one rule to internalise: attach labels, never place them beside

Text sitting beside, above or below an icon in the picture you are recreating **is that
icon's label**. A name across a container's top border **is that container's attached
child**. Author both as nested elements naming a `place` — never as a sibling text block
positioned next to the host.

This is not a style preference. Attachment is what makes a label travel when anything moves,
re-routes or reflows. A sibling text block is left behind by the first push, the first
re-route, the first resize — and then you pay to reposition it, every time, forever.

```xml tool=insert
<icon asset="aws:amazon-ec2"><text>Amazon EC2</text></icon>
```

A bare `<text>` inside an `<icon>` is the default caption below it. Name a side for anything
else. Connectors take labels the same way — a `<text>` nested inside the `<path>`.

If you have already authored a free text block beside an icon, that is repairable: delete it
and `set_text` the icon with `place` naming that side.

→ Full placement grammar, the slot rules, and the recipes (icon with a caption *and* a
corner badge, a title astride a border that carries its own label): **[references/placement.md](references/placement.md)**

## How to build one

Work incrementally and look at what you made.

1. **`create_diagram`** and keep the returned id, or use **`list_diagrams`** to find an
   existing one's id.
2. Pass that **`diagramId`** to every diagram-scoped call below. **`insert`** blocks — a
   fragment at a time, nested as the picture nests. Not
   `set_diagram`; reserve that for replacing a whole diagram.
3. **`connect`** to wire them.
4. **`set_style`** to style them. It is the most forgiving styling path and reports back
   every declaration it skipped.
5. **`render_diagram`** — and *look*.
6. Fix what you see, and render again before you call it finished.

Step 5 is not optional. You are building something visual, and layout, overlap, routing, a
caption that landed on the wrong host and a colour that reads wrong are all things the XML
can be right about and the picture wrong about. An agent that never renders is working
blind, and every sweep that worked blind shipped a diagram it would not have shipped.

→ The loop in full, preflight, recovery from a bad edit, undo and history:
**[references/workflow.md](references/workflow.md)**

## What each reference is for

| Read | When |
|---|---|
| [references/authoring-model.md](references/authoring-model.md) | Writing nifdi XML: blocks, ids, containment, geometry completion, canonical form, icons and assets, fonts |
| [references/placement.md](references/placement.md) | Attaching anything — labels, titles, badges. The `place` grammar, slots, chaining, worked recipes |
| [references/styling.md](references/styling.md) | Colour, borders, shadows, fonts. The semantic vocabulary, selectors, and the scope rules that decide what a later block inherits |
| [references/connectors.md](references/connectors.md) | Wiring blocks: `connect` modes, connector labels, what routing does and undoes |
| [references/workflow.md](references/workflow.md) | The build loop, preflighting, diagnosing a surprising result, undo and history |

## Working habits that pay

- **Read before you write.** `get_diagram` is the source of truth, and its output is the
  canonical shape to copy when writing XML back.
- **Keep the handle.** There is no remembered selection; carry `diagramId` from
  `create_diagram` or `list_diagrams` through the whole build loop.
- **Preflight anything large.** `normalize_diagram` parses without editing and reports what
  it would do. What it accepts, `insert` and `set_diagram` honour.
- **Believe the result, not your intent.** Every tool reports what actually happened, and
  says when it skipped or substituted something. That sentence is the cheapest debugging you
  will get; read it rather than assuming the call did what you asked.
- **Let the server place things.** Omit `pos`/`size` where you do not care. Declared
  geometry that fights the content floor lands on the floor, and the result says so.
- **`insert` never replaces.** A fragment naming an id that is already taken is added under
  a *generated* id, and the substitution is reported. To edit an existing block, use
  `set_text` / `set_style` / `move` / `resize` on it, or `delete` it first.
