# Styling

nifdi's style vocabulary is **semantic, not CSS**. The property names are nifdi's own, in
British `-colour` spelling, and CSS names like `fill`, `stroke` and `color` are not the
property names (though several CSS spellings are accepted where they mean something
unambiguous).

`set_style` is the most forgiving way to style: it takes canonical semicolon declarations,
applies what it can, and **reports back every declaration it skipped**. Prefer it over
hand-writing style classes in XML whenever you are unsure of a name.

The examples below are written against this diagram:

```xml tool=set_diagram id=world
<diagram><canvas>
  <container id="vpc" pos="0 0" size="360 220"><text id="vpcTitle" place="on top-edge" x="24">VPC</text>
    <icon id="server" asset="iconoir:cloud" pos="40 60" size="48 48"><text>App server</text></icon></container>
  <container id="box" pos="440 0" size="200 120"><text>Queue</text></container>
  <path id="p0"><from block="#vpc" attach="right"/><to block="#box" attach="left"/></path>
</canvas></diagram>
```

## The vocabulary

Declarations are `property: value;` — semicolons. (Commas are legacy XML compatibility only.)
Colours are hex, and `none`/`transparent` are real values where a thing can be absent.

| On | The properties you will reach for |
|---|---|
| container | `fill-colour`, `border-colour` (both take `none`/`transparent`), `border-width`, `border-style` (solid\|dashed), `corner-radius`, `margin-general`, `drop-shadow`, `mode` (open\|group) |
| text | `text-colour`, `font-size`, `font-weight`, `font-family` (a Google font), `text-alignment` (start\|middle\|end), `wrap-width`, `letter-spacing` |
| icon | `icon-colour` (a hex, or `natural`), `margin-general` |
| path | `path-colour`, `path-width`, `line-style` (solid\|dashed), `path-corner-radius`, `marker-start`, `marker-end` |
| canvas | `canvas-fill-colour`, `canvas-pattern-type` (none\|dots\|grid), `canvas-pattern-size`, `canvas-pattern-colour` |

`set_style`'s own parameter description carries the **complete** list, including every
shadow and marker longhand, and it is delivered whole to every client — read it there rather
than guessing at a name. `drop-shadow` and `marker-end` also take shorthands:

```text tool=set_style setup=world
container { drop-shadow: 2 2 4 #000000 0.25 }
path { path-colour: #64748b; path-width: 2; marker-end: triangle 12 16 2 }
```

An unfilled box is a real state — say so rather than faking it by matching the parent's hex,
and rather than `border-width: 0`, which loses the width you will want back:

```text tool=set_style setup=world
#box { fill-colour: none; border-colour: #6366f1; border-width: 2 }
```

## Selectors

Selectors compose as in CSS: whitespace for descendant, `>` for child, `*` for any type,
commas to group.

```text tool=set_style setup=world
#vpc text { text-colour: #111827; font-size: 12 }
#box, #p0 { stroke: #e11; stroke-width: 3 }
```

The effective parent a selector walks reads **containment and attachment as the same
"inside"**. So `#server text` is that icon's caption, and `#p0 text` is a connector's label —
you do not need the label's id to style it.

```text tool=set_style setup=world
#server text { font-weight: bold }
```

The same selector language works inside an XML `<style>` block. That is a deliberate
guarantee: a sheet you preflight with `set_style` means the same thing pasted into XML. A
selector that matches nothing warns rather than vanishing.

## The scope rule — what a later block inherits

This is the part with real consequences, and it is easy to get backwards.

- **A bare type rule** — `container { … }`, `text { … }`, `icon { … }`, `path { … }` — says
  what *the diagram's* containers or texts look like. Its values are **shared**, and a block
  you insert later **inherits them**.
- **Every narrower rule** — a `.class`, an `#id`, a descendant or child selector, `*` — is a
  statement about the elements it names. Its values **stay on those elements**. They are
  never folded into a bare type rule however many elements they happen to cover, and never
  inherited by a block you did not name.
- Setting the same property through a type rule **afterwards takes that scope back off**.

So: to establish a diagram's look before you build it, use type rules. To mark out one
subsystem, use a class. Styling every container individually by id and expecting the next
container to match is the mistake this rule predicts.

```text tool=set_style setup=world
container { fill-colour: #eef2ff; border-colour: #6366f1; corner-radius: 8 }
text { font-size: 13; text-colour: #1e293b }
```

## Classes

A class name you author is a **group that survives the round trip**. The elements carrying it
come back carrying it, and `set_style ".name { … }"` later reaches exactly them.

```xml tool=insert setup=world id=classed
<container class="trustBoundary" size="300 180"><text place="on top-edge">DMZ</text></container>
```

```text tool=set_style setup=classed
.trustBoundary { border-style: dashed; border-colour: #f59e0b; fill-colour: none }
```

- A class name with no rule yet is kept as a group to style in a later call.
- A block naming a class the diagram already carries **joins it** and arrives styled by its
  declarations.
- A text inserted inside a member of a styled class takes that class's text styling.
- Where a member's value has since been changed to something the class no longer describes,
  the override appears as a further class after the authored name in that element's class
  list.

**Class names you did not author are generated compression** and may change freely between
reads. Never write a call against one.

## Degradation

Both `set_style` and the XML `<style>` parser degrade **per declaration**, not per call. One
malformed value is reported as a skip alongside declarations that did not apply; the rest of
the sheet still lands. Only an unresolvable selector or an empty sheet fails the call.

Which means: read the `skips` in the result. A sheet that "worked" while quietly skipping
half its declarations is the failure mode this reporting exists to make visible.
