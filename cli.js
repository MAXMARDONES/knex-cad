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
if (file === "live") {                                   // hot-reloading bench with a session feed
  require(path.join(__dirname, "scripts", "live.js"))(args);
  return;
}
if (file === "log") {                                    // post to a running live server
  var http = require("http");
  var pos = args.filter(function (a) { return !isOpt(a); });
  var text = pos.slice(1).join(" ");
  function o(f, d) { var i = args.indexOf(f); return i >= 0 ? args[i + 1] : d; }
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
if (!file) { console.error("usage: node cli.js build.knx [--json f] [--push f] [--quiet]  |  node cli.js parts [--json]  |  node cli.js sim build.knx  |  node cli.js span a b  |  node cli.js spring  |  node cli.js arc  |  node cli.js render b.knx out.svg  |  node cli.js instructions b.knx  |  node cli.js view [b.knx]  |  node cli.js shot b.knx out.png  |  node cli.js ports b.knx  |  node cli.js live [b.knx] --open  |  node cli.js log \"...\""); process.exit(2); }
var text = fs.readFileSync(file, "utf8"), s = KNEX.build(text), quiet = args.indexOf("--quiet") >= 0;
function opt(flag) { var i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; }
console.log((s.title || file) + ": " + s.conns.length + " connectors, " + s.rods.length + " rods, " + s.spacers.length + " spacers | joints end " + s.jointCounts.end + " side " + s.jointCounts.side + " hole " + s.jointCounts.hole + " | ~" + s.mass_g + " g");
console.log("parts: " + Object.keys(s.parts).sort().map(function (k) { return k + "=" + s.parts[k]; }).join(" "));
if (!quiet) s.issues.forEach(function (i) { console.log((i.level === "error" ? "ERR " : "warn") + (i.line ? " L" + i.line : "") + ": " + i.msg); });
console.log(s.errors + " errors, " + s.warnings + " warnings");
if (opt("--json")) fs.writeFileSync(opt("--json"), JSON.stringify(KNEX.toJSON(s), null, 0));
if (opt("--push")) fs.writeFileSync(opt("--push"), JSON.stringify({ knx: text, name: path.basename(file), updated: new Date().toISOString(), errors: s.errors, warnings: s.warnings }));
process.exit(s.errors ? 1 : 0);
