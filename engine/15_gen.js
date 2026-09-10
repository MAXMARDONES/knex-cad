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
