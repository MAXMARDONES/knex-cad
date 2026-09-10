# Pattern library

Twelve small builds, each one technique, each validated by the checker and rendered in 3D from the same
file. Copy a block into your own build and change the coordinates.

```bash
./scripts/patterns.sh      # validate them all
./scripts/gallery.sh       # re-render every image in the repo
```

| pattern | what it teaches | file |
|---|---|---|
| ![](patterns/01-triangulated-square.png) | **Triangulated square.** The diagonal of an n×n square is the next rod up the ladder. A rectangle has no legal diagonal. | [01](../patterns/01-triangulated-square.knx) |
| ![](patterns/02-cube-corner.png) | **Cube corner.** Three axes at one node needs two 3D connectors sharing a centre with planes at 90°. One connector can never do it. | [02](../patterns/02-cube-corner.knx) |
| ![](patterns/03-a-frame-tower.png) | **A-frame tower.** Legs at 45° so the diagonal closes, all in one vertical plane, apex hub ready to take an axle. | [03](../patterns/03-a-frame-tower.knx) |
| ![](patterns/04-axle-bearing.png) | **Axle in a bearing.** Rod through a hub, spacers either side to stop it sliding, caps to stop it walking out. | [04](../patterns/04-axle-bearing.knx) |
| ![](patterns/05-leaf-spring.png) | **Leaf spring.** Socketed one end, sliding hub the other: `3EI/L³`, the softest spring in the system and the easiest to retune. | [05](../patterns/05-leaf-spring.knx) |
| ![](patterns/06-zigzag-spring.png) | **Zigzag spring.** A serpentine of bending rods. Compliance adds in series, but short rods stay stiff: length is the real knob. | [06](../patterns/06-zigzag-spring.knx) |
| ![](patterns/07-gear-pair.png) | **Gear pair.** Two 34-tooth gears mesh at exactly one white rod between axles. Motor on one, and the other counter-rotates. | [07](../patterns/07-gear-pair.knx) |
| ![](patterns/08-slider.png) | **Linear slider.** One hub slides and spins; two hubs on parallel rails, tied together, only slide. | [08](../patterns/08-slider.knx) |
| ![](patterns/09-curved-chain.png) | **Curved chain.** Straight connectors plus bending rods make an arc. `EI/R` at every socket sets the tightest radius. | [09](../patterns/09-curved-chain.knx) |
| ![](patterns/10-ladder-beam.png) | **Ladder beam.** Two rails and a zigzag between them: the long span, far stiffer than one long rod. | [10](../patterns/10-ladder-beam.knx) |
| ![](patterns/11-tan-clip-lever.png) | **Tan clip lever.** A connector on an axle spins freely; the clip locks it so the two turn together. | [11](../patterns/11-tan-clip-lever.knx) |
| ![](patterns/12-pendulum.png) | **Ball on a string.** Strings are inextensible in tension and limp otherwise; balls are spheres with mass. | [12](../patterns/12-pendulum.knx) |

## Demos

Bigger builds you can open in the bench and take apart.

| demo | what it shows |
|---|---|
| ![](patterns/demo-mech.png) | **`builds/demo_mech.knx`** — a motor turning a gear pair, a lever locked to an axle by a tan clip, a rubber band pulling it back, and a ball on a string. Every mechanism the engine knows, in one rig. |
| ![](patterns/demo-modules.png) | **`builds/demo_modules.knx`** — one tower module placed four times with `USE`, with `Z` ports saying where the deck attaches. `node cli.js ports` reports which gaps a rod already spans and what to bridge the rest with. |
| ![](patterns/demo-props.png) | **`builds/demo_props.knx`** — the prop catalogue on a table: a phone, a book, a steel counterweight, a full water bottle, a can, three balls and a coin, each with its real size, mass, friction and shape. A steel ball is thrown at the tower the moment you press run. |
| ![](patterns/demo-pole.png) | **`builds/demo_pole.knx`** — a metre of K'NEX pole with `FLEX` on, so every rod bends. It sags 34 mm under its own weight and whips when you wave the butt. Grab the tip with the mouse or your hand. |
| ![](../docs/hero.png) | **`builds/rig.knx`** — the worked example: a two-axis tilt platform that stands over a mouse and pushes it. Sixteen build steps, a compliant fork, four zigzag centring springs. |

## Part catalogue

These stay as drawings rather than renders, because the socket numbering is the point: a photograph of a
connector cannot tell you which slot is 3.

| | |
|---|---|
| ![](catalog/connector_W8.png) | ![](catalog/connector_B7.png) |
| ![](catalog/connector_Y5.png) | ![](catalog/connector_G4.png) |
| ![](catalog/connector_R3.png) | ![](catalog/connector_O2.png) |

![](catalog/rods.png)

![](catalog/joints.png)

The rest: `docs/catalog/connector_P4.png`, `connector_L2.png`, `connector_D1.png`.
