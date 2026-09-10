<script>
/* Build meshes from the solved model; step filter; hover/pick; fly-to. */
var PARTS = [], labelSprites = [];
function frameMatrix(K) {                      // model frame (e1, e2, n) at pos -> three matrix (z-up to y-up)
  var m = new THREE.Matrix4(), e1 = dirThree(K.e1), e2 = dirThree(K.e2), n = dirThree(K.n), p = toThree(K.pos);
  m.makeBasis(e1, e2, n); m.setPosition(p); return m;
}
function label(text, pos) {
  var cv = document.createElement("canvas"), ctx = cv.getContext("2d"); cv.width = 256; cv.height = 64;
  ctx.font = "700 34px Archivo, Arial"; ctx.fillStyle = cssVar("--surface"); ctx.globalAlpha = 0.85; ctx.fillRect(0, 0, cv.width, cv.height); ctx.globalAlpha = 1;
  ctx.fillStyle = cssVar("--ink"); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text, 128, 34);
  var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), depthTest: false, transparent: true }));
  sp.scale.set(44, 11, 1); sp.position.copy(pos).add(new THREE.Vector3(0, 14, 0)); return sp;
}
var BODYG = [], BEAMMESH = {};
var MODEL = null;
function bodyGroup(i) {                          // one group per rigid body, so the physics can move them
  if (BODYG[i]) return BODYG[i];
  var g = new THREE.Group();
  var c = MODEL.bodies && MODEL.bodies[i] ? MODEL.bodies[i].c : [0, 0, 0];
  g.position.copy(toThree(c)); g.userData = { body: i, rest: toThree(c), isBodyGroup: true };
  world.add(g); BODYG[i] = g; return g;
}
function place(mesh, bodyId) {                   // add a world-space mesh into its body group
  var g = bodyGroup(bodyId == null ? 0 : bodyId);
  mesh.position.sub(g.userData.rest); g.add(mesh); return mesh;
}
function rebuild(solved, refit) {
  MODEL = solved; window.MODEL = solved; while (world.children.length) world.remove(world.children[0]); PARTS = []; labelSprites = []; BODYG = []; BEAMMESH = {};
  var D = KNEX.DIMS;
  solved.conns.forEach(function (K) {
    var hex = KNEX.RGB[KNEX.KINDS[K.kind].color], g = new THREE.Mesh(connGeo(K.kind), mat(hex));
    g.applyMatrix4(frameMatrix(K)); g.userData = { type: "conn", ref: K, step: K.step, body: K.body }; place(g, K.body); PARTS.push(g);
    labelSprites.push(label(K.name, toThree(K.pos)));
    K.joints.forEach(function (j) {
      var col = j.type === "end" ? 0x1f8f52 : j.type === "side" ? 0xe8531a : 0x2563d9;
      var s = new THREE.Mesh(new THREE.SphereGeometry(j.type === "hole" ? 4.2 : 2.6, 12, 10), new THREE.MeshBasicMaterial({ color: col }));
      var R = solved.rods[j.rod], p;
      if (j.type === "end") p = toThree(K.pos).add(dirThree(K.e1).applyAxisAngle(dirThree(K.n), j.slot * Math.PI / 4).multiplyScalar(D.d));
      else p = toThree(R.p0).lerp(toThree(R.p1), j.t);
      s.position.copy(p); s.userData = { type: "joint", step: K.step, body: K.body }; place(s, K.body);
    });
  });
  solved.rods.forEach(function (R) {
    var hex = R.flexi ? KNEX.RGB.flexi : KNEX.RGB[R.color], m;
    var a = toThree(R.t0), b = toThree(R.t1);
    if (R.beam) {                                  // built straight; the physics reshapes it every frame
      m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(a, b), 12, D.rodD / 2, 7, false), mat(hex));
    } else if (R.flexi && (R.tan0 || R.tan1)) {
      var h = R.len * 0.36, ta = R.tan0 ? dirThree(R.tan0) : b.clone().sub(a).normalize(), tb = R.tan1 ? dirThree(R.tan1) : a.clone().sub(b).normalize();
      var curve = new THREE.CubicBezierCurve3(a, a.clone().addScaledVector(ta, h), b.clone().addScaledVector(tb, h), b);
      m = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, D.rodD / 2, 8, false), mat(hex));
      [[a, ta], [b, tb]].forEach(function (e) { var cap = new THREE.Mesh(new THREE.CylinderGeometry(D.rodEndD / 2, D.rodEndD / 2, 9, 12), mat(hex)); cap.position.copy(e[0]).addScaledVector(e[1], 4.5); cap.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), e[1]); m.add(cap); });
    } else {
      m = new THREE.Mesh(rodGeo(R.color, R.len, R.color !== "green"), mat(hex));
      m.position.copy(a).lerp(b, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    }
    m.userData = { type: "rod", ref: R, step: R.step, body: R.body };
    if (R.beam) { world.add(m); BEAMMESH[R.id] = { mesh: m, rod: R, hex: hex }; }   // deforms: lives in world space
    else place(m, R.body);
    PARTS.push(m);
  });
  solved.spacers.forEach(function (P) {
    var m = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, P.th, 16), mat(KNEX.RGB[P.size === "silver" ? "silver" : "spacer"]));
    m.position.copy(toThree(P.pos)); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirThree(P.n)); m.userData = { type: "spacer", step: P.step, body: P.body }; place(m, P.body);
  });
  solved.extras.forEach(function (X) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(X.size[0], X.size[2], X.size[1]), new THREE.MeshStandardMaterial({ color: new THREE.Color(X.color), transparent: true, opacity: 0.45, roughness: 0.7 }));
    m.position.copy(toThree(X.pos)); m.userData = { type: "prop", label: X.label, step: X.step, prop: true };
    var pid = (MODEL.bodies || []).filter(function (b) { return b.prop === X.label; })[0];
    m.userData.body = pid ? pid.id : null; place(m, m.userData.body); PARTS.push(m);
  });
  labelSprites.forEach(function (s) { s.userData = { type: "label" }; world.add(s); });
  (MODEL.loads || []).forEach(function (L) {                    // a cone where each external force acts
    var K = MODEL.conns.filter(function (c) { return c.name === L.at; })[0]; if (!K) return;
    var m = new THREE.Mesh(new THREE.ConeGeometry(6, 18, 10), new THREE.MeshBasicMaterial({ color: 0xE8531A }));
    m.position.copy(toThree(K.pos)).add(new THREE.Vector3(0, 16, 0));
    m.userData = { type: "load", label: L.name, step: K.step, body: K.body }; place(m, K.body); PARTS.push(m);
  });
  var box = new THREE.Box3().setFromObject(world);
  if (!box.isEmpty()) {
    var c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
    var span = Math.max(400, Math.max(sz.x, sz.z) * 2.2);          // a table that suits the model, not the horizon
    desk.scale.set(span / 2400, span / 2400, 1); desk.position.set(c.x, -0.4, c.z);
    grid.scale.set(span / 2400, 1, span / 2400); grid.position.set(c.x, 0.2, c.z);
    if (refit) { flyTo = null; CAM.target.copy(c); CAM.r = Math.max(260, box.getSize(new THREE.Vector3()).length() * 1.35); }
  }
  applyFilters();
}
function applyFilters() {
  var step = Number(document.getElementById("step").value), max = Number(document.getElementById("step").max), all = step >= max;
  var showJ = document.getElementById("optJoints").checked, showL = document.getElementById("optLabels").checked, showP = document.getElementById("optProps").checked;
  var items = [];                                   // NOT "all": that is the boolean above
  world.children.forEach(function (g) {                        // a body group holds parts; anything else IS a part
    if (g.userData && g.userData.isBodyGroup) items = items.concat(g.children); else items.push(g);
  });
  items.forEach(function (o) {
    var u = o.userData, vis = true;
    if (!u || !u.type) return;
    if (u.type === "joint") vis = showJ; if (u.type === "label") vis = showL; if (u.type === "prop") vis = showP;
    if (window.HIDEKIND) {
      if (HIDEKIND.indexOf("rods") >= 0 && u.type === "rod") vis = false;
      if (HIDEKIND.indexOf("conns") >= 0 && u.type === "conn") vis = false;
      if (HIDEKIND.indexOf("beams") >= 0 && u.type === "rod" && u.ref && u.ref.beam) vis = false;
    }
    if (!all && u.step != null && u.step > step - 1) vis = false;
    if (!all && u.step == null && step === 0) vis = false;
    o.visible = vis;
  });
}
var ray = new THREE.Raycaster(), hovered = null;
function pick(e, click) {
  var r = canvas.getBoundingClientRect(), v = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(v, camera); var hits = ray.intersectObjects(PARTS.filter(function (p) { return p.visible; }), true), tip = document.getElementById("tip");
  var obj = hits.length ? hits[0].object : null; while (obj && !obj.userData.type) obj = obj.parent;
  if (hovered && hovered !== obj) hovered.traverse(function (o) { if (o.isMesh && o.material.emissive) o.material = o.userData.m0 || o.material; });
  hovered = obj; if (!obj) { tip.textContent = ""; return; }
  var u = obj.userData;
  if (u.type === "conn") tip.textContent = u.ref.name + " · " + KNEX.KINDS[u.ref.kind].name + " · L" + u.ref.line + " · " + u.ref.joints.map(function (j) { return j.type + (j.slot != null ? "@" + j.slot : ""); }).join(" ") + (u.ref.pair ? " · 3D pair " + u.ref.pair : "");
  else if (u.type === "rod") tip.textContent = (u.ref.flexi ? "flexi " : "") + u.ref.color + " rod " + u.ref.len + " mm · L" + u.ref.line + (u.ref.bow ? " · bow " + u.ref.bow.toFixed(0) + " mm" : "") + " · " + u.ref.joints.map(function (j) { return j.conn + ":" + j.type; }).join(" ");
  else tip.textContent = u.label || u.type;
  if (click) { var b = new THREE.Box3().setFromObject(obj); flyTo = b.getCenter(new THREE.Vector3()); }
}
function focusLine(line) {
  var hit = PARTS.filter(function (p) { return p.userData.ref && p.userData.ref.line === line; })[0]; if (!hit) return;
  flyTo = new THREE.Box3().setFromObject(hit).getCenter(new THREE.Vector3()); CAM.r = Math.min(CAM.r, 260);
  hit.traverse(function (o) { if (o.isMesh) { o.userData.m0 = o.material; o.material = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: new THREE.Color(cssVar("--accent")), emissiveIntensity: 0.9 }); } });
  setTimeout(function () { hit.traverse(function (o) { if (o.isMesh && o.userData.m0) { o.material = o.userData.m0; o.userData.m0 = null; } }); }, 1800);
}
</script>
