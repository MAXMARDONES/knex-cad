# Engineering notes

What the geometry forces on you, what the physics says, and what we got wrong on the way to a working
rig. Numbers marked *estimate* have no published source; treat them as ratios and trends.

## 1. The lattice decides the design

Rod centre-to-centre lengths are `37.5 × √2^(n-1)` mm. Nothing between them exists.

| rod | c2c | length | units |
|---|---|---|---|
| green | 37.5 | 17.5 | 1 |
| white | 53.03 | 33 | √2 |
| blue | 75 | 55 | 2 |
| yellow | 106.07 | 86 | 2√2 |
| red | 150 | 130 | 4 |
| grey | 212.13 | 192 | 4√2 |

Consequences you will hit within an hour of designing:

- **A span of 3 U does not exist.** Split it 2 + 1 with a connector between. `node cli.js span` answers this.
- **Only squares brace.** The diagonal of an n×n square is the next rod up the ladder; a 1×2 rectangle has
  no legal diagonal at all. Design in squares and the triangulation is free.
- **Gears mesh at a white rod.** Two 34-tooth gears want 53.2 mm between axle centres and a white rod is
  53.03 mm. Build the two axles one white apart and the teeth line up. This is not a coincidence in the
  part design; it is why K'NEX gear trains are buildable at all.
- **Real objects are not on the lattice.** A 62 mm mouse between rails 75 mm apart leaves 6.5 mm a side.
  You close that with foam, not with geometry. Every gripper in this system needs a shim.

## 2. A connector is a plane, not a point

All eight of a connector's sockets lie in one plane. A rod along its normal goes *through the hub* and
spins free; it can never be end-on there. So plan a node by listing the directions rods leave it in:

- Coplanar → one connector, and the tool works out which plane.
- Not coplanar → a **3D pair**: two `B7`/`P4` at the same point with planes at 90°. This is the only way
  to turn a corner in all three axes, and it is why a cube corner needs the 3D parts.

Every arm is real and 18.75 mm long. Unused arms hit things. A `W8` standing in a vertical plane with its
centre 18.75 mm up touches the table. Pick the connector by the directions you need: `R3` for a 90° corner,
`G4` for 135°, `Y5` for 180°, `O2` for a straight line with nothing sticking out sideways.

We lost an hour to a collar that would not settle. The cause was an 8-way connector whose downward arms
were standing on the desk and fighting the rods holding it. Swapping it for a 3-way fixed it.

### The sockets are a fan, and a partial connector cannot reach round

Socket *k* points 45°·k round from socket 0, so the sockets a connector actually has decide the **total
angle it can span**, not just how many rods it holds:

| kind | sockets | the fan it covers | so it cannot |
|---|---|---|---|
| `W8` | 0–7 | 360° | — |
| `B7` | 0–6 | 315° | close the last 45° |
| `Y5` | 0–4 | 180° | reach behind itself |
| `G4`, `P4` | 0–3 | 135° | make a straight line |
| `R3` | 0–2 | **90°** | hold two rods opposite each other |
| `L2` | 0–1 | 45° | anything but a tight V |
| `O2` | 0 and 4 | straight through | turn a corner at all |
| `D1` | 0 | one socket | — |

A fresh agent building the robot arm hit `has no socket at slot N` five separate times, always on an
`R3` or a `P4`, always by asking a quarter-fan part to reach something behind it. Two rods leaving a
red 3-way in opposite directions is not a tight fit; it is impossible.

Leaving `ref` off does **not** rescue you. It aims socket 0 at the first rod attached, which is the
best opening move, but the remaining rods still have to land inside the fan. If they do not, the part
is wrong: go up the table to one with a wider fan, or split the node into a 3D pair.

## 3. Joints, and what each one lets move

