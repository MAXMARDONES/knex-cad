# Where to change things

A map of the code, written for whoever has to extend it. The short version: **the pipeline is
text → expand → parse → solve → check → JSON**, and then three consumers hang off the JSON — the physics,
the renderers and the viewer. Find your change in the table, then read the recipe below it.

## I want to…

| change | file | what to touch |
|---|---|---|
| add or correct a **rod length** | `engine/01_catalog.js` | `LADDER`: colour, `c2c`, real `len`, `units`, whether it has ribs |
| add a **connector kind** | `engine/01_catalog.js` | `KINDS` (slots it has, mass, `cross: true` if it is a 3D connector) and `RGB` |
| change a **material or capacity** number | `engine/01_catalog.js` | `DIMS`: `E`, `I`, `J`, flexi properties, socket capacities, friction |
| add a **desk surface** | `engine/01_catalog.js` | `SURFACES` |
| add a **gear size** | `engine/01_catalog.js` | `GEARS`, teeth to pitch radius in mm |
| add a **statement to the language** | `engine/03_dsl.js` | one `if (op === "X")` branch, plus the header comment; then resolve it in `04_solve.js` |
| change how a **module places** (rotation, mirroring, naming) | `engine/02b_modules.js` | `xform`, `xdir`, `place` |
| change how a **joint is recognised** | `engine/04_solve.js` | the joint classification loop: end-on, hub, side-on, 3D pair |
| change how a **connector's plane is inferred** | `engine/04_solve.js` | the block that runs before joint classification |
| add a **rule that rejects a build** | `engine/05_check.js` | `KNEX.check`, and `issue("error"…)` with a line number and the fix |
| change **mass, or what counts as one rigid body** | `engine/07_bodies.js` | the union-find over rigid joints, and the part mass table |
| add a **physics element** (a new kind of spring, damper, motor) | `engine/13_mech.js` to build it, `engine/11_solver.js` to solve it | see the recipe below |
| change how a **bearing or bending rod behaves** | `engine/10_world.js` builds them, `engine/11_solver.js` solves them | `joints`, `beams` |
| add a **contact shape** | `engine/12_collide.js` | `KNEX.phys.collide`, which runs every step; box, sphere and cylinder live there |
| add a **prop** to the catalogue | `engine/01_catalog.js` | `PROPS`: shape, size mm, mass g, friction, colour, and a one-line note |
| make a build **bend** instead of being rigid | put `FLEX` at the top of the `.knx` | every rod becomes a beam; see `builds/demo_pole.knx` |
| add a **way of bridging two points** | `engine/15_gen.js` | a style is a function from two lattice points to `.knx` lines; the CLI's `bridge` branch picks between them |
| add a **CLI command** | `cli.js` | one `if (file === "…")` branch; put anything long in `scripts/` |
| change the **3D look** of a part | `viewer/03b_parts.js` | `connGeo`, `rodGeo` |
| add a **viewer panel or control** | `viewer/02_body.html` for the markup, `viewer/05_ui.js` to wire it | and `viewer/01_head.html` for the styling |
| change **how you grab things** (mouse, hands, anything else) | `viewer/11_drag.js` | `grabAt`, `grabRelease`, `dragInput`. Every input source is just another entry in `GRABS` |
| change the **line drawing** | `scripts/render.js` | one painter's-algorithm pass, no browser |
| change the **instruction sheets** | `scripts/gallery.sh` and `viewer/09_steps.js` | camera per step, and what the caption says |
| add a **pattern** | `patterns/*.knx` | then `./scripts/patterns.sh` validates and re-renders it |
| add a **test** | `scripts/smoke.js` | it runs the viewer's own code in Node against a stubbed browser |

## The pipeline

```
.knx text
   │  KNEX.expand        02b_modules.js   MOD/USE expanded to plain statements
   │  KNEX.parse         03_dsl.js        statements to a model, one branch per op
   │  KNEX.solve         04_solve.js      units to mm, a worklist that places connectors and rods in
   │                                      dependency order, planes inferred, joints classified
   │  KNEX.check         05_check.js      collisions, floating parts, inventory, port fit
   │  KNEX.toJSON        06_index.js      plain data, with a body id on every part
   ▼
   ├── KNEX.bodies       07_bodies.js     mass properties, and the rigid partition
   │   KNEX.phys.world   10_world.js      bodies, joints, beams, loads, collision features
   │   KNEX.phys.mech    13_mech.js       tendons, motors, gears, locks, balls
   │   KNEX.phys.step    11_solver.js     forces, then sequential impulses, then integrate
   │   KNEX.phys.collide 12_collide.js    contacts, regenerated every step
   ├── scripts/render.js                  SVG line drawing
   └── viewer/*                           the 3D bench, assembled by ./build_viewer.sh
```

