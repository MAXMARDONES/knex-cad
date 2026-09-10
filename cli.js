#!/usr/bin/env node
/* node cli.js builds/rig.knx [--json out.json] [--push dist/current.json] [--quiet]
   Validates a .knx build, prints the report; --push writes the doc for the live viewer (Artifact write_db). */
var fs = require("fs"), path = require("path");
var KNEX = require(path.join(__dirname, "dist", "knex.js"));
var args = process.argv.slice(2), isOpt = function (a) { return a.slice(0, 2) === "--"; }, file = args.find(function (a) { return !isOpt(a); });
if (file === "sim") {
  var target = args.filter(function (a) { return !isOpt(a); })[1];
  if (!target) { console.error("usage: node cli.js sim build.knx [--surface s] [--press \"name\"=gain] [--seconds n] [--trace]"); process.exit(2); }
  process.exit(require(path.join(__dirname, "scripts", "sim_cli.js"))(KNEX, fs, target, args));
}
if (file === "replay") {                                 // rebuild a session feed from a transcript
  require(path.join(__dirname, "scripts", "replay.js"))(args);
  return;
}
if (file === "live") {                                   // hot-reloading bench with a session feed
  require(path.join(__dirname, "scripts", "live.js"))(args);
  return;
}
if (file === "log") {                                    // post to a running live server
  var http = require("http");
  function o(f, d) { var i = args.indexOf(f); return i >= 0 ? args[i + 1] : d; }
  var words = [], skip = false;                          // drop --flags AND the value each one takes
  args.slice(args.indexOf("log") + 1).forEach(function (a) {
    if (skip) { skip = false; return; }
    if (isOpt(a)) { skip = true; return; }
    words.push(a);
  });
  var text = words.join(" ");
  var payload = { kind: o("--kind", "note"), text: text };
  var img = o("--image");
  if (img) {
    var ext = path.extname(img).slice(1) || "png";
    payload.image = "data:image/" + (ext === "jpg" ? "jpeg" : ext) + ";base64," + fs.readFileSync(img).toString("base64");
    payload.kind = o("--kind", "image");
    if (!payload.text) payload.text = path.basename(img);
  }
  var body = JSON.stringify(payload);
  var req = http.request({ host: "localhost", port: Number(o("--port", 8730)), path: "/log", method: "POST",
                           headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } },
    function (res) { res.resume(); process.exit(0); });
  req.on("error", function (e) { console.error("no live server on port " + o("--port", 8730) + " (" + e.code + "). Start one with: knex-cad live"); process.exit(1); });
  req.end(body);
  return;
}
if (file === "bridge") {                                 /* pick two points and a way of getting between them */
  var pos = args.filter(function (a) { return !isOpt(a); });
  if (pos.length < 4) {
    console.error("usage: node cli.js bridge build.knx A B [--style truss|line|arch|slide] [--step 1|2|4]");
    console.error("                    [--rod colour] [--segments n] [--legs] [--prefix BR] [--append]");
    process.exit(2);
  }
  function o(f, d) { var i = args.indexOf(f); return i >= 0 ? args[i + 1] : d; }
  function flag(f) { return args.indexOf(f) >= 0; }
  var src = pos[1], b = KNEX.build(fs.readFileSync(src, "utf8"));
  var A = b.byName[pos[2]], B = b.byName[pos[3]];
  if (!A || !B) { console.error("cannot find " + (A ? pos[3] : pos[2]) + " in " + src); process.exit(1); }
  var V2 = KNEX.V, U = b.U, ua = V2.mul(A.pos, 1 / U), ub = V2.mul(B.pos, 1 / U);
  var style = o("--style", "truss"), prefix = o("--prefix", "BR"), lines = [], note = "", firstDir = null, lastDir = null;
  // The path search works on whole units. If both ends sit off the lattice by the same amount, shift the
  // whole result back onto them; if they differ, say so rather than generating something that misses.
  var fa = V2.sub(ua, ua.map(Math.round)), fb = V2.sub(ub, ub.map(Math.round));
  var shift = [0, 0, 0];
  if (V2.norm(fa) > 1e-6 || V2.norm(fb) > 1e-6) {
    if (V2.dist(fa, fb) > 1e-6) {
      console.error(pos[2] + " and " + pos[3] + " sit off the lattice by different amounts (" +
        V2.mul(fa, U).map(function (v) { return v.toFixed(1); }).join(",") + " and " +
        V2.mul(fb, U).map(function (v) { return v.toFixed(1); }).join(",") + " mm).");
      console.error("Nothing regular can span that. Move one of them onto a whole number of units.");
      process.exit(1);
    }
    shift = fa;
    ua = ua.map(Math.round); ub = ub.map(Math.round);
    console.log("# both ends sit " + V2.mul(fa, U).map(function (v) { return v.toFixed(1); }).join(",") +
                " mm off the lattice; the whole span is shifted to match.\n");
  }
  function place(line) {                                    // apply that shift to every generated coordinate
    if (V2.norm(shift) < 1e-9) return line;
    var t = line.split(" ");
    if (t[0] === "C" || t[0] === "H") { var p = t[3].split(",").map(Number); t[3] = V2.add(p, shift).map(function (v) { return Number(v.toFixed(4)); }).join(","); }
    return t.join(" ");
  }

  if (style === "arch") {
    var ar = KNEX.gen.arch(ua, ub, { rod: o("--rod", "blue"), segments: o("--segments") ? Number(o("--segments")) : 0, prefix: prefix, down: flag("--down") });
    if (!ar.ok) { console.error(ar.why); process.exit(1); }
    lines = ar.lines
      .filter(function (l) { return l.indexOf("C " + prefix + "0 ") !== 0 && l.indexOf("C " + prefix + ar.segments + " ") !== 0; })
      .map(function (l) { return l.split(" ").map(function (t) { return t === prefix + "0" ? pos[2] : t === prefix + String(ar.segments) ? pos[3] : t; }).join(" "); });
    note = ar.segments + " " + ar.colour + " rods on a " + (ar.radius * U).toFixed(0) + " mm radius, rising " +
           (ar.rise * U).toFixed(0) + " mm, turning " + ar.turn.toFixed(1) + " deg at each joint";
    firstDir = V2.unit(V2.sub(ar.pts[1], ar.pts[0])); lastDir = V2.unit(V2.sub(ar.pts[ar.pts.length - 2], ar.pts[ar.pts.length - 1]));
    if (ar.moment > KNEX.DIMS.socketMoment) {
      console.log("# WARNING: bending each rod that far puts " + ar.moment.toFixed(0) + " N.mm into every socket, and they");
      console.log("# let go at about " + KNEX.DIMS.socketMoment + " N.mm (estimate). Use more segments or a longer rod.\n");
    }
    if (flag("--legs")) lines = lines.concat(KNEX.gen.legs(ar.pts, { prefix: prefix + "L", nodePrefix: prefix, every: Number(o("--every", 2)) }));
  } else if (style === "slide") {
    var d = V2.sub(ub, ua), Ld = V2.norm(d), fit = KNEX.LADDER.filter(function (l) { return Math.abs(l.c2c / U - Ld) < 0.02; })[0];
    if (!fit) { console.error("a slide needs one rod end to end, and " + Ld.toFixed(3) + " U is not a rod length. node cli.js span " + pos[2] + " " + pos[3]); process.exit(1); }
    var side = Math.abs(V2.unit(d)[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1];
    lines = ["C " + prefix + "a W8 " + V2.add(ua, side).join(","), "C " + prefix + "b W8 " + V2.add(ub, side).join(","),
             "R " + pos[2] + " " + pos[3] + " " + fit.color, "R " + prefix + "a " + prefix + "b " + fit.color,
             "H " + prefix + "c1 W8 " + V2.add(V2.mul(V2.add(ua, ub), 0.5), [0, 0, 0]).join(",") + " z",
             "H " + prefix + "c2 W8 " + V2.add(V2.mul(V2.add(ua, ub), 0.5), side).join(",") + " z",
             "R " + prefix + "c1 " + prefix + "c2"];
    note = "two parallel " + fit.color + " rails one unit apart, with a carriage on both: it slides and cannot spin";
    firstDir = V2.unit(d); lastDir = V2.mul(firstDir, -1);
  } else {
    var step = Number(o("--step", 2));
    var r = KNEX.gen.path(ua, ub, { box: Number(o("--box", 14)), uniform: style === "truss" ? step : 0 });
    if (!r.ok && style === "truss") [1, 2, 4].filter(function (n) { return n !== step; }).some(function (n) {
      var t2 = KNEX.gen.path(ua, ub, { box: Number(o("--box", 14)), uniform: n });
      if (t2.ok) { r = t2; step = n; return true; } return false;
    });
    if (!r.ok) { console.error(r.why); process.exit(1); }
    lines = KNEX.gen.truss(r.steps, { style: style, prefix: prefix, uniform: style === "truss" ? step : 0 });
    lines = lines.filter(function (l) { return l.indexOf("C " + prefix + "a0 ") !== 0 && l.indexOf("C " + prefix + "a" + r.steps.length + " ") !== 0; })
      .map(function (l) { return l.split(" ").map(function (t) { return t === prefix + "a0" ? pos[2] : t === prefix + "a" + r.steps.length ? pos[3] : t; }).join(" "); });
    note = r.steps.length + " rods" + (style === "truss" ? " in " + step + "-unit steps, laced into a beam" : "") + ": " + r.steps.map(function (s) { return s.colour; }).join(", ");
    firstDir = V2.unit(V2.sub(r.steps[0].to, r.steps[0].from));
    lastDir = V2.unit(V2.sub(r.steps[r.steps.length - 1].from, r.steps[r.steps.length - 1].to));
    if (flag("--legs")) {
      var pts = [r.steps[0].from].concat(r.steps.map(function (s) { return s.to; }));
      lines = lines.concat(KNEX.gen.legs(pts, { prefix: prefix + "L", nodePrefix: prefix + "a", every: Number(o("--every", 2)) }));
    }
  }
  // will the two ends actually take it?
  [[A, firstDir, pos[2]], [B, lastDir, pos[3]]].forEach(function (e) {
    if (!e[1]) return;
    if (Math.abs(V2.dot(e[1], e[0].n)) > 0.08)
      console.log("# " + e[2] + " lies in the " + KNEX.V.axisName(e[0].n) + " plane and this arrives along " +
                  KNEX.V.axisName(e[1]) + ", so it cannot seat there.\n# Make " + e[2] + " a 3D pair (two B7 at that point, planes at 90) or move it.\n");
  });
  var out = ["! bridge " + pos[2] + " to " + pos[3] + ", " + style].concat(lines.map(place));
  console.log(out.join("\n"));
  console.log("\n# " + note);
  if (flag("--append")) {
    fs.appendFileSync(src, "\n" + out.join("\n") + "\n");
    var again = KNEX.build(fs.readFileSync(src, "utf8"));
    console.log("\nappended to " + src + ": " + again.errors + " errors, " + again.warnings + " warnings");
    process.exit(again.errors ? 1 : 0);
  }
  console.log("# paste it in, or re-run with --append");
  process.exit(0);
}
if (file === "reach" || file === "ik") {                 // what can this thing reach, and how far must each joint turn
  var pos = args.filter(function (a) { return !isOpt(a); });
  if (!pos[1]) { console.error("usage: node cli.js reach build.knx [--tip NAME]  |  node cli.js ik build.knx --target x,y,z [--tip NAME] [--lever mm]"); process.exit(2); }
  function o(f, d) { var i = args.indexOf(f); return i >= 0 ? args[i + 1] : d; }
  var b = KNEX.build(fs.readFileSync(pos[1], "utf8"));
  if (b.errors) { console.error(b.errors + " errors in the build; fix them first"); process.exit(1); }
  KNEX.bodies(b);
  var W = KNEX.phys.world(b, {});
  var tip = o("--tip");
  if (file === "reach") {
    var ws = KNEX.kin.workspace(W, { tip: tip, samples: Number(o("--samples", 4000)) });
    if (!ws.ok) { console.log(ws.why); process.exit(0); }
    console.log(b.title + ": " + ws.dof + " degrees of freedom out to " + ws.chain.tipName);
    ws.chain.links.forEach(function (l, i) {
      console.log("  " + (i + 1) + ". " + l.joint.name.padEnd(12) + "turns about " + KNEX.V.axisName(l.joint.axis) +
                  " at " + KNEX.V.mul(l.joint.anchor, 1000).map(function (v) { return v.toFixed(0); }).join(",") + " mm");
    });
    console.log("\nwhat the tip can reach, sampling every joint through a full turn:");
    console.log("  envelope   " + ws.size.map(function (v) { return v.toFixed(0); }).join(" x ") + " mm");
    console.log("  x " + ws.min[0].toFixed(0) + " to " + ws.max[0].toFixed(0) + "   y " + ws.min[1].toFixed(0) + " to " + ws.max[1].toFixed(0) + "   z " + ws.min[2].toFixed(0) + " to " + ws.max[2].toFixed(0) + " mm");
    console.log("  furthest from the first joint: " + ws.reach.toFixed(0) + " mm");
    console.log("\nThis ignores collisions and end stops: it is what the geometry allows, not what the parts");
    console.log("will let you do. Run the simulation to find out which of it you can actually use.");
    process.exit(0);
  }
  var t = (o("--target") || "").split(",").map(Number);
  if (t.length !== 3 || !t.every(isFinite)) { console.error("--target x,y,z in mm"); process.exit(2); }
  var r = KNEX.kin.solve(W, { tip: tip, target: t, tol: Number(o("--tol", 1)) });
  if (r.why) { console.log(r.why); process.exit(0); }
  var lever = Number(o("--lever", 50));
  console.log(b.title + ": reaching " + t.join(",") + " mm with " + r.chain.links.length + " joints");
  console.log(r.ok ? "  reachable, within " + r.err.toFixed(1) + " mm"
                   : "  NOT reachable: the closest it gets is " + r.err.toFixed(1) + " mm short, at " + r.tip.map(function (v) { return v.toFixed(0); }).join(","));
  console.log("\njoint            turn      actuator travel at a " + lever + " mm lever");
  r.joints.forEach(function (j) {
    console.log("  " + j.name.padEnd(14) + (j.deg.toFixed(1) + " deg").padStart(9) + "      " +
                (Math.abs(j.deg) * Math.PI / 180 * lever).toFixed(1) + " mm");
  });
  console.log("\nThe travel column is the arc a lever of that radius sweeps: it is what a linear actuator");
  console.log("driving that joint has to deliver. Collisions are not checked here.");
  process.exit(0);
}
if (file === "props") {                                  // what you can put on the table with the model
  console.log("Props. Real dimensions in mm, real mass in grams, and friction for that material on a desk.");
  console.log("Use one by name: `X phone 0,0,3`, or give your own size: `X thing 0,0,3 90,60,20 mass=140`.\n");
  console.log("name             shape      size mm            mass    mu   what it is");
  Object.keys(KNEX.PROPS).forEach(function (k) {
    var p = KNEX.PROPS[k];
    console.log("  " + k.padEnd(15) + p.shape.padEnd(10) + p.size.join(" x ").padEnd(19) +
                (p.mass + " g").padStart(7) + "  " + String(p.mu).padStart(4) + "   " + p.note);
  });
  console.log("\nOptions: mass= mu= shape=box|sphere|cylinder pad=x,y fixed #hex");
  console.log("         vel=x,y,z throws it (m/s), spin=x,y,z sets it turning (rad/s)");
  console.log("A prop with a mass is a rigid body: it falls, slides, topples and collides with the model.");
  process.exit(0);
}
if (file === "ports") {                                  // what a build offers other modules, and whether they fit
  var pos = args.filter(function (a) { return !isOpt(a); });
  if (!pos[1]) { console.error("usage: node cli.js ports build.knx"); process.exit(2); }
  var b = KNEX.build(fs.readFileSync(pos[1], "utf8"));
  if (!b.ports.length) { console.log("no ports. Mark a connector with `Z name label` to say another module attaches there."); process.exit(0); }
  console.log(b.title + ": " + b.ports.length + " port(s)" + (b.modules.length ? ", modules: " + b.modules.join(", ") : ""));
  b.ports.forEach(function (p) {
    console.log("  " + p.label.padEnd(22) + p.kind + "  at " + p.pos.map(function (v) { return (v / b.U).toFixed(2); }).join(",") +
                " U  free sockets " + (p.free.length ? p.free.join(",") : "none"));
  });
  if (b.portFits.length) { console.log("\nthese fit:"); b.portFits.forEach(function (f) { console.log("  " + f.a + " to " + f.b + ": one " + f.rod + " rod (" + f.d.toFixed(1) + " mm)"); }); }
  if (b.portGaps.length) { console.log("\nthese do not:"); b.portGaps.forEach(function (g) { console.log("  " + g.msg.replace(/^ports /, "")); }); }
  if (!b.portFits.length && !b.portGaps.length) console.log("\nno two ports are facing each other; nothing to join yet.");
  process.exit(0);
}
if (file === "shot") {                                   // a 3D render of a model, headless, straight to PNG
  var pos = args.filter(function (a) { return !isOpt(a); });
  if (pos.length < 3) { console.error("usage: node cli.js shot build.knx out.png [view=iso] [step=N] [stress=1] [run=2] [caption=...] [w=] [h=]"); process.exit(2); }
  var rest = process.argv.slice(2).filter(function (a) { return a !== "shot" && a !== pos[1] && a !== pos[2]; });
  require("child_process").execFileSync(path.join(__dirname, "scripts", "shot.sh"), [pos[1], pos[2]].concat(rest), { cwd: __dirname, stdio: "inherit" });
  process.exit(0);
}
if (file === "view") {                                   // build the bench around a model and open it
  var pos = args.filter(function (a) { return !isOpt(a); });
  var src = pos[1] || path.join(__dirname, "builds", "rig.knx");
  var cp = require("child_process");
  cp.execFileSync(path.join(__dirname, "build_viewer.sh"), [src], { cwd: __dirname, stdio: "inherit" });
  var page = path.join(__dirname, "docs", "viewer.html");
  var open = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  try { cp.execFileSync(open, [page], { stdio: "ignore" }); console.log("opened " + page); }
  catch (e) { console.log("open this file in a browser: " + page); }
  process.exit(0);
}
if (file === "instructions") {
  var pos = args.filter(function (a) { return !isOpt(a); });
  var src = pos[1], dir = pos[2] || "docs/instructions";
  if (!src) { console.error("usage: node cli.js instructions build.knx [outdir] [--view iso]"); process.exit(2); }
  fs.mkdirSync(dir, { recursive: true });
  var built = KNEX.build(fs.readFileSync(src, "utf8"));
  var R = require(path.join(__dirname, "scripts", "render.js"));
  var views = ["iso", "iso2", "front", "left"];
  for (var i = 1; i <= built.steps.length; i++) {
    var f = dir + "/step" + String(i).padStart(2, "0") + ".svg";
    var a = args.concat(["--step", String(i)]);
    if (args.indexOf("--view") < 0) a = a.concat(["--view", views[i % views.length]]);   // walk around as it goes up
    console.log(R(KNEX, fs, src, f, a));
  }
  console.log(R(KNEX, fs, src, dir + "/complete.svg", args.concat(["--view", "iso"])));
  console.log("\n" + built.steps.length + " steps written to " + dir);
  process.exit(0);
}
if (file === "render") {
  var pos = args.filter(function (a) { return !isOpt(a); });
  if (pos.length < 3) { console.error("usage: node cli.js render build.knx out.svg [--view iso|front|left|top] [--step N] [--hide props,joints] [--labels]"); process.exit(2); }
  console.log(require(path.join(__dirname, "scripts", "render.js"))(KNEX, fs, pos[1], pos[2], args));
  process.exit(0);
}
if (file === "spring" || file === "arc") {
  var ref = require(path.join(__dirname, "scripts", "spring_ref.js"));
  console.log(file === "spring" ? ref.spring(KNEX) : ref.arc(KNEX, args));
  process.exit(0);
}
if (file === "span") {                                   // node cli.js span 0,0,0 2,2,0  -> what fits, and how to split it
  var pts = args.filter(function (a) { return !isOpt(a); }).slice(1);
  if (pts.length < 2) { console.error("usage: node cli.js span x,y,z x,y,z   (lattice units)"); process.exit(2); }
  var A = pts[0].split(",").map(Number), B = pts[1].split(",").map(Number);
  var d = Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]), mm = d * KNEX.U;
  console.log("span " + d.toFixed(4) + " U = " + mm.toFixed(2) + " mm");
  var hit = KNEX.LADDER.filter(function (l) { return Math.abs(l.c2c - mm) < 1; })[0];
  if (hit) { console.log("  -> one " + hit.color + " rod (" + hit.c2c + " c2c)"); process.exit(0); }
  console.log("  -> no single rod. Nearest: " + KNEX.LADDER.map(function (l) { return l.color + " " + l.c2c; }).join(", "));
  var best = [];
  KNEX.LADDER.forEach(function (a) { KNEX.LADDER.forEach(function (b) {
    if (Math.abs(a.c2c + b.c2c - mm) < 1 && a.c2c <= b.c2c) best.push(a.color + " + " + b.color);
  }); });
  console.log(best.length ? "  -> split it with a connector between: " + best.join(", ") : "  -> no two-rod split either; move a node onto the lattice");
  process.exit(0);
}
if (file === "parts") { console.log(require(path.join(__dirname, "scripts", "parts_ref.js"))(KNEX, args.indexOf("--json") >= 0)); process.exit(0); }
if (!file) { console.error("usage: node cli.js build.knx [--json f] [--push f] [--quiet]  |  node cli.js parts [--json]  |  node cli.js sim build.knx  |  node cli.js span a b  |  node cli.js spring  |  node cli.js arc  |  node cli.js render b.knx out.svg  |  node cli.js instructions b.knx  |  node cli.js view [b.knx]  |  node cli.js shot b.knx out.png  |  node cli.js ports b.knx  |  node cli.js props  |  node cli.js bridge b.knx A B  |  node cli.js reach b.knx  |  node cli.js ik b.knx --target x,y,z  |  node cli.js live [b.knx] --open  |  node cli.js log \"...\"  |  node cli.js replay run.jsonl"); process.exit(2); }
var text = fs.readFileSync(file, "utf8"), s = KNEX.build(text), quiet = args.indexOf("--quiet") >= 0;
function opt(flag) { var i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; }
console.log((s.title || file) + ": " + s.conns.length + " connectors, " + s.rods.length + " rods, " + s.spacers.length + " spacers | joints end " + s.jointCounts.end + " side " + s.jointCounts.side + " hole " + s.jointCounts.hole + " | ~" + s.mass_g + " g");
console.log("parts: " + Object.keys(s.parts).sort().map(function (k) { return k + "=" + s.parts[k]; }).join(" "));
if (!quiet) s.issues.forEach(function (i) { console.log((i.level === "error" ? "ERR " : "warn") + (i.line ? " L" + i.line : "") + ": " + i.msg); });
console.log(s.errors + " errors, " + s.warnings + " warnings");
if (opt("--json")) fs.writeFileSync(opt("--json"), JSON.stringify(KNEX.toJSON(s), null, 0));
if (opt("--push")) fs.writeFileSync(opt("--push"), JSON.stringify({ knx: text, name: path.basename(file), updated: new Date().toISOString(), errors: s.errors, warnings: s.warnings }));
process.exit(s.errors ? 1 : 0);
