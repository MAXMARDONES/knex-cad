<script>
/* Push the model with the cursor: drag any part and a force is applied there, live.
   The grab point is tracked in the body's own frame, so it stays on the part as it moves. */
var DRAG = { on: false, body: null, local: null, target: null, force: [0, 0, 0], arrow: null, N: 0 };
var DRAG_K = 90;                                        // N per metre of pull; the cap keeps it sane
var DRAG_MAX = 25;
function dragInput() {
  if (!DRAG.on || !DRAG.body || DRAG.body.fixed) return {};
  var V = KNEX.V, P = KNEX.phys;
  var grab = V.add(DRAG.body.x, P.qrot(DRAG.body.q, DRAG.local));
  var pull = V.sub(DRAG.target, grab), d = V.norm(pull);
  var F = d > 1e-6 ? V.mul(pull, Math.min(DRAG_MAX, DRAG_K * d) / d) : [0, 0, 0];
  DRAG.force = F; DRAG.N = V.norm(F); DRAG.grab = grab;
  return { loads: [{ body: DRAG.body, at: grab, F: F, world: true, gain: 1 }] };
}
function dragArrow() {
  if (!DRAG.arrow) {
    DRAG.arrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 1, 0xE8531A, 14, 8);
    DRAG.arrow.visible = false; scene.add(DRAG.arrow);
  }
  if (!DRAG.on || !DRAG.grab) { DRAG.arrow.visible = false; return; }
  var a = new THREE.Vector3(DRAG.grab[0] * 1000, DRAG.grab[2] * 1000, -DRAG.grab[1] * 1000);
  var b = new THREE.Vector3(DRAG.target[0] * 1000, DRAG.target[2] * 1000, -DRAG.target[1] * 1000);
  var d = b.clone().sub(a), L = Math.max(1, d.length());
  DRAG.arrow.position.copy(a); DRAG.arrow.setDirection(d.normalize()); DRAG.arrow.setLength(L, Math.min(20, L * 0.3), Math.min(10, L * 0.15));
  DRAG.arrow.visible = true;
}
function screenToWorldPlane(e, throughMm) {              // point under the cursor on a plane facing the camera
  var r = canvas.getBoundingClientRect();
  var v = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(v, camera);
  var n = camera.getWorldDirection(new THREE.Vector3());
  var plane = new THREE.Plane().setFromNormalAndCoplanarPoint(n, throughMm);
  var hit = new THREE.Vector3();
  return ray.ray.intersectPlane(plane, hit) ? hit : throughMm.clone();
}
function dragStart(e) {
  if (!PHYS.W || !document.getElementById("optDrag").checked) return false;
  var r = canvas.getBoundingClientRect();
  var v = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(v, camera);
  var hits = ray.intersectObjects(PARTS.filter(function (p) { return p.visible; }), true);
  if (!hits.length) return false;
  var obj = hits[0].object; while (obj && obj.userData.body == null) obj = obj.parent;
  if (!obj) return false;
  var body = PHYS.W.bodies[obj.userData.body];
  if (!body || body.fixed) { toast("that part is bolted to the table"); return false; }
  var hm = hits[0].point, world = [hm.x / 1000, -hm.z / 1000, hm.y / 1000];
  var q = body.q, inv = [-q[0], -q[1], -q[2], q[3]];
  DRAG.body = body; DRAG.local = KNEX.phys.qrot(inv, KNEX.V.sub(world, body.x));
  DRAG.target = world; DRAG.on = true; DRAG.hitMm = hm.clone();
  if (!PHYS.running) { PHYS.running = true; document.getElementById("physRun").textContent = "Pause"; }
  canvas.style.cursor = "grabbing";
  return true;
}
function dragMove(e) { if (!DRAG.on) return; var p = screenToWorldPlane(e, DRAG.hitMm); DRAG.target = [p.x / 1000, -p.z / 1000, p.y / 1000]; }
function dragEnd() { DRAG.on = false; DRAG.body = null; DRAG.N = 0; canvas.style.cursor = ""; if (DRAG.arrow) DRAG.arrow.visible = false; }
function toast(msg) {
  var el = document.getElementById("toast"); if (!el) return;
  el.textContent = msg; el.style.opacity = 1;
  clearTimeout(toast.t); toast.t = setTimeout(function () { el.style.opacity = 0; }, 2200);
}
</script>
