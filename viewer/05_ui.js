<script>
/* Panels, editor, live document. The shared build lives in db doc builds/current {knx, name, updated}. */
var $ = function (id) { return document.getElementById(id); }, CURRENT = "";
function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
function render(text, source) {
  CURRENT = text; var s = KNEX.build(text), j = KNEX.toJSON(s);
  $("title").textContent = s.title || "K'NEX Rig Bench";
  $("pcount").textContent = s.conns.length + " conn · " + s.rods.length + " rods" + (s.spacers.length ? " · " + s.spacers.length + " spacers" : "");
  $("pmass").textContent = "~" + s.mass_g + " g";
  var pi = $("pissues"); pi.textContent = s.errors ? s.errors + " errors · " + s.warnings + " warn" : s.warnings ? s.warnings + " warnings" : "builds clean";
  pi.className = "pill " + (s.errors ? "err" : s.warnings ? "warn" : "ok");
  $("issues").innerHTML = s.issues.length ? s.issues.map(function (i) { return '<div class="issue ' + i.level + '" data-line="' + (i.line || 0) + '"><b>' + (i.line ? "L" + i.line : "") + "</b>" + esc(i.msg) + "</div>"; }).join("") : '<div class="note">No issues. Every rod is a real K\'NEX length and every joint is a socket, a side-clip or a hub.</div>';
  Array.prototype.forEach.call($("issues").querySelectorAll(".issue"), function (el) { el.addEventListener("click", function () { focusLine(Number(el.dataset.line)); }); });
  var kinds = Object.keys(s.parts).sort(function (a, b) { return (KNEX.KINDS[a] ? 0 : 1) - (KNEX.KINDS[b] ? 0 : 1) || a.localeCompare(b); });
  $("parts").innerHTML = "<tr><th>part</th><th></th><th class=n>qty</th><th class=n>have</th></tr>" + kinds.map(function (k) {
    var col = KNEX.KINDS[k] ? KNEX.RGB[KNEX.KINDS[k].color] : KNEX.RGB[k.replace("flexi-", "").replace("spacer-", "")] || "#888";
    var have = s.inventory[k] != null ? s.inventory[k] : "";
    return "<tr><td><span class=sw style='background:" + col + "'></span>" + esc(k) + "</td><td>" + (KNEX.KINDS[k] ? KNEX.KINDS[k].name : KNEX.ladder(k.replace("flexi-", "")) ? KNEX.ladder(k.replace("flexi-", "")).len + " mm" : "") + "</td><td class=n>" + s.parts[k] + "</td><td class=n" + (have !== "" && have < s.parts[k] ? " style='color:var(--err)'" : "") + ">" + have + "</td></tr>"; }).join("");
  $("stiff").innerHTML = "<tr><th>rod</th><th class=n>len</th><th class=n>k std N/mm</th><th class=n>k flexi</th></tr>" + KNEX.LADDER.map(function (l) { var t = s.stiffness[l.color]; return "<tr><td><span class=sw style='background:" + KNEX.RGB[l.color] + "'></span>" + l.color + "</td><td class=n>" + l.len + "</td><td class=n>" + t.k_std.toFixed(2) + "</td><td class=n>" + (KNEX.FLEXI[l.color] ? t.k_flexi.toFixed(2) : "—") + "</td></tr>"; }).join("");
  $("joints").textContent = "joints: " + s.jointCounts.end + " end-on (rigid) · " + s.jointCounts.side + " side-on (pivot w/ friction) · " + s.jointCounts.hole + " hub (free axle)";
  var st = $("step"); st.max = s.steps.length; if (source !== "editor") st.value = s.steps.length; stepLabel(s);
  if (document.activeElement !== $("knx")) $("knx").value = text;
  rebuild(j, source !== "editor");
  PHYS.solved = s; PHYS.running = false; PHYS.press = {};
  var rb = $("physRun"); if (rb) rb.textContent = "Run";
  if (window.physLoadButtons) physLoadButtons(s.loads || []);
  physBuild();
  showStep(Number($("step").value));
}
function stepLabel(s) { var v = Number($("step").value), n = s ? s.steps.length : Number($("step").max); $("stepname").textContent = v >= n ? "complete (" + n + " steps)" : v === 0 ? "nothing placed" : (v + "/" + n + " " + (MODEL && MODEL.steps[v - 1] ? MODEL.steps[v - 1].title : "")); }
$("step").addEventListener("input", function () { stepLabel(null); applyFilters(); showStep(Number($("step").value)); });
$("optHands").addEventListener("change", function () { if (window.handsStart) handsStart(); });
$("liveClear").addEventListener("click", function () { LIVE.log = []; $("liveLog").innerHTML = ""; $("liveCount").textContent = "0"; });
$("shotBtn").addEventListener("click", function () {
  var w = canvas.clientWidth, h = canvas.clientHeight, scale = 2;          // render at 2x, then restore
  renderer.setSize(w * scale, h * scale, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  updateCamera(); renderer.render(scene, camera);
  var url = canvas.toDataURL("image/png");
  renderer.setSize(w, h, false); camera.updateProjectionMatrix(); updateCamera(); renderer.render(scene, camera);
  var a = document.createElement("a");
  a.download = ((MODEL && MODEL.title) || "knex").replace(/[^\w-]+/g, "-").toLowerCase() + "-" + Date.now() + ".png";
  a.href = url; a.click();
  if (window.toast) toast("saved " + a.download);
});
$("optStress").addEventListener("change", function (e) {
  STRESS.on = e.target.checked; $("legend").classList.toggle("on", STRESS.on); stressApply();
});
["optJoints", "optLabels", "optProps"].forEach(function (id) { $(id).addEventListener("change", applyFilters); });
Array.prototype.forEach.call(document.querySelectorAll(".tabs button"), function (b) { b.addEventListener("click", function () {
  document.querySelectorAll(".tabs button").forEach(function (x) { x.setAttribute("aria-selected", x === b); });
  document.querySelectorAll(".panel").forEach(function (p) { p.classList.toggle("on", p.id === "tab-" + b.dataset.tab); }); }); });
$("apply").addEventListener("click", function () { render($("knx").value, "editor"); });
$("knx").addEventListener("keydown", function (e) { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") $("apply").click(); });
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme);
new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
applyTheme();
try { render(EMBEDDED_KNX, "embedded"); }
catch (err) {                                        // never let a model problem freeze the bench
  console.error(err);
  var b = document.createElement("div");
  b.style.cssText = "position:absolute;left:12px;top:12px;z-index:9;background:var(--err);color:#fff;padding:10px 14px;border-radius:8px;font:13px var(--mono);max-width:70%";
  b.textContent = "The build failed to load: " + err.message + " — the camera still works; check the console.";
  document.getElementById("stage").appendChild(b);
}
animate();                                           // always: the camera must keep working
if (window.liveInit) liveInit();
setTimeout(function () { if (window.toast) toast("drag any part to push it \u00b7 drag the background to orbit \u00b7 shift-drag to pan"); }, 700);
if (window.liveInit) liveInit();
setTimeout(function () { if (window.toast) toast("drag any part to push it · drag the background to orbit · shift-drag to pan"); }, 700);
// ---- live shared document (written from Claude Code with write_db, or saved from this page)
(function live() {
  if (!window.claude || !window.claude.use) return;
  window.claude.use("db").then(function (db) {
    if (!db) return;
    var ref = db.doc("builds/current");
    $("save").hidden = false;
    $("save").addEventListener("click", function () {
      ref.set({ knx: $("knx").value, name: "viewer", updated: new Date().toISOString() }).then(function () { $("savemsg").textContent = "Saved"; setTimeout(function () { $("savemsg").textContent = ""; }, 2000); },
        function (e) { $("savemsg").textContent = "Could not save (" + e.code + ")"; });
    });
    ref.onSnapshot(function (snap) {
      var d = snap.data(); $("live").className = "live on"; $("livetxt").textContent = snap.exists ? "live · " + (d.name || "shared build") : "live · waiting for a build";
      if (snap.exists && typeof d.knx === "string" && d.knx !== CURRENT) { render(d.knx, "live"); $("updated").textContent = d.updated ? "updated " + new Date(d.updated).toLocaleTimeString() : ""; }
    }, function (e) { $("livetxt").textContent = "live feed stopped (" + e.code + ")"; $("live").className = "live"; });
  });
})();
</script>