`engine/*.js` is concatenated **in filename order** (`cat engine/*.js`) into `dist/knex.js` by
`./build.sh`. That is why the files are numbered, and why `13_mech.js` cannot be `08_mech.js`: it needs
`KNEX.phys`, defined in `09_physics.js`, to exist first.
After any change under `engine/`, run `./build.sh` or the CLI will still be running the old bundle.

## Every file, and what it owns

| file | owns |
|---|---|
| `engine/01_catalog.js` | the parts: rod ladder, connector kinds, gears, surfaces, and every material and capacity number |
| `engine/02_geom.js` | vector maths: `KNEX.V`. Frames, rotations, point-to-line, segment-to-segment, axis parsing |
| `engine/02b_modules.js` | `MOD`/`USE` expansion, before anything is parsed |
| `engine/03_dsl.js` | the parser: one branch per statement, and where new syntax goes |
| `engine/04_solve.js` | placement worklist, unit conversion, plane inference, joint classification, and resolving every element to real geometry |
| `engine/05_check.js` | everything that makes a build unbuildable, plus the parts list, port fit and stiffness table |
| `engine/06_index.js` | `KNEX.build` and `KNEX.toJSON`, the two entry points everything else calls |
| `engine/07_bodies.js` | part masses, inertia, and the union-find that decides what is one rigid body |
| `engine/09_physics.js` | `KNEX.phys`: quaternions, 3×3 maths, and the rigid `Body` |
| `engine/10_world.js` | builds the world: bodies, joints, compliant rods, loads, collision features |
| `engine/11_solver.js` | one timestep: forces, sequential impulses, contacts, failure, `report` |
| `engine/12_collide.js` | contacts, regenerated every step, against the desk, boxes and spheres |
| `engine/13_mech.js` | tendons, motors, gears, tan-clip locks and balls, built onto the world |
| `engine/14_kin.js` | the joint chain, forward kinematics, inverse kinematics by CCD, and the reach envelope |
| `engine/15_gen.js` | generation on the lattice: A* pathfinding, truss lacing, solved arches, legs |
| `viewer/01_head.html` | tokens and layout for both themes |
| `viewer/02_body.html` | the markup: tabs, panels, controls |
| `viewer/03_scene.js` | camera, orbit, lights, the table, the animation frame |
| `viewer/03b_parts.js` | the 3D geometry of a connector and a rod |
| `viewer/04_build.js` | model to meshes, body groups, step filtering, picking |
| `viewer/05_ui.js` | panels, the editor, and what runs on load |
| `viewer/06_physics.js` | running the engine in the page, and reshaping bending rods |
| `viewer/07_physui.js` | the physics tab's controls |
| `viewer/08_stress.js` | the stress colouring |
| `viewer/09_steps.js` | the step slider, the parts for a step, the camera walk |
| `viewer/10_params.js` | URL parameters and shot mode |
| `viewer/11_drag.js` | pushing a part with the cursor |
| `viewer/12_live.js` | the session feed and hot reload |
| `viewer/13_hands.js` | webcam hand tracking: pinch to grab, move to pull, roll to twist, open palm to push |
| `viewer/14_ui2.js` | camera presets, keyboard shortcuts, the body and prop tables |
| `scripts/live.js` | the local server: watch, recompile, event stream |
| `scripts/replay.js` | rebuilding a feed from a transcript |
| `scripts/render.js` | the line drawing |
| `scripts/shot.sh` / `gallery.sh` | 3D renders, headless |
| `scripts/sim_cli.js` | what `sim` prints |
| `scripts/parts_ref.js` | what `parts` prints: the catalogue, the physics model, the build rules |
| `scripts/spring_ref.js` | what `spring` and `arc` print |
| `scripts/catalog.py` | the connector drawings |
| `scripts/smoke.js` | runs the viewer in Node and gates the build |
| `scripts/three_stub.js` | the stubbed browser it runs against |
| `scripts/check_docs.js` | keeps this page honest: every source file must appear here |
| `scripts/install.sh` | prerequisites, build, and open the bench |
| `scripts/patterns.sh` | validating and re-rendering the pattern library |