| joint | freedom | strength |
|---|---|---|
| end-on: rod tip in a socket | rigid | strong pushed in, weaker pulled out, weakest levered sideways |
| hub: rod through the centre hole | spins and slides | the only real bearing |
| side-on: socket biting the rod's ribs | pivots about the rod with friction | needs the ribbed body, never the smooth ends or a green rod |
| 3D pair | rigid, planes locked at 90° | weak in pure tension: keep 3D corners out of the bottom of a span |
| tan clip on a hub | locks the connector to the rod | how a motor drives something instead of spinning inside the hub |

Directional capacity, all *estimates*: about **60 N** pushing the rod into its socket, **15 N** pulling it
out, and only **4 N** prying it out of the connector's plane. That ratio is the single most useful thing to
know when you place a load: keep the force in the plane of the connector and against the socket's inner
walls, and the joint holds many times more than it does sideways.

Rods slide out of hubs unless something stops them. The engine treats a hub as axially free unless a
spacer, a cap or another connector sits within 12 mm of it, which matches what happens on the table.

## 4. Stiffness, and where softness comes from

A rod is a beam. Its transverse stiffness is `3EI/L³` when the far end can slide and `12EI/L³` when both
ends sit in sockets. Everything about how a rig feels follows from that:

- **Length dominates.** `k ∝ 1/L³`. A red rod is 2.8× softer than a yellow, a grey 2.8× softer again.
- **A sliding end is 4× softer than a socketed one,** because it carries no moment. A long rod anchored in
  one socket and passing through a hub is the softest spring you can build, and it is adjustable by
  swapping one part.
- **Serpentines are stiffer than they look.** Segments add in series, so three whites in a zigzag land near
  3.4 N/mm where a single red leaf is 0.11 N/mm. Thirty times stiffer, in the same space. If you want a
  soft zigzag you need long rods, not more short ones. `node cli.js spring` prints the table.
- **Torsion is negligible in practice.** The X section is stiff enough and short enough that rods barely
  twist; bending is where all the compliance lives.

## 5. There are no springs in the box

Classic K'NEX has no coil spring. Return-to-centre comes from one of four places:

1. **A rod used as a leaf spring** (above). Predictable, tunable, and the default answer.
2. **Gravity.** Put the payload's centre of mass *below* the pivot and the thing centres itself for free.
   The simulation will show you a rig that flops; it is almost always cheaper to lower the mass than to add
   stiffness.
3. **A counterweight**, which is the same trick paid for in grams.
4. **A flexi rod** — but read the next section first.

**Flexi rods buckle, and a buckled strut is not a spring.** Once the span is shorter than the rod, it pushes
its ends apart with a nearly constant `π²EI/L²`, about 8 N for a flexi yellow, whatever the compression.
Our first rig used four of them 14 mm compressed. They put **13 N** through bearings that carried 1.7 N of
weight, close to the 15 N where a socket lets go. The rig would have torn itself apart on the table. Use
flexi rods as travel stops, not as centring springs.

## 6. Mechanisms

- **A bearing** is a rod through a hub, parked with spacers (3.1 blue, 9.3 silver) and stopped with a cap.
- **Two hubs on one rod** make a hinge line. Two hubs on two *parallel* rods, tied together, make a carriage
  that slides without rotating: the second rail is what kills the spin.
- **A motor** drives a hub joint against whatever holds it. Give it a torque limit and it stalls like the
  real one rather than delivering infinite force.
- **Gears** couple two hub joints on a shared carrier at `r₁ω₁ + r₂ω₂ = 0`. Lock a gear to its axle with a
  tan clip or it just spins inside its own hub, which is the most common reason a K'NEX gear train does
  nothing.
- **Strings** are inextensible in tension and limp otherwise, and they run over guides, which is all a
  pulley is. **Rubber bands** are the same routing with a linear pull instead of a limit.
- **Curved chains.** Straight connectors and bending rods make an arc: the moment at every socket is `EI/R`,
  so the tightest circle a plain rod will hold is about `EI/250` ≈ 500 mm radius. `node cli.js arc` prints
  the turn per joint and the moment. Keep the load in the plane of the arc; sideways it pries the sockets.

## 7. Structure

