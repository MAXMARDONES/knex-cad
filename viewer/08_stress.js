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
  world.traverse(function (o) {
    if (!o.userData || o.userData.type !== "joint") return;
    if (!STRESS.on) { if (o.userData.m0) o.material = o.userData.m0; return; }
    var body = o.userData.body, best = 0;
    PHYS.W.joints.forEach(function (j) { if (j.A.id === body || j.B.id === body) best = Math.max(best, j.load / D.socketPull); });
    if (!o.userData.m0) o.userData.m0 = o.material;
    o.material = new THREE.MeshBasicMaterial({ color: heat(best) });
  });
}
</script>
