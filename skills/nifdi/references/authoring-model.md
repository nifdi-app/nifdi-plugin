# The authoring model

nifdi XML, in depth: what a block is, how geometry is resolved, how ids behave, and where
artwork and fonts come from.

## Canonical XML is the contract

`get_diagram` returns the **canonical** form. Every tolerated shorthand is normalised there,
so its output is the shape to copy when writing XML back. Do not add a `version` attribute
when authoring; it is not required.

A whole diagram:

```xml tool=set_diagram
<diagram>
  <title>Request path</title>
  <canvas>
    <container id="edge" pos="0 0" size="240 120"><text>Edge</text></container>
    <container id="core" pos="320 0" size="240 120"><text>Core</text></container>
    <path><from block="#edge" attach="right"/><to block="#core" attach="left"/></path>
  </canvas>
  <style>container { fill-colour: #eef2ff; border-colour: #6366f1 }</style>
</diagram>
```

`set_diagram` also accepts tolerant wrappers — direct diagram children as implicit canvas
content, a root `title="…"`, endpoint `side="…"`, bare or `#`-prefixed block ids. They are all
normalised on the next read. Prefer the canonical shape in new XML anyway: it is the one
shape you never have to check.

A `<style>` block counts wherever you write it — inside the container it styles is fine.
Position carries no meaning.

## Geometry is completed, not obeyed

`pos="x y"` and `size="w h"` are space-separated numbers, and **both are optional on every
block**. This is the single most useful property of the surface, and the one agents most
often decline to use.

- **Omit both** and the server places and sizes the block.
- **Declare `pos`** and you are arranging blocks *relative to one another*, not fixing canvas
  coordinates. The result tells you where each block actually landed.
- **Declare `size`** and you get it, unless the block's own contents plus their margins
  overflow it — then it lands on that floor instead, and the result says what landed. To go
  smaller, shrink the contents first: a label's margin or font-size, an icon's size.

```xml tool=insert
<container><text place="on top-edge">Sized to fit its title</text>
  <icon asset="iconoir:cloud"><text>No coordinates anywhere</text></icon></container>
```

Trying to lay a diagram out by absolute coordinates is fighting the engine. Express the
*structure* — what nests inside what, what attaches to what, what connects to what — and let
geometry completion resolve the rest. Then look at the render, and nudge only what is wrong.

## Containment

A `<container>` holds its `<container>`/`<text>`/`<icon>` children directly. There is no
nested `<canvas>`. A container child with no `place` attribute is contained as usual; one
that names a `place` is attached to the border instead (see
[placement.md](placement.md)).

```xml tool=insert
<container id="region" size="520 260"><text place="on top-edge">eu-west-1</text>
  <container id="subnet" size="200 140"><text place="on top-edge">Private subnet</text>
    <icon asset="aws:amazon-ec2"><text>App</text></icon></container></container>
```

Containment is what makes a group move as a group, and what a descendant style selector
walks. Prefer one container per real boundary in the system — a VPC, a trust zone, a
service — over a container drawn because two things happen to sit near each other.

## Ids

- An id you declare is **kept**, when it is free and a valid XML id. Name the blocks you will
  refer to later; it costs nothing and makes every subsequent call readable.
- Naming an id that is **already taken does not replace that block**. The fragment is added
  under a generated id and the substitution is reported as a diagnostic. This reads easily as
  "replaced" — it is not.
- To edit an existing block, address it by id with `set_text`, `set_style`, `move` or
  `resize`, or `delete` it and insert again. Re-inserting `get_diagram` output is not an edit.
- Ids you do not declare are generated. Class names you author are preserved; other class
  names in a read are generated compression and may change between reads, so never write a
  call against one.

## Icons and assets

An `<icon>` must carry an asset reference.

- `asset="library:name"` — a bundled library icon. Find one with `search_icons` rather than
  guessing a name; the alias vocabulary is broad, and a guessed name that misses renders a
  placeholder box.
- `asset="#asset-…"` — artwork already in the diagram (ids come from `get_diagram`) or
  registered with `add_asset`.

```xml tool=insert
<icon asset="aws:amazon-ec2" size="48 48"><text>Amazon EC2</text></icon>
```

Plain nifdi XML cannot carry new artwork: an `<assets>` block in XML is ignored, and an
unknown asset id renders as a placeholder. `add_asset` is the way in — fetch the artwork,
then supply it. `set_background` handles a background image or colour.

A placeholder in a render is always reported in the accompanying text. If you see one, the
reference did not resolve; do not assume it is a rendering artifact.

## Fonts

Text cannot be measured or drawn without the typeface's bytes. **Inter, Assistant, Roboto and
Noto Sans are built in** — the families nifdi's own content and shipped icon libraries use,
so an ordinary diagram never asks you for a font.

In an online local workspace, the server fetches another Google Fonts face the first time a
diagram uses it. If that fetch is unavailable or the server is offline, the edit **fails and
names the family and weight still owed** — it never silently substitutes Inter, because a
diagram measured against a font it does not use has wrong wrap widths, wrong block sizes and
wrong baselines everywhere.

When `add_font` is offered, it is the manual route: pass the Google Fonts family, the face's
weight, and base64-encoded TTF or OTF bytes. WOFF and WOFF2 are not accepted. A shared remote
deployment may withhold this process-global tool, so believe the advertised tool list rather
than assuming it exists. Reading is exempt — `get_diagram` on a diagram with missing fonts still
works, which is how you find out what to supply.

## What the diagram is on disk

Diagrams persist as **augmented SVG** (`.nifdi.svg`): the canonical XML plus a rendered
picture, so one file is both the editable model and a viewable image. `get_diagram` with
`format: "svg"` returns that self-contained form. Neither format is a picture you can look at
in-band — for that, `render_diagram`.
