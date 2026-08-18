# Connectors

A connector is a `<path>` wiring two blocks through `<from>` and `<to>` child elements — each
naming a block id and a side. It is **not** SVG path syntax, and you do not draw the line:
routing physics does, and re-does it whenever anything moves.

```xml tool=path
<path><from block="#a" attach="right"/><to block="#b" attach="left"/></path>
```

## Making them: `connect`, not hand-authored XML

`connect` takes a list of block ids and runs the app's routing physics. Two modes:

- **`auto` (the default)** groups the blocks into rows/columns *by their geometry* and
  connects every block in each band to every block in the next. Blocks feeding one hub become
  a fan; two columns become a bipartite spread. It takes the ids as a set and lets geometry
  choose each arrow's direction.
- **`chain`** connects the ids pairwise **in the order given**, and each arrow points that
  way: `ids[0]→ids[1]→ids[2]→…`.

Choose `chain` when **direction or sequence matters** — a pipeline, a request path, a state
machine — or when `auto` cannot separate the blocks, which is what happens when one is nested
inside another. Choose `auto` when you have a shape (a fan-in, a fan-out, two tiers) and want
the geometry to decide.

Pairs already connected are left alone in both modes.

## Read what `connect` reports

The result names the connector ids it **created**. A pair that was already connected, or one
`auto` could not rank, simply does not appear there.

This reporting is deliberately literal, and it is the thing to check:

- "created no connectors" means nothing landed — it is not an explanation, and it does not
  claim the pairs were already connected.
- Pairs are named as already-connected only when a connector between them was actually found.
- In `chain` mode, a named pair left with no connector — none before, none after — is a
  failure, and it **leads** the summary ahead of whatever else landed.

So a `chain` call over five ids that reports four connectors is telling you something. Do not
read past it.

## Labelling a connector

`connect` takes no label itself. Two ways in:

**On an existing connector** — `set_text` with the path's id creates the label, or updates it
if the connector already has one.

**Inline in XML** — nest the label inside the `<path>`, with no `pos`/`size`, so nifdi places
it on the line and keeps it there when the path re-routes:

```xml tool=path
<path><from block="#a" attach="right"/><to block="#b" attach="left"/><text>Transformed data</text></path>
```

**Never fake an arrow label with a free-floating text block.** A labelled connector carries
its label as the path re-routes; a text block parked on top of the line is left stranded by
the first change to the diagram.

A connector's label can be a `<container>` rather than a `<text>` when the label needs a
background — same nesting, same rules.

### Where on the line

The label placement grammar is `<on|outside>? midpoint <left|right|above|below>?`:

- `"on midpoint"` — the default; the label breaks the stroke.
- `"outside midpoint above"` — beside the line. The side is relative to the **hosting run's
  axis**, not to the page.

Style a connector's label without knowing its id: `#p0 text` reaches it, because a path's
label counts as inside it.

```text tool=set_style
#p0 text { font-size: 11; text-colour: #475569 }
```

## Arrowheads and line style

Markers and stroke live in the style layer, on `path`:

```text tool=set_style
path { path-colour: #64748b; path-width: 2; marker-end: triangle 12 16 2; line-style: dashed }
```

Marker styles: `triangle`, `dart`, `square-chevron`, `round-chevron`, `clipped-chevron`,
`flat-chevron`, `chamfer`, `square-cap`, `round-cap`, `circle`, `ring` — plus `none`.
`marker-start` takes the same. A bidirectional arrow is a `marker-start` and a `marker-end`
on the same path.

`path-margin` controls how closely paths bundle when several run together; `clearance` how
far they keep from blocks. Reach for those when a render shows connectors crowding, rather
than moving blocks to make room.

## Direction is semantic — set it once, correctly

`reverse` flips a connector's direction. If a render shows an arrow pointing the wrong way,
reverse it rather than deleting and re-connecting: re-connecting re-runs routing and may
change more than the one thing you meant to fix.

## Routing is not yours to place

Paths re-route on every move, resize and reflow. That is the point — the diagram stays
correct as it changes. It also means:

- Do not author `segments` by hand to force a route. Let physics route, look at the render,
  and if the result is wrong, fix the *geometry* that made it wrong (a block in the way, a
  container too tight) rather than the line.
- A connector attached to a side (`attach="right"`) is a hint about where it leaves the
  block, and the router honours it while it can.
