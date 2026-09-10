#!/usr/bin/env node
/* knex-cad live — a local server that hot-reloads the model and shows what an agent is doing.
   No dependencies: node's own http, fs and a Server-Sent Events stream.

     node cli.js live [build.knx] [--port 8730] [--open]

   It serves the bench, watches the build and the engine, recompiles on change, and pushes:
     build   the model recompiled, so the page redraws without reloading
     engine  the engine changed, so the page reloads
     log     something an agent said, did, or looked at
   Anything can post to it:  node cli.js log "text" [--kind reasoning|tool|file|note] [--image f] */
var http = require("http"), fs = require("fs"), path = require("path"), cp = require("child_process");
var ROOT = path.join(__dirname, "..");
var KNEX = require(path.join(ROOT, "dist", "knex.js"));

module.exports = function live(args) {
  function opt(f, d) { var i = args.indexOf(f); return i >= 0 ? args[i + 1] : d; }
  var build = args.filter(function (a) { return a.slice(0, 2) !== "--"; })[1] || "builds/rig.knx";
  if (!path.isAbsolute(build)) build = path.resolve(process.cwd(), build);
  var port = Number(opt("--port", 8730));
  var clients = [], events = [], seq = 0;

  function send(kind, data) {
    var ev = { id: ++seq, t: Date.now(), kind: kind, data: data };
    events.push(ev); if (events.length > 400) events.shift();
    var line = "id: " + ev.id + "\ndata: " + JSON.stringify(ev) + "\n\n";
    clients.forEach(function (c) { try { c.write(line); } catch (e) {} });
    return ev;
  }
  function compile() {
    try {
      var text = fs.readFileSync(build, "utf8");
      var s = KNEX.build(text);
      var payload = KNEX.toJSON(s);
      send("build", { file: path.relative(ROOT, build), knx: text, errors: s.errors, warnings: s.warnings,
                      title: s.title, conns: s.conns.length, rods: s.rods.length,
                      issues: s.issues.slice(0, 40), model: payload });
      return s;
    } catch (e) { send("log", { kind: "error", text: "compile failed: " + e.message }); return null; }
  }
  function rebuildViewer() {
    try { cp.execFileSync(path.join(ROOT, "build_viewer.sh"), [build], { cwd: ROOT, stdio: "pipe" }); send("engine", {}); }
    catch (e) { send("log", { kind: "error", text: "viewer build failed: " + String(e.stdout || e.message).slice(-400) }); }
  }
  // ---- watch
  var pending = null;
  function debounce(fn) { clearTimeout(pending); pending = setTimeout(fn, 120); }
  try {
    fs.watch(path.dirname(build), function (ev, f) {
      if (f && path.resolve(path.dirname(build), f) === build) debounce(function () {
        var s = compile();
        if (s) send("log", { kind: "file", text: path.basename(build) + " changed: " + s.conns.length + " connectors, " + s.rods.length + " rods, " + s.errors + " errors" });
      });
    });
    fs.watch(path.join(ROOT, "engine"), function () { debounce(rebuildViewer); });
    fs.watch(path.join(ROOT, "viewer"), function () { debounce(rebuildViewer); });
  } catch (e) { console.log("watch unavailable: " + e.message); }

  // ---- server
  var MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png",
               ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".json": "application/json", ".knx": "text/plain", ".md": "text/plain" };
  var srv = http.createServer(function (req, res) {
    var u = req.url.split("?")[0];
    if (u === "/events") {
      res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive", "Access-Control-Allow-Origin": "*" });
      res.write("retry: 1000\n\n");
      events.slice(-80).forEach(function (ev) { res.write("id: " + ev.id + "\ndata: " + JSON.stringify(ev) + "\n\n"); });
      clients.push(res);
      req.on("close", function () { clients = clients.filter(function (c) { return c !== res; }); });
      return;
    }
    if (u === "/log" && req.method === "POST") {
      var body = "";
      req.on("data", function (d) { body += d; if (body.length > 4e6) req.destroy(); });
      req.on("end", function () {
        var j; try { j = JSON.parse(body); } catch (e) { j = { kind: "note", text: body }; }
        var ev = send("log", j);
        res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify({ ok: true, id: ev.id }));
      });
      return;
    }
    if (u === "/build" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "text/plain" }); res.end(fs.readFileSync(build, "utf8")); return;
    }
    if (u === "/build" && req.method === "POST") {                       // edit the model from the page
      var b2 = ""; req.on("data", function (d) { b2 += d; });
      req.on("end", function () { fs.writeFileSync(build, b2); res.writeHead(200); res.end("ok"); });
      return;
    }
    var file = u === "/" ? "/docs/viewer.html" : u;
    var p = path.join(ROOT, decodeURIComponent(file).replace(/^\/+/, ""));
    if (p.indexOf(ROOT) !== 0 || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end("not found"); return; }
    res.writeHead(200, { "Content-Type": MIME[path.extname(p)] || "application/octet-stream", "Cache-Control": "no-store" });
    fs.createReadStream(p).pipe(res);
  });
  srv.listen(port, function () {
    console.log("knex-cad live");
    console.log("  bench    http://localhost:" + port + "/");
    console.log("  watching " + path.relative(ROOT, build) + ", engine/ and viewer/");
    console.log("  post to  http://localhost:" + port + "/log     (node cli.js log ...)");
    compile();
    if (args.indexOf("--open") >= 0) { try { cp.execFileSync(process.platform === "darwin" ? "open" : "xdg-open", ["http://localhost:" + port + "/"], { stdio: "ignore" }); } catch (e) {} }
  });
  return srv;
};
