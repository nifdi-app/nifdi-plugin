# Workflow: building a diagram well

The order you do things in changes how much work the diagram costs. This is the loop that
works, and the habits that make each step cheap.

## The loop

1. **`create_diagram`** (or `list_diagrams` / `select_diagram` to pick up an existing one).
   Diagrams live as `.nifdi.svg` files in the workspace directory.
2. **Structure first.** `insert` the blocks, nested as the picture nests, with labels
   *attached* — not positioned. Omit geometry you do not care about.
3. **Wire it.** `connect`, choosing `chain` when direction matters.
4. **Style it.** `set_style`, starting with bare type rules for the diagram-wide look, then
   classes for subsystems, then ids for exceptions.
5. **`render_diagram` and look at it.**
6. **Fix what you see**, and render again. Once more before you call it finished.

Structure before style, always. Styling a layout you have not looked at is styling something
you cannot see.

## Rendering is how you find out

`render_diagram` returns the diagram as a PNG, drawn by **nifdi's own renderer** — the same
one the live editor and the saved file use — so drop-shadows, rounded borders, markers and
icon artwork are all as they will be.

You are building something visual. These are all defects the XML is *right* about and the
picture is wrong about:

- blocks overlapping, or a container that grew and swallowed a neighbour
- a connector routed around the long way, or crossing the diagram
- a caption that landed on the wrong host, or outside the box it belongs to
- text overflowing its block, or wrapped where it should not be
- colours that read wrong together, or a label unreadable on its background
- a placeholder box where an icon should be — the reference did not resolve

Render **after the first few blocks land** (so a structural mistake costs three blocks, not
thirty), **after each batch of edits**, and **once before you finish**.

Two things not to do:

- **Do not rasterize the augmented SVG yourself.** General-purpose rasterizers — librsvg,
  ImageMagick, Inkscape — drop or misrender effects such as drop-shadow and rounded borders,
  so a PNG converted that way is not what the diagram looks like.
- **`open_editor` is for showing a human**, not for looking yourself. It opens a live browser
  editor; it does not put the picture in front of you.

The render's accompanying text reports the pixel size, the diagram's own size, the scale, and
any artwork shown as a placeholder. Read it. Ask for a larger `width` only when you need to
read fine detail on a large diagram.

## Preflight anything large

`normalize_diagram` parses tolerant XML, reports diagnostics, and returns the canonical XML
that `set_diagram` would commit — **without editing anything**. What it accepts, the mutating
tools honour, so a clean preflight is a real prediction rather than a hope.

Use it before a `set_diagram`, and any time you are unsure whether a shorthand is understood.
It costs one call and can save a rebuild.

## Read the result, not your intent

Every tool reports what it actually did. This is the cheapest debugging available, and the
sweeps that ignored it paid for it repeatedly.

- **`insert`** returns the resolved XML — where each block *landed*, with generated ids and
  any id substitution. If you named an id and the result shows a different one, that block
  was added alongside the existing one, not merged into it.
- **`set_text`** names each target's actual outcome: set, created inside, attached a new
  label, created a caption, labelled a connector, or skipped and why. A create that lands
  beside an existing label names that label, so a second attachment is never mistaken for a
  move.
- **`set_style`** returns `applied` and `skips`. Skips are per declaration.
- **`connect`** returns the ids it created, and nothing else counts as success.
- **`resize`** says what landed when an axis hit the content floor.
- **`move`** says per block when physics absorbed part of a delta.

A summary that surprises you is information. Do not re-issue the call hoping for a different
sentence.

## Recovery

- **`undo` / `redo`** step the diagram's history. Every mutation has a way back.
- **`get_history`** shows the op log — what was done, in order. Use it when the diagram is in
  a state you did not expect and you need to find the edit that put it there.
- **`delete`** then re-`insert` is the reliable way to replace a block, because `insert` never
  replaces one.

Prefer undo to a corrective edit when a call did something structural you did not intend.
Correcting forwards leaves the mistake in the geometry; undoing removes it.

## Working in a folder

The server treats a directory as the workspace: `create_diagram`, `list_diagrams` and
`select_diagram` map onto `.nifdi.svg` files in it. Under Claude Code that directory is the
project root, so diagrams land in the repo you are working in and diff, review and merge like
any other file — the git drivers diff and merge them on the canonical XML rather than on the
rendered picture.

That has a design consequence worth acting on: a diagram in a repo is a **maintained
artifact**. Name your blocks with ids that will still make sense to whoever edits it next,
use classes to mark out subsystems rather than styling twenty containers individually, and
express structure through containment and attachment so that the next person's edit does not
scatter the labels.

## When something is genuinely not expressible

Say so rather than approximating it with free-floating blocks. A caption faked as a sibling,
an arrow label parked on a line, a group drawn as an unfilled rectangle around things that
are not inside it — each of these looks right in exactly one render and breaks on the next
edit. If the model cannot say the thing, the honest output is a diagram that says what it
can, plus a note about what it could not.
