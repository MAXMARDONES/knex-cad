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
/* Small vector toolkit (arrays of 3). */
KNEX.V = (function () {
  var V = {};
  V.add = function (a, b) { return [a[0]+b[0], a[1]+b[1], a[2]+b[2]]; };
  V.sub = function (a, b) { return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]; };
  V.mul = function (a, s) { return [a[0]*s, a[1]*s, a[2]*s]; };
  V.dot = function (a, b) { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; };
  V.cross = function (a, b) { return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]; };
  V.norm = function (a) { return Math.sqrt(V.dot(a, a)); };
  V.unit = function (a) { var n = V.norm(a); return n > 1e-12 ? V.mul(a, 1 / n) : [0, 0, 0]; };
  V.dist = function (a, b) { return V.norm(V.sub(a, b)); };
  V.eq = function (a, b, tol) { return V.dist(a, b) <= (tol || 1e-6); };
  V.angleDeg = function (a, b) { var c = V.dot(V.unit(a), V.unit(b)); return Math.acos(Math.max(-1, Math.min(1, c))) * 180 / Math.PI; };
  V.parallelDeg = function (a, b) { var d = V.angleDeg(a, b); return Math.min(d, 180 - d); };
  V.rot = function (v, axis, deg) {            // Rodrigues rotation
    var k = V.unit(axis), t = deg * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
    return V.add(V.add(V.mul(v, c), V.mul(V.cross(k, v), s)), V.mul(k, V.dot(k, v) * (1 - c)));
  };
  /* "x", "-y", "x+y", "-x-z", or "a,b,c" -> unit vector; null if unparsable */
  V.axis = function (tok) {
    if (!tok) return null;
    if (tok.indexOf(",") >= 0) { var p = tok.split(",").map(Number); return p.length === 3 && p.every(isFinite) ? V.unit(p) : null; }
    var m = tok.match(/[+-]?[xyz]/g); if (!m || m.join("") !== tok) return null;
    var v = [0, 0, 0];
    m.forEach(function (s) { var sg = s[0] === "-" ? -1 : 1; var ax = "xyz".indexOf(s[s.length - 1]); v[ax] += sg; });
    return V.norm(v) > 0 ? V.unit(v) : null;
  };
  V.axisName = function (v) {                  // nearest signed axis label for reports
    var best = 0, bi = 0; for (var i = 0; i < 3; i++) if (Math.abs(v[i]) > Math.abs(v[bi])) bi = i;
    return (v[bi] < 0 ? "-" : "") + "xyz"[bi];
  };
  /* orthonormal frame: e1 = ref projected into the plane normal to n, e2 = n x e1 */
  V.frame = function (n, ref) {
    n = V.unit(n);
    if (!ref || V.parallelDeg(ref, n) < 1) ref = Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
    var e1 = V.unit(V.sub(ref, V.mul(n, V.dot(ref, n))));
    return { n: n, e1: e1, e2: V.cross(n, e1) };
  };
  /* closest point parameter t (unclamped) and perpendicular distance of p to the line a->b */
  V.toLine = function (p, a, b) {
    var ab = V.sub(b, a), L2 = V.dot(ab, ab); if (L2 < 1e-12) return { t: 0, d: V.dist(p, a) };
    var t = V.dot(V.sub(p, a), ab) / L2; var q = V.add(a, V.mul(ab, t));
    return { t: t, d: V.dist(p, q), q: q };
  };
  /* minimum distance between segments p1-p2 and q1-q2 (Ericson) */
  V.segSeg = function (p1, p2, q1, q2) {
    var d1 = V.sub(p2, p1), d2 = V.sub(q2, q1), r = V.sub(p1, q1);
    var a = V.dot(d1, d1), e = V.dot(d2, d2), f = V.dot(d2, r), s, t, EPS = 1e-9;
    if (a <= EPS && e <= EPS) return V.dist(p1, q1);
    if (a <= EPS) { s = 0; t = Math.max(0, Math.min(1, f / e)); }
    else {
      var c = V.dot(d1, r);
      if (e <= EPS) { t = 0; s = Math.max(0, Math.min(1, -c / a)); }
      else {
        var b = V.dot(d1, d2), den = a * e - b * b;
        s = den !== 0 ? Math.max(0, Math.min(1, (b * f - c * e) / den)) : 0;
        t = (b * s + f) / e;
        if (t < 0) { t = 0; s = Math.max(0, Math.min(1, -c / a)); }
        else if (t > 1) { t = 1; s = Math.max(0, Math.min(1, (b - c) / a)); }
      }
    }
    return V.dist(V.add(p1, V.mul(d1, s)), V.add(q1, V.mul(d2, t)));
  };
  return V;
})();
/* Modules: design a sub-assembly once, place it many times.
     MOD leg              define; everything until END is the module's body
       C A W8 0,0,0
       R A ^FRAME         a ^name refers OUT of the module, to something already placed
     END
     USE leg L1 at=-2,-2,0
     USE leg L2 at=2,-2,0 rot=z180 mirror=x
   Names inside become prefix.name, so a module can be placed as often as you like.
   Rotations are quarter turns about an axis, because anything else leaves the lattice. */
