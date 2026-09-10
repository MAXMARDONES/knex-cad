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
