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
  s.rods.forEach(function (R) {
    var ends = R.joints.filter(function (j) { return j.type === "end"; }).length, mid = R.joints.length - ends;
    if (!R.joints.length) issue("warn", R.line, "rod " + R.color + " line " + R.line + " is loose");
    else if (ends === 0 && mid === 1) issue("warn", R.line, "rod " + R.color + " line " + R.line + " hangs from one hub only (needs a cap or a second connector)");
  });
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
