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
  /* A tan clip on a gear's own connector. `L` welds that hub, and a gear's rotation IS the rotation of
     that hub, so the pair cannot turn at all: the train stalls and nothing else complains. The
     engineering notes told people to do exactly this for years. */
  (s.gears || []).forEach(function (G) {
    if ((s.locks || []).some(function (L) { return L.conn === G.conn; }))
      issue("error", G.line, "gear " + G.name + " and a tan clip are both on " + G.conn +
        ": the clip welds that hub and the gear turns about it, so the train is locked solid. Clip the other member.");
  });
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
