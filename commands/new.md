---
description: Start a new K'NEX build from a validated pattern
argument-hint: "[name] [what you want to build]"
allowed-tools: Bash(node:*), Read, Write, Edit
---

Start a new K'NEX build called `$1`.

1. Read `docs/PATTERNS.md` and pick the patterns that match what the user described. Copy from
   `patterns/*.knx` rather than inventing a node.
2. Write `builds/$1.knx` with a title, and the first `!` step only.
3. Run `node cli.js builds/$1.knx` and fix anything it reports.
4. Add the next step, ten or twenty lines, check again, and keep going. Never write the whole model at
   once: it will have a dozen impossible spans in it.
5. Leave the connector planes off the `C` lines and let the solver derive them.
6. Finish with `node cli.js sim builds/$1.knx` and a `node cli.js render`.

Coordinates are in lattice units of 37.5 mm. Integer coordinates give green, blue and red spans; face
diagonals give white, yellow and grey. A span of 3 U does not exist.
