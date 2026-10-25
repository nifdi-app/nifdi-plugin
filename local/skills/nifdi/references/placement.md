# Placement: attaching labels, titles and badges

Attachment is how a block belongs to another block's *border* rather than to its inside. An
attached block carries **no `pos`** — its position derives from the host, the `place`, the
`gap`, and (for some placements) one free coordinate along the edge.

Get this right and labels travel with their hosts through every move, re-route and reflow.
Get it wrong — a sibling text block parked next to an icon — and you repay the positioning
cost on every subsequent edit.

## The two categories

Every placement is one of two kinds, and the difference is whether it has a **slot**.

### Fully fixed — one per site

`place="<corner>"` and `place="outside-middle <edge>"` are derived wholly from the host.
Each is a **slot**: one attachment per corner, one per edge middle. Asking for an occupied
slot is an error naming the occupant.

Corners: `top-left-corner`, `top-right-corner`, `bottom-left-corner`, `bottom-right-corner`.
Edges: `top-edge`, `right-edge`, `bottom-edge`, `left-edge`.

A **bare edge name abbreviates `outside-middle`**. So `place="bottom-edge"` is the exclusive
centred caption below the host — the default for a `<text>` nested in an `<icon>`:

```xml tool=insert
<icon asset="aws:amazon-ec2"><text>Amazon EC2</text></icon>
```

```xml tool=insert
<icon asset="aws:amazon-ec2"><text place="right-edge">Amazon EC2</text></icon>
```

### Part fixed — unlimited per edge

`place="on <edge>"` (astride the border) and `place="outside <edge>"` (clear of it, by
`gap="n"`) carry a **free host-relative coordinate** along the edge — `x` on a horizontal
edge, `y` on a vertical one — and have **no slot**. Any number of blocks share one edge, and
push physics separates them.

```xml tool=insert
<container id="mod" pos="0 0" size="320 120"><text place="on top-edge" x="120">Module</text>
  <icon asset="iconoir:cloud" place="on top-edge" x="20"/></container>
```

A title and a badge, on the same border, each by its own `x`.

### Adding a word never changes the category

This is the part worth memorising, because the two spellings look alike and behave
oppositely:

| Spelling | Category | Slot | Position |
|---|---|---|---|
| `place="bottom-edge"` | fully fixed (abbreviates `outside-middle bottom-edge`) | one only | centred |
| `place="outside bottom-edge"` | part fixed | unlimited | free `x`, `gap` clear of the border |
| `place="on bottom-edge"` | part fixed | unlimited | free `x`, astride the border |
| `place="bottom-left-corner"` | fully fixed | one only | the corner |

If you hit "slot already taken", you do not need to demote the attachment to a corner your
reference picture does not show — switch to the `on`/`outside` spelling of the same edge and
give it an `x`.

## Chaining: an attached block is itself a host

Placements nest. This is the point of the model, and it expresses things no flat label can.

```xml tool=insert
<container id="module" pos="0 0" size="400 120">
  <icon asset="iconoir:cloud" place="on bottom-edge" x="180" size="48 48">
    <text place="outside-middle bottom-edge">Process module</text></icon></container>
```

An icon straddling a container's border, carrying its own caption below it.

**The axis rule:** a nested placement may *agree* with its host's placement on an axis, or be
*neutral*, but never *oppose* it. An icon attached at a container's `bottom-edge` may carry a
caption further down (`bottom-edge` agrees on y); a caption at `top-edge` would point back
into the host and is rejected — and the rejection names the axis, so read it rather than
guessing again.

## Recipes

### A box with a title across its border

```xml tool=insert
<container id="vpc" size="360 200"><text place="on top-edge" x="24">Production VPC</text></container>
```

Astride the border and free along it, so a badge can share that edge later.

### An icon with a caption *and* a corner badge

```xml tool=insert
<icon id="db" asset="iconoir:cloud" pos="0 0" size="48 48">
  <text>Primary database</text>
  <text place="top-right-corner">3</text></icon>
```

The bare `<text>` takes the centred caption slot below; the badge takes the corner slot. Two
attachments, two different slots, no conflict.

On an icon that already exists, `set_text` with a `place` addresses one site and touches
nothing else there — so `place: "top-right-corner"` on a captioned icon *adds* a badge rather
than moving the caption.

### An icon in a box's corner, carrying its own label

```xml tool=insert
<container id="svc" pos="0 0" size="320 160">
  <icon asset="iconoir:cloud" place="top-left-corner" size="32 32">
    <text place="left-edge">Managed</text></icon></container>
```

The icon takes the container's top-left corner slot; its label chains off it to the left,
which agrees with the corner on the x axis.

### Several labels down one side

```xml tool=insert
<container id="stack" pos="0 0" size="240 300">
  <text place="outside right-edge" y="40" gap="12">ingress</text>
  <text place="outside right-edge" y="150" gap="12">worker</text>
  <text place="outside right-edge" y="260" gap="12">egress</text></container>
```

`outside <edge>` has no slot, so all three share the edge, each at its own `y`, each clear of
the border by its `gap`.

## Moving and repairing labels

- **To move an existing label**, name *that text's own id* (from `get_diagram`) in `set_text`
  with the `place` to move it to and **no `content`** — it keeps its words.
- **To repair a label authored the wrong way round** — a free text block already sitting
  beside an icon — `delete` it, then `set_text` the icon with `place` naming that side. The
  read tools point these out: a free text sitting where a caption would sit beside an
  unlabelled icon is named in the diagnostics, with the `set_text place=` that would fix it.
  Nothing is attached on your behalf; adjacency does not settle the question, so the surface
  suggests and you decide.

## `place` is not `insert`'s `where`

They are different grammars for different jobs, and the names rhyme enough to mislead.

- **`place`** (an XML attribute, or `set_text`'s parameter) declares an ongoing
  *attachment*. It is managed: the block stays there.
- **`where`** (`insert`'s parameter) is one-shot *insertion ergonomics*. Its `anchor`,
  `relation: "inside" | "outside"`, `between` and `end` resolve to a coordinate at insert
  time and manage nothing afterwards. `relation: "inside"` means containment, and against a
  non-container it is an error. Centred is spelled by *omitting* the anchor.

If you want a label that stays put relative to its host, you want `place`, not `where`.

## Connector labels use a third grammar

A path's label is a `<text>` nested inside the `<path>`, and its placement grammar is
`<on|outside>? midpoint <left|right|above|below>?` — `"on midpoint"` (the default, breaking
the stroke) or `"outside midpoint above"` (beside the line; the side is relative to the
hosting run's axis). See [connectors.md](connectors.md).