## The shapes you will be handling

A **connector**, after `solve`:

```js
{ name, kind, pos: [x,y,z] mm, n, e1, e2,     // n is the plane normal; slot k = rotate e1 about n by 45k
  joints: [ {type: "end"|"hub"|"side", slot, t, rod, conn} ],
  pair, anchored, line, step, slotDir(k) }
```

A **rod**: `{ id, color, flexi, beam, p0, p1, t0, t1, u, L, c2c, len, joints, line, step }`.
`p0`/`p1` are the connector centres; `t0`/`t1` are where the plastic actually starts and stops, 10 mm
inside each socket. Draw and collide with `t0`/`t1`; measure and check lengths with `p0`/`p1`.

A **body**, after `KNEX.bodies`: `{ id, parts, m grams, c mm, I g·mm², prop, fixed }`. Everything welded by
end-on joints and 3D pairs is one body; a hub or a side-on clip is a real degree of freedom between two.

A **physics body** is the same thing in SI, with `x` in metres, a quaternion `q`, `v`, `w`, and
`toWorld(p)`. Positions are metres everywhere below `KNEX.phys`; everything above it is millimetres.

## Recipes

### A new statement in the language

1. `engine/03_dsl.js` — add the branch, push onto a list on the model, and add a line to the header
   comment. Give errors the line number: `err(ln, "…")`.
2. `engine/04_solve.js` — resolve names to placed connectors, convert units, and report anything that
   cannot be satisfied with `issue("error", item, "…")`.
3. `engine/06_index.js` — add it to `toJSON` if the viewer or the physics needs it.
4. `docs/DSL.md` and `skill/SKILL.md` — document it. An undocumented statement does not exist.

### A new physics element

1. `engine/13_mech.js` — build the runtime object from the solved model and hang it on the world.
2. `engine/11_solver.js` — decide whether it is a **force** or a **constraint**. Forces go in the block
   before integration; constraints go in the iteration loop. Anything stiffer than a few hundred N/m must
   be a constraint, or the timestep has to shrink to keep it stable. Use the `soft` argument on `rowLin` /
   `rowAng` to give a constraint a real stiffness: the compliance is `1/k`, and it stays stable at any
   stiffness.
3. Report it in `KNEX.phys.report` so the CLI and the bench can show it.
4. Add a case to `builds/demo_mech.knx`, which exists to exercise every element.

### A new check

Put it in `engine/05_check.js`, not in `solve`. `solve` decides what the model *is*; `check` decides
whether it is *buildable*. Every error needs a line number and a sentence saying what to do instead — the
error text is the documentation most people will read.

### A new viewer feature

`viewer/` files are concatenated by `./build_viewer.sh` in an order the script sets explicitly, and a file
can only use what an earlier one defined:

```
01_head.html  02_body.html  03_scene.js  03b_parts.js  04_build.js  08_stress.js
09_steps.js   06_physics.js 05_ui.js     11_drag.js    12_live.js   10_params.js  07_physui.js
```

Note that it is not filename order — `06_physics.js` comes before `05_ui.js` because `render()` in the UI
calls `physBuild()`. If you add a file, add it to `build_viewer.sh` in the right place. Then `scripts/smoke.js` runs the whole page in Node against a stubbed browser and
**fails the build** if it throws. If your feature has state that only exists after a physics step, guard
it: that exact mistake once froze the entire bench, because a throw in the first frame stopped the
animation loop before it started.

## Things that will surprise you

- **A rod's endpoints are connector centres, not the plastic.** `c2c = len + 20`, because the tip sits
  10 mm inside each socket.
- **Two hubs on one rod are one joint**, not two, and the axial lock must be tested at each hub rather
  than at the midpoint between them.
- **A bending rod is not in a body group** in the viewer: it lives in the scene and is reshaped every
  frame, because it deforms.
- **`solve` runs a worklist, not a single pass.** A connector can be defined by the rod through it and a
  rod by the connectors at its ends, so placement repeats until nothing new can be placed.
- **Millimetres above `KNEX.phys`, metres below it.** Almost every unit bug is this line being crossed.
- **The type system is physical.** If a change makes an impossible model pass the checker, the change is
  wrong, however convenient it is.
