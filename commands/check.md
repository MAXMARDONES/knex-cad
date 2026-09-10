---
description: Check a K'NEX build for geometry that cannot be assembled
argument-hint: "[path to a .knx file, default builds/rig.knx]"
allowed-tools: Bash(node:*), Bash(./build.sh:*), Read, Edit
---

Check the K'NEX build at `$1` (default `builds/rig.knx`).

1. Run `./build.sh` if `dist/knex.js` is missing or older than anything in `engine/`.
2. Run `node cli.js "$1"`.
3. Report each error with its line number and what to do about it. The two that come up most:
   - a span that is not on the `37.5 × √2ⁿ` ladder: run `node cli.js span a b` for the split
   - rods at a node that are not coplanar: that node needs two 3D connectors with planes at 90°
4. If the build is clean, say so and suggest `/knex:sim` next, because the geometry check cannot see
   a rig that will not hold itself up.
