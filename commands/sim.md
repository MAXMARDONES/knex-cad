---
description: Simulate a K'NEX build with gravity, friction, bending and contact
argument-hint: "[path to a .knx file] [--press \"name\"=1] [--surface desk-wood]"
allowed-tools: Bash(node:*), Bash(./build.sh:*), Read
---

Simulate the K'NEX build at `$1` (default `builds/rig.knx`) with any extra flags the user passed.

Run `node cli.js sim $ARGUMENTS`, then read the result and say plainly:

- what actually moved, and how far
- which bearings carry the most load, and whether anything is near the estimated socket capacity
- whether any joint popped, and what overloaded it
- whether the rig is holding itself level, or drifting because nothing centres it

Surfaces: `mousepad-cloth mousepad-rubber desk-wood desk-laminate glass`. Push a declared `F` point with
`--press "name"=gain`. Add `--free-base` to let the whole rig tip, `--trace` for a time series.

Remember the force numbers rest on estimates. Report them as ratios and trends.
