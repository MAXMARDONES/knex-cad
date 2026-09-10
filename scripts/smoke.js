#!/usr/bin/env node
/* Run the built viewer's code for real, in Node, with a stubbed browser. Catches the errors that
   syntax checking cannot: undefined state, wrong load order, a throw that would freeze the page.
   node scripts/smoke.js [docs/viewer.html] */
var fs = require("fs"), path = require("path"), vm = require("vm");
var file = process.argv[2] || path.join(__dirname, "..", "docs", "viewer.html");
var html = fs.readFileSync(file, "utf8");
var scripts = [];
html.replace(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g, function (m, body, i) { if (body.trim()) scripts.push(body); return m; });

// ---- a browser, roughly
function el(id) {
  var e = { id: id, style: {}, dataset: {}, children: [], classList: { add: F, remove: F, toggle: F, contains: function () { return false; } },
    value: id === "step" ? "99" : "1", max: "99", checked: id === "optJoints" || id === "optProps" || id === "optFollow" || id === "optDrag",
    textContent: "", innerHTML: "", hidden: false, rows: [], clientWidth: 1200, clientHeight: 800, width: 1200, height: 800,
    addEventListener: F, removeEventListener: F, appendChild: function (c) { this.children.push(c); return c; },
    setAttribute: F, getAttribute: function () { return null; }, querySelectorAll: function () { return []; },
    getBoundingClientRect: function () { return { left: 0, top: 0, width: 1200, height: 800 }; },
    getContext: function () { return ctx2d; }, setPointerCapture: F, focus: F };
  return e;
}
function F() {}
var ctx2d = { font: "", fillStyle: "", globalAlpha: 1, textAlign: "", textBaseline: "", fillRect: F, fillText: F, clearRect: F };
var els = {};
var document = {
  getElementById: function (id) { return els[id] || (els[id] = el(id)); },
  createElement: function (t) { return el(t); },
  querySelectorAll: function () { return []; },
  documentElement: { style: { setProperty: F }, classList: { add: F } },
  addEventListener: F, body: el("body")
};
var counts = { warn: 0 };
var sandbox = {
  THREE: require("./three_stub.js"), document: document, console: {
    log: F, warn: function () { counts.warn++; counts.lastWarn = Array.prototype.join.call(arguments, " "); },
    error: function () { counts.warn++; counts.lastWarn = Array.prototype.join.call(arguments, " "); }
  },
  window: {}, location: { search: "" }, performance: { now: function () { return Date.now(); } },
  requestAnimationFrame: F, setTimeout: function (f) { try { f(); } catch (e) { throw e; } }, clearTimeout: F,
  setInterval: function (f) { return 0; }, clearInterval: F, Math: Math, JSON: JSON, Date: Date, isFinite: isFinite,
  parseFloat: parseFloat, parseInt: parseInt, Number: Number, String: String, Array: Array, Object: Object, Map: Map,
  Error: Error, TypeError: TypeError, decodeURIComponent: decodeURIComponent, encodeURIComponent: encodeURIComponent,
  getComputedStyle: function () { return { getPropertyValue: function () { return "#123456"; } }; },
  matchMedia: function () { return { addEventListener: F, matches: false }; },
  MutationObserver: function () { this.observe = F; }
};
sandbox.window = sandbox; sandbox.globalThis = sandbox;
var ctx = vm.createContext(sandbox);

var failed = 0;
scripts.forEach(function (src, i) {
  var label = "script " + (i + 1) + "/" + scripts.length + " (" + src.trim().split("\n")[0].slice(0, 52).replace(/\s+/g, " ") + ")";
  try { vm.runInContext(src, ctx, { timeout: 20000 }); }
  catch (e) { failed++; console.error("  FAIL  " + label + "\n        " + e.message + "\n        " + (e.stack || "").split("\n")[1]); }
});

