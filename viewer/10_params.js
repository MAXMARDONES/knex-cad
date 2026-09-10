<script>
/* URL parameters, so a screenshot can be asked for in one line:
   ?view=iso|front|back|left|right|top&step=N&stress=1&labels=1&hide=props,joints,rods&run=2.5&surface=... */
(function () {
  var q = {}; (location.search || "").replace(/^\?/, "").split("&").filter(Boolean).forEach(function (kv) {
    var p = kv.split("="); q[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || "1");
  });
  window.VIEWQ = q;
  var VIEWS = { iso: [0.75, 1.05], front: [0, 1.5708], back: [Math.PI, 1.5708], left: [-1.5708, 1.5708],
                right: [1.5708, 1.5708], top: [0.75, 0.02], iso2: [-0.9, 0.95], low: [0.6, 1.35] };
  window.applyViewParams = function () {
    if (q.shot) { document.body.classList.add("shot"); if (q.shot === "bare" || q.caption === "0") document.body.classList.add("bare"); }

    if (q.view && VIEWS[q.view]) { CAM.theta = VIEWS[q.view][0]; CAM.phi = VIEWS[q.view][1]; flyTo = null; }
    if (q.theta) CAM.theta = Number(q.theta);
    if (q.phi) CAM.phi = Number(q.phi);
    if (q.step != null && isFinite(Number(q.step))) {
      var el = document.getElementById("step"); el.value = q.step; stepLabel(null); applyFilters(); showStep(Number(q.step));
    }
    (q.hide || "").split(",").filter(Boolean).forEach(function (h) {
      var map = { props: "optProps", joints: "optJoints", labels: "optLabels" };
      if (map[h]) { document.getElementById(map[h]).checked = false; }
      if (h === "rods" || h === "conns" || h === "beams") window.HIDEKIND = (window.HIDEKIND || []).concat(h);
    });
    if (q.labels) document.getElementById("optLabels").checked = true;
    if (q.follow === "0") document.getElementById("optFollow").checked = false;
    if (q.surface) { PHYS.surface = q.surface; document.getElementById("physSurface").value = q.surface; physReset(); }
    if (q.stress) { document.getElementById("optStress").checked = true; STRESS.on = true; }
    applyFilters();
    if (q.run) {                                   // fast-forward the physics, then hold the frame
      physBuild(); var secs = Number(q.run), dt = PHYS.dt, n = Math.round(secs / dt);
      for (var i = 0; i < n; i++) KNEX.phys.step(PHYS.W, dt, {});
      physApply(); if (STRESS.on) stressApply(); physReadout();
    }
    fitAll();
    for (var i = 1; i <= 6; i++) setTimeout(function () {        // headless needs a few passes after layout settles
      renderer.setSize(canvas.clientWidth || 1200, canvas.clientHeight || 800, false);
      camera.aspect = (canvas.clientWidth || 1200) / (canvas.clientHeight || 800); camera.updateProjectionMatrix();
      fitAll(); updateCamera(); renderer.render(scene, camera);
      if (q.caption && q.caption !== "0") { var s2 = document.getElementById("stepInfo"); if (s2) s2.innerHTML = "<b>" + q.caption + "</b>"; }
      window.SHOT_READY = true;
    }, i * 120);
  };
  window.fitAll = function () {
    var box = new THREE.Box3().setFromObject(world);
    if (box.isEmpty()) return;
    CAM.target.copy(box.getCenter(new THREE.Vector3()));
    CAM.r = Math.max(260, box.getSize(new THREE.Vector3()).length() * (q.zoom ? Number(q.zoom) : (q.shot ? 1.05 : 1.35)));
  };
  var t = setInterval(function () { if (window.MODEL && window.applyViewParams) { clearInterval(t); applyViewParams(); } }, 30);
})();
</script>
