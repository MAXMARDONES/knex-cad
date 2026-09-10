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
          if (bestK < 0) issue("error", K, K.name + ": no free socket within " + lim + " deg for the bending rod (line " + rod.line + ")");
          else { j = { type: "end", slot: bestK, tangent: K.slotDir(bestK) }; K.used["s" + bestK] = rod.line; rod["tan" + atEnd] = j.tangent; }
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
  m.extras.forEach(function (x) { var p = point(x.at); if (p) out.extras.push({ label: x.label, pos: p, size: x.size, color: x.color, mass: x.mass, mu: x.mu, pad: x.pad || [0, 0], fixed: x.fixed, line: x.line, step: x.step }); });
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
