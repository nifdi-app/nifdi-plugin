# The hosted server: diagrams in the nifdi cloud

The server named `nifdi`, at `https://nifdi.app/api/mcp`, keeps diagrams in the nifdi cloud. They
belong to the person's nifdi account, open in the browser at `nifdi.app`, and can be shared with
other people there. The client signs in to that account with OAuth the first time it connects.

Everything in the rest of this skill applies unchanged: the model, placement, styling, connectors
and the build loop are the same on both servers. This page covers only what follows from where the
diagrams live.

## Ids

A cloud diagram's id is a short code, such as `Kq3vR8xTn2Wd`, returned by `create_diagram` and
listed by `list_diagrams`. It does not change when the diagram is renamed. A pasted link of the form
`https://nifdi.app/diagram/nifdi-cloud/Kq3vR8xTn2Wd` is accepted wherever `diagramId` is taken, so
when the person hands you a link, pass it as it is.

`list_diagrams` lists the diagrams the account owns and the ones shared with it. An id that
stops working was deleted, or its owner stopped sharing it.

## Showing the person a diagram

`editor_url` returns the diagram's `https://nifdi.app/diagram/nifdi-cloud/<id>` link, and refuses
an id the account cannot open. Give the link to
the person: they open it signed in to nifdi, see your edits live, and can edit alongside you. To
look at the diagram yourself, call `render_diagram`.

Sharing happens in the app, not through a tool. To give someone else access, the owner opens the
diagram and adds their email address there.

## Refusals that are for the person, not for you

Some refusals name something only the person can do. Every tool returns the same text until they
have done it, so tell them what it says and stop. Retrying, or trying other tools, changes nothing.

- **The Free plan.** Connecting an agent to nifdi is part of nifdi Pro. A Free account's every call
  is refused with a message naming the account and the upgrade page. Once the person has upgraded,
  the next call works; the client does not need to reconnect. A Free account can still use the
  local server, `nifdi-diagram`, on files in the project.
- **The Terms of Service.** An account that has not accepted the current Terms is refused with the
  page to accept them on.

To connect as a different nifdi account, the person signs out of nifdi in their browser first.
Otherwise the browser's existing session signs the client straight back in as the same account.

## The read limit

Reads — `get_diagram`, `render_diagram`, `list_diagrams`, `normalize_diagram`, `get_source`,
`get_history`, `search_icons` and `editor_url` — are limited per account, across every agent the
person has connected. Over the limit, a read is refused with a tool error that says how long to
wait. Edits are never limited.

When that happens, carry on with any edits already planned, and read again after the wait. Do not
retry the read in a loop: every retry inside the window is refused too.

The limit is far above what the build loop needs. Hitting it usually means a loop is reading
without acting on what it reads, so check that before waiting.
