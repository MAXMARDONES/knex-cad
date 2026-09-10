# Working in this repo

`knex-cad` turns text into buildable classic K'NEX, checks the geometry, simulates it and draws it.
Read these before you design anything:

1. **[docs/ENGINEERING.md](docs/ENGINEERING.md)** — the rules the geometry forces on you, where stiffness
   comes from, and the mistakes already made here. This is the file that saves you the most time.
2. **[docs/PATTERNS.md](docs/PATTERNS.md)** — twelve validated patterns with drawings. Copy one rather than
   inventing a node.
3. **`node cli.js parts`** — the catalogue, the physics model and the build rules in one page.
4. **[docs/DSL.md](docs/DSL.md)** — the full `.knx` grammar.
5. **[skill/SKILL.md](skill/SKILL.md)** — the same guidance packaged as a Claude Code skill.

## The two rules that prevent most errors

- **Rod lengths come only from the ladder:** 37.5, 53.03, 75, 106.07, 150, 212.13 mm. A span of 3 U does
  not exist. Ask `node cli.js span a b` when unsure.
- **A connector is a plane.** All eight sockets lie in it; a rod along its normal goes through the hub and
  spins free. **Leave the normal off the `C` line** and the solver derives it from the rods you attach, and
  tells you when they are not coplanar and you need a 3D pair.

## How to work

Build in small steps. Add a `!` step, append ten or twenty lines, run `node cli.js <build>`, fix what it
reports by line number, then continue. A model written all at once usually has a dozen impossible spans.

Always finish by simulating: `node cli.js sim <build>`. The physics has caught a fork passing through the
payload, springs preloading bearings eight times past their capacity, and a rig with nothing holding it
level. None of those are visible in the geometry check.

## Layout

```
engine/     the engine, numbered by load order, concatenated into dist/knex.js by ./build.sh
  01-06     catalogue, vectors, parser, solver, checker, entry point
  07        mass properties and the rigid-body partition
  09-13     physics: bodies, world, solver, collision, mechanisms
viewer/     the 3D bench, assembled into docs/viewer.html by ./build_viewer.sh
scripts/    catalogue drawings, the CAD renderer, the CLI reference pages, pattern build
builds/     example models. rig.knx is the worked example; demo_mech.knx exercises every mechanism
patterns/   one technique each, all validated by ./scripts/patterns.sh
research/   dimensions with sources, and building techniques
```

After changing anything in `engine/`, run `./build.sh` before the CLI will see it.
