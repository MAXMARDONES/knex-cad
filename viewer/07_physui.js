<script>
/* Physics tab wiring: surface, run, reset, finger buttons. */
(function () {
  var run = document.getElementById("physRun");
  run.addEventListener("click", function () {
    if (!PHYS.W) physBuild();
    PHYS.running = !PHYS.running; run.textContent = PHYS.running ? "Pause" : "Run";
  });
  document.getElementById("physReset").addEventListener("click", physReset);
  document.getElementById("physSurface").addEventListener("change", function (e) { PHYS.surface = e.target.value; physReset(); });
  document.getElementById("physSpeed").addEventListener("input", function (e) { PHYS.speed = Number(e.target.value); document.getElementById("physSpeedVal").textContent = PHYS.speed.toFixed(2) + "x"; });
  window.physLoadButtons = function (loads) {
    var box = document.getElementById("physLoads");
    box.innerHTML = loads.length ? "" : "<div class='note'>This build has no F lines, so there is nothing to push. Add one: <code>F NODE 0,0,-3 finger</code></div>";
    loads.forEach(function (L) {
      var b = document.createElement("button"); b.className = "act"; b.textContent = L.name;
      b.addEventListener("mousedown", function () { PHYS.press[L.name] = 1; if (PHYS.W) PHYS.W.loads.forEach(function (x) { if (x.name === L.name) x.gain = 1; }); b.classList.add("primary"); });
      ["mouseup", "mouseleave"].forEach(function (ev) { b.addEventListener(ev, function () { PHYS.press[L.name] = 0; if (PHYS.W) PHYS.W.loads.forEach(function (x) { if (x.name === L.name) x.gain = 0; }); b.classList.remove("primary"); }); });
      box.appendChild(b);
    });
  };
  if (PHYS.solved) physLoadButtons(PHYS.solved.loads || []);
})();
</script>
