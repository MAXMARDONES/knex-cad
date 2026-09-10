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
