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
