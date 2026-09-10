/* node cli.js render build.knx out.svg [--view iso] [--step N] [--hide props,joints] [--labels] [--stress]
   A painter's-algorithm CAD drawing: no browser, no WebGL, deterministic output you can put in a document. */
module.exports = function render(KNEX, fs, file, out, args) {
  var V = KNEX.V, D = KNEX.DIMS;
  function opt(f, d) { var i = args.indexOf(f); return i >= 0 ? args[i + 1] : d; }
  function flag(f) { return args.indexOf(f) >= 0; }
  var s = KNEX.build(fs.readFileSync(file, "utf8"));
  var W = Number(opt("--width", 1400)), H = Number(opt("--height", 900));
  var step = opt("--step") != null ? Number(opt("--step")) : null;
  var hide = (opt("--hide", "") || "").split(",").filter(Boolean);
  var VIEWS = { iso: [0.62, -0.62, 0.48], iso2: [-0.62, -0.62, 0.48], front: [0, -1, 0.001], back: [0, 1, 0.001],
                left: [-1, 0, 0.001], right: [1, 0, 0.001], top: [0.001, 0.001, 1], low: [0.5, -0.8, 0.12] };
  var eye = V.unit(VIEWS[opt("--view", "iso")] || VIEWS.iso);
  var up0 = Math.abs(eye[2]) > 0.95 ? [0, 1, 0] : [0, 0, 1];
  var rt = V.unit(V.cross(up0, eye)), up = V.cross(eye, rt);
  function proj(p) { return { x: V.dot(p, rt), y: -V.dot(p, up), z: V.dot(p, eye) }; }
  // ---- gather drawables
  var items = [];
  function inStep(o) { return step == null || o.step == null || o.step <= step - 1; }
  function isNew(o) { return step != null && o.step === step - 1; }
  s.rods.forEach(function (R) {
    if (!inStep(R) || hide.indexOf("rods") >= 0) return;
    var a = proj(R.t0), b = proj(R.t1);
    items.push({ z: (a.z + b.z) / 2, kind: "rod", a: a, b: b, w: D.rodD,
                 col: KNEX.RGB[R.flexi ? "flexi" : R.color], hot: isNew(R), ref: R });
  });
  s.conns.forEach(function (K) {
    if (!inStep(K) || hide.indexOf("conns") >= 0) return;
    var c = proj(K.pos), arms = [];
    KNEX.KINDS[K.kind].slots.forEach(function (k) {
      var d = V.rot(K.e1, K.n, k * 45);
      arms.push({ tip: proj(V.add(K.pos, V.mul(d, D.connR - 1))), root: proj(V.add(K.pos, V.mul(d, 5))) });
    });
    var nz = Math.abs(V.dot(K.n, eye));
    items.push({ z: c.z, kind: "conn", c: c, arms: arms, r: 7 * Math.max(0.25, nz), t: D.connT,
                 col: KNEX.RGB[KNEX.KINDS[K.kind].color], hot: isNew(K), name: K.name, ref: K });
  });
  s.spacers.forEach(function (P) {
    if (!inStep(P) || hide.indexOf("spacers") >= 0) return;
    var c = proj(P.pos); items.push({ z: c.z, kind: "spacer", c: c, r: 6, col: KNEX.RGB[P.size === "silver" ? "silver" : "spacer"], hot: isNew(P) });
  });
  (s.extras || []).forEach(function (X) {
    if (!inStep(X) || hide.indexOf("props") >= 0) return;
    var h = V.mul(X.size, 0.5), corners = [];
    for (var sx = -1; sx <= 1; sx += 2) for (var sy = -1; sy <= 1; sy += 2) for (var sz = -1; sz <= 1; sz += 2)
      corners.push(proj(V.add(X.pos, [sx * h[0], sy * h[1], sz * h[2]])));
    items.push({ z: Math.min.apply(null, corners.map(function (p) { return p.z; })) - 1e3, kind: "box", pts: corners, col: X.color, label: X.label });
  });
  (s.balls || []).forEach(function (O) {
    if (!inStep(O)) return;
    var c = proj(O.pos); items.push({ z: c.z, kind: "ball", c: c, r: O.d / 2, col: O.color });
  });
  (s.loads || []).forEach(function (L) {
    if (hide.indexOf("loads") >= 0) return;
    var K = s.byName[L.at]; if (!K || !inStep(K)) return;
    var tip = proj(K.pos), tail = proj(V.sub(K.pos, V.mul(V.unit(L.F), 28)));
    items.push({ z: tip.z + 1e3, kind: "arrow", a: tail, b: tip, col: "#E8531A", label: L.name });
  });
  // ---- fit
  var xs = [], ys = [];
  items.forEach(function (o) {
    var ps = o.kind === "rod" || o.kind === "arrow" ? [o.a, o.b] : o.kind === "conn" ? [o.c].concat(o.arms.map(function (a) { return a.tip; })) : o.pts ? o.pts : [o.c];
    ps.forEach(function (p) { xs.push(p.x); ys.push(p.y); });
  });
  if (!xs.length) return "empty build";
  var pad = 60, minx = Math.min.apply(null, xs), maxx = Math.max.apply(null, xs), miny = Math.min.apply(null, ys), maxy = Math.max.apply(null, ys);
  var sc = Math.min((W - 2 * pad) / Math.max(1, maxx - minx), (H - 2 * pad) / Math.max(1, maxy - miny));
  sc *= Number(opt("--zoom", 1));
  function X(p) { return (p.x - (minx + maxx) / 2) * sc + W / 2; }
  function Y(p) { return (p.y - (miny + maxy) / 2) * sc + H / 2; }
  items.sort(function (a, b) { return b.z - a.z; });
  // ---- draw
  var dark = flag("--light") ? false : true;
  var bg = dark ? "#12160F" : "#FFFFFF", ink = dark ? "#E9ECE6" : "#151915", line = dark ? "#000000" : "#333333";
  var o = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '">',
           '<rect width="' + W + '" height="' + H + '" fill="' + bg + '"/>'];
  function shade(col, hot) { return hot ? "#E8531A" : col; }
  items.forEach(function (it) {
    if (it.kind === "rod") {
      o.push('<line x1="' + X(it.a).toFixed(1) + '" y1="' + Y(it.a).toFixed(1) + '" x2="' + X(it.b).toFixed(1) + '" y2="' + Y(it.b).toFixed(1) +
             '" stroke="' + line + '" stroke-width="' + (it.w * sc + 2.2).toFixed(1) + '" stroke-linecap="round"/>');
      o.push('<line x1="' + X(it.a).toFixed(1) + '" y1="' + Y(it.a).toFixed(1) + '" x2="' + X(it.b).toFixed(1) + '" y2="' + Y(it.b).toFixed(1) +
             '" stroke="' + shade(it.col, it.hot) + '" stroke-width="' + (it.w * sc).toFixed(1) + '" stroke-linecap="round"/>');
    } else if (it.kind === "conn") {
      var col = shade(it.col, it.hot);
      it.arms.forEach(function (a) {
        o.push('<line x1="' + X(a.root).toFixed(1) + '" y1="' + Y(a.root).toFixed(1) + '" x2="' + X(a.tip).toFixed(1) + '" y2="' + Y(a.tip).toFixed(1) +
               '" stroke="' + line + '" stroke-width="' + (9.9 * sc + 2).toFixed(1) + '" stroke-linecap="round"/>');
      });
      it.arms.forEach(function (a) {
        o.push('<line x1="' + X(a.root).toFixed(1) + '" y1="' + Y(a.root).toFixed(1) + '" x2="' + X(a.tip).toFixed(1) + '" y2="' + Y(a.tip).toFixed(1) +
               '" stroke="' + col + '" stroke-width="' + (9.9 * sc).toFixed(1) + '" stroke-linecap="round"/>');
      });
      o.push('<circle cx="' + X(it.c).toFixed(1) + '" cy="' + Y(it.c).toFixed(1) + '" r="' + (it.r * sc).toFixed(1) + '" fill="' + col + '" stroke="' + line + '" stroke-width="1.4"/>');
      if (flag("--labels")) o.push('<text x="' + X(it.c).toFixed(1) + '" y="' + (Y(it.c) - it.r * sc - 4).toFixed(1) + '" text-anchor="middle" font-family="monospace" font-size="11" fill="' + ink + '">' + it.name + '</text>');
    } else if (it.kind === "spacer") {
      o.push('<circle cx="' + X(it.c).toFixed(1) + '" cy="' + Y(it.c).toFixed(1) + '" r="' + (it.r * sc).toFixed(1) + '" fill="' + shade(it.col, it.hot) + '" stroke="' + line + '"/>');
    } else if (it.kind === "ball") {
      o.push('<circle cx="' + X(it.c).toFixed(1) + '" cy="' + Y(it.c).toFixed(1) + '" r="' + (it.r * sc).toFixed(1) + '" fill="' + it.col + '" stroke="' + line + '"/>');
    } else if (it.kind === "box") {
      var hull = it.pts.map(function (p) { return [X(p), Y(p)]; });
      var cx = hull.reduce(function (u, p) { return u + p[0]; }, 0) / hull.length, cy = hull.reduce(function (u, p) { return u + p[1]; }, 0) / hull.length;
      hull.sort(function (a, b) { return Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx); });
      o.push('<polygon points="' + hull.map(function (p) { return p[0].toFixed(0) + "," + p[1].toFixed(0); }).join(" ") + '" fill="' + it.col + '" opacity="0.5" stroke="' + line + '"/>');
    } else if (it.kind === "arrow") {
      o.push('<line x1="' + X(it.a).toFixed(1) + '" y1="' + Y(it.a).toFixed(1) + '" x2="' + X(it.b).toFixed(1) + '" y2="' + Y(it.b).toFixed(1) + '" stroke="' + it.col + '" stroke-width="4"/>');
      o.push('<circle cx="' + X(it.b).toFixed(1) + '" cy="' + Y(it.b).toFixed(1) + '" r="5" fill="' + it.col + '"/>');
      if (flag("--labels")) o.push('<text x="' + X(it.a).toFixed(1) + '" y="' + (Y(it.a) - 8).toFixed(1) + '" text-anchor="middle" font-family="monospace" font-size="11" fill="' + it.col + '">' + it.label + '</text>');
    }
  });
  var title = s.title + (step != null && s.steps[step - 1] ? "  ·  step " + step + "/" + s.steps.length + ": " + s.steps[step - 1].title : "");
  o.push('<text x="24" y="34" font-family="Archivo, Helvetica, sans-serif" font-weight="700" font-size="20" fill="' + ink + '">' + title.replace(/&/g, "&amp;").replace(/</g, "&lt;") + '</text>');
  if (step != null) {
    var count = {};
    s.conns.forEach(function (K) { if (K.step === step - 1) count[K.kind] = (count[K.kind] || 0) + 1; });
    s.rods.forEach(function (R) { if (R.step === step - 1) { var k = (R.flexi ? "flexi-" : "") + R.color; count[k] = (count[k] || 0) + 1; } });
    s.spacers.forEach(function (P) { if (P.step === step - 1) count["spacer-" + P.size] = (count["spacer-" + P.size] || 0) + 1; });
    var keys = Object.keys(count).sort(), y0 = H - 24 - keys.length * 18;
    o.push('<text x="24" y="' + (y0 - 8) + '" font-family="monospace" font-size="12" fill="' + ink + '" opacity="0.75">parts for this step</text>');
    keys.forEach(function (k, i) {
      var col = KNEX.KINDS[k] ? KNEX.RGB[KNEX.KINDS[k].color] : KNEX.RGB[k.replace("flexi-", "").replace("spacer-", "")] || "#888";
      o.push('<rect x="24" y="' + (y0 + i * 18 - 9) + '" width="11" height="11" fill="' + col + '" stroke="' + line + '"/>');
      o.push('<text x="42" y="' + (y0 + i * 18) + '" font-family="monospace" font-size="13" fill="' + ink + '">' + count[k] + " x " + k + '</text>');
    });
  }
  o.push('</svg>');
  fs.writeFileSync(out, o.join("\n"));
  return out + "  " + items.length + " parts drawn, view " + opt("--view", "iso") + (step != null ? ", step " + step : "");
};
