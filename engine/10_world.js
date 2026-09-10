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
    var dirA = ja && ja.slot != null ? A.slotDir(ja.slot) : V.unit(V.sub(B.pos, A.pos));
    var dirB = jb && jb.slot != null ? B.slotDir(jb.slot) : V.unit(V.sub(A.pos, B.pos));
    return { A: bodies[pa.body], B: bodies[pb.body], pa: V.mul(A.pos, MM), pb: V.mul(B.pos, MM), dirA: dirA, dirB: dirB,
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
      var pd = B.prop.pad || [0, 0];
      var h = V.mul(V.add(B.prop.size, [2 * pd[0], 2 * pd[1], 0]), 0.5 * MM);
      for (var sx = -1; sx <= 1; sx += 2) for (var sy = -1; sy <= 1; sy += 2) for (var sz = -1; sz <= 1; sz += 2)
        B.feat.push({ p: V.add(B.x, [sx * h[0], sy * h[1], sz * h[2]]), r: 0 });
      B.box = h;
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
          [13, 18].forEach(function (r) { B.feat.push({ p: V.add(V.mul(p.c, MM), V.mul(d, r * MM)), r: 4 * MM, part: p }); });
        });
      }
    });
  });
  bodies.forEach(function (B) { B.rBound = B.feat.reduce(function (u, f) { return Math.max(u, V.dist(f.p, B.x) + f.r); }, 0); });
  var W0 = { bodies: bodies, joints: joints, beams: beams, loads: loads, contacts: [], ground: ground, surface: opts.surface || null,
           base: baseBody.id, solved: s, t: 0, iters: opts.iters || 14, pinBase: pinBase,
           gravity: opts.gravity != null ? opts.gravity : P.G,
           breakage: opts.breakage !== false, events: [] };
  return KNEX.phys.mech(W0, s);
};
