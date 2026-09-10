<script>
/* Camera presets, keyboard shortcuts, and a panel listing every body and prop with what it weighs. */
var VIEWS2 = { iso: [0.75, 1.05], front: [0, 1.5708], right: [1.5708, 1.5708], top: [0.75, 0.02], low: [0.6, 1.35] };
function setView(name) {
  var v = VIEWS2[name]; if (!v) return;
  CAM.theta = v[0]; CAM.phi = v[1]; flyTo = null;
  if (window.fitAll) fitAll();
  Array.prototype.forEach.call(document.querySelectorAll("#camBar button.v"), function (b) {
    b.classList.toggle("on", b.dataset.view === name);
  });
}
function camReadout() {
  var el = document.getElementById("camRead"); if (!el) return;
  el.textContent = (CAM.theta * 57.2958).toFixed(0) + "° / " + (CAM.phi * 57.2958).toFixed(0) + "°  " + CAM.r.toFixed(0) + "mm";
}
function bodyTables() {
  if (!MODEL) return;
  var bodies = MODEL.bodies || [], rows = [], props = [];
  var counts = {};
  (MODEL.conns || []).forEach(function (c) { (counts[c.body] = counts[c.body] || { c: 0, r: 0 }).c++; });
  (MODEL.rods || []).forEach(function (r) { (counts[r.body] = counts[r.body] || { c: 0, r: 0 }).r++; });
  bodies.forEach(function (b) {
    var live = PHYS.W && PHYS.W.bodies[b.id];
    var what = b.prop ? "<span class='tag prop'>" + b.prop + "</span>" :
               (live && live.fixed) ? "<span class='tag fixed'>held</span>" : "<span class='tag'>free</span>";
    var n = counts[b.id] || { c: 0, r: 0 };
    (b.prop ? props : rows).push(
      "<tr class='clickable' data-body='" + b.id + "'><td>" + what + "</td>" +
      "<td>" + (b.prop ? "" : n.c + " conn, " + n.r + " rods") + "</td>" +
      "<td class='n'>" + b.m.toFixed(0) + " g</td></tr>");
  });
  document.getElementById("bodyTable").innerHTML =
    "<tr><th>body</th><th>made of</th><th class=n>mass</th></tr>" + (rows.join("") || "<tr><td colspan=3>nothing moves</td></tr>");
  document.getElementById("propTable").innerHTML = props.length
    ? "<tr><th>prop</th><th></th><th class=n>mass</th></tr>" + props.join("")
    : "<tr><td>no props. Add one: <code>X phone 0,0,3</code></td></tr>";
  Array.prototype.forEach.call(document.querySelectorAll("#bodyTable tr.clickable, #propTable tr.clickable"), function (tr) {
    tr.addEventListener("click", function () { flyToBody(Number(tr.dataset.body)); });
  });
}
function flyToBody(id) {
  var g = BODYG[id];
  var box = new THREE.Box3();
  if (g) box.setFromObject(g);
  else {
    var m = PARTS.filter(function (p) { return p.userData.body === id; })[0];
    if (m) box.setFromObject(m); else return;
  }
  flyTo = box.getCenter(new THREE.Vector3());
  CAM.r = Math.max(200, box.getSize(new THREE.Vector3()).length() * 2.2);
}
(function () {
  Array.prototype.forEach.call(document.querySelectorAll("#camBar button.v"), function (b) {
    b.addEventListener("click", function () { setView(b.dataset.view); });
  });
  document.getElementById("camFit").addEventListener("click", function () { if (window.fitAll) { flyTo = null; fitAll(); } });
  document.addEventListener("keydown", function (e) {
    if (/input|textarea|select/i.test((e.target.tagName || ""))) return;
    var k = e.key.toLowerCase(), names = ["iso", "front", "right", "top", "low"];
    if (k >= "1" && k <= "5") setView(names[Number(k) - 1]);
    else if (k === "f") { flyTo = null; if (window.fitAll) fitAll(); }
    else if (k === " ") { e.preventDefault(); document.getElementById("physRun").click(); }
    else if (k === "r") document.getElementById("physReset").click();
    else if (k === "s") document.getElementById("optStress").click();
    else if (k === "h") document.getElementById("optHands").click();
    else if (k === "[") { var el = document.getElementById("step"); el.value = Math.max(0, Number(el.value) - 1); el.dispatchEvent(new Event("input")); }
    else if (k === "]") { var e2 = document.getElementById("step"); e2.value = Math.min(Number(e2.max), Number(e2.value) + 1); e2.dispatchEvent(new Event("input")); }
  });
  setInterval(camReadout, 250);
})();
</script>