// ---- now exercise the things a user actually does
function step(name, fn) {
  try { fn(); console.log("  ok    " + name); }
  catch (e) { failed++; console.error("  FAIL  " + name + "\n        " + e.message + "\n        " + (e.stack || "").split("\n").slice(1, 3).join("\n        ")); }
}
console.log("viewer smoke test: " + path.relative(process.cwd(), file));
step("the model loaded and built bodies", function () {
  if (!ctx.MODEL) throw new Error("MODEL was never set: render() did not finish. " + (counts.lastWarn || ""));
  if (!ctx.MODEL.conns.length) throw new Error("no connectors in the model");
  if (counts.warn) throw new Error("render() logged: " + counts.lastWarn);
});
step("the physics world built", function () {
  counts.warn = 0;
  if (!ctx.PHYS) throw new Error("PHYS is missing entirely");
  if (!ctx.PHYS.W) { try { ctx.physBuild(); } catch (e) { throw new Error("physBuild() threw: " + e.message); } }
  if (!ctx.PHYS.W) throw new Error("physBuild() ran but produced no world. " + (counts.lastWarn || ""));
});
step("body transforms apply before any step", function () { ctx.physApply(); if (counts.warn) throw new Error(counts.lastWarn); });
step("the physics steps", function () {
  ctx.PHYS.running = true; counts.warn = 0;
  for (var i = 0; i < 40; i++) ctx.KNEX.phys.step(ctx.PHYS.W, ctx.PHYS.dt, {});
  ctx.physApply(); if (counts.warn) throw new Error(counts.lastWarn);
});
step("bending rods reshape", function () { counts.warn = 0; ctx.beamsApply(); if (counts.warn) throw new Error(counts.lastWarn); });
step("the stress view applies", function () { ctx.STRESS.on = true; ctx.stressApply(); ctx.STRESS.on = false; });
step("the readout renders", function () { ctx.physReadout(); });
step("every build step draws, and hides the later ones", function () {
  var el = ctx.document.getElementById("step"), n = ctx.MODEL.steps.length;
  function visible() { var k = 0; ctx.PARTS.forEach(function (p) { if (p.visible) k++; }); return k; }
  el.max = String(n);
  el.value = String(n); ctx.applyFilters(); var all = visible();
  var prev = 0;
  for (var v = 1; v <= n; v++) {
    el.value = String(v); ctx.applyFilters(); ctx.showStep(v);
    var k = visible(), late = 0;
    ctx.PARTS.forEach(function (p) { if (p.visible && p.userData && p.userData.step != null && p.userData.step > v - 1) late++; });
    if (late) throw new Error("step " + v + " leaves " + late + " part(s) from later steps visible");
    if (k < prev) throw new Error("step " + v + " shows fewer parts than step " + (v - 1));
    prev = k;
  }
  if (prev !== all) throw new Error("the last step does not show the whole model");
  if (n > 1) {                                            // a one-step build shows everything at step 1, correctly
    el.value = String(1); ctx.applyFilters();
    if (visible() >= all) throw new Error("step 1 shows the whole model: the step filter is not hiding anything");
  }
  el.value = String(n); ctx.applyFilters();
});
step("the animation frame runs", function () { ctx.animate(); });
step("declared forces are pressable", function () {
  var loads = ctx.PHYS.W.loads;
  if (!loads.length) return;
  loads[0].gain = 1;
  for (var i = 0; i < 40; i++) ctx.KNEX.phys.step(ctx.PHYS.W, ctx.PHYS.dt, {});
  ctx.PHYS.W.bodies.forEach(function (b, i) {
    if (!isFinite(b.x[0]) || !isFinite(b.x[1]) || !isFinite(b.x[2])) throw new Error("body " + i + " went non-finite under load");
  });
});
step("the camera presets and the body panel work", function () {
  ctx.setView("front"); ctx.setView("top"); ctx.setView("iso");
  ctx.camReadout();
  ctx.bodyTables();
  var html = ctx.document.getElementById("bodyTable").innerHTML;
  if (!html || html.indexOf("<tr") < 0) throw new Error("the body panel drew nothing");
  ctx.flyToBody(0);
});
step("hand tracking degrades where there is no camera", function () {
  if (typeof ctx.handsStart !== "function") throw new Error("hand tracking did not load");
  ctx.handsStop();                                       // must be safe with no camera and no panel
  ctx.handsDraw();
  if (ctx.HANDS.on) throw new Error("hand tracking claims to be running without a camera");
});
step("the session feed renders", function () {
  ctx.liveInit();                                        // no port in the stub: must be a safe no-op
  ctx.liveAdd({ kind: "reasoning", text: "a note" }, Date.now());
  ctx.liveAdd({ kind: "image", text: "a picture", image: "data:image/png;base64,iVBORw0KGgo=" }, Date.now());
  ctx.liveAdd({ kind: "build", text: "recompiled" }, Date.now());
  if (ctx.LIVE.log.length !== 3) throw new Error("the feed did not record the events");
});
step("a grab pulls, and two hands pull at once", function () {
  var free = ctx.PHYS.W.bodies.filter(function (x) { return !x.fixed; });
  if (!free.length) return;                              // a build with nothing that moves: nothing to grab
  var b = free[0];
  ctx.grabAt(b, [b.x[0], b.x[1], b.x[2]], "mouse");
  ctx.GRABS[0].target = [b.x[0] + 0.02, b.x[1], b.x[2]];
  var inp = ctx.dragInput();
  if (!inp.loads || !inp.loads.length) throw new Error("a grab produced no load");
  if (!isFinite(inp.loads[0].F[0])) throw new Error("the pull force is not finite");
  var b2 = free[1] || b;
  ctx.grabAt(b2, [b2.x[0], b2.x[1], b2.x[2]], "left");
  ctx.GRABS[ctx.GRABS.length - 1].twist = 0.4;           // a wrist roll becomes a torque
  var inp2 = ctx.dragInput();
  if (inp2.loads.length < 2) throw new Error("a second hand did not add a grab");
  if (!inp2.loads.some(function (l) { return l.torque; })) throw new Error("the twist produced no torque");
  for (var i = 0; i < 40; i++) ctx.KNEX.phys.step(ctx.PHYS.W, ctx.PHYS.dt, ctx.dragInput());
  ctx.PHYS.W.bodies.forEach(function (x, i) { if (!isFinite(x.x[0])) throw new Error("body " + i + " went non-finite while grabbed"); });
  ctx.grabRelease("left"); ctx.dragEnd();
  if (ctx.GRABS.length) throw new Error("releasing did not clear the grabs");
});
console.log(failed ? "\n" + failed + " failure(s)" : "\nall clear");
process.exit(failed ? 1 : 0);
