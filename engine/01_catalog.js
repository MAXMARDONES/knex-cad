/* K'NEX classic catalogue. Units: mm. Source: research/KNEX.md (Glickman patents + measured lengths). */
var KNEX = (function () {
  var U = 37.5;                               // lattice unit = green c2c (D_min)
  var D_SOCKET = 10.0;                        // hub axis -> socket floor (rod tip sits here)
  var LADDER = [                              // rod colour, c2c between connector centres, real tip-to-tip
    { color: "green",  c2c: 37.5,   len: 17.5, units: 1,      ridges: false },
    { color: "white",  c2c: 53.03,  len: 33,   units: 1.4142, ridges: true },
    { color: "blue",   c2c: 75.0,   len: 55,   units: 2,      ridges: true },
    { color: "yellow", c2c: 106.07, len: 86,   units: 2.8284, ridges: true },
    { color: "red",    c2c: 150.0,  len: 130,  units: 4,      ridges: true },
    { color: "grey",   c2c: 212.13, len: 192,  units: 5.6569, ridges: true }
  ];
  var FLEXI = { white: 33, blue: 52, yellow: 86, grey: 192 };   // flexi rods exist in these lengths (tip-to-tip)
  var DIMS = {
    U: U, d: D_SOCKET, rodD: 6.2, rodEndD: 6.35,
    connT: 6.2, hubHoleD: 6.4, hubOD: 9.0, connR: 18.75, socketLen: 8.9, socketThroat: 5.33,
    sideR: 13.75,                             // side-on: rod axis distance from the hub axis (kneditor, unverified)
    ribW: 2.4,                                // the four lengthwise ribs of the X section; side-on grips these
    spacer: { blue: 3.1, silver: 9.3 },
    E: 2800, nu: 0.35,                        // acetal copolymer, MPa (published range 2.6-3.2 GPa)
    A: 24.0, I: 45.0, J: 45.7,                // rod X-section: area, second moment, torsion constant (mm^2/mm^4, derived)
    Eflexi: 150, Aflexi: 30.2, Iflexi: 63.6,  // flexi rod: solid 6.2 round; E is an ESTIMATE, nothing published
    muDesk: 0.25, muHub: 0.12, muSide: 0.35,  // friction: default desk, rod in a hub, side-on clip (estimates)
    // End-on joint capacity, all ESTIMATES (no source publishes them). A socket is strong when the rod's
    // peg is pushed against its inner walls and weak when the load levers the rod out of the plane.
    socketPush: 60.0,                         // N along the rod, into the socket: it bottoms out
    socketPull: 15.0,                         // N along the rod, pulling out against the snap ridges
    socketPry: 4.0,                           // N perpendicular to the connector's plane: this is what pops first
    socketMoment: 250.0,                      // N.mm bending the rod in the socket plane
    bandK: 0.10, bandMax: 3.0,                // rubber band: N/mm and the force where it is near its limit (ESTIMATE)
    stringEA: 3000, muLock: 8.0,              // string stiffness N, and how much a tan clip multiplies hub friction
    tolLen: 1.0, tolAng: 4.0, tolPos: 0.8
  };
  // slot index k -> angle 45*k deg from the reference direction, in the connector plane
  var KINDS = {
    W8: { name: "8-way white",        color: "white",  slots: [0,1,2,3,4,5,6,7], mass: 3.63 },
    B7: { name: "7-way blue 3D",      color: "blue",   slots: [0,1,2,3,4,5,6],   mass: 3.3, cross: true },
    Y5: { name: "5-way yellow",       color: "yellow", slots: [0,1,2,3,4],       mass: 2.5 },
    G4: { name: "4-way green",        color: "green",  slots: [0,1,2,3],         mass: 2.1 },
    P4: { name: "4-way purple 3D",    color: "purple", slots: [0,1,2,3],         mass: 2.17, cross: true },
    R3: { name: "3-way red",          color: "red",    slots: [0,1,2],           mass: 1.7 },
    L2: { name: "2-way light grey V", color: "lgrey",  slots: [0,1],             mass: 1.3 },
    O2: { name: "2-way orange straight", color: "orange", slots: [0,4],          mass: 1.2 },
    D1: { name: "1-way dark grey cap", color: "dgrey", slots: [0],               mass: 0.8 }
  };
  var RGB = { green: "#2E9E4F", white: "#ECECEA", blue: "#2563D9", yellow: "#F2C51D", red: "#D9302C", grey: "#8C9096",
              purple: "#7B4FB8", lgrey: "#B9BDC3", orange: "#F08A1D", dgrey: "#4A4E55", flexi: "#9B6BD6", spacer: "#3B82F6", silver: "#C0C4CA" };
  /* Things you put on the table with the model. Real dimensions in mm, real mass in grams, and a
     friction coefficient for that material sliding on a desk. Sources are everyday measurements:
     a phone in a case, a full 500 ml PET bottle, a golf and a tennis ball, a 40 mm steel cube. */
  var PROPS = {
    phone:      { shape: "box",      size: [75, 160, 9],   mass: 190,  mu: 0.40, color: "#2B2F36", note: "a phone in a case" },
    mouse:      { shape: "box",      size: [62, 117, 38],  mass: 85,   mu: 0.25, color: "#3B4252", note: "a wired optical mouse" },
    book:       { shape: "box",      size: [148, 210, 22], mass: 260,  mu: 0.35, color: "#6B4A2F", note: "a paperback" },
    weight:     { shape: "box",      size: [40, 40, 40],   mass: 500,  mu: 0.50, color: "#5A6068", note: "a 40 mm steel cube: the counterweight" },
    weight2:    { shape: "box",      size: [50, 50, 50],   mass: 980,  mu: 0.50, color: "#4A5058", note: "a 50 mm steel cube, near a kilo" },
    bottle:     { shape: "cylinder", size: [65, 65, 215],  mass: 520,  mu: 0.30, color: "#7FB8D8", note: "a full 500 ml water bottle" },
    "bottle-empty": { shape: "cylinder", size: [65, 65, 215], mass: 22, mu: 0.30, color: "#AECFE2", note: "the same bottle, empty" },
    can:        { shape: "cylinder", size: [66, 66, 115],  mass: 350,  mu: 0.30, color: "#B4483C", note: "a 330 ml can" },
    ball:       { shape: "sphere",   size: [43, 43, 43],   mass: 46,   mu: 0.25, color: "#E9ECE6", note: "a golf ball" },
    "ball-tennis": { shape: "sphere", size: [67, 67, 67],  mass: 58,   mu: 0.55, color: "#C8D93C", note: "a tennis ball: light and grippy" },
    "ball-steel": { shape: "sphere", size: [25, 25, 25],   mass: 64,   mu: 0.20, color: "#8C9096", note: "a 25 mm steel ball bearing" },
    coin:       { shape: "cylinder", size: [26, 26, 2.2],  mass: 8.5,  mu: 0.35, color: "#C8A93C", note: "a coin, for a light trigger" },
    block:      { shape: "box",      size: [90, 90, 45],   mass: 120,  mu: 0.35, color: "#3B4252", note: "a plain test block" }
  };
  // K'NEX gears: teeth -> pitch radius in mm (MIT measurements, KNEX.md 2.5)
  var GEARS = { 14: 10.9, 34: 26.6, 58: 44.5, 82: 64.0 };
  // what the rig and the mouse stand on. PTFE mouse feet against each surface; K'NEX parts are acetal.
  var SURFACES = {
    "mousepad-cloth": { mu: 0.35, name: "cloth mouse pad", muKnex: 0.55 },
    "mousepad-rubber": { mu: 0.45, name: "rubber mouse pad", muKnex: 0.85 },
    "desk-wood": { mu: 0.20, name: "varnished wood", muKnex: 0.30 },
    "desk-laminate": { mu: 0.18, name: "laminate", muKnex: 0.28 },
    "glass": { mu: 0.12, name: "glass", muKnex: 0.20 }
  };
  return { U: U, DIMS: DIMS, LADDER: LADDER, FLEXI: FLEXI, KINDS: KINDS, RGB: RGB, SURFACES: SURFACES, GEARS: GEARS, PROPS: PROPS,
           ladder: function (c) { for (var i = 0; i < LADDER.length; i++) if (LADDER[i].color === c) return LADDER[i]; return null; } };
})();
