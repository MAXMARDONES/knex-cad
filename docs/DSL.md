# .knx build format (v1)

One part per line. Coordinates are in **lattice units** (U = 37.5 mm = green c2c) — the whole classic
K'NEX ladder lands on integer coordinates: green 1, blue 2, red 4 along an axis; white (1,1), yellow (2,2),
grey (4,4) on a diagonal. Rod colour is inferred from the distance, so a rod line is just two names.

```
T  title
U  37.5                       # unit in mm (default)
!  step title                 # build step; every part below belongs to it (viewer slider)
C  name kind x,y,z [n [ref]]  # connector: n = plane normal (z default), ref = direction of socket 0
H  name kind x,y,z [ref]      # connector whose HUB sits on the rod through that point (free axle, normal = rod)
S  name kind x,y,z arm [ref]  # side-on clip: point is ON the rod, arm = hub->rod direction (hub 13.75 mm off)
R  a b [colour|flexi|flexi-colour]   # rod between connectors (names) or points x,y,z; colour optional
P  x,y,z blue|silver          # spacer (3.1 / 9.3 mm) on the rod through that point
X  label x,y,z sx,sy,sz [#hex] [mass=g] [mu=] [pad=x,y] [fixed]
                              # prop box (mm). With a mass it becomes a physical body that collides
                              # with the model. pad is shim thickness added to its x and y half-sizes.
F  NODE fx,fy,fz [name]       # external force in newtons at that connector: a finger, a weight
I  W8=32 blue=18 ...          # inventory (parts list is checked against it)
#  comment
```

## Modules

Design a sub-assembly once, place it as often as you like. This is how you work on a big model: get one
module standing on its own, check it, then place it where it belongs.

```
MOD leg                       # everything until END is the module
  C foot W8 0,0,0.5 x y
  C top  W8 0,0,2.5 x y
  R foot top
  R ^FRAME top                # ^name reaches OUT of the module, to something already placed
END

USE leg L1 at=-2,-2,0
USE leg L2 at=2,-2,0 rot=z90
USE leg L3 at=2,2,0 mirror=x
```

### Ports: where modules meet

`Z conn label` marks a connector as an interface. Once two modules are placed, the checker looks at every
pair of ports that **face each other** and says whether a rod actually spans the gap:

```
these fit:
  SW.brace to NW.brace: one red rod (150.0 mm)

these do not:
  A.deck and B.deck face each other 3.000 U apart (112.5 mm) but nothing joins them:
  that is not a rod length. Bridge it with green + blue and a connector between.
```

`node cli.js ports <build>` lists every port with its free sockets and both of those lists. Ports that are
not pointing at each other are ignored, so you only hear about joins you meant to make.

Names inside become `prefix.name`, so `L1.top` and `L2.top` are different connectors. `at=` translates in
lattice units, `rot=` is a quarter turn about an axis (`x90 y180 z270` — anything else leaves the lattice),
and `mirror=` flips one axis. Directions inside the module are rotated with it; positions are rotated and
then translated.
Any point may be relative: `NAME@dx,dy,dz` (offset in units from that connector's hub) — needed for parts
hanging off a side-clip, whose hub is 13.75 mm off the lattice.

Kinds: `W8` white 8-way · `B7` blue 7-way 3D · `Y5` yellow 5-way · `G4` green 4-way · `P4` purple 4-way 3D ·
`R3` red 3-way · `L2` light-grey 2-way (45°) · `O2` orange straight (adds 20 mm) · `D1` dark-grey cap.
Axes: `x -y z x+y -x-z` or a vector `a,b,c`. Socket k points at 45°·k from `ref`, counter-clockwise about `n`.

Joints are **inferred from geometry**, never declared:
- end-on: connector hub at a rod end and a socket pointing along the rod → rigid
- hub (H, or any connector whose normal is the rod and whose hub is on it) → free axle (spin + slide)
- side-on (S) → clip perpendicular to the rod at 13.75 mm, pivot about the rod with friction; not on green rods
- 3D pair: two `B7`/`P4` at the same point with planes at 90°

Checks: rod length on the ladder (±1 mm), socket exists and is free, side-on needs ridges, rods that
intersect (physical tips), rods passing through a connector body, connectors overlapping on an axle,
loose rods, floating connectors, inventory, flexi span ≤ rod length (bow reported).
Stiffness: cantilever k = 3EI/L³ per rod (E 2.8 GPa std, 0.4 GPa flexi, I ≈ 45 mm⁴ — estimates).


## Physics

`node cli.js sim build.knx` runs the build as a rigid-body model. Bodies come from the rigid partition:
end-on joints and 3D pairs weld parts together, everything else is a degree of freedom.

| element | how it behaves |
|---|---|
| hub joint | bearing: spins, and slides unless a spacer, cap or connector sits within 12 mm of it |
| side-on clip | pivot about the rod with friction |
| `beam` rod | rigid along its length, springy across it: 12EI/L³ with both ends in sockets, 3EI/L³ when the far end is a hub it can slide through |
| flexi rod | buckles: pushes its ends apart with a near-constant π²EI/L², pulls hard once taut |
| desk | contact plane with Coulomb friction, per surface (cloth pad, rubber pad, wood, laminate, glass) |
| prop with mass | rigid box that collides with the model, so a gripper only moves what it touches |
| `F` line | external force you place, pressed with `--press "name"=gain` |

Options: `--surface`, `--press`, `--seconds`, `--settle`, `--dt`, `--mu`, `--free-base`, `--zero-g`, `--trace`.

The flexi modulus, the rod's second moment of area, the socket pull-out force and the hub friction are
estimates: no source publishes them. Read the forces as ratios and trends.
