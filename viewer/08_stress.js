<script>
/* Stress view: colour what the physics actually knows — compliant rods and joints — and say so. */
var STRESS = { on: false };
function heat(u) {                                   // 0 = slack, 1 = at the estimated limit
  u = Math.max(0, Math.min(1.3, u));
  var stops = [[0.00, [42, 108, 182]], [0.35, [46, 158, 79]], [0.7, [242, 197, 29]], [1.0, [217, 48, 44]], [1.3, [120, 20, 20]]];
  for (var i = 1; i < stops.length; i++) if (u <= stops[i][0]) {
    var a = stops[i - 1], b = stops[i], t = (u - a[0]) / (b[0] - a[0]);
    return new THREE.Color((a[1][0] + t * (b[1][0] - a[1][0])) / 255, (a[1][1] + t * (b[1][1] - a[1][1])) / 255, (a[1][2] + t * (b[1][2] - a[1][2])) / 255);
  }
  return new THREE.Color(0.47, 0.08, 0.08);
}
function stressApply() {
  if (!PHYS.W) return;
  var D = KNEX.DIMS;
  PHYS.W.beams.forEach(function (bm) {
    var mesh = null; for (var k in BEAMMESH) if (BEAMMESH[k].rod.id === bm.rod) mesh = BEAMMESH[k];
    if (!mesh) return;
    if (!STRESS.on) { mesh.mesh.material = mat(mesh.hex); return; }
    var u = Math.max(Math.abs(bm.F) / D.socketPull, (bm.Flat || 0) / D.socketPry, (bm.Mbend || 0) * 1000 / D.socketMoment);
    mesh.mesh.material = new THREE.MeshStandardMaterial({ color: heat(u), roughness: 0.5 });
    mesh.util = u;
  });
  /* Joints and, on a rigid model, the parts themselves. A triangulated frame welds into one body, so
     its rods are not force elements and have no force of their own to show: what IS known is the load
     in the bearings on that body's edge. Colouring the parts by it means a rigid build shows
     something true rather than nothing at all. Per-member forces inside a welded group need the
     finite-element pass; until then this is the honest approximation, and the legend says so. */
  var byBody = {};
  PHYS.W.joints.forEach(function (j) {
    var u = j.load / D.socketPull;
    byBody[j.A.id] = Math.max(byBody[j.A.id] || 0, u);
    byBody[j.B.id] = Math.max(byBody[j.B.id] || 0, u);
  });
  world.traverse(function (o) {
    if (!o.userData || !o.isMesh) return;
    var t = o.userData.type;
    if (t !== "joint" && t !== "conn" && t !== "rod" && t !== "spacer") return;
    if (o.userData.beamMesh) return;                        // compliant rods are coloured above
    if (!STRESS.on) { if (o.userData.m0) { o.material = o.userData.m0; o.userData.m0 = null; } return; }
    var u = byBody[o.userData.body] || 0;
    if (!o.userData.m0) o.userData.m0 = o.material;
    o.material = t === "joint" ? new THREE.MeshBasicMaterial({ color: heat(u) })
                               : new THREE.MeshStandardMaterial({ color: heat(u), roughness: 0.5 });
  });
}
</script>
