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
