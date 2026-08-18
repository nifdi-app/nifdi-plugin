// The diagram a `tool=set_style` or `tool=path` example is run against when it
// names no `setup=`. Every selector a skill quotes without setting up its own
// world has to reach something here, which is what stops a dead selector from
// being taught as a live one.
export const DEFAULT_WORLD =
  "<diagram><canvas>" +
  '<container id="box" pos="0 0" size="200 120"><text>Queue</text></container>' +
  '<container id="vpc" pos="300 0" size="320 220">' +
  '<text id="title" place="on top-edge" x="24">VPC</text>' +
  '<icon id="server" asset="iconoir:cloud" size="48 48"><text>App server</text></icon>' +
  "</container>" +
  '<path id="p0"><from block="#box" attach="right"/><to block="#vpc" attach="left"/><text>events</text></path>' +
  "</canvas></diagram>";

// A <path> means nothing without endpoints, so a path example is read with two
// blocks seeded — the same treatment the server's own description-contract test
// gives the path examples it quotes.
export const PATH_SEED =
  '<container id="a" pos="0 0" size="100 60"/><container id="b" pos="200 0" size="100 60"/>';
