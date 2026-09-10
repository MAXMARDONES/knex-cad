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
