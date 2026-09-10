---
name: knex
description: Design real, buildable classic K'NEX — rods, connectors, axles, gears, springs, gimbals, frames — as compact .knx text that is geometry-checked, simulated with full rigid-body physics (gravity, friction, contact, bending, motors, strings, rubber bands, breakage, external forces you place yourself), drawn as instruction sheets, and shown live in a 3D viewer. Use whenever someone wants to build something out of K'NEX, edit a K'NEX build, or find out whether a K'NEX mechanism will actually work.
---

# Building and simulating in classic K'NEX

The toolchain lives in the `knex-cad` repo. A build is one `.knx` text file. The engine turns it into
geometry, names every joint, refuses anything that cannot be snapped together with real parts, runs it as
a physics model, and draws it.

## Read these first, in this order

```bash
node cli.js parts            # catalogue, physics model and build rules on one page
open docs/PATTERNS.md        # twelve validated patterns, each with a drawing
open docs/ENGINEERING.md     # what the geometry forces on you, and the mistakes already made
open docs/catalog/           # every connector face-on with its socket numbers; the rod ladder; the joints
```

`docs/patterns/*.png` are the visual references: triangulated square, cube corner, A-frame tower, axle in
a bearing, leaf spring, zigzag spring, gear pair, linear slider, curved chain, ladder beam, tan-clip lever,
ball on a string. **Copy a pattern rather than inventing a node.** `docs/catalog/connector_W8.png` and its
siblings show the socket numbering, which is the thing people get wrong.

## The two rules that prevent almost every error

1. **Rod lengths come only from the ladder:** 37.5, 53.03, 75, 106.07, 150, 212.13 mm, which is
   `37.5 × √2^(n-1)`. Work in lattice units of 37.5 mm. Integer coordinates give green (1 U), blue (2 U)
   and red (4 U); face diagonals give white, yellow and grey. **A span of 3 U does not exist** — split it
   2 + 1 with a connector between. When unsure: `node cli.js span 0,0,0 0,3,0`.
2. **A connector is a plane, not a point.** All eight sockets lie in it, and a rod along its normal goes
   through the hub and spins free. **Leave the normal off the `C` line** and the solver derives the plane
   from the rods you attach and tells you when they are not coplanar and you need a 3D pair.

Then: squares brace and rectangles do not; every arm is 18.75 mm long and unused arms hit things; a free
rod end stops 10 mm short of the point you declare; names are unique; two connectors can only share a
centre if both are 3D with planes at 90°.

## Writing a build

Coordinates in lattice units. Rod colour is inferred from the distance. Full grammar in `docs/DSL.md`.

```
T  A tilting bed
!  base frame                  # a build step; the viewer and the instruction sheets use these
C  A W8 -2,-2,0                # connector: name, kind, position, [plane, [socket-0 direction]]
R  A B                         # rod between two connectors; colour inferred
R  A B red beam                # a rod allowed to bend: a force element, not rigid structure
R  A B flexi-yellow            # a flexi rod: it buckles and bows
H  P W8 0,-2,0 z               # hub on the rod through that point: a bearing that spins and slides
S  C W8 1,-2,0 z               # connector clipped side-on to a rod: a friction pivot
P  0.5,-2,0 silver             # spacer, 3.1 blue or 9.3 silver
X  mouse 0,0,0.5 62,117,38 mass=85 mu=0.25 pad=2,0    # a prop that collides with the model
O  ball 0,0,1.5 d=25 mass=40   # a ball
F  DF 0,0,-3 finger front      # an external force you can press in the sim
E  band A B rest=40            # rubber band: pulls only
Y  cord T1 ball via=P4         # string over guides: a pulley
M  motor HUB rpm=45 torque=400 # motor at a bearing, torque-limited so it stalls like the real one
G  g1 HUB teeth=34             # gear on an axle; two that touch drive each other
L  HUB                         # tan clip: locks a connector to its rod so they turn together
A  FOOT                        # clamp a node to the table so the rig cannot tip or slide
W  ballast N1 mass=250         # hang a weight: ballast, counterweight, test load
I  W8=60 blue=20 red=12        # what you own; the parts list is checked against it and shortfalls flagged
```

Kinds: `W8 B7 Y5 G4 P4 R3 L2 O2 D1`. Directions: `x -y z x+y -x-z` or a raw vector. Any point can be
relative: `NAME@dx,dy,dz`.

Joints are never declared — they are read off the geometry, which is why a build that passes is a build
that snaps together.

## Checking, simulating, drawing

```bash
node cli.js builds/rig.knx                                    # every problem, by line number
node cli.js sim builds/rig.knx --surface desk-wood --press "finger left"=1 --seconds 1.5
node cli.js render builds/rig.knx out.svg --view iso --labels --hide props
node cli.js instructions builds/rig.knx docs/instructions     # a sheet per step, new parts highlighted
knex-cad view                                                 # build the 3D bench and open it
```

Views: `iso iso2 front back left right top low`. Masking: `hide=props,joints,rods,conns,spacers,loads`
for `shot`, `--hide ...` for `render`. Add `stress=1 run=1.5` to a shot to show it under load.
The renderer needs no browser, so it is the fastest way to look at something. The bench (`view`) is for
when you want to push the thing: drag any part with the cursor and a force is applied there, live. The bench (`view`) is for
when you want to push the thing: drag any part with the cursor and a force is applied there, live.

**Always simulate before you call a design done.** The physics here has caught a fork passing through the
payload, springs preloading bearings eight times past capacity, and a rig with nothing holding it level.
None of that shows up in the geometry check.

## What the physics models

Bodies from the rigid partition. Bearings that spin, slide and rub. Bending rods as compliant constraints
(`12EI/L³` socketed both ends, `3EI/L³` with a sliding end). Flexi rods that buckle at `π²EI/L²`. Coulomb
friction against the table, per surface. Props and balls as colliding rigid bodies. Motors, gear meshes,
strings over pulleys, rubber bands, tan-clip locks, anchors and hung weights. Joints that pop when the load
passes what the plastic holds, live, with the event reported.

Directional joint capacity, all estimates: about 60 N pushing a rod into its socket, 15 N pulling it out,
4 N prying it out of the connector's plane. Keep loads in the plane of the connector.

## Springs, because there are none in the box

`node cli.js spring` prints the stiffness of every configuration. The short version: a long rod socketed at
one end and sliding through a hub at the other is the softest and most tunable spring you can build.
`k ∝ 1/L³`, so swapping the rod colour retunes it hard. A zigzag of short rods is far stiffer than it looks.
A compressed flexi rod is not a spring at all — it is a near-constant 8 N strut that will tear a small model
apart. Gravity and counterweights are often the cheaper answer: put the payload's mass below the pivot.

## Working style

Build in small steps: add a `!` step, append ten or twenty lines, run the CLI, fix what it says, continue.
A build written all at once usually has a dozen impossible spans in it. Finish with `sim`, and look at a
`render` before showing anyone anything.
