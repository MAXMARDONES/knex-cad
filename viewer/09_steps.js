<script>
/* Procedural build instructions: what each step adds, and a camera that frames it. */
function stepParts(step) {
  var count = {};
  (MODEL.conns || []).forEach(function (K) { if (K.step === step) count[K.kind] = (count[K.kind] || 0) + 1; });
  (MODEL.rods || []).forEach(function (R) { if (R.step === step) { var k = (R.flexi ? "flexi-" : "") + R.color; count[k] = (count[k] || 0) + 1; } });
  (MODEL.spacers || []).forEach(function (P) { if (P.step === step) count["spacer-" + P.size] = (count["spacer-" + P.size] || 0) + 1; });
  return count;
}
function stepBox(step) {
  var box = new THREE.Box3(), any = false;
  world.traverse(function (o) {
    if (!o.userData || o.userData.step !== step || !o.geometry) return;
    box.expandByObject(o); any = true;
  });
  return any ? box : null;
}
function showStep(v) {
  var n = MODEL.steps ? MODEL.steps.length : 0, el = document.getElementById("stepInfo");
  if (!el) return;
  if (v >= n || v === 0) {
    el.innerHTML = v === 0 ? "<b>Nothing placed yet.</b> Drag the slider to build it up one step at a time."
      : "<b>Complete.</b> " + n + " steps, " + (MODEL.conns || []).length + " connectors, " + (MODEL.rods || []).length + " rods.";
    return;
  }
  var st = MODEL.steps[v - 1], parts = stepParts(v - 1);
  var rows = Object.keys(parts).sort().map(function (k) {
    var col = KNEX.KINDS[k] ? KNEX.RGB[KNEX.KINDS[k].color] : KNEX.RGB[k.replace("flexi-", "").replace("spacer-", "")] || "#888";
    return "<span class='sw' style='background:" + col + "'></span>" + parts[k] + " x " + k;
  });
  el.innerHTML = "<b>Step " + v + " of " + n + ": " + st.title + "</b><div style='margin-top:4px'>" + (rows.join(" &nbsp; ") || "no new parts") + "</div>";
  var box = stepBox(v - 1);
  if (box && document.getElementById("optFollow").checked) {
    flyTo = box.getCenter(new THREE.Vector3());
    var size = box.getSize(new THREE.Vector3()).length();
    CAM.r = Math.max(220, size * 2.4);
    CAM.theta = 0.6 + v * 0.22;                       // walk around the model as the build goes up
    CAM.phi = 1.15 - Math.min(0.45, v * 0.03);
  }
}
</script>
