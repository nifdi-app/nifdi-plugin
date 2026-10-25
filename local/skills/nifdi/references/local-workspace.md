# The local server: diagrams in a folder

The server named `nifdi-diagram`, run on this machine by `npx @nifdi/mcp`, keeps diagrams as
`.nifdi.svg` files in a folder: the workspace. It needs no account.

Everything in the rest of this skill applies unchanged: the model, placement, styling, connectors
and the build loop are the same on both servers. This page covers only what follows from where the
diagrams live.

## Ids are paths

The server treats a directory as the workspace: the project root the client supplies, or the
folder named by `NIFDI_ROOT`. `create_diagram` writes a new `.nifdi.svg` in its root.
`list_diagrams` finds `*.nifdi.svg` at any depth, plus plain `*.svg` files directly in the root;
it does not enter hidden folders, `node_modules` or symlinks.

A diagram's id is its POSIX path relative to the workspace root — for example
`design/architecture/system.nifdi.svg` — never an absolute path or one containing `..` or
backslashes. If the file is moved, renamed or deleted outside nifdi, the old id stops working and
refuses to recreate the file at the old path; call `list_diagrams` to find its new path.

## Showing the person a diagram

`editor_url` returns the address of the browser editor this server runs on the same machine,
`http://127.0.0.1:<port>/…`. Give it to the person, or open it with a browser tool of your own.
It works only on this machine, and only while the server runs.

## Diagrams in the repository

When the client supplies its project root, diagrams land in the repo you are working in and
diff, review and merge like any other file — the git drivers diff and merge them on the
canonical XML rather than on the rendered picture.

That has a design consequence worth acting on: a diagram in a repo is a **maintained
artifact**. Name your blocks with ids that will still make sense to whoever edits it next,
use classes to mark out subsystems rather than styling twenty containers individually, and
express structure through containment and attachment so that the next person's edit does not
scatter the labels.
