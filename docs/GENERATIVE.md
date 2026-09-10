# Solving and generating

Two questions come up before you place a single part. *Can this thing reach where I need it to?* and
*how do I get from here to there?* Both have standard answers from robotics and structural design, and
both are worth having on the lattice, where the answer is constrained in a way it usually is not.

## Kinematics: what can it reach, and what does that cost

The physics already knows the joint tree, because every hub and side-on clip is a real degree of freedom
between two bodies. The same model answers the design questions.

```bash
node cli.js reach builds/rig.knx
node cli.js ik builds/rig.knx --target 30,60,150 --lever 75
```

`reach` walks out from the frame, lists the joints it finds, and samples the joint space to report what the
end of the chain can get to:

```
3 degrees of freedom out to DL
  1. TL+TR       turns about x at 0,0,94 mm
  2. HL+HR       turns about x at 0,0,94 mm
  3. BL+BR       turns about y at 0,0,131 mm
  envelope   63 x 137 x 137 mm      furthest from the first joint: 69 mm
```

`ik` solves the other direction by cyclic coordinate descent: it turns each joint in turn to bring the tip
nearer the target, and reports how close it got. That last part matters more than the solve — an honest
"23.5 mm short" tells you to change the design, where a solver that always returns *something* does not.

The column that earns its place is the travel:

```
joint            turn      actuator travel at a 75 mm lever
  HL+HR         -46.8 deg      61.3 mm
  BL+BR          24.9 deg      32.6 mm
```

That is the arc a lever of that radius sweeps, which is what a linear actuator driving the joint has to
deliver. It converts a pose you want into a stroke you have to build, before you build anything.

**What it does not do.** No collisions, no end stops, no gravity. It is the geometry, not the machine.
Take the pose it gives you, put it in the simulation, and find out how much of that envelope you can
actually use.

**Where it helps and where it does not.** For an arm, decisively: reach and required stroke are the two
numbers that decide whether the design is worth building. For a two-axis gimbal the kinematics are
trivial and you learn nothing. The specifically useful thing here is that you cannot put a joint wherever
you like — the lattice decides — so the loop is: arrange, ask what it reaches, rearrange.

## Generating structure between two points

```bash
node cli.js bridge builds/demo_bridge.knx LB2 RB2 --style arch --rod blue --segments 10 --append
```

Pick two placed connectors and a technique. Each one writes `.knx` you can look at before you take it,
or `--append` to write it straight into the build and re-check.

| style | what it makes | when |
|---|---|---|
| `line` | the fewest rods that get from A to B, using every legal move including the diagonals | you just need to connect two things |
| `truss` | the same run in uniform steps, with a second chord one step to the side and laced between | anything that has to carry load or not fold |
| `arch` | a solved circular arc of bending rods | a span you want to carry in compression, or that has to clear something |
| `slide` | two parallel rails with a carriage on both | a linear guide: it slides and cannot spin |

Add `--legs` to drop vertical supports to the table wherever a rod fits exactly.

### Why the truss insists on uniform steps

A ladder beam's lacing runs from one chord to the far node of the other. If the chord step is `n` along an
axis and the offset is `n` perpendicular, that diagonal is `n√2` — a real rod. Mix in a face diagonal and
the lacing becomes `n√3`, which is not a rod at all. So the truss search is restricted to one step size
along the axes, and it tries 1, 2 and 4 units before giving up.

### Why the arch is solved rather than sampled

Every rod in an arch is the same real length, so you cannot lay points along a curve and hope the chords
come out right. Given a span `S`, a rod `L` and `n` segments, the arch is the circle whose `n` equal chords
of length `L` span `S`:

```
sin(n·θ/2) / sin(θ/2) = S / L
```

solved for the half-angle `θ` by bisection. The radius and the rise fall out of it; you do not get to pick
the rise. `n` must be more than `S/L`, and the tool says so if it is not.

It also checks what you are asking of the sockets. Bending a rod to radius `R` puts `EI/R` into each one:

```
# WARNING: bending each rod that far puts 839 N.mm into every socket, and they
# let go at about 250 N.mm (estimate). Use more segments or a longer rod.
```

### What it checks before handing you the lines

- **Are both ends on the lattice?** If they sit off it by the same amount, the whole span is shifted to
  match. If they sit off it by *different* amounts, nothing regular can span that, and it says so instead
  of generating something that misses.
- **Can the ends take it?** A connector is a plane. If the span arrives along that connector's normal it
  cannot seat, and you are told which end and what to do: make it a 3D pair, or move it.

## Pre-stress, and what the simulation assumes

A rod bent into an arch is pre-stressed: it pushes outward for as long as it is in there. The simulation
treats **the shape you built as the zero-force state**, and reports the pre-bend separately. The
alternative — measuring from where the socket points — makes the physics try to straighten every curved
chain the instant it starts, which tears an arch apart in a tenth of a second. Building it bent is a
decision you made; the checker tells you what it costs, and the simulation runs the thing you built.

## Still to do

A finite-element pass. The physics welds a triangulated frame into one rigid body, which is correct and
means members inside it carry no force it can report. Getting the force in every member of a truss needs a
real FE solve, and that is the next thing worth building.
