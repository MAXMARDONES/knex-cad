---
description: Check a K'NEX build for geometry that cannot be assembled
---

Check the K'NEX build at `$1` (default `builds/rig.knx`).

1. Run `knex-cad "$1"`. The wrapper rebuilds the engine itself if it is stale.
2. Report each error with its line number and what to do about it. The two that come up most:
   - a span that is not on the `37.5 × √2ⁿ` ladder: run `knex-cad span a b` for the split
   - rods at a node that are not coplanar: that node needs two 3D connectors with planes at 90°
3. If the build is clean, say so and suggest `/knex:sim` next, because the geometry check cannot see
   a rig that will not hold itself up.