KNEX.expand = function (text) {
  var V = KNEX.V, out = [], mods = {}, cur = null, errors = [];
  function rot90(p, axis, times) {
    var q = p.slice();
    for (var i = 0; i < times; i++) {
      if (axis === "z") q = [-q[1], q[0], q[2]];
      else if (axis === "x") q = [q[0], -q[2], q[1]];
      else q = [q[2], q[1], -q[0]];
    }
    return q;
  }
  function xform(p, t) {
    var q = p.slice();
    if (t.mirror) { var ax = "xyz".indexOf(t.mirror); q[ax] = -q[ax]; }
    if (t.rot) q = rot90(q, t.rot.axis, t.rot.times);
    return [q[0] + t.at[0], q[1] + t.at[1], q[2] + t.at[2]];
  }
  function xdir(tok, t) {                                   // a direction: rotate and mirror, never translate
    var v = V.axis(tok); if (!v) return tok;
    var q = v.slice();
    if (t.mirror) { var ax = "xyz".indexOf(t.mirror); q[ax] = -q[ax]; }
    if (t.rot) q = rot90(q, t.rot.axis, t.rot.times);
    return q.map(function (n) { return Math.abs(n) < 1e-9 ? 0 : Number(n.toFixed(6)); }).join(",");
  }
  function isPoint(tok) { return tok && tok.indexOf(",") >= 0 && tok.split(",").length === 3 && tok.split(",").every(function (n) { return isFinite(Number(n)); }); }
  function nameOf(tok, t, defined) {
    if (tok[0] === "^") return tok.slice(1);                // reach outside the module
    return defined[tok] ? t.prefix + "." + tok : tok;
  }
  function place(mod, t, ln) {
    var defined = {};
    mod.forEach(function (l) { var k = l.trim().split(/\s+/); if (["C", "H", "S"].indexOf(k[0]) >= 0 && k[1]) defined[k[1]] = 1; });
    mod.forEach(function (raw) {
      var k = raw.trim().split(/\s+/), op = k[0];
      function P(i) { if (k[i] && isPoint(k[i])) k[i] = xform(k[i].split(",").map(Number), t).join(","); }
      function D(i) { if (k[i]) k[i] = xdir(k[i], t); }
      function N(i) { if (k[i]) k[i] = nameOf(k[i], t, defined); }
      if (op === "C") { N(1); P(3); D(4); D(5); }
      else if (op === "H") { N(1); P(3); D(4); }
      else if (op === "S") { N(1); P(3); D(4); D(5); }
      else if (op === "R") { for (var i = 1; i <= 2; i++) { if (isPoint(k[i])) P(i); else N(i); } }
      else if (op === "P" || op === "O") { P(1); }
      else if (op === "X") { P(2); }
      else if (op === "F") { N(1); P(2); }
      else if (op === "E" || op === "Y") { N(1); N(2); N(3); }
      else if (op === "M" || op === "G") { N(1); N(2); }
      else if (op === "L" || op === "A" || op === "Z") { N(1); }
      else if (op === "W") { N(1); N(2); }
      out.push(k.join(" "));
    });
  }
  text.split(/\r?\n/).forEach(function (raw, i) {
    var ln = i + 1, line = raw.replace(/(^|\s)#(?![0-9a-fA-F]{3,8}(\s|$)).*$/, "").trim();
    var t = line.split(/\s+/);
    if (t[0] === "MOD") {
      if (cur) errors.push({ line: ln, msg: "MOD " + t[1] + " inside MOD " + cur.name });
      cur = { name: t[1], body: [] }; mods[t[1]] = cur.body; return;
    }
    if (t[0] === "END") { if (!cur) errors.push({ line: ln, msg: "END without MOD" }); cur = null; return; }
    if (cur) { if (line) cur.body.push(line); return; }
    if (t[0] === "USE") {
      var mod = mods[t[1]];
      if (!mod) { errors.push({ line: ln, msg: "USE: no module named '" + t[1] + "'" }); return; }
      if (!t[2]) { errors.push({ line: ln, msg: "USE " + t[1] + ": needs a name prefix" }); return; }
      var tr = { prefix: t[2], at: [0, 0, 0], rot: null, mirror: null };
      t.slice(3).forEach(function (o) {
        if (o.indexOf("at=") === 0) { var p = o.slice(3).split(",").map(Number); if (p.length === 3 && p.every(isFinite)) tr.at = p; else errors.push({ line: ln, msg: "USE: bad at=" }); }
        else if (o.indexOf("rot=") === 0) {
          var m = /^([xyz])(90|180|270)$/.exec(o.slice(4));
          if (m) tr.rot = { axis: m[1], times: Number(m[2]) / 90 }; else errors.push({ line: ln, msg: "USE: rot must be x90, z180 and so on (quarter turns keep the lattice)" });
        } else if (o.indexOf("mirror=") === 0) { if ("xyz".indexOf(o.slice(7)) >= 0) tr.mirror = o.slice(7); else errors.push({ line: ln, msg: "USE: mirror must be x, y or z" }); }
        else errors.push({ line: ln, msg: "USE: unknown option '" + o + "'" });
      });
      place(mod, tr, ln); return;
    }
    out.push(raw);
  });
  if (cur) errors.push({ line: 0, msg: "MOD " + cur.name + " is never closed with END" });
  return { text: out.join("\n"), errors: errors, modules: Object.keys(mods) };
};
/* .knx parser. One part per line, coordinates in lattice units (U = 37.5 mm) unless the U directive changes it.
   C name kind x,y,z [normal [ref]]     connector. LEAVE THE NORMAL OUT and the plane is worked out from the
                                        rods you attach; you are told if they are not coplanar. Any point may be NAME@dx,dy,dz
   H name kind x,y,z [ref]              connector with a rod through its hub (normal taken from that rod)
   S name kind x,y,z arm [ref]          side-on clip: x,y,z is the point ON the rod, arm points from hub to rod
   R a b [colour|flexi|flexi-colour]    rod between connectors (names) or points; colour inferred from length
   P x,y,z blue|silver                  spacer on the rod through that point
   X name x,y,z [sx,sy,sz] [options]    a prop on the table. Name one from the catalogue (node cli.js props)
                                        and its real size, mass, friction and shape are used; or give your
                                        own size. Options: mass=g mu= shape=box|sphere|cylinder pad=x,y
                                        vel=x,y,z (m/s, throw it) spin=x,y,z (rad/s) fixed #hex
   F name fx,fy,fz [label]              external force in newtons applied at that connector (a finger, a weight)
   E name a b [rest=mm] [k=N/mm]        rubber band: pulls only, never pushes
   Y name a b [via=c,d] [slack=mm]      string over guides: inextensible in tension, limp otherwise
   M name conn [rpm=] [torque=N.mm]     motor at a hub joint: spins the rod against whatever holds it
   L conn                               tan clip: locks that hub connector to its rod so they turn together
   O name x,y,z [d=mm] [mass=g] [mu=]   ball: a sphere with mass that rolls and collides
   A conn                               anchor: clamp that connector to the table, so the rig cannot tip or slide
   W name conn mass=g                   weight hung on that connector: ballast, a counterweight, a test load
   Z conn [label]                       port: this connector is where another module attaches
   G name conn [teeth=]                 gear on that connector's axle; two gears that touch drive each other
   I kind=n colour=n ...                inventory available
   ! step title                         build step (everything below belongs to it)
   FLEX [on|off]                        treat every rod as a bending beam, not as rigid structure.
                                        A braced frame is rigid; a slender chain is not, and this is how
                                        you get a pole that whips when you wave it.
   T title / U mm / # comment                                                                       */
KNEX.parse = function (text) {
  var V = KNEX.V, m = { title: "", U: KNEX.U, flex: false, steps: [], conns: [], rods: [], spacers: [], extras: [], loads: [], tendons: [], motors: [], locks: [], gears: [], balls: [], anchors: [], weights: [], ports: [], inventory: {}, errors: [] };
  var names = {}, step = -1;
  function err(ln, s) { m.errors.push({ line: ln, msg: s }); }
  function pt(tok, ln) {                      // "x,y,z" | "NAME@x,y,z" (offset from a connector, units)
    if (!tok) return null;
    var rel = null, at = tok.indexOf("@");
    if (at > 0) { rel = tok.slice(0, at); tok = tok.slice(at + 1); if (!names[rel]) { err(ln, "unknown connector '" + rel + "' in '" + rel + "@'"); return null; } }
    var p = tok.split(",").map(Number);
    if (p.length !== 3 || !p.every(isFinite)) { err(ln, "bad point '" + tok + "'"); return null; }
    return rel ? { rel: rel, off: p } : p;
  }
  function ax(tok, ln, what) { if (!tok) return null; var v = V.axis(tok); if (!v) err(ln, "bad " + what + " '" + tok + "'"); return v; }
  function ref(tok, ln) { return tok ? ax(tok, ln, "ref") : null; }
  text.split(/\r?\n/).forEach(function (raw, i) {
    var ln = i + 1, line = raw.replace(/(^|\s)#(?![0-9a-fA-F]{3,8}(\s|$)).*$/, "").trim(); if (!line) return;
    var t = line.split(/\s+/), op = t[0];
    if (op === "T") { m.title = t.slice(1).join(" "); return; }
    if (op === "U") { m.U = Number(t[1]) || KNEX.U; return; }
    if (op === "FLEX") { m.flex = t[1] !== "off"; return; }
    if (op === "!") { m.steps.push({ title: t.slice(1).join(" "), line: ln }); step = m.steps.length - 1; return; }
    if (op === "I") { t.slice(1).forEach(function (kv) { var p = kv.split("="); m.inventory[p[0]] = Number(p[1]); }); return; }
    if (op === "C" || op === "H" || op === "S") {
      var name = t[1], kind = t[2], p = pt(t[3], ln);
      if (!name || !kind || !p) return err(ln, op + " needs: name kind x,y,z");
      if (!KNEX.KINDS[kind]) return err(ln, "unknown connector kind '" + kind + "' (W8 B7 Y5 G4 P4 R3 L2 O2 D1)");
      if (names[name]) return err(ln, "duplicate name '" + name + "'");
      var c = { name: name, kind: kind, at: p, mode: op, line: ln, step: step };
      if (op === "C") { c.normal = t[4] ? ax(t[4], ln, "normal") : null; c.auto = !t[4]; c.ref = ref(t[5], ln); }
      if (op === "H") { c.ref = ref(t[4], ln); }
      if (op === "S") { c.arm = ax(t[4], ln, "arm"); if (!c.arm) return; c.ref = ref(t[5], ln); }
      names[name] = c; m.conns.push(c); return;
    }
    if (op === "R") {
      var a = t[1], b = t[2], col = t[3] || null, flexi = false;
      if (!a || !b) return err(ln, "R needs two ends");
      var beam = false;
      t.slice(3).forEach(function (f) { if (f === "beam") beam = true; });
      if (beam && col === "beam") col = null;
      if (col && col.indexOf("flexi") === 0) { flexi = true; col = col.split("-")[1] || null; }
      if (col && !KNEX.ladder(col)) return err(ln, "unknown rod colour '" + col + "'");
      var A = a.indexOf(",") >= 0 ? pt(a, ln) : (names[a] ? a : err(ln, "unknown connector '" + a + "'"));
      var B = b.indexOf(",") >= 0 ? pt(b, ln) : (names[b] ? b : err(ln, "unknown connector '" + b + "'"));
      if (A === undefined || B === undefined) return;
      if (A == null || B == null) return;
      m.rods.push({ a: A, b: B, color: col, flexi: flexi, beam: beam || flexi, line: ln, step: step }); return;
    }
    if (op === "P") { var q = pt(t[1], ln); if (!q) return; m.spacers.push({ at: q, size: t[2] || "blue", line: ln, step: step }); return; }
    if (op === "X") {
      var q2 = pt(t[2], ln); if (!q2) return;
      var hasSize = t[3] && t[3].indexOf(",") >= 0 && t[3].split(",").length === 3 && t[3].split(",").every(function (n) { return isFinite(Number(n)); });
      var sz = hasSize ? pt(t[3], ln) : null;
      var cat = KNEX.PROPS[t[1]] || null;
      if (!sz && !cat) return err(ln, "X " + t[1] + ": give a size sx,sy,sz, or use a name from the catalogue (node cli.js props)");
      var x = { label: t[1], at: q2, size: sz || cat.size.slice(), color: cat ? cat.color : "#6B7280",
                mass: cat ? cat.mass : 0, mu: cat ? cat.mu : null, shape: cat ? cat.shape : "box",
                pad: [0, 0], vel: null, spin: null, fixed: false, line: ln, step: step };
      t.slice(hasSize ? 4 : 3).forEach(function (f) {
        if (f[0] === "#") x.color = f;
        else if (f === "fixed") x.fixed = true;
        else if (f.indexOf("mass=") === 0) x.mass = Number(f.slice(5));
        else if (f.indexOf("mu=") === 0) x.mu = Number(f.slice(3));
        else if (f.indexOf("pad=") === 0) { var q = f.slice(4).split(",").map(Number); x.pad = [q[0] || 0, q.length > 1 ? q[1] : q[0] || 0]; }
        else if (f.indexOf("shape=") === 0) { if (["box", "sphere", "cylinder"].indexOf(f.slice(6)) >= 0) x.shape = f.slice(6); else err(ln, "X: shape must be box, sphere or cylinder"); }
        else if (f.indexOf("vel=") === 0) { var v1 = f.slice(4).split(",").map(Number); if (v1.length === 3 && v1.every(isFinite)) x.vel = v1; else err(ln, "X: vel=x,y,z in m/s"); }
        else if (f.indexOf("spin=") === 0) { var v2 = f.slice(5).split(",").map(Number); if (v2.length === 3 && v2.every(isFinite)) x.spin = v2; else err(ln, "X: spin=x,y,z in rad/s"); }
        else err(ln, "X: unknown option '" + f + "'");
      });
      m.extras.push(x); return; }
    if (op === "F") {
      var v = pt(t[2], ln); if (!t[1] || !v) return err(ln, "F needs: connector fx,fy,fz");
      if (!names[t[1]]) return err(ln, "F: unknown connector '" + t[1] + "'");
      m.loads.push({ at: t[1], F: v, name: t.slice(3).join(" ") || t[1], line: ln, step: step }); return;
    }
    if (op === "E" || op === "Y") {
      var nm = t[1], ea = t[2], eb = t[3];
      if (!nm || !ea || !eb) return err(ln, op + " needs: name a b");
      var el = { name: nm, a: ea, b: eb, via: [], kind: op === "E" ? "band" : "string", line: ln, step: step };
      t.slice(4).forEach(function (f) {
        if (f.indexOf("via=") === 0) el.via = f.slice(4).split(",");
        else if (f.indexOf("rest=") === 0) el.rest = Number(f.slice(5));
        else if (f.indexOf("k=") === 0) el.k = Number(f.slice(2));
        else if (f.indexOf("slack=") === 0) el.slack = Number(f.slice(6));
        else err(ln, op + ": unknown option '" + f + "'");
      });
      m.tendons.push(el); return;
    }
    if (op === "M") {
      var mo = { name: t[1], conn: t[2], rpm: 45, torque: 300, line: ln, step: step };
      if (!mo.name || !mo.conn) return err(ln, "M needs: name connector");
      t.slice(3).forEach(function (f) {
        if (f.indexOf("rpm=") === 0) mo.rpm = Number(f.slice(4));
        else if (f.indexOf("torque=") === 0) mo.torque = Number(f.slice(7));
        else err(ln, "M: unknown option '" + f + "'");
      });
      m.motors.push(mo); return;
    }
    if (op === "A") { if (!t[1]) return err(ln, "A needs a connector"); m.anchors.push({ conn: t[1], line: ln }); return; }
    if (op === "W") {
      var w = { name: t[1], conn: t[2], mass: 100, line: ln, step: step };
      if (!w.name || !w.conn) return err(ln, "W needs: name connector");
      t.slice(3).forEach(function (f) { if (f.indexOf("mass=") === 0) w.mass = Number(f.slice(5)); else err(ln, "W: unknown option '" + f + "'"); });
      m.weights.push(w); return;
    }
    if (op === "Z") {
      if (!t[1]) return err(ln, "Z needs a connector");
      m.ports.push({ conn: t[1], label: t.slice(2).join(" ") || t[1], line: ln, step: step }); return;
    }
    if (op === "L") { if (!t[1]) return err(ln, "L needs a connector"); m.locks.push({ conn: t[1], line: ln }); return; }
    if (op === "G") {
      var g = { name: t[1], conn: t[2], teeth: 34, line: ln, step: step };
      if (!g.name || !g.conn) return err(ln, "G needs: name connector");
      t.slice(3).forEach(function (f) { if (f.indexOf("teeth=") === 0) g.teeth = Number(f.slice(6)); else err(ln, "G: unknown option '" + f + "'"); });
      m.gears.push(g); return;
    }
    if (op === "O") {
      var o = { label: t[1], at: pt(t[2], ln), d: 25, mass: 10, mu: null, line: ln, step: step };
      if (!o.label || !o.at) return err(ln, "O needs: name x,y,z");
      t.slice(3).forEach(function (f) {
        if (f.indexOf("d=") === 0) o.d = Number(f.slice(2));
        else if (f.indexOf("mass=") === 0) o.mass = Number(f.slice(5));
        else if (f.indexOf("mu=") === 0) o.mu = Number(f.slice(3));
        else if (f[0] === "#") o.color = f;
        else err(ln, "O: unknown option '" + f + "'");
      });
      m.balls.push(o); return;
    }
    err(ln, "unknown op '" + op + "'");
  });
  return m;
};
/* Solve: units -> mm, worklist placement (connectors may depend on rods and vice versa), rod colours from the
   sqrt2 ladder, connector frames, joint classification. */
KNEX.solve = function (m) {
  var V = KNEX.V, D = KNEX.DIMS, U = m.U, out = { conns: [], rods: [], spacers: [], extras: [], joints: [], issues: [], byName: {} };
  function issue(level, item, msg) { out.issues.push({ level: level, line: item && item.line, msg: msg }); }
  var byName = out.byName;
  function point(x) {                          // number[] | {rel, off} | connector name -> mm or null (unresolved yet)
    if (typeof x === "string") return byName[x] ? byName[x].pos : null;
    if (x.rel) return byName[x.rel] ? V.add(byName[x.rel].pos, V.mul(x.off, U)) : null;
    return V.mul(x, U);
  }
  function rodThrough(p, tol) {
    var hit = null;
    out.rods.forEach(function (rod) { var q = V.toLine(p, rod.p0, rod.p1); if (q.d < tol && q.t > -0.02 && q.t < 1.02 && (!hit || q.d < hit.d)) hit = { rod: rod, t: q.t, d: q.d, foot: q.q }; });
    return hit;
  }
  function placeRod(r, i, pa, pb) {
    var rod = { id: i, line: r.line, step: r.step, a: r.a, b: r.b, p0: pa, p1: pb, flexi: r.flexi, beam: r.beam, color: r.color, joints: [] };
    rod.L = V.dist(pa, pb); rod.u = V.unit(V.sub(pb, pa));
    var best = null, dbest = 1e9;
    KNEX.LADDER.forEach(function (l) { var d = Math.abs(l.c2c - rod.L); if (d < dbest) { dbest = d; best = l; } });
    if (rod.color) { best = KNEX.ladder(rod.color); dbest = Math.abs(best.c2c - rod.L); }
    rod.color = best.color; rod.c2c = best.c2c; rod.len = best.len; rod.ridges = best.ridges;
    if (rod.beam && !rod.flexi) { /* a bending rod is a normal part; only its span must be a real length */ }
    if (rod.flexi) {
      if (!KNEX.FLEXI[best.color]) issue("warn", r, "no flexi rod of " + best.color + " length (flexi exist: white blue yellow grey)");
      if (rod.L > best.c2c + D.tolLen) issue("error", r, "flexi " + best.color + " too short: span " + rod.L.toFixed(1) + " > " + best.c2c);
      rod.bow = rod.L < best.c2c ? Math.sqrt(3 * best.c2c * (best.c2c - rod.L) / 8) : 0;
    } else if (dbest > D.tolLen) {
      issue("error", r, "rod " + nm(r.a) + "->" + nm(r.b) + " span " + rod.L.toFixed(1) + " mm (" + (rod.L / U).toFixed(3) + " U) is not a K'NEX length; nearest " + best.color + " " + best.c2c);
    }
    rod.t0 = V.add(pa, V.mul(rod.u, D.d)); rod.t1 = V.sub(pb, V.mul(rod.u, D.d));
    out.rods.push(rod); return rod;
  }
  function nm(x) { return typeof x === "string" ? x : x.rel ? x.rel + "@" + x.off.join(",") : x.join(","); }
  function placeConn(c, p) {
    var K = { name: c.name, kind: c.kind, line: c.line, step: c.step, mode: c.mode, joints: [], used: {}, ref: c.ref };
    if (c.mode === "C") { K.pos = p; K.normal = c.normal || [0, 0, 1]; K.auto = c.auto; }
    else {
      var h = rodThrough(p, D.tolPos * 2); if (!h) return null;
      if (c.mode === "H") { K.pos = h.foot; K.normal = h.rod.u; }
      else {
        var arm = V.unit(V.sub(c.arm, V.mul(h.rod.u, V.dot(c.arm, h.rod.u))));
        if (V.norm(arm) < 0.5) issue("error", c, "S " + c.name + ": arm direction is along the rod");
        K.pos = V.sub(h.foot, V.mul(arm, D.sideR)); K.normal = h.rod.u; K.ref = arm;
      }
    }
    var f = V.frame(K.normal, K.ref); K.n = f.n; K.e1 = f.e1; K.e2 = f.e2;
    K.slotDir = function (k) { var a = k * Math.PI / 4; return V.add(V.mul(K.e1, Math.cos(a)), V.mul(K.e2, Math.sin(a))); };
    byName[c.name] = K; out.conns.push(K); return K;
  }
  // ---- worklist: place whatever can be placed until nothing moves
  var pendC = m.conns.slice(), pendR = m.rods.map(function (r, i) { r._i = i; return r; }), moved = true;
  while (moved) {
    moved = false;
    pendC = pendC.filter(function (c) { var p = point(c.at); if (!p) return true; var K = placeConn(c, p); if (K) moved = true; return !K; });
    pendR = pendR.filter(function (r) { var pa = point(r.a), pb = point(r.b); if (!pa || !pb) return true; placeRod(r, r._i, pa, pb); moved = true; return false; });
  }
  pendC.forEach(function (c) { issue("error", c, c.mode + " " + c.name + ": cannot place it (" + (c.mode === "C" ? "base connector missing" : "no rod passes through " + nm(c.at)) + ")"); });
  pendR.forEach(function (r) { issue("error", r, "rod " + nm(r.a) + "->" + nm(r.b) + ": an end is unplaced"); });
  out.rods.sort(function (a, b) { return a.id - b.id; });
  if (m.flex) out.rods.forEach(function (R) { R.beam = true; });      // every rod bends, so nothing is welded
  out.flex = !!m.flex;
  // ---- work out the plane of every connector that did not name one, from the rods that reach it
  out.conns.forEach(function (K) {
    if (!K.auto) return;
    var dirs = [], through = null;
    out.rods.forEach(function (rod) {
      if (V.dist(K.pos, rod.p0) < D.tolPos) dirs.push({ d: rod.u, rod: rod });
      else if (V.dist(K.pos, rod.p1) < D.tolPos) dirs.push({ d: V.mul(rod.u, -1), rod: rod });
      else { var q = V.toLine(K.pos, rod.p0, rod.p1); if (q.d < D.tolPos && q.t > 0.01 && q.t < 0.99) through = rod; }
    });
    var n = null;
    if (through) n = through.u;                                     // a rod through the middle is the hub axis
    else for (var i = 1; i < dirs.length && !n; i++) {
      var c = V.cross(dirs[0].d, dirs[i].d);
      if (V.norm(c) > 0.2) n = V.unit(c);
    }
    if (!n && dirs.length) {                                        // only one direction: pick a tidy plane containing it
      var cand = [[0, 0, 1], [0, 1, 0], [1, 0, 0]];
      for (var j = 0; j < 3 && !n; j++) if (Math.abs(V.dot(cand[j], dirs[0].d)) < 0.1) n = cand[j];
      if (!n) n = V.unit(V.cross(dirs[0].d, [0, 0, 1]));
    }
    if (!n) return;
    var bad = dirs.filter(function (x) { return Math.abs(V.dot(x.d, n)) > 0.08; });
    if (bad.length) {
      issue("error", K, K.name + ": the rods leaving it are not in one plane, so a single connector cannot hold them. " +
        "Directions: " + dirs.map(function (x) { return V.axisName(x.d); }).join(", ") +
        ". Use two 3D connectors (B7 or P4) at this point with their planes at 90 degrees, or move a rod.");
      return;
    }
    K.normal = n; K.ref = dirs.length ? dirs[0].d : K.ref;
    var f2 = V.frame(K.normal, K.ref); K.n = f2.n; K.e1 = f2.e1; K.e2 = f2.e2;
  });
  // ---- 3D pairs: two 3D connectors sharing a centre, planes at 90 degrees. Each rod belongs to one half.
  for (var pi = 0; pi < out.conns.length; pi++) for (var pj = pi + 1; pj < out.conns.length; pj++) {
    var CA = out.conns[pi], CB = out.conns[pj];
    if (V.dist(CA.pos, CB.pos) > 0.5) continue;
    if (KNEX.KINDS[CA.kind].cross && KNEX.KINDS[CB.kind].cross && Math.abs(V.parallelDeg(CA.n, CB.n) - 90) < D.tolAng) { CA.pair = CB.name; CB.pair = CA.name; }
  }
  // ---- joints: classify every connector x rod pair by geometry
  out.conns.forEach(function (K) {
    var slots = KNEX.KINDS[K.kind].slots;
    out.rods.forEach(function (rod) {
      var q = V.toLine(K.pos, rod.p0, rod.p1), j = null;
      var atEnd = V.dist(K.pos, rod.p0) < D.tolPos ? 0 : V.dist(K.pos, rod.p1) < D.tolPos ? 1 : -1;
      var along = V.parallelDeg(K.n, rod.u) < D.tolAng;
      if (atEnd >= 0) {
        var away = atEnd === 0 ? rod.u : V.mul(rod.u, -1), bestK = -1, bestA = 1e9;
        if (rod.beam) {                      // a bending rod leaves its socket straight and curves after: allow the angle
          var lim = rod.flexi ? 60 : 25;      // a stiff rod can only be persuaded so far before the socket lets go
          for (var kf = 0; kf < 8; kf++) { var af = V.angleDeg(K.slotDir(kf), away); if (af < bestA && af < lim && slots.indexOf(kf) >= 0 && !K.used["s" + kf]) { bestA = af; bestK = kf; } }
          /* No socket does not mean no joint. A rod ending at a connector's centre and lying along its
             normal goes THROUGH the hub, and the other half of a 3D pair can hold one too. The rigid
             path has always allowed both; the bending path used to demand a socket and called every
             axle in the model an error, which is what made FLEX unusable on anything with a bearing. */
          if (bestK >= 0) { j = { type: "end", slot: bestK, tangent: K.slotDir(bestK) }; K.used["s" + bestK] = rod.line; rod["tan" + atEnd] = j.tangent; }
          else if (along) { j = { type: "hole", t: atEnd }; }
          else if (K.pair && Math.abs(V.dot(away, out.byName[K.pair].n)) < 0.08) { /* its 3D partner holds it */ }
          else issue("error", K, K.name + ": no free socket within " + lim + " deg for the bending rod (line " + rod.line + "), and it does not run through the hub either");
        } else {
        for (var k = 0; k < 8; k++) { var a = V.angleDeg(K.slotDir(k), away); if (a < bestA) { bestA = a; bestK = k; } }
        if (bestA < D.tolAng) {
          j = { type: "end", slot: bestK };
          if (slots.indexOf(bestK) < 0) issue("error", K, K.name + " (" + K.kind + ") has no socket at slot " + bestK + " for the " + rod.color + " rod (line " + rod.line + ")");
          if (K.used["s" + bestK]) issue("error", K, K.name + ": slot " + bestK + " holds two rods (lines " + K.used["s" + bestK] + ", " + rod.line + ")");
          K.used["s" + bestK] = rod.line;
        } else if (along) { j = { type: "hole", t: atEnd }; }
        else if (K.pair && Math.abs(V.dot(away, out.byName[K.pair].n)) < 0.08) { /* the other half of the pair holds it */ }
        else issue("error", K, K.name + ": the " + rod.color + " rod (line " + rod.line + ") ends at its centre but " + bestA.toFixed(0) + " deg off every slot" + (K.pair ? ", and its 3D partner " + K.pair + " cannot hold it either" : ""));
        }
      } else if (q.t > 0.01 && q.t < 0.99) {
        if (q.d < D.tolPos && along) { j = { type: "hole", t: q.t }; if (K.used.hole) issue("error", K, K.name + ": two rods through the hub"); K.used.hole = rod.line; }
        else if (along && Math.abs(q.d - D.sideR) < D.tolLen) {
          var toRod = V.unit(V.sub(q.q, K.pos)), sk = -1, sa = 1e9;
          for (var k2 = 0; k2 < 8; k2++) { var a2 = V.angleDeg(K.slotDir(k2), toRod); if (a2 < sa) { sa = a2; sk = k2; } }
          j = { type: "side", slot: sk, t: q.t };
          var fromEnd = Math.min(V.dot(V.sub(q.q, rod.t0), rod.u), V.dot(V.sub(rod.t1, q.q), rod.u));
          if (fromEnd < 9) issue("warn", K, K.name + ": clip sits " + fromEnd.toFixed(1) + " mm from the rod's tip; the last 9 mm is the smooth end, the socket has nothing to bite");
          if (sa > D.tolAng || slots.indexOf(sk) < 0) issue("error", K, K.name + ": no socket facing the rod for the side-on clip");
          if (!rod.ridges) issue("error", K, K.name + ": side-on onto a green rod is impossible (no ridges)");
          if (K.used["s" + sk]) issue("error", K, K.name + ": slot " + sk + " already used");
          K.used["s" + sk] = rod.line;
        } else if (!rod.beam && q.d < D.connR && Math.abs(V.dot(V.sub(q.q, K.pos), K.n)) < D.connT) {
          issue("error", K, K.name + " collides with the " + rod.color + " rod (line " + rod.line + "): " + q.d.toFixed(1) + " mm from the hub, not a joint");
        }
      }
      if (j) { j.conn = K.name; j.rod = rod.id; j.line = rod.line; K.joints.push(j); rod.joints.push(j); out.joints.push(j); }
    });
  });
  out.rods.forEach(function (rod) {          // flexi: physical tips sit at the socket floor along the socket, not along the chord
    if (rod.flexi) { if (rod.tan0) rod.t0 = V.add(rod.p0, V.mul(rod.tan0, D.d)); if (rod.tan1) rod.t1 = V.add(rod.p1, V.mul(rod.tan1, D.d)); }
  });
  m.spacers.forEach(function (s) {
    var p = point(s.at), h = p && rodThrough(p, D.tolPos * 2);
    if (!h) issue("error", s, "spacer at " + nm(s.at) + ": no rod there");
    else out.spacers.push({ pos: h.foot, n: h.rod.u, size: s.size, th: D.spacer[s.size] || 3.1, line: s.line, step: s.step, rod: h.rod.id });
  });
  m.extras.forEach(function (x) { var p = point(x.at); if (p) out.extras.push({ label: x.label, pos: p, size: x.size, color: x.color, mass: x.mass, mu: x.mu, pad: x.pad || [0, 0], shape: x.shape || 'box', vel: x.vel, spin: x.spin, fixed: x.fixed, line: x.line, step: x.step }); });
  out.loads = (m.loads || []).map(function (L) { return { at: L.at, F: L.F, name: L.name, line: L.line, step: L.step }; });
  out.loads.forEach(function (L) { if (!byName[L.at]) issue("error", L, "F: connector " + L.at + " was not placed"); });
  // ---- mechanism elements
  function anchor(nameOrPt, item, what) {
    if (typeof nameOrPt === "string" && byName[nameOrPt]) return { conn: nameOrPt, pos: byName[nameOrPt].pos };
    var ball = (m.balls || []).filter(function (b) { return b.label === nameOrPt; })[0];
    if (ball) return { ball: nameOrPt, pos: V.mul(ball.at, U) };
    if (typeof nameOrPt === "string" && nameOrPt.indexOf(",") >= 0) {
      var q = nameOrPt.split(",").map(Number);
      if (q.length === 3 && q.every(isFinite)) return { conn: null, pos: V.mul(q, U) };
    }
    var p = point(nameOrPt);
    if (!p) { issue("error", item, what + ": '" + nm(nameOrPt) + "' is not a placed connector or a point"); return null; }
    return { conn: null, pos: p };
  }
  out.tendons = (m.tendons || []).map(function (T) {
    var pts = [anchor(T.a, T, T.kind)].concat((T.via || []).map(function (v) { return anchor(v, T, T.kind + " via"); }), [anchor(T.b, T, T.kind)]);
    if (pts.some(function (p) { return !p; })) return null;
    var L0 = 0; for (var i = 1; i < pts.length; i++) L0 += V.dist(pts[i - 1].pos, pts[i].pos);
    var rest = T.rest != null ? T.rest : T.kind === "band" ? L0 * 0.6 : L0 - (T.slack || 0);
    if (T.kind === "band" && rest >= L0) issue("warn", T, T.name + ": the band's rest length is not shorter than the span, so it pulls nothing");
    return { name: T.name, kind: T.kind, pts: pts, L0: L0, rest: rest, k: T.k != null ? T.k : KNEX.DIMS.bandK, line: T.line, step: T.step };
  }).filter(Boolean);
  out.motors = (m.motors || []).map(function (M) {
    var K = byName[M.conn];
    if (!K) { issue("error", M, "M " + M.name + ": connector " + M.conn + " was not placed"); return null; }
    if (!K.joints.some(function (j) { return j.type === "hole"; })) issue("error", M, "M " + M.name + ": " + M.conn + " has no rod through its hub, so there is no axle to drive");
    return { name: M.name, conn: M.conn, rpm: M.rpm, torque: M.torque, line: M.line, step: M.step };
  }).filter(Boolean);
  out.locks = (m.locks || []).map(function (L) {
    var K = byName[L.conn];
    if (!K) { issue("error", L, "L: connector " + L.conn + " was not placed"); return null; }
    if (!K.joints.some(function (j) { return j.type === "hole"; })) { issue("error", L, "L " + L.conn + ": a tan clip only makes sense on a connector with a rod through its hub"); return null; }
    K.locked = true; return { conn: L.conn, line: L.line };
  }).filter(Boolean);
  out.gears = (m.gears || []).map(function (G) {
    var K = byName[G.conn];
    if (!K) { issue("error", G, "G " + G.name + ": connector " + G.conn + " was not placed"); return null; }
    var hole = K.joints.filter(function (j) { return j.type === "hole"; })[0];
    if (!hole) { issue("error", G, "G " + G.name + ": a gear needs a rod through the connector's hub"); return null; }
    var r = KNEX.GEARS[G.teeth] || (G.teeth * 0.795);
    return { name: G.name, conn: G.conn, teeth: G.teeth, r: r, pos: K.pos, axis: K.n, line: G.line, step: G.step };
  }).filter(Boolean);
  for (var gi = 0; gi < out.gears.length; gi++) for (var gj = gi + 1; gj < out.gears.length; gj++) {
    var A = out.gears[gi], B = out.gears[gj], dd = V.dist(A.pos, B.pos);
    if (V.parallelDeg(A.axis, B.axis) < 5 && Math.abs(dd - (A.r + B.r)) < 3) { A.mesh = (A.mesh || []).concat(B.name); B.mesh = (B.mesh || []).concat(A.name); }
  }
  out.anchors = (m.anchors || []).map(function (A) {
    if (!byName[A.conn]) { issue("error", A, "A: connector " + A.conn + " was not placed"); return null; }
    byName[A.conn].anchored = true; return { conn: A.conn, line: A.line };
  }).filter(Boolean);
  out.weights = (m.weights || []).map(function (Wt) {
    if (!byName[Wt.conn]) { issue("error", Wt, "W " + Wt.name + ": connector " + Wt.conn + " was not placed"); return null; }
    return { name: Wt.name, conn: Wt.conn, mass: Wt.mass, pos: byName[Wt.conn].pos, line: Wt.line, step: Wt.step };
  }).filter(Boolean);
  out.ports = (m.ports || []).map(function (Z) {
    var K = byName[Z.conn];
    if (!K) { issue("error", Z, "Z: connector " + Z.conn + " was not placed"); return null; }
    var used = {}; K.joints.forEach(function (j) { if (j.slot != null) used[j.slot] = 1; });
    var free = KNEX.KINDS[K.kind].slots.filter(function (k) { return !used[k]; });
    var mod = Z.conn.indexOf(".") > 0 ? Z.conn.split(".")[0] : null;
    return { conn: Z.conn, label: (mod ? mod + "." : "") + Z.label, pos: K.pos, n: K.n, kind: K.kind, free: free,
             dirs: free.map(function (k) { return K.slotDir(k); }), module: mod, line: Z.line };
  }).filter(Boolean);
  out.balls = (m.balls || []).map(function (O) {
    var p = point(O.at); if (!p) { issue("error", O, "O " + O.label + ": bad position"); return null; }
    return { label: O.label, pos: p, d: O.d, mass: O.mass, mu: O.mu, color: O.color || "#B8541F", line: O.line, step: O.step };
  }).filter(Boolean);
  return out;
};
/* Rules that need the whole solved model: collisions, floating parts, inventory, stiffness, parts list. */
KNEX.check = function (m, s) {
  var V = KNEX.V, D = KNEX.DIMS;
  function issue(level, line, msg) { s.issues.push({ level: level, line: line, msg: msg }); }
  // connector vs connector: same centre -> 3D pair (B7/P4, planes at 90 deg) or a collision; stacked on a rod -> thickness
  for (var i = 0; i < s.conns.length; i++) for (var j = i + 1; j < s.conns.length; j++) {
    var A = s.conns[i], B = s.conns[j], d = V.dist(A.pos, B.pos);
    if (d < 0.5) {
      var cross = KNEX.KINDS[A.kind].cross && KNEX.KINDS[B.kind].cross, perp = Math.abs(V.parallelDeg(A.n, B.n) - 90) < D.tolAng;
      if (cross && perp) { /* already paired in the solver */ }
      else issue("error", B.line, A.name + " and " + B.name + " share a centre" + (cross ? " but planes are not at 90 deg" : " (only two 3D connectors can slot together)"));
    } else if (d < D.connT - 0.05 && V.parallelDeg(A.n, B.n) < D.tolAng && V.parallelDeg(V.sub(B.pos, A.pos), A.n) < D.tolAng) {
      issue("error", B.line, A.name + " and " + B.name + " overlap on their axle (" + d.toFixed(1) + " mm apart, thickness is 6.2)");
    } else if (d < D.connR * 1.6 && V.parallelDeg(A.n, B.n) < D.tolAng && Math.abs(V.dot(V.sub(B.pos, A.pos), A.n)) < D.connT - 0.05 && d < 2 * D.connR - 6) {
      // coplanar discs closer than their arm reach: only a problem if an arm of one points at the other (approximate: any used slot)
      var dir = V.unit(V.sub(B.pos, A.pos)), hit = false;
      for (var k = 0; k < 8; k++) if (V.angleDeg(A.slotDir(k), dir) < 12 && KNEX.KINDS[A.kind].slots.indexOf(k) >= 0) hit = true;
      for (var k2 = 0; k2 < 8; k2++) if (V.angleDeg(B.slotDir(k2), V.mul(dir, -1)) < 12 && KNEX.KINDS[B.kind].slots.indexOf(k2) >= 0) hit = true;
      if (hit) issue("warn", B.line, A.name + " and " + B.name + " are coplanar " + d.toFixed(1) + " mm apart: arms may clash");
    }
  }
  // a rod seated in one half of a 3D pair only grazes the other half's hub: not a free axle
  s.conns.forEach(function (K) {
    if (!K.pair) return;
    K.joints = K.joints.filter(function (j) {
      if (j.type !== "hole" || (j.t !== 0 && j.t !== 1)) return true;
      var R = s.rods[j.rod], keep = !R.joints.some(function (o) { return o.conn === K.pair && o.type === "end"; });
      if (!keep) { R.joints = R.joints.filter(function (o) { return o !== j; }); s.joints = s.joints.filter(function (o) { return o !== j; }); }
      return keep;
    });
  });
  // rod vs rod: physical tip segments closer than a rod diameter, unless they meet at the same connector
  for (var a = 0; a < s.rods.length; a++) for (var b = a + 1; b < s.rods.length; b++) {
    var R1 = s.rods[a], R2 = s.rods[b]; if (R1.beam || R2.beam) continue;   // flexi rods are routed by hand
    var shared = R1.joints.some(function (j1) { return R2.joints.some(function (j2) { return j1.conn === j2.conn; }); });
    var dd = V.segSeg(R1.t0, R1.t1, R2.t0, R2.t1);
    if (dd < D.rodD - 0.1 && !(shared && dd > 5.5)) issue("error", R2.line, "rods " + R1.color + " (line " + R1.line + ") and " + R2.color + " (line " + R2.line + ") intersect: " + dd.toFixed(1) + " mm apart");
  }
  // floating parts
  s.conns.forEach(function (K) { if (!K.joints.length && !K.pair) issue("warn", K.line, K.name + " (" + K.kind + ") touches nothing"); });
  /* A bearing resting on the table. A connector is a 37.5 mm disc, so one standing on edge reaches
     18.75 mm below its centre and a connector at z = 0.5 U has its rim exactly on the desk. On a
     fixed foot that is the point; on a hub it is not. The desk pushes the scraping carriage up, the
     bearing fights the contact, and the pair report enormous loads and tear out under no load at
     all: the slider pattern read 145 N under its own 9 g weight until its rails were raised. */
  s.conns.forEach(function (K) {
    if (!K.joints.some(function (j) { return j.type === "hole"; })) return;      // only moving parts care
    var flat = Math.abs(K.n[2]);                                                 // 1 = lying flat, 0 = on edge
    var low = K.pos[2] - D.connR * Math.sqrt(Math.max(0, 1 - flat * flat)) - 0.5 * D.connT * flat;
    if (low < 0.5) issue("warn", K.line, K.name + " turns on a rod but its rim reaches " + low.toFixed(1) +
      " mm above the table: a bearing that scrapes the desk fights the contact and reads far more load than it carries. Raise it.");
  });
  s.rods.forEach(function (R) {
    var ends = R.joints.filter(function (j) { return j.type === "end"; }).length, mid = R.joints.length - ends;
    if (!R.joints.length) issue("warn", R.line, "rod " + R.color + " line " + R.line + " is loose");
    else if (ends === 0 && mid === 1) issue("warn", R.line, "rod " + R.color + " line " + R.line + " hangs from one hub only (needs a cap or a second connector)");
  });
  // ---- module ports: two that face each other are meant to join. Say whether they can, and with what.
  var ports = s.ports || [];
  s.portFits = []; s.portGaps = [];
  for (var pi = 0; pi < ports.length; pi++) for (var pj = pi + 1; pj < ports.length; pj++) {
    var A = ports[pi], B = ports[pj];
    if (A.module && B.module && A.module === B.module) continue;          // same module: not an interface
    var d = V.dist(A.pos, B.pos);
    if (d < 1 || d > KNEX.U * 6.5) continue;
    var joined = s.rods.some(function (R) {
      return R.joints.some(function (j) { return j.conn === A.conn; }) && R.joints.some(function (j) { return j.conn === B.conn; });
    });
    if (joined) continue;
    var u = V.unit(V.sub(B.pos, A.pos));
    function faces(P, dir) { return P.dirs.some(function (x) { return V.angleDeg(x, dir) < 25; }); }
    if (!faces(A, u) || !faces(B, V.mul(u, -1))) continue;                // not pointing at each other: not meant to join
    var fit = KNEX.LADDER.filter(function (l) { return Math.abs(l.c2c - d) < D.tolLen; })[0];
    var aim = A.dirs.some(function (x) { return V.angleDeg(x, u) < 8; }) && B.dirs.some(function (x) { return V.angleDeg(x, V.mul(u, -1)) < 8; });
    if (fit && aim) { s.portFits.push({ a: A.label, b: B.label, rod: fit.color, d: d }); continue; }
    var split = [];
    KNEX.LADDER.forEach(function (x) { KNEX.LADDER.forEach(function (y) {
      if (x.c2c <= y.c2c && Math.abs(x.c2c + y.c2c - d) < D.tolLen) split.push(x.color + " + " + y.color); }); });
    var msg = "ports " + A.label + " and " + B.label + " face each other " + (d / KNEX.U).toFixed(3) + " U apart (" + d.toFixed(1) + " mm) but nothing joins them: ";
    msg += fit ? "a " + fit.color + " rod is the right length, but neither socket points straight at the other."
         : split.length ? "that is not a rod length. Bridge it with " + split.join(" or ") + " and a connector between."
         : "that is not a rod length, and no pair of rods adds up to it. Move one module onto the lattice.";
    s.portGaps.push({ a: A.label, b: B.label, d: d, msg: msg });
    issue("warn", A.line, msg);
  }
  // parts list + inventory
  var parts = {};
  s.conns.forEach(function (K) { parts[K.kind] = (parts[K.kind] || 0) + 1; });
  s.rods.forEach(function (R) { var k = (R.flexi ? "flexi-" : "") + R.color; parts[k] = (parts[k] || 0) + 1; });
  s.spacers.forEach(function (P) { parts["spacer-" + P.size] = (parts["spacer-" + P.size] || 0) + 1; });
  Object.keys(m.inventory).length && Object.keys(parts).forEach(function (k) {
    if (m.inventory[k] != null && parts[k] > m.inventory[k]) issue("error", 0, "inventory: need " + parts[k] + " x " + k + ", have " + m.inventory[k]);
  });
  s.parts = parts;
  // stiffness: cantilever k = 3EI/L^3 per rod length (N/mm); mass estimate
  var stiff = {}; KNEX.LADDER.forEach(function (l) { stiff[l.color] = { k_std: 3 * D.E * D.I / Math.pow(l.len, 3), k_flexi: 3 * D.Eflexi * D.Iflexi / Math.pow(l.len, 3), len: l.len }; });
  s.stiffness = stiff;
  var mass = 0; s.conns.forEach(function (K) { mass += KNEX.KINDS[K.kind].mass || 2; }); s.rods.forEach(function (R) { mass += 0.045 * R.len; }); s.mass_g = Math.round(mass);
  s.jointCounts = { end: 0, side: 0, hole: 0 }; s.joints.forEach(function (j) { s.jointCounts[j.type]++; });
  return s;
};
/* Entry point: text -> { model, solved, issues, parts }. Steps carry the build order for the viewer. */
KNEX.build = function (text) {
  var ex = KNEX.expand(text);
  var m = KNEX.parse(ex.text), s = KNEX.solve(m);
  ex.errors.forEach(function (e) { s.issues.push({ level: "error", line: e.line, msg: e.msg }); });
  s.modules = ex.modules;
  m.errors.forEach(function (e) { s.issues.push({ level: "error", line: e.line, msg: e.msg }); });
  KNEX.check(m, s);
  s.issues.sort(function (a, b) { return (a.level === "error" ? 0 : 1) - (b.level === "error" ? 0 : 1) || (a.line || 0) - (b.line || 0); });
  s.title = m.title; s.U = m.U; s.flex = !!m.flex; s.steps = m.steps; s.inventory = m.inventory;
  s.errors = s.issues.filter(function (i) { return i.level === "error"; }).length;
  s.warnings = s.issues.length - s.errors;
  return s;
};
/* plain-data export (no functions) for JSON / the viewer */
KNEX.toJSON = function (s) {
  if (!s.bodies) KNEX.bodies(s);
  var bodyOf = new Map(); (s.parts || []).forEach(function (p) { bodyOf.set(p.ref, p.body); });
  return {
    bodies: s.bodies.map(function (b) { return { id: b.id, m: b.m, c: b.c, prop: b.prop ? b.prop.label : null, fixed: !!b.fixed }; }),
    springs: (s.springs || []).map(function (x) { return { rod: x.rod, a: x.a, b: x.b, flexi: x.flexi, slides: x.slides, kLat: x.kLat }; }),
    bodyOf: bodyOf,
    title: s.title, U: s.U, steps: s.steps, parts: s.parts, mass_g: s.mass_g, jointCounts: s.jointCounts, stiffness: s.stiffness,
    issues: s.issues, errors: s.errors, warnings: s.warnings,
    conns: s.conns.map(function (K) { return { name: K.name, kind: K.kind, pos: K.pos, n: K.n, e1: K.e1, e2: K.e2, line: K.line, step: K.step, mode: K.mode, pair: K.pair || null, body: bodyOf.get(K),
      joints: K.joints.map(function (j) { return { type: j.type, slot: j.slot, t: j.t, rod: j.rod }; }) }; }),
    rods: s.rods.map(function (R) { return { id: R.id, color: R.color, flexi: R.flexi, beam: R.beam, body: bodyOf.get(R), bow: R.bow || 0, tan0: R.tan0 || null, tan1: R.tan1 || null, p0: R.p0, p1: R.p1, t0: R.t0, t1: R.t1, len: R.len, L: R.L, line: R.line, step: R.step,
      joints: R.joints.map(function (j) { return { type: j.type, conn: j.conn, slot: j.slot, t: j.t }; }) }; }),
    spacers: s.spacers.map(function (P) { return { pos: P.pos, n: P.n, size: P.size, th: P.th, step: P.step, body: bodyOf.get(s.rods[P.rod]) }; }),
    extras: s.extras, loads: s.loads || [],
    /* The mechanisms. These used to stop here: the viewer got connectors, rods and spacers and
       nothing else, so a rig held together by seventeen rubber bands drew as if it had none, and
       motors, gears, balls and ballast were invisible too. Anything the bench should be able to
       draw or label has to survive the trip through JSON. */
    tendons: (s.tendons || []).map(function (T) {
      return { name: T.name, kind: T.kind, rest: T.rest, L0: T.L0, k: T.k, line: T.line, step: T.step,
               pts: T.pts.map(function (p) { return { conn: p.conn || null, ball: p.ball || null, pos: p.pos }; }) };
    }),
    motors: (s.motors || []).map(function (M) { return { name: M.name, conn: M.conn, rpm: M.rpm, torque: M.torque, line: M.line, step: M.step }; }),
    gears:  (s.gears  || []).map(function (G) { return { name: G.name, conn: G.conn, r: G.r, teeth: G.teeth, mesh: G.mesh || [], line: G.line, step: G.step }; }),
    locks:  (s.locks  || []).map(function (L) { return { name: L.name, conn: L.conn, line: L.line, step: L.step }; }),
    balls:  (s.balls  || []).map(function (O) { return { label: O.label, pos: O.pos || (O.at ? KNEX.V.mul(O.at, s.U) : null), mass: O.mass, r: O.r, line: O.line, step: O.step }; }),
    weights: (s.weights || []).map(function (W) { return { label: W.label, conn: W.conn, pos: W.pos, mass: W.mass, line: W.line, step: W.step }; }),
    anchors: (s.anchors || []).map(function (A) { return { conn: A.conn, line: A.line }; })
  };
};
if (typeof module !== "undefined") module.exports = KNEX;
/* Mass properties and the rigid-body partition.
   Rigid joints (end-on, side-on, 3D pair) weld parts together; a hub joint is a bearing between bodies.
   Masses: connectors from the KUG shop where published, rods from the acetal density and the real
   X-section (24 mm^2 body, 31.7 mm^2 over the 9 mm ends), rho = 1.41 g/cm^3. */
KNEX.RHO = 0.00141;                                  // g/mm^3, acetal copolymer
KNEX.rodMass = function (len) { var ends = Math.min(len, 18); return KNEX.RHO * (24 * (len - ends) + 31.7 * ends); };

KNEX.bodies = function (s) {
  var V = KNEX.V, D = KNEX.DIMS;
  var parts = [];                                     // every part with mass, centre, inertia tensor about its own centre
  s.conns.forEach(function (K) {
    var m = KNEX.KINDS[K.kind].mass || 2, R = D.connR;
    parts.push({ kind: "conn", ref: K, m: m, c: K.pos, axis: K.n, Ia: 0.5 * m * R * R, It: 0.25 * m * R * R });
  });
  var springs = [];
  s.rods.forEach(function (R) {
    var m = KNEX.rodMass(R.len), u = V.unit(V.sub(R.p1, R.p0));
    var p = { kind: "rod", ref: R, m: m, c: V.mul(V.add(R.t0, R.t1), 0.5), axis: u, Ia: 0.5 * m * 3.1 * 3.1, It: m * R.len * R.len / 12 };
    if (R.beam) {                                     // a compliant rod is a force element, not structure
      p.spring = true;
      var ends = R.joints.filter(function (j) { return j.type === "end"; });
      var hubs = R.joints.filter(function (j) { return j.type === "hole"; });
      var E = R.flexi ? D.Eflexi : D.E, Ix = R.flexi ? D.Iflexi : D.I, Ax = R.flexi ? D.Aflexi : D.A;
      var fixedEnds = ends.length;                    // an end-on socket carries moment; a hub does not
      var slides = ends.length < 2 && hubs.length > 0; // a hub end slides: no axial stiffness, it is a leaf spring
      var an = (ends[0] || hubs[0] || {}).conn, bn = (ends[1] || hubs[hubs.length - 1] || {}).conn;
      var span = an && bn && s.byName[an] && s.byName[bn] ? V.dist(s.byName[an].pos, s.byName[bn].pos) : R.c2c;
      springs.push({ rod: R.id, flexi: !!R.flexi, slides: slides, a: an, b: bn, span: span,
                     c2c: R.c2c, len: R.len, m: m, E: E, I: Ix, A: Ax, fixedEnds: fixedEnds,
                     EI: E * Ix, EA: E * Ax, GJ: E / (2 * (1 + D.nu)) * (R.flexi ? 2 * D.Iflexi : D.J),
                     kLat: (fixedEnds >= 2 ? 12 : 3) * E * Ix / Math.pow(span, 3),          // N/mm across the rod at the grab point
                     kBend: (fixedEnds >= 2 ? 4 : 0) * E * Ix / span,                       // N.mm/rad between the two ends
                     Pcr: Math.PI * Math.PI * E * Ix / (R.c2c * R.c2c) });
    }
    parts.push(p);
  });
  s.springs = springs;
  s.spacers.forEach(function (P) { parts.push({ kind: "spacer", ref: P, m: 0.3, c: P.pos, axis: P.n, Ia: 0.02, It: 0.01 }); });
  (s.weights || []).forEach(function (Wt) {                         // hung ballast rides the body it hangs on
    parts.push({ kind: "weight", ref: Wt, m: Wt.mass, c: Wt.pos, axis: [0, 0, 1], Ia: 0.4 * Wt.mass * 100, It: 0.4 * Wt.mass * 100 });
  });
  // ---- union-find over rigid joints
  var idx = new Map(); parts.forEach(function (p, i) { idx.set(p.ref, i); });
  var up = parts.map(function (_, i) { return i; });
  function find(a) { while (up[a] !== a) { up[a] = up[up[a]]; a = up[a]; } return a; }
  function join(a, b) { a = find(a); b = find(b); if (a !== b) up[a] = b; }
  s.conns.forEach(function (K) {
    K.joints.forEach(function (j) { if (j.type !== "hole" && !s.rods[j.rod].beam) join(idx.get(K), idx.get(s.rods[j.rod])); });
    if (K.pair) join(idx.get(K), idx.get(s.byName[K.pair]));
  });
  s.spacers.forEach(function (P) { join(idx.get(P), idx.get(s.rods[P.rod])); });   // a spacer rides its rod
  (s.weights || []).forEach(function (Wt) { var K = s.byName[Wt.conn]; if (K) join(idx.get(Wt), idx.get(K)); });
  // ---- collect bodies
  var groups = new Map();
  parts.forEach(function (p, i) {                     // a compliant rod is not structure, but its mass rides its anchor body
    var r;
    if (p.spring) {
      var end = p.ref.joints.filter(function (j) { return j.type === "end"; })[0] || p.ref.joints[0];
      if (!end) return;
      r = find(idx.get(s.byName[end.conn]));
    } else r = find(i);
    if (!groups.has(r)) groups.set(r, []); groups.get(r).push(p);
  });
  var bodies = [];
  groups.forEach(function (ps) {
    var m = 0, c = [0, 0, 0];
    ps.forEach(function (p) { m += p.m; c = V.add(c, V.mul(p.c, p.m)); });
    c = V.mul(c, 1 / m);
    var I = [[0,0,0],[0,0,0],[0,0,0]];
    ps.forEach(function (p) {
      var n = p.axis, d = V.sub(p.c, c), d2 = V.dot(d, d);
      for (var a = 0; a < 3; a++) for (var b = 0; b < 3; b++) {
        var kron = a === b ? 1 : 0;
        I[a][b] += p.It * (kron - n[a] * n[b]) + p.Ia * n[a] * n[b] + p.m * (kron * d2 - d[a] * d[b]);
      }
    });
    var zs = ps.map(function (p) { return p.c[2]; });
    bodies.push({ parts: ps, m: m, c: c, I: I, zmin: Math.min.apply(null, zs), zmax: Math.max.apply(null, zs) });
  });
  bodies.sort(function (a, b) { return b.m - a.m; });
  bodies.forEach(function (b, i) { b.id = i; b.parts.forEach(function (p) { p.body = i; }); });
  // ---- bearings between bodies: every hub joint links a connector's body to its rod's body
  var bearings = [];
  s.conns.forEach(function (K) {
    K.joints.forEach(function (j) {
      if (j.type !== "hole") return;
      /* A compliant rod already ties its own two anchors together as a beam, so a hub that IS one of
         those anchors must not be constrained twice. Any OTHER hub on it is a real bearing and used
         to be dropped on the floor: under FLEX every rod is a beam, so every bearing in the model
         disappeared and anything riding an axle simply fell off. */
      if (s.rods[j.rod].beam) {
        var sp = (s.springs || []).filter(function (x) { return x.rod === j.rod; })[0];
        if (!sp || sp.a === K.name || sp.b === K.name) return;
      }
      var A = parts[idx.get(K)].body, B = parts[idx.get(s.rods[j.rod])].body;
      if (A === B) return;
      bearings.push({ conn: K.name, rod: j.rod, a: A, b: B, axis: s.rods[j.rod].u || V.unit(V.sub(s.rods[j.rod].p1, s.rods[j.rod].p0)), at: K.pos });
    });
  });
  // --- props with mass become bodies of their own (a mouse, a phone, a weight)
  (s.extras || []).forEach(function (X) {
    if (!X.mass) return;
    var m = X.mass, w = X.size[0], d = X.size[1], h = X.size[2], I;
    if (X.shape === "sphere") { var r = w / 2, i = 0.4 * m * r * r; I = [[i,0,0],[0,i,0],[0,0,i]]; }
    else if (X.shape === "cylinder") {                              // axis along z
      var rc = w / 2, it = m * (3 * rc * rc + h * h) / 12, ia = 0.5 * m * rc * rc;
      I = [[it,0,0],[0,it,0],[0,0,ia]];
    } else I = [[m*(d*d+h*h)/12,0,0],[0,m*(w*w+h*h)/12,0],[0,0,m*(w*w+d*d)/12]];
    var b = { parts: [], m: m, c: X.pos.slice(), I: I, prop: X, zmin: X.pos[2] - h / 2, zmax: X.pos[2] + h / 2, fixed: X.fixed };
    bodies.push(b);
  });
  bodies.forEach(function (b, i) { b.id = i; });
  s.bodies = bodies; s.bearings = bearings; s.parts = parts;
  return { bodies: bodies, bearings: bearings };
};
/* General rigid-body physics for any K'NEX build. SI units (m, kg, s, N, rad).
   Bodies come from the rigid partition; every hub and side-on joint becomes a real constraint;
   the desk is a contact plane with Coulomb friction; flexi rods are force elements; you can push
   anywhere with an external force. Sequential-impulse solver, Gauss-Seidel, Baumgarte stabilisation. */
KNEX.phys = (function () {
  var V = KNEX.V, G = 9.80665;
  // ---------- quaternion helpers (x, y, z, w)
  function qmul(a, b) { return [a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1], a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],
                                a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3], a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]]; }
  function qnorm(q) { var n = Math.hypot(q[0], q[1], q[2], q[3]) || 1; return [q[0]/n, q[1]/n, q[2]/n, q[3]/n]; }
  function qrot(q, v) {                                  // rotate v by q
    var t = V.mul(V.cross([q[0], q[1], q[2]], v), 2);
    return V.add(V.add(v, V.mul(t, q[3])), V.cross([q[0], q[1], q[2]], t));
  }
  function qmat(q) {                                     // rotation matrix
    var x=q[0],y=q[1],z=q[2],w=q[3];
    return [[1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w)], [2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w)], [2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y)]];
  }
  function m3mul(A, B) { var O=[[0,0,0],[0,0,0],[0,0,0]]; for(var i=0;i<3;i++)for(var j=0;j<3;j++)for(var k=0;k<3;k++)O[i][j]+=A[i][k]*B[k][j]; return O; }
  function m3T(A) { return [[A[0][0],A[1][0],A[2][0]],[A[0][1],A[1][1],A[2][1]],[A[0][2],A[1][2],A[2][2]]]; }
  function m3v(A, v) { return [A[0][0]*v[0]+A[0][1]*v[1]+A[0][2]*v[2], A[1][0]*v[0]+A[1][1]*v[1]+A[1][2]*v[2], A[2][0]*v[0]+A[2][1]*v[1]+A[2][2]*v[2]]; }
  function m3inv(A) {
    var d = A[0][0]*(A[1][1]*A[2][2]-A[1][2]*A[2][1]) - A[0][1]*(A[1][0]*A[2][2]-A[1][2]*A[2][0]) + A[0][2]*(A[1][0]*A[2][1]-A[1][1]*A[2][0]);
    if (Math.abs(d) < 1e-18) return [[0,0,0],[0,0,0],[0,0,0]];
    return [[(A[1][1]*A[2][2]-A[1][2]*A[2][1])/d, (A[0][2]*A[2][1]-A[0][1]*A[2][2])/d, (A[0][1]*A[1][2]-A[0][2]*A[1][1])/d],
            [(A[1][2]*A[2][0]-A[1][0]*A[2][2])/d, (A[0][0]*A[2][2]-A[0][2]*A[2][0])/d, (A[0][2]*A[1][0]-A[0][0]*A[1][2])/d],
            [(A[1][0]*A[2][1]-A[1][1]*A[2][0])/d, (A[0][1]*A[2][0]-A[0][0]*A[2][1])/d, (A[0][0]*A[1][1]-A[0][1]*A[1][0])/d]];
  }
  // ---------- body
  function Body(i, m, c, I, fixed) {
    this.id = i; this.m = fixed ? 0 : m; this.invM = fixed ? 0 : 1 / m;
    this.x = c.slice(); this.x0 = c.slice(); this.q = [0, 0, 0, 1];
    this.v = [0, 0, 0]; this.w = [0, 0, 0];
    this.Ib = I; this.invIb = fixed ? [[0,0,0],[0,0,0],[0,0,0]] : m3inv(I);
    this.fixed = !!fixed; this.force = [0, 0, 0]; this.torque = [0, 0, 0];
  }
  Body.prototype.cacheI = function () { var R = qmat(this.q); this._iI = m3mul(m3mul(R, this.invIb), m3T(R)); return this._iI; };
  Body.prototype.invI = function () { return this._iI || this.cacheI(); };
  Body.prototype.toWorld = function (p0) { return V.add(this.x, qrot(this.q, V.sub(p0, this.x0))); };
  Body.prototype.pointVel = function (r) { return V.add(this.v, V.cross(this.w, r)); };
  Body.prototype.applyImpulse = function (r, P) {
    if (this.fixed) return;
    this.v = V.add(this.v, V.mul(P, this.invM));
    this.w = V.add(this.w, m3v(this.invI(), V.cross(r, P)));
  };
  Body.prototype.applyAngImpulse = function (L) { if (!this.fixed) this.w = V.add(this.w, m3v(this.invI(), L)); };
  return { G: G, Body: Body, qmul: qmul, qnorm: qnorm, qrot: qrot, qmat: qmat, m3v: m3v, m3inv: m3inv, m3mul: m3mul, m3T: m3T };
})();
/* Build a physics world from a solved build: bodies, joints, compliant rods, loads, collision features. */
KNEX.phys.world = function (s, opts) {
  opts = opts || {};
  var V = KNEX.V, D = KNEX.DIMS, P = KNEX.phys, MM = 0.001;
  if (!s.bodies) KNEX.bodies(s);
  var ground = (opts.groundZ != null ? opts.groundZ : 0) * MM;
  function lowest(p) {
    if (p.kind === "rod") return Math.min(p.ref.t0[2], p.ref.t1[2]) - D.rodD / 2;
    var nz = Math.abs(p.axis[2]);
    return p.c[2] - D.connR * Math.sqrt(Math.max(0, 1 - nz * nz)) - (nz > 0.9 ? D.connT / 2 : 0);
  }
  s.bodies.forEach(function (b) { b.low = b.prop ? b.zmin : Math.min.apply(null, b.parts.map(lowest)); });
  var deskers = s.bodies.filter(function (b) { return !b.prop && b.low <= (opts.groundZ || 0) + 1.5; });
  var baseBody = deskers.sort(function (a, b) { return b.m - a.m; })[0] || s.bodies[0];
  var pinBase = opts.pinBase !== false;
  var bodies = s.bodies.map(function (b) {
    var I = b.I.map(function (r) { return r.map(function (x) { return x * 1e-9; }); });
    var anchored = b.parts.some(function (p) { return p.kind === "conn" && p.ref.anchored; });
    var fixed = b.fixed || anchored || (pinBase && !b.prop && b.id === baseBody.id);
    var B = new P.Body(b.id, b.m / 1000, V.mul(b.c, MM), I, fixed);
    B.src = b; B.prop = b.prop || null;
    if (b.prop && b.prop.vel) B.v = b.prop.vel.slice();              // thrown, not just dropped
    if (b.prop && b.prop.spin) B.w = b.prop.spin.slice();
    var surf = KNEX.SURFACES[opts.surface] || null;
    B.mu = b.prop && b.prop.mu != null ? b.prop.mu
         : b.prop ? (surf ? surf.mu : (opts.mu != null ? opts.mu : D.muDesk))
         : (surf ? surf.muKnex : (opts.muKnex != null ? opts.muKnex : 0.35));
    return B;
  });
  // ---- joints (hub bearings and side-on clips)
  var jm = {};
  s.bearings.forEach(function (bg) {
    var k = bg.a + "-" + bg.b + "-" + bg.rod;
    (jm[k] = jm[k] || { a: bg.a, b: bg.b, axis: V.unit(bg.axis), pts: [], conns: [], rod: bg.rod, kind: "hub" });
    jm[k].pts.push(V.mul(bg.at, MM)); jm[k].conns.push(bg.conn);
  });
  s.conns.forEach(function (K) {
    K.joints.forEach(function (jt) {
      if (jt.type !== "side") return;
      var pa = s.parts.filter(function (p) { return p.ref === K; })[0], pb = s.parts.filter(function (p) { return p.ref === s.rods[jt.rod]; })[0];
      if (!pa || !pb || pa.body === pb.body) return;
      jm["side" + K.name] = { a: pa.body, b: pb.body, axis: s.rods[jt.rod].u, pts: [V.mul(K.pos, MM)], conns: [K.name], rod: jt.rod, kind: "side" };
    });
  });
  var joints = Object.keys(jm).map(function (k) {
    var j = jm[k], A = bodies[j.a], B = bodies[j.b];
    var anchor = V.mul(j.pts.reduce(function (u, p) { return V.add(u, p); }, [0, 0, 0]), 1 / j.pts.length);
    var rod = s.rods[j.rod];
    j.conns.forEach(function (n) { var c = s.byName[n]; if (c) c.jointName = j.conns.join("+"); });
    // a hub slides along its rod unless something sits against it: a spacer, a cap or another connector within 12 mm
    var along = function (pt) { return V.dot(V.sub(pt, rod.p0), rod.u); };
    var stops = s.spacers.filter(function (sp) { return sp.rod === j.rod; }).map(function (sp) { return along(sp.pos); })
      .concat(rod.joints.map(function (x) { return along(x.type === "end" ? (x.t === 0 ? rod.p0 : rod.p1) : s.byName[x.conn].pos); }));
    var locked = j.pts.some(function (pt) {                          // test each hub, not the midpoint between them
      var a = along(V.mul(pt, 1000));
      return stops.some(function (v) { return Math.abs(v - a) > 0.5 && Math.abs(v - a) < 12; });
    });
    return { A: A, B: B, axis: V.unit(j.axis), rA: V.sub(anchor, A.x), rB: V.sub(anchor, B.x), anchor: anchor,
             locked: locked, kind: j.kind, name: j.conns.join("+"), mu: j.kind === "side" ? D.muSide : D.muHub,
             span: j.pts.length > 1 ? V.dist(j.pts[0], j.pts[j.pts.length - 1]) * 1000 : 0, rod: j.rod, acc: [0, 0, 0], accSpin: 0 };
  });
  // ---- compliant rods: a cantilever anchored in its first socket, its far end pulled by the other body
  var beams = s.springs.map(function (sp) {
    var rod = s.rods[sp.rod];
    var A = s.byName[sp.a], B = s.byName[sp.b];
    var pa = s.parts.filter(function (p) { return p.ref === A; })[0], pb = s.parts.filter(function (p) { return p.ref === B; })[0];
    var ja = rod.joints.filter(function (x) { return x.conn === sp.a; })[0];
    var jb = rod.joints.filter(function (x) { return x.conn === sp.b; })[0];
    /* The zero-force state is how the thing was built, not how the sockets point. A rod bent into an arch
       is pre-stressed, and the checker says so, but the simulation must not try to straighten it. */
    var dirA = V.unit(V.sub(B.pos, A.pos)), dirB = V.unit(V.sub(A.pos, B.pos));
    var sockA = ja && ja.slot != null ? A.slotDir(ja.slot) : dirA;
    var preBend = V.angleDeg(sockA, dirA);                  // how far it was persuaded when you built it
    return { A: bodies[pa.body], B: bodies[pb.body], pa: V.mul(A.pos, MM), pb: V.mul(B.pos, MM), dirA: dirA, dirB: dirB, preBend: preBend,
             L: sp.c2c * MM, flexi: sp.flexi, name: sp.a + "-" + sp.b, rod: sp.rod, color: rod.color,
             slides: sp.slides, EA: sp.EA, Pcr: sp.Pcr, kLat: sp.kLat * 1000, kBend: sp.kBend / 1000, span: sp.span * MM,
             kAxial: sp.slides ? 0 : sp.EA / (sp.c2c * MM), F: 0, Flat: 0 };
  });
  // ---- external loads declared in the build
  var loads = (s.loads || []).map(function (L) {
    var K = s.byName[L.at], p = K && s.parts.filter(function (q) { return q.ref === K; })[0];
    return { body: p ? bodies[p.body] : bodies[0], at: V.mul(K ? K.pos : [0, 0, 0], MM), F: L.F.slice(), name: L.name, gain: 1 };
  });
  // ---- collision features: sample points with a radius, in each body's rest frame
  bodies.forEach(function (B) {
    B.feat = [];
    if (B.prop) {
      var pd = B.prop.pad || [0, 0], sh = B.prop.shape || "box";
      var h = V.mul(V.add(B.prop.size, [2 * pd[0], 2 * pd[1], 0]), 0.5 * MM);
      if (sh === "sphere") {
        B.radius = h[0]; B.feat.push({ p: B.x.slice(), r: h[0] });
      } else if (sh === "cylinder") {
        B.cyl = { r: h[0], h: h[2] };                                // axis along the body's local z
        for (var k = 0; k < 8; k++) {                                // rim points at both ends, plus the centres
          var a = k * Math.PI / 4;
          B.feat.push({ p: V.add(B.x, [Math.cos(a) * h[0], Math.sin(a) * h[0], -h[2]]), r: 0 });
          B.feat.push({ p: V.add(B.x, [Math.cos(a) * h[0], Math.sin(a) * h[0], h[2]]), r: 0 });
        }
        B.feat.push({ p: V.add(B.x, [0, 0, -h[2]]), r: 0 });
        B.feat.push({ p: V.add(B.x, [0, 0, h[2]]), r: 0 });
      } else {
        for (var sx = -1; sx <= 1; sx += 2) for (var sy = -1; sy <= 1; sy += 2) for (var sz = -1; sz <= 1; sz += 2)
          B.feat.push({ p: V.add(B.x, [sx * h[0], sy * h[1], sz * h[2]]), r: 0 });
        B.box = h;
      }
      return;
    }
    B.src.parts.forEach(function (p) {
      if (p.kind === "rod") {
        var a = V.mul(p.ref.t0, MM), b = V.mul(p.ref.t1, MM), L = V.dist(a, b), n = Math.max(1, Math.round(L / 0.010));
        for (var i = 0; i <= n; i++) B.feat.push({ p: V.add(a, V.mul(V.sub(b, a), i / n)), r: D.rodD / 2 * MM, part: p });
      } else if (p.kind === "conn") {
        B.feat.push({ p: V.mul(p.c, MM), r: D.hubOD / 2 * MM, part: p });
        KNEX.KINDS[p.ref.kind].slots.forEach(function (k) {              // two samples along each arm
          var d = V.rot(p.ref.e1, p.axis, k * 45);
          /* Spheres of radius 4 along each arm, placed so the OUTER one just reaches the rim at connR
             and no further. They used to sit at 18 with radius 4, which made every connector 22 mm in
             radius instead of 18.75: a connector at its natural resting height of 0.5 U then dug
             3.25 mm into the desk, and the contact pushing it out fought whatever held it. That is
             where the slider's phantom 145 N came from, and why FLEX looked unusable. */
          [D.connR - 10, D.connR - 4].forEach(function (r) { B.feat.push({ p: V.add(V.mul(p.c, MM), V.mul(d, r * MM)), r: 4 * MM, part: p }); });
        });
      }
    });
  });
  bodies.forEach(function (B) {
    B.rBound = B.feat.reduce(function (u, f) { return Math.max(u, V.dist(f.p, B.x) + f.r); }, 0);
    if (B.cyl) B.rBound = Math.max(B.rBound, Math.hypot(B.cyl.r, B.cyl.h));
  });
  var W0 = { bodies: bodies, joints: joints, beams: beams, loads: loads, contacts: [], ground: ground, surface: opts.surface || null,
           base: baseBody.id, solved: s, t: 0, iters: opts.iters || 14, pinBase: pinBase,
           gravity: opts.gravity != null ? opts.gravity : P.G,
           breakage: opts.breakage !== false, events: [] };
  return KNEX.phys.mech(W0, s);
};
/* Sequential-impulse solver: gravity, springs, external loads, joints, desk contacts with Coulomb friction. */
(function () {
  var V = KNEX.V, P = KNEX.phys, D = KNEX.DIMS, BETA = 0.2, SLOP = 0.0002;
  function perp(a) { var t = Math.abs(a[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]; var u = V.unit(V.cross(a, t)); return [u, V.cross(a, u)]; }
  /* One constraint row. `soft` = {alpha, lam} makes it a spring of stiffness 1/alpha instead of rigid:
     the impulse it can deliver is limited by the compliance, which stays stable at any stiffness. */
  function rowLin(A, rA, B, rB, dir, bias, lo, hi, soft) {
    var vrel = V.sub(B.pointVel(rB), A.pointVel(rA)), cdot = V.dot(dir, vrel);
    var k = A.invM + B.invM
          + V.dot(dir, V.cross(P.m3v(A.invI(), V.cross(rA, dir)), rA))
          + V.dot(dir, V.cross(P.m3v(B.invI(), V.cross(rB, dir)), rB));
    var at = soft ? soft.alpha / (soft.dt * soft.dt) : 0;
    if (k + at < 1e-12) return 0;
    var lam = -(cdot + bias + at * (soft ? soft.lam : 0)) / (k + at);
    if (lo !== undefined) lam = Math.max(lo, Math.min(hi, lam));
    if (soft) soft.lam += lam;
    A.applyImpulse(rA, V.mul(dir, -lam)); B.applyImpulse(rB, V.mul(dir, lam));
    return lam;
  }
  function rowAng(A, B, dir, bias, lo, hi, soft) {
    var cdot = V.dot(dir, V.sub(B.w, A.w));
    var k = V.dot(dir, P.m3v(A.invI(), dir)) + V.dot(dir, P.m3v(B.invI(), dir));
    var at = soft ? soft.alpha / (soft.dt * soft.dt) : 0;
    if (k + at < 1e-12) return 0;
    var lam = -(cdot + bias + at * (soft ? soft.lam : 0)) / (k + at);
    if (lo !== undefined) lam = Math.max(lo, Math.min(hi, lam));
    if (soft) soft.lam += lam;
    A.applyAngImpulse(V.mul(dir, -lam)); B.applyAngImpulse(V.mul(dir, lam));
    return lam;
  }
  KNEX.phys.step = function (W, dt, input) {
    input = input || {}; var G = P.G;
    var bodies = W.bodies;
    bodies.forEach(function (b) { b.cacheI(); b.force = [0, 0, b.fixed ? 0 : -b.m * (W.gravity != null ? W.gravity : G)]; b.torque = [0, 0, 0]; });
    // ---- compliant rods: a beam anchored in its socket. The far end is held by constraints whose
    // compliance IS the rod's stiffness, so a stiff rod stays stable and a chain of them acts as a spring.
    W.beams.forEach(function (bm) {
      if (bm.broken) { bm.F = 0; bm.Flat = 0; bm.Mbend = 0; return; }
      var qa = bm.A.toWorld(bm.pa), u = P.qrot(bm.A.q, bm.dirA);
      var target = V.add(qa, V.mul(u, bm.span));                        // where the rod's far end wants to be
      var qb = bm.B.toWorld(bm.pb);
      bm.qa = qa; bm.qb = qb; bm.u = u; bm.target = target;
      bm.rA = V.sub(target, bm.A.x); bm.rB = V.sub(qb, bm.B.x);
      var err = V.sub(qb, target);
      bm.par = V.dot(err, u); bm.err = err;
      var t = Math.abs(u[0]) < 0.9 ? V.unit(V.cross(u, [1, 0, 0])) : V.unit(V.cross(u, [0, 1, 0]));
      bm.t = [t, V.cross(u, t)];
      var dirBw = P.qrot(bm.B.q, bm.dirB);
      bm.eAng = V.cross(V.mul(u, -1), dirBw);                           // how far the far socket has turned off the rod
      bm.sLat = bm.sLat || [{ }, { }]; bm.sAng = bm.sAng || [{ }, { }]; bm.sAx = bm.sAx || { };
      bm.sLat.forEach(function (o) { o.lam = 0; o.alpha = 1 / bm.kLat; o.dt = dt; });
      bm.sAng.forEach(function (o) { o.lam = 0; o.alpha = bm.kBend > 0 ? 1 / bm.kBend : 1e6; o.dt = dt; });
      bm.sAx.lam = 0; bm.sAx.alpha = 0; bm.sAx.dt = dt;
      bm.len = V.dist(qa, qb);
      if (bm.flexi) {                                                   // buckling is a force, not a constraint
        var Fax = bm.len < bm.span ? bm.Pcr * (1 + 0.6 * (bm.span - bm.len) / bm.span)
                                   : -bm.EA * (bm.len - bm.span) / bm.span;
        bm.F = Fax;
        var Fv = V.mul(u, Fax);
        if (!bm.B.fixed) { bm.B.force = V.add(bm.B.force, Fv); bm.B.torque = V.add(bm.B.torque, V.cross(V.sub(qb, bm.B.x), Fv)); }
        if (!bm.A.fixed) { bm.A.force = V.sub(bm.A.force, Fv); bm.A.torque = V.sub(bm.A.torque, V.cross(bm.rA, Fv)); }
      }
    });
    // ---- rubber bands: they pull along the whole routed path once stretched past their rest length
    (W.tendons || []).forEach(function (T) {
      var pts = T.nodes.map(function (n) { return n.body.toWorld(n.p); }), L = 0, segs = [];
      for (var i = 1; i < pts.length; i++) { var d = V.sub(pts[i], pts[i - 1]), l = V.norm(d); L += l; segs.push(l > 1e-9 ? V.mul(d, 1 / l) : [0, 0, 1]); }
      T.len = L; T.pts = pts; T.segs = segs;
      if (T.kind !== "band") { T.F = 0; return; }
      T.F = L > T.rest ? T.k * (L - T.rest) : 0;
      if (!T.F) return;
      for (var j = 0; j < segs.length; j++) {                       // each segment pulls its two ends together
        var Fv = V.mul(segs[j], T.F), a = T.nodes[j], b = T.nodes[j + 1];
        if (!a.body.fixed) { a.body.force = V.add(a.body.force, Fv); a.body.torque = V.add(a.body.torque, V.cross(V.sub(pts[j], a.body.x), Fv)); }
        if (!b.body.fixed) { b.body.force = V.sub(b.body.force, Fv); b.body.torque = V.sub(b.body.torque, V.cross(V.sub(pts[j + 1], b.body.x), Fv)); }
      }
    });
    // ---- external loads declared in the build, plus whatever the caller pushes this step
    (W.loads || []).concat(input.loads || []).forEach(function (L) {
      var b = L.body || bodies[L.bodyId || 0]; if (!b || b.fixed) return;
      var at = L.world ? L.at : b.toWorld(L.at), F = L.F;
      var scale = L.gain != null ? L.gain : (input.gain != null && L.name === input.gainFor ? input.gain : 1);
      F = V.mul(F, scale);
      b.force = V.add(b.force, F); b.torque = V.add(b.torque, V.cross(V.sub(at, b.x), F));
      if (L.torque) b.torque = V.add(b.torque, V.mul(L.torque, scale));   // a twist applied about an axis
      L.applied = F;
    });
    // ---- integrate velocities
    bodies.forEach(function (b) {
      if (b.fixed) { b.v = [0, 0, 0]; b.w = [0, 0, 0]; return; }
      b.v = V.add(b.v, V.mul(b.force, b.invM * dt));
      b.w = V.add(b.w, P.m3v(b.invI(), V.mul(b.torque, dt)));
      var damp = Math.max(0, 1 - (input.damping != null ? input.damping : 0.4) * dt);
      b.v = V.mul(b.v, damp); b.w = V.mul(b.w, damp);
    });
    // ---- prepare joint frames
    W.joints.forEach(function (j) {
      j.rAw = P.qrot(j.A.q, j.rA); j.rBw = P.qrot(j.B.q, j.rB);
      j.aA = P.qrot(j.A.q, j.axis); j.aB = P.qrot(j.B.q, j.axis);
      j.ax = V.unit(V.add(j.aA, j.aB)); j.t = perp(j.ax);
      j.eLin = V.sub(V.add(j.B.x, j.rBw), V.add(j.A.x, j.rAw));
      j.eAng = V.cross(j.aA, j.aB);
      j.acc = [0, 0, 0]; j.accSpin = 0;
    });
    KNEX.phys.collide(W);
    // ---- solve
    for (var it = 0; it < W.iters; it++) {
      W.joints.forEach(function (j) {
        if (j.broken) return;
        var b = BETA / dt;                                               // Baumgarte: drive the position error to zero
        j.acc[0] += rowLin(j.A, j.rAw, j.B, j.rBw, j.t[0], b * V.dot(j.eLin, j.t[0]));
        j.acc[1] += rowLin(j.A, j.rAw, j.B, j.rBw, j.t[1], b * V.dot(j.eLin, j.t[1]));
        if (j.locked) j.acc[2] += rowLin(j.A, j.rAw, j.B, j.rBw, j.ax, b * V.dot(j.eLin, j.ax));
        rowAng(j.A, j.B, j.t[0], b * V.dot(j.eAng, j.t[0]));
        rowAng(j.A, j.B, j.t[1], b * V.dot(j.eAng, j.t[1]));
        var lim = j.lockedSpin ? 1e9 : j.mu * (D.hubHoleD / 2000) * Math.hypot(j.acc[0], j.acc[1], j.acc[2]);
        var ls = rowAng(j.A, j.B, j.ax, j.lockedSpin ? b * V.dot(j.eAng, j.ax) : 0, -lim - j.accSpin, lim - j.accSpin);
        j.accSpin += ls;
      });
      W.beams.forEach(function (bm) {
        if (bm.broken) return;
        if (!bm.flexi && !bm.slides) rowLin(bm.A, bm.rA, bm.B, bm.rB, bm.u, BETA / dt * bm.par, undefined, undefined, bm.sAx);
        bm.sLat.forEach(function (o, i) { rowLin(bm.A, bm.rA, bm.B, bm.rB, bm.t[i], V.dot(bm.err, bm.t[i]) / dt, undefined, undefined, o); });
        if (bm.kBend > 0) bm.sAng.forEach(function (o, i) { rowAng(bm.A, bm.B, bm.t[i], V.dot(bm.eAng, bm.t[i]) / dt, undefined, undefined, o); });
      });
      (W.tendons || []).forEach(function (T) {                        // a string cannot get longer than it is
        if (T.kind !== "string" || T.len <= T.rest) { T.lam = 0; return; }
        var cdot = 0, k = 0;
        for (var i = 0; i < T.segs.length; i++) {
          var a = T.nodes[i], b = T.nodes[i + 1], u = T.segs[i];
          var rA = V.sub(T.pts[i], a.body.x), rB = V.sub(T.pts[i + 1], b.body.x);
          cdot += V.dot(u, V.sub(b.body.pointVel(rB), a.body.pointVel(rA)));
          k += a.body.invM + b.body.invM
             + V.dot(u, V.cross(P.m3v(a.body.invI(), V.cross(rA, u)), rA))
             + V.dot(u, V.cross(P.m3v(b.body.invI(), V.cross(rB, u)), rB));
        }
        if (k < 1e-12) return;
        var lam = -(cdot + BETA / dt * (T.len - T.rest)) / k, old = T.lam;
        T.lam = Math.min(0, T.lam + lam); lam = T.lam - old;                 // tension only
        for (var i2 = 0; i2 < T.segs.length; i2++) {
          var a2 = T.nodes[i2], b2 = T.nodes[i2 + 1], u2 = T.segs[i2];
          a2.body.applyImpulse(V.sub(T.pts[i2], a2.body.x), V.mul(u2, -lam));
          b2.body.applyImpulse(V.sub(T.pts[i2 + 1], b2.body.x), V.mul(u2, lam));
        }
      });
      (W.motors || []).forEach(function (M) {                          // motor: drive the joint's spin, torque-limited
        var j = M.joint, lim = M.tau * dt * M.on;
        var cdot = V.dot(j.ax, V.sub(j.B.w, j.A.w)) - M.w * M.on;
        var k = V.dot(j.ax, P.m3v(j.A.invI(), j.ax)) + V.dot(j.ax, P.m3v(j.B.invI(), j.ax));
        if (k < 1e-12) return;
        var lam = -cdot / k, old = M.lam;
        M.lam = Math.max(-lim, Math.min(lim, M.lam + lam)); lam = M.lam - old;
        j.A.applyAngImpulse(V.mul(j.ax, -lam)); j.B.applyAngImpulse(V.mul(j.ax, lam));
      });
      (W.gearPairs || []).forEach(function (G) {                       // meshing gears: r1 w1 + r2 w2 = 0 about the carrier
        var a = G.a, b = G.b, C = G.carrier;
        var Ja = V.mul(a.joint.ax, a.r), Jb = V.mul(b.joint.ax, b.r), Jc = V.mul(V.add(Ja, Jb), -1);
        var wa = a.joint.B === C ? a.joint.A : a.joint.B, wb = b.joint.B === C ? b.joint.A : b.joint.B;
        var cdot = V.dot(Ja, wa.w) + V.dot(Jb, wb.w) + V.dot(Jc, C.w);
        var k = V.dot(Ja, P.m3v(wa.invI(), Ja)) + V.dot(Jb, P.m3v(wb.invI(), Jb)) + V.dot(Jc, P.m3v(C.invI(), Jc));
        if (k < 1e-12) return;
        var lam = -cdot / k;
        wa.applyAngImpulse(V.mul(Ja, lam)); wb.applyAngImpulse(V.mul(Jb, lam)); C.applyAngImpulse(V.mul(Jc, lam));
        G.lam = lam / dt;
      });
      W.contacts.forEach(function (c) {
        if (c.pen < -0.0002) return;                                 // still clear of the surface: nothing to push against
        var A = c.A, B = c.B, n = c.n;
        var bias = -BETA / dt * Math.max(0, c.pen - SLOP);
        var vrel = B ? V.sub(A.pointVel(c.r), B.pointVel(c.rB)) : A.pointVel(c.r);
        var k = A.invM + V.dot(n, V.cross(P.m3v(A.invI(), V.cross(c.r, n)), c.r))
              + (B ? B.invM + V.dot(n, V.cross(P.m3v(B.invI(), V.cross(c.rB, n)), c.rB)) : 0);
        if (k < 1e-12) return;
        var lam = -(V.dot(n, vrel) + bias) / k, old = c.lam;
        c.lam = Math.max(0, c.lam + lam); lam = c.lam - old;
        A.applyImpulse(c.r, V.mul(n, lam)); if (B) B.applyImpulse(c.rB, V.mul(n, -lam));
        var t0 = V.unit(Math.abs(n[2]) < 0.9 ? V.cross(n, [0, 0, 1]) : V.cross(n, [1, 0, 0])), t1 = V.cross(n, t0);
        var lim = c.mu * c.lam;
        [t0, t1].forEach(function (t, i) {
          var vt = B ? V.sub(A.pointVel(c.r), B.pointVel(c.rB)) : A.pointVel(c.r);
          var kt = A.invM + V.dot(t, V.cross(P.m3v(A.invI(), V.cross(c.r, t)), c.r))
                 + (B ? B.invM + V.dot(t, V.cross(P.m3v(B.invI(), V.cross(c.rB, t)), c.rB)) : 0);
          if (kt < 1e-12) return;
          var want = -V.dot(t, vt) / kt, o = c.lt[i];
          c.lt[i] = Math.max(-lim, Math.min(lim, c.lt[i] + want)); var d = c.lt[i] - o;
          A.applyImpulse(c.r, V.mul(t, d)); if (B) B.applyImpulse(c.rB, V.mul(t, -d));
        });
      });
    }
    // ---- push overlapping contacts apart. Velocity alone leaves a heavy prop sitting a few millimetres
    // into the table, because the impulse only has to stop it, not lift it back out.
    W.contacts.forEach(function (c) {
      if (c.lam <= 0) return;
      var A = c.A, B = c.B;
      var pen = Math.min(c.pen - SLOP, 0.0008);            // at most 0.8 mm a step, or it bounces out of contact
      if (pen <= 0) return;
      var wsum = A.invM + (B ? B.invM : 0); if (wsum < 1e-12) return;
      var push = 0.25 * pen / wsum;
      if (!A.fixed) A.x = V.add(A.x, V.mul(c.n, push * A.invM));
      if (B && !B.fixed) B.x = V.sub(B.x, V.mul(c.n, push * B.invM));
    });
    // ---- integrate positions
    bodies.forEach(function (b) {
      if (b.fixed) return;
      b.x = V.add(b.x, V.mul(b.v, dt));
      var w = b.w, dq = P.qmul([w[0]*dt/2, w[1]*dt/2, w[2]*dt/2, 0], b.q);
      b.q = P.qnorm([b.q[0]+dq[0], b.q[1]+dq[1], b.q[2]+dq[2], b.q[3]+dq[3]]);
    });
    W.joints.forEach(function (j) { j.load = Math.hypot(j.acc[0], j.acc[1], j.acc[2]) / dt; j.spinTorque = j.accSpin / dt; });
    // ---- what fails: a socket lets go when the load past it is more than the plastic holds
    W.beams.forEach(function (bm) {
      if (!bm.flexi) bm.F = bm.sAx.lam / dt;
      bm.Flat = Math.hypot(bm.sLat[0].lam, bm.sLat[1].lam) / dt;
      bm.Mbend = Math.hypot(bm.sAng[0].lam, bm.sAng[1].lam) / dt;
      bm.deflect = V.norm(V.sub(bm.err, V.mul(bm.u, bm.par)));
      bm.util = Math.max(bm.F > 0 ? bm.F / D.socketPull : -bm.F / D.socketPush, bm.Flat / D.socketPry, bm.Mbend * 1000 / D.socketMoment);
      if (W.breakage && !bm.broken && bm.util > 1) {
        bm.over = (bm.over || 0) + dt;
        if (bm.over > 0.02) { bm.broken = true; W.events.push({ t: W.t, what: "rod " + bm.name, why: "popped out: " + (bm.util).toFixed(1) + "x the socket's hold" }); }
      } else if (bm.util < 0.9) bm.over = 0;
    });
    W.joints.forEach(function (j) {
      if (!W.breakage || j.broken) return;
      if (j.load > D.socketPull * 2.5) {
        j.over = (j.over || 0) + dt;
        if (j.over > 0.02) { j.broken = true; W.events.push({ t: W.t, what: "bearing " + j.name, why: "the rod tore out of the hub at " + j.load.toFixed(0) + " N" }); }
      } else j.over = 0;
    });
    if (W.events.length > 60) W.events.splice(0, W.events.length - 60);
    W.t += dt;
    return W;
  };
  KNEX.phys.run = function (W, seconds, dt, input, onSample, samples) {
    var n = Math.round(seconds / dt), every = Math.max(1, Math.round(n / (samples || 120)));
    for (var i = 0; i < n; i++) {
      KNEX.phys.step(W, dt, typeof input === "function" ? input(W.t) : input);
      if (onSample && i % every === 0) onSample(W);
    }
    return W;
  };
  /* Joint and contact loads in newtons, for reporting. */
  KNEX.phys.report = function (W, dt) {
    return {
      t: W.t,
      joints: W.joints.map(function (j) { return { name: j.name, kind: j.kind, load: j.load, broken: !!j.broken, friction: Math.abs(j.spinTorque) }; }),
      events: W.events.slice(),
      beams: W.beams.map(function (b) { return { name: b.name, color: b.color, broken: !!b.broken, util: b.util || 0, axial: b.F, lateral: b.Flat, bend: (b.Mbend || 0) * 1000, deflect: (b.deflect || 0) * 1000, len: b.len * 1000 }; }),
      tendons: (W.tendons || []).map(function (t) { return { name: t.name, kind: t.kind, F: t.kind === "band" ? t.F : -t.lam / dt, len: t.len * 1000, rest: t.rest * 1000 }; }),
      motors: (W.motors || []).map(function (m) { return { name: m.name, torque: m.lam / dt * 1000, rpm: V.dot(m.joint.ax, V.sub(m.joint.B.w, m.joint.A.w)) * 60 / (2 * Math.PI) }; }),
      gears: (W.gearPairs || []).map(function (g) { return { a: g.a.name, b: g.b.name, ratio: (g.b.teeth / g.a.teeth).toFixed(2) }; }),
      contacts: W.contacts.filter(function (c) { return c.lam > 1e-9; }).map(function (c) { return { on: c.B ? (c.B.prop ? c.B.prop.label : c.B.ball ? c.B.ball.label : "part") : "desk", body: c.A.id, N: c.lam / dt, at: V.mul(c.p, 1000) }; }),
      bodies: W.bodies.map(function (b) { return { id: b.id, prop: b.prop ? b.prop.label : b.ball ? b.ball.label : null, x: V.mul(b.x, 1000), q: b.q, v: V.norm(b.v), w: V.norm(b.w) }; })
    };
  };
})();
/* Contacts, regenerated each step: every feature point against the desk, and against every prop box. */
KNEX.phys.collide = function (W) {
  var V = KNEX.V, P = KNEX.phys, C = [];
  var props = W.bodies.filter(function (b) { return b.prop || b.ball; });   // anything a part can hit
  props.forEach(function (Q) { Q.rBound = Q.box ? V.norm(Q.box) : Q.cyl ? Math.hypot(Q.cyl.r, Q.cyl.h) : Q.radius; });
  W.bodies.forEach(function (B) {
    var moving = !B.fixed;
    var nearDesk = moving && B.x[2] - B.rBound <= W.ground + 0.001;
    var nearProps = props.filter(function (Q) { return Q !== B && (moving || !Q.fixed) && V.dist(B.x, Q.x) < B.rBound + Q.rBound; });
    if (!nearDesk && !nearProps.length) return;
    if (B.fixed && !B._fw) B._fw = B.feat.map(function (f) { return B.toWorld(f.p); });   // a fixed body never moves
    B.feat.forEach(function (f, fi) {
      var p = B.fixed ? B._fw[fi] : B.toWorld(f.p);
      if (nearDesk) {
        var pen = W.ground + f.r - p[2];                         // desk
        if (pen > -0.003) C.push({ A: B, B: null, p: p, r: V.sub(p, B.x), n: [0, 0, 1], pen: pen, mu: B.mu, lam: 0, lt: [0, 0] });
      }
      nearProps.forEach(function (Q) {                           // prop boxes
        if (V.dist(p, Q.x) > Q.rBound + f.r) return;
        if (Q.cyl) {                                             // cylinder: the side, or a flat end
          var dc = V.sub(p, Q.x), qc = Q.q, lc = P.qrot([-qc[0], -qc[1], -qc[2], qc[3]], dc);
          var radial = Math.hypot(lc[0], lc[1]), axial = Math.abs(lc[2]);
          var overR = Q.cyl.r + f.r - radial, overA = Q.cyl.h + f.r - axial;
          if (overR <= 0 || overA <= 0) return;
          var nl, pen3;
          if (overR < overA && radial > 1e-9) { nl = [lc[0] / radial, lc[1] / radial, 0]; pen3 = overR; }
          else { nl = [0, 0, lc[2] < 0 ? -1 : 1]; pen3 = overA; }
          var n3 = P.qrot(qc, nl);
          C.push({ A: B, B: Q, p: p, r: V.sub(p, B.x), rB: V.sub(p, Q.x), n: n3, pen: pen3, mu: Math.min(B.mu, Q.mu), lam: 0, lt: [0, 0] });
          return;
        }
        if (Q.radius) {                                          // sphere prop: simple point-vs-sphere
          var dd = V.sub(p, Q.x), dist = V.norm(dd), pen2 = Q.radius + f.r - dist;
          if (pen2 > -0.003 && dist > 1e-9) {
            var n2 = V.mul(dd, 1 / dist);
            C.push({ A: B, B: Q, p: p, r: V.sub(p, B.x), rB: V.sub(p, Q.x), n: n2, pen: pen2, mu: Math.min(B.mu, Q.mu), lam: 0, lt: [0, 0] });
          }
          return;
        }
        var d = V.sub(p, Q.x), q = Q.q, l = P.qrot([-q[0], -q[1], -q[2], q[3]], d);   // into the box frame
        var h = Q.box, ax = -1, best = 1e9, sgn = 1;
        var inBand = Math.abs(l[2]) < h[2];                      // a part beside the box cannot get under it
        for (var i = 0; i < 3; i++) {
          var over = h[i] + f.r - Math.abs(l[i]);
          if (over <= 0) { ax = -1; break; }
          if (i === 2 && inBand) continue;                       // so push sideways, never up
          if (over < best) { best = over; ax = i; sgn = l[i] < 0 ? -1 : 1; }
        }
        if (ax < 0) return;
        var nl = [0, 0, 0]; nl[ax] = sgn;
        var n = P.qrot(q, nl);                                   // world normal, out of the box toward the feature
        C.push({ A: B, B: Q, p: p, r: V.sub(p, B.x), rB: V.sub(p, Q.x), n: n, pen: best, mu: Math.min(B.mu, Q.mu), lam: 0, lt: [0, 0] });
      });
    });
  });
  W.contacts = C;
  return C;
};
/* Mechanism elements: rubber bands, strings over pulleys, motors, tan-clip locks, gears, balls.
   Built into the physics world alongside bodies, joints and beams. */
KNEX.phys.mech = function (W, s) {
  var V = KNEX.V, D = KNEX.DIMS, MM = 0.001;
  function bodyAt(connName) {
    var K = s.byName[connName]; if (!K) return null;
    var p = s.parts.filter(function (q) { return q.ref === K; })[0];
    return p ? W.bodies[p.body] : null;
  }
  function anchorOf(a) {                                  // {body, local point} for a tendon anchor
    if (a.conn) { var b = bodyAt(a.conn); if (b) return { body: b, p: V.mul(a.pos, MM) }; }
    if (a.ball) { var bb = W.bodies.filter(function (x) { return x.ball && x.ball.label === a.ball; })[0]; if (bb) return { body: bb, p: V.mul(a.pos, MM) }; }
    return { body: W.bodies[W.base], p: V.mul(a.pos, MM) };
  }
  (s.balls || []).forEach(function (O) {                   // balls first, so tendons can hang off them
    var m = O.mass / 1000, r = O.d / 2 * MM, I = 0.4 * m * r * r;
    var B = new KNEX.phys.Body(W.bodies.length, m, V.mul(O.pos, MM), [[I,0,0],[0,I,0],[0,0,I]], false);
    B.ball = O; B.mu = O.mu != null ? O.mu : (KNEX.SURFACES[W.surface] ? KNEX.SURFACES[W.surface].mu : D.muDesk);
    B.feat = [{ p: B.x.slice(), r: r }]; B.rBound = r; B.radius = r;
    W.bodies.push(B);
  });
  W.tendons = (s.tendons || []).map(function (T) {
    return { name: T.name, kind: T.kind, nodes: T.pts.map(anchorOf), rest: T.rest * MM, L0: T.L0 * MM,
             k: (T.k != null ? T.k : D.bandK) * 1000, EA: D.stringEA, F: 0, len: 0, lam: 0, line: T.line };
  });
  W.motors = (s.motors || []).map(function (M) {
    var j = W.joints.filter(function (x) { return x.name.split("+").indexOf(M.conn) >= 0; })[0];
    return j ? { name: M.name, joint: j, w: M.rpm * 2 * Math.PI / 60, tau: M.torque / 1000, lam: 0, on: 1 } : null;
  }).filter(Boolean);
  (s.locks || []).forEach(function (L) {                  // a tan clip turns the bearing into a rigid coupling
    W.joints.forEach(function (j) { if (j.name.split("+").indexOf(L.conn) >= 0) { j.lockedSpin = true; j.mu = D.muLock; } });
  });
  W.gears = (s.gears || []).map(function (G) {
    var j = W.joints.filter(function (x) { return x.name.split("+").indexOf(G.conn) >= 0; })[0];
    return j ? { name: G.name, joint: j, r: G.r * MM, teeth: G.teeth, mesh: G.mesh || [], lam: 0 } : null;
  }).filter(Boolean);
  W.gearPairs = [];
  W.gears.forEach(function (g) {
    (g.mesh || []).forEach(function (other) {
      var o = W.gears.filter(function (x) { return x.name === other; })[0];
      if (!o || W.gearPairs.some(function (p) { return p.b === g; })) return;
      var carrier = g.joint.A === o.joint.A || g.joint.A === o.joint.B ? g.joint.A : g.joint.B;
      W.gearPairs.push({ a: g, b: o, carrier: carrier, lam: 0 });
    });
  });
  return W;
};
/* Kinematics. The physics already knows the joint tree — every hub and side-on clip is a real degree of
   freedom between two bodies — so the same model answers the questions you want before you build:
     what can this reach?      KNEX.kin.workspace
     how far must each joint turn to get there, and how much actuator travel is that?   KNEX.kin.solve
   Inverse kinematics by cyclic coordinate descent: robust, no matrix inversion, and it degrades honestly
   by reporting how close it got instead of pretending. */
KNEX.kin = (function () {
  var V = KNEX.V;

  /* Chain from the fixed base out to `tipName`, as a list of revolute joints. */
  function chain(W, tipName) {
    var s = W.solved, byBody = {};
    s.parts.forEach(function (p) { if (p.kind === "conn") (byBody[p.body] = byBody[p.body] || []).push(p.ref.name); });
    var tipBody = null;
    if (tipName) s.parts.forEach(function (p) { if (p.kind === "conn" && p.ref.name === tipName) tipBody = p.body; });
    var depth = {}, parent = {}, via = {};
    W.bodies.forEach(function (b) { if (b.fixed) depth[b.id] = 0; });
    if (!Object.keys(depth).length) depth[W.base] = 0;
    var q = Object.keys(depth).map(Number), guard = 0;
    while (q.length && guard++ < 500) {
      var cur = q.shift();
      W.joints.forEach(function (j) {
        [[j.A, j.B], [j.B, j.A]].forEach(function (pr) {
          if (pr[0].id !== cur || depth[pr[1].id] !== undefined) return;
          depth[pr[1].id] = depth[cur] + 1; parent[pr[1].id] = cur; via[pr[1].id] = j; q.push(pr[1].id);
        });
      });
    }
    if (tipBody == null) {                                  // no tip named: take the deepest body
      var best = -1; Object.keys(depth).forEach(function (k) { if (depth[k] > best) { best = depth[k]; tipBody = Number(k); } });
    }
    var links = [], b = tipBody;
    while (b != null && parent[b] != null) { links.unshift({ joint: via[b], body: b }); b = parent[b]; }
    return { links: links, tipBody: tipBody, tipName: tipName || (byBody[tipBody] || [])[0] || ("body " + tipBody) };
  }

  /* Where the tip sits for a given set of joint angles, in mm. */
  function fk(ch, angles, tipLocal) {
    var pos = tipLocal.slice(), acc = [];
    for (var i = ch.links.length - 1; i >= 0; i--) {
      var j = ch.links[i].joint, a = angles[i] || 0;
      var axis = j.axis, at = V.mul(j.anchor, 1000);
      pos = V.add(at, V.rot(V.sub(pos, at), axis, a * 180 / Math.PI));
    }
    return pos;
  }

  /* Cyclic coordinate descent: turn each joint in turn to bring the tip nearer the target. */
  function solve(W, opts) {
    opts = opts || {};
    var ch = chain(W, opts.tip);
    if (!ch.links.length) return { ok: false, why: "nothing in this build moves relative to the frame" };
    var tipBody = W.bodies[ch.tipBody];
    var tipLocal = opts.tipAt ? opts.tipAt.slice() : V.mul(tipBody.x, 1000);
    var target = opts.target;
    var angles = ch.links.map(function () { return 0; });
    var iters = opts.iters || 400, tol = opts.tol || 1.0, best = 1e9, bestA = angles.slice();
    for (var it = 0; it < iters; it++) {
      for (var i = ch.links.length - 1; i >= 0; i--) {
        var cur = fk(ch, angles, tipLocal);
        var j = ch.links[i].joint, at = V.mul(j.anchor, 1000), ax = V.unit(j.axis);
        var a = V.sub(cur, at), b = V.sub(target, at);
        a = V.sub(a, V.mul(ax, V.dot(a, ax)));              // project into the joint's plane of rotation
        b = V.sub(b, V.mul(ax, V.dot(b, ax)));
        if (V.norm(a) < 1e-6 || V.norm(b) < 1e-6) continue;
        var d = Math.atan2(V.dot(ax, V.cross(a, b)), V.dot(a, b));
        angles[i] += d;
        if (opts.limit) angles[i] = Math.max(-opts.limit, Math.min(opts.limit, angles[i]));
      }
      var err = V.dist(fk(ch, angles, tipLocal), target);
      if (err < best) { best = err; bestA = angles.slice(); }
      if (err < tol) break;
    }
    return { ok: best <= (opts.tol || 1.0), err: best, angles: bestA, chain: ch,
             tip: fk(ch, bestA, tipLocal), rest: tipLocal,
             joints: ch.links.map(function (l, i) { return { name: l.joint.name, axis: l.joint.axis, deg: bestA[i] * 180 / Math.PI }; }) };
  }

  /* What the tip can reach, by sampling the joint space. Returns the envelope and a reach radius. */
  function workspace(W, opts) {
    opts = opts || {};
    var ch = chain(W, opts.tip);
    if (!ch.links.length) return { ok: false, why: "nothing in this build moves relative to the frame" };
    var tipLocal = V.mul(W.bodies[ch.tipBody].x, 1000);
    var n = ch.links.length, samples = opts.samples || 4000, lim = opts.limit || Math.PI;
    var min = [1e9, 1e9, 1e9], max = [-1e9, -1e9, -1e9], pts = [], centre = V.mul(ch.links[0].joint.anchor, 1000);
    var far = 0;
    for (var s = 0; s < samples; s++) {
      var a = [];
      for (var i = 0; i < n; i++) a.push((Math.random() * 2 - 1) * lim);
      var p = fk(ch, a, tipLocal);
      for (var k = 0; k < 3; k++) { if (p[k] < min[k]) min[k] = p[k]; if (p[k] > max[k]) max[k] = p[k]; }
      far = Math.max(far, V.dist(p, centre));
      if (pts.length < 600) pts.push(p);
    }
    return { ok: true, chain: ch, dof: n, min: min, max: max, reach: far, origin: centre, points: pts,
             size: [max[0] - min[0], max[1] - min[1], max[2] - min[2]] };
  }
  return { chain: chain, fk: fk, solve: solve, workspace: workspace };
})();
/* Procedural generation on the lattice.
   The only legal single-rod moves from a lattice point are: one, two or four units along an axis, and the
   face diagonals of those (the sqrt(2) rungs). A body diagonal is not a rod length, which is why the
   search below never proposes one. A* over those moves answers "how do I get from here to there", and
   the truss styles thicken the answer into something that will actually hold. */
KNEX.gen = (function () {
  var V = KNEX.V;
  var MOVES = (function () {
    var out = [], axial = [1, 2, 4];
    axial.forEach(function (n) {
      [0, 1, 2].forEach(function (ax) {
        [-1, 1].forEach(function (sg) { var v = [0, 0, 0]; v[ax] = sg * n; out.push({ v: v, colour: n === 1 ? "green" : n === 2 ? "blue" : "red", len: n }); });
      });
      [[0, 1], [0, 2], [1, 2]].forEach(function (pl) {      // face diagonals: the sqrt(2) rungs
        [-1, 1].forEach(function (s1) { [-1, 1].forEach(function (s2) {
          var v = [0, 0, 0]; v[pl[0]] = s1 * n; v[pl[1]] = s2 * n;
          out.push({ v: v, colour: n === 1 ? "white" : n === 2 ? "yellow" : "grey", len: n * Math.SQRT2 });
        }); });
      });
    });
    return out;
  })();
  function key(p) { return p[0] + "," + p[1] + "," + p[2]; }
  function near(p) { return p.map(function (v) { return Math.round(v); }); }

  /* Fewest rods from a to b, both in lattice units. Returns the steps, each with its colour. */
  /* A truss only works if its steps are uniform and axis-aligned: the chord is n, the offset is n, and
     the lacing diagonal is n*sqrt(2), which is a real rod. Mix in a face diagonal and the lacing becomes
     n*sqrt(3), which is not. So the truss search is restricted to one size, along the axes. */
  function movesFor(opts) {
    if (!opts.uniform) return MOVES;
    var n = opts.uniform;
    return MOVES.filter(function (m) {
      var nz = m.v.filter(function (x) { return x !== 0; });
      return nz.length === 1 && Math.abs(nz[0]) === n;
    });
  }
  function path(a, b, opts) {
    opts = opts || {};
    a = near(a); b = near(b);
    var moves = movesFor(opts);
    if (key(a) === key(b)) return { ok: true, steps: [] };
    var open = [{ p: a, g: 0, f: 0, from: null, move: null }], seen = {}, cap = opts.cap || 60000, n = 0;
    seen[key(a)] = 0;
    var box = opts.box || 14;                               // stay within this many units of the straight line
    while (open.length && n++ < cap) {
      open.sort(function (x, y) { return x.f - y.f; });
      var cur = open.shift();
      if (key(cur.p) === key(b)) {
        var steps = [], node = cur;
        while (node.from) { steps.unshift({ from: node.from.p, to: node.p, colour: node.move.colour }); node = node.from; }
        return { ok: true, steps: steps, rods: steps.length, expanded: n };
      }
      moves.forEach(function (m) {
        var np = [cur.p[0] + m.v[0], cur.p[1] + m.v[1], cur.p[2] + m.v[2]];
        if (V.dist(np, b) > V.dist(a, b) + box) return;      // do not wander
        var g = cur.g + 1, k = key(np);
        if (seen[k] !== undefined && seen[k] <= g) return;
        seen[k] = g;
        open.push({ p: np, g: g, f: g + V.dist(np, b) / 5.657, from: cur, move: m });
      });
    }
    return { ok: false, why: opts.uniform
      ? "no route using only " + opts.uniform + "-unit steps along the axes. The two ends are not a whole number of those apart: try --step 1, or --style line."
      : "no route on the lattice within " + cap + " tries. Move one end onto a whole number of units, or widen --box." };
  }

  /* A path is a line of rods and will fold. Thicken it into a braced beam by running a second chord one
     unit to the side and lacing the two together, which is the K'NEX User Group's own long-span recipe. */
  function truss(steps, opts) {
    opts = opts || {};
    var lines = [], prefix = opts.prefix || "BR", off = null;
    if (!steps.length) return lines;
    var n = opts.uniform || 1;
    var used = {};                                          // the offset must avoid every axis the path uses
    steps.forEach(function (s) { V.sub(s.to, s.from).forEach(function (v, i) { if (v !== 0) used[i] = 1; }); });
    var axis = [0, 1, 2].filter(function (i) { return !used[i]; })[0];
    if (axis === undefined) axis = 2;                       // the path turns in all three: offset up anyway
    off = [0, 0, 0]; off[axis] = n;
    var pts = [steps[0].from].concat(steps.map(function (s) { return s.to; }));
    pts.forEach(function (p, i) {
      lines.push("C " + prefix + "a" + i + " W8 " + p.join(","));
      if (opts.style === "truss") lines.push("C " + prefix + "b" + i + " W8 " + V.add(p, off).join(","));
    });
    steps.forEach(function (s, i) {
      lines.push("R " + prefix + "a" + i + " " + prefix + "a" + (i + 1));
      if (opts.style === "truss") {
        lines.push("R " + prefix + "b" + i + " " + prefix + "b" + (i + 1));
        lines.push("R " + prefix + "a" + i + " " + prefix + "b" + i);
        lines.push("R " + prefix + "a" + i + " " + prefix + "b" + (i + 1));   // the lacing that stops it folding
      }
    });
    if (opts.style === "truss") lines.push("R " + prefix + "a" + steps.length + " " + prefix + "b" + steps.length);
    return lines;
  }
  /* An arch. Every rod is the same real length, so you cannot sample a curve and hope: you solve for the
     circle whose n equal chords of length L span the gap. n must be more than span/L, and the rise that
     comes out is whatever that circle gives you, not a number you get to pick. */
  function arch(a, b, opts) {
    opts = opts || {};
    var colour = opts.rod || "blue", rod = KNEX.ladder(colour);
    if (!rod) return { ok: false, why: "unknown rod colour '" + colour + "'" };
    var L = rod.c2c / KNEX.U, S = V.dist(a, b);
    // How many segments can span this as a minor arc? More rod than the straight line, but not so much
    // that the circle passes a half turn, or the arch springs backwards over its own piers.
    var lo_n = Math.floor(S / L) + 1, hi_n = Math.floor(Math.PI / (2 * Math.asin(Math.min(0.999, L / S))));
    if (hi_n < lo_n) return { ok: false, why: "no " + colour + " arch spans " + S.toFixed(2) +
      " U: the rod is " + L + " U, and nothing between a straight line and a half turn fits. Try a shorter rod." };
    var n = opts.segments || Math.min(hi_n, lo_n + 1);
    if (n < lo_n || n > hi_n) return { ok: false, why: "a " + colour + " arch over " + S.toFixed(2) + " U works with " +
      (lo_n === hi_n ? lo_n + " segments" : lo_n + " to " + hi_n + " segments") + ", not " + n +
      ". Fewer than " + lo_n + " is shorter than the gap; more than " + hi_n + " turns past a half circle and springs backwards." };
    // solve sin(n t / 2) / sin(t / 2) = S / L for the half-angle t of one chord
    var want = S / L, lo = 1e-6, hi = Math.PI / n * 0.999, t = 0;
    for (var i = 0; i < 80; i++) {
      t = (lo + hi) / 2;
      var f = Math.sin(n * t / 2) / Math.sin(t / 2);
      if (f > want) lo = t; else hi = t;
    }
    if (Math.abs(Math.sin(n * t / 2) / Math.sin(t / 2) - want) > 1e-3)
      return { ok: false, why: "no circle with " + n + " chords of " + L + " U spans " + S.toFixed(2) + " U" };
    var R = L / (2 * Math.sin(t / 2));                       // radius, in units
    var rise = R * (1 - Math.cos(n * t / 2));
    var dir = V.unit(V.sub(b, a));
    var up = Math.abs(dir[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1];
    up = V.unit(V.sub(up, V.mul(dir, V.dot(up, dir))));
    if (opts.down) up = V.mul(up, -1);
    var mid = V.mul(V.add(a, b), 0.5);
    var centre = V.add(mid, V.mul(up, -(R * Math.cos(n * t / 2))));
    var pts = [], prefix = opts.prefix || "AR";
    for (var k = 0; k <= n; k++) {
      var ang = -n * t / 2 + k * t;
      pts.push(V.add(centre, V.add(V.mul(dir, R * Math.sin(ang)), V.mul(up, R * Math.cos(ang)))));
    }
    var lines = [], chords = [];
    pts.forEach(function (p, k) { lines.push("C " + prefix + k + " W8 " + p.map(function (v) { return Number(v.toFixed(4)); }).join(",")); });
    for (var m = 0; m < n; m++) { chords.push(V.dist(pts[m], pts[m + 1])); lines.push("R " + prefix + m + " " + prefix + (m + 1) + " " + colour + " beam"); }
    return { ok: true, lines: lines, chords: chords, pts: pts, colour: colour, nominal: L,
             segments: n, radius: R, rise: rise, turn: t * 180 / Math.PI,
             moment: KNEX.DIMS.E * KNEX.DIMS.I / (R * KNEX.U) };
  }

  /* Legs down to the table at every other node: the triangle-supported span. */
  function legs(pts, opts) {
    opts = opts || {};
    var lines = [], prefix = opts.prefix || "LG", every = opts.every || 2, ground = opts.ground || 0.5;
    pts.forEach(function (p, i) {
      if (i % every || p[2] - ground < 0.9) return;
      var foot = [p[0], p[1], ground];
      var d = p[2] - ground, fit = KNEX.LADDER.filter(function (l) { return Math.abs(l.c2c / KNEX.U - d) < 0.02; })[0];
      if (!fit) return;                                     // no rod that length: skip this leg rather than lie
      lines.push("C " + prefix + i + " W8 " + foot.join(",") + " x y");
      lines.push("R " + prefix + i + " " + opts.nodePrefix + i);
    });
    return lines;
  }
  return { path: path, truss: truss, arch: arch, legs: legs, MOVES: MOVES };
})();
