<script>
/* Push the model with the cursor: drag any part and a force is applied there, live.
   The grab point is tracked in the body's own frame, so it stays on the part as it moves. */
var GRABS = [];                                          // one per hand, plus the mouse: each pulls and twists
var DRAG = { on: false, body: null, local: null, target: null, force: [0, 0, 0], arrow: null, N: 0 };
var DRAG_K = 90;                                        // N per metre of pull; the cap keeps it sane
var DRAG_MAX = 25;
var TWIST_K = 0.5;                                       // N.m per radian of wrist twist
var TWIST_MAX = 0.35;
function grabsActive() { return GRABS.filter(function (g) { return g.body && !g.body.fixed; }); }
function dragInput() {
  var V = KNEX.V, P = KNEX.phys, loads = [];
  grabsActive().forEach(function (g) {
    g.grab = V.add(g.body.x, P.qrot(g.body.q, g.local));
    var pull = V.sub(g.target, g.grab), d = V.norm(pull);
    g.force = d > 1e-6 ? V.mul(pull, Math.min(DRAG_MAX, DRAG_K * d) / d) : [0, 0, 0];
    g.N = V.norm(g.force);
    var load = { body: g.body, at: g.grab, F: g.force, world: true, gain: 1 };
    if (g.twist) {                                       // a wrist roll about the view axis becomes a torque
      var ax = camera.getWorldDirection(new THREE.Vector3());
      var axis = [ax.x, -ax.z, ax.y];
      var m = Math.max(-TWIST_MAX, Math.min(TWIST_MAX, TWIST_K * g.twist));
      load.torque = V.mul(V.unit(axis), m);
      g.Nm = m;
    }
    loads.push(load);
  });
  DRAG.on = grabsActive().length > 0;
  DRAG.N = loads.reduce(function (u, l) { return u + KNEX.V.norm(l.F); }, 0);
  DRAG.grab = loads.length ? loads[0].at : null;
  if (window.PALM && PALM.length) loads = loads.concat(PALM);        // open palms push as well as pinches
  return loads.length ? { loads: loads } : {};
}
function grabAt(body, worldPoint, source) {
  var q = body.q, inv = [-q[0], -q[1], -q[2], q[3]];
  var g = { body: body, local: KNEX.phys.qrot(inv, KNEX.V.sub(worldPoint, body.x)), target: worldPoint,
            source: source || "mouse", twist: 0, N: 0 };
  GRABS = GRABS.filter(function (x) { return x.source !== g.source; }).concat([g]);
  return g;
}
function grabRelease(source) { GRABS = GRABS.filter(function (g) { return g.source !== (source || "mouse"); }); }
function pickBodyAt(clientX, clientY) {
  var r = canvas.getBoundingClientRect();
  var v = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(v, camera);
  var hits = ray.intersectObjects(PARTS.filter(function (p) { return p.visible; }), true);
  if (!hits.length) return null;
  var obj = hits[0].object; while (obj && obj.userData.body == null) obj = obj.parent;
  if (!obj || !PHYS.W) return null;
  return { body: PHYS.W.bodies[obj.userData.body], pointMm: hits[0].point };
}
function dragArrow() {
  if (!DRAG.arrow) {
    DRAG.arrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 1, 0xE8531A, 14, 8);
    DRAG.arrow.visible = false; scene.add(DRAG.arrow);
  }
  var g = grabsActive()[0];
  if (!g || !g.grab) { DRAG.arrow.visible = false; return; }
  DRAG.grab = g.grab; DRAG.target = g.target;
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
  var hit = pickBodyAt(e.clientX, e.clientY);
  if (!hit) return false;
  if (!hit.body || hit.body.fixed) { toast("that part is bolted to the table"); return false; }
  var hm = hit.pointMm, world = [hm.x / 1000, -hm.z / 1000, hm.y / 1000];
  grabAt(hit.body, world, "mouse");
  DRAG.hitMm = hm.clone(); DRAG.on = true;
  if (!PHYS.running) { PHYS.running = true; document.getElementById("physRun").textContent = "Pause"; }
  canvas.style.cursor = "grabbing";
  return true;
}
function dragMove(e) {
  var g = GRABS.filter(function (x) { return x.source === "mouse"; })[0];
  if (!g) return;
  var p = screenToWorldPlane(e, DRAG.hitMm);
  g.target = [p.x / 1000, -p.z / 1000, p.y / 1000];
}
function dragEnd() { grabRelease("mouse"); DRAG.on = grabsActive().length > 0; DRAG.N = 0; canvas.style.cursor = ""; if (DRAG.arrow) DRAG.arrow.visible = false; }
function toast(msg) {
  var el = document.getElementById("toast"); if (!el) return;
  el.textContent = msg; el.style.opacity = 1;
  clearTimeout(toast.t); toast.t = setTimeout(function () { el.style.opacity = 0; }, 2200);
}
</script>
