---
description: Show the K'NEX catalogue, the physics model and the build rules
allowed-tools: Bash(node:*), Read
---

Run `node cli.js parts` and present it.

If the user asked about a specific thing, answer from it directly and point at the drawing:
`docs/catalog/connector_W8.png` and its siblings show every connector face-on with its socket numbering,
`docs/catalog/rods.png` is the length ladder, `docs/catalog/joints.png` is what each joint lets move.

Related: `node cli.js span a b` for what rod fits a distance, `node cli.js spring` for spring stiffness,
`node cli.js arc` for how tightly a chain of rods can be curved.
