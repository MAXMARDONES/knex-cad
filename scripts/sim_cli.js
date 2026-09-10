/* node cli.js sim <build.knx> [options] — run the physics and report what the rig does. */
module.exports = function simCli(KNEX, fs, file, args) {
  var V = KNEX.V, D = KNEX.DIMS;
  function opt(f, d) { var i = args.indexOf(f); return i >= 0 ? args[i + 1] : d; }
  function num(f, d) { var v = opt(f); return v == null ? d : Number(v); }
  function flag(f) { return args.indexOf(f) >= 0; }
  /* A rod that snaps out of its socket stops carrying any load, so whatever it was holding becomes a
     free body. Say so loudly: an unreported break reads as a working model that then flies off the
     table, which is how the leaf-spring pattern hid a real overload for so long. */
  function reportBreaks(rep, when) {
    var gone = rep.beams.filter(function (b) { return b.broken; });
    if (!gone.length) return false;
    console.log("\n  " + gone.length + " rod" + (gone.length > 1 ? "s" : "") + " snapped out while " + when + ":");
    gone.forEach(function (b) { console.log("    " + b.name + " (" + b.color + ") at " + (b.util * 100).toFixed(0) + "% of the socket's estimated capacity"); });
    console.log("    Everything they held is now loose, so the numbers below describe a broken model.");
    return true;
  }
  var s = KNEX.build(fs.readFileSync(file, "utf8"));
  if (s.errors) { console.error(s.errors + " errors in the build; fix them first (run without 'sim')"); return 1; }
  KNEX.bodies(s);
  var dt = Number(opt("--dt", 1 / 2000)), surface = opt("--surface", "mousepad-cloth");
  var settle = Number(opt("--settle", 0.6)), seconds = Number(opt("--seconds", 1.2));
  var W = KNEX.phys.world(s, { surface: surface, mu: opt("--mu") ? Number(opt("--mu")) : undefined,
                               pinBase: !flag("--free-base"), breakage: !flag("--no-break"), gravity: flag("--zero-g") ? 0 : undefined });
  var surf = KNEX.SURFACES[surface];
  console.log(s.title + "  on " + (surf ? surf.name : surface) + "  (mouse mu " + (surf ? surf.mu : D.muDesk) + ", K'NEX mu " + (surf ? surf.muKnex : 0.35) + ")");
  console.log("bodies " + W.bodies.length + " | joints " + W.joints.length + " | compliant rods " + W.beams.length + " | loads " + W.loads.length);
  W.bodies.forEach(function (b) {
    console.log("  body " + b.id + " " + (b.prop ? b.prop.label : b.ball ? "ball " + b.ball.label : b.fixed ? "frame (held by the desk)" : "moving") +
                "  " + (b.m * 1000).toFixed(0) + " g  centre " + V.mul(b.x, 1000).map(function (v) { return v.toFixed(0); }).join(","));
  });
  W.joints.forEach(function (j) { console.log("  joint " + j.name + " " + j.kind + " about " + V.axisName(j.axis) + (j.locked ? " (axially parked)" : " (free to slide)")); });
  // --- settle
  /* Settling means gravity alone. Every declared F used to be live here at gain 1, so the rest pose
     already contained the push, and the displacement measured afterwards came out as zero for the
     very force you were asking about. Silence them first and let the press phase turn them on. */
  W.loads.forEach(function (L) { L.gain = 0; });
  KNEX.phys.run(W, settle, dt, {});
  var rest = W.bodies.map(function (b) { return b.x.slice(); });
  var r0 = KNEX.phys.report(W, dt);
  console.log("\nat rest after " + settle + " s:");
  r0.joints.forEach(function (j) { console.log("  " + j.name + " carries " + j.load.toFixed(2) + " N" + (j.load > D.socketPull ? "  OVER the estimated " + D.socketPull + " N socket limit" : "")); });
  r0.beams.forEach(function (b) { console.log("  rod " + b.name + " " + b.color + ": " + b.axial.toFixed(2) + " N along it, " + b.lateral.toFixed(2) + " N bending it" +
                                              (b.broken ? "  SNAPPED OUT of its socket at " + (b.util * 100).toFixed(0) + "% of capacity" : "")); });
  reportBreaks(r0, "settling under its own weight");
  // --- press
  var press = [];
  (opt("--press", "") || "").split(";").filter(Boolean).forEach(function (p) {
    var kv = p.split("="); press.push({ name: kv[0].trim(), gain: Number(kv[1]) });
  });
  if (!press.length && W.loads.length) press.push({ name: W.loads[0].name, gain: 1 });
  W.loads.forEach(function (L) { L.gain = 0; });
  press.forEach(function (p) {
    var L = W.loads.filter(function (x) { return x.name === p.name; })[0];
    if (!L) { console.log("\nno load named '" + p.name + "'. Declared: " + W.loads.map(function (x) { return x.name; }).join(", ")); return; }
    L.gain = p.gain;
    console.log("\npressing " + L.name + " with " + (V.norm(L.F) * p.gain).toFixed(1) + " N for " + seconds + " s");
  });
  var peak = {}, trace = [];
  /* Bring the press up over a few tens of milliseconds instead of switching it on between one step
     and the next. A step force hits a rigid constraint as an impulse, and the solver reported the
     spike rather than the load: a 2 N push on the slider read 156 N and popped both its hubs. No
     finger arrives instantaneously, so the ramp is the honest model as well as the stable one. */
  var rampS = Number(opt("--ramp", 0.08)), t0 = W.t;
  var target = W.loads.map(function (L) { return L.gain; });
  KNEX.phys.run(W, seconds, dt, function (t) {
    var f = rampS > 0 ? Math.min(1, (t - t0) / rampS) : 1;
    W.loads.forEach(function (L, i) { L.gain = target[i] * f; });
    return {};
  }, function (w) {
    w.joints.forEach(function (j) { peak[j.name] = Math.max(peak[j.name] || 0, j.load); });
    var mouse = w.bodies.filter(function (b) { return b.prop; })[0];
    trace.push({ t: w.t, mouse: mouse ? V.mul(V.sub(mouse.x, rest[mouse.id]), 1000) : null,
                 tilt: w.bodies.map(function (b) { return 2 * Math.asin(Math.max(-1, Math.min(1, Math.hypot(b.q[0], b.q[1])))) * 180 / Math.PI; }) });
  }, 60);
  var mouseBody = W.bodies.filter(function (b) { return b.prop; })[0];
  console.log("\nresult:");
  W.bodies.forEach(function (b, i) {
    if (b.fixed) return;
    var d = V.mul(V.sub(b.x, rest[i]), 1000), R = 2 * 180 / Math.PI;
    console.log("  " + (b.prop ? b.prop.label : b.ball ? b.ball.label : "body " + b.id) + " moved " + d.map(function (v) { return v.toFixed(1); }).join(",") +
                " mm | pitch " + (b.q[0] * R).toFixed(2) + " roll " + (b.q[1] * R).toFixed(2) + " yaw " + (b.q[2] * R).toFixed(2) + " deg");
  });
  var rep = KNEX.phys.report(W, dt);
  reportBreaks(rep, "you were pressing it");
  /* An `F` is a thruster: it pushes its body and nothing pushes back. On a body that is still held
     that is what you want, but on one that has come loose it accelerates forever, so a run that ends
     a metre away is a broken model rather than a measurement. */
  var flew = W.bodies.filter(function (b, i) {
    if (b.fixed || V.dist(b.x, rest[i]) <= 0.5) return false;
    return !(b.prop && b.prop.vel) && !b.ball;              // something thrown is meant to travel
  });
  if (flew.length) {
    console.log("\n  " + flew.length + " body/bodies travelled more than half a metre. Nothing on a desk does that:");
    console.log("    either something broke above, or the body is held by nothing and an F is driving it");
    console.log("    like a rocket. Anchor it (A), support it, or drop the load.");
  }
  if (rep.tendons.length) rep.tendons.forEach(function (t) { console.log("  " + t.kind + " " + t.name + ": " + t.F.toFixed(2) + " N, " + t.len.toFixed(0) + " mm long (rest " + t.rest.toFixed(0) + ")"); });
  if (rep.motors.length) rep.motors.forEach(function (m) { console.log("  motor " + m.name + ": " + m.torque.toFixed(0) + " N.mm at " + m.rpm.toFixed(1) + " rpm"); });
  if (rep.gears.length) rep.gears.forEach(function (g) { console.log("  gears " + g.a + " drives " + g.b + " at " + g.ratio + ":1"); });
  if (mouseBody) {
    var d = V.mul(V.sub(mouseBody.x, rest[mouseBody.id]), 1000);
    console.log("  mouse travel " + Math.hypot(d[0], d[1]).toFixed(1) + " mm in the desk plane");
  }
  console.log("  peak joint loads: " + Object.keys(peak).map(function (k) { return k + " " + peak[k].toFixed(1) + " N"; }).join(", "));
  var over = Object.keys(peak).filter(function (k) { return peak[k] > D.socketPull; });
  if (over.length) console.log("  WARNING: " + over.join(", ") + " exceed the estimated " + D.socketPull + " N socket capacity; those joints would pop");
  if (flag("--trace")) trace.forEach(function (x) { console.log("   t=" + x.t.toFixed(3) + "  mouse " + (x.mouse ? x.mouse.map(function (v) { return v.toFixed(2); }).join(",") : "-")); });
  return 0;
};
