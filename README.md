# knex-cad

**CAD, a geometry checker and a rigid-body physics engine for classic K'NEX.** Write a model as a few
lines of text, and the tool refuses anything that will not snap together with real parts, simulates it
with gravity, friction, contact and bending, draws instruction sheets, and shows it in a browser.

![the example rig](docs/patterns/demo-mech.png)

It exists because designing K'NEX by eye wastes an evening on spans that do not exist and joints that
cannot hold. Two facts cause almost every mistake: **rod lengths come only from the `37.5 × √2ⁿ` ladder**,
and **a connector is a plane, not a point**. The checker enforces both, by line number.

## Quickstart

```bash
git clone https://github.com/MAXMARDONES/knex-cad && cd knex-cad
./build.sh                                    # bundle the engine into dist/knex.js
node cli.js parts                             # the whole catalogue: rods, connectors, joints, physics, rules
node cli.js builds/rig.knx                    # check a model, with every problem by line number
node cli.js sim builds/rig.knx --press "finger left"=1
node cli.js render builds/rig.knx out.svg --view iso
./build_viewer.sh builds/rig.knx && open docs/viewer.html
```

No dependencies for the engine, the CLI or the viewer. Python with `cairosvg` is optional, for turning the
SVG output into PNG.

## What a model looks like

Coordinates are in lattice units of 37.5 mm. Rod colour is inferred from the distance, so a rod is two
names. **Leave the connector's plane out and the tool works it out from the rods you attach.**

```
T  A tilting bed
!  base frame                  # a build step: the viewer and the instructions use these
C  A W8 -2,-2,0                # connector: name, kind, position, [plane normal, [socket-0 direction]]
R  A B                         # rod between two connectors
R  A B red beam                # a rod allowed to bend: a force element, not rigid structure
H  P W8 0,-2,0 z               # a hub on the rod through that point: a bearing that spins and slides
S  C W8 1,-2,0 z               # a connector clipped side-on to a rod
P  0.5,-2,0 silver             # spacer
X  mouse 0,0,0.5 62,117,38 mass=85 pad=2,0   # a prop that collides with the model
F  DF 0,0,-3 finger            # an external force you can press in the sim
E  band A B rest=40            # rubber band, pulls only
Y  cord T1 ball via=P4         # string over guides: a pulley
M  motor HUB rpm=45 torque=400 # motor at a bearing
G  g1 HUB teeth=34             # gear on an axle; two that touch drive each other
L  HUB                         # tan clip: locks a connector to its rod
O  ball 0,0,1.5 d=25 mass=40   # a ball
A  FOOT                        # clamp a node to the table
W  ballast N1 mass=250         # hang a weight
I  W8=60 blue=20               # what you own; the parts list is checked against it
```

Full grammar in [docs/DSL.md](docs/DSL.md).

## The physics

A maximal-coordinate rigid-body engine with sequential impulses, in about 900 lines of dependency-free
JavaScript. It runs in the CLI and in the browser from the same source.

- **Bodies** come from the rigid partition: end-on joints and 3D pairs weld parts together, everything
  else is a real degree of freedom.
- **Bearings** spin and slide, with friction, and lock axially when a spacer or cap sits against them.
- **Bending rods** are rigid along their length and springy across it, as compliant constraints rather
  than stiff springs, so a chain of them stays stable.
- **Flexi rods buckle** with a near-constant `π²EI/L²`.
- **Contact** against the table and against props and balls, with Coulomb friction per surface: cloth pad,
  rubber pad, varnished wood, laminate, glass.
- **Mechanisms:** motors with a torque limit, gear meshes, strings over pulleys, rubber bands, tan-clip
  locks, hung weights, table anchors.
- **Failure:** a joint loaded past what the plastic holds pops, live, and the event is reported. Capacity
  is directional — strong pushing the rod into its socket, weak prying it out of the plane.

```
node cli.js sim builds/rig.knx --surface desk-wood --press "finger front"=1 --seconds 1.5
node cli.js sim builds/demo_mech.knx           # motor, gears, string, band and ball
```

## Drawing and instructions

The renderer is a painter's-algorithm CAD drawing with no browser and no WebGL, so it is deterministic and
scriptable.

```bash
node cli.js render builds/rig.knx out.svg --view iso --labels
node cli.js instructions builds/rig.knx docs/instructions   # one sheet per step, new parts highlighted,
                                                            # with the parts list for that step
```

Views: `iso iso2 front back left right top low`. Masking: `--hide props,joints,rods,conns,spacers,loads`.

![a build step](docs/instructions/step05.png)

## The viewer

`./build_viewer.sh builds/rig.knx` writes a single self-contained `docs/viewer.html`: the model in 3D, a
step slider that builds it up with a parts list and a camera that walks around, clickable issues that fly
to the offending part, a parts table checked against your inventory, an editor, and a **Physics tab** that
runs the same engine live — press a finger pad and watch the rig tilt, the bearings load and the rods bend.

Publish it as a Claude Artifact with the `db` capability and it will pick up new builds pushed from the
CLI while you work.

## Learn the system

- [docs/ENGINEERING.md](docs/ENGINEERING.md) — what the geometry forces on you, where stiffness comes from,
  why there are no springs in the box, and the mistakes we made building the example.
- [docs/PATTERNS.md](docs/PATTERNS.md) — twelve validated patterns with drawings: triangulated square, cube
  corner, A-frame, bearing, leaf spring, zigzag spring, gear pair, slider, curved chain, ladder beam,
  tan-clip lever, pendulum.
- [docs/catalog/](docs/catalog) — every connector drawn face-on with its socket numbering, the rod ladder,
  and what each joint lets move.
- [research/KNEX.md](research/KNEX.md) — dimensions from the Glickman patents and measured parts, with
  sources.
- [research/TECHNIQUES.md](research/TECHNIQUES.md) — how people actually build, from the K'NEX User Group's
  hints and the ball-machine community.

## For agents

[skill/SKILL.md](skill/SKILL.md) is a Claude Code skill. Drop it in `.claude/skills/knex/` and an agent can
design, check, simulate and draw K'NEX without further explanation. [AGENTS.md](AGENTS.md) is the short
version for any coding agent working in this repo.

## Helpers

```bash
node cli.js span 0,0,0 0,3,0      # what rod fits a distance, or how to split it
node cli.js spring                # stiffness of every spring configuration
node cli.js arc --rod blue        # how tightly a chain of rods can be curved before the sockets let go
node cli.js parts --json          # the whole catalogue as JSON
./scripts/patterns.sh             # validate and redraw the pattern library
python3 scripts/catalog.py        # redraw the part catalogue
```

## Accuracy

Lengths, socket depth, connector thickness and hub diameter come from US patents 5,061,219 / 5,199,919 /
5,350,331 and from measured parts, cross-checked against the K'NEX User Group. Those you can trust.

The flexi modulus, the rod's second moment of area, the socket capacities, the hub and surface friction and
the rubber band rate are **estimates**; no source publishes them. Force numbers are useful as ratios and
trends, not as certified values. `node cli.js parts` lists which is which.

## Licence

MIT. K'NEX is a trademark of K'NEX Limited Partnership Group; this project is not affiliated with them.