- **Triangulate every square.** A four-bar of rods is a mechanism, not a structure.
- **Squares, not rectangles**, so the diagonal exists.
- **Keep the orange straight connector out of load paths.** Two sockets at 180° and nothing sideways means
  it cannot be braced. It is the right part where a connector's extra arms would foul something.
- **Long spans:** two yellows and a 5-way in the middle beat one grey rod, and interlocking the middle
  connectors along the span turns a line of rods into a lattice.
- **Anchor or ballast.** A tall rig on a smooth desk tips before anything breaks. `A conn` clamps a node to
  the table; `W name conn mass=` hangs ballast. The simulation will tip it over if you do neither.

## 8. What the simulation is and is not

It is a maximal-coordinate rigid-body engine with sequential impulses: bodies from the rigid partition,
real constraints for bearings and side-on clips, compliant constraints for bending rods, Coulomb friction
at every contact, and collision against props and balls. Beams use soft constraints rather than stiff
springs, which is why a chain of them stays stable at a normal timestep.

It is **not** a finite-element model. Members welded into one rigid body have no internal force, so the
stress view colours what the engine actually knows — bending rods and bearings — and says so. If you need
the force in every member of a truss, that is the next thing to build.

Numbers that are estimates: flexi modulus 150 MPa, rod second moment 45 mm⁴, torsion constant 45.7 mm⁴,
socket capacities, hub and surface friction, rubber band rate. The lengths, the socket depth, the
connector thickness and the hub diameter come from the Glickman patents and measured parts, and those you
can trust.

## 9. Mistakes worth not repeating

1. **A rod through the middle of the thing it is supposed to move.** Our first fork ran straight through
   the mouse. Draw the payload as a prop with a mass from the start and the collision finds it.
2. **Buckled flexi rods as springs.** 13 N of preload in a 1.7 N structure. See §5.
3. **Modelling a stiff rod as a stiff spring.** An explicit spring at 450 kN/m needs a 20 µs timestep.
   Axial stiffness belongs in a constraint; only the bending belongs in a spring.
4. **Drawing a bending rod straight.** The physics bent it, the picture did not, and the connectors
   appeared to walk off the rods. If a member deflects, draw it deflected.
5. **Averaging two hubs into one anchor.** A two-hub bearing must be tested at each hub, not at the
   midpoint, or the axial lock never triggers.
6. **Guessing a connector's plane.** Leave the normal out and the tool derives it, and tells you when the
   directions are not coplanar and you need a 3D pair. Most of our geometry errors were this one mistake.
7. **Letting a part rest exactly on the desk and expecting the physics to be quiet.** A connector is a
   37.5 mm disc, so one standing on edge with its centre at 0.5 U has its rim precisely on the table.
   That is right for a foot and wrong for anything that moves: the contact pushes the part up, whatever
   holds it pushes back, and the pair report loads that have nothing to do with the model. The linear
   slider pattern read **145 N through its bearings under its own 9 g weight** until its rails were
   raised one unit. At 1.5 U each hub carries 0.05 N, which is half the carriage's weight, as it should
   be. The checker now warns when a hub's rim reaches the table.
8. **Applying a force as a step.** Switching a load on between one timestep and the next hits a rigid
   constraint as an impulse, and the solver reports the spike rather than the load: a 2 N press read
   156 N and popped both bearings it went through. `sim` ramps a press over 80 ms (`--ramp`), which is
   also what a finger does.
9. **Measuring displacement from a rest pose that already contained the push.** Every declared `F` used
   to be live during the settle phase, so the model came to rest *already pushed* and the movement
   measured afterwards was zero — for exactly the force you were asking about. Settling means gravity
   alone; the press phase turns the loads on.
10. **A break that says nothing.** A rod that snaps out stops carrying load, so whatever it held becomes
   free, and a lone `F` on a free body is a thruster with no reaction. The leaf-spring pattern snapped
   at 115% while merely settling and then flew 226 metres, and the report called it a result. Breaks are
   now named where they happen, and a body that leaves the desk is called out.
