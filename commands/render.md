---
description: Draw a K'NEX build, or generate the full instruction set
argument-hint: "[path to a .knx file] [--view iso|front|left|top] [--step N]"
allowed-tools: Bash(node:*), Bash(./build.sh:*), Read
---

Draw the K'NEX build at `$1`.

- A single view: `node cli.js render "$1" out.svg --view iso --labels`
- Every step as an instruction sheet: `node cli.js instructions "$1" docs/instructions`

Views: `iso iso2 front back left right top low`. Masking: `--hide props,joints,rods,conns,spacers,loads`.
The renderer needs no browser, so use it whenever you want to look at something.

If `cairosvg` is installed, convert to PNG and show the image. Then describe what the drawing shows,
rather than only handing over a path.
