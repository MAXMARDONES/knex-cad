<script>
/* Live physics in the page: build a world from the current model, step it, move the body groups. */
var PHYS = { W: null, running: false, dt: 1 / 600, speed: 1, solved: null, acc: 0, press: {}, surface: "mousepad-cloth" };
function physBuild() {
  if (!PHYS.solved) return;
  PHYS.W = KNEX.phys.world(PHYS.solved, { surface: PHYS.surface, iters: 8 });
  PHYS.W.loads.forEach(function (L) { L.gain = PHYS.press[L.name] || 0; });
  PHYS.rest = PHYS.W.bodies.map(function (b) { return b.x.slice(); });
  PHYS.peak = {};
  physApply();
}
function physReset() { PHYS.running = false; physBuild(); document.getElementById("physRun").textContent = "Run"; physApply(); physReadout(); }
function physApply() {                                   // body transforms -> three groups
  if (!PHYS.W) return;
  try {
  PHYS.W.bodies.forEach(function (b) {
    var g = BODYG[b.id]; if (!g) return;
    g.position.set(b.x[0] * 1000, b.x[2] * 1000, -b.x[1] * 1000);
    g.quaternion.set(b.q[0], b.q[2], -b.q[1], b.q[3]);
  });
  if (window.beamsApply) beamsApply();
  if (window.bandsApply) bandsApply();
  if (window.stressApply && STRESS.on) stressApply();
  } catch (e) { console.warn("physApply skipped:", e.message); }
}
function physStep(ms) {
  if (!PHYS.W || !PHYS.running) return;
  PHYS.acc = Math.min(PHYS.acc + ms / 1000 * PHYS.speed, 0.05);
  var n = 0, t0 = performance.now();
  try {
    while (PHYS.acc >= PHYS.dt && n < 80) { KNEX.phys.step(PHYS.W, PHYS.dt, dragInput()); PHYS.acc -= PHYS.dt; n++; }
  } catch (e) { console.warn("physics step failed:", e.message); PHYS.running = false; var b = document.getElementById("physRun"); if (b) b.textContent = "Run"; }
  PHYS.steps = n; PHYS.msPerFrame = performance.now() - t0;
  PHYS.rate = n * PHYS.dt / Math.max(1e-6, (performance.now() - t0) / 1000);
  PHYS.W.joints.forEach(function (j) { PHYS.peak[j.name] = Math.max(PHYS.peak[j.name] || 0, j.load); });
  physApply();
}
function physReadout() {
  var el = document.getElementById("physOut"); if (!el) return;
  if (!PHYS.W) { el.textContent = ""; return; }
  var W = PHYS.W, D = KNEX.DIMS, rows = [];
  rows.push("<tr><th>joint</th><th class=n>now</th><th class=n>peak</th></tr>");
  W.joints.forEach(function (j) {
    var over = (PHYS.peak[j.name] || 0) > D.socketPull;
    rows.push("<tr><td>" + j.name + "</td><td class=n>" + j.load.toFixed(1) + "</td><td class=n" + (over ? " style='color:var(--err)'" : "") + ">" + (PHYS.peak[j.name] || 0).toFixed(1) + "</td></tr>");
  });
  document.getElementById("physJoints").innerHTML = rows.join("");
  var b = [];
  W.beams.forEach(function (x) { b.push("<tr><td>" + x.name + "</td><td class=n>" + x.F.toFixed(1) + "</td><td class=n>" + x.Flat.toFixed(2) + "</td></tr>"); });
  document.getElementById("physBeams").innerHTML = b.length ? "<tr><th>compliant rod</th><th class=n>along N</th><th class=n>bending N</th></tr>" + b.join("") : "";
  var out = ["t " + W.t.toFixed(2) + " s" + (PHYS.running ? "  ·  " + (PHYS.rate || 0).toFixed(1) + "x real time" : "  ·  paused") +
             (DRAG.on ? "  ·  pushing " + DRAG.N.toFixed(1) + " N" : "")];
  if (W.events && W.events.length) out.push("BROKE: " + W.events.slice(-3).map(function (e) { return e.what + " — " + e.why; }).join(" | "));
  W.bodies.forEach(function (x, i) {
    if (x.fixed) return;
    var d = [(x.x[0] - PHYS.rest[i][0]) * 1000, (x.x[1] - PHYS.rest[i][1]) * 1000, (x.x[2] - PHYS.rest[i][2]) * 1000];
    var nm = x.prop ? x.prop.label : "body " + x.id;
    out.push(nm + ": moved " + d.map(function (v) { return v.toFixed(1); }).join(", ") + " mm · pitch " + (x.q[0] * 114.59).toFixed(1) + "° roll " + (x.q[1] * 114.59).toFixed(1) + "°");
  });
  el.textContent = out.join("\n");
}
setInterval(physReadout, 200);
</script>
<script>
/* Reshape every compliant rod each frame so it visibly bends through the connector holding it. */
function beamShape(bm) {
  if (!bm.qa || !bm.u || !bm.err) return null;         // nothing solved yet: leave the rod as built
  var V = KNEX.V, D = KNEX.DIMS, rod = null;
  for (var k in BEAMMESH) if (BEAMMESH[k].rod.id === bm.rod) rod = BEAMMESH[k];
  if (!rod) return null;
  var qa = bm.qa, u = bm.u, span = bm.span, len = rod.rod.len / 1000;
  var perpV = V.sub(bm.err, V.mul(u, bm.par)), d = V.norm(perpV);
  var n = d > 1e-7 ? V.mul(perpV, 1 / d) : [0, 0, 1];
  var pts = [], N = 12, x0 = D.d / 1000, x1 = x0 + len;
  for (var i = 0; i <= N; i++) {
    var x = x0 + (x1 - x0) * i / N, t = x / span, y;
    if (bm.flexi) { var s = Math.max(0, span - bm.len), amp = Math.sqrt(Math.max(0, 3 * span * s / 8));
                    y = amp * Math.sin(Math.PI * Math.min(1, t)) + d * (3 * t * t - t * t * t) / 2; }
    else y = t <= 1 ? d * (3 * t * t - t * t * t) / 2 : d + (t - 1) * span * 1.5 * d / span;
    var p = V.add(V.add(qa, V.mul(u, x)), V.mul(n, y));
    pts.push(new THREE.Vector3(p[0] * 1000, p[2] * 1000, -p[1] * 1000));
  }
  return { rod: rod, pts: pts, bend: d };
}
function beamsApply() {
  if (!PHYS.W) return;
  try {
  PHYS.W.beams.forEach(function (bm) {
    var sh = beamShape(bm); if (!sh) return;
    if (sh.rod.lastBend != null && Math.abs(sh.rod.lastBend - sh.bend) < 2e-5 && sh.rod.lastT === PHYS.W.t) return;
    sh.rod.lastBend = sh.bend;
    var g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sh.pts), 14, KNEX.DIMS.rodD / 2, 7, false);
    sh.rod.mesh.geometry.dispose(); sh.rod.mesh.geometry = g;
  });
  } catch (e) { console.warn("beam reshape skipped:", e.message); }
}
/* Bands follow the bodies they are tied to, and go red as they stretch. A slack band is dim: that is
   the difference between a spring that is doing something and one that is just lying there. */
function bandsApply() {
  if (!BANDS || !BANDS.length) return;
  try {
    BANDS.forEach(function (B) {
      var pts = B.nodes.map(function (n) {
        var p = toThree(n.pos);
        var g = n.body != null && BODYG[n.body] ? BODYG[n.body] : null;
        return g ? g.localToWorld(p.sub(g.userData.rest)) : p;
      });
      B.pts = pts;
      B.line.geometry.dispose();
      B.line.geometry = bandGeo(pts, B.line.userData.radius || 2);
      var live = PHYS.W && (PHYS.W.tendons || []).filter(function (t) { return t.name === B.T.name; })[0];
      if (!live) return;
      var stretch = live.rest > 0 ? Math.max(0, (live.len - live.rest) / live.rest) : 0;
      B.line.material.color = B.T.kind === "band"
        ? new THREE.Color(0.55 + Math.min(0.45, stretch), 0.30 - Math.min(0.28, stretch * 0.7), 0.10)
        : new THREE.Color(0.95, 0.95, 0.94);
    });
  } catch (e) { console.warn("band update skipped:", e.message); }
}
</script>
