<script>
/* three.js scene: connectors, rods, joints, props. Coordinates: model mm, z up -> three y up. */
var scene = new THREE.Scene(), canvas = document.getElementById("c");
var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
var camera = new THREE.PerspectiveCamera(38, 1, 5, 6000);
var CAM = { target: new THREE.Vector3(0, 40, 0), theta: 0.75, phi: 1.05, r: 620 };
function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
function applyTheme() {
  scene.background = new THREE.Color(cssVar("--scene"));
  if (grid) { grid.material.color = new THREE.Color(cssVar("--grid")); grid.material.opacity = 0.35; }
  if (typeof deskMat !== "undefined") deskMat.color = new THREE.Color(cssVar("--desk"));
}
scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8f86, 0.85));
var sun = new THREE.DirectionalLight(0xffffff, 0.75); sun.position.set(300, 500, 200); scene.add(sun);
var fill = new THREE.DirectionalLight(0xffffff, 0.25); fill.position.set(-300, 200, -300); scene.add(fill);
// the table: a real surface the model stands on, with a grid over it
var deskMat = new THREE.MeshStandardMaterial({ color: 0x6E7466, roughness: 0.95, metalness: 0 });
var desk = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), deskMat);
desk.rotation.x = -Math.PI / 2; desk.position.y = -0.4; scene.add(desk);
var grid = new THREE.GridHelper(2400, 64, 0x9aa08f, 0x9aa08f); grid.material.transparent = true; grid.material.opacity = 0.35; scene.add(grid);
var world = new THREE.Group(); scene.add(world);
function toThree(p) { return new THREE.Vector3(p[0], p[2], -p[1]); }
function dirThree(v) { return new THREE.Vector3(v[0], v[2], -v[1]); }
// --- orbit: drag rotates, wheel zooms, right/shift drag pans
(function orbit() {
  var down = null, spinning = false;
  canvas.addEventListener("pointerdown", function (e) {
    canvas.setPointerCapture(e.pointerId);
    if (e.button === 0 && !e.shiftKey && window.dragStart && dragStart(e)) { down = null; return; }   // grabbed a part
    down = { x: e.clientX, y: e.clientY, b: e.button, sh: e.shiftKey };
  });
  canvas.addEventListener("pointerup", function (e) {
    if (window.DRAG && DRAG.on) { dragEnd(); return; }
    if (down && Math.abs(e.clientX - down.x) < 3 && Math.abs(e.clientY - down.y) < 3) pick(e, true);
    down = null;
  });
  canvas.addEventListener("pointercancel", function () { if (window.DRAG && DRAG.on) dragEnd(); down = null; });
  canvas.addEventListener("pointermove", function (e) {
    if (window.DRAG && DRAG.on) { dragMove(e); return; }
    if (!down) { pick(e, false); return; }
    var dx = e.clientX - down.x, dy = e.clientY - down.y; down.x = e.clientX; down.y = e.clientY;
    if (down.b === 2 || down.sh) {
      var right = new THREE.Vector3(Math.cos(CAM.theta), 0, -Math.sin(CAM.theta)), up = new THREE.Vector3(0, 1, 0);
      CAM.target.addScaledVector(right, -dx * CAM.r * 0.0012).addScaledVector(up, dy * CAM.r * 0.0012);
    } else { CAM.theta -= dx * 0.006; CAM.phi = Math.max(0.05, Math.min(Math.PI - 0.05, CAM.phi - dy * 0.006)); }
  });
  canvas.addEventListener("wheel", function (e) { e.preventDefault(); CAM.r = Math.max(60, Math.min(4000, CAM.r * Math.exp(e.deltaY * 0.0012))); }, { passive: false });
  canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });
})();
function updateCamera() {
  camera.position.set(CAM.target.x + CAM.r * Math.sin(CAM.phi) * Math.sin(CAM.theta), CAM.target.y + CAM.r * Math.cos(CAM.phi), CAM.target.z + CAM.r * Math.sin(CAM.phi) * Math.cos(CAM.theta));
  camera.lookAt(CAM.target);
}
function resize() { var w = canvas.clientWidth, h = canvas.clientHeight; if (canvas.width !== w * renderer.getPixelRatio() || canvas.height !== h * renderer.getPixelRatio()) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); } }
var flyTo = null;
function animate() {
  requestAnimationFrame(animate); resize();
  if (document.getElementById("optSpin").checked) CAM.theta += 0.004;
  var now = performance.now();
  try { if (window.physStep) physStep(now - (animate.last || now)); } catch (e) { if (!animate.warned) { animate.warned = 1; console.error("physics loop stopped:", e); } }
  animate.last = now;
  if (flyTo) { CAM.target.lerp(flyTo, 0.12); if (CAM.target.distanceTo(flyTo) < 0.5) flyTo = null; }
  if (window.dragArrow) dragArrow();
  updateCamera();
  try { renderer.render(scene, camera); } catch (e) { if (!animate.rwarn) { animate.rwarn = 1; console.error("render:", e); } }
}
// --- materials (geometry lives in 03b_parts.js)
var MAT = {};
function mat(hex) { if (!MAT[hex]) MAT[hex] = new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), roughness: 0.5, metalness: 0.04 }); return MAT[hex]; }
</script>
